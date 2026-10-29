"use strict";
const { escape } = require("../lib/utils.cjs");
hexo.extend.helper.register("hg_ad", function (slot) {
  const cfg = hexo.theme.config.adsense;
  const entries = (hexo.theme.config.ads || []).filter(
    (a) => a.slot === slot && a.enable,
  );
  let html = entries
    .map(
      (a) =>
        `<aside class="advertisement" aria-label="Advertisement"><small>AD</small>${a.html}</aside>`,
    )
    .join("");
  if (cfg.enable && cfg.slot && ["post", "home"].includes(slot))
    html += `<aside class="advertisement"><small>AD</small><ins class="adsbygoogle" style="display:block;min-height:120px" data-ad-client="${escape(cfg.client)}" data-ad-slot="${escape(cfg.slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></aside>`;
  return html;
});
