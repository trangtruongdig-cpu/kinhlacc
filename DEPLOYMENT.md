# Hướng dẫn triển khai trên VPS Ubuntu (Docker Compose + Aiven Postgres)

Stack chạy trên VPS:

| Service    | Image                     | Cổng       | Ghi chú                                  |
|------------|---------------------------|------------|------------------------------------------|
| `frontend` | `kinhlac/frontend:latest` | `80` (host)| nginx serve SPA + reverse-proxy `/api/`  |
| `backend`  | `kinhlac/backend:latest`  | nội bộ 3001| NestJS, không expose ra ngoài            |

Database **không** chạy trong docker — backend kết nối thẳng tới **Aiven Postgres** qua SSL.

Frontend gọi API qua `/api/*` (cùng origin) ⇒ **không cần mở port backend ra ngoài và không gặp lỗi CORS**.

---

## 1. Cài Docker trên Ubuntu 22.04 / 24.04

```bash
sudo apt update && sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Cho user hiện tại chạy docker không cần sudo (logout/login lại sau lệnh này)
sudo usermod -aG docker $USER
```

Kiểm tra: `docker --version` và `docker compose version`.

---

## 2. Chuẩn bị Aiven Postgres

1. Aiven Console → tạo service Postgres (chọn region gần VPS).
2. Vào tab **Overview**, ghi lại các giá trị:
   - Host (`kinhlac-xxx.aivencloud.com`)
   - Port (vd `23456`)
   - User (`avnadmin`)
   - Password
   - Database name (mặc định `defaultdb`, có thể tạo `kinhlac` riêng)
3. Tab **Allowed IP addresses** → thêm IP public của VPS.

---

## 3. Lấy mã nguồn

```bash
# ⚠️ Đây là ĐỀ XUẤT cho lần cài mới. Bản ĐANG CHẠY THẬT nằm ở ~/kinhlacc (kiểm
# 26/09/2026), nên khi viết lệnh cho VPS đó thì dùng ~/kinhlacc, đừng tin đường dẫn dưới.
sudo mkdir -p /opt/kinhlac && sudo chown $USER:$USER /opt/kinhlac
cd /opt/kinhlac
git clone <repo-url> .
```

---

## 4. Cấu hình biến môi trường

Có **hai** file `.env`. Cả hai đều **KHÔNG** được commit.

### 4.1. `.env` ở thư mục gốc (cho docker-compose)

```bash
cp .env.example .env
nano .env
```

| Biến          | Ý nghĩa                                                                       |
|---------------|-------------------------------------------------------------------------------|
| `HTTP_PORT`   | Cổng public của frontend (mặc định 80, đổi 8080 nếu đặt Caddy/Nginx trước)    |
| `VITE_API_URL`| Để mặc định `/api` trừ khi tách domain frontend / backend                     |

> Đổi `VITE_API_URL` ⇒ phải `docker compose build --no-cache frontend` (Vite bake URL vào bundle lúc build).

### 4.2. `backend/.env` (cho Nest runtime)

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Điền theo giá trị Aiven & secret thật:

| Biến                       | Ghi chú                                                                                                                                  |
|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `APP_PORT`                 | Giữ `3001` (compose & nginx đã trỏ vào port này).                                                                                        |
| `FRONTEND_URL`             | Origin frontend, vd `http://kinhlac.example.com` (dùng cho CORS / link).                                                                 |
| `DB_HOST`                  | Host Aiven (`kinhlac-xxx.aivencloud.com`).                                                                                               |
| `DB_PORT`                  | Port Aiven (vd `23456`).                                                                                                                 |
| `DB_USER`                  | `avnadmin` (hoặc user bạn tạo).                                                                                                          |
| `DB_PASSWORD`              | Password Aiven.                                                                                                                          |
| `DB_NAME`                  | Tên DB (`defaultdb` hoặc DB bạn tạo).                                                                                                    |
| `CA_CERTIFICATE`           | Dán nội dung file `ca.pem` từ Aiven (đổi xuống dòng thật thành `\n`). Hiện code chưa đọc, để placeholder cũng được — Nest dùng `rejectUnauthorized: false`. |
| `FIREBASE_SERVICE_ACCOUNT` | Nội dung file service-account JSON từ Firebase (1 dòng, đã `JSON.stringify`). Để trống nếu chưa dùng FCM / Firebase.                     |
| `JWT_SECRET`               | **BẮT BUỘC** đổi. Sinh bằng `openssl rand -hex 48`. Nếu bỏ trống, Nest rơi về `'fallback_secret_key'` — KHÔNG an toàn.                   |
| `YESCALE_API_KEY`          | Key gateway AI. Để trống nếu chưa dùng AI suggest.                                                                                       |
| `CMS_SSO_SECRET`           | Đăng nhập một lần sang `/_emdash/admin/`. Sinh bằng `openssl rand -hex 32`. **PHẢI dán y hệt sang `cms/.env`** — lệch một ký tự là nút "Quản Trị Nội Dung" báo vé sai. Thiếu thì trả 503 kèm lý do, passkey vẫn dùng được. |

