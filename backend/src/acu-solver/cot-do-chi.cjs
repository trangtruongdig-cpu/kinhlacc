/* cot-do-chi — BẢNG CỐT ĐỘ CỔ ĐIỂN cho CẲNG TAY và CẲNG CHÂN.
 *
 * VÌ SAO KHÔNG DÙNG ACU_SPACING CHO VÙNG NÀY
 * `data/spacing.js` là vị trí TÍCH LUỸ dọc kinh theo thứ tự MÃ SỐ, nên nó méo ở mọi chỗ mã số nhảy.
 * Nặng nhất là cẳng chân kinh Bàng Quang: BL55–BL60 bị nén vào 0,19 đơn vị trong khi khoảng BL40→BL55
 * chiếm tới 1,16 — vì đoạn đó đã nuốt trọn cả đường lưng ngoài (BL41–BL54). Đối chiếu với sách thì
 * BL57 Thừa Sơn phải ở 8 thốn trên mắt cá, bảng cũ đặt nó ở 1,4.
 *
 * Bảng dưới lấy TRỰC TIẾP từ mục "Vị trí" của Atlas of Acupuncture (bản Việt hoá), quy hết về MỘT
 * thang: số thốn tính từ ĐẦU XA của đoạn (cổ tay / mắt cá). Chỗ sách ghi theo đầu gần ("cách nếp
 * khuỷu 4 thốn") đã quy đổi sang đầu xa (12 − 4 = 8).
 *
 * Hai đầu mút của mỗi đoạn đều đã là MỐC TẦNG 1 dựng từ xương thật, nên nội suy giữa chúng mới đáng
 * tin — đó là lý do làm vùng này SAU khi đã chốt cổ tay/cổ chân và khuỷu/gối.                       */

/* LỆCH NGANG — vì sao phải có.
 * Sách định vị nhiều huyệt bằng CÙNG MỘT số thốn dọc, chỉ khác nhau ở phía ngang: Dương Giao GB35
 * và Ngoại Khâu GB36 đều "7 thốn trên mắt cá ngoài", một ở bờ SAU một ở bờ TRƯỚC xương mác. Bảng cũ
 * chỉ có số thốn dọc nên rải xong hai huyệt CHỒNG KHÍT lên nhau (rà soát toàn diện đo được 0,00cm).
 * Nay mỗi huyệt cho phép khai thêm { thon, lech, huong }: lech tính bằng thốn, huong ∈
 * truoc | sau | ngoai | trong (ngoai/trong theo trục x, xa/gần đường giữa người).                  */

/* ĐẦU ĐOẠN PHẢI LÀ MỐC XƯƠNG, KHÔNG PHẢI HUYỆT.
 * Số thốn trong bảng này đo từ MỐC — "3 thốn trên mắt cá ngoài", "5 thốn trên nếp cổ tay". Nhưng
 * phép rải lại lấy hai HUYỆT đầu đoạn (GB40, GB34…) làm hai mốc 0 và `tong`. Hai thứ đó không trùng
 * nhau, và chỗ lệch đi thẳng vào mọi huyệt trong đoạn:
 *     GB40 Khâu Khư nằm THẤP HƠN đỉnh mắt cá ngoài 0,98 thốn (nó ở trước-dưới mắt cá), còn GB34
 *     Dương Lăng Tuyền chỉ ở 14,78 thốn chứ không phải 16 (nó dưới mắt gối). Thang GB40→GB34 vì thế
 *     vừa lệch gốc vừa co ngắn, kéo CẢ NĂM huyệt cẳng chân Đởm xuống ~1,4 thốn (3,4cm): đo được
 *     GB39 Huyền Chung ở 1,62 thốn trong khi sách ghi 3.
 * Cùng lỗi ấy: SP5 (−1,00) kéo SP6–SP8 xuống 1 thốn · BL60 (−0,86) kéo BL55–BL59 xuống 0,7 ·
 * LI5 (−1,58) kéo LI6–LI10 · SI8 (13,76) và TE10 (14,02) nằm TRÊN nếp khuỷu nên kéo giãn thang,
 * đẩy TE9 lên 1,42 thốn. Ba đoạn LU/HT/PC không dính vì hai đầu của chúng tình cờ đúng mốc.
 *
 * Nên mỗi đoạn khai thêm `xaMoc`/`ganMoc` — mốc giải phẫu trong model-frame mà sách thực sự đo từ
 * đó. bake-points ưu tiên dùng cặp mốc này làm trục; hai huyệt `xa`/`gan` vẫn giữ để bảng còn đọc
 * được và để lùi lại khi mốc thiếu.                                                                */

