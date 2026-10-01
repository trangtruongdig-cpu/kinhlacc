// Mã lý do của lò viết → câu tiếng Việt. Nghiệm thu 2C-3 (Bất ngờ 5, 6): lời bác trả cho Claude và
// `loiCuoi` hiện cho người quản trị in MÃ trần ("khong_phai_nguon") — routine còn đoán được, người
// duyệt thì không. Mã vẫn đi kèm (khoá `ma`) để tra trong mã nguồn và để phép kiểm bám vào.
// Thuần, không import gì: viec.mjs (lời bác + phiếu) và dang.mjs (khung, tab Nháp) dùng chung.

const NGUON = {
	thieu_tieu_de: "nguồn không có tên",
	khong_phai_nguon: "đường này thuộc chính site nhưng không phải trang nguồn tham khảo — chỉ nhận trang /nguon/<tên sách>/ có tên khớp tiêu đề nguồn",
	khong_co_trang_nguon: "kho không có trang /nguon/ nào trùng tên này — nguồn không kèm URL phải là sách có sẵn trong kho",
	trang_noi_bo_khong_song: "trang /nguon/ này không mở được trên site thật",
	trang_nguon_khong_song: "kho có tên sách này nhưng trang /nguon/ của nó không mở được trên site thật",
	url_bi_chan: "URL không được phép tải — chỉ nhận http/https tới tên miền công khai",
	noindex: "trang nguồn tự khai không cho lập chỉ mục nên không dùng làm căn cứ",
	loi_tai: "không tải được trang nguồn",
	trung_url: "trùng URL với một nguồn đã nhận trong cùng lượt",
	vuot_tran: "vượt trần số nguồn mỗi lượt nên không được xét",
	het_gio_tong: "hết hạn giờ của cả lượt xác minh trước khi xét tới nguồn này",
};

const LINK = {
	link_ngoai: "link ra ngoài site — thân bài chỉ giữ link nội bộ, nguồn đi vào trường nguồn tham khảo",
	khong_dat: "trang đích không mở được hoặc tên trang không khớp chữ neo",
	loi_kiem: "kiểm trang đích bị lỗi nên không xác nhận được",
	neo_trong_trang: "link neo trong trang (#…) — trang chưa dựng neo mục",
	vuot_tran: "vượt trần số link ngoài kế hoạch được kiểm mỗi lượt nên không được xét",
	het_gio: "hết hạn giờ kiểm link của cả lượt trước khi xét tới link này",
};

/** Câu cho một mã bỏ nguồn. `chiTiet` (lý do tải hỏng, đã là tiếng Việt) được nối sau. */
export function cauLyDoNguon(ma, chiTiet = "") {
	const m = String(ma ?? "");
	const http = m.match(/^http_(\d{3})$/);
	const cau = http ? `máy chủ của nguồn trả mã ${http[1]} (cần 200)` : NGUON[m] ?? `bị bỏ vì lý do khác (mã ${m || "?"})`;
	return chiTiet ? `${cau}: ${chiTiet}` : cau;
}

/** Câu cho một mã gỡ link trong thân bài. */
export function cauLyDoLink(ma) {
	const m = String(ma ?? "");
	return LINK[m] ?? `bị gỡ vì lý do khác (mã ${m || "?"})`;
}

/**
 * Mục bị bỏ → `lyDo` là câu, mã giữ ở `ma`. Mục đã có `ma` (đã đổi) trả nguyên; phiếu cũ lưu
 * `lyDo` = mã nên đọc lại qua hàm này vẫn ra câu.
 */
export function kemCauNguon(b) {
	if (!b || typeof b !== "object" || b.ma) return b;
	const { chiTiet, ...con } = b;
	return { ...con, ma: String(b.lyDo ?? ""), lyDo: cauLyDoNguon(b.lyDo, chiTiet ? String(chiTiet) : "") };
}
export function kemCauLink(g) {
	if (!g || typeof g !== "object" || g.ma) return g;
	return { ...g, ma: String(g.lyDo ?? ""), lyDo: cauLyDoLink(g.lyDo) };
}

/**
 * Bộ chuyển markdown của EmDash tách link bằng `\[(.+?)\]\((.+?)\)` nên href bị cắt ở ngoặc đóng
 * ĐẦU TIÊN: "[x](javascript:alert(1))" → "javascript:alert(1". Tìm lại trong markdown và nối phần
 * còn lại tới khoảng trắng, bỏ đúng một ngoặc đóng cuối (ngoặc đóng của cú pháp link).
 */
export function hrefDayDu(md, href) {
	const h = String(href ?? "");
	const s = String(md ?? "");
	const i = h ? s.indexOf(`](${h})`) : -1;
	if (i < 0) return h;
	const duoi = s.slice(i + 2 + h.length).match(/^\S*/u)[0];
	// duoi luôn mở đầu bằng ")" (ngoặc bộ chuyển coi là đóng link). Còn ")" nữa phía sau thì ngoặc
	// CUỐI CÙNG mới là ngoặc đóng thật — phần trước nó thuộc href.
	const cuoi = duoi.lastIndexOf(")");
	return cuoi > 0 ? h + duoi.slice(0, cuoi) : h;
}

/** Trích href vào lời báo: bỏ ký tự điều khiển / xuống dòng, nháy kép → nháy đơn, tối đa `tran` ký tự. */
export function trichHref(href, tran = 120) {
	const t = [...String(href ?? "").replace(/[\u0000-\u001f\u007f\u2028\u2029]/gu, "").replace(/"/gu, "'")];
	return t.length > tran ? `${t.slice(0, tran - 1).join("")}…` : t.join("");
}
