import { t } from "./i18n";
import { openModal } from "./panels";
export function mount(root: HTMLElement, signal: AbortSignal) {
  if (root.dataset.lightboxMounted) return;
  root.dataset.lightboxMounted = "true";
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  const close = document.createElement("button");
  const icon = (path: string) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="${path}"/></svg>`;
  close.innerHTML = icon("m6 6 12 12M6 18 18 6");
  close.className = "image-close";
  close.setAttribute("aria-label", t("关闭 / Close"));
  const image = document.createElement("img");
  const caption = document.createElement("p");
  const previous = document.createElement("button"),
    next = document.createElement("button");
  previous.innerHTML = icon("m14 5-7 7 7 7M7 12h14");
  next.innerHTML = icon("m10 5 7 7-7 7M3 12h14");
  previous.className = "image-previous";
  next.className = "image-next";
  caption.setAttribute("aria-live", "polite");
  dialog.setAttribute("aria-label", t("查看大图 / View image"));
  previous.setAttribute("aria-label", t("上一张 / Previous"));
  next.setAttribute("aria-label", t("下一张 / Next"));
  dialog.append(close, previous, next, image, caption);
  document.body.append(dialog);
  const images = [
    ...root.querySelectorAll<HTMLImageElement>(
      ".prose img,.gallery img,.collection-gallery img",
    ),
  ].filter((img) => !img.closest("a"));
  let index = 0;
  let animation: Animation | undefined;
  const show = (target: number) => {
    animation?.cancel();
    index = (target + images.length) % images.length;
    image.src = images[index].currentSrc;
    image.alt = images[index].alt;
    caption.textContent = `${index + 1} / ${images.length} · ${image.alt}`;
    previous.hidden = next.hidden = images.length < 2;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && document.documentElement.dataset.motion !== "off") {
      animation = image.animate([{ opacity: 0, transform: "translateY(8px) scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
    }
  };
  previous.addEventListener("click", () => show(index - 1), { signal });
  next.addEventListener("click", () => show(index + 1), { signal });
  dialog.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        show(index - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        show(index + 1);
      }
    },
    { signal },
  );
  close.addEventListener("click", () => dialog.close(), { signal });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }, { signal });
  for (const img of images) {
    if (img.closest("a")) continue;
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", t("查看大图 / View image"));
    const open = () => {
      show(images.indexOf(img));
      openModal(dialog);
    };
    img.addEventListener("click", open, { signal });
    img.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      },
      { signal },
    );
  }
  signal.addEventListener(
    "abort",
    () => {
      animation?.cancel();
      dialog.remove();
      delete root.dataset.lightboxMounted;
    },
    { once: true },
  );
}
