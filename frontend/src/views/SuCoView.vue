<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { api, API_BASE } from '@/services/api'
import { batPushNhanVien, isPushConfigured, pushPermission } from '@/services/push'

// ===== Kiểu dữ liệu =====
type Loai = 'loi_be' | 'loi_fe' | 'gop_y' | 'ux'
type Lane = 'loi' | 'gop_y' | 'ux'
type Hang = 'nang' | 'vua' | 'nhe'
type TrangThai = 'moi' | 'dang_sua' | 'da_sua' | 'bo_qua'

interface Cum {
  id: number
  vanTay: string
  loai: Loai
  lane: Lane
  hang: Hang
  trangThai: TrangThai
  taiPhat: boolean
  khuVuc: string
  routeChuan: string
  tomTat: string
  thongDiepGoc: string | null
  soLan: number
  soNguoi: number
  chanThaoTac: boolean
  lanDau: string
  lanCuoi: string
  ghiChu: string | null
  hoSoAi: string | null
}

interface LanXayRa {
  id: number
  xayRaLuc: string
  routeTho: string | null
  thongDiep: string
  stack: string | null
  maLoi: string | null
  httpStatus: number | null
  breadcrumbs: string[] | null
  nguCanh: Record<string, unknown> | null
  trinhDuyet: string | null
  vaiTroNguoiDung: string | null
  moTaNguoiDung: string | null
}

interface ChiTiet {
  cum: Cum
  cacLan: LanXayRa[]
  fileLienQuan: string[]
  bieuDo: { gio: string; soLan: number }[]
}

interface ThongKe {
  dangMo: number
  moi24h: number
  hangNang: number
  daSuaTuanNay: number
  chuaXem: number
}

// ===== Trạng thái =====
const dangTai = ref(false)
const loi = ref('')
const danhSach = ref<Cum[]>([])
const tong = ref(0)
const thongKe = ref<ThongKe | null>(null)

const locTrangThai = ref<'dang_mo' | TrangThai | 'tat_ca'>('dang_mo')
const locLane = ref<Lane | 'tat_ca'>('tat_ca')
const locHang = ref<Hang | 'tat_ca'>('tat_ca')
const tuKhoa = ref('')
const trang = ref(1)
const MOI_TRANG = 25

const chiTiet = ref<ChiTiet | null>(null)
const dangTaiChiTiet = ref(false)
const hoSo = ref('')
const dangDungHoSo = ref(false)
const daChep = ref(false)
const dangHoiAi = ref(false)
const loiAi = ref('')
const ghiChuSoan = ref('')

let timerTimKiem: ReturnType<typeof setTimeout> | null = null

// ===== Báo ra điện thoại =====
// Nút này phải do NGƯỜI bấm: trình duyệt phạt nặng trang tự bật hộp xin quyền lúc vừa mở,
// và Safari đòi hẳn một cử chỉ người dùng. Ẩn hẳn nếu chưa cấu hình Firebase.
const coTheBatPush = isPushConfigured()
const trangThaiPush = ref(pushPermission())
const dangBatPush = ref(false)

async function batPush() {
  dangBatPush.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (token) await batPushNhanVien(token)
    trangThaiPush.value = pushPermission()
  } finally {
    dangBatPush.value = false
  }
}

// ===== Nhãn hiển thị =====
const NHAN_LOAI: Record<Loai, string> = {
  loi_be: 'máy chủ',
  loi_fe: 'trình duyệt',
  gop_y: 'góp ý',
  ux: 'trải nghiệm',
}
const NHAN_HANG: Record<Hang, string> = { nang: 'Nặng', vua: 'Vừa', nhe: 'Nhẹ' }
const NHAN_TRANG_THAI: Record<TrangThai, string> = {
  moi: 'Mới',
  dang_sua: 'Đang sửa',
  da_sua: 'Đã sửa',
  bo_qua: 'Bỏ qua',
}

