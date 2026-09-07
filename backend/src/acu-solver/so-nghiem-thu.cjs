/* so-nghiem-thu — SỔ NGHIỆM THU CHỐNG TRÔI.
 *
 * VẤN ĐỀ nó giải: bake.cjs sinh lại toàn bộ toạ độ mỗi lần chạy. Một huyệt đã dựng đúng bằng tay hôm
 * qua có thể trôi hôm nay (sửa mốc lân cận, đổi trọng số rải, tầng ép da kéo đi) mà KHÔNG có gì báo.
 * Mọi report khác chỉ chụp trạng thái HIỆN TẠI, không so với trạng thái ĐÃ ĐƯỢC CHẤP NHẬN. Nên tiến bộ
 * không tích luỹ: cứ sửa 20 huyệt lại làm trôi 15 huyệt khác rồi phát hiện lại từ đầu.
 *
 * Sổ này là bộ nhớ dài hạn của việc dựng huyệt. Ba hạng:
 *   A — ĐÃ NGHIỆM THU. Có bằng chứng NGOÀI engine (mốc xương đo trên atlas, ảnh sách, người xác nhận).
 *       Trôi quá 0,5cm = HỒI QUY, phải giải trình. Đây là cái không được phép hỏng.
 *   B — ĐANG THEO DÕI. Engine dựng, mọi phép kiểm sạch nhưng chưa ai đối chiếu nguồn ngoài.
 *       Trôi quá 2cm = cảnh báo, để mắt.
 *   C — CÒN NGỜ. Đã biết là đáng ngờ (cờ soát, ép da dời xa, hai nguồn sách cùng kêu). Không kiểm trôi
 *       — nó chính là DANH SÁCH VIỆC.
 *
 * LUẬT BẤT DI: lệnh --kiem KHÔNG BAO GIỜ tự sửa sổ. Muốn đổi giá trị chốt phải chạy --chot và nêu lý
 * do. Sổ tự cập nhật theo bake thì thành vô nghĩa — đó đúng là cái bẫy đang mắc phải.
 *
 * Dùng:
 *   node so-nghiem-thu.cjs                       kiểm trôi (mặc định), exit 1 nếu hồi quy hạng A
 *   node so-nghiem-thu.cjs --seed                dựng sổ lần đầu từ dữ liệu hiện có
 *   node so-nghiem-thu.cjs --chot LU9,LU5 --hang A --ly "dựng từ mỏm trâm quay"
 *   node so-nghiem-thu.cjs --ngo BL35 --ly "ép da dời 4,3cm"
 *   node so-nghiem-thu.cjs --ds A                liệt kê một hạng
 *   node so-nghiem-thu.cjs --viec                in danh sách việc (hạng C), nặng trước               */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const CM = 171.9;                              // 1 đơn vị chuẩn-hoá = chiều cao mesh, 171,9 cm
const SO = path.join(__dirname, 'huyet-chot.json');
const COORDS = path.join(ROOT, 'frontend/public/kinhmach3d/data/acu-coords3d.js');
const NGUONG = { A: 0.5, B: 2.0 };             // cm

const doc = f => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w; };
const diem = () => doc(COORDS).ACU_COORDS3D.points;
const khoang = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * CM;
const homNay = () => new Date().toISOString().slice(0, 10);
const doc_so = () => JSON.parse(fs.readFileSync(SO, 'utf8'));
const ghi_so = s => fs.writeFileSync(SO, JSON.stringify(s, null, 1) + '\n');
const argv = process.argv.slice(2);
const co = c => argv.includes('--' + c);
const val = c => { const i = argv.indexOf('--' + c); return i >= 0 ? argv[i + 1] : null; };

