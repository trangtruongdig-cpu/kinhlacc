/* model-frame-v2-human-atlas — BẢN NHÁP: KHUNG GIẢI PHẪU calibrate lại trên mesh Human Atlas mới
 * (frontend/public/kinhmach3d/models/body-layers-v2.glb, 23.5MB, thay bản cũ ~6.5MB).
 *
 * NGUỒN: 16/24 mốc dò TRỰC TIẾP từ xương có nhãn trong Human Atlas (frontal/parietal/occipital,
 * mandible, thyroid cartilage, sternum, clavicle, hip bone, humerus, radius/ulna, femur, tibia/fibula,
 * patella) — bắn tia + tìm điểm cực trị trên chính hình học xương, KHÔNG phải đặt tay ước lượng.
 * Đã xác nhận bằng ảnh chụp (chấm đúng khớp xương) + đối chiếu % chiều cao với chuẩn nhân trắc học.
 *
 * SO VỚI BẢN CŨ (model-frame.cjs): hầu hết mốc lệch <2% chiều cao (~3cm) — KHÔNG có khác biệt tư thế
 * lớn như nghi ngờ ban đầu (đã tự sửa 1 lỗi quy đổi đơn vị trong lúc làm). Ngoại lệ đáng chú ý:
 *   - XIPHOID lệch +6.6% (~11cm): bản CŨ tính vòng qua "8 thốn trên rốn" (suy diễn), không đo trực
 *     tiếp từ xương — bản MỚI đo thẳng đầu dưới xương ức, đáng tin hơn.
 *   - HIP_ANT lệch +6.6% (~11cm): cần soát lại heuristic (nửa trên khung chậu, điểm Z lớn nhất).
 *   - CLAVICLE, MALLEOLUS_LAT/MED: trục z (sâu) đổi dấu — do heuristic lấy điểm khác trên xương
 *     (đầu mỏm cùng vai của xương đòn, S-cong, có thể lệch trước/sau tuỳ điểm) — CẦN SOÁT MẮT.
 *
 * CÒN THIẾU 7 mốc mô mềm (không có xương bên dưới để bắn tia): HAIRLINE_ANT, GLABELLA, PUPIL,
 * MOUTH_ANGLE, NIPPLE, MIDLINE_CHEST, AXILLA_POST — TẠM giữ giá trị mesh CŨ (đánh dấu OLD-STALE bên
 * dưới), cần chấm tay lại trên mesh mới qua nút "✎ Chấm Tay" đã có sẵn trong app.
 * NAVEL: mới tính qua mức đốt sống thắt lưng L3-L4 (mốc kinh điển) rồi chiếu ra da — không phải
 * mô mềm đặt tay, nhưng cũng nên soát mắt vì là suy luận gián tiếp.
 *
 * pickAxis/lateralRegion/isMidline/AXES/LAT_CUN giữ NGUYÊN logic bản gốc — chỉ đổi toạ độ mốc L.   */

