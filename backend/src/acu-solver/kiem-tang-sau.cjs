/* kiem-tang-sau — PHÉP KIỂM CHIỀU SÂU: cắm kim xuống thì gặp đúng mô sách ghi không?
 *
 * Bảy phép kiểm cũ đều hỏi về BỀ MẶT (đúng bộ phận? trên da? cách đường bao xa? đúng thốn?). Không
 * phép nào hỏi câu của thầy thuốc: "cắm kim ở đây thì xuyên qua cái gì?" — mà sách trả lời sẵn câu đó
 * cho 322/361 huyệt ở mục GIẢI PHẪU, và cho hướng + độ sâu ở mục CHÂM CỨU.
 *
 * CÁCH LÀM: từ toạ độ huyệt, dựng trục kim (hướng + góc theo sách), lấy mẫu dọc trục tới độ sâu sách
 * ghi, mỗi mẫu hỏi atlas "mô gần đây nhất là gì", rồi đối chiếu chuỗi mô thu được với danh sách sách.
 *
 * ĐỌC KẾT QUẢ CHO ĐÚNG — đây là phép SÀNG, không phải toà án:
 *   · "sách nêu mà không gặp" mạnh hơn "gặp mà sách không nêu": sách chỉ kể lớp chính, còn tia thì
 *     gặp mọi thứ nó đi qua.
 *   · Trượt HẾT mọi mô sách nêu mới là tín hiệu đáng tin. Trượt một hai tên thường chỉ là khác cách
 *     gọi hoặc atlas không tách riêng cấu trúc đó.
 *   · Hướng kim mặc định là ⟂ da (toả ra từ trục dọc thân) — thô ở đầu/mặt, nên vùng ấy đọc dè dặt.
 *
 * Dùng:  node backend/src/acu-solver/kiem-tang-sau.cjs [MÃ_KINH|MÃ_HUYỆT]                           */
const fs = require('fs');
const path = require('path');
const { loadAtlas } = require('./mesh-io.cjs');
const { loadSkin } = require('./skin-clamp.cjs');
const { GIAI_PHAU, chuanTen } = require('./parse-giai-phau.cjs');

const CM = 171.9;
const THON_CM = CM / 75;                 // thốn đồng-thân — đủ cho phép sàng theo chiều sâu
const ROOT = path.resolve(__dirname, '../../..');
const loadWin = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };
const BUOC_CM = 0.25;                    // khoảng lấy mẫu dọc trục kim
const BAN_KINH_CM = 0.9;                 // mẫu coi là "chạm" một mô nếu có đỉnh trong bán kính này

/* Từ khoá đặc trưng của một tên mô — để so tên sách với tên atlas mà không cần trùng từng chữ.
 * "cơ ngực lớn" (sách: "cơ ngực to") vs atlas "Cơ ngực lớn trái" → khớp qua khoá 'nguc'+'lon'. */
const BO = /^(cơ|gân|dây chằng|xương|cân|mạc|bao|màng|lớp|các|nhóm)\s+/;
function khoaTen(s) {
  const t = chuanTen(s).replace(BO, '');
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .split(/[^a-z0-9]+/).filter(w => w.length > 2 && !['cua', 'trai', 'phai', 'phan'].includes(w));
}
/* Sách Đông Y VN dùng danh pháp giải phẫu CŨ, atlas dùng danh pháp mới. Không có bảng này thì phép
 * kiểm báo trượt oan hàng loạt: sách "cơ chéo lớn của bụng" và atlas "Cơ chéo bụng ngoài" là MỘT, mà
 * so từ khoá thì chỉ trùng mỗi chữ "chéo". Mỗi dòng là một cặp tên đã đối chiếu tay. */
