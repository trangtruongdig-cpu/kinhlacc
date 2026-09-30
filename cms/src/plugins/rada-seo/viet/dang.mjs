// Cổng ĐĂNG bài blog (2C-3 việc 4): logic của hai hook publish, khung "Phiếu Rada" cạnh trình
// soạn, và dữ liệu tab "Nháp". Thuần: nhận event/ctx, không import emdash — plugin.mjs chỉ nối.
//
// Sự thật đã đo (docs/superpowers/plans/2026-09-30-rada-seo-do-thu-2c3.md, 4d/4e/5):
// - content:beforePublish nhận MỤC ĐẦY ĐỦ, `content.data` đã trộn bản nháp (hydrateDraftData);
//   trả `{cancel: true, reason}` (đúng HAI khoá, reason ≤ 500 ký tự, không ký tự điều khiển) → 422
//   PUBLISH_REJECTED và người sửa thấy nguyên văn reason. Trả undefined = cho qua.
// - Hook NÉM với errorPolicy mặc định "abort" = chặn Publish. Hook hỏng không được khoá cả nút
//   Publish, nên mọi lỗi nội bộ ở đây bị NUỐT (log) → cho qua; plugin.mjs khai thêm
//   errorPolicy:"continue" làm lớp thứ hai (kể cả khi quá hạn giờ).
// - content:afterPublish chạy ~25 ms sau với {content, collection}, `content.id` có sẵn.
import * as kho from "../kho.mjs";
import { timViPham } from "../luat/pham-vi-y-sy.mjs";
import { chuTuPt } from "./pt-an-toan.mjs";
import { slugKhongDau } from "../luat/slug.mjs";

const BO = "bai_viet";
/** Trần reason của EmDash là 500 code point; chừa lề. */
const TRAN_LY_DO = 480;
const SO_CHU_NEU = 3;
/** Khối ảnh PT hiện được cho người đọc: đo ở spike 2c — `_ref` trần 404, url của media.list 401. */
const URL_ANH_DUNG = /^\/_emdash\/api\/media\/file\/[A-Za-z0-9_-]+\.[A-Za-z0-9]{1,8}$/;

export const adminUrl = (contentId) => `/_emdash/admin/content/${BO}/${contentId}`;

/**
 * Số thứ tự (từ 1) các khối ảnh PT KHÔNG hiện được cho người đọc. Chỉ xét `_type: "image"`:
 * khối kiểu lạ khác do người biên tập chèn không phải việc của cổng này.
 * @returns {number[]}
 */
export function anhHong(pt) {
	if (!Array.isArray(pt)) return [];
	const ra = [];
	pt.forEach((b, i) => {
		if (b?._type !== "image") return;
		const url = b?.asset?.url;
		if (typeof url !== "string" || !URL_ANH_DUNG.test(url)) ra.push(i + 1);
	});
	return ra;
}

const chuoi = (x) => (typeof x === "string" ? x : "");

/**
 * Soát phạm vi Y sỹ + ảnh trên dữ liệu một bài bai_viet.
 * @param {Record<string, unknown>} data  trường của bài (title, description, content PT, faq)
 * @param {{nghiem?: boolean}} [tuyChon]  nghiem: bài MÁY viết (luat/pham-vi-y-sy.mjs)
 * @returns {{viPham: {cho: string, ma: string, tu: string, cau: string, goiY: string}[], anhHong: number[]}}
 */
export function soatBai(data, { nghiem = false } = {}) {
	const d = data && typeof data === "object" ? data : {};
	const viPham = [];
	const soat = (cho, chu) => {
		for (const v of timViPham(chu, { nghiem })) viPham.push({ cho, ...v });
	};
	soat("tiêu đề", chuoi(d.title));
	soat("mô tả", chuoi(d.description));
	soat("thân bài", chuTuPt(d.content));
	// FAQ cũng in ra trang công khai (và vào JSON-LD) — ngoài chữ của đặc tả nhưng cùng lý do pháp lý.
	for (const f of Array.isArray(d.faq) ? d.faq : []) soat("FAQ", `${chuoi(f?.q)}\n${chuoi(f?.a)}`);
	return { viPham, anhHong: anhHong(d.content) };
}

