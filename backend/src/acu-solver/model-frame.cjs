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
  // ĐỢT SỬA "HỘI ĐỒNG": 4 mốc mặt dưới đây trước đây là OLD-STALE (toạ độ mesh CŨ 6,5MB) — z=0,090
  // là mặt của mesh cũ, trong khi da mesh v2 ở z≈0,048–0,051 ⇒ CẢ KHỐI MẶT bị đẩy ra trước ~5cm,
  // kéo theo ST1–4, BL1–5, GB1, TE23 bay ra ngoài da. Nay dò lại TỪ XƯƠNG có nhãn trong atlas.
  HAIRLINE_ANT: { x: 0,      y: 0.9807, z: 0.0356 },     // chân tóc trước — 3 thốn trên Ấn Đường trên CUNG ĐÃ NEO LẠI bằng Bách Hội (xem HEAD_ARC_NEO)
  HAIRLINE_POST:{ x: 0,      y: 0.9, z: -0.0514 },    // chân tóc sau — 15 thốn trên cung đã neo lại
  GLABELLA:     { x: 0,      y: 0.9500, z: 0.0487 },     // Ấn Đường — đường giữa, mức trần ổ mắt (TK trên ổ mắt FMA52657), da nhô trước nhất
  /* PUPIL: SỬA x 0,0152 → 0,0186 (2,61 → 3,20 cm; hai đồng tử 5,2 → 6,4 cm). Giá trị cũ suy từ TRỤC DỌC
   * KHUYẾT TRÊN Ổ MẮT — mốc đó nằm ở bờ trong-trên ổ mắt, medial hơn đồng tử ~0,6cm. Bằng chứng thay thế:
   * đầu TRƯỚC của dây thần kinh thị giác (FMA50878, chỗ bám vào cực sau nhãn cầu) ở x = 3,20 cm; đĩa thị
   * lệch mũi vài mm so với trục đồng tử nên đồng tử ở 3,2 cm hoặc lớn hơn chút. Khớp độc lập với
   * LAT_CUN.head mới: 2,25 thốn × 1,42 = 3,19 cm (WHO: đường dọc đồng tử = 2,25 thốn ngang đầu). */
  PUPIL:        { x: 0.0186, y: 0.9451, z: 0.0473, side: 1 },  // đồng tử — cao độ = giữa trần(TK trên ổ mắt) & sàn(đỉnh xương hàm trên FMA53650)
  MOUTH_ANGLE:  { x: 0.0137, y: 0.8948, z: 0.0508, side: 1 },  // khoé miệng — mức dưới bờ ổ răng hàm trên; rộng miệng 4,7cm
  MENTON:       { x: 0,      y: 0.8757, z: 0.0342 },   // cằm — dò từ mandible (15% thấp nhất, gần giữa)
  // —— cổ / ngực / bụng (đường giữa) ——
  LARYNX:       { x: 0,      y: 0.8648, z: 0.0008 },   // sụn giáp — dò từ thyroid cartilage
  STERNUM_TOP:  { x: 0,      y: 0.8151, z: 0.0334 },   // hõm ức (hõm cảnh) — ĐÁY hõm ở bờ trên CÁN ỨC,
  // lọc quanh đường giữa. SỬA: giá trị cũ y=0,7955 (136,7cm) thấp hơn 3,4cm, rơi vào GIỮA thân cán ức.
  // Hai phép kiểm chéo độc lập: (a) hõm ức kinh điển ngang T2/T3 — 140,1cm ≈ VERT_T2 (140,7cm) ✔, còn
  // 136,7cm rơi xuống ngang T4/T5 ✗; (b) dựng lại chuỗi Nhâm Mạch theo cốt độ thì CV17 Đản Trung ra
  // cách đường đầu vú 0,8cm (bản cũ lệch 1,6cm) — Đản Trung phải NGANG đầu vú.
  // Lỗi gốc có thể do lấy max y của cả khối cán ức: bờ trên cán ức cao nhất ở HAI BÊN (khuyết đòn),
  // đáy hõm ở giữa lại thấp hơn — nhưng ở đây giá trị cũ còn thấp hơn cả đáy hõm.
  XIPHOID:      { x: 0,      y: 0.7315, z: 0.0605 },   // mũi ức — đầu dưới xương ức (SOÁT: lệch +6.6% so bản cũ)
  NAVEL:        { x: 0,      y: 0.6136, z: 0.0593 },   // rốn — suy từ mức đốt sống L3-L4 + chiếu ra da (SOÁT MẮT)
  PUBIS:        { x: -0.0012,y: 0.5089, z: 0.0082 },   // bờ trên xương mu — dò từ hip bone (phần dưới, gần giữa nhất)
  NIPPLE:       { x: 0.0443, y: 0.7440, z: 0.0671, side: 1 },  // đầu vú — ĐẶT TRÊN ĐƯỜNG GIỮA ĐÒN
  // (trung điểm xương đòn trái, x=7,6cm), đúng định nghĩa giải phẫu. Mesh là mẫu NGỰC PHẲNG nên không
  // có chỗ nhô để dò trực tiếp — quét lát cắt ngực chỉ thấy z giảm đều từ x=4,3cm ra ngoài, không có
  // đỉnh cục bộ nào. SỬA: giá trị cũ x=0,0735 (12,6cm) đặt đầu vú lệch 5cm RA NGOÀI đường giữa đòn.
  CLAVICLE:     { x: 0.0834, y: 0.8309, z: -0.0205, side: 1 }, // xương đòn (SOÁT: z đổi dấu so bản cũ)
  // —— chi trên (cặp) ——
  AXILLA_ANT:   { x: 0.0918, y: 0.8225, z: -0.0142, side: 1 }, // xấp xỉ đầu gần xương cánh tay — CHƯA phải nếp nách da thật, cần soát
  AXILLA_POST:  { x: 0.0901, y: 0.7933, z: -0.0744, side: 1 },  // nếp nách sau — điểm da SAU nhất trong dải nách (x 0,09–0,14 · y 0,76–0,80) trên mesh v2
  CUBITAL:      { x: 0.1374, y: 0.6493, z: -0.0187, side: 1 }, // khuỷu — đầu xa xương cánh tay (gần khối cẳng tay)
  /* NẾP NÁCH TRƯỚC — thêm 08/09/2026. Đây là mốc gỡ được thế bí của THANG CÁNH TAY, thứ đã ba lần
   * không chốt nổi (ba cách đo cho 2,57 / 3,27 / 3,49 cm mỗi thốn). Lý do ba lần đều hỏng: dùng
   * ACROMION làm đầu trên, mà mỏm cùng vai cao hơn nếp nách tới 11,1cm — sách thì đo từ NẾP NÁCH.
   * Dò bằng thứ mesh có: bờ DƯỚI-NGOÀI của phần đòn cơ ngực lớn trái (FMA34691) — phần này có x lớn
   * nhất trong ba phần cơ ngực lớn (19,19 so với 15,31 và 18,44), tức nằm ngoài nhất, đúng chỗ cơ bám
   * vào cánh tay và tạo nếp nách trước. Ba phần cho bờ dưới ở 131,28 / 132,36 / 132,53cm — dải 4%.
   * THANG: nếp nách 131,28 → nếp khuỷu 111,61 = 19,67cm, sách chia 9 thốn ⇒ 1 thốn = 2,19cm.
   * KIỂM CHÉO ĐỘC LẬP bằng ba huyệt vòng 31 dựng trước khi có mốc này: LU3 đo 2,94 thốn (sách 3) ·
   * LU4 3,98 (4) · HT2 5,79 (6) — lệch 0,13 / 0,04 / 0,45cm. */
  AXILLA_ANT:   { x: 0.1116, y: 0.7637, z: -0.0100, side: 1 }, // nếp nách trước — bờ dưới-ngoài phần đòn cơ ngực lớn
  WRIST:        { x: 0.1617, y: 0.5143, z: 0.0102, side: 1 },  // cổ tay — đầu xa xương quay+trụ (gần khối bàn tay)
  // —— chi dưới (cặp) ——
  HIP_ANT:      { x: 0.0738, y: 0.5662, z: 0.0221, side: 1 },  // gai chậu trước trên — dò từ hip bone (SOÁT: lệch +6.6% so bản cũ)
  KNEE_EYE_LAT: { x: 0.0482, y: 0.2671, z: 0.0091, side: 1 }, // ĐÃ SỬA: "mắt gối" là hõm MÔ MỀM cạnh dây chằng bánh chè, không nằm hẳn trên xương — x,y lấy từ điểm ngoài nhất gần đầu xa xương đùi (quy đổi /1.7), z (độ sâu/trước) mượn từ PATELLA vì xương đùi đơn thuần không tới được độ nhô ra trước đủ (bug cũ: lấy điểm SAU lồi cầu, làm ST36 lệch 6.7cm)
  PATELLA:      { x: 0.0544, y: 0.2772, z: 0.0091, side: 1 }, // xương bánh chè — điểm trên-ngoài
  POPLITEAL:    { x: 0.0302, y: 0.2686, z: -0.0291, side: 1 }, // nếp kheo — xấp xỉ điểm sau nhất gần đầu gối
  MALLEOLUS_LAT:{ x: 0.0612, y: 0.0408, z: -0.0227, side: 1 }, // mắt cá ngoài — đầu xa xương mác (SOÁT: z đổi dấu so bản cũ)
  MALLEOLUS_MED:{ x: 0.0482, y: 0.0478, z: -0.0268, side: 1 }, // mắt cá trong — đầu xa xương chày (SOÁT: z đổi dấu so bản cũ)
  // —— mốc THÊM sau khi rà soát đúng chuẩn WHO 骨度分寸 (trục trong/ngoài chi dưới bị dùng LẪN) ——
  GREATER_TROCHANTER:  { x: 0.0874, y: 0.5014, z: -0.0139, side: 1 }, // mấu chuyển lớn xương đùi — WHO: đầu trên trục đùi NGOÀI (19 thốn tới nếp kheo). SỬA: giá trị cũ (0.0629,0.5226,-0.0096) lấy nhầm điểm gần cổ xương đùi, lệch vào trong ~4,2cm + lên ~3,6cm so đỉnh mấu chuyển thật — phát hiện qua audit khe mô độc lập (kinhlacc-94: cụm GB29/31/32/35 sát xương/âm độ sâu), đối chiếu lại bằng quét đỉnh x lớn nhất trên xương đùi trái (FMA24475) trong dải y hông, ổn định qua 8 đỉnh lân cận (x∈[0.0836,0.0874])
  FEMUR_MED_EPICONDYLE:{ x: 0.0198, y: 0.2735, z: -0.0111, side: 1 }, // lồi cầu trong xương đùi — WHO: đầu dưới trục đùi TRONG (18 thốn từ xương mu)
  TIBIA_MED_CONDYLE:   { x: 0.0462, y: 0.2602, z: -0.0014, side: 1 }, // lồi cầu trong xương chầy (= SP9 Âm Lăng Tuyền) — WHO: đầu trên trục cẳng chân TRONG (13 thốn tới mắt cá trong)
  // —— mốc "ảo" chỉ để neo trục ngang ——
  MIDLINE_CHEST:{ x: 0,      y: 0.7440, z: 0.0662 },   // đường giữa ngực mức đầu vú — đo trên da mesh v2
  MIDLINE_ABD:  { x: 0,      y: 0.6136, z: 0.0593 },   // = NAVEL (giống bản gốc, chỉ đổi x=0 tuyệt đối)
  STERNUM:      { x: 0.0011, y: 0.7566, z: 0.0542 },   // thân xương ức — centroid
  // —— mốc THÊM cho đợt 3 (BL/GB/TE) — vai/khuỷu/gót + toàn bộ đốt sống ngực-thắt lưng ——
  ACROMION:     { x: 0.0948, y: 0.8298, z: -0.0195 },  // mỏm cùng vai — điểm cao-ngoài nhất xương bả vai (LI15, TE14)
  OLECRANON:    { x: 0.1248, y: 0.6542, z: -0.0302 },  // mỏm khuỷu — đầu gần xương trụ, điểm sau nhất (SI8, TE10)
  CALCANEUS:    { x: 0.0378, y: 0.0185, z: -0.0445 },  // xương gót — điểm sau nhất (KI3 lân cận, BL60/61)
  RIB1:         { x: 0.0247, y: 0.8276, z: -0.0063 },  // xương sườn 1 — centroid (LU1, ST12 tham chiếu)
  SCAPULA_MED_BORDER: { x: 0.0336, y: 0.8014, z: -0.0521 }, // bờ trong xương bả vai mức giữa — dùng tính LAT_CUN.back, tham chiếu SI/BL vùng vai
  MASTOID:      { x: 0.0274, y: 0.9136, z: -0.034 },   // mỏm chũm — điểm sau-dưới nhất xương thái dương (TE17, GB12, TE21 lân cận)
  FIBULA_HEAD:  { x: 0.0624, y: 0.2542, z: -0.0239 },  // chỏm xương mác — đầu gần xương mác (GB34 Dương Lăng Tuyền)
  RIB12:        { x: 0.0499, y: 0.6358, z: -0.0245 },  // đầu tự do xương sườn 12 (GB25 Đái Mạch)
  // đốt sống ngực T1-T12 + thắt lưng L1-L5 + C7 + cùng (mỏm gai, x=0 đường giữa) — cho kinh Bàng Quang
  VERT_C7:  { x: 0, y: 0.8413, z: -0.0462 },
  VERT_T1:  { x: 0, y: 0.8313, z: -0.0486 },
  VERT_T2:  { x: 0, y: 0.8186, z: -0.0515 },
  VERT_T3:  { x: 0, y: 0.8039, z: -0.0578 },
  VERT_T4:  { x: 0, y: 0.7931, z: -0.0585 },
  VERT_T5:  { x: 0, y: 0.7681, z: -0.0586 },
  VERT_T6:  { x: 0, y: 0.7512, z: -0.0579 },
  VERT_T7:  { x: 0, y: 0.7358, z: -0.0582 },
  VERT_T8:  { x: 0, y: 0.7217, z: -0.0581 },
  VERT_T9:  { x: 0, y: 0.7054, z: -0.0550 },
  VERT_T10: { x: 0, y: 0.6884, z: -0.0541 },
  VERT_T11: { x: 0, y: 0.6777, z: -0.0510 },
  VERT_T12: { x: 0, y: 0.6628, z: -0.0455 },
  VERT_L1:  { x: 0, y: 0.6444, z: -0.0416 },
  VERT_L2:  { x: 0, y: 0.6258, z: -0.0386 },
  VERT_L3:  { x: 0, y: 0.6121, z: -0.0415 },
  VERT_L4:  { x: 0, y: 0.6006, z: -0.0434 },
  VERT_L5:  { x: 0, y: 0.5856, z: -0.0480 },
  VERT_SACRUM: { x: 0, y: 0.5514, z: -0.0418 }, // centroid — đốt cùng không tách lẻ trong atlas
};

