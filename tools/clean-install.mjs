import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve(".local/install-v1");
await fs.mkdir(path.join(root, "source/_posts"), { recursive: true });
const themePath = path
  .resolve("dist/hexo-theme-hypergraph-1.0.0.tgz")
  .replaceAll("\\", "/");
await fs.writeFile(
  path.join(root, "package.json"),
  JSON.stringify(
    {
      name: "hypergraph-clean-install",
      private: true,
      hexo: { version: "7.3.0" },
      dependencies: {
        hexo: "7.3.0",
        "hexo-theme-hypergraph": "file:" + themePath,
        "hexo-generator-index": "^4.0.0",
        "hexo-generator-archive": "^2.0.0",
        "hexo-generator-category": "^2.0.0",
        "hexo-generator-tag": "^2.0.0",
      },
      overrides: {
        "markdown-it": "^14.3.3",
        "linkify-it": "^5.0.2",
        yaml: "^2.8.3",
      },
    },
    null,
    2,
  ),
);
await fs.copyFile(".local/demo/_config.yml", path.join(root, "_config.yml"));
await fs.copyFile(
  ".local/demo/source/_posts/welcome.md",
  path.join(root, "source/_posts/welcome.md"),
);
console.log(
  "Prepared clean install using packed theme, without copied node_modules.",
);
