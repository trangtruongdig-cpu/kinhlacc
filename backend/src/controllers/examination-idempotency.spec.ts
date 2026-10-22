import { ExaminationsService } from './examination.controller';
import { Examination } from '../models/examination.model';
import { MeridianMeasurement } from '../models/meridian-measurement.model';
import { ThaoTacGhi } from '../models/thao-tac-ghi.model';
import { CreateExaminationDto } from '../models/examination.dto';

/**
 * KHOÁ CHỐNG LẶP CHO PHIẾU ĐO — cùng lý lẽ với `appointment-idempotency.spec.ts`, nhưng đây là
 * chỗ đắt hơn: vé đặt trùng thì nhìn lịch là thấy, còn phiếu đo trùng nằm im trong hồ sơ bệnh
 * nhân và làm lệch tính năng Truyền Biến 2 Lần Đo.
 *
 * Đo thật trên DB production (22/10/2026): 7 phiếu thừa của 3 bệnh nhân, cùng 24 số đo và CÙNG
 * `thoiDiemKham` (tức cùng MỘT lần điền phiếu), `createdAt` cách nhau 11,8s · 24,9s · 28,5s ·
 * 221,6s — đúng nhịp người đọc "Lỗi khi lưu phiếu đo" rồi bấm lại.
 */

const SO_DO_24: Record<string, number> = {
  tieutruongtrai: 10, tieutruongphai: 11, tamtrai: 12, tamphai: 13,
  tamtieutrai: 14, tamtieuphai: 15, tambaotrai: 16, tambaophai: 17,
  daitrangtrai: 18, daitrangphai: 19, phetrai: 20, phephai: 21,
  bangquangtrai: 22, bangquangphai: 23, thantrai: 24, thanphai: 25,
  damtrai: 26, damphai: 27, vitrai: 28, viphai: 29,
  cantrai: 30, canphai: 31, tytrai: 32, typhai: 33,
};

function dtoGia(p: Partial<CreateExaminationDto> = {}): CreateExaminationDto {
  return { patientId: 5741, notes: 'Triệu chứng: \nXét nghiệm: ', ...SO_DO_24, ...p } as CreateExaminationDto;
}

function dungService(opts: { luuHong?: boolean } = {}) {
  const soKhoa = new Map<string, { khoa: string; route: string; ketQua: unknown }>();
  const khoaTrongGd: string[] = [];
  const daTao: Examination[] = [];
  const soDoDaGhi = new Map<number, unknown>();
  let idTiep = 9000;

  const manager = {
    findOneBy: jest.fn(async (entity: unknown, where: any) => {
      if (entity === MeridianMeasurement) return soDoDaGhi.get(where.examinationId) ?? null;
      return null;
    }),
    save: jest.fn(async (entity: unknown, data: any) => {
      if (entity === Examination) {
        if (opts.luuHong) throw Object.assign(new Error('mất kết nối'), { code: '08006' });
        const row = { ...data, id: data.id ?? idTiep++, createdAt: new Date() };
        daTao.push(row);
        return row;
      }
      if (entity === MeridianMeasurement) {
        soDoDaGhi.set(data.examinationId, data);
        return data;
      }
      return data;
    }),
    insert: jest.fn(async (entity: unknown, data: any) => {
      if (entity === ThaoTacGhi) {
        if (soKhoa.has(data.khoa)) {
          throw Object.assign(new Error('duplicate key value violates unique constraint'), {
            code: '23505',
          });
        }
        soKhoa.set(data.khoa, { ...data, ketQua: null });
        khoaTrongGd.push(data.khoa);
      }
      return { identifiers: [] };
    }),
    update: jest.fn(async (entity: unknown, where: any, data: any) => {
      if (entity === ThaoTacGhi && soKhoa.has(where.khoa)) soKhoa.get(where.khoa)!.ketQua = data.ketQua;
      return { affected: 1 };
    }),
  };

  // Mô phỏng ĐÚNG giao dịch: rollback phải NHẢ khoá, không thì một lần ghi hỏng sẽ nuốt luôn
  // lần bấm lại thật sự của người dùng.
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(async () => { khoaTrongGd.length = 0; }),
    rollbackTransaction: jest.fn(async () => {
      for (const k of khoaTrongGd) soKhoa.delete(k);
      khoaTrongGd.length = 0;
    }),
    release: jest.fn(),
    manager,
  };

  const service = new ExaminationsService(
    { create: jest.fn((d: any) => ({ ...d })) } as any, // examinationRepository
    {} as any, // meridianMeasurementRepository
    {} as any, // diagnosisRepository
    {
      analyze: jest.fn(async () => ({
        am_duong: 'Dương thịnh', khi: 'Khí hư', huyet: 'Huyết hư', hu_thuc: 'Thực',
        flags: {}, syndromes: [], currentSyndromes: [], legacySyndromes: [],
        excelSyndromes: [], modernSyndromes: [], comparisonRows: [],
      })),
    } as any, // meridiansService
    { findOne: jest.fn(async () => ({ id: 5741, fullName: 'Bệnh nhân thử' })) } as any, // patientsService
    { createQueryRunner: () => queryRunner } as any, // dataSource
    { findOneBy: jest.fn(async ({ khoa }: any) => soKhoa.get(khoa) ?? null) } as any, // thaoTacRepo
  );
  return { service, daTao, soKhoa, soDoDaGhi };
}

describe('POST /examinations — bấm lại khi mạng chập KHÔNG được tạo phiếu đo thứ hai', () => {
  it('cùng một khoá gọi hai lần → chỉ GHI một phiếu, lần hai trả lại phiếu cũ', async () => {
    const { service, daTao } = dungService();
    const lan1 = await service.create(dtoGia(), 'khoa-abc');
    const lan2 = await service.create(dtoGia(), 'khoa-abc');

    expect(daTao).toHaveLength(1);
    expect(lan2.id).toBe(lan1.id);
  });

  it('khoá KHÁC nhau → vẫn ghi hai phiếu (đo lại thật không bị chặn nhầm)', async () => {
    const { service, daTao } = dungService();
    await service.create(dtoGia(), 'khoa-1');
    await service.create(dtoGia(), 'khoa-2');
    expect(daTao).toHaveLength(2);
  });

  it('không gửi khoá → đường cũ vẫn ghi được (máy khách cũ không gãy)', async () => {
    const { service, daTao } = dungService();
    const exam = await service.create(dtoGia());
    expect(daTao).toHaveLength(1);
    expect(exam.id).toBeDefined();
  });

  it('ghi HỎNG thì NHẢ khoá — lần bấm lại sau đó vẫn ghi được', async () => {
    const hong = dungService({ luuHong: true });
    await expect(hong.service.create(dtoGia(), 'khoa-xyz')).rejects.toThrow();
    expect(hong.soKhoa.has('khoa-xyz')).toBe(false);
  });

  it('phiếu phát lại mang đủ 24 số đo như lần đầu', async () => {
    const { service } = dungService();
    const lan1: any = await service.create(dtoGia(), 'khoa-24');
    const lan2: any = await service.create(dtoGia(), 'khoa-24');
    expect(lan2.inputData).toEqual(lan1.inputData);
    expect(Object.keys(lan2.inputData)).toHaveLength(24);
  });
});
