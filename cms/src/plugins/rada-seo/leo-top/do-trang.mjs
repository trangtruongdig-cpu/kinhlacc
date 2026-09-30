// Máy đo CẤU TRÚC một trang trong SERP (thuần). Máy chủ đo, không để mô hình tự khai: số đo
// là căn cứ của bản đồ sơ hở (ban-do.mjs) — "trang này trả lời muộn / không có nguồn" phải
// là sự thật đếm được, không phải cảm nhận.
//
// Cố ý KHÔNG có điểm nào thưởng độ dài. `soChu` được ghi để người đọc biết bối cảnh, nhưng
// ban-do.mjs không dùng nó cho đề xuất nào: người dùng chốt trang đứng #1 là trang ít sơ hở
// nhất, không phải trang dài nhất.
import { boDau, chuanHoaManh } from "../luat/chuan-hoa.mjs";
import { htmlSangChu } from "../radar/trang.mjs";

/** Chữ của một mảnh HTML (dùng chung bộ bóc thẻ + giải mã thực thể của radar). */
const chuCua = (frag) => htmlSangChu(`<body>${frag}</body>`).than.replace(/\s+([,.;:!?)\]])/g, "$1");

/** Đếm chữ: token có ít nhất một chữ cái/chữ số — dấu câu lẻ không tính. */
const demChu = (s) => (s ? s.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0);

/** Đọc thuộc tính của một thẻ bất kể thứ tự ("content" trước "name" vẫn gặp ở trang thật). */
function thuocTinh(the, ten) {
	const m = the.match(new RegExp(`\\s${ten}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
	return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
}

/** Nội dung của thẻ <meta> đầu tiên có `khoa`=`giaTri` (khoa: name | property). */
function meta(html, khoa, giaTri) {
	for (const the of html.match(/<meta\b[^>]*>/gi) || []) {
		const v = thuocTinh(the, khoa);
		if (v && v.toLowerCase() === giaTri) return thuocTinh(the, "content");
	}
	return null;
}

/** Mọi khối JSON-LD đọc được; khối hỏng thì bỏ qua (trang thật hay có JSON sai cú pháp). */
function docJsonLd(html) {
	const ra = [];
	const re = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
	for (const m of html.matchAll(re)) {
		try {
			ra.push(JSON.parse(m[1]));
		} catch {
			/* bỏ khối hỏng */
		}
	}
	return ra;
}

/** Duyệt mọi đối tượng lồng nhau trong JSON-LD (@graph, mainEntity, author…). */
function duyet(x, f) {
	if (Array.isArray(x)) for (const y of x) duyet(y, f);
	else if (x && typeof x === "object") {
		f(x);
		for (const v of Object.values(x)) duyet(v, f);
	}
}

const tenMien = (u) => {
	try {
		return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
	} catch {
		return "";
	}
};

/**
 * @param {string} html
 * @param {{tuKhoa: string, url: string}} p
 */
export function doTrang(html, { tuKhoa, url }) {
	const h = String(html ?? "");
	const { tieuDe } = htmlSangChu(h);
	const moTaTho = meta(h, "name", "description") ?? meta(h, "property", "og:description") ?? "";
	const moTa = chuCua(moTaTho);

	// Thân bài: phần <body> (không có thì cả trang trừ <head>), bỏ khối không phải nội dung.
	const body = h.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? h.match(/<body\b[^>]*>([\s\S]*)$/i)?.[1] ?? h.replace(/<head\b[\s\S]*?<\/head>/i, " ");
	const thanHtml = body
		.replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
		.replace(/<!--[\s\S]*?-->/g, " ")
		.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, " ");
	const chu = chuCua(thanHtml);

	// Vị trí câu trả lời: số chữ đứng trước đoạn <p>/<li> đầu tiên chứa ≥ 60% từ của từ khoá.
	// So bỏ dấu vì trang thật hay viết "than mon"; từ 1 ký tự bỏ đi vì không mang nghĩa.
	const tuTk = [...new Set(chuanHoaManh(tuKhoa).split(" ").filter((w) => w.length >= 2))];
	let viTriTraLoi = null;
	if (tuTk.length) {
		for (const m of thanHtml.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
			const tu = new Set(chuanHoaManh(chuCua(m[2])).split(" "));
			const trung = tuTk.filter((w) => tu.has(w)).length;
			if (trung / tuTk.length >= 0.6) {
				viTriTraLoi = demChu(chuCua(thanHtml.slice(0, m.index)));
				break;
			}
		}
	}

	const jsonLd = docJsonLd(h);
	const loai = new Set();
	let dateModified = null;
	let jsonCoTacGia = false;
	for (const k of jsonLd)
		duyet(k, (o) => {
			for (const t of [].concat(o["@type"] ?? [])) if (typeof t === "string" && t) loai.add(t);
			if (!dateModified && typeof o.dateModified === "string" && o.dateModified) dateModified = o.dateModified;
			if (o.author) jsonCoTacGia = true;
		});
	const loaiJsonLd = [...loai];

	const tieuDeMuc = [...thanHtml.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map((m) => boDau(chuCua(m[1])));
	const coFaq = loai.has("FAQPage") || tieuDeMuc.some((t) => t.includes("cau hoi thuong gap") || /\bfaq\b/.test(t));

	const timeDau = h.match(/<time\b[^>]*>/i)?.[0];
	const ngayCapNhat = meta(h, "property", "article:modified_time") || dateModified || (timeDau && thuocTinh(timeDau, "datetime")) || null;

	const chuBoDau = boDau(chu);
	const coTacGia =
		!!meta(h, "name", "author") || jsonCoTacGia || /\b(tac gia|tham van|nguoi duyet)\b/.test(chuBoDau);

	// Nguồn ngoài: link tuyệt đối trong THÂN BÀI tới miền khác (www. coi như cùng miền);
	// cùng một đích nhắc lại chỉ tính một lần.
	const mienMinh = tenMien(url);
	const dich = new Set();
	for (const m of thanHtml.matchAll(/<a\b[^>]*>/gi)) {
		const href = thuocTinh(m[0], "href");
		if (!href || !/^https?:\/\//i.test(href)) continue;
		const mien = tenMien(href);
		if (mien && mien !== mienMinh) dich.add(href);
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
