/* ho-so — DỰNG HỒ SƠ BẰNG CHỨNG CHO TỪNG HUYỆT, để đưa ra HỘI ĐỒNG PHẢN BIỆN.
 *
 * VÌ SAO CẦN. Mọi bộ kiểm hiện có đều trả lời MỘT câu hẹp và in ra một dòng báo cáo. Người (hoặc
 * agent) muốn phán xử một huyệt thì phải tự đi nhặt: câu sách ở vitri-data, câu sách thứ hai ở
 * focks-vitri, ảnh ở thư mục ngoài repo, toạ độ ở acu-coords3d, cờ nghi ngờ ở 6 tệp report khác
 * nhau, bảng cốt độ ở cot-do-chi, hàng xóm ở meridian-nodes. Bảy chỗ cho một huyệt — nên thực tế
 * không ai xét đủ, và mỗi lần xét lại nhặt thiếu một kiểu khác.
 *
 * Tệp này gom TẤT CẢ về một hồ sơ cho mỗi huyệt: hai nguồn sách, ảnh atlas, toạ độ, hạng nghiệm thu,
 * đoạn cốt độ và số thốn, hàng xóm cùng kinh (kèm khoảng cách ĐO ĐƯỢC so với khoảng cách SÁCH ĐÒI),
 * huyệt lân cận khác kinh trong bán kính, cấu trúc giải phẫu gần nhất, và mọi cờ mà các bộ kiểm đã
 * bắn ra. Có hồ sơ rồi thì phản biện mới cãi nhau về CÙNG MỘT tập bằng chứng.
 *
 * KHÔNG tự phán xử, KHÔNG sửa toạ độ. Chỉ bày bằng chứng ra.
 *
 * Dùng:  node ho-so.cjs TE            cả kinh
 *        node ho-so.cjs TE5 TE6       vài huyệt
 *        node ho-so.cjs --tat-ca
 * Ra:    ho-so/<MÃ>.json  (máy đọc)  +  ho-so/<MÃ>.md  (hội đồng đọc)                              */
const fs = require('fs');
const path = require('path');
const { NODES } = require('./meridian-nodes.cjs');
const { DOAN } = require('./cot-do-chi.cjs');
const { loadAtlas } = require('./mesh-io.cjs');
const S = require('./surface-path.cjs');
const { L } = require('./model-frame.cjs');

const CM = 171.9;
const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.join(__dirname, 'ho-so');
const loadWin = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };
const doc = n => path.join(ROOT, 'frontend/public/kinhmach3d/data/', n);

const P = loadWin(doc('acu-coords3d.js'), 'ACU_COORDS3D').points;
const PATHS = loadWin(doc('meridian-paths.js'), 'MERIDIAN_PATHS').mer;
const VITRI = require('./vitri-data.json').points;
const FOCKS = require('./focks-vitri.json').points;
const HINH = require('./focks-hinh-map.json');
const SO = require('./huyet-chot.json');
const REPORTS = {
  diem: require('./points-report.json'),
  duong: require('./paths-report.json'),
  audit: require('./audit-report.json'),
  da: require('./skin-clamp-report.json'),
  vung: require('./region-report.json'),
  tudien: require('./kiem-tu-dien-report.json'),
};

const kd = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/* ---- hàng xóm cùng kinh: khoảng cách ĐO trên đường kinh, không phải đường chim bay -------------
 * Sách phát biểu khoảng cách theo đường đi trên da ("dưới Dương Trì 2 thốn"), nên đo bằng đường
 * chim bay là tự tạo sai số ở mọi chỗ chi cong. Đo dọc polyline của chính đường kinh đã bake. */
let G = null;                                    // đồ thị mặt da, nạp một lần
/* Đo TRẮC ĐỊA TRÊN DA giữa hai huyệt. Không dùng polyline của meridian-paths: nó đã rút gọn còn
 * 4–7 điểm cho cả đoạn 26cm, đo trên đó ra 0cm cho hai huyệt kề và 8,5cm cho khoảng 1 thốn. */
function docDa(a, b) {
  if (!G || !P[a] || !P[b]) return null;
  const r = S.geodesic(G, P[a], P[b]);
  return r ? r.cm : null;
}

