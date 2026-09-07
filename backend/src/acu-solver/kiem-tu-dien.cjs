/* kiem-tu-dien — ĐỐI CHIẾU NGƯỢC: lấy TOẠ ĐỘ CUỐI CÙNG đem so lại với chính câu VỊ TRÍ trong từ điển.
 *
 * VÌ SAO CẦN. Engine đọc câu VỊ TRÍ để ĐẶT huyệt (tầng 3), nhưng sau đó còn ba bước nữa động vào toạ
 * độ: khe mô (tầng 4), ép lên da (tầng 5) và RẢI DỌC ĐƯỜNG KINH. Đo được 104 huyệt bị bước rải dời
 * chỗ, 14 huyệt dời quá 10cm (xa nhất 32,6cm). Không ai kiểm lại xem sau ngần ấy bước huyệt CÒN
 * THOẢ câu sách nữa không — audit-toan-dien chỉ so huyệt với HÀNG XÓM trên đường, nên cả đoạn cùng
 * trượt thì nó vẫn báo sạch.
 *
 * ĐO THẾ NÀO. Không dựng lại vị trí rồi so toạ độ (làm thế phải đoán trục, mà đoán sai thì báo động
 * giả tràn lan — bản đầu của tệp này kêu LI7 lệch 40cm chỉ vì bước 5 thốn theo thang THÂN thay vì
 * thang CẲNG TAY). Thay vào đó đo thứ mà câu sách thực sự khẳng định:
 *   · ràng buộc DỌC ("trên mắt cá 3 thốn")   → KHOẢNG CÁCH thẳng tới mốc, so với 3 × thốn tại chỗ,
 *                                              kèm kiểm CHIỀU (trên/dưới) theo cao độ.
 *   · ràng buộc NGANG ("cách đường giữa 1,5") → độ lệch NGANG |x| (mốc giữa) hoặc |Δx| (mốc bên).
 * Thốn tại chỗ lấy từ trục cốt-độ có ĐOẠN GẦN HUYỆT NHẤT (không phải trục trùng khoảng cao độ) —
 * nhờ vậy huyệt cẳng tay dùng thang cẳng tay, huyệt bàn chân dùng thang cẳng chân.
 *
 * Hai nguồn sách chấm độc lập: vitri-data.json (từ điển của app) và focks-vitri.json (Atlas Focks).
 * Chỗ HAI NGUỒN CÙNG KÊU mới là chỗ chắc sai — một mình một nguồn thì còn ngờ tại bộ đọc chữ.
 *
 * Dùng:  node kiem-tu-dien.cjs [MÃ_KINH] [--tat-ca] [--json]                                        */
const fs = require('fs');
const path = require('path');
const { parseVitri } = require('./parse-vitri.cjs');
const { L, AXES, LAT_CUN, pickAxis, isMidline, HEAD_ARC_CUN, HEAD_ARC_LM, headArcCunOf } = require('./model-frame.cjs');

