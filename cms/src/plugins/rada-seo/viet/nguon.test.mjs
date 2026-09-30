import { test } from "node:test";
import assert from "node:assert/strict";
import { xacMinhNguon } from "./nguon.mjs";
import { dungChiMuc } from "../noi-bo/chi-muc.mjs";

const GOC = "https://kinhlac.online";
const TRANG = {
	"https://pubmed.ncbi.nlm.nih.gov/123/": { status: 200, xRobots: "", html: "<title>Acupuncture for insomnia</title>" },
	"https://vi.wikipedia.org/wiki/Châm_cứu": { status: 200, xRobots: "", html: "<title>Châm cứu</title>" },
	"https://example.com/mat/": { status: 404, xRobots: "", html: "" },
	"https://example.com/an/": { status: 200, xRobots: "noindex, nofollow", html: "" },
	"https://example.com/chuyen/": { status: 301, xRobots: "", html: "" },
	"https://example.com/sap/": { loi: "không phân giải được tên miền" },
};
function docGia(them = {}) {
	const goi = [];
	return {
		goi,
		doc: async (url) => {
			goi.push(url);
			if (them[url]) return them[url]();
			return TRANG[url] ?? { loi: "lỗi mạng: không rõ" };
		},
	};
}

const CHI_MUC = dungChiMuc([
	{ bo: "nguon_y_van", title: "Hoàng Đế Nội Kinh", slug: "hoang-de-noi-kinh", ten_khac: "Nội Kinh" },
	{ bo: "nguon_y_van", title: "Thương Hàn Luận", slug: "thuong-han-luan" },
	{ bo: "nguon_y_van", title: "Châm Cứu Đại Thành", slug: "cham-cuu-dai-thanh" },
	{ bo: "huyet_vi", title: "Thần Môn", slug: "than-mon" },
]);
function kiemGia(song) {
	const goi = [];
	return { goi, kiem: async (duong, ten) => (goi.push([duong, ten]), song.includes(duong)) };
}

test("nguồn có url: giữ khi 200 và không noindex; bỏ kèm lý do thật", async () => {
	const { doc } = docGia();
	const { kiem } = kiemGia([]);
	const r = await xacMinhNguon(
		[
			{ title: "PubMed 123", url: "https://pubmed.ncbi.nlm.nih.gov/123/" },
			{ title: "Mất", url: "https://example.com/mat/" },
			{ title: "Ẩn", url: "https://example.com/an/" },
			{ title: "Chuyển", url: "https://example.com/chuyen/" },
			{ title: "Sập", url: "https://example.com/sap/" },
			{ title: "Nội bộ mạng", url: "http://backend:3000/x" },
			{ title: "Không phải url", url: "sách cũ" },
		],
		{ docTrang: doc, chiMuc: CHI_MUC, kiemDuong: kiem, goc: GOC },
	);
	assert.deepEqual(r.giu, [{ title: "PubMed 123", url: "https://pubmed.ncbi.nlm.nih.gov/123/" }]);
	const ly = Object.fromEntries(r.bo.map((x) => [x.title, x.lyDo]));
	assert.equal(ly["Mất"], "http_404");
	assert.equal(ly["Ẩn"], "noindex");
	assert.equal(ly["Chuyển"], "http_301");
	assert.equal(ly["Sập"], "loi_tai");
	assert.equal(r.bo.find((x) => x.title === "Sập").chiTiet, "không phân giải được tên miền");
	assert.equal(ly["Nội bộ mạng"], "url_bi_chan");
	assert.equal(ly["Không phải url"], "url_bi_chan");
	assert.equal(r.bo.find((x) => x.title === "Mất").url, "https://example.com/mat/");
});

