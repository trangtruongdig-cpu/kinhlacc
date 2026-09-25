import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { MeridiansService, AnalyzeInputDto, AnalyzeOutputDto } from '../controllers/meridian.controller';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('meridian')
export class MeridiansRouter {
  constructor(private readonly meridiansService: MeridiansService) {}

  @UseGuards(NhanVienGuard)
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyze(@Body() body: AnalyzeInputDto): Promise<AnalyzeOutputDto> {
    return this.meridiansService.analyze(body);
  }
}
