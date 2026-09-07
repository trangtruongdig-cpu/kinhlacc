/* interface-solver — TẦNG 4 của engine: lấy toạ độ do cốt độ/WHO/mốc đưa ra, rồi TRƯỢT nó vào
 * đúng khe giải phẫu mà sách mô tả.
 *
 * Vào : { code, pos (cốt độ đã giải), vitri (câu sách), region }
 * Ra  : { pos (đã trượt), kind, gapCun, slideCun, conf, rule, warns[] }
 *
 * Quy tắc thi hành ở đây (chi tiết trong tissue-rules.cjs):
 *   · giữ NGUYÊN cao độ y — khe chỉ sửa (x, z);
 *   · trượt tối đa MAX_SLIDE_CUN thốn, quá ngưỡng coi là hai nguồn mâu thuẫn → KHÔNG tự sửa;
 *   · chọn ràng buộc khoẻ nhất: "giữa A và B" > "sát bờ A (có phía)" > "sát bờ A";
 *   · điểm cuối chiếu ra mặt da; kiểm ba điều cấm (trong xương / giữa bụng cơ / trên lòng mạch).  */
const { RULES, gapKind, GAP_LABEL, gapConfidence, safetyCheck } = require('./tissue-rules.cjs');
const { parseTissue } = require('./parse-tissue.cjs');
const { lookup, conceptsOf } = require('./tissue-lexicon.cjs');
const G = require('./interface-geom.cjs');
const { LAT_CUN } = require('./model-frame.cjs');

/** gom mọi khối atlas của một mô (đã lọc bên; gân → 20% đầu xa) thành 1 đám mây */
function cloudFor(atlas, ref, p0, sideSign, cache) {
  const entry = lookup(ref.id);
  if (!entry || entry.missing) return null;
  const key = `${ref.id}|${ref.tendonOf ? 'gan' : 'co'}|${sideSign}`;
  if (cache && cache.has(key)) return cache.get(key);
  const ids = conceptsOf(entry, atlas);
  if (!ids.length) return null;
  let all = [];
  for (const id of ids) { const p = atlas.points(id); if (p) all.push(p); }
  if (!all.length) return null;
  let merged = new Float32Array(all.reduce((s, a) => s + a.length, 0));
  let o = 0; for (const a of all) { merged.set(a, o); o += a.length; }
  merged = G.pickSide(merged, sideSign);
  if (ref.tendonOf) {
    const tail = G.tendonPart(merged, p0);
    // gân nằm ngoài tầm huyệt (vd huyệt ở cổ chân, gân cơ đã xuống tận mu chân) → quay lại dùng cả
    // khối cơ thay vì trả rỗng: thà lấy bờ cơ còn hơn bỏ mất ràng buộc.
    merged = G.nearWindow(tail, p0, 0.05).length >= 6 ? tail : merged;
  }
  if (cache) cache.set(key, merged);
  return merged;
}

const REGION_CUN = { arm: LAT_CUN.arm, leg: LAT_CUN.leg, head: LAT_CUN.head, torso: LAT_CUN.torso, back: LAT_CUN.back };

/** vùng cơ thể → độ dài 1 thốn ngang (chuẩn-hoá). Ưu tiên vùng do solver truyền xuống.
 *  Chặn trên bằng thốn đồng-thân (1/75 chiều cao, nới 15%): LAT_CUN.torso/head của model-frame
 *  đang phóng đại hơn gấp đôi (xem ghi chú MAX_SLIDE_ABS trong tissue-rules.cjs), nếu dùng thẳng
 *  thì cả cửa sổ dò mô lẫn ngưỡng trượt đều nở ra theo. */
function cunLenOf(region, pos) {
  const CAP = RULES.CUN_ANTHRO * 1.15;
  if (region && REGION_CUN[region]) return Math.min(REGION_CUN[region], CAP);
  if (pos.y > 0.86) return Math.min(LAT_CUN.head, CAP);
  if (Math.abs(pos.x) > 0.095 && pos.y > 0.42) return Math.min(LAT_CUN.arm, CAP);
  if (pos.y < 0.55 && Math.abs(pos.x) <= 0.095) return Math.min(LAT_CUN.leg, CAP);
  return Math.min(LAT_CUN.torso, CAP);
}