/* --------- CUNG DỌC ĐẦU (trục cốt-độ CONG — thứ mà engine tuyến tính trước đây KHÔNG có) ---------
 *
 * VÌ SAO PHẢI CÓ: mọi trục trong AXES đều là NỘI SUY THẲNG giữa 2 mốc. Với chi thì đúng (xương
 * thẳng), với ĐẦU thì sai hẳn: sọ là mặt cong, đi "1 thốn lên trên" theo đường thẳng sẽ chui vào
 * trong sọ rồi trồi ra ngoài. Đó là gốc của việc GB18 (y=1,0061) và GB19 (y=1,0376) bị đẩy LÊN TRÊN
 * ĐỈNH SỌ tới 6,5cm — đỉnh đầu mesh chỉ tới y=1,0000.
 *
 * ĐỊNH NGHĨA (WHO 骨度分寸, cả hai đầu mút đều ĐO ĐƯỢC trên mesh nên trục tự kiểm chứng được):
 *   Ấn Đường (GLABELLA) →(3)→ chân tóc trước →(12)→ chân tóc sau →(3)→ Đại Chuỳ (VERT_C7) = 18 thốn.
 * Cung được lấy từ ĐƯỜNG BAO da trên mặt phẳng dọc giữa (|x|<0,010), sắp theo góc cực quanh tâm đầu
 * rồi cắt lấy đoạn Ấn Đường → đỉnh → gáy: dài 50,4cm ⇒ 1 THỐN DỌC ĐẦU = 0,01628 (2,80cm).
 * (Đối chiếu: thốn ngang đầu 0,0101 = 1,74cm — hai con số KHÁC NHAU là ĐÚNG chuẩn WHO, vì đầu có
 *  骨度 dọc và ngang riêng biệt; thốn đồng-thân 1/75 = 2,29cm nằm giữa hai giá trị.)
 * ĐIỂM CẦN SOÁT MẮT: Bách Hội (8 thốn) rơi ở y=0,9890 z=-0,0519, tức hơi LỆCH SAU đỉnh sọ — đúng
 * chiều nhưng có thể hơi quá; nguyên nhân là "chân tóc trước" trên mesh trọc rất khó xác định.       */
