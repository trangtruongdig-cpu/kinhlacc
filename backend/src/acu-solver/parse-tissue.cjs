/* parse-tissue — RÚT RÀNG BUỘC KHE từ câu VỊ TRÍ tiếng Việt.
 *
 * Bổ sung cho parse-vitri.cjs (chỉ rút THỐN + mốc xương). Cùng một câu, hai bộ đọc rút hai loại
 * thông tin khác nhau và KHÔNG tranh nhau:
 *     parse-vitri  → "trên cổ tay 7 thốn"        → CAO ĐỘ dọc trục
 *     parse-tissue → "bờ trong cơ ngửa dài"      → VỊ TRÍ TRONG LÁT CẮT
 *
 * BỐN DẠNG RÀNG BUỘC rút được:
 *   between  "giữa 2 gân cơ chày trước và gân cơ duỗi dài ngón cái"   → huyệt ở KHE giữa A và B
 *   border   "bờ ngoài cơ ngửa dài" / "sát bờ sau-trong xương chày"   → huyệt sát BỜ của A, phía nào
 *   on       "nơi cơ ngực to"                                          → chỉ khoanh vùng (yếu)
 *   vessel   "trên động mạch quay", "phía ngoài động mạch đùi"         → mốc mạch + luật SÁT bờ mạch
 *
 * Hai bờ ĐỐI NHAU của hai cơ kề nhau ("bờ ngoài cơ thẳng trước, bờ trong cơ rộng ngoài" — ST32)
 * chính là một khe: parser tự gộp thành `between`, vì đó là cách sách mô tả khe rõ nhất.
 *
 * "hay / hoặc" nối hai mô tả ĐỒNG NGHĨA (LU6: "bờ trong cơ ngửa dài hay bờ ngoài cơ gan tay to")
 * → giữ cả hai thành hai ràng buộc riêng, không gộp thành khe.                                   */
const { ALL, T } = require('./tissue-lexicon.cjs');

const SIDE_WORDS = { trong: 'trong', ngoài: 'ngoai', trước: 'truoc', sau: 'sau', trên: 'tren', dưới: 'duoi' };
const SIDE_RE = /bờ\s+((?:trong|ngoài|trước|sau|trên|dưới)(?:\s*[–-]\s*(?:trong|ngoài|trước|sau|trên|dưới))?)/i;

const VESSEL_RE = /(động mạch|tĩnh mạch)\s+([a-zà-ỹ0-9]+(?:\s+[a-zà-ỹ0-9]+){0,2})/gi;

/** mọi lần xuất hiện của mọi mô trong câu (không chỉ lần đầu như lexicon.findTissues) */
function scanTissues(text) {
  const hits = [];
  for (const t of ALL) {
    for (const re of t.say) {
      const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      for (const m of text.matchAll(g)) hits.push({ entry: t, at: m.index, end: m.index + m[0].length, matched: m[0] });
      if (hits.some(h => h.entry === t)) break;   // 1 cách gọi là đủ cho mỗi mục
    }
  }
  hits.sort((a, b) => a.at - b.at);
  // bỏ hit lồng nhau (vd "cơ ngửa dài" vs "cơ ngửa"): giữ cụm DÀI hơn
  const keep = [];
  for (const h of hits) {
    const overlap = keep.find(k => h.at < k.end && h.end > k.at);
    if (!overlap) { keep.push(h); continue; }
    if (h.end - h.at > overlap.end - overlap.at) keep[keep.indexOf(overlap)] = h;
  }
  return keep.sort((a, b) => a.at - b.at);
}

/** "gân cơ X" / "gân X" → mô là GÂN của cơ X (atlas không dựng gân riêng: lấy 20% đầu xa khối cơ). */
function tendonPrefix(text, at) {
  const before = text.slice(Math.max(0, at - 14), at);
  return /gân\s*(cơ\s*)?$/i.test(before);
}
/** "bờ ngoài <cơ X>" → side='ngoai'. Chỉ nhận khi từ "bờ" đứng sát ngay trước tên mô. */
function borderPrefix(text, at) {
  const before = text.slice(Math.max(0, at - 34), at);
  const m = before.match(new RegExp(SIDE_RE.source + '[^,.;]{0,14}$', 'i'));
  if (!m) return null;
  const parts = m[1].toLowerCase().split(/\s*[–-]\s*/).map(w => SIDE_WORDS[w]).filter(Boolean);
  return parts.join('-');
}
/** dấu hiệu KHE MẠNH ngay trước cụm mô — "giữa A và B", "khe/rãnh/kẽ giữa…".
 *  Tiếng Việt đặt từ khoá TRƯỚC vế A, nên chỉ vế A mang dấu hiệu này mới mở được một cặp khe. */
