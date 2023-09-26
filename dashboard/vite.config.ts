import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = env.VITE_SERVER_PORT || 8080;
  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'public/analytics.js',
            dest: "assets/",
          },
          {
            src: 'public/openapi.json',
            dest: "assets/",
          },
          {
            src: 'public/logo.svg',
            dest: "assets/",
          },
        ]
      })
    ],
    build: {
      assetsDir: "./assets/",
      outDir: "../pkg/frontend/dist",
      emptyOutDir: true,
    },
    server: {
      proxy: {
        "^/api/.*": `http://127.0.0.1:${port}`,
        "^/status*": `http://127.0.0.1:${port}`,
        "^/diff*": `http://127.0.0.1:${port}`,
        "^/static*": `http://127.0.0.1:${port}`,
      },
    },
  };
});
