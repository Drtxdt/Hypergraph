import { t } from "./i18n";
type Service = {
  provider: string;
  id: string;
  url: string;
  options?: Record<string, unknown>;
};
type ServiceWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  _hmt?: unknown[];
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  umami?: { track: () => void };
  $crisp?: unknown[];
  CRISP_WEBSITE_ID?: string;
  ChatraID?: string;
};
const state = window as ServiceWindow;
function load(src: string, attrs: Record<string, string>, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    for (const [key, value] of Object.entries(attrs))
      script.setAttribute(key, value);
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      script.onload = null;
      script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else resolve();
    };
    const abort = () => finish(new Error("aborted"));
    const timer = setTimeout(() => finish(new Error("service timeout")), 8000);
    script.onload = () => finish();
    script.onerror = () => finish(new Error("service unavailable"));
    signal.addEventListener("abort", abort, { once: true });
    document.head.append(script);
  });
}
export function mount(
  analytics: Service[],
  chat: Service & {
    enable: boolean;
    button?: boolean;
    hide_on_scroll?: boolean;
  },
  signal: AbortSignal,
) {
  for (const service of analytics) {
    const id = encodeURIComponent(service.id);
    let src = "",
      attrs: Record<string, string> = {},
      pageview: () => void = () => {},
      initial = false;
    if (service.provider === "google") {
      state.dataLayer ??= [];
      state.gtag = (...args) => state.dataLayer!.push(args);
      state.gtag("js", new Date());
      state.gtag("config", service.id, { send_page_view: false });
      src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      pageview = () =>
        state.gtag?.("event", "page_view", {
          page_location: location.href,
          page_title: document.title,
        });
      initial = true;
    }
    if (service.provider === "baidu") {
      state._hmt ??= [];
      src = `https://hm.baidu.com/hm.js?${id}`;
      pageview = () =>
        state._hmt!.push([
          "_trackPageview",
          location.pathname + location.search,
        ]);
    }
    if (service.provider === "clarity") {
      state.clarity = Object.assign(
        (...args: unknown[]) => {
          state.clarity!.q!.push(args);
        },
        { q: [] as unknown[] },
      );
      src = `https://www.clarity.ms/tag/${id}`;
    }
    if (service.provider === "umami") {
      src = service.url;
      attrs = { "data-website-id": service.id, "data-auto-pageview": "false" };
      pageview = () => state.umami?.track();
      initial = true;
    }
    if (service.provider === "cloudflare") {
      src = "https://static.cloudflareinsights.com/beacon.min.js";
      attrs = { "data-cf-beacon": JSON.stringify({ token: service.id }) };
    }
    if (service.provider === "gtm") {
      state.dataLayer ??= [];
      state.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
      pageview = () =>
        state.dataLayer!.push({
          event: "hypergraph_pageview",
          page_path: location.pathname,
          page_title: document.title,
        });
    }
    if (["cnzz", "51la", "custom"].includes(service.provider)) {
      src = service.url;
      attrs = { "data-site-id": service.id };
      if (service.provider === "51la") {
        initial = true;
        pageview = () => {
          const sdk = (
            window as Window & {
              LA?: { init: (options: Record<string, unknown>) => void };
            }
          ).LA;
          sdk?.init({ id: service.id, ...service.options });
        };
      }
    }
    if (src)
      void load(src, attrs, signal)
        .then(() => {
          if (signal.aborted) return;
          if (initial) pageview();
          document.addEventListener("hypergraph:mount", pageview, { signal });
        })
        .catch(() => {});
  }
  if (chat.enable) {
    let src = "";
    if (chat.provider === "crisp") {
      state.$crisp ??= [];
      state.CRISP_WEBSITE_ID = chat.id;
      src = "https://client.crisp.chat/l.js";
    }
    if (chat.provider === "tidio")
      src = `https://code.tidio.co/${encodeURIComponent(chat.id)}.js`;
    if (chat.provider === "chatra") {
      state.ChatraID = chat.id;
      src = "https://call.chatra.io/chatra.js";
    }
    if (chat.provider === "knocket")
      src = `https://trtc.io/knocket-sdk/sdk.js?identifier=${encodeURIComponent(chat.id)}`;
    if (["daovoice", "custom"].includes(chat.provider)) src = chat.url;
    if (src)
      void load(src, { "data-site-id": chat.id }, signal)
        .then(() => {
          if (chat.provider === "daovoice") {
            const sdk = (window as any).daovoice;
            sdk?.("init", { app_id: chat.id });
            sdk?.("update");
          }
        })
        .catch(() => {});
    if (chat.button) {
      const button = document.createElement("button");
      button.className = "chat-trigger";
      button.textContent = t("聊天 / Chat");
      const open = () => {
        if (chat.provider === "crisp") state.$crisp?.push(["do", "chat:open"]);
        else if (chat.provider === "tidio")
          (window as any).tidioChatApi?.open();
        else if (chat.provider === "chatra")
          (window as any).Chatra?.("openChat", true);
        else if (chat.provider === "daovoice")
          (window as any).daovoice?.("open");
        else if (chat.url) window.open(chat.url, "_blank", "noopener");
      };
      button.addEventListener("click", open, { signal });
      document.body.append(button);
      if (chat.hide_on_scroll) {
        let last = scrollY;
        document.addEventListener(
          "scroll",
          () => {
            button.hidden = scrollY > last && scrollY > 100;
            last = scrollY;
          },
          { passive: true, signal },
        );
      }
      signal.addEventListener("abort", () => button.remove(), { once: true });
    }
  }
}
