/**
 * QUY ĐỔI LIỀU CỔ PHƯƠNG → LIỀU HIỆN ĐẠI (gram).
 *
 * HỆ ĐANG DÙNG: **1 lạng (兩) = 3g** — hệ LÂM SÀNG HIỆN ĐẠI, thầy thuốc chốt ngày 20/09/2026.
 *
 * ⚠️ Phải hiểu đúng hệ này là gì: nó KHÔNG phải quy đổi khảo cổ. Cân đồng đời Đông Hán khai quật
 * cho 1 lạng ≈ 13,8–15,6g, tức gấp ~5 lần. Hệ 3g/lạng là quy ước liều lâm sàng mà giáo trình
 * Phương tễ học hiện đại dùng, đã hạ liều cho phù hợp người bệnh ngày nay. Ghi rõ ở đây để về sau
 * không ai tưởng đây là số đo lịch sử, và để nếu đổi hệ thì đổi ở ĐÚNG MỘT CHỖ.
 *
 * Các đơn vị ĐONG và ĐẾM (thăng, hợp, quả, hạt, củ, con) không quy đổi được bằng phép nhân — mỗi vị
 * một khối lượng riêng. Bảng `LIEU_DEM` dưới đây là liều thông dụng của giáo trình hiện đại cho
 * chính lượng đếm ấy, KHÔNG phải kết quả cân đo. Mọi số trong đó đều cần thầy thuốc duyệt.
 */

/** 1 lạng = 3g; 1 thù = 1/24 lạng. */
export const HE_QUY_DOI = {
  ten: 'Lâm sàng hiện đại (1 lạng = 3g)',
  gramMoiLang: 3,
  gramMoiThu: 3 / 24,
} as const;

/**
 * Liều hiện đại cho các lượng ĐONG/ĐẾM, tra theo "tên vị + nguyên văn lượng".
 * Nguồn: liều thông dụng trong giáo trình Phương tễ học hiện đại — CHỜ DUYỆT.
 */
export const LIEU_DEM: Record<string, number> = {
  'Hạnh nhân|70 hạt': 9,
  'Hạnh nhân|40 hạt': 6,
  'Hạnh nhân|24 hạt': 4,
  'Đào nhân|50 hạt': 12,
  'Đào nhân|20 hạt': 6,
  'Đại táo|12 quả': 12,
  'Đại táo|10 quả': 10,
  'Đại táo|4 quả': 4,
  'Chi tử|14 quả': 9,
  'Hương xị|4 hợp': 9,
  'Bán hạ|nửa thăng': 9,
  'Ngũ vị tử|nửa thăng': 6,
  'Mang tiêu|1 thăng': 18,
  'Thạch cao|to như quả trứng gà': 30,
  'Phụ tử|1 củ (bào)': 6,
  'Phụ tử|1 củ (sống)': 6,
  'Phụ tử|1 củ lớn (sống)': 9,
  'Thuỷ điệt|30 con': 6,
  'Manh trùng|30 con': 6,
  'Cam toại|1 tiền chuỷ (bột xung)': 0.5,
  'Bán hạ|2 hợp rưỡi': 6,
  'Bán hạ|2 hợp': 5,
};

/**
 * Giới hạn liều HIỆN ĐẠI của các vị nhạy cảm (g/thang, người lớn).
 * Dùng để bắt chỗ quy đổi máy móc vượt ngưỡng an toàn — đây mới là lý do bộ quy đổi này đáng có:
 * nhân 3 đều tay thì Tế tân 3 lạng thành 9g, trong khi dược điển giới hạn 1–3g.
 */
export const GIOI_HAN_HIEN_DAI: Record<
  string,
  { min?: number; max: number; vi_sao: string }
> = {
  'Tế tân': {
    max: 3,
    vi_sao: 'độc tính (aristolochic acid) — dược điển hiện đại giới hạn 1–3g',
  },
  'Ma hoàng': {
    max: 10,
    vi_sao: 'ephedrine — kích thích tim mạch, tăng huyết áp',
  },
  'Phụ tử': {
    max: 15,
    vi_sao:
      'aconitine — độc với tim; phải dùng loại đã bào chế và sắc trước 30–60 phút',
  },
  'Cam toại': {
    max: 1.5,
    vi_sao:
      'trục thuỷ mãnh liệt, kích ứng niêm mạc — chỉ dùng bột xung, không sắc',
  },
  'Bán hạ': { max: 12, vi_sao: 'sống có độc — phải dùng loại đã chế' },
  'Thuỷ điệt': {
    max: 6,
    vi_sao: 'phá huyết mạnh — cấm ở người có thai và đang xuất huyết',
  },
  'Manh trùng': {
    max: 6,
    vi_sao: 'phá huyết mạnh — cấm ở người có thai và đang xuất huyết',
  },
  'Đại hoàng': { max: 15, vi_sao: 'tả hạ mạnh — dùng lâu hại tỳ vị' },
  'Mang tiêu': {
    max: 20,
    vi_sao: 'nhuyễn kiên tả hạ — hoà vào thuốc đã sắc, không đun',
  },
};

