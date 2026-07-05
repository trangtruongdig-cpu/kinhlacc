/**
 * Nội dung seed cho tính năng "Thương Hàn Tạp Luận Bệnh".
 * Được nạp idempotent (ON CONFLICT slug DO NOTHING) khi backend khởi động — tự lành,
 * không ghi đè bản đã sửa. Đây là nguồn kiến thức kinh điển, ổn định.
 */

export interface SeedLop {
  slug: string;
  thu_tu: number;
  ten: string;
  ten_han: string;
  tom_tat: string;
  khai_niem: string;
  vi_du: string;
  vi_sao: string;
  lien_he_app: string;
  du_lieu: unknown | null;
}

export const SEED_LOP: SeedLop[] = [
  {
    slug: 'am-duong',
    thu_tu: 1,
    ten: 'Âm Dương',
    ten_han: '太極',
    tom_tat: 'Gốc của mọi biện chứng — một chia thành hai.',
    khai_niem:
      'Âm Dương là hai mặt vừa đối lập vừa nương tựa nhau của cùng một sự vật: đối lập, hỗ căn, tiêu trưởng, chuyển hoá. Dương chủ về động, nhiệt, thăng, ngoài (biểu), hưng phấn; Âm chủ về tĩnh, hàn, giáng, trong (lý), ức chế.',
    vi_du:
      'Ngày là Dương – đêm là Âm; sốt nóng là Dương – sợ lạnh là Âm; lưng là Dương – bụng là Âm; khí là Dương – huyết/tân dịch là Âm. Bệnh cũng vậy: cấp–thực–nhiệt thiên Dương, mạn–hư–hàn thiên Âm.',
    vi_sao:
      'Toàn bộ chẩn đoán Đông y quy về Âm Dương. Từ đây mở ra BÁT CƯƠNG (8 cương lĩnh): Biểu–Lý, Hàn–Nhiệt, Hư–Thực, và Âm–Dương làm tổng cương. Nắm được Âm Dương là nắm được cái la bàn của mọi thể bệnh.',
    lien_he_app:
      'Bát Cương xuất hiện trong Pháp Trị và bảng luận trị; là bộ lọc đầu tiên khi phân tích một ca bệnh.',
    du_lieu: {
      duong: ['Biểu', 'Nhiệt', 'Thực', 'Thăng', 'Động', 'Khí', 'Hưng phấn'],
      am: ['Lý', 'Hàn', 'Hư', 'Giáng', 'Tĩnh', 'Huyết – Tân dịch', 'Ức chế'],
    },
  },
  {
    slug: 'ngu-hanh',
    thu_tu: 2,
    ten: 'Ngũ Hành',
    ten_han: '五行',
    tom_tat: 'Năm trạng thái vận động: Mộc – Hỏa – Thổ – Kim – Thủy.',
    khai_niem:
      'Ngũ Hành là năm loại vận động của khí: Mộc (sinh phát, cong thẳng), Hỏa (viêm thượng, bốc lên), Thổ (dung nạp, hoá sinh), Kim (túc giáng, thu liễm), Thủy (nhuận hạ, tàng trữ). Chúng liên hệ nhau bằng TƯƠNG SINH (nuôi dưỡng) và TƯƠNG KHẮC (chế ước); khi lệch thì sinh TƯƠNG THỪA (khắc quá) và TƯƠNG VŨ (khắc ngược).',
    vi_du:
      'Tương sinh: Mộc sinh Hỏa → Hỏa sinh Thổ → Thổ sinh Kim → Kim sinh Thủy → Thủy sinh Mộc. Tương khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc. Mùa: Xuân–Mộc, Hạ–Hỏa, Trưởng hạ–Thổ, Thu–Kim, Đông–Thủy.',
    vi_sao:
      'Ngũ Hành là bộ khung phân loại tạng phủ và là ĐỘNG CƠ giải thích bệnh truyền biến giữa các tạng. Câu kinh điển "Kiến can chi bệnh, tri can truyền tỳ" (Mộc khắc Thổ) chính là dùng Ngũ Hành để chặn trước đường đi của bệnh.',
    lien_he_app:
      'Vòng ở Trang Chủ và đồ hình này dùng chính bảng màu Ngũ Hành; quan hệ sinh–khắc là lõi suy luận truyền biến.',
    du_lieu: {
      nodes: [
        { hanh: 'moc', ten: 'Mộc', han: '木', mua: 'Xuân', tang: 'Can' },
        { hanh: 'hoa', ten: 'Hỏa', han: '火', mua: 'Hạ', tang: 'Tâm' },
        { hanh: 'tho', ten: 'Thổ', han: '土', mua: 'Trưởng hạ', tang: 'Tỳ' },
        { hanh: 'kim', ten: 'Kim', han: '金', mua: 'Thu', tang: 'Phế' },
        { hanh: 'thuy', ten: 'Thủy', han: '水', mua: 'Đông', tang: 'Thận' },
      ],
    },
  },
  {
    slug: 'tang-phu',
    thu_tu: 3,
    ten: 'Tạng Phủ',
    ten_han: '臟腑',
    tom_tat: 'Ngũ Hành mặc lấy hình hài: năm tạng, sáu phủ.',
    khai_niem:
      'Năm TẠNG (đặc, chứa tinh khí): Can–Tâm–Tỳ–Phế–Thận, quy theo Ngũ Hành Mộc–Hỏa–Thổ–Kim–Thủy. Mỗi tạng bắt cặp BIỂU-LÝ với một PHỦ (rỗng, truyền hoá): Can–Đởm, Tâm–Tiểu Trường, Tỳ–Vị, Phế–Đại Trường, Thận–Bàng Quang (thêm Tâm Bào – Tam Tiêu). Mỗi tạng còn "quy loại": khai khiếu, chủ chí, chủ dịch, vinh nhuận.',
    vi_du:
      'Can (Mộc) khai khiếu ra mắt, chủ nộ, tàng huyết. Tâm (Hỏa) khai khiếu ra lưỡi, chủ hỷ, chủ thần minh. Tỳ (Thổ) khai khiếu ra miệng, chủ tư, chủ vận hoá. Phế (Kim) khai khiếu ra mũi, chủ bi, chủ bì mao. Thận (Thủy) khai khiếu ra tai, chủ khủng, tàng tinh.',
    vi_sao:
      'Đây là địa chỉ CHỊU BỆNH. Bệnh tạp (nội thương) được biện theo TẠNG PHỦ (hệ Kim Quỹ): xác định tạng phủ nào hư/thực, hàn/nhiệt để định pháp. Quan hệ biểu-lý giải thích vì sao bệnh một phủ có thể ảnh hưởng tạng tương ứng.',
    lien_he_app:
      'Nối thẳng tới kho Vị Thuốc (quy kinh), Kinh Mạch 3D (đường kinh của tạng phủ) và Chẩn Đoán Lưỡi.',
    du_lieu: {
      tang: [
        { ten: 'Can', han: '肝', hanh: 'moc', phu: 'Đởm 膽', khieu: 'Mắt', chi: 'Nộ', dich: 'Nước mắt' },
        { ten: 'Tâm', han: '心', hanh: 'hoa', phu: 'Tiểu Trường 小腸', khieu: 'Lưỡi', chi: 'Hỷ', dich: 'Mồ hôi' },
        { ten: 'Tỳ', han: '脾', hanh: 'tho', phu: 'Vị 胃', khieu: 'Miệng', chi: 'Tư', dich: 'Nước bọt' },
        { ten: 'Phế', han: '肺', hanh: 'kim', phu: 'Đại Trường 大腸', khieu: 'Mũi', chi: 'Bi', dich: 'Nước mũi' },
        { ten: 'Thận', han: '腎', hanh: 'thuy', phu: 'Bàng Quang 膀胱', khieu: 'Tai', chi: 'Khủng', dich: 'Nước bọt (thoá)' },
      ],
    },
  },
  {
    slug: 'luc-khi',
    thu_tu: 4,
    ten: 'Lục Khí',
    ten_han: '六氣',
    tom_tat: 'Sáu khí của trời đất — và của thân thể.',
    khai_niem:
      'Lục Khí là sáu loại khí hậu: PHONG (gió), HÀN (lạnh), THỬ (nắng), THẤP (ẩm), TÁO (khô), HỎA (nhiệt). Bình thường là "lục khí" nuôi dưỡng; thái quá hay bất cập thì thành "lục dâm" gây bệnh ngoại cảm. Trong thân, mỗi khí ứng với một tầng Tam Âm Tam Dương — gọi là BẢN KHÍ của kinh.',
    vi_du:
      'Phong ↔ Mộc, Hàn ↔ Thủy, Thấp ↔ Thổ, Táo ↔ Kim, còn Hỏa tách làm hai: QUÂN HỎA (君火) và TƯỚNG HỎA (相火). Vì thế 6 khí ứng với 5 hành mà Hỏa được nhân đôi — đây là chỗ 5 và 6 gặp nhau.',
    vi_sao:
      'Lục Khí là cầu nối: ghép Lục Khí (Bản) với Tam Âm Tam Dương (Tiêu) sẽ tạo thành LỤC KINH — bộ khung biện chứng ngoại cảm của Thương Hàn Luận ở lớp sau.',
    lien_he_app:
      'Bản khí của từng kinh hiển thị ngay trên vòng Lục Kinh (lớp ⑤) và trong thẻ biện chứng.',
    du_lieu: {
      khi: [
        { ten: 'Phong', han: '風', hanh: 'moc' },
        { ten: 'Hàn', han: '寒', hanh: 'thuy' },
        { ten: 'Thử', han: '暑', hanh: 'hoaQ' },
        { ten: 'Thấp', han: '濕', hanh: 'tho' },
        { ten: 'Táo', han: '燥', hanh: 'kim' },
        { ten: 'Hỏa', han: '火', hanh: 'hoaT' },
      ],
    },
  },
  {
    slug: 'luc-kinh',
    thu_tu: 5,
    ten: 'Lục Kinh',
    ten_han: '六經',
    tom_tat: 'Kết tinh: Tiêu ⊗ Bản = sáu kinh biện chứng.',
    khai_niem:
      'Lục Kinh là sáu tầng Tam Âm Tam Dương (Thái Dương, Dương Minh, Thiếu Dương, Thái Âm, Thiếu Âm, Quyết Âm), mỗi tầng = TIÊU (tên Âm-Dương) ⊗ BẢN (một Lục Khí) và có TRUNG KIẾN (kinh biểu-lý cặp đôi). Tổ chức thành: nửa Tam Dương (bệnh ở Biểu/Phủ, phép Tả) và nửa Tam Âm (bệnh ở Lý/Tạng, phép Ôn–Bổ).',
    vi_du:
      'Thái Dương – Hàn Thủy – Bàng Quang; Dương Minh – Táo Kim – Vị/Đại Trường; Thiếu Dương – Tướng Hỏa – Đởm/Tam Tiêu; Thái Âm – Thấp Thổ – Tỳ; Thiếu Âm – Quân Hỏa – Tâm/Thận; Quyết Âm – Phong Mộc – Can/Tâm Bào. Chiều kim đồng hồ là đường truyền bệnh nông → sâu.',
    vi_sao:
      'Đây là bản đồ để "nhìn là biết bệnh vào kinh nào thì tạng phủ nào chịu". Cùng ba tầng lý thuyết sâu — TÒNG HÓA (标本从化), KHAI–HẠP–XU (開闔樞) và NGŨ HÀNH sinh/khắc — giải thích vì sao Thái Dương hàn lại hoá nhiệt, Quyết Âm lại hàn nhiệt thác tạp.',
    lien_he_app:
      'Từ mỗi kinh sẽ nối tới Pháp Trị, Bài Thuốc (Quế Chi, Ma Hoàng, Tứ Nghịch…), huyệt và Kinh Mạch 3D ở giai đoạn lâm sàng kế tiếp.',
    du_lieu: null,
  },
];

