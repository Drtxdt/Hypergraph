import { route } from "./fixture.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
export async function checkIntegrations(browser, site, report) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(site.url + route(site, "components"));
  await page.getByRole("tab", { name: "Second", exact: true }).click();
  assert.ok(
    (
      await page.getByRole("tabpanel").filter({ visible: true }).textContent()
    ).includes("第二个"),
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
  await page.locator('.prose img[alt="图注样例"]').click();
  await page.locator("dialog.lightbox[open]").waitFor();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await page.locator("#search-dialog").waitFor({state:"hidden"});
  assert.equal(await page.locator("dialog.lightbox[open]").count(), 0);
  await page.goto(site.url + route(site, "field-study"));
  await page.locator(".copy-code").first().waitFor();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedCode = text;
        },
      },
      configurable: true,
    }),
  );
  await page.locator(".copy-code").first().click();
  await page.waitForFunction(() =>
    window.copiedCode?.includes("const journal"),
  );
  await page.locator("[data-menu-toggle]").click();
  await page.locator("[data-search]").click({position:{x:32,y:22}});
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    assert.ok(
      await page.evaluate(() =>
        document
          .querySelector("#search-dialog")
          .contains(document.activeElement),
      ),
    );
  }
  await page.keyboard.press("Escape");
  await page.locator("#search-dialog").waitFor({state:"hidden"});
  assert.ok(
    await page.evaluate(() =>
      document.activeElement?.matches("[data-menu-toggle]"),
    ),
  );
  await page.evaluate(
    () => (document.querySelector(".prose").style.fontSize = "200%"),
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  report.accessibility = {
    copyHandler: true,
    keyboardFocusLoop: true,
    focusReturn: true,
    bodyTextEnlargement: "200% at 390px",
  };
  await page.goto(site.url + route(site, "welcome"));
  await page.locator("[data-menu-toggle]").click();
  await page.locator("[data-mode-toggle]").click();
  await page.keyboard.press("Escape");
  await page.locator("#search-dialog").waitFor({state:"hidden"});
  const html = await fs.readFile(
    site.base + "/public/" + route(site, "welcome") + "index.html",
    "utf8",
  );
  await page.route("**/remote-test/", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: html.replace(
        "</main>",
        '<aside data-ai-summary="/api/summary"></aside><section data-remote-feed="/api/feed"></section></main>',
      ),
    }),
  );
  await page.route("**/api/summary", (r) =>
    r.fulfill({ json: { summary: "Verified AI summary" } }),
  );
  await page.route("**/api/feed", (r) =>
    r.fulfill({
      json: {
        items: [
          {
            title: "Verified friend article",
            url: "https://example.com/article",
            author: "Friend",
          },
        ],
      },
    }),
  );
  await page.goto(site.url + "remote-test/");
  await page.getByText("Verified AI summary").waitFor();
  await page.getByRole("link", { name: "Verified friend article" }).waitFor();
  const external = html.replace(
    /(<script id="hg-config" type="application\/json">)([\s\S]*?)(<\/script>)/,
    (_, a, b, c) =>
      a +
      JSON.stringify({
        ...JSON.parse(b),
        external_search: {
          enable: true,
          app_id: "testapp",
          search_key: "public",
          index: "posts",
        },
      }) +
      c,
  );
  await page.route("**/external-test/", (r) =>
    r.fulfill({ contentType: "text/html", body: external }),
  );
  await page.route("https://testapp-dsn.algolia.net/**", (r) =>
    r.fulfill({
      json: {
        hits: [
          {
            title: "Verified external result",
            path: route(site, "welcome"),
            text: "sample",
          },
        ],
        nbHits: 1,
      },
    }),
  );
  await page.goto(site.url + "external-test/");
  await page.locator("[data-menu-toggle]").click();
  await page.locator("[data-search]").click({position:{x:32,y:22}});
  await page.locator("#search-input").fill("External");
  await page.getByRole("link", { name: "Verified external result" }).waitFor();
  await page.keyboard.press("Escape");
  await page.locator("#search-dialog").waitFor({state:"hidden"});
  assert.deepEqual(errors, []);
  report.integrations = {
    tabs: true,
    spoiler: true,
    lightbox: true,
    externalSearch: "mocked response",
    summary: "mocked response",
    friendFeed: "mocked response",
  };
  await page.close();
  for (const [mode, width, reduce, save] of [
    ["cinematic", 1440, false, false],
    ["cinematic", 390, false, false],
    ["cinematic", 390, true, false],
    ["cinematic", 390, false, true],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: reduce ? "reduce" : "no-preference",
    });
    await context.addInitScript(
      ({ save }) => {
        window.motionCalls = [];
        const original = Element.prototype.animate;
        Element.prototype.animate = function (a, b) {
          window.motionCalls.push(typeof b === "number" ? b : b?.duration);
          return original.call(this, a, b);
        };
        if (save)
          Object.defineProperty(navigator, "connection", {
            value: { saveData: true },
          });
      },
      { save },
    );
    const p = await context.newPage();
    await p.goto(site.url);
    await p.waitForFunction(()=>!document.documentElement.classList.contains("intro-active"));
    if (!reduce) await p.waitForFunction(()=>window.motionCalls.length>0);
    const calls = await p.evaluate(() => window.motionCalls);
    if (reduce) assert.equal(calls.length, 0);
    else {
      assert.ok(calls.length > 0);
      assert.ok(Math.max(...calls) <= (save ? 180 : width < 1024 ? 480 : 900));
    }
    await context.close();
  }
  report.motion = {
    desktop: true,
    mobile: true,
    reduced: true,
    saveData: true,
  };
}
