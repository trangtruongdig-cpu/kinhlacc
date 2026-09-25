<script setup lang="ts">
/**
 * RaThuVienView — chốt chuyển khỏi SPA sang thư viện do CMS dựng.
 *
 * Thư viện (/thu-vien/, /huyet/, /kinh/, /benh-hoc/, /cham-cuu-tri-benh/, /duoc-lieu/,
 * /bai-thuoc/, /nguon/) không còn là route của SPA — nginx đưa thẳng sang CMS. Nhưng
 * điều hướng phía máy khách (RouterLink, router.push) không đi qua nginh, nên phải ép
 * một lần tải trang thật ở đây.
 */
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Dev không có nginx: tải lại cùng địa chỉ thì Vite trả index.html, SPA lại vào đúng
// chốt này → lặp vô tận. Nên ở dev trỏ thẳng sang cổng CMS.
const GOC = import.meta.env.DEV ? (import.meta.env.VITE_CMS_ORIGIN || 'http://localhost:4321') : ''

onMounted(() => {
  window.location.replace(GOC + route.fullPath)
})
</script>

<template>
  <div class="ra-tv">Đang mở thư viện…</div>
</template>

<style scoped>
.ra-tv { padding: 3rem 1rem; text-align: center; color: #6b5f52; }
</style>
