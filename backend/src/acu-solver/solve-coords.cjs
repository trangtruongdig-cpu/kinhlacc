/* solve-coords — "CĂN TỔNG THỂ" phía backend.
 *
 * Gói lại logic của crossval.cjs (đối chiếu SÁCH + WHO + MỐC/chấm tay) THÀNH 1 HÀM THUẦN,
 * KHÔNG đọc/ghi file, trả thẳng toạ độ engine để frontend dùng (định dạng giống bake.cjs).
 *
 *   solveCoords(mers, userAnchors) -> { points: { CODE: {x,y,z,q,snap,src,conf,anchor?,snapDir?} },
 *                                       mers, n }
 *     mers        : danh sách kinh cần giải (mặc định ['LU','ST','CV'] + mọi kinh có trong chốt)
 *     userAnchors : { CODE: {x,y,z} } các chốt CHẤM TAY (đã chuẩn-hoá theo bodyHeight)
 *
 * An toàn cho server: chốt người dùng có thể GHI ĐÈ TẠM mốc giải phẫu trong L (model-frame);
 * ta snapshot L → áp override → giải (đồng bộ) → KHÔI PHỤC L, nên gọi lại/đồng thời vẫn đúng. */
const { L } = require('./model-frame.cjs');
const { parseVitri } = require('./parse-vitri.cjs');
const { solveAll, resolvePoint } = require('./solver.cjs');
const WHO = require('./who-ref.cjs');
const { buildAnchors, resolveAnchors } = require('./anchors.cjs');
const DATA = require('./vitri-data.json');

/* NGUỒN SÁCH THỨ HAI — Atlas of Acupuncture (Claudia Focks), bản Việt hoá do người dùng cung cấp,
 * bóc từ PDF thành `focks-vitri.json` (358/361 huyệt). KHÔNG thay thế `vitri-data.json` mà là tiếng
 * nói song song: hai bản mô tả cùng một huyệt theo hai cách khác nhau, nên chỗ chúng đồng thuận thì
 * độ tin tăng thật, chỗ chúng cãi nhau là chỗ cần người soát.
 * Đo trên 358 huyệt chung: Focks cho 257 huyệt có thốn định lượng (bản cũ 229) và chỉ 5 huyệt mô tả
 * thuần định tính (bản cũ 53) — nó lấp gần hết khoảng trống bản cũ để lại. */
let FOCKS = {};
// KHONG_FOCKS=1 để tắt nguồn này khi cần so sánh sạch trước/sau
if (!process.env.KHONG_FOCKS) {
  try { FOCKS = require('./focks-vitri.json').points || {}; } catch { /* chưa có tệp → chạy như cũ */ }
}

// TẦNG 4 — QUY TẮC KHE MÔ (tissue-rules.cjs). Bảng bake sẵn bởi bake-interfaces.cjs; thiếu file thì
// engine chạy y như trước, chỉ mất phần tinh chỉnh khe.
let TISSUE = { points: {}, review: {} };
try { TISSUE = require('./interface-points.json'); } catch { /* chưa bake — bỏ qua tầng khe */ }

const TOL = 0.025;        // ngưỡng đồng thuận (chuẩn-hoá ≈ 4mm)
const TISSUE_AGREE = 0.008;   // khe cách chỗ đã giải dưới ngần này (≈1,4 cm) = hai nguồn XÁC NHẬN nhau
const TISSUE_ADOPT_MAX = 0.05; // xa hơn ngần này (≈8,6 cm) thì không nhận khe: bảng bake theo toạ độ
                               // khác hẳn kết quả lần giải này (vd người dùng vừa chấm lại mốc)
const merOf = (c) => c.replace(/\d+$/, '');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

// huyệt MẶT TRƯỚC THÂN → dán từ phía trước (khớp bake.cjs)
function isFront(code) {
  const m = merOf(code),
    n = +code.replace(/\D/g, '');
  return m === 'CV' || code === 'LU1' || code === 'LU2' || (m === 'ST' && n <= 30);
}

