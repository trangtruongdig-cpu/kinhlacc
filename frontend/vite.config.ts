import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Dạng hàm ({ command }) để biết đang `vite` (serve = dev) hay `vite build` (production).
export default defineConfig(({ command }) => ({
  // Số "phiên bản build" (mốc thời gian lúc build) — nhúng vào code để gắn ?v=<...> cho các asset
  // engine Kinh Mạch 3D (giữ-nguyên-tên trong public/). Mỗi lần build → số mới → URL mới → trình duyệt
  // buộc tải lại file mới, KỂ CẢ máy đã lỡ cache "immutable" 1 năm bởi cấu hình nginx cũ. Xem acuMap3d.ts.
  define: {
    __ACU_ASSET_VER__: JSON.stringify(String(Date.now())),
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'pwa-icon-512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000 // 5 MB để cho phép cache các file JS data lớn như benh.js và acupoints.js
      },
      // NGUỒN DUY NHẤT của manifest. Trước đây còn một bản viết tay ở public/manifest.webmanifest
      // nhưng nó luôn bị bản sinh ra ở đây ghi đè — nên start_url, lang: 'vi' và background_color
      // nâu (#3d1f0a) chưa bao giờ có hiệu lực, Android vẫn hiện nền trắng.
      manifest: {
        name: 'Kinh Lạc Gia Minh',
        short_name: 'Kinh Lạc',
        description: 'Xem kết quả khám kinh lạc, hồ sơ bệnh nhân và hệ thống chẩn đoán Y học cổ truyền',
        start_url: '/khach-hang/dang-nhap',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'vi',
        categories: ['health', 'medical'],
        background_color: '#3d1f0a',
        theme_color: '#6b4423',
        icons: [
          { src: 'pwa-icon-72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-icon-maskable-384.png', sizes: '384x384', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Hồ Sơ Của Tôi',
            short_name: 'Hồ Sơ',
            description: 'Xem danh sách ca khám',
            url: '/ho-so/kham-benh/danh-sach',
          },
          {
            name: 'Đăng Nhập',
            short_name: 'Đăng Nhập',
            description: 'Đăng nhập tài khoản khách hàng',
            url: '/khach-hang/dang-nhap',
          },
        ],
      },
    }),
    // DevTools CHỈ bật khi chạy dev (vite serve). KHÔNG đưa vào bản build production:
    // nó làm chậm build trên VPS RAM thấp và nhét overlay/đồ nghề debug vào bundle người dùng.
    ...(command === 'serve' ? [vueDevTools()] : []),
  ],
  // Vite 8 dùng bộ đóng gói Rolldown — nó TỰ tách chunk vendor + tách theo route lazy-load khá tốt,
  // nên KHÔNG cấu hình manualChunks thủ công (Rolldown không nhận kiểu object như Rollup cũ → lỗi build).
  // (chart.js, xlsx, three… đã nạp động ở nơi cần nên tự thành chunk riêng, chỉ tải khi cần.)
  build: {
    chunkSizeWarningLimit: 900,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
      '.ngrok.dev',
    ],
    // ĐỪNG reload trang khi backend ghi ảnh/bài (sinh ảnh AI vào public/blog-images, đăng bài vào content/blog).
    // Nếu không, Vite thấy file mới → full reload → HUỶ request đang chờ → trình duyệt báo "Failed to fetch"
    // (dù backend đã làm xong). Các file này vẫn được Vite phục vụ tĩnh bình thường.
    watch: {
      ignored: [
        '**/public/blog-images/**',
        '**/public/blog-assets/**',
        '**/content/blog/**',
      ],
    },
  },
  preview: {
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
      '.ngrok.dev',
    ],
  },
}))
