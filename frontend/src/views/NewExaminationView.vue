<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePatientStore, type Patient } from '@/stores/patient'
import { api } from '@/services/api'

const router = useRouter()
const route = useRoute()
const patientStore = usePatientStore()

const patientId = computed(() => Number(route.params.id))
const patient = ref<Patient | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

// Form states
const form = reactive({
  date: new Date().toISOString().substring(0, 10),
  time: new Date().toTimeString().substring(0, 5),
  environmentTemp: '',
  symptoms: '',
  tests: ''
})

// Meridian Temperatures
const upperMeridians = ['Tiểu Trường', 'Tâm', 'Tam Tiêu', 'Tâm Bào', 'Đại Trường', 'Phế']
const lowerMeridians = ['Bàng Quang', 'Thận', 'Đởm', 'Vị', 'Can', 'Tỳ']

const meridianTemps = reactive({
  upperLeft: upperMeridians.reduce((acc, curr) => ({ ...acc, [curr]: '' }), {} as Record<string, string>),
  upperRight: upperMeridians.reduce((acc, curr) => ({ ...acc, [curr]: '' }), {} as Record<string, string>),
  lowerLeft: lowerMeridians.reduce((acc, curr) => ({ ...acc, [curr]: '' }), {} as Record<string, string>),
  lowerRight: lowerMeridians.reduce((acc, curr) => ({ ...acc, [curr]: '' }), {} as Record<string, string>)
})

// ---------------------------------------------------------------- Định vị điểm đo
// Nhiệt độ MT được điền TỰ ĐỘNG (môi trường bên ngoài lúc đo, dù đo ở phòng khám hay tại nhà
// bệnh nhân đều đúng). Riêng địa chỉ chỉ ghi vào hồ sơ khi thầy thuốc BẤM NÚT — vì vị trí máy
// đo chỉ trùng nơi ở của bệnh nhân khi mang máy tới tận nhà.

interface DiaDiem {
  viDo: number
  kinhDo: number
  tinhThanh: string | null
  phuongXa: string | null
  diaChi: string | null
  diaChiDayDu: string | null
  nhietDo: number | null
  doAm: number | null
  loiDiaChi: string | null
  loiThoiTiet: string | null
}

const diaDiem = ref<DiaDiem | null>(null)
const dinhViTrangThai = ref<'chua' | 'dang' | 'xong' | 'loi'>('chua')
const dinhViLoi = ref<string | null>(null)
const dangLuuDiaChi = ref(false)
const daLuuDiaChi = ref(false)

/** Nhãn gọn "Phường X, Tỉnh Y" để hiển thị dưới ô nhiệt độ. */
const nhanViTri = computed(() => {
  const d = diaDiem.value
  if (!d) return ''
  return [d.phuongXa, d.tinhThanh].filter(Boolean).join(', ')
})

/** Có địa chỉ tra được và hồ sơ đang thiếu -> gợi ý bấm nút điền. */
const hoSoThieuDiaChi = computed(() => !patient.value?.province || !patient.value?.address)

function toaDoHienTai(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ định vị'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000
    })
  })
}

function loiDinhViDeHieu(err: unknown): string {
  const code = (err as GeolocationPositionError)?.code
  if (code === 1) return 'Trình duyệt đang chặn quyền vị trí — hãy bấm biểu tượng khoá trên thanh địa chỉ và cho phép.'
  if (code === 2) return 'Không xác định được vị trí (thiết bị chưa bắt được tín hiệu).'
  if (code === 3) return 'Quá lâu không lấy được vị trí.'
  return (err as Error)?.message || 'Không lấy được vị trí'
}

async function layViTri(nguoiDungBam = false) {
  if (dinhViTrangThai.value === 'dang') return
  dinhViTrangThai.value = 'dang'
  dinhViLoi.value = null
  try {
    const pos = await toaDoHienTai()
    const { latitude, longitude } = pos.coords
    const kq = await api.get<DiaDiem>(`/dia-diem/tra-cuu?lat=${latitude}&lon=${longitude}`)
    diaDiem.value = kq
    // Không đè số thầy thuốc đã tự gõ; bấm "Định vị lại" thì cập nhật số mới.
    if (kq.nhietDo !== null && (nguoiDungBam || !form.environmentTemp)) {
      form.environmentTemp = String(kq.nhietDo)
    }
    dinhViTrangThai.value = 'xong'
  } catch (err) {
    dinhViLoi.value = loiDinhViDeHieu(err)
    dinhViTrangThai.value = 'loi'
  }
}

