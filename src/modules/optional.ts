import { t } from "./i18n";
type Options = {
  back_to_top: boolean;
  progress: boolean;
  keyboard: boolean;
  copy_copyright: boolean;
  title_away: string;
};
export function mount(config: Options, signal: AbortSignal) {
  if (config.back_to_top) {
    const button = document.createElement("button");
    button.className = "back-to-top";
    button.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path class="top-cap" d="M5 4h14"/><path class="top-arrow" d="m6 13 6-6 6 6M12 7v14"/></svg>';
    button.setAttribute("aria-label", t("返回顶部 / Back to top"));
    document.body.append(button);
    button.addEventListener(
      "click",
      () =>
        scrollTo({
          top: 0,
          behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
            ? "instant"
            : "smooth",
        }),
      { signal },
    );
    signal.addEventListener("abort", () => button.remove(), { once: true });
  }
  if (config.progress) {
    const bar = document.createElement("div");
    bar.className = "reading-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.append(bar);
    const update = () => {
      const total = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${total > 0 ? scrollY / total : 0})`;
    };
    document.addEventListener("scroll", update, { passive: true, signal });
    update();
    signal.addEventListener("abort", () => bar.remove(), { once: true });
  }
  if (config.keyboard)
    document.addEventListener(
      "keydown",
      (e) => {
        if (
          (e.target as HTMLElement).closest("input,textarea,[contenteditable]")
        )
          return;
        if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          document.querySelector<HTMLButtonElement>("[data-search]")?.click();
        }
        if (e.key === "t" && e.altKey) {
          e.preventDefault();
          document
            .querySelector<HTMLButtonElement>("[data-mode-toggle]")
            ?.click();
        }
      },
      { signal },
    );
  if (config.copy_copyright)
    document.addEventListener(
      "copy",
      (e) => {
        const selection = getSelection();
        if (
          !selection ||
          selection.toString().length < 100 ||
          !selection.anchorNode?.parentElement?.closest(".prose")
        )
          return;
        if (selection.anchorNode.parentElement.closest(".encrypted,pre,code"))
          return;
        e.clipboardData?.setData(
          "text/plain",
          selection.toString() + "\n\n" + document.title + "\n" + location.href,
        );
        e.preventDefault();
      },
      { signal },
    );
  if (config.title_away) {
    let original = document.title;
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          original = document.title;
          document.title = config.title_away;
        } else document.title = original;
      },
      { signal },
    );
  }
}
