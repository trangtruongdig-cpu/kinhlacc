/* audit-toan-dien — RÀ SOÁT TỪNG HUYỆT, TỪNG KINH.
 *
 * Các bộ kiểm trước mỗi bộ hỏi một câu hẹp (trên da? đúng bộ phận? đúng chiều?). Bộ này gom lại và
 * bổ sung ba câu chưa ai hỏi, vốn là chỗ sai kín đáo nhất:
 *   · huyệt có nằm ĐÚNG THỨ TỰ dọc đường kinh không (LU5 phải ở giữa LU4 và LU6 trên đường, không
 *     phải chỉ "gần đường");
 *   · khoảng cách giữa hai huyệt kề đo trên đường có khớp SỐ THỐN sách ghi không (bảng cốt độ);
 *   · hai huyệt có chập vào nhau không.
 *
 * Dùng:  node backend/src/acu-solver/audit-toan-dien.cjs [MÃ_KINH]                                  */
const fs = require('fs');
const path = require('path');
const S = require('./surface-path.cjs');
const { projectInSlice, loadSkin } = require('./skin-clamp.cjs');
const { NODES } = require('./meridian-nodes.cjs');
const { DOAN } = require('./cot-do-chi.cjs');
const { L } = require('./model-frame.cjs');
const CM = 171.9;
const ROOT = path.resolve(__dirname, '../../..');

const doc = f => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w; };
const P = doc(path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js')).ACU_COORDS3D.points;
const PATHS = doc(path.join(ROOT, 'frontend/public/kinhmach3d/data/meridian-paths.js')).MERIDIAN_PATHS.mer;
const VITRI = require('./vitri-data.json').points;
const REG = require('./region-report.json');
const saiVung = new Set(REG.sai.map(r => r.code));

/* NGOẠI LỆ ĐÃ DUYỆT — chỗ sách CỐ Ý cho huyệt lệch khỏi đường chính hoặc cho kinh vòng ngược.
 * Khai ra để báo cáo khỏi kêu oan, và để lần sau ai đọc cũng biết đây là đã xét chứ không phải bỏ sót.
 * Mỗi dòng phải kèm LÝ DO lấy từ sách, không được thêm chỉ vì muốn báo cáo đẹp. */
const NGOAI_LE = {
  /* LỖI CỦA LƯỚI DA, KHÔNG PHẢI CỦA HUYỆT. Đo được 08/09/2026: SP10→SP11 đường thẳng 13,50cm nhưng
   * trắc địa TRÊN DA tới 25,80cm — gần gấp đôi. Nguyên nhân là vỏ da atlas hở ở khe giữa hai đùi, nên
   * đường ngắn nhất phải vòng ra sau rồi quặt lại, sinh góc gấp 60 độ ở chỗ không có huyệt nào.
   * Hai huyệt hai đầu thì ĐÚNG: SP10 đo 1,91 thốn trên bờ trên bánh chè (sách 2), và SP11 nằm đúng
   * giữa cột theo trục x (SP10 6,09 → SP11 5,50 → SP12 6,82). Sửa huyệt để chiều lòng đường là đi
   * ngược — phải vá lưới da hoặc cho đoạn này một điểm hướng dẫn, cả hai đều ngoài phạm vi phép kiểm. */
  'SP/dui/đường gấp': 'vỏ da atlas hở ở khe đùi trong nên trắc địa SP10→SP11 dài gấp đôi đường thẳng; hai huyệt hai đầu đều đã nghiệm thu đúng',
  'ST40/lệch đường': 'Phong Long nằm NGOÀI Điều Khẩu ST38 một khoát ngón tay — sách đặt nó lệch khỏi đường Vị chính',
  'ST40/đảo thứ tự': 'Phong Long ở 8 thốn trên mắt cá, CAO hơn Hạ Cự Hư ST39 (7 thốn); số hiệu tăng nhưng vị trí lùi lên — đúng sách',
  'GB35/lệch đường': 'Dương Giao ở bờ SAU xương mác, đường Đởm chính đi ở bờ TRƯỚC — hai bên kẹp thân xương',
  'GB36/đảo thứ tự': 'Dương Giao GB35 và Ngoại Khâu GB36 CÙNG ở 7 thốn trên mắt cá, chỉ khác bờ trước/bờ sau xương mác — không có thứ tự trên dưới để đảo',
  'KI8/lệch đường': 'Giao Tín ở TRƯỚC Phục Lưu KI7 nửa thốn, sát bờ sau xương chày — sách đặt nó lệch khỏi đường Thận chính',
  'TE21/đảo thứ tự': 'Kinh Tam Tiêu vòng lên SAU tai (TE20 Giác Tôn) rồi mới quặt ra TRƯỚC tai (TE21 Nhĩ Môn) — đường tự gấp lại',
  /* Kinh Thận VÒNG quanh mắt cá trong (atlas tr.477 vẽ rõ: KI2→KI6→KI5→KI4→KI3 rồi mới lên cẳng chân).
   * Vòng khép nên đi theo số hiệu thì có đoạn lùi lại — giống hệt trường hợp TE21 vòng quanh tai.
   * Vị trí từng huyệt đã kiểm riêng: KI5 đúng 1 thốn dưới KI3 và ở TRƯỚC KI4 như sách ghi. */
  'KI5/đảo thứ tự': 'Kinh Thận vòng quanh mắt cá trong nên đường tự gấp lại; KI5 ở TRƯỚC KI4 là đúng sách',
  'CV1/lìa da': 'Hội Âm ở đáy chậu, giữa hậu môn và bộ phận sinh dục — nếp gấp sâu, mesh không tả được mặt da ở đó',
  'CV1/lệch đường': 'cùng lý do trên: đoạn bụng dưới của Nhâm Mạch chạy trên da, còn Hội Âm nằm trong nếp đáy chậu',
  /* HT1 — đã KIỂM chứ không phải bỏ qua: đo được nó nằm NGOÀI lồng ngực (x 17,4 so với sườn ngoài
   * nhất 10,8) và trong khoảng giữa thành ngực với cánh tay, tức đúng giữa hố nách như sách ghi.
   * Mô hình để tay hơi dang nên hố nách là KHOẢNG TRỐNG: đỉnh da gần nhất cách 1,9cm về phía trong
   * (x 15,7). Ép huyệt lên thành ngực hay lên mặt trong cánh tay đều sai hơn là để nguyên. */
  'HT1/lìa da': 'Cực Tuyền ở giữa hố nách; mesh để tay dang nên hố nách là khoảng trống, không có mặt da ở tâm hố',
  'HT1/lệch đường': 'cùng lý do trên: đường kinh Tâm bám mặt trong cánh tay, còn Cực Tuyền ở tâm hố nách',
};

/** vị trí theo chiều dài cung của điểm chiếu lên đường (cm từ đầu đoạn) + khoảng cách tới đường */
function chieuLenDuong(pts, p) {
  let best = null, s = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const L2 = ux * ux + uy * uy + uz * uz, len = Math.sqrt(L2);
    let t = L2 > 0 ? ((p.x - a[0]) * ux + (p.y - a[1]) * uy + (p.z - a[2]) * uz) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const qx = a[0] + ux * t, qy = a[1] + uy * t, qz = a[2] + uz * t;
    const d = Math.hypot(p.x - qx, p.y - qy, p.z - qz);
    if (!best || d < best.d) best = { d, cung: s + len * t };
    s += len;
  }
  return best ? { cm: best.d * CM, cung: best.cung * CM, tong: s * CM } : null;
}

