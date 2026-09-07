/* tissue-lexicon — TỪ ĐIỂN MÔ: tên cơ/gân/xương như SÁCH GỌI  →  khối hình học trong Human Atlas.
 *
 * Sách vị trí huyệt dùng thuật ngữ giải phẫu Việt CŨ (dịch từ tiếng Pháp): "cơ ngửa dài", "cơ gan
 * tay lớn", "cơ quay 1", "cơ tam giác cánh tay"… Atlas dùng danh pháp hiện đại (brachioradialis,
 * flexor carpi radialis…). Không có bảng này thì mọi mô tả khe trong sách đều vô dụng.
 *
 * MỖI MỤC:
 *   id      mã nội bộ
 *   vi      tên chuẩn (dùng khi in báo cáo)
 *   tissue  loại mô — quyết định LOẠI KHE (xem tissue-rules.gapKind)
 *   say     các cách sách gọi (regex) — dùng để nhận trong câu VỊ TRÍ
 *   en      regex khớp tên khái niệm atlas; atlas hay tách 1 cơ thành nhiều đầu/phần
 *           (biceps brachii → long/short head, deltoid → 3 phần) nên MỌI phần khớp đều được gộp lại
 *   missing lý do atlas KHÔNG dựng mô này → quy tắc khe bỏ qua, không bịa
 *
 * GÂN: atlas chỉ dựng riêng gân gót. Với "gân cơ X" khác, quy ước (interface-geom thực hiện):
 *   gân = 20% ĐẦU XA của khối cơ X theo trục dọc chi — đúng chỗ cơ thon lại thành gân.            */

const T = { CO: 'co', GAN: 'gan', XUONG: 'xuong', DC: 'day-chang' };

