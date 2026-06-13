/* solve-coords — "CĂN TỔNG THỂ" phía backend.
 *
 * Gói lại logic của crossval.cjs (đối chiếu SÁCH + WHO + MỐC/chấm tay) THÀNH 1 HÀM THUẦN,
 * KHÔNG đọc/ghi file, trả thẳng toạ độ engine để frontend dùng (định dạng giống bake.cjs).
 *
 *   solveCoords(mers, userAnchors) -> { points: { CODE: {x,y,z,q,snap,src,conf,anchor?,snapDir?} },
 *                                       mers, n }
 *     mers        : danh sách kinh cần giải (mặc định ['LU','ST','CV'] + mọi kinh có trong chốt)
 *     userAnchors : { CODE: {x,y,z} } các chốt CHẤM TAY (đã chuẩn-hoá theo bodyHeight)
 *
 * An toàn cho server: chốt người dùng có thể GHI ĐÈ TẠM mốc giải phẫu trong L (model-frame);
 * ta snapshot L → áp override → giải (đồng bộ) → KHÔI PHỤC L, nên gọi lại/đồng thời vẫn đúng. */
const { L } = require('./model-frame.cjs');
const { parseVitri } = require('./parse-vitri.cjs');
const { solveAll, resolvePoint } = require('./solver.cjs');
const WHO = require('./who-ref.cjs');
const { buildAnchors, resolveAnchors } = require('./anchors.cjs');
const DATA = require('./vitri-data.json');

const TOL = 0.025; // ngưỡng đồng thuận (chuẩn-hoá ≈ 4mm)
const merOf = (c) => c.replace(/\d+$/, '');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

// huyệt MẶT TRƯỚC THÂN → dán từ phía trước (khớp bake.cjs)
function isFront(code) {
  const m = merOf(code),
    n = +code.replace(/\D/g, '');
  return m === 'CV' || code === 'LU1' || code === 'LU2' || (m === 'ST' && n <= 30);
}

// crossval thuần: đối chiếu đa nguồn → { code: {pos, source, label, anchor?} }
function crossval(mers, anchorMap) {
  // ---------- Nguồn 1: SÁCH (parse VỊ TRÍ) ----------
  const bookParsed = {};
  for (const p of DATA.points) {
    if (!mers.includes(p.mer) || !p.vitri) continue;
    bookParsed[p.code] = parseVitri(p.vitri, { nameToCode: DATA.nameToCode });
  }
  // ---------- TẦNG 1: MỐC HUYỆT (cắm trước, làm xương sống) ----------
  const ANCH = resolveAnchors(anchorMap); // { code:{pos,why,at,user} }
  const anchorSeed = {};
  for (const [c, a] of Object.entries(ANCH)) if (mers.includes(merOf(c))) anchorSeed[c] = { pos: a.pos };

  // ---------- Nguồn 2: WHO (giải TRƯỚC, seed bằng MỐC) ----------
  const who = {};
  {
    const ctx0 = { solved: { ...anchorSeed } };
    for (const [code, def] of Object.entries(WHO)) {
      if (!mers.includes(merOf(code))) continue;
      if (def.pos) {
        who[code] = { pos: def.pos };
        ctx0.solved[code] = { pos: def.pos };
        continue;
      }
      if (def.constraints) {
        const r = resolvePoint({ constraints: def.constraints, anchor: def.constraints[0].ref, quality: 'cun' }, ctx0);
        if (r) {
          who[code] = { pos: r.pos };
          ctx0.solved[code] = r;
        }
      }
    }
  }

  // ---------- Nguồn 1: SÁCH (seed bằng MỐC + WHO) ----------
  const whoSeed = {};
  for (const [c, w] of Object.entries(who)) whoSeed[c] = { pos: w.pos };
  const bookSeed = { ...whoSeed, ...anchorSeed }; // MỐC ưu tiên hơn WHO khi trùng
  const book = solveAll(bookParsed, bookSeed).solved;
  const fromSeed = (code) => book[code] && bookSeed[code] && book[code] === bookSeed[code];

  // ---------- HỢP NHẤT + ĐỘ TIN ----------
  const final = {};
  const codes = [...new Set([...Object.keys(bookParsed), ...Object.keys(who), ...Object.keys(anchorSeed)])];

  for (const code of codes) {
    // TẦNG 1: MỐC HUYỆT — ưu tiên tuyệt đối
    if (ANCH[code]) {
      final[code] = { pos: ANCH[code].pos, source: 'anchor', label: 'mốc', anchor: true };
      continue;
    }
    const bq = bookParsed[code] && bookParsed[code].quality;
    const bookHas = book[code] && !fromSeed(code) && (bq === 'cun' || !who[code]);
    const b = bookHas ? book[code] : null,
      w = who[code];
    let pos = null,
      primary = null;
    if (b) {
      pos = b.pos;
      primary = 'book';
    } else if (w) {
      pos = w.pos;
      primary = 'who';
    }
    if (!pos) {
      final[code] = { source: 'none', label: 'cần soát' };
      continue;
    }

    let corrob = 0;
    const internalOK = b && b.checks && b.checks.length && b.checks.every((c) => c.dist < 0.03);
    if (internalOK) corrob++;
    let whoDelta = null;
    if (b && w) {
      whoDelta = dist(b.pos, w.pos);
      if (whoDelta < TOL) corrob++;
    }
    // HYBRID: book & WHO lệch LỚN → WHO trọng tài
    if (primary === 'book' && whoDelta != null && whoDelta > 0.05) {
      pos = w.pos;
      primary = 'who-arb';
      corrob = 0;
    }

    let label;
    if (primary === 'who-arb') label = 'WHO-trọng tài';
    else if (primary === 'book' && corrob >= 2) label = 'khoá';
    else if (primary === 'book' && corrob === 1) label = 'cao';
    else if (primary === 'book') label = 'tạm';
    else label = 'WHO-lấp';

    final[code] = { pos, source: primary, label };
  }
  return final;
}

