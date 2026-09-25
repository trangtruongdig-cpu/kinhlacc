import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';

import { SuCoService } from '../controllers/su-co.controller';
import type { BaoSuCoDto } from '../models/su-co.dto';

/** Phần `req.user` mà JwtStrategy gắn vào — chỉ những trường bộ lọc này thật sự dùng. */
interface RequestCoNguoiDung extends Request {
  user?: {
    id?: string | number;
    kind?: string;
    role?: string;
    quanTri?: boolean;
  };
}

/** Không ghi nhận lỗi của chính tab sự cố — ghi lỗi của bộ ghi lỗi là mở vòng lặp. */
const BO_QUA_TIEN_TO = ['/su-co'];

/**
 * Ghi lại mọi lỗi 5xx của backend vào bảng sự cố, RỒI để Nest trả lời y như cũ.
 *
 * Kế thừa `BaseExceptionFilter` thay vì tự dựng phản hồi: định dạng thân lỗi hiện tại đang
 * được frontend đọc (màn đăng nhập phân biệt 401 "sai mật khẩu" với 502 "máy chủ sập" bằng
 * chính thân bài này). Một bộ lọc catch-all tự viết rất dễ làm lệch định dạng đó mà không ai
 * nhận ra cho tới khi có người không đăng nhập được.
 */
@Catch()
export class SuCoExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('SuCoFilter');

  constructor(
    private readonly suCoService: SuCoService,
    httpAdapterHost: HttpAdapterHost,
  ) {
    super(httpAdapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    // Việc ghi nhận chạy SONG SONG, không chặn đường trả lời: người dùng đang gặp lỗi rồi,
    // đừng bắt họ đợi thêm một lượt ghi DB nữa.
    try {
      this.ghiNhan(exception, host);
    } catch (e) {
      this.logger.warn(`Không ghi được sự cố: ${(e as Error)?.message}`);
    }

    super.catch(exception, host);
  }

  private ghiNhan(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') return;

    const req = host.switchToHttp().getRequest<RequestCoNguoiDung>();
    const url = req?.originalUrl || req?.url || '';
    if (BO_QUA_TIEN_TO.some((t) => url.startsWith(t))) return;

    const err = exception as {
      status?: number;
      statusCode?: number;
      message?: string;
      stack?: string;
      name?: string;
    };
    const status = Number(err?.status ?? err?.statusCode ?? 500);

    // 4xx là người dùng gửi sai (thiếu trường, hết phiên, không có quyền) — đó không phải lỗi
    // của phần mềm. Ghi hết vào đây thì bảng đầy tiếng ồn và cụm thật bị chìm.
    if (status < 500) return;

    const u = req.user;
    const vaiTro = !u
      ? 'khach'
      : u.kind === 'staff'
        ? u.quanTri
          ? 'quan_tri'
          : u.role || 'nhan_vien'
        : u.role === 'patient'
          ? 'benh_nhan'
          : 'khach';

    const tinHieu: BaoSuCoDto = {
      loai: 'loi_be',
      route: url,
      thongDiep: err?.message || String(exception),
      stack: err?.stack,
      maLoi: err?.name,
      httpStatus: status,
      // Lỗi 5xx ở một thao tác GHI nghĩa là việc người dùng đang làm KHÔNG xong.
      chanThaoTac: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        req.method || '',
      ),
      nguCanh: {
        method: req.method,
        query: req.query as Record<string, unknown>,
        body: req.body as unknown,
      },
    };

    void this.suCoService.ghiNhanNoiBo(tinHieu, {
      ipRutGon: null,
      vaiTro,
      nguoiDungHash: this.suCoService.bamNguoiDung(u?.id ?? null),
    });
  }
}
