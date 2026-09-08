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
 * CÁCH LÀM — BA LỚP, vì không lớp nào một mình đủ.
 *
 * 1. HƯỚNG lấy từ TAM GIÁC, không lấy từ đám mây điểm. Đám mây chỉ cho pháp tuyến bằng PCA lân cận, mà
 *    PCA không biết đâu là "ra ngoài" — phải dò thêm mới định chiều. Thử định chiều bằng phép phủ 14
 *    hướng của skin-clamp thì SAI HẲN: một điểm nằm NGOÀI da 0,35cm vẫn bị 14/14 tia chạm vào thân
 *    người nên vẫn bị kết luận "ở trong", thành ra gần như mọi pháp tuyến bị lật ngược (đo ra góc lệch
 *    168° ở chân tóc thái dương — vô lý).
 *
 * 2. GOM NHIỀU TAM GIÁC, không tin một mặt. Vỏ da của atlas KHÔNG phải mặt kín trơn: đếm được 992 cạnh
 *    biên (đường xẻ) và nhiều chỗ mặt GẤP NẾP thành vây mỏng — ở mặt trước cẳng chân, các tam giác
 *    cách nhau 5mm có pháp tuyến [0.04,−0.03,1.00] rồi [0.04,0.05,−1.00], tức ngược hẳn nhau tại cùng
 *    một chỗ. Trung bình pháp tuyến đỉnh ở đó triệt tiêu và ra hướng rác. Nên: lấy mặt gần nhất làm
 *    chuẩn, rồi gom mọi tam giác trong 1,5cm, LẬT từng cái cho cùng phía với chuẩn rồi mới cộng trọng
 *    số diện tích. Vây gấp nếp hết phá được.
 *
 * 3. CHIỀU định bằng TRƯỜNG KHÍ, không đoán. Voxel hoá vỏ da rồi loang từ ngoài hộp bao vào: ô nào
 *    loang tới được là KHÍ (ngoài người), ô nào không tới được mà cũng không bị vỏ chiếm là KHOANG
 *    (trong người). Pháp tuyến đúng chiều là hướng mà đi 1,2cm thì sang ô KHÍ còn đi ngược lại thì
 *    không. Phép này không phụ thuộc hình dáng nên đúng cả ở mặt trong cẳng tay lẫn hõm nách.
 *
 * Dùng:  const { loadSkinNormals } = require('./skin-normal.cjs');
 *        const SN = await loadSkinNormals();
 *        SN.normalAt({x, y, z})   → [nx, ny, nz] đã chuẩn hoá, hướng RA NGOÀI · null nếu quá xa da
 *        SN.hoCm(p, huong, cm)    → nhấc p đi cm theo huong rồi đo còn cách mặt da bao nhiêu (cm)      */
const { loadAtlas } = require('./mesh-io.cjs');

