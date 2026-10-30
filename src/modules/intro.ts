/** Entrance progress is animation progress, not network download progress. */
export async function mount(signal: AbortSignal) {
  const host = document.querySelector<HTMLElement>("[data-intro]");
  if (!host || !document.documentElement.classList.contains("intro-active"))
    return;
  const progress = host.querySelector<HTMLElement>("[data-intro-progress]")!;
  const value = host.querySelector<HTMLElement>("[data-intro-value]")!;
  const finish = (window as Window & { __hgIntroFinish?: () => void })
    .__hgIntroFinish;
  const started =
    (window as Window & { __hgIntroStarted?: number }).__hgIntroStarted ??
    performance.now();
  let frame = 0;
  let revealing = false;
  const stop = () => {
    cancelAnimationFrame(frame);
    finish?.();
  };
  signal.addEventListener("abort", stop, { once: true });
  const visibility = () => {
    if (document.hidden) stop();
  };
  document.addEventListener("visibilitychange", visibility);
  const cleanup = () => {
    cancelAnimationFrame(frame);
    signal.removeEventListener("abort", stop);
    document.removeEventListener("visibilitychange", visibility);
  };
  document.addEventListener("hypergraph:intro-end", cleanup, { once: true });
  const tick = (now: number) => {
    if (signal.aborted || host.hidden) return;
    const elapsed = now - started;
    const percent =
      elapsed < 480
        ? (elapsed / 480) * 60
        : elapsed < 1480
          ? 60
          : Math.min(100, 60 + ((elapsed - 1480) / 480) * 40);
    progress.style.setProperty("--progress", String(percent / 100));
    value.textContent = String(Math.floor(percent));
    if (elapsed >= 1960 && !revealing) {
      revealing = true;
      host.classList.add("is-leaving");
      document.dispatchEvent(new Event("hypergraph:intro-reveal"));
    }
    if (revealing) {
      // One clock drives coverage and dismissal, including late module startup.
      const sweep = Math.min(1, Math.max(0, (elapsed - 1960) / 240));
      host.style.setProperty("--intro-sweep", String(1 - Math.pow(1 - sweep, 3)));
      host.style.opacity = String(1 - Math.min(1, Math.max(0, (elapsed - 2200) / 240)));
    }
    if (elapsed >= 2440) {
      stop();
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}
