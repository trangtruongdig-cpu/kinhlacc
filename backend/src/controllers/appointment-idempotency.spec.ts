import { AppointmentSlotsService } from './appointment-slot.controller';
import { AppointmentSlot } from '../models/appointment-slot.model';
import { AppointmentBooking } from '../models/appointment-booking.model';
import { ThaoTacGhi } from '../models/thao-tac-ghi.model';

/**
 * KHOÁ CHỐNG LẶP — luật do sự cố 09/10/2026 nêu ra: vé chuyển THÀNH CÔNG trên máy chủ
 * (b#86, movedAt 18:21:33) rồi ba lời gọi kế tiếp chết trong 387 ms. Người dùng đọc "Failed to
 * fetch" thành "không được" và bấm lại — trong khi việc đã xong.
 *
 * Vỡ một trong các điều dưới là đỏ ngay, không phải đợi có người báo mất vé.
 */

function caGia(p: Partial<AppointmentSlot>): AppointmentSlot {
  return {
    id: 1,
    slotDate: '2026-10-10',
    slotTime: '09:30:00',
    status: 'OPEN',
    patientId: null,
    reason: null,
    notes: null,
    reminded1h: false,
    reminded30m: false,
    reminded15m: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...p,
  } as AppointmentSlot;
}

function veGia(p: Partial<AppointmentBooking>): AppointmentBooking {
  return {
    id: 100,
    slotId: 1,
    patientId: 5639,
    slotDate: '2026-10-10',
    slotTime: '09:30:00',
    status: 'BOOKED',
    reason: 'đau vai gáy',
    notes: null,
    cancelledBy: null,
    cancelledAt: null,
    movedToId: null,
    movedToDate: null,
    movedToTime: null,
    movedFromId: null,
    movedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...p,
  } as AppointmentBooking;
}

/**
 * Kho trong bộ nhớ có MÔ PHỎNG khoá chính của `thao_tac_ghi`: chèn trùng thì ném 23505, đúng
 * như Postgres. Nhận NHIỀU ca để phần `move` dùng lại được mà không cần helper thứ hai.
 */
function dungService(dsCa: AppointmentSlot[], ve: AppointmentBooking | null = null) {
  const cacCa = new Map<number, AppointmentSlot>(dsCa.map((c) => [c.id, c]));
  const soKhoa = new Map<string, { khoa: string; route: string; ketQua: unknown }>();
  let idTiepTheo = 900;

  const manager = {
    findOne: jest.fn(async (entity: unknown, opts: any) => {
      if (entity === AppointmentSlot) return cacCa.get(opts.where.id) ?? null;
      if (entity === AppointmentBooking) {
        return ve && ve.slotId === opts.where.slotId && ve.status === opts.where.status
          ? ve
          : null;
      }
      return null;
    }),
    create: jest.fn((_e: unknown, data: any) => ({ ...data })),
    save: jest.fn(async (x: any) => {
      if (x.id == null) x.id = idTiepTheo++;
      return x;
    }),
    insert: jest.fn(async (entity: unknown, data: any) => {
      if (entity === ThaoTacGhi) {
        if (soKhoa.has(data.khoa)) {
          const e: any = new Error('duplicate key value violates unique constraint');
          e.code = '23505';
          throw e;
        }
        soKhoa.set(data.khoa, { ...data, ketQua: null });
      }
      return { identifiers: [] };
    }),
    update: jest.fn(async (entity: unknown, where: any, data: any) => {
      if (entity === ThaoTacGhi && soKhoa.has(where.khoa)) {
        soKhoa.get(where.khoa)!.ketQua = data.ketQua;
      }
      return { affected: 1 };
    }),
  };

  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager,
  };

  const suKien: any[] = [];
  const thaoTacRepo = {
    findOneBy: jest.fn(async ({ khoa }: any) => soKhoa.get(khoa) ?? null),
  };

  const service = new AppointmentSlotsService(
    {} as any, // slotRepo
    {} as any, // bookingRepo
    { sendToToken: jest.fn() } as any, // firebaseService
    { findOne: jest.fn(async () => ({ id: 5639, fullName: 'Khách thử' })) } as any, // patientsService
    { emitEvent: jest.fn((e: any) => suKien.push(e)) } as any, // sseService
    {} as any, // clinicScheduleService
    { createQueryRunner: () => queryRunner } as any, // dataSource
    thaoTacRepo as any, // thaoTacRepo
  );
  return { service, suKien, soKhoa, queryRunner };
}

const GIO_TRUOC = '2026-10-10T00:00:00.000Z'; // trước mọi ca trong phép kiểm
beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(GIO_TRUOC)));
afterEach(() => jest.useRealTimers());

describe('book — bấm lại khi mạng chập KHÔNG được đặt hai lần', () => {
  it('cùng một khoá gọi hai lần → chỉ ĐẶT một lần, lần hai trả lại kết quả cũ', async () => {
    const { service, soKhoa } = dungService([caGia({ id: 10, status: 'OPEN' })]);
    const lan1 = await service.book(10, { patientId: 5639 } as any, 'k-abc');
    const lan2 = await service.book(10, { patientId: 5639 } as any, 'k-abc');

    expect(soKhoa.size).toBe(1);
    expect(lan2).toEqual(lan1);
  });

  it('lần BẤM LẠI không được phát SSE lần hai', async () => {
    const { service, suKien } = dungService([caGia({ id: 10, status: 'OPEN' })]);
    await service.book(10, { patientId: 5639 } as any, 'k-abc');
    const sauLan1 = suKien.length;
    await service.book(10, { patientId: 5639 } as any, 'k-abc');

    expect(suKien.length).toBe(sauLan1);
  });

  it('KHÔNG có khoá thì xử sự y như trước — không được phá máy khách bản cũ', async () => {
    const { service, soKhoa } = dungService([caGia({ id: 10, status: 'OPEN' })]);
    const kq = await service.book(10, { patientId: 5639 } as any);

    expect(soKhoa.size).toBe(0);
    expect(kq.slot.status).toBe('BOOKED');
  });
});
