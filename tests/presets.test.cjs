const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { getPreset } = require("../lib/presets.cjs");
const { merge, resolveConfig } = require("../lib/config.cjs");
test("official presets change composition while explicit overrides win", () => {
  const preset = getPreset("endfield");
  const config = resolveConfig(
    merge(preset.config, { home: { featured: true } }),
  );
  assert.equal(config.preset, "endfield");
  assert.equal(config.home.featured, true);
  assert.equal(getPreset("endfield").config.sidebar.enable, false);
  assert.throws(()=>getPreset("industrial",[],process.cwd()),/unknown preset/);
  assert.throws(
    () => getPreset("unknown", [], process.cwd()),
    /unknown preset/,
  );
});
test("installed extensions can supply complete template presets; disabled extensions cannot", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "hg-preset-"));
  try {
    fs.writeFileSync(path.join(root, "package.json"), "{}");
    const dir = path.join(root, "node_modules/test-preset");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "index.js"),
      'module.exports={apiVersion:1,presets:{custom:{config:{sidebar:{enable:false}},templates:{"index.njk":"<h1>Custom composition</h1>"}}}}',
    );
    const preset = getPreset(
      "custom",
      [{ package: "test-preset", enable: true }],
      root,
    );
    assert.match(preset.templates["index.njk"], /Custom composition/);
    assert.throws(
      () =>
        getPreset("custom", [{ package: "test-preset", enable: false }], root),
      /unknown preset/,
    );
  } finally {
    const target = fs.realpathSync(root);
    assert.ok(target.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(target, { recursive: true });
  }
});
