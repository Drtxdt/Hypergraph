import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  boot = require("../lib/image-bootstrap.cjs");
export async function checkImageRecovery(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  try {
    await page.route("http://images.test/**", (r) =>
      r.request().url().includes("bad")
        ? r.fulfill({ status: 404, body: "" })
        : r.fulfill({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
          }),
    );
    for (const fallback of [
      "",
      "http://images.test/fallback.svg",
      "http://images.test/bad-fallback.svg",
    ]) {
      await page.goto("about:blank");
      await page.setContent(
        '<html data-mode="light"><body><section class="site-masthead"><figure class="masthead-media" data-eager="true"></figure></section></body></html>',
      );
      await page.locator("figure").evaluate(
        (el, fallback) =>
          (el.dataset.responsiveImage = JSON.stringify({
            src: "http://images.test/good.svg",
            dark: "http://images.test/bad.svg",
            mobile: "http://images.test/mobile.svg",
            fallback,
          })),
        fallback,
      );
      await page.evaluate("(" + boot.toString() + ")()");
      await page.waitForFunction(
        () => document.querySelector("img").naturalWidth > 0,
      );
      await page.evaluate(
        () => (document.documentElement.dataset.mode = "dark"),
      );
      await page.waitForFunction(
        (f) =>
          f && !f.includes("bad")
            ? document.querySelector("img").src.includes("fallback") &&
              document.querySelector("img").naturalWidth > 0
            : document.querySelector("figure").hidden,
        fallback,
      );
      await page.evaluate(
        () => (document.documentElement.dataset.mode = "light"),
      );
      await page.waitForFunction(
        () =>
          !document.querySelector("figure").hidden &&
          document.querySelector("img").src.includes("good") &&
          document.querySelector("img").naturalWidth > 0,
      );
      assert.equal(
        await page
          .locator(".site-masthead")
          .evaluate((el) => el.classList.contains("media-failed")),
        false,
      );
      await page.evaluate(() => {
        const previous = document.querySelector("img");
        document.documentElement.dataset.mode = "dark";
        queueMicrotask(() => {
          document.documentElement.dataset.mode = "light";
          queueMicrotask(() => previous.dispatchEvent(new Event("error")));
        });
      });
      await page.waitForFunction(
        () =>
          !document.querySelector("figure").hidden &&
          document.querySelector("img").src.includes("good"),
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForFunction(
        () =>
          document.querySelector("img").src.includes("mobile") &&
          document.querySelector("img").naturalWidth > 0,
      );
      await page.setViewportSize({ width: 1440, height: 900 });
    }
  } finally {
    await page.close();
  }
}
