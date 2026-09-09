# 📋 SCHEMA AUDIT: Phân Tích Toàn Diện Database KinhlacC

**Ngày:** 2026-09-09  
**Phiên bản:** v1 - Phân tích cơ sở lần đầu  
**Mục tiêu:** Tối ưu schema theo bài toán tổng thể (kinh lạc → bệnh Y học) thay vì patch từng chỗ

---

## 1. CURRENT STATE: Cấu Trúc Schema Hiện Tại

### 1.1 Thống Kê
- **Tổng entities:** 56 model.ts files
- **SQL migrations:** 30+ files
- **Bảng chính:**
  - **Core:** `patients`, `examinations`, `appointment_slots`
  - **YHCT:** `kinh_mach`, `huyet_vi`, `chung_benh`, `phap_tri`, `vi_thuoc`, `bai_thuoc`, `trieu_chung`
  - **Y học hiện đại:** `benh_dong_y_hien_dai` (rule engine)
  - **Liên kết:** 20+ bảng M:N (`bai_thuoc_trieu_chung`, `bai_thuoc_phap_tri`, `vi_thuoc_kinh_mach`, ...)
  - **Khác:** `thuong_han`, `ton_thuong`, `chan_doan_luoi`, `kinh_mach_3d_*`, ...

### 1.2 Core Workflow Hiện Tại

```
Patient (bệnh nhân)
    ↓
Appointment (buổi khám)
    ↓
Examination (khám chi tiết)
    ├─ inputData: { [cellName]: value }  ← đo kinh lạc 12 ô (C10-F15)
    ├─ flags: { channelIndex, L, R, Avg, ... }  ← dữ liệu thô từ máy
    ├─ amDuong, khi, huyet, huThuc  ← 8 lực cơ bản
    └─ [NEW] chanDoanLuu (JSONB)  ← chẩn đoán lưu + bằng chứng
            ├─ ket_luan (thể bệnh kết luận)
                ├─ xep_hang (ranking)
                └─ trieu_chung (triệu chứng đã hỏi)

BenhDongYExcelRule (rule engine)
    ├─ excelFormula: "C10 > 50 AND F15 < 30"  ← công thức ngôn ngữ
    ├─ logicExpression: "and(gt(C10, 50), lt(F15, 30))"  ← đánh giá logic
    ├─ sqlCaseText & sqlCaseBoolean  ← SQL để chạy trên DB
    └─ output: bệnh Y học hiện đại + danh sách thể bệnh khớp
        ↓
BaiThuoc (bài thuốc gợi ý)
    ├─ ten_bai_thuoc, cong_dung, cach_dung
    ├─ [cột text] chung_trang, the_benh, trieu_chung (comma-sep)
    ├─ [M:N] trieuChungList (chuẩn hóa)
    ├─ chiTietViThuoc (vị thuốc + liều)
    └─ phapTriLinks (pháp trị)
```

---

## 2. ANALYSIS: Phân Loại Vấn Đề

### 2.1 ❌ THỪA (Cần Xóa / Hợp Nhất)

| ID | Vấn đề | Impact | Evidence |
|----|--------|--------|----------|
| T1 | **Dữ liệu text lặp** | Khó tìm kiếm, không normalize | `bai_thuoc.chung_trang` (text), `bai_thuoc.the_benh` (comma-sep) - cũng nằm trong quan hệ M:N `bai_thuoc_phap_tri`, `*_the_benh` |
| T2 | **56 entities quá nhiều** | Khó maintain, entity nào dùng không? | Cần grep referential, kiểm tra chưa đủ |
| T3 | **Bảng lưu trữ 3D mà không xoá cũ** | Disk phình | `kinh_mach_3d_anchor`, `kinh_mach_3d_needle` - update rồi nhưng không purge old |
| T4 | **Legacy tables chưa xóa** | Lẫn lộn schema | `legacy_meridian_syndrome` còn ở, `*_old` tables ở đâu? |

### 2.2 ❌ THIẾU (Cần Thêm)

