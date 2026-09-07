/* surface-path — BƯỚC 2 của mô hình ĐƯỜNG KINH: đi ĐƯỜNG NGẮN NHẤT TRÊN MẶT DA giữa hai điểm.
 *
 * VÌ SAO PHẢI TRẮC ĐỊA, KHÔNG PHẢI NỘI SUY
 * Nối hai huyệt bằng đoạn thẳng (hay spline qua các chấm, như map3d.js đang làm) là đi XUYÊN QUA
 * hoặc BAY RA NGOÀI thân, vì thân người là mặt cong. Đường kinh chạy TRÊN da, nên phép nối đúng là
 * đường trắc địa: đường ngắn nhất mà vẫn nằm trên mặt.
 *
 * CÁCH LÀM: đồ thị BÁN KÍNH trên đám mây điểm da (nối mọi cặp đỉnh cách nhau ≤ 2,1cm), rồi Dijkstra.
 *
 * VÌ SAO KHÔNG DÙNG CẠNH TAM GIÁC (đã thử, đã bỏ — ghi lại để đừng ai làm lại)
 * Cách "đúng sách" là lấy cạnh từ chỉ số tam giác. Đã làm: hàn đỉnh trùng vị trí (22.902 → 22.372,
 * vì glTF nhân bản đỉnh ở đường nối thuộc tính), kiểm ra ĐÚNG MỘT thành phần liên thông, số tam giác
 * 44.744 = 2×V đúng như một mặt kín. Nhìn mọi chỉ số đều lành. Nhưng Dijkstra cho kết quả vô lý:
 * rốn → hõm ức ra 89cm (đường thẳng 31cm), và đường đi leo lên tận MẶT rồi vòng xuống. Dò tiếp:
 * tỉ lệ trắc-địa/thẳng ở giữa ngực là 4,15, ở mũi ức 5,26 — tức có RÀO chắn ngang ngực. Nguyên nhân:
 * vỏ da của atlas là kiểu "bóc lớp", có đường xẻ; hai mép xẻ nằm sát nhau trong không gian nhưng
 * KHÔNG chung tam giác, nên liên thông chỉ tồn tại qua một lối vòng rất xa. Liên thông ≠ đi lại được.
 *
 * Đồ thị bán kính bắc cầu qua các đường xẻ đó vì nó nối theo KHOẢNG CÁCH, không theo tam giác. Đã
 * chuẩn ngưỡng bằng thực nghiệm ở ba mức: 1,4cm → vỡ thành 400 mảnh, không đi được; 3,1cm → liền
 * nhưng bắt đầu ĂN GIAN, cắt chéo qua chỗ lõm (vòng ra lưng chỉ còn 1,91 lần); 2,1cm → liền 99,9%
 * và vòng ra lưng ngang rốn đúng 2,06 lần đường thẳng, tức khớp nửa chu vi bụng thật. Chọn 2,1cm.
 * Phép kiểm này nên chạy lại mỗi khi đổi mesh — xem CLI ở cuối file.
 *
 * GIỚI HẠN: đường ngắn nhất CHƯA phải đường kinh. Kinh còn phải bám rãnh cơ–xương mà sách gọi tên
 * (vd Phế đi theo bờ ngoài cơ nhị đầu, không cắt qua hõm nách cho ngắn). Việc kéo đường vào rãnh là
 * BƯỚC 3, dùng lại hình học khe của tầng 4. Ở đây chỉ bảo đảm một điều, nhưng là điều quan trọng
 * nhất: đường LUÔN nằm trên người.                                                                  */
const { loadAtlas } = require('./mesh-io.cjs');

const R_LINK = 0.0122;   // bán kính nối ≈ 2,1cm — xem ghi chú đầu file về cách chuẩn ngưỡng
let GRAPH = null;

/** Hàng đợi ưu tiên nhị phân (Dijkstra trên ~22k đỉnh, không cần gì phức tạp hơn). */
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(node, w) {
    const a = this.a; a.push([w, node]);
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}

