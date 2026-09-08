/* kiem-lien-doan — ĐƯỜNG KINH CÓ BỊ ĐỨT GIỮA HAI ĐOẠN KHÔNG.
 *
 * VÌ SAO CẦN. bake-paths dựng đường RIÊNG cho từng đoạn, frontend vẽ mỗi đoạn một ống riêng, và
 * KHÔNG khâu nào nối hai đoạn với nhau. Nên chỉ cần khai đoạn trước kết ở KI21 mà đoạn sau bắt ở
 * KI22 là quãng giữa hai huyệt ấy không thuộc đoạn nào — trên màn hình thành một LỖ HỔNG, mà lại rơi
 * đúng chỗ kinh bẻ góc (bụng 0,5 thốn → ngực 2 thốn), tức chỗ dễ nhìn nhất. Người dùng phát hiện ra
 * bằng mắt trước khi có bộ kiểm nào bắt được: sáu bộ rà soát cũ đều hỏi về HUYỆT (trên da chưa, đúng
 * vùng chưa, đúng thốn chưa), không bộ nào hỏi ĐƯỜNG có liền không.
 *
 * Rà lần đầu ra 9 lỗ: ST18→ST19 5,3cm · GB12→GB13 15,1cm · GB33→GB34 10,7cm · BL10→BL11 12,8cm ·
 * BL30→BL31 9,4cm · BL35→BL36 21,3cm · SP12→SP13 2,5cm · SP16→SP17 12,1cm · KI21→KI22 4,6cm.
 *
 * HAI PHÉP KIỂM
 *   1. KHUNG (meridian-nodes.cjs) — đoạn sau phải MỞ ĐẦU bằng đúng huyệt cuối của đoạn trước.
 *   2. ĐƯỜNG ĐÃ BAKE (meridian-paths.js) — đo khoảng cách thật giữa đỉnh cuối đoạn trước và đỉnh đầu
 *      đoạn sau. Phép 1 có thể qua mà phép 2 vẫn hở, nếu một trong hai đoạn dựng hỏng.
 *
 * NGOẠI LỆ HỢP LỆ khai trong CHO_PHEP — chỉ thêm sau khi tra sách, mỗi dòng kèm lý do.
 *
 * Dùng:  node backend/src/acu-solver/kiem-lien-doan.cjs                                             */
const fs = require('fs');
const path = require('path');
const { NODES } = require('./meridian-nodes.cjs');

const ROOT = path.resolve(__dirname, '../../..');
const PATHS_F = path.join(ROOT, 'frontend/public/kinhmach3d/data/meridian-paths.js');
const HO_CM = 1.0;          // hở quá ngần này giữa hai đoạn ĐÃ GỐI ĐẦU = đoạn dựng hỏng

/** Cặp đoạn được phép KHÔNG gối đầu. Khoá: 'KINH doan-truoc→doan-sau'. */
const CHO_PHEP = {
  'ST nhanh-tran→co':
    'NHÁNH: nhanh-tran là nhánh cụt lên trán (kết ở ST8), đoạn co quay về bắt ở ST6 — mà ST6 chính là '
    + 'huyệt cuối đoạn mat, nên chuỗi vẫn liền. Không có lỗ hổng.',
  'BL dui-sau→nhanh-gay':
    'HAI CHUỖI SONG SONG: Bàng Quang có hai đường lưng. dui-sau kết ở BL40 (giữa nếp kheo) còn '
    + 'nhanh-gay bắt ở BL10 (gáy) — nối hai điểm này sẽ vẽ một đường 95cm bay ngang người. Đường '
    + 'ngoài đã được nối đúng cách: BL10 → BL41 (đoạn nhanh-gay) rồi BL54 → BL40 (đoạn hoi-kheo).',
};

let loi = 0, canhBao = 0;

console.log('── PHÉP 1: KHUNG — hai đoạn liền nhau phải dùng chung huyệt đầu-cuối ──');
for (const [mer, v] of Object.entries(NODES)) {
  for (let i = 0; i < v.doan.length - 1; i++) {
    const a = v.doan[i], b = v.doan[i + 1];
    const cuoi = a.diem[a.diem.length - 1], dau = b.diem[0];
    if (cuoi === dau) continue;
    const k = `${mer} ${a.id}→${b.id}`;
    if (CHO_PHEP[k]) { console.log(`   ○ ${k.padEnd(28)} ${cuoi}→${dau}  (ngoại lệ: ${CHO_PHEP[k].slice(0, 60)}…)`); continue; }
    console.log(`   ✗ ${k.padEnd(28)} kết ở ${cuoi}, đoạn sau bắt ở ${dau} — QUÃNG ${cuoi}→${dau} KHÔNG THUỘC ĐOẠN NÀO`);
    loi++;
  }
}
if (!loi) console.log('   ✓ 14 kinh đều gối đầu đủ.');

if (fs.existsSync(PATHS_F)) {
  const w = {};
  new Function('window', fs.readFileSync(PATHS_F, 'utf8'))(w);
  const P = w.MERIDIAN_PATHS, CM = P.cm;
  console.log(`\n── PHÉP 2: ĐƯỜNG ĐÃ BAKE — đo hở thật giữa đỉnh cuối và đỉnh đầu (ngưỡng ${HO_CM}cm) ──`);
  for (const [mer, v] of Object.entries(NODES)) {
    const pd = P.mer[mer] && P.mer[mer].doan;
    if (!pd) continue;
    for (let i = 0; i < v.doan.length - 1; i++) {
      const a = v.doan[i], b = v.doan[i + 1];
      if (CHO_PHEP[`${mer} ${a.id}→${b.id}`]) continue;
      const A = pd.find(s => s.id === a.id), B = pd.find(s => s.id === b.id);
      if (!A || !B || !A.pts.length || !B.pts.length) {
        console.log(`   ✗ ${mer} ${a.id}→${b.id}: đoạn dựng hỏng, không có đỉnh nào`); loi++; continue;
      }
      const p = A.pts[A.pts.length - 1], q = B.pts[0];
      const cm = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * CM;
      if (cm > HO_CM) { console.log(`   ✗ ${mer} ${a.id.padEnd(14)}→ ${b.id.padEnd(14)} hở ${cm.toFixed(1)}cm`); loi++; }
      else if (cm > 0.3) { console.log(`   ⚠ ${mer} ${a.id.padEnd(14)}→ ${b.id.padEnd(14)} hở ${cm.toFixed(1)}cm (dưới ngưỡng)`); canhBao++; }
    }
  }
  if (!loi) console.log('   ✓ mọi mối nối đều khít.');
} else {
  console.log('\n(chưa có meridian-paths.js — bỏ qua phép 2)');
}

console.log(`\n${loi} lỗi · ${canhBao} cảnh báo`);
process.exit(loi ? 1 : 0);
