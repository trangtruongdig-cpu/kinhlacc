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
  Request,
} from '@nestjs/common';
import { ExaminationsService } from '../controllers/examination.controller';
import { CreateExaminationDto, UpdateExaminationDto } from '../models/examination.dto';
import { ChanDoanLuu } from '../models/examination.model';
import { JwtAuthGuard } from '../middlewares/auth/jwt-auth.guard';

@Controller('examinations')
export class ExaminationsRouter {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Get()
  findAll() {
    return this.examinationsService.findAll();
  }

  @Post('fix-sequence')
  fixSequence() {
    return this.examinationsService.fixSequence();
  }

  @Post()
  async create(@Body() dto: CreateExaminationDto) {
    const item = await this.examinationsService.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExaminationDto
  ) {
    const item = await this.examinationsService.update(id, dto);
    return { success: true, id, data: item };
  }

  /** Lưu chẩn đoán cho ca khám (D5). Body: { chanDoan: {...} | null }. */
  @Put(':id/chan-doan')
  async saveChanDoan(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { chanDoan?: ChanDoanLuu | null },
  ) {
    const item = await this.examinationsService.saveChanDoan(id, body?.chanDoan ?? null);
    return { success: true, data: item.chanDoan };
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.examinationsService.findByPatient(patientId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-records')
  findMyRecords(@Request() req: any) {
    return this.examinationsService.findByPatient(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examinationsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.examinationsService.remove(id);
    return { success: true };
  }
}
