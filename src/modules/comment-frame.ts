import { t } from "./i18n";
import { isDark, watchMode } from "./color-mode";
export function mount(
  element: HTMLElement,
  config: Record<string, unknown>,
  signal: AbortSignal,
) {
  const frame = document.createElement("iframe");
  frame.title = String(config.provider) + " " + t("评论 / Comments");
  frame.className = "comment-frame";
  const root = JSON.parse(
    document.querySelector("#hg-config")!.textContent!,
  ).root;
  const asset = new URL(root + "assets/legacy-comments.js", location.origin)
    .href;
  const settings = JSON.stringify({
    ...config,
    path: location.pathname,
    url: location.origin + location.pathname,
    title: document.title,
    dark: isDark(),
  }).replace(/</g, "\\u003c");
  frame.srcdoc = `<!doctype html><html lang="${document.documentElement.lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:0;font:16px system-ui;color:${isDark() ? "#eee" : "#222"}}a{overflow-wrap:anywhere}</style><div id="comments"></div><p id="status" role="status"></p><script id="settings" type="application/json">${settings}</script><script type="module" src="${asset}"></script></html>`;
  element.append(frame);
  const update = (dark: boolean) => {
    frame.contentWindow?.postMessage(
      { type: "hypergraph:mode", dark },
      location.origin,
    );
    if (frame.contentDocument?.body) {
      frame.contentDocument.documentElement.style.colorScheme = dark
        ? "dark"
        : "light";
      frame.contentDocument.body.style.color = dark ? "#eee" : "#222";
      frame.contentDocument.body.style.backgroundColor = dark
        ? "#171b1b"
        : "#f3f2ec";
    }
  };
  frame.addEventListener("load", () => update(isDark()), { signal });
  watchMode(update, signal);
  signal.addEventListener("abort", () => frame.remove(), { once: true });
}
