/* kiem-ma-huyet — TẦNG 0: KIỂM MÃ HUYỆT CÓ ỨNG ĐÚNG TÊN HUYỆT KHÔNG.
 *
 * VÌ SAO PHẢI KIỂM TRƯỚC MỌI THỨ. Toàn bộ engine định vị theo MÃ: đọc câu VỊ TRÍ của mã LR3 rồi dựng
 * toạ độ cho mã LR3. Nếu bảng tra gán nhầm tên huyệt cho mã — tức câu sách của mã đó thật ra tả một
 * huyệt khác — thì engine dựng đúng theo câu sách mà vẫn ra sai chỗ hoàn toàn, và KHÔNG phép kiểm hình
 * học nào bắt được: huyệt vẫn trên da, vẫn đúng vùng, vẫn gần đường kinh của nó. Sai đối tượng chứ
 * không sai phép đo.
 *
 * Đo được ngay lần chạy đầu: 37 mã có tên lệch giữa hai nguồn. Phần lớn là dị bản chính tả vô hại
 * (Côn Lôn/Côn Luân, Chiên Trung/Đản Trung), nhưng lẫn trong đó là lỗi thật:
 *   · app gán GB24 = "Kinh môn" trong khi GB24 là Nhật Nguyệt — cả cụm GB24-25-26-27 lệch đi một huyệt;
 *   · app gán KI17 = "Thương khâu" (Thương Khâu là SP5), GV7 = "Trung xung" (Trung Xung là PC9);
 *   · Focks gán LR1/3/5/7 = Khoan Cốt / Bách Trùng Oa / Tất Nhãn / Lan Vĩ — đều là KỲ HUYỆT ngoài kinh,
 *     do bóc PDF lẫn trang huyệt ngoài kinh vào dãy LR.
 *
 * CÁCH PHÂN LOẠI. Không chỉ báo "hai nguồn khác nhau" — vô dụng vì phần lớn là chính tả. Xét thêm:
 *   'chinh-ta'  hai tên quy về cùng gốc sau khi bỏ dấu và cắt tiền tố bộ vị (đầu/túc/nhĩ/phúc…);
 *   'lech-ma'   tên mà nguồn này gán cho mã X lại là tên nguồn kia gán cho mã Y ≠ X — dấu hiệu cứng
 *               nhất, vì trùng khớp chéo không xảy ra ngẫu nhiên;
 *   'ky-huyet'  một nguồn gán tên huyệt NGOÀI KINH cho mã trong kinh;
 *   'khac-han'  hai tên không quy về nhau và không khớp chéo — phải tra nguồn thứ ba.
 *
 * Dùng:  node kiem-ma-huyet.cjs [--json]                                                            */
const fs = require('fs');
const path = require('path');

const VITRI = require('./vitri-data.json').points;
const FOCKS = require('./focks-vitri.json').points;

const kd = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/* Focks viết tên kèm dị bản bằng dấu gạch chéo ("CÔN LUÂN/LÔN", "ĐẠI TRÀNG/TRƯỜNG DU") — tách ra
 * thành các biến thể đầy đủ để so, chứ cắt thô ở dấu / sẽ mất vế sau. */
function bienThe(ten) {
  // tách dấu / TRƯỚC khi bỏ dấu tiếng Việt — kd() coi '/' là ký tự lạ và nuốt mất, làm
  // "CÔN LUÂN/LÔN" thành "con luan lon" rồi không khớp nổi với "Côn lôn" của nguồn kia
  const t = (ten || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z /]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t.includes('/')) return [t];
  const tu = t.split(' ');
  const i = tu.findIndex(w => w.includes('/'));
  if (i < 0) return [t];
  return tu[i].split('/').map(v => tu.map((w, j) => (j === i ? v : w)).join(' '));
}
/* Tiền tố BỘ VỊ — cùng một tên huyệt được sách này ghi kèm bộ vị, sách kia lược đi:
 * "Lâm khấp" vs "Đầu lâm khấp", "Thông cốc" vs "Túc thông cốc". Không phải lỗi. */
const TIEN_TO = /^(dau|tuc|nhi|phuc|khau|te|thu|bối|bo)\s+/;
const gocTen = t => t.replace(TIEN_TO, '').trim();

