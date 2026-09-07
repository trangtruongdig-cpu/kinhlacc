/* landmark-glossary.cjs — BẢNG ĐỐI CHIẾU MỐC GIẢI PHẪU (sinh tự động).
 *
 * MỤC ĐÍCH: nối 3 thứ vốn rời nhau thành MỘT từ vựng chuẩn, để mô tả vị trí huyệt trong sách tra
 * ngược được sang HÌNH HỌC THẬT của mô hình 3D:
 *   (1) mô tả vị trí tiếng Việt trong sách    -> vitri-data.json  (parse-vitri.cjs đọc)
 *   (2) thuật ngữ chuẩn WHO / Terminologia Anatomica
 *   (3) khái niệm giải phẫu Human Atlas       -> frontend/public/kinhmach3d/data/human-atlas-vi.js
 *
 * Cột `vi` LÀ TÊN CHUẨN: từ điển dịch atlas (backend/tmp/translate-human-atlas-vi.mjs) và bảng
 * từ khoá LM của parse-vitri.cjs đều phải dùng đúng từ này, không dùng từ đồng nghĩa khác.
 *
 * BA LOẠI MỐC (`kind`):
 *   'atlas'  — atlas có sẵn nguyên khối đúng tên đó -> tra thẳng `atlasId`/`sides`.
 *   'derive' — atlas CHỈ có khối xương/cơ cha, KHÔNG tách mỏm/mấu/bờ -> suy bằng hình học trên
 *              chính mesh cha, xem `rule`. Đúng cách model-frame-v2-human-atlas.cjs đang dò.
 *   'soft'   — MÔ MỀM (chân tóc, rốn, đầu vú, khoé miệng, cơ cắn…). Atlas chỉ có xương/cơ/tạng
 *              nên KHÔNG dò tự động được — phải chấm tay hoặc suy theo tỉ lệ nhân trắc.
 *
 * HAI CẢNH BÁO ĐO ĐƯỢC TỪ CHÍNH DỮ LIỆU:
 *   · Chỉ 1.655/3.432 khái niệm atlas CÓ khối hình học; phần còn lại là khái niệm gộp trừu tượng
 *     (vd "vùng của cơ ngực lớn") — tra tên ra nhưng KHÔNG bắn tia vào được. Cột `geo` cho biết.
 *   · Atlas dựng RIÊNG trái/phải: khái niệm không phân bên (vd 'radius') là khái niệm gộp không có
 *     hình học; hình học nằm ở 'right radius'/'left radius' — xem cột `sides`.
 *
 * BẪY KHI DÒ TÊN — ĐỪNG KHỚP CHUỖI CON. Tên giải phẫu chứa nhau rất nhiều, khớp chuỗi con cho
 * kết quả rác mà nhìn qua tưởng đúng. Ba ca thật đã vấp:
 *   · 'mental' (cằm) khớp 186 concept, KHÔNG cái nào là cằm — toàn "segMENTAL" (phân thuỳ).
 *     Phải tra 'mandib' (8 concept).
 *   · 'acromion' chỉ ra 6, bỏ sót nhóm 'thoraco-acromial' và 'acromial part' — phải tra gốc từ
 *     'acromi' (18 concept), rồi lọc tay: 12 là nhánh động mạch, 6 là phần cơ delta, 0 là mỏm xương.
 *   · Khớp lỏng từng làm METACARPAL bám nhầm vào "Xương đốt bàn tay 1 phải" (một biến thể đánh số)
 *     thay vì khái niệm gộp.
 * Vì vậy hàm dò trong script sinh CHỈ khớp chính xác, hoặc qua cặp 'right X'/'left X', hoặc qua danh
 * sách concept con chỉ đích danh (xem cột `sides`).
 *
 * SINH LẠI sau mỗi lần đổi bản dịch atlas (cột atlasVi bám theo bản dịch).
 */

