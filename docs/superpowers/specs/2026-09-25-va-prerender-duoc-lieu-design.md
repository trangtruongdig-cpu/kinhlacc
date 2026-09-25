# Vá bước prerender dược liệu / cổ phương / nhóm dược lý

Ngày chốt: 25/09/2026. Trạng thái: **đã dựng xong, chờ deploy để nghiệm thu trên site thật.**

## Triệu chứng

Mỗi lần `bash deploy.sh`, log build in ra các dòng "bỏ qua":

```
⚠ build-duoc-lieu: không nạp được module pg (...) — BỎ QUA prerender dược liệu (build vẫn tiếp tục).
⚠ build-phuong: ... — BỎ QUA prerender cổ phương (build vẫn tiếp tục).
⚠ build-nhom-duoc-ly: ... — BỎ QUA (build vẫn tiếp tục).
```

## Chẩn đoán — hai cửa chặn nối tiếp

Vá một cửa thì vẫn đứng nguyên.

**Cửa 1 — thiếu module `pg`.** `pg` không có trong `frontend/package.json`. Script có đường
lui là mượn `backend/node_modules/pg`, nhưng `docker-compose.yml` đặt `context: ./frontend`
nên trong container build không tồn tại thư mục `backend/`. Chặn tại đây, trước khi kịp đọc
biến môi trường — nên thông báo thật sự in ra là "không nạp được module pg", không phải
"thiếu cấu hình DB".

**Cửa 2 — thiếu biến DB.** `frontend/Dockerfile` chỉ truyền `ARG VITE_API_URL`.

`build-dict.mjs` vẫn chạy được vì nó đọc `dict-data.mjs` trong repo, không cần DB. Đó là lý
do từ điển huyệt sống mà dược liệu thì không.

## Quy mô thật (đo bằng cách chạy thử script với DB thật)

| | Số trang dựng ra |
|---|---|
| Cổ phương (bài thuốc) | **13.942** |
| Dược liệu | **1.045** |
| Nhóm dược lý | 67 |
| **Tổng** | **15.054 trang · 124MB** |

Trước khi vá, sitemap chỉ có 911 URL và **không một URL nào** thuộc ba nhóm này.

## Quyết định thêm van noindex (phát sinh từ phép thử)

Chạy thử lộ ra rằng bật thẳng cả 15.054 trang là rủi ro index bloat trên site YMYL. Đo tiếp
thì thấy hai loại trang mỏng theo hai kiểu khác nhau, nên dùng hai thước khác nhau.

### Bài thuốc — luật D1

Đo theo **chữ người đọc thấy** (văn xuôi + tên vị + liều, mirror hàm `stub()`), KHÔNG tính
cú pháp JSON của `thanh_phan` — tính nhầm vào thì mỗi bài được cộng khống ~570 ký tự.

| | |
|---|---|
| Trung vị chữ nhìn thấy | 236 ký tự (p25 173 · p75 340 · p90 541) |
| Số vị mỗi bài — trung vị | 19 vị (chỉ 0,4% dưới 3 vị) |
| Có `tac_dung` / `cach_dung` / `ghi_chu` | 99,8% / 68,8% / 31,8% |
| Trùng lặp thật (cả tập vị lẫn thân bài) | chỉ 0,8% — **không phải vấn đề** |

> **Luật D1**: `≥ 3 vị` VÀ `có tác dụng` VÀ `chữ nhìn thấy ≥ 250 ký tự`
> → **5.983 index / 7.959 noindex**

Hằng số ở `MIN_CHU_HIEN` và `MIN_SO_VI` trong `build-phuong.mjs`. Nới xuống 150 sẽ thành
11.057 bài (79,3%); bỏ hẳn ngưỡng dài là 12.926 bài (92,7%).

### Dược liệu — luật G

Kho mới biên soạn được một phần năm:

