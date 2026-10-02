---
type: session-handoff
status: active
updated: 2026-10-02
---

# Session Handoff

## Mục tiêu
GĐ 1 + GĐ 2 của spec đồ thị tri thức (2026-10-02-do-thi-tri-thuc-thap-va-truc-ngang.md)

## Đã hoàn thành

### GĐ 1 — Đóng đỉnh tháp
- 1.955 cạnh `nguon_vi_thuoc` ghi vào DB (phiên Claude trước)
- `nguon-canh.mjs`: hàm dùng chung `khoiYVan()` + `napNguonSlug()` + `foldTen()`
- `build-duoc-lieu.mjs`: chuyển sang `khoiYVan()` thay ghép chuỗi riêng → 205 trang có khối y văn, 0 link chết
- `ghi-canh-nguon.mjs`: ghi theo lô (5s thay 6 phút)

### GĐ 2 — T3/T4 lên trang
- **`build-phap-tri.mjs`** (MỚI): 380 trang `/phap-tri/<slug>/`, 373 indexed + 7 noindex
  - Hiện: thể bệnh + nguyên tắc + triệu chứng (link /trieu-chung/) + bài thuốc chủ phương (link /bai-thuoc/) + kinh mạch (link /kinh/)
  - Kinh mạch slug qua bản đồ KINH_SLUG (khớp dict-data.mjs KINH_SLUG_BY_CODE)
- **`build-trieu-chung.mjs`** (MỚI): 1.033 trang `/trieu-chung/<slug>/`, 555 indexed + 478 noindex (mồ côi)
  - Hiện: tên + nhóm + các pháp trị liên quan (link /phap-tri/) + bài thuốc (link /bai-thuoc/)
- Liên kết chéo hai chiều: phap-tri ↔ trieu-chung + phap-tri → bai-thuoc/kinh

## Quyết định đã chốt
- Mỗi triệu chứng/pháp trị được trang riêng (phương án b spec Q1)
- Luật index: trieu-chung cần ≥ 1 cạnh pháp trị, phap-tri cần ≥ 1 cạnh (triệu chứng hoặc bài thuốc)
- Trang mồ côi vẫn sống cho liên kết nội bộ, chỉ noindex

## Bước tiếp theo
1. Thêm hai builder vào pipeline build chính (package.json / deploy.sh)
2. GĐ 3: trục ngang — chỉ mục ngữ nghĩa từ chu_tri/cong_dung
3. 836/1.045 vị thuốc chưa có nguồn y văn (thiếu DỮ LIỆU: 8 quyển top cần thêm vào thư mục)

## File liên quan
- `frontend/scripts/build-phap-tri.mjs` — builder pháp trị (MỚI)
- `frontend/scripts/build-trieu-chung.mjs` — builder triệu chứng (MỚI)
- `frontend/scripts/build-duoc-lieu.mjs` — builder dược liệu (đã sửa dùng khoiYVan)
- `frontend/scripts/nguon-canh.mjs` — hàm dùng chung khoiYVan + napNguonSlug
- `docs/superpowers/specs/2026-10-02-do-thi-tri-thuc-thap-va-truc-ngang.md` — spec gốc