const LANDMARKS = [
  { id: 'LARYNX', vi: 'sụn giáp', alias: [], who: 'laryngeal prominence (thyroid cartilage)', kind: 'atlas',
    atlasId: 'FMA55099', atlasVi: 'Sụn giáp', atlasEn: 'thyroid cartilage',
    sides: [], geo: true, layer: 'bone',
    rule: null, points: 'CV22, LI18, ST9' },
  { id: 'CLAVICLE', vi: 'xương đòn', alias: [], who: 'clavicle', kind: 'atlas',
    atlasId: 'FMA13321', atlasVi: 'Xương đòn', atlasEn: 'clavicle',
    sides: ['FMA13322', 'FMA13323'], geo: true, layer: 'bone',
    rule: null, points: 'ST12, KI27, LU1' },
  { id: 'PATELLA', vi: 'xương bánh chè', alias: [], who: 'patella', kind: 'atlas',
    atlasId: 'FMA24485', atlasVi: 'Xương bánh chè', atlasEn: 'patella',
    sides: ['FMA24486', 'FMA24487'], geo: true, layer: 'bone',
    rule: null, points: 'ST34, ST35, SP10' },
  { id: 'STERNUM', vi: 'xương ức', alias: ['thân xương ức'], who: 'body of sternum', kind: 'atlas',
    atlasId: 'FMA7485', atlasVi: 'Xương ức', atlasEn: 'sternum',
    sides: ['FMA7487'], geo: true, layer: 'bone',
    rule: 'thân xương ức mang hình học, không phải khái niệm gộp "sternum"', points: 'CV17, CV18, KI23' },
  { id: 'ZYGOMATIC', vi: 'xương gò má', alias: [], who: 'zygomatic bone', kind: 'atlas',
    atlasId: 'FMA52747', atlasVi: 'Xương gò má', atlasEn: 'zygomatic bone',
    sides: ['FMA52892', 'FMA52893'], geo: true, layer: 'bone',
    rule: null, points: 'ST3, SI18' },
  { id: 'SCM', vi: 'cơ ức đòn chũm', alias: [], who: 'sternocleidomastoid muscle', kind: 'atlas',
    atlasId: 'FMA13407', atlasVi: 'Cơ ức đòn chũm', atlasEn: 'sternocleidomastoid',
    sides: ['FMA13408', 'FMA13409'], geo: true, layer: 'muscle',
    rule: null, points: 'LI18, SI16, ST9' },
  { id: 'SCALENE_ANT', vi: 'cơ bậc thang trước', alias: [], who: 'anterior scalene muscle', kind: 'atlas',
    atlasId: 'FMA13385', atlasVi: 'Cơ bậc thang trước', atlasEn: 'scalenus anterior',
    sides: ['FMA13392', 'FMA13393'], geo: true, layer: 'muscle',
    rule: null, points: 'ST12' },
  { id: 'PECT_MINOR', vi: 'cơ ngực bé', alias: ['cơ ngực nhỏ'], who: 'pectoralis minor muscle', kind: 'atlas',
    atlasId: 'FMA13109', atlasVi: 'Cơ ngực bé', atlasEn: 'pectoralis minor',
    sides: ['FMA13375', 'FMA13376'], geo: true, layer: 'muscle',
    rule: null, points: 'LU1, LU2' },
  { id: 'PECT_MAJOR', vi: 'cơ ngực lớn', alias: [], who: 'pectoralis major muscle', kind: 'derive',
    atlasId: 'FMA34687', atlasVi: 'Phần đòn của cơ ngực lớn', atlasEn: 'clavicular part of pectoralis major',
    sides: ['FMA34690', 'FMA34691', 'FMA45874', 'FMA45875', 'FMA79979', 'FMA79980'], geo: true, layer: 'muscle',
    rule: 'atlas KHÔNG có nguyên khối cơ ngực lớn — chỉ có phần đòn + phần ức sườn, gộp 2 phần lại — cơ ngực lớn chỉ có 3 phần, không có nguyên khối', points: 'nếp nách trước' },
  { id: 'TIB_ANT', vi: 'cơ chày trước', alias: [], who: 'tibialis anterior muscle', kind: 'atlas',
    atlasId: 'FMA22532', atlasVi: 'Cơ chày trước', atlasEn: 'tibialis anterior',
    sides: ['FMA22544', 'FMA22545'], geo: true, layer: 'bone',
    rule: null, points: 'ST36, ST41' },
  { id: 'METACARPAL', vi: 'xương đốt bàn tay', alias: ['xương bàn tay'], who: 'metacarpal bone', kind: 'atlas',
    atlasId: 'FMA9612', atlasVi: 'Xương đốt bàn tay', atlasEn: 'metacarpal bone',
    sides: ['FMA24464', 'FMA24465', 'FMA24466', 'FMA24467', 'FMA24468', 'FMA24469', 'FMA24470', 'FMA24471', 'FMA24472', 'FMA24473'], geo: true, layer: 'bone',
    rule: '5 xương đốt bàn tay x 2 bên', points: 'LI4, SI3, TE3' },
  { id: 'METATARSAL', vi: 'xương đốt bàn chân', alias: ['xương bàn chân'], who: 'metatarsal bone', kind: 'atlas',
    atlasId: 'FMA24492', atlasVi: 'Xương đốt bàn chân', atlasEn: 'metatarsal bone',
    sides: ['FMA24507', 'FMA24508', 'FMA24509', 'FMA24510', 'FMA24511', 'FMA24512', 'FMA24513', 'FMA24514', 'FMA24515', 'FMA24516'], geo: true, layer: 'bone',
    rule: '5 xương đốt bàn chân x 2 bên', points: 'LR3, SP3, GB41' },
  { id: 'CALCANEUS', vi: 'xương gót', alias: [], who: 'calcaneus', kind: 'atlas',
    atlasId: 'FMA24496', atlasVi: 'Xương gót', atlasEn: 'calcaneus',
    sides: ['FMA24497', 'FMA24498'], geo: true, layer: 'bone',
    rule: null, points: 'KI3, BL60, BL61' },
  { id: 'VERTEX', vi: 'đỉnh đầu', alias: [], who: 'vertex', kind: 'derive',
    atlasId: 'FMA9613', atlasVi: 'Xương đỉnh', atlasEn: 'parietal bone',
    sides: ['FMA52788', 'FMA52789'], geo: true, layer: 'bone',
    rule: 'điểm CAO NHẤT của xương đỉnh+trán+chẩm', points: 'GV20' },
  { id: 'MENTON', vi: 'cằm', alias: [], who: 'mental protuberance', kind: 'derive',
    atlasId: 'FMA52748', atlasVi: 'Xương hàm dưới', atlasEn: 'mandible',
    sides: [], geo: true, layer: 'bone',
    rule: '15% thấp nhất, gần đường giữa', points: 'CV24' },
  { id: 'MANDIBLE_ANGLE', vi: 'góc hàm dưới', alias: [], who: 'angle of mandible', kind: 'derive',
    atlasId: 'FMA52748', atlasVi: 'Xương hàm dưới', atlasEn: 'mandible',
    sides: [], geo: true, layer: 'bone',
    rule: 'điểm sau-dưới nhất mỗi bên', points: 'ST5, ST6' },
  { id: 'STERNUM_TOP', vi: 'hõm ức', alias: [], who: 'suprasternal notch', kind: 'derive',
    atlasId: 'FMA7486', atlasVi: 'Cán ức', atlasEn: 'manubrium',
    sides: [], geo: true, layer: 'bone',
    rule: 'điểm giữa bờ TRÊN cán ức', points: 'CV22' },
  { id: 'XIPHOID', vi: 'mũi ức', alias: ['mỏm mũi ức'], who: 'xiphoid process', kind: 'atlas',
    atlasId: 'FMA7488', atlasVi: 'Mỏm mũi ức', atlasEn: 'xiphoid process',
    sides: [], geo: true, layer: 'bone',
    rule: null, points: 'CV15, CV14' },
  { id: 'CUBITAL', vi: 'nếp khuỷu', alias: [], who: 'cubital crease', kind: 'derive',
    atlasId: 'FMA13303', atlasVi: 'Xương cánh tay', atlasEn: 'humerus',
    sides: ['FMA23130', 'FMA23131'], geo: true, layer: 'bone',
    rule: 'đầu XA xương cánh tay', points: 'LU5, PC3, HT3' },
  { id: 'OLECRANON', vi: 'mỏm khuỷu', alias: [], who: 'olecranon', kind: 'derive',
    atlasId: 'FMA23466', atlasVi: 'Xương trụ', atlasEn: 'ulna',
    sides: ['FMA23467', 'FMA23468'], geo: true, layer: 'bone',
    rule: 'đầu GẦN xương trụ, điểm sau nhất', points: 'SI8, TE10' },
  { id: 'STYLOID_RAD', vi: 'mỏm trâm quay', alias: [], who: 'radial styloid process', kind: 'derive',
    atlasId: 'FMA23463', atlasVi: 'Xương quay', atlasEn: 'radius',
    sides: ['FMA23464', 'FMA23465'], geo: true, layer: 'bone',
    rule: 'đầu XA xương quay, điểm ngoài nhất', points: 'LU7, LU9' },
  { id: 'STYLOID_ULN', vi: 'mỏm trâm trụ', alias: [], who: 'ulnar styloid process', kind: 'derive',
    atlasId: 'FMA23466', atlasVi: 'Xương trụ', atlasEn: 'ulna',
    sides: ['FMA23467', 'FMA23468'], geo: true, layer: 'bone',
    rule: 'đầu XA xương trụ, điểm trong nhất', points: 'SI5, SI6' },
  { id: 'WRIST', vi: 'lằn cổ tay', alias: [], who: 'wrist crease', kind: 'derive',
    atlasId: 'FMA23463', atlasVi: 'Xương quay', atlasEn: 'radius',
    sides: ['FMA23464', 'FMA23465'], geo: true, layer: 'bone',
    rule: 'đầu XA xương quay+trụ (giáp khối bàn tay)', points: 'LU9, PC7, HT7' },
  { id: 'ACROMION', vi: 'mỏm cùng vai', alias: [], who: 'acromion', kind: 'derive',
    atlasId: 'FMA34678', atlasVi: 'Phần mỏm cùng vai của cơ delta', atlasEn: 'acromial part of deltoid',
    sides: ['FMA34682', 'FMA34683'], geo: true, layer: 'muscle',
    rule: 'bao hình của PHẦN MỎM CÙNG VAI CỦA CƠ DELTA — bám sát mỏm cùng vai thật, sát hơn suy từ cả xương bả vai (gợi ý của phiên kinhlacc-e7, đã kiểm chứng có hình học)', points: 'LI15, TE14' },
  { id: 'SCAPULA_SPINE', vi: 'gai vai', alias: [], who: 'spine of scapula', kind: 'derive',
    atlasId: 'FMA32521', atlasVi: 'Xương vai', atlasEn: 'acromial part of deltoid',
    sides: ['FMA13395', 'FMA13396'], geo: true, layer: 'bone',
    rule: 'gờ sau, chạy chéo lên-ngoài', points: 'SI11-SI14' },
  { id: 'HIP_ANT', vi: 'gai chậu trước trên', alias: [], who: 'anterior superior iliac spine', kind: 'derive',
    atlasId: 'FMA16585', atlasVi: 'Xương chậu', atlasEn: 'hip bone',
    sides: ['FMA16586', 'FMA16587'], geo: true, layer: 'bone',
    rule: 'điểm TRƯỚC-TRÊN-NGOÀI nhất', points: 'GB26, ST27' },
  { id: 'PUBIS', vi: 'bờ trên xương mu', alias: [], who: 'superior border of pubic symphysis', kind: 'derive',
    atlasId: 'FMA16585', atlasVi: 'Xương chậu', atlasEn: 'hip bone',
    sides: ['FMA16586', 'FMA16587'], geo: true, layer: 'bone',
    rule: 'phần dưới, gần đường giữa nhất', points: 'CV2, CV3' },
  { id: 'TROCHANTER_GT', vi: 'mấu chuyển lớn', alias: [], who: 'greater trochanter', kind: 'derive',
    atlasId: 'FMA9611', atlasVi: 'Xương đùi', atlasEn: 'femur',
    sides: ['FMA24474', 'FMA24475'], geo: true, layer: 'bone',
    rule: 'đầu GẦN xương đùi, điểm ngoài nhất', points: 'GB30, GB29' },
  { id: 'POPLITEAL', vi: 'nếp kheo', alias: [], who: 'popliteal crease', kind: 'derive',
    atlasId: 'FMA9611', atlasVi: 'Xương đùi', atlasEn: 'femur',
    sides: ['FMA24474', 'FMA24475'], geo: true, layer: 'bone',
    rule: 'điểm SAU nhất gần đầu gối', points: 'BL40, BL39' },
  { id: 'TIBIA_PROX', vi: 'đầu trên xương chày', alias: [], who: 'proximal tibia', kind: 'derive',
    atlasId: 'FMA24476', atlasVi: 'Xương chày', atlasEn: 'tibia',
    sides: ['FMA24477', 'FMA24478'], geo: true, layer: 'bone',
    rule: 'đầu GẦN, bờ sau-trong', points: 'SP9, ST36' },
  { id: 'MALLEOLUS_LAT', vi: 'mắt cá ngoài', alias: [], who: 'lateral malleolus', kind: 'derive',
    atlasId: 'FMA24479', atlasVi: 'Xương mác', atlasEn: 'fibula',
    sides: ['FMA24480', 'FMA24481'], geo: true, layer: 'bone',
    rule: 'đầu XA xương mác, điểm thấp-ngoài nhất', points: 'GB40, BL60' },
  { id: 'MALLEOLUS_MED', vi: 'mắt cá trong', alias: [], who: 'medial malleolus', kind: 'derive',
    atlasId: 'FMA24476', atlasVi: 'Xương chày', atlasEn: 'tibia',
    sides: ['FMA24477', 'FMA24478'], geo: true, layer: 'bone',
    rule: 'đầu XA xương chày, điểm thấp-trong nhất', points: 'KI3, SP6' },
  { id: 'RIB1', vi: 'xương sườn 1', alias: [], who: 'first rib', kind: 'derive',
    atlasId: 'FMA7574', atlasVi: 'Xương sườn', atlasEn: 'rib',
    sides: ['FMA7857', 'FMA7987'], geo: true, layer: 'bone',
    rule: 'xương sườn cao nhất — xương sườn 1 dựng riêng trái/phải', points: 'LU1, ST12' },
  { id: 'PHALANX_HAND', vi: 'đốt ngón tay', alias: ['đốt ngón của ngón tay'], who: 'phalanx of finger', kind: 'derive',
    atlasId: 'FMA23914', atlasVi: 'Đốt ngón của ngón tay', atlasEn: 'phalanx of finger',
    sides: ['FMA23938', 'FMA23940', 'FMA23942', 'FMA23944', 'FMA23953', 'FMA23955', 'FMA23957', 'FMA23959', 'FMA24451', 'FMA24452', 'FMA24453', 'FMA24454', 'FMA24455', 'FMA24456', 'FMA24457', 'FMA24458', 'FMA24460', 'FMA24461', 'FMA24462', 'FMA24463', 'FMA66791', 'FMA71908', 'FMA71915', 'FMA71916'], geo: true, layer: 'bone',
    rule: 'đốt xa; góc móng = góc ngoài đầu đốt xa — đốt gần/giữa/xa từng ngón x 2 bên', points: 'các huyệt Tỉnh tay' },
  { id: 'PHALANX_FOOT', vi: 'đốt ngón chân', alias: ['đốt ngón của ngón chân'], who: 'phalanx of toe', kind: 'derive',
    atlasId: 'FMA24493', atlasVi: 'Đốt ngón của ngón chân', atlasEn: 'phalanx of toe',
    sides: ['FMA32634', 'FMA32635', 'FMA32636', 'FMA32637', 'FMA32638', 'FMA32639', 'FMA32642', 'FMA32643', 'FMA32644', 'FMA32645', 'FMA32646', 'FMA32647', 'FMA32652', 'FMA32653', 'FMA32654', 'FMA32655', 'FMA32656', 'FMA32657'], geo: true, layer: 'bone',
    rule: 'đốt xa; góc móng = góc ngoài đầu đốt xa — đốt gần/giữa/xa từng ngón chân x 2 bên', points: 'các huyệt Tỉnh chân' },
  { id: 'HAIRLINE_ANT', vi: 'chân tóc trước', alias: [], who: 'anterior hairline', kind: 'soft',
    atlasId: null, atlasVi: null, atlasEn: null,
    sides: [], geo: false, layer: null,
    rule: 'chấm tay trên bề mặt da', points: 'GV24, BL3' },
  { id: 'GLABELLA', vi: 'gian mày', alias: [], who: 'glabella', kind: 'soft',
    atlasId: null, atlasVi: null, atlasEn: null,
    sides: [], geo: false, layer: null,
    rule: 'chấm tay (giữa 2 cung mày)', points: 'GV24.5 Ấn Đường' },
  { id: 'PUPIL', vi: 'đồng tử', alias: [], who: 'pupil (centre of eye)', kind: 'soft',
    atlasId: null, atlasVi: null, atlasEn: null,
    sides: [], geo: false, layer: null,
    rule: 'chấm tay khi nhìn thẳng', points: 'ST1, ST2, GB1' },
  { id: 'MOUTH_ANGLE', vi: 'khoé miệng', alias: [], who: 'angle of mouth', kind: 'soft',
    atlasId: null, atlasVi: null, atlasEn: null,
    sides: [], geo: false, layer: null,
    rule: 'chấm tay', points: 'ST4, ST6' },
  { id: 'NAVEL', vi: 'rốn', alias: [], who: 'umbilicus', kind: 'soft',
    atlasId: null, atlasVi: null, atlasEn: null,
    sides: [], geo: false, layer: null,
    rule: 'chấm tay (mức đốt sống L3-L4 chiếu ra da)', points: 'CV8, ST25' },
  { id: 'NIPPLE', vi: 'đầu vú', alias: [], who: 'nipple', kind: 'soft',
    atlasId: null, atlasVi: null, atlasEn: null,
    sides: [], geo: false, layer: null,
    rule: 'chấm tay (ngang khoang liên sườn 4)', points: 'ST17, CV17' },
  { id: 'AXILLA_ANT', vi: 'nếp nách trước', alias: [], who: 'anterior axillary fold', kind: 'soft',
    atlasId: 'FMA34687', atlasVi: 'Phần đòn của cơ ngực lớn', atlasEn: 'clavicular part of pectoralis major',
    sides: [], geo: false, layer: null,
    rule: 'bờ dưới-ngoài phần đòn cơ ngực lớn (atlas không có nguyên khối cơ ngực lớn)', points: 'LU2, LI14' },
  { id: 'AXILLA_POST', vi: 'nếp nách sau', alias: [], who: 'posterior axillary fold', kind: 'soft',
    atlasId: null, atlasVi: null, atlasEn: null,
    sides: [], geo: false, layer: null,
    rule: 'chấm tay', points: 'SI9, SI10' },
  { id: 'KNEE_EYE_LAT', vi: 'mắt gối ngoài', alias: [], who: 'lateral depression below patella', kind: 'soft',
    atlasId: 'FMA24485', atlasVi: 'Xương bánh chè', atlasEn: 'patella',
    sides: ['FMA24486', 'FMA24487'], geo: true, layer: 'bone',
    rule: 'hõm mô mềm cạnh dây chằng bánh chè', points: 'ST35 Độc Tỵ' },
  { id: 'MASSETER', vi: 'cơ cắn', alias: [], who: 'masseter muscle', kind: 'soft',
    atlasId: null, atlasVi: null, atlasEn: null,
    sides: [], geo: false, layer: null,
    rule: 'KHÔNG có trong atlas — chấm tay (cắn răng thì nổi rõ)', points: 'ST6, ST7' },
];

/** Tra mốc theo id. */
function byId(id) { return LANDMARKS.find(l => l.id === id) || null; }

/** Tra theo tên tiếng Việt chuẩn HOẶC từ đồng nghĩa sách hay dùng. */
function byVi(vi) {
  const k = String(vi).toLowerCase().trim();
  return LANDMARKS.find(l => l.vi.toLowerCase() === k || (l.alias || []).some(a => a.toLowerCase() === k)) || null;
}
/** Mốc dò được tự động từ hình học atlas. */
function autoLocatable() { return LANDMARKS.filter(l => l.kind !== 'soft' && l.geo); }
/** Mốc BẮT BUỘC chấm tay (mô mềm, hoặc khái niệm atlas không có hình học). */
function needsManual() { return LANDMARKS.filter(l => l.kind === 'soft' || !l.geo); }

module.exports = { LANDMARKS, byId, byVi, autoLocatable, needsManual };
