# Vá bước prerender dược liệu / cổ phương / nhóm dược lý

Ngày chốt: 25/09/2026. Trạng thái: đã duyệt hướng, chờ một dữ kiện (phiên bản Docker Compose trên VPS).

## Triệu chứng

Mỗi lần `bash deploy.sh`, log build in ra các dòng "bỏ qua":

```
⚠ build-duoc-lieu: không nạp được module pg (...) — BỎ QUA prerender dược liệu (build vẫn tiếp tục).
⚠ build-phuong: ... — BỎ QUA prerender cổ phương (build vẫn tiếp tục).
⚠ build-nhom-duoc-ly: ... — BỎ QUA (build vẫn tiếp tục).
```

## Chẩn đoán (đã kiểm chứng, không phải suy đoán)

Có **hai** cửa chặn nối tiếp, vá một cửa thì vẫn đứng nguyên:

**Cửa 1 — thiếu module `pg`.** `pg` không có trong `frontend/package.json` (cả
`dependencies` lẫn `devDependencies`). Script có đường lui là mượn
`backend/node_modules/pg`, nhưng `docker-compose.yml` đặt `context: ./frontend` nên
trong container build không hề tồn tại thư mục `backend/`. Chặn tại đây, trước khi kịp
đọc biến môi trường.

**Cửa 2 — thiếu biến DB.** `frontend/Dockerfile` chỉ truyền `ARG VITE_API_URL`. Script
kiểm `DATABASE_URL || POSTGRES_URL || DB_HOST || POSTGRES_HOST`, không thấy gì thì thoát sớm.

`build-dict.mjs` vẫn chạy được vì nó đọc `dict-data.mjs` — file nằm sẵn trong repo,
không cần DB. Đó là lý do từ điển huyệt sống mà dược liệu thì không.

## Thiệt hại đo được trên site đang chạy

| Phép đo | Kết quả |
|---|---|
| Sitemap tổng | 911 URL |
| Huyệt / châm cứu trị bệnh / bệnh học / kinh | 662 / 101 / 101 / 21 |
| Dược liệu chi tiết | **0** (chỉ 1 URL `/duoc-lieu/` là trang danh sách) |
| Cổ phương, nhóm dược lý | **0** |
| `/huyet/hop-coc/` | 34.864 byte — trang tĩnh thật |
| `/duoc-lieu/` | 6.157 byte — vỏ SPA, gần như rỗng với bot |

Toàn bộ mảng dược liệu, cổ phương và nhóm dược lý chưa từng lên Google.

## Bản vá

**1. `frontend/package.json`** — thêm `pg` vào `devDependencies`. Script đã ưu tiên tìm
`pg` của frontend trước khi mượn của backend, nên chỉ cần có mặt. Dockerfile chạy
`npm ci` không kèm `--omit=dev` nên devDependencies được cài.

**2. Nạp biến DB vào bước build bằng BuildKit secret, KHÔNG dùng `ARG`.**

`ARG`/`--build-arg` ghi giá trị vĩnh viễn vào lịch sử image — ai đọc được image là đọc
được `DATABASE_URL` của Aiven và `JWT_SECRET`. Secret mount chỉ tồn tại trong đúng lệnh
`RUN` đó.

```dockerfile
RUN --mount=type=secret,id=db_env \
    set -a && . /run/secrets/db_env && set +a && \
    npm run blog:pre && npm run build-only && npm run blog:post
```

**3. Đường dẫn secret tới `backend/.env`** — chọn theo phiên bản Docker Compose trên VPS:

- **Compose ≥ v2.5**: khai trong `docker-compose.yml`

  ```yaml
  services:
    frontend:
      build:
        secrets: [db_env]
  secrets:
    db_env:
      file: ./backend/.env
  ```

- **Compose cũ hơn**: `deploy.sh` gọi thẳng `docker build` cho frontend
  (`--secret id=db_env,src=./backend/.env -t kinhlac/frontend:latest ./frontend`) rồi
  `docker compose up -d` dùng image vừa build. `docker build --secret` có từ Docker
  18.09, không phụ thuộc compose.

**4. `deploy.sh`** — không đổi ở nhánh Compose ≥ v2.5 (BuildKit đã bật sẵn ở
`export DOCKER_BUILDKIT=1`). Nhánh còn lại sửa đúng bước `[4/6] Build FRONTEND`.

## Vì sao build kết nối được Aiven

Build chạy ngay trên VPS, cùng IP public đã nằm trong **Allowed IP addresses** của
Aiven. Nếu vì lý do nào đó không nối được, script giữ nguyên hành vi "BỎ QUA, build vẫn
tiếp tục" — không có nguy cơ làm gãy deploy.

## Phép nghiệm thu

Chạy sau khi deploy, đọc kết quả chứ không tin lời hứa:

```bash
# Trước khi vá: đúng 1 (chỉ trang danh sách). Sau khi vá: bằng số vị thuốc có slug trong DB.
curl -s https://kinhlac.online/sitemap.xml | grep -c "/duoc-lieu/"

# Lấy một URL bất kỳ trong sitemap rồi đo. Trước: ~6KB (vỏ SPA). Sau: cỡ trang huyệt (~30KB).
curl -s https://kinhlac.online/sitemap.xml | grep -oE "https://[^<]*/duoc-lieu/[^<]+" | head -1
```

Con số "bằng số vị thuốc có slug" phải đối chiếu với DB sau khi vá, không tự nhận là
đúng chỉ vì lớn hơn 1. Tương tự cho cổ phương và nhóm dược lý.

Và log deploy không còn dòng `⚠ ... BỎ QUA prerender`.

## Ngoài phạm vi

Bản vá này KHÔNG giải quyết: nội dung dược liệu sửa trong app vẫn phải chờ lần deploy
kế tiếp mới lên trang. Nếu cần tức thì, bước sau là mở `try_files → @render` cho
`/duoc-lieu/` giống cơ chế `/blog/` đang dùng. Ghi vào sổ nợ, không làm trong lần này.
