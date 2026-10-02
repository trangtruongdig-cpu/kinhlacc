// Gọi model AI — MỘT cửa duy nhất cho mọi tác vụ AI của Radar SEO.
//
// NHÀ CUNG CẤP: **Google AI Studio** (`generativelanguage.googleapis.com`), chốt 02/10/2026.
// Vì sao không phải hai đường kia:
//   · Antigravity IDE CÓ cửa headless (`bin/agentapi`, ba bậc flash_lite|flash|pro) nhưng nó chỉ
//     sống khi IDE đang mở, là binary nội bộ không tài liệu, và CA ĐÊM CHẠY TRÊN VPS — nơi sẽ
//     không bao giờ có Antigravity. Xem đặc tả mục 2b.
//   · Gemini CLI đã bị Google cắt cho tier cá nhân (IneligibleTierError).
//   · Yescale: người dùng bỏ.
// Google AI Studio cho ĐÚNG ba bậc model mà Antigravity phơi ra (flash-lite | flash | pro), qua
// giao diện chính thức, chạy được trên VPS.
//
// ⚠️ HAI ĐƯỜNG GỌI, CÓ CHỦ Ý:
//   · CHỮ (chat, embedding) đi qua lớp **OpenAI-compatible** của Google
//     (`/v1beta/openai/chat/completions`, ký bằng `Bearer`) — nhờ vậy mã này không phải viết
//     riêng cho Google, và đổi nhà cung cấp sau chỉ là đổi `GRAVITY_API_URL`.
//   · ẢNH đi qua đường **gốc của Google** (`…/models/<model>:generateContent`), vì lớp
//     OpenAI-compatible không hứa có `/images/generations`. Ảnh trả về là base64 trong
//     `inlineData`, không phải URL.
//
// Đặc tả: docs/superpowers/specs/2026-10-02-rada-seo-tu-hanh-gan-model.md
//
// VÌ SAO CÓ TỆP NÀY
// Trước đây Radar cố ý KHÔNG gọi model: AI chạy trong tài khoản Claude của người dùng và KÉO
// việc qua MCP. Hệ quả là không có tài khoản thì không có tác vụ nào chạy, và mỗi lượt đều
// tốn token của tài khoản đó. Người dùng chốt 02/10/2026: bỏ phụ thuộc token Claude, mỗi tác
// vụ gán một model phù hợp, chạy bằng PROMPT — tức plugin tự gọi, theo lịch của chính nó.
//
// MỖI TÁC VỤ MỘT MODEL, KHAI BẰNG BIẾN MÔI TRƯỜNG. Việc nặng (gom cụm theo nghĩa, viết bài)
// cần model mạnh; việc nhiều mà nhẹ (đọc 40 trang đối thủ mỗi đêm) phải dùng model rẻ, không
// thì tiền đổ vào đúng chỗ ít giá trị nhất. Đổi model là đổi CẤU HÌNH, không sửa mã.
//
// ⚠️ BỐN BẪY MANG TỪ THỜI YESCALE — đã trả giá, đừng dựng lại:
//
// 1. TỰ PARSE THÂN, ĐỪNG TIN SDK. Nhà cung cấp có thể gắn `Content-Type: text/plain` cho
//    model Claude (đo 26/09/2026; Gemini/GPT thì application/json). SDK chỉ parse khi là
//    JSON → lời gọi trông y như "mô hình không trả lời" dù thân JSON hợp lệ VÀ ĐÃ BỊ TÍNH
//    TIỀN. Nên ở đây đọc `text()` rồi tự `JSON.parse`.
// 2. TIMEOUT PHẢI KHAI TAY. Mặc định của SDK là 600 s × 2 lần thử lại; đã đo một lượt treo
//    2005 giây khi mạng chập. Mỗi tác vụ có hạn giờ riêng.
// 3. LƯỢT HỎNG VẪN TÍNH VÀO TRẦN. Không đếm nó thì một sự cố bên nhà cung cấp thành vòng
//    lặp gọi vô hạn.
// 4. "0 KẾT QUẢ" KHÔNG PHÂN BIỆT ĐƯỢC "SẠCH" VỚI "CHƯA ĐỌC ĐƯỢC". Mọi lời gọi trả về
//    `{ ok, chu, loi }` — người gọi phải phân biệt hai trạng thái đó, không được coi lỗi
//    là "không có gì".

