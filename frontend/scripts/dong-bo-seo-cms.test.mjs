import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quyetDinh } from './dong-bo-seo-cms.mjs'

const may = { title: 'Mới', description: 'Mô tả mới', image: 'https://x/a.png', canonical: 'https://x/p/', noIndex: false }
const dong = (o = {}) => ({ seo_title: null, seo_description: null, seo_image: null, seo_canonical: null, seo_no_index: 0, ...o })

test('chưa có gì → điền toàn bộ bản máy', () => {
  const { ra, tay } = quyetDinh(undefined, undefined, may)
  assert.equal(ra.seo_title, 'Mới')
  assert.equal(ra.seo_canonical, 'https://x/p/')
  assert.equal(ra.seo_no_index, 0)
  assert.equal(tay, 0)
})

test('ô còn đúng chữ máy điền lần trước → cập nhật theo bản mới (không đóng băng)', () => {
  const cu = dong({ seo_title: 'Cũ', seo_description: 'Mô tả cũ' })
  const so = dong({ seo_title: 'Cũ', seo_description: 'Mô tả cũ' })
  const { ra, tay } = quyetDinh(cu, so, may)
  assert.equal(ra.seo_title, 'Mới')
  assert.equal(ra.seo_description, 'Mô tả mới')
  assert.equal(tay, 0)
})

test('ô người đã sửa → GIỮ, ô khác vẫn cập nhật', () => {
  const cu = dong({ seo_title: 'Người viết tay', seo_description: 'Mô tả cũ' })
  const so = dong({ seo_title: 'Cũ', seo_description: 'Mô tả cũ' })
  const { ra, tay } = quyetDinh(cu, so, may)
  assert.equal(ra.seo_title, 'Người viết tay')
  assert.equal(ra.seo_description, 'Mô tả mới')
  assert.equal(tay, 1)
})

test('người XOÁ trắng ô → điền lại bản máy (ô trống nghĩa là "dùng mặc định")', () => {
  const cu = dong({ seo_title: '' })
  const so = dong({ seo_title: 'Cũ' })
  assert.equal(quyetDinh(cu, so, may).ra.seo_title, 'Mới')
})

test('chưa có sổ mà ô đã có chữ → coi là của người (dữ liệu có trước khi có cơ chế này)', () => {
  const { ra, tay } = quyetDinh(dong({ seo_title: 'Có từ trước' }), undefined, may)
  assert.equal(ra.seo_title, 'Có từ trước')
  assert.equal(tay, 1)
})

test('công tắc noindex: người bật ngược bản máy → giữ; còn đúng bản máy → theo bản mới', () => {
  // máy từng nói noindex (1), người tắt thành index (0) → giữ 0 dù máy vẫn nói 1
  assert.equal(quyetDinh(dong({ seo_no_index: 0 }), dong({ seo_no_index: 1 }), { ...may, noIndex: true }).ra.seo_no_index, 0)
  // còn đúng bản máy cũ (1) → theo bản máy mới (0)
  assert.equal(quyetDinh(dong({ seo_no_index: 1 }), dong({ seo_no_index: 1 }), may).ra.seo_no_index, 0)
})
