/* model-frame — KHUNG GIẢI PHẪU của mô hình (đã calibrate từ acu-coords3d.js + chuẩn WHO 骨度).
 *
 * Ý tưởng cốt lõi (cốt-độ phân thốn):  vị trí huyệt = NỘI SUY dọc trục xương giữa 2 MỐC,
 * với chiều dài trục tính bằng THỐN chuẩn WHO. Vd cẳng tay: cổ tay↔khuỷu = 12 thốn.
 * "N thốn trên cổ tay"  →  t = N/12  →  lerp(WRIST, CUBITAL, t).  Tự bám hướng thật của chi.
 *
 * Toạ độ chuẩn-hoá khớp renderer map3d.js:  x=ngang(trái model +), y=cao 0..1, z=sâu(trước +).
 * Mốc cho 1 BÊN (x≥0) + đường giữa (x=0); renderer tự soi gương sang bên kia.            */

// --------- MỐC GIẢI PHẪU  (calibrate từ điểm đã đặt trùng mốc trên model) ---------
const L = {
  // —— đầu / mặt (đường giữa & cặp) ——
  VERTEX:       { x: 0,     y: 1.000, z: 0.000 },  // đỉnh đầu (GV20 vùng)
  HAIRLINE_ANT: { x: 0,     y: 0.950, z: 0.060 },  // chân tóc trước
  GLABELLA:     { x: 0,     y: 0.930, z: 0.090 },  // ấn đường
  PUPIL:        { x: 0.030, y: 0.928, z: 0.090, side: 1 },  // đồng tử (cặp)
  MOUTH_ANGLE:  { x: 0.022, y: 0.886, z: 0.078, side: 1 },  // khóe miệng (cặp)
  MENTON:       { x: 0,     y: 0.884, z: 0.072 },  // cằm (CV24)
  // —— cổ / ngực / bụng (đường giữa) ——
  LARYNX:       { x: 0,     y: 0.832, z: 0.082 },  // sụn giáp / yết hầu
  STERNUM_TOP:  { x: 0,     y: 0.815, z: 0.040 },  // hõm ức (CV22)
  XIPHOID:      { x: 0,     y: 0.665, z: 0.058 },  // mũi ức / góc ức-sườn (8 thốn trên rốn)
  NAVEL:        { x: 0,     y: 0.605, z: 0.075 },  // rốn (CV8)
  PUBIS:        { x: 0,     y: 0.500, z: 0.055 },  // bờ trên xương mu (5 thốn dưới rốn)
  NIPPLE:       { x: 0.086, y: 0.735, z: 0.069, side: 1 },  // đầu vú (4 thốn ngang giữa ngực)
  CLAVICLE:     { x: 0.090, y: 0.820, z: 0.045, side: 1 },  // xương đòn (mốc ngang; "dưới đòn" = xuống ngực)
  // —— chi trên (cặp) ——
  AXILLA_ANT:   { x: 0.120, y: 0.775, z: 0.030, side: 1 },  // nếp nách trước
  AXILLA_POST:  { x: 0.120, y: 0.775, z: -0.030, side: 1 },
  CUBITAL:      { x: 0.148, y: 0.646, z: 0.000, side: 1 },  // nếp khuỷu (LU5 Xích Trạch)
  WRIST:        { x: 0.179, y: 0.514, z: 0.031, side: 1 },  // lằn chỉ cổ tay (LU9 Thái Uyên)
  // —— chi dưới (cặp) ——
  HIP_ANT:      { x: 0.080, y: 0.500, z: 0.045, side: 1 },  // nếp bẹn / phễu đùi (ngang mu)
  KNEE_EYE_LAT: { x: 0.061, y: 0.256, z: 0.018, side: 1 },  // mắt gối ngoài (ST35 Độc Tỵ)
  PATELLA:      { x: 0.040, y: 0.275, z: 0.030, side: 1 },  // góc trên-ngoài xương bánh chè
  POPLITEAL:    { x: 0.050, y: 0.260, z: -0.054, side: 1 }, // nếp kheo (BL40)
  MALLEOLUS_LAT:{ x: 0.072, y: 0.050, z: 0.020, side: 1 },  // mắt cá ngoài (đỉnh)
  MALLEOLUS_MED:{ x: 0.030, y: 0.055, z: 0.000, side: 1 },  // mắt cá trong (đỉnh)
  // —— mốc “ảo” chỉ để neo trục ngang ——
  MIDLINE_CHEST:{ x: 0,     y: 0.735, z: 0.070 },  // đường giữa ngực (lateral từ đây)
  MIDLINE_ABD:  { x: 0,     y: 0.605, z: 0.075 },  // đường giữa bụng
  STERNUM:      { x: 0,     y: 0.760, z: 0.050 },  // thân xương ức (CV16–21, theo mức sườn)
};

