import fs from "node:fs";
import path from "path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

function copyAssetsToDist(): Plugin {
  let outDir = "";
  let assetsSrc = "";
  return {
    name: "copy-assets-to-dist",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      assetsSrc = path.resolve(config.root, "assets");
    },
    closeBundle() {
      if (!fs.existsSync(assetsSrc)) return;
      const assetsDest = path.join(outDir, "assets");
      fs.mkdirSync(outDir, { recursive: true });
      fs.cpSync(assetsSrc, assetsDest, { recursive: true });
    },
  };
}

export default defineConfig(async () => ({
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [copyAssetsToDist()],
  build: {
    outDir: "dist",
    target: "esnext",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        version: path.resolve(__dirname, "dialogs/version.html"),
        "codec-version": path.resolve(__dirname, "dialogs/codec-version.html"),
        settings: path.resolve(__dirname, "dialogs/settings.html"),
        "save_load": path.resolve(__dirname, "dialogs/save_load.html"),
      },
    },
  },
}));
