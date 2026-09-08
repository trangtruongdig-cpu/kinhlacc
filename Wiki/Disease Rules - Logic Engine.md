---
type: wiki
status: active
tags: [diagnosis, rules, logic, TCM-syndromes]
origin: javis-learned
created: 2026-09-08
updated: 2026-09-08
---

# Disease Rules - Luật chẩn đoán Kinh Lạc

**47 luật chẩn đoán** dạng logic expression, ánh xạ từ **các chỉ số kinh mạch** (E-cells trong thang đo khám sàng) sang **các chứng bệnh YHCT** (Syndrome / 辨證).

## Cấu trúc một luật
```json
{
  "code": "tam_khi_hu",
  "name": "Tâm khí hư",
  "outputCell": "AG2",
  "logic": "(E11 < 0) AND (E15 < 0) AND (E26 < 0) AND (ABS(E11) > E7)",
  "excel_formula": "...",
  "sql_case_boolean": "..."
}
```

- **code**: slug định danh
- **name**: tên chứng bệnh YHCT
- **outputCell**: nơi kết quả tính = 1 nếu luật đúng
- **logic**: biểu thức logic đơn giản (AND/OR/comparison)
- **E-cell refs**: tham chiếu tới các chỉ số khám sàng ([[map.md]]) như E11, E15, E26, v.v

## Ánh xạ E-cells → chỉ số khám sàng
(Xem [[map.md]] để chi tiết từng cell trong spreadsheet)

| E-cell | Tác dụng |
|--------|---------|
| E7, E18 | Ngưỡng threshold (baseline) |
| E10, E11, E12, E13, E14, E15 | Giá trị Tâm (Heart) theo 5 chiều |
| E21-E26 | Giá trị các tạng khác: Gan (E22), Tỳ (E23), Phế (E24), Thận (E25), Bàng Quang (E26) |

## 47 luật chẩn đoán (Tâm - Can - Tỳ - Phế - Thận - Bàng Quang - Ngoại)

### Tâm (Heart) - 10 luật
| Code | Tên chứng | Logic điều kiện |
|------|-----------|------------------|
| `tam_khi_hu` | Tâm khí hư | (E11 < 0) AND (E15 < 0) AND (E26 < 0) AND (ABS(E11) > E7) |
| `tam_duong_hu` | Tâm dương hư | (E11 < 0) AND (E23 < 0) AND (ABS(E11) > E7) |
| `tam_duong_hu_suy` | Tâm dương hư suy | (E11 < 0) AND (E12 < 0) AND (E15 > 0) AND (E22 < 0) AND (E26 < 0) AND (ABS(E11) > E7) |
| `tam_am_hu` | Tâm âm hư | (E11 < 0) AND (E15 > 0) AND (E23 > 0) AND (ABS(E11) > E7) |
| `tam_huyet_hu` | Tâm huyết hư | (E11 > E7) AND (E15 > 0) AND (E22 < 0) AND (E25 < 0) AND (E26 < 0) |
| `tam_huyet_u_tre` | Tâm huyết ứ trệ | (E13 > E7) AND (E23 > 0) AND (E25 > 0) |
| `dam_hoa_noi_nhieu` | Đàm hoả nội nhiễu | (E13 > E7) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0) |
| `dam_me_tam_tieu` | Đàm mê tâm tiếu | (E11 < 0) AND (E15 > 0) AND (E25 > 0) |
| `tam_hoa_thuong_viem` | Tâm hoả thượng viêm | (E11 > E7) AND (E24 > E18) AND (E12 > 0) AND (E13 > 0) AND (E15 > 0) AND (E23 > 0) AND (E25 > 0) AND (E26 > 0) |
| `tam_di_nhiet_sang_tieu_truong` | Tâm di nhiệt sang tiểu trường | (E11 > E7) AND (E10 > 0) AND (E15 > 0) AND (E21 > 0) |

### Can (Liver) - 4 luật
| Code | Tên chứng | Logic điều kiện |
|------|-----------|------------------|
| `can_khi_uat_ket` | Can khí uất kết | (E23 < 0) AND (E25 > E18) |
| `can_duong_thuong_sang` | Can dương thượng cang | (E12 > 0) AND (E13 > 0) AND (E15 > 0) AND (E22 > 0) AND (E24 > 0) AND (E25 > E18) AND (E26 > 0) |
| `can_am_bat_tuc` | Can âm bất túc | (E13 > 0) AND (E15 > 0) AND (E22 > 0) AND (E23 > 0) AND (E24 > 0) AND (E25 > E18) |
| `dam_nhiet` | Can Đởm Hoả Vượng, Thấp Nhiệt | (E23 > 0) |