> **Lưu ý SSL với Aiven**: Aiven bắt buộc SSL. Mặc định `app.module.ts` đã set `ssl: { rejectUnauthorized: false }` khi `DB_SSL` không phải `false`, đủ để bắt tay. **Đừng** set `DB_SSL=false` trong `backend/.env` khi đang trỏ ra Aiven.
>
> **Tuỳ chọn nâng cao**: nếu muốn dùng connection string một dòng thay cho 5 biến `DB_*`, code cũng hỗ trợ `DATABASE_URL` (vd `postgres://avnadmin:xxx@host:23456/defaultdb?sslmode=require`). Khi đó các biến `DB_HOST/PORT/USER/PASSWORD/NAME` sẽ bị bỏ qua.

---

## 5. Chạy schema migrations vào Aiven

## ⚠️ ĐỪNG DỌN BA CHỖ NÀY cho tới khi kho S3 chạy ổn

Người dùng đã chốt (26/09/2026): **giữ cho ổn rồi sau mới xoá.** Ghi ra đây vì cả ba đều
trông như rác và rất dễ bị một phiên sau "dọn cho gọn".

| Chỗ | Dung lượng | Vì sao PHẢI GIỮ |
|---|---|---|
| `cms/uploads/` | 84 MB | Kho ảnh ĐANG HOẠT ĐỘNG của CMS, và là nguồn DUY NHẤT cho phép di cư S3. Xoá trước khi di cư xong là mất hẳn byte ảnh. |
| `frontend/public/kinhmach3d/images/` (chỉ trên VPS) | — | Là ĐƯỜNG LÙI của ảnh huyệt/kinh: `<img src="CMS" onerror="…ảnh tĩnh">`. Không có trong git → xoá là mất hẳn. |
| 7 tệp mồ côi trong `cms/uploads/` | 1,1 MB | Không có bản ghi `media` nào trỏ tới (lần nạp hỏng). Nhỏ, vô hại. |

Xoá được KHI NÀO: sau khi di cư S3 xong **và** kiểm chứng ảnh phục vụ từ bucket ổn định
một thời gian. Lúc đó bỏ luôn phần `onerror` trong `build-dict.mjs` cho gọn.

Đã xoá rồi (an toàn, đã kiểm): `cms/.tam-anh/` — 2.752 tệp / 100 MB ảnh tạm. Cách kiểm
trước khi xoá là điều đáng lặp lại: **tên tệp hai bên khác nhau** (`GV25-kinh.webp` vs
ULID) nên không đối chiếu được bằng tên; bảng `media` có cột `content_hash` (sha1), băm
từng tệp rồi so mới chứng minh được cả 2.752 tệp đã nằm trong CMS.

## ⚠️ ẢNH CỦA CMS KHÔNG ĐI THEO `git push`

Đây là bẫy đã cắn thật (26/09/2026): deploy xong, trang huyệt hiện đủ chữ nhưng **bốn ảnh
3D vỡ hết**, gọi ảnh trả `404`.

Nguyên nhân là kiến trúc, không phải cấu hình sai: **CSDL dùng chung, tệp ảnh thì không.**

- `cms/astro.config.mjs` cất ảnh bằng `storage: local({ directory: "./uploads" })`, và
  `docker-compose.yml` gắn `./data/cms-uploads:/app/uploads`.
- `cms/uploads/` nằm trong `.gitignore` → `git push` KHÔNG mang tệp ảnh đi.
- Nhưng **bản ghi** ảnh nằm trong Postgres của Aiven, vốn dùng chung giữa máy lập trình và
  VPS. Nên khâu build đọc được `storageKey` và nướng URL vào HTML, còn **byte của ảnh thì
  không có trên VPS** → 404 mà trang vẫn dựng bình thường.

**Cách đúng về lâu dài: nạp ảnh qua trang quản trị của SITE THẬT** (`/_emdash/admin` trên
kinhlac.online), để tệp rơi thẳng vào `data/cms-uploads/` của VPS. Nạp ở máy lập trình là
tự tạo việc đồng bộ tay.

**Nếu đã nạp ở máy lập trình rồi** thì đẩy tệp lên trước khi build:

⚠️ **ĐỪNG đoán đường dẫn repo trên VPS.** Hướng dẫn cài ở trên đề xuất `/opt/kinhlac`
nhưng bản đang chạy thật nằm ở `~/kinhlacc` — tôi đã chỉ sai lệnh một lần vì tin theo tài
liệu. Hỏi Docker, đó mới là câu trả lời thật:

```bash
# trên VPS — in ra ĐÚNG thư mục host mà container đang gắn
docker inspect kinhlac_cms --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
ls ~/kinhlacc/data/cms-uploads 2>/dev/null | wc -l   # đang có bao nhiêu tệp
```

```bash
# trên VPS — tạo thư mục trước để nó không bị container tạo với quyền root
mkdir -p ~/kinhlacc/data/cms-uploads

# trên máy lập trình, trong thư mục kinhlacc
rsync -avz --progress cms/uploads/ root@<ip-vps>:~/kinhlacc/data/cms-uploads/
```

Dấu `/` cuối `cms/uploads/` là BẮT BUỘC. Thiếu nó rsync tạo thêm một cấp `uploads/` bên
trong đích và ảnh vẫn 404.

Không cần build lại, cũng không cần restart: đó là bind mount nên tệp bỏ vào là thấy ngay.

Kiểm sau khi đẩy — phải ra `200 · image/webp`, không phải `404 · application/json`:

