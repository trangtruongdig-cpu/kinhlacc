// Màn điều khiển Rada SEO trong /_emdash/admin/plugins/rada-seo/rada.
// Chỉ HIỂN THỊ và gọi route của plugin; mọi luật nằm phía máy chủ.
import { Fragment, useCallback, useEffect, useState } from "react";

async function goi(route, body) {
	const res = await fetch(`/_emdash/api/plugins/rada-seo/${route}`, {
		method: "POST",
		credentials: "same-origin",
		// X-EmDash-Request là thứ CHỊU LỰC: thiếu nó production trả 403 CSRF_REJECTED.
		headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
		body: JSON.stringify(body ?? {}),
	});
	const j = await res.json().catch(() => null);
	if (!res.ok || j?.success === false) throw new Error(j?.error?.message ?? `Lỗi ${res.status}`);
	return j?.data ?? j;
}

const NHAN_CUM = { cho_viet: "Chờ viết", co_nhap: "Có nháp", da_dang: "Đã đăng", bo_qua: "Bỏ qua", phu_boi_tu_dien: "Từ điển đã phủ" };
const gio = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "—");
const o = { padding: "6px 8px", borderBottom: "1px solid #e5e5e5", textAlign: "left", verticalAlign: "top" };

// ---- Nút ----
// CSS của khu quản trị EmDash XOÁ SẠCH kiểu mặc định của <button>: không viền, không nền. Nút
// trần hiện ra như chữ thường — người dùng đã không nhận ra "Bật lịch", "Chạy thật", "Lưu"… là
// nút bấm được. MỌI nút trên màn này phải đi qua <Nut>, không dùng <button> trần.
const NUT = {
	display: "inline-block",
	padding: "4px 12px",
	margin: "2px 0",
	border: "1px solid #d1d5db",
	borderRadius: 6,
	background: "#fff",
	color: "#111827",
	cursor: "pointer",
	font: "inherit",
	lineHeight: 1.4,
	boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
};
/** Việc chính của mỗi chỗ (Chạy thật, Lưu, Duyệt, Nhận…). */
const NUT_CHINH = { background: "#1f2937", borderColor: "#1f2937", color: "#fff", fontWeight: 600 };
/** Tab đang mở. */
const NUT_DANG_CHON = { background: "#e5e7eb", borderColor: "#6b7280", fontWeight: 700 };
const NUT_TAT = { opacity: 0.45, cursor: "not-allowed", boxShadow: "none" };

function Nut({ chinh, dangChon, disabled, style, type = "button", ...con }) {
	return (
		<button
			type={type}
			disabled={disabled}
			aria-pressed={dangChon === undefined ? undefined : !!dangChon}
			style={{ ...NUT, ...(chinh && NUT_CHINH), ...(dangChon && NUT_DANG_CHON), ...(disabled && NUT_TAT), ...style }}
			{...con}
		/>
	);
}

// Ô "máy đang tự làm gì" đầu tab Radar — câu do máy chủ tính (tinh-trang.mjs), ở đây chỉ vẽ.
const DAU_TINH_TRANG = { ok: ["✓", "#15803d"], cho: ["•", "#92400e"], thieu: ["✗", "#b91c1c"] };
function OTinhTrang({ ds }) {
	if (!ds || ds.length === 0) return null;
	return (
		<div style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 14px", margin: "8px 0 16px", background: "#f9fafb" }}>
			<div style={{ fontWeight: 600, marginBottom: 4 }}>Máy đang tự làm gì</div>
			{ds.map((x, i) => {
				const [dau, mau] = DAU_TINH_TRANG[x.muc] ?? DAU_TINH_TRANG.cho;
				return (
					<div key={i} style={{ margin: "2px 0" }}>
						<span style={{ color: mau, fontWeight: 700, display: "inline-block", width: 18 }}>{dau}</span>
						{x.luc ? x.chu.replace("{luc}", gio(x.luc)) : x.chu}
					</div>
				);
			})}
		</div>
	);
}

// ---- Thanh tab (2C-2) ----
const TABS = [
	{ key: "radar", label: "Radar" },
	{ key: "huong", label: "Hướng nội dung" },
	{ key: "ke-hoach", label: "Kế hoạch" },
	{ key: "leo-top", label: "Leo top" },
	{ key: "nhap", label: "Nháp" },
];
const TAB_LS_KEY = "rada-seo:tab";
function tabDaLuu() {
	try {
		const v = localStorage.getItem(TAB_LS_KEY);
		return TABS.some((t) => t.key === v) ? v : "radar";
	} catch {
		return "radar";
	}
}
function luuTab(tab) {
	try {
		localStorage.setItem(TAB_LS_KEY, tab);
	} catch {
		// riêng tư trình duyệt/không có localStorage: bỏ qua, tab vẫn đổi được trong phiên này.
	}
}

// Site thật — admin.jsx chạy trong trình duyệt nên không đọc được RADA_SEO_SITE của máy chủ;
// cùng giá trị mặc định với noi-bo/nap.mjs và noi-bo/kiem-duong.mjs.
const TRANG_GOC = "https://kinhlac.online";
const NHAN_HUONG = { de_xuat: "Đề xuất", da_nhan: "Đã nhận", bo_qua: "Đã bỏ" };
const NHAN_KE_HOACH = { de_xuat: "Chờ duyệt", da_duyet: "Đã duyệt", bo_qua: "Đã bỏ", dang_viet: "Đang viết", co_nhap: "Có nháp", da_dang: "Đã đăng", can_xem: "Cần xem lại" };
const NHAN_Y_DINH = { tra_cuu: "Tra cứu", tim_hieu: "Tìm hiểu", so_sanh: "So sánh", huong_dan: "Hướng dẫn" };
/**
 * Màn duyệt sửa được các bài ở những trạng thái này (đích đặt được: KE_HOACH_MAN_DUYET ở plugin.mjs).
 * can_xem: lò viết bỏ cuộc (nộp hết lượt đều trượt / giữ chỗ hết hạn lần 2) — "Duyệt lại" hoặc "Bỏ".
 */
const KE_HOACH_SUA_DUOC = new Set(["de_xuat", "da_duyet", "bo_qua", "can_xem"]);

/** Danh sách "chủ đề + link mở tab mới", dùng chung cho bằng chứng bài đối thủ và tài sản nội bộ. */
function DanhSachLink({ ds, hienThi, toiDa = 5 }) {
	if (!ds || ds.length === 0) return <>—</>;
	return ds.slice(0, toiDa).map((x, i) => (
		<span key={i}>
			{i > 0 && "; "}
			<a href={hienThi(x).href} target="_blank" rel="noopener noreferrer">
				{hienThi(x).nhan}
			</a>
		</span>
	));
}

