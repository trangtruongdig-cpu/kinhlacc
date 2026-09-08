/* do-anh-atlas — ĐO TRÊN ẢNH SÁCH, thay vì nhìn rồi tả bằng lời.
 *
 * VÌ SAO CẦN. Vòng 1 của hội đồng có giao việc "đọc ảnh atlas", và phản biện ảnh có đọc thật, nhưng
 * sản phẩm chỉ là câu chữ ("huyệt nằm hơi dưới chỏm xương"). Câu chữ ấy không đối chiếu được với toạ
 * độ mesh, nên rốt cuộc mọi phán quyết vẫn dựa vào cốt độ và mốc xương — đúng phần mà thẩm tra bác
 * nhiều nhất. Trong khi ảnh sách CHỨA SẴN thứ chắc hơn mọi câu chữ: vị trí huyệt vẽ ngay trên hình
 * xương, kèm các huyệt kinh KHÁC trên cùng một hình (Sj cạnh Di, Dü, Ex-UE). Tỉ lệ giữa chúng miễn
 * nhiễm với thang đo — ảnh không có thước vẫn dùng được.
 *
 * TỆP NÀY LÀM GÌ. Tách các CHẤM huyệt trên bản vẽ sơ đồ thành toạ độ pixel:
 *   · chấm ĐỎ  = huyệt đang được trình bày ở trang đó (sách tô đỏ đúng một huyệt);
 *   · chấm ĐEN = các huyệt khác vẽ kèm để đối chiếu (chính là phần giá trị nhất).
 * Không đoán nhãn — việc gán nhãn để cho người/agent nhìn ảnh làm, vì nhãn là chữ. Ở đây chỉ lo phần
 * máy làm chính xác hơn mắt: TOẠ ĐỘ và TỈ LỆ.
 *
 * DÙNG TỈ LỆ, KHÔNG DÙNG PIXEL TUYỆT ĐỐI. Mỗi ảnh một cỡ, một khung hình, nên số pixel tự nó vô
 * nghĩa. Đầu ra vì thế kèm sẵn phép chiếu lên đoạn thẳng nối hai chấm bất kỳ (t ∈ [0,1]) — đó là dạng
 * số duy nhất đối chiếu thẳng được với mesh.
 *
 * Dùng:  node do-anh-atlas.cjs TE4              tách chấm, in bảng toạ độ + tỉ lệ
 *        node do-anh-atlas.cjs TE4 --json       cho agent đọc
 *        node do-anh-atlas.cjs TE4 --luoi       in kèm lưới 10x10 để agent gán nhãn theo ô          */
const fs = require('fs');
const path = require('path');
const jpeg = require(path.join(__dirname, '../../node_modules/jpeg-js'));

const HINH = require('./focks-hinh-map.json');

/** gom pixel thoả điều kiện thành các cụm rời (loang theo 8 hướng, lưới thưa cho nhanh) */
function cum(diem, banKinh = 6) {
  const chua = new Set(), out = [];
  const key = p => p[0] + ',' + p[1];
  const map = new Map(); for (const p of diem) map.set(key(p), p);
  for (const p of diem) {
    if (chua.has(key(p))) continue;
    const hang = [p], c = []; chua.add(key(p));
    while (hang.length) {
      const q = hang.pop(); c.push(q);
      for (let dx = -banKinh; dx <= banKinh; dx++) for (let dy = -banKinh; dy <= banKinh; dy++) {
        const k = (q[0] + dx) + ',' + (q[1] + dy);
        if (map.has(k) && !chua.has(k)) { chua.add(k); hang.push(map.get(k)); }
      }
    }
    out.push(c);
  }
  return out;
}

function docAnh(tep) {
  const raw = jpeg.decode(fs.readFileSync(tep), { useTArray: true });
  return raw;   // { width, height, data: RGBA }
}

/* Chấm "đỏ" của sách thật ra có hai tông: ĐỎ thuần trên bản vẽ xương (TE4: 220,30,40) và HỒNG
 * MAGENTA trên các trang chi trên (TE12/TE13: ~235,20,140 — lam CAO). Điều kiện cũ đòi b<90 nên bỏ
 * sót hẳn tông hồng, và ba trang TE10/TE12/TE13 ra 0 chấm đỏ dù trang nào cũng phải có đúng một.
 * Nay chỉ đòi: đỏ mạnh, xanh lá thấp, và đỏ trội hơn xanh lá rõ rệt. Màu da người (230,180,160) bị
 * loại vì g cao; chữ tím watermark (150,140,200) bị loại vì r−g nhỏ. */
const laDo = (r, g, b) => r > 140 && g < 85 && (r - g) > 100 && (r - Math.min(g, b)) > 100;
/** chấm đen: cả ba kênh thấp và gần nhau (loại chữ đen bằng hình dạng ở bước sau) */
const laDen = (r, g, b) => r < 80 && g < 80 && b < 80 && Math.max(r, g, b) - Math.min(r, g, b) < 30;

