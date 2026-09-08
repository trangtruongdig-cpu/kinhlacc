/* _build-surface-cache — NƯỚNG SẴN kết quả "dán huyệt vào da".
 *
 * VÌ SAO: lần vào trang ĐẦU TIÊN mất ~29 giây, mà đo ra thì model chỉ chiếm ~8,5s — 20 giây còn lại
 * là khâu bắn tia raycast dán ~3000 điểm (chấm huyệt + điểm đường kinh) lên mặt da. Kết quả của khâu
 * ấy chỉ phụ thuộc TOẠ ĐỘ NGUỒN + MESH, cả hai đều cố định lúc build → tính sẵn một lần rồi ship
 * kèm, người dùng khỏi phải tính lại. (map3d.js vốn đã cache vào localStorage, nhưng chỉ cứu được
 * lần vào THỨ HAI; lần đầu — tức ấn tượng đầu — vẫn phải chờ đủ 20 giây.)
 *
 * CÁCH LÀM: mở đúng trang bằng trình duyệt thật, đợi cảnh sẵn sàng, rồi lấy chính chuỗi mà map3d.js
 * đã ghi vào localStorage. Không tự tính lại bằng thuật toán khác — như vậy không có đường nào lệch
 * với thứ trình duyệt thật sự dựng.
 *
 * KHOÁ PHIÊN BẢN: tệp sinh ra mang cùng thẻ 'v3' như _ptVerKey() trong map3d.js. Đổi phép đặt chấm
 * thì PHẢI tăng thẻ ở map3d.js (luật sẵn có) — lúc đó tệp nướng sẵn tự hết hiệu lực, không âm thầm
 * ghim chấm ở chỗ cũ.
 *
 * Dùng:  node frontend/public/kinhmach3d/data/_build-surface-cache.cjs [url]
 *        mặc định url = http://localhost:5173/xem-3d (dev server phải đang chạy)                    */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/truongtrang/.npm/_npx/705bc6b22212b352/node_modules/playwright');

const URL = process.argv[2] || 'http://localhost:5173/xem-3d';
const RA = path.join(__dirname, 'acu-surface-cache.js');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on('pageerror', e => console.log('  lỗi trang:', String(e).slice(0, 200)));
  // CHẶN chính tệp nướng sẵn của lần trước: nếu để nó nạp thì cache đầy sẵn, map3d.js không bắn tia
  // nào, không có gì mới để ghi ra — và ta sẽ nướng lại y nguyên bản cũ dù toạ độ huyệt đã đổi.
  await p.route('**/data/acu-surface-cache.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* tắt khi đang nướng lại */' }));
  const t0 = Date.now();
  await p.goto(URL, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 300; i++) {
    if (await p.evaluate(() => !!window.ACU_MODEL_READY).catch(() => false)) break;
    await p.waitForTimeout(500);
  }
  await p.waitForTimeout(4000);   // để _ptCacheSave() kịp chạy
  const ket = await p.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('acu3d_pts:') === 0) return { k, raw: localStorage.getItem(k) };
    }
    return null;
  });
  await b.close();
  if (!ket) { console.error('KHÔNG thấy cache trong localStorage — trang chưa dựng xong?'); process.exit(1); }

  const o = JSON.parse(ket.raw);
  const the = ket.k.split(':')[1];                       // 'v3'
  // làm tròn 6 chữ số: sai lệch < 2 phần triệu của chiều cao thân (~0,0003mm) — mắt và mọi phép kiểm
  // đều không thấy, mà tệp nhẹ đi khoảng một phần ba.
  const gon = {};
  for (const k in o) gon[k] = o[k].map(v => +v.toFixed(6));
  const js = '/* SINH TỰ ĐỘNG bởi _build-surface-cache.cjs — ĐỪNG sửa tay.\n'
    + ' * Kết quả bắn tia "dán huyệt vào da" nướng sẵn lúc build, để lần vào trang đầu tiên khỏi phải\n'
    + ' * tính lại (~20 giây). map3d.js chỉ dùng tệp này khi thẻ phiên bản khớp _ptVerKey(). */\n'
    + 'window.ACU_SURFACE_CACHE = { the: ' + JSON.stringify(the) + ', diem: '
    + JSON.stringify(gon) + ' };\n';
  fs.writeFileSync(RA, js);
  console.log(`✓ ${Object.keys(gon).length} điểm · ${(js.length / 1024).toFixed(0)}KB · thẻ ${the} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  console.log('  → ' + RA);
})();
