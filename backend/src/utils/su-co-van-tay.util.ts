import { createHash } from 'crypto';

/**
 * Tầng lõi của tab "Góp Ý & Lỗi": chuẩn hoá → vân tay → che dữ liệu → xếp hạng.
 *
 * Dùng chung cho MỌI nguồn tín hiệu (lỗi backend, lỗi frontend, góp ý người dùng, tín hiệu UX)
 * vì tất cả đều đi qua một cửa duy nhất `POST /su-co/bao`. Viết một lần ở đây thì luật che dữ
 * liệu và luật gom cụm không thể lệch nhau giữa các nguồn.
 *
 * Có bộ test riêng: `npm test -- su-co-van-tay`.
 */

/** Loại tín hiệu. `loi_be` = lỗi backend, `loi_fe` = lỗi frontend. */
export type LoaiSuCo = 'loi_be' | 'loi_fe' | 'gop_y' | 'ux';

/** Làn — để nhiễu của tín hiệu UX không lấn át lỗi thật trong danh sách mặc định. */
export type LaneSuCo = 'loi' | 'gop_y' | 'ux';

export type HangSuCo = 'nang' | 'vua' | 'nhe';

export function laneCuaLoai(loai: LoaiSuCo): LaneSuCo {
  if (loai === 'gop_y') return 'gop_y';
  if (loai === 'ux') return 'ux';
  return 'loi';
}

// ── Chuẩn hoá route ────────────────────────────────────────────────────────────────────

const RE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_NGAY = /^\d{4}-\d{2}-\d{2}$/;
const RE_HEX_DAI = /^[0-9a-f]{16,}$/i;
const RE_SO = /^\d+$/;

/**
 * `/patients/123/kham/45` → `/patients/:id/kham/:id`.
 *
 * Không có bước này thì MỖI bệnh nhân sinh một cụm riêng: bảng phình thành rác và tab vô dụng.
 * Lỗi đó không lộ ra lúc chạy thử một mình, chỉ lộ sau vài tuần chạy thật.
 */
export function chuanHoaRoute(route: string): string {
  if (typeof route !== 'string' || !route.trim()) return '/';

  // Bỏ query và hash: cùng một trang, khác tham số → vẫn là một cụm.
  let duong = route.split('?')[0].split('#')[0].trim();

  // URL tuyệt đối → chỉ giữ phần đường dẫn.
  const viTriHost = duong.match(/^https?:\/\/[^/]+(\/.*)?$/i);
  if (viTriHost) duong = viTriHost[1] || '/';

  const doan = duong
    .split('/')
    .filter(Boolean)
    .map((d) => {
      if (RE_SO.test(d)) return ':id';
      if (RE_UUID.test(d)) return ':id';
      if (RE_NGAY.test(d)) return ':date';
      if (RE_HEX_DAI.test(d)) return ':id';
      return d;
    });

  return doan.length ? '/' + doan.join('/') : '/';
}

/** Tiền tố hạ tầng, không mang thông tin về khu vực nghiệp vụ. */
const TIEN_TO_BO_QUA = new Set(['app', 'api']);

/** Khu vực nghiệp vụ của một route — dùng làm nhãn gom nhóm trên bảng. */
export function khuVucTuRoute(route: string): string {
  const doan = chuanHoaRoute(route).split('/').filter(Boolean);
  while (doan.length && TIEN_TO_BO_QUA.has(doan[0])) doan.shift();
  const dau = doan[0];
  if (!dau || dau.startsWith(':')) return 'home';
  return dau;
}

// ── Chuẩn hoá thông điệp ───────────────────────────────────────────────────────────────

const RE_DUONG_DAN_FILE =
  /(?:\/[\w.@-]+){2,}\.(?:ts|tsx|js|jsx|mjs|cjs|vue|json|sql)\b/g;
const RE_UUID_TRONG_CAU =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const RE_HEX_TRONG_CAU = /\b[0-9a-f]{24,}\b/gi;
const RE_SO_TRONG_CAU = /\d+/g;

const DAI_TOI_DA_THONG_DIEP = 200;

/**
 * Hạ thông điệp về dạng so sánh được: bỏ số, uuid, đường dẫn tuyệt đối.
 *
 * Thứ tự QUAN TRỌNG — rút đường dẫn về tên file TRƯỚC khi bỏ số, nếu không thì
 * `/app/dist/v2/x.js` đã mất số và không còn khớp đường dẫn nữa.
 */
export function chuanHoaThongDiep(thongDiep: string): string {
  if (typeof thongDiep !== 'string' || !thongDiep) return '';

  return (
    thongDiep
      // Máy dev (/Users/…) và VPS (/app/dist/…) chạy cùng một dòng code — không được thành 2 cụm.
      .replace(RE_DUONG_DAN_FILE, (m) => m.split('/').pop() || m)
      .toLowerCase()
      .replace(RE_UUID_TRONG_CAU, ':uuid')
      .replace(RE_HEX_TRONG_CAU, ':hex')
      .replace(RE_SO_TRONG_CAU, ':n')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, DAI_TOI_DA_THONG_DIEP)
  );
}

