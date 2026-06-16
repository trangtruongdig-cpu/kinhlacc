<script setup lang="ts">
/**
 * BaiThuocGraph — Đồ thị tri thức tương tác (cytoscape).
 * Lấy 1 node làm tâm (mặc định: bài thuốc), bấm node để mở rộng vùng lân cận (re-center / expand).
 * Dữ liệu từ backend: GET /graph/node?type=&id=  (1-hop neighborhood).
 */
import { ref, onMounted, onBeforeUnmount, shallowRef, nextTick } from 'vue'
import cytoscape from 'cytoscape'
import type { Core, ElementDefinition, NodeSingular } from 'cytoscape'
import { api } from '@/services/api'

const props = defineProps<{ rootId: number; rootType?: string }>()

interface GNode { id: string; type: string; dbId: number; label: string; role?: string | null }
interface GEdge { id: string; source: string; target: string; label?: string }
interface GResp { center: string; nodes: GNode[]; edges: GEdge[]; truncated: string[] }

// Màu + nhãn loại node (đồng bộ với NodeType ở backend).
const TYPE_META: Record<string, { color: string; label: string }> = {
  'bai-thuoc': { color: '#B45309', label: 'Bài thuốc' },
  'vi-thuoc': { color: '#16A34A', label: 'Vị thuốc' },
  'phap-tri': { color: '#0D9488', label: 'Pháp trị' },
  'benh-tay-y': { color: '#DC2626', label: 'Bệnh Tây Y' },
  'chung-benh': { color: '#9F1239', label: 'Chủng bệnh' },
  'trieu-chung': { color: '#D97706', label: 'Triệu chứng' },
  'cong-dung': { color: '#2563EB', label: 'Công năng' },
  'kinh-mach': { color: '#7C3AED', label: 'Quy kinh' },
  'nhom-duoc-ly': { color: '#0891B2', label: 'Nhóm dược lý' },
  'kieng-ky': { color: '#92400E', label: 'Kiêng kỵ' },
}
const typeColor = (t: string) => TYPE_META[t]?.color ?? '#6B7280'

const containerRef = ref<HTMLDivElement | null>(null)
const cy = shallowRef<Core | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const expanded = new Set<string>() // node id đã mở rộng (tránh gọi lại)
const selected = ref<GNode | null>(null)
const legendTypes = ref<Set<string>>(new Set())

function toElements(resp: GResp): ElementDefinition[] {
  const els: ElementDefinition[] = []
  for (const n of resp.nodes) {
    els.push({ data: { id: n.id, label: n.role ? `${n.label} · ${n.role}` : n.label, type: n.type, dbId: n.dbId, raw: n } })
    legendTypes.value.add(n.type)
  }
  for (const e of resp.edges) els.push({ data: { id: e.id, source: e.source, target: e.target, label: e.label ?? '' } })
  return els
}

async function fetchNode(type: string, id: number): Promise<GResp> {
  return api.get<GResp>(`/graph/node?type=${encodeURIComponent(type)}&id=${id}`)
}

function relayout() {
  const c = cy.value
  if (!c) return
  c.layout({ name: 'cose', animate: false, padding: 24, nodeRepulsion: () => 9000, idealEdgeLength: () => 90 } as cytoscape.LayoutOptions).run()
  c.fit(undefined, 30)
}

