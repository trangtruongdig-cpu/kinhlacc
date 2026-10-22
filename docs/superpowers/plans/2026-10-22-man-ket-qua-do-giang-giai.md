# Màn Kết Quả Đo — bản GIẢNG GIẢI: kế hoạch thực thi

> **Cho người thực thi:** dùng `superpowers:subagent-driven-development` hoặc
> `superpowers:executing-plans` để làm từng việc một. Các bước đánh dấu `- [ ]` để theo dõi.

**Mục tiêu:** Màn `/app/patients/:id/examinations/:examId` phục vụ được việc thầy thuốc giảng
giải cho bệnh nhân ngồi trước mặt, mà không bỏ mất thông tin chuyên môn nào.

**Cách làm:** Giữ nguyên engine, dữ liệu, route. Đổi thứ tự ba bước sẵn có; thêm một dải
"câu chốt" đầu mỗi bước; gom chi tiết chuyên môn vào mục đóng sẵn; phần mới viết theo token
CSS đã có, phần cũ không đụng.

**Nền tảng:** Vue 3 `<script setup>` + TypeScript, CSS thuần (token trong
`src/assets/styles/main.css`). Không thêm thư viện nào.

**Đặc tả:** `docs/superpowers/specs/2026-10-22-man-ket-qua-do-giang-giai-design.md`

## Ràng buộc toàn cục

- **KHÔNG đụng** engine tính toán, `lib/meridianAnalysis.ts`, backend, route, hay dữ liệu.
- **KHÔNG xoá** bất kỳ thông tin nào đang hiển thị — chỉ chuyển nó xuống tầng 3.
- **Phạm vi hành nghề Y sỹ** (memory `pham-vi-hanh-nghe-y-sy`): lời giảng chỉ MÔ TẢ trạng thái,
  không hàm ý "khám, chữa bệnh". Dùng "đo" chứ không "khám", "thầy thuốc" chứ không "bác sĩ".
- **Câu chốt lấy từ dữ liệu đã có** (`tongCuong`, `diagnosis`), tuyệt đối không bịa kết luận
  y học mới.
- CSS mới chỉ dùng token `--font-size-*`, `--space-*`, `--radius-*`. Không viết cứng px.
- Sàn cỡ chữ ở tầng 1–2: **không gì dưới 12px** (`--font-size-xs`).
- Mỗi việc xong phải chạy `npm run type-check --prefix frontend` và commit.

## Cấu trúc tệp

| Tệp | Trách nhiệm |
|---|---|
| `frontend/src/views/MeridianResultsView.vue` | Sửa: thứ tự tab, chèn dải câu chốt, bọc chi tiết vào tầng 3 |
| `frontend/src/lib/loiGiangCaDo.ts` | **Tạo mới**: biến `TongCuong` + chẩn đoán thành câu chốt và lời thường. Hàm thuần, kiểm được bằng `node --test` |
| `frontend/src/lib/loiGiangCaDo.test.ts` | **Tạo mới**: phép kiểm cho hàm trên |
| `frontend/src/components/DaiCauChot.vue` | **Tạo mới**: dải câu chốt đầu mỗi bước |
| `frontend/src/components/ChiTietChuyenMon.vue` | **Tạo mới**: vỏ bọc tầng 3, đóng sẵn |

⚠️ `MeridianResultsView.vue` đã **7.460 dòng**. Mọi logic mới đặt ở tệp riêng, chỉ chèn lời
gọi vào view. Đừng nhồi thêm vào file này.

---

### Việc 1: Đổi thứ tự ba bước về mạch giảng

Hiện là *đo → chữa → giải thích*. Mạch khi ngồi với bệnh nhân là *đo → giải thích → chữa*.

**Tệp:**
- Sửa: `frontend/src/views/MeridianResultsView.vue` quanh dòng 3836–3849 (thanh `nav.mr-tabs`)

**Giao diện với việc khác:** không đổi `activeView` (vẫn `ref<1|2|3>`), chỉ đổi **thứ tự nút**
trên thanh và nhãn số. View 2 và 3 giữ nguyên `v-show="activeView === 2|3"`.

- [ ] **Bước 1: Đọc thanh tab hiện tại**

```bash
sed -n '3836,3850p' frontend/src/views/MeridianResultsView.vue
```

- [ ] **Bước 2: Đổi thứ tự nút trên thanh**

