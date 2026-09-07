/* parse-giai-phau — BÓC MỤC "GIẢI PHẪU" + "CHÂM CỨU" của sách thành dữ liệu CHIỀU SÂU.
 *
 * Bảy phép kiểm hiện có đều hỏi câu về BỀ MẶT: huyệt ở đúng bộ phận chưa, có nằm trên da không, cách
 * đường kinh bao xa, đúng số thốn chưa. Không phép nào hỏi câu mà thầy thuốc hỏi đầu tiên: "cắm kim
 * xuống đây thì xuyên qua cái gì?"
 *
 * Sách trả lời sẵn câu đó cho từng huyệt, ở hai mục chưa ai trong acu-solver đọc tới:
 *   GIẢI PHẪU  "Dưới da là cơ ngực to, cơ ngực bé, cơ răng cưa to, các cơ gian sườn 2."   (LU1)
 *              + thần kinh vận động cơ + tiết đoạn thần kinh chi phối da
 *   CHÂM CỨU   "Châm thẳng hoặc xiên hướng kim ra ngoài, lên trên, sâu 0,5 – 1 thốn."     (LU1)
 *
 * Hai mục này là NGUỒN NGOÀI ENGINE và nói về CHIỀU SÂU — đúng chỗ mù của mọi bộ kiểm cũ. Ghép lại
 * thì có một phép kiểm mới: từ toạ độ huyệt, cắm tia theo hướng kim tới độ sâu sách ghi, liệt kê cấu
 * trúc trong atlas mà tia xuyên qua, rồi so với danh sách sách. Lệch = huyệt sai chỗ, hoặc sai độ sâu.
 *
 * Dùng:  node backend/src/acu-solver/parse-giai-phau.cjs [--chi-tiet MÃ]                            */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const VITRI = require('./vitri-data.json');
const loadWin = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };
const ACU = loadWin(path.join(ROOT, 'frontend/public/kinhmach3d/data/acupoints.js'), 'ACUPOINTS');
const byId = new Map(ACU.records.map(r => [r.id, r]));

const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const sec = (r, key) => (r.sections || []).find(s => norm(s.h).includes(key))?.body || '';

/* Chuẩn hoá tên mô: sách dùng "to/bé", atlas dùng "lớn/bé"; sách hay ghi "cơ ngực to" cho cùng thứ mà
 * atlas gọi "cơ ngực lớn". Không quy về một mối thì không đối chiếu được tên nào với tên nào. */
const CHUAN = [
  [/\bto\b/g, 'lớn'], [/\bnhỏ\b/g, 'bé'], [/\bcơ delta\b/gi, 'cơ delta'],
  [/\bxương đòn gánh\b/gi, 'xương đòn'], [/\bcơ răng cưa\b/gi, 'cơ răng'],
  [/\bcơ chầy\b/gi, 'cơ chày'], [/\bgân cơ\b/gi, 'gân cơ'],
];
const chuanTen = s => { let t = s.trim().toLowerCase(); for (const [re, v] of CHUAN) t = t.replace(re, v); return t.replace(/\s+/g, ' ').trim(); };

/* "Dưới da là A, B, các C và D." → [A, B, C, D]
 * Bỏ mệnh đề phụ ("nơi có…", "chỗ lõm…") vì chúng tả VỊ TRÍ chứ không phải lớp mô. */
function bocDuoiDa(t) {
  const m = t.match(/dưới da (?:là|có)\s+([^.]+)\./i);
  if (!m) return [];
  return m[1]
    .split(/,|\svà\s|\shoặc\s/)
    .map(s => s.replace(/^\s*(các|những|nhóm)\s+/i, ''))
    .map(chuanTen)
    .filter(s => s.length > 2 && !/^(nơi|chỗ|khe|vùng)\b/.test(s));
}