/* ───────────────────────── SEED — dựng sổ lần đầu ───────────────────────── */
function seed() {
  const P = diem();
  const { ANCHORS } = require('./anchors.cjs');
  const nghiNgo = new Map();   // code → tập lý do (khử trùng lặp; nhiều bộ kiểm chép lại cùng một câu)

  /* TIẾNG ỒN — cờ mà engine ĐÃ xử lý đúng, không sinh việc cho ai.
   * "bản Focks phân tích HỎNG (bắn lệch >8cm)" không phải bất đồng thật giữa hai atlas: không sách nào
   * đặt cùng một huyệt lệch nhau nửa mét. Đó là bản phân tích Focks bắn sang chi khác và engine đã loại
   * đúng. Để nó trong danh sách việc thì 40/70 mục là rác, và danh sách rác thì không ai đọc. */
  const ON = [/Focks phân tích HỎNG/i, /đã loại, giữ bản cũ/i];
  /* Việc phân theo NGUYÊN NHÂN, không theo huyệt lẻ: một nguyên nhân thường đẻ ra cả cụm huyệt sai,
   * và sửa gốc rẻ hơn sửa từng cái. Xem [[dung-theo-cum-lo-huyet-sai]]. */
  const LOAI = [
    [/TẦNG DA/i, 'da'],            // engine phải kéo huyệt về mặt da ⇒ mốc sinh ra nó sai độ sâu
    [/RẢI DỌC ĐƯỜNG/i, 'duong'],   // huyệt xa đường kinh của chính nó ⇒ sai mốc hoặc sai khung đường
    [/khe|bụng cơ|lòng xương/i, 'khe'],
    [/hai (bản|nguồn) sách/i, 'sach'],
    [/mô tả|không nêu phía/i, 'mota'],
  ];
  const loaiCua = t => (LOAI.find(([r]) => r.test(t)) || [, 'khac'])[1];

  const them = (c, ly) => {
    if (!ly) return;
    // bỏ tiền tố nhãn của từng bộ kiểm trước khi tách — không thì cùng một câu đếm thành hai
    const sach = String(ly).replace(/^(cờ soát khi bake|phạm điều cấm khe mô)\s*:\s*/i, '');
    for (const phan of sach.split(/\s*·\s*|\s*;\s*/)) {
      const t = phan.trim().replace(/^(cờ soát khi bake|phạm điều cấm khe mô)\s*:\s*/i, '');
      if (!t || ON.some(r => r.test(t))) continue;
      if (!nghiNgo.has(c)) nghiNgo.set(c, new Set());
      nghiNgo.get(c).add(t);
    }
  };

  // nguồn ngờ 1 — cờ do chính engine gắn khi bake
  for (const [c, p] of Object.entries(P)) {
    if (p.canhBao) them(c, 'phạm điều cấm khe mô: ' + p.canhBao);
    else if (p.canSoat) them(c, 'cờ soát khi bake: ' + p.canSoat);
  }
  // nguồn ngờ 2 — audit toàn diện
  try {
    for (const l of require('./audit-report.json').loi) them(l.code, l.mo);
  } catch { /* chưa chạy audit */ }
  // nguồn ngờ 3 — CẢ HAI bản sách cùng kêu lệch >1,5 thốn (một bản kêu thì chưa đủ chắc)
  try {
    for (const r of require('./kiem-tu-dien-report.json').rows) {
      const a = r.app, f = r.focks;
      if (a && f && a.lechThon > 1.5 && f.lechThon > 1.5)
        them(r.code, `hai nguồn sách cùng kêu lệch ${a.lechThon.toFixed(1)}/${f.lechThon.toFixed(1)} thốn`);
    }
  } catch { /* chưa chạy kiểm từ điển */ }

  const chot = {}, ngo = {};
  for (const [c, p] of Object.entries(P)) {
    if (p.x == null) continue;                                  // GV cực toạ độ — chưa qua engine
    if (nghiNgo.has(c)) {
      const ds = [...nghiNgo.get(c)];
      const loai = [...new Set(ds.map(loaiCua))];
      ngo[c] = { loai, ly: ds.join(' · '), ngay: homNay() };
      continue;
    }
    const cung = p.conf === 'mốc' || p.conf === 'khoá';
    chot[c] = {
      x: p.x, y: p.y, z: p.z,
      hang: cung ? 'A' : 'B',
      nguon: p.src || '?',
      ly: (ANCHORS[c] && ANCHORS[c].why) || `conf=${p.conf}, src=${p.src}`,
      ngay: homNay(),
    };
  }
  ghi_so({
    phienBan: 1,
    caoNguoi: CM,
    nguongCm: NGUONG,
    ghiChu: 'Hạng A = có bằng chứng NGOÀI engine, trôi >0,5cm là hồi quy. B = engine dựng, kiểm sạch. '
          + 'C (mục "ngo") = danh sách việc. --kiem không bao giờ tự sửa sổ này.',
    chot, ngo,
  });
  const nA = Object.values(chot).filter(v => v.hang === 'A').length;
  console.log(`Đã dựng sổ: hạng A ${nA} · hạng B ${Object.keys(chot).length - nA} · hạng C (còn ngờ) ${Object.keys(ngo).length}`);
  console.log('Ghi', SO);
}

