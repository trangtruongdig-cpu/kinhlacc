import {
  caDaQuaGio,
  lyDoKhongChuyenDuoc,
  thoiDiemBatDauCa,
} from './ve-da-qua.util';

describe('caDaQuaGio', () => {
  // 17:00 giờ VN ngày 29/09/2026 = 10:00 UTC
  const luc17h = new Date('2026-09-29T10:00:00Z');

  it('ca trước giờ hiện tại là đã qua', () => {
    expect(caDaQuaGio('2026-09-29', '08:00', luc17h)).toBe(true);
    expect(caDaQuaGio('2026-09-29', '16:15:00', luc17h)).toBe(true);
  });

  it('ca bắt đầu đúng lúc này là đã qua', () => {
    expect(caDaQuaGio('2026-09-29', '17:00', luc17h)).toBe(true);
  });

  it('ca sau giờ hiện tại còn đặt được', () => {
    expect(caDaQuaGio('2026-09-29', '17:45', luc17h)).toBe(false);
    expect(caDaQuaGio('2026-09-30', '08:00:00', luc17h)).toBe(false);
  });

  it('ngày hôm trước luôn đã qua', () => {
    expect(caDaQuaGio('2026-09-28', '20:45', luc17h)).toBe(true);
  });

  it('so theo giờ VN, không theo giờ UTC của máy chủ', () => {
    // 01:00 giờ VN ngày 30 = 18:00 UTC ngày 29 — theo UTC vẫn là "ngày 29"
    const luc1hSang = new Date('2026-09-29T18:00:00Z');
    expect(caDaQuaGio('2026-09-29', '20:45', luc1hSang)).toBe(true);
    expect(caDaQuaGio('2026-09-30', '08:00', luc1hSang)).toBe(false);
  });

  it('dữ liệu hỏng không bị coi là đã qua', () => {
    expect(caDaQuaGio('rac', '08:00', luc17h)).toBe(false);
    expect(Number.isNaN(thoiDiemBatDauCa('rac', '08:00').getTime())).toBe(true);
  });
});

describe('lyDoKhongChuyenDuoc', () => {
  const luc17h = new Date('2026-09-29T10:00:00Z');
  const ca = (
    id: number,
    slotTime: string,
    status: string,
    slotDate = '2026-09-29',
  ) => ({
    id,
    slotDate,
    slotTime,
    status,
  });

  it('vé đã qua giờ vẫn chuyển được sang ca trống sắp tới', () => {
    expect(
      lyDoKhongChuyenDuoc(
        ca(1, '10:15', 'BOOKED'),
        ca(2, '17:45', 'OPEN'),
        luc17h,
      ),
    ).toBeNull();
  });

  it('chuyển sang ngày khác được', () => {
    expect(
      lyDoKhongChuyenDuoc(
        ca(1, '10:15', 'BOOKED'),
        ca(2, '08:00', 'OPEN', '2026-10-01'),
        luc17h,
      ),
    ).toBeNull();
  });

  it('không chuyển sang ca đã qua giờ', () => {
    expect(
      lyDoKhongChuyenDuoc(
        ca(1, '10:15', 'BOOKED'),
        ca(2, '16:15', 'OPEN'),
        luc17h,
      ),
    ).toMatch(/qua giờ/);
  });

  it('không chuyển sang ca đã có người hoặc đã đóng', () => {
    expect(
      lyDoKhongChuyenDuoc(
        ca(1, '10:15', 'BOOKED'),
        ca(2, '18:30', 'BOOKED'),
        luc17h,
      ),
    ).toMatch(/không còn trống/);
    expect(
      lyDoKhongChuyenDuoc(
        ca(1, '10:15', 'BOOKED'),
        ca(2, '18:30', 'CLOSED'),
        luc17h,
      ),
    ).toMatch(/không còn trống/);
  });

  it('vé đã hoàn thành không chuyển được', () => {
    expect(
      lyDoKhongChuyenDuoc(
        ca(1, '10:15', 'COMPLETED'),
        ca(2, '17:45', 'OPEN'),
        luc17h,
      ),
    ).toMatch(/chưa hoàn thành/);
  });

  it('không chuyển vào chính nó', () => {
    expect(
      lyDoKhongChuyenDuoc(
        ca(1, '18:30', 'BOOKED'),
        ca(1, '18:30', 'BOOKED'),
        luc17h,
      ),
    ).toMatch(/trùng/);
  });
});
