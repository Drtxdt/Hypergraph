import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
const root = path.resolve(".local/blog");
const config = yaml.load(
  await fs.readFile(path.join(root, "_config.yml"), "utf8"),
);
config.index_generator = { ...config.index_generator, order_by: "-date" };
await fs.writeFile(
  path.join(root, "_config.yml"),
  yaml.dump(config, { lineWidth: -1 }),
);
await fs.writeFile(
  path.join(root, "_config.hypergraph.yml"),
  yaml.dump({
    home: {
      title: "记录当下，连接未知。",
      description: "算法与开发笔记，日常生活，以及尚未完成的探索。",
    },
    music: { enable: true, src: "/audio/bgm.mp3", title: "铃兰的背景音乐" },
  }),
);
