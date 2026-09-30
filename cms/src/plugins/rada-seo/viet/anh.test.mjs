import { test } from "node:test";
import assert from "node:assert/strict";
import { napThuVienAnh, dungChiMucAnh, chonAnhBia, docAlt, layChiMucAnh, xoaDemChiMucAnh, maTheoTenTuChiMuc } from "./anh.mjs";
import { dungChiMuc } from "../noi-bo/chi-muc.mjs";

// Dạng alt THẬT trong thư viện (cms/scripts-di-cu/anh-huyet.mjs, anh-huyet-3d.mjs,
// anh-duoc-lieu.mjs, anh-kinh.mjs). Tên kinh lấy nguyên từ meridians.js ("Thái âm" chữ thường).
const anh = (id, alt, mimeType = "image/webp") => ({ id, alt, filename: `${id}.webp`, mimeType, size: 1, url: `/x/${id}` });
const THU_VIEN = [
	anh("m-tam", "Huyệt Tam Âm Giao"),
	anh("m-tam3d-gp", "Huyệt SP6 — lớp giải phẫu"),
	anh("m-tam3d-da", "Huyệt SP6 — vị trí trên da"),
	anh("m-than", "Huyệt Thần Môn"),
	anh("m-am", "Huyệt Âm Khích"),
	anh("m-am2", "Huyệt Ẩm Khích"),
	anh("m-qn3d", "Huyệt CV4 — trên đường kinh"),
	anh("m-hk", "Vị thuốc Hoàng Kỳ"),
	anh("m-mm", "Vị thuốc Mạch Môn"),
	anh("m-phe-tq", "anh_tong_quat — Kinh Thủ Thái âm Phế"),
	anh("m-phe-c", "anh_chinh — Kinh Thủ Thái âm Phế"),
	anh("m-vi-sd", "anh_so_do — Kinh Túc Dương Minh Vị"),
	anh("m-vi-c", "anh_chinh — Kinh Túc Dương Minh Vị"),
	anh("m-khac", "Ảnh bìa bài viết cũ"),
];

test("docAlt: nhận đủ bốn dạng alt thật, bỏ alt lạ", () => {
	assert.deepEqual(docAlt("Huyệt Tam Âm Giao"), { loai: "huyet", ten: "Tam Âm Giao" });
	assert.deepEqual(docAlt("Huyệt SP6 — vị trí trên da"), { loai: "huyet3d", ma: "SP6", kieu: "vị trí trên da" });
	assert.deepEqual(docAlt("Huyệt HT7 — các huyệt lân cận"), { loai: "huyet3d", ma: "HT7", kieu: "các huyệt lân cận" });
	assert.deepEqual(docAlt("Vị thuốc Hoàng Kỳ"), { loai: "vi_thuoc", ten: "Hoàng Kỳ" });
	assert.deepEqual(docAlt("anh_chinh — Kinh Thủ Thái âm Phế"), { loai: "kinh", cot: "anh_chinh", ten: "Kinh Thủ Thái âm Phế" });
	assert.equal(docAlt("Ảnh bìa bài viết cũ"), null);
	assert.equal(docAlt(""), null);
	assert.equal(docAlt(null), null);
	// Dạng tổ hợp (NFD) vẫn đọc được, trả tên NFC.
	assert.deepEqual(docAlt("Huyệt Thần Môn".normalize("NFD")), { loai: "huyet", ten: "Thần Môn" });
});

test("napThuVienAnh: đọc theo trang tới hết, lọc image/*, có trần toiDa", async () => {
	const goi = [];
	const ds = [...THU_VIEN, anh("m-pdf", "Huyệt Thần Môn", "application/pdf")];
	const media = {
		async list(opts) {
			goi.push(opts);
			const i = opts.cursor ? Number(opts.cursor) : 0;
			const trang = ds.slice(i, i + 5);
			const hasMore = i + 5 < ds.length;
			return { items: trang, hasMore, cursor: hasMore ? String(i + 5) : undefined };
		},
	};
	const ra = await napThuVienAnh(media);
	assert.equal(ra.length, THU_VIEN.length);
	assert.deepEqual(Object.keys(ra[0]).sort(), ["alt", "filename", "id", "mimeType"]);
	assert.equal(goi[0].limit, 100);
	assert.equal(goi[0].mimeType, "image/");
	assert.equal(goi.length, 3);
	const tran = await napThuVienAnh(media, { toiDa: 7 });
	assert.equal(tran.length, 7);
});

test("napThuVienAnh: cursor hỏng (lặp lại) không làm treo", async () => {
	let n = 0;
	const media = { async list() { n++; return { items: [anh(`a${n}`, "Huyệt X Y")], hasMore: true, cursor: "c" }; } };
	const ra = await napThuVienAnh(media, { toiDa: 50 });
	assert.ok(n <= 60);
	assert.ok(ra.length <= 50);
});