```bash
curl -sI https://kinhlac.online/_emdash/api/media/file/<storageKey>.webp | head -1
```

Lấy một `storageKey` có thật từ chính trang đang lỗi:

```bash
curl -s https://kinhlac.online/huyet/khi-huyet/ | grep -o '/_emdash/api/media/file/[^"]*' | head -1
```

`backend/sql/` chứa các migration viết tay. Chạy lần đầu trên Aiven từ VPS:

```bash
sudo apt install -y postgresql-client

# Build connection string từ giá trị bạn vừa điền vào backend/.env
export PGPASSWORD='<DB_PASSWORD>'
PSQL="psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -d <DB_NAME> --set=sslmode=require"

# Áp dụng từng file SQL theo thứ tự — xem backend/sql/README.md
$PSQL -f backend/sql/<file>.sql
```

Seed admin mặc định (`admin` / `password123`):

```bash
docker compose exec backend npx ts-node src/seed-admin.ts
```

---

## 6. Build & chạy

> ⚠️ **VPS RAM thấp (≤ 2GB): tạo swap TRƯỚC khi build, nếu không build dễ treo cứng máy.**
> Chỉ cần làm **một lần** cho mỗi VPS:
> ```bash
> sudo bash setup-swap.sh        # tạo swap 4GB + giữ qua reboot
> ```

Build & khởi động. Có **hai cách** — chọn theo RAM của VPS:

```bash
# CÁCH KHUYẾN NGHỊ (RAM thấp): build TỪNG image một → đỉnh RAM thấp, không treo.
bash deploy.sh

# Cách cũ (chỉ dùng khi VPS RAM ≥ 4GB): build cả 2 image CÙNG LÚC → nhanh hơn nhưng tốn RAM gấp đôi.
docker compose up -d --build
```

> `deploy.sh` tự: `git pull` → build backend rồi build frontend (tuần tự) → `up -d` → dọn image cũ.
> Nó bật sẵn BuildKit để cache `npm` (lần build sau nhanh hơn nhiều).
>
> **Nếu SSH hay rớt khi build** (VPS RAM thấp), chạy ở chế độ nền để rớt SSH không cắt build:
> ```bash
> nohup bash deploy.sh > deploy.log 2>&1 &
> tail -f deploy.log     # xem tiến độ; Ctrl-C chỉ thoát xem, build vẫn chạy
> ```

Kiểm tra:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

Truy cập:

- Frontend SPA: `http://<IP-VPS>` (hoặc domain trỏ về VPS)
- API qua proxy:  `http://<IP-VPS>/api/...`

---

## 7. Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp     # khi đã có HTTPS (mục 8)
sudo ufw enable
```

Không mở `3001` ra ngoài — backend đã ở trong docker network nội bộ.

---

## 8. HTTPS bằng Caddy (khuyến nghị)

1. Đổi `HTTP_PORT=8080` trong `.env`, `docker compose up -d`.
2. Cài Caddy:
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update && sudo apt install -y caddy
   ```
3. `/etc/caddy/Caddyfile`:
   ```caddy
   kinhlac.example.com {
       encode zstd gzip
       reverse_proxy 127.0.0.1:8080
   }
   ```
4. `sudo systemctl reload caddy` — Caddy tự lấy chứng chỉ Let's Encrypt.
5. Cập nhật `FRONTEND_URL=https://kinhlac.example.com` trong `backend/.env`, `docker compose restart backend`.

---

## Rada SEO (plugin CMS)

Plugin `cms/src/plugins/rada-seo/` quét sitemap đối thủ mỗi đêm 02:30 giờ VN và **trích sẵn
chữ** các bài mới. Việc ĐỌC hiểu do **routine Claude trong tài khoản claude.ai của chủ site**
làm qua MCP (05:00), không có khoá API Anthropic nào. Kết quả hiện ở mục **Rada SEO** trong khu quản trị.

⚠️ **Hai cửa MCP khác nhau, đừng lẫn.** `/api/mcp/<MCP_TOKEN>` (mục "Cửa MCP cho claude.ai"
cuối file) là bot thẩm định của **backend**, dùng connector claude.ai là ĐÚNG. Cửa của Rada
SEO là `/_emdash/api/mcp` (của **CMS**) — KHÔNG dùng connector, chỉ nối bằng routine +
`.mcp.json` + `RADA_SEO_MCP_TOKEN` như mô tả dưới đây.

**Biến môi trường — đặt đúng chỗ:**

- `RADA_SEO_CA_DEM: "1"` và `TZ: UTC` → **`docker-compose.yml`**, KHÔNG phải `cms/.env`:
  tệp `.env` được chép qua lại máy dev, mà chỉ VPS được phép chạy ca đêm (bảng cron nằm
  trong kho CMS dùng chung).
- `RADA_SEO_TRAN_MOI_DOI_THU` (số trang trích mỗi đối thủ mỗi đêm, mặc định 30) → `cms/.env`.
- **Không còn** `ANTHROPIC_API_KEY` (bỏ 30/09/2026). Ai thấy biến này ở `cms/.env` thì xoá.

**Sau lần deploy đầu — theo đúng thứ tự:**

