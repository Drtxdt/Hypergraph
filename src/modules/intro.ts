/** Bootstrap owns the entrance clock and fail-open path before module delivery. */
export function mount(signal: AbortSignal) {
  signal.addEventListener("abort", () => (window as Window & { __hgIntroFinish?: (reason: string) => void }).__hgIntroFinish?.("abort"), { once: true });
}
