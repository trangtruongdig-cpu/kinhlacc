/* _build-acu-3d — SINH BẢN TỪ ĐIỂN GỌN CHO ENGINE 3D.
 *
 * VÌ SAO. acupoints.js là từ điển ĐẦY ĐỦ 1059 huyệt (2,69MB · 437KB sau gzip) và được nạp cho CẢ hai
 * trang: Từ Điển (cần đủ) lẫn Bản Đồ 3D (không cần đủ). Đọc map3d.js thì thấy engine chỉ dùng đúng
 * sáu thứ: r.id (làm link "Xem Thêm"), r.ten (nhãn huyệt), và bốn mục trong sections — VỊ TRÍ, CHỦ
 * TRỊ, CHÂM CỨU, GIẢI PHẪU. Mục CHÂM CỨU còn được needleSpec() đọc để suy góc kim, nên bắt buộc giữ.
 * Mọi thứ còn lại (noiDung, phoiHuyet, ghiChu, thamKhao, slug, image, và các mục XUẤT XỨ / ĐẶC TÍNH /
 * TÁC DỤNG / PHỐI HUYỆT…) engine không hề chạm tới.
 *
 * Cắt đi thì còn 98KB sau gzip thay vì 437KB — bớt 339KB, tức 78%, cho mỗi lần mở bản đồ 3D.
 *
 * KHÔNG ĐỘNG tới acupoints.js: trang Từ Điển vẫn nạp bản đầy đủ. Đây là tệp THỨ HAI, sinh ra từ nó.
 * Chạy lại mỗi khi acupoints.js đổi:  node data/_build-acu-3d.cjs                                   */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const w = {};
new Function('window', fs.readFileSync(path.join(DIR, 'acupoints.js'), 'utf8'))(w);
const A = w.ACUPOINTS;

const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
/* Bốn mục engine thực sự đọc. Khớp bằng CHỨA chuỗi chứ không bằng bằng-nhau, y hệt hàm sec() trong
 * map3d.js dòng 37 — nếu đổi cách khớp ở đây mà không đổi ở đó thì mục sẽ lặng lẽ biến mất khỏi
 * ngăn chi tiết, không có gì báo. */
const CAN = ['vi tri', 'chu tri', 'cham cuu', 'giai phau'];

let thieu = 0;
const records = A.records.map(r => {
  const sections = (r.sections || []).filter(s => CAN.some(k => norm(s.h).includes(k)));
  if (!sections.length) thieu++;
  return { id: r.id, ten: r.ten, sections };
});

const out = 'window.ACUPOINTS = ' + JSON.stringify({
  category: A.category, title: A.title, labels: A.labels, count: A.count, records,
}) + ';\n';
const dich = path.join(DIR, 'acupoints-3d.js');
fs.writeFileSync(dich, out);

const zlib = require('zlib');
const goc = fs.readFileSync(path.join(DIR, 'acupoints.js'));
const g1 = zlib.gzipSync(goc).length, g2 = zlib.gzipSync(out).length;
console.log(`acupoints-3d.js — ${records.length} huyệt · ${(out.length / 1024 / 1024).toFixed(2)}MB · gzip ${(g2 / 1024).toFixed(0)}KB`);
console.log(`bản đầy đủ      — ${(goc.length / 1024 / 1024).toFixed(2)}MB · gzip ${(g1 / 1024).toFixed(0)}KB`);
console.log(`→ bớt ${((g1 - g2) / 1024).toFixed(0)}KB sau gzip (${((1 - g2 / g1) * 100).toFixed(0)}%) cho mỗi lần mở bản đồ 3D`);
if (thieu) console.log(`⚠ ${thieu} huyệt không có mục nào trong bốn mục cần — ngăn chi tiết sẽ hiện "đang được số hoá"`);
