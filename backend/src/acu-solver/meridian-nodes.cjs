/* meridian-nodes — BƯỚC 1 của mô hình ĐƯỜNG KINH: khai báo KHUNG của 14 kinh.
 *
 * VÌ SAO CÓ FILE NÀY
 * Engine hiện giải TỪNG HUYỆT độc lập rồi để frontend nối các chấm bằng spline CatmullRom. Hệ quả:
 * đường kinh không có hình học riêng — nó thừa hưởng mọi sai số của điểm, cắt góc bay ra ngoài da ở
 * chỗ thân cong, và tệ nhất là NỐI NHẦM THỨ TỰ. Đo trên bảng hiện tại: BL40 (giữa nếp kheo, cao 46cm)
 * nối thẳng sang BL41 (lưng trên, cao 146cm) — một đường dài 100cm bay ngang người, chỉ vì mã số liền
 * nhau. Kinh Bàng Quang có HAI đường lưng song song mà cách đánh số nhảy qua nhảy lại giữa chúng.
 *
 * File này khai cái mà trước giờ chưa ai khai: mỗi kinh BẮT ĐẦU ở đâu, KẾT THÚC ở đâu, đi qua những
 * ĐOẠN nào theo thứ tự nào, BẺ GÓC ở đâu, và mỗi đoạn bám RÃNH cơ–xương nào.
 *
 * NĂM LOẠI PHẦN TỬ
 *   dau / cuoi : hai đầu mút. Phần lớn là tỉnh huyệt ở góc móng — neo tuyệt đối vào xương ngón.
 *   moc        : huyệt trùng mốc giải phẫu sờ được (lằn cổ tay, nếp khuỷu, mắt gối, rốn, hõm ức).
 *                Đây là các NÚT BẤT ĐỘNG — đường phải đi qua đúng chúng, không được nội suy trượt qua.
 *   gap        : nơi kinh ĐỔI HƯỚNG (vai, góc hàm, kheo, mắt cá, gáy). Đường phải BẺ ở đây; chính chỗ
 *                này spline hiện tại cắt góc bay ra ngoài da vì nó không biết có góc.
 *   doan       : quãng giữa hai nút. `mo:'hien'` = chạy trên mặt da, có vẽ. `mo:'chim'` = kinh đi
 *                trong sâu (vd Thận từ nếp kheo lên bụng), KHÔNG được vẽ đường thẳng nối hai đầu.
 *
 * TRƯỜNG `ranh` là rãnh giải phẫu mà đoạn bám theo, viết bằng đúng từ vựng của `tissue-lexicon.cjs`
 * để bước 3 (hút đường vào rãnh) tra thẳng được sang khối atlas.
 *
 * TRẠNG THÁI: BẢN NHÁP CHỜ NGƯỜI SOÁT. Thứ tự đoạn và điểm gấp khúc lấy từ đường đi kinh điển; các
 * mốc `at` lấy từ `model-frame.cjs`. Chưa dùng để sinh toạ độ — xem `duong-kinh` ở bước 2.               */

/** Mốc neo cho tỉnh huyệt / huyệt đầu-cuối chưa có trong model-frame (góc móng, đầu ngón). */
const TIP = {
  MONG_NGON_CAI_TAY: 'góc móng ngón cái, mé quay',
  MONG_NGON_TRO: 'góc móng ngón trỏ, mé quay',
  MONG_NGON_GIUA: 'đầu ngón giữa',
  MONG_NGON_NHAN: 'góc móng ngón đeo nhẫn, mé trụ',
  MONG_NGON_UT_TAY: 'góc móng ngón út, mé trụ',
  MONG_NGON_CAI_CHAN: 'góc móng ngón cái chân, mé trong',
  MONG_NGON_2: 'góc móng ngón chân 2, mé ngoài',
  MONG_NGON_4: 'góc móng ngón chân 4, mé ngoài',
  MONG_NGON_UT_CHAN: 'góc móng ngón út chân, mé ngoài',
  GAN_BAN_CHAN: 'gan bàn chân, 1/3 trước',
};

