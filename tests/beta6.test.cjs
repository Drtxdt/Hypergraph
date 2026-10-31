const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveConfig } = require("../lib/config.cjs");
const { normalize } = require("../lib/collections.cjs");
test("beta6 masthead defaults and explicit disabling are independent of article covers", () => {
  const c = resolveConfig({});
  assert.deepEqual(c.home.sections, ["masthead", "featured", "posts"]);
  assert.equal(c.home.masthead.enable, true);
  assert.equal(c.background.mode, "frame");
  assert.equal(c.background.image.src, "");
  assert.equal(c.home.masthead.image.src, "");
  assert.equal(c.page_banner.height, 260);
  assert.deepEqual(
    resolveConfig({ home: { sections: [], topics: [] } }).home.sections,
    [],
  );
  assert.equal(
    resolveConfig({ appearance: { show_cover: false } }).home.masthead.enable,
    true,
  );
});
test("beta6 rejects deprecated fields and malformed image configuration", () => {
  for (const c of [
    { appearance: { hero: {} } },
    { appearance: { taxonomy_banners: {} } },
    { home: { sections: ["intro"] } },
    { background: { image: "old.jpg" } },
    { home: { masthead: { image: { fit: "stretch" } } } },
  ])
    assert.throws(() => resolveConfig(c));
  assert.throws(() =>
    resolveConfig({
      home: { topics: Array(4).fill({ title: "x", url: "/" }) },
    }),
  );
});
test("structured pages have no array fallback; unrelated collections retain arrays", () => {
  for (const type of ["about", "friends", "gallery"]) {
    assert.throws(() => normalize(type, []), new RegExp("/" + type));
    assert.deepEqual(normalize(type).albums, []);
  }
  assert.equal(normalize("essay", [{ title: "note" }]).items.length, 1);
  assert.throws(() => normalize("about", { sections: "invalid" }), /sections/);
});
