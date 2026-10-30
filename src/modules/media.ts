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
  let image = document.createElement("img");
  const picture = document.createElement("picture");
  picture.append(image);
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const retry = document.createElement("button");
  retry.textContent = t("重试 / Retry");
  retry.className = "image-retry";
  retry.hidden = true;
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
  dialog.append(close, previous, next, picture, caption, status, retry);
  document.body.append(dialog);
  const images = [
    ...root.querySelectorAll<HTMLImageElement>(
      ".prose img,.gallery img,.collection-gallery img",
    ),
  ].filter((img) => !img.closest("a") || !!img.closest(".photo-grid"));
  let index = 0;
  let animation: Animation | undefined;
  let request = 0;
  const show = (target: number) => {
    animation?.cancel();
    const version = ++request;
    index = (target + images.length) % images.length;
    const original = images[index];
    image = document.createElement("img");
    image.alt = original.alt;
    image.hidden = true;
    retry.hidden = true;
    status.textContent = t("正在加载图片 / Loading image");
    dialog.setAttribute("aria-busy", "true");
    picture.replaceChildren();
    const selected = image;
    const failed = () => {
      if (version !== request || signal.aborted) return;
      dialog.setAttribute("aria-busy", "false");
      status.textContent = t("图片加载失败 / Image unavailable");
      retry.hidden = false;
    };
    selected.addEventListener("error", failed, { once: true });
    selected.addEventListener("load", async () => {
      try { await selected.decode(); } catch { failed(); return; }
      if (version !== request || signal.aborted) return;
      selected.hidden = false;
      status.textContent = "";
      dialog.setAttribute("aria-busy", "false");
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches && document.documentElement.dataset.motion !== "off") {
        animation = selected.animate([{ opacity: 0, transform: "translateY(8px) scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
      }
    }, { once: true });
    if (original.currentSrc) selected.src = original.currentSrc;
    else {
      original.closest("picture")?.querySelectorAll("source").forEach(source => picture.append(source.cloneNode(true)));
      if (original.srcset) selected.srcset = original.srcset;
      if (original.sizes) selected.sizes = original.sizes;
      if (original.getAttribute("src")) selected.src = original.src;
    }
    picture.append(selected);
    if (!selected.getAttribute("src") && !selected.srcset && !picture.querySelector("source")) failed();
    caption.textContent = `${index + 1} / ${images.length} · ${image.alt}`;
    previous.hidden = next.hidden = images.length < 2;
  };
  retry.addEventListener("click", () => show(index), { signal });
  dialog.addEventListener("close", () => { request++; animation?.cancel(); }, { signal });
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
    const link = img.closest("a");
    if (link && !img.closest(".photo-grid")) continue;
    const trigger: HTMLElement = link || img;
    trigger.tabIndex = 0;
    if (!link) trigger.setAttribute("role", "button");
    trigger.setAttribute("aria-label", t("查看大图 / View image"));
    const open = () => {
      show(images.indexOf(img));
      openModal(dialog);
    };
    trigger.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); open();
    }, { signal });
    trigger.addEventListener(
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
