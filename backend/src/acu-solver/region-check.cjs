/* region-check — BƯỚC 4b: KIỂM HUYỆT THEO VÙNG GIẢI PHẪU.
 *
 * VÌ SAO CẦN, DÙ ĐÃ CÓ ĐƯỜNG KINH
 * Cốt độ, khe mô và đường kinh đều là suy luận TƯƠNG ĐỐI: đếm thốn từ một mốc, trượt vào một rãnh,
 * rải dọc một đường. Cả ba đều có thể đúng logic mà sai thực địa — nếu cái MỐC gốc đã sai vùng thì
 * mọi thứ dựng trên nó sai theo mà không tầng nào phát hiện, vì không tầng nào hỏi câu thô sơ nhất:
 * "huyệt này đang ở BỘ PHẬN nào của cơ thể?"
 *
 * Ca thật đã bắt được bằng chính phép kiểm này: ST31 Bễ Quan — sách ghi "nếp bẹn, phễu đùi" — có
 * toạ độ x = 26,8cm, và xương gần nó nhất là XƯƠNG ĐỐT BÀN TAY 2 (cách 1,9cm). Huyệt đùi nằm trên
 * bàn tay, mang nhãn tin cậy CAO NHẤT (conf='mốc'), suốt nhiều đợt không ai thấy. Nó còn bẻ cong cả
 * đoạn đùi kinh Vị: đường trắc địa ST30→ST31 ra 82,9cm trong khi đường thẳng chỉ 21,8cm.
 *
 * CÁCH KIỂM: hỏi atlas "xương gần huyệt này nhất là xương gì", quy xương đó về một VÙNG (sọ, cột
 * sống, sườn-ức, vai-đòn, cánh tay, cẳng tay, bàn tay, chậu, đùi, gối, cẳng chân, bàn chân), rồi
 * đối chiếu với vùng mà ĐOẠN đường kinh chứa huyệt đã khai trong meridian-nodes.cjs.
 *
 * Phép kiểm này ĐỘC LẬP với cốt độ, với khe mô và với đường kinh — nó chỉ dùng hình học xương thật.
 * Vì thế nó bắt được đúng loại lỗi mà ba tầng kia mù: "sách đúng, thực địa sai".
 *
 * Dùng:  node backend/src/acu-solver/region-check.cjs                                              */
const fs = require('fs');
const path = require('path');
const { NODES } = require('./meridian-nodes.cjs');
const { loadAtlas } = require('./mesh-io.cjs');

const CM = 171.9;
const ROOT = path.resolve(__dirname, '../../..');
const loadWin = (f, k) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w[k]; };

/* Tên cấu trúc (tiếng Việt trong atlas) → VÙNG cơ thể.
 * KHÔNG chỉ xương: đo thật thì cấu trúc gần huyệt nhất thường là CƠ (dải chậu chày, cơ mác dài,
 * cơ nâng vai…). Bỏ sót cơ thì 78/384 huyệt rơi vào "không phân loại được" và phép kiểm mất tác dụng. */
