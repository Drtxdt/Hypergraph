import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const route = "/2025/03/06/2025HNU数据结构CG题库/";
await page.goto("http://127.0.0.1:4173" + route);
await page.waitForSelector(".copy-code");
assert.ok((await page.locator(".prose").textContent()).length > 90000);
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
const last = page.locator(".toc a").last();
const href = await last.getAttribute("href");
await page.goto("http://127.0.0.1:4173" + route + href);
await page.waitForSelector(".prose");
assert.ok(
  await page.evaluate(
    (hash) => !!document.getElementById(decodeURIComponent(hash.slice(1))),
    href,
  ),
);
await page.waitForFunction((hash) => {
  const rect = document
    .getElementById(decodeURIComponent(hash.slice(1)))
    .getBoundingClientRect();
  return rect.top >= -5 && rect.top < innerHeight;
}, href);
assert.ok(
  await page.evaluate(() => window.find("题库", false, false, true)),
  "Browser find must see real article text",
);
assert.ok(await page.evaluate(() => {
  const lines = [...document.querySelectorAll(".highlight .code .line")];
  const text = lines.reverse().map(line => line.textContent.trim()).find(text => text.length > 15);
  return !!text && window.find(text, false, false, true);
}), "Browser find must reveal code in an off-screen block");
await page.locator("[data-reading]").click();
await page.waitForSelector("#content.reading-mode");
assert.equal(await page.locator(".toc-panel").isVisible(), false);
await page.emulateMedia({ media: "print" });
assert.equal(await page.locator(".site-header").isVisible(), false);
assert.equal(await page.locator("audio").isVisible(), false);
assert.equal(await page.locator(".prose").isVisible(), true);
await page.emulateMedia({ media: "screen" });
await page.screenshot({ path: ".local/screenshots/long-article-mobile.png" });
await browser.close();
console.log(
  "Long continuous article, deep anchor, reading mode, overflow and print visibility passed.",
);
