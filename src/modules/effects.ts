type Options = {
  click: string;
  typewriter: boolean;
  background: string;
  typing: boolean;
  words: string[];
  mobile: boolean;
};
export function mount(options: Options, signal: AbortSignal) {
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (
    reduced.matches ||
    connection?.saveData ||
    (!options.mobile && matchMedia("(pointer:coarse)").matches)
  )
    return;
  const feedback = (x: number, y: number) => {
    if (document.hidden || reduced.matches || document.documentElement.dataset.transition || document.documentElement.classList.contains("intro-active")) return;
    const count = options.click === "fireworks" ? 8 : 1;
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "click-feedback";
      span.textContent =
        options.click === "heart"
          ? "♥"
          : options.click === "fireworks"
            ? "·"
            : options.words[Math.floor(Math.random() * options.words.length)] ||
              "✦";
      span.style.left = x + "px";
      span.style.top = y + "px";
      document.body.append(span);
      const angle = (Math.PI * 2 * i) / count;
      const end =
        count === 1
          ? "translateY(-35px)"
          : `translate(${Math.cos(angle) * 45}px,${Math.sin(angle) * 45}px)`;
      const animation = span.animate(
        [
          { transform: "translate(0,0)", opacity: 1 },
          { transform: end, opacity: 0 },
        ],
        { duration: 500 },
      );
      const abort = () => {
        animation.cancel();
        span.remove();
      };
      const done = () => {
        span.remove();
        signal.removeEventListener("abort", abort);
      };
      animation.finished.then(done, done);
      signal.addEventListener("abort", abort, { once: true });
    }
  };
  if (options.click)
    document.addEventListener("click", (e) => feedback(e.clientX, e.clientY), {
      signal,
    });
  if (options.typing)
    document.addEventListener(
      "input",
      (e) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        feedback(rect.right - 12, rect.top + 12);
      },
      { signal },
    );
  if (options.background) {
    const canvas = document.createElement("canvas");
    canvas.className = "effect-background";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0,
      last = 0;
    const points = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 3,
    }));
    const resize = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { signal });
    const draw = (time: number) => {
      if (signal.aborted || document.hidden || reduced.matches) return;
      frame = requestAnimationFrame(draw);
      if (time - last < 60) return;
      last = time;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = getComputedStyle(
        document.documentElement,
      ).getPropertyValue("--muted");
      context.fillStyle = context.strokeStyle;
      context.globalAlpha = 0.18;
      const w = canvas.width,
        h = canvas.height;
      if (options.background === "ribbon") {
        context.beginPath();
        for (let x = 0; x < w; x += 20) {
          const y = h * 0.6 + Math.sin(x / 250 + time / 6000) * 70;
          if (x) context.lineTo(x, y);
          else context.moveTo(x, y);
        }
        context.lineWidth = 24;
        context.stroke();
      } else
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          p.y = (p.y - 0.0002 + 1) % 1;
          context.beginPath();
          context.arc(
            p.x * w,
            p.y * h,
            options.background === "bubbles" ? p.r * 5 : p.r,
            0,
            Math.PI * 2,
          );
          options.background === "bubbles" ? context.stroke() : context.fill();
          if (options.background === "network")
            for (const q of points.slice(i + 1))
              if (Math.hypot((p.x - q.x) * w, (p.y - q.y) * h) < 140) {
                context.beginPath();
                context.moveTo(p.x * w, p.y * h);
                context.lineTo(q.x * w, q.y * h);
                context.lineWidth = 0.5;
                context.stroke();
              }
        }
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reduced.matches)
        frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", resume, { signal });
    reduced.addEventListener("change", resume, { signal });
    resume();
    signal.addEventListener(
      "abort",
      () => {
        cancelAnimationFrame(frame);
        canvas.remove();
      },
      { once: true },
    );
  }
  if (options.typewriter) {
    let titleAnimation: Animation | undefined;
    signal.addEventListener("abort", () => titleAnimation?.cancel(), { once: true });
    const reveal = () => {
      if (document.hidden || reduced.matches || document.documentElement.dataset.transition || document.documentElement.classList.contains("intro-active")) return;
      titleAnimation?.cancel();
      titleAnimation = document
        .querySelector(".home-introduction h1, .lead h1")
        ?.animate(
          [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
          { duration: 600, easing: "steps(12,end)" },
        );
    };
    reveal();
    document.addEventListener("hypergraph:mount", reveal, { signal });
    document.addEventListener("hypergraph:intro-end", reveal, { signal });
  }
}
