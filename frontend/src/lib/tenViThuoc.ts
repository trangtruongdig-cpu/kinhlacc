// ═══════════════════════════════════════════════════════════════════════════
// CHUẨN HOÁ TÊN VỊ THUỐC — dùng chung mọi nơi cần so tên vị.
//
// Không chỉ là bỏ dấu. Hai thứ hay làm hỏng phép so:
//   ① cách bào chế đứng cả TRƯỚC lẫn SAU tên: "Chích cam thảo" = "Cam thảo chích" = "Cam thảo";
//   ② một vị có hai tên lưu hành: "Thược dược" (thời Trọng Cảnh) = "Bạch thược" (nay).
// Thiếu hai bước này thì cùng một vị bị coi là hai, bài giống hệt nhau bị chấm là lệch, và liều cổ
// phương không gán được vào vị tương ứng trong kho.
//
// Bản song sinh ở backend: `backend/src/data/ten-vi-thuoc.ts` — sửa luật ở đây thì sửa cả bên đó,
// hai bên phải cho cùng một khoá.
// ═══════════════════════════════════════════════════════════════════════════

const BAO_CHE = 'chich|sinh|bao|sao|than|che|chung|nuong|tuoi|kho|bac|thuc|tam'
const RE_TRUOC = new RegExp(`^(?:${BAO_CHE})\\s+`)
const RE_SAU = new RegExp(`\\s+(?:${BAO_CHE})$`)

/** Hai tên cùng một vị. Chỉ ghi cặp CHẮC CHẮN — ngờ thì để lệch, đừng gộp bừa. */
const DONG_NGHIA: Record<string, string> = {
  'thuoc duoc': 'bach thuoc',
  'xich thuoc duoc': 'xich thuoc',
  'quy chi': 'que chi',
  'huong xi': 'dam dau xi',
  'dau xi': 'dam dau xi',
  'chi tu': 'son chi',
  'qua lau can': 'thien hoa phan', // cùng một vị, khác tên bộ phận dùng
  'qua de': 'diem qua doi', // 瓜蒂 — danh mục ghi theo tên đầy đủ 'Điềm qua đới'
}

/** Khoá so sánh của một tên vị thuốc. */
export function chuanTenVi(ten: string | null | undefined): string {
  let t = (ten || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  let truoc: string
  do {
    truoc = t
    t = t.replace(RE_TRUOC, '').replace(RE_SAU, '').trim()
  } while (t !== truoc)
  return DONG_NGHIA[t] ?? t
}