const VUNG_XUONG = [
  // ---- cơ & mô mềm, xếp TRƯỚC vì tên chúng hay chứa tên xương ("cơ chày trước") ----
  [/cơ gian cốt (?:mu|gan) tay|cơ giun.*tay|cơ khép ngón cái|cơ dạng ngón cái|cơ đối ngón|mô cái|mô út/i, 'ban-tay'],
  [/cơ gian cốt.*chân|cơ giun.*chân|cơ dạng ngón chân cái|cơ gấp ngắn ngón chân/i, 'ban-chan'],
  [/cơ mác|cơ chày|cơ dép|cơ bụng chân|gân gót|cơ duỗi (?:dài|các ngón) ngón chân|cơ gấp (?:dài|các ngón) ngón chân/i, 'cang-chan'],
  [/dải chậu chày|cơ tứ đầu|cơ rộng|cơ thẳng đùi|cơ may|cơ khép|cơ nhị đầu đùi|cơ bán gân|cơ bán mạc|cơ thon|cơ lược|cơ căng mạc đùi/i, 'dui'],
  [/cơ mông|cơ hình lê|cơ bịt|cơ vuông đùi|cơ thắt lưng chậu|cơ chậu/i, 'chau'],
  [/cơ nâng vai|cơ thang|cơ delta|cơ trên gai|cơ dưới gai|cơ tròn (?:lớn|bé)|cơ dưới vai|cơ trám/i, 'vai-don'],
  [/cơ nhị đầu cánh tay|cơ tam đầu|cơ quạ|cơ cánh tay(?! quay)|cơ khuỷu/i, 'canh-tay'],
  [/cơ ngửa|cơ sấp|cơ gấp cổ tay|cơ duỗi cổ tay|cơ gan tay|cơ cánh tay quay|cơ gấp các ngón|cơ duỗi các ngón|cơ duỗi ngón/i, 'cang-tay'],
  [/cơ thẳng bụng|cơ chéo bụng|cơ ngang bụng|đường trắng|dây chằng bẹn/i, 'suon-uc'],
  [/cơ ngực|cơ răng|cơ gian sườn|cơ dưới đòn|cơ hoành/i, 'suon-uc'],
  [/cơ ức[- ]đòn[- ]chũm|cơ bậc thang|cơ vai móng|cơ ức móng|cơ hai thân/i, 'so'],
  [/cơ thái dương|cơ cắn|cơ vòng|cơ chân bướm|cơ gò má|cơ chẩm|cơ trán/i, 'so'],
  [/cơ dài lưng|cơ dựng sống|cơ chậu sườn|cơ gai|cơ nhiều chân|cơ lưng rộng|cơ vuông thắt lưng/i, 'cot-song'],
  // ---- xương ----
  [/đốt bàn tay|xương cổ tay|xương thuyền|xương nguyệt|xương tháp|xương đậu|xương thang|xương thê|xương cả|xương móc|ngón tay|ngón (?:cái|trỏ|giữa|nhẫn|út)(?!.*chân)/i, 'ban-tay'],
  [/đốt bàn chân|xương gót|xương sên|xương hộp|xương ghe|xương chêm|ngón chân/i, 'ban-chan'],
  [/xương quay|xương trụ/i, 'cang-tay'],
  [/xương cánh tay/i, 'canh-tay'],
  [/xương đòn|xương vai|xương bả/i, 'vai-don'],
  [/xương chày|xương chầy|xương mác/i, 'cang-chan'],
  [/bánh chè/i, 'goi'],
  [/xương đùi/i, 'dui'],
  [/xương chậu|xương mu|xương ngồi|cánh chậu/i, 'chau'],
  [/xương sườn|xương ức|cán ức|mũi ức|sụn sườn|mỏm mũi ức/i, 'suon-uc'],
  [/đốt sống|đĩa gian đốt|xương cùng|xương cụt/i, 'cot-song'],
  [/hàm dưới|hàm trên|gò má|xương trán|xương đỉnh|xương chẩm|thái dương|xương bướm|xương sàng|xương mũi|xương lệ|lá mía|sụn giáp|sụn phễu|sụn nhẫn|xương móng/i, 'so'],
];
const vungCua = ten => { for (const [re, v] of VUNG_XUONG) if (re.test(ten)) return v; return null; };

/** mô tả vùng của ĐOẠN (trường `vung` trong meridian-nodes) → các vùng xương CHẤP NHẬN được.
 *  Cho phép nhiều vùng vì ranh giới cơ thể không sắc: huyệt cổ tay gần cả xương quay lẫn xương cổ tay. */
const CHO_PHEP = [
  // các mô tả có chữ dễ đụng luật khác phải xét TRƯỚC: "mũi ức" là xương ức chứ không phải mũi,
  // "đáy chậu → rốn" là bụng chứ không phải chậu.
  [/mũi ức|xương ức|đáy chậu|rốn/i, ['suon-uc', 'cot-song', 'chau']],
  [/bàn chân|gan bàn chân|mu bàn chân|ngón chân/i, ['ban-chan', 'cang-chan']],
  [/bàn tay|mô cái|mô út|gan bàn tay|mu bàn tay|ngón tay/i, ['ban-tay', 'cang-tay']],
  [/cẳng tay/i, ['cang-tay', 'ban-tay', 'canh-tay']],
  [/ngực|sườn|ức/i, ['suon-uc', 'vai-don', 'cot-song', 'chau', 'canh-tay']],   // sườn bên chạy từ nách (kề xương cánh tay) xuống mào chậu
  [/cánh tay|nách/i, ['canh-tay', 'vai-don', 'cang-tay', 'suon-uc']],
  [/vai/i, ['vai-don', 'canh-tay', 'cot-song', 'suon-uc']],
  [/cẳng chân/i, ['cang-chan', 'goi', 'ban-chan', 'dui']],   // đầu trên cẳng chân sát đầu dưới xương đùi (nếp kheo)
  [/gối|kheo/i, ['goi', 'dui', 'cang-chan']],
  [/đùi/i, ['dui', 'goi', 'chau']],
  [/mông|hông/i, ['chau', 'dui', 'cot-song']],
  [/lưng|xương cùng|cùng/i, ['cot-song', 'suon-uc', 'chau', 'vai-don']],   // lưng trên kề xương bả vai & cơ nâng vai
  [/bụng/i, ['suon-uc', 'cot-song', 'chau']],
  [/cổ|gáy|họng/i, ['so', 'cot-song', 'vai-don', 'suon-uc']],
  [/đầu|trán|đỉnh|chẩm|thái dương|mặt|mắt|tai|mũi|miệng|hàm|sọ/i, ['so', 'cot-song']],
];
const chophepCua = vung => { for (const [re, v] of CHO_PHEP) if (re.test(vung)) return v; return null; };

