import { t } from "./i18n";
const observers = new WeakMap<HTMLElement, IntersectionObserver>();
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
    if (!code.copy) return;
    if (pre.dataset.hgMounted) return;
    pre.dataset.hgMounted = "true";
    if (pre.closest("figure.highlight")) return;
    const button = document.createElement("button");
    button.className = "copy-code";
    button.textContent = t("Copy");
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
    if (code.theme) figure.dataset.codeTheme = code.theme;
    if (code.language && !figure.dataset.languageBound) {
      figure.dataset.languageBound = "true";
      const label = document.createElement("small");
      label.className = "code-language";
      label.textContent =
        [...figure.classList].find((name) => name !== "highlight") || "code";
      figure.before(label);
    }
    if (!code.copy) return;
    if (figure.dataset.hgMounted) return;
    figure.dataset.hgMounted = "true";
    const button = document.createElement("button");
    button.className = "copy-code";
    button.textContent = t("Copy");
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
    figure.before(button);
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
  const links = [...root.querySelectorAll<HTMLAnchorElement>(".toc a")];
  observers.get(root)?.disconnect();
  const runtime = JSON.parse(
    document.querySelector("#hg-config")!.textContent!,
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          for (const link of links)
            link.toggleAttribute(
              "aria-current",
              decodeURIComponent(link.hash.slice(1)) === entry.target.id,
            );
          if (runtime.interaction.anchor_update && !document.hidden)
            history.replaceState(
              history.state,
              "",
              "#" + encodeURIComponent(entry.target.id),
            );
        }
    },
    { rootMargin: "-10% 0px -70% 0px" },
  );
  observers.set(root, observer);
  root
    .querySelectorAll(".prose h2[id],.prose h3[id]")
    .forEach((el) => observer.observe(el));
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
}
