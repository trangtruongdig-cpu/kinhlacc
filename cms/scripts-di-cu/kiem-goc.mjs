// kiem-goc.mjs — Chốt "KHÔNG MẤT GÌ", dùng chung cho ba bộ sinh tệp tĩnh.
//
// VÌ SAO CẦN THÊM CHỐT NÀY khi đã có `cmp`:
// Hai chốt chứng minh hai việc KHÁC NHAU, và chúng có tuổi thọ khác nhau.
//
//   `cmp` giống-từng-byte  — chỉ đúng chừng nào ta CHƯA cố ý thêm gì. Hết vai trò
//                            ngay lần đầu có người thêm một trường mới (vd bốn ảnh
//                            3D sắp thêm vào huyệt vị).
//   kiem-goc "không mất gì" — mọi khoá/giá trị của BẢN GỐC vẫn còn y nguyên, khoá
//                            MỚI thì cho phép. Thứ này phải giữ MÃI MÃI.
//
// Bản gốc lấy thẳng từ git, không giữ bản sao trong repo: nó là 3MB và bản sao thì sẽ
// trôi. MỐC của mỗi tệp KHÁC NHAU, phải neo đúng commit cuối cùng chạm vào tệp đó
// TRƯỚC khi CMS bắt đầu sinh:
//
//   acupoints.js  c7a2652 (29/06/2026) — commit sau đó là 8774a4f, lúc CMS sinh
//   benh.js       c7a2652              — chưa từng đổi từ đó tới lúc CMS sinh
//   meridians.js  d01a26e (08/09/2026) — "xongTE", sửa tên huyệt thật
//                                        (Nghinh hương → Nghênh Hương, Thừa phò → Thừa Phù)
//
// ⚠️ Lấy nhầm mốc là chốt neo vào bản SAI rồi báo xanh: nếu dùng c7a2652 cho
// meridians.js thì nó sẽ đòi hai tên huyệt cũ quay lại.

import { execFileSync } from "node:child_process";

// ── SỬA LỖI GỐC CÓ CHỦ Ý ────────────────────────────────────────────────────────
// Chốt này bắt mọi thay đổi so với bản gốc. Nhưng bản gốc có LỖI THẬT, và sửa lỗi thì
// đúng là thay đổi. Danh sách dưới đây là những sửa đổi ĐÃ ĐƯỢC DUYỆT: chốt bỏ qua đúng
// chúng và vẫn bắt mọi thứ khác.
//
// Vì sao không dịch MỐC lên một commit mới thay vì khai danh sách: dịch mốc là mất khả
// năng bắt của chốt với MỌI thứ giữa hai mốc, không chỉ chỗ được duyệt. Danh sách thì
// hẹp — chỉ tha đúng cặp giá trị cũ→mới đã ghi.
//
// ⚠️ Mỗi dòng phải có `vi` (lý do) dẫn được BẰNG CHỨNG, không phải "sửa cho đúng".
//
// ⚠️ GIỚI HẠN CỦA CƠ CHẾ: nó khớp theo (khoá, giá trị cũ, giá trị mới), KHÔNG theo id bản
// ghi. Nếu cùng cặp giá trị đó xuất hiện ở bản ghi khác thì nó tha luôn chỗ đó. Với dữ
// liệu hiện tại điều đó không xảy ra (đã đo: "GB29", "GB-29", "居髎" mỗi giá trị chỉ có ở
// đúng bản ghi 133, và 0 mã quốc tế nào bị trùng trên nhiều huyệt). `soLan` là trần số
// lần được tha — vượt trần là chốt kêu, nên tha không thể âm thầm nới ra.
export const SUA_GOC = [
	// ── "Cư Liêu" (GB29) và "Cự Liêu" (ST3) bị gán lẫn danh tính ──────────────────
	// HAI TÊN KHÁC NHAU, chỉ khác dấu thanh, nên dễ lẫn: 居髎 Cư Liêu = GB29 (ở hông),
	// 巨髎 Cự Liêu = ST3 (trên mặt). Bằng chứng nằm trong chính hai mục từ:
	//
	//   id=124 "Cư Liêu"  ĐẶC TÍNH "Huyệt thứ 29 của kinh Đởm"
	//                     VỊ TRÍ  gai chậu trước trên ↔ mấu chuyển lớn   → GB29
	//                     mã: KHÔNG CÓ KHOÁ NÀO
	//   id=133 "Cự Liêu"  ĐẶC TÍNH "Huyệt thứ 3 của kinh Vị"
	//                     VỊ TRÍ  dưới mắt, chân cánh mũi                → ST3
	//                     mã: GB29 · GB-29 · 居髎 · "Squatting Crevice"  ← TRỌN BỘ của GB29
	//
	// id=124 chỉ THÊM khoá mã, mà thêm khoá thì chốt vốn đã cho phép → KHÔNG cần khai ở đây.
	// id=133 thì ĐỔI GIÁ TRỊ của khoá cũ → phải khai từng khoá.
	//
	// `english` CHƯA khai: nghĩa tiếng Anh của ST3 là việc của thầy thuốc, tôi không tự đặt.
	// Khi nào chốt được thì thêm một dòng ở đây — trước đó chốt sẽ kêu, và kêu là ĐÚNG.
	{
		tep: "acupoints.js", khoa: "international_code", cu: "GB29", moi: "ST3", soLan: 1,
		vi: 'id=133 "Cự Liêu" tự khai "Huyệt thứ 3 của kinh Vị", vị trí trên mặt → ST3.',
	},
	{
		tep: "acupoints.js", khoa: "code_dash", cu: "GB-29", moi: "ST-3", soLan: 1,
		vi: "Dạng gạch nối của cùng mã trên.",
	},
	{
		tep: "acupoints.js", khoa: "chinese", cu: "居髎", moi: "巨髎", soLan: 1,
		vi: "居髎 là chữ của Cư Liêu (GB29, ở hông). Mục này là Cự Liêu trên mặt → 巨髎.",
	},
];


