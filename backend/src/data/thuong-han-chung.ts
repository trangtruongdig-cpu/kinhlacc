/**
 * BỘ XƯƠNG CHỨNG–PHƯƠNG THƯƠNG HÀN LUẬN — tầng còn thiếu giữa "6 kinh" và kho bài thuốc.
 *
 * Vì sao cần: `thuong_han_luc_kinh` mới có 6 kinh (quá thô), kho bài thuốc có 686 bài (quá mịn),
 * giữa hai cái không có gì. Thương Hàn Luận không phải 6 ô — mỗi kinh là một chùm chứng, mỗi chứng
 * một chủ phương, một pháp trị, và một bộ cấm kỵ riêng.
 *
 * RANH GIỚI PHẢI NHỚ: máy định vị tới KINH, người định vị tới CHỨNG. Phiếu đo kinh lạc không phân
 * biệt được Quế chi thang chứng với Ma hoàng thang chứng — hai cái khác nhau ở CÓ HÃN / VÔ HÃN, là
 * dấu hỏi-vọng chứ không phải số điện trở. Vì vậy mỗi chứng mang theo `cauHoiChot`: 2–3 câu hỏi
 * quyết định để engine hỏi, chứ không giả vờ đoán được.
 *
 * NGUỒN: Thương Hàn Luận Tống bản (398 điều) — `dieuVan` ghi số điều để tra ngược.
 * TRẠNG THÁI: BẢN NHÁP do máy soạn, CHỜ THẦY THUỐC DUYỆT TỪNG KINH. Chưa dùng cho lâm sàng.
 *
 * LIỀU: ở đây giữ NGUYÊN VĂN đơn vị Hán (lạng, thăng, thù, quả, hạt) — đó là nguồn. Quy đổi sang
 * gram do `thuong-han-lieu.ts` làm (hệ 1 lạng = 3g, thầy thuốc chốt 20/09/2026), kèm bộ bắt liều
 * vượt giới hạn hiện đại. Giữ hai thứ tách nhau để đổi hệ quy đổi không phải sửa 15 chứng.
 */

export type PhanLoaiChung =
  | 'kinh-chung'
  | 'phu-chung'
  | 'bien-chung'
  | 'kiem-chung';

export interface ViThuocPhuong {
  ten: string;
  /** Nguyên văn đơn vị Hán — KHÔNG quy đổi gram (xem chú thích đầu tệp). */
  lieuGoc: string;
  vaiTro?: 'quân' | 'thần' | 'tá' | 'sứ';
}

export interface ThuongHanChung {
  slug: string;
  kinh: string;
  phanLoai: PhanLoaiChung;
  ten: string;
  han: string;
  /** Số điều trong Tống bản 398 điều — để tra ngược nguyên văn. */
  dieuVan: number[];
  /** Chứng trạng cốt lõi (đề cương). */
  deCuong: string;
  mach: string;
  luoi?: string;
  /** 2–3 câu hỏi QUYẾT ĐỊNH để phân biệt với chứng anh em trong cùng kinh. */
  cauHoiChot: string[];
  /** Triệu chứng để khớp vào danh mục chuẩn `trieu_chung` (kho bài thuốc bắt buộc gắn id). */
  trieuChung: string[];
  phapTri: string;
  chuPhuong: {
    ten: string;
    han: string;
    /** Dạng bào chế GỐC. Quan trọng cho quy đổi liều: thuốc TÁN/HOÀN có liều mỗi lần nhỏ hơn hẳn
     *  thuốc THANG, nên con số quy đổi của nó KHÔNG dùng thẳng làm liều thang được. */
    dang: 'thang' | 'tan' | 'hoan';
    viThuoc: ViThuocPhuong[];
    cachDung?: string;
  };
  giaGiam?: Array<{ khi: string; thi: string }>;
  /** Cấm kỵ — phần Thương Hàn Luận dặn kỹ nhất, và app chưa có chỗ nào chứa. */
  camKy?: string[];
  /** Chứng thường biến sang (slug trong chính bộ này). */
  truyenSang?: string[];
  ghiChu?: string;
}

