<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { APP_PAGES, ALWAYS_ALLOWED } from '@/constants/pages'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id ?? null)

// ----- Kiểu dữ liệu trả về từ API -----
interface VaiTroLite {
  id: string
  ma: string
  ten: string
  laQuanTri: boolean
}

interface NguoiDungRow {
  id: string
  username: string
  hoTen: string | null
  email: string | null
  trangThai: boolean
  createdAt: string
  vaiTro: VaiTroLite | null
}

interface VaiTroRow {
  id: string
  ma: string
  ten: string
  moTa: string
  laQuanTri: boolean
  laHeThong: boolean
  trangCho: string[]
  createdAt?: string
}

type Tab = 'users' | 'roles'
const tab = ref<Tab>('users')

const isLoading = ref(true)
const error = ref<string | null>(null)
const users = ref<NguoiDungRow[]>([])
const roles = ref<VaiTroRow[]>([])

// Trang luôn mở cho mọi tài khoản (vd Trang Chủ) — không cho bỏ chọn trong vai trò.
const LOCKED_PAGES = ALWAYS_ALLOWED

async function fetchAll() {
  isLoading.value = true
  error.value = null
  try {
    const [u, r] = await Promise.all([
      api.get<NguoiDungRow[]>('/nguoi-dung'),
      api.get<VaiTroRow[]>('/vai-tro'),
    ])
    users.value = Array.isArray(u) ? u : []
    roles.value = Array.isArray(r) ? r : []
  } catch (err: any) {
    error.value = 'Lỗi khi tải dữ liệu: ' + (err.message || String(err))
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAll)

function isSelf(u: NguoiDungRow): boolean {
  return !!currentUserId.value && u.id === currentUserId.value
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Số tài khoản đang dùng một vai trò (tính từ danh sách đã tải). */
function accountsUsingRole(roleId: string): number {
  return users.value.filter((u) => u.vaiTro?.id === roleId).length
}

function pageLabel(key: string): string {
  return APP_PAGES.find((p) => p.key === key)?.label ?? key
}

// =====================================================================
// Tài khoản người dùng — modal tạo/sửa
// =====================================================================
const isSubmitting = ref(false)
const showUserModal = ref(false)
const editingUserId = ref<string | null>(null)
const userFormError = ref<string | null>(null)

interface UserForm {
  username: string
  password: string
  hoTen: string
  email: string
  vaiTroId: string
  trangThai: boolean
}

const userForm = ref<UserForm>(emptyUserForm())
function emptyUserForm(): UserForm {
  return { username: '', password: '', hoTen: '', email: '', vaiTroId: '', trangThai: true }
}

function openCreateUser() {
  editingUserId.value = null
  userForm.value = emptyUserForm()
  userForm.value.vaiTroId = roles.value[0]?.id ?? ''
  userFormError.value = null
  showUserModal.value = true
}

function openEditUser(u: NguoiDungRow) {
  editingUserId.value = u.id
  userForm.value = {
    username: u.username,
    password: '',
    hoTen: u.hoTen ?? '',
    email: u.email ?? '',
    vaiTroId: u.vaiTro?.id ?? '',
    trangThai: u.trangThai,
  }
  userFormError.value = null
  showUserModal.value = true
}

function closeUserModal() {
  showUserModal.value = false
  editingUserId.value = null
}

async function submitUser() {
  if (isSubmitting.value) return
  userFormError.value = null
  const f = userForm.value

  if (!editingUserId.value) {
    if (!f.username.trim()) {
      userFormError.value = 'Tên đăng nhập không được để trống.'
      return
    }
    if (!f.password || f.password.length < 6) {
      userFormError.value = 'Mật khẩu phải có ít nhất 6 ký tự.'
      return
    }
  }
  if (!f.vaiTroId) {
    userFormError.value = 'Phải chọn vai trò.'
    return
  }

  isSubmitting.value = true
  try {
    if (editingUserId.value) {
      await api.put(`/nguoi-dung/${editingUserId.value}`, {
        hoTen: f.hoTen.trim(),
        email: f.email.trim(),
        vaiTroId: f.vaiTroId,
        trangThai: f.trangThai,
      })
    } else {
      await api.post('/nguoi-dung', {
        username: f.username.trim(),
        password: f.password,
        hoTen: f.hoTen.trim() || undefined,
        email: f.email.trim() || undefined,
        vaiTroId: f.vaiTroId,
        trangThai: f.trangThai,
      })
    }
    await fetchAll()
    // Nếu vừa sửa chính mình (đổi vai trò) -> làm mới quyền của phiên hiện tại.
    if (editingUserId.value && editingUserId.value === currentUserId.value) {
      await authStore.fetchMe()
    }
    closeUserModal()
  } catch (err: any) {
    userFormError.value = err.message || 'Không lưu được tài khoản.'
  } finally {
    isSubmitting.value = false
  }
}

/** Bật/khoá nhanh trạng thái hoạt động của một tài khoản. */
async function toggleUserActive(u: NguoiDungRow) {
  if (isSelf(u)) return
  isSubmitting.value = true
  error.value = null
  try {
    await api.put(`/nguoi-dung/${u.id}`, { trangThai: !u.trangThai })
    await fetchAll()
  } catch (err: any) {
    error.value = err.message || 'Không đổi được trạng thái.'
  } finally {
    isSubmitting.value = false
  }
}

// ----- Đổi mật khẩu -----
const showPasswordModal = ref(false)
const passwordTarget = ref<NguoiDungRow | null>(null)
const newPassword = ref('')
const passwordError = ref<string | null>(null)

function openPasswordModal(u: NguoiDungRow) {
  passwordTarget.value = u
  newPassword.value = ''
  passwordError.value = null
  showPasswordModal.value = true
}

async function submitPassword() {
  if (isSubmitting.value || !passwordTarget.value) return
  if (!newPassword.value || newPassword.value.length < 6) {
    passwordError.value = 'Mật khẩu phải có ít nhất 6 ký tự.'
    return
  }
  isSubmitting.value = true
  try {
    await api.put(`/nguoi-dung/${passwordTarget.value.id}/mat-khau`, { password: newPassword.value })
    showPasswordModal.value = false
    passwordTarget.value = null
  } catch (err: any) {
    passwordError.value = err.message || 'Không đổi được mật khẩu.'
  } finally {
    isSubmitting.value = false
  }
}

// ----- Xoá tài khoản -----
const showDeleteUser = ref(false)
const deletingUser = ref<NguoiDungRow | null>(null)

function confirmDeleteUser(u: NguoiDungRow) {
  deletingUser.value = u
  showDeleteUser.value = true
}

async function handleDeleteUser() {
  if (isSubmitting.value || !deletingUser.value) return
  isSubmitting.value = true
  try {
    await api.delete(`/nguoi-dung/${deletingUser.value.id}`)
    showDeleteUser.value = false
    deletingUser.value = null
    await fetchAll()
  } catch (err: any) {
    error.value = err.message || 'Không xoá được tài khoản.'
    showDeleteUser.value = false
    deletingUser.value = null
  } finally {
    isSubmitting.value = false
  }
}

// =====================================================================
// Vai trò & phân quyền — modal tạo/sửa
// =====================================================================
const showRoleModal = ref(false)
const editingRole = ref<VaiTroRow | null>(null)
const roleFormError = ref<string | null>(null)

interface RoleForm {
  ten: string
  moTa: string
  trangCho: string[]
}
const roleForm = ref<RoleForm>({ ten: '', moTa: '', trangCho: [] })

function openCreateRole() {
  editingRole.value = null
  roleForm.value = { ten: '', moTa: '', trangCho: [...LOCKED_PAGES] }
  roleFormError.value = null
  showRoleModal.value = true
}

function openEditRole(r: VaiTroRow) {
  editingRole.value = r
  const base = r.laQuanTri ? APP_PAGES.map((p) => p.key) : [...(r.trangCho || [])]
  // Đảm bảo các trang luôn-mở có mặt.
  for (const k of LOCKED_PAGES) if (!base.includes(k)) base.push(k)
  roleForm.value = { ten: r.ten, moTa: r.moTa || '', trangCho: base }
  roleFormError.value = null
  showRoleModal.value = true
}

function closeRoleModal() {
  showRoleModal.value = false
  editingRole.value = null
}

const isAdminRole = computed(() => !!editingRole.value?.laQuanTri)

function isPageChecked(key: string): boolean {
  return isAdminRole.value || roleForm.value.trangCho.includes(key)
}

function togglePage(key: string) {
  if (isAdminRole.value) return // vai trò Quản Trị luôn full quyền
  if (LOCKED_PAGES.has(key)) return // trang luôn mở, không bỏ được
  const list = roleForm.value.trangCho
  roleForm.value.trangCho = list.includes(key)
    ? list.filter((k) => k !== key)
    : [...list, key]
}

async function submitRole() {
  if (isSubmitting.value) return
  roleFormError.value = null
  if (!roleForm.value.ten.trim()) {
    roleFormError.value = 'Tên vai trò không được để trống.'
    return
  }
  isSubmitting.value = true
  try {
    const payload = {
      ten: roleForm.value.ten.trim(),
      moTa: roleForm.value.moTa.trim(),
      trangCho: roleForm.value.trangCho,
    }
    if (editingRole.value) {
      await api.put(`/vai-tro/${editingRole.value.id}`, payload)
    } else {
      await api.post('/vai-tro', payload)
    }
    await fetchAll()
    // Đổi quyền của vai trò mình đang mang -> làm mới phiên.
    if (editingRole.value && editingRole.value.id === authStore.user?.vaiTro?.id) {
      await authStore.fetchMe()
    }
    closeRoleModal()
  } catch (err: any) {
    roleFormError.value = err.message || 'Không lưu được vai trò.'
  } finally {
    isSubmitting.value = false
  }
}

// ----- Xoá vai trò -----
const showDeleteRole = ref(false)
const deletingRole = ref<VaiTroRow | null>(null)

function confirmDeleteRole(r: VaiTroRow) {
  deletingRole.value = r
  showDeleteRole.value = true
}

async function handleDeleteRole() {
  if (isSubmitting.value || !deletingRole.value) return
  isSubmitting.value = true
  try {
    await api.delete(`/vai-tro/${deletingRole.value.id}`)
    showDeleteRole.value = false
    deletingRole.value = null
    await fetchAll()
  } catch (err: any) {
    error.value = err.message || 'Không xoá được vai trò.'
    showDeleteRole.value = false
    deletingRole.value = null
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="management-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Quản Lý Người Dùng</h1>
        <p class="page-subtitle">Quản lý tài khoản nhân viên và phân quyền truy cập theo vai trò</p>
      </div>
      <button v-if="tab === 'users'" type="button" class="btn-primary" @click="openCreateUser">
        + Thêm Tài Khoản
      </button>
      <button v-else type="button" class="btn-primary" @click="openCreateRole">+ Thêm Vai Trò</button>
    </div>

    <div class="sub-tabs" role="tablist" aria-label="Phân loại">
      <button
        type="button"
        role="tab"
        class="sub-tab"
        :class="{ active: tab === 'users' }"
        :aria-selected="tab === 'users'"
        @click="tab = 'users'"
      >
        Tài Khoản
        <span class="sub-tab__count">{{ users.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="sub-tab"
        :class="{ active: tab === 'roles' }"
        :aria-selected="tab === 'roles'"
        @click="tab = 'roles'"
      >
        Vai Trò &amp; Phân Quyền
        <span class="sub-tab__count">{{ roles.length }}</span>
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchAll">Thử lại</button>
    </div>

    <template v-else>
      <!-- ===================== TAB: TÀI KHOẢN ===================== -->
      <div v-show="tab === 'users'" class="data-card">
        <div class="card-header">
          <h3>Danh Sách Tài Khoản</h3>
          <span class="badge badge-success">{{ users.length }} tài khoản</span>
        </div>

        <div v-if="users.length === 0" class="empty-state">Chưa có tài khoản nào</div>

        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên Đăng Nhập</th>
                <th>Họ Tên</th>
                <th>Email</th>
                <th>Vai Trò</th>
                <th>Trạng Thái</th>
                <th>Ngày Tạo</th>
                <th class="col-actions">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td>
                  <span class="username">{{ u.username }}</span>
                  <span v-if="isSelf(u)" class="self-tag">Bạn</span>
                </td>
                <td>{{ u.hoTen || '—' }}</td>
                <td class="email-cell">{{ u.email || '—' }}</td>
                <td>
                  <span v-if="u.vaiTro" class="role-chip" :class="{ 'role-chip--admin': u.vaiTro.laQuanTri }">
                    {{ u.vaiTro.ten }}
                  </span>
                  <span v-else class="muted">Chưa gán</span>
                </td>
                <td>
                  <button
                    type="button"
                    class="status-pill"
                    :class="u.trangThai ? 'status-pill--on' : 'status-pill--off'"
                    :disabled="isSelf(u) || isSubmitting"
                    :title="isSelf(u) ? 'Không thể tự khoá chính mình' : (u.trangThai ? 'Bấm để khoá' : 'Bấm để mở khoá')"
                    @click="toggleUserActive(u)"
                  >
                    {{ u.trangThai ? 'Hoạt Động' : 'Đã Khoá' }}
                  </button>
                </td>
                <td class="date-cell">{{ formatDate(u.createdAt) }}</td>
                <td class="col-actions">
                  <div class="row-actions">
                    <button type="button" class="btn-action btn-edit" @click="openEditUser(u)">Sửa</button>
                    <button type="button" class="btn-action" @click="openPasswordModal(u)">Mật Khẩu</button>
                    <button
                      type="button"
                      class="btn-action btn-delete"
                      :disabled="isSelf(u)"
                      :title="isSelf(u) ? 'Không thể tự xoá chính mình' : 'Xoá tài khoản'"
                      @click="confirmDeleteUser(u)"
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===================== TAB: VAI TRÒ ===================== -->
      <div v-show="tab === 'roles'" class="data-card">
        <div class="card-header">
          <h3>Vai Trò &amp; Phân Quyền</h3>
          <span class="badge badge-success">{{ roles.length }} vai trò</span>
        </div>

        <div v-if="roles.length === 0" class="empty-state">Chưa có vai trò nào</div>

        <div v-else class="role-grid">
          <article v-for="r in roles" :key="r.id" class="role-card">
            <header class="role-card__head">
              <div class="role-card__title">
                <h4 class="role-card__name">{{ r.ten }}</h4>
                <span v-if="r.laQuanTri" class="role-badge role-badge--admin">Toàn Quyền</span>
                <span v-else-if="r.laHeThong" class="role-badge">Hệ Thống</span>
              </div>
              <div class="row-actions">
                <button type="button" class="btn-action btn-edit" @click="openEditRole(r)">Sửa</button>
                <button
                  type="button"
                  class="btn-action btn-delete"
                  :disabled="r.laHeThong"
                  :title="r.laHeThong ? 'Vai trò mặc định — không thể xoá' : 'Xoá vai trò'"
                  @click="confirmDeleteRole(r)"
                >
                  Xoá
                </button>
              </div>
            </header>

            <p v-if="r.moTa" class="role-card__desc">{{ r.moTa }}</p>

            <div class="role-card__meta">
              <span class="meta-chip">{{ accountsUsingRole(r.id) }} tài khoản</span>
              <span class="meta-chip">
                {{ r.laQuanTri ? APP_PAGES.length : (r.trangCho?.length || 0) }} / {{ APP_PAGES.length }} trang
              </span>
            </div>

            <div class="role-card__pages">
              <span v-if="r.laQuanTri" class="page-tag page-tag--all">Tất cả các trang</span>
              <template v-else>
                <span v-for="key in r.trangCho" :key="key" class="page-tag">{{ pageLabel(key) }}</span>
                <span v-if="!r.trangCho || r.trangCho.length === 0" class="muted">Chưa cấp quyền trang nào</span>
              </template>
            </div>
          </article>
        </div>
      </div>
    </template>

    <!-- ===================== MODAL: TÀI KHOẢN ===================== -->
    <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingUserId ? 'Sửa Tài Khoản' : 'Thêm Tài Khoản' }}</h3>
          <button type="button" class="modal-close" aria-label="Đóng" @click="closeUserModal">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="submitUser">
          <p v-if="userFormError" class="form-error">{{ userFormError }}</p>

          <div class="form-grid">
            <label class="field field--full">
              <span>Tên đăng nhập</span>
              <input
                v-model="userForm.username"
                class="input"
                :disabled="!!editingUserId"
                placeholder="vd. bacsi_an"
                autocomplete="off"
              />
              <small v-if="editingUserId" class="field-hint">Không thể đổi tên đăng nhập.</small>
            </label>

            <label v-if="!editingUserId" class="field field--full">
              <span>Mật khẩu</span>
              <input
                v-model="userForm.password"
                type="password"
                class="input"
                placeholder="Ít nhất 6 ký tự"
                autocomplete="new-password"
              />
            </label>

            <label class="field">
              <span>Họ tên</span>
              <input v-model="userForm.hoTen" class="input" placeholder="vd. Nguyễn Văn An" />
            </label>

            <label class="field">
              <span>Email</span>
              <input v-model="userForm.email" type="email" class="input" placeholder="vd. an@phongkham.vn" />
            </label>

            <label class="field field--full">
              <span>Vai trò</span>
              <select v-model="userForm.vaiTroId" class="input">
                <option value="" disabled>— Chọn vai trò —</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.ten }}</option>
              </select>
            </label>

            <label class="field field--full checkbox-field">
              <input v-model="userForm.trangThai" type="checkbox" />
              <span>Cho phép đăng nhập (tài khoản hoạt động)</span>
            </label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="closeUserModal">Huỷ</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===================== MODAL: ĐỔI MẬT KHẨU ===================== -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal modal--sm" @click.stop>
        <div class="modal-header">
          <h3>Đổi Mật Khẩu</h3>
          <button type="button" class="modal-close" aria-label="Đóng" @click="showPasswordModal = false">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="submitPassword">
          <p class="muted-text">
            Đặt mật khẩu mới cho <strong>{{ passwordTarget?.username }}</strong>.
          </p>
          <p v-if="passwordError" class="form-error">{{ passwordError }}</p>
          <label class="field field--full">
            <span>Mật khẩu mới</span>
            <input
              v-model="newPassword"
              type="password"
              class="input"
              placeholder="Ít nhất 6 ký tự"
              autocomplete="new-password"
            />
          </label>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="showPasswordModal = false">
              Huỷ
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Đang lưu…' : 'Đổi Mật Khẩu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===================== MODAL: VAI TRÒ ===================== -->
    <div v-if="showRoleModal" class="modal-overlay" @click.self="closeRoleModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingRole ? 'Sửa Vai Trò' : 'Thêm Vai Trò' }}</h3>
          <button type="button" class="modal-close" aria-label="Đóng" @click="closeRoleModal">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="submitRole">
          <p v-if="roleFormError" class="form-error">{{ roleFormError }}</p>

          <label class="field field--full">
            <span>Tên vai trò</span>
            <input v-model="roleForm.ten" class="input" placeholder="vd. Điều Dưỡng" />
          </label>

          <label class="field field--full">
            <span>Mô tả</span>
            <textarea v-model="roleForm.moTa" class="textarea" rows="2" placeholder="Mô tả ngắn về vai trò này"></textarea>
          </label>

          <div class="field field--full">
            <div class="field-head">
              <span class="field-label">Trang được phép truy cập</span>
              <span v-if="!isAdminRole" class="field-count">{{ roleForm.trangCho.length }} / {{ APP_PAGES.length }}</span>
            </div>
            <p v-if="isAdminRole" class="muted-text">Vai trò Quản Trị Viên luôn có toàn quyền — không cần chọn trang.</p>
            <div class="page-picker">
              <label
                v-for="p in APP_PAGES"
                :key="p.key"
                class="page-check"
                :class="{ 'page-check--locked': isAdminRole || LOCKED_PAGES.has(p.key) }"
              >
                <input
                  type="checkbox"
                  :checked="isPageChecked(p.key)"
                  :disabled="isAdminRole || LOCKED_PAGES.has(p.key)"
                  @change="togglePage(p.key)"
                />
                <span>{{ p.label }}</span>
                <small v-if="LOCKED_PAGES.has(p.key) && !isAdminRole" class="lock-note">luôn mở</small>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="closeRoleModal">Huỷ</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===================== MODAL: XOÁ TÀI KHOẢN ===================== -->
    <div v-if="showDeleteUser" class="modal-overlay" @click.self="showDeleteUser = false">
      <div class="modal modal--sm" @click.stop>
        <div class="modal-header">
          <h3>Xác Nhận Xoá</h3>
          <button type="button" class="modal-close" @click="showDeleteUser = false">✕</button>
        </div>
        <div class="modal-body">
          <p>
            Xoá tài khoản <strong>{{ deletingUser?.username }}</strong>? Thao tác không hoàn tác.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="showDeleteUser = false">Huỷ</button>
          <button type="button" class="btn-danger" :disabled="isSubmitting" @click="handleDeleteUser">
            {{ isSubmitting ? 'Đang xoá…' : 'Xoá' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== MODAL: XOÁ VAI TRÒ ===================== -->
    <div v-if="showDeleteRole" class="modal-overlay" @click.self="showDeleteRole = false">
      <div class="modal modal--sm" @click.stop>
        <div class="modal-header">
          <h3>Xác Nhận Xoá</h3>
          <button type="button" class="modal-close" @click="showDeleteRole = false">✕</button>
        </div>
        <div class="modal-body">
          <p>
            Xoá vai trò <strong>{{ deletingRole?.ten }}</strong>? Thao tác không hoàn tác.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="showDeleteRole = false">Huỷ</button>
          <button type="button" class="btn-danger" :disabled="isSubmitting" @click="handleDeleteRole">
            {{ isSubmitting ? 'Đang xoá…' : 'Xoá' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.management-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-8);
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 2px solid var(--brown-100);
}
.header-content { flex: 1; min-width: 200px; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-800); margin-bottom: var(--space-1); }
.page-subtitle { color: var(--gray-500); font-size: var(--font-size-md); }

.btn-primary {
  padding: var(--space-3) var(--space-5);
  background: var(--brown-600);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn-primary:hover { background: var(--brown-700); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary {
  padding: var(--space-3) var(--space-5);
  background: var(--white);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover { background: var(--gray-50); }
.btn-danger {
  padding: var(--space-3) var(--space-5);
  background: var(--danger);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
.mt-4 { margin-top: var(--space-4); }

/* Tabs */
.sub-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--brown-100);
  flex-wrap: wrap;
}
.sub-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  color: var(--gray-600);
  font-weight: 600;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  transition: all var(--transition-base);
  margin-bottom: -1px;
}
.sub-tab:hover { color: var(--brown-600); background: var(--brown-50); }
.sub-tab.active {
  background: var(--white);
  color: var(--brown-700);
  border-color: var(--brown-200);
  border-bottom-color: var(--white);
}
.sub-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  background: var(--gray-100);
  color: var(--gray-600);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}
.sub-tab.active .sub-tab__count { background: var(--brown-600); color: var(--white); }

/* Data card */
.data-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); background: var(--brown-50); border-bottom: 1px solid var(--brown-100); }
.card-header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-900); margin: 0; }
.badge { display: inline-block; padding: 4px 10px; border-radius: var(--radius-full, 999px); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-success { background: var(--success-bg); color: var(--success-fg); }

.empty-state {
  padding: var(--space-12) var(--space-5);
  text-align: center;
  color: var(--gray-500);
  font-size: var(--font-size-md);
  background: linear-gradient(180deg, #fff 0%, var(--surface-2) 100%);
}

/* Users table */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.data-table thead th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-2);
  color: var(--gray-600);
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  border-bottom: 1px solid var(--gray-200);
}
.data-table tbody td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--gray-100);
  color: var(--gray-800);
  vertical-align: middle;
}
.data-table tbody tr:hover { background: var(--brown-50); }
.col-actions { text-align: right; }
.username { font-weight: 700; color: var(--brown-900); }
.self-tag {
  margin-left: 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--brown-700);
  background: var(--brown-100);
  padding: 1px 6px;
  border-radius: 999px;
  text-transform: uppercase;
}
.email-cell { color: var(--gray-600); }
.date-cell { color: var(--gray-500); white-space: nowrap; }

