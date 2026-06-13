import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhacDoDieuTri } from '../models/phac-do-dieu-tri.model';
import { CreatePhacDoDieuTriDto, UpdatePhacDoDieuTriDto } from '../models/phac-do-dieu-tri.dto';

@Injectable()
export class PhacDoDieuTriService {
  constructor(
    @InjectRepository(PhacDoDieuTri)
    private readonly repo: Repository<PhacDoDieuTri>,
  ) {}

  findAll(): Promise<PhacDoDieuTri[]> {
    return this.repo.find({
      relations: ['benh', 'huyetVi', 'huyetVi.kinhMach'],
      order: { idPhacDo: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PhacDoDieuTri> {
    const item = await this.repo.findOne({
      where: { idPhacDo: id },
      relations: ['benh', 'huyetVi', 'huyetVi.kinhMach'],
    });
    if (!item) throw new NotFoundException(`Phác đồ #${id} không tồn tại`);
    return item;
  }

  async findByBenh(idBenh: number): Promise<PhacDoDieuTri[]> {
    return this.repo.find({
      where: { idBenh },
      relations: ['benh', 'huyetVi', 'huyetVi.kinhMach'],
      order: { idPhacDo: 'ASC' },
    });
  }

  create(dto: CreatePhacDoDieuTriDto): Promise<PhacDoDieuTri> {
    const entity = this.repo.create({
      idBenh: dto.id_benh,
      idHuyet: dto.id_huyet,
      vai_tro_huyet: dto.vai_tro_huyet,
      phuong_phap_tac_dong: dto.phuong_phap_tac_dong,
      ghi_chu_ky_thuat: dto.ghi_chu_ky_thuat,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdatePhacDoDieuTriDto): Promise<PhacDoDieuTri> {
    const item = await this.findOne(id);
    if (dto.id_benh !== undefined) item.idBenh = dto.id_benh;
    if (dto.id_huyet !== undefined) item.idHuyet = dto.id_huyet;
    if (dto.vai_tro_huyet !== undefined) item.vai_tro_huyet = dto.vai_tro_huyet;
    if (dto.phuong_phap_tac_dong !== undefined) item.phuong_phap_tac_dong = dto.phuong_phap_tac_dong;
    if (dto.ghi_chu_ky_thuat !== undefined) item.ghi_chu_ky_thuat = dto.ghi_chu_ky_thuat;
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
