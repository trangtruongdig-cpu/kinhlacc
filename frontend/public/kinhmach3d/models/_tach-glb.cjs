/* _tach-glb — TÁCH body-layers-v2.glb THÀNH HAI TỆP để trang hiện hình sớm.
 *
 * VÌ SAO. Engine tải trọn 22,4MB rồi mới vẽ được gì, nên người dùng nhìn vòng xoay ~25 giây. Nhưng
 * cảnh mặc định chỉ cần DA và XƯƠNG; 13 lớp còn lại (cơ, mạch, thần kinh, tạng…) chỉ hiện khi bấm
 * panel Hệ Cơ Quan hoặc kéo thanh Bóc Tách. Tách ra thì phần phải chờ còn 7,9MB.
 *
 * GLB đã nén EXT_meshopt_compression nên gzip chỉ bớt 10% — không có đường nào khác ngoài tách.
 *
 * CÁCH LÀM. Giữ nguyên byte đã nén: chỉ chọn lại nodes/meshes/accessors/bufferViews cần thiết rồi
 * chép đúng lát byte của chúng sang buffer mới, cập nhật byteOffset. KHÔNG giải nén, KHÔNG dựng lại
 * hình học — nên chất lượng y hệt bản gốc.
 *
 * Dùng:  node _tach-glb.cjs                                                                        */
const fs = require('fs');
const path = require('path');

const GOC = path.join(__dirname, 'body-layers-v2.glb');
const LOP_COT = ['skin', 'bone', 'muscle'];   // cảnh mặc định bật cơ+xương (MAC_DINH_BAT trong map3d.js), da cần cho việc bắn tia đặt huyệt

const b = fs.readFileSync(GOC);
const jsonLen = b.readUInt32LE(12);
const J = JSON.parse(b.slice(20, 20 + jsonLen).toString('utf8'));
const binOff = 20 + jsonLen + 8;                       // 8 = header của chunk BIN
const BIN = b.slice(binOff);

function tach(tenLop, dich) {
  const nodes = J.nodes.filter(n => tenLop.includes(n.name));
  const meshIdx = [...new Set(nodes.map(n => n.mesh))];
  const accIdx = new Set();
  for (const mi of meshIdx) for (const p of J.meshes[mi].primitives) {
    for (const k in p.attributes) accIdx.add(p.attributes[k]);
    if (p.indices != null) accIdx.add(p.indices);
  }
  const bvIdx = [...new Set([...accIdx].map(i => J.accessors[i].bufferView).filter(i => i != null))];

  // chép byte của từng bufferView sang buffer mới, ghi lại offset mới
  const mieng = [], bvMoi = [], bvMap = new Map();
  let off = 0;
  for (const i of bvIdx) {
    const v = J.bufferViews[i];
    const mo = v.extensions && v.extensions.EXT_meshopt_compression;
    const nguon = mo ? mo : v;                          // byte thật nằm ở phần nén nếu có
    const lat = BIN.slice(nguon.byteOffset || 0, (nguon.byteOffset || 0) + nguon.byteLength);
    mieng.push(lat);
    const w = JSON.parse(JSON.stringify(v));
    if (mo) { w.extensions.EXT_meshopt_compression.byteOffset = off; w.byteOffset = 0; }
    else w.byteOffset = off;
    w.buffer = 0;
    bvMap.set(i, bvMoi.length);
    bvMoi.push(w);
    off += lat.length;
    while (off % 4) { mieng.push(Buffer.alloc(1)); off++; }   // glTF đòi căn 4 byte
  }

  const accMoi = [], accMap = new Map();
  for (const i of [...accIdx].sort((x, y) => x - y)) {
    const a = JSON.parse(JSON.stringify(J.accessors[i]));
    if (a.bufferView != null) a.bufferView = bvMap.get(a.bufferView);
    accMap.set(i, accMoi.length);
    accMoi.push(a);
  }
  const meshMoi = [], meshMap = new Map();
  for (const mi of meshIdx) {
    const m = JSON.parse(JSON.stringify(J.meshes[mi]));
    for (const p of m.primitives) {
      for (const k in p.attributes) p.attributes[k] = accMap.get(p.attributes[k]);
      if (p.indices != null) p.indices = accMap.get(p.indices);
      delete p.material;                                 // vật liệu do engine tự đặt
    }
    meshMap.set(mi, meshMoi.length);
    meshMoi.push(m);
  }
  const nodeMoi = nodes.map(n => { const q = JSON.parse(JSON.stringify(n)); q.mesh = meshMap.get(n.mesh); delete q.children; return q; });

  const bin = Buffer.concat(mieng);
  const jm = {
    asset: J.asset,
    extensionsUsed: J.extensionsUsed,
    extensionsRequired: J.extensionsRequired,
    scene: 0,
    scenes: [{ nodes: nodeMoi.map((_, i) => i) }],
    nodes: nodeMoi, meshes: meshMoi, accessors: accMoi, bufferViews: bvMoi,
    buffers: [{ byteLength: bin.length }],
  };
  let js = Buffer.from(JSON.stringify(jm), 'utf8');
  while (js.length % 4) js = Buffer.concat([js, Buffer.from(' ')]);

  const head = Buffer.alloc(12);
  head.write('glTF', 0); head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const cj = Buffer.alloc(8); cj.writeUInt32LE(js.length, 0); cj.write('JSON', 4);
  const cb = Buffer.alloc(8); cb.writeUInt32LE(bin.length, 0); cb.write('BIN\0', 4);
  const ra = Buffer.concat([head, cj, js, cb, bin]);
  fs.writeFileSync(path.join(__dirname, dich), ra);
  return { tep: dich, mb: ra.length / 1024 / 1024, nodes: nodeMoi.map(n => n.name) };
}

const conLai = J.nodes.map(n => n.name).filter(n => !LOP_COT.includes(n));
const a = tach(LOP_COT, 'body-core.glb');
const c = tach(conLai, 'body-rest.glb');
console.log(`gốc        ${(b.length / 1024 / 1024).toFixed(1)}MB · ${J.nodes.length} lớp`);
console.log(`core       ${a.mb.toFixed(1)}MB · ${a.nodes.join(', ')}`);
console.log(`rest       ${c.mb.toFixed(1)}MB · ${c.nodes.length} lớp`);
console.log(`→ phải chờ ${a.mb.toFixed(1)}MB thay vì ${(b.length / 1024 / 1024).toFixed(1)}MB (${(100 - a.mb / (b.length / 1024 / 1024) * 100).toFixed(0)}% ít hơn)`);
