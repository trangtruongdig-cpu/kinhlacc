/*
 * _build-dict.cjs — "đọc text như chuyên gia Đông Y" rồi DỰNG INDEX 2 chiều cho Từ Điển.
 *
 * ĐỌC (input):
 *   · acupoints.js          — 1.059 huyệt, mỗi huyệt có sections[] (XUẤT XỨ, ĐẶC TÍNH…)
 *   · acu-index.js          — codeToId (mã WHO LU9… ↔ id huyệt), để đính mã vào huyệt
 *   · dict-traits.json      — TỪ VỰNG phân loại Đặc Tính (người sửa)
 *   · dict-sources.json     — THƯ MỤC NGUỒN đã duyệt (người sửa). Lần đầu chưa có → script tạo SEED.
 *
 * GHI (output):
 *   · dict-sources.json     — cập nhật: gộp biến thể chắc chắn + thêm nguồn mới (seed) + _reviewQueue
 *                             (các cặp NGHI trùng để người DUYỆT). KHÔNG đụng các trường người đã điền.
 *   · dict-facets.js        — window.DICT_FACETS = { huyet, sources, traits } cho frontend (tra ngược).
 *
 * CHẠY:  node _build-dict.cjs        (chỉ đọc/ghi file, không sửa text gốc trong acupoints.js)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const D = __dirname;

// ───────── nạp dữ liệu nguồn ─────────
global.window = {};
require('./acupoints.js');
require('./acu-index.js');
const ACU = window.ACUPOINTS;
const IDX = window.ACU_INDEX || { codeToId: {} };
const RECORDS = ACU.records;

// mã WHO theo id huyệt (đảo codeToId): để hiển thị "LU9 · Thái Uyên" trong index
const idToCode = {};
for (const [code, id] of Object.entries(IDX.codeToId || {})) if (idToCode[id] == null) idToCode[id] = code;

// ───────── tiện ích chữ ─────────
const secOf = (r, h) => (r.sections || []).find((s) => s.h === h)?.body || '';
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const cleanSrc = (s) =>
  (s || '')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"') // nháy cong → nháy thẳng
    .replace(/\s+/g, ' ')
    .replace(/\s*\.\s*$/, '')                     // bỏ chấm cuối
    .trim();
// KHOÁ GỘP AN TOÀN: chỉ gộp biến thể CHẮC CHẮN cùng 1 nguồn —
//   bỏ dấu + bỏ hoa/thường + gộp từ lặp liền kề ("Phổ Phổ"→"Phổ") + bỏ dấu câu.
//   KHÔNG gộp khi khác từ thật (vd "Đồ" vs "Đồ Phổ") — việc đó để _reviewQueue cho người duyệt.
const safeKey = (s) =>
  norm(cleanSrc(s)).replace(/[^a-z0-9]+/g, ' ').replace(/\b(\w+)( \1\b)+/g, '$1').trim();
const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'nguon';
const tokens = (k) => k.split(' ').filter(Boolean);

// khoảng cách Levenshtein có chặn trên (đủ cho việc dò typo ngắn)
function lev(a, b, max = 3) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur[j] = v;
      if (v < best) best = v;
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const readJson = (f) => (fs.existsSync(path.join(D, f)) ? JSON.parse(fs.readFileSync(path.join(D, f), 'utf8')) : null);

// ════════════════════════ 1) XUẤT XỨ → gom thành nhóm an toàn ════════════════════════
// Phân tích cấu trúc nguồn kinh điển: "Thiên 'X' (Linh Khu 10)" / "(Tố Vấn 59)".
function parseCanon(raw) {
  const m = /\((linh khu|tố vấn|to van)\D*?(\d+)\)/i.exec(raw.normalize('NFC'));
  if (!m) return null;
  const parent = /linh/i.test(m[1]) ? { id: 'linh-khu', ten: 'Linh Khu (Hoàng Đế Nội Kinh)' } : { id: 'to-van', ten: 'Tố Vấn (Hoàng Đế Nội Kinh)' };
  const t = /thiên\s*['"]([^'"]+)['"]/i.exec(raw.normalize('NFC'));
  return { parent, chapter: +m[2], thien: t ? t[1].trim() : '' };
}

const groups = new Map(); // safeKey -> { variants:Map<raw,count>, huyetIds:Set, canon }
for (const r of RECORDS) {
  const raw = cleanSrc(secOf(r, 'XUẤT XỨ'));
  if (!raw) continue;
  const k = safeKey(raw);
  if (!k) continue;
  let g = groups.get(k);
  if (!g) groups.set(k, (g = { key: k, variants: new Map(), huyetIds: new Set(), canon: parseCanon(raw) }));
  g.variants.set(raw, (g.variants.get(raw) || 0) + 1);
  g.huyetIds.add(r.id);
  if (!g.canon) g.canon = parseCanon(raw);
}

// ════════════════════════ 2) Hoà giải với THƯ MỤC NGUỒN đã duyệt ════════════════════════
const prior = readJson('dict-sources.json') || { sources: {} };
const priorSources = prior.sources || {};
// bảng tra: safeKey(tên/alias đã duyệt) → id chuẩn
const keyToId = new Map();
for (const [id, s] of Object.entries(priorSources)) {
  keyToId.set(safeKey(s.ten || id), id);
  for (const a of s.alias || []) keyToId.set(safeKey(a), id);
}

const usedIds = new Set();
const uniqSlug = (base) => {
  let id = base, n = 2;
  while (usedIds.has(id)) id = `${base}-${n++}`;
  usedIds.add(id);
  return id;
};

const sources = {}; // id chuẩn -> bản ghi nguồn
for (const g of [...groups.values()].sort((a, b) => b.huyetIds.size - a.huyetIds.size)) {
  // tìm id chuẩn: nếu 1 biến thể đã có trong thư mục đã duyệt → dùng id đó (giữ công sức người)
  let id = keyToId.get(g.key);
  for (const raw of g.variants.keys()) id = id || keyToId.get(safeKey(raw));
  const variantsByFreq = [...g.variants.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
  const old = id ? priorSources[id] : null;
  if (!id) id = uniqSlug(slugify(variantsByFreq[0]));
  else usedIds.add(id);

  // CỘNG DỒN: nhiều nhóm biến-thể (khác safeKey) có thể cùng trỏ về 1 nguồn chuẩn qua alias
  // → gộp huyetIds & alias thay vì ghi đè (vd "Thiên Kim Phương" + "…Yếu Phương" + "Bị Cấp…").
  const prev = sources[id];
  const ten = (old && old.ten) || prev?.ten || variantsByFreq[0]; // tên người đã đặt > biến thể phổ biến nhất
  const huyetIds = [...new Set([...(prev?.huyetIds || []), ...g.huyetIds])].sort((a, b) => a - b);
  const alias = [...new Set([...(prev?.alias || []), ...(old?.alias || []), ...variantsByFreq])].filter((v) => v !== ten);
  sources[id] = {
    ten,
    alias,
    // metadata người điền — GIỮ NGUYÊN nếu đã có
    tacGia: old?.tacGia ?? '',
    nienDai: old?.nienDai ?? '',
    link: old?.link ?? '',
    ghiChu: old?.ghiChu ?? '',
    // tự động
    parent: prev?.parent || (old && 'parent' in old ? old.parent : g.canon?.parent.id) || '',
    chapter: prev?.chapter ?? (old && 'chapter' in old ? old.chapter : g.canon?.chapter) ?? null,
    thien: prev?.thien || (old && 'thien' in old ? old.thien : g.canon?.thien) || '',
    count: huyetIds.length,
    huyetIds,
    _seed: prev ? prev._seed : old ? undefined : true, // nguồn MỚI script tự tạo → người nên xem & điền link
  };
  // gom thêm khoá để cặp dưới-đây tra được
  keyToId.set(g.key, id);
}

// nguồn cha kinh điển (Linh Khu / Tố Vấn) để Thư Mục có thể gom cây
for (const id of new Set(Object.values(sources).map((s) => s.parent).filter(Boolean))) {
  if (sources[id]) continue;
  const kids = Object.values(sources).filter((s) => s.parent === id);
  const pa = priorSources[id] || {};
  sources[id] = {
    ten: pa.ten || (id === 'linh-khu' ? 'Linh Khu (Hoàng Đế Nội Kinh)' : id === 'to-van' ? 'Tố Vấn (Hoàng Đế Nội Kinh)' : id),
    alias: [], tacGia: pa.tacGia ?? '', nienDai: pa.nienDai ?? '', link: pa.link ?? '', ghiChu: pa.ghiChu ?? '',
    parent: '', chapter: null, thien: '', isParent: true,
    count: kids.reduce((n, s) => n + s.count, 0),
    huyetIds: [...new Set(kids.flatMap((s) => s.huyetIds))].sort((a, b) => a - b),
  };
}

// ════════════════════════ 3) MÁY GỢI Ý — cặp nguồn NGHI trùng (người duyệt) ════════════════════════
// chỉ gợi ý, KHÔNG tự gộp. Tiêu chí: tập từ lệch nhau ≤1 từ (prefix/thừa-thiếu 1 chữ), hoặc typo ngắn.
const reviewQueue = [];
const ids = Object.keys(sources).filter((id) => !sources[id].isParent);
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    const A = sources[ids[i]], B = sources[ids[j]];
    const ka = safeKey(A.ten), kb = safeKey(B.ten);
    if (!ka || !kb || ka === kb) continue;
    const ta = new Set(tokens(ka)), tb = new Set(tokens(kb));
    const onlyA = [...ta].filter((t) => !tb.has(t)), onlyB = [...tb].filter((t) => !ta.has(t));
    let lyDo = '';
    if (onlyA.length + onlyB.length <= 1 && Math.min(ta.size, tb.size) >= 1)
      lyDo = onlyA.length ? `"${A.ten}" = "${B.ten}" + «${onlyA.join(' ')}»` : `"${B.ten}" = "${A.ten}" + «${onlyB.join(' ')}»`;
    else if (Math.max(ka.length, kb.length) >= 7 && lev(ka, kb, 2) <= 2) lyDo = `gần giống (sai chính tả?): "${A.ten}" ~ "${B.ten}"`;
    if (lyDo) reviewQueue.push({ a: ids[i], b: ids[j], tenA: A.ten, tenB: B.ten, soHuyet: [A.count, B.count], lyDo });
  }
}
reviewQueue.sort((x, y) => y.soHuyet[0] + y.soHuyet[1] - (x.soHuyet[0] + x.soHuyet[1]));

// ════════════════════════ 4) ĐẶC TÍNH → phân loại theo từ vựng ════════════════════════
const vocab = readJson('dict-traits.json');
const TRAITS = vocab.traits.map((t) => ({ ...t, re: t.any.map((p) => new RegExp(p, 'iu')) }));
const traits = {};
for (const t of TRAITS) traits[t.id] = { ten: t.ten, nhom: t.nhom || '', moTa: t.moTa || '', count: 0, huyetIds: [] };
for (const r of RECORDS) {
  const dt = (secOf(r, 'ĐẶC TÍNH') || r.noiDung || '').normalize('NFC');
  if (!dt) continue;
  for (const t of TRAITS) if (t.re.some((re) => re.test(dt))) { traits[t.id].huyetIds.push(r.id); traits[t.id].count++; }
}

// ════════════════════════ 5) bảng huyệt tinh gọn (id → tên + mã) ════════════════════════
const huyet = {};
for (const r of RECORDS) huyet[r.id] = { ten: r.ten, code: idToCode[r.id] || '' };

// ════════════════════════ 6) GHI FILE ════════════════════════
// 6a) dict-sources.json — thư mục nguồn (người duyệt tiếp). Sắp id theo số huyệt giảm dần cho dễ đọc.
const sortedSources = {};
for (const id of Object.keys(sources).sort((a, b) => sources[b].count - sources[a].count)) {
  const s = sources[id];
  if (s._seed === undefined) delete s._seed;
  sortedSources[id] = s;
}
const sourcesOut = {
  _doc:
    'THƯ MỤC NGUỒN (Xuất Xứ). Mỗi nguồn = 1 bản ghi: gom mọi biến thể vào alias[], điền tacGia/nienDai/link để ĐỐI CHIẾU. ' +
    'Sửa tay rồi chạy lại "node _build-dict.cjs": script GIỮ tên/alias/link bạn đã sửa, chỉ làm mới count & huyetIds. ' +
    '_seed:true = nguồn script vừa tự tạo, bạn nên xem lại & bổ sung link. _reviewQueue = cặp NGHI trùng — nếu đúng là một, ' +
    'hãy gộp tay: thêm tên nguồn kia vào alias[] của nguồn giữ lại, rồi xoá bản ghi kia, rồi chạy lại.',
  _reviewQueue: reviewQueue,
  sources: sortedSources,
};
fs.writeFileSync(path.join(D, 'dict-sources.json'), JSON.stringify(sourcesOut, null, 2) + '\n', 'utf8');

// 6b) dict-facets.js — index cho frontend (window.DICT_FACETS)
const facets = {
  generatedFrom: '_build-dict.cjs',
  count: { huyet: RECORDS.length, sources: Object.keys(sortedSources).length, traits: Object.keys(traits).length },
  huyet,
  sources: sortedSources,
  traits,
};
// strip trường nội bộ khỏi bản frontend
for (const s of Object.values(facets.sources)) delete s._seed;
fs.writeFileSync(
  path.join(D, 'dict-facets.js'),
  '/* TỰ SINH bởi _build-dict.cjs — KHÔNG sửa tay. window.DICT_FACETS = { huyet, sources, traits }. */\n' +
    'window.DICT_FACETS = ' + JSON.stringify(facets) + ';\n',
  'utf8',
);

