import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Examination } from '../models/examination.model';
import { MeridianSyndrome } from '../models/meridian-syndrome.model';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';
import { assertStaffOrOwner, RequestDaXacThuc } from '../middlewares/auth/access.util';

@Controller('records')
export class RecordsRouter {
  constructor(
    @InjectRepository(Examination)
    private readonly examRepo: Repository<Examination>,
    @InjectRepository(MeridianSyndrome)
    private readonly syndromeRepo: Repository<MeridianSyndrome>,
  ) {}

  private async getExam(id: number): Promise<Examination> {
    const exam = await this.examRepo.findOneBy({ id });
    if (!exam) throw new NotFoundException(`Phiếu đo #${id} không tồn tại`);
    return exam;
  }

  // Bệnh nhân xem được thể bệnh trên phiếu đo CỦA CHÍNH MÌNH; nhân viên xem phiếu bất kỳ.
  @Get(':id/models')
  async getSelectedModels(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestDaXacThuc,
  ) {
    const exam = await this.getExam(id);
    assertStaffOrOwner(req.user, exam.patientId);
    const ids = exam.selectedModelIds || [];
    if (!ids.length) return [];
    const syndromes = await this.syndromeRepo.find({ where: { id: In(ids) } });
    return syndromes.map((s) => ({
      modelId: s.id,
      ten: s.tieuket || '',
      trieuchung: s.trieuchung || '',
      phaptri: '',
      phuonghuyet: s.phuyet_chamcuu || '',
    }));
  }

  @UseGuards(NhanVienGuard)
  @Post(':id/models')
  async addModel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { modelId: number },
  ) {
    const exam = await this.getExam(id);
    const ids = exam.selectedModelIds || [];
    const mid = Number(body.modelId);
    if (!ids.includes(mid)) {
      ids.push(mid);
      exam.selectedModelIds = ids;
      await this.examRepo.save(exam);
    }
    return { success: true, modelId: mid };
  }

  @UseGuards(NhanVienGuard)
  @Delete(':id/models/:modelId')
  async removeModel(
    @Param('id', ParseIntPipe) id: number,
    @Param('modelId', ParseIntPipe) modelId: number,
  ) {
    const exam = await this.getExam(id);
    exam.selectedModelIds = (exam.selectedModelIds || []).filter(
      (m) => m !== modelId,
    );
    await this.examRepo.save(exam);
    return { success: true };
  }
}
