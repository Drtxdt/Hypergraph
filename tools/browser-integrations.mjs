import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("https://www.googletagmanager.com/**", (r) =>
  r.fulfill({ contentType: "text/javascript", body: "" }),
);
await page.route("https://client.crisp.chat/**", (r) =>
  r.fulfill({ contentType: "text/javascript", body: "" }),
);
await page.route("https://testapp-dsn.algolia.net/**", (r) =>
  r.fulfill({
    json: {
      hits: [
        {
          title: "External result",
          path: "2026/10/28/welcome/",
          text: "sample",
        },
      ],
    },
  }),
);
await page.route("**/api/summary", (r) =>
  r.fulfill({ json: { summary: "Mocked summary result" } }),
);
await page.route("**/api/feed", (r) =>
  r.fulfill({
    json: {
      article_data: [
        {
          title: "Mocked friend article",
          link: "https://example.com/article",
          author: "Friend",
        },
      ],
    },
  }),
);
await page.goto("http://127.0.0.1:4177/");
await page.waitForFunction(() => window.__hypergraph?.swup);
assert.equal(
  await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--signal")
      .trim(),
  ),
  "#aabb33",
);
await page.locator("[data-search]").click();
await page.locator("#search-input").fill("External");
await page.getByRole("link", { name: "External result" }).waitFor();
await page.locator("[data-close]").click();
await page.evaluate(() =>
  window.__hypergraph.swup.navigate("/2026/10/28/welcome/"),
);
await page.getByText("Mocked summary result").waitFor();
assert.equal(await page.locator(".copy-code").count(), 0);
await page.evaluate(() => window.__hypergraph.swup.navigate("/fcircle/"));
await page.getByRole("link", { name: "Mocked friend article" }).waitFor();
assert.equal(
  await page.evaluate(
    () => document.querySelectorAll('script[src*="googletagmanager"]').length,
  ),
  1,
);
assert.equal(
  await page.evaluate(
    () => document.querySelectorAll('script[src*="client.crisp.chat"]').length,
  ),
  1,
);
await page.evaluate(() =>
  window.__hypergraph.swup.navigate("/2026/10/24/encrypted-code/"),
);
await page.waitForSelector("[data-cipher]", { state: "attached" });
assert.equal(await page.locator("[data-ai-summary]").count(), 0);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "Mocked external search, AI summary, friend feed, singleton services, custom color and disabled code-copy passed.",
);
