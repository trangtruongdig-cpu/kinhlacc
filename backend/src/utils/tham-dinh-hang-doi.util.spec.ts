import { diemUuTien, xepHangDoi, DAY_TOI_THIEU, type UngVienSoi } from './tham-dinh-hang-doi.util';

function uv(p: Partial<UngVienSoi> = {}): UngVienSoi {
  return {
    bo: 'huyet_vi', ma: 'm1', slug: 's1', tieuDe: 'T', doDay: 2000, soLoiMay: 0,
    vanTayNoiDung: 'v1', vanTayThayThuoc: null, diemCoHoiSeo: 0, ...p,
  };
}

describe('diemUuTien', () => {
  /** Công thức của spec: cơ hội SEO × 3 + mức hỏng máy × 2 + độ dày. */
  it('cơ hội SEO nặng gấp ba lần mức hỏng máy', () => {
    const a = diemUuTien(uv({ diemCoHoiSeo: 10, soLoiMay: 0 }));
    const b = diemUuTien(uv({ diemCoHoiSeo: 0, soLoiMay: 10 }));
    expect(a).toBeGreaterThan(b);
  });

  it('bài dài hơn thì ưu tiên hơn khi mọi thứ khác bằng nhau', () => {
    expect(diemUuTien(uv({ doDay: 9000 }))).toBeGreaterThan(diemUuTien(uv({ doDay: 1000 })));
  });

  it('độ dày KHÔNG được lấn át — 20.000 ký tự không thắng nổi một mục có người tìm', () => {
    const dai = diemUuTien(uv({ doDay: 20000, diemCoHoiSeo: 0 }));
    const coNguoiTim = diemUuTien(uv({ doDay: 1000, diemCoHoiSeo: 20 }));
    expect(coNguoiTim).toBeGreaterThan(dai);
  });
});

describe('xepHangDoi', () => {
  /**
   * Van tiết kiệm tiền. Bài chưa đổi kể từ lần soi kỹ trước thì không gọi mô hình lại —
   * đây là chỗ giữ cho chi phí không nhân lên mỗi đêm.
   */
  it('BỎ mục có vân tay không đổi kể từ lần soi thầy thuốc trước', () => {
    const ds = [uv({ ma: 'a', vanTayNoiDung: 'v1', vanTayThayThuoc: 'v1' })];
    expect(xepHangDoi(ds, 10)).toHaveLength(0);
  });

  it('GIỮ mục đã đổi nội dung', () => {
    const ds = [uv({ ma: 'a', vanTayNoiDung: 'v2', vanTayThayThuoc: 'v1' })];
    expect(xepHangDoi(ds, 10)).toHaveLength(1);
  });

  it('GIỮ mục chưa soi kỹ lần nào', () => {
    expect(xepHangDoi([uv({ vanTayThayThuoc: null })], 10)).toHaveLength(1);
  });

  it('BỎ mục mỏng — dưới ngưỡng thì không có gì để phê văn phong', () => {
    expect(xepHangDoi([uv({ doDay: DAY_TOI_THIEU - 1 })], 10)).toHaveLength(0);
  });

  it('BỎ bài thuốc và dược liệu — giai đoạn đầu việc của chúng là vào chỉ mục Google', () => {
    const ds = [uv({ bo: 'bai_thuoc' }), uv({ bo: 'duoc_lieu' }), uv({ bo: 'huyet_vi' })];
    expect(xepHangDoi(ds, 10).map((x) => x.bo)).toEqual(['huyet_vi']);
  });

  it('cắt đúng số lượng xin, lấy phần đầu hàng đợi', () => {
    const ds = Array.from({ length: 20 }, (_, i) => uv({ ma: `m${i}`, diemCoHoiSeo: i }));
    const r = xepHangDoi(ds, 5);
    expect(r).toHaveLength(5);
    expect(r[0].diemCoHoiSeo).toBe(19);
  });

  it('số lượng 0 → hàng đợi rỗng, không phải "lấy tất"', () => {
    expect(xepHangDoi([uv()], 0)).toHaveLength(0);
  });
});
