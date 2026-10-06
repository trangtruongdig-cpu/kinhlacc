import test from "node:test";
import assert from "node:assert/strict";
import { canhBaoCaDem, canhBaoDocTrang, HAN_CANH_BAO_MS } from "./canh-bao.mjs";

const gio = (n) => n * 3600_000;
const now = Date.parse("2026-10-06T08:00:00.000Z");
const ca = (o) => ({ loai: "radar", ghi: true, ketThuc: "x", soSeTrich: 0, batDau: new Date(now - gio(o.truoc)).toISOString(), ...o });

test("ca RADAR đọc được trang bằng model thì TẮT cảnh báo — đây là lỗi đã sống trên bản trước", () => {
	// ⚠️ Bản đầu chỉ dò ca `loai: "claude"`, mà ca đó CHỈ được ghi qua route MCP. Trên VPS chạy
	// tự hành không có máy khách MCP nào, nên điều kiện rút gọn thành `choAi > 0` — và `choAi > 0`
	// là trạng thái BÌNH THƯỜNG có chủ ý (ca ngừng trích khi hàng chờ > 80, đọc 40 trang/đêm).
	// Hậu quả: dòng đỏ "Hệ thống kẹt" đứng bậc 0 đầu tab mặc định MỖI NGÀY, dạy người dùng bỏ
	// qua cả khoang cảnh báo.
	assert.equal(canhBaoDocTrang([ca({ truoc: 6, soDocAi: 40 })], 104, now), false);
});

test("ca claude qua MCP cũng tắt cảnh báo — không bỏ đường cũ", () => {
	assert.equal(canhBaoDocTrang([{ loai: "claude", ketThuc: "x", soDoc: 12, batDau: new Date(now - gio(6)).toISOString() }], 104, now), false);
});

test("ca chạy mà KHÔNG đọc được trang nào thì BẬT — đó mới là kẹt thật", () => {
	assert.equal(canhBaoDocTrang([ca({ truoc: 30, soDocAi: 0 })], 104, now), true);
});

test("hàng chờ RỖNG thì không bao giờ cảnh báo — không có gì để đọc thì không đọc là đúng", () => {
	assert.equal(canhBaoDocTrang([ca({ truoc: 30, soDocAi: 0 })], 0, now), false);
});

test("mốc tính là ca ĐỌC ĐƯỢC gần nhất, không phải ca chạy gần nhất", () => {
	// Một ca chạy 3 giờ trước mà đọc 0 trang KHÔNG tắt được cảnh báo — nó không chứng minh khâu
	// đọc còn sống. Ngược lại, một ca đọc được 6 giờ trước thì tắt, dù sau đó có ca hỏng.
	assert.equal(canhBaoDocTrang([ca({ truoc: 3, soDocAi: 0 })], 104, now), true);
	assert.equal(canhBaoDocTrang([ca({ truoc: 3, soDocAi: 0 }), ca({ truoc: 6, soDocAi: 40 })], 104, now), false);
	// Và ca đọc được từ 30 giờ trước thì quá hạn → bật lại.
	assert.equal(canhBaoDocTrang([ca({ truoc: 30, soDocAi: 40 })], 104, now), true);
	assert.ok(HAN_CANH_BAO_MS >= gio(24), "hạn phải ít nhất một ngày: ca chạy 02:30 mỗi đêm");
});

test("ca đêm: chỉ kết tội khi máy này THẬT SỰ chạy ca đêm", () => {
	const cu = [ca({ truoc: 30 })];
	assert.equal(canhBaoCaDem(cu, true, now), true);
	assert.equal(canhBaoCaDem(cu, false, now), false, "máy không bật ca đêm thì không có gì để trễ");
	assert.equal(canhBaoCaDem([ca({ truoc: 6 })], true, now), false);
});

test("chịu được dữ liệu thiếu", () => {
	assert.equal(canhBaoDocTrang(undefined, 104, now), true);
	assert.equal(canhBaoDocTrang([], 0, now), false);
	assert.equal(canhBaoCaDem(undefined, false, now), false);
});

test("cms/.env KHÔNG được khai các biến CHỈ-VPS", async () => {
	// ⚠️ Công tắc "chỉ VPS" sống trong docker-compose.yml. Khai ở cms/.env thì máy lập trình
	// giành tick cron từ bảng _emdash_cron_tasks DÙNG CHUNG và chạy ca THẬT: ghi vào kho Aiven
	// production, tiêu quota model thật, tạo nháp thật — còn VPS mất ca đêm đó và không ghi dòng
	// nào. Cả hai hệ quả IM LẶNG. Tệp này "được chép qua lại" nên chú thích không đủ giữ.
	const fs = await import("node:fs");
	const url = new URL("../../../../.env", import.meta.url);
	if (!fs.existsSync(url)) return; // máy không có .env (CI) thì bỏ qua
	const chu = fs.readFileSync(url, "utf8");
	for (const bien of ["RADA_SEO_CA_DEM"])
		assert.equal(new RegExp(`^${bien}=`, "m").test(chu), false, `cms/.env khai ${bien} — biến này CHỈ được đặt ở docker-compose.yml`);
});
