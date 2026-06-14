# syntax=docker/dockerfile:1.7

############################
# 1. Cài TOÀN BỘ deps (dev + prod) để build — CHỈ 1 lần npm ci
############################
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# --mount=type=cache: giữ kho gói (~/.npm) giữa các lần build → `npm ci` sau nhanh hơn. Cần BuildKit.
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

############################
# 2. Build TypeScript -> dist/
############################
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# nest build dùng SWC (xem nest-cli.json) → ~1s. Giới hạn heap thấp cho VPS RAM nhỏ (1GB).
RUN NODE_OPTIONS=--max-old-space-size=768 npm run build

############################
# 3. Lọc ra CHỈ production deps bằng npm prune — tái dùng node_modules đã có,
#    KHÔNG chạy npm ci lần 2 (tránh 2 tiến trình npm song song gây OOM trên VPS 1GB).
############################
FROM deps AS prod-deps
WORKDIR /app
RUN npm prune --omit=dev

############################
# 3. Runtime image (nhỏ, non-root)
############################
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    APP_PORT=3001

# tini để forward signal (SIGTERM) đúng cách + wget cho healthcheck
RUN apk add --no-cache tini wget \
 && addgroup -S nodejs \
 && adduser  -S nodejs -G nodejs

COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules  ./node_modules
COPY --from=builder  --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder  --chown=nodejs:nodejs /app/dist          ./dist

USER nodejs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${APP_PORT}/" >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","dist/main.js"]
