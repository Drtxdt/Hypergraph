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
  const controls = document.createElement("div");
  controls.className = "audio-controls";
  const icon = (path: string) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="${path}"/></svg>`;
  const playButton = document.createElement("button");
  const mute = document.createElement("button");
  const seek = document.createElement("input");
  const time = document.createElement("output");
  const volumeLabel = document.createElement("label");
  volumeLabel.className = "audio-volume";
  volumeLabel.textContent = t("音量 / Volume");
  const volume = document.createElement("input");
  volume.type = "range";
  volume.min = "0";
  volume.max = "1";
  volume.step = "0.05";
  volumeLabel.append(volume);
  const status = document.createElement("p");
  status.className = "audio-status";
  status.setAttribute("role", "status");
  seek.type = "range";
  seek.min = "0";
  seek.max = "100";
  seek.step = "0.1";
  seek.value = "0";
  seek.setAttribute("aria-label", t("播放进度 / Playback position"));
  const format = (seconds: number) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}` : "0:00";
  const update = () => {
    playButton.innerHTML = icon(player.paused ? "m8 5 11 7-11 7Z" : "M8 5v14M16 5v14");
    playButton.setAttribute("aria-label", t(player.paused ? "播放 / Play" : "暂停 / Pause"));
    mute.innerHTML = icon(player.muted ? "M11 5 6 9H3v6h3l5 4ZM16 9l5 6M21 9l-5 6" : "M11 5 6 9H3v6h3l5 4ZM16 8q5 4 0 8");
    mute.setAttribute("aria-label", t("静音 / Mute"));
    mute.setAttribute("aria-pressed", String(player.muted));
    volume.value = String(player.volume);
    volume.style.setProperty("--played", `${player.volume * 100}%`);
    const available = Number.isFinite(player.duration) && player.duration > 0;
    seek.disabled = !available;
    seek.value = available ? String(player.currentTime / player.duration * 100) : "0";
    seek.style.setProperty("--played", seek.value + "%");
    seek.setAttribute("aria-valuetext", `${format(player.currentTime)} / ${format(player.duration)}`);
    time.textContent = `${format(player.currentTime)} / ${format(player.duration)}`;
  };
  playButton.addEventListener("click", async () => {
    if (!player.paused) { player.pause(); return; }
    status.textContent = "";
    try { await player.play(); } catch { status.textContent = t("音频暂时无法播放，请重试 / Audio unavailable. Try again"); }
  }, { signal });
  mute.addEventListener("click", () => { player.muted = !player.muted; }, { signal });
  volume.addEventListener("input", () => { player.volume = Number(volume.value); }, { signal });
  seek.addEventListener("input", () => { if (Number.isFinite(player.duration)) player.currentTime = Number(seek.value) / 100 * player.duration; }, { signal });
  for (const event of ["play", "pause", "timeupdate", "durationchange", "volumechange", "emptied"]) player.addEventListener(event, update, { signal });
  player.addEventListener("error", () => { status.textContent = t("音频暂时无法播放，请重试 / Audio unavailable. Try again"); }, { signal });
  controls.append(playButton, seek, mute, time, volumeLabel);
  host.append(controls, status);
  player.hidden = true;
  update();
  signal.addEventListener("abort", () => { controls.remove(); status.remove(); player.hidden = false; }, { once: true });
  const toggle = document.querySelector<HTMLButtonElement>(
    "[data-player-toggle]",
  );
  let panelAnimation: Animation | undefined;
  const setOpen = (open: boolean) => {
    const entering = open && host.hidden;
    host.hidden = !open;
    if (!open) panelAnimation?.cancel();
    if (entering && !matchMedia("(prefers-reduced-motion: reduce)").matches && document.documentElement.dataset.motion !== "off") {
      panelAnimation?.cancel();
      panelAnimation = host.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
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
      } else { releasePanel(host); setOpen(false); }
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
        releasePanel(host);
        setOpen(false);
        toggle?.focus();
      }
    },
    { signal },
  );
  const resize = new ResizeObserver(() => setOpen(!host.hidden));
  resize.observe(host);
  window.addEventListener("resize", () => setOpen(!host.hidden), { signal });
  signal.addEventListener("abort", () => { resize.disconnect(); panelAnimation?.cancel(); }, { once: true });
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
