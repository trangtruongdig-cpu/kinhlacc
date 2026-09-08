/* bake-points — BƯỚC 4a của mô hình ĐƯỜNG KINH: RẢI HUYỆT THEO CỐT ĐỘ DỌC ĐƯỜNG.
 *
 * Ba bước trước dựng được một ĐƯỜNG đúng: nó nằm trên da (bước 2) và nằm trong rãnh cơ–xương mà sách
 * mô tả (bước 3). Nhưng huyệt thì vẫn ở chỗ cũ — đo được 75 huyệt lệch quá 3cm khỏi đường của chính
 * mình. Bước này kéo huyệt VỀ đường.
 *
 * CÁCH RẢI — vì sao không chia đều
 * Huyệt không cách đều nhau; chúng cách nhau theo THỐN. `frontend/.../data/spacing.js` (ACU_SPACING)
 * đã có sẵn vị trí tích luỹ của từng huyệt dọc kinh, và nó trung thành với cốt độ sách: đối chiếu
 * LU6 ra 7,3 thốn trên cổ tay (sách 7), ST36 ra 2,7 thốn dưới mắt gối (sách 3), LU7 ra 1,9 (sách 1,5)
 * — sai số ~0,5–0,8 thốn. Dùng nó làm TRỌNG SỐ rải là đúng tinh thần 骨度 hơn hẳn chia đều.
 *
 * NEO TẠI TỪNG NÚT, không neo hai đầu đoạn
 * Nếu chỉ neo hai đầu rồi nội suy tuyến tính thì sai số của bảng cốt độ tích luỹ dồn về giữa. Ở đây
 * mọi NÚT (mốc giải phẫu đã duyệt) đều là điểm neo: huyệt giữa hai nút liên tiếp được nội suy TRONG
 * khoảng đó. Nút càng dày thì rải càng sát sách.
 *
 * BA THỨ KHÔNG ĐỤNG TỚI
 *   · huyệt chốt bằng MỐC/CHẤM TAY (src='anchor') — tầng 1 vẫn thắng tuyệt đối;
 *   · huyệt trên đoạn không dựng được đường (LI/vai, GB/chân-tóc-thái-dương — lỗi toạ độ trùng lặp);
 *   · Đốc Mạch dạng cực toạ độ {h,az} — chưa qua engine Descartes.
 *
 * Mọi huyệt bị dời đều ghi lại toạ độ cũ trong `truocRai` + quãng dời `raiCm`, nên hoàn nguyên được
 * và người soát đọc được engine đã làm gì.
 *
 * Dùng:  node backend/src/acu-solver/bake-points.cjs [--thu]   (--thu = chỉ in, không ghi)          */
const fs = require('fs');
const path = require('path');
const { NODES } = require('./meridian-nodes.cjs');
const { THEO_HUYET } = require('./cot-do-chi.cjs');

const ROOT = path.resolve(__dirname, '../../..');
const COORDS = path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js');
const PATHS = path.join(ROOT, 'frontend/public/kinhmach3d/data/meridian-paths.js');
const SPACING = path.join(ROOT, 'frontend/public/kinhmach3d/data/spacing.js');
const CM = 171.9;

const loadWin = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };

/** chiều dài tích luỹ dọc polyline */
function arcs(pts) {
  const a = [0];
  for (let i = 1; i < pts.length; i++) a.push(a[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  return a;
}
/** điểm trên polyline tại vị trí cung s */
function atArc(pts, cum, s) {
  const L = cum[cum.length - 1];
  s = Math.max(0, Math.min(L, s));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const t = cum[i] - cum[i - 1] > 0 ? (s - cum[i - 1]) / (cum[i] - cum[i - 1]) : 0;
  return {
    x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
    y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t,
    z: pts[i - 1][2] + (pts[i][2] - pts[i - 1][2]) * t,
  };
}
/** vị trí cung của điểm gần P nhất trên polyline */
function arcOf(pts, cum, P) {
  let bd = Infinity, bs = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
    const ap = [P.x - a[0], P.y - a[1], P.z - a[2]];
    let t = L2 > 0 ? (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(ap[0] - t * ab[0], ap[1] - t * ab[1], ap[2] - t * ab[2]);
    if (d < bd) { bd = d; bs = cum[i - 1] + t * (cum[i] - cum[i - 1]); }
  }
  return { s: bs, d: bd };
}

const S = require('./surface-path.cjs');
const { L } = require('./model-frame.cjs');


(async () => {
/* Đồ thị da: cần cho phép LỆCH NGANG bên dưới — dời huyệt sang phía sách ghi rồi ép lại lên da.
 * Vì thế cả phần thân dưới đây phải nằm trong hàm async. */
const skin = await S.loadSkinGraph();
const THU = process.argv.includes('--thu');

const P = loadWin(COORDS, 'ACU_COORDS3D');

/* TRỤC CỐT ĐỘ CỦA MỘT ĐOẠN — ưu tiên MỐC XƯƠNG, không phải hai huyệt đầu đoạn.
 * Sách đo "3 thốn trên mắt cá", "5 thốn trên nếp cổ tay"; lấy huyệt đầu đoạn thay mốc thì gốc thang
 * lệch sẵn (GB40 thấp hơn mắt cá 0,98 thốn) và cả đoạn trôi theo — xem chú thích đầu cot-do-chi.cjs.
 * Mốc trong model-frame khai cho nửa người x>0; huyệt bên kia thì soi gương lại. */
function trucDoan(tt, pt) {
  if (tt.xaMoc && L[tt.xaMoc] && L[tt.ganMoc]) {
    const ben = pt && pt.x < 0 ? -1 : 1;
    const soi = m => ({ x: m.x * ben, y: m.y, z: m.z });
    return { A: soi(L[tt.xaMoc]), B: soi(L[tt.ganMoc]) };
  }
  const A = P.points[tt.xa], B = P.points[tt.gan];
  return (A && B && A.x !== undefined && B.x !== undefined) ? { A, B } : { A: null, B: null };
}

const MP = loadWin(PATHS, 'MERIDIAN_PATHS');
const SP = loadWin(SPACING, 'ACU_SPACING');

const rows = [], boQua = [];
let dai = 0, giu = 0;

for (const [mer, def] of Object.entries(NODES)) {
  const nodeSet = new Set(def.nut.map(n => n.code));
  const mp = MP.mer[mer];
  if (!mp) continue;
  for (const seg of def.doan) {
    const sp = (mp.doan.find(x => x.id === seg.id) || {}).pts;
    if (!sp || sp.length < 2) { for (const c of seg.diem) boQua.push({ code: c, vi: mer + '/' + seg.id, ly: 'đoạn không dựng được đường' }); continue; }
    const cum = arcs(sp), L = cum[cum.length - 1];

    /* SỬA THANG CỐT ĐỘ Ở CHỖ MÃ SỐ NHẢY.
     * ACU_SPACING là vị trí TÍCH LUỸ dọc cả kinh theo đúng thứ tự MÃ SỐ. Ở kinh Bàng Quang, mã nhảy
     * từ BL40 (nếp kheo) sang BL41 (lưng trên) rồi mới quay lại BL55 (bắp chân) — nên khoảng cách
     * tích luỹ BL40→BL55 đã nuốt trọn cả đường lưng ngoài. Dùng thẳng số đó, BL55 bị đẩy tới 86%
     * quãng từ nếp kheo xuống mắt cá, trong khi sách ghi nó chỉ dưới nếp kheo 2 thốn.
     * Chỉ vá ĐÚNG chỗ mã không liền nhau: thay khoảng nhảy bằng trung vị các khoảng còn lại của đoạn. */
    const kOf = {};
    {
      const ds = [];
      for (let i = 1; i < seg.diem.length; i++) {
        const a0 = SP[mer][seg.diem[i - 1]], b0 = SP[mer][seg.diem[i]];
        if (a0 !== undefined && b0 !== undefined) ds.push(b0 - a0);
      }
      const lien = (a0, b0) => Math.abs(+b0.replace(/\D/g, '') - +a0.replace(/\D/g, '')) === 1;
      const sorted = ds.filter(x => x > 0).sort((x, y) => x - y);
      const med = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0.02;
      let acc = 0;
      kOf[seg.diem[0]] = 0;
      for (let i = 1; i < seg.diem.length; i++) {
        const a0 = SP[mer][seg.diem[i - 1]], b0 = SP[mer][seg.diem[i]];
        let d = (a0 !== undefined && b0 !== undefined) ? b0 - a0 : med;
        if (!lien(seg.diem[i - 1], seg.diem[i]) && d > 5 * med) d = med;   // khoảng nhảy do đánh số
        acc += Math.max(d, 0);
        kOf[seg.diem[i]] = acc;
      }
    }

    /* CỐT ĐỘ CỔ ĐIỂN THẮNG BẢNG TÍCH LUỸ ở cẳng tay/cẳng chân.
     * `cot-do-chi.cjs` chép thẳng số thốn từ sách, quy về thang tính từ đầu XA của đoạn. Dùng nó
     * thay cho kOf suy từ ACU_SPACING, vì bảng tích luỹ méo ở chỗ mã số nhảy (nặng nhất là cẳng chân
     * Bàng Quang). Chỉ ghi đè khi CẢ HAI đầu mút của đoạn đều có mặt trong danh sách điểm — có thế
     * mới nội suy được trên đúng thang. */
    {
      const co = seg.diem.map(c => THEO_HUYET[c]).find(Boolean);
      if (co && kOf[co.xa] !== undefined && kOf[co.gan] !== undefined) {
        const kXa = kOf[co.xa], kGan = kOf[co.gan];
        for (const c of seg.diem) {
          const t = THEO_HUYET[c];
          if (!t || t.doan !== co.doan) continue;
          kOf[c] = kXa + (kGan - kXa) * (t.thon / t.tong);
        }
      }
    }

    // ---- điểm neo của đoạn: hai đầu + mọi NÚT, kèm vị trí cung của chúng ----
    const neo = [];
    seg.diem.forEach((c, i) => {
      if (i !== 0 && i !== seg.diem.length - 1 && !nodeSet.has(c)) return;
      const pt = P.points[c];
      if (!pt || pt.x === undefined || kOf[c] === undefined) return;
      neo.push({ code: c, s: arcOf(sp, cum, pt).s, k: kOf[c] });
    });
    if (neo.length < 2) { for (const c of seg.diem) boQua.push({ code: c, vi: mer + '/' + seg.id, ly: 'đoạn thiếu điểm neo' }); continue; }
    neo.sort((a, b) => a.k - b.k);
    // ép vị trí cung của các neo phải tăng dần — neo lệch thứ tự thì bỏ, đừng để nó lật cả đoạn
    for (let i = 1; i < neo.length; i++) if (neo[i].s <= neo[i - 1].s) neo[i].s = Math.min(L, neo[i - 1].s + 1e-4);

    for (const c of seg.diem) {
      const pt = P.points[c];
      if (!pt || pt.x === undefined) continue;
      if (pt.src === 'anchor') { giu++; continue; }          // tầng 1 thắng tuyệt đối
      if (nodeSet.has(c)) { giu++; continue; }               // nút đã duyệt, không rải lại
      const tt0 = THEO_HUYET[c];
      const k = kOf[c];
      if (k === undefined && !tt0) { boQua.push({ code: c, vi: mer + '/' + seg.id, ly: 'không có số cốt độ' }); continue; }
      // nội suy TRONG khoảng hai neo kề nhau theo thang cốt độ
      let a = neo[0], b = neo[neo.length - 1];
      for (let i = 1; i < neo.length; i++) if (neo[i].k >= k) { a = neo[i - 1]; b = neo[i]; break; }
      const f = b.k > a.k ? (k - a.k) / (b.k - a.k) : 0;
      const s = a.s + Math.max(0, Math.min(1, f)) * (b.s - a.s);
      let q = atArc(sp, cum, s);
      /* CỐT ĐỘ ĐO THEO TRỤC CHI, KHÔNG THEO CUNG.
       * Sách nói "3 thốn trên mắt cá" là đo dọc trục cẳng chân. Đường kinh lại lượn quanh chi nên cung
       * của nó dài hơn trục, và tỉ lệ cung ≠ tỉ lệ trục. Nội suy theo cung làm huyệt trôi: đo được
       * GB39 Huyền Chung ra 2,4 thốn thay vì 3 (lệch 1,6cm). Ở đây dò dọc đường tìm đúng điểm có HÌNH
       * CHIẾU TRỤC bằng số thốn sách ghi — cốt độ thành đúng theo định nghĩa, không còn phụ thuộc
       * đường cong ngắn hay dài. */
      if (tt0 && (tt0.xaMoc || (P.points[tt0.xa] && P.points[tt0.gan]))) {
        const { A, B } = trucDoan(tt0, pt);
        const ax = B.x - A.x, ay = B.y - A.y, az = B.z - A.z;
        const L2 = ax * ax + ay * ay + az * az;
        if (L2 > 0) {
          const dich = tt0.thon / tt0.tong;                       // tỉ lệ trục cần đạt (0..1)
          const truc = u => ((u.x - A.x) * ax + (u.y - A.y) * ay + (u.z - A.z) * az) / L2;
          let lo = 0, hi = L, dau = truc(atArc(sp, cum, 0));
          const tang = truc(atArc(sp, cum, L)) > dau;             // đường đi xuôi hay ngược thang trục
          for (let it = 0; it < 40; it++) {                       // chia đôi trên tham số cung
            const mid = (lo + hi) / 2, t = truc(atArc(sp, cum, mid));
            if ((t < dich) === tang) lo = mid; else hi = mid;
          }
          q = atArc(sp, cum, (lo + hi) / 2);
        }
      }
      /* LỆCH NGANG: huyệt khai cùng số thốn dọc với huyệt khác thì phải tách ra theo phía sách ghi,
       * nếu không hai huyệt chồng khít (đã đo GB35 ≡ GB36, ST38 ≡ ST40, TE6 ≡ TE7 đều 0,00cm). */
      const tt = tt0;
      if (tt && tt.lech) {
        /* cm mỗi thốn tính theo TRỤC (hai đầu đoạn), không theo chiều dài cung — cùng lý do với phép
         * rải ở trên: cung lượn quanh chi nên dài hơn trục, lấy cung thì khoảng lệch ngang bị thổi
         * phồng (đo được KI7–KI8 ra 2,25cm trong khi sách ghi 0,5 thốn ≈ 1,4cm). */
        const { A: A0, B: B0 } = trucDoan(tt, pt);
        const thonCm = (A0 && B0
          ? Math.hypot(B0.x - A0.x, B0.y - A0.y, B0.z - A0.z)
          : Math.abs(neo[neo.length - 1].s - neo[0].s)) / tt.tong;
        const r = tt.lech * thonCm * (tt.huong === 'sau' || tt.huong === 'trong' ? -1 : 1);
        const truc = (tt.huong === 'ngoai' || tt.huong === 'trong') ? 'x' : 'z';
        const ben = pt.x < 0 && truc === 'x' ? -1 : 1;
        /* BÒ TRÊN MẶT DA, không đẩy thẳng theo trục toạ độ rồi dán lại.
         * Chi là hình trụ: đẩy ngang 1,9cm từ một điểm trên mặt là chui vào trong lòng chi, rồi dán
         * về đỉnh gần nhất thì nuốt gần hết quãng vừa đi — đo được TE6–TE7 chỉ còn 0,58cm trong khi
         * sách ghi 1 thốn ≈ 1,9cm, GB35–GB36 còn 2,36 trong khi phải 3,3. Ở đây chia nhỏ thành 10 bước:
         * mỗi bước đi một đoạn ngắn theo hướng cần, rồi hạ về da NHƯNG BỎ thành phần dọc hướng đi —
         * tức chỉ sửa độ sâu, giữ nguyên quãng ngang đã bò. */
        const huong = { x: truc === 'x' ? ben * Math.sign(r) : 0, y: 0, z: truc === 'z' ? Math.sign(r) : 0 };
        const buoc = Math.abs(r) / 10;
        for (let k = 0; k < 10; k++) {
          q = { x: q.x + huong.x * buoc, y: q.y + huong.y * buoc, z: q.z + huong.z * buoc };
          const nr = skin.nearest(q); if (!nr) continue;
          let vx = nr.p.x - q.x, vy = nr.p.y - q.y, vz = nr.p.z - q.z;
          const doc = vx * huong.x + vy * huong.y + vz * huong.z;      // bỏ thành phần dọc hướng bò
          vx -= doc * huong.x; vy -= doc * huong.y; vz -= doc * huong.z;
          const lv = Math.hypot(vx, vy, vz);
          if (lv > 0.004) { const t = (lv - 0.004) / lv; q = { x: q.x + vx * t, y: q.y + vy * t, z: q.z + vz * t }; }
        }
        // sai số độ sâu dồn lại sau 10 bước; trôi quá 1cm thì ép hẳn về da (quãng ngang đã đi đủ rồi)
        { const nr = skin.nearest(q); if (nr && nr.d > 0.006) q = nr.p; }
      }
      const d = Math.hypot(q.x - pt.x, q.y - pt.y, q.z - pt.z);
      rows.push({ code: c, mer, doan: seg.id, cm: +(d * CM).toFixed(2), conf: pt.conf || '', tu: [pt.x, pt.y, pt.z], den: [+q.x.toFixed(4), +q.y.toFixed(4), +q.z.toFixed(4)] });
      dai++;
    }
  }
}

rows.sort((a, b) => b.cm - a.cm);
const tb = rows.reduce((s, r) => s + r.cm, 0) / (rows.length || 1);
console.log(`RẢI THEO CỐT ĐỘ: ${dai} huyệt rải lại · ${giu} giữ nguyên (mốc/nút) · ${boQua.length} bỏ qua`);
console.log(`  quãng dời: TB ${tb.toFixed(2)}cm · quá 3cm: ${rows.filter(r => r.cm > 3).length} · quá 6cm: ${rows.filter(r => r.cm > 6).length}`);
console.log('\n  20 huyệt dời xa nhất:');
for (const r of rows.slice(0, 20)) console.log(`   ${r.code.padEnd(6)} ${String(r.cm).padStart(6)}cm  ${(r.mer + '/' + r.doan).padEnd(18)} conf=${r.conf}`);
if (boQua.length) {
  const g = {};
  for (const b of boQua) (g[b.ly] = g[b.ly] || []).push(b.code);
  console.log('\n  bỏ qua:');
  for (const [ly, cs] of Object.entries(g)) console.log(`   ${ly}: ${cs.join(',')}`);
}

if (THU) { console.log('\n(--thu: KHÔNG ghi tệp)'); return; }

for (const r of rows) {
  const pt = P.points[r.code];
  pt.truocRai = r.tu;
  pt.raiCm = r.cm;
  pt.x = r.den[0]; pt.y = r.den[1]; pt.z = r.den[2];
  pt.src = /\+duong$/.test(pt.src || '') ? pt.src : (pt.src || '?') + '+duong';
  if (r.cm > 3) { pt.q = 'approx'; pt.canSoat = (pt.canSoat ? pt.canSoat + ' · ' : '') + `RẢI DỌC ĐƯỜNG: dời ${r.cm}cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt`; }
}
/* ---- PHÁP TUYẾN MẶT DA CHO TỪNG HUYỆT ----------------------------------------------------------
 * map3d.js nhấc chấm huyệt khỏi da 1,55cm cho khỏi chìm. Trước đây nó nhấc theo hướng TOẢ RA TỪ TRỤC
 * DỌC THÂN — ở tay chân hướng ấy lệch 90–150° so với mặt da nên chấm bị đẩy vào trong thịt. Nay ghi
 * sẵn pháp tuyến vào bảng.
 *
 * LẤY PHÁP TUYẾN TỪ ĐƯỜNG KINH, KHÔNG TÍNH RIÊNG CHO HUYỆT. Đây là điều kiện bắt buộc, không phải
 * tối ưu: chấm và ống phải nhấc bằng ĐÚNG MỘT véc-tơ, nếu không chúng tách nhau ngay trên màn hình
 * dù dữ liệu đặt huyệt đúng trên đường — lỗi này đã xảy ra một lần với phép "dán da lần hai" và người
 * dùng thấy ngay. Pháp tuyến của đường đã được làm mượt dọc đường (bake-paths), nên lấy từ đó vừa
 * khớp ống vừa mượt. Chỉ huyệt nào không nằm gần đường nào mới hỏi thẳng mặt da. */
const { loadSkinNormals } = require('./skin-normal.cjs');
const SN = await loadSkinNormals();
const MER_CUA = {};
for (const [mer, def] of Object.entries(NODES)) for (const s of def.doan) for (const c of s.diem) MER_CUA[c] = mer;

/** Pháp tuyến tại q lấy từ đường kinh `mer`: điểm gần nhất trên polyline, nội suy nrm hai đầu cạnh. */
function nrmTuDuong(mer, q) {
  const mp = MP.mer[mer]; if (!mp) return null;
  let best = null, bd = Infinity;
  for (const s of mp.doan) {
    if (!s.pts || s.pts.length < 2 || !s.nrm) continue;
    for (let i = 0; i < s.pts.length - 1; i++) {
      const A = s.pts[i], B = s.pts[i + 1];
      const ab = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
      const L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
      const t = L2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((q.x - A[0]) * ab[0] + (q.y - A[1]) * ab[1] + (q.z - A[2]) * ab[2]) / L2));
      const c = [A[0] + ab[0] * t, A[1] + ab[1] * t, A[2] + ab[2] * t];
      const d = (c[0] - q.x) ** 2 + (c[1] - q.y) ** 2 + (c[2] - q.z) ** 2;
      if (d < bd) { bd = d; best = { s, i, t }; }
    }
  }
  if (!best || bd > 0.02 ** 2) return null;            // xa đường quá 3,4cm thì đừng mượn pháp tuyến của nó
  const a = best.s.nrm[best.i], b = best.s.nrm[best.i + 1], t = best.t;
  const n = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const l = Math.hypot(n[0], n[1], n[2]);
  return l < 1e-9 ? null : [n[0] / l, n[1] / l, n[2] / l];
}

let tuDuong = 0, tuDa = 0, khongCo = 0;
for (const [code, pt] of Object.entries(P.points)) {
  if (!pt || pt.x === undefined) { khongCo++; continue; }        // GV dạng cực toạ độ {h,az}
  let n = MER_CUA[code] ? nrmTuDuong(MER_CUA[code], pt) : null;
  if (n) tuDuong++; else { n = SN.normalAt(pt); if (n) tuDa++; else khongCo++; }
  if (n) pt.n = [+n[0].toFixed(3), +n[1].toFixed(3), +n[2].toFixed(3)];
}
console.log(`\nPHÁP TUYẾN: ${tuDuong} huyệt lấy theo đường kinh · ${tuDa} hỏi thẳng mặt da · ${khongCo} không có (cực toạ độ)`);

const header = `/* Toạ độ huyệt 3D — ENGINE cốt-độ 5 TẦNG + RẢI DỌC ĐƯỜNG KINH (backend/src/acu-solver).
 *  Tầng 1 mốc/chấm tay · 2 WHO 2008 · 3 sách VỊ TRÍ + cốt độ · 4 khe mô · 5 ép lên da
 *  · rồi RẢI LẠI theo cốt độ dọc đường kinh (bake-points.cjs) — đường dựng bởi bake-paths.cjs.
 *  src có hậu tố '+duong' = đã rải dọc đường · truocRai = toạ độ trước khi rải · raiCm = quãng dời.
 *  q=exact (≥2 nguồn) · approx (1 nguồn, hoặc bị dời xa → xem canSoat).
 *  n = PHÁP TUYẾN MẶT DA tại huyệt, chuẩn hoá, hướng RA NGOÀI — lấy theo pháp tuyến của chính đường
 *    kinh chứa nó (meridian-paths.js field nrm) để chấm và ống nhấc bằng CÙNG một véc-tơ.
 *    Frontend nhấc chấm theo n; KHÔNG được nhấc theo hướng toả ra từ trục dọc thân (chấm sẽ chìm).
 *  GV vẫn là cực toạ độ {h,az} — chưa qua engine.
 *  Sinh lại: node bake.cjs → node bake-paths.cjs → node bake-points.cjs */
window.ACU_COORDS3D = `;
fs.writeFileSync(COORDS, header + JSON.stringify(P, null, 2) + ';\n');
fs.writeFileSync(path.join(__dirname, 'points-report.json'), JSON.stringify({ rows, boQua }, null, 1));
console.log(`\nĐã ghi ${COORDS}`);

})();