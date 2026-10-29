"use strict";
hexo.extend.tag.register(
  "warning",
  (args, content) => {
    const { escape } = require("../lib/utils.cjs");
    const raw = args.join(" ");
    const brackets = [...raw.matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]);
    const title = brackets[0] || raw || "提示";
    const body = hexo.render.renderSync({ text: content, engine: "markdown" });
    return brackets.length
      ? `<details class="admonition" ${brackets.includes("open") ? "open" : ""}><summary>${escape(title)}</summary>${body}</details>`
      : `<aside class="admonition"><strong>${escape(title)}</strong>${body}</aside>`;
  },
  { ends: true },
);
hexo.extend.tag.register(
  "linkcard",
  (_args, content) => {
    const items = hexo.render.renderSync({ text: content, engine: "yaml" });
    const escape = (x) =>
      String(x ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    return (
      '<div class="collection">' +
      Object.entries(items || {})
        .map(([label, item]) => {
          let href = String(item.src || "");
          if (!/^(https?:)?\/\//i.test(href)) href = "https://" + href;
          const image = item.img || item.avatar;
          return (
            '<article class="collection-card">' +
            (image
              ? '<img loading="lazy" src="' + escape(image) + '" alt="">'
              : "") +
            '<h3><a rel="noopener noreferrer" href="' +
            escape(href) +
            '">' +
            escape(label) +
            "</a></h3><p>" +
            escape(item.descr) +
            "</p></article>"
          );
        })
        .join("") +
      "</div>"
    );
  },
  { ends: true },
);
