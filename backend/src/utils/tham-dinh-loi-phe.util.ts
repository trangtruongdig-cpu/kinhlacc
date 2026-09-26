import { traDieu, type BoLuatVanPhong } from './tham-dinh-luat.util';

/** Hình dạng lời phê như mô hình trả về — mọi trường đều có thể thiếu hoặc sai kiểu. */
export interface LoiPheTho {
  truong?: string;
  kieu?: string;
  trichDan?: string;
  nhanXet?: string;
  deXuat?: string;
  bacCanCu?: number;
  dieuLuat?: string;
}

/** Lời phê đã qua rào chắn, sẵn sàng ghi vào bệnh án. */
export interface LoiPheSach {
  truong: string | null;
  kieu: string;
  trichDan: string;
  nhanXet: string;
  deXuat: string | null;
  bacCanCu: number;
  dieuLuat: string | null;
}

export interface KetQuaLoc {
  nhan: LoiPheSach[];
  /** Giữ lại cái bị loại kèm lý do — đó là số liệu để chỉnh lời nhắc, đừng vứt đi. */
  loai: Array<{ lyDo: string; tho: LoiPheTho }>;
}

const TRAN_NHAN_XET = 1000;
const TRAN_DE_XUAT = 4000;

/**
 * Bóc JSON khỏi phản hồi. Mô hình hay bọc trong khối ``` dù lời nhắc bảo đừng, và hay
 * kèm một câu dẫn trước.
 *
 * Trả null thay vì ném lỗi: một mục hỏng không được làm sập cả ca 100 mục.
 */
export function bocJson(s: string): unknown {
  if (typeof s !== 'string' || !s.trim()) return null;

  const khoi = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const ungVien = [khoi?.[1], s].filter((x): x is string => typeof x === 'string');

  for (const u of ungVien) {
    const t = u.trim();
    try {
      return JSON.parse(t);
    } catch {
      // Cắt từ dấu mở đầu tiên tới dấu đóng cuối — vớt được ca "Kết quả: [...]".
      const dau = t.search(/[[{]/);
      const cuoi = Math.max(t.lastIndexOf(']'), t.lastIndexOf('}'));
      if (dau >= 0 && cuoi > dau) {
        try {
          return JSON.parse(t.slice(dau, cuoi + 1));
        } catch {
          /* thử ứng viên tiếp theo */
        }
      }
    }
  }
  return null;
}

/** Gộp khoảng trắng để so trích dẫn: mô hình hay đổi xuống dòng thành dấu cách. */
function gonTrang(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Bốn rào chắn, theo thứ tự:
 *   1. Có trích dẫn.
 *   2. Trích dẫn KHỚP NGUYÊN VĂN một chỗ nào đó trong thân bài. Đây là thứ duy nhất
 *      phân biệt "đọc rồi phê" với "bịa" — mô hình bịa thì bịa cả câu trích.
 *   3. Bậc căn cứ thuộc {1, 3}. Bậc 2 (y văn từ trí nhớ mô hình) bị CẤM.
 *   4. Lời phê có trỏ điều luật thì điều đó phải CÓ THẬT trong bộ luật.
 */
export function locLoiPhe(
  tho: unknown,
  truong: Record<string, string>,
  luat: BoLuatVanPhong,
): KetQuaLoc {
  const ra: KetQuaLoc = { nhan: [], loai: [] };
  if (!Array.isArray(tho)) return ra;

  const goiY = Object.entries(truong).map(([ten, chu]) => ({ ten, gon: gonTrang(chu) }));

  for (const x of tho as LoiPheTho[]) {
    if (!x || typeof x !== 'object') {
      ra.loai.push({ lyDo: 'không phải đối tượng', tho: x });
      continue;
    }

    const trich = typeof x.trichDan === 'string' ? x.trichDan.trim() : '';
    if (!trich) {
      ra.loai.push({ lyDo: 'thiếu trích dẫn', tho: x });
      continue;
    }

    // Tìm khắp thân bài, không chỉ trường mô hình khai: nó hay ghi sai tên trường mà
    // câu trích thì đúng. Trường thật lấy theo chỗ tìm thấy.
    const gonTrich = gonTrang(trich);
    const trungO = goiY.find((g) => g.gon.includes(gonTrich));
    if (!trungO) {
      ra.loai.push({ lyDo: 'trích dẫn không khớp nguyên văn trong thân bài', tho: x });
      continue;
    }

    const bac = typeof x.bacCanCu === 'number' ? x.bacCanCu : 1;
    if (bac !== 1 && bac !== 3) {
      ra.loai.push({ lyDo: `bậc căn cứ ${bac} không được phép`, tho: x });
      continue;
    }

    const maLuat = typeof x.dieuLuat === 'string' ? x.dieuLuat.trim() : '';
    if (maLuat && !traDieu(luat, maLuat)) {
      ra.loai.push({ lyDo: `điều luật "${maLuat}" không có trong bộ luật`, tho: x });
      continue;
    }

    ra.nhan.push({
      truong: trungO.ten,
      kieu: (typeof x.kieu === 'string' && x.kieu.trim()) || 'nhan_xet_chung',
      trichDan: trich.slice(0, 2000),
      nhanXet: (typeof x.nhanXet === 'string' ? x.nhanXet : '').trim().slice(0, TRAN_NHAN_XET),
      deXuat: typeof x.deXuat === 'string' && x.deXuat.trim()
        ? x.deXuat.trim().slice(0, TRAN_DE_XUAT)
        : null,
      bacCanCu: bac,
      dieuLuat: maLuat ? traDieu(luat, maLuat)!.ma : null,
    });
  }

  return ra;
}
