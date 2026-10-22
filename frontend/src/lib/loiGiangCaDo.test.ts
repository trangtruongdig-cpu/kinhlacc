import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cauChotTongCuong, loiThuong } from './loiGiangCaDo.ts'

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
