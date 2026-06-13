<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ATLAS, CATEGORY_LABELS, type TongueAtlasEntry, type AtlasCategory } from '@/data/tongue-atlas'
import TongueSVGCard from './TongueSVGCard.vue'
import { api } from '@/services/api'

interface RepresentativeImage { url: string; score: number }
interface RepBuildStatus {
  status: 'idle' | 'building' | 'done' | 'error'
  progress: { current: number; total: number; classId: string }
  error?: string
  durationMs?: number
}

const atlasLoaded = ref(false)
const representatives = ref<Record<string, RepresentativeImage[]>>({})
const repBuildStatus = ref<RepBuildStatus>({ status: 'idle', progress: { current: 0, total: 23, classId: '' } })

let pollTimer: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

async function loadRepresentatives() {
  try {
    const data = await api.get<Record<string, RepresentativeImage[]>>('/chan-doan-luoi/atlas-representatives')
    representatives.value = data ?? {}
  } catch {}
}

async function pollStatus() {
  try {
    const status = await api.get<RepBuildStatus>('/chan-doan-luoi/atlas-representatives/status')
    repBuildStatus.value = status
    if (status.status === 'done') {
      stopPolling()
      await loadRepresentatives()
    } else if (status.status === 'error') {
      stopPolling()
    }
  } catch {
    stopPolling()
  }
}

async function buildRepresentatives() {
  if (repBuildStatus.value.status === 'building') return
  try {
    await api.post<{ status: string }>('/chan-doan-luoi/atlas-representatives/rebuild', {})
    repBuildStatus.value = { status: 'building', progress: { current: 0, total: 23, classId: '' } }
    stopPolling()
    pollTimer = setInterval(pollStatus, 2500)
  } catch {}
}

onMounted(async () => {
  try {
    const res = await fetch('/tongue-atlas/atlas-index.json')
    if (!res.ok) return
    const index: Record<string, string[]> = await res.json()
    ATLAS.forEach(entry => {
      if (index[entry.id]?.length) entry.images = index[entry.id]
    })
    atlasLoaded.value = true
  } catch {}
  await loadRepresentatives()
  // Nếu server đang build dở (restart trang), tiếp tục polling
  await pollStatus()
  if (repBuildStatus.value.status === 'building') {
    pollTimer = setInterval(pollStatus, 2500)
  }
})

onUnmounted(stopPolling)

const props = defineProps<{ filterPatterns?: string[] }>()

const activeCategory = ref<AtlasCategory | 'all'>('all')
const activeEntry    = ref<TongueAtlasEntry | null>(null)
const imageMode      = ref<'svg' | 'photo'>('svg')
const activePhotoIdx = ref(0)

const CATEGORIES: (AtlasCategory | 'all')[] = ['all', 'chat-luoi', 'hinh-dang', 'reu-luoi', 'vung']
const CATEGORY_TAB_LABELS: Record<string, string> = { all: 'Tất Cả', ...CATEGORY_LABELS }

const CAT_COLOR: Record<string, string> = {
  all:         '#7a4515',
  'chat-luoi': '#dc2626',
  'hinh-dang': '#7c3aed',
  'reu-luoi':  '#059669',
  vung:        '#d97706',
}

const PATTERN_VI: Record<string, string> = {
  am_hu: 'Âm Hư', duong_hu: 'Dương Hư', khi_hu: 'Khí Hư', huyet_hu: 'Huyết Hư',
  nhiet: 'Nhiệt Chứng', han: 'Hàn Chứng', u_huyet: 'Ứ Huyết',
  dam_thap: 'Đàm Thấp', thap_nhiet: 'Thấp Nhiệt', can_uat: 'Can Uất',
}
const PATTERN_COLORS: Record<string, string> = {
  am_hu: '#ef4444', duong_hu: '#3b82f6', khi_hu: '#f59e0b', huyet_hu: '#ec4899',
  nhiet: '#f97316', han: '#06b6d4', u_huyet: '#8b5cf6', dam_thap: '#84cc16',
  thap_nhiet: '#d97706', can_uat: '#10b981',
}