const M = {

  // ══════════ TAY — ba kinh ÂM đi từ ngực ra đầu ngón ══════════

  LU: {
    ten: 'Phế', huong: 'ngực → ngón cái', n: 11,
    doan: [
      { id: 'nguc',     mo: 'hien', vung: 'ngực trên', diem: ['LU1', 'LU2'],
        ranh: 'rãnh delta-ngực, dưới bờ ngoài xương đòn' },
      { id: 'canh-tay', mo: 'hien', vung: 'mặt trước-ngoài cánh tay', diem: ['LU2', 'LU3', 'LU4', 'LU5'],
        ranh: 'bờ ngoài cơ nhị đầu cánh tay' },
      { id: 'cang-tay', mo: 'hien', vung: 'mặt trước-ngoài cẳng tay', diem: ['LU5', 'LU6', 'LU7', 'LU8', 'LU9'],
        ranh: 'bờ ngoài gân cơ gan tay dài, sát bờ trong xương quay, cạnh động mạch quay' },
      { id: 'ban-tay',  mo: 'hien', vung: 'mô cái', diem: ['LU9', 'LU10', 'LU11'],
        ranh: 'ranh da đỏ–trắng bờ ngoài xương bàn ngón 1' },
    ],
    nut: [
      { code: 'LU1', loai: 'dau', at: null, vi_sao: 'Trung Phủ — mộ huyệt Phế, gian sườn 1' },
      { code: 'LU2', loai: 'gap', at: 'CLAVICLE', vi_sao: 'hố dưới đòn — kinh bẻ từ ngực xuống cánh tay, qua nách trước' },
      { code: 'LU5', loai: 'moc', at: 'CUBITAL', vi_sao: 'Xích Trạch — ngay nếp khuỷu' },
      { code: 'LU9', loai: 'moc', at: 'WRIST', vi_sao: 'Thái Uyên — ngay lằn cổ tay, trên động mạch quay' },
      { code: 'LU11', loai: 'cuoi', at: TIP.MONG_NGON_CAI_TAY, vi_sao: 'Thiếu Thương — tỉnh huyệt' },
    ],
  },

  PC: {
    ten: 'Tâm Bào', huong: 'ngực → ngón giữa', n: 9,
    doan: [
      // (bỏ đoạn 'nguc' riêng: nó chỉ có mỗi PC1 nên không dựng được đường — PC1 đã là đầu đoạn cánh tay)
      { id: 'canh-tay', mo: 'hien', vung: 'thành ngực bên → mặt trước cánh tay', diem: ['PC1', 'PC2', 'PC3'],
        ranh: 'rãnh giữa cơ nhị đầu và cơ quạ-cánh tay' },
      { id: 'cang-tay', mo: 'hien', vung: 'giữa mặt trước cẳng tay', diem: ['PC3', 'PC4', 'PC5', 'PC6', 'PC7'],
        ranh: 'giữa gân cơ gan tay dài và gân cơ gấp cổ tay quay' },
      { id: 'ban-tay',  mo: 'hien', vung: 'gan bàn tay', diem: ['PC7', 'PC8', 'PC9'],
        ranh: 'giữa xương bàn ngón 2 và 3' },
    ],
    nut: [
      { code: 'PC1', loai: 'dau', at: 'NIPPLE', vi_sao: 'Thiên Trì — mốc theo đầu vú' },
      { code: 'PC2', loai: 'gap', at: null, vi_sao: 'kinh bẻ từ thành ngực xuống mặt trước cánh tay' },
      { code: 'PC3', loai: 'moc', at: 'CUBITAL', vi_sao: 'Khúc Trạch — nếp khuỷu, bờ trong gân cơ nhị đầu' },
      { code: 'PC7', loai: 'moc', at: 'WRIST', vi_sao: 'Đại Lăng — giữa lằn cổ tay' },
      { code: 'PC9', loai: 'cuoi', at: TIP.MONG_NGON_GIUA, vi_sao: 'Trung Xung — tỉnh huyệt' },
    ],
  },

  HT: {
    ten: 'Tâm', huong: 'nách → ngón út', n: 9,
    doan: [
      { id: 'canh-tay', mo: 'hien', vung: 'mặt trong cánh tay', diem: ['HT1', 'HT2', 'HT3'],
        ranh: 'rãnh bờ trong cơ nhị đầu, cạnh động mạch cánh tay' },
      { id: 'cang-tay', mo: 'hien', vung: 'bờ trong mặt trước cẳng tay', diem: ['HT3', 'HT4', 'HT5', 'HT6', 'HT7'],
        ranh: 'bờ trong gân cơ gấp cổ tay trụ, sát bờ trước xương trụ' },
      { id: 'ban-tay',  mo: 'hien', vung: 'mô út', diem: ['HT7', 'HT8', 'HT9'],
        ranh: 'giữa xương bàn ngón 4 và 5, gan tay' },
    ],
    nut: [
      { code: 'HT1', loai: 'dau', at: 'AXILLA_ANT', vi_sao: 'Cực Tuyền — giữa hõm nách, trên động mạch nách' },
      { code: 'HT3', loai: 'moc', at: 'CUBITAL', vi_sao: 'Thiếu Hải — đầu trong nếp khuỷu' },
      { code: 'HT7', loai: 'moc', at: 'WRIST', vi_sao: 'Thần Môn — lằn cổ tay, bờ ngoài xương đậu' },
      { code: 'HT9', loai: 'cuoi', at: TIP.MONG_NGON_UT_TAY, vi_sao: 'Thiếu Xung — tỉnh huyệt' },
    ],
  },

  // ══════════ TAY — ba kinh DƯƠNG đi từ đầu ngón lên mặt ══════════

  LI: {
    ten: 'Đại Trường', huong: 'ngón trỏ → cánh mũi', n: 20,
    doan: [
      { id: 'ban-tay',  mo: 'hien', vung: 'mu bàn tay, mé quay', diem: ['LI1', 'LI2', 'LI3', 'LI4', 'LI5'],
        ranh: 'giữa xương bàn ngón 1 và 2, rồi hố lào giữa hai gân duỗi ngón cái' },
      { id: 'cang-tay', mo: 'hien', vung: 'mặt sau-ngoài cẳng tay', diem: ['LI5', 'LI6', 'LI7', 'LI8', 'LI9', 'LI10', 'LI11'],
        ranh: 'bờ ngoài xương quay, giữa cơ ngửa dài và cơ duỗi cổ tay quay' },
      { id: 'canh-tay', mo: 'hien', vung: 'mặt ngoài cánh tay', diem: ['LI11', 'LI12', 'LI13', 'LI14', 'LI15'],
        ranh: 'bờ ngoài cơ tam đầu, bờ trước cơ delta' },
      { id: 'vai',      mo: 'hien', vung: 'vai', diem: ['LI15', 'LI16'],
        ranh: 'giữa mỏm cùng vai và gai xương bả vai' },
      { id: 'co',       mo: 'hien', vung: 'cổ bên', diem: ['LI16', 'LI17', 'LI18'],
        ranh: 'bờ sau cơ ức-đòn-chũm' },
      { id: 'mat',      mo: 'hien', vung: 'mặt dưới', diem: ['LI18', 'LI19', 'LI20'],
        ranh: 'rãnh mũi-má, cạnh cánh mũi' },
    ],
    nut: [
      { code: 'LI1', loai: 'dau', at: TIP.MONG_NGON_TRO, vi_sao: 'Thương Dương — tỉnh huyệt' },
      { code: 'LI5', loai: 'moc', at: 'WRIST', vi_sao: 'Dương Khê — hố lào, mỏm trâm quay' },
      { code: 'LI11', loai: 'moc', at: 'CUBITAL', vi_sao: 'Khúc Trì — đầu ngoài nếp khuỷu' },
      { code: 'LI15', loai: 'gap', at: 'ACROMION', vi_sao: 'Kiên Ngung — mỏm cùng vai; kinh bẻ từ cánh tay lên vai' },
      { code: 'LI16', loai: 'gap', at: 'ACROMION', vi_sao: 'Cự Cốt — kinh bẻ từ vai vào cổ' },
      { code: 'LI18', loai: 'gap', at: 'LARYNX', vi_sao: 'Phù Đột — kinh bẻ từ cổ lên mặt' },
      { code: 'LI20', loai: 'cuoi', at: null, vi_sao: 'Nghinh Hương — cạnh cánh mũi' },
    ],
  },

  SI: {
    ten: 'Tiểu Trường', huong: 'ngón út → trước tai', n: 19,
    doan: [
      { id: 'ban-tay',  mo: 'hien', vung: 'mu bàn tay, mé trụ', diem: ['SI1', 'SI2', 'SI3', 'SI4', 'SI5'],
        ranh: 'ranh da đỏ–trắng bờ trong xương bàn ngón 5, rồi khe giữa mỏm trâm trụ và xương tháp' },
      { id: 'cang-tay', mo: 'hien', vung: 'mặt sau-trong cẳng tay', diem: ['SI5', 'SI6', 'SI7', 'SI8'],
        ranh: 'sát bờ sau xương trụ' },
      { id: 'vai',      mo: 'hien', vung: 'vùng bả vai', diem: ['SI8', 'SI9', 'SI10', 'SI11', 'SI12', 'SI13', 'SI14'],
        ranh: 'quanh hố dưới gai và bờ trong xương bả vai' },
      { id: 'co',       mo: 'hien', vung: 'gáy–cổ bên', diem: ['SI14', 'SI15', 'SI16', 'SI17'],
        ranh: 'bờ sau cơ ức-đòn-chũm, sau góc hàm' },
      { id: 'mat',      mo: 'hien', vung: 'mặt bên', diem: ['SI17', 'SI18', 'SI19'],
        ranh: 'bờ dưới xương gò má, trước bình tai' },
    ],
    nut: [
      { code: 'SI1', loai: 'dau', at: TIP.MONG_NGON_UT_TAY, vi_sao: 'Thiếu Trạch — tỉnh huyệt' },
      { code: 'SI5', loai: 'moc', at: 'WRIST', vi_sao: 'Dương Cốc — khe cổ tay mé trụ' },
      { code: 'SI8', loai: 'gap', at: 'OLECRANON', vi_sao: 'Tiểu Hải — rãnh giữa mỏm khuỷu và lồi cầu trong; kinh bẻ lên vai' },
      { code: 'SI10', loai: 'gap', at: 'AXILLA_POST', vi_sao: 'Nhu Du — nếp nách sau; kinh bẻ vào hố dưới gai' },
      { code: 'SI15', loai: 'gap', at: 'VERT_C7', vi_sao: 'Kiên Trung Du — kinh bẻ từ bả vai lên cổ' },
      { code: 'SI19', loai: 'cuoi', at: null, vi_sao: 'Thính Cung — trước bình tai' },
    ],
  },

  TE: {
    ten: 'Tam Tiêu', huong: 'ngón đeo nhẫn → đuôi mày', n: 23,
    doan: [
      { id: 'ban-tay',  mo: 'hien', vung: 'mu bàn tay', diem: ['TE1', 'TE2', 'TE3', 'TE4'],
        ranh: 'khe giữa xương bàn ngón 4 và 5, rồi lằn cổ tay mặt mu' },
      { id: 'cang-tay', mo: 'hien', vung: 'giữa mặt sau cẳng tay', diem: ['TE4', 'TE5', 'TE6', 'TE7', 'TE8', 'TE9', 'TE10'],
        ranh: 'khe gian cốt giữa xương quay và xương trụ, mặt mu' },
      { id: 'canh-tay', mo: 'hien', vung: 'mặt sau cánh tay', diem: ['TE10', 'TE11', 'TE12', 'TE13', 'TE14'],
        ranh: 'giữa hai đầu cơ tam đầu cánh tay' },
      { id: 'vai-co',   mo: 'hien', vung: 'vai sau → gáy', diem: ['TE14', 'TE15', 'TE16'],
        ranh: 'sau mỏm cùng vai, bờ trên gai vai, bờ sau cơ ức-đòn-chũm' },
      { id: 'tai',      mo: 'hien', vung: 'quanh tai', diem: ['TE16', 'TE17', 'TE18', 'TE19', 'TE20', 'TE21', 'TE22', 'TE23'],
        ranh: 'vòng theo bờ sau rồi bờ trên vành tai, sát mỏm chũm' },
    ],
    nut: [
      { code: 'TE1', loai: 'dau', at: TIP.MONG_NGON_NHAN, vi_sao: 'Quan Xung — tỉnh huyệt' },
      { code: 'TE4', loai: 'moc', at: 'WRIST', vi_sao: 'Dương Trì — lằn cổ tay mặt mu' },
      { code: 'TE10', loai: 'moc', at: 'OLECRANON', vi_sao: 'Thiên Tỉnh — trên mỏm khuỷu 1 thốn' },
      { code: 'TE14', loai: 'gap', at: 'ACROMION', vi_sao: 'Kiên Liêu — sau-dưới mỏm cùng vai; kinh bẻ từ cánh tay lên vai' },
      { code: 'TE17', loai: 'gap', at: 'MASTOID', vi_sao: 'Ế Phong — sau dái tai, trước mỏm chũm; kinh bẻ vòng lên quanh tai' },
      { code: 'TE23', loai: 'cuoi', at: null, vi_sao: 'Ty Trúc Không — đuôi lông mày' },
    ],
  },

  // ══════════ CHÂN — ba kinh DƯƠNG đi từ đầu/mặt xuống bàn chân ══════════

  ST: {
    ten: 'Vị', huong: 'dưới mắt → ngón chân 2', n: 45,
    doan: [
      { id: 'mat',      mo: 'hien', vung: 'mặt', diem: ['ST1', 'ST2', 'ST3', 'ST4', 'ST5', 'ST6'],
        ranh: 'trục dọc đồng tử, xuống bờ dưới xương hàm dưới rồi ra góc hàm, trên cơ cắn' },
      { id: 'nhanh-tran', mo: 'hien', vung: 'NHÁNH lên trán', diem: ['ST6', 'ST7', 'ST8'],
        ranh: 'dưới cung gò má lên góc trán chân tóc' },
      { id: 'co',       mo: 'hien', vung: 'cổ trước bên', diem: ['ST6', 'ST9', 'ST10', 'ST11', 'ST12'],
        ranh: 'bờ trước cơ ức-đòn-chũm, cạnh động mạch cảnh, xuống hố trên đòn' },
      { id: 'nguc',     mo: 'hien', vung: 'ngực, đường 4 thốn ngang', diem: ['ST12', 'ST13', 'ST14', 'ST15', 'ST16', 'ST17', 'ST18'],
        ranh: 'trên cơ gian sườn ngoài, thẳng đường đầu vú' },
      { id: 'bung',     mo: 'hien', vung: 'bụng, đường 2 thốn ngang', diem: ['ST19', 'ST20', 'ST21', 'ST22', 'ST23', 'ST24', 'ST25', 'ST26', 'ST27', 'ST28', 'ST29', 'ST30'],
        ranh: 'giữa đường trắng giữa bụng và bờ trong cơ chéo bụng ngoài' },   // atlas KHÔNG dựng cơ thẳng bụng; hai mô này kẹp đúng chỗ nó nằm
      { id: 'dui',      mo: 'hien', vung: 'mặt trước-ngoài đùi', diem: ['ST30', 'ST31', 'ST32', 'ST33', 'ST34', 'ST35'],
        ranh: 'rãnh giữa cơ thẳng đùi và cơ rộng ngoài' },
      { id: 'cang-chan', mo: 'hien', vung: 'mặt trước-ngoài cẳng chân', diem: ['ST35', 'ST36', 'ST37', 'ST38', 'ST39', 'ST40', 'ST41'],
        ranh: 'ngoài mào chày một khoát ngón, trên cơ chày trước' },
      { id: 'ban-chan', mo: 'hien', vung: 'mu bàn chân', diem: ['ST41', 'ST42', 'ST43', 'ST44', 'ST45'],
        ranh: 'khe giữa xương bàn chân 2 và 3, cạnh động mạch mu chân' },
    ],
    nut: [
      { code: 'ST1', loai: 'dau', at: 'PUPIL', vi_sao: 'Thừa Khấp — bờ dưới ổ mắt, trên trục đồng tử' },
      { code: 'ST5', loai: 'gap', at: null, vi_sao: 'Đại Nghênh — bờ dưới xương hàm dưới; kinh tách nhánh lên trán và nhánh xuống cổ' },
      { code: 'ST8', loai: 'cuoi', at: 'HAIRLINE_ANT', vi_sao: 'Đầu Duy — điểm cuối NHÁNH trán, không phải cuối kinh' },
      { code: 'ST12', loai: 'gap', at: 'CLAVICLE', vi_sao: 'Khuyết Bồn — hố trên đòn; kinh bẻ từ cổ xuống ngực' },
      { code: 'ST17', loai: 'moc', at: 'NIPPLE', vi_sao: 'Nhũ Trung — chính giữa đầu vú, định đường 4 thốn ngang' },
      { code: 'ST25', loai: 'moc', at: 'NAVEL', vi_sao: 'Thiên Khu — ngang rốn, mộ huyệt Đại Trường' },
      { code: 'ST30', loai: 'gap', at: 'PUBIS', vi_sao: 'Khí Xung — nếp bẹn; kinh bẻ từ bụng xuống đùi' },
      { code: 'ST31', loai: 'moc', at: 'HIP_ANT', vi_sao: 'Bễ Quan — nếp bẹn, phễu đùi' },
      { code: 'ST35', loai: 'moc', at: 'KNEE_EYE_LAT', vi_sao: 'Độc Tỵ — mắt gối ngoài' },
      { code: 'ST41', loai: 'moc', at: 'MALLEOLUS_LAT', vi_sao: 'Giải Khê — giữa nếp cổ chân trước, giữa hai gân duỗi' },
      { code: 'ST45', loai: 'cuoi', at: TIP.MONG_NGON_2, vi_sao: 'Lệ Đoài — tỉnh huyệt' },
    ],
  },

  GB: {
    ten: 'Đởm', huong: 'đuôi mắt → ngón chân 4', n: 44,
    doan: [
      { id: 'thai-duong', mo: 'hien', vung: 'đuôi mắt → trước tai', diem: ['GB1', 'GB2', 'GB3'],
        ranh: 'bờ ngoài ổ mắt, trên cung gò má, trước bình tai' },
      { id: 'chan-toc-ben', mo: 'hien', vung: 'chân tóc thái dương', diem: ['GB3', 'GB4', 'GB5', 'GB6', 'GB7'],
        ranh: 'vòng theo chân tóc thái dương, trên cơ thái dương' },
      { id: 'sau-tai',  mo: 'hien', vung: 'trên và sau tai', diem: ['GB7', 'GB8', 'GB9', 'GB10', 'GB11', 'GB12'],
        ranh: 'vòng trên đỉnh tai rồi xuống sau tai, tới bờ dưới mỏm chũm' },
      { id: 'tran-dinh', mo: 'hien', vung: 'trán → đỉnh → chẩm', diem: ['GB13', 'GB14', 'GB15', 'GB16', 'GB17', 'GB18', 'GB19'],
        ranh: 'đường dọc cách đường giữa 2,25 thốn, đi trên cung sọ' },
      { id: 'gay',      mo: 'hien', vung: 'gáy', diem: ['GB19', 'GB20'],
        ranh: 'hõm giữa cơ thang và cơ ức-đòn-chũm, dưới xương chẩm' },
      { id: 'vai',      mo: 'hien', vung: 'vai trên', diem: ['GB20', 'GB21'],
        ranh: 'giữa mỏm gai C7 và mỏm cùng vai, đỉnh cơ thang' },
      { id: 'suon',     mo: 'hien', vung: 'nách → sườn bên', diem: ['GB21', 'GB22', 'GB23', 'GB24', 'GB25', 'GB26', 'GB27', 'GB28'],
        ranh: 'bờ ngoài cơ gian sườn ngoài, đường nách giữa, xuống đầu xương sườn tự do' },
      { id: 'mong',     mo: 'hien', vung: 'mông', diem: ['GB28', 'GB29', 'GB30'],
        ranh: 'giữa mấu chuyển lớn và khe xương cùng, trong cơ mông lớn' },
      { id: 'dui',      mo: 'hien', vung: 'mặt ngoài đùi', diem: ['GB30', 'GB31', 'GB32', 'GB33'],
        ranh: 'dải chậu-chày, giữa cơ rộng ngoài và cơ nhị đầu đùi' },
      { id: 'cang-chan', mo: 'hien', vung: 'mặt ngoài cẳng chân', diem: ['GB34', 'GB35', 'GB36', 'GB37', 'GB38', 'GB39', 'GB40'],
        ranh: 'bờ trước rồi bờ sau xương mác, giữa cơ mác dài và cơ duỗi các ngón' },
      { id: 'ban-chan', mo: 'hien', vung: 'mu bàn chân', diem: ['GB40', 'GB41', 'GB42', 'GB43', 'GB44'],
        ranh: 'khe giữa xương bàn chân 4 và 5' },
    ],
    nut: [
      { code: 'GB1', loai: 'dau', at: 'PUPIL', vi_sao: 'Đồng Tử Liêu — đuôi mắt, bờ ngoài ổ mắt' },
      { code: 'GB7', loai: 'gap', at: null, vi_sao: 'Khúc Tấn — kinh bẻ từ chân tóc thái dương vòng lên trên tai' },
      { code: 'GB12', loai: 'gap', at: 'MASTOID', vi_sao: 'Hoàn Cốt — dưới mỏm chũm; hết vòng sau tai, kinh quay lên trán' },
      { code: 'GB20', loai: 'gap', at: 'MASTOID', vi_sao: 'Phong Trì — hõm dưới chẩm; điểm bẻ lớn nhất của kinh, từ đầu xuống vai' },
      { code: 'GB21', loai: 'gap', at: 'ACROMION', vi_sao: 'Kiên Tỉnh — kinh bẻ từ vai xuống sườn bên' },
      { code: 'GB22', loai: 'moc', at: 'NIPPLE', vi_sao: 'Uyên Dịch — đường nách giữa, ngang gian sườn 4. THÊM sau bước 2: thiếu nút này, đoạn sườn GB21→GB25 đi tắt qua ngực, các huyệt lệch trung bình 10,6cm' },
      { code: 'GB25', loai: 'moc', at: 'RIB12', vi_sao: 'Kinh Môn — đầu tự do xương sườn 12, mộ huyệt Thận' },
      { code: 'GB30', loai: 'moc', at: 'GREATER_TROCHANTER', vi_sao: 'Hoàn Khiêu — mốc mông; huyệt SÂU, không nằm trên đường mặt-ngoài' },
      { code: 'GB34', loai: 'moc', at: 'FIBULA_HEAD', vi_sao: 'Dương Lăng Tuyền — trước-dưới chỏm xương mác' },
      { code: 'GB40', loai: 'moc', at: 'MALLEOLUS_LAT', vi_sao: 'Khâu Khư — trước-dưới mắt cá ngoài' },
      { code: 'GB44', loai: 'cuoi', at: TIP.MONG_NGON_4, vi_sao: 'Túc Khiếu Âm — tỉnh huyệt' },
    ],
  },

  BL: {
    ten: 'Bàng Quang', huong: 'khoé mắt trong → ngón út chân', n: 67,
    ghi_chu: 'Kinh DUY NHẤT có hai đường lưng SONG SONG. Thứ tự mã số nhảy qua lại giữa chúng: sau BL40 '
      + '(giữa nếp kheo) mã nhảy về BL41 (lưng trên) — nối theo số sẽ vẽ một đường dài 100cm bay ngang '
      + 'người. Phải vẽ thành HAI chuỗi riêng, cùng hội tại BL40.',
    doan: [
      { id: 'dau',        mo: 'hien', vung: 'mắt → trán → đỉnh → chẩm', diem: ['BL1', 'BL2', 'BL3', 'BL4', 'BL5', 'BL6', 'BL7', 'BL8', 'BL9'],
        ranh: 'đường dọc cách đường giữa 1,5 thốn, đi trên cung sọ' },
      { id: 'gay',        mo: 'hien', vung: 'gáy', diem: ['BL9', 'BL10'],
        ranh: 'bờ ngoài cơ thang, dưới xương chẩm' },
      { id: 'lung-trong', mo: 'hien', vung: 'ĐƯỜNG TRONG — lưng, 1,5 thốn ngang', diem: ['BL11', 'BL12', 'BL13', 'BL14', 'BL15', 'BL16', 'BL17', 'BL18', 'BL19', 'BL20', 'BL21', 'BL22', 'BL23', 'BL24', 'BL25', 'BL26', 'BL27', 'BL28', 'BL29', 'BL30'],
        ranh: 'rãnh giữa cơ dài lưng và mỏm gai, ngang mỏm gai từng đốt sống' },
      { id: 'cung',       mo: 'hien', vung: 'xương cùng', diem: ['BL31', 'BL32', 'BL33', 'BL34', 'BL35'],
        ranh: 'bốn lỗ cùng sau, rồi cạnh đầu xương cụt' },
      { id: 'dui-sau',    mo: 'hien', vung: 'mặt sau đùi', diem: ['BL36', 'BL37', 'BL38', 'BL39', 'BL40'],
        ranh: 'giữa cơ nhị đầu đùi và cơ bán gân, xuống giữa nếp kheo' },
      { id: 'lung-ngoai', mo: 'hien', vung: 'ĐƯỜNG NGOÀI — lưng, 3 thốn ngang', diem: ['BL41', 'BL42', 'BL43', 'BL44', 'BL45', 'BL46', 'BL47', 'BL48', 'BL49', 'BL50', 'BL51', 'BL52', 'BL53', 'BL54'],
        ranh: 'bờ trong xương bả vai kéo dài xuống, ngoài cơ dài lưng' },
      { id: 'hoi-kheo',   mo: 'chim', vung: 'đường NGOÀI nhập vào đường trong', diem: ['BL54', 'BL40'],
        ranh: 'đi chéo mặt sau đùi, không có huyệt trên đoạn này' },
      { id: 'cang-chan',  mo: 'hien', vung: 'mặt sau cẳng chân', diem: ['BL40', 'BL55', 'BL56', 'BL57', 'BL58', 'BL59', 'BL60'],
        ranh: 'rãnh giữa hai bụng cơ bụng chân, rồi cạnh gân gót' },
      { id: 'ban-chan',   mo: 'hien', vung: 'bờ ngoài bàn chân', diem: ['BL60', 'BL61', 'BL62', 'BL63', 'BL64', 'BL65', 'BL66', 'BL67'],
        ranh: 'ranh da đỏ–trắng bờ ngoài bàn chân, dưới xương gót và xương hộp' },
    ],
    ve: [
      ['BL1', '…', 'BL10', 'BL11', '…', 'BL35', 'BL36', '…', 'BL40', 'BL55', '…', 'BL67'],
      ['BL41', '…', 'BL54'],
    ],
    nut: [
      { code: 'BL1', loai: 'dau', at: 'PUPIL', vi_sao: 'Tình Minh — khoé mắt trong' },
      { code: 'BL2', loai: 'gap', at: null, vi_sao: 'Toản Trúc — đầu trong lông mày; kinh bẻ từ mắt lên trán' },
      { code: 'BL10', loai: 'gap', at: 'VERT_C7', vi_sao: 'Thiên Trụ — gáy; kinh bẻ từ đầu xuống lưng, tách làm hai đường' },
      { code: 'BL23', loai: 'moc', at: 'VERT_L2', vi_sao: 'Thận Du — ngang mỏm gai L2, mốc kiểm đường trong' },
      { code: 'BL40', loai: 'moc', at: 'POPLITEAL', vi_sao: 'Uỷ Trung — giữa nếp kheo; NÚT HỘI của hai đường lưng' },
      { code: 'BL54', loai: 'gap', at: 'GREATER_TROCHANTER', vi_sao: 'Trật Biên — cuối đường NGOÀI; từ đây nhập vào Uỷ Trung' },
      { code: 'BL60', loai: 'moc', at: 'MALLEOLUS_LAT', vi_sao: 'Côn Lôn — giữa mắt cá ngoài và gân gót' },
      { code: 'BL67', loai: 'cuoi', at: TIP.MONG_NGON_UT_CHAN, vi_sao: 'Chí Âm — tỉnh huyệt' },
    ],
  },

  // ══════════ CHÂN — ba kinh ÂM đi từ bàn chân lên ngực/sườn ══════════

  SP: {
    ten: 'Tỳ', huong: 'ngón cái chân → nách', n: 21,
    doan: [
      { id: 'ban-chan',  mo: 'hien', vung: 'bờ trong bàn chân', diem: ['SP1', 'SP2', 'SP3', 'SP4', 'SP5'],
        ranh: 'ranh da đỏ–trắng bờ trong bàn chân, dưới-trước mắt cá trong' },
      { id: 'cang-chan', mo: 'hien', vung: 'mặt trong cẳng chân', diem: ['SP5', 'SP6', 'SP7', 'SP8', 'SP9'],
        ranh: 'sát bờ sau xương chày, trước cơ dép' },
      { id: 'dui',       mo: 'hien', vung: 'mặt trong đùi', diem: ['SP9', 'SP10', 'SP11', 'SP12'],
        ranh: 'rãnh giữa cơ may và cơ rộng trong, rồi giữa cơ may và cơ khép dài' },
      { id: 'bung',      mo: 'hien', vung: 'bụng, đường 4 thốn ngang', diem: ['SP13', 'SP14', 'SP15', 'SP16'],
        ranh: 'bờ trong cơ chéo bụng ngoài' },   // = đường bán nguyệt, trùng bờ ngoài cơ thẳng bụng (atlas không có cơ thẳng bụng)
      { id: 'nguc',      mo: 'hien', vung: 'ngực, đường 6 thốn ngang', diem: ['SP17', 'SP18', 'SP19', 'SP20'],
        ranh: 'trên cơ gian sườn ngoài, ngoài đường vú' },
      { id: 'nach',      mo: 'hien', vung: 'sườn bên', diem: ['SP20', 'SP21'],
        ranh: 'đường nách giữa, gian sườn 6' },
    ],
    nut: [
      { code: 'SP1', loai: 'dau', at: TIP.MONG_NGON_CAI_CHAN, vi_sao: 'Ẩn Bạch — tỉnh huyệt' },
      { code: 'SP5', loai: 'moc', at: 'MALLEOLUS_MED', vi_sao: 'Thương Khâu — hõm dưới-trước mắt cá trong' },
      { code: 'SP9', loai: 'moc', at: 'TIBIA_MED_CONDYLE', vi_sao: 'Âm Lăng Tuyền — lồi cầu trong xương chầy; kinh bẻ lên đùi' },
      { code: 'SP12', loai: 'gap', at: 'PUBIS', vi_sao: 'Xung Môn — nếp bẹn; kinh bẻ từ đùi lên bụng' },
      { code: 'SP15', loai: 'moc', at: 'NAVEL', vi_sao: 'Đại Hoành — ngang rốn, định đường 4 thốn ngang' },
      { code: 'SP17', loai: 'gap', at: null, vi_sao: 'Thực Đậu — kinh bẻ từ bụng ra ngoài lên ngực (4 → 6 thốn ngang)' },
      { code: 'SP21', loai: 'cuoi', at: 'AXILLA_ANT', vi_sao: 'Đại Bao — đường nách giữa' },
    ],
  },

  KI: {
    ten: 'Thận', huong: 'gan bàn chân → dưới xương đòn', n: 27,
    ghi_chu: 'Có một đoạn CHÌM thật: từ nếp kheo (KI10) kinh đi trong mặt trong đùi lên bụng dưới (KI11) — '
      + 'khoảng 41cm không có huyệt nào trên da. Không được vẽ đường thẳng nối hai điểm này.',
    doan: [
      { id: 'ban-chan',  mo: 'hien', vung: 'gan bàn chân → mắt cá trong', diem: ['KI1', 'KI2', 'KI3', 'KI4', 'KI5', 'KI6'],
        ranh: 'gan bàn chân, rồi vòng quanh mắt cá trong giữa xương chày và gân gót' },
      { id: 'cang-chan', mo: 'hien', vung: 'mặt trong-sau cẳng chân', diem: ['KI6', 'KI7', 'KI8', 'KI9', 'KI10'],
        ranh: 'bờ trong gân gót lên rãnh trong cơ bụng chân, tới đầu trong nếp kheo' },
      { id: 'dui-chim',  mo: 'chim', vung: 'mặt trong đùi (đi sâu)', diem: ['KI10', 'KI11'],
        ranh: 'không có huyệt trên da — kinh đi trong, qua đáy chậu lên bụng dưới' },
      { id: 'bung',      mo: 'hien', vung: 'bụng, đường 0,5 thốn ngang', diem: ['KI11', 'KI12', 'KI13', 'KI14', 'KI15', 'KI16', 'KI17', 'KI18', 'KI19', 'KI20', 'KI21'],
        ranh: 'bờ ngoài đường trắng giữa bụng' },
      { id: 'nguc',      mo: 'hien', vung: 'ngực, đường 2 thốn ngang', diem: ['KI22', 'KI23', 'KI24', 'KI25', 'KI26', 'KI27'],
        ranh: 'các khoảng gian sườn cạnh xương ức, lên bờ dưới xương đòn' },
    ],
    nut: [
      { code: 'KI1', loai: 'dau', at: TIP.GAN_BAN_CHAN, vi_sao: 'Dũng Tuyền — tỉnh huyệt, huyệt duy nhất ở gan bàn chân' },
      { code: 'KI3', loai: 'moc', at: 'MALLEOLUS_MED', vi_sao: 'Thái Khê — giữa mắt cá trong và gân gót' },
      { code: 'KI10', loai: 'gap', at: 'POPLITEAL', vi_sao: 'Âm Cốc — đầu trong nếp kheo; kinh chìm vào đùi từ đây' },
      { code: 'KI16', loai: 'moc', at: 'NAVEL', vi_sao: 'Hoang Du — ngang rốn, định đường 0,5 thốn ngang' },
      { code: 'KI21', loai: 'gap', at: 'XIPHOID', vi_sao: 'U Môn — kinh bẻ từ bụng (0,5 thốn) ra ngực (2 thốn ngang)' },
      { code: 'KI27', loai: 'cuoi', at: 'CLAVICLE', vi_sao: 'Du Phủ — bờ dưới xương đòn' },
    ],
  },

  LR: {
    ten: 'Can', huong: 'ngón cái chân → sườn', n: 14,
    doan: [
      { id: 'ban-chan',  mo: 'hien', vung: 'mu bàn chân', diem: ['LR1', 'LR2', 'LR3', 'LR4'],
        ranh: 'khe giữa xương bàn chân 1 và 2, rồi trước mắt cá trong giữa hai gân' },
      { id: 'cang-chan', mo: 'hien', vung: 'mặt trong cẳng chân', diem: ['LR4', 'LR5', 'LR6', 'LR7', 'LR8'],
        ranh: 'sát bờ sau-trong xương chày, lên đầu trong nếp kheo' },
      { id: 'dui',       mo: 'hien', vung: 'mặt trong đùi', diem: ['LR8', 'LR9', 'LR10', 'LR11', 'LR12'],
        ranh: 'giữa cơ khép dài và cơ may, tới nếp bẹn' },
      { id: 'suon',      mo: 'hien', vung: 'sườn bên', diem: ['LR12', 'LR13', 'LR14'],
        ranh: 'bờ trước cơ gian sườn ngoài, từ đầu xương sườn tự do 11 lên' },
    ],
    nut: [
      { code: 'LR1', loai: 'dau', at: TIP.MONG_NGON_CAI_CHAN, vi_sao: 'Đại Đôn — tỉnh huyệt' },
      { code: 'LR4', loai: 'moc', at: 'MALLEOLUS_MED', vi_sao: 'Trung Phong — trước mắt cá trong' },
      { code: 'LR8', loai: 'gap', at: 'POPLITEAL', vi_sao: 'Khúc Tuyền — đầu trong nếp kheo; kinh bẻ lên đùi trong' },
      { code: 'LR12', loai: 'gap', at: 'PUBIS', vi_sao: 'Cấp Mạch — nếp bẹn; kinh bẻ từ đùi lên sườn' },
      { code: 'LR13', loai: 'moc', at: 'RIB12', vi_sao: 'Chương Môn — đầu xương sườn tự do 11, mộ huyệt Tỳ' },
      { code: 'LR14', loai: 'cuoi', at: 'NIPPLE', vi_sao: 'Kỳ Môn — gian sườn 6, thẳng đầu vú; mộ huyệt Can' },
    ],
  },

  // ══════════ HAI MẠCH ĐƯỜNG GIỮA ══════════

  CV: {
    ten: 'Nhâm', huong: 'đáy chậu → dưới môi dưới', n: 24,
    doan: [
      { id: 'bung-duoi', mo: 'hien', vung: 'đáy chậu → rốn', diem: ['CV1', 'CV2', 'CV3', 'CV4', 'CV5', 'CV6', 'CV7', 'CV8'],
        ranh: 'trên đường trắng giữa bụng' },
      { id: 'bung-tren', mo: 'hien', vung: 'rốn → mũi ức', diem: ['CV8', 'CV9', 'CV10', 'CV11', 'CV12', 'CV13', 'CV14', 'CV15'],
        ranh: 'trên đường trắng giữa bụng' },
      { id: 'nguc',      mo: 'hien', vung: 'thân xương ức', diem: ['CV15', 'CV16', 'CV17', 'CV18', 'CV19', 'CV20', 'CV21', 'CV22'],
        ranh: 'đường giữa xương ức, các khớp ức-sườn' },
      { id: 'co',        mo: 'hien', vung: 'cổ trước', diem: ['CV22', 'CV23', 'CV24'],
        ranh: 'đường giữa cổ, qua bờ trên sụn giáp lên lõm dưới môi dưới' },
    ],
    nut: [
      { code: 'CV1', loai: 'dau', at: null, vi_sao: 'Hội Âm — trung tâm đáy chậu' },
      { code: 'CV2', loai: 'moc', at: 'PUBIS', vi_sao: 'Khúc Cốt — bờ trên xương mu' },
      { code: 'CV8', loai: 'moc', at: 'NAVEL', vi_sao: 'Thần Khuyết — chính giữa rốn, mốc rõ nhất cơ thể' },
      { code: 'CV15', loai: 'moc', at: 'XIPHOID', vi_sao: 'Cưu Vĩ — dưới mũi ức' },
      { code: 'CV17', loai: 'moc', at: 'STERNUM', vi_sao: 'Đản Trung — giữa hai đầu vú' },
      { code: 'CV22', loai: 'moc', at: 'STERNUM_TOP', vi_sao: 'Thiên Đột — hõm trên xương ức' },
      { code: 'CV23', loai: 'moc', at: 'LARYNX', vi_sao: 'Liêm Tuyền — bờ trên sụn giáp' },
      { code: 'CV24', loai: 'cuoi', at: 'MENTON', vi_sao: 'Thừa Tương — lõm giữa dưới môi dưới' },
    ],
  },

  GV: {
    ten: 'Đốc', huong: 'đầu xương cụt → hãm môi trên', n: 28,
    ghi_chu: 'Đoạn từ Á Môn (GV15) trở lên chạy trên CUNG DỌC ĐẦU đã dựng trong model-frame (HEAD_ARC, '
      + '18 thốn, Ấn Đường → đỉnh → C7) — đi ngược chiều cung. Đây là kinh hưởng lợi trực tiếp nhất từ '
      + 'trục cong, và cũng là kinh DUY NHẤT còn dùng cực toạ độ {h,az}, chưa qua engine.',
    doan: [
      { id: 'cung-that-lung', mo: 'hien', vung: 'xương cụt → thắt lưng', diem: ['GV1', 'GV2', 'GV3', 'GV4', 'GV5', 'GV6'],
        ranh: 'khe giữa các mỏm gai đốt sống, đường giữa lưng' },
      { id: 'lung',      mo: 'hien', vung: 'lưng ngực', diem: ['GV6', 'GV7', 'GV8', 'GV9', 'GV10', 'GV11', 'GV12', 'GV13', 'GV14'],
        ranh: 'khe giữa các mỏm gai đốt sống ngực' },
      { id: 'gay',       mo: 'hien', vung: 'gáy', diem: ['GV14', 'GV15', 'GV16'],
        ranh: 'khe dưới mỏm gai C7 lên hõm dưới xương chẩm' },
      { id: 'dinh-dau',  mo: 'hien', vung: 'chẩm → đỉnh → trán', diem: ['GV16', 'GV17', 'GV18', 'GV19', 'GV20', 'GV21', 'GV22', 'GV23', 'GV24'],
        ranh: 'CUNG DỌC ĐẦU trên đường giữa sọ' },
      { id: 'mui-moi',   mo: 'hien', vung: 'mũi → môi trên', diem: ['GV24', 'GV25', 'GV26', 'GV27', 'GV28'],
        ranh: 'sống mũi, rãnh nhân trung, hãm môi trên' },
    ],
    nut: [
      { code: 'GV1', loai: 'dau', at: null, vi_sao: 'Trường Cường — giữa đầu xương cụt và hậu môn' },
      { code: 'GV4', loai: 'moc', at: 'VERT_L2', vi_sao: 'Mệnh Môn — dưới mỏm gai L2' },
      { code: 'GV14', loai: 'moc', at: 'VERT_C7', vi_sao: 'Đại Chuỳ — dưới mỏm gai C7; đầu mút dưới của cung dọc đầu (18 thốn)' },
      { code: 'GV16', loai: 'gap', at: 'HAIRLINE_POST', vi_sao: 'Á Môn — kinh vào cung sọ từ đây (16,5 thốn trên cung)' },
      { code: 'GV20', loai: 'moc', at: null, vi_sao: 'Bách Hội — 8 thốn trên cung, 5 thốn trên chân tóc trước. CẦN SOÁT MẮT: hiện rơi hơi lệch sau đỉnh sọ' },
      { code: 'GV24', loai: 'moc', at: 'HAIRLINE_ANT', vi_sao: 'Thần Đình — trên chân tóc trước 0,5 thốn (3,5 thốn trên cung)' },
      { code: 'GV28', loai: 'cuoi', at: null, vi_sao: 'Ngân Giao — hãm môi trên' },
    ],
  },

};