Trong `nav.mr-tabs`, đưa nút `activeView = 3` lên giữa và đổi số hiển thị. Kết quả:

```html
<nav class="mr-tabs" aria-label="Chuyển view kết quả">
  <button type="button" class="mr-tab" :class="{ active: activeView === 1 }" @click="activeView = 1">
    <b>1</b> Kết Quả Đo &amp; Bát Cương
  </button>
  <!-- Mạch GIẢNG GIẢI: đo → vì sao → chữa. Trước 22/10/2026 nút này đứng thứ ba, tức màn
       nói "chữa thế nào" trước khi nói "vì sao" — ngược với thứ tự thầy thuốc giảng cho
       bệnh nhân. Chỉ đổi CHỖ ĐỨNG và số hiển thị; `activeView === 3` giữ nguyên nên không
       view nào phải sửa. -->
  <button type="button" class="mr-tab" :class="{ active: activeView === 3 }" @click="activeView = 3">
    <b>2</b> Biện Chứng – Pháp Trị
  </button>
  <button type="button" class="mr-tab" :class="{ active: activeView === 2 }" @click="activeView = 2">
    <b>3</b> Chẩn Đoán &amp; Điều Trị
    <span class="mr-tab-badge" v-if="!isPatientPortal">{{ excelSyndromesList.length }} thể · {{ matchedPhuongHuyetList.length }} huyệt · {{ matchedBaiThuocList.length }} bài</span>
    <span class="mr-tab-badge" v-else>{{ excelSyndromesList.length }} thể bệnh YHCT</span>
  </button>
</nav>
```

- [ ] **Bước 3: Kiểm kiểu**

```bash
npm run type-check --prefix frontend
```
Mong đợi: không lỗi.

- [ ] **Bước 4: Kiểm bằng mắt trên bản dựng**

```bash
cd frontend && npx vite build && npx vite preview --port 4180
```
Mở `http://localhost:4180/app/patients/5837/examinations/9709`, xác nhận thanh đọc là
`1 Kết Quả Đo & Bát Cương · 2 Biện Chứng – Pháp Trị · 3 Chẩn Đoán & Điều Trị`, và bấm mỗi nút
ra đúng nội dung cũ của nó.

- [ ] **Bước 5: Commit**

```bash
git add frontend/src/views/MeridianResultsView.vue
git commit -m "fix(ket-qua-do): ba bước theo mạch đo → vì sao → chữa"
```

---

### Việc 2: Hàm sinh câu chốt và lời thường

**Tệp:**
- Tạo: `frontend/src/lib/loiGiangCaDo.ts`
- Tạo: `frontend/src/lib/loiGiangCaDo.test.ts`

**Giao diện:**
- Dùng: `TongCuong` từ `@/lib/meridianAnalysis` (các khoá `amDuong`, `hoiChung`, `phapTri`,
  `reason`, `loai`).
- Cung cấp: `cauChotTongCuong(tc: TongCuong): { chinh: string; thuong: string }` và
  `loiThuong(thuatNgu: string): string`.

- [ ] **Bước 1: Viết phép kiểm trước**

```ts
// frontend/src/lib/loiGiangCaDo.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cauChotTongCuong, loiThuong } from './loiGiangCaDo.ts'

test('câu chốt lấy TỪ dữ liệu, không bịa thêm kết luận', () => {
  const r = cauChotTongCuong({
    amDuong: 'Dương hư', tinhChat: 'Hàn', viTri: 'Biểu', chinhKhi: 'Hư',
    hoiChung: 'Biểu Hư Hàn', reason: 'vì ...', loai: 'duong-hu', phapTri: 'Ôn dương',
  })
  assert.equal(r.chinh, 'Dương hư')
  assert.match(r.thuong, /nóng ấm|ấm/i)
})

test('thiếu dữ liệu thì KHÔNG đoán — trả rỗng', () => {
  const r = cauChotTongCuong({
    amDuong: '', tinhChat: '', viTri: '', chinhKhi: '',
    hoiChung: '', reason: '', loai: 'unknown', phapTri: '',
  })
  assert.equal(r.chinh, '')
  assert.equal(r.thuong, '')
})

test('thuật ngữ lạ trả về chính nó, không bịa lời giải', () => {
  assert.equal(loiThuong('Một thuật ngữ chưa có trong bảng'), '')
})
```

- [ ] **Bước 2: Chạy để thấy nó HỎNG**