/** Hạn giờ và trần token theo TÁC VỤ, không theo model: việc nặng cho nhiều, việc nhẹ cho ít. */
export const VIEC = Object.freeze({
	// Đọc trang đối thủ: 40 lượt/đêm, vào ~5.000 ký tự, ra JSON nhỏ. Việc nhiều mà nhẹ.
	doc_trang: { bien: "GRAVITY_MODEL_DOC_TRANG", hanGioMs: 60_000, toiDaRa: 1_200, nhiet: 0 },
	// Đọc trang SERP tìm sơ hở: cùng hạng với trên, ra danh sách ý.
	doc_serp: { bien: "GRAVITY_MODEL_DOC_SERP", hanGioMs: 60_000, toiDaRa: 1_500, nhiet: 0 },
	// Gom chủ đề đối thủ theo NGHĨA: vào 1.500 dòng, cần suy luận thật. 1 lượt/tuần.
	chien_luoc: { bien: "GRAVITY_MODEL_CHIEN_LUOC", hanGioMs: 180_000, toiDaRa: 4_000, nhiet: 0.2 },
	// Viết bài: ra 1.200–2.000 từ, cần văn phong. 2 lượt/đêm.
	viet_bai: { bien: "GRAVITY_MODEL_VIET", hanGioMs: 300_000, toiDaRa: 8_000, nhiet: 0.4 },
	// Thẩm định / chèn đoạn lấp khoảng trống: ra ít chữ nhưng rào chặt.
	tham_dinh: { bien: "GRAVITY_MODEL_THAM_DINH", hanGioMs: 180_000, toiDaRa: 2_500, nhiet: 0.3 },
	// Sinh ảnh minh hoạ cho từng H2 (ảnh BỐI CẢNH, không phải ảnh giải phẫu — xem đặc tả).
	sinh_anh: { bien: "GRAVITY_MODEL_ANH", hanGioMs: 120_000, toiDaRa: 0, nhiet: 0, laAnh: true },
});

const soNguyen = (x, md) => {
	const n = Number(x);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : md;
};

/**
 * @param {{fetch: typeof fetch, env?: Record<string,string|undefined>, log?: object}} p
 */
