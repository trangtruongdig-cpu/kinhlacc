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
import { HuyetViService } from '../controllers/huyet-vi.controller';
import { CreateHuyetViDto, UpdateHuyetViDto } from '../models/huyet-vi.dto';
import { Public } from '../middlewares/auth/public.decorator';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('huyet-vi')
export class HuyetViRouter {
  constructor(private readonly service: HuyetViService) {}

  // Công khai: danh mục huyệt vị (tra cứu, không phải dữ liệu bệnh nhân) — giống /nhht/cong-thuc,
  // để PhuongHuyetNguDu.vue tự fetch được khi nhúng vào trang demo công khai (DemoKetQuaDoView).
  // Các route ghi (POST/PUT/DELETE) và :id BÊN DƯỚI vẫn yêu cầu đăng nhập như cũ.
  @Public()
  @Get()
  findAll(@Query('kinh_mach') kinhMachId?: string) {
    if (kinhMachId) {
      return this.service.findByKinhMach(parseInt(kinhMachId, 10));
    }
    return this.service.findAll();
  }

  // Phải đứng TRƯỚC @Get(':id').
  @Get('lite')
  findLite(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('idKinhMach') idKinhMach?: string,
  ) {
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
      idKinhMach:
        idKinhMach != null && idKinhMach !== '' ? Number(idKinhMach) : null,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreateHuyetViDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.idHuyet, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHuyetViDto,
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
