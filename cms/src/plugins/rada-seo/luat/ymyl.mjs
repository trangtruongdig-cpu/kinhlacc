// Dò liều lượng, phác đồ và lời hứa kết quả trong bài máy viết. Trúng → nháp vẫn tạo nhưng
// mang cờ đỏ YMYL để người duyệt đọc kỹ; KHÔNG tự sửa (liều là nội dung, không phải hình thức).

const MAU = [
	{ loai: "lieu", mau: /\d+(?:[.,]\d+)?\s?(?:g|gam|gram|mg|ml|viên|thang|chén)(?!\p{L})/giu },
	{ loai: "phac_do", mau: /(?:ngày (?:uống|dùng|sắc)|mỗi ngày (?:uống|dùng|sắc)|liệu trình|phác đồ)[^.\n]{0,20}\d/giu },
	{ loai: "hua_hen", mau: /điều trị[^.:;!?\n]{0,40}hiệu quả|cam kết|100\s?%/giu },
];

/** @returns {{loai:'lieu'|'phac_do'|'hua_hen', doan:string}[]} */
export function doYmyl(vanBan) {
	// NFC: chữ dạng NFD (dán từ macOS/Word) không khớp mẫu nào.
	const s = String(vanBan ?? "").normalize("NFC");
	const ra = [];
	for (const { loai, mau } of MAU) for (const m of s.matchAll(mau)) ra.push({ loai, doan: m[0] });
	return ra;
}
