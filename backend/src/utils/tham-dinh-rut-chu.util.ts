/**
 * Rút chữ thuần từ một giá trị JSON của kho nội dung.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `td_chu()` CỦA CSDL: hàm đó viết cho chỉ mục tra cứu và chỉ nhặt
 * khoá `text` (hình Portable Text). Gặp MẢNG OBJECT hình khác nó trả rỗng — không lỗi,
 * không cảnh báo. Đo thật 26/09/2026: `ec_bai_thuoc.thanh_phan` có 13.889 bài mang dữ
 * liệu `[{id, ten, lieu}, …]`, td_chu rút ra đúng 0 chữ.
 *
 * Bot không chịu được giới hạn đó: nó sẽ phán "thiếu thành phần" cho gần 14.000 bài thuốc
 * và bỏ lỡ toàn bộ phép dò liên kết. Nên bot có bộ rút chữ riêng, đi hết mọi tầng và nhặt
 * MỌI giá trị chuỗi/số, trừ các khoá kỹ thuật.
 *
 * Vẫn khớp `td_chu` ở hình Portable Text — chỗ nào td_chu rút được thì hàm này rút y hệt.
 */

/** Khoá của lớp lưu trữ, không phải nội dung người đọc. */
const KHOA_KY_THUAT = new Set([
  '_type', '_key', '_ref', 'marks', 'markDefs', 'style', 'listItem', 'level', 'id', 'slug',
]);

function di(v: unknown, ra: string[]): void {
  if (v === null || v === undefined) return;

  if (typeof v === 'string') {
    const s = v.trim();
    if (s) ra.push(s);
    return;
  }
  if (typeof v === 'number' || typeof v === 'boolean') {
    ra.push(String(v));
    return;
  }
  if (Array.isArray(v)) {
    for (const x of v) di(x, ra);
    return;
  }
  if (typeof v === 'object') {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (KHOA_KY_THUAT.has(k)) continue;
      di(x, ra);
    }
  }
}

export function rutChu(v: unknown): string {
  const ra: string[] = [];
  di(v, ra);
  // Nối bằng khoảng trắng rồi trim: KHÔNG bao giờ trả chuỗi toàn khoảng trắng, vì
  // "có nội dung nhưng toàn trắng" lọt qua mọi phép kiểm rỗng và thành bẫy im lặng.
  return ra.join(' ').replace(/\s+/g, ' ').trim();
}