/* ───────────────────────── KIỂM TRÔI ───────────────────────── */
function kiem() {
  const s = doc_so(), P = diem();
  const hoiQuy = [], canhBao = [], mat = [], moi = [];
  for (const [c, m] of Object.entries(s.chot)) {
    const p = P[c];
    if (!p || p.x == null) { mat.push(c); continue; }
    const d = khoang(m, p);
    const ng = s.nguongCm[m.hang] ?? NGUONG[m.hang];
    if (d > ng) (m.hang === 'A' ? hoiQuy : canhBao).push({ code: c, hang: m.hang, cm: +d.toFixed(2), nguong: ng, ly: m.ly });
  }
  for (const c of Object.keys(P)) if (P[c].x != null && !s.chot[c] && !s.ngo[c]) moi.push(c);

  hoiQuy.sort((a, b) => b.cm - a.cm); canhBao.sort((a, b) => b.cm - a.cm);
  console.log(`SỔ NGHIỆM THU — chốt ${Object.keys(s.chot).length} · còn ngờ ${Object.keys(s.ngo).length}`);
  if (mat.length) console.log(`\n✗ MẤT TOẠ ĐỘ (${mat.length}): ${mat.join(' ')}`);
  if (hoiQuy.length) {
    console.log(`\n✗ HỒI QUY HẠNG A — ${hoiQuy.length} huyệt đã nghiệm thu bị trôi quá ngưỡng:`);
    for (const r of hoiQuy) console.log(`   ${r.code.padEnd(6)} trôi ${String(r.cm).padStart(6)}cm (ngưỡng ${r.nguong})  ${r.ly.slice(0, 70)}`);
  }
  if (canhBao.length) {
    console.log(`\n! Cảnh báo hạng B — ${canhBao.length} huyệt theo dõi bị trôi:`);
    for (const r of canhBao.slice(0, 20)) console.log(`   ${r.code.padEnd(6)} trôi ${String(r.cm).padStart(6)}cm (ngưỡng ${r.nguong})`);
    if (canhBao.length > 20) console.log(`   … còn ${canhBao.length - 20} huyệt nữa (xem report)`);
  }
  if (moi.length) console.log(`\n· Huyệt CHƯA vào sổ (${moi.length}): ${moi.slice(0, 30).join(' ')}${moi.length > 30 ? ' …' : ''}`);
  if (!hoiQuy.length && !canhBao.length && !mat.length) console.log('\n✓ Không huyệt nào trôi khỏi giá trị đã nghiệm thu.');

  fs.writeFileSync(path.join(__dirname, 'so-nghiem-thu-report.json'),
    JSON.stringify({ ngay: homNay(), hoiQuy, canhBao, mat, moi }, null, 1));
  return hoiQuy.length ? 1 : 0;
}

