# Rada SEO — Kế hoạch 2C-1: nguồn sạch hơn + kho liên kết nội bộ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Radar chỉ quét sitemap BÀI VIẾT của đối thủ, không trích thêm khi Claude đọc chưa kịp, tính khoảng trống không nghẽn tiến trình CMS, và có kho liên kết nội bộ (từ điển + blog) với công cụ MCP `rada_tim_lien_ket` trả về các đường dẫn ĐÃ KIỂM là sống, đúng trang.

**Architecture:** Đặc tả `docs/superpowers/specs/2026-09-30-rada-seo-2c-cum-ke-hoach-lien-ket-design.md` mục 1 và 3. Mô-đun thuần có phép kiểm (`node:test`); I/O (CMS `ctx.content`, `ctx.http`) nhận qua tham số để thay bằng bản giả.

**Tech Stack:** EmDash 0.39.1 plugin native (`cms/src/plugins/rada-seo/`), zod 4.6.5, `node:test`.

## Global Constraints

- Lệnh kiểm (trong `cms/`): `node --test "src/plugins/rada-seo/**/*.test.mjs"` — hiện 75 đạt; mọi task kết thúc với 0 fail.
- TDD: viết phép kiểm trước, chạy thấy đỏ, rồi mới viết mã.
- Commit chỉ tệp của mình (`git commit -m … -- <paths>`); trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Không build CMS, không chạy máy chủ (trừ Task 6 bàn thử), không nối CSDL.
- Giữ mọi rào của 2A/2B-1: công tắc `RADA_SEO_CA_DEM`, khoá KV, `PluginRouteError`, ghi kho theo lô 20 + nghỉ 150 ms, chống SSRF (`urlDocDuoc` + cùng tên miền), bọc chữ trang bằng dấu mốc.
- **Sự thật đã ĐO (30/09/2026) — dùng, đừng đoán lại:**
  - `ctx.content.list(bo, { limit ≤ 100, cursor, where: { status: "published" } })` — KHÔNG truyền `status` thì ra cả nháp. Trả `{ items, cursor?, hasMore }`; `item.data` chứa mọi cột thường, kể cả `slug_goc` chưa khai.
  - Đường công khai: huyệt `/huyet/<slug>/`, kinh `/kinh/<slug>/` (slug NGẮN: `phe`, `ty`, `tam-bao`… — đường theo `slug_goc` dài trả 404), bệnh học `/benh-hoc/<slug>/`, châm cứu trị bệnh `/cham-cuu-tri-benh/<slug>/`, dược liệu `/duoc-lieu/<id số>/` (cột slug = id), nguồn `/nguon/<slug>/`, bài viết `/blog/<slug>` (không "/" cuối), bài thuốc `/bai-thuoc/<slug>/`.
  - **`slug_goc` KHÔNG đáng tin cho huyệt:** "Âm Khích" (HT6, slug `am-khich`) và "Ẩm Khích" (HE6, slug `am-khich-2`) cùng `slug_goc = am-khich`; site thật có cả hai trang, `<title>` lần lượt "Huyệt Âm Khích (HT6): …" và "Huyệt Ẩm Khích: …". ⇒ Mỗi mục sinh DANH SÁCH đường ứng viên (`slug` trước, rồi `slug_goc` nếu khác), và **bộ kiểm đường tải trang, so tên CÓ DẤU** (NFC, chữ thường) trong `<title>`/`<h1>` để chọn đúng.
  - Trang bài thuốc/dược liệu KHÔNG tồn tại vẫn trả **200** (vỏ SPA) kèm header **`x-robots-tag: noindex`** ⇒ coi `noindex` = không có trang.
  - Bài thuốc (13.942) và vị thuốc tra qua `POST https://kinhlac.online/api/tra-cuu/ten` body `{ ten: string[] }` (công khai; ≤ 200 tên/lượt, tên ≥ 4 ký tự) → `Record<tên, {loai:'bai_thuoc',ten,slug} | {loai:'vi_thuoc',ten,id} | {loai:'nguon',ten,slug}[]>`. Đo: "Quy Tỳ Thang" → `/bai-thuoc/quy-ty-thang/`, "Toan Táo Nhân" → `/duoc-lieu/61/`.
  - Số mục đã xuất bản: huyệt 1.059, kinh 20, bệnh học 100, châm cứu trị bệnh 100, dược liệu 1.045, nguồn 2.139.

