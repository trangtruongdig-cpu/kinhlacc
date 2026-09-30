// Màn điều khiển Rada SEO trong /_emdash/admin/plugins/rada-seo/rada.
// Chỉ HIỂN THỊ và gọi route của plugin; mọi luật nằm phía máy chủ.
import { useCallback, useEffect, useState } from "react";

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

// ---- Thanh tab (2C-2) ----
const TABS = [
	{ key: "radar", label: "Radar" },
	{ key: "huong", label: "Hướng nội dung" },
	{ key: "ke-hoach", label: "Kế hoạch" },
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
const NHAN_KE_HOACH = { de_xuat: "Chờ duyệt", da_duyet: "Đã duyệt", bo_qua: "Đã bỏ", dang_viet: "Đang viết", co_nhap: "Có nháp", da_dang: "Đã đăng" };
const NHAN_Y_DINH = { tra_cuu: "Tra cứu", tim_hieu: "Tìm hiểu", so_sanh: "So sánh", huong_dan: "Hướng dẫn" };
/** Chỉ ba trạng thái này màn duyệt được đặt (xem KE_HOACH_MAN_DUYET ở plugin.mjs); phần còn lại là việc của lò viết. */
const KE_HOACH_SUA_DUOC = new Set(["de_xuat", "da_duyet", "bo_qua"]);

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
					<button onClick={() => setMoRong(!moRong)}>{moRong ? "▾" : "▸"} {h.ten}</button>
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
					<button onClick={() => onNhan(h.id, trongSo)}>Nhận</button>{" "}
					<input placeholder="lý do bỏ (bắt buộc)" value={lyDo} onChange={(e) => setLyDo(e.target.value)} style={{ width: 150 }} />{" "}
					<button disabled={!lyDo.trim()} onClick={() => onBo(h.id, lyDo)}>Bỏ</button>{" "}
					{h.trangThai !== "de_xuat" && <button onClick={() => onKhoiPhuc(h.id)}>Khôi phục</button>}
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
					<button onClick={() => setMoRong(!moRong)}>{moRong ? "▾" : "▸"} {k.tieuDeLamViec}</button>
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
									⚠ gần giống: {t.tieuDe} (độ giống {Number(t.doGiong).toFixed(2)})
								</li>
							))}
						</ul>
					)}
				</td>
				<td style={o}>
					{NHAN_KE_HOACH[k.trangThai] ?? k.trangThai}
					{k.trangThai === "bo_qua" && k.lyDoBo ? ` — ${k.lyDoBo}` : ""}
				</td>
				<td style={o}>
					{suaDuoc ? (
						<>
							{k.trangThai !== "da_duyet" && <button onClick={() => onDuyet(k.id)}>Duyệt</button>}{" "}
							<input placeholder="lý do bỏ (bắt buộc)" value={lyDo} onChange={(e) => setLyDo(e.target.value)} style={{ width: 130 }} />{" "}
							{k.trangThai !== "bo_qua" && <button disabled={!lyDo.trim()} onClick={() => onBo(k.id, lyDo)}>Bỏ</button>}
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
	for (const k of items) {
		const hId = k.huongId ?? cumById.get(k.cumId)?.huongId ?? "?";
		if (!theoHuong.has(hId)) theoHuong.set(hId, new Map());
		const theoCum = theoHuong.get(hId);
		if (!theoCum.has(k.cumId)) theoCum.set(k.cumId, []);
		theoCum.get(k.cumId).push(k);
	}
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
						</div>
						);
					})}
				</div>
			))}
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

	const tai = useCallback(() => goi("tong-quan").then((d) => { setDl(d); setLoi(""); }, (e) => setLoi(e.message)), []);
	const taiCL = useCallback(() => goi("chien-luoc-tong-quan").then((d) => { setClDl(d); setCLoi(""); }, (e) => setCLoi(e.message)), []);
	useEffect(() => {
		tai();
		taiCL();
	}, [tai, taiCL]);
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
					<button
						key={t.key}
						onClick={() => doiTab(t.key)}
						disabled={tab === t.key}
						style={{ marginRight: 8, fontWeight: tab === t.key ? 700 : 400 }}
					>
						{t.label}
					</button>
				))}
			</p>

			{tab === "radar" &&
				(!dl ? (
					<div>{loi || "Đang tải…"}</div>
				) : (
					<>
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
							<button onClick={() => lam("lich-bat")}>{lichRadar ? "Hẹn lại" : "Bật lịch"}</button>{" "}
							<button disabled={dl.dangChay} onClick={() => lam("ca-chay", { ghi: false }).then(() => setTimeout(tai, 2000))}>Chạy thử</button>{" "}
							<button disabled={dl.dangChay || !dl.caDemBat} onClick={() => lam("ca-chay", { ghi: true }).then(() => setTimeout(tai, 2000))}>Chạy thật</button>{" "}
							{dl.dangChay && "· đang chạy…"} <button onClick={tai}>Tải lại</button>
						</p>

						<h2>Đối thủ</h2>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								lam("doi-thu-luu", form).then(() => setForm({ tenMien: "", ten: "", laCuaMinh: false }));
							}}
						>
							<input placeholder="tên miền, vd vinmec.com" value={form.tenMien} onChange={(e) => setForm({ ...form, tenMien: e.target.value })} />{" "}
							<input placeholder="tên hiển thị" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />{" "}
							<label>
								<input type="checkbox" checked={form.laCuaMinh} onChange={(e) => setForm({ ...form, laCuaMinh: e.target.checked })} /> site của mình
							</label>{" "}
							<button type="submit">Lưu</button>
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
												{d.dem.loi > 0 && <button onClick={() => lam("url-dat-lai", { tenMien: d.id })}>Thử lại URL lỗi</button>}{" "}
												<button onClick={() => confirm(`Xoá ${d.id} và mọi URL của nó?`) && lam("doi-thu-xoa", { tenMien: d.id })}>Xoá</button>
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
											{c.trangThai === "cho_viet" && <button onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "bo_qua" })}>Bỏ qua</button>}
											{c.trangThai === "bo_qua" && <button onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "cho_viet" })}>Khôi phục</button>}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<p style={{ fontSize: 12, color: "#666" }}>📈 trúng xu hướng tìm kiếm · ⚠ nghiêng chữa trị / hứa kết quả (bị trừ điểm)</p>

						<h2>Nhật ký ca</h2>
						<table style={{ borderCollapse: "collapse", width: "100%" }}>
							<thead>
								<tr><th style={o}>Bắt đầu</th><th style={o}>Ca</th><th style={o}>URL mới</th><th style={o}>Trích / Claude đọc</th><th style={o}>Ngoài ngành</th><th style={o}>Cụm</th><th style={o}>Lỗi</th></tr>
							</thead>
							<tbody>
								{dl.ca.map((c) => (
									<tr key={c.batDau}>
										<td style={o}>{gio(c.batDau)}</td><td style={o}>{c.loai === "claude" ? "Claude đọc" : c.ghi ? "radar" : "radar (thử)"}</td>
										<td style={o}>{c.soUrlMoi ?? "—"}</td><td style={o}>{c.loai === "claude" ? c.soDoc : c.soTrich ?? "—"}</td><td style={o}>{c.soNgoaiNganh ?? "—"}</td>
										<td style={o}>{c.soCum ?? "—"}</td>
										<td style={{ ...o, color: "#b91c1c" }}>{(c.loi ?? []).join(" · ")}</td>
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
		</div>
	);
}

export const pages = { "/rada": RadaSeo };
