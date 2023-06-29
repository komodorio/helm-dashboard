import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: "./assets",
    outDir: '../pkg/frontend/dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
       "^/api/*": "http://localhost:8080",
       "^/status*": "http://localhost:8080",
       "^/diff*": "http://localhost:8080",
    },
  }
})