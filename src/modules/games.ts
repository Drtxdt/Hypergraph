import { portalMessages } from "./portal-language";
import { slide, spawnTile, neighbors, seedMines, reveal } from "./game-rules";
type State = {
  board: number[];
  score: number;
  mines: number[];
  opened: number[];
  flags: number[];
  elapsed: number;
  lost: boolean;
  continued: boolean;
};
export function mount(root: HTMLElement, signal: AbortSignal) {
  const host = root.querySelector<HTMLElement>("[data-game-app]");
  if (!host) return;
  const kind = host.dataset.gameApp!,
    msg = portalMessages(),
    key = "hypergraph:game:v1:" + location.pathname;
  const board = host.querySelector<HTMLElement>(".game-board")!,
    status = host.querySelector<HTMLElement>("[role=status]")!,
    resume = host.querySelector<HTMLButtonElement>("[data-resume]")!;
  const fresh = (): State => ({
    board: Array(16).fill(0),
    score: 0,
    mines: [],
    opened: [],
    flags: [],
    elapsed: 0,
    lost: false,
    continued: false,
  });
  let state = fresh(),
    paused = false,
    flagMode = false,
    last = performance.now(),
    cursor = 0;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "null");
    if (
      saved &&
      Array.isArray(saved.board) &&
      saved.board.length === 16 &&
      Array.isArray(saved.mines) &&
      Array.isArray(saved.opened) &&
      Array.isArray(saved.flags)
    ) {
      state = saved;
      paused = true;
    }
  } catch {}
  if (kind === "2048" && !state.board.some(Boolean)) {
    spawnTile(state.board);
    spawnTile(state.board);
  }
  const won = () =>
    kind === "2048"
      ? state.board.some((v) => v >= 2048) && !state.continued
      : state.opened.length === 71 && !state.lost;
  const save = () => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {}
  };
  const render = () => {
    const focused = (document.activeElement as HTMLElement)?.dataset.index;
    board.replaceChildren();
    resume.hidden = !paused && !(kind === "2048" && won());
    status.textContent =
      (state.lost
        ? msg.lost
        : won()
          ? msg.won
          : paused
            ? msg.paused
            : msg.playing) +
      " · " +
      (kind === "2048"
        ? msg.score + state.score
        : msg.time +
          Math.floor(state.elapsed / 1000) +
          "s · ⚑ " +
          state.flags.length +
          "/10");
    if (kind === "2048")
      state.board.forEach((value) => {
        const cell = document.createElement("div");
        cell.className = "game-cell";
        cell.dataset.value = String(value);
        cell.textContent = value ? String(value) : "";
        board.append(cell);
      });
    else
      for (let i = 0; i < 81; i++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "mine-cell";
        cell.dataset.index = String(i);
        cell.dataset.open = String(state.opened.includes(i));
        cell.dataset.flag = String(state.flags.includes(i));
        cell.tabIndex = i === cursor ? 0 : -1;
        const count = neighbors(i).filter((n) =>
          state.mines.includes(n),
        ).length;
        cell.textContent = state.flags.includes(i)
          ? "⚑"
          : state.opened.includes(i)
            ? state.mines.includes(i)
              ? "✹"
              : count
                ? String(count)
                : ""
            : state.lost && state.mines.includes(i)
              ? "✹"
              : "";
        cell.setAttribute(
          "aria-label",
          `${Math.floor(i / 9) + 1}, ${(i % 9) + 1}: ${state.flags.includes(i) ? msg.flag : state.opened.includes(i) ? (state.mines.includes(i) ? msg.mine : msg.opened + count) : msg.unopened}`,
        );
        board.append(cell);
      }
    if (focused !== undefined)
      board
        .querySelector<HTMLElement>(`[data-index="${focused}"]`)
        ?.focus({ preventScroll: true });
    save();
  };
  const move = (direction: number) => {
    if (paused || state.lost || won()) return;
    const next = slide(state.board, direction);
    if (next.changed) {
      state.board = next.board;
      state.score += next.score;
      spawnTile(state.board);
    }
    state.lost = [0, 1, 2, 3].every((d) => !slide(state.board, d).changed);
    render();
  };
  const open = (index: number, flag = false) => {
    if (paused || state.lost || won()) return;
    cursor = index;
    if (flag) {
      if (!state.opened.includes(index))
        state.flags = state.flags.includes(index)
          ? state.flags.filter((i) => i !== index)
          : [...state.flags, index];
    } else if (!state.flags.includes(index)) {
      if (!state.mines.length) state.mines = seedMines(index);
      state.opened = reveal(index, state.mines, state.opened, state.flags);
      state.lost = state.mines.includes(index);
    }
    render();
  };
  host.querySelector("[data-new-game]")!.addEventListener(
    "click",
    () => {
      state = fresh();
      paused = false;
      last = performance.now();
      if (kind === "2048") {
        spawnTile(state.board);
        spawnTile(state.board);
      }
      render();
    },
    { signal },
  );
  resume.addEventListener(
    "click",
    () => {
      if (kind === "2048" && won()) state.continued = true;
      paused = false;
      last = performance.now();
      render();
      board.focus();
    },
    { signal },
  );
  host.querySelector("[data-flag-mode]")?.addEventListener(
    "click",
    (event) => {
      flagMode = !flagMode;
      (event.currentTarget as HTMLElement).setAttribute(
        "aria-pressed",
        String(flagMode),
      );
    },
    { signal },
  );
  host.querySelectorAll<HTMLButtonElement>("[data-direction]").forEach((b) =>
    b.addEventListener("click", () => move(Number(b.dataset.direction)), {
      signal,
    }),
  );
  board.addEventListener(
    "click",
    (e) => {
      const cell = (e.target as Element).closest<HTMLElement>("[data-index]");
      if (cell) open(Number(cell.dataset.index), flagMode);
    },
    { signal },
  );
  board.addEventListener(
    "contextmenu",
    (e) => {
      const cell = (e.target as Element).closest<HTMLElement>("[data-index]");
      if (cell) {
        e.preventDefault();
        open(Number(cell.dataset.index), true);
      }
    },
    { signal },
  );
  document.addEventListener(
    "keydown",
    (e) => {
      const target = e.target as HTMLElement;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || target.isContentEditable || document.querySelector("dialog[open]") || document.documentElement.classList.contains("panel-lock") || document.body.classList.contains("panel-lock") || target.closest("input,textarea,select,[contenteditable=true],.site-header,.player")) return;
      const direction = [
        "ArrowLeft",
        "ArrowUp",
        "ArrowRight",
        "ArrowDown",
      ].indexOf(e.key);
      if (direction >= 0) {
        e.preventDefault();
        if (kind === "2048") move(direction);
        else {
          cursor = Math.max(
            0,
            Math.min(80, cursor + [-1, -9, 1, 9][direction]),
          );
          render();
          board.querySelector<HTMLElement>(`[data-index="${cursor}"]`)?.focus();
        }
      } else if (kind === "minesweeper" && e.key.toLowerCase() === "f") {
        e.preventDefault();
        open(cursor, true);
        board.querySelector<HTMLElement>(`[data-index="${cursor}"]`)?.focus();
      }
    },
    { signal },
  );
  let start: { x: number; y: number } | undefined;
  board.addEventListener(
    "pointerdown",
    (e) => {
      if (kind === "2048") {
        board.focus({ preventScroll: true });
        board.setPointerCapture(e.pointerId);
        start = { x: e.clientX, y: e.clientY };
      }
    },
    { signal },
  );
  board.addEventListener(
    "pointerup",
    (e) => {
      if (!start) return;
      const x = e.clientX - start.x,
        y = e.clientY - start.y;
      start = undefined;
      if (Math.max(Math.abs(x), Math.abs(y)) > 24)
        move(Math.abs(x) > Math.abs(y) ? (x > 0 ? 2 : 0) : y > 0 ? 3 : 1);
    },
    { signal },
  );
  board.addEventListener("pointercancel", () => { start = undefined; }, { signal });
  const timer = setInterval(() => {
    const now = performance.now();
    if (
      !paused &&
      !document.hidden &&
      !state.lost &&
      !won() &&
      state.mines.length
    ) {
      state.elapsed += now - last;
      render();
    }
    last = now;
  }, 1000);
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) paused = true;
      last = performance.now();
      render();
    },
    { signal },
  );
  signal.addEventListener(
    "abort",
    () => {
      clearInterval(timer);
      save();
    },
    { once: true },
  );
  render();
  host
    .querySelectorAll<HTMLButtonElement>(".game-controls button")
    .forEach((button) => (button.disabled = false));
}