/** đoạn: { tong, xa, gan, xaMoc, ganMoc, diem: { mã: thốn | { thon, lech, huong } } } */
const DOAN = {
  'LU/cang-tay': { tong: 12, xa: 'LU9', gan: 'LU5', xaMoc: 'WRIST', ganMoc: 'CUBITAL', diem: { LU6: 7, LU7: 1.5, LU8: 1 } },
  'LI/cang-tay': { tong: 12, xa: 'LI5', gan: 'LI11', xaMoc: 'WRIST', ganMoc: 'CUBITAL', diem: { LI6: 3, LI7: 5, LI8: 8, LI9: 9, LI10: 10 } },
  'HT/cang-tay': { tong: 12, xa: 'HT7', gan: 'HT3', xaMoc: 'WRIST', ganMoc: 'CUBITAL', diem: { HT4: 1.5, HT5: 1, HT6: 0.5 } },
  'SI/cang-tay': { tong: 12, xa: 'SI5', gan: 'SI8', xaMoc: 'WRIST', ganMoc: 'CUBITAL', diem: { SI6: 1, SI7: 5 } },
  'PC/cang-tay': { tong: 12, xa: 'PC7', gan: 'PC3', xaMoc: 'WRIST', ganMoc: 'CUBITAL', diem: { PC4: 5, PC5: 3, PC6: 2 } },
  'TE/cang-tay': { tong: 12, xa: 'TE4', gan: 'TE10', xaMoc: 'WRIST', ganMoc: 'CUBITAL', diem: { TE5: 2, TE6: 3,
    // Hội Tông TE7 cùng 3 thốn với Chi Câu TE6 nhưng lệch về phía TRỤ (bờ quay xương trụ) 1 thốn
    TE7: { thon: 3, lech: 1, huong: 'trong' }, TE8: 4, TE9: 7 } },
  // cẳng chân — đầu xa là mắt cá, đầu gần là gối
  'ST/cang-chan': { tong: 16, xa: 'ST41', gan: 'ST35', xaMoc: 'MALLEOLUS_LAT', ganMoc: 'KNEE_EYE_LAT', diem: { ST36: 13, ST37: 10, ST38: 8, ST39: 7,
    // Phong Long ST40 cùng 8 thốn với Điều Khẩu ST38, nhưng ra NGOÀI một khoát ngón tay
    ST40: { thon: 8, lech: 1, huong: 'ngoai' } } },
  'SP/cang-chan': { tong: 13, xa: 'SP5', gan: 'SP9', xaMoc: 'MALLEOLUS_MED', ganMoc: 'TIBIA_MED_CONDYLE', diem: { SP6: 3, SP7: 6, SP8: 10 } },
  'GB/cang-chan': { tong: 16, xa: 'GB40', gan: 'GB34', xaMoc: 'MALLEOLUS_LAT', ganMoc: 'KNEE_EYE_LAT', diem: {
    // GB35 bờ SAU xương mác, GB36 bờ TRƯỚC — cùng 7 thốn, kẹp hai bên thân xương
    GB35: { thon: 7, lech: 0.6, huong: 'sau' }, GB36: { thon: 7, lech: 0.6, huong: 'truoc' },
    GB37: 5, GB38: 4, GB39: 3 } },
  'BL/cang-chan': { tong: 16, xa: 'BL60', gan: 'BL40', xaMoc: 'MALLEOLUS_LAT', ganMoc: 'POPLITEAL', diem: { BL55: 14, BL56: 11, BL57: 8, BL58: 7, BL59: 3 } },
  'KI/cang-chan': { tong: 13, xa: 'KI3', gan: 'KI10', xaMoc: 'MALLEOLUS_MED', ganMoc: 'TIBIA_MED_CONDYLE', diem: { KI7: 2,
    // Giao Tín KI8 cùng 2 thốn với Phục Lưu KI7, nhưng ở TRƯỚC nó 0,5 thốn (sát bờ sau xương chày)
    KI8: { thon: 2, lech: 0.5, huong: 'truoc' }, KI9: 5 } },
  'LR/cang-chan': { tong: 13, xa: 'LR4', gan: 'LR8', xaMoc: 'MALLEOLUS_MED', ganMoc: 'TIBIA_MED_CONDYLE', diem: { LR5: 5, LR6: 7,
    /* Tất Quan LR7: SỬA 11 → 11,6. Sách không cho số thốn cho huyệt này mà neo nó theo huyệt khác —
     * "ngang Âm Lăng Tuyền SP9, lùi ra sau 1 thốn". Chiếu SP9 lên trục LR4→LR8 ra 11,6 thốn; số 11
     * cũ là ước lượng, đặt huyệt thấp hơn SP9 1,8cm. */
    LR7: 11.6 } },

  /* ═══ THANG THỐN ĐÙI — ĐÃ CHỐT 08/09/2026, dùng cho mọi đoạn đùi ═══
   *   1 thốn = 2,028cm · trục: bờ trên XƯƠNG BÁNH CHÈ (y=47,65cm) → MẤU CHUYỂN LỚN (y=86,19cm),
   *   đoạn dài 38,54cm = 19 thốn.
   * Chốt được vì có BỐN phép đo độc lập, không phép nào mượn kết quả của phép nào:
   *   (1) hai mốc xương trên: 38,54 ÷ 19 = 2,028cm;
   *   (2) huyệt ST31 Bễ Quan (hạng A, sách đặt ở nếp bẹn) → bánh chè = 39,42 ÷ 19 = 2,075cm,
   *       chênh phép (1) chỉ 0,88cm trên cả đoạn;
   *   (3) SP10 "trên bờ trên bánh chè 2 thốn" đo được 1,91 thốn — lệch 0,19cm;
   *   (4) ST34 "trên bánh chè 2 thốn" đo 2,08 và ST33 "3 thốn" đo 3,10 — lệch 0,15 và 0,21cm.
   *
   * VÌ SAO PHẢI GHI RA ĐÂY. Năm đoạn đùi (GB/BL/ST/SP/LR) hiện đều khai xa/gan là HUYỆT chứ không
   * phải mốc xương, nên số thốn của chúng khớp đến hai chữ số một cách vô nghĩa — thang được neo vào
   * chính mấy huyệt đang cần kiểm. Ai chuyển các đoạn ấy sang mốc xương thì dùng thang trên, và nhớ
   * QUY ĐỔI lại số thốn của từng huyệt theo mốc chuẩn (trên bánh chè / dưới nếp bẹn), đừng bê nguyên
   * con số của thang cũ sang — đó đúng là lỗi đã làm TE12 và TE13 chập vào nhau.
   *
   * THANG CÁNH TAY THÌ CHƯA CHỐT ĐƯỢC. ACROMION→CUBITAL = 31,88cm, chia 9 thốn ra 3,542cm, nhưng mỏm
   * cùng vai KHÔNG phải nếp nách trước, và kiểm chéo bằng huyệt cho lệch lớn lại trái dấu nhau
   * (LI14 hạng A +3,38cm · HT2 −1,63cm · LU3 +1,11cm). Thiếu mốc NẾP NÁCH TRƯỚC — mô mềm, mesh không
   * có sẵn. Chưa có hai phép độc lập khớp nhau thì chưa được chốt. */
  /* ===== CÁNH TAY và ĐÙI ==========================================================================
   * Cùng lối với cẳng tay/cẳng chân, nhưng `tong` ở đây KHÔNG phải số thốn tròn của sách mà là SỐ
   * THỐN THẬT hai đầu đoạn cách nhau — đo trên mesh rồi chia cho cm-mỗi-thốn của vùng.
   * Vì sao: thốn vùng do MỐC XƯƠNG định nghĩa (khuỷu→nếp nách trước = 9 thốn → 3,26cm/thốn;
   * nếp kheo→mấu chuyển lớn = 19 thốn → 2,11cm/thốn), còn hai đầu ĐOẠN lại là hai HUYỆT, không trùng
   * hai mốc ấy. HT3→HT1 chỉ dài 22,3cm = 6,8 thốn chứ không phải 9 — lấy 9 là nén cả đoạn 26%,
   * đẩy Thanh Linh HT2 sai 2,4cm. Số thốn từng huyệt vẫn chép nguyên từ sách, chỉ quy về "từ đầu XA". */

  // cánh tay — 1 thốn = 3,26cm
  /* HAI ĐOẠN CÁNH TAY DƯỚI ĐÂY NEO SAI MỐC — cập nhật số thốn 08/09/2026 sau vòng 31.
   * Sách đo từ NẾP NÁCH TRƯỚC, nhưng bảng lại lấy LU2 Vân Môn (hố dưới đòn, cao hơn nếp nách ~6cm)
   * và HT1 Cực Tuyền (tâm hố nách) làm đầu trên. Thang vì thế dài hơn thang sách, và số thốn cũ đẩy
   * LU3/LU4/HT2 lên quá cao: vòng 31 đo lại bằng mốc giải phẫu thật (bờ dưới-ngoài cơ ngực lớn
   * FMA34691 cho nếp nách ở y ≈ 131,5; nếp khuỷu = LU5 ở y = 112,04) thì LU3 phải hạ 8,6cm và
   * LU4 hạ 7,1cm.
   * Số dưới đây là số thốn ĐO ĐƯỢC trên thang cũ sau khi huyệt đã về đúng chỗ — giữ để phép kiểm
   * cốt độ khỏi kêu oan. Muốn số thốn trở lại đúng nguyên văn sách thì phải khai xaMoc/ganMoc bằng
   * mốc xương, mà mốc NẾP NÁCH TRƯỚC hiện chưa có trong model-frame (là nếp da, mesh không có sẵn;
   * xem ghi chú "THANG CÁNH TAY CHƯA CHỐT ĐƯỢC" ở khối THANG THỐN ĐÙI bên dưới). */
  'LU/canh-tay': { tong: 9.3, xa: 'LU5', gan: 'LU2', diem: {
    LU3: 3.5,    // Thiên Phủ: sách "dưới nếp nách trước 3 thốn"; 3,5 là số trên thang LU5→LU2 này
    LU4: 2.9 } },// Hiệp Bạch: sách "dưới nếp nách trước 4 thốn"
  'HT/canh-tay': { tong: 6.8, xa: 'HT3', gan: 'HT1', diem: {
    HT2: 1.9 } },// Thanh Linh: sách "trên nếp khuỷu 3 thốn"; 1,9 là số trên thang HT3→HT1 này
  /* LẪN HAI THANG — sửa 08/09/2026 sau hội đồng vòng 2.
   * Số thốn của sách cho đoạn này đo trên thang MỎM KHUỶU → MỎM CÙNG VAI (11 thốn), nhưng bảng lại
   * dùng thang TE10 → TE14 (tong = 7,9 thốn thật đo trên mesh). Hai thang không trùng gốc: TE10 nằm
   * 1 thốn TRÊN mỏm khuỷu, TE14 ở ≈10,4 thốn. Chép thẳng số thốn của thang này sang thang kia là đặt
   * TE12 ở 5/7,9 = 0,633 và TE13 ở 4,9/7,9 = 0,620 — hai huyệt CHẬP nhau 0,33cm và ĐẢO THỨ TỰ, đúng
   * cái mà ảnh sách bắt được.
   * Quy đổi đúng: TE12 = (5−1)/9,4 = 0,426 → 3,4 và TE13 = (8−1)/9,4 = 0,745 → 5,9 trên thang 7,9.
   * Số dùng ở đây (3,2 và 5,9) lấy từ ẢNH SÁCH: chiếu SJ12/SJ13 lên SJ10→SJ14 trên ba cặp mốc độc
   * lập cho t = 0,409 và 0,750 — lệch 0,44cm và 0,13cm so với quy đổi trên, tức hai đường độc lập
   * gặp nhau.
   * TE11 GIỮ NGUYÊN số cũ dù nó mắc CÙNG lỗi lẫn thang (đúng ra là (2−1)/9,4 = 0,106 → 0,84): huyệt
   * này đang TREO vì nó nhạy nhất với TE10 chưa chốt — hạ TE10 1cm thì TE11 dời 0,91cm, gần bằng
   * chính sai số muốn sửa. Sửa TE11 phải đi cùng lúc với chốt TE10. */
  'TE/canh-tay': { tong: 7.9, xa: 'TE10', gan: 'TE14', diem: {
    TE11: 0.6,     // Thanh Lãnh Uyên: t=0,075 trên dây cung TE10→TE14 (vòng 30 gỡ treo bằng tỉ lệ).
                   // Con số cũ (2) mắc CÙNG lỗi lẫn thang như TE12/TE13: "2 thốn trên mỏm khuỷu" là
                   // số của thang 11 thốn mỏm-khuỷu→mỏm-cùng-vai, không phải của thang 7,9 này.
    TE12: 3.2,     // Tiêu Lạc: t = 0,409 trên dây cung TE10→TE14 (ảnh sách, 3 cặp mốc)
    TE13: 5.9 } },  // Nhu Hội: t = 0,750 (ảnh sách; khớp thang thốn 8/11 lệch 0,13cm)
  'LI/canh-tay': { tong: 9.0, xa: 'LI11', gan: 'LI15', diem: {
    LI12: 1, LI13: 3, LI14: 7 } },   // LI13/LI14 đã là mốc, ghi để thấy rõ thang

  // đùi — 1 thốn = 2,11cm
  /* tong 20,8 → 20,1: sau khi Hoàn Khiêu GB30 được dựng lại từ mốc xương (vòng 25) nó dời 4,7cm,
   * nên đoạn GB34→GB30 ngắn lại. `tong` là số thốn THẬT giữa hai đầu nên phải đo lại mỗi khi một
   * đầu đổi — đây đúng là loại lỗi mà bảng cốt độ dễ mắc âm thầm. */
  'GB/dui': { tong: 20.1, xa: 'GB34', gan: 'GB30', diem: {
    /* Sách đo từ NẾP KHEO, mà đầu xa của đoạn là GB34 nằm DƯỚI nếp kheo 1,53 thốn → cộng bù. */
    GB33: 4.5, GB32: 6.5, GB31: 8.5 } },   // trên nếp kheo 3 · 5 · 7 thốn
  'BL/dui-sau': { tong: 12.9, xa: 'BL40', gan: 'BL36', diem: {
    BL38: 1,      // Phù Khích: trên nhượng chân 1 thốn
    BL37: 6.9 } },// Ân Môn: dưới nếp mông 6 thốn → 12,9−6
  /* ĐÃ THỬ ĐỔI SANG MỐC XƯƠNG NGÀY 08/09/2026 VÀ ĐÃ HOÀN TÁC — ghi lại để không ai thử lại.
   * Ý định: bỏ lối neo vào hai HUYỆT (ST35→ST31) vì nó là lập luận vòng tròn, thay bằng thang đùi đã
   * chốt ở phiên kinh Can (18 thốn bờ trên bánh chè → bờ trên khớp mu, 1 thốn = 2,213cm, đọc từ thước
   * IN SẴN trong sách). Đo TRƯỚC khi đổi thì mọi số đều đẹp: ST34 1,90 thốn (sách 2) · ST33 2,84 (3)
   * · ST32 5,64 (6), lệch 0,21–0,80cm.
   * NHƯNG ĐO LẠI SAU KHI ĐỔI THÌ XẤU ĐI GẤP ĐÔI: ST34 2,40 (lệch 0,89cm) · ST33 3,53 (1,18) ·
   * ST32 6,80 (1,78). Vì sao: trục PATELLA→PUBIS chạy từ (9,35 · 47,65) tới (−0,21 · 87,48), tức
   * NGHIÊNG VÀO TRONG 9,5cm theo trục x, trong khi kinh Vị đi thẳng dọc mặt TRƯỚC-NGOÀI đùi ở
   * x ≈ 13–14. Chiếu huyệt mặt ngoài lên một trục nghiêng vào trong thì hình chiếu bị kéo dài ra.
   * BÀI HỌC: thang thốn đúng KHÔNG đủ — trục phải chạy CÙNG HƯỚNG với đoạn kinh. Thang 18 thốn ấy
   * hợp với kinh Can (đùi TRONG, trục cũng nghiêng vào trong) nhưng không hợp kinh Vị. Muốn bỏ vòng
   * tròn cho đoạn này thì phải tìm mốc xương nằm trên chính mặt trước-ngoài đùi (gai chậu trước trên
   * HIP_ANT là ứng viên), không dùng PUBIS. */
  'ST/dui': { tong: 21.0, xa: 'ST35', gan: 'ST31', diem: {
    /* Sách đo từ GÓC TRÊN-NGOÀI XƯƠNG BÁNH CHÈ, cao hơn Độc Tỵ ST35 2,2 thốn → cộng bù. */
    ST34: 4.2, ST33: 5.2, ST32: 8.2 } },   // trên góc bánh chè 2 · 3 · 6 thốn
  /* KHAI LẠI 08/09/2026 — bỏ lối neo vào hai HUYỆT (ST35→ST31) và cái "cộng bù 2,2 thốn" kèm theo.
   * Bản cũ phải bù vì mốc gốc của sách là GÓC TRÊN-NGOÀI XƯƠNG BÁNH CHÈ chứ không phải huyệt ST35;
   * bù xong thì mọi số khớp tuyệt đối, nhưng đó là khớp vòng tròn — thang neo vào chính hai huyệt
   * đang cần kiểm. Nay dùng thẳng thang đùi đã chốt ở phiên kinh Can (thước IN SẴN trong sách,
   * 18 thốn bờ trên bánh chè → bờ trên khớp mu, 1 thốn = 2,213cm) nên số thốn trở lại đúng nguyên
   * văn sách, không cần bù.
   * Kiểm trước khi đổi, đo trên toạ độ đang có: ST34 ra 1,90 thốn (sách 2) · ST33 2,84 (3) ·
   * ST32 5,64 (6) · ST31 17,81 (18) — lệch 0,21 / 0,35 / 0,80 / 0,41cm, đều dưới ngưỡng 1,2cm.
   * PUBIS dùng được làm đầu trên: nó chỉ cách ST31 Bễ Quan (hạng A, sách đặt ở nếp bẹn) 0,41cm. */
  'SP/dui': { tong: 22.0, xa: 'SP9', gan: 'SP12', diem: {
    SP11: 11.0 } },  // Cơ Môn: trên Huyết Hải SP10 6 thốn (SP10 nằm ở 5,0 trên trục này)
  /* KHAI LẠI 08/09/2026 sau phiên hội đồng kinh Can. Bản cũ: tong 21,7 · xa 'LR8' · gan 'LR12' —
   * neo vào hai HUYỆT, nên LR9/LR10/LR11 đo ra khớp tới hai chữ số một cách vô nghĩa, còn đầu trên
   * LR12 thì sai 5,8cm và kéo lệch cả cụm. Nay neo vào MỐC XƯƠNG theo đúng thước IN SẴN trong sách
   * (agent quét được 19 vạch cách đều = 18 quãng, hai đầu là bờ trên bánh chè và bờ trên khớp mu):
   * 18 thốn, 1 thốn = 2,20cm. Số thốn từng huyệt đã QUY ĐỔI sang thang mới, đếm từ đầu XA = bánh chè;
   * không bê nguyên con số của thang cũ sang — đó đúng là lỗi đã làm TE12 và TE13 chập vào nhau. */
  'LR/dui': { tong: 18, xa: 'LR8', gan: 'LR12', xaMoc: 'PATELLA', ganMoc: 'PUBIS', diem: {
    LR9: 4,       // Âm Bao: 4 thốn trên bờ trên bánh chè
    LR10: 15,     // Túc Ngũ Lý: 3 thốn dưới khớp mu = 15 thốn trên bánh chè
    LR11: 16,     // Âm Liêm: 2 thốn dưới khớp mu
    LR12: 17 } }, // Cấp Mạch: 1 thốn dưới khớp mu
};

