// HỒ SƠ CỤM — nguyên liệu đưa cho lò viết, và phép lọc "cụm nào còn trống".
//
// TRỤC SO SÁNH: không đếm "đối thủ có bài gì mình chưa có" (lối n8n), mà đo CHIỀU CAO THÁP —
// mình có bao nhiêu vị thuốc, bài thuốc, nguồn y văn đứng sau một nhu cầu, trong khi đối thủ
// chỉ có một bài rời. Đo thật 02/10/2026 trên cụm "chảy máu cam": Vinmec, Long Châu,
// Pharmacity, Tâm Anh đều có bài và đều viết theo y học hiện đại; kho này có 55 bài thuốc,
// 150 vị và 8 bộ sách đứng sau. Đó là khoảng cách không mua được bằng tiền thuê agency.
//
// ⚠️ BA ĐIỀU ĐÃ TRẢ GIÁ KHI DỰNG TRỤC NÀY:
//
// 1. ĐẢO CHIỀU THÔ THÌ VÔ DỤNG. Hỏi thẳng "chủ đề nào mình có mà đối thủ chưa có" cho ra
//    64/64 = 100% trang của mình, kể cả "Chính sách quyền riêng tư". Ở TẦNG BÀI VIẾT hai bên
//    không bao giờ gặp nhau; phép so chỉ có nghĩa ở TẦNG CỤM.
// 2. THÁP CAO CHƯA CHẮC LÀ KHOẢNG TRỐNG. Cụm "mất ngủ" có 113 bài thuốc, nhưng đã có sẵn
//    trang bệnh học 47.211 ký tự — viết thêm là tự trùng chính mình. Phải lọc qua chỉ mục CMS.
// 3. TRA BẰNG TIẾNG VIỆT HIỆN ĐẠI LÀ HỤT THÁP. "chảy máu cam" ra 6 mục chủ trị; thêm "nục
//    huyết" và "tỵ nục" ra 17, số vị thuốc nhảy từ 25 lên 55. "vai gáy" ra 0 nên từng bị kết
//    luận nhầm là "không có đất", trong khi kho có 6 mục chứa "gáy" và 14 huyệt nhắc vai gáy.
//    Vì vậy MỌI lời gọi đều đòi mảng biến thể, không nhận một từ.

import { boDau } from "../luat/chuan-hoa.mjs";
import * as kho from "../kho.mjs";

/**
 * Gốc API của backend. Mặc định là site thật kèm tiền tố `/api` — tiền tố đó do **nginx** thêm,
 * backend KHÔNG tự khai `setGlobalPrefix`. Vì vậy mọi nơi gọi thẳng vào backend (máy lập trình,
 * hoặc container-tới-container trên VPS) phải khai `RADA_SEO_API` KHÔNG kèm `/api`:
 *
 *   máy lập trình → RADA_SEO_API=http://localhost:3001   (đặt trong cms/.env)
 *   VPS           → RADA_SEO_API=http://backend:3000     (đặt trong docker-compose, KHÔNG phải
 *                                                         cms/.env — tệp đó chép qua lại hai máy)
 *
 * Thiếu khai thì plugin hỏi site thật, và site thật chỉ trả lời khi backend MỚI đã deploy.
 */
const GOC_API = () => process.env.RADA_SEO_API ?? `${process.env.RADA_SEO_SITE ?? "https://kinhlac.online"}/api`;
/** Hạn chờ: hồ sơ quét bảng bài thuốc nên chậm hơn một lời gọi tra tên thường. */
const HAN_GIO_MS = 30_000;