/** ─────────────── THÁI DƯƠNG (太陽) — 15 chứng, bản nháp đợt 1 ─────────────── */
export const CHUNG_THAI_DUONG: ThuongHanChung[] = [
  {
    slug: 'td-trung-phong-bieu-hu',
    kinh: 'thai-duong',
    phanLoai: 'kinh-chung',
    ten: 'Thái Dương trúng phong — biểu hư',
    han: '太陽中風表虛證',
    dieuVan: [2, 12, 13, 95],
    deCuong:
      'Phát sốt, sợ gió, TỰ RA MỒ HÔI, đau đầu cứng gáy; doanh vệ bất hoà, vệ khí không giữ được doanh âm.',
    mach: 'Phù hoãn (nổi mà chậm mềm)',
    luoi: 'Rêu trắng mỏng, chất lưỡi nhạt',
    trieuChung: ['Sốt', 'Sợ gió', 'Tự hãn', 'Đau đầu', 'Cứng gáy'],
    cauHoiChot: [
      'Có tự ra mồ hôi không? (có hãn → trúng phong biểu hư; không hãn → thương hàn biểu thực)',
      'Mặc thêm áo, đắp chăn, tránh gió thì có đỡ hơn không? (đỡ rõ → thiên sợ gió, hợp biểu hư)',
      'Ra mồ hôi rồi thì dễ chịu hơn hay vẫn sốt như cũ?',
      'Gáy vai có cứng, xoay cổ khó kèm theo không? (có → dùng Quế chi GIA CÁT CĂN, không phải Quế chi thang trơn)',
    ],
    phapTri: 'Giải cơ phát biểu, điều hoà doanh vệ',
    chuPhuong: {
      ten: 'Quế chi thang',
      han: '桂枝湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Quế chi', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Thược dược', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
        { ten: 'Sinh khương', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
      ],
      cachDung:
        'Sắc uống ấm, sau đó húp cháo loãng nóng để trợ dược lực; đắp ấm cho ra mồ hôi nhẹ khắp người. Ra mồ hôi đầm đìa là quá tay.',
    },
    giaGiam: [
      {
        khi: 'Gáy lưng cứng đau (điều 14)',
        thi: 'gia Cát căn → Quế chi gia Cát căn thang',
      },
      { khi: 'Suyễn (điều 18, 43)', thi: 'gia Hậu phác, Hạnh nhân' },
      {
        khi: 'Ra mồ hôi không dứt, sợ gió, tiểu khó, chân tay co quắp (điều 20)',
        thi: 'gia Phụ tử',
      },
    ],
    camKy: [
      'Điều 16: mạch phù khẩn, phát sốt mà KHÔNG ra mồ hôi thì không được dùng Quế chi thang.',
      'Người nghiện rượu (thấp nhiệt nội thịnh) uống vào hay nôn (điều 17).',
    ],
    truyenSang: ['td-thuong-han-bieu-thuc', 'td-suc-thuy'],
  },
  {
    slug: 'td-thuong-han-bieu-thuc',
    kinh: 'thai-duong',
    phanLoai: 'kinh-chung',
    ten: 'Thái Dương thương hàn — biểu thực',
    han: '太陽傷寒表實證',
    dieuVan: [3, 35, 46],
    deCuong:
      'Sốt, sợ lạnh, KHÔNG ra mồ hôi mà suyễn, đau đầu, đau mình đau khớp; phong hàn bó biểu, phế khí ủng bế.',
    mach: 'Phù khẩn (nổi mà căng chặt)',
    luoi: 'Rêu trắng mỏng',
    trieuChung: [
      'Sốt',
      'Sợ lạnh',
      'Không mồ hôi',
      'Khó thở',
      'Đau mình',
      'Đau đầu',
    ],
    cauHoiChot: [
      'Hoàn toàn không ra mồ hôi phải không?',
      'Có thở gấp / tức ngực không?',
      'Đau mỏi toàn thân, đau khớp nhiều không?',
    ],
    phapTri: 'Phát hãn giải biểu, tuyên phế bình suyễn',
    chuPhuong: {
      ten: 'Ma hoàng thang',
      han: '麻黃湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Ma hoàng', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Quế chi', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Hạnh nhân', lieuGoc: '70 hạt', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '1 lạng', vaiTro: 'sứ' },
      ],
      cachDung:
        'Sắc Ma hoàng trước, hớt bọt, rồi cho các vị khác. Uống ấm, đắp cho ra mồ hôi nhẹ; KHÔNG húp cháo như Quế chi thang.',
    },
    camKy: [
      'Điều 83–89 — các "bất khả phát hãn": họng khô, người bệnh lâm (tiểu buốt dắt), sang gia (lở loét), nục gia (hay chảy máu cam), vong huyết gia, hãn gia (hay ra mồ hôi).',
      'Điều 49–50: mạch vi tế, tôn hư, xích mạch trì — phát hãn là hại chính khí.',
      'Ra mồ hôi rồi thì thôi, không phát hãn lần hai (điều 88).',
    ],
    truyenSang: ['td-bieu-han-ly-am', 'td-dai-thanh-long'],
  },
  {
    slug: 'td-bieu-han-ly-am',
    kinh: 'thai-duong',
    phanLoai: 'kinh-chung',
    ten: 'Ngoại hàn nội ẩm (biểu hàn lý ẩm)',
    han: '外寒內飲',
    dieuVan: [40, 41],
    deCuong:
      'Sốt sợ lạnh không mồ hôi, ho suyễn đờm loãng trắng như bọt, ngực đầy, có thể nôn khan, khát mà không muốn uống.',
    mach: 'Phù khẩn',
    luoi: 'Rêu trắng trơn ướt',
    trieuChung: ['Ho', 'Khó thở', 'Đờm loãng', 'Sợ lạnh', 'Tức ngực'],
    cauHoiChot: [
      'Đờm loãng trắng như nước bọt hay đặc vàng?',
      'Ho nằm xuống có nặng hơn không?',
      'Có sợ lạnh và không ra mồ hôi không?',
    ],
    phapTri: 'Giải biểu tán hàn, ôn phế hoá ẩm, chỉ khái bình suyễn',
    chuPhuong: {
      ten: 'Tiểu thanh long thang',
      han: '小青龍湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Ma hoàng', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Quế chi', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Can khương', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Tế tân', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Bán hạ', lieuGoc: 'nửa thăng', vaiTro: 'tá' },
        { ten: 'Ngũ vị tử', lieuGoc: 'nửa thăng', vaiTro: 'tá' },
        { ten: 'Thược dược', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '3 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Ôn táo mạnh — người âm hư, đờm vàng đặc, ho ra máu thì không dùng.',
      'Không dùng lâu: hết ẩm phải đổi phương, dùng dai làm hao âm động huyết.',
    ],
    truyenSang: ['td-thuong-han-bieu-thuc'],
  },
  {
    slug: 'td-cat-can-hang-bao-cuong',
    kinh: 'thai-duong',
    phanLoai: 'kinh-chung',
    ten: 'Biểu thực kiêm gáy lưng cứng đau',
    han: '太陽病項背強几几',
    dieuVan: [31],
    deCuong:
      'Chứng Thái Dương biểu thực kèm gáy lưng cứng đơ, không mồ hôi, sợ gió; kinh du Thái Dương bị hàn bó, tân dịch không lên nuôi được.',
    mach: 'Phù khẩn',
    trieuChung: ['Cứng gáy', 'Sợ gió', 'Sốt', 'Đau vai gáy', 'Không mồ hôi'],
    cauHoiChot: [
      'Gáy và lưng trên có cứng đơ, quay cổ khó không?',
      'Có ra mồ hôi không? (không hãn → Cát căn thang; có hãn → Quế chi gia Cát căn)',
      'Có kèm tiêu chảy không? (có → hợp bệnh Thái Dương–Dương Minh)',
    ],
    phapTri: 'Phát hãn giải biểu, thăng tân thư kinh',
    chuPhuong: {
      ten: 'Cát căn thang',
      han: '葛根湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Cát căn', lieuGoc: '4 lạng', vaiTro: 'quân' },
        { ten: 'Ma hoàng', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Quế chi', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Thược dược', lieuGoc: '2 lạng', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    ghiChu:
      'Điều 32: Thái Dương – Dương Minh hợp bệnh mà tự tiêu chảy thì cũng dùng phương này.',
    truyenSang: ['td-trung-phong-bieu-hu'],
  },
  {
    slug: 'td-dai-thanh-long',
    kinh: 'thai-duong',
    phanLoai: 'kinh-chung',
    ten: 'Biểu hàn kèm lý nhiệt (phiền táo)',
    han: '表寒裏熱煩躁',
    dieuVan: [38, 39],
    deCuong:
      'Sốt cao sợ lạnh, không mồ hôi, đau mình, và PHIỀN TÁO — hàn bó ở ngoài, dương nhiệt uất ở trong không thoát ra được.',
    mach: 'Phù khẩn',
    luoi: 'Rêu trắng, đầu lưỡi đỏ',
    trieuChung: ['Sốt cao', 'Sợ lạnh', 'Không mồ hôi', 'Phiền táo', 'Đau mình'],
    cauHoiChot: [
      'Có bứt rứt vật vã trong người không? (phiền táo là dấu phân biệt với Ma hoàng thang)',
      'Vẫn sợ lạnh và không ra mồ hôi chứ?',
      'Mạch có vi nhược không, có tự ra mồ hôi không? (nếu có thì CẤM dùng)',
    ],
    phapTri: 'Phát hãn giải biểu, thanh nhiệt trừ phiền',
    chuPhuong: {
      ten: 'Đại thanh long thang',
      han: '大青龍湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Ma hoàng', lieuGoc: '6 lạng', vaiTro: 'quân' },
        { ten: 'Quế chi', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Thạch cao', lieuGoc: 'to như quả trứng gà', vaiTro: 'thần' },
        { ten: 'Hạnh nhân', lieuGoc: '40 hạt', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '10 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Điều 38 nói thẳng: mạch vi nhược, tự ra mồ hôi, sợ gió thì KHÔNG được uống — uống vào thì quyết nghịch, gân giật thịt giần, là nghịch trị.',
      'Liều Ma hoàng gấp đôi Ma hoàng thang: ra mồ hôi được rồi thì dừng ngay, không uống tiếp.',
    ],
    truyenSang: ['td-thuong-han-bieu-thuc'],
  },
  {
    slug: 'td-bieu-uat-khinh',
    kinh: 'thai-duong',
    phanLoai: 'kinh-chung',
    ten: 'Biểu uất khinh chứng (tà nhẹ còn đọng ở biểu)',
    han: '表鬱輕證',
    dieuVan: [23],
    deCuong:
      'Bệnh đã lâu ngày, sốt rét từng cơn như sốt cơn, người ngứa, mặt đỏ, tà còn nhẹ ở biểu chưa giải hết.',
    mach: 'Phù nhược / vi hoãn',
    trieuChung: ['Sốt', 'Ngứa', 'Mặt đỏ', 'Rét run'],
    cauHoiChot: [
      'Sốt nóng lạnh có thành CƠN trong ngày không, mấy cơn?',
      'Người có ngứa, không ra được mồ hôi không?',
      'Bệnh đã mấy ngày rồi?',
    ],
    phapTri: 'Phát hãn nhẹ, điều hoà doanh vệ (tiểu phát kỳ hãn)',
    chuPhuong: {
      ten: 'Quế chi Ma hoàng các bán thang',
      han: '桂枝麻黃各半湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Quế chi', lieuGoc: '1 lạng 16 thù', vaiTro: 'quân' },
        { ten: 'Ma hoàng', lieuGoc: '1 lạng', vaiTro: 'thần' },
        { ten: 'Thược dược', lieuGoc: '1 lạng', vaiTro: 'tá' },
        { ten: 'Hạnh nhân', lieuGoc: '24 hạt', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '1 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '4 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '1 lạng', vaiTro: 'sứ' },
      ],
    },
    ghiChu:
      'Cùng họ: Quế chi nhị Ma hoàng nhất thang (điều 25), Quế chi nhị Việt tỳ nhất thang (điều 27) — cùng ý "phát hãn nhẹ".',
  },
  {
    slug: 'td-que-chi-gia-phu-tu',
    kinh: 'thai-duong',
    phanLoai: 'bien-chung',
    ten: 'Phát hãn quá tay — dương hư lậu hãn',
    han: '漏汗陽虛',
    dieuVan: [20],
    deCuong:
      'Sau khi phát hãn, mồ hôi rỉ ra không dứt, sợ gió, tiểu tiện khó, chân tay co quắp khó duỗi — vệ dương hư không giữ được tân dịch.',
    mach: 'Phù hư',
    trieuChung: ['Ra mồ hôi nhiều', 'Sợ gió', 'Tiểu khó', 'Chuột rút'],
    cauHoiChot: [
      'Mồ hôi có rỉ ra liên tục không dứt không?',
      'Chân tay có co rút, khó duỗi thẳng không?',
      'Tiểu tiện có ít và khó không?',
    ],
    phapTri: 'Điều hoà doanh vệ, ôn kinh phục dương, cố biểu chỉ hãn',
    chuPhuong: {
      ten: 'Quế chi gia Phụ tử thang',
      han: '桂枝加附子湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Quế chi', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Phụ tử', lieuGoc: '1 củ (bào)', vaiTro: 'thần' },
        { ten: 'Thược dược', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '3 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Phụ tử có độc — phải dùng loại đã bào chế, sắc trước; không dùng cho chứng nhiệt.',
    ],
  },
  {
    slug: 'td-linh-que-truat-cam',
    kinh: 'thai-duong',
    phanLoai: 'bien-chung',
    ten: 'Tỳ hư thuỷ đình (đàm ẩm ở trung tiêu)',
    han: '脾虛水停',
    dieuVan: [67],
    deCuong:
      'Sau khi phát hãn hoặc công hạ sai, dưới tim đầy tức, khí xông lên ngực, đứng dậy thì hoa mắt chóng mặt.',
    mach: 'Trầm khẩn',
    luoi: 'Rêu trắng trơn',
    trieuChung: ['Chóng mặt', 'Hồi hộp', 'Đầy bụng', 'Buồn nôn'],
    cauHoiChot: [
      'Đứng dậy có choáng váng, tối sầm mắt không?',
      'Vùng dưới ức có đầy tức, óc ách nước không?',
      'Có cảm giác khí dâng lên ngực không?',
    ],
    phapTri: 'Ôn dương kiện tỳ, lợi thuỷ giáng xung',
    chuPhuong: {
      ten: 'Linh Quế Truật Cam thang',
      han: '苓桂朮甘湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Phục linh', lieuGoc: '4 lạng', vaiTro: 'quân' },
        { ten: 'Quế chi', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Bạch truật', lieuGoc: '2 lạng', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    truyenSang: ['td-suc-thuy'],
  },
  {
    slug: 'td-chi-tu-xi',
    kinh: 'thai-duong',
    phanLoai: 'bien-chung',
    ten: 'Hư phiền không ngủ (nhiệt uất ở ngực cách)',
    han: '虛煩不得眠',
    dieuVan: [76, 77, 78],
    deCuong:
      'Sau khi phát hãn, thổ hoặc hạ, trong lòng bứt rứt không ngủ được, nặng thì trằn trọc vật vã, dưới tim vướng tức mềm (không cứng).',
    mach: 'Sác',
    luoi: 'Đầu lưỡi đỏ, rêu vàng mỏng',
    trieuChung: ['Mất ngủ', 'Bồn chồn', 'Tức ngực'],
    cauHoiChot: [
      'Bứt rứt không ngủ được, trằn trọc phải không?',
      'Ấn vùng dưới ức thấy MỀM hay CỨNG? (mềm → hư phiền; cứng đau → kết hung)',
      'Trước khi bứt rứt mất ngủ, có vừa ra nhiều mồ hôi, nôn ói, hoặc uống thuốc xổ không? (đề cương: bệnh phát SAU khi phát hãn/thổ/hạ)',
    ],
    phapTri: 'Thanh tuyên uất nhiệt, trừ phiền',
    chuPhuong: {
      ten: 'Chi tử xị thang',
      han: '梔子豉湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Chi tử', lieuGoc: '14 quả', vaiTro: 'quân' },
        { ten: 'Hương xị', lieuGoc: '4 hợp', vaiTro: 'thần' },
      ],
    },
    camKy: [
      'Điều 81: người vốn đại tiện lỏng (tỳ hư tiện đường) thì không dùng — Chi tử tính hàn hại tỳ.',
    ],
  },
  {
    slug: 'td-suc-thuy',
    kinh: 'thai-duong',
    phanLoai: 'phu-chung',
    ten: 'Thái Dương phủ chứng — súc thuỷ',
    han: '太陽蓄水證',
    dieuVan: [71, 72, 74],
    deCuong:
      'Biểu chứng chưa hết mà tiểu tiện không thông, khát muốn uống nhưng uống vào thì nôn ra (thuỷ nghịch), bụng dưới đầy — bàng quang khí hoá bất lợi.',
    mach: 'Phù hoặc phù sác',
    luoi: 'Rêu trắng trơn',
    trieuChung: ['Tiểu ít', 'Khát nước', 'Nôn', 'Đầy bụng'],
    cauHoiChot: [
      'Tiểu ít kèm KHÁT mà uống vào lại nôn ra (thuỷ nghịch) phải không? — đó là mốc riêng của súc thuỷ.',
      'Bụng dưới có đầy tức không?',
    ],
    phapTri: 'Hoá khí lợi thuỷ, kiêm giải biểu',
    chuPhuong: {
      ten: 'Ngũ linh tán',
      han: '五苓散',
      dang: 'tan',
      viThuoc: [
        { ten: 'Trạch tả', lieuGoc: '1 lạng 6 thù', vaiTro: 'quân' },
        { ten: 'Trư linh', lieuGoc: '18 thù', vaiTro: 'thần' },
        { ten: 'Phục linh', lieuGoc: '18 thù', vaiTro: 'thần' },
        { ten: 'Bạch truật', lieuGoc: '18 thù', vaiTro: 'tá' },
        { ten: 'Quế chi', lieuGoc: 'nửa lạng', vaiTro: 'sứ' },
      ],
      cachDung:
        'Tán bột, uống với nước ấm, uống xong uống thêm nước nóng cho ra mồ hôi nhẹ.',
    },
    truyenSang: ['td-suc-huyet-nhe'],
  },
  {
    slug: 'td-suc-huyet-nhe',
    kinh: 'thai-duong',
    phanLoai: 'phu-chung',
    ten: 'Thái Dương phủ chứng — súc huyết (nhẹ)',
    han: '太陽蓄血證（輕）',
    dieuVan: [106],
    deCuong:
      'Bụng dưới cấp kết, phát cuồng như điên, TIỂU TIỆN VẪN THÔNG (phân biệt với súc thuỷ), huyết ứ kết ở hạ tiêu; nếu biểu chứng chưa giải thì phải giải biểu trước.',
    mach: 'Trầm sáp hoặc trầm kết',
    luoi: 'Chất lưỡi tím tối hoặc có điểm ứ',
    trieuChung: ['Đau bụng dưới', 'Phát cuồng', 'Táo bón'],
    cauHoiChot: [
      'Tiểu tiện có thông không? (thông → súc huyết; không thông → súc thuỷ)',
      'Bụng dưới có đau cứng, cự án không?',
      'Tinh thần có phát cuồng, nói năng lộn xộn không?',
    ],
    phapTri: 'Hoạt huyết trục ứ, thông hạ tán kết',
    chuPhuong: {
      ten: 'Đào hạch thừa khí thang',
      han: '桃核承氣湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Đào nhân', lieuGoc: '50 hạt', vaiTro: 'quân' },
        { ten: 'Đại hoàng', lieuGoc: '4 lạng', vaiTro: 'quân' },
        { ten: 'Quế chi', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Mang tiêu', lieuGoc: '2 lạng', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Điều 106 dặn: BIỂU CHỨNG CHƯA GIẢI thì chưa được công hạ — phải giải biểu trước, sau mới công ứ.',
      'Phụ nữ có thai cấm dùng.',
    ],
    truyenSang: ['td-suc-huyet-nang'],
  },
  {
    slug: 'td-suc-huyet-nang',
    kinh: 'thai-duong',
    phanLoai: 'phu-chung',
    ten: 'Thái Dương phủ chứng — súc huyết (nặng)',
    han: '太陽蓄血證（重）',
    dieuVan: [124, 125],
    deCuong:
      'Bụng dưới cứng đầy, người phát cuồng, thân vàng, tiểu tiện tự thông, mạch trầm kết — ứ huyết kết chặt đã lâu.',
    mach: 'Trầm kết / vi mà trầm',
    trieuChung: ['Đau bụng dưới', 'Phát cuồng', 'Hay quên', 'Vàng da'],
    cauHoiChot: [
      'Bụng dưới có cứng chắc, sờ thấy khối không?',
      'Có phát cuồng, quên trước quên sau (hỉ vong) không?',
      'Tiểu tiện vẫn thông chứ?',
      'Da hoặc mắt có ngả VÀNG không (không kể bệnh gan mật sẵn có)? — thân hoàng là dấu của súc huyết đã lâu, nghiêng về Để đương thang; không vàng thì cân nhắc mức nhẹ hơn (Đào hạch thừa khí).',
    ],
    phapTri: 'Phá huyết trục ứ (công trục mạnh)',
    chuPhuong: {
      ten: 'Để đương thang',
      han: '抵當湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Thuỷ điệt', lieuGoc: '30 con', vaiTro: 'quân' },
        { ten: 'Manh trùng', lieuGoc: '30 con', vaiTro: 'quân' },
        { ten: 'Đào nhân', lieuGoc: '20 hạt', vaiTro: 'thần' },
        { ten: 'Đại hoàng', lieuGoc: '3 lạng', vaiTro: 'tá' },
      ],
    },
    camKy: [
      'Phương công trục mãnh liệt — thể hư, phụ nữ có thai, người đang xuất huyết đều cấm.',
      'Ứ tan thì dừng ngay, không dùng kéo dài.',
    ],
  },
  {
    slug: 'td-dai-ket-hung',
    kinh: 'thai-duong',
    phanLoai: 'bien-chung',
    ten: 'Kết hung — đại kết hung',
    han: '大結胸證',
    dieuVan: [134, 135, 137],
    deCuong:
      'Công hạ quá sớm, tà nhiệt vào trong kết với thuỷ ẩm: từ dưới tim đến bụng dưới cứng đầy, ĐAU CỰ ÁN (không cho sờ), táo bón, chiều nặng hơn.',
    mach: 'Trầm khẩn / trầm thực có lực',
    luoi: 'Rêu vàng dày khô',
    trieuChung: ['Tức ngực', 'Táo bón', 'Khát nước', 'Đau bụng'],
    cauHoiChot: [
      'Ấn vào vùng ngực bụng có đau dữ, không cho sờ không? (cự án → kết hung; mềm không đau → bĩ chứng)',
      'Có táo bón, miệng khô khát không?',
      'Trước đó đã uống thuốc xổ / thuốc hạ chưa?',
    ],
    phapTri: 'Tả nhiệt trục thuỷ phá kết',
    chuPhuong: {
      ten: 'Đại hãm hung thang',
      han: '大陷胸湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Đại hoàng', lieuGoc: '6 lạng', vaiTro: 'quân' },
        { ten: 'Mang tiêu', lieuGoc: '1 thăng', vaiTro: 'thần' },
        { ten: 'Cam toại', lieuGoc: '1 tiền chuỷ (bột xung)', vaiTro: 'tá' },
      ],
    },
    camKy: [
      'Điều 132: kết hung mà mạch phù đại thì KHÔNG được hạ — hạ là chết.',
      'Điều 133: kết hung đã phiền táo cực độ cũng chết — không còn công được.',
      'Cam toại rất mạnh, được một lần đi ngoài là dừng.',
      'THẬP BÁT PHẢN: Cam toại PHẢN Cam thảo — không phối cùng, kể cả khi hợp với phương khác có Chích cam thảo.',
      'Phụ nữ có thai, thể hư nhược: cấm.',
    ],
  },
  {
    slug: 'td-ban-ha-ta-tam',
    kinh: 'thai-duong',
    phanLoai: 'bien-chung',
    ten: 'Bĩ chứng — hàn nhiệt thác tạp ở trung tiêu',
    han: '痞證（寒熱錯雜）',
    dieuVan: [149],
    deCuong:
      'Dưới tim BĨ ĐẦY mà MỀM, ấn không đau; nôn mửa, sôi bụng, tiêu chảy — hàn nhiệt lẫn lộn, trung tiêu khí cơ bế tắc.',
    mach: 'Huyền hoặc hoãn',
    luoi: 'Rêu vàng trắng lẫn lộn, hơi nhớt',
    trieuChung: ['Đầy bụng', 'Nôn', 'Tiêu chảy', 'Sôi bụng'],
    cauHoiChot: [
      'Ấn vùng dưới ức thấy mềm hay cứng đau? (mềm → bĩ; cứng đau → kết hung)',
      'Có nôn và tiêu chảy cùng lúc không?',
      'Bụng có sôi óc ách không?',
    ],
    phapTri: 'Hoà vị giáng nghịch, tiêu bĩ tán kết (hàn nhiệt cùng dùng)',
    chuPhuong: {
      ten: 'Bán hạ tả tâm thang',
      han: '半夏瀉心湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Bán hạ', lieuGoc: 'nửa thăng', vaiTro: 'quân' },
        { ten: 'Hoàng cầm', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Can khương', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Hoàng liên', lieuGoc: '1 lạng', vaiTro: 'tá' },
        { ten: 'Nhân sâm', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '3 lạng', vaiTro: 'sứ' },
      ],
    },
    ghiChu:
      'Cùng họ: Sinh khương tả tâm thang (điều 157 — thuỷ khí, ợ hơi mùi thức ăn), Cam thảo tả tâm thang (điều 158 — tiêu chảy nhiều lần, tâm phiền).',
  },
  {
    slug: 'td-que-cam-long-mau',
    kinh: 'thai-duong',
    phanLoai: 'bien-chung',
    ten: 'Tâm dương hư — phiền táo kinh sợ',
    han: '心陽虛煩躁',
    dieuVan: [118],
    deCuong:
      'Do phát hãn hoặc hoả kiếp làm tổn tâm dương: hồi hộp trống ngực, phiền táo, dễ giật mình, nặng thì hoảng loạn không yên.',
    mach: 'Phù đại vô lực / kết đại',
    trieuChung: ['Hồi hộp', 'Mất ngủ', 'Bồn chồn', 'Sợ hãi'],
    cauHoiChot: [
      'Có hồi hộp đánh trống ngực, dễ giật mình không?',
      'Trước đó đã ra nhiều mồ hôi hoặc xông hơ chưa?',
      'Đêm có ngủ được không, có hoảng sợ vô cớ không?',
    ],
    phapTri: 'Ôn thông tâm dương, trấn kinh an thần',
    chuPhuong: {
      ten: 'Quế chi Cam thảo Long cốt Mẫu lệ thang',
      han: '桂枝甘草龍骨牡蠣湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Quế chi', lieuGoc: '1 lạng', vaiTro: 'quân' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Long cốt', lieuGoc: '2 lạng', vaiTro: 'tá' },
        { ten: 'Mẫu lệ', lieuGoc: '2 lạng', vaiTro: 'tá' },
      ],
    },
  },
];

