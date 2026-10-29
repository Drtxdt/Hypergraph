const c = JSON.parse(document.querySelector("#settings")!.textContent!);
const element = document.querySelector<HTMLElement>("#comments")!;
const state = window as unknown as Record<string, any>;
async function script(src: string, attrs: Record<string, string> = {}) {
  return new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = src;
    tag.async = true;
    for (const [key, value] of Object.entries(attrs))
      tag.setAttribute(key, value);
    const timer = setTimeout(() => {
      tag.remove();
      reject(Error("timeout"));
    }, 8000);
    tag.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    tag.onerror = () => {
      clearTimeout(timer);
      reject(Error("unavailable"));
    };
    document.head.append(tag);
  });
}
// This document is an isolated comment adapter boundary. SDK failures must not
// escape into the reading document or suppress errors from unrelated modules.
const unavailable = () => {
  document.querySelector("#status")!.textContent =
    document.documentElement.lang === "zh-CN"
      ? "评论暂时无法加载"
      : "Comments unavailable";
};
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  unavailable();
});
window.addEventListener("error", (event) => {
  event.preventDefault();
  unavailable();
});
async function start() {
  if (c.provider === "artalk") {
    const [{ default: Artalk }] = await Promise.all([
      import("artalk"),
      import("artalk/dist/Artalk.css"),
    ]);
    const instance = Artalk.init({
      ...c.options,
      el: element,
      server: c.server,
      site: c.site,
      pageKey: c.path,
      pageTitle: c.title,
      darkMode: c.dark,
      locale: document.documentElement.lang === "zh-CN" ? "zh-CN" : "en",
    });
    window.addEventListener("message", (event) => {
      if (
        event.source === parent &&
        event.origin === new URL(c.url).origin &&
        event.data?.type === "hypergraph:mode"
      )
        instance.setDarkMode(Boolean(event.data.dark));
    });
    window.addEventListener("pagehide", () => instance.destroy(), {
      once: true,
    });
  }
  if (c.provider === "valine") {
    const [{ default: Valine }, { default: AV }] = await Promise.all([
      import("valine"),
      import("leancloud-storage"),
    ]);
    state.AV = AV;
    new Valine({
      ...c.options,
      el: "#comments",
      appId: c.app_id,
      appKey: c.app_key,
      serverURLs: c.server || undefined,
      path: c.path,
      lang: document.documentElement.lang === "zh-CN" ? "zh-CN" : "en",
    });
  }
  if (c.provider === "disqus") {
    element.id = "disqus_thread";
    state.disqus_config = function (this: any) {
      this.page.url = c.url;
      this.page.identifier = c.path;
      this.page.title = c.title;
    };
    await script("https://" + c.shortname + ".disqus.com/embed.js");
  }
  if (c.provider === "disqusjs") {
    await import("disqusjs/styles/disqusjs.css");
    const { default: DisqusJS } = await import("disqusjs/browser");
    new DisqusJS({
      ...c.options,
      shortname: c.shortname,
      apikey: c.api_key,
      api: c.server || "https://disqus.com/api/",
      url: c.url,
      identifier: c.path,
      title: c.title,
    }).render(element);
  }
  if (c.provider === "utterances") {
    await script("https://utteranc.es/client.js", {
      repo: c.repo,
      "issue-term": "pathname",
      theme: c.dark ? "github-dark" : "github-light",
      crossorigin: "anonymous",
    });
  }
  if (c.provider === "livere") {
    element.id = "lv-container";
    element.setAttribute("data-id", "city");
    element.setAttribute("data-uid", c.uid);
    state.livereOptions = { refer: c.url, ...c.options };
    await script("https://cdn-city.livere.com/js/embed.dist.js");
  }
  if (c.provider === "facebook") {
    element.className = "fb-comments";
    element.setAttribute("data-href", c.url);
    element.setAttribute("data-width", "100%");
    await script(
      "https://connect.facebook.net/" +
        (document.documentElement.lang === "zh-CN" ? "zh_CN" : "en_US") +
        "/sdk.js#xfbml=1&version=v22.0&appId=" +
        encodeURIComponent(c.app_id),
    );
  }
  if (c.provider === "remark42") {
    element.id = "remark42";
    state.remark_config = {
      ...c.options,
      host: c.server,
      site_id: c.site,
      url: c.url,
      page_title: c.title,
      theme: c.dark ? "dark" : "light",
      components: ["embed"],
    };
    await script(c.server.replace(/\/$/, "") + "/web/embed.js");
  }
  if (c.provider === "gitalk") {
    const root = new URL(".", import.meta.url);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL("vendor/gitalk.css", root).href;
    document.head.append(link);
    await script(new URL("vendor/gitalk.min.js", root).href);
    new state.Gitalk({
      ...c.options,
      clientID: c.client_id,
      clientSecret: c.client_secret,
      repo: c.repo,
      owner: c.owner,
      admin: c.admin,
      id: c.path.slice(-50),
      proxy: c.proxy || undefined,
    }).render(element);
  }
}
void start().catch(unavailable);
