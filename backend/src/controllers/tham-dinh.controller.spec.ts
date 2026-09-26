/**
 * `@nestjs/schedule` v12 là gói ESM thuần; jest của repo chạy CJS nên chỉ cần một file
 * trong chuỗi import chạm tới nó là cả bộ kiểm gãy ngay khâu parse. Chuỗi ở đây là
 * spec → tham-dinh.controller → su-co.controller → @nestjs/schedule.
 *
 * Decorator lịch không nằm trong phạm vi phép kiểm này, nên thay bằng bản rỗng.
 */
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: {},
}));

import { ThamDinhService } from './tham-dinh.controller';

describe('ThamDinhService.xepHangHoSo', () => {
  const s = new ThamDinhService(null as never, null as never, null as never);

  it('không nhận xét nào → tốt', () => {
    expect(s.xepHangHoSo(0, 0, 1200)).toBe('tot');
  });

  it('có lỗi nặng → hỏng, bất kể bài dài bao nhiêu', () => {
    expect(s.xepHangHoSo(1, 1, 20000)).toBe('hong');
  });

  it('nhiều nhận xét thường mà không nặng → yếu', () => {
    expect(s.xepHangHoSo(0, 6, 800)).toBe('yeu');
  });

  it('vài nhận xét nhẹ → tạm được', () => {
    expect(s.xepHangHoSo(0, 2, 800)).toBe('tam_duoc');
  });
});

describe('ThamDinhService.chayCa — khi chưa cấu hình', () => {
  it('thiếu CMS_DB_* thì NẰM IM, trả lược kê rỗng, không ném lỗi', async () => {
    const cms = { daCauHinh: () => false } as never;
    const s = new ThamDinhService(cms, null as never, null as never);
    const lk = await s.chayCa();
    expect(lk.soMucDoc).toBe(0);
    expect(lk.loi[0]).toMatch(/chưa cấu hình/i);
  });
});

describe('ThamDinhService.nopCum — chia lô', () => {
  /**
   * `SuCoService.ghiNhanLo` xử lý `danhSach.slice(0, 50)` rồi thôi — không báo lỗi, không
   * đếm phần bị bỏ. Nộp một mẻ 120 cụm thì 70 cụm cuối biến mất lặng lẽ, và đó đúng là
   * loại hỏng không ai phát hiện ra cho tới lúc đi tìm một cụm đáng lẽ phải có.
   */
  it('120 cụm được chia thành nhiều lượt gọi, không cụm nào rơi', async () => {
    const meNhan: number[] = [];
    const suCo = {
      ghiNhanLo: (ds: unknown[]) => {
        meNhan.push(ds.length);
        return Promise.resolve({ nhan: ds.length, boQua: 0 });
      },
    } as never;
    const s = new ThamDinhService(null as never, suCo, null as never);

    const cum = Array.from({ length: 120 }, (_, i) => ({
      kieu: `k${i}`, bo: 'huyet_vi', route: '/huyet/', thongDiep: `t${i}`,
      moTa: '', soMuc: 1, nang: false, slugs: ['a'],
    }));

    expect(await s.nopCum(cum)).toBe(120);
    expect(Math.max(...meNhan)).toBeLessThanOrEqual(50);
    expect(meNhan.reduce((a, b) => a + b, 0)).toBe(120);
  });

  it('không có cụm nào thì không gọi su-co lần nào', async () => {
    let goi = 0;
    const suCo = { ghiNhanLo: () => { goi++; return Promise.resolve({ nhan: 0, boQua: 0 }); } } as never;
    const s = new ThamDinhService(null as never, suCo, null as never);
    expect(await s.nopCum([])).toBe(0);
    expect(goi).toBe(0);
  });
});
