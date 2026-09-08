/* bake-paths — sinh ĐƯỜNG KINH (polyline trên mặt da) từ khung `meridian-nodes.cjs`.
 *
 * Với mỗi ĐOẠN của mỗi kinh: lấy các điểm neo của đoạn (hai đầu đoạn + mọi NÚT nằm trong đoạn), dán
 * chúng vào mặt da, rồi nối bằng đường trắc địa (surface-path.cjs). Kết quả là một polyline LUÔN nằm
 * trên người — khác hẳn spline CatmullRom hiện tại của map3d.js vốn nối thẳng các chấm trong không khí.
 *
 * KHÔNG ghi vào acu-coords3d.js. Đường ra tệp RIÊNG `meridian-paths.js` để map3d.js và các trang soát
 * đang giả định định dạng phẳng {x,y,z}/{h,az} không phải sửa gì.
 *
 * BÁO CÁO KÈM THEO là phần đáng đọc nhất: với mỗi huyệt KHÔNG phải nút, đo khoảng cách từ nó tới
 * đường của đoạn chứa nó. Huyệt nào lệch xa đường tức là nó đang không nằm trên kinh — đó chính là
 * danh sách phải hiệu chỉnh ở bước 4 (rải lại theo cốt độ DỌC đường).
 *
 * Dùng:  node backend/src/acu-solver/bake-paths.cjs [KINH]                                          */
const fs = require('fs');
const path = require('path');
const { NODES } = require('./meridian-nodes.cjs');
const S = require('./surface-path.cjs');
const { L, HEAD_ARC } = require('./model-frame.cjs');
const { pullSegment } = require('./path-groove.cjs');
const { loadAtlas } = require('./mesh-io.cjs');
const { projectInSlice, loadSkin } = require('./skin-clamp.cjs');
const { loadSkinNormals, huongToa } = require('./skin-normal.cjs');

const ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js');
const OUT = path.join(ROOT, 'frontend/public/kinhmach3d/data/meridian-paths.js');
const REP = path.join(__dirname, 'paths-report.json');

const SIMPLIFY_TOL = 0.0015;   // ≈ 2,6mm — đủ mịn để mắt không thấy gãy, mà nhẹ tệp
const NHAC_CM = 1.55;          // độ nhấc khỏi da của map3d.js (_SKIN_LIFT 0.009 × 171,9cm) — chỉ để ĐO
const R_ONG_CM = 0.31;         // bán kính ống đường kinh trên màn hình — hở dưới ngần này là bị da nuốt
const KHE = !process.argv.includes('--khong-khe');   // BƯỚC 3: kéo đường vào rãnh cơ–xương
// làm mịn TRƯỚC khi kéo rãnh: đường trắc địa có đoạn cạnh dài 2cm, kéo trên lưới thô đó thì rãnh chỉ
// bắt được vài lát cắt. Chia lại đều ~7mm rồi mới kéo, xong mới rút gọn.
const RESAMPLE = 0.004;

