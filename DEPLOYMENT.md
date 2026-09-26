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

> **Lưu ý SSL với Aiven**: Aiven bắt buộc SSL. Mặc định `app.module.ts` đã set `ssl: { rejectUnauthorized: false }` khi `DB_SSL` không phải `false`, đủ để bắt tay. **Đừng** set `DB_SSL=false` trong `backend/.env` khi đang trỏ ra Aiven.
>
> **Tuỳ chọn nâng cao**: nếu muốn dùng connection string một dòng thay cho 5 biến `DB_*`, code cũng hỗ trợ `DATABASE_URL` (vd `postgres://avnadmin:xxx@host:23456/defaultdb?sslmode=require`). Khi đó các biến `DB_HOST/PORT/USER/PASSWORD/NAME` sẽ bị bỏ qua.

---

## 5. Chạy schema migrations vào Aiven

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