1. `/_emdash/admin` → **Rada SEO**: mở trang là lịch đêm TỰ bật (chỉ khi `RADA_SEO_CA_DEM=1`,
   tức trên VPS). Thêm site của mình (tick **"site của mình"**) và các đối thủ — lưu đối thủ
   lần đầu là ca radar đầu tiên TỰ chạy nền. Vài phút sau bấm "Tải lại": Nhật ký ca có dòng,
   cột "Trích" > 0. Nút "Bật lịch" / "Chạy thật" chỉ còn là đường dự phòng.
2. Nối Claude (routine đêm) theo `cms/src/plugins/rada-seo/routine/dem-doc-doi-thu.md`:
   bật MCP tools của plugin → tạo khoá `ec_pat_` **chỉ** scope `mcp:tools:rada-seo` → môi
   trường routine có biến bí mật `RADA_SEO_MCP_TOKEN` và mở mạng tới `kinhlac.online` →
   routine 05:00 → "Run now" một lần, Nhật ký ca phải có dòng "Claude đọc".
   ⚠️ **Đừng** nối bằng connector trong claude.ai Settings: OAuth của EmDash chỉ cấp
   `mcp:tools` cho ADMIN, nên tài khoản thường không gọi được công cụ Rada SEO còn tài khoản
   admin thì trao cho Claude quyền đăng/xoá bài (đo ở nghiệm thu 2B-1).
3. **Theo dõi 2 đêm liền.** Dải đỏ "26 giờ qua Claude chưa đọc trang nào" = routine không
   chạy, khoá sai/thu hồi, hoặc môi trường routine chặn tên miền.

**Sau MỖI lần deploy có đổi công cụ MCP của plugin — BẮT BUỘC, không thì routine đêm gãy:**

EmDash chỉ phơi công cụ MCP của một plugin khi "đồng ý" đã lưu KHỚP ĐÚNG danh sách công cụ
hiện tại (`serializePluginMcpConsent`: tên, mô tả, route, quyền, destructive, khuôn input —
đo trong mã EmDash 0.39.1). Thêm công cụ (vd `rada_tim_lien_ket`) hoặc sửa MỘT chữ trong mô tả
hay khuôn input của bất kỳ công cụ nào là đồng ý cũ lệch → **TẤT CẢ công cụ `rada_*` biến mất**
khỏi `tools/list`, không báo lỗi gì, và routine 05:00 dừng ở "không thấy công cụ rada_*".

1. Bật lại: `/_emdash/admin` → **Plugins** → **Rada SEO** → tắt rồi bật lại **MCP tools**;
   hoặc (tài khoản có `plugins:manage`)
   `PUT /_emdash/api/admin/plugins/rada-seo/mcp` với thân `{"enabled":true}`.
2. Xác nhận: phản hồi của lệnh trên (hoặc trang Plugins) liệt kê đủ **14 công cụ** (từ 2C-3;
   2D có 12, 2C-2 có 8, trước đó 4) — `rada_lay_viec`, `rada_ghi_phan_tich`, `rada_tim_lien_ket`,
   `rada_xong_phan_tich`, `rada_lay_du_lieu_chien_luoc`, `rada_de_xuat_huong`, `rada_ghi_cum`,
   `rada_de_xuat_ke_hoach`, `rada_lay_tu_khoa_leo_top`, `rada_nop_serp`, `rada_lay_trang_serp`,
   `rada_ghi_so_ho`, `rada_lay_bai_can_viet`, `rada_nop_bai`. Thiếu hai cái cuối là dấu hiệu
   đồng ý MCP còn ở bản trước 2C-3; thiếu sáu cái cuối là còn ở bản trước 2D.

Plugin KHÔNG tự đọc được trạng thái này (ngữ cảnh plugin của EmDash không có API đọc trạng
thái plugin của chính nó), nên màn Rada SEO không báo được — chỉ dải đỏ "Claude chưa đọc" sau
26 giờ. Đừng trông vào dải đỏ: làm bước này ngay khi deploy.

**Sau deploy 2C-2 (hướng nội dung + kế hoạch) — thêm hai việc, chỉ làm MỘT LẦN:**

1. Bật lại MCP tools theo đúng hai bước ngay ở trên (thiếu bước này thì mọi công cụ đều
   biến mất khỏi `tools/list`, không riêng các công cụ mới).
2. Tạo routine chiến lược hằng tuần theo
   `cms/src/plugins/rada-seo/routine/tuan-chien-luoc.md`: CÙNG môi trường "kinhlac-rada" và
   CÙNG khoá `RADA_SEO_MCP_TOKEN` đã tạo cho routine đọc đêm — không tạo môi trường hay khoá
   riêng — lịch **Chủ Nhật 06:00 giờ Việt Nam**. Bấm "Run now" một lần, xem tab **Hướng nội
   dung** trong khu quản trị Rada SEO có hướng mới ở trạng thái "Đề xuất".

⚠️ **Lần chạy đầu cần kho đã có ít nhất vài trăm chủ đề đối thủ `da_phan_tich`** (routine đọc
đêm tích luỹ dần, ≤ 40 trang/đêm — xem mục ngay trên). Chạy routine chiến lược khi kho còn ít
chủ đề vẫn không lỗi gì, nhưng phần lớn hướng đề xuất sẽ bị máy chủ bác vì chưa đủ "≥ 3 bài
đối thủ có thật làm bằng chứng" — đừng vội kết luận routine hỏng, đọc mục "bac" trong báo cáo
cuối routine trước.

