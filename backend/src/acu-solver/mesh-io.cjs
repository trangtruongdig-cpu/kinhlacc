/* mesh-io — ĐỌC HÌNH HỌC THẬT của mô hình Human Atlas ngay trong Node (không cần trình duyệt).
 *
 * Vì sao cần: quy tắc "huyệt nằm ở KHE giữa 2 mô" (xem tissue-rules.cjs) chỉ tính được khi biết
 * đám mây điểm THẬT của từng cơ / gân / xương. Trước đây chỉ frontend (three.js) đọc được file
 * .glb; file này bóc thẳng glTF nhị phân + giải nén EXT_meshopt_compression bằng chính decoder
 * vendor sẵn có, nên bake/đối chiếu chạy được offline.
 *
 * Toạ độ trả về ĐÃ CHUẨN-HOÁ chia chiều cao mesh (H = maxY của lớp da) — cùng hệ với model-frame.cjs:
 *   x > 0  = bên TRÁI của atlas (khớp quy ước `side: 1` trong model-frame — đã đối chiếu bằng
 *            xương quay/chày trái-phải và mốc WRIST/MALLEOLUS_MED, lệch < 0,003).
 *   y      = cao độ (0 = gan bàn chân, 1 = đỉnh đầu) · z > 0 = phía TRƯỚC.
 *
 * Dùng:  const atlas = await loadAtlas();  atlas.points('FMA22532')  → Float32Array [x,y,z, …]     */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const GLB = path.join(ROOT, 'frontend/public/kinhmach3d/models/body-layers-v2.glb');
const IDX_JS = path.join(ROOT, 'frontend/public/kinhmach3d/data/human-atlas-index.js');
const VI_JS = path.join(ROOT, 'frontend/public/kinhmach3d/data/human-atlas-vi.js');
const DECODER_JS = path.join(ROOT, 'frontend/public/kinhmach3d/vendor/meshopt_decoder.js');

// vendor decoder là UMD nhưng frontend/package.json khai "type":"module" → require() sẽ hiểu nhầm
// là ESM. Nạp bằng new Function để ép ngữ cảnh CommonJS.
function loadDecoder() {
  const mod = { exports: {} };
  new Function('module', 'exports', 'self', 'define', fs.readFileSync(DECODER_JS, 'utf8'))(mod, mod.exports, undefined, undefined);
  return mod.exports;
}
// 2 file data của frontend cũng là script gán vào window
function loadWindowScript(file, key) {
  const w = {};
  new Function('window', fs.readFileSync(file, 'utf8'))(w);
  return w[key];
}

const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

let CACHE = null;

