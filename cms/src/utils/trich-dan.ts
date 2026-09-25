// trich-dan.ts — Phân tích chuỗi nguồn trong y văn thành trích dẫn có cấu trúc.
//
// Kho CD ghi nguồn theo hai dạng, đo trên 228 tên nguồn khác nhau (25/09/2026):
//   Tạp chí: "Triết Giang Trung Y Tạp Chí 1992 (2): 401"  — có năm, số, trang
//   Sách:    "Trung Quốc Đương Đại Trung Y Danh Nhân Chí"  — chỉ tên
//
// Phân biệt được hai dạng mới khai đúng cho Google: tạp chí là ScholarlyArticle nằm trong một
// Periodical, sách là Book. Khai bừa một loại thì mất phần lớn giá trị của tín hiệu này.

export interface TrichDan {
	loai: "tap_chi" | "sach";
	ten: string;
	nam?: string;
	so?: string;
	trang?: string;
	gocGac: string;
}

const TAP_CHI = /^(.*?)\s*(\d{4})\s*(?:[,(]\s*(\d{1,3})\s*\)?)?\s*(?:[:,]\s*(\d{1,5}))?\s*$/u;

export function phanTichNguon(raw: string): TrichDan | null {
	const s = (raw || "").trim().replace(/\s+/g, " ");
	if (s.length < 5 || s.length > 160) return null;

	// Bỏ tiền tố dẫn nhập: "Trích trong Thiên Gia Diệu Phương" -> "Thiên Gia Diệu Phương".
	const sach = s.replace(/^(Trích\s+(trong|từ)|Theo|Dẫn\s+theo|Xem)\s+/iu, "").trim();

	const m = TAP_CHI.exec(sach);
	if (m && m[2]) {
		const ten = (m[1] || "").replace(/[,;]+$/, "").trim();
		if (ten.length >= 3) {
			return { loai: "tap_chi", ten, nam: m[2], so: m[3], trang: m[4], gocGac: sach };
		}
	}
	// Không có năm => coi là sách/chuyên khảo.
	return { loai: "sach", ten: sach, gocGac: sach };
}

/**
 * Có thật là nguồn y văn không?
 *
 * Ngoặc đơn trong y văn dùng cho NHIỀU việc, không chỉ ghi nguồn. Lần đầu tôi nhặt hết thì
 * lẫn cả tên vị thuốc ("Hoàng đậu", "Huyền sâm", "Trư nhục") và hướng dẫn nấu ("cho vào sau")
 * vào danh sách trích dẫn — khai những thứ đó cho Google là tự hạ uy tín trang.
 *
 * Phân biệt được nhờ chính tả: tên sách và tạp chí Hán-Việt viết hoa MỌI chữ
 * ("Kim Quỹ Yếu Lược", "Sơn Tây Trung Y Tạp Chí"), còn tên vị thuốc chỉ hoa chữ đầu
 * ("Hoàng đậu"). Ngưỡng 3 chữ hoa loại sạch nhóm sau mà không cắt nhầm nhóm trước.
 */
function laNguon(td: TrichDan): boolean {
	if (td.loai === "tap_chi") return true;          // đã có năm => chắc chắn là nguồn
	// Danh sách vị thuốc cũng toàn chữ hoa ("Đảng sâm, Bạch truật, Bạch linh, Cam thảo") nên
	// lọt qua phép đếm chữ hoa. Dấu phẩy là chỗ phân biệt: tên sách Hán-Việt không có dấu phẩy.
	if ((td.ten.match(/,/g) || []).length >= 2) return false;
	const tu = td.ten.split(/\s+/).filter(Boolean);
	if (tu.length < 3) return false;
	const hoa = tu.filter((x) => /^\p{Lu}/u.test(x)).length;
	return hoa >= 3;
}

/** Rút mọi nguồn trong ngoặc đơn từ các đoạn Portable Text. */
export function rutNguon(...phan: any[]): TrichDan[] {
	const thay = new Map<string, TrichDan>();
	for (const pt of phan) {
		if (!Array.isArray(pt)) continue;
		for (const b of pt) {
			if (b?._type !== "block") continue;
			const t = (b.children ?? []).map((c: any) => c?.text ?? "").join("");
			for (const m of t.matchAll(/\(([^)]{6,160})\)/gu)) {
				const td = phanTichNguon(m[1]);
				if (!td || !laNguon(td)) continue;
				if (!thay.has(td.gocGac)) thay.set(td.gocGac, td);
			}
		}
	}
	return [...thay.values()];
}

/** Đổi sang JSON-LD citation. Tạp chí -> ScholarlyArticle, sách -> Book. */
export function citationLd(ds: TrichDan[]): any[] {
	return ds.map((d) =>
		d.loai === "tap_chi"
			? {
					"@type": "ScholarlyArticle",
					isPartOf: { "@type": "Periodical", name: d.ten },
					...(d.nam ? { datePublished: d.nam } : {}),
					...(d.so ? { issueNumber: d.so } : {}),
					...(d.trang ? { pagination: d.trang } : {}),
				}
			: { "@type": "Book", name: d.ten },
	);
}
