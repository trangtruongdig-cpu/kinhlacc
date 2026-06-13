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
const normAbbr = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

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
  [/bờ (trên )?xương mu|xương mu|bờ xương mu/i, 'PUBIS'],
  [/mũi ức|mỏm ức|đầu (trên|dưới)? ?(của )?(xương )?ức nhõm|góc ức.?sườn|đầu mũi ức/i, 'XIPHOID'],
  [/(góc.*)?xương bánh chè|bánh chè|mắt gối/i, 'PATELLA'],
  [/lỗ rốn|rốn/i, 'NAVEL'],
  [/đường giữa ngực|đường ngực/i, 'MIDLINE_CHEST'],
  [/đường giữa bụng/i, 'MIDLINE_ABD'],
  [/(giữa )?xương ức|bờ trên xương ức/i, 'STERNUM'],
  [/đầu (vú|ngực)|đầu núm vú|núm vú/i, 'NIPPLE'],
  [/đồng tử|chính giữa mắt|giữa mắt/i, 'PUPIL'],
  [/khóe miệng|mép(?! mũi)|góc miệng/i, 'MOUTH_ANGLE'],
  [/chân tóc|bờ chân tóc|chân cánh tóc/i, 'HAIRLINE_ANT'],
  [/yết hầu|cuống hầu|sụn giáp/i, 'LARYNX'],
];

// ----- phát hiện HƯỚNG: chọn từ-khoá hướng GẦN số thốn nhất (rightmost trong "before") -----
// "ngang" chỉ tính lateral khi ở dạng "ngang ra / ra ngang / đo ngang / cách đường giữa /
//  ra N bên" hoặc đứng NGAY trước số — tránh nhầm "lằn chỉ ngang", "đường ngang qua".
function lastIdx(text, regexes) {
  let max = -1;
  for (const re of regexes) for (const m of text.matchAll(re)) if (m.index > max) max = m.index;
  return max;
}
function detectDir(before) {
  const bl = before.toLowerCase();
  const up = lastIdx(bl, [/đo lên/g, /thẳng lên/g, /\blên\b/g, /\btrên\b/g, /ngược lên/g]);
  const down = lastIdx(bl, [/đo xuống/g, /thẳng xuống/g, /\bxuống\b/g, /\bdưới\b/g, /\bhạ\b/g, /kéo xuống/g]);
  const out = lastIdx(bl, [/ngang ra/g, /ra ngang/g, /đo ngang/g, /cách đường giữa/g, /ra (?:2|hai) bên/g, /ra phía ngoài/g, /\bngang\s*$/g, /\bra\s*$/g]);
  const inn = lastIdx(bl, [/vào trong/g, /phía trong/g]);
  const best = Math.max(up, down, out, inn);
  if (best < 0) return { axis: 'free', dir: null };
  if (best === out) return { axis: 'lateral', dir: 'out' };
  if (best === inn) return { axis: 'lateral', dir: 'in' };
  if (best === up) return { axis: 'vertical', dir: 'up' };
  return { axis: 'vertical', dir: 'down' };
}

function num(s) {                            // "1,5"→1.5 · "06"→6 · "0,1"→0.1
  return parseFloat(String(s).replace(',', '.'));
}

// giải 1 cụm tham chiếu trong ngoặc: "(Vi.35)" / "(Nh 22)" / "(P 9)" → mã 'ST35'…
function refFromParen(seg) {
  const m = seg.match(/\(([A-Za-zĐđ]{1,3})\s*[.\s]?\s*(\d{1,2})\)/);
  if (!m) return null;
  const code = ABBR[normAbbr(m[1])];
  return code ? code + (+m[2]) : null;
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
  for (const m of raw.matchAll(/huyệt\s+([A-ZĐ][^,.(;]+?)(?=\s*[(,.;]|\s+\d|\s+(?:lên|xuống|đo|cách|ra|là)\b|$)/g)) {
    const c = nameToCode[norm(m[1])]; if (c) out.refs.push(c);
  }

  // (2) mốc giải phẫu xuất hiện
  const landmarks = [];
  for (const [re, id] of LM) if (re.test(raw) && !landmarks.includes(id)) landmarks.push(id);

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
      const c = nameToCode[norm(m2[1])]; if (c) ref = c;
    }
    if (!ref) for (const [re, id] of LM) if (re.test(before)) { ref = id; break; }
    if (!ref && landmarks.length) ref = landmarks[0];

    // "cách đường (giữa) ngực/bụng N thốn" → ÉP lateral, neo ĐƯỜNG GIỮA (x tuyệt đối)
    // CHỈ xét MỆNH ĐỀ CUỐI (sau dấu phẩy) để không vớ "đường ngực" của mệnh đề trước (vd LU2).
    const lastClause = before.split(/[,;]/).pop();
    if (/đường (giữa )?ngực/i.test(lastClause)) { axis = 'lateral'; dir = 'out'; ref = 'MIDLINE_CHEST'; }
    else if (/đường giữa bụng/i.test(lastClause)) { axis = 'lateral'; dir = 'out'; ref = 'MIDLINE_ABD'; }

    out.constraints.push({ axis, dir, cun, ref });
  }

  // (4) phân loại chất lượng
  if (out.constraints.length) out.quality = 'cun';
  else if (landmarks.length || out.refs.length) out.quality = 'landmark';
  out.anchor = out.refs[0] || landmarks[0] || (out.constraints.find(c => c.ref) || {}).ref || null;
  out.landmarks = landmarks;
  return out;
}

module.exports = { parseVitri, ABBR, LM };

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
