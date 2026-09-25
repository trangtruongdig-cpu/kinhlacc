/* ten-giai-phau.cjs — tra tên mô trong từ điển sang mã FMA của atlas 3D.
 *
 * Vì sao cần: mục GIẢI PHẪU của từ điển dùng danh pháp cũ ("cơ ngang gai", "cơ lưng dài"),
 * còn atlas dùng FMA ("Khu vực cơ ngực lớn", "Phần đòn của cơ thang"). Tra thẳng theo tên
 * chỉ được 57/643 (đo 25/09/2026).
 *
 * BẤT BIẾN: thà trả null còn hơn trả nhầm. Ảnh tô sai một cơ là dạy sai giải phẫu. */
const fs = require('fs');
const path = require('path');

const GOC = path.resolve(__dirname, '../../..');
const BANG = require('./ten-giai-phau-map.json');

let _concepts = null;
function concepts() {
  if (_concepts) return _concepts;
  const w = {};
  const duong = path.join(GOC, 'frontend/public/kinhmach3d/data/human-atlas-vi.js');
  new Function('window', fs.readFileSync(duong, 'utf8'))(w);
  _concepts = w.HUMAN_ATLAS_VI.concepts;
  return _concepts;
}

const chuan = (s) =>
  String(s).toLowerCase().normalize('NFC').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();

// Bảng đồng nghĩa với khoá đã chuẩn hoá. Giá trị null = chặn (không tô được).
let _bangChuan = null;
function bangChuan() {
  if (_bangChuan) return _bangChuan;
  _bangChuan = new Map();
  for (const [khoa, id] of Object.entries(BANG)) {
    if (khoa.startsWith('_')) continue; // khoá mô tả (vd "_ghiChu"), không phải tên mô thật
    const khoaChuân = chuan(khoa);
    _bangChuan.set(khoaChuân, id);
  }
  return _bangChuan;
}

// Bỏ mục có "phải"/"trái": đó là bản sao một bên, tô lên sẽ thành nửa người.
let _theoTen = null;
function theoTen() {
  if (_theoTen) return _theoTen;
  _theoTen = new Map();
  for (const [id, v] of Object.entries(concepts())) {
    const vi = chuan(v[0]);
    if (/\b(phải|trái)\b/.test(vi)) continue;
    if (!_theoTen.has(vi)) _theoTen.set(vi, id);
  }
  return _theoTen;
}

function tenCuaConcept(id) {
  const v = concepts()[id];
  return v ? v[0] : null;
}

function traTen(ten) {
  const k = chuan(ten);
  const b = bangChuan();
  if (b.has(k)) {
    const id = b.get(k);
    return id ? { conceptId: id, cach: 'bang' } : null;
  }
  const m = theoTen();
  if (m.has(k)) return { conceptId: m.get(k), cach: 'thang' };
  if (m.has('khu vực ' + k)) return { conceptId: m.get('khu vực ' + k), cach: 'khuVuc' };
  return null;
}

let _gp = null;
function traHuyet(code) {
  if (!_gp) _gp = require('./giai-phau-data.json').points;
  const v = _gp[code];
  if (!v || !Array.isArray(v.duoiDa)) return { toDuoc: [], khongCo: [] };
  const toDuoc = [];
  const khongCo = [];
  for (const ten of v.duoiDa) {
    const r = traTen(ten);
    if (r) toDuoc.push({ ten, conceptId: r.conceptId });
    else khongCo.push(ten);
  }
  return { toDuoc, khongCo };
}

module.exports = { traTen, traHuyet, tenCuaConcept };