function HuongRow({ h, onNhan, onBo, onKhoiPhuc }) {
	const [trongSo, setTrongSo] = useState(h.trongSo ?? h.trongSoGoiY ?? 3);
	const [lyDo, setLyDo] = useState("");
	const [moRong, setMoRong] = useState(false);
	const cs = h.chiSo ?? {};
	return (
		<>
			<tr>
				<td style={o}>
					<Nut onClick={() => setMoRong(!moRong)}>{moRong ? "▾" : "▸"} {h.ten}</Nut>
				</td>
				<td style={o}>{h.moTa}</td>
				<td style={o}>
					{h.diem}
					{cs.trungXuHuong && " 📈"}
					{cs.viPham && " ⚠"}
					{cs.ganSanPham && " ★"}
				</td>
				<td style={o}>
					{cs.soDoiThu ?? 0} / {cs.soBai ?? 0}
					{cs.soBangChungBoQua > 0 && (
						<div style={{ fontSize: 12, color: "#92400e" }}>{cs.soBangChungBoQua} bằng chứng không khớp đã loại</div>
					)}
				</td>
				<td style={o}>{cs.soBaiMinh ?? 0}</td>
				<td style={o}>{cs.soTaiSan ?? 0}</td>
				<td style={o}>{cs.trungXuHuong ? "Có" : "Không"}</td>
				<td style={o}>{h.trongSoGoiY ?? "—"}</td>
				<td style={o}>
					{NHAN_HUONG[h.trangThai] ?? h.trangThai}
					{h.trangThai === "bo_qua" && h.lyDoBo ? ` — ${h.lyDoBo}` : ""}
				</td>
				<td style={o}>
					<select value={trongSo} onChange={(e) => setTrongSo(Number(e.target.value))}>
						{[1, 2, 3, 4, 5].map((n) => (
							<option key={n} value={n}>{n}</option>
						))}
					</select>{" "}
					<Nut chinh onClick={() => onNhan(h.id, trongSo)}>Nhận</Nut>{" "}
					<input placeholder="lý do bỏ (bắt buộc)" value={lyDo} onChange={(e) => setLyDo(e.target.value)} style={{ width: 150 }} />{" "}
					<Nut disabled={!lyDo.trim()} onClick={() => onBo(h.id, lyDo)}>Bỏ</Nut>{" "}
					{h.trangThai !== "de_xuat" && <Nut onClick={() => onKhoiPhuc(h.id)}>Khôi phục</Nut>}
				</td>
			</tr>
			{moRong && (
				<tr>
					<td colSpan={10} style={{ ...o, background: "#fafafa" }}>
						<div>
							<b>Tài sản nội bộ ({cs.soTaiSan ?? 0}):</b>{" "}
							<DanhSachLink ds={cs.taiSan} toiDa={15} hienThi={(t) => ({ href: `${TRANG_GOC}${t.duong}`, nhan: t.ten })} />
						</div>
						<div>
							{/* Máy chủ tự dò bài khớp hướng và BÙ vào danh sách — có thể có dù Claude không dẫn id nào. */}
							<b>Bài đối thủ khớp hướng (máy chủ tìm):</b>{" "}
							<DanhSachLink ds={h.baiDoiThu} toiDa={5} hienThi={(b) => ({ href: b.url, nhan: b.chuDe || b.url })} />
						</div>
						{cs.soBangChungBoQua > 0 && (
							<div style={{ color: "#92400e" }}>{cs.soBangChungBoQua} bằng chứng không khớp đã loại</div>
						)}
						{h.lyDo && (
							<div>
								<b>Lý do Claude đề xuất:</b> {h.lyDo}
							</div>
						)}
					</td>
				</tr>
			)}
		</>
	);
}

function HuongTab({ dl, loi, onNhan, onBo, onKhoiPhuc }) {
	if (!dl) return <div style={{ padding: 24 }}>{loi || "Đang tải…"}</div>;
	return (
		<div>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			<h2>Hướng nội dung ({dl.huong.length})</h2>
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr>
						<th style={o}>Tên</th><th style={o}>Mô tả</th><th style={o}>Điểm</th><th style={o}>Đối thủ / bài</th>
						<th style={o}>Bài của mình</th><th style={o}>Tài sản nội bộ</th><th style={o}>Trúng xu hướng</th>
						<th style={o}>Trọng số gợi ý</th><th style={o}>Trạng thái</th><th style={o}></th>
					</tr>
				</thead>
				<tbody>
					{dl.huong.map((h) => (
						<HuongRow key={h.id} h={h} onNhan={onNhan} onBo={onBo} onKhoiPhuc={onKhoiPhuc} />
					))}
				</tbody>
			</table>
			<p style={{ fontSize: 12, color: "#666" }}>📈 trúng xu hướng tìm kiếm · ⚠ nghiêng chữa trị / hứa kết quả (bị trừ điểm) · ★ gần sản phẩm (điểm cộng nhỏ)</p>
		</div>
	);
}