| | |
|---|---|
| Có văn xuôi biên soạn | **205 vị (19,6%)** — rất dày, p90 ~7.957 ký tự |
| Rỗng văn xuôi | 840 vị (80,4%) — chỉ có tên + tính + vị + quy kinh |
| Trong đó không bài thuốc nào dùng tới | 437 vị |
| `lieu_dung` có dữ liệu | **0 / 1.045** |
| Ảnh trong `vi_thuoc_anh` | **0** |

> **Luật G**: chỉ index vị **đã có người biên soạn** (một trong 9 trường văn xuôi có nội dung)
> → **205 index / 840 noindex**

Mở dần khi kho nội dung đầy lên. Đây là việc biên soạn, không phải việc code.

### Nhóm dược lý

Giữ nguyên van sẵn có (`herbs.length >= 3`) → 62 URL.

**Trang noindex vẫn được dựng và vẫn xem được** qua liên kết nội bộ — chỉ là không mời bot vào.

## Bản vá đã dựng

**1. `frontend/scripts/build-phuong.mjs`** — thêm `MIN_CHU_HIEN`, `MIN_SO_VI`, `duDay()`;
`robots` đổi theo điều kiện; chỉ đẩy URL đã index vào sitemap; báo cáo số noindex.

**2. `frontend/scripts/build-duoc-lieu.mjs`** — thêm `daBienSoan()` trên 9 trường văn xuôi,
ba thay đổi tương tự.

**3. `frontend/package.json`** — thêm `pg@^8.20.0` vào `devDependencies` (khớp bản backend
đang dùng). `npm ci` trong Dockerfile không kèm `--omit=dev` nên nó được cài.

**4. `frontend/Dockerfile`** — nạp biến DB qua **BuildKit secret**, không qua `ARG`:

```dockerfile
RUN --mount=type=secret,id=db_env \
    if [ -f /run/secrets/db_env ]; then \
      grep -E '^(DB_HOST|DB_PORT|DB_USER|DB_PASSWORD|DB_NAME|DB_SSL)=' /run/secrets/db_env > /tmp/db.env || true; \
      set -a; . /tmp/db.env; set +a; rm -f /tmp/db.env; \
    fi; \
    npm run blog:pre && npm run build-only && npm run blog:post
```

Hai điều bắt buộc, cả hai đều do đo mà biết:

- **Không dùng `ARG`** — giá trị bị ghi vĩnh viễn vào lịch sử image cùng mật khẩu Aiven.
- **Phải lọc `DB_*` trước khi nạp** — `backend/.env` chứa `CA_CERTIFICATE` là PEM **trải 25
  dòng thật**; source cả file thì shell cố chạy dòng base64 như lệnh và vỡ build. (Đã kiểm:
  cả 5 giá trị `DB_*` đều không có khoảng trắng, nháy hay `$`, nên nạp an toàn.)

Thiếu secret → vẫn build được, chỉ bỏ qua ba bước prerender như cũ.

**5. `docker-compose.yml`** — `services.frontend.build.secrets: [db_env]` và
`secrets.db_env.file: ./backend/.env`. VPS chạy **Docker Compose v2.35.1 / Docker 28.1.1**
nên `build.secrets` được hỗ trợ; nhánh dự phòng `docker build --secret` trong `deploy.sh`
không cần tới.

**6. `deploy.sh`** — `--keep-storage` đã bị Docker 28 cho nghỉ, đổi sang `--max-storage` với
hai đường lui.

> ⚠️ `backend/.env` dùng `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` — **không có
> `DATABASE_URL`**. Mọi chỗ viết tài liệu hay script mới phải theo bộ tên này.

## Nghiệm thu

### Đã chạy trên máy local, đọc bằng chính file sinh ra