const TISSUES = [
  // ——————————————————— CHI TRÊN: cơ ———————————————————
  { id: 'DELTOID', vi: 'cơ delta', tissue: T.CO, say: [/cơ delta/i, /cơ tam giác cánh tay/i], en: /deltoid/i },
  { id: 'PECT_MAJOR', vi: 'cơ ngực lớn', tissue: T.CO, say: [/cơ ngực (to|lớn)/i], en: /pectoralis major/i },
  { id: 'PECT_MINOR', vi: 'cơ ngực bé', tissue: T.CO, say: [/cơ ngực (bé|nhỏ)/i], en: /pectoralis minor/i },
  { id: 'BICEPS_BR', vi: 'cơ nhị đầu cánh tay', tissue: T.CO, say: [/cơ (2|hai|nhị) đầu cánh tay/i, /cơ nhị đầu(?! đùi)/i], en: /biceps brachii/i },
  { id: 'TRICEPS_BR', vi: 'cơ tam đầu cánh tay', tissue: T.CO, say: [/cơ (3|ba|tam) đầu cánh tay/i], en: /triceps brachii/i },
  { id: 'BRACHIALIS', vi: 'cơ cánh tay', tissue: T.CO, say: [/cơ cánh tay trước/i, /cơ cánh tay(?! quay)/i], en: /^(left |right )?brachialis$/i },
  { id: 'CORACOBR', vi: 'cơ quạ cánh tay', tissue: T.CO, say: [/cơ quạ cánh tay/i], en: /coracobrachialis/i },
  { id: 'BRACHIORAD', vi: 'cơ cánh tay quay', tissue: T.CO, say: [/cơ ngửa dài/i, /cơ cánh tay quay/i], en: /brachioradialis/i },
  { id: 'SUPINATOR', vi: 'cơ ngửa', tissue: T.CO, say: [/cơ ngửa ngắn/i, /cơ ngửa(?! dài)/i], en: /^(left |right )?supinator$/i },
  { id: 'PRONATOR_T', vi: 'cơ sấp tròn', tissue: T.CO, say: [/cơ sấp tròn/i], en: /pronator teres/i },
  { id: 'PRONATOR_Q', vi: 'cơ sấp vuông', tissue: T.CO, say: [/cơ sấp vuông/i], en: /pronator quadratus/i },
  { id: 'FCR', vi: 'cơ gấp cổ tay quay', tissue: T.CO, say: [/cơ gan tay (to|lớn)/i, /cơ gấp cổ tay quay/i], en: /flexor carpi radialis/i },
  { id: 'PALM_LONG', vi: 'cơ gan tay dài', tissue: T.CO, say: [/cơ gan tay (bé|nhỏ)/i, /cơ gan tay dài/i], en: /palmaris longus/i },
  { id: 'FCU', vi: 'cơ gấp cổ tay trụ', tissue: T.CO, say: [/cơ trụ trước/i, /cơ gấp cổ tay trụ/i], en: /flexor carpi ulnaris/i },
  { id: 'ECU', vi: 'cơ duỗi cổ tay trụ', tissue: T.CO, say: [/cơ trụ sau/i, /cơ duỗi cổ tay trụ/i], en: /extensor carpi ulnaris/i },
  { id: 'ECRL', vi: 'cơ duỗi cổ tay quay dài', tissue: T.CO, say: [/cơ quay (1|nhất|thứ nhất)/i, /cơ duỗi cổ tay quay dài/i], en: /extensor carpi radialis longus/i },
  { id: 'ECRB', vi: 'cơ duỗi cổ tay quay ngắn', tissue: T.CO, say: [/cơ quay (2|hai|thứ hai)/i, /cơ duỗi cổ tay quay ngắn/i], en: /extensor carpi radialis brevis/i },
  { id: 'FDS', vi: 'cơ gấp các ngón nông', tissue: T.CO, say: [/cơ gấp chung (các ngón )?nông/i, /cơ gấp các ngón nông/i], en: /flexor digitorum superficialis/i },
  { id: 'FDP', vi: 'cơ gấp các ngón sâu', tissue: T.CO, say: [/cơ gấp chung (các ngón )?sâu/i, /cơ gấp các ngón sâu/i], en: /flexor digitorum profundus/i },
  { id: 'ED_HAND', vi: 'cơ duỗi các ngón (tay)', tissue: T.CO, say: [/cơ duỗi chung các ngón(?! chân)/i, /cơ duỗi các ngón tay/i], en: /^(left |right )?extensor digitorum$/i },
  { id: 'EDM', vi: 'cơ duỗi ngón út', tissue: T.CO, say: [/cơ duỗi ngón út/i], en: /extensor digiti minimi/i },
  { id: 'EI', vi: 'cơ duỗi ngón trỏ', tissue: T.CO, say: [/cơ duỗi ngón trỏ/i], en: /extensor indicis/i },
  { id: 'APL', vi: 'cơ dạng ngón cái dài', tissue: T.CO, say: [/cơ dạng ngón cái dài/i, /cơ dạng (ngón )?cái/i], en: /abductor pollicis longus/i },
  { id: 'EPB', vi: 'cơ duỗi ngón cái ngắn', tissue: T.CO, say: [/cơ duỗi ngón cái ngắn/i], en: /extensor pollicis brevis/i },
  { id: 'EPL', vi: 'cơ duỗi ngón cái dài', tissue: T.CO, say: [/cơ duỗi ngón cái dài/i], en: /extensor pollicis longus/i },
  { id: 'ADD_POLL', vi: 'cơ khép ngón cái', tissue: T.CO, say: [/cơ khép ngón cái/i, /cơ bắp ngón trỏ ?[–-] ?ngón cái/i], en: /adductor pollicis/i },
  { id: 'DI_HAND', vi: 'cơ gian cốt mu tay', tissue: T.CO, say: [/cơ gian cốt (mu )?(bàn )?tay/i, /cơ liên cốt/i], en: /dorsal interossei of (left|right) hand/i },
  { id: 'ABD_DM_HAND', vi: 'cơ dạng ngón út (tay)', tissue: T.CO, say: [/cơ dạng ngón út( của bàn tay)?/i], en: /abductor digiti minimi of (left|right) hand/i },
  // ——————————————————— VAI – LƯNG – CỔ ———————————————————
  { id: 'TRAPEZIUS', vi: 'cơ thang', tissue: T.CO, say: [/cơ thang/i], en: /trapezius/i },
  { id: 'SUPRASPIN', vi: 'cơ trên gai', tissue: T.CO, say: [/cơ trên gai/i], en: /supraspinatus/i },
  { id: 'INFRASPIN', vi: 'cơ dưới gai', tissue: T.CO, say: [/cơ dưới gai/i], en: /infraspinatus/i },
  { id: 'RHOMBOID', vi: 'cơ trám', tissue: T.CO, say: [/cơ trám/i, /cơ hình thoi/i], en: /rhomboid/i },
  { id: 'LEV_SCAP', vi: 'cơ nâng vai', tissue: T.CO, say: [/cơ nâng vai/i], en: /levator scapulae/i },
  { id: 'SCM', vi: 'cơ ức đòn chũm', tissue: T.CO, say: [/cơ ức[- ]?đòn[- ]?chũm/i], en: /sternocleidomastoid/i },
  { id: 'SCALENE', vi: 'cơ bậc thang', tissue: T.CO, say: [/cơ bậc thang/i], en: /scalenus/i },
  { id: 'SPLENIUS', vi: 'cơ gối đầu', tissue: T.CO, say: [/cơ gối đầu/i, /cơ đầu gối/i], en: /splenius capitis/i },
  { id: 'ERECTOR', vi: 'khối cơ dựng sống', tissue: T.CO, say: [/cơ (dựng|dài) (sống|lưng)/i, /khối cơ chung/i, /cơ cạnh sống/i], en: /longissimus thoracis|iliocostalis (thoracis|lumborum)/i },
  { id: 'OBL_EXT', vi: 'cơ chéo bụng ngoài', tissue: T.CO, say: [/cơ chéo (bụng )?(to|lớn|ngoài)/i], en: /external oblique/i },
  { id: 'SERR_ANT', vi: 'cơ răng trước', tissue: T.CO, say: [/cơ răng (trước|to|cưa)/i], en: /serratus anterior/i },
  { id: 'INTERCOSTAL', vi: 'cơ gian sườn', tissue: T.CO, say: [/cơ (gian|liên) sườn/i], en: /intercostal muscle/i },
  { id: 'LINEA_ALBA', vi: 'đường trắng giữa bụng', tissue: T.DC, say: [/đường trắng/i], en: /linea alba/i },
  // ——————————————————— CHI DƯỚI: cơ ———————————————————
  { id: 'TIB_ANT', vi: 'cơ chày trước', tissue: T.CO, say: [/cơ (chày|chầy) trước/i, /cơ cẳng chân trước/i], en: /tibialis anterior/i },
  { id: 'TIB_POST', vi: 'cơ chày sau', tissue: T.CO, say: [/cơ (chày|chầy) sau/i], en: /tibialis posterior/i },
  { id: 'PERON_LONG', vi: 'cơ mác dài', tissue: T.CO, say: [/cơ mác (bên )?dài/i], en: /fibularis longus/i },
  { id: 'PERON_BREV', vi: 'cơ mác ngắn', tissue: T.CO, say: [/cơ mác (bên )?ngắn/i], en: /fibularis brevis/i },
  { id: 'EDL_FOOT', vi: 'cơ duỗi các ngón chân dài', tissue: T.CO, say: [/cơ duỗi (chung )?(dài )?(các )?ngón chân( dài)?/i, /cơ duỗi ngón thứ 2/i], en: /extensor digitorum longus/i },
  { id: 'EHL', vi: 'cơ duỗi ngón chân cái dài', tissue: T.CO, say: [/cơ duỗi (dài )?ngón (chân )?cái( dài)?/i], en: /extensor hallucis longus/i },
  { id: 'EHB', vi: 'cơ duỗi ngón chân cái ngắn', tissue: T.CO, say: [/cơ duỗi ngắn ngón (chân )?cái/i], en: /extensor hallucis brevis/i },
  { id: 'GASTROC', vi: 'cơ bụng chân', tissue: T.CO, say: [/cơ sinh đôi/i, /cơ bụng chân/i, /cơ dép sinh đôi/i], en: /gastrocnemius/i },
  { id: 'SOLEUS', vi: 'cơ dép', tissue: T.CO, say: [/cơ dép/i], en: /^(left |right )?soleus$/i },
  { id: 'POPLITEUS', vi: 'cơ khoeo', tissue: T.CO, say: [/cơ (khoeo|kheo|nhượng)/i], en: /popliteus/i },
  { id: 'RECT_FEM', vi: 'cơ thẳng đùi', tissue: T.CO, say: [/cơ thẳng (trước )?(đùi)?/i, /cơ tứ đầu đùi/i], en: /rectus femoris/i },
  { id: 'VAST_LAT', vi: 'cơ rộng ngoài', tissue: T.CO, say: [/cơ rộng ngoài/i], en: /vastus lateralis/i },
  { id: 'VAST_MED', vi: 'cơ rộng trong', tissue: T.CO, say: [/cơ rộng trong/i], en: /vastus medialis/i },
  { id: 'VAST_INT', vi: 'cơ rộng giữa', tissue: T.CO, say: [/cơ rộng giữa/i], en: /vastus intermedius/i },
  { id: 'SARTORIUS', vi: 'cơ may', tissue: T.CO, say: [/cơ may/i], en: /sartorius/i },
  { id: 'TFL', vi: 'cơ căng mạc đùi', tissue: T.CO, say: [/cơ căng (cân|mạc) đùi/i, /cơ căng/i], en: /tensor fasciae latae/i },
  { id: 'ITB', vi: 'dải chậu chày', tissue: T.DC, say: [/dải chậu chày/i, /cân đùi/i], en: /iliotibial tract/i },
  { id: 'BICEPS_FEM', vi: 'cơ nhị đầu đùi', tissue: T.CO, say: [/cơ (2|hai|nhị) đầu đùi/i, /cơ mác bên đùi/i], en: /biceps femoris/i },
  { id: 'SEMITEND', vi: 'cơ bán gân', tissue: T.CO, say: [/cơ bán gân/i], en: /semitendinosus/i },
  { id: 'SEMIMEMB', vi: 'cơ bán màng', tissue: T.CO, say: [/cơ bán (màng|mạc)/i], en: /semimembranosus/i },
  { id: 'GRACILIS', vi: 'cơ thon', tissue: T.CO, say: [/cơ thon/i], en: /gracilis/i },
  { id: 'ADDUCTOR', vi: 'khối cơ khép đùi', tissue: T.CO, say: [/cơ khép/i], en: /adductor (longus|magnus|brevis)/i },
  { id: 'PECTINEUS', vi: 'cơ lược', tissue: T.CO, say: [/cơ lược/i], en: /pectineus/i },
  { id: 'GLUT_MAX', vi: 'cơ mông lớn', tissue: T.CO, say: [/cơ mông (to|lớn)/i], en: /gluteus maximus/i },
  { id: 'GLUT_MED', vi: 'cơ mông nhỡ', tissue: T.CO, say: [/cơ mông (nhỡ|nhở|giữa|trung)/i], en: /gluteus medius/i },
  { id: 'GLUT_MIN', vi: 'cơ mông bé', tissue: T.CO, say: [/cơ mông (bé|nhỏ)/i], en: /gluteus minimus/i },
  { id: 'PIRIFORMIS', vi: 'cơ hình lê', tissue: T.CO, say: [/cơ hình lê/i, /cơ tháp/i], en: /piriformis/i },
  { id: 'PSOAS', vi: 'cơ thắt lưng lớn', tissue: T.CO, say: [/cơ (thắt lưng|đái) (to|lớn)/i], en: /psoas major/i },
  { id: 'ILIACUS', vi: 'cơ chậu', tissue: T.CO, say: [/cơ chậu(?! sườn)/i], en: /^(left |right )?iliacus$/i },
  // ——————————————————— GÂN dựng riêng trong atlas ———————————————————
  { id: 'ACHILLES', vi: 'gân gót', tissue: T.GAN, say: [/gân gót( chân)?/i, /gân a-?sin|gân achille/i], en: /calcaneal tendon/i },
  { id: 'PLANTAR_LIG', vi: 'dây chằng gan chân dài', tissue: T.DC, say: [/dây chằng gan chân/i], en: /long plantar ligament/i },
  { id: 'IO_MEMB_LEG', vi: 'màng gian cốt cẳng chân', tissue: T.DC, say: [/màng gian cốt (của )?cẳng chân/i], en: /interosseous membrane of (left|right) leg/i },
  { id: 'IO_MEMB_ARM', vi: 'màng gian cốt cẳng tay', tissue: T.DC, say: [/màng gian cốt (của )?cẳng tay/i], en: /interosseous membrane of (left|right) forearm/i },
  // ——————————————————— XƯƠNG ———————————————————
  { id: 'TIBIA', vi: 'xương chày', tissue: T.XUONG, say: [/xương (chày|chầy)/i, /xương ống chân/i, /mào chày/i], en: /^(left |right )?tibia$/i },
  { id: 'FIBULA', vi: 'xương mác', tissue: T.XUONG, say: [/xương mác/i], en: /^(left |right )?fibula$/i },
  { id: 'RADIUS', vi: 'xương quay', tissue: T.XUONG, say: [/xương (tay )?quay/i], en: /^(left |right )?radius$/i },
  { id: 'ULNA', vi: 'xương trụ', tissue: T.XUONG, say: [/xương trụ/i], en: /^(left |right )?ulna$/i },
  { id: 'HUMERUS', vi: 'xương cánh tay', tissue: T.XUONG, say: [/xương cánh tay/i], en: /^(left |right )?humerus$/i },
  { id: 'FEMUR', vi: 'xương đùi', tissue: T.XUONG, say: [/xương đùi/i], en: /^(left |right )?femur$/i },
  { id: 'PATELLA', vi: 'xương bánh chè', tissue: T.XUONG, say: [/xương bánh chè/i, /xương đầu gối/i], en: /patella/i },
  { id: 'CALCANEUS', vi: 'xương gót', tissue: T.XUONG, say: [/xương gót( chân)?/i], en: /calcaneus/i },
  { id: 'TALUS', vi: 'xương sên', tissue: T.XUONG, say: [/xương sên/i], en: /^(left |right )?talus$/i },
  { id: 'CLAVICLE', vi: 'xương đòn', tissue: T.XUONG, say: [/xương đòn( gánh)?/i], en: /clavicle/i },
  { id: 'STERNUM', vi: 'xương ức', tissue: T.XUONG, say: [/xương ức/i], en: /body of sternum|manubrium/i },
  { id: 'SCAPULA', vi: 'xương vai', tissue: T.XUONG, say: [/xương (bả )?vai/i, /gai (xương )?vai/i], en: /^(left |right )?scapula$/i },
  { id: 'HIP_BONE', vi: 'xương chậu', tissue: T.XUONG, say: [/xương chậu/i, /xương mu(?!\s*bàn)/i, /mào chậu/i], en: /hip bone/i },
  { id: 'SACRUM', vi: 'xương cùng', tissue: T.XUONG, say: [/xương (cùng|thiêng)/i], en: /^sacrum$/i },
  { id: 'MANDIBLE', vi: 'xương hàm dưới', tissue: T.XUONG, say: [/xương hàm dưới/i, /góc hàm/i], en: /^mandible$/i },
  { id: 'ZYGOMATIC', vi: 'xương gò má', tissue: T.XUONG, say: [/xương gò má/i, /cung gò má/i], en: /zygomatic bone/i },
  { id: 'TEMPORAL', vi: 'xương thái dương', tissue: T.XUONG, say: [/xương (thái dương|chũm)/i, /mỏm chũm/i], en: /temporal bone/i },
  { id: 'OCCIPITAL', vi: 'xương chẩm', tissue: T.XUONG, say: [/xương chẩm/i, /ụ chẩm/i], en: /occipital bone/i },
  { id: 'HYOID', vi: 'xương móng', tissue: T.XUONG, say: [/xương móng/i], en: /hyoid bone/i },
  { id: 'THYROID_CART', vi: 'sụn giáp', tissue: T.XUONG, say: [/sụn giáp/i, /yết hầu/i], en: /thyroid cartilage/i },
  // xương bàn tay / bàn chân / sườn có ĐÁNH SỐ — nhận số trong câu (parse-tissue xử lý hậu tố)
  { id: 'METACARPAL', vi: 'xương đốt bàn tay', tissue: T.XUONG, numbered: 'metacarpal', say: [/xương bàn (tay )?(ngón )?(thứ )?\d/i, /xương bàn(?! chân)/i], en: /metacarpal bone/i },
  { id: 'METATARSAL', vi: 'xương đốt bàn chân', tissue: T.XUONG, numbered: 'metatarsal', say: [/xương bàn chân( thứ)? ?\d?/i], en: /metatarsal bone/i },
  { id: 'RIB', vi: 'xương sườn', tissue: T.XUONG, numbered: 'rib', say: [/xương sườn( tự do)?( thứ)? ?\d*/i, /gian sườn ?\d*/i], en: / rib$/i },
];