/** "khoảng 3 giờ trước" — người đọc quan tâm khoảng cách, không quan tâm mốc chính xác. */
function khoangCach(iso: string): string {
  const giay = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (giay < 90) return 'vừa xong'
  const phut = Math.round(giay / 60)
  if (phut < 60) return `${phut} phút trước`
  const gio = Math.round(phut / 60)
  if (gio < 24) return `khoảng ${gio} giờ trước`
  const ngay = Math.round(gio / 24)
  return ngay === 1 ? '1 ngày trước' : `${ngay} ngày trước`
}

function gioDayDu(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN')
}

// ===== Tải dữ liệu =====
async function taiDanhSach() {
  dangTai.value = true
  loi.value = ''
  try {
    const q = new URLSearchParams({
      trangThai: locTrangThai.value,
      lane: locLane.value,
      hang: locHang.value,
      trang: String(trang.value),
      moiTrang: String(MOI_TRANG),
    })
    if (tuKhoa.value.trim()) q.set('q', tuKhoa.value.trim())
    const res = await api.get<{ danhSach: Cum[]; tong: number }>(`/su-co/cum?${q}`)
    danhSach.value = res.danhSach
    tong.value = res.tong
  } catch (e: unknown) {
    loi.value = (e as Error)?.message || 'Không tải được danh sách'
  } finally {
    dangTai.value = false
  }
}

async function taiThongKe() {
  try {
    thongKe.value = await api.get<ThongKe>('/su-co/thong-ke')
  } catch {
    // Thẻ số hỏng thì bảng vẫn dùng được — không chặn cả trang vì một con số.
  }
}

function timKiem() {
  if (timerTimKiem) clearTimeout(timerTimKiem)
  timerTimKiem = setTimeout(() => {
    trang.value = 1
    taiDanhSach()
  }, 300)
}

function doiLoc() {
  trang.value = 1
  taiDanhSach()
}

async function moChiTiet(cum: Cum) {
  dangTaiChiTiet.value = true
  hoSo.value = ''
  loiAi.value = ''
  daChep.value = false
  try {
    chiTiet.value = await api.get<ChiTiet>(`/su-co/cum/${cum.id}`)
    ghiChuSoan.value = chiTiet.value.cum.ghiChu || ''
  } catch (e: unknown) {
    loi.value = (e as Error)?.message || 'Không mở được chi tiết'
  } finally {
    dangTaiChiTiet.value = false
  }
}

function dongChiTiet() {
  chiTiet.value = null
}

async function doiTrangThai(tt: TrangThai) {
  if (!chiTiet.value) return
  const cum = await api.patch<Cum>(`/su-co/cum/${chiTiet.value.cum.id}`, { trangThai: tt })
  chiTiet.value.cum = cum
  await Promise.all([taiDanhSach(), taiThongKe()])
}

async function luuGhiChu() {
  if (!chiTiet.value) return
  const cum = await api.patch<Cum>(`/su-co/cum/${chiTiet.value.cum.id}`, {
    ghiChu: ghiChuSoan.value,
  })
  chiTiet.value.cum = cum
}

async function dungHoSo() {
  if (!chiTiet.value) return
  dangDungHoSo.value = true
  try {
    const res = await api.get<{ markdown: string }>(`/su-co/cum/${chiTiet.value.cum.id}/ho-so`)
    hoSo.value = res.markdown
  } finally {
    dangDungHoSo.value = false
  }
}

async function chepHoSo() {
  if (!hoSo.value) await dungHoSo()
  try {
    await navigator.clipboard.writeText(hoSo.value)
    daChep.value = true
    setTimeout(() => (daChep.value = false), 2500)
  } catch {
    // Trình duyệt chặn clipboard (http, hoặc chưa có cử chỉ người dùng) — ô văn bản bên dưới
    // vẫn chọn tay được, nên chỉ cần không làm gì thêm.
  }
}

