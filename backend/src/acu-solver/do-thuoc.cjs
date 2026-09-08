/* do-thuoc — DÒ THƯỚC THỐN IN SẴN TRONG SÁCH, tự động, trên mọi ảnh.
 *
 * VÌ SAO ĐÁNG LÀM. Phiên kinh Can chốt được thang đùi nhờ một agent tình cờ nhìn thấy thước in trên
 * bản vẽ rồi quét từng vạch. Đó là bằng chứng ngoài engine chắc nhất dự án có: không suy từ mốc, mà
 * đọc thẳng con số sách tự in. Nhưng tìm bằng mắt thì hên xui — 480 ảnh, mỗi agent chỉ mở vài trang.
 * Tệp này quét TẤT CẢ, để biết trang nào có thước trước khi tốn một đồng token nào.
 *
 * THƯỚC TRÔNG NHƯ THẾ NÀO. Một dãy VẠCH NGẮN nằm ngang, xếp thành cột dọc, cách đều nhau; hai đầu
 * thường có vạch dài hơn; cạnh mỗi vạch đôi khi có số. Vậy dấu hiệu máy tìm được là: nhiều cụm mực
 * DẸT (rộng hơn cao) có cùng hoành độ xấp xỉ, và khoảng cách giữa các cụm liên tiếp gần như không
 * đổi. Độ lệch chuẩn của khoảng cách chia cho khoảng cách trung bình — gọi là ĐỘ ĐỀU — là thước đo
 * tin cậy: dưới 0,12 thì gần như chắc chắn là thước in, không phải chữ hay nét vẽ ngẫu nhiên.
 *
 * Dùng:  node do-thuoc.cjs                 quét toàn bộ, in trang nào có thước
 *        node do-thuoc.cjs TE12            một huyệt
 *        node do-thuoc.cjs --min 8         chỉ nhận thước từ 8 vạch trở lên                        */
const fs = require('fs');
const path = require('path');
const jpeg = require(path.join(__dirname, '../../node_modules/jpeg-js'));
const HINH = require('./focks-hinh-map.json');

const args = process.argv.slice(2);
const iMin = args.indexOf('--min');
const MIN_VACH = iMin > 0 ? parseInt(args[iMin + 1]) : 6;
const chiMa = args.filter(a => !a.startsWith('--') && !/^\d+$/.test(a));

const laDen = (r, g, b) => r < 110 && g < 110 && b < 110 && Math.max(r, g, b) - Math.min(r, g, b) < 40;

/** gom pixel thành cụm rời (loang 8 hướng, bước thưa cho nhanh) */
function cum(diem, bk) {
  const chua = new Set(), out = [], map = new Map();
  for (const p of diem) map.set(p[0] + ',' + p[1], p);
  for (const p of diem) {
    const k0 = p[0] + ',' + p[1];
    if (chua.has(k0)) continue;
    const hang = [p], c = []; chua.add(k0);
    while (hang.length) {
      const q = hang.pop(); c.push(q);
      for (let dx = -bk; dx <= bk; dx++) for (let dy = -bk; dy <= bk; dy++) {
        const k = (q[0] + dx) + ',' + (q[1] + dy);
        if (map.has(k) && !chua.has(k)) { chua.add(k); hang.push(map.get(k)); }
      }
    }
    out.push(c);
  }
  return out;
}

function doMotAnh(tep) {
  const raw = jpeg.decode(fs.readFileSync(tep), { useTArray: true });
  const { width: W, height: H, data } = raw;
  const diem = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const i = (y * W + x) * 4;
    if (laDen(data[i], data[i + 1], data[i + 2])) diem.push([x, y]);
  }
  const cs = cum(diem, 3);
  /* VẠCH = cụm mực DẸT: rộng gấp rưỡi trở lên so với cao, cao dưới 14px (bước 2 nên ~7 đơn vị),
   * rộng 6–90px. Chữ số cạnh thước thì vuông hơn và cao hơn, nên rơi ra ngoài. */
  const vach = [];
  for (const c of cs) {
    const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const w = x1 - x0, h = y1 - y0;
    if (h > 14 || w < 6 || w > 90 || w < h * 1.5) continue;
    vach.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, w, x0, x1 });
  }
  /* Gom vạch thành CỘT: cùng hoành độ trong ±18px. Rồi trong mỗi cột, xét dãy y đã sắp xếp xem
   * khoảng cách có đều không. */
  const cot = [];
  for (const v of vach) {
    let c = cot.find(c => Math.abs(c.x - v.x) < 18);
    if (!c) { c = { x: v.x, vs: [] }; cot.push(c); }
    c.vs.push(v);
    c.x = c.vs.reduce((s, q) => s + q.x, 0) / c.vs.length;
  }
  const ra = [];
  for (const c of cot) {
    if (c.vs.length < MIN_VACH) continue;
    const ys = c.vs.map(v => v.y).sort((a, b) => a - b);
    const kc = []; for (let i = 1; i < ys.length; i++) kc.push(ys[i] - ys[i - 1]);
    const tb = kc.reduce((s, v) => s + v, 0) / kc.length;
    if (tb < 8) continue;                                   // vạch dính nhau, không phải thước
    const sd = Math.sqrt(kc.reduce((s, v) => s + (v - tb) ** 2, 0) / kc.length);
    const deu = sd / tb;
    if (deu > 0.22) continue;
    ra.push({ x: Math.round(c.x), soVach: ys.length, tuY: Math.round(ys[0]), denY: Math.round(ys[ys.length - 1]),
      buocPx: +tb.toFixed(2), doDeu: +deu.toFixed(3), quang: ys.length - 1 });
  }
  return { W, H, thuoc: ra.sort((a, b) => b.soVach - a.soVach) };
}

const ma = chiMa.length ? chiMa : Object.keys(HINH.huyet);
const co = [];
for (const code of ma) {
  for (const a of (HINH.huyet[code] || [])) {
    const tep = path.join(HINH._thumuc, a.file);
    if (!fs.existsSync(tep)) continue;
    let r; try { r = doMotAnh(tep); } catch (e) { continue; }
    if (!r.thuoc.length) continue;
    co.push({ code, file: a.file, W: r.W, H: r.H, thuoc: r.thuoc });
  }
}
console.log(`DÒ THƯỚC: quét ${ma.length} huyệt · ${co.length} ảnh CÓ dãy vạch đều (≥${MIN_VACH} vạch)\n`);
console.log('huyệt  ảnh                        cột x  vạch  quãng  bước(px)  độ đều');
for (const c of co) for (const t of c.thuoc)
  console.log(`  ${c.code.padEnd(5)}${c.file.padEnd(26)}${String(t.x).padStart(5)}${String(t.soVach).padStart(6)}${String(t.quang).padStart(7)}${String(t.buocPx).padStart(10)}${String(t.doDeu).padStart(8)}${t.doDeu < 0.12 ? '   ★ rất đều' : ''}`);
fs.writeFileSync(path.join(__dirname, 'thuoc-report.json'), JSON.stringify(co, null, 1));
console.log(`\nBáo cáo: backend/src/acu-solver/thuoc-report.json`);