/** ─────────────── THIẾU DƯƠNG (少陽) — 8 chứng, bản nháp đợt 2 ───────────────
 * Dựng TRƯỚC Dương Minh vì lý do thực tế, không phải vì sách: quét 24 ca đo gần nhất của phòng
 * chẩn trị thì Thiếu Dương chiếm nhiều nhất (8 ca) còn Thái Dương KHÔNG ca nào — người bệnh đến đây
 * phần lớn là bệnh mạn đã vào bán biểu bán lý, không phải ngoại cảm cấp.
 */
export const CHUNG_THIEU_DUONG: ThuongHanChung[] = [
  {
    slug: 'tduong-chinh-chung',
    kinh: 'thieu-duong',
    phanLoai: 'kinh-chung',
    ten: 'Thiếu Dương chính chứng (bán biểu bán lý)',
    han: '少陽病本證',
    dieuVan: [96, 97, 101, 263, 264],
    deCuong:
      'Miệng đắng, họng khô, hoa mắt; hàn nhiệt qua lại, ngực sườn đầy tức, im lặng không muốn ăn, ' +
      'tâm phiền hay nôn — tà uất ở bán biểu bán lý, khu nữu Thiếu Dương bất lợi.',
    mach: 'Huyền (hoặc huyền tế)',
    luoi: 'Rêu trắng mỏng, hai bên lưỡi hơi đỏ',
    trieuChung: [
      'Miệng đắng',
      'Khô họng',
      'Chóng mặt',
      'Tức ngực',
      'Buồn nôn',
      'Chán ăn',
      'Hàn nhiệt vãng lai',
      'Đau sườn',
      'Ngực sườn trướng đau',
    ],
    cauHoiChot: [
      'Sốt và rét có LUÂN PHIÊN từng cơn không (lúc nóng lúc lạnh)? — khác với sốt kèm sợ lạnh liên tục của Thái Dương',
      'Sáng dậy miệng có đắng, họng khô không?',
      'Hai bên sườn có đầy tức, ấn khó chịu không?',
    ],
    phapTri: 'Hoà giải Thiếu Dương (hoà pháp)',
    chuPhuong: {
      ten: 'Tiểu sài hồ thang',
      han: '小柴胡湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Sài hồ', lieuGoc: '8 lạng', vaiTro: 'quân' },
        { ten: 'Hoàng cầm', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Nhân sâm', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Bán hạ', lieuGoc: 'nửa thăng', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '3 lạng', vaiTro: 'sứ' },
      ],
      cachDung:
        'Sắc, bỏ bã rồi cô lại (khứ tễ tái tiễn) — làm thuốc hoà hoãn, không công không bổ hẳn.',
    },
    giaGiam: [
      {
        khi: 'Ngực phiền mà không nôn',
        thi: 'bỏ Bán hạ, Nhân sâm; gia Qua lâu thực',
      },
      { khi: 'Khát', thi: 'bỏ Bán hạ; gia Nhân sâm, Qua lâu căn' },
      { khi: 'Bụng đau', thi: 'bỏ Hoàng cầm; gia Thược dược' },
      { khi: 'Dưới sườn bĩ cứng', thi: 'bỏ Đại táo; gia Mẫu lệ' },
      {
        khi: 'Tim hồi hộp, tiểu không lợi',
        thi: 'bỏ Hoàng cầm; gia Phục linh',
      },
    ],
    camKy: [
      'Điều 264–265: Thiếu Dương KHÔNG được phát hãn, không được thổ, không được hạ — phạm vào thì thành nghịch (phát hãn gây phiền loạn, hạ gây hồi hộp kinh sợ).',
      'Điều 101: "chỉ cần thấy một chứng là được, không cần đủ cả" — nhưng vẫn phải loại trừ biểu chứng và lý thực trước.',
    ],
    truyenSang: ['tduong-kiem-ly-thuc', 'tduong-kiem-bieu'],
  },
  {
    slug: 'tduong-kiem-bieu',
    kinh: 'thieu-duong',
    phanLoai: 'kiem-chung',
    ten: 'Thiếu Dương kiêm biểu chứng',
    han: '少陽兼太陽表證',
    dieuVan: [146],
    deCuong:
      'Sốt hơi sợ lạnh, khớp chi đau nhức, hơi nôn, dưới tim vướng tức — biểu chứng Thái Dương chưa ' +
      'hết mà tà đã vào Thiếu Dương, hai kinh cùng bệnh.',
    mach: 'Phù huyền',
    trieuChung: [
      'Sốt',
      'Sợ lạnh',
      'Đau khớp',
      'Buồn nôn',
      'Tức ngực',
      'Hàn nhiệt vãng lai',
    ],
    cauHoiChot: [
      'Còn sợ gió sợ lạnh và đau mỏi mình không? (còn → kiêm biểu)',
      'Đã có miệng đắng, nôn, tức sườn chưa?',
      'Sốt rét có thành cơn luân phiên không?',
    ],
    phapTri: 'Hoà giải Thiếu Dương kiêm giải biểu',
    chuPhuong: {
      ten: 'Sài hồ quế chi thang',
      han: '柴胡桂枝湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Sài hồ', lieuGoc: '4 lạng', vaiTro: 'quân' },
        { ten: 'Quế chi', lieuGoc: '1 lạng 12 thù', vaiTro: 'thần' },
        { ten: 'Hoàng cầm', lieuGoc: '1 lạng 12 thù', vaiTro: 'thần' },
        { ten: 'Thược dược', lieuGoc: '1 lạng 12 thù', vaiTro: 'tá' },
        { ten: 'Nhân sâm', lieuGoc: '1 lạng 12 thù', vaiTro: 'tá' },
        { ten: 'Bán hạ', lieuGoc: '2 hợp rưỡi', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '1 lạng 12 thù', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '6 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '1 lạng', vaiTro: 'sứ' },
      ],
    },
    ghiChu:
      'Chính là Tiểu sài hồ thang và Quế chi thang mỗi bên nửa liều hợp lại.',
  },
  {
    slug: 'tduong-kiem-ly-thuc',
    kinh: 'thieu-duong',
    phanLoai: 'kiem-chung',
    ten: 'Thiếu Dương kiêm lý thực (Dương Minh phủ thực)',
    han: '少陽兼陽明裏實',
    dieuVan: [103, 165],
    deCuong:
      'Nôn không dứt, dưới tim cấp kết, uất uất phiền nhiệt, đại tiện bí hoặc tiêu chảy ra nước hôi — ' +
      'Thiếu Dương chưa giải mà Dương Minh đã kết.',
    mach: 'Huyền hữu lực / huyền sác',
    luoi: 'Rêu vàng',
    trieuChung: [
      'Buồn nôn',
      'Táo bón',
      'Tức ngực',
      'Đau bụng',
      'Sốt',
      'Đau sườn',
      'Ngực sườn trướng đau',
    ],
    cauHoiChot: [
      'Nôn có dữ dội và không dứt không?',
      'Đại tiện mấy ngày rồi, có bí không? (bí + tức sườn → Đại sài hồ)',
      'Vùng dưới ức ấn vào có cứng và đau không?',
    ],
    phapTri: 'Hoà giải Thiếu Dương kiêm thông hạ lý thực',
    chuPhuong: {
      ten: 'Đại sài hồ thang',
      han: '大柴胡湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Sài hồ', lieuGoc: '8 lạng', vaiTro: 'quân' },
        { ten: 'Hoàng cầm', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Đại hoàng', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Chỉ thực', lieuGoc: '4 quả', vaiTro: 'tá' },
        { ten: 'Thược dược', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Bán hạ', lieuGoc: 'nửa thăng', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '5 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
      ],
    },
    camKy: [
      'Chỉ dùng khi lý thực đã rõ — Thiếu Dương đơn thuần mà hạ là phạm cấm kỵ (điều 264).',
      'Thể hư, người già suy nhược phải cân nhắc: phương có Đại hoàng, Chỉ thực công hạ.',
    ],
  },
  {
    slug: 'tduong-kiem-thuy-am',
    kinh: 'thieu-duong',
    phanLoai: 'kiem-chung',
    ten: 'Thiếu Dương kiêm thuỷ ẩm, tân dịch tổn',
    han: '少陽兼水飲內結',
    dieuVan: [147],
    deCuong:
      'Ngực sườn đầy tức hơi kết, tiểu tiện không lợi, khát mà không nôn, đầu ra mồ hôi, hàn nhiệt ' +
      'qua lại, tâm phiền — Thiếu Dương uất kèm thuỷ ẩm, dương khí bị át.',
    mach: 'Huyền tế',
    trieuChung: [
      'Tức ngực',
      'Tiểu ít',
      'Khát nước',
      'Ra mồ hôi nhiều',
      'Mất ngủ',
      'Hàn nhiệt vãng lai',
      'Đau sườn',
    ],
    cauHoiChot: [
      'Tiểu tiện có ít và khó không?',
      'Khát nhưng có nôn không? (khát mà KHÔNG nôn là dấu của chứng này)',
      'Có ra mồ hôi riêng vùng đầu không?',
    ],
    phapTri: 'Hoà giải Thiếu Dương, ôn hoá thuỷ ẩm',
    chuPhuong: {
      ten: 'Sài hồ quế chi can khương thang',
      han: '柴胡桂枝乾薑湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Sài hồ', lieuGoc: '8 lạng', vaiTro: 'quân' },
        { ten: 'Quế chi', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Can khương', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Qua lâu căn', lieuGoc: '4 lạng', vaiTro: 'tá' },
        { ten: 'Hoàng cầm', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Mẫu lệ', lieuGoc: '2 lạng', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
  },
  {
    slug: 'tduong-phien-kinh',
    kinh: 'thieu-duong',
    phanLoai: 'bien-chung',
    ten: 'Thiếu Dương kiêm phiền kinh (đàm nhiệt nhiễu thần)',
    han: '少陽兼煩驚',
    dieuVan: [107],
    deCuong:
      'Sau khi hạ sai: ngực đầy phiền kinh, tiểu tiện không lợi, nói sảng, mình nặng khó trở mình — ' +
      'tà nhiệt lan khắp tam dương, đàm nhiệt quấy thần minh.',
    mach: 'Huyền sác',
    luoi: 'Rêu vàng nhớt',
    trieuChung: [
      'Nói sảng',
      'Mất ngủ',
      'Bồn chồn',
      'Hồi hộp',
      'Tức ngực',
      'Tiểu ít',
      'Đau sườn',
    ],
    cauHoiChot: [
      'Có dễ giật mình, hoảng sợ, ngủ không yên không?',
      'Người có nặng nề, trở mình khó không?',
      'Trước đó đã dùng thuốc xổ chưa?',
    ],
    phapTri: 'Hoà giải Thiếu Dương, thông dương tiết nhiệt, trọng trấn an thần',
    chuPhuong: {
      ten: 'Sài hồ gia long cốt mẫu lệ thang',
      han: '柴胡加龍骨牡蠣湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Sài hồ', lieuGoc: '4 lạng', vaiTro: 'quân' },
        { ten: 'Long cốt', lieuGoc: '1 lạng 12 thù', vaiTro: 'thần' },
        { ten: 'Mẫu lệ', lieuGoc: '1 lạng 12 thù', vaiTro: 'thần' },
        { ten: 'Hoàng cầm', lieuGoc: '1 lạng 12 thù', vaiTro: 'tá' },
        { ten: 'Nhân sâm', lieuGoc: '1 lạng 12 thù', vaiTro: 'tá' },
        { ten: 'Quế chi', lieuGoc: '1 lạng 12 thù', vaiTro: 'tá' },
        { ten: 'Phục linh', lieuGoc: '1 lạng 12 thù', vaiTro: 'tá' },
        { ten: 'Bán hạ', lieuGoc: '2 hợp', vaiTro: 'tá' },
        { ten: 'Đại hoàng', lieuGoc: '2 lạng', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '1 lạng 12 thù', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '6 quả', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Có Đại hoàng — người tỳ vị hư hàn, đại tiện lỏng phải bỏ hoặc giảm.',
      'BÀI GỐC CÓ 11 VỊ; ở đây LƯỢC Duyên đan (鉛丹 — oxit chì) vì độc chì tích luỹ, hiện đại không dùng.',
    ],
  },
  {
    slug: 'tduong-nhiet-nhap-huyet-that',
    kinh: 'thieu-duong',
    phanLoai: 'bien-chung',
    ten: 'Nhiệt nhập huyết thất',
    han: '熱入血室',
    dieuVan: [143, 144, 145],
    deCuong:
      'Phụ nữ đang hành kinh mà mắc ngoại cảm: kinh nguyệt tự dứt hoặc ra bất thường, ban ngày tỉnh ' +
      'táo, ban đêm nói sảng như thấy ma quỷ, hàn nhiệt qua lại — tà nhiệt thừa lúc huyết thất trống mà vào.',
    mach: 'Huyền sác',
    trieuChung: [
      'Sốt',
      'Mất ngủ',
      'Rối loạn kinh nguyệt',
      'Bồn chồn',
      'Hàn nhiệt vãng lai',
    ],
    cauHoiChot: [
      'Có đang hoặc vừa hành kinh khi phát bệnh không?',
      'Ban đêm có nói mê, kích động hơn ban ngày không?',
      'Kinh nguyệt có tự dứt sớm hoặc ra kéo dài không?',
    ],
    phapTri: 'Hoà giải Thiếu Dương, thanh nhiệt lương huyết',
    chuPhuong: {
      ten: 'Tiểu sài hồ thang (gia giảm)',
      han: '小柴胡湯加減',
      dang: 'thang',
      viThuoc: [
        { ten: 'Sài hồ', lieuGoc: '8 lạng', vaiTro: 'quân' },
        { ten: 'Hoàng cầm', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Nhân sâm', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Bán hạ', lieuGoc: 'nửa thăng', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '3 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Điều 144 dặn không được công hạ bừa (vô phạm vị khí cập thượng nhị tiêu).',
    ],
    ghiChu:
      'Lâm sàng thường gia Đan bì, Sinh địa, Đào nhân để lương huyết hoá ứ.',
  },
  {
    slug: 'tduong-hoang-cam-thang',
    kinh: 'thieu-duong',
    phanLoai: 'kiem-chung',
    ten: 'Hợp bệnh Thái Dương – Thiếu Dương, tự tiêu chảy',
    han: '太陽少陽合病自下利',
    dieuVan: [172],
    deCuong:
      'Hai kinh cùng bệnh mà tự tiêu chảy, phân nóng hôi, bụng đau, hậu môn nóng rát — nhiệt tà bức ' +
      'xuống đại trường.',
    mach: 'Huyền sác',
    luoi: 'Rêu vàng NHỜN (thấp nhiệt ở đại trường)',
    trieuChung: ['Tiêu chảy', 'Đau bụng', 'Sốt', 'Khát nước'],
    cauHoiChot: [
      'Phân có nóng, mùi hôi khẳn, hậu môn rát không? (nhiệt lợi, khác hư hàn)',
      'Có kèm nôn không? (có nôn → gia Bán hạ, Sinh khương)',
      'Bụng đau quặn từng cơn phải không?',
    ],
    phapTri: 'Thanh nhiệt chỉ lợi, hoà trung chỉ thống',
    chuPhuong: {
      ten: 'Hoàng cầm thang',
      han: '黃芩湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Hoàng cầm', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Thược dược', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    giaGiam: [
      {
        khi: 'Kèm nôn',
        thi: 'gia Bán hạ nửa thăng, Sinh khương 3 lạng (Hoàng cầm gia Bán hạ Sinh khương thang)',
      },
    ],
    camKy: [
      'Tiêu chảy do hư hàn (phân sống, sợ lạnh, mạch trầm trì) thì cấm — thuốc tính hàn.',
    ],
  },
  {
    slug: 'tduong-sai-ho-mang-tieu',
    kinh: 'thieu-duong',
    phanLoai: 'bien-chung',
    ten: 'Thiếu Dương kiêm lý thực nhẹ sau khi hạ sai',
    han: '柴胡加芒硝證',
    dieuVan: [104],
    deCuong:
      'Bệnh mười mấy ngày, đã dùng thuốc hạ nhiều lần: hàn nhiệt qua lại vẫn còn, chiều tối sốt cơn, ' +
      'đại tiện vẫn bí nhẹ — chính khí đã tổn, tà kết chưa tan.',
    mach: 'Huyền tế',
    trieuChung: [
      'Sốt',
      'Táo bón',
      'Tức ngực',
      'Chán ăn',
      'Hàn nhiệt vãng lai',
      'Đau sườn',
    ],
    cauHoiChot: [
      'Chiều tối có sốt cơn (nhật bô triều nhiệt) không?',
      'Đã dùng thuốc xổ mấy lần rồi?',
      'Người có mệt lả, ăn kém hẳn không? (chính khí đã tổn — không dùng công hạ mạnh)',
    ],
    phapTri: 'Hoà giải Thiếu Dương, nhuyễn kiên tả nhiệt nhẹ nhàng',
    chuPhuong: {
      ten: 'Sài hồ gia mang tiêu thang',
      han: '柴胡加芒硝湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Sài hồ', lieuGoc: '2 lạng 16 thù', vaiTro: 'quân' },
        { ten: 'Mang tiêu', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Hoàng cầm', lieuGoc: '1 lạng', vaiTro: 'tá' },
        { ten: 'Nhân sâm', lieuGoc: '1 lạng', vaiTro: 'tá' },
        { ten: 'Bán hạ', lieuGoc: '20 thù', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '1 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '4 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '1 lạng', vaiTro: 'sứ' },
      ],
      cachDung: 'Mang tiêu hoà vào nước thuốc đã sắc, không đun cùng.',
    },
    camKy: [
      'Đã hạ nhiều lần, chính khí tổn — không được dùng Đại thừa khí công mạnh nữa (điều 104).',
    ],
  },
];

/** ─────────────── THÁI ÂM (太陰) — 6 chứng, đợt 3 ───────────────
 * Tống bản ít điều (273–280) nhưng là kinh gặp nhiều ở phòng chẩn trị (76 pháp trị đã gắn kinh này).
 * Trục chính: TỲ DƯƠNG HƯ, hàn thấp nội thịnh — trái hẳn Dương Minh (lý thực nhiệt).
 */
export const CHUNG_THAI_AM: ThuongHanChung[] = [
  {
    slug: 'tam-chinh-chung',
    kinh: 'thai-am',
    phanLoai: 'kinh-chung',
    ten: 'Thái Âm chính chứng (tỳ dương hư, hàn thấp)',
    han: '太陰病本證',
    dieuVan: [273, 277],
    deCuong:
      'Bụng đầy mà nôn, ăn không xuống, tiêu chảy ngày càng nặng, bụng đau từng cơn, ĐAU THÍCH XOA ẤN — tỳ dương hư yếu, hàn thấp ứ đọng. Điều 277: "tự lợi mà không khát là thuộc Thái Âm, vì tạng có hàn, nên ôn."',
    mach: 'Trầm hoãn / trầm tế vô lực',
    luoi: 'Lưỡi nhạt bệu, rêu trắng trơn ướt',
    trieuChung: [
      'Bụng Đầy Trướng',
      'Nôn Mửa',
      'Tiêu chảy',
      'chán ăn',
      'Đau Bụng',
      'Sợ Lạnh',
      'Mệt mỏi',
    ],
    cauHoiChot: [
      'Bụng đau có THÍCH xoa ấn, chườm ấm không? (thích ấn → hư hàn; cự án → thực)',
      'Tiêu chảy có KHÁT nước không? (không khát là dấu của Thái Âm)',
      'Phân có sống, lẫn thức ăn chưa tiêu không?',
    ],
    phapTri: 'Ôn trung tán hàn, kiện tỳ táo thấp',
    chuPhuong: {
      ten: 'Lý trung thang',
      han: '理中湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Nhân sâm', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Can khương', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Bạch truật', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '3 lạng', vaiTro: 'sứ' },
      ],
    },
    giaGiam: [
      { khi: 'Hàn nhiều (điều 386)', thi: 'gia Can khương cho đủ 4 lạng rưỡi' },
      {
        khi: 'Nôn nhiều (điều 386)',
        thi: 'bỏ Bạch truật, gia Sinh khương 3 lạng',
      },
      { khi: 'Bụng đầy (điều 386)', thi: 'bỏ Bạch truật, gia Phụ tử 1 củ' },
      { khi: 'Hồi hộp (điều 386)', thi: 'gia Phục linh 2 lạng' },
      { khi: 'Bụng đau (điều 386)', thi: 'gia Nhân sâm cho đủ 4 lạng rưỡi' },
    ],
    camKy: [
      'Điều 273: KHÔNG được công hạ — "nếu hạ nhầm thì dưới ngực kết cứng".',
      'Chứng nhiệt, lưỡi đỏ rêu vàng khô thì cấm (phương toàn vị ôn táo).',
    ],
    truyenSang: ['tam-tu-nghich', 'tam-bung-dau'],
  },
  {
    slug: 'tam-kiem-bieu',
    kinh: 'thai-am',
    phanLoai: 'kiem-chung',
    ten: 'Thái Âm kiêm biểu chứng',
    han: '太陰兼表證',
    dieuVan: [276],
    deCuong:
      'Thái Âm bệnh mà mạch PHÙ — tà còn ở biểu, chưa vào sâu; vẫn nên giải biểu trước.',
    mach: 'Phù',
    trieuChung: ['Sốt', 'Sợ gió', 'Đau đầu', 'Tiêu chảy', 'Bụng Đầy Trướng'],
    cauHoiChot: [
      'Còn sợ gió, đau đầu, mạch nổi không? (còn → giải biểu trước)',
      'Tiêu chảy có kèm sốt không?',
      'Người có đau mỏi không?',
    ],
    phapTri: 'Giải cơ phát biểu (biểu giải thì lý tự hoà)',
    chuPhuong: {
      ten: 'Quế chi thang',
      han: '桂枝湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Quế chi', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Thược dược', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
        { ten: 'Sinh khương', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
      ],
    },
    ghiChu:
      'Điều 276: "Thái Âm bệnh, mạch phù, có thể phát hãn, nên dùng Quế chi thang."',
  },
  {
    slug: 'tam-bung-dau',
    kinh: 'thai-am',
    phanLoai: 'bien-chung',
    ten: 'Thái Âm khí huyết bất hoà, bụng đau',
    han: '太陰腹痛',
    dieuVan: [279],
    deCuong:
      'Sau khi hạ nhầm, bụng đầy đau từng cơn — tỳ lạc bất hoà, khí huyết ứ trệ ở trung tiêu.',
    mach: 'Huyền hoãn',
    trieuChung: ['Đau Bụng', 'Bụng Đầy Trướng'],
    cauHoiChot: [
      'Bụng đau từng cơn hay đau liên tục?',
      'Đau có kèm đại tiện bí, ấn vào cứng không? (có → thêm Đại hoàng)',
      'Trước đó đã dùng thuốc xổ chưa?',
      'Có tiêu chảy và nôn rõ không? (có rõ → là Thái Âm chính chứng, dùng Lý trung; ở đây chủ yếu chỉ đau bụng)',
    ],
    phapTri: 'Hoà lý hoãn cấp, điều hoà khí huyết',
    chuPhuong: {
      ten: 'Quế chi gia thược dược thang',
      han: '桂枝加芍藥湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Thược dược', lieuGoc: '6 lạng', vaiTro: 'quân' },
        { ten: 'Quế chi', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
        { ten: 'Sinh khương', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'tá' },
      ],
    },
    giaGiam: [
      {
        khi: 'Đau nặng, có thực tích',
        thi: 'gia Đại hoàng 2 lạng → Quế chi gia đại hoàng thang',
      },
    ],
    camKy: ['Điều 280: người vốn tỳ vị yếu, đại tiện lỏng thì phải giảm liều.'],
  },
  {
    slug: 'tam-phat-hoang',
    kinh: 'thai-am',
    phanLoai: 'bien-chung',
    ten: 'Thái Âm hàn thấp phát hoàng (âm hoàng)',
    han: '太陰寒濕發黃',
    dieuVan: [259],
    deCuong:
      'Da vàng TỐI XỈN như khói ám, người lạnh, bụng đầy, tiêu lỏng — hàn thấp uất ở trung tiêu; khác hẳn dương hoàng vàng tươi của Dương Minh thấp nhiệt.',
    mach: 'Trầm trì',
    luoi: 'Lưỡi nhạt, rêu trắng nhờn',
    trieuChung: [
      'Vàng da',
      'Bụng Đầy Trướng',
      'Tiêu chảy',
      'Sợ Lạnh',
      'Mệt mỏi',
    ],
    cauHoiChot: [
      'Da vàng TƯƠI sáng hay vàng TỐI xỉn? (tối xỉn → âm hoàng, hàn thấp)',
      'Người có lạnh, sợ rét, chân tay mát không?',
      'Tiểu tiện màu gì, có vàng sẫm không?',
    ],
    phapTri: 'Ôn trung hoá thấp, kiện tỳ lợi đởm',
    chuPhuong: {
      ten: 'Nhân trần ngũ linh tán',
      han: '茵陳五苓散',
      dang: 'tan',
      viThuoc: [
        { ten: 'Nhân trần', lieuGoc: '10 phần', vaiTro: 'quân' },
        { ten: 'Trạch tả', lieuGoc: '1 lạng 6 thù', vaiTro: 'thần' },
        { ten: 'Trư linh', lieuGoc: '18 thù', vaiTro: 'tá' },
        { ten: 'Phục linh', lieuGoc: '18 thù', vaiTro: 'tá' },
        { ten: 'Bạch truật', lieuGoc: '18 thù', vaiTro: 'tá' },
        { ten: 'Quế chi', lieuGoc: 'nửa lạng', vaiTro: 'sứ' },
      ],
    },
    ghiChu:
      'Điều 259: "thân hoàng nên tìm ở trong hàn thấp" — không dùng phép thanh lợi của dương hoàng.',
  },
  {
    slug: 'tam-tu-nghich',
    kinh: 'thai-am',
    phanLoai: 'bien-chung',
    ten: 'Thái Âm hư hàn nặng, tạng khí suy',
    han: '太陰虛寒重證',
    dieuVan: [277, 372],
    deCuong:
      'Tiêu chảy nhiều lần phân sống, bụng lạnh đau, chân tay lạnh, tinh thần mệt lả — tỳ thận dương đều suy, đã vượt khỏi phạm vi Lý trung thang.',
    mach: 'Trầm vi vô lực',
    luoi: 'Lưỡi nhạt bệu, rêu trắng trơn',
    trieuChung: [
      'Tiêu chảy',
      'Chân tay lạnh',
      'Đau Bụng',
      'Sợ Lạnh',
      'Mệt mỏi',
      'chán ăn',
    ],
    cauHoiChot: [
      'Chân tay có lạnh quá cổ tay, cổ chân không?',
      'Phân có sống nguyên thức ăn không?',
      'Người có mệt lả, chỉ muốn nằm không?',
    ],
    phapTri: 'Hồi dương cứu nghịch, ôn bổ tỳ thận',
    chuPhuong: {
      ten: 'Tứ nghịch thang',
      han: '四逆湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Phụ tử', lieuGoc: '1 củ (sống)', vaiTro: 'quân' },
        { ten: 'Can khương', lieuGoc: '1 lạng 12 thù', vaiTro: 'thần' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    ghiChu:
      'Cùng chủ phương với chứng Thiếu Âm hàn hoá (tha-han-hoa): khi kết quả đo mơ hồ giữa Thái Âm và Thiếu Âm thì không phải phân vân — cả hai đều ra Tứ nghịch thang.',
    camKy: [
      'Nguyên bản dùng Phụ tử SỐNG (sinh dụng) để hồi dương gấp; lâm sàng hiện đại hầu hết dùng loại ĐÃ BÀO CHẾ và sắc trước 30–60 phút. Chọn loại nào là quyết định của thầy thuốc.',
      'Chứng nhiệt giả hàn thì cấm.',
      'Dương hồi rồi phải đổi phương ôn bổ, không dùng kéo dài.',
    ],
  },
  {
    slug: 'tam-hoac-loan',
    kinh: 'thai-am',
    phanLoai: 'bien-chung',
    ten: 'Hoắc loạn hư hàn (nôn và tiêu chảy cùng lúc)',
    han: '霍亂虛寒證',
    dieuVan: [386],
    deCuong:
      'Vừa nôn vừa tiêu chảy dữ dội, đau bụng, người lạnh, KHÔNG KHÁT — trung tiêu hư hàn, thăng giáng đảo loạn.',
    mach: 'Trầm tế',
    luoi: 'Rêu trắng',
    trieuChung: ['Nôn Mửa', 'Tiêu chảy', 'Đau Bụng', 'Sợ Lạnh'],
    cauHoiChot: [
      'Nôn và tiêu chảy có xảy ra cùng lúc không?',
      'Có KHÁT nước không? (khát → Ngũ linh tán; không khát → Lý trung hoàn)',
      'Người lạnh hay nóng?',
    ],
    phapTri: 'Ôn trung khử hàn, kiện tỳ chỉ tả',
    chuPhuong: {
      ten: 'Lý trung hoàn',
      han: '理中丸',
      dang: 'hoan',
      viThuoc: [
        { ten: 'Nhân sâm', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Can khương', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Bạch truật', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '3 lạng', vaiTro: 'sứ' },
      ],
      cachDung:
        'Tán bột luyện mật làm hoàn, uống ấm. Điều 386: nếu khát thì dùng Ngũ linh tán thay.',
    },
    camKy: [
      'Cùng bài với Lý trung thang: chứng nhiệt, lưỡi đỏ rêu vàng khô thì cấm (toàn vị ôn táo).',
    ],
  },
];

