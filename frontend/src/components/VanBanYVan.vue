<script setup lang="ts">
/**
 * VanBanYVan — hiển thị một khối văn bản y văn cổ truyền CÓ BỐ CỤC.
 *
 * Dữ liệu trong DB (phuong_thang.ghi_chu, vi_thuoc.duoc_ly/tham_khao/chu_tri…)
 * là một chuỗi dài, cấu trúc nằm ngầm trong cách ngắt dòng:
 *
 *   GIẢI THÍCH:                          <- nhãn mục, IN HOA + dấu hai chấm
 *   Hoàng kỳ, Nhân sâm để cam ôn…        <- đoạn văn
 *   THAM KHẢO:
 *   Bài này thêm Hoàng Cầm … gọi là Ích Vị Thăng Dương Thang (Biến pháp…)
 *   “Lãn tôi xét: Bài Bổ Trung Ích Khí…” (Hải Thượng Y Tôn Tâm Lĩnh)
 *
 * Đổ cả chuỗi vào một thẻ <p> thì thành một tảng chữ liền, đọc rất mệt.
 * Component này tách ra: tiểu đề cho từng mục, trích dẫn thành khối riêng
 * có nguồn tách xuống dòng, các dòng "Bài này…/Còn gọi là…" thành danh sách.
 *
 * Chỉ dùng nội suy văn bản, KHÔNG v-html — dữ liệu là y văn sưu tầm.
 */
import { computed } from 'vue'

const props = defineProps<{ text?: string | null }>()

/** Nhãn mục gặp trong dữ liệu -> dạng đọc được (763 GIẢI THÍCH, 696 GHI CHÚ,
 *  308 THAM KHẢO, 79 KIÊNG KỴ/KIÊNG KỊ tính trên 13.942 bài thuốc). */
const NHAN: Record<string, string> = {
  'GIẢI THÍCH': 'Giải thích',
  'THAM KHẢO': 'Tham khảo',
  'GHI CHÚ': 'Ghi chú',
  'KIÊNG KỴ': 'Kiêng kỵ',
  'KIÊNG KỊ': 'Kiêng kỵ',
  'TÁC DỤNG': 'Tác dụng',
  'CHỦ TRỊ': 'Chủ trị',
  TRỊ: 'Trị',
}

interface KhoiNhan { loai: 'nhan'; chu: string }
interface KhoiTrich { loai: 'trich'; chu: string; nguon: string | null }
interface KhoiDanhSach { loai: 'danh-sach'; muc: { dau: string; ten: string | null; nguon: string | null }[] }
interface KhoiDoan { loai: 'doan'; chu: string }
type Khoi = KhoiNhan | KhoiTrich | KhoiDanhSach | KhoiDoan

/** Dòng chỉ gồm chữ IN HOA và kết thúc bằng ':' là nhãn mục. */
function laNhan(dong: string): boolean {
  return (
    dong.length <= 32 &&
    dong.endsWith(':') &&
    dong === dong.toUpperCase() &&
    /[A-ZÀ-Ỹ]/.test(dong)
  )
}

/** Tách nguồn trích dẫn trong ngoặc đơn ở cuối dòng: "… (Kim Quỹ Yếu Lược)." */
function tachNguon(dong: string): { chu: string; nguon: string | null } {
  const m = dong.match(/^(.*?)\s*\(([^()]{2,140})\)\s*\.?\s*$/)
  if (!m || !m[1] || !m[2]) return { chu: dong, nguon: null }
  return { chu: m[1].replace(/\s*[.,;]\s*$/, ''), nguon: m[2] }
}

/** Dòng biến pháp: "Bài này thêm X gọi là Y (Nguồn)." — làm nổi tên bài Y. */
function tachMuc(dong: string) {
  const { chu, nguon } = tachNguon(dong)
  const m = chu.match(/^(.*\bgọi là\s+)(.+)$/)
  if (m && m[1] && m[2]) return { dau: m[1], ten: m[2].replace(/\s*\.\s*$/, ''), nguon }
  return { dau: chu, ten: null, nguon }
}

