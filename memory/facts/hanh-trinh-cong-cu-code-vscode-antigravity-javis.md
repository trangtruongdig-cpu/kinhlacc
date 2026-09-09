---
type: decision
provenance: user
origin: transcript-mixed
created: 2026-09-09
updated: 2026-09-09
source: [[conversations/vscode-2026-08-03]], [[conversations/2026-08-12]]
---
**Người dùng đã lần lượt/song song dùng 3 bề mặt AI-code khác nhau trên cùng repo
kinhlacc:** VS Code + Claude Code (từ 07/07/2026), rồi thêm Antigravity IDE chạy song song
("tôi đã code trên antigravity thêm các phần mới bạn cập nhật" - 03/08), rồi cài Javis OS
(12/08) và thử coi Javis dashboard là kênh chính: "tôi vừa chuyển từ vs code và antigravity
lên đây dùng bạn để thay thế công việc tư duy và code của tôi hàng ngày" (12/08 23:15).

**Trên thực tế đây không phải một cuộc chuyển hẳn.** Transcript VS Code (`vscode-*.md`)
vẫn tiếp tục dày đặc sau ngày 12/08 (08/13, 08/18, 08/23, 08/26, 09/06, 09/07, 09/08), tức
là người dùng vẫn dùng VS Code + Claude Code làm nơi code chi tiết/nặng, còn Javis dashboard
đóng vai trò thêm vào (điều phối, ghi nhớ, ingest tri thức) chứ không thay thế hoàn toàn.

**Vì sao:** cả 3 bề mặt cùng sửa một working tree kinhlacc, nên đây chính là nguồn gốc của
quy ước "tiến trình song song" (xem [[commit-tru-tien-trinh-song-song]], [[nhieu-phien-cung-lam-repo]])
- không chỉ là nhiều phiên Claude Code, mà là nhiều CÔNG CỤ khác nhau cùng lúc.

**Áp dụng:** khi làm việc trong brain kinhlacc, đừng mặc định Javis dashboard là nơi duy
nhất đang sửa code - luôn kiểm `git status`/mtime trước khi commit hàng loạt, vì rất có thể
một phiên VS Code (Claude Code) hoặc Antigravity khác đang chạy song song trên cùng thư mục.
