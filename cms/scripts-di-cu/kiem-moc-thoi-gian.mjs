// kiem-moc-thoi-gian.mjs — Chốt "mọi mốc thời gian trong kho CMS đều là ISO 8601".
// CHỈ ĐỌC, không sửa gì.
//
// ── VÌ SAO CÓ CHỐT NÀY ──────────────────────────────────────────────────────────
// EmDash cất MỌI mốc thời gian vào cột **TEXT**, và luôn ghi bằng `toISOString()`:
//
//     2026-09-25T14:56:41.321Z          ← EmDash
//     2026-09-25 14:56:41.321454+00     ← Postgres ép timestamptz sang text
//
// Hai chuỗi này cùng chỉ một thời điểm nhưng KHÁC NHAU với máy. Script di cư nào viết
// `VALUES (..., now(), now(), now(), ...)` là để Postgres tự ép kiểu, và cột text nhận
// đúng dạng thứ hai. Không có lỗi nào lúc chèn: cột là text, chuỗi nào cũng vừa.
//
// Vết thương chỉ lộ ra khi người biên tập bấm **Publish**. `ContentRepository.publish()`
// đọc lại `published_at` CŨ rồi cho qua `normalizeDatetime()` để so với mốc mới, và hàm
// đó từ chối dạng của Postgres vì hai lẽ: dấu cách thay cho `T`, và `+00` thiếu phút
// (nó đòi `Z` hoặc `+00:00`). Người dùng nhận đúng một dòng:
//
//     Failed to publish
//     Datetime "2026-09-25 14:18:14.08303+00" is not a valid ISO 8601 datetime
//
// ⚠️ Câu đó KHÔNG nhắc gì tới mục đang sửa, nên rất dễ đoán nhầm sang trùng slug/trùng
// link — đã xảy ra thật (26/09/2026). Chốt này tồn tại để lần sau không phải đoán.
//
// Ngày 25/09/2026 có 18.205 mục ở 5 bộ dính lỗi này (bai_thuoc, nguon_y_van, huyet_vi,
// duoc_lieu, kinh_mach) — tức toàn bộ chúng KHÔNG publish được, không riêng mục ai đó
// thử tay. Ba bộ nạp bằng đường khác (bai_viet, benh_hoc, cham_cuu_tri_benh) thì sạch.
//
// ── PHÉP KIỂM DÙNG CHÍNH HÀM CỦA EMDASH ─────────────────────────────────────────
// Không tự viết lại regex: chốt phải hỏi đúng cái cổng đang chặn. Hàm nằm trong module
// nội bộ `dist/datetime-normalization-<hash>.mjs`, tên export bị rút còn một chữ cái và
// hash đổi theo mỗi bản EmDash — nên script DÒ theo hành vi (nhận ISO, ném với rác) chứ
// không neo vào tên. Không dò ra thì nó KÊU TO rồi rơi về regex, chứ không lặng lẽ
// báo xanh bằng một phép kiểm yếu hơn.
//
//   node scripts-di-cu/kiem-moc-thoi-gian.mjs          # tóm tắt
//   node scripts-di-cu/kiem-moc-thoi-gian.mjs --ke     # kê từng cột, kèm ví dụ
//
// Mã thoát 1 khi còn giá trị sai dạng → cắm được vào chuỗi nghiệm thu.

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const keChiTiet = process.argv.includes("--ke");

// ── Mượn hàm chuẩn hoá thật của EmDash ──────────────────────────────────────────
async function muonHamChuanHoa() {
	const thuMuc = resolve(goc, "cms/node_modules/emdash/dist");
	let tep;
	try {
		tep = readdirSync(thuMuc).find(
			(n) => n.startsWith("datetime-normalization-") && n.endsWith(".mjs"),
		);
	} catch {
		/* không có thư mục dist — rơi xuống nhánh regex bên dưới */
	}
	if (tep) {
		const mod = await import(`file://${resolve(thuMuc, tep)}`);
		// Dò theo HÀNH VI: nhận (chuỗi ISO, "UTC") trả { value, kind }, và ném với rác.
		for (const ham of Object.values(mod)) {
			if (typeof ham !== "function") continue;
			try {
				const thu = ham("2026-01-02T03:04:05.000Z", "UTC");
				if (typeof thu?.value !== "string") continue;
				try {
					ham("khong-phai-ngay", "UTC");
					continue; // không ném → không phải hàm ta cần
				} catch {
					return { ham, nguon: `emdash/dist/${tep}` };
				}
			} catch {
				/* hàm khác — thử tiếp */
			}
		}
	}
	console.warn(
		"⚠️  KHÔNG mượn được normalizeDatetime của EmDash (bản mới đổi cách đóng gói?).\n" +
			"    Rơi về phép kiểm regex — YẾU HƠN cổng thật, đừng coi màu xanh ở đây là đủ.",
	);
	const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
	return {
		ham: (v) => {
			if (!ISO.test(v)) throw new Error(`Datetime ${JSON.stringify(v)} không phải ISO 8601`);
			return { value: v };
		},
		nguon: "regex dự phòng",
	};
}

const { ham: chuanHoa, nguon } = await muonHamChuanHoa();