const DONG_NGHIA = [
  [/cơ chéo (lớn|to)( của bụng)?/i, 'cơ chéo bụng ngoài'],
  [/cơ chéo (bé|nhỏ)( của bụng)?/i, 'cơ chéo bụng trong'],
  [/cơ thẳng (lớn|to)/i, 'cơ thẳng bụng'],
  [/cơ (2|hai) đầu cánh tay/i, 'cơ nhị đầu cánh tay'],
  [/cơ (3|ba) đầu cánh tay/i, 'cơ tam đầu cánh tay'],
  [/cơ ngửa dài/i, 'cơ cánh tay quay'],
  [/cơ trụ (trước|sau)/i, 'cơ gấp cổ tay trụ'],
  [/cơ gan tay (lớn|to)/i, 'cơ gấp cổ tay quay'],
  [/cơ gan tay (bé|nhỏ)/i, 'cơ gan tay dài'],
  [/cơ thoi/i, 'cơ trám'],
  [/cơ gai dài của lưng|cơ lưng dài/i, 'cơ lưng dài'],
  [/cơ răng (bé|nhỏ) sau/i, 'cơ răng sau'],
  [/cơ răng (lớn|to)/i, 'cơ răng trước'],
  [/cân ngực\s*[–-]\s*thắt lưng/i, 'cân ngực thắt lưng'],
  [/cơ vòng môi/i, 'cơ vòng miệng'],
  [/rãnh (động )?mạch quay/i, 'động mạch quay'],
  [/cơ tháp/i, 'cơ tháp bụng'],
  [/cơ ngang gai/i, 'cơ ngang gai'],
];
const moRong = s => { const r = [s]; for (const [re, v] of DONG_NGHIA) if (re.test(s)) r.push(v); return r; };

function khopMot(tenSach, tenAtlas) {
  const a = khoaTen(tenSach), b = new Set(khoaTen(tenAtlas));
  if (!a.length) return false;
  const trung = a.filter(w => b.has(w)).length;
  return trung >= Math.min(2, a.length);            // ít nhất 2 từ khoá trùng (hoặc cả tên nếu chỉ 1 từ)
}
const khop = (tenSach, tenAtlas) => moRong(tenSach).some(t => khopMot(t, tenAtlas));

