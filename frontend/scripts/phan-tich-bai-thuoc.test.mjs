import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tongHopTinhVi, timLienQuan, cauTomTat } from './phan-tich-bai-thuoc.mjs'

const vi = new Map([
  [1, { tinh: 'Ôn', vi: 'Cam', kinh: ['Tỳ', 'Vị'] }],
  [2, { tinh: 'Hơi Hàn', vi: 'Khổ, Tân', kinh: ['Phế'] }],
  [3, { tinh: 'hơi hàn', vi: 'Cam', kinh: ['Tỳ'] }],
])

test('đếm tính/vị/quy kinh, gộp hoa thường, bỏ vị không có dữ liệu khỏi phép đếm', () => {
  const pt = tongHopTinhVi([{ id: 1, ten: 'A' }, { id: 2, ten: 'B' }, { id: 3, ten: 'C' }, { ten: 'D' }], vi)
  assert.equal(pt.soVi, 4)
  assert.equal(pt.soCoDuLieu, 3)
  assert.deepEqual(pt.khi, [['Hơi hàn', 2], ['Ôn', 1]])
  assert.deepEqual(pt.vi[0], ['Cam', 2])
  assert.deepEqual(pt.kinh[0], ['Tỳ', 2])
  assert.match(cauTomTat(pt), /^Trong 3\/4 vị có dữ liệu; tính Hơi hàn \(2\), Ôn \(1\)/)
})

test('không vị nào có dữ liệu → null (không in khối rỗng)', () => {
  assert.equal(tongHopTinhVi([{ ten: 'X' }], vi), null)
})

test('liên quan: chỉ trỏ tới ứng viên, bỏ cặp bị loại, xếp theo độ giống', () => {
  const bai = [
    { slug: 'a', ten: 'A', thanh_phan: [{ ten: 'x' }, { ten: 'y' }, { ten: 'z' }] },
    { slug: 'b', ten: 'B', thanh_phan: [{ ten: 'x' }, { ten: 'y' }, { ten: 'z' }, { ten: 'w' }] },
    { slug: 'c', ten: 'C', thanh_phan: [{ ten: 'x' }, { ten: 'y' }] },
    { slug: 'd', ten: 'D', thanh_phan: [{ ten: 'x' }, { ten: 'y' }, { ten: 'z' }] },
  ]
  const kq = timLienQuan(bai, new Set(['a', 'b', 'c']), { boQua: (s, t) => s === 'a' && t === 'c' })
  assert.deepEqual(kq.get('a').map((x) => x.slug), ['b']) // d không phải ứng viên, c bị loại
  assert.equal(kq.get('d')[0].slug, 'a')
})