function KeHoachRow({ k, onDuyet, onBo }) {
	const [lyDo, setLyDo] = useState("");
	const [moRong, setMoRong] = useState(false);
	const bc = k.bangChung ?? {};
	const suaDuoc = KE_HOACH_SUA_DUOC.has(k.trangThai);
	return (
		<>
			<tr>
				<td style={o}>
					<Nut onClick={() => setMoRong(!moRong)}>{moRong ? "▾" : "▸"} {k.tieuDeLamViec}</Nut>
				</td>
				<td style={o}>
					{k.tuKhoaChinh}
					{(k.tuKhoaPhu ?? []).length > 0 && <> / {k.tuKhoaPhu.join(", ")}</>}
				</td>
				<td style={o}>{NHAN_Y_DINH[k.yDinh] ?? k.yDinh}</td>
				<td style={o}>
					<a href={`${TRANG_GOC}${k.trangTruCot}`} target="_blank" rel="noopener noreferrer">{k.trangTruCot}</a>
				</td>
				<td style={o}>{(k.lienKetDich ?? []).length}</td>
				<td style={o}>
					{bc.soDoiThu ?? 0} đối thủ / {bc.soBai ?? 0} bài{bc.trungXuHuong && " 📈"}
					{(bc.canhBaoTrung ?? []).length > 0 && (
						// tieuDe là chữ thô từ kho — chỉ hiển thị qua JSX text, không bao giờ qua HTML.
						<ul style={{ margin: "4px 0 0", paddingLeft: 16, fontSize: 12, color: "#92400e" }}>
							{bc.canhBaoTrung.map((t, i) => (
								<li key={i}>
									{/* 3 chữ số, làm tròn XUỐNG ở máy chủ: 0,296 không được hiện thành "0.30" = ngưỡng trùng. */}
									⚠ gần giống: {t.tieuDe} (độ giống {Number(t.doGiong).toFixed(3)} — dưới ngưỡng trùng 0.30, vẫn nhận)
								</li>
							))}
						</ul>
					)}
				</td>
				<td style={o}>
					{NHAN_KE_HOACH[k.trangThai] ?? k.trangThai}
					{k.trangThai === "bo_qua" && k.lyDoBo ? ` — ${k.lyDoBo}` : ""}
					{k.trangThai === "can_xem" && (
						// loiCuoi là lời máy chủ trả cho lượt nộp cuối — chữ thô, chỉ hiển thị qua JSX text.
						<div style={{ fontSize: 12, color: "#92400e" }}>
							{k.lyDoCanXem && <div>{k.lyDoCanXem}</div>}
							{(k.loiCuoi ?? []).length > 0 && (
								<ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
									{k.loiCuoi.map((l, i) => (
										<li key={i}>{l}</li>
									))}
								</ul>
							)}
						</div>
					)}
				</td>
				<td style={o}>
					{suaDuoc ? (
						<>
							{k.trangThai !== "da_duyet" && <Nut chinh onClick={() => onDuyet(k.id)}>{k.trangThai === "can_xem" ? "Duyệt lại" : "Duyệt"}</Nut>}{" "}
							<input placeholder="lý do bỏ (bắt buộc)" value={lyDo} onChange={(e) => setLyDo(e.target.value)} style={{ width: 130 }} />{" "}
							{k.trangThai !== "bo_qua" && <Nut disabled={!lyDo.trim()} onClick={() => onBo(k.id, lyDo)}>Bỏ</Nut>}
						</>
					) : (
						"—"
					)}
				</td>
			</tr>
			{moRong && (
				<tr>
					<td colSpan={8} style={{ ...o, background: "#fafafa" }}>
						<div>
							<b>Link đích ({(k.lienKetDich ?? []).length}):</b>{" "}
							<DanhSachLink ds={k.lienKetDich} toiDa={12} hienThi={(d) => ({ href: `${TRANG_GOC}${d}`, nhan: d })} />
						</div>
						<div>
							<b>Bài đối thủ khớp hướng (máy chủ tìm):</b>{" "}
							<DanhSachLink ds={bc.baiDoiThu} toiDa={5} hienThi={(b) => ({ href: b.url, nhan: b.chuDe || b.url })} />
						</div>
					</td>
				</tr>
			)}
		</>
	);
}

function KeHoachTab({ dl, loi, onDuyet, onBo }) {
	const [locTrangThai, setLocTrangThai] = useState("de_xuat");
	if (!dl) return <div style={{ padding: 24 }}>{loi || "Đang tải…"}</div>;
	const huongById = new Map(dl.huong.map((h) => [h.id, h]));
	const cumById = new Map(dl.cum.map((c) => [c.id, c]));
	const items = dl.keHoach.filter((k) => locTrangThai === "tat_ca" || k.trangThai === locTrangThai);
	const theoHuong = new Map();
	const nhomCum = (hId, cId) => {
		if (!theoHuong.has(hId)) theoHuong.set(hId, new Map());
		const theoCum = theoHuong.get(hId);
		if (!theoCum.has(cId)) theoCum.set(cId, []);
		return theoCum.get(cId);
	};
	for (const k of items) nhomCum(k.huongId ?? cumById.get(k.cumId)?.huongId ?? "?", k.cumId).push(k);
	// Cụm đang đề xuất mà CHƯA có bài dự kiến nào (ở mọi trạng thái): vẫn hiện, để người duyệt
	// thấy cụm nào routine tuần chưa lập kế hoạch — trước đây chúng biến mất khỏi tab này.
	const cumCoKeHoach = new Set(dl.keHoach.map((k) => k.cumId));
	for (const c of dl.cum) if (c.trangThai !== "cu" && !cumCoKeHoach.has(c.id)) nhomCum(c.huongId ?? "?", c.id);
	return (
		<div>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			<h2>Kế hoạch ({dl.keHoach.length})</h2>
			<p>
				Lọc theo trạng thái:{" "}
				<select value={locTrangThai} onChange={(e) => setLocTrangThai(e.target.value)}>
					<option value="tat_ca">Tất cả</option>
					{Object.entries(NHAN_KE_HOACH).map(([k, n]) => (
						<option key={k} value={k}>{n}</option>
					))}
				</select>
			</p>
			{theoHuong.size === 0 && <p>Không có bài dự kiến nào khớp bộ lọc.</p>}
			{items.length === 0 && theoHuong.size > 0 && <p>Không có bài dự kiến nào khớp bộ lọc — bên dưới chỉ còn các cụm chưa có kế hoạch.</p>}
			{[...theoHuong.entries()].map(([hId, theoCum]) => (
				<div key={hId} style={{ marginBottom: 24 }}>
					<h3>{huongById.get(hId)?.ten ?? `(hướng ${hId})`}</h3>
					{[...theoCum.entries()].map(([cId, ds]) => {
						const cum = cumById.get(cId);
						const cu = cum?.trangThai === "cu";
						const boQua = cum?.chiSo?.soBangChungBoQua ?? 0;
						// Cụm "cu": lượt phân cụm sau đã thay, không nhận bài mới — nhưng bài của nó vẫn duyệt/bỏ được.
						return (
						<div key={cId} style={{ marginLeft: 16, marginBottom: 12 }}>
							<h4 style={{ color: cu ? "#9ca3af" : undefined }}>
								{cum?.ten ?? `(cụm ${cId})`}
								{cu && <span style={{ fontWeight: 400, fontSize: 12 }}> — cụm cũ (đã được thay)</span>}
								{boQua > 0 && <span style={{ fontWeight: 400, fontSize: 12, color: "#92400e" }}> · {boQua} bằng chứng không khớp đã loại</span>}
							</h4>
							{ds.length === 0 ? (
								<p style={{ color: "#6b7280", fontStyle: "italic" }}>Chưa có kế hoạch.</p>
							) : (
							<table style={{ borderCollapse: "collapse", width: "100%" }}>
								<thead>
									<tr>
										<th style={o}>Tiêu đề tạm</th><th style={o}>Từ khoá chính / phụ</th><th style={o}>Ý định</th>
										<th style={o}>Trụ cột</th><th style={o}>Link đích</th><th style={o}>Bằng chứng</th>
										<th style={o}>Trạng thái</th><th style={o}></th>
									</tr>
								</thead>
								<tbody>
									{ds.map((k) => (
										<KeHoachRow key={k.id} k={k} onDuyet={onDuyet} onBo={onBo} />
									))}
								</tbody>
							</table>
							)}
						</div>
						);
					})}
				</div>
			))}
		</div>
	);
}