const L = {
  // —— đầu / mặt (đường giữa & cặp) ——
  VERTEX:       { x: 0.0005, y: 0.9970, z: -0.0144 },  // đỉnh đầu — dò từ frontal+parietal+occipital
  HAIRLINE_ANT: { x: 0,      y: 0.950,  z: 0.060 },     // OLD-STALE — mô mềm, cần chấm tay lại
  GLABELLA:     { x: 0,      y: 0.930,  z: 0.090 },     // OLD-STALE — mô mềm, cần chấm tay lại
  PUPIL:        { x: 0.030,  y: 0.928,  z: 0.090, side: 1 },  // OLD-STALE — mô mềm, cần chấm tay lại
  MOUTH_ANGLE:  { x: 0.022,  y: 0.886,  z: 0.078, side: 1 },  // OLD-STALE — mô mềm, cần chấm tay lại
  MENTON:       { x: 0,      y: 0.8757, z: 0.0342 },   // cằm — dò từ mandible (15% thấp nhất, gần giữa)
  // —— cổ / ngực / bụng (đường giữa) ——
  LARYNX:       { x: 0,      y: 0.8648, z: 0.0008 },   // sụn giáp — dò từ thyroid cartilage
  STERNUM_TOP:  { x: 0,      y: 0.7955, z: 0.0452 },   // hõm ức — đầu trên xương ức
  XIPHOID:      { x: 0,      y: 0.7315, z: 0.0605 },   // mũi ức — đầu dưới xương ức (SOÁT: lệch +6.6% so bản cũ)
  NAVEL:        { x: 0,      y: 0.6136, z: 0.0593 },   // rốn — suy từ mức đốt sống L3-L4 + chiếu ra da (SOÁT MẮT)
  PUBIS:        { x: -0.0012,y: 0.5089, z: 0.0082 },   // bờ trên xương mu — dò từ hip bone (phần dưới, gần giữa nhất)
  NIPPLE:       { x: 0.1249, y: 0.735,  z: 0.069, side: 1 },  // x ĐÃ tính lại từ xương sườn 4-5 trái; y/z còn OLD-STALE (chưa đo độ cao/độ nhô thật, cần chấm tay)
  CLAVICLE:     { x: 0.0834, y: 0.8309, z: -0.0205, side: 1 }, // xương đòn (SOÁT: z đổi dấu so bản cũ)
  // —— chi trên (cặp) ——
  AXILLA_ANT:   { x: 0.0918, y: 0.8225, z: -0.0142, side: 1 }, // xấp xỉ đầu gần xương cánh tay — CHƯA phải nếp nách da thật, cần soát
  AXILLA_POST:  { x: 0.120,  y: 0.775,  z: -0.030, side: 1 },  // OLD-STALE — mô mềm, cần chấm tay lại
  CUBITAL:      { x: 0.1374, y: 0.6493, z: -0.0187, side: 1 }, // khuỷu — đầu xa xương cánh tay (gần khối cẳng tay)
  WRIST:        { x: 0.1617, y: 0.5143, z: 0.0102, side: 1 },  // cổ tay — đầu xa xương quay+trụ (gần khối bàn tay)
  // —— chi dưới (cặp) ——
  HIP_ANT:      { x: 0.0738, y: 0.5662, z: 0.0221, side: 1 },  // gai chậu trước trên — dò từ hip bone (SOÁT: lệch +6.6% so bản cũ)
  KNEE_EYE_LAT: { x: 0.0482, y: 0.2671, z: 0.0091, side: 1 }, // ĐÃ SỬA: "mắt gối" là hõm MÔ MỀM cạnh dây chằng bánh chè, không nằm hẳn trên xương — x,y lấy từ điểm ngoài nhất gần đầu xa xương đùi (quy đổi /1.7), z (độ sâu/trước) mượn từ PATELLA vì xương đùi đơn thuần không tới được độ nhô ra trước đủ (bug cũ: lấy điểm SAU lồi cầu, làm ST36 lệch 6.7cm)
  PATELLA:      { x: 0.0544, y: 0.2772, z: 0.0091, side: 1 }, // xương bánh chè — điểm trên-ngoài
  POPLITEAL:    { x: 0.0302, y: 0.2686, z: -0.0291, side: 1 }, // nếp kheo — xấp xỉ điểm sau nhất gần đầu gối
  MALLEOLUS_LAT:{ x: 0.0612, y: 0.0408, z: -0.0227, side: 1 }, // mắt cá ngoài — đầu xa xương mác (SOÁT: z đổi dấu so bản cũ)
  MALLEOLUS_MED:{ x: 0.0482, y: 0.0478, z: -0.0268, side: 1 }, // mắt cá trong — đầu xa xương chày (SOÁT: z đổi dấu so bản cũ)
  // —— mốc "ảo" chỉ để neo trục ngang ——
  MIDLINE_CHEST:{ x: 0,      y: 0.735,  z: 0.070 },    // OLD-STALE — mô mềm (≈mức đầu vú), cần chấm tay lại
  MIDLINE_ABD:  { x: 0,      y: 0.6136, z: 0.0593 },   // = NAVEL (giống bản gốc, chỉ đổi x=0 tuyệt đối)
  STERNUM:      { x: 0.0011, y: 0.7566, z: 0.0542 },   // thân xương ức — centroid
};

