// Máy đo CẤU TRÚC một trang trong SERP (thuần). Máy chủ đo, không để mô hình tự khai: số đo
// là căn cứ của bản đồ sơ hở (ban-do.mjs) — "trang này trả lời muộn / không có nguồn" phải
// là sự thật đếm được, không phải cảm nhận.
//
// Cố ý KHÔNG có điểm nào thưởng độ dài. `soChu` được ghi để người đọc biết bối cảnh, nhưng
// ban-do.mjs không dùng nó cho đề xuất nào: người dùng chốt trang đứng #1 là trang ít sơ hở
// nhất, không phải trang dài nhất.
import { boDau, chuanHoaManh } from "../luat/chuan-hoa.mjs";
import { htmlSangChu, boKhoi, boChuThich, thuocTinh, meta, reTheMo, timTiep, thuongGiuDo } from "../radar/trang.mjs";

/** Chữ của một mảnh HTML (dùng chung bộ bóc thẻ + giải mã thực thể của radar). */
const chuCua = (frag) => htmlSangChu(`<body>${frag}</body>`).than.replace(/\s+([,.;:!?)\]])/g, "$1");

/** Đếm chữ: token có ít nhất một chữ cái/chữ số — dấu câu lẻ không tính. */
const demChu = (s) => (s ? s.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0);

/** Một khối không bao giờ dài hơn chừng này ký tự khi đo (đoạn văn thật ngắn hơn nhiều). */
const TRAN_KHOI = 20_000;

/**
 * Các khối <p>/<li>/<hN> theo thứ tự, quét TUYẾN TÍNH. Khối kết thúc ở thẻ đóng kế tiếp, hoặc
 * ở thẻ MỞ cùng họ kế tiếp nếu nó đến trước (HTML thật hay bỏ </p>, </li> — trình duyệt tự
 * đóng), hoặc ở TRAN_KHOI. Biểu thức cũ `<(p|li)[^>]*>([\s\S]*?)<\/\1>` quét tới cuối trang
 * từ mỗi thẻ mở không đóng: 20k `<p>` mất 2 s.
 * @returns {{a: number, trong: string}[]}  a = vị trí thẻ mở
 */
function quetKhoi(html, reMo, reDong) {
	const mo = [...html.matchAll(reMo)];
	const dong = [...html.matchAll(reDong)].map((m) => m.index);
	const ra = [];
	let j = 0;
	for (let i = 0; i < mo.length; i++) {
		const a = mo[i].index, b = a + mo[i][0].length;
		while (j < dong.length && dong[j] < b) j++;
		let het = j < dong.length ? dong[j] : html.length;
		if (i + 1 < mo.length && mo[i + 1].index < het) het = mo[i + 1].index;
		ra.push({ a, trong: html.slice(b, Math.min(het, b + TRAN_KHOI)) });
	}
	return ra;
}

/** Trần cho JSON-LD: trang thật có khối vài KB; khối khổng lồ/lồng sâu là rác hoặc cố ý phá. */
const TRAN_JSONLD_KY_TU = 200_000;
const TRAN_JSONLD_SAU = 32;
const TRAN_JSONLD_NUT = 5_000;

/** Mọi khối JSON-LD đọc được; khối hỏng / quá 200 KB thì bỏ qua. Không bao giờ ném. */
function docJsonLd(html) {
	const ra = [];
	const thap = thuongGiuDo(html);
	const dong = timTiep(thap, "</script");
	const re = reTheMo("script");
	let m;
	while ((m = re.exec(html))) {
		const tu = m.index + m[0].length;
		const d = dong(tu);
		if (d === -1) break;
		re.lastIndex = d;
		if (!/application\/ld\+json/i.test(thuocTinh(m[0], "type") ?? "")) continue;
		if (d - tu > TRAN_JSONLD_KY_TU) continue;
		const tho = html
			.slice(tu, d)
			.trim()
			.replace(/^(?:\/\*\s*)?<!\[CDATA\[(?:\s*\*\/)?/, "")
			.replace(/(?:\/\*\s*)?\]\]>(?:\s*\*\/)?$/, "")
			.replace(/^<!--/, "")
			.replace(/-->$/, "");
		try {
			ra.push(JSON.parse(tho));
		} catch {
			/* bỏ khối hỏng (trang thật hay có JSON sai cú pháp) */
		}
	}
	return ra;
}