export function taoGoiModel({ fetch: nap, env = process.env, log }) {
	const bien = (k) => String(env?.[k] ?? "").trim();
	const goc = bien("GRAVITY_API_URL") || "https://generativelanguage.googleapis.com/v1beta/openai";
	/** Đường GỐC của Google, chỉ dùng cho ảnh — xem ghi chú đầu tệp. */
	const gocAnh = bien("GRAVITY_API_URL_ANH") || "https://generativelanguage.googleapis.com/v1beta";
	const khoa = bien("GRAVITY_API_KEY") || "";
	/** Trần SỐ LƯỢT GỌI mỗi tiến trình (lượt hỏng VẪN tính — bẫy 3). */
	const tran = soNguyen(bien("GRAVITY_TRAN_LUOT"), 300);
	let daGoi = 0;

	const thieuCauHinh = () => {
		const t = [];
		if (!goc) t.push("GRAVITY_API_URL");
		if (!khoa) t.push("GRAVITY_API_KEY");
		return t;
	};

	/** Model của một tác vụ; chưa khai thì rơi về GRAVITY_MODEL_MAC_DINH. */
	const modelCua = (viec) => bien(VIEC[viec]?.bien ?? "") || bien("GRAVITY_MODEL_MAC_DINH");

	return {
		/** Thiếu cấu hình thì nói rõ thiếu biến nào — KHÔNG nằm im (bẫy 4). */
		thieuCauHinh,
		coCauHinh: () => thieuCauHinh().length === 0,
		soLuotDaGoi: () => daGoi,
		conHanMuc: () => daGoi < tran,
		modelCua,

		/**
		 * NHÚNG (embedding) — phân cụm theo NGHĨA và đo bán kính chủ đề.
		 *
		 * Vì sao đáng có: thước cụm hiện tại là Jaccard trên tập CẶP TỪ, và chính tài liệu đối
		 * chiếu n8n đã ghi hạn chế — "bấm huyệt trị mất ngủ" và "an thần bằng huyệt Thần Môn" là
		 * một cụm mà thước chữ không thấy. Nhúng thấy, KHÔNG gọi mô hình sinh, nên rẻ và cho kết
		 * quả LẶP LẠI ĐƯỢC (cùng đầu vào → cùng vector → cùng cụm). Nó cũng là cách dựng
		 * siteFocusScore/siteRadius của leak Google: trọng tâm của site, rồi khoảng cách từng trang.
		 *
		 * @returns {Promise<{ok: boolean, vec: number[][], loi: string, model: string}>}
		 */
		async nhung(chuoi, { hanGioMs = 60_000 } = {}) {
			const ds = (Array.isArray(chuoi) ? chuoi : [chuoi]).map((x) => String(x ?? "")).filter(Boolean);
			const model = bien("GRAVITY_MODEL_NHUNG") || "text-embedding-004";
			const thieu = thieuCauHinh();
			if (thieu.length) return { ok: false, vec: [], loi: `chưa cấu hình ${thieu.join(", ")}`, model };
			if (!ds.length) return { ok: true, vec: [], loi: "", model };
			if (!this.conHanMuc()) return { ok: false, vec: [], loi: `đã chạm trần ${tran} lượt gọi`, model };
			daGoi++;
			const bo = new AbortController();
			const hen = setTimeout(() => bo.abort(), hanGioMs);
			try {
				const res = await nap(`${goc.replace(/\/+$/, "")}/embeddings`, {
					method: "POST",
					headers: { "content-type": "application/json", authorization: `Bearer ${khoa}` },
					signal: bo.signal,
					body: JSON.stringify({ model, input: ds }),
				});
				const than = await res.text();
				if (!res.ok) return { ok: false, vec: [], loi: `HTTP ${res.status}: ${than.slice(0, 200)}`, model };
				let j;
				try { j = JSON.parse(than) } catch { return { ok: false, vec: [], loi: "thân không phải JSON", model } }
				const vec = (j?.data ?? []).map((x) => (Array.isArray(x?.embedding) ? x.embedding : null)).filter(Boolean);
				// Thiếu vector là LỖI, không phải "không có gì" (bẫy 4): cụm sai còn tệ hơn không cụm.
				if (vec.length !== ds.length) return { ok: false, vec: [], loi: `nhận ${vec.length}/${ds.length} vector`, model };
				return { ok: true, vec, loi: "", model };
			} catch (e) {
				return { ok: false, vec: [], loi: e?.name === "AbortError" ? `quá hạn ${hanGioMs} ms` : String(e?.message ?? e), model };
			} finally {
				clearTimeout(hen);
			}
		},

		/**
		 * SINH ẢNH minh hoạ cho một mục H2. Đi đường GỐC của Google (xem ghi chú đầu tệp); ảnh
		 * trả về là **base64**, người gọi tự nạp lên thư viện CMS qua `ctx.media.upload`.
		 *
		 * ⚠️ CHỈ DÙNG CHO ẢNH BỐI CẢNH. Ảnh giải phẫu (vị trí huyệt, đường kinh, hình vị thuốc)
		 * BẮT BUỘC lấy từ thư viện CMS — ảnh sinh ra gần như chắc sai vị trí huyệt, và sai giải
		 * phẫu trên trang y khoa là loại sai tệ nhất. Hàm này KHÔNG được gọi cho mục "Vị trí",
		 * "Cách châm cứu" hay bất cứ mục nào mô tả giải phẫu.
		 *
		 * @returns {Promise<{ok: boolean, anh: {base64: string, kieu: string}|null, loi: string, model: string}>}
		 */
		async sinhAnh(loiNhac, { hanGioMs } = {}) {
			const c = VIEC.sinh_anh;
			const model = modelCua("sinh_anh") || "gemini-2.5-flash-image";
			if (!khoa) return { ok: false, anh: null, loi: "chưa cấu hình GRAVITY_API_KEY", model };
			if (!this.conHanMuc()) return { ok: false, anh: null, loi: `đã chạm trần ${tran} lượt gọi`, model };
			daGoi++;
			const bo = new AbortController();
			const hen = setTimeout(() => bo.abort(), hanGioMs ?? c.hanGioMs);
			try {
				const res = await nap(`${gocAnh.replace(/\/+$/, "")}/models/${encodeURIComponent(model)}:generateContent`, {
					method: "POST",
					headers: { "content-type": "application/json", "x-goog-api-key": khoa },
					signal: bo.signal,
					body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: String(loiNhac ?? "") }] }] }),
				});
				const than = await res.text();
				if (!res.ok) return { ok: false, anh: null, loi: `HTTP ${res.status}: ${than.slice(0, 200)}`, model };
				let j;
				try { j = JSON.parse(than) } catch { return { ok: false, anh: null, loi: "thân không phải JSON", model } }
				const parts = j?.candidates?.[0]?.content?.parts ?? [];
				const p = parts.find((x) => x?.inlineData?.data);
				if (!p) return { ok: false, anh: null, loi: `phản hồi không có ảnh (${than.slice(0, 160)})`, model };
				return { ok: true, anh: { base64: p.inlineData.data, kieu: p.inlineData.mimeType || "image/png" }, loi: "", model };
			} catch (e) {
				return { ok: false, anh: null, loi: e?.name === "AbortError" ? `quá hạn ${hanGioMs ?? c.hanGioMs} ms` : String(e?.message ?? e), model };
			} finally {
				clearTimeout(hen);
			}
		},

		/**
		 * Gọi một tác vụ. KHÔNG BAO GIỜ NÉM — trả `{ ok, chu, loi, model }`.
		 *
		 * @param viec   khoá trong VIEC
		 * @param loiNhac lời dặn hệ thống (lấy từ loi-dan.mjs — prompt đã có sẵn, dùng lại)
		 * @param chu     dữ liệu người dùng; LUÔN là vai "user", không trộn vào lời dặn
		 */
		async goi(viec, loiNhac, chu, { hanGioMs, toiDaRa } = {}) {
			const c = VIEC[viec];
			if (!c) return { ok: false, chu: "", loi: `tác vụ lạ: ${viec}`, model: "" };
			const thieu = thieuCauHinh();
			if (thieu.length) return { ok: false, chu: "", loi: `chưa cấu hình ${thieu.join(", ")}`, model: "" };
			const model = modelCua(viec);
			if (!model) return { ok: false, chu: "", loi: `chưa khai model cho tác vụ ${viec} (${c.bien} hoặc GRAVITY_MODEL_MAC_DINH)`, model: "" };
			if (!this.conHanMuc()) return { ok: false, chu: "", loi: `đã chạm trần ${tran} lượt gọi trong tiến trình này`, model };

			// Đếm TRƯỚC khi gọi: lượt hỏng vẫn tính (bẫy 3).
			daGoi++;
			const bo = new AbortController();
			const hen = setTimeout(() => bo.abort(), hanGioMs ?? c.hanGioMs); // bẫy 2
			try {
				const res = await nap(`${goc.replace(/\/+$/, "")}/chat/completions`, {
					method: "POST",
					headers: { "content-type": "application/json", authorization: `Bearer ${khoa}` },
					signal: bo.signal,
					body: JSON.stringify({
						model,
						temperature: c.nhiet,
						max_tokens: toiDaRa ?? c.toiDaRa,
						messages: [
							{ role: "system", content: String(loiNhac ?? "") },
							{ role: "user", content: String(chu ?? "") },
						],
					}),
				});
				// Đọc text rồi TỰ parse — không tin content-type (bẫy 1).
				const than = await res.text();
				if (!res.ok) return { ok: false, chu: "", loi: `HTTP ${res.status}: ${than.slice(0, 200)}`, model };
				const noiDung = noiDungTuThan(than);
				if (!noiDung) return { ok: false, chu: "", loi: `thân phản hồi không có nội dung (${than.slice(0, 200)})`, model };
				return { ok: true, chu: noiDung, loi: "", model };
			} catch (e) {
				const quaHan = e?.name === "AbortError";
				return { ok: false, chu: "", loi: quaHan ? `quá hạn ${hanGioMs ?? c.hanGioMs} ms` : String(e?.message ?? e), model };
			} finally {
				clearTimeout(hen);
				try { log?.debug?.(`Rada SEO: gọi ${viec} (${model}), lượt ${daGoi}/${tran}`) } catch { /* bỏ qua */ }
			}
		},
	};
}

