import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/*", async (route) => {
  if (route.request().resourceType() !== "document") return route.continue();
  const response = await route.fetch();
  const text = await response.text();
  await route.fulfill({
    response,
    body: text.replace('"navigation":true', '"navigation":false'),
  });
});
await page.goto("http://127.0.0.1:4173/");
assert.equal(await page.evaluate(() => !!window.__hypergraph), false);
await page.evaluate(() => (window.normalNavigationMarker = 1));
await page.locator(".feature h2 a").first().click();
await page.waitForSelector(".prose");
assert.equal(
  await page.evaluate(() => window.normalNavigationMarker),
  undefined,
);
assert.ok((await page.locator(".copy-code").count()) > 0);
assert.deepEqual(errors, []);
const nojs = await browser.newContext({ javaScriptEnabled: false });
const plain = await nojs.newPage();
await plain.goto("http://127.0.0.1:4173/2025/03/06/2025HNU数据结构CG题库/");
assert.ok((await plain.locator(".prose").textContent()).length > 90000);
assert.ok((await plain.locator(".toc a").count()) > 0);
await browser.close();
console.log(
  "Normal full-page navigation and JavaScript-free continuous reading passed.",
);
