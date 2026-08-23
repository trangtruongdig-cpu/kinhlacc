<script setup lang="ts">
// Overlay IN TEM vị thuốc — nhận danh sách vị thuốc đã chọn ở tab Vị Thuốc, render thẻ đẹp
// (đĩa Hán + tên serif + Tính vị/Quy kinh, mỗi vị một tông màu như thẻ .vt-card), chọn số bản rồi in.
import { ref, computed } from 'vue'

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

// Danh sách thẻ đã nhân số bản
const printed = computed(() => {
  const n = Math.max(1, Math.min(30, copies.value || 1))
  const out: (HerbCard & { pal: (typeof PALETTE)[number]; g: string })[] = []
  for (const h of props.herbs) {
    const pal = PALETTE[((h.ci % 8) + 8) % 8]!
    for (let i = 0; i < n; i++) out.push({ ...h, pal, g: glyph(h) })
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
              <div class="tvt-badge"><span>{{ h.g }}</span></div>
              <div v-if="h.bp" class="tvt-pill">{{ h.bp }}</div>
            </div>
            <div class="tvt-right">
              <div class="tvt-ten">{{ h.ten }}</div>
              <div v-if="h.han || h.py" class="tvt-han">
                <b v-if="h.han">{{ h.han }}</b><i v-if="h.py">{{ h.py }}</i>
              </div>
              <div class="tvt-div"><em>❖</em></div>
              <div v-if="h.tv" class="tvt-line"><b>Tính vị:</b> {{ h.tv }}</div>
              <div v-if="h.quy" class="tvt-line"><b>Quy kinh:</b> {{ h.quy }}</div>
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
.tvt-sheet { width: 196mm; display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; align-content: start; }

.tvt-card { --c: #5b3f28; --bg1: #faf5ec; --bg2: #f2e7d2; --ring: #d8c6a6;
  position: relative; overflow: hidden; break-inside: avoid;
  display: flex; align-items: center; gap: 5mm; padding: 5mm 6mm 5mm 5mm;
  min-height: 58mm; border: 0.9mm solid var(--c); border-radius: 5mm;
  background: linear-gradient(150deg, var(--bg1), var(--bg2));
  box-shadow: 0 1mm 3mm rgba(60,40,20,.12), inset 0 0 0 0.5mm rgba(255,255,255,.55); }
.tvt-left { flex: 0 0 36mm; display: flex; flex-direction: column; align-items: center; gap: 3mm; z-index: 1; }
.tvt-badge { width: 30mm; height: 30mm; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 50% 42%, #fff, var(--bg1) 78%);
  border: 0.7mm solid var(--c); box-shadow: 0 0 0 1.1mm #fff, 0 0 0 1.7mm var(--ring); }
.tvt-badge span { font-family: 'Noto Serif SC','Songti SC','SimSun',serif; font-size: 13mm; font-weight: 700; color: var(--c); line-height: 1; text-align: center; }
.tvt-pill { padding: 1.3mm 5mm; border-radius: 999px; background: var(--c); color: #fff; font-size: 3.4mm; font-weight: 700; }
.tvt-right { flex: 1; z-index: 1; text-align: center; display: flex; flex-direction: column; align-items: center; }
.tvt-ten { font-family: Georgia,'Times New Roman',serif; font-size: 8.5mm; font-weight: 700; color: var(--c); text-transform: uppercase; letter-spacing: .5px; line-height: 1.05; }
.tvt-han { margin-top: 1.5mm; font-size: 4.8mm; }
.tvt-han b { font-family: 'Noto Serif SC','Songti SC','SimSun',serif; color: var(--c); font-weight: 700; }
.tvt-han i { color: #6f5f47; font-style: italic; margin-left: 3mm; font-family: Georgia, serif; }
.tvt-div { display: flex; align-items: center; gap: 3mm; width: 60%; margin: 2.5mm 0; }
.tvt-div::before, .tvt-div::after { content: ""; flex: 1; height: 0.35mm; background: color-mix(in srgb, var(--c) 55%, transparent); }
.tvt-div em { color: var(--c); font-size: 4mm; font-style: normal; }
.tvt-line { font-size: 4mm; color: #2f2416; line-height: 1.5; }
.tvt-line b { color: var(--c); }
.tvt-wm { position: absolute; left: 4mm; bottom: 3mm; font-size: 4mm; color: color-mix(in srgb, var(--c) 55%, transparent); z-index: 0; }
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
