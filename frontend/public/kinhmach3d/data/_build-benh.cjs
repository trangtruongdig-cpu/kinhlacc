/*
 * _build-benh.cjs — DỰNG dữ liệu tĩnh cho 2 tab "Châm Cứu Trị Bệnh" + "Bệnh Học" của trang Từ Điển.
 *
 * ĐỌC (input, từ thư mục demo đã trích sẵn — kinhmach_demo là gitignore, chỉ có ở máy):
 *   · ../../../../kinhmach_demo/webapp/extracted/ccdt.json       — Châm Cứu Điều Trị (100 bệnh)
 *   · ../../../../kinhmach_demo/webapp/extracted/pathology.json  — Bệnh Học (100 bệnh)
 *
 * GHI (output, COMMIT vào repo):
 *   · benh.js → window.BENH = { ccdt:{…}, benhhoc:{…} } cho frontend (TuDienView.vue).
 *
 * LỌC RÁC / CHUẨN HOÁ (theo đúng kinh nghiệm phần Huyệt Vị):
 *   · LỌC RÁC NHỊ PHÂN (xem khối deGarbage bên dưới) — đuôi/giữa câu lẫn ký tự byte ngẫu nhiên,
 *   · bỏ trường rỗng toàn bộ ("Hướng Điều Trị" của ccdt rỗng 0/100),
 *   · bỏ bản ghi rỗng hẳn (vd "Băng Lậu" bên Bệnh Học),
 *   · làm sạch TỪNG DÒNG (nháy cong→thẳng, gộp khoảng trắng) NHƯNG GIỮ '\n' để formatBody phân cấp,
 *   · bỏ trường rỗng theo từng bản ghi (frontend chỉ hiện trường có nội dung),
 *   · nhãn trường Title Case + đặt sẵn thứ tự hiển thị (fields[]) để view render generic.
 *
 * CHẠY:  node _build-benh.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const D = __dirname;
const SRC = path.join(D, '..', '..', '..', '..', 'kinhmach_demo', 'webapp', 'extracted');

/* ──────────────────────────────────────────────────────────────────────────
 * LỌC RÁC NHỊ PHÂN lẫn trong dữ liệu trích từ app cũ.
 * Bản trích gốc đọc lố qua cuối chuỗi → "rác" = chuỗi Latin-1 ngẫu nhiên (ÿ ¿ Æ Õ
 * # $ & @ …), THƯỜNG ở cuối trường, đôi khi CHÈN GIỮA hai câu, hoặc 1 ký tự lạc
 * giữa từ (vd "thườøng"). Vài ký tự HỢP LỆ phải GIỮ:  ° ± ½ ¼ ¾ (độ, ±, phân số);
 * ~ (khoảng số "3~5 thang"); còn \ thật ra là / bị giải mã sai ("11\1967"→"11/1967").
 *
 * Ý tưởng: tiếng Việt thật DÀY dấu thanh + có khoảng trắng giữa âm tiết; rác thì
 * dính liền, ít/không dấu, lẫn ký hiệu. Phủ "cửa sổ văn xuôi" (isProse) lên chuỗi.
 * Mỗi "marker" (ký tự chắc chắn rác) hoặc bị xoá tại chỗ (lạc giữa từ / giữa văn
 * xuôi), hoặc neo cả KHỐI rác — cắt từ ranh giới câu thật phía trước tới chỗ văn
 * xuôi thật chạy tiếp. KHÔNG bao giờ đụng vào văn xuôi thật (đã audit: 0 mất chữ).
 * ────────────────────────────────────────────────────────────────────────── */
