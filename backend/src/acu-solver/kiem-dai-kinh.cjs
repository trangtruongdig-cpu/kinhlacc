/* kiem-dai-kinh — HUYỆT CÓ NẰM ĐÚNG DẢI CỦA KINH MÌNH KHÔNG.
 *
 * VÌ SAO CẦN, DÙ ĐÃ CÓ SÁU BỘ KIỂM. Các bộ trước hỏi: trên da chưa, đúng bộ phận chưa, đúng chiều
 * chưa, đúng số thốn chưa, có trên đường kinh không. Không bộ nào hỏi câu mà đồ hình nào cũng trả lời
 * ngay từ cái nhìn đầu: HAI KINH CÓ ĐI CHỒNG LÊN NHAU KHÔNG.
 *
 * Đây là loại lỗi mà cốt độ mù hoàn toàn: huyệt vẫn đúng số thốn (đo dọc trục), vẫn trên da, vẫn đúng
 * vùng — chỉ nằm sai DẢI. Đo được ở kinh Tam Tiêu: TE5–TE9 đúng 2/3/4/7 thốn nhưng nằm trên dải kinh
 * Tiểu Trường, lệch ngang tới 3,4cm. Và ở kinh Đại Trường ngay sau khi dời LI5: LI6 rơi cách PC5
 * 0,05cm — hai kinh ở hai MẶT ĐỐI NHAU của cẳng tay mà chập vào nhau.
 *
 * NGƯỠNG. Không dùng 0,3cm như phép kiểm chập (nó chỉ bắt được huyệt trùng khít). Hai kinh song song
 * gần nhất trên người cách nhau khoảng 1,5 thốn; ở chi thì 1 thốn ≈ 2cm, ở đầu ≈ 1,3cm. Nên:
 *   dưới 0,8cm = CHẬP, gần như chắc sai;  0,8–1,5cm = SÁT, phải giải trình.
 * Trừ những cặp mà sách CỐ Ý đặt sát nhau — khai trong NGOAI_LE, mỗi dòng kèm lý do.
 *
 * Dùng:  node kiem-dai-kinh.cjs [--tat-ca]                                                          */
const fs = require('fs');
const path = require('path');
const CM = 171.9;
const ROOT = path.resolve(__dirname, '../../..');
const win = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };
const P = win(path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'ACU_COORDS3D').points;
const V = require('./vitri-data.json').points;
const TEN = {}, MER = {};
for (const p of V) { TEN[p.code] = p.name; MER[p.code] = p.mer; }
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * CM;

/* CẶP KINH SÁCH CHO PHÉP ĐI SÁT — khai ra để báo cáo khỏi kêu oan. Chỉ thêm sau khi đã tra sách,
 * không thêm chỉ vì muốn báo cáo đẹp. */
