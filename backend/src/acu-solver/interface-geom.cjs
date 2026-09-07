/* interface-geom — HÌNH HỌC KHE: biến ràng buộc chữ ("giữa gân A và gân B") thành TOẠ ĐỘ.
 *
 * Mọi hàm ở đây làm việc trên đám mây điểm THẬT của mesh Human Atlas (mesh-io.cjs), toạ độ đã
 * chuẩn-hoá theo chiều cao — cùng hệ với model-frame.cjs.
 *
 * NGUYÊN TẮC BẤT DI BẤT DỊCH (tissue-rules): khe KHÔNG được đổi CAO ĐỘ của huyệt. Cốt độ (thốn)
 * đã chốt y; khe chỉ trả lời "trong lát cắt ngang tại y đó, huyệt nằm chỗ nào" → mọi kết quả đều
 * bị ép về đúng y của điểm khởi đầu trước khi trả về.
 *
 * GÂN: atlas không dựng gân riêng (trừ gân gót) → "gân của cơ X" = 20% ĐẦU XA của khối cơ X tính
 * theo trục dọc, phía gần khớp mà huyệt đang đứng (suy từ y của điểm khởi đầu).                   */
const { RULES } = require('./tissue-rules.cjs');

/** lọc theo bên: engine dùng x>0 cho `side:1`; atlas dựng cả 2 bên trong cùng khái niệm. */
function pickSide(xyz, sideSign) {
  if (!sideSign) return xyz;
  const out = [];
  for (let i = 0; i < xyz.length; i += 3) if (Math.sign(xyz[i]) === sideSign || xyz[i] === 0) out.push(xyz[i], xyz[i + 1], xyz[i + 2]);
  return Float32Array.from(out);
}

/** điểm nằm trong hộp bán kính R quanh p0 (rẻ hơn hình cầu, đủ cho lọc thô) */
function nearWindow(xyz, p0, R) {
  const out = [];
  for (let i = 0; i < xyz.length; i += 3) {
    const dx = xyz[i] - p0.x, dy = xyz[i + 1] - p0.y, dz = xyz[i + 2] - p0.z;
    if (Math.abs(dx) <= R && Math.abs(dy) <= R && Math.abs(dz) <= R) out.push(xyz[i], xyz[i + 1], xyz[i + 2]);
  }
  return Float32Array.from(out);
}

/** 35% đầu xa của khối cơ (phần chuyển thành gân) — chọn đầu GẦN huyệt hơn.
 *  35% chứ không phải 20%: gân nhiều cơ dài (duỗi ngón cái, chày trước) bắt đầu từ khoảng 1/3 dưới. */
function tendonPart(xyz, p0) {
  let mnY = Infinity, mxY = -Infinity;
  for (let i = 1; i < xyz.length; i += 3) { if (xyz[i] < mnY) mnY = xyz[i]; if (xyz[i] > mxY) mxY = xyz[i]; }
  const len = mxY - mnY;
  if (!(len > 0)) return xyz;
  const lower = Math.abs(p0.y - mnY) <= Math.abs(p0.y - mxY);   // huyệt gần đầu dưới hay đầu trên?
  const cut = lower ? mnY + 0.35 * len : mxY - 0.35 * len;
  const out = [];
  for (let i = 0; i < xyz.length; i += 3) {
    const y = xyz[i + 1];
    if (lower ? y <= cut : y >= cut) out.push(xyz[i], y, xyz[i + 2]);
  }
  return out.length >= 6 ? Float32Array.from(out) : xyz;
}

/** khoảng cách tới điểm gần nhất trong đám mây + chính điểm đó */
function nearest(xyz, p) {
  let best = Infinity, bx = 0, by = 0, bz = 0;
  for (let i = 0; i < xyz.length; i += 3) {
    const dx = xyz[i] - p.x, dy = xyz[i + 1] - p.y, dz = xyz[i + 2] - p.z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < best) { best = d; bx = xyz[i]; by = xyz[i + 1]; bz = xyz[i + 2]; }
  }
  return { d: Math.sqrt(best), p: { x: bx, y: by, z: bz } };
}

/**
 * KHE giữa hai mô. Chọn cặp điểm (a∈A, b∈B) tối ưu hoá: khe hẹp + trung điểm gần vị trí cốt độ.
 * Trả { p, gap, aPoint, bPoint } — p ĐÃ ép về y của p0. null nếu một bên không có điểm trong cửa sổ.
 */
