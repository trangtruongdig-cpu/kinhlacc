/* quan-he-check — KIỂM QUAN HỆ GIẢI PHẪU giữa huyệt và mốc xương.
 *
 * Ba bộ kiểm trước trả lời ba câu khác nhau: tầng 5 hỏi "có trên da không", region-check hỏi "có
 * đúng BỘ PHẬN không", paths-report hỏi "có trên đường kinh không". Không bộ nào hỏi câu mà sách
 * luôn nói rõ: "huyệt này ở TRƯỚC hay SAU, TRÊN hay DƯỚI cái mốc kia".
 *
 * Đó là loại ràng buộc rẻ nhất mà chặt nhất: không cần biết chính xác bao nhiêu centimet, chỉ cần
 * biết CHIỀU. Sai chiều là sai chắc chắn, không cần tranh luận.
 *
 * Bộ này bắt được hai thứ ngay lần chạy đầu:
 *   · GB40 Khâu Khư bị dựng CAO hơn đỉnh mắt cá ngoài 1cm, trong khi sách ghi "trước-DƯỚI" — lỗi do
 *     bước dán-da kéo điểm lên, không phải do quy tắc dựng;
 *   · một giả định SAI của chính người viết: tưởng KI3 và BL60 phải cùng cao độ. Không — mắt cá NGOÀI
 *     thấp hơn mắt cá TRONG 1,9cm trên mesh này (và trên người thật), nên hai huyệt lệch nhau đúng
 *     chừng ấy. Phép kiểm sai chứ dữ liệu không sai.
 *
 * Dùng:  node backend/src/acu-solver/quan-he-check.cjs                                             */
const fs = require('fs');
const path = require('path');
const { loadAtlas } = require('./mesh-io.cjs');
const CM = 171.9;

/** mốc xương cần dò: id → cách lấy điểm đặc trưng */
const MOC = {
  MAT_CA_TRONG: [/^left tibia$/i, p => p.reduce((b, q) => (!b || q.y < b.y) ? q : b, null)],
  MAT_CA_NGOAI: [/^left fibula$/i, p => p.reduce((b, q) => (!b || q.y < b.y) ? q : b, null)],
  XUONG_DAU: [/^left pisiform$/i, p => p.reduce((s, q) => ({ x: s.x + q.x / p.length, y: s.y + q.y / p.length, z: s.z + q.z / p.length }), { x: 0, y: 0, z: 0 })],
  DINH_BANH_CHE: [/^left patella$|xương bánh chè trái/i, p => p.reduce((b, q) => (!b || q.y > b.y) ? q : b, null)],
  MAU_CHUYEN_LON: [/^left femur$|xương đùi trái/i, p => p.reduce((b, q) => (!b || q.x > b.x) ? q : b, null)],
  LOI_CAU_TRONG: [/^left humerus$/i, p => { const lo = p.reduce((b, q) => (!b || q.y < b.y) ? q : b, null).y; return p.filter(q => q.y - lo < 0.014).reduce((b, q) => (!b || q.x < b.x) ? q : b, null); }],
  C7: [/^C7 vertebra$|đốt sống cổ 7|seventh cervical/i, p => p.reduce((b, q) => (!b || q.y > b.y) ? q : b, null)],
  // MỎM GAI (điểm SAU nhất, gần đường giữa), không phải trọng tâm thân đốt — hai thứ lệch nhau vài cm
  L2: [/^L2 vertebra$|đốt sống thắt lưng 2|second lumbar/i, p => p.filter(q => Math.abs(q.x) < 0.008).reduce((b, q) => (!b || q.z < b.z) ? q : b, null) || p[0]],
  GIUA_DON: [/left clavicle|xương đòn trái/i, p => { let a = null, b = null;
    for (const q of p) { if (!a || q.x < a.x) a = q; if (!b || q.x > b.x) b = q; }
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }; }],
  MEP_UC: [/^body of sternum$/i, p => p.reduce((b, q) => (!b || q.x > b.x) ? q : b, null)],
  DAU_VU: [/^left fourth rib$|xương sườn 4 trái/i, p => { const c = p.filter(q => q.z > 0.03); return c.length ? c.reduce((s, q) => ({ x: s.x + q.x / c.length, y: s.y + q.y / c.length, z: s.z + q.z / c.length }), { x: 0, y: 0, z: 0 }) : p[0]; }],
  /* LO_TAI = hõm ỐNG TAI, không phải "điểm ngoài nhất của xương thái dương" (điểm đó nằm tít trên
   * vảy thái dương, cao hơn ống tai 4cm). Dò bằng chỗ vỏ NGOÀI lõm vào nhất trong dải ngang tai. */
  LO_TAI: [/^left temporal bone$/i, p => {
    const dai = p.filter(q => q.y > 0.905 && q.y < 0.930 && q.z > -0.035 && q.z < 0.010);
    const o = {}; for (const q of dai) { const k = Math.round(q.z * 400) + '|' + Math.round(q.y * 400); if (!o[k] || q.x > o[k].x) o[k] = q; }
    const lom = Object.values(o).sort((a, b) => a.x - b.x).slice(0, 5);
    return { x: lom.reduce((s, q) => s + q.x, 0) / 5, y: lom.reduce((s, q) => s + q.y, 0) / 5, z: lom.reduce((s, q) => s + q.z, 0) / 5 };
  }],
  BO_NGOAI_O_MAT: [/^left zygomatic bone$/i, p => p.filter(q => q.y > 0.930).reduce((b, q) => (!b || q.x > b.x) ? q : b, null)],
  MOM_KHUYU: [/^left ulna$/i, p => { const hi = p.reduce((b, q) => (!b || q.y > b.y) ? q : b, null).y; return p.filter(q => hi - q.y < 0.012).reduce((b, q) => (!b || q.z < b.z) ? q : b, null); }],
};

