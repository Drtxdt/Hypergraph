import fs from "node:fs/promises";
import yaml from "js-yaml";
const file = ".local/demo/_config.hypergraph.yml";
let config = {};
try {
  config = yaml.load(await fs.readFile(file, "utf8")) || {};
} catch {}
config.extensions = [
  {
    package: "hypergraph-extension-reading-note",
    enable: process.argv[2] !== "off",
    config: { text: "独立扩展已挂载 / Independent extension mounted" },
  },
];
await fs.writeFile(file, yaml.dump(config));
