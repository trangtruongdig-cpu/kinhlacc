// Gom URL bài viết của một đối thủ từ sitemap (theo robots.txt + hai vị trí quen thuộc).
// Chỉ đọc URL CÙNG TÊN MIỀN với đối thủ đã khai — một sitemap trỏ ra ngoài không kéo được
// radar đi đọc nơi khác (lớp chống SSRF thứ hai, sau urlDocDuoc).

import { boDau } from "../luat/chuan-hoa.mjs";

/**
 * Số sitemap đọc mỗi ca, mỗi đối thủ. Đo thật 03/10/2026: `vinmec.com` phải đọc **39** sitemap
 * con mới hết phần bài viết (138 sitemap khác bị `phanLoaiSitemap` bỏ). Trần cũ là 15 nên radar
 * không bao giờ xuống tới đáy.
 */
export const TRAN_SITEMAP = 40;
/**
 * Số URL MỚI lấy mỗi ca, mỗi đối thủ. Trần cũ 300 là trần TUYỆT ĐỐI của cả kho vì không có sổ
 * đào sâu — kho đứng ở 300/35.710 URL của vinmec (0,84%). Nay là trần MỖI CA: ca sau đi tiếp.
 */
export const TRAN_URL = 1000;
/**
 * Sitemap con đã đọc XONG mà sitemap index không khai `lastmod` thì đọc lại sau chừng này —
 * không có mốc nào để biết nó có bài mới hay không, mà đọc lại mỗi đêm thì ăn hết trần
 * `tranSitemap` và kho không bao giờ sâu thêm.
 */
export const HAN_DOC_LAI_MS = 7 * 24 * 60 * 60 * 1000;

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
 * Sitemap này về ĐỦ chưa — tức có thẻ đóng `</urlset>` / `</sitemapindex>`.
 *
 * ⚠️ VÌ SAO CẦN. `taoDocWeb` cắt thân ở `TRAN_BYTE_THAN` (1,5 MB) để một sitemap trỏ nhầm tới
 * tệp nén không nuốt hết RAM container. Cắt là ĐÚNG, nhưng `layMuc` vẫn trả về đàng hoàng phần
 * đã đọc — không lỗi, không cảnh báo — nên sitemap đó trông như đã đọc xong. Ghi nó vào sổ
 * `smDaDoc` là bỏ rơi phần đuôi VĨNH VIỄN, đúng cái bẫy mà `conSot` sinh ra để chặn.
 *
 * Đo 07/10/2026: `sitemap_baiviet1.xml` của nhathuoclongchau qua dịch vụ trung gian nặng
 * **1,09 MB** cho 5.001 URL (~218 byte/URL) — tức sitemap từ ~7.000 URL trở lên SẼ bị cắt.
 *
 * Chuỗi RỖNG trả `false`: không đọc được thì cũng không thể gọi là đọc xong. (Chỗ gọi đã chặn
 * rỗng sớm hơn bằng `if (!xml) continue`, nên hai trạng thái đó không bị lẫn.)
 */
