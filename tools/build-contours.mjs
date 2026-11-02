import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
// Original deterministic height field; marching squares with an asymptotic decider.
const field = (x, y) =>
  1.8 * Math.exp(-((x - 0.67) ** 2 / 0.045 + (y - 0.48) ** 2 / 0.14)) +
  0.95 * Math.exp(-((x - 0.21) ** 2 / 0.025 + (y - 0.76) ** 2 / 0.04)) -
  0.7 * Math.exp(-((x - 0.49) ** 2 / 0.018 + (y - 0.23) ** 2 / 0.025)) +
  0.16 * Math.sin(17 * x + 3 * y) * Math.cos(13 * y - 2 * x);
// Join shared grid-edge endpoints before smoothing: closed peaks remain closed.
function stitch(segments) {
  const key = (p) => p.map((v) => v.toFixed(5)).join(",");
  const adjacent = new Map();
  segments.forEach((segment, index) =>
    segment.forEach((p) => {
      const k = key(p);
      if (!adjacent.has(k)) adjacent.set(k, []);
      adjacent.get(k).push(index);
    }),
  );
  const used = new Set(),
    paths = [];
  const trace = (index, start) => {
    let points = [start];
    let current = start;
    while (index !== undefined && !used.has(index)) {
      used.add(index);
      const segment = segments[index];
      current = key(segment[0]) === key(current) ? segment[1] : segment[0];
      points.push(current);
      index = adjacent.get(key(current)).find((i) => !used.has(i));
    }
    const closed = key(points[0]) === key(points.at(-1));
    const simplify = (p) => {
      if (p.length < 3) return p;
      const a = p[0],
        b = p.at(-1),
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        den = dx * dx + dy * dy;
      let max = 0,
        at = 0;
      for (let i = 1; i < p.length - 1; i++) {
        const t = den
          ? Math.max(
              0,
              Math.min(
                1,
                ((p[i][0] - a[0]) * dx + (p[i][1] - a[1]) * dy) / den,
              ),
            )
          : 0;
        const d = Math.hypot(p[i][0] - a[0] - t * dx, p[i][1] - a[1] - t * dy);
        if (d > max) {
          max = d;
          at = i;
        }
      }
      return max > 2.4
        ? [
            ...simplify(p.slice(0, at + 1)).slice(0, -1),
            ...simplify(p.slice(at)),
          ]
        : [a, b];
    };
    points = simplify(points);
    // Quadratic midpoint interpolation removes cell-sized corners without overshoot.
    const f = (p) => p.map((v) => v.toFixed(1)).join(",");
    if (points.length < 3) return;
    let d = "M" + f(points[0]);
    for (let i = 1; i < points.length - 1; i++) {
      const a = points[i],
        b = points[i + 1];
      d += "Q" + f(a) + " " + f([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    }
    d += "L" + f(points.at(-1)) + (closed ? "Z" : "");
    paths.push(d);
  };
  for (const ids of adjacent.values())
    if (ids.length === 1 && !used.has(ids[0])) {
      const index = ids[0],
        segment = segments[index];
      trace(
        index,
        segment.find((p) => adjacent.get(key(p)).length === 1),
      );
    }
  segments.forEach((segment, index) => {
    if (!used.has(index)) trace(index, segment[0]);
  });
  return paths.join("");
}
const terrain = [];
const W = 1200,
  H = 600,
  nx = 120,
  ny = 60;
for (let level = -0.5, index = 0; level < 2; level += 0.12, index++) {
  const segments = [];
  for (let y = 0; y < ny; y++)
    for (let x = 0; x < nx; x++) {
      const p = [
          [x, y],
          [x + 1, y],
          [x + 1, y + 1],
          [x, y + 1],
        ],
        v = p.map(([a, b]) => field(a / nx, b / ny) - level),
        edges = [];
      for (let e = 0; e < 4; e++) {
        const j = (e + 1) % 4;
        if (v[e] > 0 !== v[j] > 0) {
          const t = v[e] / (v[e] - v[j]);
          edges.push([
            e,
            [
              ((p[e][0] + t * (p[j][0] - p[e][0])) * W) / nx,
              ((p[e][1] + t * (p[j][1] - p[e][1])) * H) / ny,
            ],
          ]);
        }
      }
      const add = (a, b) => segments.push([edges[a][1], edges[b][1]]);
      if (edges.length === 2) add(0, 1);
      if (edges.length === 4) {
        if (v[0] * v[2] - v[1] * v[3] > 0) {
          add(0, 1);
          add(2, 3);
        } else {
          add(0, 3);
          add(1, 2);
        }
      }
    }
  terrain.push(
    `<path d="${stitch(segments)}" stroke-width="${index % 5 === 0 ? 1.8 : 0.8}"/>`,
  );
}
const flow = Array.from(
  { length: 30 },
  (_, i) =>
    `<path d="M-20 ${i * 22 - 70}C230 ${i * 18 - 120} 400 ${i * 13 + 360} 690 ${i * 18 + 140}S1020 ${i * 24 - 80} 1220 ${i * 22 + 60}" stroke-width="${i % 5 === 0 ? 1.7 : 0.8}"/>`,
);
const svg = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" fill="none" stroke="#72777a">${paths.join("")}</svg>`;
const manifest = {};
let total = 0;
await fs.mkdir("source/assets", { recursive: true });
const crops = {};
for (const [style, paths] of Object.entries({ terrain, flow })) {
  const crop = (view) =>
    svg(paths).replace('viewBox="0 0 1200 600"', `viewBox="${view}"`);
  crops[style] = crop("430 60 680 460");
  crops[style + "Lower"] = crop("30 230 650 370");
  crops[style + "Mobile"] = crop("520 90 430 420");
  crops[style + "Band"] = crop("300 270 720 110");
}
for (const [key, body] of Object.entries(crops)) {
  const name = `${key}-${createHash("sha256").update(body).digest("hex").slice(0, 12)}.svg`;
  await fs.writeFile("source/assets/" + name, body);
  await fs.writeFile(
    "source/assets/" + name + ".gz",
    gzipSync(body, { level: 9 }),
  );
  manifest[key] = name;
  total += gzipSync(body).length;
}
if (total > 30720) throw Error(`Contour budget exceeded: ${total}`);
await fs.writeFile(
  "source/assets/contours.json",
  JSON.stringify({ ...manifest, gzip: total }),
);
console.log(`Original contour assets: ${total} gzip bytes`);
