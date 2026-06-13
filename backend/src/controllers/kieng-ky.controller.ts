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
import { KiengKy } from '../models/kieng-ky.model';
import { catalogKey, formatCatalogLabel } from '../utils/catalog-label.util';

@Controller('kieng-ky')
export class KiengKyController {
  constructor(
    @InjectRepository(KiengKy)
    private repo: Repository<KiengKy>,
  ) {}

  @Get()
  async findAll() {
    return this.repo.find();
  }

  @Post()
  async create(@Body() body: Partial<KiengKy>) {
    const label = formatCatalogLabel(body.ten_kieng_ky ?? '');
    if (!label) throw new BadRequestException('Tên kiêng kỵ không được để trống');
    const key = catalogKey(label);
    const rows = await this.repo.find();
    const dup = rows.find((r) => catalogKey(r.ten_kieng_ky) === key);
    if (dup) return dup;
    const item = this.repo.create({
      ten_kieng_ky: label,
      ghi_chu: body.ghi_chu ?? '',
    });
    return this.repo.save(item);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<KiengKy>) {
    const idNum = parseInt(id, 10);
    const patch: Partial<KiengKy> = {};
    if (body.ten_kieng_ky != null) {
      const label = formatCatalogLabel(body.ten_kieng_ky);
      if (!label) throw new BadRequestException('Tên kiêng kỵ không được để trống');
      const key = catalogKey(label);
      const rows = await this.repo.find();
      const dup = rows.find((r) => r.id !== idNum && catalogKey(r.ten_kieng_ky) === key);
      if (dup) {
        throw new BadRequestException(`Đã có kiêng kỵ trùng: «${dup.ten_kieng_ky}»`);
      }
      patch.ten_kieng_ky = label;
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