const catChu = (s, n) => {
	const t = [...String(s)];
	return t.length > n ? `${t.slice(0, n - 1).join("")}…` : t.join("");
};

/** Lời từ chối tiếng Việt, ≤ TRAN_LY_DO ký tự; null khi không có gì để chặn. */
export function lyDoChan({ viPham, anhHong: hong }) {
	const phan = [];
	if (viPham.length) {
		// Gộp theo chữ: "trị" hai lần là một việc phải sửa.
		const theoChu = new Map();
		for (const v of viPham) {
			const k = v.tu.toLowerCase();
			if (!theoChu.has(k)) theoChu.set(k, v);
		}
		const ds = [...theoChu.values()];
		const neu = ds.slice(0, SO_CHU_NEU).map((v) => `"${catChu(v.tu, 30)}" (${v.cho}) → ${v.goiY}`);
		const con = ds.length - neu.length;
		phan.push(`Chữ vượt phạm vi hành nghề Y sỹ: ${neu.join("; ")}${con > 0 ? `; và ${con} chỗ khác` : ""}. Xem khung "Phiếu Rada" để thấy đủ.`);
	}
	if (hong.length)
		phan.push(`Ảnh trong thân bài không hiện được cho người đọc (khối ${hong.slice(0, 5).join(", ")}${hong.length > 5 ? "…" : ""}): ảnh phải có đường /_emdash/api/media/file/<tệp> — xoá rồi chèn lại từ thư viện ảnh.`);
	if (!phan.length) return null;
	return catChu(`Chưa đăng được. ${phan.join(" ")}`, TRAN_LY_DO);
}

/** Bài máy viết = có bản ghi `nhap` (id = contentId). Kho hỏng → coi như bài người viết (thường). */
async function laBaiMay(ctx, id) {
	if (!id || !ctx?.storage?.nhap) return false;
	try {
		return !!(await ctx.storage.nhap.get(String(id)));
	} catch (e) {
		ctx.log?.warn?.("Rada SEO: không đọc được sổ nháp khi soát trước khi đăng — soát chế độ thường", e);
		return false;
	}
}

/**
 * Handler content:beforePublish. Chỉ luật, không mạng. KHÔNG BAO GIỜ ném.
 * @returns {Promise<undefined | {cancel: true, reason: string}>}
 */
export async function truocKhiDang(event, ctx) {
	try {
		if (event?.collection !== BO) return undefined;
		const content = event.content ?? {};
		const data = content.data && typeof content.data === "object" ? content.data : content;
		const nghiem = await laBaiMay(ctx, content.id);
		const lyDo = lyDoChan(soatBai(data, { nghiem }));
		return lyDo ? { cancel: true, reason: lyDo } : undefined;
	} catch (e) {
		try {
			ctx?.log?.error?.("Rada SEO: cổng trước khi đăng hỏng — cho qua để không khoá nút Publish", e);
		} catch {
			// log hỏng cũng không được làm hỏng Publish.
		}
		return undefined;
	}
}

/**
 * Handler content:afterPublish: nháp của lò viết → da_dang, kế hoạch → da_dang. Không ném.
 * Tìm kế hoạch qua bản ghi nhap; không có thì dò kế hoạch can_xem mang contentId (nháp mồ côi —
 * kế hoạch chuyển can_xem sau khi đã create).
 */
export async function sauKhiDang(event, ctx) {
	try {
		if (event?.collection !== BO) return;
		const id = event.content?.id;
		if (!id) return;
		const s = ctx.storage;
		const luc = typeof event.content.publishedAt === "string" ? event.content.publishedAt : new Date().toISOString();
		const nhap = await s.nhap.get(String(id));
		let keHoachId = nhap?.keHoachId ?? null;
		if (nhap && nhap.trangThai !== "da_dang") await s.nhap.put(String(id), { ...nhap, trangThai: "da_dang", dangLuc: luc });
		if (!keHoachId) {
			const moCoi = (await kho.dsKeHoach(s, { trangThai: "can_xem" })).find((k) => String(k.contentId ?? "") === String(id));
			keHoachId = moCoi?.id ?? null;
		}
		if (!keHoachId) return;
		const k = await s.ke_hoach.get(keHoachId);
		if (k && k.trangThai !== "da_dang") {
			const moi = { ...k, trangThai: "da_dang", dangLuc: luc };
			delete moi.giuLuc;
			await s.ke_hoach.put(keHoachId, moi);
		}
	} catch (e) {
		try {
			ctx?.log?.error?.("Rada SEO: ghi 'đã đăng' hỏng (bài vẫn đã lên)", e);
		} catch {
			// bỏ qua
		}
	}
}

