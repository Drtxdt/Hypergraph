import { t } from "./i18n";
type Comment = {
  comment: string;
  nick: string;
  url: string;
  objectId: string | number;
};
const text = (value: string) => {
  const area = document.createElement("textarea");
  area.innerHTML = String(value || "").replace(/<[^>]*>/g, " ");
  return area.value.trim();
};
export async function mount(root: HTMLElement, signal: AbortSignal) {
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-comment-count]",
  )) {
    try {
      const endpoint =
        element.dataset.commentCount!.replace(/\/$/, "") +
        "/api/comment?type=count&url=" +
        encodeURIComponent(location.pathname);
      const response = await fetch(endpoint, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      });
      const body = await response.json();
      if (!response.ok || body.errno) throw Error();
      if (!signal.aborted)
        element.textContent = String(
          Array.isArray(body.data) ? body.data[0] : body.data,
        );
    } catch {
      if (!signal.aborted) element.textContent = "—";
    }
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-comment-recent]",
  )) {
    try {
      const response = await fetch(
        element.dataset.commentRecent!.replace(/\/$/, "") +
          "/api/comment?type=recent&count=6",
        { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) },
      );
      const body = await response.json();
      if (!response.ok || body.errno) throw Error();
      if (signal.aborted) continue;
      const items: Comment[] = body.data;
      const list = document.createElement("ul");
      for (const item of items) {
        const li = document.createElement("li"),
          a = document.createElement("a");
        const url = new URL(item.url, location.origin);
        if (url.origin !== location.origin) continue;
        a.href = url.pathname + "#waline";
        a.textContent = item.nick + ": " + text(item.comment).slice(0, 100);
        li.append(a);
        list.append(li);
      }
      element.replaceChildren(list);
      const button = root.querySelector<HTMLButtonElement>("[data-barrage]");
      if (!button) continue;
      const motion = matchMedia("(prefers-reduced-motion:reduce)");
      const saveData = (
        navigator as Navigator & { connection?: { saveData?: boolean } }
      ).connection?.saveData;
      if (motion.matches || saveData) {
        button.disabled = true;
        continue;
      }
      let timer: ReturnType<typeof setInterval> | undefined,
        index = 0;
      const active = new Map<HTMLElement, Animation>();
      const stop = () => {
        clearInterval(timer);
        timer = undefined;
        for (const [node, animation] of active) {
          animation.cancel();
          node.remove();
        }
        active.clear();
        button.setAttribute("aria-pressed", "false");
      };
      button.addEventListener(
        "click",
        () => {
          if (timer) {
            stop();
            return;
          }
          button.setAttribute("aria-pressed", "true");
          timer = setInterval(() => {
            if (document.hidden || motion.matches || !items.length) return;
            const item = items[index++ % items.length],
              node = document.createElement("span");
            node.className = "comment-barrage";
            node.textContent =
              item.nick + ": " + text(item.comment).slice(0, 80);
            node.style.top = 20 + (index % 3) * 12 + "vh";
            document.body.append(node);
            const animation = node.animate(
              [
                { transform: "translateX(100vw)" },
                { transform: "translateX(-100%)" },
              ],
              { duration: 8000 },
            );
            active.set(node, animation);
            const done = () => {
              active.delete(node);
              node.remove();
            };
            animation.finished.then(done, done);
          }, 2500);
        },
        { signal },
      );
      document.addEventListener(
        "visibilitychange",
        () => {
          for (const animation of active.values())
            document.hidden ? animation.pause() : animation.play();
        },
        { signal },
      );
      signal.addEventListener("abort", stop, { once: true });
    } catch {
      if (!signal.aborted)
        element.textContent = t("评论暂时不可用 / Comments unavailable");
    }
  }
}
