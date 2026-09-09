---
type: wiki
status: active
tags: [wiki, taxonomy, kinhlacc]
created: 2026-09-08
updated: 2026-09-08
source: "[[Domain Kinh Lắc]]"
---

# Taxonomy Kinh Lắc

Phân loại khái niệm Y học cổ truyền trong ứng dụng Kinh Lắc.

## 1. Kinh (Meridian / Kinh Mạch)

12 kinh chính + 8 kinh mạch phụ.

| Kinh | Viết tắt | Tính chất | Cặp |
|---|---|---|---|
| Thái Dương | TDY | Dương | Tay - Chân |
| Thiểu Dương | TYY | Dương | Tay - Chân |
| Dương Minh | DM | Dương | Tay - Chân |
| Thái Âm | TÂ | Âm | Tay - Chân |
| Thiểu Âm | TYÂ | Âm | Tay - Chân |
| Quyết Âm | QÂ | Âm | Tay - Chân |

**Lạc (Collateral)**: giao thoa điểm giữa các kinh.

---

## 2. Huyệt Vị (Acupoint)

Điểm châm cứu trên kinh mạch. Đặc tính:
- **Định vị**: tên huyệt + vị trí trên cơ thể
- **Chỉ định**: chứng bệnh phù hợp
- **Pháp trị**: châm, rạo, v.v.
- **Tế bào**: cách lấy huyệt (cơ bắp, xương, thần kinh)

VD: 合谷 (Hợp Cốc / LI-4) - huyệt đại trượng kinh, trị đau đầu, mặt, v.v.

---

## 3. Chứng Bệnh (Syndrome / Syndrome Pattern)

Tổ hợp triệu chứng + dấu hiệu = một "chứng bệnh" cụ thể.

VD:
- Chứng sốt cao + chảy máu cam + miệng khô = **Chứng Dương Minh Nhiệt**
- Chứng đau bụng + phân lỏng = **Chứng Tỳ Dương Hư**

Mỗi chứng → **chỉ định pháp trị + bài thuốc** cụ thể.

---

## 4. Pháp Trị (Treatment Method)

Cách can thiệp:

| Phương pháp | Nội dung | Công cụ |
|---|---|---|
| **Châm** | Châm cứu vào huyệt | Kim châm |
| **Rạo** | Rạo ấm mở tắc | Moxa, lửa |
| **Tả** | Tinh dầu, xoa bóp | Dầu lạnh, nóng |
| **Tuyễn** | Tuyên truyền cách sống | Chế độ ăn, hoạt động |

---

## 5. Bài Thuốc (Herbal Formula)

Kết hợp liệu thuốc theo chứng bệnh.

| Thành phần | Vai trò | Lượng |
|---|---|---|
| **Vị chủ** | Trị chứng chính | Cao nhất |
| **Vị phụ** | Hỗ trợ | Trung bình |
| **Vị hạ** | Điều hoà tiêu hóa | Thấp |

VD: **Tứ Quân Tử Tằng** - bổ khí, dùng cho chứng khí hư.

Công thức: `{Tâm - 9g, Bạch Chúc - 12g, ...} + nước sôi 20 phút`.

---

## 6. Bệnh Cổ Điển (Classical Disease)

Bệnh do Đông Y định nghĩa (khác Western medicine):

| Bệnh YHCT | Triệu chứng | Nguyên nhân YHCT |
|---|---|---|
| **Bệnh Sốt Rét** | Sốt lạnh, đầu mặt | Khí xâm nhập, Dương hư |
| **Bệnh Sâu Răng** | Đau toàn hàm | Dạ Dương Hư nhiệt |
| **Bệnh Phong** | Tê liệt, run | Phong xâm kinh mạch |

---

## 7. Tái dùng trong app

- **Backend**: model `BenhDongY`, `HuyetVi`, `Kinh`, `PhuongPhapTri`, `BaiThuoc`
- **Frontend**: display chứng bệnh → hiển thị huyệt + bài thuốc đề xuất
- **API**: GET `/kinhlacc/syndrome/{id}` → trả `huyetVi[]`, `baiThuoc[]`, `phuongPhapTri[]`

---

## 8. Mục tiêu tri thức

- [ ] **Đầy đủ 12 kinh** với huyệt vị chính (3-5 huyệt/kinh)
- [ ] **100+ huyệt vị** với định vị + chỉ định
- [ ] **50+ chứng bệnh** cổ điển + pháp trị
- [ ] **100+ bài thuốc** với liệu thuốc + cách nấu
- [ ] **Tương tác Kinh ↔ Huyệt ↔ Chứng ↔ Bài** trong Wiki

Công việc:
1. ✅ Taxonomy xây dựng
2. ⏳ Kinh Mạch Toàn Tập
3. ✅ Huyệt Vị Cơ Bản — [[Huyệt Vị Cơ Bản]] (56 huyệt / 13 kinh, 2026-09-08)
4. ⏳ Chứng Bệnh Lâm Sàng  
5. ⏳ Bài Thuốc Thường Dùng


## Mâu thuẫn
- Quan điểm mới ([[conversations/2026-09-08]]): Đối chiếu mục **7. Tái dùng trong app** với mã nguồn thật của repo: phần tên model và endpoint đang ghi trong trang không khớp mã nguồn.

- Trang hiện ghi model `BenhDongY`, `Kinh`, `PhuongPhapTri` và endpoint `GET /kinhlacc/syndrome/{id}` [[Taxonomy Kinh Lắc]]. Không tìm thấy các tên này trong `backend/src/models/` [[backend/src/models]].
- Tên entity thật theo file trong repo (thực tế tính đến 2026-09-08): `chung-benh.model.ts`, `the-benh.model.ts`, `huyet-vi.model.ts`, `kinh-mach.model.ts`, `
- Cần xác minh (append _open-questions).
