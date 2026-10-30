import { activatePanel, releasePanel } from "./panels";
import { t } from "./i18n";
const tocControllers = new WeakMap<HTMLElement, AbortController>();
export function mount(
  root: HTMLElement,
  signal: AbortSignal,
  code: {
    copy: boolean;
    fold: boolean;
    max_height: number;
    language?: boolean;
    theme?: string;
  } = { copy: true, fold: false, max_height: 0 },
) {
  const tocPanel = root.querySelector<HTMLDetailsElement>(".toc-mobile details");
  if (tocPanel && !tocPanel.dataset.bound) {
    tocPanel.dataset.bound = "true";
    const compact = matchMedia("(max-width:1023px)");
    const trigger = tocPanel.querySelector<HTMLElement>("summary")!;
    compact.addEventListener("change", () => {
      releasePanel(tocPanel);
      tocPanel.open = false;
    }, { signal });
    const closeToc = () => {
      tocPanel.open = false;
    };
    tocPanel.querySelector("[data-toc-close]")?.addEventListener("click", () => { releasePanel(tocPanel); tocPanel.open = false; trigger.focus(); }, { signal });
    tocPanel.addEventListener(
      "toggle",
      () => {
        if (!compact.matches) return;
        if (tocPanel.open) activatePanel(tocPanel, closeToc, trigger);
        else releasePanel(tocPanel);
      },
      { signal },
    );
    tocPanel.addEventListener(
      "click",
      (event) => {
        if (compact.matches && (event.target as Element).closest("a"))
          releasePanel(tocPanel);
      },
      { signal },
    );
    signal.addEventListener("abort", () => releasePanel(tocPanel), {
      once: true,
    });
  }
  const reading = root.querySelector<HTMLButtonElement>("[data-reading]");
  if (reading && !reading.dataset.bound) {
    reading.dataset.bound = "true";
    reading.addEventListener(
      "click",
      (e) => {
        const active = root.classList.toggle("reading-mode");
        (e.currentTarget as HTMLElement).setAttribute(
          "aria-pressed",
          String(active),
        );
      },
      { signal },
    );
  }
  root.querySelectorAll<HTMLElement>(".prose pre").forEach((pre) => {
    if (!code.copy || pre.closest("[data-diagram]")) return;
    if (pre.dataset.hgMounted) return;
    pre.dataset.hgMounted = "true";
    if (pre.closest("figure.highlight")) return;
    const button = document.createElement("button");
    button.className = "copy-code icon-button";
    button.setAttribute("aria-label", t("复制代码 / Copy code"));
    button.title = t("复制代码 / Copy code");
    button.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 8h13v13H8ZM16 8V3H3v13h5"/></svg>';
    button.addEventListener(
      "click",
      async () => {
        try {
          await navigator.clipboard.writeText(
            pre.querySelector("code")?.textContent || pre.textContent || "",
          );
          button.textContent = "✓";
        } catch {
          button.textContent = t("Select text");
        }
      },
      { signal },
    );
    pre.before(button);
  });
  root.querySelectorAll<HTMLElement>("figure.highlight").forEach((figure) => {
    if (figure.closest("[data-diagram]")) return;
    if (code.theme) figure.dataset.codeTheme = code.theme;
    let toolbar = figure.previousElementSibling as HTMLElement | null;
    if (
      !toolbar?.classList.contains("code-toolbar") &&
      (code.language || code.copy)
    ) {
      toolbar = document.createElement("div");
      toolbar.className = "code-toolbar";
      figure.before(toolbar);
    }
    if (code.language && !figure.dataset.languageBound) {
      figure.dataset.languageBound = "true";
      const label = document.createElement("small");
      label.className = "code-language";
      const language =
        [...figure.classList].find((name) => name !== "highlight") || "code";
      const glyphs: Record<string, string> = {
        javascript: "JS",
        js: "JS",
        typescript: "TS",
        ts: "TS",
        python: "PY",
        py: "PY",
        css: "CSS",
        html: "HTML",
        bash: "SH",
        shell: "SH",
        json: "{}",
        yaml: "YML",
        sql: "SQL",
      };
      const icon = document.createElement("span");
      icon.className = "code-emblem";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = glyphs[language] || "</>";
      const name = document.createElement("span");
      name.textContent = language;
      label.append(icon, name);
      toolbar!.append(label);
    }
    if (!code.copy) return;
    if (figure.dataset.hgMounted) return;
    figure.dataset.hgMounted = "true";
    const button = document.createElement("button");
    button.className = "copy-code icon-button";
    button.setAttribute("aria-label", t("复制代码 / Copy code"));
    button.title = t("复制代码 / Copy code");
    button.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 8h13v13H8ZM16 8V3H3v13h5"/></svg>';
    button.addEventListener(
      "click",
      async () => {
        try {
          await navigator.clipboard.writeText(
            Array.from(figure.querySelectorAll(".code .line"))
              .map((l) => l.textContent)
              .join("\n") ||
              figure.querySelector(".code")?.textContent ||
              "",
          );
          button.textContent = "✓";
        } catch {
          button.textContent = t("Select text");
        }
      },
      { signal },
    );
    toolbar!.append(button);
  });
  if (code.fold || code.max_height)
    root
      .querySelectorAll<HTMLElement>(".prose > pre,.prose figure.highlight")
      .forEach((block) => {
        if (block.dataset.foldBound) return;
        block.dataset.foldBound = "true";
        block.style.maxHeight = (code.max_height || 330) + "px";
        const button = document.createElement("button");
        button.className = "code-expand";
        button.textContent = t("展开代码 / Expand code");
        button.setAttribute("aria-expanded", "false");
        button.addEventListener(
          "click",
          () => {
            const expanded = button.getAttribute("aria-expanded") !== "true";
            block.style.maxHeight = expanded
              ? "none"
              : (code.max_height || 330) + "px";
            button.setAttribute("aria-expanded", String(expanded));
            button.textContent = expanded
              ? t("收起代码 / Collapse code")
              : t("展开代码 / Expand code");
          },
          { signal },
        );
        block.after(button);
      });
  root.querySelectorAll<HTMLTableElement>(".prose table").forEach((table) => {
    if (table.closest("figure.highlight") || table.dataset.copyBound) return;
    table.dataset.copyBound = "true";
    const button = document.createElement("button");
    button.className = "copy-table icon-button";
    button.title = t("复制表格 / Copy table");
    button.setAttribute("aria-label", button.title);
    button.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3h18v18H3ZM3 9h18M9 9v12M15 9v12M3 15h18"/></svg>';
    button.addEventListener(
      "click",
      async () => {
        try {
          await navigator.clipboard.writeText(
            [...table.rows]
              .map((row) =>
                [...row.cells].map((cell) => cell.innerText).join("\t"),
              )
              .join("\n"),
          );
          button.title = t("链接已复制 / Link copied")
            .replace("链接", "表格")
            .replace("Link", "Table");
          button.textContent = "✓";
        } catch {
          button.title = t("Select text");
        }
      },
      { signal },
    );
    const scroller = document.createElement("div");
    scroller.className = "table-scroll";
    table.before(button, scroller);
    scroller.append(table);
  });
  const links = [...root.querySelectorAll<HTMLAnchorElement>(".toc a")];
  tocControllers.get(root)?.abort();
  const tocController = new AbortController();
  tocControllers.set(root, tocController);
  const tocSignal = AbortSignal.any([signal, tocController.signal]);
  const runtime = JSON.parse(
    document.querySelector("#hg-config")!.textContent!,
  );
  const headings = links
    .map((link) => {
      try {
        return document.getElementById(decodeURIComponent(link.hash.slice(1)));
      } catch {
        return null;
      }
    })
    .filter(
      (heading): heading is HTMLElement => !!heading && root.contains(heading),
    );
  let frame = 0,
    hold = 0;
  const select = (id: string) =>
    links.forEach((link) => {
      const current = decodeURIComponent(link.hash.slice(1)) === id;
      if (current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  const update = () => {
    frame = 0;
    if (!headings.length || performance.now() < hold) return;
    const boundary = Math.min(160, innerHeight * 0.2);
    let current = headings[0];
    for (const heading of headings)
      if (heading.getBoundingClientRect().top <= boundary) current = heading;
    select(current.id);
    if (
      runtime.interaction.anchor_update &&
      !document.hidden &&
      location.hash !== "#" + encodeURIComponent(current.id)
    )
      history.replaceState(
        history.state,
        "",
        "#" + encodeURIComponent(current.id),
      );
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  for (const link of links)
    link.addEventListener(
      "click",
      () => {
        hold = performance.now() + 1200;
        select(decodeURIComponent(link.hash.slice(1)));
      },
      { signal: tocSignal },
    );
  const release = () => {
    hold = 0;
    schedule();
  };
  window.addEventListener("scroll", schedule, {
    passive: true,
    signal: tocSignal,
  });
  window.addEventListener("resize", release, { signal: tocSignal });
  window.addEventListener("wheel", release, {
    passive: true,
    signal: tocSignal,
  });
  window.addEventListener("touchstart", release, {
    passive: true,
    signal: tocSignal,
  });
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        release();
    },
    { signal: tocSignal },
  );
  window.addEventListener(
    "hashchange",
    () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (headings.some((h) => h.id === id)) {
        hold = performance.now() + 1200;
        select(id);
      }
    },
    { signal: tocSignal },
  );
  tocSignal.addEventListener("abort", () => cancelAnimationFrame(frame), {
    once: true,
  });
  update();
}