| ID | Vấn đề | Impact | Lý do | Priority |
|----|--------|--------|------|----------|
| K1 | **Audit log bệnh nhân** | Không biết ai/khi nào sửa gì | YHCT quy định lưu hồ sơ, có trách nhiệm pháp lý | 🔴 High |
| K2 | **Meridian measurement schema** | 12 ô đo giờ dùng cột `inputData` generic | Cần cấu trúc rõ ràng C10-C15, F10-F15 để join & index | 🟠 High |
| K3 | **Confidence score / weight** | Chẩn đoán "bệnh gout" - nhưng bao nhiêu % chắc? | Rule engine không output độ tin | 🟠 Medium |
| K4 | **Soft delete marker** | Xóa dữ liệu quên đánh dấu | `patients` có DeleteDateColumn ✅ nhưng `examination` không có | 🟡 Medium |
| K5 | **Appointment-Examination link** | Buổi khám có thể có nhiều lần đo? | `examinations.patientId` - không liên kết `appointment_slots` | 🟡 Medium |

### 2.3 ⚡ TỐI ƯU (Cần Cải Thiện Hiệu Năng)

| ID | Vấn đề | Hiện Tượng | Kiến Nghị |
|----|--------|-----------|-----------|
| O1 | **Comma-separated values** | `bai_thuoc.the_benh = "id1,id2,id3"` | → M:N table `bai_thuoc_the_benh` (vẫn cần tạo) |
| O2 | **JSONB inputData không schema** | `inputData: { [key]: number }` - join khó | Cân nhắc tạo cột tách `c10_chi_tren`, `c11_chi_tren`, ... (denormalize) hoặc tạo child table `examination_measurements` |
| O3 | **Chẩn đoán lưu trong JSONB** | `examinations.chanDoanLuu` - không query được | Cân nhắc normalize thành `diagnoses` table riêng |
| O4 | **Index thiếu** | Không biết có index trên `examinations(patientId)`, `bai_thuoc(id)`, ... | Scan toàn bộ slow |
| O5 | **N+1 queries** | Frontend join Entity A → Entity B (ForeignKey) → Entity C | Cần explicit `.leftJoinAndSelect()` trong queries |

---

## 3. ROOT CAUSE ANALYSIS

### Tại sao schema lại như vậy?

1. **Phát triển incrementally**: Làm tới đâu phát sinh vấn đề rồi mới thêm cột/bảng
   - Input dữ liệu 12 ô: ban đầu dùng cột `inputData` JSONB generic
   - Sau lấy từ 12 ô để eval rule → bây giờ cần schema rõ ràng

2. **Dữ liệu di chuyển từ app cũ**
   - Có thể 30+ migrations chính là patch khi import dữ liệu, rename/gộp bảng
   - Lạc hậu chưa xóa

3. **Không quy hoạch trước toàn bộ bài toán**
   - Bây giờ 3 trục chính (UX tối giản, hạ tầng ổn định, kế thừa tri thức)
   - → Schema cần reflect chính xác 3 trục này

---

## 4. PROPOSED NEW SCHEMA

### 4.1 Entity Relationship Diagram (Simplified)

```
┌─────────────┐
│   patients  │
└──────┬──────┘
       │ 1:N
       ↓
┌──────────────────┐     ┌──────────────────┐
│ appointments     │────→│   examinations   │
└──────────────────┘     └────────┬─────────┘
                                  │ 1:N
                                  ↓
                        ┌──────────────────────────┐
                        │ meridian_measurements    │ ← NEW
                        │ (C10, C11, ..., F15)     │
                        └──────────────────────────┘
                                  │
                                  ↓ eval rule
                        ┌──────────────────────────┐
                        │ benh_dong_y_hien_dai     │
                        │ (rule engine)            │
                        └──────────┬───────────────┘
                                   │ M:N
                                   ↓
                        ┌──────────────────────────┐
                        │ diagnoses         ← NEW │ (normalize từ JSONB)
                        │ (ket_luan, score)        │
                        └──────────────────────────┘
                                   │
                                   ↓ link vào
                        ┌──────────────────────────┐
                        │ bai_thuoc                │
                        ├──────────────────────────┤
                        │ chiTietViThuoc (M:N)     │
                        │ trieuChungList (M:N)     │
                        │ phapTriLinks (M:N)       │
                        └──────────────────────────┘

┌──────────────────────────┐
│ patient_audit_log   ← NEW│ (track thay đổi)
└──────────────────────────┘
```

### 4.2 Chi Tiết Bảng Mới / Sửa