.role-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-200);
}
.role-chip--admin { background: var(--brown-100); color: var(--brown-800); border-color: var(--brown-200); }

.status-pill {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.status-pill--on { background: var(--success-bg); color: var(--success-fg); }
.status-pill--off { background: var(--danger-bg); color: var(--danger); }
.status-pill:disabled { cursor: not-allowed; opacity: 0.85; }
.status-pill:not(:disabled):hover { filter: brightness(0.95); }

.row-actions { display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.btn-action {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-200);
  background: var(--white);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.btn-action:hover { background: var(--brown-50); border-color: var(--brown-300); color: var(--brown-700); }
.btn-edit:hover { background: var(--brown-50); border-color: var(--brown-400); color: var(--brown-700); }
.btn-delete { color: var(--danger); }
.btn-delete:hover:not(:disabled) { background: var(--danger-bg); border-color: var(--danger-border); }
.btn-action:disabled { opacity: 0.45; cursor: not-allowed; }

/* Roles grid */
.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--surface-2);
}
.role-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--white);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: 0 1px 2px rgba(74, 47, 23, 0.04);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}
.role-card:hover { box-shadow: 0 6px 18px rgba(74, 47, 23, 0.08); border-color: var(--brown-200); }
.role-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); }
.role-card__title { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; min-width: 0; }
.role-card__name { margin: 0; font-size: var(--font-size-md); font-weight: 700; color: var(--brown-900); }
.role-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--gray-100);
  color: var(--gray-600);
}
.role-badge--admin { background: var(--brown-600); color: var(--white); }
.role-card__desc { margin: 0; font-size: var(--font-size-sm); color: var(--gray-600); line-height: 1.5; }
.role-card__meta { display: flex; gap: 6px; flex-wrap: wrap; }
.meta-chip {
  font-size: 11px;
  font-weight: 600;
  color: var(--brown-700);
  background: var(--brown-50);
  border: 1px solid var(--brown-100);
  padding: 2px 8px;
  border-radius: 999px;
}
.role-card__pages { display: flex; flex-wrap: wrap; gap: 4px; }
.page-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-700);
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
.page-tag--all { background: var(--brown-100); color: var(--brown-800); border-color: var(--brown-200); }
.muted { color: var(--gray-400); font-style: italic; }

