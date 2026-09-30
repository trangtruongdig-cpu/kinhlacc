// Rào Portable Text cho lò viết (rà soát 2C-3 C2).
//
// `markdownToPortableText` của EmDash coi dòng `<!--ec:block {json} -->` là khối "opaque" và
// JSON.parse NGUYÊN VĂN vào Portable Text. Đã đo qua đúng chuỗi chuanHoaMd → bộ chuyển: Claude (hay
// chữ tiêm vào nó) chèn được link `javascript:`, khối ảnh trỏ ra ngoài site, và chữ viết bằng escape
// JSON (`chữa`) mà soát markdown thô không thấy. Ba lớp:
//   1. timHtmlTho — từ chối mọi dòng có "<!--" hay thẻ HTML thô TRƯỚC khi chuyển;
//   2. kiemPtAnToan — PT CUỐI CÙNG (sau khi soát link) phải nằm trong danh sách trắng;
//   3. chuTuPt — mọi rào chữ (phạm vi Y sỹ…) chạy trên chữ rút từ PT cuối, tức thứ thật sự được lưu.
// Hàm thuần, không import bộ chuyển.

const STYLE = new Set(["normal", "h2", "h3", "h4", "blockquote"]);
const LIST = new Set(["bullet", "number"]);
/** Định dạng bộ chuyển sinh ra ("strike-through") + tên chuẩn Portable Text ("strike"). */
const DINH_DANG = new Set(["strong", "em", "code", "strike-through", "strike"]);
const KHOA_KHOI = new Set(["_type", "_key", "style", "markDefs", "children", "listItem", "level"]);
const KHOA_SPAN = new Set(["_type", "_key", "text", "marks"]);
const KHOA_LINK = new Set(["_type", "_key", "href"]);
const TOI_DA_LOI = 20;