const CM = 171.9;
const ROOT = path.resolve(__dirname, '../../..');
const doc = f => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w; };
const P = doc(path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js')).ACU_COORDS3D.points;
const VITRI = require('./vitri-data.json').points;
const FOCKS = (() => { try { return require('./focks-vitri.json').points || {}; } catch { return {}; } })();

const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/* THỐN TẠI CHỖ — lấy trục cốt-độ mà huyệt NẰM GẦN ĐOẠN NHẤT (khoảng cách điểm–đoạn), không phải
 * trục trùng khoảng cao độ: bàn tay và đùi trùng cao độ nhau, nhưng chỉ trục cẳng tay mới đi qua
 * gần bàn tay. Trục hai bên chỉ xét cùng bên với huyệt.                                            */
function dPointSeg(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y, vz = b.z - a.z;
  const wx = p.x - a.x, wy = p.y - a.y, wz = p.z - a.z;
  const vv = vx * vx + vy * vy + vz * vz;
  let t = vv > 0 ? (wx * vx + wy * vy + wz * vz) / vv : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(wx - vx * t, wy - vy * t, wz - vz * t);
}
const axLen = a => { const n = L[AXES[a].near], f = L[AXES[a].far]; return d3(n, f) / AXES[a].cun; };
function thonTai(p) {
  let best = null;
  for (const [name, ax] of Object.entries(AXES)) {
    const n = L[ax.near], f = L[ax.far];
    const benTruc = Math.sign(n.x) || Math.sign(f.x);           // 0 = trục đường giữa
    if (benTruc && Math.sign(p.x) && benTruc !== Math.sign(p.x)) continue;   // khác bên → bỏ
    const d = dPointSeg(p, n, f);
    if (!best || d < best.d) best = { d, name, thon: d3(n, f) / ax.cun };
  }
  if (p.y > 0.86) return { thon: HEAD_ARC_CUN, truc: 'cung-đầu' };
  if (!best) return { thon: 0.021, truc: 'thân' };
  return { thon: best.thon, truc: best.name };
}

/* THANG THỐN CHO MỘT RÀNG BUỘC — phải LẤY ĐÚNG TRỤC MÀ CÂU SÁCH NGỤ Ý, không phải trục gần huyệt.
 * "Rốn xuống 5 thốn" nói về trục RỐN–XƯƠNG MU (5 thốn); nếu lấy thang trục đùi chỉ vì huyệt nằm gần
 * bẹn thì cùng một khoảng cách hoá ra 8,2 thốn và bộ kiểm kêu oan. pickAxis() chính là hàm bộ giải
 * dùng để chọn trục khi bước, nên dùng lại nó thì phép đo mới đối xứng với phép đặt.               */
function thonRangBuoc(c, p) {
  const ref = c.ref;
  if (ref && Object.prototype.hasOwnProperty.call(L, ref)) {
    const pick = pickAxis(ref, c.dir === 'down' ? 'down' : 'up');
    if (pick && AXES[pick.axis]) return { thon: axLen(pick.axis), truc: pick.axis };
  }
  return thonTai(p);
}

/* ĐO DỌC TRỤC, KHÔNG ĐO ĐƯỜNG CHIM BAY. Mốc cổ tay nằm ở giữa/lòng cổ tay, huyệt Ngoại Quan nằm ở
 * MU tay: đo thẳng hai điểm thì cộng luôn cả bề dày cẳng tay vào, ra 3,55 thốn cho một huyệt sách
 * ghi 2 thốn — và cả chùm TE5–TE8, SI7, HT6 cùng vống lên đúng ~1,7 thốn như nhau, dấu hiệu kinh
 * điển của phép đo sai chứ không phải 6 huyệt cùng sai. Chiếu lên trục cốt-độ thì thành phần ngang
 * bị loại, đúng cách sách đo (xem sổ tay: "thốn đo dọc TRỤC chi").                                */
function khoangCach(p, R, truc) {
  const ax = truc && AXES[truc];
  /* Không có trục cốt-độ (mốc trên đầu/thân như chân tóc, hõm ức) thì chỉ so CAO ĐỘ. Đo chim bay ở
   * đây là cộng luôn khoảng lệch NGANG vào: Đầu Duy ST8 cách chân tóc 0,5 thốn dọc nhưng lệch 4,5
   * thốn ngang, đo thẳng ra 2,79 thốn và bộ kiểm kêu oan cả ST8 lẫn GB8, GB10, GB18. */
  if (!ax) {
    if (p.y > 0.86 && R.y > 0.86) {
      const pBen = Math.abs(p.x) > 0.02, rBen = Math.abs(R.x) > 0.02;
      /* CUNG SỌ chỉ dựng cho ĐƯỜNG GIỮA. Bách Hội GV20 cách chân tóc trước 5 thốn tính vòng qua đỉnh
       * sọ (chênh cao độ chỉ hơn 1 thốn) — đó là chỗ cung này đúng. Nhưng "chân tóc" trong câu tả
       * GB8–GB10 là chân tóc NGAY TRÊN TAI, mà model-frame chỉ có chân tóc giữa trán; đem huyệt bên
       * đo vào cung giữa thì ra 12 thốn cho một huyệt sách ghi 1. Không đo được thì nói không đo
       * được, đừng bịa một con số rồi bắt người ta đi soát.                                        */
      if (pBen !== rBen) return null;
      if (pBen && rBen) return d3(p, R);
      return Math.abs(headArcCunOf(p.y, p.z) - headArcCunOf(R.y, R.z)) * HEAD_ARC_CUN;
    }
    return Math.abs(p.y - R.y);
  }
  const n = L[ax.near], f = L[ax.far];
  let ux = f.x - n.x, uy = f.y - n.y, uz = f.z - n.z;
  const len = Math.hypot(ux, uy, uz) || 1;
  ux /= len; uy /= len; uz /= len;
  return Math.abs((p.x - R.x) * ux + (p.y - R.y) * uy + (p.z - R.z) * uz);
}

/** Vùng để tra thốn NGANG — theo chỗ huyệt đứng, không theo mốc neo. */
function vungNgang(p, truc) {
  if (/forearm|upperarm/.test(truc)) return 'arm';
  if (/leg|thigh/.test(truc)) return 'leg';
  if (p.y > 0.86) return 'head';
  return p.z < -0.02 ? 'back' : 'torso';
}

/** Vị trí của một tham chiếu: mốc giải phẫu trong L, hay một huyệt khác (toạ độ CUỐI). */
const viTri = ref => (Object.prototype.hasOwnProperty.call(L, ref) ? L[ref] : (P[ref] && P[ref].x !== undefined ? P[ref] : null));

function kiem(code, text, nguon) {
  if (!text) return null;
  const parsed = parseVitri(text, code) || {};
  if (parsed.quality !== 'cun' || !(parsed.constraints || []).length) return null;
  const p = P[code];
  const tt = thonTai(p);
  const latThon = LAT_CUN[vungNgang(p, tt.truc)] || LAT_CUN.torso;
  const ket = [];
  for (const c of parsed.constraints) {
    // ràng buộc NGANG không nêu mốc ⇒ đo từ ĐƯỜNG GIỮA (sách luôn ngụ ý thế: "đo ra ngang 2 thốn")
    const ref = c.axis === 'lateral' ? c.ref : (c.ref || parsed.anchor);
    const R = ref ? viTri(ref) : null;
    if (c.cun == null || (c.axis !== 'lateral' && !R)) continue;
    if (c.axis === 'lateral') {
      const thuc = (!ref || isMidline(ref) || !R) ? Math.abs(p.x) : Math.abs(p.x - R.x);
      const doi = c.cun * latThon;
      ket.push({ loai: 'ngang', ref, cun: c.cun, thucThon: +(thuc / latThon).toFixed(2),
        lechThon: +Math.abs(thuc / latThon - c.cun).toFixed(2), lechCm: +Math.abs((thuc - doi) * CM).toFixed(2) });
    } else if (c.axis === 'vertical' || c.axis === 'free') {
      const { thon, truc } = thonRangBuoc(c, p);
      const thuc = khoangCach(p, R, truc);
      if (thuc === null) { boDo.push({ code, ref, cun: c.cun, ly: 'mốc đường giữa nhưng huyệt nằm bên — không có thang đo' }); continue; }
      ket.push({ loai: 'dọc', ref, cun: c.cun, truc, thucThon: +(thuc / thon).toFixed(2),
        lechThon: +Math.abs(thuc / thon - c.cun).toFixed(2), lechCm: +Math.abs(thuc - c.cun * thon) * CM,
        saiChieu: c.dir === 'up' ? p.y < R.y - 0.004 : (c.dir === 'down' ? p.y > R.y + 0.004 : false) });
    }
  }
  if (!ket.length) return null;
  for (const k of ket) if (typeof k.lechCm === 'number') k.lechCm = +k.lechCm.toFixed(2);
  const xau = ket.reduce((a, b) => (b.lechThon > a.lechThon ? b : a));
  return { nguon, truc: tt.truc, ket, lechThon: xau.lechThon, lechCm: xau.lechCm, xau,
    saiChieu: ket.some(k => k.saiChieu), cau: text.slice(0, 160) };
}

const boDo = [];   // ràng buộc không có thang đo — kê ra chứ không âm thầm bỏ
const merArg = process.argv.slice(2).find(a => !a.startsWith('--'));
const rows = [];
for (const rec of VITRI) {
  const code = rec.code;
  if (merArg && !code.startsWith(merArg)) continue;
  if (!P[code] || P[code].x === undefined) continue;
  const a = kiem(code, rec.vitri, 'app');
  const f = kiem(code, FOCKS[code] && FOCKS[code].vitri, 'focks');
  if (!a && !f) continue;
  // lấy bên NHẸ nhất làm kết luận: sách nào cũng đúng cả, huyệt chỉ cần thoả MỘT cách mô tả
  const nhe = (a && f) ? (a.lechThon <= f.lechThon ? a : f) : (a || f);
  rows.push({ code, ten: rec.name, app: a, focks: f, ket: nhe,
    lechThon: nhe.lechThon, lechCm: nhe.lechCm, caHai: !!(a && f && a.lechThon >= 1 && f.lechThon >= 1),
    saiChieu: !!(a && f ? (a.saiChieu && f.saiChieu) : nhe.saiChieu),
    src: P[code].src, conf: P[code].conf, raiCm: P[code].raiCm || 0 });
}
rows.sort((x, y) => y.lechThon - x.lechThon);

if (boDo.length) console.log(`\n(${boDo.length} ràng buộc không đo được: ${[...new Set(boDo.map(b => b.code))].join(' ')})`);
if (process.argv.includes('--json')) {
  fs.writeFileSync(path.join(__dirname, 'kiem-tu-dien-report.json'), JSON.stringify({ n: rows.length, rows }, null, 1));
}
const dem = (f) => rows.filter(f).length;
console.log(`kiểm ${rows.length} huyệt có thốn định lượng · lệch ≥1 thốn: ${dem(r => r.lechThon >= 1)} · ≥2: ${dem(r => r.lechThon >= 2)}`
  + ` · ≥3: ${dem(r => r.lechThon >= 3)} · hai nguồn cùng kêu ≥1: ${dem(r => r.caHai)} · SAI CHIỀU: ${dem(r => r.saiChieu)}`);
console.log('\nMÃ    TÊN                LỆCH        THỰC/ĐÒI      NGUỒN ĐẶT       RẢI   RÀNG BUỘC');
const show = rows.filter(r => r.lechThon >= 1).slice(0, process.argv.includes('--tat-ca') ? 400 : 35);
for (const r of show) {
  const k = r.ket.xau;
  console.log(r.code.padEnd(6), (r.ten || '').padEnd(18).slice(0, 18),
    `${r.lechThon}t/${r.lechCm}cm`.padEnd(12),
    `${k.thucThon}/${k.cun}t`.padEnd(13),
    String(r.src || '').padEnd(15), String(r.raiCm).padEnd(5),
    `${k.loai} ← ${k.ref}`, r.caHai ? '‹2 NGUỒN›' : '', r.saiChieu ? '‹SAI CHIỀU›' : '');
}
