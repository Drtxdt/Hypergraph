import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const checks = [];
await fs.mkdir(".local/screenshots/final", { recursive: true });
for (const preset of ["industrial", "ledger", "reading"]) {
  const html = await fs.readFile(`.local/visual-${preset}.html`, "utf8");
  await page.route("**/__visual/", (r) =>
    r.fulfill({ contentType: "text/html", body: html }),
  );
  await page.goto("http://127.0.0.1:4178/__visual/");
  for (const width of [360, 390, 768, 1440])
    for (const mode of ["light", "dark"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        (mode) => (document.documentElement.dataset.mode = mode),
        mode,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${preset} ${width} ${mode} overflow`,
      );
      await page.screenshot({
        path: `.local/screenshots/final/${preset}-${width}-${mode}.png`,
        fullPage: true,
      });
      checks.push({ preset, width, mode, overflow: false });
    }
  await page.unroute("**/__visual/");
}
for (const route of ["/2026/10/29/components/", "/2026/10/28/showcase/"]) {
  await page.goto("http://127.0.0.1:4178" + route);
  if (route.includes("showcase"))
    await page.waitForSelector("[data-diagram=mermaid] svg");
  for (const width of [360, 390, 768, 1440])
    for (const mode of ["light", "dark"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        (mode) => (document.documentElement.dataset.mode = mode),
        mode,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} ${width} ${mode} overflow`,
      );
      await page.screenshot({
        path: `.local/screenshots/final/${route.includes("showcase") ? "showcase" : "components"}-${width}-${mode}.png`,
        fullPage: true,
      });
      checks.push({ route, width, mode, overflow: false });
    }
}
await fs.writeFile(
  ".local/visual-report.json",
  JSON.stringify({ checks, errors }, null, 2),
);
assert.deepEqual(errors, []);
await browser.close();
console.log("Forty preset/article viewport and color-mode checks passed.");