/* 1 THỐN TẠI CHỖ bằng bao nhiêu cm. Đo dọc TRỤC CHI giữa hai MỐC XƯƠNG định nghĩa đoạn (không đo
 * dọc đường cong bề mặt, không neo vào huyệt) — đúng cách sổ tay đã chốt sau ba lần vấp. */
function thonCm(cd) {
  if (!cd || !cd.xaMoc || !cd.ganMoc) return null;
  const a = L[cd.xaMoc], b = L[cd.ganMoc];
  if (!a || !b) return null;
  return +(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * CM / cd.tong).toFixed(2);
}

/** đoạn cốt độ chứa huyệt + số thốn sách gán cho nó */
function cotDoCua(code, mer) {
  for (const [key, d] of Object.entries(DOAN)) {
    if (!key.startsWith(mer + '/')) continue;
    const diem = d.diem || {};
    const co = code === d.xa || code === d.gan || (code in diem);
    if (!co) continue;
    const v = diem[code];
    return { doan: key, tong: d.tong, xa: d.xa, gan: d.gan, xaMoc: d.xaMoc, ganMoc: d.ganMoc,
      thonCuaHuyet: code === d.xa ? 0 : code === d.gan ? d.tong : (typeof v === 'object' ? v.thon : v),
      lechNgang: typeof v === 'object' ? { lech: v.lech, huong: v.huong } : null, moiDiem: diem };
  }
  return null;
}

/** mọi cờ nghi ngờ mà các bộ kiểm đã bắn cho huyệt này */
function coCua(code) {
  const c = [];
  const r1 = REPORTS.diem.rows.find(r => r.code === code);
  if (r1) c.push(`RẢI DỌC ĐƯỜNG dời ${r1.cm}cm (conf=${r1.conf})`);
  const r2 = REPORTS.duong.rows.find(r => r.code === code);
  if (r2) c.push(`XA ĐƯỜNG KINH ${r2.cm}cm`);
  const r3 = (REPORTS.da.rows || REPORTS.da || []).find && (REPORTS.da.rows || []).find(r => r.code === code);
  if (r3) c.push(`ÉP LÊN DA dời ${r3.cm}cm`);
  const r4 = REPORTS.vung.sai.find(r => r.code === code) || REPORTS.vung.khongro.find(r => r.code === code);
  if (r4) c.push(`VÙNG: xương gần nhất "${r4.xuong}" cách ${r4.cm}cm${r4.ngoaiLe ? ' (đã duyệt ngoại lệ)' : ''}`);
  for (const l of (REPORTS.audit.loi || [])) if (l.code === code) c.push(`AUDIT ${l.loai}: ${l.mo || JSON.stringify(l)}`);
  const r5 = REPORTS.tudien.rows.find(r => r.code === code);
  if (r5) {
    const ph = t => t ? `${t.loai} "${t.ref}" đòi ${t.cun} thốn, đo được ${t.thucThon}  (lệch ${t.lechCm}cm${t.saiChieu ? ', SAI CHIỀU' : ''})` : null;
    if (r5.app && r5.app.xau) c.push(`TỪ ĐIỂN APP kêu: ${ph(r5.app.xau)}`);
    if (r5.focks && r5.focks.xau) c.push(`ATLAS FOCKS kêu: ${ph(r5.focks.xau)}`);
  }
  return c;
}