function gapBetween(A, B, p0, cunLen) {
  const R = RULES.SLICE_HALF_CUN * cunLen * 2.2;
  const a = nearWindow(A, p0, R), b = nearWindow(B, p0, R);
  if (a.length < 3 || b.length < 3) return null;
  let best = Infinity, res = null;
  for (let i = 0; i < a.length; i += 3) {
    for (let k = 0; k < b.length; k += 3) {
      const dx = a[i] - b[k], dy = a[i + 1] - b[k + 1], dz = a[i + 2] - b[k + 2];
      const gap = Math.hypot(dx, dy, dz);
      const mx = (a[i] + b[k]) / 2, my = (a[i + 1] + b[k + 1]) / 2, mz = (a[i + 2] + b[k + 2]) / 2;
      const off = Math.hypot(mx - p0.x, my - p0.y, mz - p0.z);
      const cost = gap + off;                       // khe hẹp NHƯNG cũng phải gần chỗ cốt độ chỉ ra
      if (cost < best) {
        best = cost;
        res = { p: { x: mx, y: p0.y, z: mz }, gap, gapCun: gap / cunLen, aPoint: { x: a[i], y: a[i + 1], z: a[i + 2] }, bPoint: { x: b[k], y: b[k + 1], z: b[k + 2] } };
      }
    }
  }
  return res;
}

const SIDE_AXIS = {
  ngoai: (p, sign) => sign * p.x,      // ra xa đường giữa
  trong: (p, sign) => -sign * p.x,
  truoc: p => p.z,
  sau: p => -p.z,
  tren: p => p.y,
  duoi: p => -p.y,
};

/**
 * BỜ của một mô, phía chỉ định ("bờ ngoài cơ ngửa dài"). Huyệt nằm SÁT NGOÀI bờ đó nửa thốn
 * (khoảng cách sờ được giữa bờ cơ và điểm huyệt trong mô tả kinh điển).
 */
function borderOf(A, p0, side, cunLen, sideSign) {
  const R = RULES.SLICE_HALF_CUN * cunLen * 2.2;
  const win = nearWindow(A, p0, R);
  if (win.length < 3) return null;
  const keys = (side || '').split('-').filter(k => SIDE_AXIS[k]);
  if (!keys.length) {                                   // không rõ phía → lấy điểm mô gần nhất
    const n = nearest(win, p0);
    return { p: { x: n.p.x, y: p0.y, z: n.p.z }, edge: n.p, side: null };
  }
  let best = -Infinity, bp = null;
  for (let i = 0; i < win.length; i += 3) {
    const q = { x: win[i], y: win[i + 1], z: win[i + 2] };
    const score = keys.reduce((s, k) => s + SIDE_AXIS[k](q, sideSign || 1), 0) / keys.length;
    if (score > best) { best = score; bp = q; }
  }
  // đẩy ra ngoài bờ 0,35 thốn theo đúng hướng đã chọn
  const step = 0.35 * cunLen;
  const p = { x: bp.x, y: p0.y, z: bp.z };
  for (const k of keys) {
    if (k === 'ngoai') p.x += (sideSign || 1) * step / keys.length;
    else if (k === 'trong') p.x -= (sideSign || 1) * step / keys.length;
    else if (k === 'truoc') p.z += step / keys.length;
    else if (k === 'sau') p.z -= step / keys.length;
  }
  return { p, edge: bp, side };
}

/** Chiếu điểm ra MẶT DA (điểm châm luôn ở trên da).
 *  `bias` (thường là vị trí cốt độ ban đầu) giữ đúng MẶT của huyệt: một khe nằm sâu — vd khe gian
 *  cốt chày–mác — có hai mặt da để trồi ra (trước và ngoài); mô tả sách và cốt độ đã ngầm chọn mặt
 *  nào, nên điểm da được chọn phải vừa gần khe vừa nghiêng về phía điểm ban đầu. */
