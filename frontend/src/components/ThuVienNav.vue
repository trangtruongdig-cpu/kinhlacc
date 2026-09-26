<script setup lang="ts">
/**
 * ThuVienNav — Thanh tab THƯ VIỆN dùng cho các trang công khai NẰM NGOÀI /thu-vien
 * (Đồ Hình 3D, Dược Liệu, Bài Thuốc).
 *
 * VÌ SAO CÓ: thanh tab thật nằm bên TRONG TuDienView.vue, nên khách rời /thu-vien sang
 * /xem-3d hay /duoc-lieu là mất sạch điều hướng — chỉ còn "Cẩm Nang" và "Trang Chủ", tức
 * ngõ cụt. Thanh này chép NGUYÊN kiểu dáng của .td-tabs để khách nhận ra ngay là cùng một
 * thanh, nhưng mỗi nút là một LINK điều hướng chứ không phải subtab nội tuyến.
 *
 * ⚠️ Danh sách tab ở đây phải khớp với thanh tab trong TuDienView.vue (dòng ~1166). Thêm
 * mục từ điển mới thì sửa CẢ HAI chỗ; "Thư Mục Nguồn" luôn để CUỐI, y như bên đó.
 *
 * Bốn mục Huyệt Vị / Lý Thuyết Kinh / Châm Cứu Trị Bệnh / Bệnh Học / Xem Lưỡi / Thư Mục
 * Nguồn là subtab nội tuyến của /thu-vien nên đi bằng ?tab=<khoá> — TuDienView đọc khoá
 * này để mở đúng mục. Dược Liệu và Bài Thuốc có TRANG RIÊNG (route /duoc-lieu, /bai-thuoc)
 * nên trỏ thẳng sang đó: chính hai trang ấy cũng mang thanh này, phải trỏ về mình thì
 * trạng thái "đang ở tab nào" mới đúng.
 */
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

// Khoá trang đang đứng → tô sáng đúng tab. Không truyền thì không tab nào sáng.
defineProps<{ active?: 'huyet' | 'kinh' | 'ccdt' | 'benhhoc' | 'duoclieu' | 'baithuoc' | '3d' | 'luoi' | 'nguon' }>()

interface MucTab {
  key: string
  nhan: string
  dich: RouteLocationRaw
  /** true = rời khỏi thư viện sang trang khác → viền nét đứt, giống .td-tab--link bên TuDienView. */
  ngoai?: boolean
}

const TABS: MucTab[] = [
  { key: 'huyet', nhan: 'Huyệt Vị · Châm Cứu', dich: { name: 'thu-vien', query: { tab: 'huyet' } } },
  { key: 'kinh', nhan: 'Lý Thuyết · Tra Cứu Kinh', dich: { name: 'thu-vien', query: { tab: 'kinh' } } },
  { key: 'ccdt', nhan: 'Châm Cứu Trị Bệnh', dich: { name: 'thu-vien', query: { tab: 'ccdt' } } },
  { key: 'benhhoc', nhan: 'Bệnh Học', dich: { name: 'thu-vien', query: { tab: 'benhhoc' } } },
  { key: 'duoclieu', nhan: 'Dược Liệu', dich: { name: 'duoc-lieu' } },
  { key: 'baithuoc', nhan: 'Bài Thuốc', dich: { name: 'bai-thuoc' } },
  { key: '3d', nhan: '🧭 Đồ Hình 3D', dich: { name: 'xem-3d' }, ngoai: true },
  { key: 'luoi', nhan: 'Xem Lưỡi', dich: { name: 'thu-vien', query: { tab: 'luoi' } } },
  // ↓↓↓ luôn giữ Thư Mục Nguồn ở CUỐI cùng ↓↓↓
  { key: 'nguon', nhan: 'Thư Mục Nguồn', dich: { name: 'thu-vien', query: { tab: 'nguon' } } },
]

// Mỗi tab là RouterLink (<a href> thật) chứ không phải <button> + router.push. Lý do ĐO ĐƯỢC:
// rời trang 3D mất 12–20 giây vì engine còn giữ luồng chính (nút "← Trang Chủ" có sẵn cũng vậy).
// Là link thật thì khách bấm giữa/chuột phải mở được tab mới, khỏi ngồi đợi; kèm theo đó trình
// duyệt hiện đích ở thanh trạng thái và máy dò tìm kiếm lần được sang các mục từ điển.

// ───────────── một hàng cuộn ngang (chép logic của .td-tabs trong TuDienView) ─────────────
// 9 tab nhãn tiếng Việt dài ⇒ dưới ~1240px là tràn. Không xuống dòng: thừa thì cuộn ngang
// (vuốt trên cảm ứng/trackpad, nút mũi tên cho chuột), mép mờ báo còn tab khuất.
const tabStripEl = ref<HTMLElement | null>(null)
const tabCon = ref({ trai: false, phai: false })

function doTabCuon() {
  const el = tabStripEl.value
  if (!el) return
  const du = el.scrollWidth - el.clientWidth
  // ngưỡng 2px: trình duyệt hay lệch phân số pixel khi phóng to ⇒ đừng so bằng 0.
  tabCon.value = { trai: du > 2 && el.scrollLeft > 2, phai: du > 2 && el.scrollLeft < du - 2 }
}
function cuonTab(huong: -1 | 1) {
  const el = tabStripEl.value
  if (!el) return
  el.scrollBy({ left: huong * Math.max(180, el.clientWidth * 0.7), behavior: 'smooth' })
}

