import { test } from "node:test";
import assert from "node:assert/strict";
import { napSlugHuyet, ganDuongHuyet, slugCuaHuyet, layHoSoCum, layUngVien, laNghiaKep, trangDaCo, xepUngVien, loiNhacTuHoSo, napTrangNhuCau } from "./ho-so.mjs";

const chiMuc = {
	muc: [
		{ bo: "benh_hoc", title: "Mất Ngủ", slug: "mat-ngu" },
		{ bo: "cham_cuu_tri_benh", title: "Mất Ngủ", slug: "mat-ngu" },
		{ bo: "huyet_vi", title: "Chảy máu cam", slug: "chay-mau-cam" }, // bộ KHÁC, không tính
	],
};

test("trangDaCo chỉ nhìn bệnh học và châm cứu trị bệnh", () => {
	assert.equal(trangDaCo("Mất ngủ", chiMuc).daCo, true);
	// cùng tên nhưng nằm ở bộ huyệt vị: đó không phải trang nhắm nhu cầu
	assert.equal(trangDaCo("Chảy máu cam", chiMuc).daCo, false);
	assert.equal(trangDaCo("Chảy máu cam", { muc: [] }).daCo, false);
});

test("trangDaCo khớp cả theo slug, không phân biệt dấu", () => {
	assert.equal(trangDaCo("mat ngu", chiMuc).daCo, true);
	assert.equal(trangDaCo("MẤT NGỦ", chiMuc).daCo, true);
});

test("cụm nghĩa kép không tự xếp hạng mà chờ người xác nhận", () => {
	assert.equal(laNghiaKep("Khí hư"), true);
	assert.equal(laNghiaKep("Chảy máu cam"), false);
	const { choViet, choXacNhan } = xepUngVien([{ ten: "Khí hư", thap: 612 }], chiMuc);
	assert.equal(choViet.length, 0);
	assert.equal(choXacNhan.length, 1);
	assert.match(choXacNhan[0].lyDo, /nghĩa kép/);
});

test("xepUngVien tách ba giỏ: viết mới, leo top, chờ xác nhận", () => {
	const r = xepUngVien(
		[
			{ ten: "Chảy máu cam", thap: 110 }, // chưa có trang → viết mới
			{ ten: "Mất ngủ", thap: 158 }, // đã có trang → leo top
			{ ten: "Khí hư", thap: 612 }, // nghĩa kép → chờ người
		],
		chiMuc,
	);
	assert.deepEqual(r.choViet.map((x) => x.ten), ["Chảy máu cam"]);
	assert.deepEqual(r.leoTop.map((x) => x.ten), ["Mất ngủ"]);
	assert.deepEqual(r.choXacNhan.map((x) => x.ten), ["Khí hư"]);
	// giỏ leo top phải mang theo chỗ trang đang nằm, không thì màn hình không mở được nó
	assert.equal(r.leoTop[0].slug, "mat-ngu");
});

test("mất mạng trả ok:false kèm lý do, KHÔNG trả hồ sơ rỗng", async () => {
	const hong = async () => {
		throw new Error("ECONNREFUSED");
	};
	const r = await layHoSoCum(hong, "chảy máu cam", ["nục huyết"]);
	assert.equal(r.ok, false);
	assert.equal(r.hoSo, null);
	assert.match(r.loi, /ECONNREFUSED/);

	const u = await layUngVien(hong);
	assert.equal(u.ok, false);
	assert.deepEqual(u.ds, []);
});

test("HTTP lỗi cũng là ok:false, không coi là 'không có cụm nào'", async () => {
	const r = await layUngVien(async () => ({ ok: false, status: 500 }));
	assert.equal(r.ok, false);
	assert.match(r.loi, /500/);
});

test("layHoSoCum gửi đúng đường và đủ biến thể", async () => {
	let ghi = null;
	const gia = async (url, init) => {
		ghi = { url, than: JSON.parse(init.body) };
		return { ok: true, json: async () => ({ cum: "chảy máu cam", soBaiThuoc: 55, theBenh: [] }) };
	};
	const r = await layHoSoCum(gia, "chảy máu cam", ["nục huyết", "tỵ nục"]);
	assert.equal(r.ok, true);
	assert.match(ghi.url, /\/rada\/ho-so-cum$/);
	assert.ok(ghi.url.startsWith("https://kinhlac.online/api/"), `mặc định phải là site thật kèm /api, nhận: ${ghi.url}`);
	assert.deepEqual(ghi.than.bienThe, ["nục huyết", "tỵ nục"]);
	assert.equal(r.hoSo.soBaiThuoc, 55);
});

