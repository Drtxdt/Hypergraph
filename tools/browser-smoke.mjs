import { chromium } from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
await fs.mkdir(".local/screenshots", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__hypergraph?.swup);
for (const width of [360, 390, 768, 1440])
  for (const mode of ["light", "dark"]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(
      (mode) => (document.documentElement.dataset.mode = mode),
      mode,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow ${width} ${mode}`,
    );
    await page.screenshot({
      path: `.local/screenshots/home-${width}-${mode}.png`,
      fullPage: true,
    });
  }
await page.setViewportSize({ width: 1440, height: 1000 });
const post = await page.locator(".feature h2 a").first().getAttribute("href");
await page.locator(".feature h2 a").first().click();
await page.waitForURL("**" + post);
await page.waitForSelector(".prose");
await page.screenshot({ path: ".local/screenshots/article.png" });
const initial = await page.evaluate(() => window.__hypergraph.pageEpoch);
for (let i = 0; i < 30; i++) {
  const url = i % 2 ? post : "/archives/";
  await page.evaluate((url) => window.__hypergraph.swup.navigate(url), url);
  await page.waitForFunction(
    (old) => window.__hypergraph.pageEpoch > old,
    initial + i * 2,
  );
  await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
}
assert.deepEqual(errors, []);
console.log("Responsive screenshots and 30 navigations passed.");
await browser.close();
