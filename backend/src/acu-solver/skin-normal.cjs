/* skin-normal — PHÁP TUYẾN THẬT CỦA MẶT DA tại một điểm bất kỳ.
 *
 * VÌ SAO CÓ FILE NÀY
 * Engine đặt huyệt và đường kinh ĐÚNG TRÊN mặt da. Frontend phải nhấc chúng ra khỏi da ~1,55cm thì ống
 * đường kinh (đường kính 6,2mm) và chấm huyệt (9mm) mới không bị da nuốt. Nhưng map3d.js nhấc theo
 * hướng TOẢ RA TỪ TRỤC DỌC THÂN — véc-tơ (x, 0, z) chuẩn hoá — chứ không theo pháp tuyến mặt da.
 *
 * Trên ngực, bụng, lưng hai hướng ấy gần trùng nhau (lệch 11–31°) nên không ai để ý. Ở TAY CHÂN buông
 * xuôi thì lệch tới 90–150°: mặt TRONG cẳng tay có pháp tuyến hướng vào trong người, còn hướng toả lại
 * hướng ra ngoài — nhấc 1,55cm chính là ĐẨY ỐNG CHUI VÀO TRONG THỊT. Đo trên mesh da (44.744 tam giác):
 *   TE mu bàn tay   3/3 điểm hở −0,09cm (chìm hẳn)   góc lệch 74°
 *   TE cẳng tay     4/9 điểm hở −0,09cm              góc lệch 83°
 *   LU cẳng tay     5/8 điểm hở −0,03cm              góc lệch 93°
 *   GB nách–sườn    4/23 điểm hở −0,09cm             góc lệch 112°
 * Tổng 52/482 đỉnh đường kinh (11%) có độ hở NHỎ HƠN bán kính ống → da lấp lên đường. Đúng cảnh người
 * dùng mô tả: "chỗ đường kinh rõ ràng đi trên bề mặt da mà lại bị da lấp lên".
 *
 * CÁCH LÀM: dùng TAM GIÁC của mesh da, không dùng đám mây điểm.
 * Đám mây điểm chỉ cho pháp tuyến bằng PCA lân cận, mà PCA không biết đâu là "ra ngoài" — phải dò thêm
 * mới định chiều được. Thử bằng phép phủ 14 hướng của skin-clamp thì SAI HẲN: một điểm nằm ngoài da
 * 0,35cm vẫn bị 14/14 tia chạm vào thân người nên vẫn bị kết luận "ở trong", thành ra gần như mọi pháp
 * tuyến đều bị lật ngược (đo ra góc lệch 168° ở chân tóc thái dương — vô lý). Tam giác thì có CHIỀU
 * CUỐN sẵn, lấy pháp tuyến là ra ngay chiều đúng, không phải dò.
 *
 * Pháp tuyến trả về là pháp tuyến ĐỈNH (trung bình có trọng số diện tích của các tam giác quanh đỉnh),
 * lấy trung bình trên tam giác gần nhất — mượt hơn pháp tuyến từng mặt, nên ống không bị giật khấc khi
 * đi qua ranh giới hai tam giác.
 *
 * Dùng:  const { loadSkinNormals } = require('./skin-normal.cjs');
 *        const SN = await loadSkinNormals();
 *        SN.normalAt({x, y, z})   → [nx, ny, nz] đã chuẩn hoá, hướng RA NGOÀI · null nếu quá xa da
 *        SN.hoCm(p, huong, cm)    → nhấc p đi cm theo huong rồi đo còn cách mặt da bao nhiêu (cm)      */
const { loadAtlas } = require('./mesh-io.cjs');

const CM = 171.9;             // chiều cao mesh (cm)
const CELL = 0.01;            // ô băm tam giác ≈ 1,7cm
const XA_NHAT = 0.05;         // quá 8,6cm thì coi như không tìm được da

/** điểm gần nhất trên tam giác ABC (Ericson, Real-Time Collision Detection §5.1.5) */
function closestOnTri(p, a, b, c) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const d1 = ab[0] * ap[0] + ab[1] * ap[1] + ab[2] * ap[2], d2 = ac[0] * ap[0] + ac[1] * ap[1] + ac[2] * ap[2];
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = [p[0] - b[0], p[1] - b[1], p[2] - b[2]];
  const d3 = ab[0] * bp[0] + ab[1] * bp[1] + ab[2] * bp[2], d4 = ac[0] * bp[0] + ac[1] * bp[1] + ac[2] * bp[2];
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v]; }
  const cp = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
  const d5 = ab[0] * cp[0] + ab[1] * cp[1] + ab[2] * cp[2], d6 = ac[0] * cp[0] + ac[1] * cp[1] + ac[2] * cp[2];
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w]; }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
    const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
    return [b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w];
  }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
}