const filteredAtlas = computed<TongueAtlasEntry[]>(() => {
  let list = ATLAS
  if (props.filterPatterns?.length)
    list = list.filter(e => e.patterns.some(p => props.filterPatterns!.includes(p)))
  if (activeCategory.value !== 'all')
    list = list.filter(e => e.category === activeCategory.value)
  return list
})

const groupedAtlas = computed(() => {
  if (activeCategory.value !== 'all') return null
  const order: AtlasCategory[] = ['chat-luoi', 'hinh-dang', 'reu-luoi', 'vung']
  return order
    .map(cat => ({ cat, label: CATEGORY_LABELS[cat], entries: filteredAtlas.value.filter(e => e.category === cat) }))
    .filter(g => g.entries.length > 0)
})

function openEntry(entry: TongueAtlasEntry) {
  activeEntry.value = entry
  activePhotoIdx.value = 0
  imageMode.value = entry.images.length ? 'photo' : 'svg'
}
function closeEntry() { activeEntry.value = null }
function hasPhotos(e: TongueAtlasEntry) { return e.images.length > 0 }

function prevPhoto() {
  if (!activeEntry.value) return
  activePhotoIdx.value = (activePhotoIdx.value - 1 + activeEntry.value.images.length) % activeEntry.value.images.length
}
function nextPhoto() {
  if (!activeEntry.value) return
  activePhotoIdx.value = (activePhotoIdx.value + 1) % activeEntry.value.images.length
}

function openRepPhoto(repUrl: string) {
  if (!activeEntry.value?.images.length) return
  const filename = repUrl.split('/').pop() ?? ''
  const idx = activeEntry.value.images.findIndex(u => u.endsWith(filename))
  activePhotoIdx.value = idx >= 0 ? idx : 0
  imageMode.value = 'photo'
}
</script>

