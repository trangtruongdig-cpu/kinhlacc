# Nghiệm thu kế hoạch 3: bài Publish trong CMS lên `/blog/` ngay (tĩnh trước, CMS đỡ sau), trên bàn thử

Đo ngày 01/10/2026 trên **bản dựng** (`node ./dist-thu/server/entry.mjs`) của mã ở HEAD `c2d336c`
cộng các bản sửa ghi ở mục "Đã sửa" (bản dựng cuối chứa đủ mọi bản sửa; số liệu trong bảng là của bản
dựng cuối, trừ chỗ ghi rõ "trước khi sửa"). Mọi phép đo đi **qua nginx thật** (homebrew 1.31.5, cổng
8088) trừ chỗ ghi "thẳng CMS".

Phiên đo bị ngắt một lần (hết hạn mức phiên API, lúc 08:45) rồi chạy tiếp lúc 16:32 trên **cùng tiến
trình CMS và cùng DB**; lúc ngắt mới xong bước setup, chưa có phép đo nào.

## Bàn thử

- **CMS**: theo "Công thức cấu hình thay thế" (`2026-09-30-rada-seo-ket-qua-buoc-0.md`).
  `cms/astro.config.thu.mjs` = bản sao cấu hình thật, đổi: `libsql` tệp trong scratchpad, kho ảnh
  `local` trong scratchpad, `outDir: ./dist-thu`, `plugins: [auditLog, radaSeo]`, phông
  `fontProviders.local()` trỏ một tệp `.woff2` trong scratchpad (build không gọi Google Fonts). Seed tự
  áp từ `cms/seed/seed.json` (có `bai_viet`, `chuyen_muc`, `cum`). Build:
  `npx astro build --config astro.config.thu.mjs` (năm lần, mỗi lần ~7 s).
- **Chạy**: `env -i PATH HOME PGHOST=127.0.0.1 PGPORT=1 PGUSER=x PGPASSWORD=x PGDATABASE=x S3_BUCKET=
  PORT=4399 HOST=localhost TZ=UTC EMDASH_SITE_URL=https://kinhlac.online`. Không có
  `RADA_SEO_CA_DEM`, không có `CMS_SSO_SECRET`.
- **Đăng nhập**: mục 5b — trình setup thật của EmDash qua Playwright với passkey ảo. Không đúc vé SSO.
  ⚠️ Setup phải chạy khi **chưa** đặt `EMDASH_SITE_URL` (xem Bất ngờ 6).
- **Backend giả**: `stub.mjs` cổng 3998 — `GET /blog/bai-cu-chi-o-db-app[/]` → 200 HTML, mọi đường khác
  → 404 HTML (đúng hình `SeoBlogRouter`), kèm header `X-Stub: backend` để biết phản hồi đến từ đâu.
- **Tệp tĩnh**: `DIST_DIR=<scratch>/root node frontend/scripts/build-blog.mjs` (builder THẬT, 11 bài +
  index; `git status` sau đó sạch; `diff -rq` với `frontend/dist/blog/` chỉ khác thư mục `assets`), cộng
  `blog/blog.css` và `robots.txt` chép từ `frontend/public/`.
- **nginx**: bản sao `frontend/nginx.conf`, chỉ thay bằng `sed` đúng 8 chỗ:

  | Gốc | Bàn thử | Vì sao |
  |---|---|---|
  | `resolver 127.0.0.11 …` | `resolver 127.0.0.1 …` | không có DNS của Docker |
  | `zone kinhlac_backend 64k` | `512k` | macOS trang nhớ 16k, 64k báo "zone too small" |
  | `zone kinhlac_cms 64k` | `512k` | như trên |
  | `server backend:3001 resolve;` | `server 127.0.0.1:3998;` | backend giả |
  | `server cms:4321 resolve;` | `server [::1]:4399;` | CMS thử (Node nghe `localhost` = IPv6) |
  | `/var/cache/nginx/cms` | `<scratch>/ng/cache` | đường đệm |
  | `listen 80;` | `listen 8088;` | cổng cao |
  | `root /usr/share/nginx/html;` | `root <scratch>/root;` | tệp tĩnh thử |

  Tệp bọc ngoài (`events {}`, `http { include mime.types; … }`, pid, temp path) viết riêng. `nginx -t`
  xanh ở mọi lần nạp lại. Dừng bằng tệp pid.