function toSkin(skinXYZ, p, cunLen, bias) {
  const R = 3 * cunLen + 0.02;
  const win = nearWindow(skinXYZ, { x: p.x, y: p.y, z: p.z }, R);
  if (win.length < 3) return { p, depthCun: null };
  // chỉ xét điểm da gần đúng cao độ (±0,25 thốn) để không "trượt" lên/xuống thân
  const band = [];
  for (let i = 0; i < win.length; i += 3) if (Math.abs(win[i + 1] - p.y) < 0.25 * cunLen) band.push(win[i], win[i + 1], win[i + 2]);
  const src = band.length >= 3 ? Float32Array.from(band) : win;
  if (!bias) {
    const n = nearest(src, p);
    return { p: { x: n.p.x, y: p.y, z: n.p.z }, depthCun: n.d / cunLen };
  }
  let best = Infinity, bp = null, bd = 0;
  for (let i = 0; i < src.length; i += 3) {
    const d = Math.hypot(src[i] - p.x, src[i + 1] - p.y, src[i + 2] - p.z);
    const db = Math.hypot(src[i] - bias.x, src[i + 1] - bias.y, src[i + 2] - bias.z);
    const cost = d + 0.6 * db;
    if (cost < best) { best = cost; bp = { x: src[i], y: src[i + 1], z: src[i + 2] }; bd = d; }
  }
  return bp ? { p: { x: bp.x, y: p.y, z: bp.z }, depthCun: bd / cunLen } : { p, depthCun: null };
}

/** ba điều cấm: đo xem điểm có phạm không (xấp xỉ trên mesh thưa, đủ để cảnh báo). */
function probe(atlas, p, cunLen, ctx = {}) {
  const out = { insideBone: false, muscleDepthCun: null, muscleName: null, vesselDistCun: null, vesselName: null };
  const R = 2 * cunLen;
  for (const c of atlas.concepts) {
    if (c.layer !== 'bone' && c.layer !== 'muscle' && c.layer !== 'arterial') continue;
    if (ctx.skip && ctx.skip.includes(c.conceptId)) continue;
    // loại nhanh bằng khung bao: chỉ khối phủ tới cửa sổ mới đáng quét đỉnh
    const bb = c.bb;
    if (bb && (p.x < bb[0][0] - R || p.x > bb[1][0] + R || p.y < bb[0][1] - R || p.y > bb[1][1] + R || p.z < bb[0][2] - R || p.z > bb[1][2] + R)) continue;
    const xyz = atlas.points(c.conceptId);
    if (!xyz) continue;
    const win = nearWindow(xyz, p, R);
    if (win.length < 12) continue;
    // tâm + bán kính của khối trong cửa sổ → điểm "ở trong" khi gần tâm hơn vỏ
    let cx = 0, cy = 0, cz = 0, n = win.length / 3;
    for (let i = 0; i < win.length; i += 3) { cx += win[i]; cy += win[i + 1]; cz += win[i + 2]; }
    cx /= n; cy /= n; cz /= n;
    let rMean = 0;
    for (let i = 0; i < win.length; i += 3) rMean += Math.hypot(win[i] - cx, win[i + 1] - cy, win[i + 2] - cz);
    rMean /= n;
    const dCenter = Math.hypot(p.x - cx, p.y - cy, p.z - cz);
    /* "Trong lòng xương" đòi HAI điều kiện, không chỉ một:
     *   (a) điểm ngả về phía tâm khối hơn là vỏ  — điều kiện cũ, và
     *   (b) cách mặt xương ít nhất 0,25 thốn.
     * Thiếu (b) thì mọi huyệt SÁT xương đều bị báo nhầm — mà sát xương lại đúng là điều sách mô tả
     * (TE18 sát mỏm chũm 0,1 cm, GB38/39 sát bờ xương mác). Đã thử thay bằng phép "bao phủ 14 hướng"
     * nhưng mesh xương quá thưa (xương đùi chỉ ~470 đỉnh mỗi bên) nên nó bỏ sót cả điểm đối chứng
     * đặt giữa lòng xương đùi. */
    const dNear = nearest(win, p).d;
    const inside = dCenter < 0.75 * rMean && dNear > 0.25 * cunLen;
    if (c.layer === 'arterial') {
      const d = nearest(win, p).d / cunLen;
      if (out.vesselDistCun == null || d < out.vesselDistCun) { out.vesselDistCun = d; out.vesselName = c.vi || c.en; }
    } else if (inside) {
      if (c.layer === 'bone' && /bone|xương|tibia|fibula|radius|ulna|femur|humerus|patella|calcaneus|talus|scapula|clavicle|sternum|mandible|sacrum|vertebra|rib|metacarpal|metatarsal|phalanx/i.test(c.en + c.vi)) out.insideBone = true;
      else if (c.layer === 'muscle' || /muscle|cơ /i.test(c.vi)) {
        const depth = (rMean - dCenter) / cunLen;
        if (out.muscleDepthCun == null || depth > out.muscleDepthCun) { out.muscleDepthCun = depth; out.muscleName = c.vi || c.en; }
      }
    }
  }
  return out;
}

module.exports = { pickSide, nearWindow, tendonPart, nearest, gapBetween, borderOf, toSkin, probe };
