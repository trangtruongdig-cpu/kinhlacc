import { test } from "node:test";
import assert from "node:assert/strict";
import {
	MA_CAN_THU_LAI,
	canThuTrungGian,
	duongTrungGian,
	gocTrungGianCuaMoiTruong,
	HAN_GIO_TRUNG_GIAN_MS,
} from "./doc-qua-trung-gian.mjs";

const GOC = "https://r.jina.ai/";

test("mặc định TẮT: không khai gốc thì không có đường trung gian", () => {
	assert.equal(duongTrungGian("https://a.com/x", ""), null);
	assert.equal(duongTrungGian("https://a.com/x", undefined), null);
	assert.equal(duongTrungGian("https://a.com/x", "   "), null);
	assert.equal(gocTrungGianCuaMoiTruong({}), "");
	assert.equal(gocTrungGianCuaMoiTruong({ RADA_SEO_TRUNG_GIAN: " x " }), "x");
});

test("chỉ ba mã TỪ CHỐI BOT được thử lại", () => {
	for (const ma of [403, 429, 503]) assert.equal(canThuTrungGian(ma), true, `${ma} phải thử lại`);
	// 404 = trang không có; đi đường vòng cho nó là đốt lượt gọi cho từng URL chết trong kho.
	for (const ma of [200, 301, 404, 410, 500, 502]) assert.equal(canThuTrungGian(ma), false, `${ma} KHÔNG được thử lại`);
	assert.equal(MA_CAN_THU_LAI.size, 3);
});

test("dựng đường đúng và không nhân đôi dấu gạch", () => {
	assert.equal(duongTrungGian("https://a.com/x.xml", GOC), "https://r.jina.ai/https://a.com/x.xml");
	assert.equal(duongTrungGian("https://a.com/x.xml", "https://r.jina.ai"), "https://r.jina.ai/https://a.com/x.xml");
	assert.equal(duongTrungGian("https://a.com/x.xml", "https://r.jina.ai///"), "https://r.jina.ai/https://a.com/x.xml");
});

test("KHÔNG gửi địa chỉ nội bộ ra dịch vụ ngoài", () => {
	for (const u of [
		"http://localhost:3001/api",
		"http://api.localhost/x",
		"http://127.0.0.1/x",
		"http://10.1.2.3/x",
		"http://192.168.1.1/x",
		"http://172.16.0.1/x",
		"http://172.31.255.1/x",
		"http://169.254.169.254/latest/meta-data/",
		"http://[::1]/x",
		"file:///etc/passwd",
		"gopher://a.com/x",
	])
		assert.equal(duongTrungGian(u, GOC), null, `phải chặn: ${u}`);
	// 172.15 và 172.32 NGOÀI dải riêng tư — không chặn oan.
	assert.equal(duongTrungGian("http://172.15.0.1/x", GOC), "https://r.jina.ai/http://172.15.0.1/x");
});

test("chống vòng lặp: không bọc trung gian hai lần", () => {
	assert.equal(duongTrungGian("https://r.jina.ai/https://a.com/x", GOC), null);
	assert.equal(duongTrungGian("https://R.JINA.AI/https://a.com/x", GOC), null);
});

test("URL rỗng hay hỏng thì không đi", () => {
	for (const u of ["", "   ", null, undefined, "khong-phai-url"]) assert.equal(duongTrungGian(u, GOC), null);
	assert.equal(duongTrungGian("https://a.com/x", "khong-phai-url"), null);
});

test("hạn giờ trung gian phải dài hơn đường thẳng — đo 40,2 s cho 1,09 MB", () => {
	assert.ok(HAN_GIO_TRUNG_GIAN_MS > 30_000, "30 s là hạn đường thẳng; sitemap lớn mất 40,2 s");
	assert.ok(HAN_GIO_TRUNG_GIAN_MS >= 2 * 40_200, "phải có biên gấp đôi số đo thật");
});
