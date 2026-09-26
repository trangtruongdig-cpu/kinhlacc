# syntax=docker/dockerfile:1.7

############################
# 1. Build SPA bằng Vite
############################
FROM node:22-alpine AS builder
WORKDIR /app

# Vite bake biến VITE_* vào bundle lúc build => phải truyền qua build arg.
# Mặc định "/api" để nginx của frontend reverse-proxy sang backend (same-origin, không cần CORS).
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
# --mount=type=cache: giữ lại kho gói đã tải (~/.npm) giữa các lần build → `npm ci`
# các lần sau KHỎI tải lại từ mạng → nhanh hơn nhiều, nhẹ I/O. Cần BuildKit (đã bật trong deploy.sh).
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .
# Dùng CHUNG bộ bước với `npm run build` (blog:pre + blog:post) → 1 nguồn sự thật, không lệch.
# KHÁC biệt DUY NHẤT: ở đây gọi `build-only` (chỉ vite) thay vì `npm run build` (run-p type-check + vite).
# Lý do bỏ type-check: trên VPS RAM thấp (<= 2GB) chạy vue-tsc song song sẽ OOM kill (exit 137);
# type-check là việc của dev/CI, không phải bước deploy.
#   blog:pre  = van YMYL (--gate: bài auto chưa duyệt -> noindex) + sinh sitemap (vào public/ TRƯỚC vite)
#   build-only= vite build (SPA -> dist/)
#   blog:post = mini-prerender meta SEO tĩnh + build-blog (Markdown -> HTML tĩnh), đều cần dist/ đã có
# Biến DB nạp qua BuildKit SECRET, KHÔNG qua ARG: ARG bị ghi vĩnh viễn vào lịch sử image,
# ai đọc được image là đọc được mật khẩu Aiven + JWT_SECRET. Secret chỉ sống trong RUN này.
#
# CHỈ lọc các dòng DB_* rồi mới nạp: backend/.env còn chứa CA_CERTIFICATE (PEM trải 25 dòng)
# và FIREBASE_SERVICE_ACCOUNT — source cả file thì shell cố chạy dòng base64 như lệnh → vỡ build.
#
# CA_CERTIFICATE (PEM 26 dòng) KHÔNG nạp qua env được, nên trích riêng ra /tmp/aiven-ca.pem
# bằng util.parseEnv của Node rồi trỏ DB_CA_CERT_FILE vào — nhờ vậy ba bước prerender XÁC MINH
# được danh tính máy chủ Aiven (rejectUnauthorized: true) thay vì chỉ mã hoá. Xem db-ssl.mjs.
#
# Thiếu secret (vd ai đó chạy `docker build` tay) → vẫn build được, chỉ là ba bước prerender
# dược liệu / cổ phương / nhóm dược lý tự bỏ qua như trước. Không làm gãy deploy.
# Secret THỨ HAI: cms/.env — kho `kinhlac_cms` (khác `defaultdb` của app, hai kho tách biệt).
# seo-cms.mjs (ghi đè SEO người biên tập gõ) và nguon-cms.mjs (chữ của mục nguồn) cần nó.
# ⚠️ Thiếu secret này thì build vẫn XANH, chỉ in cảnh báo, rồi trang nguồn lặng lẽ dùng chữ
# của app và ghi đè SEO không có tác dụng — đúng kiểu "deploy thành công mà tính năng không
# chạy". Vì vậy phải truyền, đừng bỏ.
# CA thì DÙNG LẠI /tmp/aiven-ca.pem trích từ db_env: đã đo, CA của CMS giống HỆT
# CA_CERTIFICATE của backend (cùng 1.526 ký tự) vì cùng một cụm Aiven.
RUN --mount=type=secret,id=db_env \
    --mount=type=secret,id=cms_env \
    if [ -f /run/secrets/cms_env ]; then export CMS_ENV_FILE=/run/secrets/cms_env; fi; \
    if [ -f /run/secrets/db_env ]; then \
      grep -E '^(DB_HOST|DB_PORT|DB_USER|DB_PASSWORD|DB_NAME|DB_SSL)=' /run/secrets/db_env > /tmp/db.env || true; \
      set -a; . /tmp/db.env; set +a; rm -f /tmp/db.env; \
      node -e 'const fs=require("node:fs"),u=require("node:util");const e=u.parseEnv(fs.readFileSync("/run/secrets/db_env","utf8"));if(e.CA_CERTIFICATE)fs.writeFileSync("/tmp/aiven-ca.pem",e.CA_CERTIFICATE)' || true; \
      [ -f /tmp/aiven-ca.pem ] && export DB_CA_CERT_FILE=/tmp/aiven-ca.pem CMS_CA_CERT_FILE=/tmp/aiven-ca.pem || true; \
    fi; \
    npm run blog:pre && npm run build-only && npm run blog:post; \
    rc=$?; rm -f /tmp/aiven-ca.pem; exit $rc

# Nén sẵn asset tĩnh (.gz) để nginx "gzip_static on" phục vụ trực tiếp — khỏi nén lại mỗi request.
# Bỏ qua file < 1KB (nén không lợi). Dùng gzip -c (khỏi cần -k) cho tương thích busybox alpine.
RUN find dist -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.css' -o -name '*.json' -o -name '*.svg' -o -name '*.xml' \) -size +1k \
    | while read -r f; do gzip -9 -c "$f" > "$f.gz"; done

############################
# 2. Phục vụ static bằng nginx
############################
FROM nginx:1.27-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx","-g","daemon off;"]
