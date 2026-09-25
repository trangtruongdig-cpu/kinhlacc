/* chup-huyet.cjs — nạp model MỘT lần rồi chụp nhiều lượt.
 *
 *   node chup-huyet.cjs LU9                # chụp một huyệt
 *   node chup-huyet.cjs LU                 # chụp cả kinh Phế
 *   node chup-huyet.cjs --tat-ca           # cả 361 huyệt
 *   node chup-huyet.cjs --chi-dem --tat-ca # đếm thử: in 361 mã rồi thoát (không chụp)
 *   node chup-huyet.cjs --chi-dem LU9      # đếm thử: in 1 mã LU9 rồi thoát
 *
 * Yêu cầu: frontend dev server đang chạy ở cổng 5173.
 *
 * ⚠️ playwright KHÔNG có trong node_modules của repo (đo ở việc 3): 'npm install playwright' vào
 * repo là quyết định của người dùng, chưa được hỏi. Bản 1.63.0 nằm sẵn trong cache npx tại
 * ~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright — nạp bằng biến môi trường NODE_PATH:
 *
 *   NODE_PATH=~/.npm/_npx/e41f203b7505f1fb/node_modules node chup-huyet.cjs LU9
 *
 * (đường dẫn cache tuỳ máy — dò lại bằng `find ~/.npm/_npx -maxdepth 3 -iname playwright`
 * nếu cache đổi chỗ; KHÔNG hard-code đường dẫn node_modules của repo vì repo không có nó.)  */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
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

async function main() {
  const ds = danhSach(process.argv.slice(2));
  if (!ds.length) { console.error('Không có huyệt nào khớp.'); process.exit(1); }
  console.log(`Chụp ${ds.length} huyệt × ${KIEU.length} kiểu = ${ds.length * KIEU.length} ảnh`);
  fs.mkdirSync(OUTDIR, { recursive: true });

  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
    const loi = [];
    p.on('pageerror', e => loi.push(String(e)));
    await p.goto(TRANG);
    await p.waitForFunction(() => document.title === 'XUONG-SAN-SANG', { timeout: 180000 });
    console.log('Model đã nạp, bắt đầu chụp.');

    // SỬA LỖI 2: Đọc hoso.json cũ (nếu có) rồi gộp, không ghi đè sạch.
    let hoso = [];
    const teHoSo = path.join(OUTDIR, 'hoso.json');
    try {
      const cuSo = JSON.parse(fs.readFileSync(teHoSo, 'utf8'));
      if (Array.isArray(cuSo)) {
        hoso = cuSo;
      }
    } catch (e) {
      // SỬA LỖI 5: Cảnh báo khi hồ sơ cũ không đọc được (tệp hỏng hay không phải mảng)
      console.error(`⚠ Hồ sơ cũ ${teHoSo} không đọc được, sẽ ghi mới.`);
      // Bắt đầu từ rỗng. Không thoát — tiếp tục chụp.
    }
    // Xây dựng khóa để gộp: ma|kieu
    const khoaTrong = new Set(hoso.map(x => `${x.ma}|${x.kieu}`));

    for (const ma of ds) {
      const mer = ma.match(/^[A-Z]+/)[0];
      const gp = traHuyet(ma);
      for (const kieu of KIEU) {
        const nl = KHUNG.ngoaiLe[ma] || {};
        // HƯỚNG NHÌN: ưu tiên pháp tuyến THẬT của chính huyệt, xếp các hướng theo độ khớp
        // giảm dần (xem xepHuong()). Hướng dự bị (duBi) chỉ chèn lên đầu danh sách, không loại
        // ba hướng kia — nếu hướng dự bị làm ảnh thiếu nhãn thì vòng lặp bên dưới tự đổi hướng.
        // ⚠️ macDinh CHỈ dùng dự bị cho ảnh 'kinh' — đó là ảnh TOÀN THÂN của cả đường kinh, nên
        // muốn cả 11 ảnh của một kinh (vd. Phế) nhìn từ cùng một phía cho giống bộ atlas; lúc đó
        // hướng cố định theo kinh có ích. Ba kiểu 'da'/'gp'/'lan' là ảnh CẬN một huyệt — thứ quyết
        // định đúng phải là pháp tuyến THẬT của chính huyệt đó, ép theo hướng cả-kinh chỉ làm hỏng
        // (đây là lỗi đã xảy ra: từng cắm cứng "mer !== 'GB'" vào mã để né macDinh.GB sai, chữa
        // NGỌN — gốc bệnh là macDinh bị áp cho cả bốn kiểu ảnh trong khi nó chỉ đúng nghĩa cho
        // 'kinh'). ngoaiLe của từng huyệt (nl.huong) vẫn đè lên tất cả, cho cả bốn kiểu.
        const duBi = nl.huong || (kieu === 'kinh' ? (KHUNG.macDinh[mer] || {}).huong : undefined);
        const thuTuHuong = xepHuong(ma, duBi);
        const dat = {
          ma, kieu,
          huong: thuTuHuong[0],
          banKinhCm: nl.banKinhCm ?? KHUNG.banKinh[kieu] ?? 12,
          toSang: kieu === 'gp' ? gp.toDuoc.map(x => x.conceptId) : [],
        };
        let canh = await p.evaluate(d => window.__XUONG.dungCanh(d), dat);
        if (canh.loi) { console.error(`  ✗ ${ma}/${kieu}: ${canh.loi}`); continue; }

        // KIỂM NHÃN: dungCanh() báo thành công cả khi ảnh sẽ trắng nhãn. Phải tự kiểm, và
        // đổi hướng nếu thiếu — nếu không thì một số huyệt (đầu ngón tay, ngón chân) ra
        // ảnh không có nhãn nào mà không lỗi gì.
        // ⚠️ Bán kính KIỂM phải khớp bán kính VẼ (dòng dưới): ảnh 'lan' vẽ ở dat.banKinhCm,
        // ba kiểu kia vẽ ở 0.5cm. Kiểm bằng dat.banKinhCm (bán kính rộng, 10-18cm) rồi vẽ ở
        // 0.5cm là kiểm một bán kính, vẽ ở bán kính khác — đo được ca thật: LU11 ở hướng
        // 'front' có HT9/PC8 lọt bán kính rộng (qua được vòng kiểm) nhưng chính LU11 lại bị
        // lọc bởi pháp tuyến (không hướng về camera) nên KHÔNG có trong danh sách ở bán kính
        // rộng LẪN 0.5cm — soNhan>0 làm vòng lặp tưởng đạt, ảnh LU11-da/-gp/-kinh ra 3 nhãn
        // hàng xóm mà THIẾU đúng nhãn của huyệt đang chụp. Phải kiểm ĐÚNG mã `ma` có mặt
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

        // Gộp: nếu khóa ma|kieu đã có → cập nhật (thay thế); không có → thêm mới
        const khoa = `${ma}|${kieu}`;
        const dongMoi = { ma, kieu, tep: path.basename(tep), toSang: gp.toDuoc.map(x => x.ten),
          khongCo: gp.khongCo, hang: (CHOT[ma] || {}).hang || null };
        if (khoaTrong.has(khoa)) {
          // Tìm dòng cũ và thay thế
          const viTri = hoso.findIndex(x => x.ma === ma && x.kieu === kieu);
          if (viTri !== -1) {
            hoso[viTri] = dongMoi;
          }
        } else {
          // Dòng mới
          hoso.push(dongMoi);
          khoaTrong.add(khoa);
        }
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
