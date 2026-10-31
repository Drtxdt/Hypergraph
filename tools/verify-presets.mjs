import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import yaml from "js-yaml";
const root = ".local/completion";
const file = root + "/_config.hypergraph.yml";
const original = await fs.readFile(file, "utf8");
const results = [];
function generate() {
  const result = spawnSync(
    process.execPath,
    ["tools/generate-site.mjs", root],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw Error(result.stdout + result.stderr);
}
try {
  for (const [preset, layout] of [
    ["industrial", "editorial"],
    ["ledger", "compact"],
    ["reading", "reading"],
  ]) {
    await fs.writeFile(
      file,
      yaml.dump({
        preset,
        comments: { enable: false },
        home: { sections: ["posts", "masthead"], featured: false },
        sidebar: { enable: false },
        navigation: false,
        search: false,
        lightbox: false,
        tools: { back_to_top: false, keyboard: false },
      }),
    );
    generate();
    const html = await fs.readFile(root + "/public/index.html", "utf8");
    assert.ok(html.includes("layout-" + layout));
    assert.ok(html.indexOf('id="latest"') < html.indexOf('class="intro"'));
    assert.ok(!html.includes('class="featured"'));
    assert.ok(!html.includes('id="search-dialog"'));
    results.push({
      preset,
      layout,
      explicitOverrides: true,
      sectionOrder: true,
    });
  }
  const dir = root + "/node_modules/hypergraph-preset-fixture";
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    dir + "/package.json",
    JSON.stringify({
      name: "hypergraph-preset-fixture",
      version: "1.0.0",
      main: "index.cjs",
    }),
  );
  await fs.writeFile(
    dir + "/index.cjs",
    'module.exports={id:"preset-fixture",apiVersion:1,presets:{custom:{config:{layout:"reading"},templates:{"index.njk":"<h1 id=custom-composition>Independent preset</h1>"}}}};',
  );
  await fs.writeFile(
    file,
    yaml.dump({
      preset: "custom",
      extensions: [
        { package: "hypergraph-preset-fixture", enable: true, config: {} },
      ],
    }),
  );
  generate();
  const html = await fs.readFile(root + "/public/index.html", "utf8");
  assert.match(html, /Independent preset/);
  assert.ok(html.includes("layout-reading"));
  results.push({ preset: "npm package custom", templateReplaced: true });
  await fs.writeFile(
    dir + "/package.json",
    JSON.stringify({
      name: "hypergraph-preset-fixture",
      version: "1.1.0",
      main: "index.cjs",
    }),
  );
  generate();
  assert.match(
    await fs.readFile(root + "/public/index.html", "utf8"),
    /Independent preset/,
  );
  results.push({
    extensionUpgrade: "1.0.0 to 1.1.0",
    apiVersion: 1,
    compatible: true,
  });
} finally {
  await fs.writeFile(file, original);
  generate();
}
await fs.writeFile(
  ".local/preset-verification.json",
  JSON.stringify(results, null, 2),
);
console.log(
  "Three presets, override ordering, independent template package and compatible upgrade passed.",
);
