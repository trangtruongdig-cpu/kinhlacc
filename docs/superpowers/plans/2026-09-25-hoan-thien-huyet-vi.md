# Hoàn thiện huyệt vị — ảnh 3D + nội dung · Kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi huyệt chính kinh có bốn ảnh tự dựng từ mô hình 3D thay cho một ảnh webp 600px, và mục công dụng/giải phẫu/phối huyệt không còn ô trống trên 357 huyệt có mã quốc tế.

**Architecture:** Không viết engine 3D mới. `map3d.js` (3.166 dòng) đã có đủ nguyên liệu — `focusPoint()`, `highlightParts()`, `partsOfConcept()`, `exportPrintDiagram()`, `__ACU3D_PIXEL()`. Thêm MỘT khối móc `window.__XUONG` vào cuối IIFE, dựng một trang tĩnh chứa DOM tối thiểu cho engine, rồi lái bằng Playwright: nạp model một lần, chụp nhiều lượt. Nội dung bóc từ PDF Focks bằng bộ phân tích riêng, xuất hồ sơ chờ người duyệt trước khi ghi database.

**Tech Stack:** three.js (vendor sẵn trong repo) · Playwright 1.63 (Chromium đã cài) · sharp 0.35.4 (trong `cms/node_modules`) · PyMuPDF (`fitz`) · Postgres qua `pg` · Jest + ts-jest cho phần backend · EmDash CLI cho schema và media.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-09-25-hoan-thien-huyet-vi-anh-noi-dung-design.md`. Mọi quyết định trái spec phải sửa spec trước.
- **Ghi lô vào `ec_huyet_vi`** luôn theo trình tự: `ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER` → ghi → `ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER` → `node scripts-di-cu/dung-chi-muc.mjs huyet_vi`. Mẫu: `cms/scripts-di-cu/the-loai-huyet.mjs`.
- **Cột nội dung mới phải khai vào mảng `than`** của mục `huyet_vi` trong `cms/scripts-di-cu/dung-chi-muc.mjs:27`. Bỏ qua thì nội dung hiện trên trang nhưng tra cứu không bao giờ ra, không báo lỗi. Sửa xong nhắn phiên `kinhlacc-a5`.
- **Trường kiểu image** phải ghi đúng dạng `{ id, meta: { storageKey } }`. Chỉ ghi `id` thì ảnh 404 mà thẻ `<img>` vẫn render.
- **Trần dung lượng ảnh: 1,5GB.** Đo bằng `du -sh` trước khi nạp; vượt thì dừng và báo người dùng.
- **Không tô một cấu trúc giải phẫu mà `duoiDa[]` của huyệt đó không gọi tên.** Thà tô thiếu còn hơn tô sai.
- **Không suy diễn nội dung cho 702 huyệt không có mã quốc tế.** Ô trống để trống.
- **Không đụng** `frontend/public/kinhmach3d/data/acu-coords3d.js`, `meridian-paths.js` và pipeline bake — chỉ ĐỌC.
- **Không đụng** `cms/src/pages/kinh/`, `thu-vien/`, `bai-thuoc/`, `duoc-lieu/`, `ThuVienKhung.astro` — của phiên `kinhlacc-a5`.
- Tên tệp, hàm, biến **bằng tiếng Việt không dấu** theo lối đang dùng trong repo (`chupHuyet`, `dungKhung`, `traTen`).
- Chạy test backend: `npm test --prefix backend -- <tên>`. Chạy script di cư: `node scripts-di-cu/<tên>.mjs --thu` trước, không cờ `--thu` mới ghi thật.

## Cấu trúc tệp

**Thêm mới:**

| Tệp | Trách nhiệm |
|---|---|
| `backend/src/acu-solver/ten-giai-phau-map.json` | bảng đồng nghĩa: tên mô trong từ điển → mã FMA, hoặc `null` nếu mô hình không chứa |
| `backend/src/acu-solver/ten-giai-phau.cjs` | bộ tra tên → `{conceptId, cach}`; thuần hàm, không I/O ngoài đọc hai tệp dữ liệu |
| `backend/src/acu-solver/ten-giai-phau.spec.ts` | test cho bộ tra |
| `backend/src/acu-solver/khung-anh.json` | khung hình từng huyệt: vùng, hướng nhìn, bán kính; kèm bảng ngoại lệ |
| `frontend/public/kinhmach3d/xuong-anh.html` | trang xưởng: DOM tối thiểu cho `map3d.js`, `noindex` |
| `backend/src/acu-solver/chup-huyet.cjs` | lái Playwright, xuất PNG ra thư mục tạm |
| `cms/scripts-di-cu/anh-huyet-3d.mjs` | PNG → WebP, đo dung lượng, nạp thư viện ảnh, gắn vào huyệt |
| `cms/scripts-di-cu/boc-focks.mjs` | bóc PDF theo mã huyệt → hồ sơ JSON chờ duyệt |
| `cms/scripts-di-cu/nap-hoso-focks.mjs` | đọc hồ sơ ĐÃ DUYỆT → ghi database |
| `cms/scripts-di-cu/the-duong-kinh.mjs` | đẩy thẻ `nhom:"Đường Kinh"` vào `the_loai` |
| `cms/src/components/AnhHuyet.astro` | khối bốn ảnh trên trang huyệt |

**Sửa:**

| Tệp | Sửa gì |
|---|---|
| `frontend/public/kinhmach3d/map3d.js` | thêm khối `window.__XUONG` trước `})();` cuối tệp (dòng ~3166). Chỉ THÊM, không sửa mã cũ. |
| `cms/src/pages/huyet/[slug].astro` | gọi `AnhHuyet`, mục công dụng, huyệt trước/sau, breadcrumb kinh |
| `cms/src/components/KhungSeoYKhoa.astro` | thêm `d.pho_huyet` vào lời gọi `rutNguon()` |
| `cms/scripts-di-cu/dung-chi-muc.mjs` | thêm `"cong_dung_nhom"` vào mảng `than` của `huyet_vi` |

---

### Task 1: Bộ tra tên giải phẫu

Không có bộ này thì ảnh `gp` không biết tô cấu trúc nào. Tách riêng vì nó là hàm thuần, test được không cần trình duyệt.

**Files:**
- Create: `backend/src/acu-solver/ten-giai-phau.cjs`
- Create: `backend/src/acu-solver/ten-giai-phau-map.json`
- Test: `backend/src/acu-solver/ten-giai-phau.spec.ts`

**Interfaces:**
- Consumes: `frontend/public/kinhmach3d/data/human-atlas-vi.js` (`window.HUMAN_ATLAS_VI.concepts`: `{FMAxxxx: [tenViet, tenAnh]}`), `backend/src/acu-solver/giai-phau-data.json` (`.points[code].duoiDa[]`).
- Produces: `traTen(ten: string) => { conceptId: string, cach: 'thang'|'khuVuc'|'bang' } | null` và `traHuyet(code: string) => { toDuoc: {ten, conceptId}[], khongCo: string[] }`.

- [ ] **Step 1: Viết test trước**

```ts
// backend/src/acu-solver/ten-giai-phau.spec.ts
/* eslint-disable @typescript-eslint/no-var-requires */
const { traTen, traHuyet } = require('./ten-giai-phau.cjs');

describe('traTen', () => {
  it('khớp thẳng khi atlas có đúng tên đó', () => {
    // "Cơ ngực bé" là FMA13109 trong human-atlas-vi.js
    expect(traTen('cơ ngực bé')).toEqual({ conceptId: 'FMA13109', cach: 'thang' });
  });

  it('khớp qua tiền tố "Khu vực" khi atlas chỉ có dạng vùng', () => {
    // atlas không có "Cơ ngực lớn" trần, chỉ có "Khu vực cơ ngực lớn" = FMA34686
    expect(traTen('cơ ngực lớn')).toEqual({ conceptId: 'FMA34686', cach: 'khuVuc' });
  });

  it('trả null cho mô hình KHÔNG chứa, không được đoán bừa', () => {
    // mô hình là cơ–xương–mạch–thần kinh; không có cân, mạc, dây chằng
    expect(traTen('dây chằng vàng')).toBeNull();
    expect(traTen('mạc ngang')).toBeNull();
  });

  it('không nhận nhầm bên trái/phải', () => {
    const r = traTen('cơ ngực bé');
    expect(r).not.toBeNull();
    const ten = require('./ten-giai-phau.cjs').tenCuaConcept(r!.conceptId);
    expect(ten).not.toMatch(/phải|trái/);
  });
});

