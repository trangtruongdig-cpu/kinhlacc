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

/** Tra cứu tên mục từ theo cụm chữ đã chuẩn hoá. */
export interface ChiMucTen {
  khop(cum: string): { bo: string; slug: string; tieuDe: string } | null;
}

/**
 * Chuẩn hoá MẠNH: bỏ dấu thanh và mọi dấu câu.
 * Cùng lối với khoá tra cứu chéo đã dùng ở tầng từ điển — nhờ nó "Trúc Nhự Thang-…" và
 * "Trúc Nhự Thang – …" cùng trỏ một mục.
 */
function chuanHoaTen(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dungChiMucTen(
  muc: Array<{ bo: string; slug: string; tieuDe: string }>,
): ChiMucTen {
  const bang = new Map<string, { bo: string; slug: string; tieuDe: string }>();
  for (const m of muc) {
    const k = chuanHoaTen(m.tieuDe);
    if (k && !bang.has(k)) bang.set(k, m);
  }
  return {
    khop(cum: string) {
      return bang.get(chuanHoaTen(cum)) ?? null;
    },
  };
}

/** Số từ tối đa của một tên vị thuốc — quét cửa sổ tới ngần này rồi thôi. */
const TOI_DA_TU_TEN = 4;

/** Liều lượng và chữ nối — không phải tên vị, và cũng cắt đôi hai tên đứng cạnh nhau. */
const RE_BO_QUA = /^\d|^(g|gam|chi|lang|va|voi)$/i;

/**
 * Quét một chuỗi, nhặt ra các cụm khớp tên mục từ trong kho, ưu tiên cụm DÀI NHẤT.
 *
 * Quét dài nhất trước là bắt buộc: thành phần bài thuốc hay ghi liền không phân cách
 * ("Bạch chỉ Bán hạ Cam thảo Độc hoạt"), tách theo dấu cách thì không ra vị nào.
 *
 * Phần KHÔNG khớp trả về theo CỤM LIỀN KỀ, không theo từ lẻ: tên vị tiếng Việt hầu hết
 * hai chữ, nên lọc từng từ một thì "Hoàng kỳ" chỉ còn "Hoàng" — vừa mất nghĩa vừa không
 * tra ngược được vào sách.
 */
function quetTen(
  s: string,
  chiMuc: ChiMucTen,
): { khop: Array<{ cum: string; muc: { bo: string; slug: string; tieuDe: string } }>; du: string[] } {
  const tu = s.split(/\s+/).filter(Boolean);
  const khop: Array<{ cum: string; muc: { bo: string; slug: string; tieuDe: string } }> = [];
  const du: string[] = [];
  let dang: string[] = [];
  let i = 0;

  const chot = () => {
    if (dang.length) du.push(dang.join(' '));
    dang = [];
  };

  while (i < tu.length) {
    let trung: { dai: number; muc: { bo: string; slug: string; tieuDe: string }; cum: string } | null = null;
    for (let d = Math.min(TOI_DA_TU_TEN, tu.length - i); d >= 1; d--) {
      const cum = tu.slice(i, i + d).join(' ');
      const m = chiMuc.khop(cum);
      if (m) {
        trung = { dai: d, muc: m, cum };
        break;
      }
    }
    if (trung) {
      chot();
      khop.push({ cum: trung.cum, muc: trung.muc });
      i += trung.dai;
    } else {
      // Liều lượng ngắt cụm: "Cam thảo 4g Hoàng kỳ" là hai tên, không phải một.
      if (RE_BO_QUA.test(tu[i])) chot();
      else dang.push(tu[i]);
      i++;
    }
  }
  chot();
  return { khop, du };
}

/**
 * Dò liên kết hụt. Hai loại phát hiện, đều là đầu vào cho bậc 1 của lớp thầy thuốc:
 *   · `lien_ket_dung_duoc` — mục khác trong kho nói về đúng thứ bài này nhắc tới
 *   · `ten_vi_la` — tên vị không khớp mục nào: hoặc viết sai, hoặc kho thiếu vị đó
 */
export function doLienKet(m: MucKho, chiMuc: ChiMucTen): NhanXetTho[] {
  const ra: NhanXetTho[] = [];
  const tp = m.truong['thanh_phan'];
  if (!tp || !tp.trim()) return ra;

  const { khop, du } = quetTen(tp, chiMuc);
  const khac = khop.filter((k) => !(k.muc.bo === m.bo && k.muc.slug === m.slug));

  if (khac.length) {
    ra.push({
      kieu: 'lien_ket_dung_duoc',
      truong: 'thanh_phan',
      trichDan: khac.map((k) => k.cum).join(' · '),
      nhanXet:
        `${khac.length} vị trong bài có mục riêng trong kho — nối được, và đủ căn cứ để dựng ` +
        `phần phân tích mà không cần viết thêm chữ nào từ ngoài.`,
      nang: false,
    });
  }

  // Cụm chữ còn lại đủ dài để là tên vị mà không khớp mục nào.
  const nghi = du.filter((t) => t.length >= 3);
  if (nghi.length) {
    ra.push({
      kieu: 'ten_vi_la',
      truong: 'thanh_phan',
      trichDan: nghi.slice(0, 12).join(' · '),
      nhanXet:
        'Có chữ trong thành phần không khớp mục dược liệu nào: hoặc tên viết sai, ' +
        'hoặc kho thiếu vị đó. Cần người đối chiếu sách.',
      nang: false,
    });
  }

  return ra;
}
