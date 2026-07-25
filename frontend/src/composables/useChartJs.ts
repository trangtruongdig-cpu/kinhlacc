/**
 * useChartJs.ts — nạp động chart.js DÙNG CHUNG cho mọi nơi cần vẽ biểu đồ (MedicinesView.vue's radar
 * "Phân tích", PatientStatsPanel.vue's bar so sánh Nữ/Nam...). chart.js chỉ tải khi thực sự mở màn có
 * biểu đồ, không nằm trong chunk chính — module namespace + registry component dùng CHUNG 1 instance
 * (import lần 2 trở đi lấy từ cache Promise, không tải lại; register() bỏ qua component đã đăng ký).
 */

let modPromise: Promise<typeof import('chart.js')> | null = null
const registered = new Set<unknown>()

/** Nạp module chart.js đầy đủ (chỉ 1 lần dù gọi từ nhiều component) — dùng để lấy các named export
 * (RadarController, BarController, ...) cần truyền vào registerChartJs(). */
export function loadChartJs(): Promise<typeof import('chart.js')> {
  if (!modPromise) modPromise = import('chart.js')
  return modPromise
}

/** Đăng ký thêm component (an toàn gọi lại nhiều lần/nhiều bộ component khác nhau — component đã
 * đăng ký trước đó sẽ được bỏ qua). Trả về Chart constructor để dựng `new Chart(...)`. */
export function registerChartJs(
  mod: typeof import('chart.js'),
  components: unknown[],
): typeof import('chart.js').Chart {
  const fresh = components.filter((c) => !registered.has(c))
  if (fresh.length) {
    // chart.js tự định nghĩa register(...items: any[]) — khớp kiểu gốc của thư viện, không có kiểu
    // chặt hơn để ép sang.
    mod.Chart.register(...(fresh as Parameters<typeof mod.Chart.register>))
    fresh.forEach((c) => registered.add(c))
  }
  return mod.Chart
}
