/* kiem-bang-chung — SOI CHÍNH SỔ NGHIỆM THU: bằng chứng ghi kèm mỗi chốt có TÁI LẬP ĐƯỢC không.
 *
 * VÌ SAO CẦN, VÀ VÌ SAO MÃI MỚI CÓ. Sổ nghiệm thu chống được huyệt TRÔI, nhưng không hỏi câu thứ hai:
 * cái giá trị đang được bảo vệ ấy dựa trên bằng chứng gì. Ngày 08/09/2026 ba phiên cùng làm repo này
 * phát hiện một ca cho thấy câu ấy không thừa: LI12 mang nhãn hạng A với lý do "ảnh cho t = 0,110",
 * nhưng truy ra thì con số 0,110 sinh từ phép chia cho chính hằng số đang bị tranh cãi (1/9 = 0,111).
 * Tức phép "ảnh" và phép "mesh" dùng CHUNG một giả định. Hậu quả không phải một huyệt sai, mà là sổ
 * đã BÁC MỘT PHÉP SỬA ĐÚNG suốt nhiều vòng, vì nhãn hạng A của nó đứng chắn.
 *
 * LUẬT RÚT RA (phiên kinhlacc-43 phát biểu, kinhlacc-08 bổ sung hệ quả):
 *   · nhãn hạng A chỉ mạnh bằng bằng chứng ghi kèm nó;
 *   · trường `ly` của mỗi chốt phải TÁI LẬP ĐƯỢC — ai đọc cũng đo lại được mà ra cùng số;
 *   · chốt nào có `ly` không tái lập được thì HẠ HẠNG, đừng để nó chặn người sau.
 *
 * BỘ NÀY KHÔNG TỰ SỬA SỔ. Nó chỉ xếp hạng chất lượng bằng chứng và in danh sách việc.
 *
 * Dùng:  node kiem-bang-chung.cjs [--chi-tiet]                                                      */
const fs = require('fs');
const path = require('path');
const SO = require('./huyet-chot.json');
const V = require('./vitri-data.json').points;
const TEN = {}; for (const p of V) TEN[p.code] = p.name;

const chot = SO.chot || {};
const ma = Object.keys(chot);
const chiTiet = process.argv.includes('--chi-tiet');

/* Bốn mức, xếp từ chắc xuống lỏng. Phân loại bằng chính VĂN BẢN của trường `ly` — thô, nhưng đủ để
 * khoanh vùng: thứ cần tìm là chốt mà lý do KHÔNG chứa gì đo lại được. */
const MUC = {
  ngoai: { ten: 'có SỐ ĐO + nguồn NGOÀI engine (ảnh sách, thước in, WHO, hội đồng)', ds: [] },
  so:    { ten: 'có SỐ ĐO nhưng không nêu nguồn ngoài', ds: [] },
  loi:   { ten: 'chỉ mô tả bằng LỜI, không có số nào', ds: [] },
  cu:    { ten: 'dạng cũ "conf=…, src=…" — KHÔNG tái lập được', ds: [] },
  trong: { ten: 'trống rỗng', ds: [] },
};
for (const c of ma) {
  const ly = (chot[c].ly || '').trim();
  if (!ly) { MUC.trong.ds.push(c); continue; }
  if (/^conf=/.test(ly)) { MUC.cu.ds.push(c); continue; }
  const coSo = /\d+[,.]\d+\s*(cm|thốn)|\d+\s*thốn|\d+[,.]\d+cm/.test(ly);
  if (!coSo) { MUC.loi.ds.push(c); continue; }
  MUC[/ảnh|thước|Focks|WHO|trang p\d|hội đồng|vòng \d/i.test(ly) ? 'ngoai' : 'so'].ds.push(c);
}

const hangCua = c => (chot[c] || {}).hang || '—';
console.log(`KIỂM BẰNG CHỨNG — ${ma.length} chốt trong sổ nghiệm thu\n`);
for (const k of ['ngoai', 'so', 'loi', 'cu', 'trong']) {
  const m = MUC[k];
  const A = m.ds.filter(c => hangCua(c) === 'A').length;
  console.log(`  ${String(m.ds.length).padStart(4)}  ${m.ten}${A ? `   (${A} đang mang hạng A)` : ''}`);
}

const nghi = [...MUC.cu.ds, ...MUC.trong.ds];
if (nghi.length) {
  console.log(`\n── CẦN XEM LẠI NGAY — ${nghi.length} chốt mang hạng A mà lý do không tái lập được:`);
  for (const c of nghi) console.log(`   ${c.padEnd(6)}[${hangCua(c)}] ${(TEN[c] || '').padEnd(16)}"${chot[c].ly || '(trống)'}"`);
  console.log('\n   Đây KHÔNG có nghĩa toạ độ sai — chỉ có nghĩa không ai kiểm lại được vì sao nó đúng.');
  console.log('   Việc cần: đo lại bằng một phép ĐỘC LẬP rồi viết lại `ly`, hoặc hạ hạng xuống B.');
}
if (chiTiet && MUC.loi.ds.length) {
  console.log(`\n── mô tả bằng lời, không có số (${MUC.loi.ds.length}) — đọc hiểu được nhưng chưa đo lại được:`);
  for (const c of MUC.loi.ds.slice(0, 30)) console.log(`   ${c.padEnd(6)}"${(chot[c].ly || '').slice(0, 90)}"`);
  if (MUC.loi.ds.length > 30) console.log(`   … còn ${MUC.loi.ds.length - 30} chốt nữa`);
}
fs.writeFileSync(path.join(__dirname, 'bang-chung-report.json'),
  JSON.stringify({ tong: ma.length, muc: Object.fromEntries(Object.entries(MUC).map(([k, v]) => [k, v.ds])) }, null, 1));
console.log('\nBáo cáo: backend/src/acu-solver/bang-chung-report.json');