/** Dựng (một lần) đồ thị mặt da: đám mây điểm + cạnh bán kính, giữ thành phần liên thông LỚN NHẤT. */
async function loadSkinGraph(radius) {
  if (GRAPH && (!radius || radius === GRAPH.R)) return GRAPH;
  const R = radius || R_LINK, R2 = R * R;
  const atlas = await loadAtlas({ layers: ['skin'] });
  let sk = null;
  for (const s of atlas.search(/^skin$/i)) { const p = atlas.points(s.conceptId); if (p && (!sk || p.length > sk.length)) sk = p; }
  if (!sk) throw new Error('surface-path: mesh không có lớp da');
  const V = sk.length / 3;

  // ---- băm không gian (ô = R) để tìm láng giềng trong bán kính ----
  const cell = new Map();
  const ck = (i, j, k) => `${i},${j},${k}`;
  for (let i = 0; i < V; i++) {
    const k = ck(Math.floor(sk[i * 3] / R), Math.floor(sk[i * 3 + 1] / R), Math.floor(sk[i * 3 + 2] / R));
    const b = cell.get(k); if (b) b.push(i); else cell.set(k, [i]);
  }
  const nbr = Array.from({ length: V }, () => []);
  for (let i = 0; i < V; i++) {
    const ci = Math.floor(sk[i * 3] / R), cj = Math.floor(sk[i * 3 + 1] / R), ckk = Math.floor(sk[i * 3 + 2] / R);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const b = cell.get(ck(ci + dx, cj + dy, ckk + dz)); if (!b) continue;
      for (const j of b) {
        if (j <= i) continue;
        const d2 = (sk[i * 3] - sk[j * 3]) ** 2 + (sk[i * 3 + 1] - sk[j * 3 + 1]) ** 2 + (sk[i * 3 + 2] - sk[j * 3 + 2]) ** 2;
        if (d2 <= R2) { const w = Math.sqrt(d2); nbr[i].push(j, w); nbr[j].push(i, w); }
      }
    }
  }

  // ---- giữ thành phần liên thông lớn nhất (vài chục đỉnh lẻ bị rơi ra là bình thường) ----
  const comp = new Int32Array(V).fill(-1);
  let nc = 0, bestC = -1, bestN = 0;
  for (let s0 = 0; s0 < V; s0++) {
    if (comp[s0] >= 0) continue;
    const st = [s0]; comp[s0] = nc; let n = 0;
    while (st.length) { const u = st.pop(); n++; for (let e = 0; e < nbr[u].length; e += 2) { const v = nbr[u][e]; if (comp[v] < 0) { comp[v] = nc; st.push(v); } } }
    if (n > bestN) { bestN = n; bestC = nc; }
    nc++;
  }
  const map = new Int32Array(V).fill(-1); const pos = [];
  for (let i = 0; i < V; i++) if (comp[i] === bestC) { map[i] = pos.length / 3; pos.push(sk[i * 3], sk[i * 3 + 1], sk[i * 3 + 2]); }
  const N = pos.length / 3;

  // ---- CSR ----
  const head = new Int32Array(N + 1);
  for (let i = 0; i < V; i++) if (map[i] >= 0) head[map[i] + 1] = nbr[i].length / 2;
  for (let i = 0; i < N; i++) head[i + 1] += head[i];
  const nb = new Int32Array(head[N]), wt = new Float32Array(head[N]);
  const fill = head.slice();
  for (let i = 0; i < V; i++) {
    if (map[i] < 0) continue;
    const u = map[i];
    for (let e = 0; e < nbr[i].length; e += 2) { nb[fill[u]] = map[nbr[i][e]]; wt[fill[u]++] = nbr[i][e + 1]; }
  }

  GRAPH = {
    R, N, thanhPhan: nc, phuTram: +(bestN / V * 100).toFixed(1),
    pos: Float64Array.from(pos), head, nb, wt,
    /** Đỉnh gần nhất với một điểm bất kỳ (quét thẳng — 22k đỉnh, đủ nhanh). */
    nearest(p) {
      let bi = -1, bd = Infinity;
      for (let i = 0; i < N; i++) {
        const d = (this.pos[i * 3] - p.x) ** 2 + (this.pos[i * 3 + 1] - p.y) ** 2 + (this.pos[i * 3 + 2] - p.z) ** 2;
        if (d < bd) { bd = d; bi = i; }
      }
      return { i: bi, d: Math.sqrt(bd), p: { x: this.pos[bi * 3], y: this.pos[bi * 3 + 1], z: this.pos[bi * 3 + 2] } };
    },
    xyz(i) { return { x: this.pos[i * 3], y: this.pos[i * 3 + 1], z: this.pos[i * 3 + 2] }; },
    /* Khoảng cách tới MẶT da, không tới ĐỈNH da. Lưới thưa (cạnh trung bình 1,55cm, có chỗ 2,8cm),
     * nên một huyệt nằm ĐÚNG trên mặt nhưng rơi vào giữa hai đỉnh vẫn bị đo là "cách da 1,7cm".
     * Xấp xỉ mặt bằng các CẠNH của đồ thị quanh đỉnh gần nhất — đủ sát và rẻ. */
    nearestSurf(p) {
      const n = this.nearest(p); if (!n) return null;
      let bd = n.d;
      const A = { x: this.pos[n.i * 3], y: this.pos[n.i * 3 + 1], z: this.pos[n.i * 3 + 2] };
      for (let e = this.head[n.i]; e < this.head[n.i + 1]; e++) {
        const j = this.nb[e];
        const B = { x: this.pos[j * 3], y: this.pos[j * 3 + 1], z: this.pos[j * 3 + 2] };
        const ux = B.x - A.x, uy = B.y - A.y, uz = B.z - A.z, L2 = ux * ux + uy * uy + uz * uz;
        if (L2 === 0) continue;
        let t = ((p.x - A.x) * ux + (p.y - A.y) * uy + (p.z - A.z) * uz) / L2;
        t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(p.x - (A.x + ux * t), p.y - (A.y + uy * t), p.z - (A.z + uz * t));
        if (d < bd) bd = d;
      }
      return { d: bd };
    },
    /** Mọi đỉnh da trong bán kính r quanh một điểm — dùng để KHỚP MẶT PHẲNG cục bộ (lấy pháp tuyến).
     * Có nó thì hạ điểm xuống da được theo đúng chiều SÂU; không có thì chỉ còn cách dán vào đỉnh gần
     * nhất, mà lưới thưa 1,5cm nên cách ấy đẩy điểm lệch cả theo chiều NGANG. */
    quanh(p, r) {
      const r2 = r * r, out = [];
      for (let i = 0; i < N; i++) {
        const d = (this.pos[i * 3] - p.x) ** 2 + (this.pos[i * 3 + 1] - p.y) ** 2 + (this.pos[i * 3 + 2] - p.z) ** 2;
        if (d <= r2) out.push({ x: this.pos[i * 3], y: this.pos[i * 3 + 1], z: this.pos[i * 3 + 2] });
      }
      return out;
    },
  };
  return GRAPH;
}

