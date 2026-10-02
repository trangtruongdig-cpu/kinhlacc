// Trần và tập hằng của tầng chiến lược — tệp này KHÔNG import gì.
//
// Tách ra khỏi `viec.mjs` ngày 02/10/2026 để cắt một vòng import thật: `ca-radar.mjs` →
// `ai/tu-lap-chien-luoc.mjs` → `chien-luoc/khuon.mjs` → `chien-luoc/viec.mjs` → … →
// `ca-radar.mjs`. Vòng đó làm `khuon.mjs` đọc `TRAN_HUONG_MOI_LUOT` khi `viec.mjs` chưa khởi
// tạo xong, và lỗi ra là `ReferenceError: Cannot access … before initialization` ở chỗ CHẲNG
// LIÊN QUAN — ba tệp phép kiểm chết hẳn lúc nạp, không phải một phép kiểm đỏ.
//
// `viec.mjs` vẫn xuất lại các tên này nên mọi chỗ gọi cũ không phải sửa.
export const TRAN_HUONG_MOI_LUOT = 8;
export const TRAN_CUM_MOI_LUOT = 20;
export const TRAN_KE_HOACH_MOI_LUOT = 10;
export const SO_BAI_DOI_THU_TOI_THIEU = 3;
export const SO_LINK_DICH_TOI_THIEU = 5;
/** Ý định tìm kiếm của bài dự kiến: tra cứu / tìm hiểu / so sánh / hướng dẫn. */
export const Y_DINH = ["tra_cuu", "tim_hieu", "so_sanh", "huong_dan"];
