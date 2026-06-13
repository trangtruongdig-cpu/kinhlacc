import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe, Request, BadRequestException, UseGuards } from '@nestjs/common';
import { ChanDoanLuoiService } from '../controllers/chan-doan-luoi.controller';
import { CreateChanDoanLuoiDto, UpdateChanDoanLuoiDto } from '../models/chan-doan-luoi.dto';
import { JwtAuthGuard } from '../middlewares/auth/jwt-auth.guard';

@Controller('chan-doan-luoi')
@UseGuards(JwtAuthGuard)
export class ChanDoanLuoiRouter {
  constructor(private readonly service: ChanDoanLuoiService) {}

  @Get()
  findAll(
    @Query('id_benh_nhan') idBenhNhan?: string,
    @Query('limit') limit?: string,
  ) {
    if (idBenhNhan) return this.service.findByBenhNhan(parseInt(idBenhNhan, 10));
    return this.service.findAll(limit ? parseInt(limit, 10) : 50);
  }

  @Post('ml-search')
  async mlSearch(@Body() body: { image?: string }) {
    if (!body.image) throw new BadRequestException('Thiếu dữ liệu ảnh (field: image)');
    return this.service.mlSearch(body.image);
  }

  @Post('analyze-image')
  async analyzeImage(@Body() body: { image?: string }) {
    if (!body.image) throw new BadRequestException('Thiếu dữ liệu ảnh (field: image)');
    return this.service.analyzeImage(body.image);
  }

  @Post('label-image')
  async labelImage(@Body() body: { image?: string; classId?: string; classVi?: string }) {
    if (!body.image) throw new BadRequestException('Thiếu ảnh (field: image)');
    if (!body.classId) throw new BadRequestException('Thiếu nhãn (field: classId)');
    return this.service.labelImage(body.classId, body.classVi || body.classId, body.image);
  }

  @Post('rebuild-embeddings')
  async rebuildEmbeddings() {
    return this.service.rebuildEmbeddings();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const item = await this.service.findOne(id);
    if (!item) return { success: false, message: 'Không tìm thấy' };
    return { success: true, data: item };
  }

  @Post()
  async create(@Body() dto: CreateChanDoanLuoiDto, @Request() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? null;
    const item = await this.service.create(dto, userId);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChanDoanLuoiDto) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
