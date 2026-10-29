import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:4174/2026/10/28/welcome/");
await page.waitForFunction(
  () => document.querySelector("[data-comment-count]")?.textContent === "0",
);
await page.waitForSelector("[data-comment-recent] li", { state: "attached" });
await page.locator("[data-barrage]").click();
await page.waitForSelector(".comment-barrage", { state: "attached" });
await page.evaluate(() => window.__hypergraph.swup.navigate("/"));
await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
assert.equal(await page.locator(".comment-barrage").count(), 0);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("http://127.0.0.1:4174/2026/10/28/welcome/");
await page.waitForFunction(
  () => document.querySelector("[data-barrage]")?.disabled,
);
assert.equal(await page.locator(".comment-barrage").count(), 0);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "Comment count, recent comments, barrage cleanup and reduced motion passed.",
);
