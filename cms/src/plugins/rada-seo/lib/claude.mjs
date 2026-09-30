// Gọi Claude qua SDK chính thức của Anthropic, cho các việc LẶP, SỐ LƯỢNG LỚN của radar
// (phân tích từng trang đối thủ). Việc cần chất lượng — chọn đề tài, viết bài — KHÔNG ở đây:
// Claude Code làm theo lịch (xem đặc tả, mục "Nguồn AI").
//
// NGÂN SÁCH tính bằng SỐ LƯỢT GỌI và trừ TRƯỚC khi gọi — lượt hỏng vẫn tính. Không đếm lượt
// hỏng thì một sự cố bên nhà cung cấp thành vòng gọi vô hạn (bài học của bot thẩm định).
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

/** Model cho việc sàng lọc số lượng lớn — người dùng chốt Haiku (30/09/2026). */
export const MODEL_SANG = "claude-haiku-4-5";

export class HetNganSach extends Error {
	constructor(tran) {
		super(`Hết ngân sách: đã dùng đủ ${tran} lượt gọi mô hình trong ca này`);
		this.name = "HetNganSach";
	}
}

/** @returns {{dung(): void, readonly daDung: number, readonly tran: number}} */
export function taoNganSach(tran) {
	let daDung = 0;
	return {
		dung() {
			if (daDung >= tran) throw new HetNganSach(tran);
			daDung++;
		},
		get daDung() {
			return daDung;
		},
		get tran() {
			return tran;
		},
	};
}

/**
 * Client thật. Đọc khoá lúc CHẠY (không ở tầng module: astro.config chạy lúc build nên biến
 * môi trường đọc ở tầng module có thể bị đóng băng vào bản dựng).
 */
export function taoClientThat() {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) throw new Error("Thiếu ANTHROPIC_API_KEY — radar không gọi được Claude.");
	// Timeout khai tay + 1 lần thử lại: mặc định của SDK là 10 phút × 3 lượt.
	return new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });
}

/**
 * @param {{client: {messages: {parse: Function}}, nganSach: ReturnType<typeof taoNganSach>, model?: string}} o
 */
export function taoClaude({ client, nganSach, model = MODEL_SANG }) {
	return {
		/** Trả object đã qua kiểm khuôn zod; ném lỗi khi từ chối, bị cắt, hay không đọc được. */
		async traJson(system, user, khuon, maxTokens) {
			nganSach.dung();
			const res = await client.messages.parse({
				model,
				max_tokens: maxTokens,
				system,
				messages: [{ role: "user", content: user }],
				output_config: { format: zodOutputFormat(khuon) },
			});
			if (res.stop_reason === "refusal") throw new Error("Claude từ chối trả lời trang này");
			if (res.stop_reason === "max_tokens") throw new Error("Câu trả lời bị cắt vì chạm max_tokens");
			if (!res.parsed_output) throw new Error("Claude không trả về JSON đúng khuôn");
			return res.parsed_output;
		},
	};
}
