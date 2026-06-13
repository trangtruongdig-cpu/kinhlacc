<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { applySeo, type SeoData } from '@/composables/useSeo'
import { routeSeo, defaultSeo } from '@/seo/routeSeo'

const route = useRoute()

// Mỗi lần đổi trang: áp lại thẻ <head> (title, mô tả, Open Graph, JSON-LD).
// Trang riêng tư (cần đăng nhập) hoặc /login => noindex (không cho lên Google).
watch(
  () => route.fullPath,
  () => {
    const name = typeof route.name === 'string' ? route.name : ''
    const isPrivate = route.meta.requiresAuth === true || name === 'login'
    const seo: SeoData = routeSeo[name] ?? { ...defaultSeo, index: !isPrivate }
    applySeo(seo, route.path)
  },
  { immediate: true },
)
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