const HEAD_ARC_CUN = 0.01628;   // 1 thốn dọc đầu (chuẩn-hoá theo chiều cao mesh)
const HEAD_ARC_STEP = 0.5;      // bước thốn giữa 2 điểm liên tiếp trong bảng dưới
const HEAD_ARC = [ // [y, z] tại 0; 0,5; 1; … 18 thốn tính từ Ấn Đường, đi qua đỉnh đầu ra gáy
  [0.9500, 0.0487], [0.9577, 0.0467], [0.9655, 0.0446], [0.9725, 0.0414], [0.9793, 0.0369],
  [0.9854, 0.0316], [0.9907, 0.0255], [0.9944, 0.0184], [0.9974, 0.0109], [0.9992, 0.0030],
  [0.9995, -0.0051], [0.9997, -0.0132], [0.9994, -0.0214], [0.9977, -0.0293], [0.9959, -0.0372],
  [0.9932, -0.0449], [0.9890, -0.0519], [0.9837, -0.0580], [0.9774, -0.0631], [0.9703, -0.0670],
  [0.9626, -0.0696], [0.9547, -0.0712], [0.9470, -0.0725], [0.9390, -0.0710], [0.9312, -0.0687],
  [0.9242, -0.0647], [0.9171, -0.0610], [0.9102, -0.0568], [0.9033, -0.0529], [0.8959, -0.0495],
  [0.8895, -0.0486], [0.8814, -0.0487], [0.8732, -0.0487], [0.8653, -0.0501], [0.8573, -0.0494],
  [0.8493, -0.0478], [0.8413, -0.0462],
];
const HEAD_ARC_MAX = (HEAD_ARC.length - 1) * HEAD_ARC_STEP;   // = 18 thốn
const HEAD_ARC_VERTEX_CUN = 5.5;                              // đỉnh sọ nằm ở ~5,5 thốn trên cung

