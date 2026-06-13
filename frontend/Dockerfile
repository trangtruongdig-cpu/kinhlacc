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
RUN npm run blog:pre && npm run build-only && npm run blog:post

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