// --------- TRỤC CỐT-ĐỘ  (đoạn xương: 2 mốc + chiều dài thốn chuẩn WHO) — GIỮ NGUYÊN logic gốc ---------
const AXES = {
  forearm:    { near: 'WRIST',        far: 'CUBITAL',      cun: 12 },
  upperarm:   { near: 'CUBITAL',      far: 'AXILLA_ANT',   cun: 9  },
  leg_lower:  { near: 'MALLEOLUS_LAT',far: 'KNEE_EYE_LAT', cun: 16 },
  leg_lower_b:{ near: 'MALLEOLUS_LAT',far: 'POPLITEAL',    cun: 16 },
  thigh:      { near: 'KNEE_EYE_LAT', far: 'HIP_ANT',      cun: 18 },
  abd_upper:  { near: 'NAVEL',        far: 'XIPHOID',      cun: 8  },
  abd_lower:  { near: 'NAVEL',        far: 'PUBIS',        cun: 5  },
  chest_up:   { near: 'XIPHOID',      far: 'STERNUM_TOP',  cun: 9  },
};

const LAT_CUN = {
  // torso: ĐÃ TÍNH LẠI từ xương sườn 4+5 trái (mức nhũ hoa kinh điển) thay vì mốc NIPPLE mô mềm cũ
  // (0.0215 = 0.086/4 cũ, dựa mốc CHƯA calibrate lại) → NIPPLE_x mới = 0.1249 (xương sườn thật) → 0.1249/4.
  torso: 0.0312,
  arm:   0.011,
  leg:   0.013,
  head:  0.030,
};

function pickAxis(anchorId, dir) {
  if (anchorId === 'NAVEL' || anchorId === 'MIDLINE_ABD') {
    if (dir === 'up') return { axis: 'abd_upper', from: 'NAVEL' };
    return { axis: 'abd_lower', from: 'NAVEL' };
  }
  if (anchorId === 'PUBIS') return { axis: 'abd_lower', from: 'PUBIS' };
  if (anchorId === 'XIPHOID') return { axis: 'abd_upper', from: 'XIPHOID' };
  if (anchorId === 'WRIST')   return { axis: 'forearm', from: 'WRIST' };
  if (anchorId === 'CUBITAL') return dir === 'up'
    ? { axis: 'upperarm', from: 'CUBITAL' } : { axis: 'forearm', from: 'CUBITAL' };
  if (anchorId === 'AXILLA_ANT' || anchorId === 'AXILLA_POST')
    return { axis: 'upperarm', from: 'AXILLA_ANT' };
  if (anchorId === 'MALLEOLUS_LAT' || anchorId === 'MALLEOLUS_MED')
    return { axis: 'leg_lower', from: 'MALLEOLUS_LAT' };
  if (anchorId === 'KNEE_EYE_LAT' || anchorId === 'POPLITEAL' || anchorId === 'PATELLA')
    return dir === 'up'
      ? { axis: 'thigh', from: anchorId } : { axis: 'leg_lower', from: anchorId === 'PATELLA' ? 'KNEE_EYE_LAT' : anchorId };
  if (anchorId === 'HIP_ANT') return { axis: 'thigh', from: 'HIP_ANT' };
  return null;
}

function lateralRegion(anchorId) {
  if (/WRIST|CUBITAL|AXILLA/.test(anchorId)) return 'arm';
  if (/KNEE|MALLEOLUS|POPLITEAL|HIP|PATELLA/.test(anchorId)) return 'leg';
  if (/PUPIL|MOUTH|HAIRLINE|GLABELLA|VERTEX|MENTON/.test(anchorId)) return 'head';
  return 'torso';
}

const MIDLINE = new Set(['MIDLINE_CHEST', 'MIDLINE_ABD', 'NAVEL', 'PUBIS', 'XIPHOID',
  'STERNUM', 'STERNUM_TOP', 'LARYNX', 'MENTON', 'GLABELLA', 'VERTEX', 'HAIRLINE_ANT']);
const isMidline = id => MIDLINE.has(id) || /^(CV|GV)\d+$/.test(id || '');

module.exports = { L, AXES, LAT_CUN, pickAxis, lateralRegion, isMidline };
