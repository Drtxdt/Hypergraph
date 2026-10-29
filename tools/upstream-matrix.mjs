import fs from "node:fs/promises";
import yaml from "js-yaml";
const upstreams = [
  [
    "butterfly",
    "jerryc127/hexo-theme-butterfly",
    "f223b1888b42b2b336068e6c959ed90a3cd7c8f3",
  ],
  [
    "anzhiyu",
    "anzhiyu-c/hexo-theme-anzhiyu",
    "72439d93936b63da59a4a1195f64de9f952f6cc1",
  ],
];
await fs.mkdir("docs/upstream", { recursive: true });
const rows = [];
for (const [name, repo, sha] of upstreams) {
  const url = `https://raw.githubusercontent.com/${repo}/${sha}/_config.yml`;
  let raw;
  try {
    raw = await fs.readFile(`docs/upstream/${name}.yml`, "utf8");
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw Error(`${url}: ${response.status}`);
    raw = await response.text();
    await fs.writeFile(`docs/upstream/${name}.yml`, raw);
  }
  const config = yaml.load(raw);
  for (const key of Object.keys(config))
    rows.push({
      id: `${name}.${key}`,
      source: `https://github.com/${repo}/blob/${sha}/_config.yml`,
      key,
      equivalence: "待审查",
      configuration: null,
      loading: null,
      acceptance: null,
      status: "pending",
    });
}
await fs.writeFile("docs/feature-matrix.json", JSON.stringify(rows, null, 2));
console.log(
  `Recorded ${rows.length} source configuration groups; none automatically marked complete.`,
);
