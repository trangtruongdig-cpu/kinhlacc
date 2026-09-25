# syntax=docker/dockerfile:1.7
#
# CMS (EmDash trên Astro). Khác frontend ở chỗ đây là tiến trình Node SỐNG, không phải
# file tĩnh: nó render từ Postgres mỗi request, nên không có bước "build ra HTML".

############################
# 1. Dựng
############################
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .
# Bước dựng KHÔNG cần DB (đã đo: build xong trong 14s với env DB rỗng sạch).
# Chứng chỉ Aiven được NHÚNG vào bundle ở bước này — đã kiểm: dist/server/chunks/config_*.mjs
# chứa BEGIN CERTIFICATE, và runtime không còn đọc aiven-ca.pem nữa. Đổi chứng chỉ thì
# phải dựng lại image (chứng chỉ hiện tại hạn tới 05/2035).
RUN npm run build

############################
# 2. Chạy
############################
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --no-fund
COPY --from=builder /app/dist ./dist

# Ảnh người dùng tải lên. Gắn volume vào đây để không mất qua mỗi lần deploy.
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

EXPOSE 4321
# Chỉ xác nhận tiến trình Astro còn sống. KHÔNG chạm DB: nếu Aiven chập chờn mà healthcheck
# fail thì Docker sẽ restart vòng tròn, làm hỏng nặng hơn là để nó trả lỗi cho từng request.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4321/_emdash/admin/login >/dev/null 2>&1 || exit 1

CMD ["node", "./dist/server/entry.mjs"]