async function hoiAi() {
  if (!chiTiet.value) return
  dangHoiAi.value = true
  loiAi.value = ''
  try {
    const res = await api.post<{ hoSoAi: string }>(
      `/su-co/cum/${chiTiet.value.cum.id}/phan-tich-ai`,
      { lamLai: !!chiTiet.value.cum.hoSoAi },
    )
    chiTiet.value.cum.hoSoAi = res.hoSoAi
  } catch (e: unknown) {
    loiAi.value = (e as Error)?.message || 'Không gọi được AI'
  } finally {
    dangHoiAi.value = false
  }
}

// ===== Biểu đồ 24 giờ =====
/**
 * Dựng ĐỦ 24 khung giờ, kể cả giờ không có lần nào.
 *
 * Máy chủ chỉ trả về những giờ CÓ dữ liệu. Vẽ thẳng mảng đó thì một cụm chỉ xảy ra trong một
 * giờ sẽ thành một cột chiếm trọn bề ngang — đọc ra thành "lỗi kéo dài suốt 24 giờ", tức là
 * biểu đồ nói ngược hẳn sự thật. Khoảng trống chính là phần thông tin cần thấy.
 */
const cotBieuDo = computed(() => {
  const bd = chiTiet.value?.bieuDo
  if (!bd) return []

  const theoGio = new Map<number, number>()
  for (const b of bd) {
    const d = new Date(b.gio)
    theoGio.set(d.setMinutes(0, 0, 0), b.soLan)
  }

  const bayGio = new Date().setMinutes(0, 0, 0)
  const max = Math.max(...bd.map((b) => b.soLan), 1)

  return Array.from({ length: 24 }, (_, i) => {
    const moc = bayGio - (23 - i) * 3_600_000
    const soLan = theoGio.get(moc) || 0
    return {
      gio: new Date(moc).getHours() + 'h',
      soLan,
      caoPhanTram: Math.round((soLan / max) * 100),
      // Nhãn mỗi 6 giờ — 24 nhãn sát nhau thì không đọc được chữ nào.
      hienNhan: new Date(moc).getHours() % 6 === 0,
    }
  })
})

// ===== Nghe chuông thời gian thực =====
let es: EventSource | null = null

function ngheSse() {
  const token = localStorage.getItem('access_token')
  if (!token) return
  try {
    es = new EventSource(`${API_BASE}/notifications/sse?token=${encodeURIComponent(token)}`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.type !== 'SU_CO_MOI') return
        // Chỉ tải lại khi đang xem danh sách — đang đọc chi tiết mà bảng tự nhảy thì khó chịu.
        if (!chiTiet.value) {
          taiDanhSach()
          taiThongKe()
        }
      } catch {
        // Gói tin lạ thì bỏ qua.
      }
    }
  } catch {
    // Không có SSE thì tab vẫn dùng được, chỉ mất phần tự cập nhật.
  }
}

onMounted(() => {
  taiDanhSach()
  taiThongKe()
  ngheSse()
})

onUnmounted(() => {
  es?.close()
  if (timerTimKiem) clearTimeout(timerTimKiem)
})

const soTrang = computed(() => Math.max(1, Math.ceil(tong.value / MOI_TRANG)))
</script>

