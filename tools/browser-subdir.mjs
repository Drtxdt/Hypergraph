import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:4175/blog/");
await page.waitForFunction(() => window.__hypergraph?.swup);
assert.ok(
  (await page.locator("link[rel=canonical]").getAttribute("href")).endsWith(
    "/blog/",
  ),
);
await page.locator(".feature h2 a").first().click();
await page.waitForSelector(".prose");
assert.ok(new URL(page.url()).pathname.startsWith("/blog/"));
await page.locator("[data-search]").click();
await page.locator("#search-input").fill("配置");
await page.waitForSelector("[data-results] li");
const searchURL = new URL(
  await page.locator("[data-results] a").first().getAttribute("href"),
  page.url(),
);
assert.ok(searchURL.pathname.startsWith("/blog/"));
assert.equal(searchURL.origin, new URL(page.url()).origin);
assert.deepEqual(errors, []);
await browser.close();
console.log("Subdirectory navigation, canonical URL and search links passed.");