<template>
  <div class="ap-wrap">

    <!-- ── Filter bar ── -->
    <div class="ap-filter">
      <button
        v-for="cat in CATEGORIES" :key="cat"
        class="ap-filter-btn"
        :class="{ active: activeCategory === cat }"
        :style="activeCategory === cat
          ? { background: CAT_COLOR[cat], borderColor: CAT_COLOR[cat], color: '#fff' }
          : { borderColor: CAT_COLOR[cat] + '66', color: CAT_COLOR[cat] }"
        @click="activeCategory = cat; activeEntry = null"
      >
        <span class="ap-dot" :style="{ background: activeCategory === cat ? 'rgba(255,255,255,0.7)' : CAT_COLOR[cat] }"/>
        {{ CATEGORY_TAB_LABELS[cat] }}
      </button>
      <span v-if="filterPatterns?.length" class="ap-filter-note">
        · {{ filteredAtlas.length }} đặc điểm liên quan
      </span>
    </div>

    <!-- ── Body ── -->
    <div class="ap-body">

      <!-- Grid area -->
      <div class="ap-grid-area">
        <div v-if="filteredAtlas.length === 0" class="ap-empty">
          Không có đặc điểm lưỡi liên quan đến chẩn đoán hiện tại
        </div>

        <!-- Grouped by category -->
        <template v-else-if="groupedAtlas">
          <div v-for="group in groupedAtlas" :key="group.cat" class="ap-group">
            <div class="ap-group-hd">
              <span class="ap-group-bar" :style="{ background: CAT_COLOR[group.cat] }"/>
              <span class="ap-group-lbl" :style="{ color: CAT_COLOR[group.cat] }">{{ group.label }}</span>
              <span class="ap-group-cnt">{{ group.entries.length }}</span>
            </div>
            <div class="ap-grid">
              <button
                v-for="entry in group.entries" :key="entry.id"
                class="ap-card"
                :class="{ active: activeEntry?.id === entry.id }"
                :style="activeEntry?.id === entry.id
                  ? { borderColor: CAT_COLOR[entry.category], boxShadow: `0 6px 24px ${CAT_COLOR[entry.category]}28` }
                  : {}"
                @click="openEntry(entry)"
              >
                <!-- Card image: real photo if available, else SVG -->
                <div class="ap-card-thumb">
                  <img
                    v-if="atlasLoaded && hasPhotos(entry)"
                    :src="entry.images[0]"
                    :alt="entry.vi"
                    class="ap-card-photo"
                  />
                  <div v-else class="ap-card-svg-wrap">
                    <TongueSVGCard :params="entry.svg" :size="90"/>
                  </div>
                  <!-- Bottom overlay bar for category color -->
                  <span class="ap-card-cat-bar" :style="{ background: CAT_COLOR[entry.category] }"/>
                  <!-- Photo count badge -->
                  <span v-if="hasPhotos(entry)" class="ap-card-badge">📷 {{ entry.images.length }}</span>
                </div>
                <div class="ap-card-footer">
                  <span class="ap-card-name">{{ entry.vi }}</span>
                </div>
              </button>
            </div>
          </div>
        </template>

        <!-- Flat grid (single category) -->
        <div v-else class="ap-grid">
          <button
            v-for="entry in filteredAtlas" :key="entry.id"
            class="ap-card"
            :class="{ active: activeEntry?.id === entry.id }"
            :style="activeEntry?.id === entry.id
              ? { borderColor: CAT_COLOR[activeCategory], boxShadow: `0 6px 24px ${CAT_COLOR[activeCategory]}28` }
              : {}"
            @click="openEntry(entry)"
          >
            <div class="ap-card-thumb">
              <img
                v-if="atlasLoaded && hasPhotos(entry)"
                :src="entry.images[0]"
                :alt="entry.vi"
                class="ap-card-photo"
              />
              <div v-else class="ap-card-svg-wrap">
                <TongueSVGCard :params="entry.svg" :size="90"/>
              </div>
              <span class="ap-card-cat-bar" :style="{ background: CAT_COLOR[entry.category] }"/>
              <span v-if="hasPhotos(entry)" class="ap-card-badge">📷 {{ entry.images.length }}</span>
            </div>
            <div class="ap-card-footer">
              <span class="ap-card-name">{{ entry.vi }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- ── Detail panel ── -->
      <Transition name="ap-slide">
        <aside v-if="activeEntry" class="ap-detail">

          <!-- Header -->
          <div class="ap-detail-hd" :style="{ borderTopColor: CAT_COLOR[activeEntry.category] }">
            <div class="ap-detail-hd-left">
              <span class="ap-detail-dot" :style="{ background: CAT_COLOR[activeEntry.category] }"/>
              <div>
                <h3 class="ap-detail-title">{{ activeEntry.vi }}</h3>
                <span class="ap-detail-en">{{ activeEntry.en }}</span>
              </div>
            </div>
            <button class="ap-detail-close" @click="closeEntry">✕</button>
          </div>

          <!-- Image section -->
          <div class="ap-detail-imgs">
            <!-- Toggle -->
            <div class="ap-mode-toggle">
              <button class="ap-mode-btn" :class="{ active: imageMode === 'svg' }" @click="imageMode = 'svg'">
                SVG Minh Họa
              </button>
              <button
                class="ap-mode-btn"
                :class="{ active: imageMode === 'photo', faded: !hasPhotos(activeEntry) }"
                :disabled="!hasPhotos(activeEntry)"
                @click="imageMode = 'photo'"
              >
                Ảnh Thực Tế
                <span v-if="!hasPhotos(activeEntry)" class="ap-mode-note">(chưa có)</span>
              </button>
            </div>

            <!-- SVG view: show SVG + real photo side by side if available -->
            <div v-if="imageMode === 'svg'" class="ap-svg-view">
              <div class="ap-svg-center">
                <TongueSVGCard :params="activeEntry.svg" :size="140"/>
              </div>
              <div v-if="hasPhotos(activeEntry)" class="ap-svg-photo-strip">
                <img
                  v-for="(src, i) in activeEntry.images.slice(0,3)" :key="i"
                  :src="src"
                  :alt="`${activeEntry.vi} ${i+1}`"
                  class="ap-strip-thumb"
                  @click="imageMode = 'photo'; activePhotoIdx = i"
                  title="Xem ảnh thực tế"
                />
                <span v-if="activeEntry.images.length > 3" class="ap-strip-more">
                  +{{ activeEntry.images.length - 3 }}
                </span>
              </div>
            </div>

            <!-- Photo view -->
            <div v-else class="ap-photo-view">
              <div class="ap-photo-frame">
                <Transition name="ap-fade" mode="out-in">
                  <img
                    :key="activePhotoIdx"
                    :src="activeEntry.images[activePhotoIdx]"
                    :alt="activeEntry.vi"
                    class="ap-photo"
                  />
                </Transition>
                <template v-if="activeEntry.images.length > 1">
                  <button class="ap-nav ap-nav--prev" @click="prevPhoto">‹</button>
                  <button class="ap-nav ap-nav--next" @click="nextPhoto">›</button>
                  <div class="ap-dots">
                    <button
                      v-for="(_, i) in activeEntry.images" :key="i"
                      class="ap-dot-btn"
                      :class="{ active: activePhotoIdx === i }"
                      @click="activePhotoIdx = i"
                    />
                  </div>
                </template>
              </div>
              <p class="ap-photo-counter">{{ activePhotoIdx + 1 }} / {{ activeEntry.images.length }}</p>
            </div>
          </div>

          <!-- ML representative images -->
          <div class="ap-rep-section">
            <div class="ap-rep-hd">
              <div class="ap-rep-hd-left">
                <span class="ap-rep-title">Ảnh Đại Diện</span>
                <span class="ap-rep-source" v-if="Object.keys(representatives).length">
                  · xếp hạng theo prototype
                </span>
              </div>
              <button
                class="ap-rep-build-btn"
                :class="{ loading: repBuildStatus.status === 'building' }"
                :disabled="repBuildStatus.status === 'building'"
                :title="repBuildStatus.status === 'building' ? 'Đang xây dựng…' : 'Xây dựng lại ảnh đại diện ML (Python CNN → TF.js fallback)'"
                @click="buildRepresentatives"
              >⟳</button>
            </div>

            <!-- Progress bar khi đang build -->
            <div v-if="repBuildStatus.status === 'building'" class="ap-rep-progress">
              <div class="ap-rep-progress-bar-wrap">
                <div
                  class="ap-rep-progress-bar"
                  :style="{ width: repBuildStatus.progress.total > 0
                    ? `${Math.round(repBuildStatus.progress.current / repBuildStatus.progress.total * 100)}%`
                    : '0%' }"
                />
              </div>
              <span class="ap-rep-progress-txt">
                Đang phân tích {{ repBuildStatus.progress.current }}/{{ repBuildStatus.progress.total }} thể
                <template v-if="repBuildStatus.progress.classId">· {{ repBuildStatus.progress.classId }}</template>
              </span>
            </div>

            <!-- Error state -->
            <div v-else-if="repBuildStatus.status === 'error'" class="ap-rep-error">
              Lỗi: {{ repBuildStatus.error }} — nhấn ⟳ để thử lại
            </div>

            <!-- Images ranked by ML -->
            <div v-else-if="representatives[activeEntry.id]?.length" class="ap-rep-grid">
              <button
                v-for="(rep, i) in representatives[activeEntry.id]" :key="i"
                class="ap-rep-card"
                :class="{ top: i === 0 }"
                @click="openRepPhoto(rep.url)"
                :title="`Độ điển hình: ${rep.score}%`"
              >
                <div class="ap-rep-thumb-wrap">
                  <img :src="rep.url" :alt="`${activeEntry.vi} đại diện ${i+1}`" class="ap-rep-thumb"/>
                  <span class="ap-rep-rank" :class="{ gold: i === 0 }">{{ i === 0 ? '★' : i + 1 }}</span>
                </div>
                <span class="ap-rep-score" :class="{ high: rep.score >= 80, mid: rep.score >= 60 && rep.score < 80 }">
                  {{ rep.score }}%
                </span>
              </button>
            </div>

            <!-- Empty state -->
            <div v-else class="ap-rep-empty">
              Chưa có dữ liệu — nhấn ⟳ để xây dựng
            </div>
          </div>

          <!-- Info body -->
          <div class="ap-detail-body">
            <div class="ap-info-row">
              <span class="ap-info-lbl">Đặc Điểm</span>
              <p class="ap-info-val">{{ activeEntry.description }}</p>
            </div>
            <div class="ap-info-row">
              <span class="ap-info-lbl">Ý Nghĩa Lâm Sàng</span>
              <p class="ap-info-val">{{ activeEntry.clinical }}</p>
            </div>
            <div v-if="activeEntry.patterns.length" class="ap-info-row">
              <span class="ap-info-lbl">Thể Bệnh Liên Quan</span>
              <div class="ap-patterns">
                <span
                  v-for="p in activeEntry.patterns" :key="p"
                  class="ap-pattern-chip"
                  :style="{ background: PATTERN_COLORS[p] ?? '#6b7280' }"
                >{{ PATTERN_VI[p] ?? p }}</span>
              </div>
            </div>
          </div>

        </aside>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
