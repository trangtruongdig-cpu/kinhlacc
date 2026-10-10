import { ConflictException } from '@nestjs/common';
import { AppointmentSlotsService } from './appointment-slot.controller';
import { AppointmentSlot } from '../models/appointment-slot.model';
import { AppointmentBooking } from '../models/appointment-booking.model';

/**
 * CHUYỂN VÉ — quy tắc do phòng chẩn trị nêu: "ca cũ phải TRỐNG và LƯU VẾT đã chuyển đi".
 *
 * Phép kiểm này tồn tại vì 10/10/2026 có báo lỗi "chuyển đi rồi ca cũ vẫn còn". Lần đó dữ liệu
 * máy chủ hoàn toàn đúng (19/19 ca nguồn đã nhả, 0 ô mồ côi) — thủ phạm nằm ở máy khách. Nhưng
 * lúc đi truy thì KHÔNG có phép kiểm nào cho `move()`, nên không loại trừ nhanh được tầng
 * backend; cả buổi chẩn đoán bắt đầu bằng việc phải tự đi đọc 19 dòng trong CSDL thật.
 *
 * Nay luật nằm ở đây: vỡ một trong bốn điều dưới là đỏ ngay, không phải đợi người dùng báo.
 */

type BanGhi = AppointmentSlot | AppointmentBooking;

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

/** Dựng service với một kho trong bộ nhớ, đủ cho đường đi của `move()`. */
function dungService(caNguon: AppointmentSlot, caDich: AppointmentSlot, ve: AppointmentBooking | null) {
  const cacCa = new Map<number, AppointmentSlot>([
    [caNguon.id, caNguon],
    [caDich.id, caDich],
  ]);
  const daLuu: BanGhi[] = [];
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
    create: jest.fn((_e: unknown, data: Partial<AppointmentBooking>) => ({ ...data })),
    save: jest.fn(async (x: any) => {
      if (x.id == null) x.id = idTiepTheo++;
      daLuu.push(x);
      return x;
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
  const service = new AppointmentSlotsService(
    {} as any,
    {} as any,
    { sendToToken: jest.fn() } as any,
    { findOne: jest.fn() } as any,
    { emitEvent: jest.fn((e: any) => suKien.push(e)) } as any,
    {} as any,
    { createQueryRunner: () => queryRunner } as any,
    // Sổ khoá chống lặp — các phép kiểm ở đây không truyền khoá nên không bao giờ chạm tới nó.
    { findOneBy: jest.fn() } as any,
  );
  return { service, queryRunner, suKien, daLuu };
}

describe('AppointmentSlotsService.move — chuyển vé', () => {
  const GIO_TRUOC = '2026-10-10T02:00:00.000Z'; // 09:00 giờ VN, trước cả hai ca

  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(GIO_TRUOC)));
  afterEach(() => jest.useRealTimers());

  it('CA CŨ PHẢI TRỐNG: nhả hết khách, lý do, ghi chú và cờ đã nhắc', async () => {
    const nguon = caGia({ id: 486, slotTime: '09:30:00', status: 'BOOKED', patientId: 5639, reason: 'đau vai gáy', notes: 'ghi chú', reminded1h: true });
    const dich = caGia({ id: 490, slotTime: '14:45:00', status: 'OPEN' });
    const { service } = dungService(nguon, dich, veGia({ slotId: 486 }));

    const kq = await service.move(486, 490);

    expect(kq.from.status).toBe('OPEN');
    expect(kq.from.patientId).toBeNull();
    expect(kq.from.reason).toBeNull();
    expect(kq.from.notes).toBeNull();
    expect(kq.from.reminded1h).toBe(false);
  });

  it('LƯU VẾT: vé cũ thành MOVED và ghi rõ đi đâu; vé mới trỏ ngược về vé cũ', async () => {
    const nguon = caGia({ id: 486, slotTime: '09:30:00', status: 'BOOKED', patientId: 5639 });
    const dich = caGia({ id: 490, slotDate: '2026-10-11', slotTime: '14:45:00', status: 'OPEN' });
    const ve = veGia({ id: 86, slotId: 486 });
    const { service } = dungService(nguon, dich, ve);

    const kq = await service.move(486, 490);

    expect(kq.moved.status).toBe('MOVED');
    expect(kq.moved.movedToDate).toBe('2026-10-11');
    expect(kq.moved.movedToTime).toBe('14:45:00');
    expect(kq.moved.movedAt).toBeInstanceOf(Date);
    expect(kq.moved.movedToId).toBe(kq.booking.id);
    expect(kq.booking.movedFromId).toBe(86);
    // Vé giữ nguyên khách và lý do đến — chuyển vé KHÁC huỷ rồi đặt mới.
    expect(kq.booking.patientId).toBe(5639);
    expect(kq.booking.reason).toBe('đau vai gáy');
  });

  it('CA ĐÍCH nhận đủ khách, lý do, ghi chú và reset cờ đã nhắc', async () => {
    const nguon = caGia({ id: 486, status: 'BOOKED', patientId: 5639 });
    const dich = caGia({ id: 490, slotTime: '14:45:00', status: 'OPEN', reminded30m: true });
    const { service } = dungService(nguon, dich, veGia({ slotId: 486, notes: 'khách hẹn muộn' }));

    const kq = await service.move(486, 490);

    expect(kq.to.status).toBe('BOOKED');
    expect(kq.to.patientId).toBe(5639);
    expect(kq.to.reason).toBe('đau vai gáy');
    expect(kq.to.notes).toBe('khách hẹn muộn');
    expect(kq.to.reminded30m).toBe(false);
  });

  it('Phát sự kiện realtime cho CẢ HAI ca — thiếu ca cũ là máy khác vẫn thấy vé ở chỗ cũ', async () => {
    const nguon = caGia({ id: 486, status: 'BOOKED', patientId: 5639 });
    const dich = caGia({ id: 490, slotTime: '14:45:00', status: 'OPEN' });
    const { service, suKien } = dungService(nguon, dich, veGia({ slotId: 486 }));

    await service.move(486, 490);

    const idDaBao = suKien.map((e) => e.staffSlot.id).sort();
    expect(idDaBao).toEqual([486, 490]);
  });

  it('Ca đích đã có người đặt thì TỪ CHỐI và không đụng gì tới ca cũ', async () => {
    const nguon = caGia({ id: 486, status: 'BOOKED', patientId: 5639 });
    const dich = caGia({ id: 490, slotTime: '14:45:00', status: 'BOOKED', patientId: 777 });
    const { service, queryRunner } = dungService(nguon, dich, veGia({ slotId: 486 }));

    await expect(service.move(486, 490)).rejects.toBeInstanceOf(ConflictException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(nguon.status).toBe('BOOKED');
    expect(nguon.patientId).toBe(5639);
  });

  it('Ca nguồn ĐÃ QUA GIỜ vẫn chuyển được — đó chính là ca khách bận không tới', async () => {
    jest.setSystemTime(new Date('2026-10-10T04:00:00.000Z')); // 11:00 VN: 09:30 đã qua
    const nguon = caGia({ id: 486, slotTime: '09:30:00', status: 'BOOKED', patientId: 5639 });
    const dich = caGia({ id: 490, slotTime: '14:45:00', status: 'OPEN' });
    const { service } = dungService(nguon, dich, veGia({ slotId: 486 }));

    const kq = await service.move(486, 490);

    expect(kq.from.status).toBe('OPEN');
    expect(kq.to.status).toBe('BOOKED');
  });
});