const NGOAI_LE = {
  /* Ba nhóm dưới đây đã ĐO và xác minh là đúng sách, không phải lỗi — đo bằng chính dữ liệu, mỗi
   * thang suy từ ba cột độc lập nên không phải lập luận vòng tròn:
   *  · THỐN NGANG BỤNG/NGỰC = 1,91cm — cột KI (0,5 thốn) cho 1,93 · cột ST (2 thốn) cho 1,91 · cột SP
   *    (4 thốn) cho 1,91 · nửa khoảng cách hai đầu vú (4 thốn) cho 1,91. Vậy KI cách CV 0,96cm ĐÚNG
   *    bằng 0,5 thốn — nó "sát" chỉ vì thốn ngang bụng vốn ngắn.
   *  · THỐN NGANG ĐẦU = 1,40cm — cột BL (1,5 thốn) cho 1,34–1,52 · cột GB (2,25 thốn) cho 1,36–1,44.
   *    Chênh hai cột đo được 0,79–1,05cm, đúng bằng 0,75 thốn sách đòi. */
  'GB2/SI19': 'Thính Hội, Thính Cung và Nhĩ Môn TE21 là BA huyệt xếp dọc bờ trước bình tai, sách đặt cách nhau 0,5 thốn',
  'GB2/TE21': 'cùng lý do trên — ba huyệt bình tai',
  'SI19/TE21': 'cùng lý do trên — ba huyệt bình tai',
  'GB1/TE23': 'Đồng Tử Liêu ở đuôi mắt, Ty Trúc Không ở đuôi mày — cách nhau đúng bề cao ổ mắt ngoài',
  'CV24/ST4': 'Thừa Tương giữa rãnh cằm, Địa Thương ở khoé miệng — sách đặt cùng tầng',
  'GV26/LI20': 'Nhân Trung và Nghênh Hương đều quanh cánh mũi',
  // — cột Thận ↔ Nhâm mạch ở bụng: sách đặt kinh Thận cách đường giữa đúng 0,5 thốn = 0,96cm
  'CV2/KI11': 'cột KI bụng cách CV 0,5 thốn', 'CV3/KI12': 'cột KI bụng cách CV 0,5 thốn',
  'CV4/KI13': 'cột KI bụng cách CV 0,5 thốn', 'CV5/KI14': 'cột KI bụng cách CV 0,5 thốn',
  'CV7/KI15': 'cột KI bụng cách CV 0,5 thốn', 'CV8/KI16': 'cột KI bụng cách CV 0,5 thốn',
  'CV10/KI17': 'cột KI bụng cách CV 0,5 thốn', 'CV11/KI18': 'cột KI bụng cách CV 0,5 thốn',
  'CV12/KI19': 'cột KI bụng cách CV 0,5 thốn', 'CV13/KI20': 'cột KI bụng cách CV 0,5 thốn',
  'CV14/KI21': 'cột KI bụng cách CV 0,5 thốn',
  // — cột Bàng Quang ↔ cột Đởm trên đầu: chênh đúng 0,75 thốn đầu = 1,05cm
  'BL3/GB15': 'hai cột đầu cách nhau 0,75 thốn', 'BL4/GB15': 'hai cột đầu cách nhau 0,75 thốn',
  'BL4/GB16': 'hai cột đầu cách nhau 0,75 thốn', 'BL5/GB16': 'hai cột đầu cách nhau 0,75 thốn',
  'BL6/GB17': 'hai cột đầu cách nhau 0,75 thốn', 'BL7/GB18': 'hai cột đầu cách nhau 0,75 thốn',
  'BL9/GB19': 'hai cột đầu cách nhau 0,75 thốn',
};
const khoa = (a, b) => [a, b].sort().join('/');

const codes = Object.keys(P).filter(c => P[c] && P[c].x !== undefined && MER[c]);
const chap = [], sat = [], boQua = [];
for (let i = 0; i < codes.length; i++) for (let j = i + 1; j < codes.length; j++) {
  const a = codes[i], b = codes[j];
  if (MER[a] === MER[b]) continue;                       // cùng kinh thì đã có phép kiểm thứ tự lo
  const cm = d(P[a], P[b]);
  if (cm >= 1.5) continue;
  const k = khoa(a, b);
  if (NGOAI_LE[k]) { boQua.push({ k, cm, ly: NGOAI_LE[k] }); continue; }
  (cm < 0.8 ? chap : sat).push({ a, b, cm });
}
chap.sort((x, y) => x.cm - y.cm); sat.sort((x, y) => x.cm - y.cm);

const in1 = r => `  ${r.a.padEnd(6)}${(TEN[r.a] || '').padEnd(15)}↔ ${r.b.padEnd(6)}${(TEN[r.b] || '').padEnd(15)}${r.cm.toFixed(2)}cm`;
console.log(`KIỂM DẢI KINH: ${codes.length} huyệt · CHẬP (<0,8cm) ${chap.length} · SÁT (0,8–1,5cm) ${sat.length} · ngoại lệ đã duyệt ${boQua.length}\n`);
if (chap.length) { console.log('── CHẬP — hai kinh khác nhau trùng chỗ, gần như chắc sai:'); chap.forEach(r => console.log(in1(r))); console.log(); }
if (sat.length) { console.log('── SÁT — phải giải trình:'); sat.forEach(r => console.log(in1(r))); console.log(); }
if (process.argv.includes('--tat-ca') && boQua.length) {
  console.log('── ngoại lệ đã duyệt:'); boQua.forEach(r => console.log(`  ${r.k.padEnd(14)} ${r.cm.toFixed(2)}cm — ${r.ly}`));
}
fs.writeFileSync(path.join(__dirname, 'dai-kinh-report.json'), JSON.stringify({ chap, sat, boQua }, null, 1));
console.log('Báo cáo: backend/src/acu-solver/dai-kinh-report.json');
