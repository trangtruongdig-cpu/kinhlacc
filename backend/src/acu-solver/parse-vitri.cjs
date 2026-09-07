/* parse-vitri — Bộ phân tích VỊ TRÍ (tiếng Việt) → ràng buộc định lượng.
 * Mỗi ràng buộc:  { axis, dir, cun, ref }
 *   axis : 'vertical' (lên/xuống) | 'lateral' (ngang ra/vào) | 'free'
 *   dir  : 'up'|'down'|'out'|'in'
 *   cun  : số thốn
 *   ref  : mã huyệt (vd 'CV4') | id mốc giải phẫu (vd 'NAVEL') | null (suy ra anchor mặc định)
 * Kết quả mỗi huyệt: { quality, constraints[], refs[], anchor, raw }
 *   quality: 'cun' (có thốn định lượng) | 'landmark' (neo mốc đếm được) | 'qualitative'
 * KHÔNG đoán toạ độ ở đây — chỉ rút ràng buộc. Geometry để solver lo.                */

// ----- bản đồ viết tắt kinh (tiếng Việt) → mã quốc tế, để giải "(Vi.35)", "(Nh 22)"… -----
const ABBR = {
  p: 'LU', 'dtr': 'LI', 'dt': 'LI', vi: 'ST', ty: 'SP', tm: 'HT', ttr: 'SI',
  bq: 'BL', th: 'KI', tb: 'PC', ttu: 'TE', d: 'GB', c: 'LR', nh: 'CV', dc: 'GV',
};

/* ----- ký hiệu của sách Atlas of Acupuncture (bản Việt hoá) — ĐỨC ghép ANH -----
 * Sách viết "Lu 5", "Di 5", "Ma/ST 36", "Mi/SP 10", "Dü/SI 3", "Ni/KID 3", "Du/GV 4", "Le/Liv 3".
 * CẠM BẪY: sau khi bỏ dấu, "Dü" (Dünndarm = Tiểu Trường) và "Du" (Đốc Mạch) giống hệt nhau. Vì thế
 * khi có dạng "X/Y" thì LUÔN thử ký hiệu tiếng ANH (vế sau) trước. Đã dính bẫy này một lần lúc bóc
 * PDF: 27 huyệt Đốc Mạch bị gán nhầm sang kinh Tiểu Trường.                                        */
const ABBR_SACH = {
  lu: 'LU', di: 'LI', li: 'LI', ma: 'ST', st: 'ST', mi: 'SP', sp: 'SP', he: 'HT', ht: 'HT',
  'dü': 'SI', si: 'SI', bl: 'BL', ni: 'KI', kid: 'KI', ki: 'KI', pe: 'PC', pc: 'PC',
  '3e': 'TE', te: 'TE', tb2: 'TE', sj: 'TE', gb: 'GB', le: 'LR', lr: 'LR', liv: 'LR',
  ren: 'CV', kg: 'CV', cv: 'CV', lg: 'GV', gv: 'GV', du: 'GV',
};
const MAX_HUYET = { LU: 11, LI: 20, ST: 45, SP: 21, HT: 9, SI: 19, BL: 67, KI: 27, PC: 9, TE: 23, GB: 44, LR: 14, CV: 24, GV: 28 };
/** Giải một cụm mã kiểu sách: "Lu 5" · "Ma/ST 36" · "Dü/SI 3". Trả null nếu không phải. */
function maSach(sym1, sym2, num) {
  for (const sym of [sym2, sym1]) {                    // vế tiếng ANH trước — xem ghi chú trên
    if (!sym) continue;
    const k = ABBR_SACH[sym.toLowerCase()];
    if (!k) continue;
    const n = +num;
    if (n >= 1 && n <= MAX_HUYET[k]) return k + n;
  }
  return null;
}
const RE_MA_SACH = /\b([A-Za-zÜü3]{1,4})(?:\s*\/\s*([A-Za-z]{1,4}))?\s*\.?\s*(\d{1,2})\b/g;
const normAbbr = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

