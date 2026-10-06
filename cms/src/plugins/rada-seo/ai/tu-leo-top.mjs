/**
 * CA LEO TOP TỰ HÀNH — nối bốn khâu vốn chỉ gọi được qua route MCP.
 *
 * Trước 06/10/2026 toàn bộ trục "giữ đất" KHÔNG có đường chạy tự hành nào: `taoPhienLeoTop` chỉ
 * tới được từ `layTuKhoaLeoTop`, mà hàm đó chỉ có một chỗ gọi là route `mcp-lay-tu-khoa-leo-top`.
 * Hệ quả: `leo_top` rỗng vĩnh viễn, `doLaiLeoTop` đo lại tập rỗng mỗi đêm, và bảng Vòng học nói
 * "cần qua mốc +28 ngày" — đọc ra là "cứ chờ", trong khi sự thật là "chưa ai từng tạo phiên".
 *
 * ⚠️ NGUỒN SERP KHÔNG PHẢI SERP THẬT ở bản cài hiện tại. Xem `leo-top/nguon-serp.mjs`. Người dùng
 * chốt 06/10/2026: dùng kho đối thủ trước, cắm API SERP sau, và nguồn phải là một CỔNG thay được
 * — nên hàm này nhận `khoDoiThu` qua tham số chứ không tự đi lấy.
 *
 * ⚠️ Mỗi phiếu là MỘT lượt gọi model. Trần phiên mỗi ca là nút vặn tiền, không phải chi tiết.
 */
import { chonTrangDoiThu } from "../leo-top/nguon-serp.mjs";

/** Mỗi ca mở tối đa ngần này phiếu. Đè bằng `RADA_SEO_TRAN_LEO_TOP`. */
export const TRAN_PHIEN_MOI_CA = 5;

/**
 * Giờ UTC chạy ca leo top: 21:30 UTC = 04:30 giờ VN — SAU ca radar (19:30) và lò viết (20:30).
 *
 * ⚠️ Hàm THUẦN theo giờ UTC. Bảng `_emdash_cron_tasks` nằm trong kho CMS dùng chung nên mọi phép
 * so phải độc lập với múi giờ của tiến trình đã nhận tick — cùng lý lẽ với `GIO_UTC_CHAY` và
 * `denLuotChienLuoc`.
 */
export const GIO_UTC_LEO_TOP = 21;
export function denLuotLeoTop(now = new Date()) {
	return now.getUTCHours() === GIO_UTC_LEO_TOP;
}

/** Rút danh sách ý từ thân model trả về; sai dạng thì trả null chứ không đoán. */
function docYModel(chu) {
	try {
		const j = JSON.parse(String(chu ?? "").replace(/^```(?:json)?\s*|\s*```$/g, ""));
		return Array.isArray(j?.trang) ? j.trang : null;
	} catch {
		return null;
	}
}

/**
 * Chạy một ca leo top.
 *
 * @param {{layTuKhoa, khoDoiThu, nopSerp, layTrang, goiModel, ghiSoHo, log}} cong Cổng — mọi khâu
 *   tiêm vào, nên hàm này kiểm được mà không cần dựng plugin.
 * @returns {Promise<{soPhien: number, soPhieu: number, ghiChu: string[]}>}
 */
export async function chayCaLeoTop(cong, { tranPhien = TRAN_PHIEN_MOI_CA } = {}) {
	const ghiChu = [];
	const ra = { soPhien: 0, soPhieu: 0, ghiChu };

	const dsPhien = await cong.layTuKhoa().then((x) => x?.moi ?? [], (e) => (ghiChu.push(`lấy từ khoá hỏng: ${String(e?.message ?? e).slice(0, 120)}`), []));
	if (!dsPhien.length) {
		// ⚠️ Nói ra LÝ DO. "0 phiếu" im lặng đọc ra như "không có việc", trong khi nó có thể là
		// "chưa cấu hình GSC" hoặc "mọi từ khoá đã có phiên đang mở".
		ghiChu.push("Không có phiên leo top mới nào — chưa có từ khoá nào đủ điều kiện, hoặc đã chạm trần phiên đang mở.");
		return ra;
	}

	const kho = await cong.khoDoiThu().catch((e) => (ghiChu.push(`đọc kho đối thủ hỏng: ${String(e?.message ?? e).slice(0, 120)}`), []));

	for (const p of dsPhien.slice(0, tranPhien)) {
		ra.soPhien++;
		try {
			const chon = chonTrangDoiThu(kho, p.tuKhoa);
			if (!chon.length) {
				// ⚠️ KHÔNG nộp bừa. Một phiếu dựng từ trang chẳng liên quan trông y như phát hiện
				// thật, và người đọc không có cách nào biết.
				ghiChu.push(`"${p.tuKhoa}": không đủ nguyên liệu — không tìm được trang đối thủ cùng chủ đề trong kho.`);
				continue;
			}
			const nop = await cong.nopSerp({ id: p.id, urls: chon.map((x) => x.url) });
			if (!(nop?.soChon > 0)) {
				ghiChu.push(`"${p.tuKhoa}": nộp ${chon.length} URL mà không trang nào tải được.`);
				continue;
			}
			const bai = await cong.layTrang({ id: p.id });
			const kq = await cong.goiModel({ viec: "doc_serp", bai });
			if (!kq?.ok) {
				ghiChu.push(`"${p.tuKhoa}": model không trả lời — ${String(kq?.loi ?? "không rõ").slice(0, 100)}`);
				continue;
			}
			const trang = docYModel(kq.chu);
			if (!trang) {
				ghiChu.push(`"${p.tuKhoa}": model trả sai dạng JSON, bỏ qua phiên này.`);
				continue;
			}
			await cong.ghiSoHo({ id: p.id, trang });
			ra.soPhieu++;
		} catch (e) {
			// ⚠️ Một phiên hỏng KHÔNG được làm đứt cả ca: 4 phiên còn lại vẫn đáng chạy, và lý do
			// phải lên `ghiChu` để màn hình đọc được thay vì chìm trong log container.
			ghiChu.push(`"${p.tuKhoa}": ${String(e?.message ?? e).slice(0, 140)}`);
		}
	}
	return ra;
}
