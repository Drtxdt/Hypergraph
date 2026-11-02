import {
  objectGeometry,
  pointBounds,
  type Point,
  type Bounds,
} from "./print-geometry";

/** One visit owns preparation, entry and drawing. The static DOM is always the fallback. */
export function mount(
  root: HTMLElement,
  signal: AbortSignal,
  navigation: boolean,
  entryOpen = true,
) {
  const target = root.querySelector<HTMLElement>(
    ".masthead-media,.masthead-artwork",
  );
  if (!target || signal.aborted) return;
  const lifetime = new AbortController(),
    options = { signal: lifetime.signal };
  let finished = false,
    started = false,
    raf = 0,
    canvas: HTMLCanvasElement | undefined;
  let prepared = false,
    points: Point[] = [],
    bounds: Bounds,
    rect: DOMRect,
    mediaBox: DOMRect | undefined,
    ctx: CanvasRenderingContext2D | null = null;
  const media = target.querySelector<HTMLElement>("picture,.site-wordmark");
  const img = target.querySelector<HTMLImageElement>("img");
  const intro = document.querySelector<HTMLElement>(
    "[data-intro]:not([hidden])",
  );
  const observer = new IntersectionObserver((entries) => {
    if (started && !entries[0].isIntersecting) stop("offscreen");
  });
  const mutation = new MutationObserver(() => stop("mode-change"));
  function stop(reason = "cancelled") {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    mutation.disconnect();
    lifetime.abort();
    signal.removeEventListener("abort", abort);
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
      canvas.remove();
    }
    media?.style.removeProperty("clip-path");
    target!.classList.remove("print-prepared");
    target!.dataset.laserState = reason;
    target!.dataset.laserEnded = String(performance.now());
  }
  const abort = () => stop("cancelled");
  signal.addEventListener("abort", abort, { once: true });
  target.dataset.laserState = "waiting";
  observer.observe(target);
  mutation.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"],
  });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) stop("hidden");
    },
    options,
  );
  document.fonts?.addEventListener(
    "loadingdone",
    () => stop("font-change"),
    options,
  );
  window.addEventListener("resize", () => stop("resize"), options);
  target.addEventListener(
    "hypergraph:media-change",
    () => stop("media-change"),
    options,
  );
  matchMedia("(prefers-color-scheme:dark)").addEventListener(
    "change",
    () => stop("mode-change"),
    options,
  );
  matchMedia("(prefers-reduced-motion:reduce)").addEventListener(
    "change",
    () => stop("reduced-motion"),
    options,
  );
  function prepare() {
    if (finished || prepared || target!.hidden || document.hidden) return;
    if (img && (!img.complete || !img.naturalWidth)) return;
    rect = target!.getBoundingClientRect();
    mediaBox = media?.getBoundingClientRect();
    if (
      !rect.width ||
      !rect.height ||
      rect.bottom < 0 ||
      rect.top > innerHeight
    ) {
      stop("offscreen");
      return;
    }
    const sample = document.createElement("canvas");
    const ratio = Math.min(1, 240 / rect.width, 160 / rect.height);
    sample.width = Math.ceil(rect.width * ratio);
    sample.height = Math.ceil(rect.height * ratio);
    const sc = sample.getContext("2d", { willReadFrequently: true });
    if (!sc) {
      stop("canvas-unavailable");
      return;
    }
    sc.scale(ratio, ratio);
    bounds = { x: 0, y: 0, width: rect.width, height: rect.height };
    let sampled = false;
    if (img) {
      const ir = img.getBoundingClientRect(),
        css = getComputedStyle(img);
      const box = objectGeometry(
        ir.width,
        ir.height,
        img.naturalWidth,
        img.naturalHeight,
        css.objectFit,
        css.objectPosition,
      );
      bounds = {
        x: box.x + ir.left - rect.left,
        y: box.y + ir.top - rect.top,
        width: box.width,
        height: box.height,
      };
      if (
        target!.classList.contains("masthead-artwork") &&
        new URL(img.currentSrc, location.href).origin === location.origin
      ) {
        try {
          sc.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height);
          sampled = true;
        } catch {}
      }
    } else if (media) {
      const text = media.firstChild;
      if (text?.nodeType === Node.TEXT_NODE) {
        const css = getComputedStyle(media),
          range = document.createRange();
        sc.fillStyle = "#000";
        sc.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
        sc.textBaseline = "alphabetic";
        sc.fontKerning = "normal";
        const lines: { start: number; end: number; box: DOMRect }[] = [];
        for (let i = 0; i < (text.textContent?.length || 0);) {
          const length = String.fromCodePoint(
            text.textContent!.codePointAt(i)!,
          ).length;
          range.setStart(text, i);
          range.setEnd(text, i + length);
          const box = range.getBoundingClientRect();
          const last = lines.at(-1);
          if (last && Math.abs(last.box.top - box.top) < 1) {
            last.end = i + length;
            last.box = new DOMRect(
              last.box.x,
              last.box.y,
              box.right - last.box.x,
              last.box.height,
            );
          } else lines.push({ start: i, end: i + length, box });
          i += length;
        }
        // Each rendered line uses the same shaping/font and measured DOM bounds.
        for (const line of lines) {
          const value = text.textContent!.slice(line.start, line.end);
          const metrics = sc.measureText(value);
          const ascent =
            metrics.fontBoundingBoxAscent || parseFloat(css.fontSize) * 0.8;
          const descent =
            metrics.fontBoundingBoxDescent || parseFloat(css.fontSize) * 0.2;
          sc.fillText(
            value,
            line.box.left - rect.left,
            line.box.top -
              rect.top +
              (line.box.height - ascent - descent) / 2 +
              ascent,
            line.box.width,
          );
        }
        sampled = true;
      }
    }
    if (sampled)
      try {
        const pixels = sc.getImageData(0, 0, sample.width, sample.height).data;
        for (let y = 0; y < sample.height; y++)
          for (let x = 0; x < sample.width; x++)
            if (pixels[(y * sample.width + x) * 4 + 3] > 40)
              points.push([x / ratio, y / ratio]);
      } catch {
        points = [];
      }
    const limit = innerWidth < 1024 ? 900 : 1800,
      stride = Math.max(1, Math.ceil(points.length / limit));
    points = points.filter((_, i) => i % stride === 0);
    bounds = pointBounds(points, bounds);
    bounds = {
      x: Math.max(0, bounds.x),
      y: Math.max(0, bounds.y),
      width: Math.max(
        0,
        Math.min(rect.width, bounds.x + bounds.width) - Math.max(0, bounds.x),
      ),
      height: Math.max(
        0,
        Math.min(rect.height, bounds.y + bounds.height) - Math.max(0, bounds.y),
      ),
    };
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    const dpr = Math.min(
      devicePixelRatio,
      2,
      Math.sqrt(1500000 / (rect.width * rect.height)),
    );
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx = canvas.getContext("2d");
    if (!ctx) {
      stop("canvas-unavailable");
      return;
    }
    ctx.scale(dpr, dpr);
    canvas.dataset.targetPoints = String(points.length);
    canvas.dataset.bounds = JSON.stringify(bounds);
    // Only concealed decorative content may be prepared for a true reveal.
    if (
      intro &&
      getComputedStyle(intro).opacity === "1" &&
      target!.classList.contains("masthead-artwork") &&
      media
    ) {
      media.style.clipPath = "inset(100% 0 0)";
      target!.classList.add("print-prepared");
    }
    prepared = true;
    target!.dataset.laserState = "prepared";
  }
  function start() {
    if (finished || started) return;
    if (!prepared) {
      stop("media-not-ready");
      return;
    }
    started = true;
    canvas!.dataset.laserCanvas = "";
    target!.append(canvas!);
    const begin = performance.now(),
      ink =
        getComputedStyle(target!).getPropertyValue("--ink").trim() || "#222";
    target!.dataset.laserState = "running";
    target!.dataset.laserStarted = String(begin);
    function draw(now: number) {
      if (finished) return;
      const p = Math.min(1, (now - begin) / 1600),
        scan = Math.max(0, Math.min(1, (p - 0.12) / 0.7)),
        front = bounds.y + bounds.height * (1 - scan);
      canvas!.dataset.progress = String(p);
      canvas!.dataset.phase =
        p < 0.12
          ? "incident"
          : p < 0.82
            ? "deposit"
            : p < 0.94
              ? "residue"
              : "settle";
      if (target!.classList.contains("print-prepared") && media)
        media.style.clipPath = `inset(${Math.max(0, Math.min(100, ((front - ((mediaBox?.top || rect.top) - rect.top)) / (mediaBox?.height || rect.height)) * 100))}% 0 0)`;
      ctx!.clearRect(0, 0, rect.width, rect.height);
      ctx!.globalAlpha = p > 0.82 ? (1 - p) / 0.18 : Math.min(1, p / 0.08);
      const active = points.filter(([, y]) => Math.abs(y - front) < 14);
      const dots = points.length
        ? active
        : Array.from({ length: innerWidth < 1024 ? 36 : 72 }, (_, i): Point => [
            bounds.x +
              ((i + 0.5) * bounds.width) / (innerWidth < 1024 ? 36 : 72),
            front + Math.sin(i * 7) * 4,
          ]);
      ctx!.fillStyle = ink;
      for (const [x, y] of dots) ctx!.fillRect(x - 1, y - 1, 3, 3);
      ctx!.fillStyle = "#ffed00";
      ctx!.strokeStyle = ink;
      ctx!.lineWidth = 2;
      for (let i = 0; i < dots.length; i++) {
        const [x, y] = dots[i];
        ctx!.fillRect(x, y, 1.5, 1.5);
        if (i % 19 === 0) {
          ctx!.beginPath();
          ctx!.moveTo(x + 12, y + 30);
          ctx!.lineTo(x, y);
          ctx!.stroke();
          ctx!.strokeStyle = "#ffed00";
          ctx!.lineWidth = 0.8;
          ctx!.stroke();
          ctx!.strokeStyle = ink;
          ctx!.lineWidth = 2;
        }
      }
      if (p < 0.12) {
        ctx!.strokeStyle = "#ffed00";
        ctx!.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
          const x = bounds.x + (bounds.width * i) / 6;
          ctx!.beginPath();
          ctx!.moveTo(x + 30, bounds.y + bounds.height + 35);
          ctx!.lineTo(x, bounds.y + bounds.height);
          ctx!.stroke();
        }
      }
      if (p < 1) raf = requestAnimationFrame(draw);
      else stop("complete");
    }
    raf = requestAnimationFrame(draw);
  }
  const nav = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  if (!navigation && (nav?.type === "back_forward" || location.hash)) {
    stop("history-or-anchor");
    return;
  }
  if (navigation && root.dataset.printVisit === "static") {
    stop("history-or-anchor");
    return;
  }
  if (!intro && !entryOpen) {
    stop("entry-already-visible");
    return;
  }
  prepare();
  if (intro) {
    img?.addEventListener("load", prepare, options);
    document.addEventListener(
      "hypergraph:intro-end",
      ((event: CustomEvent) => {
        if (["complete", "late-start"].includes(event.detail?.reason)) start();
        else stop("intro-cancelled");
      }) as EventListener,
      { ...options, once: true },
    );
  } else if (navigation && !root.dataset.homeEntered) {
    document.addEventListener("hypergraph:home-enter", start, {
      ...options,
      once: true,
    });
  } else if (
    (window as Window & { __hgIntroResult?: unknown }).__hgIntroResult &&
    !navigation
  )
    stop("intro-already-ended");
  else start();
}
