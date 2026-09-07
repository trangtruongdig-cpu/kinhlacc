/* mark-overlaps — Gắn cờ những huyệt đang CHỒNG KHÍT toạ độ nhau trong acu-coords3d.js.
 *
 * Vì sao có: khi câu VỊ TRÍ chỉ nói "ở nếp gấp khuỷu" mà không cho số thốn, solver không giải được
 * và trả về chính toạ độ MỐC — nên mọi huyệt neo cùng một mốc đổ về một điểm. Sáu huyệt vùng khuỷu
 * (LU5 LI11 LI14 SI8 PC3 TE10) hiện chung một chấm; cổ tay, xương đòn, rốn cũng vậy.
 *
 * Cách xử lý đã chọn: KHÔNG xoá toạ độ (huyệt sẽ biến mất khỏi bản đồ), mà đánh dấu để người soát
 * biết chấm đó đang gộp nhiều huyệt:
 *   chongCho  : danh sách mã huyệt khác cùng toạ độ
 *   chongMoc  : tên mốc giải phẫu mà cả cụm trùng khít (nếu có) — chỉ thẳng nguyên nhân
 *
 * Dùng:  node backend/src/acu-solver/mark-overlaps.cjs [--dry]                                     */
const fs = require('fs');
const path = require('path');
const { L } = require('./model-frame.cjs');

const OUT = path.resolve(__dirname, '../../../frontend/public/kinhmach3d/data/acu-coords3d.js');
const dry = process.argv.includes('--dry');
const src = fs.readFileSync(OUT, 'utf8');
const win = {};
new Function('window', src)(win);
const doc = win.ACU_COORDS3D;

const groups = new Map();
for (const [code, p] of Object.entries(doc.points)) {
  if (p.x === undefined) continue;
  const k = `${p.x},${p.y},${p.z}`;
  (groups.get(k) || groups.set(k, []).get(k)).push(code);
}

let nCum = 0, nHuyet = 0;
const lines = [];
for (const [k, codes] of groups) {
  if (codes.length < 2) continue;
  const [x, y, z] = k.split(',').map(Number);
  const moc = Object.entries(L).find(([, q]) =>
    Math.abs(q.x - Math.abs(x)) < 1e-4 && Math.abs(q.y - y) < 1e-4 && Math.abs(q.z - z) < 1e-4);
  nCum++; nHuyet += codes.length;
  for (const c of codes) {
    doc.points[c].chongCho = codes.filter(o => o !== c);
    if (moc) doc.points[c].chongMoc = moc[0]; else delete doc.points[c].chongMoc;
  }
  lines.push(`  ${codes.join(' = ').padEnd(44)}${moc ? '← trùng khít mốc ' + moc[0] : ''}`);
}
// gỡ cờ cũ ở huyệt nay đã tách ra
for (const [code, p] of Object.entries(doc.points)) {
  if (!p.chongCho) continue;
  const k = `${p.x},${p.y},${p.z}`;
  if ((groups.get(k) || []).length < 2) { delete p.chongCho; delete p.chongMoc; }
}

console.log(`${nCum} cụm huyệt chồng khít · ${nHuyet} huyệt dính cờ`);
lines.sort((a, b) => b.length - a.length).slice(0, 10).forEach(l => console.log(l));
if (dry) { console.log('(--dry: không ghi file)'); process.exit(0); }
const header = src.slice(0, src.indexOf('window.ACU_COORDS3D'));
fs.writeFileSync(OUT, header + 'window.ACU_COORDS3D = ' + JSON.stringify(doc, null, 2) + ';\n');
console.log('Đã ghi ' + path.relative(process.cwd(), OUT));
