/* tissue-rules — QUY TẮC KHE MÔ: "huyệt nằm ở ranh giới giữa hai cấu trúc, không nằm trong lòng chúng".
 *
 * VÌ SAO CÓ FILE NÀY
 * Engine cũ định vị huyệt bằng CỐT ĐỘ (đồng thân thốn): đếm thốn dọc trục xương từ một mốc.
 * Cốt độ rất tốt cho CAO ĐỘ (đi lên/xuống bao nhiêu thốn) nhưng gần như mù về MẶT CẮT NGANG:
 * ở đúng cao độ đó, quanh chu vi chi có vô số điểm cách mốc đúng chừng ấy thốn — sách chọn 1 điểm
 * cụ thể vì nó nằm trong một KHE giải phẫu sờ được. 185/354 huyệt trong vitri-data.json có mô tả
 * kiểu khe ("bờ ngoài cơ ngửa dài", "giữa 2 gân", "sát bờ xương chày") — thông tin này trước đây
 * bị parser bỏ hoàn toàn.
 *
 * NĂM LOẠI KHE (đúng thứ tự trong bài giảng):
 *   1. co-co      cơ  ↔ cơ      — rãnh giữa hai bụng cơ  (vd LU3 bờ ngoài cơ nhị đầu)
 *   2. co-xuong   cơ  ↔ xương   — rãnh sát bờ xương      (vd ST36 ngoài mào chày, cạnh cơ chày trước)
 *   3. co-gan     cơ  ↔ gân     — chỗ cơ chuyển thành gân(vd LU6, LI9)
 *   4. gan-gan    gân ↔ gân     — giữa hai gân           (vd LI5 hố lào, PC6, ST41)
 *   5. gan-xuong  gân ↔ xương   — giữa gân và xương      (vd BL60 giữa gân gót và mắt cá ngoài)
 *
 * BA ĐIỀU CẤM (mặt trái của cùng quy tắc — dùng để CHẤM ĐIỂM lại kết quả, không chỉ để cảnh báo):
 *   · không nằm trong lòng XƯƠNG,
 *   · không nằm giữa BỤNG CƠ (phần dày nhất của cơ),
 *   · không nằm trên lòng MẠCH MÁU lớn (được phép SÁT bờ mạch — nhiều huyệt kinh điển lấy mạch đập
 *     làm mốc, vd LU9 trên rãnh động mạch quay: quy tắc là "cạnh mạch", không phải "trong mạch").
 *
 * PHỐI HỢP VỚI CÁC TIẾN TRÌNH SONG SONG (điểm mấu chốt của cả thiết kế)
 * Bốn nguồn chạy song song trong solve-coords.cjs: [1] mốc/chấm tay · [2] WHO · [3] sách (cốt độ)
 * · [4] KHE MÔ (file này). Chúng KHÔNG bỏ phiếu ngang nhau, vì mỗi nguồn mạnh ở một chiều khác nhau:
 *
 *     CAO ĐỘ (dọc trục chi)     ← cốt độ / WHO / mốc quyết định
 *     MẶT CẮT (ngang + sâu)     ← KHE MÔ quyết định
 *
 * Nên khe mô KHÔNG được phép kéo huyệt lên/xuống dọc trục (sẽ phá đối chiếu thốn đã kiểm chứng);
 * nó chỉ trượt huyệt TRONG LÁT CẮT ngang tại đúng cao độ mà cốt độ đã chốt, tối đa MAX_SLIDE_CUN.
 * Lệch hơn ngưỡng đó = hai nguồn mâu thuẫn thật → không tự sửa, hạ độ tin và gắn cờ để người soát.
 *
 * Đây cũng chính là cách quy tắc giúp "đoán" được huyệt: cốt độ khoanh một VÒNG quanh chi, khe mô
 * chỉ ra ĐIỂM duy nhất trên vòng đó mà ngón tay sờ thấy lõm.                                        */

// ---------- phân loại mô ----------
const TISSUE = { MUSCLE: 'co', TENDON: 'gan', BONE: 'xuong', LIGAMENT: 'day-chang', VESSEL: 'mach', NERVE: 'than-kinh' };