### Tỳ (Spleen) - 4 luật
| Code | Tên chứng | Logic điều kiện |
|------|-----------|------------------|
| `ty_duong_hu` | Tỳ dương hư | (E23 < 0) AND (E26 < 0) AND (ABS(E26) > E18) |
| `ty_vi_khi_hu` | Tỳ vị khí hư | (E15 < 0) AND (E24 < 0) AND (E26 < 0) AND (E25 > 0) AND (ABS(E24) > E18) AND (ABS(E26) > E18) |
| `ty_vi_thap_khon` | Tỳ vị thấp khốn | (E23 < 0) AND (E24 < 0) AND (E26 < 0) AND (ABS(E24) > E18) AND (ABS(E26) > E18) |
| `thap_nhiet_noi_uan` | Thấp nhiệt nội uẩn | (E23 > 0) AND (E24 > E18) AND (E26 > E18) |

### Tâm-Tỳ & Tỳ-Thận (Còng tạng) - 2 luật
| Code | Tên chứng | Logic điều kiện |
|------|-----------|------------------|
| `tam_ty_luong_hu` | Tâm tỳ lưỡng hư | (E11 < 0) AND (E26 < 0) AND (ABS(E11) > E7) AND (ABS(E26) > E18) |
| `ty_than_duong_hu` | Tỳ thận dương hư | (E22 > E18) AND (E23 < 0) AND (E26 < 0) AND (ABS(E23) > E18) AND (ABS(E26) > E18) |

### Vị (Stomach) - 3 luật
| Code | Tên chứng | Logic điều kiện |
|------|-----------|------------------|
| `vi_hoa_thinh` | Vị hoả thịnh | (E13 > 0) AND (E23 > 0) AND (E24 > E18) AND (E26 > E18) |
| `vi_am_hu` | Vị âm hư | (E11 > 0) AND (E23 > 0) AND (E24 > E18) AND (E25 > 0) AND (E26 > 0) |
| `can_vi_bat_hoa` | Can vị bất hoà | (E23 < 0) AND (E24 < 0) AND (E25 > 0) AND (E26 < 0) |

### Thương Hàn + Ngoại (Acupuncture points) - 14 luật
| Code | Tên chứng | Logic điều kiện |
|------|-----------|------------------|
| `viem_loet_da_day_ta_trang` | Viêm loét dạ dày tá tràng | (E11 > 0) AND (E13 > 0) AND (E14 > 0) AND (E15 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0) |
| `dau_da_day_hep_mon_vi` | Đau dạ dày hẹp môn vị | (E23 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0) |
| `dau_bung_tren_soi_luc_buc` | Đau bụng trên sôi lục bục | (E12 > 0) AND (E13 > 0) AND (E14 > 0) AND (E15 > 0) AND (E22 > 0) AND (E24 > 0) AND (E25 > 0) |
| `dam_troc_tro_phe` | Đàm trọc trở phế | (E15 > 0) AND (E21 < 0) AND (E22 < 0) AND (E23 < 0) AND (E24 < 0) AND (E25 > 0) AND (E26 > 0) |
| `phe_han_khai_suyen` | Phế hàn khải suyễn | (E10 < 0) AND (E11 > 0) AND (E12 < 0) AND (E15 > 0) AND (E21 < 0) AND (E22 < 0) AND (E23 < 0) AND (E25 > 0) AND (E26 < 0) |
| `phe_nhiet_khai_suyen` | Phế nhiệt khải suyễn | (E12 > 0) AND (E11 > 0) AND (E15 > E7) AND (E21 < 0) AND (E22 > 0) AND (E23 > 0) AND (E25 > 0) |
| `phe_khi_hu` | Phế khí hư | (E13 > 0) AND (E15 < 0) AND (ABS(E15) > E7) AND (E21 < 0) AND (E22 > 0) AND (E23 < 0) AND (E26 < 0) |
| `phe_am_hu` | Phế âm hư | (E15 > E7) AND (E22 > 0) AND (E23 > 0) AND (E25 > 0) |
| `phe_ty_luong_hu` | Phế tỳ lưỡng hư | (E15 > E7) AND (E22 > 0) AND (E23 < 0) AND (E24 < 0) AND (E26 < 0) AND (ABS(E26) > E18) |
| `phe_than_luong_hu` | Phế thận lưỡng hư | (E15 > E7) AND (E23 > 0) AND (E25 > 0) |
| `dai_truong_thap_nhiet` | Đại trường thấp nhiệt | (E11 > 0) AND (E14 > E7) AND (E15 > 0) AND (E22 < 0) AND (E24 > 0) AND (E26 > 0) |

