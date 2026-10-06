import test from "node:test";
import assert from "node:assert/strict";
import { chayCaLeoTop, denLuotLeoTop } from "./tu-leo-top.mjs";

const phien = (id, tuKhoa, trangMinh) => ({ id, tuKhoa, trangMinh, trangThai: "cho_serp" });

function bo({ moi = [], khoDoiThu = [], serpOk = true, modelOk = true } = {}) {
	const goi = [];
	return {
		goi,
		cong: {
			layTuKhoa: async () => ({ moi, dangMo: [] }),
			khoDoiThu: async () => khoDoiThu,
			nopSerp: async ({ id, urls }) => (goi.push(["nopSerp", id, urls.length]), serpOk ? { soChon: urls.length } : { soChon: 0 }),
			layTrang: async ({ id }) => ({ phienId: id, tuKhoa: "x", trang: serpOk ? [{ url: "u", chu: "c" }] : [] }),
			goiModel: async () => (modelOk ? { ok: true, chu: JSON.stringify({ trang: [{ url: "u", y: ["ý A"] }] }) } : { ok: false, loi: "429" }),
			ghiSoHo: async ({ id }) => (goi.push(["ghiSoHo", id]), { soHo: 1 }),
			log: { info() {}, warn() {}, error() {} },
		},
	};
}

test("không có phiên mới thì KHÔNG gọi model lượt nào — và nói ra lý do", async () => {
	const { cong, goi } = bo({ moi: [] });
	const r = await chayCaLeoTop(cong);
	assert.equal(r.soPhien, 0);
	assert.equal(goi.length, 0);
	assert.match(r.ghiChu.join(" "), /không có phiên|chưa có từ khoá/i);
});

test("có phiên nhưng KHO ĐỐI THỦ không đủ nguyên liệu → bỏ qua phiên đó, KHÔNG nộp bừa", async () => {
	// ⚠️ Nộp bừa là dựng phiếu sơ hở từ trang chẳng liên quan — phiếu trông như phát hiện thật.
	const { cong, goi } = bo({ moi: [phien("p1", "ung thư gan", "/a/")], khoDoiThu: [{ url: "https://x.vn/mat-ngu", chuDe: "Mất ngủ", tuKhoa: ["mất ngủ"] }] });
	const r = await chayCaLeoTop(cong);
	assert.equal(goi.filter(([t]) => t === "nopSerp").length, 0);
	assert.match(r.ghiChu.join(" "), /không đủ nguyên liệu|không tìm được trang/i);
});

test("đủ nguyên liệu → chạy trọn bốn khâu theo đúng thứ tự", async () => {
	const { cong, goi } = bo({
		moi: [phien("p1", "đau lưng", "/huyet/uy-trung/")],
		khoDoiThu: [
			{ url: "https://a.vn/dau-lung", chuDe: "Đau lưng", tuKhoa: ["đau lưng"] },
			{ url: "https://b.vn/dau-that-lung", chuDe: "Đau lưng", tuKhoa: ["đau thắt lưng"] },
		],
	});
	const r = await chayCaLeoTop(cong);
	assert.deepEqual(goi.map(([t]) => t), ["nopSerp", "ghiSoHo"]);
	assert.equal(r.soPhieu, 1);
});

test("model HỎNG thì KHÔNG ghi phiếu, và lý do vào ghiChu", async () => {
	const { cong, goi } = bo({
		moi: [phien("p1", "đau lưng", "/a/")],
		khoDoiThu: [{ url: "https://a.vn/dau-lung", chuDe: "Đau lưng", tuKhoa: ["đau lưng"] }],
		modelOk: false,
	});
	const r = await chayCaLeoTop(cong);
	assert.equal(goi.filter(([t]) => t === "ghiSoHo").length, 0);
	assert.equal(r.soPhieu, 0);
	assert.match(r.ghiChu.join(" "), /429/);
});

test("TRẦN phiên mỗi ca — mỗi phiếu là một lượt gọi model", async () => {
	const nhieu = Array.from({ length: 20 }, (_, i) => phien(`p${i}`, "đau lưng", "/a/"));
	const { cong, goi } = bo({ moi: nhieu, khoDoiThu: [{ url: "https://a.vn/dau-lung", chuDe: "Đau lưng", tuKhoa: ["đau lưng"] }] });
	const r = await chayCaLeoTop(cong, { tranPhien: 3 });
	assert.equal(goi.filter(([t]) => t === "ghiSoHo").length, 3);
	assert.equal(r.soPhien, 3);
});

test("một phiên HỎNG không được làm đứt cả ca", async () => {
	const { cong } = bo({ moi: [phien("p1", "đau lưng", "/a/"), phien("p2", "đau lưng", "/b/")], khoDoiThu: [{ url: "https://a.vn/dau-lung", chuDe: "Đau lưng", tuKhoa: ["đau lưng"] }] });
	let lan = 0;
	const goc = cong.ghiSoHo;
	cong.ghiSoHo = async (x) => { if (++lan === 1) throw new Error("hỏng giả"); return goc(x); };
	const r = await chayCaLeoTop(cong);
	assert.equal(r.soPhieu, 1, "phiên thứ hai vẫn phải chạy");
	assert.match(r.ghiChu.join(" "), /hỏng giả/);
});

test("denLuotLeoTop là hàm THUẦN theo giờ UTC — bảng cron dùng chung nên không được phụ thuộc múi giờ tiến trình", () => {
	// Cùng lý lẽ với GIO_UTC_CHAY và denLuotChienLuoc.
	const t = (iso) => new Date(iso);
	assert.equal(typeof denLuotLeoTop(t("2026-10-06T21:30:00Z")), "boolean");
	// Hai lượt gọi cùng mốc phải cho cùng kết quả (thuần).
	assert.equal(denLuotLeoTop(t("2026-10-06T21:30:00Z")), denLuotLeoTop(t("2026-10-06T21:30:00Z")));
});