// crossval thuần: đối chiếu đa nguồn → { code: {pos, source, label, anchor?} }
function crossval(mers, anchorMap) {
  // ---------- Nguồn 1: SÁCH (parse VỊ TRÍ) ----------
  const bookParsed = {};
  for (const p of DATA.points) {
    if (!mers.includes(p.mer) || !p.vitri) continue;
    bookParsed[p.code] = parseVitri(p.vitri, { nameToCode: DATA.nameToCode, mer: p.mer });
  }
  // ---- Nguồn 1b: SÁCH FOCKS ("Vị trí" + "Cách xác định" ghép lại) ----
  const focksParsed = {};
  for (const p of DATA.points) {
    if (!mers.includes(p.mer)) continue;
    const f = FOCKS[p.code];
    if (!f) continue;
    /* CHỈ đọc mục "Vị trí". KHÔNG ghép "Cách xác định" vào — đó là QUY TRÌNH THAO TÁC ("chia đôi
     * khoảng cách rồi dịch về phía khuỷu 1 thốn"), nên parser đọc các con số trung gian thành ràng
     * buộc thật. Đã thử ghép cả hai: kiểm vùng tụt từ 0 lên 7 huyệt sai bộ phận, quãng rải trung bình
     * tăng 4,87 → 6,45cm. Mục "Cách xác định" để dành cho người soát đọc, không cho máy. */
    const r = parseVitri((f.vitri || '').trim(), { nameToCode: DATA.nameToCode, mer: p.mer });
    if (r.quality !== 'qualitative') focksParsed[p.code] = r;
  }
  // ---------- TẦNG 1: MỐC HUYỆT (cắm trước, làm xương sống) ----------
  const ANCH = resolveAnchors(anchorMap); // { code:{pos,why,at,user} }
  const anchorSeed = {};
  for (const [c, a] of Object.entries(ANCH)) if (mers.includes(merOf(c))) anchorSeed[c] = { pos: a.pos };

  // ---------- Nguồn 2: WHO (giải TRƯỚC, seed bằng MỐC) ----------
  const who = {};
  {
    const ctx0 = { solved: { ...anchorSeed } };
    for (const [code, def] of Object.entries(WHO)) {
      if (!mers.includes(merOf(code))) continue;
      if (def.pos) {
        who[code] = { pos: def.pos, force: !!def.force };
        ctx0.solved[code] = { pos: def.pos };
        continue;
      }
      if (def.constraints) {
        const r = resolvePoint({ constraints: def.constraints, anchor: def.constraints[0].ref, quality: 'cun' }, ctx0);
        if (r) {
          who[code] = { pos: r.pos };
          ctx0.solved[code] = r;
        }
      }
    }
  }

  // ---------- Nguồn 1: SÁCH (seed bằng MỐC + WHO) ----------
  const whoSeed = {};
  for (const [c, w] of Object.entries(who)) whoSeed[c] = { pos: w.pos };
  const bookSeed = { ...whoSeed, ...anchorSeed }; // MỐC ưu tiên hơn WHO khi trùng
  const book = solveAll(bookParsed, bookSeed).solved;
  const focks = solveAll(focksParsed, bookSeed).solved;
  const fromSeedF = (code) => focks[code] && bookSeed[code] && focks[code] === bookSeed[code];
  const fromSeed = (code) => book[code] && bookSeed[code] && book[code] === bookSeed[code];

  // ---------- HỢP NHẤT + ĐỘ TIN ----------
  const final = {};
  const codes = [...new Set([...Object.keys(bookParsed), ...Object.keys(focksParsed), ...Object.keys(who), ...Object.keys(anchorSeed)])];

  for (const code of codes) {
    // TẦNG 1: MỐC HUYỆT — ưu tiên tuyệt đối
    if (ANCH[code]) {
      final[code] = { pos: ANCH[code].pos, source: 'anchor', label: 'mốc', anchor: true };
      continue;
    }
    const bq = bookParsed[code] && bookParsed[code].quality;
    // who[code].force: huyệt sách có số thốn NHƯNG hướng ngang tính thuần trục (không đủ, vd cần khe
    // cơ mới đúng mặt) — who-ref.cjs đặt force:true để tự thắng book dù bq==='cun' (bình thường book
    // luôn thắng khi có số thốn thật, WHO chỉ lấp chỗ book không giải được).
    const bookHas = book[code] && !fromSeed(code) && !(who[code] && who[code].force) && (bq === 'cun' || !who[code]);
    const fq = focksParsed[code] && focksParsed[code].quality;
    const focksHas = focks[code] && !fromSeedF(code) && !(who[code] && who[code].force) && (fq === 'cun' || !who[code]);
    const b = bookHas ? book[code] : null,
      f = focksHas ? focks[code] : null,
      w = who[code];
    /* VAI TRÒ CỦA FOCKS: ĐỐI CHIẾU + LẤP CHỖ TRỐNG CUỐI CÙNG — KHÔNG ĐƯỢC GHI ĐÈ.
     *
     * Đã thử cho Focks quyền ghi đè khi nó có thốn định lượng còn bản cũ thì không. Đo ba chỉ số độc
     * lập, cả ba đều XẤU ĐI: huyệt lệch quá 3cm khỏi đường kinh 75 → 85, quãng rải trung bình
     * 4,88 → 6,22cm, kiểm vùng không cải thiện. Nguyên nhân không nằm ở sách mà ở PARSER: bộ đọc
     * tiếng Việt này được mài suốt nhiều đợt theo đúng lối hành văn của `vitri-data.json` (bảng mốc,
     * từ khoá hướng, cách đặt câu); gặp lối hành văn dịch từ tiếng Đức nó rút ra ràng buộc kém hơn,
     * dù bản thân mô tả gốc chi tiết hơn.
     *
     * Nên Focks giữ hai việc mà nó làm tốt và ĐO ĐƯỢC:
     *   · ĐỒNG THUẬN — trùng với bản cũ dưới 4mm thì tăng độ tin (nguồn độc lập thứ hai xác nhận);
     *   · LẤP CHỖ TRỐNG — chỉ khi CẢ bản cũ LẪN WHO đều không cho được toạ độ nào.
     * Muốn nâng Focks lên làm nguồn chính thì phải sửa parser cho hợp lối hành văn của nó trước, và
     * phải chứng minh bằng chính ba chỉ số trên chứ không bằng cảm giác "sách xịn hơn". */
    let pos = null,
      primary = null,
      dongThuan = false;
    if (b && f) dongThuan = dist(b.pos, f.pos) < TOL;
    /* ĐÃ THỬ NỚI RỒI RÚT (đợt 6): cho Focks thắng khi bản cũ không có thốn mà Focks có. Chỉ 8 huyệt
     * đổi nguồn, nhưng một trong số đó vỡ nặng — LR7 (cẳng chân trong) nhảy lên cạnh CÁN ỨC, vì câu
     * Focks neo vào ST36 mà chuỗi giải ST36 trong lượt Focks lại chưa chắc. Kiểm vùng 0 → 1 sai.
     * Bài học: quyền ghi đè của Focks, dù thu hẹp tới đâu, vẫn không an toàn với parser hiện tại.
     * Chữa ca SP15 bằng cách khác — dạy parser hiểu "đường dọc qua đầu vú" là đường 4 thốn (parse-vitri). */
    if (b) { pos = b.pos; primary = 'book'; }
    else if (w) { pos = w.pos; primary = 'who'; }
    else if (f) { pos = f.pos; primary = 'focks'; }
    if (!pos) {
      final[code] = { source: 'none', label: 'cần soát' };
      continue;
    }

    let corrob = 0;
    const nguon = primary === 'focks' ? f : b;
    const internalOK = nguon && nguon.checks && nguon.checks.length && nguon.checks.every((c) => c.dist < 0.03);
    if (internalOK) corrob++;
    if (dongThuan) corrob++;                       // hai bản sách độc lập chỉ cùng một chỗ
    let whoDelta = null;
    if (pos && w && primary !== 'who') {
      whoDelta = dist(pos, w.pos);
      if (whoDelta < TOL) corrob++;
    }
    // HYBRID: book & WHO lệch LỚN → WHO trọng tài
    if ((primary === 'book' || primary === 'focks') && whoDelta != null && whoDelta > 0.05) {
      pos = w.pos;
      primary = 'who-arb';
      corrob = 0;
    }

    const laSach = primary === 'book' || primary === 'focks';
    let label;
    if (primary === 'who-arb') label = 'WHO-trọng tài';
    else if (laSach && corrob >= 2) label = 'khoá';
    else if (laSach && corrob === 1) label = 'cao';
    else if (laSach) label = 'tạm';
    else label = 'WHO-lấp';

    final[code] = { pos, source: primary, label };
    /* Hai bản sách cãi nhau xa → vẫn chốt một bản, nhưng để lại dấu vết cho người soát.
     * PHÂN BIỆT THEO ĐỘ LỚN — rà soát toàn diện cho thấy phải tách làm hai loại, không gộp một lời:
     *  · dưới 8cm: hai bản mô tả THẬT SỰ khác nhau (chọn mốc khác, quy ước thốn khác) — đáng soát mắt;
     *  · trên 8cm: KHÔNG phải sách cãi nhau. Không bản atlas nào đặt cùng một huyệt lệch nhau nửa mét.
     *    Đo được ST36 "lệch 107,3cm" và LR7 "lệch 96,4cm" — tức bản phân tích Focks đã bắn huyệt sang
     *    tận chi khác. Đó là PHÂN TÍCH VĂN BẢN HỎNG và engine đã loại đúng; ghi "sách lệch nhau" khiến
     *    người soát tưởng vị trí đang bấp bênh trong khi nó đã được ba phép kiểm độc lập xác nhận
     *    (cốt độ đúng thốn, đúng bộ phận, đúng chiều giải phẫu). */
    if (b && f && !dongThuan) {
      const d = dist(b.pos, f.pos);
      const ban = primary === 'focks' ? 'Focks' : 'cũ';
      if (d > 0.0465) final[code].review = `bản Focks phân tích HỎNG (bắn lệch ${(d * 171.9).toFixed(1)}cm — quá xa để là bất đồng thật) — đã loại, giữ bản ${ban}`;
      else if (d > 0.03) final[code].review = `hai bản sách lệch nhau ${(d * 171.9).toFixed(1)}cm — đã lấy bản ${ban}`;
    }
  }
  return final;
}

