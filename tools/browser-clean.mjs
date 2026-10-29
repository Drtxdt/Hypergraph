import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const failures = [];
page.on("requestfailed", (r) => failures.push(r.url()));
page.on("pageerror", (e) => failures.push(e.message));
await page.goto(process.argv[2] || "http://127.0.0.1:4180/");
await page.locator(".feature h2 a").first().click();
await page.waitForSelector(".prose .katex");
assert.ok((await page.locator(".prose h2[id]").count()) > 0);
assert.ok((await page.locator("figure.highlight").count()) > 0);
assert.deepEqual(failures, []);
await browser.close();
console.log(
  "Packed clean install: navigation, rendered Markdown, formulas and code passed.",
);