test("nguồn không url: chỉ nhận khi khớp một trang /nguon/ (đúng tên / tên khác) VÀ trang sống đúng tên", async () => {
	const { doc, goi } = docGia();
	const { kiem, goi: goiKiem } = kiemGia(["/nguon/hoang-de-noi-kinh/", "/nguon/cham-cuu-dai-thanh/"]);
	const r = await xacMinhNguon(
		[
			{ title: "Hoàng Đế Nội Kinh" },
			{ title: "Nội Kinh" },
			{ title: "Thương Hàn Luận" }, // có trong chỉ mục nhưng trang không sống
			{ title: "Thần Môn" }, // là huyệt, không phải nguồn
			{ title: "Châm Cứu" }, // chỉ khớp một phần "Châm Cứu Đại Thành" → không nhận
			{ title: "Sách Mô Hình Nhớ Ra" },
		],
		{ docTrang: doc, chiMuc: CHI_MUC, kiemDuong: kiem, goc: GOC },
	);
	assert.deepEqual(r.giu, [{ title: "Hoàng Đế Nội Kinh", url: "https://kinhlac.online/nguon/hoang-de-noi-kinh/" }]);
	const ly = Object.fromEntries(r.bo.map((x) => [x.title, x.lyDo]));
	assert.equal(ly["Nội Kinh"], "trung_url"); // cùng trang với mục trước
	assert.equal(ly["Thương Hàn Luận"], "trang_nguon_khong_song");
	assert.equal(ly["Thần Môn"], "khong_co_trang_nguon");
	assert.equal(ly["Châm Cứu"], "khong_co_trang_nguon");
	assert.equal(ly["Sách Mô Hình Nhớ Ra"], "khong_co_trang_nguon");
	assert.equal(goi.length, 0); // nguồn nội bộ đi qua kiemDuong, không tải bằng docTrang
	assert.deepEqual(goiKiem[0], ["/nguon/hoang-de-noi-kinh/", "Hoàng Đế Nội Kinh"]);
});

test("trùng url (bỏ hash, '/' cuối) → bỏ bản sau; quá toiDa → bỏ phần dư, không tải", async () => {
	const { doc, goi } = docGia();
	const { kiem } = kiemGia([]);
	const r = await xacMinhNguon(
		[
			{ title: "A", url: "https://pubmed.ncbi.nlm.nih.gov/123/" },
			{ title: "A2", url: "https://pubmed.ncbi.nlm.nih.gov/123#abs" },
			{ title: "B", url: "https://vi.wikipedia.org/wiki/Châm_cứu" },
			{ title: "C", url: "https://example.com/mat/" },
		],
		{ docTrang: doc, chiMuc: CHI_MUC, kiemDuong: kiem, goc: GOC, toiDa: 3 },
	);
	assert.deepEqual(r.giu.map((x) => x.title), ["A", "B"]);
	assert.deepEqual(r.bo.map((x) => [x.title, x.lyDo]), [["A2", "trung_url"], ["C", "vuot_tran"]]);
	assert.ok(!goi.includes("https://example.com/mat/"));
	assert.equal(goi.filter((u) => u.startsWith("https://pubmed")).length, 1);
});

test("hết hạn tổng → phần chưa xét 'het_gio_tong'; một trang treo không giữ cả lượt", async () => {
	const { doc } = docGia({ "https://example.com/treo/": () => new Promise(() => {}) });
	const { kiem } = kiemGia([]);
	const batDau = Date.now();
	const r = await xacMinhNguon(
		[
			{ title: "A", url: "https://pubmed.ncbi.nlm.nih.gov/123/" },
			{ title: "Treo", url: "https://example.com/treo/" },
			{ title: "Sau", url: "https://vi.wikipedia.org/wiki/Châm_cứu" },
			{ title: "Nội Kinh" },
		],
		{ docTrang: doc, chiMuc: CHI_MUC, kiemDuong: kiem, goc: GOC, hanTongMs: 80 },
	);
	assert.ok(Date.now() - batDau < 1000);
	assert.deepEqual(r.giu.map((x) => x.title), ["A"]);
	assert.deepEqual(r.bo.map((x) => [x.title, x.lyDo]), [["Treo", "het_gio_tong"], ["Sau", "het_gio_tong"], ["Nội Kinh", "het_gio_tong"]]);
});

