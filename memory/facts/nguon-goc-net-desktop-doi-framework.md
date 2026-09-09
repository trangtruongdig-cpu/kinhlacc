---
type: business
provenance: user
origin: transcript-javis-dashboard
created: 2026-09-09
updated: 2026-09-09
source: [[conversations/2026-09-09]]
---
**Phần mềm kinhlacc ban đầu là một ứng dụng desktop chạy trên .NET**, sau đó đã qua
**nhiều lần sửa và đổi framework** cho tới kiến trúc web hiện tại (backend NestJS +
TypeORM + PostgreSQL, frontend Vue 3 + Vite).

Nguyên văn người dùng (09/09/2026): "phần mềm này ban đầu là 1 phần mềm chạy trên desktop
bằng .Net cho đến nay đã qua nhiều lần sửa và đổi farmework". Transcript trong
`memory/conversations/` chỉ bắt đầu từ 07/07/2026 (khi app đã là bản Vue+NestJS), nên các
lần đổi framework cụ thể trước đó KHÔNG có nhật ký chat để tra lại - đây là lời thuật lại
của chính người dùng, không suy ra được chi tiết từng lần chuyển đổi.

**Vì sao:** giải thích lý do CLAUDE.md ghi nhận thư mục `Kinhlac/` ở gốc repo là "legacy
Windows desktop app (.exe, .dll, .dat, reflection scripts)" - đây chính là di sản .NET đó,
lý do nó được đánh dấu "reference material only - không sửa/build/import". Cũng giải thích
vì sao nhiều đoạn chat gọi tới "app cũ" khi đối chiếu công thức/thuật toán (bảng
`legacy_meridian_syndromes` 84 chứng, logic Excel gốc) - "app cũ" ở đây có thể là bất kỳ
phiên bản tiền nhiệm nào qua các lần đổi framework, không chỉ riêng bản .NET gốc.

**Áp dụng:** khi audit hoặc đối chiếu logic chẩn đoán (bát cương, 47/84 chứng, phương
huyệt...), nhớ rằng chuẩn đối chiếu gốc có thể bắt nguồn từ thời .NET desktop, đã đi qua
nhiều lần viết lại trước khi tới bản hiện tại - ưu tiên đối chiếu CÔNG THỨC/THUẬT TOÁN
(bí mật thuật toán) hơn là tin rằng lịch sử code/git hiện có phản ánh đầy đủ ý đồ gốc.
Xem [[doi-chieu-app-cu-84-chung]], [[ke-thua-du-an-co-san-thay-vi-tu-lam]].
