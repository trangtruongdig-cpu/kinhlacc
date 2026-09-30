import { All, Controller, Logger, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { McpService } from '../controllers/mcp.controller';
import { Public } from '../middlewares/auth/public.decorator';

// SDK phát hành dạng ESM+CJS kép; `require` là đường duy nhất chạy được dưới CJS của repo này.
// (Đã đo: `import` tĩnh biên dịch ra `require` rồi chết ở `exports` map — SWC không đổi được.)
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment */
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const {
  StreamableHTTPServerTransport,
} = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment */

/** Một khối chữ — dạng trả về duy nhất mà mọi công cụ ở đây dùng. */
const chu = (s: string) => ({ content: [{ type: 'text' as const, text: s }] });

/**
 * Cửa MCP cho claude.ai — nói chuyện với bot thẩm định từ điện thoại.
 *
 * ⚠️ BA ĐIỀU PHẢI BIẾT TRƯỚC KHI SỬA:
 *
 * 1. **KHÔNG TRẠNG THÁI (stateless).** Mỗi request dựng `McpServer` + transport mới rồi đóng.
 *    Cố ý: `sessionIdGenerator: undefined`. Bản có phiên phải giữ transport trong Map theo
 *    `mcp-session-id`, và Map đó chỉ đúng khi chạy MỘT container — cùng lý lẽ với `@Cron`
 *    và `sse.service`. Không trạng thái thì thêm container thứ hai cũng không hỏng.
 *
 * 2. **Body đã bị NestJS ăn mất.** `transport.handleRequest` mặc định tự đọc luồng, nhưng
 *    `express.json()` của Nest đã đọc xong — luồng rỗng, request treo tới khi claude.ai bỏ
 *    cuộc. Phải truyền `req.body` vào tham số thứ ba.
 *
 * 3. **`@Public()` là bắt buộc, và token trong đường dẫn là thứ CHỊU LỰC.** `JwtAuthGuard`
 *    là APP_GUARD toàn cục nên không có `@Public()` thì claude.ai ăn 401 ngay; đổi lại,
 *    `MCP_TOKEN` là hàng rào DUY NHẤT. Thiếu biến thì cửa ĐÓNG (404), không mở toang.
 */
@Controller('mcp')
export class McpRouter {
  private readonly logger = new Logger('McpRouter');

  constructor(private readonly mcp: McpService) {}

  @Public()
  @All(':token')
  async xuLy(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.mcp.kiemToken(token)) {
      // 404 chứ không 401: đường dẫn sai và token sai trông giống nhau từ ngoài, nên
      // người dò không biết mình đã tìm đúng đường.
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (req.method !== 'POST') {
      // Bản không trạng thái không có luồng SSE để mở, cũng không có phiên để xoá.
      res.status(405).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Chỉ nhận POST (Streamable HTTP không trạng thái)' },
        id: null,
      });
      return;
    }

    const server = this.dungServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on('close', () => {
      void transport.close?.();
      void server.close?.();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e: unknown) {
      this.logger.error(`MCP chết: ${(e as Error)?.message || String(e)}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Lỗi nội bộ' },
          id: null,
        });
      }
    }
  }

  /**
   * Sáu công cụ, TẤT CẢ chỉ đọc hoặc chạy ca. Không có công cụ nào ghi vào kho nội dung —
   * xem ghi chú ranh giới ở `McpService`.
   */
  private dungServer(): {
    connect: (t: unknown) => Promise<void>;
    close?: () => Promise<void>;
  } {
    const server = new McpServer({ name: 'kinhlac-bot-tham-dinh', version: '1.0.0' });

    // Bọc mọi công cụ: một lỗi ném ra giữa đường làm claude.ai thấy "công cụ hỏng" mà
    // không biết vì sao. Trả lời được câu "vì sao" thì còn sai được cũng đỡ.
    const dangKy = (
      ten: string,
      moTa: string,
      luocDo: Record<string, z.ZodTypeAny>,
      lam: (a: Record<string, unknown>) => Promise<string>,
    ) => {
      server.registerTool(
        ten,
        { description: moTa, inputSchema: luocDo },
        async (a: Record<string, unknown>) => {
          try {
            return chu(await lam(a ?? {}));
          } catch (e: unknown) {
            const m = (e as Error)?.message || String(e);
            this.logger.warn(`công cụ ${ten} lỗi: ${m}`);
            return chu(`Không làm được: ${m}`);
          }
        },
      );
    };

    dangKy(
      'nhat_ky_bot',
      'Bot thẩm định thư viện đã làm gì gần đây: các ca quét, số lời phê chờ duyệt, số đã áp vào kho, trạng thái bộ luật văn phong.',
      {},
      () => this.mcp.nhatKyBot(),
    );

    dangKy(
      'loi_phe_cho_duyet',
      'Danh sách lời phê của lớp thầy thuốc đang chờ người duyệt, kèm trích dẫn nguyên văn và bản sửa đề xuất.',
      { so_luong: z.number().int().min(1).max(30).default(10).describe('Số lời phê muốn xem') },
      (a) => this.mcp.loiPheChoDuyet(Number(a.so_luong) || 10),
    );

    dangKy(
      'nhom_loi_phan_mem',
      'Các cụm lỗi phần mềm đang mở trong tab Góp Ý & Lỗi, GOM THEO NGUYÊN NHÂN (mạng, hết giờ, hết slot Postgres, thiếu cấu hình, tiếng ồn trình duyệt...). Dùng cái này trước khi xem từng cụm.',
      {},
      () => this.mcp.nhomLoiPhanMem(),
    );

    dangKy(
      'ho_so_loi',
      'Hồ sơ sửa lỗi đầy đủ của MỘT cụm sự cố: stack, file liên quan, số lần, biểu đồ theo giờ. Lấy id cụm từ nhom_loi_phan_mem.',
      { id: z.number().int().positive().describe('Id cụm sự cố') },
      (a) => this.mcp.hoSoLoi(Number(a.id)),
    );

    dangKy(
      'chay_quet',
      'Khởi động ca quét máy (lớp 1) trên cả kho 18.416 mục. Chạy nền vài phút, không tốn tiền mô hình. Hỏi lại bằng nhat_ky_bot để xem kết quả.',
      {},
      () => this.mcp.chayQuet(),
    );

    dangKy(
      'thu_tu_sua',
      'Chạy THỬ việc tự sửa lỗi hình thức (dấu câu, khoảng trắng) — báo sẽ sửa gì, KHÔNG ghi vào kho. Muốn ghi thật thì mở /app/tham-dinh trên web.',
      {
        gioi_han: z.number().int().min(10).max(500).default(100).describe('Số nhận xét đem xét'),
      },
      (a) => this.mcp.thuTuSua(Number(a.gioi_han) || 100),
    );

    return server as never;
  }
}
