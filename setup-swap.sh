#!/usr/bin/env bash
#
# setup-swap.sh — Tạo swap 4GB MỘT LẦN trên VPS để build không treo RAM.
#
# Vì sao cần: VPS 2GB RAM khi build (nest/vite) có thể xài quá RAM thật. KHÔNG có swap thì
# Linux đơ cứng hoặc giết tiến trình (exit 137). Có swap thì chỉ chậm lại rồi vẫn xong.
#
# Dùng (chạy bằng quyền root):  sudo bash setup-swap.sh
#
set -euo pipefail

SWAPFILE=/swapfile
SIZE=4G

if [ "$(id -u)" -ne 0 ]; then
  echo "Cần chạy bằng root:  sudo bash setup-swap.sh" >&2
  exit 1
fi

if swapon --show | grep -q "$SWAPFILE"; then
  echo "Swap đã bật sẵn rồi:"
  swapon --show
  exit 0
fi

echo "==> Tạo swapfile $SIZE tại $SWAPFILE"
fallocate -l "$SIZE" "$SWAPFILE" || dd if=/dev/zero of="$SWAPFILE" bs=1M count=4096
chmod 600 "$SWAPFILE"
mkswap "$SWAPFILE"
swapon "$SWAPFILE"

# Giữ swap sau khi reboot
if ! grep -q "$SWAPFILE" /etc/fstab; then
  echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
  echo "==> Đã ghi vào /etc/fstab (swap tự bật lại sau reboot)."
fi

# Giảm 'swappiness' để ưu tiên RAM thật, chỉ tràn sang swap khi cần (đỡ chậm lúc bình thường).
sysctl -w vm.swappiness=10 >/dev/null
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
  echo "vm.swappiness=10" >> /etc/sysctl.conf
fi

echo ""
echo "==> ✅ Xong. Tình trạng bộ nhớ:"
free -h
swapon --show