---

### Task 1: Chỉ quét sitemap bài viết

**Files:**
- Modify: `cms/src/plugins/rada-seo/radar/sitemap.mjs`, `radar/sitemap.test.mjs`, `ca-radar.mjs` (theo chữ ký mới), `ca-radar.test.mjs` nếu cần

**Interfaces:**
- Produces: `phanLoaiSitemap(url): "bai_viet" | "bo" | "khong_ro"`; `thuThapUrl(tenMien, docWeb, opts) → Promise<{ urls: string[], sitemapBo: string[] }>` (ĐỔI kiểu trả về từ `string[]`); `ca.sitemapBo` (≤ 20 tên) ghi vào nhật ký ca.

Luật phân loại (so trên phần đường dẫn + tên tệp, chữ thường, bỏ dấu):
- `bo` nếu chứa một trong: `page-sitemap`, `category`, `tag`, `author`, `product`, `san-pham`, `bac-si`, `doctor`, `chi-nhanh`, `branch`, `dich-vu`, `service`, `tuyen-dung`, `career`, `video`, `image`, `faq`, `landing`.
- `bai_viet` nếu chứa: `post`, `blog`, `tin-tuc`, `bai-viet`, `news`, `article`, `kien-thuc`, `cam-nang`.
- còn lại `khong_ro` → VẪN quét (bỏ sót tệ hơn quét thừa; lọc ngách sau đó lo phần rác).
- Sitemap GỐC (`/sitemap.xml`, `/sitemap_index.xml`, khai trong robots) luôn đọc; luật chỉ áp cho sitemap CON trong index.

- [ ] **Step 1: Phép kiểm (đỏ)** — thêm vào `radar/sitemap.test.mjs`:

```js
import { phanLoaiSitemap } from "./sitemap.mjs";

test("phanLoaiSitemap: giữ bài viết, bỏ bác sĩ/dịch vụ/danh mục, không rõ thì giữ", () => {
	for (const u of ["https://a.vn/post-sitemap.xml", "https://a.vn/post-sitemap2.xml", "https://a.vn/tin-tuc-sitemap.xml", "https://a.vn/sitemap-blog.xml", "https://a.vn/cam-nang/sitemap.xml"])
		assert.equal(phanLoaiSitemap(u), "bai_viet", u);
	for (const u of ["https://a.vn/page-sitemap.xml", "https://a.vn/category-sitemap.xml", "https://a.vn/bac-si-sitemap.xml", "https://a.vn/chi-nhanh-sitemap.xml", "https://a.vn/dich-vu-sitemap.xml", "https://a.vn/tuyen-dung-sitemap.xml", "https://a.vn/post_tag-sitemap.xml", "https://a.vn/author-sitemap.xml"])
		assert.equal(phanLoaiSitemap(u), "bo", u);
	assert.equal(phanLoaiSitemap("https://a.vn/sitemap-3.xml"), "khong_ro");
});

test("thuThapUrl: bỏ sitemap con loại 'bo', trả danh sách đã bỏ", async () => {
	const web = webGia({
		"https://a.com/sitemap.xml": "<sitemapindex><sitemap><loc>https://a.com/post-sitemap.xml</loc></sitemap><sitemap><loc>https://a.com/bac-si-sitemap.xml</loc></sitemap><sitemap><loc>https://a.com/sitemap-9.xml</loc></sitemap></sitemapindex>",
		"https://a.com/post-sitemap.xml": "<urlset><url><loc>https://a.com/bai-1</loc></url></urlset>",
		"https://a.com/bac-si-sitemap.xml": "<urlset><url><loc>https://a.com/bs-an</loc></url></urlset>",
		"https://a.com/sitemap-9.xml": "<urlset><url><loc>https://a.com/khac</loc></url></urlset>",
	});
	const kq = await thuThapUrl("a.com", web);
	assert.deepEqual(kq.urls.sort(), ["https://a.com/bai-1", "https://a.com/khac"]);
	assert.deepEqual(kq.sitemapBo, ["https://a.com/bac-si-sitemap.xml"]);
});
```
Sửa các phép kiểm `thuThapUrl` cũ theo kiểu trả về mới (`.urls`).