Phép kiểm đơn vị sau khi sửa: `node --test src/lib/khung-blog.test.mjs` **34/34**;
`node --test "src/plugins/rada-seo/**/*.test.mjs"` **493/493** (trước 490, +3).

## Dữ liệu bơm vào

- **Bài người viết** `bai-nguoi-viet-ban-thu`: tạo bằng API quản trị (`POST /_emdash/api/content/bai_viet`)
  với ảnh bìa đã tải lên thư viện (`og-default.png`, 1200×630), 2 FAQ, 2 nguồn (một có URL, một không),
  `nguoi_duyet` + `chuc_danh_nguoi_duyet`, một link nội bộ trong thân. Sau đó mở **trình soạn thật**
  bằng Playwright, gõ thêm một đoạn, bấm "Insert Image" → chọn ảnh trong thư viện → "Insert image", lưu,
  Publish.
- **Hai bài máy viết**: qua công cụ THẬT, đúng chuỗi của nghiệm thu 2C-3 — nạp `seed.sql` của 2C-2 vào
  `_plugin_storage` (3 đối thủ `.example`, 40 dòng `url`), `rada_de_xuat_huong` → route `huong-dat` →
  `rada_ghi_cum` → `rada_de_xuat_ke_hoach` → route `ke-hoach-dat` → `rada_lay_bai_can_viet` →
  `rada_nop_bai` với hai bài đã đạt ở 2C-3 (`bam-huyet-de-ngu-…` 1.255 từ; `thu-gian-buoi-toi-…`). Bài
  thứ nhất nộp bằng mã **trước** khi sửa `nopBai`, bài thứ hai **sau** khi sửa.
- **Từ điển + ảnh**: `huyet_vi` Thần Môn, Tam Âm Giao; `benh_hoc` Mất Ngủ; một ảnh alt `Huyệt Thần Môn`.
- **11 bản sao của bài tĩnh** (cùng slug, tiêu đề, mô tả, ngày; thân một dòng) tạo + Publish trong CMS
  thử ở cuối buổi, để CMS thử giống kho thật (11 bài tĩnh đều có trong `ec_bai_viet`) khi chạy
  `kiem-blog-song.mjs` và chụp trang danh sách.

## Bảng kết quả

