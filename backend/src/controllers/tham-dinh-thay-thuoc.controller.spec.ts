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
  const s = new ThamDinhThayThuocService(null as never, null as never, null as never, null as never);

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
    const s = new ThamDinhThayThuocService(cms, llm, null as never, null as never);
    const r = await s.lapThuoc();
    expect(r.phienBan).toBeNull();
    expect(r.loi[0]).toMatch(/chưa cấu hình/i);
  });

  it('thiếu cấu hình kho cũng nằm im', async () => {
    const llm = { daCauHinh: () => true, moCa: () => undefined } as never;
    const cms = { daCauHinh: () => false } as never;
    const s = new ThamDinhThayThuocService(cms, llm, null as never, null as never);
    expect((await s.lapThuoc()).phienBan).toBeNull();
  });
});

import type { BoLuatVanPhong } from '../utils/tham-dinh-luat.util';

const LUAT: BoLuatVanPhong = {
  phienBan: 3, boApDung: ['huyet_vi'], daDuyet: true,
  dieu: [
    { ma: 'BC1', truc: 'bo_cuc', noiDung: 'Mở đầu bằng câu định vị.', viDu: 'Ở chỗ lõm…' },
    { ma: 'PV1', truc: 'pham_vi_hanh_nghe', noiDung: 'Không dùng chữ hàm ý khám chữa bệnh.', viDu: '' },
  ],
};

describe('ThamDinhThayThuocService.loiNhacSoi', () => {
  const s = new ThamDinhThayThuocService(null as never, null as never, null as never, null as never);

  it('nhúng đủ các điều luật kèm mã để lời phê quy chiếu được', () => {
    const l = s.loiNhacSoi(LUAT);
    expect(l).toContain('BC1');
    expect(l).toContain('PV1');
    expect(l).toContain('Mở đầu bằng câu định vị.');
  });

  it('đòi trichDan là NGUYÊN VĂN và nói rõ sẽ bị loại nếu không khớp', () => {
    const l = s.loiNhacSoi(LUAT);
    expect(l).toMatch(/nguyên văn/i);
    expect(l).toMatch(/loại|bỏ/i);
  });

  it('cấm bậc 2 một cách tường minh', () => {
    expect(s.loiNhacSoi(LUAT)).toMatch(/bậc 2|trí nhớ/i);
  });

  it('cho phép nói "cần người bổ sung" khi không đủ căn cứ — bậc 4', () => {
    expect(s.loiNhacSoi(LUAT)).toMatch(/cần người bổ sung/i);
  });
});

describe('ThamDinhThayThuocService.dungNoiDungSoi', () => {
  const s = new ThamDinhThayThuocService(null as never, null as never, null as never, null as never);

  it('gói thân bài theo từng trường, có nhãn trường', () => {
    const r = s.dungNoiDungSoi(
      { bo: 'huyet_vi', tieuDe: 'Thái Khê' },
      { vi_tri: 'Ở chỗ lõm', chu_tri: 'Đau lưng' },
      [],
    );
    expect(r).toContain('vi_tri');
    expect(r).toContain('Ở chỗ lõm');
  });

  it('bỏ trường rỗng — đừng tốn token cho ô trống', () => {
    const r = s.dungNoiDungSoi({ bo: 'huyet_vi', tieuDe: 'T' }, { vi_tri: 'A', ghi_chu: '' }, []);
    expect(r).not.toContain('ghi_chu');
  });

  it('kèm chùm liên quan và nói rõ đó là NỀN, không phải bài đang soi', () => {
    const r = s.dungNoiDungSoi(
      { bo: 'huyet_vi', tieuDe: 'T' }, { vi_tri: 'A' },
      [{ bo: 'kinh_mach', tieuDe: 'Kinh Can', tomTat: 'Kinh Can chạy từ…' }],
    );
    expect(r).toContain('Kinh Can');
    expect(r).toMatch(/nền|tham khảo|không phải bài đang soi/i);
  });
});

