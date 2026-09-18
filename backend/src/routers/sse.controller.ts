import { Controller, Sse, MessageEvent, Request } from '@nestjs/common';
import { Observable, merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseService, SlotEvent } from '../controllers/sse.service';

/**
 * Nhịp tim: 20 giây một lần.
 *
 * Phải NHỎ HƠN mọi mốc ngắt kết nối trên đường đi, nếu không đường dây chết mà không ai biết:
 *   - nginx `proxy_read_timeout 600s` (frontend/nginx.conf)
 *   - NAT/proxy của nhà mạng di động: thường cắt sau 30–60 giây im lặng ← mốc chặt nhất
 */
const HEARTBEAT_MS = 20_000;

@Controller('notifications')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  /**
   * Luồng realtime trạng thái vé khám.
   *
   * KHÔNG public: JwtAuthGuard toàn cục (app.module) vẫn chặn, token lấy từ header
   * Authorization HOẶC query ?token= (EventSource của trình duyệt không đặt được header).
   *
   * Phân tầng theo vai trò: bệnh nhân chỉ nhận phần vé công khai (giờ + trạng thái),
   * KHÔNG nhận staffMessage vì câu đó chứa họ tên bệnh nhân khác.
   */
  @Sse('sse')
  sse(@Request() req: any): Observable<MessageEvent> {
    const isStaff = req.user?.kind === 'staff';

    const events$ = this.sseService.getEventStream().pipe(
      map((evt: SlotEvent) => {
        // Bệnh nhân chỉ nhận phần công khai: cắt bỏ cả staffMessage lẫn staffSlot.
        const payload: SlotEvent = isStaff
          ? evt
          : { type: evt.type, slot: evt.slot, date: evt.date, seq: evt.seq };
        return {
          data: payload,
          // `id:` cho phép máy khách phát hiện mình bỏ lỡ sự kiện (số nhảy cóc → tải lại).
          id: evt.seq != null ? String(evt.seq) : undefined,
          // Ép trình duyệt thử lại sau 3s thay vì mặc định của từng hãng.
          retry: 3000,
        } as MessageEvent;
      }),
    );

    // Gói tin rỗng định kỳ, gửi dưới TÊN SỰ KIỆN riêng ('ping') nên không lọt vào `onmessage`
    // của máy khách — chỉ có tác dụng giữ đường dây sống và nuôi đồng hồ canh chết bên kia.
    const heartbeat$ = interval(HEARTBEAT_MS).pipe(
      map(() => ({ type: 'ping', data: { t: Date.now() } }) as MessageEvent),
    );

    return merge(events$, heartbeat$);
  }
}
