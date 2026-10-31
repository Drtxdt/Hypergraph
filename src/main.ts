import "./styles/index.css";
import { mountShell, dismissPanels } from "./modules/panels";
type Config = {
  root: string;
  navigation: boolean;
  search: boolean;
  lightbox: boolean;
  pwa: boolean;
  external_search: {
    enable: boolean;
    app_id: string;
    search_key: string;
    index: string;
  };
  code: { copy: boolean; fold: boolean; max_height: number };
  tools: {
    back_to_top: boolean;
    progress: boolean;
    keyboard: boolean;
    copy_copyright: boolean;
    title_away: string;
  };
  effects: {
    click: string;
    typewriter: boolean;
    background: string;
    typing: boolean;
    words: string[];
    mobile: boolean;
  };
  extensions?: {
    id: string;
    scope: "page" | "global";
    config: Record<string, unknown>;
  }[];
};
const config: Config = JSON.parse(
  document.querySelector("#hg-config")!.textContent!,
);
const services: {
  analytics: { provider: string; id: string; url: string }[];
  chat: { enable: boolean; provider: string; id: string; url: string };
} = JSON.parse(document.querySelector("#hg-config")!.textContent!);
const globalController = new AbortController();
const extras = JSON.parse(document.querySelector("#hg-config")!.textContent!);
if (
  Object.entries(extras.interaction).some(
    ([key, value]) =>
      key !== "privacy_version" &&
      (Array.isArray(value) ? value.length : !!value),
  )
)
  void import("./modules/interaction").then((m) =>
    m.mount(extras.interaction, globalController.signal),
  );
if (extras.music.enable)
  void import("./modules/music").then((m) =>
    m.mount(extras.music, config.root, globalController.signal),
  );
const appearance: import("./modules/appearance").Appearance = JSON.parse(
  document.querySelector("#hg-config")!.textContent!,
).appearance;
async function mountAppearance(root: HTMLElement, signal: AbortSignal, transition = false) {
  if (signal.aborted) return;
  if (
    appearance.fallback_image ||
    appearance.captions ||
    appearance.motion !== "off" ||
    appearance.cover_tint
  ) {
    const module = await import("./modules/appearance");
    if (!signal.aborted) module.mount(root, transition ? { ...appearance, motion: "off" } : appearance, signal);
  }
}
let pageController = new AbortController();
if (document.documentElement.classList.contains("intro-active"))
  void import("./modules/intro").then(m => m.mount(globalController.signal)).catch(() => (window as Window & { __hgIntroFinish?: () => void }).__hgIntroFinish?.());

let epoch = 0;
async function mountUnlocked(root: HTMLElement, signal: AbortSignal) {
  void mountAppearance(root, signal);
  const reading = await import("./modules/reading");
  if (signal.aborted) return;
  reading.mount(root, signal, config.code);
  if (root.querySelector("[data-diagram]")) {
    const module = await import("./modules/diagrams");
    if (!signal.aborted) void module.mount(root, signal);
  }
  if (root.querySelector("[data-doge-user]")) {
    const module = await import("./modules/dogeplayer");
    if (!signal.aborted) module.mount(root, signal);
  }
  if (root.querySelector(".content-tabs,.spoiler")) {
    const module = await import("./modules/content-controls");
    if (!signal.aborted) module.mount(root, signal);
  }
  if (config.lightbox && root.querySelector(".prose img")) {
    const module = await import("./modules/media");
    if (!signal.aborted) module.mount(root, signal);
  }
  if (!signal.aborted)
    root.dispatchEvent(
      new CustomEvent("hypergraph:unlock", {
        bubbles: true,
        detail: { root, signal },
      }),
    );
  if (!signal.aborted && location.hash) {
    try {
      document
        .getElementById(decodeURIComponent(location.hash.slice(1)))
        ?.scrollIntoView();
    } catch {}
  }
}
const modeButton =
  document.querySelector<HTMLButtonElement>("[data-mode-toggle]");
