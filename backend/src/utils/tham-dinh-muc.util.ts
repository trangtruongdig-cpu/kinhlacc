import { doChu } from './tham-dinh-chu.util';

/** Một mục từ đã rút chữ khỏi portable text, sẵn sàng để soi. */
export interface MucKho {
  bo: string;
  ma: string;
  slug: string;
  tieuDe: string;
  /** tên cột → chữ thuần của cột đó */
  truong: Record<string, string>;
}

export interface NhanXetTho {
  kieu: string;
  truong: string | null;
  trichDan: string;
  nhanXet: string;
  /** Lỗi chặn người đọc hiểu được mục → nâng hạng cụm. */
  nang: boolean;
}

/**
 * Khung trường của 8 bộ. `than` chép từ `cms/scripts-di-cu/dung-chi-muc.mjs` — phải khớp,
 * vì đó cũng là danh sách cột được đưa vào ô tìm kiếm, và cũng là thứ `td_cau_hinh.cot_than`
 * giữ. Lệch một cột là bot phán "thiếu" một chỗ nó chưa hề đọc.
 *
 * `cotLoi` là phán đoán nghiệp vụ: thiếu nó thì mục VÔ DỤNG với người đọc, không chỉ là
 * thiếu sót. Huyệt không có vị trí thì không châm được; bài thuốc không có thành phần thì
 * không phải bài thuốc.
 */
export const KHUNG_TRUONG: Record<string, { than: string[]; cotLoi: string[] }> = {
  huyet_vi: {
    than: ['y_nghia_ten', 'dac_tinh', 'vi_tri', 'giai_phau', 'tac_dung', 'chu_tri',
           'cham_cuu', 'xuat_xu', 'pho_huyet', 'ghi_chu', 'tham_khao', 'cong_dung_nhom'],
    cotLoi: ['vi_tri', 'tac_dung', 'chu_tri'],
  },
  kinh_mach: {
    than: ['dai_cuong', 'dac_tinh', 'van_hanh', 'duong_chinh', 'kinh_can', 'kinh_biet',
           'lac_doc', 'lac_ngang', 'trieu_chung', 'chu_tri', 'dieu_tri'],
    cotLoi: ['duong_chinh', 'chu_tri'],
  },
  cham_cuu_tri_benh: {
    than: ['dai_cuong', 'nguyen_nhan', 'trieu_chung', 'chan_doan', 'dieu_tri', 'tham_khao'],
    cotLoi: ['trieu_chung', 'dieu_tri'],
  },
  benh_hoc: {
    than: ['dai_cuong', 'nguyen_nhan', 'co_che', 'trieu_chung', 'chan_doan', 'dieu_tri',
           'benh_an', 'tham_khao'],
    cotLoi: ['nguyen_nhan', 'chan_doan', 'dieu_tri'],
  },
  duoc_lieu: {
    than: ['mo_ta', 'thanh_phan_hoa_hoc', 'duoc_ly', 'tinh_vi_quy_kinh', 'nuoi_duong',
           'bao_che', 'chu_tri', 'don_thuoc', 'xuat_xu', 'tham_khao', 'cong_dung_ds', 'kieng_ky_ds'],
    cotLoi: ['tinh_vi_quy_kinh', 'chu_tri'],
  },
  bai_thuoc: {
    than: ['thanh_phan', 'cach_dung', 'tac_dung', 'ghi_chu'],
    cotLoi: ['thanh_phan', 'tac_dung'],
  },
  nguon_y_van: { than: ['ghi_chu', 'nien_dai', 'loai'], cotLoi: [] },
  bai_viet: { than: ['description', 'content'], cotLoi: ['content'] },
};

/**
 * Câu chỉ CÁCH DÙNG. Gặp chúng ở cuối `thanh_phan` là dấu hiệu ranh giới bản ghi legacy sai.
 * Danh sách rút từ chính kho, không phải đoán.
 */
const CUM_CACH_DUNG = [
  'sắc uống', 'ngày uống', 'tán bột', 'làm hoàn', 'chia ', 'uống với',
  'ngày một thang', 'sắc với', 'hoà uống', 'ngậm nuốt',
];

function co(s: string | undefined): boolean {
  return typeof s === 'string' && s.trim().length > 0;
}

export function doMuc(m: MucKho): NhanXetTho[] {
  const ra: NhanXetTho[] = [];
  const khung = KHUNG_TRUONG[m.bo];
  if (!khung) return ra;

  // ── Lỗi chữ trong từng trường ──────────────────────────────────────────────
  for (const [ten, chu] of Object.entries(m.truong)) {
    for (const l of doChu(chu)) {
      ra.push({
        kieu: l.ma,
        truong: ten,
        trichDan: l.trichDan,
        nhanXet: `Lỗi chữ trong trường "${ten}".`,
        nang: l.ma === 'rac_nhi_phan' || l.ma === 'mojibake' || l.ma === 'tcvn3',
      });
    }
  }

  // ── Thiếu trường ───────────────────────────────────────────────────────────
  // Chỉ xét cột ca soi ĐÃ ĐỌC. `td_cau_hinh.cot_than` mới là nguồn sự thật lúc chạy;
  // khung trên đây là bản chép, và bản chép thì có ngày lệch. Lệch thì im, đừng vu oan.
  for (const ten of khung.than) {
    if (!(ten in m.truong)) continue;
    if (co(m.truong[ten])) continue;
    const cotLoi = khung.cotLoi.includes(ten);
    ra.push({
      kieu: cotLoi ? 'thieu_truong_cot_loi' : 'thieu_truong',
      truong: ten,
      trichDan: '',
      nhanXet: cotLoi
        ? `Thiếu "${ten}" — thiếu trường này thì mục không dùng được.`
        : `Thiếu "${ten}".`,
      nang: cotLoi,
    });
  }

  // ── Trộn trường: cách dùng nằm trong thành phần ────────────────────────────
  const tp = m.truong['thanh_phan'] || '';
  if (tp) {
    const thap = tp.toLowerCase();
    const trung = CUM_CACH_DUNG.find((c) => thap.includes(c));
    if (trung && !co(m.truong['cach_dung'])) {
      const cau = tp.split(/(?<=[.!?])\s+/).find((c) => c.toLowerCase().includes(trung)) || tp;
      ra.push({
        kieu: 'tron_truong',
        truong: 'thanh_phan',
        trichDan: cau.trim(),
        nhanXet: 'Câu chỉ cách dùng nằm trong "thành phần", mà "cách dùng" thì trống. '
               + 'Chuyển sang đúng ô — xoá suông là mất thông tin.',
        nang: false,
      });
    }
  }

  return ra;
}
