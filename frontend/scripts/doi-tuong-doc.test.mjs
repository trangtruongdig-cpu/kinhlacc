import { test } from "node:test";
import assert from "node:assert/strict";
import { khoaMuc, sapTheoNhom, sapThanBai, NHOM_DOC, NHOM_MAC_DINH, cssDoiTuong, khoiChonDoiTuong, jsDoiTuong } from "./doi-tuong-doc.mjs";

const MUC = ["Ý Nghĩa Tên Huyệt", "Đặc Tính", "Vị Trí", "Giải Phẫu", "Chủ Trị", "Cách Châm Cứu", "Ghi Chú"].map((n) => ({
	khoa: khoaMuc(n),
	nhan: n,
}));

test("khoaMuc bỏ dấu và gộp thành khoá ổn định", () => {
	assert.equal(khoaMuc("Ý Nghĩa Tên Huyệt"), "y-nghia-ten-huyet");
	assert.equal(khoaMuc("Cách Châm Cứu"), "cach-cham-cuu");
	assert.equal(khoaMuc(""), "");
});

test("nhóm mặc định kéo VỊ TRÍ lên đầu — 95% nhu cầu đo được là tên + vị trí", () => {
	const r = sapTheoNhom(MUC).map((m) => m.khoa);
	assert.equal(r[0], "vi-tri");
	assert.ok(r.indexOf("vi-tri") < r.indexOf("y-nghia-ten-huyet"));
});

test("KHÔNG mục nào bị mất khi sắp lại — chỉ đổi thứ tự", () => {
	for (const n of NHOM_DOC) {
		const r = sapTheoNhom(MUC, n.ma);
		assert.equal(r.length, MUC.length, `nhóm ${n.ma} làm mất mục`);
		assert.deepEqual([...r.map((x) => x.khoa)].sort(), [...MUC.map((x) => x.khoa)].sort());
	}
});

test("mục ngoài danh sách ưu tiên giữ nguyên thứ tự tương đối, nằm sau", () => {
	const r = sapTheoNhom(MUC, "thay-thuoc").map((m) => m.khoa);
	assert.equal(r[0], "chu-tri");
	// "Ghi Chú" và "Giải Phẫu" không có trong uuTien của thầy thuốc → vẫn còn, và giữ đúng thứ
	// tự tương đối như trong bản gốc (giai-phau trước ghi-chu).
	assert.ok(r.indexOf("giai-phau") < r.indexOf("ghi-chu"));
});

test("nhóm lạ thì trả nguyên danh sách, không ném", () => {
	assert.deepEqual(sapTheoNhom(MUC, "khong-co").map((m) => m.khoa), MUC.map((m) => m.khoa));
	assert.deepEqual(sapTheoNhom(null), []);
});

test("CSS chỉ dùng `order`, TUYỆT ĐỐI không có display:none", () => {
	// Ẩn nội dung y văn theo "đoán xem bạn là ai" là quyết định thay người đọc, và là tự xoá
	// nội dung khỏi mắt trợ lý AI lẫn bot tìm kiếm.
	const css = cssDoiTuong();
	assert.equal(/display\s*:\s*none/i.test(css), false);
	assert.equal(/visibility\s*:\s*hidden/i.test(css), false);
	assert.match(css, /order:/);
	// Nhóm mặc định KHÔNG cần luật CSS — nó chính là thứ tự DOM.
	assert.equal(css.includes(`data-doc="${NHOM_MAC_DINH}"`), false);
});

test("dải chip nói rõ không ẩn gì, và nhóm mặc định được đánh dấu sẵn", () => {
	const h = khoiChonDoiTuong();
	assert.match(h, /không mục nào bị ẩn/i);
	// Nút mặc định phải được đánh dấu sẵn ngay trong HTML tĩnh — không chờ JS chạy mới đúng.
	const nut = h.split("<button").find((x) => x.includes(`data-nhom="${NHOM_MAC_DINH}"`));
	assert.match(nut, /aria-pressed="true"/);
	assert.equal(h.split('aria-pressed="true"').length - 1, 1, "chỉ MỘT nút được đánh dấu");
	for (const n of NHOM_DOC) assert.ok(h.includes(`data-nhom="${n.ma}"`));
});

test("JS bọc trong try/catch và không ném khi thiếu localStorage", () => {
	// Trang từ điển là HTML tĩnh; một lỗi JS ở đây làm hỏng trải nghiệm mà không ai thấy log.
	const js = jsDoiTuong();
	assert.match(js, /try\{/);
	assert.ok((js.match(/catch/g) ?? []).length >= 3);
});

// ---- sapThanBai: cắt và nối lại HTML — chỗ dễ MẤT NỘI DUNG nhất ----

test("sapThanBai giữ NGUYÊN VẸN mọi mục và mọi phần chen giữa", () => {
	const sec = (k, n, them = "") => `<section class="dl-sec" data-muc="${k}"><h2>${n}</h2><p>nội dung ${k}</p></section>${them}`;
	const html =
		"<!--đầu-->" +
		sec("y-nghia-ten-huyet", "Ý Nghĩa") +
		sec("tac-dung", "Tác Dụng", '<div class="dl-congdung">khối dán cạnh Tác Dụng</div>') +
		sec("vi-tri", "Vị Trí") +
		"<!--cuối-->";
	const r = sapThanBai(html);
	// Vị trí lên đầu (nhóm mặc định).
	assert.match(r, /^<!--đầu--><section class="dl-sec" data-muc="vi-tri"/);
	// KHÔNG mất mục nào.
	for (const k of ["y-nghia-ten-huyet", "tac-dung", "vi-tri"]) assert.equal(r.split(`data-muc="${k}"`).length - 1, 1, k);
	// Phần đầu và cuối giữ nguyên chỗ.
	assert.ok(r.startsWith("<!--đầu-->") && r.endsWith("<!--cuối-->"));
	// ⚠️ Khối dán cạnh phải ĐI THEO mục đứng trước nó, không lạc sang mục khác.
	assert.match(r, /data-muc="tac-dung"[\s\S]*?khối dán cạnh Tác Dụng/);
	// Khối phải dính LIỀN SAU section Tác Dụng, dù Tác Dụng bị đẩy xuống chỗ nào.
	assert.match(r, /data-muc="tac-dung">.*?<\/section><div class="dl-congdung">khối dán cạnh Tác Dụng<\/div>/s);
});

test("sapThanBai: dưới hai mục thì trả nguyên — không đụng vào cái không cần đụng", () => {
	const h = '<section class="dl-sec" data-muc="vi-tri"><h2>X</h2></section>';
	assert.equal(sapThanBai(h), h);
	assert.equal(sapThanBai("<p>không có mục nào</p>"), "<p>không có mục nào</p>");
});
