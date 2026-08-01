import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { DiaDiemService } from '../controllers/dia-diem.controller';
import { DiaDiemDto } from '../models/dia-diem.dto';

@Controller('dia-diem')
export class DiaDiemRouter {
  constructor(private readonly diaDiemService: DiaDiemService) {}

  /** GET /dia-diem/tra-cuu?lat=..&lon=.. — tỉnh/xã + nhiệt độ môi trường tại điểm đo. */
  @Get('tra-cuu')
  traCuu(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ): Promise<DiaDiemDto> {
    const viDo = Number(lat);
    const kinhDo = Number(lon);
    if (!Number.isFinite(viDo) || viDo < -90 || viDo > 90) {
      throw new BadRequestException('Vĩ độ (lat) không hợp lệ');
    }
    if (!Number.isFinite(kinhDo) || kinhDo < -180 || kinhDo > 180) {
      throw new BadRequestException('Kinh độ (lon) không hợp lệ');
    }
    return this.diaDiemService.traCuu(viDo, kinhDo);
  }
}
