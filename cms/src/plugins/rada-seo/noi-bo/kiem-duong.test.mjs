import { test } from "node:test";
import assert from "node:assert/strict";
import { taoKiemDuong, chonDuong, taoDemKiem } from "./kiem-duong.mjs";

const GOC = "https://kinhlac.online";
const TRANG = {
	[`${GOC}/huyet/am-khich/`]: { status: 200, xRobots: "", html: "<html><head><title>Huyệt Âm Khích (HT6): vị trí &amp; tác dụng</title></head><body><h1>Âm Khích</h1></body></html>" },
	[`${GOC}/huyet/am-khich-2/`]: { status: 200, xRobots: "", html: "<html><head><title>Huyệt Ẩm Khích: vị trí</title></head><body><h1 class=\"t\">Ẩm   Khích</h1></body></html>" },
	[`${GOC}/bai-thuoc/khong-co/`]: { status: 200, xRobots: "noindex", html: "<title>Kinh Lạc</title>" },
	[`${GOC}/huyet/mat/`]: { status: 404, xRobots: "", html: "" },
	[`${GOC}/huyet/than-mon/`]: { status: 200, xRobots: "", html: "<title>Huyệt Thần Môn (HT7)</title>" },
	[`${GOC}/duoc-lieu/hoang-ky/`]: { status: 200, xRobots: "", html: "<title>Hoàng Kỳ</title><h1>Hoàng Kỳ</h1>" },
	[`${GOC}/benh-hoc/ho-ra-mau/`]: { status: 200, xRobots: "", html: "<title>Ho Ra Máu</title>" },
};
function docGia() {
	const goi = [];
	const doc = async (url) => { goi.push(url); return TRANG[url] ?? null; };
	return { doc, goi };
}

test("chonDuong: so tên CÓ DẤU trên trang thật để phân định Âm Khích / Ẩm Khích", async () => {
	const { doc } = docGia();
	const kiem = taoKiemDuong(doc, { goc: GOC, dem: taoDemKiem() });
	assert.equal(await chonDuong(kiem, { ten: "Ẩm Khích", duong: ["/huyet/am-khich-2/", "/huyet/am-khich/"] }), "/huyet/am-khich-2/");
	assert.equal(await chonDuong(kiem, { ten: "Âm Khích", duong: ["/huyet/am-khich-2/", "/huyet/am-khich/"] }), "/huyet/am-khich/");
	// Tên trong trang viết dạng tổ hợp (NFD) vẫn khớp tên NFC.
	assert.equal(await kiem("/huyet/than-mon/", "Thần Môn".normalize("NFD")), true);
});

test("kiemDuong: 200 + noindex (vỏ SPA) → trượt; 404 → trượt; không có trang → trượt; không tên mong → chỉ xét sống", async () => {
	const { doc } = docGia();
	const kiem = taoKiemDuong(doc, { goc: GOC, dem: taoDemKiem() });
	assert.equal(await kiem("/bai-thuoc/khong-co/"), false);
	assert.equal(await kiem("/huyet/mat/"), false);
	assert.equal(await kiem("/huyet/khong-biet/"), false);
	assert.equal(await kiem("/huyet/am-khich/"), true);
	assert.equal(await kiem("/huyet/am-khich/", "Tam Âm Giao"), false);
	assert.equal(await chonDuong(kiem, { ten: "Mắt", duong: ["/huyet/mat/"] }), null);
});

test("kiemDuong: đệm kết quả (cả đạt lẫn trượt), gọi lại không tải lại; quá ttl thì tải lại", async () => {
	const { doc, goi } = docGia();
	let t = 0;
	const kiem = taoKiemDuong(doc, { goc: GOC, ttlMs: 1000, now: () => t, dem: taoDemKiem() });
	await Promise.all([kiem("/huyet/am-khich/", "Âm Khích"), kiem("/huyet/am-khich/", "Âm Khích")]);
	await kiem("/huyet/am-khich/", "Âm Khích");
	await kiem("/huyet/mat/");
	await kiem("/huyet/mat/");
	assert.deepEqual(goi, [`${GOC}/huyet/am-khich/`, `${GOC}/huyet/mat/`]);
	// Cùng đường, khác tên mong: tải một lần, phán riêng.
	assert.equal(await kiem("/huyet/am-khich/", "Ẩm Khích"), false);
	assert.equal(goi.length, 2);
	t = 2000;
	await kiem("/huyet/mat/");
	assert.equal(goi.length, 3);
});