- [ ] **Step 2: Chạy → đỏ. Step 3: Viết mã** (`phanLoaiSitemap`, lọc trong vòng BFS, gom `sitemapBo`; `ca-radar.mjs` dùng `.urls` và gắn `ca.sitemapBo` gộp mọi đối thủ, cắt 20). **Step 4: Chạy → xanh. Step 5: Commit** `feat(rada-seo): chỉ quét sitemap bài viết của đối thủ`.

---

### Task 2: Van hàng chờ + tính khoảng trống không nghẽn tiến trình

**Files:**
- Modify: `cms/src/plugins/rada-seo/ca-radar.mjs`, `ca-radar.test.mjs`, `kho.mjs`, `kho.test.mjs`, `radar/khoang-trong.mjs`, `radar/khoang-trong.test.mjs`, `luat/trung-lap.mjs` (chỉ THÊM hàm, không đổi hành vi cũ — phép kiểm vàng giữ nguyên), `mcp-viec.mjs` (await)

**Interfaces:**
- `NGUONG_HANG_CHO = 80` (ca-radar): trước vòng trích của MỖI đối thủ, nếu `kho.demChoAi(s) > NGUONG_HANG_CHO` thì KHÔNG trích (vẫn quét sitemap, vẫn ghi URL mới) và ghi MỘT lần vào `ca.loi`: `"Tạm ngừng trích: hàng chờ Claude đọc đang N trang (> 80)"`; `ca.dungTrich = true`.
- `KHAI_BAO_KHO.url.indexes` thêm `"phanTichLuc"`. `kho.chuDeDaPhanTich(s, doiThu, { toiDa = 1500 })`: lấy `da_phan_tich` MỚI NHẤT theo `phanTichLuc` giảm dần, tối đa `toiDa` dòng (dùng `query({ where:{trangThai:"da_phan_tich"}, orderBy:{phanTichLuc:"desc"} })` + cursor, dừng khi đủ). Dòng cũ (2A) không có `phanTichLuc` vẫn được lấy sau cùng.
- `trung-lap.mjs` THÊM: `taoBoKhoa(ds) → { ds, tap: Set[] }` (tính `tapKhoa` một lần) và `timTrungBo(moi, bo, nguong)` (cùng kết quả `timTrung` nhưng dùng tập tính sẵn). `timTrung`, `gomNhom` giữ nguyên chữ ký/hành vi.
- `timKhoangTrong(...)` thành **async**, dùng `taoBoKhoa`/`timTrungBo`, và `await nhuong()` (`new Promise(r => setImmediate(r))`) mỗi 200 vòng ngoài của cả phần lọc lẫn `gomNhom` (viết `gomNhomAsync` trong khoang-trong.mjs dùng tập tính sẵn + nhường). Kết quả phải GIỐNG HỆT bản đồng bộ.

