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

onMounted(async () => {
  await loadPatient()
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
      notes: `Triệu chứng: ${form.symptoms}\nXét nghiệm: ${form.tests}`
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
                  <input type="number" step="0.1" v-model="meridianTemps.upperLeft[meridian]" placeholder="Trái" class="form-input text-right" />
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
                  <input type="number" step="0.1" v-model="meridianTemps.upperRight[meridian]" placeholder="Phải" class="form-input text-right" />
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
                  <input type="number" step="0.1" v-model="meridianTemps.lowerLeft[meridian]" placeholder="Trái" class="form-input text-right" />
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
                  <input type="number" step="0.1" v-model="meridianTemps.lowerRight[meridian]" placeholder="Phải" class="form-input text-right" />
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
              <label class="form-label">Nhiệt độ MT (°C)</label>
              <input type="number" step="0.1" v-model="form.environmentTemp" placeholder="VD: 26.5" class="form-input" />
            </div>
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
