const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const context = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/modules/print-geometry.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  context,
);
const { objectGeometry: g, positionOffset } = context.exports;
test("print projection uses contain/cover scale and percentage/edge offsets", () => {
  const box = (...a) => JSON.parse(JSON.stringify(g(...a)));
  assert.deepEqual(box(600, 400, 1200, 400, "contain", "0% 0%"), {
    x: 0,
    y: 0,
    width: 600,
    height: 200,
  });
  assert.deepEqual(box(600, 400, 1200, 400, "contain", "right bottom"), {
    x: 0,
    y: 200,
    width: 600,
    height: 200,
  });
  assert.ok(
    Math.abs(
      box(600, 400, 400, 1200, "contain", "100% 0%").x - (600 - 400 / 3),
    ) < 1e-9,
  );
  assert.deepEqual(box(600, 400, 1200, 400, "cover", "100% 50%"), {
    x: -600,
    y: 0,
    width: 1200,
    height: 400,
  });
  assert.deepEqual(
    box(600, 400, 1200, 400, "contain", "right 10px bottom 20px"),
    { x: -10, y: 180, width: 600, height: 200 },
  );
  assert.equal(positionOffset("calc(100% - 20px)", 200), 180);
});