/* ── Root ── */
.ap-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f8f5f0;
}

/* ── Filter bar ── */
.ap-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #ede0d4;
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.ap-filter::-webkit-scrollbar { display: none; }

.ap-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  border: 1.5px solid;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.ap-filter-btn:hover { opacity: .8; }

.ap-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ap-filter-note {
  font-size: 11px;
  color: #9ca3af;
  margin-left: 6px;
  white-space: nowrap;
}

/* ── Body ── */
.ap-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── Grid area ── */
.ap-grid-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 24px;
}

.ap-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
}

/* ── Group ── */
.ap-group { margin-bottom: 28px; }
.ap-group-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1.5px solid #ede0d4;
}
.ap-group-bar {
  width: 4px; height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
}
.ap-group-lbl {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .07em;
}
.ap-group-cnt {
  font-size: 11px;
  color: #9ca3af;
  background: #ede0d4;
  padding: 1px 8px;
  border-radius: 999px;
  margin-left: 2px;
}

/* ── Card grid ── */
.ap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

/* ── Card ── */
.ap-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s, border-color .15s;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 5px rgba(74,47,23,.09);
  padding: 0;
  text-align: center;
}
.ap-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(74,47,23,.15);
}
.ap-card.active { transform: translateY(-2px); }

/* ── Card thumbnail area ── */
.ap-card-thumb {
  position: relative;
  width: 100%;
  /* force aspect ratio close to tongue proportions */
  aspect-ratio: 5 / 7;
  overflow: hidden;
  background: linear-gradient(160deg, #fdf6f0 0%, #fff8f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ap-card-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .2s ease;
}
.ap-card:hover .ap-card-photo { transform: scale(1.04); }

.ap-card-svg-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
}

