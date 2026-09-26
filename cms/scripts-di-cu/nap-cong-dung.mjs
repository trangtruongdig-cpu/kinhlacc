// nap-cong-dung.mjs — Nạp hồ sơ ĐÃ DUYỆT vào cột ec_huyet_vi.cong_dung_nhom.
//
// Việc 9 (thí điểm 11 huyệt kinh Phế): từ điển hiện chỉ có mục TÁC DỤNG viết lối cổ
// văn ("Khu phong, hoá đàm, lý Phế, chỉ khát") — đúng nhưng người MỚI HỌC đọc không
// ra. Mục MỚI này viết lại theo lối "nhóm công dụng: chỉ định cụ thể", đặt CẠNH mục
// cổ văn (KHÔNG thay). Nội dung đối chiếu SỰ KIỆN với cms/.tam-focks/hoso.json (bóc
// từ Atlas of Acupuncture — Claudia Focks, bản Việt hoá Phùng Văn Chiến) nhưng diễn
// đạt lại bằng lời riêng, không chép nguyên khối — vừa để người mới học đọc dễ, vừa
// để trang không bị Google xếp trùng lặp với bản PDF đang lưu hành khắp các nhóm.
//
// ⚠️ HÌNH DẠNG JSON — đã ĐO THẬT bằng cách gọi thẳng hàm td_chu() (cms/sql/chi-muc-
// tra-cuu.sql) trước khi chốt, KHÔNG đoán:
//   { trang: 16, nhom: ["chuỗi một", "chuỗi hai"] }   → td_chu gộp lại "chuỗi một chuỗi hai" ✓
//   { trang: 16, nhom: [{nhom:"..", chiDinh:".."}] }  → td_chu trả về CHUỖI RỖNG      ✗
// Lý do: td_chu chỉ nhặt chữ ở GIÁ TRỊ CHUỖI khi khoá đúng là 'text' (khớp hình dạng
// Portable Text {children:[{text:'..'}]}) hoặc đệ quy tiếp khi giá trị là mảng/đối
// tượng. Khoá "nhom"/"chiDinh" không phải 'text' nên bị bỏ qua HOÀN TOÀN — mất trắng
// mà KHÔNG có lỗi nào báo. Vì vậy mỗi mục "nhom" ở đây là MỘT CHUỖI "Nhóm: Chỉ định."
// (giữ nguyên hoà giọng câu gốc "A: B" của sách), không phải một object con.
//
//   node scripts-di-cu/nap-cong-dung.mjs --thu   # in ra, không ghi
//   node scripts-di-cu/nap-cong-dung.mjs
//
// Sau khi ghi: chạy `node scripts-di-cu/dung-chi-muc.mjs huyet_vi` để dựng lại chỉ
// mục tra cứu (cong_dung_nhom đã khai vào mảng `than` trong dung-chi-muc.mjs), rồi
// `node scripts-di-cu/xuat-huyet-js.mjs` để sinh lại acupoints.js cho app đọc.

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const chiThu = process.argv.includes("--thu");

