import { test } from "node:test";
import assert from "node:assert/strict";
import { docTenTep, dungAlt, VAI_TRO } from "./dien-alt-anh.mjs";

test("đọc được ba kiểu tên tệp đang có thật trong kho", () => {
	assert.deepEqual(docTenTep("LI4-da.webp"), { ma: "LI4", vaiTro: "da", loai: "huyet" });
	assert.deepEqual(docTenTep("kinh-03-chinh.jpg"), { ma: "kinh-03", vaiTro: "chinh", loai: "kinh" });
	assert.deepEqual(docTenTep("0005-a-mon.webp"), { ma: "a-mon", vaiTro: "", loai: "slug" });
	// Có số thứ tự đuôi vẫn ra đúng slug.
	assert.equal(docTenTep("1234-an-mien-2.webp")?.ma, "an-mien");
});

test("tên toàn số KHÔNG suy được → trả null, để người đặt tay", () => {
	// 375 ảnh như vậy trong kho. Đặt alt bằng chính tên tệp là đổi ô rỗng lấy ô vô nghĩa, và
	// sau đó không ai phân biệt được "chưa điền" với "đã điền bằng rác".
	assert.equal(docTenTep("12345.jpg"), null);
	assert.equal(docTenTep(""), null);
	assert.equal(docTenTep(null), null);
});

test("alt khớp ĐÚNG CHỮ của trang tĩnh (ANH3D_NHAN trong build-dict)", () => {
	assert.equal(dungAlt({ ten: "Huyệt Hợp Cốc", ma: "LI4" }, "da"), "Huyệt Hợp Cốc (LI4) — trên da");
	assert.equal(VAI_TRO.gp, "trên giải phẫu");
});

test("không có vai trò thì alt CHỈ là tên mục — không bịa thêm 'trên da'", () => {
	assert.equal(dungAlt({ ten: "Á Môn", ma: "GV15" }, ""), "Á Môn (GV15)");
	assert.equal(dungAlt({ ten: "Á Minh", ma: "" }, ""), "Á Minh");
});

test("không tra ra mục, hoặc vai trò lạ → null, KHÔNG điền bừa", () => {
	assert.equal(dungAlt(null, "da"), null);
	assert.equal(dungAlt({ ten: "" }, "da"), null);
	assert.equal(dungAlt({ ten: "X" }, "vai-tro-la"), null);
});