/** Mọi mã huyệt của một kinh theo THỨ TỰ ĐƯỜNG ĐI (khác thứ tự mã số ở BL). */
function chuoiDiem(mer) {
  const d = M[mer];
  if (!d) return [];
  const out = [];
  for (const s of d.doan) for (const c of s.diem) if (out[out.length - 1] !== c) out.push(c);
  return out;
}

/** Nút của một huyệt, hoặc null nếu nó là huyệt thường nằm trên đoạn lượn. */
function nutCua(code) {
  const mer = code.replace(/\d+$/, '');
  const d = M[mer];
  return d ? (d.nut.find(n => n.code === code) || null) : null;
}

/** Đoạn chứa một huyệt. */
function doanCua(code) {
  const mer = code.replace(/\d+$/, '');
  const d = M[mer];
  return d ? (d.doan.find(s => s.diem.includes(code)) || null) : null;
}

module.exports = { NODES: M, TIP, chuoiDiem, nutCua, doanCua };

// ----- CLI: node meridian-nodes.cjs [MER]  → in khung + đối chiếu với bảng toạ độ đang có -----
if (require.main === module) {
  const fs = require('fs'), path = require('path');
  const w = {};
  const F = path.resolve(__dirname, '../../../frontend/public/kinhmach3d/data/acu-coords3d.js');
  new Function('window', fs.readFileSync(F, 'utf8'))(w);
  const P = w.ACU_COORDS3D.points;
  const sel = process.argv[2] ? [process.argv[2]] : Object.keys(M);
  let thieu = 0, tong = 0;
  for (const mer of sel) {
    const d = M[mer];
    // dùng Set: nút giao (BL40, ST6) xuất hiện ở nhiều đoạn, đếm thẳng sẽ ra số âm
    const seq = [...new Set(chuoiDiem(mer))];
    tong += d.n; thieu += d.n - seq.filter(c => P[c]).length;
    console.log(`\n${mer} — ${d.ten} · ${d.huong} · ${d.n} huyệt · ${d.doan.length} đoạn · ${d.nut.length} nút`);
    if (d.ghi_chu) console.log('  ⚑ ' + d.ghi_chu.replace(/\s+/g, ' '));
    for (const s of d.doan)
      console.log(`   ${s.mo === 'chim' ? '┄' : '─'} ${s.id.padEnd(16)} ${String(s.diem.length).padStart(2)} điểm  ${s.vung}`);
    console.log('   nút: ' + d.nut.map(n => `${n.code}·${n.loai}${n.at ? '@' + n.at : ''}`).join('  '));
    const miss = seq.filter(c => !P[c]);
    if (miss.length) console.log('   ⚠ chưa có toạ độ: ' + miss.join(','));
  }
  console.log(`\n${sel.length} kinh · ${tong} huyệt khai báo · ${thieu} huyệt chưa có toạ độ`);
}