modeButton?.addEventListener("click", () => {
  const dark =
    document.documentElement.dataset.mode === "dark" ||
    (document.documentElement.dataset.mode !== "light" &&
      matchMedia("(prefers-color-scheme:dark)").matches);
  document.documentElement.dataset.mode = dark ? "light" : "dark";
  try {
    localStorage.setItem(
      "hypergraph-mode",
      document.documentElement.dataset.mode,
    );
  } catch {}
});
async function mountPage(focus = false) {
  (window as Window & { __hgImages?: () => void }).__hgImages?.();
  dismissPanels();
  pageController.abort();
  pageController = new AbortController();
  const { signal } = pageController;
  const version = ++epoch;
  const root = document.querySelector<HTMLElement>("#content")!;
  void mountAppearance(root, signal, focus);
  if (
    extras.adsense.enable ||
    extras.counters.enable ||
    extras.counters.busuanzi
  ) {
    const module = await import("./modules/ads-counters");
    if (!signal.aborted) module.mount(root, extras, signal);
  }
  document.querySelector("#site-nav")?.classList.remove("is-open");
  document
    .querySelector("[data-menu-toggle]")
    ?.setAttribute("aria-expanded", "false");
  if (focus) {
    root.focus({ preventScroll: true });
  }
  if (root.querySelector('[data-utility]')) {
    const module = await import('./modules/utilities');
    if (!signal.aborted) module.mount(root, signal);
  }
  if (root.querySelector('[data-game-app]')) {
    const module = await import('./modules/games');
    if (!signal.aborted) module.mount(root, signal);
  }
  if (root.querySelector(".prose")) {
    const mod = await import("./modules/reading");
    if (version === epoch) mod.mount(root, signal, config.code);
  }
  if (root.querySelector("[data-cipher]")) {
    const mod = await import("./modules/encryption");
    if (version === epoch)
      mod.mount(root, signal, () => {
        void mountUnlocked(root, signal);
      });
  }
  if (root.querySelector("[data-diagram]")) {
    const mod = await import("./modules/diagrams");
    if (!signal.aborted) void mod.mount(root, signal);
  }
  if (root.querySelector("[data-doge-user]")) {
    const mod = await import("./modules/dogeplayer");
    if (!signal.aborted) mod.mount(root, signal);
  }
  if (root.querySelector("[data-comments]")) {
    const mod = await import("./modules/comments");
    if (!signal.aborted) mod.mount(root, signal);
  }
  if (root.querySelector("[data-comment-count],[data-comment-recent]")) {
    const mod = await import("./modules/comment-extras");
    if (!signal.aborted) void mod.mount(root, signal);
  }
  if (root.querySelector("[data-remote-feed],[data-ai-summary]")) {
    const mod = await import("./modules/remote-content");
    if (!signal.aborted) void mod.mount(root, signal);
  }
  if (root.querySelector("[data-share]")) {
    const mod = await import("./modules/actions");
    if (!signal.aborted) mod.mount(root, signal);
  }
  if (root.querySelector(".content-tabs,.spoiler")) {
    const mod = await import("./modules/content-controls");
    if (!signal.aborted) mod.mount(root, signal);
  }
  if (
    config.lightbox &&
    root.querySelector(".prose img,.gallery img,.collection-gallery img")
  ) {
    const mod = await import("./modules/media");
    if (!signal.aborted) mod.mount(root, signal);
  }
  root.dispatchEvent(
    new CustomEvent("hypergraph:mount", {
      bubbles: true,
      detail: { root, signal },
    }),
  );
  if (config.extensions?.length) {
    const mod = await import("./modules/extensions");
    if (!signal.aborted)
      void mod.mount(
        config.extensions,
        config.root,
        root,
        signal,
        globalController.signal,
      );
  }
}
void mountPage();
if (Object.values(config.tools).some(Boolean))
  void import("./modules/optional").then((m) =>
    m.mount(config.tools, globalController.signal),
  );
