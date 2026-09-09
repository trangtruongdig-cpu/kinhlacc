---
type: reference
provenance: assistant
origin: javis-learned
created: 2026-09-09
updated: 2026-09-09
---
Khi viết migration `add-patient-audit-log.sql`, giả định ban đầu id kiểu INT cho cả hai bảng bị lỗi ngay khi chạy vì `admins.id` thực tế là UUID còn `patients.id` là INT. Bài học: trước khi viết FK/JOIN giữa hai bảng phải `\d ten_bang` kiểm kiểu cột thật, đừng suy đoán.