/* Loading / error */
.loading-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-12) 0; color: var(--brown-600); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-8); color: var(--danger); background: var(--danger-bg); border-radius: var(--radius-lg); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: var(--space-4);
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg, 0 20px 25px -5px rgba(0,0,0,0.1));
  overflow: hidden;
}
.modal--sm { max-width: 440px; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--gray-100);
}
.modal-header h3 { margin: 0; font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-800); }
.modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--gray-500); }
.modal-close:hover { color: var(--gray-800); }
.modal-body { padding: var(--space-5); overflow-y: auto; flex: 1; }
.modal-footer {
  display: flex; gap: var(--space-2); justify-content: flex-end;
  padding: var(--space-4) 0 0;
  margin-top: var(--space-4);
  border-top: 1px solid var(--gray-100);
}

.form-error {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  font-size: var(--font-size-sm);
}
.muted-text { color: var(--gray-600); font-size: var(--font-size-sm); margin-bottom: var(--space-3); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: var(--space-3); }
.form-grid .field { margin-bottom: 0; }
.field--full { grid-column: 1 / -1; }
.field > span,
.field-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.field-hint { font-size: 11px; color: var(--gray-500); margin-top: 2px; }

.checkbox-field { flex-direction: row; align-items: center; gap: var(--space-2); cursor: pointer; }
.checkbox-field input { width: 16px; height: 16px; accent-color: var(--brown-600); cursor: pointer; }
.checkbox-field span { font-weight: 500; color: var(--gray-700); }