```bash
cd frontend && node --test src/lib/loiGiangCaDo.test.ts
```
Mong đợi: FAIL, không tìm thấy module.

- [ ] **Bước 3: Viết hàm**

```ts
// frontend/src/lib/loiGiangCaDo.ts
import type { TongCuong } from './meridianAnalysis'

/**
 * Lời thường cho thuật ngữ Bát Cương — để BỆNH NHÂN ngồi trước mặt hiểu được.
 *
 * ⚠️ Chỉ MÔ TẢ trạng thái, không hàm ý chữa trị (phạm vi hành nghề Y sỹ). Và chỉ dịch thuật
 * ngữ đã có trong bảng: từ lạ trả RỖNG chứ không đoán — một lời giải sai nghe còn đáng tin
 * hơn là không có lời giải nào.
 */
const BANG_LOI_THUONG: Record<string, string> = {
  'Dương hư': 'phần nóng ấm của cơ thể đang thiếu',
  'Dương thịnh': 'phần nóng ấm đang dư',
  'Âm hư': 'phần mát ẩm của cơ thể đang thiếu',
  'Âm thịnh': 'phần mát ẩm đang dư',
  'Thiên Dương': 'nghiêng về phía nóng',
  'Thiên Âm': 'nghiêng về phía mát',
  'Âm Dương cân bằng': 'hai phần nóng và mát đang cân nhau',
}

export function loiThuong(thuatNgu: string): string {
  return BANG_LOI_THUONG[thuatNgu.trim()] ?? ''
}

export function cauChotTongCuong(tc: TongCuong): { chinh: string; thuong: string } {
  const chinh = (tc.amDuong || '').trim()
  if (!chinh || tc.loai === 'unknown') return { chinh: '', thuong: '' }
  return { chinh, thuong: loiThuong(chinh) }
}
```

- [ ] **Bước 4: Chạy lại, phải ĐẠT**

```bash
cd frontend && node --test src/lib/loiGiangCaDo.test.ts
```
Mong đợi: 3 phép kiểm đạt.

- [ ] **Bước 5: Commit**

```bash
git add frontend/src/lib/loiGiangCaDo.ts frontend/src/lib/loiGiangCaDo.test.ts
git commit -m "feat(ket-qua-do): hàm sinh câu chốt và lời thường cho bệnh nhân"
```

---

### Việc 3: Dải câu chốt đầu mỗi bước

**Tệp:**
- Tạo: `frontend/src/components/DaiCauChot.vue`
- Sửa: `frontend/src/views/MeridianResultsView.vue` — chèn ngay sau `nav.mr-tabs`

**Giao diện:**
- Dùng: `cauChotTongCuong` từ Việc 2.
- Nhận props: `chinh: string`, `thuong: string`, `phu?: string`.
- Không hiện gì khi `chinh` rỗng.

- [ ] **Bước 1: Tạo component**

```vue
<script setup lang="ts">
/**
 * Dải CÂU CHỐT — dòng chữ lớn nhất màn, là thứ bệnh nhân ngồi cách 1m đọc được.
 *
 * Thuật ngữ (`chinh`) ở trên, lời thường (`thuong`) ngay dưới và nhỏ hơn: thầy thuốc đọc
 * dòng trên, bệnh nhân đọc dòng dưới. Thiếu dữ liệu thì KHÔNG hiện gì — một dải rỗng còn
 * tệ hơn không có dải.
 */
defineProps<{ chinh: string; thuong?: string; phu?: string }>()
</script>

<template>
  <div v-if="chinh" class="cc-dai">
    <p class="cc-chinh">{{ chinh }}</p>
    <p v-if="thuong" class="cc-thuong">{{ thuong }}</p>
    <p v-if="phu" class="cc-phu">{{ phu }}</p>
  </div>
</template>

<style scoped>
/* Chỉ dùng token. Phẳng: MỘT đường viền, không bóng đổ. */
.cc-dai {
  padding: var(--space-5) var(--space-4);
  margin-bottom: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}
.cc-chinh {
  margin: 0;
  font-size: var(--font-size-3xl);
  font-weight: 700;
  line-height: 1.25;
  color: var(--text);
}
.cc-thuong {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--text-muted);
}
.cc-phu {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-sm);
  color: var(--text-subtle);
}
</style>
```

- [ ] **Bước 2: Chèn vào view 1**

Trong `MeridianResultsView.vue`, thêm import:

```ts
import DaiCauChot from '@/components/DaiCauChot.vue'
import { cauChotTongCuong } from '@/lib/loiGiangCaDo'
```

Thêm computed cạnh các computed khác:

```ts
const cauChot1 = computed(() => cauChotTongCuong(tongCuong.value))
```

Chèn ngay đầu `<section class="mr-view" v-show="activeView === 1">`:

```html
<DaiCauChot :chinh="cauChot1.chinh" :thuong="cauChot1.thuong" :phu="tongCuong.hoiChung" />
```

- [ ] **Bước 3: Kiểm kiểu**

```bash
npm run type-check --prefix frontend
```

- [ ] **Bước 4: Dựng và xem**

```bash
cd frontend && npx vite build && npx vite preview --port 4180
```
Mở ca `/app/patients/5837/examinations/9709`: đầu bước 1 phải có dòng lớn "Dương hư" kèm
"phần nóng ấm của cơ thể đang thiếu" và dòng phụ "Biểu Hư Hàn".

- [ ] **Bước 5: Commit**

```bash
git add frontend/src/components/DaiCauChot.vue frontend/src/views/MeridianResultsView.vue
git commit -m "feat(ket-qua-do): dải câu chốt đầu bước 1"
```

---

### Việc 4: Vỏ "Chi tiết chuyên môn" và gom tầng 3 của bước 1

**Tệp:**
- Tạo: `frontend/src/components/ChiTietChuyenMon.vue`
- Sửa: `frontend/src/views/MeridianResultsView.vue` — bọc mục I (`I KẾT QUẢ ĐO KINH LẠC`)

**Giao diện:** nhận slot mặc định và prop `nhan?: string` (mặc định `'Chi tiết chuyên môn'`).
Dùng `<details>` của trình duyệt — không cần state, không cần JS, và bot đọc được nội dung
bên trong.

- [ ] **Bước 1: Tạo component**

```vue
<script setup lang="ts">
/**
 * Vỏ TẦNG 3 — chi tiết chuyên môn, đóng sẵn.
 *
 * Dùng <details> chứ không dựng toggle bằng JS: nội dung vẫn nằm trong DOM nên trợ lý AI,
 * bot tìm kiếm và Ctrl+F đều thấy; và không có state nào để sai.
 *
 * ⚠️ Đây là chỗ "lùi xuống", KHÔNG phải chỗ bỏ đi. Mọi thứ trước đây hiện mặc định phải còn
 * đủ ở trong này — xem phần Nghiệm thu của spec.
 */
withDefaults(defineProps<{ nhan?: string }>(), { nhan: 'Chi tiết chuyên môn' })
</script>

<template>
  <details class="ctcm">
    <summary class="ctcm-nhan">{{ nhan }}</summary>
    <div class="ctcm-than"><slot /></div>
  </details>
</template>

<style scoped>
.ctcm {
  margin-top: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}
.ctcm-nhan {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  list-style: none;
}
.ctcm-nhan::before { content: '▸ '; }
.ctcm[open] .ctcm-nhan::before { content: '▾ '; }
.ctcm-than { padding: 0 var(--space-4) var(--space-4); }
</style>
```

- [ ] **Bước 2: Bọc mục I vào vỏ**

Tìm `<h2>` chứa `I KẾT QUẢ ĐO KINH LẠC` và bọc cả `<section>` của nó:

```bash
grep -n "I KẾT QUẢ ĐO KINH LẠC" frontend/src/views/MeridianResultsView.vue
```

Bọc bằng `<ChiTietChuyenMon nhan="Chi tiết số đo (24 kinh)">…</ChiTietChuyenMon>`, thêm import:

```ts
import ChiTietChuyenMon from '@/components/ChiTietChuyenMon.vue'
```

⚠️ Chỉ bọc, **không xoá dòng nào** bên trong.

- [ ] **Bước 3: Kiểm kiểu**

```bash
npm run type-check --prefix frontend
```

- [ ] **Bước 4: Kiểm KHÔNG MẤT THÔNG TIN**

Dựng rồi so danh sách tiêu đề trước/sau khi mở vỏ — mọi mục cũ phải còn:

```bash
cd frontend && npx vite build && npx vite preview --port 4180
```
Mở ca, bấm mở "Chi tiết số đo (24 kinh)", xác nhận bảng 24 kinh còn nguyên.

- [ ] **Bước 5: Commit**

