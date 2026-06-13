/* solver — Giải toạ độ huyệt từ ràng buộc (parse-vitri) + khung cốt-độ (model-frame).
 * Phương pháp: nội suy dọc trục xương giữa 2 mốc; ràng buộc thừa → CROSS-CHECK (đo lệch).
 * Phụ thuộc thứ tự: huyệt neo vào huyệt khác giải SAU (topological sort).                */
const { L, AXES, LAT_CUN, pickAxis, lateralRegion, isMidline } = require('./model-frame.cjs');

const VERT_FALLBACK = { head: 0.013, torso: 0.021, arm: 0.011, leg: 0.013 }; // thốn dọc khi mốc không có trục

const isLandmark = id => id && Object.prototype.hasOwnProperty.call(L, id);

// vector cho +1 thốn dọc trục (near→far)
function perCun(axisName) {
  const ax = AXES[axisName], a = L[ax.near], b = L[ax.far];
  return { x: (b.x - a.x) / ax.cun, y: (b.y - a.y) / ax.cun, z: (b.z - a.z) / ax.cun, cunLen: ax.cun };
}
// dấu để Δy khớp hướng (up: y tăng, down: y giảm; free/up cùng nhánh)
function signFor(per, dir) {
  if (dir === 'down') return per.y > 0 ? -1 : 1;
  return per.y < 0 ? -1 : 1;                 // up | free
}

// Bước dọc 1 ràng buộc vertical/free → {base, axisInfo}.  ctx.solved: map code→{pos,axisInfo}
function stepAlong(c, ctx) {
  const ref = c.ref;
  if (isLandmark(ref)) {
    const pick = pickAxis(ref, c.dir === 'down' ? 'down' : 'up');
    if (pick) {
      const per = perCun(pick.axis), sgn = signFor(per, c.dir);
      const from = L[pick.from];
      return {
        base: { x: from.x + per.x * c.cun * sgn, y: from.y + per.y * c.cun * sgn, z: from.z + per.z * c.cun * sgn },
        axisInfo: { axis: pick.axis, dir: c.dir },
      };
    }
    // mốc không có trục (đồng tử, đường giữa…): bước y theo scale vùng
    const reg = lateralRegion(ref), sc = VERT_FALLBACK[reg] || 0.018;
    const sgn = c.dir === 'down' ? -1 : 1;
    const from = L[ref];
    return { base: { x: from.x, y: from.y + sc * c.cun * sgn, z: from.z }, axisInfo: null };
  }
  // neo vào huyệt khác
  const sp = ctx.solved[ref];
  if (sp) {
    const axisName = (sp.axisInfo && sp.axisInfo.axis) || guessAxisByCode(ref);
    if (axisName) {
      const per = perCun(axisName), sgn = signFor(per, c.dir);
      return {
        base: { x: sp.pos.x + per.x * c.cun * sgn, y: sp.pos.y + per.y * c.cun * sgn, z: sp.pos.z + per.z * c.cun * sgn },
        axisInfo: sp.axisInfo || { axis: axisName, dir: c.dir },
      };
    }
    const reg = 'torso', sc = VERT_FALLBACK[reg], sgn = c.dir === 'down' ? -1 : 1;
    return { base: { x: sp.pos.x, y: sp.pos.y + sc * c.cun * sgn, z: sp.pos.z }, axisInfo: null };
  }
  return null;
}

// đoán trục theo mã huyệt (khi neo huyệt chưa rõ axisInfo)
function guessAxisByCode(code) {
  const m = code.replace(/\d+$/, ''), n = +code.replace(/\D/g, '');
  if (m === 'CV') return n <= 8 ? 'abd_lower' : 'abd_upper';
  return null;
}

function anchorPos(id, ctx) {
  if (isLandmark(id)) return { ...L[id] };
  if (ctx.solved[id]) return { ...ctx.solved[id].pos };
  return null;
}

