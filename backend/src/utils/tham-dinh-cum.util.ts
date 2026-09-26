import { createHash } from 'crypto';
import type { NhanXetTho } from './tham-dinh-muc.util';

export interface NhanXetCoMuc extends NhanXetTho {
  bo: string;
  slug: string;
  tieuDe: string;
}

export interface CumViec {
  kieu: string;
  bo: string;
  /** Đường của BỘ, không kèm slug — xem ghi chú dưới. */
  route: string;
  thongDiep: string;
  moTa: string;
  soMuc: number;
  nang: boolean;
  slugs: string[];
}

/** Thân cụm chỉ liệt kê tối đa ngần này slug; phần còn lại đếm số. */
const TRAN_SLUG = 200;

const NHAN_KIEU: Record<string, string> = {
  rac_nhi_phan: 'Còn rác nhị phân trong nội dung',
  dau_thanh_hong: 'Dấu thanh tiếng Việt bị hỏng',
  chu_han_chua_dich: 'Chữ Hán chưa dịch lẫn trong câu tiếng Việt',
  mojibake: 'Lỗi mã hoá mojibake',
  tcvn3: 'Còn bảng mã TCVN3 chưa chuyển',
  dau_cau_sai: 'Lỗi dấu câu',
  thieu_truong: 'Thiếu phần nội dung',
  thieu_truong_cot_loi: 'Thiếu phần cốt lõi',
  tron_truong: 'Nội dung nằm sai ô',
  lien_ket_dung_duoc: 'Nối được sang mục khác trong kho',
  ten_vi_la: 'Tên vị không khớp mục dược liệu nào',
};

function nhan(kieu: string, truong: string | null): string {
  const g = NHAN_KIEU[kieu] || kieu;
  return truong ? `${g} — ${truong}` : g;
}

/**
 * Gom nhận xét lẻ thành CỤM VIỆC.
 *
 * ⚠️ `route` là đường của BỘ ("/huyet/"), tuyệt đối không kèm slug. Vân tay cụm của tab
 * Góp Ý & Lỗi là sha1(loai|route_chuan|thong_diep_chuan), mà `chuanHoaRoute` chỉ thay SỐ
 * bằng ":id" — slug chữ giữ nguyên. Kèm slug vào thì 484 mục huyệt thành 484 cụm, đúng
 * thứ cơ chế vân tay dựng ra để chặn.
 */
export function gomCum(
  ds: NhanXetCoMuc[],
  duongDanBo: Record<string, string>,
): CumViec[] {
  const gom = new Map<string, { nx: NhanXetCoMuc[]; nang: boolean }>();

  for (const n of ds) {
    const khoa = `${n.bo}|${n.kieu}|${n.truong ?? ''}`;
    const o = gom.get(khoa) || { nx: [], nang: false };
    o.nx.push(n);
    o.nang = o.nang || n.nang;
    gom.set(khoa, o);
  }

  const ra: CumViec[] = [];
  for (const [khoa, o] of gom) {
    const [bo, kieu, truong] = khoa.split('|');
    const slugs = [...new Set(o.nx.map((x) => x.slug))];
    const viDu = o.nx.find((x) => x.trichDan)?.trichDan;

    ra.push({
      kieu,
      bo,
      route: duongDanBo[bo] || `/${bo}/`,
      thongDiep: nhan(kieu, truong || null),
      moTa:
        `${slugs.length} mục trong bộ "${bo}".\n` +
        (viDu ? `Ví dụ: "${viDu.slice(0, 200)}"\n` : '') +
        (slugs.length > TRAN_SLUG ? `(liệt kê ${TRAN_SLUG} mục đầu)\n` : ''),
      soMuc: slugs.length,
      nang: o.nang,
      slugs: slugs.slice(0, TRAN_SLUG),
    });
  }

  // Nặng trước, rồi nhiều mục trước — đó là thứ tự đáng làm.
  return ra.sort((a, b) => Number(b.nang) - Number(a.nang) || b.soMuc - a.soMuc);
}

/**
 * Vân tay nội dung — van tiết kiệm tiền của lớp 2: bài chưa đổi thì không gọi mô hình.
 * Chỉ tính trên các cột khai là thân bài, theo thứ tự cố định để không phụ thuộc thứ tự khoá.
 */
export function vanTayNoiDung(truong: Record<string, string>, than: string[]): string {
  const noi = [...than]
    .sort()
    .map((t) => `${t}=${(truong[t] || '').trim()}`)
    .join('\u0001');
  return createHash('sha1').update(noi).digest('hex').slice(0, 16);
}