(async () => {
  const w = {};
  new Function('window', fs.readFileSync(SRC, 'utf8'))(w);
  const P = w.ACU_COORDS3D.points;

  const g = await S.loadSkinGraph();
  console.log(`đồ thị da: ${g.N} đỉnh · bán kính nối ${(g.R * S.CM).toFixed(1)}cm · liền ${g.phuTram}%`);
  const atlas = KHE ? await loadAtlas({ layers: ['bone', 'muscle', 'connective', 'skin', 'arterial'] }) : null;
  if (atlas) console.log(`atlas: ${atlas.concepts.length} khái niệm có hình học — BƯỚC 3 (kéo vào rãnh) BẬT`);
  const snap = p => { const n = g.nearest(p); return n && n.d < 0.03 ? n.p : null; };
  /** chia lại đường cho đều bước, để mỗi lát cắt của bước 3 có điểm mà kéo */
  /* ---- LÀM MƯỢT ĐƯỜNG -------------------------------------------------------------------------
   * Đường sinh ra từ Dijkstra là đường ngắn nhất trên ĐỒ THỊ ĐỈNH DA, nên nó nhảy từ đỉnh lưới này
   * sang đỉnh lưới khác: đo được góc bẻ trung vị 49,7° mỗi đỉnh và 148 đỉnh bẻ quá 90° (tức gập
   * ngược lại). Trên màn hình nó trông đúng như người dùng mô tả — "ngoằn ngoèo như mạch máu", trong
   * khi đường kinh trong sách là đường trơn. Bước 3 (kéo vào rãnh) còn làm nặng thêm.
   *
   * Cách chữa: san phẳng bằng Laplace, GHIM CHẶT các huyệt neo (đường buộc đi qua huyệt, không được
   * xê dịch), và cứ vài vòng lại kéo về da nếu trôi quá 6mm. Không "dán vào đỉnh gần nhất" — làm thế
   * là trả đường về đúng lưới thô vừa gỡ ra. */
  /* Pháp tuyến của một mảng đỉnh da = véc-tơ riêng ứng với trị riêng NHỎ NHẤT của ma trận hiệp
   * phương sai. Lần đầu tôi ước lượng nó bằng lặp luỹ thừa ngược tự chế — không hội tụ, pháp tuyến
   * nhảy lung tung nên mỗi vòng chiếu lại đá điểm đi một hướng khác, đường thành RĂNG CƯA (góc bẻ
   * trung vị vọt từ 21° lên 65°). Đây là công thức đóng cho ma trận đối xứng 3×3, không lặp. */
  function phapTuyen(m, huong) {
    const p1 = m[0][1] ** 2 + m[0][2] ** 2 + m[1][2] ** 2;
    const q = (m[0][0] + m[1][1] + m[2][2]) / 3;
    if (p1 < 1e-24) return null;                       // ma trận chéo: mảng suy biến, bỏ qua
    const p2 = (m[0][0] - q) ** 2 + (m[1][1] - q) ** 2 + (m[2][2] - q) ** 2 + 2 * p1;
    const pp = Math.sqrt(p2 / 6); if (pp < 1e-12) return null;
    const b = [0, 1, 2].map(r => [0, 1, 2].map(c => (m[r][c] - (r === c ? q : 0)) / pp));
    const det = b[0][0] * (b[1][1] * b[2][2] - b[1][2] * b[2][1])
              - b[0][1] * (b[1][0] * b[2][2] - b[1][2] * b[2][0])
              + b[0][2] * (b[1][0] * b[2][1] - b[1][1] * b[2][0]);
    const phi = Math.acos(Math.max(-1, Math.min(1, det / 2))) / 3;
    const e1 = q + 2 * pp * Math.cos(phi);                       // lớn nhất
    const e3 = q + 2 * pp * Math.cos(phi + 2 * Math.PI / 3);     // nhỏ nhất → pháp tuyến
    const e2 = 3 * q - e1 - e3;
    // véc-tơ riêng của e3 = cột khác 0 bất kỳ của (M − e1·I)(M − e2·I)
    const A = [0, 1, 2].map(r => [0, 1, 2].map(c => m[r][c] - (r === c ? e1 : 0)));
    const B = [0, 1, 2].map(r => [0, 1, 2].map(c => m[r][c] - (r === c ? e2 : 0)));
    let best = null, bl = 0;
    for (let c = 0; c < 3; c++) {
      const v = [0, 1, 2].map(r => A[r][0] * B[0][c] + A[r][1] * B[1][c] + A[r][2] * B[2][c]);
      const l = Math.hypot(...v); if (l > bl) { bl = l; best = v; }
    }
    if (!best || bl < 1e-18) return null;
    /* ĐỘ PHẲNG của mảng: trị riêng nhỏ nhất so với trị giữa. Mảng da thật thì e3 ≪ e2 và pháp tuyến
     * đáng tin; ở nếp gấp hay chỗ lưới rách thì ba trị xấp xỉ nhau, "pháp tuyến" quay ngang và phép
     * chiếu đá điểm sang bên. Đo được hai đỉnh đường Bàng Quang bị đẩy ngang 1,9cm vào sát đường giữa
     * đúng vì thế. Không phẳng thì THÀ KHÔNG CHIẾU. */
    if (Math.abs(e2) < 1e-30 || Math.abs(e3 / e2) > 0.3) return null;
    let n = best.map(v => v / bl);
    if (huong && (n[0] * huong[0] + n[1] * huong[1] + n[2] * huong[2]) < 0) n = n.map(v => -v);
    return n;
  }

  function lamMuot(g, raw, wps, khongChieu) {
    if (raw.length < 5) return raw;
    const p = resample(raw, 0.005).map(q => ({ x: q.x, y: q.y, z: q.z }));   // ~0,86cm/bước
    const ghim = new Set([0, p.length - 1]);
    for (const w of wps) {                       // ghim đỉnh gần mỗi huyệt neo nhất, và đặt đúng vào huyệt
      let bi = -1, bd = 1e9;
      for (let i = 0; i < p.length; i++) { const d = Math.hypot(p[i].x - w.x, p[i].y - w.y, p[i].z - w.z); if (d < bd) { bd = d; bi = i; } }
      if (bi >= 0) { p[bi] = { x: w.x, y: w.y, z: w.z }; ghim.add(bi); }
    }
    for (let v = 1; v <= 60; v++) {
      for (let i = 1; i < p.length - 1; i++) {
        if (ghim.has(i)) continue;
        const a = p[i - 1], c = p[i + 1];
        p[i] = { x: p[i].x + 0.5 * ((a.x + c.x) / 2 - p[i].x),
                 y: p[i].y + 0.5 * ((a.y + c.y) / 2 - p[i].y),
                 z: p[i].z + 0.5 * ((a.z + c.z) / 2 - p[i].z) };
      }
      /* Chiếu ở các vòng 12·k, nhưng KHÔNG chiếu ở mười vòng cuối — việc cuối cùng làm với đường
       * phải là làm mượt, không phải chiếu, nếu không đường giữ nguyên vết răng cưa của lần chiếu. */
      if (khongChieu || v % 12 || v > 50) continue;
      /* Hạ điểm xuống mặt da theo PHÁP TUYẾN, không kéo về "đỉnh da gần nhất".
       * Kéo về đỉnh gần nhất là dán vào một điểm của lưới thưa (~1,5cm), nên nó dịch điểm cả theo
       * chiều NGANG chứ không riêng chiều sâu — lặp lại nhiều vòng thì đường bị lôi ngoằn ngoèo đúng
       * kiểu người dùng thấy. Ở đây khớp một mặt phẳng qua các đỉnh da lân cận rồi chỉ dịch điểm theo
       * pháp tuyến của mặt phẳng đó: sửa độ sâu, GIỮ NGUYÊN vị trí ngang. */
      for (let i = 1; i < p.length - 1; i++) {
        if (ghim.has(i)) continue;
        const lc = g.quanh ? g.quanh(p[i], 0.018) : null;
        const kề = lc && lc.length >= 5 ? lc : null;
        if (!kề) { const n = g.nearest(p[i]); if (!n) continue;
          const dx = n.p.x - p[i].x, dy = n.p.y - p[i].y, dz = n.p.z - p[i].z;
          const d = Math.hypot(dx, dy, dz); if (d <= 0.0035) continue;
          const t = (d - 0.0035) / d;
          p[i] = { x: p[i].x + dx * t, y: p[i].y + dy * t, z: p[i].z + dz * t }; continue; }
        let cx = 0, cy = 0, cz = 0;
        for (const q of kề) { cx += q.x; cy += q.y; cz += q.z; }
        cx /= kề.length; cy /= kề.length; cz /= kề.length;
        // pháp tuyến = hướng riêng nhỏ nhất của ma trận hiệp phương sai (lặp luỹ thừa ngược, 12 vòng)
        let m = [[0,0,0],[0,0,0],[0,0,0]];
        for (const q of kề) { const v = [q.x - cx, q.y - cy, q.z - cz];
          for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) m[r][c] += v[r] * v[c]; }
        const n0 = phapTuyen(m, [p[i].x - cx, p[i].y - cy, p[i].z - cz]);
        if (!n0) continue;
        let d = (p[i].x - cx) * n0[0] + (p[i].y - cy) * n0[1] + (p[i].z - cz) * n0[2];
        /* Biên 0,4cm chứ không phải 1cm: việc của phép chiếu là chỉnh ĐỘ SÂU vài milimét, không phải
         * dời điểm. Cho phép tới 1cm thì ở chỗ lưng gồ ghề nó đá điểm ngang 1,5cm, làm đường phình ra
         * khỏi cột huyệt vốn đã thẳng tắp. */
        if (Math.abs(d) > 0.0023) continue;
        p[i] = { x: p[i].x - n0[0] * d, y: p[i].y - n0[1] * d, z: p[i].z - n0[2] * d };
      }
    }
    return p;
  }

  function resample(pts, step) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = out[out.length - 1], b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      const n = Math.floor(d / step);
      for (let k = 1; k <= n; k++) {
        const t = (k * step) / d;
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
      }
      out.push(b);
    }
    return out;
  }
  /* NỐI GẦN THÌ ĐI THẲNG, XA MỚI DÒ ĐƯỜNG.
   * Trắc địa Dijkstra chỉ đáng dùng khi hai mốc cách nhau đủ xa để đường phải VÒNG theo hình thể
   * (quanh vai, quanh mông, quanh sọ). Với hai huyệt kề nhau 3–5cm nó chỉ sinh nhiễu: đồ thị da nối
   * bán kính 2,1cm nên đường ngắn nhất được phép rẽ ngang 2cm mà tổng chiều dài gần như không đổi.
   * Đo được Đốc Mạch đoạn lưng vòng ra ngang 2,8cm giữa GV8 và GV9 — trong khi atlas vẽ Mạch Đốc là
   * một đường THẲNG trên sống lưng. Dưới ngưỡng NOI_THANG thì nối thẳng rồi để phép ép-mặt-phẳng
   * bên dưới hạ nó xuống mặt da. */
  /* 12cm: đủ phủ cả quãng hở thật giữa hai huyệt kề (BL52 ở L2 sang BL53 ở S2 cách 10,7cm qua vùng
   * cùng-chậu). Dưới ngưỡng này thì nối thẳng; đo được chính quãng 10,7cm ấy là chỗ đường nhánh ngoài
   * Bàng Quang phình ra 1,5cm khi còn dùng trắc địa. */
  const NOI_THANG = 0.070;

  /* ---- TRÊN THÂN MÌNH, "NGẮN NHẤT" KHÔNG PHẢI LÀ ĐÚNG -------------------------------------------
   * Thân người HẸP Ở EO và PHÌNH Ở LỒNG NGỰC: đo trên chính mesh, bán kính nửa thân trái đi từ
   * 12,8cm ở cao độ 109 lên 15,3cm ở cao độ 120. Nên khi phải vừa LEO vừa VÒNG quanh thân, đường
   * ngắn nhất bao giờ cũng chọn vòng hết ở chỗ EO rồi mới leo thẳng — rẻ hơn khoảng 2,5cm so với đi
   * chéo qua chỗ phình. Kết quả là hình chữ L, đúng cái người dùng nhìn ra ngay: *"sao chỗ này đường
   * kinh Can nó rối thế"*.
   * Đo được trên chặng Chương Môn → Kỳ Môn (LR13→LR14): đường đi hết 115% số góc phải quay trong khi
   * mới leo được 29% chiều cao, tức nó VÒNG QUA CẢ KỲ MÔN, thọc vào tận x=4,5cm (nông hơn cả chính
   * Kỳ Môn ở 7,5cm — tức lấn sang cột Vị/Thận trên bụng trên), rồi mới leo thẳng lên và bẻ ngược ra.
   *
   * PHÉP ĐO — "LỆCH NHỊP": với mỗi đỉnh, so TIẾN ĐỘ GÓC (t) với TIẾN ĐỘ CAO ĐỘ (s), cả hai chuẩn hoá
   * về 0→1 giữa hai huyệt neo. Đường đi đều thì t≈s suốt dọc; |t−s| lớn là quay trước leo sau (hoặc
   * ngược lại). Rà cả hệ: 84 chặng có nhịp đo được, 4 chặng THÂN hỏng nhịp >0,35 — SP16→SP17 (1,19),
   * GB21→GB22 (1,00), GB24→GB25 (0,70), LR13→LR14 (0,69). Đúng bốn đoạn tạo ra đám "tam giác" bắt
   * ngang lồng ngực trên màn hình.
   *
   * CÁCH CHỮA — DỰNG THEO NHỊP thay vì dò đường ngắn nhất: chia đều tham số, mỗi bước nội suy CẢ cao
   * độ LẪN góc quanh trục thân, rồi lấy đỉnh da đúng chỗ ấy (loại cánh tay bằng bán kính). Không dùng
   * Dijkstra nữa nên không còn động cơ "vòng chỗ hẹp".
   * Đã thử ba lối khác trước khi chốt lối này, ghi ra để khỏi thử lại:
   *   · hành lang quanh DÂY CUNG (2,5→10cm): dây cung LR13→LR14 nằm sâu trong bụng, hành lang dưới
   *     7cm không thông, mà 7cm thì đường dài thêm 3,2cm và vẫn vòng 5,2cm.
   *   · PHẠT lệch nhịp trên cạnh đồ thị (μ tới 4): KHÔNG đổi được đường — chứng tỏ lưới da không có
   *     lối chéo nào nối liền ở bán kính 2,1cm, chứ không phải Dijkstra chọn nhầm.
   *   · hành lang chuẩn hoá |t−s| ≤ 0,15…0,5: cũng không thông, cùng một lý do lưới thưa.
   * Lối "dựng theo nhịp" thoát được vì nó KHÔNG cần cạnh đồ thị liền — chỉ cần có ĐỈNH da ở mỗi nấc.
   *
   * CHỈ ÁP CHO THÂN MÌNH. Ở tay chân, "góc quanh trục thân" vô nghĩa (cả chi nằm lệch hẳn một bên),
   * nên chặng nào có đầu mút ra ngoài bán kính 18cm hoặc ra ngoài khoảng cao độ thân thì không xét.
   * Và chỉ đổi khi phép đo nhịp THẬT SỰ tốt lên — không thì giữ nguyên đường cũ. */
  const THAN_R = 0.105;                  // 18cm — ngoài ngưỡng này là tay/chân, không phải thân
  const THAN_Y = [0.42, 0.86];           // khoảng cao độ thân mình (trên khớp mu, dưới hõm ức–cổ)
  const NHIP_HONG = 0.35;                // lệch nhịp trên mức này thì đường đã "quay trước leo sau"
  const goc = q => Math.atan2(q.z, q.x);
  const vong = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  function nhipCua(A, B) {
    const thA = goc(A), dTh = vong(goc(B) - thA), dY = B.y - A.y;
    if (Math.abs(dTh) < 0.12 || Math.abs(dY) < 0.010) return null;   // dưới 7° hoặc dưới 1,7cm: nhịp vô nghĩa
    return { thA, dTh, dY, st: q => [(q.y - A.y) / dY, vong(goc(q) - thA) / dTh] };
  }
  function lechNhip(pts, A, B) {
    const n = nhipCua(A, B); if (!n) return 0;
    let m = 0; for (const q of pts) { const [s, t] = n.st(q); m = Math.max(m, Math.abs(t - s)); }
    return m;
  }
  const laThan = p => Math.hypot(p.x, p.z) < THAN_R && p.y > THAN_Y[0] && p.y < THAN_Y[1];
  /** Đỉnh da ở đúng (cao độ, góc) trên nửa thân cùng bên — không đi qua cạnh đồ thị nên không kẹt lưới thưa. */
  function daTaiNhip(g, y, th, ben, rMax) {
    let best = null, bd = Infinity;
    for (let i = 0; i < g.N; i++) {
      const x = g.pos[i * 3], Y = g.pos[i * 3 + 1], z = g.pos[i * 3 + 2];
      if (Math.abs(Y - y) > 0.008) continue;                      // lát cắt dày ±1,4cm
      if (ben > 0 ? x < 0.004 : x > -0.004) continue;             // giữ đúng nửa thân
      if (Math.hypot(x, z) > rMax) continue;                      // loại cánh tay
      const da = Math.abs(vong(Math.atan2(z, x) - th));
      if (da > 0.28) continue;                                    // trong ±16°
      const cost = da * 0.06 + Math.abs(Y - y);                   // đúng góc trước, đúng cao độ sau
      if (cost < bd) { bd = cost; best = { x, y: Y, z }; }
    }
    return best;
  }
  function duongTheoNhip(g, A, B, n) {
    const nh = nhipCua(A, B); if (!nh) return null;
    const ben = A.x >= 0 ? 1 : -1;
    const rMax = Math.max(Math.hypot(A.x, A.z), Math.hypot(B.x, B.z)) * 1.35;
    const pts = [{ ...A }];
    for (let k = 1; k < n; k++) {
      const t = k / n;
      const q = daTaiNhip(g, A.y + (B.y - A.y) * t, nh.thA + nh.dTh * t, ben, rMax);
      if (q) pts.push(q);
    }
    pts.push({ ...B });
    return pts.length >= 4 ? pts : null;
  }

  const doiNhip = [];                    // nhật ký: chặng nào đã đổi sang dựng-theo-nhịp
  function duongQuaNeo(g, wps, nhan, ma) {
    const out = [{ ...wps[0] }];
    let dungTracDia = false;
    for (let i = 1; i < wps.length; i++) {
      const a = wps[i - 1], b = wps[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      if (d <= NOI_THANG) {
        const n = Math.max(1, Math.round(d / 0.005));
        for (let k = 1; k <= n; k++) out.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n, z: a.z + (b.z - a.z) * k / n });
      } else {
        dungTracDia = true;
        const r = S.pathThrough(g, [a, b]);
        if (r.pts.length < 2) { out.push({ ...b }); continue; }
        let pts = r.pts;
        if (laThan(a) && laThan(b)) {
          const cu = lechNhip(pts, a, b);
          if (cu > NHIP_HONG) {
            const moi = duongTheoNhip(g, a, b, 18);
            const moiNhip = moi ? lechNhip(moi, a, b) : Infinity;
            if (moi && moiNhip < cu - 0.1) {
              pts = moi;
              doiNhip.push({ doan: nhan, cap: (ma && ma[i - 1]) + '→' + (ma && ma[i]), nhipCu: +cu.toFixed(2), nhipMoi: +moiNhip.toFixed(2) });
            }
          }
        }
        for (let k = 1; k < pts.length; k++) out.push(pts[k]);
      }
    }
    return { pts: out, dungTracDia };
  }

  const SKIN_RAW = await loadSkin();
  const khe = { keo: 0, doanKeo: 0, doanBo: 0, tong: 0, rows: [] };

  /* ---- PHÁP TUYẾN MẶT DA CHO TỪNG ĐỈNH ĐƯỜNG ----------------------------------------------------
   * Frontend phải nhấc ống ra khỏi da 1,55cm mới không bị da nuốt, và trước đây nó nhấc theo hướng
   * TOẢ RA TỪ TRỤC DỌC THÂN vì bảng này không nói gì về pháp tuyến. Ở tay chân buông xuôi hướng ấy
   * lệch 90–150° so với mặt da, có chỗ ngược hẳn — nhấc thành ra ĐẨY ỐNG VÀO TRONG THỊT: đo được
   * 52/482 đỉnh (11%) hở nhỏ hơn bán kính ống. Nay bake luôn pháp tuyến vào tệp để frontend nhấc
   * đúng chiều. Xem skin-normal.cjs.
   * PHẢI LÀM MƯỢT: hai đỉnh kề nhau có thể rơi vào hai tam giác khác nhau của lưới da thô, pháp tuyến
   * chênh nhau vài chục độ thì ống xoắn khấc. Ba lượt Laplace + chuẩn hoá là đủ mượt mà chưa mất
   * hướng ở chỗ kinh vòng qua cạnh xương. */
  const SN = await loadSkinNormals();
  console.log(`pháp tuyến da: ${SN.chiTietKiem.join(' · ')}`);
  function phapTuyenDoc(pts) {
    let ns = pts.map(p => SN.normalAt(p) || huongToa(p));
    for (let lap = 0; lap < 3; lap++) {
      const m = ns.map((n, i) => {
        if (i === 0 || i === ns.length - 1) return n;
        const a = ns[i - 1], b = ns[i + 1];
        const s = [n[0] * 2 + a[0] + b[0], n[1] * 2 + a[1] + b[1], n[2] * 2 + a[2] + b[2]];
        const l = Math.hypot(s[0], s[1], s[2]);
        return l < 1e-9 ? n : [s[0] / l, s[1] / l, s[2] / l];
      });
      ns = m;
    }
    return ns;
  }
  const hoTruoc = [], hoSau = [];   // để báo cáo mức cải thiện

  /* ĐỐC MẠCH đi trên đường giữa SAU, và ta có sẵn mốc mỏm gai TỪNG đốt sống trong model-frame cộng
   * với CUNG DỌC ĐẦU — tức đường của nó dựng được thẳng từ giải phẫu, không cần toạ độ huyệt. Đây
   * cũng là lý do Đốc Mạch (28 huyệt, còn dùng cực toạ độ {h,az}) vẫn ra đường đúng dù chưa qua engine. */
  const GV_WPS = {
    'cung-that-lung': ['VERT_SACRUM', 'VERT_L5', 'VERT_L4', 'VERT_L3', 'VERT_L2', 'VERT_L1'],
    lung: ['VERT_L1', 'VERT_T12', 'VERT_T10', 'VERT_T8', 'VERT_T6', 'VERT_T4', 'VERT_T2', 'VERT_C7'],
    gay: ['VERT_C7', 'HAIRLINE_POST'],
    'dinh-dau': null,   // lấy thẳng cung dọc đầu, xem dưới
    'mui-moi': ['GLABELLA'],
  };
  function wpsCuaGV(id) {
    if (id === 'dinh-dau') {
      // cung chạy Ấn Đường(0) → đỉnh → C7(18); Đốc Mạch đi NGƯỢC: từ gáy lên đỉnh rồi ra trán
      return HEAD_ARC.slice().reverse().map(([y, z]) => ({ x: 0, y, z }));
    }
    const ids = GV_WPS[id];
    if (!ids) return [];
    const out = ids.map(k => L[k]).filter(Boolean).map(p => ({ x: p.x, y: p.y, z: p.z }));
    // đoạn mũi–môi: từ Ấn Đường xuống dưới mũi (mốc MENTON là cằm, quá thấp — dừng ở giữa)
    if (id === 'mui-moi' && L.GLABELLA && L.MENTON)
      out.push({ x: 0, y: L.GLABELLA.y - (L.GLABELLA.y - L.MENTON.y) * 0.72, z: L.GLABELLA.z * 0.55 });
    return out;
  }

  const merArg = process.argv.slice(2).find(x => !x.startsWith('--'));
  const sel = merArg ? [merArg] : Object.keys(NODES);
  const outMer = {}, rows = [];
  let tongDoan = 0, tongCm = 0, hong = 0;

  for (const mer of sel) {
    const d = NODES[mer];
    const nodeSet = new Set(d.nut.map(n => n.code));
    const doanOut = [];

    for (const s of d.doan) {
      /* Điểm neo: hai đầu đoạn + mọi nút + MỌI HUYỆT ĐÃ LÀ MỐC TẦNG 1.
       * Trước đây chỉ lấy hai đầu và nút, nên đường là đường trắc địa NGẮN NHẤT nối hai đầu — nó cắt
       * ngang qua chứ không đi qua các huyệt ở giữa. Rà soát toàn diện đo được BL3–BL8 cách chính
       * đường Bàng Quang của mình 4,0–7,3cm, BL44–BL52 cách 3,1–4,9cm: không phải huyệt sai chỗ mà là
       * ĐƯỜNG bỏ rơi huyệt. Nay huyệt nào đã dựng từ mốc giải phẫu (conf='mốc') thì đường buộc phải
       * đi qua; trắc địa chỉ còn việc lấp khoảng giữa những huyệt ta CHƯA biết chắc. */
      const anchors = s.diem.filter((c, i) => i === 0 || i === s.diem.length - 1 || nodeSet.has(c)
        || (P[c] && P[c].x !== undefined && (P[c].anchor || P[c].conf === 'mốc')));
      // toạ độ neo: ưu tiên bảng huyệt; huyệt chưa có toạ độ thì lùi về MỐC giải phẫu mà nút khai
      const nutBy = {}; for (const n of d.nut) nutBy[n.code] = n;
      /* ĐỐC MẠCH: BỎ lối dựng riêng từ mốc đốt sống. Lối cũ có lý khi GV còn là cực toạ độ {h,az},
       * nhưng nay GV2–GV28 đều đã là mốc Descartes dựng TỪ CHÍNH các mỏm gai ấy, nên dựng lại từ mốc
       * chỉ tạo ra một đường thứ hai lệch với huyệt: rà soát đo được GV2 cách đường 9,9cm và GV24 cách
       * 7,1cm — vì chặng thắt lưng dừng ở L1 trong khi đoạn chứa tới GV6 (T11), còn chặng mũi–môi bắt
       * đầu từ Ấn Đường trong khi GV24 nằm tận chân tóc. Dùng chung một lối với 13 kinh còn lại thì
       * đường buộc đi qua huyệt, hết cả hai lỗi. wpsCuaGV chỉ còn dùng khi đoạn thiếu toạ độ huyệt. */
      let wps = anchors.map(c => {
        if (P[c] && P[c].x !== undefined) return P[c];
        const at = nutBy[c] && nutBy[c].at;
        return at && L[at] ? { x: L[at].x, y: L[at].y, z: L[at].z } : null;
      }).filter(Boolean);
      if (mer === 'GV' && wps.length < 2) wps = wpsCuaGV(s.id);   // dự phòng: đoạn chưa đủ huyệt có toạ độ
      /* CHIẾU MỐC RA DA TRƯỚC KHI DÙNG. surface-path ghim đúng toạ độ mốc vào hai đầu mỗi chặng, nên
       * mốc phải nằm SẴN trên da — nếu không, đường bị kéo chui vào trong. Nhiều mốc là XƯƠNG và nằm
       * sâu thật: mỏm gai đốt sống 1,5–4,4cm (Đốc Mạch neo toàn bộ vào đó). Bỏ bước này thì bất biến
       * "đường luôn trên người" gãy ngay: đo được 4,44cm và 3% số đỉnh rời khỏi da. */
      wps = wps.map(p => {
        /* Đo tới MẶT da chứ không tới ĐỈNH da trước khi quyết định có chiếu hay không. Lưới thưa nên
         * một mốc nằm ĐÚNG trên mặt vẫn có thể cách đỉnh gần nhất 1,2cm; dán nó vào đỉnh ấy là đẩy
         * điểm neo lệch NGANG, và cả đường lệch theo — đo được cột Bàng Quang nhánh trong có huyệt
         * thẳng tắp ở x=2,9 mà đường lại vọt ra 3,7 rồi tụt vào 1,7. */
        /* Phép đo KÉP như trong bộ rà soát: cạnh đồ thị (tốt chỗ lưới dày) VÀ đường bao lát cắt của
         * tầng 5 (cứu chỗ khe rộng hơn bán kính nối 2,1cm — bụng dưới và lưng có khe tới 2,8cm).
         * Chỉ khi CẢ HAI đều nói xa thì mốc mới thật sự lìa da và mới đáng dán lại. */
        const dCanh = (g.nearestSurf(p) || { d: 9 }).d;
        const pr = projectInSlice(SKIN_RAW, p, null);
        if (Math.min(dCanh, pr ? pr.d : 9) <= 0.0058) return p;
        const n = g.nearest(p);
        // >1cm dưới da = mốc XƯƠNG (mỏm gai đốt sống sâu 1,5–4,4cm) → phải chiếu ra da.
        // ≤1cm = huyệt đã qua tầng 5, vốn nằm trên da → GIỮ NGUYÊN, để đường xuyên đúng chỗ nó chứ
        // không lệch sang đỉnh lưới gần nhất (lưới thưa, cạnh trung bình 1,55cm).
        return (n && n.d > 0.0058) ? n.p : p;
      });
      // bỏ mốc trùng nhau (vd GB4/5/6 hiện chồng lên nhau) — hai mốc sát dưới 3mm thì Dijkstra ra 1 đỉnh
      wps = wps.filter((p, i) => i === 0 || Math.hypot(p.x - wps[i - 1].x, p.y - wps[i - 1].y, p.z - wps[i - 1].z) > 0.0018);
      if (wps.length < 2) { doanOut.push({ id: s.id, mo: s.mo, vung: s.vung, cm: 0, pts: [], bo: 'neo trùng nhau hoặc thiếu toạ độ' }); hong++; continue; }

      const r = duongQuaNeo(g, wps, mer + '/' + s.id, anchors);
      if (r.pts.length < 2) { doanOut.push({ id: s.id, mo: s.mo, vung: s.vung, cm: 0, pts: [], bo: 'không dựng được' }); hong++; continue; }

      /* ---- BƯỚC 3: kéo vào rãnh cơ–xương ----
       * CHỈ áp cho đoạn mà huyệt còn THƯA. Bước này sinh ra hồi đường mới chỉ neo hai đầu: khi ấy nó
       * là cách duy nhất để đường tìm đúng rãnh. Nay mọi huyệt đã dựng từ mốc giải phẫu đều là điểm
       * neo, nên trên đoạn neo dày nó chỉ còn phá: đo được nó lôi đường Bàng Quang nhánh trong từ
       * x 1,8–3,0 (đúng bằng biên độ của chính 20 huyệt) sang x 0,4–3,1, tức kéo lên tận mỏm gai,
       * làm dao động ngang tăng gấp đôi (5,1 → 10,7cm). Atlas vẽ nhánh này là ĐƯỜNG THẲNG ĐỨNG.
       * Ngưỡng: neo chiếm từ 70% số huyệt của đoạn trở lên thì bỏ qua bước 3. */
      const dayNeo = s.diem.length ? anchors.length / s.diem.length : 0;
      let raw = r.pts, kq = null;
      if (atlas && s.mo !== 'chim' && dayNeo < 0.7) {
        const dense = resample(raw, RESAMPLE);
        kq = pullSegment(atlas, { id: mer + '/' + s.id, ranh: s.ranh, pts: dense }, { snap, cache: new Map() });
        raw = kq.pts;
        khe.tong++;
        if (kq.keo) {
          khe.keo += kq.keo; khe.doanKeo++;
          khe.rows.push({ doan: mer + '/' + s.id, loai: kq.loai, keo: kq.keo, tb: kq.trungBinhCm, xa: kq.xaNhatCm, cam: kq.camDuoc || 0, canhBao: kq.canhBao });
        } else khe.doanBo++;
      }
      /* Đoạn KHÔNG dùng trắc địa: mọi đỉnh của nó là nội suy thẳng giữa hai huyệt vốn đã nằm trên da,
       * nên đường đã bám da rồi — chiếu thêm chỉ đá nó đi. Cộng dồn qua 4 lượt chiếu, chính nó làm
       * cột dọc thân phình 1cm dù cả 20 huyệt đều thẳng tắp ở x=2,9. Ở đây tắt chiếu cho các đoạn ấy. */
      const pts = S.simplify(lamMuot(g, raw, wps, !r.dungTracDia), SIMPLIFY_TOL);
      const nrm = phapTuyenDoc(pts);
      if (s.mo !== 'chim') for (let i = 0; i < pts.length; i++) {      // đo mức cải thiện, chỉ đoạn HIỆN
        const o = huongToa(pts[i]);
        const a = SN.hoCm(pts[i], o, NHAC_CM), b = SN.hoCm(pts[i], nrm[i], NHAC_CM);
        if (a !== null) hoTruoc.push(a);
        if (b !== null) hoSau.push(b);
      }
      doanOut.push({
        id: s.id, mo: s.mo, vung: s.vung, ranh: s.ranh, cm: S.arcCm(pts),
        neo: anchors,
        khe: kq && kq.keo ? { loai: kq.loai, keo: kq.keo, tbCm: kq.trungBinhCm, xaCm: kq.xaNhatCm } : null,
        pts: pts.map(p => [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4)]),
        nrm: nrm.map(n => [+n[0].toFixed(3), +n[1].toFixed(3), +n[2].toFixed(3)]),
      });
      tongDoan++; tongCm += S.arcCm(pts);

      // ---- đối chiếu: huyệt thường lệch đường bao nhiêu ----
      if (pts.length >= 2) for (const c of s.diem) {
        if (nodeSet.has(c) || !P[c] || P[c].x === undefined) continue;
        const cm = S.distToPathCm(pts, P[c]);
        if (Number.isFinite(cm)) rows.push({ mer, code: c, doan: s.id, cm, conf: P[c].conf || '' });
      }
    }
    outMer[mer] = { ten: d.ten, huong: d.huong, doan: doanOut };
    const cm = doanOut.reduce((a, x) => a + x.cm, 0);
    console.log(`${mer.padEnd(3)} ${d.ten.padEnd(11)} ${String(doanOut.length).padStart(2)} đoạn · ${cm.toFixed(0).padStart(4)} cm · ${doanOut.reduce((a, x) => a + x.pts.length, 0)} đỉnh`);
  }

  const header = `/* Đường kinh 3D — polyline TRÊN MẶT DA, sinh bởi backend/src/acu-solver/bake-paths.cjs.
 *  Khung (điểm đầu/cuối/nút mốc/điểm gấp khúc/đoạn) khai trong meridian-nodes.cjs;
 *  đường nối là trắc địa trên đồ thị mặt da (surface-path.cjs), nên LUÔN nằm trên người.
 *  mo='hien' → vẽ liền · mo='chim' → kinh đi trong sâu, nên vẽ nét đứt hoặc ẩn.
 *  Toạ độ CHUẨN-HOÁ theo chiều cao mesh, cùng hệ với acu-coords3d.js (x>0 = bên trái, z>0 = phía trước).
 *  nrm[i] = PHÁP TUYẾN MẶT DA tại pts[i], đã chuẩn hoá, hướng RA NGOÀI (skin-normal.cjs).
 *    Frontend PHẢI nhấc ống theo nrm, KHÔNG được nhấc theo hướng toả ra từ trục dọc thân: ở tay chân
 *    hai hướng lệch 90–150° nên nhấc kiểu cũ là đẩy ống chui vào trong thịt, da lấp mất đường.
 *    Chấm huyệt phải nhấc bằng ĐÚNG véc-tơ ấy (acu-coords3d.js field n), nếu không chấm rời khỏi ống.
 *  Sinh lại: node backend/src/acu-solver/bake-paths.cjs */
window.MERIDIAN_PATHS = `;
  fs.writeFileSync(OUT, header + JSON.stringify({ ver: 1, cm: S.CM, mer: outMer }, null, 1) + ';\n');

  rows.sort((a, b) => b.cm - a.cm);
  fs.writeFileSync(REP, JSON.stringify({ rows, tongDoan, tongCm: +tongCm.toFixed(0), doiNhip }, null, 1));

  if (doiNhip.length) {
    console.log(`\nDỰNG THEO NHỊP thay cho trắc địa — ${doiNhip.length} chặng THÂN (trắc địa quay trước leo sau):`);
    for (const r of doiNhip) console.log(`   ${r.doan.padEnd(12)} ${r.cap.padEnd(14)} lệch nhịp ${r.nhipCu} → ${r.nhipMoi}`);
  } else console.log('\nDỰNG THEO NHỊP: không chặng nào cần đổi');

  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`\n${tongDoan} đoạn · ${tongCm.toFixed(0)} cm đường · ${hong} đoạn hỏng · tệp ${kb} KB`);
  console.log(`Đã ghi ${OUT}`);

  /* ---- NHẤC KHỎI DA: đo mức cải thiện ---------------------------------------------------------- */
  const tb = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const nuot = a => a.filter(v => v < R_ONG_CM).length;
  console.log(`\nNHẤC ỐNG KHỎI DA ${NHAC_CM}cm — độ hở còn lại (ống bán kính ${R_ONG_CM}cm):`);
  console.log(`   theo hướng TOẢ (bản cũ)  : hở TB ${tb(hoTruoc).toFixed(2)}cm · thấp nhất ${Math.min(...hoTruoc).toFixed(2)}cm · ${nuot(hoTruoc)}/${hoTruoc.length} đỉnh bị da nuốt`);
  console.log(`   theo PHÁP TUYẾN (bản mới): hở TB ${tb(hoSau).toFixed(2)}cm · thấp nhất ${Math.min(...hoSau).toFixed(2)}cm · ${nuot(hoSau)}/${hoSau.length} đỉnh bị da nuốt`);
  if (SN.soKhongPhanDinh) console.log(`   ⚠ ${SN.soKhongPhanDinh} lần trường khí không phân định được chiều — giữ chiều cuốn của mesh`);

  if (atlas) {
    khe.rows.sort((a, b) => b.tb - a.tb);
    console.log(`\nBƯỚC 3 — KÉO VÀO RÃNH: ${khe.doanKeo}/${khe.tong} đoạn kéo được · ${khe.keo} điểm dời · ${khe.doanBo} đoạn không có rãnh đọc được`);
    console.log('   đoạn                 loại   điểm   dời TB   xa nhất  cấm');
    for (const r of khe.rows.slice(0, 18))
      console.log(`   ${r.doan.padEnd(20)} ${(r.loai === 'khe' ? 'khe ' : 'bờ  ')}  ${String(r.keo).padStart(4)}  ${String(r.tb).padStart(6)}cm ${String(r.xa).padStart(7)}cm ${String(r.cam || '').padStart(4)}`);
    const cb = {};
    for (const r of khe.rows) for (const c of (r.canhBao || [])) cb[c] = (cb[c] || 0) + 1;
    const cbs = Object.entries(cb).sort((a, b) => b[1] - a[1]);
    if (cbs.length) console.log('   điều cấm chạm phải: ' + cbs.map(([k, n]) => `${k} (${n} đoạn)`).join(' · '));
  }

  // đoạn nào lệch nhiều một cách hệ thống → đường trắc địa giữa hai nút CHƯA đủ tả, cần thêm nút
  const per = {};
  for (const r of rows) { const k = r.mer + '/' + r.doan; (per[k] = per[k] || []).push(r.cm); }
  const yeu = Object.entries(per).map(([k, v]) => ({ k, n: v.length, tb: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) }))
    .filter(x => x.tb > 4).sort((a, b) => b.tb - a.tb);
  console.log(`\nĐOẠN CẦN THÊM NÚT (lệch trung bình > 4cm — đường ngắn nhất giữa hai nút chưa tả đúng lối đi):`);
  for (const x of yeu) console.log(`   ${x.k.padEnd(22)} ${String(x.tb).padStart(5)} cm TB trên ${x.n} huyệt`);

  const xa = rows.filter(r => r.cm > 3);
  console.log(`\nHuyệt lệch khỏi đường kinh của chính nó: ${rows.length} huyệt đo được, ${xa.length} lệch > 3cm`);
  for (const r of xa.slice(0, 22)) console.log(`   ${r.code.padEnd(6)} ${String(r.cm).padStart(6)} cm  đoạn ${r.doan.padEnd(14)} conf=${r.conf}`);
})();
