export function slide(board: number[], direction: number) {
  const next = board.slice();
  let score = 0;
  for (let line = 0; line < 4; line++) {
    const indices = Array.from({ length: 4 }, (_, i) =>
      direction === 0
        ? line * 4 + i
        : direction === 1
          ? i * 4 + line
          : direction === 2
            ? line * 4 + 3 - i
            : (3 - i) * 4 + line,
    );
    const cells = indices.map((i) => board[i]).filter(Boolean),
      merged: number[] = [];
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === cells[i + 1]) {
        const value = cells[i] * 2;
        merged.push(value);
        score += value;
        i++;
      } else merged.push(cells[i]);
    }
    indices.forEach((index, i) => (next[index] = merged[i] || 0));
  }
  return { board: next, score, changed: next.some((v, i) => v !== board[i]) };
}
export function spawnTile(board: number[], random = Math.random) {
  const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (!empty.length) return;
  board[empty[Math.floor(random() * empty.length)]] = random() < 0.9 ? 2 : 4;
}
export function neighbors(index: number) {
  const result: number[] = [];
  for (let y = -1; y <= 1; y++)
    for (let x = -1; x <= 1; x++) {
      const row = Math.floor(index / 9) + y,
        col = (index % 9) + x;
      if ((x || y) && row >= 0 && row < 9 && col >= 0 && col < 9)
        result.push(row * 9 + col);
    }
  return result;
}
export function seedMines(first: number, random = Math.random) {
  const safe = new Set([first, ...neighbors(first)]),
    candidates = Array.from({ length: 81 }, (_, i) => i).filter(
      (i) => !safe.has(i),
    );
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, 10);
}
export function reveal(
  index: number,
  mines: number[],
  opened: number[],
  flags: number[],
) {
  if (flags.includes(index) || opened.includes(index)) return opened.slice();
  const next = new Set(opened),
    pending = [index];
  while (pending.length) {
    const n = pending.pop()!;
    if (next.has(n) || flags.includes(n)) continue;
    next.add(n);
    if (!mines.includes(n) && !neighbors(n).some((i) => mines.includes(i)))
      pending.push(...neighbors(n));
  }
  return [...next];
}
