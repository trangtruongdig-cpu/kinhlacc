module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'dist/main.js',
      env: {
        APP_PORT: 3001,
        FRONTEND_URL: 'http://103.57.221.26:3000',
        ML_SERVICE_URL: 'http://localhost:3002',
        // IndexNow (Bing/Cốc Cốc/Yandex…) — key CÔNG KHAI, khớp file frontend/public/<key>.txt đã deploy.
        // Nhờ có ở đây, VPS không cần sửa backend/.env. Đổi key thì nhớ đổi cả file public/<key>.txt.
        SITE_DOMAIN: 'https://kinhlac.online',
        INDEXNOW_KEY: '3ca42ea20a96a20d494868c1877e263c',
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false,
    },
    {
      name: 'ml-service',
      cwd: './ml-service',
      script: 'app.py',
      interpreter: 'python',
      env: {
        ML_SERVICE_PORT: 3002,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 5,
      watch: false,
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: '.output/server/index.mjs',
      env: {
        PORT: 3000,
        HOST: '0.0.0.0',
        NUXT_PUBLIC_API_BASE: 'http://103.57.221.26:3001'
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false
    }
  ]
};