// ── Vân tay ────────────────────────────────────────────────────────────────────────────

/**
 * Danh tính của một cụm. 16 ký tự hex: đủ tránh trùng, đủ ngắn để hiện trên bảng
 * và để người đọc đọc to cho nhau nghe.
 */
export function tinhVanTay(
  loai: LoaiSuCo,
  routeChuan: string,
  thongDiepChuan: string,
): string {
  return createHash('sha1')
    .update(`${loai}|${routeChuan}|${thongDiepChuan}`)
    .digest('hex')
    .slice(0, 16);
}

// ── Che dữ liệu ────────────────────────────────────────────────────────────────────────

/** Khoá bí mật kỹ thuật — lộ ra là mất quyền kiểm soát hệ thống. */
const KHOA_BI_MAT = [
  'password',
  'password_hash',
  'passwordhash',
  'pass',
  'pwd',
  'authorization',
  'token',
  'access_token',
  'accesstoken',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
  'client_secret',
  'private_key',
  'service_account',
  'firebase_service_account',
];

/**
 * Khoá mang DANH TÍNH bệnh nhân.
 *
 * Bảng lỗi phải giúp sửa lỗi, không được biến thành bản sao bệnh án: ai vào được tab là đọc
 * được hết. Cố ý KHÔNG che khoá `ten` chung chung — `ten` ở app này hầu hết là tên vị thuốc,
 * tên huyệt, tên pháp trị; che đi thì mất luôn khả năng sửa lỗi mà chẳng bảo vệ được ai.
 */
const KHOA_DANH_TINH = [
  'hoten',
  'ho_ten',
  'fullname',
  'full_name',
  'sdt',
  'phone',
  'sodienthoai',
  'so_dien_thoai',
  'ngaysinh',
  'ngay_sinh',
  'dateofbirth',
  'date_of_birth',
  'diachi',
  'dia_chi',
  'address',
  'cccd',
  'cmnd',
  'email',
  'tiensu',
  'tien_su',
  'medicalhistory',
  'medical_history',
  'ghichu',
  'ghi_chu',
  'notes',
  'reason',
  'lydo',
  'ly_do',
];

const KHOA_PHAI_CHE = new Set([...KHOA_BI_MAT, ...KHOA_DANH_TINH]);

/** Số điện thoại Việt Nam nằm lẫn trong câu văn (log, thông điệp lỗi). */
const RE_SDT = /\b(?:0|\+84)\d{8,10}\b/g;

const DAI_TOI_DA_CHUOI = 300;
const PHAN_TU_TOI_DA_MANG = 20;
const SAU_TOI_DA = 8;

/**
 * Che dữ liệu nhạy cảm. Chạy ở CẢ hai đầu: máy khách che trước khi gửi, máy chủ che lại
 * lần nữa — vì máy khách là thứ không kiểm soát được, ai cũng gọi thẳng API được.
 */
export function cheDuLieu(
  giaTri: unknown,
  sau = 0,
  toTien: unknown[] = [],
): unknown {
  if (giaTri === null || giaTri === undefined) return giaTri;

  if (typeof giaTri === 'string') {
    const daChe = giaTri.replace(RE_SDT, '***');
    return daChe.length > DAI_TOI_DA_CHUOI
      ? daChe.slice(0, DAI_TOI_DA_CHUOI) + '…'
      : daChe;
  }

  if (typeof giaTri === 'number' || typeof giaTri === 'boolean') return giaTri;

  if (sau > SAU_TOI_DA) return '[sâu]';

  // Tham chiếu vòng: chỉ tính TỔ TIÊN trực hệ. Dùng Set phẳng thì hai nhánh trỏ tới cùng một
  // object (chuyện bình thường) cũng bị báo vòng và mất dữ liệu thật.
  if (toTien.includes(giaTri)) return '[vòng]';
  const toTienMoi = [...toTien, giaTri];

  if (Array.isArray(giaTri)) {
    return giaTri
      .slice(0, PHAN_TU_TOI_DA_MANG)
      .map((v) => cheDuLieu(v, sau + 1, toTienMoi));
  }

  if (typeof giaTri === 'object') {
    const ra: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(giaTri as Record<string, unknown>)) {
      ra[k] = KHOA_PHAI_CHE.has(k.toLowerCase())
        ? '***'
        : cheDuLieu(v, sau + 1, toTienMoi);
    }
    return ra;
  }

  // Còn lại là symbol / function / bigint — String() trên object đã bị chặn ở nhánh trên.
  // Không dùng String() thẳng: nếu có kiểu nào lọt qua, chuỗi '[object Object]' vừa vô nghĩa
  // vừa che mất việc mình đã bỏ sót một kiểu.
  return typeof giaTri === 'bigint' ? `${giaTri}n` : `[${typeof giaTri}]`;
}

// ── Xếp hạng ───────────────────────────────────────────────────────────────────────────

export interface ThamSoXepHang {
  loai: LoaiSuCo;
  soLan: number;
  soNguoi: number;
  /** Lỗi làm người dùng KHÔNG hoàn tất được việc đang làm (lưu ca khám, đặt lịch…). */
  chanThaoTac?: boolean;
}

