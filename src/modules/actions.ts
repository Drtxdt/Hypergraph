import { t } from "./i18n";
export function mount(root: HTMLElement, signal: AbortSignal) {
  root.querySelectorAll<HTMLDetailsElement>(".share-platforms").forEach((details) => {
    details.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { details.open = false; details.querySelector("summary")?.focus(); }
    }, { signal });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-share],[data-copy-share]").forEach((button) =>
    button.addEventListener(
      "click",
      async () => {
        const data = { title: button.dataset.title, url: button.dataset.url };
        try {
          if (!button.hasAttribute("data-copy-share") && navigator.share) await navigator.share(data);
          else {
            await navigator.clipboard.writeText(data.url!);
            button.closest(".post-actions")!.querySelector(".share-feedback")!.textContent = t("链接已复制 / Link copied");
          }
        } catch (error) {
          if ((error as Error).name !== "AbortError")
            button.closest(".post-actions")!.querySelector(".share-feedback")!.textContent = t("请复制地址栏链接 / Copy address bar URL");
        }
      },
      { signal },
    ),
  );
}