```bash
git add frontend/src/components/ChiTietChuyenMon.vue frontend/src/views/MeridianResultsView.vue
git commit -m "feat(ket-qua-do): vỏ Chi tiết chuyên môn, gom số đo 24 kinh vào tầng 3"
```

---

### Việc 5: Đo lại và chốt bằng số

**Tệp:**
- Tạo: `frontend/scripts/do-mat-do-man.mjs` (chỉ đọc, chạy tay)

- [ ] **Bước 1: Viết script đo**

```js
// frontend/scripts/do-mat-do-man.mjs
// CHỈ ĐỌC. Đếm mật độ thị giác của một màn — dùng để chốt "nặng nề" bằng số, không bằng cảm giác.
// Dùng: node scripts/do-mat-do-man.mjs <url>
// ⚠️ Có CHỐT TỰ KIỂM: đo hai lượt liên tiếp không thao tác gì, hai lượt phải ra cùng số.
//    Màn này vẽ đồ hình theo nhu cầu nên so ảnh chụp là phép đo dối (memory
//    `phep-do-ui-phai-co-chot-tu-kiem`).
import { chromium } from 'playwright'

const URL = process.argv[2]
if (!URL) { console.error('Thiếu url'); process.exit(1) }

const dem = () => {
  const man = innerHeight, vw = innerWidth
  const all = [...document.querySelectorAll('.content-area *, main *')].filter((e) => {
    const r = e.getBoundingClientRect()
    return r.top < man && r.bottom > 0 && r.width > 2 && r.height > 2
  })
  const cu = new Set(), mau = new Set(), bong = new Set()
  let nut = 0, nhoNhat = 99
  for (const e of all) {
    const s = getComputedStyle(e)
    cu.add(s.fontSize); mau.add(s.color)
    if (s.boxShadow !== 'none') bong.add(s.boxShadow)
    const px = parseFloat(s.fontSize)
    if (e.textContent?.trim() && px && px < nhoNhat) nhoNhat = px
    if (/^(BUTTON|A)$/.test(e.tagName) || e.getAttribute('role') === 'button') nut++
  }
  return { pt: all.length, nut, cu: cu.size, mau: mau.size, bong: bong.size, nhoNhat }
}

const br = await chromium.launch()
const pg = await br.newPage({ viewport: { width: 1440, height: 692 } })
await pg.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await pg.waitForTimeout(15000)
const a = await pg.evaluate(dem)
await pg.waitForTimeout(1500)
const b = await pg.evaluate(dem)
const on = JSON.stringify(a) === JSON.stringify(b)
console.log(`  chốt dụng cụ: hai lượt không thao tác ${on ? '✓ GIỐNG' : '✗ KHÁC — số dưới không tin được'}`)
console.log(`  phần tử ${a.pt} · nút ${a.nut} · cỡ chữ ${a.cu} · màu chữ ${a.mau} · bóng ${a.bong} · nhỏ nhất ${a.nhoNhat}px`)
await br.close()
```

- [ ] **Bước 2: Chạy trên bản dựng**

```bash
cd frontend && npx vite build && npx vite preview --port 4180 &
sleep 6
node scripts/do-mat-do-man.mjs "http://localhost:4180/app/patients/5837/examinations/9709"
```

- [ ] **Bước 3: So với đích của spec**

| | Trước | Đích | Đạt? |
|---|---|---|---|
| Phần tử tầng 1+2 | 219 | ≤ 35 | |
| Nút | 41 | ≤ 8 | |
| Cỡ chữ | 13 | ≤ 5 | |
| Cỡ nhỏ nhất | 9px | ≥ 12px | |
| Bóng đổ | 4 | 0 | |

Chưa đạt mục nào thì quay lại Việc 4 gom thêm vào tầng 3 — **không nới ngưỡng**.

- [ ] **Bước 4: Commit**

```bash
git add frontend/scripts/do-mat-do-man.mjs
git commit -m "test(ket-qua-do): script đo mật độ thị giác, có chốt tự kiểm"
```

---

## Việc còn lại sau kế hoạch này

Spec phủ cả câu chốt cho bước 2 và 3, thanh bên tự thu, và nhân nguyên tắc ra 22 màn khác.
Kế hoạch này cố ý dừng ở **bước 1** để chốt nguyên tắc trên một bước trước — đo được kết quả
rồi mới nhân rộng. Làm xong Việc 5, đọc lại số đo rồi quyết có đi tiếp không.
