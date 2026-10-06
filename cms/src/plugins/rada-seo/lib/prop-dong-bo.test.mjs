import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("../admin.jsx", import.meta.url), "utf8");

/** Các khối `<Ten ... />` trong admin.jsx, kèm tập tên prop đã truyền. */
function noiDung(ten) {
	const ra = [];
	for (const m of SRC.matchAll(new RegExp(`<${ten}(\\s)`, "g"))) {
		// Cắt tới dấu đóng thẻ đầu tiên ở mức ngoài cùng — đủ dùng cho admin.jsx (không có thẻ lồng).
		const doan = SRC.slice(m.index, SRC.indexOf("/>", m.index) + 2);
		ra.push({ doan, prop: new Set([...doan.matchAll(/(\w+)=\{/g)].map((x) => x[1])) });
	}
	return ra;
}

test("component render NHIỀU CHỖ phải nhận CÙNG tập prop — thiếu một prop là một nút chết im lặng", () => {
	// ⚠️ Lỗi thật 06/10/2026: `HoSoCum` render ở hai tab; chỗ ở tab Hướng nội dung thiếu
	// `onNangHanNgach`. Ba nút "Nâng hạn ngạch" vẫn VẼ RA nhưng bấm không gì xảy ra — và vì chỗ
	// dùng gọi `onNangHanNgach?.(n)` nên KHÔNG có cả TypeError ở console. Cùng việc đó ở tab
	// Khoảng trống thì chạy đúng, nên rất khó lần ra.
	//
	// Đây là lớp lỗi mà `esbuild`, `oxlint --deny no-undef` và 763 phép kiểm đều KHÔNG bắt được:
	// tên biến có thật, cú pháp đúng, chỉ thiếu một khoá.
	for (const ten of ["HoSoCum", "DongViec", "KeHoachRow"]) {
		const cho = noiDung(ten);
		if (cho.length < 2) continue;
		const hop = new Set(cho.flatMap((x) => [...x.prop]));
		for (const [i, x] of cho.entries()) {
			const thieu = [...hop].filter((p) => !x.prop.has(p));
			assert.deepEqual(thieu, [], `<${ten}> chỗ render #${i + 1} thiếu prop: ${thieu.join(", ")} — chỗ khác có truyền`);
		}
	}
});

test("mọi prop hàm mà component DÙNG phải được ÍT NHẤT một chỗ truyền", () => {
	// Chặn chiều ngược: khai prop trong chữ ký rồi không ai truyền → nhánh dùng nó chết im lặng.
	const m = SRC.match(/function HoSoCum\(\{([^}]*)\}\)/);
	assert.ok(m, "không tìm thấy chữ ký HoSoCum");
	const khai = m[1].split(",").map((x) => x.trim().split(/[:=]/)[0].trim()).filter(Boolean);
	const truyen = new Set(noiDung("HoSoCum").flatMap((x) => [...x.prop]));
	for (const p of khai) assert.ok(truyen.has(p), `HoSoCum khai prop \`${p}\` nhưng KHÔNG chỗ render nào truyền`);
});
