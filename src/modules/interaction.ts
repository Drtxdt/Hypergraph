import { t } from "./i18n";
import { openModal } from "./panels";
type Options = {
  translate: boolean;
  spacing: boolean;
  context_menu: boolean;
  console: boolean;
  console_message: string;
  shortcuts_help: boolean;
  greeting: string;
  privacy_url: string;
  privacy_version: string;
  prefetch: boolean;
  anchor_update: boolean;
  loading_bar: boolean;
  random_post: boolean;
  toolbar: string[];
};
const button = (label: string, action: () => void, signal: AbortSignal) => {
  const b = document.createElement("button");
  b.textContent = label;
  b.type = "button";
  b.addEventListener("click", action, { signal });
  return b;
};
export function mount(config: Options, signal: AbortSignal) {
  if (config.console_message) console.info(config.console_message);
  const actions: Record<string, () => void> = {
    mode: () =>
      document.querySelector<HTMLButtonElement>("[data-mode-toggle]")?.click(),
    reading: () =>
      document.querySelector<HTMLButtonElement>("[data-reading]")?.click(),
    toc: () => {
      const toc =
        document.querySelector<HTMLDetailsElement>(".toc-panel details");
      if (toc) {
        toc.open = true;
        toc.scrollIntoView();
        toc.querySelector("summary")?.focus();
      }
    },
    comments: () => document.querySelector("[data-comments]")?.scrollIntoView(),
    sidebar: () => document.body.classList.toggle("hide-sidebar"),
    top: () => scrollTo({ top: 0 }),
    search: () =>
      document.querySelector<HTMLButtonElement>("[data-search]")?.click(),
  };
  const labels: Record<string, string> = {
    mode: "◐",
    reading: t("阅读 / Read"),
    toc: t("目录 / TOC"),
    comments: t("评论 / Comments"),
    sidebar: t("侧栏 / Sidebar"),
    top: "↑",
    search: "⌕",
  };
  if (config.toolbar.length) {
    const bar = document.createElement("nav");
    bar.className = "utility-toolbar";
    bar.setAttribute("aria-label", t("页面工具 / Page tools"));
    for (const item of config.toolbar)
      bar.append(button(labels[item], actions[item], signal));
    document.body.append(bar);
    signal.addEventListener("abort", () => bar.remove(), { once: true });
  }
  const dialog = document.createElement("dialog");
  dialog.className = "utility-dialog";
  const content = document.createElement("div");
  dialog.append(
    button(t("关闭 / Close"), () => dialog.close(), signal),
    content,
  );
  document.body.append(dialog);
  signal.addEventListener("abort", () => dialog.remove(), { once: true });
  const show = (text: string) => {
    content.replaceChildren();
    const p = document.createElement("p");
    p.textContent = text;
    content.append(p);
    openModal(dialog);
  };
  const help = () =>
    show(
      t(
        "/ 搜索 · Alt+T 明暗模式 · Tab 焦点移动 · Enter 激活 · Esc 关闭 / Search, theme, focus, activate, close",
      ),
    );
  if (config.shortcuts_help)
    document.addEventListener(
      "keydown",
      (e) => {
        if (
          e.key === "?" &&
          !(e.target as HTMLElement).closest("input,textarea,[contenteditable]")
        ) {
          e.preventDefault();
          help();
        }
      },
      { signal },
    );
  if (config.console) {
    const panel = button(
      t("工具 / Tools"),
      () => {
        content.replaceChildren();
        for (const item of ["search", "mode", "reading", "comments"])
          content.append(
            button(
              labels[item],
              () => {
                dialog.close();
                actions[item]();
              },
              signal,
            ),
          );
        content.append(button(t("快捷键 / Shortcuts"), help, signal));
        const links = document.createElement("p");
        for (const link of document.querySelectorAll<HTMLAnchorElement>(
          ".taxonomy a",
        ))
          links.append(link.cloneNode(true));
        content.append(links);
        openModal(dialog);
      },
      signal,
    );
    panel.className = "utility-trigger";
    document.body.append(panel);
  }
  if (config.context_menu) {
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.hidden = true;
    menu.setAttribute("role", "menu");
    for (const item of ["search", "mode", "top"])
      menu.append(
        button(
          labels[item],
          () => {
            menu.hidden = true;
            actions[item]();
          },
          signal,
        ),
      );
    menu.append(
      button(
        t("复制链接 / Copy link"),
        () => {
          void navigator.clipboard?.writeText(location.href);
          menu.hidden = true;
        },
        signal,
      ),
    );
    document.body.append(menu);
    document.addEventListener(
      "contextmenu",
      (e) => {
        if (
          e.shiftKey ||
          (e.target as HTMLElement).closest(
            "input,textarea,a,img,video,pre,code,[contenteditable]",
          ) ||
          getSelection()?.toString()
        )
          return;
        e.preventDefault();
        menu.hidden = false;
        menu.style.left =
          Math.min(e.clientX, innerWidth - menu.offsetWidth - 8) + "px";
        menu.style.top =
          Math.min(e.clientY, innerHeight - menu.offsetHeight - 8) + "px";
        menu.querySelector("button")?.focus();
      },
      { signal },
    );
    document.addEventListener(
      "click",
      (e) => {
        if (!menu.contains(e.target as Node)) menu.hidden = true;
      },
      { signal },
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") menu.hidden = true;
      },
      { signal },
    );
    signal.addEventListener("abort", () => menu.remove(), { once: true });
  }
  if (config.privacy_url) {
    let accepted = false;
    try {
      accepted =
        localStorage.getItem("hypergraph-privacy") === config.privacy_version;
    } catch {}
    if (!accepted) {
      const notice = document.createElement("aside");
      notice.className = "privacy-notice";
      const link = document.createElement("a");
      link.href = config.privacy_url;
      link.textContent = t("隐私说明 / Privacy");
      notice.append(
        link,
        button(
          t("我已了解 / Dismiss"),
          () => {
            try {
              localStorage.setItem(
                "hypergraph-privacy",
                config.privacy_version,
              );
            } catch {}
            notice.remove();
          },
          signal,
        ),
      );
      document.body.append(notice);
    }
  }
  if (config.prefetch) {
    const seen = new Set<string>();
    document.addEventListener(
      "pointerover",
      (e) => {
        const connection = (
          navigator as Navigator & {
            connection?: { saveData?: boolean; effectiveType?: string };
          }
        ).connection;
        if (connection?.saveData || connection?.effectiveType?.includes("2g"))
          return;
        const a = (e.target as HTMLElement).closest<HTMLAnchorElement>(
          "a[href]",
        );
        if (
          !a ||
          a.origin !== location.origin ||
          a.download ||
          a.target ||
          a.search ||
          a.hash ||
          a.hasAttribute("data-no-prefetch") ||
          seen.has(a.href) ||
          seen.size >= 8 ||
          /\.[a-z0-9]+$/i.test(a.pathname)
        )
          return;
        seen.add(a.href);
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = a.href;
        document.head.append(link);
      },
      { passive: true, signal },
    );
  }
  if (config.translate) {
    const toggle = button(
      t("繁 / 简"),
      () => {
        void import("./translate").then((m) => m.toggle());
      },
      signal,
    );
    toggle.className = "translate-toggle";
    document.querySelector("#site-nav")?.append(toggle);
    document.addEventListener(
      "hypergraph:mount",
      () => {
        void import("./translate").then((m) => m.refresh());
      },
      { signal },
    );
  }
  if (config.greeting) {
    const notice = document.createElement("p");
    notice.className = "greeting";
    notice.textContent = config.greeting.replace(
      "{hour}",
      String(new Date().getHours()),
    );
    document.querySelector(".site-header")?.after(notice);
  }
  const apply = () => {
    const root = document.querySelector<HTMLElement>("#content");
    if (!root) return;
    if (config.spacing) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (
          node.parentElement?.closest(
            "pre,code,script,style,textarea,.katex,mjx-container,[data-comments]",
          )
        )
          continue;
        node.textContent = node
          .textContent!.replace(/([\u3400-\u9fff])([A-Za-z0-9])/g, "$1 $2")
          .replace(/([A-Za-z0-9])([\u3400-\u9fff])/g, "$1 $2");
      }
    }
  };
  apply();
  document.addEventListener("hypergraph:mount", apply, { signal });
  document.addEventListener("hypergraph:unlock", apply, { signal });
  if (config.random_post) {
    const b = button(
      t("随便看看 / Random"),
      async () => {
        try {
          const root = JSON.parse(
            document.querySelector("#hg-config")!.textContent!,
          ).root;
          const response = await fetch(root + "random.json", { signal });
          const paths = await response.json();
          if (paths.length)
            location.assign(
              root + paths[Math.floor(Math.random() * paths.length)],
            );
        } catch {}
      },
      signal,
    );
    document.querySelector("#site-nav")?.append(b);
  }
}
