import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888/.netlify/functions',
        changeOrigin: true,
        rewrite: (path) => {
          // /api/auth/login -> /auth-login
          const withoutApi = path.replace(/^\/api\//, '');
          return '/' + withoutApi.replace(/\//g, '-');
        },
      },
    },
  },
})
