/* chup-huyet.cjs — nạp model MỘT lần rồi chụp nhiều lượt.
 *
 *   node chup-huyet.cjs LU9                # chụp một huyệt
 *   node chup-huyet.cjs LU                 # chụp cả kinh Phế
 *   node chup-huyet.cjs --tat-ca           # cả 361 huyệt
 *   node chup-huyet.cjs --chi-dem --tat-ca # đếm thử: in 361 mã rồi thoát (không chụp)
 *   node chup-huyet.cjs --chi-dem LU9      # đếm thử: in 1 mã LU9 rồi thoát
 *   node chup-huyet.cjs --doi-moi           # quét TOÀN BỘ hoso.json, chụp lại đúng ảnh có vân tay
 *                                            # lệch (toạ độ/pháp tuyến huyệt, huyệt lân cận, cùng
 *                                            # kinh, hoặc khung-anh.json đổi) — bỏ qua tham số huyệt
 *   node chup-huyet.cjs --doi-moi --chi-dem # như trên nhưng chỉ LIỆT KÊ ảnh cũ + lý do, không mở
 *                                            # trình duyệt, không chụp
 *
 * Yêu cầu: frontend dev server đang chạy ở cổng 5173.
 *
 * Playwright tự động nạp từ: (1) require() trực tiếp nếu có cài; (2) cache npx nếu từng chạy
 * qua npx playwright; hoặc (3) ném lỗi với hướng dẫn cài. Không cần đặt NODE_PATH.  */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** Dò tìm và nạp Playwright từ ba nguồn theo thứ tự ưu tiên:
 *  1. require('playwright') trực tiếp — nếu đã cài vào repo.
 *  2. Cache npx (HOME)/.npm/_npx/ — chọn bản phiên bản cao nhất.
 *  3. Ném lỗi với hướng dẫn nếu không tìm được.
 *  Đồng thời in ra bản đang dùng và đường dẫn của nó. */
function napPlaywright() {
  // Thử nạp trực tiếp từ repo hoặc node_modules toàn cục
  try {
    const pw = require('playwright');
    console.log(`Nạp playwright từ require() trực tiếp`);
    return pw;
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') throw e;
  }

  // Dò trong cache npx
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (!homeDir) {
    throw new Error(
      'Không tìm thấy HOME hoặc USERPROFILE. Vui lòng cài playwright:\n' +
      '  npx playwright@latest install chromium\n' +
      'hoặc cài vào repo:\n' +
      '  npm install playwright'
    );
  }

  const npxDir = path.join(homeDir, '.npm/_npx');
  if (!fs.existsSync(npxDir)) {
    throw new Error(
      'Không tìm thấy playwright. Vui lòng cài bằng:\n' +
      '  npx playwright@latest install chromium\n' +
      'hoặc cài vào repo:\n' +
      '  npm install playwright'
    );
  }

  // Quét tất cả mục trong cache npx, lấy những bản có playwright
  const entries = fs.readdirSync(npxDir);
  const versions = [];

  for (const entry of entries) {
    const playwrightPath = path.join(npxDir, entry, 'node_modules/playwright');
    if (!fs.existsSync(playwrightPath)) continue;

    try {
      const pkgPath = path.join(playwrightPath, 'package.json');
      if (!fs.existsSync(pkgPath)) continue;

      const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (packageJson.version) {
        versions.push({
          version: packageJson.version,
          path: playwrightPath
        });
      }
    } catch (e) {
      // Bỏ qua nếu không đọc được package.json
    }
  }

  if (!versions.length) {
    throw new Error(
      'Không tìm thấy playwright trong cache npx. Vui lòng cài bằng:\n' +
      '  npx playwright@latest install chromium\n' +
      'hoặc cài vào repo:\n' +
      '  npm install playwright'
    );
  }

  // Sắp xếp theo phiên bản cao nhất (so sánh từng phần của version)
  versions.sort((a, b) => {
    const aParts = a.version.split('.').map(x => parseInt(x, 10) || 0);
    const bParts = b.version.split('.').map(x => parseInt(x, 10) || 0);
    const maxLen = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < maxLen; i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      if (aPart !== bPart) return bPart - aPart;
    }
    return 0;
  });

  const selected = versions[0];
  console.log(`Nạp playwright ${selected.version} từ ${selected.path}`);

  // Nạp module từ đường dẫn đã chọn
  return require(selected.path);
}

