import test from "node:test";
import assert from "node:assert/strict";
import { gomLoiCa } from "./gom-loi-ca.mjs";

test("nhiều ca cùng một lý do → MỘT câu, không phải bảy dòng '1 lỗi'", () => {
	// Đo trên màn thật 06/10/2026: 10 dòng nhật ký, 7 dòng ghi đúng hai chữ "1 lỗi". Bảng đó
	// không nói được lỗi gì, nên người đọc phải bấm ▸ bảy lần để biết chúng là CÙNG một lỗi.
	const ca = [
		{ loi: ["sitemap: HTTP 403"] },
		{ loi: ["sitemap: HTTP 403"] },
		{ loi: ["sitemap: HTTP 403"] },
		{ loi: [] },
	];
	const r = gomLoiCa(ca);
	assert.equal(r.soCaLoi, 3);
	assert.equal(r.nhom.length, 1);
	assert.equal(r.nhom[0].lan, 3);
	assert.match(r.cau, /3\/4/);
	assert.match(r.cau, /HTTP 403/);
});

test("gom theo LÝ DO đã chuẩn hoá — số trong câu lỗi không tách thành nhóm mới", () => {
	// "tải 12 trang hỏng" và "tải 97 trang hỏng" là MỘT chuyện. Không chuẩn hoá thì mỗi ca một
	// nhóm và việc gom thành vô nghĩa — cùng lý lẽ với vân tay cụm lỗi ở tab Góp Ý & Lỗi.
	const r = gomLoiCa([{ loi: ["tải 12 trang hỏng"] }, { loi: ["tải 97 trang hỏng"] }]);
	assert.equal(r.nhom.length, 1);
	assert.equal(r.nhom[0].lan, 2);
});

test("nhiều lý do khác nhau thì xếp lý do HAY GẶP nhất lên đầu", () => {
	const r = gomLoiCa([{ loi: ["A"] }, { loi: ["B"] }, { loi: ["B"] }, { loi: ["B"] }, { loi: ["C"] }]);
	assert.equal(r.nhom[0].lan, 3);
	assert.match(r.nhom[0].lyDo, /B/);
});

test("không ca nào lỗi → KHÔNG có câu nào, im lặng là đúng", () => {
	assert.equal(gomLoiCa([{ loi: [] }, {}]).cau, "");
	assert.equal(gomLoiCa([]).cau, "");
	assert.equal(gomLoiCa(undefined).cau, "");
});

test("một ca mang nhiều lỗi thì đếm MỘT lần cho mỗi lý do, không nhân lên", () => {
	const r = gomLoiCa([{ loi: ["X", "X", "Y"] }]);
	assert.equal(r.soCaLoi, 1);
	assert.deepEqual(r.nhom.map((n) => n.lan).sort(), [1, 1]);
});