export interface LieuQuyDoi {
  /** Nguyên văn cổ phương. */
  goc: string;
  /** Gram theo hệ đang dùng; null nếu không tra được. */
  gram: number | null;
  /** 'nhan-he' = nhân theo lạng/thù · 'tra-bang' = tra LIEU_DEM · 'khong-tra-duoc'. */
  cach: 'nhan-he' | 'tra-bang' | 'khong-tra-duoc';
  /** Vượt giới hạn hiện đại → phải để thầy thuốc quyết, không tự hạ liều. */
  canhBao?: string;
}

const RE_LANG = /^([\d,.]+)\s*lạng(?:\s+([\d,.]+)\s*thù)?$/i;
const RE_THU = /^([\d,.]+)\s*thù/i;
const so = (s: string) => Number(s.replace(',', '.'));

/** Quy đổi một dòng liều. `ten` cần để tra bảng đếm và giới hạn. */
export function quyDoiLieu(ten: string, lieuGoc: string): LieuQuyDoi {
  const goc = lieuGoc.trim();
  // Bỏ chú thích bào chế trong ngoặc trước khi đọc số: "6 lạng (bào)" vẫn phải ra 18g.
  const so_goc = goc.replace(/\s*\([^)]*\)\s*$/, '').trim();
  let gram: number | null = null;
  let cach: LieuQuyDoi['cach'] = 'khong-tra-duoc';

  const mLang = RE_LANG.exec(so_goc);
  if (mLang) {
    gram =
      so(mLang[1]) * HE_QUY_DOI.gramMoiLang +
      (mLang[2] ? so(mLang[2]) * HE_QUY_DOI.gramMoiThu : 0);
    cach = 'nhan-he';
  } else if (/^nửa\s+lạng$/i.test(so_goc)) {
    gram = HE_QUY_DOI.gramMoiLang / 2;
    cach = 'nhan-he';
  } else if (RE_THU.exec(so_goc) && !LIEU_DEM[`${ten}|${goc}`]) {
    gram = so(RE_THU.exec(so_goc)![1]) * HE_QUY_DOI.gramMoiThu;
    cach = 'nhan-he';
  }
  if (gram == null) {
    const tra = LIEU_DEM[`${ten}|${goc}`];
    if (tra != null) {
      gram = tra;
      cach = 'tra-bang';
    }
  }
  if (gram != null) gram = Math.round(gram * 100) / 100;

  const gh = GIOI_HAN_HIEN_DAI[ten];
  const canhBao =
    gh && gram != null && gram > gh.max
      ? `${ten} ${gram}g VƯỢT giới hạn hiện đại ${gh.max}g — ${gh.vi_sao}. Giữ nguyên số quy đổi, thầy thuốc quyết liều thực dùng.`
      : undefined;

  return { goc, gram, cach, ...(canhBao ? { canhBao } : {}) };
}

/**
 * Lưu ý BÀO CHẾ — gắn vào mọi bài có vị này, KHÔNG phụ thuộc liều.
 * `GIOI_HAN_HIEN_DAI` chỉ lên tiếng khi liều VƯỢT ngưỡng, nên Bán hạ 9g (dưới ngưỡng 12g) trước đây
 * im lặng hoàn toàn — trong khi điều cần dặn ở vị này là "phải dùng loại đã chế", đúng ở mọi liều.
 */
export const LUU_Y_BAO_CHE: Record<string, string> = {
  'Bán hạ':
    'Phải dùng Bán hạ ĐÃ CHẾ (sống có độc, kích ứng niêm mạc); thận trọng khi âm hư táo khát.',
  'Phụ tử':
    'Nguyên bản có bài dùng Phụ tử SỐNG; lâm sàng hiện đại dùng loại đã bào chế và sắc trước 30–60 phút.',
  'Cam toại':
    'Chỉ dùng dạng bột xung, KHÔNG sắc; phản Cam thảo (thập bát phản).',
  'Tế tân':
    'Dược điển hiện đại giới hạn 1–3g; liều cổ phương quy đổi thẳng sẽ vượt xa.',
  'Thuỷ điệt': 'Phá huyết mạnh — cấm ở người có thai và đang xuất huyết.',
  'Manh trùng': 'Phá huyết mạnh — cấm ở người có thai và đang xuất huyết.',
  'Qua đế':
    'Thổ dược mạnh: nôn được là dừng; người hư nhược, có thai, mất máu đều cấm.',
};
