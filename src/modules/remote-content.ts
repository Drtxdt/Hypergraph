import { t } from "./i18n";
type Item = {
  title: string;
  url?: string;
  link?: string;
  description?: string;
  author?: string;
  created?: string;
};
export async function mount(root: HTMLElement, signal: AbortSignal) {
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-remote-feed]",
  )) {
    try {
      const response = await fetch(element.dataset.remoteFeed!, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      });
      if (!response.ok) throw Error();
      const body = await response.json();
      const items: Item[] = Array.isArray(body)
        ? body
        : body.article_data || body.items || [];
      if (signal.aborted) continue;
      const list = document.createElement("div");
      list.className = "collection";
      for (const item of items.slice(0, 30)) {
        const href = new URL(item.url || item.link || "", location.href);
        if (!["http:", "https:"].includes(href.protocol)) continue;
        const article = document.createElement("article"),
          h2 = document.createElement("h2"),
          a = document.createElement("a"),
          p = document.createElement("p");
        article.className = "collection-card";
        a.href = href.href;
        a.textContent = item.title;
        a.rel = "noopener noreferrer";
        h2.append(a);
        p.textContent =
          item.description ||
          [item.author, item.created].filter(Boolean).join(" · ");
        article.append(h2, p);
        list.append(article);
      }
      element.replaceChildren(list);
    } catch {
      if (!signal.aborted)
        element.textContent =
          t("暂时无法获取新动态，稍后再试。 / Feed unavailable.");
    }
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-ai-summary]",
  )) {
    try {
      const response = await fetch(element.dataset.aiSummary!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: document.querySelector<HTMLLinkElement>("link[rel=canonical]")
            ?.href,
          title: root.querySelector("h1")?.textContent,
          text: root.querySelector(".prose")?.textContent?.slice(0, 12000),
        }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      });
      if (!response.ok) throw Error();
      const body = await response.json();
      if (!signal.aborted && typeof body.summary === "string")
        element.textContent = body.summary;
    } catch {
      if (!signal.aborted)
        element.textContent =
          t("摘要暂时不可用，正文仍可正常阅读。 / Summary unavailable.");
    }
  }
}