<template>
  <div class="su-co">
    <header class="dau-trang">
      <div class="dau-trang-chu">
        <h1>Góp Ý &amp; Lỗi</h1>
        <p class="phu-de">
          Hệ thống tự ghi lại lỗi máy chủ, lỗi trình duyệt, góp ý người dùng và tín hiệu trải
          nghiệm; gom các lần giống nhau thành một việc phải sửa, rồi dựng sẵn hồ sơ sửa lỗi.
        </p>
      </div>
      <button
        v-if="coTheBatPush && trangThaiPush !== 'granted'"
        class="nut-push"
        :disabled="dangBatPush"
        @click="batPush"
      >
        {{ dangBatPush ? 'Đang bật…' : '🔔 Báo ra điện thoại' }}
      </button>
    </header>

    <!-- Thẻ số -->
    <section v-if="thongKe" class="the-so">
      <div class="the">
        <span class="con-so">{{ thongKe.dangMo }}</span>
        <span class="nhan">Đang mở</span>
      </div>
      <div class="the">
        <span class="con-so">{{ thongKe.moi24h }}</span>
        <span class="nhan">Mới trong 24 giờ</span>
      </div>
      <div class="the" :class="{ 'the-canh-bao': thongKe.hangNang > 0 }">
        <span class="con-so">{{ thongKe.hangNang }}</span>
        <span class="nhan">Hạng nặng</span>
      </div>
      <div class="the">
        <span class="con-so">{{ thongKe.daSuaTuanNay }}</span>
        <span class="nhan">Đã sửa tuần này</span>
      </div>
    </section>

    <!-- Bộ lọc -->
    <section class="bo-loc">
      <input
        v-model="tuKhoa"
        class="o-tim"
        type="search"
        placeholder="Tìm theo khu vực / route / vân tay…"
        @input="timKiem"
      />
      <select v-model="locTrangThai" class="o-chon" @change="doiLoc">
        <option value="dang_mo">Đang mở</option>
        <option value="moi">Mới</option>
        <option value="dang_sua">Đang sửa</option>
        <option value="da_sua">Đã sửa</option>
        <option value="bo_qua">Bỏ qua</option>
        <option value="tat_ca">Tất cả</option>
      </select>
      <select v-model="locLane" class="o-chon" @change="doiLoc">
        <option value="tat_ca">Mọi làn</option>
        <option value="loi">Lỗi</option>
        <option value="gop_y">Góp ý</option>
        <option value="ux">Trải nghiệm</option>
      </select>
      <select v-model="locHang" class="o-chon" @change="doiLoc">
        <option value="tat_ca">Mọi hạng</option>
        <option value="nang">Nặng</option>
        <option value="vua">Vừa</option>
        <option value="nhe">Nhẹ</option>
      </select>
      <span class="dem-cum">{{ tong }} cụm</span>
    </section>

    <p v-if="loi" class="bao-loi">{{ loi }}</p>

    <!-- Danh sách cụm -->
    <section class="ds-cum">
      <p v-if="dangTai" class="trang-thai-rong">Đang tải…</p>
      <p v-else-if="!danhSach.length" class="trang-thai-rong">
        Không có cụm nào khớp bộ lọc. Im lặng ở đây là tin tốt.
      </p>

      <article
        v-for="c in danhSach"
        :key="c.id"
        class="cum"
        :class="[`hang-${c.hang}`, { 'cum-tai-phat': c.taiPhat }]"
        role="button"
        tabindex="0"
        @click="moChiTiet(c)"
        @keydown.enter="moChiTiet(c)"
      >
        <div class="cum-dong-1">
          <span class="khu-vuc">{{ c.khuVuc }}</span>
          <span v-if="c.taiPhat" class="chip chip-tai-phat">Tái phát</span>
          <span v-else-if="c.trangThai === 'moi'" class="chip chip-moi">Mới</span>
          <span class="chip">{{ NHAN_LOAI[c.loai] }}</span>
          <span class="chip" :class="`chip-hang-${c.hang}`">{{ NHAN_HANG[c.hang] }}</span>
          <span v-if="c.chanThaoTac" class="chip chip-chan">chặn thao tác</span>
          <span class="thoi-gian">
            ×{{ c.soLan }} · {{ c.soNguoi }} người · {{ khoangCach(c.lanCuoi) }}
          </span>
        </div>
        <div class="cum-route">{{ c.routeChuan }}</div>
        <div class="cum-tom-tat">{{ c.thongDiepGoc || c.tomTat }}</div>
      </article>

      <nav v-if="soTrang > 1" class="phan-trang">
        <button :disabled="trang <= 1" @click="(trang--, taiDanhSach())">← Trước</button>
        <span>{{ trang }} / {{ soTrang }}</span>
        <button :disabled="trang >= soTrang" @click="(trang++, taiDanhSach())">Sau →</button>
      </nav>
    </section>

    <!-- Chi tiết -->
    <div v-if="chiTiet || dangTaiChiTiet" class="lop-phu" @click.self="dongChiTiet">
      <aside class="ngan-keo">
        <p v-if="dangTaiChiTiet" class="trang-thai-rong">Đang mở…</p>

        <template v-else-if="chiTiet">
          <header class="ck-dau">
            <div>
              <h2>{{ chiTiet.cum.thongDiepGoc || chiTiet.cum.tomTat }}</h2>
              <p class="van-tay">
                Vân tay <code>{{ chiTiet.cum.vanTay }}</code> · {{ NHAN_LOAI[chiTiet.cum.loai] }} ·
                <strong>{{ NHAN_HANG[chiTiet.cum.hang] }}</strong>
              </p>
            </div>
            <button class="nut-dong" aria-label="Đóng" @click="dongChiTiet">×</button>
          </header>

          <!-- Đổi trạng thái -->
          <div class="hang-nut">
            <button
              v-for="tt in ['moi', 'dang_sua', 'da_sua', 'bo_qua'] as TrangThai[]"
              :key="tt"
              class="nut-tt"
              :class="{ 'nut-tt-chon': chiTiet.cum.trangThai === tt }"
              @click="doiTrangThai(tt)"
            >
              {{ NHAN_TRANG_THAI[tt] }}
            </button>
          </div>

          <!-- Số liệu -->
          <dl class="so-lieu">
            <div>
              <dt>Khu vực</dt>
              <dd>{{ chiTiet.cum.khuVuc }}</dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>
                <code>{{ chiTiet.cum.routeChuan }}</code>
              </dd>
            </div>
            <div>
              <dt>Số lần</dt>
              <dd>{{ chiTiet.cum.soLan }}</dd>
            </div>
            <div>
              <dt>Số người dính</dt>
              <dd>{{ chiTiet.cum.soNguoi }}</dd>
            </div>
            <div>
              <dt>Lần đầu</dt>
              <dd>{{ gioDayDu(chiTiet.cum.lanDau) }}</dd>
            </div>
            <div>
              <dt>Lần cuối</dt>
              <dd>{{ gioDayDu(chiTiet.cum.lanCuoi) }}</dd>
            </div>
          </dl>

          <!-- Biểu đồ -->
          <section v-if="cotBieuDo.length" class="khoi">
            <h3>Tần suất 24 giờ qua</h3>
            <div class="bieu-do">
              <div
                v-for="(c, i) in cotBieuDo"
                :key="i"
                class="cot"
                :title="`${c.gio}: ${c.soLan} lần`"
              >
                <div
                  class="cot-than"
                  :class="{ 'cot-rong': !c.soLan }"
                  :style="{ height: Math.max(c.caoPhanTram, 2) + '%' }"
                ></div>
                <span class="cot-nhan">{{ c.hienNhan ? c.gio : '' }}</span>
              </div>
            </div>
          </section>

          <!-- Chỗ nghi vấn -->
          <section v-if="chiTiet.fileLienQuan.length" class="khoi">
            <h3>Chỗ đáng mở ra xem <span class="ghi-chu-nho">(gợi ý, chưa kiểm chứng)</span></h3>
            <ul class="ds-file">
              <li v-for="f in chiTiet.fileLienQuan" :key="f">
                <code>{{ f }}</code>
              </li>
            </ul>
          </section>

          <!-- Hồ sơ sửa lỗi -->
          <section class="khoi khoi-ho-so">
            <h3>Hồ sơ sửa lỗi</h3>
            <p class="ghi-chu-nho">
              Dán thẳng vào Claude Code. Gồm cách tái hiện, bằng chứng, chỗ nghi vấn và tiêu chí coi
              là đã sửa.
            </p>
            <div class="hang-nut">
              <button class="nut-chinh" :disabled="dangDungHoSo" @click="chepHoSo">
                {{
                  daChep
                    ? '✓ Đã sao chép'
                    : dangDungHoSo
                      ? 'Đang dựng…'
                      : 'Sao chép cho Claude Code'
                }}
              </button>
              <button class="nut-phu" :disabled="dangDungHoSo" @click="dungHoSo">Xem trước</button>
            </div>
            <textarea v-if="hoSo" class="o-ho-so" readonly :value="hoSo" rows="14"></textarea>
          </section>

          <!-- AI -->
          <section class="khoi khoi-ai">
            <h3>Nhờ AI phân tích <span class="ghi-chu-nho">(tuỳ chọn)</span></h3>
            <button class="nut-ai" :disabled="dangHoiAi" @click="hoiAi">
              {{ dangHoiAi ? 'Đang hỏi…' : chiTiet.cum.hoSoAi ? 'Hỏi lại' : 'Đoán nguyên nhân' }}
            </button>
            <p v-if="loiAi" class="bao-loi">{{ loiAi }}</p>
            <pre v-if="chiTiet.cum.hoSoAi" class="ket-qua-ai">{{ chiTiet.cum.hoSoAi }}</pre>
          </section>

          <!-- Ghi chú -->
          <section class="khoi">
            <h3>Ghi chú xử lý</h3>
            <textarea
              v-model="ghiChuSoan"
              class="o-ghi-chu"
              rows="3"
              placeholder="Vì sao bỏ qua, đã sửa ở commit nào…"
            ></textarea>
            <button class="nut-phu" @click="luuGhiChu">Lưu ghi chú</button>
          </section>

          <!-- Các lần xảy ra -->
          <section class="khoi">
            <h3>{{ chiTiet.cacLan.length }} lần gần nhất</h3>
            <details v-for="l in chiTiet.cacLan" :key="l.id" class="lan">
              <summary>
                {{ gioDayDu(l.xayRaLuc) }}
                <span class="lan-phu">
                  {{ l.vaiTroNguoiDung || 'khách' }}
                  <template v-if="l.httpStatus"> · HTTP {{ l.httpStatus }}</template>
                </span>
              </summary>
              <div class="lan-than">
                <p v-if="l.moTaNguoiDung" class="mo-ta-nguoi-dung">"{{ l.moTaNguoiDung }}"</p>
                <p v-if="l.routeTho">
                  <strong>Route:</strong> <code>{{ l.routeTho }}</code>
                </p>
                <p v-if="l.trinhDuyet" class="trinh-duyet">{{ l.trinhDuyet }}</p>
                <template v-if="l.breadcrumbs?.length">
                  <strong>Các bước ngay trước đó:</strong>
                  <ol class="vet">
                    <li v-for="(b, i) in l.breadcrumbs" :key="i">{{ b }}</li>
                  </ol>
                </template>
                <pre v-if="l.stack" class="stack">{{ l.stack }}</pre>
                <pre v-if="l.nguCanh" class="stack">{{ JSON.stringify(l.nguCanh, null, 2) }}</pre>
              </div>
            </details>
          </section>
        </template>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.su-co {
  padding: var(--space-6);
  max-width: 1100px;
  margin: 0 auto;
}

