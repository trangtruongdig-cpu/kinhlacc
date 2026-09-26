/*
 * gen-og-png.mjs — Raster hoá SVG thương hiệu thành PNG bằng Chrome headless.
 *
 * Vì sao cần: og:image và Organization.logo của JSON-LD đều PHẢI là raster —
 * Facebook/Zalo không dựng SVG, và Google Rich Results từ chối logo định dạng SVG.
 * Máy này không có rsvg/inkscape/ImageMagick nên mượn Chrome (đã có sẵn) làm bộ
 * raster; không thêm phụ thuộc npm nào.
 *
 * Sinh hai tệp:
 *   public/og-default.png  1200x630  — ảnh chia sẻ mạng xã hội
 *   public/logo-512.png     512x512  — logo VUÔNG cho Organization.logo
 *
 * Chạy:  node frontend/scripts/gen-og-png.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pub = resolve(here, '..', 'public')

// Chrome/Chromium — thử các đường quen thuộc trên macOS rồi tới Playwright.
const UNG_VIEN = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  process.env.CHROME_PATH,
].filter(Boolean)

const chrome = UNG_VIEN.find((p) => existsSync(p))
if (!chrome) {
  console.error('Không tìm thấy Chrome/Chromium. Đặt CHROME_PATH rồi chạy lại.')
  process.exit(1)
}

/** Chụp một SVG thành PNG đúng kích thước, nền trong suốt. */
function raster(svg, w, h, out) {
  const tmp = mkdtempSync(join(tmpdir(), 'kinhlac-og-'))
  const html = join(tmp, 'a.html')
  // margin:0 + kích thước cứng: ảnh ra đúng w x h, không lề.
  writeFileSync(
    html,
    `<!DOCTYPE html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${w}px;height:${h}px}</style>
${svg}`,
  )
  execFileSync(
    chrome,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--default-background-color=00000000', // nền trong suốt
      `--window-size=${w},${h}`,
      `--screenshot=${out}`,
      `file://${html}`,
    ],
    { stdio: 'ignore' },
  )
  rmSync(tmp, { recursive: true, force: true })
}

// ---- 1) og-default.png (1200x630) ----
const ogSvg = readFileSync(join(pub, 'og-default.svg'), 'utf8')
// KHÔNG tự đồ bản sao lưu cạnh đích: mọi thứ trong public/ đều được chép sang dist/
// rồi đẩy lên site. Bản cũ đã nằm trong git, lấy lại bằng `git checkout`.
const ogOut = join(pub, 'og-default.png')
raster(ogSvg, 1200, 630, ogOut)
console.log('og-default.png  ', statSync(ogOut).size, 'bytes')

// ---- 2) logo-512.png — logo quy định, VUÔNG, nền kem đặc ----
// Nền đặc chứ không trong suốt: Google hiển thị logo trên nền trắng lẫn nền tối,
// logo trong suốt sẽ mất viền #cfad78 trên nền sáng.
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64" role="img" aria-label="Kinh Lạc Trương Gia">
  <rect width="64" height="64" fill="#fbf7f0"/>
  <circle cx="32" cy="32" r="30" fill="none" stroke="#cfad78" stroke-width="2"/>
  <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="#8a5e28"/>
  <circle cx="32" cy="32" r="4" fill="#ffffff"/>
</svg>`
writeFileSync(join(pub, 'logo-512.svg'), logoSvg + '\n')
const logoOut = join(pub, 'logo-512.png')
raster(logoSvg, 512, 512, logoOut)
console.log('logo-512.png    ', statSync(logoOut).size, 'bytes')
