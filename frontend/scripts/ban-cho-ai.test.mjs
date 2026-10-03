import { test } from "node:test";
import assert from "node:assert/strict";
import { banChoAi, loiNhacHoiAi } from "./ban-cho-ai.mjs";

const P = {
  tieuDe: "Huyệt Hạ Quan (ST7)",
  url: "https://kinhlac.online/huyet/ha-quan/",
  loai: "Huyệt vị",
  matTruoc: [["Mã WHO", "ST7"], ["Đường kinh", "Kinh Túc Dương Minh Vị"], ["Vị trí", "Chỗ lõm trước tai"], ["Bỏ trống", ""]],
  mucNoiDung: [["Chủ Trị", "Đau răng, ù tai."], ["Rỗng", ""]],
  faq: [{ q: "Huyệt hạ quan ở đâu?", a: "Chỗ lõm trước tai." }],
  nguon: [{ ten: "Giáp Ất Kinh", duong: "https://kinhlac.online/nguon/giap-at-kinh/" }],
};

test("dòng NGUỒN đứng ngay sau tiêu đề — đó là chỗ trợ lý lấy link để dẫn", () => {
  const d = banChoAi(P).split("\n");
  assert.equal(d[0], "# Huyệt Hạ Quan (ST7)");
  assert.match(d[2], /^> Nguồn: https:\/\/kinhlac\.online\/huyet\/ha-quan\//);
});

test("TRẢ LỜI NHANH đứng trước mọi mục nội dung — trợ lý trích phần đầu nhiều hơn hẳn", () => {
  const md = banChoAi(P);
  assert.ok(md.indexOf("## Trả lời nhanh") < md.indexOf("## Chủ Trị"));
  assert.match(md, /\*\*Mã WHO:\*\* ST7/);
});

test("bỏ qua ô rỗng, không đẻ ra mục trống", () => {
  const md = banChoAi(P);
  assert.equal(/Bỏ trống/.test(md), false);
  assert.equal(/## Rỗng/.test(md), false);
});

test("FAQ và nguồn được đưa vào; kết bằng đường về trang người đọc", () => {
  const md = banChoAi(P);
  assert.match(md, /### Huyệt hạ quan ở đâu\?/);
  assert.match(md, /Giáp Ất Kinh/);
  assert.match(md.trim().split("\n").at(-1), /Trang đầy đủ cho người đọc: https:\/\/kinhlac\.online\/huyet\/ha-quan\//);
});

test("ký tự mở đầu Markdown được thoát, xuống dòng bị gộp", () => {
  const md = banChoAi({ ...P, mucNoiDung: [["X", "# không phải tiêu đề\n\nvẫn một đoạn"]] });
  assert.match(md, /\\# không phải tiêu đề vẫn một đoạn/);
});

test("lời nhắc trỏ vào BẢN MÁY ĐỌC và dặn dẫn nguồn về trang gốc", () => {
  const n = loiNhacHoiAi("https://a/x/index.md", "https://a/x/", "Huyệt Hạ Quan");
  assert.match(n, /Đọc https:\/\/a\/x\/index\.md/);
  assert.match(n, /dẫn nguồn về https:\/\/a\/x\//);
});

test("hồ sơ rỗng vẫn ra bản hợp lệ, không ném", () => {
  const md = banChoAi({ tieuDe: "X", url: "https://a/x/" });
  assert.match(md, /^# X/);
  assert.match(md, /Trang đầy đủ cho người đọc/);
});