| # | Phép đo | Kết quả | Số liệu / nguyên văn |
|---|---|---|---|
| 1 | Trang `.astro` chỉ có frontmatter chạy được trên bản dựng | **ĐẠT** | Thẳng CMS: `/blog/` → `200 text/html; charset=utf-8`; `/blog/khong-co/` → **`404`** `text/html; charset=utf-8` 4.173 byte (thân tiếng Việt cùng khung); `/blog/sitemap.xml` → `200 application/xml; charset=utf-8`. Không phải đổi sang endpoint `.ts`. |
| 2.1 | Publish bài người viết → `/blog/<slug>/` 200 sau bao lâu | **TRƯỢT trước khi sửa → ĐẠT** | Trước khi sửa: mở URL hai lần lúc bài còn nháp (404), Publish, hỏi lại mỗi 0,2 s → **vẫn 404 sau 90 s** (bỏ cuộc), trong khi `/blog/` đã liệt kê bài. Thẳng CMS với `Host: localhost`: `404`, `x-astro-cache: HIT`. Sau khi sửa (`Astro.cache.set(false)` cho 404): lần hỏi **đầu tiên** sau Publish là 200, **50–51 ms** (đo 4 lượt, cả sau khi mở URL lúc nháp). |
| 2.2 | Khung giống bản tĩnh | **ĐẠT** | `<header>` (652 ký tự) và `<footer>` (892 ký tự) **giống từng ký tự** bản tĩnh `huyet-hop-coc`; stylesheet duy nhất `/blog/blog.css`; tập lớp CSS: CMS chỉ hơn `bl-sources` (bài tĩnh đem so không có nguồn), kém `bl-cat`/`bl-related` (bài thử không có chuyên mục, lúc đo chưa có bài khác). |
| 2.3 | Canonical, JSON-LD | **ĐẠT** | `canonical` = `https://kinhlac.online/blog/bai-nguoi-viet-ban-thu/`; `robots` = `index, follow`; JSON-LD `Article` có `image` = `https://kinhlac.online/_emdash/api/media/file/01M3VCZENEDDAYWK48FKK24TGF.png`, `reviewedBy {Person, name "Y sỹ Trương Văn Thử", jobTitle "Y sỹ Y học cổ truyền"}`, `datePublished 2026-10-01`; thêm `BreadcrumbList`, `FAQPage`. |
| 2.4 | FAQ / nguồn / miễn trừ in một lần; ảnh bìa 200 | **ĐẠT** | `bl-faq` 1 (2 `<details>`), `bl-sources` 1, `bl-disclaimer` 1, `<h1>` 1, "Đã rà soát chuyên môn" 1. `<img class="bl-hero-img" src="/_emdash/api/media/file/01M3VCZENEDDAYWK48FKK24TGF.png">` → qua nginx **200 image/png 245.664 byte**. |
| 3.1 | Bài MÁY viết: ảnh bìa trên trang công khai | **TRƯỢT trước khi sửa → ĐẠT** | Trước khi sửa: revision nháp giữ `featured_image` = id trần `"01M3VCZEVPRHYF8BK311DXBH7F"`, Publish chép lên cột, trang **không có** `<img class="bl-hero-img">`, `og:image` rơi về `/og-default.png`. Sau khi sửa `nopBai`: revision nháp giữ object đủ `meta.storageKey`; trang có `<img class="bl-hero-img" src="/_emdash/api/media/file/01M3VCZENEDDAYWK48FKK24TGF.png" …>`, `og:image` và `Article.image` cùng URL. Bài nộp bằng mã cũ (id trần) cũng có ảnh lại nhờ `lamDayAnhBia`. |
| 3.2 | Bài máy: index, danh sách, sitemap | **ĐẠT** | `robots` = `index, follow`, không có `X-Robots-Tag`; có trong `/blog/` và `/blog/sitemap.xml` (1 dòng `<loc>`). Không có `reviewedBy`, không in "Đã rà soát chuyên môn" (bài chưa có `nguoi_duyet`). 200 sau **51 ms** kể từ Publish. |
| 4 | `/blog/` qua nginx: mới nhất trước; CMS dừng → bản tĩnh | **ĐẠT** | Thứ tự: `thu-gian-…` (đăng sau cùng), `bam-huyet-…`, `bai-nguoi-viet-ban-thu`, rồi các bài 2026-06-05. CMS dừng: `200`, 13.075 byte (bản tĩnh), header **`X-Blog-Nguon: tinh-du-phong`**. |
| 5 | Bảng định tuyến, mọi dòng, CMS sống và CMS sập | **ĐẠT** | Bảng riêng bên dưới. Cột "CMS sống" giống hệt trước và sau khi sửa nginx (`diff` rỗng). |
| 6 | Bài chỉ có trong CMS, lúc CMS sập: 503 + `Retry-After: 30` | **ĐẠT** (đã cài) | Trước: `404` (thân của backend). Sau: **`503`**, `Retry-After: 30`, `Cache-Control: no-store`, `X-Blog-Nguon: cms-tam-nghi`, thân HTML tiếng Việt 418 byte. 404 thật của CMS vẫn ra 404 của backend; bài cũ chỉ có trong DB app vẫn 200 cả hai trạng thái. Đo thêm: bỏ `recursive_error_pages on` ở `@blog_cms` → quay lại **404** (`nginx -t` vẫn xanh); bỏ ở `@blog_render_cms_sap` → vẫn 503. CMS và backend cùng sập: bài CMS → 503, bài DB app → 503, `/blog/` và bài tĩnh → 200. |
| 7 | Unpublish → 404 sau bao lâu; rời danh sách + sitemap | **ĐẠT** | Lần hỏi đầu tiên sau Unpublish: **404, 49–52 ms**. `/blog/` 0 lần nhắc, sitemap 0 dòng. Publish lại: 200 sau 51 ms, cả hai có lại. |
| 8 | So byte 3 bài tĩnh | **ĐẠT** | `cmp` thân nginx trả với tệp tĩnh: `huyet-hop-coc` 20.067 byte, `12-duong-kinh-chinh` 20.256 byte, `phuong-phap-le-van-suu` 19.831 byte — giống từng byte. (`kiem-blog-song.mjs` so cả 11 bài: 11/11.) |
| 9a | Bỏ tick `cho_index` | **ĐẠT** | `<meta name="robots" content="noindex, nofollow">` + header `x-robots-tag: noindex, nofollow`; danh sách 0, sitemap 0. |
| 9b | Ô SEO "Hide from search engines" (`seo.noIndex`) | **TRƯỢT trước khi sửa → ĐẠT** | Trước: trang bài có meta noindex nhưng bài **vẫn** ở danh sách và sitemap (`getEmDashCollection` không gắn `seo`). Sau khi sửa (`traNoIndex`, một truy vấn): danh sách 0, sitemap 0 ngay sau `PUT` (chưa cần Publish); bỏ ô → có lại. Còn một chỗ chưa sạch: xem Bất ngờ 4. |
| 10 | Ảnh chèn trong thân | **ĐẠT** (không phải sửa) | Trình soạn lưu khối `{"_type":"image","_key":"gwnpmm20h","asset":{"_ref":"01M3VCZEVPRHYF8BK311DXBH7F","url":"/_emdash/api/media/file/01M3VCZENEDDAYWK48FKK24TGF.png"},"alt":"Ảnh bìa bàn thử","width":1200,"height":630,"blurhash":"…","dominantColor":"…"}` — có `asset.url` mang storageKey. Trang dựng `<p><img src="/_emdash/api/media/file/01M3VCZENEDDAYWK48FKK24TGF.png" alt="Ảnh bìa bàn thử" loading="lazy"></p>`. |
| 11 | Ảnh chụp cạnh nhau (tôi đã tự mở 6/8 ảnh) | **ĐẠT** | Bài tĩnh và bài CMS, 1280 px và 390 px: thanh trên, thẻ bài, cỡ chữ, khối byline, ảnh bìa bo góc, lề — cùng một khuôn. Danh sách tĩnh và danh sách CMS: cùng lưới 2 cột, cùng thẻ. Khác biệt đều do DỮ LIỆU, xem Bất ngờ 7. Không tài nguyên nào của trang CMS trả ≥ 400; `scrollWidth` = bề rộng khung ở cả hai cỡ. |
| 12 | IndexNow im lặng | **ĐẠT** | `_plugin_storage` của `rada-seo`: bộ `ca` **0 dòng** (không có dòng `indexnow` nào), hai bản ghi `nhap` đều `da_dang` và `indexNow` rỗng, không có khoá KV `indexnow:*`. Log máy chủ (42 dòng) 0 lần nhắc `indexnow`. Đã Publish/Unpublish tổng cộng hơn 30 lượt. |
| + | `kiem-blog-song.mjs` trên bàn thử | **ĐẠT** | CMS sống: `34 đạt, 0 trượt, 0 bỏ qua`, mã thoát 0. CMS dừng: `19 đạt, 3 trượt, 1 bỏ qua`, mã thoát **1** (bắt đúng ba thứ: danh sách là bản dự phòng, sitemap 503, slug ma 503). |
| + | Bí mật / đường ra Aiven | **ĐẠT** | Log máy chủ: 0 dòng `aiven`/`ECONNREFUSED`/`ec_pat_`. `grep -rl aivencloud dist-thu/` = 0 tệp. |

