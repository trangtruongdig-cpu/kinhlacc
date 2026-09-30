import { test } from "node:test";
import assert from "node:assert/strict";
import { taoKiemDuong, chonDuong } from "./kiem-duong.mjs";

const GOC = "https://kinhlac.online";
const TRANG = {
	[`${GOC}/huyet/am-khich/`]: { status: 200, xRobots: "", html: "<html><head><title>Huyệt Âm Khích (HT6): vị trí &amp; tác dụng</title></head><body><h1>Âm Khích</h1></body></html>" },
	[`${GOC}/huyet/am-khich-2/`]: { status: 200, xRobots: "", html: "<html><head><title>Huyệt Ẩm Khích: vị trí</title></head><body><h1 class=\"t\">Ẩm   Khích</h1></body></html>" },
	[`${GOC}/bai-thuoc/khong-co/`]: { status: 200, xRobots: "noindex", html: "<title>Kinh Lạc</title>" },
	[`${GOC}/huyet/mat/`]: { status: 404, xRobots: "", html: "" },
	[`${GOC}/huyet/than-mon/`]: { status: 200, xRobots: "", html: "<title>Huyệt Thần Môn (HT7)</title>" },
};
function docGia() {
	const goi = [];
	const doc = async (url) => { goi.push(url); return TRANG[url] ?? null; };
	return { doc, goi };
}

test("chonDuong: so tên CÓ DẤU trên trang thật để phân định Âm Khích / Ẩm Khích", async () => {
	const { doc } = docGia();
	const kiem = taoKiemDuong(doc, { goc: GOC });
	assert.equal(await chonDuong(kiem, { ten: "Ẩm Khích", duong: ["/huyet/am-khich-2/", "/huyet/am-khich/"] }), "/huyet/am-khich-2/");
	assert.equal(await chonDuong(kiem, { ten: "Âm Khích", duong: ["/huyet/am-khich-2/", "/huyet/am-khich/"] }), "/huyet/am-khich/");
	// Tên trong trang viết dạng tổ hợp (NFD) vẫn khớp tên NFC.
	assert.equal(await kiem("/huyet/than-mon/", "Thần Môn".normalize("NFD")), true);
});

test("kiemDuong: 200 + noindex (vỏ SPA) → trượt; 404 → trượt; không có trang → trượt; không tên mong → chỉ xét sống", async () => {
	const { doc } = docGia();
	const kiem = taoKiemDuong(doc, { goc: GOC });
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
	const kiem = taoKiemDuong(doc, { goc: GOC, ttlMs: 1000, now: () => t });
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