// Hồ sơ ĐÃ DUYỆT — 11 huyệt kinh Phế (LU1…LU11), khớp theo cột ma_huyet.
// `trang` là số trang trong bản dịch Focks/Phùng Văn Chiến đã đối chiếu (để truy
// nguồn); mỗi phần tử của `nhom` là "Tên nhóm công dụng: chỉ định cụ thể" viết lại
// bằng lời riêng, giữ nguyên SỰ KIỆN so với cms/.tam-focks/hoso.json.
const HO_SO = {
	LU1: {
		trang: 8,
		nhom: [
			"Hạ khí Phế, tan đờm, thanh nhiệt: dùng khi đường hô hấp rối loạn như ho, khó thở do đờm nhiệt.",
			"Thông đường dẫn nước trong cơ thể: giảm nghẹt mũi, sưng phù ở mặt.",
			"Giảm đau theo đường kinh và vùng cơ: đau mỏi vai, bụng trên và thành ngực bên.",
		],
	},
	LU2: {
		trang: 9,
		nhom: [
			"Thanh nhiệt Phế, hạ khí: ho, hen suyễn, khó thở, tức ngực.",
			"Giảm nóng bức lan ra tay chân: cảm giác nóng hầm hập từ trong xương lan ra tứ chi.",
			"Thông kinh lạc, giãn cơ vùng vai: đau sau lưng, mạn sườn ngực, vai gáy; đau khi giơ tay lên cao quá vai (đau vòng cung).",
		],
	},
	LU3: {
		trang: 10,
		nhom: [
			"Hạ khí Phế: hen phế quản, khó thở.",
			"Thanh nhiệt Phế, cầm máu: ho khạc đờm vàng lẫn máu, chảy máu cam.",
			"An thần, định phách: mất ngủ, hồi hộp bất an, buồn bã không rõ nguyên nhân.",
			"Thông kinh mạch: đau, sưng, đỏ ở giữa cánh tay.",
			"Huyệt cửa ngõ trên (thiên môn): hỗ trợ bướu cổ, một số bệnh về mắt.",
		],
	},
	LU4: {
		trang: 11,
		nhom: [
			"Hạ khí Phế: ho, khó thở, hen phế quản.",
			"Điều hoà khí huyết vùng ngực: đau thắt ngực, hồi hộp đánh trống ngực, tức ngực, bồn chồn.",
			"Thông kinh mạch: đau ở giữa cánh tay.",
		],
	},
	LU5: {
		trang: 12,
		nhom: [
			"Thanh nhiệt thượng tiêu, hạ khí Phế: ho, khó thở, hen phế quản.",
			"Thông đường tiểu: tiểu khó, tiểu bất thường, phù nề.",
			"Thông kinh lạc, giãn gân, giảm đau: đau cánh tay lan theo đường kinh, đau đầu gối, đau lưng dưới.",
		],
	},
	LU6: {
		trang: 13,
		nhom: [
			"Hạ khí Phế: ho, khó thở, hen phế quản.",
			"Thanh nhiệt, dưỡng Phế, cầm máu — trị chứng cấp: ho cấp có đờm vàng lẫn máu, viêm amidan, viêm thanh quản, cảm mạo cấp không ra mồ hôi do phong nhiệt hoặc khô nóng.",
			"Thông kinh mạch: đau bắp tay, khớp khuỷu tay, các ngón tay.",
		],
	},
	LU7: {
		trang: 14,
		nhom: [
			"Hỗ trợ vùng chẩm, đầu, cổ: các chứng ở gáy, đầu và cổ.",
			"Giải biểu, khu phong, hạ khí Phế: cảm mạo phong hàn, bệnh đường hô hấp, liệt mặt, đau dây thần kinh sinh ba, đau đầu.",
			"Điều hoà mạch Nhâm: bí tiểu, đau vùng sinh dục.",
			"Thông đường tiểu: rối loạn tiết niệu.",
			"Thông kinh lạc, giảm đau: đau dọc theo đường kinh Phế ở tay.",
			"Huyệt Lạc, an thần: rối loạn tâm thần nhẹ như trầm lặng ít cười, hay quên.",
		],
	},
	LU8: {
		trang: 15,
		nhom: [
			"Bổ khí Phế, giảm ho khò khè: ho, hen phế quản, khó thở, tức ngực, cảm sốt không ra mồ hôi.",
			"Thông kinh mạch tại chỗ và xa: đau cổ tay; hỗ trợ giảm đau vùng gan bàn chân quanh huyệt Dũng Tuyền.",
			"Mở tấu lý, khu phong: hỗ trợ cơ thể ra mồ hôi, đẩy phong tà ra ngoài.",
		],
	},
	LU9: {
		trang: 16,
		nhom: [
			"Bổ Phế, tan đờm, hạ khí: ho, khó thở do Phế khí hư yếu.",
			"Điều hoà khí huyết, ổn định nhịp mạch: bệnh về mạch máu, hồi hộp đánh trống ngực, khó thở khi gắng sức.",
			"Thông kinh lạc, giảm đau: đau dọc đường kinh Phế, đau gân cơ vùng cổ tay – bàn tay.",
		],
	},
	LU10: {
		trang: 17,
		nhom: [
			"Hạ khí Phế: ho, hen phế quản.",
			"Thanh nhiệt Phế: ho ra máu.",
			"Lợi hầu họng: viêm thanh quản, viêm họng hạt.",
			"Giáng khí nghịch: ợ hơi, thở gấp, khó thở, thở khò khè khi hít vào.",
			"Điều hoà Tâm – Vị: chứng khó nuốt.",
		],
	},
	LU11: {
		trang: 18,
		nhom: [
			"Khai khiếu, hồi tỉnh (huyệt cấp cứu): bất tỉnh, ngất xỉu, suy sụp, động kinh.",
			"Điều hoà khí Phế: hỗ trợ chung cho các rối loạn về khí ở Phế.",
			"Thanh nhiệt, lợi hầu họng: sốt, viêm họng cấp (viêm thanh quản, viêm họng hạt, viêm amidan), ho, bứt rứt.",
			"Thông kinh mạch, giảm đau: đau ngón tay cái, chuột rút, đau cổ tay.",
		],
	},
};

console.log(`Hồ sơ đã duyệt: ${Object.keys(HO_SO).length} huyệt kinh Phế.`);
if (chiThu) {
	for (const [ma, v] of Object.entries(HO_SO)) console.log(`  ${ma.padEnd(5)} tr${v.trang}  ${v.nhom.length} nhóm`);
	process.exit(0);
}

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
await kho.query("ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER").catch(() => {});

let n = 0;
for (const [ma, v] of Object.entries(HO_SO)) {
	const r = await kho.query(
		"UPDATE ec_huyet_vi SET cong_dung_nhom = $1 WHERE ma_huyet = $2 AND deleted_at IS NULL",
		[JSON.stringify(v), ma],
	);
	n += r.rowCount;
}

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`\nGhi cong_dung_nhom cho ${n} huyệt.`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
console.log("→ Rồi:       node scripts-di-cu/xuat-huyet-js.mjs --kiem-goc");
await kho.end();