- [ ] **Step 1: Phép kiểm (đỏ):**
  - ca-radar: hàng chờ 81 trang `cho_ai` sẵn trong kho giả → chạy thật: `soTrich = 0`, `ca.dungTrich = true`, URL mới vẫn được thêm, `ca.loi` có đúng MỘT dòng "Tạm ngừng trích".
  - kho: 5 dòng `da_phan_tich` có `phanTichLuc` khác nhau + 1 dòng không có → `chuDeDaPhanTich(s, dt, { toiDa: 3 })` trả 3 dòng mới nhất.
  - khoang-trong: giữ 3 phép kiểm cũ (đổi sang `await`); thêm phép kiểm so kết quả async với kết quả tính bằng `gomNhom`/`timTrung` gốc trên bộ 22 bài fixture + chủ đề giả → bằng nhau; thêm phép kiểm "nhường": bơm 1.000 chủ đề đối thủ giả, đếm số lần `setImmediate` được gọi (bọc tạm) ≥ 4.
- [ ] **Step 2: đỏ → Step 3: mã → Step 4: xanh (đủ bộ) → Step 5: Commit** `perf(rada-seo): van hàng chờ trích, khoảng trống chỉ tính 1.500 chủ đề mới nhất và nhường tiến trình`.

---

### Task 3: Chỉ mục nội bộ (thuần) — dựng + tìm

**Files:**
- Create: `cms/src/plugins/rada-seo/noi-bo/chi-muc.mjs`, `noi-bo/chi-muc.test.mjs`
- Create: `cms/src/plugins/rada-seo/noi-bo/__fixture__/muc-noi-bo-30-09.json` — CHÉP từ `/private/tmp/claude-501/-Users-truongtrang-Desktop-kinhlacc/1165efad-b504-4489-a66b-43a008ceb60d/scratchpad/muc-noi-bo-mau.json` (tên/slug THẬT đọc chỉ-đọc từ kho CMS ngày 30/09/2026: 71 huyệt gồm Tam Âm Giao, Thần Môn, Âm Khích, Ẩm Khích, Cự Liêu…; 20 kinh; 100 bệnh học; 100 châm cứu trị bệnh; 66 dược liệu; 89 nguồn)

**Interfaces:**
- `MUC_BO`: bảng bộ → `{ loai, tienTo, laySlug }` cho `huyet_vi`(loai `huyet`, `/huyet/`), `kinh_mach`(`kinh`), `benh_hoc`(`benh_hoc`), `cham_cuu_tri_benh`(`cham_cuu`), `duoc_lieu`(`duoc_lieu`), `nguon_y_van`(`nguon`), `bai_viet`(`bai_viet`, `/blog/`, KHÔNG "/" cuối).
- `duongUngVien(bo, muc) → string[]`: `slug` trước; thêm `slug_goc` nếu có và khác, TRỪ `kinh_mach` (chỉ `slug`). Có "/" cuối trừ `bai_viet`.
- `dungChiMuc(dsMuc: { bo, title, slug, slug_goc?, ten_khac?, ma_huyet?, ma?, doi_chieu_benh_danh? }[]) → ChiMuc` — mỗi mục: `{ ten: title, loai, duong: string[], khoaTen: chuanHoaManh(bỏ tiền tố), khoaKhac: string[] }`. `khoaKhac` gồm: `ten_khac` tách theo `,`/`;`/`.` (bỏ phần trong ngoặc, bỏ mục < 3 ký tự); `ma_huyet`/`ma` (chuẩn hoá thường, vd "sp6"); với kinh thêm slug ngắn đổi "-" thành cách ("tam bao") và tên rút gọn bỏ "kinh thu/tuc … " (vd "Kinh Túc Thái Âm Tỳ" → "ty", "thai am ty"). Tiền tố bỏ khi so: `huyet`, `kinh`, `mach`, `benh`, `bai thuoc`, `vi thuoc`, `cay`, `sach`.
- `timTrongChiMuc(chiMuc, cumTu: string, { toiDa = 5 }) → { ten, loai, duong: string[], khop: "dung" | "ten_khac" | "chua" }[]` — thứ tự ưu tiên: `dung` (khoá tên bằng khoá cụm từ) > `ten_khac` (khoá cụm từ bằng một khoá khác) > `chua` (khoá tên ≥ 2 từ nằm TRỌN theo ranh giới từ trong khoá cụm từ, hoặc ngược lại). Cùng hạng: ưu tiên loai theo `kinh, huyet, benh_hoc, cham_cuu, duoc_lieu, nguon, bai_viet`, rồi tên ngắn hơn.

