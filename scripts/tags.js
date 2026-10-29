const words = require("../lib/i18n.cjs");
const text = (key) =>
  words[String(hexo.config.language).startsWith("en") ? "en" : "zh-CN"][key];
("use strict");
const { escape, json } = require("../lib/utils.cjs");
const markdown = (text) => hexo.render.renderSync({ text, engine: "markdown" });
const safeURL = (value) =>
  /^(?:https?:\/\/|\/|#|\.\.?\/)/i.test(value || "")
    ? escape(require("hexo-util").url_for.call(hexo, value))
    : "#";
for (const name of ["note", "tip", "subnote"])
  hexo.extend.tag.register(
    name,
    (args, content) =>
      `<aside class="admonition"><strong>${escape(args.join(" "))}</strong>${markdown(content)}</aside>`,
    { ends: true },
  );
for (const name of ["folding", "hideBlock"])
  hexo.extend.tag.register(
    name,
    (args, content) =>
      `<details class="content-fold"><summary>${escape(args.join(" ") || text("reveal"))}</summary>${markdown(content)}</details>`,
    { ends: true },
  );
hexo.extend.tag.register("button", (args) => {
  const [label, href] = args
    .join(" ")
    .split(",")
    .map((x) => x.trim());
  return `<a class="content-button" href="${safeURL(href)}">${escape(label)}</a>`;
});
hexo.extend.tag.register(
  "label",
  (args) => `<mark>${escape(args.join(" "))}</mark>`,
);
for (const type of ["checkbox", "radio"])
  hexo.extend.tag.register(type, (args) => {
    const values = args.join(" ").split(",");
    const checked = values.length > 1 && values[0].includes("checked");
    return `<label class="content-checkbox"><input type="${type}" ${checked ? "checked" : ""}> ${escape(values.length > 1 ? values.slice(1).join(",") : values[0])}</label>`;
  });
hexo.extend.tag.register(
  "audio",
  (args) => `<audio controls preload="none" src="${safeURL(args[0])}"></audio>`,
);
hexo.extend.tag.register(
  "video",
  (args) =>
    `<video controls preload="none" src="${safeURL(args[0])}" ${args[1] ? `poster="${safeURL(args[1])}"` : ""}></video>`,
);
hexo.extend.tag.register(
  "gallery",
  (args, content) => `<div class="gallery">${markdown(content)}</div>`,
  { ends: true },
);
hexo.extend.tag.register(
  "timeline",
  (args, content) => {
    const items = [
      ...content.matchAll(
        /<!--\s*timeline\s+(.*?)\s*-->([\s\S]*?)<!--\s*endtimeline\s*-->/g,
      ),
    ];
    return `<section class="timeline"><h3>${escape(args.join(" ").split(",")[0])}</h3>${items.length ? items.map(([, title, body]) => `<section><h4>${escape(title)}</h4>${markdown(body)}</section>`).join("") : markdown(content)}</section>`;
  },
  { ends: true },
);
for (const name of ["tabs", "subtabs", "subsubtabs"])
  hexo.extend.tag.register(
    name,
    (args, content) => {
      const blocks = content.split(/<!--\s*tab\s+([^>]+?)\s*-->/g);
      let html = '<div class="content-tabs">';
      for (let i = 1; i < blocks.length; i += 2)
        html += `<details ${i === 1 ? "open" : ""}><summary>${escape(blocks[i])}</summary>${markdown(blocks[i + 1].replace(/<!--\s*endtab\s*-->/g, ""))}</details>`;
      return html + "</div>";
    },
    { ends: true },
  );
for (const name of ["mermaid", "chartjs", "score"])
  hexo.extend.tag.register(
    name,
    (_args, content) => {
      let options = {};
      if (name === "score" && content.includes("------")) {
        const [parameters, ...body] = content.split("------");
        options = JSON.parse(parameters);
        content = body.join("------");
      }
      return `<div class="diagram" data-diagram="${name}"><pre>${escape(content)}</pre><script type="application/json" data-source>${json(content)}</script><script type="application/json" data-options>${json(options)}</script><p role="status"></p></div>`;
    },
    { ends: true },
  );
hexo.extend.filter.register(
  "before_post_render",
  (data) => {
    data.content = data.content.replace(
      /^```mermaid[^\n]*\n([\s\S]*?)^```\s*$/gm,
      (_match, body) => `{% mermaid %}\n${body}\n{% endmermaid %}`,
    );
    return data;
  },
  1,
);
