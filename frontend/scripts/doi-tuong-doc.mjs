// TRANG ĐỘNG THEO ĐỐI TƯỢNG ĐỌC — cùng một kho tri thức, ba người đọc khác nhau cần ba lát cắt.
//
// VÌ SAO: trang huyệt hiện là MỘT bản cho tất cả — mã WHO, ý nghĩa tên, đặc tính, vị trí, giải
// phẫu, chủ trị, cách châm, phối huyệt, xuất xứ, đổ hết ra theo một thứ tự cố định. Nhưng
// Search Console nói người đọc không đồng nhất, và tỉ lệ rất lệch (28 ngày, 989 lượt hiển thị):
// **70% gõ tên để tra, 25% hỏi vị trí**, gần như không ai hỏi "chữa bệnh gì". Người tra nhanh
// phải lội qua ý nghĩa tên và đặc tính mới tới chỗ họ cần.
//
// ⚠️ CHỈ SẮP LẠI THỨ TỰ, TUYỆT ĐỐI KHÔNG ẨN GÌ. Dùng `order` của flexbox, không `display:none`.
// Ba lý do, mỗi lý do đủ để một mình quyết định:
//   1. Trợ lý AI và bot tìm kiếm đọc DOM — ẩn đi là tự xoá nội dung khỏi mắt chúng.
//   2. Người đọc thuộc nhóm này vẫn có quyền đọc phần của nhóm kia; cuộn xuống là thấy.
//   3. Ẩn nội dung y văn theo "đoán xem bạn là ai" là một kiểu quyết định thay người đọc.
//
// ⚠️ THỨ TỰ TRONG DOM = nhóm MẶC ĐỊNH (`tra-nhanh`), không phải thứ tự cũ. Bot và người tắt
// JavaScript nhận đúng thứ tự phục vụ 95% nhu cầu đo được. Hai nhóm kia đổi bằng CSS thuần.