function tachCham(anh, loai) {
  const { width: W, height: H, data } = anh;
  const diem = [];
  const test = loai === 'do' ? laDo : laDen;
  /* Quét màu ĐỎ ở độ phân giải ĐẦY ĐỦ. Pixel đỏ rất ít nên không tốn, mà bước 2 thì chấm đỏ trên bản
   * vẽ sơ đồ (nhỏ hơn chấm trên ảnh chụp) chỉ còn ~8 pixel và rơi khỏi ngưỡng — trang TE12 mất đúng
   * cái chấm quan trọng nhất. Màu đen thì giữ bước 2 vì nền chữ đen rất nhiều. */
  const buoc = loai === 'do' ? 1 : 2;
  for (let y = 0; y < H; y += buoc) for (let x = 0; x < W; x += buoc) {
    const i = (y * W + x) * 4;
    if (test(data[i], data[i + 1], data[i + 2])) diem.push([x, y]);
  }
  const cs = cum(diem, loai === 'do' ? 4 : 6);
  const out = [];
  for (const c of cs) {
    const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const n = c.length;
    /* CHẤM là hình tròn đặc: bề ngang xấp xỉ bề cao, và lấp gần kín khung bao. Chữ thì dài, rỗng và
     * hay dính nhau thành cụm rất to — bỏ bằng hai điều kiện này chứ đừng lọc theo kích thước một
     * chiều (nhãn "Ex-UE 9" cao đúng bằng chấm). */
    const vuong = w && h ? Math.min(w, h) / Math.max(w, h) : 0;
    const day = n * (buoc * buoc) / ((w + 1) * (h + 1));
    // Cùng một bộ lọc hình dạng cho cả hai màu: sách in nhãn "SJ 4" cũng bằng mực đỏ, nên nếu chỉ lọc
    // theo số pixel thì chữ lọt vào và cho ra 7 "chấm đỏ" trên một trang chỉ có 2.
    const nMin = loai === 'do' ? 28 : 10;         // bước 1 cho ra gấp ~4 lần số pixel
    const nMax = loai === 'do' ? 3600 : 900;
    if (n < nMin || n > nMax || vuong < 0.62 || day < 0.55 || w > 60) continue;
    let sr = 0, sg = 0, sb = 0;
    for (const q of c) { const i = (q[1] * W + q[0]) * 4; sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; }
    out.push({ x: Math.round(xs.reduce((a, v) => a + v, 0) / n), y: Math.round(ys.reduce((a, v) => a + v, 0) / n),
      n, w, h, mau: `rgb(${Math.round(sr / n)},${Math.round(sg / n)},${Math.round(sb / n)})` });
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

const codes = process.argv.slice(2).filter(a => !a.startsWith('--'));
const raJson = process.argv.includes('--json');
const luoi = process.argv.includes('--luoi');
if (!codes.length) { console.log('Dùng: node do-anh-atlas.cjs TE4 [--json] [--luoi]'); process.exit(1); }

const ketQua = {};
for (const code of codes) {
  const ds = HINH.huyet[code] || [];
  ketQua[code] = [];
  for (const a of ds) {
    const tep = path.join(HINH._thumuc, a.file);
    if (!fs.existsSync(tep)) { console.log(`${code}: thiếu tệp ${a.file}`); continue; }
    const anh = docAnh(tep);
    const do_ = tachCham(anh, 'do'), den = tachCham(anh, 'den');
    const r = { file: a.file, w: anh.width, h: anh.height, do: do_, den };
    ketQua[code].push(r);
    if (raJson) continue;
    console.log(`\n=== ${code} · ${a.file} · ${anh.width}×${anh.height} ===`);
    console.log(`chấm ĐỎ (huyệt của trang này): ${do_.length}`);
    for (const d of do_) console.log(`   pixel (${String(d.x).padStart(4)}, ${String(d.y).padStart(4)})  ø${d.w}×${d.h}  ${d.mau.padEnd(18)} → tỉ lệ (${(d.x / anh.width).toFixed(3)}, ${(d.y / anh.height).toFixed(3)})`);
    console.log(`chấm ĐEN (huyệt vẽ kèm để đối chiếu): ${den.length}`);
    for (const d of den) console.log(`   pixel (${String(d.x).padStart(4)}, ${String(d.y).padStart(4)})  ø${d.w}×${d.h}  → tỉ lệ (${(d.x / anh.width).toFixed(3)}, ${(d.y / anh.height).toFixed(3)})`);
    if (luoi) {
      console.log('\nLƯỚI để gán nhãn: chia ảnh thành 10×10 ô, ô A1 ở góc trên-trái.');
      const oCua = p => String.fromCharCode(65 + Math.min(9, Math.floor(p.x / anh.width * 10))) + (Math.min(9, Math.floor(p.y / anh.height * 10)) + 1);
      console.log('   đỏ : ' + do_.map(d => `${oCua(d)}(${d.x},${d.y})`).join(' '));
      console.log('   đen: ' + den.map(d => `${oCua(d)}(${d.x},${d.y})`).join(' '));
    }
  }
}
if (raJson) console.log(JSON.stringify(ketQua, null, 1));
