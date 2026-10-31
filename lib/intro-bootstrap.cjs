// Serialized into the document: readiness must not wait for optional browser modules.
module.exports = function introBootstrap(mode, key) {
  const host = document.querySelector('[data-intro]');
  if (!host) return;
  try {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (location.hash || document.hidden || matchMedia('(prefers-reduced-motion:reduce)').matches || navigator.connection?.saveData || navigation?.type === 'back_forward') return;
    if (mode === 'session') {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    }
  } catch { return; }
  const started = performance.now();
  // Navigation is the normal timeline origin; the emergency deadline also bounds visible blocking.
  const origin = 0;
  window.__hgIntroStarted = started;
  let frame = 0, readyAt, coverReadyAt, done = false, revealing = false, timer;
  const controller = new AbortController();
  const progress = host.querySelector('[data-intro-progress]');
  const value = host.querySelector('[data-intro-value]');
  const finish = (reason = 'skip') => {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    controller.abort();
    host.dataset.endReason = reason;
    host.hidden = true;
    document.documentElement.classList.remove('intro-active');
    document.removeEventListener('visibilitychange', visibility);
    host.querySelector('button').removeEventListener('click', skip);
    window.__hgIntroResult = { reason, started, ended: performance.now(), readyAt, coverReadyAt, lateStart: started > 480 };
    document.dispatchEvent(new CustomEvent('hypergraph:intro-end', { detail: window.__hgIntroResult }));
  };
  const skip = () => finish('skip');
  const visibility = () => { if (document.hidden) finish('hidden'); };
  window.__hgIntroFinish = finish;
  window.__hgIntroReady = async () => {
    readyAt = performance.now();
    const cover = document.querySelector('.masthead-media img');
    if (cover && !cover.complete) await new Promise(resolve => {
      cover.addEventListener('load', resolve, { once:true, signal:controller.signal });
      cover.addEventListener('error', resolve, { once:true, signal:controller.signal });
      controller.signal.addEventListener('abort', resolve, {once:true});
    });
    if (controller.signal.aborted) return;
    if (cover?.naturalWidth) { try { await cover.decode(); } catch {} }
    coverReadyAt = performance.now();
    if (window.__hgIntroResult) window.__hgIntroResult.coverReadyAt = coverReadyAt;
  };
  const tick = now => {
    if (done) return;
    const elapsed = now - origin;
    const phase = elapsed - 480;
    const percent = phase < 0 ? Math.max(0, elapsed / 480 * 60) : phase < 600 ? 60 : Math.min(100, 60 + (phase - 600) / 480 * 40);
    progress.style.setProperty('--progress', String(percent / 100));
    value.textContent = String(Math.floor(percent));
    host.dataset.phase = phase < 0 ? 'waiting' : phase < 600 ? 'hold' : phase < 1080 ? 'progress' : phase < 1320 ? 'sweep' : 'fade';
    if (phase >= 1080 && !revealing) {
      revealing = true;
      host.classList.add('is-leaving');
      document.dispatchEvent(new Event('hypergraph:intro-reveal'));
    }
    if (revealing) {
      const sweep = Math.max(0, Math.min(1, (phase - 1080) / 240));
      host.style.setProperty('--intro-sweep', String(1 - Math.pow(1 - sweep, 3)));
      host.style.opacity = String(1 - Math.max(0, Math.min(1, (phase - 1320) / 600)));
    }
    if (phase >= 1920) { finish(started > 480 ? 'late-start' : 'complete'); return; }
    frame = requestAnimationFrame(tick);
  };
  host.hidden = false;
  document.documentElement.classList.add('intro-active');
  timer = setTimeout(() => finish('resource-timeout'), 3950);
  host.querySelector('button').addEventListener('click', skip);
  document.addEventListener('visibilitychange', visibility);
  frame = requestAnimationFrame(tick);
};
