<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '@/services/api'

/** Lấy thông điệp lỗi an toàn (không dùng `any` — giữ lint sạch). */
function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// ── Kiểu dữ liệu (khớp backend kiem-dinh-vi-thuoc) ──────────────────────────
interface RefCounts {
  bai_thuoc: number
  nhom: number
  cong_dung: number
  chu_tri: number
  kieng_ky: number
}
interface DupMember {
  id: number
  ten_vi_thuoc: string
  ten_han: string | null
  ten_pinyin: string | null
  ten_khoa_hoc: string | null
  tinh: string | null
  vi: string | null
  quy_kinh: string | null
  refs: RefCounts
  total_refs: number
  completeness: number
}
interface DupCluster {
  key: string
  suggested_keep_id: number
  reasons: string[]
  members: DupMember[]
}
interface Verdict {
  key: string
  same: boolean
  reason: string
}
interface IssueItem {
  id: number
  ten_vi_thuoc: string
}
interface AuditIssues {
  total: number
  khong_nhom: IssueItem[]
  thieu_tac_dung: IssueItem[]
  thieu_kieng_ky: IssueItem[]
  thieu_tinh_vi: IssueItem[]
}
interface NhomCheckResult {
  id: number
  ten_vi_thuoc: string
  current: { id: number; ten: string }[]
  suggested: { id: number; ten: string } | null
  match: boolean
  ly_do?: string
}

/** Trạng thái UI gắn cho mỗi cụm trùng. */
interface ClusterUI extends DupCluster {
  keepId: number
  verdict: Verdict | null
  aiLoading: boolean
  confirming: boolean
  merging: boolean
  merged: boolean
  mergeMsg: string
}

const subTab = ref<'gom' | 'rasoat'>('gom')

// ════════════════════ A. GOM BIẾN THỂ ════════════════════
const dupLoading = ref(false)
const dupError = ref('')
const dupLoaded = ref(false)
const clusters = ref<ClusterUI[]>([])
const aiAllLoading = ref(false)

const activeClusters = computed(() => clusters.value.filter((c) => !c.merged))
const mergedCount = computed(() => clusters.value.filter((c) => c.merged).length)

function memberPayload(c: ClusterUI) {
  return c.members.map((m) => ({
    id: m.id,
    ten_vi_thuoc: m.ten_vi_thuoc,
    ten_han: m.ten_han,
    ten_pinyin: m.ten_pinyin,
    ten_khoa_hoc: m.ten_khoa_hoc,
  }))
}

async function scanDuplicates() {
  dupLoading.value = true
  dupError.value = ''
  try {
    const res = await api.get<{ success: boolean; data: DupCluster[] }>(
      '/kiem-dinh-vi-thuoc/duplicates',
    )
    clusters.value = (res.data ?? []).map((c) => ({
      ...c,
      keepId: c.suggested_keep_id,
      verdict: null,
      aiLoading: false,
      confirming: false,
      merging: false,
      merged: false,
      mergeMsg: '',
    }))
    dupLoaded.value = true
  } catch (e) {
    dupError.value = errMsg(e)
  } finally {
    dupLoading.value = false
  }
}

async function aiConfirm(c: ClusterUI) {
  c.aiLoading = true
  try {
    const res = await api.post<{ success: boolean; data: Verdict[] }>(
      '/kiem-dinh-vi-thuoc/duplicates/ai-confirm',
      { clusters: [{ key: c.key, members: memberPayload(c) }] },
    )
    c.verdict = res.data?.[0] ?? null
  } catch (e) {
    c.verdict = { key: c.key, same: false, reason: 'Lỗi gọi AI: ' + errMsg(e) }
  } finally {
    c.aiLoading = false
  }
}

