/**
 * Chuẩn hóa nhãn danh mục (công dụng / chủ trị / kiêng kỵ): trim, gộp khoảng trắng liên tiếp.
 */
export function formatCatalogLabel(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Khóa so khớp trùng lặp: đã format + chữ thường (không phân biệt hoa/thường). */
export function catalogKey(raw: string): string {
  return formatCatalogLabel(raw).toLowerCase();
}