const laDongDanhSach = (d: string) => /^(Bài này|Còn gọi là|Còn có tên|Cũng gọi là|Nay gọi là)/.test(d)
const laTrichDan = (d: string) => /^[“"‘]/.test(d)

const khoi = computed<Khoi[]>(() => {
  const dong = String(props.text || '')
    .split(/\r?\n/)
    .map((d) => d.trim())
    .filter(Boolean)

  const ra: Khoi[] = []
  for (const d of dong) {
    if (laNhan(d)) {
      const goc = d.slice(0, -1).trim()
      ra.push({ loai: 'nhan', chu: NHAN[goc] || goc })
      continue
    }
    if (laTrichDan(d)) {
      const { chu, nguon } = tachNguon(d)
      ra.push({ loai: 'trich', chu, nguon })
      continue
    }
    if (laDongDanhSach(d)) {
      const cuoi = ra[ra.length - 1]
      if (cuoi && cuoi.loai === 'danh-sach') cuoi.muc.push(tachMuc(d))
      else ra.push({ loai: 'danh-sach', muc: [tachMuc(d)] })
      continue
    }
    ra.push({ loai: 'doan', chu: d })
  }
  return ra
})
</script>

<template>
  <div v-if="khoi.length" class="yv">
    <template v-for="(k, i) in khoi" :key="i">
      <h3 v-if="k.loai === 'nhan'" class="yv-nhan">{{ k.chu }}</h3>

      <blockquote v-else-if="k.loai === 'trich'" class="yv-trich">
        <p class="yv-trich-chu">{{ k.chu }}</p>
        <cite v-if="k.nguon" class="yv-nguon">{{ k.nguon }}</cite>
      </blockquote>

      <ul v-else-if="k.loai === 'danh-sach'" class="yv-ds">
        <li v-for="(m, j) in k.muc" :key="j" class="yv-ds-muc">
          <span>{{ m.dau }}</span><strong v-if="m.ten" class="yv-ten">{{ m.ten }}</strong>
          <span v-if="m.nguon" class="yv-nguon-nho">({{ m.nguon }})</span>
        </li>
      </ul>

      <p v-else class="yv-doan">{{ k.chu }}</p>
    </template>
  </div>
</template>

<style scoped>
.yv { font-size: 14.5px; line-height: 1.75; color: var(--text); }

/* Tiểu đề mục: tạo chỗ ngắt nghỉ giữa các khối chữ dài */
.yv-nhan {
  margin: 18px 0 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border, #e5e0d6);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brown-600, #8a5a1a);
}
.yv-nhan:first-child { margin-top: 0; padding-top: 0; border-top: 0; }

.yv-doan { margin: 0 0 10px; }
.yv-doan:last-child { margin-bottom: 0; }

/* Trích dẫn y văn: lùi vào, viền trái, nguồn tách xuống dòng */
.yv-trich {
  margin: 0 0 12px;
  padding: 10px 14px;
  background: var(--surface-2, #faf8f3);
  border-left: 3px solid var(--brown-300, #d8c3a0);
  border-radius: 0 8px 8px 0;
}
.yv-trich-chu { margin: 0; font-style: italic; color: var(--brown-900, #4a2f14); }
.yv-nguon {
  display: block;
  margin-top: 6px;
  font-size: 12.5px;
  font-style: normal;
  text-align: right;
  color: var(--text-muted);
}
.yv-nguon::before { content: '— '; }

/* Danh sách biến pháp / tên gọi khác */
.yv-ds { margin: 0 0 12px; padding-left: 18px; }
.yv-ds-muc { margin-bottom: 5px; }
.yv-ten { color: var(--brown-800, #5b3a1a); }
.yv-nguon-nho { margin-left: 4px; font-size: 13px; color: var(--text-muted); }

@media (max-width: 480px) {
  .yv-trich { padding: 8px 10px; }
  .yv-nguon { text-align: left; }
}
</style>
