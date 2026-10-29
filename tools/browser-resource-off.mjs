import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const requests = [];
page.on("request", (r) => requests.push(r.url()));
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
const forbidden =
  /chunk-(comments|comment-extras|diagrams|mermaid|chart|abc|translate|interaction|services|appearance|effects|encryption|ads-counters|remote-content)|twikoo-frame|legacy-comments|giscus|waline|google|crisp/;
assert.ok(
  requests.every((url) => !forbidden.test(url)),
  requests.filter((url) => forbidden.test(url)).join("\n"),
);
assert.ok(
  requests.every((url) => new URL(url).origin === "http://127.0.0.1:4173"),
  "Default resources must be same-origin",
);
let js = 0,
  css = 0;
for (const url of [...new Set(requests)]) {
  const pathname = new URL(url).pathname;
  if (!/\.(js|css)$/.test(pathname)) continue;
  const data = await fs.readFile(".local/blog/public" + pathname);
  if (pathname.endsWith(".js")) js += gzipSync(data).length;
  else css += gzipSync(data).length;
}
assert.ok(js <= 60 * 1024, `${js} JS bytes`);
assert.ok(css <= 40 * 1024, `${css} CSS bytes`);
await fs.writeFile(
  ".local/resource-network.json",
  JSON.stringify({ jsGzipBytes: js, cssGzipBytes: css, requests }, null, 2),
);
await browser.close();
console.log({ jsGzipBytes: js, cssGzipBytes: css, optionalRequests: 0 });
