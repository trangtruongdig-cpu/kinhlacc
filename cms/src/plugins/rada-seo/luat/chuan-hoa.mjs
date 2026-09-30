// Chuẩn hoá chữ Việt cho các phép so khớp của Rada SEO.

/** Bỏ dấu thanh + dấu mũ, đ→d, về chữ thường. */
export function boDau(s) {
	return String(s ?? "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/đ/g, "d")
		.replace(/Đ/g, "D")
		.toLowerCase();
}

/** Bỏ dấu + thay mọi thứ không phải chữ/số bằng một khoảng trắng. */
export function chuanHoaManh(s) {
	return boDau(s).replace(/[^a-z0-9]+/g, " ").trim();
}
