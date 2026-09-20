/**
 * CHUẨN HOÁ TÊN VỊ THUỐC — nguồn duy nhất phía backend.
 *
 * Không chỉ là bỏ dấu. Ba thứ làm hỏng phép so tên vị:
 *   ① cách bào chế đứng cả TRƯỚC lẫn SAU: "Chích cam thảo" = "Cam thảo chích" = "Cam thảo";
 *   ② một vị hai tên lưu hành: "Thược dược" (Trọng Cảnh) = "Bạch thược" (nay);
 *   ③ tên bộ phận dùng khác nhau: "Qua lâu căn" chính là "Thiên hoa phấn".
 * Thiếu chúng thì cùng một vị bị coi là hai — bài giống hệt nhau bị chấm lệch, liều cổ phương không
 * gán được, và dò bài vào kho báo "danh mục chưa có vị" dù vị ấy đang nằm sẵn trong danh mục.
 *
 * Bản song sinh phía frontend: `frontend/src/lib/tenViThuoc.ts` — sửa luật ở đây thì sửa cả bên đó,
 * hai bên phải cho cùng một khoá.
 */

const BAO_CHE = 'chich|sinh|bao|sao|than|che|chung|nuong|tuoi|kho|bac|thuc|tam';
const RE_TRUOC = new RegExp(`^(?:${BAO_CHE})\\s+`);
const RE_SAU = new RegExp(`\\s+(?:${BAO_CHE})$`);

/** Hai tên cùng một vị. Chỉ ghi cặp CHẮC CHẮN — ngờ thì để lệch, đừng gộp bừa. */
export const DONG_NGHIA_VI: Record<string, string> = {
  'thuoc duoc': 'bach thuoc',
  'xich thuoc duoc': 'xich thuoc',
  'quy chi': 'que chi',
  'huong xi': 'dam dau xi',
  'dau xi': 'dam dau xi',
  'chi tu': 'son chi',
  'qua lau can': 'thien hoa phan',
  'qua de': 'diem qua doi', // 瓜蒂 — danh mục ghi theo tên đầy đủ 'Điềm qua đới'
};

/** Khoá so sánh của một tên vị thuốc. */
export function chuanTenVi(ten: string | null | undefined): string {
  let t = (ten || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  let truoc: string;
  do {
    truoc = t;
    t = t.replace(RE_TRUOC, '').replace(RE_SAU, '').trim();
  } while (t !== truoc);
  return DONG_NGHIA_VI[t] ?? t;
}