function gapWordBefore(text, at) {
  const before = text.slice(Math.max(0, at - 40), at).toLowerCase();
  return /(khe|rãnh|kẽ)[^,.;]{0,26}$/.test(before) || /giữa\s*(2|hai)?\s*(gân|cơ|bó)?[^,.;]{0,20}$/.test(before);
}
/** "chỗ lõm", "hố" — dấu hiệu YẾU: xác nhận huyệt ở chỗ trũng, nhưng KHÔNG đủ để ghép 2 mô thành khe
 *  (vd ST33 "chỗ lõm trên góc ngoài xương bánh chè 3 thốn, sát bờ ngoài gân cơ thẳng đùi" — hai mô
 *  ở hai mệnh đề khác nhau, ghép lại sẽ ra khe bịa). */
function hollowBefore(text, at) {
  return /(hố|chỗ lõm)[^,.;]{0,26}$/.test(text.slice(Math.max(0, at - 40), at).toLowerCase());
}
/** cách nối 2 cụm mô: 'and' (…và/với…) · 'comma' (…,…) · 'or' (hay/hoặc = mô tả đồng nghĩa) */
function joiner(text, h1, h2) {
  const seg = text.slice(h1.end, h2.at).toLowerCase();
  // KHÔNG dùng \b với từ có dấu: "và" kết thúc bằng 'à' (không phải ký tự \w ASCII) nên \b không
  // khớp — lỗi này từng làm mọi khe "A và B" bị bỏ sót.
  if (/(^|[\s,])(hay|hoặc)([\s,]|$)/.test(seg)) return 'or';
  if (/[.;]/.test(seg)) return null;
  if (/(^|[\s,])(và|với)([\s,]|$)/.test(seg)) return 'and';
  if (/,/.test(seg)) return 'comma';
  return null;
}

const OPPOSITE = { ngoai: 'trong', trong: 'ngoai', truoc: 'sau', sau: 'truoc', tren: 'duoi', duoi: 'tren' };

/**
 * @param vitri câu VỊ TRÍ
 * @returns { rules[], tissues[], missing[], quality }
 *   quality: 'khe' (có ràng buộc khe dùng được) | 'vung' (chỉ khoanh vùng) | 'khong' (không nhắc mô)
 */
