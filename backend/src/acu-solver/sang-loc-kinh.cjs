/* sang-loc-kinh — SÀNG LỌC MỘT KINH BẰNG MÁY, TRƯỚC KHI GỌI AGENT.
 *
 * VÌ SAO. Ba phiên hội đồng đầu tốn 3,5M / 2,5M / 0,6M token, và phiên rẻ nhất lại bắt được nhiều
 * nhất — vì trước khi gọi agent, máy đã khoanh sẵn chỗ đáng ngờ và loại sạch báo động giả. Tệp này
 * gom đúng việc ấy thành một lệnh, để mỗi kinh chỉ phải trả tiền agent cho phần THẬT SỰ cần mắt người:
 * đọc ảnh sách.
 *
 * SÁU PHÉP, xếp theo thứ tự "rẻ và chặt" trước:
 *   1. CỐT ĐỘ — chiếu lên trục hai mốc xương, so số thốn sách đòi. Kèm CẢNH BÁO VÒNG TRÒN: đoạn nào
 *      khai xa/gan là HUYỆT thay vì mốc xương thì con số khớp đến hai chữ số cũng vô nghĩa.
 *   2. DẢI KINH — huyệt có chồng lên kinh khác không (bộ kiem-dai-kinh lo, đây chỉ lọc phần của kinh).
 *   3. THỨ TỰ — huyệt có xếp đúng trình tự dọc trục đoạn không.
 *   4. CHẬP CÙNG KINH — hai huyệt liền nhau quá gần.
 *   5. ĐOẠN NEO HAI ĐẦU — đoạn đường kinh bỏ rơi huyệt giữa, chỗ khâu rải hay kéo huyệt lệch dải.
 *   6. CỜ CÒN LẠI — cờ mà các report hiện tại còn bắn cho kinh này.
 *
 * Dùng:  node sang-loc-kinh.cjs GB                                                                  */
const fs = require('fs');
const path = require('path');
const { L } = require('./model-frame.cjs');
const { DOAN } = require('./cot-do-chi.cjs');
const { NODES } = require('./meridian-nodes.cjs');
const CM = 171.9;
const ROOT = path.resolve(__dirname, '../../..');
const win = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };
const P = win(path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'ACU_COORDS3D').points;
const PATHS = win(path.join(ROOT, 'frontend/public/kinhmach3d/data/meridian-paths.js'), 'MERIDIAN_PATHS').mer;
const V = require('./vitri-data.json').points;
const SO = require('./huyet-chot.json');
const DAI = require('./dai-kinh-report.json');
const REP = { diem: require('./points-report.json'), duong: require('./paths-report.json'), da: require('./skin-clamp-report.json') };
const TEN = {}; for (const p of V) TEN[p.code] = p.name;
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * CM;

const mer = process.argv[2];
if (!mer || !NODES[mer]) { console.log('Dùng: node sang-loc-kinh.cjs <MÃ KINH>   (' + Object.keys(NODES).join(' ') + ')'); process.exit(1); }
const ds = V.filter(p => p.mer === mer);
const ngo = SO.ngo || {};
const hang = c => (SO.chot[c] || {}).hang || (ngo[c] ? 'C' : '—');

console.log(`════ SÀNG LỌC KINH ${mer} — ${NODES[mer].ten} · ${ds.length} huyệt ════`);
const dem = {}; for (const p of ds) dem[hang(p.code)] = (dem[hang(p.code)] || 0) + 1;
console.log('hạng nghiệm thu: ' + JSON.stringify(dem) + '\n');

// ---- 1. CỐT ĐỘ ----
console.log('── 1. CỐT ĐỘ');
let coDoan = false;
for (const [k, dn] of Object.entries(DOAN)) {
  if (!k.startsWith(mer + '/')) continue;
  coDoan = true;
  const neoHuyet = !dn.xaMoc || !dn.ganMoc;
  const A = L[dn.xaMoc] || P[dn.xa], B = L[dn.ganMoc] || P[dn.gan];
  if (!A || !B) { console.log(`   ${k}: THIẾU MỐC`); continue; }
  const ax = B.x - A.x, ay = B.y - A.y, az = B.z - A.z, L2 = ax * ax + ay * ay + az * az;
  const t = p => ((p.x - A.x) * ax + (p.y - A.y) * ay + (p.z - A.z) * az) / L2 * dn.tong;
  const cmThon = Math.sqrt(L2) * CM / dn.tong;
  console.log(`   ${k}  tong ${dn.tong} thốn · ${dn.xaMoc || dn.xa}→${dn.ganMoc || dn.gan} · 1 thốn = ${cmThon.toFixed(2)}cm`);
  if (neoHuyet) console.log(`      ⚠ VÒNG TRÒN: đoạn này neo vào HUYỆT (${dn.xa}→${dn.gan}), không phải mốc xương.`
    + ` Số thốn dưới đây khớp là tất yếu, KHÔNG phải bằng chứng.`);
  for (const [c, o] of Object.entries(dn.diem)) {
    const th = typeof o === 'number' ? o : o.thon; const p = P[c]; if (!p) continue;
    const lech = (t(p) - th) * cmThon;
    console.log(`      ${c.padEnd(6)}${(TEN[c] || '').padEnd(15)}sách ${String(th).padStart(5)}  đo ${t(p).toFixed(2).padStart(6)}  lệch ${lech.toFixed(2).padStart(6)}cm${Math.abs(lech) > 1.2 ? '   ✗' : Math.abs(lech) > 0.6 ? '   ~' : ''}`);
  }
}
if (!coDoan) console.log('   (kinh này không có đoạn cốt độ nào khai trong cot-do-chi.cjs)');

