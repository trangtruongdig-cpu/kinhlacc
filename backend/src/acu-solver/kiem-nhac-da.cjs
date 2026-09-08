/* kiem-nhac-da — NHẤC KHỎI DA XONG CÒN HỞ BAO NHIÊU.
 *
 * VÌ SAO CẦN. Engine đặt huyệt và đường kinh ĐÚNG TRÊN mặt da; frontend phải nhấc chúng lên 1,55cm thì
 * ống (đường kính 6,2mm) và chấm (9mm) mới không bị da nuốt. Không bộ kiểm nào trước đây hỏi câu này —
 * chúng đều dừng ở "huyệt có nằm trên da không", mà nằm trên da rồi vẫn có thể KHÔNG NHÌN THẤY.
 *
 * Lỗi gốc: map3d.js nhấc theo hướng TOẢ RA TỪ TRỤC DỌC THÂN. Ở thân mình hướng ấy lệch pháp tuyến
 * thật 11–31° nên không ai để ý; ở tay chân buông xuôi lệch 90–150°, mặt trong cẳng tay còn ngược
 * hẳn — "nhấc" thành đẩy vào trong thịt. Đo lần đầu: 140/507 đỉnh đường kinh (28%) hở nhỏ hơn bán
 * kính ống. Nay backend bake sẵn pháp tuyến (skin-normal.cjs) vào `nrm` của đường và `n` của huyệt.
 *
 * BỘ NÀY ĐO CẢ HAI, và đo cả hướng CŨ để thấy mức cải thiện. Nó cũng bắt được lỗi lệch pha giữa hai
 * bảng: chấm và ống PHẢI nhấc bằng cùng một véc-tơ, lệch nhau là chấm rời khỏi ống trên màn hình.
 *
 * Dùng:  node backend/src/acu-solver/kiem-nhac-da.cjs [--chi-tiet]                                  */
const fs = require('fs');
const path = require('path');
const { loadSkinNormals, huongToa, CM } = require('./skin-normal.cjs');

const ROOT = path.resolve(__dirname, '../../..');
const win = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };

const NHAC = 1.55;        // _SKIN_LIFT 0.009 × 171,9cm
const R_ONG = 0.31;       // bán kính ống đường kinh
const R_CHAM = 0.45;      // bán kính chấm huyệt
const LECH_CHAM = 0.3;    // chấm lệch pháp tuyến của đường quá ngần này (cm ở đầu véc-tơ) là đáng ngờ
const CHI_TIET = process.argv.includes('--chi-tiet');