/* THANG THỐN TRÊN CUNG KHÔNG ĐỀU — neo tại BÁCH HỘI.
 *
 * Bản đầu chia đều 18 thốn dọc cả cung (2,76cm/thốn). Sai. Ảnh sách cho mốc dứt khoát: Bách Hội là
 * GIAO của đường giữa với ĐƯỜNG NỐI HAI ĐỈNH TAI — dựng theo mốc đó thì nó rơi ở 15,5cm dọc cung
 * (31%), tức ngay đỉnh sọ; còn thang chia đều đẩy nó tới 8 thốn = 44%, lệch ra sau đỉnh 6,6cm.
 *
 * Neo lại bằng ba mốc ĐO ĐƯỢC: Ấn Đường (0 thốn, 0%) · Bách Hội (8 thốn, 31.2%) · C7 (18 thốn, 100%).
 * Hai đoạn ra tỉ lệ rất khác nhau — 1,94 và 3,42 cm/thốn. Chênh lệch đó là THẬT theo nghĩa: cốt độ
 * cổ điển vốn không đo dọc bề mặt cong, nên áp thẳng chiều dài cung là sai ngay từ giả định. Neo ba
 * mốc thì ít nhất ba chỗ đó đúng, và sai số trong mỗi đoạn bị kẹp giữa hai đầu đúng.
 *
 * Muốn tốt hơn nữa thì cần mốc chân tóc thật — mesh này trọc nên không xác định được. */
