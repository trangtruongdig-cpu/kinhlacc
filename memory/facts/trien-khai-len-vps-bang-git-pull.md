---
type: decision
provenance: user
origin: transcript-claude-code
created: 2026-09-08
updated: 2026-09-08
source: [[conversations/vscode-2026-08-23]]
---
**Bản chạy thật của kinhlacc nằm trên một VPS, cập nhật bằng `git pull`** - không phải
Vercel hay Docker như phần Deployment trong `CLAUDE.md` mô tả.

- Thư mục trên máy chủ: `root@cloud:~/kinhlacc`, tên miền `kinhlac.online`.
- Quy trình người dùng quen dùng: **commit → push lên GitHub → sang VPS `git pull`**.
  Khi người dùng nói "commit và pull" là ý này, chứ không phải `git pull` ở máy local.
- Cụm từ hay gặp: "commit tất cả những thay đổi gần đây để đưa lên vps" (27/07),
  "lệnh gì bạn nói lại rồi pate lên vps" (03/08).

**Bẫy đã xảy ra thật (23/08):** VPS có thay đổi cục bộ nên `git pull` bị chặn
("Please commit your changes or stash them before you merge. Aborting"). Cách gỡ đã dùng:
`git stash` → `git pull` → **chỉ `git stash drop` sau khi xác nhận nội dung stash không còn
cần nữa**. Triệu chứng ở phía người dùng là "đã pull lên git rồi sao vps vẫn chưa có bản
cập nhật mới".

**Áp dụng:** khi người dùng báo "trên web chưa thấy thay đổi" mà local đã đúng, kiểm VPS đã
pull chưa và có bị kẹt local changes không, trước khi nghi ngờ code. Lỗi 502 ở landing page
(09/08) cũng thuộc nhóm triệu chứng phía máy chủ này.
