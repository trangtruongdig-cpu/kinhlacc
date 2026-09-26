/*
 * Sinh public/favicon.ico từ LOGO QUY ĐỊNH — chính là hình trong public/favicon.svg
 * và trong ba component Vue (PublicTopBar / LandingView / SiteFooter):
 * vòng viền #cfad78 + lá/giọt #8a5e28 + chấm trắng giữa.
 *
 * Bản trước của tệp này vẽ một chiếc LÁ XANH trên thẻ bo góc màu mint — không hề
 * khớp favicon.svg dù comment cũ nói là "transcribed from" nó, và lạc hẳn khỏi bảng
 * màu nâu/kem của thương hiệu. Chạy lại tệp này là sửa được.
 *
 * Thuần Node (chỉ zlib) — không cần thư viện native.
 *   node frontend/scripts/gen-favicon-ico.cjs
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'public', 'favicon.ico');

// Path lá/giọt chép nguyên từ public/favicon.svg (viewBox 64x64).
const cmds = [
  ['M', 32, 12],
  ['C', 32, 12, 20, 22, 20, 32],
  ['C', 20, 38.627, 25.373, 44, 32, 44],
  ['C', 38.627, 44, 44, 38.627, 44, 32],
  ['C', 44, 22, 32, 12, 32, 12],
  ['z'],
];

function flatten(cmds, steps = 40) {
  const pts = [];
  let cx = 0, cy = 0, sx = 0, sy = 0;
  const bez = (p0, p1, p2, p3) => {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
      pts.push([x, y]);
    }
  };
  for (const c of cmds) {
    const op = c[0];
    if (op === 'M') { cx = c[1]; cy = c[2]; sx = cx; sy = cy; pts.push([cx, cy]); }
    else if (op === 'C') { bez([cx, cy], [c[1], c[2]], [c[3], c[4]], [c[5], c[6]]); cx = c[5]; cy = c[6]; }
    else if (op === 'c') { bez([cx, cy], [cx + c[1], cy + c[2]], [cx + c[3], cy + c[4]], [cx + c[5], cy + c[6]]); cx += c[5]; cy += c[6]; }
    else if (op === 'z') { pts.push([sx, sy]); }
  }
  return pts;
}


function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function mix(dst, src, a) {
  dst[0] = lerp(dst[0], src[0], a);
  dst[1] = lerp(dst[1], src[1], a);
  dst[2] = lerp(dst[2], src[2], a);
  dst[3] = dst[3] + (255 - dst[3]) * a;
}

const VIEN = [0xcf, 0xad, 0x78]; // --brown-300, vòng ngoài
const THAN = [0x8a, 0x5e, 0x28]; // --brown-600, lá/giọt
const TAM = [0xff, 0xff, 0xff]; // chấm giữa

// Vòng ngoài của SVG là r=30 stroke-width=2, tức vành 29..31 — ở 16px vành ấy chỉ dày
// nửa điểm ảnh nên biến mất. Ta nới vành ra cho đủ MỘT điểm ảnh ở mọi cỡ; hình
// giữ nguyên, chỉ nét đậm lên — đúng cách favicon vẫn làm.
function renderRGBA(size) {
  const SS = 4;
  const scale = 64 / (size * SS);
  const donVi = 64 / size; // một điểm ảnh đích bằng bao nhiêu đơn vị canvas
  const nuaVanh = Math.max(1, donVi * 0.5); // nửa độ dày vành
  const buf = Buffer.alloc(size * size * 4);
  const la = flatten(cmds, 64);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let oy = 0; oy < SS; oy++) {
        for (let ox = 0; ox < SS; ox++) {
          const ux = (px * SS + ox + 0.5) * scale;
          const uy = (py * SS + oy + 0.5) * scale;
          const d = Math.hypot(ux - 32, uy - 32);
          const px4 = [0, 0, 0, 0];

          if (Math.abs(d - 30) <= nuaVanh) mix(px4, VIEN, 1);
          if (pointInPoly(ux, uy, la)) mix(px4, THAN, 1);
          if (d <= 4) mix(px4, TAM, 1);

          r += px4[0] * (px4[3] / 255);
          g += px4[1] * (px4[3] / 255);
          b += px4[2] * (px4[3] / 255);
          a += px4[3];
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      const alpha = a / n;
      // Trả về màu không nhân alpha (PNG lưu straight alpha).
      buf[i] = alpha > 0 ? Math.round((r / n) * 255 / alpha) : 0;
      buf[i + 1] = alpha > 0 ? Math.round((g / n) * 255 / alpha) : 0;
      buf[i + 2] = alpha > 0 ? Math.round((b / n) * 255 / alpha) : 0;
      buf[i + 3] = Math.round(alpha);
    }
  }
  return buf;
}

// Minimal PNG encoder (RGBA)
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function buildICO(sizes) {
  const pngs = sizes.map((s) => encodePNG(renderRGBA(s), s));
  const count = sizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  sizes.forEach((s, i) => {
    const e = dir.subarray(i * 16, i * 16 + 16);
    e[0] = s >= 256 ? 0 : s; e[1] = s >= 256 ? 0 : s;
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(offset, 12);
    offset += pngs[i].length;
  });
  return Buffer.concat([header, dir, ...pngs]);
}

fs.writeFileSync(OUT, buildICO([16, 32, 48]));
console.log('Wrote', OUT, fs.statSync(OUT).size, 'bytes');