### Bảng định tuyến (mục 5 và 6), nginx sau khi sửa

"CMS-only" = `thu-gian-buoi-toi-sau-gio-lam-tho-cham-va-xoa-huyet-than-mon`. Cột "CMS sập": đã dừng
tiến trình CMS (cổng 4399 từ chối kết nối).

| URL | CMS sống | CMS sập |
|---|---|---|
| `/blog/` | 200 `text/html; charset=utf-8` (CMS dựng) | 200 `text/html` 13.075 byte, `X-Blog-Nguon: tinh-du-phong` |
| `/blog` | 301 → `/blog/` | 301 → `/blog/` |
| `/blog/huyet-hop-coc/` | 200 `text/html` 20.067 byte (tệp tĩnh) | y hệt |
| `/blog/huyet-hop-coc` | 301 → `/blog/huyet-hop-coc/` | y hệt |
| `/blog/huyet-hop-coc?a=1` | 301 → `/blog/huyet-hop-coc/?a=1` | y hệt |
| `/blog/<CMS-only>/` | 200 `text/html; charset=utf-8` 11.648 byte | **503** `Retry-After: 30` `X-Blog-Nguon: cms-tam-nghi` (trước khi sửa: 404 của backend) |
| `/blog/<CMS-only>` | 301 → có `/` | 301 → có `/` |
| `/blog/khong-ton-tai/` | **404** thật (`X-Stub: backend` — trang "không tìm thấy" của backend) | 503 `Retry-After: 30` (trước khi sửa: 404) |
| `/blog/blog.css` | 200 `text/css` 10.123 byte | y hệt |
| `/blog/sitemap.xml` | 200 `application/xml; charset=utf-8`, `<urlset>` hợp lệ, mọi `<loc>` có `/` cuối | 503 `text/html` `Retry-After: 30` (trước khi sửa: 404 của backend) |
| `/blog/bai-cu-chi-o-db-app/` | 200 (`X-Stub: backend`) | 200 (`X-Stub: backend`) |