/** Đường trắc địa giữa hai ĐỈNH của lưới → mảng chỉ số đỉnh (gồm cả hai đầu), hoặc null nếu không tới được. */
function geodesicIdx(g, sa, sb) {
  if (sa === sb) return [sa];
  const D = new Float64Array(g.N).fill(Infinity);
  const prev = new Int32Array(g.N).fill(-1);
  const done = new Uint8Array(g.N);
  const h = new Heap();
  D[sa] = 0; h.push(sa, 0);
  while (h.size) {
    const [w, u] = h.pop();
    if (done[u]) continue;
    done[u] = 1;
    if (u === sb) break;
    for (let e = g.head[u]; e < g.head[u + 1]; e++) {
      const v = g.nb[e];
      if (done[v]) continue;
      const nd = w + g.wt[e];
      if (nd < D[v]) { D[v] = nd; prev[v] = u; h.push(v, nd); }
    }
  }
  if (!done[sb]) return null;
  const out = [];
  for (let v = sb; v !== -1; v = prev[v]) out.push(v);
  return out.reverse();
}

/** Đường trắc địa giữa hai ĐIỂM (tự dán vào đỉnh gần nhất) → { pts:[{x,y,z}], cm, snapA, snapB }. */
function geodesic(g, a, b) {
  const A = g.nearest(a), B = g.nearest(b);
  const idx = geodesicIdx(g, A.i, B.i);
  if (!idx) return null;
  const pts = idx.map(i => g.xyz(i));
  return { pts, cm: arcCm(pts), snapA: A.d, snapB: B.d };
}

