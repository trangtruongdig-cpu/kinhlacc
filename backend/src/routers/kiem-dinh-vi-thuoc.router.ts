import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { KiemDinhViThuocService } from '../controllers/kiem-dinh-vi-thuoc.controller';
import { DuplicateClusterInput } from '../controllers/ai-suggest.controller';
import { JwtAuthGuard } from '../middlewares/auth/jwt-auth.guard';

@Controller('kiem-dinh-vi-thuoc')
@UseGuards(JwtAuthGuard)
export class KiemDinhViThuocRouter {
  constructor(private readonly service: KiemDinhViThuocService) {}

  /** Phát hiện các cụm vị thuốc nghi trùng (tất định, không AI). */
  @Get('duplicates')
  async duplicates() {
    return { success: true, data: await this.service.detectDuplicates() };
  }

  /** AI xác nhận từng cụm nghi trùng có đúng là cùng một vị thuốc không. */
  @Post('duplicates/ai-confirm')
  async aiConfirm(@Body() body: { clusters?: DuplicateClusterInput[] }) {
    const data = await this.service.confirmDuplicates(body?.clusters ?? []);
    return { success: true, data };
  }

  /** Gộp các vị biến thể vào một vị chuẩn (transaction, có duyệt từ frontend). */
  @Post('merge')
  async merge(@Body() body: { keepId?: number; mergeIds?: number[] }) {
    const data = await this.service.merge(
      Number(body?.keepId),
      body?.mergeIds ?? [],
    );
    return { success: true, data };
  }

  /** Rà soát tất định: vị thuốc thiếu nhóm / tác dụng / kiêng kỵ / tính-vị. */
  @Get('issues')
  async issues() {
    return { success: true, data: await this.service.listIssues() };
  }

  /** Đối chiếu nhóm dược hiện tại vs nhóm AI gợi ý (lô tối đa 60 vị). */
  @Post('check-nhom')
  async checkNhom(@Body() body: { ids?: number[] }) {
    const data = await this.service.checkNhom(body?.ids ?? []);
    return { success: true, data };
  }
}