// ——— mô SÁCH CÓ NHẮC nhưng atlas KHÔNG dựng: ghi nhận để không im lặng bỏ qua ———
const MISSING = [
  { id: 'MASSETER', vi: 'cơ cắn', tissue: T.CO, say: [/cơ cắn/i], why: 'atlas không dựng cơ cắn' },
  { id: 'TEMPORALIS', vi: 'cơ thái dương', tissue: T.CO, say: [/cơ thái dương/i], why: 'atlas không dựng cơ thái dương' },
  { id: 'LATISSIMUS', vi: 'cơ lưng rộng', tissue: T.CO, say: [/cơ lưng (to|rộng)/i], why: 'atlas không dựng cơ lưng rộng' },
  { id: 'RECT_ABD', vi: 'cơ thẳng bụng', tissue: T.CO, say: [/cơ thẳng bụng/i], why: 'atlas không dựng thành bụng trước' },
  { id: 'ORBICULARIS', vi: 'cơ vòng mi', tissue: T.CO, say: [/cơ vòng mi/i], why: 'atlas không dựng cơ bám da mặt' },
  { id: 'AURICULAR', vi: 'cơ tai trên', tissue: T.CO, say: [/cơ tai (trên|sau|trước)/i], why: 'atlas không dựng cơ tai' },
];

