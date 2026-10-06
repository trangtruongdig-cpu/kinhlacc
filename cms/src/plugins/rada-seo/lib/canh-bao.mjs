/**
 * LUẬT CẢNH BÁO — MỘT bản duy nhất, dùng chung cho route `tong-quan` và route `viec`.
 *
 * ⚠️ Vì sao file này tồn tại: luật từng được gõ HAI LẦN (plugin.mjs ở `tong-quan` và ở `viec`),
 * ngay dưới một chú thích khẳng định "không viết bản thứ hai". Đó đúng lớp lỗi `mcp-bridge.mjs`
 * mà CLAUDE.md kể — và lần này bản thứ hai mới là bản người dùng NHÌN THẤY, vì nó nuôi tab mặc
 * định.
 */

/** Quá hạn này mà chưa có ca thành công thì mới kết tội. Ca chạy 02:30 mỗi đêm. */
export const HAN_CANH_BAO_MS = 26 * 60 * 60 * 1000;

const mang = (x) => (Array.isArray(x) ? x : []);

/** Tuổi (ms) của ca GẦN NHẤT thoả `dieuKien`; Infinity nếu không có ca nào. */
function tuoiCa(dsCa, dieuKien, nowMs) {
	let moiNhat = 0;
	for (const c of mang(dsCa)) {
		if (!dieuKien(c)) continue;
		const t = Date.parse(c?.batDau ?? "");
		if (Number.isFinite(t) && t > moiNhat) moiNhat = t;
	}
	return moiNhat ? nowMs - moiNhat : Number.POSITIVE_INFINITY;
}

/** Ca radar THẬT: có ghi, đã kết thúc, và mang dấu vết của khâu trích. */
const laCaRadarThat = (c) => c?.loai === "radar" && c?.ghi && c?.ketThuc && typeof c?.soSeTrich === "number";

/**
 * Ca đêm trễ. ⚠️ Chỉ kết tội máy THẬT SỰ bật ca đêm (`RADA_SEO_CA_DEM=1`) — máy không chạy ca
 * thì không có gì để trễ, và báo đỏ ở đó là vu oan.
 */
export function canhBaoCaDem(dsCa, caDemBat, nowMs = Date.now()) {
	return !!caDemBat && tuoiCa(dsCa, laCaRadarThat, nowMs) > HAN_CANH_BAO_MS;
}

/**
 * Khâu đọc trang bằng model đã kẹt.
 *
 * ⚠️ Nhận CẢ HAI tín hiệu, và đây là phần chịu lực: đường TỰ HÀNH ghi số trang đã đọc vào ca
 * `radar` dưới khoá `soDocAi` (`ca-radar.mjs`), còn ca `loai: "claude"` chỉ sinh ra từ route MCP.
 * Bản đầu chỉ dò ca `claude` nên trên VPS tự hành nó luôn đúng — biến một trạng thái BÌNH THƯỜNG
 * (hàng chờ dao động 40–80 theo thiết kế) thành báo động đỏ vĩnh viễn ở bậc 0.
 *
 * `choAi === 0` thì không bao giờ cảnh báo: không có gì để đọc thì không đọc là đúng.
 */
export function canhBaoDocTrang(dsCa, choAi, nowMs = Date.now()) {
	if (!(Number(choAi) > 0)) return false;
	const daDoc = (c) => (c?.loai === "radar" && (c?.soDocAi ?? 0) > 0) || (c?.loai === "claude" && c?.ketThuc && (c?.soDoc ?? 0) > 0);
	return tuoiCa(dsCa, daDoc, nowMs) > HAN_CANH_BAO_MS;
}