let CACHE = null;

async function loadSkinNormals() {
  if (CACHE) return CACHE;
  const atlas = await loadAtlas({ layers: ['skin'] });
  const m = atlas.mesh('skin');
  if (!m) throw new Error('skin-normal: mesh không có lớp da');
  const { xyz, idx } = m;
  const nTri = idx ? idx.length / 3 : xyz.length / 9;
  const tri = t => idx ? [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]] : [t * 3, t * 3 + 1, t * 3 + 2];
  const vtx = i => [xyz[i * 3], xyz[i * 3 + 1], xyz[i * 3 + 2]];

  // pháp tuyến ĐỈNH: cộng dồn tích có hướng của mọi tam giác quanh đỉnh (độ dài tích = 2×diện tích,
  // nên đây chính là trung bình có trọng số diện tích — không cần chuẩn hoá từng tam giác)
  const VN = new Float32Array(xyz.length);
  for (let t = 0; t < nTri; t++) {
    const [i0, i1, i2] = tri(t), a = vtx(i0), b = vtx(i1), c = vtx(i2);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const i of [i0, i1, i2]) { VN[i * 3] += n[0]; VN[i * 3 + 1] += n[1]; VN[i * 3 + 2] += n[2]; }
  }

  // băm tam giác theo ô lưới (mỗi tam giác vào mọi ô mà hộp bao của nó chạm)
  const H = new Map();
  for (let t = 0; t < nTri; t++) {
    const [i0, i1, i2] = tri(t);
    let mn = [9, 9, 9], mx = [-9, -9, -9];
    for (const i of [i0, i1, i2]) {
      const p = vtx(i);
      for (let k = 0; k < 3; k++) { if (p[k] < mn[k]) mn[k] = p[k]; if (p[k] > mx[k]) mx[k] = p[k]; }
    }
    for (let a = Math.floor(mn[0] / CELL); a <= Math.floor(mx[0] / CELL); a++)
      for (let b = Math.floor(mn[1] / CELL); b <= Math.floor(mx[1] / CELL); b++)
        for (let c = Math.floor(mn[2] / CELL); c <= Math.floor(mx[2] / CELL); c++) {
          const k = `${a},${b},${c}`; let arr = H.get(k); if (!arr) H.set(k, arr = []); arr.push(t);
        }
  }

  /** tam giác gần nhất → { cp: điểm chiếu, n: pháp tuyến (chưa lật chiều), d: khoảng cách chuẩn-hoá } */
  function nearestTri(p) {
    const q = [p.x !== undefined ? p.x : p[0], p.y !== undefined ? p.y : p[1], p.z !== undefined ? p.z : p[2]];
    let best = null, bd = Infinity;
    for (let r = 1; r <= 5; r++) {                     // nới dần bán kính ô cho tới khi thấy tam giác
      const b0 = [Math.floor(q[0] / CELL), Math.floor(q[1] / CELL), Math.floor(q[2] / CELL)];
      const seen = new Set();
      for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++) {
        const arr = H.get(`${b0[0] + a},${b0[1] + b},${b0[2] + c}`); if (!arr) continue;
        for (const t of arr) {
          if (seen.has(t)) continue; seen.add(t);
          const [i0, i1, i2] = tri(t);
          const cp = closestOnTri(q, vtx(i0), vtx(i1), vtx(i2));
          const d = (cp[0] - q[0]) ** 2 + (cp[1] - q[1]) ** 2 + (cp[2] - q[2]) ** 2;
          if (d < bd) { bd = d; best = { cp, t }; }
        }
      }
      if (best) break;
    }
    if (!best || bd > XA_NHAT * XA_NHAT) return null;
    const [i0, i1, i2] = tri(best.t);
    const n = [0, 0, 0];
    for (const i of [i0, i1, i2]) { n[0] += VN[i * 3]; n[1] += VN[i * 3 + 1]; n[2] += VN[i * 3 + 2]; }
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    return { cp: best.cp, n: [n[0] / l, n[1] / l, n[2] / l], d: Math.sqrt(bd) };
  }

  /* TỰ KIỂM CHIỀU CUỐN bằng THỂ TÍCH CÓ DẤU của cả mesh: V = ⅙·Σ v0·(v1×v2). Với mặt kín, V dương
   * khi tam giác cuốn ngược chiều kim đồng hồ NHÌN TỪ NGOÀI — tức pháp tuyến hướng ra ngoài.
   * Đây là phép toàn cục, không phụ thuộc chọn điểm mốc. Bản đầu tôi kiểm bằng ba điểm mốc (giữa
   * ngực / giữa lưng / đỉnh đầu) thì đỉnh đầu báo NGƯỢC trong khi hai điểm kia thuận — không phải
   * mesh sai, mà vì lớp da còn chứa vài vỏ rời (nhãn cầu, khoang miệng) nên chấm mốc dễ rơi trúng vỏ
   * khác. Thể tích thì lấy theo cả triệu tam giác, mấy vỏ con không lật nổi dấu. */
  let V6 = 0;
  for (let t = 0; t < nTri; t++) {
    const [i0, i1, i2] = tri(t), a = vtx(i0), b = vtx(i1), c = vtx(i2);
    V6 += a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  }
  const lat = V6 < 0 ? -1 : 1;
  const chiTiet = [`thể tích có dấu ${(V6 / 6).toExponential(2)} → ${lat < 0 ? 'LẬT' : 'giữ'} chiều`];
  // đối chứng: giữa ngực phải hướng ra TRƯỚC (+z) — nếu lệch thì kêu để người soát biết mà xem lại
  const ck = nearestTri({ x: 0, y: 0.78, z: 0.09 });
  if (ck) {
    const nz = ck.n[2] * lat;
    chiTiet.push(`đối chứng giữa ngực nz=${nz.toFixed(2)} ${nz > 0.5 ? '✓' : '✗ NGỜ'}`);
    if (nz <= 0.5) console.warn('⚠ skin-normal: thể tích và điểm đối chứng KHÔNG khớp — ' + chiTiet.join(' · '));
  }

  CACHE = {
    CM,
    nTri,
    chiTietKiem: chiTiet,
    lat,
    /** Pháp tuyến RA NGOÀI tại điểm gần p nhất trên mặt da. null nếu p cách da quá xa. */
    normalAt(p) {
      const r = nearestTri(p);
      return r ? [r.n[0] * lat, r.n[1] * lat, r.n[2] * lat] : null;
    },
    /** { n, cp, dCm, hoCm } — hoCm là khoảng cách CÓ DẤU tới mặt da (âm = đang ở trong người). */
    doAt(p) {
      const r = nearestTri(p);
      if (!r) return null;
      const n = [r.n[0] * lat, r.n[1] * lat, r.n[2] * lat];
      const q = [p.x !== undefined ? p.x : p[0], p.y !== undefined ? p.y : p[1], p.z !== undefined ? p.z : p[2]];
      const ho = (q[0] - r.cp[0]) * n[0] + (q[1] - r.cp[1]) * n[1] + (q[2] - r.cp[2]) * n[2];
      return { n, cp: r.cp, dCm: r.d * CM, hoCm: ho * CM };
    },
    /** Nhấc p đi `cm` theo `huong` rồi đo còn hở mặt da bao nhiêu cm (âm = vẫn chìm trong người). */
    hoCm(p, huong, cm) {
      const t = cm / CM;
      const q = { x: p.x + huong[0] * t, y: p.y + huong[1] * t, z: p.z + huong[2] * t };
      const r = this.doAt(q);
      return r ? r.hoCm : null;
    },
  };
  return CACHE;
}

/** Hướng nhấc CŨ của map3d.js — toả ra từ trục dọc thân. Giữ lại để đo mức cải thiện. */
function huongToa(p) {
  let ox = p.x, oz = p.z, oy = 0;
  const l = Math.hypot(ox, oz);
  if (l < 1e-5) { ox = 0; oz = 1; } else { ox /= l; oz /= l; }
  if (p.y > 0.95) {                     // gần đỉnh đầu thì ngả dần lên trên (bản sao của map3d.js)
    const t = Math.min(1, (p.y - 0.95) / 0.05);
    ox *= (1 - t); oz *= (1 - t); oy = t;
    const l2 = Math.hypot(ox, oy, oz); ox /= l2; oy /= l2; oz /= l2;
  }
  return [ox, oy, oz];
}

module.exports = { loadSkinNormals, huongToa, closestOnTri, CM };