const laDoiTuong = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const cat = (s, n = 80) => {
	const t = String(s);
	return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/**
 * Dòng có "<!--" hoặc thẻ HTML thô ("<" + chữ cái hoặc "/"). `a < b`, `3<5` không tính.
 * @returns {{dong: number, chu: string}[]}  dong đếm từ 1
 */
export function timHtmlTho(md) {
	const ra = [];
	String(md ?? "")
		.split("\n")
		.forEach((d, i) => {
			if (d.includes("<!--") || /<[A-Za-z/]/.test(d)) ra.push({ dong: i + 1, chu: cat(d.trim()) });
		});
	return ra;
}

/**
 * Danh sách trắng: chỉ khối `block` (không ảnh, không code, không kiểu lạ); style normal/h2/h3/h4/
 * blockquote; listItem bullet/number; con chỉ `span` có text; mark là định dạng cho phép hoặc khoá
 * một markDef `link` của chính khối; link chỉ trỏ đường nội bộ "/…" (không "//", không "\").
 * @returns {string[]}  lỗi tiếng Việt; rỗng = đạt
 */
export function kiemPtAnToan(pt) {
	if (!Array.isArray(pt)) return ["thân bài sau khi chuyển không phải danh sách khối"];
	const loi = [];
	const bao = (s) => loi.length < TOI_DA_LOI && loi.push(s);
	pt.forEach((b, i) => {
		const n = `khối ${i + 1}`;
		if (!laDoiTuong(b)) return bao(`${n}: không phải khối văn bản`);
		if (b._type !== "block")
			return bao(`${n}: kiểu "${cat(b._type)}" không được phép — thân bài chỉ gồm đoạn văn, tiêu đề ##/###/####, danh sách, trích dẫn (không ảnh, không khối mã, không HTML)`);
		for (const k of Object.keys(b)) if (!KHOA_KHOI.has(k)) bao(`${n}: trường lạ "${cat(k)}"`);
		if (!STYLE.has(b.style)) bao(`${n}: kiểu chữ "${cat(b.style)}" không được phép (chỉ đoạn thường, ##, ###, ####, trích dẫn)`);
		if (b.listItem !== undefined && !LIST.has(b.listItem)) bao(`${n}: kiểu danh sách "${cat(b.listItem)}" không được phép`);
		if (b.level !== undefined && !(Number.isInteger(b.level) && b.level >= 1 && b.level <= 4)) bao(`${n}: mức danh sách không hợp lệ`);
		const defs = new Set();
		if (!Array.isArray(b.markDefs)) bao(`${n}: thiếu markDefs`);
		else
			for (const d of b.markDefs) {
				if (!laDoiTuong(d) || d._type !== "link") {
					bao(`${n}: chú thích kiểu "${cat(d?._type)}" không được phép (chỉ link)`);
					continue;
				}
				for (const k of Object.keys(d)) if (!KHOA_LINK.has(k)) bao(`${n}: link có trường lạ "${cat(k)}"`);
				if (typeof d.href !== "string" || !/^\/(?![/\\])/.test(d.href) || /[\s\\]/.test(d.href))
					bao(`${n}: link "${cat(d.href)}" không được phép — chỉ link nội bộ dạng /duong/`);
				if (typeof d._key === "string") defs.add(d._key);
			}
		if (!Array.isArray(b.children) || !b.children.length) return bao(`${n}: không có chữ`);
		for (const c of b.children) {
			if (!laDoiTuong(c) || c._type !== "span") {
				bao(`${n}: phần tử con kiểu "${cat(c?._type)}" không được phép`);
				continue;
			}
			for (const k of Object.keys(c)) if (!KHOA_SPAN.has(k)) bao(`${n}: đoạn chữ có trường lạ "${cat(k)}"`);
			if (typeof c.text !== "string") bao(`${n}: đoạn chữ thiếu text`);
			if (!Array.isArray(c.marks)) bao(`${n}: đoạn chữ thiếu marks`);
			else for (const m of c.marks) if (!DINH_DANG.has(m) && !defs.has(m)) bao(`${n}: định dạng "${cat(m)}" không được phép`);
		}
	});
	return loi;
}

const chuKhoi = (b) => (Array.isArray(b?.children) ? b.children.map((c) => (typeof c?.text === "string" ? c.text : "")).join("") : "");

/** Chữ của PT: mỗi khối văn bản một dòng. Nguồn DUY NHẤT cho rào chữ trên thân bài. */
export function chuTuPt(pt) {
	return (Array.isArray(pt) ? pt : [])
		.filter((b) => b?._type === "block")
		.map(chuKhoi)
		.join("\n");
}

function spanSangMd(c, defs) {
	let t = String(c?.text ?? "");
	for (const m of c?.marks ?? []) {
		const d = defs.get(m);
		if (d) t = `[${t}](${d.href})`;
		else if (m === "strong") t = `**${t}**`;
		else if (m === "em") t = `_${t}_`;
		else if (m === "code") t = `\`${t}\``;
		else if (m === "strike-through" || m === "strike") t = `~~${t}~~`;
	}
	return t;
}

/** Markdown dựng lại từ PT cuối — cho chấm SEO/YMYL trên đúng thứ được lưu. */
export function ptSangMd(pt) {
	const dong = [];
	let truocLaDs = false;
	for (const b of Array.isArray(pt) ? pt : []) {
		if (b?._type !== "block") continue;
		const defs = new Map((b.markDefs ?? []).map((d) => [d._key, d]));
		const chu = (b.children ?? []).map((c) => spanSangMd(c, defs)).join("");
		const laDs = !!b.listItem;
		if (dong.length && !(laDs && truocLaDs)) dong.push("");
		if (laDs) dong.push(`${"  ".repeat(Math.max(0, (b.level ?? 1) - 1))}${b.listItem === "number" ? "1." : "-"} ${chu}`);
		else if (/^h[1-6]$/.test(b.style ?? "")) dong.push(`${"#".repeat(Number(b.style[1]))} ${chu}`);
		else if (b.style === "blockquote") dong.push(`> ${chu}`);
		else dong.push(chu);
		truocLaDs = laDs;
	}
	return dong.join("\n");
}
