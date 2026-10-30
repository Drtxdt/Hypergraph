import { t } from "./i18n";
export function mount(root: HTMLElement, signal: AbortSignal) {
  root
    .querySelectorAll<HTMLDetailsElement>(".share-platforms")
    .forEach((details) => {
      const animations: Animation[] = [];
      const cancel = () => animations.splice(0).forEach((animation) => animation.cancel());
      details.addEventListener("toggle", () => {
        cancel();
        if (!details.open || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off") return;
        details.querySelectorAll<HTMLElement>(".share-platform-list > *").forEach((item, index) => {
          animations.push(item.animate([
            { opacity: 0, transform: "translateX(-16px)" },
            { opacity: 1, transform: "translateX(0)" },
          ], { duration: 240, delay: Math.min(index, 6) * 28, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" }));
        });
      }, { signal });
      signal.addEventListener("abort", cancel, { once: true });
      details.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape") {
            details.open = false;
            details.querySelector("summary")?.focus();
          }
        },
        { signal },
      );
    });
  root
    .querySelectorAll<HTMLButtonElement>("[data-share],[data-copy-share]")
    .forEach((button) =>
      button.addEventListener(
        "click",
        async () => {
          const data = { title: button.dataset.title, url: button.dataset.url };
          try {
            if (!button.hasAttribute("data-copy-share") && navigator.share)
              await navigator.share(data);
            else {
              await navigator.clipboard.writeText(data.url!);
              button
                .closest(".post-actions")!
                .querySelector(".share-feedback")!.textContent = t(
                "链接已复制 / Link copied",
              );
            }
          } catch (error) {
            if ((error as Error).name !== "AbortError")
              button
                .closest(".post-actions")!
                .querySelector(".share-feedback")!.textContent = t(
                "请复制地址栏链接 / Copy address bar URL",
              );
          }
        },
        { signal },
      ),
    );
}
