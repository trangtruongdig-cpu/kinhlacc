// routeSeo.ts — Map dữ liệu SEO theo TÊN route, dùng trong App.vue để áp thẻ <head> lúc chạy.
//
// NGUỒN DUY NHẤT của dữ liệu SEO là `route-seo.json` — muốn sửa tiêu đề/mô tả thì sửa ở ĐÓ.
// File JSON này dùng chung cho 3 nơi: app (file này), scripts/gen-sitemap.mjs, scripts/prerender-seo.mjs.
import type { SeoData } from '@/composables/useSeo'
import seoData from './route-seo.json'

export const routeSeo: Record<string, SeoData> = Object.fromEntries(
  seoData.pages.map((p) => [
    p.name,
    {
      title: p.title,
      description: p.description,
      keywords: p.keywords,
      ogType: p.ogType,
      jsonLd: p.jsonLd as Record<string, unknown>,
      // Lối breadcrumb (Trang Chủ tự thêm ở vị trí 1). Trang chủ để [] → không có breadcrumb.
      breadcrumb: (p as { breadcrumb?: { name: string; path: string }[] }).breadcrumb,
      index: true,
    },
  ]),
)

export const defaultSeo: SeoData = {
  title: seoData.default.title,
  description: seoData.default.description,
  index: true,
}
