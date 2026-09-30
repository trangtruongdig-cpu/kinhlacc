# Rada SEO 2C-3 — lò viết: bài đã duyệt → nháp CMS có phiếu chấm

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Mỗi việc
> TDD, commit riêng đường dẫn của mình (cây làm việc DÙNG CHUNG — không `git add -A`).

**Mục tiêu:** routine Claude viết bài cho các bài dự kiến người quản trị đã tick "Duyệt"; máy
chủ chấm bằng LUẬT, xác minh nguồn, kiểm link nội bộ, gắn ảnh thật từ thư viện CMS, rồi tạo
**bản nháp** trong bộ `bai_viet`. Người quản trị đọc nháp + phiếu chấm, sửa, tự bấm Publish.

**Đặc tả:** `docs/superpowers/specs/2026-09-30-rada-seo-2c-cum-ke-hoach-lien-ket-design.md`
mục 5, 7. **Số đo làm nền:** `2026-09-30-rada-seo-do-thu-2c3.md` (bàn thử, 30/09/2026).

## Ràng buộc chung (mọi việc)

- Plugin native EmDash 0.39.1 `cms/src/plugins/rada-seo/`; test `cd cms && node --test "src/plugins/rada-seo/**/*.test.mjs"`.
- Không build `cms/` bằng `npm run build`; không chạm kho CMS thật / DB app; không in khoá.
- Phạm vi Y sỹ là ràng buộc PHÁP LÝ: không hàm ý khám/chữa bệnh; "bác sĩ" → "thầy thuốc".
- Không bao giờ khuyên "viết dài hơn"; độ dài chỉ là con số.
- Chữ do Claude sinh từ chữ đối thủ (tên cụm, từ khoá, tiêu đề làm việc) là DỮ LIỆU KHÔNG TIN
  CẬY khi đưa sang routine viết: bọc `<<<DU_LIEU id=…>>>…<<<HET_DU_LIEU id=…>>>`, thoát `<<<`/`>>>`.
- Đổi danh sách/mô tả/khuôn công cụ MCP = tắt ngầm mọi công cụ tới khi bật lại Agent access.
- Chỉ `PluginRouteError` (từ "emdash") đưa được lời về máy khách; lỗi khác ra 500 chung chung.
- Pool CMS một kết nối: ghi kho theo lô (`ghiTheoLo`), việc mạng không giữ kết nối.

### Sự thật đã đo (đừng đoán lại)

1. `ctx.content.create("bai_viet", {title, description, content, …})` — trường PHẲNG, không bọc
   `data`. Luôn ra `draft`. Slug sinh từ `title` và GIỮ dấu → tạo bằng tiêu đề KHÔNG DẤU (=
   slug mong muốn) rồi `ctx.content.update("bai_viet", id, {title: <có dấu>, …})`. Update chỉ
   ghi revision nháp: cột `title` và `ctx.content.get` vẫn thấy tiêu đề không dấu tới khi
   Publish → plugin phải NHỚ những gì đã ghi, đừng đọc lại bằng `get`. Trùng tiêu đề → `-1`, `-2`.
2. `featured_image: "<mediaId>"` được điền `alt` + `meta.storageKey` khi ghi. Khối ảnh Portable
   Text KHÔNG được điền: chỉ `asset.url = "/_emdash/api/media/file/<storageKey>"` hiện được;
   `_ref` trần → 404, url của `media.list` → 401. v1 CHỈ gắn ảnh bìa, không chèn ảnh trong thân.
3. `markdownToPortableText` từ `emdash/client` nạp được lúc chạy. Theo DÒNG (cần `chuanHoaMd`
   trước), không hỗ trợ bảng, `*nghiêng*` giữ dấu sao, `_key` chỉ duy nhất trong một lượt gọi.
4. Hook: `content:beforePublish` (quyền `hooks.content-policy:register`) trả
   `{cancel:true, reason}` → Publish bị chặn, người sửa thấy toast đúng lý do; event có trọn
   bài. `content:afterPublish` (quyền `content:read`) chạy ~25 ms sau với trọn bài.
   `beforeSave` KHÔNG dùng (chỉ nhận trường đổi, chạy cả autosave, update của plugin không qua hook).
