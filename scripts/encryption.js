"use strict";
const words = require("../lib/i18n.cjs");
const { encrypt } = require("../lib/encryption.cjs");
const { escape, json } = require("../lib/utils.cjs");
hexo.extend.filter.register(
  "after_post_render",
  (data) => {
    if (!data.password) return data;
    const t =
      words[String(hexo.config.language).startsWith("en") ? "en" : "zh-CN"];
    const math = /class="katex/.test(data.content);
    const payload = encrypt(data.content, String(data.password));
    const summary = data.abstract ? escape(data.abstract) : t.password_required;
    data.hg_encrypted = true;
    data.comments = false;
    data.description = data.abstract || "";
    data.content = `<section class="encrypted" ${math ? 'data-math="katex"' : ""}><p>${summary}</p><form data-unlock><label>${t.password} <input type="password" required autocomplete="off"></label> <button>${t.unlock}</button><p role="status" aria-live="polite"></p></form><script type="application/json" data-cipher>${json(payload)}</script><div data-plaintext></div></section>`;
    data.excerpt = `<p>${summary}</p>`;
    data.more = data.content;
    data.raw = "";
    data.origin = "";
    return data;
  },
  10000,
);