async function aiConfirmAll() {
  const pending = activeClusters.value.filter((c) => !c.verdict)
  if (!pending.length) return
  aiAllLoading.value = true
  for (const c of pending) c.aiLoading = true
  try {
    const res = await api.post<{ success: boolean; data: Verdict[] }>(
      '/kiem-dinh-vi-thuoc/duplicates/ai-confirm',
      { clusters: pending.map((c) => ({ key: c.key, members: memberPayload(c) })) },
    )
    const byKey = new Map((res.data ?? []).map((v) => [v.key, v]))
    for (const c of pending) c.verdict = byKey.get(c.key) ?? c.verdict
  } catch (e) {
    dupError.value = errMsg(e)
  } finally {
    for (const c of pending) c.aiLoading = false
    aiAllLoading.value = false
  }
}

async function doMerge(c: ClusterUI) {
  c.merging = true
  c.confirming = false
  try {
    const mergeIds = c.members.map((m) => m.id).filter((id) => id !== c.keepId)
    const res = await api.post<{
      success: boolean
      data: { moved: Record<string, number>; merged_ids: number[] }
    }>('/kiem-dinh-vi-thuoc/merge', { keepId: c.keepId, mergeIds })
    const keepName = c.members.find((m) => m.id === c.keepId)?.ten_vi_thuoc ?? ''
    c.merged = true
    c.mergeMsg = `Đã gộp ${mergeIds.length} biến thể → giữ "${keepName}". Dời: ${summarizeMoved(res.data?.moved ?? {})}.`
  } catch (e) {
    c.mergeMsg = 'Lỗi gộp: ' + errMsg(e)
  } finally {
    c.merging = false
  }
}