/* DỊ BẢN HÁN-VIỆT ĐÃ DUYỆT TAY. Hai cách đọc cùng một chữ Hán, hai sách phiên khác nhau — không phải
 * lỗi dữ liệu. Duyệt từng cặp một, KHÔNG suy đoán theo luật ngữ âm: "khâu" và "khúc" nghe gần nhau
 * nhưng Thương Khâu (SP5) và Thương Khúc (KI17) là HAI huyệt khác nhau ở hai chi khác nhau. Gộp bừa
 * là tự tay bịt mất đúng cái lỗi cần tìm. */
const DONG_AM = [
  ['nghenh', 'nghinh'], ['xu', 'khu'], ['ty', 'ti'], ['dom', 'dam'], ['truong', 'trang'],
  ['pho', 'phu'], ['hy', 'hi'], ['lon', 'luan'], ['hoac', 'hoat'], ['su', 'sư'],
  ['tan', 'tan mem'], ['triep', 'trap'], ['dai', 'doi'], ['cu', 'cư'], ['chien', 'dan'],
  ['ba', 'bach'], ['uc', 'hoac'], ['man', 'mem'],
];
const chuanDongAm = t => {
  let r = ' ' + t + ' ';
  for (const [a, b] of DONG_AM) { const re = new RegExp(`(^| )(${a}|${b})( |$)`, 'g'); r = r.replace(re, `$1${a}$3`); }
  return r.trim();
};

/** Huyệt NGOÀI KINH (kỳ huyệt) hay bị lẫn vào dãy mã khi bóc sách. */
const KY_HUYET = /^(khoan cot|bach trung oa|tat nhan|lan vi|thai duong|an duong|tu than thong|giap tich|thap tuyen|bat ta|bat phong|dinh suyen|hac dinh|lan vi huyet|ty can)$/;

const napApp = () => { const m = new Map(); for (const p of VITRI) m.set(p.code, p.name); return m; };
const napFocks = () => { const m = new Map(); for (const [c, f] of Object.entries(FOCKS)) m.set(c, f.ten); return m; };

const APP = napApp(), FCK = napFocks();
/* chỉ mục NGƯỢC tên → mã, để bắt khớp chéo (tên của mã này là tên chuẩn của mã kia) */
const nguocApp = new Map(), nguocFck = new Map();
for (const [c, n] of APP) for (const v of bienThe(n)) { nguocApp.set(v, c); nguocApp.set(gocTen(v), c); }
for (const [c, n] of FCK) for (const v of bienThe(n)) { nguocFck.set(v, c); nguocFck.set(gocTen(v), c); }

const hang = [];
for (const p of VITRI) {
  const tenApp = p.name, tenFck = FCK.get(p.code);
  if (!tenFck) { hang.push({ code: p.code, loai: 'thieu-nguon', app: tenApp, focks: null,
    mo: 'Atlas Focks không có mã này — chỉ còn một nguồn chữ, không trọng tài được.' }); continue; }
  const va = bienThe(tenApp), vf = bienThe(tenFck);
  const trung = va.some(a => vf.some(b => a === b || gocTen(a) === gocTen(b)
    || chuanDongAm(gocTen(a)) === chuanDongAm(gocTen(b))));
  if (trung) continue;

  // khớp chéo: tên app của mã này là tên Focks của mã KHÁC (và ngược lại) → lệch mã
  const cheoF = va.map(a => nguocFck.get(a) || nguocFck.get(gocTen(a))).find(c => c && c !== p.code);
  const cheoA = vf.map(b => nguocApp.get(b) || nguocApp.get(gocTen(b))).find(c => c && c !== p.code);
  const ky = vf.some(b => KY_HUYET.test(gocTen(b))) ? 'focks' : va.some(a => KY_HUYET.test(gocTen(a))) ? 'app' : null;

  let loai = 'khac-han', mo = 'Hai tên không quy về nhau — phải tra nguồn thứ ba (WHO / Deadman).';
  if (ky === 'focks') { loai = 'ky-huyet'; mo = `Focks gán tên KỲ HUYỆT ngoài kinh "${tenFck}" cho mã trong kinh — gần chắc là bóc sách lẫn trang. Nguồn Focks cho mã này KHÔNG DÙNG ĐƯỢC.`; }
  else if (ky === 'app') { loai = 'ky-huyet'; mo = `Từ điển app gán tên kỳ huyệt "${tenApp}" cho mã trong kinh.`; }
  else if (cheoF) { loai = 'lech-ma'; mo = `Tên app "${tenApp}" chính là tên Focks gán cho ${cheoF}. Nghi từ điển app LỆCH MÃ; câu VỊ TRÍ của mã này đang tả huyệt ${cheoF}.`; }
  else if (cheoA) { loai = 'lech-ma'; mo = `Tên Focks "${tenFck}" chính là tên app gán cho ${cheoA}. Hai nguồn lệch nhau một bậc quanh đây.`; }
  hang.push({ code: p.code, loai, app: tenApp, focks: tenFck, mo });
}

