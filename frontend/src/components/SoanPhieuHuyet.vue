<script setup lang="ts">
// Overlay SOẠN PHIẾU HUYỆT — chọn huyệt ở tab Huyệt Vị rồi soạn nhanh cột "vị thuốc tương ứng"
// trước khi in. Phiếu KHÔNG được lưu: soạn xong in luôn, giống in tem vị thuốc.
//
// Việc dựng ảnh thân người phải mượn trang Kinh Mạch 3D (engine chỉ sống ở đó): ghi payload vào
// sessionStorage rồi mở /app/kinh-mach-3d?diagram=<mã,...>, trang đó chụp ảnh, mở cửa sổ phiếu in
// và tự đóng lại. Cùng đường đi với "Phiếu châm huyệt" ở trang Kết Quả Đo.
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

export interface HuyetChon {
  idHuyet: number
  ten_huyet: string | null
  ma_huyet: string | null
  tac_dung: string | null
  id_vi_thuoc?: number | null
  cong_nang_ghep?: string | null
  viThuoc?: { id: number; ten_vi_thuoc: string | null; ten_han: string | null } | null
}

interface DongPhieu {
  idHuyet: number
  code: string // mã cho engine 3D: bỏ gạch nối ("LR-13" → "LR13")
  ma: string // mã hiển thị trên phiếu
  ten: string
  viThuoc: string
  han: string
  congNang: string
  tacDung: string // tác dụng ghi trong từ điển huyệt — chỉ dùng làm gợi ý cho ô công năng
  idViThuoc: number | null
  luuGhep: boolean // tick = ghi ghép này vào bảng huyệt để lần sau điền sẵn
}

