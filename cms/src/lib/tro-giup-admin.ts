/**
 * MẢNH MÃ CHÈN VÀO KHU QUẢN TRỊ — hai cảnh báo quanh ô đường dẫn, và nút "View Site".
 *
 * ⚠️ ĐÂY LÀ PHẦN MONG MANH NHẤT CỦA CẢ VIỆC NÀY, và nó mong manh vì không có cách nào
 * khác: khu quản trị là gói `@emdash-cms/admin` dựng sẵn trong `node_modules`, không
 * có điểm cắm cho thanh công cụ lẫn ô đường dẫn (plugin native chỉ thêm được TRANG,
 * widget và field widget — xem `.agents/skills/creating-plugins/references/admin-ui.md`).
 * Nên mã dưới đây dò DOM. Ba luật để nó không thành cái bẫy:
 *
 *   1. KHÔNG BAO GIỜ CHẶN. Nó chỉ THÊM chữ. Người biên tập vẫn lưu, vẫn đăng như cũ;
 *      lời từ chối thật vẫn do máy chủ đưa ra (xem `lib/loi-tieng-viet.ts`).
 *   2. KHÔNG BAO GIỜ NÉM. Mọi thứ nằm trong try/catch; hỏng thì khu quản trị chạy y
 *      như chưa có mảnh này.
 *   3. HỎNG THÌ PHẢI KÊU. Vào trang sửa mục mà không dò ra ô đường dẫn thì ghi
 *      console.warn kèm tên mốc — im lặng ở đây nghĩa là cảnh báo biến mất mà không
 *      ai biết, đúng kiểu bẫy mà repo này đã dính vài lần.
 *
 * ⚠️ TOÀN BỘ mảnh mã dưới đây nằm trong MỘT template string, nên trong đó KHÔNG được
 * có dấu huyền (backtick) — kể cả trong chú thích. Một dấu lạc chỗ sẽ đóng chuỗi sớm và
 * tệp này thành lỗi cú pháp TypeScript ở một dòng trông chẳng liên quan gì. Đã dính.
 *
 * Vì sao NHÚNG THẲNG chứ không để thành tệp .js riêng: trên VPS, nginx chỉ đẩy ba
 * đường sang container cms (`/_emdash/`, `/_astro/`, `/trang/`). Một tệp ở
 * `/_kinhlac/…` sẽ chạy ngon ở máy lập trình rồi 404 trên site thật — đúng loại lỗi
 * chỉ lộ ra sau khi deploy.
 */

