import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { VaiTroService } from '../controllers/vai-tro.controller';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import { CreateVaiTroDto, UpdateVaiTroDto } from '../models/vai-tro.dto';

@Controller('vai-tro')
@UseGuards(QuanTriGuard)
export class VaiTroRouter {
  constructor(private readonly service: VaiTroService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVaiTroDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVaiTroDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