(async () => {
  const args = process.argv.slice(2);
  const tatCa = args.includes('--tat-ca');
  const muon = new Set();
  for (const a of args) {
    if (a.startsWith('--')) continue;
    if (NODES[a]) VITRI.filter(p => p.mer === a).forEach(p => muon.add(p.code));
    else muon.add(a);
  }
  if (tatCa) VITRI.forEach(p => muon.add(p.code));
  if (!muon.size) { console.log('Dùng: node ho-so.cjs TE | TE5 TE6 | --tat-ca'); process.exit(1); }

  G = await S.loadSkinGraph();
  const atlas = await loadAtlas({ layers: ['bone', 'muscle', 'connective'] });
  const xs = atlas.concepts.map(c => ({ ...c, p: atlas.points(c.conceptId) })).filter(c => c.p);
  /** k cấu trúc gần nhất — hội đồng cần biết huyệt nằm giữa những mô nào, không chỉ mô gần nhất */
  function ganNhat(Q, k = 5) {
    const out = [];
    for (const b of xs) {
      const bb = b.bb;
      const dx = Math.max(bb[0][0] - Q.x, 0, Q.x - bb[1][0]), dy = Math.max(bb[0][1] - Q.y, 0, Q.y - bb[1][1]), dz = Math.max(bb[0][2] - Q.z, 0, Q.z - bb[1][2]);
      const lb = dx * dx + dy * dy + dz * dz;
      if (out.length === k && lb > out[k - 1].d) continue;
      let bd = Infinity;
      for (let i = 0; i < b.p.length; i += 3) {
        const d = (b.p[i] - Q.x) ** 2 + (b.p[i + 1] - Q.y) ** 2 + (b.p[i + 2] - Q.z) ** 2;
        if (d < bd) bd = d;
      }
      out.push({ ten: b.vi || b.en, lop: b.layer, d: bd });
      out.sort((a, c) => a.d - c.d); if (out.length > k) out.length = k;
    }
    return out.map(o => ({ ten: o.ten, lop: o.lop, cm: +(Math.sqrt(o.d) * CM).toFixed(2) }));
  }

  fs.mkdirSync(OUT, { recursive: true });
  const codes = VITRI.filter(p => muon.has(p.code)).map(p => p.code);
  for (const code of codes) {
    const v = VITRI.find(p => p.code === code);
    const mer = v.mer, f = FOCKS[code], pt = P[code];
    const def = NODES[mer];
    const seg = def && def.doan.find(s => s.diem.includes(code));
    const nut = def && def.nut && def.nut.find(n => n.code === code);
    const dsKinh = VITRI.filter(p => p.mer === mer).sort((a, b) => a.num - b.num);
    const i = dsKinh.findIndex(p => p.code === code);

    const hangXom = [];
    for (const j of [i - 1, i + 1]) {
      const n = dsKinh[j]; if (!n || !P[n.code] || !pt) continue;
      const cd = cotDoCua(code, mer), cdn = cotDoCua(n.code, mer);
      let sachThon = null;
      if (cd && cdn && cd.doan === cdn.doan && cd.thonCuaHuyet != null && cdn.thonCuaHuyet != null)
        sachThon = Math.abs(cd.thonCuaHuyet - cdn.thonCuaHuyet);
      const tcm = thonCm(cd);
      hangXom.push({ code: n.code, ten: n.name, thang: +(d3(pt, P[n.code]) * CM).toFixed(2),
        sachDoiCm: sachThon != null && tcm ? +(sachThon * tcm).toFixed(2) : null, thonCm: tcm,
        docDa: docDa(code, n.code) != null ? +docDa(code, n.code).toFixed(2) : null,
        sachDoiThon: sachThon, vitri: n.vitri });
    }
    const lanCan = pt ? Object.entries(P).filter(([c, q]) => c !== code && q && q.x !== undefined && d3(pt, q) * CM < 4)
      .map(([c, q]) => ({ code: c, ten: (VITRI.find(p => p.code === c) || {}).name, cm: +(d3(pt, q) * CM).toFixed(2) }))
      .sort((a, b) => a.cm - b.cm).slice(0, 12) : [];

    const anh = (HINH.huyet[code] || []).map(a => path.join(HINH._thumuc, a.file));
    const chot = SO.chot[code], ngo = SO.ngo && SO.ngo[code];
    const lechTen = f && kd(f.ten) !== kd(v.name);

    const hs = {
      code, mer, num: v.num, tenApp: v.name, tenFocks: f ? f.ten : null,
      canhBaoTen: lechTen ? `TÊN HAI NGUỒN KHÁC NHAU — app "${v.name}" vs Focks "${f.ten}". Phải trọng tài TRƯỚC khi bàn toạ độ: nếu mã lệch thì đang dựng nhầm huyệt.` : (f ? null : 'FOCKS KHÔNG CÓ HUYỆT NÀY — chỉ còn một nguồn chữ.'),
      nguon: {
        app: v.vitri || null,
        focksViTri: f ? f.vitri : null,
        focksCachXacDinh: f ? f.cach : null,
        who: null,                       // ← agent thu thập điền
      },
      anh,
      toaDoHienTai: pt ? { x: pt.x, y: pt.y, z: pt.z, conf: pt.conf || null,
        caoDoCm: +(pt.y * CM).toFixed(2), ngangCm: +(pt.x * CM).toFixed(2), truocSauCm: +(pt.z * CM).toFixed(2) } : null,
      nghiemThu: chot ? { hang: chot.hang, nguon: chot.nguon, ly: chot.ly, ngay: chot.ngay } : { hang: 'C', ly: 'chưa vào sổ' },
      conNgo: ngo ? { loai: ngo.loai, ly: ngo.ly } : null,
      duongKinh: seg ? { doan: seg.id, vung: seg.vung, moTaRanh: seg.ranh, diemTrongDoan: seg.diem } : null,
      nutMoc: nut || null,
      cotDo: cotDoCua(code, mer),
      hangXom, lanCan,
      giaiPhauGanNhat: pt ? ganNhat(pt) : [],
      coKiemMay: coCua(code),
    };
    fs.writeFileSync(path.join(OUT, code + '.json'), JSON.stringify(hs, null, 1));

    /* bản .md — hội đồng đọc bản này, không phải JSON: cãi nhau bằng câu chữ thì phải đọc được */
    const L = [];
    L.push(`# HỒ SƠ HUYỆT ${code} — ${v.name}${f ? ` (Focks: ${f.ten})` : ''}`);
    if (hs.canhBaoTen) L.push(`\n> ⚠️ ${hs.canhBaoTen}`);
    L.push(`\nKinh ${mer} (${def ? def.ten : '?'}), huyệt thứ ${v.num}. Hạng nghiệm thu: **${hs.nghiemThu.hang}** — ${hs.nghiemThu.ly}`);
    L.push(`\n## 1. Nguồn chữ`);
    L.push(`**Từ điển app:** ${v.vitri || '(trống)'}`);
    L.push(`\n**Atlas Focks — vị trí:** ${f ? f.vitri : '(không có)'}`);
    if (f && f.cach) L.push(`\n**Atlas Focks — cách xác định:** ${f.cach}`);
    L.push(`\n**WHO 2008:** (chưa thu thập — agent thư lại điền)`);
    L.push(`\n## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả`);
    L.push(anh.length ? anh.map(a => `- ${a}`).join('\n') : '- (không có ảnh)');
    L.push(`
Mỗi trang thường có hai bảng: **bản vẽ sơ đồ xương** (bên trái) và **ảnh chụp người thật** (bên phải).
Bản vẽ là thứ đáng giá nhất vì nó đặt huyệt đang xét CẠNH NHIỀU HUYỆT KINH KHÁC trên cùng một hình —
vị trí tương đối giữa chúng không phụ thuộc cỡ ảnh hay tầm vóc người mẫu.

**KÝ HIỆU TRONG ẢNH LÀ TIẾNG ĐỨC** (bản Focks dịch từ *Leitfaden Akupunktur*). Đọc nhầm ký hiệu là
phán quyết sai từ gốc mà không ai phát hiện:
| trong ảnh | tiếng Đức | kinh | mã quốc tế |
|---|---|---|---|
| Lu | Lunge | Phế | LU |
| Di | Dickdarm | Đại Trường | **LI** |
| Ma | Magen | Vị | ST |
| Mi | Milz | Tỳ | SP |
| He | Herz | Tâm | HT |
| **Dü** | Dünndarm | Tiểu Trường | **SI** |
| Bl | Blase | Bàng Quang | BL |
| Ni | Niere | Thận | KI |
| Pe | Perikard | Tâm Bào | PC |
| **SJ / 3E / TB** | San Jiao | Tam Tiêu | **TE** |
| Gb / G | Gallenblase | Đởm | GB |
| Le / Liv | Leber | Can | LR |
| Du | Du Mai | Đốc | GV |
| Ren | Ren Mai | Nhâm | CV |
| Ex-UE | Extrapunkte obere Extremität | kỳ huyệt chi trên | (ngoài kinh) |
| Ex-LE / Ex-KH / Ex-B | chi dưới / đầu-cổ / lưng | kỳ huyệt | (ngoài kinh) |

Chú ý hai chỗ dễ lẫn nhất: **Dü là Tiểu Trường (SI), không phải Đốc**; **SJ là Tam Tiêu (TE), không
phải Tiểu Trường**.

**CÁCH ĐO (bắt buộc, đừng tả bằng lời):**
1. \`node do-anh-atlas.cjs ${code} --luoi\` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   \`t = ((X−A)·(B−A)) / |B−A|²\` tính trên pixel.
4. \`node doi-chieu-ti-le.cjs ${code} <A> <B> --anh <t vừa tính>\` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.`);
    L.push(`\n## 3. Toạ độ engine đang dựng`);
    L.push(pt ? `x=${pt.x} y=${pt.y} z=${pt.z}  →  ngang ${hs.toaDoHienTai.ngangCm}cm · cao ${hs.toaDoHienTai.caoDoCm}cm · trước-sau ${hs.toaDoHienTai.truocSauCm}cm · conf=${pt.conf || '?'}` : '(CHƯA CÓ TOẠ ĐỘ)');
    L.push(`\n## 4. Khung đường kinh`);
    L.push(seg ? `Đoạn **${seg.id}** — vùng: ${seg.vung}. Ranh mô: ${seg.ranh}\nCác huyệt trong đoạn: ${seg.diem.join(' → ')}` : '(không thuộc đoạn nào)');
    if (nut) L.push(`Là NÚT MỐC loại "${nut.loai}" tại ${nut.at} — ${nut.vi_sao}`);
    if (hs.cotDo) { const c = hs.cotDo;
      L.push(`\n## 5. Cốt độ\nĐoạn ${c.doan}: **${c.tong} thốn** từ ${c.xa} (${c.xaMoc}) đến ${c.gan} (${c.ganMoc}).`);
      L.push(`1 thốn tại chỗ ≈ **${thonCm(c) ?? '?'}cm** (đo dọc trục chi giữa hai mốc xương).`);
      L.push(`Huyệt này ở mốc **${c.thonCuaHuyet} thốn**${c.lechNgang ? `, lệch ngang ${c.lechNgang.lech} thốn về phía ${c.lechNgang.huong}` : ''}.`);
      L.push(`Cả đoạn: ${Object.entries(c.moiDiem).map(([k, x]) => `${k}=${typeof x === 'object' ? x.thon : x}`).join(', ')}`);
    }
    L.push(`\n## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)`);
    for (const h of hangXom) L.push(`- **${h.code}** ${h.ten}: đo thẳng ${h.thang}cm, đo trên da ${h.docDa ?? '?'}cm${h.sachDoiThon != null ? ` — **sách đòi ${h.sachDoiThon} thốn${h.sachDoiCm ? ` ≈ ${h.sachDoiCm}cm` : ''}**${h.sachDoiCm ? ` → LỆCH ${(h.docDa != null ? h.docDa - h.sachDoiCm : h.thang - h.sachDoiCm).toFixed(2)}cm` : ''}` : ''}\n  > ${h.vitri || ''}`);
    L.push(`\n## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng`);
    L.push(lanCan.length ? lanCan.map(x => `- ${x.code} ${x.ten || ''} — ${x.cm}cm`).join('\n') : '- (không có)');
    L.push(`\n## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas`);
    L.push(hs.giaiPhauGanNhat.map(g => `- ${g.ten} (${g.lop}) — ${g.cm}cm`).join('\n') || '- (không đo được)');
    L.push(`\n## 9. Cờ mà các bộ kiểm máy đã bắn`);
    L.push(hs.coKiemMay.length ? hs.coKiemMay.map(c => `- ${c}`).join('\n') : '- (sạch)');
    if (ngo) L.push(`\n## 10. Đã ghi CÒN NGỜ trong sổ\nLoại: ${ngo.loai.join(', ')}\n${ngo.ly}`);
    fs.writeFileSync(path.join(OUT, code + '.md'), L.join('\n') + '\n');
    process.stdout.write(`${code} `);
  }
  console.log(`\n\n${codes.length} hồ sơ → backend/src/acu-solver/ho-so/`);
})();
