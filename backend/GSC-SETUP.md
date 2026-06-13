# Kết nối Google Search Console (GSC) — Hướng dẫn bấm từng bước

> Phần **code đã xong** (backend tự gọi API GSC). Còn lại là **việc bạn phải tự làm 1 lần trên Google**
> để cấp quyền cho phần mềm. Làm xong các bước dưới đây (~10 phút) là chạy được.
>
> Cần "tài khoản máy" (**Service Account**) — không phải đăng nhập tay mỗi lần.

---

## Bạn cần có sẵn

1. Website đã được **xác minh** trong [Google Search Console](https://search.google.com/search-console)
   (đã thấy biểu đồ Hiệu suất của `kinhlac.online`).
2. Quyền **Chủ sở hữu (Owner)** trên property đó (để thêm người dùng).

---

## CÁCH A — Tái dùng service account Firebase (NHANH NHẤT, khuyên dùng)

Bạn đã có sẵn `FIREBASE_SERVICE_ACCOUNT` trong `.env`. Firebase cũng là một **dự án Google Cloud**,
nên ta chỉ cần bật thêm 1 API và cấp quyền — **không phải tạo key mới**.

### Bước A1 — Bật "Google Search Console API"
1. Vào https://console.cloud.google.com/ → chọn đúng **dự án Firebase** của bạn (tên dạng `kinhlacgiaminh`).
2. Thanh tìm kiếm trên cùng gõ: **Google Search Console API** → bấm vào → bấm **ENABLE / Bật**.

### Bước A2 — Lấy email service account
- Mở file JSON Firebase service account, tìm dòng `"client_email"`, ví dụ:
  `firebase-adminsdk-xxxx@kinhlacgiaminh.iam.gserviceaccount.com`
- Copy đúng email này.

### Bước A3 — Cấp quyền trong Search Console
1. Vào https://search.google.com/search-console → chọn property `kinhlac.online`.
2. **Cài đặt (Settings)** → **Người dùng và quyền (Users and permissions)** → **Thêm người dùng (Add user)**.
3. Dán email ở bước A2. Quyền:
   - **Toàn bộ (Full)** — để dùng được cả *gửi sitemap* và *kiểm tra URL*.
   - (Nếu chỉ cần xem số liệu thì *Hạn chế / Restricted* cũng được.)
4. Bấm **Thêm**.

### Bước A4 — Khai báo .env
Trong `backend/.env`, **để trống** `GSC_SERVICE_ACCOUNT` (nó sẽ tự lấy `FIREBASE_SERVICE_ACCOUNT`),
chỉ cần đặt đúng property:

```env
# Domain property (khuyến nghị):
GSC_SITE_URL=sc-domain:kinhlac.online
# HOẶC nếu property của bạn là kiểu "Tiền tố URL":
# GSC_SITE_URL=https://kinhlac.online/
```

> Cách biết property kiểu gì: ở Search Console góc trái, nếu tên là `kinhlac.online` trơn → **Domain**
> (`sc-domain:...`). Nếu là `https://kinhlac.online/` → **URL prefix** (ghi y nguyên kèm dấu `/`).

➡️ Xong. Nhảy xuống mục **Kiểm tra**.

---

## CÁCH B — Tạo service account riêng cho GSC (nếu không muốn đụng Firebase)

### Bước B1 — Tạo / chọn dự án + bật API
1. https://console.cloud.google.com/ → tạo dự án mới (hoặc dùng dự án có sẵn).
2. Bật **Google Search Console API** (như bước A1).

### Bước B2 — Tạo Service Account + key JSON
1. **IAM & Admin → Service Accounts → Create service account**.
2. Đặt tên bất kỳ (vd `gsc-reader`), bấm **Create and continue**, không cần gán role, **Done**.
3. Bấm vào service account vừa tạo → tab **Keys → Add key → Create new key → JSON → Create**.
4. File `.json` tự tải về. **Giữ bí mật** (đừng commit lên git).

### Bước B3 — Cấp quyền trong Search Console
- Mở file JSON, copy `client_email`, rồi làm **giống bước A3** (Add user, quyền Full).

### Bước B4 — Khai báo .env
Dán **nguyên văn** nội dung file JSON vào 1 dòng (giữ nguyên dấu ngoặc, dấu phẩy):

```env
GSC_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"gsc-reader@...iam.gserviceaccount.com", ...}
GSC_SITE_URL=sc-domain:kinhlac.online
```

> Mẹo: mở file JSON bằng Notepad → Ctrl+A → Ctrl+C → dán sau dấu `=`. Toàn bộ phải nằm trên **một dòng**.

---

## CÁCH C — OAuth (dùng khi KHÔNG thêm được service account vào Search Console)

Nếu Search Console báo "không tìm thấy email" khi thêm service account (hay gặp với tài khoản mới),
hãy dùng OAuth: **đăng nhập trực tiếp bằng tài khoản chủ sở hữu** (đã có sẵn quyền) — khỏi cần thêm ai.

### Bước C1 — Màn hình đồng ý (OAuth consent screen)
1. Google Cloud Console → chọn dự án **`kinhlac`** (dự án đã bật Search Console API).
2. **APIs & Services → OAuth consent screen**:
   - User Type: **External** → Create.
   - Điền App name (vd "Kinh Lạc GSC"), User support email + Developer email = email của bạn → Save.
   - (Scopes có thể bỏ qua bước thêm — script tự xin quyền khi đăng nhập.)
   - **Test users**: thêm `trangtruong.dig@gmail.com`.
   - **QUAN TRỌNG để token sống lâu**: bấm **PUBLISH APP** (chuyển sang "In production").
     Để ở "Testing" cũng chạy được nhưng **refresh token hết hạn sau 7 ngày**.

### Bước C2 — Tạo OAuth Client ID
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Desktop app** → đặt tên → **Create**.
3. Bảng hiện ra **Client ID** và **Client secret** → copy cả hai.

### Bước C3 — Điền .env rồi lấy refresh token
1. Trong `backend/.env`, điền 2 dòng:
   ```env
   GSC_OAUTH_CLIENT_ID=<client id vừa copy>
   GSC_OAUTH_CLIENT_SECRET=<client secret vừa copy>
   ```
2. Chạy lệnh (trong thư mục `backend`):
   ```
   node tmp/gsc-oauth.mjs
   ```
3. Trình duyệt tự mở (hoặc copy link nó in ra) → **đăng nhập `trangtruong.dig@gmail.com`**.
   - Gặp cảnh báo "Google chưa xác minh ứng dụng" → bấm **Nâng cao / Advanced → Đi tới (an toàn)**. (Bình thường với app của chính mình.)
   - Bấm **Cho phép / Allow**.
4. Quay lại terminal → nó in dòng `GSC_OAUTH_REFRESH_TOKEN=...` → **dán nốt vào `backend/.env`**.

Xong! Code thấy đủ 3 biến `GSC_OAUTH_*` sẽ tự dùng OAuth (ưu tiên hơn service account).

---

## Kiểm tra đã kết nối được chưa

1. Khởi động lại backend (`npm run start:dev` trong thư mục `backend`).
2. Đăng nhập web bằng tài khoản **Quản Trị Viên**, mở DevTools → Console, hoặc gọi thẳng API:

   ```
   GET  http://localhost:3001/seo/gsc/status     (kèm header Authorization: Bearer <token>)
   ```

3. Kết quả mong đợi:
   ```json
   { "success": true, "data": { "connected": true, "hasAccess": true, "permissionLevel": "siteFullUser", "sites": [ ... ] } }
   ```
   - `hasAccess: true` = đã cấp quyền đúng property. 🎉
   - `hasAccess: false` nhưng `sites` có liệt kê property khác → **copy đúng `siteUrl` đó** vào `GSC_SITE_URL`.
   - `connected: false` → đọc `reason` (thường do chưa đặt env hoặc JSON sai).

---

## Các endpoint đã có (đều cần đăng nhập Quản Trị Viên)

| Việc | Method & URL |
|------|--------------|
| Trạng thái kết nối | `GET /seo/gsc/status` |
| Tổng quan + diễn biến theo ngày | `GET /seo/gsc/summary?days=28` |
| Top từ khoá | `GET /seo/gsc/top-queries?days=28&limit=100` |
| Top trang | `GET /seo/gsc/top-pages?days=28&limit=100` |
| Từ khoá bị "ăn thịt" | `GET /seo/gsc/cannibalization?days=28` |
| Danh sách sitemap | `GET /seo/gsc/sitemaps` |
| Gửi sitemap | `POST /seo/gsc/sitemaps` body `{ "feedpath": "https://kinhlac.online/sitemap.xml" }` |
| Kiểm tra URL đã index | `POST /seo/gsc/inspect` body `{ "url": "https://kinhlac.online/blog/..." }` |

---

## Lỗi thường gặp

| Báo lỗi | Nguyên nhân & cách xử lý |
|---------|--------------------------|
| `403 ... chưa được cấp quyền` | Quên bước A3/B3, hoặc thêm sai email. Vào Search Console kiểm tra service account đã nằm trong danh sách người dùng. |
| `404 ... Không tìm thấy property` | `GSC_SITE_URL` sai định dạng. Xem `sites` trả về từ `/status` và copy y nguyên. |
| `Search Console API has not been used / disabled` | Quên bật API (bước A1/B1). Bật rồi đợi ~1 phút. |
| Số liệu trống 2-3 ngày gần nhất | Bình thường — GSC luôn trễ dữ liệu ~2-3 ngày. |
| `urlInspection ... 403` | URL Inspection cần quyền **Full/Owner**; nâng quyền service account lên Full. |

---

## Lưu ý bảo mật

- **Không commit** file `.json` service account hay `.env` lên git (đã có `.gitignore`).
- Trên VPS production: đặt `GSC_SERVICE_ACCOUNT` / `GSC_SITE_URL` trong `.env` của server, rồi `docker compose up`/restart.
