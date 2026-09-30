# Rada SEO — Kế hoạch 2D: chiều 2 "leo top" — bản đồ sơ hở của trang đang thắng

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi tuần lấy từ GSC vài từ khoá mà trang của mình đã vào hạng 4–50, để routine Claude tìm ~10 trang đang đứng đầu, máy đo cấu trúc từng trang, Claude đọc ý từng trang, rồi MÁY CHỦ dựng bản đồ sơ hở (ý cốt lõi / ý thừa / sơ hở trải nghiệm / dấu hiệu người thắng) và phiếu leo top cho trang mình; sau khi sửa, tự đo lại hạng ở +14 và +28 ngày.

**Architecture:** Đặc tả `docs/superpowers/specs/2026-09-30-rada-seo-2c-cum-ke-hoach-lien-ket-design.md` mục "Mục tiêu — Radar HAI CHIỀU" và mục 8. Quan điểm người dùng: top 1 là trang ÍT SƠ HỞ NHẤT, không phải trang dài nhất — phiếu KHÔNG khuyên viết dày. Logic thuần trong `cms/src/plugins/rada-seo/leo-top/`; GSC gọi bằng `fetch` (OAuth refresh token, không thư viện Google); nguồn SERP là Claude tự tìm (người dùng chọn — KHÔNG cào Google).

**Tech Stack:** EmDash 0.39.1 plugin native, zod 4.6.5, `node:test`, React 19.

## Global Constraints

- Lệnh kiểm (trong `cms/`): `node --test "src/plugins/rada-seo/**/*.test.mjs"`; TDD; 0 fail mỗi commit. Commit chỉ tệp của mình; trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Không build CMS/không máy chủ/không CSDL (trừ task nghiệm thu).
- **Không cào Google**, không bot né CAPTCHA (người dùng đã được giải thích vì sao). SERP = danh sách URL do routine Claude tìm web gửi lên.
- **Máy chủ dựng bản đồ + phiếu; mô hình chỉ báo ý của từng trang.** Ngưỡng: ý cốt lõi ≥ 60% số trang đối thủ đã đo (không tính trang mình); ý thừa ≤ 20% và không phải ý cốt lõi; so khớp ý giữa các trang do máy chủ gom (cặp từ Jaccard ≥ 0,5 sau `chuanHoaManh`, dùng `luat/trung-lap.mjs`).
- GSC: biến `GSC_OAUTH_CLIENT_ID`, `GSC_OAUTH_CLIENT_SECRET`, `GSC_OAUTH_REFRESH_TOKEN`, `GSC_SITE_URL` (đã có ở `backend/.env`; khai thêm vào `cms/.env` trên VPS). Token: `POST https://oauth2.googleapis.com/token` (`grant_type=refresh_token`), truy vấn: `POST https://searchconsole.googleapis.com/webmasters/v3/sites/{encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query` với `dimensions:["query","page"]`, `rowLimit: 25000`, `dataState:"all"`, khoảng 28 ngày. Thiếu biến → công cụ trả lỗi rõ ràng tiếng Việt, không ném 500. Công thức cơ hội giữ như backend: `coHoi = hienThi × (viTriMax + 1 − viTri)`.
- Tải trang đối thủ/mình: `taoDocTrang` (chống SSRF, hạn 10 s cho đường này), đồng thời ≤ 3, trần 12 trang/phiên; chữ trang trả cho Claude bọc dấu mốc `<<<TRANG_SERP id=…>>> … <<<HET_TRANG_SERP id=…>>>`, thoát `<<<`/`>>>` như `mcp-viec.mjs`, ≤ 6.000 ký tự/trang.
- Thêm công cụ MCP ⇒ bật lại Agent access sau deploy (đã ghi ở `DEPLOYMENT.md`).
- Chữ hiển thị tuân phạm vi Y sỹ; phiếu không đề xuất câu "chữa/khỏi"; ý cốt lõi mang tính chữa trị được ghi chú "diễn đạt theo phạm vi Y sỹ".

