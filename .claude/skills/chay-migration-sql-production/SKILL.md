---
name: "Chạy Migration SQL Lên Production"
description: "Chạy migration SQL lên Postgres production (Aiven) từ máy local qua psql - kiểm kiểu cột thực tế trước khi ALTER, backfill, verify kết quả."
group: "Operations"
origin: javis-learned
status: active
created: 2026-09-09
---
## Khi nào dùng
- Cần áp SQL migration (ALTER/CREATE/backfill) trực tiếp lên Postgres production (vd Aiven) từ máy local, không qua VPS.
- Có file .sql trong `backend/sql/` viết dựa trên giả định về kiểu cột nhưng chưa đối chiếu dữ liệu thực tế đang chạy.
- Cần backfill dữ liệu từ cột JSONB cũ sang cột riêng mới rồi kiểm số bản ghi.

## Chuẩn bị
- Đọc `DATABASE_URL`/`POSTGRES_URL` (hoặc bộ `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`) trong `backend/.env` - đây là credential thật lên production.
- Kiểm `psql` đã có chưa (`which psql`). Nếu chưa, cài qua `brew install libpq` (keg-only, không tự thêm PATH) rồi gọi thẳng bằng đường dẫn đầy đủ tới binary trong Cellar/opt.
- Đọc cấu hình kết nối DB trong `AppModule`/TypeORM để biết app có set `ssl: { rejectUnauthorized: false }` không - nếu có thì chỉ cần nối `?sslmode=require` vào connection string, KHÔNG cần tách CA cert riêng.

## Cách chạy
```
psql "$DATABASE_URL?sslmode=require" -f backend/sql/ten-file.sql
```
(thay `psql` bằng đường dẫn đầy đủ nếu brew cài keg-only, vd `$(brew --prefix libpq)/bin/psql`)

## Quy trình
1. TRƯỚC khi chạy ALTER/CREATE: query thử vài dòng dữ liệu thực (`SELECT ... LIMIT 5`) và kiểu cột thực (`\d ten_bang` hoặc `information_schema.columns`) của MỌI bảng liên quan - đừng tin giả định trong file .sql viết trước đó.
2. Nếu phát hiện lệch (cột định nghĩa INT nhưng dữ liệu là số thực như 33.2, hoặc khoá ngoại UUID nối vào INT) → sửa lại file .sql trong repo cho khớp thực tế TRƯỚC khi chạy, đừng chạy bản cũ rồi vá sau.
3. Chạy migration tạo bảng/cột mới trước, backfill dữ liệu sau, cuối cùng mới tạo index.
4. Sau backfill, verify bằng `SELECT count(*)` so với số bản ghi nguồn.
5. Tạo index xong, verify tổng số index (vd `information_schema` hoặc `\di`).
6. Build lại backend (`npm run build`) để chắc entity TypeORM vẫn khớp schema mới.
7. Commit file .sql ĐÃ SỬA (không phải bản gốc sai) kèm code liên quan, push lên `main`.

## Bẫy
- Tên cột camelCase của TypeORM (vd `inputData`) khi viết SQL thô phải bọc trong ngoặc kép `"inputData"`, không quote thì Postgres tự hạ thường và báo "column does not exist".
- Kiểu khoá chính khác nhau giữa các bảng (vd `admins.id` UUID, `patients.id` INT) - JOIN/FK sai kiểu lỗi ngay khi migrate, phải kiểm trước.
- Dữ liệu đo lường tưởng số nguyên nhưng thực tế số thực (vd giá trị đo kinh lạc dạng mV như 33.2, 32.3) - cột phải NUMERIC(6,2), không phải INT, không sẽ mất phần thập phân khi backfill.

## Kiểm chứng
- Đếm bản ghi sau backfill phải khớp số dòng nguồn (vd 9.499 bản ghi).
- `npm run build` sạch, không lỗi kiểu dữ liệu giữa entity và cột DB.
- Đếm tổng số index trên bảng liên quan để chắc không thiếu/lặp.
