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
} from '@nestjs/common';
import { PhacDoChuanService } from '../controllers/phac-do-chuan.controller';
import {
  CreatePhacDoChuanDto,
  UpdatePhacDoChuanDto,
} from '../models/phac-do-chuan.dto';

@Controller('phac-do-chuan')
export class PhacDoChuanRouter {
  constructor(private readonly service: PhacDoChuanService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('hieu_luc') hieuLuc?: string,
  ) {
    const withHieuLuc = hieuLuc === '1' || hieuLuc === 'true';
    return this.service.findOne(id, withHieuLuc);
  }

  @Post()
  async create(@Body() dto: CreatePhacDoChuanDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePhacDoChuanDto,
  ) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
