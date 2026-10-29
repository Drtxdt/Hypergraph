import type Swup from "swup";

/** A visit owns all its animations; cancelling it always reveals readable content. */
export function mount(swup: Swup, mode: "cinematic" | "subtle" | "off", signal: AbortSignal) {
  let controller = new AbortController();
  let mask: HTMLElement | undefined;
  let owner: number | undefined;
  const running = new Set<Animation>();
  const clear = () => {
    controller.abort();
    running.forEach(animation => animation.cancel());
    running.clear();
    mask?.remove();
    mask = undefined;
    delete document.documentElement.dataset.transition;
  };
  const animate = async (element: Element, frames: Keyframe[], duration: number, current: AbortSignal) => {
    if (current.aborted) return;
    const animation = element.animate(frames, { duration, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" });
    running.add(animation);
    const cancel = () => animation.cancel();
    current.addEventListener("abort", cancel, { once: true });
    try { await animation.finished; } catch { /* cancelled visit */ }
    finally { current.removeEventListener("abort", cancel); running.delete(animation); animation.cancel(); }
  };
  swup.hooks.on("visit:start", visit => {
    clear();
    controller = new AbortController();
    owner = visit.id;
    visit.animation.wait = true;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (mode === "off" || saveData || document.hidden || matchMedia("(prefers-reduced-motion:reduce)").matches || visit.history.popstate || visit.to.hash || visit.from.url === visit.to.url) visit.animation.animate = false;
  });
  swup.hooks.replace("animation:out:await", async visit => {
    if (owner !== visit.id || controller.signal.aborted) return;
    const current = controller.signal;
    document.documentElement.dataset.transition = "leaving";
    const content = document.querySelector("#content");
    if (content) await animate(content, [{ opacity: 1 }, { opacity: .82 }], mode === "subtle" ? 80 : 160, current);
    if (current.aborted || mode !== "cinematic") return;
    mask = document.createElement("div");
    mask.setAttribute("aria-hidden", "true");
    mask.dataset.transitionMask = "";
    mask.style.cssText = "position:fixed;inset:0;z-index:39;pointer-events:none;background:var(--paper);border-left:8px solid var(--signal);transform-origin:left";
    document.body.append(mask);
    await animate(mask, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0)" }], 120, current);
  });
  swup.hooks.replace("animation:in:await", async visit => {
    if (owner !== visit.id || controller.signal.aborted) return;
    mask?.remove(); mask = undefined;
    document.documentElement.dataset.transition = "entering";
    const title = document.querySelector(".lead-title, .article-head, .archive-head, #content h1");
    if (title) await animate(title, [{ opacity: .65, clipPath: "inset(0 0 100% 0)" }, { opacity: 1, clipPath: "inset(0)" }], mode === "subtle" ? 120 : 280, controller.signal);
    if (owner === visit.id) clear();
  });
  for (const hook of ["visit:abort", "visit:end", "visit:fail"] as const)
    swup.hooks.on(hook, visit => { if (owner === visit.id) clear(); });
  signal.addEventListener("abort", clear, { once: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) clear(); }, { signal });
}