if (
  appearance.motion !== "off" &&
  (config.effects.click ||
    config.effects.typewriter ||
    config.effects.background ||
    config.effects.typing)
)
  void import("./modules/effects").then((m) =>
    m.mount(config.effects, globalController.signal),
  );
if (services.analytics.length || services.chat.enable)
  void import("./modules/services").then((m) =>
    m.mount(services.analytics, services.chat, globalController.signal),
  );
if (config.pwa && "serviceWorker" in navigator)
  void navigator.serviceWorker
    .register(config.root + "sw.js", { scope: config.root })
    .catch(() => {});
if (!config.pwa && "serviceWorker" in navigator)
  void navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations)
        if (
          registration.active?.scriptURL ===
          new URL(config.root + "sw.js", location.origin).href
        )
          void registration.unregister();
    })
    .catch(() => {});
if (config.search)
  void import("./modules/search").then((m) =>
    m.mount(config.root, globalController.signal, config.external_search),
  );
if (config.navigation) {
  void Promise.all([import("swup"), import("@swup/head-plugin"), import("./modules/transitions")]).then(
    ([{ default: Swup }, { default: HeadPlugin }, transitions]) => {
      const swup = new Swup({
        containers: ["#content"],
        animationSelector: false,
        timeout: 8000,
        ignoreVisit: (url) =>
          extras.navigation_exclude.some((prefix: string) =>
            new URL(url, location.href).pathname.startsWith(
              config.root + prefix.replace(/^\//, ""),
            ),
          ),
        plugins: [new HeadPlugin({ persistAssets: true, awaitAssets: true })],
      });
      transitions.mount(swup, appearance.motion, globalController.signal);
      swup.hooks.replace("fetch:request", async (_visit, { url, options }) => {
        const response = await fetch(url, options);
        if (!response.ok) throw Error("Navigation HTTP " + response.status);
        return response;
      });
      swup.hooks.before("content:replace", () => {
        pageController.abort();
        epoch++;
      });
      swup.hooks.on("page:view", () => mountPage(true));
      const error = document.querySelector<HTMLElement>("#navigation-error")!;
      let failedUrl = "";
      let latestVisit: number | undefined;
      swup.hooks.on("visit:start", visit => { latestVisit = visit.id; });
      const fail = (visit: { id?: number; to: { url: string }; from: { url: string } }) => {
        if (visit.id !== latestVisit) return;
        failedUrl = visit.to.url;
        error.hidden = false;
        swup.classes.clear();
        history.replaceState(history.state, "", visit.from.url);
        swup.location.href = new URL(visit.from.url, location.origin).href;
      };
      swup.hooks.replace("page:load", async (visit, { options }) => {
        try {
          const cached = visit.cache.read
            ? swup.cache.get(visit.to.url)
            : undefined;
          const page = cached || (await swup.fetchPage(visit.to.url, options));
          if (
            !new DOMParser()
              .parseFromString(page.html, "text/html")
              .querySelector("#content")
          )
            throw Error("Missing page container");
          return page;
        } catch {
          fail(visit);
          (visit as typeof visit & { abort: () => void }).abort();
          return {
            url: visit.from.url,
            html: document.documentElement.outerHTML,
          };
        }
      });
      swup.hooks.replace("visit:fail", fail);
      swup.hooks.on("visit:start", () => {
        error.hidden = true;
      });
      if (extras.interaction.loading_bar) {
        swup.hooks.on("visit:start", () =>
          document.documentElement.classList.add("is-navigating"),
        );
        for (const hook of ["visit:end", "visit:abort"] as const)
          swup.hooks.on(hook, () =>
            document.documentElement.classList.remove("is-navigating"),
          );
      }
      error.querySelector("button")?.addEventListener("click", () => {
        if (failedUrl) void swup.navigate(failedUrl);
      });
      Object.assign(window, {
        __hypergraph: {
          swup,
          get pageEpoch() {
            return epoch;
          },
        },
      });
    },
  );
}

mountShell(globalController.signal);