/* `.content-area` viết hoa đầu từ cho toàn UI (main.css). Với nội dung KỸ THUẬT thì đó là sai
   thật sự, không phải sai thẩm mỹ: route và stack trace phân biệt hoa–thường, nên `/vi-thuoc/:id`
   hiện thành `/Vi-Thuoc/:Id` sẽ dẫn người sửa đi tìm nhầm chỗ. Giữ nguyên dạng gốc ở đúng
   những chỗ chở nội dung máy sinh ra; nhãn giao diện vẫn theo nếp Title Case của app. */
.cum-route,
.cum-tom-tat,
.van-tay,
.so-lieu dd,
.ds-file,
.o-ho-so,
.stack,
.vet,
.ket-qua-ai,
.trinh-duyet,
.mo-ta-nguoi-dung,
.lan summary,
.ck-dau h2 {
  text-transform: none;
}

.dau-trang {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  flex-wrap: wrap;
}
.dau-trang-chu {
  flex: 1 1 320px;
}
.nut-push {
  min-height: 40px;
  padding: 0 var(--space-4);
  border: 1px solid var(--border-brand);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-brand);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.nut-push:disabled {
  opacity: 0.5;
  cursor: default;
}
.dau-trang h1 {
  font-size: var(--font-size-2xl);
  color: var(--text-brand);
  margin: 0 0 var(--space-2);
}
.phu-de {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  max-width: 70ch;
  margin: 0;
  line-height: 1.6;
}

