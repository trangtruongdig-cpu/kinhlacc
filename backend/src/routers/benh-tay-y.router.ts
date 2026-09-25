import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BenhTayYService } from '../controllers/benh-tay-y.controller';
import { CreateBenhTayYDto, UpdateBenhTayYDto } from '../models/benh-tay-y.dto';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('benh-tay-y')
export class BenhTayYRouter {
  constructor(private readonly service: BenhTayYService) {}

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
    @Query('idChungBenh') idChungBenh?: string,
    @Query('focusId') focusId?: string,
  ) {
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
      idChungBenh: idChungBenh != null && idChungBenh !== '' ? Number(idChungBenh) : null,
      focusId: focusId != null && focusId !== '' ? Number(focusId) : null,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreateBenhTayYDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBenhTayYDto,
  ) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
