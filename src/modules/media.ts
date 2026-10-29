import { t } from "./i18n";
import { openModal } from "./panels";
export function mount(root: HTMLElement, signal: AbortSignal) {
  if (root.dataset.lightboxMounted) return;
  root.dataset.lightboxMounted = "true";
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  const close = document.createElement("button");
  close.textContent = "✕";
  close.setAttribute("aria-label", t("关闭 / Close"));
  const image = document.createElement("img");
  const caption = document.createElement("p");
  const previous = document.createElement("button"),
    next = document.createElement("button");
  previous.textContent = "←";
  next.textContent = "→";
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
  const show = (target: number) => {
    index = (target + images.length) % images.length;
    image.src = images[index].currentSrc;
    image.alt = images[index].alt;
    caption.textContent = `${index + 1} / ${images.length} · ${image.alt}`;
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
      dialog.remove();
      delete root.dataset.lightboxMounted;
    },
    { once: true },
  );
}