function parseTissue(vitri) {
  const raw = (vitri || '').replace(/\s+/g, ' ').trim();
  const out = { rules: [], tissues: [], missing: [], quality: 'khong', raw };
  if (!raw) return out;

  const hits = scanTissues(raw).map(h => ({
    ...h,
    tendon: tendonPrefix(raw, h.at),
    side: borderPrefix(raw, h.at),
    gapWord: gapWordBefore(raw, h.at),
    hollow: hollowBefore(raw, h.at),
  }));
  if (!hits.length) {
    for (const m of raw.matchAll(VESSEL_RE)) out.rules.push({ type: 'vessel', name: (m[1] + ' ' + m[2]).trim(), at: m.index });
    if (out.rules.length) out.quality = 'vung';
    return out;
  }

  for (const h of hits) {
    const tissue = h.tendon ? T.GAN : h.entry.tissue;
    out.tissues.push({ id: h.entry.id, vi: h.entry.vi, tissue, tendon: h.tendon, matched: h.matched, missing: h.entry.missing || null });
    if (h.entry.missing) out.missing.push({ id: h.entry.id, vi: h.entry.vi, why: h.entry.missing });
  }

  const used = new Set();
  for (let i = 0; i < hits.length - 1; i++) {
    const a = hits[i], b = hits[i + 1];
    if (used.has(i)) continue;
    const j = joiner(raw, a, b);
    if (j !== 'and' && j !== 'comma') continue;
    // KHE khi: (1) từ khoá khe mở ở vế A **và** nối bằng "và/với", hoặc
    //          (2) hai bờ ĐỐI NHAU (bờ ngoài A + bờ trong B) — dấu phẩy cũng chấp nhận được.
    const oppositeBorders = a.side && b.side && OPPOSITE[a.side.split('-')[0]] === b.side.split('-')[0];
    if (!((a.gapWord && j === 'and') || oppositeBorders)) continue;
    out.rules.push({
      type: 'between',
      a: side(a), b: side(b),
      via: oppositeBorders ? 'hai bờ đối nhau' : 'từ khoá khe',
      at: a.at, text: raw.slice(a.at, b.end),
    });
    used.add(i); used.add(i + 1);
  }
  for (let i = 0; i < hits.length; i++) {
    if (used.has(i)) continue;
    const h = hits[i];
    if (h.side) out.rules.push({ type: 'border', a: side(h), side: h.side, hollow: h.hollow, at: h.at, text: raw.slice(Math.max(0, h.at - 20), h.end) });
    else if (h.gapWord || h.hollow) out.rules.push({ type: 'border', a: side(h), side: null, hollow: h.hollow, at: h.at, text: raw.slice(Math.max(0, h.at - 20), h.end) });
    else out.rules.push({ type: 'on', a: side(h), at: h.at, text: h.matched });
  }
  for (const m of raw.matchAll(VESSEL_RE)) out.rules.push({ type: 'vessel', name: (m[1] + ' ' + m[2]).trim(), at: m.index });

  out.rules.sort((x, y) => x.at - y.at);
  const strong = out.rules.some(r => (r.type === 'between' || r.type === 'border') && usable(r));
  out.quality = strong ? 'khe' : out.rules.length ? 'vung' : 'khong';
  return out;

  function side(h) {
    return { id: h.entry.id, vi: h.entry.vi, tissue: h.tendon ? T.GAN : h.entry.tissue, tendonOf: h.tendon ? h.entry.id : null, missing: h.entry.missing || null, border: h.side || null };
  }
}
/** ràng buộc dùng được khi mọi mô trong đó đều có hình học trong atlas */
function usable(rule) {
  if (rule.type === 'between') return !rule.a.missing && !rule.b.missing;
  if (rule.type === 'border' || rule.type === 'on') return !rule.a.missing;
  return true;
}

module.exports = { parseTissue, usable };

// ----- CLI: node parse-tissue.cjs [MER…] → báo cáo độ phủ khe -----
if (require.main === module) {
  const DATA = require('./vitri-data.json');
  const mers = process.argv.slice(2);
  const sel = DATA.points.filter(p => p.vitri && (!mers.length || mers.includes(p.mer)));
  let khe = 0, vung = 0, khong = 0, nBetween = 0, nBorder = 0;
  const miss = {};
  for (const p of sel) {
    const r = parseTissue(p.vitri);
    if (r.quality === 'khe') khe++; else if (r.quality === 'vung') vung++; else khong++;
    nBetween += r.rules.filter(x => x.type === 'between').length;
    nBorder += r.rules.filter(x => x.type === 'border').length;
    for (const m of r.missing) miss[m.vi] = (miss[m.vi] || 0) + 1;
    if (mers.length) {
      const desc = r.rules.map(x => x.type === 'between' ? `KHE[${x.a.vi}${x.a.tendonOf ? '(gân)' : ''} | ${x.b.vi}${x.b.tendonOf ? '(gân)' : ''}]`
        : x.type === 'border' ? `BỜ${x.side ? '-' + x.side : ''}[${x.a.vi}${x.a.tendonOf ? '(gân)' : ''}]`
          : x.type === 'vessel' ? `MẠCH[${x.name}]` : `VÙNG[${x.a.vi}]`).join('  ');
      if (desc) console.log(`${p.code.padEnd(6)} ${(p.name || '').padEnd(14)} [${r.quality}] ${desc}`);
    }
  }
  console.log(`\n— ${sel.length} huyệt — khe:${khe}  vùng:${vung}  không nhắc mô:${khong}  (giữa-2-mô: ${nBetween}, sát-bờ: ${nBorder})`);
  const ms = Object.entries(miss).sort((a, b) => b[1] - a[1]);
  if (ms.length) console.log('Mô sách nhắc mà atlas KHÔNG dựng: ' + ms.map(([k, n]) => `${k} (${n})`).join(', '));
}
