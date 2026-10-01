// dict-ma-who.test.mjs — Chốt chặn MÃ WHO của trang huyệt tĩnh.
//
// Vì sao có tệp này: hàng "Mã WHO" và hai nút "🧭 Xem Vị Trí Trên Đồ Hình 3D" /
// "📖 Xem Trên Đường Kinh" đều dựng từ `classify(rec).code`. Mã rỗng thì CẢ HAI nút BIẾN MẤT
// mà build vẫn xanh, sitemap vẫn đủ, curl vẫn 200 — không phép đo nào kêu. Đã xảy ra thật:
// bản `IDX.points[].code` (acu-index.js sinh 08/09/2026, script sinh nó không còn trong repo)
// thiếu 30 mã và SAI 1 mã, nên 30 trang mất nút và trang Khí Xung (ST30) bay tới Hạ Cự Hư
// (ST39). Nguồn đúng là `p.code` của chính đường kinh — cùng nguồn trang /kinh/ dựng neo id.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { records, classify, COORDS3D_CODES, codeToId, meridianList, coRacChu, huyetIndexable } from './dict-data.mjs'

const huyetKinh = records.map((r) => ({ r, c: classify(r) })).filter((x) => x.c.loai === 'kinh')

test('mọi huyệt thuộc chính kinh đều có mã WHO', () => {
  const thieu = huyetKinh.filter((x) => !x.c.code).map((x) => x.r.ten)
  assert.deepEqual(thieu, [], `thiếu mã → mất hàng "Mã WHO" và cả hai nút: ${thieu.join(', ')}`)
  assert.equal(huyetKinh.length, 361, 'đủ 361 huyệt kinh điển')
})

test('mã WHO khớp codeToId — không huyệt nào đeo mã của huyệt khác', () => {
  const lech = huyetKinh
    .filter((x) => codeToId.get(x.c.code) !== x.r.id)
    .map((x) => `${x.r.ten} đeo ${x.c.code} (mã đó là của id ${codeToId.get(x.c.code)})`)
  assert.deepEqual(lech, [], lech.join(' · '))
})

test('mã WHO có toạ độ 3D — nút "Xem Vị Trí Trên Đồ Hình 3D" bay tới được', () => {
  const khong = huyetKinh.filter((x) => !COORDS3D_CODES.has(x.c.code)).map((x) => `${x.r.ten}/${x.c.code}`)
  assert.deepEqual(khong, [], khong.join(' · '))
})

test('neo "#<mã>" có thật trên trang /kinh/ tương ứng', () => {
  const theoKinh = new Map()
  for (const m of meridianList) theoKinh.set(m, new Set((m.points || []).map((p) => String(p.code || '').toUpperCase())))
  const hong = huyetKinh
    .filter((x) => !(theoKinh.get(x.c.mer) || new Set()).has(x.c.code))
    .map((x) => `${x.r.ten} → /kinh/${x.c.kinhSlug}/#${x.c.code.toLowerCase()}`)
  assert.deepEqual(hong, [], hong.join(' · '))
})

// ── Phép dò rác chữ (thay cờ `corrupt` lỗi thời của acu-index.js) ────────────
// Chốt ở đây canh ĐÚNG cái bẫy đã sập: phép dò quá rộng thì chôn im lặng những bài y văn
// đầy đủ nhất kho (Hợp Cốc 6.092 ký tự, Quan Nguyên 6.385) mà không ai đọc lại để biết.
const bai = (truong) => ({ id: 0, ten: 'Thử', sections: [{ h: 'VỊ TRÍ', body: truong }] })

test('bắt được rác thật: mojibake · U+FFFD · chữ Hán · tàn dư TCVN3 dính chữ', () => {
  for (const xau of ['Dưới da lÃ  cÆ¡ ngá»±c', 'tạp chí� số 43', 'Ung thư dĩ溃', 'C8 hoặc D1.V : 31v¼9:'])
    assert.equal(coRacChu(bai(xau)), true, `phải bắt: ${xau}`)
})

test('KHÔNG vu oan phân số viết đúng và chữ tiếng Việt bình thường', () => {
  for (const xau of [
    'chia làm 4 phần, bỏ đi ¼, lấy ¾ còn lại đo tiếp',
    'lấy ½ dây đó đo từ trên chân tóc kéo lên',
    'Châm thẳng 0,5 – 1 thốn. Cứu 3 – 5 tráng. Ôn cứu 5 – 10 phút.',
    'Huyệt Mộ nơi khí tạng Phế đến — thiên “Kinh Mạch” (Linh Khu 10).',
  ])
    assert.equal(coRacChu(bai(xau)), false, `không được bắt: ${xau}`)
})

test('toàn kho chỉ còn 1 mục có rác — số này phải GIẢM, tăng là có đợt nhập liệu hỏng', () => {
  const ban = records.filter((r) => coRacChu(r))
  assert.ok(ban.length <= 1, `rác tăng lên ${ban.length} mục: ${ban.map((r) => r.ten).join(', ')}`)
})

test('những bài y văn đầy đủ nhất kho KHÔNG bị chôn noindex', () => {
  for (const ten of ['Hợp Cốc', 'Quan Nguyên', 'Trung Phủ', 'Thiếu Thương', 'Phong Phủ', 'Thừa Sơn']) {
    const r = records.find((x) => x.ten === ten)
    assert.ok(r, `không tìm thấy ${ten}`)
    assert.equal(huyetIndexable(r), true, `${ten} đang bị noindex`)
  }
})