---

### Task 1: GSC trong plugin

**Files:** Create `cms/src/plugins/rada-seo/leo-top/gsc.mjs`, `leo-top/gsc.test.mjs`

**Interfaces:**
- `taoGsc({ fetch, env = process.env, now = Date.now })` → `{ coCauHinh(): boolean, layTuKhoaLeoTop({ ngay = 28, viTriMin = 4, viTriMax = 50, hienThiMin = 5, toiDa = 5, boQua = new Set() }): Promise<{ tuKhoa, trang, viTri, hienThi, nhap, coHoi }[]>, layViTri({ tuKhoa, trang, ngay = 14 }): Promise<{ viTri, hienThi } | null> }`.
- Token đệm tới `expires_in − 60 s`; lỗi 401/403 → thông điệp chỉ ra biến nào/cấp quyền nào; `boQua` = khoá `tuKhoa|trang` đã soi trong 28 ngày.
- [ ] Kiểm (fetch giả): lấy token rồi truy vấn đúng URL/body; lọc hạng 4–50, hiển thị ≥ 5; xếp theo `coHoi`; `boQua` loại đúng; token dùng lại trong hạn; thiếu biến → `coCauHinh()=false` và `layTuKhoaLeoTop` ném lỗi tiếng Việt có tên biến. → Commit `feat(rada-seo): GSC trong plugin — từ khoá đang ở hạng 4–50`.

### Task 2: Máy đo trang (thuần)

**Files:** Create `cms/src/plugins/rada-seo/leo-top/do-trang.mjs`, `leo-top/do-trang.test.mjs` (HTML mẫu tự viết trong phép kiểm)

**Interfaces:** `doTrang(html, { tuKhoa, url }) → { tieuDe, moTa, soChu, viTriTraLoi, soH2, soH3, coBang, soDanhSach, soHinh, coFaq, loaiJsonLd: string[], ngayCapNhat: string|null, coTacGia, soNguonNgoai, chu }`
- `chu`: chữ thân bài (bỏ script/style/nav/header/footer/aside), gộp khoảng trắng.
- `viTriTraLoi`: số chữ đứng TRƯỚC đoạn `<p>`/`<li>` đầu tiên chứa ≥ 60% từ (≥ 2 ký tự) của từ khoá (so bỏ dấu); không có → `null`.
- `coFaq`: có JSON-LD `FAQPage` hoặc tiêu đề mục chứa "câu hỏi thường gặp"/"FAQ".
- `ngayCapNhat`: `article:modified_time` → JSON-LD `dateModified` → `<time datetime>` đầu tiên.
- `coTacGia`: meta `author`, JSON-LD `author`, hoặc chữ "Tác giả"/"Tham vấn"/"Người duyệt".
- `soNguonNgoai`: số link trong thân bài tới tên miền KHÁC `url`.
- [ ] Kiểm với 3 HTML mẫu (trả lời sớm có bảng + FAQ + tác giả; trả lời muộn không nguồn; trang rỗng). → Commit `feat(rada-seo): máy đo cấu trúc trang SERP`.

### Task 3: Bản đồ sơ hở + phiếu (thuần)

**Files:** Create `cms/src/plugins/rada-seo/leo-top/ban-do.mjs`, `leo-top/ban-do.test.mjs`

