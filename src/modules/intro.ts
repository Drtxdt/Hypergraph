/** Entrance progress is animation progress, not network download progress. */
export async function mount(signal: AbortSignal) {
  const host = document.querySelector<HTMLElement>('[data-intro]');
  if (!host || !document.documentElement.classList.contains('intro-active')) return;
  const progress = host.querySelector<HTMLElement>('[data-intro-progress]')!;
  const value = host.querySelector<HTMLElement>('[data-intro-value]')!;
  const finish = (window as Window & { __hgIntroFinish?: () => void }).__hgIntroFinish;
  const started = performance.now();
  let frame = 0;
  const stop = () => { cancelAnimationFrame(frame); finish?.(); };
  signal.addEventListener('abort', stop, { once: true });
  const visibility = () => { if(document.hidden) stop(); };
  document.addEventListener('visibilitychange', visibility);
  const cleanup = () => { cancelAnimationFrame(frame); signal.removeEventListener('abort', stop); document.removeEventListener('visibilitychange', visibility); };
  document.addEventListener('hypergraph:intro-end', cleanup, { once: true });
  const tick = (now: number) => {
    if (signal.aborted || host.hidden) return;
    const elapsed = now - started;
    const percent = elapsed < 480 ? elapsed / 480 * 60 : elapsed < 1480 ? 60 : Math.min(100, 60 + (elapsed - 1480) / 480 * 40);
    progress.style.setProperty('--progress', String(percent / 100));
    value.textContent = String(Math.floor(percent));
    if (elapsed >= 1960) host.classList.add('is-leaving');
    if (elapsed >= 2440) { stop(); return; }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}