let tabRO: ResizeObserver | null = null
onMounted(() => {
  doTabCuon()
  if (typeof ResizeObserver !== 'undefined' && tabStripEl.value) {
    tabRO = new ResizeObserver(doTabCuon)
    tabRO.observe(tabStripEl.value)
  }
  // Kéo tab của trang đang đứng vào tầm nhìn — vào thẳng /bai-thuoc mà tab nằm khuất bên
  // phải thì khách tưởng thanh này không liên quan tới trang mình đang xem.
  nextTick(() => {
    tabStripEl.value
      ?.querySelector<HTMLElement>('.tvnav-tab.active')
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
    doTabCuon()
  })
})
onBeforeUnmount(() => {
  tabRO?.disconnect()
  tabRO = null
})
</script>

<template>
  <nav class="tvnav" :class="{ 'con-trai': tabCon.trai, 'con-phai': tabCon.phai }" aria-label="Thư viện tra cứu">
    <div class="tvnav-inner">
      <button v-show="tabCon.trai" type="button" class="tvnav-arrow tvnav-arrow--trai"
              aria-label="Cuộn thanh tab sang trái" @click="cuonTab(-1)">‹</button>
      <div ref="tabStripEl" class="tvnav-strip" @scroll.passive="doTabCuon">
        <RouterLink v-for="m in TABS" :key="m.key" :to="m.dich" class="tvnav-tab"
                    :class="{ active: m.key === active, 'tvnav-tab--link': m.ngoai }"
                    :aria-current="m.key === active ? 'page' : undefined">
          {{ m.nhan }}
        </RouterLink>
      </div>
      <button v-show="tabCon.phai" type="button" class="tvnav-arrow tvnav-arrow--phai"
              aria-label="Cuộn thanh tab sang phải" @click="cuonTab(1)">›</button>
    </div>
  </nav>
</template>

<style scoped>
/* DÍNH ngay dưới PublicTopBar (cao 60px) — đổi mục mà không phải cuộn lên đầu. */
.tvnav {
  position: sticky;
  top: 60px;
  z-index: 40;
  background: var(--bg-app);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 8px 8px -8px rgba(74, 47, 23, 0.18);
}
.tvnav-inner {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  padding: 8px var(--space-5);
}
/* Máng cuộn: MỘT hàng duy nhất. `nowrap` là điểm mấu chốt — `wrap` sẽ làm 9 tab gãy 2 dòng
   trên gần như mọi màn hình, thanh dính cao gấp đôi và ăn mất phần đầu nội dung. */
.tvnav-strip {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain; /* vuốt hết tab thì đừng kéo cả trang/lịch sử trình duyệt */
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* chừa chỗ cho viền focus rồi hút lại bằng margin âm → chiều cao thanh không đổi */
  padding: 3px 0;
  margin: -3px 0;
}
.tvnav-strip::-webkit-scrollbar { display: none; }
/* Mép mờ CHỈ bật phía còn tab khuất — đủ chỗ thì không làm nhạt tab cuối vô cớ. */
.tvnav.con-phai .tvnav-strip {
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 46px), transparent 100%);
  mask-image: linear-gradient(to right, #000 calc(100% - 46px), transparent 100%);
}
.tvnav.con-trai .tvnav-strip {
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 46px);
  mask-image: linear-gradient(to right, transparent 0, #000 46px);
}
.tvnav.con-trai.con-phai .tvnav-strip {
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 46px, #000 calc(100% - 46px), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, #000 46px, #000 calc(100% - 46px), transparent 100%);
}
.tvnav-tab {
  flex: 0 0 auto;            /* không co nhãn → chữ không bao giờ gãy giữa nút */
  white-space: nowrap;
  scroll-snap-align: start;
  padding: var(--space-2) 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.9rem;         /* 14.4px — giữa sm(14) và md(16), đo để 9 tab vừa một hàng */
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;   /* là thẻ <a> nên phải tự bỏ gạch chân */
}
.tvnav-tab:hover { border-color: var(--brown-300); color: var(--brown-700); background: var(--brown-50); }
.tvnav-tab.active { background: var(--brown-600); border-color: var(--brown-600); color: #fff; }
/* Đồ Hình 3D rời khỏi thư viện sang trang khác — viền nét đứt, y như bên TuDienView. */
.tvnav-tab--link { border-style: dashed; }

/* Nút mũi tên cho người dùng CHUỘT (cảm ứng/trackpad đã vuốt ngang được nên ẩn đi). */
.tvnav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--brown-700);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(74, 47, 23, 0.16);
}
.tvnav-arrow:hover { background: var(--brown-50); border-color: var(--brown-300); }
.tvnav-arrow--trai { left: var(--space-3); }
.tvnav-arrow--phai { right: var(--space-3); }
@media (hover: hover) and (pointer: fine) {
  .tvnav-arrow { display: flex; }
}

@media (max-width: 768px) {
  .tvnav-inner { padding: 8px var(--space-3); }
}
</style>
