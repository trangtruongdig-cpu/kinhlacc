<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'

/**
 * Bảng BỆNH CƠ tự suy (Thương Hàn) — mode ② của ThuongHanView.
 * Với mỗi thể bệnh: tạng phủ tổn thương · khí tác động · giai đoạn (Lục Kinh HOẶC
 * Vệ-Khí-Dinh-Huyết) — suy từ dữ liệu khách quan, đối chiếu ô đã điền, cho GHI ĐÈ tay.
 */
interface GiaiDoan {
  he: 'luc-kinh' | 'on-benh'
  slug?: string
  phan?: string
  ten: string; han: string; tang_phu: string; khi: string; vi_tri: string
  do_tin: 'cao' | 'vua' | 'thap'
  nguon: string; yeu?: boolean; phan_phu?: string | null
  tam_tieu?: { tieu: string; han: string; nguon: string } | null
  ly_do: string[]; votes: { k: string; v: number }[]
}
interface Override {
  id_phap_tri: number; he: string | null; giai_doan_slug: string | null
  tang_phu: string | null; khi: string | null; ghi_chu: string | null
}
interface Row {
  id: number; the_benh: string | null; nguyen_tac: string | null
  giai_doan: GiaiDoan | null
  tang_phu: { organ: string[]; nguon: string; do_tin: string; hanh: string | null }
  khi: { khi: string; nguon: string }[]
  tinh_chat: string[]; so_bai: number; so_vi: number; so_trieu_chung: number
  doi_chieu: { khi: string; giai_doan: string; user_khi: string[]; user_kinh: string[]; user_phan: string[] }
  override: Override | null
  suy_goc?: { label: string; ten: string } | null
}
interface Summary {
  tong: number; chuaSuy: number; soLucKinh: number; soOnBenh: number; soYeu: number; soGhiDe: number
  theoKinh: { slug: string; ten: string; n: number }[]
  theoPhan: { phan: string; ten: string; n: number }[]
  doTin: Record<string, number>
  doiChieuKhi: Record<string, number>
  doiChieuGiaiDoan: Record<string, number>
}
interface VanDe { muc?: string; mo_ta?: string; muc_do?: string }
interface Consistency { nhan_xet?: string; van_de?: VanDe[] }

const KNAME: Record<string, string> = {
  'thai-duong': 'Thái Dương', 'duong-minh': 'Dương Minh', 'thieu-duong': 'Thiếu Dương',
  'thai-am': 'Thái Âm', 'thieu-am': 'Thiếu Âm', 'quyet-am': 'Quyết Âm',
}
const COLOR: Record<string, string> = {
  'thai-duong': '#2f6f9f', 'duong-minh': '#c68a24', 'thieu-duong': '#4f9e6a',
  'thai-am': '#b07a2e', 'thieu-am': '#3a4a86', 'quyet-am': '#2f8a76',
  'Vệ Phận': '#c98a95', 'Khí Phận': '#c56f66', 'Dinh Phận': '#a83f52', 'Huyết Phận': '#7f2436',
}
const KINH_SLUGS = ['thai-duong', 'duong-minh', 'thieu-duong', 'thai-am', 'thieu-am', 'quyet-am']
const PHANS = ['Vệ Phận', 'Khí Phận', 'Dinh Phận', 'Huyết Phận']
const GDORDER = [...KINH_SLUGS, ...PHANS]
// Tam Tiêu (三焦) — trục định vị ôn bệnh (kèm với phận Vệ-Khí-Dinh-Huyết)
const TAM_TIEU = ['Thượng Tiêu', 'Trung Tiêu', 'Hạ Tiêu']
const TT_COLOR: Record<string, string> = { 'Thượng Tiêu': '#5a9bd4', 'Trung Tiêu': '#d99a3c', 'Hạ Tiêu': '#7b5ea8' }
const gdKey = (g: GiaiDoan | null): string => (g ? (g.he === 'on-benh' ? g.phan! : g.slug!) : '')
const colorOf = (g: GiaiDoan | null): string => (g ? COLOR[gdKey(g)] ?? '#8a7e6d' : '#8a7e6d')

