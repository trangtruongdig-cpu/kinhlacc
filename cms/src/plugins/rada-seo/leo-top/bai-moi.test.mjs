import { test } from "node:test";
import assert from "node:assert/strict";
import { xepBaiMoi, demTheoHang, banDoTrangCum, duongBlog, TUOI_DU_KET_LUAN } from "./bai-moi.mjs";
import { chuanHoaUrlTrang } from "./gsc.mjs";

const NGAY_MS = 86_400_000;
const NAY = Date.parse("2026-10-02T00:00:00.000Z");
const cachDay = (n) => new Date(NAY - n * NGAY_MS).toISOString();
const soLieu = (o) => new Map(Object.entries(o).map(([u, v]) => [chuanHoaUrlTrang(`https://kinhlac.online${u}`), v]));
const xep = (kh, m) => xepBaiMoi(kh, m, { now: NAY, chuanHoa: chuanHoaUrlTrang });

test("bài còn non KHÔNG bị kết tội, dù 0 hiển thị", () => {
	const ds = xep([{ id: "k1", slug: "a", dangLuc: cachDay(3) }], soLieu({}));
	assert.equal(ds[0].hang, "moi");
	assert.equal(ds[0].tuoi, 3);
});

test("quá 14 ngày mà 0 hiển thị → chua_hien (nghi index), không gọi là thất bại nội dung", () => {
	const ds = xep([{ id: "k1", slug: "a", dangLuc: cachDay(TUOI_DU_KET_LUAN + 1) }], soLieu({}));
	assert.equal(ds[0].hang, "chua_hien");
});

test("phân hạng theo vị trí: 1–3 đầu bảng, 4–50 đúng tầm leo, >50 ngoài tầm", () => {
	const kh = [
		{ id: "k1", slug: "dau", dangLuc: cachDay(30) },
		{ id: "k2", slug: "leo", dangLuc: cachDay(30) },
		{ id: "k3", slug: "xa", dangLuc: cachDay(30) },
	];
	const m = soLieu({
		"/blog/dau/": { nhap: 10, hienThi: 100, viTri: 2.4, ctr: 0.1 },
		"/blog/leo/": { nhap: 1, hienThi: 80, viTri: 12.5, ctr: 0.01 },
		"/blog/xa/": { nhap: 0, hienThi: 9, viTri: 71, ctr: 0 },
	});
	const h = Object.fromEntries(xep(kh, m).map((x) => [x.slug, x.hang]));
	assert.deepEqual(h, { dau: "dau_bang", leo: "tam_leo", xa: "ngoai_50" });
});

test("chưa cấu hình GSC thì mọi bài là 'moi' — thiếu căn cứ, không phải 'chưa hiển thị'", () => {
	const ds = xep([{ id: "k1", slug: "a", dangLuc: cachDay(90) }], null);
	assert.equal(ds[0].hang, "moi");
	assert.equal(ds[0].so, null);
});

test("xếp việc gấp lên đầu: tam_leo trước chua_hien trước ngoai_50 trước moi/dau_bang", () => {
	const kh = [
		{ id: "k1", slug: "dau", dangLuc: cachDay(30) },
		{ id: "k2", slug: "non", dangLuc: cachDay(1) },
		{ id: "k3", slug: "xa", dangLuc: cachDay(30) },
		{ id: "k4", slug: "an", dangLuc: cachDay(30) },
		{ id: "k5", slug: "leo", dangLuc: cachDay(30) },
	];
	const m = soLieu({
		"/blog/dau/": { nhap: 9, hienThi: 90, viTri: 1.2, ctr: 0.1 },
		"/blog/xa/": { nhap: 0, hienThi: 5, viTri: 80, ctr: 0 },
		"/blog/leo/": { nhap: 2, hienThi: 60, viTri: 9, ctr: 0.03 },
	});
	assert.deepEqual(
		xep(kh, m).map((x) => x.slug),
		["leo", "an", "xa", "non", "dau"],
	);
});

test("bài chưa có slug (chưa qua lò viết) bị bỏ qua, không dựng URL /blog//", () => {
	assert.equal(xep([{ id: "k1" }, { id: "k2", slug: "" }], soLieu({})).length, 0);
	assert.equal(duongBlog("/a/"), "/blog/a/");
});

test("demTheoHang luôn trả đủ 5 khoá, kể cả khi danh sách rỗng", () => {
	assert.deepEqual(demTheoHang([]), { tam_leo: 0, chua_hien: 0, ngoai_50: 0, moi: 0, dau_bang: 0 });
	assert.equal(demTheoHang([{ hang: "tam_leo" }, { hang: "tam_leo" }]).tam_leo, 2);
});

test("banDoTrangCum: phiên leo top tra ra được cụm sinh ra trang đó", () => {
	const m = banDoTrangCum([{ id: "k1", slug: "chay-mau-cam", cum: "chảy máu cam", cumId: "c1" }], { chuanHoa: chuanHoaUrlTrang });
	// Phiên lưu URL đầy đủ có "/" cuối; bản đồ dựng từ slug — chuẩn hoá phải khớp cả hai dạng.
	assert.deepEqual(m.get(chuanHoaUrlTrang("https://kinhlac.online/blog/chay-mau-cam/")), {
		cum: "chảy máu cam",
		cumId: "c1",
		keHoachId: "k1",
	});
	assert.equal(m.get(chuanHoaUrlTrang("http://www.kinhlac.online/blog/chay-mau-cam"))?.cum, "chảy máu cam");
});