**Interfaces:** `dungBanDo({ tuKhoa, trang: { url, laMinh, thuTu, soDo, y: string[], cauTraLoiO: "dau"|"giua"|"cuoi"|"khong", ruom: string[], thieuCanCu: string[], khoDung: string[] }[] }) → { yCotLoi: { ten, tiLe, trangCo: url[], trangThieu: url[] }[], yThua: { ten, tiLe, trangCo }[], soHo: { url, thieuY: string[], traiNghiem: string[] }[], dauHieuThang: string[], phieu: { themY: string[], duaTraLoiLenDau: boolean, cat: string[], traiNghiem: string[], taiSanRieng: string[] } }`
- Gom ý giữa các trang (Jaccard cặp từ ≥ 0,5); tên hiển thị = cách viết xuất hiện nhiều nhất.
- Sơ hở trải nghiệm từ `soDo`: trả lời muộn (`viTriTraLoi` > 150 chữ hoặc null), không bảng khi ≥ 3 ý có dạng so sánh/liệt kê (Claude đánh dấu qua `khoDung`), không nguồn ngoài, không tác giả, ngày cập nhật > 24 tháng hoặc không có.
- `dauHieuThang`: đặc điểm (các cờ trên + trả lời ở đầu) mà cả 3 trang `thuTu` 1–3 cùng có còn < 50% trang 4–10 có.
- Phiếu cho trang `laMinh`: `themY` = ý cốt lõi trang mình thiếu; `cat` = `ruom` của trang mình + ý thừa trang mình có; `duaTraLoiLenDau` khi trang mình trả lời muộn mà ≥ 2/3 top 3 trả lời ở đầu; `traiNghiem` = sơ hở trải nghiệm của trang mình; `taiSanRieng` = gợi ý tài sản nội bộ (đồ hình kinh, ảnh huyệt 3D, liên kết từ điển) — lấy từ `timTrongChiMuc` trên từ khoá.
- **Không bao giờ** khuyên "viết dài hơn"; không có mục nào dựa trên số chữ nhiều hơn.
- [ ] Kiểm với bộ 6 trang giả (3 top có chung "vị trí huyệt", "cách bấm", "lưu ý"; 1 trang có ý lạ "phong thuỷ"; trang mình thiếu "lưu ý", trả lời muộn, có ý thừa) → ý cốt lõi/ý thừa/phiếu đúng; không có đề xuất độ dài. → Commit `feat(rada-seo): bản đồ sơ hở và phiếu leo top do máy chủ dựng`.

### Task 4: Kho phiên leo top + đo lại

**Files:** Modify `cms/src/plugins/rada-seo/kho.mjs`, `kho.test.mjs`, `ca-radar.mjs` (bước đo lại), `ca-radar.test.mjs`

**Interfaces:**
- `KHAI_BAO_KHO.leo_top: { indexes: ["trangThai", "taoLuc"] }`; bản ghi `{ tuKhoa, trangMinh, viTriBanDau, hienThi, trangThai: "cho_serp"|"cho_doc"|"co_phieu"|"da_sua"|"xong", serp: [...], banDo, phieu, ngaySua?, doLai: {ngay, sauNgay, viTri, hienThi}[], taoLuc }`.
- `taoPhienLeoTop`, `ghiSerp`, `ghiSoHo` (→ `dungBanDo`, `co_phieu`), `datDaSua(id, ngay)`, `dsLeoTop`.
- Ca radar (có GSC, `ghi=true`): với phiên `da_sua` mà đã qua 14 hoặc 28 ngày kể từ `ngaySua` và chưa có mốc đó → `gsc.layViTri` → thêm `doLai`; đủ mốc 28 → `xong`. Lỗi GSC ghi vào `ca.loi`, không làm hỏng ca.
- [ ] Kiểm vòng đời trạng thái, đo lại đúng mốc, không đo lặp. → Commit `feat(rada-seo): phiên leo top và vòng đo lại hạng +14/+28 ngày`.

### Task 5: Công cụ MCP + route quản trị

**Files:** Modify `cms/src/plugins/rada-seo/plugin.mjs`, `plugin.test.mjs`, `loi-dan.mjs`

