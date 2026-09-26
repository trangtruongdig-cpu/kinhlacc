import { gomCum, vanTayNoiDung, type NhanXetCoMuc } from './tham-dinh-cum.util';
import { chuanHoaRoute, tinhVanTay } from './su-co-van-tay.util';

const DUONG = { huyet_vi: '/huyet/', bai_thuoc: '/bai-thuoc/' };

function nx(slug: string, kieu = 'thieu_truong_cot_loi'): NhanXetCoMuc {
  return {
    kieu, bo: 'huyet_vi', slug, tieuDe: `Huyệt ${slug}`,
    truong: 'pho_huyet', trichDan: '', nhanXet: 'Thiếu', nang: false,
  };
}

describe('gomCum', () => {
  /**
   * Phép kiểm QUAN TRỌNG NHẤT của kế hoạch này.
   *
   * Vân tay cụm của tab Góp Ý & Lỗi là sha1(loai|route_chuan|thong_diep_chuan), và
   * chuanHoaRoute chỉ thay SỐ bằng :id — slug chữ giữ nguyên. Nộp kèm slug thì 484 mục
   * huyệt sinh 484 cụm và tab thành bãi rác trong một đêm.
   */
  it('484 nhận xét cùng kiểu trên 484 slug khác nhau → ĐÚNG 1 cụm', () => {
    const ds = Array.from({ length: 484 }, (_, i) => nx(`huyet-${i}`));
    const cum = gomCum(ds, DUONG);
    expect(cum).toHaveLength(1);
    expect(cum[0].soMuc).toBe(484);
  });

  it('route của cụm là đường của BỘ, không kèm slug', () => {
    const cum = gomCum([nx('lai-cau'), nx('hop-coc')], DUONG);
    expect(cum[0].route).toBe('/huyet/');
    expect(chuanHoaRoute(cum[0].route)).toBe('/huyet');
  });

  it('vân tay tính từ route bộ là ổn định giữa hai lần chạy', () => {
    const a = gomCum([nx('lai-cau')], DUONG)[0];
    const b = gomCum([nx('hop-coc')], DUONG)[0];
    const vt = (c: typeof a) => tinhVanTay('gop_y', chuanHoaRoute(c.route), c.thongDiep.toLowerCase());
    expect(vt(a)).toBe(vt(b));
  });

  it('kiểu lỗi khác nhau → cụm khác nhau', () => {
    const cum = gomCum([nx('a', 'thieu_truong_cot_loi'), nx('b', 'mojibake')], DUONG);
    expect(cum).toHaveLength(2);
  });

  it('cùng kiểu nhưng khác bộ → cụm khác nhau', () => {
    const ds: NhanXetCoMuc[] = [nx('a'), { ...nx('b'), bo: 'bai_thuoc' }];
    expect(gomCum(ds, DUONG)).toHaveLength(2);
  });

  it('xếp cụm nặng lên trước, rồi tới cụm nhiều mục', () => {
    const ds: NhanXetCoMuc[] = [
      ...Array.from({ length: 50 }, (_, i) => nx(`x${i}`, 'thieu_truong')),
      { ...nx('y', 'mojibake'), nang: true },
    ];
    const cum = gomCum(ds, DUONG);
    expect(cum[0].kieu).toBe('mojibake');
  });

  it('danh sách slug bị cắt ở 200 để thân cụm không phình', () => {
    const ds = Array.from({ length: 484 }, (_, i) => nx(`huyet-${i}`));
    expect(gomCum(ds, DUONG)[0].slugs).toHaveLength(200);
  });
});

describe('vanTayNoiDung', () => {
  it('nội dung không đổi → vân tay không đổi', () => {
    const a = vanTayNoiDung({ vi_tri: 'Chỗ lõm', chu_tri: 'Đau đầu' }, ['vi_tri', 'chu_tri']);
    const b = vanTayNoiDung({ chu_tri: 'Đau đầu', vi_tri: 'Chỗ lõm' }, ['vi_tri', 'chu_tri']);
    expect(a).toBe(b);
  });

  it('đổi một chữ → vân tay đổi', () => {
    const a = vanTayNoiDung({ vi_tri: 'Chỗ lõm' }, ['vi_tri']);
    const b = vanTayNoiDung({ vi_tri: 'Chỗ lõm.' }, ['vi_tri']);
    expect(a).not.toBe(b);
  });

  it('bỏ qua cột không khai trong thân bài', () => {
    const a = vanTayNoiDung({ vi_tri: 'A', ghi_chu: 'X' }, ['vi_tri']);
    const b = vanTayNoiDung({ vi_tri: 'A', ghi_chu: 'Y' }, ['vi_tri']);
    expect(a).toBe(b);
  });
});
