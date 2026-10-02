---
name: rada-seo-boc-tach
description: Workflow 1 - Quét, đọc hiểu và bóc tách dữ liệu từ trang đối thủ (Model nhanh nhẹ)
trigger: manual
---

# Workflow 1: Bóc tách Dữ liệu (Fast Model)

Sử dụng model tốc độ cao (như Gemini Flash) để quét và nhặt từ khoá.

## Các bước chạy:
1. Gọi `rada_lay_viec` để lấy trang.
2. Trích xuất `chuDe`, `tuKhoa`, `tomTat`.
3. Gọi `rada_ghi_phan_tich` để đẩy về kho.
4. Chạy định kỳ thông qua lệnh `/schedule`.