// --------- TRỤC CỐT-ĐỘ  (đoạn xương: 2 mốc + chiều dài thốn chuẩn WHO) ---------
// near→far: "up"/"proximal" đi từ near (thấp) tới far (cao) HOẶC theo hướng giải phẫu.
// Mỗi trục cho biết: 1 thốn = |far-near| / cun  →  nội suy.
const AXES = {
  forearm:    { near: 'WRIST',        far: 'CUBITAL',      cun: 12 },  // cổ tay→khuỷu
  upperarm:   { near: 'CUBITAL',      far: 'AXILLA_ANT',   cun: 9  },  // khuỷu→nách
  leg_lower:  { near: 'MALLEOLUS_LAT',far: 'KNEE_EYE_LAT', cun: 16 },  // mắt cá ngoài→gối
  leg_lower_b:{ near: 'MALLEOLUS_LAT',far: 'POPLITEAL',    cun: 16 },  // (mặt sau)
  thigh:      { near: 'KNEE_EYE_LAT', far: 'HIP_ANT',      cun: 18 },  // gối→bẹn (đùi)
  abd_upper:  { near: 'NAVEL',        far: 'XIPHOID',      cun: 8  },  // rốn→mũi ức
  abd_lower:  { near: 'NAVEL',        far: 'PUBIS',        cun: 5  },  // rốn→xương mu
  chest_up:   { near: 'XIPHOID',      far: 'STERNUM_TOP',  cun: 9  },  // mũi ức→hõm ức (ngực)
};

// thốn NGANG (lateral) theo vùng — đơn vị chuẩn-hoá / thốn
const LAT_CUN = {
  torso: 0.0215,   // ngực-bụng: 4 thốn = nửa khoảng 2 đầu vú (≈0.086)
  arm:   0.011,    // cẳng/cánh tay (≈ thốn dọc cẳng tay)
  leg:   0.013,    // cẳng/đùi chân
  head:  0.030,    // đầu-mặt
};

// chọn TRỤC cho (mốc-anchor, hướng). dir: 'up'|'down' (proximal/distal).
// trả {axis, towardFar}  — towardFar=true nghĩa là đi từ near→far.
function pickAxis(anchorId, dir) {
  // bụng: rốn lên→abd_upper, xuống→abd_lower
  if (anchorId === 'NAVEL' || anchorId === 'MIDLINE_ABD') {
    if (dir === 'up') return { axis: 'abd_upper', from: 'NAVEL' };
    return { axis: 'abd_lower', from: 'NAVEL' };
  }
  if (anchorId === 'PUBIS') return { axis: 'abd_lower', from: 'PUBIS' };   // lên = về rốn
  if (anchorId === 'XIPHOID') return { axis: 'abd_upper', from: 'XIPHOID' };
  if (anchorId === 'WRIST')   return { axis: 'forearm', from: 'WRIST' };   // lên = về khuỷu
  if (anchorId === 'CUBITAL') return dir === 'up'
    ? { axis: 'upperarm', from: 'CUBITAL' } : { axis: 'forearm', from: 'CUBITAL' };
  if (anchorId === 'AXILLA_ANT' || anchorId === 'AXILLA_POST')
    return { axis: 'upperarm', from: 'AXILLA_ANT' };                       // xuống = về khuỷu
  if (anchorId === 'MALLEOLUS_LAT' || anchorId === 'MALLEOLUS_MED')
    return { axis: 'leg_lower', from: 'MALLEOLUS_LAT' };                   // lên = về gối
  if (anchorId === 'KNEE_EYE_LAT' || anchorId === 'POPLITEAL' || anchorId === 'PATELLA')
    return dir === 'up'
      ? { axis: 'thigh', from: anchorId } : { axis: 'leg_lower', from: anchorId === 'PATELLA' ? 'KNEE_EYE_LAT' : anchorId };
  if (anchorId === 'HIP_ANT') return { axis: 'thigh', from: 'HIP_ANT' };
  return null;
}

// vùng lateral của 1 mốc (để chọn LAT_CUN)
function lateralRegion(anchorId) {
  if (/WRIST|CUBITAL|AXILLA/.test(anchorId)) return 'arm';
  if (/KNEE|MALLEOLUS|POPLITEAL|HIP|PATELLA/.test(anchorId)) return 'leg';
  if (/PUPIL|MOUTH|HAIRLINE|GLABELLA|VERTEX|MENTON/.test(anchorId)) return 'head';
  return 'torso';
}

// mốc nằm trên ĐƯỜNG GIỮA (x=0) → ràng buộc lateral cho x TUYỆT ĐỐI, không cộng dồn
const MIDLINE = new Set(['MIDLINE_CHEST', 'MIDLINE_ABD', 'NAVEL', 'PUBIS', 'XIPHOID',
  'STERNUM', 'STERNUM_TOP', 'LARYNX', 'MENTON', 'GLABELLA', 'VERTEX', 'HAIRLINE_ANT']);
const isMidline = id => MIDLINE.has(id) || /^(CV|GV)\d+$/.test(id || '');

module.exports = { L, AXES, LAT_CUN, pickAxis, lateralRegion, isMidline };
