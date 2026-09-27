import { readFileSync } from "node:fs";
import pg from "pg";
function docEnv(d){const t=readFileSync(d,"utf8");const r={};const re=/^([A-Za-z_][A-Za-z0-9_]*)=(?:"([\s\S]*?)"|'([\s\S]*?)'|(.*))$/gm;let m;while((m=re.exec(t)))r[m[1]]=m[2]??m[3]??m[4]??"";return r;}
const e=docEnv("/Users/truongtrang/Desktop/kinhlacc/backend/.env");
const c=new pg.Client({host:e.CMS_DB_HOST,port:+e.CMS_DB_PORT,user:e.CMS_DB_USER,password:e.CMS_DB_PASSWORD,database:e.CMS_DB_NAME,ssl:{ca:e.CA_CERTIFICATE,rejectUnauthorized:true}});
await c.connect();

// ① Nội dung đã đổi chưa
const v=await c.query(`SELECT version,
  position('khi điều trị, cần tìm đúng' in td_chu(to_jsonb(dai_cuong))) AS con_cu,
  position('khi trị bệnh, cần tìm đúng' in td_chu(to_jsonb(dai_cuong))) AS co_moi
  FROM ec_benh_hoc WHERE slug='non-mua'`);
console.log('① version:', v.rows[0].version, '· chữ cũ còn:', v.rows[0].con_cu>0, '· chữ mới có:', v.rows[0].co_moi>0,
  (v.rows[0].co_moi>0 && v.rows[0].con_cu===0) ? '✓' : '✗');

// ② revisions giữ bản cũ — đường lùi duy nhất
const rv=await c.query(`SELECT count(*)::int n, max(author_id) AS boi FROM revisions
  WHERE collection='benh_hoc' AND entry_id=(SELECT id FROM ec_benh_hoc WHERE slug='non-mua')`);
console.log('② revisions của mục này:', rv.rows[0].n, '· người duyệt:', rv.rows[0].boi, rv.rows[0].n>0?'✓':'✗');
const cu=await c.query(`SELECT position('khi điều trị, cần tìm đúng' in data) AS co_cu FROM revisions
  WHERE collection='benh_hoc' AND entry_id=(SELECT id FROM ec_benh_hoc WHERE slug='non-mua')
  ORDER BY created_at DESC LIMIT 1`);
console.log('   bản cũ trong revisions có chữ trước khi sửa:', cu.rows[0].co_cu>0 ? '✓ lùi lại được' : '✗');

// ③ Trigger td_tr đã dựng lại chỉ mục chưa — gõ cụm CHỈ CÓ trong phần vừa sửa
const tc=await c.query(`SELECT count(*)::int n FROM td_muc
  WHERE bo='benh_hoc' AND tsv @@ plainto_tsquery('simple', td_bo_dau('khi trị bệnh cần tìm đúng nguyên nhân'))`);
console.log('③ tra cứu ra mục bằng chữ MỚI:', tc.rows[0].n, tc.rows[0].n>0?'✓ trigger td_tr đã chạy':'✗ chỉ mục chưa cập nhật');

// ④ Trạng thái nhận xét
const tt=await c.query(`SELECT trang_thai, duyet_boi FROM td_nhan_xet WHERE id IN (124163,124164) ORDER BY id`);
console.table(tt.rows);
await c.end();
