---
type: preference
provenance: user
origin: transcript-claude-code
created: 2026-09-08
updated: 2026-09-08
source: [[conversations/vscode-2026-09-08]]
---
Người dùng thường chạy **nhiều phiên Claude song song trên cùng repo**. Quy ước commit:
chỉ commit phần việc của phiên mình, **chừa phần của tiến trình song song**.

Nguyên văn: "commit cho tốt tất cả trừ tiến trình song song là nằm ngoài phần mềm"
(25/07), "commit cho tôi thay đổi này trừ tiến trình song song" (27/07), "đã xong thì
commit tiến trình này cho tôi, tiến trình song song để đó" (08/09).

**Áp dụng:** kiểm `git status` và thời điểm sửa file trước khi `git add -A`; đừng commit hộ phiên khác.
