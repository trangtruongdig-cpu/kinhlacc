import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ViThuocService } from '../controllers/vi-thuoc.controller';
import { CreateViThuocDto, UpdateViThuocDto } from '../models/dongy-thuoc.dto';

/** File ảnh multer (khai báo tối giản, khỏi thêm @types/multer). */
interface UploadedImage { buffer: Buffer; mimetype: string; originalname: string; size: number }

@Controller('vi-thuoc')
export class ViThuocRouter {
  constructor(private readonly service: ViThuocService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Phải đứng TRƯỚC @Get(':id') để route 'lite' không bị match như id.
  @Get('lite')
  findLite(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('idNhomNho') idNhomNho?: string,
    @Query('idNhomLon') idNhomLon?: string,
    @Query('sort') sort?: string,
  ) {
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
      idNhomNho: idNhomNho != null && idNhomNho !== '' ? Number(idNhomNho) : null,
      idNhomLon: idNhomLon != null && idNhomLon !== '' ? Number(idNhomLon) : null,
      sort: sort === 'ten' ? 'ten' : 'phobien',
    });
  }

  // Đếm số vị thuốc còn thiếu tên khoa học/Hán/pinyin/bộ phận dùng. (Phải đứng TRƯỚC @Get(':id').)
  @Get('thieu-ten-khoa-hoc/count')
  async countMissing() {
    const count = await this.service.countMissingTenKhoaHoc();
    return { success: true, data: { count } };
  }

  // AI điền tên khoa học cho 1 lô vị thiếu (con trỏ afterId). Frontend gọi lặp tới processed=0.
  @Post('ai-dien-ten-khoa-hoc')
  async aiDienTenKhoaHoc(@Body() body: { limit?: number; afterId?: number }) {
    const data = await this.service.aiFillTenKhoaHocBatch(body?.limit ?? 15, body?.afterId ?? 0);
    return { success: true, data };
  }

  // Tên khác của vị này có trùng vị thuốc khác trong kho không (nghi biến thể). Trước @Get(':id').
  @Get(':id/bien-the')
  async bienThe(@Param('id') id: string) {
    const data = await this.service.bienTheTenKhac(+id);
    return { success: true, data };
  }

  // Gộp vị trùng/biến thể `fromId` VÀO vị `:id` (giữ :id). body { fromId }
  @Post(':id/gop')
  async gop(@Param('id') id: string, @Body('fromId') fromId: number) {
    const data = await this.service.gop(+id, Number(fromId));
    return { success: true, data };
  }

  // ===== ẢNH DƯỢC LIỆU do người dùng upload =====
  // Upload 1 ảnh (multipart field "file") + tuỳ chọn giai_doan / mo_ta.
  @Post(':id/anh')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAnh(
    @Param('id') id: string,
    @UploadedFile() file: UploadedImage,
    @Body() body: { giai_doan?: string; mo_ta?: string },
  ) {
    const data = await this.service.uploadAnh(+id, file, { giai_doan: body?.giai_doan, mo_ta: body?.mo_ta });
    return { success: true, data };
  }

  @Get(':id/anh')
  async listAnh(@Param('id') id: string) {
    const data = await this.service.listAnh(+id);
    return { success: true, data };
  }

  @Delete('anh/:anhId')
  async deleteAnh(@Param('anhId') anhId: string) {
    return this.service.deleteAnh(+anhId);
  }

  // Đặt ảnh đại diện (avatar thẻ). body { url } — url rỗng để gỡ.
  @Put(':id/anh-dai-dien')
  async setAnhDaiDien(@Param('id') id: string, @Body('url') url: string) {
    const data = await this.service.setAnhDaiDien(+id, url ?? null);
    return { success: true, data };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateViThuocDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateViThuocDto) {
    const item = await this.service.update(+id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { success: true };
  }
}
