/* skin-clamp — TẦNG 5 của engine: LUẬT BẤT BIẾN "HUYỆT PHẢI NẰM TRÊN DA".
 *
 * VÌ SAO CÓ FILE NÀY
 * Bốn tầng trước (mốc → WHO → sách/cốt độ → khe mô) đều suy luận trong hệ TOẠ ĐỘ, không tầng nào
 * hỏi câu đơn giản nhất: "điểm này có nằm trên người không?". Kết quả: đo trên bảng đã bake, 61/333
 * huyệt (18%) nằm NGOÀI mặt da mà không huyệt nào bị gắn cờ — vì tầng khe mô chỉ chạy khi câu VỊ TRÍ
 * có nhắc tên mô, mà vùng đầu-mặt hầu như không mô tả mô nào. Frontend lại CHE LẤP lỗi: map3d.js
 * bắn tia 6 phía "dán" huyệt vào da gần nhất, nên huyệt sai 7cm vẫn hiện trên da — chỉ là SAI CHỖ
 * (má thay vì thái dương), hoặc dán nhầm sang cánh tay; khi không tia nào trúng thì huyệt lơ lửng
 * giữa không khí — đúng cảnh "huyệt bay ra ngoài giải phẫu".
 *
 * NGUYÊN TẮC (kế thừa đúng tinh thần tầng khe mô):
 *   · KHÔNG đổi CAO ĐỘ. Cốt độ đã chốt y và đó là chiều được kiểm chứng kỹ nhất — tầng này chỉ
 *     chiếu trong LÁT CẮT NGANG tại đúng y đó (sửa x, z).
 *   · Chiếu THEO HƯỚNG huyệt vốn thuộc về: huyệt mặt trước chỉ tìm da phía trước, mặt sau chỉ tìm
 *     da phía sau, và luôn ở CÙNG BÊN thân — nếu không, một huyệt ngực lệch sẽ bị hút sang cánh tay.
 *   · TRUNG THỰC: dời gần thì sửa im lặng (sai số cong/làm tròn); dời xa thì VẪN ép lên da (để
 *     không bao giờ còn huyệt bay ra ngoài) nhưng HẠ độ tin xuống 'cần soát' + ghi rõ dời mấy cm.
 *     Ép lên da mà giấu quãng dời là biến lỗi hiển nhiên thành lỗi ngầm — tệ hơn.
 *   · Huyệt chốt bằng MỐC/CHẤM TAY vẫn bị kiểm: mốc sai thì cả kinh sai, nên mốc lệch phải hiện ra
 *     (vd ST8 conf='mốc' — độ tin CAO NHẤT — nhưng cách da 10,5cm).
 *
 * Chạy ở BAKE (bake.cjs), không chạy lúc request: nạp mesh 23,5MB tốn vài giây, và bảng bake ra đã
 * sạch nên frontend không cần biết gì thêm.                                                        */
const { loadAtlas } = require('./mesh-io.cjs');

const CM = 171.9;                 // chiều cao mesh (cm) — chỉ để in ra cho người đọc
const CUN = 1 / 75;               // thốn đồng-thân (chuẩn-hoá) ≈ 2,29cm
const SLICE = 0.012;              // nửa bề dày lát cắt khi tìm da cùng cao độ (≈2cm)
const OK_CUN = 1.0;               // dời dưới ngần này thốn: sai số hình học, sửa im lặng
const SOAT_CUN = 2.0;             // dời quá ngần này thốn: hạ độ tin, gắn cờ cần soát

/** Nạp đám mây điểm DA của mesh v2. */
async function loadSkin() {
  const atlas = await loadAtlas({ layers: ['skin'] });
  let skin = null;
  for (const s of atlas.search(/^skin$/i)) {
    const p = atlas.points(s.conceptId);
    if (p && (!skin || p.length > skin.length)) skin = p;
  }
  if (!skin) throw new Error('skin-clamp: mesh không có lớp da');
  return skin;
}

/** Lưới voxel để trả lời "điểm này nằm TRONG hay NGOÀI người" bằng phủ 14 hướng. */
function buildOcc(skin, cell) {
  const occ = new Set();
  for (let i = 0; i < skin.length; i += 3)
    occ.add(`${Math.round(skin[i] / cell)},${Math.round(skin[i + 1] / cell)},${Math.round(skin[i + 2] / cell)}`);
  return occ;
}
const DIRS = (() => {
  const d = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const n = Math.sqrt(3);
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) d.push([sx / n, sy / n, sz / n]);
  return d;
})();

