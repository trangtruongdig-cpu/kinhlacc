import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tenGoc, khoaVi, timTrung } from './trung-lap-bai-thuoc.mjs'

const vi = (...ds) => ds.map((ten) => ({ ten }))
const doDay = (b) => String(b.tac_dung || '').length

test('tên gốc bỏ số La Mã và đuôi khử trùng', () => {
  assert.equal(tenGoc('Chỉ Xác Tán II'), 'chỉ xác tán')
  assert.equal(tenGoc('An Hồi Hoàn 2'), 'an hồi hoàn')
  assert.equal(tenGoc('Chỉ Xác Tán II 2'), 'chỉ xác tán')
  // Không được nuốt chữ cuối có thật của tên
  assert.equal(tenGoc('Tứ Vật Thang'), 'tứ vật thang')
})

test('khoá vị không phụ thuộc thứ tự/hoa thường; dưới 2 vị thì bỏ', () => {
  assert.equal(khoaVi(vi('Cam thảo', 'Đương quy')), khoaVi(vi('đương quy', 'CAM THẢO')))
  assert.equal(khoaVi(vi('Ác thực')), null)
})

test('cùng tên gốc + cùng vị → trùng, bản dày làm chính', () => {
  const { veChinh } = timTrung([
    { id: 1, slug: 'a', ten: 'An Hồi Hoàn', thanh_phan: vi('X', 'Y'), tac_dung: 'ngắn' },
    { id: 2, slug: 'a-2', ten: 'An Hồi Hoàn', thanh_phan: vi('Y', 'X'), tac_dung: 'dài hơn nhiều chữ' },
  ], doDay)
  assert.equal(veChinh.get('a'), 'a-2')
  assert.equal(veChinh.has('a-2'), false)
})

test('cùng TÊN mà khác vị → KHÔNG trùng (phương khác nhau chung tên)', () => {
  const { veChinh } = timTrung([
    { id: 1, slug: 'ath-i', ten: 'An Thần Hoàn I', thanh_phan: vi('X', 'Y'), tac_dung: 'a' },
    { id: 2, slug: 'ath-ii', ten: 'An Thần Hoàn II', thanh_phan: vi('X', 'Z'), tac_dung: 'a' },
  ], doDay)
  assert.equal(veChinh.size, 0)
})

test('cùng vị, khác tên, tác dụng khác hẳn → KHÔNG trùng', () => {
  const { veChinh } = timTrung([
    { id: 1, slug: 'p', ten: 'Bạch Cốc Hoàn', thanh_phan: vi('X', 'Y'), tac_dung: 'trị ho lâu ngày đờm nhiều khó thở' },
    { id: 2, slug: 'q', ten: 'Đại Kiện Trung Hoàn', thanh_phan: vi('X', 'Y'), tac_dung: 'ôn trung tán hàn chỉ thống bụng lạnh đau' },
  ], doDay)
  assert.equal(veChinh.size, 0)
})

test('cùng vị, khác tên, tác dụng trùng chữ → trùng', () => {
  const td = 'trị ngoại cảm phong hàn sốt cao sợ lạnh không mồ hôi'
  const { veChinh } = timTrung([
    { id: 1, slug: 'p', ten: 'Phương A', thanh_phan: vi('X', 'Y'), tac_dung: td },
    { id: 2, slug: 'q', ten: 'Phương B', thanh_phan: vi('X', 'Y'), tac_dung: td + '.' },
  ], doDay)
  assert.equal(veChinh.size, 1)
})