// ── THA CÓ LÝ DO ────────────────────────────────────────────────────────────────
// Vài cột do CHÍNH EmDash ghi bằng mặc định `CURRENT_TIMESTAMP` của họ, nên chúng sẽ
// sinh lại dạng Postgres mãi mãi dù có vá bao nhiêu lần. Vá chúng là công dã tràng, còn
// để chốt kêu hoài thì chốt thành tiếng ồn rồi không ai đọc nữa.
//
// ⚠️ Tha thì phải chứng minh được là VÔ HẠI, tức: không mã nào đọc cột đó qua
// `normalizeDatetime`. Mỗi dòng dưới đây phải ghi bằng chứng, không được "chắc là không sao".
//
// `soDong` là TRẦN số dòng được tha. Vượt trần là chốt kêu trở lại — tha không thể âm
// thầm nới rộng ra thành cả bảng.
const THA = [
	// TRỐNG, và nên giữ trống.
	//
	// Từng có một mục ở đây: `auth_challenges.created_at`, cột mà EmDash chèn bằng mặc
	// định `CURRENT_TIMESTAMP` của chính họ nên cứ vá xong lại sai. Nhưng tha là cách
	// chữa sai chỗ — ngày 27/09/2026 chốt đỏ lại vì một cột KHÁC cùng cảnh
	// (`_emdash_media_usage_sources.created_at`), và nếu cứ thấy đỏ lại thêm một dòng
	// tha thì danh sách này sẽ dài dần ra cho tới lúc chốt chẳng còn canh gì nữa.
	//
	// Cách chữa đúng là đổi chính cái MẶC ĐỊNH — `va-moc-thoi-gian.mjs` nay làm thế cho
	// cả 61 cột. Nên nếu chốt này đỏ trở lại, đừng thêm dòng tha: đi xem cột đó lấy giá
	// trị từ đâu ra.
];


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

// Mọi cột TEXT có đuôi `_at` đều là mốc thời gian trong quy ước của EmDash. Dò theo
// schema chứ không liệt kê tay: bộ nội dung mới sinh ra bảng ec_* mới, và chốt phải
// phủ luôn chúng mà không ai phải nhớ sửa file này.
const cot = (
	await kho.query(`
		SELECT table_name, column_name
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND data_type IN ('text', 'character varying')
		  AND column_name LIKE '%\\_at'
		ORDER BY table_name, column_name
	`)
).rows;

let tongXau = 0;
const banXau = [];
const daTha = [];

for (const { table_name: bang, column_name: c } of cot) {
	// Lấy các giá trị KHÁC BIỆT: một bảng 13.942 dòng thường chỉ có vài dạng sai, kéo
	// hết về máy là tốn công vô ích. DISTINCT giữ đủ bằng chứng mà nhẹ.
	const mau = await kho.query(
		`SELECT DISTINCT "${c}" AS v FROM "${bang}" WHERE "${c}" IS NOT NULL`,
	);
	const xau = [];
	for (const { v } of mau.rows) {
		try {
			chuanHoa(v, "UTC");
		} catch (e) {
			xau.push({ v, vi: e.message });
		}
	}
	if (!xau.length) continue;

	// Đếm số DÒNG thật (không phải số giá trị khác biệt) để biết vết thương rộng bao nhiêu.
	const dem = await kho.query(
		`SELECT count(*)::int AS n FROM "${bang}" WHERE "${c}" = ANY($1::text[])`,
		[xau.map((x) => x.v)],
	);
	const tha = THA.find((t) => t.cot === `${bang}.${c}`);
	if (tha && dem.rows[0].n <= tha.soDong) {
		daTha.push({ cot: tha.cot, dong: dem.rows[0].n, vi: tha.vi });
		continue;
	}
	tongXau += dem.rows[0].n;
	banXau.push({ bang, cot: c, dong: dem.rows[0].n, dang: xau.length, viDu: xau[0], tha });
}

await kho.end();

console.log(`Cổng kiểm: ${nguon}`);
console.log(`Đã soi ${cot.length} cột thời gian dạng text trong kho CMS.\n`);

for (const t of daTha) console.log(`  · tha ${t.cot}: ${t.dong} dòng — ${t.vi}`);

if (!banXau.length) {
	console.log(`${daTha.length ? "\n" : ""}✅ Không còn mốc thời gian nào sai dạng — mọi mục publish được.`);
	process.exit(0);
}


for (const d of banXau) {
	const vuotTran = d.tha ? `  ⚠️ VƯỢT TRẦN THA (${d.tha.soDong})` : "";
	console.log(`  ✗ ${d.bang}.${d.cot}: ${d.dong} dòng (${d.dang} dạng khác nhau)${vuotTran}`);
	if (keChiTiet) console.log(`      ${d.viDu.vi}`);
}
console.log(
	`\n❌ ${tongXau} giá trị sai dạng trên ${banXau.length} cột.\n` +
		"   Hậu quả: mọi mục dính phải sẽ BÁO LỖI khi bấm Publish trong trang quản trị.\n" +
		"   Vá bằng: node scripts-di-cu/va-moc-thoi-gian.mjs --thu   (rồi bỏ --thu để ghi)",
);
process.exit(1);
