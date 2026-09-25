import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * PHÉP KIỂM PHỦ QUYỀN: mọi route GHI phải có guard vai trò, hoặc nằm trong danh sách miễn trừ
 * kèm LÝ DO viết ra.
 *
 * Vì sao cần: JwtAuthGuard toàn cục KHÔNG đủ — token bệnh nhân cũng là token hợp lệ. Trước đây
 * 85 route ghi hở đúng vì hiểu nhầm chỗ đó. Tệ hơn, đợt vá đầu tiên tự nó BỎ SÓT thêm 25 route
 * nữa, do bộ rà soát lúc ấy loại trừ cả router chỉ vì trong đó có một route @Public — mà @Public
 * thường chỉ nằm trên route ĐỌC. Con người dò bằng mắt hai lần đều sót; nên việc dò giao cho
 * máy, chạy mỗi lần `npm test`.
 *
 * ⚠️ Bẫy khi tự viết bộ dò kiểu này: decorator CẤP CLASS có thể nằm TRƯỚC @Controller
 * (`@Public()` rồi mới `@Controller(...)`). Bản dò đầu chỉ soi quanh @Controller nên báo oan
 * patient-auth (vốn @Public cả class) và seo/gsc (vốn có QuanTriGuard cả class). Ở đây đọc cả
 * khối decorator liền kề ngay trên `export class`.
 */

const THU_MUC = join(__dirname);
const GUARD_VAI_TRO = /(NhanVienGuard|QuanTriGuard)/;

/**
 * Route GHI cố ý KHÔNG có guard vai trò. Thêm vào đây là một QUYẾT ĐỊNH, phải kèm lý do.
 * Khoá: "<tệp>:<đường dẫn route>".
 */
const MIEN_TRU: Record<string, string> = {
  'appointment-slot.router.ts::id/my-book':
    'Bệnh nhân tự đặt vé cho CHÍNH MÌNH; service kiểm chủ sở hữu theo token.',
  'appointment-slot.router.ts::id/my-cancel':
    'Bệnh nhân tự huỷ vé của chính mình.',
  'appointment-slot.router.ts:my-calendar-url/reset':
    'Bệnh nhân tự đổi liên kết lịch .ics của chính mình.',
  'patient.router.ts::id':
    'Bệnh nhân tự sửa hồ sơ của chính mình — chặn bằng assertStaffOrOwner(req.user, id) trong hàm.',
  'patient.router.ts::id/fcm-token':
    'Bệnh nhân tự ghi token thiết bị của chính mình — assertStaffOrOwner.',

  // ⏳ TẠM THỜI, XOÁ ĐƯỢC NGAY khi phiên làm module sự cố commit bản vá của họ.
  // Tại HEAD hôm nay route này chưa gắn guard, chỉ tự kiểm `u.kind !== 'staff'` trong thân hàm
  // (trả 200 {luu:false} thay vì 403). Họ đã sửa thành @UseGuards(NhanVienGuard) nhưng thay đổi
  // còn chờ duyệt commit. Ghi miễn trừ ở đây để HEAD không đỏ vì việc của phiên khác — một bài
  // kiểm đỏ sẵn sẽ dạy người ta phớt lờ nó. Khi bản vá kia vào, dòng này thành vô dụng và nên xoá.
  'su-co.router.ts:fcm-token':
    'TẠM THỜI: tự kiểm kind !== "staff" trong thân hàm; bản vá gắn guard đang chờ commit.',
};

interface Route {
  tep: string;
  duong: string;
  dong: number;
  congKhai: boolean;
  coGuard: boolean;
}