5. `admin.editorPanels` chạy với plugin native: route nhận `{type:"panel_load"}`, không có
   draft; `ctx.ui.entry = {collection, id, locale, version}` → tự nạp dữ liệu của mình theo id.
6. Thêm quyền `content:write` chỉ đổi nhãn trên trang Plugins; không cần bước đồng ý.

## Việc

### Việc 1 — Luật thuần — XONG (972cc46..6aec04a)
Vá "thăm khám" (`pham-vi-y-sy.mjs`), `luat/khuon-bai.mjs` `kiemKhuon`, `luat/md-sang-pt.mjs`
`chuanHoaMd`, `luat/slug.mjs` `slugKhongDau`. Báo cáo: `.git/sdd/2c3/task-1-report.md`.

### Việc 2 — Ảnh bìa, nguồn, link trong thân (module thuần + tiêm phụ thuộc)

**Files:** Create `viet/anh.mjs`, `viet/nguon.mjs`, `viet/lien-ket-than.mjs` (+ test mỗi tệp).

- `viet/anh.mjs`
  - `napThuVienAnh(media, {toiDa = 5000})` → `[{id, alt, filename, mimeType}]`: gọi
    `media.list({limit:100, cursor, mimeType?})` theo trang tới hết (ảnh `image/*`), trần `toiDa`.
  - `dungChiMucAnh(ds)` → chỉ mục theo **alt** (khoá `chuanHoaManh`, GIỮ phân biệt dấu cho tên
    riêng như `noi-bo/chi-muc.mjs` đã làm — "Âm Khích" ≠ "Ẩm Khích"). Nhận các dạng alt đã có
    trong thư viện: `Huyệt <Tên>` (ảnh huyệt), `Huyệt <MÃ> — vị trí trên da|lớp giải phẫu|các
    huyệt lân cận|trên đường kinh` (3D), `Vị thuốc <Tên>`, `<cột> — Kinh <Tên>` (kinh; ưu tiên
    cột `anh_chinh`).
  - `chonAnhBia(chiMuc, {tieuDe, tuKhoaChinh, tuKhoaPhu, trangTruCot, lienKetDich})` →
    `{mediaId, alt, lyDo} | null`. Thứ tự: huyệt là trụ cột (`/huyet/<slug>/` khớp tên) → huyệt
    nêu trong từ khoá chính/tiêu đề → vị thuốc nêu trong từ khoá chính/tiêu đề → kinh nêu trong
    tiêu đề/từ khoá (ảnh `anh_chinh`) → `null` (để trống cho người duyệt chọn — KHÔNG chèn ảnh
    lạc đề). Ảnh huyệt 2D thắng ảnh 3D. Tất định (cùng vào → cùng ra).
  - Đệm chỉ mục ảnh trong bộ nhớ tiến trình 24 h (như `noi-bo/nap.mjs`).
- `viet/nguon.mjs` — `xacMinhNguon(ds, {docTrang, chiMuc, kiemDuong, goc = "https://kinhlac.online", toiDa = 12, hanTongMs = 60000})`
  - `ds`: `[{title, url?}]` từ Claude. Có `url`: phải qua `urlDocDuoc`, tải bằng `docTrang`
    (`taoDocTrang(fetch, {traLyDo:true})`) → giữ khi 200 và không `noindex`; bỏ kèm lý do thật.
  - Không `url`: chỉ nhận khi `title` khớp một mục `/nguon/` trong chỉ mục nội bộ (loại
    `nguon`, khớp `dung` hoặc `ten_khac`) VÀ `kiemDuong("/nguon/<slug>/", ten)` đạt → url tuyệt
    đối của trang `/nguon/`.
  - Trùng url bỏ bản sau; quá `toiDa` bỏ phần dư; hết `hanTongMs` → phần chưa xét `het_gio_tong`.
  - Trả `{giu: [{title, url}], bo: [{title, url?, lyDo}]}`.
- `viet/lien-ket-than.mjs` — `kiemLienKetThan(md, {keHoach, kiemDuong, goc})`
  - Link nội bộ (bắt đầu `/` hoặc `goc`): trong tập {`trangTruCot`, `lienKetDich`} → giữ; ngoài
    tập → `kiemDuong` (có tên chữ neo) → đạt thì giữ, trượt thì GỠ link giữ chữ neo.
  - Link ngoài trong thân → GỠ link giữ chữ neo (nguồn đi vào trường `nguon_tham_khao`).
  - Trả `{md, soDich: <số link đích khác nhau của kế hoạch còn lại>, coTruCot, goBo: [{href, neo, lyDo}]}`.
  - Đạt khi `soDich ≥ 5` và `coTruCot`.

