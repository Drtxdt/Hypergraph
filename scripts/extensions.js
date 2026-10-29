"use strict";
const { loadExtensions } = require("../lib/extensions.cjs");
hexo.hypergraph = { slots: {}, extensions: [] };
hexo.extend.filter.register(
  "before_generate",
  () => {
    if (hexo.hypergraph.loaded) return;
    hexo.hypergraph.extensions = loadExtensions(hexo);
    hexo.hypergraph.loaded = true;
  },
  2,
);
hexo.extend.helper.register("hg_slot", (slot) =>
  (hexo.hypergraph.slots[slot] || []).map((render) => render()).join("\n"),
);
hexo.extend.generator.register("hypergraph-extensions", () =>
  hexo.hypergraph.extensions
    .filter((e) => e.runtime)
    .map((e) => ({ path: `assets/extensions/${e.id}.js`, data: e.runtime })),
);
