import { t } from "./i18n";
import { isDark, watchMode } from "./color-mode";
export async function mount(root: HTMLElement, signal: AbortSignal) {
  const container = root.querySelector<HTMLElement>("[data-comments]");
  if (!container) return;
  if (container.dataset.mounted) return;
  container.dataset.mounted = "true";
  const element = container.querySelector<HTMLElement>("[data-comment-body]")!;
  const config = JSON.parse(
    container.querySelector("[data-comment-config]")!.textContent!,
  );
  if (config.lazy) {
    await new Promise<void>((resolve) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            resolve();
          }
        },
        { rootMargin: "200px" },
      );
      observer.observe(container);
      signal.addEventListener(
        "abort",
        () => {
          observer.disconnect();
          resolve();
        },
        { once: true },
      );
    });
    if (signal.aborted) return;
  }
  let active = new AbortController();
  signal.addEventListener("abort", () => active.abort(), { once: true });
  if (config.secondary?.enable) {
    const selector = document.createElement("select");
    selector.setAttribute("aria-label", t("评论服务 / Comment service"));
    selector.append(
      new Option(config.provider, "primary"),
      new Option(config.secondary.provider, "secondary"),
    );
    container.prepend(selector);
    selector.addEventListener(
      "change",
      () => {
        active.abort();
        active = new AbortController();
        element.replaceChildren();
        void render(
          selector.value === "primary" ? config : config.secondary,
          active.signal,
        );
      },
      { signal },
    );
  }
  return render(config, active.signal);
  async function render(config: any, signal: AbortSignal) {
    try {
      if (config.provider === "waline") {
        const [{ init }] = await Promise.all([
          import("@waline/client"),
          import("@waline/client/style"),
        ]);
        if (signal.aborted) return;
        const instance = init({
          ...config.options,
          el: element,
          serverURL: config.server,
          path: location.pathname,
          lang: document.documentElement.lang === "zh-CN" ? "zh-CN" : "en",
          dark: isDark(),
          login: "enable",
        });
        watchMode((dark) => instance?.update({ dark }), signal);
        signal.addEventListener("abort", () => instance?.destroy(), {
          once: true,
        });
      } else if (config.provider === "twikoo") {
        const frame = document.createElement("iframe");
        frame.title = t("评论 / Comments");
        frame.className = "comment-frame";
        const settings = JSON.stringify({
          ...config.options,
          envId: config.env_id,
          path: location.pathname,
        }).replace(/</g, "\\u003c");
        const asset = new URL(
          JSON.parse(document.querySelector("#hg-config")!.textContent!).root +
            "assets/twikoo-frame.js",
          location.origin,
        ).href;
        frame.srcdoc = `<!doctype html><html lang="${document.documentElement.lang}"><meta charset="utf-8"><style>body{margin:0;font:16px system-ui}</style><div id="comments"></div><script type="application/json" id="settings">${settings}</script><script type="module" src="${asset}"></script></html>`;
        element.append(frame);
        signal.addEventListener("abort", () => frame.remove(), { once: true });
      } else if (config.provider === "giscus") {
        const script = document.createElement("script");
        script.src = "https://giscus.app/client.js";
        script.async = true;
        script.crossOrigin = "anonymous";
        const fields = {
          repo: config.repo,
          "repo-id": config.repo_id,
          "category-id": config.category_id,
          mapping: "pathname",
          strict: "1",
          "reactions-enabled": "1",
          "emit-metadata": "0",
          "input-position": "top",
          ...config.options,
          theme: isDark() ? "dark" : "light",
          lang: document.documentElement.lang === "zh-CN" ? "zh-CN" : "en",
        };
        watchMode(
          (dark) =>
            element
              .querySelector<HTMLIFrameElement>(".giscus-frame")
              ?.contentWindow?.postMessage(
                { giscus: { setConfig: { theme: dark ? "dark" : "light" } } },
                "https://giscus.app",
              ),
          signal,
        );
        for (const [name, value] of Object.entries(fields))
          script.setAttribute("data-" + name, String(value));
        element.append(script);
        signal.addEventListener("abort", () => element.replaceChildren(), {
          once: true,
        });
      } else {
        const module = await import("./comment-frame");
        if (!signal.aborted) module.mount(element, config, signal);
      }
    } catch {
      if (!signal.aborted)
        container!.querySelector("[role=status]")!.textContent = t(
          "评论暂时无法加载 / Comments unavailable",
        );
    }
  }
}
