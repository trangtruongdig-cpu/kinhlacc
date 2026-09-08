/* chay-tat — CHẠY TRỌN PIPELINE THEO ĐÚNG THỨ TỰ, rồi kiểm bằng mọi bộ độc lập.
 *
 * VÌ SAO CẦN: ba bước bake phải chạy đúng trình tự và không có lệnh nào gộp chúng lại. Ngày 07/09/2026
 * đo được hậu quả: acu-coords3d.js trong repo là sản phẩm của code CŨ — 72 huyệt lệch so với chính
 * engine đang có, nặng nhất GB36 30cm. Nghĩa là bản 3D người ta soi bằng mắt KHÔNG phải bản engine
 * sinh ra, và mọi nhận xét bằng mắt trong quãng đó đều soi nhầm bản.
 *
 * THỨ TỰ BẮT BUỘC — mỗi bước ăn đầu ra của bước trước:
 *   1. bake.cjs        giải toạ độ từ mốc + cốt độ, rồi ép lên da   → acu-coords3d.js
 *   2. bake-paths.cjs  dựng đường kinh trên mặt da từ khung nút     → meridian-paths.js
 *   3. bake-points.cjs kéo huyệt về đường, rải lại theo cốt độ      → acu-coords3d.js
 * Đảo thứ tự hoặc bỏ bước là toạ độ lệch âm thầm — không có gì báo.
 *
 * Dùng:  node backend/src/acu-solver/chay-tat.cjs [--nhanh]
 *        --nhanh : chỉ bake, bỏ các bộ kiểm chậm (kiểm từ điển)                                     */
const { execFileSync } = require('child_process');
const path = require('path');

const nhanh = process.argv.includes('--nhanh');
const BUOC = [
  ['bake.cjs', 'DỰNG toạ độ từ mốc + ép lên da', true],
  ['bake-paths.cjs', 'DỰNG đường kinh trên mặt da', true],
  ['bake-points.cjs', 'RẢI huyệt về đường theo cốt độ', true],
  ['kiem-lien-doan.cjs', 'kiểm đường có liền giữa hai đoạn', false],
  ['kiem-nhip-duong.cjs', 'kiểm đường đi đều hay quay trước leo sau', false],
  ['kiem-nhac-da.cjs', 'kiểm nhấc ống/chấm theo pháp tuyến, không bị da nuốt', false],
  ['region-check.cjs', 'kiểm đúng bộ phận cơ thể', false],
  ['quan-he-check.cjs', 'kiểm chiều giải phẫu', false],
  ['audit-toan-dien.cjs', 'rà 7 phép kiểm mỗi huyệt', false],
  ['kiem-tu-dien.cjs', 'đối chiếu ngược câu VỊ TRÍ của sách', false, 'cham'],
  ['so-nghiem-thu.cjs', 'SỔ NGHIỆM THU — huyệt đã chốt có bị trôi không', false],
];

const tomTat = [];
for (const [tep, mo, batBuoc, cham] of BUOC) {
  if (nhanh && cham) { console.log(`⏭  ${tep} — bỏ qua (--nhanh)`); continue; }
  process.stdout.write(`▸ ${tep.padEnd(22)} ${mo} … `);
  let ra = '', ma = 0;
  try {
    ra = execFileSync('node', [path.join(__dirname, tep)], { encoding: 'utf8', maxBuffer: 64e6 });
  } catch (e) {
    ra = (e.stdout || '') + (e.stderr || ''); ma = e.status ?? 1;
    if (batBuoc) { console.log('HỎNG\n' + ra); process.exit(1); }
  }
  // dòng đáng đọc nhất của mỗi bộ: dòng có kết luận số
  const chot = ra.split('\n').filter(l => /ĐẠT|đạt|HỒI QUY|✓|✗|NẶNG|cập nhật|Đã ghi|còn ngờ|chốt \d/.test(l));
  console.log(ma ? 'CÓ VẤN ĐỀ' : 'xong');
  for (const l of chot.slice(-3)) if (l.trim()) { console.log('    ' + l.trim()); tomTat.push(l.trim()); }
}
console.log('\nXong. Việc còn lại:  node backend/src/acu-solver/so-nghiem-thu.cjs --viec');
