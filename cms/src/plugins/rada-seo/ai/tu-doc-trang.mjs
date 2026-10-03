// Tự đọc trang đối thủ bằng model — khâu biến Radar thành TỰ HÀNH.
//
// Đặc tả: docs/superpowers/specs/2026-10-02-rada-seo-tu-hanh-gan-model.md
//
// Trước: `layViec` giao trang cho một routine Claude bên ngoài KÉO về đọc, rồi routine gọi
// `ghiPhanTich` trả kết quả. Không có routine chạy thì hàng đợi đứng mãi — đúng tình trạng
// ngày 02/10/2026. Nay plugin tự gọi model ngay trong ca, dùng CHÍNH hai hàm đó nên mọi
// trần, mọi sổ sách, mọi phép đếm vẫn y nguyên; chỉ thay chỗ "ai đọc".
//
// ⚠️ DÙNG LẠI `layViec`/`ghiPhanTich`, KHÔNG viết đường ghi riêng. Chúng giữ: trần 40 trang/đêm,
// sổ giữ chỗ theo ngày, đếm số lần giao một URL (3 lần chưa đọc → 'loi'), và luật chuẩn hoá
// kết quả. Viết đường ghi thứ hai là có hai bộ luật, và bộ thứ hai sẽ lệch.
//
// ⚠️ PHẢI LẤY VIỆC THEO LÔ. `layViec` kẹp cứng TRAN_TRANG_MOI_LUOT = 10 trang mỗi lượt gọi (nó
// sinh ra cho routine bên ngoài gọi nhiều lượt). Gọi nó MỘT lần rồi xin 40 thì nhận đúng 10 —
// ca đêm đọc một phần tư hạn mức và `TRAN_MOI_CA` thành số chết. Bắt được bằng lượt chạy thử
// thật 02/10/2026; phép kiểm KHÔNG bắt được vì chúng tiêm `layViec` giả không có cái kẹp đó.
// Bài học chung: hằng số trần của mình vô nghĩa nếu hàm được gọi có trần riêng nhỏ hơn.
//
// ⚠️ MỘT TRANG MỘT LƯỢT GỌI, không nhồi 10 trang vào một prompt. Lý do đã đo ở bot thẩm định:
// nhồi nhiều mục vào một lời gọi thì một mục hỏng làm hỏng cả lô, và model hay bỏ bớt mục ở
// cuối. Model rẻ nên 40 lượt/đêm không đáng kể.
//
// ⚠️ NGHỈ GIỮA CÁC LƯỢT. Ca chạy trong tiến trình CMS đang phục vụ blog và khu quản trị; đã đo
// 30/09/2026 rằng ca soi không nghỉ làm /demo/* treo 12 giây rồi đứt, 172 lần "failed to fetch".

import { jsonTuChu } from "./goi-model.mjs";
import { LOI_NHAC_TRICH, BOI_CANH } from "../loi-dan.mjs";
import { layViec as layViecThat, ghiPhanTich as ghiPhanTichThat } from "../mcp-viec.mjs";

/** Nghỉ giữa hai lượt gọi — không phải để chiều nhà cung cấp mà để nhường tiến trình CMS. */
export const NGHI_GIUA_LUOT_MS = 400;
/** Trang mỗi lượt chạy; `layViec` còn trần riêng 40 trang/đêm nên đây chỉ là trần của một ca. */
export const TRAN_MOI_CA = 40;

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Rút ba trường từ câu trả lời của model. Trả `null` khi không đọc được — người gọi đưa trang
 * đó vào `boQua` kèm lý do, KHÔNG lặng lẽ bỏ (trang bị bỏ lặng sẽ được giao lại đêm sau mãi).
 */
export function docKetQua(chu, id) {
	const j = jsonTuChu(chu);
	if (!j || typeof j !== "object") return null;
	// Model có thể trả một đối tượng, hoặc mảng một phần tử.
	const o = Array.isArray(j) ? j[0] : j;
	if (!o || typeof o !== "object") return null;
	const chuDe = String(o.chuDe ?? o.chu_de ?? "").trim();
	const mang = (x) => (Array.isArray(x) ? x.map((v) => String(v).trim()).filter(Boolean) : []);
	const tuKhoa = mang(o.tuKhoa ?? o.tu_khoa);
	const tomTat = mang(o.tomTat ?? o.tom_tat);
	if (!chuDe || !tuKhoa.length) return null;
	return { id: String(id), chuDe, tuKhoa: tuKhoa.slice(0, 8), tomTat: tomTat.slice(0, 8) };
}

/** Lời dặn: bối cảnh + cách đọc (dùng lại nguyên văn của đường MCP) + đòi JSON thuần. */
export const loiNhac = () =>
	`${BOI_CANH}\n\n${LOI_NHAC_TRICH}\n\nTRẢ LỜI: CHỈ một đối tượng JSON {"chuDe": "...", "tuKhoa": ["..."], "tomTat": ["..."]}. Không giải thích, không bọc trong khối mã.`;

