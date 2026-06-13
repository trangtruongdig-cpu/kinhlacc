// useSeo.ts — Quản lý thẻ <head> theo từng trang, KHÔNG cần thư viện ngoài.
//
// Vì sao tự viết thay vì cài @unhead/vue: app là SPA + sắp prerender bằng snapshot
// (Phase 2). Cách set thẳng lên DOM này đơn giản, không lỗi version, và vẫn được
// trình prerender chụp lại đầy đủ. Khi nào chuyển sang vite-ssg thì đổi sau.
//
// Cách dùng: gọi applySeo(seo, path) mỗi khi đổi route (xem App.vue).

export interface SeoData {
  /** Tiêu đề trang (<title> + og:title). Nên <= 60 ký tự. */
  title: string
  /** Mô tả (<meta description> + og:description). Nên <= 155 ký tự. */
  description: string
  /** Từ khoá mục tiêu (gộp vào meta keywords). */
  keywords?: string[]
  /** false => noindex,nofollow (trang riêng tư / không muốn lên Google). Mặc định true. */
  index?: boolean
  /** URL chuẩn (canonical) tuyệt đối. Mặc định = DOMAIN + path. */
  canonical?: string
  /** 'website' | 'article'. Mặc định 'website'. */
  ogType?: string
  /** Ảnh chia sẻ. Mặc định ảnh OG chung. */
  ogImage?: string
  /** Dữ liệu có cấu trúc Schema.org (JSON-LD). null/undefined => gỡ thẻ. */
  jsonLd?: Record<string, unknown> | null
  /**
   * Lối breadcrumb (trừ "Trang Chủ" — tự thêm ở vị trí 1). Mỗi mục { name, path }.
   * Rỗng/undefined => không sinh BreadcrumbList. Item cuối là trang hiện tại.
   */
  breadcrumb?: { name: string; path: string }[]
}

const DOMAIN = 'https://kinhlac.online'
const SITE_NAME = 'Kinh Lạc Trương Gia'
const DEFAULT_OG_IMAGE = `${DOMAIN}/og-default.png`

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(data: Record<string, unknown> | null | undefined) {
  const id = 'seo-jsonld'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!data) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/**
 * BreadcrumbList JSON-LD — script RIÊNG (id="seo-jsonld-crumb") để KHÔNG đụng JSON-LD chính.
 * "Trang Chủ" luôn ở vị trí 1; mỗi mục `item` là URL tuyệt đối (Google yêu cầu).
 * Rỗng => gỡ thẻ (vd Trang Chủ không cần breadcrumb).
 */
function setBreadcrumbLd(items: { name: string; path: string }[] | undefined) {
  const id = 'seo-jsonld-crumb'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!items || !items.length) {
    if (el) el.remove()
    return
  }
  const trail = [{ name: 'Trang Chủ', path: '/' }, ...items]
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: DOMAIN + c.path,
    })),
  }
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/** Áp toàn bộ thẻ SEO cho 1 trang. Gọi lại mỗi lần đổi route. */
export function applySeo(seo: SeoData, path: string) {
  const canonical = seo.canonical || DOMAIN + path
  const ogImage = seo.ogImage || DEFAULT_OG_IMAGE
  const ogType = seo.ogType || 'website'

  document.title = seo.title

  upsertMeta('name', 'description', seo.description)
  if (seo.keywords?.length) upsertMeta('name', 'keywords', seo.keywords.join(', '))
  upsertMeta('name', 'robots', seo.index === false ? 'noindex, nofollow' : 'index, follow')

  upsertLink('canonical', canonical)

  upsertMeta('property', 'og:title', seo.title)
  upsertMeta('property', 'og:description', seo.description)
  upsertMeta('property', 'og:type', ogType)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', ogImage)
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:locale', 'vi_VN')

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', seo.title)
  upsertMeta('name', 'twitter:description', seo.description)
  upsertMeta('name', 'twitter:image', ogImage)

  setJsonLd(seo.jsonLd)
  setBreadcrumbLd(seo.breadcrumb)
}
