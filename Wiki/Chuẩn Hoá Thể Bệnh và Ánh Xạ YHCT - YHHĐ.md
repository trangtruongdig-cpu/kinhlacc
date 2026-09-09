---
type: wiki
status: active
tags: [wiki, yhct, the-benh, anh-xa, chuan-hoa, kinhlacc]
origin: transcript-claude-code
created: 2026-09-08
updated: 2026-09-08
source: "[[conversations/vscode-2026-07-27]]"
---

# Chuẩn Hoá Thể Bệnh và Ánh Xạ YHCT - YHHĐ

Bộ nguyên tắc giữ cho danh mục thể bệnh sạch và cho phép nối bệnh danh hiện đại về gốc
Đông Y. Chưng cất từ các phiên 27/07 - 31/07/2026.

## 1. Danh mục thể bệnh: một thể, một chỗ

Ba quy tắc chống trùng lặp, ba loại trùng khác nhau:

| Loại trùng | Quy tắc | Chi tiết |
|---|---|---|
| Trùng **tên gọi** | Gộp về một thể, giữ tên phụ khi vào chi tiết | [[gop-the-benh-trung-cong-thuc]] |
| Trùng **vị trí xuất hiện** | Mỗi thể chỉ hiện tối đa 1 lần trong cây bệnh | [[bai-thuoc-dung-chung-khong-lap-the]] |
| Thiếu do **thể kép** | Thể lưỡng gộp trọn phương huyệt của các thể đơn | [[the-luong-phai-gop-phuong-huyet]] |

**Căn cứ gộp luôn là CÔNG THỨC, không phải tên.** "Can uất", "Can khí uất kết", "Can khí bất thư"
là ba cách viết của cùng một thể. Ngược lại, hai thể tên giống nhau mà công thức khác nhau thì
không được gộp.

Lý do quy tắc thứ hai tồn tại: **một bài thuốc chữa được nhiều bệnh**, nên nếu xếp thể theo
bài thuốc thì cùng một thể sẽ mọc lại ở nhiều nhánh bệnh khác nhau.

## 2. Thuật ngữ chuẩn

Chuẩn hoá thuật ngữ là việc phải làm **ở cấp toàn hệ thống**, kể cả trong văn bản giải nghĩa
phương huyệt, không chỉ ở tên trường dữ liệu. Ví dụ đã chốt: **"Đởm"** là chuẩn, tài liệu gốc
viết "Đảm" nên dữ liệu nhập vào dễ lẫn - [[thong-nhat-dam-thanh-doi]].

## 3. Ánh xạ YHCT - YHHĐ: cái có công thức làm cha

Nguyên tắc cấu trúc, tái dùng được cho bất kỳ cặp phân loại nào có một bên suy ra được và một
bên chỉ là nhãn:

- Bệnh YHHĐ **lồng làm nhánh con** của thể YHCT, không tách thành hai danh sách phẳng.
- **Bên nào có công thức thì làm cha**, bên không có công thức làm con. Cả hai có công thức thì
  hiện một cái và cả hai cùng sáng.
- Bệnh YHHĐ không có gốc YHCT thì đứng độc lập.

Chi tiết: [[yhhd-long-duoi-yhct-theo-cong-thuc]].

**Mục đích không phải là gọn giao diện mà là lộ CĂN NGUYÊN.** Cách người dùng diễn đạt:
không có "viêm mũi dị ứng" và "viêm xoang" độc lập, chỉ có chức năng tỳ vị kém không vận hoá
được, sinh đàm; đàm ở phế gặp vi khuẩn, virus, khí lạnh nóng mới thành đờm và nước mũi.
Bác sỹ và người bệnh nhìn vào kết quả khám phải đọc được chuỗi nhân quả đó.

**Cảnh báo đã gặp thật:** ánh xạ thể **không kéo theo ánh xạ phương huyệt**. Một ca có thể
ánh xạ đúng sang "Can Đởm Hoả Vượng" mà vẫn không ra phương huyệt của thể đó. Ánh xạ và
phương huyệt là hai đường dây riêng, phải kiểm cả hai.

## 4. Đối chiếu với hệ cũ trước khi tin hệ mới

Khi làm lại một hệ thống có bản tiền nhiệm, **thứ phải đối chiếu là thuật toán, không phải
danh mục**. Với kinhlacc, nguồn chuẩn là `legacy_meridian_syndromes` - 84 chứng nguyên văn
app cũ. Quy trình: so công thức và logic cũ với mới → thể nào thiếu thì học công thức cũ
chuyển sang logic mới → lập checklist thể nào đã đối chiếu.

**Không bịa công thức cho thể chưa có tài liệu.** Cách xử lý đúng: vẫn tạo thể và thiết lập
quan hệ cha - con, để trống chỗ công thức, chờ chuyên gia cập nhật.
Chi tiết: [[doi-chieu-app-cu-84-chung]].

## 5. Phương huyệt phải nói được nó dùng để làm gì

Mỗi huyệt trong phương huyệt cần một ghi chú ý nghĩa ngắn, rút từ đoạn giải nghĩa phương huyệt,
viết bằng **văn y khoa chứ không phải văn nói**. Ví dụ: Cách Du và Đởm Du - "Tứ hoa liệu pháp,
chữa lao do âm hư"; Nội Quan - "trị chứng âm huyết hao tổn"; Thần Môn - "tả hư nhiệt của Tâm
để an thần định chí".

Mục đích: người châm biết mình châm huyệt đó **nhằm mục đích gì**, chứ không chỉ biết bổ hay tả.
Chi tiết: [[moi-huyet-can-ghi-chu-y-nghia]].

## Liên kết

- [[Taxonomy Kinh Lắc]] - định nghĩa chứng bệnh, pháp trị, bài thuốc
- [[Disease Rules - Logic Engine]] - nơi công thức thực sự sống
- [[Bát Cương và Đồ Hình Thái Cực]] - biện chứng đứng trước thể bệnh
- [[Quy Tắc Xác Định Vị Trí Huyệt]] - phương huyệt đi tiếp xuống toạ độ
- [[Backend Data Model]]