#### **NEW: `meridian_measurements`** (thay thế `inputData` generic)
```sql
CREATE TABLE meridian_measurements (
  id SERIAL PRIMARY KEY,
  examination_id INT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  
  -- 12 ô đo (trái/phải, trên/dưới)
  -- Mỗi ô có: giá trị (0-100), trạng thái (BÌNH, CAO, THẤP), ghi chú
  chi_tren_c10 INT,   chi_duoi_f10 INT,
  chi_tren_c11 INT,   chi_duoi_f11 INT,
  chi_tren_c12 INT,   chi_duoi_f12 INT,
  chi_tren_c13 INT,   chi_duoi_f13 INT,
  chi_tren_c14 INT,   chi_duoi_f14 INT,
  chi_tren_c15 INT,   chi_duoi_f15 INT,
  
  -- Hay nếu muốn dynamic: measurements JSONB = { C10: 45, F10: 52, ... }
  measurements JSONB,
  
  measured_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_meridian_measurements_exam ON meridian_measurements(examination_id);
```

#### **NEW: `diagnoses`** (normalize từ `examinations.chanDoanLuu` JSONB)
```sql
CREATE TABLE diagnoses (
  id SERIAL PRIMARY KEY,
  examination_id INT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  
  -- Thể bệnh kết luận (M:N với benh_dong_y_hien_dai, nhưng lưu tóm tắt ở đây)
  primary_disease_code VARCHAR(120) REFERENCES benh_dong_y_hien_dai(code),
  
  -- Confidence score (0-100) của công thức rule engine
  confidence_score INT DEFAULT 0,
  
  -- Danh sách thể khớp (JSONB hoặc M:N table diagnoses_benh_dong_y)
  matched_diseases JSONB,  -- [{ code, name, score, is_primary }, ...]
  
  -- Triệu chứng đã hỏi + câu trả lời
  symptoms_answered JSONB, -- [{ id, name, answer: 'co'/'khong'/'kho' }, ...]
  
  -- Ghi chú bác sĩ
  notes TEXT,
  
  diagnosed_by INT REFERENCES admins(id),  -- admin đã chốt chẩn đoán (nếu có)
  diagnosed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_diagnoses_exam ON diagnoses(examination_id);
CREATE INDEX idx_diagnoses_disease ON diagnoses(primary_disease_code);
```

#### **NEW: `patient_audit_log`** (track bệnh nhân)
```sql
CREATE TABLE patient_audit_log (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Trường nào thay đổi: fullName, medicalHistory, phone, ...
  field_name VARCHAR(255),
  old_value TEXT,
  new_value TEXT,
  
  -- Ai sửa (admin_id hoặc patient_id tự sửa)
  changed_by_admin_id INT REFERENCES admins(id),
  changed_by_patient_id INT REFERENCES patients(id),
  
  changed_at TIMESTAMP NOT NULL DEFAULT now(),
  
  CONSTRAINT check_who_changed CHECK (
    (changed_by_admin_id IS NOT NULL AND changed_by_patient_id IS NULL) OR
    (changed_by_admin_id IS NULL AND changed_by_patient_id IS NOT NULL)
  )
);
CREATE INDEX idx_patient_audit_patient ON patient_audit_log(patient_id);
CREATE INDEX idx_patient_audit_time ON patient_audit_log(changed_at);
```

#### **MODIFY: `examinations`** (remove JSONB, add FK)
```sql
-- Xóa: chanDoanLuu (→ diagnoses table), inputData (→ meridian_measurements)
-- Thêm:
ALTER TABLE examinations 
  ADD COLUMN appointment_id INT REFERENCES appointment_slots(id) ON DELETE SET NULL,
  ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;

CREATE INDEX idx_examinations_appointment ON examinations(appointment_id);
```

#### **MODIFY: `bai_thuoc`** (normalize comma-sep)
```sql
-- Xóa: the_benh (text comma-sep) → CREATE TABLE bai_thuoc_the_benh
-- Xóa: chung_trang (text) → xem xét normalize, hoặc giữ lại text + lên M:N

CREATE TABLE bai_thuoc_the_benh (
  id_bai_thuoc INT NOT NULL REFERENCES bai_thuoc(id) ON DELETE CASCADE,
  id_the_benh INT NOT NULL REFERENCES the_benh(id) ON DELETE CASCADE,
  PRIMARY KEY (id_bai_thuoc, id_the_benh)
);
```

---

## 5. MIGRATION PLAN: 8 BƯỚC TRIỂN KHAI

### Phase 1: Chuẩn Bị (không downtime)