(async () => {
  const atlas = await loadAtlas({ layers: ['bone'] });
  const xs = atlas.concepts.filter(c => c.layer === 'bone').map(c => ({ ...c, p: atlas.points(c.conceptId) })).filter(c => c.p);
  const P = loadWin(path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'ACU_COORDS3D').points;

  /** xương gần nhất (loại nhanh bằng khung bao cho đỡ quét cả triệu đỉnh) */
  function ganNhat(Q) {
    let bd = Infinity, bn = null;
    for (const b of xs) {
      const bb = b.bb;
      const dx = Math.max(bb[0][0] - Q.x, 0, Q.x - bb[1][0]);
      const dy = Math.max(bb[0][1] - Q.y, 0, Q.y - bb[1][1]);
      const dz = Math.max(bb[0][2] - Q.z, 0, Q.z - bb[1][2]);
      if (dx * dx + dy * dy + dz * dz > bd) continue;
      for (let i = 0; i < b.p.length; i += 3) {
        const d = (b.p[i] - Q.x) ** 2 + (b.p[i + 1] - Q.y) ** 2 + (b.p[i + 2] - Q.z) ** 2;
        if (d < bd) { bd = d; bn = b; }
      }
    }
    return { ten: bn ? (bn.vi || bn.en) : '?', cm: Math.sqrt(bd) * CM };
  }

  /* Huyệt ở RANH GIỚI hai đoạn (vd GB20 vừa thuộc đoạn gáy vừa thuộc đoạn vai, SI8 vừa khuỷu vừa bả
   * vai) được hưởng vùng của CẢ HAI đoạn — nếu không, chính chỗ nối lại bị báo sai oan. */
  const choCua = {};
  for (const [mer, def] of Object.entries(NODES)) for (const seg of def.doan) {
    const v = chophepCua(seg.vung || ''); if (!v) continue;
    for (const c of seg.diem) choCua[c] = [...new Set([...(choCua[c] || []), ...v])];
  }
  /* NGOẠI LỆ ĐÃ KIỂM — huyệt nằm ĐÚNG chỗ nhưng rơi vào ranh giới hai vùng, nên "xương gần nhất"
   * thuộc vùng bên kia. Chỉ khai sau khi đã đo và xác nhận vị trí đúng theo sách. */
  const NGOAI_LE = {
    BL39: 'Uỷ Dương nằm TRÊN NẾP KHEO — chính là ranh giới đùi/cẳng chân — và đúng 1 thốn ngoài Uỷ Trung BL40 như sách; xương mác ở ngay đó nên phép kiểm vùng báo "cẳng chân". Đã đo: BL40 x=8,3 → BL39 x=10,5, đúng bằng 1 thốn chân.',
  };
  const sai = [], khongro = [];
  let dat = 0, tong = 0;
  const daXet = new Set();
  for (const [mer, def] of Object.entries(NODES)) {
    for (const seg of def.doan) {
      const cho = choCua[seg.diem[0]] && seg.vung ? null : null;   // dùng choCua theo từng huyệt bên dưới
      for (const c of seg.diem) {
        if (daXet.has(c)) continue;
        daXet.add(c);
        const pt = P[c];
        if (!pt || pt.x === undefined) continue;
        tong++;
        const g = ganNhat(pt);
        const v = vungCua(g.ten);
        const ok = choCua[c];
        if (!ok || !v) { khongro.push({ code: c, xuong: g.ten, cm: +g.cm.toFixed(1), vung: seg.vung }); continue; }
        if (ok.includes(v)) { dat++; continue; }
        if (NGOAI_LE[c]) { khongro.push({ code: c, xuong: g.ten, cm: +g.cm.toFixed(1), vung: seg.vung, ngoaiLe: NGOAI_LE[c] }); continue; }
        sai.push({ code: c, mer, doan: seg.id, vungKhai: seg.vung, xuong: g.ten, vungXuong: v, cm: +g.cm.toFixed(1), conf: pt.conf || '' });
      }
    }
  }
  sai.sort((a, b) => a.cm - b.cm);
  console.log(`KIỂM VÙNG: ${tong} huyệt · ĐẠT ${dat} · SAI VÙNG ${sai.length} · không phân loại được ${khongro.length}`);
  if (sai.length) {
    console.log('\n  huyệt NẰM SAI BỘ PHẬN (xương gần nhất thuộc vùng khác hẳn đoạn kinh đã khai):');
    console.log('  huyệt  đoạn khai                 xương gần nhất                        cách   conf');
    for (const r of sai.slice(0, 30))
      console.log(`  ${r.code.padEnd(6)} ${r.vungKhai.slice(0, 24).padEnd(25)} ${r.xuong.slice(0, 36).padEnd(37)} ${String(r.cm).padStart(5)}cm ${r.conf}`);
  }
  fs.writeFileSync(path.join(__dirname, 'region-report.json'), JSON.stringify({ sai, khongro }, null, 1));
  console.log(`\nBáo cáo: backend/src/acu-solver/region-report.json`);
})();