const HEAD_ARC_NEO = [[0, 0], [8, 0.31180], [18, 1]];   // [thốn, tỉ lệ chiều dài cung]
const _ARC_CUM = (() => { const c = [0];
  for (let i = 1; i < HEAD_ARC.length; i++) c.push(c[i - 1] + Math.hypot(HEAD_ARC[i][0] - HEAD_ARC[i - 1][0], HEAD_ARC[i][1] - HEAD_ARC[i - 1][1]));
  return c; })();
/** Toạ độ (y,z) tại vị trí `cun` thốn trên cung; kẹp trong [0, 18] nên KHÔNG BAO GIỜ vượt khỏi sọ. */
function headArcAt(cun) {
  const c = Math.max(0, Math.min(HEAD_ARC_MAX, cun));
  let fr = 1;
  for (let i = 1; i < HEAD_ARC_NEO.length; i++) {
    const [c0, f0] = HEAD_ARC_NEO[i - 1], [c1, f1] = HEAD_ARC_NEO[i];
    if (c <= c1) { fr = f0 + (c - c0) / (c1 - c0) * (f1 - f0); break; }
  }
  const L = _ARC_CUM[_ARC_CUM.length - 1], s = fr * L;
  let i = 1; while (i < _ARC_CUM.length - 1 && _ARC_CUM[i] < s) i++;
  const t = _ARC_CUM[i] - _ARC_CUM[i - 1] > 0 ? (s - _ARC_CUM[i - 1]) / (_ARC_CUM[i] - _ARC_CUM[i - 1]) : 0;
  const a = HEAD_ARC[i - 1], b = HEAD_ARC[i];
  return { y: a[0] + t * (b[0] - a[0]), z: a[1] + t * (b[1] - a[1]) };
}
/** Ngược lại: một điểm (y,z) đang ở khoảng bao nhiêu thốn trên cung (điểm gần nhất). */
function headArcCunOf(y, z) {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < HEAD_ARC.length; i++) {
    const d = (HEAD_ARC[i][0] - y) ** 2 + (HEAD_ARC[i][1] - z) ** 2;
    if (d < bd) { bd = d; bi = i; }
  }
  const fr = _ARC_CUM[bi] / _ARC_CUM[_ARC_CUM.length - 1];   // dùng CÙNG thang neo với headArcAt
  for (let i = 1; i < HEAD_ARC_NEO.length; i++) {
    const [c0, f0] = HEAD_ARC_NEO[i - 1], [c1, f1] = HEAD_ARC_NEO[i];
    if (fr <= f1) return c0 + (fr - f0) / (f1 - f0) * (c1 - c0);
  }
  return HEAD_ARC_MAX;
}
/** Mốc nào bước dọc theo CUNG thay vì theo đường thẳng. */
const HEAD_ARC_LM = new Set(['GLABELLA', 'HAIRLINE_ANT', 'HAIRLINE_POST', 'VERTEX']);