// ---- Tab "Leo top" (2D) ----
const NHAN_LEO_TOP = {
	cho_serp: "Chờ Claude tìm top",
	cho_doc: "Chờ Claude đọc trang",
	co_phieu: "Có phiếu — chờ sửa",
	da_sua: "Đã sửa — chờ đo lại",
	xong: "Xong",
	bo: "Bỏ dở",
};
/** Cùng giá trị với kho.MOC_DO_LAI / kho.NGAY_PHIEU_TINH_TRAN (admin.jsx chạy trong trình duyệt, không import kho). */
const MOC_DO_LAI = [14, 28];
const NGAY_PHIEU_TINH_TRAN = 30;
const NGAY_MS = 86_400_000;
/** "YYYY-MM-DD" theo giờ Việt Nam — khớp kho.ngayVN. */
const ngayVN = (ms = Date.now()) => new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);
const so = (x, n = 1) => (x == null || !Number.isFinite(Number(x)) ? "—" : Number(x).toFixed(n));
/**
 * Hiển thị/ngày của mốc ban đầu. Phiên tạo trước Task 6 chưa có trường này: chia cho số ngày
 * lịch của cửa sổ (28 ngày lùi + hôm nay = 29) — như kho.taoPhienLeoTop.
 */
const soNgayBanDau = (p) => (p.cuaSoBanDau?.soNgay > 28 ? p.cuaSoBanDau.soNgay : 29);
const hienThiNgayBanDau = (p) => p.hienThiNgay ?? (p.hienThi == null ? null : p.hienThi / soNgayBanDau(p));
const hienThiNgayDoLai = (x) => x.hienThiNgay ?? (x.cuaSoNgay ? x.hienThi / x.cuaSoNgay : null);
/** Nhãn cột trang trong bảng ý × trang. */
const nhanTrang = (t) => (t?.laMinh ? "Mình" : t?.thuTu ? `#${t.thuTu}` : "?");
const tenMienCua = (u) => {
	try {
		return new URL(u).hostname.replace(/^www\./, "");
	} catch {
		return u;
	}
};

function DsChu({ ds, trong = "—" }) {
	if (!ds || ds.length === 0) return <>{trong}</>;
	return (
		<ul style={{ margin: "2px 0", paddingLeft: 18 }}>
			{ds.map((x, i) => (
				<li key={i}>{x}</li>
			))}
		</ul>
	);
}