/* ---- TRA TÊN HUYỆT: giữ DẤU, và ưu tiên CÙNG KINH ----
 *
 * `vitri-data.json#nameToCode` được dựng bằng khoá ĐÃ BỎ DẤU, nên 10 cặp tên đụng nhau và mỗi cặp
 * làm MẤT một huyệt khỏi bảng (351 khoá cho 361 huyệt). Hậu quả không nhìn thấy được từ bảng: câu
 * sách neo sang kinh khác mà engine vẫn giải ra một toạ độ trông bình thường.
 *
 * Ca thật: BL6 Thừa Quang mô tả "ngay sau trên huyệt NGŨ XỨ 1,5 thốn". "Ngũ xứ" là BL5 trên da đầu,
 * nhưng bảng bỏ dấu trỏ sang GB27 "Ngũ xứ" ở HÔNG — nên BL6 rơi xuống y=89cm, rồi BL7, BL8, BL9 nối
 * đuôi theo. Bốn huyệt da đầu nằm ngang xương chậu. Phát hiện bằng phép kiểm vùng (region-check.cjs),
 * không tầng nào trong 5 tầng thấy được.
 *
 * Hai lớp chữa: (1) tra bằng tên CÒN DẤU — gỡ được 4 cặp thật sự khác nhau (Cự Liêu/Cư liêu,
 * Hạ Quan/Hạ quản, Trung chú/Trung chử, Thượng quan/Thượng quản); (2) còn trùng thì ưu tiên huyệt
 * CÙNG KINH với huyệt đang giải — vì câu vị trí gần như luôn dẫn chiếu trong cùng một kinh, còn khi
 * dẫn sang kinh khác thì sách ghi mã trong ngoặc và mã đó vốn đã thắng.                              */
