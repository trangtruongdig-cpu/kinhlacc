/* apply-interfaces — Áp bảng KHE MÔ đã duyệt vào toạ độ production (acu-coords3d.js).
 *
 * KHÁC bake.cjs: bake.cjs giải LẠI toàn bộ một kinh bằng cốt độ rồi ghi đè cả kinh đó. File này
 * chỉ đụng vào ĐÚNG những huyệt có trong interface-points.json, giữ nguyên mọi huyệt khác — kể cả
 * huyệt đặt tay, huyệt GV dạng {h,az}, và các kinh chưa bake. Chạy nhầm hai lần cũng không cộng dồn
 * (huyệt đã mang nhãn khe thì bỏ qua).
 *
 * Quy tắc ghi, khớp đúng applyTissueLayer trong solve-coords.cjs:
 *   · khe DỜI (slideCun ≥ 0,25)  → lấy toạ độ khe · src += '+khe' · conf = 'khe-khoá' | 'khe'
 *   · khe XÁC NHẬN (< 0,25)      → giữ toạ độ, nâng độ tin (tạm→cao, cao→khoá, WHO-lấp→WHO+khe)
 *   · toạ độ production đã lệch xa toạ độ nguồn lúc bake → BỎ QUA, báo để bake lại
 *
 * Dùng:  node backend/src/acu-solver/apply-interfaces.cjs [--dry] [--revert]
 *   --revert  hoàn nguyên các huyệt mang nhãn khe về toạ độ nguồn (`from`) rồi thoát — BẮT BUỘC
 *             chạy trước khi bake lại, vì bake-interfaces.cjs đọc chính file này làm toạ độ gốc:
 *             không hoàn nguyên thì mọi huyệt đã dời sẽ thành "xác nhận" giả.                     */
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '../../../frontend/public/kinhmach3d/data/acu-coords3d.js');
const TABLE = require('./interface-points.json');
const ADOPT_MAX = 0.05;      // khớp TISSUE_ADOPT_MAX của solve-coords.cjs
const H = 171.9;

const dry = process.argv.includes('--dry');
const revert = process.argv.includes('--revert');
const src = fs.readFileSync(OUT, 'utf8');
const win = {};
new Function('window', src)(win);
const doc = win.ACU_COORDS3D;

if (revert) {
  const win0 = {}; new Function('window', src)(win0);
  const d0 = win0.ACU_COORDS3D;
  let n = 0, giu = [];
  for (const [code, t] of Object.entries(TABLE.points)) {
    const p = d0.points[code];
    if (!p || !t.from || p.x === undefined) continue;
    const laKhe = Math.hypot(p.x - t.x, p.y - t.y, p.z - t.z) < 1e-4;
    const laGoc = Math.hypot(p.x - t.from.x, p.y - t.from.y, p.z - t.from.z) < 1e-4;
    if (!laKhe && !laGoc) { giu.push(code); continue; }   // phiên khác đã sửa sau đó → không đụng
    if (laKhe) { p.x = t.from.x; p.y = t.from.y; p.z = t.from.z; n++; }
    delete p.khe; delete p.kheLoai; delete p.kheXacNhan; delete p.canhBao; delete p.canSoat;
    if (String(p.src).includes('+khe')) p.src = String(p.src).replace('+khe', '');
    if (p.conf === 'khe' || p.conf === 'khe-khoá') p.conf = 'tạm';
    if (p.conf === 'WHO+khe') p.conf = 'WHO-lấp';
  }
  const h0 = src.slice(0, src.indexOf('window.ACU_COORDS3D'));
  fs.writeFileSync(OUT, h0 + 'window.ACU_COORDS3D = ' + JSON.stringify(d0, null, 2) + ';\n');
  console.log(`Hoàn nguyên ${n} huyệt về toạ độ nguồn` + (giu.length ? ` · giữ nguyên ${giu.length} huyệt phiên khác đã sửa: ${giu.join(' ')}` : ''));
  process.exit(0);
}

const UP = { 'tạm': 'cao', 'cao': 'khoá', 'WHO-lấp': 'WHO+khe', 'WHO-trọng tài': 'WHO+khe' };
let doi = 0, xacNhan = 0, boQua = 0, daCo = 0;
const canBake = [];

for (const [code, t] of Object.entries(TABLE.points)) {
  const p = doc.points[code];
  if (!p || p.x === undefined) { boQua++; continue; }        // huyệt {h,az} hoặc chưa có toạ độ
  if (p.khe) { daCo++; continue; }                            // đã áp lần trước
  if (t.from) {
    const d = Math.hypot(p.x - t.from.x, p.y - t.from.y, p.z - t.from.z);
    if (d > ADOPT_MAX) { canBake.push(`${code} (lệch ${(d * H).toFixed(1)} cm)`); boQua++; continue; }
  }
  p.khe = t.tissues;
  if (t.kind && t.kind !== 'sat-bo') p.kheLoai = t.kind;
  if (t.warns) p.canhBao = t.warns;

  if (t.slideCun != null && t.slideCun >= 0.25) {             // DỜI vào khe
    p.x = t.x; p.y = t.y; p.z = t.z;
    p.src = (p.src || 'book') + '+khe';
    p.conf = t.conf === 'khe-ro' ? 'khe-khoá' : 'khe';
    if (t.conf === 'khe-ro') p.q = 'exact';
    doi++;
  } else {                                                    // XÁC NHẬN chỗ cũ
    p.kheXacNhan = true;
    const up = UP[p.conf];
    if (up) p.conf = up;
    if (p.conf === 'khoá' || p.conf === 'cao' || p.conf === 'WHO+khe') p.q = 'exact';
    xacNhan++;
  }
}

console.log(`Áp bảng khe: ${doi} huyệt DỜI vào khe · ${xacNhan} huyệt XÁC NHẬN (nâng độ tin) · ${daCo} đã áp từ trước · ${boQua} bỏ qua`);
if (canBake.length) console.log('  ⚠ toạ độ production đã đổi so với lúc bake, cần chạy lại bake-interfaces.cjs: ' + canBake.join(', '));

if (dry) { console.log('(--dry: không ghi file)'); process.exit(0); }

const header = src.slice(0, src.indexOf('window.ACU_COORDS3D'));
const kheLine = '\n *  TẦNG KHE MÔ (tissue-rules.cjs) đã áp: conf=khe-khoá/khe · trường khe/kheLoai/kheXacNhan cho biết\n' +
  ' *  huyệt tựa vào ranh giới mô nào. Bake lại bảng: node backend/src/acu-solver/bake-interfaces.cjs --safety\n';
const newHeader = header.includes('TẦNG KHE MÔ') ? header : header.replace(/ \*\/\s*$/, kheLine + ' */\n');
fs.writeFileSync(OUT, newHeader + 'window.ACU_COORDS3D = ' + JSON.stringify(doc, null, 2) + ';\n');
console.log('Đã ghi ' + path.relative(process.cwd(), OUT));
