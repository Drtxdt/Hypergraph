const test = require("node:test");
const assert = require("node:assert/strict");
const { siteLink } = require("../lib/site-link.cjs");
test("site links resolve fragments and root-relative paths consistently", () => {
  for (const root of ["/", "/blog/"]) {
    const config = {
      root,
      url: "https://example.com" + root.replace(/\/$/, ""),
    };
    assert.equal(siteLink("#latest", config), root + "#latest");
    assert.equal(siteLink("archives/#year", config), root + "archives/#year");
    assert.equal(siteLink("/archives/#year", config), root + "archives/#year");
    assert.equal(siteLink(root + "#latest", config), root + "#latest");
    assert.equal(
      siteLink("https://other.example/path", config),
      "https://other.example/path",
    );
    assert.equal(siteLink("javascript:alert(1)", config), "#");
  }
});
const { resolveConfig } = require("../lib/config.cjs");
test("beta7 decorative defaults and explicit disabling remain independent", () => {
  const c = resolveConfig({});
  assert.deepEqual(c.appearance.contour, {
    enable: true,
    style: "terrain",
    opacity: 0.18,
    scope: "site",
  });
  assert.equal(c.appearance.laser_print, true);
  assert.equal(c.home.masthead.artwork.enable, true);
  const off = resolveConfig({
    appearance: {
      show_cover: false,
      laser_print: false,
      contour: { enable: false },
    },
    home: { masthead: { artwork: { enable: false } } },
  });
  assert.equal(off.appearance.contour.enable, false);
  assert.equal(off.home.masthead.artwork.enable, false);
  assert.throws(() =>
    resolveConfig({ appearance: { contour: { opacity: 2 } } }),
  );
  assert.throws(() =>
    resolveConfig({ appearance: { contour: { style: "unknown" } } }),
  );
});
const vm = require("node:vm");
const fs = require("node:fs");
test("generated home links accept valid subdirectory anchors and reject missing targets", async () => {
  for (const [link, valid] of [
    ["#latest", true],
    ["/archives/", true],
    ["#absent", false],
    ["/absent/", false],
  ]) {
    let callback;
    const hexo = {
      config: { url: "https://example.com/blog", root: "/blog/" },
      theme: {
        config: {
          home: { masthead: { action: { url: link } }, topics: "auto" },
        },
      },
      extend: { filter: { register: (name, fn) => (callback = fn) } },
      route: {
        list: () => ["index.html", "archives/index.html"],
        get: () => [Buffer.from('<section id="latest"></section>')],
      },
    };
    vm.runInNewContext(
      fs.readFileSync(require.resolve("../scripts/home-links.js"), "utf8"),
      { hexo, URL, require: () => ({ siteLink }) },
    );
    if (valid) await callback();
    else await assert.rejects(callback, /missing anchor|no generated target/);
  }
});
