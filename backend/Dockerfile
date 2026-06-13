# syntax=docker/dockerfile:1.7

############################
# 1. Cài deps (bao gồm dev) để build
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
# nest build (tsc) ngốn RAM → trên VPS ít RAM, V8 tự abort "heap out of memory" (exit 134).
# Nới trần heap để tsc đủ chỗ. LƯU Ý: nếu VPS RAM thấp (≤1GB) phải BẬT SWAP (xem DEPLOYMENT.md)
# để backing, nếu không OS sẽ giết tiến trình (exit 137) dù đã nới trần.
RUN NODE_OPTIONS=--max-old-space-size=2048 npm run build \
 && npm prune --omit=dev

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

COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules  ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist          ./dist

USER nodejs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${APP_PORT}/" >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","dist/main.js"]
