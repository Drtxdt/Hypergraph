import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
const root = path.resolve(".local/integrations");
await fs.mkdir(root, { recursive: true });
for (const name of [
  "source",
  "themes",
  "package.json",
  "node_modules",
  "_config.yml",
])
  await fs.cp(path.join(".local/demo", name), path.join(root, name), {
    recursive: true,
  });
const settings = {
  external_search: {
    enable: true,
    app_id: "TESTAPP",
    search_key: "public-test-key",
    index: "posts",
  },
  ai_summary: { enable: true, endpoint: "http://127.0.0.1:4177/api/summary" },
  pages: {
    fcircle: {
      enable: true,
      title: "Feed",
      endpoint: "http://127.0.0.1:4177/api/feed",
    },
  },
  analytics: [{ provider: "google", id: "G-TEST" }],
  chat: { enable: true, provider: "crisp", id: "test-workspace" },
  colors: { accent: "#aabb33" },
  code: { copy: false },
  tools: { back_to_top: false, keyboard: false },
};
await fs.writeFile(
  path.join(root, "_config.hypergraph.yml"),
  yaml.dump(settings),
);
console.log("Prepared mocked service integration preview.");
