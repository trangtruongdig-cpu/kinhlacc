// Gom URL bài viết của một đối thủ từ sitemap (theo robots.txt + hai vị trí quen thuộc).
// Chỉ đọc URL CÙNG TÊN MIỀN với đối thủ đã khai — một sitemap trỏ ra ngoài không kéo được
// radar đi đọc nơi khác (lớp chống SSRF thứ hai, sau urlDocDuoc).

import { boDau } from "../luat/chuan-hoa.mjs";

export const TRAN_SITEMAP = 15;
export const TRAN_URL = 300;

function giaiMaXml(s) {
	return s
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&(?:apos|#39);/g, "'");
}

/** Các giá trị <loc> trong một sitemap. */
export function layLoc(xml) {
	const ra = [];
	for (const m of String(xml ?? "").matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)) {
		const u = giaiMaXml(m[1].trim());
		if (u) ra.push(u);
	}
	return ra;
}

/**
 * Các mục <url>/<sitemap> kèm <lastmod> (null nếu thiếu hoặc không đọc được). Sitemap không
 * bọc <loc> trong <url>/<sitemap> thì rơi về layLoc, không có ngày.
 * @returns {{loc: string, lastmod: number|null}[]}
 */
export function layMuc(xml) {
	const chu = String(xml ?? "");
	const ra = [];
	for (const m of chu.matchAll(/<(url|sitemap)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)) {
		const loc = m[2].match(/<loc>\s*([\s\S]*?)\s*<\/loc>/i);
		if (!loc) continue;
		const u = giaiMaXml(loc[1].trim());
		if (!u) continue;
		const lm = m[2].match(/<lastmod>\s*([\s\S]*?)\s*<\/lastmod>/i);
		const t = lm ? Date.parse(lm[1].trim()) : NaN;
		ra.push({ loc: u, lastmod: Number.isFinite(t) ? t : null });
	}
	return ra.length ? ra : layLoc(chu).map((loc) => ({ loc, lastmod: null }));
}

/** Mới → cũ theo lastmod; mục không ngày đứng sau; hoà nhau giữ thứ tự gốc (sort ổn định). */
export function moiTruoc(muc) {
	return [...muc].sort((a, b) => {
		if (a.lastmod === null || b.lastmod === null) return (a.lastmod === null) - (b.lastmod === null);
		return b.lastmod - a.lastmod;
	});
}

// Phân loại sitemap CON theo tên. Đối thủ là bệnh viện/phòng khám: ngoài bài viết họ còn
// sitemap trang bác sĩ, chi nhánh, dịch vụ, tuyển dụng, danh mục… — quét chúng chỉ tốn trần
// sitemap/URL rồi đổ rác vào hàng chờ Claude đọc. Nhóm "bo" xét TRƯỚC: "post_tag-sitemap"
// chứa cả "post" lẫn "tag" nhưng là trang thẻ, không phải bài.
const DAU_BO = ["page-sitemap", "category", "tag", "author", "product", "san-pham", "bac-si", "doctor", "chi-nhanh", "branch", "dich-vu", "service", "tuyen-dung", "career", "video", "image", "faq", "landing"];
const DAU_BAI_VIET = ["post", "blog", "tin-tuc", "bai-viet", "news", "article", "kien-thuc", "cam-nang"];

/**
 * Loại sitemap con theo đường dẫn + tên tệp (chữ thường, bỏ dấu; KHÔNG xét tên miền).
 * "khong_ro" vẫn quét: bỏ sót bài tệ hơn quét thừa, lọc ngách ở khâu trích lo phần rác.
 * @returns {"bai_viet"|"bo"|"khong_ro"}
 */
export function phanLoaiSitemap(url) {
	let duong;
	try {
		duong = new URL(url).pathname;
	} catch {
		duong = String(url ?? "");
	}
	try {
		duong = decodeURIComponent(duong);
	} catch {}
	duong = boDau(duong);
	if (DAU_BO.some((d) => duong.includes(d))) return "bo";
	if (DAU_BAI_VIET.some((d) => duong.includes(d))) return "bai_viet";
	return "khong_ro";
}

export function laSitemapIndex(xml) {
	return /<sitemapindex[\s>]/i.test(String(xml ?? ""));
}