// --------- TRỤC CỐT-ĐỘ  (đoạn xương: 2 mốc + chiều dài thốn chuẩn WHO) — GIỮ NGUYÊN logic gốc ---------
const AXES = {
  forearm:    { near: 'WRIST',        far: 'CUBITAL',      cun: 12 },
  upperarm:   { near: 'CUBITAL',      far: 'AXILLA_ANT',   cun: 9  },
  leg_lower:  { near: 'MALLEOLUS_LAT',far: 'KNEE_EYE_LAT', cun: 16 }, // NGOÀI (ST/GB) — WHO: mắt cá ngoài–mắt gối ngoài
  leg_lower_b:{ near: 'MALLEOLUS_LAT',far: 'POPLITEAL',    cun: 16 },
  leg_lower_medial: { near: 'MALLEOLUS_MED', far: 'TIBIA_MED_CONDYLE', cun: 13 }, // TRONG (SP/KI/LR) — WHO: mắt cá trong–lồi cầu trong xương chầy
  thigh:      { near: 'KNEE_EYE_LAT', far: 'HIP_ANT',      cun: 18 }, // fallback cũ (ASIS) — giữ cho văn bản chỉ nói "nếp bẹn" chung chung
  thigh_lateral: { near: 'POPLITEAL', far: 'GREATER_TROCHANTER', cun: 19 }, // NGOÀI (ST/GB) — WHO: mấu chuyển lớn–nếp kheo
  thigh_medial:  { near: 'FEMUR_MED_EPICONDYLE', far: 'PUBIS', cun: 18 }, // TRONG (SP/LR) — WHO: xương mu–lồi cầu trong xương đùi
  abd_upper:  { near: 'NAVEL',        far: 'XIPHOID',      cun: 8  },
  abd_lower:  { near: 'NAVEL',        far: 'PUBIS',        cun: 5  },
  chest_up:   { near: 'XIPHOID',      far: 'STERNUM_TOP',  cun: 9  },
};

