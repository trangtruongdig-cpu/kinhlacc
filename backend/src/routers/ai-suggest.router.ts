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
}
