/** The inline bootstrap owns the fail-open deadline, even if this module fails. */
export async function mount(signal: AbortSignal) {
  const host = document.querySelector<HTMLElement>('[data-intro]');
  if (!host || !document.documentElement.classList.contains('intro-active')) return;
  const progress = host.querySelector<HTMLElement>('[data-intro-progress]')!;
  const value = host.querySelector<HTMLElement>('[data-intro-value]')!;
  const started = performance.now();
  let finished = false;
  let settled = 0;
  let timer = 0;
  const end = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    document.documentElement.classList.remove('intro-active');
    host.hidden = true;
    performance.mark('hypergraph:readable');
    document.dispatchEvent(new Event('hypergraph:intro-end'));
  };
  host.querySelector('button')?.addEventListener('click', end, { signal });
  signal.addEventListener('abort', end, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) end(); }, { signal });
  const tasks: Promise<unknown>[] = [Promise.resolve(), document.fonts.load('800 1em Archivo')];
  const image = document.querySelector<HTMLImageElement>('.lead-media img');
  if (image) tasks.push(image.decode());
  timer = window.setTimeout(end, 1900);
  await Promise.all(tasks.map(task => task.catch(() => undefined).then(() => {
    if (finished) return;
    const percent = Math.round(++settled / tasks.length * 100);
    progress.style.setProperty('--progress', String(percent / 100));
    value.textContent = String(percent);
  })));
  if (finished) return;
  await new Promise(resolve => setTimeout(resolve, Math.max(0, 480 - (performance.now() - started)) + 60));
  if (finished) return;
  host.classList.add('is-leaving');
  await new Promise(resolve => setTimeout(resolve, 360));
  end();
}
