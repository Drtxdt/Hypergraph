import { t } from "./i18n";
import { activatePanel, releasePanel } from "./panels";
type Track = { src: string; title: string };
type Options = {
  src: string;
  title: string;
  playlist: Track[];
  endpoint: string;
  volume: number;
};
export async function mount(
  config: Options,
  root: string,
  signal: AbortSignal,
) {
  const player = document.querySelector<HTMLAudioElement>(".player audio");
  const host = player?.parentElement;
  if (!player || !host) return;
  player.volume = config.volume;
  const toggle = document.querySelector<HTMLButtonElement>(
    "[data-player-toggle]",
  );
  const setOpen = (open: boolean) => {
    host.hidden = !open;
    toggle?.setAttribute("aria-expanded", String(open));
    document.documentElement.style.setProperty(
      "--player-space",
      open && matchMedia("(max-width:1023px)").matches
        ? host.offsetHeight + "px"
        : "0px",
    );
  };
  toggle?.addEventListener(
    "click",
    () => {
      if (host.hidden) {
        activatePanel(host, () => setOpen(false), toggle || undefined);
        setOpen(true);
      } else releasePanel(host);
      if (!host.hidden)
        host.querySelector<HTMLButtonElement>("[data-player-close]")?.focus();
    },
    { signal },
  );
  host.querySelector("[data-player-close]")?.addEventListener(
    "click",
    () => {
      releasePanel(host);
      setOpen(false);
      toggle?.focus();
    },
    { signal },
  );
  host.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle?.focus();
      }
    },
    { signal },
  );
  const resize = new ResizeObserver(() => setOpen(!host.hidden));
  resize.observe(host);
  window.addEventListener("resize", () => setOpen(!host.hidden), { signal });
  signal.addEventListener("abort", () => resize.disconnect(), { once: true });
  setOpen(matchMedia("(max-width:1023px)").matches);
  let tracks = config.playlist.length
    ? config.playlist
    : [{ src: config.src, title: config.title }];
  const resolve = (src: string) =>
    src.startsWith("/") ? root + src.replace(/^\//, "") : src;
  const select = document.createElement("select");
  select.setAttribute("aria-label", t("播放列表 / Playlist"));
  let current = 0;
  const play = (index: number) => {
    current = index;
    select.value = String(index);
    player.src = resolve(tracks[index].src);
    host.querySelector("span")!.textContent = tracks[index].title;
    void player.play().catch(() => {});
  };
  const render = () => {
    select.replaceChildren(
      ...tracks.map((track, index) => new Option(track.title, String(index))),
    );
    if (tracks.length > 1 && !select.isConnected) host.append(select);
  };
  render();
  select.addEventListener("change", () => play(Number(select.value)), {
    signal,
  });
  player.addEventListener(
    "ended",
    () => {
      if (tracks.length > 1) play((current + 1) % tracks.length);
    },
    { signal },
  );
  // A remote playlist is fetched only after explicit visitor interaction.
  if (config.endpoint)
    player.addEventListener(
      "play",
      async () => {
        try {
          const response = await fetch(config.endpoint, {
            signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
          });
          if (!response.ok) throw Error();
          const data = await response.json();
          if (!Array.isArray(data)) throw Error();
          tracks = data.filter(
            (t) =>
              typeof t.title === "string" &&
              typeof t.src === "string" &&
              /^(https?:\/\/|\/)/.test(t.src),
          );
          if (tracks.length) render();
        } catch {}
      },
      { once: true, signal },
    );
  signal.addEventListener("abort", () => select.remove(), { once: true });
}
