#!/usr/bin/env bash
#
# rotate-jwt-secret.sh — Đổi JWT_SECRET trên VPS rồi khởi động lại backend.
#
# VÌ SAO CẦN: khoá cũ ('trangtd', 7 ký tự) từng bị commit thẳng vào repo public qua
# backend/test-token.js, kèm sẵn đoạn ký token admin. File đó đã xoá (commit d2fbcd0)
# nhưng lịch sử git vẫn còn — nên phải coi khoá cũ là ĐÃ LỘ và bắt buộc thay.
#
# Dùng:  bash rotate-jwt-secret.sh
#
# ⚠️ SAU KHI CHẠY, MỌI PHIÊN ĐĂNG NHẬP ĐỀU BỊ HUỶ — cả nhân viên lẫn bệnh nhân phải
#    đăng nhập lại. Đó là dấu hiệu nó chạy ĐÚNG, không phải lỗi. Nên chạy ngoài giờ khám.
#
# Chạy lại được nhiều lần: mỗi lần sinh một khoá mới và sao lưu file .env cũ.
#
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE="backend/.env"

echo "==> [1/5] Kiểm tra môi trường"
[ -f "$ENV_FILE" ] || { echo "    ✗ Không thấy $ENV_FILE — chạy script này ở thư mục gốc dự án trên VPS."; exit 1; }
command -v openssl >/dev/null || { echo "    ✗ Thiếu openssl."; exit 1; }
command -v docker  >/dev/null || { echo "    ✗ Thiếu docker."; exit 1; }
grep -q '^JWT_SECRET=' "$ENV_FILE" || { echo "    ✗ $ENV_FILE không có dòng JWT_SECRET."; exit 1; }

OLD_LEN=$(grep '^JWT_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\n' | wc -c | tr -d ' ')
echo "    Khoá hiện tại dài $OLD_LEN ký tự."

echo "==> [2/5] Sao lưu $ENV_FILE"
BACKUP="${ENV_FILE}.bak.$(date +%Y%m%d-%H%M%S)"
cp "$ENV_FILE" "$BACKUP"
echo "    Đã lưu: $BACKUP"

echo "==> [3/5] Sinh khoá mới (48 byte ngẫu nhiên, mã base64url)"
# tr '+/' '-_' đổi sang base64url: bỏ '+' và '/' để không phá cú pháp sed bên dưới,
# cũng không gây rắc rối khi khoá bị đưa vào URL hay biến môi trường.
NEW_SECRET=$(openssl rand -base64 48 | tr -d '\n' | tr '+/' '-_')
[ ${#NEW_SECRET} -ge 60 ] || { echo "    ✗ Khoá sinh ra quá ngắn (${#NEW_SECRET}) — dừng."; exit 1; }

# KHÔNG dùng `sed -i`: trên Linux (GNU) nó sửa tại chỗ, nhưng trên macOS (BSD) `-i` đòi
# tham số hậu tố nên cùng một dòng lệnh sẽ hỏng. Ghi ra file tạm rồi đổ ngược lại bằng `cat`
# để giữ nguyên quyền và chủ sở hữu của .env gốc.
TMP="${ENV_FILE}.tmp.$$"
sed "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|" "$ENV_FILE" > "$TMP"
cat "$TMP" > "$ENV_FILE"
rm -f "$TMP"

echo "==> [4/5] Kiểm chứng TRƯỚC khi khởi động lại"
COUNT=$(grep -c '^JWT_SECRET=' "$ENV_FILE")
if [ "$COUNT" != "1" ]; then
  echo "    ✗ Có $COUNT dòng JWT_SECRET (phải đúng 1). Hoàn nguyên."
  cp "$BACKUP" "$ENV_FILE"; exit 1
fi
if grep -q '^JWT_SECRET=trangtd$' "$ENV_FILE"; then
  echo "    ✗ Khoá cũ vẫn còn. Hoàn nguyên."
  cp "$BACKUP" "$ENV_FILE"; exit 1
fi
echo "    ✓ Đúng 1 dòng JWT_SECRET, dài ${#NEW_SECRET} ký tự, khác khoá cũ."

echo "==> [5/5] Khởi động lại backend"
docker compose up -d --force-recreate backend
sleep 5
docker compose ps backend

echo
echo "───────────────────────────────────────────────"
echo "✓ XONG. Mọi người cần đăng nhập lại (kể cả bạn)."
echo
echo "Nếu backend KHÔNG lên (cột STATUS không phải Up):"
echo "    docker compose logs --tail=50 backend"
echo "  Hoàn nguyên:"
echo "    cp $BACKUP $ENV_FILE && docker compose up -d --force-recreate backend"
echo "───────────────────────────────────────────────"
