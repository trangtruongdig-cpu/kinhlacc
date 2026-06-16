# Thư viện ảnh vị thuốc (static, theo giai đoạn)

Ảnh vị thuốc là **file tĩnh trong repo** (giống `public/tongue-atlas/`). Mỗi vị thuốc một thư mục theo **id** + một file `index.json` mô tả ảnh theo **giai đoạn vòng đời** (từ nguyên liệu đến thành phẩm).

## Cách thêm ảnh cho 1 vị thuốc

1. Tạo thư mục `public/vi-thuoc/<id>/` (id = id vị thuốc trong DB, vd Cam Thảo = `25`).
2. Bỏ các file ảnh vào (`.jpg`, `.png`, `.webp`, `.svg`…). Đặt tên tuỳ ý (vd `1.jpg`, `cay-tuoi.jpg`).
3. Tạo `public/vi-thuoc/<id>/index.json`:

```json
{
  "images": [
    { "file": "1.jpg", "giai_doan": "Cây thuốc",        "mo_ta": "Mô tả ngắn (tuỳ chọn)." },
    { "file": "2.jpg", "giai_doan": "Thu hái",          "mo_ta": "" },
    { "file": "3.jpg", "giai_doan": "Sơ chế",           "mo_ta": "" },
    { "file": "4.jpg", "giai_doan": "Phơi/sấy",         "mo_ta": "" },
    { "file": "5.jpg", "giai_doan": "Bào chế",          "mo_ta": "" },
    { "file": "6.jpg", "giai_doan": "Phiến/thành phẩm", "mo_ta": "" }
  ]
}
```

- **Thứ tự trong mảng = thứ tự hiển thị** (theo vòng đời).
- `file` có thể là **tên file** (cùng thư mục) hoặc **URL http đầy đủ** (nếu ảnh host nơi khác).
- `giai_doan`, `mo_ta` đều **tuỳ chọn**.

## Bộ giai đoạn gợi ý (cho nhất quán)

`Cây thuốc/nguyên liệu` · `Thu hái` · `Sơ chế` · `Phơi/sấy` · `Bào chế` · `Phiến/thành phẩm`

(Có thể dùng giai đoạn riêng nếu vị thuốc đặc thù — vd "Khoáng vật", "Bộ phận động vật"…)

## Hiển thị ở đâu

Component `frontend/src/components/ViThuocGallery.vue` tự đọc `index.json` của vị thuốc đang xem (trong trang chi tiết admin **và** từ điển công khai). Vị **không có** `index.json` → gallery tự ẩn (không vỡ layout).

## Lưu ý vận hành

- Thêm/đổi ảnh ⇒ **commit + redeploy** (nội dung tĩnh, như tongue-atlas). Không có upload trong app.
- Nên nén ảnh trước khi commit (khuyến nghị ≤ ~300KB/ảnh, cạnh dài ~1200px) để tải nhanh.
- Thư mục mẫu: `public/vi-thuoc/25/` (Cam Thảo) — ảnh hiện là **SVG placeholder**, thay bằng ảnh thật khi có.