/** Tóm tắt phiếu cho tab Nháp / khung cạnh bài. Chỉ con số và tên tiêu chí — không lời khuyên độ dài. */
export function tomTatPhieu(phieu) {
	const p = phieu && typeof phieu === "object" ? phieu : {};
	const seo = Array.isArray(p.seo) ? p.seo : [];
	const mang = (x) => (Array.isArray(x) ? x : []);
	return {
		seo: `${seo.filter((x) => x?.dat).length}/${seo.length}`,
		seoTruot: seo.filter((x) => x && !x.dat).map((x) => String(x.ghiChu ?? x.ma ?? "")),
		ymyl: mang(p.ymyl).length,
		canhBao: mang(p.khuonCanhBao).map((x) => String(x?.ghiChu ?? x?.ma ?? "")),
		nguonBo: mang(p.nguonBo).length,
		linkGo: mang(p.linkGo).length,
		anh: p.anh?.alt ?? (p.anh ? String(p.anh.mediaId ?? "") : null),
		soTu: typeof p.soTu === "number" ? p.soTu : null,
		...(p.loiCapNhat ? { loiCapNhat: String(p.loiCapNhat) } : {}),
		...(p.khoiPhuc ? { khoiPhuc: String(p.khoiPhuc) } : {}),
	};
}

const NHAN_NHAP = { cho_duyet: "Chờ duyệt", da_dang: "Đã đăng" };
const gioVN = (s) => {
	const t = Date.parse(s ?? "");
	return Number.isFinite(t) ? new Date(t).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
};

/**
 * Block Kit cho khung "Phiếu Rada" (chỉ header/section/fields/context/divider/banner).
 * @param {{chuaLuu?: boolean, nhap?: object|null, soat?: {viPham: object[], anhHong: number[]}}} x
 */
export function khoiPanel({ chuaLuu = false, nhap = null, soat = null, loiDoc = "" } = {}) {
	const ra = [{ type: "header", text: "Phiếu Rada" }];
	if (chuaLuu) {
		ra.push({ type: "context", text: "Lưu bài một lần rồi mở lại khung này để xem phiếu." });
		return ra;
	}
	if (loiDoc) ra.push({ type: "banner", variant: "alert", title: "Không đọc được bài", description: loiDoc });
	if (nhap) {
		const t = tomTatPhieu(nhap.phieu);
		ra.push({
			type: "fields",
			fields: [
				{ label: "Trạng thái", value: NHAN_NHAP[nhap.trangThai] ?? String(nhap.trangThai ?? "—") },
				{ label: "Máy viết lúc", value: gioVN(nhap.taoLuc) },
				{ label: "SEO đạt", value: t.seo },
				{ label: "Số từ", value: t.soTu == null ? "—" : String(t.soTu) },
				{ label: "Đoạn YMYL (liều, phác đồ, hứa hẹn)", value: String(t.ymyl) },
				{ label: "Nguồn bị bỏ / link bị gỡ", value: `${t.nguonBo} / ${t.linkGo}` },
				{ label: "Ảnh bìa", value: t.anh ?? "không có" },
			],
		});
		if (t.seoTruot.length) ra.push({ type: "section", text: `SEO chưa đạt: ${t.seoTruot.join("; ")}` });
		if (t.canhBao.length) ra.push({ type: "section", text: `Cảnh báo khuôn bài: ${t.canhBao.join("; ")}` });
		if (t.loiCapNhat) ra.push({ type: "banner", variant: "alert", title: "Nháp chưa cập nhật đủ", description: t.loiCapNhat });
	} else {
		ra.push({ type: "context", text: "Bài này không do Rada SEO viết — chỉ có phần soát bên dưới." });
	}
	ra.push({ type: "divider" });
	if (!soat) return ra;
	if (!soat.viPham.length && !soat.anhHong.length) {
		ra.push({ type: "section", text: "Không thấy chữ vượt phạm vi Y sỹ, ảnh trong thân bài đều hiện được." });
	} else {
		if (soat.viPham.length)
			ra.push({
				type: "section",
				text: `Phạm vi Y sỹ — ${soat.viPham.length} chỗ phải sửa trước khi Publish:\n${soat.viPham
					.slice(0, 15)
					.map((v) => `• "${v.tu}" (${v.cho}) → ${v.goiY}`)
					.join("\n")}${soat.viPham.length > 15 ? "\n…" : ""}`,
			});
		if (soat.anhHong.length)
			ra.push({ type: "section", text: `Ảnh không hiện được cho người đọc ở khối ${soat.anhHong.join(", ")} — xoá rồi chèn lại từ thư viện ảnh.` });
	}
	ra.push({
		type: "context",
		text: "Soát trên bản đã LƯU (bản đang gõ chưa lưu thì chưa tính). Chốt thật chạy lại lúc bấm Publish, trên cả bản nháp.",
	});
	return ra;
}

