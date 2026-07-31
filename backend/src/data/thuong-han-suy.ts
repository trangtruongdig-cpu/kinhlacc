/**
 * Cỗ máy TỰ SUY BỆNH CƠ theo Thương Hàn Luận (thuần hàm, không I/O).
 * Suy {tạng phủ tổn thương · khí tác động · giai đoạn} từ dữ liệu KHÁCH QUAN
 * (thể bệnh + nguyên tắc trị + bài thuốc + triệu chứng) đối chiếu bộ CHUẨN đã thẩm định.
 * KHÔNG dùng ô bệnh cơ người dùng tự điền làm nguồn — chỉ để ĐỐI CHIẾU.
 * Hai trục giai đoạn song song: Lục Kinh (thương hàn) và Vệ-Khí-Dinh-Huyết (ôn bệnh).
 * Bản gốc đã kiểm chứng: scratchpad/th-data/engine.cjs.
 */

// ---------- Kiểu dữ liệu vào ----------
export interface PhapTriRow {
  id: number;
  the_benh: string | null;
  nguyen_tac: string | null;
  y_nghia_co_che?: string | null;
  trieu_chung_mo_ta?: string | null;
  luc_kinh?: string | null;
  id_bai_thuoc?: number | null;
}
export interface ChuanData {
  formulaKinh: { entries: { pattern: string; kinh: string; do_tin?: string }[] };
  patternStage: {
    organKinh: { organ: string; kinh: string; loai: string; hanh: string }[];
    rules: { match_keywords?: string[]; match_organs?: string[]; match_tinhchat?: string[]; kinh: string; weight?: number; ly_do?: string }[];
  };
  khiLexicon: { entries: { pattern: string; khi: string }[]; tinhRule?: { tinh: string; implies: string }[] };
  deCuong: { kinh: { kinhSlug: string; keywords?: string[] }[] };
  // Trục ôn bệnh (Vệ-Khí-Dinh-Huyết): đề cương triệu chứng theo phận + phương chứng → phận.
  onBenh?: {
    phanLexicon?: { phan: string; keywords?: string[] }[];
    phanFormula?: { pattern: string; phan: string; benh_co?: string; do_tin?: string; note?: string }[];
    // Tam Tiêu (三焦辨证): trục ĐỊNH VỊ ôn bệnh (thượng/trung/hạ tiêu), song song trục độ sâu Vệ-Khí-Dinh-Huyết.
    tamTieuLexicon?: { tieu: string; keywords?: string[] }[];
    tamTieuFormula?: { pattern: string; tieu: string; note?: string }[];
  };
  consistency?: unknown;
}
export interface OverrideRow {
  id_phap_tri: number;
  he: string | null; // 'luc-kinh' | 'on-benh'
  giai_doan_slug: string | null;
  tang_phu: string | null;
  khi: string | null;
  ghi_chu: string | null;
  updated_at?: Date | string | null;
}
export interface SuyInput {
  phapTri: PhapTriRow[];
  btpt: { id_bai_thuoc: number; id_phap_tri: number }[];
  btct: { id_bai_thuoc: number; id_vi_thuoc: number; vai_tro: string | null }[];
  viThuoc: { id: number; tinh: string | null; quy_kinh: string | null }[];
  btNames: { id: number; ten_bai_thuoc: string | null }[];
  ptTc: { id_phap_tri: number; id_trieu_chung: number }[];
  trieuChung: { id: number; ten_trieu_chung: string | null }[];
  overrides: OverrideRow[];
  chuan: ChuanData;
}

// ---------- Bảng tra Lục Kinh & Ôn bệnh phận ----------
interface Meta { ten: string; han: string; tang_phu: string; khi: string; vi_tri: string }
const KINH_META: Record<string, Meta> = {
  'thai-duong': { ten: 'Thái Dương', han: '太陽', tang_phu: 'Bàng Quang / Tiểu Trường', khi: 'Hàn Thủy', vi_tri: 'Biểu' },
  'duong-minh': { ten: 'Dương Minh', han: '陽明', tang_phu: 'Vị / Đại Trường', khi: 'Táo Kim', vi_tri: 'Lý thực nhiệt' },
  'thieu-duong': { ten: 'Thiếu Dương', han: '少陽', tang_phu: 'Đởm / Tam Tiêu', khi: 'Tướng Hỏa', vi_tri: 'Bán biểu bán lý' },
  'thai-am': { ten: 'Thái Âm', han: '太陰', tang_phu: 'Tỳ / Phế', khi: 'Thấp Thổ', vi_tri: 'Lý hư hàn' },
  'thieu-am': { ten: 'Thiếu Âm', han: '少陰', tang_phu: 'Thận / Tâm', khi: 'Quân Hỏa', vi_tri: 'Lý hư (hàn/nhiệt hóa)' },
  'quyet-am': { ten: 'Quyết Âm', han: '厥陰', tang_phu: 'Can / Tâm Bào', khi: 'Phong Mộc', vi_tri: 'Hàn nhiệt thác tạp' },
};
const SLUGS = Object.keys(KINH_META);
const PHAN_META: Record<string, Meta> = {
  'Vệ Phận': { ten: 'Vệ Phận', han: '衛', tang_phu: 'Phế · da lông (biểu)', khi: 'Ôn nhiệt', vi_tri: 'Ôn bệnh — nông nhất, tà ở phế vệ' },
  'Khí Phận': { ten: 'Khí Phận', han: '氣', tang_phu: 'Phế · Vị · Trường', khi: 'Lý nhiệt', vi_tri: 'Ôn bệnh — lý nhiệt thịnh' },
  'Dinh Phận': { ten: 'Dinh Phận', han: '營', tang_phu: 'Tâm · Tâm Bào', khi: 'Nhiệt hao âm', vi_tri: 'Ôn bệnh — nhiệt nhập dinh, nhiễu thần' },
  'Huyết Phận': { ten: 'Huyết Phận', han: '血', tang_phu: 'Tâm · Can · Thận', khi: 'Nhiệt động huyết', vi_tri: 'Ôn bệnh — sâu nhất, bức/động huyết' },
};
const PHANS = Object.keys(PHAN_META);
const metaOf = (m: Record<string, Meta>, k: string): Meta => m[k] ?? { ten: k, han: '', tang_phu: '', khi: '', vi_tri: '' };

