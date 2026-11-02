export type Point = [number, number];
export type Bounds = { x: number; y: number; width: number; height: number };
/** CSS object position percentages resolve against the unused space, including negative cover space. */
export function positionOffset(value: string, free: number): number {
  const tokens = value.match(/calc\([^)]*\)|[^\s]+/g) || [];
  const number = (v: string) =>
    v.endsWith("%") ? (parseFloat(v) * free) / 100 : parseFloat(v);
  if (tokens.length === 1) {
    const v = tokens[0];
    if (v === "center") return free / 2;
    if (v === "left" || v === "top") return 0;
    if (v === "right" || v === "bottom") return free;
    if (v.startsWith("calc(")) {
      return [...v.matchAll(/([+-]?\s*\d*\.?\d+)(%|px)/g)].reduce(
        (sum, m) => sum + number(m[1].replace(/\s/g, "") + m[2]),
        0,
      );
    }
    return number(v) || 0;
  }
  const offset = number(tokens[1]) || 0;
  return tokens[0] === "right" || tokens[0] === "bottom"
    ? free - offset
    : offset;
}
export function objectGeometry(
  width: number,
  height: number,
  naturalWidth: number,
  naturalHeight: number,
  fit: string,
  position: string,
): Bounds {
  const scale =
    fit === "contain"
      ? Math.min(width / naturalWidth, height / naturalHeight)
      : Math.max(width / naturalWidth, height / naturalHeight);
  const w = naturalWidth * scale,
    h = naturalHeight * scale;
  let tokens = position.match(/calc\([^)]*\)|[^\s]+/g) || ["50%", "50%"];
  let x = "50%",
    y = "50%";
  if (tokens.length >= 3) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      let v = t;
      if (
        /^(left|right|top|bottom)$/.test(t) &&
        tokens[i + 1] &&
        !/^(left|right|top|bottom|center)$/.test(tokens[i + 1])
      )
        v += " " + tokens[++i];
      if (/^(top|bottom)/.test(t)) y = v;
      else x = v;
    }
  } else {
    if (tokens.length === 1)
      tokens = /^(top|bottom)$/.test(tokens[0])
        ? ["center", tokens[0]]
        : [tokens[0], "center"];
    if (/^(top|bottom)$/.test(tokens[0]) || /^(left|right)$/.test(tokens[1]))
      tokens.reverse();
    [x, y] = tokens;
  }
  return {
    x: positionOffset(x, width - w),
    y: positionOffset(y, height - h),
    width: w,
    height: h,
  };
}
export function pointBounds(points: Point[], fallback: Bounds): Bounds {
  if (!points.length) return fallback;
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  const x = Math.min(...xs),
    y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
