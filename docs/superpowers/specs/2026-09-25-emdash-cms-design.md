# EmDash làm CMS cho kinhlac.online — blog, landing builder, và rada SEO dọn vào trong

Ngày chốt: 25/09/2026. Trạng thái: hướng đã duyệt, phân rã giai đoạn chờ duyệt.

## Vì sao

Hệ đăng bài hiện tại đau ở bốn chỗ người dùng nêu, cộng một chỗ thứ năm:

1. Soạn thảo là `<textarea>` markdown trần trong modal "Sửa Bản Nháp" của SEO Radar.
2. Đăng xong bản tĩnh phải chờ build + deploy.
3. Không có thư viện ảnh.
4. Chỉ đăng được blog; sửa chữ ở landing là phải sửa code.
5. Rada SEO (đối thủ → khoảng trống → sinh bài) và chỗ đăng bài là hai thế giới rời nhau.

## CMS được chọn: EmDash

Nhận diện từ kstudy.edu.vn (site đã chuyển từ WordPress sang): frontend Astro
(`/_astro/*.css`), admin tại `cms.kstudy.edu.vn/_emdash/admin`, media
`/_emdash/api/media/file/<ULID>`, API `/_emdash/api/*` trả 401.

| Thuộc tính | Giá trị |
|---|---|
| Kho | `emdash-cms/emdash`, MIT, TypeScript |
| Phiên bản | v0.39.1 (25/09/2026) — **chưa 1.0** |
| Tuổi | sinh 01/04/2026, ~12.5k sao, 306 issue mở, commit hằng ngày |
| Nền | Astro, Node 22.16+ |
| CSDL | SQLite / libSQL / **PostgreSQL** / D1 |
| Lưu trữ | filesystem / S3 / R2 |
| Kiểu | **Không headless** — CMS và website chung một codebase, một deployment |

### Ràng buộc PostgreSQL (tài liệu EmDash nêu rõ)

Role kết nối phải **sở hữu** mọi bảng và function của EmDash, không chỉ có quyền
SELECT/INSERT/UPDATE/DELETE. Và phải là role **không hết hạn** — bỏ mọi TTL. Đổi tên
user trong connection string KHÔNG chuyển quyền sở hữu các object đã tạo.

→ Quyết định: EmDash dùng **schema riêng** trong cùng cụm Aiven, với role riêng sở hữu
schema đó. Không dùng chung role với backend Nest.

## Kiến trúc: EmDash là nhà, app là xưởng

```
EmDash (Astro, service mới)               ← NHÀ: mọi thứ công khai, biên tập được
├── Bài viết        rich text, media library, lên lịch đăng
├── Trang / Landing Puck kéo thả, khối Đông Y dựng sẵn
├── Rada SEO        plugin: trang admin + bảng riêng + cron crawl
└── Media, menu, SEO meta

App Vue + Nest (giữ nguyên)               ← XƯỞNG: phần sau đăng nhập
└── Đo kinh lạc, bệnh nhân, từ điển YHCT, dược liệu, 3D huyệt vị
```

Ranh giới: **nội dung biên tập** thuộc EmDash. **Dữ liệu YHCT** thuộc app. Trang dược
liệu / cổ phương / huyệt vị vẫn do app sinh — xem spec
`2026-09-25-va-prerender-duoc-lieu-design.md`.

## Hai vết nứt sẽ tan theo

**Vết 2 — nút "Đăng" trên VPS không ghi được file.** `seo.controller.ts:1327` tìm
`frontend/scripts/publish-article.mjs`; backend Dockerfile chỉ copy `dist` nên file
không tồn tại → `wrote = false`. Bài đăng xem được ngay qua `@blog_render` động nhưng
không vào sitemap, không vào trang danh sách `/blog/`, không có bản tĩnh. Bằng chứng:
`/blog/` liệt kê đúng 11 bài = đúng 11 file `.md` trong repo.

EmDash render thẳng từ DB nên khái niệm "có trong DB mà chưa có bản tĩnh" biến mất.

**Vết 3 — hai sổ duyệt.** DB có `seo_bai_viet.trang_thai` + checklist `kiem_duyet`;
file `.md` có `approved: true`. `publish-article.mjs` ghi `aiModel`/`seoCumId` (tự đóng
dấu "bài auto") nhưng **không bao giờ ghi `approved`**, trong khi
`qa-auto-articles.mjs --gate` chạy ở mọi lần build và ép `index: false` cho mọi bài auto
thiếu `approved`. Duyệt trong app không chảy sang được.

Chưa nổ vì repo mới có 1 bài auto và nó đã duyệt tay. Bài thứ hai là nổ.

EmDash chỉ có một sổ duyệt: draft / published của chính nó.

## Builder cho landing: Puck nhúng trong EmDash

Admin của EmDash chạy React; Puck (MIT) là editor kéo thả nhúng được vào bất kỳ app
React nào. Nên builder sống **bên trong** EmDash như một trang plugin — không thêm
service, không thêm RAM trên VPS (code chạy trong trình duyệt người quản trị).

Trang được lưu thành **cây JSON trỏ tới component của mình**, nên người quản trị kéo
thả bằng đúng bộ khối Đông Y đã code, không dựng ra được trang lạc quẻ với phần còn lại.

**Đã cân nhắc và loại:**

- *GrapesJS* (BSD-3) — tự do gần Flatsome nhất, xuất HTML/CSS. Loại vì tự do đó phá vỡ
  bộ nhận diện Đông Y, và nó là bộ khung để tự dựng builder, phần việc còn lại mình gánh.