/* Thẻ số */
.the-so {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
  margin: var(--space-6) 0;
}
.the {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.the-canh-bao {
  border-color: var(--danger-border);
  background: var(--danger-bg);
}
.con-so {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-brand);
}
.the-canh-bao .con-so {
  color: var(--danger-fg);
}
.nhan {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* Bộ lọc */
.bo-loc {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-4);
}
.o-tim {
  flex: 1 1 260px;
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: var(--font-size-sm);
}
.o-chon {
  min-height: 40px;
  padding: 0 var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: var(--font-size-sm);
}
.dem-cum {
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
  margin-left: auto;
}

/* Danh sách cụm */
.ds-cum {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.trang-thai-rong {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  padding: var(--space-8) 0;
  text-align: center;
}

.cum {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border-strong);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  cursor: pointer;
  transition:
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);
}
.cum:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-brand);
}
.cum:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.hang-nang {
  border-left-color: var(--danger);
}
.hang-vua {
  border-left-color: var(--warning);
}
.hang-nhe {
  border-left-color: var(--border-strong);
}
.cum-tai-phat {
  background: var(--danger-bg);
}

.cum-dong-1 {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-2);
}
.khu-vuc {
  font-weight: 600;
  color: var(--text-brand);
  font-size: var(--font-size-sm);
}
.thoi-gian {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
}