/**
 * Duyệt mọi đối tượng lồng nhau trong JSON-LD (@graph, mainEntity, author…), KHÔNG đệ quy:
 * sâu ≤ 32 tầng, tổng ≤ 5.000 nút. Bản đệ quy cũ tràn ngăn xếp với khối lồng 20.000 tầng.
 * Thứ tự: tiền thứ tự như bản cũ (đối tượng cha trước con, anh trước em).
 */
function duyet(goc, f) {
	const ngan = [[goc, 0]];
	let nut = 0;
	while (ngan.length && nut < TRAN_JSONLD_NUT) {
		const [x, sau] = ngan.pop();
		if (!x || typeof x !== "object") continue;
		nut++;
		if (!Array.isArray(x)) f(x);
		if (sau >= TRAN_JSONLD_SAU) continue;
		const con = Array.isArray(x) ? x : Object.values(x);
		for (let i = con.length - 1; i >= 0; i--) if (con[i] && typeof con[i] === "object") ngan.push([con[i], sau + 1]);
	}
}

const tenMien = (u) => {
	try {
		return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
	} catch {
		return "";
	}
};

/** Phần <body> (không có thì cả trang trừ <head>) — bằng indexOf, không biểu thức tham lam. */
function layBody(h) {
	const thap = thuongGiuDo(h);
	const mo = reTheMo("body").exec(h);
	if (mo) {
		const tu = mo.index + mo[0].length;
		const d = thap.lastIndexOf("</body");
		return d >= tu ? h.slice(tu, d) : h.slice(tu);
	}
	const a = thap.indexOf("<head");
	const b = a === -1 ? -1 : thap.indexOf("</head", a);
	return b === -1 ? h : `${h.slice(0, a)} ${h.slice(thap.indexOf(">", b) + 1 || h.length)}`;
}

const KET_QUA_RONG = Object.freeze({
	tieuDe: "", moTa: "", soChu: 0, viTriTraLoi: null, soH2: 0, soH3: 0, coBang: false, soDanhSach: 0, soHinh: 0,
	coFaq: false, loaiJsonLd: [], ngayCapNhat: null, coTacGia: false, soNguonNgoai: 0, chu: "",
});

/**
 * Không bao giờ ném: trang là dữ liệu của người khác; một trang hỏng không được làm hỏng cả
 * lượt nộp SERP. Lỗi bất ngờ → số đo rỗng.
 * @param {string} html
 * @param {{tuKhoa: string, url: string}} p
 */
export function doTrang(html, p = {}) {
	try {
		return doTrangTho(String(typeof html === "string" ? html : (html ?? "")), p ?? {});
	} catch {
		return { ...KET_QUA_RONG, loaiJsonLd: [] };
	}
}

/**
 * Khối <article> đầu tiên (không có thì <main>), đếm lồng nhau tuyến tính.
 * @returns {{a: number, b: number, c: number, d: number} | null}  a=thẻ mở, b..c=bên trong, d=sau thẻ đóng
 */
function vungBai(html) {
	for (const ten of ["article", "main"]) {
		const re = new RegExp(`<(\\/?)${ten}\\b[^<>]{0,2000}>`, "gi");
		let m, sau = 0, a = -1, b = -1;
		while ((m = re.exec(html))) {
			if (!m[1]) {
				if (sau++ === 0 && a === -1) [a, b] = [m.index, m.index + m[0].length];
			} else if (sau > 0 && --sau === 0) return { a, b, c: m.index, d: m.index + m[0].length };
		}
		if (a !== -1) return { a, b, c: html.length, d: html.length };
	}
	return null;
}

const NGOAI_BAI = ["nav", "header", "footer", "aside"];
/** Trong bài vẫn bỏ mục lục/khung bên; <header>/<footer> của BÀI thường là dòng ký tên, nguồn. */
const TRONG_BAI = ["nav", "aside"];