const GOC = t => /thang|vuong goc/.test(t) ? 'thang' : /luon|duoi da|ngang|song song/.test(t) ? 'luon' : /xien|chech/.test(t) ? 'xien' : null;
function bocSau(t) {                       // "sâu 0,5 – 1 thốn" → {lo, hi}
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(?:[-–—]\s*(\d+(?:[.,]\d+)?))?\s*thon/);
  if (!m) return null;
  const n = s => parseFloat(s.replace(',', '.'));
  const lo = n(m[1]), hi = m[2] ? n(m[2]) : lo;
  return { lo, hi, giua: (lo + hi) / 2 };
}
const HUONG = [
  [/ra ngoai/, 'ngoai'], [/vao trong|phia trong/, 'trong'], [/len tren|huong len|chech len/, 'len'],
  [/xuong duoi|huong xuong|chech xuong/, 'xuong'], [/ra truoc|phia truoc/, 'truoc'], [/ra sau|phia sau/, 'sau'],
  [/cot song|dot song/, 'cot-song'],
];

function bocMot(code) {
  const v = Object.values(VITRI.points).find(p => p.code === code);
  if (!v || !byId.has(v.recId)) return null;
  const r = byId.get(v.recId);
  const gp = sec(r, 'giai phau'), cc = sec(r, 'cham cuu');
  const nc = norm(cc), cauDau = nc.split('.')[0];
  return {
    code, ten: v.name,
    duoiDa: bocDuoiDa(gp),
    thanKinh: (gp.match(/[Tt]hần kinh vận động[^.]*\./) || [''])[0].trim(),
    tietDoan: (gp.match(/tiết đoạn thần kinh\s+([A-Z]\d+(?:\s*[-–]\s*[A-Z]?\d+)?)/i) || [, ''])[1],
    goc: GOC(cauDau),
    sau: bocSau(nc),
    huong: HUONG.filter(([re]) => re.test(cauDau)).map(([, v2]) => v2),
    gpRaw: gp, ccRaw: cc,
  };
}

const CODES = Object.values(VITRI.points).map(p => p.code);
const OUT = {};
for (const c of CODES) { const r = bocMot(c); if (r) OUT[c] = r; }

if (require.main === module) {
  const ct = process.argv.includes('--chi-tiet') ? process.argv[process.argv.indexOf('--chi-tiet') + 1] : null;
  if (ct) { console.log(JSON.stringify(OUT[ct], null, 1)); process.exit(0); }
  const n = Object.keys(OUT).length;
  const coDuoiDa = Object.values(OUT).filter(o => o.duoiDa.length).length;
  const coGoc = Object.values(OUT).filter(o => o.goc).length;
  const coSau = Object.values(OUT).filter(o => o.sau).length;
  const coTiet = Object.values(OUT).filter(o => o.tietDoan).length;
  console.log(`BÓC GIẢI PHẪU + CHÂM CỨU — ${n} huyệt`);
  console.log(`  có danh sách "dưới da là…" : ${coDuoiDa} (${(coDuoiDa / n * 100).toFixed(0)}%)`);
  console.log(`  có góc châm               : ${coGoc} (${(coGoc / n * 100).toFixed(0)}%)`);
  console.log(`  có độ sâu (thốn)          : ${coSau} (${(coSau / n * 100).toFixed(0)}%)`);
  console.log(`  có tiết đoạn thần kinh da : ${coTiet} (${(coTiet / n * 100).toFixed(0)}%)`);
  const tan = {};
  for (const o of Object.values(OUT)) for (const t of o.duoiDa) tan[t] = (tan[t] || 0) + 1;
  const top = Object.entries(tan).sort((a, b) => b[1] - a[1]);
  console.log(`\n  ${top.length} tên mô khác nhau; 15 tên hay gặp nhất:`);
  for (const [t, k] of top.slice(0, 15)) console.log(`    ${String(k).padStart(3)}×  ${t}`);
  fs.writeFileSync(path.join(__dirname, 'giai-phau-data.json'),
    JSON.stringify({ generated: new Date().toISOString().slice(0, 10), total: n, points: OUT }, null, 1));
  console.log('\nĐã ghi giai-phau-data.json');
}
module.exports = { GIAI_PHAU: OUT, chuanTen };
