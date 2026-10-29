"use strict";
const { escape } = require("../lib/utils.cjs");
hexo.extend.helper.register("hg_widgets", function () {
  const cfg = hexo.theme.config.sidebar;
  if (!cfg?.enable) return "";
  const posts = hexo.locals.get("posts");
  let html = '<aside class="home-sidebar">';
  for (const widget of cfg.order) {
    if (
      (widget === "categories" || widget === "tags") &&
      !hexo.locals.get(widget).length
    )
      continue;
    if (widget === "announcement" && !cfg.announcement) continue;
    if (
      widget === "comments" &&
      !(
        hexo.theme.config.comments.enable &&
        hexo.theme.config.comments.provider === "waline"
      )
    )
      continue;
    if ((widget === "latest" || widget === "archives") && !posts.length)
      continue;
    html += '<section class="sidebar-widget">';
    if (widget === "profile") {
      const appearance = hexo.theme.config.appearance;
      html += `${appearance.avatar ? `<img class="profile-avatar" src="${escape(this.url_for(appearance.avatar))}" alt="" width="80" height="80" loading="lazy">` : ""}<h2>${escape(hexo.config.author)}</h2><p>${escape(appearance.author_status)}</p><p>${escape(hexo.config.description)}</p>`;
    }
    if (widget === "latest")
      html += `<h2>${escape(this.hg_t("latest"))}</h2><ul>${posts
        .sort("-date")
        .limit(5)
        .map(
          (p) =>
            `<li><a href="${escape(this.url_for(p.path))}">${escape(p.title)}</a></li>`,
        )
        .join("")}</ul>`;
    if (widget === "categories" || widget === "tags") {
      const values = hexo.locals.get(widget).toArray();
      html += `<h2>${escape(this.hg_t(widget))}</h2><div class="taxonomy">${values.map((v) => `<a href="${escape(this.url_for(v.path))}">${escape(v.name)} <small>${v.length}</small></a>`).join("")}</div>`;
    }
    if (widget === "stats")
      html += `<h2>${escape(this.hg_t("statistics"))}</h2><p>${posts.length} ${escape(this.hg_t("articles"))}</p>`;
    if (widget === "announcement") html += `<p>${escape(cfg.announcement)}</p>`;
    if (widget === "archives") {
      const groups = new Map();
      for (const post of posts.sort("-date").toArray()) {
        const month = this.date(post.date, "YYYY/MM");
        groups.set(month, (groups.get(month) || 0) + 1);
      }
      html += `<h2>${escape(this.hg_t("archive"))}</h2><ul>${[
        ...groups.entries(),
      ]
        .slice(0, 12)
        .map(
          ([month, count]) =>
            `<li><a href="${escape(this.url_for("/archives/" + month + "/"))}">${month} (${count})</a></li>`,
        )
        .join("")}</ul>`;
    }
    if (
      widget === "comments" &&
      hexo.theme.config.comments.enable &&
      hexo.theme.config.comments.provider === "waline"
    )
      html += `<h2>${escape(this.hg_t("comments"))}</h2><div data-comment-recent="${escape(hexo.theme.config.comments.server)}">…</div>`;
    html += "</section>";
  }
  return html + this.hg_ad("sidebar") + "</aside>";
});