async function loadAtlas(opts = {}) {
  const layers = opts.layers || ['bone', 'muscle', 'connective', 'skin'];
  if (CACHE && layers.every(l => CACHE.layersLoaded.includes(l))) return CACHE;

  const Meshopt = loadDecoder();
  await Meshopt.ready;

  const buf = fs.readFileSync(GLB);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  const binOff = 20 + jsonLen + 8;

  const bvCache = new Map();
  function bufferView(i) {
    if (bvCache.has(i)) return bvCache.get(i);
    const bv = gltf.bufferViews[i];
    const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
    let out;
    if (!ext) {
      out = new Uint8Array(buf.buffer, buf.byteOffset + binOff + (bv.byteOffset || 0), bv.byteLength);
    } else {
      const src = new Uint8Array(buf.buffer, buf.byteOffset + binOff + (ext.byteOffset || 0), ext.byteLength);
      out = new Uint8Array(ext.count * ext.byteStride);
      Meshopt.decodeGltfBuffer(out, ext.count, ext.byteStride, src, ext.mode, ext.filter);
    }
    bvCache.set(i, out);
    return out;
  }
  function accessor(ai) {
    const a = gltf.accessors[ai];
    const bytes = bufferView(a.bufferView);
    const bv = gltf.bufferViews[a.bufferView];
    const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
    const stride = ext ? ext.byteStride : (bv.byteStride || 0);
    const Type = CT[a.componentType], n = NCOMP[a.type], elem = Type.BYTES_PER_ELEMENT * n;
    const st = stride || elem, off = a.byteOffset || 0;
    const start = bytes.byteOffset + off;
    if (st === elem && start % Type.BYTES_PER_ELEMENT === 0) return new Type(bytes.buffer, start, a.count * n);
    const out = new Type(a.count * n), dv = new DataView(bytes.buffer, bytes.byteOffset);
    const rd = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
    for (let i = 0; i < a.count; i++) for (let c = 0; c < n; c++) out[i * n + c] = dv[rd](off + i * st + c * Type.BYTES_PER_ELEMENT, true);
    return out;
  }

  const IDX = loadWindowScript(IDX_JS, 'HUMAN_ATLAS_INDEX');
  const VI = loadWindowScript(VI_JS, 'HUMAN_ATLAS_VI').concepts;

  // chiều cao chuẩn-hoá lấy từ lớp da (khớp cách model-frame-v2 đã calibrate)
  const H = IDX.skin[0].bounds[1][1];

  // gom đỉnh theo conceptId cho từng lớp yêu cầu
  const clouds = new Map();     // conceptId -> { layer, xyz: Float32Array }
  const meta = [];              // { conceptId, layer, en, vi, n }
  // LƯỚI NGUYÊN của từng lớp (đỉnh + tam giác) — cần cho đường TRẮC ĐỊA trên mặt da (surface-path.cjs).
  // Đám mây điểm theo conceptId ở trên đã đánh mất quan hệ láng giềng; muốn đi đường ngắn nhất TRÊN
  // mặt cong thì phải có cạnh, mà cạnh chỉ suy được từ chỉ số tam giác.
  const meshes = new Map();     // layerName -> { xyz: Float32Array (đã chuẩn-hoá), idx, part }
  for (const layerName of layers) {
    const node = gltf.nodes.find(n => n.name === layerName);
    if (!node) continue;
    const prim = gltf.meshes[node.mesh].primitives[0];
    const pos = accessor(prim.attributes.POSITION);
    const part = accessor(prim.attributes._PARTINDEX);
    {
      const xyz = new Float32Array(pos.length);
      for (let i = 0; i < pos.length; i++) xyz[i] = pos[i] / H;
      meshes.set(layerName, { xyz, idx: prim.indices != null ? accessor(prim.indices) : null, part });
    }
    const entries = IDX[layerName] || [];
    // đếm trước để cấp phát đúng cỡ (nhanh hơn push vào mảng js)
    const count = new Int32Array(entries.length);
    for (let i = 0; i < part.length; i++) { const p = part[i] | 0; if (p >= 0 && p < count.length) count[p]++; }
    const bufs = entries.map((e, k) => new Float32Array(count[k] * 3));
    const fill = new Int32Array(entries.length);
    for (let i = 0; i < part.length; i++) {
      const p = part[i] | 0; if (p < 0 || p >= bufs.length) continue;
      const o = fill[p]++ * 3, b = bufs[p];
      b[o] = pos[i * 3] / H; b[o + 1] = pos[i * 3 + 1] / H; b[o + 2] = pos[i * 3 + 2] / H;
    }
    entries.forEach((e, k) => {
      if (!count[k]) return;
      // khung bao (đã chuẩn-hoá) — probe an toàn dùng nó để loại nhanh khối ở xa, khỏi quét cả triệu đỉnh
      const bb = [[e.bounds[0][0] / H, e.bounds[0][1] / H, e.bounds[0][2] / H], [e.bounds[1][0] / H, e.bounds[1][1] / H, e.bounds[1][2] / H]];
      const prev = clouds.get(e.conceptId);
      // atlas có thể tách 1 khái niệm thành nhiều part rời (vd cung gân) → nối lại
      if (prev) {
        const merged = new Float32Array(prev.xyz.length + bufs[k].length);
        merged.set(prev.xyz); merged.set(bufs[k], prev.xyz.length);
        prev.xyz = merged;
        for (let d = 0; d < 3; d++) { prev.bb[0][d] = Math.min(prev.bb[0][d], bb[0][d]); prev.bb[1][d] = Math.max(prev.bb[1][d], bb[1][d]); }
      } else {
        const rec = { layer: layerName, xyz: bufs[k], bb };
        clouds.set(e.conceptId, rec);
        const t = VI[e.conceptId] || [];
        meta.push({ conceptId: e.conceptId, layer: layerName, vi: t[0] || '', en: t[1] || '', n: count[k], bb: rec.bb });
      }
    });
  }

  CACHE = {
    H,
    layersLoaded: layers,
    concepts: meta,
    /** Đám mây điểm (đã chuẩn-hoá) của 1 khái niệm atlas — null nếu khái niệm không có hình học. */
    points(conceptId) { const c = clouds.get(conceptId); return c ? c.xyz : null; },
    layerOf(conceptId) { const c = clouds.get(conceptId); return c ? c.layer : null; },
    boundsOf(conceptId) { const c = clouds.get(conceptId); return c ? c.bb : null; },
    nameOf(conceptId) { const t = VI[conceptId] || []; return { vi: t[0] || '', en: t[1] || '' }; },
    /** Lưới NGUYÊN của một lớp: { xyz (chuẩn-hoá), idx (tam giác), part (conceptId-index mỗi đỉnh) }.
     *  Dùng cho đường trắc địa; null nếu lớp không được nạp. */
    mesh(layerName) { return meshes.get(layerName) || null; },
    /** Tìm khái niệm theo tên (regex khớp tên Anh HOẶC tên Việt đã rà). */
    search(re, layerFilter) {
      return meta.filter(m => (!layerFilter || m.layer === layerFilter) && (re.test(m.en) || re.test(m.vi)));
    },
  };
  return CACHE;
}