/** thứ tự ưu tiên ràng buộc: khe 2 mô > bờ có phía > bờ chung */
function ruleScore(r) {
  if (r.type === 'between') return 3;
  if (r.type === 'border' && r.side) return 2;
  if (r.type === 'border') return 1;
  return 0;
}

/**
 * @param {object} atlas   mesh-io.loadAtlas()
 * @param {object} inp     { code, pos, vitri, region, locked }
 * @param {object} opts    { cache, safety: bool }
 */
function refineByTissue(atlas, inp, opts = {}) {
  const out = { code: inp.code, applied: false, pos: inp.pos, rules: 0, warns: [], conf: null, note: null };
  if (!inp.pos || !inp.vitri) return out;
  if (inp.locked) { out.note = 'huyệt đã chốt bằng mốc/chấm tay — khe mô không đụng vào'; return out; }

  const parsed = parseTissue(inp.vitri);
  const usable = parsed.rules.filter(r => (r.type === 'between' && !r.a.missing && !r.b.missing) || (r.type === 'border' && !r.a.missing));
  out.rules = usable.length;
  if (parsed.missing.length) out.missingTissues = parsed.missing.map(m => m.vi);
  if (!usable.length) { out.note = parsed.rules.length ? 'chỉ có mô tả vùng, không đủ để định khe' : 'câu vị trí không nhắc mô nào'; return out; }

  const p0 = inp.pos;
  const sideSign = Math.sign(p0.x) || 1;
  const cunLen = cunLenOf(inp.region, p0);
  const cache = opts.cache;

  // ---- tính ứng viên cho từng ràng buộc, giữ cái điểm cao nhất & trượt ít nhất ----
  const cands = [];
  for (const r of usable.sort((a, b) => ruleScore(b) - ruleScore(a))) {
    if (r.type === 'between') {
      const A = cloudFor(atlas, r.a, p0, sideSign, cache), B = cloudFor(atlas, r.b, p0, sideSign, cache);
      if (!A || !B) continue;
      const g = G.gapBetween(A, B, p0, cunLen);
      if (!g) continue;
      cands.push({
        rule: r, pos: g.p, gapCun: g.gapCun, score: ruleScore(r),
        kind: gapKind(r.a.tissue, r.b.tissue), label: `${r.a.vi}${r.a.tendonOf ? ' (gân)' : ''} | ${r.b.vi}${r.b.tendonOf ? ' (gân)' : ''}`,
      });
    } else {
      const A = cloudFor(atlas, r.a, p0, sideSign, cache);
      if (!A) continue;
      const b = G.borderOf(A, p0, r.side, cunLen, sideSign);
      if (!b) continue;
      cands.push({
        rule: r, pos: b.p, gapCun: null, score: ruleScore(r),
        kind: null, label: `bờ ${r.side || '?'} ${r.a.vi}${r.a.tendonOf ? ' (gân)' : ''}`,
      });
    }
  }
  if (!cands.length) { out.note = 'không dựng được hình học cho mô đã nhận diện'; return out; }

  for (const c of cands) c.slideCun = Math.hypot(c.pos.x - p0.x, c.pos.z - p0.z) / cunLen;
  cands.sort((a, b) => (b.score - a.score) || (a.slideCun - b.slideCun));
  const best = cands[0];

  out.kind = best.kind;
  out.kindLabel = best.kind ? GAP_LABEL[best.kind] : null;
  out.tissues = best.label;
  out.gapCun = best.gapCun != null ? +best.gapCun.toFixed(2) : null;

  // ---- chiếu ra da TRƯỚC, rồi mới chấm điểm: điểm châm là điểm trên da, nên quãng dời phải đo
  //      trên chính điểm cuối cùng (trước đây đo ở điểm khe nằm sâu → chấm điểm sai) ----
  let pos = best.pos, base = p0;
  const skin = atlas.points((atlas.search(/^skin$/i)[0] || {}).conceptId);
  if (skin) {
    const s = G.toSkin(skin, pos, cunLen, p0);
    if (s.depthCun != null && s.depthCun > RULES.SKIN_SNAP_CUN) { pos = s.p; out.gapDepthCun = +s.depthCun.toFixed(2); }
    // So sánh phải CÔNG BẰNG: app luôn dán huyệt ra da khi vẽ (map3d.js `limbPoint`), nên quãng dời
    // thật mà người dùng thấy là giữa hai điểm ĐÃ DÁN DA, không phải giữa hai toạ độ nội bộ (toạ độ
    // cũ nhiều huyệt nằm sâu 1–2 thốn trong thịt mà trên màn hình vẫn đúng chỗ nhờ dán da).
    const s0 = G.toSkin(skin, p0, cunLen);
    if (s0.depthCun != null) { out.oldDepthCun = +s0.depthCun.toFixed(2); base = s0.p; }
  }
  const matchedBoth = best.rule.type === 'between';
  /* LUẬT B — mô tả mơ hồ chỉ đủ để XÁC NHẬN, không đủ để DI DỜI. "Sát bờ xương ức" mà không nói
   * bờ nào thì borderOf chỉ biết lấy điểm mô gần nhất, tức mặt xương — dời theo đó là đoán mò. */
  const vague = best.rule.type === 'border' && !best.rule.side;
  const slideAbs = Math.hypot(pos.x - base.x, pos.z - base.z);
  out.slideCun = +(slideAbs / cunLen).toFixed(2);
  out.slideAbs = +slideAbs.toFixed(4);
  // tách rõ hai thành phần để người soát khỏi hiểu nhầm: TRƯỢT trên mặt da (đổi chỗ thật) khác với
  // ĐẨY RA DA theo pháp tuyến (chỉ là đưa toạ độ nội bộ lên bề mặt, app vốn đã dán da khi vẽ).
  out.depthAbs = +Math.hypot(p0.x - base.x, p0.y - base.y, p0.z - base.z).toFixed(4);
  out.conf = slideAbs > RULES.MAX_SLIDE_ABS ? 'mau-thuan'
    : gapConfidence({ gapCun: best.gapCun, slideCun: out.slideCun, matchedBoth });

  if (vague && out.slideCun >= 0.25) {
    out.conf = 'mo-ho';
    out.note = `mô tả "${best.label}" không nêu phía nào — chỉ đủ xác nhận, không đủ để dời ${out.slideCun} thốn`;
    out.candPos = { x: +pos.x.toFixed(4), y: +pos.y.toFixed(4), z: +pos.z.toFixed(4) };
    return out;
  }

  if (out.conf === 'mau-thuan') {
    const cap = matchedBoth ? RULES.MAX_SLIDE_CUN : RULES.MAX_SLIDE_CUN_BORDER;
    out.note = slideAbs > RULES.MAX_SLIDE_ABS
      ? `khe cách chỗ cốt độ chỉ ra ${(slideAbs * 171.9).toFixed(1)} cm (trần ${(RULES.MAX_SLIDE_ABS * 171.9).toFixed(1)} cm) — giữ nguyên toạ độ cũ, cần soát`
      : `khe cách chỗ cốt độ chỉ ra ${out.slideCun} thốn (> ${cap}) — giữ nguyên toạ độ cũ, cần soát`;
    // giữ lại điểm khe để trang soát vẽ được "chỗ mà khe chỉ tới", dù engine không nhận
    out.candPos = { x: +pos.x.toFixed(4), y: +pos.y.toFixed(4), z: +pos.z.toFixed(4) };
    return out;
  }
  if (out.conf === 'khe-khong-thay') {
    out.note = `hai mô cách nhau ${out.gapCun} thốn — không thấy khe thật ở cao độ này`;
    return out;
  }

  /* LUẬT A — điều cấm số 1 phải CHẶN, không chỉ cảnh báo. Một điểm dời tới trong lòng xương thì
   * sai chắc chắn, dù mô tả sách khớp: CV21 từng bị "bờ ? xương ức" kéo chui vào thân xương ức. */
  const moving = out.slideCun >= 0.25;
  if (moving || opts.safety) {
    const pr = G.probe(atlas, pos, cunLen);
    out.warns = safetyCheck(pr);
    if (moving && pr.insideBone) {
      out.conf = 'pham-dieu-cam';
      out.note = 'khe dời vào trong lòng xương — rút lại, cần soát';
      out.candPos = { x: +pos.x.toFixed(4), y: +pos.y.toFixed(4), z: +pos.z.toFixed(4) };
      return out;
    }
  }
  out.applied = true;
  out.pos = { x: +pos.x.toFixed(4), y: +pos.y.toFixed(4), z: +pos.z.toFixed(4) };
  return out;
}

module.exports = { refineByTissue, cunLenOf };