### Thận (Kidney) - 4 luật
| Code | Tên chứng | Logic điều kiện |
|------|-----------|------------------|
| `than_am_hu` | Thận âm hư | (E15 > 0) AND (E22 > E18) AND (E23 > 0) |
| `than_duong_hu` | Thận dương hư | (E22 > 0) AND (E23 < 0) |
| `than_am_duong_luong_hu` | Thận âm dương lưỡng hư | (E21 < 0) AND (E22 < 0) AND (ABS(E22) > E18) AND (E23 < 0) |
| `than_am_bat_giao` | Thận âm bất giao | (E13 > E15) AND (E15 > 0) AND (E22 > E18) AND (E23 < 0) AND (E25 > 0) |

### Bàng Quang & ngoại hệ thống - 6 luật
| Code | Tên chứng | Logic điều kiện |
|------|-----------|------------------|
| `bang_quang_thap_nhiet` | Bàng quang thấp nhiệt | (E15 > 0) AND (E21 > E18) AND (E22 > 0) AND (E25 > 0) AND (E26 > 0) |
| `chung_cam_sot` | Chứng cảm sốt | (E11 > E7) AND (E15 > E7) AND (E25 > E18) AND (E26 > E18) |
| `nhiet_vao_khi_phan` | Nhiệt vào khí phần | (E11 > E7) AND (E15 > E7) AND (E25 > E18) AND (E26 > E18) AND (E14 > E7) AND (E24 > E18) |
| `nhiet_nhap_tam_bao` | Nhiệt nhập tâm bào | (E11 > E7) AND (E15 > E7) AND (E25 > E18) AND (E26 > E18) AND (E12 > E7) AND (E13 > E7) |
| `co_bap_nhuc_moi` | Cơ bắp nhức mỏi | (E25 > E18) AND (E26 > E18) |
| `co_bap_mem_nheo` | Cơ bắp mềm nhẽo | (E25 < 0) AND (E26 < 0) AND (ABS(E25) > E18) AND (ABS(E26) > E18) |
| `chung_hep_mon_vi` | Chứng hẹp môn vị | (E23 > E18) AND (E24 > E18) AND (E25 > E18) |
| `chung_gan_lach_sung_to` | Chứng gan lách sưng to | (E25 > E18) AND (E26 > E18) AND (E23 < 0) AND (ABS(E23) > E18) |
| `tieu_truong_khi_thong` | Tiểu trường khí thống | (E10 > E7) AND (E22 > 0) AND (E25 > 0) |

---

## Cách dùng trong app

### Trong `diagnose-syndrome` agent
1. User khám sàng → nhập các E-cell values từ form
2. Agent chạy **tất cả 47 luật** logic qua database (SQL CASE WHEN hoặc JS)
3. Những luật nào **true** → trả lại danh sách chứng bệnh (Syndrome) match
4. Agent giải thích **triệu chứng + kinh mạch liên quan** cho mỗi chứng

### Trong `formula-composer` agent
1. Lấy danh sách chứng bệnh từ diagnose-syndrome
2. Tra cứu **BaiThuoc** có `phap_tri` match với từng chứng
3. Soạn bài thuốc dạng **4 tầng**: bổ > tả > hòa > hỗ trợ

---

## Tích hợp với entities khác

- **Entities liên kết**: `BenhDongYExcel`, `ChungBenh`, `TrieuChung`, `KinhMach`, `HuyetVi`, `MeridianSyndrome`
- **API**: GET `/benh-dong-y-excel/diagnose` (POST examination data → trả chứng bệnh list)
- **Frontend**: `MeridianResultsView.vue` render cell-level hints cho từng luật

---

## Lịch sử & ghi chú

- **Dữ liệu từ**: Excel template (meridian analysis spreadsheet)
- **Phương pháp**: 5 chiều Tâm (5 aspects of Heart), 6 tạng lớn (Zang-Fu), + ngoại hệ thống
- **Thường xuyên cập nhật khi**: có bệnh lý mới, điều chỉnh ngưỡng threshold (E7, E18)
