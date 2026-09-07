/* render-doi-chieu — CHỤP dữ liệu 3D hiện tại thành ảnh 2D CÙNG GÓC NHÌN với đồ hình kinh chính
 * (frontend/public/kinhmach3d/images/meridians/kinh-NN-chinh.jpg) để đặt cạnh nhau mà soi bằng mắt.
 *
 * Vì sao cần: các chỉ số nội bộ (quãng rải, lệch đường) chỉ đo được sự XÁO TRỘN, không phán xử được
 * ĐÚNG–SAI so với mốc sách. Muốn biết đường kinh có đi đúng đồ hình không thì phải nhìn cùng một góc.
 *
 * Dùng:  node render-doi-chieu.cjs LU [--view=front|back|left|right] [--all] [--zoom=dau|co|nguc|bung|
 *        canh-tay|ban-tay|dui|cang-chan|ban-chan] [--crop=x0,y0,x1,y1]   (x,y = toạ độ chuẩn-hoá)   */
const fs = require('fs');
const path = require('path');
const { PNG } = require(path.join(__dirname, '../../node_modules/pngjs'));
const { loadSkin } = require('./skin-clamp.cjs');

const ROOT = path.resolve(__dirname, '../../..');
const COORDS = path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js');
const PATHS = path.join(ROOT, 'frontend/public/kinhmach3d/data/meridian-paths.js');
const OUTDIR = process.env.OUTDIR || '/private/tmp/claude-501/-Users-truongtrang-Desktop-kinhlacc/302b7e24-9e7c-4cbd-9935-670351b1eb8d/scratchpad/render';

// góc nhìn mặc định — khớp với góc mà đồ hình kinh chính vẽ
const VIEW = { LU: 'front', LI: 'front', ST: 'front', SP: 'front', HT: 'front', SI: 'back',
  BL: 'back', KI: 'front', PC: 'front', TE: 'back', GB: 'left', LR: 'front', CV: 'front', GV: 'back' };

/* ---- chiếu trực giao ---------------------------------------------------------------------------
 * hệ mesh: x>0 = bên TRÁI người · y = cao độ (0 gan bàn chân → 1 đỉnh đầu) · z>0 = phía TRƯỚC.
 * nhìn TRƯỚC  : mặt đối mặt → tay trái người nằm bên PHẢI ảnh ⇒ sx = +x
 * nhìn SAU    : sx = -x
 * nhìn TRÁI   : đứng bên trái người → mặt người quay sang TRÁI ảnh ⇒ sx = -z
 * nhìn PHẢI   : sx = +z                                                                            */
const PROJ = {
  front: p => [p[0], p[1], p[2]],
  back:  p => [-p[0], p[1], -p[2]],
  left:  p => [-p[2], p[1], p[0]],
  right: p => [p[2], p[1], -p[0]],
};

let W = 620, H = 1180; const PAD = 30, LONG = 1150;

/* VÙNG PHÓNG TO — [x0,x1,y0,y1] trong toạ độ CHUẨN-HOÁ (y: 0 gan bàn chân → 1 đỉnh đầu; x: ngang) */
const ZOOM = {
  dau:        [-0.13, 0.13, 0.845, 1.005],
  co:         [-0.16, 0.16, 0.780, 0.900],
  nguc:       [-0.24, 0.24, 0.660, 0.830],
  bung:       [-0.20, 0.20, 0.560, 0.700],
  'canh-tay': [-0.46, 0.46, 0.560, 0.820],
  'ban-tay':  [-0.46, 0.46, 0.430, 0.580],
  dui:        [-0.22, 0.22, 0.330, 0.560],
  'cang-chan':[-0.20, 0.20, 0.100, 0.360],
  'ban-chan': [-0.20, 0.20, 0.000, 0.100],
  than:       [-0.30, 0.30, 0.520, 0.900],
};

// phông chữ 5x7 tối giản, đủ cho số + vài chữ
const GLYPH = {
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11111','00010','00100','00010','00001','10001','01110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','11110','00001','00001','10001','01110'],
  '6': ['00110','01000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00010','01100'],
  '.': ['00000','00000','00000','00000','00000','01100','01100'],
  '-': ['00000','00000','00000','11111','00000','00000','00000'],
};
for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!GLYPH[c]) GLYPH[c] = null;
const LETTER = {
  A:['01110','10001','10001','11111','10001','10001','10001'], B:['11110','10001','11110','10001','10001','10001','11110'],
  C:['01110','10001','10000','10000','10000','10001','01110'], D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','11110','10000','10000','10000','11111'], F:['11111','10000','11110','10000','10000','10000','10000'],
  G:['01110','10001','10000','10111','10001','10001','01111'], H:['10001','10001','11111','10001','10001','10001','10001'],
  I:['01110','00100','00100','00100','00100','00100','01110'], K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'], N:['10001','11001','10101','10011','10001','10001','10001'],
  P:['11110','10001','10001','11110','10000','10000','10000'], R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'], T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'], V:['10001','10001','10001','10001','10001','01010','00100'],
};
Object.assign(GLYPH, LETTER);

