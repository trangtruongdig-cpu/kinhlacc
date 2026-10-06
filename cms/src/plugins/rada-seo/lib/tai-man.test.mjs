import test from "node:test";
import assert from "node:assert/strict";
import { ROUTE_MO_MAN, routeChoTab, TAI_LAI_KHI_SANG } from "./tai-man.mjs";

test("mở màn gọi ĐÚNG MỘT route — mọi route tổng quan đều tải khi mở tab", () => {
	// Vì sao có phép kiểm này: trước 06/10/2026 useEffect mở màn gọi NĂM route, mà pool CSDL là
	// max:1 nên chúng xếp hàng (~19 lượt đi-về ≈ 1,9 giây) — người xem tab Radar trả tiền cho
	// bốn tab chưa mở. Chốt này gãy ngay khi ai thêm một route vào đường mở màn.
	assert.deepEqual(ROUTE_MO_MAN, ["viec"]);
});

test("mỗi tab khai đúng route của nó, và không khai lại route mở màn", () => {
	assert.deepEqual(routeChoTab("khoang-trong"), ["khoang-trong-tong-quan"]);
	assert.deepEqual(routeChoTab("huong"), ["cum-ngu-nghia"]);
	assert.deepEqual(routeChoTab("ke-hoach"), ["chien-luoc-tong-quan"]);
	assert.deepEqual(routeChoTab("nhap"), ["nhap-tong-quan"]);
	assert.deepEqual(routeChoTab("leo-top"), ["leo-top-tong-quan"]);
	assert.deepEqual(routeChoTab("mang-nhen"), ["mang-nhen-tong-quan"]);
	assert.deepEqual(routeChoTab("radar"), ["tong-quan"]);
	// Màn Việc sống bằng `viec`, đã có trong ROUTE_MO_MAN — khai lại là tải hai lần.
	assert.deepEqual(routeChoTab("viec"), []);
	// Màn Nền vẽ từ dữ liệu route `viec` đã trả — thêm route riêng ở đây là thêm một lượt đi-về
	// cho con số đã có trong tay.
	assert.deepEqual(routeChoTab("nen"), []);
	for (const t of ["khoang-trong", "huong", "ke-hoach", "nhap", "leo-top", "mang-nhen", "radar", "viec", "nen"])
		for (const r of routeChoTab(t)) assert.ok(!ROUTE_MO_MAN.includes(r), `${t} khai lại route mở màn: ${r}`);
});

test("tab không có tên thì trả mảng rỗng, không ném", () => {
	assert.deepEqual(routeChoTab("khong-co-tab-nay"), []);
	assert.deepEqual(routeChoTab(undefined), []);
});

test("Kế hoạch tải lại MỖI lần sang, các tab khác chỉ lần đầu", () => {
	// Bài dự kiến vừa giao từ tab Khoảng trống phải hiện ngay, không bắt người dùng tự bấm "Tải
	// lại" rồi tưởng nút Giao không ăn.
	assert.ok(TAI_LAI_KHI_SANG.has("ke-hoach"));
	assert.ok(!TAI_LAI_KHI_SANG.has("khoang-trong"));
	assert.ok(!TAI_LAI_KHI_SANG.has("huong"));
});

test("tab `nen` phải có thật trong danh sách tab — nó là vòng ⓪ của thanh quy trình", () => {
	// Vòng NỀN đứng ĐẦU vì hai vòng kia đứng TRÊN nó về nhân quả: nền vững → tháp cao → chiếm
	// được đất → giữ được đất. Chốt này gãy nếu ai bỏ tab đi mà quên thanh quy trình, hoặc
	// ngược lại — hai chỗ khai ở hai file khác nhau (`tai-man.mjs` và `admin.jsx`).
	assert.deepEqual(routeChoTab("nen"), [], "màn Nền vẽ từ dữ liệu route `viec`, không có route riêng");
	assert.ok(!TAI_LAI_KHI_SANG.has("nen"), "sang tab Nền không được tải lại: số đã có trong tay");
});
