// va-moc-thoi-gian.mjs — Đưa mọi mốc thời gian trong kho CMS về đúng dạng ISO 8601.
//
// Đọc `kiem-moc-thoi-gian.mjs` trước: ở đó có phần vì sao lỗi xảy ra và vì sao nó chỉ
// lộ ra lúc bấm Publish. Tệp này chỉ lo phần sửa.
//
// ── SỬA CÁI GÌ ──────────────────────────────────────────────────────────────────
//
//     2026-09-25 14:56:41.321454+00   →   2026-09-25T14:56:41.321Z
//
// ĐỔI CÁCH VIẾT, KHÔNG ĐỔI THỜI ĐIỂM. Cả hai chuỗi chỉ cùng một khoảnh khắc; phép đổi
// đi qua `::timestamptz` nên múi giờ được tính chứ không phải cắt chuỗi.
//
// Công thức `to_char(... AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')` KHÔNG
// phải tôi nghĩ ra: nó là DEFAULT mà chính EmDash khai cho mấy bảng mới nhất của họ
// (`_emdash_media_usage_work`, `..._reconciliations`…). Tức họ đã vấp đúng chỗ này và
// đây là dạng họ muốn. Xem `column_default` của các bảng đó nếu cần đối chứng.
//
// ⚠️ MẤT ĐỘ CHÍNH XÁC TỪ MICRO XUỐNG MILLI GIÂY — cố ý. `toISOString()` của JavaScript
// chỉ có 3 chữ số thập phân, nên giữ 6 chữ số là tạo ra một dạng thứ ba mà EmDash cũng
// không bao giờ sinh ra. Hai mục nạp cách nhau dưới 1ms sẽ có cùng mốc; các chỉ mục
// sắp xếp của EmDash đều kèm `id DESC` làm khoá phụ nên thứ tự vẫn xác định.
//
// ── VÌ SAO CÓ PHẦN ĐỔI DEFAULT ──────────────────────────────────────────────────
// Vá dữ liệu thôi là chữa ngọn. EmDash khai `DEFAULT CURRENT_TIMESTAMP` trên cột TEXT
// cho gần như mọi bảng — trên Postgres cái đó ép ra đúng dạng sai. Mặc định ấy chỉ nổ
// khi có lệnh INSERT bỏ trống cột (mã EmDash luôn truyền tay nên thường không chạm
// tới), nhưng script di cư thì rất dễ bỏ trống, và đó chính là cách 18.205 mục dính
// lỗi. Nên các bảng NỘI DUNG được đổi mặc định sang công thức đúng: ai lỡ quên truyền
// mốc thời gian thì vẫn ra dạng ISO.
//
// Đổi ở MỌI bảng, không riêng bảng nội dung. Lần vá đầu (27/09/2026) chỉ đụng bảng nội
// dung, và chốt đỏ lại ngay trong ngày: `_emdash_media_usage_sources.created_at` có một
// dòng mới toanh mang dạng Postgres, do chính EmDash chèn mà bỏ trống cột.
//
// Đổi mặc định của bảng do thư viện quản nghe như lấn sân, nhưng chính EmDash đã làm
// đúng thế ở những bảng MỚI nhất của họ — `_emdash_media_usage_work`,
// `..._reconciliations`, `..._collection_deletions` đều có DEFAULT là công thức to_char
// ISO y hệt công thức dưới đây. Tức họ đã nhận ra CURRENT_TIMESTAMP là sai trên
// Postgres và đang sửa dần; đây chỉ là làm nốt phần bảng cũ.
//
//   node scripts-di-cu/va-moc-thoi-gian.mjs          # chạy thử, KHÔNG ghi (mặc định)
//   node scripts-di-cu/va-moc-thoi-gian.mjs --ghi    # ghi thật, trong MỘT giao dịch
//
// Nghiệm thu sau khi ghi: node scripts-di-cu/kiem-moc-thoi-gian.mjs

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const ghiThat = process.argv.includes("--ghi");