const THANG_HANG: HangSuCo[] = ['nhe', 'vua', 'nang'];

function nangMotBac(hang: HangSuCo): HangSuCo {
  const i = THANG_HANG.indexOf(hang);
  return THANG_HANG[Math.min(i + 1, THANG_HANG.length - 1)];
}

/**
 * Hạng quyết định việc CÓ BÁO ĐỘNG hay không, nên luật phải đọc được bằng mắt và không
 * phụ thuộc điểm số bí ẩn.
 */
export function xepHang({
  loai,
  soLan,
  soNguoi,
  chanThaoTac,
}: ThamSoXepHang): HangSuCo {
  let hang: HangSuCo;

  if (loai === 'gop_y') {
    // Có người thật bỏ công gõ mô tả — không bao giờ là chuyện nhẹ.
    hang = 'vua';
  } else if (loai === 'ux') {
    // Chậm/rage-click là tín hiệu, không phải lỗi. Chỉ đáng bận tâm khi dính nhiều người.
    hang = soNguoi >= 10 ? 'vua' : 'nhe';
  } else if (soNguoi >= 3 || soLan >= 20) {
    hang = 'nang';
  } else if (soNguoi >= 2 || soLan >= 5) {
    hang = 'vua';
  } else {
    hang = 'nhe';
  }

  return chanThaoTac ? nangMotBac(hang) : hang;
}

// ── Chống bão sự kiện ──────────────────────────────────────────────────────────────────

/**
 * Một trang vỡ có thể bắn hàng nghìn sự kiện mỗi phút. Postgres ở đây là Aiven (có hạn mức),
 * nên quá ngưỡng thì chỉ TĂNG BỘ ĐẾM của cụm, không chèn thêm dòng chi tiết nữa: lần thứ 201
 * không nói thêm được gì so với lần thứ 200.
 */
export const NGUONG_BAO_MOI_GIO = 200;

export function nenChenBanGhi(soLanTrongGio: number): boolean {
  return soLanTrongGio < NGUONG_BAO_MOI_GIO;
}

// ── Đoán chỗ cần nhìn trong mã nguồn ───────────────────────────────────────────────────

const RE_FILE_TRONG_STACK =
  /(?:[\w./@-]*\/)?[\w.-]+\.(?:tsx?|jsx?|mjs|cjs|vue)\b/g;
const SO_FILE_TOI_DA = 8;

/** Đuôi .js là BẢN BUILD; mã nguồn luôn là .ts. Sửa .js trong dist là sửa vào chỗ bị ghi đè. */
function veMaNguon(duong: string): string {
  return duong.replace(/\.js$/, '.ts').replace(/\.jsx$/, '.tsx');
}

/**
 * Đoán những file đáng mở ra xem khi sửa cụm này.
 *
 * Nguồn đáng tin nhất là STACK TRACE; quy ước đặt tên của dự án chỉ dùng để bù khi không có
 * stack (góp ý người dùng, lỗi mạng…). Cố ý KHÔNG tra sourcemap: đây là gợi ý mở đường, người
 * sửa vẫn phải tự đọc — nói chắc quá về một chỗ đoán sẽ khiến người ta tìm sai chỗ lâu hơn.
 */
export function doanFileLienQuan(
  stack: string | null | undefined,
  loai: LoaiSuCo,
  khuVuc: string,
): string[] {
  const ra: string[] = [];
  const them = (f: string) => {
    if (f && !ra.includes(f) && ra.length < SO_FILE_TOI_DA) ra.push(f);
  };

  const laBackend = loai === 'loi_be';

  if (typeof stack === 'string' && stack) {
    for (const khop of stack.match(RE_FILE_TRONG_STACK) || []) {
      // Không ai sửa được thư viện ngoài — để trong danh sách chỉ tổ làm loãng.
      if (khop.includes('node_modules')) continue;

      if (khop.includes('/dist/')) {
        them('backend/src/' + veMaNguon(khop.split('/dist/').pop() || ''));
      } else if (khop.includes('backend/src/')) {
        them('backend/' + veMaNguon(khop.split('backend/').pop() || ''));
      } else if (khop.includes('frontend/src/')) {
        them('frontend/' + (khop.split('frontend/').pop() || ''));
      } else if (khop.endsWith('.vue')) {
        // Biết tên file nhưng không biết thư mục — nói đúng mức mình biết.
        them('frontend/src/**/' + khop.split('/').pop());
      } else if (laBackend) {
        them('backend/src/**/' + veMaNguon(khop.split('/').pop() || ''));
      } else {
        them('frontend/src/**/' + (khop.split('/').pop() || ''));
      }
    }
  }

  if (laBackend) {
    // Quy ước ĐẢO của dự án: routers/ chứa @Controller, controllers/ chứa @Injectable.
    them(`backend/src/routers/${khuVuc}.router.ts`);
    them(`backend/src/controllers/${khuVuc}.controller.ts`);
  } else if (!ra.some((f) => f.startsWith('frontend/'))) {
    // Không đoán được view nào: chỉ vào bảng route, nơi tra được trang nào phục vụ route này.
    them('frontend/src/router/index.ts');
  }

  return ra;
}