/** ─────────────── DƯƠNG MINH (陽明) — 7 chứng, đợt 4 ───────────────
 * Đề cương điều 180: "Vị gia thực". Trục: LÝ THỰC NHIỆT — đối cực của Thái Âm (lý hư hàn).
 * Chia hai nhánh phải phân cho rõ: KINH chứng (nhiệt lan khắp, chưa kết thành khối → thanh) và
 * PHỦ chứng (táo thực kết ở trường vị → hạ). Nhầm nhánh: kinh chứng mà hạ là làm hao tân dịch.
 */
export const CHUNG_DUONG_MINH: ThuongHanChung[] = [
  {
    slug: 'dm-kinh-chung',
    kinh: 'duong-minh',
    phanLoai: 'kinh-chung',
    ten: 'Dương Minh kinh chứng (tứ đại)',
    han: '陽明經證',
    dieuVan: [176, 182, 219],
    deCuong:
      'ĐẠI NHIỆT toàn thân, ĐẠI HÃN ra dầm dề, ĐẠI KHÁT thích uống lạnh, mạch HỒNG ĐẠI — nhiệt tà lan khắp dương minh mà chưa kết thành khối; "không sợ lạnh, ngược lại sợ nóng" (điều 182).',
    mach: 'Hồng đại có lực',
    luoi: 'Lưỡi đỏ, rêu vàng khô',
    trieuChung: [
      'Sốt cao',
      'Ra mồ hôi nhiều',
      'khát nước',
      'Sợ Nóng',
      'Tâm Phiền',
    ],
    cauHoiChot: [
      'Người sợ NÓNG hay sợ lạnh? (sợ nóng, hất chăn → Dương Minh)',
      'Khát có thích uống nước LẠNH và uống nhiều không?',
      'Đại tiện có bí kết không? (chưa bí → kinh chứng, thanh; bí kết → phủ chứng, hạ)',
      'Người còn sức hay đã mệt lả, hụt hơi, nói yếu? (đã hao khí → Bạch hổ GIA NHÂN SÂM, không dùng Bạch hổ trơn)',
    ],
    phapTri: 'Thanh nhiệt sinh tân (thanh pháp)',
    chuPhuong: {
      ten: 'Bạch hổ thang',
      han: '白虎湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Thạch cao', lieuGoc: '1 cân', vaiTro: 'quân' },
        { ten: 'Tri mẫu', lieuGoc: '6 lạng', vaiTro: 'thần' },
        { ten: 'Ngạnh mễ', lieuGoc: '6 hợp', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Điều 170: biểu chứng chưa giải, không ra mồ hôi mà sợ lạnh thì KHÔNG được dùng Bạch hổ.',
      'Mạch phù hoặc mạch tế vô lực (hư hàn giả nhiệt) thì cấm — thuốc đại hàn.',
    ],
    truyenSang: ['dm-bach-ho-nhan-sam', 'dm-dieu-vi-thua-khi'],
  },
  {
    slug: 'dm-bach-ho-nhan-sam',
    kinh: 'duong-minh',
    phanLoai: 'kinh-chung',
    ten: 'Dương Minh nhiệt thịnh, khí âm lưỡng thương',
    han: '陽明熱盛氣陰兩傷',
    dieuVan: [26, 168, 169, 222],
    deCuong:
      'Nhiệt như Bạch hổ chứng nhưng KHÁT DỮ DỘI uống mãi không đã, lưỡi khô, người mệt lả, mạch hồng đại mà vô lực — nhiệt đã hao cả khí lẫn tân.',
    mach: 'Hồng đại vô lực',
    luoi: 'Lưỡi đỏ khô, ít tân',
    trieuChung: [
      'Sốt cao',
      'khát nước',
      'Ra mồ hôi nhiều',
      'Mệt mỏi',
      'Khô họng',
    ],
    cauHoiChot: [
      'Uống nước liên tục mà vẫn khát phải không?',
      'Người có mệt lả, hụt hơi, nói yếu không? (khí đã thương)',
      'Lưỡi có khô, ít nước bọt không?',
    ],
    phapTri: 'Thanh nhiệt ích khí sinh tân',
    chuPhuong: {
      ten: 'Bạch hổ gia nhân sâm thang',
      han: '白虎加人參湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Thạch cao', lieuGoc: '1 cân', vaiTro: 'quân' },
        { ten: 'Tri mẫu', lieuGoc: '6 lạng', vaiTro: 'thần' },
        { ten: 'Nhân sâm', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Ngạnh mễ', lieuGoc: '6 hợp', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: ['Vẫn là thuốc đại hàn — biểu chứng chưa giải hoặc hư hàn thì cấm.'],
  },
  {
    slug: 'dm-dieu-vi-thua-khi',
    kinh: 'duong-minh',
    phanLoai: 'phu-chung',
    ten: 'Dương Minh phủ thực nhẹ (táo nhiệt, chưa bĩ mãn)',
    han: '陽明腑實輕證',
    dieuVan: [207, 248, 249],
    deCuong:
      'Sốt cơn, tâm phiền, đại tiện bí, bụng hơi đầy mà KHÔNG trướng cứng rõ — táo nhiệt kết ở vị trường nhưng khí trệ chưa nặng.',
    mach: 'Sác hữu lực',
    luoi: 'Rêu vàng khô',
    trieuChung: ['Táo Bón', 'Sốt', 'Tâm Phiền', 'Bụng Chướng'],
    cauHoiChot: [
      'Bụng có trướng cứng, ấn đau nhiều không? (chưa nhiều → Điều vị thừa khí)',
      'Đại tiện mấy ngày chưa đi?',
      'Có sốt thành cơn về chiều không?',
    ],
    phapTri: 'Hoãn hạ nhiệt kết, điều hoà vị khí',
    chuPhuong: {
      ten: 'Điều vị thừa khí thang',
      han: '調胃承氣湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Đại hoàng', lieuGoc: '4 lạng', vaiTro: 'quân' },
        { ten: 'Mang tiêu', lieuGoc: 'nửa thăng', vaiTro: 'thần' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
      cachDung:
        'Sắc Đại hoàng, Cam thảo; bỏ bã rồi hoà Mang tiêu, đun sôi nhẹ. Uống ấm từng ít một.',
    },
    truyenSang: ['dm-tieu-thua-khi'],
    camKy: [
      'Chưa chắc có táo thực thì chưa hạ — "chưa đủ chứng mà hạ là hư hư".',
    ],
  },
  {
    slug: 'dm-tieu-thua-khi',
    kinh: 'duong-minh',
    phanLoai: 'phu-chung',
    ten: 'Dương Minh phủ thực vừa (bĩ mãn, chưa táo kiên)',
    han: '陽明腑實中證',
    dieuVan: [213, 214, 250],
    deCuong:
      'Bụng đầy trướng, đại tiện bí, sốt cơn, có thể nói sảng nhẹ — khí trệ rõ mà táo kết chưa cứng như Đại thừa khí.',
    mach: 'Hoạt mà tật',
    luoi: 'Rêu vàng dày',
    trieuChung: ['Bụng Đầy Trướng', 'Táo Bón', 'Sốt', 'Bụng Chướng'],
    cauHoiChot: [
      'Bụng đầy trướng nhiều hay chỉ hơi đầy?',
      'Có nói sảng, lẫn lộn không?',
      'Sờ bụng có cứng như đá, ấn đau dữ không? (có → Đại thừa khí)',
      'Uống thử một liều nhẹ có TRUNG TIỆN được không? (điều 209: trung tiện được là có táo phân, mới công tiếp; không thì dừng)',
    ],
    phapTri: 'Khinh hạ nhiệt kết, hành khí trừ mãn',
    chuPhuong: {
      ten: 'Tiểu thừa khí thang',
      han: '小承氣湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Đại hoàng', lieuGoc: '4 lạng', vaiTro: 'quân' },
        { ten: 'Hậu phác', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Chỉ thực', lieuGoc: '3 quả', vaiTro: 'tá' },
      ],
    },
    truyenSang: ['dm-dai-thua-khi'],
    camKy: [
      'Điều 209: dùng thử Tiểu thừa khí, nếu không trung tiện được thì đừng công tiếp — chưa có táo phân.',
    ],
  },
  {
    slug: 'dm-dai-thua-khi',
    kinh: 'duong-minh',
    phanLoai: 'phu-chung',
    ten: 'Dương Minh phủ thực nặng (bĩ mãn táo thực đủ)',
    han: '陽明腑實重證',
    dieuVan: [212, 220, 238, 241],
    deCuong:
      'Sốt cơn về chiều, mồ hôi tay chân dầm dề, bụng trướng đầy CỨNG ĐAU CỰ ÁN, đại tiện bí kết, nói sảng, nặng thì thần chí mê man — bĩ, mãn, táo, thực đủ cả bốn.',
    mach: 'Trầm thực hữu lực',
    luoi: 'Rêu vàng dày khô, có gai',
    trieuChung: [
      'Táo Bón',
      'Bụng Đầy Trướng',
      'Sốt cao',
      'Đau Bụng',
      'Ra mồ hôi nhiều',
    ],
    cauHoiChot: [
      'Bụng có cứng, ấn đau dữ, không cho sờ không?',
      'Sốt có thành cơn về chiều tối (nhật bô triều nhiệt) không?',
      'Mồ hôi có ra nhiều ở tay chân không? Có nói sảng không?',
      'Đã thử liều nhẹ và TRUNG TIỆN được chưa? (điều 209 — chưa thử mà công mạnh là liều lĩnh)',
    ],
    phapTri: 'Tuấn hạ nhiệt kết (công hạ mạnh)',
    chuPhuong: {
      ten: 'Đại thừa khí thang',
      han: '大承氣湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Đại hoàng', lieuGoc: '4 lạng', vaiTro: 'quân' },
        { ten: 'Mang tiêu', lieuGoc: '3 hợp', vaiTro: 'thần' },
        { ten: 'Hậu phác', lieuGoc: 'nửa cân', vaiTro: 'tá' },
        { ten: 'Chỉ thực', lieuGoc: '5 quả', vaiTro: 'tá' },
      ],
      cachDung:
        'Sắc Hậu phác, Chỉ thực trước; cho Đại hoàng vào sau; bỏ bã rồi hoà Mang tiêu. Đi được là DỪNG.',
    },
    camKy: [
      'Điều 204–205: nôn nhiều, bụng đầy mà không đau cự án, hoặc biểu chứng chưa giải — KHÔNG được hạ.',
      'Người già, thể hư, phụ nữ có thai: cấm hoặc phải cân nhắc kỹ.',
      'Đi ngoài được rồi thì ngừng ngay, không uống tiếp.',
    ],
  },
  {
    slug: 'dm-phat-hoang',
    kinh: 'duong-minh',
    phanLoai: 'bien-chung',
    ten: 'Dương Minh thấp nhiệt phát hoàng (dương hoàng)',
    han: '陽明濕熱發黃',
    dieuVan: [236, 260],
    deCuong:
      'Da vàng TƯƠI SÁNG như quả quýt, sốt, khát, tiểu ít sẫm màu, bụng hơi đầy, không ra mồ hôi hoặc chỉ ra ở đầu — thấp nhiệt uất kết không thoát.',
    mach: 'Hoạt sác',
    luoi: 'Rêu vàng nhờn',
    trieuChung: ['Vàng da', 'Sốt', 'khát nước', 'Tiểu Ít', 'Bụng Chướng'],
    cauHoiChot: [
      'Da vàng TƯƠI sáng hay tối xỉn? (tươi sáng → dương hoàng, thấp nhiệt)',
      'Tiểu tiện có ít và sẫm màu như nước chè đặc không?',
      'Người nóng, khát, mồ hôi chỉ ra ở đầu phải không?',
    ],
    phapTri: 'Thanh nhiệt lợi thấp, thoái hoàng',
    chuPhuong: {
      ten: 'Nhân trần cao thang',
      han: '茵陳蒿湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Nhân trần', lieuGoc: '6 lạng', vaiTro: 'quân' },
        { ten: 'Chi tử', lieuGoc: '14 quả', vaiTro: 'thần' },
        { ten: 'Đại hoàng', lieuGoc: '2 lạng', vaiTro: 'tá' },
      ],
      cachDung:
        'Sắc Nhân trần trước, rồi cho hai vị kia. Uống xong tiểu nhiều, nước tiểu sẫm như nước bồ kết là thuốc có công.',
    },
    camKy: [
      'Âm hoàng (vàng tối xỉn, người lạnh, tiêu lỏng) thì CẤM — phải ôn hoá, xem chứng Thái Âm hàn thấp phát hoàng.',
    ],
  },
  {
    slug: 'dm-ty-uoc',
    kinh: 'duong-minh',
    phanLoai: 'bien-chung',
    ten: 'Tỳ ước (táo bón do tân dịch thiếu)',
    han: '脾約證',
    dieuVan: [247],
    deCuong:
      'Đại tiện khô cứng khó đi nhưng người KHÔNG sốt cao, không trướng đau dữ; tiểu nhiều lần — vị nhiệt làm tân dịch bị hút về bàng quang, ruột mất nhu nhuận.',
    mach: 'Phù sáp',
    luoi: 'Lưỡi đỏ, rêu vàng mỏng khô',
    trieuChung: ['Táo Bón', 'Tiểu Nhiều Lần', 'khát nước'],
    cauHoiChot: [
      'Phân có khô cứng như phân dê không?',
      'Tiểu tiện có nhiều lần không? (nhiều lần + táo bón là dấu tỳ ước)',
      'Bụng có trướng đau dữ không? (không → không dùng Đại thừa khí)',
    ],
    phapTri: 'Nhuận tràng tiết nhiệt, hành khí thông tiện',
    chuPhuong: {
      ten: 'Ma tử nhân hoàn',
      han: '麻子仁丸',
      dang: 'hoan',
      viThuoc: [
        { ten: 'Ma tử nhân', lieuGoc: '2 thăng', vaiTro: 'quân' },
        { ten: 'Hạnh nhân', lieuGoc: '1 thăng', vaiTro: 'thần' },
        { ten: 'Thược dược', lieuGoc: 'nửa cân', vaiTro: 'thần' },
        { ten: 'Đại hoàng', lieuGoc: '1 cân', vaiTro: 'tá' },
        { ten: 'Chỉ thực', lieuGoc: 'nửa cân', vaiTro: 'tá' },
        { ten: 'Hậu phác', lieuGoc: '1 thước', vaiTro: 'tá' },
      ],
      cachDung:
        'Tán bột luyện mật làm hoàn nhỏ, uống tăng dần cho tới khi đại tiện thông.',
    },
    camKy: [
      'Người già, sản phụ tân dịch khô: dùng liều nhỏ, không công hạ mạnh.',
    ],
  },
];