/** Ghi Tỉnh/TP + Địa chỉ của điểm đo vào hồ sơ bệnh nhân (chỉ khi thầy thuốc chủ động bấm). */
async function dungDiaChiChoHoSo() {
  const d = diaDiem.value
  if (!d || !patient.value || dangLuuDiaChi.value) return
  const moi = { province: d.tinhThanh ?? undefined, address: d.diaChi ?? undefined }
  if (!moi.province && !moi.address) return

  const cu = [patient.value.province, patient.value.address].filter(Boolean).join(' · ')
  if (cu && !confirm(`Hồ sơ đang có: ${cu}\n\nGhi đè bằng địa chỉ điểm đo?\n${[d.diaChi, d.tinhThanh].filter(Boolean).join(', ')}`)) {
    return
  }

  dangLuuDiaChi.value = true
  try {
    await api.put(`/patients/${patientId.value}`, moi)
    patient.value = { ...patient.value, ...moi } as Patient
    daLuuDiaChi.value = true
  } catch (err: any) {
    alert('Không lưu được địa chỉ vào hồ sơ: ' + (err?.message || ''))
  } finally {
    dangLuuDiaChi.value = false
  }
}

/** Ghép Ngày khám + Giờ khám trên form thành mốc ISO để lưu (cho phép nhập bù ca cũ). */
function thoiDiemKhamISO(): string | null {
  if (!form.date) return null
  const d = new Date(`${form.date}T${form.time || '00:00'}:00`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

onMounted(async () => {
  await loadPatient()
  // Chạy nền, không chặn thao tác nhập của thầy thuốc.
  void layViTri()
})

async function loadPatient() {
  isLoading.value = true
  try {
    patient.value = await api.get<Patient>(`/patients/${patientId.value}`)
  } catch (err: any) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'patient-detail', params: { id: patientId.value } })
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('vi-VN') } catch { return d }
}

function getAge(dob: string | null) {
  if (!dob) return '—'
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--
  }
  return `${age} tuổi`
}

const keyMap: Record<string, string> = {
  'Tiểu Trường': 'tieutruong',
  'Tâm': 'tam',
  'Tam Tiêu': 'tamtieu',
  'Tâm Bào': 'tambao',
  'Đại Trường': 'daitrang',
  'Phế': 'phe',
  'Bàng Quang': 'bangquang',
  'Thận': 'than',
  'Đởm': 'dam',
  'Vị': 'vi',
  'Can': 'can',
  'Tỳ': 'ty'
}