/** Dựng mảnh mã, nhúng sẵn địa chỉ site thật (rỗng thì dùng chính origin đang mở). */
export function scriptTroGiupAdmin(urlSiteThat: string): string {
	return `(() => {
"use strict";
const SITE = ${JSON.stringify(urlSiteThat || "")};
const MOC = "[kinhlac-admin]";
let daKeu = false;

/** Ô đường dẫn: dò bằng NHIỀU dấu hiệu, vì tên lớp CSS của Kumo đổi theo mỗi bản. */
function timOSlug() {
  for (const o of document.querySelectorAll("input[type=text], input:not([type])")) {
    const ten = (o.name || "") + " " + (o.id || "");
    if (/slug|permalink/i.test(ten)) return o;
    const nhan = o.getAttribute("aria-label") || "";
    if (/^\\s*(slug|url slug|permalink|đường dẫn)\\s*$/i.test(nhan)) return o;
    if (o.id) {
      const l = document.querySelector('label[for="' + CSS.escape(o.id) + '"]');
      if (l && /^\\s*(slug|url slug|permalink|đường dẫn)\\s*$/i.test(l.textContent || "")) return o;
    }
  }
  return null;
}

/** /_emdash/admin/content/<bo>/<id> → { bo, id }. Trang khác trả null. */
function mucDangSua() {
  const p = location.pathname.split("/").filter(Boolean);
  const i = p.indexOf("content");
  if (i < 0 || !p[i + 1] || !p[i + 2] || p[i + 2] === "new") return null;
  return { bo: p[i + 1], id: p[i + 2] };
}

async function docJson(duong) {
  const r = await fetch(duong, { headers: { "X-EmDash-Request": "1" }, credentials: "same-origin" });
  if (!r.ok) return null;
  return r.json();
}

/** Khối cảnh báo nằm ngay dưới ô đường dẫn. Style nội tuyến để không phụ thuộc CSS admin. */
function khoi(o) {
  let k = o.parentElement && o.parentElement.querySelector(":scope > .kinhlac-canh-bao");
  if (!k) {
    k = document.createElement("div");
    k.className = "kinhlac-canh-bao";
    k.style.cssText = "margin-top:6px;font-size:13px;line-height:1.45;border-radius:6px;padding:7px 10px;display:none";
    o.parentElement && o.parentElement.appendChild(k);
  }
  return k;
}

function hien(o, muc, chu) {
  const k = khoi(o);
  if (!chu) { k.style.display = "none"; k.textContent = ""; return; }
  const mau = muc === "do"
    ? { nen: "#fdecec", vien: "#e5484d", chu: "#8b1a1d" }
    : { nen: "#fff7e6", vien: "#e08700", chu: "#7a4b00" };
  k.style.background = mau.nen;
  k.style.border = "1px solid " + mau.vien;
  k.style.color = mau.chu;
  k.style.display = "block";
  k.textContent = chu;
}

const trangThai = { khoa: "", slugDaLuu: "", daDang: false, urlPattern: "", tenBo: "" };

/** Nạp thông tin mục đang sửa: slug đã lưu, đã đăng chưa, mẫu đường dẫn của bộ. */
async function napMuc(m) {
  const khoa = m.bo + "/" + m.id;
  if (trangThai.khoa === khoa) return;
  trangThai.khoa = khoa;
  trangThai.tenBo = m.bo;
  try {
    const [muc, bo] = await Promise.all([
      docJson("/_emdash/api/content/" + m.bo + "/" + m.id),
      docJson("/_emdash/api/collections/" + m.bo),
    ]);
    const d = (muc && (muc.data || muc)) || {};
    trangThai.slugDaLuu = d.slug || "";
    trangThai.daDang = d.status === "published" || Boolean(d.publishedAt);
    const b = (bo && (bo.data || bo)) || {};
    trangThai.urlPattern = b.urlPattern || b.url_pattern || "";
  } catch (e) {
    console.warn(MOC, "không đọc được thông tin mục:", e);
  }
}

/** Đường tới trang thật của mục, dựng từ url_pattern như chính EmDash làm. */
function duongTrangThat(slug) {
  if (!slug) return null;
  const mau = trangThai.urlPattern || "/" + trangThai.tenBo + "/{slug}";
  return (SITE || location.origin) + mau.replace(/\\{slug\\}/g, slug);
}

let hen = null;
async function soat(o) {
  const slug = (o.value || "").trim();
  const m = mucDangSua();
  if (!m) return;

  // (1) Đổi đường dẫn của một mục ĐÃ ĐĂNG — cảnh báo vàng.
  //
  // Đây mới là rủi ro thật ở kiến trúc này, và nó KHÔNG hiển nhiên: EmDash có tự tạo
  // chuyển hướng 301 khi đổi slug, nhưng trang từ điển là HTML TĨNH do nginx phục vụ
  // thẳng — 301 của CMS không ai đọc tới. Trang cũ vẫn sống tới lần dựng lại kế tiếp,
  // trang mới thì chưa có.
  if (trangThai.daDang && trangThai.slugDaLuu && slug && slug !== trangThai.slugDaLuu) {
    hien(o, "vang",
      'Mục này đã đăng với đường dẫn "' + trangThai.slugDaLuu + '". Đổi sang "' + slug +
      '" thì trang cũ vẫn còn trên site cho tới lần dựng lại kế tiếp, còn trang mới thì chưa có. ' +
      'Chuyển hướng 301 của CMS không đỡ được vì trang từ điển do nginx phục vụ thẳng.');
  } else {
    hien(o, "vang", "");
  }

  // (2) Trùng đường dẫn — hỏi máy chủ, báo NGAY chứ không đợi bấm Lưu.
  if (!slug) return;
  try {
    const kq = await docJson(
      "/_emdash/api/content/" + m.bo + "?q=" + encodeURIComponent(slug) + "&limit=20");
    const ds = (kq && (kq.data || kq.items || kq.results)) || [];
    const dung = Array.isArray(ds) && ds.find((x) => x && x.slug === slug && x.id !== m.id);
    if (dung) {
      hien(o, "do",
        'Đường dẫn "' + slug + '" đang được mục khác dùng: “' +
        (dung.title || dung.data?.title || dung.id) + '”. Lưu sẽ bị từ chối.');
    }
  } catch (e) {
    // Dò trùng là tiện ích, mất mạng thì thôi — máy chủ vẫn chặn khi lưu.
  }
}

/**
 * Nút "View Site" ở thanh trên: href="/" đóng cứng trong gói admin. Trỏ nó về đúng
 * trang của mục đang sửa; ngoài trang sửa mục thì về trang chủ site thật.
 *
 * ⚠️ Tách thành hàm riêng và gọi LẠI sau khi napMuc xong là có lý do: mẫu đường dẫn
 * (url_pattern) phải hỏi máy chủ mới biết, nên lượt gọi đầu luôn chạy khi nó còn rỗng.
 * Gọi một lần thôi thì nút trỏ vào "//<slug>" — phép kiểm đã bắt đúng lỗi này.
 */
function capNhatNutViewSite() {
  const m = mucDangSua();
  const o = m ? timOSlug() : null;
  for (const a of document.querySelectorAll('a[href="/"], a[data-kinhlac="1"]')) {
    const dich = (m && o && duongTrangThat((o.value || "").trim())) || (SITE || null);
    if (!dich) continue;
    a.setAttribute("href", dich);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
    a.dataset.kinhlac = "1";
  }
}

function gan() {
  const m = mucDangSua();
  const o = timOSlug();

  // Tên bộ biết ngay từ đường dẫn — đặt trước khi hỏi máy chủ, để nếu lời gọi kia hỏng
  // thì đường dự phòng "/<bộ>/<slug>" vẫn dựng được.
  if (m) trangThai.tenBo = m.bo;
  capNhatNutViewSite();

  if (!m) return;
  if (!o) {
    if (!daKeu) {
      daKeu = true;
      console.warn(MOC,
        "KHÔNG dò ra ô đường dẫn trên trang sửa mục — hai cảnh báo slug đang TẮT. " +
        "Nhiều khả năng bản EmDash mới đổi cấu trúc ô này; sửa hàm timOSlug() trong " +
        "cms/src/lib/tro-giup-admin.ts.");
    }
    return;
  }
  daKeu = false;
  napMuc(m).then(() => {
    capNhatNutViewSite();
    soat(o);
  });
  if (o.dataset.kinhlacGan === "1") return;
  o.dataset.kinhlacGan = "1";
  o.addEventListener("input", () => {
    clearTimeout(hen);
    hen = setTimeout(() => {
      capNhatNutViewSite(); // đổi đường dẫn thì nút phải theo
      soat(o);
    }, 400);
  });
}

function chay() { try { gan(); } catch (e) { console.warn(MOC, e); } }

// Khu quản trị là SPA: đổi trang không tải lại tài liệu, nên phải theo dõi DOM.
const theoDoi = new MutationObserver(() => {
  clearTimeout(theoDoi._hen);
  theoDoi._hen = setTimeout(chay, 250);
});
if (document.body) theoDoi.observe(document.body, { childList: true, subtree: true });
else addEventListener("DOMContentLoaded", () => theoDoi.observe(document.body, { childList: true, subtree: true }));
addEventListener("DOMContentLoaded", chay);
chay();
})();`;
}
