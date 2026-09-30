// Xác minh nguồn tham khảo Claude nộp kèm bài — cùng rào "trích dẫn phải trỏ tới chỗ CÓ THẬT"
// của bot thẩm định. Nguồn chỉ sống sót khi:
// - có url: url đọc được (chống SSRF — urlDocDuoc), tải về mã 200 và KHÔNG noindex. Không tin
//   mã 200 trần của site mình (vỏ SPA + noindex — xem noi-bo/kiem-duong.mjs), nên url cùng gốc
//   đi qua bộ kiểm đường nội bộ — và chỉ khi là /nguon/<slug>/ có tên khớp tiêu đề (không thì
//   bỏ "khong_phai_nguon": trang huyệt hay trang chủ sống không phải nguồn tham khảo);
// - không url: tên khớp ĐÚNG một trang /nguon/ trong chỉ mục nội bộ (tên hoặc tên khác — không
//   nhận khớp một phần) và trang đó sống, đúng tên, trên site thật. Tên sách mô hình "nhớ ra"
//   mà kho không có thì bị bỏ.
// Không bao giờ ném. Mỗi mục bị bỏ mang `lyDo` (mã) — lỗi tải kèm `chiTiet` tiếng Việt.
import { urlDocDuoc, voiHanGio } from "../lib/doc-web.mjs";
import { timTrongChiMuc } from "../noi-bo/chi-muc.mjs";
import { chuanDuong } from "../luat/loc-nguon-link.mjs";

/** URL về dạng so trùng: bỏ hash, bỏ "/" cuối. */
function khoaUrl(u) {
	return String(u).split("#")[0].replace(/\/+$/, "");
}

/** Đường nội bộ nếu `url` là tương đối ("/…") hoặc cùng gốc; ngược lại null. */
function duongNoiBo(url, goc) {
	if (url.startsWith("/") && !url.startsWith("//")) return chuanDuong(url);
	const g = goc.replace(/\/+$/, "");
	if (url === g || url.startsWith(`${g}/`)) return chuanDuong(url.slice(g.length) || "/");
	return null;
}

const HET_GIO = Symbol("het_gio");

/**
 * @param {{title: string, url?: string}[]} ds
 * @param {{docTrang: (url: string) => Promise<{status, xRobots, html}|{loi: string}|null>,
 *   chiMuc: {muc: object[]}, kiemDuong: (duong: string, ten?: string) => Promise<boolean>,
 *   goc?: string, toiDa?: number, hanTongMs?: number, now?: () => number}} tuyChon
 * @returns {Promise<{giu: {title: string, url: string}[], bo: {title: string, url?: string, lyDo: string, chiTiet?: string}[]}>}
 */
export async function xacMinhNguon(ds, { docTrang, chiMuc, kiemDuong, goc = "https://kinhlac.online", toiDa = 12, hanTongMs = 60000, now = Date.now } = {}) {
	const giu = [], bo = [];
	const daCo = new Set();
	const batDau = now();
	const danhSach = Array.isArray(ds) ? ds : [];
	/** Chạy một việc trong phần hạn tổng còn lại; hết hạn → HET_GIO. */
	const trongHan = (conLai, viec) =>
		voiHanGio(Promise.resolve().then(viec), Math.max(1, conLai), "xác minh nguồn").catch((e) =>
			/quá hạn/.test(String(e?.message)) ? HET_GIO : Promise.reject(e),
		);
	const nhan = (title, url) => {
		const k = khoaUrl(url);
		if (daCo.has(k)) return { lyDo: "trung_url", url };
		daCo.add(k);
		giu.push({ title, url });
		return null;
	};

	for (let i = 0; i < danhSach.length; i++) {
		const x = danhSach[i];
		const title = String(x?.title ?? "").trim();
		const url = typeof x?.url === "string" && x.url.trim() ? x.url.trim() : undefined;
		const boMuc = (lyDo, them = {}) => bo.push({ title, ...(url || them.url ? { url: them.url ?? url } : {}), lyDo, ...(them.chiTiet ? { chiTiet: them.chiTiet } : {}) });
		if (!title) {
			boMuc("thieu_tieu_de");
			continue;
		}
		if (i >= toiDa) {
			boMuc("vuot_tran");
			continue;
		}
		const conLai = hanTongMs - (now() - batDau);
		if (conLai <= 0) {
			boMuc("het_gio_tong");
			continue;
		}
		try {
			if (url) {
				const duong = duongNoiBo(url, goc);
				if (duong) {
					// Rà soát I8: link về "/" hay "/huyet/x/" của chính site sống thì vẫn KHÔNG phải nguồn.
					// Chỉ nhận /nguon/<slug>/ khi tiêu đề khớp đúng tên (hoặc tên khác) của CHÍNH mục đó.
					const muc = /^\/nguon\/[^/]+\/$/.test(duong)
						? timTrongChiMuc(chiMuc ?? { muc: [] }, title, { toiDa: 10 }).find(
								(m) => m.loai === "nguon" && (m.khop === "dung" || m.khop === "ten_khac") && (m.duong ?? []).includes(duong),
							)
						: null;
					if (!muc) {
						boMuc("khong_phai_nguon");
						continue;
					}
					const song = await trongHan(conLai, () => kiemDuong(duong, muc.ten));
					if (song === HET_GIO) boMuc("het_gio_tong");
					else if (!song) boMuc("trang_noi_bo_khong_song");
					else {
						const trung = nhan(title, `${goc.replace(/\/+$/, "")}${duong}`);
						if (trung) boMuc(trung.lyDo);
					}
					continue;
				}
				if (!urlDocDuoc(url)) {
					boMuc("url_bi_chan");
					continue;
				}
				if (daCo.has(khoaUrl(url))) {
					boMuc("trung_url");
					continue;
				}
				const trang = await trongHan(conLai, () => docTrang(url));
				if (trang === HET_GIO) boMuc("het_gio_tong");
				else if (!trang || trang.loi) boMuc("loi_tai", { chiTiet: trang?.loi ?? "không tải được" });
				else if (trang.status !== 200) boMuc(`http_${trang.status}`);
				else if (/noindex/i.test(trang.xRobots ?? "")) boMuc("noindex");
				else nhan(title, url);
				continue;
			}
			// Không url: chỉ trang /nguon/ có thật, khớp đúng tên hoặc tên khác.
			const ung = timTrongChiMuc(chiMuc ?? { muc: [] }, title, { toiDa: 10 }).filter(
				(m) => m.loai === "nguon" && (m.khop === "dung" || m.khop === "ten_khac"),
			);
			if (!ung.length) {
				boMuc("khong_co_trang_nguon");
				continue;
			}
			const tim = await trongHan(conLai, async () => {
				for (const m of ung) for (const d of m.duong ?? []) if (await kiemDuong(d, m.ten)) return d;
				return null;
			});
			if (tim === HET_GIO) boMuc("het_gio_tong");
			else if (!tim) boMuc("trang_nguon_khong_song");
			else {
				const u = `${goc.replace(/\/+$/, "")}${tim}`;
				const trung = nhan(title, u);
				if (trung) boMuc("trung_url", { url: u });
			}
		} catch (e) {
			boMuc("loi_tai", { chiTiet: String(e?.message ?? e).slice(0, 200) });
		}
	}
	return { giu, bo };
}
