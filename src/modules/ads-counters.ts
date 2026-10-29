type Options = {
  adsense: { enable: boolean; client: string; slot: string };
  counters: { enable: boolean; endpoint: string; busuanzi: boolean };
};
let adsLoaded = false;
export function mount(
  root: HTMLElement,
  options: Options,
  signal: AbortSignal,
) {
  if (options.adsense.enable) {
    if (!adsLoaded) {
      adsLoaded = true;
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
        encodeURIComponent(options.adsense.client);
      document.head.append(script);
    }
    for (const element of root.querySelectorAll<HTMLElement>(".adsbygoogle")) {
      if (element.dataset.requested) continue;
      element.dataset.requested = "true";
      const state = window as Window & { adsbygoogle?: unknown[] };
      (state.adsbygoogle ??= []).push({});
    }
  }
  if (options.counters.enable && options.counters.endpoint) {
    const status = root.querySelector<HTMLElement>("[data-page-views]");
    if (status)
      void fetch(
        options.counters.endpoint +
          (options.counters.endpoint.includes("?") ? "&" : "?") +
          "path=" +
          encodeURIComponent(location.pathname),
        { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) },
      )
        .then((r) => {
          if (!r.ok) throw Error();
          return r.json();
        })
        .then((data) => {
          if (!signal.aborted)
            status.textContent = String(Number(data.page_views) || 0);
        })
        .catch(() => {
          if (!signal.aborted) status.textContent = "—";
        });
  }
  if (options.counters.busuanzi) {
    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js";
    document.head.append(script);
    signal.addEventListener("abort", () => script.remove(), { once: true });
  }
}
