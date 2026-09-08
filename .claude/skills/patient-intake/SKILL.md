---
name: patient-intake
description: Tiếp nhận bệnh nhân YHCT - ghi triệu chứng + tiền sử. (122 ký tự)
group: Y học cổ truyền
version: 1.0.0
---

# Tiếp Nhận Bệnh Nhân YHCT

Hướng dẫn ghi nhận hồ sơ bệnh nhân mới (hoặc cập nhật).

## Thông tin bắt buộc

- **Tên, tuổi, giới tính**
- **Triệu chứng chính**: mô tả rõ (ở đâu, cấp độ 1-10)
- **Thời gian bắt đầu**: sắp tới hay dài ngày?
- **Tiền sử bệnh**: bệnh gì, từng chữa như thế nào?
- **Dị ứng/tránh**: thuốc tây y nào, thực phẩm nào?
- **Lối sống**: ngủ, ăn, stress, hoạt động

## Gợi ý câu hỏi theo vùng

| Vùng | Câu hỏi | Ghi chú |
|---|---|---|
| **Đầu** | Đau, chóng mặt, mất ngủ? | Liên quan Dương Minh, Thiểu Dương |
| **Bụng** | Đau bao nhiêu, phân lỏng/táo? | Liên quan Tỳ, Đại Tràng |
| **Lưng** | Tê, cứng, yếu chân? | Liên quan Thận,膀胱 |
| **Khác** | Sốt, toát mồ hôi, miệng khô? | Liên quan Dương Hư, Âm Hư |

## Ghi vào Hồ sơ

Sau khi tiếp nhận:
1. Tóm tắt triệu chứng = **1 chứng bệnh dự kiến**
2. Gọi `diagnose-syndrome` để xác nhận
3. Lưu dự kiến pháp trị + bài thuốc

## Mục tiêu

Bệnh nhân hiểu được bệnh của mình, xác định được hướng trị, và sẵn sàng tương tác với các agent khác (dùng thuốc, châm cứu).