/**
 * ⚠️ ĐƯỜNG NÀY KHÔNG ĐI QUA `ctx.http.fetch`, và đó là chủ ý.
 *
 * `ctx.http.fetch` của EmDash chạy qua bộ chặn SSRF (`ssrf-*.mjs`): mọi host nội bộ —
 * `localhost`, tên container, dải IP riêng — đều bị từ chối với "URLs targeting internal hosts
 * are not allowed", và KHÔNG có lối cấu hình để mở. Bộ chặn đó đúng cho chỗ nó sinh ra: plugin
 * tải trang ĐỐI THỦ, tức URL đến từ dữ liệu người dùng nhập.
 *
 * Gốc API ở đây thì ngược lại: nó là hằng số do người VẬN HÀNH khai trong docker-compose hoặc
 * cms/.env, không bao giờ đến từ nội dung. Bắt nó đi vòng ra tên miền công khai rồi quay lại
 * chính máy mình là trả giá một vòng mạng cho một rủi ro không tồn tại — và trên máy lập trình
 * thì đơn giản là không chạy được.
 *
 * Plugin này là `format: "native"` nên chạy thẳng trong tiến trình CMS và có `fetch` toàn cục.
 * Mọi lời gọi tải trang ngoài (radar, kiểm đường, lò viết) VẪN đi qua `ctx.http.fetch` như cũ.
 */
const fetchNoiBo = (u, i) => fetch(u, i);

async function goiApp(fetchFn = fetchNoiBo, duong, init, hanGioMs = HAN_GIO_MS) {
	const bo = typeof AbortController === "function" ? new AbortController() : null;
	const hen = bo ? setTimeout(() => bo.abort(), hanGioMs) : null;
	try {
		const res = await fetchFn(`${GOC_API().replace(/\/+$/, "")}${duong}`, bo ? { ...init, signal: bo.signal } : init);
		if (!res.ok) return { ok: false, loi: `HTTP ${res.status}`, du: null };
		return { ok: true, loi: "", du: await res.json() };
	} catch (e) {
		return { ok: false, loi: e?.name === "AbortError" ? `quá hạn ${hanGioMs} ms` : String(e?.message ?? e).slice(0, 200), du: null };
	} finally {
		if (hen) clearTimeout(hen);
	}
}

/**
 * Hồ sơ một cụm, lấy từ backend (kho app). Thiếu mạng thì trả `ok: false` kèm lý do —
 * KHÔNG trả hồ sơ rỗng, vì "0 bài thuốc" và "không hỏi được" là hai trạng thái khác nhau.
 * @returns {Promise<{ok: boolean, loi: string, hoSo: object|null}>}
 */
export async function layHoSoCum(fetchFn = fetchNoiBo, cum, bienThe = []) {
	const r = await goiApp(fetchFn, "/rada/ho-so-cum", {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({ cum, bienThe }),
	});
	return { ok: r.ok, loi: r.loi, hoSo: r.du };
}

/**
 * 657 CỤM NGỮ NGHĨA — tầng TRÊN của `layUngVien`.
 *
 * Mỗi cụm gom nhiều chủ trị cùng nghĩa, nên nó chữa đúng cái bẫy đã cắn ở tab Khoảng trống:
 * "Mụn nhọt", "ung nhọt", "nhọt độc", "Ung Nhọt Độc" nằm bốn dòng riêng ở đó, còn ở đây là MỘT
 * cụm 21 chủ trị. Danh sách chủ trị của cụm chính là BIẾN THỂ mà `layHoSoCum` cần — trước đây
 * phải khai tay ("nục huyết", "tỵ nục") và khai thiếu thì tháp hụt hẳn.
 */
export async function layCumNguNghia(fetchFn = fetchNoiBo, { toiThieuThap = 20 } = {}) {
	const r = await goiApp(fetchFn, `/rada/cum-ngu-nghia?toiThieuThap=${toiThieuThap}`, { headers: { Accept: "application/json" } }, 120_000);
	return { ok: r.ok, loi: r.loi, ds: Array.isArray(r.du) ? r.du : [] };
}