- [ ] **Step 1: Phép kiểm (đỏ)** — `noi-bo/chi-muc.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dungChiMuc, timTrongChiMuc, duongUngVien } from "./chi-muc.mjs";

const MAU = JSON.parse(readFileSync(new URL("./__fixture__/muc-noi-bo-30-09.json", import.meta.url), "utf8"));
const DS = Object.entries(MAU).flatMap(([bo, a]) => a.map((m) => ({ bo, ...m })));
const CM = dungChiMuc(DS);
const dau = (q) => timTrongChiMuc(CM, q)[0];

test("đường ứng viên: slug trước slug_goc; kinh chỉ slug ngắn; blog không '/' cuối", () => {
	assert.deepEqual(duongUngVien("huyet_vi", { slug: "am-khich-2", slug_goc: "am-khich" }), ["/huyet/am-khich-2/", "/huyet/am-khich/"]);
	assert.deepEqual(duongUngVien("kinh_mach", { slug: "phe", slug_goc: "kinh-thu-thai-am-phe" }), ["/kinh/phe/"]);
	assert.deepEqual(duongUngVien("duoc_lieu", { slug: "61" }), ["/duoc-lieu/61/"]);
	assert.deepEqual(duongUngVien("bai_viet", { slug: "dong-ho-kinh-lac" }), ["/blog/dong-ho-kinh-lac"]);
});

test("khớp đúng tên, bỏ tiền tố 'huyệt', không phân biệt hoa", () => {
	const r = dau("huyệt Tam Âm Giao");
	assert.equal(r.ten, "Tam Âm Giao");
	assert.equal(r.khop, "dung");
	assert.deepEqual(r.duong, ["/huyet/tam-am-giao/"]);
});

test("khớp theo mã huyệt và tên khác", () => {
	assert.equal(dau("SP6").ten, "Tam Âm Giao");
	assert.equal(dau("Thừa Mạng").khop, "ten_khac");
	assert.equal(dau("Thừa Mạng").ten, "Tam Âm Giao");
});

test("kinh theo tên ngắn: 'kinh Tỳ' → /kinh/ty/", () => {
	const r = dau("kinh Tỳ");
	assert.equal(r.loai, "kinh");
	assert.deepEqual(r.duong, ["/kinh/ty/"]);
});

test("bệnh: 'mất ngủ' ra cả bệnh học và châm cứu trị bệnh, bệnh học trước", () => {
	const ds = timTrongChiMuc(CM, "mất ngủ");
	assert.deepEqual(ds.slice(0, 2).map((x) => x.loai), ["benh_hoc", "cham_cuu"]);
	assert.deepEqual(ds[0].duong, ["/benh-hoc/mat-ngu/"]);
});

test("cụm dài chứa tên: 'bấm huyệt Thần Môn chữa mất ngủ' ra Thần Môn (chua)", () => {
	const ds = timTrongChiMuc(CM, "bấm huyệt Thần Môn chữa mất ngủ", { toiDa: 10 });
	assert.ok(ds.some((x) => x.ten === "Thần Môn" && x.khop === "chua"));
});

test("hai huyệt khác dấu vẫn là hai mục; cùng khoá không dấu thì trả cả hai để bộ kiểm đường chọn", () => {
	const ds = timTrongChiMuc(CM, "Âm Khích", { toiDa: 10 });
	assert.ok(ds.some((x) => x.ten === "Âm Khích"));
	assert.ok(ds.some((x) => x.ten === "Ẩm Khích"));
});

test("tên 1 từ không 'chứa' bừa: 'tâm' không kéo mọi thứ có chữ tâm", () => {
	const ds = timTrongChiMuc(CM, "an tâm ngủ ngon", { toiDa: 10 });
	assert.ok(!ds.some((x) => x.khop === "chua" && x.ten.split(/\s+/).length < 2));
});

test("không có gì → mảng rỗng", () => {
	assert.deepEqual(timTrongChiMuc(CM, "máy tính bảng"), []);
});
```

