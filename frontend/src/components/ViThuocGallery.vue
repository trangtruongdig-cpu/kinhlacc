<script setup lang="ts">
/**
 * ViThuocGallery — Thư viện ảnh vị thuốc theo GIAI ĐOẠN (nguyên liệu → … → thành phẩm).
 *
 * Ảnh là FILE TĨNH trong repo. Manifest mỗi vị: public/vi-thuoc/<id>/index.json
 *   { "images": [ { "file": "1.jpg", "giai_doan": "Cây tươi", "mo_ta": "…" }, … ] }
 * Thứ tự mảng = thứ tự vòng đời. `file` có thể là tên file (cùng thư mục) hoặc URL http đầy đủ.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ viThuocId: number; viThuocTen?: string }>()

interface GalleryImage { file: string; giai_doan?: string; mo_ta?: string }
interface ResolvedImage { src: string; giai_doan: string; mo_ta: string }

const BASE = import.meta.env.BASE_URL || '/'
const images = ref<ResolvedImage[]>([])
const loading = ref(true)
const lightbox = ref<number | null>(null)
const current = computed<ResolvedImage | null>(() =>
  lightbox.value != null ? images.value[lightbox.value] ?? null : null,
)

function resolveSrc(file: string, id: number): string {
  if (/^https?:\/\//i.test(file)) return file
  return `${BASE}vi-thuoc/${id}/${file}`.replace(/\/{2,}/g, (m) => (m.startsWith('//') && m.length === 2 ? '/' : m))
}

async function load(id: number) {
  loading.value = true
  images.value = []
  try {
    const res = await fetch(`${BASE}vi-thuoc/${id}/index.json`, { cache: 'no-cache' })
    if (!res.ok) return // chưa có thư viện ảnh → ẩn
    const data = (await res.json()) as { images?: GalleryImage[] }
    images.value = (data.images ?? [])
      .filter((x) => x && x.file)
      .map((x) => ({ src: resolveSrc(x.file, id), giai_doan: (x.giai_doan || '').trim(), mo_ta: (x.mo_ta || '').trim() }))
  } catch {
    /* không có ảnh / lỗi mạng → bỏ qua, ẩn gallery */
  } finally {
    loading.value = false
  }
}

function open(i: number) { lightbox.value = i }
function close() { lightbox.value = null }
function prev() { if (lightbox.value != null) lightbox.value = (lightbox.value - 1 + images.value.length) % images.value.length }
function next() { if (lightbox.value != null) lightbox.value = (lightbox.value + 1) % images.value.length }

function onKey(e: KeyboardEvent) {
  if (lightbox.value == null) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
}

onMounted(() => { load(props.viThuocId); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
watch(() => props.viThuocId, (id) => { close(); load(id) })
</script>

<template>
  <section v-if="!loading" class="vtg">
    <div class="vtg-head">
      <h4 class="vtg-title">Thư viện ảnh</h4>
      <span class="vtg-sub">Từ nguyên liệu đến thành phẩm</span>
    </div>
    <p v-if="!images.length" class="vtg-empty">Chưa có ảnh cho vị thuốc này.</p>
    <ol v-else class="vtg-grid">
      <li v-for="(img, i) in images" :key="i" class="vtg-item">
        <button type="button" class="vtg-thumb" @click="open(i)" :aria-label="`Xem ảnh ${i + 1}`">
          <img :src="img.src" :alt="img.mo_ta || img.giai_doan || viThuocTen || 'ảnh vị thuốc'" loading="lazy" />
          <span v-if="img.giai_doan" class="vtg-stage">{{ i + 1 }}. {{ img.giai_doan }}</span>
        </button>
        <p v-if="img.mo_ta" class="vtg-cap">{{ img.mo_ta }}</p>
      </li>
    </ol>
  </section>

  <Teleport to="body">
    <div v-if="current && lightbox != null" class="vtg-lb" @click.self="close">
      <button type="button" class="vtg-lb-x" aria-label="Đóng" @click="close">✕</button>
      <button v-if="images.length > 1" type="button" class="vtg-lb-nav vtg-lb-prev" aria-label="Trước" @click="prev">‹</button>
      <figure class="vtg-lb-fig">
        <img :src="current.src" :alt="current.mo_ta || viThuocTen || 'ảnh vị thuốc'" />
        <figcaption class="vtg-lb-cap">
          <span v-if="current.giai_doan" class="vtg-lb-stage">{{ lightbox + 1 }}/{{ images.length }} · {{ current.giai_doan }}</span>
          <span v-if="current.mo_ta">{{ current.mo_ta }}</span>
        </figcaption>
      </figure>
      <button v-if="images.length > 1" type="button" class="vtg-lb-nav vtg-lb-next" aria-label="Sau" @click="next">›</button>
    </div>
  </Teleport>
</template>

<style scoped>
.vtg { margin-top: 12px; }
.vtg-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.vtg-title { font-size: 14px; font-weight: 700; color: var(--brown-800, #5b3a1a); margin: 0; }
.vtg-sub { font-size: 12px; color: var(--gray-500); }
.vtg-grid {
  list-style: none; margin: 0; padding: 0;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;
}
.vtg-item { margin: 0; }
.vtg-thumb {
  position: relative; display: block; width: 100%; padding: 0; border: 1px solid var(--border, #e5e0d6);
  border-radius: 10px; overflow: hidden; cursor: pointer; background: #faf8f3; aspect-ratio: 4 / 3;
}
.vtg-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.25s ease; }
.vtg-thumb:hover img { transform: scale(1.05); }
.vtg-stage {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 4px 8px;
  font-size: 11px; font-weight: 600; color: #fff; text-align: left;
  background: linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0));
}
.vtg-cap { margin: 4px 2px 0; font-size: 11.5px; line-height: 1.4; color: var(--gray-600); }
.vtg-empty { margin: 0; padding: 14px; font-size: 13px; font-style: italic; color: var(--gray-400); border: 1px dashed var(--border, #e5e0d6); border-radius: 10px; text-align: center; }

/* Lightbox */
.vtg-lb {
  position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 24px; background: rgba(0,0,0,0.85);
}
.vtg-lb-fig { margin: 0; max-width: 90vw; max-height: 88vh; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.vtg-lb-fig img { max-width: 90vw; max-height: 76vh; object-fit: contain; border-radius: 8px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); }
.vtg-lb-cap { color: #f3f0ea; font-size: 13px; text-align: center; display: flex; flex-direction: column; gap: 3px; max-width: 680px; }
.vtg-lb-stage { font-weight: 700; color: #ffd9a8; }
.vtg-lb-x { position: absolute; top: 14px; right: 18px; width: 40px; height: 40px; border: 0; border-radius: 50%; background: rgba(255,255,255,0.15); color: #fff; font-size: 20px; cursor: pointer; }
.vtg-lb-x:hover { background: rgba(255,255,255,0.28); }
.vtg-lb-nav { flex: none; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(255,255,255,0.15); color: #fff; font-size: 28px; line-height: 1; cursor: pointer; }
.vtg-lb-nav:hover { background: rgba(255,255,255,0.3); }
@media (max-width: 640px) { .vtg-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); } .vtg-lb-prev { left: 8px; } .vtg-lb-next { right: 8px; } }
</style>