```
✓ build-duoc-lieu:  1.045 trang (840 noindex: chưa biên soạn)          +   205 URL
✓ build-phuong:    13.942 trang (7.959 noindex: <3 vị / thiếu tác dụng / <250 ký tự) + 5.983 URL
✓ build-nhom-duoc-ly: 1 hub + 20 nhóm lớn + 46 nhóm nhỏ (5 noindex)    +    62 URL
→ sitemap: 6.250 URL
```

Đếm lại bằng `grep` trên meta `robots` trong HTML: bài thuốc 5.983 index / 7.959 noindex;
dược liệu 205 / 840. Khớp tuyệt đối với sitemap.

### Còn phải nghiệm thu trên site thật sau khi deploy

```bash
# Trước: 1 (chỉ trang danh sách). Sau: 205.
curl -s https://kinhlac.online/sitemap.xml | grep -c "/duoc-lieu/"

# Trước: 0. Sau: 5.983.
curl -s https://kinhlac.online/sitemap.xml | grep -c "/bai-thuoc/"

# Một trang bất kỳ: trước ~6KB (vỏ SPA), sau phải có nội dung thật.
curl -s https://kinhlac.online/sitemap.xml | grep -oE "https://[^<]*/bai-thuoc/[^<]+" | head -1
```

Và log deploy không còn dòng `⚠ ... BỎ QUA prerender`.

## Ảnh hưởng phụ phải theo dõi

- **Image phình ~124MB** và **15.054 file thêm vào**. Đĩa VPS còn 4,5G/20G (78% đã dùng).
  `deploy.sh` đã có `docker image prune -af` nên bản cũ được dọn, nhưng nếu đĩa căng thì đây
  là chỗ đầu tiên phải nhìn.
- **Build lâu hơn** — dựng 15.054 trang cộng bước gzip.

## Bổ sung sau khi deploy: xác minh chứng chỉ máy chủ

Ba script prerender vốn nối Postgres với `rejectUnauthorized: false` — kết nối được **mã hoá**
nhưng **không xác minh danh tính máy chủ**, nên kẻ chen giữa mạo danh Aiven sẽ không bị phát hiện.

Đã sửa: `frontend/scripts/db-ssl.mjs` là nguồn sự thật duy nhất cho cả ba script (tránh ba bản
sao lệch nhau). CA lấy theo thứ tự `CA_CERTIFICATE` (máy dev, qua dotenv) → `DB_CA_CERT_FILE`
(trong Docker). Không có CA thì cảnh báo và lui về mức cũ, không làm gãy build.

`CA_CERTIFICATE` là PEM **26 dòng** nên không nạp qua env được. Dockerfile trích nó ra
`/tmp/aiven-ca.pem` bằng `util.parseEnv` của Node rồi trỏ `DB_CA_CERT_FILE` vào, xoá sau khi build.

Nghiệm thu — phép thử đối kháng, không chỉ thử đường sáng:

| Thử | Kết quả |
|---|---|
| Cert thật của Aiven | ✓ kết nối, cả ba script ra đúng 6.250 URL như trước |
| Cert giả tự ký (`CN=ke-mao-danh`) | **bị từ chối**: `self-signed certificate in certificate chain` |
| `rejectUnauthorized: true` không kèm CA | lỗi — Aiven ký bằng CA riêng nên bắt buộc phải có CA |

⚠️ **Rủi ro đã biết, ghi sổ nợ.** Khi không nối được DB (cert sai, mạng hỏng, mật khẩu đổi),
ba script **âm thầm bỏ qua và build vẫn báo thành công** — đúng cơ chế đã giấu lỗi này suốt thời
gian qua. Cách phát hiện hiện nay là đếm URL trong sitemap sau mỗi lần deploy; nên có phép kiểm
tự động chặn deploy khi sitemap tụt đột ngột.

## Ngoài phạm vi

Nội dung dược liệu sửa trong app vẫn phải chờ lần deploy kế tiếp mới lên trang. Muốn tức
thì thì mở `try_files → @render` cho `/duoc-lieu/` giống `/blog/`. Ghi sổ nợ, không làm lần này.