export const MOC = {
	"acupoints.js": "c7a2652",
	"benh.js": "c7a2652",
	"meridians.js": "d01a26e",
};

/** Đọc bản gốc của một tệp dữ liệu từ git, trả về đối tượng window.<BIEN>. */
export function docBanGoc(tenTep, bien, goc) {
	const rev = MOC[tenTep];
	if (!rev) throw new Error(`kiem-goc: chưa khai mốc cho ${tenTep}`);
	const duong = `frontend/public/kinhmach3d/data/${tenTep}`;
	const noiDung = execFileSync("git", ["show", `${rev}:${duong}`], {
		cwd: goc, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
	});
	const w = {};
	new Function("window", noiDung)(w);
	return { du: w[bien], rev };
}

/**
 * So THEO TẬP CON: mọi khoá của `goc` phải có trong `moi` với giá trị y hệt.
 * Khoá mới trong `moi` được bỏ qua — đó là phần thêm có chủ ý.
 * Trả về mảng mô tả chỗ lệch (rỗng = đạt).
 */
export function soTapCon(goc, moi, duong = "", tha = null) {
	const ra = [];
	if (goc === null || typeof goc !== "object") {
		if (JSON.stringify(goc) !== JSON.stringify(moi)) {
			// Có sửa-lỗi-gốc nào giải thích đúng cặp giá trị này không? Khớp cả TÊN KHOÁ lẫn
			// CẢ HAI giá trị, nên nó không tha được một thay đổi khác cùng khoá.
			const khoa = duong.slice(duong.lastIndexOf(".") + 1);
			const duoc = tha?.find((x) => x.khoa === khoa
				&& JSON.stringify(x.cu) === JSON.stringify(goc)
				&& JSON.stringify(x.moi) === JSON.stringify(moi));
			if (duoc) { duoc._dungRoi = (duoc._dungRoi || 0) + 1; return ra; }
			ra.push(`${duong}: gốc ${JSON.stringify(goc)} ≠ mới ${JSON.stringify(moi)}`);
		}
		return ra;
	}
	if (Array.isArray(goc)) {
		if (!Array.isArray(moi)) return [`${duong}: gốc là mảng, mới thì không`];
		// Mảng so ĐỦ ĐỘ DÀI: mất một phần tử là mất dữ liệu, không phải "thêm có chủ ý".
		if (goc.length !== moi.length) return [`${duong}: mảng gốc ${goc.length} phần tử, mới ${moi.length}`];
		for (let i = 0; i < goc.length; i++) ra.push(...soTapCon(goc[i], moi[i], `${duong}[${i}]`, tha));
		return ra;
	}
	if (moi === null || typeof moi !== "object" || Array.isArray(moi)) return [`${duong}: gốc là đối tượng, mới thì không`];
	for (const k of Object.keys(goc)) {
		if (!(k in moi)) { ra.push(`${duong}.${k}: MẤT KHOÁ`); continue; }
		ra.push(...soTapCon(goc[k], moi[k], `${duong}.${k}`, tha));
	}
	return ra;
}

/** In kết quả và trả về số chỗ lệch. */
export function bao(tenTep, rev, lech, tha = null) {
	console.log(`── kiem-goc: ${tenTep} đối chiếu bản gốc ở ${rev} ──`);
	// Báo rõ dòng tha nào ĐÃ dùng, dòng nào CHƯA. "Chưa dùng" không phải lỗi — nó nghĩa là
	// sửa lỗi gốc đó chưa được áp vào dữ liệu. Nhưng phải in ra, không thì một dòng tha
	// viết sai (không khớp gì) sẽ nằm đó im lặng và ta tưởng nó đang bảo vệ điều gì.
	let thaQuaTran = 0;
	for (const x of tha || []) {
		const n = x._dungRoi || 0;
		const tran = x.soLan ?? 1;
		const vuot = n > tran;
		if (vuot) thaQuaTran++;
		console.log(
			`   ${vuot ? "✗" : n ? "✓" : "·"} tha ${x.khoa}: ${JSON.stringify(x.cu)} → ${JSON.stringify(x.moi)}` +
			(vuot ? ` — THA ${n} LẦN, vượt trần ${tran}: cặp giá trị này khớp nhiều bản ghi hơn dự tính`
				: n ? ` (đã dùng ${n} lần)` : " (chưa áp vào dữ liệu)"),
		);
	}
	if (thaQuaTran) {
		console.log(`✗ ${thaQuaTran} dòng tha vượt trần — siết lại trước khi tin kết quả.`);
		return thaQuaTran + lech.length;
	}
	if (!lech.length) {
		console.log("✓ KHÔNG MẤT GÌ — mọi khoá/giá trị của bản gốc còn nguyên (khoá thêm mới được phép).");
		return 0;
	}
	console.log(`✗ MẤT ${lech.length} chỗ:`);
	for (const x of lech.slice(0, 12)) console.log("   " + x);
	if (lech.length > 12) console.log(`   … và ${lech.length - 12} chỗ nữa`);
	return lech.length;
}