**Sau deploy 2D (leo top) — ba việc, chỉ làm MỘT LẦN, theo đúng thứ tự:**

1. **Search Console cho plugin.** Plugin dùng CÙNG tài khoản OAuth mà backend đang dùng — chỉ
   cần chép ba dòng từ `backend/.env` sang `cms/.env` trên VPS (trong thư mục repo), rồi dựng
   lại container cms (đổi `env_file` phải tạo lại container, `restart` không nạp biến mới):

   ```bash
   [ -z "$(tail -c1 cms/.env)" ] || echo >> cms/.env   # dòng cuối thiếu xuống dòng thì dòng GSC dính vào nó
   grep -E "^GSC_OAUTH_(CLIENT_ID|CLIENT_SECRET|REFRESH_TOKEN)=" backend/.env >> cms/.env
   docker compose up -d --force-recreate cms
   ```

   Chạy `grep` MỘT lần thôi (chạy lại là dòng bị lặp). Đừng `cat`/in hai tệp `.env` ra màn
   hình hay dán vào chat. `GSC_SITE_URL` không bắt buộc: thiếu thì mặc định
   `https://kinhlac.online/` (property kiểu tiền tố URL, giống backend). Kiểm: tab **Leo top**
   trong khu quản trị Rada SEO KHÔNG còn dòng vàng "chưa cấu hình Search Console". Thiếu biến
   thì plugin không sập: công cụ `rada_lay_tu_khoa_leo_top` trả `loi` nêu thiếu biến nào, còn
   ca đêm ghi một dòng "Thông tin" trong Nhật ký ca và bỏ qua bước đo lại hạng.
2. **Bật lại MCP tools** theo hai bước ở mục "Sau MỖI lần deploy có đổi công cụ MCP" ngay
   trên — 2D thêm 4 công cụ (lúc đó phải thấy đủ **12**; từ 2C-3 là **14**). Không làm thì cả
   routine đọc đêm lẫn routine chiến lược cũng gãy, không riêng leo top.
3. **Tạo routine Thứ Tư** theo `cms/src/plugins/rada-seo/routine/tuan-leo-top.md`: lịch
   **Thứ Tư 06:30 giờ Việt Nam**, trong một **MÔI TRƯỜNG RIÊNG** ("kinhlac-rada-leo-top"),
   KHÔNG dùng chung "kinhlac-rada". Routine này phải **tìm web**, nên môi trường của nó có thể
   cần mạng rộng hơn — còn "kinhlac-rada" của routine đọc đêm và routine chiến lược phải giữ
   mạng chỉ `kinhlac.online`. Khoá `RADA_SEO_MCP_TOKEN` của môi trường mới: cùng scope hẹp
   `mcp:tools:rada-seo`, nên là khoá riêng để thu hồi độc lập. Không connector, không push,
   không Bash/tệp/git (chi tiết và lý do trong tệp routine).

**Sau deploy 2C-3 (lò viết bài) — bốn việc, chỉ làm MỘT LẦN, theo đúng thứ tự:**

1. **Bật lại MCP tools** theo hai bước ở mục "Sau MỖI lần deploy có đổi công cụ MCP" ở trên —
   2C-3 thêm `rada_lay_bai_can_viet` và `rada_nop_bai`, phải thấy đủ **14**. Không làm thì cả
   ba routine đang chạy (đọc đêm, chiến lược, leo top) cùng gãy, không riêng routine viết.
2. **Quyền mới không cần bước đồng ý.** 2C-3 thêm `content:write`, `media:read` và
   `hooks.content-policy:register` vào plugin; trên trang Plugins chỉ đổi nhãn quyền, không có
   hộp "đồng ý" nào phải bấm (đã đo). Đừng đi tìm nút đồng ý.
3. **Tạo routine viết** theo `cms/src/plugins/rada-seo/routine/dem-viet-bai.md`: lịch **mỗi ngày
   05:30 giờ Việt Nam**, trong một **MÔI TRƯỜNG RIÊNG** ("kinhlac-rada-viet") với **khoá
   `ec_pat_` RIÊNG** (scope chỉ `mcp:tools:rada-seo`), KHÔNG dùng chung "kinhlac-rada" hay
   "kinhlac-rada-leo-top". Đây là môi trường rủi ro nhất: Claude phải tìm web VÀ mở đọc trang
   nguồn, nên mạng không thể chỉ có `kinhlac.online` — khoá riêng để thu hồi độc lập khi nghi
   lộ. Không connector, không push, không Bash/tệp/git (chi tiết và giới hạn của từng rào
   trong tệp routine). Trước lần chạy đầu, tab **Kế hoạch** phải có bài dự kiến đã Duyệt.
