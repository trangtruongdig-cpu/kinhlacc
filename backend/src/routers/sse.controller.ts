import { Controller, Sse, MessageEvent, Request } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseService, SlotEvent } from '../controllers/sse.service';

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
    return this.sseService.getEventStream().pipe(
      map((evt: SlotEvent) => {
        const payload: SlotEvent = isStaff
          ? evt
          : { type: evt.type, slot: evt.slot };
        return { data: payload } as MessageEvent;
      }),
    );
  }
}
