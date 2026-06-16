/**
 * Engine phân tích bài thuốc (thuần TS, không phụ thuộc TypeORM) — NGUỒN SỰ THẬT DUY NHẤT.
 *
 * Port từ logic client cũ (frontend/src/components/BaiThuocAnalysis.vue) để mọi endpoint
 * dùng chung. Frontend chỉ còn render kết quả.
 */

// ───────────────────────── Hằng số quy kinh / ngũ vị ─────────────────────────
export const YHCT_KINH_ORDER = [
  'Tâm', 'Can', 'Tỳ', 'Phế', 'Thận', 'Tâm Bào',
  'Đại Trường', 'Tiểu Trường', 'Bàng Quang', 'Đởm', 'Vị', 'Tam Tiêu',
] as const;

const YHCT_KINH_ALIAS: Record<string, string> = {
  tam: 'Tâm', tâm: 'Tâm', can: 'Can', ty: 'Tỳ', tỳ: 'Tỳ',
  phe: 'Phế', phế: 'Phế', than: 'Thận', thận: 'Thận',
  tambao: 'Tâm Bào', 'tâm bào': 'Tâm Bào', 'tam bao': 'Tâm Bào',
  daitrang: 'Đại Trường', 'đại trường': 'Đại Trường', 'dai truong': 'Đại Trường',
  tieutruong: 'Tiểu Trường', 'tiểu trường': 'Tiểu Trường', 'tieu truong': 'Tiểu Trường',
  bangquang: 'Bàng Quang', 'bàng quang': 'Bàng Quang', 'bang quang': 'Bàng Quang',
  dam: 'Đởm', đởm: 'Đởm', vi: 'Vị', vị: 'Vị',
  tamtieu: 'Tam Tiêu', 'tam tiêu': 'Tam Tiêu',
};

export function normalizeKinh(raw: string): string {
  const s = (raw || '').trim();
  return YHCT_KINH_ALIAS[s.toLowerCase()] ?? s;
}

// Ưu tiên khớp tên dài trước ("Tâm Bào" trước "Tâm") để tránh nhận nhầm.
const YHCT_KINH_BY_LEN = [...YHCT_KINH_ORDER].sort((a, b) => b.length - a.length);

/** Rút gọn chuỗi quy kinh đầy đủ ("Thủ Thiếu Âm Tâm, Túc Thiếu Âm Thận") về tạng/phủ ("Tâm, Thận"). */
export function shortKinh(raw: string | null | undefined): string {
  const out: string[] = [];
  for (const part of String(raw || '').split(/[,;，、]/).map((s) => s.trim()).filter(Boolean)) {
    const norm = normalizeKinh(part);
    if ((YHCT_KINH_ORDER as readonly string[]).includes(norm)) out.push(norm);
    else out.push(YHCT_KINH_BY_LEN.find((ref) => norm.includes(ref)) ?? part);
  }
  return [...new Set(out)].join(', ');
}

export const ROLE_COLORS: Record<string, string> = {
  Quân: '#DC2626', Thần: '#F97316', Tá: '#16A34A', Sứ: '#2563EB',
};

type Role = 'Quân' | 'Thần' | 'Tá' | 'Sứ';
/** Trọng số đóng góp công năng theo vai trò (Quân nặng nhất → Sứ nhẹ nhất). */
const ROLE_WEIGHT: Record<Role, number> = { Quân: 1.5, Thần: 1.2, Tá: 1, Sứ: 0.8 };

/** Chuẩn hoá vai trò người nhập về Quân/Thần/Tá/Sứ (null nếu không nhận diện được). */
export function normalizeRole(raw: string | null | undefined): Role | null {
  const t = (raw || '').trim().toLowerCase();
  if (!t) return null;
  if (t.includes('quân') || t === 'quan') return 'Quân';
  if (t.includes('thần') || t === 'than') return 'Thần';
  if (t.includes('sứ') || t === 'su') return 'Sứ';
  if (t.includes('tá') || t === 'ta') return 'Tá';
  return null;
}