4. **Biết trước hai điều đổi hành vi:**
   - **Publish bị chặn khi một `bai_viet` vượt phạm vi Y sỹ** (hook `content:beforePublish`) —
     áp cho CẢ bài người viết, không riêng bài máy viết. Bài người viết soát chế độ THƯỜNG,
     bài máy viết (có trong tab Nháp) soát chế độ NGHIÊM; thông báo khi chặn nêu đúng chữ nào
     và gợi ý thay. Ai báo "không Publish được bài" thì đọc thông báo đó trước.
   - **IndexNow ĐÃ bật từ kế hoạch 3 (01/10/2026)** — trước đó cố ý tắt vì bài Publish trong
     CMS chưa lên được `/blog/`. Nay Publish một `bai_viet` thì plugin chờ trang công khai
     `https://kinhlac.online/blog/<slug>/` trả **200** rồi mới báo; trang chưa lên thì ghi
     lỗi và KHÔNG báo. Unpublish cũng báo, để bot quay lại thấy bài đã gỡ. Chỉ chạy trên VPS (`RADA_SEO_CA_DEM=1`), máy lập trình không
     báo. Điều kiện để nó chạy được là nginx mới đã lên — xem mục "Blog: tĩnh trước, CMS đỡ
     sau" ngay dưới.

⚠️ **Ảnh nạp qua API mất `alt`:** `alt` gửi kèm lúc tải ảnh lên (multipart) bị bỏ, phải `PUT` riêng — mà lò viết chọn ảnh bìa THEO alt, nên ảnh nạp cho lò viết phải có alt đặt trong thư viện ảnh (Media), không thì không bao giờ được chọn.

**Kiểm một lần sau deploy — container CMS tự tải được site thật:** `rada_tim_lien_ket` kiểm
từng liên kết bằng cách tải trang thật TỪ TRONG container. Nếu container không ra được
`kinhlac.online` (DNS, tường lửa, hairpin NAT) thì mọi cụm trả `ketQua` rỗng mà không lỗi.

```bash
docker compose exec cms node -e "fetch('https://kinhlac.online/huyet/am-khich/').then(r=>console.log(r.status))"
```

Phải in ra `200`.

**Đừng:**

- **Đừng bấm "Chạy thử"/"Chạy thật" từ máy lập trình** khi VPS có thể đang chạy ca: khoá
  chống chạy chồng nằm trong kho dùng chung.
- **Đừng deploy trong khoảng 02:30–06:00 giờ VN** (từ 2C-3: routine viết chạy 05:30, một lượt
  nộp bài có thể mất vài phút). Một ca bị cắt ngang giữa chừng (deploy làm
  container CMS tắt) giữ khoá `ca:dang-chay` tới 3 giờ — trong lúc đó nút "Chạy thật" bị khoá
  ("Đang có một ca chạy — chờ ca đó xong") dù ca thật đã chết theo container cũ.
- Hai dải đỏ "26 giờ" là BÌNH THƯỜNG cho tới khi ca radar và lượt Claude đầu tiên chạy xong.

URL bị đánh dấu lỗi (trang chặn tạm, mạng chập) không tự thử lại; dùng nút **"Thử lại URL
lỗi"** ở dòng đối thủ. Máy chủ giao cho Claude tối đa **40 trang mỗi đêm** — trần giữ hạn
mức gói Claude, nằm ở `cms/src/plugins/rada-seo/mcp-viec.mjs`.

---

## Blog: tĩnh trước, CMS đỡ sau

Kế hoạch: `docs/superpowers/plans/2026-10-01-ke-hoach-3-blog-len-cms.md`. Bài Publish trong
CMS hiện ở `/blog/<slug>/` NGAY, không chờ build; 11 bài cũ vẫn là tệp tĩnh, không đổi một byte.

**Cách chạy** (`frontend/nginx.conf`, các khối blog):

| Đường | Ai trả lời |
|---|---|
| `/blog/<slug>/` | tệp tĩnh trong `dist/blog/` nếu có → không có thì **CMS** dựng trực tiếp → CMS trả 404 thì **backend cũ** (`@blog_render`, bài chỉ có trong DB app) → 404 thật |
| `/blog/` | **CMS** dựng trực tiếp (danh sách luôn mới); CMS sập thì trả `dist/blog/index.html` của lần build gần nhất (header `X-Blog-Nguon: tinh-du-phong`) |
| `/blog/sitemap.xml` | CMS sinh động; đã khai trong `robots.txt` bên cạnh `/sitemap.xml` |
| `/blog`, `/blog/<slug>` (thiếu `/`) | 301 thêm `/` |
| `/blog/blog.css`, ảnh, js | tệp tĩnh, như cũ (khối đuôi tệp của nginx) |

Không có lớp đệm nginx nào trên `/blog/` — cố ý: thêm 60 giây đệm là bài vừa Publish hiện
chậm một phút và bài vừa gỡ còn sống thêm một phút.

**Thứ tự deploy — image `cms` TRƯỚC, `frontend` (nginx) SAU.** Ngược lại thì trong khoảng
giữa hai lần build, nginx mới đẩy `/blog/` sang CMS cũ — CMS cũ trả trang blog mẫu tiếng Anh
không có CSS.

```bash
cd ~/kinhlacc && git pull
docker compose build cms      && docker compose up -d cms        # 1. trang blog đúng khuôn
docker compose build frontend && docker compose up -d frontend   # 2. nginx mới + robots.txt
```

**Kiểm sau deploy** (chỉ đọc, chạy từ máy nào cũng được):

```bash
node frontend/scripts/kiem-blog-song.mjs
```

