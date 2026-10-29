import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const requests = [];
page.on("request", (r) => requests.push(r.url()));
await page.goto("http://127.0.0.1:4174/2026/10/28/welcome/");
if (process.argv[2] === "off") {
  assert.ok(!requests.some((r) => r.includes("extensions/reading-note.js")));
  assert.equal(await page.locator("[data-reading-note]").count(), 0);
} else {
  await page
    .getByText("独立扩展已挂载 / Independent extension mounted")
    .waitFor();
  await page.evaluate(() => window.__hypergraph.swup.navigate("/"));
  await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
  assert.equal(await page.locator("[data-reading-note]").count(), 0);
  await page.evaluate(() =>
    window.__hypergraph.swup.navigate("/2026/10/28/welcome/"),
  );
  await page
    .getByText("独立扩展已挂载 / Independent extension mounted")
    .waitFor();
  assert.equal(await page.locator("[data-reading-note]").count(), 1);
}
await browser.close();
console.log(
  "Independent extension " +
    (process.argv[2] === "off"
      ? "disabled without requests"
      : "installed and remounted once") +
    ".",
);
