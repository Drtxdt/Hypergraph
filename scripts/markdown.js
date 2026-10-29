"use strict";
const MarkdownIt = require("markdown-it");
const { slugize, url_for } = require("hexo-util");
const path = require("node:path");
const { createRequire } = require("node:module");
const siteRequire = createRequire(path.join(hexo.base_dir, "package.json"));
const config = hexo.config.markdown || {};
const md = new MarkdownIt(config.preset || "default", {
  html: true,
  breaks: false,
  linkify: true,
  typographer: false,
  ...config.render,
});
md.use(require("markdown-it-footnote"));
for (const plugin of config.plugins || []) {
  const name = typeof plugin === "string" ? plugin : plugin.name;
  if (name === "markdown-it-footnote") continue;
  md.use(siteRequire(name), typeof plugin === "string" ? {} : plugin.options);
}
if (config.enable_rules) md.enable(config.enable_rules);
if (config.disable_rules) md.disable(config.disable_rules);
md.core.ruler.push("hypergraph-anchors", (state) => {
  const seen = new Map();
  const settings = { level: 2, case: 0, separator: "-", ...config.anchors };
  for (let i = 0; i < state.tokens.length; i++) {
    const token = state.tokens[i];
    if (
      token.type !== "heading_open" ||
      Number(token.tag.slice(1)) < settings.level
    )
      continue;
    const title = (state.tokens[i + 1].children || [])
      .map((t) => t.content)
      .join("");
    const base = slugize(title, { ...settings, transform: settings.case });
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    token.attrSet(
      "id",
      base + (count > 1 ? "-" + (settings.collisionSuffix || "") + count : ""),
    );
  }
});
md.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index];
  let src = token.attrGet("src");
  token.attrSet("alt", token.content);
  if (hexo.theme.config.resources?.lazy_images !== false)
    token.attrSet("loading", "lazy");
  token.attrSet("decoding", "async");
  if (src && !/^(?:[a-z]+:|\/\/|#)/i.test(src)) {
    if (env.postPath && !src.startsWith("/") && hexo.config.post_asset_folder) {
      const relative = path.relative(hexo.base_dir, env.postPath);
      const directory = relative.slice(0, -path.extname(relative).length);
      const candidates = [
        path.join(directory, src),
        path.join(
          directory,
          src.replace(
            new RegExp(
              "^" +
                path
                  .basename(directory)
                  .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
                "/",
            ),
            "",
          ),
        ),
      ].map((p) => p.replaceAll("\\", "/"));
      const asset = candidates
        .map((id) => hexo.model("PostAsset").findById(id))
        .find(Boolean);
      if (asset) src = asset.path;
    }
    token.attrSet("src", url_for.call(hexo, src));
  }
  return self.renderToken(tokens, index, options);
};
function render(data, options = {}) {
  hexo.execFilterSync("markdown-it:renderer", md);
  const env = { postPath: data.path };
  return options.inline
    ? md.renderInline(data.text, env)
    : md.render(data.text, env);
}
for (const extension of [
  "md",
  "markdown",
  "mkd",
  "mkdn",
  "mdwn",
  "mdtxt",
  "mdtext",
])
  hexo.extend.renderer.register(extension, "html", render, true);