const PHAN_LEX: { phan: string; kw: string[] }[] = [
  { phan: 'Huyết Phận', kw: ['huyết phận', 'huyết nhiệt', 'vong hành', 'bức huyết', 'động huyết', 'phát ban', 'nhiệt độc phát ban', 'xuất huyết'] },
  { phan: 'Dinh Phận', kw: ['dinh phận', 'nhập dinh', 'thương dinh', 'nhiệt nhập tâm bào', 'nghịch truyền tâm bào', 'nhiệt hãm tâm bào'] },
  { phan: 'Khí Phận', kw: ['khí phận', 'tích nhiệt', 'nhiệt trở hung cách', 'nhiệt ủng', 'ủng thịnh', 'hun chưng', 'đàm nhiệt ủng phế', 'nhiệt phế'] },
  { phan: 'Vệ Phận', kw: ['vệ phận', 'phong nhiệt phạm vệ', 'tà phạm phế vệ', 'biểu nhiệt'] },
];
const SUPP_RULES = [
  { match_keywords: ['đàm thấp', 'đàm ẩm', 'đàm trọc', 'hàn thấp hiệp đàm', 'đàm thấp trở', 'đàm thấp ủng'], kinh: 'thai-am', weight: 2, ly_do: 'Đàm thấp do Tỳ hư vận hoá thất thường → Thái Âm' },
  { match_organs: ['vị', 'trường'], match_keywords: ['thực trệ', 'thực tích', 'tích trệ', 'túc thực'], kinh: 'duong-minh', weight: 2, ly_do: 'Thực trệ Vị Trường (thực chứng) → Dương Minh' },
];
const KINHNAME: [string, string][] = [
  ['thái dương', 'thai-duong'], ['dương minh', 'duong-minh'], ['thiếu dương', 'thieu-duong'],
  ['thái âm', 'thai-am'], ['thiếu âm', 'thieu-am'], ['quyết âm', 'quyet-am'],
];

const norm = (s: unknown): string => (s == null ? '' : String(s)).toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim();
// Bỏ dấu — CHỈ dùng cho khớp Đề cương (deCuong keywords được lưu không dấu; norm() giữ dấu nên
// signal ③ vốn không khớp được text app có dấu). Không áp cho khí/phương để tránh va chạm hàn↔hãn.
const stripDia = (s: string): string => s.normalize('NFD').replace(new RegExp('[\u0300-\u036f]', 'g'), '').replace(/đ/g, 'd');
const normND = (s: unknown): string => stripDia(norm(s));
const inc = (o: Record<string, number>, k: string, v: number): void => { o[k] = (o[k] ?? 0) + v; };
const topN = (obj: Record<string, number>, n = 6): [string, number][] =>
  Object.entries(obj).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, n);

// Ưu tiên phận SÂU trước (Huyết > Dinh > Khí > Vệ) — bệnh ôn tiến triển vào sâu thì giai đoạn
// lấy theo tầng sâu nhất có mặt. Từ khoá "mạnh" (đặc trưng phận sâu) → do_tin cao hơn.
const PHAN_ORDER = ['Huyết Phận', 'Dinh Phận', 'Khí Phận', 'Vệ Phận'];
const PHAN_STRONG_RE = new RegExp(
  ['phan', 'nhap dinh', 'vong hanh', 'huyet nhiet', 'nhap tam bao', 'phat ban', 'dong huyet',
    'thuong dinh', 'xuat huyet', 'tho huyet', 'luoi tia', 'luoi giang', 'phat cuong', 'dong phong'].join('|'),
);
// Tam Tiêu — xét phận SÂU trước (Hạ > Trung > Thượng) để lấy tầng sâu nhất khi có nhiều dấu hiệu.
const TAMTIEU_ORDER = ['Hạ Tiêu', 'Trung Tiêu', 'Thượng Tiêu'];
const TAMTIEU_HAN: Record<string, string> = { 'Thượng Tiêu': '上焦', 'Trung Tiêu': '中焦', 'Hạ Tiêu': '下焦' };
function tinhPole(tinh: string | null): 'lanh' | 'am' | null {
  const t = norm(tinh);
  if (/(đại hàn|hàn|lương|lạnh|寒)/.test(t)) return 'lanh';
  if (/(đại nhiệt|nhiệt|ôn)/.test(t)) return 'am';
  return null;
}

