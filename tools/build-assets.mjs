import fs from "node:fs/promises";
await fs.mkdir("src/fonts", { recursive: true });
await fs.copyFile(
  "node_modules/@fontsource/archivo/files/archivo-latin-600-normal.woff2",
  "src/fonts/archivo-latin-600-normal.woff2",
);
await fs.copyFile(
  "node_modules/@fontsource/archivo/files/archivo-latin-800-normal.woff2",
  "src/fonts/archivo-latin-800-normal.woff2",
);
const { build } = await import("vite");
await build();
// Ship the exact compressed critical assets used by the static-host benchmark.
// Hosts without gzip_static can serve the original files unchanged.
const { gzipSync } = await import("node:zlib");
for (const name of ["main.css", "main.js"]) {
  const file = "source/assets/" + name;
  await fs.writeFile(file + ".gz", gzipSync(await fs.readFile(file), { level: 9 }));
}
await fs.mkdir("source/assets/katex", { recursive: true });
await fs.copyFile(
  "node_modules/katex/dist/katex.min.css",
  "source/assets/katex/katex.min.css",
);
await fs.cp("node_modules/katex/dist/fonts", "source/assets/katex/fonts", {
  recursive: true,
});
await fs.copyFile(
  "node_modules/katex/LICENSE",
  "source/assets/katex/LICENSE.txt",
);
await fs.copyFile(
  "node_modules/@fontsource/archivo/LICENSE",
  "source/assets/FONT-LICENSE.txt",
);
await fs.mkdir("source/assets/vendor", { recursive: true });
for (const file of ["gitalk.min.js", "gitalk.css"])
  await fs.copyFile("vendor/gitalk/" + file, "source/assets/vendor/" + file);
await fs.cp("vendor/gitalk/LICENSE", "source/assets/vendor/GITALK-LICENSE.txt");
await fs.mkdir("source/licenses", { recursive: true });
await fs.copyFile(
  "vendor/valine-source-v1.5.3.zip",
  "source/licenses/valine-source-v1.5.3.zip",
);
