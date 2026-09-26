// Nghiệm thu lớp 1 trên kho thật. CHỈ ĐỌC.
// Chạy: node backend/tmp/nghiem-thu-tham-dinh.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

/**
 * Đọc .env, HIỂU giá trị nhiều dòng trong nháy kép.
 *
 * ⚠️ backend/.env cất CA_CERTIFICATE là PEM trải nhiều dòng. Parser kiểu
 * split("\n").filter(/^[A-Z_]+=/) — lối thường thấy — chỉ vớt được dòng
 * "-----BEGIN CERTIFICATE-----" rồi bỏ phần thân, và kết quả là một cert hỏng đi kèm
 * rejectUnauthorized: true, tức kết nối gãy với thông báo chẳng liên quan gì tới cert.
 */
function docEnv(duong) {
	const txt = readFileSync(duong, "utf8");
	const ra = {};
	const re = /^([A-Za-z_][A-Za-z0-9_]*)=(?:"([\s\S]*?)"|'([\s\S]*?)'|(.*))$/gm;
	let m;
	while ((m = re.exec(txt))) ra[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
	return ra;
}

const env = docEnv(new URL("../.env", import.meta.url));
const ca = (env.DB_CA_CERT || env.CA_CERTIFICATE || "").trim();
if (!env.CMS_DB_HOST) {
	console.error("Chưa khai CMS_DB_* trong backend/.env — bot chưa chạy được ca nào.");
	process.exit(1);
}
if (!ca) console.warn("⚠️  Không có cert: kết nối KHÔNG xác minh danh tính máy chủ.");

const c = new pg.Client({
	host: env.CMS_DB_HOST,
	port: +env.CMS_DB_PORT,
	user: env.CMS_DB_USER,
	password: env.CMS_DB_PASSWORD,
	database: env.CMS_DB_NAME,
	ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
});
await c.connect();

// 1. Đủ mục: số hồ sơ phải bằng số mục trong chỉ mục
const a = await c.query(`SELECT
  (SELECT count(*) FROM td_muc)::int   AS trong_chi_muc,
  (SELECT count(*) FROM td_ho_so)::int AS co_ho_so`);
console.log("① Đủ mục:", a.rows[0]);

// 2. Kiểu cột thời gian PHẢI là timestamptz — sổ tay ghi bẫy lệch 7 tiếng
const b = await c.query(`SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name IN ('td_ho_so','td_nhan_xet') AND data_type LIKE 'timestamp%'`);
const sai = b.rows.filter((r) => r.data_type !== "timestamp with time zone");
console.log("② Cột thời gian:", sai.length ? "SAI KIỂU → " + JSON.stringify(sai) : "đúng timestamptz");

// 3. Mọi nhận xét về lỗi chữ phải có trích dẫn
const d = await c.query(`SELECT count(*)::int n FROM td_nhan_xet
  WHERE lop='may' AND trich_dan='' AND kieu NOT IN ('thieu_truong','thieu_truong_cot_loi')`);
console.log("③ Nhận xét lỗi chữ thiếu trích dẫn:", d.rows[0].n, d.rows[0].n === 0 ? "✓" : "✗ PHẢI BẰNG 0");

// 4. Phân bố hạng
console.table((await c.query(`SELECT hang, count(*)::int n FROM td_ho_so GROUP BY 1 ORDER BY 2 DESC`)).rows);

// 5. Mười kiểu lỗi nhiều nhất — đây là danh sách việc
//    Phải thấy cả 'lien_ket_dung_duoc' (đầu vào cho bậc 1 của lớp thầy thuốc).
console.table((await c.query(`SELECT kieu, truong, count(*)::int so_muc FROM td_nhan_xet
  WHERE lop='may' GROUP BY 1,2 ORDER BY 3 DESC LIMIT 10`)).rows);

await c.end();