/** Loại khe suy ra từ 2 loại mô (thứ tự không quan trọng). Trả null nếu cặp không phải khe hợp lệ. */
function gapKind(t1, t2) {
  const k = [t1, t2].sort().join('|');
  switch (k) {
    case 'co|co': return 'co-co';
    case 'co|xuong': return 'co-xuong';
    case 'co|gan': return 'co-gan';
    case 'gan|gan': return 'gan-gan';
    case 'gan|xuong': return 'gan-xuong';
    // dây chằng cư xử như gân trong định vị (mô sợi, sờ thành dải)
    case 'day-chang|gan': return 'gan-gan';
    case 'co|day-chang': return 'co-gan';
    case 'day-chang|xuong': return 'gan-xuong';
    case 'day-chang|day-chang': return 'gan-gan';
    // hai xương kề nhau (chày|mác, quay|trụ): khe GIAN CỐT — sách hay mô tả "khe giữa xương A và B"
    // để chỉ mặt cắt, huyệt nằm trên da phía trước khe đó.
    case 'xuong|xuong': return 'xuong-xuong';
    default: return null;                       // mạch/thần kinh → mốc phụ, không phải khe
  }
}

const GAP_LABEL = {
  'co-co': 'giữa cơ và cơ',
  'co-xuong': 'giữa cơ và xương',
  'co-gan': 'giữa cơ và gân',
  'gan-gan': 'giữa gân và gân',
  'gan-xuong': 'giữa gân và xương',
  'xuong-xuong': 'khe gian cốt (giữa hai xương)',
};

// ---------- hằng số hình học (đơn vị: THỐN chuẩn-hoá theo chiều cao mesh) ----------
// 1 thốn ngang thân ≈ 0.0312 (LAT_CUN.torso, model-frame) — ở chi nhỏ hơn (0.011–0.013).
// Các ngưỡng dưới đây quy ra thốn để không phụ thuộc vùng cơ thể; đổi sang chuẩn-hoá bằng cunLen.
const RULES = {
  /* Khe mô chỉ được trượt huyệt TRONG LÁT CẮT, tối đa ngần này thốn — quá ngưỡng = mâu thuẫn thật,
   * không tự sửa. Hai ngưỡng khác nhau vì hai loại ràng buộc khác nhau về độ đặc hiệu:
   *   between ("giữa gân A và gân B") chỉ đúng MỘT chỗ trên chu vi → tin được, cho trượt xa hơn;
   *   border  ("bờ ngoài cơ X")      còn mơ hồ (bờ dài, phía suy từ chữ) → siết chặt.
   * Cần nới tay ở đây vì mặt cắt của engine cốt độ vốn KHÔNG có thông tin: x,z chỉ thừa hưởng từ
   * mốc xương gần nhất, nên sai vài thốn ngang là chuyện thường. */
  MAX_SLIDE_CUN: 2.5,
  MAX_SLIDE_CUN_BORDER: 1.5,
  /* Trần TUYỆT ĐỐI (chuẩn-hoá theo chiều cao) — chặn trên mọi vùng, bất kể quy đổi thốn.
   * Đặt ra sau khi tầng khe phát hiện LAT_CUN.torso của model-frame.cjs từng bằng 0,0312 — tức
   * 5,4 cm cho "1 thốn", trong khi 1 thốn giải phẫu ≈ chiều cao/75 ≈ 2,3 cm. Gốc lỗi: NIPPLE.x ghi
   * 0,1249 (toạ độ THÔ chưa chia chiều cao; 0,0735 × 1,71947 ≈ 0,1264) nên đầu vú bị đặt cách đường
   * giữa 21,5 cm trong khi xương sườn 4–5 chỉ rộng 11,6–12,7 cm. Lỗi ĐÃ được sửa bên model-frame
   * (NIPPLE.x = 0,0735 · LAT_CUN.torso = 0,0184), nhưng trần tuyệt đối này GIỮ NGUYÊN làm lưới an
   * toàn: nó không phụ thuộc bất kỳ quy đổi thốn nào, nên lỗi đơn vị kiểu đó tái diễn cũng không
   * kéo huyệt đi 8–13 cm được nữa. LAT_CUN.head = 0,030 (5,2 cm/thốn) thì vẫn chưa ai soát. */
  MAX_SLIDE_ABS: 0.018,       // ≈ 3,1 cm trên mesh cao 171,9 cm
  /** thốn "đồng thân" bảo thủ: 1/75 chiều cao — dùng khi LAT_CUN vùng lớn bất thường */
  CUN_ANTHRO: 1 / 75,
  /** Bề dày lát cắt khi lấy điểm mô quanh cao độ huyệt (±). Đủ dày để mesh thưa vẫn có điểm. */
  SLICE_HALF_CUN: 0.75,
  /** Hai mô cách nhau xa hơn ngần này thì "khe" không có thật (mô tả sai hoặc nhận diện sai mô). */
  MAX_GAP_CUN: 1.6,
  /** Khe hẹp hơn ngần này = khe sờ được rõ, độ tin cao. */
  TIGHT_GAP_CUN: 0.6,
  /** Huyệt nằm sâu hơn ngần này dưới da thì phải chiếu ngược ra da (điểm châm luôn ở mặt da). */
  SKIN_SNAP_CUN: 0.25,
  /** Bán kính "vùng cấm" quanh trục mạch máu lớn — trong bán kính này coi như châm vào lòng mạch. */
  VESSEL_KEEPOUT_CUN: 0.15,
  /** Điểm nằm sâu trong khối cơ quá ngần này (tính từ mặt ngoài khối) = giữa bụng cơ → phạm điều cấm. */
  MUSCLE_BELLY_CUN: 0.5,
};