// ════════════════════════ 7) BÁO CÁO ════════════════════════
const seedCount = Object.values(sortedSources).filter((s) => s._seed).length;
const noLink = Object.values(sortedSources).filter((s) => !s.link && !s.isParent).length;
console.log('✔ XONG.');
console.log(`  Huyệt           : ${RECORDS.length}`);
console.log(`  Nguồn chuẩn     : ${Object.keys(sortedSources).length} (gom từ ${groups.size} nhóm an toàn; nguồn mới/seed: ${seedCount}; chưa có link: ${noLink})`);
console.log(`  Loại Đặc Tính   : ${Object.keys(traits).length}`);
console.log(`  Cặp NGHI trùng  : ${reviewQueue.length} (xem _reviewQueue trong dict-sources.json)`);
console.log('\n— Top 12 nguồn theo số huyệt —');
for (const id of Object.keys(sortedSources).slice(0, 12))
  console.log(`  ${String(sortedSources[id].count).padStart(4)}  ${id}  «${sortedSources[id].ten}»${sortedSources[id].alias.length ? '  +' + sortedSources[id].alias.length + ' biến thể' : ''}`);
console.log('\n— Phân loại Đặc Tính —');
for (const id of Object.keys(traits).sort((a, b) => traits[b].count - traits[a].count))
  if (traits[id].count) console.log(`  ${String(traits[id].count).padStart(4)}  [${traits[id].nhom}] ${traits[id].ten}`);
console.log('\n— Cặp NGHI trùng cần bạn DUYỆT (máy gợi ý, không tự gộp) —');
for (const r of reviewQueue.slice(0, 20)) console.log(`  · ${r.lyDo}  [${r.soHuyet.join(' / ')} huyệt]`);
if (reviewQueue.length > 20) console.log(`  … và ${reviewQueue.length - 20} cặp nữa.`);
