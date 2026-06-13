import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NguoiDungService } from '../controllers/nguoi-dung.controller';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import {
  CreateNguoiDungDto,
  UpdateNguoiDungDto,
  DoiMatKhauDto,
} from '../models/vai-tro.dto';

@Controller('nguoi-dung')
@UseGuards(QuanTriGuard)
export class NguoiDungRouter {
  constructor(private readonly service: NguoiDungService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateNguoiDungDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNguoiDungDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Put(':id/mat-khau')
  doiMatKhau(@Param('id') id: string, @Body() dto: DoiMatKhauDto) {
    return this.service.doiMatKhau(id, dto?.password);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
