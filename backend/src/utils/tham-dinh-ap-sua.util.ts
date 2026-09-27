/**
 * Áp bản sửa vào một giá trị JSON của kho nội dung.
 *
 * ⚠️ VÌ SAO THAY TẠI CHỖ chứ không ghi đè cả cột: `de_xuat` của bot là CHỮ THUẦN —
 * `rutChu` đã bóc sạch định dạng khi đưa bài cho mô hình đọc. Còn cột `ec_*` là JSONB
 * Portable Text với khối, span, marks. Ghi chữ thuần lên đó là xoá cấu trúc của cả mục,
 * và không lùi được trừ khi đọc lại `revisions`.
 *
 * Nên: tìm span nào chứa trích dẫn, thay đúng đoạn đó, giữ nguyên tất cả phần còn lại.
 * Không tìm thấy thì `soLanThay: 0` và bên gọi phải HUỶ giao dịch.
 */

/** Khoá của lớp lưu trữ — không phải chữ người đọc, đừng thay vào đó. */
const KHOA_KY_THUAT = new Set([
  '_type', '_key', '_ref', 'marks', 'markDefs', 'style', 'listItem', 'level', 'id', 'slug',
]);

function gon(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Thay trên MỘT chuỗi. So hai lượt: khớp thẳng trước (giữ nguyên khoảng trắng gốc), không
 * được thì so theo bản đã gộp khoảng trắng — mô hình hay đổi xuống dòng thành dấu cách khi
 * chép trích dẫn.
 */
function thayMotChuoi(chu: string, tim: string, thay: string): { ra: string; so: number } {
  if (chu.includes(tim)) {
    const so = chu.split(tim).length - 1;
    return { ra: chu.split(tim).join(thay), so };
  }
  if (gon(chu).includes(gon(tim))) {
    // Cả chuỗi (sau khi gộp) chính là trích dẫn: thay trọn. Trường hợp trích dẫn nằm giữa
    // một chuỗi có khoảng trắng lệch thì không cố đoán ranh giới — thà trả 0 còn hơn cắt sai.
    if (gon(chu) === gon(tim)) return { ra: thay, so: 1 };
  }
  return { ra: chu, so: 0 };
}

export function thayTrongJson(
  v: unknown,
  trichDan: string,
  deXuat: string,
): { ketQua: unknown; soLanThay: number } {
  if (!trichDan || !trichDan.trim()) return { ketQua: v, soLanThay: 0 };
  let dem = 0;

  const di = (x: unknown): unknown => {
    if (typeof x === 'string') {
      const { ra, so } = thayMotChuoi(x, trichDan, deXuat);
      dem += so;
      return ra;
    }
    if (Array.isArray(x)) return x.map(di);
    if (x && typeof x === 'object') {
      const ra: Record<string, unknown> = {};
      for (const [k, gt] of Object.entries(x as Record<string, unknown>)) {
        ra[k] = KHOA_KY_THUAT.has(k) ? gt : di(gt);
      }
      return ra;
    }
    return x;
  };

  const ketQua = di(v);
  return { ketQua, soLanThay: dem };
}
