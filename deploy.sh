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

echo "==> [6/6] Dọn image cũ để giải phóng đĩa"
docker image prune -f

echo ""
echo "==> ✅ Xong. Trạng thái container:"
docker compose ps
