import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:4178/2026/10/29/components/");
await page.waitForSelector("[role=tab]");
await page.getByRole("tab", { name: "Second", exact: true }).click();
assert.ok(
  await page
    .getByRole("tabpanel")
    .filter({ visible: true })
    .innerText()
    .then((t) => t.includes("第二个")),
);
await page.getByRole("tab", { name: "Second", exact: true }).press("Home");
assert.equal(
  await page
    .getByRole("tab", { name: "First", exact: true })
    .getAttribute("aria-selected"),
  "true",
);
await page.locator(".spoiler").press("Enter");
assert.equal(
  await page.locator(".spoiler").getAttribute("aria-expanded"),
  "true",
);
assert.ok(
  (await page.locator(".prose").innerText()).includes("中文 Hexo 文字"),
);
await page.locator("[data-menu-toggle]").click();
await page.locator(".translate-toggle").click();
await page.waitForFunction(() =>
  document.querySelector(".prose").textContent.includes("記錄音樂"),
);
await page.locator(".translate-toggle").click();
await page.waitForFunction(() =>
  document.querySelector(".prose").textContent.includes("记录音乐"),
);
await page.locator("[data-menu-toggle]").click();
assert.equal(await page.locator(".utility-toolbar button").count(), 7);
await page.locator(".privacy-notice button").click();
assert.equal(await page.locator(".privacy-notice").count(), 0);
await page
  .locator("figcaption")
  .filter({ hasText: "图注样例" })
  .scrollIntoViewIfNeeded();
await page.waitForFunction(
  () => document.querySelector('img[alt="图注样例"]').naturalWidth > 0,
);
await page.locator('.prose img[alt="图注样例"]').click();
await page.waitForSelector("dialog.lightbox[open]");
await page.locator("dialog.lightbox").press("ArrowRight");
await page.locator("dialog.lightbox").press("Escape");
assert.ok(
  (await page.locator("figcaption").filter({ hasText: "图注样例" }).count()) >
    0,
);
assert.ok(
  (
    await page.locator('.prose img[alt="失败图片"]').getAttribute("src")
  ).endsWith("hypergraph.svg"),
);
await page.locator(".player select").selectOption("1");
assert.ok(
  (await page.locator(".player span").innerText()).includes("Track two"),
);
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  "390px overflow",
);
await page.screenshot({
  path: ".local/screenshots/components-mobile.png",
  fullPage: true,
});
await page.goto("http://127.0.0.1:4178/gallery/");
await page.locator(".collection-gallery img").first().click();
await page.waitForSelector("dialog.lightbox[open]");
assert.match(await page.locator("dialog.lightbox p").innerText(), /1 \/ 2/);
await page.locator("dialog.lightbox").press("ArrowRight");
assert.match(await page.locator("dialog.lightbox p").innerText(), /2 \/ 2/);
await page.locator("dialog.lightbox").press("Escape");
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
await context.setOffline(true);
await page.goto("http://127.0.0.1:4178/offline-check/");
assert.match(await page.locator("body").innerText(), /You are offline/);
await context.setOffline(false);
await fs.writeFile(
  ".local/completion-browser.json",
  JSON.stringify(
    {
      tabs: true,
      spoiler: true,
      translation: true,
      spacing: true,
      toolbar: true,
      privacy: true,
      gallery: true,
      playlist: true,
      pwaOffline: true,
      errors,
    },
    null,
    2,
  ),
);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "Content controls, translation, gallery, playlist and offline PWA passed.",
);
