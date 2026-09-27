// Nghiệm thu lớp 2 trên kho thật. CHỈ ĐỌC.
// Chạy: node backend/tmp/nghiem-thu-lop-2.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

// Parser hiểu giá trị NHIỀU DÒNG: backend/.env cất CA_CERTIFICATE là PEM 26 dòng.
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
const c = new pg.Client({
	host: env.CMS_DB_HOST, port: +env.CMS_DB_PORT, user: env.CMS_DB_USER,
	password: env.CMS_DB_PASSWORD, database: env.CMS_DB_NAME,
	ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
});
await c.connect();

// 1. Bộ luật: bản nào đang có hiệu lực
console.table((await c.query(`SELECT phien_ban, da_duyet, jsonb_array_length(dieu)::int so_dieu
  FROM td_luat_van_phong ORDER BY phien_ban DESC LIMIT 3`)).rows);

// 2. Rào chắn số một: mọi lời phê thầy thuốc phải có trích dẫn
const b = await c.query(`SELECT count(*)::int n FROM td_nhan_xet
  WHERE lop='thay_thuoc' AND trim(trich_dan) = ''`);
console.log("① Lời phê thiếu trích dẫn:", b.rows[0].n, b.rows[0].n === 0 ? "✓" : "✗ PHẢI BẰNG 0");

// 3. Bậc căn cứ 2 (y văn từ trí nhớ mô hình) bị CẤM
const d = await c.query(`SELECT count(*)::int n FROM td_nhan_xet
  WHERE lop='thay_thuoc' AND bac_can_cu = 2`);
console.log("② Lời phê mang bậc căn cứ 2:", d.rows[0].n, d.rows[0].n === 0 ? "✓" : "✗ PHẢI BẰNG 0");

// 4. Van vân tay: mục đã soi kỹ phải có vân tay, không thì đêm mai đọc lại và tốn tiền
const f = await c.query(`SELECT
  count(*) FILTER (WHERE soi_thay_thuoc_luc IS NOT NULL)::int da_soi,
  count(*) FILTER (WHERE soi_thay_thuoc_luc IS NOT NULL AND van_tay_thay_thuoc IS NULL)::int van_ho
  FROM td_ho_so`);
console.log("③ Đã soi kỹ:", f.rows[0].da_soi, "· van còn hở:", f.rows[0].van_ho,
	f.rows[0].van_ho === 0 ? "✓" : "✗ đêm mai sẽ đọc lại và tốn tiền lần nữa");

// 5. Mục đã soi mà 0 lời phê: NGHI phản hồi không đọc được chứ không phải bài sạch.
//    Đây là chỗ từng bỏ sót 3/4 mục trong im lặng (đã vá ở d4d2b74).
const g = await c.query(`SELECT count(*)::int n FROM td_ho_so h
  WHERE h.soi_thay_thuoc_luc IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM td_nhan_xet n WHERE n.ho_so_id=h.id AND n.lop='thay_thuoc')`);
console.log("④ Mục đã soi mà 0 lời phê:", g.rows[0].n,
	"(không bắt buộc bằng 0, nhưng tỉ lệ cao thì soi lại lý do trong log)");

// 6. Kiểu lời phê nhiều nhất — danh sách việc của lớp 2
console.table((await c.query(`SELECT kieu, count(*)::int so_luot FROM td_nhan_xet
  WHERE lop='thay_thuoc' GROUP BY 1 ORDER BY 2 DESC LIMIT 10`)).rows);

// 7. Bao nhiêu lời phê có bản sửa soạn sẵn
const h = await c.query(`SELECT count(*)::int tong,
  count(*) FILTER (WHERE de_xuat IS NOT NULL AND trim(de_xuat) <> '')::int co_ban_sua
  FROM td_nhan_xet WHERE lop='thay_thuoc'`);
console.log("⑤ Lời phê:", h.rows[0].tong, "· có bản sửa soạn sẵn:", h.rows[0].co_ban_sua);

await c.end();
