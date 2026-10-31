import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    outDir: "source/assets",
    emptyOutDir: true,
    target: "es2022",
    minify: true,
    cssCodeSplit: true,
    manifest: "manifest.json",
    rollupOptions: {
      input: {
        main: "src/main.ts",
        "tool-worker": "src/modules/tool-worker.ts",
        "twikoo-frame": "src/twikoo-frame.ts",
        "legacy-comments": "src/legacy-comments.ts",
      },
      output: {
        entryFileNames: entry => entry.name === "tool-worker" ? "[name]-[hash].js" : "[name].js",
        chunkFileNames: "chunk-[name]-[hash].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
