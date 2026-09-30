import { test } from "node:test";
import assert from "node:assert/strict";
import { timXuHuong, docGoiY } from "./xu-huong.mjs";

test("docGoiY chịu được rác", () => {
	assert.deepEqual(docGoiY('["q",["a","b"]]'), ["a", "b"]);
	assert.deepEqual(docGoiY("<html>"), []);
});

test("timXuHuong khử trùng theo dạng bỏ dấu, có trần", async () => {
	const web = async (url) => (url.includes(encodeURIComponent("châm cứu")) ? '["x",["châm cứu là gì","CHÂM CỨU LÀ GÌ","cham cuu la gi"]]' : '["x",["bấm huyệt"]]');
	assert.deepEqual(await timXuHuong({ docWeb: web, hatGiong: ["châm cứu", "khác"] }), ["châm cứu là gì", "bấm huyệt"]);
	assert.equal((await timXuHuong({ docWeb: web, hatGiong: ["châm cứu"], tran: 1 })).length, 1);
});
