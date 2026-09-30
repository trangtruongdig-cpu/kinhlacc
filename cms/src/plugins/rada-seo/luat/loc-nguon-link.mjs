// Rào chống bịa cho nguồn tham khảo và liên kết nội bộ — cùng tinh thần "trích dẫn phải
// khớp thật" của bot thẩm định: thứ gì không trỏ tới một chỗ CÓ THẬT thì bị gỡ.

const NHOM_TU_DIEN = /^\/(huyet|kinh|benh-hoc|cham-cuu-tri-benh|nguon|bai-thuoc|duoc-lieu)\//;

/** Đường dẫn nội bộ về dạng chuẩn: bỏ query/hash, luôn có "/" cuối. */
export function chuanDuong(href) {
	const p = String(href).split(/[?#]/)[0];
	return p.endsWith("/") ? p : `${p}/`;
}

/** URL ngoài về dạng so khớp: bỏ hash, bỏ "/" cuối. */
function chuanUrl(u) {
	return String(u).split("#")[0].replace(/\/+$/, "");
}

/**
 * Giữ nguồn là URL đã thật sự quét được, hoặc một trang /nguon/ có thật.
 * Nguồn không có URL (tên sách mô hình nhớ ra) bị loại.
 * @param {{ten:string, url?:string}[]} ds
 * @param {{urlDaQuet:Set<string>, duongCoThat:Set<string>}} kho
 */
export function locNguon(ds, { urlDaQuet, duongCoThat }) {
	const quet = new Set([...urlDaQuet].map(chuanUrl));
	const giu = [], bo = [];
	for (const n of ds ?? []) {
		const u = n?.url;
		const ok = !!u && (u.startsWith("/") ? duongCoThat.has(chuanDuong(u)) : quet.has(chuanUrl(u)));
		(ok ? giu : bo).push(n);
	}
	return { giu, bo };
}

/**
 * Gỡ link nội bộ trỏ tới trang không có (giữ lại chữ), đếm link còn lại vào từ điển.
 * @param {string} md
 * @param {Set<string>} duongCoThat  đường dẫn dạng chuanDuong
 */
export function locLink(md, duongCoThat) {
	const goBo = [];
	let soLinkTuDien = 0;
	const ra = String(md ?? "").replace(/(?<!!)\[([^\]]+)\]\((\/[^)\s]*)\)/g, (toan, chu, href) => {
		const d = chuanDuong(href);
		if (!duongCoThat.has(d)) {
			goBo.push(href);
			return chu;
		}
		if (NHOM_TU_DIEN.test(d)) soLinkTuDien++;
		return toan;
	});
	return { md: ra, goBo, soLinkTuDien };
}