// ───────────────────────── Liều lượng → gram ─────────────────────────
export function parseLieuToGram(s: string | null | undefined): number {
  if (!s) return 9;
  const t = s.toString().trim().toLowerCase().replace(',', '.');
  if (t === '*') return 2.25;
  if (t === '#') return 22.5;
  let m: RegExpMatchArray | null;
  // "bán" / "nửa" = 1/2 vị (vd "bán tiền" = 0.5 tiền = 1.5g, "bán lượng" = 0.5 lượng = 15g).
  const qty = (raw: string) => (raw === 'bán' || raw === 'nửa' ? 0.5 : parseFloat(raw));
  m = t.match(/^(bán|nửa|[\d.]+)\s*(?:lượng|lạng)\b/); if (m && m[1]) return qty(m[1]) * 30;
  m = t.match(/^(bán|nửa|[\d.]+)\s*(?:tiền|chỉ)\b/); if (m && m[1]) return qty(m[1]) * 3;
  m = t.match(/^([\d.]+)/); if (m && m[1]) return parseFloat(m[1]);
  return 9;
}

// ───────────────────────── Ngũ vị ─────────────────────────
type NguViKey = 'chua' | 'dang' | 'ngot' | 'cay' | 'man';

export function classifyVi(v: string): NguViKey | null {
  const s = v.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('chua') || s.includes('toan')) return 'chua';
  if (s.includes('đắng') || s.includes('dang') || s.includes('khổ') || s.includes('kho')) return 'dang';
  if (s.includes('ngọt') || s.includes('ngot') || s.includes('cam')) return 'ngot';
  if (s.includes('cay') || s.includes('tân') || s.includes('tan')) return 'cay';
  if (s.includes('mặn') || s.includes('man') || s.includes('hàm') || s.includes('ham')) return 'man';
  return null;
}

