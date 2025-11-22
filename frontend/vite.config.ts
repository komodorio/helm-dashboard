import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = env.VITE_SERVER_PORT || 8080;
  return {
    base: env.VITE_BASE_PATH || "/",
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
      proxy: (() => {
        const base = (env.VITE_BASE_PATH || "/").replace(/\/$/, "");
        const target = `http://127.0.0.1:${port}`;
        // Support both with and without base for local dev convenience
        return {
          "^/api/.*": target,
          "^/status*": target,
          "^/diff*": target,
          "^/static*": target,
          ...(base
            ? {
                [`^${base}/api/.*`]: target,
                [`^${base}/status*`]: target,
                [`^${base}/diff*`]: target,
                [`^${base}/static*`]: target,
              }
            : {}),
        } as Record<string, string>;
      })(),
    },
  };
});