async function saveExamination() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const dto: any = {
      patientId: patientId.value,
      notes: `Triệu chứng: ${form.symptoms}\nXét nghiệm: ${form.tests}`,
      // Giờ khám thầy thuốc chọn (có thể lùi/tiến so với lúc bấm lưu).
      thoiDiemKham: thoiDiemKhamISO(),
      // Bối cảnh môi trường + địa điểm lúc đo.
      nhietDoMoiTruong: form.environmentTemp === '' ? null : Number(form.environmentTemp),
      doAmMoiTruong: diaDiem.value?.doAm ?? null,
      tinhThanh: diaDiem.value?.tinhThanh ?? null,
      phuongXa: diaDiem.value?.phuongXa ?? null,
      viDo: diaDiem.value?.viDo ?? null,
      kinhDo: diaDiem.value?.kinhDo ?? null
    }

    // Map upper
    upperMeridians.forEach(m => {
      const key = keyMap[m]
      dto[`${key}trai`] = Number(meridianTemps.upperLeft[m]) || 0
      dto[`${key}phai`] = Number(meridianTemps.upperRight[m]) || 0
    })

    // Map lower
    lowerMeridians.forEach(m => {
      const key = keyMap[m]
      dto[`${key}trai`] = Number(meridianTemps.lowerLeft[m]) || 0
      dto[`${key}phai`] = Number(meridianTemps.lowerRight[m]) || 0
    })

    const response = await api.post<any>('/examinations', dto)

    if (response && response.success && response.id) {
      alert('Đã lưu phiếu khám thành công!')
      router.push({
        name: 'meridian-results',
        params: { patientId: patientId.value, examId: response.id }
      })
    } else {
      throw new Error('Không nhận được ID phiếu khám từ máy chủ')
    }
  } catch (err: any) {
    console.error(err)
    alert('Lỗi khi lưu phiếu khám: ' + (err.message || ''))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="new-exam-page">
    <button class="back-btn" @click="goBack">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
      <span>Quay lại hồ sơ</span>
    </button>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải thông tin...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="goBack">Quay lại</button>
    </div>

    <template v-else-if="patient">
      <div class="page-title-wrap">
        <h1 class="page-title">Điền thông tin phiếu khám</h1>
      </div>

      <div class="sections-row">
        <!-- Phần 1: Thông tin bệnh nhân -->
        <section class="form-section">
        <h3 class="section-title">1. Thông tin bệnh nhân</h3>
        <div class="patient-header-card">
          <div class="patient-avatar-lg">
            {{ (patient.fullName || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="patient-header-info">
            <h2 class="patient-name">{{ patient.fullName || 'Chưa có tên' }}</h2>
            <div class="patient-meta">
              <span class="meta-item">Giới tính: {{ patient.gender || '—' }}</span>
              <span v-if="patient.dateOfBirth" class="meta-item">
                Tuổi: {{ getAge(patient.dateOfBirth) }} ({{ formatDate(patient.dateOfBirth) }})
              </span>
              <span v-if="patient.phone" class="meta-item">SĐT: {{ patient.phone }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Phần 2: Đo nhiệt độ kinh lạc -->
      <section class="form-section">
        <h3 class="section-title">2. Đo nhiệt độ kinh lạc</h3>
        
        <div class="meridian-grid">
          <!-- Chi trên trái -->
          <div class="meridian-card">
            <h4 class="meridian-card-title">Chi trên (trái)</h4>
            <div class="meridian-table">
              <div class="meridian-table-header">
                <span class="col-kinh">Kinh</span>
                <span class="col-nhietdo">Nhiệt độ</span>
              </div>
              <div v-for="meridian in upperMeridians" :key="'ul-'+meridian" class="meridian-row">
                <span class="col-kinh">{{ meridian }}</span>
                <div class="input-wrap">
                  <input type="number" step="0.1" v-model="meridianTemps.upperLeft[meridian]" placeholder="Trái" :aria-label="`${meridian} - chi trên trái`" class="form-input text-right" />
                </div>
              </div>
            </div>
          </div>

          <!-- Chi trên phải -->
          <div class="meridian-card">
            <h4 class="meridian-card-title">Chi trên (phải)</h4>
            <div class="meridian-table">
              <div class="meridian-table-header">
                <span class="col-kinh">Kinh</span>
                <span class="col-nhietdo">Nhiệt độ</span>
              </div>
              <div v-for="meridian in upperMeridians" :key="'ur-'+meridian" class="meridian-row">
                <span class="col-kinh">{{ meridian }}</span>
                <div class="input-wrap">
                  <input type="number" step="0.1" v-model="meridianTemps.upperRight[meridian]" placeholder="Phải" :aria-label="`${meridian} - chi trên phải`" class="form-input text-right" />
                </div>
              </div>
            </div>
          </div>

          <!-- Chi dưới trái -->
          <div class="meridian-card">
            <h4 class="meridian-card-title">Chi dưới (trái)</h4>
            <div class="meridian-table">
              <div class="meridian-table-header">
                <span class="col-kinh">Kinh</span>
                <span class="col-nhietdo">Nhiệt độ</span>
              </div>
              <div v-for="meridian in lowerMeridians" :key="'ll-'+meridian" class="meridian-row">
                <span class="col-kinh">{{ meridian }}</span>
                <div class="input-wrap">
                  <input type="number" step="0.1" v-model="meridianTemps.lowerLeft[meridian]" placeholder="Trái" :aria-label="`${meridian} - chi dưới trái`" class="form-input text-right" />
                </div>
              </div>
            </div>
          </div>

          <!-- Chi dưới phải -->
          <div class="meridian-card">
            <h4 class="meridian-card-title">Chi dưới (phải)</h4>
            <div class="meridian-table">
              <div class="meridian-table-header">
                <span class="col-kinh">Kinh</span>
                <span class="col-nhietdo">Nhiệt độ</span>
              </div>
              <div v-for="meridian in lowerMeridians" :key="'lr-'+meridian" class="meridian-row">
                <span class="col-kinh">{{ meridian }}</span>
                <div class="input-wrap">
                  <input type="number" step="0.1" v-model="meridianTemps.lowerRight[meridian]" placeholder="Phải" :aria-label="`${meridian} - chi dưới phải`" class="form-input text-right" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Phần 3: Thông tin phiếu khám -->
      <section class="form-section">
        <h3 class="section-title">3. Thông tin phiếu khám</h3>
        <div class="info-card">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Ngày khám</label>
              <input type="date" v-model="form.date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Giờ khám</label>
              <input type="time" v-model="form.time" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">
                Nhiệt độ MT (°C)
                <span v-if="dinhViTrangThai === 'xong' && diaDiem?.nhietDo !== null" class="tag-auto">tự động</span>
              </label>
              <input type="number" step="0.1" v-model="form.environmentTemp" placeholder="VD: 26.5" class="form-input" />

              <p v-if="dinhViTrangThai === 'dang'" class="dinh-vi-dong">
                <span class="spinner-nho"></span> Đang lấy vị trí &amp; nhiệt độ…
              </p>
              <p v-else-if="dinhViTrangThai === 'xong'" class="dinh-vi-dong">
                <span class="ghim">📍</span>
                <span>{{ nhanViTri || 'Đã lấy vị trí' }}</span>
                <span v-if="diaDiem?.doAm !== null && diaDiem?.doAm !== undefined" class="phu">· ẩm {{ diaDiem.doAm }}%</span>
                <button type="button" class="lien-ket" @click="layViTri(true)">Định vị lại</button>
              </p>
              <p v-else-if="dinhViTrangThai === 'loi'" class="dinh-vi-dong loi">
                <span>{{ dinhViLoi }}</span>
                <button type="button" class="lien-ket" @click="layViTri(true)">Thử lại</button>
              </p>
            </div>
          </div>

          <!-- Địa chỉ điểm đo: chỉ ghi vào hồ sơ khi thầy thuốc chủ động bấm,
               vì máy đo có thể đang ở phòng khám chứ không phải nhà bệnh nhân. -->
          <div v-if="dinhViTrangThai === 'xong' && diaDiem?.diaChi" class="the-dia-chi">
            <div class="dia-chi-tieu-de">Địa chỉ tại điểm đo</div>
            <div class="dia-chi-noi-dung">{{ [diaDiem.diaChi, diaDiem.tinhThanh].filter(Boolean).join(', ') }}</div>
            <p v-if="hoSoThieuDiaChi && !daLuuDiaChi" class="dia-chi-nhac">Hồ sơ bệnh nhân đang thiếu Tỉnh/TP hoặc Địa chỉ.</p>
            <button
              v-if="!daLuuDiaChi"
              type="button"
              class="nut-dia-chi"
              :disabled="dangLuuDiaChi"
              @click="dungDiaChiChoHoSo"
            >
              {{ dangLuuDiaChi ? 'Đang lưu…' : 'Điền vào hồ sơ bệnh nhân' }}
            </button>
            <p v-else class="dia-chi-xong">✓ Đã lưu vào hồ sơ bệnh nhân</p>
          </div>

          <div class="form-group full-width mt-4">
            <label class="form-label">Triệu chứng</label>
            <textarea v-model="form.symptoms" class="form-input" rows="3" placeholder="Nhập triệu chứng..."></textarea>
          </div>
          
          <div class="form-group full-width mt-4">
            <label class="form-label">Các XN cận lâm sàng</label>
            <textarea v-model="form.tests" class="form-input" rows="3" placeholder="Nhập thông tin xét nghiệm..."></textarea>
          </div>
        </div>
      </section>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button class="btn-secondary" :disabled="isSubmitting" @click="goBack">Hủy</button>
        <button class="btn-primary" :disabled="isSubmitting" @click="saveExamination">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
          {{ isSubmitting ? 'Đang lưu…' : 'Lưu phiếu khám' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.new-exam-page { animation: fadeIn .4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }

.back-btn { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--gray-600); font-weight: 500; margin-bottom: var(--space-6); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); transition: all var(--transition-fast); }
.back-btn:hover { color: var(--brown-700); background: var(--brown-50); }

.page-title-wrap { margin-bottom: var(--space-4); border-bottom: 2px solid var(--brown-100); padding-bottom: var(--space-2); }
.page-title { font-size: var(--font-size-2xl); font-weight: 700; color: var(--brown-800); }

.sections-row { display: grid; grid-template-columns: 300px 1fr 340px; gap: var(--space-4); align-items: start; }
.form-section { margin-bottom: 0; }
.section-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-700); margin-bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-2); }
.section-title::before { content: ""; display: block; width: 4px; height: 18px; background: var(--brown-500); border-radius: 2px; }

/* Patient Header */
.patient-header-card { display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--space-4); padding: var(--space-5) var(--space-4); background: var(--white); border: 1px solid var(--brown-200); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
.patient-avatar-lg { width: 64px; height: 64px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--brown-400), var(--brown-700)); color: var(--white); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); font-weight: 700; flex-shrink: 0; }
.patient-name { font-size: var(--font-size-lg); font-weight: 700; color: var(--black); margin-bottom: var(--space-2); }
.patient-meta { display: flex; flex-direction: column; gap: var(--space-2); }
.meta-item { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-sm); color: var(--gray-600); }

