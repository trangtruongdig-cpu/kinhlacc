/*
 * One-off: rasterize the brand leaf (public/favicon.svg) into a PNG-based
 * favicon.ico (16/32/48) so legacy /favicon.ico requests show the leaf
 * instead of the leftover Vue default. Pure Node (zlib only) — no native deps.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'public', 'favicon.ico');

// Leaf path transcribed from public/favicon.svg (64x64 viewBox)
const cmds = [
  ['M', 48, 12],
  ['C', 26, 12, 14, 26, 14, 44],
  ['c', 0, 4, 1, 7, 2, 9],
  ['c', 2, -15, 12, -26, 26, -31],
  ['c', -9, 7, -15, 16, -18, 28],
  ['c', 14, 1, 26, -7, 30, -20],
  ['c', 3, -11, -2, -18, -6, -18],
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

const leaf = flatten(cmds);

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// Rounded-rect (rx=14) mask on the 64-unit canvas
function inRoundedRect(x, y, w, h, r) {
  if (x < 0 || y < 0 || x > w || y > h) return false;
  if ((x >= r && x <= w - r) || (y >= r && y <= h - r)) return true;
  const cx = x < r ? r : w - r;
  const cy = y < r ? r : h - r;
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function lerp(a, b, t) { return a + (b - a) * t; }

const G0 = [0x34, 0xd3, 0x99]; // gradient start
const G1 = [0x15, 0x80, 0x3d]; // gradient end
const BG = [0xec, 0xfd, 0xf5]; // mint card

function renderRGBA(size) {
  const SS = 4;
  const scale = 64 / (size * SS);
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let oy = 0; oy < SS; oy++) {
        for (let ox = 0; ox < SS; ox++) {
          const ux = (px * SS + ox + 0.5) * scale;
          const uy = (py * SS + oy + 0.5) * scale;
          if (!inRoundedRect(ux, uy, 64, 64, 14)) continue;
          a += 255;
          if (pointInPoly(ux, uy, leaf)) {
            const t = Math.min(1, Math.max(0, (ux / 64 + uy / 64) / 2));
            r += lerp(G0[0], G1[0], t); g += lerp(G0[1], G1[1], t); b += lerp(G0[2], G1[2], t);
          } else {
            r += BG[0]; g += BG[1]; b += BG[2];
          }
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = Math.round(a / n);
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
