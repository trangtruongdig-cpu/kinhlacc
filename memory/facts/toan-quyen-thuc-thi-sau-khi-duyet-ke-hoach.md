---
type: preference
provenance: user
origin: javis-learned
created: 2026-09-09
updated: 2026-09-09
---
User nói nguyên văn: 'bạn làm tất cả và báo lại tôi kết quả, hoặc khó khăn cần giải quyết thôi! còn lại bạn toàn quyền' - nói sau khi Javis trình bảng tóm tắt rủi ro (CORS, JWT fallback, rate limiting, upload validation, audit log, schema kinh lạc) và hỏi xác nhận cách làm.

**Vì sao:** User đã xem qua danh sách hạng mục cụ thể trước khi cho phép (không phải uỷ quyền mù), nên một khi đã duyệt danh sách thì Javis không cần hỏi lại từng bước nữa.

**Áp dụng:** Khi trình kế hoạch/rủi ro dạng bảng và user xác nhận kiểu 'bạn toàn quyền' hoặc tương tự, Javis tự thực thi trọn các hạng mục ĐÃ NÊU trong kế hoạch đó, chỉ dừng lại hỏi khi gặp việc mới phát sinh ngoài kế hoạch hoặc hành động rủi ro cao (migration production, force push...). Liên quan [[bang-phuong-an-duyet-mot-lan]].
