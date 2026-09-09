---
type: wiki
status: active
tags: [wiki, process, ai-agent, collaboration, cross-domain]
origin: distil-memory-2026-09-09
created: 2026-09-09
updated: 2026-09-09
source: "[[Lessons Learned - INGEST Kinh Lạc]]"
---

# Nguyên Tắc Cộng Tác Với AI Agent

Bộ nguyên tắc làm việc rút ra từ nhiều tháng cộng tác với AI agent trên dự án Kinh Lạc,
nhưng **không đặc thù cho YHCT hay cho một domain nào** - áp dụng được cho bất kỳ dự án
phần mềm nào có người dùng chỉ đạo một agent tự động thực thi. Bổ sung cho
[[Knowledge Consolidation - Multi-Source Pattern]] (workflow ingest) và
[[Lessons Learned - INGEST Kinh Lạc]] (bài học vận hành).

## 1. Tư duy trước khi code

Với yêu cầu tính năng mới hoặc thay đổi có rủi ro, agent nên **trình bày cách hiểu + phương
án rồi chờ chốt**, không sửa code ngay. Việc nhảy thẳng vào code khi yêu cầu còn mơ hồ thường
dẫn tới làm lại từ đầu, tốn công gấp đôi so với việc dừng 30 giây để xác nhận hướng đi.

**Áp dụng**: câu hỏi/yêu cầu càng mơ hồ hoặc càng tốn công sửa, càng cần bước xác nhận trước.
Yêu cầu rõ ràng, ít rủi ro thì bỏ qua bước này, làm thẳng.

## 2. Kế thừa trước khi tự dựng

Trước khi tự xây một thứ khó và phổ biến (thư viện, thuật toán, mô hình dữ liệu), dành lượt
đầu để khảo sát xem đã có ai làm chưa - mã nguồn mở, template chuẩn ngành, thư viện có sẵn.
Nguyên tắc: **"lấy họ làm gốc mình tuỳ biến theo"** vì cách người đi trước tổ chức thường đã
được kiểm chứng qua thời gian, tốt hơn tự nghĩ lại từ đầu.

Mức độ kế thừa có thể rất sâu: không chỉ "học ý tưởng" mà tải cả mã nguồn gốc về đọc để hiểu
cơ chế hoạt động (hiệu ứng UI, bố cục, thuật toán) rồi làm theo gần như nguyên bản, chỉ tuỳ
biến phần cần khác.

**Áp dụng**: gặp bài toán khó + phổ biến → khảo sát trước, trình phương án kế thừa, rồi mới
tự dựng phần còn thiếu.

## 3. Gộp việc theo lô (tiết kiệm token/chi phí)

Khi làm việc với agent tính phí theo token/lượt gọi, tiết kiệm không phải là lời nhắc lịch sự
mà là ràng buộc thường trực. Nguyên tắc thực hành:
- Đọc một file, **trích xuất tối đa thông tin** trong một lượt, đừng đọc lại.
- Gộp nhiều nguồn thành một lần ghi output (1 wiki tổng hợp thay vì 3 wiki rời).
- Tránh lặp lại nguyên văn kết quả dài trong câu trả lời tiếp theo.

**Áp dụng**: trước khi thực thi một chuỗi thao tác đọc/ghi, hoạch định để mỗi lượt đọc phục vụ
nhiều mục đích, thay vì đọc-ghi tuần tự từng mảnh nhỏ.

## 4. Neo từ dễ đến khó

Khi phải xử lý nhiều đơn vị công việc có độ khó khác nhau (huyệt vị, module code, hạng mục dữ
liệu...), **bắt đầu từ phần chắc chắn/dễ xác định nhất, dùng nó làm mốc để suy ra phần khó**,
thay vì rải đều công sức hoặc làm ngẫu nhiên. Phần dễ giải quyết trước sẽ tạo ra các điểm neo
(anchor) để nội suy phần còn mơ hồ.

## 5. Hội đồng phản biện cho việc cần độ chính xác cao

Với những quyết định khó đảo ngược hoặc cần độ chính xác cao (vị trí một huyệt trên mô hình
3D, một con số tài chính, một logic chẩn đoán), một lượt làm của agent là không đủ tin cậy.
Mô hình hiệu quả: **hồ sơ bằng chứng → nhiều phản biện độc lập → một bước thẩm tra đối
kháng** (thẩm tra là khâu đáng giá nhất, vì nó bắt được lỗi mà phản biện đơn lẻ bỏ sót).

Chấp nhận đánh đổi tốc độ lấy độ chắc chắn: **"lâu nhưng rất chắc chắn"** tốt hơn nhanh nhưng
phải sửa lại nhiều lần.

## 6. Bảng phương án, duyệt một lần

Khi có nhiều lựa chọn hoặc nhiều hạng mục cần rà soát, trình bày dưới dạng **một bảng liệt kê
để duyệt một lần**, thay vì hỏi lắt nhắt từng cái một. Cách phản hồi hiệu quả từ phía người
duyệt cũng gọn theo mẫu "1- OK / 2- KO CẦN / 3- Sai, làm lại cho đúng" - đối chiếu nhanh, ít
vòng qua lại.

## 7. Vệ sinh khi nhiều phiên agent chạy song song trên cùng kho mã

Khi nhiều phiên agent (nhiều cửa sổ, nhiều model) cùng làm việc trên một working tree, mỗi
phiên **chỉ commit phần việc của mình**, chừa lại phần đang dở của tiến trình khác. Trước khi
`git add -A`, kiểm `git status` và thời điểm sửa đổi (mtime) của từng file để tránh commit hộ
(hoặc ghi đè) một phiên khác đang chạy song song.

## 8. Custom phải sống sót qua bản cập nhật

Khi thêm năng lực vào chính hệ thống agent (driver mới, cấu hình lõi), phải chọn cách lưu để
**không bị mất khi hệ thống cập nhật phiên bản mới** - ví dụ merge thẳng vào nhánh chính của
repo agent, hoặc đặt phần tuỳ biến ở lớp riêng (plugin, state dir) không bị ghi đè bởi bản cập
nhật. Nói rõ cơ chế giữ này cho người dùng thay vì sửa xong rồi im lặng.

## 9. Biết giới hạn công cụ của engine đang chạy

Năng lực đọc/ghi file phụ thuộc **engine đang chạy**, không phải phụ thuộc dữ liệu có tồn tại
hay không. Một engine thiếu tool đọc file có thể báo nhầm "không truy xuất được" trong khi dữ
liệu vẫn nằm nguyên trong kho. Quy tắc xử lý: nếu engine hiện tại thiếu tool cần thiết, **nói
thẳng là thiếu tool và dừng lại**, không suy diễn rằng dữ liệu không tồn tại, và không bịa nội
dung để lấp chỗ trống. Việc cần đọc/ghi hàng loạt file nên giao cho engine có đủ tool (CLI có
Bash/file-tools) thay vì engine chỉ có API chat thuần.

## Liên kết

- [[Knowledge Consolidation - Multi-Source Pattern]] - quy trình ingest đa nguồn
- [[Lessons Learned - INGEST Kinh Lạc]] - bài học vận hành cụ thể của đợt ingest 08/09/2026
- [[Vận Hành Việc Nền và Bẫy Triển Khai]] - các bẫy kỹ thuật khi giao việc nền/triển khai