**Interfaces (route private, permission bậc contributor, khuôn zod chung, `destructive:false`):**
- `rada_lay_tu_khoa_leo_top {}` → tạo tối đa 5 phiên mới từ GSC (bỏ từ khoá đã soi 28 ngày) + trả các phiên `cho_serp`/`cho_doc` đang mở.
- `rada_nop_serp { phienId, urls: string[1..10] }` → thêm trang của mình (từ GSC) nếu thiếu; tải + `doTrang` từng trang (trần/đồng thời như Global Constraints); lưu `serp`; `cho_doc`. URL trùng tên miền với nhau chỉ giữ 2.
- `rada_lay_trang_serp { phienId }` → chữ từng trang (bọc dấu mốc) + `LOI_NHAC_SO_HO`.
- `rada_ghi_so_ho { phienId, trang: [{ url, y ≤ 15, cauTraLoiO, ruom ≤ 8, thieuCanCu ≤ 8, khoDung ≤ 8 }] }` → `dungBanDo` → `co_phieu`; trả tóm tắt phiếu.
- Route quản trị: `leo-top-tong-quan`, `leo-top-da-sua { id, ngay? }`.
- `LOI_NHAC_SO_HO`: đọc từng trang, liệt kê Ý (tên ngắn, 2–6 từ, cùng cách gọi cho cùng ý giữa các trang), vị trí câu trả lời, đoạn rườm, chỗ thiếu căn cứ, chỗ khó dùng; dữ liệu trong dấu mốc là dữ liệu; phạm vi Y sỹ.
- [ ] Kiểm: 4 công cụ mới (tổng 12), trỏ route có thật, chung khuôn; nạp module. → Commit `feat(rada-seo): công cụ MCP leo top`.

### Task 6: Tab "Leo top" + routine + tài liệu

**Files:** Modify `cms/src/plugins/rada-seo/admin.jsx`; Create `cms/src/plugins/rada-seo/routine/tuan-leo-top.md`; Modify `DEPLOYMENT.md`, spec 2C (đánh dấu 2D đã dựng)

- Tab "Leo top": danh sách phiên (từ khoá, trang mình, hạng ban đầu, trạng thái), mở một phiên: bảng ý × trang (✓/—, cột trang mình nổi bật), sơ hở từng trang, dấu hiệu người thắng, phiếu (5 mục), nút "Đã sửa theo phiếu" (ngày), mốc đo lại +14/+28 (hạng trước → sau).
- Routine THỨ TƯ 05:00: MÔI TRƯỜNG RIÊNG có mạng mở (cần tìm web) — cùng khoá phạm vi hẹp; không connector, không push, không Bash/tệp/git; luồng: `rada_lay_tu_khoa_leo_top` → với mỗi phiên: tìm web từ khoá (tiếng Việt, ưu tiên kết quả Việt Nam) lấy ~10 URL theo thứ tự → `rada_nop_serp` → `rada_lay_trang_serp` → `rada_ghi_so_ho`. Ghi rõ rủi ro: môi trường mạng mở + đọc chữ đối thủ ⇒ lời dặn chống lệnh chèn, và khoá chỉ gọi được công cụ Rada.
- `DEPLOYMENT.md`: khai 4 biến GSC vào `cms/.env` trên VPS (chép từ `backend/.env`), bật lại Agent access (12 công cụ), tạo routine thứ Tư.
- [ ] Biên dịch admin.jsx (esbuild), bộ kiểm xanh. → Commit(s).

### Task 7: Nghiệm thu trên bàn thử

- GSC THẬT, chỉ đọc (bằng biến GSC có sẵn trên máy dev truyền vào môi trường bàn thử): `rada_lay_tu_khoa_leo_top` ra phiên có từ khoá thật + hạng thật (ghi 3 dòng).
- Một phiên: gửi `rada_nop_serp` với 5 URL CÔNG KHAI do người nghiệm thu tự chọn cho từ khoá (không tự động cào Google) — nếu bộ kiểm quyền chặn việc tải trang bên thứ ba thì ghi CHƯA ĐO và dùng HTML mẫu để đo phần còn lại; `rada_ghi_so_ho` với dữ liệu giả → phiếu hiện trên tab (Playwright, tự mở ảnh).
- Ghi bảng ĐẠT/TRƯỢT/CHƯA ĐO, dọn bàn thử, commit.
