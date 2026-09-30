// Chuẩn bị markdown của lò viết cho `markdownToPortableText` của EmDash.
//
// Bộ chuyển đó đi theo DÒNG: mỗi dòng không rỗng thành một khối, đoạn văn viết xuống dòng giữa
// chừng KHÔNG được nối lại (khác markdown chuẩn). Mô hình hay ngắt dòng giữa câu, nên nếu đưa
// thẳng vào thì một đoạn văn thành ba bốn đoạn cụt. Tệp này nối lại trước khi chuyển.
//
// Cố ý KHÔNG import `emdash/client` ở đây: việc gọi bộ chuyển thật để sau, khi đã đo thử rằng
// nó nạp được trong tiến trình plugin. Tệp này là hàm thuần, chạy được dưới `node --test`.

const RAO_CODE = /^\s*```/u;
const TIEU_DE = /^ {0,3}#{1,6}(?:\s|$)/u;
// Đường kẻ ngang (---, ***, - - -) phải xét TRƯỚC danh sách: "- - -" cũng mở bằng "- ".
const DUONG_KE = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/u;
const MUC_DS = /^\s*(?:[-*+]|\d+[.)])\s+/u;
const TRICH = /^\s*>/u;
const BANG = /^\s*\|/u;

/**
 * @param {string} md
 * @returns {string}
 */
export function chuanHoaMd(md) {
	const ra = [];
	// Loại dòng vừa ghi: "doan" (đoạn văn), "muc" (mục danh sách), "khac" (tiêu đề, trích, bảng…),
	// "trong" (dòng trống). Chỉ "doan" và "muc" nhận dòng nối vào.
	let loai = "trong";
	let trongCode = false;

	for (const tho of String(md ?? "").replace(/\r\n?/gu, "\n").split("\n")) {
		if (trongCode) {
			// Trong khối code: giữ NGUYÊN từng dòng, kể cả dòng trống liên tiếp.
			ra.push(tho);
			if (RAO_CODE.test(tho)) {
				trongCode = false;
				loai = "khac";
			}
			continue;
		}
		const d = tho.trimEnd();
		if (RAO_CODE.test(d)) {
			ra.push(d);
			trongCode = true;
			continue;
		}
		if (!d) {
			// Tối đa một dòng trống liên tiếp.
			if (ra.length && ra[ra.length - 1] !== "") ra.push("");
			loai = "trong";
			continue;
		}
		if (TIEU_DE.test(d) || DUONG_KE.test(d) || TRICH.test(d) || BANG.test(d)) {
			ra.push(d);
			loai = "khac";
		} else if (MUC_DS.test(d)) {
			ra.push(d);
			loai = "muc";
		} else if (loai === "doan" || (loai === "muc" && /^\s/u.test(d))) {
			// Dòng tiếp của đoạn văn, hoặc dòng tiếp nối (thụt lề, không dấu mục) của mục danh sách.
			ra[ra.length - 1] += " " + d.trim();
		} else {
			ra.push(d);
			loai = "doan";
		}
	}

	while (ra.length && ra[0] === "") ra.shift();
	while (ra.length && ra[ra.length - 1] === "") ra.pop();
	return ra.join("\n");
}
