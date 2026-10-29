type Extension = {
  id: string;
  scope: "page" | "global";
  config: Record<string, unknown>;
};
const globals = new Set<string>();
const pending = new Map<string, Promise<void>>();
export async function mount(
  extensions: Extension[],
  rootURL: string,
  root: HTMLElement,
  pageSignal: AbortSignal,
  globalSignal: AbortSignal,
) {
  for (const extension of extensions) {
    if (
      extension.scope === "global" &&
      (globals.has(extension.id) || pending.has(extension.id))
    )
      continue;
    const signal = extension.scope === "global" ? globalSignal : pageSignal;
    const task = (async () => {
      try {
        const module = await import(
          /* @vite-ignore */ rootURL + `assets/extensions/${extension.id}.js`
        );
        if (signal.aborted) return;
        const cleanup = await module.mount({
          root: extension.scope === "global" ? document.body : root,
          config: extension.config,
          signal,
        });
        if (typeof cleanup !== "function")
          throw Error("mount must return a cleanup function");
        if (signal.aborted) cleanup();
        else signal.addEventListener("abort", cleanup, { once: true });
        if (extension.scope === "global") globals.add(extension.id);
      } catch (error) {
        console.warn(`Hypergraph extension ${extension.id} failed`, error);
      }
    })();
    if (extension.scope === "global") pending.set(extension.id, task);
    await task;
    pending.delete(extension.id);
  }
}