const CM = dungChiMucAnh(THU_VIEN);

test("chonAnhBia: huyệt TRỤ CỘT thắng mọi thứ; ảnh 2D thắng 3D", () => {
	const r = chonAnhBia(CM, {
		tieuDe: "Hoàng Kỳ và kinh Phế: bồi bổ khí",
		tuKhoaChinh: "hoàng kỳ",
		trangTruCot: { duong: "/huyet/tam-am-giao/", ten: "Tam Âm Giao" },
		lienKetDich: [],
	});
	assert.equal(r.mediaId, "m-tam");
	assert.equal(r.alt, "Huyệt Tam Âm Giao");
	assert.match(r.lyDo, /trụ cột/);
});

test("chonAnhBia: trụ cột dạng chuỗi — tên lấy từ lienKetDich có tên, hoặc slug khớp DUY NHẤT", () => {
	// Chuỗi trần, slug khớp đúng một tên huyệt có ảnh.
	assert.equal(chonAnhBia(CM, { tieuDe: "Giấc ngủ theo Đông y", trangTruCot: "/huyet/than-mon/" })?.mediaId, "m-than");
	// am-khich khớp CẢ Âm Khích lẫn Ẩm Khích khi bỏ dấu → không đoán.
	assert.equal(chonAnhBia(CM, { tieuDe: "Giấc ngủ theo Đông y", trangTruCot: "/huyet/am-khich/" }), null);
	// Có tên đi kèm thì phân định được, kể cả slug có hậu tố -2.
	assert.equal(chonAnhBia(CM, { tieuDe: "Giấc ngủ", trangTruCot: { duong: "/huyet/am-khich-2/", ten: "Ẩm Khích" } })?.mediaId, "m-am2");
	assert.equal(
		chonAnhBia(CM, { tieuDe: "Giấc ngủ", trangTruCot: "/huyet/am-khich/", lienKetDich: [{ duong: "/huyet/am-khich/", ten: "Âm Khích" }] })?.mediaId,
		"m-am",
	);
});

test("chonAnhBia: huyệt nêu trong từ khoá chính / tiêu đề — phân biệt dấu", () => {
	assert.equal(chonAnhBia(CM, { tieuDe: "Huyệt Âm Khích: vị trí và cách xác định", tuKhoaChinh: "" })?.mediaId, "m-am");
	assert.equal(chonAnhBia(CM, { tieuDe: "Huyệt Ẩm Khích: vị trí và cách xác định" })?.mediaId, "m-am2");
	// Không dấu → không phân định được Âm/Ẩm → bỏ qua, không chọn bừa.
	assert.equal(chonAnhBia(CM, { tieuDe: "huyet am khich" }), null);
	// Không dấu nhưng tên duy nhất → nhận.
	assert.equal(chonAnhBia(CM, { tieuDe: "huyet tam am giao" })?.mediaId, "m-tam");
	// Từ khoá chính đứng trước tiêu đề.
	assert.equal(chonAnhBia(CM, { tieuDe: "Huyệt Thần Môn và giấc ngủ", tuKhoaChinh: "huyệt Tam Âm Giao" })?.mediaId, "m-tam");
});

test("chonAnhBia: huyệt chỉ có ảnh 3D — tới qua mã trong tiêu đề, ưu tiên 'vị trí trên da'", () => {
	assert.equal(chonAnhBia(CM, { tieuDe: "Huyệt Quan Nguyên (CV4): bồi bổ nguyên khí" })?.mediaId, "m-qn3d");
	// Có bảng mã → tên huyệt tới được ảnh 3D; 'vị trí trên da' thắng 'lớp giải phẫu'.
	const cm = dungChiMucAnh(THU_VIEN.filter((x) => x.id !== "m-tam"), { maTheoTen: { "Tam Âm Giao": "SP6" } });
	const r = chonAnhBia(cm, { tieuDe: "Huyệt Tam Âm Giao: vị trí, tác dụng" });
	assert.equal(r?.mediaId, "m-tam3d-da");
});

test("chonAnhBia: vị thuốc sau huyệt; 'Mạch Môn' không khớp 'Huyết Môn'", () => {
	assert.equal(chonAnhBia(CM, { tieuDe: "Hoàng Kỳ: vị thuốc bổ khí", tuKhoaChinh: "hoàng kỳ" })?.mediaId, "m-hk");
	assert.equal(chonAnhBia(CM, { tieuDe: "Huyệt Thần Môn phối Hoàng Kỳ" })?.mediaId, "m-than");
	assert.equal(chonAnhBia(CM, { tieuDe: "Huyết Môn là gì" }), null);
});