test("loiNhacTuHoSo đòi số link theo đúng tháp có thật, và im khi không có thể bệnh", () => {
	assert.equal(loiNhacTuHoSo({ theBenh: [] }), "");
	assert.equal(loiNhacTuHoSo(null), "");
	const nhac = loiNhacTuHoSo({
		soBaiThuoc: 55,
		viHayDung: Array(12).fill({ ten: "x" }),
		theBenh: [{ viThuocChinh: Array(6).fill({}), baiThuocTieuBieu: Array(3).fill({}) }],
	});
	assert.match(nhac, /55 bài/);
	assert.match(nhac, /ít nhất 8 liên kết nội bộ/); // floor(21 × 0,4) = 8
	assert.match(nhac, /1\.200–1\.800 từ/);
	assert.match(nhac, /Không bịa tính vị/);
});

// ---- Giao việc: từ hồ sơ ra MỘT bài dự kiến ----
import { duongTuHoSo, taoKeHoachTuHoSo } from "./ho-so.mjs";

const hoSoMau = {
	cum: "chảy máu cam",
	soBaiThuoc: 55,
	viHayDung: [
		{ ten: "Đương quy", duong: "/duoc-lieu/66/", soBaiDung: 19 },
		{ ten: "Bạch thược", duong: "/duoc-lieu/65/", soBaiDung: 18 },
		{ ten: "Cam thảo", duong: "/duoc-lieu/25/", soBaiDung: 15 },
	],
	theBenh: [
		{
			phapTri: "Lương huyết, chỉ huyết",
			viThuocChinh: [{ ten: "Đơn bì", duong: "/duoc-lieu/1158/" }, { ten: "Cam thảo", duong: "/duoc-lieu/25/" }],
			baiThuocTieuBieu: [{ ten: "Thập Khôi Hoàn", duong: "/bai-thuoc/thap-khoi-hoan/" }],
		},
	],
	nguonYVan: [{ ten: "Y Học Nhập Môn", duong: "/nguon/y-hoc-nhap-mon/" }, { ten: "Chứng Trị Chuẩn Thằng", duong: "/nguon/chung-tri-chuan-thang/" }],
	loThung: [],
};

const khoGia = () => {
	const m = new Map();
	return {
		ke_hoach: {
			put: async (id, d) => m.set(id, d),
			get: async (id) => m.get(id) ?? null,
			// taoKeHoachTuHoSo tra kế hoạch đang sống qua kho.dsKeHoach → cần query.
			query: async () => ({ items: [...m.entries()].map(([id, data]) => ({ id, data })), hasMore: false }),
		},
		_m: m,
	};
};

test("duongTuHoSo khử trùng và giữ thứ tự tần suất trước", () => {
	const d = duongTuHoSo(hoSoMau);
	assert.equal(d[0].duong, "/duoc-lieu/66/"); // vị dùng nhiều nhất đứng đầu
	assert.equal(new Set(d.map((x) => x.duong)).size, d.length); // Cam thảo xuất hiện 2 nơi, chỉ còn 1
	assert.ok(d.some((x) => x.duong === "/bai-thuoc/thap-khoi-hoan/"));
	assert.ok(d.some((x) => x.duong === "/nguon/y-hoc-nhap-mon/"));
});

test("taoKeHoachTuHoSo ghi bài dự kiến ĐÃ DUYỆT, trụ cột lấy từ chính hồ sơ", async () => {
	const s = khoGia();
	const k = await taoKeHoachTuHoSo(s, { cum: "chảy máu cam", bienThe: ["nục huyết"], hoSo: hoSoMau, now: "2026-10-02T12:00:00.000Z" });
	assert.equal(k.trangThai, "da_duyet");
	assert.equal(k.cumChuTri, "chảy máu cam"); // thứ cho phép lò viết lấy lại hồ sơ
	assert.deepEqual(k.bienThe, ["nục huyết"]);
	assert.equal(k.trangTruCot, "/duoc-lieu/66/"); // KHÔNG khai cứng
	assert.ok(!k.lienKetDich.includes(k.trangTruCot)); // trụ cột không lặp trong danh sách đích
	assert.ok(k.lienKetDich.length >= 5);
	assert.equal((await s.ke_hoach.get(k.id)).tuKhoaChinh, "chảy máu cam theo đông y");
});

