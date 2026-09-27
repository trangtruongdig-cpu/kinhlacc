/**
 * NÓI LẠI LỜI TỪ CHỐI CỦA EMDASH BẰNG TIẾNG VIỆT.
 *
 * Phần THUẦN của `src/middleware.ts` — không chạm mạng, không chạm CSDL — để kiểm được:
 *
 *     node --test src/lib/loi-tieng-viet.test.ts
 *
 * Vì sao đáng làm riêng cho hai câu này: cả hai đều đã khiến người dùng chẩn đoán sai.
 *
 *   • Câu mốc thời gian không nhắc tới mục nào, cũng không nói phải làm gì. Ngày
 *     26/09/2026 nó bị đoán thành "trùng link", và cuộc truy tìm đi nhầm hướng cho tới
 *     khi có người quét cả kho mới thấy 18.205 mục cùng dính.
 *   • Câu trùng slug nói "đã tồn tại" mà không nói của AI, nên phải đi tìm tay.
 */

/** Mốc thời gian không đúng ISO 8601 — xem `scripts-di-cu/kiem-moc-thoi-gian.mjs`. */
const RE_MOC_HONG = /Datetime "([^"]+)" is not a valid ISO 8601 datetime/;

/** Slug đã có người dùng. EmDash trả kèm `error.code = "SLUG_CONFLICT"`. */
const RE_TRUNG_SLUG = /Slug '([^']*)' already exists|staged slug is already used/;

export interface ChuSlug {
	/** Tiêu đề mục đang giữ slug, có thể trống ở bộ không có cột title. */
	title?: string | null;
	id: string;
}

export type LoiDaDich =
	| { loai: "moc-thoi-gian"; giaTri: string; cau: string }
	| { loai: "trung-slug"; slug: string; cau: string }
	| null;

/**
 * Dịch một câu từ chối, hoặc trả `null` nếu không nhận ra.
 *
 * `chu` là mục đang giữ slug, nếu nơi gọi tra được. Không tra được thì câu vẫn đứng
 * vững, chỉ thiếu phần chỉ đích danh.
 */
export function dichLoiEmDash(cauGoc: string, chu?: ChuSlug | null): LoiDaDich {
	const moc = RE_MOC_HONG.exec(cauGoc);
	if (moc) {
		return {
			loai: "moc-thoi-gian",
			giaTri: moc[1],
			cau:
				`Mục này có mốc thời gian sai định dạng (${moc[1]}) nên EmDash không đăng được. ` +
				`Đây KHÔNG phải lỗi trùng đường dẫn. ` +
				`Cách sửa: chạy \`node scripts-di-cu/va-moc-thoi-gian.mjs --ghi\` trong thư mục cms.`,
		};
	}

	const trung = RE_TRUNG_SLUG.exec(cauGoc);
	if (trung) {
		const slug = trung[1] ?? "";
		const ten = chu?.title?.trim() || chu?.id;
		return {
			loai: "trung-slug",
			slug,
			cau: ten
				? `Đường dẫn "${slug}" đã có mục khác dùng rồi: “${ten}”. Hãy đổi sang đường dẫn khác.`
				: slug
					? `Đường dẫn "${slug}" đã có mục khác trong bộ này dùng rồi. Hãy đổi sang đường dẫn khác.`
					: `Đường dẫn vừa đặt đã có mục khác trong bộ này dùng rồi. Hãy đổi sang đường dẫn khác.`,
		};
	}

	return null;
}

/** Tên bộ lấy từ đường dẫn API có an toàn để ghép vào tên bảng không? */
export function boHopLe(bo: string): boolean {
	return /^[a-z0-9_]+$/i.test(bo);
}
