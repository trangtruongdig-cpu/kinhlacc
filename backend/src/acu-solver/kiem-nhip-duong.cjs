/* kiem-nhip-duong — ĐƯỜNG KINH CÓ ĐI ĐỀU KHÔNG, hay QUAY TRƯỚC RỒI MỚI LEO.
 *
 * VÌ SAO CẦN, dù đã có tám bộ kiểm. Tám bộ trước hỏi về HUYỆT (trên da chưa, đúng vùng chưa, đúng
 * thốn chưa, có trên đường không, có chồng kinh khác không) và một bộ hỏi đường có LIỀN không. Không
 * bộ nào hỏi câu mà mắt người trả lời ngay khi nhìn đồ hình: ĐƯỜNG CÓ ĐI THEO MỘT NHỊP KHÔNG.
 * Người dùng bắt được trước khi có bộ này: *"sao chỗ này đường kinh Can nó rối thế nhỉ? Nhìn bằng
 * cảm quan đã biết đường đi bị sai rồi"*.
 *
 * LỖI TRÔNG NHƯ THẾ NÀO. Thân người HẸP Ở EO, PHÌNH Ở LỒNG NGỰC — đo trên chính mesh: bán kính nửa
 * thân trái đi từ 12,8cm ở cao độ 109 lên 15,3cm ở cao độ 120. Nên đường TRẮC ĐỊA (ngắn nhất) giữa
 * hai huyệt vừa phải leo vừa phải vòng bao giờ cũng chọn vòng hết ở chỗ eo rồi mới leo thẳng: rẻ hơn
 * chừng 2,5cm so với đi chéo qua chỗ phình. Trên màn hình thành hình chữ L bắt ngang bụng.
 * Chương Môn → Kỳ Môn (LR13→LR14) là ca nặng nhất: đường quay hết 115% số góc phải quay trong khi
 * mới leo được 29% chiều cao — tức nó vòng QUA CẢ Kỳ Môn, thọc vào x=4,5cm (nông hơn chính Kỳ Môn ở
 * 7,5cm, tức lấn sang cột Vị/Thận trên bụng trên), rồi mới leo và bẻ ngược ra.
 *
 * PHÉP ĐO. Với mỗi chặng giữa hai huyệt NEO liền nhau, chuẩn hoá hai đại lượng về 0→1:
 *   s = tiến độ CAO ĐỘ         t = tiến độ GÓC quanh trục dọc thân
 * Đường đi đều thì t ≈ s suốt dọc. LỆCH NHỊP = max|t − s|. Trên 0,35 là quay trước leo sau.
 *
 * CHỈ ĐO ĐƯỢC TRÊN THÂN MÌNH. Ở tay chân, "góc quanh trục thân" vô nghĩa (cả chi nằm lệch hẳn một
 * bên, một bước nhỏ cũng đổi góc rất nhiều), nên chặng nào có đầu mút ra ngoài bán kính 18cm hoặc ra
 * ngoài khoảng cao độ thân thì chỉ liệt kê tham khảo, KHÔNG tính là lỗi. Cũng bỏ qua chặng quay dưới
 * 7° hoặc leo dưới 1,7cm — chia cho số bé thì tỉ lệ nào cũng vọt.
 *
 * bake-paths.cjs đã tự chữa: chặng THÂN nào hỏng nhịp thì dựng lại theo nhịp thay vì dò đường ngắn
 * nhất. Bộ này để BẮT phần nó không chữa được, và để biết ngay khi có ai đổi khung nút.
 *
 * Dùng:  node backend/src/acu-solver/kiem-nhip-duong.cjs [--tat-ca]                                 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const CM = 171.9;
const NGUONG = 0.35;
const THAN_R = 0.105;            // 18cm — ngoài ngưỡng này là tay/chân
const THAN_Y = [0.42, 0.86];     // khoảng cao độ thân mình
const TAT_CA = process.argv.includes('--tat-ca');

const win = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };
const P = win(path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'ACU_COORDS3D').points;
const PATHS = win(path.join(ROOT, 'frontend/public/kinhmach3d/data/meridian-paths.js'), 'MERIDIAN_PATHS').mer;

const vong = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const goc = q => Math.atan2(q[2] !== undefined ? q[2] : q.z, q[0] !== undefined ? q[0] : q.x);
const cao = q => (q[1] !== undefined ? q[1] : q.y);

const rows = [];
for (const [mer, M] of Object.entries(PATHS)) {
  for (const d of M.doan) {
    const pts = d.pts; if (!pts || pts.length < 3 || !d.neo) continue;
    // đỉnh gần nhất với mỗi huyệt neo → chia đường thành các CHẶNG
    const moc = d.neo.map(c => {
      const p = P[c]; if (!p || p.x === undefined) return null;
      let bi = 0, bd = Infinity;
      pts.forEach((q, i) => { const dd = Math.hypot(q[0] - p.x, q[1] - p.y, q[2] - p.z); if (dd < bd) { bd = dd; bi = i; } });
      return { c, i: bi };
    }).filter(Boolean);
    for (let k = 0; k + 1 < moc.length; k++) {
      const a = moc[k], b = moc[k + 1]; if (b.i <= a.i) continue;
      const A = P[a.c], B = P[b.c];
      const thA = goc(A), dTh = vong(goc(B) - thA), dY = B.y - A.y;
      if (Math.abs(dTh) < 0.12 || Math.abs(dY) < 0.010) continue;      // nhịp vô nghĩa
      let m = 0;
      for (let i = a.i; i <= b.i; i++) m = Math.max(m, Math.abs(vong(goc(pts[i]) - thA) / dTh - (cao(pts[i]) - A.y) / dY));
      const than = Math.hypot(A.x, A.z) < THAN_R && Math.hypot(B.x, B.z) < THAN_R
                && A.y > THAN_Y[0] && A.y < THAN_Y[1] && B.y > THAN_Y[0] && B.y < THAN_Y[1];
      rows.push({ cap: a.c + '→' + b.c, doan: mer + '/' + d.id, nhip: +m.toFixed(2), than,
                  gocDo: Math.round(dTh * 180 / Math.PI), caoCm: +((B.y - A.y) * CM).toFixed(1) });
    }
  }
}
rows.sort((x, y) => y.nhip - x.nhip);

const loi = rows.filter(r => r.than && r.nhip > NGUONG);
console.log(`KIỂM NHỊP ĐƯỜNG — ${rows.length} chặng đo được · ${rows.filter(r => r.than).length} chặng THÂN`);
if (loi.length) {
  console.log(`\n✗ ${loi.length} chặng THÂN quay trước leo sau (ngưỡng ${NGUONG}):`);
  for (const r of loi) console.log(`   ${r.doan.padEnd(14)} ${r.cap.padEnd(14)} lệch nhịp ${r.nhip}  (quay ${r.gocDo}° · leo ${r.caoCm}cm)`);
} else {
  console.log('\n✓ Không chặng THÂN nào quay trước leo sau.');
}
if (TAT_CA) {
  console.log('\n--- THAM KHẢO: chi thể (góc quanh trục thân vô nghĩa ở đây, KHÔNG tính là lỗi) ---');
  for (const r of rows.filter(x => !x.than && x.nhip > NGUONG))
    console.log(`   ${r.doan.padEnd(14)} ${r.cap.padEnd(14)} ${r.nhip}`);
}
process.exit(loi.length ? 1 : 0);