(async () => {
  const loc = (process.argv[2] || '').toUpperCase();
  /* Nạp cả MẠCH và THẦN KINH, không chỉ cơ–xương: sách tả tầng sâu bằng chính chúng ("rãnh động
   * mạch quay" ở LU8/LU9, "trên động mạch quay" ở LU9). Thiếu hai lớp này thì phép kiểm báo trượt oan
   * đúng những huyệt mà sách mô tả kỹ nhất. Thêm cả tạng để bắt ca nguy hiểm: kim tới phổi, tới ruột. */
  const atlas = await loadAtlas({ layers: ['bone', 'muscle', 'connective', 'arterial', 'venous', 'nervous', 'respiratory', 'digestive'] });
  const P = loadWin(path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'ACU_COORDS3D').points;

  // ---- lưới không gian: gom mọi đỉnh của mọi cấu trúc vào ô 1cm để truy vấn nhanh ----
  const O = 1 / CM;                                  // cạnh ô, đơn vị chuẩn-hoá (1cm)
  const luoi = new Map();
  const ten = [];
  let nDinh = 0;
  for (const c of atlas.concepts) {
    const p = atlas.points(c.conceptId); if (!p) continue;
    const id = ten.push({ vi: c.vi || c.en, layer: c.layer }) - 1;
    for (let i = 0; i < p.length; i += 3) {
      const k = `${Math.floor(p[i] / O)},${Math.floor(p[i + 1] / O)},${Math.floor(p[i + 2] / O)}`;
      let a = luoi.get(k); if (!a) luoi.set(k, a = []);
      a.push(p[i], p[i + 1], p[i + 2], id);
      nDinh++;
    }
  }
  console.error(`atlas: ${ten.length} cấu trúc · ${(nDinh / 1e6).toFixed(1)}M đỉnh · lưới ${luoi.size} ô`);

  const R = BAN_KINH_CM / CM, R2 = R * R;
  function moGanDiem(q) {                            // mọi cấu trúc có đỉnh trong bán kính R quanh q
    const gx = Math.floor(q[0] / O), gy = Math.floor(q[1] / O), gz = Math.floor(q[2] / O);
    const gap = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const a = luoi.get(`${gx + dx},${gy + dy},${gz + dz}`); if (!a) continue;
      for (let i = 0; i < a.length; i += 4) {
        const d2 = (a[i] - q[0]) ** 2 + (a[i + 1] - q[1]) ** 2 + (a[i + 2] - q[2]) ** 2;
        if (d2 > R2) continue;
        const id = a[i + 3];
        if (!gap.has(id) || gap.get(id) > d2) gap.set(id, d2);
      }
    }
    return gap;
  }

  /* PHÁP TUYẾN DA THẬT, không phải hướng toả từ trục dọc thân.
   * Bản đầu lấy hướng "vào trong" = ngược tia toả từ trục thân. Sai ngay ở chi: mesh để tay DANG
   * NGANG nên với LU3 (cánh tay) tia ấy chĩa về phía ngực, và phép kiểm báo "kim gặp cơ ngực lớn"
   * — lỗi của phép kiểm, không phải của huyệt. Đây đúng là bài học cũ ở dạng khác: mọi phép đo trên
   * chi phải theo TRỤC CHI, không theo trục thân.
   * Nay ước lượng pháp tuyến bằng đám đỉnh da quanh huyệt: trọng tâm của chúng nằm phía TRONG mặt da
   * (da lồi cục bộ), nên vector từ trọng tâm ra huyệt chính là hướng ra ngoài. */
  const skin = await loadSkin();
  const luoiDa = new Map();
  for (let i = 0; i < skin.length; i += 3) {
    const k = `${Math.floor(skin[i] / O)},${Math.floor(skin[i + 1] / O)},${Math.floor(skin[i + 2] / O)}`;
    let a = luoiDa.get(k); if (!a) luoiDa.set(k, a = []);
    a.push(skin[i], skin[i + 1], skin[i + 2]);
  }
  function phapTuyen(q) {
    const gx = Math.floor(q.x / O), gy = Math.floor(q.y / O), gz = Math.floor(q.z / O);
    let sx = 0, sy = 0, sz = 0, n = 0;
    const RR = (2.0 / CM) ** 2;                       // gom da trong bán kính 2cm
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) {
      const a = luoiDa.get(`${gx + dx},${gy + dy},${gz + dz}`); if (!a) continue;
      for (let i = 0; i < a.length; i += 3) {
        if ((a[i] - q.x) ** 2 + (a[i + 1] - q.y) ** 2 + (a[i + 2] - q.z) ** 2 > RR) continue;
        sx += a[i]; sy += a[i + 1]; sz += a[i + 2]; n++;
      }
    }
    if (n < 8) {                                      // quá ít da quanh đây → đành dùng tia toả từ trục thân
      const r = Math.hypot(q.x, q.z) || 1;
      return { v: [q.x / r, 0, q.z / r], tho: true };
    }
    /* Pháp tuyến = trục BÉ NHẤT của đám da quanh huyệt (PCA), không phải hiệu trọng tâm.
     * Hiệu trọng tâm chỉ đúng khi da cong rõ. Ở LƯNG — nơi da gần phẳng — trọng tâm đám da rơi ngay
     * cạnh huyệt nên vector ra rất ngắn và hướng thành nhiễu; đo được hậu quả: 30/67 huyệt Bàng Quang
     * bị báo "kim không chạm mô nào" trong khi lưng thì dày cơ thang và cơ dựng sống. PCA thì mặt
     * phẳng càng phẳng lại càng cho pháp tuyến chắc. Dấu lấy theo hiệu trọng tâm (chỉ để biết đâu là
     * phía ngoài), độ lớn lấy theo PCA. */
    const cx = sx / n, cy = sy / n, cz = sz / n;
    let xx = 0, yy = 0, zz = 0, xy = 0, xz = 0, yz = 0;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) {
      const a = luoiDa.get(`${gx + dx},${gy + dy},${gz + dz}`); if (!a) continue;
      for (let i = 0; i < a.length; i += 3) {
        const ux = a[i] - q.x, uy = a[i + 1] - q.y, uz = a[i + 2] - q.z;
        if (ux * ux + uy * uy + uz * uz > RR) continue;
        const px = a[i] - cx, py = a[i + 1] - cy, pz = a[i + 2] - cz;
        xx += px * px; yy += py * py; zz += pz * pz; xy += px * py; xz += px * pz; yz += py * pz;
      }
    }
    // trục bé nhất bằng lặp nghịch đảo thô: khử dần hai trục lớn khỏi một vector thử
    const M = [[xx, xy, xz], [xy, yy, yz], [xz, yz, zz]];
    const mul = u => [M[0][0] * u[0] + M[0][1] * u[1] + M[0][2] * u[2],
      M[1][0] * u[0] + M[1][1] * u[1] + M[1][2] * u[2],
      M[2][0] * u[0] + M[2][1] * u[1] + M[2][2] * u[2]];
    const chuan = u => { const l = Math.hypot(...u) || 1; return u.map(c => c / l); };
    let e1 = chuan([1, 0.3, 0.2]);
    for (let k = 0; k < 24; k++) e1 = chuan(mul(e1));                       // trục LỚN nhất
    let e2 = chuan([0.2, 1, 0.3]);
    for (let k = 0; k < 24; k++) { const d = e2[0] * e1[0] + e2[1] * e1[1] + e2[2] * e1[2];
      e2 = chuan(mul(chuan(e2.map((c, i) => c - d * e1[i])))); }                // trục lớn thứ hai
    let v = chuan([e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]);
    const ra = [q.x - cx, q.y - cy, q.z - cz];                              // phía nào là NGOÀI
    let dot = v[0] * ra[0] + v[1] * ra[1] + v[2] * ra[2];
    if (Math.abs(dot) < 1e-9) {                                             // huyệt nằm sát mặt phẳng → lấy trục thân làm trọng tài
      const r = Math.hypot(q.x, q.z) || 1; dot = v[0] * (q.x / r) + v[2] * (q.z / r);
    }
    if (dot < 0) v = v.map(c => -c);
    return { v, tho: false };
  }

  /* TRỤC KIM. Thẳng = ⟂ da (ngược pháp tuyến); xiên ngả 45°; luồn ngả 70°. Hướng ngả lấy từ câu sách
   * ("ra ngoài", "lên trên"…), và được khử thành phần dọc pháp tuyến để đúng là ngả TRONG MẶT da;
   * sách không ghi hướng thì ngả lên trên — phần lớn huyệt luồn đều luồn dọc kinh, mà kinh phần lớn
   * chạy dọc thân. */
  const DIR = {
    ngoai: q => [Math.sign(q.x) || 1, 0, 0], trong: q => [-(Math.sign(q.x) || 1), 0, 0],
    len: () => [0, 1, 0], xuong: () => [0, -1, 0], truoc: () => [0, 0, 1], sau: () => [0, 0, -1],
    'cot-song': q => [-(Math.sign(q.x) || 1), 0, 0],
  };
  function trucKim(q, g) {
    const pt = phapTuyen(q);
    let v = pt.v.map(c => -c);                                        // ⟂ da, chĩa vào trong
    const tilt = g.goc === 'luon' ? 70 : g.goc === 'xien' ? 45 : 0;
    if (tilt) {
      let h = (g.huong.map(k => DIR[k]).filter(Boolean)[0] || DIR.len)(q);
      const dot = h[0] * pt.v[0] + h[1] * pt.v[1] + h[2] * pt.v[2];    // khử phần dọc pháp tuyến
      h = h.map((c, i) => c - dot * pt.v[i]);
      const hl = Math.hypot(...h);
      if (hl > 1e-6) {
        const t = tilt * Math.PI / 180;
        v = v.map((c, i) => c * Math.cos(t) + (h[i] / hl) * Math.sin(t));
      }
    }
    const l = Math.hypot(...v) || 1;
    return { v: v.map(c => c / l), tho: pt.tho };
  }

  const rows = [];
  for (const [code, g] of Object.entries(GIAI_PHAU)) {
    if (loc && !code.startsWith(loc)) continue;
    const q = P[code];
    if (!q || q.x == null || !g.duoiDa.length) continue;
    const sauCm = Math.min((g.sau ? g.sau.hi : 0.5) * THON_CM, 6);    // trần 6cm: sâu hơn thì tia vô nghĩa
    const tk = trucKim(q, g), v = tk.v;
    const gap = new Map();                                            // id -> khoảng cách nhỏ nhất
    for (let d = 0; d <= sauCm; d += BUOC_CM) {
      const s = d / CM;
      for (const [id, d2] of moGanDiem([q.x + v[0] * s, q.y + v[1] * s, q.z + v[2] * s]))
        if (!gap.has(id) || gap.get(id) > d2) gap.set(id, d2);
    }
    let gapTen = [...gap.keys()].map(i => ten[i].vi);
    // Không chạm gì trong bán kính → huyệt đang treo trong khoảng trống mesh (kẽ tay/nách/giữa hai chi).
    // Nói rõ "cách mô gần nhất bao xa" thay vì im lặng, vì chính đó mới là dấu hiệu huyệt sai chỗ.
    let treoCm = null;
    if (!gapTen.length) {
      let bd = Infinity;
      for (let d = 0; d <= sauCm; d += BUOC_CM) {
        const t = d / CM, qq = [q.x + v[0] * t, q.y + v[1] * t, q.z + v[2] * t];
        const gx = Math.floor(qq[0] / O), gy = Math.floor(qq[1] / O), gz = Math.floor(qq[2] / O);
        for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) {
          const a = luoi.get(`${gx + dx},${gy + dy},${gz + dz}`); if (!a) continue;
          for (let i = 0; i < a.length; i += 4) {
            const d2 = (a[i] - qq[0]) ** 2 + (a[i + 1] - qq[1]) ** 2 + (a[i + 2] - qq[2]) ** 2;
            if (d2 < bd) bd = d2;
          }
        }
      }
      if (bd < Infinity) treoCm = +(Math.sqrt(bd) * CM).toFixed(1);
    }
    const truot = g.duoiDa.filter(s => !gapTen.some(a => khop(s, a)));
    rows.push({
      code, ten: g.ten, goc: g.goc, sauCm: +sauCm.toFixed(1),
      sachNeu: g.duoiDa.length, gapDuoc: g.duoiDa.length - truot.length,
      truot, mauGap: gapTen.slice(0, 6), treoCm, phapTuyenTho: tk.tho,
    });
  }

  rows.sort((a, b) => (a.gapDuoc / a.sachNeu) - (b.gapDuoc / b.sachNeu) || b.sachNeu - a.sachNeu);
  const n = rows.length;
  const trot = rows.filter(r => r.gapDuoc === 0).length;
  const dat = rows.filter(r => r.gapDuoc === r.sachNeu).length;
  const tongSach = rows.reduce((s, r) => s + r.sachNeu, 0), tongGap = rows.reduce((s, r) => s + r.gapDuoc, 0);
  console.log(`\nKIỂM TẦNG SÂU — ${n} huyệt có mô tả "dưới da là…"`);
  console.log(`  khớp HẾT mọi mô sách nêu : ${dat} (${(dat / n * 100).toFixed(0)}%)`);
  console.log(`  khớp một phần            : ${n - dat - trot}`);
  console.log(`  TRƯỢT HẾT (đáng ngờ)     : ${trot}`);
  console.log(`  tỉ lệ mô khớp trên tổng  : ${tongGap}/${tongSach} (${(tongGap / tongSach * 100).toFixed(0)}%)`);
  console.log(`\n25 huyệt đáng ngờ nhất (trượt hết mô sách nêu):`);
  for (const r of rows.filter(x => x.gapDuoc === 0).slice(0, 25))
    console.log(`  ${r.code.padEnd(6)} ${String(r.ten).padEnd(14)} sách nêu: ${r.truot.slice(0, 3).join(' / ')}\n${' '.repeat(23)}kim gặp: ${r.mauGap.slice(0, 3).join(' / ') || (r.treoCm != null ? `KHÔNG chạm mô nào — mô gần nhất cách ${r.treoCm}cm` : '(không gặp gì)')}`);
  fs.writeFileSync(path.join(__dirname, 'tang-sau-report.json'), JSON.stringify({ n, dat, trot, rows }, null, 1));
  console.log('\nBáo cáo: backend/src/acu-solver/tang-sau-report.json');
})();