/**
 * Đọc hết trang đang chờ bằng model, rồi ghi bằng `ghiPhanTich`.
 *
 * Lấy việc THEO LÔ cho tới khi hết hạn mức ca, hết hàng đợi, hoặc chạm trần lượt gọi model.
 * Mỗi lô ghi ngay sau khi đọc xong — ca bị ngắt giữa đường thì phần đã đọc không mất.
 *
 * `layViec`/`ghiPhanTich` tiêm được để phép kiểm chạy vòng lặp thật mà không cần kho —
 * mặc định là hai hàm thật của `mcp-viec.mjs`.
 *
 * @param {{s: object, kv: object, goiModel: object, log?: object, nowMs?: number,
 *   soTrang?: number, nghiMs?: number, layViec?: Function, ghiPhanTich?: Function}} p
 * @returns {Promise<{daDoc: number, daGhi: number, loi: number, boQua: number, luotGoi: number,
 *   soLo: number, conTrongHangCho: number, ghiChu: string[]}>}
 */
export async function tuDocTrang({ s, kv, goiModel, log, nowMs = Date.now(), soTrang = TRAN_MOI_CA, nghiMs = NGHI_GIUA_LUOT_MS, layViec = layViecThat, ghiPhanTich = ghiPhanTichThat, doiThuId }) {
	const ra = { daDoc: 0, daGhi: 0, loi: 0, boQua: 0, luotGoi: 0, soLo: 0, conTrongHangCho: 0, ghiChu: [] };
	if (!goiModel?.coCauHinh?.()) {
		const thieu = goiModel?.thieuCauHinh?.() ?? ["goiModel"];
		ra.ghiChu.push(`Chưa gọi được model: thiếu ${thieu.join(", ")} — hàng đợi đứng, KHÔNG phải hết việc.`);
		return ra;
	}

	const nhac = loiNhac();
	let conLai = Math.max(0, soTrang);
	let hetHanMuc = false;
	while (conLai > 0 && !hetHanMuc) {
		// Nhìn hạn mức TRƯỚC khi lấy lô: `layViec` đánh dấu trang là "đã giao đêm nay" và cộng
		// soLanGiao, nên lấy một lô rồi không đọc nổi là đốt oan một lượt giao (3 lượt chưa đọc
		// thì trang bị xếp 'loi'). Lô tối đa 10 trang nên phần đốt oan nhiều nhất là 10.
		if (!goiModel.conHanMuc()) {
			hetHanMuc = true;
			break;
		}
		const viec = await layViec({ s, kv, nowMs, soTrang: conLai, doiThuId });
		ra.conTrongHangCho = viec.conTrongHangCho ?? 0;
		if (!viec.trang?.length) {
			// Chỉ nói "trống/chạm trần" khi chưa lấy được lô nào — hết hàng đợi giữa ca là bình
			// thường, nói "trống" lúc đó là báo sai cho người đọc nhật ký.
			if (!ra.soLo) ra.ghiChu.push(viec.conLaiDemNay <= 0 ? "Đã chạm trần trang/đêm." : "Hàng đợi trống — không có trang nào chờ đọc.");
			break;
		}
		ra.soLo++;

		const ketQua = [];
		const boQua = [];
		for (const t of viec.trang) {
			if (!goiModel.conHanMuc()) {
				hetHanMuc = true;
				break;
			}
			const r = await goiModel.goi("doc_trang", nhac, t.chu);
			ra.luotGoi++;
			if (!r.ok) {
				ra.loi++;
				// KHÔNG đưa vào boQua: lỗi của phía mình (mạng, trần, nhà cung cấp) thì trang phải
				// được giao lại đêm sau. boQua là dành cho trang THẬT SỰ không đọc được.
				log?.warn?.(`Rada SEO: đọc trang ${t.id} hỏng — ${r.loi}`);
			} else {
				const kq = docKetQua(r.chu, t.id);
				if (kq) {
					ketQua.push(kq);
					ra.daDoc++;
				} else {
					// Model trả lời mà không ra ba trường → trang này không đọc được, nói rõ lý do.
					boQua.push({ id: t.id, lyDo: `Model trả lời không đúng dạng JSON ba trường (${String(r.chu).slice(0, 80)})` });
				}
			}
			if (nghiMs) await nghi(nghiMs);
		}

		if (ketQua.length || boQua.length) {
			const g = await ghiPhanTich({ s, kv, ketQua, boQua, nowMs });
			ra.daGhi += g.daGhi;
			ra.boQua += g.soDaBoQua;
			if (g.soThieuChuDe) ra.ghiChu.push(`${g.soThieuChuDe} kết quả bị bỏ vì thiếu chủ đề/từ khoá.`);
			if (g.boQua?.length) ra.ghiChu.push(`${g.boQua.length} id không ghi được (lạ hoặc không còn chờ đọc).`);
		}
		conLai -= viec.trang.length;
	}

	if (hetHanMuc) ra.ghiChu.push(`Dừng giữa ca: đã chạm trần lượt gọi (${goiModel.soLuotDaGoi()}). Trang còn lại giữ trong hàng đợi.`);
	if (ra.loi) ra.ghiChu.push(`${ra.loi} lượt gọi model hỏng — những trang đó GIỮ trong hàng đợi, sẽ đọc lại.`);
	return ra;
}