test("so tên theo RANH GIỚI TỪ: 'Ho' không đạt trên trang 'Hoàng Kỳ', đạt trên 'Ho Ra Máu'", async () => {
	const { doc } = docGia();
	const kiem = taoKiemDuong(doc, { goc: GOC, dem: taoDemKiem() });
	assert.equal(await kiem("/duoc-lieu/hoang-ky/", "Ho"), false);
	assert.equal(await kiem("/benh-hoc/ho-ra-mau/", "Ho"), true);
	assert.equal(await kiem("/duoc-lieu/hoang-ky/", "Hoàng Kỳ"), true);
});

test("đệm DÙNG CHUNG qua nhiều lời gọi route: hai bộ kiểm cùng đệm → tải MỘT lần", async () => {
	const { doc, goi } = docGia();
	const dem = taoDemKiem();
	assert.equal(await taoKiemDuong(doc, { goc: GOC, dem })("/huyet/am-khich/", "Âm Khích"), true);
	assert.equal(await taoKiemDuong(doc, { goc: GOC, dem })("/huyet/am-khich/", "Ẩm Khích"), false);
	assert.equal(goi.length, 1);
	// Đệm chỉ giữ cờ sống + tiêu đề đã rút, KHÔNG giữ HTML.
	for (const v of dem.giaTri()) assert.ok(v === null || (typeof v.song === "boolean" && Array.isArray(v.tieuDe) && !("html" in v)));
});

test("lỗi mạng (null) chỉ đệm ~5 phút; trang thật (kể cả 404) đệm 24 giờ", async () => {
	const { doc, goi } = docGia();
	let t = 0;
	const kiem = taoKiemDuong(doc, { goc: GOC, now: () => t, dem: taoDemKiem() });
	await kiem("/huyet/khong-biet/"); // docTrang trả null = lỗi mạng
	await kiem("/huyet/mat/"); // 404 thật
	assert.equal(goi.length, 2);
	t = 4 * 60 * 1000;
	await kiem("/huyet/khong-biet/");
	assert.equal(goi.length, 2);
	t = 5 * 60 * 1000 + 1;
	await kiem("/huyet/khong-biet/");
	await kiem("/huyet/mat/");
	assert.equal(goi.length, 3);
	assert.equal(goi[2], `${GOC}/huyet/khong-biet/`);
	t = 24 * 3600 * 1000 + 1;
	await kiem("/huyet/mat/");
	assert.equal(goi.length, 4);
});

test("docTrang ném → coi như lỗi mạng: trượt, đệm ngắn", async () => {
	let n = 0;
	let t = 0;
	const kiem = taoKiemDuong(async () => { n++; throw new Error("mạng"); }, { goc: GOC, now: () => t, dem: taoDemKiem() });
	assert.equal(await kiem("/huyet/am-khich/"), false);
	assert.equal(await kiem("/huyet/am-khich/"), false);
	assert.equal(n, 1);
	t = 6 * 60 * 1000;
	await kiem("/huyet/am-khich/");
	assert.equal(n, 2);
});

test("đệm có TRẦN (LRU): quá toiDa thì bỏ mục ít dùng nhất", async () => {
	const { doc, goi } = docGia();
	const dem = taoDemKiem({ toiDa: 2 });
	const kiem = taoKiemDuong(doc, { goc: GOC, dem });
	await kiem("/huyet/am-khich/");
	await kiem("/huyet/am-khich-2/");
	await kiem("/huyet/am-khich/"); // dùng lại → am-khich-2 thành cũ nhất
	await kiem("/huyet/than-mon/");
	assert.ok(dem.kichThuoc() <= 2);
	assert.equal(goi.length, 3);
	await kiem("/huyet/am-khich/"); // còn trong đệm
	assert.equal(goi.length, 3);
	await kiem("/huyet/am-khich-2/"); // đã bị bỏ → tải lại
	assert.equal(goi.length, 4);
});
