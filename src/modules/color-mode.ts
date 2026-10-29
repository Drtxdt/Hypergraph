export const isDark = () =>
  document.documentElement.dataset.mode === "dark" ||
  (document.documentElement.dataset.mode === "auto" &&
    matchMedia("(prefers-color-scheme:dark)").matches);
export function watchMode(
  callback: (dark: boolean) => void,
  signal: AbortSignal,
) {
  const update = () => callback(isDark());
  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"],
  });
  const media = matchMedia("(prefers-color-scheme:dark)");
  media.addEventListener("change", update, { signal });
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
}
