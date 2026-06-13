/* anchors — TẦNG 1: "MỐC HUYỆT" (cắm mốc trước).
 * Huyệt DỄ ĐỊNH VỊ tuyệt đối vì nằm ngay mốc giải phẫu rõ ràng (lằn cổ tay, rốn, đầu vú, mắt gối…).
 * Đặt CHẮC các mốc này (đa nguồn xác nhận) → mọi huyệt khác (Tầng 2) suy ra THEO mốc, không đi lần lượt.
 * Mỗi mốc:  at = mốc giải phẫu trong model-frame  (HOẶC pos trực tiếp) + lý do dễ định vị.
 * conf = 'mốc' (cao nhất). Bộ này là XƯƠNG SỐNG để bạn duyệt trước.                            */
const { L } = require('./model-frame.cjs');

// acupoint → MỐC giải phẫu mà nó định nghĩa (để CHẤM TAY ghi đè mốc → huyệt Tầng 2 rải lại theo).
const CODE_LM = {
  LU9: 'WRIST', LU5: 'CUBITAL', CV8: 'NAVEL', CV2: 'PUBIS', CV22: 'STERNUM_TOP',
  CV23: 'LARYNX', CV24: 'MENTON', ST35: 'KNEE_EYE_LAT', ST17: 'NIPPLE', ST12: 'CLAVICLE',
  ST31: 'HIP_ANT', CV17: 'STERNUM',
};

// CODE → { at: '<MỐC>' | pos:{x,y,z}, why }
const A = {
  // ===== Chi trên (LU) =====
  LU9:  { at: 'WRIST',        why: 'Thái Uyên — ngay lằn chỉ cổ tay, trên ĐM quay (sờ mạch đập)' },
  LU5:  { at: 'CUBITAL',      why: 'Xích Trạch — ngay nếp khuỷu, bờ ngoài gân cơ nhị đầu' },
  LU11: { pos: { x: 0.193, y: 0.466, z: 0.040 }, why: 'Thiếu Thương — góc móng ngón cái (tỉnh huyệt, đầu kinh)' },
  // Trung Phủ = Mộ huyệt Phế (quan trọng) · Vân Môn dưới đòn — hố dưới-đòn, KHÔNG phải mỏm vai
  LU2:  { pos: { x: 0.092, y: 0.806, z: 0.045 }, why: 'Vân Môn — hố dưới xương đòn (infraclavicular), 6 thốn ngang' },
  LU1:  { pos: { x: 0.100, y: 0.778, z: 0.048 }, why: 'Trung Phủ (Mộ huyệt Phế) — gian sườn 1, dưới Vân Môn 1,6 thốn' },

  // ===== Đầu–cổ–ngực–bụng (đường giữa & ngực, CV + ST) =====
  CV8:  { at: 'NAVEL',        why: 'Thần Khuyết — chính giữa lỗ rốn (mốc rõ nhất cơ thể)' },
  CV2:  { at: 'PUBIS',        why: 'Khúc Cốt — bờ trên xương mu (sờ thấy xương)' },
  CV22: { at: 'STERNUM_TOP',  why: 'Thiên Đột — hõm trên xương ức (hõm cổ)' },
  CV17: { pos: { x: 0.000, y: 0.735, z: 0.055 }, why: 'Đản Trung — giữa 2 đầu vú, đường giữa ức' },
  CV24: { at: 'MENTON',       why: 'Thừa Tương — lõm giữa dưới môi dưới' },
  CV23: { at: 'LARYNX',       why: 'Liêm Tuyền — bờ trên sụn giáp (yết hầu)' },
  ST17: { at: 'NIPPLE',       why: 'Nhũ Trung — chính giữa đầu vú' },
  ST12: { pos: { x: 0.078, y: 0.832, z: 0.030 }, why: 'Khuyết Bồn — hố trên đòn, giữa xương đòn' },
  ST8:  { pos: { x: 0.086, y: 0.957, z: 0.060 }, why: 'Đầu Duy — góc trán chân tóc (mốc đầu)' },

  // ===== Chi dưới (ST) =====
  ST35: { at: 'KNEE_EYE_LAT', why: 'Độc Tỵ — mắt gối ngoài (lõm dưới-ngoài bánh chè)' },
  ST31: { pos: { x: 0.156, y: 0.495, z: 0.029 }, why: 'Bễ Quan — nếp bẹn, phễu đùi (mốc đùi trên)' },
  ST41: { pos: { x: 0.046, y: 0.067, z: 0.008 }, why: 'Giải Khê — giữa nếp cổ chân trước, giữa 2 gân' },
  ST45: { pos: { x: 0.085, y: 0.009, z: 0.079 }, why: 'Lệ Đoài — góc ngoài móng ngón 2 (tỉnh huyệt, cuối kinh)' },
};

// ---- CHẤM TAY (backend): trộn chốt người dùng (TRUYỀN QUA THAM SỐ) vào BẢN SAO của A.
//      KHÔNG đọc file, KHÔNG sửa state dùng chung (A/L) — để gọi lại nhiều lần / song song vẫn đúng.
// buildAnchors(userAnchors) → { anchorMap, landmarkOverrides }:
//   anchorMap         = A (mốc tác giả) đã trộn chốt người dùng (mỗi chốt thành MỐC, ưu tiên tuyệt đối)
//   landmarkOverrides = { MỐC_GIẢI_PHẪU: {x,y,z} } để CALLER áp TẠM vào L rồi KHÔI PHỤC (giữ solver thuần).
function buildAnchors(userAnchors) {
  const anchorMap = {};
  for (const [code, def] of Object.entries(A)) anchorMap[code] = { ...def };   // bản sao nông, không đụng A gốc
  const landmarkOverrides = {};
  for (const [code, p] of Object.entries(userAnchors || {})) {
    if (!p || typeof p.x !== 'number') continue;
    const lm = (A[code] && A[code].at) || CODE_LM[code] || null;
    anchorMap[code] = { pos: { x: p.x, y: p.y, z: p.z }, why: 'CHẤM TAY (bạn tự đặt)', at: lm, user: true };
    if (lm && L[lm]) landmarkOverrides[lm] = { x: p.x, y: p.y, z: p.z };        // chốt trùng mốc → đề nghị ghi đè mốc
  }
  return { anchorMap, landmarkOverrides };
}

// dựng map vị trí mốc từ anchorMap: ưu tiên pos, sau đó tra L[at] (L đã được caller áp override nếu có).
function resolveAnchors(anchorMap) {
  const out = {};
  for (const [code, def] of Object.entries(anchorMap)) {
    const pos = def.pos || (def.at && L[def.at] ? { x: L[def.at].x, y: L[def.at].y, z: L[def.at].z } : null);
    if (pos) out[code] = { pos, why: def.why, at: def.at || null, user: !!def.user };
  }
  return out;
}

module.exports = { ANCHORS: A, CODE_LM, buildAnchors, resolveAnchors };
