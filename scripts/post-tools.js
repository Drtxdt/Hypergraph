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
  let html = "";
  if (post.series) {
    const related = hexo.locals
      .get("posts")
      .filter((p) => p.series === post.series)
      .sort("date")
      .toArray();
    html += `<section><h2>${escape(post.series)}</h2><ol>${related.map((p) => `<li><a href="${escape(this.url_for(p.path))}">${escape(p.title)}</a></li>`).join("")}</ol></section>`;
  }
  if (cfg.share || cfg.edit_url || cfg.reward.length) html += '<div class="post-actions">';
  if (cfg.share)
    html += `<button class="icon-button" aria-label="${escape(this.hg_t("share"))}" title="${escape(this.hg_t("share"))}" data-share data-url="${escape(canonical)}" data-title="${escape(post.title)}">${this.hg_icon("share")}</button>`;
  if (cfg.share) {
    html += `<button class="icon-button" data-copy-share data-url="${escape(canonical)}" aria-label="${escape(this.hg_t("copy_link"))}" title="${escape(this.hg_t("copy_link"))}">${this.hg_icon("copy")}</button>`;
    if (cfg.share_sites.length) html += `<details class="share-platforms"><summary class="icon-button" aria-label="${escape(this.hg_t("more_platforms"))}" title="${escape(this.hg_t("more_platforms"))}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></summary><div class="share-platform-list">`;
  }
  if (cfg.share)
    for (const site of cfg.share_sites) {
      if (["bilibili", "instagram"].includes(site)) {
        const label = (site === "bilibili" ? "B站" : "Instagram") + " · " + this.hg_t("copy_link");
        html += `<button class="icon-button" data-copy-share data-url="${escape(canonical)}" data-platform="${escape(site)}" aria-label="${escape(label)}" title="${escape(label)}">${this.hg_icon(site)}</button>`;
        continue;
      }
      const url = encodeURIComponent(canonical),
        title = encodeURIComponent(post.title);
      const urls = {
        telegram: `https://t.me/share/url?url=${url}&text=${title}`,
        reddit: `https://www.reddit.com/submit?url=${url}&title=${title}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,

        weibo: `https://service.weibo.com/share/share.php?url=${url}&title=${title}`,
        qq: `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`,
        x: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        email: `mailto:?subject=${title}&body=${url}`,
      };
      html += `<a class="icon-button" aria-label="${escape(site)}" title="${escape(site)}" href="${escape(urls[site])}" target="_blank" rel="noopener noreferrer">${this.hg_icon(site)}</a>`;
    }
  if (cfg.share && cfg.share_sites.length) html += "</div></details>";
  if (cfg.edit_url)
    html += `<a class="content-button" href="${escape(cfg.edit_url.replace(/\/$/, "") + "/" + post.source)}" rel="noopener">${escape(this.hg_t("edit"))}</a>`;
  if (cfg.reward.length)
    html += `<details class="reward"><summary>${escape(this.hg_t("reward"))}</summary>${cfg.reward.map((item) => `<figure><img src="${escape(this.url_for(item.image))}" alt="${escape(item.name)}" width="180" height="180" loading="lazy"><figcaption>${escape(item.name)}</figcaption></figure>`).join("")}</details>`;
  if (cfg.share || cfg.edit_url || cfg.reward.length) html += '<span class="share-feedback" role="status" aria-live="polite"></span></div>';
  if (cfg.copyright)
    html += `<div class="post-license">${escape(hexo.config.author)} · ${escape(cfg.license)}<br><a href="${escape(canonical)}">${escape(canonical)}</a></div>`;
  if (cfg.pagination)
    html += `<nav class="post-pagination" aria-label="Post navigation">${post.prev ? `<a href="${escape(this.url_for(post.prev.path))}">← ${escape(post.prev.title)}</a>` : ""}${post.next ? `<a href="${escape(this.url_for(post.next.path))}">${escape(post.next.title)} →</a>` : ""}</nav>`;
  return html;
});