/** Khoá mục, rút từ nhãn `<h2>` — bỏ dấu, gộp khoảng trắng. */
export const khoaMuc = (nhan) =>
  String(nhan ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Ba nhóm người đọc. `uuTien` là các mục được kéo LÊN TRƯỚC, theo thứ tự; mục không có tên
 * trong danh sách giữ nguyên vị trí tương đối ở sau.
 *
 * Mỗi nhóm phải nêu được CĂN CỨ, không phải khẩu vị của người viết mã.
 */
export const NHOM_DOC = [
  {
    ma: 'tra-nhanh',
    ten: 'Tra nhanh',
    moTa: 'Huyệt này nằm ở đâu, là gì',
    // Căn cứ: 70% truy vấn là gõ tên, 25% hỏi vị trí (GSC 28 ngày). Đây là nhóm MẶC ĐỊNH.
    uuTien: ['vi-tri', 'dac-tinh', 'y-nghia-ten-huyet', 'tac-dung', 'chu-tri', 'cach-cham-cuu'],
  },
  {
    ma: 'hoc-vien',
    ten: 'Học viên',
    moTa: 'Hiểu gốc tên, đặc tính, giải phẫu',
    uuTien: ['y-nghia-ten-huyet', 'dac-tinh', 'vi-tri', 'giai-phau', 'phoi-huyet', 'xuat-xu'],
  },
  {
    ma: 'thay-thuoc',
    ten: 'Thầy thuốc',
    moTa: 'Chủ trị, phối huyệt, y văn',
    uuTien: ['chu-tri', 'tac-dung', 'phoi-huyet', 'cach-cham-cuu', 'y-van-dan-muc-nay', 'xuat-xu'],
  },
]

export const NHOM_MAC_DINH = 'tra-nhanh'

/**
 * Sắp lại danh sách mục theo nhóm mặc định — dùng ở khâu DỰNG, để thứ tự DOM phục vụ đúng
 * phần đông. Mục ngoài `uuTien` giữ nguyên thứ tự tương đối, bám sau phần ưu tiên.
 * @param {{khoa: string}[]} muc
 */
export function sapTheoNhom(muc, ma = NHOM_MAC_DINH) {
  const nhom = NHOM_DOC.find((n) => n.ma === ma)
  if (!nhom) return [...(muc ?? [])]
  const hang = (k) => {
    const i = nhom.uuTien.indexOf(k)
    return i < 0 ? nhom.uuTien.length : i
  }
  return [...(muc ?? [])].map((m, i) => ({ m, i })).sort((a, b) => hang(a.m.khoa) - hang(b.m.khoa) || a.i - b.i).map((x) => x.m)
}

/** Dải chip chọn đối tượng đọc. Không có JS thì nó vẫn hiện và vẫn đọc được — chỉ là không bấm. */
export const khoiChonDoiTuong = () =>
  `<nav class="dl-doc" aria-label="Sắp xếp theo người đọc"><span class="dl-doc-nhan">Xem theo:</span>` +
  NHOM_DOC.map(
    (n) =>
      `<button type="button" class="dl-doc-nut" data-nhom="${n.ma}" title="${n.moTa}"` +
      `${n.ma === NHOM_MAC_DINH ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${n.ten}</button>`,
  ).join('') +
  `<span class="dl-doc-ghi">Chỉ đổi thứ tự — không mục nào bị ẩn.</span></nav>`

/**
 * CSS: `order` cho từng nhóm. Mục không nêu tên nhận `order` lớn → rơi xuống sau, nhưng VẪN
 * hiện. Dải chip dùng flex nên thân bài phải là flex container.
 */
export const cssDoiTuong = () => {
  const luat = NHOM_DOC.filter((n) => n.ma !== NHOM_MAC_DINH)
    .map((n) =>
      n.uuTien.map((k, i) => `  .bl-body[data-doc="${n.ma}"] > [data-muc="${k}"]{order:${i - 100}}`).join('\n'),
    )
    .join('\n')
  // ⚠️ CHỈ bật flex KHI người đọc đã chọn nhóm (`data-doc`). Mặc định giữ nguyên bố cục khối
  // như trước: `order` đòi flex, mà flex THÔI GỘP margin giữa các khối — bật sẵn là khoảng cách
  // giữa mọi mục đổi trên 100% số trang để phục vụ một tính năng chỉ vài người bấm. Đường mặc
  // định (và mọi bot) vì thế không đụng gì tới.
  return `
  .bl-body[data-doc]{display:flex;flex-direction:column}
  .bl-body[data-doc] > *{order:0;min-width:0}
  .dl-doc{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin:.6rem 0 1rem}
  .dl-doc-nhan{font-size:.85rem;color:#8a7a63}
  .dl-doc-nut{padding:.25rem .7rem;border:1px solid #d9c9ad;border-radius:999px;background:#fff;color:#6b4423;font:inherit;font-size:.85rem;cursor:pointer}
  .dl-doc-nut[aria-pressed="true"]{background:#6b4423;border-color:#6b4423;color:#fff;font-weight:600}
  .dl-doc-ghi{font-size:.78rem;color:#9b8c76;margin-left:.2rem}
${luat}
`
}

/**
 * JS nhúng thẳng, không tệp rời (nginx chỉ đẩy ba đường sang CMS — xem CLAUDE.md).
 * Không có JS thì trang vẫn đúng thứ tự mặc định; đây chỉ là phần THÊM.
 */
export const jsDoiTuong = () =>
  `<script>(function(){try{var b=document.querySelector('.bl-body'),n=document.querySelectorAll('.dl-doc-nut');if(!b||!n.length)return;` +
  `var K='kl-doc',d=null;try{d=localStorage.getItem(K)}catch(e){}` +
  `function dat(m){b.setAttribute('data-doc',m);for(var i=0;i<n.length;i++)n[i].setAttribute('aria-pressed',String(n[i].dataset.nhom===m));try{localStorage.setItem(K,m)}catch(e){}}` +
  `for(var i=0;i<n.length;i++)n[i].addEventListener('click',function(){dat(this.dataset.nhom)});` +
  `if(d)dat(d)}catch(e){}})();</script>`

/**
 * Sắp lại THỨ TỰ DOM của thân bài theo nhóm đọc mặc định (`tra-nhanh`).
 *
 * Làm ở khâu dựng chứ không bằng CSS, vì thứ tự DOM mới là thứ bot tìm kiếm và trợ lý AI đọc —
 * và vì người tắt JavaScript phải nhận đúng thứ tự phục vụ 95% nhu cầu đo được. Hai nhóm còn
 * lại đổi bằng CSS `order` (xem doi-tuong-doc.mjs).
 *
 * ⚠️ KHÔNG mục nào bị bỏ: phần không khớp mẫu `<section data-muc>` giữ nguyên tại chỗ.
 */
export function sapThanBai(html) {
  const re = /<section class="dl-sec[^"]*" data-muc="([^"]*)">[\s\S]*?<\/section>/g
  const muc = []
  let m
  while ((m = re.exec(html))) muc.push({ khoa: m[1], html: m[0], a: m.index, b: m.index + m[0].length })
  if (muc.length < 2) return html
  const dau = html.slice(0, muc[0].a)
  const cuoi = html.slice(muc[muc.length - 1].b)
  // Phần chen GIỮA các section (vd khối Công Dụng dán cạnh mục Tác Dụng) phải đi theo section
  // ĐỨNG TRƯỚC nó, không thì sắp lại là nó lạc sang mục khác.
  for (let i = 0; i < muc.length; i++) muc[i].html += html.slice(muc[i].b, i + 1 < muc.length ? muc[i + 1].a : muc[i].b)
  return dau + sapTheoNhom(muc).map((x) => x.html).join('') + cuoi
}
