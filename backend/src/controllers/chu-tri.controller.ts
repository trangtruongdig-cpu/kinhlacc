import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChuTri } from '../models/chu-tri.model';
import { catalogKey, formatCatalogLabel } from '../utils/catalog-label.util';

@Controller('chu-tri')
export class ChuTriController {
  constructor(
    @InjectRepository(ChuTri)
    private repo: Repository<ChuTri>,
  ) {}

  @Get()
  async findAll() {
    return this.repo.find();
  }

  @Post()
  async create(@Body() body: Partial<ChuTri>) {
    const label = formatCatalogLabel(body.ten_chu_tri ?? '');
    if (!label) throw new BadRequestException('Tên chủ trị không được để trống');
    const key = catalogKey(label);
    const rows = await this.repo.find();
    const dup = rows.find((r) => catalogKey(r.ten_chu_tri) === key);
    if (dup) return dup;
    const item = this.repo.create({
      ten_chu_tri: label,
      ghi_chu: body.ghi_chu ?? '',
    });
    return this.repo.save(item);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<ChuTri>) {
    const idNum = parseInt(id, 10);
    const patch: Partial<ChuTri> = {};
    if (body.ten_chu_tri != null) {
      const label = formatCatalogLabel(body.ten_chu_tri);
      if (!label) throw new BadRequestException('Tên chủ trị không được để trống');
      const key = catalogKey(label);
      const rows = await this.repo.find();
      const dup = rows.find((r) => r.id !== idNum && catalogKey(r.ten_chu_tri) === key);
      if (dup) {
        throw new BadRequestException(`Đã có chủ trị trùng: «${dup.ten_chu_tri}»`);
      }
      patch.ten_chu_tri = label;
    }
    if (body.ghi_chu !== undefined) patch.ghi_chu = body.ghi_chu;
    if (Object.keys(patch).length) await this.repo.update(idNum, patch);
    return this.repo.findOneBy({ id: idNum });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.repo.delete(parseInt(id, 10));
    return { success: true };
  }
}
