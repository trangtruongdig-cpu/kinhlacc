/**
 * Áp bản sửa vào một giá trị JSON của kho nội dung.
 *
 * ⚠️ VÌ SAO THAY TẠI CHỖ chứ không ghi đè cả cột: `de_xuat` của bot là CHỮ THUẦN —
 * `rutChu` đã bóc sạch định dạng khi đưa bài cho mô hình đọc. Còn cột `ec_*` là JSONB
 * Portable Text với khối, span, marks. Ghi chữ thuần lên đó là xoá cấu trúc của cả mục,
 * và không lùi được trừ khi đọc lại `revisions`.
 *
 * Nên: tìm span nào chứa trích dẫn, thay đúng đoạn đó, giữ nguyên tất cả phần còn lại.
 * Không tìm thấy thì `soLanThay: 0` và bên gọi phải HUỶ giao dịch.
 */

/** Khoá của lớp lưu trữ — không phải chữ người đọc, đừng thay vào đó. */
const KHOA_KY_THUAT = new Set([
  '_type', '_key', '_ref', 'marks', 'markDefs', 'style', 'listItem', 'level', 'id', 'slug',
]);

function gon(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Thay trên MỘT chuỗi, hai lượt.
 *
 * ⚠️ Lượt hai KHÔNG phải là so bằng. `rutChu` gộp khoảng trắng khi đưa bài cho mô hình, nên
 * trích dẫn về tay ta đã gộp, còn span gốc giữ nguyên xuống dòng và khoảng trắng đôi. Bản
 * đầu của hàm này chỉ khớp khi cả span BẰNG trích dẫn — và lượt áp bản sửa đầu tiên trên
 * kho thật thất bại vì đúng lý do đó: trích dẫn nằm giữa một span dài.
 *
 * Nên lượt hai dựng bản đồ chỉ số: gộp khoảng trắng nhưng ghi lại mỗi ký tự gộp ứng với
 * ký tự nào của chuỗi gốc, tìm trích dẫn trên bản gộp, rồi cắt đúng đoạn TRONG GỐC.
 */
function thayMotChuoi(chu: string, tim: string, thay: string): { ra: string; so: number } {
  if (chu.includes(tim)) {
    const so = chu.split(tim).length - 1;
    return { ra: chu.split(tim).join(thay), so };
  }

  // Bản gộp + bản đồ chỉ số về chuỗi gốc.
  let gopChu = '';
  const viTriGoc: number[] = [];
  let truocLaTrang = false;
  for (let i = 0; i < chu.length; i++) {
    const k = chu[i];
    if (/\s/.test(k)) {
      if (!truocLaTrang && gopChu.length) {
        gopChu += ' ';
        viTriGoc.push(i);
      }
      truocLaTrang = true;
    } else {
      gopChu += k;
      viTriGoc.push(i);
      truocLaTrang = false;
    }
  }
  const gopTim = gon(tim);
  if (!gopTim) return { ra: chu, so: 0 };

  const dau = gopChu.indexOf(gopTim);
  if (dau < 0) return { ra: chu, so: 0 };

  // Cắt trong GỐC theo chỉ số đã ghi. Ký tự cuối của đoạn gộp ứng với viTriGoc[cuối],
  // nên ranh giới bên phải là chỉ số đó + 1.
  const gocDau = viTriGoc[dau];
  const gocCuoi = viTriGoc[dau + gopTim.length - 1] + 1;
  return { ra: chu.slice(0, gocDau) + thay + chu.slice(gocCuoi), so: 1 };
}

export function thayTrongJson(
  v: unknown,
  trichDan: string,
  deXuat: string,
): { ketQua: unknown; soLanThay: number } {
  if (!trichDan || !trichDan.trim()) return { ketQua: v, soLanThay: 0 };
  let dem = 0;

  const di = (x: unknown): unknown => {
    if (typeof x === 'string') {
      const { ra, so } = thayMotChuoi(x, trichDan, deXuat);
      dem += so;
      return ra;
    }
    if (Array.isArray(x)) return x.map(di);
    if (x && typeof x === 'object') {
      const ra: Record<string, unknown> = {};
      for (const [k, gt] of Object.entries(x as Record<string, unknown>)) {
        ra[k] = KHOA_KY_THUAT.has(k) ? gt : di(gt);
      }
      return ra;
    }
    return x;
  };

  const ketQua = di(v);
  return { ketQua, soLanThay: dem };
}

/** Đoạn khác biệt phải dài ít nhất ngần này — thay một hai ký tự là quá mạo hiểm. */
const DAI_TOI_THIEU_DOAN = 4;

/**
 * Hai cụm khác biệt cách nhau tối đa ngần này token khớp thì gộp làm một đoạn. Ba là vừa:
 * đủ để "( " và "thức" về cùng một đoạn, chưa đủ để hai thay đổi cách nhau một câu bị
 * trùm vào nhau rồi phình ra xuyên khối.
 */
const GOP_TOI_DA = 3;

/**
 * Bóc ra đoạn khác nhau giữa trích dẫn và bản sửa: bỏ tiền tố chung và hậu tố chung, còn
 * lại là phần thật sự đổi. Trả null khi không đổi gì, hoặc khi đoạn đổi quá ngắn để nhận
 * dạng an toàn.
 */
export function doanKhacBiet(
  trichDan: string,
  deXuat: string,
): { tim: string; thay: string } | null {
  const a = trichDan;
  const b = deXuat;
  if (a === b) return null;

  let dau = 0;
  while (dau < a.length && dau < b.length && a[dau] === b[dau]) dau++;
  let cuoi = 0;
  while (
    cuoi < a.length - dau &&
    cuoi < b.length - dau &&
    a[a.length - 1 - cuoi] === b[b.length - 1 - cuoi]
  ) {
    cuoi++;
  }

  // Lùi ranh giới TRÁI về đầu từ, để đoạn tìm không cắt giữa một từ.
  while (dau > 0 && !/\s/.test(a[dau - 1])) dau--;

  // Nới ranh giới PHẢI sang hết từ kế tiếp cho tới khi đoạn đủ dài để định vị.
  // Đoạn tối thiểu của ca thật là "( " — hai ký tự, xuất hiện khắp bài; nới thành
  // "( thức" thì nó đã đủ riêng để nhận ra chỗ cần sửa.
  let phai = a.length - cuoi;
  while (phai - dau < DAI_TOI_THIEU_DOAN && phai < a.length) {
    phai++;
    while (phai < a.length && !/\s/.test(a[phai])) phai++;
  }
  phai = Math.min(phai, a.length);
  cuoi = a.length - phai;

  const tim = a.slice(dau, phai);
  const thay = b.slice(dau, b.length - cuoi);
  if (tim.length < DAI_TOI_THIEU_DOAN) return null;
  return { tim, thay };
}

/**
 * Áp bản sửa khi trích dẫn TRẢI QUA NHIỀU KHỐI Portable Text.
 *
 * Đây là ca thường gặp, không phải ngoại lệ: `rutChu` nối các khối bằng khoảng trắng nên
 * mô hình đọc chúng như một câu liền và trích cả đoạn xuyên khối. Thay cả trích dẫn thì
 * không span nào khớp.
 *
 * Luật an toàn: chỉ thay trong span mà chữ của nó là ĐOẠN CON của trích dẫn — tức span đó
 * đúng là phần bot đã đọc và đã phê. Cùng đoạn khác biệt xuất hiện ở chỗ khác trong bài thì
 * không được đụng; đã đo một ca như vậy ngay lượt áp đầu.
 */
export function apTheoDoanKhacBiet(
  v: unknown,
  trichDan: string,
  deXuat: string,
): { ketQua: unknown; soLanThay: number; soDoan: number; soDoanApDuoc: number } {
  const doan = cacDoanKhacBiet(trichDan, deXuat);
  if (!doan.length) return { ketQua: v, soLanThay: 0, soDoan: 0, soDoanApDuoc: 0 };

  const gopTrich = gon(trichDan);
  let dem = 0;
  let apDuoc = 0;
  let hienTai = v;

  for (const d of doan) {
    // Đoạn không định vị được: tính vào soDoan nhưng không vào soDoanApDuoc, nên bên gọi
    // thấy chúng lệch nhau và huỷ giao dịch.
    if (!d.tim) continue;
    let demDoan = 0;
    const di = (x: unknown): unknown => {
      if (typeof x === 'string') {
        const g = gon(x);
        // Span phải nằm TRONG đoạn bot đã đọc. Ngưỡng 12 ký tự để một span ngắn kiểu
        // "là Ẩu" không tình cờ là đoạn con của mọi thứ.
        if (g.length < 12 || !gopTrich.includes(g)) return x;
        const { ra, so } = thayMotChuoi(x, d.tim, d.thay);
        demDoan += so;
        return ra;
      }
      if (Array.isArray(x)) return x.map(di);
      if (x && typeof x === 'object') {
        const ra: Record<string, unknown> = {};
        for (const [k, gt] of Object.entries(x as Record<string, unknown>)) {
          ra[k] = KHOA_KY_THUAT.has(k) ? gt : di(gt);
        }
        return ra;
      }
      return x;
    };
    const thu = di(hienTai);
    if (demDoan > 0) {
      hienTai = thu;
      dem += demDoan;
      apDuoc += 1;
    }
  }

  return { ketQua: hienTai, soLanThay: dem, soDoan: doan.length, soDoanApDuoc: apDuoc };
}

/**
 * Tách các đoạn khác biệt giữa trích dẫn và bản sửa, theo TỪ.
 *
 * ⚠️ Một lời phê thường mang NHIỀU thay đổi rải rác. Ca thật đầu tiên: bản sửa vừa bỏ
 * khoảng trắng trong "( thức ăn)" vừa thêm dấu chấm sau "Can ẩu" — cách nhau 60 ký tự.
 * Lấy một đoạn khác biệt duy nhất thì nó phình ra trùm cả hai và xuyên nhiều khối Portable
 * Text, nên không span nào chứa nổi.
 */
export function cacDoanKhacBiet(
  trichDan: string,
  deXuat: string,
): Array<{ tim: string; thay: string }> {
  const A = trichDan.split(/(\s+)/);
  const B = deXuat.split(/(\s+)/);

  // LCS trên mảng từ. Trích dẫn dài nhất của bot cỡ vài trăm từ nên bảng n×m thoải mái.
  const n = A.length;
  const m = B.length;
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
  }

  // Đi ngược bảng, gom các cụm KHÁC NHAU liền kề thành từng đoạn.
  const ra: Array<{ tim: string; thay: string }> = [];
  let i = 0;
  let j = 0;
  let cumA: string[] = [];
  let cumB: string[] = [];
  const chot = () => {
    const tim = cumA.join('');
    const thay = cumB.join('');
    if (tim.trim() || thay.trim()) ra.push({ tim, thay });
    cumA = [];
    cumB = [];
  };
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) {
      // GỘP cụm cách nhau ít token. Không gộp thì LCS tách một thay đổi thành hai đoạn
      // vụn — đo được: "( thức" → "(thức" bị chẻ thành {"(" → "(thức"} và {"thức " → ""},
      // và đoạn thứ hai XOÁ MẤT chữ "thức" khỏi bài.
      const dangDo = cumA.length > 0 || cumB.length > 0;
      let khop = 0;
      let k = 0;
      while (i + k < n && j + k < m && A[i + k] === B[j + k] && khop < GOP_TOI_DA) {
        k++;
        khop++;
      }
      const conKhacPhiaSau = i + k < n || j + k < m;
      if (dangDo && conKhacPhiaSau && khop < GOP_TOI_DA) {
        for (let t = 0; t < k; t++) {
          cumA.push(A[i + t]);
          cumB.push(B[j + t]);
        }
        i += k;
        j += k;
      } else {
        chot();
        i++;
        j++;
      }
    } else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) {
      cumB.push(B[j++]);
    } else {
      cumA.push(A[i++]);
    }
  }
  chot();

  // Đoạn quá ngắn (hoặc chỉ THÊM chữ, tim rỗng) thì không định vị an toàn được: "ẩu" hai
  // ký tự sẽ khớp cả chục chỗ trong bài. KHÔNG lọc chúng ra khỏi danh sách — đánh dấu
  // `tim: ''` để bên áp biết là còn thay đổi chưa xử lý được.
  //
  // Lọc lặng là đường dẫn tới ghi MỘT PHẦN rồi báo thành công, tức người duyệt tưởng bản
  // sửa đã vào trọn mà thực ra còn nửa.
  return ra.map((d) => ({
    tim: d.tim.trim().length >= DAI_TOI_THIEU_DOAN ? d.tim : '',
    thay: d.thay,
  }));
}