// ---- 2. DẢI KINH ----
console.log('\n── 2. ĐỤNG KINH KHÁC (từ dai-kinh-report)');
const dung = [...DAI.chap.map(x => ({ ...x, muc: 'CHẬP' })), ...DAI.sat.map(x => ({ ...x, muc: 'sát' }))]
  .filter(x => x.a.replace(/\d+$/, '') === mer || x.b.replace(/\d+$/, '') === mer);
if (!dung.length) console.log('   (không có cặp nào dưới 1,5cm)');
for (const x of dung) console.log(`   ${x.muc.padEnd(5)} ${x.a.padEnd(6)}${(TEN[x.a] || '').padEnd(14)}↔ ${x.b.padEnd(6)}${(TEN[x.b] || '').padEnd(14)}${x.cm.toFixed(2)}cm`);

// ---- 3+4. THỨ TỰ và CHẬP CÙNG KINH ----
console.log('\n── 3. THỨ TỰ dọc đoạn và CHẬP cùng kinh');
let loi3 = 0;
for (const seg of NODES[mer].doan) {
  const co = seg.diem.filter(c => P[c] && P[c].x !== undefined);
  if (co.length < 3) continue;
  const A = P[co[0]], B = P[co[co.length - 1]];
  const ax = B.x - A.x, ay = B.y - A.y, az = B.z - A.z, L2 = ax * ax + ay * ay + az * az;
  if (!L2) continue;
  const ts = co.map(c => ({ c, t: ((P[c].x - A.x) * ax + (P[c].y - A.y) * ay + (P[c].z - A.z) * az) / L2 }));
  for (let i = 1; i < ts.length; i++) {
    if (ts[i].t < ts[i - 1].t - 0.02) { console.log(`   ✗ ĐẢO: ${ts[i - 1].c} (t=${ts[i - 1].t.toFixed(2)}) đứng sau ${ts[i].c} (t=${ts[i].t.toFixed(2)}) trong đoạn ${seg.id}`); loi3++; }
    const kc = d(P[ts[i - 1].c], P[ts[i].c]);
    if (kc < 0.8) { console.log(`   ✗ CHẬP: ${ts[i - 1].c} ↔ ${ts[i].c} cách ${kc.toFixed(2)}cm`); loi3++; }
  }
}
if (!loi3) console.log('   (thứ tự đúng, không chập)');

// ---- 5. ĐOẠN NEO HAI ĐẦU ----
console.log('\n── 4. ĐOẠN ĐƯỜNG KINH NEO HAI ĐẦU (bỏ rơi huyệt giữa)');
let loi5 = 0;
for (const dd of (PATHS[mer] || {}).doan || []) {
  const seg = NODES[mer].doan.find(s => s.id === dd.id);
  if (!seg || dd.neo.length > 2 || seg.diem.length <= 2) continue;
  console.log(`   ⚠ ${dd.id}: neo ${dd.neo.join('→')} (dài ${dd.cm}cm) nhưng đoạn có ${seg.diem.length} huyệt: ${seg.diem.join(' ')}`);
  loi5++;
}
if (!loi5) console.log('   (mọi đoạn đều neo đủ)');

// ---- 6. CỜ CÒN LẠI ----
console.log('\n── 5. CỜ CÁC BỘ KIỂM CÒN BẮN');
const co = {};
/* Chỉ đếm cờ CÓ BIÊN ĐỘ THẬT. Report ghi cả dòng cm = 0 (huyệt không bị dời), và nếu tính chúng thì
 * kinh Bàng Quang ra 60/67 huyệt "đáng ngờ" — danh sách như thế vô dụng, agent đọc xong vẫn không
 * biết bắt đầu từ đâu. Ngưỡng 1,0cm: dưới mức ấy nằm trong sai số vẽ tay của chính sách. */
const NGUONG = 1.0;
for (const r of REP.diem.rows) if (r.code.replace(/\d+$/, '') === mer && r.cm >= NGUONG) (co[r.code] = co[r.code] || []).push(`rải ${r.cm}cm`);
for (const r of REP.duong.rows) if (r.code.replace(/\d+$/, '') === mer && r.cm >= NGUONG) (co[r.code] = co[r.code] || []).push(`xa đường ${r.cm}cm`);
for (const r of (REP.da.rows || [])) if (r.code.replace(/\d+$/, '') === mer && r.cm >= NGUONG) (co[r.code] = co[r.code] || []).push(`ép da ${r.cm}cm`);
const ks = Object.keys(co);
if (!ks.length) console.log('   (sạch)');
for (const c of ks) console.log(`   ${c.padEnd(6)}[${hang(c)}] ${co[c].join(' · ')}`);

console.log(`\n→ ĐỀ NGHỊ đưa ra hội đồng: ${[...new Set([...dung.flatMap(x => [x.a, x.b]).filter(c => c.replace(/\d+$/, '') === mer), ...ks, ...ds.map(p => p.code).filter(c => ngo[c])])].join(' ')}`);