// final (crossval) -> toạ độ engine (giống bake.cjs)
function toEngineCoords(final) {
  const points = {};
  for (const [code, f] of Object.entries(final)) {
    if (!f.pos) continue;
    const exact = f.label === 'mốc' || f.label === 'khoá' || f.label === 'cao';
    const pt = {
      x: +f.pos.x.toFixed(4),
      y: +f.pos.y.toFixed(4),
      z: +f.pos.z.toFixed(4),
      q: exact ? 'exact' : 'approx',
      snap: true,
      src: f.source,
      conf: f.label,
    };
    if (f.anchor) pt.anchor = true;
    if (isFront(code)) pt.snapDir = 'front';
    points[code] = pt;
  }
  return points;
}

function solveCoords(mers, userAnchors) {
  userAnchors = userAnchors || {};
  // mặc định LU/ST/CV + mọi kinh người dùng đã chấm (để chốt luôn được giải)
  const set = new Set((mers && mers.length ? mers : ['LU', 'ST', 'CV']).slice());
  for (const c of Object.keys(userAnchors)) set.add(merOf(c));
  const merList = [...set];

  const { anchorMap, landmarkOverrides } = buildAnchors(userAnchors);

  // ÁP TẠM override mốc vào L, giải (đồng bộ), rồi KHÔI PHỤC → solver giữ thuần với mọi request.
  const snapshot = {};
  for (const [k, v] of Object.entries(landmarkOverrides)) {
    if (!L[k]) continue;
    snapshot[k] = { x: L[k].x, y: L[k].y, z: L[k].z };
    L[k].x = v.x;
    L[k].y = v.y;
    L[k].z = v.z;
  }
  try {
    const points = toEngineCoords(crossval(merList, anchorMap));
    return { points, mers: merList, n: Object.keys(points).length };
  } finally {
    for (const [k, v] of Object.entries(snapshot)) {
      L[k].x = v.x;
      L[k].y = v.y;
      L[k].z = v.z;
    }
  }
}

module.exports = { solveCoords };