/** Chủ trị có tháp dày, chưa lọc theo trang đã có. */
export async function layUngVien(fetchFn = fetchNoiBo, { toiThieuVi = 8, toiThieuThap = 25 } = {}) {
	const r = await goiApp(fetchFn, `/rada/ung-vien?toiThieuVi=${toiThieuVi}&toiThieuThap=${toiThieuThap}`, { headers: { Accept: "application/json" } }, 60_000);
	return { ok: r.ok, loi: r.loi, ds: Array.isArray(r.du) ? r.du : [] };
}

/**
 * Cụm có NGHĨA KÉP giữa Đông y và tiếng Việt thường dùng. Tháp đo được thuộc nghĩa Đông y,
 * còn người gõ Google lại đang tìm nghĩa kia — xếp hạng nó như cụm thường là dẫn lò viết đi
 * sai hẳn đề tài. Đo thật: "khí hư" có tháp 612 (chứng khí suy) trong khi truy vấn phổ thông
 * là bệnh phụ khoa. Không tự quyết: gắn cờ để người xác nhận.
 */
export const CUM_NGHIA_KEP = ["khi hu", "bach doi", "ha tieu", "thap nhiet"];
export const laNghiaKep = (ten) => CUM_NGHIA_KEP.includes(boDau(ten));

/**
 * Trạng thái trang của mình cho một cụm — quyết định cụm đó là việc VIẾT MỚI hay việc LEO TOP.
 * @param {string} ten tên cụm
 * @param {{muc: {bo: string, title?: string, slug?: string}[]}} chiMuc chỉ mục CMS (noi-bo/nap.mjs)
 * @returns {{daCo: boolean, bo?: string, slug?: string}}
 */
export function trangDaCo(ten, chiMuc) {
	const k = boDau(ten);
	for (const m of chiMuc?.muc ?? []) {
		if (m.bo !== "benh_hoc" && m.bo !== "cham_cuu_tri_benh") continue;
		if (boDau(m.title) === k || boDau(String(m.slug ?? "").replace(/-/g, " ")) === k) return { daCo: true, bo: m.bo, slug: m.slug };
	}
	return { daCo: false };
}

/** Hai bộ duy nhất mà `trangDaCo` nhìn tới. */
export const BO_NHU_CAU = ["benh_hoc", "cham_cuu_tri_benh"];

/**
 * Nạp RIÊNG hai bộ trang-nhắm-nhu-cầu (~172 mục), KHÔNG dùng `layChiMuc`.
 *
 * ⚠️ `layChiMuc` nạp CẢ 9 bộ từ điển — chừng 18.400 mục. Lần nạp nguội mất tới vài phút (chính
 * `layBaiCanViet` phải nạp nó TRƯỚC khi giành khoá vì lý do đó). Tab Khoảng trống chỉ cần biết
 * "cụm này đã có trang bệnh học hay châm cứu trị bệnh chưa", nên nạp cả chỉ mục là treo màn
 * hình ở "Đang tải…" mà không ai biết vì sao. Đã cắn một lần (02/10/2026).
 *
 * Bộ nào lỗi thì BỎ QUA và báo ra `loiNap` — chỉ mục thiếu làm cụm đã có trang hiện ra như
 * "chưa có", tức giao viết trùng; phải lộ ra chứ không im lặng.
 */
export async function napTrangNhuCau(content, { tranTrang = 50 } = {}) {
	const muc = [], loiNap = [];
	for (const bo of BO_NHU_CAU) {
		try {
			let cursor, soTrang = 0;
			do {
				const r = await content.list(bo, { limit: 100, cursor, where: { status: "published" } });
				for (const it of r.items ?? []) muc.push({ bo, slug: it.slug ?? it.data?.slug, title: it.data?.title });
				cursor = r.hasMore && r.cursor && ++soTrang < tranTrang ? r.cursor : undefined;
			} while (cursor);
		} catch (e) {
			loiNap.push({ bo, loi: String(e?.message ?? e).slice(0, 200) });
		}
	}
	return { muc, loiNap };
}