- [ ] **Step 2: đỏ → Step 3: mã (thuần, dùng `chuanHoaManh` của `luat/chuan-hoa.mjs`) → Step 4: xanh → Step 5: Commit** `feat(rada-seo): chỉ mục nội bộ từ điển + blog, tìm theo tên/mã/tên khác`.

---

### Task 4: Nạp chỉ mục từ CMS, tra bài thuốc, kiểm đường trên site thật

**Files:**
- Create: `cms/src/plugins/rada-seo/noi-bo/nap.mjs`, `noi-bo/nap.test.mjs`, `noi-bo/kiem-duong.mjs`, `noi-bo/kiem-duong.test.mjs`
- Modify: `cms/src/plugins/rada-seo/lib/doc-web.mjs` (THÊM `taoDocTrang`), `lib/doc-web.test.mjs`

**Interfaces:**
- `taoDocTrang(fetchFn, { hanGioMs = 30_000 }) → (url) => Promise<{ status: number, xRobots: string, html: string } | null>` — cùng `urlDocDuoc`, không theo lỗi (null khi hỏng). `taoDocWeb` giữ nguyên.
- `napMucNoiBo(content, { now = Date.now }) → Promise<ChiMuc>` — với mỗi bộ trong `MUC_BO`: `content.list(bo, { limit: 100, cursor, where: { status: "published" } })` tới hết; map `item.slug` + `item.data.{title, slug_goc, ten_khac, ma_huyet, ma, doi_chieu_benh_danh}` → `dungChiMuc`. Bộ nào lỗi (vd bộ không tồn tại trên bàn thử) → bỏ qua bộ đó, ghi vào `chiMuc.loiNap[]`, KHÔNG ném.
- `layChiMuc(content, { ttlMs = 24h })` — bộ nhớ đệm trong tiến trình (biến module), dựng lười, một lời gọi đang dựng thì lời gọi khác chờ chung promise.
- `traBaiThuoc(fetchFn, ten: string[], { goc = process.env.RADA_SEO_SITE ?? "https://kinhlac.online" })` → `{ [ten]: { ten, loai: "bai_thuoc"|"duoc_lieu"|"nguon", duong }[] }` — POST `${goc}/api/tra-cuu/ten`; `bai_thuoc` → `/bai-thuoc/<slug>/`, `vi_thuoc` → `/duoc-lieu/<id>/`, `nguon` → `/nguon/<slug>/`; bỏ tên < 4 ký tự; ≤ 200 tên/lượt; lỗi mạng → `{}` (không ném).
- `taoKiemDuong(docTrang, { goc, ttlMs = 24h }) → (duong, tenMong?) => Promise<boolean>` — ĐẠT khi `status === 200` VÀ `xRobots` không chứa `noindex` VÀ (không có `tenMong` HOẶC `<title>` hoặc `<h1>` chứa `tenMong` so CÓ DẤU: `normalize("NFC").toLowerCase()`, gộp khoảng trắng, giải mã `&amp;`). Đệm kết quả (cả đạt lẫn trượt) theo `duong|tenMong`.
- `chonDuong(kiemDuong, muc) → Promise<string | null>` — thử lần lượt `muc.duong`, trả đường ĐẦU TIÊN đạt với `tenMong = muc.ten`.

