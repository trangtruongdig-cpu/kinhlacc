import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

/**
 * useDictLinks — LINK CHÉO THEO NGỮ CẢNH.
 * Đang ở trong app (/app/*) → trỏ vào route in-app (giữ trong DashboardLayout, KHÔNG văng ra trang public).
 * Đang ở trang công khai → trỏ tới trang public tương ứng.
 * Dùng cho: tra cứu vị thuốc ↔ bài thuốc ↔ Thư Mục Nguồn ở cả 2 ngữ cảnh.
 */
export function useDictLinks() {
  const route = useRoute()
  const inApp = computed(() => String(route.path || '').startsWith('/app'))

  return {
    inApp,
    /** Chi tiết 1 vị thuốc / dược liệu. */
    viThuoc(id: number): RouteLocationRaw {
      return inApp.value
        ? { name: 'app-duoc-lieu-detail', params: { id } }
        : { name: 'duoc-lieu-detail', params: { id } }
    },
    /** Chi tiết 1 bài thuốc / cổ phương. */
    baiThuoc(slug: string): RouteLocationRaw {
      return inApp.value
        ? { name: 'app-bai-thuoc-detail', params: { slug } }
        : { name: 'bai-thuoc-detail', params: { slug } }
    },
    /** Quay về "danh sách" dược liệu (in-app: về Từ Điển; public: danh sách dược liệu). */
    duocLieuList(): RouteLocationRaw {
      return inApp.value ? { name: 'tu-dien' } : { name: 'duoc-lieu' }
    },
    /** Mở Thư Mục Nguồn tới 1 nguồn cụ thể (qua query ?nguon=slug để Từ Điển tự mở tab + chọn). */
    nguon(slug: string): RouteLocationRaw {
      return inApp.value
        ? { name: 'tu-dien', query: { nguon: slug } }
        : { name: 'thu-vien', query: { nguon: slug } }
    },
  }
}
