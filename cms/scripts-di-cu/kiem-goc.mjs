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
export function soTapCon(goc, moi, duong = "") {
	const ra = [];
	if (goc === null || typeof goc !== "object") {
		if (JSON.stringify(goc) !== JSON.stringify(moi)) ra.push(`${duong}: gốc ${JSON.stringify(goc)} ≠ mới ${JSON.stringify(moi)}`);
		return ra;
	}
	if (Array.isArray(goc)) {
		if (!Array.isArray(moi)) return [`${duong}: gốc là mảng, mới thì không`];
		// Mảng so ĐỦ ĐỘ DÀI: mất một phần tử là mất dữ liệu, không phải "thêm có chủ ý".
		if (goc.length !== moi.length) return [`${duong}: mảng gốc ${goc.length} phần tử, mới ${moi.length}`];
		for (let i = 0; i < goc.length; i++) ra.push(...soTapCon(goc[i], moi[i], `${duong}[${i}]`));
		return ra;
	}
	if (moi === null || typeof moi !== "object" || Array.isArray(moi)) return [`${duong}: gốc là đối tượng, mới thì không`];
	for (const k of Object.keys(goc)) {
		if (!(k in moi)) { ra.push(`${duong}.${k}: MẤT KHOÁ`); continue; }
		ra.push(...soTapCon(goc[k], moi[k], `${duong}.${k}`));
	}
	return ra;
}

/** In kết quả và trả về số chỗ lệch. */
export function bao(tenTep, rev, lech) {
	console.log(`── kiem-goc: ${tenTep} đối chiếu bản gốc ở ${rev} ──`);
	if (!lech.length) {
		console.log("✓ KHÔNG MẤT GÌ — mọi khoá/giá trị của bản gốc còn nguyên (khoá thêm mới được phép).");
		return 0;
	}
	console.log(`✗ MẤT ${lech.length} chỗ:`);
	for (const x of lech.slice(0, 12)) console.log("   " + x);
	if (lech.length > 12) console.log(`   … và ${lech.length - 12} chỗ nữa`);
	return lech.length;
}
