# Task: INGEST Google Drive YHCT Docs

**Status**: Pending  
**Assigned to**: Javis AI  
**Priority**: Medium  
**Created**: 2026-09-08

## Mục tiêu
Ingest các tài liệu YHCT từ Google Drive (khóa luận PTIT, VECOM, huyệt vị, pháp trị, bài thuốc) → tạo Wiki phong phú, cấp dữ liệu cho 3 agents (diagnose, formula, meridian).

## Công việc chi tiết

### 1. Kết nối Google Drive
- [ ] Anh kết nối Google Drive tại **trang Kết nối** (Models) nếu chưa
- [ ] Em sẽ dùng MCP `claude.ai Google Drive` để lấy danh sách file

### 2. Phân loại & tóm tắt từng file
- [ ] Khóa luận PTIT (YHCT domain) → Wiki "YHCT Classical Theory"
- [ ] VECOM (treatment protocols) → Wiki "VECOM Treatment Guidelines"  
- [ ] PDF huyệt vị → Wiki "Acupoint Reference (详细)" 
- [ ] Excel pháp trị → Wiki "Treatment Methods - Detailed"
- [ ] Bài thuốc collections → Wiki "Formula Library - Extended"

### 3. Tạo Wiki & Link với entities
- [ ] Tóm tắt từng doc → file `.md` với frontmatter `type: wiki`
- [ ] Link tới agent instructions (diagnose-syndrome, formula-composer, meridian-analyst)
- [ ] Link tới entities: `ChungBenh`, `BaiThuoc`, `HuyetVi`, `PhapTri`, v.v.

### 4. Cập nhật Wiki Index
- [ ] Thêm 5 file Wiki mới vào `Wiki/INDEX.md` (hoặc auto-index)

### 5. Báo kết quả
- [ ] Gửi tóm tắt: "INGEST xong X file, Y KB dữ liệu, Z wiki được tạo"

## Điều kiện tiên quyết
- ✅ Backend Data Model Wiki (done)
- ✅ Disease Rules Wiki (done)
- ⏳ Google Drive kết nối (anh cần làm trước hoặc task sẽ chờ)

## Dự kiến thời gian
- Với Google Drive ready: 10-15 phút (5 file × 2-3 min/file)
- Nếu phải kết nối trước: +5 phút

---

## Lưu ý
- Task này CÓ THỂ chạy **async** (nền) - anh không cần chờ
- Nếu Google Drive chưa kết nối, task sẽ pause ở bước 1 (safe, không error)
- Kết quả Wiki sẽ tự hiện ở `/kinhlacc/Wiki/` folder