export interface GiaiDoan {
  he: 'luc-kinh' | 'on-benh' | 'tap-benh';
  slug?: string; phan?: string;
  /** Kinh PHỤ khi HỢP BỆNH (2 kinh cùng bệnh, vd Thiếu Dương + Dương Minh) — vá lỗ hổng chỉ 1 kinh. */
  slug_phu?: string; ten_phu?: string; han_phu?: string;
  ten: string; han: string; tang_phu: string; khi: string; vi_tri: string;
  do_tin: 'cao' | 'vua' | 'thap';
  nguon: string; yeu?: boolean; phan_phu?: string | null;
  tam_tieu?: { tieu: string; han: string; nguon: string } | null; // định vị Tam Tiêu (chỉ trục ôn bệnh)
  ly_do: string[]; votes: { k: string; v: number }[];
}
export interface BenhCoResult {
  id: number; the_benh: string | null; nguyen_tac: string | null;
  giai_doan: GiaiDoan | null;
  tang_phu: { organ: string[]; nguon: string; do_tin: string; hanh: string | null };
  khi: { khi: string; nguon: string }[];
  tinh_chat: string[];
  so_bai: number; so_vi: number; so_trieu_chung: number;
  doi_chieu: { khi: string; giai_doan: string; user_khi: string[]; user_kinh: string[]; user_phan: string[] };
  tin_hieu: { stage: string | null; formula: string | null; decuong: string | null; herb: string | null };
  override: OverrideRow | null;
  suy_goc?: { label: string; ten: string } | null; // giai đoạn engine trước khi bị ghi đè
}

