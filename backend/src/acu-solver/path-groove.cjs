/* path-groove — BƯỚC 3 của mô hình ĐƯỜNG KINH: kéo đường vào RÃNH cơ–xương.
 *
 * Bước 2 cho ra đường ngắn nhất trên mặt da giữa các nút. Ngắn nhất KHÔNG phải đường kinh: kinh Phế
 * đi theo bờ ngoài cơ nhị đầu chứ không cắt qua hõm nách cho gần; kinh Vị đi ngoài mào chày chứ không
 * đi giữa ống chân. Bước này lấy đúng câu mô tả rãnh đã khai trong `meridian-nodes.cjs` (trường `ranh`)
 * và kéo từng điểm của đường vào rãnh đó.
 *
 * DÙNG LẠI NGUYÊN TẦNG 4, KHÔNG VIẾT LẠI HÌNH HỌC
 * `interface-solver.refineByTissue()` vốn làm đúng việc này cho MỘT huyệt: đọc mô tả mô, dựng đám mây
 * điểm của từng mô trong atlas, tìm khe hoặc bờ trong lát cắt ngang, chiếu ra da, và kiểm ba điều cấm
 * (không vào lòng xương / không giữa bụng cơ / không trên lòng mạch). Ở đây gọi nó cho TỪNG ĐIỂM của
 * đường, với `vitri` là câu `ranh` của đoạn. Mọi ngưỡng an toàn của tầng 4 vì thế còn nguyên hiệu lực:
 * trượt tối đa 2,5 thốn (khe hai mô) / 1,5 thốn (sát bờ), trần tuyệt đối 3,1cm.
 *
 * BA LUẬT RIÊNG CỦA BƯỚC NÀY
 *  1. NÚT BẤT ĐỘNG. Hai đầu đoạn là nút đã duyệt — rãnh không được kéo đường rời khỏi chúng. Lực kéo
 *     vuốt về 0 ở hai đầu (hàm smoothstep trên 18% đầu và cuối), nên đường vẫn xuyên đúng qua nút.
 *  2. KHÔNG ĐỔI CAO ĐỘ. Kế thừa nguyên tắc của tầng 4: cốt độ giữ y, rãnh chỉ sửa mặt cắt (x, z).
 *  3. VỀ LẠI MẶT DA. Sau khi kéo và làm trơn, mọi điểm được dán lại vào đỉnh da gần nhất — bất biến
 *     "đường luôn nằm trên người" của bước 2 không được phép mất.
 *
 * ĐOẠN KHÔNG CÓ RÃNH thì giữ nguyên đường bước 2, không đoán. Phần lớn là đường giữa (Nhâm, Đốc) và
 * các đoạn trên sọ — chúng đi theo quy tắc HÌNH HỌC (đường giữa, cung sọ, cách đường giữa N thốn),
 * không theo rãnh mô, nên không có gì để kéo.                                                        */
const { refineByTissue } = require('./interface-solver.cjs');
const { parseTissue } = require('./parse-tissue.cjs');

const CM = 171.9;
const TAPER = 0.18;        // tỉ lệ đầu/cuối đoạn mà lực kéo vuốt dần về 0
const SMOOTH_PASS = 2;     // số lượt làm trơn sau khi kéo (trung bình trượt 3 điểm)

const smoothstep = t => t * t * (3 - 2 * t);

/** Trọng số kéo theo vị trí trong đoạn: 0 ở hai nút, 1 ở giữa. */
function weightAt(i, n) {
  if (n < 3) return 0;
  const t = i / (n - 1);
  if (t < TAPER) return smoothstep(t / TAPER);
  if (t > 1 - TAPER) return smoothstep((1 - t) / TAPER);
  return 1;
}

