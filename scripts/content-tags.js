const words = require("../lib/i18n.cjs");
const text = (key) =>
  words[String(hexo.config.language).startsWith("en") ? "en" : "zh-CN"][key];
("use strict");
const { escape } = require("../lib/utils.cjs");
const md = (value) =>
  hexo.render.renderSync({ text: value, engine: "markdown" });
const url = (value) =>
  /^(https?:\/\/|\/|#|\.\.?\/)/i.test(value || "")
    ? escape(require("hexo-util").url_for.call(hexo, value))
    : "#";
const fields = (args) =>
  args
    .join(" ")
    .split(",")
    .map((s) => s.trim());
for (const name of ["cell", "btn"])
  hexo.extend.tag.register(name, (args) => {
    let [label, href, image] = fields(args);
    if (name === "btn") [href, label] = [label, href];
    return `<a class="content-button" href="${url(href)}">${image && /^(https?:\/\/|\/)/.test(image) ? `<img src="${url(image)}" alt="" width="32" height="32" loading="lazy">` : ""}${escape(label)}</a>`;
  });
for (const name of ["videos", "sitegroup"])
  hexo.extend.tag.register(
    name,
    (args, content) =>
      `<section class="collection"><h3>${escape(args.join(" "))}</h3>${md(content)}</section>`,
    { ends: true },
  );
for (const name of ["u", "emp", "wavy", "del", "kbd", "p"])
  hexo.extend.tag.register(name, (args) => {
    const tag = { emp: "em", wavy: "span" }[name] || name;
    return `<${tag} class="inline-${name}">${escape(args.join(" "))}</${tag}>`;
  });
hexo.extend.tag.register(
  "psw",
  (args) =>
    `<span class="spoiler" tabindex="0" role="button" aria-expanded="false"><span class="spoiler-label">${text("reveal")}</span><span class="spoiler-content" hidden>${escape(args.join(" "))}</span></span>`,
);
hexo.extend.tag.register(
  "icon",
  (args) =>
    `<span role="img" aria-label="${escape(args.slice(1).join(" "))}">${escape(args[0])}</span>`,
);
hexo.extend.tag.register(
  "inlineimage",
  (args) =>
    `<img class="inline-image" src="${url(fields(args)[0])}" alt="" width="24" height="24">`,
);
hexo.extend.tag.register("intCard", (args) => {
  const [href, image, tip, title, logo, author, description] = args;
  return `<article class="collection-card"><a href="${url(href)}"><img src="${url(image)}" alt="${escape(title)}" loading="lazy"><small>${escape(tip)}</small><h3>${escape(title)}</h3></a>${logo ? `<img src="${url(logo)}" alt="" width="32" height="32">` : ""}<strong>${escape(author)}</strong><p>${escape(description)}</p></article>`;
});
hexo.extend.tag.register("galleryGroup", (args) => {
  const [title, description, href, image] = args;
  return `<figure class="collection-card"><a href="${url(href)}"><img src="${url(image)}" alt="${escape(title)}" loading="lazy"><figcaption><strong>${escape(title)}</strong><p>${escape(description)}</p></figcaption></a></figure>`;
});
hexo.extend.tag.register("dogeplayer", (args) => {
  const [user, code] = args;
  if (!/^\d+$/.test(user) || !/^\w+$/.test(code))
    throw Error("dogeplayer requires numeric user ID and video code");
  return `<div data-doge-user="${user}" data-doge-code="${code}"><p role="status">${text("load_video")}</p><button data-doge-load>${text("play_video")}</button></div>`;
});
for (const name of ["hideToggle", "hide"])
  hexo.extend.tag.register(
    name,
    (args, content) =>
      `<details class="content-fold"><summary>${escape(args.join(" ") || text("reveal"))}</summary>${md(content)}</details>`,
    { ends: true },
  );
hexo.extend.tag.register("hideInline", (args) => {
  const [content, label] = fields(args);
  return `<span class="spoiler" tabindex="0" role="button" aria-expanded="false"><span class="spoiler-label">${escape(label || text("reveal"))}</span><span class="spoiler-content" hidden>${escape(content)}</span></span>`;
});
for (const name of ["inlineImg", "image"])
  hexo.extend.tag.register(name, (args) => {
    const [src, alt, width] = fields(args);
    return `<img class="${name === "inlineImg" ? "inline-image" : "content-image"}" src="${url(src)}" alt="${escape(alt)}" loading="lazy" decoding="async" ${/^\d+$/.test(width) ? `width="${width}"` : ""}>`;
  });
for (const name of ["span", "inline-labels"])
  hexo.extend.tag.register(
    name,
    (args) => `<span class="content-label">${escape(args.join(" "))}</span>`,
  );
for (const name of ["link", "site"])
  hexo.extend.tag.register(name, (args) => {
    const [title, href, description] = fields(args);
    return `<a class="link-card" href="${url(href)}" rel="noopener noreferrer"><strong>${escape(title)}</strong><span>${escape(description)}</span></a>`;
  });
for (const name of ["Introduction-card", "flink"])
  hexo.extend.tag.register(
    name,
    (_args, content) => {
      const items = require("js-yaml").load(content);
      if (!Array.isArray(items)) throw Error("Card tag expects a YAML array");
      return (
        '<div class="collection">' +
        items
          .map(
            (item) =>
              `<article class="collection-card">${item.image ? `<img src="${url(item.image)}" alt="" loading="lazy">` : ""}<h3><a href="${url(item.url || item.link)}">${escape(item.title || item.name)}</a></h3><p>${escape(item.description || item.descr)}</p></article>`,
          )
          .join("") +
        "</div>"
      );
    },
    { ends: true },
  );
hexo.extend.tag.register(
  "btns",
  (_args, content) => `<div class="button-group">${md(content)}</div>`,
  { ends: true },
);
hexo.extend.tag.register("bilibili", (args) => {
  const id = args[0];
  if (!/^BV[\w]+$/.test(id)) throw Error("bilibili expects a BV video ID");
  return `<iframe class="video-embed" loading="lazy" title="Bilibili video ${escape(id)}" src="https://player.bilibili.com/player.html?bvid=${id}&autoplay=0" allowfullscreen></iframe>`;
});
hexo.extend.tag.register("media", (args) => {
  const [kind, src, caption] = fields(args);
  if (!["audio", "video"].includes(kind))
    throw Error("media expects audio or video");
  return `<figure><${kind} controls preload="none" src="${url(src)}"></${kind}>${caption ? `<figcaption>${escape(caption)}</figcaption>` : ""}</figure>`;
});
hexo.extend.tag.register(
  "iconfont",
  (args) =>
    `<span class="content-icon" role="img" aria-label="${escape(args.slice(1).join(" "))}">${escape(args[0])}</span>`,
);
hexo.extend.tag.register("series", (args) => {
  const series = args.join(" ");
  return `<div data-series="${escape(series)}"></div>`;
});
hexo.extend.filter.register(
  "after_post_render",
  (data) => {
    data.content = data.content.replace(
      /<div data-series="([^"]*)"><\/div>/g,
      (_match, name) => {
        const posts = hexo.locals
          .get("posts")
          .filter((p) => escape(p.series) === name)
          .sort("date")
          .toArray();
        return `<section class="series-list"><h3>${name}</h3><ol>${posts.map((p) => `<li><a href="${url(hexo.config.root + p.path)}">${escape(p.title)}</a></li>`).join("")}</ol></section>`;
      },
    );
    return data;
  },
  50,
);