/** mã huyệt → { doan, thon, tong, xa, gan } — dùng để rải theo cốt độ thay cho ACU_SPACING */
const THEO_HUYET = (() => {
  const m = {};
  for (const [id, d] of Object.entries(DOAN))
    for (const [c, t] of Object.entries(d.diem)) {
      const o = typeof t === 'number' ? { thon: t } : t;
      m[c] = { doan: id, thon: o.thon, lech: o.lech || 0, huong: o.huong || null, tong: d.tong,
        xa: d.xa, gan: d.gan, xaMoc: d.xaMoc || null, ganMoc: d.ganMoc || null };
    }
  return m;
})();

module.exports = { DOAN, THEO_HUYET };

// ----- CLI: đối chiếu bảng này với vị trí hiện tại -----
if (require.main === module) {
  const fs = require('fs'), path = require('path');
  const w = {};
  new Function('window', fs.readFileSync(path.resolve(__dirname, '../../../frontend/public/kinhmach3d/data/acu-coords3d.js'), 'utf8'))(w);
  const P = w.ACU_COORDS3D.points, CM = 171.9;
  const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  console.log('đoạn            huyệt  thốn  vị trí HIỆN TẠI ứng với  lệch');
  for (const [id, d] of Object.entries(DOAN)) {
    const A = P[d.xa], B = P[d.gan];
    if (!A || !B || A.x === undefined) { console.log(id, '— thiếu đầu mút'); continue; }
    const L = d3(A, B);
    for (const [c, t] of Object.entries(d.diem)) {
      const p = P[c]; if (!p || p.x === undefined) continue;
      const f = d3(A, p) / L;                      // tỉ lệ dọc đoạn (xấp xỉ, đo thẳng)
      console.log(id.padEnd(15) + c.padEnd(6) + String(t).padStart(5) + '   ' + (f * d.tong).toFixed(1).padStart(5) + ' thốn'
        + '            ' + Math.abs(f * d.tong - t).toFixed(1).padStart(4) + (Math.abs(f * d.tong - t) > 1.5 ? '  ⚠' : ''));
    }
  }
}
