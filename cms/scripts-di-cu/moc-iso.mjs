// moc-iso.mjs — Cách DUY NHẤT được phép sinh mốc thời gian từ SQL trong thư mục này.
//
// ĐỪNG viết `now()` hay `CURRENT_TIMESTAMP` vào cột thời gian của EmDash. Mọi cột ấy
// đều là **TEXT**, nên Postgres không báo lỗi — nó chỉ lặng lẽ ép timestamptz thành
//
//     2026-09-25 14:56:41.321454+00
//
// trong khi EmDash luôn ghi bằng `toISOString()`:
//
//     2026-09-25T14:56:41.321Z
//
// Dấu cách thay cho `T`, và `+00` thiếu phút. Vết thương ngủ yên cho tới lúc người biên
// tập bấm **Publish**: `publish()` đọc lại `published_at` cũ, cho qua `normalizeDatetime`,
// và nhận về "Datetime ... is not a valid ISO 8601 datetime". Câu đó không nhắc tới mục
// nào, nên rất dễ đoán nhầm sang trùng slug.
//
// Giá đã trả: 18.205 mục ở 5 bộ (25/09/2026) nằm ngoài tầm với của nút Publish, phát
// hiện ra sau đó một ngày, phải vá 55.274 giá trị.
//
// `clock_timestamp()` chứ không phải `now()`: `now()` đứng im suốt một giao dịch, nên cả
// lô 200 mục nhận cùng một mốc tới từng micro giây. Không sai, nhưng mất luôn thứ tự
// nạp — thứ đôi khi là manh mối duy nhất khi lần lại một lô hỏng.
//
// Công thức này chính là DEFAULT mà EmDash tự khai cho các bảng mới nhất của họ
// (`_emdash_media_usage_work`…), nên nó là dạng bản thân EmDash muốn, không phải tôi tự đặt.
//
// Chốt: node scripts-di-cu/kiem-moc-thoi-gian.mjs
export const SQL_MOC_ISO = `to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