describe('ThamDinhThayThuocService.chayCaThayThuoc — rào chắn vào ca', () => {
  function svc(over: Record<string, unknown> = {}) {
    const cms = {
      daCauHinh: () => true, moKetNoi: () => Promise.resolve(), dongKetNoi: () => Promise.resolve(),
      dungBang: () => Promise.resolve(), docBoLuat: () => Promise.resolve(null),
      ...over,
    } as never;
    const llm = { daCauHinh: () => true, moCa: () => undefined, soLuotDaGoi: () => 0 } as never;
    return new ThamDinhThayThuocService(cms, llm, { get: () => undefined } as never, null as never);
  }

  /**
   * Phép nghiệm thu số 2 của spec: bộ luật phải được người dùng duyệt TRƯỚC khi lớp 2
   * chạy lần đầu. Chạy bằng thước chưa ai duyệt thì lời phê không có thẩm quyền nào.
   */
  it('chưa có bộ luật ĐÃ DUYỆT thì không soi mục nào', async () => {
    const lk = await svc().chayCaThayThuoc();
    expect(lk.soMucSoi).toBe(0);
    expect(lk.loi[0]).toMatch(/bộ luật/i);
  });

  it('thiếu khoá mô hình thì nằm im', async () => {
    const cms = { daCauHinh: () => true } as never;
    const llm = { daCauHinh: () => false, moCa: () => undefined } as never;
    const s = new ThamDinhThayThuocService(cms, llm, { get: () => undefined } as never, null as never);
    const lk = await s.chayCaThayThuoc();
    expect(lk.soMucSoi).toBe(0);
    expect(lk.loi[0]).toMatch(/chưa cấu hình/i);
  });
});

describe('ThamDinhThayThuocService — kết tinh cụm', () => {
  /**
   * Cụm của lớp 2 phải gom y như lớp 1: theo BỘ + KIỂU, route là đường của bộ. Nộp kèm
   * slug thì 100 lời phê thành 100 cụm và tab thành bãi rác trong một đêm — đúng thứ cơ
   * chế vân tay dựng ra để chặn.
   */
  it('gom lời phê cùng kiểu trên nhiều mục thành MỘT cụm', async () => {
    const nhanXet = Array.from({ length: 40 }, (_, i) => ({
      kieu: 'cau_cut', truong: 'vi_tri', trichDan: 'x', nhanXet: 'y', nang: false,
      bo: 'huyet_vi', slug: `h-${i}`, tieuDe: `H${i}`,
    }));
    const cms = {
      daCauHinh: () => true, moKetNoi: () => Promise.resolve(), dongKetNoi: () => Promise.resolve(),
      dungBang: () => Promise.resolve(),
      docNhanXetThayThuoc: () => Promise.resolve(nhanXet),
      docCauHinhBo: () => Promise.resolve([{ bo: 'huyet_vi', duongDan: '/huyet/', than: [] }]),
    } as never;
    let nopCho: unknown[] = [];
    const lop1 = { nopCum: (c: unknown[]) => { nopCho = c; return Promise.resolve(c.length); } } as never;
    const s = new ThamDinhThayThuocService(cms, null as never, null as never, lop1);

    expect(await s.ketTinhCum()).toBe(1);
    expect((nopCho[0] as { route: string }).route).toBe('/huyet/');
    expect((nopCho[0] as { soMuc: number }).soMuc).toBe(40);
  });

  it('không có lời phê nào thì không nộp gì', async () => {
    const cms = {
      daCauHinh: () => true, moKetNoi: () => Promise.resolve(), dongKetNoi: () => Promise.resolve(),
      dungBang: () => Promise.resolve(),
      docNhanXetThayThuoc: () => Promise.resolve([]),
      docCauHinhBo: () => Promise.resolve([]),
    } as never;
    let goi = 0;
    const lop1 = { nopCum: () => { goi++; return Promise.resolve(0); } } as never;
    const s = new ThamDinhThayThuocService(cms, null as never, null as never, lop1);
    expect(await s.ketTinhCum()).toBe(0);
    expect(goi).toBe(0);
  });
});