const rows = ref<Row[]>([])
const summary = ref<Summary | null>(null)
const consistency = ref<Consistency | null>(null)
const loading = ref(true)
const err = ref('')
const query = ref('')
const fKinh = ref<Set<string>>(new Set())
const fConf = ref<Set<string>>(new Set())
const fDc = ref<Set<string>>(new Set())
const fTieu = ref<Set<string>>(new Set())
const openId = ref<number | null>(null)

async function load() {
  loading.value = true; err.value = ''
  try {
    const data = await api.get<{ results: Row[]; summary: Summary; consistency: Consistency | null }>('/thuong-han/benh-co')
    rows.value = data.results ?? []
    summary.value = data.summary ?? null
    consistency.value = data.consistency ?? null
  } catch {
    err.value = 'Không tải được bệnh cơ. Kiểm tra kết nối / đăng nhập, hoặc backend chưa cập nhật.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

function toggleSet(r: { value: Set<string> }, v: string) {
  const s = new Set(r.value)
  if (s.has(v)) s.delete(v); else s.add(v)
  r.value = s
}
const toggleKinh = (v: string) => toggleSet(fKinh, v)
const toggleConf = (v: string) => toggleSet(fConf, v)
const toggleDc = (v: string) => toggleSet(fDc, v)
const toggleTieu = (v: string) => toggleSet(fTieu, v)
const CONF_OPTS: [string, string][] = [['cao', 'Tin cao'], ['vua', 'Tin vừa'], ['thap', 'Tin thấp'], ['yeu', 'Định hướng yếu']]
const DC_OPTS: [string, string][] = [['lech', '⚠ Lệch'], ['xh', '⇄ Khác hệ'], ['bs', '+ Bổ sung'], ['khop', '✓ Khớp']]
function dcInfo(r: Row): { cls: string; txt: string } {
  const g = r.doi_chieu.giai_doan
  if (g === 'lệch') return { cls: 'lech', txt: '⚠ Lệch giai đoạn' }
  if (g === 'khớp') return { cls: 'khop', txt: '✓ Khớp' }
  if (g === 'khác-hệ') return { cls: 'xh', txt: '⇄ Khác hệ' }
  if (g === 'lý-thuyết-bổ-sung') return { cls: 'bs', txt: '+ Bổ sung' }
  if (r.doi_chieu.khi === 'lệch') return { cls: 'lech', txt: '⚠ Lệch khí' }
  return { cls: 'na', txt: '—' }
}

const filtered = computed<Row[]>(() => {
  const q = query.value.toLowerCase().trim()
  return rows.value.filter((r) => {
    const g = r.giai_doan
    if (q) {
      const h = `${r.the_benh ?? ''} ${r.nguyen_tac ?? ''} ${r.tang_phu.organ.join(' ')} ${r.khi.map((k) => k.khi).join(' ')}`.toLowerCase()
      if (!h.includes(q)) return false
    }
    if (fKinh.value.size && !(g && fKinh.value.has(gdKey(g)))) return false
    if (fConf.value.size) {
      const okC = g && fConf.value.has(g.do_tin)
      const okY = fConf.value.has('yeu') && g && g.yeu
      if (!(okC || okY)) return false
    }
    if (fDc.value.size) {
      const gg = r.doi_chieu.giai_doan
      const key = gg === 'lệch' || r.doi_chieu.khi === 'lệch' ? 'lech'
        : gg === 'khác-hệ' ? 'xh' : gg === 'lý-thuyết-bổ-sung' ? 'bs' : gg === 'khớp' ? 'khop' : 'other'
      if (!fDc.value.has(key)) return false
    }
    if (fTieu.value.size && !(g && g.tam_tieu && fTieu.value.has(g.tam_tieu.tieu))) return false
    return true
  }).sort((a, b) => GDORDER.indexOf(gdKey(a.giai_doan)) - GDORDER.indexOf(gdKey(b.giai_doan)) || a.id - b.id)
})

// ---- Ghi đè tay ----
const editId = ref<number | null>(null)
const form = ref({ giai_doan_slug: '', tang_phu: '', khi: '', ghi_chu: '' })
const saving = ref(false)
function startEdit(r: Row) {
  editId.value = r.id
  const g = r.giai_doan
  form.value = {
    giai_doan_slug: r.override?.giai_doan_slug ?? (g ? gdKey(g) : ''),
    tang_phu: r.override?.tang_phu ?? r.tang_phu.organ.join(', '),
    khi: r.override?.khi ?? r.khi.map((k) => k.khi).join(', '),
    ghi_chu: r.override?.ghi_chu ?? '',
  }
}
async function saveEdit(id: number) {
  saving.value = true
  try {
    const slug = form.value.giai_doan_slug
    const he = slug ? (KINH_SLUGS.includes(slug) ? 'luc-kinh' : 'on-benh') : null
    await api.put(`/thuong-han/benh-co/${id}`, { he, giai_doan_slug: slug || null, tang_phu: form.value.tang_phu, khi: form.value.khi, ghi_chu: form.value.ghi_chu })
    editId.value = null
    await load()
  } catch {
    err.value = 'Lưu ghi đè thất bại.'
  } finally {
    saving.value = false
  }
}
async function clearEdit(id: number) {
  saving.value = true
  try {
    await api.put(`/thuong-han/benh-co/${id}`, { giai_doan_slug: '', tang_phu: '', khi: '', ghi_chu: '' })
    editId.value = null
    await load()
  } catch { err.value = 'Xoá ghi đè thất bại.' } finally { saving.value = false }
}

const dc = computed(() => summary.value?.doiChieuGiaiDoan ?? {})
const dck = computed(() => summary.value?.doiChieuKhi ?? {})
const phanShown = computed(() => (summary.value?.theoPhan ?? []).filter((p) => p.n > 0))
const tamTieuDist = computed(() => {
  const m: Record<string, number> = {}
  for (const r of rows.value) { const t = r.giai_doan?.tam_tieu?.tieu; if (t) m[t] = (m[t] || 0) + 1 }
  return TAM_TIEU.map((t) => ({ tieu: t, n: m[t] || 0 })).filter((x) => x.n > 0)
})
const distTot = computed(() => (summary.value?.theoKinh ?? []).reduce((a, b) => a + b.n, 0) || 1)
</script>

<template>
  <div class="bc">
    <p v-if="loading" class="bc-msg">Đang chạy engine suy bệnh cơ trên toàn kho…</p>
    <p v-else-if="err" class="bc-msg err">{{ err }}</p>

    <template v-else-if="summary">
      <!-- Cards -->
      <div class="bc-cards">
        <div class="bc-card"><span class="k">Thể bệnh</span><b class="v">{{ summary.tong }}</b><span class="n">toàn kho pháp trị</span></div>
        <div class="bc-card"><span class="k">Định vị được</span><b class="v">{{ Math.round((summary.tong - summary.chuaSuy) / summary.tong * 100) }}%</b><span class="n">{{ summary.soLucKinh }} Lục Kinh · {{ summary.soOnBenh }} ôn bệnh phận</span></div>
        <div class="bc-card"><span class="k">Độ tin cao + vừa</span><b class="v">{{ (summary.doTin.cao || 0) + (summary.doTin.vua || 0) }}</b><span class="n">{{ summary.doTin.cao || 0 }} cao · {{ summary.doTin.vua || 0 }} vừa · {{ summary.soYeu }} yếu</span></div>
        <div class="bc-card warn"><span class="k">Lệch cần soi</span><b class="v">{{ dc['lệch'] || 0 }}</b><span class="n">khác ô bạn ghi (cùng hệ)</span></div>
        <div class="bc-card add"><span class="k">Đã ghi đè tay</span><b class="v">{{ summary.soGhiDe }}</b><span class="n">bạn đã xác nhận/chỉnh</span></div>
      </div>

      <!-- Distribution -->
      <div class="bc-dist">
        <div class="bar">
          <div v-for="k in summary.theoKinh" :key="k.slug" :style="{ flex: k.n || 0.001, background: COLOR[k.slug] }" :title="`${k.ten}: ${k.n}`">
            <span v-if="k.n / distTot > 0.06">{{ k.n }}</span>
          </div>
        </div>
        <div class="legend">
          <span v-for="k in summary.theoKinh" :key="k.slug"><i class="dot" :style="{ background: COLOR[k.slug] }"></i>{{ k.ten }} · <b>{{ k.n }}</b></span>
        </div>
        <div class="axis">
          <span><b>Ôn bệnh (Vệ-Khí-Dinh-Huyết):</b></span>
          <span v-for="p in phanShown" :key="p.phan"><i class="dot" :style="{ background: COLOR[p.phan] }"></i>{{ p.ten }} · <b>{{ p.n }}</b></span>
          <span v-if="!phanShown.length">—</span>
          <span class="grow">⚠ <b>{{ summary.soYeu }}</b> ca "định hướng yếu" (chỉ suy từ quy kinh vị thuốc — cần soi tay)</span>
        </div>
        <div class="axis" v-if="tamTieuDist.length">
          <span><b>Tam Tiêu (三焦 · định vị ôn bệnh):</b></span>
          <span v-for="t in tamTieuDist" :key="t.tieu"><i class="dot" :style="{ background: TT_COLOR[t.tieu] }"></i>{{ t.tieu }} · <b>{{ t.n }}</b></span>
        </div>
      </div>

      <!-- Controls -->
      <div class="bc-controls">
        <input v-model="query" class="bc-q" placeholder="Tìm thể bệnh / nguyên tắc / tạng phủ / khí…" />
        <span class="bc-count">{{ filtered.length }} / {{ rows.length }}</span>
      </div>
      <div class="bc-filters">
        <button v-for="s in KINH_SLUGS" :key="s" class="fchip" :aria-pressed="fKinh.has(s)" @click="toggleKinh(s)"><i class="dot" :style="{ background: COLOR[s] }"></i>{{ KNAME[s] }}</button>
        <button v-for="p in PHANS" :key="p" class="fchip" :aria-pressed="fKinh.has(p)" @click="toggleKinh(p)"><i class="dot" :style="{ background: COLOR[p] }"></i>{{ p }}</button>
        <span class="sep"></span>
        <button v-for="c in CONF_OPTS" :key="c[0]" class="fchip" :aria-pressed="fConf.has(c[0])" @click="toggleConf(c[0])">{{ c[1] }}</button>
        <span class="sep"></span>
        <button v-for="d in DC_OPTS" :key="d[0]" class="fchip" :class="{ warn: d[0] === 'lech' }" :aria-pressed="fDc.has(d[0])" @click="toggleDc(d[0])">{{ d[1] }}</button>
        <span class="sep"></span>
        <button v-for="t in TAM_TIEU" :key="t" class="fchip" :aria-pressed="fTieu.has(t)" @click="toggleTieu(t)"><i class="dot" :style="{ background: TT_COLOR[t] }"></i>{{ t }}</button>
      </div>

      <!-- Table -->
      <div class="bc-tblwrap">
        <table class="bc-tbl">
          <thead><tr><th></th><th>Thể bệnh</th><th>Giai đoạn</th><th>Tạng phủ tổn thương</th><th>Khí tác động</th><th>Đối chiếu</th></tr></thead>
          <tbody>
            <template v-for="r in filtered" :key="r.id">
              <tr class="drow" :class="{ open: openId === r.id }" @click="openId = openId === r.id ? null : r.id">
                <td class="stripe" :style="{ background: colorOf(r.giai_doan) }"></td>
                <td class="the"><b>{{ r.the_benh }}</b><small>{{ r.nguyen_tac }}</small></td>
                <td>
                  <template v-if="r.giai_doan">
                    <span class="badge" :style="{ background: colorOf(r.giai_doan) }">{{ r.giai_doan.ten }}<i class="han">{{ r.giai_doan.han }}</i><em v-if="r.giai_doan.yeu" class="yeu">yếu</em></span>
                    <span v-if="r.giai_doan.tam_tieu" class="tt" :style="{ color: TT_COLOR[r.giai_doan.tam_tieu.tieu], borderColor: TT_COLOR[r.giai_doan.tam_tieu.tieu] }" :title="`Tam Tiêu ${r.giai_doan.tam_tieu.han}`">{{ r.giai_doan.tam_tieu.tieu }}</span>
                    <span class="conf" :class="r.giai_doan.do_tin">{{ r.giai_doan.do_tin }}</span>
                    <span v-if="r.override" class="ov" title="đã ghi đè tay">✎</span>
                  </template>
                  <span v-else class="tag">chưa suy</span>
                </td>
                <td><span v-for="o in r.tang_phu.organ" :key="o" class="tag">{{ o }}</span><span v-if="!r.tang_phu.organ.length" class="na">—</span></td>
                <td><span v-for="k in r.khi" :key="k.khi" class="tag">{{ k.khi }}</span><span v-if="!r.khi.length" class="na">—</span></td>
                <td><span class="dc" :class="dcInfo(r).cls">{{ dcInfo(r).txt }}</span></td>
              </tr>
              <tr v-if="openId === r.id" class="detail">
                <td></td>
                <td colspan="5">
                  <div class="dgrid">
                    <div>
                      <h4>Vì sao suy ra</h4>
                      <ul class="reasons"><li v-for="(x, i) in (r.giai_doan?.ly_do?.length ? r.giai_doan.ly_do : ['(chỉ tín hiệu phụ)'])" :key="i">{{ x }}</li></ul>
                      <div class="votes"><span v-for="v in r.giai_doan?.votes || []" :key="v.k" class="vpill">{{ KNAME[v.k] || v.k }}: {{ v.v }}</span></div>
                    </div>
                    <div>
                      <h4>{{ r.giai_doan?.he === 'on-benh' ? 'Bối cảnh Ôn bệnh' : 'Bối cảnh Lục Kinh' }}</h4>
                      <p class="ctx" v-if="r.giai_doan"><b>{{ r.giai_doan.ten }} {{ r.giai_doan.han }}</b> — {{ r.giai_doan.tang_phu }}<br>Khí: {{ r.giai_doan.khi }}<br>Vị trí: {{ r.giai_doan.vi_tri }}<span v-if="r.giai_doan.tam_tieu"><br>Tam Tiêu: <b :style="{ color: TT_COLOR[r.giai_doan.tam_tieu.tieu] }">{{ r.giai_doan.tam_tieu.han }} {{ r.giai_doan.tam_tieu.tieu }}</b> <em class="ttsrc">({{ r.giai_doan.tam_tieu.nguon }})</em></span><br>Nguồn suy: <b>{{ r.giai_doan.nguon }}</b><span v-if="r.giai_doan.phan_phu"><br>Kèm ôn bệnh: {{ r.giai_doan.phan_phu }}</span></p>
                      <p class="ctx">Bát cương: <span v-for="t in r.tinh_chat" :key="t" class="tag">{{ t }}</span><span v-if="!r.tinh_chat.length">—</span></p>
                    </div>
                    <div>
                      <h4>Đối chiếu ô bạn điền</h4>
                      <p class="ctx">Khí: <b>{{ r.doi_chieu.user_khi.join(', ') || '(trống)' }}</b><br>Kinh: <b>{{ r.doi_chieu.user_kinh.map((s) => KNAME[s]).join(', ') || '(trống)' }}</b><br>Phận: <b>{{ r.doi_chieu.user_phan.join(', ') || '(trống)' }}</b><br>Dữ liệu: {{ r.so_bai }} bài · {{ r.so_vi }} vị · {{ r.so_trieu_chung }} tr/chứng</p>
                    </div>
                  </div>

                  <!-- Override editor -->
                  <div class="editor" @click.stop>
                    <template v-if="editId === r.id">
                      <div class="ed-grid">
                        <label>Giai đoạn
                          <select v-model="form.giai_doan_slug">
                            <option value="">— không đặt —</option>
                            <optgroup label="Lục Kinh (thương hàn)">
                              <option v-for="s in KINH_SLUGS" :key="s" :value="s">{{ KNAME[s] }}</option>
                            </optgroup>
                            <optgroup label="Ôn bệnh phận">
                              <option v-for="p in PHANS" :key="p" :value="p">{{ p }}</option>
                            </optgroup>
                          </select>
                        </label>
                        <label>Tạng phủ<input v-model="form.tang_phu" placeholder="vd: Tỳ, Vị" /></label>
                        <label>Khí<input v-model="form.khi" placeholder="vd: Hàn, Thấp" /></label>
                        <label class="wide">Ghi chú<input v-model="form.ghi_chu" placeholder="lý do chỉnh…" /></label>
                      </div>
                      <div class="ed-act">
                        <button class="btn primary" :disabled="saving" @click="saveEdit(r.id)">Lưu ghi đè</button>
                        <button class="btn" :disabled="saving" @click="editId = null">Huỷ</button>
                        <button v-if="r.override" class="btn danger" :disabled="saving" @click="clearEdit(r.id)">Xoá ghi đè → trả về tự suy</button>
                      </div>
                    </template>
                    <template v-else>
                      <div class="ov-info" v-if="r.override">
                        <span>✎ Đang dùng bản <b>ghi đè tay</b><span v-if="r.suy_goc"> · engine suy: {{ r.suy_goc.ten }}</span></span>
                        <button class="btn" @click="startEdit(r)">Sửa ghi đè</button>
                      </div>
                      <button v-else class="btn" @click="startEdit(r)">✎ Ghi đè / xác nhận bệnh cơ này</button>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Footer / provenance -->
      <div class="bc-foot">
        <p><b>Cơ chế</b> (không dùng ô bệnh cơ bạn tự điền làm nguồn): <b>Giai đoạn</b> theo hai trục — Lục Kinh (luật thể bệnh→kinh · phương chứng · đề cương · quy kinh vị thuốc khử thiên lệch) hoặc Vệ-Khí-Dinh-Huyết (khi thể bệnh mang bản chất ôn nhiệt). <b>Tạng phủ</b> ← tên tạng/phủ trong thể bệnh. <b>Khí</b> ← lục dâm trong mô tả + tính bài thuốc (trị nghịch). Nhãn <em class="yeu-lbl">yếu</em> = chỉ từ quy kinh vị thuốc (cần soi). <b>Khác hệ</b> = bạn ghi ôn bệnh phận còn engine ra Lục Kinh (khác hệ phân loại, không phải lỗi).</p>
        <details v-if="consistency?.van_de?.length" class="crit">
          <summary>Ghi chú thẩm định CHUẨN ({{ consistency.van_de.length }} điểm)</summary>
          <p class="nx">{{ consistency.nhan_xet }}</p>
          <ul><li v-for="(v, i) in consistency.van_de" :key="i"><b>{{ v.muc }}</b> ({{ v.muc_do }}): {{ v.mo_ta }}</li></ul>
        </details>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bc { display: flex; flex-direction: column; gap: 16px; }
.bc-msg { font-size: 14px; color: var(--text-muted, #8a7a60); padding: 24px; text-align: center; }
.bc-msg.err { color: #b0342a; }

.bc-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.bc-card { background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: 12px; padding: 13px 15px; display: flex; flex-direction: column; gap: 2px; }
.bc-card.warn { border-left: 4px solid #c77b1f; }
.bc-card.add { border-left: 4px solid #2f6f9f; }
.bc-card .k { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted, #8a7a60); font-weight: 700; }
.bc-card .v { font-size: 27px; font-weight: 800; color: var(--brown-700, #6b4a24); font-variant-numeric: tabular-nums; }
.bc-card .n { font-size: 12px; color: var(--text, #3a2c1a); }

.bc-dist { background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: 12px; padding: 14px 16px; }
.bar { display: flex; height: 30px; border-radius: 7px; overflow: hidden; border: 1px solid var(--border, #e7ddcd); }
.bar > div { display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; min-width: 0; }
.legend, .axis { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; font-size: 12.5px; color: var(--text, #3a2c1a); align-items: center; }
.axis { border-top: 1px dashed var(--border, #e7ddcd); padding-top: 9px; }
.axis .grow { margin-left: auto; }
.dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; margin-right: 5px; vertical-align: -1px; }

.bc-controls { display: flex; gap: 10px; align-items: center; }
.bc-q { flex: 1; padding: 9px 13px; border: 1px solid var(--border, #e7ddcd); border-radius: 9px; font: inherit; font-size: 14px; background: var(--surface, #fff); color: var(--text, #3a2c1a); }
.bc-q:focus { outline: 2px solid var(--brown-500, #a4743a); }
.bc-count { font-size: 13px; color: var(--text-muted, #8a7a60); font-variant-numeric: tabular-nums; }
.bc-filters { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
.fchip { font: inherit; font-size: 12.5px; padding: 5px 11px; border: 1px solid var(--border, #e7ddcd); border-radius: 999px; background: var(--surface, #fff); color: var(--text, #3a2c1a); cursor: pointer; }
.fchip[aria-pressed="true"] { background: var(--brown-700, #6b4a24); color: #fff; border-color: var(--brown-700, #6b4a24); }
.fchip.warn[aria-pressed="true"] { background: #c77b1f; border-color: #c77b1f; }
.fchip .dot { margin-right: 5px; }
.sep { width: 1px; height: 20px; background: var(--border, #e7ddcd); margin: 0 3px; }

.bc-tblwrap { overflow-x: auto; border: 1px solid var(--border, #e7ddcd); border-radius: 12px; background: var(--surface, #fff); }
.bc-tbl { border-collapse: collapse; width: 100%; min-width: 780px; font-size: 13.5px; }
.bc-tbl thead th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted, #8a7a60); border-bottom: 2px solid var(--border, #e7ddcd); background: var(--brown-50, #f7efe2); white-space: nowrap; }
.drow { border-bottom: 1px solid var(--border, #e7ddcd); cursor: pointer; }
.drow:hover { background: var(--brown-50, #f7efe2); }
.drow.open { background: var(--brown-50, #f7efe2); }
.bc-tbl td { padding: 9px 12px; vertical-align: top; }
.stripe { width: 5px; padding: 0 !important; }
.the b { font-weight: 700; color: var(--text, #3a2c1a); }
.the small { display: block; color: var(--text-muted, #8a7a60); font-size: 12px; margin-top: 2px; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; color: #fff; font-weight: 700; font-size: 12.5px; white-space: nowrap; }
.badge .han { font-style: normal; font-weight: 400; opacity: .85; }
.badge .yeu { font-style: normal; font-size: 10px; padding: 0 4px; border: 1px dashed rgba(255,255,255,.7); border-radius: 4px; margin-left: 3px; }
.conf { font-size: 11px; padding: 2px 7px; border-radius: 6px; font-weight: 700; margin-left: 5px; }
.conf.cao { background: rgba(79,158,106,.16); color: #3e8557; }
.conf.vua { background: rgba(199,123,31,.15); color: #b06d18; }
.conf.thap { background: #eee5d3; color: #8a7a60; }
.tt { display: inline-block; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 6px; border: 1px solid; background: #fff; margin-left: 5px; white-space: nowrap; vertical-align: 1px; }
.ttsrc { font-style: normal; color: var(--text-muted, #8a7a60); font-size: 11px; }
.ov { color: var(--brown-600, #6b4a24); margin-left: 4px; font-weight: 700; }
.tag { display: inline-block; font-size: 12px; padding: 1px 7px; border-radius: 6px; background: #eee5d3; color: var(--text, #3a2c1a); margin: 1px 3px 1px 0; white-space: nowrap; }
.na { color: var(--text-muted, #8a7a60); }
.dc { font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.dc.khop { color: #3e8557; } .dc.lech { color: #b0342a; } .dc.bs { color: #2f6f9f; } .dc.xh { color: #6b74b0; } .dc.na { color: var(--text-muted, #8a7a60); font-weight: 400; }

.detail { background: var(--brown-50, #f7efe2); }
.detail td { padding: 14px 16px; }
.dgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
.dgrid h4 { margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted, #8a7a60); }
.reasons { margin: 0; padding: 0; list-style: none; font-size: 13px; color: var(--text, #3a2c1a); }
.reasons li { padding: 1px 0; } .reasons li::before { content: "› "; color: var(--brown-500, #a4743a); }
.votes { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
.vpill { font-size: 11px; padding: 1px 7px; border-radius: 6px; background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); color: var(--text-muted, #8a7a60); }
.ctx { font-size: 13px; color: var(--text, #3a2c1a); line-height: 1.55; margin: 0 0 6px; }

.editor { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border, #e7ddcd); }
.ed-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.ed-grid label { display: flex; flex-direction: column; gap: 3px; font-size: 12px; font-weight: 700; color: var(--brown-600, #6b4a24); }
.ed-grid label.wide { grid-column: 1 / -1; }
.ed-grid input, .ed-grid select { font: inherit; font-size: 13px; font-weight: 400; padding: 7px 9px; border: 1px solid var(--border, #e7ddcd); border-radius: 8px; background: var(--surface, #fff); color: var(--text, #3a2c1a); }
.ed-act { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.ov-info { display: flex; gap: 12px; align-items: center; font-size: 13px; color: var(--brown-700, #6b4a24); flex-wrap: wrap; }
.btn { font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; padding: 7px 13px; border-radius: 8px; border: 1px solid var(--border, #e7ddcd); background: var(--surface, #fff); color: var(--text, #3a2c1a); }
.btn:hover:not(:disabled) { border-color: var(--brown-400, #b98a4e); }
.btn.primary { background: var(--brown-600, #6b4a24); color: #fff; border-color: var(--brown-600, #6b4a24); }
.btn.danger { color: #b0342a; border-color: #e0b5ae; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.bc-foot { font-size: 12.5px; color: var(--text, #3a2c1a); line-height: 1.6; border-top: 1px solid var(--border, #e7ddcd); padding-top: 14px; }
.yeu-lbl { font-style: normal; font-size: 10px; padding: 0 5px; border: 1px dashed var(--brown-400, #b98a4e); border-radius: 4px; color: var(--brown-600, #6b4a24); }
.crit { margin-top: 10px; background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: 10px; padding: 8px 14px; }
.crit summary { cursor: pointer; font-weight: 700; color: var(--brown-700, #6b4a24); }
.crit .nx { font-size: 13px; color: var(--text, #3a2c1a); margin: 8px 0; }
.crit ul { font-size: 12.5px; margin: 6px 0; padding-left: 18px; }

@media (max-width: 720px) { .bc-cards { grid-template-columns: repeat(2, 1fr); } }
</style>