/** "https://www.Vinmec.com/vi/" → "vinmec.com". Rỗng nếu không giống tên miền. */
export function chuanTenMien(s) {
	const h = String(s ?? "")
		.trim()
		.toLowerCase()
		.replace(/^[a-z]+:\/\//, "")
		.replace(/[/?#].*$/, "")
		.replace(/:\d+$/, "")
		.replace(/^www\./, "");
	return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) ? h : "";
}

/** URL có thuộc đúng tên miền này (kể cả www.) không. */
export function cungTenMien(url, tenMien) {
	try {
		return new URL(url).hostname.toLowerCase().replace(/^www\./, "") === tenMien;
	} catch {
		return false;
	}
}

/** Bỏ ảnh/tệp và trang chủ trần. */
export function laUrlNoiDung(url, tenMien) {
	if (!/^https?:\/\//i.test(url) || !cungTenMien(url, tenMien)) return false;
	if (/\.(jpe?g|png|gif|webp|svg|css|js|pdf|zip|rar|mp4|mp3|ico|xml|woff2?|ttf)(\?|$)/i.test(url)) return false;
	return new URL(url).pathname.replace(/\/+$/, "") !== "";
}

/**
 * Trả URL bài viết MỚI NHẤT trước, rồi mới áp trần. Yoast/WordPress liệt kê bài CŨ trước và
 * sitemap con cũ trước; áp trần theo thứ tự tài liệu thì radar kẹt mãi ở 300 bài cổ nhất.
 * Nên: đi sitemap con theo lastmod mới → cũ, gom mọi trang của sitemap đã đọc, xếp mới → cũ,
 * rồi mới cắt ở tranUrl.
 * Sitemap CON loại "bo" (xem phanLoaiSitemap) không đọc; sitemap gốc (robots, /sitemap.xml,
 * /sitemap_index.xml) luôn đọc.
 * @param {string} tenMien  đã qua chuanTenMien
 * @param {(url: string) => Promise<string>} docWeb
 * @returns {Promise<{urls: string[], sitemapBo: string[]}>}  sitemapBo: sitemap con đã bỏ
 */
export async function thuThapUrl(tenMien, docWeb, { tranSitemap = TRAN_SITEMAP, tranUrl = TRAN_URL } = {}) {
	const hang = [];
	const robots = await docWeb(`https://${tenMien}/robots.txt`);
	for (const m of robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)) if (cungTenMien(m[1], tenMien)) hang.push(m[1].trim());
	hang.push(`https://${tenMien}/sitemap.xml`, `https://${tenMien}/sitemap_index.xml`);

	const daXem = new Set();
	const sitemapBo = [];
	/** url → mục (giữ lần gặp đầu; Map giữ thứ tự gặp cho các mục hoà nhau). */
	const trang = new Map();
	let daDoc = 0;
	// Dừng ĐỌC thêm sitemap khi đã đủ tranUrl: sitemap con được đi mới → cũ nên phần đã gom
	// là phần mới nhất. Trong MỘT sitemap thì đọc hết (không cắt giữa chừng) rồi mới xếp.
	while (hang.length && daDoc < tranSitemap && trang.size < tranUrl) {
		const sm = hang.shift();
		if (daXem.has(sm) || /\.gz($|\?)/i.test(sm)) continue;
		daXem.add(sm);
		const xml = await docWeb(sm);
		daDoc++;
		if (!xml) continue;
		if (laSitemapIndex(xml)) {
			// Chen sitemap con lên ĐẦU hàng, mới nhất trước.
			const con = [];
			for (const { loc } of moiTruoc(layMuc(xml))) {
				if (!cungTenMien(loc, tenMien) || daXem.has(loc)) continue;
				if (phanLoaiSitemap(loc) === "bo") {
					daXem.add(loc);
					sitemapBo.push(loc);
				} else con.push(loc);
			}
			hang.unshift(...con);
		} else {
			for (const m of layMuc(xml)) if (laUrlNoiDung(m.loc, tenMien) && !trang.has(m.loc)) trang.set(m.loc, m);
		}
	}
	return { urls: moiTruoc([...trang.values()]).slice(0, tranUrl).map((m) => m.loc), sitemapBo };
}
