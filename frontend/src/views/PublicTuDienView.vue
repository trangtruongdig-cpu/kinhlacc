<script setup lang="ts">
/**
 * PublicTuDienView — Trang "Từ Điển" (thư viện tra cứu Đông Y) CÔNG KHAI, MỞ ĐẦY ĐỦ cho khách.
 *
 * Dùng đúng TuDienView như trong app (toàn bộ dữ liệu là file tĩnh, KHÔNG cần đăng nhập) nên khách
 * trải nghiệm trọn vẹn cả 5 mục: Huyệt Vị · Châm Cứu, Lý Thuyết Kinh Mạch, Châm Cứu Trị Bệnh,
 * Bệnh Học và Thư Mục Nguồn. Khác trang trong app: nút "xem huyệt trong 3D" trỏ sang trang 3D công
 * khai /xem-3d (qua prop map-route-name) để khách ở lại ngữ cảnh công khai, không bị đòi đăng nhập.
 */
import TuDienView from '@/views/TuDienView.vue'
import PublicTopBar from '@/components/PublicTopBar.vue'
</script>

<template>
  <div class="pub-td">
    <PublicTopBar title="Từ Điển · Thư Viện Đông Y" badge="Mở Đầy Đủ" />
    <div class="pub-td-body">
      <TuDienView map-route-name="xem-3d" />
    </div>
  </div>
</template>

<style scoped>
.pub-td {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-app);
}
.pub-td-body {
  flex: 1 1 auto;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-5) var(--space-6);
}
@media (max-width: 768px) {
  .pub-td-body {
    padding: var(--space-3);
  }
}
</style>