const LAT_CUN = {
  // torso: từ NIPPLE.x đã sửa (0.0735/4). SỬA LẦN 2: giá trị 0.0312 trước đó bị lỗi quên chia BODY_H=1.7
  // (0.1249 world-scale dùng thẳng làm chuẩn-hoá) — phát hiện bởi kinhlacc-61 qua tầng khe mô, đối chiếu
  // độc lập bằng bề rộng xương sườn thật trên mesh (0.1249×171.9cm=21.5cm > cả bề ngang lồng ngực).
  /* torso: SỬA 0,0184 → 0,0111 (3,16 → 1,90 cm/thốn). Đây là lần thứ TƯ hằng số thốn ngang sai, và
   * lần đầu sai theo hướng QUÁ LỚN. Gốc: nó suy từ NIPPLE.x/4, mà đầu vú lại đặt sai chỗ.
   * BA phép kiểm chéo độc lập đều bác giá trị cũ:
   *  (1) đầu vú theo định nghĩa nằm trên ĐƯỜNG GIỮA ĐÒN — trung điểm xương đòn ở x=7,6cm, không phải
   *      12,6cm; 7,6/4 = 1,90cm/thốn;
   *  (2) MÂU THUẪN NỘI TẠI của chính dữ liệu: ST12 Khuyết Bồn cũng là 4 thốn ngang, mốc đã có ở
   *      x=7,7cm → 1,93cm/thốn. Hai huyệt cùng 4 thốn mà đặt cách nhau 5cm;
   *  (3) kinh Thận đoạn ngực cách đường giữa 2 thốn, phải nằm SÁT NGOÀI mép thân xương ức (nửa bề
   *      ngang 2,4cm). Với 1,90 ra 3,8cm — sát mép ✔; với 3,16 ra 6,3cm — văng ra tận sườn ✗.
   * Đối chiếu thốn đồng-thân 1/75 = 2,29cm: giá trị mới nhỏ hơn 17%, giá trị cũ lớn hơn 38%. */
  torso: 0.0111,
  arm:   0.011,
  leg:   0.013,
  /* head: SỬA LẦN 2 — 0,0101 → 0,00827 (1,74 → 1,42 cm/thốn). Cả HAI phép đo sinh ra 0,0101 đều hỏng:
   *  (a) "bề ngang đầu mức chân tóc góc trán 15,8cm ÷ 9" lấy chỗ RỘNG NHẤT của sọ ở cao độ đó, không
   *      phải góc chân tóc; mốc Đầu Duy ST8 đã cắm tay lại ở x=6,39cm → 2×6,39 = 12,8cm ÷ 9 = 1,42;
   *  (b) "2 đồng tử 5,2cm ÷ 3 thốn" sai cả tử số lẫn mẫu số: đồng tử cũ đặt lệch vào trong 0,6cm
   *      (xem PUPIL), và WHO quy đường dọc đồng tử là 2,25 thốn mỗi bên (= 4,5 thốn cả hai), không phải 3.
   * Giá trị mới nhất quán với BA mốc độc lập: ST8 = 4,5 thốn ✔; đồng tử = 2,25 thốn ✔ (3,19 vs 3,20cm
   * đo từ đầu dây thần kinh thị giác); hai đồng tử ra 6,4cm — đúng khoảng người trưởng thành 1m72.
   * Đây là lần thứ NĂM một hằng số thốn sai; xem thêm ghi chú torso ở trên. */
  head:  0.00827,
  // back: ĐO từ bờ trong xương bả vai mức giữa (T3-T7) / 3 — khớp quy ước WHO "3 thốn = bờ trong
  // xương bả vai" cho đường BQ ngoài (BL41+); "1,5 thốn" (BL11-30) = nửa quãng đó. KHÔNG dùng chung
  // với torso (mặt trước) — 2 vùng đo theo 2 chu vi khác nhau, tỉ lệ thốn/cm khác nhau theo đúng WHO.
  back:  0.0112,
};

