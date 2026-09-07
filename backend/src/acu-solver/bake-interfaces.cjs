/* bake-interfaces — Chạy QUY TẮC KHE cho toàn bộ huyệt, ghi kết quả ra interface-points.json.
 *
 * Vì sao bake sẵn: đọc mesh 23,5 MB + dò khe tốn vài giây, không thể làm trong mỗi request. Bake
 * một lần → solve-coords.cjs chỉ đọc bảng JSON nhẹ (giống cách who-ref.cjs là bảng tĩnh).
 *
 * Dùng:
 *   node backend/src/acu-solver/bake-interfaces.cjs              → bake tất cả + báo cáo
 *   node backend/src/acu-solver/bake-interfaces.cjs LU ST HT     → chỉ vài kinh (in chi tiết từng huyệt)
 *   node backend/src/acu-solver/bake-interfaces.cjs --safety     → kiểm thêm BA ĐIỀU CẤM (chậm hơn)
 *   node backend/src/acu-solver/bake-interfaces.cjs --dry        → chỉ báo cáo, không ghi file          */
const fs = require('fs');
const path = require('path');
const { loadAtlas } = require('./mesh-io.cjs');
const { refineByTissue } = require('./interface-solver.cjs');
const { parseVitri } = require('./parse-vitri.cjs');
const { probe } = require('./interface-geom.cjs');
const { safetyCheck } = require('./tissue-rules.cjs');
const { cunLenOf } = require('./interface-solver.cjs');
const { lateralRegion } = require('./model-frame.cjs');
const DATA = require('./vitri-data.json');

const OUT = path.join(__dirname, 'interface-points.json');
const OUT_WEB = path.resolve(__dirname, '../../../frontend/public/kinhmach3d/review-khe.json');
const COORDS = path.resolve(__dirname, '../../../frontend/public/kinhmach3d/data/acu-coords3d.js');
const H = 171.9;                           // chiều cao mesh (cm) — để in quãng dời ra cm cho dễ hình dung

function loadCoords() {
  const w = {};
  new Function('window', fs.readFileSync(COORDS, 'utf8'))(w);
  return w.ACU_COORDS3D.points;
}

