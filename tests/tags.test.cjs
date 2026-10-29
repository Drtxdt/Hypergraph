const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
function tags() {
  const registry = new Map();
  const hexo = {
    config: { root: "/" },
    render: {
      renderSync: ({ text }) =>
        new (require("markdown-it"))({ html: true }).render(text),
    },
    extend: {
      tag: {
        register: (name, fn, options) => registry.set(name, { fn, options }),
      },
      filter: { register: () => {} },
    },
  };
  for (const file of ["tags.js", "content-tags.js"])
    vm.runInNewContext(fs.readFileSync("scripts/" + file, "utf8"), {
      hexo,
      require: createRequire(path.resolve("scripts/" + file)),
    });
  return registry;
}
test("all fixed Anzhiyu content tag names have handlers", () => {
  const registry = tags();
  for (const source of require("../docs/upstream/tag-inventory.json"))
    for (const name of source.tags) assert.ok(registry.has(name), name);
});
test("tag output escapes text and rejects executable link protocols", () => {
  const registry = tags();
  const result = registry
    .get("link")
    .fn(["<script>,", "javascript:alert(1),", "x"]);
  assert.ok(!result.includes("<script>"));
  assert.ok(!result.includes('href="javascript:'));
  assert.match(
    registry.get("radio").fn(["checked,", "a"]),
    /type="radio" checked/,
  );
  assert.throws(() => registry.get("dogeplayer").fn(["bad", "bad"]), /numeric/);
});