const _NAME = { exact: null, byMer: null };
function nameMaps() {
  if (_NAME.exact) return _NAME;
  let pts = [];
  try { pts = require('./vitri-data.json').points || []; } catch { /* dùng ở nơi không có data → bỏ qua */ }
  const key = s => s.replace(/\s+/g, ' ').trim().toLowerCase();
  _NAME.exact = new Map(); _NAME.byMer = new Map();
  for (const p of pts) {
    if (!p.name) continue;
    const k = key(p.name);
    if (!_NAME.exact.has(k)) _NAME.exact.set(k, []);
    _NAME.exact.get(k).push(p.code);
    _NAME.byMer.set(k + '|' + p.mer, p.code);
  }
  return _NAME;
}
/** Tên huyệt (nguyên văn) → mã. `mer` = kinh của huyệt ĐANG giải, dùng để gỡ trùng. */
function codeOfName(raw, ctx) {
  const m = nameMaps();
  const k = String(raw).replace(/\s+/g, ' ').trim().toLowerCase();
  if (ctx.mer && m.byMer.has(k + '|' + ctx.mer)) return m.byMer.get(k + '|' + ctx.mer);
  const hit = m.exact.get(k);
  if (hit && hit.length === 1) return hit[0];
  if (hit && hit.length > 1) return hit[0];        // còn trùng & không cùng kinh → lấy cái đầu, có cờ ở báo cáo
  const loose = (ctx.nameToCode || {})[k.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')];
  return loose || null;
}

// ----- mốc giải phẫu nhận diện trong văn bản (thứ tự QUAN TRỌNG: cụ thể trước) -----
// mỗi mục: [regex, landmarkId]  — landmarkId khớp với landmarks.cjs
const LM = [
  [/lằn chỉ (ngang )?cổ tay|nếp gấp (cổ tay|khớp cổ tay)|khớp cổ tay|cổ tay/i, 'WRIST'],
  [/xương đòn gánh|xương đòn|đòn gánh/i, 'CLAVICLE'],
  [/nếp nách trước|nách trước/i, 'AXILLA_ANT'],
  [/nếp nách sau|nách sau/i, 'AXILLA_POST'],
  [/nếp (gấp )?khuỷu|lằn chỉ.*khuỷu|khớp khuỷu|khuỷu/i, 'CUBITAL'],
  [/mắt gối ngoài|lõm ngoài xương bánh chè|độc tỵ|độc tỷ|mắt gối/i, 'KNEE_EYE_LAT'],
  [/(đỉnh|cao).*mắt cá (chân )?ngoài|mắt cá (chân )?ngoài|mắt cá ngoài/i, 'MALLEOLUS_LAT'],
  [/(đỉnh|cao).*mắt cá (chân )?trong|mắt cá (chân )?trong|mắt cá trong/i, 'MALLEOLUS_MED'],
  [/nếp (kheo|nhượng|khoeo)|kheo chân|nhượng chân/i, 'POPLITEAL'],
  [/bờ (trên )?xương mu(?!\s*bàn)|xương mu(?!\s*bàn)|bờ xương mu(?!\s*bàn)/i, 'PUBIS'], // (?!\s*bàn): loại "xương mu bàn chân/tay" (mu = dorsum, khác xương mu = pubis)
  [/mũi ức|mỏm ức|đầu (trên|dưới)? ?(của )?(xương )?ức nhõm|góc ức.?sườn|đầu mũi ức/i, 'XIPHOID'],
  [/(góc.*)?xương bánh chè|bánh chè|mắt gối/i, 'PATELLA'],
  [/lỗ rốn|rốn/i, 'NAVEL'],
  [/đường giữa ngực|đường ngực/i, 'MIDLINE_CHEST'],
  [/đường giữa bụng/i, 'MIDLINE_ABD'],
  [/(giữa )?xương ức|bờ trên xương ức/i, 'STERNUM'],
  [/đầu (vú|ngực)|đầu núm vú|núm vú/i, 'NIPPLE'],
  [/đồng tử|chính giữa mắt|giữa mắt/i, 'PUPIL'],
  /* "mép" ĐA NGHĨA — khóe miệng, hay rìa/bờ của bất cứ thứ gì. Bản Focks dùng nghĩa RÌA rất nhiều
   * ("cách mép xương chày", "ngang mức mép dưới mỏm gai đốt sống T3", "mép trước gân Achilles"),
   * nên luật cũ (chỉ loại "mép mũi/trong/ngoài/bờ") kéo 21 huyệt — cả chùm bối du BL11–BL14, BL46,
   * KI7, KI27, GB19, GB25, LR13, ST36–ST40 — về neo ở KHÓE MIỆNG. Nay chỉ nhận nghĩa miệng khi
   * chữ "mép" ĐỨNG MỘT MÌNH cuối mệnh đề ("đường ngang qua mép và rãnh mép mũi" — ST4), còn hễ có
   * danh từ theo sau thì đó là rìa của danh từ ấy.                                                 */
  [/khóe miệng|góc miệng|mép miệng|rãnh mép mũi|\bmép\b(?=\s*(?:và|,|;|\.|$))/i, 'MOUTH_ANGLE'],
  [/chân tóc (gáy|sau|phía sau)|chân tóc ở gáy|mép tóc gáy/i, 'HAIRLINE_POST'],
  [/chân tóc|bờ chân tóc|chân cánh tóc/i, 'HAIRLINE_ANT'],
  [/yết hầu|cuống hầu|sụn giáp/i, 'LARYNX'],
  // chi dưới TRONG/NGOÀI — CHỈ khớp khi nêu rõ tên xương, tránh nhầm "lồi cầu trong" ở khuỷu tay (vd HT3, xương cánh tay)
  [/mấu chuyển (lớn )?xương đùi|mấu chuyển lớn/i, 'GREATER_TROCHANTER'],
  [/lồi cầu trong xương chầy|lồi cầu trong.{0,6}xương chầy/i, 'TIBIA_MED_CONDYLE'],
  [/lồi cầu (trên )?trong xương đùi/i, 'FEMUR_MED_EPICONDYLE'],
  [/gai xương chũm|mỏm chũm/i, 'MASTOID'],
  [/xương sườn tự do (thứ )?12|sườn tự do 12/i, 'RIB12'],
];

// ----- phát hiện HƯỚNG: chọn từ-khoá hướng GẦN số thốn nhất (rightmost trong "before") -----
// "ngang" chỉ tính lateral khi ở dạng "ngang ra / ra ngang / đo ngang / cách đường giữa /
//  ra N bên" hoặc đứng NGAY trước số — tránh nhầm "lằn chỉ ngang", "đường ngang qua".
/* CẠM BẪY \b VỚI TIẾNG VIỆT — đọc trước khi thêm từ khoá mới.
 * \b của JavaScript chỉ coi [A-Za-z0-9_] là ký tự từ. Chữ có dấu KHÔNG phải ký tự từ, nên với một
 * từ KẾT THÚC bằng chữ có dấu ("vú", "hạ", "mũi", "cổ") thì vị trí sau nó nằm giữa hai ký tự
 * không-phải-từ → \b KHÔNG khớp, và cả biểu thức chết lặng. Hai ca đã dính:
 *   · /vú\b/ trong luật "đường dọc qua đầu vú" — không bao giờ khớp, làm SP15 rơi về đường giữa;
 *   · /\bhạ\b/ trong bộ từ khoá hướng XUỐNG — chưa từng khớp lần nào kể từ khi viết.
 * Từ kết thúc bằng chữ ASCII ("lên", "xuống", "dưới", "ngực") thì không sao.
 * Cách viết đúng: thay \b cuối bằng (?![a-zà-ỹ]). */
function lastIdx(text, regexes) {
  let max = -1;
  for (const re of regexes) for (const m of text.matchAll(re)) if (m.index > max) max = m.index;
  return max;
}
/* TRỤC TRƯỚC–SAU (sagittal) — TRƯỚC ĐÂY KHÔNG TỒN TẠI.
 * Parser chỉ có 2 trong 3 trục giải phẫu: dọc (lên/xuống) và ngang (ra/vào). Mọi "SAU huyệt X 1,5
 * thốn" vì thế không khớp từ-khoá nào → rơi vào axis 'free' → solver mặc định coi như ĐI LÊN.
 * Trên đầu, hậu quả rất nặng: GB17→GB18→GB19 nối đuôi nhau "lên" 1,5 thốn mỗi bước nên GB19 leo tới
 * y=1,0376, tức cao hơn ĐỈNH SỌ (y=1,0) 6,5cm. 25 ràng buộc trong vitri-data.json dính lỗi này.
 *
 * NHẬN DIỆN THẬN TRỌNG: "trước/sau" trong tiếng Việt giải phẫu phần lớn là TÊN MỐC chứ không phải
 * hướng — "nếp nách TRƯỚC", "bờ SAU xương trụ", "chân tóc TRƯỚC". Nếu bắt bừa chữ "sau/trước" thì
 * LU3/LU4/PC2/GB22 ("dưới nếp nách trước N thốn") sẽ bị lật từ trục dọc sang trục trước-sau, hỏng
 * những huyệt vốn đang đúng. Nên CHỈ nhận 3 dạng chắc chắn là hướng:
 *   (a) "sau/trước huyệt <Tên>"      — dạng phổ biến nhất  (BL7-9, GB17-19, SI16, TE14, KI8, GB23)
 *   (b) "ra/về/lùi/tiến sau|trước"   — có động từ chỉ hướng đi kèm
 *   (c) "phía sau|trước huyệt"       — biến thể của (a)
 * Các dạng còn lại ("sau bờ trong xương chày 2 thốn" ở KI9) tạm để nguyên: thà bỏ sót còn hơn phá
 * huyệt đang đúng — chúng đã có tầng 5 (ép lên da) đỡ và sẽ hiện lên trong danh sách cần soát.     */
const SAG_BACK  = [/(?:^|[,;.]\s*|\bvà\s+|\bhoặc\s+|\bngay\s+|\bở\s+)(?:phía\s+)?sau\s+huyệt\b/g,
                   /\b(?:ra|về|lùi)\s+(?:phía\s+)?sau\b/g];
const SAG_FRONT = [/(?:^|[,;.]\s*|\bvà\s+|\bhoặc\s+|\bngay\s+|\bở\s+)(?:phía\s+)?trước\s+huyệt\b/g,
                   /\b(?:ra|về|tiến)\s+(?:phía\s+)?trước\b/g];
function detectDir(before) {
  const bl = before.toLowerCase();
  const up = lastIdx(bl, [/đo lên/g, /thẳng lên/g, /\blên\b/g, /\btrên\b/g, /ngược lên/g]);
  const down = lastIdx(bl, [/đo xuống/g, /thẳng xuống/g, /\bxuống\b/g, /\bdưới\b/g, /\bhạ(?![a-zà-ỹ])/g, /kéo xuống/g]);
  const out = lastIdx(bl, [/ngang ra/g, /ra ngang/g, /đo ngang/g, /cách đường giữa/g, /ra (?:2|hai) bên/g, /ra phía ngoài/g, /\bngang\s*$/g, /\bra\s*$/g]);
  const inn = lastIdx(bl, [/vào trong/g, /phía trong/g]);
  const back = lastIdx(bl, SAG_BACK);
  const front = lastIdx(bl, SAG_FRONT);
  const best = Math.max(up, down, out, inn, back, front);
  if (best < 0) return { axis: 'free', dir: null };
  if (best === back) return { axis: 'sagittal', dir: 'back' };
  if (best === front) return { axis: 'sagittal', dir: 'front' };
  if (best === out) return { axis: 'lateral', dir: 'out' };
  if (best === inn) return { axis: 'lateral', dir: 'in' };
  if (best === up) return { axis: 'vertical', dir: 'up' };
  return { axis: 'vertical', dir: 'down' };
}

function num(s) {                            // "1,5"→1.5 · "06"→6 · "0,1"→0.1
  return parseFloat(String(s).replace(',', '.'));
}

// đốt sống — mốc ĐỘNG (id phụ thuộc số bắt được trong câu, không nằm trong bảng LM tĩnh).
// "gai (đốt) sống thắt lưng N" → VERT_LN · "...lưng N" (không có "thắt") → VERT_TN (ngực/thoracic)
// "...cổ N" → VERT_CN (chỉ VERT_C7 tồn tại trong model-frame — số khác sẽ không khớp landmark, bỏ qua)
// "...cùng N" → VERT_SACRUM (đốt cùng không tách lẻ trong model, dùng chung 1 điểm centroid)
const VERT_RE = /(?:gai\s+)?(?:đốt\s+)?sống\s+(thắt lưng|lưng|cổ|cùng)\s+(?:thứ\s+)?(\d+|nhất|hai|ba|bốn|năm)/i;
const VIET_NUM = { nhất: 1, hai: 2, ba: 3, bốn: 4, năm: 5 };
function matchVertebra(text) {
  const m = text.match(VERT_RE);
  if (!m) return null;
  const type = m[1].toLowerCase();
  const n = VIET_NUM[m[2].toLowerCase()] ?? parseInt(m[2], 10);
  if (type === 'cùng') return 'VERT_SACRUM';
  const prefix = type === 'thắt lưng' ? 'VERT_L' : type === 'cổ' ? 'VERT_C' : 'VERT_T';
  return `${prefix}${n}`;
}

// giải 1 cụm tham chiếu trong ngoặc: "(Vi.35)" / "(Nh 22)" / "(P 9)" → mã 'ST35'…
function refFromParen(seg) {
  const m = seg.match(/\(([A-Za-zĐđ]{1,3})\s*[.\s]?\s*(\d{1,2})\)/);
  if (m) { const code = ABBR[normAbbr(m[1])]; if (code) return code + (+m[2]); }
  // dạng SÁCH: lấy cụm mã CUỐI CÙNG trong đoạn (gần số thốn nhất)
  let last = null;
  for (const g of seg.matchAll(RE_MA_SACH)) { const c = maSach(g[1], g[2], g[3]); if (c) last = c; }
  return last;
}

/* parse 1 huyệt.
 * @param vitri  chuỗi VỊ TRÍ
 * @param ctx    { nameToCode }  để giải "huyệt <Tên>" → mã
 */
function parseVitri(vitri, ctx = {}) {
  const nameToCode = ctx.nameToCode || {};
  const raw = (vitri || '').replace(/\s+/g, ' ').trim();
  const out = { quality: 'qualitative', constraints: [], refs: [], anchor: null, raw };
  if (!raw) return out;

  const lower = raw.toLowerCase();

  // (1) thu thập mọi tham chiếu huyệt trong câu (ngoặc mã + "huyệt <Tên>")
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/\s+/g, ' ').trim().toLowerCase();
  for (const m of raw.matchAll(/\(([A-Za-zĐđ]{1,3})\s*[.\s]?\s*(\d{1,2})\)/g)) {
    const c = ABBR[normAbbr(m[1])]; if (c) out.refs.push(c + (+m[2]));
  }
  for (const m of raw.matchAll(RE_MA_SACH)) { const c = maSach(m[1], m[2], m[3]); if (c && !out.refs.includes(c)) out.refs.push(c); }
  for (const m of raw.matchAll(/huyệt\s+([A-ZĐ][^,.(;]+?)(?=\s*[(,.;]|\s+\d|\s+(?:lên|xuống|đo|cách|ra|là)\b|$)/g)) {
    const c = codeOfName(m[1], ctx); if (c) out.refs.push(c);
  }

  // (2) mốc giải phẫu xuất hiện
  const landmarks = [];
  for (const [re, id] of LM) if (re.test(raw) && !landmarks.includes(id)) landmarks.push(id);
  const vert = matchVertebra(raw);
  if (vert && !landmarks.includes(vert)) landmarks.unshift(vert); // ưu tiên đốt sống làm anchor chính nếu có

  // (3) rút từng "N thốn" + hướng + ref gần nhất
  const cunMatches = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*thốn/g)];
  for (const m of cunMatches) {
    const cun = num(m[1]);
    const before = raw.slice(Math.max(0, m.index - 42), m.index);

    // hướng: từ-khoá gần số nhất trong "before"
    let { axis, dir } = detectDir(before);

    // ref gần nhất: huyệt trong "before", hoặc mốc trong "before", hoặc mốc câu
    let ref = refFromParen(before) || null;
    if (!ref) for (const m2 of before.matchAll(/huyệt\s+([A-ZĐ][^,.(;]+?)(?=\s*[(,.;]|\s+\d|$)/g)) {
      const c = codeOfName(m2[1], ctx); if (c) ref = c;
    }
    if (!ref) ref = matchVertebra(before);
    if (!ref) for (const [re, id] of LM) if (re.test(before)) { ref = id; break; }
    if (!ref && landmarks.length) ref = landmarks[0];

    // "cách đường (giữa) ngực/bụng N thốn" → ÉP lateral, neo ĐƯỜNG GIỮA (x tuyệt đối)
    // CHỈ xét MỆNH ĐỀ CUỐI (sau dấu phẩy) để không vớ "đường ngực" của mệnh đề trước (vd LU2).
    const lastClause = before.split(/[,;]/).pop();
    if (/đường (giữa )?ngực/i.test(lastClause)) { axis = 'lateral'; dir = 'out'; ref = 'MIDLINE_CHEST'; }
    else if (/đường giữa bụng/i.test(lastClause)) { axis = 'lateral'; dir = 'out'; ref = 'MIDLINE_ABD'; }

    out.constraints.push({ axis, dir, cun, ref });
  }

  /* (3.4) ĐƯỜNG DỌC MỐC = ĐƯỜNG THỐN CỐ ĐỊNH.
   * Sách hay định vị bằng "giao của đường ngang qua rốn và ĐƯỜNG DỌC QUA ĐẦU VÚ" — không số nào, nên
   * parser cũ trả về đúng vị trí rốn, tức huyệt nằm trên ĐƯỜNG GIỮA. Ca thật: SP15 Đại Hoành.
   * Ba đường dọc kinh điển đều quy ra số thốn cố định tính từ đường giữa:
   *   đường qua đầu vú / đường giữa đòn = 4 thốn · đường nách trước ≈ 6 thốn · đường nách giữa ≈ 8 thốn.
   * Chỉ thêm ràng buộc NGANG, không đụng ràng buộc dọc đã rút được. */
  const DUONG_DOC = [
    // KHÔNG dùng \b sau chữ có dấu — xem ghi chú KHONG_CHU ở dưới
    [/đường (thẳng |dọc )?(qua |ở )?(đầu )?(vú|ngực)(?![a-zà-ỹ])|đường giữa đòn|đường trung đòn/i, 4],
    [/đường nách trước/i, 6],
    [/đường nách giữa/i, 8],
  ];
  if (!out.constraints.some(c => c.axis === 'lateral')) {
    for (const [re, n] of DUONG_DOC) {
      if (!re.test(raw)) continue;
      out.constraints.push({ axis: 'lateral', dir: 'out', cun: n, ref: 'MIDLINE_ABD' });
      break;
    }
  }

  // (3.5) "ngang (với) huyệt X" — CÙNG ĐỘ CAO (y) với huyệt X, không tự có số thốn riêng.
  // cun=0 nên bước dọc trục trong solver.cjs (stepAlong) tự triệt tiêu offset, trả nguyên y của X —
  // KHÔNG cần sửa solver.cjs. Chủ yếu cứu các huyệt liên sườn (KI24-27…) vốn không có mốc "khoảng
  // gian sườn N" để neo, nên "ngang huyệt Nh.NN" là ràng buộc DỌC duy nhất đọc được trong câu.
  for (const m of raw.matchAll(/ngang\s+(?:với\s+)?huyệt\s+([A-ZĐ][^,.();]+?)\s*(\([A-Za-zĐđ]{1,3}\s*[.\s]?\s*\d{1,2}\))?(?=\s*[,.;)]|$)/gi)) {
    const ref = (m[2] && refFromParen(m[2])) || codeOfName(m[1], ctx) || null;
    if (ref) out.constraints.push({ axis: 'vertical', dir: 'up', cun: 0, ref });
  }

  // (4) phân loại chất lượng
  if (out.constraints.length) out.quality = 'cun';
  else if (landmarks.length || out.refs.length) out.quality = 'landmark';
  // đốt sống ưu tiên TRƯỚC tham chiếu huyệt khác (vd "(Đc 10)" trong câu chỉ để đối chiếu ngang hàng,
  // không phải mốc định vị chính — nếu ưu tiên nó, huyệt sẽ neo vào 1 huyệt GV có thể CHƯA giải).
  out.anchor = vert || out.refs[0] || landmarks[0] || (out.constraints.find(c => c.ref) || {}).ref || null;
  out.landmarks = landmarks;
  return out;
}

module.exports = { parseVitri, ABBR, ABBR_SACH, LM, codeOfName, maSach };

// ----- chế độ CLI: node parse-vitri.cjs [MER...]  → báo cáo độ phủ -----
if (require.main === module) {
  const fs = require('fs'), path = require('path');
  const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'vitri-data.json'), 'utf8'));
  const mers = process.argv.slice(2);
  const sel = DATA.points.filter(p => p.vitri && (!mers.length || mers.includes(p.mer)));
  let cun = 0, lm = 0, qual = 0;
  for (const p of sel) {
    const r = parseVitri(p.vitri, { nameToCode: DATA.nameToCode });
    if (r.quality === 'cun') cun++; else if (r.quality === 'landmark') lm++; else qual++;
    if (mers.length) {
      const cs = r.constraints.map(c => `${c.dir || '?'}${c.axis === 'lateral' ? '↔' : c.axis === 'vertical' ? '↕' : '·'}${c.cun}@${c.ref || '?'}`).join('  ');
      console.log(`${p.code.padEnd(5)} ${(p.name || '').padEnd(14)} [${r.quality}] ${cs}${r.anchor ? '  anchor=' + r.anchor : ''}`);
    }
  }
  console.log(`\n— ${sel.length} huyệt — cun:${cun}  landmark:${lm}  qualitative:${qual}`);
}
