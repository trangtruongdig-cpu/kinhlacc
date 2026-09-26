jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: {},
}));

import { ThamDinhThayThuocService } from './tham-dinh-thay-thuoc.controller';

describe('ThamDinhThayThuocService.MUC_MAU', () => {
  it('đúng mười mục, trải trên năm bộ', () => {
    const m = ThamDinhThayThuocService.MUC_MAU;
    expect(m).toHaveLength(10);
    expect(new Set(m.map((x) => x.bo)).size).toBe(5);
  });

  it('không mục nào thuộc bài thuốc — thước phải rút từ bộ mà lớp 2 thật sự soi', () => {
    expect(ThamDinhThayThuocService.MUC_MAU.find((x) => x.bo === 'bai_thuoc')).toBeUndefined();
  });
});

describe('ThamDinhThayThuocService.loiNhacLapThuoc', () => {
  const s = new ThamDinhThayThuocService(null as never, null as never, null as never);

  it('cấm mô hình thêm kiến thức ngoài — đây là luật dễ trôi nhất', () => {
    const l = s.loiNhacLapThuoc();
    expect(l).toMatch(/không.*(thêm|bịa)/i);
  });

  it('đòi trả về JSON mảng điều luật với đủ bốn khoá', () => {
    const l = s.loiNhacLapThuoc();
    for (const k of ['ma', 'truc', 'noiDung', 'viDu']) expect(l).toContain(k);
  });

  it('đòi mỗi điều luật kèm ví dụ LẤY TỪ chính mục mẫu', () => {
    expect(s.loiNhacLapThuoc()).toMatch(/ví dụ.*(trích|lấy).*(mẫu|bài)/i);
  });
});

describe('ThamDinhThayThuocService.lapThuoc — khi chưa cấu hình', () => {
  it('thiếu khoá mô hình thì NẰM IM, không ném lỗi', async () => {
    const llm = { daCauHinh: () => false, moCa: () => undefined } as never;
    const cms = { daCauHinh: () => true } as never;
    const s = new ThamDinhThayThuocService(cms, llm, null as never);
    const r = await s.lapThuoc();
    expect(r.phienBan).toBeNull();
    expect(r.loi[0]).toMatch(/chưa cấu hình/i);
  });

  it('thiếu cấu hình kho cũng nằm im', async () => {
    const llm = { daCauHinh: () => true, moCa: () => undefined } as never;
    const cms = { daCauHinh: () => false } as never;
    const s = new ThamDinhThayThuocService(cms, llm, null as never);
    expect((await s.lapThuoc()).phienBan).toBeNull();
  });
});