/** Độ tin của một khe tính được — dùng nâng/hạ nhãn conf trong solve-coords. */
function gapConfidence({ gapCun, slideCun, matchedBoth }) {
  const cap = matchedBoth ? RULES.MAX_SLIDE_CUN : RULES.MAX_SLIDE_CUN_BORDER;
  // thứ tự kiểm tra QUAN TRỌNG: mâu thuẫn với cốt độ phải chặn TRƯỚC, kể cả ràng buộc "sát bờ"
  // (không đo được bề rộng khe) — nếu không, một mô tả bờ mơ hồ có thể kéo huyệt đi rất xa.
  if (slideCun != null && slideCun > cap) return 'mau-thuan';
  if (gapCun == null) return 'sat-bo';                               // ràng buộc bờ: không có bề rộng khe
  if (gapCun > RULES.MAX_GAP_CUN) return 'khe-khong-thay';           // 2 mô rời nhau → mô tả/nhận diện sai
  if (matchedBoth && gapCun <= RULES.TIGHT_GAP_CUN) return 'khe-ro'; // 2 mô đều nhận diện được, khe hẹp
  return 'khe-mo';                                                    // có khe nhưng rộng / chỉ 1 mô
}

/** Ba điều cấm — chấm điểm một toạ độ đã giải. `probe` do interface-geom cấp. */
function safetyCheck(probe) {
  const warn = [];
  if (probe.insideBone) warn.push('nằm trong lòng xương — phải lùi ra mặt xương');
  if (probe.muscleDepthCun != null && probe.muscleDepthCun > RULES.MUSCLE_BELLY_CUN)
    warn.push(`nằm giữa bụng cơ (sâu ${probe.muscleDepthCun.toFixed(2)} thốn trong khối ${probe.muscleName || 'cơ'})`);
  if (probe.vesselDistCun != null && probe.vesselDistCun < RULES.VESSEL_KEEPOUT_CUN)
    warn.push(`nằm trên lòng mạch (${probe.vesselName || 'mạch lớn'}) — huyệt phải ở SÁT bờ mạch`);
  return warn;
}

module.exports = { TISSUE, RULES, gapKind, GAP_LABEL, gapConfidence, safetyCheck };
