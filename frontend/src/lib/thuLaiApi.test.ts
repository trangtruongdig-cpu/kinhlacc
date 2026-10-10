/**
 * node --test src/lib/thuLaiApi.test.ts
 *
 * Luật thử lại là chỗ DUY NHẤT trong api.ts có thể sai một cách im lặng: thử lại nhầm một
 * thao tác GHI là tạo ra vé đặt hai lần, mà không màn hình nào báo gì.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nenThuLai, treTruocKhiThu, HAN_GIO_DOC_MS, HAN_GIO_GHI_MS } from './thuLaiApi.ts'

const doc = { laGhi: false, coKhoa: false, lanDaThu: 0, status: null, laLoiMang: true }

test('ĐỌC: lỗi mạng thì thử lại', () => {
  assert.equal(nenThuLai(doc), true)
})

test('ĐỌC: thử tối đa 2 lần rồi thôi', () => {
  assert.equal(nenThuLai({ ...doc, lanDaThu: 1 }), true)
  assert.equal(nenThuLai({ ...doc, lanDaThu: 2 }), false)
})

test('TUYỆT ĐỐI không thử lại 4xx — 409 là "ca đã có người đặt", thử lại chỉ nhận lại y thế', () => {
  for (const s of [400, 401, 403, 404, 409, 422]) {
    assert.equal(nenThuLai({ ...doc, laLoiMang: false, status: s }), false, `status ${s}`)
  }
})

test('ĐỌC: 502/503/504 thì thử lại', () => {
  for (const s of [502, 503, 504]) {
    assert.equal(nenThuLai({ ...doc, laLoiMang: false, status: s }), true, `status ${s}`)
  }
})

test('GHI: KHÔNG có khoá chống lặp thì KHÔNG thử lại — đây là luật an toàn dữ liệu', () => {
  assert.equal(
    nenThuLai({ laGhi: true, coKhoa: false, lanDaThu: 0, status: null, laLoiMang: true }),
    false,
  )
})

test('GHI: có khoá thì được thử lại ĐÚNG MỘT lần', () => {
  const ghi = { laGhi: true, coKhoa: true, status: null, laLoiMang: true }
  assert.equal(nenThuLai({ ...ghi, lanDaThu: 0 }), true)
  assert.equal(nenThuLai({ ...ghi, lanDaThu: 1 }), false)
})

test('GHI có khoá: 502 cũng được thử lại, nhưng 409 thì không', () => {
  const ghi = { laGhi: true, coKhoa: true, lanDaThu: 0, laLoiMang: false }
  assert.equal(nenThuLai({ ...ghi, status: 502 }), true)
  assert.equal(nenThuLai({ ...ghi, status: 409 }), false)
})

test('độ trễ tăng dần, không phải hằng số', () => {
  assert.equal(treTruocKhiThu(0), 300)
  assert.equal(treTruocKhiThu(1), 1200)
})

test('hạn giờ GHI rộng hơn hạn giờ ĐỌC', () => {
  assert.ok(HAN_GIO_GHI_MS > HAN_GIO_DOC_MS)
})