/* Meridian Grid */
.meridian-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
.meridian-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm); }
.meridian-card-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--white); background: var(--brown-600); padding: var(--space-2) var(--space-4); text-align: center; }
.meridian-table { padding: var(--space-3); }
.meridian-table-header { display: flex; justify-content: space-between; padding: 0 var(--space-2) var(--space-2); border-bottom: 1px solid var(--gray-200); font-size: var(--font-size-xs); font-weight: 600; color: var(--gray-500); text-transform: uppercase; }
.meridian-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2); border-bottom: 1px dashed var(--gray-100); }
.meridian-row:last-child { border-bottom: none; }
.col-kinh { font-size: var(--font-size-sm); font-weight: 500; color: var(--gray-800); }
.input-wrap { width: 100px; }
.input-wrap .form-input { width: 100%; padding: 6px 10px; box-sizing: border-box; }
.text-right { text-align: right; }

/* Forms */
.info-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: var(--space-4); box-shadow: var(--shadow-sm); }
.form-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-3); }
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.full-width { grid-column: 1 / -1; }
.mt-4 { margin-top: var(--space-4); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.form-input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid var(--gray-300); border-radius: var(--radius-sm); font-size: var(--font-size-sm); color: var(--black); transition: all var(--transition-fast); background: var(--white); outline: none; }
.form-input:focus { border-color: var(--brown-500); box-shadow: var(--focus-ring); }
.form-input:disabled { background: var(--gray-50); color: var(--gray-500); cursor: not-allowed; }
textarea.form-input { resize: vertical; min-height: 80px; }

