/* hand-foot-inset.js — BẢNG PHÓNG TO bàn tay / bàn chân (độc lập, KHÔNG đụng map3d.js).
 * Da mesh blobby → vẽ KHUNG XƯƠNG từng ngón (handfoot-bones.js) làm hướng-dẫn, chiếu huyệt
 * (ACU_COORDS3D, đã neo xương) lên từng mặt: tay Mu/Gan, chân Mu/Gan. Chấm có nhãn, bấm → chi tiết huyệt.
 * Kích hoạt: nút "✋ Bàn tay/chân" trên thanh công cụ Đồ hình 3D (#mapInsetBtn) bật/tắt overlay #hfInset.
 */
(function () {
  const COORDS = window.ACU_COORDS3D, BONES = window.HANDFOOT_BONES,
        MER = window.MERIDIANS, INDEX = window.ACU_INDEX;
  const box = document.getElementById('hfInset'), btn = document.getElementById('mapInsetBtn');
  if (!COORDS || !BONES || !box) return;

  // tên huyệt từ MERIDIANS (đồng bộ với cả app)
  const merName = {};
  if (MER) [...(MER.kinh || []), ...(MER.circuits || [])].forEach(g =>
    (g.points || []).forEach(p => { if (p.code) merName[p.code] = p.ten; }));
  const nameOf = c => merName[c] || c;
  const merOf = c => c.replace(/\d+$/, '');
  const colOf = c => (COORDS.meridians[merOf(c)] || {}).color || '#777';
  const idOf = c => INDEX && INDEX.codeToId ? INDEX.codeToId[c] : null;
  const P = COORDS.points;

  // ---- các MẶT NHÌN: chiếu 3D→2D (proj) + danh sách huyệt + khung xương (hand|foot) ----
  // tay: x=quay+, y=cao(đầu ngón thấp), z=gan+. chân: x=trong−ngoài+, y=mu cao, z=đầu-ngón ra trước+.
  // proj trả [sx, sy]; chuẩn-hoá min→top nên để NGÓN chĩa LÊN: tay sy=+y (đầu ngón y nhỏ→trên), chân sy=−z (đầu ngón z lớn→trên)
  const VIEWS = [
    { id: 'handMu', label: '✋ Bàn tay · Mu', part: 'hand', proj: p => [p[0], p[1]],
      note: 'Mặt mu (lưng) bàn tay — huyệt móng & kẽ ngón · ngón cái bên phải',
      codes: ['LU11', 'LI1', 'LI2', 'LI3', 'LI4', 'PC9', 'TE1', 'TE2', 'TE3', 'HT9', 'SI1', 'SI2', 'SI3', 'SI4'] },
    { id: 'handGan', label: '🤚 Bàn tay · Gan', part: 'hand', proj: p => [-p[0], p[1]],
      note: 'Mặt gan (lòng) bàn tay — ô mô cái, Lao Cung… · ngón cái bên trái',
      codes: ['LU10', 'LU11', 'PC8', 'PC9', 'HT8', 'HT9', 'LI1', 'SI1', 'TE1'] },
    { id: 'footMu', label: '🦶 Bàn chân · Mu', part: 'foot', proj: p => [p[0], -p[2]],
      note: 'Mu (lưng) bàn chân nhìn từ trên — móng & kẽ ngón, bờ trong/ngoài',
      codes: ['ST42', 'ST43', 'ST44', 'ST45', 'LR1', 'LR2', 'LR3', 'GB41', 'GB42', 'GB43', 'GB44',
              'SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'BL62', 'BL63', 'BL64', 'BL65', 'BL66', 'BL67', 'KI2'] },
    { id: 'footGan', label: '👣 Bàn chân · Gan', part: 'foot', proj: p => [-p[0], -p[2]],
      note: 'Gan (lòng) bàn chân — Dũng Tuyền',
      codes: ['KI1', 'SP1', 'BL67', 'LR1'] },
  ];

  // ---- tiện ích chiếu + chuẩn-hoá vào khung SVG ----
  const W = 360, H = 440, PAD = 46;
  function project(view) {
    const pts = [], lines = [];
    // khung xương
    for (const k in BONES[view.part]) {
      const ch = BONES[view.part][k];
      if (ch.length < 2) { if (ch.length === 1) lines.push({ pts: ch.map(view.proj) }); continue; }
      lines.push({ pts: ch.map(view.proj) });
    }
    // huyệt
    for (const c of view.codes) { const p = P[c]; if (p && p.x !== undefined) pts.push({ code: c, xy: view.proj([p.x, p.y, p.z]) }); }
    // gom mọi điểm để tính bbox
    const all = [...lines.flatMap(l => l.pts), ...pts.map(p => p.xy)];
    if (!all.length) return null;
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
    for (const [x, y] of all) { if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y; }
    const sw = mxx - mnx || 1, sh = mxy - mny || 1, s = Math.min((W - 2 * PAD) / sw, (H - 2 * PAD) / sh);
    const ox = (W - s * sw) / 2, oy = (H - s * sh) / 2;
    const map = ([x, y]) => [ox + (x - mnx) * s, oy + (y - mny) * s];
    return { lines: lines.map(l => ({ pts: l.pts.map(map) })), pts: pts.map(p => ({ code: p.code, xy: map(p.xy) })) };
  }

  // ---- vẽ 1 mặt thành SVG ----
  const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function svgFor(view) {
    const pr = project(view);
    if (!pr) return '<p class="hf-empty">—</p>';
    let s = `<svg viewBox="0 0 ${W} ${H}" class="hf-svg">`;
    // khung xương (đường + khớp)
    for (const l of pr.lines) {
      if (l.pts.length >= 2)
        s += `<polyline points="${l.pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" class="hf-bone"/>`;
      for (const p of l.pts) s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.2" class="hf-joint"/>`;
    }
    // huyệt: chấm + nhãn (mã); lệch nhãn để đỡ chồng
    pr.pts.forEach((p, i) => {
      const [x, y] = p.xy, col = colOf(p.code), id = idOf(p.code);
      const lx = x + (x > W / 2 ? 7 : -7), anc = x > W / 2 ? 'start' : 'end';
      s += `<g class="hf-pt" data-code="${p.code}"${id ? ` data-id="${id}"` : ''} tabindex="0">` +
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="${col}" stroke="#fff" stroke-width="1.3"/>` +
        `<text x="${lx.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="${anc}" class="hf-lbl">${esc(p.code)}</text>` +
        `<title>${esc(p.code + ' · ' + nameOf(p.code))}</title></g>`;
    });
    s += '</svg>';
    return s;
  }

  // ---- dựng panel: tab mặt + vùng vẽ + chú thích ----
  let cur = 'handMu';
  function render() {
    const view = VIEWS.find(v => v.id === cur) || VIEWS[0];
    box.innerHTML =
      `<div class="hf-head"><strong>Phóng to bàn tay / bàn chân</strong>` +
      `<span class="hf-hint">khung xám = xương ngón · bấm chấm để xem chi tiết huyệt</span>` +
      `<button class="hf-close" id="hfClose" title="Đóng">✕</button></div>` +
      `<div class="hf-tabs">${VIEWS.map(v => `<button class="hf-tab${v.id === cur ? ' on' : ''}" data-v="${v.id}">${v.label}</button>`).join('')}</div>` +
      `<div class="hf-note">${esc(view.note)}</div>` +
      `<div class="hf-stage">${svgFor(view)}</div>` +
      `<div class="hf-list">${view.codes.filter(c => P[c]).map(c =>
        `<button class="hf-chip" data-code="${c}"${idOf(c) ? ` data-id="${idOf(c)}"` : ''} style="--c:${colOf(c)}"><span class="hf-sw"></span>${esc(c)} <small>${esc(nameOf(c))}</small></button>`).join('')}</div>`;
  }
  function open() { box.classList.add('on'); render(); btn && btn.classList.add('active'); }
  function close() { box.classList.remove('on'); btn && btn.classList.remove('active'); }

  // ---- tương tác ----
  box.addEventListener('click', e => {
    const tab = e.target.closest('.hf-tab'); if (tab) { cur = tab.dataset.v; render(); return; }
    if (e.target.closest('#hfClose')) { close(); return; }
    const hit = e.target.closest('.hf-pt, .hf-chip'); if (hit && hit.dataset.id) { location.hash = '#acu/' + hit.dataset.id; close(); }
  });
  box.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const h = e.target.closest('.hf-pt'); if (h && h.dataset.id) { location.hash = '#acu/' + h.dataset.id; close(); } }
  });
  btn && btn.addEventListener('click', () => box.classList.contains('on') ? close() : open());
})();