describe('traHuyet', () => {
  it('tách được cấu trúc tô được và cấu trúc mô hình không có', () => {
    const r = traHuyet('LU1'); // duoiDa: cơ ngực lớn, cơ ngực bé, cơ răng lớn, cơ gian sườn 2
    expect(r.toDuoc.length).toBeGreaterThan(0);
    // bất biến: mọi thứ tô được phải nằm trong duoiDa của chính huyệt đó
    const goc = require('./giai-phau-data.json').points['LU1'].duoiDa;
    for (const x of r.toDuoc) expect(goc).toContain(x.ten);
  });

  it('trả rỗng chứ không ném lỗi với huyệt không có mục giải phẫu', () => {
    expect(traHuyet('KHONG_CO_MA')).toEqual({ toDuoc: [], khongCo: [] });
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là HỎNG**

Chạy: `npm test --prefix backend -- ten-giai-phau`
Kỳ vọng: FAIL — `Cannot find module './ten-giai-phau.cjs'`

- [ ] **Step 3: Tạo bảng đồng nghĩa với 12 mục đầu**

Chỉ điền những tên mô hình CHẮC CHẮN không có (đặt `null`) và vài tên danh pháp cũ đã tra tay. Bảng này lớn dần ở Task 10.

```json
{
  "_ghiChu": "tên mô trong từ điển → mã FMA của atlas. null = mô hình KHÔNG chứa loại mô này (cân, mạc, dây chằng), cố tình để null chứ không phải chưa tra. Thêm mục mới thì phải mở trang 3D soi mắt xác nhận, đừng đoán theo tên.",
  "mạc ngang": null,
  "cân sọ": null,
  "cân ngực - thắt lưng của cơ lưng lớn": null,
  "cân cơ chéo lớn": null,
  "cân cơ chéo lớn của bụng": null,
  "dây chằng trên gai": null,
  "dây chằng gian gai": null,
  "dây chằng vàng": null,
  "ống sống": null
}
```

- [ ] **Step 4: Viết bộ tra**

```js
/* ten-giai-phau.cjs — tra tên mô trong từ điển sang mã FMA của atlas 3D.
 *
 * Vì sao cần: mục GIẢI PHẪU của từ điển dùng danh pháp cũ ("cơ ngang gai", "cơ lưng dài"),
 * còn atlas dùng FMA ("Khu vực cơ ngực lớn", "Phần đòn của cơ thang"). Tra thẳng theo tên
 * chỉ được 57/643 (đo 25/09/2026).
 *
 * BẤT BIẾN: thà trả null còn hơn trả nhầm. Ảnh tô sai một cơ là dạy sai giải phẫu. */
const fs = require('fs');
const path = require('path');

const GOC = path.resolve(__dirname, '../../..');
const BANG = require('./ten-giai-phau-map.json');

let _concepts = null;
function concepts() {
  if (_concepts) return _concepts;
  const w = {};
  const duong = path.join(GOC, 'frontend/public/kinhmach3d/data/human-atlas-vi.js');
  new Function('window', fs.readFileSync(duong, 'utf8'))(w);
  _concepts = w.HUMAN_ATLAS_VI.concepts;
  return _concepts;
}

const chuan = (s) =>
  String(s).toLowerCase().normalize('NFC').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();

// Bỏ mục có "phải"/"trái": đó là bản sao một bên, tô lên sẽ thành nửa người.
let _theoTen = null;
function theoTen() {
  if (_theoTen) return _theoTen;
  _theoTen = new Map();
  for (const [id, v] of Object.entries(concepts())) {
    const vi = chuan(v[0]);
    if (/\b(phải|trái)\b/.test(vi)) continue;
    if (!_theoTen.has(vi)) _theoTen.set(vi, id);
  }
  return _theoTen;
}

function tenCuaConcept(id) {
  const v = concepts()[id];
  return v ? v[0] : null;
}

function traTen(ten) {
  const k = chuan(ten);
  if (Object.prototype.hasOwnProperty.call(BANG, k)) {
    const id = BANG[k];
    return id ? { conceptId: id, cach: 'bang' } : null;
  }
  const m = theoTen();
  if (m.has(k)) return { conceptId: m.get(k), cach: 'thang' };
  if (m.has('khu vực ' + k)) return { conceptId: m.get('khu vực ' + k), cach: 'khuVuc' };
  return null;
}

let _gp = null;
function traHuyet(code) {
  if (!_gp) _gp = require('./giai-phau-data.json').points;
  const v = _gp[code];
  if (!v || !Array.isArray(v.duoiDa)) return { toDuoc: [], khongCo: [] };
  const toDuoc = [];
  const khongCo = [];
  for (const ten of v.duoiDa) {
    const r = traTen(ten);
    if (r) toDuoc.push({ ten, conceptId: r.conceptId });
    else khongCo.push(ten);
  }
  return { toDuoc, khongCo };
}

module.exports = { traTen, traHuyet, tenCuaConcept };
```

- [ ] **Step 5: Chạy test cho tới khi XANH**

Chạy: `npm test --prefix backend -- ten-giai-phau`
Kỳ vọng: PASS, 6 test.

- [ ] **Step 6: Đo lại độ phủ và ghi vào tệp bảng**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/backend/src/acu-solver && node -e "
const {traHuyet}=require('./ten-giai-phau.cjs');
const P=require('./giai-phau-data.json').points;
let co=0,du=0,n=0;
for(const c of Object.keys(P)){ const d=P[c].duoiDa; if(!d||!d.length) continue; n++;
  const r=traHuyet(c); if(r.toDuoc.length) co++; if(!r.khongCo.length) du++; }
console.log('huyệt có duoiDa:',n,'| tô được ≥1:',co,'| tô đủ:',du);
"
```

Kỳ vọng: in ra ba con số. Ghi đúng ba con số đó vào `_ghiChu` của `ten-giai-phau-map.json` kèm ngày, để lần sau biết bảng đã tốt lên bao nhiêu.

- [ ] **Step 7: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git add backend/src/acu-solver/ten-giai-phau.cjs backend/src/acu-solver/ten-giai-phau-map.json backend/src/acu-solver/ten-giai-phau.spec.ts
git commit -m "feat(acu): bộ tra tên giải phẫu sang mã FMA, thà null còn hơn nhầm"
```

---

### Task 2: Móc xưởng ảnh trong engine 3D

**Files:**
- Modify: `frontend/public/kinhmach3d/map3d.js` (thêm khối trước `})();` ở cuối tệp, sau khối `window.AcuMap = {...}`)

> **Đã thi công, mã dưới đây KHÔNG còn khớp bản thật.** Xem commit `3937f60` + `168e1c1`. Ba chỗ khác với mã trong kế hoạch: `partsOfConcept()` trả `{parts, kids}` nên phải gộp qua `.parts`; `dungCanh()`/`nhan()` có cổng `window.__XUONG_CHO_PHEP`; `nhan()` lọc huyệt bị che bằng `userData.normal` với ngưỡng 0,15. Thêm `traLai()` khôi phục `minDistance`/`near`/`far`.

**Interfaces:**
- Consumes: hàm nội bộ sẵn có `initScene()`, `focusPoint(code, opts)`, `highlightParts(parts)`, `partsOfConcept(conceptId)`, `clearHighlight()`, `applyLayers()`, `applyVisibility()`; biến `camera`, `controls`, `renderer`, `scene`, `dotMeshes`, `bodyHeight`, `layerState`, `hidden`, `focusMer`, `_acuRevealed`, `modelRoot`.
- Produces: `window.__XUONG` với `sanSang()`, `dungCanh(dat)`, `nhan()`; `dat` là `{ma, kieu, huong, banKinhCm, toSang}`.

- [ ] **Step 1: Viết khối móc**

Chèn NGAY TRƯỚC dòng `function focusFromHash()` ở cuối `map3d.js`:

```js
  /* ===== XƯỞNG ẢNH — chỉ dùng bởi xuong-anh.html + chup-huyet.cjs =====
   * Không phải API của app. Đặt ở đây thay vì viết engine thứ hai vì bài học "ba bản sao thuật
   * toán phải sửa đồng thời": một bản sao nữa là một chỗ nữa để lệch.
   * Mọi hàm đều ĐỒNG BỘ và không đụng history/hash — Playwright gọi xong là chụp được ngay. */
  window.__XUONG = {
    sanSang() { return !!modelRoot && _acuRevealed && dotMeshes.length > 0; },

    /** Đặt cảnh cho MỘT kiểu ảnh rồi trả về mô tả cảnh để bên gọi kiểm.
     * dat = { ma, kieu:'da'|'gp'|'lan'|'kinh', huong:'front'|'back'|'left'|'right',
     *         banKinhCm, toSang:[conceptId] } */
    dungCanh(dat) {
      initScene();
      const { ma, kieu } = dat;
      const cham = dotMeshes.find(d =>
        (d.userData.code || (d.userData.mer + d.userData.num)) === ma &&
        (d.userData.side || 'L') === 'L');
      if (!cham) return { loi: 'không thấy chấm ' + ma };

      clearHighlight();
      const mer = cham.userData.mer;

      // 1. Lớp giải phẫu. 'gp' bóc da để lộ cơ + xương; ba kiểu kia giữ da.
      layerState.skin   = (kieu === 'gp') ? 0 : 1;
      layerState.muscle = (kieu === 'gp') ? 1 : 0;
      layerState.bone   = (kieu === 'gp') ? 1 : 0;
      applyLayers();

      // 2. Đường kinh. Ảnh 'kinh' hiện cả đường; ba kiểu kia chỉ giữ đường của chính kinh đó.
      hidden.clear();
      focusMer = mer;
      applyVisibility();

      // 3. Tô sáng cấu trúc — CHỈ những conceptId bên gọi truyền vào (đã lọc ở ten-giai-phau.cjs).
      if (kieu === 'gp' && Array.isArray(dat.toSang) && dat.toSang.length) {
        const parts = [];
        for (const id of dat.toSang) { const p = partsOfConcept(id); if (p) parts.push(...p); }
        if (parts.length) highlightParts(parts);
      }

      // 4. Camera. Bán kính tính bằng cm → đơn vị world (mesh cao bodyHeight ứng 171,9cm).
      const CM = bodyHeight / 171.9;
      const r = (kieu === 'kinh' ? 95 : (dat.banKinhCm || 12)) * CM;
      const tam = cham.getWorldPosition(new THREE.Vector3());
      const HUONG = {
        front: new THREE.Vector3(0, 0, 1), back: new THREE.Vector3(0, 0, -1),
        left: new THREE.Vector3(-1, 0, 0), right: new THREE.Vector3(1, 0, 0),
      };
      const dir = HUONG[dat.huong] || HUONG.front;
      const xa = r / Math.sin(camera.fov * Math.PI / 360);
      controls.target.copy(tam);
      camera.position.copy(tam).addScaledVector(dir, xa);
      camera.near = Math.max(0.01, xa - r * 2); camera.far = xa + r * 4;
      camera.updateProjectionMatrix();
      controls.update();
      renderer.render(scene, camera);
      return { ma, kieu, mer, banKinhWorld: +r.toFixed(4), camXa: +xa.toFixed(4) };
    },

    /** Toạ độ MÀN HÌNH (px) của các chấm đang nhìn thấy, để lớp nhãn HTML đặt chữ đúng chỗ. */
    nhan(banKinhCm = 12) {
      const CM = bodyHeight / 171.9;
      const r = banKinhCm * CM;
      const tam = controls.target;
      const rect = renderer.domElement.getBoundingClientRect();
      const ra = [];
      for (const m of dotMeshes) {
        if ((m.userData.side || 'L') !== 'L') continue;
        const p = m.getWorldPosition(new THREE.Vector3());
        if (p.distanceTo(tam) > r) continue;
        const v = p.clone().project(camera);
        if (v.z >= 1) continue;
        ra.push({
          ma: m.userData.code || (m.userData.mer + m.userData.num),
          x: Math.round(rect.left + (v.x + 1) / 2 * rect.width),
          y: Math.round(rect.top + (1 - v.y) / 2 * rect.height),
        });
      }
      return ra;
    },
  };

```

- [ ] **Step 2: Kiểm tệp còn hợp lệ**

Chạy: `node --check /Users/truongtrang/Desktop/kinhlacc/frontend/public/kinhmach3d/map3d.js`
Kỳ vọng: không in gì (cú pháp đúng).

- [ ] **Step 3: Kiểm KHÔNG làm hỏng app đang chạy**

Chạy: `cd /Users/truongtrang/Desktop/kinhlacc && git diff --stat frontend/public/kinhmach3d/map3d.js`
Kỳ vọng: chỉ có dòng THÊM (`+`), không có dòng xoá. Nếu có dòng xoá thì đã sửa nhầm mã cũ — hoàn tác.

- [ ] **Step 4: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git add frontend/public/kinhmach3d/map3d.js
git commit -m "feat(3d): móc __XUONG cho xưởng ảnh, chỉ thêm không sửa mã cũ"
```

---

### Task 3: Trang xưởng

**Files:**
- Create: `frontend/public/kinhmach3d/xuong-anh.html`

**Interfaces:**
- Consumes: `window.__XUONG` (Task 2).
- Produces: trang chạy được ở `http://localhost:5173/kinhmach3d/xuong-anh.html`, `document.title` đổi thành `XUONG-SAN-SANG` khi engine dựng xong.

`map3d.js` là IIFE, thoát ngay nếu thiếu `#mapStage`, và gọi tiếp 20 phần tử khác. Trang xưởng cấp đủ các phần tử đó dưới dạng ẩn.

- [ ] **Step 1: Viết trang**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>Xưởng ảnh huyệt — nội bộ</title>
<meta name="robots" content="noindex,nofollow" />
<style>
  html, body { margin:0; padding:0; height:100%; background:#ffffff; overflow:hidden; }
  #mapStage { position:fixed; inset:0; }
  #mapStage canvas { display:block; }
  /* Engine đòi các nút/panel này tồn tại; xưởng không dùng nên giấu hẳn. */
  .an { position:absolute; left:-9999px; top:-9999px; width:1px; height:1px; overflow:hidden; }
  #lopNhan { position:fixed; inset:0; pointer-events:none; font:600 13px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif; }
  #lopNhan .nh { position:absolute; transform:translate(8px,-50%); color:#7a2e12; background:rgba(255,255,255,.86); border:1px solid #e6d3bf; border-radius:5px; padding:1px 5px; white-space:nowrap; }
  #lopNhan .nh.chinh { color:#fff; background:#b3401a; border-color:#b3401a; font-size:14px; }
</style>
</head>
<body>
<div id="mapStage"></div>
<div id="lopNhan"></div>
<div class="an">
  <div id="mapDrawer"><div id="drawerBody"></div><div id="drActions"></div>
    <button id="drCloseBtn"></button><button id="drClear"></button><button id="drIsolate"></button></div>
  <input id="mapSearch" /><span id="mapCount"></span><span id="mapCaptionText"></span>
  <button id="mapFlow"></button><button id="mapRotate"></button><button id="mapMirror"></button>
  <button id="mapReset"></button><button id="mapResetAll"></button><button id="mapSystems"></button>
  <button id="mapEdit"></button><button id="mspExplode"></button><span id="mspExplodeV"></span>
  <input id="mapPartSearch" /><div id="mapPartResults"></div><div id="view-meridian"></div>
</div>

<script src="vendor/three.min.js"></script>
<script src="vendor/OrbitControls.js"></script>
<script src="vendor/GLTFLoader.js"></script>
<script src="vendor/meshopt_decoder.js"></script>
<script src="data/acupoints.js"></script>
<script src="data/acu-index.js"></script>
<script src="data/acu-coords3d.js"></script>
<script src="data/meridian-paths.js"></script>
<script src="data/human-atlas-index.js"></script>
<script src="data/human-atlas-vi.js"></script>
<script src="map3d.js"></script>
<script>
// MỞ CỔNG XƯỞNG — không có dòng này thì __XUONG.dungCanh() và nhan() trơ hoàn toàn,
// trả {loi:'chưa mở cổng xưởng'} và không ảnh nào ra. Cổng có để móc không bao giờ
// sửa được trạng thái camera trên trang công khai.
window.__XUONG_CHO_PHEP = true;

// Báo hiệu cho Playwright: đổi title thay vì cờ toàn cục, vì title đọc được ngay cả khi
// script trong trang ném lỗi giữa chừng.
(function cho() {
  if (window.__XUONG && window.__XUONG.sanSang()) { document.title = 'XUONG-SAN-SANG'; return; }
  setTimeout(cho, 250);
})();

/** Vẽ lớp nhãn HTML — KHÔNG vẽ chữ trong WebGL (chữ có dấu trong texture rất xấu). */
window.__NHAN = function (ds, maChinh) {
  const lop = document.getElementById('lopNhan');
  lop.innerHTML = '';
  for (const x of ds) {
    const d = document.createElement('div');
    d.className = 'nh' + (x.ma === maChinh ? ' chinh' : '');
    d.style.left = x.x + 'px'; d.style.top = x.y + 'px';
    d.textContent = x.nhan || x.ma;
    lop.appendChild(d);
  }
};
</script>
</body>
</html>
```

- [ ] **Step 2: Mở thử bằng Playwright, chờ tín hiệu sẵn sàng**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/frontend && npm run dev &
sleep 8
cd /Users/truongtrang/Desktop/kinhlacc && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1200 } });
  const loi = [];
  p.on('pageerror', e => loi.push(String(e)));
  await p.goto('http://localhost:5173/kinhmach3d/xuong-anh.html');
  await p.waitForFunction(() => document.title === 'XUONG-SAN-SANG', { timeout: 180000 });
  console.log('sẵn sàng · lỗi JS:', loi.length ? loi : 'không');
  console.log(await p.evaluate(() => window.__ACU3D()));
  await b.close();
})();
"
```

Kỳ vọng: in `sẵn sàng · lỗi JS: không` và bảng `__ACU3D()` có `chAm` > 700, `kinhCoDuong` đủ 14 mã.

- [ ] **Step 3: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git add frontend/public/kinhmach3d/xuong-anh.html
git commit -m "feat(3d): trang xưởng ảnh, DOM tối thiểu cho engine"
```

---

### Task 4: Bảng khung hình

**Files:**
- Create: `backend/src/acu-solver/khung-anh.json`

**Interfaces:**
- Produces: `{ macDinh: {<mã kinh>: {huong}}, vung: {<tên vùng>: {huong, banKinhCm}}, ngoaiLe: {<mã huyệt>: {huong?, banKinhCm?}} }`

Khung suy từ vùng cơ thể của huyệt; chỗ nào lệch thì đè bằng `ngoaiLe`, **không rải điều kiện trong mã**.

- [ ] **Step 1: Viết bảng**

⚠️ **Hướng nhìn theo kinh chỉ là DỰ BỊ, không phải cách chọn chính.** Đo ở việc 3: `nhan()` lọc nhãn theo pháp tuyến mặt da so với hướng camera (ngưỡng 0,15), nên hướng cố định theo kinh làm một số huyệt ra **0 nhãn, kể cả nhãn của chính huyệt đang chụp** — tái hiện được với `LI1` ở `huong:'front'` (rỗng) so với `'back'` (4 nhãn). Và `dungCanh()` **vẫn báo thành công** trong cả hai trường hợp, nên không có tín hiệu nào cảnh báo ảnh sẽ trắng nhãn. Việc 5 phải chọn hướng theo **pháp tuyến thật của từng huyệt** (trường `n` trong `acu-coords3d.js`), lấy bảng này làm dự bị.

```json
{
  "_ghiChu": "Hướng nhìn mặc định theo kinh chép từ VIEW trong render-doi-chieu.cjs — chỉ dùng làm DỰ BỊ khi pháp tuyến huyệt không quyết được. banKinhCm là bán kính vùng nhìn quanh huyệt; ảnh 'kinh' bỏ qua bán kính này (dùng 95cm cố định trong __XUONG).",
  "macDinh": {
    "LU": { "huong": "front" }, "LI": { "huong": "front" }, "ST": { "huong": "front" },
    "SP": { "huong": "front" }, "HT": { "huong": "front" }, "SI": { "huong": "back" },
    "BL": { "huong": "back" },  "KI": { "huong": "front" }, "PC": { "huong": "front" },
    "TE": { "huong": "back" },  "GB": { "huong": "left" },  "LR": { "huong": "front" },
    "CV": { "huong": "front" }, "GV": { "huong": "back" }
  },
  "banKinh": { "da": 10, "gp": 10, "lan": 18 },
  "ngoaiLe": {}
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git add backend/src/acu-solver/khung-anh.json
git commit -m "feat(acu): bảng khung hình cho xưởng ảnh"
```

---

### Task 5: Bộ chụp Playwright — thí điểm kinh Phế

**Files:**
- Create: `backend/src/acu-solver/chup-huyet.cjs`

**Interfaces:**
- Consumes: `window.__XUONG` (Task 2), `traHuyet()` (Task 1), `khung-anh.json` (Task 4).
- Produces: PNG tại `<OUTDIR>/<ma>-<kieu>.png` và `<OUTDIR>/hoso.json` với `[{ma, kieu, tep, toSang:[ten], khongCo:[ten]}]`.

- [ ] **Step 1: Viết bộ chụp**

```js
/* chup-huyet.cjs — nạp model MỘT lần rồi chụp nhiều lượt.
 *
 *   node chup-huyet.cjs LU                 # chụp cả kinh Phế
 *   node chup-huyet.cjs LU9                # chụp một huyệt
 *   node chup-huyet.cjs --tat-ca           # cả 361 huyệt
 *
 * Yêu cầu: frontend dev server đang chạy ở cổng 5173.                                   */
const fs = require('fs');
const path = require('path');
// ⚠️ playwright KHÔNG có trong node_modules của repo (đo ở việc 3). Bản 1.63.0 nằm trong
// cache npx. Nạp theo NODE_PATH thay vì đường dẫn cứng vào node_modules của repo.
const { chromium } = require('playwright');
const { traHuyet } = require('./ten-giai-phau.cjs');

const KHUNG = require('./khung-anh.json');
// Sổ nghiệm thu toạ độ: hạng A = có bằng chứng ngoài engine, B = engine dựng. 17 huyệt hạng B
// phải nói rõ dưới ảnh chứ không giấu (spec, mục "Độ tin cậy toạ độ").
const CHOT = require('./huyet-chot.json').chot;
const GOC = path.resolve(__dirname, '../../..');
const OUTDIR = process.env.OUTDIR || path.join(GOC, '.anh-huyet');
const TRANG = process.env.TRANG || 'http://localhost:5173/kinhmach3d/xuong-anh.html';
const KIEU = ['da', 'gp', 'lan', 'kinh'];

/** Xếp bốn hướng nhìn theo độ khớp với pháp tuyến THẬT của huyệt, tốt nhất trước.
 *  Hướng dự bị (theo kinh) chèn lên đầu nếu có, nhưng KHÔNG loại ba hướng kia khỏi danh sách. */
function xepHuong(ma, duBi) {
  const n = (toaDo()[ma] || {}).n;
  // ⚠️ BẢNG NÀY PHẢI GIỐNG HỆT `HUONG` trong dungCanh() của map3d.js (dòng ~3244).
  // dungCanh đặt camera tại tam + HUONG[huong]*khoảngCách, nên muốn huyệt hướng về camera
  // thì pháp tuyến phải cùng chiều ĐÚNG véc-tơ đó. Đảo chiều left/right là xếp hạng ngược:
  // huyệt mặt bên chọn hướng đầu sai rồi rơi vào một hướng xiên vừa đủ qua ngưỡng 0,15,
  // ra ảnh nhìn tiếp tuyến. Cả kinh Đởm 44 huyệt nằm ở mặt bên.
  const TRUC = { front: [0, 0, 1], back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0] };
  let ds = Object.keys(TRUC);
  if (n) {
    ds = ds.sort((a, b) => cham(TRUC[b], n) - cham(TRUC[a], n));
  }
  if (duBi && ds[0] !== duBi) ds = [duBi, ...ds.filter(x => x !== duBi)];
  return ds;
}
const cham = (a, b) => a[0] * (b.x ?? b[0]) + a[1] * (b.y ?? b[1]) + a[2] * (b.z ?? b[2]);

let _toaDo = null;
function toaDo() {
  if (_toaDo) return _toaDo;
  const w = {};
  new Function('window', fs.readFileSync(
    path.join(GOC, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'utf8'))(w);
  _toaDo = w.ACU_COORDS3D.points;
  return _toaDo;
}

function danhSach(args) {
  const w = {};
  new Function('window', fs.readFileSync(
    path.join(GOC, 'frontend/public/kinhmach3d/data/acu-coords3d.js'), 'utf8'))(w);
  const tatCa = Object.keys(w.ACU_COORDS3D.points);
  if (args.includes('--tat-ca')) return tatCa;
  const loc = args.filter(a => !a.startsWith('--'));
  return tatCa.filter(c => loc.some(x => c === x || c.startsWith(x) && /^\d+$/.test(c.slice(x.length))));
}

(async () => {
  const ds = danhSach(process.argv.slice(2));
  if (!ds.length) { console.error('Không có huyệt nào khớp.'); process.exit(1); }
  console.log(`Chụp ${ds.length} huyệt × ${KIEU.length} kiểu = ${ds.length * KIEU.length} ảnh`);
  fs.mkdirSync(OUTDIR, { recursive: true });

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
  const loi = [];
  p.on('pageerror', e => loi.push(String(e)));
  await p.goto(TRANG);
  await p.waitForFunction(() => document.title === 'XUONG-SAN-SANG', { timeout: 180000 });
  console.log('Model đã nạp, bắt đầu chụp.');

  const hoso = [];
  for (const ma of ds) {
    const mer = ma.match(/^[A-Z]+/)[0];
    const gp = traHuyet(ma);
    for (const kieu of KIEU) {
      const nl = KHUNG.ngoaiLe[ma] || {};
      // HƯỚNG NHÌN: ưu tiên pháp tuyến THẬT của chính huyệt, xếp các hướng theo độ khớp
      // giảm dần. Hướng theo kinh chỉ là dự bị. Xem ghi chú ở khung-anh.json.
      const thuTuHuong = xepHuong(ma, nl.huong || (KHUNG.macDinh[mer] || {}).huong);
      const dat = {
        ma, kieu,
        huong: thuTuHuong[0],
        banKinhCm: nl.banKinhCm ?? KHUNG.banKinh[kieu] ?? 12,
        toSang: kieu === 'gp' ? gp.toDuoc.map(x => x.conceptId) : [],
      };
      let canh = await p.evaluate(d => window.__XUONG.dungCanh(d), dat);
      if (canh.loi) { console.error(`  ✗ ${ma}/${kieu}: ${canh.loi}`); continue; }

      // KIỂM NHÃN: dungCanh() báo thành công cả khi ảnh sẽ trắng nhãn. Phải tự đếm, và
      // đổi hướng nếu bằng 0 — nếu không thì một số huyệt (đầu ngón tay, ngón chân) ra
      // ảnh không có nhãn nào mà không lỗi gì.
      let soNhan = await p.evaluate((r) => window.__XUONG.nhan(r).length, dat.banKinhCm);
      for (let i = 1; i < thuTuHuong.length && soNhan === 0; i++) {
        dat.huong = thuTuHuong[i];
        canh = await p.evaluate(d => window.__XUONG.dungCanh(d), dat);
        soNhan = await p.evaluate((r) => window.__XUONG.nhan(r).length, dat.banKinhCm);
      }
      if (soNhan === 0) console.error(`  ⚠ ${ma}/${kieu}: không nhãn nào ở cả 4 hướng`);

      // Nhãn: ảnh 'lan' ghi tên mọi huyệt quanh đó; ba kiểu kia chỉ ghi huyệt chính.
      await p.evaluate(({ ma, kieu, r }) => {
        const ds = window.__XUONG.nhan(kieu === 'lan' ? r : 0.5);
        window.__NHAN(ds, ma);
      }, { ma, kieu, r: dat.banKinhCm });

      const tep = path.join(OUTDIR, `${ma}-${kieu}.png`);
      await p.screenshot({ path: tep });
      hoso.push({ ma, kieu, tep: path.basename(tep), toSang: gp.toDuoc.map(x => x.ten),
        khongCo: gp.khongCo, hang: (CHOT[ma] || {}).hang || null });
    }
    process.stdout.write(`  ${ma} ✓\n`);
  }

  fs.writeFileSync(path.join(OUTDIR, 'hoso.json'), JSON.stringify(hoso, null, 1));
  await b.close();
  console.log(`\nXong ${hoso.length} ảnh → ${OUTDIR}`);
  if (loi.length) console.error(`⚠ ${loi.length} lỗi JS trong trang:`, loi.slice(0, 3));
})();
```

- [ ] **Step 2: Chạy thử trên một huyệt**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/frontend && (npm run dev &) && sleep 8
cd /Users/truongtrang/Desktop/kinhlacc/backend/src/acu-solver && node chup-huyet.cjs LU9
```

Kỳ vọng: `Chụp 1 huyệt × 4 kiểu = 4 ảnh`, rồi `LU9 ✓`, không có dòng `✗`, không có `⚠ lỗi JS`, không có dòng `không nhãn nào ở cả 4 hướng`.

⚠️ Bọc toàn bộ thân `main()` trong `try/finally` và `await b.close()` ở `finally`. Vòng lặp báo sẵn sàng của trang xưởng không có giới hạn số lần thử, nên khi cảnh không bao giờ dựng xong (model 404, mất WebGL context) thì `waitForFunction` hết 180 giây rồi ném — không đóng trình duyệt ở `finally` là để lại tiến trình Chromium treo mãi.

- [ ] **Step 3: Nhìn bốn ảnh bằng mắt**

```bash
open /Users/truongtrang/Desktop/kinhlacc/.anh-huyet/LU9-da.png \
     /Users/truongtrang/Desktop/kinhlacc/.anh-huyet/LU9-gp.png \
     /Users/truongtrang/Desktop/kinhlacc/.anh-huyet/LU9-lan.png \
     /Users/truongtrang/Desktop/kinhlacc/.anh-huyet/LU9-kinh.png
```

Kỳ vọng, phải đạt cả bốn trước khi đi tiếp:
1. `LU9-da` thấy cổ tay, chấm huyệt nằm TRÊN da, nhãn "LU9" đọc được.
2. `LU9-gp` không còn da, thấy cơ + xương cổ tay.
3. `LU9-lan` thấy thêm PC7, HT7 quanh lằn cổ tay, mỗi chấm một nhãn.
4. `LU9-kinh` thấy cả người và đường kinh Phế chạy dọc tay.

Không đạt thì sửa `khung-anh.json` (hướng nhìn / bán kính) rồi chụp lại — **đừng sửa `chup-huyet.cjs`**.

- [ ] **Step 4: Chụp trọn kinh Phế và đo dung lượng**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/backend/src/acu-solver && node chup-huyet.cjs LU
du -sh /Users/truongtrang/Desktop/kinhlacc/.anh-huyet
ls /Users/truongtrang/Desktop/kinhlacc/.anh-huyet/*.png | wc -l
```

Kỳ vọng: 44 ảnh (11 huyệt × 4). Ghi lại con số `du -sh` — Task 6 dùng nó để ước lượng cho 361 huyệt.

- [ ] **Step 5: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
echo ".anh-huyet/" >> .gitignore
git add backend/src/acu-solver/chup-huyet.cjs .gitignore
git commit -m "feat(acu): bộ chụp ảnh huyệt bằng Playwright, nạp model một lần"
```

---

### Task 5b: Tự chụp lại khi toạ độ huyệt đổi

Người dùng chốt 26/09 sau khi xem 12 huyệt mẫu: *"mỗi khi sửa huyệt thì ảnh phải tự cập nhật lại vì ảnh này có 1 vài huyệt chưa chính xác"*. Ảnh là sản phẩm phái sinh của `acu-coords3d.js`; sửa toạ độ mà ảnh đứng im là trang dạy sai vị trí.

**Files:**
- Modify: `backend/src/acu-solver/chup-huyet.cjs`

**Interfaces:**
- Produces: cờ `--doi-moi` chỉ chụp lại ảnh đã cũ; mỗi dòng `hoso.json` mang thêm `dauVan`.

**Ba loại phụ thuộc, không được bỏ sót loại nào:**

| Ảnh | Cũ khi nào |
|---|---|
| `da`, `gp` của X | toạ độ hoặc pháp tuyến của **X** đổi |
| `lan` của Y | toạ độ của **bất kỳ huyệt nào trong bán kính** của Y đổi — kể cả huyệt khác kinh |
| `kinh` của X | toạ độ của **bất kỳ huyệt nào trên cùng đường kinh** đổi, hoặc `meridian-paths.js` đổi |

Dời một huyệt là làm cũ nhiều hơn bốn ảnh của chính nó. Bỏ tầng phụ thuộc thì ảnh `lan` của huyệt bên cạnh vẫn vẽ huyệt X ở chỗ cũ, sai mà không ai thấy.

**Vân tay phải gộp cả khung hình**, vì sửa `khung-anh.json` (hướng nhìn, bán kính) cũng làm ảnh cũ:
- `da`/`gp`: băm `{x, y, z, n}` của X (làm tròn 5 chữ số) + `{huong, banKinhCm}` đã dùng
- `lan`: băm danh sách đã sắp của `[mã, x, y, z]` mọi huyệt trong bán kính, kể cả chính nó, + `{huong, banKinhCm}`
- `kinh`: băm danh sách đã sắp của `[mã, x, y, z]` mọi huyệt cùng kinh + băm nội dung `meridian-paths.js` + `{huong}`

- [ ] **Step 1: Ghi vân tay khi chụp**

Tính vân tay theo ba công thức trên, ghi vào mỗi dòng `hoso.json` thành khoá `dauVan`. Dòng cũ chưa có `dauVan` thì coi như CŨ (phải chụp lại) — như vậy 48 ảnh đã chụp trước khi có khâu này sẽ được làm mới một lượt.

- [ ] **Step 2: Cờ `--doi-moi`**

`node chup-huyet.cjs --doi-moi` tính lại vân tay của mọi ảnh ĐANG CÓ trong hồ sơ, so với vân tay đã lưu, rồi chụp lại đúng những ảnh lệch. Ghép được với `--chi-dem` để chỉ liệt kê mà không chụp. In rõ mỗi ảnh cũ vì lý do gì (toạ độ chính nó / huyệt lân cận / cùng kinh / khung hình).

- [ ] **Step 3: Kiểm bằng cách sửa giả một toạ độ**

Sao lưu `acu-coords3d.js`, dịch **một** huyệt kinh Phế đi vài milimét, chạy `--doi-moi --chi-dem`, rồi **trả lại nguyên trạng ngay**. Kỳ vọng: liệt kê đúng 4 ảnh của huyệt đó, cộng ảnh `lan` của các huyệt quanh nó, cộng 11 ảnh `kinh` của cả kinh Phế. Chạy `--doi-moi --chi-dem` lần nữa sau khi trả lại nguyên trạng thì phải ra **rỗng**.

- [ ] **Step 4: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git add backend/src/acu-solver/chup-huyet.cjs
git commit -m "feat(acu): tự chụp lại ảnh khi toạ độ huyệt đổi, có tính cả ảnh phụ thuộc"
```

---

### Task 6: Chuyển WebP, đo dung lượng, nạp vào CMS

**Files:**
- Create: `cms/scripts-di-cu/anh-huyet-3d.mjs`

**Interfaces:**
- Consumes: `<GOC>/.anh-huyet/*.png` + `hoso.json` (Task 5).
- Produces: bốn trường ảnh trên `ec_huyet_vi`: `anh_da`, `anh_gp`, `anh_lan`, `anh_kinh`, mỗi trường dạng `{ id, meta: { storageKey } }`.

- [ ] **Step 1: Khai bốn trường ảnh**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms
for f in da:"Ảnh vị trí trên da" gp:"Ảnh trên giải phẫu" lan:"Ảnh huyệt lân cận" kinh:"Ảnh toàn đường kinh"; do
  node_modules/.bin/emdash schema add-field huyet_vi "anh_${f%%:*}" --type=image --label="${f#*:}"
done
node_modules/.bin/emdash schema add-field huyet_vi anh_ghi_chu --type=text --label="Ghi chú dưới ảnh"
node_modules/.bin/emdash schema get huyet_vi --json | grep -o '"slug":"anh_[a-z_]*"'
```

Kỳ vọng: in ra đủ năm dòng `anh_da`, `anh_gp`, `anh_lan`, `anh_kinh`, `anh_ghi_chu`.

`anh_ghi_chu` gánh hai yêu cầu của spec cùng lúc — liệt kê cấu trúc mô hình không tô được, và cảnh báo với 17 huyệt hạng B — nên không phải thêm hai cột.

- [ ] **Step 2: Viết bộ nạp — ĐO TRƯỚC, NẠP SAU**

```js
// anh-huyet-3d.mjs — PNG từ xưởng → WebP → thư viện ảnh CMS → gắn vào huyệt.
//
//   node scripts-di-cu/anh-huyet-3d.mjs --thu    # chỉ chuyển WebP và ĐO, không nạp không ghi
//   node scripts-di-cu/anh-huyet-3d.mjs
//
// Trần cứng 1,5GB (spec): vượt thì DỪNG, không nạp. Volume ./data/cms-uploads không có bản sao.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify, parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const chay = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const cmsDir = resolve(here, "..");
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const { Client } = require("pg");

const BIN = resolve(cmsDir, "node_modules/.bin/emdash");
const VAO = process.env.ANHDIR || resolve(goc, ".anh-huyet");
const RA = resolve(cmsDir, ".tam-anh/huyet3d");
const TRAN_MB = 1536;
const chiThu = process.argv.includes("--thu");
// 'kinh' là ảnh toàn thân nên cần to; ba kiểu kia đọc trên trang chỉ cần 800px.
const RONG = { kinh: 1400, da: 800, gp: 800, lan: 800 };

const hoso = JSON.parse(readFileSync(join(VAO, "hoso.json"), "utf8"));
console.log(`Hồ sơ: ${hoso.length} ảnh`);
mkdirSync(RA, { recursive: true });

let tong = 0;
const ds = [];
for (const x of hoso) {
  const vao = join(VAO, x.tep);
  if (!existsSync(vao)) { console.error(`  ✗ thiếu ${x.tep}`); continue; }
  const ra = join(RA, x.tep.replace(/\.png$/, ".webp"));
  await sharp(vao).resize({ width: RONG[x.kieu] || 800 }).webp({ quality: 80 }).toFile(ra);
  const kb = statSync(ra).size / 1024;
  tong += kb;
  ds.push({ ...x, webp: ra, kb });
}

const mb = tong / 1024;
const uocTatCa = (mb / hoso.length) * 361 * 4;
console.log(`\nĐÃ CHUYỂN ${ds.length} ảnh · ${mb.toFixed(1)}MB · trung bình ${(tong / ds.length).toFixed(0)}KB/ảnh`);
console.log(`ƯỚC CHO 361 HUYỆT × 4 KIỂU: ${uocTatCa.toFixed(0)}MB (trần ${TRAN_MB}MB)`);
if (uocTatCa > TRAN_MB) {
  console.error(`\n✗ VƯỢT TRẦN. Dừng lại, báo người dùng trước khi nạp.`);
  process.exit(1);
}
if (chiThu) { console.log("\n--thu: dừng ở đây, chưa nạp gì."); process.exit(0); }

const env = parseEnv(readFileSync(resolve(cmsDir, ".env"), "utf8"));
const kho = new Client({
  host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
  database: env.PGDATABASE,
  ssl: { ca: readFileSync(resolve(cmsDir, "aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
await kho.query("ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER").catch(() => {});

const NHAN = { da: "vị trí trên da", gp: "lớp giải phẫu", lan: "các huyệt lân cận", kinh: "trên đường kinh" };
let gan = 0, hong = 0;
for (const x of ds) {
  let j;
  try {
    const { stdout } = await chay(BIN, ["media", "upload", x.webp, "--alt", `Huyệt ${x.ma} — ${NHAN[x.kieu]}`],
      { cwd: cmsDir, maxBuffer: 4 << 20 });
    j = JSON.parse(stdout.slice(stdout.indexOf("{")));
  } catch { hong++; continue; }
  const r = await kho.query(
    `UPDATE ec_huyet_vi SET anh_${x.kieu} = $1
     WHERE upper(replace(ma_huyet,'-','')) IN ($2, $3) AND deleted_at IS NULL`,
    [JSON.stringify({ id: j.id, meta: { storageKey: j.storageKey || j.storage_key } }),
     x.ma, x.ma.replace(/^HT/, "HE").replace(/^KI/, "K")],
  );
  gan += r.rowCount;
}

// Ghi chú dưới ảnh: cấu trúc mô hình không có + cảnh báo huyệt hạng B. Gộp theo huyệt vì
// bốn kiểu ảnh của cùng một huyệt dùng chung một ghi chú.
const theoHuyet = new Map();
for (const x of ds) {
  if (!theoHuyet.has(x.ma)) theoHuyet.set(x.ma, { khongCo: x.khongCo || [], hang: x.hang });
}
for (const [ma, v] of theoHuyet) {
  const phan = [];
  if (v.khongCo.length)
    phan.push(`Mô hình 3D không chứa các cấu trúc sau nên ảnh không tô được, xem mục Giải Phẫu: ${v.khongCo.join(", ")}.`);
  if (v.hang === "B")
    phan.push("Vị trí huyệt này do engine dựng, chưa có bằng chứng đối chiếu ngoài engine.");
  if (!phan.length) continue;
  await kho.query(
    `UPDATE ec_huyet_vi SET anh_ghi_chu = $1
     WHERE upper(replace(ma_huyet,'-','')) IN ($2, $3) AND deleted_at IS NULL`,
    [phan.join(" "), ma, ma.replace(/^HT/, "HE").replace(/^KI/, "K")],
  );
}

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`\nGắn ${gan} ảnh${hong ? `, ${hong} ảnh nạp lỗi` : ""}.`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
await kho.end();
```

- [ ] **Step 3: Chạy chế độ đo trước**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node scripts-di-cu/anh-huyet-3d.mjs --thu
```

Kỳ vọng: in số MB thật cho 44 ảnh và ước cho 1.444 ảnh. **Nếu ước vượt 1.536MB thì dừng và báo người dùng**, đừng hạ chất lượng ảnh một mình.

- [ ] **Step 4: Nạp thật cho kinh Phế**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node scripts-di-cu/anh-huyet-3d.mjs && node scripts-di-cu/dung-chi-muc.mjs huyet_vi
```

Kỳ vọng: `Gắn 44 ảnh`.

- [ ] **Step 5: Kiểm ảnh KHÔNG vỡ**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node -e "
const {readFileSync}=require('fs'), {parseEnv}=require('util'), {Client}=require('pg');
const env=parseEnv(readFileSync('.env','utf8'));
(async()=>{
 const k=new Client({host:env.PGHOST,port:+env.PGPORT,user:env.PGUSER,password:env.PGPASSWORD,
   database:env.PGDATABASE,ssl:{ca:readFileSync('aiven-ca.pem','utf8'),rejectUnauthorized:true}});
 await k.connect();
 const r=await k.query(\"SELECT ma_huyet, anh_da->>'id' id, anh_da->'meta'->>'storageKey' sk FROM ec_huyet_vi WHERE anh_da IS NOT NULL LIMIT 5\");
 for(const x of r.rows) console.log(x.ma_huyet, x.id, x.sk ? 'CÓ storageKey' : '✗ THIẾU storageKey');
 await k.end();
})();
"
```

Kỳ vọng: 5 dòng, đều `CÓ storageKey`. Dòng nào thiếu là ảnh sẽ 404 trên trang dù thẻ `<img>` vẫn hiện.

- [ ] **Step 6: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git add cms/scripts-di-cu/anh-huyet-3d.mjs
git commit -m "feat(cms): nạp ảnh huyệt 3D, đo dung lượng trước khi nạp"
```

---

### Task 7: Trang huyệt hiện bốn ảnh (VIẾT LẠI 26/09)

> **Bản cũ của việc này đã sai đích.** Nó định sửa `cms/src/pages/huyet/[slug].astro` và thêm `cms/src/components/AnhHuyet.astro`. Tệp đó **không còn**: commit `bfe350e` (26/09 01:31) gỡ toàn bộ `cms/src/pages/{huyet,kinh,thu-vien,benh-hoc,cham-cuu-tri-benh,duoc-lieu,bai-thuoc,nguon}` theo lệnh người dùng — *"khôi phục nguyên bản TRƯỚC, cắm CMS SAU"*, vì hai bộ trang thư viện song song là rối. CMS nay chỉ là **kho dữ liệu**, không phục vụ trang cho khách.

**Đường hiện ảnh thật, sau khi đổi kiến trúc:**

```
ec_huyet_vi (CMS)
  → cms/scripts-di-cu/xuat-huyet-js.mjs        (phiên kinhlacc-12 giữ)
  → frontend/public/kinhmach3d/data/acupoints.js
  → frontend/scripts/dict-data.mjs
  → frontend/scripts/build-dict.mjs            (sinh HTML tĩnh)
  → /huyet/<slug>/
```

**Files:**
- Modify: `cms/scripts-di-cu/xuat-huyet-js.mjs` — thêm khoá `anh3d` vào bản sinh
- Modify: `frontend/scripts/build-dict.mjs` — vẽ khối bốn ảnh trên trang huyệt

**Interfaces:**
- Consumes: cột `anh_da`, `anh_gp`, `anh_lan`, `anh_kinh` (kiểu image), `anh_ghi_chu` (text) của `ec_huyet_vi`.
- Produces: khoá `anh3d` trong mỗi bản ghi `acupoints.js`, dạng `{ da, gp, lan, kinh, ghiChu }` hoặc `null`.

**Bốn điều đã thống nhất với phiên kinhlacc-12, không được đổi:**

1. **MỘT khoá `anh3d`, không phải bốn khoá phẳng**, và nó phải có mặt ở **cả 1.059 bản ghi** — giá trị `null` khi huyệt không có ảnh, y như cách khoá `image` là `null` chứ không bị bỏ. Luật khoá của tệp gốc rất chặt: 9 khoá luôn có ở mọi bản ghi, 6 khoá nữa có đủ cả sáu ở 357 huyệt có mã quốc tế. Bỏ khoá khi rỗng là đổi hình dạng bản ghi — đã từng làm lệch 386 bản ghi.
2. **URL ảnh là `/_emdash/api/media/file/<storageKey>`**, tuyệt đối KHÔNG phải `<id>`. Đo rồi: gọi bằng `storageKey` trả 200, gọi bằng `id` trần trả 404 **mà thẻ `<img>` vẫn render** — nhìn qua tưởng có ảnh. nginx đã đẩy `/_emdash/` sang CMS nên trang tĩnh gọi được, không cần cấu hình thêm.
3. **Cột kiểu image là TEXT chứa chuỗi JSON.** Truy vấn SQL thô ra CHUỖI chứ không ra object, phải `JSON.parse` rồi mới lấy `meta.storageKey`. Đây là chỗ đã làm mất ảnh một lần mà không báo lỗi.
4. **`anh_ghi_chu` là ghi chú nhỏ dưới khối ảnh**, không dựng thành mục riêng. Nội dung nó mang là lời thú nhận giới hạn (cấu trúc mô hình không chứa; 17 huyệt hạng B vị trí do engine dựng).

**Chốt an toàn đã có sẵn:** `node scripts-di-cu/xuat-huyet-js.mjs --kiem-goc` (commit `7df9640`) lấy bản gốc từ git rồi so **theo TẬP CON** — mọi khoá/giá trị gốc phải còn nguyên từng ký tự, khoá MỚI thì cho phép. **Phải chạy chốt này sau khi thêm `anh3d`.**

- [ ] **Step 1: Thêm `anh3d` vào bản sinh**

Thêm 5 cột vào truy vấn của `xuat-huyet-js.mjs`, dựng `anh3d` theo đúng bốn điều trên. Huyệt không có ảnh nào → `anh3d: null`.

- [ ] **Step 2: Chạy chốt gốc, phải ĐẠT**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node scripts-di-cu/xuat-huyet-js.mjs --kiem-goc
```

Kỳ vọng: ĐẠT. Chốt này chứng minh không đánh rơi khoá hay giá trị nào của bản gốc. Không đạt thì dừng, **đừng nới chốt**.

- [ ] **Step 3: Đếm trong bản sinh**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node -e "
const fs=require('fs'); const w={};
new Function('window', fs.readFileSync('frontend/public/kinhmach3d/data/acupoints.js','utf8'))(w);
const r=w.ACUPOINTS.records;
console.log('bản ghi:', r.length, '| có khoá anh3d:', r.filter(x=>'anh3d' in x).length,
  '| anh3d khác null:', r.filter(x=>x.anh3d).length);
const m=r.find(x=>x.anh3d); console.log('mẫu:', JSON.stringify(m.anh3d).slice(0,240));
"
```

Kỳ vọng: `bản ghi: 1059`, `có khoá anh3d: 1059`, `anh3d khác null:` bằng số huyệt đã nạp ảnh. URL trong mẫu phải bắt đầu bằng `/_emdash/api/media/file/`.

- [ ] **Step 4: Vẽ khối bốn ảnh trong `build-dict.mjs`**

Trên trang huyệt, khi `rec.anh3d` khác null thì vẽ lưới bốn ảnh có chú thích tiếng Việt: **Trên da** (huyệt nằm ở đâu trên bề mặt) · **Trên giải phẫu** (bóc da, thấy cơ và xương) · **Huyệt lân cận** (các huyệt gần, kể cả khác kinh) · **Toàn đường kinh** (vị trí trong cả đường kinh). Dưới lưới, nếu có `anh3d.ghiChu` thì in thành ghi chú nhỏ. Ảnh cũ (`rec.image`) chỉ dùng khi `anh3d` null — đó là 698 huyệt không có toạ độ 3D.

Giữ đúng lối trình bày của thư viện hiện có: CSS thuần, bảng màu nâu/kem đang dùng, `loading="lazy"`, có `width`/`height` để khỏi nhảy bố cục. Không thêm thư viện, không đổi giao diện chung.

**Thêm một việc đáng giá cho SEO:** hiện `ogImg` của trang huyệt rơi về `GENERIC_OG` (một ảnh sơ đồ kinh dùng chung cho mọi huyệt). Khi có `anh3d`, dùng `anh3d.kinh` làm ảnh OG — mỗi huyệt có ảnh chia sẻ riêng thay vì 1.059 trang dùng chung một ảnh.

- [ ] **Step 5: Dựng thật và xem bằng mắt**

Dựng lại trang tĩnh rồi mở `/huyet/thai-uyen/` xem: bốn ảnh có hiện đủ, có vỡ ảnh nào không, ghi chú có đúng chỗ. Kiểm thêm một huyệt KHÔNG có ảnh 3D (kỳ huyệt) để chắc là nó vẫn dùng ảnh cũ chứ không ra khung rỗng.

- [ ] **Step 6: Commit và nhắn kinhlacc-12**

Nhắn phiên đó biết đã sửa `xuat-huyet-js.mjs` và chốt `--kiem-goc` vẫn đạt.

---

### Task 8: Bóc PDF Focks thành hồ sơ chờ duyệt

**Files:**
- Create: `cms/scripts-di-cu/boc-focks.mjs`

**Interfaces:**
- Consumes: `~/Downloads/Huyet vi thuong dung.pdf` (516 trang).
- Produces: `cms/.tam-focks/hoso.json` dạng `[{ma, ten, trang, tacDung: string[], nguyenVan: string}]`.

Tiêu đề huyệt trong sách rất đều: `1. HUYỆT TRUNG PHỦ (中府zhongfu - Lu1)`, `2. HUYỆT VÂN MÔN (雲門yunmen - Lu 2)`, `1. HUYỆT THƯƠNG DƯƠNG (Shangyang 商陽 - Di/Li 1)`.

⚠️ Mã trong sách là ký hiệu Đức ghép Anh. **Luôn lấy vế TIẾNG ANH sau dấu `/`** — bỏ dấu xong "Dü" (Tiểu Trường) trùng "Du" (Đốc Mạch); đã dính một lần, 27 huyệt Đốc Mạch bị gán nhầm.

- [ ] **Step 1: Viết bộ bóc**

```js
// boc-focks.mjs — bóc mục "Tác dụng/chỉ định chính" của từng huyệt ra hồ sơ chờ NGƯỜI duyệt.
//
//   node scripts-di-cu/boc-focks.mjs --thu     # in thống kê, không ghi
//   node scripts-di-cu/boc-focks.mjs
//
// KHÔNG ghi thẳng vào database. Hồ sơ phải được người duyệt rồi mới nạp bằng nap-hoso-focks.mjs.

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cmsDir = resolve(here, "..");
const PDF = process.env.PDF || `${process.env.HOME}/Downloads/Huyet vi thuong dung.pdf`;
const RA = resolve(cmsDir, ".tam-focks");
const chiThu = process.argv.includes("--thu");

// Bóc từng trang bằng PyMuPDF (đã có sẵn: python3 -c "import fitz").
const py = `
import fitz, json, sys
d = fitz.open(sys.argv[1])
print(json.dumps([d[i].get_text() for i in range(d.page_count)]))
`;
const trang = JSON.parse(execFileSync("python3", ["-c", py, PDF], { maxBuffer: 256 << 20 }).toString());
console.log(`PDF: ${trang.length} trang`);

// "1. HUYỆT TRUNG PHỦ (中府zhongfu - Lu1)" → ten="TRUNG PHỦ", ma="LU1"
const TIEU_DE = /^\s*\d+\.\s*HUY[EỆ]T\s+([^(]+)\(([^)]*)\)/gm;
const DOI_MA = { LU: "LU", LI: "LI", ST: "ST", SP: "SP", HE: "HT", HT: "HT", SI: "SI",
  BL: "BL", KI: "KI", PC: "PC", TE: "TE", GB: "GB", LR: "LR", CV: "CV", GV: "GV" };

function docMa(trongNgoac) {
  // "中府zhongfu - Lu1" | "Shangyang 商陽 - Di/Li 1" | "Dü/SI 3"
  const m = /([A-Za-zÜü/]{2,7})\s*[-–]?\s*(\d{1,2})\s*$/.exec(trongNgoac.trim())
    || /([A-Za-zÜü/]{2,7})\s*(\d{1,2})/.exec(trongNgoac);
  if (!m) return null;
  // Ký hiệu Đức ghép Anh: LẤY VẾ SAU dấu '/' (vế tiếng Anh). "Dü/SI" → "SI", KHÔNG phải "DU".
  const ve = m[1].includes("/") ? m[1].split("/").pop() : m[1];
  const kinh = DOI_MA[ve.toUpperCase()];
  return kinh ? kinh + Number(m[2]) : null;
}

// Mục cần lấy: "d) Tác dụng/chỉ định chính" cho tới tiểu mục kế tiếp "e)" hoặc tiêu đề huyệt sau.
const TAC_DUNG = /[a-z]\)\s*T[áa]c d[uụ]ng[^\n]*\n([\s\S]*?)(?=\n\s*[a-z]\)|\n\s*\d+\.\s*HUY|$)/i;

const hoso = [];
for (let i = 0; i < trang.length; i++) {
  TIEU_DE.lastIndex = 0;
  let m;
  while ((m = TIEU_DE.exec(trang[i]))) {
    const ma = docMa(m[2]);
    if (!ma) continue;
    // Mục tác dụng có thể tràn sang trang sau → ghép hai trang rồi mới dò.
    const than = trang[i].slice(m.index) + "\n" + (trang[i + 1] || "");
    const t = TAC_DUNG.exec(than);
    if (!t) continue;
    const dong = t[1].split("\n").map((x) => x.replace(/^[●•\-\s]+/, "").trim())
      .filter((x) => x && !/^Ph[uù]ng V[aă]n Chi[eế]n|^HUY[EỆ]T V[iị]|^\d+$/.test(x));
    if (!dong.length) continue;
    if (!hoso.some((x) => x.ma === ma)) {
      hoso.push({ ma, ten: m[1].trim(), trang: i + 1, tacDung: dong, nguyenVan: t[1].trim() });
    }
  }
}

console.log(`Bóc được ${hoso.length} huyệt có mục tác dụng.`);
if (chiThu) {
  for (const x of hoso.slice(0, 5)) console.log(`  ${x.ma.padEnd(5)} tr${String(x.trang).padStart(3)}  ${x.tacDung[0].slice(0, 70)}`);
  const kinh = {};
  for (const x of hoso) { const k = x.ma.match(/^[A-Z]+/)[0]; kinh[k] = (kinh[k] || 0) + 1; }
  console.log("  theo kinh:", JSON.stringify(kinh));
  process.exit(0);
}

mkdirSync(RA, { recursive: true });
writeFileSync(resolve(RA, "hoso.json"), JSON.stringify(hoso, null, 1));
console.log(`→ ${resolve(RA, "hoso.json")}`);
console.log("Người duyệt đọc tệp này, sửa trường tacDung, rồi chạy nap-hoso-focks.mjs.");
```

- [ ] **Step 2: Chạy chế độ thử**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node scripts-di-cu/boc-focks.mjs --thu
```

Kỳ vọng: bóc được trên 300 huyệt; bảng `theo kinh` có đủ 14 mã; **`GV` phải có số dương** (nếu `GV` bằng 0 và `SI` gấp đôi bình thường thì đã dính đúng cái bẫy `Dü`/`Du` — sửa `docMa` trước khi đi tiếp).

- [ ] **Step 3: Đối chiếu một huyệt bằng mắt**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node scripts-di-cu/boc-focks.mjs && node -e "
const h=require('./.tam-focks/hoso.json');
const x=h.find(a=>a.ma==='LU9'); console.log(JSON.stringify(x,null,1));
"
```

Kỳ vọng: `ma: "LU9"`, `ten` là "THÁI UYÊN", `tacDung` là các dòng công dụng chứ không phải chữ ở chân trang.

- [ ] **Step 4: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
echo "cms/.tam-focks/" >> .gitignore
git add cms/scripts-di-cu/boc-focks.mjs .gitignore
git commit -m "feat(cms): bóc mục tác dụng của Focks ra hồ sơ chờ duyệt"
```

---

### Task 9: Trường công dụng + nạp hồ sơ đã duyệt + chỉ mục

**Files:**
- Create: `cms/scripts-di-cu/nap-hoso-focks.mjs`
- Modify: `cms/scripts-di-cu/dung-chi-muc.mjs:27`
- Modify: `cms/src/pages/huyet/[slug].astro`

**Interfaces:**
- Consumes: `cms/.tam-focks/hoso.json` (Task 8), đã được người duyệt.
- Produces: cột `cong_dung_nhom` (json) trên `ec_huyet_vi`, dạng `[{nhom, chiDinh}]`.

- [ ] **Step 1: Khai trường và khai chỉ mục**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms
node_modules/.bin/emdash schema add-field huyet_vi cong_dung_nhom --type=json --label="Công dụng theo nhóm chỉ định"
```

Rồi sửa `cms/scripts-di-cu/dung-chi-muc.mjs` dòng 27, thêm `"cong_dung_nhom"` vào cuối mảng:

```js
		than: ["y_nghia_ten", "dac_tinh", "vi_tri", "giai_phau", "tac_dung", "chu_tri", "cham_cuu", "xuat_xu", "pho_huyet", "ghi_chu", "tham_khao", "cong_dung_nhom"],
```

- [ ] **Step 2: Viết bộ nạp**

```js
// nap-hoso-focks.mjs — đọc hồ sơ ĐÃ DUYỆT rồi ghi vào cột cong_dung_nhom.
//
//   node scripts-di-cu/nap-hoso-focks.mjs --thu
//   node scripts-di-cu/nap-hoso-focks.mjs --kinh=LU     # chỉ một kinh (thí điểm)
//   node scripts-di-cu/nap-hoso-focks.mjs

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cmsDir = resolve(here, "..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const chiThu = process.argv.includes("--thu");
const locKinh = (process.argv.find((a) => a.startsWith("--kinh=")) || "").split("=")[1];

const hoso = JSON.parse(readFileSync(resolve(cmsDir, ".tam-focks/hoso.json"), "utf8"))
  .filter((x) => !locKinh || x.ma.startsWith(locKinh));

// "Giải nhiệt: viêm sưng vùng miệng và mặt, mắt đỏ" → { nhom, chiDinh }
const tach = (dong) => {
  const m = /^([^:]{2,40}):\s*(.+)$/.exec(dong);
  return m ? { nhom: m[1].trim(), chiDinh: m[2].trim() } : { nhom: "", chiDinh: dong };
};

const ghi = hoso.map((x) => ({ ma: x.ma, nhom: x.tacDung.map(tach).filter((n) => n.chiDinh) }))
  .filter((x) => x.nhom.length);
console.log(`Sẽ ghi ${ghi.length} huyệt${locKinh ? ` (kinh ${locKinh})` : ""}.`);
if (chiThu) {
  for (const x of ghi.slice(0, 3)) console.log(" ", x.ma, JSON.stringify(x.nhom.slice(0, 2)));
  process.exit(0);
}

const env = parseEnv(readFileSync(resolve(cmsDir, ".env"), "utf8"));
const kho = new Client({
  host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
  database: env.PGDATABASE,
  ssl: { ca: readFileSync(resolve(cmsDir, "aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
await kho.query("ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER").catch(() => {});

let n = 0;
for (const x of ghi) {
  const r = await kho.query(
    `UPDATE ec_huyet_vi SET cong_dung_nhom = $1
     WHERE upper(replace(ma_huyet,'-','')) IN ($2, $3) AND deleted_at IS NULL`,
    [JSON.stringify(x.nhom), x.ma, x.ma.replace(/^HT/, "HE").replace(/^KI/, "K")],
  );
  n += r.rowCount;
}

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`Ghi ${n} huyệt.`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
await kho.end();
```

- [ ] **Step 3: Nạp thí điểm kinh Phế**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms
node scripts-di-cu/nap-hoso-focks.mjs --kinh=LU --thu
node scripts-di-cu/nap-hoso-focks.mjs --kinh=LU
node scripts-di-cu/dung-chi-muc.mjs huyet_vi
```

Kỳ vọng: `Ghi 11 huyệt` (hoặc gần đó nếu sách thiếu vài mục).

- [ ] **Step 4: Hiện mục công dụng trên trang**

Trong `cms/src/pages/huyet/[slug].astro`, thêm ngay SAU khối `{coPhan.map(...)}`:

```astro
			{Array.isArray(d.cong_dung_nhom) && d.cong_dung_nhom.length > 0 && (
				<section class="dl-phan">
					<h2>Công Dụng Theo Nhóm Chỉ Định</h2>
					<dl class="hv-cdn">
						{d.cong_dung_nhom.map((x: any) => (
							<>
								{x.nhom && <dt>{x.nhom}</dt>}
								<dd>{x.chiDinh}</dd>
							</>
						))}
					</dl>
					<p class="hv-nguon-sach">
						Nhóm công dụng đối chiếu theo <em>Atlas of Acupuncture</em> (Claudia Focks),
						bản Việt hoá của Phùng Văn Chiến.
					</p>
				</section>
			)}
```

và thêm vào khối `<style>` cuối tệp:

```css
	.hv-cdn { display: grid; grid-template-columns: max-content 1fr; gap: 0.35rem 1.1rem; margin: 0; }
	.hv-cdn dt { font-weight: 700; color: var(--nau-700, #7a4e1d); }
	.hv-cdn dd { margin: 0; }
	.hv-nguon-sach { margin: 0.9rem 0 0; font-size: 0.8rem; color: var(--chu-nhat, #6b5f52); }
```

- [ ] **Step 5: Kiểm tra cứu TÌM RA nội dung mới**

Đây là phép bắt lỗi quên khai `dung-chi-muc.mjs`.

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && (npm run dev &) && sleep 6
# lấy một cụm CHỈ có trong cong_dung_nhom của một huyệt kinh Phế rồi tra
curl -s "http://localhost:4321/thu-vien/tra?q=<cụm-vừa-lấy>" | grep -c "huyet/"
```

Kỳ vọng: ≥ 1. Nếu 0 thì chưa khai cột vào `than` hoặc chưa chạy lại `dung-chi-muc.mjs`.

- [ ] **Step 6: Nhắn phiên a5 rằng đã sửa tệp dùng chung**

Gửi tin: đã thêm `"cong_dung_nhom"` vào mảng `than` của `huyet_vi` trong `dung-chi-muc.mjs`, đã chạy lại bộ dựng chỉ mục.

- [ ] **Step 7: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git add cms/scripts-di-cu/nap-hoso-focks.mjs cms/scripts-di-cu/dung-chi-muc.mjs cms/src/pages/huyet/\[slug\].astro
git commit -m "feat(cms): mục công dụng theo nhóm chỉ định, có khai vào chỉ mục tra cứu"
```

---

### Task 10: Nối huyệt với đường kinh

**Files:**
- Create: `cms/scripts-di-cu/the-duong-kinh.mjs`
- Modify: `cms/src/pages/huyet/[slug].astro`
- Modify: `cms/src/components/KhungSeoYKhoa.astro`

**Interfaces:**
- Consumes: `the_loai` (mảng `{ma, ten, nhom}` đã có), `ma_huyet`.
- Produces: thẻ `{ma: <slug kinh>, ten: <tên kinh>, nhom: "Đường Kinh"}` trong `the_loai`; trang huyệt có breadcrumb + huyệt trước/sau.

- [ ] **Step 1: Viết bộ gắn thẻ**

```js
// the-duong-kinh.mjs — thêm thẻ "Đường Kinh" vào the_loai để lọc được theo kinh.
//
// Vì sao không dùng taxonomy duong_kinh: tầng lọc của thư viện đọc từ CỘT (td_cau_hinh.cot_nhan),
// hiện chỉ khai `the_loai`. Đẩy thẻ vào cột thì không phải đụng tới bộ lọc.
//
//   node scripts-di-cu/the-duong-kinh.mjs --thu
//   node scripts-di-cu/the-duong-kinh.mjs

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cmsDir = resolve(here, "..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const chiThu = process.argv.includes("--thu");

// mã kinh → slug + tên, khớp với ec_kinh_mach đã di cư.
const KINH = {
  LU: ["phe", "Kinh Phế"], LI: ["dai-truong", "Kinh Đại Trường"], ST: ["vi", "Kinh Vị"],
  SP: ["ty", "Kinh Tỳ"], HT: ["tam", "Kinh Tâm"], SI: ["tieu-truong", "Kinh Tiểu Trường"],
  BL: ["bang-quang", "Kinh Bàng Quang"], KI: ["than", "Kinh Thận"], PC: ["tam-bao", "Kinh Tâm Bào"],
  TE: ["tam-tieu", "Kinh Tam Tiêu"], GB: ["dom", "Kinh Đởm"], LR: ["can", "Kinh Can"],
  CV: ["nham", "Mạch Nhâm"], GV: ["doc", "Mạch Đốc"],
};

const env = parseEnv(readFileSync(resolve(cmsDir, ".env"), "utf8"));
const kho = new Client({
  host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
  database: env.PGDATABASE,
  ssl: { ca: readFileSync(resolve(cmsDir, "aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

const rows = (await kho.query(
  "SELECT slug, ma_huyet, the_loai FROM ec_huyet_vi WHERE ma_huyet IS NOT NULL AND deleted_at IS NULL")).rows;

const chuan = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "")
  .replace(/^HE/, "HT").replace(/^K(\d)/, "KI$1");

const viec = [];
for (const r of rows) {
  const ma = chuan(r.ma_huyet);
  const k = KINH[(ma.match(/^[A-Z]+/) || [])[0]];
  if (!k) continue;
  const cu = Array.isArray(r.the_loai) ? r.the_loai : [];
  if (cu.some((t) => t.nhom === "Đường Kinh")) continue;      // chạy lại không nhân đôi thẻ
  viec.push({ slug: r.slug, the: [...cu, { ma: k[0], ten: k[1], nhom: "Đường Kinh" }] });
}

console.log(`Gắn thẻ đường kinh cho ${viec.length}/${rows.length} huyệt.`);
if (chiThu) { console.log(" ", JSON.stringify(viec[0])); await kho.end(); process.exit(0); }

await kho.query("ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER").catch(() => {});
let n = 0;
for (const v of viec) {
  const r = await kho.query("UPDATE ec_huyet_vi SET the_loai = $1 WHERE slug = $2 AND deleted_at IS NULL",
    [JSON.stringify(v.the), v.slug]);
  n += r.rowCount;
}
await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`Ghi ${n} huyệt.\n→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs huyet_vi`);
await kho.end();
```

- [ ] **Step 2: Chạy**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms
node scripts-di-cu/the-duong-kinh.mjs --thu
node scripts-di-cu/the-duong-kinh.mjs
node scripts-di-cu/dung-chi-muc.mjs huyet_vi
```

Kỳ vọng: `Gắn thẻ đường kinh cho 357/357 huyệt`.

- [ ] **Step 3: Thêm breadcrumb và huyệt trước/sau**

Trong `cms/src/pages/huyet/[slug].astro`, thêm vào phần frontmatter (sau `const anh = ...`):

```ts
// Đường kinh + huyệt liền kề — suy từ mã, không lưu cột nào.
const KINH: Record<string, [string, string]> = {
	LU: ["phe", "Kinh Phế"], LI: ["dai-truong", "Kinh Đại Trường"], ST: ["vi", "Kinh Vị"],
	SP: ["ty", "Kinh Tỳ"], HT: ["tam", "Kinh Tâm"], SI: ["tieu-truong", "Kinh Tiểu Trường"],
	BL: ["bang-quang", "Kinh Bàng Quang"], KI: ["than", "Kinh Thận"], PC: ["tam-bao", "Kinh Tâm Bào"],
	TE: ["tam-tieu", "Kinh Tam Tiêu"], GB: ["dom", "Kinh Đởm"], LR: ["can", "Kinh Can"],
	CV: ["nham", "Mạch Nhâm"], GV: ["doc", "Mạch Đốc"],
};
const maChuan = String(d.ma_huyet || "").toUpperCase().replace(/[^A-Z0-9]/g, "")
	.replace(/^HE/, "HT").replace(/^K(\d)/, "KI$1");
const merMa = (maChuan.match(/^[A-Z]+/) || [])[0];
const soTT = Number(maChuan.slice(merMa?.length || 0)) || 0;
const kinh = merMa && KINH[merMa] ? { slug: KINH[merMa][0], ten: KINH[merMa][1] } : null;

// Huyệt liền kề: tra thẳng trong cùng collection theo mã.
let truoc: any = null, sau: any = null;
if (kinh && soTT) {
	const { entries } = await getEmDashCollection("huyet_vi", { limit: 1100 });
	const theoMa = new Map(
		entries.filter((e: any) => e.data.ma_huyet).map((e: any) => [
			String(e.data.ma_huyet).toUpperCase().replace(/[^A-Z0-9]/g, "")
				.replace(/^HE/, "HT").replace(/^K(\d)/, "KI$1"),
			{ slug: e.slug ?? e.id, ten: e.data.title },
		]),
	);
	truoc = theoMa.get(merMa + (soTT - 1)) || null;
	sau = theoMa.get(merMa + (soTT + 1)) || null;
}
```

và thêm `getEmDashCollection` vào dòng import `emdash`:

```astro
import { getEmDashEntry, getEmDashCollection } from "emdash";
```

Rồi thêm NGAY TRƯỚC `<h1>{d.title}</h1>`:

```astro
			{kinh && (
				<nav class="hv-vet" aria-label="Đường dẫn">
					<a href="/thu-vien/">Thư Viện</a> ›
					<a href={`/kinh/${kinh.slug}/`}>{kinh.ten}</a> ›
					<span>{d.title}</span>
				</nav>
			)}
```

và NGAY SAU khối `Tham Khảo` (trước `</KhungSeoYKhoa>`):

```astro
			{(truoc || sau) && (
				<nav class="hv-ke" aria-label="Huyệt liền kề">
					{truoc ? <a href={`/huyet/${truoc.slug}/`}>← {truoc.ten}</a> : <span />}
					{kinh && <a class="hv-ke-kinh" href={`/kinh/${kinh.slug}/`}>Tất cả huyệt {kinh.ten}</a>}
					{sau ? <a href={`/huyet/${sau.slug}/`}>{sau.ten} →</a> : <span />}
				</nav>
			)}
```

và vào `<style>`:

```css
	.hv-vet { font-size: 0.84rem; margin: 0 0 0.8rem; color: var(--chu-nhat, #6b5f52); }
	.hv-ke { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
		margin: 2rem 0 0; padding-top: 1rem; border-top: 1px solid var(--nau-100, #f1e7d6); font-size: 0.9rem; }
	.hv-ke-kinh { color: var(--chu-nhat, #6b5f52); }
```

- [ ] **Step 4: Nối trích dẫn trong phối huyệt**

⚠️ **Bẫy im lặng đã đo được:** `rutNguon()` mở đầu bằng `if (!Array.isArray(pt)) continue;` (`cms/src/utils/trich-dan.ts:65`). `pho_huyet`, `ghi_chu`, `tham_khao` là cột **text thuần**, không phải Portable Text — truyền thẳng vào thì **bị bỏ qua, không lỗi, không trích dẫn nào**. (`d.tham_khao` đang được truyền sẵn ở dòng 41 và cũng đang rơi vào đúng lỗ này.) Phải bọc thành khối trước.

Trong `cms/src/components/KhungSeoYKhoa.astro`, chèn NGAY TRƯỚC `const nguon = rutNguon(` (dòng 40):

```ts
// Ba trường này là text thuần; rutNguon chỉ đọc Portable Text nên phải bọc lại,
// không thì trích dẫn trong phối huyệt bị bỏ qua mà không báo gì.
const bocChu = (s: any) =>
	s ? String(s).split(/\n+/).filter(Boolean).map((t, i) => ({
		_type: "block", _key: "bc" + i, children: [{ _type: "span", text: t }],
	})) : null;
```

rồi thay TRỌN lời gọi:

```ts
const nguon = rutNguon(
	d.dai_cuong, d.nguyen_nhan, d.chan_doan, d.dieu_tri, d.benh_an, d.tham_khao, d.trieu_chung,
	// các phần riêng của huyệt
	d.y_nghia_ten, d.dac_tinh, d.vi_tri, d.giai_phau, d.tac_dung, d.chu_tri, d.cham_cuu, d.xuat_xu,
	// text thuần — phải bọc, xem ghi chú trên
	bocChu(d.pho_huyet), bocChu(d.ghi_chu), bocChu(d.tham_khao),
);
```

**Không viết bộ dò thứ hai** — bộ lọc nhiễu trong `utils/trich-dan.ts` (`laNguon()`) đã chặn danh sách vị thuốc bằng luật "từ ba dấu phẩy trở lên thì không phải tên sách"; dựng lại từ đầu sẽ mất phần đó.

- [ ] **Step 5: Kiểm trên trang thật**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && (npm run dev &) && sleep 6
curl -s http://localhost:4321/huyet/thai-uyen/ | grep -oE 'href="/kinh/phe/"|href="/huyet/[a-z-]+/"|href="/nguon/[a-z-]+/"' | sort | uniq -c
```

Kỳ vọng: có `/kinh/phe/`, có ít nhất hai `/huyet/…` (trước và sau), và **có ít nhất một `/nguon/…`** — Thái Uyên trong phối huyệt nhắc Giáp Ất Kinh, Thiên Kim Phương, Châm Cứu Đại Thành.

- [ ] **Step 6: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git add cms/scripts-di-cu/the-duong-kinh.mjs cms/src/pages/huyet/\[slug\].astro cms/src/components/KhungSeoYKhoa.astro
git commit -m "feat(cms): nối huyệt với đường kinh — thẻ lọc, breadcrumb, huyệt liền kề, trích dẫn phối huyệt"
```

---

### Task 11: Người dùng duyệt kinh Phế

Chốt chặn. **Không chạy 350 huyệt còn lại trước bước này.**

- [ ] **Step 1: Dựng bản xem**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && (npm run dev &) && sleep 6
echo "Mời xem 11 trang:"
for s in trung-phu van-mon thien-phu hiep-bach xich-trach khong-toi liet-khuyet kinh-cu thai-uyen ngu-te thieu-thuong; do
  echo "  http://localhost:4321/huyet/$s/"
done
```

- [ ] **Step 2: Hỏi người dùng đúng năm điểm**

1. Bốn ảnh có đọc được không, ảnh nào thừa hoặc thiếu?
2. Góc nhìn và mức phóng có đúng không — huyệt nào cần đưa vào `ngoaiLe` của `khung-anh.json`?
3. Giọng văn mục "Công dụng theo nhóm chỉ định" có dùng được không?
4. Vị trí mục đó trên trang đã đúng chưa?
5. Dung lượng ảnh ước cho 361 huyệt có chấp nhận được không?

- [ ] **Step 3: Sửa theo góp ý rồi chụp lại kinh Phế**

Sửa `khung-anh.json` / component / bộ tách nhóm, chạy lại Task 5 Step 4 và Task 6 Step 4, xem lại. Lặp cho tới khi người dùng duyệt.

---

### Task 12: Nhân ra 350 huyệt còn lại

**Interfaces:**
- Consumes: khuôn đã được duyệt ở Task 11.

- [ ] **Step 1: Chụp cả 361 huyệt**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/frontend && (npm run dev &) && sleep 8
cd /Users/truongtrang/Desktop/kinhlacc/backend/src/acu-solver && node chup-huyet.cjs --tat-ca 2>&1 | tail -20
```

Kỳ vọng: `Xong 1444 ảnh`. Chụp TRỌN trong một lượt trên MỘT máy — chụp bù lẻ tẻ sau này dễ lệch tông. Ghi lại máy và phiên bản Chromium đã dùng.

- [ ] **Step 2: Đo dung lượng và đối chiếu trần**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node scripts-di-cu/anh-huyet-3d.mjs --thu
```

Kỳ vọng: dòng `ƯỚC CHO 361 HUYỆT` ≤ 1536MB. Vượt thì script tự dừng — báo người dùng, đừng tự hạ chất lượng.

- [ ] **Step 3: Nạp**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms
node scripts-di-cu/anh-huyet-3d.mjs
node scripts-di-cu/nap-hoso-focks.mjs
node scripts-di-cu/dung-chi-muc.mjs huyet_vi
```

- [ ] **Step 4: Chạy trọn bộ nghiệm thu của spec**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node -e "
const {readFileSync}=require('fs'), {parseEnv}=require('util'), {Client}=require('pg');
const env=parseEnv(readFileSync('.env','utf8'));
(async()=>{
 const k=new Client({host:env.PGHOST,port:+env.PGPORT,user:env.PGUSER,password:env.PGPASSWORD,
   database:env.PGDATABASE,ssl:{ca:readFileSync('aiven-ca.pem','utf8'),rejectUnauthorized:true}});
 await k.connect();
 const r=(await k.query(\`SELECT count(*) FILTER (WHERE anh_da IS NOT NULL) da,
   count(*) FILTER (WHERE anh_gp IS NOT NULL) gp, count(*) FILTER (WHERE anh_lan IS NOT NULL) lan,
   count(*) FILTER (WHERE anh_kinh IS NOT NULL) kinh, count(*) FILTER (WHERE cong_dung_nhom IS NOT NULL) cd,
   count(*) FILTER (WHERE the_loai::text LIKE '%Đường Kinh%') dk
   FROM ec_huyet_vi WHERE deleted_at IS NULL\`)).rows[0];
 console.log('ảnh da/gp/lan/kinh:',r.da,r.gp,r.lan,r.kinh,'| công dụng:',r.cd,'| thẻ kinh:',r.dk);
 await k.end();
})();
"
```

Kỳ vọng: bốn số ảnh đều bằng 357 (hoặc 361 sau khi vá mã cho ST3/ST7/KI15/GB3); thẻ kinh 357.

- [ ] **Step 5: Kiểm huyệt vẫn nằm trên da**

Phép nghiệm thu số 2 của spec. Ảnh chụp huyệt chìm trong thịt là lỗi thấy được ngay, nhưng 1.444 ảnh thì không soi mắt hết được.

Dùng `kiem-nhac-da.cjs` chứ **không** dùng `skin-clamp.cjs` — tệp kia là module, không có CLI, `node skin-clamp.cjs` chạy ra rỗng. `kiem-nhac-da` chỉ đọc, không ghi tệp nào, và hỏi đúng câu cần: chấm huyệt có bị lớp da nuốt mất không.

```bash
cd /Users/truongtrang/Desktop/kinhlacc/backend/src/acu-solver && node kiem-nhac-da.cjs 2>&1 | tail -18
```

Kỳ vọng: dòng cuối `✓ ĐẠT`. Đo ngày 25/09/2026 còn **5 chấm bị da nuốt: HT8, TE1, CV1, CV23, GV28** — đó đúng là 5 ảnh `da` sẽ không thấy chấm huyệt.

Xử lý 5 huyệt đó, không bỏ qua:

```bash
open /Users/truongtrang/Desktop/kinhlacc/.anh-huyet/{HT8,TE1,CV1,CV23,GV28}-da.png
```

- Thấy chấm → không cần làm gì (góc chụp che được chỗ hở).
- Không thấy chấm → thêm vào `ngoaiLe` của `khung-anh.json` một `huong` khác rồi chụp lại riêng 5 huyệt đó: `node chup-huyet.cjs HT8 TE1 CV1 CV23 GV28`.
- **CV1 hở tới −3,08cm** (đáy chậu) — huyệt này gần như chắc chắn phải đổi hướng nhìn; nếu vẫn không được thì để nó dùng ảnh cũ, đừng đăng một ảnh không thấy huyệt.

- [ ] **Step 6: Kiểm bất biến "hình không nói dối chữ"**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/backend/src/acu-solver && node -e "
const {traHuyet}=require('./ten-giai-phau.cjs');
const P=require('./giai-phau-data.json').points;
const ds=Object.keys(P).sort(()=>Math.random()-0.5).slice(0,10);
let loi=0;
for(const c of ds){ const r=traHuyet(c); const goc=P[c].duoiDa||[];
  for(const x of r.toDuoc) if(!goc.includes(x.ten)){ console.error('✗',c,'tô',x.ten,'mà duoiDa không có'); loi++; } }
console.log(loi?('LỖI '+loi):'ĐẠT — mọi cấu trúc tô sáng đều nằm trong duoiDa');
"
```

Kỳ vọng: `ĐẠT`.

- [ ] **Step 7: Commit và báo a5 con số dung lượng thật**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git add -A cms/scripts-di-cu backend/src/acu-solver
git commit -m "feat: ảnh 3D và công dụng cho 361 huyệt chính kinh"
```

---

### Task 13: Lấp 60 ô nội dung còn trống

Tách riêng vì đây là việc **người duyệt từng dòng**, không tự động được.

**Files:**
- Create: `cms/.tam-focks/o-trong.json` (hồ sơ chờ duyệt, không vào git)

- [ ] **Step 1: Xuất danh sách ô trống kèm bản nháp từ sách**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node -e "
const {readFileSync,writeFileSync}=require('fs'), {parseEnv}=require('util'), {Client}=require('pg');
const env=parseEnv(readFileSync('.env','utf8'));
const focks=require('./.tam-focks/hoso.json');
const theoMa=new Map(focks.map(x=>[x.ma,x]));
(async()=>{
 const k=new Client({host:env.PGHOST,port:+env.PGPORT,user:env.PGUSER,password:env.PGPASSWORD,
   database:env.PGDATABASE,ssl:{ca:readFileSync('aiven-ca.pem','utf8'),rejectUnauthorized:true}});
 await k.connect();
 const r=await k.query(\`SELECT slug, title, ma_huyet,
   (giai_phau IS NULL) tg, (tac_dung IS NULL) tt, (pho_huyet IS NULL) tp
   FROM ec_huyet_vi WHERE ma_huyet IS NOT NULL AND deleted_at IS NULL
   AND (giai_phau IS NULL OR tac_dung IS NULL OR pho_huyet IS NULL) ORDER BY ma_huyet\`);
 const ra=[];
 for(const x of r.rows){ const ma=String(x.ma_huyet).toUpperCase().replace(/[^A-Z0-9]/g,'')
   .replace(/^HE/,'HT').replace(/^K(\\\\d)/,'KI\$1');
  for(const [co,o] of [[x.tg,'giai_phau'],[x.tt,'tac_dung'],[x.tp,'pho_huyet']]) if(co)
    ra.push({slug:x.slug, ma, ten:x.title, o, trangSach:(theoMa.get(ma)||{}).trang||null,
      nhapTuSach:(theoMa.get(ma)||{}).nguyenVan||null, banVietLai:'', daDuyet:false});
 }
 writeFileSync('.tam-focks/o-trong.json', JSON.stringify(ra,null,1));
 console.log('Xuất', ra.length, 'ô trống →', '.tam-focks/o-trong.json');
 await k.end();
})();
"
```

Kỳ vọng: khoảng 60 ô.

- [ ] **Step 2: Viết bản nháp cho từng ô**

Với mỗi ô: đọc `nhapTuSach` (nguyên văn trang sách), **viết lại bằng lời mình** vào `banVietLai`, giữ `trangSach` để truy nguồn. Ô nào sách không có thì để `banVietLai` rỗng và ghi `khongCoNguon: true` — **không bịa**.

- [ ] **Step 3: Người dùng duyệt**

Đưa `o-trong.json` cho người dùng đọc, họ đặt `daDuyet: true` cho ô nào dùng được.

- [ ] **Step 4: Nạp đúng những ô đã duyệt**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node -e "
const {readFileSync}=require('fs'), {parseEnv}=require('util'), {Client}=require('pg');
const env=parseEnv(readFileSync('.env','utf8'));
const ds=require('./.tam-focks/o-trong.json').filter(x=>x.daDuyet && x.banVietLai);
let n=0; const khoi=t=>[{_type:'block',_key:'k'+(++n),style:'normal',markDefs:[],
  children:[{_type:'span',_key:'s'+n,text:t,marks:[]}]}];
(async()=>{
 const k=new Client({host:env.PGHOST,port:+env.PGPORT,user:env.PGUSER,password:env.PGPASSWORD,
   database:env.PGDATABASE,ssl:{ca:readFileSync('aiven-ca.pem','utf8'),rejectUnauthorized:true}});
 await k.connect();
 await k.query('ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER').catch(()=>{});
 let g=0;
 for(const x of ds){
   const val = x.o==='pho_huyet' ? x.banVietLai : JSON.stringify(khoi(x.banVietLai));
   const r=await k.query('UPDATE ec_huyet_vi SET '+x.o+' = \$1 WHERE slug = \$2 AND '+x.o+' IS NULL AND deleted_at IS NULL',[val,x.slug]);
   g+=r.rowCount;
 }
 await k.query('ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER').catch(()=>{});
 console.log('Lấp',g,'ô. → node scripts-di-cu/dung-chi-muc.mjs huyet_vi');
 await k.end();
})();
"
cd /Users/truongtrang/Desktop/kinhlacc/cms && node scripts-di-cu/dung-chi-muc.mjs huyet_vi
```

Lưu ý `WHERE ... IS NULL` trong câu lệnh: chỉ lấp ô đang trống, **không bao giờ ghi đè nội dung sẵn có**.

- [ ] **Step 5: Đếm lại**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node -e "
const {readFileSync}=require('fs'), {parseEnv}=require('util'), {Client}=require('pg');
const env=parseEnv(readFileSync('.env','utf8'));
(async()=>{
 const k=new Client({host:env.PGHOST,port:+env.PGPORT,user:env.PGUSER,password:env.PGPASSWORD,
   database:env.PGDATABASE,ssl:{ca:readFileSync('aiven-ca.pem','utf8'),rejectUnauthorized:true}});
 await k.connect();
 const r=(await k.query(\`SELECT count(*) tong, count(giai_phau) gp, count(tac_dung) td, count(pho_huyet) ph
   FROM ec_huyet_vi WHERE ma_huyet IS NOT NULL AND deleted_at IS NULL\`)).rows[0];
 console.log('357 huyệt có mã → giải phẫu',r.gp,'· tác dụng',r.td,'· phối huyệt',r.ph);
 await k.end();
})();
"
```

Kỳ vọng: cả ba tiến gần 357. Ô nào vẫn trống phải giải thích được bằng `khongCoNguon: true`.

- [ ] **Step 6: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc
git commit --allow-empty -m "chore: lấp 60 ô nội dung huyệt chính kinh, đã qua người duyệt"
```
