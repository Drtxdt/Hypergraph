import { t } from "./i18n";
export function mount(root: HTMLElement, signal: AbortSignal) {
  root.querySelectorAll<HTMLButtonElement>("[data-share]").forEach((button) =>
    button.addEventListener(
      "click",
      async () => {
        const data = { title: button.dataset.title, url: button.dataset.url };
        try {
          if (navigator.share) await navigator.share(data);
          else {
            await navigator.clipboard.writeText(data.url!);
            button.textContent = t("链接已复制 / Link copied");
          }
        } catch (error) {
          if ((error as Error).name !== "AbortError")
            button.textContent = t("请复制地址栏链接 / Copy address bar URL");
        }
      },
      { signal },
    ),
  );
}