test("chonAnhBia: kinh nêu trong tiêu đề/từ khoá → ảnh anh_chinh", () => {
	assert.equal(chonAnhBia(CM, { tieuDe: "Kinh Vị (Túc Dương Minh): đường đi và các huyệt" })?.mediaId, "m-vi-c");
	assert.equal(chonAnhBia(CM, { tieuDe: "Đường đi của khí", tuKhoaPhu: ["kinh Phế"] })?.mediaId, "m-phe-c");
	assert.equal(chonAnhBia(CM, { tieuDe: "Thái Âm Phế và hơi thở" })?.mediaId, "m-phe-c");
	// Chỉ có ảnh sơ đồ → dùng nó còn hơn không.
	const cm = dungChiMucAnh(THU_VIEN.filter((x) => x.id !== "m-vi-c"));
	assert.equal(chonAnhBia(cm, { tieuDe: "Kinh Vị và tiêu hoá" })?.mediaId, "m-vi-sd");
	// "Phế" một mình không đủ — một chữ có mặt trong quá nhiều câu.
	assert.equal(chonAnhBia(CM, { tieuDe: "Phế khí hư: dấu hiệu" }), null);
});

test("chonAnhBia: không khớp gì → null (không chèn ảnh lạc đề); tất định", () => {
	assert.equal(chonAnhBia(CM, { tieuDe: "Đo kinh lạc bằng nhiệt độ 24 tỉnh huyệt", tuKhoaChinh: "đo kinh lạc" }), null);
	const vao = { tieuDe: "Huyệt Thần Môn, Tam Âm Giao và giấc ngủ", tuKhoaChinh: "mất ngủ" };
	const a = chonAnhBia(CM, vao);
	const b = chonAnhBia(dungChiMucAnh([...THU_VIEN].reverse()), vao);
	assert.deepEqual(a, b);
	assert.equal(chonAnhBia(dungChiMucAnh([]), vao), null);
});

test("chonAnhBia: nhiều ảnh cùng tên → id nhỏ nhất (tất định)", () => {
	const cm = dungChiMucAnh([anh("z2", "Huyệt Thần Môn"), anh("a1", "Huyệt Thần Môn")]);
	assert.equal(chonAnhBia(cm, { tieuDe: "Huyệt Thần Môn" }).mediaId, "a1");
});

test("layChiMucAnh: đệm 24 h trong tiến trình; lỗi nạp giữ 10 phút", async () => {
	xoaDemChiMucAnh();
	let n = 0, hong = false;
	const media = {
		async list() {
			n++;
			if (hong) throw new Error("Missing capability: media:read");
			return { items: [anh("m-than", "Huyệt Thần Môn")], hasMore: false };
		},
	};
	let t = 0;
	const now = () => t;
	const a = await layChiMucAnh(media, { now });
	await layChiMucAnh(media, { now });
	assert.equal(n, 1);
	assert.equal(chonAnhBia(a, { tieuDe: "Huyệt Thần Môn" }).mediaId, "m-than");
	t = 24 * 3600 * 1000 + 1;
	hong = true;
	const b = await layChiMucAnh(media, { now });
	assert.equal(n, 2);
	assert.ok(b.loiNap);
	t += 5 * 60 * 1000;
	await layChiMucAnh(media, { now });
	assert.equal(n, 2);
	t += 6 * 60 * 1000;
	hong = false;
	const c = await layChiMucAnh(media, { now });
	assert.equal(n, 3);
	assert.equal(c.loiNap, null);
	xoaDemChiMucAnh();
});

test("maTheoTenTuChiMuc: rút mã huyệt từ chỉ mục nội bộ; trụ cột chỉ có ảnh 3D vẫn ra ảnh", () => {
	const noiBo = dungChiMuc([
		{ bo: "huyet_vi", title: "Tam Âm Giao", slug: "tam-am-giao", ma_huyet: "SP6", ten_khac: "Thừa Mạng" },
		{ bo: "huyet_vi", title: "Ẩm Khích", slug: "am-khich-2", slug_goc: "am-khich" },
		{ bo: "kinh_mach", title: "Kinh Túc Thái Âm Tỳ", slug: "ty", ma: "SP" },
	]);
	const ma = maTheoTenTuChiMuc(noiBo);
	assert.deepEqual([...ma], [["Tam Âm Giao", "SP6"]]);
	const cm = dungChiMucAnh(THU_VIEN.filter((x) => x.id !== "m-tam"), { maTheoTen: ma });
	const r = chonAnhBia(cm, { tieuDe: "Giấc ngủ", trangTruCot: "/huyet/tam-am-giao/" });
	assert.equal(r?.mediaId, "m-tam3d-da");
	assert.match(r.lyDo, /3D/);
});
