import fs from "node:fs/promises";
import yaml from "js-yaml";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveConfig } = require("../lib/config.cjs");
const defaults = resolveConfig(
  yaml.load(await fs.readFile("_config.yml", "utf8")),
);
await fs.writeFile(
  "docs/config-reference.yml",
  "# Generated from config.schema.json; copy only the overrides you need.\n" +
    yaml.dump(defaults, { lineWidth: 100, noRefs: true }),
);
const rows = JSON.parse(await fs.readFile("docs/feature-matrix.json", "utf8"));
const escape = (s) =>
  String(s || "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
await fs.writeFile(
  "docs/FEATURES.md",
  "# 功能对照\n\n固定源版本为 Butterfly 5.7.0 与 Anzhiyu 1.7.1。以下记录能力如何通过 Hypergraph 的新配置实现；视觉和标签参数不逐字复制旧主题。配置组的实现状态不等于已验证每一个外部服务账号。评论服务的自动化覆盖适配器加载、生命周期和失败隔离，Waline 另外执行 SQLite 实际读写。\n\n| 原始配置 | 新配置 | 对应行为 | 加载条件 | 验收入口 |\n|---|---|---|---|---|\n" +
    rows
      .map(
        (r) =>
          `| [${r.id}](${r.source}) | ${escape(r.configuration)} | ${escape(r.equivalence)} | ${escape(r.loading)} | ${escape(r.acceptance)} |`,
      )
      .join("\n") +
    "\n",
);
console.log("Generated complete configuration reference and source matrix.");
