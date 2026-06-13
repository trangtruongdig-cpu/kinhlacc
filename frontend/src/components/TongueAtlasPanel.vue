<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ATLAS, CATEGORY_LABELS, groupByCategory, type TongueAtlasEntry, type AtlasCategory } from '@/data/tongue-atlas'
import TongueSVGCard from './TongueSVGCard.vue'

// Load ảnh thật từ atlas-index.json (được sinh ra bởi tools/process-tongue-atlas.cjs)
const atlasLoaded = ref(false)
onMounted(async () => {
  try {
    const res = await fetch('/tongue-atlas/atlas-index.json')
    if (!res.ok) return
    const index: Record<string, string[]> = await res.json()
    // Gắn ảnh vào ATLAS entries
    ATLAS.forEach(entry => {
      if (index[entry.id]?.length) {
        entry.images = index[entry.id]
      }
    })
    atlasLoaded.value = true
  } catch {
    // File chưa có — dùng SVG mode
  }
})

const props = defineProps<{
  // Nếu truyền filterPatterns, chỉ hiện các entry liên quan đến thể bệnh đó
  filterPatterns?: string[]
}>()

const activeCategory = ref<AtlasCategory | 'all'>('all')
const activeEntry = ref<TongueAtlasEntry | null>(null)
const imageMode = ref<'svg' | 'photo'>('svg')
const activePhotoIdx = ref(0)

const CATEGORIES: (AtlasCategory | 'all')[] = ['all', 'chat-luoi', 'hinh-dang', 'reu-luoi', 'vung']
const CATEGORY_TAB_LABELS: Record<string, string> = {
  all: 'Tất Cả', ...CATEGORY_LABELS
}