function mkImg() {
  const png = new PNG({ width: W, height: H });
  png.data.fill(255);
  return png;
}
function px(png, x, y, r, g, b, a = 1) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  const d = png.data;
  d[i] = d[i] * (1 - a) + r * a; d[i + 1] = d[i + 1] * (1 - a) + g * a; d[i + 2] = d[i + 2] * (1 - a) + b * a; d[i + 3] = 255;
}
function disc(png, x, y, rad, r, g, b, a = 1) {
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++)
    if (dx * dx + dy * dy <= rad * rad) px(png, x + dx, y + dy, r, g, b, a);
}
function line(png, x0, y0, x1, y1, r, g, b, wdt = 1, a = 1) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    disc(png, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, wdt, r, g, b, a);
  }
}
function text(png, x, y, s, r, g, b, scale = 1) {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const gl = GLYPH[ch];
    if (ch === ' ') { cx += 4 * scale; continue; }
    if (!gl) { cx += 6 * scale; continue; }
    for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++)
      if (gl[row][col] === '1')
        for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++)
          px(png, cx + col * scale + sx, y + row * scale + sy, r, g, b);
    cx += 6 * scale;
  }
  return cx;
}

async function main() {
  const args = process.argv.slice(2);
  const w1 = {}; new Function('window', fs.readFileSync(COORDS, 'utf8'))(w1);
  const P = w1.ACU_COORDS3D.points;
  const w2 = {}; new Function('window', fs.readFileSync(PATHS, 'utf8'))(w2);
  const MP = w2.MERIDIAN_PATHS.mer;

  const list = args.includes('--all') ? Object.keys(VIEW) : args.filter(a => !a.startsWith('--'));
  const viewArg = (args.find(a => a.startsWith('--view=')) || '').split('=')[1];

  const skin = await loadSkin();
  fs.mkdirSync(OUTDIR, { recursive: true });

  for (const mer of list) {
    const view = viewArg || VIEW[mer] || 'front';
    const pr = PROJ[view];
    // khung ảnh: mặc định lấy TOÀN THÂN (mọi kinh cùng tỉ lệ); có --zoom/--crop thì cắt vùng
    let box = null;
    const zoomArg = (args.find(a => a.startsWith('--zoom=')) || '').split('=')[1];
    const cropArg = (args.find(a => a.startsWith('--crop=')) || '').split('=')[1];
    if (cropArg) { const v = cropArg.split(',').map(Number); box = [v[0], v[2], v[1], v[3]]; }
    else if (zoomArg) box = ZOOM[zoomArg];
    let S, CX, CY;
    if (box) {
      const [x0, x1, y0, y1] = box;
      S = LONG / Math.max(x1 - x0, y1 - y0);              // khung ảnh CO THEO vùng cắt, khỏi thừa nền
      W = Math.round((x1 - x0) * S) + 2 * PAD;
      H = Math.round((y1 - y0) * S) + 2 * PAD;
      CX = W / 2 - ((x0 + x1) / 2) * S;
      CY = H / 2 + ((y0 + y1) / 2) * S;
    } else { W = 620; H = 1180; S = (H - 2 * PAD) / 1.0; CX = W / 2; CY = H - PAD; }
    const toPx = p => { const q = pr(p); return [CX + q[0] * S, CY - q[1] * S, q[2]]; };
    const tenAnh = `${mer}-${view}${zoomArg ? '-' + zoomArg : (cropArg ? '-crop' : '')}`;

    const png = mkImg();
    // 1) bóng người: đám mây đỉnh da, đậm nhạt theo chiều sâu
    for (let i = 0; i < skin.length; i += 3) {
      const [sx, sy, d] = toPx([skin[i], skin[i + 1], skin[i + 2]]);
      const t = Math.max(0, Math.min(1, (d + 0.16) / 0.32));         // gần hơn = sáng hơn
      const v = 205 - 55 * t;
      if (S > 2000) disc(png, sx, sy, S > 5000 ? 3 : 2, v, v, v, 0.30); else px(png, sx, sy, v, v, v, 0.5);
    }
    // 2) đường kinh
    const m = MP[mer];
    if (m) for (const doan of m.doan) {
      const pts = doan.pts.map(toPx);
      for (let i = 1; i < pts.length; i++) {
        const front = (pts[i][2] + pts[i - 1][2]) / 2 > 0;
        const chim = doan.mo === 'chim';
        if (chim && (i % 8) > 3) continue;                            // nét đứt cho đoạn đi sâu
        if (front) line(png, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 20, 40, 200, 2, 1);
        else line(png, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 120, 140, 220, 1, 0.55);
      }
    }
    // 3) huyệt + số
    const codes = Object.keys(P).filter(c => c.startsWith(mer) && /^\d+$/.test(c.slice(mer.length)))
      .sort((a, b) => +a.slice(mer.length) - +b.slice(mer.length));
    for (const c of codes) {
      const p = P[c];
      if (p.x === undefined) continue;
      const [sx, sy, d] = toPx([p.x, p.y, p.z]);
      const front = d > 0;
      const rad = box ? 6 : 4;
      disc(png, sx, sy, rad, 255, 255, 255);
      disc(png, sx, sy, rad - 1, front ? 200 : 235, front ? 20 : 120, front ? 40 : 130);
      const num = c.slice(mer.length);
      const sc = box ? 2 : 1;
      const lx = sx + (sx > W / 2 ? 7 : -7 - num.length * 6 * sc);
      text(png, lx, sy - 3, num, 120, 0, 0, box ? 2 : 1);
    }
    text(png, 10, 10, tenAnh.replace(/-/g, ' '), 0, 0, 0, 2);
    const out = path.join(OUTDIR, `${tenAnh}.png`);
    fs.writeFileSync(out, PNG.sync.write(png));
    console.log('→', out, `(${codes.length} huyệt, ${m ? m.doan.length : 0} đoạn)`);
  }
}
main();
