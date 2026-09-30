import { test } from "node:test";
import assert from "node:assert/strict";
import * as kho from "./kho.mjs";
import { taoKhoGia } from "./__test__/kho-gia.mjs";

const NOW = "2026-10-01T00:00:00.000Z";

test("đối thủ: khoá là tên miền, xoá kéo theo URL", async () => {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "a.vn", ten: "A" }, NOW);
	await kho.luuDoiThu(s, { tenMien: "a.vn", ten: "A2", laCuaMinh: true }, "sau");
	const ds = await kho.dsDoiThu(s);
	assert.equal(ds.length, 1);
	assert.equal(ds[0].taoLuc, NOW);
	assert.equal(ds[0].laCuaMinh, true);
	await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1", "https://a.vn/2"], { ghi: true, now: NOW });
	assert.equal(await kho.xoaDoiThu(s, "a.vn"), 2);
	assert.equal(s.url._m.size, 0);
});

test("themUrlMoi: chỉ thêm URL chưa có; ghi=false chỉ đếm", async () => {
	const s = taoKhoGia();
	assert.equal(await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1"], { ghi: true, now: NOW }), 1);
	assert.equal(await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1", "https://a.vn/2"], { ghi: false, now: NOW }), 1);
	assert.equal(s.url._m.size, 1);
	assert.deepEqual(await kho.demUrl(s, "a.vn"), { cho: 1, da_phan_tich: 0, ngoai_nganh: 0, loi: 0 });
});

test("thayCum: giữ cụm đã bỏ qua và không thêm lại cụm giống nó", async () => {
	const s = taoKhoGia();
	const c1 = { tenCum: "Bấm huyệt trị mất ngủ tại nhà", tuKhoa: ["bấm huyệt trị mất ngủ"], diem: 10 };
	const c2 = { tenCum: "Ngũ hành và ăn uống theo mùa", tuKhoa: ["ngũ hành ăn uống"], diem: 5 };
	assert.equal(await kho.thayCum(s, [c1, c2], NOW), 2);
	const [dau] = await kho.dsCum(s);
	await kho.datTrangThaiCum(s, dau.id, "bo_qua");
	const c1DemSau = { tenCum: "Bấm huyệt trị mất ngủ tại nhà hiệu quả", tuKhoa: ["bấm huyệt trị mất ngủ"], diem: 11 };
	assert.equal(await kho.thayCum(s, [c1DemSau, c2], NOW), 1);
	const ds = await kho.dsCum(s);
	assert.equal(ds.length, 2);
	assert.equal(ds.filter((c) => c.trangThai === "bo_qua").length, 1);
	await assert.rejects(kho.datTrangThaiCum(s, dau.id, "linh_tinh"), /không hợp lệ/);
});