const pw = napPlaywright();
const { chromium } = pw;
const { traHuyet } = require('./ten-giai-phau.cjs');

const KHUNG = require('./khung-anh.json');
// Sổ nghiệm thu toạ độ: hạng A = có bằng chứng ngoài engine, B = engine dựng. 17 huyệt hạng B
// phải nói rõ dưới ảnh chứ không giấu (spec, mục "Độ tin cậy toạ độ").
const CHOT = require('./huyet-chot.json').chot;
const GOC = path.resolve(__dirname, '../../..');
const OUTDIR = process.env.OUTDIR || path.join(GOC, '.anh-huyet');
const TRANG = process.env.TRANG || 'http://localhost:5173/kinhmach3d/xuong-anh.html';
const KIEU = ['da', 'gp', 'lan', 'kinh'];

/** Xếp bốn hướng nhìn theo độ khớp với pháp tuyến THẬT của huyệt, tốt nhất trước.
 *  Hướng dự bị (theo kinh) chèn lên đầu nếu có, nhưng KHÔNG loại ba hướng kia khỏi danh sách.
 *  ⚠️ TRUC phải CHÍNH XÁC khớp với HUONG trong dungCanh() (map3d.js dòng 3244-3245) —
 *  sai chiều left/right làm huyệt mặt bên xếp sai hạng, chọn hướng xiên vừa qua ngưỡng → ảnh xấu. */
function xepHuong(ma, duBi) {
  const n = (toaDo()[ma] || {}).n;
  const TRUC = { front: [0, 0, 1], back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0] };
  let ds = Object.keys(TRUC);
  if (n) {
    ds = ds.sort((a, b) => cham(TRUC[b], n) - cham(TRUC[a], n));
  }
  if (duBi && ds[0] !== duBi) ds = [duBi, ...ds.filter(x => x !== duBi)];
  return ds;
}
const cham = (a, b) => a[0] * (b.x ?? b[0]) + a[1] * (b.y ?? b[1]) + a[2] * (b.z ?? b[2]);

