export type Appearance = {
  intro: "session" | "always" | "off";
  intro_scope: "home" | "all";
  fallback_image: string;
  captions: boolean;
  motion: "cinematic" | "subtle" | "off";
  cover_tint?: boolean;
};
export function mount(
  root: HTMLElement,
  config: Appearance,
  signal: AbortSignal,
) {
  if (config.fallback_image)
    root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      if (img.closest("[data-responsive-image]")) return;
      const fallback = () => {
        if (img.dataset.fallback) return;
        img.dataset.fallback = "true";
        const base = JSON.parse(
          document.querySelector("#hg-config")!.textContent!,
        ).root;
        img.src = config.fallback_image.startsWith("/")
          ? base + config.fallback_image.replace(/^\//, "")
          : config.fallback_image;
      };
      img.addEventListener("error", fallback, { signal });
      if (img.complete && !img.naturalWidth) fallback();
    });
  if (config.captions)
    root
      .querySelectorAll<HTMLImageElement>(".prose img[alt]")
      .forEach((img) => {
        if (
          img.closest("figure") ||
          !img.alt ||
          img.classList.contains("inline-image")
        )
          return;
        const figure = document.createElement("figure"),
          caption = document.createElement("figcaption");
        caption.textContent = img.alt;
        img.replaceWith(figure);
        figure.append(img, caption);
      });
  if (
    config.motion !== "off" &&
    !matchMedia("(prefers-reduced-motion:reduce)").matches
  ) {
    mountMotion(root, config.motion, signal);
  }
  if (config.cover_tint) {
    const image = root.querySelector<HTMLImageElement>(
      ".article-cover img, .lead-media img",
    );
    if (image) {
      const apply = () => {
        if (signal.aborted) return;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d")!;
          context.drawImage(image, 0, 0, 1, 1);
          const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
          root.style.setProperty("--cover-tint", `rgb(${r} ${g} ${b} / .15)`);
          root
            .querySelector<HTMLElement>(".article-head")
            ?.style.setProperty("background", "var(--cover-tint)");
        } catch {}
      };
      if (image.complete) apply();
      else image.addEventListener("load", apply, { once: true, signal });
    }
  }
}

function mountMotion(
  root: HTMLElement,
  mode: Appearance["motion"],
  signal: AbortSignal,
) {
  const mobile = matchMedia("(max-width:1023px)").matches;
  const save = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection?.saveData;
  const cinematic = mode === "cinematic" && !save;
  const animations = new Set<Animation>();
  const animate = (element: Element, delay = 0) => {
    const animation = element.animate(
      cinematic && element.matches(".masthead-copy,.masthead-media")
        ? [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0)" }]
        : [
            { opacity: 0.85, transform: "translateY(6px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
      {
        duration: cinematic
          ? element.matches(".masthead-media")
            ? 420
            : 320
          : 180,
        delay,
        easing: "cubic-bezier(.2,.7,.2,1)",
      },
    );
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation)).catch(() => {});
  };
  const enter = () => {
    if (signal.aborted || document.documentElement.dataset.transition) return;
    const options = JSON.parse(
      document.querySelector("#hg-config")!.textContent!,
    );
    for (const [selector, delay] of [
      [".masthead-media", 0],
      [".masthead-copy > span", 40],
      ["[data-masthead-title]", 80],
      [".masthead-action", 120],
    ] as const) {
      if (options.effects?.typewriter && selector === "[data-masthead-title]")
        continue;
      root
        .querySelectorAll(selector)
        .forEach((el) => animate(el, cinematic ? delay : 0));
    }
  };
  if (document.documentElement.classList.contains("intro-active"))
    document.addEventListener("hypergraph:intro-reveal", enter, {
      once: true,
      signal,
    });
  else if (!(window as Window & { __hgIntroResult?: unknown }).__hgIntroResult)
    enter();
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.1 },
  );
  root.querySelectorAll(".entry").forEach((el) => observer.observe(el));
  const media = root.querySelector<HTMLElement>(".lead-media");
  if (
    cinematic &&
    !mobile &&
    matchMedia("(pointer:fine)").matches &&
    media &&
    media.dataset.fit !== "contain"
  ) {
    const image = media.querySelector<HTMLElement>("img");
    media.addEventListener(
      "pointermove",
      (e) => {
        if (document.hidden || !image) return;
        const rect = media.getBoundingClientRect();
        image.style.transform =
          "scale(1.025) translate(" +
          ((e.clientX - rect.left) / rect.width - 0.5) * 6 +
          "px," +
          ((e.clientY - rect.top) / rect.height - 0.5) * 6 +
          "px)";
      },
      { signal },
    );
    media.addEventListener(
      "pointerleave",
      () => {
        if (image) image.style.transform = "";
      },
      { signal },
    );
  }
  document.addEventListener(
    "visibilitychange",
    () => animations.forEach((a) => (document.hidden ? a.pause() : a.play())),
    { signal },
  );
  signal.addEventListener(
    "abort",
    () => {
      observer.disconnect();
      animations.forEach((a) => a.cancel());
    },
    { once: true },
  );
}
