// Kho giả cho phép kiểm: mô phỏng StorageCollection của EmDash (where khớp đúng / {in},
// orderBy một khoá, limit, cursor là vị trí). Đủ cho kho.mjs, không hơn.
function khop(data, where = {}) {
	return Object.entries(where).every(([k, v]) =>
		v && typeof v === "object" && Array.isArray(v.in) ? v.in.includes(data[k]) : data[k] === v,
	);
}

export function taoBoSuuTap() {
	const m = new Map();
	return {
		_m: m,
		async get(id) { return m.has(id) ? structuredClone(m.get(id)) : null; },
		async put(id, data) { m.set(id, structuredClone(data)); },
		async delete(id) { return m.delete(id); },
		async exists(id) { return m.has(id); },
		async getMany(ids) { const r = new Map(); for (const id of ids) if (m.has(id)) r.set(id, structuredClone(m.get(id))); return r; },
		async putMany(items) { for (const { id, data } of items) m.set(id, structuredClone(data)); },
		async deleteMany(ids) { let n = 0; for (const id of ids) if (m.delete(id)) n++; return n; },
		async count(where) { return [...m.values()].filter((d) => khop(d, where)).length; },
		async query({ where, orderBy, limit = 50, cursor } = {}) {
			let rows = [...m.entries()].filter(([, d]) => khop(d, where)).map(([id, data]) => ({ id, data: structuredClone(data) }));
			if (orderBy) {
				const [k, huong] = Object.entries(orderBy)[0];
				// Như PluginStorageRepository của EmDash 0.39.1: xếp "hạng null" (thiếu khoá → 1) TRƯỚC
				// theo cùng chiều, nên với "desc" dòng THIẾU khoá đứng ĐẦU.
				const hang = (v) => (v === undefined || v === null ? 1 : 0);
				const ss = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
				rows.sort((a, b) => (ss(hang(a.data[k]), hang(b.data[k])) || ss(a.data[k], b.data[k])) * (huong === "desc" ? -1 : 1));
			}
			const tu = cursor ? Number(cursor) : 0;
			const trang = rows.slice(tu, tu + Math.min(limit, 100));
			const hasMore = tu + trang.length < rows.length;
			return { items: trang, hasMore, cursor: hasMore ? String(tu + trang.length) : undefined };
		},
	};
}

export function taoKhoGia() {
	return {
		doi_thu: taoBoSuuTap(), url: taoBoSuuTap(), cum: taoBoSuuTap(), ca: taoBoSuuTap(),
		huong: taoBoSuuTap(), cum_nghia: taoBoSuuTap(), ke_hoach: taoBoSuuTap(), leo_top: taoBoSuuTap(),
	};
}

/** docWeb giả từ một bảng URL → chữ. */
export const webGia = (bang) => async (url) => bang[url] ?? "";

/** KV giả: get/set/delete + getVersioned/compareAndSet/compareAndDelete như ctx.kv. */
export function taoKvGia() {
	const m = new Map();
	let rev = 0;
	return {
		_m: m,
		async get(k) { return m.has(k) ? structuredClone(m.get(k).value) : null; },
		async set(k, v) { m.set(k, { value: structuredClone(v), revision: String(++rev) }); },
		async delete(k) { return m.delete(k); },
		async getVersioned(k) { return m.has(k) ? structuredClone(m.get(k)) : null; },
		async compareAndSet(k, r, v) {
			const cu = m.get(k);
			if ((cu?.revision ?? null) !== r) return { applied: false };
			const revision = String(++rev);
			m.set(k, { value: structuredClone(v), revision });
			return { applied: true, revision };
		},
		async compareAndDelete(k, r) {
			if (m.get(k)?.revision !== r) return { applied: false };
			m.delete(k);
			return { applied: true };
		},
		async list(prefix = "") {
			return [...m.entries()].filter(([k]) => k.startsWith(prefix)).map(([key, v]) => ({ key, value: structuredClone(v.value) }));
		},
	};
}
