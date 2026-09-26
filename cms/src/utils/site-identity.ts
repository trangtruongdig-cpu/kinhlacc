/** Resolved media reference from getSiteSettings() */
export interface MediaReference {
	mediaId: string;
	alt?: string;
	url?: string;
}

export interface BlogSiteIdentitySettings {
	title?: string;
	tagline?: string;
	logo?: MediaReference;
	favicon?: MediaReference;
}

// MẶC ĐỊNH phải là thương hiệu thật: khi CMS chưa được đặt tiêu đề trong phần
// cài đặt, trang /trang/… đội thẳng dòng này ra trước mặt khách. Mẫu gốc của EmDash
// là "My Blog" / "Thoughts, stories, and ideas." — tiếng Anh và không phải tên site.
// Khẩu hiệu giữ ĐÚNG bản ở frontend/src/components/SiteFooter.vue.
const DEFAULT_SITE_TITLE = "Kinh Lạc Trương Gia";
const DEFAULT_SITE_TAGLINE =
	"Đông Y nghìn năm, giờ đây đã có dữ liệu lớn.";

export function resolveBlogSiteIdentity(settings?: BlogSiteIdentitySettings) {
	return {
		siteTitle: settings?.title ?? DEFAULT_SITE_TITLE,
		siteTagline: settings?.tagline ?? DEFAULT_SITE_TAGLINE,
		siteLogo: settings?.logo?.url ? settings.logo : null,
	};
}
