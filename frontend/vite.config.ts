import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = (env.VITE_DEV_PROXY_TARGET || env.VITE_API_URL || 'http://127.0.0.1:8000')
    .replace(/\/api\/v1\/?$/, '')

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api/v1': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