/* TRÙNG TÊN TRONG CÙNG MỘT NGUỒN — hai mã khác nhau mang cùng một tên. Có ca hợp lệ (Khẩu Hoà Liêu
 * LI19 và Nhĩ Hoà Liêu TE22 thật sự cùng tên gốc, khác bộ vị), nên chỉ báo cặp CÙNG KINH hoặc cặp mà
 * hai mã liền nhau — đó mới là dấu vết một dãy bị đẩy lệch đi một bậc. */
const theoTen = new Map();
for (const [c, n] of APP) { const k = chuanDongAm(gocTen(kd(n))); if (!theoTen.has(k)) theoTen.set(k, []); theoTen.get(k).push(c); }
const trungTen = [];
for (const [ten, ma] of theoTen) {
  if (ma.length < 2) continue;
  const kinh = ma.map(m => m.replace(/\d+$/, ''));
  const cungKinh = new Set(kinh).size < ma.length;
  if (!cungKinh) continue;
  // Focks có phân biệt hai mã ấy bằng TIỀN TỐ BỘ VỊ không (Đầu Lâm Khấp / Túc Lâm Khấp)?
  const tenF = ma.map(m => FCK.get(m)).filter(Boolean).map(n => chuanDongAm(kd(n)));
  const phanBiet = new Set(tenF).size === ma.length && tenF.every(n => TIEN_TO.test(n));
  trungTen.push({ ten, ma, nheHon: phanBiet,
    mo: phanBiet
      ? `Không phải lệch mã: Focks phân biệt bằng bộ vị (${ma.map(m => FCK.get(m)).join(' / ')}). Từ điển app lược mất bộ vị nên hai mã trông như một — nên bổ sung để tra cứu khỏi nhầm.`
      : 'Hai mã CÙNG MỘT KINH mang cùng tên và Focks KHÔNG phân biệt được — một dãy đang bị đẩy lệch một bậc.' });
}
if (trungTen.length) {
  console.log('── TRÙNG TÊN TRONG TỪ ĐIỂN APP — dấu vết dãy bị đẩy lệch\n');
  for (const t of trungTen) console.log(`   ${t.nheHon ? '·' : '⚠'} "${t.ten}" ← ${t.ma.join(', ')}\n         ${t.mo}`);
  console.log();
}

const nhom = {};
for (const h of hang) (nhom[h.loai] = nhom[h.loai] || []).push(h);
const THU_TU = ['lech-ma', 'ky-huyet', 'khac-han', 'thieu-nguon'];
const NHAN = {
  'lech-ma': 'LỆCH MÃ — engine đang dựng NHẦM HUYỆT, phải sửa trước mọi việc khác',
  'ky-huyet': 'KỲ HUYỆT LẪN VÀO — nguồn đó không dùng được cho mã này',
  'khac-han': 'TÊN KHÁC HẲN — cần nguồn thứ ba trọng tài',
  'thieu-nguon': 'THIẾU NGUỒN — chỉ có một nguồn chữ',
};
console.log(`KIỂM MÃ HUYỆT: ${VITRI.length} mã · sạch ${VITRI.length - hang.length} · có vấn đề ${hang.length}\n`);
for (const l of THU_TU) {
  const ds = nhom[l]; if (!ds) continue;
  console.log(`── ${NHAN[l]} — ${ds.length} mã`);
  for (const h of ds) console.log(`   ${h.code.padEnd(5)} app="${h.app}"  ·  focks="${h.focks || '—'}"\n         ${h.mo}`);
  console.log();
}
fs.writeFileSync(path.join(__dirname, 'ma-huyet-report.json'), JSON.stringify({ n: hang.length, hang, trungTen }, null, 1));
console.log('Báo cáo: backend/src/acu-solver/ma-huyet-report.json');