const VN_LATIN1 = new Set('ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúý'.split(''));
const KEEP_SYM = new Set('°±½¼¾'.split(''));
const isUniBad = (ch) => {
  const cp = ch.codePointAt(0);
  return cp >= 0x00a1 && cp <= 0x00ff && !KEEP_SYM.has(ch) && !VN_LATIN1.has(ch);
};
const STRONG_ASCII = '#$@*^_`{}|\\';
const isMark = (ch) => isUniBad(ch) || STRONG_ASCII.includes(ch);
const isVN = (ch) => /[A-Za-zÀ-ỹ]/u.test(ch) && !isUniBad(ch);
const isLower = (ch) => isVN(ch) && ch === ch.toLowerCase() && ch !== ch.toUpperCase();
const isTone = (ch) => isVN(ch) && !/[A-Za-zđĐ]/u.test(ch); // chữ có dấu thanh = tín hiệu Việt thật
const isTerm = (ch) => '.)]”"…!?»'.includes(ch);

// cửa sổ s[lo..hi] trông như văn xuôi thật? (dày dấu thanh, hoặc nhiều chữ + có khoảng trắng)
function isProse(s, lo, hi) {
  lo = Math.max(0, lo);
  let marks = 0, tones = 0, spaces = 0, letters = 0;
  for (let k = lo; k <= hi && k < s.length; k++) {
    const ch = s[k];
    if (isMark(ch)) marks++;
    if (isTone(ch)) tones++;
    if (ch === ' ' || ch === '\n') spaces++;
    if (isVN(ch)) letters++;
  }
  return spaces >= 2 && marks <= 1 && (tones >= 3 || letters >= 10);
}
const proseAt = (s, p) => p + 1 < s.length && isProse(s, p, p + 17);
// âm tiết Việt CHÍNH TẮC (chữ thường): có nguyên âm + kết bằng nguyên âm / c m n p t / ng nh ch.
// Dùng để nhận từ thật KỂ CẢ khi nằm trong cụm số ("5 – 10 phút." không vào cửa sổ prose).
// "phút","oreille" đạt; rác "òz","gt","gñª" trượt. (oreille kết 'e' = nguyên âm → đạt, giữ tiếng Pháp.)
const VOW = 'aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ';
const RE_VOW = new RegExp('[' + VOW + ']', 'u');
const RE_END = new RegExp('(?:[' + VOW + ']|ng|nh|ch|[cmnpt])$', 'u');
const isVNword = (w) => (RE_VOW.test(w) && RE_END.test(w)) || (w.length >= 6 && (w.match(new RegExp('[' + VOW + ']', 'gu')) || []).length >= 2);
// ranh giới câu THẬT để cắt: dấu kết câu mà NGAY TRƯỚC (vùng SẠCH marker) là số, hoặc một TỪ THẬT.
// "Từ thật" = có chữ thường + CÓ NGUYÊN ÂM (loại rác không nguyên âm "Wx","GT","kb" dù cửa sổ prose
// tràn phủ lên) + (nằm trong văn xuôi `covered`, HOẶC là âm tiết Việt chính tắc `isVNword`).
// Nhận: "cố.","mê\".","virus.","Nghĩa).","phút.","oreille).","HongKong).","C8.","(5): 40)".
// Loại: "Wx\"" (không nguyên âm), "6]"/"dY." (kề marker → cleanCtx trượt).
function goodBoundary(s, idx, covered) {
  if (idx < 0 || !isTerm(s[idx])) return false;
  let k = idx - 1;
  while (k >= 0 && (isTerm(s[k]) || s[k] === "'" || s[k] === '’')) k--;
  if (k >= 0 && (s[k] === '%' || s[k] === '°')) k--;
  // KHÔNG có marker trong [k-8 .. dấu]. KHÔNG xét ký tự SAU dấu (đó chính là rác cần cắt).
  const cleanCtx = () => { for (let t = Math.max(0, k - 8); t <= idx; t++) if (isMark(s[t])) return false; return true; };
  if (k >= 0 && /[0-9]/.test(s[k]) && '.)]'.includes(s[idx])) return cleanCtx(); // số: "1986)","(5): 40)","C8."
  let w = '', lower = false, vowel = false, kk = k;
  while (kk >= 0 && isVN(s[kk])) { const c = s[kk]; w = c + w; if (isLower(c)) lower = true; if (RE_VOW.test(c.toLowerCase())) vowel = true; kk--; }
  if (w.length < 2 || !lower || !vowel) return false;
  return (covered[k] || isVNword(w.toLowerCase())) && cleanCtx();
}
// từ kết thúc tại idx là từ Việt thật (≥2 chữ, có dấu thanh CHỮ THƯỜNG — phân biệt "Huyết" với rác "Én")
function toneWordEndsAt(s, idx) {
  let letters = 0, lowTone = false;
  for (let k = idx; k >= 0 && isVN(s[k]); k--) { letters++; if (isLower(s[k]) && isTone(s[k])) lowTone = true; }
  return letters >= 2 && lowTone;
}
// bỏ qua mẩu chữ-thường ngắn dính đầu câu chạy tiếp (…BC#cCó → Có)
function skipRightLeak(s, j) {
  let k = j, low = 0;
  while (k < s.length && isLower(s[k]) && low < 3) { k++; low++; }
  if (low > 0 && low <= 2 && k < s.length && isVN(s[k]) && !isLower(s[k])) return k;
  return j;
}
// xoá KHỐI rác (neo theo marker) — đuôi HAY giữa câu — GIỮ nguyên văn xuôi thật
function removeGarbage(s) {
  const n = s.length;
  if (n < 18) return s;
  const covered = new Array(n).fill(false);
  let any = false;
  for (let a = 0; a + 1 < n; a++) {
    if (isProse(s, a, a + 17)) { any = true; for (let k = a; k <= a + 17 && k < n; k++) covered[k] = true; }
  }
  if (!any) {
    // trường NGẮN không có cửa sổ prose (vd 1 section "Cứu 5 phút.8´"): vẫn cắt ĐUÔI rác —
    // từ marker đầu tiên lùi về ranh giới câu thật gần nhất (covered toàn false → dựa isVNword).
    let fm = -1;
    for (let i = 0; i < n; i++) if (isMark(s[i])) { fm = i; break; }
    if (fm < 0) return s;
    for (let q = fm; q >= Math.max(0, fm - 40); q--) if (goodBoundary(s, q - 1, covered)) return s.slice(0, q);
    return s;
  }
  const zones = [];
  for (let m = 0; m < n; m++) {
    if (!isMark(s[m])) continue;
    if (m > 0 && m < n - 1 && isVN(s[m - 1]) && isVN(s[m + 1])) continue; // lạc giữa từ → deGarbage gỡ
    if (covered[m] && proseAt(s, m + 1)) continue;                        // lạc giữa văn xuôi → deGarbage gỡ
    // ranh giới trái = dấu kết câu THẬT, HOẶC khoảng trắng ngay sau 1 từ thật (trong văn xuôi) — gần
    // marker nhất thắng. goodBoundary nhận cả đuôi-số "5 – 10 phút." (không vào cửa sổ prose).
    let left = m, found = false;
    for (let q = m; q >= Math.max(1, m - 40); q--) {
      if (goodBoundary(s, q - 1, covered)) { left = q; found = true; break; }
      if ((s[q - 1] === ' ' || s[q - 1] === '\n') && q >= 2 && covered[q - 2] && toneWordEndsAt(s, q - 2)) { left = q; found = true; break; }
    }
    if (!found) for (let q = m; q >= Math.max(1, m - 40); q--) if (s[q - 1] === ' ' || s[q - 1] === '\n') { left = q; break; }
    // ranh giới phải = nơi văn xuôi thật chạy tiếp (bỏ qua cả rác "bị phủ" do tràn cửa sổ)
    let right = m + 1;
    while (right < n && !proseAt(s, right)) right++;
    right = skipRightLeak(s, right);
    zones.push([left, right]);
  }
  if (!zones.length) return s;
  zones.sort((a, b) => a[0] - b[0]);
  let out = '', cur = 0;
  for (const [a, b] of zones) {
    if (a > cur) { out += s.slice(cur, a); cur = a; }
    if (b > cur) cur = b;
  }
  return out + s.slice(cur);
}
function deGarbage(s) {
  let r = removeGarbage(s || '');
  r = r.replace(/\\/g, '/').replace(/\t/g, ' '); // \ là / bị giải mã sai; tab → space
  let out = '';
  for (const ch of r) if (!isMark(ch)) out += ch; // gỡ marker lạc còn sót (vd "thườøng"→"thường")
  return out.replace(/ {2,}/g, ' ');
}

