/**
 * Phép dò rác ký tự trên MỘT chuỗi. Hàm thuần, không I/O — để test chạy không cần database.
 *
 * Logic chép từ `backend/sql/audit-rac-tu-dien.sql` (bản SQL chỉ đọc, dò 6 dạng D1–D6).
 * Giữ hai bản là cố ý: bản SQL để rà toàn kho bằng psql khi cần con số tổng, bản này để
 * ghi nhận xét kèm TRÍCH DẪN cho từng mục.
 */

export type MaLoiChu =
  | 'rac_nhi_phan'
  | 'dau_thanh_hong'
  | 'chu_han_chua_dich'
  | 'mojibake'
  | 'tcvn3'
  | 'dau_cau_sai';

export interface LoiChu {
  ma: MaLoiChu;
  /** Nguyên văn câu chứa lỗi — thứ giữ cho lời phê kiểm chứng được. */
  trichDan: string;
  viTri: number;
}

/** Cắt chuỗi thành câu để trích dẫn gọn. Xuống dòng cũng tính là hết câu. */
function cacCau(s: string): Array<{ cau: string; tu: number }> {
  const ra: Array<{ cau: string; tu: number }> = [];
  const re = /[^.!?\n]+[.!?]?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const cau = m[0].trim();
    if (cau) ra.push({ cau, tu: m.index });
  }
  return ra.length ? ra : [{ cau: s.trim(), tu: 0 }];
}

// D5 — mojibake: dấu tiếng Việt UTF-8 bị đọc như Latin-1 ("Triá»‡u chá»©ng").
const RE_MOJIBAKE = /Ã.|á»./;

// D6 — TCVN3/ABC: chữ hoa Latin-1 lọt vào giữa từ tiếng Việt ("NguyÔn Ngäc").
const RE_TCVN3 = /[a-zà-ỹ][ÔÕÖÐÝÞßäëïöüÿ]|[ÔÕÖÐÝÞßäëïöüÿ][a-zà-ỹ]/;

// D2 — dấu thanh hỏng: ký tự dấu câu Latin-1 dính liền chữ ("Ba·c hà", "tri·").
const RE_DAU_HONG = /[a-zà-ỹ][·¸¹º»¼½¾][a-zà-ỹ ]|[a-zà-ỹ][·¸¹º»¼½¾](?=\s|$)/i;

// D1 — rác nhị phân: ký tự điều khiển, hoặc bảng chữ không liên quan (Cyrillic, Armenian, Tamil).
const RE_NHI_PHAN = /[\u0000-\u0008\u000B\u000C\u000E-\u001FЀ-ӿ԰-֏஀-௿]/;

const RE_HAN = /[㐀-䶿一-鿿豈-﫿]/;
const RE_VIET = /[a-zà-ỹ]/i;

// Dấu câu: khoảng trắng đứng TRƯỚC dấu, hoặc thiếu khoảng trắng SAU dấu giữa hai chữ.
const RE_DAU_CAU = /\s+[,;:.!?]|[,;](?=\S)/;

export function doChu(s: string): LoiChu[] {
  if (typeof s !== 'string' || !s.trim()) return [];
  const ra: LoiChu[] = [];

  for (const { cau, tu } of cacCau(s)) {
    const them = (ma: MaLoiChu) => ra.push({ ma, trichDan: cau, viTri: tu });

    if (RE_NHI_PHAN.test(cau)) them('rac_nhi_phan');
    if (RE_MOJIBAKE.test(cau)) them('mojibake');
    if (RE_TCVN3.test(cau)) them('tcvn3');
    if (RE_DAU_HONG.test(cau)) them('dau_thanh_hong');

    // Chữ Hán CHỈ là lỗi khi lẫn trong câu tiếng Việt. Cả câu là chữ Hán thì đó là
    // tên Hán hợp lệ (ten_han, ten_pinyin) — đã đo: 832 dòng hợp lệ, đừng báo nhầm.
    if (RE_HAN.test(cau) && RE_VIET.test(cau)) them('chu_han_chua_dich');

    if (RE_DAU_CAU.test(cau)) them('dau_cau_sai');
  }
  return ra;
}
