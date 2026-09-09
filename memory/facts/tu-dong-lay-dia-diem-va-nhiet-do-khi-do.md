---
type: decision
provenance: user
origin: transcript-claude-code
created: 2026-09-08
updated: 2026-09-08
source: [[conversations/vscode-2026-07-31]]
---
**Không bắt người đo nhập tay Nhiệt độ MT (°C), Tỉnh/TP và Địa chỉ** trong phần đo của
bệnh nhân. Ba trường này phải **điền tự động** từ dịch vụ định vị tại địa điểm đo, theo mô hình
**hành chính 2 cấp của Việt Nam (tỉnh, xã)**, kèm nhiệt độ môi trường.

Nguyên văn (31/07): "Bởi bạn chỉ cần kết nối dịch vụ Định vị tại địa điểm đo thì bạn biết
tỉnh, xã (Hành Chính 2 cấp ở VN) và nhiệt độ môi trường mà không cần tôi phải nhập cái đó
luôn nhập tự động để hoàn thiện dữ liệu bệnh nhân hiện đang thiếu 2 cột đó và phải nhập tay
vất vả".

**Vì sao đáng nhớ:** nhiệt độ môi trường là biến đầu vào của phép đo kinh lạc, nên hai cột này
đang thiếu dữ liệu chứ không phải chỉ là thông tin hành chính; nhập tay thì người đo bỏ qua.
