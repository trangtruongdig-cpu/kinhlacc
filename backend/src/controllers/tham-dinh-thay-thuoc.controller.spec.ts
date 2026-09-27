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

  /**
   * Lượt lập thước thứ hai (26/09/2026) ra ba điều bố cục mô tả... chính khung markdown
   * mà lời nhắc dùng để gói bài ("## [huyet_vi]", "### vi_tri"). Mô hình học bao bì
   * thành hàng. Lời nhắc phải nói thẳng khung đó là kỹ thuật.
   */
  it('nói rõ khung ## và ### là bao bì kỹ thuật, không phải văn phong', () => {
    const l = s.loiNhacLapThuoc();
    expect(l).toMatch(/###/);
    expect(l).toMatch(/kỹ thuật|bao bì|không phải văn phong/i);
  });

  /**
   * Bản bộ luật thứ ba (26/09/2026) ra ba điều không dùng được, và hai trong số đó tự
   * mâu thuẫn với chính câu mẫu của nó: luật đòi "(Nh.4)" có dấu chấm trong khi mẫu là
   * "(Ty 9)" không dấu chấm; luật nói "không dùng dấu hai chấm trước dẫn văn" trong khi
   * mẫu có dấu hai chấm. Điều thứ ba chỉ MÔ TẢ ("văn bản dùng động từ trị") nên đem đo
   * câu mới thì không phán được gì.
   */
  it('đòi điều luật PHÁN ĐƯỢC đúng/sai, không nhận nhận xét mô tả', () => {
    expect(s.loiNhacLapThuoc()).toMatch(/phán|đo được|đúng\/sai/i);
  });

  it('đòi ví dụ là câu TUÂN THỦ điều luật, không phải câu vi phạm', () => {
    expect(s.loiNhacLapThuoc()).toMatch(/tuân thủ|đúng luật|không.*vi phạm/i);
  });

  /**
   * Bản bộ luật thứ tư (27/09/2026) đòi "tên sách viết IN NGHIÊNG" trong khi bản thứ ba
   * nói "không in nghiêng" — hai bản trái nhau, dấu hiệu mô hình đoán.
   *
   * Gốc: `rutChu` rút chữ thuần, bỏ sạch định dạng. Mô hình KHÔNG THỂ thấy in nghiêng,
   * in đậm hay cỡ chữ, nên mọi điều luật về chúng đều là bịa — và bịa loại này khó bắt
   * vì lời phê dựa vào nó nghe rất chuyên nghiệp.
   */
  it('nói rõ bản trích đã mất định dạng, đừng ra luật về in nghiêng hay in đậm', () => {
    expect(s.loiNhacLapThuoc()).toMatch(/in nghiêng|in đậm|định dạng/i);
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

  /**
   * Đo thật 27/09/2026: 1 trên 4 mục, mô hình trả markdown văn xuôi ("Đọc lại toàn bộ bài
   * này, tôi thấy có một số vấn đề cần chỉ ra: ## Lỗi rõ ràng...") thay vì JSON. Yêu cầu
   * định dạng khi đó nằm ở CUỐI một lời nhắc dài 2.000 ký tự.
   *
   * Đòi định dạng ngay dòng đầu, và nhắc lại ở cuối: mô hình đọc lời nhắc dài thì phần
   * đầu và phần cuối là hai chỗ nó giữ chắc nhất.
   */
  it('đòi định dạng JSON ngay trong ba dòng đầu, không chỉ ở cuối', () => {
    const dong = s.loiNhacSoi(LUAT).split('\n').slice(0, 3).join(' ');
    expect(dong).toMatch(/JSON/);
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

describe('ThamDinhThayThuocService — phản hồi không đọc được', () => {
  /**
   * Đo thật 27/09/2026: ca soi 5 mục ghi 8 lời phê trên MỘT mục và 0 trên bốn mục còn
   * lại. Gọi lại một trong bốn mục đó thì nó cho ra 8 lời phê hợp lệ.
   *
   * Gốc: khi `bocJson` không bóc được JSON (mô hình trả văn xuôi), `locLoiPhe` trả
   * nhận 0 / loại 0 — y như khi mô hình bảo "bài này sạch". Ca soi vẫn ĐÓNG VAN, nên mục
   * đó vĩnh viễn không được đọc lại, và lược kê không hề nói có chuyện gì xảy ra.
   *
   * Hai thứ phải phân biệt: "mô hình đọc rồi bảo sạch" và "mô hình trả thứ ta không
   * hiểu". Cái đầu là kết quả, cái sau là hỏng.
   */
  function svcVoi(traLoi: string | null) {
    const ghiCho: Array<{ bo: string; vanTay: string; so: number }> = [];
    const cms = {
      daCauHinh: () => true, moKetNoi: () => Promise.resolve(), dongKetNoi: () => Promise.resolve(),
      dungBang: () => Promise.resolve(),
      docBoLuat: () => Promise.resolve({ phienBan: 1, boApDung: [], daDuyet: true,
        dieu: [{ ma: 'BC1', truc: 'bo_cuc', noiDung: 'x', viDu: '' }] }),
      docUngVienSoi: () => Promise.resolve([{
        bo: 'benh_hoc', ma: 'm1', slug: 's1', tieuDe: 'T', doDay: 5000, soLoiMay: 0,
        vanTayNoiDung: 'v9', vanTayThayThuoc: null, diemCoHoiSeo: 0,
      }]),
      docCauHinhBo: () => Promise.resolve([{ bo: 'benh_hoc', duongDan: '/benh-hoc/', than: ['dai_cuong'] }]),
      docThanBai: () => Promise.resolve({ dai_cuong: 'Một câu có thật trong bài.' }),
      docChumLienQuan: () => Promise.resolve([]),
      ghiLoiPheThayThuoc: (bo: string, _ma: string, vanTay: string, ds: unknown[]) => {
        ghiCho.push({ bo, vanTay, so: ds.length });
        return Promise.resolve();
      },
    } as never;
    const llm = {
      daCauHinh: () => true, moCa: () => undefined, conHanMuc: () => true,
      soLuotDaGoi: () => 1, goi: () => Promise.resolve(traLoi),
    } as never;
    const s = new ThamDinhThayThuocService(cms, llm, { get: () => undefined } as never, null as never);
    return { s, ghiCho };
  }

  it('mô hình bảo bài sạch ([]) → đóng van, đếm là đã soi', async () => {
    const { s, ghiCho } = svcVoi('[]');
    const lk = await s.chayCaThayThuoc();
    expect(lk.soMucSoi).toBe(1);
    expect(lk.soPhanHoiKhongDocDuoc).toBe(0);
    expect(ghiCho).toHaveLength(1);
  });

  it('mô hình trả văn xuôi → KHÔNG đóng van, và ĐẾM vào lược kê', async () => {
    const { s, ghiCho } = svcVoi('Tôi đã đọc bài và thấy nội dung khá tốt.');
    const lk = await s.chayCaThayThuoc();
    expect(lk.soPhanHoiKhongDocDuoc).toBe(1);
    expect(ghiCho).toHaveLength(0);
  });

  it('mô hình trả JSON có lời phê → đóng van kèm lời phê', async () => {
    const { s, ghiCho } = svcVoi(
      '[{"truong":"dai_cuong","kieu":"cau_cut","trichDan":"Một câu có thật","nhanXet":"x","bacCanCu":1}]',
    );
    const lk = await s.chayCaThayThuoc();
    expect(lk.soLoiPheNhan).toBe(1);
    expect(ghiCho[0].so).toBe(1);
  });
});