function summarizeMoved(m: Record<string, number>): string {
  const labels: Record<string, string> = {
    bai_thuoc: 'bài thuốc',
    nhom_nho: 'nhóm',
    cong_dung: 'công dụng',
    chu_tri: 'chủ trị',
    kieng_ky: 'kiêng kỵ',
    kinh_mach: 'kinh mạch',
    ten_goi_khac: 'tên gọi khác',
  }
  const parts = Object.entries(m)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${v} ${labels[k] ?? k}`)
  return parts.length ? parts.join(', ') : 'không có tham chiếu cần dời'
}

// ════════════════════ B. RÀ SOÁT DỮ LIỆU ════════════════════
const issuesLoading = ref(false)
const issuesError = ref('')
const issues = ref<AuditIssues | null>(null)
const openGroup = ref<string | null>('khong_nhom')

const issueGroups = computed(() => {
  const i = issues.value
  if (!i) return []
  return [
    { key: 'khong_nhom', label: 'Chưa thuộc nhóm dược', items: i.khong_nhom, danger: true },
    { key: 'thieu_tac_dung', label: 'Thiếu tác dụng (công dụng/chủ trị)', items: i.thieu_tac_dung, danger: true },
    { key: 'thieu_tinh_vi', label: 'Thiếu tính / vị / quy kinh', items: i.thieu_tinh_vi, danger: false },
    { key: 'thieu_kieng_ky', label: 'Chưa khai báo kiêng kỵ', items: i.thieu_kieng_ky, danger: false },
  ]
})

async function loadIssues() {
  issuesLoading.value = true
  issuesError.value = ''
  try {
    const res = await api.get<{ success: boolean; data: AuditIssues }>(
      '/kiem-dinh-vi-thuoc/issues',
    )
    issues.value = res.data
  } catch (e) {
    issuesError.value = errMsg(e)
  } finally {
    issuesLoading.value = false
  }
}

function toggleGroup(key: string) {
  openGroup.value = openGroup.value === key ? null : key
}

// AI gợi ý nhóm cho vị chưa phân nhóm (theo lô ≤ 60).
const nhomCheckLoading = ref(false)
const nhomCheckError = ref('')
const nhomResults = ref<NhomCheckResult[]>([])
const applyingId = ref<number | null>(null)

async function suggestNhomForUngrouped() {
  const items = issues.value?.khong_nhom ?? []
  if (!items.length) return
  nhomCheckLoading.value = true
  nhomCheckError.value = ''
  try {
    const ids = items.slice(0, 60).map((i) => i.id)
    const res = await api.post<{ success: boolean; data: NhomCheckResult[] }>(
      '/kiem-dinh-vi-thuoc/check-nhom',
      { ids },
    )
    nhomResults.value = res.data ?? []
  } catch (e) {
    nhomCheckError.value = errMsg(e)
  } finally {
    nhomCheckLoading.value = false
  }
}

async function applySuggested(r: NhomCheckResult) {
  if (!r.suggested) return
  applyingId.value = r.id
  try {
    const ids = Array.from(new Set([...r.current.map((c) => c.id), r.suggested.id]))
    await api.put(`/vi-thuoc/${r.id}`, { nhom_nho_ids: ids })
    const sug = r.suggested
    r.current = ids.map(
      (id) => r.current.find((c) => c.id === id) ?? { id, ten: id === sug.id ? sug.ten : '' },
    )
    r.match = true
  } catch (e) {
    nhomCheckError.value = `Áp dụng nhóm cho "${r.ten_vi_thuoc}" thất bại: ${errMsg(e)}`
  } finally {
    applyingId.value = null
  }
}
</script>

<template>
  <div class="audit">
    <div class="audit-head">
      <div>
        <h2 class="audit-title">Kiểm định vị thuốc</h2>
        <p class="audit-sub">Gom biến thể trùng &amp; rà soát nhóm dược / tác dụng / kiêng kỵ. Mọi thay đổi đều cần bạn duyệt.</p>
      </div>
      <div class="sub-switch" role="tablist">
        <button role="tab" class="sw-btn" :class="{ active: subTab === 'gom' }" @click="subTab = 'gom'">
          Gom biến thể
        </button>
        <button role="tab" class="sw-btn" :class="{ active: subTab === 'rasoat' }" @click="subTab = 'rasoat'">
          Rà soát dữ liệu
        </button>
      </div>
    </div>

    <!-- ═══════════ GOM BIẾN THỂ ═══════════ -->
    <section v-show="subTab === 'gom'" class="panel">
      <div class="panel-bar">
        <button class="btn btn-primary" :disabled="dupLoading" @click="scanDuplicates">
          {{ dupLoading ? 'Đang quét…' : dupLoaded ? 'Quét lại' : 'Quét vị thuốc nghi trùng' }}
        </button>
        <button
          v-if="activeClusters.length"
          class="btn btn-ghost"
          :disabled="aiAllLoading"
          @click="aiConfirmAll"
        >
          {{ aiAllLoading ? 'AI đang xác nhận…' : 'AI xác nhận tất cả' }}
        </button>
        <span v-if="dupLoaded" class="bar-note">
          {{ activeClusters.length }} cụm nghi trùng<span v-if="mergedCount"> · đã gộp {{ mergedCount }}</span>
        </span>
      </div>

      <p v-if="dupError" class="msg msg-err">{{ dupError }}</p>
      <p v-if="dupLoaded && !clusters.length" class="msg msg-ok">
        Không phát hiện vị thuốc nào nghi trùng. 🎉
      </p>

      <div class="cluster-list">
        <article
          v-for="c in clusters"
          :key="c.key"
          class="cluster"
          :class="{ 'is-merged': c.merged }"
        >
          <header class="cluster-head">
            <span class="cluster-count">{{ c.members.length }} biến thể</span>
            <span v-for="r in c.reasons" :key="r" class="tag">{{ r }}</span>
            <span
              v-if="c.verdict"
              class="verdict"
              :class="c.verdict.same ? 'verdict-yes' : 'verdict-no'"
              :title="c.verdict.reason"
            >
              {{ c.verdict.same ? '✓ AI: cùng vị' : '⚠ AI: nghi khác vị' }}
            </span>
          </header>

          <p v-if="c.verdict" class="verdict-reason">{{ c.verdict.reason }}</p>

          <ul v-if="!c.merged" class="members">
            <li v-for="m in c.members" :key="m.id" class="member">
              <label class="keep-pick">
                <input type="radio" :name="'keep-' + c.key" :value="m.id" v-model="c.keepId" />
                <span class="keep-label">Giữ</span>
              </label>
              <div class="member-main">
                <span class="member-name">{{ m.ten_vi_thuoc }}</span>
                <span v-if="m.ten_han" class="member-meta">{{ m.ten_han }}</span>
                <span v-if="m.ten_pinyin" class="member-meta">{{ m.ten_pinyin }}</span>
                <span v-if="m.ten_khoa_hoc" class="member-meta member-sci">{{ m.ten_khoa_hoc }}</span>
              </div>
              <div class="member-refs">
                <span v-if="m.refs.bai_thuoc" class="ref">{{ m.refs.bai_thuoc }} bài</span>
                <span v-if="m.refs.nhom" class="ref">{{ m.refs.nhom }} nhóm</span>
                <span v-if="m.refs.cong_dung" class="ref">{{ m.refs.cong_dung }} CD</span>
                <span v-if="m.refs.chu_tri" class="ref">{{ m.refs.chu_tri }} CT</span>
                <span v-if="m.refs.kieng_ky" class="ref">{{ m.refs.kieng_ky }} KK</span>
                <span v-if="!m.total_refs" class="ref ref-empty">chưa dùng</span>
              </div>
            </li>
          </ul>

          <p v-if="c.mergeMsg" class="msg" :class="c.merged ? 'msg-ok' : 'msg-err'">{{ c.mergeMsg }}</p>

          <footer v-if="!c.merged" class="cluster-foot">
            <button class="btn btn-sm btn-ghost" :disabled="c.aiLoading" @click="aiConfirm(c)">
              {{ c.aiLoading ? 'Đang hỏi AI…' : 'AI xác nhận cùng vị' }}
            </button>

            <template v-if="!c.confirming">
              <button
                class="btn btn-sm"
                :class="c.verdict && !c.verdict.same ? 'btn-warn' : 'btn-primary'"
                :disabled="c.merging"
                @click="c.confirming = true"
              >
                Gộp về vị đang giữ
              </button>
            </template>
            <template v-else>
              <span class="confirm-q">
                {{ c.verdict && !c.verdict.same ? 'AI nghi khác vị — vẫn gộp?' : 'Xác nhận gộp?' }}
              </span>
              <button class="btn btn-sm btn-primary" :disabled="c.merging" @click="doMerge(c)">
                {{ c.merging ? 'Đang gộp…' : 'Đồng ý' }}
              </button>
              <button class="btn btn-sm btn-ghost" :disabled="c.merging" @click="c.confirming = false">
                Huỷ
              </button>
            </template>
          </footer>
        </article>
      </div>
    </section>

    <!-- ═══════════ RÀ SOÁT DỮ LIỆU ═══════════ -->
    <section v-show="subTab === 'rasoat'" class="panel">
      <div class="panel-bar">
        <button class="btn btn-primary" :disabled="issuesLoading" @click="loadIssues">
          {{ issuesLoading ? 'Đang rà soát…' : issues ? 'Rà soát lại' : 'Rà soát toàn bộ vị thuốc' }}
        </button>
        <span v-if="issues" class="bar-note">{{ issues.total }} vị thuốc</span>
      </div>

      <p v-if="issuesError" class="msg msg-err">{{ issuesError }}</p>

      <div v-if="issues" class="issue-groups">
        <div v-for="g in issueGroups" :key="g.key" class="issue-group">
          <button class="issue-head" :class="{ open: openGroup === g.key }" @click="toggleGroup(g.key)">
            <span class="issue-dot" :class="g.danger ? 'dot-danger' : 'dot-warn'"></span>
            <span class="issue-label">{{ g.label }}</span>
            <span class="issue-count">{{ g.items.length }}</span>
            <span class="issue-chev">{{ openGroup === g.key ? '▾' : '▸' }}</span>
          </button>
          <div v-if="openGroup === g.key" class="issue-body">
            <p v-if="!g.items.length" class="msg msg-ok">Không có vị nào — ổn.</p>
            <div v-else class="chip-wrap">
              <span v-for="it in g.items" :key="it.id" class="chip">{{ it.ten_vi_thuoc }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI gợi ý nhóm cho vị chưa phân nhóm -->
      <div v-if="issues && issues.khong_nhom.length" class="ai-nhom">
        <div class="panel-bar">
          <button class="btn btn-ghost" :disabled="nhomCheckLoading" @click="suggestNhomForUngrouped">
            {{ nhomCheckLoading ? 'AI đang gợi ý nhóm…' : `AI gợi ý nhóm cho vị chưa phân nhóm (${Math.min(60, issues.khong_nhom.length)})` }}
          </button>
          <span v-if="issues.khong_nhom.length > 60" class="bar-note">tối đa 60 vị / lượt</span>
        </div>
        <p v-if="nhomCheckError" class="msg msg-err">{{ nhomCheckError }}</p>

        <table v-if="nhomResults.length" class="nhom-table">
          <thead>
            <tr><th>Vị thuốc</th><th>Nhóm hiện tại</th><th>AI gợi ý</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="r in nhomResults" :key="r.id">
              <td class="cell-name">{{ r.ten_vi_thuoc }}</td>
              <td>
                <span v-if="r.current.length" class="nhom-cur">{{ r.current.map((c) => c.ten).join(', ') }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <span v-if="r.suggested">{{ r.suggested.ten }}</span>
                <span v-else class="muted">AI không chắc</span>
                <span v-if="r.ly_do" class="ly-do">{{ r.ly_do }}</span>
              </td>
              <td class="cell-act">
                <button
                  v-if="r.suggested && !r.match"
                  class="btn btn-sm btn-primary"
                  :disabled="applyingId === r.id"
                  @click="applySuggested(r)"
                >
                  {{ applyingId === r.id ? '…' : 'Gán nhóm này' }}
                </button>
                <span v-else-if="r.suggested && r.match" class="ok-tick">✓ đã có</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.audit { display: flex; flex-direction: column; gap: var(--space-4); }
.audit-head { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: flex-end; justify-content: space-between; }
.audit-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-800); margin: 0; }
.audit-sub { font-size: var(--font-size-sm); color: var(--text-subtle); margin: 4px 0 0; max-width: 64ch; }

.sub-switch { display: inline-flex; background: var(--brown-50); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 3px; gap: 2px; }
.sw-btn { padding: 7px 16px; border-radius: calc(var(--radius-md) - 3px); font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-600); transition: all var(--transition-fast); }
.sw-btn.active { background: var(--surface); color: var(--brown-800); box-shadow: var(--shadow-sm); }

.panel { display: flex; flex-direction: column; gap: var(--space-3); }
.panel-bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.bar-note { font-size: var(--font-size-sm); color: var(--text-subtle); }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; transition: all var(--transition-fast); border: 1px solid transparent; }
.btn:disabled { opacity: .55; cursor: not-allowed; }
.btn-sm { padding: 6px 12px; font-size: var(--font-size-xs); }
.btn-primary { background: var(--brown-600); color: #fff; }
.btn-primary:not(:disabled):hover { background: var(--brown-700); }
.btn-warn { background: #b45309; color: #fff; }
.btn-warn:not(:disabled):hover { background: #92400e; }
.btn-ghost { background: var(--surface); color: var(--brown-700); border-color: var(--border); }
.btn-ghost:not(:disabled):hover { background: var(--brown-50); }

.msg { font-size: var(--font-size-sm); margin: 0; padding: 8px 12px; border-radius: var(--radius-sm); }
.msg-err { background: #fef2f2; color: #b91c1c; }
.msg-ok { background: #ecfdf5; color: #047857; }

/* ── Cụm trùng ── */
.cluster-list { display: flex; flex-direction: column; gap: var(--space-3); }
.cluster { border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-3); background: var(--surface); }
.cluster.is-merged { opacity: .7; background: var(--brown-50); }
.cluster-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
.cluster-count { font-weight: 700; color: var(--brown-800); font-size: var(--font-size-sm); }
.tag { font-size: var(--font-size-xs); padding: 2px 8px; border-radius: 999px; background: var(--brown-100); color: var(--brown-700); }
.verdict { margin-left: auto; font-size: var(--font-size-xs); font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.verdict-yes { background: #ecfdf5; color: #047857; }
.verdict-no { background: #fffbeb; color: #b45309; }
.verdict-reason { font-size: var(--font-size-xs); color: var(--text-subtle); margin: 0 0 var(--space-2); font-style: italic; }

.members { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.member { display: flex; align-items: center; gap: var(--space-3); padding: 7px 10px; border-radius: var(--radius-sm); background: var(--brown-50); }
.keep-pick { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; flex-shrink: 0; }
.keep-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--brown-700); }
.member-main { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; flex: 1; min-width: 0; }
.member-name { font-weight: 600; color: var(--gray-800); }
.member-meta { font-size: var(--font-size-xs); color: var(--text-subtle); }
.member-sci { font-style: italic; }
.member-refs { display: flex; flex-wrap: wrap; gap: 4px; flex-shrink: 0; }
.ref { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); color: var(--gray-600); }
.ref-empty { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }

.cluster-foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin-top: var(--space-3); }
.confirm-q { font-size: var(--font-size-sm); font-weight: 600; color: #b45309; }

/* ── Rà soát ── */
.issue-groups { display: flex; flex-direction: column; gap: 6px; }
.issue-group { border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
.issue-head { display: flex; align-items: center; gap: var(--space-2); width: 100%; padding: 11px var(--space-3); background: var(--surface); transition: background var(--transition-fast); }
.issue-head:hover { background: var(--brown-50); }
.issue-head.open { background: var(--brown-50); }
.issue-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.dot-danger { background: #ef4444; }
.dot-warn { background: #f59e0b; }
.issue-label { font-weight: 600; font-size: var(--font-size-sm); color: var(--gray-800); }
.issue-count { margin-left: auto; font-weight: 700; font-size: var(--font-size-sm); color: var(--brown-700); background: var(--brown-100); padding: 1px 10px; border-radius: 999px; }
.issue-chev { color: var(--gray-500); font-size: 12px; width: 14px; text-align: center; }
.issue-body { padding: var(--space-3); border-top: 1px solid var(--border); }
.chip-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font-size: var(--font-size-xs); padding: 3px 10px; border-radius: 999px; background: var(--brown-50); border: 1px solid var(--border); color: var(--gray-700); }

.ai-nhom { margin-top: var(--space-2); display: flex; flex-direction: column; gap: var(--space-2); }
.nhom-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.nhom-table th { text-align: left; font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: .03em; color: var(--text-subtle); padding: 6px 10px; border-bottom: 1px solid var(--border); }
.nhom-table td { padding: 8px 10px; border-bottom: 1px solid var(--gray-100); vertical-align: top; }
.cell-name { font-weight: 600; color: var(--gray-800); }
.nhom-cur { color: var(--gray-700); }
.muted { color: var(--gray-400); }
.ly-do { display: block; font-size: var(--font-size-xs); color: var(--text-subtle); font-style: italic; margin-top: 2px; }
.cell-act { text-align: right; white-space: nowrap; }
.ok-tick { font-size: var(--font-size-xs); color: #047857; font-weight: 600; }
</style>