/* TẦNG 4: cho khe mô nói tiếng nói cuối cùng về MẶT CẮT.
 *
 * Ba tầng trước (mốc → WHO → sách/cốt độ) đã chốt CAO ĐỘ. Khe mô không đụng vào cao độ; nó chỉ:
 *   · XÁC NHẬN — khe rơi đúng chỗ vừa giải  → tăng độ tin (nguồn độc lập thứ hai đồng thuận);
 *   · DỜI      — khe chỉ một chỗ khác trong cùng lát cắt → lấy toạ độ khe (cốt độ vốn mù mặt cắt);
 *   · GẮN CỜ   — hai bên lệch quá xa → giữ nguyên, đánh dấu để người soát quyết, KHÔNG tự sửa.
 * Huyệt đã chốt bằng mốc/chấm tay thì miễn nhiễm — mốc luôn thắng.                                */
function applyTissueLayer(final) {
  for (const [code, f] of Object.entries(final)) {
    if (!f.pos) continue;
    if (f.source === 'anchor') continue;                       // mốc/chấm tay: không đụng vào
    const t = TISSUE.points[code];
    if (t) {
      // đối chiếu với TOẠ ĐỘ NGUỒN lúc bake, không phải với điểm khe: điểm khe đã được dán ra mặt da
      // nên luôn lệch điểm nội bộ vài mm — so kiểu đó thì huyệt nào cũng thành "dời".
      const d = dist(f.pos, t.from || t);
      if (d > TISSUE_ADOPT_MAX) { f.review = `bảng khe bake theo toạ độ khác (lệch ${(d * 172).toFixed(1)} cm) — nên chạy lại bake-interfaces`; continue; }
      f.tissue = { kind: t.kind, tissues: t.tissues, gapCun: t.gapCun, conf: t.conf };
      if (t.warns) f.tissueWarns = t.warns;
      if ((t.slideCun != null ? t.slideCun < 0.25 : d <= TISSUE_AGREE)) {
        f.tissue.agree = true;                                  // hai nguồn độc lập trùng nhau
        if (f.label === 'tạm') f.label = 'cao';
        else if (f.label === 'cao') f.label = 'khoá';
        else if (f.label === 'WHO-lấp') f.label = 'WHO+khe';
      } else {
        f.pos = { x: t.x, y: t.y, z: t.z };
        f.source = f.source + '+khe';
        f.label = t.conf === 'khe-ro' ? 'khe-khoá' : 'khe';
      }
    } else if (TISSUE.review[code]) {
      f.review = TISSUE.review[code].note;                      // khe và cốt độ mâu thuẫn → cần soát
      f.tissue = { tissues: TISSUE.review[code].tissues, conf: 'mau-thuan' };
    }
  }
  return final;
}