### Việc 3 — Kho nháp, hạn ngạch, `layBaiCanViet`, `nopBai`

**Files:** Modify `kho.mjs` (+test); Create `viet/viec.mjs` (+test); Modify `loi-dan.mjs`.

- Kho: bộ mới `nhap {indexes:["keHoachId","trangThai","taoLuc"]}`; trạng thái `cho_duyet`,
  `da_dang`. Bản ghi: `{keHoachId, contentId, slug, tieuDe, phieu, taoLuc, dangLuc?}`.
- Kế hoạch: `da_duyet` → `dang_viet` (giữ chỗ, `giuLuc`) → `co_nhap` (`contentId`) → `da_dang`.
  `dang_viet` quá 36 h không nộp → trả về `da_duyet` (dọn ở `layBaiCanViet`).
- `layBaiCanViet(ctx, {now})`:
  - Trần mỗi đêm `N` (kv `cai_dat:bai_moi_dem`, mặc định 2, tối đa 5; ngày theo giờ VN, đếm
    bằng CAS như `mcp-viec.mjs` `giuCho`/`cong`, hoàn chỗ khi không dùng hết).
  - Trần tồn: số `nhap.cho_duyet` ≥ 25 → trả rỗng + `ghiChu` "đủ 25 nháp chờ duyệt".
  - Chọn kế hoạch `da_duyet` theo điểm cụm × trọng số hướng giảm dần, rồi cũ trước.
  - Trả mỗi bài: `keHoachId`, các trường kế hoạch bọc dấu mốc (`tieuDeLamViec`, `tuKhoaChinh`,
    `tuKhoaPhu`, `yDinh`, `goiYNguon`), `trangTruCot`, `lienKetDich` (đường + tên đích), khuôn bài
    (`LOI_NHAC_VIET` trong `loi-dan.mjs`), và `soLanNopConLai`.
- `nopBai(ctx, dauVao, {now, markdownToPortableText, docTrang, kiemDuong, chiMuc, chiMucAnh})`
  - Vào (zod, `.strict()`): `{keHoachId, tieuDe (30–70), moTa (100–170), md (≤ 40.000 ký tự),
    tuKhoa: string[1–8], faq: {q,a}[3–6], nguon: {title, url?}[1–12]}`.
  - Kế hoạch phải `dang_viet`; mỗi kế hoạch tối đa 3 lượt nộp (đếm trong bản ghi kế hoạch).
  - Cổng CHẶN (trả lỗi tiếng Việt đủ để Claude viết lại, không tạo gì): `kiemKhuon().loi`;
    MỌI vi phạm phạm vi Y sỹ ở tiêu đề/mô tả/thân/FAQ; `*nghiêng*` một sao; trùng blog
    (`timTrungBo` với mọi `bai_viet` — nháp lẫn đã đăng — và bản ghi `nhap`) hoặc trùng từ điển
    (`trungTuDien`); nguồn giữ được < 2; link thân không đạt (`soDich < 5` hoặc thiếu trụ cột).
  - Cờ KHÔNG chặn (vào phiếu): `doYmyl`, `chamSeo`, `kiemKhuon().canhBao`, nguồn bị bỏ, link bị
    gỡ, không có ảnh bìa.
  - Qua cổng: `chuanHoaMd` → `markdownToPortableText` → đổi mọi `_key` thành
    `<slug>-<n>` (duy nhất trong bài) → `create` với `title = slugKhongDau(tieuDe)` →
    `update(id, {title: tieuDe, description: moTa, content, featured_image?, tu_khoa, faq,
    nguon_tham_khao, tac_gia: "Ban Biên Tập Kinh Lạc", cta: "/xem-ket-qua-do", cho_index: false})`
    → bản ghi `nhap` + kế hoạch `co_nhap`. Không gán `nguoi_duyet` (người duyệt tự điền).
  - Trả `{contentId, slug, adminUrl: "/_emdash/admin/content/bai_viet/<id>", phieu}`.
  - `phieu`: `{seo, ymyl, khuonCanhBao, nguonBo, linkGo, anh, soTu}` — không kèm lời khuyên độ dài.