test("đồng hồ tiêm vào: đã quá hạn trước mục đầu → mọi mục het_gio_tong; mục hỏng dạng không ném", async () => {
	const { doc, goi } = docGia();
	const { kiem } = kiemGia([]);
	let t = 0;
	const now = () => (t += 40_000);
	const r = await xacMinhNguon([{ title: "A", url: "https://pubmed.ncbi.nlm.nih.gov/123/" }, { title: "B", url: "https://vi.wikipedia.org/wiki/Châm_cứu" }], {
		docTrang: doc, chiMuc: CHI_MUC, kiemDuong: kiem, goc: GOC, now,
	});
	assert.deepEqual(r.giu.map((x) => x.title), ["A"]);
	assert.deepEqual(r.bo.map((x) => x.lyDo), ["het_gio_tong"]);
	assert.equal(goi.length, 1);
	const r2 = await xacMinhNguon([null, { url: "https://pubmed.ncbi.nlm.nih.gov/123/" }, { title: "  " }], {
		docTrang: doc, chiMuc: CHI_MUC, kiemDuong: kiem, goc: GOC,
	});
	assert.deepEqual(r2.giu, []);
	assert.deepEqual(r2.bo.map((x) => x.lyDo), ["thieu_tieu_de", "thieu_tieu_de", "thieu_tieu_de"]);
});

test("url tương đối '/nguon/…' hoặc cùng gốc → đi qua kiemDuong với tên nguồn", async () => {
	const { doc, goi } = docGia();
	const { kiem, goi: goiKiem } = kiemGia(["/nguon/thuong-han-luan/"]);
	const r = await xacMinhNguon(
		[
			{ title: "Thương Hàn Luận", url: "/nguon/thuong-han-luan/" },
			{ title: "Hoàng Đế Nội Kinh", url: "https://kinhlac.online/nguon/hoang-de-noi-kinh" },
		],
		{ docTrang: doc, chiMuc: CHI_MUC, kiemDuong: kiem, goc: GOC },
	);
	assert.deepEqual(r.giu, [{ title: "Thương Hàn Luận", url: "https://kinhlac.online/nguon/thuong-han-luan/" }]);
	assert.deepEqual(r.bo.map((x) => x.lyDo), ["trang_noi_bo_khong_song"]);
	assert.equal(goi.length, 0);
	// Tên nguồn phải khớp mục /nguon/ đó (rà soát I8) — kiemDuong kiểm cả tên trên trang.
	assert.deepEqual(goiKiem[1], ["/nguon/hoang-de-noi-kinh/", "Hoàng Đế Nội Kinh"]);
});

test("I8: url cùng site chỉ nhận khi là /nguon/<slug>/ VÀ tiêu đề khớp tên mục đó — còn lại 'khong_phai_nguon'", async () => {
	const { doc } = docGia();
	const { kiem, goi: goiKiem } = kiemGia(["/", "/huyet/than-mon/", "/nguon/thuong-han-luan/", "/nguon/hoang-de-noi-kinh/"]);
	const r = await xacMinhNguon(
		[
			{ title: "Trang chủ Kinh Lạc", url: "/" },
			{ title: "Thần Môn", url: "https://kinhlac.online/huyet/than-mon/" },
			{ title: "Sách bịa gắn đường thật", url: "/nguon/thuong-han-luan/" },
			{ title: "Thương Hàn Luận", url: "/nguon/hoang-de-noi-kinh/" },
			{ title: "Nội Kinh", url: "/nguon/hoang-de-noi-kinh/?x=1" },
		],
		{ docTrang: doc, chiMuc: CHI_MUC, kiemDuong: kiem, goc: GOC },
	);
	assert.deepEqual(r.bo.map((x) => [x.title, x.lyDo]), [
		["Trang chủ Kinh Lạc", "khong_phai_nguon"],
		["Thần Môn", "khong_phai_nguon"],
		["Sách bịa gắn đường thật", "khong_phai_nguon"],
		["Thương Hàn Luận", "khong_phai_nguon"],
	]);
	assert.deepEqual(r.giu, [{ title: "Nội Kinh", url: "https://kinhlac.online/nguon/hoang-de-noi-kinh/" }]);
	assert.deepEqual(goiKiem, [["/nguon/hoang-de-noi-kinh/", "Hoàng Đế Nội Kinh"]]);
});
