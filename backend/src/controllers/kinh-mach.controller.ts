import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KinhMach } from '../models/kinh-mach.model';
import { CreateKinhMachDto, UpdateKinhMachDto } from '../models/kinh-mach.dto';

@Injectable()
export class KinhMachService {
  constructor(
    @InjectRepository(KinhMach)
    private readonly repo: Repository<KinhMach>,
  ) {}

  findAll(): Promise<KinhMach[]> {
    return this.repo.find({ order: { idKinhMach: 'ASC' } });
  }

  async findOne(id: number): Promise<KinhMach> {
    const item = await this.repo.findOne({
      where: { idKinhMach: id },
      relations: ['huyetViList'],
    });
    if (!item) throw new NotFoundException(`Kinh mạch #${id} không tồn tại`);
    return item;
  }

  create(dto: CreateKinhMachDto): Promise<KinhMach> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateKinhMachDto): Promise<KinhMach> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
