import builtinPoints from "../generated/artwork-points";
/** A single decorative timeline. Static media remains the source of truth. */
export function mount(
  root: HTMLElement,
  signal: AbortSignal,
  navigation: boolean,
) {
  const target = root.querySelector<HTMLElement>(
    ".masthead-media,.masthead-artwork",
  );
  if (!target || signal.aborted) return;
  const w = window as Window & { __hgIntroResult?: unknown };
  let started = false,
    finished = false,
    raf = 0,
    canvas: HTMLCanvasElement | undefined;
  const stop = () => {
    finished = true;
    cancelAnimationFrame(raf);
    canvas?.remove();
    target.style.removeProperty("clip-path");
    observer.disconnect();
    mutation.disconnect();
  };
  const observer = new IntersectionObserver((entries) => {
    if (started && !entries[0].isIntersecting) stop();
  });
  observer.observe(target);
  const mutation = new MutationObserver(stop);
  mutation.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"],
  });
  const cleanup = () => {
    stop();
    observer.disconnect();
    mutation.disconnect();
  };
  signal.addEventListener("abort", cleanup, { once: true });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) stop();
    },
    { signal },
  );
  target.addEventListener("hypergraph:media-change", stop, { signal });
  const start = () => {
    if (started || finished || signal.aborted || document.hidden) return;
    started = true;
    const img = target.querySelector<HTMLImageElement>("img");
    if (!img?.complete || !img.naturalWidth || target.hidden) {
      stop();
      return;
    }
    const rect = target.getBoundingClientRect();
    if (
      rect.width < 1 ||
      rect.height < 1 ||
      rect.bottom < 0 ||
      rect.top > innerHeight
    ) {
      stop();
      return;
    }
    const mobile = innerWidth < 1024;
    const dpr = Math.min(
      devicePixelRatio,
      2,
      Math.sqrt(1500000 / (rect.width * rect.height)),
    );
    canvas = document.createElement("canvas");
    canvas.dataset.laserCanvas = "";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    target.append(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      stop();
      return;
    }
    ctx.scale(dpr, dpr);
    const points: number[][] = [];
    // Only decorative same-origin artwork is sampled. Main photos never require CORS.
    if (target.classList.contains("builtin-artwork")) {
      const scale = Math.min(rect.width / 1200, rect.height / 600);
      for (const [x, y] of builtinPoints)
        points.push([
          (rect.width - 1200 * scale) / 2 + x * scale,
          (rect.height - 600 * scale) / 2 + y * scale,
        ]);
    } else if (
      target.classList.contains("masthead-artwork") &&
      new URL(img.currentSrc, location.href).origin === location.origin
    ) {
      try {
        const sample = document.createElement("canvas");
        const imageRect=img.getBoundingClientRect();
        sample.width=120;
        sample.height=Math.max(1,Math.min(240,Math.round(120*imageRect.height/imageRect.width)));
        const sc=sample.getContext("2d",{willReadFrequently:true})!;
        const scale=Math.min(sample.width/img.naturalWidth,sample.height/img.naturalHeight);
        const iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;
        sc.drawImage(img,(sample.width-iw)/2,(sample.height-ih)/2,iw,ih);
        const pixels=sc.getImageData(0,0,sample.width,sample.height).data;
        for(let y=0;y<sample.height;y++)for(let x=0;x<sample.width;x++)
          if(pixels[(y*sample.width+x)*4+3]>40)
            points.push([imageRect.left-rect.left+x/sample.width*imageRect.width,imageRect.top-rect.top+y/sample.height*imageRect.height]);
      } catch {
        /* Edge scan preserves cross-origin and malformed artwork. */
      }
    }
    const limit = mobile ? 900 : 1800,
      stride = Math.max(1, Math.ceil(points.length / limit));
    const sampled = points.filter((_, i) => i % stride === 0);
    const begin = performance.now();
    const draw = (now: number) => {
      if (finished || signal.aborted) return;
      const p = Math.min(1, (now - begin) / 840),
        scan = Math.min(1, p / 0.88),
        front = rect.height * (1 - scan);
      target.style.clipPath = `inset(${(1 - scan) * 100}% 0 0)`;
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.globalAlpha = p > 0.88 ? (1 - p) / 0.12 : 1;
      ctx.strokeStyle = "#ffed00";
      ctx.fillStyle = "#ffed00";
      ctx.lineWidth = 1;
      let count = 0;
      for (const [x, y] of sampled) {
        if (Math.abs(y - front) > 18 || count++ >= (mobile ? 300 : 600))
          continue;
        ctx.fillRect(x, y, 2, 2);
        if (count % 5 === 0) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 10 + (count % 17));
          ctx.stroke();
        }
      }
      if (!sampled.length) {
        ctx.beginPath();
        ctx.moveTo(0, front + 1);
        ctx.lineTo(rect.width, front + 1);
        ctx.stroke();
      }
      canvas!.dataset.progress = String(p);
      if (p < 1) raf = requestAnimationFrame(draw);
      else cleanup();
    };
    raf = requestAnimationFrame(draw);
  };
  if (navigation) {
    document.addEventListener("hypergraph:home-enter", start, {
      once: true,
      signal,
    });
    return;
  }
  const nav = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  if (nav?.type === "back_forward" || location.hash) {
    cleanup();
    return;
  }
  if (document.querySelector("[data-intro]:not([hidden])"))
    document.addEventListener("hypergraph:intro-reveal", start, {
      once: true,
      signal,
    });
  else if (!w.__hgIntroResult) start();
  else cleanup();
}
