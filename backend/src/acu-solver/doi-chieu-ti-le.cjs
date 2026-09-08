/* doi-chieu-ti-le — SO TỈ LỆ TRÊN ẢNH SÁCH VỚI TỈ LỆ TRÊN MESH.
 *
 * Ảnh sách không có thước, nên không đối chiếu được bằng centimet. Nhưng nó có thứ khác mạnh hơn:
 * trên CÙNG một hình, sách vẽ huyệt đang xét cạnh nhiều huyệt kinh khác. Vị trí TƯƠNG ĐỐI giữa chúng
 * là bất biến — không phụ thuộc cỡ ảnh, góc vẽ, hay tầm vóc người mẫu. Chiếu huyệt X lên đoạn thẳng
 * nối hai huyệt A và B cho một con số t ∈ [0,1]; đo t ấy trên ảnh rồi đo lại trên mesh, hai số phải
 * khớp. Lệch nhiều nghĩa là mesh đặt sai — và kết luận này ĐỘC LẬP với cốt độ lẫn mốc xương, tức là
 * độc lập với chính cái engine đã dựng ra toạ độ.
 *
 * Dùng:  node doi-chieu-ti-le.cjs TE4 LI5 SI5           chiếu TE4 lên đoạn LI5→SI5 trên mesh
 *        node doi-chieu-ti-le.cjs TE4 LI5 SI5 --anh 0.42   kèm t đo được trên ảnh để so ngay
 *        node doi-chieu-ti-le.cjs --quanh TE4            liệt kê các cặp mốc dùng được quanh huyệt   */
const fs = require('fs');
const path = require('path');
const CM = 171.9;
const ROOT = path.resolve(__dirname, '../../..');
const win = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };
const P = win(path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'ACU_COORDS3D').points;
const TEN = {}; for (const p of require('./vitri-data.json').points) TEN[p.code] = p.name;

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** chiếu X lên đoạn AB: t = 0 tại A, 1 tại B; kèm khoảng cách vuông góc (lệch khỏi đoạn) */
function chieu(A, B, X) {
  const ax = B.x - A.x, ay = B.y - A.y, az = B.z - A.z;
  const L2 = ax * ax + ay * ay + az * az;
  const t = ((X.x - A.x) * ax + (X.y - A.y) * ay + (X.z - A.z) * az) / L2;
  const q = { x: A.x + ax * t, y: A.y + ay * t, z: A.z + az * t };
  return { t, lechCm: d3(q, X) * CM, daiCm: Math.sqrt(L2) * CM };
}

const args = process.argv.slice(2);
if (args[0] === '--quanh') {
  const X = args[1], p = P[X];
  if (!p) { console.log('không có toạ độ ' + X); process.exit(1); }
  const gan = Object.entries(P).filter(([c, q]) => c !== X && q && q.x !== undefined)
    .map(([c, q]) => ({ c, cm: d3(p, q) * CM })).sort((a, b) => a.cm - b.cm).slice(0, 14);
  console.log(`Huyệt dùng làm mốc quanh ${X} ${TEN[X] || ''} (gần nhất trước):`);
  for (const g of gan) console.log(`   ${g.c.padEnd(6)} ${(TEN[g.c] || '').padEnd(16)} ${g.cm.toFixed(2)}cm`);
  console.log('\nChọn HAI mốc mà ẢNH SÁCH cũng vẽ, rồi: node doi-chieu-ti-le.cjs ' + X + ' <A> <B> --anh <t đo trên ảnh>');
  process.exit(0);
}
const [X, A, B] = args;
const iAnh = args.indexOf('--anh');
const tAnh = iAnh > 0 ? parseFloat(args[iAnh + 1]) : null;
if (!X || !A || !B) { console.log('Dùng: node doi-chieu-ti-le.cjs TE4 LI5 SI5 [--anh 0.42]'); process.exit(1); }
for (const c of [X, A, B]) if (!P[c]) { console.log('thiếu toạ độ ' + c); process.exit(1); }

const r = chieu(P[A], P[B], P[X]);
console.log(`Trên MESH: chiếu ${X} (${TEN[X] || ''}) lên đoạn ${A} (${TEN[A] || ''}) → ${B} (${TEN[B] || ''})`);
console.log(`   t = ${r.t.toFixed(3)}   ·   đoạn dài ${r.daiCm.toFixed(2)}cm   ·   ${X} lệch khỏi đoạn ${r.lechCm.toFixed(2)}cm`);
if (tAnh !== null && !Number.isNaN(tAnh)) {
  const dt = r.t - tAnh;
  console.log(`Trên ẢNH SÁCH: t = ${tAnh.toFixed(3)}`);
  console.log(`   CHÊNH ${dt >= 0 ? '+' : ''}${dt.toFixed(3)} của đoạn = ${(dt * r.daiCm).toFixed(2)}cm` +
    `  → ${Math.abs(dt * r.daiCm) < 0.5 ? 'KHỚP (dưới 0,5cm)' : Math.abs(dt * r.daiCm) < 1.2 ? 'lệch nhẹ' : 'LỆCH ĐÁNG KỂ, phải giải trình'}`);
  console.log(`   (dấu dương = mesh đặt ${X} về phía ${B} nhiều hơn ảnh)`);
}
