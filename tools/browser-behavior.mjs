import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:4173/");
await page.waitForFunction(() => window.__hypergraph?.swup);
await page.evaluate(() => {
  window.testAudio = document.querySelector("audio");
});
assert.equal(await page.locator("audio").count(), 1);
await page.evaluate(() => window.testAudio.play());
await page.waitForFunction(() => window.testAudio.currentTime > 0);
const post = await page.locator(".feature h2 a").first().getAttribute("href");
for (let i = 0; i < 30; i++) {
  await page.evaluate(
    (url) => window.__hypergraph.swup.navigate(url),
    i % 2 ? post : "/archives/",
  );
  await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
  assert.ok(
    await page.evaluate(
      () =>
        window.testAudio === document.querySelector("audio") &&
        !window.testAudio.paused,
    ),
  );
}
await page.goBack();
await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
assert.ok(
  await page.evaluate(
    () => window.testAudio === document.querySelector("audio"),
  ),
);
const before = await page.locator("#content").innerHTML();
await page.route("**/failure-test/", (r) => r.abort());
await page.evaluate(() => window.__hypergraph.swup.navigate("/failure-test/"));
await page.waitForSelector("#navigation-error:not([hidden])");
assert.equal(await page.locator("#content").innerHTML(), before);
assert.ok(
  await page.evaluate(
    () => window.testAudio === document.querySelector("audio"),
  ),
);
await page.locator("[data-search]").click();
await page.locator("#search-input").fill("GitHub");
await page.waitForSelector("[data-results] li");
assert.ok((await page.locator("[data-results] li").count()) > 0);
await page.locator("[data-close]").click();
await page.goto("http://127.0.0.1:4174/2026/10/24/encrypted-code/");
await page.waitForFunction(() => window.__hypergraph?.swup);
await page.locator("[data-unlock] input").fill("incorrect");
await page.locator("[data-unlock] button").click();
await page
  .getByText("密码错误或内容损坏 / Incorrect password or damaged content")
  .waitFor();
await page.locator("[data-unlock] input").fill("fixture-password-7329");
await page.locator("[data-unlock] button").click();
await page.waitForSelector("[data-plaintext] pre");
assert.match(
  await page.locator("[data-plaintext]").innerText(),
  /PRIVATE_CANARY_CODE_7329/,
);
await page.evaluate(() => window.__hypergraph.swup.navigate("/"));
await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
await page.evaluate(() =>
  window.__hypergraph.swup.navigate("/2026/10/24/encrypted-code/"),
);
await page.waitForSelector("[data-unlock]");
assert.equal(await page.locator("[data-plaintext]").innerText(), "");
await fs.writeFile(
  ".local/browser-behavior.json",
  JSON.stringify(
    {
      navigationCount: 30,
      audioIdentity: true,
      backNavigation: true,
      failedNavigationPreservesContent: true,
      search: true,
      wrongPassword: true,
      correctPassword: true,
      relockedOnReturn: true,
      errors,
    },
    null,
    2,
  ),
);
assert.deepEqual(errors, []);
console.log(
  "Music instance, failed navigation, search, encryption unlock and relock passed.",
);
await browser.close();