/* Bottom color stripe */
.ap-card-cat-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
}

/* Photo count badge */
.ap-card-badge {
  position: absolute;
  top: 6px; right: 6px;
  font-size: 9px;
  background: rgba(29, 78, 216, 0.9);
  color: #fff;
  padding: 2px 6px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
  line-height: 1.3;
}

.ap-card-footer {
  padding: 7px 8px 9px;
  flex-shrink: 0;
}
.ap-card-name {
  font-size: 11.5px;
  font-weight: 700;
  color: #5c3210;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Detail panel ── */
.ap-detail {
  width: 310px;
  flex-shrink: 0;
  background: #fff;
  border-left: 1px solid #ede0d4;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.ap-detail-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid #ede0d4;
  border-top: 3px solid transparent;
  flex-shrink: 0;
}
.ap-detail-hd-left {
  display: flex;
  align-items: flex-start;
  gap: 9px;
}
.ap-detail-dot {
  width: 9px; height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}
.ap-detail-title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 700;
  color: #3b1f0e;
  line-height: 1.3;
}
.ap-detail-en {
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.3;
}
.ap-detail-close {
  flex-shrink: 0;
  width: 26px; height: 26px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .12s;
}
.ap-detail-close:hover { background: #e5e7eb; }

/* ── Image section ── */
.ap-detail-imgs {
  padding: 12px 14px;
  border-bottom: 1px solid #ede0d4;
  flex-shrink: 0;
}
.ap-mode-toggle {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.ap-mode-btn {
  flex: 1;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  border: 1.5px solid #d4b8a0;
  border-radius: 8px;
  background: #fff;
  color: #7a4515;
  cursor: pointer;
  transition: all .12s;
}
.ap-mode-btn.active { background: #7a4515; color: #fff; border-color: #7a4515; }
.ap-mode-btn.faded { opacity: .4; cursor: not-allowed; }
.ap-mode-note { font-size: 10px; font-weight: 400; margin-left: 3px; }

/* SVG view */
.ap-svg-view { display: flex; flex-direction: column; gap: 8px; }
.ap-svg-center {
  display: flex;
  justify-content: center;
  background: linear-gradient(160deg, #fdf6f0, #fff8f5);
  border-radius: 12px;
  padding: 16px;
}

/* Photo strip (real photos thumbnails shown below SVG) */
.ap-svg-photo-strip {
  display: flex;
  gap: 6px;
  align-items: center;
}
.ap-strip-thumb {
  width: 52px;
  height: 52px;
  border-radius: 7px;
  object-fit: cover;
  cursor: zoom-in;
  border: 1.5px solid #ede0d4;
  transition: transform .12s, border-color .12s;
}
.ap-strip-thumb:hover { transform: scale(1.06); border-color: #b07840; }
.ap-strip-more {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
}

/* Photo view */
.ap-photo-view { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ap-photo-frame {
  position: relative;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: #111;
  aspect-ratio: 4/3;
}
.ap-photo {
  width: 100%; height: 100%;
  object-fit: contain;
  display: block;
}

.ap-nav {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  width: 28px; height: 28px;
  background: rgba(255,255,255,.82);
  backdrop-filter: blur(4px);
  border: none; border-radius: 50%;
  font-size: 18px; line-height: 1;
  color: #5c3210;
  cursor: pointer; z-index: 2;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.22);
  transition: background .12s;
}
.ap-nav--prev { left: 6px; }
.ap-nav--next { right: 6px; }
.ap-nav:hover { background: #fff; }

.ap-dots {
  position: absolute; bottom: 7px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 5px; align-items: center;
}
.ap-dot-btn {
  height: 5px; width: 5px; border-radius: 3px; border: none; padding: 0;
  background: rgba(255,255,255,.45); cursor: pointer;
  transition: width .2s, background .2s;
}
.ap-dot-btn.active { width: 16px; background: rgba(255,255,255,.95); }
.ap-photo-counter { font-size: 11px; color: #9ca3af; }

/* ── Detail info body ── */
.ap-detail-body {
  padding: 14px 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ap-info-row { display: flex; flex-direction: column; gap: 4px; }
.ap-info-lbl {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: #6b7280;
}
.ap-info-val {
  margin: 0;
  font-size: 12.5px;
  color: #374151;
  line-height: 1.65;
}

.ap-patterns { display: flex; flex-wrap: wrap; gap: 5px; }
.ap-pattern-chip {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  padding: 3px 10px;
  border-radius: 999px;
}

/* ── Slide transition for detail panel ── */
.ap-slide-enter-active,
.ap-slide-leave-active {
  transition: width .28s ease, opacity .28s ease;
  overflow: hidden;
}
.ap-slide-enter-from,
.ap-slide-leave-to  { width: 0; opacity: 0; }
.ap-slide-enter-to,
.ap-slide-leave-from { width: 310px; opacity: 1; }

/* ── Photo crossfade ── */
.ap-fade-enter-active, .ap-fade-leave-active { transition: opacity .18s ease; }
.ap-fade-enter-from, .ap-fade-leave-to { opacity: 0; }

/* ── ML representative section ── */
.ap-rep-section {
  padding: 12px 14px;
  border-bottom: 1px solid #ede0d4;
  flex-shrink: 0;
  background: #fdf9f5;
}
.ap-rep-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}
.ap-rep-hd-left {
  display: flex;
  align-items: center;
  gap: 5px;
}
.ap-rep-title {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: #6b7280;
}
.ap-rep-source {
  font-size: 9px;
  color: #059669;
  font-weight: 600;
}
.ap-rep-build-btn {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1.5px solid #d4b8a0;
  background: #fff;
  color: #7a4515;
  font-size: 13px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .12s, transform .2s;
  flex-shrink: 0;
}
.ap-rep-build-btn:hover:not(:disabled) { background: #f3ede7; }
.ap-rep-build-btn.loading { animation: spin .9s linear infinite; cursor: not-allowed; }
@keyframes spin { to { transform: rotate(360deg); } }

.ap-rep-grid {
  display: flex;
  gap: 6px;
}
.ap-rep-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 8px;
  transition: transform .12s;
}
.ap-rep-card:hover { transform: translateY(-2px); }
.ap-rep-card.top .ap-rep-thumb-wrap {
  box-shadow: 0 0 0 2.5px #d97706, 0 4px 12px rgba(217,119,6,.25);
}

.ap-rep-thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 7px;
  overflow: hidden;
  background: #f3ede7;
  box-shadow: 0 1px 4px rgba(74,47,23,.12);
}
.ap-rep-thumb {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .15s;
}
.ap-rep-card:hover .ap-rep-thumb { transform: scale(1.05); }

.ap-rep-rank {
  position: absolute;
  top: 3px; left: 3px;
  font-size: 9px;
  font-weight: 800;
  background: rgba(0,0,0,.55);
  color: #fff;
  border-radius: 4px;
  padding: 1px 4px;
  line-height: 1.4;
}
.ap-rep-rank.gold {
  background: #d97706;
  font-size: 10px;
}

.ap-rep-score {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
}
.ap-rep-score.high { color: #059669; }
.ap-rep-score.mid  { color: #d97706; }

.ap-rep-empty {
  font-size: 11px;
  color: #b5a090;
  font-style: italic;
  text-align: center;
  padding: 8px 0;
}

.ap-rep-progress {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 4px;
}
.ap-rep-progress-bar-wrap {
  height: 4px;
  background: #ede0d4;
  border-radius: 2px;
  overflow: hidden;
}
.ap-rep-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #059669, #10b981);
  border-radius: 2px;
  transition: width .4s ease;
}
.ap-rep-progress-txt {
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
}

.ap-rep-error {
  font-size: 11px;
  color: #dc2626;
  padding: 6px 0;
  font-style: italic;
}

/* ── Responsive ── */
@media (max-width: 800px) {
  .ap-body { flex-direction: column; }
  .ap-detail {
    width: 100%;
    border-left: none;
    border-top: 1px solid #ede0d4;
    max-height: 55vh;
  }
  .ap-slide-enter-from, .ap-slide-leave-to { width: 100%; height: 0; opacity: 0; }
  .ap-slide-enter-to, .ap-slide-leave-from { width: 100%; height: auto; opacity: 1; }
  .ap-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
}
</style>