Đích 301 là đường tương đối (`Location: /blog/…/`) nhờ `absolute_redirect off`.

## Đã sửa

1. **`cms/src/pages/blog/[slug].astro` — 404 và bản xem trước không còn bị đệm.** `routeRules`
   `"/blog/[...slug]"` đệm MỌI phản hồi của route (kể cả 404, kể cả khi thân mang `Cache-Control:
   no-store`) 1 giờ + 1 ngày swr; bản 404 không có tag nên Publish không xoá được. Thêm
   `Astro.cache.set(false)` ở nhánh 404 và nhánh xem trước.
2. **`cms/src/pages/blog/sitemap.xml.ts` — gắn tag bộ `bai_viet`.** Đường này cũng khớp route rule trên;
   không có tag thì sitemap đứng im (đo: bài đã lên danh sách mà sitemap vẫn chỉ có `/blog/`,
   `x-astro-cache: STALE`).
3. **`cms/src/plugins/rada-seo/viet/viec.mjs` (`nopBai`) — ảnh bìa.** `create` chuẩn hoá id trần thành
   object có `meta.storageKey`, `update` thì không. Nay `update` nhận lại đúng object mà `create` trả về
   (không có thì đọc lại bằng `content.get`; vẫn không có thì giữ id trần như cũ). TDD: 3 phép kiểm mới
   trượt trước, đạt sau.
4. **`cms/src/lib/doc-bai-blog.ts`** — hai truy vấn nhỏ qua `getDb()` của `emdash/runtime` (cùng handle
   Kysely, cùng pool với loader): `traNoIndex()` lấy id các bài bật ô SEO noindex (cho danh sách, sitemap,
   bài liên quan); `lamDayAnhBia()` tra `media.storage_key` cho ảnh bìa là id trần — chỉ chạy khi có bài
   như vậy. Lớp thứ hai này có vì nháp máy viết tạo TRƯỚC bản sửa 3 vẫn mang id trần.
5. **`frontend/nginx.conf`** — `@blog_cms`: `recursive_error_pages on`, `error_page 404 = @blog_render`,
   `error_page 502 503 504 = @blog_render_cms_sap`; khối mới `@blog_render_cms_sap` (backend, 404/5xx →
   `@blog_tam_nghi`) và `@blog_tam_nghi` (503 + `Retry-After: 30`). Ghi chú ĐƯỜNG LÙI cập nhật tên khối.