/** Đọc khối decorator liền kề NGAY TRÊN một dòng (kể cả chú thích xen giữa). */
function khoiDecoratorTren(L: string[], i: number): string {
  let j = i - 1;
  const khoi: string[] = [];
  while (j >= 0) {
    const s = L[j].trim();
    if (s === '') {
      if (khoi.length) break;
      j--;
      continue;
    }
    if (
      s.startsWith('@') ||
      s.startsWith('//') ||
      s.startsWith('*') ||
      s.startsWith('/*') ||
      s.startsWith(')')
    ) {
      khoi.push(L[j]);
      j--;
      continue;
    }
    break;
  }
  return khoi.join('\n');
}

function docRoute(tep: string): Route[] {
  const L = readFileSync(join(THU_MUC, tep), 'utf8').split('\n');
  const ra: Route[] = [];
  L.forEach((dong, idx) => {
    if (!dong.startsWith('export class')) return;
    const khoiLop = khoiDecoratorTren(L, idx);
    const lopCongKhai = khoiLop.includes('@Public()');
    const lopCoGuard =
      GUARD_VAI_TRO.test(khoiLop) && khoiLop.includes('@UseGuards');

    let ket = L.length;
    for (let k = idx + 1; k < L.length; k++)
      if (L[k].startsWith('export class')) {
        ket = k;
        break;
      }

    for (let i = idx; i < ket; i++) {
      const m = /^\s*@(Post|Put|Patch|Delete)\(\s*'?([^')]*)'?/.exec(L[i]);
      if (!m) continue;
      const khoi = khoiDecoratorTren(L, i);
      ra.push({
        tep,
        duong: m[2] || '',
        dong: i + 1,
        congKhai: lopCongKhai || khoi.includes('@Public()'),
        coGuard:
          lopCoGuard ||
          (GUARD_VAI_TRO.test(khoi) && khoi.includes('@UseGuards')),
      });
    }
  });
  return ra;
}

const TAT_CA = readdirSync(THU_MUC)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'))
  .flatMap(docRoute);

describe('Phủ quyền trên route GHI', () => {
  it('quét được tập route ghi (chốt để bài kiểm không âm thầm rỗng)', () => {
    // Nếu số này tụt về 0 thì bộ dò hỏng, không phải repo sạch.
    expect(TAT_CA.length).toBeGreaterThan(150);
  });

  it('mọi route ghi đều có guard vai trò, @Public, hoặc miễn trừ có lý do', () => {
    const ho = TAT_CA.filter((r) => !r.congKhai && !r.coGuard).filter(
      (r) => !(`${r.tep}:${r.duong}` in MIEN_TRU),
    );
    const mota = ho.map((r) => `${r.tep}:${r.dong} → ${r.duong || '(gốc)'}`);
    expect(mota).toEqual([]);
  });

  it('route CÔNG KHAI ghi phải ít và biết trước — mỗi cái là một quyết định', () => {
    const ck = TAT_CA.filter((r) => r.congKhai)
      .map((r) => `${r.tep}:${r.duong}`)
      .sort();
    // Mỗi dòng dưới đây là một cửa mở ra Internet, không cần token. Thêm dòng mới vào danh
    // sách này phải là quyết định có ý thức, kèm trần thân request riêng (xem main.ts).
    expect(ck).toEqual([
      'auth.router.ts:admin/login', // đăng nhập nhân viên
      'patient-auth.router.ts:login', // đăng nhập bệnh nhân
      'patient-auth.router.ts:register', // đăng ký bệnh nhân
      'patient-auth.router.ts:request-deletion', // yêu cầu xoá tài khoản (Google Play đòi)
      'su-co.router.ts:bao', // khách chưa đăng nhập vẫn báo được lỗi; trần riêng 128kb
      'tra-cuu.router.ts:ten', // liên kết chéo từ điển cho trang công khai; route CHỈ ĐỌC
    ]);
  });

  it('danh sách miễn trừ không có mục chết (mục không còn khớp route nào)', () => {
    const khoa = new Set(TAT_CA.map((r) => `${r.tep}:${r.duong}`));
    expect(Object.keys(MIEN_TRU).filter((k) => !khoa.has(k))).toEqual([]);
  });
});
