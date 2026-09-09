---
type: wiki
status: active
tags: [wiki, process, ops, deployment, background-task, cross-domain]
origin: distil-memory-2026-09-09
created: 2026-09-09
updated: 2026-09-09
source: "[[Knowledge Consolidation - Multi-Source Pattern]]"
---

# Vận Hành Việc Nền và Bẫy Triển Khai

Các bẫy kỹ thuật cụ thể đã xảy ra thật khi giao việc nền cho agent hoặc khi đưa code lên môi
trường chạy thật. Không đặc thù YHCT - áp dụng cho bất kỳ dự án nào dùng agent nền + có môi
trường triển khai riêng biệt với máy phát triển. Đi kèm
[[Nguyên Tắc Cộng Tác Với AI Agent]] (nguyên tắc chung) và
[[Knowledge Consolidation - Multi-Source Pattern]] (checklist precondition trước khi enqueue).

## 1. Đối chiếu số file với chỉ mục sau mỗi đợt ingest hàng loạt

Khi một đợt ingest/consolidate tạo ra **nhiều file ghi nhớ cùng lúc**, dễ sót bước cuối: thêm
dòng trỏ tới file đó vào chỉ mục trung tâm (index) - vì bước này tách rời khỏi bước ghi từng
file. Nếu chỉ mục là thứ được nạp vào ngữ cảnh (chứ không phải quét thư mục mỗi lần), một file
ghi đúng chuẩn nhưng thiếu dòng chỉ mục thì **coi như vô hình** - tồn tại trên đĩa nhưng không
bao giờ được agent nhìn thấy.

**Áp dụng**: sau bất kỳ đợt ingest/consolidate nào tạo nhiều file, đối chiếu số file thực tế
với số dòng trong chỉ mục trước khi coi là xong. Không tự tin dựa vào "đã ghi file đúng
frontmatter" - phải kiểm luôn bước index.

## 2. Model miễn phí trên nền tảng trung gian có thể ngừng khả dụng bất kỳ lúc nào

Việc nền chạy qua một model "miễn phí" trên nền tảng trung gian (ví dụ router nhiều model) có
thể đột ngột trả lỗi dạng "bản miễn phí không còn khả dụng, chỉ còn bản trả phí" - dù hôm
trước vẫn chạy được. Đây là thay đổi phía nhà cung cấp, không phải lỗi cấu hình phía mình.

**Áp dụng**: khi việc nền lỗi hàng loạt cùng một kiểu thông báo, kiểm tra trước hết xem model
đang cấu hình cho việc nền có còn khả dụng không, trước khi nghi ngờ logic của tác vụ. Đổi
sang model khác đang có subscription/API key hợp lệ rồi giao lại - đừng giao lại y nguyên vì
sẽ lỗi lặp lại.

## 3. Triển khai qua git pull: coi chừng thay đổi cục bộ trên máy chủ chặn pull

Với mô hình triển khai "commit → push → SSH vào máy chủ → git pull", máy chủ có thể tự phát
sinh thay đổi cục bộ (log, file cấu hình runtime...) khiến `git pull` bị chặn với lỗi kiểu
"commit hoặc stash thay đổi trước khi merge". Triệu chứng nhìn từ phía người dùng là "đã push
lên git rồi sao trên web vẫn chưa thấy thay đổi mới" - dễ bị hiểu lầm là lỗi code.

**Cách gỡ**: `git stash` → `git pull` → chỉ `git stash drop` sau khi đã xác nhận nội dung
stash không còn cần nữa (đừng drop mù quáng, có thể mất cấu hình runtime quan trọng).

**Áp dụng**: khi nhận báo cáo "đã cập nhật code nhưng web chưa đổi", việc đầu tiên là xác minh
máy chủ đã pull thành công chưa và có bị kẹt thay đổi cục bộ không - trước khi nghi ngờ logic
code.

## Nguyên tắc chung rút ra

Cả ba bẫy trên đều thuộc một nhóm: **hệ thống báo "đã xong" hoặc "không lỗi gì" trong khi thực
tế có một mắt xích âm thầm đứt** (file không vào index, model ngừng khả dụng, máy chủ chưa
pull). Cách phòng chung: sau một thao tác tưởng như hoàn tất, xác minh bằng một phép đo độc
lập (đếm số dòng index, gọi thử model, kiểm commit hash trên máy chủ) thay vì tin vào việc
"lệnh chạy không báo lỗi".

## Liên kết

- [[Knowledge Consolidation - Multi-Source Pattern]] - checklist precondition trước khi enqueue việc nền
- [[Nguyên Tắc Cộng Tác Với AI Agent]] - nguyên tắc cộng tác chung với agent
- [[Lessons Learned - INGEST Kinh Lạc]] - bài học 3 (precondition check) cùng tinh thần