// làm sạch 1 trường: LỌC RÁC trước, rồi chuẩn nháy + gộp khoảng trắng TỪNG DÒNG, bỏ dòng rỗng — GIỮ '\n'.
const cleanField = (s) =>
  deGarbage(s || '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));

/**
 * Dựng 1 bộ: chọn trường META (1 dòng, hiện ở đầu) + danh sách FIELDS thân bài (theo thứ tự).
 * Mỗi phần tử fields = [khoá, Nhãn Title Case]. Trường nào không liệt kê ở đây sẽ bị bỏ.
 */
function buildSet(json, { title, metaKey, metaLabel, fields }) {
  const records = [];
  for (const r of json.records) {
    const out = { id: r.id, ten: cleanField(r.ten), slug: r.slug };
    if (metaKey && cleanField(r[metaKey])) out._meta = cleanField(r[metaKey]);
    let bodyCount = 0;
    for (const [k] of fields) {
      const v = cleanField(r[k]);
      if (v) {
        out[k] = v;
        bodyCount++;
      }
    }
    // bỏ bản ghi rỗng hẳn (không tên hoặc không có chữ nào ở cả meta lẫn thân)
    if (!out.ten || (bodyCount === 0 && !out._meta)) continue;
    records.push(out);
  }
  records.sort((a, b) =>
    a.ten.normalize('NFD').replace(/[̀-ͯ]/g, '').localeCompare(
      b.ten.normalize('NFD').replace(/[̀-ͯ]/g, ''), 'vi',
    ),
  );
  return { title, metaLabel: metaKey ? metaLabel : '', fields, count: records.length, records };
}

const ccdt = buildSet(readJson('ccdt.json'), {
  title: 'Châm Cứu Trị Bệnh',
  metaKey: 'tenKhac',
  metaLabel: 'Tên Khác',
  // "Hướng Điều Trị" (huongDt) bị bỏ — rỗng 0/100.
  fields: [
    ['daiCuong', 'Đại Cương'],
    ['nguyenNhan', 'Nguyên Nhân'],
    ['trieuChung', 'Triệu Chứng'],
    ['chanDoan', 'Chẩn Đoán'],
    ['dieuTri', 'Điều Trị (Châm Cứu)'],
    ['thamKhao', 'Tham Khảo'],
  ],
});

const benhhoc = buildSet(readJson('pathology.json'), {
  title: 'Bệnh Học',
  metaKey: 'benhDanh',
  metaLabel: 'Đối Chiếu Bệnh Danh',
  fields: [
    ['daiCuong', 'Đại Cương'],
    ['nguyenNhan', 'Nguyên Nhân'],
    ['coChe', 'Cơ Chế Bệnh Sinh'],
    ['trieuChung', 'Triệu Chứng'],
    ['chanDoan', 'Chẩn Đoán'],
    ['dieuTri', 'Biện Chứng Luận Trị'],
    ['benhAn', 'Bệnh Án'],
    ['thamKhao', 'Tham Khảo'],
  ],
});

const BENH = { ccdt, benhhoc };
fs.writeFileSync(
  path.join(D, 'benh.js'),
  '/* TỰ SINH bởi _build-benh.cjs — KHÔNG sửa tay. window.BENH = { ccdt, benhhoc }. */\n' +
    'window.BENH = ' + JSON.stringify(BENH) + ';\n',
  'utf8',
);

console.log('✔ XONG → benh.js');
console.log(`  Châm Cứu Trị Bệnh : ${ccdt.count} bệnh`);
console.log(`  Bệnh Học          : ${benhhoc.count} bệnh`);