// final (crossval) -> toạ độ engine (giống bake.cjs)
function toEngineCoords(final) {
  const points = {};
  for (const [code, f] of Object.entries(final)) {
    if (!f.pos) continue;
    const exact = ['mốc', 'khoá', 'cao', 'khe-khoá', 'WHO+khe'].includes(f.label);
    const pt = {
      x: +f.pos.x.toFixed(4),
      y: +f.pos.y.toFixed(4),
      z: +f.pos.z.toFixed(4),
      q: exact ? 'exact' : 'approx',
      snap: true,
      src: f.source,
      conf: f.label,
    };
    if (f.anchor) pt.anchor = true;
    if (f.tissue) { pt.khe = f.tissue.tissues; if (f.tissue.kind) pt.kheLoai = f.tissue.kind; if (f.tissue.agree) pt.kheXacNhan = true; }
    if (f.tissueWarns) pt.canhBao = f.tissueWarns;
    if (f.review) pt.canSoat = f.review;
    if (isFront(code)) pt.snapDir = 'front';
    points[code] = pt;
  }
  return points;
}

function solveCoords(mers, userAnchors) {
  userAnchors = userAnchors || {};
  // mặc định LU/ST/CV + mọi kinh người dùng đã chấm (để chốt luôn được giải)
  const set = new Set((mers && mers.length ? mers : ['LU', 'ST', 'CV']).slice());
  for (const c of Object.keys(userAnchors)) set.add(merOf(c));
  const merList = [...set];

  const { anchorMap, landmarkOverrides } = buildAnchors(userAnchors);

  // ÁP TẠM override mốc vào L, giải (đồng bộ), rồi KHÔI PHỤC → solver giữ thuần với mọi request.
  const snapshot = {};
  for (const [k, v] of Object.entries(landmarkOverrides)) {
    if (!L[k]) continue;
    snapshot[k] = { x: L[k].x, y: L[k].y, z: L[k].z };
    L[k].x = v.x;
    L[k].y = v.y;
    L[k].z = v.z;
  }
  try {
    const points = toEngineCoords(applyTissueLayer(crossval(merList, anchorMap)));
    return { points, mers: merList, n: Object.keys(points).length };
  } finally {
    for (const [k, v] of Object.entries(snapshot)) {
      L[k].x = v.x;
      L[k].y = v.y;
      L[k].z = v.z;
    }
  }
}

module.exports = { solveCoords };
