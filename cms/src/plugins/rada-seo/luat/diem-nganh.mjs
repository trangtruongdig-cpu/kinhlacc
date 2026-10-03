// Chấm điểm NGÁCH cho một URL đối thủ, chỉ nhìn đường dẫn — chưa tải trang.
//
// VÌ SAO TỒN TẠI: sau khi đào sâu sitemap, một đối thủ có thể đưa về hàng chục nghìn URL
// (vinmec.com: 35.710). Khâu đọc bằng model là nút thắt — 40 trang/đêm, và mỗi trang là một
// lượt gọi tốn tiền. Đo 03/10/2026: hàng đợi 1.178 trang = 30 đêm.
//
// Đòn đúng KHÔNG phải "đọc nhanh hơn" (tốn tiền theo tỉ lệ) mà là **đọc cái đáng đọc trước**.
// Trong 35.710 URL của vinmec chỉ có 4 URL châm cứu và 42 URL Đông y; đọc theo thứ tự tình cờ
// thì xác suất chạm vào chúng gần bằng không.
//
// ⚠️ CHẤM ĐIỂM ĐỂ XẾP THỨ TỰ, TUYỆT ĐỐI KHÔNG ĐỂ LOẠI BỎ. Đường dẫn là tín hiệu nghèo: slug bỏ
// dấu nên "huyệt" và "huyết" trộn làm một (270 URL "huyet" của vinmec là huyết áp / sốt xuất
// huyết), và một bài Đông y hay có thể nằm dưới slug chẳng gợi gì. Loại theo slug là vu oan có
// hệ thống mà không ai đọc lại để biết. Mọi URL vẫn vào hàng đợi, chỉ khác chỗ đứng.

import { boDau } from "./chuan-hoa.mjs";

/** Dấu hiệu ĐÚNG NGÁCH, nặng nhất trước. Khớp trên đường dẫn đã bỏ dấu, gạch nối thành khoảng trắng. */
const NGACH = [
	[10, ["cham cuu", "bam huyet", "huyet dao", "day huyet", "cay chi", "nhi cham", "dien cham"]],
	[8, ["dong y", "y hoc co truyen", "co truyen", "kinh lac", "bai thuoc", "thang thuoc", "duoc lieu", "thao duoc", "vi thuoc"]],
	[6, ["xoa bop", "bam nguyet", "giac hoi", "ngai cuu", "cuu ngai", "duong sinh", "khi cong", "thuoc nam", "thuoc bac"]],
	[3, ["tri ", "chua ", "bai tap", "mon an", "thuc duong"]],
];

/**
 * Dấu hiệu KHÔNG phải nội dung chuyên môn. Trừ điểm chứ không loại: một trang "tin tức" vẫn có
 * thể là bài chuyên môn đăng ở mục tin.
 */
const NHIEU = [
	[-8, ["tuyen dung", "career", "bang gia", "chi phi", "lich kham", "dat lich", "chi nhanh", "co so", "lien he", "gioi thieu", "chinh sach", "dieu khoan", "tuyen sinh"]],
	[-5, ["bac si", "doctor", "chuyen gia", "goi kham", "goi tam soat", "khuyen mai", "uu dai", "su kien", "hoi nghi", "hoi thao", "thong bao", "bao gia"]],
	[-3, ["tin tuc", "news", "video", "hinh anh", "album"]],
];

/**
 * Điểm ngách của một URL. Càng cao càng đáng đọc trước. Mặc định 0 (không biết gì) — và 0 vẫn
 * nằm trong hàng đợi, chỉ đứng sau.
 */
export function diemNganh(url) {
	let duong;
	try {
		duong = new URL(url).pathname + (new URL(url).search || "");
	} catch {
		duong = String(url ?? "");
	}
	try {
		duong = decodeURIComponent(duong);
	} catch {}
	const chu = ` ${boDau(duong).replace(/[^a-z0-9]+/g, " ").trim()} `;
	// Mỗi BẬC cộng nhiều nhất một lần (break), nhưng các bậc cộng dồn với nhau: "xoa bóp bấm
	// huyệt chữa…" được cả bậc 10, bậc 6 và bậc 3.
	let diem = 0;
	for (const [d, ds] of [...NGACH, ...NHIEU]) {
		for (const t of ds) {
			if (chu.includes(t)) {
				diem += d;
				break;
			}
		}
	}
	return diem;
}

/**
 * Xếp danh sách URL theo điểm ngách giảm dần, hoà thì GIỮ NGUYÊN thứ tự vào (sort ổn định) —
 * thứ tự vào là mới-trước, và đó là tiêu chí phụ đúng.
 */
export function xepTheoNganh(ds, layUrl = (x) => x.url) {
	return [...ds]
		.map((x, i) => ({ x, i, d: diemNganh(layUrl(x)) }))
		.sort((a, b) => b.d - a.d || a.i - b.i)
		.map((o) => o.x);
}
