import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { serve, files } from "./verify/fixture.mjs";
const metadata = JSON.parse(
  await fs.readFile(".local/showcase/public/build.json", "utf8"),
);
const root = new URL(metadata.url).pathname;
const server = await serve(".local/showcase", root);
const browser = await chromium.launch({
  channel: process.env.HG_BROWSER === "chromium" ? undefined : "msedge",
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "",
    "archives/",
    "examples/photography/",
    "examples/mark/",
  ]) {
    const response = await page.goto(server.url + route);
    assert.equal(response.status(), 200);
    await page.waitForFunction(
      () =>
        !document.documentElement.classList.contains("intro-active") &&
        !document.querySelector("[data-laser-canvas]"),
    );
    assert.equal(await page.locator(".site-environment").count(), 1);
    assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
    const links = await page
      .locator("a[href]")
      .evaluateAll((es) => es.map((e) => e.getAttribute("href")));
    for (const link of links.filter(
      (x) => x.startsWith(root) && !x.includes("#"),
    )) {
      const result = await page.request.get(new URL(link, server.url).href);
      assert.equal(result.status(), 200, link);
    }
    const search = await page.request.get(
      server.url + route.replace(/archives\/$/, "") + "search.json",
    );
    assert.equal(search.status(), 200);
  }
  for (const file of await files(".local/showcase/public"))
    if (file.endsWith(".html")) {
      const s = await fs.readFile(file, "utf8");
      assert.ok(!/PRIVATE_CANARY_|fixture-password|D:\\hexo/.test(s));
    }
  assert.deepEqual(errors, []);
  console.log("Public showcase paths, search, resources and contents passed");
} finally {
  await browser.close();
  await server.close();
}