/** ─────────────── THIẾU ÂM (少陰) — 8 chứng, đợt 3 ───────────────
 * Kinh có NHIỀU pháp trị nhất trong app (85). Trục: tâm–thận suy, chia hai nhánh ĐỐI NGHỊCH —
 * HÀN HOÁ (dương hư, phần lớn) và NHIỆT HOÁ (âm hư hoả vượng). Nhầm nhánh là nghịch trị.
 */
export const CHUNG_THIEU_AM: ThuongHanChung[] = [
  {
    slug: 'tha-han-hoa',
    kinh: 'thieu-am',
    phanLoai: 'kinh-chung',
    ten: 'Thiếu Âm hàn hoá — dương hư âm thịnh',
    han: '少陰寒化證',
    dieuVan: [281, 323, 353],
    deCuong:
      'Mạch vi tế, CHỈ MUỐN NẰM (đề cương điều 281); sợ lạnh nằm co, chân tay lạnh, tiêu chảy phân sống, không khát hoặc khát thích uống ấm — tâm thận dương suy.',
    mach: 'Trầm vi tế',
    luoi: 'Lưỡi nhạt bệu, rêu trắng trơn',
    trieuChung: ['Sợ Lạnh', 'Mệt mỏi', 'Tiêu chảy', 'Chân tay lạnh', 'chán ăn'],
    cauHoiChot: [
      'CỬA ĐẦU TIÊN của Thiếu Âm — hỏi trước mọi câu khác: người SỢ LẠNH, chân tay lạnh, thích uống ẤM (nhánh HÀN HOÁ) hay BỨT RỨT mất ngủ, họng khô, thích uống MÁT (nhánh NHIỆT HOÁ)? Nhầm nhánh là nghịch trị.',
      'Người có chỉ muốn nằm, ngại nói, mệt lả không?',
      'Chân tay lạnh tới đâu — tới cổ tay/cổ chân hay quá khuỷu/gối?',
      'Khát không; nếu khát thì thích uống NÓNG hay LẠNH? (thích nóng → hàn hoá)',
    ],
    phapTri: 'Hồi dương cứu nghịch',
    chuPhuong: {
      ten: 'Tứ nghịch thang',
      han: '四逆湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Phụ tử', lieuGoc: '1 củ (sống)', vaiTro: 'quân' },
        { ten: 'Can khương', lieuGoc: '1 lạng 12 thù', vaiTro: 'thần' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    ghiChu:
      'Cùng chủ phương với chứng Thái Âm hư hàn nặng (tam-tu-nghich): đo mơ hồ giữa hai kinh cũng không đổi phương.',
    camKy: [
      'Nguyên bản dùng Phụ tử SỐNG (sinh dụng) để hồi dương gấp; lâm sàng hiện đại hầu hết dùng loại ĐÃ BÀO CHẾ và sắc trước 30–60 phút. Chọn loại nào là quyết định của thầy thuốc.',
      'Điều 286: Thiếu Âm mạch vi thì KHÔNG được phát hãn — "vong dương cố dã".',
      'Phải phân biệt chân hàn giả nhiệt với chân nhiệt giả hàn; nhầm là nghịch trị.',
    ],
    truyenSang: ['tha-cach-duong', 'tha-thuy-pham'],
  },
  {
    slug: 'tha-thuy-pham',
    kinh: 'thieu-am',
    phanLoai: 'kinh-chung',
    ten: 'Thiếu Âm dương hư thuỷ phiếm',
    han: '少陰陽虛水泛',
    dieuVan: [82, 316],
    deCuong:
      'Bụng đau, tiểu không lợi, chân tay nặng đau, tiêu chảy; hoặc hồi hộp, chóng mặt, người run rẩy như muốn ngã — thận dương hư không khí hoá được nước, thuỷ tràn lan.',
    mach: 'Trầm tế',
    luoi: 'Lưỡi nhạt bệu có dấu răng, rêu trắng trơn',
    trieuChung: [
      'Tiểu Ít',
      'Phù',
      'Chóng mặt',
      'Hồi Hộp',
      'Tiêu chảy',
      'Sợ Lạnh',
    ],
    cauHoiChot: [
      'Tiểu ít kèm PHÙ ẤN LÕM ở mặt/chân phải không? — mốc riêng của dương hư thuỷ phiếm.',
      'Đứng dậy có chóng mặt, người chao đảo không?',
    ],
    phapTri: 'Ôn dương lợi thuỷ',
    chuPhuong: {
      ten: 'Chân vũ thang',
      han: '真武湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Phụ tử', lieuGoc: '1 củ (bào)', vaiTro: 'quân' },
        { ten: 'Phục linh', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Bạch truật', lieuGoc: '2 lạng', vaiTro: 'tá' },
        { ten: 'Thược dược', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Sinh khương', lieuGoc: '3 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Phụ tử phải bào chế, sắc trước; thuỷ thũng do thấp nhiệt thì không dùng.',
    ],
  },
  {
    slug: 'tha-cach-duong',
    kinh: 'thieu-am',
    phanLoai: 'bien-chung',
    ten: 'Thiếu Âm hàn thịnh cách dương (chân hàn giả nhiệt)',
    han: '少陰陰盛格陽',
    dieuVan: [317],
    deCuong:
      'Trong lạnh ngoài nóng: tiêu chảy phân sống, chân tay quyết lạnh, mạch vi muốn tuyệt, MÀ người lại không sợ lạnh, mặt đỏ bừng — âm hàn quá thịnh dồn dương ra ngoài.',
    mach: 'Vi muốn tuyệt',
    luoi: 'Lưỡi nhạt, rêu trắng',
    trieuChung: ['Tiêu chảy', 'Chân tay lạnh', 'Mặt đỏ', 'Mệt mỏi'],
    cauHoiChot: [
      'Mặt đỏ bừng mà người lại KHÔNG đòi đắp chăn, không kêu lạnh — trong khi chân tay thì lạnh ngắt, phải không? (điều 317: "thân phản bất ố hàn" — đó chính là dấu cách dương)',
      'Khát nhưng có uống được nhiều không; thích nóng hay lạnh?',
      'Mạch có vi yếu gần như không bắt được không? (vi muốn tuyệt → nguy chứng; nếu mạch HUYỀN có lực thì nghĩ tới dương uất — Tứ nghịch TÁN, không phải thang)',
      'Người có mệt lả, nằm li bì, tiêu chảy phân sống không? (có → hàn thịnh cách dương; nếu tỉnh táo, chỉ bực dọc tức ngực → dương uất)',
    ],
    phapTri: 'Phá âm hồi dương, thông đạt trong ngoài',
    chuPhuong: {
      ten: 'Thông mạch tứ nghịch thang',
      han: '通脈四逆湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Phụ tử', lieuGoc: '1 củ lớn (sống)', vaiTro: 'quân' },
        { ten: 'Can khương', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Đây là chứng NGUY — dùng thuốc phải theo dõi sát; nhầm với chân nhiệt giả hàn là tai hoạ.',
    ],
  },
  {
    slug: 'tha-nhiet-hoa',
    kinh: 'thieu-am',
    phanLoai: 'kinh-chung',
    ten: 'Thiếu Âm nhiệt hoá — âm hư hoả vượng',
    han: '少陰熱化證',
    dieuVan: [303],
    deCuong:
      'Bệnh hai ba ngày trở lên: TÂM PHIỀN KHÔNG NẰM ĐƯỢC, miệng khô họng đau, tiểu vàng — thận âm hư ở dưới, tâm hoả vượng ở trên, thuỷ hoả không giao.',
    mach: 'Tế sác',
    luoi: 'Lưỡi đỏ ít rêu hoặc không rêu',
    trieuChung: ['mất ngủ', 'Bồn chồn', 'Khô họng', 'khát nước', 'Tâm Phiền'],
    cauHoiChot: [
      'CỬA ĐẦU TIÊN của Thiếu Âm — hỏi trước mọi câu khác: người SỢ LẠNH, chân tay lạnh, thích uống ẤM (nhánh HÀN HOÁ) hay BỨT RỨT mất ngủ, họng khô, thích uống MÁT (nhánh NHIỆT HOÁ)? Nhầm nhánh là nghịch trị.',
      'Đêm có bứt rứt không ngủ được không? (phiền mà không nằm được là dấu chốt)',
      'Miệng họng có khô, lưỡi đỏ ít rêu không?',
      'Người nóng hay lạnh; thích uống nóng hay mát? (thích mát → nhiệt hoá)',
      'Tiểu tiện có thông lợi bình thường không? (khát mà tiểu ÍT, kèm tiêu chảy → nghĩ tới Trư linh thang)',
    ],
    phapTri: 'Tư âm giáng hoả, giao thông tâm thận',
    chuPhuong: {
      ten: 'Hoàng liên a giao thang',
      han: '黃連阿膠湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Hoàng liên', lieuGoc: '4 lạng', vaiTro: 'quân' },
        { ten: 'A giao', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Hoàng cầm', lieuGoc: '2 lạng', vaiTro: 'thần' },
        { ten: 'Thược dược', lieuGoc: '2 lạng', vaiTro: 'tá' },
        { ten: 'Kê tử hoàng', lieuGoc: '2 quả', vaiTro: 'tá' },
      ],
      cachDung:
        'Sắc ba vị trước, bỏ bã rồi hoà A giao cho tan; để nguội bớt mới đánh lòng đỏ trứng vào.',
    },
    camKy: [
      'Nhánh NHIỆT HOÁ — tuyệt đối không dùng Tứ nghịch thang của nhánh hàn hoá.',
    ],
  },
  {
    slug: 'tha-tru-linh',
    kinh: 'thieu-am',
    phanLoai: 'kinh-chung',
    ten: 'Thiếu Âm âm hư, thuỷ nhiệt hỗ kết',
    han: '少陰陰虛水熱互結',
    dieuVan: [319],
    deCuong:
      'Tiêu chảy, khát nước, tiểu không lợi, tâm phiền không ngủ được, có thể ho hoặc nôn — âm hư có nhiệt lại kèm thuỷ đình.',
    mach: 'Tế sác',
    luoi: 'Lưỡi đỏ, rêu vàng mỏng',
    trieuChung: ['Tiêu chảy', 'khát nước', 'Tiểu Ít', 'mất ngủ', 'Bồn chồn'],
    cauHoiChot: [
      'Khát nước nhiều mà tiểu lại ít phải không?',
      'Đêm có khó ngủ, bứt rứt không?',
      'Có ho hoặc buồn nôn kèm theo không?',
    ],
    phapTri: 'Tư âm thanh nhiệt, lợi thuỷ',
    chuPhuong: {
      ten: 'Trư linh thang',
      han: '豬苓湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Trư linh', lieuGoc: '1 lạng', vaiTro: 'quân' },
        { ten: 'Phục linh', lieuGoc: '1 lạng', vaiTro: 'thần' },
        { ten: 'Trạch tả', lieuGoc: '1 lạng', vaiTro: 'thần' },
        { ten: 'Hoạt thạch', lieuGoc: '1 lạng', vaiTro: 'tá' },
        { ten: 'A giao', lieuGoc: '1 lạng', vaiTro: 'tá' },
      ],
    },
    camKy: [
      'Điều 224: Dương Minh hãn nhiều mà khát thì KHÔNG dùng — lợi thuỷ càng hao tân dịch.',
    ],
  },
  {
    slug: 'tha-kiem-bieu',
    kinh: 'thieu-am',
    phanLoai: 'kiem-chung',
    ten: 'Thiếu Âm kiêm biểu (dương hư ngoại cảm)',
    han: '少陰兼表證',
    dieuVan: [301],
    deCuong:
      'Mới mắc đã SỐT mà mạch lại TRẦM — người vốn dương hư lại cảm hàn; biểu lý cùng bệnh.',
    mach: 'Trầm (mà phát sốt)',
    trieuChung: ['Sốt', 'Sợ Lạnh', 'Mệt mỏi', 'Đau đầu'],
    cauHoiChot: [
      'Sốt mà mạch lại chìm sâu phải không? (sốt + mạch trầm là dấu chốt)',
      'Người vốn có sợ lạnh, mệt mỏi kéo dài từ trước không?',
      'Có đau đầu, đau mỏi mình không?',
    ],
    phapTri: 'Ôn kinh giải biểu (phù chính đồng thời giải biểu)',
    chuPhuong: {
      ten: 'Ma hoàng tế tân phụ tử thang',
      han: '麻黃細辛附子湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Ma hoàng', lieuGoc: '2 lạng', vaiTro: 'quân' },
        { ten: 'Phụ tử', lieuGoc: '1 củ (bào)', vaiTro: 'quân' },
        { ten: 'Tế tân', lieuGoc: '2 lạng', vaiTro: 'thần' },
      ],
    },
    camKy: [
      'Dương hư nặng (mạch vi muốn tuyệt, quyết lạnh) thì KHÔNG phát hãn — phải hồi dương trước.',
      'Tế tân vượt giới hạn liều hiện đại khi quy đổi thẳng; xem cảnh báo trong bảng vị.',
    ],
  },
  {
    slug: 'tha-tu-nghich-tan',
    kinh: 'thieu-am',
    phanLoai: 'bien-chung',
    ten: 'Dương uất tứ nghịch (khí trệ, không phải dương hư)',
    han: '少陰陽鬱四逆',
    dieuVan: [318],
    deCuong:
      'Chân tay lạnh NHƯNG người không sợ lạnh, có thể kèm ho, hồi hộp, tiểu không lợi, bụng đau, tiêu chảy nặng bụng — dương khí bị uất không đạt ra tứ chi, KHÔNG phải dương hư.',
    mach: 'Huyền',
    luoi: 'Rêu trắng mỏng hoặc vàng mỏng',
    trieuChung: [
      'Chân tay lạnh',
      'Đau Bụng',
      'Tiêu chảy',
      'Hồi Hộp',
      'tức ngực',
    ],
    cauHoiChot: [
      'Chân tay lạnh mà người có sợ lạnh không? (KHÔNG sợ lạnh → dương uất)',
      'Ngực sườn có tức, hay thở dài, bực dọc không?',
      'Mạch huyền hay vi tế? (huyền có lực → Tứ nghịch TÁN; vi muốn tuyệt → là nguy chứng cách dương, phải hồi dương gấp)',
      'Người vẫn tỉnh táo, ăn ngủ tạm được chứ? (li bì, tiêu chảy phân sống → không phải chứng này)',
    ],
    phapTri: 'Sơ can lý khí, thấu đạt dương uất',
    chuPhuong: {
      ten: 'Tứ nghịch tán',
      han: '四逆散',
      dang: 'tan',
      viThuoc: [
        { ten: 'Sài hồ', lieuGoc: '10 phần', vaiTro: 'quân' },
        { ten: 'Thược dược', lieuGoc: '10 phần', vaiTro: 'thần' },
        { ten: 'Chỉ thực', lieuGoc: '10 phần', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '10 phần', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      '⚠ ĐỌC KỸ TÊN: Tứ nghịch TÁN (bài này — Sài hồ, Chỉ thực: sơ can giải uất) KHÁC HẲN Tứ nghịch THANG (Phụ tử, Can khương: hồi dương cứu nghịch). Tên gần giống mà cơ chế NGƯỢC nhau — lấy nhầm là nghịch trị.',
      'Ở đây là dương UẤT chứ không phải dương HƯ; dùng ôn dương là sai.',
    ],
  },
  {
    slug: 'tha-dao-hoa',
    kinh: 'thieu-am',
    phanLoai: 'bien-chung',
    ten: 'Thiếu Âm hạ lợi tiện nùng huyết (hoạt thoát)',
    han: '少陰下利便膿血',
    dieuVan: [306, 307],
    deCuong:
      'Tiêu chảy kéo dài không cầm, phân lẫn mủ máu màu tối nhạt, bụng đau âm ỉ THÍCH ấn ấm — tỳ thận hư hàn, hoạt thoát không giữ.',
    mach: 'Trầm nhược',
    luoi: 'Lưỡi nhạt, rêu trắng',
    trieuChung: [
      'Tiêu chảy',
      'Đại tiện ra máu',
      'Đau Bụng',
      'Sợ Lạnh',
      'Mệt mỏi',
    ],
    cauHoiChot: [
      'Phân có lẫn mủ máu màu sẫm tối hay đỏ tươi? (tối nhạt → hư hàn)',
      'Bụng đau có thích xoa ấm không?',
      'Có mót rặn không? (không mót rặn → hư hàn hoạt thoát)',
    ],
    phapTri: 'Ôn trung sáp tràng, cố thoát chỉ lợi',
    chuPhuong: {
      ten: 'Đào hoa thang',
      han: '桃花湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Xích thạch chi', lieuGoc: '1 cân', vaiTro: 'quân' },
        { ten: 'Can khương', lieuGoc: '1 lạng', vaiTro: 'thần' },
        { ten: 'Ngạnh mễ', lieuGoc: '1 thăng', vaiTro: 'tá' },
      ],
    },
    camKy: [
      'Lỵ do thấp nhiệt (phân đỏ tươi, mót rặn, hậu môn nóng rát) thì CẤM — sáp lại là nhốt tà.',
    ],
  },
];