(async () => {
  const g = await S.loadSkinGraph();
  const SKIN = await loadSkin();
  const chiKinh = process.argv[2];
  const loi = [];                                   // { code, mer, loai, muc, mo }
  const boQua = [];
  const bao = (code, mer, loai, muc, mo) => {
    const ly = NGOAI_LE[code + '/' + loai];
    if (ly) { boQua.push({ code, loai, ly }); return; }
    loi.push({ code, mer, loai, muc, mo });
  };

  // ---- A1: chập huyệt (mọi cặp) ----
  const ma = Object.keys(P).filter(c => P[c] && P[c].x !== undefined);
  for (let i = 0; i < ma.length; i++) for (let j = i + 1; j < ma.length; j++) {
    const a = P[ma[i]], b = P[ma[j]];
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * CM;
    if (d < 0.3) bao(ma[i], ma[i].replace(/\d+$/, ''), 'chập', d < 0.05 ? 'nặng' : 'vừa',
      `trùng ${ma[j]} (cách ${d.toFixed(2)}cm)`);
  }

  const tomTat = [];
  for (const [mer, d] of Object.entries(NODES)) {
    if (chiKinh && mer !== chiKinh) continue;
    const codes = [];
    for (const s of d.doan) for (const c of s.diem) if (!codes.includes(c)) codes.push(c);
    const st = { mer, ten: d.ten, n: 0, thieu: 0, ngoaiDa: 0, saiVung: 0, xaDuong: 0, daoThuTu: 0, saiThon: 0, coSoat: 0 };

    // ---- A2: từng huyệt ----
    for (const c of codes) {
      const p = P[c];
      st.n++;
      if (!p || p.x === undefined) { st.thieu++; bao(c, mer, 'thiếu', 'nặng', 'chưa có toạ độ Descartes'); continue; }
      /* Đo tới MẶT da, không tới ĐỈNH da. Hai phép bù nhau vì lưới thưa không đều:
       *  · cạnh đồ thị (bán kính nối 2,1cm) — tốt ở chỗ lưới dày;
       *  · đường bao LÁT CẮT của tầng 5 — cứu chỗ lưới có khe rộng hơn 2,1cm (bụng dưới có khe 2,8cm,
       *    ở đó không cạnh nào tồn tại nên phép trên báo nhầm "lìa da 1,7cm" cho huyệt đặt đúng).
       * Lấy giá trị NHỎ HƠN: chỉ khi CẢ HAI đều nói xa thì mới thật sự lìa da. */
      const dCanh = g.nearestSurf(p).d * CM;
      const pr = projectInSlice(SKIN, p, p.snapDir || null);
      const da = Math.min(dCanh, pr ? pr.d * CM : Infinity);
      if (da > 1.5) { st.ngoaiDa++; bao(c, mer, 'lìa da', da > 3 ? 'nặng' : 'vừa', `cách mặt da ${da.toFixed(1)}cm`); }
      if (saiVung.has(c)) { st.saiVung++; bao(c, mer, 'sai vùng', 'nặng', 'kiểm vùng báo sai bộ phận'); }
      if (p.canSoat) { st.coSoat++; bao(c, mer, 'cờ soát', 'nhẹ', String(p.canSoat).slice(0, 110)); }
    }

    // ---- A3 + B: theo từng ĐOẠN — cách đường, thứ tự, cốt độ ----
    const segs = (PATHS[mer] && PATHS[mer].doan) || [];
    for (const s of d.doan) {
      const sp = segs.find(x => x.id === s.id);
      if (!sp || !sp.pts || sp.pts.length < 2) { bao(mer + '/' + s.id, mer, 'đoạn hỏng', 'nặng', 'không dựng được đường'); continue; }
      const vt = [];
      for (const c of s.diem) {
        const p = P[c]; if (!p || p.x === undefined) continue;
        const r = chieuLenDuong(sp.pts, p);
        if (!r) continue;
        if (r.cm > 1.5) { st.xaDuong++; bao(c, mer, 'lệch đường', r.cm > 3 ? 'nặng' : 'vừa', `cách đường ${s.id} ${r.cm.toFixed(1)}cm`); }
        vt.push({ c, cung: r.cung, tong: r.tong });
      }
      /* GÓC GẤP CỦA ĐƯỜNG — phân biệt hai loại, vì gộp chung thì vô dụng:
       *  · gấp ngay TẠI một huyệt = kinh thật sự quặt ở đó theo thứ tự sách (Đởm quặt ở Thính Hội,
       *    Thận vòng mắt cá ở Thái Khê, Tiểu Trường gấp khúc trên bả vai) — hợp lệ, không báo;
       *  · gấp GIỮA hai huyệt = đường tự đi lệch — đó mới là lỗi.
       * Chính phép đo này lộ ra GB40 đặt sai (z=6,9cm giữa mu bàn chân thay vì trước-dưới mắt cá) và
       * GB41/GB42 đặt ngược nhau; ba bộ kiểm kia đều không thấy. */
      for (let i = 1; i < sp.pts.length - 1; i++) {
        const A2 = sp.pts[i - 1], B2 = sp.pts[i], C2 = sp.pts[i + 1];
        const ux = B2[0] - A2[0], uy = B2[1] - A2[1], uz = B2[2] - A2[2];
        const vx = C2[0] - B2[0], vy = C2[1] - B2[1], vz = C2[2] - B2[2];
        const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz);
        if (lu < 1e-9 || lv < 1e-9) continue;
        const goc = Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy + uz * vz) / (lu * lv)))) * 180 / Math.PI;
        if (goc <= 60) continue;
        let gd = 9;
        for (const cc of s.diem) { const q = P[cc]; if (!q || q.x === undefined) continue;
          const dd = Math.hypot(q.x - B2[0], q.y - B2[1], q.z - B2[2]) * CM; if (dd < gd) gd = dd; }
        if (gd < 1.0) continue;                                  // gấp tại huyệt → hợp lệ
        bao(mer + '/' + s.id, mer, 'đường gấp', goc > 100 ? 'nặng' : 'vừa',
          `gấp ${goc.toFixed(0)}° ở chỗ cách mọi huyệt ${gd.toFixed(1)}cm — đường tự đi lệch`);
      }
      for (let i = 1; i < vt.length; i++) if (vt[i].cung < vt[i - 1].cung - 0.4) {
        st.daoThuTu++;
        bao(vt[i].c, mer, 'đảo thứ tự', 'nặng', `nằm TRƯỚC ${vt[i - 1].c} trên đoạn ${s.id} (${vt[i].cung.toFixed(1)} < ${vt[i - 1].cung.toFixed(1)}cm)`);
      }
      /* Cốt độ: đo dọc TRỤC CHI, không dọc đường cong bề mặt.
       * Thốn cổ điển là khoảng cách dọc trục xương (mắt cá → gối, cổ tay → khuỷu). Đường kinh lại
       * lượn quanh chi nên cung của nó dài hơn trục; lấy cung làm thang thì huyệt nào cũng "sai thốn"
       * dù đặt đúng — đã đo LR5 ra 3,8 thốn trong khi nó nằm đúng 5 thốn tính theo chiều cao. */
      /* Trục lấy theo MỐC XƯƠNG khi đoạn có khai (xaMoc/ganMoc) — phải đo cùng thang mà bảng cốt độ
       * dùng để đặt, nếu không bộ rà soát tự bịa ra lỗi: hai huyệt đầu đoạn (GB40, SI8, TE10…) không
       * nằm đúng mốc 0 và `tong`, nên thang suy từ chúng lệch sẵn. Xem chú thích đầu cot-do-chi.cjs. */
      const bang = DOAN[mer + '/' + s.id];
      if (bang && vt.length >= 2) {
        const mocBen = m => { const q = P[bang.xa]; const ben = q && q.x < 0 ? -1 : 1; return { x: L[m].x * ben, y: L[m].y, z: L[m].z }; };
        const dungMoc = bang.xaMoc && L[bang.xaMoc] && L[bang.ganMoc];
        const xa = dungMoc ? mocBen(bang.xaMoc) : P[bang.xa];
        const gan = dungMoc ? mocBen(bang.ganMoc) : P[bang.gan];
        if (xa && gan && xa.x !== undefined && gan.x !== undefined) {
          const ax = gan.x - xa.x, ay = gan.y - xa.y, az = gan.z - xa.z;
          const L2 = ax * ax + ay * ay + az * az;
          const doTruc = p => ((p.x - xa.x) * ax + (p.y - xa.y) * ay + (p.z - xa.z) * az) / L2;  // 0..1
          const cmMoiThon = Math.sqrt(L2) * CM / bang.tong;
          for (const [c, o] of Object.entries(bang.diem)) {
            const thon = typeof o === 'number' ? o : o.thon;
            const q = P[c]; if (!q || q.x === undefined) continue;
            const doThon = doTruc(q) * bang.tong;
            const lech = Math.abs(doThon - thon);
            if (lech > 0.6) { st.saiThon++; bao(c, mer, 'sai cốt độ', lech > 1.2 ? 'nặng' : 'vừa',
              `đo ${doThon.toFixed(1)} thốn, sách ${thon} thốn (lệch ${(lech * cmMoiThon).toFixed(1)}cm)`); }
          }
        }
      }
    }
    tomTat.push(st);
  }

  // ---- in ----
  const bac = { nặng: 0, vừa: 1, nhẹ: 2 };
  loi.sort((a, b) => bac[a.muc] - bac[b.muc] || a.mer.localeCompare(b.mer) || a.code.localeCompare(b.code));
  console.log('KINH  tên          huyệt  thiếu  lìa-da  sai-vùng  lệch-đường  đảo-thứ-tự  sai-cốt-độ  cờ-soát');
  for (const s of tomTat) console.log(
    s.mer.padEnd(5) + s.ten.padEnd(13) + String(s.n).padStart(4) + String(s.thieu).padStart(7) +
    String(s.ngoaiDa).padStart(8) + String(s.saiVung).padStart(10) + String(s.xaDuong).padStart(12) +
    String(s.daoThuTu).padStart(12) + String(s.saiThon).padStart(12) + String(s.coSoat).padStart(9));
  const dem = {};
  for (const l of loi) dem[l.loai + '/' + l.muc] = (dem[l.loai + '/' + l.muc] || 0) + 1;
  console.log('\nTỔNG LỖI:', loi.length, '·', Object.entries(dem).map(([k, v]) => k + '=' + v).join(' · '));
  console.log('\n--- NẶNG + VỪA (theo kinh) ---');
  for (const l of loi.filter(x => x.muc !== 'nhẹ'))
    console.log(`  ${l.muc.padEnd(5)} ${l.mer.padEnd(3)} ${l.code.padEnd(9)} ${l.loai.padEnd(12)} ${l.mo}`);
  fs.writeFileSync(path.join(__dirname, 'audit-report.json'), JSON.stringify({ tomTat, loi, ngoaiLe: boQua }, null, 1));
  if (boQua.length) {
    console.log('\n--- NGOẠI LỆ ĐÃ DUYỆT (không tính là lỗi) ---');
    for (const b of boQua) console.log(`  ${b.code.padEnd(6)} ${b.loai.padEnd(12)} ${b.ly}`);
  }
  console.log('\nBáo cáo đầy đủ (kèm cờ soát): backend/src/acu-solver/audit-report.json');
})();
