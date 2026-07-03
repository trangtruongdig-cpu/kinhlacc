<script setup lang="ts">
/**
 * ViThuocGallery — Thư viện ảnh vị thuốc theo GIAI ĐOẠN (nguyên liệu → … → thành phẩm).
 *
 * 2 nguồn ảnh, gộp lại:
 *  - Ảnh TĨNH trong repo: manifest public/vi-thuoc/<id>/index.json → { images:[{file,giai_doan,mo_ta}] }
 *  - Ảnh UPLOAD (người dùng tự tải): truyền qua prop `uploaded` (từ herb.anhUploads), serve tại /uploads/…
 *
 * `editable` (admin): hiện nút tải ảnh lên, xoá ảnh upload, đặt ảnh đại diện. Sau thay đổi → emit('changed').
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { api, assetUrl } from '@/services/api'

interface UploadedImg { id: number; url: string; giai_doan?: string | null; mo_ta?: string | null }
const props = defineProps<{
  viThuocId: number
  viThuocTen?: string
  uploaded?: UploadedImg[]
  editable?: boolean
  anhDaiDien?: string | null
}>()
const emit = defineEmits<{ changed: [] }>()

interface GalleryImage { file: string; giai_doan?: string; mo_ta?: string }
interface ResolvedImage { src: string; giai_doan: string; mo_ta: string; anhId?: number; rawUrl?: string }

const BASE = import.meta.env.BASE_URL || '/'
const staticImages = ref<ResolvedImage[]>([])
const loading = ref(true)
const uploading = ref(false)
const newGiaiDoan = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const lightbox = ref<number | null>(null)
// Ảnh tải lỗi/hết hạn → ẩn khỏi thư viện (tránh icon vỡ).
const brokenSrc = ref<string[]>([])
function markBroken(src: string) { if (src && !brokenSrc.value.includes(src)) brokenSrc.value.push(src) }

// Ảnh upload lên trước, ảnh tĩnh sau; loại ảnh đã lỗi.
const images = computed<ResolvedImage[]>(() => [
  ...(props.uploaded ?? []).map((u) => ({
    src: assetUrl(u.url),
    giai_doan: (u.giai_doan || '').trim(),
    mo_ta: (u.mo_ta || '').trim(),
    anhId: u.id,
    rawUrl: u.url,
  })),
  ...staticImages.value,
].filter((im) => !brokenSrc.value.includes(im.src)))
const current = computed<ResolvedImage | null>(() =>
  lightbox.value != null ? images.value[lightbox.value] ?? null : null,
)

function resolveSrc(file: string, id: number): string {
  if (/^https?:\/\//i.test(file)) return file
  return `${BASE}vi-thuoc/${id}/${file}`.replace(/\/{2,}/g, (m) => (m.startsWith('//') && m.length === 2 ? '/' : m))
}

async function loadStatic(id: number) {
  loading.value = true
  staticImages.value = []
  try {
    const res = await fetch(`${BASE}vi-thuoc/${id}/index.json`, { cache: 'no-cache' })
    if (!res.ok) return
    const data = (await res.json()) as { images?: GalleryImage[] }
    staticImages.value = (data.images ?? [])
      .filter((x) => x && x.file)
      .map((x) => ({ src: resolveSrc(x.file, id), giai_doan: (x.giai_doan || '').trim(), mo_ta: (x.mo_ta || '').trim() }))
  } catch {
    /* không có ảnh tĩnh → bỏ qua */
  } finally {
    loading.value = false
  }
}

