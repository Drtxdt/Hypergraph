import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    outDir: "source/assets",
    emptyOutDir: true,
    target: "es2022",
    minify: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: "src/main.ts",
        "twikoo-frame": "src/twikoo-frame.ts",
        "legacy-comments": "src/legacy-comments.ts",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunk-[name]-[hash].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