let _toaDo = null;
function toaDo() {
  if (_toaDo) return _toaDo;
  const w = {};
  new Function('window', fs.readFileSync(
    path.join(GOC, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'utf8'))(w);
  _toaDo = w.ACU_COORDS3D.points;
  return _toaDo;
}

function danhSach(args) {
  const w = {};
  new Function('window', fs.readFileSync(
    path.join(GOC, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'utf8'))(w);
  const tatCa = Object.keys(w.ACU_COORDS3D.points);
  // SỬA LỖI 1: Kiểm --chi-dem TRƯỚC nhánh --tat-ca để đếm thử hoạt động với cả --tat-ca
  const chiDem = args.includes('--chi-dem');
  if (chiDem) {
    // Nhánh đếm thử: lọc mã (có thể là --tat-ca hay danh sách cụ thể) rồi in danh sách mà không chụp
    let ketQua;
    if (args.includes('--tat-ca')) {
      ketQua = tatCa;
    } else {
      const loc = args.filter(a => !a.startsWith('--'));
      ketQua = tatCa.filter(c => loc.some(x => {
        const coSo = /\d/.test(x);
        if (coSo) {
          return c === x;  // Đúng bằng
        } else {
          return c.startsWith(x) && /^\d+$/.test(c.slice(x.length));  // Tiền tố + phần dư là số
        }
      }));
    }
    // SỬA LỖI 4: Báo lỗi khi không có huyệt nào khớp (giống nhánh chụp thật)
    if (!ketQua.length) {
      console.error('Không có huyệt nào khớp.');
      process.exit(1);
    }
    console.log(ketQua.join(', '));
    process.exit(0);
  }

  // Nhánh chụp thật: lọc mã từ danh sách cung cấp
  if (args.includes('--tat-ca')) {
    return tatCa;
  }
  const loc = args.filter(a => !a.startsWith('--'));
  const ketQua = tatCa.filter(c => loc.some(x => {
    // Lọc mã huyệt chính xác.
    // - Nếu x có chữ số (vd LI1, GB34): chỉ khớp ĐÚNG BẰNG, không khớp tiền tố (tránh LI10 trùng LI1)
    // - Nếu x chỉ chữ cái (vd LI, GB): khớp mọi mã bắt đầu bằng x với phần dư toàn chữ số
    const coSo = /\d/.test(x);
    if (coSo) {
      return c === x;  // Đúng bằng
    } else {
      return c.startsWith(x) && /^\d+$/.test(c.slice(x.length));  // Tiền tố + phần dư là số
    }
  }));
  return ketQua;
}

/* ============================== VÂN TAY ẢNH (dauVan) ==============================
 * Dời MỘT huyệt làm cũ nhiều hơn bốn ảnh của chính nó — ba tầng phụ thuộc, mỗi kiểu ảnh một
 * công thức riêng (KHÔNG được gộp chung một hàm băm, kẻo mất khả năng chỉ ra lý do):
 *
 *  - da, gp của X: {x,y,z,n} của X (làm tròn 5 chữ số) + {huong, banKinhCm} đã dùng.
 *  - lan của Y: danh sách đã sắp [mã,x,y,z] của MỌI huyệt trong bán kính của Y — kể cả chính nó,
 *    kể cả huyệt khác kinh — vì ảnh 'lan' vẽ nhãn cho mọi huyệt nhìn thấy quanh Y. + {huong,
 *    banKinhCm} đã dùng.
 *  - kinh của X: danh sách đã sắp [mã,x,y,z] của mọi huyệt CÙNG KINH với X + nội dung nguyên văn
 *    meridian-paths.js + {huong}. (Bán kính ảnh 'kinh' là hằng số 95cm ghim cứng trong
 *    map3d.js/dungCanh(), không đọc từ khung-anh.json — nên KHÔNG đưa banKinhCm vào đây.)
 *
 * dauVan lưu dạng OBJECT nhiều khoá con (không phải một chuỗi băm duy nhất): --doi-moi so từng
 * khoá riêng để chỉ đúng lý do cũ (toạ độ chính nó / huyệt lân cận / cùng kinh / meridian-paths.js
 * / khung hình), thay vì chỉ biết "có gì đó khác" mà không rõ vì sao.
 *
 * ⚠️ Vân tay tính theo HƯỚNG MẶC ĐỊNH (thuTuHuong[0]), KHÔNG theo hướng thật sự dùng nếu chụp thật
 * rơi vào nhánh dự phòng (xem chupMotAnh — vòng lặp đổi hướng khi hướng đầu không có nhãn). Nhờ vậy
 * --doi-moi --chi-dem không cần mở trình duyệt vẫn ra kết quả TẤT ĐỊNH: chạy hai lần liền không đổi
 * gì thì phải ra giống hệt nhau. Trường hợp ảnh thật rơi vào nhánh dự phòng rất hiếm (đã có dòng
 * cảnh báo "không nhãn nào ở cả 4 hướng" riêng) và không phá tính tất định của phép so sau này. */

const CHU_KY_LY_DO = {
  rieng: 'toạ độ hoặc pháp tuyến của chính huyệt đổi',
  lanCan: 'toạ độ huyệt lân cận (kể cả chính nó) đổi',
  cungKinh: 'toạ độ huyệt cùng kinh đổi',
  duongKinh: 'meridian-paths.js đổi',
  khung: 'khung hình đổi (hướng nhìn hoặc bán kính trong khung-anh.json)',
  chuaCoVanTay: 'chưa có vân tay',
  khongConToaDo: 'huyệt không còn toạ độ trong acu-coords3d.js',
};

function lamTron5(v) { return Math.round(v * 1e5) / 1e5; }

function bam(doiTuong) {
  return crypto.createHash('sha1').update(JSON.stringify(doiTuong)).digest('hex');
}

function toaDoLamTron(ma) {
  const p = toaDo()[ma];
  if (!p) return null;
  return { x: lamTron5(p.x), y: lamTron5(p.y), z: lamTron5(p.z), n: (p.n || []).map(lamTron5) };
}

// Nội dung nguyên văn + hằng số cm của meridian-paths.js — nạp một lần mỗi tiến trình. Dùng cho
// vân tay 'kinh' (băm cả file) và để đổi khoảng-cách-chuẩn-hoá (0..1 theo chiều cao mesh) sang cm
// khi dò huyệt lân cận của 'lan'.
let _duongKinhRaw = null;
let _cmToanThan = 171.9;
function napDuongKinh() {
  if (_duongKinhRaw !== null) return;
  _duongKinhRaw = fs.readFileSync(
    path.join(GOC, 'frontend/public/kinhmach3d/data/meridian-paths.js'), 'utf8');
  try {
    const w = {};
    new Function('window', _duongKinhRaw)(w);
    if (w.MERIDIAN_PATHS && w.MERIDIAN_PATHS.cm) _cmToanThan = w.MERIDIAN_PATHS.cm;
  } catch (e) {
    // File hỏng cú pháp thì vẫn dùng 171.9 mặc định — không chặn việc tính vân tay.
  }
}

function khoangCachCm(a, b) {
  napDuongKinh();
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) * _cmToanThan;
}

// duBi: hướng dự bị — chỉ 'kinh' lấy theo macDinh của cả kinh, ba kiểu kia chỉ lấy ngoaiLe của
// chính huyệt (xem khung-anh.json). DÙNG CHUNG giữa chupMotAnh() (chụp thật) và huongDuKien()
// (tính vân tay) để khỏi lặp logic và khỏi lệch nhau giữa hai chỗ.
function tinhDuBi(ma, kieu) {
  const nl = KHUNG.ngoaiLe[ma] || {};
  const mer = ma.match(/^[A-Z]+/)[0];
  return nl.huong || (kieu === 'kinh' ? (KHUNG.macDinh[mer] || {}).huong : undefined);
}

function huongDuKien(ma, kieu) {
  return xepHuong(ma, tinhDuBi(ma, kieu))[0];
}

function banKinhDuKien(ma, kieu) {
  const nl = KHUNG.ngoaiLe[ma] || {};
  return nl.banKinhCm ?? KHUNG.banKinh[kieu] ?? 12;
}

/** Tính vân tay cho MỘT ảnh (ma, kieu). Thuần hàm của dữ liệu đang có trên đĩa (acu-coords3d.js,
 *  khung-anh.json, meridian-paths.js) — không đụng trình duyệt, nên gọi được từ --doi-moi --chi-dem
 *  mà không cần mở trang xưởng. Trả về object nhiều khoá con (xem block chú thích phía trên); trả
 *  về null nếu huyệt không còn toạ độ trong acu-coords3d.js. */
function tinhDauVan(ma, kieu) {
  const diem = toaDoLamTron(ma);
  if (!diem) return null;
  const huong = huongDuKien(ma, kieu);

  if (kieu === 'da' || kieu === 'gp') {
    return { rieng: bam(diem), khung: bam({ huong, banKinhCm: banKinhDuKien(ma, kieu) }) };
  }

  if (kieu === 'lan') {
    const banKinh = banKinhDuKien(ma, kieu);
    const all = toaDo();
    const trongBanKinh = Object.keys(all)
      .filter(x => khoangCachCm(diem, toaDoLamTron(x)) <= banKinh)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .map(x => { const d = toaDoLamTron(x); return [x, d.x, d.y, d.z]; });
    return { lanCan: bam(trongBanKinh), khung: bam({ huong, banKinhCm: banKinh }) };
  }

  // kieu === 'kinh': mọi huyệt cùng tiền tố chữ cái với ma (không cắm tên kinh cụ thể vào mã).
  const mer = ma.match(/^[A-Z]+/)[0];
  const all = toaDo();
  const cungKinh = Object.keys(all)
    .filter(x => x.match(/^[A-Z]+/)[0] === mer)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map(x => { const d = toaDoLamTron(x); return [x, d.x, d.y, d.z]; });
  napDuongKinh();
  return { cungKinh: bam(cungKinh), duongKinh: bam(_duongKinhRaw), khung: bam({ huong }) };
}

/** So vân tay CŨ (đã lưu trong hoso.json) với vân tay MỚI (vừa tính lại). Trả về danh sách khoá lý
 *  do lệch — rỗng nghĩa là khớp, ảnh còn mới. Dòng cũ hoàn toàn chưa có dauVan (48 ảnh chụp trước
 *  khi có khâu này) luôn coi là CŨ dù không so được phần nào. */
function soSanhVaLyDo(cu, moi) {
  if (!cu || typeof cu !== 'object') return ['chuaCoVanTay'];
  const lyDo = [];
  for (const k of Object.keys(moi)) {
    if (cu[k] !== moi[k]) lyDo.push(k);
  }
  return lyDo;
}

/** Quét từng dòng hoso.json, tính lại vân tay hiện tại rồi so với dauVan đã lưu. Trả về mảng
 *  { ma, kieu, lyDo: [...khoá lý do...] } cho những ảnh LỆCH. */
function timAnhDaCu(hoso) {
  const anhDaCu = [];
  for (const dong of hoso) {
    const moi = tinhDauVan(dong.ma, dong.kieu);
    if (!moi) {
      anhDaCu.push({ ma: dong.ma, kieu: dong.kieu, lyDo: ['khongConToaDo'] });
      continue;
    }
    const lyDo = soSanhVaLyDo(dong.dauVan, moi);
    if (lyDo.length) anhDaCu.push({ ma: dong.ma, kieu: dong.kieu, lyDo });
  }
  return anhDaCu;
}
/* ============================ HẾT PHẦN VÂN TAY ẢNH ============================ */

/** Đọc hoso.json cũ (nếu có), khoan dung với file thiếu/hỏng — dùng cho đường chụp bình thường,
 *  nơi bắt đầu từ rỗng vẫn hợp lệ (lần chụp đầu tiên chưa có file). */
function docHoSo(teHoSo) {
  let hoso = [];
  try {
    const cuSo = JSON.parse(fs.readFileSync(teHoSo, 'utf8'));
    if (Array.isArray(cuSo)) hoso = cuSo;
  } catch (e) {
    // SỬA LỖI 5: Cảnh báo khi hồ sơ cũ không đọc được (tệp hỏng hay không phải mảng)
    console.error(`⚠ Hồ sơ cũ ${teHoSo} không đọc được, sẽ ghi mới.`);
  }
  return hoso;
}

/** Gộp một dòng mới vào hoso: khoá ma|kieu đã có thì thay thế tại chỗ (giữ vị trí), chưa có thì
 *  thêm mới vào cuối. */
function ganVaoHoSo(hoso, khoaTrong, dongMoi) {
  const khoa = `${dongMoi.ma}|${dongMoi.kieu}`;
  if (khoaTrong.has(khoa)) {
    const viTri = hoso.findIndex(x => x.ma === dongMoi.ma && x.kieu === dongMoi.kieu);
    if (viTri !== -1) hoso[viTri] = dongMoi;
  } else {
    hoso.push(dongMoi);
    khoaTrong.add(khoa);
  }
}

/** Mở trang xưởng (chromium + trang xuong-anh.html), chờ model sẵn sàng. Dùng chung cho đường chụp
 *  bình thường và đường chụp lại của --doi-moi. */
async function moTrangXuong() {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
  const loi = [];
  p.on('pageerror', e => loi.push(String(e)));
  await p.goto(TRANG);
  // ⚠️ waitForFunction(fn, arg, options) — PHẢI truyền `undefined` ở vị trí arg. Thiếu nó thì object
  // { timeout: 180000 } bị hiểu nhầm thành arg (tham số truyền vào fn), rơi về timeout MẶC ĐỊNH
  // 30000ms của Playwright — model xưởng thường tải lâu hơn 30s (nhất là khi máy đang chạy nhiều
  // tiến trình khác), nên lỗi này từng làm --doi-moi thật ném TimeoutError giả (lỗi có sẵn trong
  // bản gốc, không phải do khâu vân tay gây ra — chỉ lộ ra khi máy tải chậm hơn 30s).
  await p.waitForFunction(() => document.title === 'XUONG-SAN-SANG', undefined, { timeout: 180000 });
  console.log('Model đã nạp, bắt đầu chụp.');
  return { b, p, loi };
}

/** Chụp MỘT ảnh (ma, kieu) trên trang đã mở sẵn. Trả về dòng hoso mới (đã kèm dauVan), hoặc null
 *  nếu lỗi (không thấy chấm huyệt trên cảnh — huyệt không tồn tại hoặc trang chưa sẵn sàng). */
async function chupMotAnh(p, ma, kieu) {
  const gp = traHuyet(ma);
  // HƯỚNG NHÌN: ưu tiên pháp tuyến THẬT của chính huyệt, xếp các hướng theo độ khớp giảm dần (xem
  // xepHuong()). Hướng dự bị (duBi) chỉ chèn lên đầu danh sách, không loại ba hướng kia — nếu
  // hướng dự bị làm ảnh thiếu nhãn thì vòng lặp bên dưới tự đổi hướng.
  // ⚠️ duBi CHỈ dùng dự bị theo-kinh cho ảnh 'kinh' — đó là ảnh TOÀN THÂN của cả đường kinh, nên
  // muốn cả 11 ảnh của một kinh (vd. Phế) nhìn từ cùng một phía cho giống bộ atlas; lúc đó hướng cố
  // định theo kinh có ích. Ba kiểu 'da'/'gp'/'lan' là ảnh CẬN một huyệt — thứ quyết định đúng phải
  // là pháp tuyến THẬT của chính huyệt đó, ép theo hướng cả-kinh chỉ làm hỏng (đây là lỗi đã xảy
  // ra: từng cắm cứng "mer !== 'GB'" vào mã để né macDinh.GB sai, chữa NGỌN — gốc bệnh là macDinh bị
  // áp cho cả bốn kiểu ảnh trong khi nó chỉ đúng nghĩa cho 'kinh'). ngoaiLe của từng huyệt vẫn đè
  // lên tất cả, cho cả bốn kiểu. (tinhDuBi() gộp logic này lại để dùng chung với huongDuKien().)
  const duBi = tinhDuBi(ma, kieu);
  const thuTuHuong = xepHuong(ma, duBi);
  const dat = {
    ma, kieu,
    huong: thuTuHuong[0],
    banKinhCm: banKinhDuKien(ma, kieu),
    toSang: kieu === 'gp' ? gp.toDuoc.map(x => x.conceptId) : [],
  };
  let canh = await p.evaluate(d => window.__XUONG.dungCanh(d), dat);
  if (canh.loi) { console.error(`  ✗ ${ma}/${kieu}: ${canh.loi}`); return null; }

  // KIỂM NHÃN: dungCanh() báo thành công cả khi ảnh sẽ trắng nhãn. Phải tự kiểm, và đổi hướng nếu
  // thiếu — nếu không thì một số huyệt (đầu ngón tay, ngón chân) ra ảnh không có nhãn nào mà không
  // lỗi gì.
  // ⚠️ Bán kính KIỂM phải khớp bán kính VẼ (dòng dưới): ảnh 'lan' vẽ ở dat.banKinhCm, ba kiểu kia vẽ
  // ở 0.5cm. Kiểm bằng dat.banKinhCm (bán kính rộng, 10-18cm) rồi vẽ ở 0.5cm là kiểm một bán kính,
  // vẽ ở bán kính khác — đo được ca thật: LU11 ở hướng 'front' có HT9/PC8 lọt bán kính rộng (qua
  // được vòng kiểm) nhưng chính LU11 lại bị lọc bởi pháp tuyến (không hướng về camera) nên KHÔNG có
  // trong danh sách ở bán kính rộng LẪN 0.5cm — soNhan>0 làm vòng lặp tưởng đạt, ảnh LU11-da/-gp/
  // -kinh ra 3 nhãn hàng xóm mà THIẾU đúng nhãn của huyệt đang chụp. Phải kiểm ĐÚNG mã `ma` có mặt
  // trong danh sách ở ĐÚNG bán kính sẽ vẽ, không chỉ đếm số lượng nhãn bất kỳ.
  const rNhanVe = kieu === 'lan' ? dat.banKinhCm : 0.5;
  let coNhanChinh = await p.evaluate(
    ({ r, ma }) => window.__XUONG.nhan(r).some(x => x.ma === ma), { r: rNhanVe, ma });
  for (let i = 1; i < thuTuHuong.length && !coNhanChinh; i++) {
    dat.huong = thuTuHuong[i];
    canh = await p.evaluate(d => window.__XUONG.dungCanh(d), dat);
    coNhanChinh = await p.evaluate(
      ({ r, ma }) => window.__XUONG.nhan(r).some(x => x.ma === ma), { r: rNhanVe, ma });
  }
  if (!coNhanChinh) console.error(`  ⚠ ${ma}/${kieu}: không nhãn nào ở cả 4 hướng`);

  // Nhãn: ảnh 'lan' ghi tên mọi huyệt quanh đó; ba kiểu kia chỉ ghi huyệt chính.
  await p.evaluate(({ ma, kieu, r }) => {
    const ds = window.__XUONG.nhan(kieu === 'lan' ? r : 0.5);
    window.__NHAN(ds, ma);
  }, { ma, kieu, r: dat.banKinhCm });

  const tep = path.join(OUTDIR, `${ma}-${kieu}.png`);
  await p.screenshot({ path: tep });

  return {
    ma, kieu, tep: path.basename(tep),
    toSang: gp.toDuoc.map(x => x.ten),
    khongCo: gp.khongCo,
    hang: (CHOT[ma] || {}).hang || null,
    dauVan: tinhDauVan(ma, kieu),
  };
}

/** Chế độ --doi-moi: KHÔNG chụp theo tham số dòng lệnh (mer/mã huyệt), mà quét TOÀN BỘ hồ sơ
 *  hoso.json đang có, tính lại vân tay từng ảnh, so với dauVan đã lưu, rồi chụp lại đúng những ảnh
 *  lệch. Ghép với --chi-dem để chỉ liệt kê (không mở trình duyệt, không chụp) — dùng để kiểm nhanh
 *  trước khi tốn thời gian chụp thật, hoặc để xác nhận "không còn ảnh nào cũ". */
async function chayDoiMoi(chiDem) {
  const teHoSo = path.join(OUTDIR, 'hoso.json');
  if (!fs.existsSync(teHoSo)) {
    console.error(`Không thấy hồ sơ ${teHoSo} — chưa có ảnh nào để so vân tay.`);
    process.exit(1);
  }
  let hoso;
  try {
    hoso = JSON.parse(fs.readFileSync(teHoSo, 'utf8'));
    if (!Array.isArray(hoso)) throw new Error('nội dung không phải mảng');
  } catch (e) {
    console.error(`Hồ sơ ${teHoSo} hỏng, không đọc được: ${e.message}`);
    process.exit(1);
  }
  if (!hoso.length) {
    console.log('Hồ sơ rỗng — không có ảnh nào để kiểm.');
    return;
  }

  const anhDaCu = timAnhDaCu(hoso);

  if (!anhDaCu.length) {
    console.log('Không ảnh nào cũ — hồ sơ đã khớp toạ độ và khung hình hiện tại.');
    return;
  }

  console.log(`${anhDaCu.length} ảnh cũ:`);
  for (const a of anhDaCu) {
    const lyDoChu = a.lyDo.map(k => CHU_KY_LY_DO[k] || k).join('; ');
    console.log(`  ${a.ma}-${a.kieu}: ${lyDoChu}`);
  }

  if (chiDem) return;  // chỉ liệt kê, không chụp, không mở trình duyệt

  console.log(`\nChụp lại ${anhDaCu.length} ảnh...`);
  fs.mkdirSync(OUTDIR, { recursive: true });
  const khoaTrong = new Set(hoso.map(x => `${x.ma}|${x.kieu}`));
  const { b, p, loi } = await moTrangXuong();
  try {
    for (const { ma, kieu } of anhDaCu) {
      const dongMoi = await chupMotAnh(p, ma, kieu);
      if (dongMoi) {
        ganVaoHoSo(hoso, khoaTrong, dongMoi);
        process.stdout.write(`  ${ma}-${kieu} ✓\n`);
      }
    }
    fs.writeFileSync(teHoSo, JSON.stringify(hoso, null, 1));
    console.log(`\nXong, hồ sơ có ${hoso.length} dòng → ${teHoSo}`);
    if (loi.length) console.error(`⚠ ${loi.length} lỗi JS trong trang:`, loi.slice(0, 3));
  } finally {
    await b.close();
  }
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('--doi-moi')) {
    await chayDoiMoi(argv.includes('--chi-dem'));
    return;
  }

  const ds = danhSach(argv);
  if (!ds.length) { console.error('Không có huyệt nào khớp.'); process.exit(1); }
  console.log(`Chụp ${ds.length} huyệt × ${KIEU.length} kiểu = ${ds.length * KIEU.length} ảnh`);
  fs.mkdirSync(OUTDIR, { recursive: true });

  const { b, p, loi } = await moTrangXuong();
  try {
    // SỬA LỖI 2: Đọc hoso.json cũ (nếu có) rồi gộp, không ghi đè sạch.
    const teHoSo = path.join(OUTDIR, 'hoso.json');
    const hoso = docHoSo(teHoSo);
    const khoaTrong = new Set(hoso.map(x => `${x.ma}|${x.kieu}`));

    for (const ma of ds) {
      for (const kieu of KIEU) {
        const dongMoi = await chupMotAnh(p, ma, kieu);
        if (dongMoi) ganVaoHoSo(hoso, khoaTrong, dongMoi);
      }
      process.stdout.write(`  ${ma} ✓\n`);
    }

    fs.writeFileSync(teHoSo, JSON.stringify(hoso, null, 1));
    console.log(`\nXong ${hoso.length} ảnh → ${OUTDIR}`);
    if (loi.length) console.error(`⚠ ${loi.length} lỗi JS trong trang:`, loi.slice(0, 3));
  } finally {
    await b.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