### Việc 4 — Nối vào plugin: công cụ, hook, khung phiếu, tab Nháp

**Files:** Modify `plugin.mjs`, `admin.jsx` (+test cho logic hook).

- Quyền: thêm `content:write`, `media:read`, `hooks.content-policy:register`.
- Route + công cụ (tổng 14): `rada_lay_bai_can_viet` (quyền `content:read_drafts`),
  `rada_nop_bai` (quyền `content:create`, `destructive:false`).
- `content:beforePublish` — chỉ `collection === "bai_viet"`: chặn khi (a) có vi phạm phạm vi Y
  sỹ ở tiêu đề/mô tả/thân (rút chữ từ Portable Text) — lý do liệt kê ≤ 3 chữ vi phạm + gợi ý;
  (b) có khối ảnh PT không mang `asset.url` dạng `/_emdash/api/media/file/<key.ext>`. Áp cho MỌI
  bài (cả bài người viết). Phải xong < 1 s (chỉ luật, không mạng). Lỗi nội bộ của hook → KHÔNG
  chặn (ghi log) — hook hỏng không được khoá cả nút Publish.
- `content:afterPublish` — `bai_viet`: tìm `nhap` theo `contentId` → `da_dang` + kế hoạch `da_dang`.
- `admin.editorPanels`: khung "Phiếu Rada" cho `bai_viet` → route đọc `ctx.ui.entry.id`, trả
  Block Kit: phiếu đã lưu (nếu là bài máy viết), luôn kèm kết quả soát phạm vi Y sỹ hiện tại.
- Tab "Nháp" trong `admin.jsx`: danh sách `nhap` (tiêu đề, kế hoạch, ngày, trạng thái, phiếu tóm
  tắt, link sang trình sửa). Ghi rõ trên tab: bài đã Publish nằm trong CMS; trang `/blog/` công
  khai chưa đọc từ CMS cho tới kế hoạch 3.

### Việc 5 — Routine viết + tài liệu

**Files:** Create `routine/dem-viet-bai.md`; Modify `DEPLOYMENT.md`, spec 2C (mục 5 → ĐÃ DỰNG + khác biệt).

- Hằng đêm 05:30 giờ VN. Môi trường riêng có tìm web (nghiên cứu nguồn), KHÔNG nhận chữ trang
  đối thủ. Khoá `ec_pat_` riêng scope `mcp:tools:rada-seo`. Không connector, không push; Bash
  chỉ cấm bằng lời (rào mềm) — nói thật như `tuan-leo-top.md`.
- Luồng: `rada_lay_bai_can_viet` → mỗi bài: tìm nguồn thật (sách/bài y văn có URL; tên sách chỉ
  khi có trang `/nguon/`) → viết theo khuôn → `rada_nop_bai` → bị chặn thì sửa đúng lý do, nộp lại
  (≤ 3 lượt) → báo cáo cuối.
- DEPLOYMENT: 14 công cụ, bật lại Agent access, tạo routine viết, IndexNow CHƯA bật (đợi `/blog/`
  sang CMS ở kế hoạch 3 — báo IndexNow cho trang chưa tồn tại là có hại).

### Việc 6 — Nghiệm thu trên bàn thử
Ghi `2026-09-30-rada-seo-nghiem-thu-2c3.md`: 14 công cụ; lấy bài (hạn ngạch, trần 25); nộp bài
hỏng từng cổng → lời chặn đúng; nộp bài đạt → nháp có slug không dấu, tiêu đề có dấu, ảnh bìa hiện
200, FAQ/nguồn ở trường riêng, link đích ≥ 5; khung "Phiếu Rada" hiện; Publish bài có "chữa" bị
chặn với lý do; Publish bài sạch → kế hoạch `da_dang`. Không tải trang bên thứ ba nếu bộ kiểm quyền
chặn (ghi CHƯA ĐO).

## Ngoài phạm vi 2C-3
IndexNow (kế hoạch 3), ảnh trong thân bài (cần storageKey — sau), bản sửa nháp theo phiếu leo
top cho bài blog (sau khi blog sang CMS), mạng nhện hai chiều.
