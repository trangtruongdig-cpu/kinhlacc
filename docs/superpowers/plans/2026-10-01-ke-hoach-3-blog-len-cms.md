# Kế hoạch 3 — bài Publish trong CMS lên `/blog/` ngay, kèm IndexNow

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Mỗi việc
> TDD ở chỗ có logic, commit riêng đường dẫn của mình (cây làm việc DÙNG CHUNG — không `git add -A`).

**Mục tiêu:** người quản trị bấm Publish một `bai_viet` trong CMS → bài hiện ở
`https://kinhlac.online/blog/<slug>/` ngay, có trong danh sách `/blog/`, có trong sitemap blog,
và IndexNow được báo. KHÔNG làm đổi 11 bài đang nằm trong Google.

**Dữ kiện đo 01/10/2026:** 11 bài `.md` đã có trong `ec_bai_viet`, đều `published`, slug trùng
bản tĩnh; `url_pattern = /blog/{slug}`. Bảng dò mã: xem lịch sử phiên (fact sheet kế hoạch 3).

## Quyết định kiến trúc: TĨNH TRƯỚC, CMS ĐỠ SAU (không gỡ bản tĩnh)

Đặc tả gốc bảo "proxy cả `/blog/` sang CMS, xoá `dist/blog/`". Đo thật cho thấy làm vậy là
đổi giao diện 11 bài đã index (trang blog của CMS là theme mẫu tiếng Anh, khối `bl-*` không có
CSS), mất `/blog/blog.css` — tệp mà MỌI trang tĩnh (~7.000 trang) đang nạp — và gãy hai chốt
build. Người dùng đã ba lần bác việc dựng lại giao diện trong CMS.

Nên làm đúng mẫu đang chạy sẵn ở nginx (`try_files $uri $uri/ @blog_render`):

```
/blog/<slug>/   →  tệp tĩnh nếu có (11 bài cũ — y nguyên từng byte)
                →  không có thì CMS dựng TRỰC TIẾP (bài mới Publish) — cùng khuôn HTML + blog.css
                →  CMS không có thì backend cũ (@blog_render — bài chỉ có trong DB app), rồi 404 thật
/blog/          →  CMS dựng trực tiếp (danh sách luôn mới), cùng khuôn với bản tĩnh
/blog/sitemap.xml → CMS sinh động; khai thêm trong robots.txt (không đổi dist/sitemap.xml)
```

Hệ quả đã chấp nhận: sửa một trong 11 bài cũ trong CMS chưa đổi trang công khai (bản tĩnh
thắng) cho tới khi `build-blog` đọc từ CMS — việc đó để sau, có chốt `--kiem` như các bộ khác.

## Ràng buộc chung

- Không `npm run build` trong `cms/`; không chạm kho CMS thật ngoài truy vấn CHỈ ĐỌC; không in khoá.
- Giao diện blog công khai giữ nguyên: khuôn của `frontend/scripts/build-blog.mjs` +
  `seo-html.mjs` (topbar, footer, MUC_LUC) + `/blog/blog.css`. Tiếng Việt, `lang="vi"`.
- `cms/` build trong Docker với context `./cms` → KHÔNG import được từ `frontend/`. Khuôn phải
  CHÉP sang `cms/src/lib/` kèm phép kiểm chống lệch (chạy ở repo, bỏ qua khi thiếu `frontend/`).
- Origin công khai: `EMDASH_SITE_URL` (https) — `Astro.url.origin` sau Caddy+nginx là `http://`.
  Canonical/og/JSON-LD dùng `https://kinhlac.online/blog/<slug>/` (CÓ dấu `/` cuối).
- Slug không tồn tại / chưa đăng → **404 thật** (không 302 sang `/404`).
- Phạm vi Y sỹ; "Đã rà soát chuyên môn" chỉ in khi bài có `nguoi_duyet`.
- nginx: `location /blog/` phải là prefix THƯỜNG (không `^~`) để `/blog/blog.css` vẫn do khối
  tệp tĩnh phục vụ.
- Đường lùi: khối nginx cũ giữ nguyên dạng chú thích; đổi lại 1 khối là về như cũ.

## Việc

### Việc 1 — Trang blog của CMS dựng đúng khuôn bản tĩnh
**Files:** `cms/src/lib/khung-blog.mjs` (+test), `cms/src/pages/blog/[slug].astro`,
`cms/src/pages/blog/index.astro`, `cms/src/pages/blog/sitemap.xml.ts`.
- `khung-blog.mjs`: hàm thuần dựng HTML trang bài và trang danh sách từ dữ liệu
  `{slug, title, description, html thân, ảnh bìa, ngày, tác giả, người duyệt, faq, nguồn, cta,
  tu_khoa, bài liên quan}` — chép khuôn từ `build-blog.mjs` + phần `seo-html.mjs` nó dùng
  (head, topbar, footer, MUC_LUC, JSON-LD Article + `image` + BreadcrumbList + FAQPage,
  `reviewedBy` chỉ khi có người duyệt, miễn trừ, nguồn, CTA, bài liên quan).
