import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = env.VITE_SERVER_PORT || 8080
  return  {
    plugins: [react()],
    build: {
      assetsDir: "./assets",
      outDir: '../pkg/frontend/dist',
      emptyOutDir: true,
    },
    server: {
      proxy: {
        "^/api/*": `http://localhost:${port}`,
        "^/status*": `http://localhost:${port}`,
        "^/diff*": `http://localhost:${port}`,
        "^/static*": `http://localhost:${port}`,
      },
    }
  }})