Nó kiểm 11 slug cũ vẫn 200 và giống bản tĩnh, `/blog/` 200 đủ bài, `/blog/sitemap.xml` hợp
lệ, `/blog/khong-co/` là 404 thật, `/blog/blog.css` là 200 `text/css`. Kiểm tay thêm một lần
trong **cửa sổ ẩn danh**: `curl` không chạy service worker nên không thấy được cảnh "bấm vào
ra trang chủ".

**Biết trước:**

- **Sửa một trong 11 bài cũ trong CMS CHƯA đổi trang công khai** — bản tĩnh thắng, cho tới
  khi `build-blog` đọc từ CMS (việc để sau). Bài mới chỉ có trong CMS thì sửa là thấy ngay.
- **CMS sập hoặc đang khởi động lại**: 11 bài tĩnh và trang danh sách vẫn sống; bài chỉ có
  trong CMS thì trả **503 + `Retry-After: 30`** (đo trên nginx thật 01/10/2026) — Google coi là
  "thử lại sau", không phải trang chết. Slug không tồn tại và `/blog/sitemap.xml` lúc đó cũng
  ra 503, nên đừng chạy `kiem-blog-song.mjs` đúng lúc `cms` đang khởi động lại.
- **Sửa bài đã đăng mà chỉ bấm Save thì trang công khai CHƯA đổi** — phải Publish lại. Ô SEO
  "no index" thì có hiệu lực ngay khi Save.
- **Sau deploy đọc log container `cms`**: không được có dòng `[blog] không tra được …` (hai
  truy vấn noindex/ảnh bìa mới đo trên libsql, chưa đo trên Postgres; hỏng thì trang vẫn dựng
  nhưng mất phần đó).
- **IndexNow chỉ báo khi Publish trên VPS, và chỉ sau khi trang trả 200** (xem mục Rada SEO
  ở trên). Publish mà nginx cũ còn chạy thì trang 404 → không báo, có ghi lỗi ở tab Nháp.
- **Đừng thêm `^~` vào `location /blog/`.** `/blog/blog.css` là tệp mọi trang tĩnh (~7.000
  trang) đang nạp và phải do khối đuôi tệp phục vụ.

**Lùi lại:** trong `frontend/nginx.conf` có khối chú thích "ĐƯỜNG LÙI" ngay dưới các khối
blog — xoá bốn khối mới, bỏ dấu `#` ở khối cũ, dựng lại image `frontend`. Về đúng như trước:
tĩnh trước, backend sau; bài chỉ có trong CMS thành 404 (nên lùi xong thì đừng Publish bài
mới — IndexNow sẽ không báo vì trang không lên 200, nhưng người đọc cũng không thấy bài).
Không cần lùi image `cms`.

---

## 9. Vận hành thường ngày

```bash
# Update code + build lại (RAM thấp, build tuần tự, không treo) — KHUYẾN NGHỊ
bash deploy.sh

# (Cách cũ, chỉ khi VPS RAM ≥ 4GB:  git pull && docker compose up -d --build)

# Log
docker compose logs -f backend
docker compose logs -f frontend

# Restart 1 service
docker compose restart backend

# Dừng / xóa container (không ảnh hưởng dữ liệu vì DB ở Aiven)
docker compose down

# Backup DB từ Aiven
PGPASSWORD='<DB_PASSWORD>' pg_dump \
  -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -d <DB_NAME> \
  | gzip > backup-$(date +%F).sql.gz
```

---

## 10. Troubleshooting

| Triệu chứng                                       | Nguyên nhân thường gặp                                                                            |
|---------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Build treo cứng máy / `Killed` / `exit 137`/`134` | VPS hết RAM khi build. Tạo swap (`sudo bash setup-swap.sh`) **và** build tuần tự (`bash deploy.sh`). |
| Backend báo `ECONNREFUSED` / `timeout` tới Aiven  | IP của VPS chưa thêm vào **Allowed IP addresses** trong Aiven console.                            |
| Backend báo `no pg_hba.conf entry … SSL off`      | Đã set `DB_SSL=false` trong `backend/.env`. Bỏ dòng đó để dùng SSL mặc định.                      |
| Frontend trả 502 khi gọi `/api/*`                 | Backend chưa healthy hoặc chưa connect được Aiven. Xem `docker compose logs backend`.             |
| Đổi `VITE_API_URL` mà bundle vẫn gọi URL cũ       | Vite bake biến lúc build. `docker compose build --no-cache frontend && docker compose up -d`.     |
| F5 trang lại văng về `/login`                     | Nginx thiếu SPA fallback — đã xử lý sẵn trong `frontend/nginx.conf` (`try_files … /index.html`).  |
| Log backend cảnh báo `fallback_secret_key`        | Chưa đặt `JWT_SECRET` trong `backend/.env`.                                                       |
| Firebase log `service account not found`          | Chưa điền `FIREBASE_SERVICE_ACCOUNT` (chuỗi JSON 1 dòng) trong `backend/.env`.                    |
| claude.ai báo không kết nối được MCP              | Chưa đặt `MCP_TOKEN` trên VPS (cửa trả 404), hoặc token trong URL sai. Xem mục "Cửa MCP" cuối file. |
| Màn Rada SEO báo đỏ "Claude chưa đọc"             | Routine đêm không chạy (xem lịch sử ở claude.ai/code/routines), khoá `RADA_SEO_MCP_TOKEN` sai/thu hồi/hết hạn, hoặc môi trường routine chặn `kinhlac.online`. Xem mục "Rada SEO" ở trên. |

