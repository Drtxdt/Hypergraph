const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { loadExtensions } = require("../lib/extensions.cjs");
test("reject future SDK, validate package config, ignore disabled package", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hypergraph-sdk-"));
  fs.writeFileSync(path.join(dir, "package.json"), "{}");
  const api = {
    base_dir: dir,
    theme: {
      config: { extensions: [{ package: "not-installed", enable: false }] },
    },
    hypergraph: { slots: {} },
  };
  assert.deepEqual(loadExtensions(api), []);
  fs.mkdirSync(path.join(dir, "node_modules/test-extension"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(dir, "node_modules/test-extension/index.js"),
    'module.exports={id:"test-extension",apiVersion:2};',
  );
  api.theme.config.extensions = [
    { package: "test-extension", enable: true, config: {} },
  ];
  assert.throws(() => loadExtensions(api), /unsupported apiVersion/);
  const resolved = fs.realpathSync(dir);
  assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
  fs.rmSync(resolved, { recursive: true });
});
