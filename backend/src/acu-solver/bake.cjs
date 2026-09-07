/* bake.cjs — Chạy solveCoords() rồi GHI ĐÈ vào frontend/public/kinhmach3d/data/acu-coords3d.js.
 * Giữ nguyên mọi huyệt thuộc kinh không bake (kể cả GV dạng {h,az} — không đi qua solveCoords()).
 *
 * Dùng:  node backend/src/acu-solver/bake.cjs [LU,ST,CV,HT,...] [--no-skin]
 *   không tham số  → bake CẢ 13 kinh có toạ độ x,y,z (GV vẫn là cực toạ độ, frontend tự bắn tia)
 *   --no-skin      → bỏ TẦNG 5 (ép lên da). Chỉ dùng khi cần so sánh trước/sau.                    */
const fs = require('fs');
const path = require('path');
const { solveCoords } = require('./solve-coords.cjs');
const { clampToSkin } = require('./skin-clamp.cjs');

const OUT = path.resolve(__dirname, '../../../frontend/public/kinhmach3d/data/acu-coords3d.js');

// 13 kinh có toạ độ Descartes. GV (Đốc Mạch) dùng {h,az} nên không qua engine này.
const ALL_MERS = ['LU', 'LI', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'TE', 'GB', 'LR', 'CV', 'GV'];
const args = process.argv.slice(2);
const noSkin = args.includes('--no-skin');
const merArg = args.find(a => !a.startsWith('--'));
const mers = merArg ? merArg.split(',') : ALL_MERS;

(async () => {
  const src = fs.readFileSync(OUT, 'utf8');
  const window = {};
  // eslint-disable-next-line no-eval
  eval(src);
  const old = window.ACU_COORDS3D;

  const fresh = solveCoords(mers).points;

  // ---- TẦNG 5: ép lên da (luật bất biến "huyệt phải nằm trên người") ----
  let rep = null;
  if (!noSkin) {
    const r = await clampToSkin(fresh);
    rep = r.report;
    console.log(`\nTẦNG DA: ${rep.outsideTruoc} huyệt NGOÀI da trước khi ép · đã dời ${rep.moved} · gắn cờ cần soát ${rep.flagged}`);
    if (rep.rows.length) {
      console.log('  20 quãng dời lớn nhất:');
      for (const r2 of rep.rows.slice(0, 20))
        console.log(`   ${r2.code.padEnd(6)} ${r2.outside ? 'NGOÀI' : 'sâu  '} ${String(r2.cm).padStart(5)}cm (${String(r2.cun).padStart(5)} thốn)  conf=${r2.conf} src=${r2.src}`);
    }
  }

  const merged = { meridians: old.meridians, points: { ...old.points, ...fresh } };
  const changed = Object.keys(fresh).length;
  const total = Object.keys(merged.points).length;
  console.log(`\nBake ${mers.join('/')}: cập nhật ${changed} huyệt, tổng ${total}.`);

  const header = `/* Toạ độ huyệt 3D — sinh bởi ENGINE cốt-độ 5 TẦNG (backend/src/acu-solver).
 *  Tầng 1 mốc/chấm tay · 2 WHO 2008 · 3 sách VỊ TRÍ (vitri-data.json) + cốt độ · 4 khe mô · 5 ép lên da.
 *  q=exact (≥2 nguồn đồng thuận) · approx (1 nguồn, hoặc tầng da phải dời xa → xem canSoat).
 *  src=book|who|who-arb (+khe) · conf=mốc/khoá/cao/tạm/WHO-lấp/WHO-trọng tài/khe-khoá/khe/WHO+khe.
 *  canSoat = việc cần người soát mắt · canhBao = phạm điều cấm khe mô (xương/bụng cơ/lòng mạch).
 *  GV vẫn là cực toạ độ {h,az} — frontend tự bắn tia, chưa qua engine.
 *  Bake lại: node backend/src/acu-solver/bake.cjs [DS_KINH] (mặc định cả 13 kinh Descartes). */
window.ACU_COORDS3D = ` + JSON.stringify(merged, null, 2) + ';\n';

  fs.writeFileSync(OUT, header);
  console.log('Đã ghi', OUT);
  if (rep) fs.writeFileSync(path.join(__dirname, 'skin-clamp-report.json'), JSON.stringify(rep, null, 1));
})();
