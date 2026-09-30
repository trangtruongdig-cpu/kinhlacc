// Ảnh bìa cho bài lò viết: chọn TỪ THƯ VIỆN ẢNH CÓ SẴN của CMS, theo alt, bằng luật.
//
// Sự thật đã đo quyết định hình dạng module (xem .git/sdd/2c3/global.md mục 2):
// - `featured_image: "<mediaId>"` được CMS tự điền alt + storageKey → v1 CHỈ gắn ảnh bìa.
// - Thư viện ảnh do bốn script di cư nạp, alt có đúng bốn dạng (cms/scripts-di-cu/):
//     anh-huyet.mjs      "Huyệt <Tên>"
//     anh-huyet-3d.mjs   "Huyệt <MÃ> — vị trí trên da|lớp giải phẫu|các huyệt lân cận|trên đường kinh"
//     anh-duoc-lieu.mjs  "Vị thuốc <Tên>"
//     anh-kinh.mjs       "<cột> — <Tên kinh>"  (tên kinh nguyên văn meridians.js: "Kinh Thủ Thái âm Phế")
// - Chữ Việt khác dấu là khác mục ("Âm Khích" HT6 ≠ "Ẩm Khích"), như noi-bo/chi-muc.mjs: chữ
//   CÓ DẤU chỉ khớp có dấu; chữ không dấu chỉ khớp khi bản bỏ dấu trỏ về DUY NHẤT một tên.
// - Không khớp gì thì trả null: ảnh lạc đề tệ hơn không có ảnh — người duyệt tự chọn.
import { chuanHoaManh } from "../luat/chuan-hoa.mjs";
import { khoaCoDau, coDauViet, bienThe } from "../noi-bo/chi-muc.mjs";
import { slugKhongDau } from "../luat/slug.mjs";

/** Thứ tự ưu tiên ảnh 3D của một huyệt: nhìn thấy vị trí trên da là thứ người đọc cần nhất. */
const KIEU_3D = ["vị trí trên da", "trên đường kinh", "các huyệt lân cận", "lớp giải phẫu"];
/** Thứ tự cột ảnh kinh (anh-kinh.mjs CHUYEN): ảnh chính trước. */
const COT_KINH = ["anh_chinh", "anh_tong_quat", "anh_so_do", "anh_can", "anh_biet", "anh_doc", "anh_ngang"];
const TRAN_TRANG = 200;

