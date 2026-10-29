"use strict";
const { escape, plain, json } = require("../lib/utils.cjs");
hexo.extend.helper.register("hg_post_tools", function (post) {
  const cfg = hexo.theme.config.post;
  if (!cfg) return "";
  let html = "";
  const canonical = this.hg_canonical(post);
  if (hexo.theme.config.counters.enable)
    html += "<p>Views: <span data-page-views>…</span></p>";
  if (hexo.theme.config.counters.busuanzi)
    html +=
      '<p id="busuanzi_container_page_pv">Views: <span id="busuanzi_value_page_pv">—</span></p>';
  if (
    cfg.outdated_days &&
    Date.now() - new Date(post.updated || post.date).getTime() >
      cfg.outdated_days * 86400000
  )
    html +=
      '<aside class="admonition">' + escape(this.hg_t("outdated")) + "</aside>";
  if (cfg.summary && post.summary && !post.password)
    html +=
      '<section class="post-summary"><strong>' +
      escape(this.hg_t("summary")) +
      "</strong><p>" +
      escape(post.summary) +
      "</p></section>";
  if (
    hexo.theme.config.ai_summary?.enable &&
    !post.password &&
    !post.hg_encrypted
  )
    html += `<section class="post-summary"><strong>AI ${escape(this.hg_t("summary"))}</strong><p data-ai-summary="${escape(hexo.theme.config.ai_summary.endpoint)}">${escape(this.hg_t("summary"))}…</p></section>`;
  return html;
});
hexo.extend.helper.register("hg_post_end", function (post) {
  const cfg = hexo.theme.config.post;
  if (!cfg) return "";
  const canonical = this.hg_canonical(post);
  let html = '<div class="post-actions">';
  if (cfg.share)
    html += `<button data-share data-url="${escape(canonical)}" data-title="${escape(post.title)}">${escape(this.hg_t("share"))}</button>`;
  if (cfg.share)
    for (const site of cfg.share_sites) {
      const url = encodeURIComponent(canonical),
        title = encodeURIComponent(post.title);
      const urls = {
        weibo: `https://service.weibo.com/share/share.php?url=${url}&title=${title}`,
        qq: `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`,
        x: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        email: `mailto:?subject=${title}&body=${url}`,
      };
      html += `<a href="${escape(urls[site])}" target="_blank" rel="noopener noreferrer">${escape(site)}</a>`;
    }
  if (cfg.edit_url)
    html += `<a class="content-button" href="${escape(cfg.edit_url.replace(/\/$/, "") + "/" + post.source)}" rel="noopener">${escape(this.hg_t("edit"))}</a>`;
  if (cfg.reward.length)
    html += `<details class="reward"><summary>${escape(this.hg_t("reward"))}</summary>${cfg.reward.map((item) => `<figure><img src="${escape(this.url_for(item.image))}" alt="${escape(item.name)}" width="180" height="180" loading="lazy"><figcaption>${escape(item.name)}</figcaption></figure>`).join("")}</details>`;
  html += "</div>";
  if (cfg.copyright)
    html += `<div class="post-license">${escape(hexo.config.author)} · ${escape(cfg.license)}<br><a href="${escape(canonical)}">${escape(canonical)}</a></div>`;
  if (post.series) {
    const related = hexo.locals
      .get("posts")
      .filter((p) => p.series === post.series)
      .sort("date")
      .toArray();
    html += `<section><h2>${escape(post.series)}</h2><ol>${related.map((p) => `<li><a href="${escape(this.url_for(p.path))}">${escape(p.title)}</a></li>`).join("")}</ol></section>`;
  }
  if (cfg.pagination)
    html += `<nav class="post-pagination" aria-label="Post navigation">${post.prev ? `<a href="${escape(this.url_for(post.prev.path))}">← ${escape(post.prev.title)}</a>` : ""}${post.next ? `<a href="${escape(this.url_for(post.next.path))}">${escape(post.next.title)} →</a>` : ""}</nav>`;
  return html;
});
