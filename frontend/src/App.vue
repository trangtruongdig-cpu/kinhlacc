<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { applySeo, type SeoData } from '@/composables/useSeo'
import { routeSeo, defaultSeo } from '@/seo/routeSeo'
import ZaloButton from '@/components/ZaloButton.vue'

const route = useRoute()

// CTA Zalo chỉ hiện ở trang CÔNG KHAI (khách chưa đăng nhập) — ẩn trong web app quản trị.
const showZalo = computed(() => route.meta.requiresAuth !== true)

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
  <ZaloButton v-if="showZalo" />
</template>

<style scoped></style>
