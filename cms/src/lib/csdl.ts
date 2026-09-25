// csdl.ts — Nối thẳng Postgres cho tầng tra cứu từ điển.
//
// VÌ SAO KHÔNG DÙNG API CỦA EMDASH: search() của EmDash chạy trên FTS5 (SQLite) nên
// trên Postgres nó là lệnh rỗng — xem đầu file sql/chi-muc-tra-cuu.sql. EmDash cũng
// không xuất ra handle database nào để mượn lại.
//
// ⚠️ max: 1 là CỐ Ý. Cụm Aiven chỉ cho 20 kết nối, Aiven giữ sẵn khoảng 10 và 3 dành
// cho superuser; EmDash đã chiếm 2. Nới số này ra là cách chắc chắn nhất để cả CMS lẫn
// app cùng chết vì "too many connections" vào đúng lúc đông người đọc.

import { readFileSync } from "node:fs";
import pg from "pg";

let be: pg.Pool | undefined;

function caAiven(): string | undefined {
	try {
		return readFileSync(new URL("../../aiven-ca.pem", import.meta.url), "utf8");
	} catch {
		return undefined;
	}
}

function lay(): pg.Pool {
	if (be) return be;
	const ca = caAiven();
	be = new pg.Pool({
		// Không truyền host/user/password: để pg tự đọc PGHOST/PGUSER/… lúc CHẠY,
		// giống hệt cách astro.config.mjs làm, nên mật khẩu không lọt vào bản dựng.
		ssl: ca ? { ca, rejectUnauthorized: true } : undefined,
		max: 1,
		connectionTimeoutMillis: 10_000,
		idleTimeoutMillis: 10_000,
	});
	// Pool của pg ném lỗi ra process nếu không ai nghe 'error' → sập cả tiến trình khi
	// Aiven cắt một kết nối đang rảnh.
	be.on("error", (e) => console.error("[tra-cuu] lỗi pool:", e.message));
	return be;
}

export async function truyVan<T = Record<string, unknown>>(
	sql: string,
	tham: unknown[] = [],
): Promise<T[]> {
	const r = await lay().query(sql, tham);
	return r.rows as T[];
}