6. **`frontend/scripts/kiem-blog-song.mjs`** (mới) — phép đo sau deploy.

## Bất ngờ / điều phải biết

1. **Đệm route của Astro đệm cả 404, và khoá đệm có cả `Host`.** Đây là gốc của "cache quirk" ghi ở
   bước 0 ("vài giây sau mới 200") — thật ra không phải vài giây mà là tới hết `maxAge` 1 giờ, lần đo đó
   may vì hỏi bằng hai Host khác nhau. Trên site thật kịch bản rất dễ gặp: người duyệt bấm "xem trang"
   lúc bài còn nháp, hoặc IndexNow/bot hỏi URL sớm. Mọi route CMS khác trả 404 dưới một `routeRules` có
   `maxAge` (`/chuyen-muc/`, `/cum/`, `/trang/`) nhiều khả năng dính cùng lỗi — **chưa đo**, ngoài phạm vi.
2. **Sửa bài đã đăng rồi chỉ bấm Save thì trang công khai CHƯA đổi** (đo ở mục 10: lưu xong trang vẫn
   bản cũ, Publish xong 50 ms sau là bản mới). Đúng thiết kế nháp/đăng của EmDash, nhưng người biên tập
   quen WordPress sẽ tưởng hỏng.
3. **Ô SEO noindex có hiệu lực NGAY khi lưu, không chờ Publish** (bảng `_emdash_seo` không theo
   revision), trong khi `cho_index` thì chờ Publish. Hai công tắc noindex, hai nhịp khác nhau.
4. **Khối "Bài Liên Quan" của các bài KHÁC không được làm mới** khi một bài đổi sang noindex hay bị gỡ:
   trang bài chỉ mang tag của chính bài đó (đo: sau khi bài A noindex + Publish, trang bài B vẫn link sang
   A). Tự hết khi bài B được dựng lại (tối đa 1 giờ + swr 1 ngày). Link tới bài noindex vô hại; link tới
   bài đã GỠ thì ra 404 trong khoảng đó. Chưa sửa — gắn tag cả bộ cho trang bài là đổi cách đệm của mọi
   bài, nên để người quyết.
5. **CMS sập thì slug không tồn tại cũng ra 503** (không còn 404), và `/blog/sitemap.xml` ra 503. Cố ý:
   lúc đó không ai biết bài có tồn tại không. Hệ quả cho phép đo: `kiem-blog-song.mjs` chạy đúng lúc CMS
   đang khởi động lại sẽ báo trượt — chạy lại sau nửa phút.
6. **Passkey không tạo được khi `EMDASH_SITE_URL=https://kinhlac.online` mà mở bằng `localhost`**:
   trình setup báo `Security error. Make sure you're on a secure connection.` (rpId lệch origin). Bàn thử
   phải chạy setup KHÔNG có biến đó rồi khởi động lại với biến; phiên đăng nhập sống qua lần khởi động
   lại (session lưu trên đĩa).
7. **Khác biệt nhìn thấy trên ảnh chụp, đều do dữ liệu chứ không do khuôn:**
   - Bài CMS không có nhãn chuyên mục và breadcrumb ghi "Bài Viết" vì bài thử chưa gắn `chuyen_muc`.
     Lò viết cũng không gắn — bài máy viết trên site thật sẽ như vậy cho tới khi người duyệt chọn chuyên mục.
   - Bài máy viết không có dòng "Đã rà soát chuyên môn" cho tới khi người duyệt điền `nguoi_duyet`
     (đúng luật phạm vi Y sỹ).
   - Trang danh sách của CMS xếp các bài **cùng ngày** theo `published_at` của CMS; bản tĩnh xếp theo thứ
     tự của builder. 11 bài cũ phần lớn cùng ngày 2026-06-05 nên thứ tự giữa chúng trên `/blog/` (CMS
     dựng) có thể khác bản tĩnh hiện nay.
   - Ảnh `/kinhmach3d/images/…` của bài tĩnh 404 trên bàn thử: thư mục đó chỉ có trên VPS (đã ghi ở
     CLAUDE.md), không phải lỗi của kế hoạch 3.