const ALL = TISSUES.concat(MISSING.map(m => ({ ...m, en: null, missing: m.why })));

/** Nhận diện mọi tên mô xuất hiện trong 1 đoạn văn, theo thứ tự xuất hiện. */
function findTissues(text) {
  const hits = [];
  for (const t of ALL) {
    for (const re of t.say) {
      const m = text.match(re);
      if (m) { hits.push({ ...t, at: m.index, matched: m[0] }); break; }
    }
  }
  return hits.sort((a, b) => a.at - b.at);
}

/** Tra 1 mục theo id hoặc theo tên gọi trong sách. */
function lookup(nameOrId) {
  const byId = ALL.find(t => t.id === nameOrId);
  if (byId) return byId;
  return ALL.find(t => t.say.some(re => re.test(nameOrId))) || null;
}

/** Danh sách conceptId atlas ứng với 1 mục (cần đối tượng atlas của mesh-io). */
function conceptsOf(entry, atlas) {
  if (!entry || !entry.en) return [];
  return atlas.search(entry.en).map(m => m.conceptId);
}

module.exports = { TISSUES, MISSING, ALL, T, findTissues, lookup, conceptsOf };

// ----- CLI: node tissue-lexicon.cjs  → kiểm tra MỌI mục có khớp khối hình học atlas không -----
if (require.main === module) {
  const { loadAtlas } = require('./mesh-io.cjs');
  loadAtlas().then(atlas => {
    let ok = 0, bad = 0;
    for (const t of TISSUES) {
      const ids = conceptsOf(t, atlas);
      const n = ids.reduce((s, id) => s + (atlas.points(id) || []).length / 3, 0);
      if (!ids.length) { bad++; console.log(`  ✗ ${t.id.padEnd(12)} ${t.vi.padEnd(28)} KHÔNG khớp khái niệm atlas nào (${t.en})`); }
      else { ok++; console.log(`  ✓ ${t.id.padEnd(12)} ${t.vi.padEnd(28)} ${String(ids.length).padStart(2)} khối · ${String(n).padStart(6)} đỉnh`); }
    }
    console.log(`\n${ok} mục khớp atlas · ${bad} mục hỏng · ${MISSING.length} mô atlas không dựng (đã ghi nhận riêng).`);
  });
}
