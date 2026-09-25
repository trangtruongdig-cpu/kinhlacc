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

echo "==> [1/6] Cảnh báo nếu chưa có swap (RAM thấp build dễ treo)"
if ! swapon --show | grep -q .; then
  echo "    ⚠️  CHƯA có swap! Nếu build bị treo, chạy 1 lần:  sudo bash setup-swap.sh"
fi

echo "==> [2/6] Lấy code mới nhất (git pull)"
git pull --ff-only

echo "==> [3/6] Build BACKEND (riêng, không trùng RAM với frontend)"
docker compose build backend

echo "==> [4/6] Build FRONTEND (riêng)"
docker compose build frontend

echo "==> [5/6] Khởi động lại các service"
docker compose up -d

echo "==> [6/6] Tối ưu đĩa tự động: xoá image cũ + cắt cache build (GIỮ ~3GB gần đây cho nhanh)"
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
