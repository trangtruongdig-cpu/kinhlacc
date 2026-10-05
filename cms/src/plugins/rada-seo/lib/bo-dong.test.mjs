import test from "node:test";
import assert from "node:assert/strict";
import { boDong, datDong } from "./bo-dong.mjs";

const ds = [{ id: "a", t: 1 }, { id: "b", t: 2 }, { id: "c", t: 3 }];

test("boDong bỏ đúng một dòng và KHÔNG sửa mảng gốc", () => {
	const r = boDong(ds, "b");
	assert.deepEqual(r.map((x) => x.id), ["a", "c"]);
	assert.equal(ds.length, 3, "sửa mảng gốc là React không thấy thay đổi");
});

test("boDong với id không có thì trả mảng y nguyên nội dung", () => {
	assert.deepEqual(boDong(ds, "khong-co").map((x) => x.id), ["a", "b", "c"]);
});

test("boDong chịu được mảng rỗng và undefined", () => {
	assert.deepEqual(boDong([], "a"), []);
	assert.deepEqual(boDong(undefined, "a"), []);
});

test("datDong gộp vào dòng cũ, không thay cả dòng", () => {
	const r = datDong(ds, "b", { t: 9 });
	assert.deepEqual(r[1], { id: "b", t: 9 });
	assert.equal(ds[1].t, 2, "sửa dòng gốc là React không thấy thay đổi");
});

test("datDong giữ nguyên các khoá không khai trong `thay`", () => {
	const r = datDong([{ id: "a", x: 1, y: 2 }], "a", { x: 5 });
	assert.deepEqual(r[0], { id: "a", x: 5, y: 2 });
});

test("datDong với `thay` rỗng/undefined không làm mất dòng", () => {
	// Route trả `{ ok: true }` thay vì phiếu đã cập nhật là chuyện thường — khi đó chỗ gọi truyền
	// trường đổi bằng tay, nhưng nếu lỡ truyền undefined thì dòng phải còn nguyên, không thành
	// `undefined` trong bảng.
	assert.deepEqual(datDong(ds, "b", undefined)[1], { id: "b", t: 2 });
	assert.deepEqual(datDong(ds, "b", {})[1], { id: "b", t: 2 });
});