/* Bảng quan hệ. Mỗi dòng: [mô tả, biểu thức]. `H` = bảng huyệt, `M` = mốc đã dò.
 * CHỈ khai những quan hệ mà SÁCH nói rõ — không tự bịa thêm ràng buộc. */
const LUAT = [
  ['KI3 ở SAU mắt cá trong', (H, M) => H.KI3.z < M.MAT_CA_TRONG.z],
  ['SP5 ở TRƯỚC-DƯỚI mắt cá trong', (H, M) => H.SP5.z > M.MAT_CA_TRONG.z && H.SP5.y < M.MAT_CA_TRONG.y],
  ['LR4 ở TRƯỚC mắt cá trong', (H, M) => H.LR4.z > M.MAT_CA_TRONG.z],
  ['LR4 CAO hơn SP5', (H) => H.LR4.y > H.SP5.y],
  ['BL60 ở SAU mắt cá ngoài', (H, M) => H.BL60.z < M.MAT_CA_NGOAI.z],
  ['GB40 ở TRƯỚC-DƯỚI mắt cá ngoài', (H, M) => H.GB40.z > M.MAT_CA_NGOAI.z && H.GB40.y < M.MAT_CA_NGOAI.y],
  ['ST41 giữa lằn cổ chân, CAO hơn GB40', (H) => H.ST41.y > H.GB40.y],
  ['lằn cổ tay: LU9 (quay) → PC7 → HT7 (trụ)', (H) => H.LU9.x > H.PC7.x && H.PC7.x > H.HT7.x],
  ['LU9/PC7/HT7 cùng một lằn (chênh <1cm)', (H) => (Math.max(H.LU9.y, H.PC7.y, H.HT7.y) - Math.min(H.LU9.y, H.PC7.y, H.HT7.y)) * CM < 1],
  ['TE4 và SI5 ở mặt MU (sau PC7 mặt gan)', (H) => H.TE4.z < H.PC7.z && H.SI5.z < H.PC7.z],
  ['LI5 (hố lào) ở phía QUAY, ngoài TE4', (H) => H.LI5.x > H.TE4.x],
  ['HT7 sát bờ quay xương đậu (chênh <2cm)', (H, M) => Math.hypot(H.HT7.x - M.XUONG_DAU.x, H.HT7.y - M.XUONG_DAU.y, H.HT7.z - M.XUONG_DAU.z) * CM < 2],
  ['ST35 (mắt gối ngoài) DƯỚI đỉnh bánh chè', (H, M) => H.ST35.y < M.DINH_BANH_CHE.y],
  // ---- khuỷu / gối (đợt 3) ----
  ['SI8 nằm GIỮA mỏm khuỷu và lồi cầu trong (x kẹp giữa)', (H, M) => H.SI8.x > M.LOI_CAU_TRONG.x && H.SI8.x < M.MOM_KHUYU.x],
  ['TE10 ở TRÊN mỏm khuỷu (0,5–2,5 thốn tay)', (H, M) => { const d = (H.TE10.y - M.MOM_KHUYU.y) * CM; return d > 0.9 && d < 4.7; }],
  ['SI8 và TE10 đều ở mặt SAU (sau lồi cầu trong)', (H, M) => H.SI8.z < M.LOI_CAU_TRONG.z && H.TE10.z < M.LOI_CAU_TRONG.z],
  ['nếp khuỷu: LI11 (ngoài) > LU5 > PC3 > HT3 (trong)', (H) => H.LI11.x > H.LU5.x && H.LU5.x > H.PC3.x && H.PC3.x > H.HT3.x],
  ['bốn huyệt nếp khuỷu cùng một mức (chênh <1,5cm)', (H) => (Math.max(H.LI11.y, H.LU5.y, H.PC3.y, H.HT3.y) - Math.min(H.LI11.y, H.LU5.y, H.PC3.y, H.HT3.y)) * CM < 1.5],
  ['nếp kheo: KI10 (trong) < BL40 (giữa) theo trục ngang', (H) => H.KI10.x < H.BL40.x],
  ['LR8 ở TRƯỚC KI10 (Khúc Tuyền trước hai gân)', (H) => H.LR8.z > H.KI10.z],
  ['SP9 ở phía TRONG hơn GB34 (hai bên gối)', (H) => H.SP9.x < H.GB34.x],
  ['SP9 và GB34 cùng tầm cao khe gối (chênh <3cm)', (H) => Math.abs(H.SP9.y - H.GB34.y) * CM < 3],
  ['ST36 DƯỚI ST35', (H) => H.ST36.y < H.ST35.y],
  ['ngón tay: LU11(cái) > LI1(trỏ) > PC9(giữa) > TE1(nhẫn) > SI1(út) theo trục quay-trụ',
    (H) => H.LU11.x > H.LI1.x && H.LI1.x > H.PC9.x && H.PC9.x > H.TE1.x && H.TE1.x > H.SI1.x],
  ['HT9 và SI1 cùng ngón út, HT9 ở phía QUAY', (H) => H.HT9.x > H.SI1.x && Math.abs(H.HT9.y - H.SI1.y) * CM < 1.5],
  ['ngón chân: SP1(cái trong) < LR1(cái ngoài) < ST45(ngón 2) < GB44(ngón 4) < BL67(út)',
    (H) => H.SP1.x < H.LR1.x && H.LR1.x < H.ST45.x && H.ST45.x < H.GB44.x && H.GB44.x < H.BL67.x],
  ['KI1 (gan bàn chân) THẤP nhất và SAU các tỉnh huyệt ngón chân', (H) => H.KI1.z < H.ST45.z],
  // ---- Nhâm Mạch (đợt 4) ----
  ['toàn bộ Nhâm Mạch nằm trên ĐƯỜNG GIỮA (|x| < 0,5cm)',
    (H) => Array.from({ length: 22 }, (_, i) => 'CV' + (i + 1)).every(c => !H[c] || H[c].x === undefined || Math.abs(H[c].x) * CM < 0.5)],
  ['Nhâm Mạch CV2→CV22 tăng dần theo cao độ, không đảo chỗ',
    (H) => { const c = []; for (let i = 2; i <= 22; i++) if (H['CV' + i] && H['CV' + i].y !== undefined) c.push(H['CV' + i].y);
      return c.every((v, i) => i === 0 || v > c[i - 1]); }],
  ['CV17 Đản Trung NGANG đầu vú (chênh <2cm)', (H, M) => Math.abs(H.CV17.y - M.DAU_VU.y) * CM < 2],
  ['CV22 Thiên Đột ngang T2/T3 (hõm ức), cao hơn CV17 ít nhất 8cm', (H) => (H.CV22.y - H.CV17.y) * CM > 8],
  ['CV8 Thần Khuyết (rốn) nằm giữa CV2 và CV16 theo cao độ', (H) => H.CV8.y > H.CV2.y && H.CV8.y < H.CV16.y],
  // ---- thốn ngang THÂN (đợt 6) — nhóm luật này bắt lỗi đơn vị, thứ đã sai bốn lần ----
  ['ST12 và ST17 cùng là 4 thốn ngang → phải cùng khoảng cách đường giữa (chênh <1,5cm)',
    (H) => Math.abs(Math.abs(H.ST12.x) - Math.abs(H.ST17.x)) * CM < 1.5],
  ['ST17 (4 thốn) nằm trên ĐƯỜNG GIỮA ĐÒN (chênh <1,5cm)',
    (H, M) => Math.abs(Math.abs(H.ST17.x) - M.GIUA_DON.x) * CM < 1.5],
  ['KI27 ngực (2 thốn) nằm SÁT NGOÀI mép thân xương ức, không quá 3cm ra ngoài',
    (H, M) => Math.abs(H.KI27.x) > M.MEP_UC.x && (Math.abs(H.KI27.x) - M.MEP_UC.x) * CM < 3],
  ['ST25 (2 thốn) bằng nửa ST17 (4 thốn) — thang thốn ngang nhất quán',
    (H) => Math.abs(Math.abs(H.ST25.x) * 2 - Math.abs(H.ST17.x)) * CM < 2],
  // ---- lưng, hai đường Bàng Quang (đợt 7) ----
  ['không huyệt lưng nào nằm ĐÈ lên Đốc Mạch (|x| > 1cm)',
    (H) => { const c = []; for (let i = 11; i <= 30; i++) c.push('BL' + i); for (let i = 41; i <= 54; i++) c.push('BL' + i);
      return c.every(k => !H[k] || H[k].x === undefined || Math.abs(H[k].x) * CM > 1); }],
  ['đường NGOÀI luôn xa đường giữa hơn đường TRONG ở cùng mức đốt sống',
    (H) => [['BL12', 'BL41'], ['BL13', 'BL42'], ['BL14', 'BL43'], ['BL17', 'BL46'], ['BL21', 'BL50'], ['BL23', 'BL52']]
      .every(([tr, ng]) => !H[tr] || !H[ng] || Math.abs(H[ng].x) > Math.abs(H[tr].x))],
  ['đường TRONG BL11→BL30 hạ dần đều theo cột sống, không đảo chỗ',
    (H) => { const y = []; for (let i = 11; i <= 30; i++) if (H['BL' + i] && H['BL' + i].y !== undefined) y.push(H['BL' + i].y);
      return y.every((v, i) => i === 0 || v < y[i - 1]); }],
  ['BL11 (T1) nằm DƯỚI mỏm gai C7', (H, M) => H.BL11.y < M.C7.y],
  ['BL23 Thận Du ngang mỏm gai L2 (chênh <3cm)', (H, M) => Math.abs(H.BL23.y - M.L2.y) * CM < 3],
  ['SP15 (4 thốn bụng) và ST17 (4 thốn ngực) cùng thang (chênh <2,5cm)',
    (H) => Math.abs(Math.abs(H.SP15.x) - Math.abs(H.ST17.x)) * CM < 2.5],
  /* ---- đợt 10: LUẬT ĐỌC TỪ SƠ ĐỒ TOÀN ĐƯỜNG KINH (atlas trang 462–477) --------------------------
   * Đây là loại luật mà mô tả TỪNG HUYỆT không nói ra, chỉ nhìn sơ đồ cả kinh mới thấy: các đường
   * chạy song song nhau theo một THỨ TỰ CỐ ĐỊNH quanh chi và quanh thân. Sai thứ tự là sai chắc chắn. */
  ['mu bàn chân, ngoài→trong: BL › GB › ST › LR › SP (atlas tr.462)',
    (H) => [['BL65', 'GB42', 'ST43', 'LR3', 'SP3'], ['BL66', 'GB43', 'ST44', 'LR2', 'SP2'],
      ['BL67', 'GB44', 'ST45', 'LR1', 'SP1'], ['BL64', 'GB40', 'ST41', 'LR4', 'SP5']]
      .every(h => h.every((c, i) => i === 0 || (H[c] && H[h[i - 1]] && H[c].x < H[h[i - 1]].x)))],
  ['bàn tay, quay→trụ: LU › LI › PC › TE › SI (atlas tr.472/473)',
    (H) => { const v = ['LU10', 'LI4', 'PC8', 'TE3', 'SI4'].map(c => H[c] && H[c].x);
      return v.every((x, i) => i === 0 || (x !== undefined && x < v[i - 1])); }],
  ['bàn chân, mỗi đường giữ đúng bờ của mình: SP bờ trong · BL bờ ngoài (atlas tr.462)',
    (H) => Math.abs(H.SP3.x) < Math.abs(H.LR3.x) && Math.abs(H.LR3.x) < Math.abs(H.ST43.x)
        && Math.abs(H.ST43.x) < Math.abs(H.GB42.x) && Math.abs(H.GB42.x) < Math.abs(H.BL65.x)],
  ['cẳng chân ngoài: Đởm ở TRƯỚC, Bàng Quang ở SAU (atlas tr.475)',
    (H) => [['GB37', 'BL59'], ['GB38', 'BL58'], ['GB39', 'BL60']]
      .every(([g, b]) => H[g].z > H[b].z)],
  ['cẳng chân trong: Can bám MẶT TRONG xương chày, ở TRƯỚC Tỳ (atlas tr.474)',
    (H) => H.LR5.z > H.SP7.z && H.LR6.z > H.SP8.z],
  ['cẳng chân trong: Thận ở SAU cùng (sau cả Tỳ) (atlas tr.474)',
    (H) => H.KI7.z < H.SP6.z && H.KI9.z < H.SP7.z],
  ['thân trước, từ giữa ra: Nhâm › Thận › Vị › Tỳ (atlas tr.469)',
    (H) => [['CV21', 'KI26', 'ST13', 'SP20'], ['CV17', 'KI23', 'ST17', 'SP18'],
      ['CV12', 'KI19', 'ST21', 'SP16'], ['CV8', 'KI16', 'ST25', 'SP15'], ['CV4', 'KI13', 'ST28', 'SP14']]
      .every(h => h.every((c, i) => i === 0 || (H[c] && H[h[i - 1]] && Math.abs(H[c].x) > Math.abs(H[h[i - 1]].x) + 0.003)))],
  ['bốn cột dọc THÂN TRƯỚC phải THẲNG: mỗi cột chỉ một trị số ngang (lệch <0,6cm)',
    (H) => [[['KI11','KI12','KI13','KI14','KI15','KI16','KI17','KI18','KI19','KI20','KI21']],
      [['ST19','ST20','ST21','ST22','ST23','ST24','ST25','ST26','ST27','ST28','ST29','ST30']],
      [['SP13','SP14','SP15','SP16']], [['ST12','ST13','ST14','ST15','ST16','ST17','ST18']],
      [['KI22','KI23','KI24','KI25','KI26','KI27']], [['SP17','SP18','SP19','SP20']]]
      .every(([cs]) => { const v = cs.filter(c => H[c]).map(c => Math.abs(H[c].x));
        return (Math.max(...v) - Math.min(...v)) * CM < 0.6; })],
  ['hai cột dọc LƯNG phải THẲNG (lệch <0,6cm)',
    (H) => [Array.from({ length: 20 }, (_, i) => 'BL' + (11 + i)), Array.from({ length: 14 }, (_, i) => 'BL' + (41 + i))]
      .every(cs => { const v = cs.filter(c => H[c]).map(c => Math.abs(H[c].x));
        return (Math.max(...v) - Math.min(...v)) * CM < 0.6; })],
  ['SI15 cách Mạch Đốc ít nhất 2cm — không được đè lên đường giữa (atlas tr.470)',
    (H) => Math.abs(H.SI15.x) * CM > 2],
  /* Chỉ so ở những mức CÙNG CAO ĐỘ thật (nếp khuỷu, lằn cổ tay). Bản đầu tôi thêm cả LU6/PC4/HT4 —
   * sai, vì ba huyệt ấy ở ba độ cao khác nhau (7 · 5 · 1,5 thốn trên cổ tay), so ngang là vô nghĩa. */
  ['cánh tay trước, quay→trụ: LU › PC › HT (atlas tr.471)',
    (H) => [['LU5', 'PC3', 'HT3'], ['LU9', 'PC7', 'HT7']]
      .every(h => h.every((c, i) => i === 0 || (H[c] && H[h[i - 1]] && H[c].x < H[h[i - 1]].x)))],
  ['cánh tay sau, quay→trụ: LI › TE › SI (atlas tr.470)',
    (H) => [['LI11', 'TE10', 'SI8'], ['LI5', 'TE4', 'SI5'], ['LI1', 'TE1', 'SI1']]
      .every(h => h.every((c, i) => i === 0 || (H[c] && H[h[i - 1]] && H[c].x < H[h[i - 1]].x)))],
  /* Atlas vẽ các huyệt CÙNG KHE GIAN SƯỜN nằm trên MỘT HÀNG NGANG. Luật này bắt được cột Tỳ ngực
   * tụt gần 20cm — Thực Đậu SP17 từng nằm ngang RỐN thay vì ở khe gian sườn 5. */
  /* CHỈ ba cột trong (Nhâm 0 · Thận 2 · Vị 4). Cột Tỳ 6 thốn KHÔNG nằm cùng hàng: xương sườn dốc
   * xuống ra trước, nên càng ra ngoài thì cùng một khe càng CAO — đo được SP20 cao hơn ST15 2,8cm,
   * và atlas cũng vẽ Mi 20 nhích lên giữa Ni 25 và Ni 26 chứ không ngang hàng. Ràng chặt cả cột Tỳ
   * là bắt dữ liệu sai theo luật sai. */
  ['ba cột trong cùng khe gian sườn phải cùng hàng ngang (chênh <1,5cm) — atlas tr.469',
    (H) => [['ST18', 'KI22'], ['ST17', 'KI23', 'CV17'], ['ST16', 'KI24', 'CV18'],
      ['ST15', 'KI25', 'CV19'], ['ST14', 'KI26', 'CV20']]
      .every(h => { const v = h.filter(c => H[c]).map(c => H[c].y);
        return (Math.max(...v) - Math.min(...v)) * CM < 1.5; })],
  ['cột Tỳ 6 thốn RIDE CAO hơn cột Vị 4 thốn ở cùng khe (sườn dốc xuống ra trước)',
    (H) => H.SP17.y > H.ST18.y - 0.006 && H.SP20.y > H.ST15.y],
  ['kinh Thận vòng quanh mắt cá trong: KI3 (sau) → KI4 → KI5 → KI6 (dưới) hạ dần (atlas tr.477)',
    (H) => H.KI3.y > H.KI5.y && H.KI5.y > H.KI6.y - 0.006],
  // ---- đầu / mặt (đợt 9) — vùng làm sau cùng, cũng là vùng dễ sai đơn vị nhất ----
  ['đường BL trên đầu (1,5 thốn) luôn GẦN đường giữa hơn đường GB (2,25 thốn) ở cùng mức',
    (H) => [['BL4', 'GB15'], ['BL5', 'GB16'], ['BL6', 'GB17'], ['BL7', 'GB18'], ['BL9', 'GB19']]
      .every(([bl, gb]) => !H[bl] || !H[gb] || Math.abs(H[bl].x) < Math.abs(H[gb].x))],
  ['GB15→GB18 cùng nằm trên đường dọc đồng tử → |x| chênh nhau <1,2cm',
    (H) => { const v = ['GB15', 'GB16', 'GB17', 'GB18'].map(c => Math.abs(H[c].x));
      return (Math.max(...v) - Math.min(...v)) * CM < 1.2; }],
  ['BL4→BL8 cùng 1,5 thốn ngang → |x| chênh nhau <1,2cm',
    (H) => { const v = ['BL4', 'BL5', 'BL6', 'BL7', 'BL8'].map(c => Math.abs(H[c].x));
      return (Math.max(...v) - Math.min(...v)) * CM < 1.2; }],
  ['BL3→BL9 chạy từ TRƯỚC ra SAU trên vòm sọ, không đảo chỗ',
    (H) => { const z = []; for (let i = 3; i <= 9; i++) if (H['BL' + i]) z.push(H['BL' + i].z);
      return z.every((v, i) => i === 0 || v < z[i - 1]); }],
  ['GB15→GB19 chạy từ TRƯỚC ra SAU trên vòm sọ, không đảo chỗ',
    (H) => { const z = ['GB15', 'GB16', 'GB17', 'GB18', 'GB19'].map(c => H[c].z);
      return z.every((v, i) => i === 0 || v < z[i - 1]); }],
  ['GB4→GB5→GB6→GB7 lùi dần ra sau giữa Đầu Duy và Khúc Tấn',
    (H) => H.GB4.z > H.GB5.z && H.GB5.z > H.GB6.z && H.GB6.z > H.GB7.z],
  ['GB2 Thính Hội ở TRƯỚC lỗ tai, GB12 Hoàn Cốt ở SAU lỗ tai',
    (H, M) => H.GB2.z > M.LO_TAI.z && H.GB12.z < M.LO_TAI.z],
  /* GB8 và GB9 là NGOẠI LỆ của luật hạ dần: sách định nghĩa Thiên Xung GB9 lệch khỏi Suất Cốc GB8
   * 0,5 thốn RA SAU, không phải xuống dưới (WHO: "0,5 thốn sau GB8"; ảnh sách đo được hai chấm gần
   * ngang nhau, chỉ cách 47px ≈ 1,0cm theo phương ngang). Bản kiểm cũ đòi y giảm NGHIÊM NGẶT nên
   * báo lỗi ngay khi hai huyệt được đặt đúng cùng mức. Cho phép chênh tới 0,3cm ở riêng cặp này;
   * từ GB9 trở đi vẫn phải hạ dần thật. */
  ['GB8→GB12 vòng sau tai hạ dần (GB8/GB9 được phép ngang nhau)',
    (H) => { const y = ['GB9', 'GB10', 'GB11', 'GB12'].map(c => H[c].y);
      return H.GB8.y - H.GB9.y > -0.3 / 171.9 && y.every((v, i) => i === 0 || v < y[i - 1]); }],
  ['GB3 Thượng Quan ở TRÊN cung gò má, ST7 Hạ Quan ở DƯỚI — GB3 phải cao hơn ST7',
    (H) => H.GB3.y > H.ST7.y],
  ['BL1 (khoé mắt trong) gần đường giữa hơn TE23 (đầu ngoài lông mày)',
    (H) => Math.abs(H.BL1.x) < Math.abs(H.TE23.x)],
  ['BL2 (đầu trong lông mày) CAO hơn BL1 (khoé mắt trong)', (H) => H.BL2.y > H.BL1.y],
  ['GB14 trên lông mày, ST1 dưới ổ mắt: GB14 cao hơn BL1, ST1 thấp hơn BL1',
    (H) => H.GB14.y > H.BL1.y && H.ST1.y < H.BL1.y],
  ['GB1 Đồng Tử Liêu ở NGOÀI bờ ngoài ổ mắt', (H, M) => Math.abs(H.GB1.x) >= M.BO_NGOAI_O_MAT.x],
  ['mọi huyệt vùng đầu đều nằm TRÊN mỏm gai C7',
    (H, M) => ['BL1', 'BL2', 'BL3', 'BL4', 'BL5', 'BL6', 'BL7', 'BL8', 'BL9', 'GB1', 'GB2', 'GB3', 'GB4',
      'GB5', 'GB6', 'GB7', 'GB13', 'GB14', 'GB15', 'GB16', 'GB17', 'GB18', 'GB19', 'ST1', 'TE23']
      .every(c => !H[c] || H[c].y > M.C7.y)],
];

