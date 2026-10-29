"use strict";
const fs = require("node:fs");
const fm = require("hexo-front-matter");
const katex = require("katex");
const cache = new Map();
function engineFor(file, fallback) {
  if (!file || !fs.existsSync(file)) return fallback;
  const stat = fs.statSync(file);
  const previous = cache.get(file);
  if (previous?.mtime === stat.mtimeMs && previous.fallback === fallback)
    return previous.engine;
  const metadata = fm.parse(fs.readFileSync(file, "utf8"));
  const engine = metadata.math_engine || fallback;
  if (!["katex", "mathjax", "off"].includes(engine))
    throw Error(`${file}: math_engine must be katex, mathjax or off`);
  cache.set(file, { mtime: stat.mtimeMs, fallback, engine });
  return engine;
}
let mj;
function renderMath(text, display, engine) {
  if (engine === "off")
    return (
      (display ? "$$" : "$") +
      require("./utils.cjs").escape(text) +
      (display ? "$$" : "$")
    );
  if (engine === "katex")
    return katex.renderToString(text, {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  if (!mj) {
    const { mathjax } = require("mathjax-full/js/mathjax.js");
    const { TeX } = require("mathjax-full/js/input/tex.js");
    const { SVG } = require("mathjax-full/js/output/svg.js");
    const { liteAdaptor } = require("mathjax-full/js/adaptors/liteAdaptor.js");
    const { RegisterHTMLHandler } = require("mathjax-full/js/handlers/html.js");
    const { AllPackages } = require("mathjax-full/js/input/tex/AllPackages.js");
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    mj = { mathjax, TeX, SVG, adaptor, AllPackages };
  }
  const doc = mj.mathjax.document("", {
    InputJax: new mj.TeX({ packages: mj.AllPackages }),
    OutputJax: new mj.SVG({ fontCache: "none" }),
  });
  return mj.adaptor.outerHTML(doc.convert(text, { display }));
}
module.exports = { engineFor, renderMath };
