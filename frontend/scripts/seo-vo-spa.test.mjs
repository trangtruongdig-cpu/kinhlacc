import { test } from 'node:test'
import assert from 'node:assert/strict'
import { datMetaSeo } from './seo-vo-spa.mjs'

const goc = `<html><head><title>Trang chủ</title>
<meta name="description" content="chào">
<meta property="og:image" content="https://x/og-default.png">
<meta name="twitter:title" content="Câu chào trang chủ">
<meta name="twitter:description" content="Câu chào trang chủ">
<link rel="canonical" href="https://x/">
</head><body></body></html>`

test('ghi đủ title/description/canonical/og/twitter của CHÍNH trang', () => {
  const h = datMetaSeo(goc, {
    title: 'An Hồi Hoàn — Bài Thuốc', description: 'Mô tả "riêng"', canonical: 'https://x/bai-thuoc/a/',
    ogImage: 'https://x/anh.png', index: false,
  }, 'https://x/bai-thuoc/a-2/')
  assert.match(h, /<title>An Hồi Hoàn — Bài Thuốc<\/title>/)
  assert.match(h, /name="twitter:title" content="An Hồi Hoàn — Bài Thuốc"/)
  assert.match(h, /name="twitter:description" content="Mô tả &quot;riêng&quot;"/)
  assert.match(h, /rel="canonical" href="https:\/\/x\/bai-thuoc\/a\/"/)
  assert.match(h, /property="og:url" content="https:\/\/x\/bai-thuoc\/a-2\/"/)
  assert.match(h, /name="robots" content="noindex, follow"/)
  assert.doesNotMatch(h, /Câu chào trang chủ|og-default/)
})