(async () => {
  const SN = await loadSkinNormals();
  console.log('trường khí: ' + SN.chiTietKiem.join(' · ') + '\n');

  const MP = win(path.join(ROOT, 'frontend/public/kinhmach3d/data/meridian-paths.js'), 'MERIDIAN_PATHS');
  const AC = win(path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'ACU_COORDS3D');

  // ---- 1. ĐƯỜNG KINH ----
  const cu = [], moi = [], xau = [];
  let thieuNrm = 0;
  for (const [mer, d] of Object.entries(MP.mer)) for (const s of d.doan) {
    if (s.mo === 'chim' || !s.pts) continue;
    if (!s.nrm) { thieuNrm++; continue; }
    for (let i = 0; i < s.pts.length; i++) {
      const p = { x: s.pts[i][0], y: s.pts[i][1], z: s.pts[i][2] };
      const a = SN.hoCm(p, huongToa(p), NHAC), b = SN.hoCm(p, s.nrm[i], NHAC);
      if (a !== null) cu.push(a);
      if (b !== null) { moi.push(b); if (b < R_ONG) xau.push({ mer, id: s.id, i, ho: b, vung: s.vung }); }
    }
  }
  const tb = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  console.log('── ĐƯỜNG KINH ── nhấc ' + NHAC + 'cm, ống bán kính ' + R_ONG + 'cm');
  console.log(`   hướng TOẢ (bản cũ)   : hở TB ${tb(cu).toFixed(2)}cm · ${cu.filter(v => v < R_ONG).length}/${cu.length} đỉnh bị nuốt`);
  console.log(`   PHÁP TUYẾN (bản mới) : hở TB ${tb(moi).toFixed(2)}cm · ${xau.length}/${moi.length} đỉnh bị nuốt`);
  if (thieuNrm) console.log(`   ✗ ${thieuNrm} đoạn CHƯA CÓ nrm — chạy lại bake-paths.cjs`);
  for (const x of xau) console.log(`     · ${(x.mer + '/' + x.id).padEnd(20)} #${x.i} hở ${x.ho.toFixed(2)}cm — ${x.vung}`);

  // ---- 2. CHẤM HUYỆT ----
  const cuH = [], moiH = [], xauH = [];
  let thieuN = 0;
  for (const [code, p] of Object.entries(AC.points)) {
    if (!p || p.x === undefined) continue;
    if (!p.n) { thieuN++; continue; }
    const a = SN.hoCm(p, huongToa(p), NHAC), b = SN.hoCm(p, p.n, NHAC);
    if (a !== null) cuH.push(a);
    if (b !== null) { moiH.push(b); if (b < R_CHAM) xauH.push({ code, ho: b }); }
  }
  console.log('\n── CHẤM HUYỆT ── nhấc ' + NHAC + 'cm, chấm bán kính ' + R_CHAM + 'cm');
  console.log(`   hướng TOẢ (bản cũ)   : hở TB ${tb(cuH).toFixed(2)}cm · ${cuH.filter(v => v < R_CHAM).length}/${cuH.length} chấm bị nuốt`);
  console.log(`   PHÁP TUYẾN (bản mới) : hở TB ${tb(moiH).toFixed(2)}cm · ${xauH.length}/${moiH.length} chấm bị nuốt`);
  if (thieuN) console.log(`   ✗ ${thieuN} huyệt CHƯA CÓ n — chạy lại bake-points.cjs`);
  for (const x of xauH.slice(0, CHI_TIET ? 999 : 12)) console.log(`     · ${x.code.padEnd(7)} hở ${x.ho.toFixed(2)}cm`);

  /* ---- 3. CHẤM CÓ NHẤC CÙNG VÉC-TƠ VỚI ỐNG KHÔNG ----
   * Đây mới là phép kiểm đắt nhất của bộ này. Chấm và ống nhấc lệch nhau thì chấm rời khỏi đường ngay
   * trên màn hình — lỗi người dùng nhìn thấy đầu tiên, mà không bảng số nào khác lộ ra. */
  let lech = 0, xaNhat = 0, xaAi = '', xaCua = 0;
  const dsLech = [];
  for (const [code, p] of Object.entries(AC.points)) {
    if (!p || p.x === undefined || !p.n) continue;
    /* So với ĐƯỜNG CỦA CHÍNH NÓ, không phải đường gần nhất. Bản đầu tôi lấy đỉnh gần nhất trong TẤT
     * CẢ 14 kinh và báo TE3 lệch 2,39cm — sai người sai việc: ở mu bàn tay các kinh chạy sát nhau nên
     * đỉnh gần TE3 nhất lại là của kinh khác. Mã kinh chính là hai ký tự đầu của mã huyệt. */
    const mer = code.replace(/\d.*$/, '');
    const d = MP.mer[mer]; if (!d) continue;
    let best = null, bd = Infinity;
    for (const s of d.doan) {
      if (!s.pts || !s.nrm || s.pts.length < 2) continue;
      for (let i = 0; i < s.pts.length - 1; i++) {           // chiếu lên CẠNH, không bắt đỉnh
        const A = s.pts[i], B = s.pts[i + 1];
        const ab = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
        const L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
        const t = L2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((p.x - A[0]) * ab[0] + (p.y - A[1]) * ab[1] + (p.z - A[2]) * ab[2]) / L2));
        const c = [A[0] + ab[0] * t, A[1] + ab[1] * t, A[2] + ab[2] * t];
        const dd = (c[0] - p.x) ** 2 + (c[1] - p.y) ** 2 + (c[2] - p.z) ** 2;
        if (dd < bd) {
          bd = dd;
          const a = s.nrm[i], b = s.nrm[i + 1];
          best = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        }
      }
    }
    if (!best) continue;
    const bl = Math.hypot(best[0], best[1], best[2]) || 1;
    const dot = Math.max(-1, Math.min(1, (p.n[0] * best[0] + p.n[1] * best[1] + p.n[2] * best[2]) / bl));
    const dCm = Math.sqrt(Math.max(0, 2 - 2 * dot)) * NHAC;  // khoảng cách hai đầu véc-tơ sau khi nhấc
    if (dCm > LECH_CHAM) {
      lech++; dsLech.push({ code, dCm, xaDuong: Math.sqrt(bd) * CM });
      if (dCm > xaNhat) { xaNhat = dCm; xaAi = code; xaCua = Math.sqrt(bd) * CM; }
    }
  }
  console.log('\n── CHẤM vs ỐNG ── chấm có nhấc cùng véc-tơ với ống của CHÍNH KINH MÌNH không');
  console.log(lech ? `   ✗ ${lech} huyệt lệch quá ${LECH_CHAM}cm · xa nhất ${xaAi} ${xaNhat.toFixed(2)}cm (cách đường ${xaCua.toFixed(2)}cm)`
    : '   ✓ mọi huyệt đều nhấc cùng véc-tơ với ống.');
  for (const x of dsLech.slice(0, CHI_TIET ? 999 : 10))
    console.log(`     · ${x.code.padEnd(7)} lệch ${x.dCm.toFixed(2)}cm · cách đường ${x.xaDuong.toFixed(2)}cm`);

  const loi = (thieuNrm ? 1 : 0) + (thieuN ? 1 : 0) + (lech ? 1 : 0);
  console.log(`\n${loi ? '✗ có vấn đề' : '✓ ĐẠT'} · ${xau.length} đỉnh đường và ${xauH.length} chấm còn bị da nuốt`);
  process.exit(loi ? 1 : 0);
})();
