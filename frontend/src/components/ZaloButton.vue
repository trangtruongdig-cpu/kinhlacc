<script setup lang="ts">
/**
 * ZaloButton — CTA nổi "Kết nối nhanh qua Zalo" cho các trang CÔNG KHAI.
 * Hiện ở góc dưới-phải trên cả desktop lẫn mobile; mở thẳng Zalo của phòng khám.
 * Mount 1 lần ở App.vue, ẩn trên web app đã đăng nhập (xem điều kiện trong App.vue).
 */
// Link Zalo dùng số định dạng QUỐC TẾ (bỏ số 0 đầu, thêm mã VN 84) → zalo.me/84353247247.
// aria-label vẫn hiển thị số nội địa 0353 247 247 cho dễ nhận.
const ZALO_URL = 'https://zalo.me/84353247247'
</script>

<template>
  <a
    class="zalo-fab"
    :href="ZALO_URL"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Kết nối nhanh qua Zalo — 0353 247 247"
  >
    <span class="zalo-fab__pulse" aria-hidden="true"></span>
    <span class="zalo-fab__icon" aria-hidden="true">
      <!-- Bong bóng chat (nhận diện app nhắn tin) -->
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3C6.9 3 3 6.6 3 11c0 2.5 1.3 4.7 3.3 6.1-.1.9-.5 2.2-1.4 3.3-.2.3 0 .7.4.6 1.9-.4 3.3-1.1 4.2-1.7 1.1.3 2.3.5 3.5.5 5.1 0 9-3.6 9-8s-3.9-8-9-8z"
          fill="#fff"
        />
        <circle cx="8.5" cy="11" r="1.15" fill="#0068ff" />
        <circle cx="12" cy="11" r="1.15" fill="#0068ff" />
        <circle cx="15.5" cy="11" r="1.15" fill="#0068ff" />
      </svg>
    </span>
    <span class="zalo-fab__label">Chat Zalo</span>
  </a>
</template>

<style scoped>
.zalo-fab {
  position: fixed;
  right: clamp(14px, 3vw, 24px);
  bottom: clamp(16px, 4vw, 26px);
  z-index: 70; /* trên nội dung & nav (50), dưới modal/overlay của trang (≥80) */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 16px 0 12px;
  border-radius: var(--radius-full);
  background: #0068ff; /* Zalo blue */
  color: #fff;
  font-weight: 700;
  font-size: var(--font-size-sm);
  line-height: 1;
  box-shadow: 0 8px 22px rgba(0, 104, 255, 0.38), 0 2px 6px rgba(0, 0, 0, 0.12);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}
.zalo-fab:hover {
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(0, 104, 255, 0.46), 0 3px 8px rgba(0, 0, 0, 0.16);
}
.zalo-fab:active {
  transform: translateY(0);
}
.zalo-fab__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.zalo-fab__label {
  white-space: nowrap;
}

/* Vòng nhịp thu hút chú ý (dùng ::pulse span để không đụng layout) */
.zalo-fab__pulse {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #0068ff;
  z-index: -1;
  animation: zalo-pulse 2.4s ease-out infinite;
}
@keyframes zalo-pulse {
  0% {
    transform: scale(1);
    opacity: 0.55;
  }
  70%,
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

/* Chỉ máy SIÊU nhỏ (≤340px) mới gọn thành nút tròn; điện thoại thường vẫn giữ nhãn "Chat Zalo" (đúng chất CTA) */
@media (max-width: 340px) {
  .zalo-fab {
    height: 52px;
    width: 52px;
    padding: 0;
    justify-content: center;
  }
  .zalo-fab__label {
    display: none;
  }
}

/* Tôn trọng "giảm chuyển động": tắt vòng nhịp */
@media (prefers-reduced-motion: reduce) {
  .zalo-fab__pulse {
    animation: none;
    opacity: 0;
  }
}
</style>
