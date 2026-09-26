/**
 * Bộ luật văn phong — cái thước mà mọi lời phê trục văn phong phải quy chiếu về.
 *
 * Vì sao cần: nếu bot cứ "thấy sao nói vậy" thì mỗi lời phê là một cuộc cãi riêng. Có
 * thước thì khi bot phê sai, người dùng sửa MỘT điều luật, và mọi lời phê dựa vào điều
 * đó tự đúng theo. Thước rút từ chính các mục người dùng cho là viết đạt, không phải từ
 * trí nhớ của mô hình.
 */

export type TrucLuat = 'bo_cuc' | 'thuat_ngu' | 'cau_chu' | 'pham_vi_hanh_nghe';

export interface DieuLuat {
  /** Mã ngắn để lời phê trỏ về, vd "BC1". */
  ma: string;
  truc: TrucLuat;
  noiDung: string;
  /** Câu mẫu lấy từ mục viết đạt — chỗ neo cho người duyệt đối chiếu. */
  viDu: string;
}

export interface BoLuatVanPhong {
  phienBan: number;
  /** Bộ nào chịu thước này. Rỗng = mọi bộ. */
  boApDung: string[];
  dieu: DieuLuat[];
  daDuyet: boolean;
}

export function traDieu(bo: BoLuatVanPhong, ma: string): DieuLuat | null {
  if (!ma) return null;
  const k = ma.trim().toUpperCase();
  return bo.dieu.find((d) => d.ma.toUpperCase() === k) ?? null;
}

export function apDungCho(bo: BoLuatVanPhong, tenBo: string): boolean {
  return !bo.boApDung.length || bo.boApDung.includes(tenBo);
}

/**
 * Phạm vi hành nghề là LUẬT CỨNG, không phải văn phong: người dùng hành nghề Y sỹ, nội
 * dung không được hàm ý "khám chữa bệnh". Nó là hằng số trong mã chứ không nằm trong bộ
 * luật rút từ mẫu — không ai gỡ nó qua màn duyệt được.
 */
export const LUAT_PHAM_VI_HANH_NGHE: DieuLuat = {
  ma: 'PV1',
  truc: 'pham_vi_hanh_nghe',
  noiDung:
    'Không dùng chữ hàm ý khám chữa bệnh. Bảng từ: khám → đo, phòng khám → phòng chẩn trị, ' +
    'bác sĩ → thầy thuốc, chữa bệnh → điều trị.',
  viDu: 'Thầy thuốc đo kinh lạc tại phòng chẩn trị.',
};

/**
 * Bảng từ cấm. Chú ý "khám" đứng một mình KHÔNG bị bắt — "khám phá", "khám nghiệm" là
 * chữ bình thường. Chỉ bắt các cụm đã ghép nghĩa y tế.
 */
const BANG_TU: Array<{ re: RegExp; tu: string; thay: string }> = [
  { re: /bác\s+sĩ|bác\s+sỹ/gi, tu: 'bác sĩ', thay: 'thầy thuốc' },
  { re: /phòng\s+khám/gi, tu: 'phòng khám', thay: 'phòng chẩn trị' },
  { re: /khám\s+bệnh/gi, tu: 'khám bệnh', thay: 'đo' },
  { re: /chữa\s+bệnh/gi, tu: 'chữa bệnh', thay: 'điều trị' },
  { re: /chẩn\s+đoán\s+bệnh/gi, tu: 'chẩn đoán bệnh', thay: 'nhận định chứng' },
];

export function doPhamViHanhNghe(
  s: string,
): Array<{ tu: string; thay: string; viTri: number }> {
  if (typeof s !== 'string' || !s.trim()) return [];
  const ra: Array<{ tu: string; thay: string; viTri: number }> = [];
  for (const { re, tu, thay } of BANG_TU) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) ra.push({ tu, thay, viTri: m.index });
  }
  return ra.sort((a, b) => a.viTri - b.viTri);
}