- *Webstudio* (AGPL-3.0) — giống Webflow nhất nhưng là ứng dụng riêng phải self-host
  (thêm service trên VPS 2GB) và AGPL kéo theo nghĩa vụ mở nguồn.

**Điều phải chấp nhận:** Puck kéo thả **khối**, không chỉnh pixel tự do như Flatsome.
Thêm kiểu khối mới vẫn cần code một lần, sau đó dùng lại mãi.

## Điều EmDash KHÔNG cho sẵn

Tài liệu EmDash nói thẳng: *"developer-first CMS where layouts are code-based, not
visually designed by admins."*

- **Không ship block mặc định nào.** Hero, Feature Grid trong tài liệu chỉ là ví dụ dev
  phải tự viết.
- Page layout là component Astro do dev viết; người quản trị chọn trong dropdown.
- Sections là nhóm nội dung dùng lại, phải định nghĩa trước.

Bằng chứng thực tế: chính kstudy chạy EmDash nhưng trang chủ vẫn dùng ảnh xuất từ
LadiPage cũ và layout là component code tay (`HomeStudentProducts`).

→ Bộ khối Đông Y là việc **mình phải dựng**, không phải thứ cài vào là có.

## Rada SEO dọn vào plugin — làm được, nhưng là phần nặng nhất

| Rada SEO cần | EmDash plugin có |
|---|---|
| Trang riêng + mục sidebar | `admin.pages` — trang React, tự đặt route và nhãn |
| Bảng dữ liệu riêng | `storage` — bảng theo namespace của plugin |
| API riêng (Yescale, crawl) | Plugin API routes + `apiFetch()` có sẵn xác thực |
| Crawl đối thủ / quét index định kỳ | **Cron hook** — `ctx.cron.schedule()`, cron theo UTC |
| Gắn vào màn soạn bài | Editor panel trong sidebar của entry |
| Thẻ tổng quan | Dashboard widget |

Giới hạn phải nhớ: editor panel **chỉ mount trên bài đã lưu**; cột thêm vào danh sách
bài **chỉ đọc**, không sort/lọc.

Khối lượng: 2.534 dòng `seo.controller.ts` + 2.983 dòng `SeoRadarView.vue`. Không
copy-paste được — bảng đổi sang `storage`, giao diện viết lại từ Vue sang React, tác vụ
dài chuyển sang cron hook.

## Phân rã giai đoạn

Mỗi giai đoạn có spec → plan → dựng riêng. Xếp để có cái dùng sớm thay vì chờ trọn gói.

**GĐ 0 — Vá prerender dược liệu.** Độc lập, nhỏ, mở lại cả mảng site cho Google.
Spec riêng, đã duyệt hướng.

**GĐ 1 — Dựng EmDash, di cư blog.** Service `cms` trong docker-compose, schema riêng
trên Aiven, media qua volume. nginx giao `/blog/` cho EmDash. Dựng theme bài viết giữ
đúng JSON-LD Article/FAQ/Breadcrumb, disclaimer YMYL, người duyệt y sỹ, CTA, liên kết
nội bộ theo cụm — bản gốc ở `seo-blog.renderer.ts` (330 dòng) và `seo-html.mjs`. Di cư
11 bài. **Kết thúc GĐ 1, vết 2 và vết 3 tan.**

**GĐ 2 — Puck + bộ khối Đông Y.** Trang plugin chạy Puck; bộ khối đầu tiên: Hero,
nhiều cột, CTA, bảng so sánh, hộp cảnh báo y khoa, đồ hình Ngũ Hành/Âm Dương.

**GĐ 3 — Rada SEO thành plugin.** Nặng nhất, làm sau cùng khi hai giai đoạn trên đã chạy.

## Ràng buộc và rủi ro

**RAM.** VPS 2GB, đã cấp phát `backend 768m + ml 896m + nginx 128m ≈ 1.8GB` + swap 4GB.
Service EmDash cần thêm khoảng 250–400MB — **con số này là ước lượng, chưa đo**. Phải đo thật trước khi dựng: hoặc hạ `mem_limit`
của `ml-service` (thực tế lúc rảnh chỉ ~120MB), hoặc nâng RAM VPS. **Đây là việc đầu
tiên của GĐ 1, trước khi viết một dòng code nào.**

**EmDash chưa 1.0.** v0.39.1, commit hằng ngày. Sẽ có breaking change khi nâng cấp.
Ghim phiên bản, đọc changelog trước mỗi lần nâng, không tự động cập nhật.

**Một tiến trình, hai thứ dễ vỡ.** `@Cron` trong `appointment-reminder.service.ts` và
`Subject` rxjs trong `sse.service.ts` chỉ đúng khi backend chạy một instance. Thêm
service EmDash KHÔNG ảnh hưởng hai thứ này (khác tiến trình, khác việc), nhưng cron của
plugin rada SEO sau này thì phải tính lại nếu có ngày chạy nhiều instance.

## Ngoài phạm vi

- Không đụng vào phần sau đăng nhập của app (đo kinh lạc, bệnh nhân, 3D).
- Không di cư từ điển huyệt / dược liệu / cổ phương sang EmDash — đó là dữ liệu YHCT,
  không phải nội dung biên tập.
- Không dựng lại landing hiện tại bằng builder. Trang chủ đã code kỹ thì giữ; builder
  dành cho landing mới.
