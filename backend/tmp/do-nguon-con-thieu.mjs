// do-nguon-con-thieu.mjs — CHỈ ĐỌC. Dò những quyển y văn mà KHO ĐANG DẪN nhưng thư mục
// `/nguon/` (2.139 mục) KHÔNG có.
//
// Đặc tả: docs/superpowers/specs/2026-10-02-do-thi-tri-thuc-thap-va-truc-ngang.md (mục 6b)
// Chạy: node backend/tmp/do-nguon-con-thieu.mjs [--tat-ca]
//
// VÌ SAO TỆP NÀY TỒN TẠI
// Đỉnh tháp (nguồn → Kinh/Huyệt/Vị thuốc/Bài thuốc) hụt hai nhánh: nguồn→kinh 0 cạnh,
// nguồn→vị thuốc 20%. Lúc đầu tưởng phải vá từng nhánh. Đo ngày 02/10/2026 thì thấy một
// quyển — "Châm cứu lâm sàng biện chứng luận trị" — được dẫn 8 lần trong các trang kinh mà
// thư mục nguồn KHÔNG có mục nào. Tức nhiều cạnh thiếu không phải vì chưa ai nối, mà vì
// ĐẦU BÊN KIA CHƯA TỒN TẠI. Bổ sung một quyển thì mọi mục dẫn nó cùng có cạnh.
//
// ⚠️ HAI PHÉP RÚT, VÀ VÌ SAO KHÔNG RÚT BẰNG CÁCH KHỚP TÊN VÀO TOÀN VĂN
// Khớp 2.138 tên nguồn vào toàn văn 12 kinh cho ra 10 "cạnh", phần lớn là rác: "Thi Phát"
// thật ra là "thì phát cuồng", "Thi Sơ" là "thì sợ lạnh" — chuẩn hoá bỏ dấu thanh biến
// "thì phát" thành "thi phat". Đây đúng bẫy CLAUDE.md đã ghi ở mục liên kết chéo.
// Nên ở đây rút THEO VỊ TRÍ, chỉ hai chỗ y văn thật sự được dẫn trong kho này:
//   (1) cụm trong ngoặc đơn  — "…(Giáp Ất Kinh)", "…(Thông Huyền Chỉ Yếu Phú)"
//   (2) sau chữ "sách"       — "sách Thiên Kim Phương ghi:"
//
// ⚠️ BỘ LỌC DÙNG DỮ LIỆU THẬT, KHÔNG ĐOÁN "TRÔNG NHƯ TÊN SÁCH"
// Cụm trong ngoặc phần lớn KHÔNG phải sách: mã huyệt (Nh 3, Ty 4, Đtr), liều (30g), tên
// Latin, ghi chú giải phẫu, giải thích Ngũ Hành. Không có cách nào đoán đúng "cụm này là
// sách" bằng hình dạng chữ. Nên lọc bằng chính các danh mục đã có: cụm nào trùng tên một
// huyệt / vị thuốc / bài thuốc / kinh / mục chủ trị thì KHÔNG phải sách mới.
// Phần còn lại xếp theo SỐ MỤC KHÁC NHAU cùng dẫn: một quyển thật được nhiều mục dẫn, còn
// ghi chú riêng của một mục thì chỉ xuất hiện ở mục đó.
//
// ⚠️ KẾT QUẢ LÀ ĐỀ XUẤT CHO NGƯỜI ĐỌC, KHÔNG PHẢI DANH SÁCH ĐỂ CHÈN THẲNG. Mỗi dòng in kèm
// NGỮ CẢNH thật để người duyệt tự phán — cùng lý lẽ "đọc trich_dan thật trước khi tin con số"
// của bot thẩm định.

import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

const GOC = "/Users/truongtrang/Desktop/kinhlacc";
const TAT_CA = process.argv.includes("--tat-ca");
/** --xuat <tệp.md>: ghi danh sách ứng viên ra bảng Markdown để soát tay rồi mới nhập thư mục. */
const XUAT = (() => { const i = process.argv.indexOf("--xuat"); return i > 0 ? process.argv[i + 1] : null; })();
/** Chỉ báo cụm được ít nhất chừng này MỤC KHÁC NHAU dẫn (trừ khi --tat-ca). */
const TOI_THIEU_MUC = 2;