const nfc = (s) => String(s ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
const soTu = (k) => (k ? k.split(" ").length : 0);

/**
 * Đọc một alt của thư viện. @returns {{loai:"huyet",ten}|{loai:"huyet3d",ma,kieu}|
 * {loai:"vi_thuoc",ten}|{loai:"kinh",cot,ten}|null}
 */
export function docAlt(alt) {
	const s = nfc(alt);
	if (!s) return null;
	let m = s.match(/^Huyệt (\S+) [—–-] (.+)$/u);
	if (m && KIEU_3D.includes(m[2].toLowerCase())) return { loai: "huyet3d", ma: m[1].toUpperCase(), kieu: m[2].toLowerCase() };
	m = s.match(/^(anh_[a-z_]+) [—–-] (.+)$/);
	if (m) return { loai: "kinh", cot: m[1], ten: m[2] };
	m = s.match(/^Huyệt (.+)$/u);
	if (m) return { loai: "huyet", ten: m[1] };
	m = s.match(/^Vị thuốc (.+)$/u);
	if (m) return { loai: "vi_thuoc", ten: m[1] };
	return null;
}

/**
 * Đọc thư viện ảnh qua `ctx.media.list` (trả {items, cursor, hasMore}), trang 100 mục, tới hết
 * hoặc tới `toiDa`. Lọc `image/` ở cả máy chủ (tiền tố LIKE) lẫn tại chỗ.
 * @returns {Promise<{id: string, alt: string, filename: string, mimeType: string}[]>}
 */
export async function napThuVienAnh(media, { toiDa = 5000 } = {}) {
	const ra = [];
	const daThay = new Set();
	let cursor, soTrang = 0;
	do {
		const r = await media.list({ limit: 100, cursor, mimeType: "image/" });
		for (const it of r?.items ?? []) {
			if (!String(it?.mimeType ?? "").startsWith("image/")) continue;
			ra.push({ id: String(it.id), alt: String(it.alt ?? ""), filename: String(it.filename ?? ""), mimeType: String(it.mimeType) });
			if (ra.length >= toiDa) return ra;
		}
		const tiep = r?.hasMore !== false && r?.cursor ? String(r.cursor) : undefined;
		// Cursor lặp lại = kho hỏng; dừng thay vì quay vòng.
		cursor = tiep && !daThay.has(tiep) && ++soTrang < TRAN_TRANG ? tiep : undefined;
		if (cursor) daThay.add(cursor);
	} while (cursor);
	return ra;
}

/** Bảng tên → mục, có chỉ mục phụ bỏ dấu (khoá bỏ dấu → tập khoá có dấu). */
function taoBang() {
	return { coDau: new Map(), boDau: new Map() };
}
function themVaoBang(bang, khoa, muc) {
	if (!khoa) return;
	if (!bang.coDau.has(khoa)) bang.coDau.set(khoa, muc);
	const k = chuanHoaManh(khoa);
	if (!bang.boDau.has(k)) bang.boDau.set(k, new Set());
	bang.boDau.get(k).add(khoa);
}

/** Tên gọi khác của kinh (≥ 2 từ): bỏ "kinh", bỏ "thủ/túc", và "kinh <tạng/phủ>". */
function khoaKinh(ten) {
	const ra = new Set();
	let tu = khoaCoDau(ten).split(" ").filter(Boolean);
	const bd = (i) => chuanHoaManh(tu.slice(0, i).join(" "));
	ra.add(tu.join(" "));
	if (bd(1) === "kinh") tu = tu.slice(1);
	ra.add(tu.join(" "));
	if (["thu", "tuc"].includes(bd(1))) tu = tu.slice(1);
	ra.add(tu.join(" "));
	if (/^(thai am|thai duong|thieu am|thieu duong|duong minh|quyet am)$/.test(bd(2)) && tu.length > 2)
		ra.add(`kinh ${tu.slice(2).join(" ")}`);
	return [...ra].filter((k) => soTu(k) >= 2);
}

const sapAnh = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Chỉ mục ảnh theo alt.
 * @param {{id, alt}[]} ds
 * @param {{maTheoTen?: Record<string,string>|Map<string,string>}} [tuyChon]  tên huyệt → mã
 *   (vd từ maTheoTenTuChiMuc) để tên huyệt tới được ảnh 3D (alt 3D chỉ mang mã).
 */
export function dungChiMucAnh(ds, { maTheoTen } = {}) {
	const huyet = taoBang(), viThuoc = taoBang(), kinh = taoBang();
	const huyet3d = new Map(); // MÃ → [{id, alt, kieu}]
	const ma = new Map(); // khoá tên có dấu → MÃ
	for (const [t, m] of maTheoTen instanceof Map ? maTheoTen : Object.entries(maTheoTen ?? {})) {
		const k = khoaCoDau(t);
		if (k && m) ma.set(k, String(m).toUpperCase());
	}
	for (const x of ds ?? []) {
		const a = docAlt(x?.alt);
		if (!a) continue;
		const anh = { id: String(x.id), alt: nfc(x.alt) };
		if (a.loai === "huyet3d") {
			if (!huyet3d.has(a.ma)) huyet3d.set(a.ma, []);
			huyet3d.get(a.ma).push({ ...anh, kieu: a.kieu });
			continue;
		}
		const khoa = khoaCoDau(a.ten);
		if (!khoa) continue;
		if (a.loai === "kinh") {
			let muc = kinh.coDau.get(khoa);
			if (!muc) {
				muc = { ten: nfc(a.ten), anh: {} };
				for (const k of khoaKinh(a.ten)) themVaoBang(kinh, k, muc);
			}
			(muc.anh[a.cot] ??= []).push(anh);
			continue;
		}
		const bang = a.loai === "huyet" ? huyet : viThuoc;
		let muc = bang.coDau.get(khoa);
		if (!muc) themVaoBang(bang, khoa, (muc = { ten: nfc(a.ten), anh: [] }));
		muc.anh.push(anh);
	}
	for (const b of [huyet, viThuoc]) for (const m of b.coDau.values()) m.anh.sort(sapAnh);
	for (const m of kinh.coDau.values()) for (const c of Object.values(m.anh)) c.sort(sapAnh);
	// Huyệt chỉ có ảnh 3D (alt mang mã): đưa tên vào bảng để tên trong chữ tới được ảnh 3D.
	for (const [t, m] of maTheoTen instanceof Map ? maTheoTen : Object.entries(maTheoTen ?? {})) {
		const k = khoaCoDau(t);
		if (k && huyet3d.has(String(m).toUpperCase()) && !huyet.coDau.has(k)) themVaoBang(huyet, k, { ten: nfc(t), anh: [] });
	}
	for (const v of huyet3d.values()) v.sort((p, q) => KIEU_3D.indexOf(p.kieu) - KIEU_3D.indexOf(q.kieu) || sapAnh(p, q));
	return { huyet, viThuoc, kinh, huyet3d, ma, loiNap: null };
}

/**
 * Bảng tên huyệt → mã từ chỉ mục nội bộ (noi-bo/chi-muc.mjs): mã huyệt nằm lẫn trong khoaKhac,
 * nhận ra theo dạng "sp6"/"cv4".
 */
export function maTheoTenTuChiMuc(chiMucNoiBo) {
	const ra = new Map();
	for (const m of chiMucNoiBo?.muc ?? []) {
		if (m.loai !== "huyet") continue;
		const ma = (m.khoaKhac ?? []).find((k) => /^[a-z]{1,3}\d{1,3}$/.test(k));
		if (ma) ra.set(m.ten, ma.toUpperCase());
	}
	return ra;
}

/**
 * Các mục của `bang` nêu trong `chu`, kèm vị trí. Chữ có dấu: khớp khoá có dấu trọn từ (tên ≥ 2
 * từ; tên 1 từ chỉ khi cả cụm — bỏ tiền tố — đúng bằng tên). Chữ không dấu: khớp khoá bỏ dấu và
 * chỉ nhận khi khoá đó trỏ về DUY NHẤT một tên.
 */
function timTen(bang, chu, { chanTruoc } = {}) {
	const coDau = coDauViet(chu);
	const q = ` ${coDau ? khoaCoDau(chu) : chuanHoaManh(chu)} `;
	const tronCum = new Set(bienThe(chu).map((b) => (coDau ? khoaCoDau(b) : chuanHoaManh(b))));
	const ra = [];
	const xet = (khoa, lay) => {
		if (!khoa) return;
		if (tronCum.has(khoa)) return void ra.push({ muc: lay(), vt: 0, dai: khoa.length });
		if (soTu(khoa) < 2) return;
		let vt = q.indexOf(` ${khoa} `);
		while (vt >= 0 && chanTruoc?.test(q.slice(0, vt + 1))) vt = q.indexOf(` ${khoa} `, vt + 1);
		if (vt >= 0) ra.push({ muc: lay(), vt, dai: khoa.length });
	};
	if (coDau) for (const [k, m] of bang.coDau) xet(k, () => m);
	else
		for (const [k, tap] of bang.boDau) {
			if (tap.size !== 1) continue;
			const [kd] = tap;
			xet(k, () => bang.coDau.get(kd));
		}
	// Sớm nhất trong câu; cùng chỗ thì tên dài hơn ("Thủ Tam Lý" thắng "Tam Lý").
	ra.sort((a, b) => a.vt - b.vt || b.dai - a.dai || (a.muc.ten < b.muc.ten ? -1 : 1));
	return ra;
}

/** Mã huyệt viết trong chữ ("(CV4)", "SP-6") có ảnh 3D. */
function timMa(chiMuc, chu) {
	const ra = [];
	for (const m of String(chu ?? "").matchAll(/(?<![\p{L}\p{N}])([A-Z]{1,3})-?(\d{1,3})(?![\p{L}\p{N}])/gu)) {
		const ma = `${m[1]}${m[2]}`;
		if (chiMuc.huyet3d.has(ma)) ra.push({ ma, vt: m.index });
	}
	return ra;
}

/** Ảnh tốt nhất của một mục huyệt: 2D trước, rồi 3D qua bảng mã. */
function anhHuyet(chiMuc, muc) {
	if (muc?.anh?.length) return { anh: muc.anh[0], them: "" };
	const ma = muc && chiMuc.ma.get(khoaCoDau(muc.ten));
	const a3 = ma && chiMuc.huyet3d.get(ma)?.[0];
	return a3 ? { anh: a3, them: ` (ảnh 3D: ${a3.kieu})` } : null;
}

const ketQua = (a, lyDo) => ({ mediaId: a.id, alt: a.alt, lyDo });

/** Tên của trụ cột: từ đối tượng {duong, ten}, hoặc mục cùng đường trong lienKetDich. */
function truCot(trangTruCot, lienKetDich) {
	const duong = typeof trangTruCot === "string" ? trangTruCot : trangTruCot?.duong;
	let ten = typeof trangTruCot === "object" ? trangTruCot?.ten : undefined;
	if (!ten && duong) ten = (lienKetDich ?? []).find((x) => x && typeof x === "object" && x.duong === duong)?.ten;
	return { duong: String(duong ?? ""), ten: ten ? String(ten) : "" };
}

/**
 * Chọn ảnh bìa. Thứ tự: huyệt trụ cột → huyệt nêu trong từ khoá chính/tiêu đề → vị thuốc nêu
 * trong từ khoá chính/tiêu đề → kinh nêu trong tiêu đề/từ khoá (ảnh anh_chinh) → null.
 * `trangTruCot`: "/huyet/<slug>/" hoặc {duong, ten}. `lienKetDich`: chuỗi hoặc {duong, ten}.
 * Tất định: cùng vào → cùng ra, không phụ thuộc thứ tự thư viện.
 * @returns {{mediaId: string, alt: string, lyDo: string} | null}
 */
export function chonAnhBia(chiMuc, { tieuDe = "", tuKhoaChinh = "", tuKhoaPhu = [], trangTruCot, lienKetDich = [] } = {}) {
	if (!chiMuc) return null;
	// 1. Huyệt là trụ cột.
	const tc = truCot(trangTruCot, lienKetDich);
	const mSlug = tc.duong.match(/^\/huyet\/([^/]+)\/?$/);
	if (mSlug) {
		let muc = null;
		if (tc.ten) muc = chiMuc.huyet.coDau.get(khoaCoDau(tc.ten)) ?? { ten: nfc(tc.ten), anh: [] };
		else {
			const ung = [...chiMuc.huyet.coDau.values()].filter((m) => slugKhongDau(m.ten) === mSlug[1]);
			if (ung.length === 1) muc = ung[0];
		}
		const a = anhHuyet(chiMuc, muc);
		if (a) return ketQua(a.anh, `huyệt trụ cột ${muc.ten}${a.them}`);
	}
	const chuChinh = [
		["từ khoá chính", tuKhoaChinh],
		["tiêu đề", tieuDe],
	].filter(([, c]) => String(c ?? "").trim());
	// 2. Huyệt nêu trong từ khoá chính / tiêu đề (tên, hoặc mã có ảnh 3D).
	for (const [nhan, chu] of chuChinh) {
		const ung = [];
		for (const x of timTen(chiMuc.huyet, chu)) {
			const a = anhHuyet(chiMuc, x.muc);
			if (a) ung.push({ vt: x.vt, a, ten: x.muc.ten });
		}
		for (const x of timMa(chiMuc, chu)) {
			const a3 = chiMuc.huyet3d.get(x.ma)[0];
			ung.push({ vt: x.vt, a: { anh: a3, them: ` (ảnh 3D: ${a3.kieu})` }, ten: x.ma });
		}
		ung.sort((p, q) => p.vt - q.vt);
		if (ung.length) return ketQua(ung[0].a.anh, `huyệt ${ung[0].ten} nêu trong ${nhan}${ung[0].a.them}`);
	}
	// 3. Vị thuốc nêu trong từ khoá chính / tiêu đề.
	for (const [nhan, chu] of chuChinh) {
		const x = timTen(chiMuc.viThuoc, chu)[0];
		if (x?.muc.anh.length) return ketQua(x.muc.anh[0], `vị thuốc ${x.muc.ten} nêu trong ${nhan}`);
	}
	// 4. Kinh nêu trong tiêu đề / từ khoá. "thần kinh …" không phải đường kinh.
	const chuKinh = [
		["tiêu đề", tieuDe],
		["từ khoá chính", tuKhoaChinh],
		...(Array.isArray(tuKhoaPhu) ? tuKhoaPhu : [tuKhoaPhu]).map((t) => ["từ khoá phụ", t]),
	].filter(([, c]) => String(c ?? "").trim());
	for (const [nhan, chu] of chuKinh) {
		const x = timTen(chiMuc.kinh, chu, { chanTruoc: /(than|thần) $/ })[0];
		if (!x) continue;
		const cot = COT_KINH.find((c) => x.muc.anh[c]?.length) ?? Object.keys(x.muc.anh).sort()[0];
		if (cot) return ketQua(x.muc.anh[cot][0], `kinh ${x.muc.ten} nêu trong ${nhan} (${cot})`);
	}
	return null;
}

// Đệm trong tiến trình như noi-bo/nap.mjs: một container CMS; thư viện ảnh đổi chậm → 24 h;
// lần nạp lỗi chỉ giữ 10 phút.
let dem = null;
let dang = null;
const GIU_KHI_LOI_MS = 10 * 60 * 1000;

/** @returns {Promise<ReturnType<typeof dungChiMucAnh>>}  lỗi nạp → chỉ mục rỗng kèm `loiNap`. */
export async function layChiMucAnh(media, { ttlMs = 24 * 3600 * 1000, now = Date.now, maTheoTen, toiDa } = {}) {
	if (dem && now() < dem.het) return dem.chiMuc;
	if (!dang)
		dang = napThuVienAnh(media, toiDa ? { toiDa } : {})
			.then(
				(ds) => dungChiMucAnh(ds, { maTheoTen }),
				(e) => ({ ...dungChiMucAnh([]), loiNap: String(e?.message ?? e).slice(0, 200) }),
			)
			.then((chiMuc) => {
				dem = { chiMuc, het: now() + (chiMuc.loiNap ? Math.min(ttlMs, GIU_KHI_LOI_MS) : ttlMs) };
				return chiMuc;
			})
			.finally(() => {
				dang = null;
			});
	return dang;
}

/** Cho phép kiểm: bỏ chỉ mục ảnh đã nhớ. */
export function xoaDemChiMucAnh() {
	dem = null;
	dang = null;
}