export function suyBenhCoAll(input: SuyInput): { results: BenhCoResult[]; summary: Record<string, unknown> } {
  const { phapTri, btpt, btct, viThuoc, btNames, ptTc, trieuChung, overrides, chuan } = input;

  const viById = new Map(viThuoc.map((v) => [v.id, v]));
  const btNameById = new Map(btNames.map((b) => [b.id, b.ten_bai_thuoc]));
  const tcById = new Map(trieuChung.map((t) => [t.id, t.ten_trieu_chung]));
  const ovById = new Map(overrides.map((o) => [o.id_phap_tri, o]));

  const btByPt = new Map<number, Set<number>>();
  const addBt = (pt: number, bt: number): void => { if (!btByPt.has(pt)) btByPt.set(pt, new Set()); btByPt.get(pt)!.add(bt); };
  for (const r of btpt) addBt(r.id_phap_tri, r.id_bai_thuoc);
  for (const p of phapTri) if (p.id_bai_thuoc) addBt(p.id, p.id_bai_thuoc);
  const viByBt = new Map<number, { id_vi_thuoc: number; vai_tro: string | null }[]>();
  for (const r of btct) { if (!viByBt.has(r.id_bai_thuoc)) viByBt.set(r.id_bai_thuoc, []); viByBt.get(r.id_bai_thuoc)!.push(r); }
  const tcByPt = new Map<number, string[]>();
  for (const r of ptTc) { if (!tcByPt.has(r.id_phap_tri)) tcByPt.set(r.id_phap_tri, []); const n = tcById.get(r.id_trieu_chung); if (n) tcByPt.get(r.id_phap_tri)!.push(n); }

  const ORGAN = chuan.patternStage.organKinh.slice().sort((a, b) => b.organ.length - a.organ.length);
  const organToKinh = (text: string): { organ: string; kinh: string; hanh: string }[] => {
    const t = norm(text); const hits: { organ: string; kinh: string; hanh: string }[] = [];
    for (const o of ORGAN) if (t.includes(o.organ)) hits.push(o);
    return hits;
  };
  const quyKinhSlugs = (qk: string | null): string[] => {
    const out: string[] = [];
    for (const part of norm(qk).split(/[,;/]/)) {
      const hit = KINHNAME.find(([k]) => part.includes(k));
      if (hit) { out.push(hit[1]); continue; }
      const o = ORGAN.find((x) => part.includes(x.organ));
      if (o) out.push(o.kinh);
    }
    return out;
  };

  // Baseline khử thiên lệch (IDF nhẹ)
  const baseKinh: Record<string, number> = Object.fromEntries(SLUGS.map((s) => [s, 0]));
  for (const p of phapTri) for (const bt of btByPt.get(p.id) ?? []) for (const ct of viByBt.get(bt) ?? []) {
    const vi = viById.get(ct.id_vi_thuoc); if (!vi) continue;
    for (const s of quyKinhSlugs(vi.quy_kinh)) inc(baseKinh, s, 1);
  }
  const baseAvg = (Object.values(baseKinh).reduce((a, b) => a + b, 0) / SLUGS.length) || 1;

  const STAGE_RULES = chuan.patternStage.rules
    .map((r) => ({ ...r, match_keywords: (r.match_keywords ?? []).filter((k) => !/^(ma hoàng|quế chi)$/i.test((k || '').trim())) }))
    .concat(SUPP_RULES as never[]);
  const FORMULA_ENTRIES = chuan.formulaKinh.entries.slice().sort((a, b) => (b.pattern || '').length - (a.pattern || '').length);

  // Đề cương: chuẩn hoá bỏ dấu 1 lần + trọng số ĐẶC TRƯNG (df across kinh). Từ khoá chung nhiều
  // kinh (vd "phát sốt", "sợ lạnh") bị giảm trọng để tránh kinh có tập từ khoá lớn nuốt phiếu.
  const DECUONG = (chuan.deCuong.kinh ?? []).map((k) => ({
    slug: k.kinhSlug,
    kws: [...new Set((k.keywords ?? []).map((x) => normND(x)).filter(Boolean))],
  }));
  const DECUONG_DF = new Map<string, number>();
  for (const k of DECUONG) for (const kw of k.kws) DECUONG_DF.set(kw, (DECUONG_DF.get(kw) ?? 0) + 1);

  // ---- Trục ôn bệnh (Vệ-Khí-Dinh-Huyết) ----
  // Lexicon triệu chứng theo phận: gộp bản cứng PHAN_LEX + bổ sung từ CHUAN.onBenh (bỏ dấu để khớp).
  const PHAN_KW = new Map<string, string[]>();
  for (const p of PHAN_LEX) PHAN_KW.set(p.phan, [...new Set(p.kw.map(normND))]);
  for (const p of chuan.onBenh?.phanLexicon ?? []) {
    const cur = PHAN_KW.get(p.phan) ?? [];
    PHAN_KW.set(p.phan, [...new Set([...cur, ...(p.keywords ?? []).map(normND)])]);
  }
  const detectPhanSym = (hayND: string): { phan: string; kw: string; strong: boolean } | null => {
    for (const phan of PHAN_ORDER) {
      const matched = (PHAN_KW.get(phan) ?? []).filter((x) => x && hayND.includes(x));
      if (matched.length) {
        const strongKw = matched.find((x) => PHAN_STRONG_RE.test(x)); // strong nếu BẤT KỲ từ khoá nào đặc trưng
        return { phan, kw: strongKw ?? matched[0]!, strong: !!strongKw };
      }
    }
    return null;
  };
  // Phương chứng → phận (tín hiệu MẠNH nhất, như formulaKinh với Lục Kinh). Chỉ chứa phương ôn bệnh
  // ĐẶC THÙ (ngân kiều/thanh dinh/tê giác/tam bảo…) — KHÔNG gồm bạch hổ/thừa khí (dùng chung Dương Minh).
  const PHAN_FORMULA = (chuan.onBenh?.phanFormula ?? []).slice()
    .sort((a, b) => (b.pattern || '').length - (a.pattern || '').length)
    .map((e) => ({ ...e, pat: normND(e.pattern) }));
  const detectPhanFormula = (btLcND: string[]): (typeof PHAN_FORMULA)[number] | null => {
    for (const e of PHAN_FORMULA) if (e.pat && btLcND.some((n) => n.includes(e.pat))) return e;
    return null;
  };
  // Tam Tiêu (三焦): định vị thượng/trung/hạ tiêu — gắn kèm cho trục ôn bệnh.
  const TAMTIEU_KW = new Map<string, string[]>();
  for (const t of chuan.onBenh?.tamTieuLexicon ?? []) TAMTIEU_KW.set(t.tieu, [...new Set((t.keywords ?? []).map(normND))]);
  const detectTamTieuSym = (hayND: string): string | null => {
    for (const tieu of TAMTIEU_ORDER) if ((TAMTIEU_KW.get(tieu) ?? []).some((x) => x && hayND.includes(x))) return tieu;
    return null;
  };
  const TAMTIEU_FORMULA = (chuan.onBenh?.tamTieuFormula ?? []).slice()
    .sort((a, b) => (b.pattern || '').length - (a.pattern || '').length)
    .map((e) => ({ ...e, pat: normND(e.pattern) }));
  const detectTamTieuFormula = (btLcND: string[]): (typeof TAMTIEU_FORMULA)[number] | null => {
    for (const e of TAMTIEU_FORMULA) if (e.pat && btLcND.some((n) => n.includes(e.pat))) return e;
    return null;
  };

  function suy(p: PhapTriRow): BenhCoResult {
    const hay = norm([p.the_benh, p.nguyen_tac, p.y_nghia_co_che, p.trieu_chung_mo_ta].join(' | '));
    const reasons: string[] = [];
    const tc = new Set<string>();
    const tcDefs: [RegExp, string][] = [[/thực/, 'thực'], [/hư/, 'hư'], [/hàn|lạnh/, 'hàn'], [/nhiệt|nóng|hỏa/, 'nhiệt'], [/biểu/, 'biểu'], [/lý|nội/, 'lý'], [/thấp/, 'thấp'], [/phong/, 'phong'], [/táo/, 'táo'], [/đàm/, 'đàm'], [/dương hư/, 'dương hư'], [/âm hư/, 'âm hư'], [/vong dương/, 'vong dương'], [/quyết/, 'quyết'], [/ứ/, 'ứ']];
    for (const [re, tag] of tcDefs) if (re.test(hay)) tc.add(tag);

    const vote: Record<string, number> = Object.fromEntries(SLUGS.map((s) => [s, 0]));
    const sig: { stage: string | null; formula: string | null; decuong: string | null; herb: string | null } = { stage: null, formula: null, decuong: null, herb: null };

    // ① Luật mẫu bệnh → kinh
    for (const r of STAGE_RULES) {
      const okKw = !(r.match_keywords && r.match_keywords.length) || r.match_keywords.some((k) => hay.includes(norm(k)));
      const okOrg = !(r.match_organs && r.match_organs.length) || r.match_organs.some((o) => hay.includes(norm(o)));
      const okTc = !(r.match_tinhchat && r.match_tinhchat.length) || r.match_tinhchat.every((t) => tc.has(norm(t)));
      if (okKw && okOrg && okTc) { inc(vote, r.kinh, (r.weight || 1) * 3); if (!sig.stage) sig.stage = r.kinh; reasons.push(`luật: ${r.ly_do ?? ''}`); }
    }

    // ② Phương → kinh (ưu tiên pattern dài)
    const bts = [...(btByPt.get(p.id) ?? [])];
    const btNamesLc = bts.map((b) => norm(btNameById.get(b))).filter(Boolean);
    const claimed: { nm: string; pat: string }[] = [];
    for (const e of FORMULA_ENTRIES) {
      if (e.kinh === 'khong-ro' || !e.pattern) continue;
      const pat = norm(e.pattern);
      const nm = btNamesLc.find((n) => n.includes(pat));
      if (!nm) continue;
      if (claimed.some((c) => c.nm === nm && c.pat !== pat && c.pat.includes(pat))) continue;
      claimed.push({ nm, pat });
      const w = e.do_tin === 'cao' ? 3 : e.do_tin === 'thap' ? 1 : 2;
      inc(vote, e.kinh, w * 2); if (!sig.formula) sig.formula = e.kinh; reasons.push(`phương: ${e.pattern}→${e.kinh}`);
    }

    // ③ Đề cương triệu chứng — khớp BỎ DẤU (trước đây keywords không dấu vs text có dấu → chết),
    // cộng điểm theo độ đặc trưng 1/df (từ khoá riêng 1 kinh > từ khoá chung), cap 3 (vẫn là phiếu phụ).
    const decuongHay = normND((tcByPt.get(p.id) ?? []).join(' ; ') + ' ' + hay);
    let decTop: { slug: string; score: number } | null = null;
    for (const k of DECUONG) {
      let hit = 0, score = 0;
      for (const kw of k.kws) if (decuongHay.includes(kw)) { hit++; score += 1 / (DECUONG_DF.get(kw) ?? 1); }
      if (hit) {
        inc(vote, k.slug, Math.min(score, 3));
        if (!decTop || score > decTop.score) decTop = { slug: k.slug, score };
      }
    }
    // sig.decuong = kinh mà Đề cương ỦNG HỘ NHẤT (argmax), chỉ khi đủ mạnh — tránh từ khoá chung
    // của kinh có tập lớn (Thái Dương) cướp tín hiệu.
    if (decTop && decTop.score >= 1.5) sig.decuong = decTop.slug;

    // ④ Quy kinh vị thuốc (khử thiên lệch)
    const herbRaw: Record<string, number> = Object.fromEntries(SLUGS.map((s) => [s, 0]));
    let herbN = 0;
    for (const bt of bts) for (const ct of viByBt.get(bt) ?? []) {
      const vi = viById.get(ct.id_vi_thuoc); if (!vi) continue; herbN++;
      const w = /quân|thần/i.test(ct.vai_tro || '') ? 2 : 1;
      for (const s of quyKinhSlugs(vi.quy_kinh)) inc(herbRaw, s, w);
    }
    const herbAdj: Record<string, number> = Object.fromEntries(SLUGS.map((s) => [s, (herbRaw[s] ?? 0) / Math.sqrt((baseKinh[s] || 1) / baseAvg)]));
    const herbTop = topN(herbAdj, 1)[0];
    if (herbTop) { inc(vote, herbTop[0], 1); sig.herb = herbTop[0]; }

    const ranked = topN(vote, 6);
    const lucTop = ranked.length ? ranked[0][0] : null;
    const margin = ranked.length >= 2 ? ranked[0][1] - ranked[1][1] : (ranked.length ? ranked[0][1] : 0);
    const reliable = sig.stage || sig.formula;
    const nSig = [sig.stage, sig.formula, sig.decuong].filter((s) => s && s === lucTop).length;
    const phanForm = detectPhanFormula(btNamesLc.map(normND));
    const phanSym = detectPhanSym(normND(hay));
    const votesOut = ranked.map(([k, v]) => ({ k, v: +v.toFixed(1) }));

    let GD: GiaiDoan | null = null;
    if (phanForm) {
      // Phương ôn bệnh ĐẶC THÙ → trục Vệ-Khí-Dinh-Huyết làm CHÍNH (không ép vào Lục Kinh do_tin thấp).
      const dt = (phanForm.do_tin === 'cao' || phanForm.do_tin === 'thap') ? phanForm.do_tin : 'vua';
      GD = { he: 'on-benh', phan: phanForm.phan, ...metaOf(PHAN_META, phanForm.phan), do_tin: dt, nguon: 'phương ôn bệnh',
        ly_do: [`phương ôn bệnh: ${phanForm.pattern} → ${phanForm.phan}`, ...(phanForm.note ? [phanForm.note] : [])], votes: votesOut };
    } else if (phanSym && phanSym.strong && !sig.formula) {
      // Dấu hiệu doanh/huyết ĐẶC TRƯNG mạnh (nhập doanh, ban chẩn, lưỡi giáng, xuất huyết…) mà KHÔNG có
      // phương chứng Lục Kinh → ưu tiên ôn bệnh hơn phỏng đoán Lục Kinh (chỉ từ luật/quy kinh).
      GD = { he: 'on-benh', phan: phanSym.phan, ...metaOf(PHAN_META, phanSym.phan), do_tin: 'vua', nguon: 'phận ôn bệnh (dấu hiệu doanh/huyết)', ly_do: [`ôn bệnh (dấu hiệu mạnh): khớp "${phanSym.kw}" → ${phanSym.phan}`], votes: votesOut };
    } else if (reliable && lucTop) {
      let doTin: 'cao' | 'vua' | 'thap' = 'thap';
      if (nSig >= 2 || (sig.stage === lucTop && sig.formula === lucTop)) doTin = 'cao';
      else if (sig.stage === lucTop || sig.formula === lucTop || margin >= 3) doTin = 'vua';
      const nguon = sig.stage === lucTop ? 'luật thể bệnh' : sig.formula === lucTop ? 'phương chứng' : 'quy kinh';
      GD = { he: 'luc-kinh', slug: lucTop, ...metaOf(KINH_META, lucTop), do_tin: doTin, nguon, ly_do: reasons.slice(0, 6), votes: votesOut, phan_phu: phanSym ? phanSym.phan : null };
    } else if (phanSym) {
      GD = { he: 'on-benh', phan: phanSym.phan, ...metaOf(PHAN_META, phanSym.phan), do_tin: phanSym.strong ? 'vua' : 'thap', nguon: 'phận ôn bệnh', ly_do: [`ôn bệnh: khớp "${phanSym.kw}" → ${phanSym.phan}`], votes: votesOut };
    } else if (lucTop) {
      GD = { he: 'luc-kinh', slug: lucTop, ...metaOf(KINH_META, lucTop), do_tin: 'thap', nguon: 'quy kinh (yếu)', yeu: true, ly_do: ['định hướng yếu — chỉ từ quy kinh vị thuốc, cần soi tay'], votes: votesOut, phan_phu: null };
    }

    // ── VÁ 2 LỖ HỔNG (làm tận gốc) ──
    if (GD && GD.he === 'luc-kinh') {
      const btJoin = btNamesLc.join(' ');
      // ① HỢP BỆNH — CHỈ từ PHƯƠNG hợp bệnh kinh điển (data-driven, tránh nhiễu phiếu suy đoán):
      //   Đại Sài Hồ = Thiếu Dương+Dương Minh · Sài Hồ Quế Chi = Thiếu Dương+Thái Dương ·
      //   Cát Căn Cầm Liên = Dương Minh+Thái Dương (biểu lý song giải). Trước đây rớt mất kinh thứ hai.
      const HOP: Array<[RegExp, string, string]> = [
        [/đại sài hồ/, 'thieu-duong', 'duong-minh'],
        [/sài hồ quế chi(?! can)/, 'thieu-duong', 'thai-duong'],
        [/cát căn cầm liên/, 'duong-minh', 'thai-duong'],
      ];
      for (const [re, kA, kB] of HOP) {
        if (!re.test(btJoin)) continue;
        const phu = GD.slug === kA ? kB : GD.slug === kB ? kA : null;
        if (phu) {
          const pm = metaOf(KINH_META, phu);
          GD.slug_phu = phu; GD.ten_phu = pm.ten; GD.han_phu = pm.han;
          GD.ly_do = [...GD.ly_do, `Hợp bệnh: kèm ${pm.ten} (phương hợp bệnh kinh điển)`];
        }
        break;
      }
      // ② GẠN "THÙNG CHỨA" Thiếu Dương: Can/Đởm NỘI THƯƠNG (can khí uất · can hoả · can vị bất hoà ·
      //   can đởm uất/thấp nhiệt · khí trệ · tâm đởm…) KHÔNG phải Thiếu Dương truyền kinh → hạ độ tin +
      //   ghi chú, TRỪ khi có tín hiệu Thiếu Dương THẬT: vãng lai hàn nhiệt / bán biểu bán lý / phương
      //   CỔ ĐIỂN (Tiểu·Đại Sài Hồ, Sài Hồ Quế Chi, Hao Cầm Thanh Đởm) — KHÔNG tính Sài Hồ Sơ Can /
      //   Tiêu Dao (thời phương nội thương tuy có sài hồ).
      if (GD.slug === 'thieu-duong' && GD.do_tin !== 'thap') {
        const noiThuongCan = /(can khí uất|can hoả|can hỏa|can vị bất ho|can đởm uất|can đởm thấp nhiệt|can kinh uất|khí trệ|tâm đởm|đởm khiếp)/.test(hay);
        const thieuDuongThat = /(vãng lai hàn nhiệt|hàn nhiệt vãng lai|bán biểu bán lý|thiếu dương chứng)/.test(hay)
          || /tiểu sài hồ|đại sài hồ|sài hồ quế chi|hao cầm thanh đởm/.test(btJoin);
        if (noiThuongCan && !thieuDuongThat) {
          GD.do_tin = 'thap'; GD.yeu = true;
          GD.ly_do = ['Can/Đởm NỘI THƯƠNG (tạp bệnh) — kinh vị trí đúng nhưng KHÔNG phải Thiếu Dương truyền kinh; cần xác nhận', ...GD.ly_do];
        }
      }
    }

    // Tạng phủ
    const organHits = organToKinh(hay);
    const organNames = [...new Set(organHits.map((o) => o.organ))];
    let tangPhu: BenhCoResult['tang_phu'];
    if (organNames.length) tangPhu = { organ: organNames.map((o) => o.replace(/\b\w/, (c) => c.toUpperCase())), nguon: 'tên thể bệnh', do_tin: 'cao', hanh: organHits[0]!.hanh };
    else if (GD) tangPhu = { organ: [GD.tang_phu], nguon: 'suy từ giai đoạn', do_tin: GD.do_tin === 'cao' ? 'vua' : 'thap', hanh: null };
    else tangPhu = { organ: [], nguon: 'chưa suy được', do_tin: 'thap', hanh: null };

    // Khí
    const khiSet = new Map<string, string>();
    for (const e of chuan.khiLexicon.entries) if (e.pattern && hay.includes(norm(e.pattern))) khiSet.set(e.khi, khiSet.get(e.khi) ?? 'mô tả');
    const poles = { lanh: 0, am: 0 };
    for (const bt of bts) for (const ct of viByBt.get(bt) ?? []) { const vi = viById.get(ct.id_vi_thuoc); if (!vi) continue; const pl = tinhPole(vi.tinh); if (pl) poles[pl]++; }
    if (poles.lanh + poles.am >= 4) {
      const dominant = poles.lanh >= poles.am * 1.3 ? 'lanh' : poles.am >= poles.lanh * 1.3 ? 'am' : null;
      if (dominant) { const rule = (chuan.khiLexicon.tinhRule ?? []).find((r) => tinhPole(r.tinh) === dominant); if (rule && !khiSet.has(rule.implies)) khiSet.set(rule.implies, 'tính phương'); }
    }
    let khi = [...khiSet.entries()].map(([k, nguon]) => ({ khi: k, nguon }));

    // ---- Ghi đè tay (Hybrid): áp TRƯỚC đối chiếu để đối chiếu phản ánh giá trị CHỐT ----
    const ov = ovById.get(p.id);
    const suyGoc = ov && GD ? { label: GD.he === 'luc-kinh' ? GD.slug! : GD.phan!, ten: GD.ten } : null;
    if (ov) {
      if (ov.he === 'tap-benh') {
        GD = { he: 'tap-benh', ten: 'Tạp bệnh', han: '', tang_phu: ov.tang_phu || '(nội thương)', khi: ov.khi || '', vi_tri: 'Nội thương tạp bệnh — không thuộc Lục Kinh / Ôn bệnh', do_tin: 'cao', nguon: 'ghi đè tay', ly_do: [ov.ghi_chu || 'người dùng xác nhận: tạp bệnh'], votes: GD ? GD.votes : [] } as GiaiDoan;
      } else if (ov.giai_doan_slug) {
        const isPhan = ov.he === 'on-benh';
        const meta = isPhan ? metaOf(PHAN_META, ov.giai_doan_slug) : metaOf(KINH_META, ov.giai_doan_slug);
        GD = { he: isPhan ? 'on-benh' : 'luc-kinh', [isPhan ? 'phan' : 'slug']: ov.giai_doan_slug, ...meta, do_tin: 'cao', nguon: 'ghi đè tay', ly_do: [ov.ghi_chu || 'người dùng xác nhận'], votes: GD ? GD.votes : [] } as GiaiDoan;
      }
      if (ov.tang_phu) tangPhu = { organ: ov.tang_phu.split(/[,;]/).map((s) => s.trim()).filter(Boolean), nguon: 'ghi đè tay', do_tin: 'cao', hanh: null };
      if (ov.khi) khi = ov.khi.split(/[,;]/).map((s) => s.trim()).filter(Boolean).map((k) => ({ khi: k, nguon: 'ghi đè tay' }));
    }

    // Định vị Tam Tiêu — gắn cho MỌI kết quả ôn bệnh (kể cả đã ghi đè); phương ưu tiên rồi triệu chứng.
    if (GD && GD.he === 'on-benh') {
      const ttForm = detectTamTieuFormula(btNamesLc.map(normND));
      const tieu = ttForm ? ttForm.tieu : detectTamTieuSym(normND(hay));
      if (tieu) GD.tam_tieu = { tieu, han: TAMTIEU_HAN[tieu] ?? '', nguon: ttForm ? 'phương ôn bệnh' : 'triệu chứng' };
    }

    // Đối chiếu ô user (luc_kinh) — so với giá trị CHỐT (đã tính ghi đè)
    const userLk = norm(p.luc_kinh);
    const userKhi = chuan.khiLexicon.entries.filter((e) => e.pattern && userLk.includes(norm(e.pattern))).map((e) => e.khi);
    const userKinh = KINHNAME.filter(([k]) => userLk.includes(k) && userLk.includes('kinh')).map(([, s]) => s);
    const userPhan = PHANS.filter((ph) => userLk.includes(norm(ph)));
    const userLabels = userKinh.concat(userPhan);
    const derivedKhi = khi.map((x) => x.khi);
    const gdDc = (() => {
      if (userLabels.length === 0) return GD ? 'lý-thuyết-bổ-sung' : 'cả-hai-trống';
      if (!GD) return 'chỉ-user';
      if (GD.he === 'tap-benh') return 'khác-hệ';
      if (GD.he === 'luc-kinh') return userKinh.length ? (userKinh.includes(GD.slug!) ? 'khớp' : 'lệch') : 'khác-hệ';
      return userPhan.length ? (userPhan.includes(GD.phan!) ? 'khớp' : 'lệch') : 'khác-hệ';
    })();
    const khiDc = !userLk ? 'user-trống' : userKhi.length === 0 ? 'user-không-khí'
      : userKhi.every((k) => derivedKhi.includes(k)) && derivedKhi.some((k) => userKhi.includes(k)) ? 'khớp'
        : userKhi.some((k) => derivedKhi.includes(k)) ? 'khớp-phần' : 'lệch';

    return {
      id: p.id, the_benh: p.the_benh, nguyen_tac: p.nguyen_tac,
      giai_doan: GD, tang_phu: tangPhu, khi, tinh_chat: [...tc],
      so_bai: bts.length, so_vi: herbN, so_trieu_chung: (tcByPt.get(p.id) ?? []).length,
      doi_chieu: { khi: khiDc, giai_doan: gdDc, user_khi: userKhi, user_kinh: userKinh, user_phan: userPhan },
      tin_hieu: sig, override: ov ?? null, suy_goc: suyGoc,
    };
  }

  const results = phapTri.map(suy);

  // Thống kê
  const byKinh: Record<string, number> = Object.fromEntries(SLUGS.map((s) => [s, 0]));
  const byPhan: Record<string, number> = Object.fromEntries(PHANS.map((s) => [s, 0]));
  const byTin: Record<string, number> = { cao: 0, vua: 0, thap: 0 };
  const dcKhi: Record<string, number> = {}, dcGd: Record<string, number> = {};
  let chuaSuy = 0, soYeu = 0, soLucKinh = 0, soOnBenh = 0, soTapBenh = 0, soGhiDe = 0;
  for (const r of results) {
    const g = r.giai_doan;
    if (g) {
      inc(byTin, g.do_tin, 1);
      if (g.he === 'luc-kinh') { inc(byKinh, g.slug!, 1); soLucKinh++; if (g.yeu) soYeu++; }
      else if (g.he === 'on-benh') { inc(byPhan, g.phan!, 1); soOnBenh++; }
      else soTapBenh++;
    } else chuaSuy++;
    if (r.override) soGhiDe++;
    inc(dcKhi, r.doi_chieu.khi, 1);
    inc(dcGd, r.doi_chieu.giai_doan, 1);
  }
  const summary = {
    tong: results.length, chuaSuy, soLucKinh, soOnBenh, soTapBenh, soYeu, soGhiDe,
    theoKinh: SLUGS.map((s) => ({ slug: s, ten: metaOf(KINH_META, s).ten, n: byKinh[s] ?? 0 })),
    theoPhan: PHANS.map((s) => ({ phan: s, ten: metaOf(PHAN_META, s).ten, n: byPhan[s] ?? 0 })),
    doTin: byTin, doiChieuKhi: dcKhi, doiChieuGiaiDoan: dcGd,
  };
  return { results, summary };
}
