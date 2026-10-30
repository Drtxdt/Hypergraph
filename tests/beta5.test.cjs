const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { normalize } = require("../lib/collections.cjs");
const { resolveConfig } = require("../lib/config.cjs");
function moduleFrom(file) {
  const exports = {};
  vm.runInNewContext(
    ts.transpile(fs.readFileSync(file, "utf8"), {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    }),
    { exports, TextEncoder, TextDecoder, atob, btoa },
  );
  return exports;
}
test("default navigation is usable and explicit arrays and disabled pages survive", () => {
  const c = resolveConfig({});
  assert.equal(c.menu.length, 8);
  for (const entry of c.menu)
    if (entry.page) assert.equal(c.pages[entry.page].enable, true);
  assert.equal(resolveConfig({ menu: [] }).menu.length, 0);
  assert.equal(
    resolveConfig({ pages: { tools: { enable: false } } }).pages.tools.enable,
    false,
  );
  assert.throws(() =>
    resolveConfig({ menu: [{ label: "bad", page: "about", url: "/" }] }),
  );
});
test("structured collections preserve old arrays and reject unstable albums", () => {
  assert.equal(
    normalize("friends", [{ title: "Friend" }]).groups[0].items[0].title,
    "Friend",
  );
  assert.throws(
    () =>
      normalize("gallery", {
        albums: [
          { slug: "one", photos: [] },
          { slug: "one", photos: [] },
        ],
      }),
    /duplicate slug/,
  );
  assert.throws(() => normalize("about", { projects: "wrong" }), /projects/);
  assert.equal(
    normalize("tools", { links: [{ title: "Local", url: "/" }] }).links[0]
      .group,
    "",
  );
});
test("2048 merges each tile once and detects directional changes", () => {
  const { slide } = moduleFrom("src/modules/game-rules.ts");
  const a = slide([2, 2, 2, 2, ...Array(12).fill(0)], 0);
  assert.deepEqual(Array.from(a.board.slice(0, 4)), [4, 4, 0, 0]);
  assert.equal(a.score, 8);
  assert.equal(slide([1024, 1024, ...Array(14).fill(0)], 0).board[0], 2048);
  const terminal = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  for (const direction of [0, 1, 2, 3])
    assert.equal(slide(terminal, direction).changed, false);
  assert.equal(slide([2, 0, 0, 0, ...Array(12).fill(0)], 0).changed, false);
  assert.deepEqual(
    Array.from(slide([2, 2, 4, 0, ...Array(12).fill(0)], 2).board.slice(0, 4)),
    [0, 0, 4, 4],
  );
});
test("mines protect the initial neighborhood; flood reveal honors flags", () => {
  const { neighbors, seedMines, reveal } = moduleFrom(
    "src/modules/game-rules.ts",
  );
  const mines = seedMines(40, () => 0.5);
  assert.equal(new Set(mines).size, 10);
  for (const n of [40, ...neighbors(40)]) assert.ok(!mines.includes(n));
  assert.deepEqual(Array.from(reveal(1, [], [], [1])), []);
  assert.equal(reveal(40, [], [], []).length, 81);
});
test("tools handle Unicode, invalid encodings, JSON and input limits", () => {
  const { calculate } = moduleFrom("src/modules/tool-operations.ts");
  const text = "终末地 🌏";
  assert.equal(
    calculate("base64_decode", calculate("base64_encode", text)),
    text,
  );
  assert.equal(calculate("url_decode", calculate("url_encode", text)), text);
  assert.throws(() => calculate("format", "{"));
  assert.throws(() => calculate("url_decode", "%xx"));
  assert.throws(() => calculate("count", "a".repeat(1048577)), /LIMIT/);
  assert.equal(JSON.parse(calculate("count", "你好 hello\nworld")).chinese, 2);
});
