"use strict";
hexo.extend.filter.register("after_generate", async function () {
  const home = hexo.theme.config.home;
  const links = [
    home.masthead.action.url,
    ...(Array.isArray(home.topics) ? home.topics.map((t) => t.url) : []),
  ].filter(Boolean);
  const routes = new Set(hexo.route.list());
  for (const link of links) {
    const parsed = new URL(link, hexo.config.url);
    if (parsed.origin !== new URL(hexo.config.url).origin) continue;
    const root = hexo.config.root || "/";
    let pathname = decodeURIComponent(parsed.pathname);
    if (pathname.startsWith(root)) pathname = pathname.slice(root.length);
    else pathname = pathname.replace(/^\//, "");
    const route =
      pathname.endsWith("/") || !pathname ? pathname + "index.html" : pathname;
    const target = routes.has(route)
      ? route
      : routes.has(route + "/index.html")
        ? route + "/index.html"
        : null;
    if (!target)
      throw Error(
        `Hypergraph /home: internal link has no generated target: ${link}`,
      );
    if (parsed.hash) {
      let html = "";
      for await (const chunk of hexo.route.get(target)) html += chunk;
      const id = decodeURIComponent(parsed.hash.slice(1));
      if (
        !html.includes('id="' + id + '"') &&
        !html.includes("id='" + id + "'")
      )
        throw Error(`Hypergraph /home: missing anchor: ${link}`);
    }
  }
});
