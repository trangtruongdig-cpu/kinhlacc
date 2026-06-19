import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  AiSuggestService,
  ClassifyViThuocInput,
} from '../controllers/ai-suggest.controller';
import { JwtAuthGuard } from '../middlewares/auth/jwt-auth.guard';

@Controller('ai-suggest')
@UseGuards(JwtAuthGuard)
export class AiSuggestRouter {
  constructor(private readonly service: AiSuggestService) {}

  @Post('vi-thuoc')
  async suggestViThuoc(@Body() body: { ten_vi_thuoc?: string }) {
    const data = await this.service.suggestViThuoc(body?.ten_vi_thuoc ?? '');
    return { success: true, data };
  }

  @Post('huyet')
  async suggestHuyet(
    @Body() body: { ten_huyet?: string; ma_huyet?: string; kinh_mach?: string },
  ) {
    const data = await this.service.suggestHuyet({
      ten_huyet: body?.ten_huyet ?? '',
      ma_huyet: body?.ma_huyet,
      kinh_mach: body?.kinh_mach,
    });
    return { success: true, data };
  }

  @Post('classify-vi-thuoc')
  async classifyViThuoc(@Body() body: ClassifyViThuocInput) {
    const data = await this.service.classifyViThuoc(body);
    return { success: true, data };
  }

  /** Gợi ý NHÓM cho danh sách triệu chứng (frontend gửi {id, ten_trieu_chung}). */
  @Post('trieu-chung-nhom')
  async classifyTrieuChungNhom(@Body() body: { items?: { id: number; ten_trieu_chung: string }[] }) {
    const data = await this.service.classifyTrieuChungNhom(body?.items ?? []);
    return { success: true, data };
  }

  /** Gợi ý PHÁP TRỊ cho thể đo (đồng bộ). Frontend gửi {items:[{id, name}]}. */
  @Post('the-do-phap-tri')
  async suggestPhapTriForTheDo(@Body() body: { items?: { id: number; name: string }[] }) {
    const data = await this.service.suggestPhapTriForTheDo(body?.items ?? []);
    return { success: true, data };
  }

  /** Gợi ý điền NGUYÊN NHÂN + TRIỆU CHỨNG cho một thể bệnh (pháp trị) theo tên thể. */
  @Post('the-benh')
  async suggestTheBenh(@Body() body: { the_benh?: string; ten?: string }) {
    const data = await this.service.suggestTheBenh(body?.the_benh ?? body?.ten ?? '');
    return { success: true, data };
  }

  /** Tách văn bản PHƯƠNG HUYỆT thành huyệt có cấu trúc (khớp danh mục huyet_vi + Bổ/Tả). */
  @Post('phuong-huyet')
  async parsePhuongHuyet(@Body() body: { text?: string; phuyet_chamcuu?: string }) {
    const data = await this.service.parsePhuongHuyet(body?.text ?? body?.phuyet_chamcuu ?? '');
    return { success: true, data };
  }
}
