import { test } from "node:test";
import assert from "node:assert/strict";
import { phanTichTrang } from "./phan-tich.mjs";
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

test("trang ngoài ngành: không gọi Claude, dù menu có chữ 'Đông y'", async () => {
	let goi = 0;
	const claude = { traJson: async () => { goi++; return {}; } };
	const kq = await phanTichTrang({ url: "https://b.vn/huyet-ap", docWeb: webGia({ "https://b.vn/huyet-ap": HTML_TAY }), claude });
	assert.deepEqual(kq, { trangThai: "ngoai_nganh" });
	assert.equal(goi, 0);
});

test("trang Đông y: gửi bối cảnh + nội dung, chuẩn hoá kết quả", async () => {
	let user = "";
	const claude = { traJson: async (_s, u, _k, max) => { user = u; assert.equal(max, 800); return { chu_de: " Bấm huyệt trị mất ngủ ", tu_khoa: ["bấm huyệt mất ngủ", " ", "huyệt thần môn"], tom_tat: ["a", "b"] }; } };
	const kq = await phanTichTrang({ url: "https://a.vn/x", docWeb: webGia({ "https://a.vn/x": HTML_DY }), claude });
	assert.deepEqual(kq, { trangThai: "da_phan_tich", chuDe: "Bấm huyệt trị mất ngủ", tuKhoa: ["bấm huyệt mất ngủ", "huyệt thần môn"], tomTat: ["a", "b"] });
	assert.ok(user.includes("Kinhlac") && user.includes("TIÊU ĐỀ: Bấm huyệt chữa mất ngủ"));
});

test("không tải được → lỗi, không gọi Claude", async () => {
	const kq = await phanTichTrang({ url: "https://a.vn/y", docWeb: webGia({}), claude: null });
	assert.equal(kq.trangThai, "loi");
});