const props = defineProps<{ huyet: HuyetChon[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const router = useRouter()

const tenPhieu = ref('')
const dangIn = ref(false)
const loi = ref<string | null>(null)

// Mã huyệt trong DB ghi kiểu "LR-13"/"LR13" tuỳ bản ghi; engine 3D chỉ nhận mã liền ("LR13").
const chuanHoaMa = (ma: string | null): string => (ma || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

const rows = ref<DongPhieu[]>([])

onMounted(() => {
  rows.value = props.huyet.map((h) => ({
    idHuyet: h.idHuyet,
    code: chuanHoaMa(h.ma_huyet),
    ma: h.ma_huyet || '',
    ten: h.ten_huyet || '',
    viThuoc: h.viThuoc?.ten_vi_thuoc || '',
    han: h.viThuoc?.ten_han || '',
    congNang: h.cong_nang_ghep || '',
    tacDung: (h.tac_dung || '').slice(0, 60),
    idViThuoc: h.id_vi_thuoc ?? null,
    luuGhep: false,
  }))
})

const thieuMa = computed(() => rows.value.filter((r) => !r.code))
const soDaGhep = computed(() => rows.value.filter((r) => r.viThuoc.trim()).length)

// ── Gợi ý vị thuốc: tra /vi-thuoc/lite theo ô đang gõ, lấy luôn tên Hán để khỏi nhập tay ──
const goiY = ref<Array<{ id: number; ten: string; han: string }>>([])
const dongDangGoiY = ref<number | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

function timViThuoc(i: number, tu: string) {
  dongDangGoiY.value = i
  if (timer) clearTimeout(timer)
  const q = tu.trim()
  if (q.length < 2) {
    goiY.value = []
    return
  }
  timer = setTimeout(async () => {
    try {
      const res: unknown = await api.get(`/vi-thuoc/lite?limit=8&q=${encodeURIComponent(q)}`)
      const data = (res as { data?: Array<Record<string, unknown>> })?.data ?? []
      goiY.value = data.map((v) => ({
        id: Number(v.id),
        ten: String(v.ten_vi_thuoc ?? ''),
        han: String(v.ten_han ?? ''),
      }))
    } catch {
      goiY.value = []
    }
  }, 250)
}

function chonGoiY(i: number, g: { id: number; ten: string; han: string }) {
  const r = rows.value[i]
  if (!r) return
  r.viThuoc = g.ten
  r.han = g.han
  r.idViThuoc = g.id
  goiY.value = []
  dongDangGoiY.value = null
}

function xoaDong(i: number) {
  rows.value.splice(i, 1)
}

/** Ghi ghép huyệt ⇄ vị thuốc vào bảng huyệt cho những dòng được tick "lưu". */
async function luuCacGhepDuocTick() {
  const canLuu = rows.value.filter((r) => r.luuGhep)
  for (const r of canLuu) {
    await api.put(`/huyet-vi/${r.idHuyet}`, {
      id_vi_thuoc: r.idViThuoc,
      cong_nang_ghep: r.congNang.trim() || null,
    })
  }
  return canLuu.length
}

async function inPhieu() {
  loi.value = null
  const dung = rows.value.filter((r) => r.code)
  if (!dung.length) {
    loi.value = 'Không huyệt nào có mã dùng được cho đồ hình 3D — phiếu sẽ không có chấm nào để vẽ.'
    return
  }
  dangIn.value = true
  try {
    if (rows.value.some((r) => r.luuGhep)) {
      try {
        await luuCacGhepDuocTick()
      } catch (e) {
        // Lưu ghép hỏng thì vẫn in được — phiếu lấy số liệu từ bảng đang soạn, không từ DB.
        loi.value = 'Đã in nhưng KHÔNG lưu được ghép vị thuốc: ' + (e instanceof Error ? e.message : String(e))
      }
    }
    const payload = {
      patientName: '',
      examDate: '',
      theBenh: tenPhieu.value.trim(),
      loai: 'phuong-huyet' as const,
      groups: [
        {
          method: tenPhieu.value.trim() || 'Phương huyệt',
          items: dung.map((r) => ({
            code: r.code,
            name: r.ten,
            viThuoc: r.viThuoc.trim() || undefined,
            han: r.han.trim() || undefined,
            yNghia: r.congNang.trim() || undefined,
          })),
        },
      ],
    }
    try {
      sessionStorage.setItem('kinhlac:acu-print-payload', JSON.stringify(payload))
    } catch {}
    const url = router.resolve({
      name: 'kinh-mach-3d',
      query: { diagram: dung.map((r) => r.code).join(','), from: 'huyet-vi', view: '2' },
    }).href
    const w = window.open(url, '_blank')
    if (!w) {
      loi.value = 'Trình duyệt đang chặn cửa sổ mới. Cho phép pop-up cho trang này rồi in lại.'
      return
    }
    emit('close')
  } finally {
    dangIn.value = false
  }
}
</script>

<template>
  <div class="sph-backdrop" @click.self="emit('close')">
    <div class="sph-modal">
      <div class="sph-head">
        <div>
          <h3>Soạn phiếu huyệt</h3>
          <p class="sph-sub">
            {{ rows.length }} huyệt · đã có vị thuốc: {{ soDaGhep }}/{{ rows.length }}
          </p>
        </div>
        <button type="button" class="sph-x" @click="emit('close')">✕</button>
      </div>

      <div class="sph-toolbar">
        <label class="sph-field">
          <span>Tên phiếu (in làm tiêu đề)</span>
          <input v-model="tenPhieu" type="text" placeholder="VD: Tứ Quân Tử · Bổ khí" />
        </label>
      </div>

      <div v-if="thieuMa.length" class="sph-warn">
        ⚠ {{ thieuMa.length }} huyệt không có mã quốc tế nên sẽ không hiện trên đồ hình:
        {{ thieuMa.map((r) => r.ten).join(', ') }}
      </div>
      <div v-if="loi" class="sph-err">{{ loi }}</div>

      <div class="sph-table-wrap">
        <table class="sph-table">
          <thead>
            <tr>
              <th style="width: 30px">#</th>
              <th style="width: 30%">Huyệt</th>
              <th style="width: 28%">Vị thuốc tương ứng</th>
              <th>Công năng (in dưới tên vị thuốc)</th>
              <th style="width: 58px" title="Lưu ghép này vào huyệt để lần sau điền sẵn">Lưu</th>
              <th style="width: 34px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in rows" :key="r.idHuyet">
              <td class="sph-stt">{{ i + 1 }}</td>
              <td>
                <b>{{ r.ten }}</b>
                <span class="sph-ma" :class="{ 'sph-ma--thieu': !r.code }">{{ r.ma || 'thiếu mã' }}</span>
              </td>
              <td class="sph-cell-goiy">
                <input
                  v-model="r.viThuoc"
                  type="text"
                  placeholder="gõ để tìm…"
                  @input="timViThuoc(i, r.viThuoc)"
                  @focus="timViThuoc(i, r.viThuoc)"
                />
                <span v-if="r.han" class="sph-han">{{ r.han }}</span>
                <ul v-if="dongDangGoiY === i && goiY.length" class="sph-goiy">
                  <li v-for="g in goiY" :key="g.id" @mousedown.prevent="chonGoiY(i, g)">
                    {{ g.ten }} <em v-if="g.han">{{ g.han }}</em>
                  </li>
                </ul>
              </td>
              <td>
                <input v-model="r.congNang" type="text" :placeholder="r.tacDung || 'VD: Đại bổ nguyên khí, an thần'" />
              </td>
              <td class="sph-center">
                <input v-model="r.luuGhep" type="checkbox" :disabled="!r.idViThuoc" />
              </td>
              <td class="sph-center">
                <button type="button" class="sph-del" title="Bỏ khỏi phiếu" @click="xoaDong(i)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sph-foot">
        <span class="sph-note">Phiếu không được lưu — in xong là thôi. Tick “Lưu” để nhớ ghép vị thuốc cho lần sau.</span>
        <div class="sph-actions">
          <button type="button" class="sph-btn sph-btn--ghost" @click="emit('close')">Đóng</button>
          <button type="button" class="sph-btn" :disabled="dangIn || !rows.length" @click="inPhieu">
            {{ dangIn ? 'Đang dựng…' : `🖶 In phiếu (${rows.length})` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sph-backdrop {
  position: fixed; inset: 0; z-index: 1200; background: rgba(40, 30, 20, 0.45);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.sph-modal {
  background: #fff; border-radius: 10px; width: min(1000px, 100%); max-height: 88vh;
  display: flex; flex-direction: column; box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}
.sph-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 14px 18px; border-bottom: 1px solid #ece7dd;
}
.sph-head h3 { margin: 0; font-size: 17px; color: #4a3520; }
.sph-sub { margin: 2px 0 0; font-size: 12.5px; color: #8d8477; }
.sph-x { border: 0; background: none; font-size: 17px; cursor: pointer; color: #8d8477; padding: 2px 6px; }
.sph-toolbar { padding: 12px 18px 4px; }
.sph-field { display: flex; flex-direction: column; gap: 4px; max-width: 420px; }
.sph-field span { font-size: 12px; color: #6b6154; }
.sph-field input { padding: 7px 10px; border: 1px solid #ddd5c8; border-radius: 6px; font: inherit; }
.sph-warn { margin: 8px 18px 0; padding: 7px 10px; background: #fdf6e7; border: 1px solid #ecdcb4; border-radius: 6px; font-size: 12.5px; color: #8a5a1b; }
.sph-err { margin: 8px 18px 0; padding: 7px 10px; background: #fdecea; border: 1px solid #f2c4bd; border-radius: 6px; font-size: 12.5px; color: #a5382f; }
.sph-table-wrap { overflow: auto; padding: 10px 18px; flex: 1; }
.sph-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.sph-table th {
  text-align: left; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.03em;
  color: #8d8477; font-weight: 700; padding: 6px 6px; border-bottom: 1px solid #ece7dd; position: sticky; top: 0; background: #fff;
}
.sph-table td { padding: 5px 6px; border-bottom: 1px solid #f4f0e9; vertical-align: middle; }
.sph-table input[type='text'] { width: 100%; padding: 5px 8px; border: 1px solid #ddd5c8; border-radius: 5px; font: inherit; font-size: 12.5px; }
.sph-stt { color: #b0a698; font-size: 12px; }
.sph-ma { margin-left: 6px; font-size: 11px; color: #8d8477; }
.sph-ma--thieu { color: #a5382f; }
.sph-han { position: absolute; right: 10px; top: 9px; font-size: 12px; color: #b23b2e; pointer-events: none; }
.sph-cell-goiy { position: relative; }
.sph-goiy {
  position: absolute; z-index: 5; left: 6px; right: 6px; top: 100%; margin: 2px 0 0; padding: 4px 0;
  list-style: none; background: #fff; border: 1px solid #ddd5c8; border-radius: 6px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  max-height: 210px; overflow: auto;
}
.sph-goiy li { padding: 5px 10px; cursor: pointer; font-size: 12.5px; }
.sph-goiy li:hover { background: #f8f4ec; }
.sph-goiy em { color: #b23b2e; font-style: normal; margin-left: 4px; }
.sph-center { text-align: center; }
.sph-del { border: 0; background: none; color: #b0a698; cursor: pointer; font-size: 13px; }
.sph-del:hover { color: #a5382f; }
.sph-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 18px; border-top: 1px solid #ece7dd;
}
.sph-note { font-size: 12px; color: #8d8477; }
.sph-actions { display: flex; gap: 8px; }
.sph-btn { font: inherit; font-size: 13px; padding: 7px 16px; border-radius: 6px; cursor: pointer; border: 1px solid #8a5a1b; background: #8a5a1b; color: #fff; }
.sph-btn:disabled { opacity: 0.55; cursor: default; }
.sph-btn--ghost { background: #fff; color: #8a5a1b; }
</style>
