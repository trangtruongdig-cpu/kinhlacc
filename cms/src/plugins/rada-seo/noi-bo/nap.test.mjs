import { test } from "node:test";
import assert from "node:assert/strict";
import { napMucNoiBo, layChiMuc, traBaiThuoc, xoaDemChiMuc } from "./nap.mjs";
import { timTrongChiMuc } from "./chi-muc.mjs";

/** content.list giả: bảng bộ → mảng trang ({items, cursor, hasMore}); bộ trong `hong` thì ném. */
function contentGia(trang, hong = []) {
	const goi = [];
	return {
		goi,
		async list(bo, opts) {
			goi.push({ bo, opts });
			if (hong.includes(bo) || !trang[bo]) throw new Error(`Collection not found: ${bo}`);
			const i = opts.cursor ? Number(opts.cursor) : 0;
			const conNua = i + 1 < trang[bo].length;
			return { items: trang[bo][i], hasMore: conNua, cursor: conNua ? String(i + 1) : undefined };
		},
	};
}
const muc = (slug, data) => ({ id: `id-${slug}`, slug, data });
const TRANG = {
	huyet_vi: [
		[muc("tam-am-giao", { title: "Tam Âm Giao", slug_goc: "tam-am-giao", ma_huyet: "SP6", ten_khac: "Thừa Mạng" })],
		[muc("am-khich-2", { title: "Ẩm Khích", slug_goc: "am-khich" })],
	],
	kinh_mach: [[muc("ty", { title: "Kinh Túc Thái Âm Tỳ", slug_goc: "kinh-tuc-thai-am-ty", ma: "SP" })]],
};

test("napMucNoiBo: đọc hết các trang, chỉ bản đã xuất bản; bộ lỗi ghi vào loiNap, không ném", async () => {
	const content = contentGia(TRANG, ["nguon_y_van"]);
	const cm = await napMucNoiBo(content);
	assert.equal(cm.muc.length, 3);
	assert.deepEqual(timTrongChiMuc(cm, "Thừa Mạng")[0].duong, ["/huyet/tam-am-giao/"]);
	assert.deepEqual(timTrongChiMuc(cm, "Ẩm Khích")[0].duong, ["/huyet/am-khich-2/", "/huyet/am-khich/"]);
	assert.deepEqual(timTrongChiMuc(cm, "kinh Tỳ")[0].duong, ["/kinh/ty/"]);
	assert.ok(cm.loiNap.some((l) => l.bo === "nguon_y_van"));
	assert.ok(!cm.loiNap.some((l) => l.bo === "huyet_vi" || l.bo === "kinh_mach"));
	assert.equal(content.goi.filter((g) => g.bo === "huyet_vi").length, 2);
	for (const g of content.goi) {
		assert.equal(g.opts.where?.status, "published", g.bo);
		assert.ok(g.opts.limit <= 100);
	}
});

test("layChiMuc: hai lời gọi đồng thời dựng MỘT lượt; quá ttl thì dựng lại", async () => {
	xoaDemChiMuc();
	const content = contentGia(TRANG);
	let t = 1_000;
	const now = () => t;
	const [a, b] = await Promise.all([layChiMuc(content, { ttlMs: 60_000, now }), layChiMuc(content, { ttlMs: 60_000, now })]);
	assert.equal(a, b);
	const soLuot = () => content.goi.filter((g) => g.bo === "kinh_mach").length;
	assert.equal(soLuot(), 1);
	t += 30_000;
	assert.equal(await layChiMuc(content, { ttlMs: 60_000, now }), a);
	assert.equal(soLuot(), 1);
	t += 31_000;
	const c = await layChiMuc(content, { ttlMs: 60_000, now });
	assert.notEqual(c, a);
	assert.equal(soLuot(), 2);
	xoaDemChiMuc();
});

test("traBaiThuoc: khuôn đo được → đường bài thuốc / dược liệu / nguồn; bỏ tên < 4 ký tự", async () => {
	const goi = [];
	const fetchGia = async (url, init) => {
		goi.push({ url, init, body: JSON.parse(init.body) });
		return Response.json({
			"Quy Tỳ Thang": [{ loai: "bai_thuoc", ten: "Quy Tỳ Thang", slug: "quy-ty-thang" }],
			"Toan Táo Nhân": [{ loai: "vi_thuoc", ten: "Toan Táo Nhân", id: 61 }],
			"Thương Hàn Luận": [{ loai: "nguon", ten: "Thương Hàn Luận", slug: "thuong-han-luan" }],
		});
	};
	const kq = await traBaiThuoc(fetchGia, ["Quy Tỳ Thang", "Toan Táo Nhân", "Thương Hàn Luận", "abc"], { goc: "https://kinhlac.online" });
	assert.equal(goi.length, 1);
	assert.equal(goi[0].url, "https://kinhlac.online/api/tra-cuu/ten");
	assert.equal(goi[0].init.method, "POST");
	assert.deepEqual(goi[0].body.ten, ["Quy Tỳ Thang", "Toan Táo Nhân", "Thương Hàn Luận"]);
	assert.deepEqual(kq["Quy Tỳ Thang"], [{ ten: "Quy Tỳ Thang", loai: "bai_thuoc", duong: "/bai-thuoc/quy-ty-thang/" }]);
	assert.deepEqual(kq["Toan Táo Nhân"], [{ ten: "Toan Táo Nhân", loai: "duoc_lieu", duong: "/duoc-lieu/61/" }]);
	assert.deepEqual(kq["Thương Hàn Luận"], [{ ten: "Thương Hàn Luận", loai: "nguon", duong: "/nguon/thuong-han-luan/" }]);
});

test("traBaiThuoc: > 200 tên chia lượt; lỗi mạng → {} không ném; toàn tên ngắn thì không gọi", async () => {
	const lo = [];
	const kq = await traBaiThuoc(async (_u, init) => { lo.push(JSON.parse(init.body).ten.length); return Response.json({}); },
		Array.from({ length: 450 }, (_, i) => `Tên số ${i}`), { goc: "https://kinhlac.online" });
	assert.deepEqual(lo, [200, 200, 50]);
	assert.deepEqual(kq, {});
	assert.deepEqual(await traBaiThuoc(async () => { throw new Error("mạng"); }, ["Quy Tỳ Thang"], { goc: "https://kinhlac.online" }), {});
	let goi = 0;
	assert.deepEqual(await traBaiThuoc(async () => { goi++; return Response.json({}); }, ["abc"], { goc: "https://kinhlac.online" }), {});
	assert.equal(goi, 0);
});