export function sitemapDayDu(xml) {
	return /<\/(?:urlset|sitemapindex)\s*>/i.test(String(xml ?? ""));
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
// chứa cả "post" lẫn "tag" nhưng là trang thẻ, không phải bài. "_" được đổi thành "-" trước khi
// so (post type WordPress hay dùng gạch dưới: wp-sitemap-posts-dich_vu-1.xml), và sitemap lõi
// WordPress (wp-sitemap-posts-<loại>-N.xml) chứa "posts" ở MỌI loại nên phải chặn theo loại.
const DAU_BO = ["page-sitemap", "posts-page", "-page-", "users", "elementor-library", "chuyen-gia", "category", "tag", "author", "product", "san-pham", "bac-si", "doctor", "chi-nhanh", "branch", "dich-vu", "service", "tuyen-dung", "career", "video", "image", "faq", "landing"];
const DAU_BAI_VIET = ["post", "blog", "tin-tuc", "bai-viet", "baiviet", "news", "article", "kien-thuc", "cam-nang"];

/**
 * Bộ sitemap là HÀNG BÁN, khớp TRÒN TÊN BỘ (không phải chuỗi con).
 *
 * Đo 07/10/2026 trên `nhathuoclongchau.com.vn`: sitemap index có 26 bộ con, trong đó 6 bộ là
 * danh mục hàng (thuốc, dược mỹ phẩm, thực phẩm chức năng, chăm sóc cá nhân, trang thiết bị y
 * tế) và 17 bộ là bài viết. Mọi bộ khai CÙNG `lastmod` nên `moiTruoc` giữ thứ tự gốc — mà
 * trong tệp của họ 5 bộ hàng bán đứng TRƯỚC. Không bỏ thì chúng ăn hết trần `tranUrl` và kho
 * chỉ có trang bán hàng; site này không bán hàng nên đó là 0 thông tin cạnh tranh.
 *
 * ⚠️ PHẢI khớp TRÒN TÊN. Thêm "thuoc" vào `DAU_BO` (vốn khớp chuỗi con) là bỏ luôn
 * `sitemap-bai-thuoc.xml` / `sitemap-vi-thuoc.xml` của một đối thủ Đông y — đúng loại nội
 * dung quý nhất trong cả ngách này, và bỏ im lặng vì `DAU_BO` xét TRƯỚC `DAU_BAI_VIET`.
 */
const BO_TRON_TEN = new Set([
	"thuoc",
	"thuocgoc",
	"thuoc-goc",
	"duoc-my-pham",
	"my-pham",
	"thuc-pham-chuc-nang",
	"cham-soc-ca-nhan",
	"trang-thiet-bi-y-te",
	"thiet-bi-y-te",
]);

/**
 * Tên bộ của một sitemap: bỏ đường dẫn, đuôi tệp, chữ "sitemap" ở hai đầu và số thứ tự cuối.
 * `sitemap_thuoc.xml` → "thuoc" · `sitemap-bai-thuoc.xml` → "bai-thuoc" · `sitemap_baiviet17.xml` → "baiviet"
 */
export function tenBoSitemap(duong) {
	let t = String(duong ?? "")
		.split("/")
		.pop()
		.replace(/\.(xml|rss|txt|gz)$/i, "");
	t = t.replace(/^sitemap[-]?/, "").replace(/[-]?sitemap$/, "");
	return t.replace(/[-]?\d+$/, "").replace(/^[-]+|[-]+$/g, "");
}

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
	duong = boDau(duong).replace(/_/g, "-");
	if (BO_TRON_TEN.has(tenBoSitemap(duong))) return "bo";
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
 *
 * ⚠️ ĐÀO SÂU (03/10/2026). Trước đó hàm này luôn trả về ĐÚNG 300 URL mới nhất, nên ca đêm thứ
 * hai trở đi gom lại y nguyên danh sách cũ và `themUrlMoi` đếm 0 — kho đứng ở 300 trang/đối thủ
 * vĩnh viễn trong khi Vinmec có hàng nghìn bài. Hai thứ chữa nó, phải có CẢ HAI:
 *
 * - `locMoi`: lọc bỏ URL đã nằm trong kho TRƯỚC khi áp trần, nên mỗi ca lấy được 300 URL THẬT
 *   SỰ MỚI thay vì 300 URL cũ. Nhận cả LÔ (một sitemap một lượt) chứ không hỏi từng URL: phía
 *   kho nó là `getMany`, hỏi lẻ 2.000 lần là 2.000 lượt đi-về tới Aiven.
 * - `daDocSitemap`: sổ sitemap con đã đọc xong (kèm `lastmod` và mốc đọc). Có sổ này thì ca sau
 *   bỏ qua chúng và đi tiếp xuống sitemap chưa đọc — không có sổ thì trần `tranSitemap` giữ
 *   radar quanh quẩn ở 15 sitemap mới nhất.
 *
 * Sitemap con chỉ được ghi vào sổ khi **mọi** URL mới của nó đều lọt qua lát cắt `tranUrl`.
 * Cắt mất một phần rồi vẫn ghi "đã đọc xong" là bỏ rơi phần đó vĩnh viễn.
 *
 * @param {string} tenMien  đã qua chuanTenMien
 * @param {(url: string) => Promise<string>} docWeb
 * @param {{tranSitemap?: number, tranUrl?: number, locMoi?: (urls: string[]) => Promise<string[]>|string[],
 *          daDocSitemap?: Record<string, {lastmod: number|null, luc: number}>, now?: number}} o
 * @returns {Promise<{urls: string[], sitemapBo: string[],
 *   daDoc: {loc: string, lastmod: number|null, soUrl: number}[], conSot: string[], soSitemapBoQua: number}>}
 */
export async function thuThapUrl(
	tenMien,
	docWeb,
	{ tranSitemap = TRAN_SITEMAP, tranUrl = TRAN_URL, locMoi = (u) => u, daDocSitemap = {}, now = Date.now() } = {},
) {
	const hang = [];
	const robots = await docWeb(`https://${tenMien}/robots.txt`);
	for (const m of robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)) if (cungTenMien(m[1], tenMien)) hang.push({ loc: m[1].trim(), lastmod: null });
	hang.push({ loc: `https://${tenMien}/sitemap.xml`, lastmod: null }, { loc: `https://${tenMien}/sitemap_index.xml`, lastmod: null });

	const daXem = new Set();
	const sitemapBo = [];
	/** url → mục (giữ lần gặp đầu; Map giữ thứ tự gặp cho các mục hoà nhau). */
	const trang = new Map();
	/** sitemap con đã đọc → { lastmod, urls: string[] } (urls = phần MỚI nó đóng góp). */
	const daDocLuot = new Map();
	let daDoc = 0;
	let soSitemapBoQua = 0;
	// Dừng ĐỌC thêm sitemap khi đã đủ tranUrl: sitemap con được đi mới → cũ nên phần đã gom
	// là phần mới nhất. Trong MỘT sitemap thì đọc hết (không cắt giữa chừng) rồi mới xếp.
	while (hang.length && daDoc < tranSitemap && trang.size < tranUrl) {
		const { loc: sm, lastmod: lmSm } = hang.shift();
		if (daXem.has(sm) || /\.gz($|\?)/i.test(sm)) continue;
		daXem.add(sm);
		const xml = await docWeb(sm);
		daDoc++;
		if (!xml) continue;
		if (laSitemapIndex(xml)) {
			// Chen sitemap con lên ĐẦU hàng, mới nhất trước.
			const con = [];
			for (const m of moiTruoc(layMuc(xml))) {
				if (!cungTenMien(m.loc, tenMien) || daXem.has(m.loc)) continue;
				if (phanLoaiSitemap(m.loc) === "bo") {
					daXem.add(m.loc);
					sitemapBo.push(m.loc);
				} else if (boQuaViDaDoc(daDocSitemap[m.loc], m.lastmod, now)) {
					daXem.add(m.loc);
					soSitemapBoQua++;
				} else con.push(m);
			}
			hang.unshift(...con);
		} else {
			const muc = layMuc(xml).filter((m) => laUrlNoiDung(m.loc, tenMien));
			// Một lượt hỏi kho cho cả sitemap. URL đã có trong kho KHÔNG được tính vào trần.
			const moi = new Set(await locMoi(muc.map((m) => m.loc)));
			const gop = [];
			for (const m of muc) {
				if (!moi.has(m.loc)) continue;
				gop.push(m.loc);
				if (!trang.has(m.loc)) trang.set(m.loc, m);
			}
			daDocLuot.set(sm, { lastmod: lmSm, urls: gop, biCat: !sitemapDayDu(xml) });
		}
	}
	const ds = moiTruoc([...trang.values()]).slice(0, tranUrl);
	const giuLai = new Set(ds.map((m) => m.loc));
	const daDocXong = [];
	const conSot = [];
	for (const [loc, { lastmod, urls, biCat }] of daDocLuot) {
		// Đọc xong = thân về ĐỦ (có thẻ đóng) VÀ mọi URL MỚI của nó đều qua được lát cắt. Thiếu một
		// trong hai thì để sitemap đó NGOÀI sổ, ca sau đọc lại và phần đã ghi sẽ bị `daCoUrl` lọc
		// đi — không mất URL nào. Hai nguyên nhân khác nhau (trần byte · lát cắt tranUrl) nhưng hậu
		// quả giống hệt: phần đuôi chưa về.
		if (!biCat && urls.every((u) => giuLai.has(u))) daDocXong.push({ loc, lastmod, soUrl: urls.length });
		else conSot.push(loc);
	}
	return { urls: ds.map((m) => m.loc), sitemapBo, daDoc: daDocXong, conSot, soSitemapBoQua };
}

/**
 * Sitemap con đã đọc xong lần trước thì bỏ qua lần này không? `lastmod` của index mới hơn mốc
 * đã ghi nghĩa là nó có bài mới → phải đọc lại. Index KHÔNG khai lastmod thì không có cách nào
 * biết, nên đọc lại theo chu kỳ HAN_DOC_LAI_MS.
 */
function boQuaViDaDoc(so, lastmodIndex, now) {
	if (!so) return false;
	if (lastmodIndex != null && so.lastmod != null) return lastmodIndex <= so.lastmod;
	return now - (so.luc ?? 0) < HAN_DOC_LAI_MS;
}