const CM = 171.9;             // chiều cao mesh (cm)
const CELL = 0.01;            // ô băm tam giác ≈ 1,7cm
const XA_NHAT = 0.05;         // quá 8,6cm thì coi như không tìm được da
const GOM = 0.009;            // bán kính gom mặt để trung bình pháp tuyến ≈ 1,5cm
const VOX = 0.0035;           // ô trường khí ≈ 6mm — nhỏ hơn thì vỏ da (cạnh 1,55cm) hở, khí tràn vào

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
  /* Nạp thêm CƠ và XƯƠNG — không phải để lấy pháp tuyến (chỉ da mới cho pháp tuyến), mà để BỊT LỖ cho
   * trường khí. Vỏ da của atlas hở thật: 967 đỉnh biên, tụ ở mặt (mắt, mũi, miệng, ống tai — 538 đỉnh)
   * và ở hõm nách (239 đỉnh quanh x≈±16,5cm, y≈120–130cm). Khí loang qua miệng vào sọ rồi xuống hết
   * thân, nên tự kiểm báo "giữa lồng ngực: khí". Cơ và xương lấp đúng những khoang ấy (lưỡi, răng,
   * hàm, cơ ngực), nên chỉ cần chấm đỉnh của hai lớp đó là bịt kín. */
  const atlas = await loadAtlas({ layers: ['skin', 'muscle', 'bone'] });
  const m = atlas.mesh('skin');
  if (!m) throw new Error('skin-normal: mesh không có lớp da');
  const { xyz, idx } = m;
  const nTri = idx ? idx.length / 3 : xyz.length / 9;
  const tri = t => idx ? [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]] : [t * 3, t * 3 + 1, t * 3 + 2];
  const vtx = i => [xyz[i * 3], xyz[i * 3 + 1], xyz[i * 3 + 2]];

  // pháp tuyến MẶT, chưa chuẩn hoá (độ dài = 2×diện tích → dùng thẳng làm trọng số), kèm trọng tâm
  const FN = new Float32Array(nTri * 3), FG = new Float32Array(nTri * 3);
  for (let t = 0; t < nTri; t++) {
    const [i0, i1, i2] = tri(t), a = vtx(i0), b = vtx(i1), c = vtx(i2);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    FN[t * 3] = u[1] * v[2] - u[2] * v[1];
    FN[t * 3 + 1] = u[2] * v[0] - u[0] * v[2];
    FN[t * 3 + 2] = u[0] * v[1] - u[1] * v[0];
    FG[t * 3] = (a[0] + b[0] + c[0]) / 3; FG[t * 3 + 1] = (a[1] + b[1] + c[1]) / 3; FG[t * 3 + 2] = (a[2] + b[2] + c[2]) / 3;
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
    /* GOM MẶT trong bán kính GOM quanh điểm chiếu, mỗi mặt LẬT cho cùng phía với mặt gần nhất rồi mới
     * cộng theo trọng số diện tích. Không lật thì vây gấp nếp (xem chú thích đầu file) triệt tiêu nhau
     * và hướng ra rác — đo tại mặt trước cẳng chân: hai mặt cách nhau 5mm có pháp tuyến ngược hẳn. */
    const n0 = [FN[best.t * 3], FN[best.t * 3 + 1], FN[best.t * 3 + 2]];
    const l0 = Math.hypot(n0[0], n0[1], n0[2]) || 1;
    n0[0] /= l0; n0[1] /= l0; n0[2] /= l0;
    const n = [0, 0, 0];
    const b0 = [Math.floor(best.cp[0] / CELL), Math.floor(best.cp[1] / CELL), Math.floor(best.cp[2] / CELL)];
    const seen = new Set();
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
      const arr = H.get(`${b0[0] + a},${b0[1] + b},${b0[2] + c}`); if (!arr) continue;
      for (const t of arr) {
        if (seen.has(t)) continue; seen.add(t);
        const dg = Math.hypot(FG[t * 3] - best.cp[0], FG[t * 3 + 1] - best.cp[1], FG[t * 3 + 2] - best.cp[2]);
        if (dg > GOM) continue;
        const f = [FN[t * 3], FN[t * 3 + 1], FN[t * 3 + 2]];
        const s = (f[0] * n0[0] + f[1] * n0[1] + f[2] * n0[2]) < 0 ? -1 : 1;
        n[0] += f[0] * s; n[1] += f[1] * s; n[2] += f[2] * s;
      }
    }
    let l = Math.hypot(n[0], n[1], n[2]);
    if (l < 1e-9) { n[0] = n0[0]; n[1] = n0[1]; n[2] = n0[2]; l = 1; }   // không gom được mặt nào
    return { cp: best.cp, n: [n[0] / l, n[1] / l, n[2] / l], d: Math.sqrt(bd) };
  }

  /* ── TRƯỜNG KHÍ ── voxel hoá vỏ da rồi loang từ góc hộp bao vào. Ô loang tới được = KHÍ (ngoài
   * người). Ô không loang tới mà cũng không bị vỏ chiếm = KHOANG (trong người). Đây là thứ duy nhất
   * trong file này biết "ra ngoài" nghĩa là gì. */
  let mn = [9, 9, 9], mx = [-9, -9, -9];
  for (let i = 0; i < xyz.length; i += 3)
    for (let k = 0; k < 3; k++) { if (xyz[i + k] < mn[k]) mn[k] = xyz[i + k]; if (xyz[i + k] > mx[k]) mx[k] = xyz[i + k]; }
  const LE = 4;                                     // đệm 4 ô quanh người để có chỗ loang
  const O = mn.map(v => v - LE * VOX);
  const N = [0, 1, 2].map(k => Math.ceil((mx[k] - mn[k]) / VOX) + 2 * LE + 1);
  const oi = (i, j, k) => (i * N[1] + j) * N[2] + k;
  const cua = p => [0, 1, 2].map(k => Math.floor(((p.x !== undefined ? [p.x, p.y, p.z] : p)[k] - O[k]) / VOX));
  const VOL = N[0] * N[1] * N[2];
  const trang = new Uint8Array(VOL);                // 0 = khoang · 1 = vỏ · 2 = khí
  /* RẢI KÍN MẶT TAM GIÁC, không chấm theo ĐỈNH. Bản đầu chỉ chấm đỉnh rồi nở 1 ô — vỏ vẫn đầy lỗ vì
   * lưới da thưa (cạnh tới 3cm ở chỗ phẳng), khí loang thủng vào tận giữa lồng ngực và giữa chậu hông.
   * Nay lấy mẫu trong lòng từng tam giác với bước VOX/2 nên không voxel nào mà mặt đi qua bị bỏ sót,
   * và vỏ chỉ dày 1 ô — khoang bên trong giữ nguyên, không bị nở lấp. */
  const BUOC = VOX / 2;
  for (let t = 0; t < nTri; t++) {
    const [i0, i1, i2] = tri(t), A = vtx(i0), B = vtx(i1), C = vtx(i2);
    const lab = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
    const lac = Math.hypot(C[0] - A[0], C[1] - A[1], C[2] - A[2]);
    const nu = Math.max(1, Math.ceil(lab / BUOC)), nv = Math.max(1, Math.ceil(lac / BUOC));
    for (let a = 0; a <= nu; a++) for (let b = 0; b <= nv; b++) {
      const u = a / nu, v = b / nv;
      if (u + v > 1) continue;
      const p = [A[0] + (B[0] - A[0]) * u + (C[0] - A[0]) * v,
        A[1] + (B[1] - A[1]) * u + (C[1] - A[1]) * v,
        A[2] + (B[2] - A[2]) * u + (C[2] - A[2]) * v];
      const c = [0, 1, 2].map(k => Math.floor((p[k] - O[k]) / VOX));
      if (c.every((q, k) => q >= 0 && q < N[k])) trang[oi(c[0], c[1], c[2])] = 1;
    }
  }
  // CƠ + XƯƠNG chỉ chấm theo ĐỈNH: hai lớp này dày 907k đỉnh, đủ kín để bịt lỗ vỏ da, mà khỏi phải
  // rải mặt cho gần 1 triệu tam giác.
  for (const lop of ['muscle', 'bone']) {
    const mm = atlas.mesh(lop); if (!mm) continue;
    const q = mm.xyz;
    for (let i = 0; i < q.length; i += 3) {
      const c = [Math.floor((q[i] - O[0]) / VOX), Math.floor((q[i + 1] - O[1]) / VOX), Math.floor((q[i + 2] - O[2]) / VOX)];
      if (c.every((v, k) => v >= 0 && v < N[k])) trang[oi(c[0], c[1], c[2])] = 1;
    }
  }
  const hang = [0]; trang[0] = 2;
  const B6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (let h = 0; h < hang.length; h++) {
    const id = hang[h], k = id % N[2], j = ((id - k) / N[2]) % N[1], i = (id - k - j * N[2]) / (N[2] * N[1]);
    for (const [a, b, c] of B6) {
      const p = [i + a, j + b, k + c];
      if (!p.every((v, q) => v >= 0 && v < N[q])) continue;
      const nid = oi(p[0], p[1], p[2]);
      if (trang[nid] !== 0) continue;
      trang[nid] = 2; hang.push(nid);
    }
  }
  /** Điểm này có ở NGOÀI người không (ô của nó loang được từ ngoài hộp bao). */
  function laKhi(p) {
    const c = cua(p);
    if (!c.every((v, k) => v >= 0 && v < N[k])) return true;   // ngoài hẳn hộp bao
    return trang[oi(c[0], c[1], c[2])] === 2;
  }

  /* TỰ KIỂM TRƯỜNG KHÍ: khí phải loang kín quanh người mà KHÔNG lọt vào trong. Nếu vỏ có lỗ thủng
   * lớn thì khí tràn vào khoang, và lúc ấy MỌI pháp tuyến trong người bị định ngược chiều — hỏng âm
   * thầm, nên phải kiểm trước khi dùng. Ba điểm: giữa chậu hông và giữa lồng ngực phải KHÔNG là khí;
   * điểm cách người 30cm phải LÀ khí. */
  const KIEM = [
    { p: { x: 0, y: 0.50, z: -0.01 }, khi: false, ten: 'giữa chậu hông' },
    { p: { x: 0, y: 0.72, z: 0.00 }, khi: false, ten: 'giữa lồng ngực' },
    { p: { x: 0.30, y: 0.72, z: 0.00 }, khi: true, ten: 'cách người 30cm' },
  ];
  const chiTiet = [];
  let hong = 0;
  for (const t of KIEM) {
    const ok = laKhi(t.p) === t.khi;
    if (!ok) hong++;
    chiTiet.push(`${t.ten}: ${laKhi(t.p) ? 'khí' : 'trong người'} ${ok ? '✓' : '✗'}`);
  }
  if (hong) throw new Error('skin-normal: TRƯỜNG KHÍ hỏng (vỏ da thủng, khí tràn vào trong) — ' + chiTiet.join(' · '));
  const soO = { khi: 0, vo: 0, khoang: 0 };
  for (let i = 0; i < VOL; i++) soO[trang[i] === 2 ? 'khi' : trang[i] === 1 ? 'vo' : 'khoang']++;
  chiTiet.push(`ô: ${soO.khi} khí · ${soO.vo} vỏ · ${soO.khoang} khoang`);

  /** Chiều đúng của pháp tuyến n tại p: +1 giữ · −1 lật · 0 không phân định được. */
  function dinhChieu(p, n) {
    const q = [p.x !== undefined ? p.x : p[0], p.y !== undefined ? p.y : p[1], p.z !== undefined ? p.z : p[2]];
    for (const cm of [1.2, 2.5, 4.0]) {                 // nới dần: hõm sâu (nách, kheo) cần tay với dài
      const t = cm / CM;
      const ra = laKhi([q[0] + n[0] * t, q[1] + n[1] * t, q[2] + n[2] * t]);
      const vao = laKhi([q[0] - n[0] * t, q[1] - n[1] * t, q[2] - n[2] * t]);
      if (ra && !vao) return 1;
      if (!ra && vao) return -1;
    }
    return 0;
  }

  let khongPhanDinh = 0;

  CACHE = {
    CM,
    nTri,
    chiTietKiem: chiTiet,
    /** Số lần dinhChieu bó tay — đọc sau khi bake để biết có chỗ nào đáng ngờ không. */
    get soKhongPhanDinh() { return khongPhanDinh; },
    laKhi,
    /** Pháp tuyến RA NGOÀI tại điểm gần p nhất trên mặt da. null nếu p cách da quá xa. */
    normalAt(p) {
      const r = this.doAt(p);
      return r ? r.n : null;
    },
    /** { n, cp, dCm, hoCm, chac } — hoCm là khoảng cách CÓ DẤU tới mặt da (âm = đang ở trong người);
     *  chac=false khi trường khí không phân định được chiều (giữ nguyên chiều cuốn của mesh). */
    doAt(p) {
      const r = nearestTri(p);
      if (!r) return null;
      const s = dinhChieu(p, r.n);
      if (s === 0) khongPhanDinh++;
      const k = s === -1 ? -1 : 1;
      const n = [r.n[0] * k, r.n[1] * k, r.n[2] * k];
      const q = [p.x !== undefined ? p.x : p[0], p.y !== undefined ? p.y : p[1], p.z !== undefined ? p.z : p[2]];
      const ho = (q[0] - r.cp[0]) * n[0] + (q[1] - r.cp[1]) * n[1] + (q[2] - r.cp[2]) * n[2];
      return { n, cp: r.cp, dCm: r.d * CM, hoCm: ho * CM, chac: s !== 0 };
    },
    /** Nhấc p đi `cm` theo `huong` rồi đo còn hở mặt da bao nhiêu cm (âm = vẫn chìm trong người).
     *  Đo bằng TRƯỜNG KHÍ + mặt gần nhất: nếu điểm sau khi nhấc còn nằm trong người thì trả số ÂM. */
    hoCm(p, huong, cm) {
      const t = cm / CM;
      const q = { x: p.x + huong[0] * t, y: p.y + huong[1] * t, z: p.z + huong[2] * t };
      const r = nearestTri(q);
      if (!r) return null;
      return (laKhi(q) ? 1 : -1) * r.d * CM;
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
