import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../models/patient.model';
import { CreatePatientDto, UpdatePatientDto } from '../models/patient.dto';

export interface PaginatedPatients {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Postgres `date` column rejects empty strings; the create/edit form posts
// `''` for any optional field the user leaves blank. Convert blanks to null
// so the DB receives a valid value.
function normalizePatientDto<T extends Partial<CreatePatientDto>>(dto: T): T {
  const result: any = { ...dto };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string' && result[key].trim() === '') {
      result[key] = null;
    }
  }
  return result;
}

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>
  ) {}

  findAll(): Promise<Patient[]> {
    return this.patientRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedPatients> {
    const skip = (page - 1) * limit;

    const qb = this.patientRepository
      .createQueryBuilder('patient')
      .orderBy('patient.createdAt', 'DESC');

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      qb.andWhere(
        '(patient.fullName ILIKE :term OR patient.phone ILIKE :term OR patient.address ILIKE :term)',
        { term }
      );
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async findOne(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findOneBy({ id });
    if (!patient) {
      throw new NotFoundException(`Bệnh nhân #${id} không tồn tại`);
    }
    return patient;
  }

  create(dto: CreatePatientDto): Promise<Patient> {
    const patient = this.patientRepository.create(normalizePatientDto(dto));
    return this.patientRepository.save(patient);
  }

  async update(id: number, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);
    Object.assign(patient, normalizePatientDto(dto));
    return this.patientRepository.save(patient);
  }

  async updateFcmToken(id: number, fcmToken: string): Promise<Patient> {
    const patient = await this.findOne(id);
    patient.fcmToken = fcmToken;
    return this.patientRepository.save(patient);
  }

  async remove(id: number): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepository.remove(patient);
  }
}