function pickAxis(anchorId, dir) {
  if (anchorId === 'NAVEL' || anchorId === 'MIDLINE_ABD') {
    if (dir === 'up') return { axis: 'abd_upper', from: 'NAVEL' };
    return { axis: 'abd_lower', from: 'NAVEL' };
  }
  // PUBIS: lên = về rốn (abd_lower); xuống = về đùi TRONG (thigh_medial, WHO: xương mu–lồi cầu trong xương đùi)
  if (anchorId === 'PUBIS') return dir === 'down'
    ? { axis: 'thigh_medial', from: 'PUBIS' } : { axis: 'abd_lower', from: 'PUBIS' };
  if (anchorId === 'XIPHOID') return { axis: 'abd_upper', from: 'XIPHOID' };
  if (anchorId === 'WRIST')   return { axis: 'forearm', from: 'WRIST' };
  if (anchorId === 'CUBITAL') return dir === 'up'
    ? { axis: 'upperarm', from: 'CUBITAL' } : { axis: 'forearm', from: 'CUBITAL' };
  if (anchorId === 'AXILLA_ANT' || anchorId === 'AXILLA_POST')
    return { axis: 'upperarm', from: 'AXILLA_ANT' };
  // mắt cá NGOÀI (ST/GB) và TRONG (SP/KI/LR) — WHO dùng 2 trục KHÁC NHAU (16 vs 13 thốn), không dùng chung
  if (anchorId === 'MALLEOLUS_LAT') return { axis: 'leg_lower', from: 'MALLEOLUS_LAT' };
  if (anchorId === 'MALLEOLUS_MED') return { axis: 'leg_lower_medial', from: 'MALLEOLUS_MED' };
  // POPLITEAL (nếp kheo, mặt SAU): lên = đùi NGOÀI-SAU (thigh_lateral, GB/BL), xuống = cẳng chân theo
  // trục leg_lower_b (từ nếp kheo, 16 thốn) — TRƯỚC ĐÂY bị gộp chung với KNEE_EYE_LAT vào trục 'thigh'
  // (ASIS–mắt gối, đường TRƯỚC): sai hướng nội suy cho GB31/32 dù mốc gốc (POPLITEAL) đúng — phát hiện
  // qua audit khe mô độc lập (kinhlacc-94), cùng đợt với lỗi mốc GREATER_TROCHANTER ở trên.
  if (anchorId === 'POPLITEAL')
    return dir === 'up'
      ? { axis: 'thigh_lateral', from: 'POPLITEAL' } : { axis: 'leg_lower_b', from: 'POPLITEAL' };
  if (anchorId === 'KNEE_EYE_LAT' || anchorId === 'PATELLA')
    return dir === 'up'
      ? { axis: 'thigh', from: anchorId }
      : { axis: 'leg_lower', from: anchorId === 'PATELLA' ? 'KNEE_EYE_LAT' : anchorId };
  // lồi cầu trong xương chầy/đùi (SP9 vùng gối trong) — lên = đùi TRONG, xuống = cẳng chân TRONG
  if (anchorId === 'TIBIA_MED_CONDYLE' || anchorId === 'FEMUR_MED_EPICONDYLE')
    return dir === 'up'
      ? { axis: 'thigh_medial', from: 'FEMUR_MED_EPICONDYLE' }
      : { axis: 'leg_lower_medial', from: 'MALLEOLUS_MED' };
  // mấu chuyển lớn xương đùi (ST/GB vùng hông-đùi) — WHO: trục đùi NGOÀI 19 thốn tới nếp kheo
  if (anchorId === 'GREATER_TROCHANTER') return { axis: 'thigh_lateral', from: 'GREATER_TROCHANTER' };
  if (anchorId === 'HIP_ANT') return { axis: 'thigh', from: 'HIP_ANT' };
  return null;
}

function lateralRegion(anchorId) {
  if (/^VERT_/.test(anchorId)) return 'back'; // đốt sống — dùng LAT_CUN.back riêng (WHO: bờ trong xương bả vai = 3 thốn)
  if (/WRIST|CUBITAL|AXILLA|OLECRANON|ACROMION/.test(anchorId)) return 'arm';
  if (/KNEE|MALLEOLUS|POPLITEAL|HIP|PATELLA|TROCHANTER|FEMUR|TIBIA|CALCANEUS/.test(anchorId)) return 'leg';
  if (/PUPIL|MOUTH|HAIRLINE|GLABELLA|VERTEX|MENTON/.test(anchorId)) return 'head';
  return 'torso';
}

const MIDLINE = new Set(['MIDLINE_CHEST', 'MIDLINE_ABD', 'NAVEL', 'PUBIS', 'XIPHOID',
  'STERNUM', 'STERNUM_TOP', 'LARYNX', 'MENTON', 'GLABELLA', 'VERTEX', 'HAIRLINE_ANT', 'HAIRLINE_POST']);
const isMidline = id => MIDLINE.has(id) || /^VERT_/.test(id || '') || /^(CV|GV)\d+$/.test(id || '');

module.exports = { L, AXES, LAT_CUN, pickAxis, lateralRegion, isMidline,
  HEAD_ARC, HEAD_ARC_CUN, HEAD_ARC_STEP, HEAD_ARC_MAX, HEAD_ARC_VERTEX_CUN, HEAD_ARC_LM, headArcAt, headArcCunOf };