- [ ] **Step 1: Phép kiểm (đỏ)** — bằng bản giả, không mạng thật:
  - `taoDocTrang`: trả `status`, header `x-robots-tag`, `html`; URL bị cấm → `null`.
  - `napMucNoiBo`: `content.list` giả có 2 trang (cursor) cho `huyet_vi`, 1 trang `kinh_mach`, ném lỗi cho `nguon_y_van` → chỉ mục có đủ mục của 2 bộ, `loiNap` có `nguon_y_van`; phép kiểm cũng khẳng định MỌI lời gọi `list` đều có `where.status === "published"`.
  - `layChiMuc`: 2 lời gọi đồng thời → `content.list` chỉ chạy một lượt dựng; sau `ttlMs` dựng lại.
  - `traBaiThuoc`: fetch giả trả đúng khuôn đo được (Quy Tỳ Thang / Toan Táo Nhân) → `/bai-thuoc/quy-ty-thang/`, `/duoc-lieu/61/`; tên "abc" (< 4) không gửi đi; fetch ném → `{}`.
  - `taoKiemDuong` + `chonDuong`: trang giả `/huyet/am-khich/` title "Huyệt Âm Khích (HT6): …", `/huyet/am-khich-2/` title "Huyệt Ẩm Khích: …" → mục "Ẩm Khích" với `duong ["/huyet/am-khich-2/","/huyet/am-khich/"]` chọn `/huyet/am-khich-2/`; mục "Âm Khích" với cùng hai đường theo thứ tự ngược vẫn chọn `/huyet/am-khich/`; trang 200 + `x-robots-tag: noindex` → trượt; 404 → trượt; gọi lại cùng đường không tải lại (đệm).
- [ ] **Step 2: đỏ → Step 3: mã → Step 4: xanh → Step 5: Commit** `feat(rada-seo): nạp chỉ mục nội bộ từ CMS, tra bài thuốc, kiểm đường trên site thật`.

---

### Task 5: Công cụ MCP `rada_tim_lien_ket`

**Files:**
- Create: `cms/src/plugins/rada-seo/noi-bo/tim-lien-ket.mjs`, `noi-bo/tim-lien-ket.test.mjs`
- Modify: `cms/src/plugins/rada-seo/plugin.mjs`, `plugin.test.mjs`, `loi-dan.mjs` (một đoạn hướng dẫn dùng công cụ — chưa có routine nào gọi ở 2C-1, đoạn này để 2C-2/2C-3 dùng)

**Interfaces:**
- `timLienKet({ chiMuc, cumTu: string[], traBaiThuoc: (ten[]) => Promise<…>, kiemDuong, toiDaMoiCum = 5, toiDaKiem = 40 }) → Promise<{ cumTu, ketQua: { ten, loai, duong, khop }[] }[]>` — mỗi cụm: tìm trong chỉ mục (≤ `toiDaMoiCum`); cụm nào KHÔNG có kết quả `dung`/`ten_khac` thì gom gửi `traBaiThuoc` MỘT lượt; mọi ứng viên qua `chonDuong` (đồng thời tối đa 3, tổng ≤ `toiDaKiem` lần tải — quá trần thì dừng kiểm, ứng viên còn lại bỏ, ghi `daCatBot: true`); chỉ trả ứng viên có đường đã đạt.
- Route `mcp-tim-lien-ket`: `permission: "content:read_drafts"`, `input: KHUON_TIM = z.object({ cumTu: z.array(z.string().min(2).max(120)).min(1).max(20) })`; handler dựng `layChiMuc(ctx.content)`, `taoKiemDuong(taoDocTrang(ctx.http.fetch.bind(ctx.http)))`, `traBaiThuoc(ctx.http.fetch.bind(ctx.http), …)`.
- Công cụ `rada_tim_lien_ket` trong `mcp.tools`: dùng chung `KHUON_TIM`, `destructive: false`, mô tả tiếng Việt: trả các trang CÓ THẬT của kinhlac.online (từ điển, bài thuốc, blog) khớp từng cụm từ, đã kiểm sống và đúng trang.
- Capability: GIỮ `network:request:unrestricted`; THÊM `content:read` (cần cho `ctx.content.list`).