/** ─────────────── QUYẾT ÂM (厥陰) — 6 chứng, đợt 4 (kinh cuối) ───────────────
 * Đề cương điều 326: tiêu khát, khí xông lên tim, đói mà không muốn ăn, ăn vào thì nôn giun.
 * Trục: HÀN NHIỆT THÁC TẠP — trên nhiệt dưới hàn, chính tà giằng co. Đây là kinh khó nhất: dùng
 * thuần hàn hay thuần nhiệt đều sai, phải ôn thanh cùng dùng. Điều 326 dặn thẳng: "hạ chi lợi bất chỉ".
 */
export const CHUNG_QUYET_AM: ThuongHanChung[] = [
  {
    slug: 'qa-o-mai',
    kinh: 'quyet-am',
    phanLoai: 'kinh-chung',
    ten: 'Quyết Âm chính chứng — hàn nhiệt thác tạp (chứng giun)',
    han: '厥陰病本證（蛔厥）',
    dieuVan: [326, 338],
    deCuong:
      'Trên nhiệt dưới hàn: khát muốn uống, khí xông lên ngực, đói mà không muốn ăn; chân tay lạnh từng cơn, đau bụng dữ dội rồi lại đỡ, nôn ra giun — chính hư, hàn nhiệt lẫn lộn.',
    mach: 'Huyền hoặc trầm tế',
    luoi: 'Rêu trắng vàng lẫn lộn',
    trieuChung: [
      'Đau Bụng',
      'Nôn Mửa',
      'Chân tay lạnh',
      'khát nước',
      'chán ăn',
    ],
    cauHoiChot: [
      'Đau bụng có thành CƠN, đau dữ rồi lại đỡ hẳn không?',
      'Người vừa thấy nóng khát ở trên, vừa lạnh bụng lạnh chân tay ở dưới phải không?',
      'Có nôn ra giun hoặc tiền sử nhiễm giun không?',
      'LOẠI TRỪ NHIỆT QUYẾT trước (điều 335 "quyết thâm nhiệt diệc thâm"): chân tay lạnh mà KHÁT THÍCH UỐNG LẠNH, tiểu vàng sẫm, đại tiện táo, ngực bụng nóng — nếu vậy thì chân tay lạnh là do NHIỆT bế bên trong, cấm dùng phương ôn/thổ ở đây.',
    ],
    phapTri: 'Ôn tạng an giun, thanh trên ôn dưới (hàn nhiệt cùng dùng)',
    chuPhuong: {
      ten: 'Ô mai hoàn',
      han: '烏梅丸',
      dang: 'hoan',
      viThuoc: [
        { ten: 'Ô mai', lieuGoc: '300 quả', vaiTro: 'quân' },
        { ten: 'Hoàng liên', lieuGoc: '16 lạng', vaiTro: 'thần' },
        { ten: 'Hoàng bá', lieuGoc: '6 lạng', vaiTro: 'thần' },
        { ten: 'Can khương', lieuGoc: '10 lạng', vaiTro: 'tá' },
        { ten: 'Tế tân', lieuGoc: '6 lạng', vaiTro: 'tá' },
        { ten: 'Phụ tử', lieuGoc: '6 lạng (bào)', vaiTro: 'tá' },
        { ten: 'Thục tiêu', lieuGoc: '4 lạng', vaiTro: 'tá' },
        { ten: 'Quế chi', lieuGoc: '6 lạng', vaiTro: 'tá' },
        { ten: 'Nhân sâm', lieuGoc: '6 lạng', vaiTro: 'tá' },
        { ten: 'Đương quy', lieuGoc: '4 lạng', vaiTro: 'sứ' },
      ],
      cachDung:
        'Ô mai ngâm giấm một đêm, giã nát trộn các vị, luyện mật làm hoàn. Uống trước bữa ăn; kiêng đồ sống lạnh, tanh, nhờn.',
    },
    camKy: [
      'Điều 326: Quyết Âm KHÔNG được công hạ — "hạ chi lợi bất chỉ" (hạ thì tiêu chảy không cầm).',
      'Phương gồm cả đại nhiệt (Phụ tử, Tế tân, Thục tiêu) lẫn đại hàn (Hoàng liên, Hoàng bá) — không tự ý bỏ một vế.',
    ],
    truyenSang: ['qa-duong-quy-tu-nghich', 'qa-bach-dau-ong'],
  },
  {
    slug: 'qa-duong-quy-tu-nghich',
    kinh: 'quyet-am',
    phanLoai: 'kinh-chung',
    ten: 'Huyết hư hàn ngưng, chân tay quyết lạnh',
    han: '血虛寒厥',
    dieuVan: [351, 352],
    deCuong:
      'Chân tay lạnh, mạch tế muốn tuyệt, người không nóng sốt; hay gặp ở người vốn huyết hư gặp lạnh — hàn ngưng kinh mạch, huyết không đạt ra tứ chi.',
    mach: 'Tế muốn tuyệt',
    luoi: 'Lưỡi nhạt, rêu trắng',
    trieuChung: ['Chân tay lạnh', 'Sợ Lạnh', 'Đau Khớp', 'Đau Bụng'],
    cauHoiChot: [
      'Tay chân lạnh mà mạch có TẾ NHỎ như sợi chỉ không? (khác quyết lạnh do dương hư mạch vi)',
      'Người có sắc nhợt, hay tê buốt đầu ngón khi lạnh không?',
      'Phụ nữ có đau bụng kinh, kinh ra ít sẫm không?',
      'LOẠI TRỪ NHIỆT QUYẾT trước (điều 335 "quyết thâm nhiệt diệc thâm"): chân tay lạnh mà KHÁT THÍCH UỐNG LẠNH, tiểu vàng sẫm, đại tiện táo, ngực bụng nóng — nếu vậy thì chân tay lạnh là do NHIỆT bế bên trong, cấm dùng phương ôn/thổ ở đây.',
    ],
    phapTri: 'Ôn kinh tán hàn, dưỡng huyết thông mạch',
    chuPhuong: {
      ten: 'Đương quy tứ nghịch thang',
      han: '當歸四逆湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Đương quy', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Quế chi', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Thược dược', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Tế tân', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Thông thảo', lieuGoc: '2 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '25 quả', vaiTro: 'tá' },
        { ten: 'Chích cam thảo', lieuGoc: '2 lạng', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'KHÔNG dùng cho quyết lạnh do dương hư nặng (mạch vi muốn tuyệt, tiêu chảy phân sống) — đó là Tứ nghịch thang.',
      'Tế tân quy đổi thẳng sẽ vượt giới hạn hiện đại; xem cảnh báo liều trong bảng vị.',
    ],
  },
  {
    slug: 'qa-bach-dau-ong',
    kinh: 'quyet-am',
    phanLoai: 'kinh-chung',
    ten: 'Nhiệt lỵ (lỵ do thấp nhiệt, hạ trọng)',
    han: '厥陰熱利',
    dieuVan: [371, 373],
    deCuong:
      'Tiêu chảy có mủ máu ĐỎ TƯƠI, mót rặn nặng hậu môn, bụng đau, khát muốn uống nước — nhiệt độc thấm vào đại trường, bức huyết.',
    mach: 'Huyền sác',
    luoi: 'Lưỡi đỏ, rêu vàng nhờn',
    trieuChung: ['Tiêu chảy', 'Đau Bụng', 'khát nước', 'Sốt'],
    cauHoiChot: [
      'Phân có mủ máu ĐỎ TƯƠI hay sẫm tối? (đỏ tươi → nhiệt lỵ)',
      'Có mót rặn, đi xong vẫn muốn đi tiếp không?',
      'Hậu môn có nóng rát không? Có khát nước không?',
    ],
    phapTri: 'Thanh nhiệt giải độc, lương huyết chỉ lỵ',
    chuPhuong: {
      ten: 'Bạch đầu ông thang',
      han: '白頭翁湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Bạch đầu ông', lieuGoc: '2 lạng', vaiTro: 'quân' },
        { ten: 'Hoàng liên', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Hoàng bá', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Tần bì', lieuGoc: '3 lạng', vaiTro: 'tá' },
      ],
    },
    camKy: [
      'Lỵ hư hàn (phân sẫm tối, không mót rặn, người lạnh) thì CẤM — đó là Đào hoa thang của Thiếu Âm.',
    ],
  },
  {
    slug: 'qa-can-khuong-cam-lien',
    kinh: 'quyet-am',
    phanLoai: 'bien-chung',
    ten: 'Thượng nhiệt hạ hàn, ăn vào là nôn',
    han: '上熱下寒，食入即吐',
    dieuVan: [359],
    deCuong:
      'Vốn đã hàn ở dưới lại bị hạ nhầm: ăn vào là nôn ngay, tiêu chảy không dứt — trên có nhiệt bức lên, dưới hàn không giữ.',
    mach: 'Huyền tế',
    luoi: 'Rêu vàng trắng lẫn lộn',
    trieuChung: ['Nôn Mửa', 'Tiêu chảy', 'chán ăn', 'Tâm Phiền'],
    cauHoiChot: [
      'Ăn vào có nôn ra ngay không?',
      'Vừa nôn vừa tiêu chảy phải không?',
      'Trước đó đã dùng thuốc xổ chưa? (hạ nhầm là nguyên nhân thường gặp)',
    ],
    phapTri: 'Thanh trên ôn dưới, ích khí hoà trung',
    chuPhuong: {
      ten: 'Can khương hoàng cầm hoàng liên nhân sâm thang',
      han: '乾薑黃芩黃連人參湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Can khương', lieuGoc: '3 lạng', vaiTro: 'quân' },
        { ten: 'Hoàng cầm', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Hoàng liên', lieuGoc: '3 lạng', vaiTro: 'thần' },
        { ten: 'Nhân sâm', lieuGoc: '3 lạng', vaiTro: 'tá' },
      ],
    },
    camKy: [
      'Bốn vị chia đều hàn – nhiệt; bỏ vế nào cũng hỏng thế cân bằng của phương.',
    ],
  },
  {
    slug: 'qa-ngo-thu-du',
    kinh: 'quyet-am',
    phanLoai: 'kiem-chung',
    ten: 'Can vị hư hàn, nôn khan đau đầu',
    han: '肝胃虛寒，乾嘔頭痛',
    dieuVan: [378],
    deCuong:
      'Nôn khan, nhổ ra nước dãi trong, ĐAU ĐẦU VÙNG ĐỈNH, chân tay lạnh, bứt rứt — can hàn phạm vị, trọc âm xông lên.',
    mach: 'Trầm huyền trì',
    luoi: 'Lưỡi nhạt, rêu trắng trơn',
    trieuChung: ['Nôn Mửa', 'Đau đầu', 'Chân tay lạnh', 'Bồn chồn'],
    cauHoiChot: [
      'Nôn ra nước dãi TRONG và loãng phải không? (trong loãng → hàn)',
      'Đau đầu ở vùng đỉnh đầu hay hai bên thái dương?',
      'Uống nước ấm vào có dễ chịu hơn không?',
      'LOẠI TRỪ NHIỆT QUYẾT trước (điều 335 "quyết thâm nhiệt diệc thâm"): chân tay lạnh mà KHÁT THÍCH UỐNG LẠNH, tiểu vàng sẫm, đại tiện táo, ngực bụng nóng — nếu vậy thì chân tay lạnh là do NHIỆT bế bên trong, cấm dùng phương ôn/thổ ở đây.',
    ],
    phapTri: 'Ôn can noãn vị, giáng nghịch chỉ nôn',
    chuPhuong: {
      ten: 'Ngô thù du thang',
      han: '吳茱萸湯',
      dang: 'thang',
      viThuoc: [
        { ten: 'Ngô thù du', lieuGoc: '1 thăng', vaiTro: 'quân' },
        { ten: 'Sinh khương', lieuGoc: '6 lạng', vaiTro: 'thần' },
        { ten: 'Nhân sâm', lieuGoc: '3 lạng', vaiTro: 'tá' },
        { ten: 'Đại táo', lieuGoc: '12 quả', vaiTro: 'sứ' },
      ],
    },
    camKy: [
      'Nôn do nhiệt (nôn ra chất chua đắng, lưỡi đỏ rêu vàng) thì CẤM — Ngô thù du tính đại nhiệt.',
    ],
  },
  {
    slug: 'qa-qua-de',
    kinh: 'quyet-am',
    phanLoai: 'bien-chung',
    ten: 'Đàm thực ủng tắc ngực (đàm quyết)',
    han: '痰食厥證',
    dieuVan: [355],
    deCuong:
      'Chân tay lạnh, mạch bỗng khẩn; dưới tim đầy tức bứt rứt, đói mà không ăn được — đàm thực ủng ở ngực cách, dương khí bị chẹn không ra tứ chi.',
    mach: 'Trầm khẩn',
    luoi: 'Rêu trắng dày nhờn',
    trieuChung: ['Chân tay lạnh', 'tức ngực', 'chán ăn', 'Bồn chồn'],
    cauHoiChot: [
      'Vùng ngực dưới tim có đầy tức, khó chịu muốn nôn không?',
      'Đói mà ăn không vào phải không?',
      'Trước đó có ăn quá no, ăn đồ khó tiêu không?',
      'LOẠI TRỪ NHIỆT QUYẾT trước (điều 335 "quyết thâm nhiệt diệc thâm"): chân tay lạnh mà KHÁT THÍCH UỐNG LẠNH, tiểu vàng sẫm, đại tiện táo, ngực bụng nóng — nếu vậy thì chân tay lạnh là do NHIỆT bế bên trong, cấm dùng phương ôn/thổ ở đây.',
    ],
    phapTri: 'Dũng thổ đàm thực (thổ pháp)',
    chuPhuong: {
      ten: 'Qua đế tán',
      han: '瓜蒂散',
      dang: 'tan',
      viThuoc: [
        { ten: 'Qua đế', lieuGoc: '1 phần', vaiTro: 'quân' },
        { ten: 'Xích tiểu đậu', lieuGoc: '1 phần', vaiTro: 'thần' },
        { ten: 'Đạm đậu xị', lieuGoc: '1 hợp', vaiTro: 'tá' },
      ],
      cachDung:
        'Tán bột, sắc Đạm đậu xị làm thang chiêu thuốc. Nôn được là DỪNG ngay.',
    },
    camKy: [
      'Thổ pháp rất mạnh: người hư nhược, mất máu, phụ nữ có thai, người già yếu đều CẤM.',
      'Điều 355 dặn rõ chỉ dùng khi đàm thực ủng ở ngực — quyết lạnh do dương hư thì cấm tuyệt đối.',
    ],
  },
];

/** ĐỦ SÁU KINH (20/09/2026). Thứ tự dựng theo phân bố ca thật, không theo sách:
 * Thái Dương → Thiếu Dương → Thái Âm + Thiếu Âm → Dương Minh + Quyết Âm. */
export const THUONG_HAN_CHUNG: ThuongHanChung[] = [
  ...CHUNG_THAI_DUONG,
  ...CHUNG_DUONG_MINH,
  ...CHUNG_THIEU_DUONG,
  ...CHUNG_THAI_AM,
  ...CHUNG_THIEU_AM,
  ...CHUNG_QUYET_AM,
];
