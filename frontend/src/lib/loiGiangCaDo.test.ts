import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cauChotTongCuong, cauChotLucKinh, cauChotPhapTri, loiThuong } from './loiGiangCaDo.ts'

const MAU = {
  amDuong: 'Dương hư', tinhChat: 'Hàn', viTri: 'Biểu', chinhKhi: 'Hư',
  hoiChung: 'Biểu Hư Hàn', reason: 'vì ...', loai: 'duong-hu' as const, phapTri: 'Ôn dương',
}

test('câu chốt lấy TỪ dữ liệu, không bịa thêm kết luận', () => {
  const r = cauChotTongCuong(MAU)
  assert.equal(r.chinh, 'Dương hư')
  assert.match(r.thuong, /nóng ấm/i)
})

test('thiếu dữ liệu thì KHÔNG đoán — trả rỗng để dải tự ẩn', () => {
  const r = cauChotTongCuong({ ...MAU, amDuong: '', hoiChung: '', loai: 'unknown', phapTri: '' })
  assert.equal(r.chinh, '')
  assert.equal(r.thuong, '')
})

test('loai unknown thì rỗng DÙ amDuong có chữ', () => {
  assert.equal(cauChotTongCuong({ ...MAU, loai: 'unknown' }).chinh, '')
})

test('thuật ngữ ngoài bảng trả rỗng, không bịa lời giải', () => {
  assert.equal(loiThuong('Một thuật ngữ chưa có trong bảng'), '')
})

test('câu chốt lục kinh lấy tên kinh và lời thường theo viTri', () => {
  const r = cauChotLucKinh({ kinh: { ten: 'Thiếu Dương', viTri: 'Bán biểu bán lý' }, giaiDoan: 'kinh chứng' })
  assert.equal(r.chinh, 'Thiếu Dương')
  assert.match(r.thuong, /nửa ngoài nửa trong/)
  assert.equal(r.phu, 'kinh chứng')
})

test('không có kết luận lục kinh (ngoài Thương Hàn) thì rỗng, không ép', () => {
  assert.equal(cauChotLucKinh(null).chinh, '')
})

test('viTri lạ thì bỏ lời thường, vẫn giữ tên kinh', () => {
  const r = cauChotLucKinh({ kinh: { ten: 'Kinh Lạ', viTri: 'Chưa có trong bảng' } })
  assert.equal(r.chinh, 'Kinh Lạ')
  assert.equal(r.thuong, '')
})

test('pháp trị lấy thẳng từ tongCuong, unknown thì rỗng', () => {
  assert.equal(cauChotPhapTri(MAU).chinh, 'Ôn dương')
  assert.equal(cauChotPhapTri({ ...MAU, loai: 'unknown' }).chinh, '')
})
