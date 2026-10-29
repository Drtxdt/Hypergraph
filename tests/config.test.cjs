const { test } = require("node:test");
const assert = require("node:assert/strict");
const { merge, resolveConfig } = require("../lib/config.cjs");
test("nested overrides preserve defaults, arrays replace, false survives", () => {
  assert.deepEqual(
    merge(
      { a: { b: 1, c: 2 }, list: [1, 2], flag: true },
      { a: { b: 3 }, list: [4], flag: false },
    ),
    { a: { b: 3, c: 2 }, list: [4], flag: false },
  );
});
test("reject unknown paths, invalid types and incomplete integrations", () => {
  assert.throws(() => resolveConfig({ serach: true }), /serach/);
  assert.throws(() => resolveConfig({ search: "false" }), /search/);
  assert.throws(
    () => resolveConfig({ comments: { enable: true } }),
    /comments\/server/,
  );
  assert.throws(() => resolveConfig({ music: { enable: true } }), /music\/src/);
});
test("defaults do not mutate caller; features can be disabled", () => {
  const input = { search: false, music: { enable: false } };
  const output = resolveConfig(input);
  assert.equal(output.search, false);
  assert.equal(output.music.enable, false);
  assert.equal(input.layout, undefined);
  assert.equal(output.preset, "endfield");
  assert.equal(output.layout, undefined);
});
test("prototype keys rejected", () =>
  assert.throws(
    () => merge({}, JSON.parse('{"__proto__":{"bad":true}}')),
    /Unsafe/,
  ));