- Phép kiểm chống lệch: dựng một bài mẫu bằng `frontend/scripts/build-blog.mjs` và bằng
  `khung-blog.mjs` → so khung (head trừ phần động, topbar, footer, lớp CSS) giống nhau.
- `[slug].astro`: trả thẳng HTML của khung (không dùng `Base.astro`); thân bài từ Portable Text
  → HTML với đúng thẻ bản tĩnh dùng (h2/h3/p/ul/ol/blockquote/a/strong/em/img); ảnh bìa
  `/_emdash/api/media/file/<storageKey>`; 404 thật; bản xem trước (`_preview`) giữ như cũ;
  `Astro.cache.set` giữ nguyên; robots `noindex` khi `_emdash_seo.seo_no_index`.
- `index.astro`: danh sách bài đã đăng, mới nhất trước, khuôn như `dist/blog/index.html`
  (title/description/JSON-LD `Blog` như bản tĩnh).
- `sitemap.xml.ts`: urlset gồm `/blog/` + mọi bài đã đăng (URL có `/` cuối, `lastmod` =
  `ngay_cap_nhat` ?? `published_at`), bỏ bài `seo_no_index`.

### Việc 2 — IndexNow khi Publish (plugin Rada SEO)
**Files:** `cms/src/plugins/rada-seo/viet/indexnow.mjs` (+test), `plugin.mjs`, `kho.mjs`.
- Trong `content:afterPublish` cho `bai_viet` (mọi bài, cả bài người viết): đợi trang công khai
  `https://kinhlac.online/blog/<slug>/` trả 200 (thử tối đa 4 lần cách 3 s — bộ đệm CMS có thể
  còn giữ bản "chưa đăng" vài giây), rồi POST `https://api.indexnow.org/indexnow`
  `{host, key, keyLocation, urlList: [bài, /blog/]}`. Khoá: env `INDEXNOW_KEY`, mặc định
  `3ca42ea20a96a20d494868c1877e263c` (tệp khoá đang phục vụ 200). KIỂM mã trả về (200/202 mới
  là được) — bản backend cũ không kiểm.
- Chỉ chạy khi `RADA_SEO_CA_DEM=1` (VPS); máy dev không báo.
- Chạy nền (không giữ hook), ghi kết quả vào bản ghi `nhap` (nếu có) + nhật ký `ca` kiểu
  `indexnow`; trang chưa lên 200 sau 4 lần → ghi lỗi, KHÔNG báo.
- Tab Nháp hiện "IndexNow: đã báo lúc … / lỗi …".

### Việc 3 — nginx, robots, tài liệu
**Files:** `frontend/nginx.conf`, `frontend/public/robots.txt`, `DEPLOYMENT.md`, CLAUDE.md
(mục thư viện/blog), đặc tả gốc (ghi quyết định mới).
- `location = /blog/` → proxy CMS. `location /blog/` → `try_files $uri $uri/ @blog_cms`.
  `@blog_cms` → proxy CMS, `proxy_intercept_errors on; error_page 404 = @blog_render;`
  (backend cũ đỡ bài chỉ có trong DB app). KHÔNG bật proxy_cache cho `/blog/` (CMS đã có đệm
  theo tag; thêm lớp 60 s là bài mới Publish hiện chậm 1 phút và bài gỡ còn sống).
- `/blog/<slug>` thiếu `/` cuối → 301 thêm `/` (chỉ khi không có đuôi tệp).
- `/blog/sitemap.xml` tới CMS; `robots.txt` thêm dòng `Sitemap: https://kinhlac.online/blog/sitemap.xml`.
- Khối cũ giữ dạng chú thích + 3 dòng hướng dẫn lùi.

### Việc 4 — Nghiệm thu trên bàn thử + phép đo sau deploy
- Bàn thử: bài mẫu trên CMS thử → so ảnh chụp với trang tĩnh cùng bài (Playwright, hai ảnh cạnh
  nhau); 404 thật; canonical https có `/`; sitemap; danh sách.
- Viết `frontend/scripts/kiem-blog-song.mjs` (chỉ đọc, chạy tay SAU deploy): 11 slug cũ vẫn 200
  và `cmp` đúng bản tĩnh; `/blog/` 200 có đủ ≥ 11 bài; `/blog/sitemap.xml` hợp lệ;
  `/blog/khong-co/` 404; `/blog/blog.css` 200 text/css.

## Ngoài phạm vi (ghi nợ)
`build-blog` đọc từ CMS; di cư 22 nháp cũ + bài "…Chữa Bệnh…" trong `seo_bai_viet` (cần người
dùng chọn); gỡ lò viết cũ trong app; RSS.