function makeProbe(skin) {
  const CELL = 0.004;
  const occ = buildOcc(skin, CELL);
  const hit = (p, d) => {
    for (let t = CELL; t <= 0.7; t += CELL) {
      const i = Math.round((p.x + d[0] * t) / CELL), j = Math.round((p.y + d[1] * t) / CELL), k = Math.round((p.z + d[2] * t) / CELL);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++)
        if (occ.has(`${i + a},${j + b},${k + c}`)) return true;
    }
    return false;
  };
  return (p) => { let n = 0; for (const d of DIRS) if (hit(p, d)) n++; return { cov: n, inside: n >= 13 }; };
}

/** Điểm da gần nhất TRONG LÁT CẮT tại cao độ p.y, cùng bên thân, đúng phía (trước/sau) nếu có yêu cầu. */
function projectInSlice(skin, p, dirHint) {
  const sideX = Math.abs(p.x) > 0.030 ? Math.sign(p.x) : 0;   // gần đường giữa thì không ép bên
  /* NỚI DẦN, không "được ăn cả ngã về không": lượt 1 siết đủ mọi điều kiện; nếu lát cắt đó không có
   * da hợp lệ thì bỏ dần ràng buộc yếu nhất trước. Không có bước nới này, ST2/ST3 (z=0,088 của mesh
   * cũ, được đánh snapDir='front') tìm da "phía trước z>0,068" ở cao độ mặt — nơi da chỉ tới z≈0,055
   * — nên KHÔNG có ứng viên nào và tầng 5 đành bó tay, huyệt vẫn treo ngoài mặt 6,6cm. */
  const passes = [
    { half: SLICE, side: sideX, dir: dirHint },        // đủ điều kiện
    { half: SLICE * 2, side: sideX, dir: dirHint },    // dày lát cắt gấp đôi
    { half: SLICE * 2, side: sideX, dir: null },       // bỏ yêu cầu trước/sau
    { half: SLICE * 4, side: 0, dir: null },           // bỏ luôn cùng-bên (huyệt gần đường giữa)
  ];
  let best = null, bd = Infinity, ung = null;
  for (const q of passes) {
    bd = Infinity; best = null; ung = [];
    for (let i = 0; i < skin.length; i += 3) {
      const x = skin[i], y = skin[i + 1], z = skin[i + 2];
      if (Math.abs(y - p.y) > q.half) continue;
      if (q.side && Math.sign(x) !== q.side) continue;
      if (q.dir === 'front' && z < p.z - 0.02) continue;
      if (q.dir === 'back' && z > p.z + 0.02) continue;
      ung.push({ x, z });
      const d = (x - p.x) ** 2 + (z - p.z) ** 2;              // đo trong LÁT CẮT: cao độ giữ nguyên
      if (d < bd) { bd = d; best = { x, y, z }; }
    }
    if (best) break;
  }
  if (!best) return null;
  /* TINH LẠI TRÊN ĐƯỜNG BAO, không dừng ở đỉnh gần nhất.
   * Lưới da thưa: trên bụng có chỗ hai đỉnh kề nhau cách 2,8cm. Một huyệt nằm ĐÚNG trên mặt da nhưng
   * rơi vào giữa hai đỉnh sẽ bị đo là "cách da 1,7cm" rồi bị dán sang đỉnh gần nhất — tức bị đẩy LỆCH
   * NGANG. Đo được Thuỷ Đạo ST28 bị đẩy từ x=3,8 (đúng 2 thốn) sang 5,3.
   * Ở đây nối các đỉnh trong lát cắt thành đường bao (sắp theo góc quanh trọng tâm) rồi tìm điểm gần
   * nhất TRÊN CẠNH. Bỏ cạnh dài quá 4cm để không bắc cầu ngang qua khe thật (nách, bẹn). */
  if (ung.length >= 6) {
    let cx = 0, cz = 0;
    for (const q of ung) { cx += q.x; cz += q.z; }
    cx /= ung.length; cz /= ung.length;
    const vong = ung.slice().sort((a, b) => Math.atan2(a.z - cz, a.x - cx) - Math.atan2(b.z - cz, b.x - cx));
    for (let i = 0; i < vong.length; i++) {
      const A = vong[i], B = vong[(i + 1) % vong.length];
      const ux = B.x - A.x, uz = B.z - A.z, L2 = ux * ux + uz * uz;
      if (L2 === 0 || L2 > 0.0233 * 0.0233) continue;                  // cạnh > 4cm: khe thật, không nối
      let t = ((p.x - A.x) * ux + (p.z - A.z) * uz) / L2;
      t = Math.max(0, Math.min(1, t));
      const qx = A.x + ux * t, qz = A.z + uz * t;
      const d = (qx - p.x) ** 2 + (qz - p.z) ** 2;
      if (d < bd) { bd = d; best = { x: qx, y: p.y, z: qz }; }
    }
  }
  return { p: { x: best.x, y: p.y, z: best.z }, d: Math.sqrt(bd) };
}

