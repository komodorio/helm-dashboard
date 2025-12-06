import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import flowbiteReact from "flowbite-react/plugin/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = env.VITE_SERVER_PORT || 8080;
  return {
    plugins: [
      react(),
      tailwindcss(),
      flowbiteReact(),
      visualizer({
        filename: "../pkg/frontend/dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
      viteStaticCopy({
        targets: [
          {
            src: "public/analytics.js",
            dest: "assets/",
          },
          {
            src: "public/openapi.json",
            dest: "assets/",
          },
          {
            src: "public/logo.svg",
            dest: "assets/",
          },
        ],
      }),
    ],
    build: {
      assetsDir: "./assets/",
      outDir: "../pkg/frontend/dist",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router", "flowbite-react"],
          },
        },
      },
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
