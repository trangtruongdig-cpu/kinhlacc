---
type: preference
provenance: source
origin: javis-learned
created: 2026-09-08
updated: 2026-09-08
---
**Năng lực đọc file phụ thuộc engine đang chạy, không phụ thuộc brain.**

Kho hội thoại `memory/conversations/vscode-YYYY-MM-DD.md` (24 ngày, 07/07-08/09/2026,
392 tin nhắn do chính người dùng viết) nằm sẵn trong vault. Ngày 2026-09-08, engine
**openrouter (API)** không có tool đọc file nên báo là không truy xuất được nội dung gốc;
**cùng ngày, engine Claude Code đọc trọn 24 file và consolidate bình thường.**

**Áp dụng:** việc nào cần đọc/ghi file hàng loạt trong vault thì giao cho engine CLI
(Claude Code, Codex, Grok Build, Antigravity). Nếu engine hiện tại thiếu tool, **nói thẳng là
thiếu tool và dừng, đừng bịa nội dung file** - và đừng kết luận rằng dữ liệu không tồn tại.