// Giải 1 huyệt.  parsed: kết quả parseVitri.  return {pos, axisInfo, q, checks[]} | null
function resolvePoint(parsed, ctx) {
  const verts = parsed.constraints.filter(c => c.axis === 'vertical' || c.axis === 'free');
  const lats = parsed.constraints.filter(c => c.axis === 'lateral');

  // primary vertical = ràng buộc có ref giải được (ưu tiên landmark)
  const resolvable = c => isLandmark(c.ref) || (c.ref && ctx.solved[c.ref]);
  const primary = verts.find(c => isLandmark(c.ref)) || verts.find(resolvable) || verts[0];

  let base, axisInfo = null;
  if (primary && resolvable(primary)) {
    const r = stepAlong(primary, ctx);
    if (!r) return null;
    base = r.base; axisInfo = r.axisInfo;
  } else {
    base = anchorPos(parsed.anchor, ctx);
    if (!base) return null;
    axisInfo = (ctx.solved[parsed.anchor] || {}).axisInfo || null;
  }

  // lateral offset (sau khi đã có cao độ)
  // THÂN: thốn ngang đo DỌC MẶT CONG → nén theo cung tròn (x = R·sinθ, z giảm theo R·(1-cosθ)),
  //       tránh huyệt xa (vd 6 thốn) bị "thẳng tay" lọt ra vai. Chi: tuyến tính (offset nhỏ).
  const T_RX = 0.135, T_RZ = 0.105;                 // bán kính tiết diện thân (chuẩn-hoá)
  const pos = { x: base.x, y: base.y, z: base.z };
  for (const lc of lats) {
    const reg = lateralRegion(lc.ref || parsed.anchor || '');
    const sgn = lc.dir === 'in' ? -1 : 1;
    let dx, dz = 0;
    if (reg === 'torso') {
      const theta = (LAT_CUN.torso * lc.cun) / T_RX;
      dx = sgn * T_RX * Math.sin(theta);
      dz = -T_RZ * (1 - Math.cos(theta));           // cuốn ra sườn → nông dần
    } else {
      dx = sgn * (LAT_CUN[reg] || LAT_CUN.torso) * lc.cun;
    }
    if (isMidline(lc.ref)) { pos.x = dx; pos.z = base.z + dz; } else { pos.x += dx; pos.z += dz; }
  }

  // CROSS-CHECK: các vertical khác phải ra cùng điểm → đo lệch (thốn)
  const checks = [];
  for (const c of verts) {
    if (c === primary || !resolvable(c)) continue;
    const r = stepAlong(c, ctx); if (!r) continue;
    const alt = { x: r.base.x, y: r.base.y, z: r.base.z };
    for (const lc of lats) {
      const reg = lateralRegion(lc.ref || ''), dx = (lc.dir === 'in' ? -1 : 1) * (LAT_CUN[reg] || LAT_CUN.torso) * lc.cun;
      if (isMidline(lc.ref)) alt.x = dx; else alt.x += dx;
    }
    const d = Math.hypot(pos.x - alt.x, pos.y - alt.y, pos.z - alt.z);
    checks.push({ ref: c.ref, cun: c.cun, dist: +d.toFixed(4) });
  }

  return { pos: { x: +pos.x.toFixed(4), y: +pos.y.toFixed(4), z: +pos.z.toFixed(4) }, axisInfo, q: parsed.quality, checks };
}

// Giải CẢ TẬP huyệt với topological sort theo phụ thuộc ref-huyệt.
// seed: map code→{pos,axisInfo} có sẵn (vd vị trí WHO đã lấp) để huyệt phụ thuộc giải được.
function solveAll(parsedByCode, seed = {}) {
  const codes = Object.keys(parsedByCode);
  const solved = { ...seed }, ctx = { solved };
  const pending = new Set(codes);
  let progress = true, pass = 0;
  const unresolved = [];

  while (pending.size && progress && pass < 12) {
    progress = false; pass++;
    for (const code of [...pending]) {
      const parsed = parsedByCode[code];
      // chỉ giải khi mọi ref-huyệt cần thiết đã có (hoặc ref là landmark)
      const need = parsed.constraints.map(c => c.ref).concat(parsed.anchor)
        .filter(r => r && !isLandmark(r) && /^[A-Z]{2}\d+$/.test(r));
      if (need.some(r => !solved[r] && parsedByCode[r])) continue;   // đợi ref huyệt
      const res = resolvePoint(parsed, ctx);
      if (res) { solved[code] = res; pending.delete(code); progress = true; }
    }
  }
  for (const code of pending) unresolved.push(code);
  return { solved, unresolved };
}

module.exports = { solveAll, resolvePoint };
