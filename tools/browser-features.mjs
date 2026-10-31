import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:4174/2026/10/28/showcase/");
await page.waitForSelector("[data-diagram=mermaid] pre svg", { timeout: 60000 });
await page.waitForSelector("[data-diagram=chartjs] canvas");
await page.waitForSelector("[data-diagram=score] svg");
await page.waitForSelector(".wl-panel");
assert.equal(await page.locator(".wl-panel").count(), 1);
assert.ok((await page.locator(".footnotes").count()) > 0);
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  "Mobile article overflow",
);
await page.screenshot({
  path: ".local/screenshots/showcase-mobile.png",
  fullPage: true,
});
await page.evaluate(() => window.__hypergraph.swup.navigate("/"));
await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
assert.equal(await page.locator(".wl-panel").count(), 0);
await page.evaluate(() =>
  window.__hypergraph.swup.navigate("/2026/10/28/showcase/"),
);
await page.waitForSelector(".wl-panel");
assert.equal(await page.locator(".wl-panel").count(), 1);
assert.equal(await page.locator("[data-diagram=chartjs] canvas").count(), 1);
for (const route of [
  "friends",
  "equipment",
  "essay",
  "about",
  "room",
  "fcircle",
]) {
  await page.evaluate(
    (route) => window.__hypergraph.swup.navigate("/" + route + "/"),
    route,
  );
  await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
  assert.ok((await page.locator(".collection-card").count()) > 0, route);
}
await fs.writeFile(
  ".local/feature-browser.json",
  JSON.stringify(
    {
      mermaid: true,
      chart: true,
      score: true,
      footnotes: true,
      comments: true,
      collections: 6,
      errors,
    },
    null,
    2,
  ),
);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "Diagrams, footnotes, comment mount/cleanup and six collections passed.",
);
