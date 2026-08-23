<script setup lang="ts">
// Overlay IN TEM vị thuốc — render thẻ (đĩa Hán + tên serif hoa + Tính vị/Quy kinh/Công dụng),
// mỗi vị một tông màu như .vt-card. Thẻ CAO ĐỀU, căn giữa, không tràn → khớp mẫu in chuẩn.
// Công dụng nạp thêm từ chi tiết /vi-thuoc/:id (congDungLinks) vì list /lite không kèm.
import { ref, reactive, computed, watch } from 'vue'
import { api } from '@/services/api'

export interface HerbCard {
  id: number; ten: string; han: string; py: string; bp: string; tv: string; quy: string; ci: number
}
const props = defineProps<{ herbs: HerbCard[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const copies = ref(1)
const doPrint = () => window.print()

// 8 tông màu khớp .vt-card--c0..c7 (accent · nền1 · nền2 · vòng)
const PALETTE = [
  { c: '#a8324a', bg1: '#fdeef1', bg2: '#f6d7de', ring: '#ecc0cb' },
  { c: '#b45a24', bg1: '#fdf0e5', bg2: '#f5dabf', ring: '#e6c6a0' },
  { c: '#957a1a', bg1: '#fbf4dc', bg2: '#efe2b2', ring: '#ddca8e' },
  { c: '#3b7a49', bg1: '#ecf4ec', bg2: '#d1e6d2', ring: '#b8d8ba' },
  { c: '#2f7576', bg1: '#e8f3f2', bg2: '#cce5e4', ring: '#a9d2cf' },
  { c: '#7c3f82', bg1: '#f4edf6', bg2: '#e2d3ea', ring: '#cdb6d8' },
  { c: '#a5382f', bg1: '#fceeec', bg2: '#f5d5cf', ring: '#e8b8b0' },
  { c: '#38548c', bg1: '#edf0fa', bg2: '#d5dcee', ring: '#b8c4e4' },
]
const glyph = (h: HerbCard) => (h.han || h.ten || '?').trim()
const hanLen = (h: HerbCard) => [...glyph(h)].length
// Co cỡ tên Việt theo độ dài để LUÔN gọn 1 dòng như mẫu (XÍCH THƯỢC to · TANG KÝ SINH nhỏ lại)
const tenCls = (t: string) => { const n = (t || '').trim().length; return n <= 9 ? 'tn1' : n <= 13 ? 'tn2' : 'tn3' }

// Công dụng nạp thêm (id → chuỗi), '' = đã nạp nhưng trống / đang nạp
const congMap = reactive<Record<number, string>>({})
async function loadCongDung(ids: number[]) {
  await Promise.all(
    ids.filter((id) => congMap[id] === undefined).map(async (id) => {
      congMap[id] = ''
      try {
        const d = (await api.get<{ congDungLinks?: { congDung?: { ten_cong_dung?: string } }[] } | { data?: unknown }>(
          `/vi-thuoc/${id}`,
        )) as { congDungLinks?: { congDung?: { ten_cong_dung?: string } }[] }
        const links = d?.congDungLinks ?? []
        const terms = links.map((l) => (l?.congDung?.ten_cong_dung || '').trim()).filter(Boolean)
        let s = terms.slice(0, 6).join(', ')
        if (s.length > 96) s = s.slice(0, 93).trimEnd() + '…'
        congMap[id] = s
      } catch {
        congMap[id] = ''
      }
    }),
  )
}
watch(() => props.herbs, (hs) => loadCongDung(hs.map((h) => h.id)), { immediate: true })

const printed = computed(() => {
  const n = Math.max(1, Math.min(30, copies.value || 1))
  const out: (HerbCard & { pal: (typeof PALETTE)[number]; g: string; hl: number; tcls: string; cd: string })[] = []
  for (const h of props.herbs) {
    const pal = PALETTE[((h.ci % 8) + 8) % 8]!
    for (let i = 0; i < n; i++) out.push({ ...h, pal, g: glyph(h), hl: hanLen(h), tcls: tenCls(h.ten), cd: congMap[h.id] || '' })
  }
  return out
})
</script>

<template>
  <Teleport to="body">
    <div id="vt-tem-root">
      <div class="tvt-toolbar">
        <span class="tvt-title">🖨 In tem — {{ herbs.length }} vị đã chọn</span>
        <label class="tvt-copies">Số bản mỗi vị
          <input v-model.number="copies" type="number" min="1" max="30" />
        </label>
        <button class="tvt-btn" @click="doPrint">In</button>
        <button class="tvt-btn tvt-btn--ghost" @click="emit('close')">Đóng</button>
      </div>

      <div class="tvt-scroll">
        <div class="tvt-sheet">
          <div
            v-for="(h, i) in printed"
            :key="h.id + '-' + i"
            class="tvt-card"
            :style="{ '--c': h.pal.c, '--bg1': h.pal.bg1, '--bg2': h.pal.bg2, '--ring': h.pal.ring }"
          >
            <div class="tvt-left">
              <div class="tvt-badge"><span :class="'hl' + Math.min(h.hl, 4)">{{ h.g }}</span></div>
              <div v-if="h.bp" class="tvt-pill">{{ h.bp }}</div>
            </div>
            <div class="tvt-right">
              <div class="tvt-ten" :class="h.tcls">{{ h.ten }}</div>
              <div v-if="h.han || h.py" class="tvt-han">
                <b v-if="h.han">{{ h.han }}</b><i v-if="h.py">{{ h.py }}</i>
              </div>
              <div class="tvt-div"><em>❖</em></div>
              <div v-if="h.tv" class="tvt-line"><b>Tính vị:</b> {{ h.tv }}</div>
              <div v-if="h.quy" class="tvt-line"><b>Quy kinh:</b> {{ h.quy }}</div>
              <div v-if="h.cd" class="tvt-cd">{{ h.cd }}</div>
            </div>
            <div class="tvt-wm"><b>{{ h.han }}</b> ❖</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
#vt-tem-root { position: fixed; inset: 0; z-index: 9999; background: #efe7d8; display: flex; flex-direction: column; }
.tvt-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; padding: 12px 20px; background: #fbf7ef; border-bottom: 1px solid #d8c6a6; }
.tvt-title { font-weight: 700; color: #5b3f28; font-family: Georgia, serif; }
.tvt-copies { font-size: 0.85rem; color: #6f5f47; display: inline-flex; align-items: center; gap: 6px; }
.tvt-copies input { width: 56px; padding: 5px 8px; border: 1px solid #d8c6a6; border-radius: 7px; }
.tvt-btn { padding: 7px 18px; border: none; border-radius: 8px; background: #5b3f28; color: #fbf5ea; font-weight: 600; cursor: pointer; }
.tvt-btn:hover { background: #6f4d31; }
.tvt-btn--ghost { background: transparent; color: #6f5f47; border: 1px solid #d8c6a6; }
.tvt-scroll { flex: 1; overflow: auto; padding: 18px; display: flex; justify-content: center; }
.tvt-sheet { width: 196mm; display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; grid-auto-rows: 66mm; align-content: start; }

/* Thẻ CAO ĐỀU 66mm (tỉ lệ ~1.6:1 như mẫu PDF) + VIỀN KÉP (::after); nội dung căn giữa, snug, không tràn */
.tvt-card { --c: #5b3f28; --bg1: #faf5ec; --bg2: #f2e7d2; --ring: #d8c6a6;
  position: relative; overflow: hidden; break-inside: avoid; height: 66mm;
  display: flex; align-items: center; gap: 3mm; padding: 6mm 6mm 6mm 4mm;
  border: 1mm solid var(--c); border-radius: 5mm;
  background: linear-gradient(150deg, var(--bg1), var(--bg2));
  box-shadow: 0 1mm 3mm rgba(60,40,20,.14); }
.tvt-card::after { content: ""; position: absolute; inset: 2mm; border: 0.3mm solid color-mix(in srgb, var(--c) 48%, transparent);
  border-radius: 3.6mm; pointer-events: none; z-index: 2; }
.tvt-left { flex: 0 0 31mm; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.5mm; z-index: 1; }
.tvt-badge { width: 27mm; height: 27mm; flex: 0 0 auto; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 50% 42%, #fff, var(--bg1) 80%);
  border: 0.6mm solid var(--c); box-shadow: 0 0 0 1mm #fff, 0 0 0 1.6mm var(--ring); }
.tvt-badge span { font-family: 'Noto Serif SC','Songti SC','SimSun',serif; font-weight: 700; color: var(--c); line-height: 1.0; text-align: center; }
.tvt-badge span.hl1 { font-size: 14mm; }
.tvt-badge span.hl2 { font-size: 11.5mm; }
.tvt-badge span.hl3 { font-size: 7.8mm; letter-spacing: -0.2mm; }
.tvt-badge span.hl4 { font-size: 6.2mm; line-height: 1.05; }
.tvt-pill { max-width: 30mm; padding: 1mm 4mm; border-radius: 999px; background: var(--c); color: #fff; font-size: 3.1mm; font-weight: 700;
  line-height: 1.22; text-align: center; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tvt-right { flex: 1; min-width: 0; z-index: 1; padding-right: 1mm; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4mm; }
.tvt-ten { font-family: Georgia,'Times New Roman',serif; font-weight: 700; color: var(--c); text-transform: uppercase; letter-spacing: .3px; line-height: 1.08; }
.tvt-ten.tn1 { font-size: 7mm; }
.tvt-ten.tn2 { font-size: 6mm; }
.tvt-ten.tn3 { font-size: 5.2mm; }
.tvt-han { margin-top: 1mm; font-size: 4mm; line-height: 1.25; }
.tvt-han b { font-family: 'Noto Serif SC','Songti SC','SimSun',serif; color: var(--c); font-weight: 700; }
.tvt-han i { color: #6f5f47; font-style: italic; margin-left: 2mm; font-family: Georgia, serif; }
.tvt-div { display: flex; align-items: center; gap: 2.5mm; width: 52%; margin: 1.8mm 0; }
.tvt-div::before, .tvt-div::after { content: ""; flex: 1; height: 0.3mm; background: color-mix(in srgb, var(--c) 55%, transparent); }
.tvt-div em { color: var(--c); font-size: 3.4mm; font-style: normal; }
.tvt-line { font-size: 3.6mm; color: #2f2416; line-height: 1.42; max-width: 100%; }
.tvt-line b { color: var(--c); }
.tvt-cd { font-size: 3.5mm; color: #3a2c1b; line-height: 1.4; margin-top: 1.6mm; max-width: 100%;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tvt-wm { position: absolute; left: 4.5mm; bottom: 3mm; font-size: 3.4mm; color: color-mix(in srgb, var(--c) 50%, transparent); z-index: 0; }
.tvt-wm b { font-family: 'Noto Serif SC','Songti SC','SimSun',serif; }
</style>

<style>
/* Toàn cục: khi IN chỉ hiện overlay tem, ẩn hết app + thanh công cụ overlay. */
@media print {
  body > *:not(#vt-tem-root) { display: none !important; }
  #vt-tem-root { position: static !important; background: #fff !important; }
  #vt-tem-root .tvt-toolbar { display: none !important; }
  #vt-tem-root .tvt-scroll { overflow: visible !important; padding: 0 !important; }
  .tvt-sheet { width: auto !important; }
  @page { size: A4; margin: 8mm; }
}
</style>