/** Câu `ranh` có đủ để định rãnh không? (không thì khỏi tốn công dựng đám mây mô) */
function coRanh(ranh) {
  if (!ranh) return null;
  const p = parseTissue(ranh);
  const use = p.rules.filter(r => (r.type === 'between' && !r.a.missing && !r.b.missing) || (r.type === 'border' && !r.a.missing));
  if (!use.length) return null;
  return { loai: use.some(r => r.type === 'between') ? 'khe' : 'bo', n: use.length };
}

/**
 * Kéo một đoạn đường vào rãnh.
 * @param {object} atlas  mesh-io.loadAtlas()
 * @param {object} seg    { id, ranh, pts:[{x,y,z}] }
 * @param {object} opts   { snap(p)->{x,y,z} dán lại vào da, cache }
 * @returns { pts, keo, boQua, trungBinhCm, xaNhatCm, loai, ghiChu }
 */
function pullSegment(atlas, seg, opts = {}) {
  const pts = seg.pts.map(p => ({ ...p }));
  const co = coRanh(seg.ranh);
  if (!co) return { pts, keo: 0, boQua: pts.length, trungBinhCm: 0, xaNhatCm: 0, loai: null, ghiChu: 'không có rãnh đọc được — giữ nguyên đường bước 2' };
  if (pts.length < 3) return { pts, keo: 0, boQua: pts.length, trungBinhCm: 0, xaNhatCm: 0, loai: co.loai, ghiChu: 'đoạn quá ngắn' };

  const cache = opts.cache || new Map();
  const out = pts.map(p => ({ ...p }));
  let keo = 0, tong = 0, xa = 0, camDuoc = 0;
  const canhBao = new Set();

  for (let i = 1; i < pts.length - 1; i++) {
    const w = weightAt(i, pts.length);
    if (w <= 0.001) continue;
    const r = refineByTissue(atlas, { code: `${seg.id}#${i}`, pos: pts[i], vitri: seg.ranh, region: null }, { cache });
    if (r.warns && r.warns.length) for (const x of r.warns) canhBao.add(x.split('(')[0].trim());
    if (r.conf === 'pham-dieu-cam') { camDuoc++; continue; }
    if (!r.applied) continue;
    // LUẬT 2: rãnh không đổi cao độ — chỉ nhận thành phần x,z
    const nx = pts[i].x + w * (r.pos.x - pts[i].x);
    const nz = pts[i].z + w * (r.pos.z - pts[i].z);
    const d = Math.hypot(nx - pts[i].x, nz - pts[i].z);
    if (d < 1e-5) continue;
    out[i].x = nx; out[i].z = nz;
    keo++; tong += d; if (d > xa) xa = d;
  }

  // ---- làm trơn: kéo từng điểm độc lập dễ ra đường răng cưa vì mỗi lát cắt tìm khe riêng ----
  for (let pass = 0; pass < SMOOTH_PASS; pass++) {
    const src = out.map(p => ({ ...p }));
    for (let i = 1; i < out.length - 1; i++) {
      const w = weightAt(i, out.length);
      if (w <= 0.001) continue;
      out[i].x = (src[i - 1].x + src[i].x * 2 + src[i + 1].x) / 4;
      out[i].z = (src[i - 1].z + src[i].z * 2 + src[i + 1].z) / 4;
    }
  }

  // ---- LUẬT 3: về lại mặt da ----
  if (opts.snap) for (let i = 1; i < out.length - 1; i++) {
    const s = opts.snap(out[i]);
    if (s) { out[i].x = s.x; out[i].y = s.y; out[i].z = s.z; }
  }

  return {
    pts: out, keo, boQua: pts.length - 2 - keo,
    trungBinhCm: keo ? +(tong / keo * CM).toFixed(2) : 0,
    xaNhatCm: +(xa * CM).toFixed(2),
    loai: co.loai, camDuoc,
    canhBao: [...canhBao],
    ghiChu: keo ? null : 'có mô tả rãnh nhưng không dựng được hình học ở cao độ nào',
  };
}

module.exports = { pullSegment, coRanh, weightAt, CM };
