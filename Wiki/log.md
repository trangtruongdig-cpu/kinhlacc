
## [2026-09-16] architecture | Mẫu Kiến Trúc Đặt Lịch Realtime
- Vấn đề: Trùng lịch do Race Condition, và Giao diện Khách hàng load chậm do phụ thuộc API.
- Giải pháp: Chưng cất quy tắc sử dụng Pessimistic Lock ở DB và truyền Payload (Zero-Request Push) qua kênh SSE để ép Reactivity bằng `splice()` trong Vue3.
- Kết quả: Tạo bài `[[Mẫu Kiến Trúc Đặt Lịch Realtime]]`. Cập nhật `[[index]]`.