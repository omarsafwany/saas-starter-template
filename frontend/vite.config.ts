import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Frontend code calls fetch("/api/...") and the backend actually
      // mounts its routers at that same /api prefix (see backend/src/app.ts:
      // app.use("/api/auth", ...), app.use("/api", apiRouter)) - only the
      // unauthenticated /health check lives outside /api. This is a
      // same-prefix passthrough: /api/auth/login forwards unchanged to
      // http://localhost:4000/api/auth/login.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // Unprefixed liveness check (backend/src/app.ts mounts it before
      // auth/rate-limit middleware, outside the /api namespace).
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