.input, .textarea, select.input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-family: inherit;
  background: var(--white);
  color: var(--gray-800);
}
.input:focus, .textarea:focus, select.input:focus {
  outline: none;
  border-color: var(--brown-500);
  box-shadow: var(--focus-ring);
}
.input:disabled { background: var(--gray-50); color: var(--gray-500); cursor: not-allowed; }
.textarea { resize: vertical; min-height: 56px; }

.field-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
.field-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--brown-600);
  background: var(--brown-50);
  padding: 1px 8px;
  border-radius: var(--radius-full, 999px);
}

.page-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px;
  padding: var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--gray-50);
  margin-top: 6px;
}
.page-check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--gray-700);
  transition: background var(--transition-fast);
}
.page-check:hover { background: var(--white); }
.page-check input { width: 16px; height: 16px; accent-color: var(--brown-600); cursor: pointer; }
.page-check--locked { cursor: default; color: var(--gray-500); }
.page-check--locked:hover { background: transparent; }
.lock-note {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  color: var(--brown-600);
  background: var(--brown-50);
  padding: 0 6px;
  border-radius: 999px;
}

@media (max-width: 640px) {
  .sub-tabs { flex-wrap: nowrap; }
  .sub-tab { flex: 1 1 0; justify-content: center; padding: var(--space-2); white-space: nowrap; }
  .form-grid { grid-template-columns: 1fr; }
  .modal { max-height: 95vh; }
  .modal-body { padding: var(--space-4); }
  .modal-header { padding: var(--space-3) var(--space-4); }
}
</style>
