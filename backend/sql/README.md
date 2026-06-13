# SQL thủ công

- `migrate-vi-thuoc-excel-schema.sql` — chạy trên PostgreSQL sau khi deploy code chuẩn hóa `vi_thuoc` (xóa cột YHCT cũ, thêm `nhom_lon` nếu thiếu). **Sao lưu DB trước khi chạy.**
- `create-duoc-ly-schema.sql` — tạo các bảng phân loại dược lý: `nhom_lon_duoc_ly`, `nhom_nho_duoc_ly`, `nhom_nho_vi_thuoc`, `nhom_nho_chu_tri`. Idempotent (`IF NOT EXISTS`).
- `truncate-vi-thuoc.sql` — ⚠️ **DESTRUCTIVE**. `TRUNCATE vi_thuoc, bai_thuoc RESTART IDENTITY CASCADE` — cũng wipe `bai_thuoc_chi_tiet`, `bai_thuoc_phap_tri`, `bai_thuoc_trieu_chung`, `vi_thuoc_*` link tables, `nhom_nho_vi_thuoc`. Bọc trong `BEGIN`/`COMMIT|ROLLBACK` để xác nhận trước khi commit. **Backup trước.**
- `create-seo-schema.sql` — tạo bảng cho module SEO Radar: `seo_doi_thu`, `seo_url`, `seo_cum`. Idempotent (`IF NOT EXISTS`). Cần chạy trước khi dùng trang `/app/seo`.
