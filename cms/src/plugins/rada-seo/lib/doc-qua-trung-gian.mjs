/**
 * ĐỌC QUA DỊCH VỤ TRUNG GIAN — đường lùi khi tải thẳng bị máy chủ đối thủ từ chối.
 *
 * VÌ SAO CÓ TỆP NÀY. Đo 07/10/2026: `nhathuoclongchau.com.vn` trả HTTP 403 kèm trang
 * "Attention Required! | Cloudflare" cho MỌI lượt tải — kể cả khi khai User-Agent của Chrome.
 * Hệ quả: kho giữ 0 URL của họ suốt nhiều ca, và nhật ký chỉ ghi "0 URL mới" — đọc ra hệt như
 * "đối thủ không đăng bài".
 *
 * ⚠️ Site đó phát HAI tín hiệu ngược nhau, và điều này phải ghi lại để người sau tự xét:
 *   · `robots.txt` (HTTP 200) khai `User-agent: *` và trỏ thẳng `Sitemap: /sitemap.xml`
 *   · Cloudflare đứng trước lại trả 403 cho mọi bot
 * Người dùng chốt 07/10/2026: đi đường trung gian, vì mục tiêu là mổ xẻ NỘI DUNG của một đối
 * thủ top ngành — thứ hạng thì đã biết, không cần đo.
 *
 * ⚠️ MẶC ĐỊNH TẮT. Mỗi lượt đi đường này là gửi URL sang một bên thứ ba, nên nó chỉ bật khi
 * người vận hành khai `RADA_SEO_TRUNG_GIAN` — cùng lối `TELEGRAM_BOT_TOKEN` / `GRAVITY_API_KEY`:
 * thiếu cấu hình thì NẰM IM, không lỗi.
 */

/**
 * Mã HTTP đáng thử lại qua trung gian.
 *
 * ⚠️ CỐ Ý HẸP. 404 là "trang không có" — đi đường vòng cho một trang không tồn tại là đốt lượt
 * gọi dịch vụ ngoài cho từng URL chết trong kho (hiện 62 dòng `loi`). 500/502 là máy chủ họ
 * hỏng, trung gian cũng nhận đúng cái lỗi đó. Chỉ ba mã dưới đây là dấu hiệu TỪ CHỐI BOT.
 */
export const MA_CAN_THU_LAI = Object.freeze(new Set([403, 429, 503]));

/** Mã này có đáng thử lại qua trung gian không. */
export function canThuTrungGian(ma) {
	return MA_CAN_THU_LAI.has(Number(ma));
}

/** Địa chỉ nội bộ / giao thức lạ — không bao giờ gửi sang dịch vụ ngoài. */
function laUrlNgoaiHopLe(u) {
	try {
		const x = new URL(String(u));
		if (x.protocol !== "https:" && x.protocol !== "http:") return false;
		const h = x.hostname.toLowerCase();
		if (h === "localhost" || h.endsWith(".localhost")) return false;
		// IPv4 riêng tư + loopback + link-local, và IPv6 loopback.
		if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h)) return false;
		if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
		if (h === "::1" || h === "[::1]") return false;
		return true;
	} catch {
		return false;
	}
}

/**
 * Dựng đường đọc qua trung gian, hoặc `null` khi không nên đi.
 *
 * `null` ở bốn trường hợp, mỗi cái có lý do riêng:
 *   · chưa khai gốc trung gian  → tính năng đang TẮT, đó là mặc định
 *   · URL nội bộ / giao thức lạ → không gửi địa chỉ nội bộ ra ngoài
 *   · URL đã là đường trung gian → chống vòng lặp
 *   · URL rỗng/hỏng
 *
 * @param {string} url Địa chỉ gốc muốn đọc.
 * @param {string} gocTrungGian Ví dụ "https://r.jina.ai/". Rỗng = tắt.
 * @returns {string|null}
 */
export function duongTrungGian(url, gocTrungGian) {
	const goc = String(gocTrungGian ?? "").trim();
	if (!goc) return null;
	const u = String(url ?? "").trim();
	if (!u || !laUrlNgoaiHopLe(u)) return null;
	// Chống vòng lặp: đã đi qua trung gian rồi thì thôi.
	let hostTrungGian = "";
	try {
		hostTrungGian = new URL(goc).hostname.toLowerCase();
	} catch {
		return null;
	}
	try {
		if (new URL(u).hostname.toLowerCase() === hostTrungGian) return null;
	} catch {
		return null;
	}
	return `${goc.replace(/\/+$/, "")}/${u}`;
}

/** Gốc trung gian đang khai, hoặc "" khi tắt. */
export function gocTrungGianCuaMoiTruong(env = process.env) {
	return String(env?.RADA_SEO_TRUNG_GIAN ?? "").trim();
}

/**
 * Hạn giờ RIÊNG cho đường trung gian — 90 s, gấp ba đường thẳng.
 *
 * ⚠️ ĐO THẬT 07/10/2026, và đây là chỗ cắm thẳng vào `hanGioMs` 30 s sẽ hỏng NGAY lần đầu:
 *   · `sitemap_benh.xml`     287 kB → 20,4 s
 *   · `sitemap_baiviet1.xml` 1,09 MB → **40,2 s**
 * Dịch vụ trung gian chạy trình duyệt thật (phải thế mới qua được thử thách của Cloudflare),
 * nên nó chậm hơn một lượt tải thường cả bậc. Dùng chung hạn 30 s thì sitemap lớn nào cũng
 * "quá hạn" — tức vẫn 0 URL, chỉ khác lý do ghi trong nhật ký.
 */
export const HAN_GIO_TRUNG_GIAN_MS = 90_000;
