# Tài sản Google Play — Kinh Lạc Trương Gia

Bộ ảnh đồ hoạ cho trang ứng dụng trên Google Play Console. Tông màu bám đúng nhận diện
phần mềm (nâu Đông Y `#8a5e28` / kem `#faf6ef` / ánh kim `#cfad78`) và biểu tượng huyệt –
kinh lạc dùng chung cho cả icon, ảnh đầu trang và ảnh chụp màn hình.

## File nộp lên Play Console

| File | Kích thước | Dùng cho | Yêu cầu của Play |
|------|-----------|----------|------------------|
| `icon-512.png` | 512×512 | Biểu tượng ứng dụng (App icon) | PNG 32-bit, ≤ 1 MB. Play tự bo góc. |
| `feature-graphic-1024x500.png` | 1024×500 | Ảnh đầu trang (Feature graphic) | PNG/JPG 24-bit. |
| `screenshot-1-welcome.png` | 1080×1920 | Ảnh chụp màn hình điện thoại | ≥ 2 ảnh, tỉ lệ 9:16. |
| `screenshot-2-datlich.png` | 1080×1920 | Đặt lịch khám | |
| `screenshot-3-hoso.png` | 1080×1920 | Hồ sơ & tiền sử | |
| `screenshot-4-lichsu.png` | 1080×1920 | Lịch sử khám | |
| `screenshot-5-dokinhlac.png` | 1080×1920 | Kết quả đo kinh lạc | |

## Lưu ý quan trọng về ảnh chụp màn hình

Đây là **ảnh dựng minh hoạ (mockup)** theo đúng bộ tính năng thật của app bệnh nhân
(đăng nhập, đặt lịch, hồ sơ/tiền sử, lịch sử khám, kết quả đo kinh lạc) — dữ liệu hiển thị
là ví dụ ẩn danh. Tốt nhất nên **thay bằng ảnh chụp thật** từ app Flutter khi tiện, để khớp
100% giao diện thực tế (chính sách Google Play khuyến nghị ảnh phản ánh đúng trải nghiệm app).

## Tạo lại ảnh

Nguồn HTML/CSS nằm trong `src/`. Render bằng Chrome headless (đã cài sẵn trên máy):

```powershell
# cú pháp: render.ps1 -Html <file trong src/> -Width W -Height H -Out <tên.png>
& .\src\render.ps1 -Html "icon.html"    -Width 512  -Height 512  -Out "icon-512.png"
& .\src\render.ps1 -Html "feature.html" -Width 1024 -Height 500  -Out "feature-graphic-1024x500.png"
& .\src\render.ps1 -Html "shot1.html"   -Width 1080 -Height 1920 -Out "screenshot-1-welcome.png"
# ...shot2..shot5 tương tự
```

Sửa nội dung/chữ trong các file `src/*.html` (dùng chung `src/shot.css` cho ảnh màn hình) rồi
chạy lại lệnh tương ứng.