/**
 * Bóc nội dung khỏi thân `chat/completions`. Bẫy 1 — xem đầu tệp.
 * Nhận cả dạng `choices[].message.content` (OpenAI) và `content[].text` (Anthropic trần).
 */
export function noiDungTuThan(than) {
	if (!than) return "";
	let j;
	try {
		j = JSON.parse(than);
	} catch {
		return "";
	}
	const a = j?.choices?.[0]?.message?.content;
	if (typeof a === "string" && a.trim()) return a.trim();
	const b = Array.isArray(j?.content) ? j.content.find((x) => typeof x?.text === "string")?.text : null;
	return typeof b === "string" ? b.trim() : "";
}

/**
 * Bóc JSON khỏi câu trả lời của model: model hay bọc trong ```json … ``` hoặc thêm lời dẫn.
 * Trả `null` khi không đọc được — người gọi phải phân biệt null với "mảng rỗng" (bẫy 4).
 */
export function jsonTuChu(chu) {
	const s = String(chu ?? "").trim();
	if (!s) return null;
	const trong = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
	const tho = (trong ? trong[1] : s).trim();
	try {
		return JSON.parse(tho);
	} catch { /* thử cắt từ dấu mở đầu tiên */ }
	const i = tho.search(/[[{]/);
	if (i < 0) return null;
	const j = Math.max(tho.lastIndexOf("]"), tho.lastIndexOf("}"));
	if (j <= i) return null;
	try {
		return JSON.parse(tho.slice(i, j + 1));
	} catch {
		return null;
	}
}