test("tháp quá mỏng thì TỪ CHỐI, không tạo bài dự kiến viết suông", async () => {
	const s = khoGia();
	await assert.rejects(
		() => taoKeHoachTuHoSo(s, { cum: "cụm mỏng", bienThe: [], hoSo: { viHayDung: [{ ten: "x", duong: "/duoc-lieu/1/" }], theBenh: [], nguonYVan: [] } }),
		/quá mỏng/,
	);
	assert.equal(s._m.size, 0);
});

test("napTrangNhuCau chỉ đụng hai bộ, và báo bộ lỗi thay vì im lặng", async () => {
	const daHoi = [];
	const content = {
		list: async (bo) => {
			daHoi.push(bo);
			if (bo === "cham_cuu_tri_benh") throw new Error("bàn thử không có bộ này");
			return { items: [{ slug: "mat-ngu", data: { title: "Mất Ngủ" } }], hasMore: false };
		},
	};
	const r = await napTrangNhuCau(content);
	// KHÔNG được hỏi bộ nào khác: nạp cả chỉ mục 18.400 mục là treo màn hình ở "Đang tải…"
	assert.deepEqual(daHoi, ["benh_hoc", "cham_cuu_tri_benh"]);
	assert.equal(r.muc.length, 1);
	assert.equal(r.loiNap.length, 1);
	assert.equal(r.loiNap[0].bo, "cham_cuu_tri_benh");
	// vẫn xếp giỏ được với phần đọc được
	assert.equal(trangDaCo("Mất ngủ", r).daCo, true);
});

test("MỘT CỤM MỘT BÀI: bấm giao lần hai trả lại bài cũ, không đẻ bài trùng", async () => {
	// Đo 02/10/2026: bấm 6 lần ra 6 bài "Mụn nhọt theo Đông y" y hệt, và lò viết sẽ viết cả 6.
	const s = khoGia();
	const a = await taoKeHoachTuHoSo(s, { cum: "chảy máu cam", bienThe: [], hoSo: hoSoMau });
	const b = await taoKeHoachTuHoSo(s, { cum: "chảy máu cam", bienThe: [], hoSo: hoSoMau });
	assert.equal(b.id, a.id, "lần hai phải trả lại đúng bài cũ");
	assert.equal(b.daCoSan, true);
	assert.equal(s._m.size, 1, "chỉ được ghi MỘT bài");
});

// ---- Nhánh HUYỆT (03/10/2026) ----

const cmsGia = (ds) => ({
	list: async () => ({ items: ds.map((x) => ({ slug: x.slug, data: { title: x.ten, ma_huyet: x.ma } })), hasMore: false }),
});

test("napSlugHuyet: MÃ trước TÊN sau — hai huyệt khác nhau trùng tên sau khi bỏ dấu vẫn trỏ đúng", async () => {
	// Đo thật: "Trung Chú" (KI15) và "Trung Chử" (TE3) bỏ dấu thành một; tra bằng tên thì hai
	// huyệt khác hẳn nhau trỏ chung một trang.
	const banDo = await napSlugHuyet(cmsGia([
		{ ten: "Trung Chú", slug: "trung-chu", ma: "KI15" },
		{ ten: "Trung Chử", slug: "trung-chu-2", ma: "TE3" },
		{ ten: "Hậu Khê", slug: "hau-khe", ma: "SI3" },
		{ ten: "A Thị Huyệt", slug: "a-thi-huyet", ma: "" },
	]));
	assert.equal(slugCuaHuyet({ ten: "Trung Chú", ma: "KI15" }, banDo), "trung-chu");
	assert.equal(slugCuaHuyet({ ten: "Trung Chử", ma: "TE3" }, banDo), "trung-chu-2");
	// Không có mã thì rơi xuống tên — và tên này không trùng ai.
	assert.equal(slugCuaHuyet({ ten: "A Thị Huyệt", ma: null }, banDo), "a-thi-huyet");
	// Mất mã mà tên lại trùng → BỎ, dẫn tới nhầm huyệt tệ hơn là không có link.
	assert.equal(slugCuaHuyet({ ten: "Trung Chú", ma: null }, banDo), null);
	assert.equal(slugCuaHuyet({ ten: "Không Có Trong Kho", ma: "ZZ9" }, banDo), null);
});