function PhienLeoTop({ p, onDaSua }) {
	const [ngay, setNgay] = useState(p.ngaySua ?? ngayVN());
	const bd = p.banDo;
	const ph = p.phieu;
	const serpTheoUrl = new Map((p.serp ?? []).map((t) => [t.url, t]));
	// Cột = các trang đã vào bản đồ (đo được + có báo cáo), theo thứ tự hạng; trang mình cuối.
	const cot = (bd?.soHo ?? []).map((h) => ({ url: h.url, t: serpTheoUrl.get(h.url) }));
	const hang = [
		...(bd?.yCotLoi ?? []).map((y) => ({ ten: y.ten, loai: `cốt lõi ${Math.round((y.tiLe ?? 0) * 100)}%`, co: new Set(y.trangCo) })),
		...(bd?.yThua ?? []).map((y) => ({ ten: y.ten, loai: `thừa ${Math.round((y.tiLe ?? 0) * 100)}%`, co: new Set(y.trangCo) })),
		...(ph?.khacBiet ?? []).map((ten) => ({ ten, loai: "khác biệt (chỉ mình có)", co: new Set(cot.filter((c) => c.t?.laMinh).map((c) => c.url)) })),
	];
	const nen = (c) => (c.t?.laMinh ? { background: "#fef3c7", fontWeight: 600 } : {});
	const suaDuoc = p.trangThai === "co_phieu" || p.trangThai === "da_sua";
	return (
		<div style={{ background: "#fafafa", padding: 12, border: "1px solid #e5e5e5" }}>
			{(p.serp ?? []).some((t) => t.trangThai === "loi") && (
				<p style={{ fontSize: 12, color: "#92400e" }}>
					Trang không đo được:{" "}
					{p.serp.filter((t) => t.trangThai === "loi").map((t) => `${nhanTrang(t)} ${tenMienCua(t.url)} (${t.loi})`).join(" · ")}
				</p>
			)}
			{!bd ? (
				<p>Chưa có bản đồ sơ hở — phiên đang ở bước "{NHAN_LEO_TOP[p.trangThai] ?? p.trangThai}".</p>
			) : (
				<>
					<h4>Bảng ý × trang</h4>
					<div style={{ overflowX: "auto" }}>
						<table style={{ borderCollapse: "collapse" }}>
							<thead>
								<tr>
									<th style={o}>Ý</th>
									<th style={o}>Loại</th>
									{cot.map((c) => (
										<th key={c.url} style={{ ...o, ...nen(c) }} title={c.url}>
											<a href={c.url} target="_blank" rel="noopener noreferrer">{nhanTrang(c.t)}</a>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{hang.map((h, i) => (
									<tr key={i}>
										<td style={o}>{h.ten}</td>
										<td style={{ ...o, fontSize: 12, color: "#6b7280" }}>{h.loai}</td>
										{cot.map((c) => (
											<td key={c.url} style={{ ...o, textAlign: "center", ...nen(c) }}>{h.co.has(c.url) ? "✓" : "—"}</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{(bd.ghiChu ?? []).length > 0 && <DsChu ds={bd.ghiChu} />}

					<h4>Sơ hở từng trang</h4>
					<table style={{ borderCollapse: "collapse", width: "100%" }}>
						<thead>
							<tr><th style={o}>Trang</th><th style={o}>Thiếu ý cốt lõi</th><th style={o}>Trải nghiệm</th><th style={o}>Thiếu căn cứ</th></tr>
						</thead>
						<tbody>
							{(bd?.soHo ?? []).map((h, i) => {
								const t = serpTheoUrl.get(h.url);
								return (
									<tr key={i} style={t?.laMinh ? { background: "#fef3c7" } : undefined}>
										<td style={o}>
											{nhanTrang(t)}{" "}
											<a href={h.url} target="_blank" rel="noopener noreferrer">{tenMienCua(h.url)}</a>
										</td>
										<td style={o}><DsChu ds={h.thieuY} /></td>
										<td style={o}><DsChu ds={h.traiNghiem} /></td>
										<td style={o}><DsChu ds={h.thieuCanCu} /></td>
									</tr>
								);
							})}
						</tbody>
					</table>

					<h4>Dấu hiệu người thắng (top 3 đều có, hạng 4–10 phần lớn không)</h4>
					<DsChu ds={bd.dauHieuThang} trong="Chưa đủ trang top 3 và hạng 4–10 để so, hoặc không có đặc điểm nào tách được." />
				</>
			)}

			{ph && (
				<>
					<h4>Phiếu sửa trang của mình</h4>
					<ol style={{ paddingLeft: 20 }}>
						<li><b>Thêm ý cốt lõi còn thiếu:</b> <DsChu ds={ph.themY} trong="không thiếu ý nào" /></li>
						<li><b>Đưa câu trả lời lên đầu bài:</b> {ph.duaTraLoiLenDau ? "Có — top 3 trả lời thẳng ở đầu, trang mình trả lời muộn." : "Không cần."}</li>
						<li><b>Cắt đoạn rườm / ý thừa:</b> <DsChu ds={ph.cat} trong="không có" /></li>
						<li><b>Trải nghiệm đọc:</b> <DsChu ds={ph.traiNghiem} trong="không có sơ hở" /></li>
						<li><b>Tài sản riêng nên đưa vào:</b> <DsChu ds={ph.taiSanRieng} trong="không tìm thấy trong từ điển" /></li>
					</ol>
					<div><b>Ý khác biệt — giữ lại:</b> <DsChu ds={ph.khacBiet} trong="không có" /></div>
					<div><b>Căn cứ cần bổ sung:</b> <DsChu ds={ph.boSungCanCu} trong="không có" /></div>
					{(ph.ghiChu ?? []).length > 0 && (
						<div style={{ color: "#92400e" }}><b>Ghi chú phạm vi Y sỹ:</b> <DsChu ds={ph.ghiChu} /></div>
					)}
				</>
			)}

			{suaDuoc && (
				<p>
					Ngày sửa (giờ Việt Nam):{" "}
					<input type="date" value={ngay} max={ngayVN()} onChange={(e) => setNgay(e.target.value)} />{" "}
					<Nut chinh={p.trangThai !== "da_sua"} onClick={() => { if (p.trangThai === "da_sua" && (p.doLai ?? []).length > 0 && !window.confirm("Đổi ngày sửa sẽ xoá các lần đo lại đã có. Tiếp tục?")) return; onDaSua(p.id, ngay); }}>{p.trangThai === "da_sua" ? "Đổi ngày sửa" : "Đã sửa theo phiếu"}</Nut>
					{p.trangThai === "da_sua" && <span style={{ fontSize: 12, color: "#92400e" }}> · đổi ngày sẽ xoá các lần đo lại đã có</span>}
				</p>
			)}

			{(p.trangThai === "da_sua" || p.trangThai === "xong") && (
				<>
					<h4>Đo lại hạng (sửa ngày {p.ngaySua})</h4>
					<table style={{ borderCollapse: "collapse" }}>
						<thead>
							<tr><th style={o}>Mốc</th><th style={o}>Ngày đo</th><th style={o}>Hạng: trước → sau</th><th style={o}>Hiển thị/ngày: trước → sau</th><th style={o}>Cửa sổ</th></tr>
						</thead>
						<tbody>
							{MOC_DO_LAI.map((m) => {
								const x = (p.doLai ?? []).find((d) => d.sauNgay === m);
								return (
									<tr key={m}>
										<td style={o}>+{m} ngày</td>
										{x ? (
											<>
												<td style={o}>{x.ngay}</td>
												<td style={o}>{so(p.viTriBanDau)} → {x.viTri == null ? "không có số liệu" : so(x.viTri)}</td>
												<td style={o}>{so(hienThiNgayBanDau(p), 2)} → {so(hienThiNgayDoLai(x), 2)}</td>
												<td style={{ ...o, fontSize: 12, color: "#6b7280" }}>
													{soNgayBanDau(p)} ngày → {x.cuaSoNgay ?? "?"} ngày
												</td>
											</>
										) : (
											<td style={{ ...o, color: "#6b7280" }} colSpan={4}>chưa tới hạn hoặc ca đêm chưa đo</td>
										)}
									</tr>
								);
							})}
						</tbody>
					</table>
					<p style={{ fontSize: 12, color: "#666" }}>
						Cửa sổ ban đầu và cửa sổ đo lại dài khác nhau, nên chỉ so hạng bình quân và hiển thị MỖI NGÀY — không so tổng hiển thị.
					</p>
					<p style={{ fontSize: 12, color: "#92400e" }}>
						Hiển thị/ngày tăng giảm còn do cả trang web lớn lên hay mùa vụ — đọc cùng hạng, đừng coi riêng số này là kết quả của bản sửa.
					</p>
				</>
			)}
		</div>
	);
}

function LeoTopTab({ dl, loi, onDaSua, onTai }) {
	const [mo, setMo] = useState(null);
	if (!dl) return <div style={{ padding: 24 }}>{loi || "Đang tải…"}</div>;
	const phien = dl.phien ?? [];
	const now = Date.now();
	const choSua = phien
		.filter((p) => p.trangThai === "co_phieu")
		.map((p) => {
			const t = Date.parse(p.soHoLuc ?? p.taoLuc);
			return { p, tuoi: Number.isFinite(t) ? Math.floor((now - t) / NGAY_MS) : null };
		});
	return (
		<div>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			{!dl.gscCoCauHinh && (
				<p style={{ color: "#92400e" }}>
					Plugin chưa cấu hình Search Console (biến GSC_OAUTH_* trong cms/.env): không lấy được từ khoá mới và ca đêm không đo lại hạng.
				</p>
			)}
			{choSua.length > 0 && (
				<div style={{ border: "1px solid #f59e0b", background: "#fffbeb", padding: 8, marginBottom: 12 }}>
					<b>{choSua.length} phiếu chờ bấm "Đã sửa theo phiếu":</b>
					<ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
						{choSua.map(({ p, tuoi }) => (
							<li key={p.id}>
								{p.tuKhoa} — ra phiếu {tuoi == null ? "?" : `${tuoi} ngày trước`}
								{tuoi != null && tuoi >= NGAY_PHIEU_TINH_TRAN && " (quá 30 ngày: không còn giữ chỗ trong trần 10 phiên mở, vẫn bấm đã sửa được)"}
							</li>
						))}
					</ul>
				</div>
			)}
			<h2>
				Phiên leo top ({phien.length}) <Nut onClick={onTai}>Tải lại</Nut>
			</h2>
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr><th style={o}>Từ khoá</th><th style={o}>Trang của mình</th><th style={o}>Hạng ban đầu</th><th style={o}>Hiển thị/ngày</th><th style={o}>Trạng thái</th><th style={o}>Tạo lúc</th></tr>
				</thead>
				<tbody>
					{phien.map((p) => (
						<Fragment key={p.id}>
							<tr style={{ opacity: p.trangThai === "bo" ? 0.5 : 1 }}>
								<td style={o}>
									{/* tuKhoa là chữ người lạ gõ vào Google — chỉ hiển thị qua JSX text. */}
									<Nut onClick={() => setMo(mo === p.id ? null : p.id)}>{mo === p.id ? "▾" : "▸"} {p.tuKhoa}</Nut>
									{(p.tuKhoaPhu ?? []).length > 0 && (
										<div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
											Từ khoá khác của trang này:{" "}
											{p.tuKhoaPhu.map((x) => `${x.tuKhoa} (hạng ${so(x.viTri)}, ${x.hienThi} hiển thị)`).join(" · ")}
										</div>
									)}
								</td>
								<td style={o}>
									<a href={p.trangMinh} target="_blank" rel="noopener noreferrer">{p.trangMinh}</a>
								</td>
								<td style={o}>{so(p.viTriBanDau)}</td>
								<td style={o}>{so(hienThiNgayBanDau(p), 2)}</td>
								<td style={o}>
									{NHAN_LEO_TOP[p.trangThai] ?? p.trangThai}
									{p.ngaySua && ` · sửa ${p.ngaySua}`}
								</td>
								<td style={o}>{gio(p.taoLuc)}</td>
							</tr>
							{mo === p.id && (
								<tr>
									<td colSpan={6} style={o}>
										<PhienLeoTop p={p} onDaSua={onDaSua} />
									</td>
								</tr>
							)}
						</Fragment>
					))}
				</tbody>
			</table>
			{phien.length === 0 && <p>Chưa có phiên nào — routine thứ Tư sẽ lấy từ khoá hạng 4–50 từ Search Console.</p>}
		</div>
	);
}

// ---- Tab "Nháp" (2C-3): bài lò viết đã tạo, chờ người duyệt ----
const NHAN_NHAP = { cho_duyet: "Chờ duyệt", da_dang: "Đã đăng" };

/** Phiếu tóm tắt do máy chủ tính (viet/dang.mjs tomTatPhieu) — chỉ con số, không lời khuyên độ dài. */
function PhieuTomTat({ t }) {
	if (!t) return "—";
	return (
		<div style={{ fontSize: 12 }}>
			<div>
				SEO {t.seo} · {t.soTu == null ? "?" : t.soTu} từ · YMYL {t.ymyl} · nguồn bỏ {t.nguonBo} · link gỡ {t.linkGo} · ảnh bìa: {t.anh ?? "không"}
			</div>
			{(t.seoTruot ?? []).length > 0 && <div style={{ color: "#92400e" }}>SEO chưa đạt: {t.seoTruot.join("; ")}</div>}
			{(t.canhBao ?? []).length > 0 && <div style={{ color: "#92400e" }}>Cảnh báo: {t.canhBao.join("; ")}</div>}
			{t.loiCapNhat && <div style={{ color: "#b91c1c" }}>{t.loiCapNhat}</div>}
			{t.khoiPhuc && <div style={{ color: "#6b7280" }}>{t.khoiPhuc}</div>}
		</div>
	);
}

function NhapTab({ dl, loi, onTai }) {
	if (!dl) return <div style={{ padding: 24 }}>{loi || "Đang tải…"}</div>;
	const nhap = dl.nhap ?? [];
	const moCoi = dl.moCoi ?? [];
	return (
		<div>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			<div style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 14px", margin: "8px 0 16px", background: "#f9fafb" }}>
				Bài máy viết luôn là <b>nháp</b>: đọc, sửa trong trình soạn rồi tự bấm Publish. Khung "Phiếu Rada" ở cột phải trình
				soạn có phiếu đầy đủ. Publish bị chặn nếu còn chữ vượt phạm vi Y sỹ hoặc ảnh hỏng.
				<br />
				<b>Lưu ý:</b> bài đã Publish nằm trong CMS; trang /blog/ công khai chưa đọc từ CMS cho tới kế hoạch 3.
			</div>
			<h2>
				Nháp của lò viết ({nhap.length}) <Nut onClick={onTai}>Tải lại</Nut>
			</h2>
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr><th style={o}>Tiêu đề</th><th style={o}>Bài dự kiến</th><th style={o}>Ngày tạo</th><th style={o}>Trạng thái</th><th style={o}>Phiếu</th></tr>
				</thead>
				<tbody>
					{nhap.map((n) => (
						<tr key={n.id}>
							<td style={o}>
								{/* tieuDe là chữ máy viết — chỉ hiển thị qua JSX text. */}
								<a href={n.adminUrl}>{n.tieuDe || n.slug || n.id}</a>
								<div style={{ fontSize: 12, color: "#6b7280" }}>/{n.slug}</div>
							</td>
							<td style={o}>
								{n.tenKeHoach || n.keHoachId}
								{n.trangThaiKeHoach && <div style={{ fontSize: 12, color: "#6b7280" }}>{NHAN_KE_HOACH[n.trangThaiKeHoach] ?? n.trangThaiKeHoach}</div>}
							</td>
							<td style={o}>{gio(n.taoLuc)}</td>
							<td style={o}>
								{NHAN_NHAP[n.trangThai] ?? n.trangThai}
								{n.dangLuc && <div style={{ fontSize: 12, color: "#6b7280" }}>{gio(n.dangLuc)}</div>}
							</td>
							<td style={o}>
								<PhieuTomTat t={n.tomTat} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{nhap.length === 0 && <p>Chưa có nháp nào — routine viết đêm sẽ lấy các bài dự kiến đã duyệt ở tab Kế hoạch.</p>}
			{moCoi.length > 0 && (
				<>
					<h2>Nháp của bài "Cần xem lại" ({moCoi.length})</h2>
					<p style={{ fontSize: 13, color: "#6b7280" }}>
						Lò viết đã tạo nháp trong CMS nhưng chưa ghi sổ xong thì bài dự kiến chuyển sang "Cần xem lại". Mở nháp để xem, rồi
						Publish hoặc xoá trong CMS; xử lý bài dự kiến ở tab Kế hoạch.
					</p>
					<table style={{ borderCollapse: "collapse", width: "100%" }}>
						<thead>
							<tr><th style={o}>Bài dự kiến</th><th style={o}>Nháp</th><th style={o}>Lý do</th></tr>
						</thead>
						<tbody>
							{moCoi.map((k) => (
								<tr key={k.id}>
									<td style={o}>{k.tenKeHoach || k.id}</td>
									<td style={o}>
										<a href={k.adminUrl}>{k.slug ? `/${k.slug}` : k.contentId}</a>
									</td>
									<td style={{ ...o, fontSize: 12, color: "#92400e" }}>
										{k.lyDoCanXem}
										{(k.loiCuoi ?? []).length > 0 && (
											<ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
												{k.loiCuoi.map((l, i) => (
													<li key={i}>{l}</li>
												))}
											</ul>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}
		</div>
	);
}

function RadaSeo() {
	const [dl, setDl] = useState(null);
	const [loi, setLoi] = useState("");
	const [form, setForm] = useState({ tenMien: "", ten: "", laCuaMinh: false });
	const [tab, setTab] = useState(tabDaLuu);
	const [clDl, setClDl] = useState(null);
	const [cLoi, setCLoi] = useState("");
	const [ltDl, setLtDl] = useState(null);
	const [ltLoi, setLtLoi] = useState("");
	const [thongBao, setThongBao] = useState("");
	const [nhDl, setNhDl] = useState(null);
	const [nhLoi, setNhLoi] = useState("");

	const tai = useCallback(() => goi("tong-quan").then((d) => { setDl(d); setLoi(""); }, (e) => setLoi(e.message)), []);
	const taiCL = useCallback(() => goi("chien-luoc-tong-quan").then((d) => { setClDl(d); setCLoi(""); }, (e) => setCLoi(e.message)), []);
	const taiLT = useCallback(() => goi("leo-top-tong-quan").then((d) => { setLtDl(d); setLtLoi(""); }, (e) => setLtLoi(e.message)), []);
	const taiNh = useCallback(() => goi("nhap-tong-quan").then((d) => { setNhDl(d); setNhLoi(""); }, (e) => setNhLoi(e.message)), []);
	useEffect(() => {
		tai();
		taiCL();
		taiLT();
		taiNh();
	}, [tai, taiCL, taiLT, taiNh]);
	const lam = (route, body) => goi(route, body).then(tai, (e) => setLoi(e.message));
	const lamCL = (route, body) => goi(route, body).then(taiCL, (e) => setCLoi(e.message));

	const doiTab = (t) => {
		setTab(t);
		luuTab(t);
	};

	if (!dl && !clDl && tab === "radar") return <div style={{ padding: 24 }}>{loi || "Đang tải…"}</div>;
	const lichRadar = dl?.lich?.find((l) => l.name === "radar");
	return (
		<div style={{ padding: 24, maxWidth: 1200 }}>
			<h1>Rada SEO</h1>
			<p>
				{TABS.map((t) => (
					<Nut key={t.key} dangChon={tab === t.key} onClick={() => doiTab(t.key)} style={{ marginRight: 8 }}>
						{t.label}
					</Nut>
				))}
			</p>

			{tab === "radar" &&
				(!dl ? (
					<div>{loi || "Đang tải…"}</div>
				) : (
					<>
						<OTinhTrang ds={dl.tinhTrang} />
						{thongBao && <p style={{ color: "#15803d", fontWeight: 600 }}>{thongBao}</p>}
						{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
						{dl.canhBaoCaDem && <p style={{ color: "#b91c1c", fontWeight: 600 }}>⚠ Hơn 26 giờ chưa có ca radar thành công — xem nhật ký bên dưới.</p>}
						{dl.canhBaoClaude && (
							<p style={{ color: "#b91c1c", fontWeight: 600 }}>
								⚠ {dl.choAi} trang chờ Claude đọc mà 26 giờ qua Claude chưa đọc trang nào — khả năng: routine
								không chạy (xem lịch sử chạy ở claude.ai/code/routines), khoá RADA_SEO_MCP_TOKEN sai/thu hồi/hết
								hạn, hoặc môi trường routine chặn mạng tới kinhlac.online.
							</p>
						)}
						{!dl.caDemBat && <p style={{ color: "#92400e" }}>Máy này không bật RADA_SEO_CA_DEM: chỉ chạy thử được, ca đêm thật chạy trên VPS.</p>}
						<p>
							{/* Cron dò MỖI GIỜ và chỉ chạy ca ở tick 19:30 UTC (xem LICH_RADAR) → nextRunAt là tick kế, không phải ca kế. */}
							Lịch đêm: {lichRadar ? `02:30 hằng ngày (cron dò mỗi giờ) · tick kế ${gio(lichRadar.nextRunAt)} · tick trước ${gio(lichRadar.lastRunAt)}` : "chưa bật"}{" "}
							<Nut chinh={!lichRadar} onClick={() => lam("lich-bat")}>{lichRadar ? "Hẹn lại" : "Bật lịch"}</Nut>{" "}
							<Nut disabled={dl.dangChay} onClick={() => lam("ca-chay", { ghi: false }).then(() => setTimeout(tai, 2000))}>Chạy thử</Nut>{" "}
							<Nut chinh disabled={dl.dangChay || !dl.caDemBat} onClick={() => lam("ca-chay", { ghi: true }).then(() => setTimeout(tai, 2000))}>Chạy thật</Nut>{" "}
							{dl.dangChay && "· đang chạy…"} <Nut onClick={tai}>Tải lại</Nut>
						</p>

						<h2>Đối thủ</h2>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								goi("doi-thu-luu", form).then(
									(r) => {
										setForm({ tenMien: "", ten: "", laCuaMinh: false });
										setThongBao(r?.caDauTien ? "Đã bắt đầu ca radar đầu tiên — vài phút nữa bấm “Tải lại”." : "");
										tai();
										// Ca đầu vừa thả chạy nền: tải lại sau chốc lát để thấy "đang chạy".
										if (r?.caDauTien) setTimeout(tai, 2000);
									},
									(e) => setLoi(e.message),
								);
							}}
						>
							<input placeholder="tên miền, vd vinmec.com" value={form.tenMien} onChange={(e) => setForm({ ...form, tenMien: e.target.value })} />{" "}
							<input placeholder="tên hiển thị" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />{" "}
							<label>
								<input type="checkbox" checked={form.laCuaMinh} onChange={(e) => setForm({ ...form, laCuaMinh: e.target.checked })} /> site của mình
							</label>{" "}
							<Nut chinh type="submit">Lưu</Nut>
						</form>
						<table style={{ borderCollapse: "collapse", width: "100%", marginTop: 8 }}>
							<thead>
								<tr><th style={o}>Tên miền</th><th style={o}>Chờ trích</th><th style={o}>Chờ Claude đọc</th><th style={o}>Đã phân tích</th><th style={o}>Ngoài ngành</th><th style={o}>Lỗi</th><th style={o}></th></tr>
							</thead>
							<tbody>
								{dl.doiThu.map((d) => (
									<tr key={d.id}>
										<td style={o}>{d.ten} {d.laCuaMinh && <b>(của mình)</b>}</td>
										<td style={o}>{d.dem.cho}</td><td style={o}>{d.dem.cho_ai}</td><td style={o}>{d.dem.da_phan_tich}</td><td style={o}>{d.dem.ngoai_nganh}</td><td style={o}>{d.dem.loi}</td>
										<td style={o}>
												{d.dem.loi > 0 && <Nut onClick={() => lam("url-dat-lai", { tenMien: d.id })}>Thử lại URL lỗi</Nut>}{" "}
												<Nut onClick={() => confirm(`Xoá ${d.id} và mọi URL của nó?`) && lam("doi-thu-xoa", { tenMien: d.id })}>Xoá</Nut>
											</td>
									</tr>
								))}
							</tbody>
						</table>

						<h2>Khoảng trống ({dl.cum.length})</h2>
						<table style={{ borderCollapse: "collapse", width: "100%" }}>
							<thead>
								<tr><th style={o}>Điểm</th><th style={o}>Cụm chủ đề</th><th style={o}>Từ khoá</th><th style={o}>Đối thủ / bài</th><th style={o}>Trạng thái</th><th style={o}></th></tr>
							</thead>
							<tbody>
								{dl.cum.map((c) => (
									<tr key={c.id} style={{ opacity: c.trangThai === "bo_qua" ? 0.5 : 1 }}>
										<td style={o}>{c.diem}{c.coXuHuong && " 📈"}{c.viPham && " ⚠"}</td>
										<td style={o}>{c.tenCum}</td>
										<td style={o}>{(c.tuKhoa ?? []).join(", ")}</td>
										<td style={o}>{c.soDoiThu} / {c.soBai}</td>
										<td style={o}>{NHAN_CUM[c.trangThai] ?? c.trangThai}</td>
										<td style={o}>
											{c.trangThai === "cho_viet" && <Nut onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "bo_qua" })}>Bỏ qua</Nut>}
											{c.trangThai === "bo_qua" && <Nut onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "cho_viet" })}>Khôi phục</Nut>}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<p style={{ fontSize: 12, color: "#666" }}>📈 trúng xu hướng tìm kiếm · ⚠ nghiêng chữa trị / hứa kết quả (bị trừ điểm)</p>

						<h2>Nhật ký ca</h2>
						<table style={{ borderCollapse: "collapse", width: "100%" }}>
							<thead>
								<tr><th style={o}>Bắt đầu</th><th style={o}>Ca</th><th style={o}>URL mới</th><th style={o}>Trích / Claude đọc</th><th style={o}>Ngoài ngành</th><th style={o}>Cụm</th><th style={o}>Đo lại leo top</th><th style={o}>Lỗi</th><th style={o}>Thông tin</th></tr>
							</thead>
							<tbody>
								{dl.ca.map((c) => (
									<tr key={c.batDau}>
										<td style={o}>{gio(c.batDau)}</td><td style={o}>{c.loai === "claude" ? "Claude đọc" : c.ghi ? "radar" : "radar (thử)"}</td>
										<td style={o}>{c.soUrlMoi ?? "—"}</td><td style={o}>{c.loai === "claude" ? c.soDoc : c.soTrich ?? "—"}</td><td style={o}>{c.soNgoaiNganh ?? "—"}</td>
										<td style={o}>{c.soCum ?? "—"}</td>
										<td style={o}>{c.soDoLai ?? "—"}</td>
										<td style={{ ...o, color: "#b91c1c" }}>{(c.loi ?? []).join(" · ")}</td>
										{/* thongTin: điều ca cố ý bỏ qua (vd chưa cấu hình Search Console) — không phải lỗi. */}
										<td style={{ ...o, color: "#6b7280" }}>{(c.thongTin ?? []).join(" · ")}</td>
									</tr>
								))}
							</tbody>
						</table>
					</>
				))}

			{tab === "huong" && (
				<HuongTab
					dl={clDl}
					loi={cLoi}
					onNhan={(id, trongSo) => lamCL("huong-dat", { id, trangThai: "da_nhan", trongSo })}
					onBo={(id, lyDo) => lamCL("huong-dat", { id, trangThai: "bo_qua", lyDoBo: lyDo })}
					onKhoiPhuc={(id) => lamCL("huong-dat", { id, trangThai: "de_xuat" })}
				/>
			)}

			{tab === "ke-hoach" && (
				<KeHoachTab
					dl={clDl}
					loi={cLoi}
					onDuyet={(id) => lamCL("ke-hoach-dat", { id, trangThai: "da_duyet" })}
					onBo={(id, lyDo) => lamCL("ke-hoach-dat", { id, trangThai: "bo_qua", lyDoBo: lyDo })}
				/>
			)}

			{tab === "leo-top" && (
				<LeoTopTab
					dl={ltDl}
					loi={ltLoi}
					onTai={taiLT}
					onDaSua={(id, ngay) => goi("leo-top-da-sua", { id, ngay }).then(taiLT, (e) => setLtLoi(e.message))}
				/>
			)}

			{tab === "nhap" && <NhapTab dl={nhDl} loi={nhLoi} onTai={taiNh} />}
		</div>
	);
}

export const pages = { "/rada": RadaSeo };
