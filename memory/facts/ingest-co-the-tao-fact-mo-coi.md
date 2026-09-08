---
type: reference
provenance: assistant
origin: javis-learned
created: 2026-09-08
updated: 2026-09-08
---
Đợt ingest transcript VS Code (07/07–08/09/2026) đã tạo 40 file `memory/facts/*.md` đúng chuẩn (frontmatter, why/how, wikilink chéo), nhưng 13/40 file không có dòng chỉ mục tương ứng trong `memory/MEMORY.md`. Vì MEMORY.md là thứ được nạp vào context mỗi câu hỏi (không phải glob thư mục facts/), 13 fact này coi như vô hình dù đã ghi đúng chuẩn.

**Vì sao:** quy trình ingest hàng loạt (nhiều file cùng lúc) dễ bỏ sót bước cuối "thêm dòng vào MEMORY.md" vì nó tách rời khỏi bước ghi file fact.

**Áp dụng:** sau bất kỳ đợt ingest/consolidate nào tạo nhiều file `memory/facts/*.md`, PHẢI đối chiếu số file với số dòng trong MEMORY.md trước khi coi là xong. Dùng skill [[audit-memory-index]] cho việc này.
