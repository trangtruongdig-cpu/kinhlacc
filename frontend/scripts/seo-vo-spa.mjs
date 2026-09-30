// seo-vo-spa.mjs — Ghi thẻ <head> cho trang VỎ SPA (bài thuốc, dược liệu): nhận
// dist/index.html của Vue rồi đè title/meta/canonical/JSON-LD lên.
//
// Trước 29/09/2026 hai builder CHÉP y hệt bộ hàm này, và cùng quên twitter:* — nên 15.056
// trang mang nguyên câu chào của trang chủ khi chia sẻ. Một chỗ duy nhất thì sửa một lần.

const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escText = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function setTitle(h, t) { return h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escText(t)}</title>`) }

export function setMeta(h, attr, key, content) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"[^>]*\\scontent=")[^"]*(")`, 'i')
  return re.test(h) ? h.replace(re, `$1${escAttr(content)}$2`)
    : h.replace(/<\/head>/i, `    <meta ${attr}="${key}" content="${escAttr(content)}">\n  </head>`)
}

export function setCanonical(h, href) {
  const re = /(<link\s+rel="canonical"[^>]*\shref=")[^"]*(")/i
  return re.test(h) ? h.replace(re, `$1${escAttr(href)}$2`)
    : h.replace(/<\/head>/i, `    <link rel="canonical" href="${escAttr(href)}">\n  </head>`)
}

export function setJsonLd(h, obj) {
  const json = JSON.stringify(obj).replace(/</g, '\\u003c')
  return h.replace(/\s*<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i, '')
    .replace(/<\/head>/i, `    <script type="application/ld+json" id="seo-jsonld">${json}</script>\n  </head>`)
}

/** seo = { title, description, canonical, ogImage, index } (đã áp ghi đè CMS). */
export function datMetaSeo(h, seo, url) {
  h = setTitle(h, seo.title)
  h = setMeta(h, 'name', 'description', seo.description)
  h = setMeta(h, 'name', 'robots', seo.index !== false ? 'index, follow' : 'noindex, follow')
  h = setCanonical(h, seo.canonical)
  h = setMeta(h, 'property', 'og:title', seo.title)
  h = setMeta(h, 'property', 'og:description', seo.description)
  h = setMeta(h, 'property', 'og:type', 'article')
  h = setMeta(h, 'property', 'og:url', url)
  h = setMeta(h, 'property', 'og:image', seo.ogImage)
  h = setMeta(h, 'name', 'twitter:title', seo.title)
  h = setMeta(h, 'name', 'twitter:description', seo.description)
  h = setMeta(h, 'name', 'twitter:image', seo.ogImage)
  return h
}
