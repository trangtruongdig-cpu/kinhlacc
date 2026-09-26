#!/usr/bin/env bash
#
# deploy.sh — Cập nhật & triển khai trên VPS (RAM thấp, vd 2GB).
#
# Khác với `docker compose up -d --build` (build CẢ 2 image cùng lúc → đỉnh RAM gấp đôi → treo),
# script này build TỪNG image MỘT để đỉnh RAM thấp, và bật BuildKit để cache npm cho nhanh.
#
# Dùng:  bash deploy.sh
# (Lần đầu: git pull tay 1 lần để có file này, sau đó chỉ cần chạy lệnh trên.)
#
# ⚠️ SSH HAY RỚT khi build (VPS RAM thấp)? Chạy ở CHẾ ĐỘ NỀN để rớt SSH không cắt build:
#       nohup bash deploy.sh > deploy.log 2>&1 &
#       tail -f deploy.log          # xem tiến độ; Ctrl-C để thoát xem (build vẫn chạy tiếp)
#
set -euo pipefail
cd "$(dirname "$0")"

# Bật BuildKit → kích hoạt cache mount npm trong Dockerfile (xem frontend/backend Dockerfile).
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "==> [1/7] Cảnh báo nếu chưa có swap (RAM thấp build dễ treo)"
if ! swapon --show | grep -q .; then
  echo "    ⚠️  CHƯA có swap! Nếu build bị treo, chạy 1 lần:  sudo bash setup-swap.sh"
fi

echo "==> [2/7] Lấy code mới nhất (git pull)"
git pull --ff-only

echo "==> [3/7] Build BACKEND (riêng, không trùng RAM với frontend)"
docker compose build backend

echo "==> [4/7] Build CMS (riêng)"
# cms/.env KHÔNG nằm trong git (chứa mật khẩu DB riêng của CMS). Thiếu nó thì container
# khởi động rồi chết vòng tròn — chặn ngay tại đây cho dễ hiểu hơn là để nó tự sập.
#
# ⚠️ Từ 26/09/2026 tệp này còn là SECRET của bước build FRONTEND ([5/7]): seo-cms.mjs và
# nguon-cms.mjs cần nó để đọc kho `kinhlac_cms` (ghi đè SEO + chữ của mục nguồn). Docker
# Compose KHÔNG cho secret tuỳ chọn, nên thiếu tệp là build frontend gãy cứng. Chốt này
# đứng TRƯỚC [5/7] nên vẫn báo lỗi dễ hiểu — đừng đổi thứ tự các bước.
if [ ! -f ./cms/.env ]; then
  echo "    ✗ THIẾU ./cms/.env — CMS không nối được database, VÀ build frontend sẽ gãy."
  echo "      Tạo file đó trên VPS với DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME"
  echo "      (hoặc PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE — cả hai lối đặt tên đều nhận)"
  echo "      và EMDASH_ENCRYPTION_KEY, rồi chạy lại. (Xem DEPLOYMENT.md)"
  exit 1
fi
docker compose build cms

echo "==> [5/7] Build FRONTEND (riêng)"
docker compose build frontend

# nginx.conf sai cú pháp thì container KHÔNG lên nổi, và lúc đó cả site chết chứ không chỉ
# một tính năng. Kiểm ngay trên image vừa dựng, trước khi thay container đang chạy.
#
# ⚠️ Phải chạy bằng `docker compose run`, KHÔNG phải `docker run` trần. `docker run` không
# gắn container tạm vào network kinhlac_net, nên trong đó cái tên "backend"/"cms" không tra
# ra được và nginx chết ngay ở khối upstream với "host not found in upstream". Đó là lỗi của
# PHÉP KIỂM chứ không phải của file — ngày 25/09/2026 nó chặn đứng một lần deploy trong khi
# nginx.conf vẫn đang chạy tốt ngoài production.
#
# Lỗi tra tên KHÔNG được coi là sai cú pháp: nginx chỉ tới được bước phân giải tên sau khi đã
# đọc trọn file, nên thấy nó nghĩa là cú pháp qua rồi. Lúc stack đang tắt (deploy lần đầu)
# thì luôn gặp nhánh này.
echo "    · kiểm cú pháp nginx.conf"
ket_qua_nginx="$(docker compose run --rm --no-deps --entrypoint nginx frontend -t 2>&1 || true)"
echo "$ket_qua_nginx" | tail -2
if echo "$ket_qua_nginx" | grep -q "syntax is ok"; then
  echo "    ✓ nginx.conf đúng cú pháp."
elif echo "$ket_qua_nginx" | grep -q "host not found in upstream"; then
  echo "    ⚠ chưa kết luận được: không tra được tên service (stack đang tắt?). Cú pháp không sai — đi tiếp."
else
  echo "    ✗ nginx.conf SAI CÚ PHÁP — dừng, KHÔNG thay container đang chạy."
  exit 1
fi

echo "==> [6/7] Khởi động lại các service"
docker compose up -d

echo "==> [7/7] Tối ưu đĩa tự động: xoá image cũ + cắt cache build (GIỮ ~3GB gần đây cho nhanh)"
# Xoá mọi image KHÔNG còn container nào dùng (các bản build cũ) — an toàn, stack đang chạy được giữ.
docker image prune -af || true
# Cắt cache build BuildKit, GIỮ tối đa 1GB gần nhất.
# Trước để 3GB: cache phình tới 3,21GB nên mỗi lần deploy gần như KHÔNG cắt gì, đĩa tụt còn
# 3,2G/20G (đo 25/09/2026). 1GB vẫn đủ giữ lớp npm ci cho lần build sau nhanh.
docker builder prune -f --max-storage=1GB 2>/dev/null \
  || docker builder prune -f --keep-storage=1GB 2>/dev/null \
  || docker builder prune -f --filter "until=72h" || true

# dockerd phình dần sau các lần build lớn (đo được 980MB RSS = 49,6% RAM của VPS 2GB) và KHÔNG
# tự trả lại. Cảnh báo khi vượt ngưỡng để biết lúc nào cần `systemctl restart docker` — không tự
# restart vì việc đó làm gián đoạn site khoảng một phút, phải do người quyết.
dockerd_mb=$(ps -o rss= -C dockerd 2>/dev/null | awk '{s+=$1} END {print int(s/1024)}' || true) || true
if [ -n "${dockerd_mb:-}" ] && [ "${dockerd_mb:-0}" -gt 500 ]; then
  echo "    ⚠️  dockerd đang giữ ${dockerd_mb}MB RAM. Khi rảnh, chạy: systemctl restart docker"
fi

echo ""
echo "==> ✅ Xong. Đĩa còn trống:"
df -h / | awk 'NR==1 || /\/$/'
echo ""
echo "==> Trạng thái container:"
docker compose ps
