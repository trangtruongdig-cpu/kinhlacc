---
type: decision
provenance: user
origin: javis-learned
created: 2026-09-09
updated: 2026-09-09
---
User phê bình cách làm CSDL trước đây của dự án: 'trước đây làm đến đâu phát sinh vấn đề rồi mới mở rộng cơ sở dữ liệu hoặc thu hẹp mà không tính đến bài toán tổng thể'. Yêu cầu mới: phân tích lại toàn bộ CSDL xem bảng/cột nào thừa, nào thiếu, tối ưu cho phù hợp với toàn bộ workflow nghiệp vụ (đo kinh lạc → chẩn đoán → pháp trị → lưu lịch sử).

**Vì sao:** Cách làm phản ứng từng phần trước đây khiến schema rời rạc, khó tối ưu vì thiếu cái nhìn tổng thể ngay từ đầu.

**Áp dụng:** Trước khi thêm/sửa bảng mới cho kinhlacc, ưu tiên đối chiếu với bức tranh ERD tổng thể (đã giao agent khám phá schema ngày 2026-09-09) thay vì thêm bảng đơn lẻ theo từng ticket. Liên quan [[tu-duy-truoc-khi-code]], [[lam-tu-de-den-kho]].
