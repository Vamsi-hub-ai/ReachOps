import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from "path"
import { netlifyFunctionsDevPlugin } from './src/vite-api-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    netlifyFunctionsDevPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
})
