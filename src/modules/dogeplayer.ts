export function mount(root: HTMLElement, signal: AbortSignal) {
  for (const host of root.querySelectorAll<HTMLElement>("[data-doge-user]")) {
    host.querySelector("button")?.addEventListener(
      "click",
      () => {
        const frame = document.createElement("iframe");
        frame.className = "video-embed";
        frame.title = "DogeCloud video";
        frame.srcdoc = `<!doctype html><html><meta charset="utf-8"><div id="video"></div><script src="https://player.dogecloud.com/js/loader"></script><script>new DogePlayer({container:document.getElementById('video'),userId:${Number(host.dataset.dogeUser)},vcode:${JSON.stringify(host.dataset.dogeCode)},autoPlay:false})</script></html>`;
        host.replaceChildren(frame);
        signal.addEventListener("abort", () => frame.remove(), { once: true });
      },
      { once: true, signal },
    );
  }
}