module.exports = { loadAtlas, GLB };

// ----- CLI: node mesh-io.cjs "regex tên"  → liệt kê khái niệm khớp + khung bao -----
if (require.main === module) {
  (async () => {
    const atlas = await loadAtlas({ layers: ['bone', 'muscle', 'connective', 'skin', 'arterial', 'nervous'] });
    const q = process.argv[2];
    if (!q) { console.log(`Đã nạp ${atlas.concepts.length} khái niệm có hình học. H=${atlas.H.toFixed(4)}`); return; }
    const hits = atlas.search(new RegExp(q, 'i'));
    console.log(`${hits.length} khái niệm khớp /${q}/i:`);
    for (const h of hits.slice(0, 40)) {
      const p = atlas.points(h.conceptId);
      let mnx = 9, mxx = -9, mny = 9, mxy = -9, mnz = 9, mxz = -9;
      for (let i = 0; i < p.length; i += 3) {
        if (p[i] < mnx) mnx = p[i]; if (p[i] > mxx) mxx = p[i];
        if (p[i + 1] < mny) mny = p[i + 1]; if (p[i + 1] > mxy) mxy = p[i + 1];
        if (p[i + 2] < mnz) mnz = p[i + 2]; if (p[i + 2] > mxz) mxz = p[i + 2];
      }
      console.log(`  ${h.conceptId.padEnd(10)} ${h.layer.padEnd(10)} ${(h.en || '').padEnd(42)} ${h.vi.padEnd(34)} n=${String(h.n).padStart(6)}  x[${mnx.toFixed(3)},${mxx.toFixed(3)}] y[${mny.toFixed(3)},${mxy.toFixed(3)}] z[${mnz.toFixed(3)},${mxz.toFixed(3)}]`);
    }
  })();
}
