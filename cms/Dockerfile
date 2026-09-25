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
# Healthcheck PHẢI chạm database, không chỉ kiểm tiến trình sống.
#
# Lý do đổi (25/09/2026): lần khởi động đầu trên VPS, hai kết nối cùng chạy migration một lúc
# nên một cái vấp "duplicate key ... pg_type_typname_nsp_index", rồi EmDash vào trạng thái
# "backing off after a recent migration failure" và KẸT VĨNH VIỄN — tiến trình vẫn sống, trang
# admin vẫn trả 200, nhưng mọi API trả 500 NOT_CONFIGURED. Healthcheck cũ chỉ kiểm tiến trình
# nên báo "healthy" trong khi CMS thật ra đã chết. Phải restart tay mới khỏi.
#
# /_emdash/api/media chạm DB: 401 (chưa đăng nhập) = khoẻ; 500 = chưa khởi tạo được.
# retries=5 với interval=30s nghĩa là phải hỏng liên tục 2,5 phút mới restart — đủ rộng để
# một cơn chập chờn của Aiven không gây restart vòng tròn, nhưng trạng thái kẹt thì tự thoát.
# Dùng node chứ không phải wget: với mã 401 thì wget thoát lỗi TRƯỚC khi kịp in header, nên
# không phân biệt được "401 = khoẻ, chỉ chưa đăng nhập" với "500 = chết". Node có sẵn trong image.
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:4321/_emdash/api/media').then(r=>{process.exit(r.status>=500?1:0)}).catch(()=>process.exit(1))" 

CMD ["node", "./dist/server/entry.mjs"]