/** Mở rộng một node: nạp vùng lân cận, thêm phần tử mới, bố trí lại. */
async function expand(node: NodeSingular) {
  const c = cy.value
  if (!c) return
  const id = node.id()
  const raw = node.data('raw') as GNode | undefined
  selected.value = raw ?? null
  if (expanded.has(id) || !raw) return
  expanded.add(id)
  node.addClass('expanded')
  try {
    const resp = await fetchNode(raw.type, raw.dbId)
    const incoming = toElements(resp)
    const existing = new Set(c.elements().map((e) => e.id()))
    const fresh = incoming.filter((e) => !existing.has(e.data.id as string))
    if (fresh.length) {
      c.add(fresh)
      relayout()
    }
  } catch (e: unknown) {
    expanded.delete(id)
    node.removeClass('expanded')
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function buildCy(elements: ElementDefinition[]) {
  if (!containerRef.value) return
  const c = cytoscape({
    container: containerRef.value,
    elements,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': (ele: NodeSingular) => typeColor(ele.data('type')),
          label: 'data(label)',
          color: '#3a2a18',
          'font-size': 10,
          'text-wrap': 'wrap',
          'text-max-width': '90px',
          'text-valign': 'bottom',
          'text-margin-y': 3,
          width: 16,
          height: 16,
          'border-width': 0,
        },
      },
      { selector: 'node.root', style: { width: 26, height: 26, 'font-size': 12, 'font-weight': 700, 'border-width': 3, 'border-color': '#fff' } },
      { selector: 'node.expanded', style: { 'border-width': 2, 'border-color': '#fff' } },
      { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#111827' } },
      {
        selector: 'edge',
        style: {
          width: 1.2,
          'line-color': '#CBBFA6',
          'target-arrow-color': '#CBBFA6',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.7,
          'curve-style': 'bezier',
          label: 'data(label)',
          'font-size': 8,
          color: '#9aa0a6',
          'text-rotation': 'autorotate',
          'text-background-color': '#fff',
          'text-background-opacity': 0.8,
          'text-background-padding': '1px',
        },
      },
    ],
    layout: { name: 'cose', animate: false, padding: 24 },
    wheelSensitivity: 0.25,
    minZoom: 0.2,
    maxZoom: 2.5,
  })
  c.on('tap', 'node', (evt) => { void expand(evt.target as NodeSingular) })
  cy.value = c
}

async function init() {
  loading.value = true
  error.value = null
  try {
    const root = props.rootType ?? 'bai-thuoc'
    const resp = await fetchNode(root, props.rootId)
    await nextTick()
    buildCy(toElements(resp))
    const c = cy.value
    if (c) {
      c.getElementById(resp.center).addClass('root')
      selected.value = resp.nodes.find((n) => n.id === resp.center) ?? null
      expanded.add(resp.center)
      relayout()
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function resetView() {
  cy.value?.destroy()
  cy.value = null
  expanded.clear()
  legendTypes.value = new Set()
  selected.value = null
  init()
}

onMounted(init)
onBeforeUnmount(() => { cy.value?.destroy(); cy.value = null })
</script>

<template>
  <div class="btg">
    <div class="btg-toolbar">
      <span class="btg-hint">Bấm một node để mở rộng quan hệ.</span>
      <button type="button" class="btg-reset" @click="resetView">↻ Đặt lại</button>
    </div>

    <div class="btg-stage">
      <div v-if="loading" class="btg-overlay">Đang dựng đồ thị…</div>
      <div v-else-if="error" class="btg-overlay btg-error">{{ error }}</div>
      <div ref="containerRef" class="btg-canvas"></div>

      <div v-if="selected" class="btg-selected">
        <span class="btg-dot" :style="{ background: typeColor(selected.type) }"></span>
        <strong>{{ selected.label }}</strong>
        <span class="btg-selected-type">{{ TYPE_META[selected.type]?.label ?? selected.type }}</span>
      </div>
    </div>

    <div class="btg-legend">
      <span v-for="t in [...legendTypes]" :key="t" class="btg-legend-item">
        <span class="btg-dot" :style="{ background: typeColor(t) }"></span>{{ TYPE_META[t]?.label ?? t }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.btg { display: flex; flex-direction: column; gap: 8px; }
.btg-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.btg-hint { font-size: 12px; color: var(--gray-500); }
.btg-reset {
  font-size: 12px; padding: 4px 10px; border-radius: 6px;
  border: 1px solid var(--border, #e5e0d6); background: var(--surface, #fff); cursor: pointer; color: var(--brown-700, #6b4f2a);
}
.btg-reset:hover { background: var(--brown-50, #f7f3ec); }
.btg-stage { position: relative; }
.btg-canvas {
  width: 100%; height: 460px;
  border: 1px solid var(--border, #e5e0d6); border-radius: 10px;
  background: radial-gradient(circle at 50% 40%, #fbf9f4, #f3eee3);
}
.btg-overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--gray-500); pointer-events: none;
}
.btg-error { color: var(--danger, #b91c1c); }
.btg-selected {
  position: absolute; left: 10px; top: 10px; display: flex; align-items: center; gap: 6px;
  max-width: 70%; padding: 5px 10px; border-radius: 8px; font-size: 12px;
  background: rgba(255,255,255,0.92); border: 1px solid var(--border, #e5e0d6); box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.btg-selected-type { color: var(--gray-500); }
.btg-legend { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 11px; color: var(--gray-600); }
.btg-legend-item { display: inline-flex; align-items: center; gap: 5px; }
.btg-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex: none; }
</style>