/**
 * Dữ liệu tab "Nháp": mọi bản ghi nhap (mới trước) + kế hoạch can_xem có contentId mà không có nhap.
 */
export async function dsNhapChoTab(s) {
	const [nhap, keHoach] = await Promise.all([kho.dsNhap(s), kho.dsKeHoach(s)]);
	const khTheoId = new Map(keHoach.map((k) => [k.id, k]));
	const coNhap = new Set(nhap.map((n) => String(n.id)));
	return {
		nhap: nhap.map(({ phieu, ...n }) => {
			const k = khTheoId.get(n.keHoachId);
			return { ...n, tenKeHoach: k?.tieuDeLamViec ?? "", trangThaiKeHoach: k?.trangThai ?? null, adminUrl: adminUrl(n.id), tomTat: tomTatPhieu(phieu) };
		}),
		moCoi: keHoach
			.filter((k) => k.trangThai === "can_xem" && k.contentId && !coNhap.has(String(k.contentId)))
			.map((k) => ({
				id: k.id,
				tenKeHoach: k.tieuDeLamViec ?? "",
				contentId: String(k.contentId),
				slug: k.slug ?? "",
				lyDoCanXem: k.lyDoCanXem ?? "",
				loiCuoi: k.loiCuoi ?? [],
				adminUrl: adminUrl(k.contentId),
			})),
	};
}

/**
 * Route của khung "Phiếu Rada". Nhận `{type: "panel_load"}` KHÔNG kèm bản nháp (spike 5): tự đọc
 * bài theo `ctx.ui.entry.id`. `ctx.content.get` đọc CỘT (bản đã Publish / lúc create), không đọc
 * revision nháp; bài máy viết thì tiêu đề thật lấy từ sổ nháp (cột giữ tiêu đề không dấu tới khi
 * Publish). Không bao giờ ném: khung hỏng thì hiện lời báo, không 500.
 */
export async function taiPanel(ctx) {
	const id = ctx?.ui?.entry?.id;
	if (!id) return { blocks: khoiPanel({ chuaLuu: true }) };
	let nhap = null;
	try {
		nhap = await ctx.storage.nhap.get(String(id));
	} catch (e) {
		ctx.log?.warn?.("Rada SEO: khung phiếu không đọc được sổ nháp", e);
	}
	let item;
	try {
		item = await ctx.content.get(BO, String(id));
	} catch (e) {
		ctx.log?.warn?.("Rada SEO: khung phiếu không đọc được bài", e);
		return { blocks: khoiPanel({ nhap, loiDoc: `Không đọc được bài từ CMS (${catChu(String(e?.message ?? e), 120)}) — mở lại khung sau.` }) };
	}
	const data = { ...(item?.data ?? {}) };
	if (nhap?.tieuDe && (!data.title || data.title === nhap.slug || data.title === slugKhongDau(nhap.tieuDe))) data.title = nhap.tieuDe;
	return { blocks: khoiPanel({ nhap, soat: soatBai(data, { nghiem: !!nhap }) }) };
}
