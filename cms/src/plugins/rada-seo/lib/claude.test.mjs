import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { taoClaude, taoNganSach, HetNganSach, MODEL_SANG } from "./claude.mjs";

const KHUON = z.object({ a: z.string() });

function clientGia(tra) {
	const goi = [];
	return { goi, messages: { parse: async (req) => { goi.push(req); return typeof tra === "function" ? tra(req) : tra; } } };
}

test("gửi đúng model Haiku, khuôn json_schema, và trả parsed_output", async () => {
	const c = clientGia({ stop_reason: "end_turn", parsed_output: { a: "x" } });
	const claude = taoClaude({ client: c, nganSach: taoNganSach(5) });
	assert.deepEqual(await claude.traJson("hệ", "người", KHUON, 800), { a: "x" });
	assert.equal(c.goi[0].model, MODEL_SANG);
	assert.equal(c.goi[0].model, "claude-haiku-4-5");
	assert.equal(c.goi[0].max_tokens, 800);
	assert.equal(c.goi[0].output_config.format.type, "json_schema");
});

test("ngân sách trừ TRƯỚC khi gọi — lượt hỏng vẫn tính, hết thì ném HetNganSach", async () => {
	const ns = taoNganSach(2);
	const c = clientGia(() => { throw new Error("529 quá tải"); });
	const claude = taoClaude({ client: c, nganSach: ns });
	await assert.rejects(claude.traJson("", "", KHUON, 10), /529/);
	await assert.rejects(claude.traJson("", "", KHUON, 10), /529/);
	await assert.rejects(claude.traJson("", "", KHUON, 10), HetNganSach);
	assert.equal(ns.daDung, 2);
	assert.equal(c.goi.length, 2);
});

test("từ chối / bị cắt / không đúng khuôn đều ném lỗi rõ", async () => {
	for (const [tra, mau] of [
		[{ stop_reason: "refusal", parsed_output: null }, /từ chối/],
		[{ stop_reason: "max_tokens", parsed_output: null }, /max_tokens/],
		[{ stop_reason: "end_turn", parsed_output: null }, /đúng khuôn/],
	]) {
		const claude = taoClaude({ client: clientGia(tra), nganSach: taoNganSach(9) });
		await assert.rejects(claude.traJson("", "", KHUON, 10), mau);
	}
});
