// doc-bai-blog.ts — Đọc các bài bai_viet ĐÃ ĐĂNG và đưa về hình dữ liệu của khung-blog.mjs.
//
// Dùng chung cho ba trang /blog/ (bài, danh sách, sitemap) để cả ba nhìn CÙNG một danh sách:
// cùng thứ tự (mới nhất trước theo ngày đăng THẬT của bài, không phải lúc bản ghi được tạo
// trong CMS — publishedAt của 11 bài di cư đều là 25/09/2026), cùng luật noindex.
import { getEmDashCollection, getTermsForEntries } from "emdash";
import { getDb } from "emdash/runtime";

import { baiTuEntry, gocCongKhai } from "./khung-blog.mjs";

export type BaiKhung = ReturnType<typeof baiTuEntry>;

/**
 * Origin công khai. KHÔNG dùng Astro.url.origin: sau Caddy+nginx CMS thấy mình là http://
 * (@astrojs/node không đọc X-Forwarded-Proto) nên canonical/og/JSON-LD sẽ ra http.
 */
export const gocBlog = (): string => gocCongKhai(process.env.EMDASH_SITE_URL);
export const gaIdBlog = (): string | undefined => process.env.GA_ID || undefined;

/**
 * Nhãn chuyên mục (chuyen_muc) và slug cụm (cum) của một lô bài — mỗi taxonomy MỘT truy vấn.
 * Tra hỏng thì trả rỗng: thiếu nhãn chuyên mục là xấu đi một chút, không đáng làm sập trang.
 */
export async function nhanPhanLoai(ids: string[]): Promise<Map<string, { category?: string; cluster?: string }>> {
	const kq = new Map<string, { category?: string; cluster?: string }>();
	if (!ids.length) return kq;
	try {
		const [chuyenMuc, cum] = await Promise.all([
			getTermsForEntries("bai_viet", ids, "chuyen_muc"),
			getTermsForEntries("bai_viet", ids, "cum"),
		]);
		for (const id of ids) {
			kq.set(id, { category: chuyenMuc.get(id)?.[0]?.label, cluster: cum.get(id)?.[0]?.slug });
		}
	} catch (e) {
		console.warn("[blog] không tra được chuyên mục/cụm của bài viết:", e);
	}
	return kq;
}

/**
 * Id các bài bật ô SEO "Hide from search engines" (`_emdash_seo.seo_no_index`) — MỘT truy vấn.
 *
 * Vì sao phải tra riêng: getEmDashCollection KHÔNG gắn `seo` vào entry (EmDash 0.39.1 chỉ nối
 * `_emdash_seo` ở đường đọc MỘT bài). Đo trên bàn thử 01/10/2026: bài bật ô đó có meta noindex
 * ở trang bài nhưng vẫn nằm trong /blog/ và /blog/sitemap.xml — sitemap khai một URL noindex.
 *
 * getDb() của emdash/runtime trả đúng handle Kysely mà loader đang dùng (cùng pool, không mở
 * kết nối mới — Aiven chỉ có ~11 slot). Tra hỏng → coi như cho index (hành vi cũ) và KÊU.
 */
async function traNoIndex(): Promise<Set<string>> {
	try {
		const db = await getDb();
		const dong = await db
			.selectFrom("_emdash_seo")
			.select("content_id")
			.where("collection", "=", "bai_viet")
			.where("seo_no_index", "=", 1)
			.execute();
		return new Set(dong.map((d) => String(d.content_id)));
	} catch (e) {
		console.warn("[blog] không tra được ô SEO noindex của bài viết:", e);
		return new Set();
	}
}

/**
 * Ảnh bìa chỉ là ID TRẦN (chuỗi, hoặc object thiếu meta.storageKey) → tra storage_key trong bảng
 * media rồi trả object đủ để khung dựng được <img>. Một truy vấn cho cả lô, và chỉ chạy khi có
 * bài như vậy.
 *
 * Vì sao có: bản lò viết trước 01/10/2026 ghi featured_image bằng id trần vào revision nháp,
 * Publish chép nó lên cột, và khung (chỉ dựng ảnh khi có storageKey — /file/<id> trả 404) bỏ
 * ảnh bìa. Lò viết đã sửa, nhưng nháp tạo trước đó vẫn mang id trần.
 */
function idAnhTran(v: unknown): string | undefined {
	if (typeof v === "string") {
		const t = v.trim();
		if (!t) return undefined;
		if (!t.startsWith("{")) return /^[A-Za-z0-9_-]{1,64}$/.test(t) ? t : undefined;
		try {
			v = JSON.parse(t);
		} catch {
			return undefined;
		}
	}
	if (!v || typeof v !== "object") return undefined;
	const o = v as { id?: unknown; src?: unknown; provider?: unknown; meta?: { storageKey?: unknown } };
	if (typeof o.src === "string" && o.src) return undefined;
	if (typeof o.meta?.storageKey === "string" && o.meta.storageKey) return undefined;
	if (o.provider && o.provider !== "local") return undefined;
	return typeof o.id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(o.id) ? o.id : undefined;
}

export async function lamDayAnhBia<T extends { data: object }>(entries: readonly T[]): Promise<T[]> {
	const can = new Map<number, string>();
	entries.forEach((e, i) => {
		const id = idAnhTran((e.data as { featured_image?: unknown }).featured_image);
		if (id) can.set(i, id);
	});
	if (!can.size) return [...entries];
	let khoa = new Map<string, string>();
	try {
		const db = await getDb();
		const dong = await db
			.selectFrom("media")
			.select(["id", "storage_key"])
			.where("id", "in", [...new Set(can.values())])
			.execute();
		khoa = new Map(dong.map((d) => [String(d.id), String(d.storage_key)]));
	} catch (e) {
		console.warn("[blog] không tra được storage_key của ảnh bìa:", e);
		return [...entries];
	}
	return entries.map((e, i) => {
		const id = can.get(i);
		const k = id ? khoa.get(id) : undefined;
		return id && k ? { ...e, data: { ...e.data, featured_image: { id, meta: { storageKey: k } } } } : e;
	});
}

/** Mọi bài đã đăng, mới nhất trước. `bai` gồm cả bài noindex — nơi gọi tự lọc `index`. */
export async function docBaiDaDang() {
	const { entries, cacheHint } = await getEmDashCollection("bai_viet", {
		orderBy: { published_at: "desc" },
	});
	const ids = entries.map((e) => e.data.id);
	const [phanLoai, an, day] = await Promise.all([nhanPhanLoai(ids), traNoIndex(), lamDayAnhBia(entries)]);
	const bai: BaiKhung[] = day
		.map((e) => {
			const a = baiTuEntry(e, phanLoai.get(e.data.id));
			if (an.has(String(e.data.id))) a.index = false;
			return a;
		})
		.filter((a) => a.slug && a.title);
	// Sắp ổn định theo ngày đăng thật; cùng ngày thì giữ thứ tự published_at của CSDL.
	bai.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
	return { bai, cacheHint };
}