/**
 * Dòng ký tên phải có HÌNH NHÃN: nhãn đứng ĐẦU dòng/khối, theo sau là ":" hoặc "–"/"-", rồi
 * một TÊN. Bản trước chỉ cần cụm chữ, nên "Cần tham vấn y khoa nếu đau", "đội ngũ cố vấn
 * chuyên môn giàu kinh nghiệm" và khung chân trang "Tổng biên tập: …" (mọi báo/trang sức khoẻ
 * Việt đều có) đều thành "có tác giả". So nhãn trên chữ bỏ dấu, tên trên chữ gốc (cần chữ hoa).
 */
const NHAN_KY_TEN =
	/^(?:tac gia|nguoi viet|nguoi duyet|bien tap(?: vien)?|(?:tham|co|tu) van (?:y khoa|chuyen mon|y hoc))\s*([:：\-–—])/;
/** "Bài viết được tham vấn y khoa bởi BS. …" — dạng câu ký tên phổ biến, vẫn phải có TÊN theo sau. */
const CAU_KY_TEN_BOI = /^(?:bai viet )?(?:duoc )?(?:tham|co|tu) van (?:y khoa|chuyen mon|y hoc) boi\s/;
/** Khung chân trang của báo (masthead) — không phải người viết bài. */
const MASTHEAD = /^(?:pho )?tong bien tap|^giay phep|^chiu trach nhiem noi dung/;
/** Danh xưng nghề đứng đầu tên (có khi viết thường). Cờ i nên KHÔNG đặt \p{Lu} ở đây: với i nó khớp cả chữ thường. */
const DAU_TEN = /^(?:(?:bs|ths|ts|pgs|gs|ck[12i]*)\.|lương y|y s[ĩỹ]|dược s[ĩỹ]|bác s[ĩỹ])/iu;
const laTen = (s) => /^\p{Lu}/u.test(s) || DAU_TEN.test(s);
/** Thẻ nội dòng nối liền chữ ("<strong>Tác giả:</strong> Lê C"); thẻ khác là ranh giới dòng. */
const THE_NOI_DONG = /<\/?(?:strong|b|em|i|u|span|a|small|font|abbr|time|mark|cite)\b[^<>]{0,2000}>/gi;

