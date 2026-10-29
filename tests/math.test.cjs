const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderMath } = require("../lib/math.cjs");
test("math engines each render once; off retains delimiters", () => {
  assert.match(renderMath("x^2", false, "katex"), /class="katex"/);
  const svg = renderMath("x^2", true, "mathjax");
  assert.match(svg, /<svg/);
  assert.doesNotMatch(svg, /class="katex"/);
  assert.equal(renderMath("x^2", true, "off"), "$$x^2$$");
});