const filteredAtlas = computed<TongueAtlasEntry[]>(() => {
  let list = ATLAS
  if (props.filterPatterns?.length) {
    list = list.filter(e => e.patterns.some(p => props.filterPatterns!.includes(p)))
  }
  if (activeCategory.value !== 'all') {
    list = list.filter(e => e.category === activeCategory.value)
  }
  return list
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

const PATTERN_VI: Record<string, string> = {
  am_hu: 'Âm Hư', duong_hu: 'Dương Hư', khi_hu: 'Khí Hư', huyet_hu: 'Huyết Hư',
  nhiet: 'Nhiệt Chứng', han: 'Hàn Chứng', u_huyet: 'Ứ Huyết',
  dam_thap: 'Đàm Thấp', thap_nhiet: 'Thấp Nhiệt', can_uat: 'Can Uất',
}
</script>

<template>
  <div class="atlas-panel">
    <!-- Category tabs -->
    <div class="atlas-tabs">
      <button
        v-for="cat in CATEGORIES" :key="cat"
        class="atlas-tab"
        :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat; activeEntry = null"
      >{{ CATEGORY_TAB_LABELS[cat] }}</button>
    </div>

    <!-- No results (when filtering by pattern) -->
    <div v-if="filteredAtlas.length === 0" class="atlas-empty">
      Không có đặc điểm lưỡi liên quan
    </div>

    <!-- Grid -->
    <div v-else class="atlas-grid">
      <button
        v-for="entry in filteredAtlas" :key="entry.id"
        class="atlas-card"
        :class="{ active: activeEntry?.id === entry.id }"
        @click="openEntry(entry)"
      >
        <div class="atlas-card__img">
          <TongueSVGCard :params="entry.svg" :size="80"/>
          <span v-if="hasPhotos(entry)" class="atlas-card__photo-badge">📷 {{ entry.images.length }}</span>
        </div>
        <div class="atlas-card__info">
          <span class="atlas-card__name">{{ entry.vi }}</span>
          <span class="atlas-card__cat">{{ CATEGORY_LABELS[entry.category] }}</span>
        </div>
      </button>
    </div>

    <!-- Detail modal / panel -->
    <Teleport to="body">
      <div v-if="activeEntry" class="atlas-detail-overlay" @click.self="closeEntry">
        <div class="atlas-detail">
          <button class="atlas-detail__close" @click="closeEntry">✕</button>

          <div class="atlas-detail__header">
            <h3>{{ activeEntry.vi }}</h3>
            <span class="atlas-detail__en">{{ activeEntry.en }}</span>
          </div>

          <!-- Image section -->
          <div class="atlas-detail__images">
            <!-- Mode toggle -->
            <div class="atlas-img-toggle">
              <button
                class="ait-btn"
                :class="{ active: imageMode === 'svg' }"
                @click="imageMode = 'svg'"
              >SVG Minh Họa</button>
              <button
                class="ait-btn"
                :class="{ active: imageMode === 'photo', disabled: !hasPhotos(activeEntry) }"
                :disabled="!hasPhotos(activeEntry)"
                @click="imageMode = 'photo'"
              >
                Ảnh Thực Tế
                <span v-if="!hasPhotos(activeEntry)" class="ait-note">(chưa có)</span>
              </button>
            </div>

            <!-- SVG view -->
            <div v-if="imageMode === 'svg'" class="atlas-img-view">
              <TongueSVGCard :params="activeEntry.svg" :size="200"/>
            </div>

            <!-- Photo view -->
            <div v-else class="atlas-img-view">
              <div class="atlas-photo-frame">
                <Transition name="atlas-fade" mode="out-in">
                  <img
                    :key="activePhotoIdx"
                    :src="activeEntry.images[activePhotoIdx]"
                    :alt="activeEntry.vi"
                    class="atlas-photo"
                  />
                </Transition>
                <template v-if="activeEntry.images.length > 1">
                  <button class="atlas-photo-btn atlas-photo-btn--prev" @click="prevPhoto">‹</button>
                  <button class="atlas-photo-btn atlas-photo-btn--next" @click="nextPhoto">›</button>
                  <div class="atlas-photo-dots">
                    <button
                      v-for="(_, i) in activeEntry.images" :key="i"
                      class="atlas-photo-dot"
                      :class="{ active: activePhotoIdx === i }"
                      @click="activePhotoIdx = i"
                    />
                  </div>
                </template>
              </div>
              <span class="atlas-photo-count">{{ activePhotoIdx + 1 }} / {{ activeEntry.images.length }}</span>
            </div>
          </div>

          <!-- Info -->
          <div class="atlas-detail__body">
            <div class="atlas-detail__field">
              <span class="adf-label">Đặc Điểm</span>
              <p class="adf-val">{{ activeEntry.description }}</p>
            </div>
            <div class="atlas-detail__field">
              <span class="adf-label">Ý Nghĩa Lâm Sàng</span>
              <p class="adf-val">{{ activeEntry.clinical }}</p>
            </div>
            <div v-if="activeEntry.patterns.length" class="atlas-detail__field">
              <span class="adf-label">Thể Bệnh Liên Quan</span>
              <div class="adf-patterns">
                <span
                  v-for="p in activeEntry.patterns" :key="p"
                  class="adf-pattern-badge"
                >{{ PATTERN_VI[p] ?? p }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.atlas-panel { display: flex; flex-direction: column; height: 100%; }

/* ── Tabs ── */
.atlas-tabs { display: flex; gap: 4px; flex-wrap: wrap; padding: 12px 16px 0; border-bottom: 1px solid var(--brown-100, #ede0d4); background: var(--white, #fff); }
.atlas-tab {
  font-size: 11px; font-weight: 600; padding: 6px 12px;
  border: 1px solid transparent; border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: transparent; color: var(--gray-500, #6b7280); cursor: pointer;
  transition: all .12s;
}
.atlas-tab:hover { background: var(--brown-50, #fdf8f4); color: var(--brown-700, #7a4515); }
.atlas-tab.active { background: var(--white, #fff); color: var(--brown-800, #5c3210); border-color: var(--brown-200, #d4b8a0); font-weight: 700; }

/* ── Grid ── */
.atlas-empty { padding: 24px; text-align: center; color: var(--gray-400, #9ca3af); font-size: 13px; font-style: italic; }
.atlas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.atlas-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 10px 6px 8px;
  background: var(--white, #fff);
  border: 1.5px solid var(--brown-100, #ede0d4);
  border-radius: 10px;
  cursor: pointer;
  transition: all .15s;
  position: relative;
  text-align: center;
}
.atlas-card:hover { border-color: var(--brown-300, #c0956a); box-shadow: 0 3px 12px rgba(74,47,23,.1); transform: translateY(-2px); }
.atlas-card.active { border-color: var(--brown-600, #8a5020); background: var(--brown-50, #fdf8f4); }
.atlas-card__img { position: relative; }
.atlas-card__photo-badge {
  position: absolute; bottom: -4px; right: -4px;
  font-size: 9px; background: #1d4ed8; color: #fff;
  padding: 1px 5px; border-radius: 999px;
}
.atlas-card__name { font-size: 11px; font-weight: 700; color: var(--brown-800, #5c3210); line-height: 1.3; }
.atlas-card__cat  { font-size: 9px; color: var(--gray-400, #9ca3af); }

/* ── Detail overlay ── */
.atlas-detail-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.atlas-detail {
  background: var(--white, #fff);
  border-radius: 16px;
  width: 100%; max-width: 460px;
  max-height: 90vh; overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
}
.atlas-detail__close {
  position: absolute; top: 12px; right: 12px;
  background: var(--gray-100, #f3f4f6); border: none;
  width: 28px; height: 28px; border-radius: 50%;
  font-size: 12px; cursor: pointer; color: var(--gray-600, #4b5563);
  display: flex; align-items: center; justify-content: center;
}
.atlas-detail__close:hover { background: var(--gray-200, #e5e7eb); }

.atlas-detail__header { padding: 20px 20px 0; }
.atlas-detail__header h3 { margin: 0 0 2px; font-size: 18px; font-weight: 700; color: var(--brown-900, #3b1f0e); }
.atlas-detail__en { font-size: 12px; color: var(--gray-400, #9ca3af); }

/* ── Image section ── */
.atlas-detail__images { padding: 16px 20px; }
.atlas-img-toggle { display: flex; gap: 6px; margin-bottom: 12px; }
.ait-btn {
  flex: 1; padding: 7px 12px; font-size: 12px; font-weight: 600;
  border: 1.5px solid var(--brown-200, #d4b8a0);
  border-radius: 8px; background: var(--white, #fff);
  color: var(--brown-700, #7a4515); cursor: pointer; transition: all .12s;
}
.ait-btn.active { background: var(--brown-700, #7a4515); color: #fff; border-color: var(--brown-700); }
.ait-btn.disabled { opacity: .45; cursor: not-allowed; }
.ait-note { font-size: 10px; font-weight: 400; margin-left: 4px; }

.atlas-img-view {
  display: flex; flex-direction: column; align-items: center;
  background: var(--brown-50, #fdf8f4); border-radius: 12px;
  padding: 12px 12px 8px;
  height: 320px; box-sizing: border-box;
}

/* ── Photo frame wrapper ── */
.atlas-photo-frame {
  position: relative;
  flex: 1; min-height: 0;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #111;
}
.atlas-photo {
  width: 100%; height: 100%;
  object-fit: contain;
  display: block;
}

/* ── Prev / Next arrows ── */
.atlas-photo-btn {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 30px; height: 30px;
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(4px);
  border: none; border-radius: 50%;
  font-size: 20px; line-height: 1;
  color: var(--brown-800, #5c3210);
  cursor: pointer; z-index: 2;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.22);
  transition: background .12s, transform .12s;
}
.atlas-photo-btn--prev { left: 8px; }
.atlas-photo-btn--next { right: 8px; }
.atlas-photo-btn:hover { background: #fff; transform: translateY(-50%) scale(1.1); }

/* ── Dot indicators (pill style) ── */
.atlas-photo-dots {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 5px; align-items: center;
}
.atlas-photo-dot {
  height: 6px; width: 6px;
  border-radius: 3px; border: none; padding: 0;
  background: rgba(255,255,255,0.45);
  cursor: pointer;
  transition: width .2s ease, background .2s ease;
}
.atlas-photo-dot.active {
  width: 18px;
  background: rgba(255,255,255,0.95);
}
.atlas-photo-count { font-size: 11px; color: var(--gray-400, #9ca3af); margin-top: 5px; flex-shrink: 0; }

/* ── Crossfade transition ── */
.atlas-fade-enter-active, .atlas-fade-leave-active { transition: opacity .18s ease; }
.atlas-fade-enter-from, .atlas-fade-leave-to { opacity: 0; }

/* ── Info body ── */
.atlas-detail__body { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 12px; }
.atlas-detail__field { display: flex; flex-direction: column; gap: 4px; }
.adf-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--gray-500, #6b7280); }
.adf-val { margin: 0; font-size: 13px; color: var(--gray-800, #1f2937); line-height: 1.55; }
.adf-patterns { display: flex; flex-wrap: wrap; gap: 6px; }
.adf-pattern-badge {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px;
  background: var(--brown-100, #ede0d4); color: var(--brown-800, #5c3210);
}
</style>
