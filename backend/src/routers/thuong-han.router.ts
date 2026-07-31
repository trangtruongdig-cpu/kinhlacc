import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ThuongHanService } from '../controllers/thuong-han.controller';
import { Public } from '../middlewares/auth/public.decorator';
import type { ThuongHanBenhCo } from '../models/thuong-han-benh-co.model';

/** Thương Hàn Tạp Luận Bệnh — API đọc (lớp bóc, 6 kinh, và "định vị" bệnh cơ). */
@Controller('thuong-han')
export class ThuongHanRouter {
  constructor(private readonly service: ThuongHanService) {}

  @Public()
  @Get('lop')
  findLop() {
    return this.service.findLop();
  }

  @Public()
  @Get('luc-kinh')
  findLucKinh() {
    return this.service.findLucKinh();
  }

  /** Phủ sóng: mỗi kinh mấy thể bệnh, còn bao nhiêu chưa gắn giai đoạn. */
  @Get('tong-quan')
  tongQuan() {
    return this.service.tongQuan();
  }

  /** Thể bệnh/pháp trị ở một giai đoạn (kinh) + tạng phủ/khí tự suy. */
  @Get('dinh-vi')
  dinhVi(@Query('kinh') kinh: string) {
    return this.service.dinhViTheoKinh(kinh);
  }

  /** BỆNH CƠ tự suy toàn kho pháp trị + đối chiếu + ghi đè tay (Hybrid). */
  @Get('benh-co')
  benhCo() {
    return this.service.benhCo();
  }

  /** Bản đồ NÉN thể bệnh → Lục Kinh do engine suy (1 nguồn sự thật cho kết luận trang Kết Quả Đo). */
  @Get('the-kinh')
  theKinh() {
    return this.service.theKinhMap();
  }

  /** Chỉ mục thể bệnh theo Lục Kinh · Lục Khí · Tạng Phủ (cho vòng lý thuyết tương tác). CÔNG KHAI (tra cứu miễn phí). */
  @Public()
  @Get('chi-muc')
  chiMuc() {
    return this.service.chiMuc();
  }

  /** Bàn xoay biện chứng: lớp Bệnh Tây Y (con) + cầu bài thuốc + nhóm khoa + triệu chứng. CÔNG KHAI (tra cứu miễn phí). */
  @Public()
  @Get('bien-chung')
  bienChung() {
    return this.service.bienChung();
  }

  /** Ghi đè tay bệnh cơ 1 pháp trị (rỗng = xoá ghi đè). */
  @Put('benh-co/:id')
  saveOverride(@Param('id') id: string, @Body() body: Partial<ThuongHanBenhCo>) {
    return this.service.saveOverride(Number(id), body);
  }
}
