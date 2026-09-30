import { test } from "node:test";
import assert from "node:assert/strict";
import { trichTrang } from "./trich.mjs";
import { htmlSangChu, laDongY } from "./trang.mjs";
import { webGia } from "../__test__/kho-gia.mjs";

const HTML_DY = `<html><head><title>Bấm huyệt chữa mất ngủ</title><meta name="description" content="Cách bấm huyệt an thần"></head>
<body><script>x()</script><p>Huyệt Thần Môn &amp; Tam Âm Giao giúp ngủ ngon hơn theo Đông y.</p></body></html>`;
const HTML_TAY = `<html><head><title>Tăng huyết áp ở người trẻ</title></head><body><p>Menu: Đông y · Nội khoa. Huyết áp cao là bệnh lý tim mạch phổ biến ở người trẻ tuổi.</p></body></html>`;

test("htmlSangChu bỏ script, giải mã thực thể", () => {
	const r = htmlSangChu(HTML_DY);
	assert.equal(r.tieuDe, "Bấm huyệt chữa mất ngủ");
	assert.equal(r.moTa, "Cách bấm huyệt an thần");
	assert.ok(r.than.includes("Thần Môn & Tam Âm Giao"));
	assert.ok(!r.than.includes("x()"));
});

test("laDongY: 'huyết áp' KHÔNG phải Đông y", () => {
	assert.equal(laDongY("Tăng huyết áp ở người trẻ"), false);
	assert.equal(laDongY("Bấm huyệt chữa mất ngủ"), true);
});

test("trang Đông y → chờ Claude, chữ có tiêu đề + mô tả + nội dung", async () => {
	const kq = await trichTrang({ url: "https://a.vn/x", docWeb: webGia({ "https://a.vn/x": HTML_DY }) });
	assert.equal(kq.trangThai, "cho_ai");
	assert.ok(kq.chu.startsWith("TIÊU ĐỀ: Bấm huyệt chữa mất ngủ\nMÔ TẢ: Cách bấm huyệt an thần\nNỘI DUNG:"));
});

test("trang ngoài ngành dù menu có chữ 'Đông y'", async () => {
	const kq = await trichTrang({ url: "https://b.vn/huyet-ap", docWeb: webGia({ "https://b.vn/huyet-ap": HTML_TAY }) });
	assert.deepEqual(kq, { trangThai: "ngoai_nganh" });
});

test("không tải được / quá ít chữ → lỗi", async () => {
	assert.equal((await trichTrang({ url: "https://a.vn/y", docWeb: webGia({}) })).trangThai, "loi");
	assert.equal((await trichTrang({ url: "https://a.vn/z", docWeb: webGia({ "https://a.vn/z": "<p>ngắn</p>" }) })).trangThai, "loi");
});