export interface SeedLucKinh {
  slug: string;
  thu_tu: number;
  ten: string;
  ten_han: string;
  nhom: 'duong' | 'am';
  deg: number;
  ban_khi: string;
  ban_khi_han: string;
  hanh: string;
  tong_hoa: string;
  tong_hoa_note: string;
  khai_hap_xu: string;
  trung_kien: string;
  tang_phu_dich: string;
  tang_phu_han: string;
  tang_phu_type: 'tang' | 'phu';
  tang_phu_sub: string;
  trieu_chung: string;
  tri_phap: string;
  truyen_bien: string;
  bai_thuoc_refs: { ten: string }[];
}

export const SEED_LUC_KINH: SeedLucKinh[] = [
  {
    slug: 'thai-duong', thu_tu: 1, ten: 'Thái Dương', ten_han: '太陽', nhom: 'duong', deg: 0,
    ban_khi: 'Hàn · Thủy', ban_khi_han: '寒', hanh: 'thuy', tong_hoa: 'ban-tieu',
    tong_hoa_note: 'Bản Hàn, tiêu Dương → vừa có hàn chứng vừa dễ hoá nhiệt.',
    khai_hap_xu: 'khai', trung_kien: 'Thiếu Âm 少陰 (Thận)',
    tang_phu_dich: 'Bàng Quang', tang_phu_han: '膀胱', tang_phu_type: 'phu',
    tang_phu_sub: '→ ảnh hưởng Phế 肺 (chủ bì mao)',
    trieu_chung: 'Mạch phù, đau đầu gáy cứng, sợ lạnh, phát sốt; nặng thêm ho, suyễn, ngạt mũi.',
    tri_phap: 'Phát hãn giải biểu', truyen_bien: '→ Dương Minh (hoá nhiệt) hoặc nội hãm Thiếu Âm.',
    bai_thuoc_refs: [{ ten: 'Quế Chi Thang' }, { ten: 'Ma Hoàng Thang' }],
  },
  {
    slug: 'duong-minh', thu_tu: 2, ten: 'Dương Minh', ten_han: '陽明', nhom: 'duong', deg: 60,
    ban_khi: 'Táo · Kim', ban_khi_han: '燥', hanh: 'kim', tong_hoa: 'trung',
    tong_hoa_note: 'Táo tòng Trung (Thái Âm Thấp) → dễ hoá táo, thiêu đốt tân dịch.',
    khai_hap_xu: 'hap', trung_kien: 'Thái Âm 太陰 (Tỳ)',
    tang_phu_dich: 'Vị · Đại Trường', tang_phu_han: '胃 大腸', tang_phu_type: 'phu',
    tang_phu_sub: 'Cực thịnh của Dương',
    trieu_chung: 'Sốt cao, đại hãn, đại khát, mạch hồng đại; hoặc táo bón, bụng đầy đau cự án.',
    tri_phap: 'Thanh nhiệt / Công hạ', truyen_bien: 'Thiêu đốt tân dịch → truyền vào Tam Âm.',
    bai_thuoc_refs: [{ ten: 'Bạch Hổ Thang' }, { ten: 'Thừa Khí Thang' }],
  },
  {
    slug: 'thieu-duong', thu_tu: 3, ten: 'Thiếu Dương', ten_han: '少陽', nhom: 'duong', deg: 300,
    ban_khi: 'Tướng Hỏa', ban_khi_han: '相火', hanh: 'hoaT', tong_hoa: 'ban',
    tong_hoa_note: 'Tòng Bản → bệnh chủ về Hỏa nhiệt (Tướng hỏa bốc).',
    khai_hap_xu: 'xu', trung_kien: 'Quyết Âm 厥陰 (Can)',
    tang_phu_dich: 'Đởm · Tam Tiêu', tang_phu_han: '膽 三焦', tang_phu_type: 'phu',
    tang_phu_sub: 'Bán biểu bán lý',
    trieu_chung: 'Hàn nhiệt vãng lai, ngực sườn đầy tức, miệng đắng họng khô, mắt hoa, mạch huyền.',
    tri_phap: 'Hòa giải', truyen_bien: 'Bản lề (Xu): giải ra Dương hoặc hãm vào Âm.',
    bai_thuoc_refs: [{ ten: 'Tiểu Sài Hồ Thang' }],
  },
  {
    slug: 'thai-am', thu_tu: 4, ten: 'Thái Âm', ten_han: '太陰', nhom: 'am', deg: 240,
    ban_khi: 'Thấp · Thổ', ban_khi_han: '濕', hanh: 'tho', tong_hoa: 'ban',
    tong_hoa_note: 'Tòng Bản → bệnh chủ về hàn thấp (Tỳ dương hư).',
    khai_hap_xu: 'khai', trung_kien: 'Dương Minh 陽明 (Vị)',
    tang_phu_dich: 'Tỳ', tang_phu_han: '脾', tang_phu_type: 'tang',
    tang_phu_sub: 'Khởi đầu của Âm — hư hàn trung tiêu',
    trieu_chung: 'Bụng đầy chướng, ăn không tiêu, nôn mửa, tiêu chảy, không khát, mạch hoãn nhược.',
    tri_phap: 'Ôn trung tán hàn', truyen_bien: 'Nhận “Can truyền Tỳ” (Mộc khắc Thổ) từ Quyết Âm.',
    bai_thuoc_refs: [{ ten: 'Lý Trung Thang' }],
  },
  {
    slug: 'thieu-am', thu_tu: 5, ten: 'Thiếu Âm', ten_han: '少陰', nhom: 'am', deg: 180,
    ban_khi: 'Quân Hỏa', ban_khi_han: '君火', hanh: 'hoaQ', tong_hoa: 'ban-tieu',
    tong_hoa_note: 'Lưỡng hóa → hàn hoá (Tứ Nghịch) hoặc nhiệt hoá (Hoàng Liên A Giao).',
    khai_hap_xu: 'xu', trung_kien: 'Thái Dương 太陽 (Bàng Quang)',
    tang_phu_dich: 'Tâm · Thận', tang_phu_han: '心 腎', tang_phu_type: 'tang',
    tang_phu_sub: 'Thủy–Hỏa tương giao, trục sinh tử',
    trieu_chung: 'Mạch vi tế, chỉ muốn ngủ, sợ lạnh nằm co, tứ chi quyết lạnh (hàn hoá); hoặc tâm phiền mất ngủ (nhiệt hoá).',
    tri_phap: 'Hồi dương cứu nghịch / Tư âm', truyen_bien: 'Nguy kịch — vong dương, âm dương ly quyết.',
    bai_thuoc_refs: [{ ten: 'Tứ Nghịch Thang' }, { ten: 'Hoàng Liên A Giao Thang' }],
  },
  {
    slug: 'quyet-am', thu_tu: 6, ten: 'Quyết Âm', ten_han: '厥陰', nhom: 'am', deg: 120,
    ban_khi: 'Phong · Mộc', ban_khi_han: '風', hanh: 'moc', tong_hoa: 'trung',
    tong_hoa_note: 'Phong tòng Trung (Thiếu Dương Hỏa) → hàn nhiệt thác tạp.',
    khai_hap_xu: 'hap', trung_kien: 'Thiếu Dương 少陽 (Đởm)',
    tang_phu_dich: 'Can · Tâm Bào', tang_phu_han: '肝 心包', tang_phu_type: 'tang',
    tang_phu_sub: 'Tột cùng của Âm',
    trieu_chung: 'Tiêu khát, khí xông lên tim, đói không muốn ăn, ăn vào nôn giun, chân tay quyết lạnh mà trong nóng.',
    tri_phap: 'Hàn nhiệt kiêm trị', truyen_bien: 'Mộc khắc Thổ → Can truyền Tỳ; âm tận thì dương sinh.',
    bai_thuoc_refs: [{ ten: 'Ô Mai Hoàn' }],
  },
];