function docEnv(duong) {
	const ra = {};
	let khoa = null;
	let dem = [];
	for (const dong of readFileSync(duong, "utf8").split("\n")) {
		if (khoa) {
			dem.push(dong);
			if (dong.trimEnd().endsWith('"')) {
				ra[khoa] = dem.join("\n").replace(/"$/, "");
				khoa = null;
				dem = [];
			}
			continue;
		}
		const m = dong.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
		if (!m) continue;
		const [, k, v] = m;
		if (v.startsWith('"') && !v.slice(1).endsWith('"')) {
			khoa = k;
			dem = [v.slice(1)];
		} else ra[k] = v.replace(/^"(.*)"$/, "$1");
	}
	return ra;
}

/** Chuẩn hoá MẠNH: bỏ dấu thanh + mọi dấu câu — cùng thước với `POST /tra-cuu/ten`. */
const chuan = (s) =>
	String(s ?? "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();

const RE_NGOAC = /\(([^()]{3,80})\)/g;
const RE_SACH = /sách\s+([A-ZĐÂÊÔƠƯĂ][^,.;:()"”'’\n]{2,60}?)\s+(?:ghi|chép|viết|nói|rằng|có)/gu;
/** Cụm có số hoặc đơn vị thì không phải tên sách: (30g), (3 thốn), (Nh 3), (C 13). */
const CO_SO = /\d/;
const DON_VI = /\b(?:g|gam|ml|thốn|phân|lượng|chỉ|%)\b/i;

function rutCum(chu) {
	const ra = [];
	const s = String(chu ?? "");
	for (const m of s.matchAll(RE_NGOAC)) ra.push({ cum: m[1].trim(), tai: m.index });
	for (const m of s.matchAll(RE_SACH)) ra.push({ cum: m[1].trim(), tai: m.index });
	return ra;
}

const nguyenVan = (chu, tai) =>
	String(chu ?? "")
		.slice(Math.max(0, tai - 60), tai + 80)
		.replace(/\s+/g, " ")
		.trim();

async function main() {
	const e = docEnv(`${GOC}/backend/.env`);
	const kho = new pg.Client({
		host: e.DB_HOST,
		port: Number(e.DB_PORT || 5432),
		user: e.DB_USER,
		password: e.DB_PASSWORD,
		database: e.DB_NAME,
		ssl: e.CA_CERTIFICATE ? { ca: e.CA_CERTIFICATE, rejectUnauthorized: true } : { rejectUnauthorized: false },
		connectionTimeoutMillis: 30_000,
	});
	await kho.connect();
	const q = async (sql) => (await kho.query(sql)).rows;

	// ── Danh mục dùng làm BỘ LỌC (cụm trùng chúng thì không phải sách mới) ──────────────
	const nguonTen = (await q(`SELECT ten FROM nguon WHERE ten IS NOT NULL`)).map((r) => String(r.ten));
	const nguon = new Set(nguonTen.map(chuan));
	// Chỉ mục token để tìm MỤC GẦN NHẤT. Vì sao cần: kho dẫn "Ngọc Long Ca" còn thư mục có
	// "Ngọc Long Kinh" — hai quyển khác nhau hay một quyển hai tên là việc người duyệt phán,
	// nhưng phải ĐƯA CHO HỌ THẤY, không thì họ tạo mục trùng. CLAUDE.md đã cảnh báo: một lỗi
	// gõ sinh mục tra cứu mới là làm bẩn cả phần huyệt và rất khó lần ngược.
	const tokenNguon = nguonTen.map((t) => ({ ten: t, tu: new Set(chuan(t).split(" ").filter(Boolean)) }));
	const ganNhat = (cum) => {
		const a = new Set(chuan(cum).split(" ").filter(Boolean));
		if (!a.size) return null;
		let tot = null;
		let diem = 0;
		for (const n of tokenNguon) {
			let chung = 0;
			for (const w of a) if (n.tu.has(w)) chung++;
			const d = chung / Math.max(a.size, n.tu.size);
			if (d > diem) [diem, tot] = [d, n.ten];
		}
		return diem >= 0.5 ? { ten: tot, diem: Math.round(diem * 100) } : null;
	};
	const loc = new Set();
	// Tên cột KHÁC NHAU giữa các bảng — đã đọc information_schema, đừng đoán.
	for (const [bang, cot] of [
		["vi_thuoc", "ten_vi_thuoc"],
		["phuong_thang", "ten"],
		["kinh_mach", "ten_kinh_mach"],
		["chu_tri", "ten_chu_tri"],
		["trieu_chung", "ten_trieu_chung"],
	]) {
		for (const r of await q(`SELECT ${cot} AS t FROM ${bang} WHERE ${cot} IS NOT NULL`)) {
			const k = chuan(r.t);
			if (k) loc.add(k);
		}
	}
	await kho.end();

	// ── Chữ của cả kho từ điển tĩnh ────────────────────────────────────────────────────
	const d = await import(`${GOC}/frontend/scripts/dict-data.mjs`);
	const mucs = [];
	const huyet = Object.values(d.ACU.records);
	for (const h of huyet) {
		loc.add(chuan(h.ten));
		mucs.push({ bo: "huyet", ten: h.ten, chu: [h.noiDung, h.phoiHuyet, h.ghiChu, h.thamKhao, h.congDung].filter(Boolean).join("\n") });
	}
	for (const m of Object.values(d.MER.kinh)) {
		loc.add(chuan(m.ten));
		mucs.push({ bo: "kinh", ten: m.ten, chu: d.KINH_SECTIONS.map(([k]) => String(m[k] ?? "")).join("\n") });
	}
	for (const [bo, v] of Object.entries(d.BENH)) {
		for (const r of Object.values(v.records)) {
			loc.add(chuan(r.ten));
			mucs.push({ bo, ten: r.ten, chu: Object.entries(r).filter(([k]) => !k.startsWith("_") && k !== "slug" && k !== "id").map(([, x]) => (typeof x === "string" ? x : "")).join("\n") });
		}
	}

	console.log(`Quét ${mucs.length} mục từ điển (huyệt ${huyet.length}, kinh ${Object.keys(d.MER.kinh).length}, hai bộ bệnh ${Object.values(d.BENH).reduce((a, v) => a + Object.keys(v.records).length, 0)})`);
	console.log(`Bộ lọc: ${nguon.size} tên nguồn đã có + ${loc.size} tên huyệt/vị/bài/kinh/chủ trị/triệu chứng\n`);

	// ── Gom ứng viên ───────────────────────────────────────────────────────────────────
	const daCo = new Map();   // cụm KHỚP nguồn đã có → cạnh dùng được ngay
	const thieu = new Map();  // cụm không khớp gì → nghi là nguồn còn thiếu
	let tongCum = 0;
	let boVungSo = 0;
	let boTrungDanhMuc = 0;
	for (const m of mucs) {
		for (const { cum, tai } of rutCum(m.chu)) {
			tongCum++;
			if (CO_SO.test(cum) || DON_VI.test(cum)) { boVungSo++; continue; }
			const tu = cum.split(/\s+/).filter(Boolean);
			if (tu.length < 2 || tu.length > 12) { boVungSo++; continue; }
			const k = chuan(cum);
			if (!k) continue;
			if (nguon.has(k)) {
				const o = daCo.get(k) ?? { cum, muc: new Set() };
				o.muc.add(`${m.bo}:${m.ten}`);
				daCo.set(k, o);
				continue;
			}
			if (loc.has(k)) { boTrungDanhMuc++; continue; }
			const o = thieu.get(k) ?? { cum, muc: new Set(), viDu: nguyenVan(m.chu, tai), bo: new Set() };
			o.muc.add(`${m.bo}:${m.ten}`);
			o.bo.add(m.bo);
			thieu.set(k, o);
		}
	}

	console.log(`Cụm rút được: ${tongCum} · bỏ vì có số/đơn vị/độ dài: ${boVungSo} · bỏ vì trùng danh mục có sẵn: ${boTrungDanhMuc}`);
	console.log(`→ KHỚP nguồn đã có: ${daCo.size} quyển (dựng được cạnh ngay)`);
	console.log(`→ KHÔNG khớp gì:    ${thieu.size} cụm\n`);

	const xep = (m) => [...m.values()].sort((a, b) => b.muc.size - a.muc.size || a.cum.localeCompare(b.cum));

	console.log("── NGHI LÀ NGUỒN CÒN THIẾU (xếp theo số mục khác nhau cùng dẫn) ──");
	console.log("   Mỗi dòng in NGỮ CẢNH thật — tự đọc rồi phán, đừng chèn thẳng vào thư mục.\n");
	const ds = xep(thieu).filter((x) => TAT_CA || x.muc.size >= TOI_THIEU_MUC);
	if (!ds.length) console.log("   (không có cụm nào đạt ngưỡng)");
	let soCanhMo = 0;
	for (const x of ds) soCanhMo += x.muc.size;
	for (const x of ds.slice(0, 40)) {
		const g = ganNhat(x.cum);
		console.log(`  ${String(x.muc.size).padStart(4)} mục [${[...x.bo].join(",")}]  ${x.cum}`);
		console.log(`        “…${x.viDu}…”`);
		// Mục gần nhất để người duyệt phán "quyển mới" hay "cùng quyển, tên khác" — chống tạo trùng.
		if (g) console.log(`        gần nhất trong thư mục: ${g.ten}  (${g.diem}% trùng từ) — tự phán: quyển mới hay tên khác của nó?`);
	}
	if (ds.length > 40) console.log(`\n   … và ${ds.length - 40} cụm nữa (chạy với --tat-ca để xem hết)`);
	console.log(`\n   ${ds.length} cụm đạt ngưỡng ≥${TOI_THIEU_MUC} mục · nếu đều là sách thật thì mở thêm ${soCanhMo} cạnh nguồn→mục.`)

	if (XUAT) {
		const dong = ds.map((x) => {
			const g = ganNhat(x.cum);
			return `| ${x.cum} | ${x.muc.size} | ${[...x.bo].join(", ")} | ${g ? `${g.ten} (${g.diem}%)` : "—"} |  | …${x.viDu.replace(/\|/g, "/")}… |`;
		});
		writeFileSync(
			XUAT,
			`# Ứng viên nguồn còn thiếu — soát tay rồi mới nhập thư mục\n\n` +
				`Dò ${new Date().toISOString().slice(0, 10)} · ${ds.length} cụm ≥${TOI_THIEU_MUC} mục · mở thêm ${soCanhMo} cạnh nếu đều là sách thật.\n\n` +
				`⚠️ Cột "gần nhất" là để KHỎI tạo mục trùng: nhiều cụm là tên khác của quyển đã có.\n` +
				`Điền cột Phán: \`moi\` (quyển mới) · \`trung:<tên>\` (tên khác của mục đã có) · \`bo\` (không phải sách).\n\n` +
				`| Cụm | Số mục dẫn | Bộ | Gần nhất trong thư mục | Phán | Ngữ cảnh |\n|---|---|---|---|---|---|\n` +
				dong.join("\n") + "\n",
			"utf8",
		);
		console.log(`\n✓ đã ghi ${ds.length} ứng viên ra ${XUAT}`);
	}

	console.log(`\n── QUYỂN ĐÃ CÓ TRONG THƯ MỤC, đang được kho dẫn (cạnh dựng được ngay) ──`);
	for (const x of xep(daCo).slice(0, 15)) console.log(`  ${String(x.muc.size).padStart(4)} mục  ${x.cum}`);
	console.log(`\nTổng: ${xep(daCo).reduce((a, x) => a + x.muc.size, 0)} cạnh (mục ⟶ nguồn đã có) dò được từ ${daCo.size} quyển.`);
}

main().catch((err) => {
	console.error("✗ lỗi:", err?.message ?? err);
	process.exit(2);
});