async function onPickFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || !files.length) return
  uploading.value = true
  try {
    for (const f of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', f)
      if (newGiaiDoan.value.trim()) fd.append('giai_doan', newGiaiDoan.value.trim())
      await api.upload(`/vi-thuoc/${props.viThuocId}/anh`, fd)
    }
    newGiaiDoan.value = ''
    emit('changed')
  } catch (err) {
    alert('Tải ảnh thất bại: ' + (err instanceof Error ? err.message : String(err)))
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
async function delAnh(anhId: number) {
  if (!confirm('Xoá ảnh này?')) return
  try {
    await api.delete(`/vi-thuoc/anh/${anhId}`)
    emit('changed')
  } catch (err) {
    alert('Xoá ảnh thất bại: ' + (err instanceof Error ? err.message : String(err)))
  }
}
async function setAvatar(rawUrl: string) {
  try {
    await api.put(`/vi-thuoc/${props.viThuocId}/anh-dai-dien`, { url: rawUrl })
    emit('changed')
  } catch (err) {
    alert('Đặt ảnh đại diện thất bại: ' + (err instanceof Error ? err.message : String(err)))
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

onMounted(() => { loadStatic(props.viThuocId); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
watch(() => props.viThuocId, (id) => { close(); loadStatic(id) })
</script>

<template>
  <section v-if="!loading || editable" class="vtg">
    <div class="vtg-head">
      <h4 class="vtg-title">Thư viện ảnh</h4>
      <span class="vtg-sub">Từ nguyên liệu đến thành phẩm</span>
    </div>

    <!-- Thanh tải ảnh (chỉ admin) -->
    <div v-if="editable" class="vtg-upload">
      <input v-model="newGiaiDoan" type="text" class="vtg-stage-in" placeholder="Giai đoạn (vd: Cây tươi, Phiến, Thành phẩm) — tuỳ chọn" />
      <input ref="fileInput" type="file" accept="image/*" multiple class="vtg-file" @change="onPickFiles" />
      <button type="button" class="vtg-up-btn" :disabled="uploading" @click="fileInput?.click()">
        {{ uploading ? 'Đang tải…' : '⬆ Tải ảnh lên' }}
      </button>
    </div>

    <p v-if="!images.length" class="vtg-empty">Chưa có ảnh cho vị thuốc này.</p>
    <ol v-else class="vtg-grid">
      <li v-for="(img, i) in images" :key="i" class="vtg-item">
        <button type="button" class="vtg-thumb" :aria-label="`Xem ảnh ${i + 1}`" @click="open(i)">
          <img :src="img.src" :alt="img.mo_ta || img.giai_doan || viThuocTen || 'ảnh vị thuốc'" loading="lazy" @error="markBroken(img.src)" />
          <span v-if="img.giai_doan" class="vtg-stage">{{ i + 1 }}. {{ img.giai_doan }}</span>
          <span v-if="img.rawUrl && anhDaiDien === img.rawUrl" class="vtg-badge-avatar">★ Đại diện</span>
        </button>
        <p v-if="img.mo_ta" class="vtg-cap">{{ img.mo_ta }}</p>
        <!-- Nút quản lý cho ảnh UPLOAD (có anhId), chỉ admin -->
        <div v-if="editable && img.anhId" class="vtg-actions">
          <button
            v-if="anhDaiDien !== img.rawUrl"
            type="button"
            class="vtg-act"
            @click="setAvatar(img.rawUrl!)"
          >Đặt đại diện</button>
          <span v-else class="vtg-act vtg-act--current">Đang là đại diện</span>
          <button type="button" class="vtg-act vtg-act--del" @click="delAnh(img.anhId!)">Xoá</button>
        </div>
      </li>
    </ol>
  </section>

  <Teleport to="body">
    <div v-if="current && lightbox != null" class="vtg-lb" @click.self="close">
      <button type="button" class="vtg-lb-x" aria-label="Đóng" @click="close">✕</button>
      <button v-if="images.length > 1" type="button" class="vtg-lb-nav vtg-lb-prev" aria-label="Trước" @click="prev">‹</button>
      <figure class="vtg-lb-fig">
        <img :src="current.src" :alt="current.mo_ta || viThuocTen || 'ảnh vị thuốc'" @error="markBroken(current.src)" />
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

/* Thanh tải ảnh */
.vtg-upload { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
.vtg-stage-in { flex: 1; min-width: 180px; padding: 7px 11px; font-size: 13px; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; }
.vtg-file { display: none; }
.vtg-up-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid var(--brown-500, #8a6d3b); background: var(--brown-500, #8a6d3b); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.vtg-up-btn:hover:not(:disabled) { background: var(--brown-700, #6b4f2a); }
.vtg-up-btn:disabled { opacity: 0.6; cursor: default; }

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
.vtg-badge-avatar {
  position: absolute; top: 6px; left: 6px; padding: 1px 7px; border-radius: 999px;
  font-size: 10.5px; font-weight: 700; color: #7a4a1a; background: #ffe6b8; border: 1px solid #e6b866;
}
.vtg-cap { margin: 4px 2px 0; font-size: 11.5px; line-height: 1.4; color: var(--gray-600); }
.vtg-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
.vtg-act {
  padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; cursor: pointer;
  border: 1px solid var(--brown-400, #b9935a); background: #fff; color: var(--brown-700, #6b4f2a);
}
.vtg-act:hover { background: var(--brown-50, #f7f3ec); }
.vtg-act--current { cursor: default; border-color: #e6b866; background: #fff6e6; color: #8a5a1a; }
.vtg-act--del { border-color: #e0a59e; color: #b42318; }
.vtg-act--del:hover { background: #fbeceb; }
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
