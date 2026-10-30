import { route } from "./verify/fixture.mjs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
export async function checkBeta2(browser, sites, out, report) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(sites.main.url + route(sites.main, "field-study"));
    await page.locator(".code-toolbar").waitFor();
    assert.ok(
      await page
        .locator(".code-language")
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize) >= 14),
    );
    assert.equal(await page.locator(".code-emblem").textContent(), "TS");
    assert.ok(
      await page
        .locator(".toc-desktop")
        .evaluate((e) => e.getBoundingClientRect().width >= 250),
    );
    const links = page.locator(".toc-desktop .toc a");
    for (const i of [3, 0, 2, 1, 3, 0]) {
      await links.nth(i).click();
      assert.equal(await links.nth(i).getAttribute("aria-current"), "location");
    }
    await page.locator(".code-toolbar").evaluate(e=>e.scrollIntoView({block:"center"}));
    await page.screenshot({ path: out + "/code-toolbar-light.png" });
    await page.evaluate(() => (document.documentElement.dataset.mode = "dark"));
    await page.waitForTimeout(300);
    await page.screenshot({ path: out + "/code-toolbar-dark.png" });
    await page.locator(".copy-code").click();
    assert.match(
      await page.evaluate(() => navigator.clipboard.readText()),
      /const journal/,
    );
    await page.goto(sites.main.url + route(sites.main, "private-plain"));
    const input = page.locator("[data-unlock] input");
    await input.fill("wrong");
    await page.locator("[data-key-visibility]").click();
    assert.equal(await input.getAttribute("type"), "text");
    await page.locator("[data-key-visibility]").click();
    assert.equal(await input.getAttribute("type"), "password");
    await page.locator("[data-unlock] button[type=submit]").click();
    await page.waitForFunction(
      () => document.querySelector("[data-unlock]").dataset.state === "error",
    );
    assert.equal(await input.getAttribute("aria-invalid"), "true");
    await input.fill("fixture-password-7329");
    await page.locator("[data-unlock] button[type=submit]").click();
    await page.locator("[data-unlock]").waitFor({ state: "detached" });
    // A stale failure must not reset the winning visit's URL or content.
    await page.route("**/slow-invalid/", async (route) => {
      await new Promise((r) => setTimeout(r, 350));
      await route
        .fulfill({ contentType: "text/html", body: "<html>invalid</html>" })
        .catch(() => {});
    });
    await page.evaluate((base) => {
      void window.__hypergraph.swup.navigate(base + "slow-invalid/");
      setTimeout(
        () => void window.__hypergraph.swup.navigate(base + "archives/"),
        50,
      );
    }, sites.main.url);
    await page.waitForURL("**/archives/");
    await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
    await page.waitForTimeout(450);
    assert.ok(page.url().endsWith("/archives/"));
    assert.equal(await page.locator("[data-transition-mask]").count(), 0);
    assert.equal(await page.locator("#navigation-error").isVisible(), false);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
  const touch = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    hasTouch: true,
    isMobile: true,
  });
  try {
    const p = await touch.newPage();
    await p.goto(sites.main.url + route(sites.main, "field-study"));
    await p.locator("[data-menu-toggle]").click();
    assert.equal(await p.locator("#content").evaluate((e) => e.inert), true);
    await p.keyboard.press("Escape");
    assert.equal(await p.locator("#content").evaluate((e) => e.inert), false);
  } finally {
    await touch.close();
  }
  report.beta2 = {
    passed: true,
    codeToolbar: true,
    tocRapidClicks: 6,
    keyVisibility: true,
    errorAndUnlock: true,
    staleNavigationFailure: true,
    wideTouchNavigation: true,
  };
}