/**
 * Xếp ứng viên thành ba giỏ. KHÔNG gộp làm một bảng xếp hạng: ba giỏ là ba loại VIỆC khác
 * nhau, và gộp lại thì cụm "đã có trang" sẽ bị giao cho lò viết viết trùng.
 *
 * @returns {{choViet: object[], leoTop: object[], choXacNhan: object[]}}
 */
export function xepUngVien(ds, chiMuc) {
	const choViet = [], leoTop = [], choXacNhan = [];
    for (const x of ds) {
		if (laNghiaKep(x.ten)) {
			choXacNhan.push({ ...x, lyDo: "nghĩa kép giữa Đông y và tiếng Việt thường dùng" });
			continue;
		}
		const t = trangDaCo(x.ten, chiMuc);
		(t.daCo ? leoTop : choViet).push({ ...x, ...t });
	}
	return { choViet, leoTop, choXacNhan };
}

/** Mọi đường dẫn nội bộ rút được từ hồ sơ, đã khử trùng, thứ tự: vị theo tần suất → vị từng
 *  thể → bài thuốc tiêu biểu → nguồn y văn. */
export function duongTuHoSo(hoSo) {
	const ds = [];
	for (const v of hoSo?.viHayDung ?? []) if (v.duong) ds.push({ duong: v.duong, ten: v.ten });
	for (const t of hoSo?.theBenh ?? []) {
		for (const v of t.viThuocChinh ?? []) if (v.duong) ds.push({ duong: v.duong, ten: v.ten });
		for (const b of t.baiThuocTieuBieu ?? []) if (b.duong) ds.push({ duong: b.duong, ten: b.ten });
	}
	for (const n of hoSo?.nguonYVan ?? []) if (n.duong) ds.push({ duong: n.duong, ten: n.ten });
	const thay = new Set();
	return ds.filter((x) => !thay.has(x.duong) && thay.add(x.duong));
}

/**
 * Dựng MỘT bài dự kiến từ hồ sơ cụm và ghi thẳng vào bộ `ke_hoach` ở trạng thái `da_duyet` —
 * tức sẵn sàng cho lò viết nhận ngay trong ca sau.
 *
 * ⚠️ VÀO THẲNG `da_duyet` là có chủ ý và CHỈ đúng vì người quản trị phải bấm nút mới tới đây:
 * họ đã nhìn hồ sơ (thể bệnh, vị, nguồn, lỗ thủng) rồi mới giao. Không khâu nào tự gọi hàm này.
 *
 * Trang trụ cột lấy từ chính hồ sơ chứ không khai cứng: bản thử đầu khai cứng một đường của
 * cụm cũ, sang cụm khác thì link trụ cột trỏ ra ngoài tháp và cổng nộp bài đánh trượt.
 */
/** Trạng thái mà một bài dự kiến còn đang "sống" — chưa xong và chưa bị bỏ. */
const DANG_SONG = new Set(["de_xuat", "da_duyet", "dang_viet", "co_nhap", "can_xem"]);

