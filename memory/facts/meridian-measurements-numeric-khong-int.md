---
type: decision
provenance: assistant
origin: javis-learned
created: 2026-09-09
updated: 2026-09-09
---
File SQL nháp ban đầu định nghĩa các cột đo kinh lạc (24 trường tên kinh) là INT, nhưng dữ liệu thực trong `inputData` (JSONB cũ) toàn số thực dạng mV như 33.2, 32.3. Đã sửa `backend/sql/add-meridian-measurements.sql` sang NUMERIC(6,2), backfill lại 9.499 bản ghi và verify count khớp.
