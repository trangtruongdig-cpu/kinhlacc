import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { KinhMachService } from '../controllers/kinh-mach.controller';
import { CreateKinhMachDto, UpdateKinhMachDto } from '../models/kinh-mach.dto';
import { Public } from '../middlewares/auth/public.decorator';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('kinh-mach')
export class KinhMachRouter {
  constructor(private readonly service: KinhMachService) {}

  // Đọc thuần, dữ liệu tham khảo (tên kinh + biểu hiện tắc nghẽn) — dùng ở nút "i" chi tiết kinh
  // mạch trên landing page công khai (khối Tóm Tắt Bát Cương, /"kết quả đo" demo), nên phải @Public().
  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreateKinhMachDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.idKinhMach, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKinhMachDto,
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