/** Nối nhiều chặng: đi qua LẦN LƯỢT các điểm mốc. */
function pathThrough(g, waypoints) {
  const pts = []; let bad = 0;
  for (let k = 0; k + 1 < waypoints.length; k++) {
    const seg = geodesic(g, waypoints[k], waypoints[k + 1]);
    if (!seg) { bad++; continue; }
    /* GHIM ĐÚNG MỐC. Dijkstra chỉ đi được giữa các ĐỈNH của lưới da, mà lưới thưa (cạnh trung bình
     * 1,55cm) nên đỉnh gần nhất có thể cách mốc tới ~0,8cm — đo thật: 90 nút cách đường trung bình
     * 0,79cm, xa nhất 2,06cm. Thay hai đầu mỗi chặng bằng chính toạ độ mốc thì đường xuyên ĐÚNG qua
     * nút, không phụ thuộc độ mịn của lưới. Mốc vốn đã nằm trên da (tầng 5 bảo đảm) nên không làm
     * đường rời khỏi người. */
    seg.pts[0] = { x: waypoints[k].x, y: waypoints[k].y, z: waypoints[k].z };
    seg.pts[seg.pts.length - 1] = { x: waypoints[k + 1].x, y: waypoints[k + 1].y, z: waypoints[k + 1].z };
    for (const p of seg.pts) {
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(last.x - p.x, last.y - p.y, last.z - p.z) > 1e-6) pts.push(p);
    }
  }
  return { pts, cm: arcCm(pts), bad };
}

const CM = 171.9;
function arcCm(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
  return +(L * CM).toFixed(1);
}

/** Douglas–Peucker trong không gian 3D — giảm số đỉnh mà giữ hình. tol tính bằng chuẩn-hoá. */
function simplify(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    if (j - i < 2) continue;
    const a = pts[i], b = pts[j];
    const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const L2 = ab.x ** 2 + ab.y ** 2 + ab.z ** 2;
    let best = -1, bd = -1;
    for (let k = i + 1; k < j; k++) {
      const p = pts[k], ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
      let t = L2 > 0 ? (ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(ap.x - t * ab.x, ap.y - t * ab.y, ap.z - t * ab.z);
      if (d > bd) { bd = d; best = k; }
    }
    if (bd > tol) { keep[best] = 1; stack.push([i, best], [best, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}

/** Khoảng cách từ một điểm tới đường (đo trên các đoạn thẳng của polyline) — cm. */
function distToPathCm(pts, p) {
  let bd = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const L2 = ab.x ** 2 + ab.y ** 2 + ab.z ** 2;
    const ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
    let t = L2 > 0 ? (ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(ap.x - t * ab.x, ap.y - t * ab.y, ap.z - t * ab.z);
    if (d < bd) bd = d;
  }
  return +(bd * CM).toFixed(2);
}

module.exports = { loadSkinGraph, geodesic, geodesicIdx, pathThrough, simplify, arcCm, distToPathCm, CM };

// ----- CLI thử nhanh: node surface-path.cjs LU9 LU5  → đo đường trắc địa giữa hai huyệt -----
if (require.main === module) {
  (async () => {
    const fs = require('fs'), path = require('path');
    const w = {};
    new Function('window', fs.readFileSync(path.resolve(__dirname, '../../../frontend/public/kinhmach3d/data/acu-coords3d.js'), 'utf8'))(w);
    const P = w.ACU_COORDS3D.points;
    const [a, b] = process.argv.slice(2);
    const g = await loadSkinGraph();
    console.log(`đồ thị da: ${g.N} đỉnh đã hàn`);
    if (!a || !b) return;
    const r = geodesic(g, P[a], P[b]);
    if (!r) return console.log('không tới được');
    const thang = Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y, P[a].z - P[b].z) * CM;
    console.log(`${a} → ${b}: trắc địa ${r.cm} cm qua ${r.pts.length} đỉnh · đường thẳng ${thang.toFixed(1)} cm`
      + ` · vòng thêm ${(r.cm / thang * 100 - 100).toFixed(0)}%`);
    console.log(`  dán đầu ${(r.snapA * CM).toFixed(2)} cm · dán cuối ${(r.snapB * CM).toFixed(2)} cm`);
  })();
}