.chip {
  font-size: var(--font-size-2xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  white-space: nowrap;
}
.chip-moi {
  background: var(--info-bg);
  border-color: var(--info-border);
  color: var(--info-fg);
  font-weight: 600;
}
.chip-tai-phat {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger-fg);
  font-weight: 600;
}
.chip-chan {
  background: var(--warning-bg);
  border-color: var(--warning-border);
  color: var(--warning-fg);
}
.chip-hang-nang {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger-fg);
}
.chip-hang-vua {
  background: var(--warning-bg);
  border-color: var(--warning-border);
  color: var(--warning-fg);
}

.cum-route {
  font-family: ui-monospace, monospace;
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
  margin-bottom: var(--space-1);
}
.cum-tom-tat {
  font-size: var(--font-size-sm);
  color: var(--text);
  line-height: 1.5;
}

.phan-trang {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
.phan-trang button {
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}
.phan-trang button:disabled {
  opacity: 0.4;
  cursor: default;
}

/* Ngăn kéo chi tiết */
.lop-phu {
  position: fixed;
  inset: 0;
  background: rgba(28, 24, 18, 0.4);
  display: flex;
  justify-content: flex-end;
  z-index: 900;
}
.ngan-keo {
  width: min(720px, 100%);
  background: var(--bg-app);
  overflow-y: auto;
  padding: var(--space-6);
  box-shadow: var(--shadow-xl);
}

.ck-dau {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  margin-bottom: var(--space-4);
}
.ck-dau h2 {
  font-size: var(--font-size-lg);
  margin: 0 0 var(--space-1);
  color: var(--text-brand);
  line-height: 1.4;
}
.van-tay {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: 0;
}
.nut-dong {
  margin-left: auto;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: var(--text-muted);
  flex-shrink: 0;
}

.hang-nut {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.nut-tt {
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.nut-tt-chon {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--white);
  font-weight: 600;
}

.so-lieu {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin: 0 0 var(--space-4);
}
.so-lieu dt {
  font-size: var(--font-size-2xs);
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.so-lieu dd {
  margin: 2px 0 0;
  font-size: var(--font-size-sm);
  color: var(--text);
}

.khoi {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}
.khoi h3 {
  font-size: var(--font-size-sm);
  margin: 0 0 var(--space-3);
  color: var(--text-brand);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ghi-chu-nho {
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.bieu-do {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 90px;
}
.cot {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}
.cot-than {
  width: 100%;
  background: var(--primary-light);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}
.cot-rong {
  background: var(--border);
}
.cot-nhan {
  font-size: 9px;
  color: var(--text-subtle);
  margin-top: 2px;
}

.ds-file {
  margin: 0;
  padding-left: var(--space-5);
}
.ds-file li {
  font-size: var(--font-size-sm);
  margin-bottom: 2px;
}

.khoi-ho-so {
  border-color: var(--border-brand);
  background: var(--primary-bg);
}
.nut-chinh {
  min-height: 40px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--white);
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.nut-phu {
  min-height: 40px;
  padding: 0 var(--space-4);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.nut-chinh:disabled,
.nut-phu:disabled {
  opacity: 0.5;
  cursor: default;
}
.o-ho-so {
  width: 100%;
  margin-top: var(--space-3);
  font-family: ui-monospace, monospace;
  font-size: var(--font-size-xs);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  background: var(--surface);
  color: var(--text);
  line-height: 1.5;
}

.khoi-ai {
  border-color: var(--ai-border);
  background: var(--ai-bg);
}
.khoi-ai h3 {
  color: var(--ai-fg);
}
.nut-ai {
  min-height: 40px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  background: var(--ai-solid);
  color: var(--white);
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.nut-ai:disabled {
  opacity: 0.5;
  cursor: default;
}
.ket-qua-ai {
  margin: var(--space-3) 0 0;
  white-space: pre-wrap;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text);
  font-family: inherit;
}

.o-ghi-chu {
  width: 100%;
  margin-bottom: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  font: inherit;
  font-size: var(--font-size-sm);
  background: var(--surface);
  color: var(--text);
}

.lan {
  border-top: 1px solid var(--border);
  padding: var(--space-2) 0;
}
.lan summary {
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text);
}
.lan-phu {
  color: var(--text-subtle);
  font-size: var(--font-size-xs);
}
.lan-than {
  padding: var(--space-3) 0 0 var(--space-3);
  font-size: var(--font-size-sm);
}
.lan-than p {
  margin: 0 0 var(--space-2);
}
.mo-ta-nguoi-dung {
  font-style: italic;
  color: var(--text-brand);
  border-left: 2px solid var(--border-brand);
  padding-left: var(--space-3);
}
.trinh-duyet {
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
  word-break: break-all;
}
.vet {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: var(--space-1) 0 var(--space-3);
  padding-left: var(--space-5);
}
.stack {
  background: var(--surface-sunken);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  font-size: var(--font-size-2xs);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-muted);
  max-height: 260px;
}

.bao-loi {
  color: var(--danger-fg);
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--font-size-sm);
}

@media (max-width: 640px) {
  .su-co {
    padding: var(--space-4);
  }
  .ngan-keo {
    padding: var(--space-4);
  }
  .thoi-gian {
    margin-left: 0;
    width: 100%;
  }
}
</style>