**Step 1:** Tạo bảng mới (backward compatible)
- Thêm `meridian_measurements` (empty, chưa dùng)
- Thêm `diagnoses` (empty)
- Thêm `patient_audit_log` (empty)
- File: `backend/sql/001-create-new-schema-tables.sql`

**Step 2:** Backfill dữ liệu cũ (offline analysis)
- Extract `examinations.inputData` → parse & insert vào `meridian_measurements`
- Extract `examinations.chanDoanLuu` JSONB → insert vào `diagnoses`
- File: `backend/sql/002-backfill-from-jsonb-to-tables.sql`

### Phase 2: Chuyển Đổi (có downtime, 5-10 phút)

**Step 3:** Drop cột JSONB cũ
- ALTER TABLE examinations DROP COLUMN inputData, chanDoanLuu
- ALTER TABLE examinations ADD appointment_id, deleted_at (nếu chưa có)
- File: `backend/sql/003-remove-jsonb-columns.sql`

**Step 4:** Normalize bai_thuoc (optional, nếu cần search)
- Tạo `bai_thuoc_the_benh` M:N table
- Parse `bai_thuoc.the_benh` (comma-sep) → insert vào M:N
- DROP `bai_thuoc.the_benh` column
- File: `backend/sql/004-normalize-bai-thuoc-the-benh.sql`

### Phase 3: Code & Entity Update

**Step 5:** Update TypeORM entities
- `Examination` model: remove `inputData`, `chanDoanLuu`; add `appointment_id`, `deletedAt`
- Add `MeridianMeasurement` entity
- Add `Diagnosis` entity
- Add `PatientAuditLog` entity
- File: `backend/src/models/*.model.ts` (4 files)

**Step 6:** Update services & queries
- `ExaminationService`: load từ `MeridianMeasurement` thay vì `inputData`
- `DiagnosisService`: create/read diagnosis
- `PatientService`: audit log on update
- File: `backend/src/controllers/*.controller.ts` (3-4 files)

### Phase 4: Frontend & Rules

**Step 7:** Update rule engine (BenhDongYExcel)
- Thay đổi input: từ `inputData[cellName]` → `meridian_measurements` columns
- Output: thêm `confidence_score` field
- File: `backend/src/controllers/benh-dong-y-excel.controller.ts`

**Step 8:** Add index & optimize queries
- Ensure index trên `meridian_measurements(examination_id)`, `diagnoses(examination_id)`, `patient_audit_log(patient_id)`
- N+1 query check via logger
- File: `backend/sql/008-add-final-indexes.sql`

---

## 6. RISK & ROLLBACK

| Risk | Mitigation |
|------|-----------|
| Data loss khi DROP COLUMN | Backup bước 2, validate backfill count match |
| 5-10 phút downtime | Schedule off-hours (2am-6am), chuẩn bị DB client sẵn |
| App crash nếu query cũ | Deploy code (step 5-6) cùng lúc, test staging trước |
| Đo kinh lạc mất | Backfill từ inputData 100% trước DROP |

**Rollback:**
- Nếu sai bước 3 (DROP): restore từ backup, revert code deploy, chạy lại bước 1-2
- Không cần rollback nếu chỉ sai bước 1-2 (bảng trống, không dùng)

---

## 7. BENEFITS SAU MIGRATION

✅ **Schema rõ ràng:** 12 ô kinh lạc có cột riêng, join & filter dễ  
✅ **Audit trail:** Biết ai/khi nào sửa bệnh nhân (tuân thủ YHCT regulation)  
✅ **Confidence score:** Chẩn đoán có độ tin (bệnh "chắc 78%")  
✅ **Query optimize:** Cấu trúc bảng rõ ràng → index hiệu → query nhanh hơn  
✅ **Scalable:** Sẵn sàng cho suy luận bệnh phức tạp sau này  

---

## 8. NEXT STEPS

1. **Bước 1-2:** Viết SQL migration files (tôi sẽ làm)
2. **Bước 3-5:** Update entity models + services (cần code review)
3. **Bước 6-8:** Test staging, validate data, deploy production

**Timeline:** 3-5 ngày làm code + test, 1 ngày deploy (off-hours)

---

**Report này được tạo bằng cách phân tích thực tế 56 entities + 30+ migrations.**  
**Liên hệ nếu cần giải thích thêm hoặc điều chỉnh kế hoạch.**
