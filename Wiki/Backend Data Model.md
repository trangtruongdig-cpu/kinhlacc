---
type: wiki
status: active
tags: [backend, schema, entities, reference]
origin: javis-learned
created: 2026-09-08
updated: 2026-09-08
---

# Backend Data Model - Kinh Lạc App

## Tổng quát
**84 entities** NestJS + TypeORM, chia thành **11 nhóm chính** phục vụ quản lý phòng khám YHCT (Đông Y).

## 1. Nhân sự & Hệ thống
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `Admin` | Tài khoản admin quản lý | id, username, email, password |
| `VaiTro` | Vai trò người dùng | id, ten_vai_tro (Admin, BsY Tế, LHP) |

## 2. Bệnh nhân & Khám
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `Patient` | Hồ sơ bệnh nhân | id, ten_benh_nhan, dob, gioi_tinh, sdt, dia_chi |
| `Examination` | Lần khám | id, patient_id, ngay_kham, lam_sang |
| `ThietChan` | Tạp chí khám | id, examination_id, chan_benh (L/R), vi_tri, trang_thai |
| `MachChan` | Mạch chân | id, examination_id, toc_do, dac_diem |

## 3. Chẩn đoán
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `ChungBenh` | Chứng bệnh YHCT | id, ten_chung_benh, mo_ta |
| `BenhTayY` | Bệnh tây y tương ứng | id, ten_benh, icd10 |
| `TrieuChung` | Triệu chứng | id, ten_trieu_chung, mo_ta |
| `BenhDongYExcel` | Bệnh YHCT từ Excel (dữ liệu seed) | id, ten_benh, lua_dai, xung_nhiet, am_huyet |
| `BenhDongYHienDai` | Bệnh hiện đại (TCM modern) | id, ten_benh, phân_loai |
| `BenhCauThanh` | Bệnh câu thành (phối hợp) | id, ten, kinh_mach_tham_gia |
| `ChanDoanLuoi` | Chẩn đoán theo lưỡi | id, lưỡi_mau, lưỡi_day, beo, chan_doan_text |

## 4. Kinh mạch & Huyệt vị
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `KinhMach` | 12 kinh mạch chính | id, ten_kinh (Bàn Nôi, Tiêu Tràng, v.v), diem_vao, diem_ra |
| `HuyetVi` | Huyệt vị (穴位) | id, kinh_mach_id, thu_tu, ten_huyet_vi, vitri_chuẩn |
| `MeridianSyndrome` | Chứng bệnh kinh mạch | id, kinh_mach_id, chung_benh_id, la_can_phai, kham_suc |
| `TheBenhPhuongHuyet` | Thể bệnh - phương huyệt map | id, the_benh_id, huyet_vi_id, so_thim |

## 5. Bài thuốc & Vị thuốc
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `BaiThuoc` | Bài thuốc | id, ten_bai, cong_dung, loi_dung |
| `BaiThuocChiTiet` | Chi tiết bài thuốc (ngiệp) | id, bai_thuoc_id, vi_thuoc_id, tro_luong_gram |
| `ViThuoc` | Vị thuốc thô (nguyên liệu) | id, ten_vi_thuoc, ten_khoa_hoc, nhom_nho_id |
| `ViThuocCongDung` | Công dụng vị thuốc | id, vi_thuoc_id, cong_dung_text |
| `ViThuocChuTri` | Chủ trị vị thuốc | id, vi_thuoc_id, chu_tri_text |
| `ViThuocKiengKy` | Kiêng kỵ vị thuốc | id, vi_thuoc_id, kieng_ky_text |
| `ViThuocKinhMach` | Kinh mạch vị thuốc vào | id, vi_thuoc_id, kinh_mach_id |
| `BaiThuocPhapTri` | Bài thuốc - phương pháp trị map | id, bai_thuoc_id, phap_tri_id |

## 6. Pháp trị & Điều trị
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `PhapTri` | Pháp trị (phương pháp trị) | id, ten_phap_tri (bổ, tả, hòa, v.v) |
| `ChuTri` | Chủ trị | id, ten_chu_tri, mo_ta |
| `KiengKy` | Kiêng kỵ | id, ten_kieng_ky, mo_ta |
| `PhacDoDieuTri` | Phác đồ điều trị | id, examination_id, huyet_vi_ids, phap_tri_ids |
| `PhacDoChuan` | Phác đồ chuẩn (mẫu) | id, ten_phac_do, chung_benh_id, huyet_vi_default |

## 7. Lịch học (Thương Hàn)
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `ThuongHanLop` | Lớp học Thương Hàn | id, ten_lop, giao_vien_id |
| `ThuongHanBenhCo` | Các bệnh cơ bản | id, lop_id, benh_name |
| `ThuongHanLucKinh` | Lực kinh (kinh tính) | id, lop_id, kinh_mach_name, chi_so |

## 8. Lịch phòng khám
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `ClinicScheduleConfig` | Cấu hình giờ làm | id, ngay_tuan, gio_mo, gio_dong |
| `ClinicDayOverride` | Ngoại lệ ngày (nghỉ, bổ sung) | id, ngay, trang_thai (CLOSED/EXTRA) |
| `AppointmentSlot` | Slot đặt khám | id, ngay, gio, patient_id, trang_thai |

## 9. SEO & Nội dung
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `SeoBaiViet` | Bài viết SEO | id, title, slug, content, tags |
| `SeoUrl` | URL SEO | id, path, keyword, priority |
| `SeoCum` | Cụm từ khóa | id, keyword_group, terms |
| `SeoDoiThu` | Đối thủ SEO | id, domain, ranking |
| `SeoIndexStatus` | Trạng thái index Google | id, url, status |

## 10. Nhóm thuốc
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `NhomLonDuocLy` | Nhóm lớn (Vitamins, Antibiotics, v.v) | id, ten_nhom |
| `NhomNhoDuocLy` | Nhóm nhỏ (under nhóm lớn) | id, nhom_lon_id, ten_nhom |
| `NhomNhoViThuoc` | Nhóm vị thuốc | id, ten_nhom |
| `NhomNhoChuTri` | Nhóm chủ trị | id, ten_nhom |

## 11. Hỗ trợ khác
| Entity | Tác dụng | Trường chính |
|--------|---------|-------------|
| `TonThuongTacNhan` | Tổn thương tác nhân (injury causes) | id, ten_ton_thuong |
| `CongDung` | Công dụng (generic list) | id, ten_cong_dung |
| `Nguon` | Nguồn dữ liệu (tài liệu) | id, ten_nguon, url |
| `DiaDiem` | Địa điểm (clinic locations) | id, ten_dia_diem, dia_chi, sdt |

---

## Luồng dữ liệu chính

### Khám bệnh
```
Patient → Examination → ThietChan (lâm sàng) → MachChan (mạch)
    ↓
ChungBenh (chẩn đoán) + TrieuChung + BenhDongYExcel
    ↓
KinhMach + HuyetVi → MeridianSyndrome
    ↓
PhacDoDieuTri (đơn cứu) + BaiThuoc (đơn thuốc)
```

### Soạn bài thuốc
```
BaiThuoc → BaiThuocChiTiet → ViThuoc
    ↓
ViThuocCongDung + ViThuocChuTri + ViThuocKiengKy
    ↓
BaiThuocPhapTri → PhapTri (pháp trị kết hợp)
```

---

## Cần INGEST tiếp
- [ ] **Chi tiết từng entity**: field, relationship, validation
- [ ] **Disease Rules** (disease-rules.json): luật chẩn đoán logic
- [ ] **Google Drive YHCT docs**: tài liệu khóa luận, huyệt vị, pháp trị