- [ ] **Step 1: Phép kiểm (đỏ):**
  - `timLienKet`: chỉ mục từ fixture + `kiemDuong` giả (đạt với mọi đường trừ `/huyet/am-khich/`) + `traBaiThuoc` giả (trả Quy Tỳ Thang) → `["huyệt Tam Âm Giao", "Quy Tỳ Thang", "máy tính bảng"]` ra 3 phần tử: phần 1 có `/huyet/tam-am-giao/`, phần 2 có `/bai-thuoc/quy-ty-thang/` (`traBaiThuoc` được gọi MỘT lần với đúng các cụm chưa khớp chỉ mục), phần 3 `ketQua: []`; trần `toiDaKiem: 2` → `daCatBot: true` và `kiemDuong` gọi ≤ 2 lần.
  - plugin.test: công cụ thứ 4 `rada_tim_lien_ket` trỏ route có thật, permission bậc contributor, dùng chung khuôn; khuôn bác `cumTu: []` và 21 phần tử; `capabilities` có `content:read`.
- [ ] **Step 2: đỏ → Step 3: mã → Step 4: xanh (đủ bộ) + nạp module: `node -e "import('./src/plugins/rada-seo/plugin.mjs').then(m=>{const p=m.createPlugin();console.log(Object.keys(p.mcp.tools).join(','))})"` → có `rada_tim_lien_ket` → Step 5: Commit** `feat(rada-seo): công cụ MCP rada_tim_lien_ket — liên kết nội bộ đã kiểm sống`.

---

### Task 6: Nghiệm thu trên bàn thử

**Files:** Create `docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2c1.md`. Tạm (xoá cuối): `cms/astro.config.thu.mjs`, `cms/dist-thu/`.

Theo công thức bàn thử ở `docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md` (đăng nhập bằng passkey ảo qua trình cài đặt — lối SSO cũ đã hết chạy, xem mục 5b; không tự ký vé bằng `CMS_SSO_SECRET`). Bàn thử KHÔNG có dữ liệu từ điển thật.

- [ ] **Step 1:** Dựng bàn thử, bật MCP tools, tạo khoá chỉ `mcp:tools:rada-seo`.
- [ ] **Step 2:** Tạo & xuất bản trên bàn thử (qua API quản trị) 2 mục `huyet_vi`: "Tam Âm Giao" slug `tam-am-giao`, "Ẩm Khích" slug `am-khich-2` (data.slug_goc `am-khich`). Gọi MCP `rada_tim_lien_ket {cumTu:["huyệt Tam Âm Giao","Ẩm Khích","Quy Tỳ Thang","Hoàng Đế Nội Kinh"]}`. Expected: đường `/huyet/tam-am-giao/`, `/huyet/am-khich-2/` (đúng trang Ẩm Khích trên site THẬT), `/bai-thuoc/quy-ty-thang/`; "Hoàng Đế Nội Kinh" rỗng hoặc ra đúng trang nguồn có thật — ghi nguyên văn. (Kiểm đường gọi GET tới kinhlac.online — chỉ đọc trang công khai.)
- [ ] **Step 3:** Ca radar thật với 1 đối thủ có sitemap index (vd `benhvienyhoccotruyentrunguong.vn`): nhật ký ca có `sitemapBo` (ghi nguyên văn), và bơm giả 81 dòng `cho_ai` vào DB thử rồi chạy lại → `dungTrich = true`.
- [ ] **Step 4:** Ghi kết quả (bảng ĐẠT/TRƯỢT/CHƯA ĐO), dọn (dừng server, xoá tệp tạm, `npx astro sync` → `migrations.json` về `"type": "postgres"`), commit tệp nghiệm thu.

---

## Sau kế hoạch này

2C-2 (hướng nội dung từ đối thủ, cụm, kế hoạch nội dung, tab duyệt), 2D (leo top), 2C-3 (viết bài + bản sửa). Nợ nhỏ còn treo trong sổ tiến độ (`.git/sdd/progress-rada-seo.md`).