/* ───────────────────────── CHỐT / NGỜ / LIỆT KÊ ───────────────────────── */
function chot() {
  const s = doc_so(), P = diem();
  const hang = (val('hang') || 'A').toUpperCase();
  const ly = val('ly');
  if (!ly) { console.error('Thiếu --ly "vì sao chốt". Chốt không lý do thì sổ mất giá trị làm chứng.'); process.exit(2); }
  const codes = (val('chot') || '').split(',').map(x => x.trim()).filter(Boolean);
  let n = 0;
  for (const c of codes) {
    const p = P[c];
    if (!p || p.x == null) { console.error(`  bỏ qua ${c}: không có toạ độ`); continue; }
    const cu = s.chot[c];
    if (cu) console.log(`  ${c}: ${cu.hang}→${hang}, dịch ${khoang(cu, p).toFixed(2)}cm so giá trị chốt cũ`);
    s.chot[c] = { x: p.x, y: p.y, z: p.z, hang, nguon: p.src || '?', ly, ngay: homNay() };
    delete s.ngo[c]; n++;
  }
  ghi_so(s);
  console.log(`Đã chốt ${n} huyệt vào hạng ${hang}.`);
}

function ngo() {
  const s = doc_so();
  const ly = val('ly') || 'chưa nêu lý do';
  for (const c of (val('ngo') || '').split(',').map(x => x.trim()).filter(Boolean)) {
    s.ngo[c] = { ly, ngay: homNay() }; delete s.chot[c];
  }
  ghi_so(s); console.log('Đã chuyển sang hạng C (còn ngờ).');
}

function lietKe() {
  const s = doc_so(), h = (val('ds') || '').toUpperCase();
  if (h === 'C') { for (const [c, m] of Object.entries(s.ngo)) console.log(c.padEnd(6), m.ly); return; }
  for (const [c, m] of Object.entries(s.chot))
    if (!h || m.hang === h) console.log(`${m.hang} ${c.padEnd(6)} ${m.ly.slice(0, 90)}`);
}

const TEN_LOAI = {
  da:    'TẦNG DA kéo về mặt da  → mốc sai ĐỘ SÂU',
  duong: 'XA ĐƯỜNG KINH của mình → sai mốc hoặc sai khung đường',
  khe:   'Nằm trong xương / giữa bụng cơ → sai mặt cắt',
  sach:  'Hai nguồn sách bất đồng → phải trọng tài bằng ảnh',
  mota:  'Câu sách không đủ nghĩa → cần đọc lại nguyên văn',
  khac:  'Khác',
};
function viec() {
  const s = doc_so();
  const ds = Object.entries(s.ngo).map(([c, m]) => {
    const ns = [...m.ly.matchAll(/([\d.]+)\s*cm/g)].map(x => +x[1]);
    return { c, cm: ns.length ? Math.max(...ns) : 0, loai: m.loai || ['khac'], ly: m.ly };
  }).sort((a, b) => b.cm - a.cm);
  const chi = val('loai');
  console.log(`DANH SÁCH VIỆC — ${ds.length} huyệt còn ngờ, gom theo NGUYÊN NHÂN:\n`);
  for (const k of Object.keys(TEN_LOAI)) {
    const nhom = ds.filter(r => r.loai.includes(k));
    if (!nhom.length || (chi && chi !== k)) continue;
    console.log(`── ${k} · ${TEN_LOAI[k]} — ${nhom.length} huyệt`);
    console.log('   ' + nhom.map(r => r.cm ? `${r.c}(${r.cm})` : r.c).join(' '));
    if (chi) for (const r of nhom) console.log(`   ${r.c.padEnd(6)} ${r.ly}`);
    console.log('');
  }
  console.log('Xem chi tiết một nhóm:  node so-nghiem-thu.cjs --viec --loai duong');
}

if (co('seed')) seed();
else if (co('chot')) chot();
else if (co('ngo')) ngo();
else if (co('ds')) lietKe();
else if (co('viec')) viec();
else process.exit(kiem());