(async () => {
  const atlas = await loadAtlas({ layers: ['bone'] });
  const M = {};
  for (const [k, [re, pick]] of Object.entries(MOC)) {
    const h = atlas.search(re)[0];
    if (!h) { console.log('⚠ không thấy mốc', k); continue; }
    const raw = atlas.points(h.conceptId), arr = [];
    for (let i = 0; i < raw.length; i += 3) arr.push({ x: raw[i], y: raw[i + 1], z: raw[i + 2] });
    M[k] = pick(arr);
  }
  const w = {};
  new Function('window', fs.readFileSync(path.resolve(__dirname, '../../../frontend/public/kinhmach3d/data/acu-coords3d.js'), 'utf8'))(w);
  const H = w.ACU_COORDS3D.points;

  let dat = 0; const truot = [];
  for (const [mo, f] of LUAT) {
    let ok = false;
    try { ok = !!f(H, M); } catch { ok = null; }
    if (ok === null) { truot.push('⚠ ' + mo + ' (thiếu huyệt)'); continue; }
    if (ok) dat++; else truot.push('✗ ' + mo);
  }
  console.log(`QUAN HỆ GIẢI PHẪU: ${dat}/${LUAT.length} đạt`);
  for (const t of truot) console.log('   ' + t);
  process.exitCode = truot.length ? 1 : 0;
})();