// Dạng ISO mà EmDash sinh ra. Dùng làm bộ lọc "dòng nào cần đụng tới": chỉ cần có chữ
// `T` ở đúng chỗ là đã khác hẳn dạng của Postgres (dấu cách), không cần khớp chặt hơn.
const DAU_HIEU_ISO = "^\\d{4}-\\d{2}-\\d{2}T";
const CONG_THUC = `to_char(("%COT%")::timestamptz AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST,
	port: +env.PGPORT,
	user: env.PGUSER,
	password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

const cot = (
	await kho.query(`
		SELECT table_name, column_name, column_default
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND data_type IN ('text', 'character varying')
		  AND column_name LIKE '%\\_at'
		ORDER BY table_name, column_name
	`)
).rows;

// ── Đếm trước ───────────────────────────────────────────────────────────────────
const canVa = [];
for (const { table_name: bang, column_name: c } of cot) {
	const { rows } = await kho.query(
		`SELECT count(*)::int AS n FROM "${bang}" WHERE "${c}" IS NOT NULL AND "${c}" !~ $1`,
		[DAU_HIEU_ISO],
	);
	if (rows[0].n > 0) canVa.push({ bang, cot: c, dong: rows[0].n });
}

const macDinhSai = cot.filter((r) =>
	/CURRENT_TIMESTAMP|\bnow\(\)/i.test(r.column_default ?? ""),
);

const tongDong = canVa.reduce((t, d) => t + d.dong, 0);
console.log(
	`${ghiThat ? "GHI THẬT" : "CHẠY THỬ (chưa ghi gì)"} — ${canVa.length} cột có dữ liệu sai dạng, ` +
		`tổng ${tongDong} giá trị; ${macDinhSai.length} cột nội dung có mặc định sai.\n`,
);

for (const d of canVa) {
	// Cho xem tận mắt một cặp trước→sau, để người chạy tự phán được là phép đổi có
	// giữ nguyên thời điểm hay không — thay vì phải tin lời chú thích.
	const { rows } = await kho.query(
		`SELECT "${d.cot}" AS cu, ${CONG_THUC.replace("%COT%", d.cot)} AS moi
		 FROM "${d.bang}" WHERE "${d.cot}" IS NOT NULL AND "${d.cot}" !~ $1 LIMIT 1`,
		[DAU_HIEU_ISO],
	);
	console.log(`  ${d.bang}.${d.cot}  ${d.dong} dòng`);
	console.log(`      ${rows[0].cu}  →  ${rows[0].moi}`);
}

if (macDinhSai.length) {
	console.log(`\n  Mặc định sẽ đổi: ${macDinhSai.length} cột`);
	for (const r of macDinhSai.slice(0, 6)) console.log(`      ${r.table_name}.${r.column_name}`);
	if (macDinhSai.length > 6) console.log(`      … và ${macDinhSai.length - 6} cột nữa`);
}

if (!ghiThat) {
	console.log("\nChưa ghi gì. Thêm --ghi để ghi thật.");
	await kho.end();
	process.exit(0);
}

// ── Ghi, trong MỘT giao dịch ────────────────────────────────────────────────────
// Một giao dịch cho tất cả: vá nửa chừng thì kho còn LẪN hai dạng, mà lẫn thì khó lần
// hơn hẳn sai đều — không biết chỗ nào đã qua tay, chỗ nào chưa.
await kho.query("BEGIN");
try {
	let daSua = 0;
	for (const d of canVa) {
		const r = await kho.query(
			`UPDATE "${d.bang}" SET "${d.cot}" = ${CONG_THUC.replace("%COT%", d.cot)}
			 WHERE "${d.cot}" IS NOT NULL AND "${d.cot}" !~ $1`,
			[DAU_HIEU_ISO],
		);
		daSua += r.rowCount;
		console.log(`  ✓ ${d.bang}.${d.cot}: ${r.rowCount} dòng`);
	}
	for (const r of macDinhSai) {
		await kho.query(
			`ALTER TABLE "${r.table_name}" ALTER COLUMN "${r.column_name}"
			 SET DEFAULT to_char((clock_timestamp() AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
		);
	}
	if (macDinhSai.length) console.log(`  ✓ đổi mặc định ${macDinhSai.length} cột`);

	// Chốt trong giao dịch: soi lại bằng chính bộ lọc vừa dùng. Còn sót dòng nào thì
	// phép đổi đã không phủ hết trường hợp — thà quay lui còn hơn ghi một kho nửa vời.
	let conSot = 0;
	for (const d of canVa) {
		const { rows } = await kho.query(
			`SELECT count(*)::int AS n FROM "${d.bang}" WHERE "${d.cot}" IS NOT NULL AND "${d.cot}" !~ $1`,
			[DAU_HIEU_ISO],
		);
		conSot += rows[0].n;
	}
	if (conSot > 0) throw new Error(`Vá xong vẫn còn ${conSot} dòng sai dạng — quay lui.`);

	await kho.query("COMMIT");
	console.log(`\n✅ Đã vá ${daSua} giá trị, đổi ${macDinhSai.length} mặc định.`);
	console.log("   Nghiệm thu: node scripts-di-cu/kiem-moc-thoi-gian.mjs");
} catch (e) {
	await kho.query("ROLLBACK");
	console.error(`\n❌ Quay lui, kho không đổi gì: ${e.message}`);
	process.exitCode = 1;
}
await kho.end();