(async () => {
  const args = process.argv.slice(2);
  const safety = args.includes('--safety');
  const dry = args.includes('--dry');
  const mers = args.filter(a => !a.startsWith('--'));

  // --safety cần cả lớp động mạch để kiểm điều cấm "không châm vào lòng mạch"
  const atlas = await loadAtlas(safety ? { layers: ['bone', 'muscle', 'connective', 'skin', 'arterial'] } : {});
  const P = loadCoords();
  const cache = new Map();
  const out = {}, stats = { xet: 0, apDung: 0, xacNhan: 0, doiCho: 0, mauThuan: 0, khongDu: 0, khoa: 0 };
  const byKind = {}, canSoat = [], warns = [], web = [];
  const cam = { cu: 0, moi: 0, cuChiTiet: [] };   // đối chiếu BA ĐIỀU CẤM: điểm cũ so với điểm sau khe

  for (const p of DATA.points) {
    if (!p.vitri) continue;
    if (mers.length && !mers.includes(p.mer)) continue;
    const cur = P[p.code];
    if (!cur || cur.x === undefined) continue;
    stats.xet++;

    const region = lateralRegion(parseVitri(p.vitri, { nameToCode: DATA.nameToCode }).anchor || '');
    const r = refineByTissue(atlas, {
      code: p.code, pos: { x: cur.x, y: cur.y, z: cur.z }, vitri: p.vitri, region,
      locked: cur.src === 'anchor' || cur.anchor === true,
    }, { cache, safety });

    if (r.applied) {
      stats.apDung++;
      const moved = r.slideCun >= 0.25;
      if (moved) stats.doiCho++; else stats.xacNhan++;
      byKind[r.kindLabel || 'sát bờ mô'] = (byKind[r.kindLabel || 'sát bờ mô'] || 0) + 1;
      out[p.code] = {
        x: r.pos.x, y: r.pos.y, z: r.pos.z,
        // toạ độ NGUỒN lúc bake: solve-coords đối chiếu với nó để biết bảng còn khớp lần giải này không
        from: { x: cur.x, y: cur.y, z: cur.z },
        kind: r.kind || 'sat-bo', tissues: r.tissues, conf: r.conf,
        gapCun: r.gapCun, slideCun: r.slideCun, slideCm: r.slideAbs != null ? +(r.slideAbs * H).toFixed(1) : null,
        ...(r.warns && r.warns.length ? { warns: r.warns } : {}),
      };
      if (r.warns && r.warns.length) warns.push(`${p.code} ${p.name || ''}: ${r.warns.join(' · ')}`);
      if (safety) {
        const w0 = safetyCheck(probe(atlas, { x: cur.x, y: cur.y, z: cur.z }, cunLenOf(region, cur)));
        if (w0.length) { cam.cu++; cam.cuChiTiet.push(`${p.code} ${p.name || ''}: ${w0.join(' · ')}`); }
        if (r.warns && r.warns.length) cam.moi++;
      }
    } else if (r.conf === 'mau-thuan' || r.conf === 'khe-khong-thay' || r.conf === 'mo-ho' || r.conf === 'pham-dieu-cam') {
      stats.mauThuan++;
      canSoat.push({ code: p.code, name: p.name, tissues: r.tissues, slideCun: r.slideCun, gapCun: r.gapCun, note: r.note,
        x: r.pos && r.pos.x, y: r.pos && r.pos.y, z: r.pos && r.pos.z });
    } else if (r.note && r.note.startsWith('huyệt đã chốt')) stats.khoa++;
    else stats.khongDu++;

    web.push({
      code: p.code, name: p.name || '', mer: p.mer, vitri: p.vitri,
      cur: { x: cur.x, y: cur.y, z: cur.z },
      khe: r.applied ? r.pos : (r.candPos || null),
      applied: !!r.applied, kind: r.kind || null, kindLabel: r.kindLabel || null,
      tissues: r.tissues || null, conf: r.conf || null,
      slideCun: r.slideCun ?? null, gapCun: r.gapCun ?? null,
      slideCm: r.slideAbs != null ? +(r.slideAbs * H * 100 / 100).toFixed(1) : null,
      depthCm: r.depthAbs != null ? +(r.depthAbs * H * 100 / 100).toFixed(1) : null,
      warns: r.warns && r.warns.length ? r.warns : null, note: r.note || null,
    });

    if (mers.length) {
      const tag = r.applied ? (r.slideCun >= 0.25 ? 'DỜI ' : 'XÁC NHẬN') : 'bỏ  ';
      console.log(`${p.code.padEnd(6)} ${(p.name || '').padEnd(15)} ${tag} ${String(r.conf || '—').padEnd(11)} ${(r.tissues || r.note || '').slice(0, 58).padEnd(58)}` +
        ` ${r.slideCun != null ? (r.slideCun + 'th ≈ ' + (r.slideCun * (region === 'torso' ? 3.1 : region === 'head' ? 3.0 : 1.9)).toFixed(1) + 'cm') : ''}`);
    }
  }

  /* LUẬT CHỐNG TRÙNG — hai huyệt khác nhau không thể nằm cùng một chỗ.
   * Ràng buộc "sát bờ" không nêu rõ phía (parser ra `bờ ?`) dễ hút hai huyệt lân cận về cùng một
   * điểm trên cùng khối xương: lần bake đầu đã tạo ST16=ST18 và HT7=TE4. Ở đây quét lại toàn bộ,
   * huyệt nào dời tới quá sát một huyệt khác thì RÚT LẠI, trả về cần soát. */
  const VA_CHAM = 0.0033;      // ≈ 0,25 thốn ≈ 0,57 cm — gần hơn mức này coi như chồng huyệt
  const finalPos = {};
  for (const [code, p] of Object.entries(P)) if (p.x !== undefined) finalPos[code] = { x: p.x, y: p.y, z: p.z };
  for (const [code, t] of Object.entries(out)) finalPos[code] = { x: t.x, y: t.y, z: t.z };
  let rutLai = 0;
  for (const [code, t] of Object.entries(out)) {
    if (!(t.slideCun >= 0.25)) continue;                    // chỉ huyệt bị DỜI mới có nguy cơ chồng
    for (const [other, q] of Object.entries(finalPos)) {
      if (other === code) continue;
      if (Math.hypot(t.x - q.x, t.y - q.y, t.z - q.z) >= VA_CHAM) continue;
      delete out[code];
      finalPos[code] = { x: t.from.x, y: t.from.y, z: t.from.z };
      canSoat.push({ code, name: '', tissues: t.tissues, slideCun: t.slideCun, gapCun: t.gapCun,
        note: `khe dời trùng chỗ huyệt ${other} — rút lại, cần soát` });
      const wi = web.find(x => x.code === code);
      if (wi) { wi.applied = false; wi.note = `khe dời trùng chỗ huyệt ${other} — rút lại, cần soát`; }
      stats.apDung--; stats.doiCho--; stats.mauThuan++; rutLai++;
      break;
    }
  }
  if (rutLai) console.log(`\nLuật chống trùng: rút lại ${rutLai} huyệt vì khe dời tới chỗ đã có huyệt khác.`);

  console.log(`\n————— QUY TẮC KHE MÔ: ${stats.xet} huyệt được xét —————`);
  console.log(`  ${stats.apDung} huyệt khe định vị được:  ${stats.xacNhan} XÁC NHẬN chỗ cũ (dời < 0,25 thốn) · ${stats.doiCho} DỜI vào khe`);
  console.log(`  ${stats.mauThuan} mâu thuẫn với cốt độ (giữ nguyên, cần soát) · ${stats.khoa} đã chốt bằng mốc · ${stats.khongDu} không đủ mô tả mô`);
  console.log('  Theo loại khe: ' + Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}: ${n}`).join(' · '));
  if (canSoat.length) {
    console.log(`\n— ${canSoat.length} huyệt CẦN SOÁT (khe và cốt độ lệch nhau nhiều) —`);
    for (const c of canSoat.slice(0, 25)) console.log(`  ${c.code.padEnd(6)} ${(c.name || '').padEnd(15)} ${(c.tissues || '').slice(0, 46).padEnd(46)} lệch ${c.slideCun}th`);
    if (canSoat.length > 25) console.log(`  … và ${canSoat.length - 25} huyệt nữa`);
  }
  if (safety) {
    console.log(`\n— BA ĐIỀU CẤM, đối chiếu trên ${stats.apDung} huyệt khe định vị được —`);
    console.log(`  toạ độ CŨ phạm: ${cam.cu} huyệt · sau khi áp khe: ${cam.moi} huyệt`);
    cam.cuChiTiet.slice(0, 12).forEach(x => console.log('   cũ · ' + x));
  }
  if (warns.length) {
    console.log(`\n— ${warns.length} huyệt phạm ĐIỀU CẤM (trong xương / giữa bụng cơ / trên lòng mạch) —`);
    warns.slice(0, 20).forEach(w => console.log('  ' + w));
  }

  if (!dry) {
    fs.writeFileSync(OUT, JSON.stringify({
      _doc: 'Sinh bởi bake-interfaces.cjs — toạ độ huyệt sau khi áp QUY TẮC KHE MÔ (tissue-rules.cjs). ' +
        'Chỉ chứa huyệt mà khe định vị được; solve-coords.cjs dùng làm nguồn thứ 4.',
      _generated: new Date().toISOString().slice(0, 10),
      points: out,
      // huyệt mà khe và cốt độ chỉ hai chỗ khác nhau: KHÔNG tự sửa, chỉ gắn cờ để người soát quyết
      review: Object.fromEntries(canSoat.map(c => [c.code, { tissues: c.tissues, slideCun: c.slideCun, gapCun: c.gapCun, note: c.note }])),
    }, null, 1) + '\n');
    console.log(`\nĐã ghi ${Object.keys(out).length} huyệt vào ${path.relative(process.cwd(), OUT)}`);
    fs.writeFileSync(OUT_WEB, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), H, items: web }) + '\n');
    console.log(`Đã ghi ${web.length} huyệt (kèm huyệt cần soát) vào ${path.relative(process.cwd(), OUT_WEB)} — mở review-khe.html để soát mắt.`);
  }
})();