/** Có dòng ký tên trong mảnh HTML (đã bỏ script/style/chú thích). Quét tuyến tính. */
function coDongKyTen(frag) {
	const dong = frag.replace(THE_NOI_DONG, " ").replace(/<[^<>]{0,2000}>/g, "\n").split("\n");
	for (const tho of dong) {
		const goc = tho.replace(/&nbsp;|&#160;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 300);
		if (goc.length < 4) continue;
		const bd = boDau(goc);
		if (MASTHEAD.test(bd)) continue;
		const m = bd.match(NHAN_KY_TEN);
		if (m) {
			// Nhãn không chứa dấu tách nên lần đầu gặp dấu đó trong chữ gốc chính là sau nhãn.
			const sau = goc.slice(goc.indexOf(m[1]) + 1).trim();
			if (laTen(sau)) return true;
			continue;
		}
		const b = bd.match(CAU_KY_TEN_BOI);
		if (b) {
			const i = boDau(goc).indexOf(" boi ");
			if (i !== -1 && laTen(goc.slice(i + 5).trim())) return true;
		}
	}
	return false;
}

const TAC_GIA_CHUNG = new Set(["admin", "administrator", "editor", "quan tri", "quan tri vien", "webmaster", "author", "user"]);

/** Tên tác giả thật, không phải tài khoản chung hay chính tên site. */
function tenTacGiaThat(ten, { tenSite, mien }) {
	const k = chuanHoaManh(ten);
	if (!k || TAC_GIA_CHUNG.has(k)) return false;
	if (tenSite && k === chuanHoaManh(tenSite)) return false;
	const goc = mien.split(".")[0];
	const kLien = k.replace(/ /g, "");
	return !(goc && (kLien === goc || kLien === mien.replace(/\./g, "")));
}

/** Tên tác giả trong JSON-LD: chuỗi, đối tượng {name} hay mảng các thứ đó. */
const tenTacGiaJson = (a) => [].concat(a ?? []).map((x) => (typeof x === "string" ? x : typeof x?.name === "string" ? x.name : ""));

/** Nút chia sẻ và trang mạng xã hội — không phải nguồn dẫn. */
const MIEN_XA_HOI = [
	"facebook.com", "fb.com", "fb.me", "twitter.com", "x.com", "zalo.me", "zalo.vn", "pinterest.com", "linkedin.com",
	"t.me", "telegram.me", "addtoany.com", "sharethis.com", "instagram.com", "tiktok.com", "reddit.com", "api.whatsapp.com",
];
const thuocMien = (host, mien) => host === mien || host.endsWith(`.${mien}`);
const laXaHoi = (u) => {
	const h = u.hostname.toLowerCase();
	if (MIEN_XA_HOI.some((m) => thuocMien(h, m)) || /(^|\.)pinterest\.[a-z.]+$/.test(h)) return true;
	// YouTube: video (/watch, /embed, /shorts, youtu.be) có thể là nguồn; kênh/nút chia sẻ thì không.
	if (thuocMien(h, "youtube.com")) return !/^\/(watch|embed|shorts)\b/.test(u.pathname);
	return false;
};

/** Hậu tố cấp hai hay gặp: miền đăng ký là 3 nhãn cuối (hs.com.vn, bbc.co.uk). */
const SLD = new Set(["com", "net", "org", "edu", "gov", "ac", "co", "info", "health", "int", "biz", "name", "pro", "or", "ne", "go"]);
function mienDangKy(host) {
	const n = String(host ?? "").toLowerCase().split(".").filter(Boolean);
	if (n.length <= 2) return n.join(".");
	const k = n.length >= 3 && n.at(-1).length === 2 && SLD.has(n.at(-2)) ? 3 : 2;
	return n.slice(-k).join(".");
}

/** Chuỗi ngày "d/m/yyyy" (hay - .) → "yyyy-mm-dd"; ngày không có thật → null. */
function ngayVn(d, m, y) {
	const [dd, mm, yy] = [Number(d), Number(m), Number(y)];
	const t = new Date(Date.UTC(yy, mm - 1, dd));
	if (t.getUTCFullYear() !== yy || t.getUTCMonth() !== mm - 1 || t.getUTCDate() !== dd) return null;
	return t.toISOString().slice(0, 10);
}
const RE_NGAY = /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/;

/** Ngày cập nhật trong vùng bài: <time datetime>, <time>dd/mm/yyyy</time>, rồi "Cập nhật: dd/mm/yyyy". */
function ngayTrongBai(baiHtml) {
	const re = reTheMo("time");
	const m = re.exec(baiHtml);
	if (m) {
		const dt = thuocTinh(m[0], "datetime");
		if (dt) return dt;
		const sau = baiHtml.slice(re.lastIndex, re.lastIndex + 200).match(RE_NGAY);
		const n = sau && ngayVn(sau[1], sau[2], sau[3]);
		if (n) return n;
	}
	const chu = boDau(chuCua(baiHtml));
	const c = chu.match(/cap nhat[^0-9]{0,30}?(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
	return c ? ngayVn(c[1], c[2], c[3]) : null;
}

/** Khối chỉ là link (mục lục): bỏ chữ trong <a>…</a> thì không còn chữ cái nào. */
function chiLaLink(trong) {
	if (!/<a\b/i.test(trong)) return false;
	return !/\p{L}/u.test(chuCua(trong.replace(/<a\b[^<>]{0,2000}>[^<]{0,2000}<\/a\s*>/gi, " ")));
}

/** Chữ không mang nội dung trả lời: đuôi câu hỏi và hư từ ("… : là gì", "… : ở đâu"). */
const TU_RONG = new Set(["la", "gi", "o", "dau", "nao", "the", "sao", "nhu", "bao", "nhieu", "co", "khong", "va", "cua", "cac", "nhung", "ve", "cho", "voi", "trong", "khi"]);

/**
 * Đoạn chỉ nhắc lại câu hỏi: kết thúc bằng "?" mà ≤ 12 chữ, hoặc < 12 chữ mà ngoài từ khoá chỉ
 * thêm ≤ 2 chữ ("Huyệt Thần Môn là gì", "Tìm hiểu huyệt Thần Môn"). Không cắt ở "< 12 chữ" trần:
 * câu trả lời ngắn thật như "Thần Môn ở cổ tay" (thêm 3) vẫn phải được tính. Hai ngoại lệ:
 * - "Từ khoá: cụm ngắn" là câu TRẢ LỜI khi sau dấu hai chấm có ≥ 1 chữ nội dung ("Huyệt Thần
 *   Môn: cổ tay"), dù chỉ thêm 2 chữ.
 * - Câu trả lời dài kết bằng câu hỏi tu từ ("…nằm ở cổ tay, bạn đã biết chưa?") không phải
 *   nhắc lại — chỉ đoạn "?" ngắn (≤ 12 chữ) mới là.
 */
function nhacLaiCauHoi(chu, tuTk) {
	const tu = chuanHoaManh(chu).split(" ").filter(Boolean);
	if (/\?\s*$/.test(chu)) {
		if (tu.length <= 12) return true;
	} else {
		const hc = chu.search(/[:：]/);
		if (hc > 0) {
			const sau = chuanHoaManh(chu.slice(hc + 1)).split(" ").filter(Boolean);
			if (sau.some((w) => !tuTk.includes(w) && !TU_RONG.has(w))) return false;
		}
	}
	return tu.length < 12 && tu.filter((w) => !tuTk.includes(w)).length <= 2;
}

function doTrangTho(h, { tuKhoa = "", url = "" }) {
	const { tieuDe } = htmlSangChu(h);
	const moTaTho = meta(h, "name", "description") ?? meta(h, "property", "og:description") ?? "";
	const moTa = chuCua(moTaTho);

	// Thân: bỏ khối không phải nội dung. <header>/<footer> chỉ bỏ khi nằm NGOÀI <article>/<main>
	// — trong bài chúng thường là dòng ký tên và phần nguồn tham khảo.
	const bodyHtml = boChuThich(boKhoi(layBody(h), ["script", "style", "noscript", "svg", "template"]));
	const vung = vungBai(bodyHtml);
	const thanHtml = vung
		? [boKhoi(bodyHtml.slice(0, vung.a), NGOAI_BAI), boKhoi(bodyHtml.slice(vung.a, vung.d), TRONG_BAI), boKhoi(bodyHtml.slice(vung.d), NGOAI_BAI)].join(" ")
		: boKhoi(bodyHtml, NGOAI_BAI);
	/** Vùng bài: nguồn ngoài và ngày chỉ tính ở đây (khung bên, bài liên quan có link và ngày của bài KHÁC). */
	const baiHtml = vung ? boKhoi(bodyHtml.slice(vung.b, vung.c), TRONG_BAI) : thanHtml;
	const chu = chuCua(thanHtml);

	// Vị trí câu trả lời: số chữ đứng trước đoạn <p>/<li> đầu tiên chứa ≥ 60% từ của từ khoá,
	// trừ mục lục và đoạn chỉ nhắc lại câu hỏi. So bỏ dấu vì trang thật hay viết "than mon";
	// từ 1 ký tự bỏ đi vì không mang nghĩa.
	const tuTk = [...new Set(chuanHoaManh(tuKhoa).split(" ").filter((w) => w.length >= 2))];
	let viTriTraLoi = null;
	if (tuTk.length) {
		// Xét tối đa 2.000 khối: câu trả lời đứng sau chừng ấy đoạn thì coi như không có ở đầu bài,
		// và trang 20k đoạn "nhắc lại câu hỏi" không được kéo ca đo đi hàng giây.
		for (const k of quetKhoi(thanHtml, /<(?:p|li)\b[^<>]{0,2000}>/gi, /<\/(?:p|li)\s*>/gi).slice(0, 2000)) {
			const chuKhoi = chuCua(k.trong);
			const tu = new Set(chuanHoaManh(chuKhoi).split(" "));
			const trung = tuTk.filter((w) => tu.has(w)).length;
			if (trung / tuTk.length < 0.6 || chiLaLink(k.trong) || nhacLaiCauHoi(chuKhoi, tuTk)) continue;
			viTriTraLoi = demChu(chuCua(thanHtml.slice(0, k.a)));
			break;
		}
	}

	const mienMinh = tenMien(url);
	const tenSite = meta(h, "property", "og:site_name") ?? "";
	const jsonLd = docJsonLd(h);
	const loai = new Set();
	let dateModified = null;
	let jsonCoTacGia = false;
	for (const k of jsonLd)
		duyet(k, (o) => {
			for (const t of [].concat(o["@type"] ?? [])) if (typeof t === "string" && t) loai.add(t);
			if (!dateModified && typeof o.dateModified === "string" && o.dateModified) dateModified = o.dateModified;
			if (tenTacGiaJson(o.author).some((t) => tenTacGiaThat(t, { tenSite, mien: mienMinh }))) jsonCoTacGia = true;
		});
	const loaiJsonLd = [...loai];

	const tieuDeMuc = quetKhoi(thanHtml, /<h[1-6]\b[^<>]{0,2000}>/gi, /<\/h[1-6]\s*>/gi).map((k) => boDau(chuCua(k.trong)));
	const coFaq = loai.has("FAQPage") || tieuDeMuc.some((t) => t.includes("cau hoi thuong gap") || /\bfaq\b/.test(t));

	const ngayCapNhat = meta(h, "property", "article:modified_time") || dateModified || ngayTrongBai(baiHtml) || null;

	// Ký tên: có <article>/<main> thì chỉ soi TRONG đó (gồm <header>/<footer> của bài — dòng
	// ký tên hay nằm ở đó); không có thì cả thân trừ header/footer/nav của SITE (masthead).
	const vungKyTen = vung ? bodyHtml.slice(vung.a, vung.d) : boKhoi(bodyHtml, ["header", "footer", "nav"]);
	const tacGiaMeta = meta(h, "name", "author");
	const coTacGia =
		(!!tacGiaMeta && tenTacGiaThat(tacGiaMeta, { tenSite, mien: mienMinh })) || jsonCoTacGia || coDongKyTen(vungKyTen);

	// Nguồn ngoài: link tuyệt đối trong BÀI tới miền khác — không tính miền con của chính site,
	// mạng xã hội/nút chia sẻ, link tài trợ. Cùng một đích nhắc lại chỉ tính một lần.
	const goc = mienDangKy(mienMinh);
	const dich = new Set();
	for (const m of baiHtml.matchAll(reTheMo("a"))) {
		const href = thuocTinh(m[0], "href");
		if (!href || !/^https?:\/\//i.test(href)) continue;
		if (/\bsponsored\b/i.test(thuocTinh(m[0], "rel") ?? "")) continue;
		let u;
		try {
			u = new URL(href);
		} catch {
			continue;
		}
		const mien = u.hostname.toLowerCase().replace(/^www\./, "");
		if (!mien || mien === mienMinh || (goc && mienDangKy(mien) === goc) || laXaHoi(u)) continue;
		dich.add(href);
	}

	return {
		tieuDe,
		moTa,
		soChu: demChu(chu),
		viTriTraLoi,
		soH2: (thanHtml.match(/<h2\b/gi) || []).length,
		soH3: (thanHtml.match(/<h3\b/gi) || []).length,
		coBang: /<table\b/i.test(thanHtml),
		soDanhSach: (thanHtml.match(/<(ul|ol)\b/gi) || []).length,
		soHinh: (thanHtml.match(/<img\b/gi) || []).length,
		coFaq,
		loaiJsonLd,
		ngayCapNhat: ngayCapNhat || null,
		coTacGia,
		soNguonNgoai: dich.size,
		chu,
	};
}
