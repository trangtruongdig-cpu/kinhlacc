/* duong-kinh-chu — ĐỐI CHIẾU KHUNG ĐƯỜNG KINH VỚI PHẦN CHỮ MÔ TẢ ĐƯỜNG ĐI TRONG TỪ ĐIỂN.
 *
 * `frontend/public/kinhmach3d/data/meridians.js` có trường `chinh` — một đoạn văn tả ĐƯỜNG ĐI của
 * kinh chính, đúng thứ tự, gọi tên các huyệt MỐC mà kinh đi qua ("...Phế khí xuất ra ở huyệt Trung
 * phủ, chạy vòng xuống mặt trước ngoài cánh tay đến tận ngón tay cái tại huyệt Thiếu thương"). Đây
 * là nguồn thứ ba của chính người dùng, và cho tới nay KHÔNG bộ nào trong acu-solver đọc nó.
 *
 * Bộ này kiểm hai điều mà số liệu nội bộ không tự phán được:
 *   1. huyệt được đoạn văn GỌI TÊN có phải là NÚT của khung đường không — sổ tay đã ghi: đường mà chỉ
 *      neo hai đầu đoạn thì bỏ rơi huyệt ở giữa tới 4–7cm, nên mọi huyệt "mốc" phải là điểm neo;
 *   2. THỨ TỰ xuất hiện trong văn có khớp thứ tự trên khung không (kinh vòng ngược thì phải khai).
 *
 * TÊN HUYỆT PHẢI SO CÓ DẤU. Sổ tay đã ghi một lần mất 10 huyệt vì đối chiếu tên sau khi bỏ dấu
 * (Kinh Cừ/Kinh Cự, Thừa Sơn/Thửa Sơn…). Ở đây so bản có dấu trước, chỉ hạ xuống bản bỏ dấu khi
 * không có huyệt nào trùng, và khi bỏ dấu mà đụng NHIỀU huyệt thì bỏ qua chứ không đoán.
 *
 * Dùng:  node duong-kinh-chu.cjs [MÃ_KINH]                                                          */
const fs = require('fs');
const path = require('path');
const { NODES } = require('./meridian-nodes.cjs');

const ROOT = path.resolve(__dirname, '../../..');
const w = {};
new Function('window', fs.readFileSync(path.join(ROOT, 'frontend/public/kinhmach3d/data/meridians.js'), 'utf8'))(w);
const MER = w.MERIDIANS;
const VITRI = require('./vitri-data.json');

const boDau = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
const chuan = s => s.toLowerCase().replace(/\s+/g, ' ').trim();

// chỉ mục tên → mã, cả bản CÓ DẤU lẫn bản bỏ dấu (bản bỏ dấu ghi nhận trùng để khỏi đoán bừa)
const CO_DAU = new Map(), KHONG_DAU = new Map();
for (const p of VITRI.points) {
  if (!p.name) continue;
  CO_DAU.set(chuan(p.name), p.code);
  const k = boDau(p.name);
  KHONG_DAU.set(k, KHONG_DAU.has(k) ? 'TRÙNG' : p.code);
}
const TEN = [...new Set(VITRI.points.map(p => p.name).filter(Boolean))].sort((a, b) => b.length - a.length);

/** Rút danh sách huyệt được GỌI TÊN trong đoạn văn, theo thứ tự xuất hiện. */
function huyetTrongVan(text) {
  const ra = [];
  const daDung = [];
  for (const ten of TEN) {
    const re = new RegExp(ten.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    for (const m of text.matchAll(re)) {
      // bỏ qua nếu nằm gọn trong một tên DÀI HƠN đã bắt (Trung phủ ⊂ … không có, nhưng Khúc trì ⊂ …)
      if (daDung.some(([s, e]) => m.index >= s && m.index + ten.length <= e)) continue;
      daDung.push([m.index, m.index + ten.length]);
      const code = CO_DAU.get(chuan(m[0])) || (KHONG_DAU.get(boDau(m[0])) !== 'TRÙNG' ? KHONG_DAU.get(boDau(m[0])) : null);
      if (code) ra.push({ code, ten: m[0], at: m.index });
    }
  }
  ra.sort((a, b) => a.at - b.at);
  return ra.filter((r, i) => i === 0 || r.code !== ra[i - 1].code);
}

const merArg = process.argv.slice(2).find(a => !a.startsWith('--'));
const ds = [...MER.kinh.map(k => ({ code: k.code, ten: k.ten, van: k.chinh })),
  ...MER.circuits.filter(c => c.code).map(c => ({ code: c.code, ten: c.ten, van: c.vanHanh || c.dacTinh }))];

let tongThieuNut = 0, tongNgoai = 0;
for (const m of ds) {
  if (merArg && m.code !== merArg) continue;
  if (!m.van) continue;
  const N = NODES[m.code];
  if (!N) { console.log(`\n### ${m.code} ${m.ten} — CHƯA CÓ KHUNG ĐƯỜNG`); continue; }
  const nut = new Set((N.nut || []).map(n => n.code));
  const tren = new Set();
  for (const d of N.doan) for (const c of d.diem) tren.add(c);
  const goi = huyetTrongVan(m.van);
  const cuaKinh = goi.filter(g => g.code.replace(/\d+$/, '') === m.code);
  const khac = goi.filter(g => g.code.replace(/\d+$/, '') !== m.code);
  const thieuNut = cuaKinh.filter(g => !nut.has(g.code));
  const ngoaiDuong = cuaKinh.filter(g => !tren.has(g.code));
  // thứ tự: chỉ số huyệt trong văn có tăng dần không (theo vị trí trên khung)
  const thuTu = cuaKinh.map(g => g.code);
  tongThieuNut += thieuNut.length; tongNgoai += ngoaiDuong.length;
  console.log(`\n### ${m.code} — ${m.ten}`);
  console.log(`  văn gọi tên: ${thuTu.join(' → ') || '(không gọi huyệt nào)'}`);
  if (khac.length) console.log(`  giao hội kinh khác: ${khac.map(k => `${k.ten}(${k.code})`).join(', ')}`);
  if (ngoaiDuong.length) console.log(`  ⚠ KHÔNG có trên khung đường: ${ngoaiDuong.map(g => g.code).join(', ')}`);
  if (thieuNut.length) console.log(`  ⚠ văn coi là MỐC nhưng khung KHÔNG khai làm nút: ${thieuNut.map(g => `${g.code}(${g.ten})`).join(', ')}`);
  if (!ngoaiDuong.length && !thieuNut.length && cuaKinh.length) console.log('  ✔ mọi huyệt văn gọi tên đều là nút trên khung');
}
console.log(`\nTỔNG: ${tongThieuNut} huyệt được văn gọi tên mà khung chưa khai làm nút · ${tongNgoai} huyệt không nằm trên khung`);