/** Toàn bộ khoảng cách 3D tới da (để biết huyệt nằm sâu bao nhiêu). */
function nearest3d(skin, p) {
  let bd = Infinity;
  for (let i = 0; i < skin.length; i += 3) {
    const d = (skin[i] - p.x) ** 2 + (skin[i + 1] - p.y) ** 2 + (skin[i + 2] - p.z) ** 2;
    if (d < bd) bd = d;
  }
  return Math.sqrt(bd);
}

/**
 * Ép cả bảng huyệt lên da.
 * @param {object} points  { CODE: {x,y,z,q,conf,snapDir,...} }  (định dạng acu-coords3d)
 * @returns {object} { points, report: { moved, flagged, rows[] } }
 */
async function clampToSkin(points, opts = {}) {
  const skin = await loadSkin();
  const probe = makeProbe(skin);
  const rows = [];
  let moved = 0, flagged = 0, outside = 0;

  for (const [code, pt] of Object.entries(points)) {
    if (pt.x === undefined) continue;                       // huyệt cực toạ độ (GV) — frontend tự bắn tia
    const p0 = { x: pt.x, y: pt.y, z: pt.z };
    const st = probe(p0);
    const depth = nearest3d(skin, p0);
    if (!st.inside) outside++;

    // đã nằm trong da và nông → app dán ra da đúng chỗ, không cần đụng
    if (st.inside && depth <= OK_CUN * CUN) continue;

    const pr = projectInSlice(skin, p0, pt.snapDir);
    if (!pr) { pt.canSoat = (pt.canSoat ? pt.canSoat + ' · ' : '') + 'không tìm được da cùng cao độ — cao độ chắc chắn sai'; flagged++; continue; }

    const slideCun = pr.d / CUN;
    /* MỐC TẦNG 1 (src='anchor'): được sửa ĐỘ SÂU nhưng KHÔNG được bẻ NGANG.
     * Nguyên tắc của tầng này vẫn giữ — mốc vẫn bị kiểm, mốc sai vẫn phải hiện ra (chính nó bắt được
     * ST8 lệch 10,5cm). Nhưng "kiểm" khác "âm thầm bẻ": mốc dựng từ cốt độ đã có hoành độ ĐÚNG THEO
     * SỐ THỐN, mà lưới da thưa lại khiến phép chiếu lát cắt trượt ngang 1–2cm và phá đúng cái cột
     * vừa dựng (đo được CV17 bị đẩy 1,75cm khỏi đường giữa, KI26 từ 3,8 về 3,0).
     * Nên: giữ nguyên x, chỉ nhận z; nếu phép chiếu đòi dời ngang quá 0,5cm thì GẮN CỜ để người soát
     * biết, chứ không tự ý sửa. */
    const beNgang = Math.abs(pr.p.x - p0.x);
    if (pt.src === 'anchor' && beNgang > 0.0029) {
      pt.z = +pr.p.z.toFixed(4);
      pt.canSoat = (pt.canSoat ? pt.canSoat + ' · ' : '')
        + `TẦNG DA: phép chiếu đòi bẻ NGANG ${(beNgang * CM).toFixed(1)}cm — đã GIỮ hoành độ của mốc (mốc dựng theo số thốn), chỉ nhận độ sâu. Soát lại nếu mốc này nghi sai.`;
      flagged++;
      rows.push({ code, outside: !st.inside, cm: +(pr.d * CM).toFixed(1), cun: +slideCun.toFixed(2), conf: pt.conf, src: pt.src });
      continue;
    }
    pt.x = +pr.p.x.toFixed(4); pt.y = +pr.p.y.toFixed(4); pt.z = +pr.p.z.toFixed(4);
    moved++;
    rows.push({ code, outside: !st.inside, cm: +(pr.d * CM).toFixed(1), cun: +slideCun.toFixed(2), conf: pt.conf, src: pt.src });

    if (slideCun > SOAT_CUN) {
      pt.q = 'approx';
      pt.canSoat = (pt.canSoat ? pt.canSoat + ' · ' : '')
        + `TẦNG DA: huyệt ${st.inside ? 'nằm sâu' : 'NẰM NGOÀI da'} — đã ép lên da, dời ${(pr.d * CM).toFixed(1)}cm (${slideCun.toFixed(1)} thốn). Mốc/quy tắc sinh ra nó gần như chắc chắn sai.`;
      flagged++;
    } else if (slideCun > OK_CUN) {
      pt.canSoat = (pt.canSoat ? pt.canSoat + ' · ' : '') + `TẦNG DA: ép lên da, dời ${(pr.d * CM).toFixed(1)}cm`;
    }
  }
  rows.sort((a, b) => b.cm - a.cm);
  return { points, report: { outsideTruoc: outside, moved, flagged, rows } };
}

module.exports = { clampToSkin, loadSkin, makeProbe, projectInSlice, nearest3d, CUN };
