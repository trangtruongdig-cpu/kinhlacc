/* Đồ hình kinh lạc 3D — chấm huyệt lên một mesh người, xoay/zoom tự do.
 * Phụ thuộc: THREE (vendor/three.min.js) + OrbitControls + GLTFLoader,
 *            window.ACU_COORDS3D, window.ACU_INDEX, window.ACUPOINTS.
 * Render "đẹp": nền gradient, da có khối + bóng mềm, đường kinh dạng ỐNG cong
 *               phát sáng + DÒNG kinh khí chảy, chấm huyệt có quầng, trượt mờ da.
 * Toạ độ vẫn tham số (h,az,dir) → thêm/đổi model hay thêm huyệt KHÔNG phải đặt lại. */
(function () {
  const COORDS = window.ACU_COORDS3D, INDEX = window.ACU_INDEX, ACU = window.ACUPOINTS;
  if (!COORDS || !INDEX || !ACU || typeof THREE === 'undefined') return;
  const $ = id => document.getElementById(id);
  const stage = $('mapStage'), drawer = $('drawerBody'), legend = $('mapLegend'),
        search = $('mapSearch'), countEl = $('mapCount');
  if (!stage) return;

  const MODEL_URL = (window.ACU_MAP_BASE || '') + 'models/body-layers.glb'
    + (window.ACU_ASSET_VER ? '?v=' + window.ACU_ASSET_VER : '');   // 3 lớp Da/Cơ/Xương (BodyParts3D). ACU_MAP_BASE do Vue đặt (vd '/kinhmach3d/'); ?v=<số build> để phá cache (khớp preload trong acuMap3d.ts).
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

  // ---- CHẤM TAY: điểm CHỐT do người dùng tự đặt (ưu tiên tuyệt đối, chuẩn-vàng) ----
  const userPlaced = {};                        // code -> { x, y, z }  (chuẩn-hoá theo bodyHeight)
  const userNeedle = {};                        // code -> { x, y, z }  HƯỚNG KIM tự chỉnh (vector trục, ra ngoài da)
  const derived = {};                           // code -> { x, y, z }  TẦNG 2 tự rải giữa các chốt
  const SPACING = window.ACU_SPACING || {};     // tỉ lệ thốn dọc mỗi kinh → rải theo tỉ lệ
  let editMode = false, editSel = null;
  // toạ độ vẽ: CHẤM TAY (chốt) → SUY RA (tầng 2) → toạ độ engine mặc định.
  function coordOf(code) {
    const u = userPlaced[code];
    if (u) return { x: u.x, y: u.y, z: u.z, snap: false, q: 'exact', anchor: true, user: true };
    const d = derived[code];
    if (d) return { x: d.x, y: d.y, z: d.z, snap: true, q: 'exact', derived: true };
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
  let selectedCode = null, flowOn = false, mirrorOn = true, focusMer = null;   // flow TẮT mặc định (nhẹ + đỡ rối); focusMer: kinh đang chọn
  // huyệt 12 kinh đối xứng 2 bên; chỉ CV/GV nằm trên đường giữa → KHÔNG soi gương.
  const isBilateral = mer => mer !== 'CV' && mer !== 'GV';

  // ---- Lớp giải phẫu (bóc tách Da · Cơ · Xương) ----
  // Mỗi mesh của model được gán 1 lớp theo TÊN node/collection (đi ngược cây cha).
  // Model 1-mesh hiện tại không khớp tên cơ/xương -> rơi về 'skin' => vẫn chạy y như cũ.
  // Khi xuất model Z-Anatomy: đặt tên collection top-level đúng "skin" / "muscle" / "bone".
  const LAYERS = [
    { id: 'skin',   label: 'Da',    color: 0xe1aa80, rough: 0.66, match: /(^|[_\-\s.])(skin|body|surface|integument|da)/i }, // tông da ấm, khoẻ, bớt sáng để lộ khối (cũ 0xe8d2c0 nhợt). Đổi hex/rough nếu muốn sáng-tối/mịn-nhám hơn.
    { id: 'muscle', label: 'Cơ',    color: 0x9c4a40, rough: 0.55, match: /(^|[_\-\s.])(muscle|musc|musculus|myo)/i },
    { id: 'bone',   label: 'Xương', color: 0xeae0c8, rough: 0.50, match: /(^|[_\-\s.])(bone|skelet|osseous|vertebr|cranium|skull|costa|pelvis|femur)/i },
  ];
  const LBY = Object.fromEntries(LAYERS.map(L => [L.id, L]));
  const layerMats = {}, layerMeshes = {};               // id -> [material,…] / [mesh,…]
  const layerState = { skin: 1, muscle: 1, bone: 1 };   // độ mờ mỗi lớp (0..1). MẶC ĐỊNH hiện ĐỦ Da·Cơ·Xương (full); trượt để bóc tách lớp.
  let skinTargets = [];                                 // mesh để bắn tia đặt huyệt (chỉ lớp da)

  // ---- THREE state ----
  let scene, camera, renderer, controls, raycaster, modelRoot, bodyMinY = 0, bodyHeight = BODY_H;
  const dotMeshes = [], dotByCode = {}, lineByMer = {}, flowByMer = {};
  const dotsGroup = new THREE.Group(), linesGroup = new THREE.Group(), flowGroup = new THREE.Group(), needleGroup = new THREE.Group();
  let inited = false, hovered = null, contactShadow = null;
  let _dotGeo = null, _dotR = 0;                        // hình cầu chấm huyệt dùng chung (1 lần)
  const mouse = new THREE.Vector2();
  const clock = (typeof performance !== 'undefined') ? () => performance.now() / 1000 : () => 0;

  // ---- texture tiện ích (vẽ bằng canvas, không cần asset) ----
  function gradientTex(top, bottom) {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d'), lin = g.createLinearGradient(0, 0, 0, 256);
    lin.addColorStop(0, top); lin.addColorStop(1, bottom);
    g.fillStyle = lin; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
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
    scene.background = gradientTex('#f6f9fc', '#d7dfe9');
    const w = stage.clientWidth || 800, h = stage.clientHeight || 600;
    camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 100);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));   // cap DPR → đỡ tốn pixel trên màn hi-DPI
    renderer.setSize(w, h);
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if ('outputEncoding' in renderer && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    stage.appendChild(renderer.domElement);

    // ánh sáng: bán cầu nền + đèn key/fill + viền sáng lạnh (rim) → cảm giác có khối
    // Giảm ambient (Hemisphere) + tăng key, giảm fill → bóng sâu hơn để LỘ RÕ đường nét/khối cơ thể (đỡ "phẳng").
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a95a5, 0.55));
    const key = new THREE.DirectionalLight(0xfff4e8, 1.15); key.position.set(1.2, 2.0, 2.2); scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfeaff, 0.22); fill.position.set(-1.5, 0.8, -1.0); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xbfd3ff, 0.8); rim.position.set(0, 1.4, -2.6); scene.add(rim);
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
  function resetView() {
    if (!fitSphere && modelRoot) fitSphere = new THREE.Box3().setFromObject(modelRoot).getBoundingSphere(new THREE.Sphere());
    const sph = fitSphere || new THREE.Sphere(new THREE.Vector3(0, bodyHeight * 0.5, 0), bodyHeight * 0.6);
    const fov = camera.fov * Math.PI / 180;
    const dist = (sph.radius / Math.sin(fov / 2)) * 1.15;
    controls.minDistance = sph.radius * 0.25;
    controls.maxDistance = sph.radius * 8;
    const back = /#map\/back/.test(location.hash);
    camera.position.set(sph.center.x, sph.center.y + sph.radius * 0.05, sph.center.z + (back ? -dist : dist));
    controls.target.copy(sph.center);
    controls.update();
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
    drawer.innerHTML = '<div class="dr-welcome"><p class="hint">Đang tải mô hình 3D…</p></div>';
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
          o.material = new THREE.MeshStandardMaterial({
            color: L.color, roughness: L.rough, metalness: 0.0, side: THREE.DoubleSide,
          });
          // Cơ/Xương đẩy LÙI nhẹ trong depth-buffer (polygonOffset) để chỗ trùng/sát mặt da thì DA luôn
          // thắng depth-test → đỡ "cơ thò ngoài da" lúc peel dở. (Chỗ da ĐỤC HẲN che kín xử lý bằng
          // ẩn lớp trong applyLayers — chắc ăn hơn vì polygonOffset không che được chỗ nhô nhiều.)
          if (id !== 'skin') {
            o.material.polygonOffset = true;
            o.material.polygonOffsetFactor = 1;
            o.material.polygonOffsetUnits = 1;
          }
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
      const s = BODY_H / size.y; modelRoot.scale.setScalar(s);
      modelRoot.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(modelRoot);
      const ctr = new THREE.Vector3(); box.getCenter(ctr);
      modelRoot.position.x -= ctr.x; modelRoot.position.z -= ctr.z; modelRoot.position.y -= box.min.y;
      modelRoot.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(modelRoot);
      bodyMinY = box.min.y; bodyHeight = box.max.y - box.min.y;
      scene.add(modelRoot);

      addContactShadow();
      // Cách A (tải nhanh + hết nhảy): KHÔNG đặt huyệt/đường kinh ngay ở đây nữa.
      // Ẩn lớp huyệt/đường kinh; loadUserAnchors() sẽ đặt CHÚNG ĐÚNG 1 LẦN ở vị trí cuối
      // (gold nếu có chốt · mặc định nếu không) rồi mới hiện → tránh đặt 2 lần (đỡ ~1/2 thời gian) + hết nhảy.
      dotsGroup.visible = false; linesGroup.visible = false;
      // Phao cứu sinh CUỐI (15s): nếu loadUserAnchors vì lỗi hiếm không tới được reveal, vẫn đặt 1 lần & hiện.
      setTimeout(() => { ensurePlacedOnce(); revealAcuOverlay('het-gio-luoi-cuoi'); }, 15000);
      loadUserAnchors();                 // tải chốt → căn → ĐẶT HUYỆT 1 LẦN → reveal (xem hàm bên dưới)
      applyVisibility();
      renderLayerControls();
      applyLayers();
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
        drawer.innerHTML = '<div class="dr-welcome"><p class="hint">Đang tải mô hình 3D… ' + pct + '%</p></div>';
        if (typeof window.ACU_ON_MODEL_PROGRESS === 'function') window.ACU_ON_MODEL_PROGRESS(pct);
      }
    }, err => {
      window.ACU_MODEL_READY = true;     // lỗi cũng phải tắt màn chờ, đừng để treo
      if (typeof window.ACU_ON_MODEL_READY === 'function') window.ACU_ON_MODEL_READY();
      drawer.innerHTML = '<p class="empty-note">Không tải được mô hình 3D (' + esc(String(err && err.message || err)) + ').</p>';
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
  function _ptVerKey() { return 'acu3d_pts:' + (window.ACU_ASSET_VER || '0'); }
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
    return { pos: p.add(out.clone().multiplyScalar(0.01 * bodyHeight)), n: out };
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
    if (!best) return { pos: _LP.clone(), n: new THREE.Vector3(0, 0, 1) };
    return { pos: best.add(bestN.clone().multiplyScalar(0.01 * bodyHeight)), n: bestN };
  }

  // soi gương 1 điểm sang bên đối diện: chi x→−x; thân lệch giữa az→360−az; điểm giữa (az 0/180) bỏ.
  function placeMirror(p) {
    if (p.x !== undefined || p.y !== undefined || p.z !== undefined)
      return limbPoint({ x: -(p.x || 0), y: p.y, z: p.z, snap: p.snap, snapDir: p.snapDir });
    if (p.az % 180 !== 0) return surfacePoint(p.h, (360 - p.az) % 360, p.dir);
    return null;
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
    m.userData = { code, mer: merOf(code), num: numOf(code), side, anchor: !!anchor, baseColor: col.clone(),
      halo, baseHalo: haloR, baseScale: dotScale, normal: (normal || new THREE.Vector3(0, 0, 1)).clone() };
    dotsGroup.add(m); dotsGroup.add(halo);
    dotMeshes.push(m);
    if (side === 'L') dotByCode[code] = m;                          // drawer/scroll dùng chấm gốc
  }

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

  // dựng đường kinh TRỄ: mỗi khung 1 kinh → không khựng lúc tải; model + chấm đã hiện trước.
  let _lineQueue = null;
  function buildLinesDeferred() {
    _lineQueue = presentMer.slice();
    const step = () => {
      if (!_lineQueue || !_lineQueue.length) { _lineQueue = null; return; }
      buildLines(_lineQueue.shift()); applyVisibility();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  // onlyMer: chỉ dựng lại đường của 1 kinh (vd khi chấm tay) → nhẹ, không treo. Bỏ trống = dựng tất cả.
  function buildLines(onlyMer) {
    const keep = k => onlyMer ? k.split('|')[0] === onlyMer : true;
    for (const k in lineByMer) if (keep(k)) { linesGroup.remove(lineByMer[k]); delete lineByMer[k]; }
    for (const k in flowByMer) if (keep(k)) { flowGroup.remove(flowByMer[k].sprite); delete flowByMer[k]; }
    // gom theo (kinh|bên) để mỗi bên có đường riêng khi soi gương.
    const groups = {};
    dotMeshes.forEach(m => { if (onlyMer && m.userData.mer !== onlyMer) return; const key = m.userData.mer + '|' + (m.userData.side || 'L'); (groups[key] = groups[key] || []).push(m); });
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
          new THREE.TubeGeometry(curve, tubeSegs, 0.0010 * bodyHeight, 5, false),   // ống MẢNH (5 cạnh) — nhẹ
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
    const shown = mer => !hidden.has(mer) && (!focusMer || mer === focusMer);   // CHỌN kinh nào → chỉ hiện kinh đó
    // quầng sáng CHỈ hiện khi đang chọn riêng 1 kinh (ít chấm) hoặc huyệt đang chọn → đỡ overdraw khi hiện tất cả
    dotMeshes.forEach(m => { const v = shown(m.userData.mer); m.visible = v; m.userData.halo.visible = v && (!!focusMer || m.userData.code === selectedCode); });
    for (const k in lineByMer) { const t = lineByMer[k]; t.visible = shown(t.userData.mer); }
    for (const k in flowByMer) { const f = flowByMer[k]; f.sprite.visible = flowOn && shown(f.mer); }
    legend.querySelectorAll('.leg-chip').forEach(c => c.classList.toggle('sel', c.dataset.mer === focusMer));
    wake();
  }

  function applyLayers() {
    wake();
    const opOf = id => (layerState[id] == null ? 1 : layerState[id]);
    const skinOp = opOf('skin'), muscleOp = opOf('muscle');
    for (const L of LAYERS) {
      const mats = layerMats[L.id]; if (!mats) continue;
      const op = opOf(L.id);
      mats.forEach(m => { m.transparent = op < 0.999; m.opacity = op; m.depthWrite = op > 0.5; m.needsUpdate = true; });
      // Ẩn lớp khi: (a) chính nó mờ hẳn, HOẶC (b) bị lớp ngoài ĐỤC HẲN (op≥0.999) che kín. Da đục che Cơ &
      // Xương; Cơ đục che thêm Xương. → diệt tận gốc "cơ/xương thò ngoài da" (model trùng/nhô mặt) mà vẫn
      // bóc tách lớp như cũ: kéo Da xuống <100% là Cơ hiện lại ngay; kéo cả Da & Cơ xuống thì Xương hiện.
      const coveredBySkin = L.id !== 'skin' && skinOp >= 0.999;
      const coveredByMuscle = L.id === 'bone' && muscleOp >= 0.999;
      const visible = op > 0.004 && !coveredBySkin && !coveredByMuscle;
      (layerMeshes[L.id] || []).forEach(o => { o.visible = visible; });
    }
    if (contactShadow) contactShadow.material.opacity = skinOp; // bóng mờ theo da
  }
  // dựng thanh trượt cho ĐÚNG những lớp model thực có (model 1-mesh => chỉ "Da")
  function renderLayerControls() {
    const box = $('mapLayers'); if (!box) return;
    box.innerHTML = LAYERS.filter(L => (layerMats[L.id] || []).length).map(L => {
      const hex = '#' + L.color.toString(16).padStart(6, '0');
      const v = Math.round((layerState[L.id] == null ? 1 : layerState[L.id]) * 100);
      return `<label class="map-layer" style="--c:${hex}"><span class="ml-dot"></span>${L.label}` +
             `<input type="range" min="0" max="100" value="${v}" data-layer="${L.id}"></label>`;
    }).join('');
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
    const hit = pick(ev); if (hit) openDrawer(hit.object.userData.code, hit.object);
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
    editPanel = document.createElement('div'); editPanel.className = 'map-edit-panel'; editPanel.style.display = 'none';
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
    // Dock panel Chấm Tay vào ĐẦU sidebar phải (không nổi đè lên mô hình 3D nữa).
    ($('mapDrawer') || stage).prepend(editPanel);
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
    $('mapEdit') && $('mapEdit').classList.toggle('active', editMode);
    editPanel.style.display = editMode ? 'block' : 'none';
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
      ${needleNote}
      ${r ? row('Vị trí', sec(r, 'vi tri')) + row('Chủ trị', sec(r, 'chu tri')) + row('Châm cứu', sec(r, 'cham cuu'))
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
    drawer.innerHTML = `
      <div class="dr-head">
        <span class="dr-code" style="--c:${m.color}">${mer}</span>
        <h3>${esc(m.name)}</h3>
        <div class="dr-mer" style="color:${m.color}">${codes.length}${tot} huyệt · bấm huyệt → bay tới + chi tiết</div>
      </div>
      <div class="dr-ptlist">${list}</div>
      <a class="dr-full" href="#meridian/${mer}">📖 Lý thuyết kinh đầy đủ →</a>
      <div class="dr-detail" id="drDetail">${activeCode ? pointDetailHTML(activeCode) : '<p class="hint" style="padding:6px 2px">Chọn 1 huyệt ở danh sách trên để xem chi tiết.</p>'}</div>`;
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
    drawer.innerHTML = ''; // bỏ khối hướng dẫn chào mừng theo yêu cầu — drawer để trống tới khi chọn 1 đường kinh.
  }

  function updateCount() {
    const totAll = Object.values(merTotal).reduce((a, b) => a + b, 0) || 361;
    countEl.textContent = `${Object.keys(placed).length} huyệt đã định vị · ${totAll} huyệt (12 kinh + Nhâm·Đốc)`;
  }
  // Thứ tự CHUẨN: 12 kinh chính theo vòng tuần hoàn (Phế đầu) → Mạch Nhâm → Mạch Đốc cuối.
  const MER_ORDER = ['LU', 'LI', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'TE', 'GB', 'LR', 'CV', 'GV'];
  function renderLegend() {
    const ord = c => { const i = MER_ORDER.indexOf(c); return i < 0 ? 99 : i; };
    legend.innerHTML = presentMer.slice()
      .sort((a, b) => ord(a) - ord(b))
      .map(mer => {
        const m = COORDS.meridians[mer], n = Object.keys(placed).filter(c => merOf(c) === mer).length;
        const tot = merTotal[mer] ? '/' + merTotal[mer] : '';
        return `<button class="leg-chip" data-mer="${mer}" style="--c:${m.color}"><span class="sw"></span>${m.name} <small>${n}${tot}</small></button>`;
      }).join('');
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
    const anim = !!camAnim || (needleA.active && !needleA.done) || !!_lineQueue || flowOn || !!dragDot;
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
  legend.addEventListener('click', e => {
    const chip = e.target.closest('.leg-chip'); if (!chip) return;
    const mer = chip.dataset.mer;
    focusMer = (focusMer === mer) ? null : mer;     // bấm = chỉ hiện riêng đường kinh đó; bấm lại = hiện tất cả
    clearNeedle();                                  // đổi/bỏ chọn đường kinh thì gỡ kim đang cắm
    applyVisibility();
    if (focusMer) openMeridianDrawer(focusMer); else drawerWelcome();
  });
  // bấm 1 huyệt trong DANH SÁCH ở ngăn phải → camera bay tới đúng huyệt
  drawer.addEventListener('click', e => {
    const pt = e.target.closest('.dr-pt'); if (pt) { focusPoint(pt.dataset.code); }
  });
  search.addEventListener('input', doSearch);
  $('mapReset')?.addEventListener('click', resetView);
  $('mapFlow')?.addEventListener('click', e => {
    flowOn = !flowOn; e.currentTarget.classList.toggle('active', flowOn);
    if (inited) applyVisibility();
  });
  $('mapMirror')?.addEventListener('click', e => {
    mirrorOn = !mirrorOn; e.currentTarget.classList.toggle('active', mirrorOn);
    if (inited && modelRoot) rebuild();
  });
  $('mapEdit')?.addEventListener('click', () => toggleEdit());
  $('mapLayers')?.addEventListener('input', e => {
    const r = e.target.closest && e.target.closest('input[type=range]'); if (!r) return;
    layerState[r.dataset.layer] = +r.value / 100;
    if (inited) applyLayers();
  });

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

  renderLegend();
  // init khi khung hình có kích thước (tab map được hiện)
  const initRO = new ResizeObserver(() => { if (stage.clientWidth && stage.clientHeight) { initScene(); initRO.disconnect(); } });
  initRO.observe(stage);
  if (stage.clientWidth && stage.clientHeight) { initScene(); initRO.disconnect(); }

  // ---- API TOÀN CỤC: cho module khác (Tra cứu, chi tiết huyệt) gọi "load tới huyệt trên 3D" ----
  // window.AcuMap.focus('LU9')  → mở đồ hình 3D + camera bay tới huyệt LU9 + cắm kim + chi tiết.
  window.AcuMap = {
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
  };
  // hỗ trợ link dạng #map/LU9 (mở thẳng tới huyệt)
  function focusFromHash() { const m = /^#map\/([A-Z]{2}\d+)/.exec(location.hash); if (m) window.AcuMap.focus(m[1]); }
  window.addEventListener('hashchange', focusFromHash);
  focusFromHash();
})();