function addNguViBucket(
  bucket: { chua: number; dang: number; ngot: number; cay: number; man: number },
  viRaw: string,
  wPct: number,
) {
  const parts = String(viRaw || '').split(/[,;，、]/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return;
  const uniq = [...new Set(parts.map((s) => s.toLowerCase()))];
  const keys: NguViKey[] = [];
  for (const v of uniq) {
    const k = classifyVi(v);
    if (k) keys.push(k);
  }
  if (!keys.length) return;
  const each = wPct / keys.length;
  for (const k of keys) bucket[k] += each;
}

// ───────────────────────── Thăng-Giáng-Phù-Trầm ─────────────────────────
function addTgptBucket(
  bucket: { thang: number; phu: number; giang: number; tram: number },
  item: { tinh: string; quy_kinh: string },
  wPct: number,
) {
  const tinh = (item.tinh || '').toLowerCase();
  const qk = (item.quy_kinh || '').toLowerCase();
  if (tinh.includes('ôn') || tinh.includes('on') || tinh.includes('nóng') || tinh.includes('nong')) {
    bucket.thang += wPct * 0.35; bucket.phu += wPct * 0.35;
  }
  if (tinh.includes('hàn') || tinh.includes('han') || tinh.includes('lương') || tinh.includes('luong')) {
    bucket.giang += wPct * 0.35; bucket.tram += wPct * 0.35;
  }
  if (qk.includes('phế') || qk.includes('phe') || qk.includes('tâm')) bucket.thang += wPct * 0.15;
  if (qk.includes('thận') || qk.includes('than') || qk.includes('bàng quang') || qk.includes('bang quang')) bucket.tram += wPct * 0.15;
  const base = wPct * 0.15;
  bucket.thang += base; bucket.giang += base; bucket.phu += base; bucket.tram += base;
}

// ───────────────────────── Tứ khí ─────────────────────────
function addTuKhi(
  tuKhi: { daiHan: number; han: number; luong: number; binh: number; on: number; nhiet: number; daiNhiet: number },
  tinhRaw: string,
  wPct: number,
) {
  const t = (tinhRaw || '').trim().toLowerCase();
  if (!t) return;
  if (t.includes('đại hàn') || t.includes('dai han')) { tuKhi.daiHan += wPct; return; }
  if (t.includes('hơi hàn') || t.includes('hoi han')) { tuKhi.han += wPct * 0.7; tuKhi.luong += wPct * 0.3; return; }
  if (t.includes('hàn') || t.includes('han')) { tuKhi.han += wPct; return; }
  if (t.includes('lương') || t.includes('luong')) { tuKhi.luong += wPct; return; }
  if (t.includes('bình') || t.includes('binh')) { tuKhi.binh += wPct; return; }
  if (t.includes('đại nhiệt') || t.includes('dai nhiet')) { tuKhi.daiNhiet += wPct; return; }
  if (t.includes('nhiệt') || t.includes('nhiet') || t.includes('nóng') || t.includes('nong')) { tuKhi.nhiet += wPct; return; }
  if (t.includes('hơi ôn') || t.includes('hoi on')) { tuKhi.on += wPct * 0.7; tuKhi.binh += wPct * 0.3; return; }
  if (t.includes('ôn') || t.includes('on')) { tuKhi.on += wPct; return; }
  tuKhi.binh += wPct;
}

// ───────────────────────── Kiểu dữ liệu vào/ra ─────────────────────────
export interface AnalysisHerbInput {
  id: number;
  ten_vi_thuoc: string;
  tinh: string;
  /** Ngũ vị (comma-separated). */
  vi: string;
  /** Quy kinh đã giải quyết (ưu tiên vị thuốc, fallback chi tiết). */
  quy_kinh: string;
  gram: number;
  /** Vai trò người nhập (Quân/Thần/Tá/Sứ) nếu có. */
  vai_tro_nhap: string;
  /** Công năng (功效) của vị — từ vi_thuoc_cong_dung. */
  congNang?: string[];
}

export interface AnalysisVtRow {
  id: number;
  ten: string;
  gram: number;
  pct: number;
  /** Vai trò hiệu lực: ưu tiên người nhập, fallback suy luận. */
  vai_tro: 'Quân' | 'Thần' | 'Tá' | 'Sứ';
  /** Vai trò suy luận thuần heuristic (để đối chiếu với người nhập). */
  vai_tro_suy_luan: 'Quân' | 'Thần' | 'Tá' | 'Sứ';
  vai_tro_nhap: string;
  color: string;
  quy_kinh: string;
}

export interface FormulaAnalysis {
  empty: boolean;
  ten: string;
  W: number;
  quyKinhNorm: Record<string, number>;
  tuKhi: { daiHan: number; han: number; luong: number; binh: number; on: number; nhiet: number; daiNhiet: number };
  nguVi: { chua: number; dang: number; ngot: number; cay: number; man: number };
  tgpt: { thang: number; phu: number; giang: number; tram: number };
  viThuocList: AnalysisVtRow[];
  chungTrang: string;
  kiengKy: string[];
  /** Công năng tổng hợp của bài (gộp từ các vị, trọng số theo gram), giảm dần. */
  congNang: Array<{ ten: string; score: number }>;
  /** Câu luận giải tổng hợp (template, không LLM). */
  luanGiai: string;
  /** Nhận định rule-based: cảnh báo Tứ Khí lệch + tương tác ngũ vị (sinh hóa). */
  nhanDinh: string[];
}

/** Nhận định rule-based từ Tứ Khí (lệch hàn/nhiệt) và tương tác Ngũ Vị (sinh hóa). */
function buildNhanDinh(
  tuKhi: FormulaAnalysis['tuKhi'],
  nguVi: FormulaAnalysis['nguVi'],
): string[] {
  const out: string[] = [];
  // Tứ Khí lệch — quy về trục hàn↔nhiệt có trọng số (đại hàn/đại nhiệt nặng gấp đôi).
  const cold = tuKhi.daiHan * 2 + tuKhi.han + tuKhi.luong * 0.5;
  const hot = tuKhi.daiNhiet * 2 + tuKhi.nhiet + tuKhi.on * 0.5;
  const diff = hot - cold;
  if (diff >= 0.4) {
    out.push('Bài thiên NHIỆT rõ — thận trọng với người âm hư / nội nhiệt; cân nhắc phối thêm thuốc lương-hàn để chế bớt.');
  } else if (diff <= -0.4) {
    out.push('Bài thiên HÀN rõ — thận trọng với người tỳ vị hư hàn; cân nhắc phối thuốc ôn ấm hộ vị.');
  }
  // Tương tác Ngũ Vị (sinh hóa) — chỉ nêu khi cả hai vị có tỉ trọng đáng kể.
  const TH = 0.12;
  if (nguVi.cay > TH && nguVi.ngot > TH) out.push('Cay + ngọt → "tân cam hóa dương": thiên trợ dương, ôn tán.');
  if (nguVi.chua > TH && nguVi.ngot > TH) out.push('Chua + ngọt → "toan cam hóa âm": thiên dưỡng âm, sinh tân.');
  if (nguVi.dang > TH && nguVi.man > TH) out.push('Đắng + mặn → đắng giáng tiết, mặn nhuyễn kiên: thiên tả hạ / nhuyễn kiên.');
  return out;
}

const TU_KHI_LABEL: Record<string, string> = {
  daiHan: 'đại hàn', han: 'hàn', luong: 'lương', binh: 'bình', on: 'ôn', nhiet: 'nhiệt', daiNhiet: 'đại nhiệt',
};
const NGU_VI_LABEL: Record<string, string> = {
  chua: 'chua', dang: 'đắng', ngot: 'ngọt', cay: 'cay', man: 'mặn',
};

/** Sinh câu luận giải tổng hợp từ các trục đã tính (rule-based). */
function buildLuanGiai(a: {
  quanTen: string;
  tuKhi: FormulaAnalysis['tuKhi'];
  nguVi: FormulaAnalysis['nguVi'];
  quyKinhNorm: Record<string, number>;
  congNang: Array<{ ten: string; score: number }>;
}): string {
  const topKey = (obj: Record<string, number>, min = 0): string[] =>
    Object.entries(obj).filter(([, v]) => v > min).sort((x, y) => y[1] - x[1]).map(([k]) => k);

  const tuKhiKey = topKey(a.tuKhi)[0];
  const viList = topKey(a.nguVi).slice(0, 3).map((k) => NGU_VI_LABEL[k] ?? k);
  const kinhList = topKey(a.quyKinhNorm, 0.5).slice(0, 3); // quy kinh chuẩn hoá 0–1
  const cnList = a.congNang.slice(0, 3).map((c) => c.ten);

  const parts: string[] = [];
  if (a.quanTen) parts.push(`Bài lấy ${a.quanTen} làm Quân`);
  const tinhPhrase = tuKhiKey ? `thiên ${TU_KHI_LABEL[tuKhiKey] ?? tuKhiKey}` : '';
  const viPhrase = viList.length ? `vị ${viList.join('-')}` : '';
  const kinhPhrase = kinhList.length ? `quy chủ yếu ${kinhList.join(', ')}` : '';
  const tvk = [tinhPhrase, viPhrase, kinhPhrase].filter(Boolean).join(', ');
  if (tvk) parts.push(tvk);
  const body = parts.join('; ');
  const cnPhrase = cnList.length ? `Công năng nổi bật: ${cnList.join(', ')}.` : '';
  return [body ? body + '.' : '', cnPhrase].filter(Boolean).join(' ');
}

/**
 * Phân tích một bài thuốc từ danh sách vị thuốc đã chuẩn hoá (gram + quy kinh đã giải quyết).
 * `chungTrang` và `kiengKy` do controller gộp sẵn từ quan hệ DB rồi truyền vào.
 */
export function analyzeFormula(input: {
  ten: string;
  herbs: AnalysisHerbInput[];
  chungTrang?: string;
  kiengKy?: string[];
}): FormulaAnalysis {
  const { ten, herbs } = input;
  const chungTrang = input.chungTrang ?? '';
  const kiengKy = input.kiengKy ?? [];

  const empty = (): FormulaAnalysis => ({
    empty: true, ten, W: 0, quyKinhNorm: {}, viThuocList: [],
    tuKhi: { daiHan: 0, han: 0, luong: 0, binh: 0, on: 0, nhiet: 0, daiNhiet: 0 },
    nguVi: { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 },
    tgpt: { thang: 0, phu: 0, giang: 0, tram: 0 },
    chungTrang, kiengKy, congNang: [], luanGiai: '', nhanDinh: [],
  });
  if (!herbs.length) return empty();

  const W = herbs.reduce((s, x) => s + x.gram, 0) || 1;

  // Quy kinh — tích lũy theo gram, chuẩn hoá về 0–1.
  const qkRaw: Record<string, number> = {};
  YHCT_KINH_ORDER.forEach((k) => { qkRaw[k] = 0; });
  for (const h of herbs) {
    h.quy_kinh.split(/[,;，、]/).map((k) => k.trim()).filter(Boolean).forEach((k) => {
      const norm = normalizeKinh(k);
      if (norm in qkRaw) qkRaw[norm] = (qkRaw[norm] ?? 0) + h.gram;
      else {
        const found = YHCT_KINH_ORDER.find((ref) => norm.includes(ref) || ref.includes(norm));
        if (found) qkRaw[found] = (qkRaw[found] ?? 0) + h.gram;
      }
    });
  }
  const qkMax = Math.max(...Object.values(qkRaw), 0.01);
  const quyKinhNorm: Record<string, number> = {};
  YHCT_KINH_ORDER.forEach((k) => { quyKinhNorm[k] = Math.round(((qkRaw[k] ?? 0) / qkMax) * 10) / 10; });

  // Vai trò Quân – Thần – Tá – Sứ:
  //   - suyLuanMap: heuristic theo gram + đồng quy kinh với Quân.
  //   - effRole: ƯU TIÊN vai trò người nhập (vai_tro_nhap), fallback heuristic.
  const sorted = [...herbs].sort((a, b) => b.gram - a.gram);
  const quanQK = (sorted[0]?.quy_kinh || '').split(/[,;，、]/).map((k) => normalizeKinh(k.trim()));
  const suyLuanMap: Record<number, Role> = {};
  sorted.forEach((x, i) => {
    const name = (x.ten_vi_thuoc || '').toLowerCase();
    const pct = x.gram / W;
    const vtQK = (x.quy_kinh || '').split(/[,;，、]/).map((k) => normalizeKinh(k.trim()));
    if (i === 0) suyLuanMap[x.id] = 'Quân';
    else if ((name.includes('cam thảo') || name.includes('đại táo')) && pct < 0.1) suyLuanMap[x.id] = 'Sứ';
    else if (pct >= 0.15 && vtQK.some((k) => quanQK.includes(k))) suyLuanMap[x.id] = 'Thần';
    else suyLuanMap[x.id] = 'Tá';
  });
  const effRole = (h: AnalysisHerbInput): Role => normalizeRole(h.vai_tro_nhap) ?? suyLuanMap[h.id] ?? 'Tá';

  const tuKhi = { daiHan: 0, han: 0, luong: 0, binh: 0, on: 0, nhiet: 0, daiNhiet: 0 };
  const nguVi = { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 };
  const tgpt = { thang: 0, phu: 0, giang: 0, tram: 0 };
  for (const h of herbs) {
    const wPct = h.gram / W;
    addTuKhi(tuKhi, h.tinh || '', wPct);
    addNguViBucket(nguVi, h.vi || '', wPct);
    addTgptBucket(tgpt, { tinh: h.tinh || '', quy_kinh: h.quy_kinh || '' }, wPct);
  }

  const viThuocList: AnalysisVtRow[] = herbs.map((h) => {
    const eff = effRole(h);
    return {
      id: h.id,
      ten: h.ten_vi_thuoc || '—',
      gram: h.gram,
      pct: Math.round((h.gram / W) * 100),
      vai_tro: eff,
      vai_tro_suy_luan: suyLuanMap[h.id] ?? 'Tá',
      vai_tro_nhap: (h.vai_tro_nhap || '').trim(),
      color: ROLE_COLORS[eff] ?? '#9CA3AF',
      quy_kinh: h.quy_kinh || '',
    };
  });

  // Công năng tổng hợp — gộp công năng từng vị, trọng số theo gram × vai trò (Quân nặng hơn Sứ).
  const cnAgg = new Map<string, number>();
  for (const h of herbs) {
    const w = (h.gram / W) * ROLE_WEIGHT[effRole(h)];
    for (const c of h.congNang ?? []) {
      const name = (c || '').trim();
      if (!name) continue;
      cnAgg.set(name, (cnAgg.get(name) ?? 0) + w);
    }
  }
  const congNang = [...cnAgg.entries()]
    .map(([ten, score]) => ({ ten, score: Math.round(score * 100) / 100 }))
    .sort((a, b) => b.score - a.score);

  const quanTen = viThuocList.find((v) => v.vai_tro === 'Quân')?.ten ?? '';
  const luanGiai = buildLuanGiai({ quanTen, tuKhi, nguVi, quyKinhNorm, congNang });
  const nhanDinh = buildNhanDinh(tuKhi, nguVi);

  return { empty: false, ten, W, quyKinhNorm, tuKhi, nguVi, tgpt, viThuocList, chungTrang, kiengKy, congNang, luanGiai, nhanDinh };
}
