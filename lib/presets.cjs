"use strict";
const path = require("node:path");
const { createRequire } = require("node:module");
const official = { endfield: { config: { sidebar: { enable: false } } } };
function getPreset(name = "endfield", extensions = [], baseDir) {
  if (official[name]) return official[name];
  const requireFromSite = createRequire(path.join(baseDir, "package.json"));
  for (const entry of extensions) {
    if (entry.enable === false) continue;
    const extension = requireFromSite(entry.package);
    if (extension.apiVersion !== 1) continue;
    const preset = extension.presets?.[name];
    if (preset) return preset;
  }
  throw Error(`Hypergraph /preset: unknown preset ${name}`);
}
module.exports = { getPreset };