/* Định vị điểm đo */
.tag-auto { margin-left: var(--space-2); padding: 1px 7px; border-radius: var(--radius-full); background: var(--brown-50); color: var(--brown-700); border: 1px solid var(--brown-200); font-size: 11px; font-weight: 600; }
.dinh-vi-dong { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 2px; font-size: var(--font-size-xs); color: var(--gray-600); line-height: 1.5; }
.dinh-vi-dong.loi { color: var(--danger); }
.dinh-vi-dong .phu { color: var(--gray-500); }
.ghim { font-size: 12px; }
.lien-ket { background: none; border: none; padding: 0; font-size: var(--font-size-xs); font-weight: 600; color: var(--brown-600); text-decoration: underline; cursor: pointer; }
.lien-ket:hover { color: var(--brown-800); }
.spinner-nho { width: 11px; height: 11px; border: 2px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }

.the-dia-chi { margin-top: var(--space-4); padding: var(--space-3); background: var(--brown-50); border: 1px solid var(--brown-200); border-radius: var(--radius-sm); }
.dia-chi-tieu-de { font-size: var(--font-size-xs); font-weight: 700; color: var(--brown-700); text-transform: uppercase; letter-spacing: .02em; }
.dia-chi-noi-dung { margin-top: 4px; font-size: var(--font-size-sm); color: var(--gray-800); line-height: 1.5; }
.dia-chi-nhac { margin-top: 4px; font-size: var(--font-size-xs); color: var(--gray-600); }
.nut-dia-chi { margin-top: var(--space-3); width: 100%; padding: 8px 12px; background: var(--white); color: var(--brown-700); border: 1px solid var(--brown-300); border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.nut-dia-chi:hover:not(:disabled) { background: var(--brown-600); color: var(--white); border-color: var(--brown-600); }
.nut-dia-chi:disabled { opacity: .6; cursor: not-allowed; }
.dia-chi-xong { margin-top: var(--space-3); font-size: var(--font-size-xs); font-weight: 600; color: var(--success, var(--brown-700)); }

/* Actions */
.form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid var(--gray-200); }

.btn-secondary { padding: 10px 20px; background: var(--white); color: var(--gray-700); font-size: var(--font-size-sm); font-weight: 600; border-radius: var(--radius-md); border: 1px solid var(--gray-300); transition: all var(--transition-fast); cursor: pointer; }
.btn-secondary:hover { background: var(--gray-50); }
.btn-primary { display: inline-flex; align-items: center; gap: var(--space-2); padding: 10px 24px; background: var(--brown-600); color: var(--white); font-size: var(--font-size-sm); font-weight: 600; border-radius: var(--radius-md); border: none; transition: all var(--transition-fast); cursor: pointer; }
.btn-primary:hover { background: var(--brown-700); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

/* Loading & Error */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-16) 0; color: var(--gray-500); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-10); color: var(--danger); }

@media (max-width: 1200px) {
  .sections-row { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .meridian-grid { grid-template-columns: 1fr; }
  .form-actions { flex-direction: column-reverse; }
  .form-actions button { width: 100%; justify-content: center; }
}
</style>