test("ganDuongHuyet: chỉ gắn khi tra ra slug — KHÔNG suy slug từ tên", async () => {
	const banDo = await napSlugHuyet(cmsGia([{ ten: "Á Môn", slug: "a-mon", ma: "GV15" }]));
	const r = ganDuongHuyet({ huyet: [{ ten: "Á Môn", ma: "GV15" }, { ten: "Hợp Cốc", ma: "LI4" }] }, banDo);
	assert.equal(r.huyet[0].duong, "/huyet/a-mon/");
	assert.equal(r.huyet[1].duong, null, "không tra ra thì để trống, đoán là sinh link chết");
	assert.deepEqual(ganDuongHuyet({ huyet: [] }, banDo).huyet, []);
});

test("duongTuHoSo kể cả đường huyệt — nhánh huyệt phải đếm vào số link của bài", () => {
	const co = duongTuHoSo({ ...hoSoMau, huyet: [{ ten: "Á Môn", duong: "/huyet/a-mon/" }, { ten: "X", duong: null }] });
	const khong = duongTuHoSo(hoSoMau);
	assert.equal(co.length, khong.length + 1);
	assert.ok(co.some((x) => x.duong === "/huyet/a-mon/"));
});

test("lời nhắc: có huyệt thì DẶN viết mục phương huyệt và CẤM dạy thao tác châm", () => {
	const n = loiNhacTuHoSo({ ...hoSoMau, huyet: [{ ten: "Á Môn", kinh: "Đốc Mạch" }] });
	assert.match(n, /phương huyệt/);
	assert.match(n, /KHÔNG hướng dẫn thao tác châm/);
	// Không có huyệt thì không dặn — dặn suông làm model bịa huyệt từ trí nhớ.
	assert.equal(/phương huyệt/.test(loiNhacTuHoSo(hoSoMau)), false);
});

test("hai bảng đường kinh chỉ được nhắc khi CÓ CẢ HAI — một bảng thì không có gì để đối chiếu", () => {
	const hai = loiNhacTuHoSo({ ...hoSoMau, kinhTheoHuyet: [{ ten: "Phế", so: 3 }], kinhTheoViThuoc: [{ ten: "Phế", so: 9 }] });
	assert.match(hai, /HAI bảng đường kinh/);
	assert.equal(/HAI bảng đường kinh/.test(loiNhacTuHoSo({ ...hoSoMau, kinhTheoViThuoc: [{ ten: "Phế", so: 9 }] })), false);
});

test("lỗi mạng phải NÓI RA đã gọi vào đâu — 'fetch failed' trần là không chẩn đoán được", async () => {
	// Đo 03/10/2026 trên VPS: tab chỉ hiện "Không hỏi được kho app: fetch failed". fetch của
	// Node trả đúng hai chữ đó cho MỌI lỗi mạng (sai host, container chưa chạy, cổng đóng).
	const cu = process.env.RADA_SEO_API;
	process.env.RADA_SEO_API = "http://backend:3000";
	const hong = async () => {
		throw Object.assign(new Error("fetch failed"), { cause: { code: "ENOTFOUND" } });
	};
	const r = await layUngVien(hong);
	assert.equal(r.ok, false);
	assert.match(r.loi, /http:\/\/backend:3000/);
	assert.match(r.loi, /ENOTFOUND/);
	// Có khai biến thì KHÔNG dặn khai lại — lời dặn sai chỗ làm người đọc đi sửa thứ đã đúng.
	assert.equal(/RADA_SEO_API chưa khai/.test(r.loi), false);

	delete process.env.RADA_SEO_API;
	const r2 = await layUngVien(hong);
	assert.match(r2.loi, /RADA_SEO_API chưa khai/);
	assert.match(r2.loi, /kinhlac\.online\/api/);
	if (cu === undefined) delete process.env.RADA_SEO_API;
	else process.env.RADA_SEO_API = cu;
});

test("HTTP 404 kèm đường đã gọi — 404 ở đây gần như luôn là backend chưa deploy bản mới", async () => {
	const r = await layUngVien(async () => ({ ok: false, status: 404 }));
	assert.match(r.loi, /HTTP 404 từ .*\/rada\/ung-vien/);
});
