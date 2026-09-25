// anh.ts — Dựng URL ảnh từ trường kiểu image của EmDash.
//
// Trường image lưu { id, meta: { storageKey } }. Tệp trên đĩa đặt tên theo storageKey,
// KHÁC id — dựng URL bằng id thì /_emdash/api/media/file/<id> trả 404, mà thẻ <img> vẫn
// hiện nên nhìn qua tưởng có ảnh.
export function urlAnh(img: unknown, goc: string): string | undefined {
	// EmDash lưu trường ảnh vào cột kiểu TEXT, nên đọc qua API của nó thì được object,
	// còn truy vấn SQL thô thì được CHUỖI JSON. Không nhận cả hai thì ảnh biến mất ở
	// đúng những trang tự truy vấn — im lặng, không lỗi, chỉ là thẻ <img> không dựng ra.
	if (typeof img === "string") {
		const t = img.trim();
		if (!t.startsWith("{")) return undefined;
		try {
			img = JSON.parse(t);
		} catch {
			return undefined;
		}
	}
	if (!img || typeof img !== "object") return undefined;
	const a = img as Record<string, unknown>;
	if (typeof a.src === "string" && a.src) {
		return a.src.startsWith("http") ? a.src : `${goc}${a.src}`;
	}
	const meta = a.meta as Record<string, unknown> | undefined;
	const khoa =
		(typeof meta?.storageKey === "string" ? meta.storageKey : undefined) ||
		(typeof a.id === "string" ? a.id : undefined);
	return khoa ? `${goc}/_emdash/api/media/file/${khoa}` : undefined;
}
