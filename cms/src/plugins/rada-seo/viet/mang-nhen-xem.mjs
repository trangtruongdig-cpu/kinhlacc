// Gom sổ `goi_y_nguoc` thành SƠ ĐỒ xem được.
//
// Kho khoá theo contentId của bài CŨ (vì khung Phiếu Rada mở theo bài đang sửa), nên đọc thẳng
// ra thì chỉ thấy từng mẩu rời. Muốn nhìn thành mạng thì phải lật ngược: mỗi BÀI MỚI là một
// trung tâm, các bài cũ nên trỏ về nó là nan hoa.
//
// ⚠️ ĐỀ XUẤT, KHÔNG PHẢI ĐÃ CHÈN. Mọi con số ở đây là việc CHỜ người biên tập bấm — xem ghi chú
// ở lien-ket-nguoc.mjs. Gọi nó là "liên kết" trên màn hình là nói dối: trang thật chưa có link
// nào trong số đó.

/**
 * @param {{id: string, capNhat?: string, ds: {slug, tieuDe, neo, canVietThem, lyDo, luc}[]}[]} so
 *   mỗi phần tử = một BÀI CŨ.
 * @param {Map<string, {tieuDe?: string, slug?: string}>} tenBaiCu  contentId → tên bài cũ
 * @returns {{trungTam: object[], soDeXuat: number, soBaiCu: number, soCanVietThem: number}}
 */
export function gomMangNhen(so, tenBaiCu = new Map()) {
	const theoMoi = new Map();
	let soDeXuat = 0;
	let soCanVietThem = 0;
	const baiCu = new Set();
	for (const hang of so ?? []) {
		const cu = tenBaiCu.get(String(hang.id)) ?? {};
		for (const g of hang.ds ?? []) {
			soDeXuat++;
			baiCu.add(String(hang.id));
			if (g.canVietThem) soCanVietThem++;
			const k = String(g.slug ?? "");
			const t = theoMoi.get(k) ?? { slug: k, tieuDe: g.tieuDe ?? k, nan: [] };
			t.nan.push({
				id: String(hang.id),
				tieuDeCu: cu.tieuDe ?? "",
				slugCu: cu.slug ?? "",
				neo: g.neo ?? "",
				canVietThem: !!g.canVietThem,
				lyDo: g.lyDo ?? "",
				luc: g.luc ?? hang.capNhat ?? "",
			});
			theoMoi.set(k, t);
		}
	}
	const trungTam = [...theoMoi.values()].map((t) => ({
		...t,
		soNan: t.nan.length,
		// Bài có NEO SẴN xếp trước: việc đó chỉ là bọc một cụm có sẵn thành link, rẻ hơn hẳn
		// việc phải viết thêm một câu (xem lien-ket-nguoc.mjs).
		nan: [...t.nan].sort((a, b) => Number(a.canVietThem) - Number(b.canVietThem)),
		soCanVietThem: t.nan.filter((x) => x.canVietThem).length,
	}));
	// Trung tâm nhiều nan trước — đó là bài mới đang được đỡ nhiều nhất.
	trungTam.sort((a, b) => b.soNan - a.soNan || String(a.tieuDe).localeCompare(String(b.tieuDe)));
	return { trungTam, soDeXuat, soBaiCu: baiCu.size, soCanVietThem };
}

/**
 * Toạ độ nan hoa cho sơ đồ SVG: trung tâm ở giữa, các nan rải đều trên vòng tròn.
 * Hàm THUẦN để kiểm được — vẽ hình mà không kiểm thì lệch một nan cũng không ai biết.
 */
export function toaDoNanHoa(soNan, { r = 110, cx = 160, cy = 130 } = {}) {
	const n = Math.max(0, soNan);
	return Array.from({ length: n }, (_, i) => {
		// Bắt đầu từ -90° (đỉnh) để nan đầu tiên — nan rẻ nhất — nằm trên cùng.
		const g = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
		return { x: Math.round((cx + r * Math.cos(g)) * 10) / 10, y: Math.round((cy + r * Math.sin(g)) * 10) / 10 };
	});
}