8. **Tải cùng một tệp ảnh hai lần thì EmDash dùng chung `storageKey`** (khử trùng theo `contentHash`),
   hai dòng `media` khác id trỏ một tệp.
9. **`emdash/runtime` CÓ xuất `getDb()`** (và `getMediaProvider`) — trái với chú thích đầu
   `cms/src/lib/csdl.ts` ("EmDash không xuất ra handle database nào"). Tầng tra cứu từ điển vẫn cần pool
   riêng vì lý do khác (FTS), nhưng truy vấn thường thì mượn được handle này, không tốn thêm kết nối.
10. **Chưa đo**: bản xem trước (`?_preview=…`) sau khi thêm `set(false)`; hai truy vấn `getDb()` trên
    **Postgres** (bàn thử là libsql — cột `seo_no_index` là `integer` ở cả hai theo migration 018, truy
    vấn viết bằng Kysely nên không có SQL riêng phương ngữ; hỏng thì có `try/catch`, trang vẫn dựng và
    ghi `console.warn`); kho ảnh S3 (URL ảnh vẫn dạng `/_emdash/api/media/file/<storageKey>`?).

## Việc phải làm lúc deploy

1. Dựng lại **cả hai** image: `cms` (trang blog, plugin) và `frontend` (nginx.conf, `robots.txt`).
2. Trước khi nạp nginx mới: `nginx -t`. Sau deploy chạy
   `node frontend/scripts/kiem-blog-song.mjs` (mặc định đo `https://kinhlac.online`; muốn có phép so
   từng byte thì máy chạy phải có `frontend/dist/blog/` của đúng commit đang chạy). Mã thoát 0 mới coi là xong.
3. Đọc log container `cms` sau vài phút: không được có dòng `[blog] không tra được …` (nghĩa là hai
   truy vấn `getDb()` hỏng trên Postgres — trang vẫn chạy nhưng ô SEO noindex và ảnh bìa id trần mất tác dụng).
4. `EMDASH_SITE_URL` của container `cms` phải là `https://kinhlac.online` (canonical, og, JSON-LD, sitemap
   đều dựng từ nó).
5. `DEPLOYMENT.md` mục "Blog: tĩnh trước, CMS đỡ sau" còn ghi hành vi cũ ("CMS sập → bài chỉ có trong CMS
   ra 404"); nay là 503 + `Retry-After: 30`. Tệp đó ngoài phạm vi phiên này, cần sửa một dòng.
6. IndexNow chỉ chạy nơi có `RADA_SEO_CA_DEM=1`; bàn thử không đo lời gọi thật tới `api.indexnow.org`.

## Liên lạc ra ngoài trong lúc đo

- **kinhlac.online** (GET trang công khai): plugin kiểm link khi lập hai bài dự kiến và khi nộp hai bài
  (trang trụ cột `/benh-hoc/mat-ngu/` và các trang `/huyet/…`).
- **Nguồn bên thứ ba** (GET qua `ssrfSafeFetch`): các URL nguồn của hai bài 2C-3 (vi.wikipedia.org,
  medlineplus.gov, nccih.nih.gov); **cloudflare-dns.com** (DoH của lớp chống SSRF).
- Không gọi `api.indexnow.org`, Google Fonts, GSC. Không chạm DB CMS thật hay DB app. Không ký vé SSO.
  Backend dev đang nghe cổng 3001 và tiến trình Python cổng 8080 của phiên khác: không đụng tới.

## Dọn

CMS thử, backend giả và nginx đã dừng (cổng 4399, 3998, 8088 không còn nghe). Đã xoá
`cms/astro.config.thu.mjs`, `cms/dist-thu/`, DB thử, thư mục ảnh thử, khoá `ec_pat_…`, cookie phiên.
`cd cms && npx astro sync` đưa `.emdash/migrations.json` về `"type": "postgres"`, **giống từng byte** bản
sao lưu chụp trước lần build đầu (`cmp`). `git status --short` chỉ còn các tệp của phiên này.
