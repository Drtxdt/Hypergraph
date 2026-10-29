"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const Ajv = require("ajv");
function loadExtensions(hexo) {
  const resolve = createRequire(path.join(hexo.base_dir, "package.json"));
  const extensions = [];
  const ids = new Set();
  for (const entry of hexo.theme.config.extensions) {
    if (!entry.enable) continue;
    const filename = resolve.resolve(entry.package),
      extension = resolve(entry.package);
    if (extension.apiVersion !== 1)
      throw Error(
        `Extension ${entry.package}: unsupported apiVersion ${extension.apiVersion}`,
      );
    if (extension.scope && !["page", "global"].includes(extension.scope))
      throw Error(`Extension ${entry.package}: scope must be page or global`);
    if (!/^[a-z][a-z0-9-]+$/.test(extension.id) || ids.has(extension.id))
      throw Error(`Invalid or duplicate extension ID: ${extension.id}`);
    ids.add(extension.id);
    const config = structuredClone(entry.config);
    const validate = new Ajv({ allErrors: true, useDefaults: true }).compile(
      extension.schema || { type: "object", additionalProperties: false },
    );
    if (!validate(config))
      throw Error(
        `Extension ${extension.id} configuration: ${JSON.stringify(validate.errors)}`,
      );
    const api = {
      version: 1,
      config,
      hexo,
      addTemplate: (name, source) => {
        if (!/^[a-z_-]+\.njk$/.test(name)) throw Error("Invalid template name");
        hexo.theme.setView(name, source);
      },
      addSlot: (slot, render) => {
        if (!["home:before", "post:after", "footer"].includes(slot))
          throw Error("Unknown slot " + slot);
        (hexo.hypergraph.slots[slot] ??= []).push(() => render(config));
      },
    };
    extension.setup?.(api);
    let runtime;
    if (extension.browser) {
      const file = path.resolve(path.dirname(filename), extension.browser);
      runtime = fs.readFileSync(file, "utf8");
    }
    extensions.push({
      id: extension.id,
      scope: extension.scope || "page",
      config,
      runtime,
    });
  }
  return extensions;
}
module.exports = { loadExtensions };
