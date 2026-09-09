---
name: "Rà Soát Phần Mềm Kinhlacc (3 Trục)"
description: "Rà soát backend/frontend kinhlacc theo 3 trục cố định: UX, hạ tầng-bảo mật, kế thừa dữ liệu YHHĐ; xếp hạng rủi ro và đề xuất sửa."
group: "Operations"
origin: javis-learned
status: active
created: 2026-09-09
---
## Khi nào dùng
- User yêu cầu "review toàn diện", "đánh giá phần mềm", "check app ổn không" cho dự án kinhlacc.
- Trước khi lên kế hoạch sửa lớn, cần bức tranh tổng thể theo đúng 3 trục cố định user dùng để đánh giá phần mềm này.

## Chuẩn bị
- Đọc CLAUDE.md để nắm layout repo (backend NestJS 11 + TypeORM + PostgreSQL, frontend Vue 3 + Vite, backend/sql migrations).
- Đọc fact `tieu-chi-danh-gia-phan-mem-kinhlacc` để nhớ đúng 3 trục cố định.

## Cách chạy
- Quét backend (`src/main.ts`, `app.module.ts`, routers/controllers liên quan auth-CORS-upload-rate limit) và frontend (`src/components`, `src/views`) bằng Glob/Grep; không cần chạy app để review tĩnh.

## Quy trình
1. **Trục 1 - UX/UI:** liệt kê điểm mạnh/yếu về cấu trúc component, tính nhất quán tên gọi, design system (nhớ giữ nguyên palette nâu/kem + Ngũ Hành, không đề xuất thay bằng UI framework generic).
2. **Trục 2 - Hạ tầng & bảo mật:** kiểm CORS, JWT secret fallback, rate limiting, upload validation, connection pool, structured logging.
3. **Trục 3 - Kế thừa dữ liệu YHHĐ:** kiểm schema có đủ chỗ lưu measurement/audit để suy luận bệnh Y học hiện đại từ số đo kinh lạc không.
4. Xếp hạng mức độ rủi ro (Critical/High/Medium) cho từng phát hiện kèm file:line cụ thể.
5. Trình bày kết quả theo bảng: Trục | Vấn đề | Mức | Đề xuất, rồi hỏi user muốn review-only hay review+fix trước khi tự sửa.

## Bẫy
- Đừng liệt kê phát hiện bảo mật mà không nêu file:line cụ thể - review sẽ khó verify.
- Đừng tự ý sửa code khi chưa rõ user muốn review-only hay review+fix - hỏi trước.
- Việc chạy migration SQL lên production hoặc thay đổi CORS/JWT là hành động cần user xác nhận rõ, không tự chạy khi chưa được cho toàn quyền.

## Kiểm chứng
- Sau khi sửa, chạy `npm run build` cho cả backend và frontend để chắc không vỡ; nêu rõ nếu chưa test UI thật trên trình duyệt.
