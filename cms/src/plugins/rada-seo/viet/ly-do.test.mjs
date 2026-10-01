import { test } from "node:test";
import assert from "node:assert/strict";
import { cauLyDoNguon, cauLyDoLink, kemCauNguon, kemCauLink, hrefDayDu, trichHref } from "./ly-do.mjs";

test("cauLyDoNguon: mọi mã bỏ nguồn ra câu tiếng Việt, không lộ mã trần", () => {
	for (const ma of ["khong_phai_nguon", "khong_co_trang_nguon", "http_404", "noindex", "loi_tai", "trung_url", "vuot_tran", "het_gio_tong", "thieu_tieu_de", "url_bi_chan", "trang_noi_bo_khong_song", "trang_nguon_khong_song"]) {
		const c = cauLyDoNguon(ma);
		assert.ok(c.length > 15, `${ma}: ${c}`);
		assert.doesNotMatch(c, /_/, `${ma} còn lộ mã: ${c}`);
	}
	assert.match(cauLyDoNguon("http_503"), /503/);
	assert.match(cauLyDoNguon("khong_phai_nguon"), /\/nguon\//);
	assert.match(cauLyDoNguon("loi_tai", "quá hạn 10 giây"), /quá hạn 10 giây/);
	// Mã lạ: vẫn ra câu, kèm mã để tra.
	assert.match(cauLyDoNguon("ma_la"), /ma_la/);
});

test("cauLyDoLink: vuot_tran, het_gio và các mã khác ra câu tiếng Việt", () => {
	for (const ma of ["vuot_tran", "het_gio", "link_ngoai", "khong_dat", "loi_kiem", "neo_trong_trang"]) {
		const c = cauLyDoLink(ma);
		assert.ok(c.length > 15, `${ma}: ${c}`);
		assert.doesNotMatch(c, /_/, `${ma} còn lộ mã: ${c}`);
	}
	assert.match(cauLyDoLink("ma_la"), /ma_la/);
});

test("kemCauNguon / kemCauLink: lyDo thành câu, mã giữ ở `ma`; bản ghi cũ (lyDo là mã, chưa có ma) cũng đọc được; không đổi hai lần", () => {
	const n = kemCauNguon({ title: "X", url: "https://a.vn/", lyDo: "http_404" });
	assert.equal(n.ma, "http_404");
	assert.match(n.lyDo, /404/);
	assert.equal(n.title, "X");
	assert.deepEqual(kemCauNguon(n), n);
	const t = kemCauNguon({ title: "Y", lyDo: "loi_tai", chiTiet: "DNS không ra" });
	assert.match(t.lyDo, /DNS không ra/);
	const l = kemCauLink({ href: "https://x.vn/", neo: "x", lyDo: "link_ngoai" });
	assert.equal(l.ma, "link_ngoai");
	assert.doesNotMatch(l.lyDo, /_/);
	assert.deepEqual(kemCauLink(l), l);
});

test("hrefDayDu: bộ chuyển cắt href ở ngoặc đóng đầu tiên — dựng lại href đủ từ markdown", () => {
	assert.equal(hrefDayDu("Xem [x](javascript:alert(1)) nhé.", "javascript:alert(1"), "javascript:alert(1)");
	assert.equal(hrefDayDu("Xem [a]b](//evil.com) nhé.", "//evil.com"), "//evil.com");
	// Không thấy trong markdown → giữ nguyên.
	assert.equal(hrefDayDu("không có", "data:x"), "data:x");
});

test("trichHref: trích an toàn — bỏ ký tự điều khiển và nháy kép, cắt 120 ký tự", () => {
	assert.equal(trichHref('java\u0000script:"a"\n'), "javascript:'a'");
	const dai = trichHref(`javascript:${"a".repeat(300)}`);
	assert.equal([...dai].length, 120);
	assert.ok(dai.endsWith("…"));
	assert.equal(trichHref("javascript:alert(1)"), "javascript:alert(1)");
});
