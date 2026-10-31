import assert from "node:assert/strict";
export async function checkResponsiveImages(browser, sites, report) {
  const cases = [];
  for (const system of ["light", "dark"])
    for (const manual of ["light", "dark"])
      for (const width of [390, 1440]) {
        const context = await browser.newContext({
          colorScheme: system,
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        await context.addInitScript(
          (mode) => localStorage.setItem("hypergraph-mode", mode),
          manual,
        );
        const page = await context.newPage(),
          requests = [];
        page.on("request", (r) => {
          if (r.url().includes("?variant=")) requests.push(r.url());
        });
        try {
          await page.goto(sites.responsive.url);
          const expected =
            width < 1024
              ? manual === "dark"
                ? "mobile-dark"
                : "mobile"
              : manual === "dark"
                ? "dark"
                : "base";
          await page.waitForFunction(
            () =>
              document.querySelector(".masthead-media img")?.naturalWidth > 0,
          );
          assert.ok(
            (
              await page
                .locator(".masthead-media img")
                .evaluate((e) => e.currentSrc)
            ).endsWith("variant=" + expected),
          );
          assert.ok(
            requests.length === 1 &&
              requests[0].endsWith("variant=" + expected),
            "first request must match effective theme",
          );
          if (width < 1024) await page.locator("[data-menu-toggle]").click();
          else await page.mouse.move(30, 120);
          await page.locator("[data-mode-toggle]").click();
          const opposite =
            width < 1024
              ? manual === "dark"
                ? "mobile"
                : "mobile-dark"
              : manual === "dark"
                ? "base"
                : "dark";
          await page.waitForFunction(
            (value) =>
              document
                .querySelector(".masthead-media img")
                .currentSrc.endsWith("variant=" + value),
            opposite,
          );
          await page.keyboard.press("Escape");
          await page.waitForFunction(() => !!window.__hypergraph?.swup);
          await page.locator(".masthead-action").click();
          await page.waitForURL("**/archives/");
          await page.goBack();
          await page.waitForFunction(
            (value) =>
              document
                .querySelector(".masthead-media img")
                ?.currentSrc.endsWith("variant=" + value),
            opposite,
          );
          await page.goto(sites.responsive.url + "about/");
          assert.equal(await page.locator(".page-banner picture").count(), 0);
          await page.goto(sites.responsive.url + "gallery/");
          assert.equal(await page.locator(".page-banner picture").count(), 1);
          await page.goto(sites.responsive.url + "tools/json/");
          assert.equal(await page.locator(".page-banner").count(), 0);
          cases.push({ system, manual, width, expected, passed: true });
        } finally {
          await context.close();
        }
      }
  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: "dark",
    viewport: { width: 390, height: 844 },
  });
  try {
    const p = await noJs.newPage();
    await p.goto(sites.responsive.url);
    assert.ok(
      (
        await p.locator(".masthead-media img").evaluate((e) => e.currentSrc)
      ).endsWith("variant=mobile-dark"),
    );
  } finally {
    await noJs.close();
  }
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const p = await context.newPage();
  try {
    await p.route("**/*variant*", (r) => r.abort());
    await p.goto(sites.responsive.url);
    await p.waitForFunction(
      () => document.querySelector(".masthead-media").hidden,
    );
    assert.ok(await p.locator("[data-masthead-title]").isVisible());
  } finally {
    await context.close();
  }
  const fallbackContext = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const page = await fallbackContext.newPage();
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(sites.main.url);
    for (const success of [true, false]) {
      const fallback = success
        ? "/images/record.svg?fallback=success"
        : "/missing-fallback.svg";
      await page.evaluate((fallback) => {
        const host = document.createElement("figure");
        host.className = "responsive-media masthead-media";
        host.dataset.eager = "true";
        host.dataset.responsiveImage = JSON.stringify({
          src: "/missing-primary.svg",
          fallback,
        });
        document.querySelector(".masthead-media").replaceWith(host);
        host.closest(".site-masthead").classList.remove("media-failed");
        window.__hgImages();
      }, fallback);
      if (success)
        await page.waitForFunction(
          () => document.querySelector(".masthead-media img").naturalWidth > 0,
        );
      else
        await page.waitForFunction(
          () => document.querySelector(".masthead-media").hidden,
        );
      assert.equal(
        requests.filter(
          (url) => new URL(url).pathname + new URL(url).search === fallback,
        ).length,
        1,
        "fallback is attempted exactly once",
      );
    }
  } finally {
    await fallbackContext.close();
  }
  report.responsiveImages = {
    cases,
    noJavaScript: true,
    failedImageTextFallback: true,
    singleFallbackAttempt: true,
    enhancedNavigationAndHistory: true,
  };
}