export async function taoKeHoachTuHoSo(s, { cum, bienThe, hoSo, now = new Date().toISOString() }) {
	// ⚠️ MỘT CỤM CHỈ MỘT BÀI ĐANG SỐNG. Thiếu luật này thì mỗi lần bấm "Giao cho lò viết" lại
	// đẻ thêm một bài y hệt — đo 02/10/2026: 6 bài "Mụn nhọt theo Đông y" trùng nhau trong tab
	// Kế hoạch, và lò viết sẽ lần lượt viết cả 6 thành 6 nháp trùng nội dung.
	const daCo = (await kho.dsKeHoach(s)).find((k) => k.cumChuTri === cum && DANG_SONG.has(k.trangThai));
	if (daCo) return { ...daCo, daCoSan: true };
	const duong = duongTuHoSo(hoSo);
	if (duong.length < 6) throw new Error(`Tháp của cụm "${cum}" quá mỏng: chỉ ${duong.length} trang dẫn được, cần ít nhất 6`);
	const id = `kt_${boDau(cum).replace(/[^a-z0-9]+/g, "-")}_${Date.now().toString(36)}`;
	const data = {
		cumId: `kt:${boDau(cum)}`,
		tieuDeLamViec: `${cum} theo Đông y: nguyên nhân và cách hỗ trợ`,
		tuKhoaChinh: `${cum} theo đông y`,
		tuKhoaPhu: [...new Set([...(bienThe ?? []), ...(hoSo.theBenh ?? []).map((t) => String(t.phapTri).toLowerCase())])].slice(0, 6),
		yDinh: "tim_hieu",
		trangTruCot: duong[0].duong,
		lienKetDich: duong.slice(1).map((x) => x.duong),
		goiYNguon: (hoSo.nguonYVan ?? []).slice(0, 4).map((n) => n.ten),
		// Hai trường này là thứ cho phép lò viết lấy lại hồ sơ lúc viết — xem layBaiCanViet.
		cumChuTri: cum,
		bienThe: bienThe ?? [],
		trangThai: "da_duyet",
		taoLuc: now,
		nguonGoc: "khoang_trong",
	};
	await s.ke_hoach.put(id, data);
	return { id, ...data };
}

/**
 * Lời nhắc riêng cho MỘT bài, ghép từ hồ sơ. Ghép ở máy chủ chứ không để model tự xoay sở với
 * JSON thô: đo hai lượt viết thật trên cùng cụm — lượt đưa danh sách phẳng ra 605 từ và 7
 * link; lượt đưa hồ sơ có thể bệnh ra 1.623 từ và 33 link, và giải thích được vì sao từng vị
 * hợp từng thể bằng chính tính vị quy kinh trong kho.
 */
export function loiNhacTuHoSo(hoSo) {
	if (!hoSo?.theBenh?.length) return "";
	const soLink = hoSo.theBenh.reduce((s, t) => s + t.viThuocChinh.length + t.baiThuocTieuBieu.length, 0) + hoSo.viHayDung.length;
	return [
		`DỮ LIỆU BẠN NHẬN là hồ sơ cụm rút từ kho y văn của chính trang này: các THỂ BỆNH (rút từ pháp trị của từng bài thuốc có thật), vị thuốc chính của từng thể kèm tính vị quy kinh và số bài thuốc dùng nó, bài thuốc tiêu biểu kèm xuất xứ, và nguồn y văn.`,
		``,
		`YÊU CẦU RIÊNG CHO BÀI NÀY:`,
		`- Mỗi THỂ BỆNH trong hồ sơ là MỘT mục "##" riêng: nêu cơ chế, chứng trạng theo y văn, pháp trị, rồi vị thuốc chính và bài thuốc tiêu biểu của đúng thể đó.`,
		`- Dùng tính vị quy kinh có sẵn để giải thích VÌ SAO vị đó hợp với thể đó. Không bịa tính vị.`,
		`- Gắn ít nhất ${Math.min(12, Math.max(6, Math.floor(soLink * 0.4)))} liên kết nội bộ, chỉ dùng đường dẫn có trong hồ sơ. Không tự ghép đường dẫn, không link ra trang ngoài.`,
		`- Nêu số bài thuốc trong kho ghi lại cho chứng này (${hoSo.soBaiThuoc} bài) như một lát cắt y văn.`,
		`- Thân bài 1.200–1.800 từ.`,
		// Phải dặn ĐÚNG CỤM: luật phạm vi Y sỹ bắt "đi khám" (lời mời khám ở chỗ mình) và chỉ miễn
		// khi câu chỉ đích danh nơi khác. Không dặn thì model viết "đi khám ngay" và bài trượt cổng.
		`- Thêm một mục nói khi nào phải tới cơ sở y tế ngay. Viết trung tính, không chẩn đoán. Dùng cụm "đến cơ sở y tế" hoặc "tới bệnh viện"; KHÔNG viết "đi khám".`,
	].join("\n");
}
