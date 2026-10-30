"use strict";
const { escape } = require("../lib/utils.cjs");
const paths = {
  copy: "M8 8h13v13H8ZM16 8V3H3v13h5",
  telegram: "M2 10 22 2l-5 20-6-7-4 3v-6ZM7 12 22 2M11 15 22 2",
  facebook: "M14 22V12h4l1-4h-5V6c0-2 1-3 4-3V0c-6-1-8 1-8 6v2H7v4h3v10",
  reddit: "M8 13h.1M16 13h.1M8 17q4 3 8 0M12 8l2-6 5 1M3 10a2 2 0 1 0-2 4m20-4a2 2 0 1 1 2 4M12 8a10 7 0 1 0 0 14 10 7 0 1 0 0-14",
  linkedin: "M4 9v12M4 3v2M10 21V9m0 5c0-7 10-7 10 0v7",

  reading: "M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3ZM12 6v16",
  share: "M12 16V3m-5 5 5-5 5 5M5 12H3v9h18v-9h-2",
  close: "m5 5 14 14M19 5 5 19",
  x: "M4 3h4l12 18h-4ZM20 3 4 21",
  instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8M17 6h1",
  bilibili: "m7 2 3 4m7-4-3 4M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm3 5v4m8-4v4m-6 2 2 1 2-1",
  email: "M3 5h18v14H3ZM3 5l9 8 9-8",

  menu: "M4 6h16M4 12h16M4 18h16",
  mode: "M12 3a9 9 0 1 0 0 18V3Zm0 0a9 9 0 0 1 0 18M16 5v14M20 9v6",
  arrow: "M5 19 19 5M5 5h14v14",
  grid: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  user: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-3a8 8 0 0 1 16 0v3",
  users:
    "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8M18 14a6 6 0 0 1 4 6",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6",
  home: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
  archive: "M3 4h18v5H3Zm2 5v12h14V9M9 13h6",
  about: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-3a8 8 0 0 1 16 0v3",
  image: "M3 3h18v18H3Zm0 13 6-6 12 11",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3h3m12 1a3 3 0 1 1-3-3h3",
  link: "m9 15 6-6M8 7l2-2a5 5 0 0 1 7 7l-2 2M16 17l-2 2a5 5 0 0 1-7-7l2-2",
};
hexo.extend.helper.register("hg_icon", function (name) {
  return (
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="' +
    (paths[name] || paths.link) +
    '"/></svg>'
  );
});
hexo.extend.helper.register("hg_menu", function () {
  return hexo.theme.config.menu
    .map((item) => {
      const label = escape(this.hg_t(item.label));
      const icon = this.hg_icon(item.icon || "link");
      if (item.children)
        return (
          '<details class="nav-group"><summary>' +
          icon +
          "<span>" +
          label +
          "</span></summary><div>" +
          item.children
            .map(
              (child) =>
                '<a href="' +
                escape(this.url_for(child.url)) +
                '">' +
                escape(this.hg_t(child.label)) +
                "</a>",
            )
            .join("") +
          "</div></details>"
        );
      return (
        '<a href="' +
        escape(this.url_for(item.url || "/")) +
        '">' +
        icon +
        "<span>" +
        label +
        "</span></a>"
      );
    })
    .join("");
});
hexo.extend.helper.register("hg_selection", function (page) {
  const posts = page.posts?.toArray() || [];
  const enabled =
    hexo.theme.config.home.featured &&
    hexo.theme.config.home.sections.includes("featured") &&
    (!page.current || page.current === 1);
  const lead = enabled
    ? [...posts].sort(
        (a, b) => (Number(b.sticky) || 0) - (Number(a.sticky) || 0),
      )[0]
    : null;
  return { lead, posts: posts.filter((p) => p !== lead) };
});
hexo.extend.helper.register("hg_media", function (post, type = "post") {
  const cfg = hexo.theme.config.appearance;
  const name = post.category || post.tag || "";
  const url =
    (cfg.show_cover &&
      (post.cover ||
        post.banner ||
        cfg.taxonomy_banners[type + ":" + name] ||
        cfg.hero[type])) ||
    "";
  const values = String(post.cover_position || "50% 50%").split(" ");
  const focus =
    values.length === 2 &&
    values.every((v) => /^\d+(?:\.\d+)?%$/.test(v) && parseFloat(v) <= 100)
      ? values.join(" ")
      : "50% 50%";
  return {
    url: url ? this.hg_image(url) : "",
    has_image: !!url,
    position: focus,
    height: cfg.hero.height,
  };
});
hexo.extend.helper.register("hg_archive", function (page) {
  const all = hexo.locals
    .get("posts")
    .toArray()
    .filter((post) => {
      if (
        page.category &&
        !post.categories.toArray().some((c) => c.name === page.category)
      )
        return false;
      if (page.tag && !post.tags.toArray().some((t) => t.name === page.tag))
        return false;
      if (page.year && this.date(post.date, "YYYY") !== String(page.year))
        return false;
      if (
        page.month &&
        Number(this.date(post.date, "MM")) !== Number(page.month)
      )
        return false;
      return true;
    });
  const groups = [];
  for (const post of page.posts?.toArray() || []) {
    const month = this.date(post.date, "YYYY / MM");
    let group = groups.at(-1);
    if (group?.month !== month) {
      group = { month, posts: [] };
      groups.push(group);
    }
    group.posts.push(post);
  }
  return {
    count: all.length,
    groups,
    type: page.category ? "category" : page.tag ? "tag" : "archive",
  };
});

hexo.extend.helper.register("hg_intro_bootstrap", function () {
  const boot = require("../lib/intro-bootstrap.cjs");
  const args = JSON.stringify([hexo.theme.config.appearance.intro, "hypergraph:intro:" + this.url_for("/")]).replace(/</g,"\\u003c");
  return "(" + boot.toString() + ")(..." + args + ");";
});
