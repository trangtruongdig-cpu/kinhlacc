/* Đồ hình kinh lạc 3D — chấm huyệt lên một mesh người, xoay/zoom tự do.
 * Phụ thuộc: THREE (vendor/three.min.js) + OrbitControls + GLTFLoader,
 *            window.ACU_COORDS3D, window.ACU_INDEX, window.ACUPOINTS.
 * Render "đẹp": nền gradient, da có khối + bóng mềm, đường kinh dạng ỐNG cong
 *               phát sáng + DÒNG kinh khí chảy, chấm huyệt có quầng, trượt mờ da.
 * Toạ độ vẫn tham số (h,az,dir) → thêm/đổi model hay thêm huyệt KHÔNG phải đặt lại. */
(function () {
  const COORDS = window.ACU_COORDS3D, INDEX = window.ACU_INDEX, ACU = window.ACUPOINTS;
  // ĐƯỜNG KINH dựng sẵn ở backend (backend/src/acu-solver/bake-paths.cjs): polyline TRÊN MẶT DA,
  // đi trắc địa qua các nút của khung meridian-nodes.cjs. Không có tệp này thì rơi về cách cũ.
  const PATHS = window.MERIDIAN_PATHS || null;
  if (!COORDS || !INDEX || !ACU || typeof THREE === 'undefined') return;
  const $ = id => document.getElementById(id);
  const stage = $('mapStage'), drawer = $('drawerBody'),
        search = $('mapSearch'), countEl = $('mapCount'), drawerSheet = $('mapDrawer'),
        captionText = $('mapCaptionText');
  if (!stage) return;
  // Sheet chi tiết (huyệt/bộ phận) giờ CHỈ nổi lên khi có nội dung (kiểu Sheet của bản demo Human
  // Atlas) — trước đây drawer luôn chiếm chỗ cố định trong sidebar. setDrawer(html)/hideDrawerSheet()
  // thay cho gán thẳng drawer.innerHTML để LUÔN đồng bộ đúng trạng thái mở/đóng của sheet.
  function setDrawer(html) { drawer.innerHTML = html; drawerSheet?.classList.add('open'); }
  function hideDrawerSheet() { drawerSheet?.classList.remove('open'); }

  const MODEL_URL = (window.ACU_MAP_BASE || '') + 'models/body-layers-v2.glb'
    + (window.ACU_ASSET_VER ? '?v=' + window.ACU_ASSET_VER : '');   // 3 lớp Da/Cơ/Xương (BodyParts3D 4.0, chuyển từ Human Atlas — Giai đoạn 1, xem backend/tmp/convert-human-atlas.mjs). ACU_MAP_BASE do Vue đặt (vd '/kinhmach3d/'); ?v=<số build> để phá cache (khớp preload trong acuMap3d.ts).
  // TẠM THỜI: dùng file body-layers-v2.glb (mới) song song với body-layers.glb (cũ, vẫn dùng cho
  // banner trang chủ + BatCuongFigure3D.vue qua heroThree.ts) — chưa gộp lại tên, chờ QA xong.
  const BODY_H = 1.7;                            // chuẩn hoá chiều cao thân về 1.7 đơn vị
  const ACCENT = 0xb8763e;                       // màu nhấn khi chọn/khớp tìm kiếm
  // kích thước kim châm (theo tỉ lệ bodyHeight): chiều dài thân · cán · độ cắm vào da · biên độ "trượt vào" · thời lượng
  const NEEDLE = { len: 0.05, handle: 0.015, insert: 0.012, amp: 0.035, dur: 0.4 };

  // ---- dữ liệu phụ trợ cho ngăn chi tiết ----
  const recById = new Map(ACU.records.map(r => [r.id, r]));
  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const sec = (r, key) => (r.sections || []).find(s => norm(s.h).includes(key))?.body || '';
  const placed = COORDS.points;
  const merOf = code => code.replace(/\d+$/, '');
  const numOf = code => +code.replace(/\D/g, '');
  const presentMer = [...new Set(Object.keys(placed).map(merOf))];
  // Thứ tự CHUẨN: 12 kinh chính theo vòng tuần hoàn (Phế đầu) → Mạch Nhâm → Mạch Đốc cuối.
  const MER_ORDER = ['LU', 'LI', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'TE', 'GB', 'LR', 'CV', 'GV'];

  // ---- CHẤM TAY: điểm CHỐT do người dùng tự đặt (ưu tiên tuyệt đối, chuẩn-vàng) ----
  const userPlaced = {};                        // code -> { x, y, z }  (chuẩn-hoá theo bodyHeight)
  const userNeedle = {};                        // code -> { x, y, z }  HƯỚNG KIM tự chỉnh (vector trục, ra ngoài da)
  const derived = {};                           // code -> { x, y, z }  TẦNG 2 tự rải giữa các chốt
  const SPACING = window.ACU_SPACING || {};     // tỉ lệ thốn dọc mỗi kinh → rải theo tỉ lệ
  let editMode = false, editSel = null;

  /* CHẤM TAY CHỈ ÁP DỤNG KHI ĐANG CHỈNH — không đè lên engine ở chế độ xem thường.
   *
   * Đo được 07/09/2026: server giữ 126 huyệt chấm tay, chúng đè lên toạ độ engine ở MỌI chế độ, còn
   * ĐƯỜNG KINH thì luôn vẽ từ dữ liệu engine (meridian-paths.js). Hai thứ tách nhau ngay trên màn hình:
   * 513/670 chấm cách ống của chính mình quá 1cm, xa nhất LR14 9,85cm — đúng cái người dùng nhìn thấy
   * và báo "huyệt không nối với đường kinh". Bản thân 126 toạ độ ấy lệch engine trung bình 4,63cm, và
   * thua engine ở hai bộ kiểm độc lập (kiểm vùng 2 sai vs 0; quan hệ giải phẫu hỏng 2 luật vs 71/71).
   *
   * Nay mặc định vẽ theo ENGINE. Chấm tay vẫn còn nguyên trên server và trong bộ nhớ — bật chế độ
   * Chấm Tay là thấy lại ngay, kéo thả và lưu vẫn chạy như cũ. Không xoá gì cả. */
  const dungChamTay = () => editMode;

  // toạ độ vẽ: (khi đang chỉnh) CHẤM TAY → SUY RA (tầng 2) → toạ độ engine.
  function coordOf(code) {
    if (dungChamTay()) {
      const u = userPlaced[code];
      if (u) return { x: u.x, y: u.y, z: u.z, snap: false, q: 'exact', anchor: true, user: true };
      const d = derived[code];
      if (d) return { x: d.x, y: d.y, z: d.z, snap: true, q: 'exact', derived: true };
    }
    return placed[code];
  }

  // ---- TẦNG 2: rải các huyệt giữa 2 CHỐT theo tỉ lệ thốn (chạy ngay trong trình duyệt) ----
  function deriveMeridian(mer) {
    const sp = SPACING[mer]; if (!sp) return;
    const codes = Object.keys(placed).filter(c => merOf(c) === mer).sort((a, b) => numOf(a) - numOf(b));
    const ctrl = codes.filter(c => userPlaced[c]);          // điểm CHỐT (bạn đã chấm)
    for (const c of codes) delete derived[c];               // xoá suy-ra cũ của kinh này
    if (ctrl.length < 2) return;                            // cần ≥ 2 chốt mới rải được
    for (let k = 0; k < ctrl.length - 1; k++) {
      const A = ctrl[k], B = ctrl[k + 1], pa = userPlaced[A], pb = userPlaced[B];
      const ca = sp[A] != null ? sp[A] : 0, cb = sp[B] != null ? sp[B] : 1, span = cb - ca;
      const ia = codes.indexOf(A), ib = codes.indexOf(B);
      for (let i = ia + 1; i < ib; i++) {
        const P = codes[i];
        let t = Math.abs(span) > 1e-6 ? ((sp[P] != null ? sp[P] : 0) - ca) / span : (i - ia) / (ib - ia);
        t = Math.max(0, Math.min(1, t));
        derived[P] = { x: pa.x + (pb.x - pa.x) * t, y: pa.y + (pb.y - pa.y) * t, z: pa.z + (pb.z - pa.z) * t };
      }
    }
  }
  function deriveAll() { for (const m of presentMer) deriveMeridian(m); }
  // world ↔ chuẩn-hoá (nghịch đảo limbPoint): x=wx/H, y=(wy-minY)/H, z=wz/H
  function worldToNorm(p) { return { x: +(p.x / bodyHeight).toFixed(4), y: +((p.y - bodyMinY) / bodyHeight).toFixed(4), z: +(p.z / bodyHeight).toFixed(4) }; }

  // Nguồn CHUẨN danh sách/thứ tự/tên huyệt: window.MERIDIANS (module Kinh mạch).
  // map3d không tự liệt kê huyệt — lấy tên & tổng số huyệt mỗi kinh từ đây để 2 module đồng bộ.
  const MER = window.MERIDIANS;
  const merName = {};   // code -> tên huyệt (vd "LU1" -> "Trung Phủ")
  const merTotal = {};  // mã kinh -> tổng số huyệt cổ điển
  if (MER) [...(MER.kinh || []), ...(MER.circuits || [])].forEach(g => {
    if (!g.code) return;
    merTotal[g.code] = (g.points || []).length;
    (g.points || []).forEach(p => { if (p.code) merName[p.code] = p.ten; });
  });
  // Tra record huyệt từ mã. acu-index.js (codeToId) còn SÓT ~31 huyệt (GV9 Chí Dương, GV14 Đại Chùy,
  // LU1 Trung Phủ, LU5 Xích Trạch…) → khi thiếu mã, khớp theo TÊN trong kinh (merName, giống acuByName).
  const foldName = s => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
  const nameToId = {};
  ACU.records.forEach(r => { const k = foldName(r.ten); if (k && nameToId[k] == null) nameToId[k] = r.id; });
  const idOf = code => { const id = INDEX.codeToId[code]; return id != null ? id : nameToId[foldName(merName[code] || code)]; };
  const recOf = code => recById.get(idOf(code));
  // TÊN hiển thị: ưu tiên tên CHUẨN trong Từ Điển (đúng huyệt + Title Case, đã rà soát khớp mã 100%);
  // thiếu record mới dùng tên trong kinh. Nhờ vậy nhãn 3D đồng nhất với Từ Điển, sửa luôn ~8 tên kinh sai
  // (KI17, GB24/25/27, GV7/20, CV3, BL36) và ~290 chỗ lệch hoa/thường — KHÔNG phải sửa rải rác trong meridians.js.
  const nameOf = code => { const r = recOf(code); return (r && r.ten) || merName[code] || code; };

  // ===== HƯỚNG CHÂM: đọc trường CHÂM CỨU → góc châm + độ sâu + hướng mũi kim =====
  // Kim KHÔNG còn cứng nhắc ⟂ da: chỉ NGẢ khi sách ghi rõ hướng (luồn/xiên về phía X);
  // không rõ hướng thì giữ ⟂ da (an toàn). Tham số đọc trực tiếp từ ACUPOINTS lúc chạy.
  const codeByName = {};                                   // tên huyệt (chuẩn hoá) -> mã, để giải "hướng tới huyệt X"
  for (const c in merName) { const k = norm(merName[c]); if (k) codeByName[k] = c; }
  const _nameKeys = Object.keys(codeByName).sort((a, b) => b.length - a.length);   // khớp tên DÀI nhất trước
  const _toNum = s => parseFloat(s.replace(',', '.'));
  function parseDepth(t) {                                 // "sâu N – M thốn" → giá trị giữa
    const m = t.match(/(\d+(?:[.,]\d+)?)\s*(?:[-–—]\s*(\d+(?:[.,]\d+)?))?\s*thon/);
    if (!m) return null;
    const lo = _toNum(m[1]), hi = m[2] ? _toNum(m[2]) : lo;
    return (lo + hi) / 2;
  }
  function findTargetCode(tail) {                          // huyệt ĐÍCH (đã có toạ độ) nhắc trong cụm hướng
    for (const name of _nameKeys)
      if (name.length >= 3 && tail.includes(name) && placed[codeByName[name]]) return codeByName[name];
    return null;
  }
  // bắt cụm "hướng / luồn / châm … <đích>" rồi soi 34 ký tự kế → đích là huyệt hay hướng tổng quát
  // Đọc HƯỚNG mũi kim từ 1 đoạn mô tả: ưu tiên "tới huyệt X" (đã có toạ độ), rồi tới hướng giải phẫu.
  function aimFromText(t) {
    const tc = findTargetCode(t); if (tc) return { type: 'point', code: tc };
    if (/cot song|dot song/.test(t)) return { type: 'dir', dir: 'spine' };
    if (/chech xuong|xuong duoi|huong xuong|mui kim xuong|ve phia duoi/.test(t)) return { type: 'dir', dir: 'caudad' };
    if (/chech len|len tren|huong len|mui kim len|ve phia tren/.test(t)) return { type: 'dir', dir: 'cephalad' };
    if (/ra sau|phia sau/.test(t)) return { type: 'dir', dir: 'posterior' };
    if (/ra truoc|phia truoc/.test(t)) return { type: 'dir', dir: 'anterior' };
    if (/vao trong|phia trong/.test(t)) return { type: 'dir', dir: 'medial' };
    if (/ra ngoai|phia ngoai/.test(t)) return { type: 'dir', dir: 'lateral' };
    return null;
  }
  const _NEEDLE_TILT = { oblique: Math.PI / 4, transverse: 70 * Math.PI / 180 };   // góc NGẢ so với pháp tuyến da
  const DIR_LABEL = { cephalad: 'lên trên', caudad: 'xuống dưới', medial: 'vào trong', lateral: 'ra ngoài', anterior: 'ra trước', posterior: 'ra sau', spine: 'về cột sống' };
  const _needleCache = {};
  function needleSpec(code) {
    if (code in _needleCache) return _needleCache[code];
    const rec = recOf(code);
    const raw = rec ? sec(rec, 'cham cuu') : '';
    const t = norm(raw), primary = t.split('.')[0];        // câu đầu = thủ pháp CHÍNH
    let angle = null;
    if (/thang|vuong goc/.test(primary)) angle = 'perp';   // "thẳng" ƯU TIÊN (gồm cả "thẳng hoặc xiên") → ⟂ da
    else if (/luon|duoi da|cham ngang|nam ngang|song song/.test(primary)) angle = 'transverse';
    else if (/xien|chech|chenh/.test(primary)) angle = 'oblique';
    const aim = aimFromText(primary);                       // hướng đọc từ CÂU ĐẦU (thủ pháp chính)
    // Ngả theo GÓC: xiên ~45°, luồn ~70°, còn lại ⟂ da. Hướng ngả theo `aim`; nếu xiên/luồn mà câu đầu
    // KHÔNG ghi hướng → placeNeedle tự ngả DỌC đường kinh (meridianTangent).
    const tilt = angle === 'transverse' ? _NEEDLE_TILT.transverse
      : angle === 'oblique' ? _NEEDLE_TILT.oblique : 0;
    return (_needleCache[code] = { angle, aim, tilt, depth: parseDepth(t), raw });
  }

  const hidden = new Set();
  /* flowOn: hạt sáng chạy dọc đường kinh (nút ✦). BẬT SẴN theo yêu cầu người dùng — đây là trang
   * kinh mạch, dòng khí chạy chính là thứ cho thấy CHIỀU đi của mỗi kinh ngay khi mở lên, không phải
   * hiệu ứng trang trí. Đánh đổi: vòng animate không còn nghỉ khi rảnh (render-on-demand coi flowOn
   * là "đang có hoạt cảnh"), máy yếu sẽ chạy liên tục — tắt bằng nút ✦ nếu cần cho nhẹ. */
  let selectedCode = null, flowOn = true, mirrorOn = true, focusMer = null;   // focusMer: kinh đang chọn
  // huyệt 12 kinh đối xứng 2 bên; chỉ CV/GV nằm trên đường giữa → KHÔNG soi gương.
  const isBilateral = mer => mer !== 'CV' && mer !== 'GV';

  // ---- Lớp giải phẫu (bóc tách Da · Cơ · Xương) ----
  // Mỗi mesh của model được gán 1 lớp theo TÊN node/collection (đi ngược cây cha).
  // Model 1-mesh hiện tại không khớp tên cơ/xương -> rơi về 'skin' => vẫn chạy y như cũ.
  // Khi xuất model Z-Anatomy: đặt tên collection top-level đúng "skin" / "muscle" / "bone".
  // TẤT CẢ 15 hệ giải phẫu đứng NGANG HÀNG nhau — giống hệt bản demo Human Atlas (Systems panel:
  // mỗi hệ 1 công tắc bật/tắt, không phân biệt "lõi"/"phụ"). Da/Cơ/Xương KHÔNG còn đặc quyền đứng
  // yên — bóc tách (Explode) áp dụng cho CẢ 15 hệ như nhau, "từ ngoài (da) vào trong" đúng như góp
  // ý người dùng. CHỈ RIÊNG "Da" có 2 điểm đặc biệt (xem thêm ở applyExplode()/rebuildAcuOverlay()):
  //  1) vật liệu trong mờ cố định (giống materialFor() của scene.tsx: system==='integumentary' thì
  //     opacity .12, không phải màu đục như các hệ khác) — để nhìn xuyên thấy khi bật cùng lúc.
  //  2) Huyệt + đường kinh (Kinh Lạc) COI LÀ CÙNG 1 LỚP với Da — không có mesh riêng, không tự
  //     "bóc tách" theo part, mà bám theo ĐÚNG độ lệch hiện tại của Da (Da chỉ có 1 part duy nhất
  //     "Skin" nên chỉ có 1 vector lệch — cộng thẳng vào cả khối huyệt/đường kinh mỗi khi Da di
  //     chuyển, y hệt việc "da mang huyệt đi theo" khi bóc tách).
  // Màu SAO CHÉP ĐÚNG hex từ app/anatomy.ts (SYSTEMS[].color) của bản demo gốc — trước đây tự chọn
  // màu gần đúng, giờ khớp CHÍNH XÁC (trừ Da — xem ghi chú "trông thật giống da người" ở material
  // lúc tạo mesh trong loadModel(), người dùng yêu cầu KHÁC bản demo ở đúng chỗ đó).
  const LAYERS = [
    { id: 'bone',   label: 'Xương', color: 0xe2d9ba, match: /(^|[_\-\s.])(bone|skelet|osseous|vertebr|cranium|skull|costa|pelvis|femur)/i },
    { id: 'muscle', label: 'Cơ',    color: 0xa85b50, match: /(^|[_\-\s.])(muscle|musc|musculus|myo)/i },
    { id: 'cardiac',      label: 'Tim',         color: 0xb96760, match: /(^|[_\-\s.])(cardiac)/i },
    { id: 'sensory',      label: 'Giác Quan',   color: 0xb0c8ce, match: /(^|[_\-\s.])(sensory)/i },
    { id: 'arterial',     label: 'Động Mạch',   color: 0xc05245, match: /(^|[_\-\s.])(arterial)/i },
    { id: 'venous',       label: 'Tĩnh Mạch',   color: 0x527c9f, match: /(^|[_\-\s.])(venous)/i },
    { id: 'nervous',      label: 'Thần Kinh',   color: 0xd8b565, match: /(^|[_\-\s.])(nervous)/i },
    { id: 'respiratory',  label: 'Hô Hấp',      color: 0xb98991, match: /(^|[_\-\s.])(respiratory)/i },
    { id: 'digestive',    label: 'Tiêu Hoá',    color: 0xb8916b, match: /(^|[_\-\s.])(digestive)/i },
    { id: 'urinary',      label: 'Tiết Niệu',   color: 0xb47961, match: /(^|[_\-\s.])(urinary)/i },
    { id: 'lymphatic',    label: 'Bạch Huyết',  color: 0x879f7c, match: /(^|[_\-\s.])(lymphatic)/i },
    { id: 'endocrine',    label: 'Nội Tiết',    color: 0xc5a09a, match: /(^|[_\-\s.])(endocrine)/i },
    { id: 'reproductive', label: 'Sinh Dục',    color: 0xbda098, match: /(^|[_\-\s.])(reproductive)/i },
    { id: 'skin',   label: 'Da',    color: 0xe0ac8b, match: /(^|[_\-\s.])(skin|body|surface|integument|da)/i, skin: true },
    { id: 'connective',   label: 'Mô Liên Kết', color: 0xaec3bb, match: /(^|[_\-\s.])(connective)/i },
  ];
  // Mô tả ngắn từng hệ, hiện trong panel khi chọn một bộ phận (giống bản demo Human Atlas — mô tả
  // đi theo HỆ chứ không theo từng khối, vì dữ liệu gốc không kèm mô tả cho từng cấu trúc).
  const SYS_DESC = {
    bone:   'Xương tạo bộ khung nâng đỡ cơ thể, bảo vệ nội tạng và làm điểm bám cho cơ. Trong xương còn có tuỷ sinh máu và kho dự trữ khoáng chất.',
    muscle: 'Cơ vân tạo cử động bằng cách kéo vào chỗ bám của nó. Cùng với gân, cơ làm khớp cử động, giữ vững tư thế và sinh nhiệt cho cơ thể.',
    cardiac: 'Tim là khối cơ rỗng bơm máu đi khắp cơ thể. Bốn buồng tim cùng hệ van giữ cho máu chảy một chiều, không trào ngược.',
    sensory: 'Các cơ quan giác quan thu nhận tín hiệu từ bên ngoài — ánh sáng, âm thanh, mùi, vị, xúc giác — rồi chuyển thành xung thần kinh gửi về não.',
    arterial: 'Động mạch dẫn máu từ tim đi nuôi các mô. Thành động mạch dày và đàn hồi để chịu được áp lực mỗi nhịp tim đập.',
    venous: 'Tĩnh mạch đưa máu từ các mô trở về tim. Thành mỏng hơn động mạch, nhiều tĩnh mạch có van một chiều chống máu chảy ngược.',
    nervous: 'Hệ thần kinh dẫn truyền tín hiệu giữa não, tuỷ sống và toàn thân, điều khiển vận động, cảm giác và các hoạt động tự động của cơ thể.',
    respiratory: 'Đường hô hấp đưa không khí vào phổi để trao đổi khí: nhận oxy vào máu và thải khí cacbonic ra ngoài.',
    digestive: 'Ống tiêu hoá và các tuyến kèm theo nghiền nhỏ, phân giải thức ăn để hấp thu dưỡng chất, phần bã còn lại được thải ra ngoài.',
    urinary: 'Hệ tiết niệu lọc máu tạo nước tiểu, thải chất cặn và giữ cân bằng nước, muối khoáng cho cơ thể.',
    lymphatic: 'Hệ bạch huyết dẫn dịch từ khoảng gian bào trở về máu, đồng thời là nơi các tế bào miễn dịch hoạt động chống lại tác nhân gây bệnh.',
    endocrine: 'Các tuyến nội tiết tiết hormone thẳng vào máu, điều hoà chuyển hoá, tăng trưởng, sinh sản và phản ứng của cơ thể với căng thẳng.',
    reproductive: 'Cơ quan sinh dục đảm nhiệm việc sinh sản: tạo giao tử và tiết các hormone sinh dục.',
    skin: 'Da là lớp bao phủ ngoài cùng, che chắn cơ thể khỏi tổn thương và mất nước, điều hoà thân nhiệt và là nơi tiếp nhận cảm giác.',
    connective: 'Mô liên kết gồm mạc, dây chằng và các lớp đệm, có nhiệm vụ nối, bọc và nâng đỡ các cấu trúc khác trong cơ thể.',
  };
  const LBY = Object.fromEntries(LAYERS.map(L => [L.id, L]));
  // Thứ tự CHUẨN 15 hệ của app/anatomy.ts (SYSTEMS[]) — QUYẾT ĐỊNH góc toả tia lúc bóc tách
  // (scene.tsx: `SYSTEMS.findIndex(sys=>sys.id===p.system)`). PHẢI khớp đúng thứ tự này (không phải
  // thứ tự hiển thị LAYERS ở trên) để mỗi hệ toả đúng hướng như bản demo.
  const SYS_ORDER = ['bone', 'muscle', 'cardiac', 'sensory', 'arterial', 'venous', 'nervous', 'respiratory', 'digestive', 'urinary', 'lymphatic', 'endocrine', 'reproductive', 'skin', 'connective'];
  const layerMats = {}, layerMeshes = {};               // id -> [material,…] / [mesh,…]
  // MẶC ĐỊNH giống hệt DEFAULT_VISIBLE của anatomy.ts (bản demo): TẤT CẢ hệ giải phẫu BẬT SẴN,
  // CHỈ riêng Da tắt sẵn (để mặc định nhìn thấy ngay bên trong, giống atlas) — huyệt/đường kinh
  // (không nằm trong LAYERS, xử lý riêng ở acuLayerOn) BẬT SẴN vì là mục đích chính của trang này.
  /* MẶC ĐỊNH bật ĐÚNG 4 lớp, theo thứ tự người dùng chốt: CƠ · XƯƠNG · KINH LẠC · DA (cũng chính
   * là thứ tự 4 dòng ghim đầu panel, xem PIN_ORDER). Không bật cả 16 hệ như bản demo: đường kinh sẽ
   * chìm nghỉm giữa 639 động mạch, 404 tĩnh mạch và 139 thần kinh — tất cả cùng vẽ dạng đường màu,
   * cùng vùng không gian, mà đường kinh lại mảnh hơn ("không thấy đường kinh").
   * DA TẮT SẴN (đúng DEFAULT_VISIBLE của bản demo): lớp da trong mờ phủ lên tất cả làm cả mô hình
   * "mờ sương", cơ mất tương phản — người dùng so với Human Atlas và chê đúng chỗ đó. Không có da,
   * đường kinh (nằm ở CAO ĐỘ mặt da, tức ngoài cơ) vẫn ôm sát thân, lại nổi hẳn lên trên nền cơ đỏ.
   * Bật da lại là 1 cú bấm, và khi bật nó đục hơn hẳn để ra dáng LỚP DA thật (xem material bên dưới). */
  const MAC_DINH_BAT = new Set(['muscle', 'bone']);
  const layerState = Object.fromEntries(LAYERS.map(L => [L.id, MAC_DINH_BAT.has(L.id) ? 1 : 0]));
  let acuLayerOn = true;                                // huyệt + đường kinh (Kinh Lạc) coi như 1 "lớp" riêng, ngoài LAYERS
  let skinTargets = [];                                 // mesh để bắn tia đặt huyệt (chỉ lớp da)

  // ---- THREE state ----
  let scene, camera, renderer, controls, raycaster, modelRoot, bodyMinY = 0, bodyHeight = BODY_H, modelScale = 1;
  // Tâm dọc thân THEO TOẠ ĐỘ GỐC glTF (chưa scale/dịch modelRoot) — offset bóc tách CỘNG THẲNG vào
  // "transformed" trong vertex shader, tức TRƯỚC KHI modelRoot.scale/position áp dụng (xem
  // attachExplodeShader() + applyExplode()) — nên mốc quy chiếu (thay cho hằng số .85 của scene.tsx,
  // vốn là tâm dọc thân theo toạ độ gốc atlas.json của HỌ) PHẢI lấy từ box TRƯỚC lúc canh tâm+co
  // giãn modelRoot (bodyMinY/bodyHeight ở trên là toạ độ SAU, world-space — dùng nhầm ở đây sẽ lệch
  // đúng bằng độ dịch modelRoot.position, có thể cả mét). Gán giá trị thật trong loadModel().
  let localMidY = BODY_H * 0.5;
  const dotMeshes = [], dotByCode = {}, lineByMer = {}, flowByMer = {};
  const dotsGroup = new THREE.Group(), linesGroup = new THREE.Group(), flowGroup = new THREE.Group(), needleGroup = new THREE.Group();
  let inited = false, hovered = null, contactShadow = null;
  let _dotGeo = null, _dotR = 0;                        // hình cầu chấm huyệt dùng chung (1 lần)
  const mouse = new THREE.Vector2();
  const clock = (typeof performance !== 'undefined') ? () => performance.now() / 1000 : () => 0;

  // ---- texture tiện ích (vẽ bằng canvas, không cần asset) ----
  function glowTex() {
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const g = c.getContext('2d'), rad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    rad.addColorStop(0, 'rgba(255,255,255,1)');
    rad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    rad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rad; g.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  const GLOW = glowTex();

  // ĐỔI HỆ MÀU sRGB -> tuyến tính. Bản three nhúng là r128 — ĐỜI TRƯỚC khi có THREE.ColorManagement
  // (r139+), nên nó KHÔNG tự hiểu mã màu hex là màu sRGB: nó ném thẳng 0xa85b50 vào phép tính ánh
  // sáng như thể đã tuyến tính rồi. Kết quả là mọi thứ sáng bệch, mất bão hoà — cơ ra hồng nhợt,
  // xương trắng bệch, nhìn không phân biệt nổi mô nào (đúng phản ánh của người dùng). Bản demo chạy
  // three đời mới nên tự đổi hệ; muốn ra ĐÚNG màu của họ từ CÙNG mã hex thì phải tự đổi ở đây.
  const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();

  // "Phòng chụp" tối giản thay cho RoomEnvironment (three/examples — KHÔNG có trong bản three nhúng):
  // 1 hộp bao lật mặt trong màu trắng ngà + 3 tấm phát sáng (MeshBasicMaterial đặt color > 1 để thành
  // nguồn sáng khi nướng PMREM). Chỉ dùng các lớp có trong bản nhúng: Scene/BoxGeometry/Mesh/
  // MeshStandardMaterial/MeshBasicMaterial/PMREMGenerator.
  function studioEnvTexture(rnd) {
    const env = new THREE.Scene(), geo = new THREE.BoxGeometry();
    if (geo.deleteAttribute) geo.deleteAttribute('uv');
    const room = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ side: THREE.BackSide, color: 0xf3f2f0, roughness: 1, metalness: 0 }));
    room.scale.set(20, 16, 20); room.position.set(0, 8, 0); env.add(room);
    const panel = v => { const m = new THREE.MeshBasicMaterial(); m.color.setScalar(v); return m; };
    const mk = (v, pos, scl) => { const m = new THREE.Mesh(geo, panel(v)); m.position.set(pos[0], pos[1], pos[2]); m.scale.set(scl[0], scl[1], scl[2]); env.add(m); };
    mk(7.0, [-9, 11, 3], [0.2, 5, 6]);     // tấm sáng chính bên trái (cùng phía đèn key)
    mk(3.4, [9, 10, -3], [0.2, 5, 6]);     // tấm phụ bên phải
    mk(8.0, [0, 15.6, 0], [9, 0.2, 9]);    // trần sáng
    const pm = new THREE.PMREMGenerator(rnd);
    const tex = pm.fromScene(env, 0.04).texture;
    pm.dispose();
    env.traverse(o => { if (o.material) o.material.dispose(); });
    geo.dispose();
    return tex;
  }

  // gán 1 mesh vào lớp giải phẫu theo tên node/collection (đi ngược cây cha); không khớp -> 'skin'
  function layerOf(obj) {
    for (let n = obj; n; n = n.parent) {
      const nm = n.name || '';
      for (const L of LAYERS) if (L.match.test(nm)) return L.id;
    }
    return 'skin';
  }

  function initScene() {
    if (inited) return; inited = true;
    scene = new THREE.Scene();
    // NỀN TRUNG TÍNH PHẲNG như bản demo (setClearColor('#f2f3f3')) — nền gradient xanh cũ hắt màu
    // lạnh lên toàn bộ mô hình, làm đỏ cơ ngả hồng nhạt và xương ngả xám.
    scene.background = new THREE.Color(0xf2f3f3);
    const w = stage.clientWidth || 800, h = stage.clientHeight || 600;
    camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 100);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));   // cap DPR → đỡ tốn pixel trên màn hi-DPI
    renderer.setSize(w, h);
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if ('outputEncoding' in renderer && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    // TONE MAPPING — thứ QUYẾT ĐỊNH màu "đậm đà" của bản demo (scene.tsx: ACESFilmic + exposure 1.12).
    // Không có nó, vùng được chiếu sáng bị cắt cụt ở 1.0: kênh đỏ của cơ (0xa85b50) chạm trần trước,
    // xanh lục/lam vẫn tăng tiếp → màu TRÔI DẦN VỀ TRẮNG, mất bão hoà → cơ hồng nhợt, xương trắng bệch,
    // nhìn không phân biệt nổi mô nào với mô nào (đúng phản ánh của người dùng).
    if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; }
    stage.appendChild(renderer.domElement);

    // MÔI TRƯỜNG (IBL): bản demo dùng RoomEnvironment của three/examples — bản three nhúng sẵn trong
    // app KHÔNG có lớp đó, nên tự dựng 1 "phòng chụp" tối giản tương đương rồi nướng qua
    // PMREMGenerator. Đây là nguồn sáng GIÁN TIẾP cho MeshStandardMaterial: thiếu nó thì vật liệu chỉ
    // nhận ánh sáng trực tiếp, bề mặt bệt và xỉn, không ra chất mô.
    scene.environment = studioEnvTexture(renderer);

    // Ánh sáng theo đúng BỐ CỤC của scene.tsx (bán cầu + key ấm chếch trái-trên-trước + rim lạnh sau
    // phải), BỎ đèn fill cũ. Cường độ KHÔNG bê nguyên số của họ: bản three nhúng ở đây còn dùng lối
    // chiếu sáng cũ (physicallyCorrectLights=false), sáng hơn lối mới của họ khoảng π lần cùng một
    // con số — bê nguyên sẽ cháy trắng. Đã hạ theo tỉ lệ và soi ảnh chụp để chốt.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa7acb2, 0.42));
    const key = new THREE.DirectionalLight(0xfffaf4, 0.95); key.position.set(-2, 4, 3); scene.add(key);
    const rim = new THREE.DirectionalLight(0xe9f0ff, 0.62); rim.position.set(2, 2, -3); scene.add(rim);
    scene.add(dotsGroup); scene.add(linesGroup); scene.add(flowGroup); scene.add(needleGroup);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 0.6; controls.maxDistance = 8;
    raycaster = new THREE.Raycaster();

    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('pointerdown', onEditDown);
    renderer.domElement.addEventListener('pointerup', onEditUp);
    // RENDER THEO NHU CẦU: mọi thao tác → "đánh thức" vẽ trong ~0,4s sau đó (kể cả damping xoay)
    ['pointerdown', 'pointermove', 'pointerup', 'wheel'].forEach(ev => renderer.domElement.addEventListener(ev, wake, { passive: true }));
    controls.addEventListener('change', wake);
    const ro = new ResizeObserver(() => { onResize(); wake(); }); ro.observe(stage);

    loadModel();
    animate();
  }

  let fitSphere = null;
  // 4 góc nhìn đặt sẵn — hướng LẤY ĐÚNG scene.tsx (fit(): front (0,.02,1) · back (0,.02,-1) ·
  // side (1,.02,0) · three-quarter (.35,.06,1) chuẩn hoá).
  const VIEW_DIRS = {
    'three-quarter': [0.35, 0.06, 1],
    front: [0, 0.02, 1],
    back: [0, 0.02, -1],
    side: [1, 0.02, 0],
  };
  let viewMode = 'three-quarter', rotateOn = false;
  function viewDir(v) {
    const d = VIEW_DIRS[v] || VIEW_DIRS['three-quarter'];
    return new THREE.Vector3(d[0], d[1], d[2]).normalize();
  }
  // Hệ số lề: 1.15 chừa lề rộng quanh mô hình → trên khung nhúng (thấp hơn trang full-screen của
  // bản demo) người xem thấy thân người nhỏ thỏm giữa nhiều khoảng trống. 1.04 cho mô hình ăn gần
  // trọn chiều cao khung, đúng tỉ lệ Human Atlas, vẫn chừa đủ để không cụt đầu/chân khi xoay.
  function camDistFor(sph) { return (sph.radius / Math.sin(camera.fov * Math.PI / 360)) * 1.09; }
  function fitBall() {
    if (!fitSphere && modelRoot) fitSphere = new THREE.Box3().setFromObject(modelRoot).getBoundingSphere(new THREE.Sphere());
    return fitSphere || new THREE.Sphere(new THREE.Vector3(0, bodyHeight * 0.5, 0), bodyHeight * 0.6);
  }
  function resetView() {
    const sph = fitBall(), dist = camDistFor(sph);
    controls.minDistance = sph.radius * 0.25;
    controls.maxDistance = sph.radius * 8;
    // #map/back trong URL vẫn được tôn trọng (link cũ từ nơi khác trỏ thẳng vào mặt sau)
    if (/#map\/back/.test(location.hash)) viewMode = 'back';
    camera.position.copy(sph.center).addScaledVector(viewDir(viewMode), dist);
    camera.position.y += sph.radius * 0.05;
    controls.target.copy(sph.center);
    controls.update();
    renderViewButtons();
  }
  // Đổi góc nhìn: BAY MƯỢT tới thay vì nhảy cóc, và tắt tự xoay (đúng demo — mỗi lần chọn góc nhìn
  // đều kèm `rotate:false`).
  function setView(v) {
    viewMode = v;
    if (rotateOn) setRotate(false);
    const sph = fitBall(), dist = camDistFor(sph);
    const tgt = sph.center.clone();
    const pos = tgt.clone().addScaledVector(viewDir(v), dist); pos.y += sph.radius * 0.05;
    camAnim = { fromPos: camera.position.clone(), toPos: pos, fromTgt: controls.target.clone(), toTgt: tgt, t0: clock(), dur: 0.6 };
    renderViewButtons();
    wake();
  }
  function setRotate(on) {
    rotateOn = !!on && explodeAmount < 0.4 && !isolateOn;   // demo khoá tự xoay khi đã bóc tách ≥40%
    if (controls) { controls.autoRotate = rotateOn; controls.autoRotateSpeed = 0.65; }
    renderViewButtons();
    wake();
  }
  // Bóc tách sâu thì các mảnh nằm phẳng trên mặt phẳng z=0 — nhìn nghiêng/nhìn sau chỉ còn thấy một
  // vạch, nên demo KHOÁ 3 nút kia khi >80% (chỉ chừa "Trước"), và khoá tự xoay từ 40%.
  function renderViewButtons() {
    const lockViews = explodeAmount > 0.8, lockRotate = explodeAmount >= 0.4 || isolateOn;
    document.querySelectorAll('.acu3d .view-btn').forEach(b => {
      const v = b.dataset.view;
      b.classList.toggle('active', v === viewMode);
      b.disabled = lockViews && v !== 'front';
    });
    if (lockRotate && rotateOn) { rotateOn = false; if (controls) controls.autoRotate = false; }
    const rb = $('mapRotate');
    if (rb) { rb.classList.toggle('active', rotateOn); rb.disabled = lockRotate; }
  }

  // ---- Lùi camera ra cho vừa lưới "kệ hàng" khi bóc tách — port fit() của app/scene.tsx.
  // Bản demo LUÔN kéo camera theo mức bóc tách (`fit(view, Math.max(0,(amount-.3)/.7))`), nếu không
  // thì tới 100% người xem đứng lọt THỎM giữa đám mảnh, không thấy được toàn cảnh "danh mục giải
  // phẫu". `extent` 0 = khung thường, 1 = ôm trọn lưới. Chừa chỗ cho panel trái + dock dưới đúng
  // tinh thần reservedHeight/availableAspect của bản gốc, chỉ đổi số đo theo giao diện app này.
  function fitExplode(extent) {
    if (!camera || !controls) return;
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1, mobile = w < 768;
    if (!fitSphere && modelRoot) fitSphere = new THREE.Box3().setFromObject(modelRoot).getBoundingSphere(new THREE.Sphere());
    const sph = fitSphere || new THREE.Sphere(new THREE.Vector3(0, bodyHeight * 0.5, 0), bodyHeight * 0.6);
    const halfFov = camera.fov * Math.PI / 360;
    const normalDistance = (sph.radius / Math.sin(halfFov)) * 1.15;          // đúng khoảng cách resetView() vẫn dùng
    // lưới tính theo toạ độ LOCAL (offset cộng trong vertex shader) -> nhân modelScale ra world
    const gw = Math.max(0.001, packingWidth * modelScale), gh = Math.max(0.001, packingHeight * modelScale);
    const reservedH = mobile ? 190 : 130;                                     // dock "Bóc Tách" + dòng chú thích dưới
    const reservedW = mobile ? 24 : 320;                                      // panel Hệ Cơ Quan bên trái
    const availAspect = Math.max(0.35, (w - reservedW) / Math.max(160, h - reservedH));
    const atlasDistance = Math.max(gh, gw / availAspect) / (2 * Math.tan(halfFov)) * (h / Math.max(160, h - reservedH)) * 1.08;
    const distance = lerp(normalDistance, Math.max(0.2, atlasDistance), extent);
    controls.maxDistance = Math.max(sph.radius * 8, distance * 1.6);          // đừng để maxDistance chặn mất cú lùi
    const cy = bodyMinY + bodyHeight * 0.5;                                   // tâm lưới nằm ngang tầm giữa thân (destY = localMidY + cell.y)
    controls.target.set(0, cy, 0);
    // càng bóc tách càng xoay về CHÍNH DIỆN (lưới là mặt phẳng z=0, nhìn nghiêng sẽ thành 1 vạch)
    const dir = viewDir(viewMode).lerp(viewDir('front'), Math.min(1, extent * 1.6)).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, distance);
    controls.update();
    wake();
  }

  function addContactShadow() {
    const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
    const g = c.getContext('2d'), rad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    rad.addColorStop(0, 'rgba(40,50,60,0.45)');
    rad.addColorStop(0.6, 'rgba(40,50,60,0.18)');
    rad.addColorStop(1, 'rgba(40,50,60,0)');
    g.fillStyle = rad; g.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    const r = bodyHeight * 0.32;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(r * 2, r * 2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, bodyMinY + 0.001, 0);
    contactShadow = m; scene.add(m);
  }

  function loadModel() {
    setDrawer('<div class="dr-welcome"><p class="hint">Đang tải mô hình 3D…</p></div>');
    const loader = new THREE.GLTFLoader();
    if (window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);   // giải nén EXT_meshopt_compression (model đã tối ưu)
    loader.load(MODEL_URL, gltf => {
      modelRoot = gltf.scene;
      modelRoot.updateMatrixWorld(true);
      const _raw = new THREE.Box3().setFromObject(modelRoot), _rs = new THREE.Vector3(); _raw.getSize(_rs);
      // Mặc định coi mô hình là Y-up. Trục NHỎ NHẤT là độ dày trước-sau;
      // chỉ khi Y là trục nhỏ nhất (Y = độ dày) thì model mới chưa đứng -> xoay.
      const _min = Math.min(_rs.x, _rs.y, _rs.z);
      if (_rs.y === _min) {
        if (_rs.z >= _rs.x) modelRoot.rotation.x = -Math.PI / 2; // Z-up
        else modelRoot.rotation.z = Math.PI / 2;                 // X-up
      }
      modelRoot.updateMatrixWorld(true);
      // ép về tư thế bind (raycast skinned-mesh dùng hình bind nên hình hiển thị phải khớp)
      skinTargets = [];
      for (const k in layerMats) delete layerMats[k];
      for (const k in layerMeshes) delete layerMeshes[k];
      modelRoot.traverse(o => {
        if (o.isSkinnedMesh && o.skeleton) o.skeleton.pose();
        if (o.isMesh) {
          const id = layerOf(o), L = LBY[id];
          if (id === 'skin') {
            // ─── DA NGƯỜI ───
            // ĐỤC HẲN (opacity 1, transparent:false). Bản 0.82 vẫn để lọt khối cơ/xương bên dưới, mà
            // độ dày da mỗi chỗ mỗi khác nên mặt da loang lổ từng mảng sáng-tối — đúng chỗ người dùng
            // chê "rất thô". Da thật KHÔNG trong: muốn nhìn vào trong thì TẮT lớp Da (đúng cách bản
            // demo làm), chứ không phải làm da mờ đi.
            // MỊN TRƠN, không vân: đã thử thêm vi chi tiết (vân + lỗ chân lông sinh bằng nhiễu 3D,
            // vì mesh da không có UV nên không dán được texture) — kết quả bị chê ngay "ghê quá, như
            // da bị bệnh": ở cỡ nhìn toàn thân, chi tiết cỡ dưới 1 pixel chỉ thành hạt lấm tấm. Bề
            // mặt trơn một màu là thứ ĐÚNG cho cỡ nhìn này (giống hình người ở trang Kết Quả Đo).
            // polygonOffset ÂM: đẩy mặt da về phía trước trong depth-buffer để luôn thắng z-fight với
            // cơ nằm sát ngay dưới (các hệ khác dùng offset dương +1, xem nhánh else).
            // roughness cao (da tán xạ, không bóng gương) + clearcoat mỏng & nhám (màng ẩm tự nhiên);
            // emissive nâu-đỏ rất tối làm vùng tối ngả ấm thay vì xám chì — mẹo giả tán xạ dưới da,
            // vì three r128 không có subsurface scattering.
            o.material = new THREE.MeshPhysicalMaterial({
              color: srgb(0xe3b191), roughness: 0.68, metalness: 0.0,
              clearcoat: 0.14, clearcoatRoughness: 0.62,
              emissive: new THREE.Color(0x24100b), emissiveIntensity: 0.55,
              envMapIntensity: 0.72,
              side: THREE.DoubleSide, transparent: false, opacity: 1, depthWrite: true,
              polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
            });
          } else {
            // roughness/metalness ĐÚNG hằng số materialFor() của scene.tsx (0.53/0.08) — bản demo
            // dùng CHUNG 1 cặp giá trị cho cả 14 hệ còn lại, không chỉnh riêng từng hệ.
            o.material = new THREE.MeshStandardMaterial({ color: srgb(L.color), roughness: 0.53, metalness: 0.08, side: THREE.DoubleSide });
            // đẩy LÙI nhẹ trong depth-buffer để chỗ trùng/sát mặt da không bị z-fighting khi Da (mờ)
            // và hệ khác (đục) cùng hiện.
            o.material.polygonOffset = true; o.material.polygonOffsetFactor = 1; o.material.polygonOffsetUnits = 1;
          }
          // TẤT CẢ 15 hệ (kể cả Da/Cơ/Xương) đều gắn "vá" vertex-shader để dịch chuyển TỪNG ĐỈNH
          // theo lệch (dx,dy,dz) tra từ 1 DataTexture theo thuộc tính partindex (0-based, part thứ
          // mấy trong hệ — do backend/tmp/convert-human-atlas.mjs ghi vào _PARTINDEX lúc build).
          // Port từ app/scene.tsx (materialFor) của github.com/ashemag/human-atlas.
          //
          // ĐỔI TÊN THUỘC TÍNH — BẮT BUỘC: GLTFLoader đặt tên thuộc tính tuỳ chỉnh bằng
          // `ATTRIBUTES[name] || name.toLowerCase()` (vendor/GLTFLoader.js:943/950/3513), tức
          // '_PARTINDEX' -> '_partindex' — CÒN NGUYÊN dấu gạch dưới đầu, KHÔNG phải 'partindex'.
          // Shader khai báo `attribute float partindex` nên trước đây thuộc tính này KHÔNG hề được
          // gán: WebGL trả 0 cho mọi đỉnh -> mọi đỉnh đọc đúng texel 0 -> CẢ HỆ dịch chuyển như một
          // khối cứng theo lệch của part[0], không hề tách rời từng mảnh (đúng triệu chứng người
          // dùng báo: bộ xương/khối cơ vẫn nguyên vẹn khi kéo thanh Bóc Tách). Đổi tên tại đây thay
          // vì sửa shader để tránh hẳn chuyện GLSL kiêng dè định danh mở đầu bằng gạch dưới.
          if (o.geometry && o.geometry.attributes._partindex && !o.geometry.attributes.partindex) {
            o.geometry.setAttribute('partindex', o.geometry.attributes._partindex);
            o.geometry.deleteAttribute('_partindex');
          }
          // attachExplodeShader() định nghĩa ở khối Giai đoạn 3 bên dưới (cần offsetTex đã dựng
          // trước) — ở ĐÂY chỉ đánh dấu để gắn sau khi offsetTex sẵn sàng.
          o.userData.needsExplodeShader = true;
          (layerMats[id] = layerMats[id] || []).push(o.material);
          (layerMeshes[id] = layerMeshes[id] || []).push(o);
          o.userData.layer = id;
          if (id === 'skin') skinTargets.push(o);
          if (o.geometry && !o.geometry.attributes.normal) o.geometry.computeVertexNormals(); // model thiếu normals -> tô mượt
          o.frustumCulled = false;
        }
      });
      // canh tâm + tỉ lệ
      let box = new THREE.Box3().setFromObject(modelRoot);
      const size = new THREE.Vector3(); box.getSize(size);
      localMidY = box.min.y + size.y * 0.5;   // tâm dọc thân THEO TOẠ ĐỘ GỐC — chụp TRƯỚC khi scale/dịch (xem khai báo ở trên)
      const s = BODY_H / size.y; modelRoot.scale.setScalar(s); modelScale = s;
      modelRoot.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(modelRoot);
      const ctr = new THREE.Vector3(); box.getCenter(ctr);
      modelRoot.position.x -= ctr.x; modelRoot.position.z -= ctr.z; modelRoot.position.y -= box.min.y;
      modelRoot.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(modelRoot);
      bodyMinY = box.min.y; bodyHeight = box.max.y - box.min.y;
      // Chốt fitSphere NGAY ĐÂY, khi modelRoot còn thuần mesh giải phẫu. Nếu để tính lười (lần đầu
      // resetView/fitExplode gọi) thì lúc đó lớp chấm đánh dấu đã nằm trong modelRoot, mà chấm của
      // hệ đang TẮT bị đẩy ra toạ độ sentinel rất xa -> Box3.setFromObject nuốt luôn -> bán kính
      // khổng lồ -> camera lùi ra vô cực, màn hình trắng trơn.
      fitSphere = box.clone().getBoundingSphere(new THREE.Sphere());
      scene.add(modelRoot);

      // Giai đoạn 3 — dựng dữ liệu Bóc Tách (offset/texture/picker) cho CẢ 15 hệ (kể cả Da/Cơ/
      // Xương — không còn đứng ngoài), RỒI gắn shader vào material của các mesh đã đánh dấu ở trên
      // (cần offsetTex tồn tại trước khi gắn vì shader tham chiếu thẳng texture đó). Xem
      // prepareExplode()/attachExplodeShader() ở khối "Giai đoạn 3" phía dưới.
      LAYERS.forEach(L => prepareExplode(L));
      (layerMeshes && Object.values(layerMeshes).flat() || []).forEach(o => {
        if (o.userData.needsExplodeShader) { attachExplodeShader(o, LBY[o.userData.layer]); o.userData.needsExplodeShader = false; }
      });
      buildPartMarkers();
      // Bóc tách hỏng ÂM THẦM nếu thiếu thuộc tính này (cả hệ dịch như khối cứng, không có lỗi nào
      // nổ ra) — kêu to ở console để lần sau phát hiện ngay thay vì phải soi bằng mắt.
      for (const L of LAYERS) {
        const m = (layerMeshes[L.id] || [])[0];
        if (L.parts && L.parts.length > 1 && m && m.geometry && !m.geometry.attributes.partindex)
          console.warn('[kinhmach3d] Hệ "' + L.id + '" thiếu thuộc tính partindex — bóc tách sẽ dịch cả khối thay vì tách từng mảnh. Kiểm tra tên thuộc tính GLTFLoader tạo ra (_PARTINDEX -> ?).');
      }

      addContactShadow();
      // Cách A (tải nhanh + hết nhảy): KHÔNG đặt huyệt/đường kinh ngay ở đây nữa.
      // Ẩn lớp huyệt/đường kinh; loadUserAnchors() sẽ đặt CHÚNG ĐÚNG 1 LẦN ở vị trí cuối
      // (gold nếu có chốt · mặc định nếu không) rồi mới hiện → tránh đặt 2 lần (đỡ ~1/2 thời gian) + hết nhảy.
      dotsGroup.visible = false; linesGroup.visible = false;
      // Phao cứu sinh CUỐI (15s): nếu loadUserAnchors vì lỗi hiếm không tới được reveal, vẫn đặt 1 lần & hiện.
      setTimeout(() => { ensurePlacedOnce(); revealAcuOverlay('het-gio-luoi-cuoi'); }, 15000);
      loadUserAnchors();                 // tải chốt → căn → ĐẶT HUYỆT 1 LẦN → reveal (xem hàm bên dưới)
      applyVisibility();
      ensureSystemsPanel();
      applyLayers();
      applyExplode();
      resetView();
      drawerWelcome();
      updateCount();
      if (pendingFocus) { const c = pendingFocus, o = pendingOpts; pendingFocus = pendingOpts = null; setTimeout(() => focusPoint(c, o), 120); }
      // ACU_MODEL_READY (tắt MÀN CHỜ TO) dời vào revealAcuOverlay → giữ màn chờ tới khi huyệt SẴN SÀNG,
      // không hiện hình người trống. (Lần sau vào lại: cờ đã true nên không hiện màn chờ.)
    }, xhr => {
      // % tải model cho màn chờ to (đỡ sốt ruột). Chỉ khi server gửi Content-Length (xhr.total>0). Model đã
      // preload nên có thể nhảy nhanh tới ~99% rồi đứng chút lúc giải nén — vẫn rõ hơn là đứng im "Đang tải…".
      if (xhr && xhr.lengthComputable && xhr.total) {
        const pct = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
        setDrawer('<div class="dr-welcome"><p class="hint">Đang tải mô hình 3D… ' + pct + '%</p></div>');
        if (typeof window.ACU_ON_MODEL_PROGRESS === 'function') window.ACU_ON_MODEL_PROGRESS(pct);
      }
    }, err => {
      window.ACU_MODEL_READY = true;     // lỗi cũng phải tắt màn chờ, đừng để treo
      if (typeof window.ACU_ON_MODEL_READY === 'function') window.ACU_ON_MODEL_READY();
      setDrawer('<p class="empty-note">Không tải được mô hình 3D (' + esc(String(err && err.message || err)) + ').</p>');
    });
  }

  // ── CACHE toạ độ bề mặt (chống TREO + tải NHANH) ──
  // raycast "dán huyệt vào da" rất nặng (~3000 tia × 30K tam giác ≈ 9s/lần). Kết quả CHỈ phụ thuộc
  // toạ độ NGUỒN + mô hình (cố định trong phiên) → cache theo khoá = toạ độ nguồn. Nhờ vậy:
  //  • Lưu/căn chốt (rebuild) chỉ raycast lại VÀI huyệt đã đổi, phần còn lại lấy cache → HẾT TREO.
  //  • Lưu localStorage theo phiên-bản-build (ACU_ASSET_VER) → lần tải SAU (cùng build) khỏi raycast → TẢI NHANH.
  // AN TOÀN: khoá là toạ độ nguồn ĐẦY ĐỦ (không trùng khoá khác huyệt) + trả CLONE → KHÔNG lệch huyệt.
  const _ptCache = new Map();
  let _ptCacheLoaded = false, _ptCacheDirty = false;
  // 'v2' = đổi phép đặt chấm (giữ toạ độ engine thay vì chỗ tia rơi). Không đổi khoá thì trình duyệt
  // nạp lại cache CŨ và chấm vẫn nằm sai chỗ dù mã đã sửa.
  function _ptVerKey() { return 'acu3d_pts:v2:' + (window.ACU_ASSET_VER || '0'); }
  function _ptCacheLoad() {
    if (_ptCacheLoaded) return; _ptCacheLoaded = true;
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {       // dọn cache của các build CŨ (mỗi build 1 khoá)
        const k = localStorage.key(i);
        if (k && k.indexOf('acu3d_pts:') === 0 && k !== _ptVerKey()) localStorage.removeItem(k);
      }
      const raw = localStorage.getItem(_ptVerKey()); if (!raw) return;
      const o = JSON.parse(raw);
      for (const k in o) { const a = o[k]; if (a && a.length === 6) _ptCache.set(k, { pos: new THREE.Vector3(a[0], a[1], a[2]), n: new THREE.Vector3(a[3], a[4], a[5]) }); }
    } catch (e) { /* localStorage bị chặn/hỏng → bỏ qua, cache trong RAM vẫn chạy */ }
  }
  function _ptCacheSave() {
    if (!_ptCacheDirty) return; _ptCacheDirty = false;
    try {
      const o = {}; _ptCache.forEach((v, k) => { o[k] = [v.pos.x, v.pos.y, v.pos.z, v.n.x, v.n.y, v.n.z]; });
      localStorage.setItem(_ptVerKey(), JSON.stringify(o));
    } catch (e) { /* đầy/chặn → thôi, vẫn còn cache RAM */ }
  }
  // Bọc memo. Trả CLONE để người gọi (.copy/.clone/kéo-thả) KHÔNG thể làm hỏng giá trị trong cache.
  function surfacePoint(h, az, dir) {
    _ptCacheLoad();
    const ck = 'S' + bodyHeight.toFixed(2) + ':' + h + ',' + az + ',' + dir;
    let v = _ptCache.get(ck);
    if (v === undefined) { v = _surfacePointRaw(h, az, dir); if (v) { _ptCache.set(ck, v); _ptCacheDirty = true; } }
    return v ? { pos: v.pos.clone(), n: v.n.clone() } : v;
  }
  function limbPoint(p) {
    _ptCacheLoad();
    const ck = 'L' + bodyHeight.toFixed(2) + ':' + (p.x || 0) + ',' + (p.y || 0) + ',' + (p.z || 0) + ',' + (p.snap === false ? 'n' : 'y') + ',' + (p.snapDir || '-');
    let v = _ptCache.get(ck);
    if (v === undefined) { v = _limbPointRaw(p); if (v) { _ptCache.set(ck, v); _ptCacheDirty = true; } }
    return v ? { pos: v.pos.clone(), n: v.n.clone() } : v;
  }
  /* ĐỘ NHẤC KHỎI DA — DÙNG CHUNG cho chấm huyệt và ống đường kinh.
   * Hai thứ này phải nhấc bằng CÙNG MỘT vector, nếu không chúng tách nhau ngay trên màn hình dù dữ
   * liệu đặt huyệt đúng trên đường. Xem chú thích trong _limbPointRaw. */
  const _SKIN_LIFT = 0.009;

  // ---- đặt huyệt THÂN/ĐẦU bằng raycast hướng vào trục dọc thân ----
  const _o = new THREE.Vector3(), _t = new THREE.Vector3(), _d = new THREE.Vector3();
  function _surfacePointRaw(h, az, dir) {
    const y = bodyMinY + h * bodyHeight, azr = az * Math.PI / 180;
    if (dir === 'top') {
      _o.set(Math.sin(azr) * 0.04 * bodyHeight, bodyMinY + bodyHeight * 1.25, Math.cos(azr) * 0.06 * bodyHeight);
      _t.set(0, y, Math.cos(azr) * 0.04 * bodyHeight);
    } else {
      const R = bodyHeight;
      _o.set(Math.sin(azr) * R, y, Math.cos(azr) * R);
      _t.set(0, y, 0);
    }
    _d.copy(_t).sub(_o).normalize();
    raycaster.set(_o, _d);
    const hits = raycaster.intersectObjects(skinTargets.length ? skinTargets : [modelRoot], true);
    if (!hits.length) return null;
    const p = hits[0].point.clone();
    const out = dir === 'top' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(p.x, 0, p.z).normalize();
    return { pos: p.add(out.clone().multiplyScalar(_SKIN_LIFT * bodyHeight)), n: out };
  }

  // ---- đặt huyệt trên CHI bằng toạ độ chuẩn-hoá (x,y,z) rồi "dán" vào da gần nhất ----
  // x: ngang (trái mô hình = +), y: cao 0..1 theo thân, z: sâu (trước = +); đơn vị = bodyHeight.
  // Bắn tia từ 6 phía vào điểm trục chi, lấy điểm da GẦN NHẤT → hợp cả tay ngang lẫn chân dọc.
  const _LP = new THREE.Vector3(), _LO = new THREE.Vector3(), _LD = new THREE.Vector3();
  const _SNAP_DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  // huyệt MẶT TRƯỚC THÂN (ngực/bụng): chỉ dán từ phía TRƯỚC → khỏi bị tia bên kéo ra vai/sườn.
  const _SNAP_FRONT = [[0, 0, 1]], _SNAP_BACK = [[0, 0, -1]];
  function _limbPointRaw(p) {
    _LP.set((p.x || 0) * bodyHeight, bodyMinY + (p.y || 0) * bodyHeight, (p.z || 0) * bodyHeight);
    if (p.snap === false) {                        // không "dán da" → pháp tuyến XẤP XỈ: toả ra ngoài từ trục dọc thân
      const out = new THREE.Vector3(_LP.x, 0, _LP.z);
      return { pos: _LP.clone(), n: out.lengthSq() > 1e-9 ? out.normalize() : new THREE.Vector3(0, 0, 1) };
    }
    const R = 0.45 * bodyHeight;
    const dirs = p.snapDir === 'front' ? _SNAP_FRONT : p.snapDir === 'back' ? _SNAP_BACK : _SNAP_DIRS;
    let best = null, bestD = Infinity, bestN = null;
    for (const d of dirs) {
      _LO.set(_LP.x + d[0] * R, _LP.y + d[1] * R, _LP.z + d[2] * R);
      _LD.copy(_LP).sub(_LO).normalize();
      raycaster.set(_LO, _LD);
      const hits = raycaster.intersectObjects(skinTargets.length ? skinTargets : [modelRoot], true);
      if (hits.length) {
        const dd = hits[0].point.distanceTo(_LP);
        if (dd < bestD) { bestD = dd; best = hits[0].point.clone(); bestN = _LD.clone().negate(); }
      }
    }
    /* VỊ TRÍ LẤY TỪ TOẠ ĐỘ ENGINE, KHÔNG LẤY CHỖ TIA RƠI.
     * Backend đã ép mọi huyệt lên da ở tầng 5 (skin-clamp.cjs) và rải chúng ĐÚNG TRÊN đường kinh —
     * đo trên dữ liệu: 357/361 huyệt cách đường dưới 0,5cm, kinh Phế lệch ≤0,01cm. Nhưng chỗ này
     * lại "dán da" LẦN THỨ HAI bằng một phép khác hẳn (6 tia theo trục ±X ±Y ±Z, lấy chỗ chạm gần
     * nhất), rồi đặt chấm ở chỗ tia rơi. Đo trong cảnh thật: phép dán lại này dời 283/361 chấm quá
     * 1cm, 148 chấm quá 3cm, xa nhất Khí Xung ST30 13,8cm — vì ở bụng dưới tia từ bên hông chạm
     * đùi trước khi chạm bụng. Đường kinh thì vẽ thẳng từ polyline backend nên đứng yên; thế là
     * chấm rời khỏi đường, đúng như người dùng nhìn thấy.
     * Nay giữ nguyên toạ độ engine và nhấc bằng ĐÚNG vector mà pathToWorld() dùng cho ống (toả ra
     * từ trục dọc thân, _SKIN_LIFT) → chấm luôn nằm trên ống. Tia vẫn bắn, nhưng chỉ để lấy PHÁP
     * TUYẾN cho kim châm và cho phép đo độ sâu, vì pháp tuyến bề mặt thật tốt hơn hướng toả. */
    const toa = new THREE.Vector3(_LP.x, 0, _LP.z);
    if (toa.lengthSq() < 1e-9) toa.set(0, 0, 1);
    toa.normalize();
    const pos = _LP.clone().addScaledVector(toa, _SKIN_LIFT * bodyHeight);
    return { pos, n: bestN || toa };
  }

  // soi gương 1 điểm sang bên đối diện: chi x→−x; thân lệch giữa az→360−az; điểm giữa (az 0/180) bỏ.
  function placeMirror(p) {
    if (p.x !== undefined || p.y !== undefined || p.z !== undefined)
      return limbPoint({ x: -(p.x || 0), y: p.y, z: p.z, snap: p.snap, snapDir: p.snapDir });
    if (p.az % 180 !== 0) return surfacePoint(p.h, (360 - p.az) % 360, p.dir);
    return null;
  }

  // ---- HUYỆT CHỒNG CHỖ ----
  // 94 huyệt (42 cụm) đang có TOẠ ĐỘ TRÙNG KHÍT nhau — phần lớn vì mô tả vị trí trong sách chỉ nói
  // "ở nếp khuỷu", "ở lằn cổ tay"… mà không kèm số thốn, nên bộ giải toạ độ đặt tất cả vào đúng
  // mốc đó. Backend (mark-overlaps.cjs của phiên kinhlacc-61) gắn 2 trường vào từng huyệt:
  //   chongCho: [mã huyệt khác cùng chỗ]   ·   chongMoc: tên mốc mà cả cụm rơi trúng
  // Trước đây app KHÔNG hiện gì: người dùng bấm vào chấm ở nếp khuỷu chỉ thấy 1 trong 6 huyệt, 5
  // huyệt kia coi như tàng hình. Nay chấm chồng có VÒNG ĐÁNH DẤU riêng + bảng chi tiết liệt kê đủ.
  function overlapOf(code) {
    const p = placed[code];
    const list = p && p.chongCho;
    return (list && list.length) ? { list, moc: p.chongMoc || null } : null;
  }

  // tạo 1 chấm huyệt + quầng tại vị trí world; side 'L' (gốc) | 'R' (gương).
  // anchor=true (MỐC HUYỆT) → chấm TO hơn + quầng TRẮNG sáng → nổi bật làm xương sống.
  function addDot(code, pos, normal, side, approx, col, anchor, user) {
    const m = new THREE.Mesh(_dotGeo, new THREE.MeshStandardMaterial({
      color: user ? 0x22c55e : col, emissive: user ? 0x22c55e : col, emissiveIntensity: (anchor || user) ? 0.9 : 0.55, roughness: 0.4, metalness: 0,
      transparent: approx, opacity: approx ? 0.6 : 1,
    }));
    m.position.copy(pos);
    const dotScale = (anchor || user) ? 1.35 : 1;
    if (dotScale !== 1) m.scale.setScalar(dotScale);
    const haloR = _dotR * ((anchor || user) ? 5 : 3.2);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({       // quầng sáng "điểm năng lượng"
      map: GLOW, color: user ? new THREE.Color(0x22c55e) : anchor ? new THREE.Color(0xffffff) : col, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: (anchor || user) ? 0.7 : 0.42,
    }));
    halo.scale.setScalar(haloR); halo.position.copy(pos);
    halo.visible = false;                                          // quầng ẩn mặc định → chỉ hiện khi chọn kinh/huyệt (đỡ overdraw)
    // chấm CHỒNG CHỖ: thêm vòng nhỏ bao quanh để nhìn là biết "ở đây còn huyệt khác nữa"
    const ov = overlapOf(code);
    let ring = null;
    if (ov) {
      ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: new THREE.Color(0xf59e0b),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
      ring.scale.setScalar(_dotR * 4.6); ring.position.copy(pos);
      dotsGroup.add(ring);
    }
    m.userData = { code, mer: merOf(code), num: numOf(code), side, anchor: !!anchor, baseColor: col.clone(),
      halo, baseHalo: haloR, baseScale: dotScale, normal: (normal || new THREE.Vector3(0, 0, 1)).clone(),
      ring, overlap: ov };
    dotsGroup.add(m); dotsGroup.add(halo);
    dotMeshes.push(m);
    if (side === 'L') dotByCode[code] = m;                          // drawer/scroll dùng chấm gốc
  }

  /* Móc CHẨN ĐOÁN — gọi window.__ACU3D() trong console (hoặc từ Playwright) để biết cảnh đang có gì.
   * Thêm sau khi mất cả tiếng không rõ vì sao đường kinh không hiện: dữ liệu nạp đủ, không lỗi JS,
   * mà nhìn màn hình chỉ thấy chấm. Không có cách nào nhìn vào trong closure để đếm. */
  window.__ACU3D = () => ({
    chAm: dotMeshes.length,
    duong: Object.keys(lineByMer).length,
    duongHien: Object.values(lineByMer).filter(t => t.visible).length,
    hat: Object.keys(flowByMer).length,
    coPaths: !!PATHS,
    kinhCoDuong: [...new Set(Object.keys(lineByMer).map(k => k.split('|')[0]))].sort(),
    lopKinhLac: acuLayerOn,
    an: [...hidden],
    chon: focusMer,
  });

  /* Móc ĐO — chấm huyệt có THẬT SỰ nằm trên ống đường kinh trong CẢNH không?
   * Dữ liệu backend nói có (mọi huyệt cách đường ≤0,25cm), nhưng người dùng nhìn màn hình lại thấy
   * chấm rời khỏi đường. Chỉ có hai chỗ sai được: dữ liệu, hoặc khâu vẽ. Đo thẳng trong world space
   * thì phân xử được, thay vì cãi nhau bằng ảnh chụp — đám chấm nhìn "lơ lửng" có thể chỉ là huyệt
   * MẶT SAU nhìn xuyên qua lớp da bán trong suốt. */
  window.__ACU3D_DO = (nguong = 1.0) => {
    const CM = 171.9 / bodyHeight;                 // 1 đơn vị world → cm (mesh cao bodyHeight = 171,9cm)
    const curves = {};                             // 'MER|side' -> [curve...]
    for (const k in lineByMer) {
      const c = lineByMer[k].geometry && lineByMer[k].geometry.parameters && lineByMer[k].geometry.parameters.path;
      if (!c) continue;
      const kk = k.split('|').slice(0, 2).join('|');
      (curves[kk] = curves[kk] || []).push(c);
    }
    const mau = {};                                // lấy mẫu sẵn cho nhanh
    for (const k in curves) mau[k] = curves[k].map(c => c.getPoints(300));
    const xa = [];
    let n = 0, tong = 0;
    for (const m of dotMeshes) {
      const kk = m.userData.mer + '|' + (m.userData.side || 'L');
      const ds = mau[kk]; if (!ds) continue;
      let best = Infinity;
      for (const pts of ds) for (const p of pts) { const d = p.distanceTo(m.position); if (d < best) best = d; }
      const cm = best * CM; n++; tong += cm;
      if (cm > nguong) xa.push({ code: m.userData.code || (m.userData.mer + m.userData.num), side: m.userData.side || 'L', cm: +cm.toFixed(2) });
    }
    xa.sort((a, b) => b.cm - a.cm);
    return { đoĐược: n, trungBìnhCm: +(tong / n).toFixed(2), quáNgưỡng: xa.length, xaNhất: xa.slice(0, 25) };
  };

  // Soi MỘT huyệt: toạ độ chấm trong cảnh, điểm gần nhất trên ống, và toạ độ NGUỒN từ dữ liệu —
  // đủ để biết lệch sinh ra ở phép biến đổi nào.
  window.__ACU3D_SOI = (code) => {
    const m = dotMeshes.find(d => (d.userData.code || (d.userData.mer + d.userData.num)) === code && (d.userData.side || 'L') === 'L');
    if (!m) return 'không thấy chấm ' + code;
    const CM = 171.9 / bodyHeight;
    let best = null, bestD = Infinity, bestKey = '';
    for (const k in lineByMer) {
      if (k.split('|')[0] !== m.userData.mer || k.split('|')[1] !== 'L') continue;
      const c = lineByMer[k].geometry.parameters && lineByMer[k].geometry.parameters.path; if (!c) continue;
      for (const p of c.getPoints(400)) { const d = p.distanceTo(m.position); if (d < bestD) { bestD = d; best = p; bestKey = k; } }
    }
    const src = coordOf(code);
    return {
      nguon: src, bodyHeight, bodyMinY,
      chamTrongCanh: m.position.toArray().map(v => +v.toFixed(4)),
      diemGanNhatTrenOng: best ? best.toArray().map(v => +v.toFixed(4)) : null,
      doanOng: bestKey, lechCm: +(bestD * CM).toFixed(2),
      userData: { mer: m.userData.mer, num: m.userData.num, side: m.userData.side, code: m.userData.code },
    };
  };

  // Toạ độ MÀN HÌNH của một chấm — để chụp ảnh cận đúng chỗ thay vì đoán khung cắt.
  window.__ACU3D_PIXEL = (code) => {
    const m = dotMeshes.find(d => (d.userData.code || (d.userData.mer + d.userData.num)) === code && (d.userData.side || 'L') === 'L');
    if (!m || !renderer) return null;
    const v = m.getWorldPosition(new THREE.Vector3()).project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return { x: Math.round(r.left + (v.x + 1) / 2 * r.width), y: Math.round(r.top + (1 - v.y) / 2 * r.height), truocMan: v.z < 1 };
  };

  function placeAllPoints() {
    _dotR = 0.0026 * bodyHeight;                  // chấm nhỏ gọn (đỡ "quả cầu to") + chấm tay chính xác
    _dotGeo = new THREE.SphereGeometry(_dotR, 10, 8);   // lưới nhẹ hơn (700 chấm) → render nhanh
    let missed = [];
    for (const code of Object.keys(placed)) {
      const p = coordOf(code), mer = merOf(code);
      const r = (p.x !== undefined || p.y !== undefined || p.z !== undefined)
        ? limbPoint(p) : surfacePoint(p.h, p.az, p.dir);
      if (!r) { missed.push(code); continue; }
      const col = new THREE.Color(COORDS.meridians[mer].color);
      addDot(code, r.pos, r.n, 'L', p.q === 'approx', col, p.anchor, p.user);
      if (mirrorOn && isBilateral(mer)) {                            // vẽ thêm bản đối xứng
        const mp = placeMirror(p);
        if (mp) addDot(code, mp.pos, mp.n, 'R', p.q === 'approx', col, p.anchor, p.user);
      }
    }
    if (missed.length) console.warn('map3d: trượt raycast', missed.join(','));
    _ptCacheSave();   // lưu cache toạ độ bề mặt cho lần tải sau (chỉ ghi nếu có điểm mới raycast)
  }

  // xoá toàn bộ chấm (giữ _dotGeo dùng lại) — cho lúc bật/tắt soi gương.
  function clearDots() {
    dotMeshes.forEach(m => {
      dotsGroup.remove(m); if (m.userData.halo) dotsGroup.remove(m.userData.halo);
      m.material.dispose && m.material.dispose();
      m.userData.halo && m.userData.halo.material.dispose && m.userData.halo.material.dispose();
    });
    dotMeshes.length = 0;
    for (const k in dotByCode) delete dotByCode[k];
    hovered = null;
  }
  function rebuild() {
    clearDots(); clearNeedle(); placeAllPoints(); applyVisibility(); buildLinesDeferred();   // chấm hiện ngay, đường rải dần
    if (selectedCode && dotByCode[selectedCode] && dotByCode[selectedCode].visible) placeNeedle(dotByCode[selectedCode]);
  }

  /* Dựng đường kinh TRỄ, theo NGÂN SÁCH THỜI GIAN chứ không phải mỗi khung một kinh.
   *
   * Bản cũ dựng đúng 1 kinh mỗi khung hình. Với cảnh nhẹ thì xong trong 14 khung. Nhưng cảnh thật ở
   * đây rất nặng (2.229 mảnh giải phẫu + 670 chấm huyệt), mỗi khung mất tới ~3,5 giây, nên 14 kinh
   * cần gần một PHÚT. Người dùng mở tab lên chỉ thấy chấm mà không thấy đường — đo được: sau 28 giây
   * mới dựng xong 8/14 kinh (LU, LI, ST, SP, HT, SI, BL, KI — đúng 8 kinh đầu danh sách).
   *
   * KHÔNG dùng requestAnimationFrame để chia việc: rAF gắn với NHỊP VẼ, mà nhịp vẽ ở đây chính là
   * thứ đang chậm — càng nặng cảnh thì càng lâu mới tới lượt dựng tiếp, đúng chiều xấu. Dùng setTimeout
   * để tách hẳn khỏi vòng vẽ, mỗi lượt dựng liên tục trong 40ms rồi nhường. Đường lấy từ polyline dựng
   * sẵn nên rẻ; phần đắt là cảnh, mà cảnh thì dù sao cũng phải vẽ. */
  let _lineQueue = null;
  const _LINE_BUDGET_MS = 40;
  function buildLinesDeferred() {
    _lineQueue = presentMer.slice();
    const step = () => {
      if (!_lineQueue || !_lineQueue.length) { _lineQueue = null; return; }
      const t0 = performance.now();
      do { buildLines(_lineQueue.shift()); } while (_lineQueue.length && performance.now() - t0 < _LINE_BUDGET_MS);
      applyVisibility();
      if (_lineQueue && _lineQueue.length) setTimeout(step, 0); else _lineQueue = null;
    };
    setTimeout(step, 0);
  }
  /* ---- ĐƯỜNG KINH từ POLYLINE dựng sẵn (thay cho spline nối các chấm) ----
   *
   * Cách CŨ: CatmullRom đi qua vị trí từng chấm huyệt. Ba tật cố hữu, không sửa được bằng tinh chỉnh:
   *   · thứ tự mã số KHÔNG phải thứ tự đường đi — Bàng Quang có hai đường lưng song song, sau BL40
   *     (nếp kheo) mã nhảy về BL41 (lưng trên) nên đường vẽ một nét dài 100cm bay ngang người;
   *   · spline nối hai chấm cách xa nhau trên mặt CONG thì cắt cung, phình ra NGOÀI da ở vai/hông
   *     — sai kể cả khi mọi huyệt đều đúng;
   *   · mỗi huyệt sai kéo cả đường lệch theo, không có gì ràng lại.
   * Cách MỚI: đường có hình học RIÊNG, dựng ở backend bằng đường trắc địa trên chính mặt da, đi qua
   * các nút giải phẫu đã duyệt. Huyệt sai không còn kéo được đường ra khỏi người.                    */
  const _PATH_LIFT = _SKIN_LIFT;   // nhấc khỏi da — PHẢI bằng đúng độ nhấc của chấm huyệt
  const _PUP = new THREE.Vector3(0, 1, 0);
  function pathToWorld(pts, mirror) {
    const out = [];
    for (const p of pts) {
      const nx = (mirror ? -p[0] : p[0]), ny = p[1], nz = p[2];
      const o = new THREE.Vector3(nx, 0, nz);
      if (o.lengthSq() < 1e-9) o.set(0, 0, 1);
      o.normalize();
      // gần đỉnh đầu thì pháp tuyến ngả dần lên trên, nếu không đường sẽ chìm vào sọ
      if (ny > 0.95) o.lerp(_PUP, Math.min(1, (ny - 0.95) / 0.05)).normalize();
      out.push(new THREE.Vector3(
        nx * bodyHeight + o.x * _PATH_LIFT * bodyHeight,
        bodyMinY + ny * bodyHeight + o.y * _PATH_LIFT * bodyHeight,
        nz * bodyHeight + o.z * _PATH_LIFT * bodyHeight));
    }
    return out;
  }
  /** Dựng ống cho 1 kinh từ bảng PATHS. Trả false nếu kinh đó không có dữ liệu → gọi lại cách cũ. */
  function buildLinesFromPaths(mer, i0) {
    const d = PATHS && PATHS.mer && PATHS.mer[mer];
    if (!d || !d.doan) return false;
    const usable = d.doan.filter(s => s.pts && s.pts.length >= 2);
    if (!usable.length) return false;
    const col = new THREE.Color(COORDS.meridians[mer].color);
    const sides = (mirrorOn && isBilateral(mer)) ? ['L', 'R'] : ['L'];
    let i = i0;
    for (const side of sides) {
      let seg = 0;
      for (const s of usable) {
        const pts = pathToWorld(s.pts, side === 'R');
        const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
        const chim = s.mo === 'chim';       // kinh đi trong sâu: vẽ mảnh + mờ, để phân biệt với đoạn trên da
        const skey = mer + '|' + side + '|p' + (seg++);
        const tube = new THREE.Mesh(
          /* Bán kính ống: 0,0010 → 0,0018 (đường kính 3,4 → 6,2mm). Chấm huyệt bán kính 0,0026 tức
           * đường kính 9mm, gấp gần 3 lần ống cũ, nên nhìn vào chỉ thấy chấm còn đường bị nuốt mất —
           * người dùng báo "vẫn chưa rõ các đường kinh". Vẫn để ống MỎNG HƠN chấm để giữ thứ bậc. */
          new THREE.TubeGeometry(curve, Math.max(24, pts.length * 2), (chim ? 0.0011 : 0.0018) * bodyHeight, 6, false),
          new THREE.MeshStandardMaterial({
            color: col.clone().multiplyScalar(0.8), emissive: col, emissiveIntensity: chim ? 0.25 : 0.6,
            roughness: 0.35, metalness: 0, transparent: true, opacity: chim ? 0.28 : 0.97,
          })
        );
        tube.renderOrder = 3;
        tube.userData = { mer, seed: i * 1.7 };
        linesGroup.add(tube); lineByMer[skey] = tube;
        if (chim) continue;                  // hạt kinh khí chỉ chạy trên đoạn thấy được
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: GLOW, color: col, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: 0.95,
        }));
        sprite.scale.setScalar(0.02 * bodyHeight);
        flowGroup.add(sprite);
        flowByMer[skey] = { sprite, curve, mer, phase: (i++ % 5) / 5, speed: 0.12 };
      }
    }
    return true;
  }

  // onlyMer: chỉ dựng lại đường của 1 kinh (vd khi chấm tay) → nhẹ, không treo. Bỏ trống = dựng tất cả.
  function buildLines(onlyMer) {
    const keep = k => onlyMer ? k.split('|')[0] === onlyMer : true;
    for (const k in lineByMer) if (keep(k)) { linesGroup.remove(lineByMer[k]); delete lineByMer[k]; }
    for (const k in flowByMer) if (keep(k)) { flowGroup.remove(flowByMer[k].sprite); delete flowByMer[k]; }
    // gom theo (kinh|bên) để mỗi bên có đường riêng khi soi gương.
    const groups = {};
    // kinh nào đã có polyline dựng sẵn thì dùng nó; kinh nào chưa thì mới rơi về nối-chấm bên dưới.
    const doneByPath = new Set();
    if (PATHS) {
      let k = 0;
      for (const mer of (onlyMer ? [onlyMer] : presentMer)) if (buildLinesFromPaths(mer, k++)) doneByPath.add(mer);
    }
    dotMeshes.forEach(m => { if (onlyMer && m.userData.mer !== onlyMer) return; if (doneByPath.has(m.userData.mer)) return; const key = m.userData.mer + '|' + (m.userData.side || 'L'); (groups[key] = groups[key] || []).push(m); });
    const SPLIT = 0.16 * bodyHeight;               // nhảy không gian > ngưỡng → cắt đoạn (vd BL40→BL41 lưng↔chân)
    let i = 0;
    for (const key in groups) {
      const all = groups[key].slice().sort((a, b) => a.userData.num - b.userData.num);
      const mer = all[0].userData.mer, col = new THREE.Color(COORDS.meridians[mer].color);
      // cắt thành các đoạn liên tục theo khoảng cách thực giữa 2 huyệt kế tiếp.
      const runs = [];
      let cur = [all[0]];
      for (let j = 1; j < all.length; j++) {
        if (all[j].position.distanceTo(all[j - 1].position) > SPLIT) { runs.push(cur); cur = []; }
        cur.push(all[j]);
      }
      runs.push(cur);
      // GỘP đoạn LẺ (chỉ 1 huyệt): nếu huyệt cuối/đầu kinh cách huyệt kề > SPLIT thì bị tách thành đoạn riêng,
      // mà đoạn 1-huyệt lại bị bỏ qua bên dưới (arr.length < 2) → mất đường nối. Huyệt trên 1 kinh vốn nối liên
      // tục nên gộp huyệt lẻ về đoạn liền kề (ưu tiên đoạn trước) để LUÔN có đường nối. Bước nhảy thật
      // (vd BL40↔BL41 lưng↔chân) tạo 2 đoạn nhiều huyệt nên không bị gộp.
      for (let r = 0; r < runs.length; r++) {
        if (runs[r].length === 1 && runs.length > 1) {
          if (r > 0) runs[r - 1].push(runs[r][0]); else runs[r + 1].unshift(runs[r][0]);
          runs.splice(r, 1); r--;
        }
      }
      let seg = 0;
      for (const arr of runs) {
        if (arr.length < 2) continue;
        const skey = key + '|' + (seg++);
        // ĐƯỜNG = ống cong MƯỢT đi XUYÊN qua ĐÚNG vị trí từng huyệt. KHÔNG còn "lấy-mẫu-rồi-dán-da":
        // cách cũ làm mỗi mẫu bị hút sang một mặt da khác nhau (mu/lòng bàn tay, ngón kề) → đường lượn/zigzag,
        // lách qua bên cạnh huyệt (rõ nhất ở kinh Đại Trường). Huyệt đã đặt sát da khi tạo chấm nên nối thẳng
        // qua chúng là vừa bám da vừa TRÚNG HUYỆT. CatmullRom đi qua mọi điểm điều khiển → mọi huyệt nằm trên đường.
        const curve = new THREE.CatmullRomCurve3(arr.map(m => m.position.clone()), false, 'centripetal');
        const tubeSegs = Math.max(28, arr.length * 6);   // chia mịn để ống cong mượt
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, tubeSegs, 0.0018 * bodyHeight, 6, false),   // dày bằng nhánh trên (6,2mm)
          new THREE.MeshStandardMaterial({
            color: col.clone().multiplyScalar(0.8), emissive: col, emissiveIntensity: 0.6,
            roughness: 0.35, metalness: 0, transparent: true, opacity: 0.97,
          })
        );
        tube.renderOrder = 3;
        tube.userData = { mer, seed: i * 1.7 };
        linesGroup.add(tube); lineByMer[skey] = tube;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({   // hạt kinh khí chạy dọc đoạn
          map: GLOW, color: col, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: 0.95,
        }));
        sprite.scale.setScalar(0.02 * bodyHeight);
        flowGroup.add(sprite);
        flowByMer[skey] = { sprite, curve, mer, phase: (i++ % 5) / 5, speed: 0.12 };
      }
    }
  }

  // ---- KIM CHÂM 3D: cắm ĐÚNG 1 cây vào huyệt đang chọn (thân thép thuôn nhọn + cán đồng) ----
  let needleShaft = null, needleHandle = null;
  const needleA = { active: false, done: true, t0: 0, n: new THREE.Vector3(0, 0, 1), q: new THREE.Quaternion(),
                    shaftC: new THREE.Vector3(), handleC: new THREE.Vector3() };
  const _NUP = new THREE.Vector3(0, 1, 0), _Noff = new THREE.Vector3();
  const _Nn = new THREE.Vector3(), _tan = new THREE.Vector3(), _axis = new THREE.Vector3(), _aimV = new THREE.Vector3();
  // vector HƯỚNG mũi kim (world) tại chấm `dot`: tới 1 huyệt đích hoặc 1 hướng giải phẫu.
  function aimWorld(aim, dot) {
    if (!aim) return null;
    if (aim.type === 'point') {                            // ngả về phía huyệt đích (chọn bản gần nhất nếu có 2 bên)
      let best = null, bd = Infinity;
      for (const m of dotMeshes) if (m.userData.code === aim.code) {
        const d = m.position.distanceTo(dot.position); if (d < bd) { bd = d; best = m; }
      }
      return best ? _aimV.copy(best.position).sub(dot.position) : null;
    }
    const sx = dot.position.x >= 0 ? 1 : -1;               // hướng giải phẫu (y=cao, x=ngang model-trái+, z=trước+)
    switch (aim.dir) {
      case 'cephalad': return _aimV.set(0, 1, 0);
      case 'caudad': return _aimV.set(0, -1, 0);
      case 'medial': return _aimV.set(-sx, 0, 0);
      case 'lateral': return _aimV.set(sx, 0, 0);
      case 'anterior': return _aimV.set(0, 0, 1);
      case 'posterior': return _aimV.set(0, 0, -1);
      case 'spine': return _aimV.set(-sx * 0.5, 0, -1);    // về cột sống = vào trong + ra sau
      default: return null;
    }
  }
  // hướng TIẾP TUYẾN đường kinh tại 1 chấm: tới huyệt kề (num±1) cùng kinh & cùng bên → ngả xiên "dọc kinh".
  function meridianTangent(dot) {
    const mer = dot.userData.mer, num = dot.userData.num, side = dot.userData.side || 'L';
    let nextM = null, prevM = null;
    for (const m of dotMeshes) {
      if (m.userData.mer !== mer || (m.userData.side || 'L') !== side) continue;
      if (m.userData.num === num + 1) nextM = m; else if (m.userData.num === num - 1) prevM = m;
    }
    const ref = nextM || prevM; if (!ref) return null;
    const d = _aimV.copy(ref.position).sub(dot.position);
    return d.lengthSq() > 1e-12 ? d : null;
  }
  function ensureNeedle() {
    if (needleShaft) return;
    const bh = bodyHeight, r = 0.0009 * bh, L = NEEDLE.len * bh, hl = NEEDLE.handle * bh;
    // +Y = phía cán (ra ngoài da); -Y thuôn nhọn = mũi kim (đâm vào trong)
    const shaftGeo = new THREE.CylinderGeometry(r, 0.00012 * bh, L, 8, 1);
    const handleGeo = new THREE.CylinderGeometry(r * 2.4, r * 2.4, hl, 10, 1);
    needleShaft = new THREE.Mesh(shaftGeo, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.22 }));
    needleHandle = new THREE.Mesh(handleGeo, new THREE.MeshStandardMaterial({ color: 0xc08436, metalness: 0.6, roughness: 0.4, emissive: 0x3a2208, emissiveIntensity: 0.3 }));
    needleShaft.frustumCulled = needleHandle.frustumCulled = false;
    needleShaft.renderOrder = needleHandle.renderOrder = 5;
    needleGroup.add(needleShaft); needleGroup.add(needleHandle);
    needleGroup.visible = false;
  }
  // cắm 1 cây kim vào chấm huyệt (dot) đang chọn — TRỤC kim theo hướng châm thật + độ sâu theo thốn
  function placeNeedle(dot) {
    if (!dot) return clearNeedle();
    ensureNeedle();
    const bh = bodyHeight, L = NEEDLE.len * bh, hl = NEEDLE.handle * bh;
    const spec = needleSpec(dot.userData.code);
    const n = _Nn.copy(dot.userData.normal).normalize();   // pháp tuyến da (ra ngoài)
    _axis.copy(n);                                          // mặc định: ⟂ da
    const un = userNeedle[dot.userData.code];               // HƯỚNG TỰ CHỈNH (Chấm Tay) → ưu tiên tuyệt đối
    if (un) {
      _axis.set(un.x, un.y, un.z).normalize();
    } else {
      let aimv = spec.tilt > 1e-4 ? aimWorld(spec.aim, dot) : null;
      if (spec.tilt > 1e-4 && !aimv) aimv = meridianTangent(dot);   // xiên/luồn không rõ hướng → ngả DỌC đường kinh
      if (aimv) {
        _tan.copy(aimv).addScaledVector(n, -aimv.dot(n));     // chiếu hướng lên mặt phẳng TIẾP TUYẾN da
        if (_tan.lengthSq() > 1e-9) {                         // ngả trục: cán ngả ngược, mũi kim chếch THEO hướng vào dưới da
          _tan.normalize();
          _axis.copy(n).multiplyScalar(Math.cos(spec.tilt)).addScaledVector(_tan, -Math.sin(spec.tilt)).normalize();
        }
      }
    }
    // độ cắm vào da theo "sâu N thốn" (1 thốn ≈ chiều cao thân /70); kẹp để luôn còn thân + cán nhô ra ngoài
    const ins = spec.depth != null ? Math.max(0.12 * L, Math.min(0.6 * L, spec.depth * bh / 70)) : NEEDLE.insert * bh;
    needleA.n.copy(_axis);
    needleA.q.setFromUnitVectors(_NUP, _axis);
    needleA.shaftC.copy(dot.position).addScaledVector(_axis, L / 2 - ins);     // mũi cắm sâu `ins` dọc trục kim
    needleA.handleC.copy(dot.position).addScaledVector(_axis, L - ins + hl / 2); // cán trên đỉnh thân
    needleShaft.quaternion.copy(needleA.q); needleHandle.quaternion.copy(needleA.q);
    needleGroup.visible = true;
    needleA.t0 = clock(); needleA.active = true; needleA.done = false;
    updateNeedle(0);
  }
  function clearNeedle() {
    needleA.active = false; needleA.done = true;
    if (needleGroup) needleGroup.visible = false;
  }
  function updateNeedle(progress) {
    const e = 1 - Math.pow(1 - progress, 3), off = (1 - e) * NEEDLE.amp * bodyHeight;   // easeOut: kim trượt từ ngoài vào da
    _Noff.copy(needleA.n).multiplyScalar(off);
    needleShaft.position.copy(needleA.shaftC).add(_Noff);
    needleHandle.position.copy(needleA.handleC).add(_Noff);
  }

  // ===== XOAY HƯỚNG KIM (Chấm Tay): kéo CÁN kim trên 3D → đổi trục kim, lưu vào userNeedle =====
  let rotDot = null, rotMoved = false;
  const _rv1 = new THREE.Vector3(), _rv2 = new THREE.Vector3(), _rv3 = new THREE.Vector3(), _rv4 = new THREE.Vector3();
  const _ROT_COSMAX = Math.cos(85 * Math.PI / 180);        // kim không ngả quá 85° (cán luôn nhô ra ngoài da)
  function _needleIns(code, bh, L) {
    const d = needleSpec(code).depth;
    return d != null ? Math.max(0.12 * L, Math.min(0.6 * L, d * bh / 70)) : NEEDLE.insert * bh;
  }
  // trục kim (ra ngoài) suy từ vị trí con trỏ: cán kim "bám" theo con trỏ, tâm xoay tại huyệt.
  function dirFromCursor(ev, pivot, radius) {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const O = raycaster.ray.origin, D = raycaster.ray.direction;
    const OP = _rv1.copy(pivot).sub(O), tca = OP.dot(D), d2 = OP.lengthSq() - tca * tca, r2 = radius * radius;
    let t = tca;
    if (d2 <= r2) t = tca - Math.sqrt(r2 - d2);            // con trỏ trúng mặt cầu bán kính `radius` → giao gần
    const H = _rv2.copy(O).addScaledVector(D, t);
    return _rv3.copy(H).sub(pivot).normalize();
  }
  // kẹp trục: cán luôn nhô ra ngoài (≤ 85° so với pháp tuyến da)
  function clampNeedleAxis(axis, n) {
    const dn = axis.dot(n);
    if (dn >= _ROT_COSMAX) return axis;
    const tan = _rv4.copy(axis).addScaledVector(n, -dn);
    if (tan.lengthSq() > 1e-9) { tan.normalize(); axis.copy(n).multiplyScalar(_ROT_COSMAX).addScaledVector(tan, Math.sqrt(1 - _ROT_COSMAX * _ROT_COSMAX)).normalize(); }
    else axis.copy(n);
    return axis;
  }
  // đặt kim theo 1 trục cho trước, KHÔNG hoạt cảnh trượt — dùng khi đang xoay.
  function orientNeedle(dot, axis) {
    ensureNeedle();
    const bh = bodyHeight, L = NEEDLE.len * bh, hl = NEEDLE.handle * bh, ins = _needleIns(dot.userData.code, bh, L);
    needleA.n.copy(axis);
    needleA.q.setFromUnitVectors(_NUP, axis);
    needleA.shaftC.copy(dot.position).addScaledVector(axis, L / 2 - ins);
    needleA.handleC.copy(dot.position).addScaledVector(axis, L - ins + hl / 2);
    needleShaft.quaternion.copy(needleA.q); needleHandle.quaternion.copy(needleA.q);
    needleA.active = false; needleA.done = true; needleGroup.visible = true;
    updateNeedle(1); wake();
  }
  // con trỏ có đang GẦN cán kim không (bắt thao tác xoay) — rộng tay hơn bề ngang kim cho dễ trúng.
  function nearNeedleHandle(ev) {
    if (!needleHandle || !needleGroup.visible) return false;
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const O = raycaster.ray.origin, D = raycaster.ray.direction;
    const t = _rv1.copy(needleHandle.position).sub(O).dot(D);
    return _rv2.copy(O).addScaledVector(D, t).distanceTo(needleHandle.position) < 0.024 * bodyHeight;
  }
  // xoay kim của huyệt đang chọn theo con trỏ + lưu hướng (tạm) vào userNeedle.
  function rotateNeedleTo(ev) {
    if (!rotDot) return;
    rotMoved = true;
    const code = rotDot.userData.code, bh = bodyHeight, L = NEEDLE.len * bh, hl = NEEDLE.handle * bh;
    const axis = dirFromCursor(ev, rotDot.position, L - _needleIns(code, bh, L) + hl / 2);
    clampNeedleAxis(axis, _Nn.copy(rotDot.userData.normal).normalize());
    orientNeedle(rotDot, axis);
    userNeedle[code] = { x: +axis.x.toFixed(4), y: +axis.y.toFixed(4), z: +axis.z.toFixed(4) };
    setEditStatus('Xoay kim ' + code + '… thả & 💾 Lưu để giữ (↺ Auto để bỏ).');
  }

  function applyVisibility() {
    // acuLayerOn: công tắc "Kinh Lạc" trong panel Hệ Cơ Quan — coi huyệt+đường kinh là 1 LỚP đứng
    // ngang hàng Da/Cơ/Xương/... (góp ý người dùng). Tắt lớp này → ẩn HẲN mọi huyệt/đường kinh,
    // bất kể trạng thái ẩn/hiện riêng từng kinh (hidden/focusMer) bên dưới.
    const shown = mer => acuLayerOn && !hidden.has(mer) && (!focusMer || mer === focusMer);   // CHỌN kinh nào → chỉ hiện kinh đó
    // quầng sáng CHỈ hiện khi đang chọn riêng 1 kinh (ít chấm) hoặc huyệt đang chọn → đỡ overdraw khi hiện tất cả
    dotMeshes.forEach(m => { const v = shown(m.userData.mer); m.visible = v; m.userData.halo.visible = v && (!!focusMer || m.userData.code === selectedCode);
      if (m.userData.ring) m.userData.ring.visible = v; });
    for (const k in lineByMer) { const t = lineByMer[k]; t.visible = shown(t.userData.mer); }
    for (const k in flowByMer) { const f = flowByMer[k]; f.sprite.visible = flowOn && shown(f.mer); }
    if (sysTab === 'meridian') renderSystemsPanel();   // tab Kinh Lạc đang mở → đồng bộ 14 dòng
    wake();
  }

  // Bật/tắt NHỊ PHÂN từng hệ (giống hệt công tắc Systems panel của bản demo — không còn thanh mờ
  // per-layer như bản cũ; Da trong mờ nhờ vật liệu CỐ ĐỊNH đặt lúc tạo material, không phải nhờ
  // layerState). `layerState[id]` giờ chỉ là 0 (tắt) hoặc 1 (bật).
  function applyLayers() {
    wake();
    // Đổi hệ nào đang hiện thì bộ phận đang chọn có thể vừa bị ẩn mất — bỏ chọn luôn cho khỏi treo
    // sheet mô tả một thứ không còn trên màn hình (kèm khối tô sáng vàng lơ lửng).
    if (selectedParts && selectedParts.length && !isolateOn
        && !selectedParts.some(pt => (layerState[pt.layerNode] || 0) > 0.004)) {
      selectedParts = null; selectedPartName = '';
      clearHighlight(); updateDrawerActions(); drawerWelcome();
    }
    for (const L of LAYERS) (layerMeshes[L.id] || []).forEach(o => { o.visible = (layerState[L.id] || 0) > 0.004; });
    if (contactShadow) contactShadow.material.opacity = 0.25;   // bóng tiếp đất luôn có (mô hình khỏi 'lơ lửng')
    // Bật/tắt 1 hệ trong lúc đang bóc tách → lưới "kệ hàng" GỘP (xem ensureGlobalExplosionLayout)
    // phải xếp lại (thêm/bớt part tham gia), đúng cách bản demo tính lại layoutKey mỗi khi state
    // đổi (`lastState?.visible!==s.visible`).
    if (inited) applyExplode();
    renderSystemsPanel();
  }

  // ============ Giai đoạn 3 — Hệ Cơ Quan (Human Atlas): bật/tắt + bóc tách + tìm bộ phận ============
  // Bóc tách port TRỰC TIẾP từ app/scene.tsx + app/explosion-layout.ts của
  // github.com/ashemag/human-atlas (đã tải mã nguồn về đọc kỹ) — KHÔNG phải tự nghĩ ra cách khác:
  // họ dịch chuyển TỪNG PART (không phải cả khối 1 hệ) bằng cách gắn vertex-shader đọc lệch
  // (dx,dy,dz) của đúng part đó từ 1 DataTexture (tra theo thuộc tính partIndex trên mỗi đỉnh),
  // rồi CỘNG vào vị trí gốc ngay trong shader — nên chỉ tốn N draw call (N=số hệ) dù có hàng nghìn
  // part di chuyển độc lập. Animation 2 pha: 0→45% toả tia ra quanh thân theo góc riêng của TỪNG
  // HỆ (không phải từng part — các part CÙNG hệ toả cùng hướng ở pha này); 45%→100% CHUYỂN sang
  // xếp phẳng kiểu "kệ hàng" (shelf-packing, port nguyên thuật toán explosion-layout.ts) — giống hệt
  // hiệu ứng "Explode anatomy" 0%→100% của bản demo. Bấm chọn 1 part dùng "picker" riêng (mesh nhỏ
  // dùng CHUNG buffer vị trí của mesh hệ — không copy, chỉ cắt view chỉ số tam giác của đúng part
  // đó) để bắn tia luôn khớp đúng vị trí ĐANG HIỂN THỊ dù đã bóc tách bao nhiêu — nếu bắn tia thẳng
  // vào mesh hệ gốc (chưa dịch theo shader) sẽ trật hoàn toàn khi đã bóc tách, vì Three.js raycast
  // không biết gì về phép dịch làm trong vertex shader.
  //
  // Dữ liệu tra cứu (tuỳ chọn — trang vẫn chạy bình thường nếu 2 file này chưa nạp).
  const ATLAS_IDX = window.HUMAN_ATLAS_INDEX || null;   // layerNode -> [{id, conceptId, localIndex, triStart, triCount, bounds}]
  // { concepts: {conceptId:[vi, en, chưaRà?]}, descTexts: [...], descIdx: {conceptId: chỉ số} }
  const ATLAS_VI = window.HUMAN_ATLAS_VI || null;
  let conceptParts = null;                              // conceptId -> [{layerNode, localIndex, triStart, triCount}]  (dựng 1 lần, lười)
  function ensureConceptParts() {
    if (conceptParts || !ATLAS_IDX) return;
    conceptParts = {};
    for (const layerNode in ATLAS_IDX) {
      for (const e of ATLAS_IDX[layerNode]) {
        (conceptParts[e.conceptId] = conceptParts[e.conceptId] || []).push({ layerNode, localIndex: e.localIndex, triStart: e.triStart, triCount: e.triCount });
      }
    }
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ---- dựng dữ liệu bóc tách cho 1 hệ (gọi 1 lần/hệ sau khi model tải xong) ----
  function prepareExplode(L) {
    const parts = (ATLAS_IDX && ATLAS_IDX[L.id]) || [];
    L.parts = parts;
    L.sysIdx = SYS_ORDER.indexOf(L.id);   // vị trí CHUẨN trong SYSTEMS (anatomy.ts) — quyết định góc toả tia, KHÔNG phải thứ tự hiển thị trong LAYERS
    L.centers = parts.map(p => ({ x: (p.bounds[0][0] + p.bounds[1][0]) / 2, y: (p.bounds[0][1] + p.bounds[1][1]) / 2, z: (p.bounds[0][2] + p.bounds[1][2]) / 2 }));
    L.offsets = parts.map(() => ({ x: 0, y: 0, z: 0 }));
    // Bề rộng texture LÀM TRÒN LÊN LUỸ THỪA 2 — đúng scene.tsx (`T.MathUtils.ceilPowerOfTwo(...)`);
    // WebGL1 hạn chế texture NPOT (chỉ CLAMP_TO_EDGE, không mipmap), làm tròn cho chắc chắn mọi máy.
    L.texW = Math.max(1, THREE.MathUtils.ceilPowerOfTwo(Math.max(1, parts.length)));
    L.offsetData = new Float32Array(L.texW * 4);
    for (let i = 3; i < L.offsetData.length; i += 4) L.offsetData[i] = 1;   // kênh w không dùng, để 1 cho chắc
    L.offsetTex = new THREE.DataTexture(L.offsetData, L.texW, 1, THREE.RGBAFormat, THREE.FloatType);
    // BẮT BUỘC lọc NEAREST: mỗi texel = lệch của ĐÚNG 1 part, nội suy tuyến tính sẽ trộn lệch của 2
    // part cạnh nhau → part bị kéo sai chỗ. (DataTexture ở bản three này vốn mặc định Nearest, đặt
    // tường minh để không phụ thuộc mặc định của bản vendor.)
    L.offsetTex.magFilter = THREE.NearestFilter; L.offsetTex.minFilter = THREE.NearestFilter;
    L.offsetTex.generateMipmaps = false;
    L.offsetTex.needsUpdate = true;
    L.pickers = null;
  }
  // ---- gắn vertex-shader dịch từng đỉnh theo lệch của ĐÚNG part chứa nó (đọc qua partindex) ----
  function attachExplodeShader(mesh, L) {
    const mat = mesh.material;
    mat.onBeforeCompile = shader => {
      shader.uniforms.partOffsetTex = { value: L.offsetTex };
      shader.uniforms.partTexWidth = { value: L.texW };   // PHẢI là bề rộng THẬT của texture (đã làm tròn luỹ thừa 2), không phải số part
      shader.vertexShader = 'attribute float partindex;\nuniform sampler2D partOffsetTex;\nuniform float partTexWidth;\nvarying float vPartOn;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n' +
        'vec2 poUv = vec2((partindex + 0.5) / partTexWidth, 0.5);\n' +
        'vec4 poTexel = texture2D(partOffsetTex, poUv);\n' +
        'transformed += poTexel.xyz;\n' +
        'vPartOn = poTexel.w;'
      );
      // Kênh w = cờ hiện/ẩn TỪNG MẢNH (scene.tsx cũng dùng đúng kênh này: `if (partVisible < 0.5) discard;`).
      // Nhờ nó mới làm được "Chỉ Xem Riêng": ẩn tất cả trừ mấy mảnh của bộ phận đang chọn — điều mà
      // cờ mesh.visible không làm nổi, vì mỗi hệ đã gộp thành MỘT mesh duy nhất.
      shader.fragmentShader = 'varying float vPartOn;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif (vPartOn < 0.5) discard;');
      mesh.userData.explodeUniforms = shader.uniforms;
    };
    mat.needsUpdate = true;
  }
  // ---- xếp phẳng kiểu "kệ hàng" — port NGUYÊN thuật toán app/explosion-layout.ts (createExplosionLayout).
  // aspect = tỉ lệ khung camera (targetWidth co giãn theo khung nhìn, kẹp [0.5,1.5] — ĐÚNG bản gốc,
  // bản port trước THIẾU tham số này nên lưới luôn đóng khít như aspect=1, không thở theo khung hình).
  function packShelves(cards, aspect) {
    const area = cards.reduce((n, c) => n + c.width * c.height, 0);
    const maxWidth = Math.max(0.3, ...cards.map(c => c.width));
    const clampedAspect = Math.max(0.5, Math.min(1.5, aspect || 1));
    const targetWidth = Math.max(maxWidth, Math.sqrt(area * clampedAspect) * 1.18);
    cards.sort((a, b) => b.height - a.height || a.pid.localeCompare(b.pid));   // ĐÚNG a.id.localeCompare(b.id) của explosion-layout.ts (không phải so sánh chuỗi thô)
    const cells = new Map();
    let x = 0, y = 0, row = 0, usedWidth = 0;
    for (const c of cards) {
      if (x > 0 && x + c.width > targetWidth) { x = 0; y += row; row = 0; }
      cells.set(c.key, { x: x + c.width / 2, y: -y - c.height / 2 });
      x += c.width; usedWidth = Math.max(usedWidth, x); row = Math.max(row, c.height);
    }
    const height = y + row;
    cells.forEach(c => { c.x -= usedWidth / 2; c.y += height / 2; });
    return { cells, width: usedWidth, height };
  }
  // ---- gộp part của TẤT CẢ hệ đang BẬT thành 1 lưới "kệ hàng" DUY NHẤT (không phải mỗi hệ 1 lưới
  // riêng chồng lên nhau ở cùng 1 chỗ — lỗi của bản port trước, chính là lý do hiệu ứng "trông
  // không giống" bản demo: demo thật gộp `visibleParts` của MỌI hệ trước khi gọi createExplosionLayout
  // 1 LẦN DUY NHẤT, xem app/scene.tsx dòng dựng layoutKey/packingWidth/packingHeight). Nhớ lại theo
  // (danh sách hệ đang bật + tỉ lệ khung) — đổi 1 trong 2 mới dựng lại, khớp cách bản demo nhớ
  // `layoutKey` để khỏi tính lại mỗi khung hình.
  let globalLayout = null, globalLayoutKey = '', packingWidth = 1, packingHeight = 1;
  function ensureGlobalExplosionLayout() {
    const visKey = LAYERS.filter(L => (layerState[L.id] || 0) > 0.004).map(L => L.id).join(',');
    const aspect = camera ? camera.aspect : 1;
    const key = visKey + '|' + aspect.toFixed(3);
    if (globalLayout && key === globalLayoutKey) return globalLayout;
    const cards = [];
    LAYERS.forEach(L => {
      if ((layerState[L.id] || 0) <= 0.004 || !L.parts) return;
      L.parts.forEach((p, i) => {
        cards.push({
          key: L.id + '#' + i, pid: p.id || '',
          width: Math.max(0.035, p.bounds[1][0] - p.bounds[0][0]) + 0.04,
          height: Math.max(0.035, p.bounds[1][1] - p.bounds[0][1]) + 0.04,
        });
      });
    });
    globalLayout = packShelves(cards, aspect);
    packingWidth = globalLayout.width; packingHeight = globalLayout.height;   // đơn vị LOCAL (nhân modelScale mới ra world) — dùng cho fitExplode()
    globalLayoutKey = key;
    return globalLayout;
  }
  // ---- picker riêng từng part: DÙNG CHUNG buffer vị trí của mesh hệ (không copy), chỉ cắt VIEW
  // chỉ số tam giác của đúng part — bắn tia rẻ, chính xác dù đã bóc tách. Dựng LƯỜI (chỉ khi hệ
  // được bật xem lần đầu) vì có hệ tới 639 part (Động Mạch).
  function ensurePickers(L) {
    if (L.pickers) return;
    const mesh = (layerMeshes[L.id] || [])[0];
    if (!mesh || !L.parts.length) { L.pickers = []; return; }
    const geo = mesh.geometry, posAttr = geo.attributes.position, fullIdx = geo.index.array;
    L.pickers = L.parts.map((p, i) => {
      const start = p.triStart * 3, count = p.triCount * 3;
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', posAttr);                                    // CHUNG buffer, không copy
      pg.setIndex(new THREE.BufferAttribute(fullIdx.subarray(start, start + count), 1)); // view, không copy
      const pk = new THREE.Mesh(pg, mesh.material);
      pk.matrixAutoUpdate = false;
      const off = L.offsets[i]; pk.position.set(off.x, off.y, off.z); pk.updateMatrix(); pk.updateMatrixWorld(true);
      return pk;
    });
  }

  // ================= CHỈ XEM RIÊNG (isolate) =================
  // Port "Isolate structure" của bản demo: ẩn MỌI mảnh trừ các mảnh thuộc bộ phận đang chọn, rồi bay
  // camera tới ôm gọn nó. Bản demo cũng ép Bóc Tách về 0 khi bật (page.tsx: `isolate:!s.isolate, explode:0`).
  let isolateOn = false, isolateParts = null, isolateName = '';
  // key "layerId#localIndex" của các mảnh được phép hiện; null = hiện tất cả
  let isolateKeys = null;
  function applyPartVisibility() {
    for (const L of LAYERS) {
      if (!L.parts || !L.offsetData) continue;
      for (let i = 0; i < L.parts.length; i++) {
        const on = !isolateKeys || isolateKeys.has(L.id + '#' + i);
        L.offsetData[i * 4 + 3] = on ? 1 : 0;
      }
      if (L.offsetTex) L.offsetTex.needsUpdate = true;
    }
    updatePartMarkers();
    wake();
  }
  function setIsolate(on, parts, name) {
    isolateOn = !!on;
    if (isolateOn) {
      isolateParts = parts || isolateParts; isolateName = name || isolateName;
      isolateKeys = new Set((isolateParts || []).map(p => p.layerNode + '#' + p.localIndex));
      // bật các hệ có chứa mảnh đang xem, nếu không thì mesh cả hệ bị ẩn, mảnh cũng chẳng hiện được
      (isolateParts || []).forEach(p => { layerState[p.layerNode] = 1; });
      explodeAmount = 0;                                   // demo: isolate luôn kéo Bóc Tách về 0
      const sl = $('mspExplode'); if (sl) sl.value = '0';
      const sv = $('mspExplodeV'); if (sv) sv.textContent = '0%';
      acuLayerOn = false;                                  // giấu kinh lạc cho khỏi che bộ phận
    } else {
      isolateKeys = null; isolateParts = null; isolateName = '';
      acuLayerOn = true;
    }
    applyLayers(); applyVisibility(); applyPartVisibility();
    updateDrawerActions();
    if (isolateOn) { const geo = highlightParts(isolateParts); if (geo) focusStructure(geo); }
    else resetView();
    updateCaption();
  }

  // ---- Chấm tròn đánh dấu TỪNG MẢNH khi đã bóc tách sâu — port `markers` (THREE.Points) của
  // app/scene.tsx: mảnh nhỏ li ti (mạch máu, hạch...) khi trải phẳng gần như tàng hình, chấm giúp
  // thấy được "kho" có bao nhiêu mảnh và bấm trúng. Bản gốc: màu #64748b, size 5, KHÔNG co theo xa
  // gần, opacity .72, tắt depthTest, bo tròn bằng cách cắt góc trong fragment shader; chỉ hiện khi
  // amount > .75. Đặt làm CON của modelRoot vì toạ độ tâm/lệch đều là toạ độ LOCAL.
  let partMarkers = null, markerPositions = null;
  function buildPartMarkers() {
    if (partMarkers) { modelRoot.add(partMarkers); return; }
    const total = LAYERS.reduce((n, L) => n + ((L.parts && L.parts.length) || 0), 0);
    if (!total) return;
    markerPositions = new Float32Array(total * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(markerPositions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x64748b, size: 5, sizeAttenuation: false, transparent: true, opacity: 0.72, depthTest: false });
    mat.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');
    };
    partMarkers = new THREE.Points(geo, mat);
    partMarkers.frustumCulled = false; partMarkers.renderOrder = 10; partMarkers.visible = false;
    modelRoot.add(partMarkers);
  }
  // Dòng chú thích dưới mô hình — NGƯỠNG 0.95/0.05 đúng scene-caption của bản demo (app/page.tsx:
  // isolate ? tên cấu trúc : explode>.95 ? ANATOMICAL INVENTORY : explode>.05 ? SEPARATED STRUCTURES
  // : ADULT HUMAN · MALE). Nhánh "đang xem riêng" là thứ cho người dùng biết mình đang ở chế độ nào.
  function updateCaption() {
    if (!captionText) return;
    captionText.textContent = isolateOn ? (isolateName || 'Đang Xem Riêng')
      : explodeAmount > 0.95 ? 'Danh Mục Giải Phẫu'
      : explodeAmount > 0.05 ? 'Các Bộ Phận Tách Rời'
      : 'Cơ Thể Người Trưởng Thành';
  }

  const MARKER_HIDDEN = 1e4;   // mảnh của hệ đang TẮT: đẩy ra xa cho khuất mắt (đúng cách bản gốc làm)
  function updatePartMarkers() {
    if (!partMarkers || !markerPositions) return;
    let k = 0;
    for (const L of LAYERS) {
      if (!L.parts) continue;
      const on = (layerState[L.id] || 0) > 0.004;
      for (let i = 0; i < L.parts.length; i++, k++) {
        const shown = on && (!isolateKeys || isolateKeys.has(L.id + '#' + i));
        if (!shown) { markerPositions[k * 3] = markerPositions[k * 3 + 1] = markerPositions[k * 3 + 2] = MARKER_HIDDEN; continue; }
        const c = L.centers[i], o = L.offsets[i];
        markerPositions[k * 3] = c.x + o.x; markerPositions[k * 3 + 1] = c.y + o.y; markerPositions[k * 3 + 2] = c.z + o.z;
      }
    }
    partMarkers.geometry.attributes.position.needsUpdate = true;
    partMarkers.visible = explodeAmount > 0.75;
  }

  // ---- Bóc tách (Explode) — tính lệch (dx,dy,dz) TỪNG PART theo đúng công thức scene.tsx (2 pha),
  // ghi vào texture (GPU đọc để vẽ) + L.offsets (JS đọc để đặt picker/tô sáng). Hằng số 0.48/0.28/
  // 0.45 LẤY THẲNG từ scene.tsx (không tự đặt lại) — cùng đơn vị vì cùng nguồn BodyParts3D, mô hình
  // cao ~1.7 giống hệt. Toạ độ này CỘNG vào vị trí LOCAL (trước biến đổi model) nên KHÔNG nhân
  // bodyHeight/modelScale — xem attachExplodeShader(). Góc toả tia dùng SYS_ORDER (thứ tự CHUẨN
  // SYSTEMS[] của anatomy.ts), KHÔNG phải thứ tự hiển thị LAYERS; mốc chiều cao dùng localMidY (toạ
  // độ gốc glTF), KHÔNG phải bodyMinY/bodyHeight (world-space, sai khung quy chiếu — xem khai báo).
  let explodeAmount = 0, _lastExplodeExtent = 0;         // 0..1 (_lastExplodeExtent: để còn kéo camera VỀ khung thường khi trả thanh trượt về 0)
  const EXPLODE_R = 0.48, EXPLODE_YS = 0.28, EXPLODE_SPLIT = 0.45, SYS_N = SYS_ORDER.length;
  function applyExplode() {
    const layout = explodeAmount > EXPLODE_SPLIT ? ensureGlobalExplosionLayout() : null;
    LAYERS.forEach(L => {
      if (!L.parts || !L.parts.length) return;
      const angle = (L.sysIdx / SYS_N) * Math.PI * 2, sinA = Math.sin(angle), cosA = Math.cos(angle);
      for (let i = 0; i < L.parts.length; i++) {
        const c = L.centers[i];
        let dx, dy, dz;
        if (explodeAmount <= EXPLODE_SPLIT) {
          const t = explodeAmount / EXPLODE_SPLIT;
          dx = sinA * t * EXPLODE_R; dy = (c.y - localMidY) * t * EXPLODE_YS; dz = cosA * t * EXPLODE_R;
        } else {
          const t = (explodeAmount - EXPLODE_SPLIT) / (1 - EXPLODE_SPLIT);
          const cell = layout.cells.get(L.id + '#' + i);
          const destX = cell ? cell.x : c.x, destY = cell ? (localMidY + cell.y) : c.y;
          dx = lerp(sinA * EXPLODE_R, destX - c.x, t);
          dy = lerp((c.y - localMidY) * EXPLODE_YS, destY - c.y, t);
          dz = lerp(cosA * EXPLODE_R, -c.z, t);
        }
        L.offsets[i].x = dx; L.offsets[i].y = dy; L.offsets[i].z = dz;
        L.offsetData[i * 4] = dx; L.offsetData[i * 4 + 1] = dy; L.offsetData[i * 4 + 2] = dz;
      }
      if (L.offsetTex) L.offsetTex.needsUpdate = true;
      if (L.pickers) for (let i = 0; i < L.pickers.length; i++) {
        const pk = L.pickers[i]; if (!pk) continue;
        const off = L.offsets[i]; pk.position.set(off.x, off.y, off.z); pk.updateMatrix(); pk.updateMatrixWorld(true);
      }
    });
    // Kinh Lạc (huyệt + đường kinh) COI LÀ CÙNG 1 LỚP với Da — Da chỉ có ĐÚNG 1 part ("Skin") nên
    // chỉ có 1 vector lệch; cộng thẳng vào cả khối huyệt/đường kinh để chúng "bám" theo Da mỗi khi
    // Da bị bóc tách/di chuyển, đúng góp ý người dùng ("da và kinh lạc là 1 lớp bóc tách"). LƯU Ý
    // ĐƠN VỊ: L.offsets là toạ độ LOCAL (trước modelRoot.scale, cộng thẳng trong vertex shader) —
    // còn dotsGroup/... là CON TRỰC TIẾP CỦA scene (không phải modelRoot), toạ độ huyệt vốn tính
    // theo bodyHeight (đơn vị WORLD, đã qua chuẩn hoá) -> phải nhân modelScale mới đúng đơn vị.
    const skinOff = (LBY.skin.offsets && LBY.skin.offsets[0]) || { x: 0, y: 0, z: 0 };
    const sx = skinOff.x * modelScale, sy = skinOff.y * modelScale, sz = skinOff.z * modelScale;
    dotsGroup.position.set(sx, sy, sz);
    linesGroup.position.set(sx, sy, sz);
    flowGroup.position.set(sx, sy, sz);
    needleGroup.position.set(sx, sy, sz);
    clearHighlight();   // đừng giữ tô sáng cũ trong lúc bóc tách — tránh phải dựng lại geometry mỗi lần kéo thanh trượt
    // Dòng chú thích trên thanh Bóc Tách — NGƯỠNG 0.95/0.05 ĐÚNG scene-caption thật của bản demo
    // (app/page.tsx: state.explode>.95 ? 'ANATOMICAL INVENTORY' : state.explode>.05 ? 'SEPARATED STRUCTURES' : 'ADULT HUMAN · MALE').
    updatePartMarkers();
    updateCaption();
    // Camera + bối cảnh chạy theo mức bóc tách, ĐÚNG scene.tsx:
    //  · fit(...) với extent = (amount-.3)/.7  → 0..30% giữ khung thường, sau đó lùi dần ra ôm lưới
    //  · bệ/bóng đổ tắt khi amount > .5 (mảnh đã bay khỏi tư thế đứng, bóng dưới chân thành vô nghĩa)
    //  · amount > .8 thì chuột trái đổi từ XOAY sang KÉO NGANG (lưới phẳng, xoay chỉ tổ rối)
    if (inited && modelRoot) {
      const extent = Math.max(0, (explodeAmount - 0.3) / 0.7);
      if (extent > 0 || _lastExplodeExtent > 0) fitExplode(extent);
      _lastExplodeExtent = extent;
      if (contactShadow) contactShadow.material.opacity = explodeAmount < 0.5 ? 0.25 : 0;   // bóc tách sâu thì bỏ bóng
      controls.enableRotate = explodeAmount < 0.8;
      if (THREE.MOUSE) controls.mouseButtons.LEFT = explodeAmount < 0.8 ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
      if (THREE.TOUCH) controls.touches.ONE = explodeAmount < 0.8 ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN;
    }
    renderViewButtons();
    wake();
  }

  // ---- tra part theo hit trả về từ pickBody() ----
  function resolvePartFromHit(best) {
    if (!best) return null;
    const L = LBY[best.layerNode];
    const idx = L.pickers ? L.pickers.indexOf(best.hit.object) : -1;
    return idx < 0 ? null : { layerNode: best.layerNode, entry: L.parts[idx] };
  }
  // bắn tia vào picker riêng từng part (đã dịch đúng theo lệch hiện tại — TẤT CẢ 15 hệ đều dùng
  // chung cách này, không còn phân biệt "hệ lõi" nữa) — chỉ tính hệ đang HIỆN (đúng op>0.004 như
  // applyLayers).
  function pickBody(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    let best = null, bestDist = Infinity;
    for (const L of LAYERS) {
      if ((layerState[L.id] || 0) <= 0.004) continue;
      ensurePickers(L);
      if (!L.pickers.length) continue;
      const hits = raycaster.intersectObjects(L.pickers, false);
      if (hits[0] && hits[0].distance < bestDist) { bestDist = hits[0].distance; best = { layerNode: L.id, hit: hits[0], partHit: true }; }
    }
    return best;
  }

  // ---- tô sáng 1 cấu trúc (gộp các dải tam giác thuộc parts đã cho thành 1 mesh riêng, tách khỏi
  // mesh hệ gốc — rẻ vì chỉ dựng lúc bấm chọn, không phải dựng sẵn cho 2.234 part). CỘNG THÊM lệch
  // bóc tách hiện tại (L.offsets) của từng part TRƯỚC khi áp world matrix, để khớp đúng vị trí đang
  // hiển thị qua shader (Three.js raycast/geometry không tự biết phép dịch làm trong vertex shader).
  let highlightMesh = null;
  function clearHighlight() {
    if (!highlightMesh) return;
    scene.remove(highlightMesh); highlightMesh.geometry.dispose(); highlightMesh.material.dispose(); highlightMesh = null;
  }
  const _hlV = new THREE.Vector3();
  function highlightParts(parts) {
    clearHighlight();
    if (!parts || !parts.length) return null;
    const posArr = [], idxArr = []; let vOff = 0;
    for (const p of parts) {
      const L = LBY[p.layerNode];
      const srcMesh = (layerMeshes[p.layerNode] || [])[0]; if (!srcMesh) continue;
      const geo = srcMesh.geometry, pos = geo.attributes.position, index = geo.index;
      if (!index) continue;
      srcMesh.updateMatrixWorld(true);
      const mw = srcMesh.matrixWorld;
      const off = (L.offsets && L.offsets[p.localIndex]) || { x: 0, y: 0, z: 0 };
      const startI = p.triStart * 3, endI = Math.min((p.triStart + p.triCount) * 3, index.count);
      const localMap = new Map();
      for (let i = startI; i < endI; i++) {
        const gi = index.getX(i);
        let li = localMap.get(gi);
        if (li === undefined) {
          li = vOff++; localMap.set(gi, li);
          _hlV.set(pos.getX(gi) + off.x, pos.getY(gi) + off.y, pos.getZ(gi) + off.z).applyMatrix4(mw);
          posArr.push(_hlV.x, _hlV.y, _hlV.z);
        }
        idxArr.push(li);
      }
    }
    if (!posArr.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
    g.setIndex(idxArr);
    g.computeVertexNormals();
    g.computeBoundingSphere();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd54a, emissive: 0xffb300, emissiveIntensity: 0.85, roughness: 0.35, side: THREE.DoubleSide,
      transparent: true, opacity: 0.97, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    const mesh = new THREE.Mesh(g, mat);
    mesh.renderOrder = 6; mesh.frustumCulled = false;
    scene.add(mesh);
    highlightMesh = mesh;
    wake();
    return g;
  }

  // ---- bay camera tới 1 cấu trúc (tương tự focusPoint() nhưng cho bounding sphere thay vì 1 điểm) ----
  function focusStructure(geo) {
    if (!geo || !camera || !controls) return;
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    const c = geo.boundingSphere.center, rad = Math.max(geo.boundingSphere.radius, 0.02 * bodyHeight);
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1); else dir.normalize();
    const dist = Math.max(rad * 2.8, 0.14 * bodyHeight);
    camAnim = { fromPos: camera.position.clone(), toPos: c.clone().addScaledVector(dir, dist),
      fromTgt: controls.target.clone(), toTgt: c.clone(), t0: clock(), dur: 0.7 };
    wake();
  }

  // ---- hiện thông tin cấu trúc đã chọn trong drawer (tái dùng #drawerBody/.map-drawer) ----
  function showBodyPart(conceptId, parts, groupKidCount) {
    drawerMer = null;
    const viEntry = ATLAS_VI && ATLAS_VI.concepts[conceptId];
    const nameVi = viEntry ? viEntry[0] : conceptId;
    const nameEn = viEntry ? viEntry[1] : '';
    const byLayer = {};
    parts.forEach(p => { byLayer[p.layerNode] = (byLayer[p.layerNode] || 0) + 1; });
    const sysLabels = Object.keys(byLayer).map(id => (LBY[id] && LBY[id].label) || id).join(', ');
    setDrawer(
      `<div class="dr-head"><span class="dr-code" style="background:${'#' + ((LBY[parts[0].layerNode] || {}).color || 0x888888).toString(16).padStart(6,'0')}">${sysLabels}</span>` +
      `<h3>${nameVi}</h3></div>` +
      // Mô tả riêng của chính bộ phận đó nếu đã viết; không thì lấy mô tả chung của hệ cơ quan.
      ((() => {
        const i = ATLAS_VI && ATLAS_VI.descIdx && ATLAS_VI.descIdx[conceptId];
        const riêng = (i !== undefined && ATLAS_VI.descTexts) ? ATLAS_VI.descTexts[i] : null;
        const text = riêng || SYS_DESC[parts[0].layerNode];
        return text ? `<p class="dr-desc">${text}</p>` : '';
      })()) +
      (nameEn ? `<div class="dr-row"><h4>Tên gốc</h4><p>${nameEn}</p></div>` : '') +
      `<div class="dr-row"><h4>Số khối hình học</h4><p>${parts.length}${groupKidCount ? ` (gộp từ ${groupKidCount} bộ phận con)` : ''}</p></div>` +
      (viEntry && viEntry[2]
        ? `<div class="dr-note">Tên này chưa rà xong — tạm ghép máy, xem tên gốc phía trên cho chắc.</div>`
        : ''));
    // nhớ lựa chọn để 2 nút "Chỉ Xem Riêng" / "Bỏ Chọn" ở đáy sheet biết thao tác trên cái gì
    selectedParts = parts; selectedPartName = nameVi;
    updateDrawerActions();
  }
  // Bộ phận giải phẫu đang chọn (khác selectedCode — cái đó là HUYỆT đang chọn)
  let selectedParts = null, selectedPartName = '';
  // Hàng nút đáy sheet: chỉ hiện khi đang chọn 1 bộ phận giải phẫu. Nhãn nút chính đảo chiều theo
  // trạng thái, đúng bản demo ("Isolate structure" <-> "Show surrounding anatomy").
  function updateDrawerActions() {
    const box = $('drActions'); if (!box) return;
    const has = !!(selectedParts && selectedParts.length);
    box.hidden = !has;
    if (!has) return;
    const lbl = box.querySelector('.dr-primary-label'), btn = $('drIsolate');
    if (lbl) lbl.textContent = isolateOn ? 'Xem Lại Toàn Thân' : 'Chỉ Xem Riêng Bộ Phận';
    if (btn) { btn.classList.toggle('active', isolateOn); btn.setAttribute('aria-pressed', isolateOn ? 'true' : 'false'); }
  }
  // Bỏ chọn bộ phận: gỡ tô sáng + thoát chế độ xem riêng + đóng sheet (lối thoát mà trước đây thiếu
  // hẳn — bấm ✕ chỉ đóng sheet, để lại khối vàng lơ lửng trên mô hình).
  function clearSelection() {
    if (isolateOn) setIsolate(false);
    selectedParts = null; selectedPartName = '';
    clearHighlight();
    updateDrawerActions();
    drawerWelcome();
  }

  // ---- TÊN GỘP: gom khối con ----
  // Atlas có 3.432 tên nhưng CHỈ 1.655 tên gắn với khối hình học. Số còn lại là tên GỘP của cả một
  // nhóm — atlas không dựng khối nào tên "xương sườn", nó dựng 24 khối "xương sườn 1 phải"… Trước
  // đây bấm vào tên gộp thì code không tìm ra khối nào rồi THOÁT IM LẶNG: không tô sáng, không mở
  // bảng, người dùng tưởng bấm hỏng.
  //
  // Cách suy khối con: tên con CHỨA TRỌN dãy từ của tên cha (so theo TỪNG TỪ, không phải chuỗi con —
  // so chuỗi con thì "rib" sẽ dính "cribriform"). Có bỏ trước các tiền tố thuần gộp ("zone of",
  // "region of"…) để "khu vực cơ ngực lớn" cũng gom được 6 phần của cơ ngực lớn.
  // Suy được ~40% số tên gộp; phần còn lại là khái niệm trừu tượng thật ("cây mạch máu", "nối
  // thông") — với chúng ta báo rõ cho người dùng thay vì im lặng.
  const GROUP_PREFIX = /^(zone|region|set|subdivision|segment|portion|part|group|collection)\s+of\s+/i;
  let groupKids = null;                                   // conceptId cha -> [conceptId con] (dựng lười)
  function conceptTokens(s) { return String(s).toLowerCase().match(/[a-z0-9]+/g) || []; }
  function tokenSeqIn(hay, needle) {
    if (!needle.length || needle.length > hay.length) return false;
    for (let i = 0; i + needle.length <= hay.length; i++) {
      let ok = true;
      for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  }
  function childConcepts(conceptId) {
    if (!ATLAS_VI || !ATLAS_VI.concepts) return [];
    if (!groupKids) groupKids = {};
    if (groupKids[conceptId]) return groupKids[conceptId];
    const entry = ATLAS_VI.concepts[conceptId];
    if (!entry) return (groupKids[conceptId] = []);
    let base = entry[1] || '';
    for (let i = 0; i < 3; i++) { const n = base.replace(GROUP_PREFIX, ''); if (n === base) break; base = n; }
    const want = conceptTokens(base);
    const kids = [];
    if (want.length) {
      ensureConceptParts();
      for (const id in conceptParts) {                    // chỉ duyệt concept CÓ khối hình học
        if (id === conceptId) continue;
        const e = ATLAS_VI.concepts[id];
        if (e && tokenSeqIn(conceptTokens(e[1]), want)) kids.push(id);
      }
    }
    return (groupKids[conceptId] = kids);
  }
  /** Khối hình học của 1 concept; nếu là tên gộp thì gom khối của các concept con. */
  function partsOfConcept(conceptId) {
    ensureConceptParts();
    const own = conceptParts && conceptParts[conceptId];
    if (own && own.length) return { parts: own, kids: 0 };
    const kids = childConcepts(conceptId);
    const parts = [];
    for (const id of kids) { const ps = conceptParts[id]; if (ps) parts.push(...ps); }
    return { parts, kids: kids.length };
  }

  function selectConcept(conceptId) {
    ensureConceptParts();
    const got = partsOfConcept(conceptId);
    const parts = got.parts;
    if (!parts || !parts.length) {                        // khái niệm trừu tượng — nói rõ, đừng im lặng
      const e = ATLAS_VI && ATLAS_VI.concepts[conceptId];
      setDrawer('<div class="dr-head"><h3>' + esc(e ? e[0] : conceptId) + '</h3></div>' +
        (e && e[1] ? '<div class="dr-row"><h4>Tên gốc</h4><p>' + esc(e[1]) + '</p></div>' : '') +
        '<div class="dr-note">Đây là TÊN GỘP của một nhóm khái niệm, atlas không dựng khối hình học riêng cho nó ' +
        'và cũng không có khối con nào mang tên này — nên không tô sáng được trên mô hình. ' +
        'Hãy tìm một bộ phận cụ thể hơn.</div>');
      clearHighlight();
      return;
    }
    // bật hệ tương ứng nếu đang tắt, để thấy được cấu trúc vừa chọn
    const layerNodes = [...new Set(parts.map(p => p.layerNode))];
    let changed = false;
    layerNodes.forEach(id => { if ((layerState[id] || 0) < 0.05) { layerState[id] = 1; changed = true; } });
    if (changed) { applyLayers(); renderSystemsPanel(); }
    const geo = highlightParts(parts);
    if (geo) focusStructure(geo);
    showBodyPart(conceptId, parts, got.kids);
  }

  // ---- panel "Hệ Cơ Quan" — chip bật/tắt CẢ 16 "lớp" (15 hệ giải phẫu + Kinh Lạc đứng NGANG
  // HÀNG cùng nhóm, đúng góp ý người dùng: "da và kinh lạc là 1 lớp bóc tách như cơ/xương/cơ
  // quan") + 1 thanh Bóc Tách (Explode) duy nhất + ô Tìm bộ phận. Theo mẫu editPanel: dựng bằng
  // JS, dock đầu sidebar phải. MẶC ĐỊNH MỞ SẴN (không ẩn sau nút bấm) — giống panel "Systems" của
  // bản demo Human Atlas luôn hiện sẵn ở cạnh trái, không phải bấm mới thấy.
  let systemsPanel = null, systemsMode = true;
  const KINH_LAC_ID = '__kinhlac__';
  const MER_PREFIX = 'mer:';        // data-sys của 1 dòng đường kinh trong tab Kinh Lạc (vd "mer:LU")
  // 3 nút lọc ĐÚNG bản demo (app/page.tsx .layer-presets: All/Skeleton/Organs) — KHÔNG lọc danh
  // sách hiển thị (bản port trước làm vậy, SAI) mà là 3 "macro" gán thẳng layerState, giống hệt demo
  // (`visible:['skeletal']`, `visible:[...6 hệ nội tạng]`) — trạng thái "đang bật" (.on) tính LẠI mỗi
  // lần render từ layerState hiện tại (như aria-pressed của demo), không giữ biến tab riêng.
  const ORGANS_PRESET = ['cardiac', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive'];
  const SKELETON_PRESET = ['muscle', 'bone'];
  /* Tab "Kinh Lạc" KHÁC 3 tab kia: 3 tab kia là macro gán layerState rồi vẫn hiện danh sách 16 hệ,
   * còn Kinh Lạc ĐỔI HẲN NỘI DUNG danh sách sang 14 đường kinh (12 chính + Nhâm/Đốc) — đúng góp ý
   * "giải phẫu này thì kinh lạc là phần quan trọng nhất, đưa các đường kinh về tab con của Kinh
   * Lạc" (trước đây danh sách đường kinh nằm trong sheet chi tiết bên phải, phải bấm mới thấy).
   * Vì vậy phải giữ biến sysTab: 'systems' = đang xem 16 hệ · 'meridian' = đang xem 14 đường kinh. */
  const SYS_TABS = [
    { id: 'all', label: 'Tất Cả' },
    { id: 'meridian', label: 'Kinh Lạc' },
    { id: 'skeleton', label: 'Khung Xương' },
    { id: 'organs', label: 'Nội Tạng' },
  ];
  let sysTab = 'systems';
  // 4 dòng GHIM đầu danh sách hệ, đúng thứ tự người dùng chốt (khớp MAC_DINH_BAT).
  const PIN_ORDER = ['muscle', 'bone', KINH_LAC_ID, 'skin'];
  const hexOf = c => '#' + c.toString(16).padStart(6, '0');
  function sysRowHtml(id, label, hex, count, on, pinned, cls) {
    return `<div class="sys-row${on ? ' enabled' : ''}${pinned ? ' sys-row--pin' : ''}${cls ? ' ' + cls : ''}" data-sys="${id}">
      <button type="button" class="sys-name" data-name="${id}">
        <span class="sys-dot" style="--c:${hex}"></span>
        <span class="sys-label">${label}</span>
      </button>
      <span class="sys-count">${count === '' ? '' : count}</span>
      <label class="sys-switch"><input type="checkbox" data-sw="${id}"${on ? ' checked' : ''}><span class="sys-slider"></span></label>
    </div>`;
  }
  function ensureSystemsPanel() {
    if (systemsPanel) return;
    // Panel "Hệ Cơ Quan" — clone cấu trúc widget thật của bản demo: đầu đề + số đếm, hàng tab lọc,
    // danh sách dòng (chấm màu + tên + số phần + công tắc gạt), chân panel (tổng đang hiện + nút
    // ẩn/hiện tất cả). Thanh "Bóc Tách" + ô "Tìm bộ phận" là HTML TĨNH trong HOST_HTML (acuMap3d.ts,
    // thẻ nổi RIÊNG dưới-giữa/trên-phải) — ở đây chỉ gắn listener cho chúng.
    systemsPanel = document.createElement('div');
    systemsPanel.className = 'map-systems-panel glass';
    systemsPanel.innerHTML =
      '<div class="sys-head"><h3>Hệ Cơ Quan</h3><span class="sys-count-badge" id="sysCountBadge"></span>' +
      '<button type="button" class="sys-fold" id="sysFold" title="Thu gọn / mở lại panel" aria-label="Thu gọn panel">▲</button></div>' +
      '<div class="sys-tabs">' + SYS_TABS.map(t => `<button type="button" class="sys-tab${t.id === 'all' ? ' on' : ''}" data-tab="${t.id}">${t.label}</button>`).join('') + '</div>' +
      '<div class="sys-list" id="sysList"></div>' +
      '<div class="sys-foot"><span id="sysFootCount"></span><button type="button" id="sysFootBtn">Ẩn tất cả</button></div>';
    stage.appendChild(systemsPanel);

    systemsPanel.addEventListener('click', e => {
      if (e.target.closest('#sysFold')) { systemsPanel.classList.toggle('folded'); return; }
      const tab = e.target.closest('.sys-tab');
      if (tab) {
        const id = tab.dataset.tab;
        clearHighlight();
        if (id === 'meridian') {
          // Vào tab Kinh Lạc = "cho tôi xem đường kinh": bật lớp Kinh Lạc và bỏ mọi bộ lọc riêng
          // (ẩn từng kinh / đang xem riêng 1 kinh) để danh sách 14 kinh mở ra ở trạng thái đủ.
          sysTab = 'meridian';
          acuLayerOn = true; hidden.clear(); focusMer = null;
          applyVisibility(); renderSystemsPanel();
          return;
        }
        sysTab = 'systems';
        if (id === 'all') { LAYERS.forEach(L => { layerState[L.id] = 1; }); acuLayerOn = true; }
        else if (id === 'skeleton') {
          // "Khung Xương" = khung nhìn cơ-xương-khớp: giữ CƠ cùng XƯƠNG (xương trần không đọc được
          // vị trí huyệt vì huyệt bám theo khe cơ/gân) + Kinh Lạc, đúng yêu cầu người dùng.
          LAYERS.forEach(L => { layerState[L.id] = SKELETON_PRESET.includes(L.id) ? 1 : 0; });
          acuLayerOn = true;
        } else if (id === 'organs') {
          // "Nội Tạng" = chỉ 6 hệ tạng, TẮT Kinh Lạc để lưới đường kinh không che tạng.
          LAYERS.forEach(L => { layerState[L.id] = ORGANS_PRESET.includes(L.id) ? 1 : 0; });
          acuLayerOn = false;
        }
        applyLayers(); applyVisibility();
        return;
      }
      const nameBtn = e.target.closest('.sys-name');
      if (nameBtn) {
        const id = nameBtn.dataset.name;
        // Bấm TÊN 1 đường kinh (trong tab Kinh Lạc) → xem riêng kinh đó, bấm lại → hiện lại tất cả.
        if (id.startsWith(MER_PREFIX)) {
          const mer = id.slice(MER_PREFIX.length);
          focusMer = (focusMer === mer) ? null : mer;
          hidden.delete(mer); acuLayerOn = true;
          clearNeedle();
          applyVisibility(); renderSystemsPanel();
          if (focusMer) openMeridianDrawer(focusMer); else drawerWelcome();
          return;
        }
        if (id === KINH_LAC_ID) { openMeridianTab(); return; }
        // Bấm TÊN 1 hệ → "solo" hệ đó (y hệt demo: `visible:[s.id]`) — khác công tắc gạt (chỉ bật/tắt
        // riêng hệ đó, giữ nguyên các hệ khác).
        clearHighlight();
        LAYERS.forEach(L => { layerState[L.id] = L.id === id ? 1 : 0; });
        acuLayerOn = false;
        applyLayers(); applyVisibility();
        return;
      }
      const footBtn = e.target.closest('#sysFootBtn');
      if (footBtn) {
        clearHighlight();
        if (sysTab === 'meridian') {
          // Trong tab Kinh Lạc nút này là 2 chiều (ẩn hết ↔ hiện hết 14 kinh) — khác tab hệ, vì ở
          // đây không có tab "Tất Cả" riêng để bật lại.
          const dangHien = acuLayerOn && presentMer.some(m => !hidden.has(m));
          if (dangHien) { presentMer.forEach(m => hidden.add(m)); focusMer = null; }
          else { hidden.clear(); focusMer = null; acuLayerOn = true; }
          applyVisibility(); renderSystemsPanel();
          return;
        }
        // "Hide all" của demo LUÔN tắt hết (1 chiều, không có "hiện lại tất cả" — dùng tab Tất Cả).
        LAYERS.forEach(L => { layerState[L.id] = 0; });
        acuLayerOn = false;
        applyLayers(); applyVisibility();
      }
    });
    systemsPanel.addEventListener('change', e => {
      const sw = e.target.closest('input[data-sw]'); if (!sw) return;
      const id = sw.dataset.sw;
      if (id.startsWith(MER_PREFIX)) {
        // Công tắc từng đường kinh. Đang "xem riêng" 1 kinh mà gạt công tắc thì bỏ luôn chế độ xem
        // riêng — nếu không, kinh vừa bật vẫn bị focusMer ẩn đi và người dùng tưởng công tắc hỏng.
        const mer = id.slice(MER_PREFIX.length);
        if (sw.checked) hidden.delete(mer); else hidden.add(mer);
        focusMer = null; acuLayerOn = true;
        applyVisibility(); renderSystemsPanel();
      }
      else if (id === KINH_LAC_ID) { acuLayerOn = sw.checked; applyVisibility(); renderSystemsPanel(); }
      else { layerState[id] = sw.checked ? 1 : 0; applyLayers(); }
    });
    const explodeInput = $('mspExplode');
    explodeInput?.addEventListener('input', () => {
      explodeAmount = (+explodeInput.value) / 100;
      const v = $('mspExplodeV'); if (v) v.textContent = explodeInput.value + '%';
      applyExplode();
    });
    const searchInput = $('mapPartSearch'), resultsBox = $('mapPartResults');
    function closeResults() { resultsBox.classList.remove('open'); resultsBox.innerHTML = ''; }
    searchInput?.addEventListener('input', () => {
      const q = norm(searchInput.value.trim());
      if (!q || !ATLAS_VI) { closeResults(); return; }
      const rows = [];
      const cs = ATLAS_VI.concepts;
      for (const id in cs) {
        const [vi, en] = cs[id];
        if (norm(vi).includes(q) || norm(en).includes(q)) { rows.push({ id, vi, en }); if (rows.length >= 40) break; }
      }
      if (!rows.length) { resultsBox.innerHTML = '<div class="mpr-empty">Không tìm thấy bộ phận phù hợp.</div>'; resultsBox.classList.add('open'); return; }
      resultsBox.innerHTML = rows.map(r => `<div class="mpr-item" data-id="${r.id}"><span class="mpr-vi">${r.vi}</span><span class="mpr-en">${r.en}</span></div>`).join('');
      resultsBox.classList.add('open');
      resultsBox.querySelectorAll('.mpr-item').forEach(el => {
        el.addEventListener('click', () => { selectConcept(el.dataset.id); closeResults(); searchInput.value = el.querySelector('.mpr-vi').textContent; });
      });
    });
    searchInput?.addEventListener('blur', () => setTimeout(closeResults, 150));
    $('mapSystems')?.classList.add('active');   // panel mở sẵn từ đầu (systemsMode=true)
    renderSystemsPanel();
  }
  function renderSystemsPanel() {
    if (!systemsPanel) return;
    const list = systemsPanel.querySelector('#sysList');
    const badge = systemsPanel.querySelector('#sysCountBadge');
    const footCount = systemsPanel.querySelector('#sysFootCount');
    const footBtn = systemsPanel.querySelector('#sysFootBtn');
    const on = id => (layerState[id] || 0) > 0.004;

    if (sysTab === 'meridian') renderMeridianRows(list, badge, footCount, footBtn);
    else {
      const rows = [];
      // 4 dòng GHIM đầu, đúng thứ tự người dùng chốt: Cơ · Xương · Kinh Lạc · Da (khớp MAC_DINH_BAT).
      PIN_ORDER.forEach(id => {
        if (id === KINH_LAC_ID) rows.push(sysRowHtml(KINH_LAC_ID, 'Kinh Lạc', '#b8763e', Object.keys(placed).length, acuLayerOn, true));
        else { const L = LBY[id]; rows.push(sysRowHtml(L.id, L.label, hexOf(L.color), L.parts ? L.parts.length : '', on(L.id), true)); }
      });
      rows.push('<div class="sys-sep"></div>');
      LAYERS.forEach(L => {
        if (PIN_ORDER.includes(L.id)) return;   // đã ghim ở trên, khỏi lặp lại trong danh sách chính
        rows.push(sysRowHtml(L.id, L.label, hexOf(L.color), L.parts ? L.parts.length : '', on(L.id), false));
      });
      list.innerHTML = rows.join('');
      if (badge) badge.textContent = String(LAYERS.length + 1);
      // Chân panel đếm MẢNH giải phẫu (piece) đang hiện — như demo ("{n} pieces visible"), KHÔNG phải
      // đếm số HỆ đang bật (bản port trước làm vậy, con số quá nhỏ để có ý nghĩa với atlas 2.234 mảnh).
      const pieceCount = LAYERS.reduce((n, L) => n + (on(L.id) && L.parts ? L.parts.length : 0), 0);
      if (footCount) footCount.textContent = `${pieceCount.toLocaleString('vi-VN')} mảnh đang hiện`;
      if (footBtn) footBtn.textContent = 'Ẩn tất cả';
    }
    // 3 nút lọc hệ "đang bật" hay không tính LẠI mỗi lần render từ layerState hiện tại (như
    // aria-pressed của demo — xem app/page.tsx .layer-presets); riêng tab Kinh Lạc theo sysTab vì
    // nó đổi NỘI DUNG danh sách chứ không phải một tổ hợp layerState.
    const sys = sysTab === 'systems';
    const tabOn = {
      all: sys && LAYERS.every(L => on(L.id)),
      meridian: sysTab === 'meridian',
      skeleton: sys && acuLayerOn && LAYERS.every(L => on(L.id) === SKELETON_PRESET.includes(L.id)),
      organs: sys && !acuLayerOn && LAYERS.every(L => on(L.id) === ORGANS_PRESET.includes(L.id)),
    };
    systemsPanel.querySelectorAll('.sys-tab').forEach(b => b.classList.toggle('on', !!tabOn[b.dataset.tab]));
  }
  /* Tab con "Kinh Lạc": 14 đường kinh (12 chính theo vòng tuần hoàn + Nhâm/Đốc) — mỗi dòng đúng kiểu
   * 1 dòng hệ (chấm màu kinh · tên · số huyệt đã định vị/tổng · công tắc). Bấm TÊN = xem riêng kinh
   * đó (như bấm tên 1 hệ là "solo"), công tắc = ẩn/hiện riêng kinh đó. Dòng ghim đầu vẫn là công tắc
   * TỔNG "Kinh Lạc" (acuLayerOn) — tắt nó là ẩn hết huyệt + đường kinh, bất kể 14 dòng dưới. */
  function renderMeridianRows(list, badge, footCount, footBtn) {
    const ord = c => { const i = MER_ORDER.indexOf(c); return i < 0 ? 99 : i; };
    const mers = presentMer.slice().sort((a, b) => ord(a) - ord(b));
    const shown = mer => acuLayerOn && !hidden.has(mer) && (!focusMer || mer === focusMer);
    const rows = [
      sysRowHtml(KINH_LAC_ID, 'Kinh Lạc', '#b8763e', Object.keys(placed).length, acuLayerOn, true),
      '<div class="sys-sep"></div>',
    ];
    mers.forEach(mer => {
      const m = COORDS.meridians[mer] || { name: mer, color: '#b8763e' };
      const n = Object.keys(placed).filter(c => merOf(c) === mer).length;
      const count = merTotal[mer] ? `${n}/${merTotal[mer]}` : String(n);
      rows.push(sysRowHtml(MER_PREFIX + mer, `<b class="sys-mer-code">${esc(mer)}</b> ${esc(m.name)}`,
        m.color, count, shown(mer), false, focusMer === mer ? 'sys-row--solo' : ''));
    });
    list.innerHTML = rows.join('');
    if (badge) badge.textContent = String(mers.length);
    const hienN = mers.filter(shown).length;
    if (footCount) footCount.textContent = focusMer
      ? `Đang xem riêng ${esc(focusMer)} · bấm lại để hiện tất cả`
      : `${hienN}/${mers.length} đường kinh đang hiện`;
    if (footBtn) footBtn.textContent = hienN ? 'Ẩn tất cả' : 'Hiện tất cả';
  }
  // ĐẶT LẠI TẤT CẢ — port reset() của bản demo (page.tsx: về initial + DEFAULT_VISIBLE + reset++).
  // Nút ↻ cũ CHỈ kéo camera về (resetView), để nguyên bóc tách/hệ đã tắt/bộ phận đang tô sáng —
  // đúng chỗ người dùng kêu "trở về ban đầu" mà không về được.
  function resetAll() {
    if (isolateOn) { isolateOn = false; isolateKeys = null; isolateParts = null; isolateName = ''; }
    selectedParts = null; selectedPartName = '';
    explodeAmount = 0;
    const sl = $('mspExplode'); if (sl) sl.value = '0';
    const sv = $('mspExplodeV'); if (sv) sv.textContent = '0%';
    LAYERS.forEach(L => { layerState[L.id] = MAC_DINH_BAT.has(L.id) ? 1 : 0; });   // đúng MẶC ĐỊNH lúc mở trang
    acuLayerOn = true;
    sysTab = 'systems';
    focusMer = null; hidden.clear(); selectedCode = null;
    flowOn = true; $('mapFlow')?.classList.toggle('active', true);   // về đúng mặc định lúc mở trang
    viewMode = 'three-quarter'; setRotate(false);
    clearHighlight(); clearNeedle();
    applyLayers(); applyVisibility(); applyPartVisibility(); applyExplode();
    updateDrawerActions();
    drawerWelcome();
    resetView();
    renderSystemsPanel();
    wake();
  }

  // Nút toolbar #mapSystems giờ chỉ ẨN/HIỆN panel (mặc định đã MỞ SẴN từ đầu — xem systemsMode).
  function toggleSystemsPanel() {
    ensureSystemsPanel();
    systemsMode = !systemsMode;
    $('mapSystems')?.classList.toggle('active', systemsMode);
    systemsPanel.style.display = systemsMode ? 'block' : 'none';
    if (systemsMode && editMode) toggleEdit();   // xem ghi chú ở toggleEdit() — 2 panel chung vị trí
    if (systemsMode) renderSystemsPanel();
  }

  // ---- tương tác ----
  function pick(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(dotMeshes.filter(m => m.visible), false)[0];
  }
  function setDotScale(m, k) { m.scale.setScalar((m.userData.baseScale || 1) * k); if (m.userData.halo) m.userData.halo.scale.setScalar(m.userData.baseHalo * k); }
  function onMove(ev) {
    if (rotDot) { rotateNeedleTo(ev); return; }     // đang XOAY hướng kim
    if (dragDot) { _dragEV = ev; return; }          // đang kéo → xử lý 1 lần/khung (trong animate) cho nhẹ
    const hit = pick(ev);
    const obj = hit ? hit.object : null;
    if (obj !== hovered) {
      const keep = m => m && (!!focusMer || m.userData.code === selectedCode);   // quầng vẫn giữ nếu thuộc kinh/huyệt đang chọn
      if (hovered) { setDotScale(hovered, 1); if (!keep(hovered)) hovered.userData.halo.visible = false; }
      hovered = obj;
      if (hovered) { setDotScale(hovered, 1.7); hovered.userData.halo.visible = hovered.visible; }
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
    }
  }
  function onClick(ev) {
    if (editMode) return;                          // edit: dùng KÉO-THẢ (pointer), không mở drawer
    const hit = pick(ev);
    if (hit) { openDrawer(hit.object.userData.code, hit.object); return; }
    // không trúng huyệt nào -> thử nhận diện cấu trúc giải phẫu (Giai đoạn 3) tại điểm bấm, CHỈ
    // khi panel Hệ Cơ Quan đang mở (tránh việc bấm lung tung trên cơ thể lúc xem kinh mạch bình
    // thường vô tình mở drawer bộ phận, gây khó hiểu).
    if (!systemsMode) return;
    const bodyHit = pickBody(ev);
    const found = bodyHit && resolvePartFromHit(bodyHit);
    if (!found) { clearHighlight(); return; }
    ensureConceptParts();
    const parts = conceptParts && conceptParts[found.entry.conceptId];
    if (!parts || !parts.length) return;
    const geo = highlightParts(parts);
    if (geo) focusStructure(geo);
    showBodyPart(found.entry.conceptId, parts);
  }

  // ===================== CHẤM TAY (KÉO-THẢ) =====================
  let dragDot = null, dragMoved = false, _dragEV = null;
  const undoStack = [];                            // mỗi bước chấm → 1 mục để Hoàn tác (giữ các điểm đúng trước đó)
  // raycast vào DA (để lấy điểm thả huyệt)
  function pickSkin(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(skinTargets.length ? skinTargets : [modelRoot], true)[0];
  }
  function onEditDown(ev) {
    if (!editMode) return;
    // bấm trúng CÁN KIM (đang chọn 1 huyệt) → vào chế độ XOAY hướng kim (không dời huyệt)
    if (editSel && nearNeedleHandle(ev)) {
      rotDot = dotByCode[editSel]; rotMoved = false;
      controls.enabled = false;
      renderer.domElement.setPointerCapture && renderer.domElement.setPointerCapture(ev.pointerId);
      setEditStatus('Kéo để xoay hướng kim ' + editSel + '…');
      return;
    }
    const hit = pick(ev);
    if (!hit) return;
    dragDot = hit.object; dragMoved = false;
    selectEdit(dragDot.userData.code);             // chọn + hiện kim (để có thể XOAY); kéo chấm = dời vị trí
    controls.enabled = false;                      // khoá xoay khi đang kéo huyệt
    renderer.domElement.setPointerCapture && renderer.domElement.setPointerCapture(ev.pointerId);
  }
  function onEditDrag(ev) {                         // gọi từ onMove khi đang kéo
    const sk = pickSkin(ev); if (!sk) return;
    dragMoved = true;
    const lift = 0.01 * bodyHeight, n = sk.face ? sk.face.normal : new THREE.Vector3(0, 0, 1);
    const pos = sk.point.clone().add(n.clone().multiplyScalar(lift));
    dragDot.position.copy(pos);
    if (dragDot.userData.halo) dragDot.userData.halo.position.copy(pos);
    if (dragDot.userData.ring) dragDot.userData.ring.position.copy(pos);
    setEditStatus('Thả để đặt ' + dragDot.userData.code + ' tại đây…');
  }
  function onEditUp(ev) {
    if (rotDot) {                                  // vừa XOAY hướng kim xong
      const code = rotDot.userData.code;
      if (rotMoved) setEditStatus('✓ Đã chỉnh hướng kim ' + code + '. 💾 Lưu để giữ · ↺ Auto để bỏ.');
      controls.enabled = true; rotDot = null; updateEditPanel(); return;
    }
    if (!dragDot) return;
    const code = dragDot.userData.code;
    if (dragMoved) {
      let nm = worldToNorm(dragDot.position);
      if (isBilateral(merOf(code))) nm.x = Math.abs(nm.x); else nm.x = 0;   // CV/GV ép đường giữa
      undoStack.push({ code, prev: userPlaced[code] ? { ...userPlaced[code] } : null });  // ghi bước để Hoàn tác
      userPlaced[code] = nm;
      deriveMeridian(merOf(code));             // TẦNG 2: tự rải các huyệt giữa các chốt theo tỉ lệ thốn
      refreshMeridian(merOf(code));            // cập nhật cả kinh + đường kinh (live, không treo)
      if (dotByCode[code]) placeNeedle(dotByCode[code]);   // kim bám theo huyệt vừa dời (để còn xoay)
      const nc = Object.keys(userPlaced).filter(c => merOf(c) === merOf(code)).length;
      setEditStatus(`✓ Đặt ${code}. Kinh ${merOf(code)} có ${nc} chốt → các huyệt giữa TỰ rải. 💾 Lưu · ↶ Hoàn tác.`);
    }
    controls.enabled = true; dragDot = null; updateEditPanel();
  }
  // cập nhật vị trí + màu cho cả 2 chấm (gốc + gương) của 1 huyệt, không đụng đường kinh
  // đặt lại vị trí + màu cho 1 chấm theo coordOf (chốt xanh · suy-ra màu kinh · mặc định/anchor)
  function placeDotMesh(m) {
    const code = m.userData.code, p = coordOf(code);
    const r = (m.userData.side === 'R') ? placeMirror(p)
      : ((p.x !== undefined || p.y !== undefined || p.z !== undefined) ? limbPoint(p) : surfacePoint(p.h, p.az, p.dir));
    if (!r) return;
    m.position.copy(r.pos);
    if (m.userData.halo) m.userData.halo.position.copy(r.pos);
    if (m.userData.ring) m.userData.ring.position.copy(r.pos);
    m.userData.normal.copy(r.n || new THREE.Vector3(0, 0, 1));
    const mcol = new THREE.Color(COORDS.meridians[m.userData.mer].color);
    if (p.user) {                              // CHỐT chấm tay → xanh lá, to
      m.material.color.set(0x22c55e); m.material.emissive.set(0x22c55e); m.userData.baseColor.set(0x22c55e);
      m.userData.baseScale = 1.35; m.userData.baseHalo = _dotR * 5; setDotScale(m, 1);
      if (m.userData.halo) m.userData.halo.material.color.set(0x22c55e);
    } else {                                   // suy-ra / mặc định → màu kinh (anchor mặc định: quầng trắng)
      const anc = !p.derived && !!(placed[code] && placed[code].anchor);
      m.material.color.copy(mcol); m.material.emissive.copy(mcol); m.userData.baseColor.copy(mcol);
      m.userData.baseScale = anc ? 1.35 : 1; m.userData.baseHalo = _dotR * (anc ? 5 : 3.2); setDotScale(m, 1);
      if (m.userData.halo) m.userData.halo.material.color.set(anc ? 0xffffff : mcol.getHex());
    }
  }
  function updateDotsForCode(code) { dotMeshes.forEach(m => { if (m.userData.code === code) placeDotMesh(m); }); }
  // cập nhật CẢ kinh (sau khi rải Tầng 2) + vẽ lại đường kinh đó — nhẹ, không treo
  function refreshMeridian(mer) {
    dotMeshes.forEach(m => { if (m.userData.mer === mer) placeDotMesh(m); });
    buildLines(mer); applyVisibility();
  }
  function selectEdit(code) {
    editSel = code;
    const m = dotByCode[code]; if (m) { highlight(code); setDotScale(m, 2.1); placeNeedle(m); }   // hiện kim để XOAY
    updateEditPanel();
  }

  // ---- bảng điều khiển chấm tay (chèn vào stage) ----
  let editPanel = null, editStatusEl = null;
  function ensureEditPanel() {
    if (editPanel) return;
    editPanel = document.createElement('div'); editPanel.className = 'map-edit-panel glass';
    editPanel.innerHTML =
      '<div class="mep-title">✎ Chấm tay — kéo CHẤM để dời huyệt · kéo CÁN KIM để xoay hướng</div>' +
      '<div class="mep-status" id="mepStatus">Kéo-thả huyệt CHỐT (đầu/cuối + chỗ gập). 2 chốt trở lên → các huyệt giữa TỰ rải theo tỉ lệ thốn.</div>' +
      '<div class="mep-row">' +
        '<button class="mv-btn" id="mepDerive" title="Rải lại TẤT CẢ kinh theo các chốt đã chấm">⚙ Căn tổng thể</button>' +
        '<button class="mv-btn" id="mepSave">💾 Lưu</button>' +
      '</div>' +
      '<div class="mep-row">' +
        '<button class="mv-btn" id="mepUndo">↶ Hoàn tác</button>' +
        '<button class="mv-btn" id="mepDownload">⬇ Tải JSON</button>' +
      '</div>' +
      '<div class="mep-row">' +
        '<button class="mv-btn" id="mepNeedleAuto" title="Trả hướng kim của huyệt đang chọn về tự động (đọc từ sách)">↺ Auto hướng kim</button>' +
        '<button class="mv-btn" id="mepClear">✖ Xoá tất cả</button>' +
      '</div>' +
      '<div class="mep-count" id="mepCount"></div>';
    // Thẻ nổi góc trên-trái (đè lên #mapStage, ẩn/hiện bằng class .on — xem map.css), CÙNG vị trí
    // với panel Hệ Cơ Quan (2 panel không mở cùng lúc theo luồng dùng thường nên không chồng nhau).
    stage.appendChild(editPanel);
    editStatusEl = editPanel.querySelector('#mepStatus');
    editPanel.querySelector('#mepSave').onclick = saveUser;
    editPanel.querySelector('#mepDownload').onclick = downloadUser;
    editPanel.querySelector('#mepUndo').onclick = undoPlace;
    editPanel.querySelector('#mepDerive').onclick = () => {
      if (!Object.keys(userPlaced).length) { setEditStatus('Chưa có chốt nào — hãy chấm vài huyệt CHỐT trước rồi căn.'); return; }
      setEditStatus('⚙ Đang căn tổng thể theo sách + WHO… (vài giây)');
      recomputeGold((ok, n, mers, e) => {
        if (ok) setEditStatus(`⚙ Đã căn tổng thể ${n} huyệt theo chuẩn sách/WHO${mers && mers.length ? ' (kinh: ' + mers.join(', ') + ')' : ''}. Bấm 💾 Lưu để giữ.`);
        else { deriveAll(); if (inited && modelRoot && dotMeshes.length) rebuild(); setEditStatus('Không gọi được solver (' + ((e && e.message) || 'lỗi mạng') + ') — tạm rải tuyến tính. Kiểm tra đăng nhập/mạng rồi thử lại.'); }
        updateEditPanel();
      });
    };
    editPanel.querySelector('#mepClear').onclick = () => { if (confirm('Xoá TẤT CẢ chấm tay (vị trí + hướng kim)? Các điểm đúng cũng mất.')) { undoStack.length = 0; for (const k in userPlaced) delete userPlaced[k]; for (const k in userNeedle) delete userNeedle[k]; for (const k in derived) delete derived[k]; rebuild(); updateEditPanel(); } };
    editPanel.querySelector('#mepNeedleAuto').onclick = () => {
      if (!editSel) { setEditStatus('Chọn 1 huyệt trước (bấm vào chấm) rồi mới đặt lại hướng kim.'); return; }
      delete userNeedle[editSel];
      const m = dotByCode[editSel]; if (m) placeNeedle(m);    // vẽ lại kim theo hướng tự động (sách)
      setEditStatus('↺ Hướng kim ' + editSel + ' về tự động (theo sách). 💾 Lưu để cập nhật.');
    };
  }
  function setEditStatus(t) { if (editStatusEl && t != null) editStatusEl.textContent = t; }
  function updateEditPanel() {
    const n = Object.keys(userPlaced).length;
    const cnt = editPanel && editPanel.querySelector('#mepCount');
    if (cnt) cnt.textContent = `${n} huyệt đã chấm tay${editSel ? ' · đang chọn: ' + editSel + ' ' + nameOf(editSel) : ''}`;
  }
  function toggleEdit() {
    ensureEditPanel();
    editMode = !editMode;
    // nguồn toạ độ vừa đổi (engine ↔ chấm tay) → phải đặt lại chấm, nếu không màn hình lệch với dữ liệu
    if (inited && modelRoot && dotMeshes.length) { clearDots(); clearNeedle(); placeAllPoints(); applyVisibility(); }
    $('mapEdit') && $('mapEdit').classList.toggle('active', editMode);
    editPanel.classList.toggle('on', editMode);
    // Chấm Tay + Hệ Cơ Quan CHUNG 1 vị trí thẻ nổi (góc trên-trái) — tắt bớt panel kia khi mở panel
    // này để khỏi chồng lên nhau (không có thiết kế 2 panel cùng vị trí trong bản demo gốc để theo).
    if (editMode && systemsMode) toggleSystemsPanel();
    if (renderer) renderer.domElement.style.cursor = editMode ? 'crosshair' : 'grab';
    if (!editMode) { editSel = null; dragDot = null; rotDot = null; controls.enabled = true; clearNeedle(); }   // KHÔNG dựng lại đường (tránh treo); đường sẽ tươi sau recompute + tải lại
    setEditStatus(editMode ? 'Bấm 1 huyệt để chọn → kéo CHẤM dời vị trí, kéo CÁN KIM xoay hướng. Xong bấm 💾 Lưu.' : '');
    updateEditPanel();
  }
  // Hoàn tác BƯỚC vừa chấm (giữ nguyên các điểm đúng trước đó)
  function undoPlace() {
    const e = undoStack.pop();
    if (!e) { setEditStatus('Không còn bước nào để hoàn tác.'); return; }
    if (e.prev) userPlaced[e.code] = e.prev; else delete userPlaced[e.code];
    deriveMeridian(merOf(e.code)); refreshMeridian(merOf(e.code));   // rải lại Tầng 2 sau hoàn tác
    selectEdit(e.code); updateEditPanel();
    setEditStatus('↶ Đã hoàn tác ' + e.code + (e.prev ? ' (về vị trí trước).' : ' (bỏ chấm tay).'));
  }
  // áp toạ độ engine GOLD (solver trả về) → cập nhật tại chỗ + XOÁ nội suy thô (TẦNG 2) ở kinh đã căn
  function applyGold(points) {
    if (!points) return 0;
    const codes = Object.keys(points);
    if (!codes.length) return 0;
    Object.assign(placed, points);
    const goldMers = new Set(codes.map(merOf));
    for (const k in derived) if (goldMers.has(merOf(k))) delete derived[k];   // bỏ TẦNG 2 thô ở kinh đã có gold
    if (inited && modelRoot && dotMeshes.length) rebuild();
    return codes.length;
  }
  // địa chỉ API backend (Vue đặt qua window.ACU_API_BASE) + token đăng nhập (dùng chung localStorage với SPA)
  const apiBase = () => (window.ACU_API_BASE || '');
  function authToken() { try { return localStorage.getItem('access_token'); } catch (e) { return null; } }
  // gọi solver "Căn Tổng Thể" trên server với chốt hiện tại; onDone(ok, nGold, mers[], err)
  function recomputeGold(onDone) {
    const token = authToken();
    fetch(apiBase() + '/kinh-mach-3d/recompute', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
      body: JSON.stringify({ points: userPlaced })
    })
      .then(r => {
        if (r.status === 401) throw new Error('cần đăng nhập lại');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(j => { const n = applyGold(j && j.points); onDone && onDone(true, n, (j && j.mers) || []); })
      .catch(e => onDone && onDone(false, 0, [], e));
  }
  function saveUser() {
    setEditStatus('💾 Đang lưu & căn theo…');
    const token = authToken();
    fetch(apiBase() + '/kinh-mach-3d/anchors', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
      body: JSON.stringify({ points: userPlaced, needles: userNeedle })
    })
      .then(r => {
        if (r.status === 401) throw new Error('cần đăng nhập lại');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(j => {
        const n = (j && j.n != null) ? j.n : Object.keys(userPlaced).length;
        const g = applyGold(j && j.points);          // căn theo (gold) ngay sau khi lưu
        setEditStatus(`✓ Đã lưu ${n} huyệt — đồng bộ${g ? ' + căn theo ' + g + ' huyệt (chuẩn sách/WHO)' : ''}. Máy khác tải lại sẽ thấy.`);
      })
      .catch(e => setEditStatus('Không lưu được lên server (' + ((e && e.message) || 'lỗi mạng') + '). Có thể bấm ⬇ Tải JSON để giữ tạm.'));
  }
  function downloadUser() {
    const blob = new Blob([JSON.stringify({ points: userPlaced, needles: userNeedle }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'user-anchors.json'; a.click();
    setEditStatus('Đã tải user-anchors.json (bản sao lưu tạm). Bình thường chỉ cần bấm 💾 Lưu để đồng bộ lên server.');
  }
  // ── Cách A — tải nhanh + chống "nhấp nháy" lúc mới mở ──
  // Đặt huyệt + dựng đường kinh ĐÚNG 1 LẦN (gọi từ mọi nhánh kết thúc của loadUserAnchors / phao 15s).
  // Trước đây đặt 2 lần (mặc định lúc init + căn-theo-chốt) → tốn ~gấp đôi + gây nhảy. Cờ _placedOnce chống gọi lại.
  let _placedOnce = false;
  function ensurePlacedOnce() {
    if (_placedOnce) return;
    _placedOnce = true;
    placeAllPoints(); applyVisibility(); buildLinesDeferred();
    if (selectedCode && dotByCode[selectedCode] && dotByCode[selectedCode].visible) placeNeedle(dotByCode[selectedCode]);
  }
  // HIỆN lớp huyệt/đường kinh (sau khi ĐÃ đặt 1 lần ở vị trí cuối) + tắt MÀN CHỜ TO. Chỉ chạy 1 lần.
  let _acuRevealed = false;
  function revealAcuOverlay(reason) {
    if (_acuRevealed) return;
    _acuRevealed = true;
    dotsGroup.visible = true; linesGroup.visible = true;
    wake();                                           // render-on-demand: vẽ lại 1 nhịp để hiện ra
    console.log('[ACU-DEBUG] HIỆN xong lúc', Math.round(performance.now()), 'ms · do:', reason || '?'); // TẠM: đo tốc độ, sẽ gỡ
    window.ACU_MODEL_READY = true;                    // báo Vue tắt MÀN CHỜ TO khi huyệt đã sẵn sàng
    if (typeof window.ACU_ON_MODEL_READY === 'function') window.ACU_ON_MODEL_READY();
    // Mở từ Từ Điển với ?focus=<mã> nhưng lúc gọi CHẤM HUYỆT chưa dựng (placeAllPoints chạy sau) → focus bị
    // hoãn vào pendingFocus. Giờ chấm đã sẵn sàng → bay tới huyệt cho đúng (trước đây chỉ xử lý ở onload model,
    // sớm hơn lúc có chấm nên "không bay thẳng tới huyệt").
    if (pendingFocus) { const c = pendingFocus, o = pendingOpts; pendingFocus = pendingOpts = null; setTimeout(() => focusPoint(c, o), 60); }
    if (pendingExports.length) { const q = pendingExports; pendingExports = []; q.forEach(fn => fn()); }
  }
  function loadUserAnchors() {
    let settled = false;
    // Mọi đường thoát đều đi qua đây: đặt huyệt ĐÚNG 1 LẦN (ở vị trí cuối) rồi HIỆN. Chạy 1 lần nhờ cờ settled.
    const done = (reason) => { if (settled) return; settled = true; ensurePlacedOnce(); revealAcuOverlay(reason); };
    try {
      const ac = new AbortController();
      const tid = setTimeout(() => ac.abort(), 6000);   // /anchors quá 6s → coi như lỗi → đặt mặc định, không treo
      fetch(apiBase() + '/kinh-mach-3d/anchors', { signal: ac.signal }).then(r => r.json()).then(j => {
        const pts = (j && j.points) || j || {};
        let n = 0; for (const k in pts) { if (pts[k] && typeof pts[k].x === 'number') { userPlaced[k] = pts[k]; n++; } }
        const nd = (j && j.needles) || {};            // HƯỚNG KIM tự chỉnh đã lưu → áp khi chọn huyệt
        for (const k in nd) { const v = nd[k]; if (v && typeof v.x === 'number') userNeedle[k] = { x: v.x, y: v.y, z: v.z }; }
        console.log('[ACU-DEBUG] anchors xong lúc', Math.round(performance.now()), 'ms · số chốt n =', n); // TẠM
        if (!n) { done('khong-co-chot'); return; }    // không chốt → đặt MẶC ĐỊNH 1 lần (đúng, khỏi căn)
        // có chốt → CĂN theo chốt (solver gold) rồi mới đặt 1 lần ở GOLD; solver lỗi → nội suy thô.
        recomputeGold((ok) => { if (!ok) deriveAll(); done('da-can-theo-chot'); });
      }).catch(() => done('anchors-loi/timeout')).finally(() => clearTimeout(tid));
    } catch (e) { done('loi-dong-bo'); }
  }
  // ===================================================

  function highlight(code) {
    dotMeshes.forEach(m => { m.material.color.copy(m.userData.baseColor); m.material.emissive.copy(m.userData.baseColor); setDotScale(m, 1); });
    dotMeshes.forEach(m => { if (m.userData.code === code) { m.material.color.set(ACCENT); m.material.emissive.set(ACCENT); setDotScale(m, 1.8); } });
  }

  // ---- NGĂN PHẢI HỢP NHẤT: danh sách huyệt LUÔN hiện + chi tiết huyệt cập nhật bên dưới ----
  const trunc = (t, n) => { t = (t || '').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t; };
  let drawerMer = null;                                  // kinh đang hiển thị danh sách ở ngăn phải

  // HTML chi tiết 1 huyệt (đặt vào #drDetail, KHÔNG thay cả ngăn)
  function pointDetailHTML(code) {
    const r = recOf(code), m = COORDS.meridians[merOf(code)], p = placed[code];
    // Cùng chỗ với huyệt nào? Không có dòng này thì 94 huyệt chồng toạ độ coi như tàng hình —
    // bấm vào chấm ở nếp khuỷu chỉ ra 1 trong 6 huyệt, 5 huyệt kia không có đường nào tới.
    const _ov = overlapOf(code);
    const overlapNote = _ov ? `<div class="dr-note" style="border-color:#f59e0b;background:#fffbeb;color:#92400e">` +
      `⊙ <b>Cùng một chỗ với ${_ov.list.length} huyệt khác</b>` +
      (_ov.moc ? ` — cả cụm rơi đúng mốc <b>${esc(_ov.moc)}</b>` : '') + `: ` +
      _ov.list.map(c => `<button class="dr-pt-inline" data-code="${esc(c)}">${esc(c)} ${esc(nameOf(c))}</button>`).join(' ') +
      `<br><small>Sách tả các huyệt này bằng cùng một mốc mà không kèm số thốn, nên bộ giải toạ độ đặt trùng nhau. ` +
      `Vị trí thật cần thầy thuốc phân định.</small></div>` : '';
    const c = m ? m.color : '#888';
    const row = (label, body) => body ? `<div class="dr-row"><h4>${label}</h4><p>${esc(trunc(body, 280))}</p></div>` : '';
    const ns = needleSpec(code);
    const angL = { perp: 'thẳng ⟂ da', oblique: 'xiên ~45°', transverse: 'luồn ngang ~15°' };
    let needleNote = '';
    if (ns.angle || ns.aim || ns.depth != null) {
      const parts = [];
      if (ns.angle) parts.push(angL[ns.angle]); else if (ns.aim) parts.push('xiên ~45°');
      if (ns.aim) parts.push('hướng ' + (ns.aim.type === 'point' ? nameOf(ns.aim.code) : DIR_LABEL[ns.aim.dir]));
      if (ns.depth != null) parts.push('sâu ~' + (Math.round(ns.depth * 10) / 10).toString().replace('.', ',') + ' thốn');
      needleNote = `<div class="dr-note" style="border-color:#0ea5a4">🪡 <b>Hướng châm</b>: ${esc(parts.join(' · '))}</div>`;
    }
    return `
      <div class="dr-head">
        <span class="dr-code" style="--c:${c}">${esc(code)}</span>
        <h3>${esc(nameOf(code))}</h3>
        <div class="dr-mer" style="color:${c}">${m ? esc(m.name) : ''}</div>
        ${r ? `<a class="dr-more" href="#acu/${r.id}">📖 Xem Thêm</a>` : ''}
      </div>
      ${p && p.anchor ? `<div class="dr-note" style="border-color:#2563eb"><b>🔵 MỐC HUYỆT</b> — định vị ngay tại mốc giải phẫu.</div>`
        : p && p.conf ? `<div class="dr-note" style="border-color:${p.q === 'exact' ? '#16a34a' : '#d97706'}">⚙︎ độ tin: <b>${esc(p.conf)}</b> · nguồn: ${esc(p.src || '?')}</div>` : ''}
      ${overlapNote}
      ${needleNote}
      ${r ? row('Vị trí', sec(r, 'vi tri')) + row('Chủ trị', sec(r, 'chu tri')) + row('Châm cứu', sec(r, 'cham cuu'))
            /* GIẢI PHẪU — mục sách tả CHIỀU SÂU: kim xuyên qua lớp nào, thần kinh nào chi phối. Trước
             * đây ngăn chi tiết bỏ qua nó, nên người xem chỉ biết huyệt nằm ở đâu TRÊN da mà không
             * biết dưới da là gì — đúng câu người dùng hỏi khi nhìn Trung Phủ nổi trên lớp cơ. */
            + row('Giải phẫu', sec(r, 'giai phau'))
          : '<p class="empty-note">Chi tiết huyệt này đang được số hoá.</p>'}`;
  }

  // Dựng ngăn phải cho 1 kinh: tiêu đề + danh sách huyệt + ô chi tiết (activeCode được tô + mở chi tiết)
  function renderMeridianPanel(mer, activeCode) {
    const m = COORDS.meridians[mer]; if (!m) return;
    const codes = Object.keys(placed).filter(c => merOf(c) === mer).sort((a, b) => numOf(a) - numOf(b));
    const tot = merTotal[mer] ? '/' + merTotal[mer] : '';
    // mỗi dòng = nút bay-tới-huyệt + nút "Xem Thêm" (📖) sang chi tiết huyệt trong Từ Điển
    const list = codes.map(c => {
      const rid = recOf(c);
      const more = rid ? `<a class="dr-pt-more" href="#acu/${rid.id}" title="Xem ${esc(nameOf(c))} trong Từ Điển" aria-label="Xem trong Từ Điển">📖</a>` : '';
      return `<div class="dr-pt-row"><button class="dr-pt${c === activeCode ? ' active' : ''}" data-code="${esc(c)}" style="--c:${m.color}"><b>${esc(c)}</b> ${esc(nameOf(c))}</button>${more}</div>`;
    }).join('');
    setDrawer(`
      <div class="dr-head">
        <button type="button" class="dr-back" id="drBackLegend" title="Về danh sách Kinh Lạc">← Kinh Lạc</button>
        <span class="dr-code" style="--c:${m.color}">${mer}</span>
        <h3>${esc(m.name)}</h3>
        <div class="dr-mer" style="color:${m.color}">${codes.length}${tot} huyệt · bấm huyệt → bay tới + chi tiết</div>
      </div>
      <div class="dr-ptlist">${list}</div>
      <a class="dr-full" href="#meridian/${mer}">📖 Lý thuyết kinh đầy đủ →</a>
      <div class="dr-detail" id="drDetail">${activeCode ? pointDetailHTML(activeCode) : '<p class="hint" style="padding:6px 2px">Chọn 1 huyệt ở danh sách trên để xem chi tiết.</p>'}</div>`);
    drawerMer = mer;
  }

  // Hiển thị 1 huyệt: GIỮ danh sách, chỉ cập nhật ô chi tiết + tô huyệt đang chọn + cắm kim.
  function showPoint(code, dot) {
    selectedCode = code;
    const mer = merOf(code);
    if (drawerMer !== mer) renderMeridianPanel(mer, code);
    else {
      const det = drawer.querySelector('#drDetail'); if (det) det.innerHTML = pointDetailHTML(code);
      drawer.querySelectorAll('.dr-pt').forEach(b => b.classList.toggle('active', b.dataset.code === code));
      const act = drawer.querySelector('.dr-pt.active'); if (act) act.scrollIntoView({ block: 'nearest' });
    }
    placeNeedle(dot || dotByCode[code]);
    highlight(code);
  }
  function openDrawer(code, dot) { showPoint(code, dot); }      // tương thích chỗ gọi cũ
  function openMeridianDrawer(mer) { renderMeridianPanel(mer, null); }

  function drawerWelcome() {
    drawerMer = null;
    drawer.innerHTML = '';
    hideDrawerSheet();   // chưa chọn gì -> sheet ẩn hẳn (kiểu Sheet chỉ nổi lên khi có lựa chọn)
  }

  function updateCount() {
    const totAll = Object.values(merTotal).reduce((a, b) => a + b, 0) || 361;
    countEl.textContent = `${Object.keys(placed).length} huyệt đã định vị · ${totAll} huyệt (12 kinh + Nhâm·Đốc)`;
  }
  // Danh sách 14 đường kinh KHÔNG còn nằm trong sheet chi tiết bên phải (thẻ chú giải .leg-chip cũ đã
  // bỏ hẳn) — giờ là TAB CON "Kinh Lạc" của panel Hệ Cơ Quan bên trái. Bấm tên dòng "Kinh Lạc" hay
  // nút "← Kinh Lạc" trong sheet đều chuyển về tab đó.
  function openMeridianTab() {
    sysTab = 'meridian';
    ensureSystemsPanel();
    if (!systemsMode) toggleSystemsPanel();   // panel đang ẩn thì mở ra (toggle tự render lại)
    else renderSystemsPanel();
    drawerWelcome();                          // danh sách kinh đã ở panel trái → thu sheet phải lại
  }
  function doSearch() {
    const q = norm(search.value.trim());
    dotMeshes.forEach(m => { m.material.color.copy(m.userData.baseColor); m.material.emissive.copy(m.userData.baseColor); });
    if (!q) return;
    const matches = Object.keys(placed).filter(code => norm(code).includes(q) || norm(nameOf(code)).includes(q));
    matches.forEach(code => dotMeshes.forEach(m => { if (m.userData.code === code) { m.material.color.set(ACCENT); m.material.emissive.set(ACCENT); } }));
    if (matches.length === 1) focusPoint(matches[0]);     // tìm đúng 1 huyệt → bay tới luôn
  }

  function onResize() {
    if (!renderer) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    // Tỉ lệ khung đổi → lưới "kệ hàng" phải xếp lại (targetWidth co giãn theo aspect, xem packShelves).
    if (modelRoot && explodeAmount > EXPLODE_SPLIT) applyExplode();
  }

  // ---- CAMERA BAY tới 1 huyệt (cho "Vị trí giải phẫu" load đến đúng chỗ trên 3D) ----
  let camAnim = null, pendingFocus = null, pendingOpts = null, _lastInput = 0;   // _lastInput: mốc thời gian thao tác gần nhất (render theo nhu cầu)
  const UP = new THREE.Vector3(0, 1, 0);                      // trục dọc — tính góc camera 3/4 cho showcase
  function wake() { _lastInput = clock(); }                  // "đánh thức" render khi cảnh thay đổi
  function focusPoint(code, opts) {
    opts = opts || {};
    const m = dotByCode[code];
    if (!m) { pendingFocus = code; pendingOpts = opts; return false; }   // chưa init/chưa có chấm → đợi sau khi tải model
    const mer = merOf(code);
    hidden.delete(mer);
    // showcase (mở từ Từ Điển): CHỈ hiện riêng đường kinh này + bật dòng chảy. Mặc định: bỏ lọc để huyệt hiện.
    if (opts.solo) focusMer = mer;
    else if (focusMer && focusMer !== mer) focusMer = null;
    if (opts.flow && !flowOn) { flowOn = true; $('mapFlow')?.classList.add('active'); }
    applyVisibility();                                  // đảm bảo huyệt đích hiện
    const p = m.position.clone();
    const n = (m.userData.normal || new THREE.Vector3(0, 0, 1)).clone().normalize();
    // góc quan sát: showcase nghiêng 3/4 (lệch ngang + hơi cao) cho thấy độ cong cơ thể & đường kinh;
    // bình thường nhìn thẳng vuông góc da cho cận cảnh.
    let dir = n;
    if (opts.showcase) {
      let side = new THREE.Vector3().crossVectors(n, UP);
      if (side.lengthSq() < 1e-4) side = new THREE.Vector3(1, 0, 0);   // huyệt trên/dưới trục dọc → tránh suy biến
      side.normalize();
      dir = n.clone().multiplyScalar(0.82).addScaledVector(side, 0.42).addScaledVector(UP, 0.20).normalize();
    }
    const dist = (opts.dist || (opts.showcase ? 0.34 : 0.26)) * bodyHeight;   // showcase lùi ra chút để thấy bối cảnh
    camAnim = { fromPos: camera.position.clone(), toPos: p.clone().addScaledVector(dir, dist),
      fromTgt: controls.target.clone(), toTgt: p.clone(), t0: clock(), dur: 0.7 };
    selectedCode = code;
    openDrawer(code, m);                               // chi tiết + cắm kim
    wake();
    return true;
  }

  const _fp = new THREE.Vector3();
  function animate() {
    requestAnimationFrame(animate);
    if (document.body.dataset.view !== 'meridian' || document.body.dataset.msub !== 'map' || !renderer) return;
    if (dragDot && _dragEV) { onEditDrag(_dragEV); _dragEV = null; }   // kéo huyệt: raycast tối đa 1 lần/khung
    const t = clock();
    // RENDER THEO NHU CẦU: chỉ vẽ khi có hoạt cảnh hoặc vừa thao tác → IDLE thì nghỉ (mượt + đỡ nóng máy)
    const anim = !!camAnim || (needleA.active && !needleA.done) || !!_lineQueue || flowOn || !!dragDot || rotateOn;
    if (!anim && (t - _lastInput) > 0.4) return;
    if (flowOn) for (const mer in flowByMer) {
      const f = flowByMer[mer]; if (!f.sprite.visible) continue;
      const u = (t * f.speed + f.phase) % 1;
      f.curve.getPointAt(u, _fp); f.sprite.position.copy(_fp);
      f.sprite.material.opacity = 0.55 + 0.45 * Math.sin(u * Math.PI); // mờ dần ở 2 đầu
    }
    if (needleA.active && !needleA.done) {                // hoạt cảnh "châm" 1 cây kim trượt vào da
      const pr = Math.min((t - needleA.t0) / NEEDLE.dur, 1);
      updateNeedle(pr);
      if (pr >= 1) needleA.done = true;
    }
    if (camAnim) {                                        // CAMERA BAY tới huyệt được chọn
      const k = Math.min((t - camAnim.t0) / camAnim.dur, 1);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;   // easeInOut
      camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, e);
      controls.target.lerpVectors(camAnim.fromTgt, camAnim.toTgt, e);
      if (k >= 1) camAnim = null;
    }
    controls.update();
    renderer.render(scene, camera);
  }

  // ---- wiring ----
  // bấm 1 huyệt trong DANH SÁCH ở ngăn phải → camera bay tới đúng huyệt
  drawer.addEventListener('click', e => {
    const pt = e.target.closest('.dr-pt'); if (pt) { focusPoint(pt.dataset.code); return; }
    const back = e.target.closest('#drBackLegend'); if (back) { openMeridianTab(); return; }
    const inl = e.target.closest('.dr-pt-inline'); if (inl) { focusPoint(inl.dataset.code); }
  });
  search.addEventListener('input', doSearch);
  $('mapReset')?.addEventListener('click', resetView);
  document.querySelectorAll('.acu3d .view-btn').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  $('mapRotate')?.addEventListener('click', () => setRotate(!rotateOn));
  $('mapFlow')?.addEventListener('click', e => {
    flowOn = !flowOn; e.currentTarget.classList.toggle('active', flowOn);
    if (inited) applyVisibility();
  });
  $('mapFlow')?.classList.toggle('active', flowOn);   // nút sáng đúng trạng thái mặc định lúc mở trang
  $('mapMirror')?.addEventListener('click', e => {
    mirrorOn = !mirrorOn; e.currentTarget.classList.toggle('active', mirrorOn);
    if (inited && modelRoot) rebuild();
  });
  // Đặt Lại (trong thanh Bóc Tách) — về ĐÚNG trạng thái ban đầu, không chỉ camera như nút ↻ cũ.
  $('mapResetAll')?.addEventListener('click', () => resetAll());
  // Chỉ Xem Riêng / Xem Lại Toàn Thân
  $('drIsolate')?.addEventListener('click', () => {
    if (isolateOn) setIsolate(false);
    else if (selectedParts && selectedParts.length) setIsolate(true, selectedParts, selectedPartName);
  });
  $('drClear')?.addEventListener('click', () => clearSelection());
  // Esc = lối thoát bằng bàn phím: đang xem riêng thì ra, còn lại thì bỏ chọn.
  stage.addEventListener('keydown', onEsc);
  document.addEventListener('keydown', onEsc);
  function onEsc(e) {
    if (e.key !== 'Escape') return;
    if (document.body.dataset.view !== 'meridian' || document.body.dataset.msub !== 'map') return;
    if (isolateOn) { setIsolate(false); e.preventDefault(); }
    else if (selectedParts && selectedParts.length) { clearSelection(); e.preventDefault(); }
  }
  $('mapEdit')?.addEventListener('click', () => toggleEdit());
  $('mapSystems')?.addEventListener('click', () => toggleSystemsPanel());
  $('drCloseBtn')?.addEventListener('click', () => drawerWelcome());

  // ---- subnav tab "Kinh mạch": Tra cứu kinh ⇄ Đồ hình 3D (đồ hình tải lười, chỉ khi mở) ----
  const merSection = document.getElementById('view-meridian');
  function setMSub(sub) {
    if (!merSection) return;
    merSection.querySelectorAll('.subtab').forEach(b => b.classList.toggle('active', b.dataset.msub === sub));
    merSection.querySelectorAll('.subview').forEach(v => v.classList.toggle('active', v.id === 'meridian-' + sub));
    document.body.dataset.msub = sub;
    if (sub === 'map') { initScene(); requestAnimationFrame(onResize); wake(); }   // init 3D + canh lại + vẽ
  }
  merSection?.querySelector('.subnav')?.addEventListener('click', e => {
    const b = e.target.closest('.subtab'); if (!b) return;
    setMSub(b.dataset.msub);
    history.replaceState(null, '', '#' + (b.dataset.msub === 'map' ? 'map' : 'meridian'));
  });
  function syncSubFromHash() {
    const h = location.hash;
    if (/^#map(\/|$)/.test(h)) setMSub('map');
    else if (/^#meridian\/[A-Z]/.test(h)) setMSub('ref');                 // link "lý thuyết kinh" cụ thể
    else if (document.body.dataset.view === 'meridian') setMSub('map');   // Kinh mạch mặc định = Đồ hình 3D
  }
  window.addEventListener('hashchange', syncSubFromHash);
  syncSubFromHash();
  // Bấm tab "Kinh mạch" ở thanh chính → mặc định mở Đồ hình 3D (trừ khi deep-link tới lý thuyết)
  document.querySelector('.tab[data-view="meridian"]')?.addEventListener('click', () => {
    if (!/^#meridian\/[A-Z]/.test(location.hash)) setMSub('map');
  });

  // init khi khung hình có kích thước (tab map được hiện)
  const initRO = new ResizeObserver(() => { if (stage.clientWidth && stage.clientHeight) { initScene(); initRO.disconnect(); } });
  initRO.observe(stage);
  if (stage.clientWidth && stage.clientHeight) { initScene(); initRO.disconnect(); }

  // Che vùng nhạy cảm (bẹn/mông) khi CHỤP ẢNH IN — mô hình giải phẫu 3D không mặc gì, không phù hợp
  // đưa thẳng vào phiếu phát cho bệnh nhân. Dựng "quần lót" ÔM SÁT DA bằng cách bắn tia đo bán kính
  // thân quanh vùng chậu ở nhiều tầng/nhiều hướng (PORT NGUYÊN VẸN kỹ thuật addBriefs() của
  // BatCuongFigure3D.vue — cùng thuật toán, chỉ đổi `targets`→`skinTargets` cho khớp biến ở file này) —
  // cho hình vừa khít cơ thể như quần thật, thay vì 1 khối nổi cứng đè lên. Chỉ thêm vào cảnh LÚC CHỤP,
  // gỡ ngay sau đó → không đụng màn 3D người dùng đang xem/bấm huyệt trong vùng đó lúc bình thường.
  function buildBriefsMesh() {
    if (!skinTargets.length) return null;
    const RINGS = 7, SEG = 48;
    const yTop = bodyMinY + 0.57 * bodyHeight;
    const offset = 0.006 * bodyHeight;
    const o = new THREE.Vector3(), c = new THREE.Vector3(), dir = new THREE.Vector3();
    const verts = [];
    const def = 0.12 * bodyHeight;

    // DÒ ĐÁY VÙNG KÍN ở mặt trước: hạ dần tia bắn thẳng mặt trước tới khi hết trúng thân trước → gấu
    // giữa-trước cần hạ tới đó để che kín.
    let yFront = bodyMinY + 0.46 * bodyHeight;
    for (let f = 0.5; f >= 0.3; f -= 0.01) {
      const yy = bodyMinY + f * bodyHeight;
      o.set(0, yy, bodyHeight); c.set(0, yy, 0);
      raycaster.set(o, dir.copy(c).sub(o).normalize());
      const hits = raycaster.intersectObjects(skinTargets, true);
      if (hits.length && hits[0] && hits[0].point.z > 0.005 * bodyHeight) yFront = yy;
      else break;
    }
    yFront = Math.max(yFront, bodyMinY + 0.34 * bodyHeight);
    // DÒ ĐÁY MÔNG ở mặt sau (tương tự) → gấu giữa-sau hạ xuống che kín mông & rãnh mông.
    let yBack = bodyMinY + 0.46 * bodyHeight;
    for (let f = 0.5; f >= 0.3; f -= 0.01) {
      const yy = bodyMinY + f * bodyHeight;
      o.set(0, yy, -bodyHeight); c.set(0, yy, 0);
      raycaster.set(o, dir.copy(c).sub(o).normalize());
      const hits = raycaster.intersectObjects(skinTargets, true);
      if (hits.length && hits[0] && hits[0].point.z < -0.005 * bodyHeight) yBack = yy;
      else break;
    }
    yBack = Math.max(yBack, bodyMinY + 0.34 * bodyHeight);

    // GẤU CẮT KIỂU QUẦN LÓT: hai bên (hông) giữ cao — giữa-trước hạ tới yFront, giữa-sau hạ tới yBack.
    const ySide = Math.min(bodyMinY + 0.46 * bodyHeight, Math.max(yFront, yBack) + 0.04 * bodyHeight);
    const drop = 0.035 * bodyHeight;
    const hemFloor = bodyMinY + 0.32 * bodyHeight;
    const hemY = (deg) => {
      const cd = Math.cos((deg * Math.PI) / 180);
      const front = Math.max(0, cd) ** 1.1;
      const back = Math.max(0, -cd) ** 1.1;
      const base = ySide + (yFront - ySide) * front + (yBack - ySide) * back;
      return Math.max(base - drop, hemFloor);
    };

    // Độ nhô ra trước nhất của vùng kín → làm "sàn túi" đẩy mặt trước ra ôm trọn, không lộ.
    let gf = 0;
    for (let f = 0.4; f <= 0.54; f += 0.02) {
      const yy = bodyMinY + f * bodyHeight;
      o.set(0, yy, bodyHeight); c.set(0, yy, 0);
      raycaster.set(o, dir.copy(c).sub(o).normalize());
      const hits = raycaster.intersectObjects(skinTargets, true);
      if (hits.length && hits[0]) gf = Math.max(gf, Math.hypot(hits[0].point.x, hits[0].point.z));
    }
    const gTop = bodyMinY + 0.52 * bodyHeight;
    const isProtected = (deg) => deg < 35 || deg > 325 || (deg > 145 && deg < 215);

    for (let r = 0; r < RINGS; r++) {
      const t = r / (RINGS - 1);
      const raw = [];
      const yArr = [];
      for (let s = 0; s < SEG; s++) {
        const az = (s / SEG) * Math.PI * 2;
        const y = yTop + (hemY((s / SEG) * 360) - yTop) * t;
        yArr.push(y);
        o.set(Math.sin(az) * bodyHeight, y, Math.cos(az) * bodyHeight);
        c.set(0, y, 0);
        raycaster.set(o, dir.copy(c).sub(o).normalize());
        const hits = raycaster.intersectObjects(skinTargets, true);
        raw.push(hits.length && hits[0] ? Math.hypot(hits[0].point.x, hits[0].point.z) : null);
      }
      const known = raw.filter((val) => val != null).sort((a, b) => a - b);
      const med = known.length ? (known[Math.floor(known.length / 2)] ?? def) : def;
      for (let s = 0; s < SEG; s++) {
        const val = raw[s];
        if (val != null && !isProtected((s / SEG) * 360) && val > med * 1.45) raw[s] = null;
      }
      const fill = (i) => {
        const cur = raw[i];
        if (cur != null) return cur;
        let lv = null, rv = null, ld = 0, rd = 0;
        for (let k = 1; k <= SEG; k++) {
          const val = raw[(i - k + SEG) % SEG];
          if (val != null) { lv = val; ld = k; break; }
        }
        for (let k = 1; k <= SEG; k++) {
          const val = raw[(i + k) % SEG];
          if (val != null) { rv = val; rd = k; break; }
        }
        if (lv != null && rv != null) return (lv * rd + rv * ld) / (ld + rd);
        return lv ?? rv ?? def;
      };
      for (let s = 0; s < SEG; s++) {
        const deg = (s / SEG) * 360;
        const az = (s / SEG) * Math.PI * 2;
        const yv = yArr[s] ?? yTop;
        let R = Math.min(fill(s), med * 1.6);
        if (deg < 35 || deg > 325) {
          const floorFrac = yv >= gTop ? Math.max(0, (yTop - yv) / (yTop - gTop)) : 1;
          R = Math.max(R, gf * floorFrac);
        }
        R += offset;
        verts.push(Math.sin(az) * R, yv, Math.cos(az) * R);
      }
    }

    const indices = [];
    const at = (r, s) => r * SEG + (s % SEG);
    for (let r = 0; r < RINGS - 1; r++) {
      for (let s = 0; s < SEG; s++) {
        const a = at(r, s), b = at(r, s + 1), d = at(r + 1, s), e = at(r + 1, s + 1);
        indices.push(a, d, b, b, d, e);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x59636f, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 2;
    return mesh;
  }
  let _modestyMesh = null;
  function addModestyCover() {
    _modestyMesh = buildBriefsMesh();
    if (_modestyMesh) scene.add(_modestyMesh);
  }
  function removeModestyCover() {
    if (!_modestyMesh) return;
    scene.remove(_modestyMesh);
    _modestyMesh.geometry.dispose();
    _modestyMesh.material.dispose();
    _modestyMesh = null;
  }

  // ---- API: XUẤT ẢNH "PHIẾU CHÂM HUYỆT" (2 ảnh nền trước/sau + toạ độ % từng huyệt) ----
  // Chụp bằng camera trực giao TẠM (không đụng camera/khung đang xem) rồi .project() CHÍNH camera đó
  // → toạ độ % khớp tuyệt đối với ảnh vừa chụp. Vue tự vẽ chấm/nhãn/đường dẫn chỉ đè lên (SVG) khi in;
  // hàm này CHỈ trả ảnh nền + toạ độ, không vẽ overlay (giữ đúng phần việc render 3D ở đây, phần trình
  // bày phiếu in ở Vue).
  function runExportPrintDiagram(codes, opts) {
    opts = opts || {};
    const W = opts.width || 900, H = opts.height || 1400;
    const list = (codes || []).filter(c => dotByCode[c]);
    const missing = (codes || []).filter(c => !dotByCode[c]);
    if (!list.length) return { width: W, height: H, front: null, back: null, points: [], missing };

    // Snapshot trạng thái hiện tại → khôi phục nguyên vẹn sau khi chụp (không đổi giao diện đang xem).
    const prevDots = dotsGroup.visible, prevLines = linesGroup.visible, prevFlow = flowGroup.visible, prevNeedle = needleGroup.visible;
    const prevLayerState = Object.assign({}, layerState);
    const prevSize = new THREE.Vector2(); renderer.getSize(prevSize);
    const prevRatio = renderer.getPixelRatio();

    // Ảnh nền sạch: ẩn chấm/đường kinh/kim, hiện đủ Da·Cơ·Xương (Da phủ kín nên đủ), tắt hẳn các
    // hệ Giai đoạn 3 (mạch máu/thần kinh/nội tạng…) dù người dùng có đang bật xem trên màn hình —
    // phiếu in chỉ cần đúng đồ hình kinh lạc trên nền cơ thể, không cần các hệ đó.
    dotsGroup.visible = false; linesGroup.visible = false; flowGroup.visible = false; needleGroup.visible = false;
    for (const L of LAYERS) layerState[L.id] = (L.id === 'skin' || L.id === 'muscle' || L.id === 'bone') ? 1 : 0;
    applyLayers();

    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    addModestyCover();
    const padY = size.y * 0.06;
    const top = box.max.y + padY, bottom = box.min.y - padY;
    const camH = top - bottom;
    const camW = camH * (W / H);
    const dist = Math.max(size.x, size.z, camH) * 3;   // đặt camera đủ xa, tránh cắt hình

    const cam = new THREE.OrthographicCamera(-camW / 2, camW / 2, camH / 2, -camH / 2, 0.01, dist * 4);
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);

    function shoot(camPos) {
      cam.position.copy(camPos);
      cam.up.set(0, 1, 0);
      cam.lookAt(center);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld(true);
      renderer.render(scene, cam);
      const image = renderer.domElement.toDataURL('image/png');
      const proj = {};
      for (const code of list) {
        const p = dotByCode[code].position.clone().project(cam);
        proj[code] = { x: (p.x + 1) / 2, y: (1 - p.y) / 2 };
      }
      return { image, proj };
    }

    const frontShot = shoot(new THREE.Vector3(center.x, center.y, box.max.z + dist));
    const backShot = shoot(new THREE.Vector3(center.x, center.y, box.min.z - dist));

    // khôi phục nguyên trạng khung đang xem.
    removeModestyCover();
    renderer.setPixelRatio(prevRatio);
    renderer.setSize(prevSize.x || stage.clientWidth || W, prevSize.y || stage.clientHeight || H, false);
    dotsGroup.visible = prevDots; linesGroup.visible = prevLines; flowGroup.visible = prevFlow; needleGroup.visible = prevNeedle;
    Object.assign(layerState, prevLayerState);
    applyLayers();
    if (camera) { camera.updateProjectionMatrix(); renderer.render(scene, camera); }
    wake();

    // side: huyệt nằm mặt trước hay sau thân — theo hướng pháp tuyến bề mặt tại điểm đó (đã raycast-snap
    // vào da), KHÔNG suy từ toạ độ nguồn (một số kinh giữa/bên hông dễ sai) → luôn khớp mặt đang thấy huyệt.
    const points = list.map(code => {
      const m = dotByCode[code];
      const n = m.userData.normal || new THREE.Vector3(0, 0, 1);
      const mer = m.userData.mer;
      const merInfo = COORDS.meridians[mer];
      return {
        code, mer, name: nameOf(code),
        merName: merInfo ? merInfo.name : mer,
        color: merInfo ? merInfo.color : '#8a6d3b',
        side: n.z >= 0 ? 'front' : 'back',
        front: frontShot.proj[code],
        back: backShot.proj[code],
      };
    });

    return { width: W, height: H, front: frontShot.image, back: backShot.image, points, missing };
  }

  // Gọi trước khi chấm huyệt sẵn sàng (vd bấm "In phiếu" ngay lúc vừa vào trang) → xếp hàng, chạy lại
  // khi revealAcuOverlay() báo chấm đã đặt xong (giống cơ chế pendingFocus của focus()).
  let pendingExports = [];

  // ---- API TOÀN CỤC: cho module khác (Tra cứu, chi tiết huyệt) gọi "load tới huyệt trên 3D" ----
  // window.AcuMap.focus('LU9')  → mở đồ hình 3D + camera bay tới huyệt LU9 + cắm kim + chi tiết.
  // ---- KIỂM TRA HUYỆT THEO QUY TẮC MÔ (sách châm cứu) ----
  // Sách dạy: huyệt nằm ở RANH GIỚI giữa hai mô (cơ/cơ, cơ/xương, cơ/gân, gân/gân, gân/xương);
  // KHÔNG châm thẳng vào xương, vào bụng cơ, hay vào mạch máu.
  //
  // ĐO CÁI GÌ — điểm mấu chốt: chấm huyệt trong engine nằm TRÊN MẶT DA (surfacePoint() bắn tia lên
  // da rồi nhấc lên một chút), nên hỏi "chấm có nằm trong xương không" thì luôn luôn KHÔNG — sai câu
  // hỏi. Câu đúng là: CHÂM KIM VÀO THÌ ĐI QUA MÔ GÌ. Vì vậy ở đây bắn tia HƯỚNG VÀO TRONG theo pháp
  // tuyến mặt da tại chính huyệt đó, ghi lại thứ tự mô mà kim gặp và ở độ sâu nào.
  //
  // Quy đổi độ sâu: mô hình cao ~1.7 đơn vị ứng với ~170cm, nên 0.01 đơn vị ≈ 1cm. Độ sâu châm
  // thường dùng 0,5-1,5 thốn ≈ 1-4cm, lấy 4cm (0.04) làm tầm với của kim.
  const TISSUE_GROUP = { bone: 'xương', muscle: 'cơ', connective: 'gân/dây chằng', arterial: 'mạch máu', venous: 'mạch máu' };
  const NEEDLE_REACH = 0.04;                 // ~4cm — tầm với của kim
  // Lớp "bone" của atlas KHÔNG chỉ chứa xương: nó gộp cả DẢI CÂN và GÂN bám xương (dải chậu chày,
  // cơ chày trước đều nằm trong đó). Lấy tên lớp làm nhãn mô đã khiến tôi báo nhầm GB29/31/32 là
  // "châm vào xương", trong khi thực ra chúng nằm trên dải chậu chày — vốn sát da và ĐÚNG kinh điển.
  // Vì vậy phân loại theo TÊN KHỐI cụ thể, chỉ khi không tra được tên mới lùi về tên lớp.
  function tissueOfName(name, fallback) {
    if (!name) return fallback;
    if (/^(xương|sụn|đốt sống|cán ức|mỏm|thân xương)/i.test(name)) return 'xương';
    if (/^(dải|gân|mạc|dây chằng|cân)/i.test(name)) return 'gân/dải cân';
    if (/^cơ(\s|$)/i.test(name)) return 'cơ';   // \b không nhận ra chữ 'ơ' (ngoài ASCII) — lỗi cũ đã gặp một lần
    if (/^(động mạch|tĩnh mạch|mạch)/i.test(name)) return 'mạch máu';
    return fallback;
  }
  const _ray = new THREE.Raycaster();
  const _inw = new THREE.Vector3();
  function tissueReport() {
    if (!modelRoot || !ATLAS_IDX) return { error: 'model hoặc ATLAS_IDX chưa sẵn sàng' };
    // bắn tia vào mesh GỘP của từng hệ (không cần picker) — rẻ hơn và đủ để biết thứ tự mô
    const targets = {};
    for (const L of LAYERS) {
      const grp = TISSUE_GROUP[L.id]; if (!grp) continue;
      (targets[grp] = targets[grp] || []).push(...(layerMeshes[L.id] || []));
    }
    const out = [];
    for (const code in dotByCode) {
      const m = dotByCode[code];
      if (!m || m.userData.side === 'R') continue;                 // bên gương đối xứng, khỏi đo lại
      const n = m.userData.normal;
      if (!n || n.lengthSq() < 1e-6) { out.push({ code, mer: m.userData.mer, err: 'thiếu pháp tuyến' }); continue; }
      _inw.copy(n).normalize().multiplyScalar(-1);                 // hướng VÀO TRONG cơ thể
      _ray.set(m.position, _inw);
      _ray.far = NEEDLE_REACH * 3 + 0.05;                          // dôi ra để còn trừ phần chấm nổi trên da
      // ĐO TỪ MẶT DA, KHÔNG PHẢI TỪ CHẤM: engine nhấc chấm lên khỏi da _SKIN_LIFT×bodyHeight (~1,5cm) cho
      // dễ nhìn (xem _surfacePointRaw). Không trừ đi thì mọi độ sâu dôi thêm 1,7cm — đủ để biến một
      // huyệt sát xương thành "xương nằm sâu 2cm", tức che mất đúng thứ cần tìm. Trừ bằng cách lấy
      // chỗ tia cắt DA làm gốc 0 (tự đúng cho cả huyệt tay/chân vốn đặt bằng đường khác).
      let skin0 = 0;
      const skinHits = _ray.intersectObjects((layerMeshes.skin || []).filter(o => o.geometry), false);
      if (skinHits.length) skin0 = skinHits[0].distance;
      const depth = {}, hitPart = {};
      for (const grp in targets) {
        const hits = _ray.intersectObjects(targets[grp].filter(o => o.geometry), false);
        if (!hits.length) continue;
        depth[grp] = +(hits[0].distance - skin0).toFixed(4);
        // TÊN khối bị chạm: mesh mỗi hệ là khối GỘP, nên tra ngược qua faceIndex -> part (dùng
        // triStart/triCount trong ATLAS_IDX, đúng cách pickBody vẫn làm). Biết chạm XƯƠNG NÀO mới
        // nói được "sát xương" là bình thường (mấu chuyển sát da) hay bất thường (thân xương đùi).
        const h = hits[0], layerId = h.object.userData && h.object.userData.layer;
        const L2 = layerId && LBY[layerId];
        if (L2 && L2.parts && h.faceIndex != null) {
          for (let i = 0; i < L2.parts.length; i++) {
            const pt = L2.parts[i];
            if (h.faceIndex >= pt.triStart && h.faceIndex < pt.triStart + pt.triCount) {
              const vi = ATLAS_VI && ATLAS_VI.concepts[pt.conceptId];
              hitPart[grp] = vi ? vi[0] : pt.conceptId;
              break;
            }
          }
        }
      }
      // mô đầu tiên kim gặp — nhãn lấy theo TÊN KHỐI thật, không theo tên lớp (xem tissueOfName)
      let first = null, fd = Infinity;
      for (const g in depth) if (depth[g] < fd) { fd = depth[g]; first = g; }
      const firstName = first ? hitPart[first] : null;
      const firstTissue = first ? tissueOfName(firstName, first) : null;
      // ĐỘ TIN CẬY: tia phải cắt DA ngay gần chấm (≈ đúng phần chấm nổi trên da, ~1,7cm). Nếu phải
      // đi xa hơn nhiều mới gặp da thì pháp tuyến tại huyệt đó lệch, tia TRƯỢT DỌC thân chứ không
      // đâm vào — mọi độ sâu đo được khi đó vô nghĩa. Gặp ở huyệt vùng chi (cẳng chân, cổ tay) nơi
      // pháp tuyến "hướng ra khỏi trục thân" không còn đúng với bề mặt thật.
      const lift = _SKIN_LIFT * bodyHeight;
      const ok = skin0 > 0 && skin0 < lift * 2 + 0.005;
      // vị trí THẬT đang vẽ (sau khi engine "dán da") — khác toạ độ thô trong acu-coords3d.js, cần
      // để đối chiếu khi backend đổi toạ độ mà kết quả đo không đổi.
      out.push({ code, mer: m.userData.mer, first: firstTissue, firstLayer: first, firstName,
        firstDepth: first ? fd : null, depth,
        skinLift: +skin0.toFixed(4), reliable: ok, hitPart,
        pos: [+m.position.x.toFixed(4), +m.position.y.toFixed(4), +m.position.z.toFixed(4)] });
    }
    return {
      note: 'Bắn tia VÀO TRONG theo pháp tuyến tại từng huyệt; độ sâu tính TỪ MẶT DA. CHỈ dùng số ở huyệt có reliable=true — reliable=false nghĩa là pháp tuyến lệch, tia trượt dọc thân, số đo vô nghĩa. '
          + 'Đơn vị: 0.01 ≈ 1cm. Tầm kim lấy 0.04 (~4cm). Lưới giải phẫu có chỗ hở nên vẫn sai lẻ tẻ.',
      needleReach: NEEDLE_REACH, count: out.length, points: out,
    };
  }

  window.AcuMap = {
    /** Kiểm tra 361 huyệt theo quy tắc mô của sách châm cứu — xem tissueReport(). */
    tissueReport,
    focus(code) {
      if (!code) return;
      setMSub('map');                                   // chuyển sang đồ hình 3D (tự init nếu cần)
      history.replaceState(null, '', '#map/' + code);
      initScene();
      // bảo đảm "Hai Bên" đang bật (mặc định bật; nếu user tắt → bật lại + dựng đối xứng)
      if (!mirrorOn) { mirrorOn = true; $('mapMirror')?.classList.add('active'); if (inited && modelRoot) rebuild(); }
      // showcase: chỉ hiện riêng đường kinh chứa huyệt + bật dòng chảy + góc nhìn 3/4 đẹp.
      focusPoint(code, { solo: true, flow: true, showcase: true });
      requestAnimationFrame(onResize);
    },
    ready() { return !!modelRoot; },
    // huyệt đã đặt xong lên mô hình (bảo đảm dotByCode có dữ liệu) → điều kiện gọi exportPrintDiagram ngay.
    pointsReady() { return _acuRevealed; },
    // Promise<{width,height,front,back,points,missing}> — front/back là data URL PNG; points[i] có
    // {code, mer, merName, name, color, side, front:{x,y}, back:{x,y}} với x/y là tỉ lệ % (0..1) trên ẢNH TƯƠNG ỨNG.
    exportPrintDiagram(codes, opts) {
      return new Promise((resolve, reject) => {
        const run = () => {
          try { resolve(runExportPrintDiagram(codes, opts)); }
          catch (e) { reject(e); }
        };
        initScene();
        if (_acuRevealed && modelRoot) run();
        else pendingExports.push(run);
      });
    },
  };
  // hỗ trợ link dạng #map/LU9 (mở thẳng tới huyệt)
  function focusFromHash() { const m = /^#map\/([A-Z]{2}\d+)/.exec(location.hash); if (m) window.AcuMap.focus(m[1]); }
  window.addEventListener('hashchange', focusFromHash);
  focusFromHash();
})();
