import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

/**
 * useDictLinks — LINK CHÉO THEO NGỮ CẢNH.
 *
 * Trong app (/app/*) → route in-app, giữ trong DashboardLayout, không văng ra ngoài.
 * Ngoài app → ĐƯỜNG CÔNG KHAI do CMS dựng (/duoc-lieu/, /bai-thuoc/, /nguon/).
 *
 * Những đường công khai đó KHÔNG còn là route của SPA (xem router/index.ts). Chúng đi
 * qua route chốt 'ra-thu-vien', vốn làm một lần tải trang thật để nginx đưa sang CMS.
 */
export function useDictLinks() {
  const route = useRoute()
  const inApp = computed(() => String(route.path || '').startsWith('/app'))

  return {
    inApp,
    /** Chi tiết 1 vị thuốc / dược liệu. */
    viThuoc(id: number): RouteLocationRaw {
      return inApp.value ? { name: 'app-duoc-lieu-detail', params: { id } } : `/duoc-lieu/${id}/`
    },
    /** Chi tiết 1 bài thuốc / cổ phương. */
    baiThuoc(slug: string): RouteLocationRaw {
      return inApp.value ? { name: 'app-bai-thuoc-detail', params: { slug } } : `/bai-thuoc/${slug}/`
    },
    /**
     * Quay về danh sách dược liệu.
     * Trong app không còn tab Từ Điển nữa nên về Quản Lý Thuốc — vẫn ở trong app,
     * không văng thầy thuốc ra ngoài giữa ca.
     */
    duocLieuList(): RouteLocationRaw {
      return inApp.value ? { name: 'medicines', query: { tab: 'vi-thuoc' } } : '/duoc-lieu/'
    },
    /** Mở Thư Mục Nguồn tới 1 nguồn cụ thể (thư viện CMS, cả hai ngữ cảnh). */
    nguon(slug: string): RouteLocationRaw {
      return `/nguon/${slug}/`
    },
  }
}