---

## Cửa MCP cho claude.ai — sai bot từ điện thoại

⚠️ **Cửa này khác cửa của Rada SEO.** `/api/mcp/<MCP_TOKEN>` dưới đây là bot thẩm định của
**backend** — dùng connector claude.ai là ĐÚNG. Cửa `/_emdash/api/mcp` của **CMS** (Rada SEO,
mục ở trên) thì NGƯỢC LẠI: KHÔNG dùng connector, chỉ nối bằng routine + `.mcp.json` +
`RADA_SEO_MCP_TOKEN`.

Sau khi cắm, mở [claude.ai](https://claude.ai) trên máy nào cũng được (kể cả điện thoại) và
hỏi thẳng: *"bot thẩm định đêm qua tìm ra gì?"*, *"chạy quét cả kho"*, *"nhóm lỗi nào đang
nặng nhất?"*. Không cần mở web app, không cần SSH.

### 1. Đặt token trên VPS

`MCP_TOKEN` là hàng rào DUY NHẤT của cửa này, nên nó phải dài và ngẫu nhiên:

```bash
ssh -p 24700 root@103.56.163.42
cd /root/kinhlacc
openssl rand -hex 32                      # sinh 64 ký tự
echo 'MCP_TOKEN=<dán-chuỗi-vừa-sinh>' >> backend/.env
docker compose up -d --build backend
```

⚠️ **`backend/.env` không đi theo `git push`** (đã `.gitignore`), nên token trên VPS phải đặt
tay — token ở máy lập trình không tự sang. Thiếu biến thì cửa trả **404**, không mở toang.

### 2. Cắm vào claude.ai

Settings → Connectors → **Add custom connector**, dán:

```
https://kinhlac.online/api/mcp/<MCP_TOKEN>
```

Không có bước đăng nhập nào: token nằm trong chính đường dẫn.

⚠️ **Đường dẫn CHÍNH LÀ mật khẩu.** Đừng dán nó vào chat, ảnh chụp màn hình hay issue. Lỡ
lộ thì đổi `MCP_TOKEN` rồi `docker compose up -d --build backend` — cửa cũ chết ngay.

### 3. Sáu công cụ, và ranh giới của chúng

| Công cụ | Làm gì |
|---|---|
| `nhat_ky_bot` | Các ca quét gần nhất, số lời phê chờ duyệt, số đã áp, trạng thái bộ luật |
| `loi_phe_cho_duyet` | Lời phê của lớp thầy thuốc + trích dẫn nguyên văn + bản sửa đề xuất |
| `nhom_loi_phan_mem` | Cụm lỗi trong tab Góp Ý & Lỗi, GOM THEO NGUYÊN NHÂN, kèm id cụm nặng nhất |
| `ho_so_loi` | Hồ sơ sửa lỗi đầy đủ của một cụm (stack, file liên quan, biểu đồ theo giờ) |
| `chay_quet` | Khởi động ca quét lớp 1 cả kho — chạy nền, không tốn tiền mô hình |
| `thu_tu_sua` | Chạy THỬ việc tự sửa hình thức: báo sẽ sửa gì, **không ghi** |

⚠️ **KHÔNG công cụ nào ghi vào kho nội dung.** Áp bản sửa vẫn phải qua `/app/tham-dinh`, nơi
bản gốc và bản sửa nằm cạnh nhau để người duyệt nhìn thấy. Ranh giới này là cố ý và nên giữ:
đây là đường mà một dịch vụ bên ngoài gọi vào qua URL công khai. Chạy ca sai thì tốn ít thời
gian máy; ghi sai vào 18.416 mục thì phải lần từng bản `revisions`.

### 4. Ba chỗ đã trả giá, đừng lặp

- **CORS miễn trừ riêng cho `/mcp/`** (`main.ts`). claude.ai gọi từ máy chủ của họ nên không
  có origin nào khai trước được; allowlist cứng sẽ ném lỗi và người dùng chỉ thấy "không kết
  nối được", còn lý do nằm trong log backend. Miễn trừ này hẹp: `credentials: false`, và chỉ
  đúng đường `/mcp/`. Phép kiểm: gọi `/tra-cuu/ten` với `Origin: https://evil.example.com`
  vẫn phải bị chặn.
- **`/.well-known/oauth-*` phải trả 404 THẬT** (`frontend/nginx.conf`). Máy khách MCP thăm dò
  đường đó trước khi kết nối, mà `try_files … /index.html` sẽ trả app shell kèm **mã 200** —
  máy khách nhận HTML rồi tưởng có OAuth. Cùng cái bẫy "đường sai ra trang chủ, mã 200" đã
  ghi trong CLAUDE.md, chỉ khác là nạn nhân lần này là máy.
- **Cửa không giữ trạng thái** (`sessionIdGenerator: undefined`). Bản có phiên phải giữ
  transport trong Map theo `mcp-session-id`, và Map đó chỉ đúng khi chạy MỘT container —
  cùng lý lẽ với `@Cron` và `sse.service`. Không trạng thái thì thêm container thứ hai cũng
  không hỏng.
