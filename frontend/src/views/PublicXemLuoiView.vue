<script setup lang="ts">
/**
 * PublicXemLuoiView — Atlas thiệt chẩn CÔNG KHAI (23 mẫu, ảnh thật).
 *
 * Tách ra thành trang riêng khi thư viện từ điển chuyển sang CMS: Xem Lưỡi CỐ Ý ở lại
 * app (ảnh thật + đại diện ML, không phải nội dung biên tập được), nhưng trước đây nó
 * nằm trong tab của /thu-vien — mà /thu-vien nay do CMS dựng. Không tách thì nút
 * "Thiệt Chẩn · Xem Lưỡi" ở trang chủ trỏ vào chỗ không còn tồn tại.
 */
import PublicTopBar from '@/components/PublicTopBar.vue'
import TongueAtlasPanel from '@/components/TongueAtlasPanel.vue'
</script>

<template>
  <div class="pub-luoi">
    <PublicTopBar title="Thiệt Chẩn · Xem Lưỡi" badge="Atlas" />
    <div class="pub-luoi-body">
      <TongueAtlasPanel />
    </div>
  </div>
</template>

<style scoped>
.pub-luoi { min-height: 100vh; background: var(--bg, #fdfbf7); }
.pub-luoi-body { max-width: 1200px; margin: 0 auto; padding: 1rem; }
</style>
