import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { generate, serve, route } from "./verify/fixture.mjs";
import { checkAlignment } from "./verify-print-geometry.mjs";
const out = path.resolve(".local/beta8");
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.HG_BROWSER === "chromium" ? undefined : "msedge",
});
const servers = [],
  results = [];
const poll = async (page, fn) => {
  for (let i = 0; i < 200; i++) {
    if (await page.evaluate(fn)) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw Error("Preparation did not settle");
};
try {
  const sites = {};
  for (const [name, options] of Object.entries({
    wordmark: {},
    photo: {
      content: true,
      theme: {
        home: { masthead: { image: { src: "/images/landscape.jpg" } } },
      },
    },
    custom: {
      theme: {
        home: {
          masthead: {
            artwork: {
              image: {
                src: "/images/print-mark.svg",
                position: "0% 0%",
                mobile_position: "100% 100%",
              },
            },
          },
        },
      },
    },
    background: {
      theme: {
        background: { mode: "home", image: { src: "/images/record.svg" } },
      },
    },
  })) {
    const base = path.join(out, name);
    await generate(base, options);
    const server = await serve(base);
    servers.push(server);
    sites[name] = { base, ...server };
  }
  for (const width of [1440, 390])
    for (const colorScheme of ["light", "dark"])
      for (const name of ["wordmark", "photo", "custom"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          colorScheme,
          deviceScaleFactor: width === 390 ? 3 : 1,
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        const time = new Date("2026-11-02T00:00:00Z");
        await page.clock.install({ time });
        await page.clock.pauseAt(time);
        await page.goto(sites[name].url, { waitUntil: "domcontentloaded" });
        await poll(
          page,
          () =>
            document.querySelector(".masthead-media,.masthead-artwork")?.dataset
              .laserState === "prepared",
        );
        assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
        await page.clock.runFor(2400);
        for (const [index, advance] of [0, 400, 400, 400, 400, 32].entries()) {
          await page.clock.runFor(advance);
          if (index === 4) await page.clock.runFor(32);
          if (index < 5)
            await page.screenshot({
              path: path.join(
                out,
                `${name}-${width}-${colorScheme}-${index * 25}.png`,
              ),
            });
        }
        assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
        const state = await page
          .locator(".masthead-media,.masthead-artwork")
          .evaluate((e) => ({ ...e.dataset }));
        assert.equal(state.laserState, "complete");
        assert.ok(Number(state.laserStarted) >= 2400);
        assert.ok(Number(state.laserEnded) - Number(state.laserStarted) >= 1600);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        assert.deepEqual(errors, []);
        results.push({ name, width, colorScheme, state });
        await context.close();
      }
  await checkAlignment(
    browser,
    { ...sites.custom, wordmarkUrl: sites.wordmark.url },
    out,
  );
  // Start on an article/archive so the print chunk is cold on return home.
  {
    const page = await browser.newPage();
    const time = new Date("2026-11-02T00:00:00Z");
    await page.clock.install({time});
    await page.clock.pauseAt(time);
    await page.goto(sites.wordmark.url, {waitUntil:"domcontentloaded"});
    await poll(page, () => document.querySelector('.masthead-artwork')?.dataset.laserState === 'prepared');
    await page.locator('.masthead-artwork').evaluate(el => el.style.transform = 'translateY(200vh)');
    await page.clock.runFor(2400);
    assert.equal(await page.locator('.masthead-artwork').getAttribute('data-laser-state'),'offscreen');
    assert.equal(await page.locator('[data-laser-canvas]').count(),0);
    assert.equal(await page.locator('.site-wordmark').evaluate(el=>el.style.clipPath),'');
    await page.close();
    results.push({name:'offscreen-before-intro-end',passed:true});
  }
  for (const delay of [0, 80, 400]) {
    const navContext = await browser.newContext();
    const navPage = await navContext.newPage();
    navPage.setDefaultTimeout(15000);
    await navPage.route("**/chunk-laser-print-*.js", async route => {
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue();
    });
    await navPage.goto(sites.wordmark.url + "archives/");
    await navPage.waitForFunction(() => window.__hypergraph?.swup);
    await navPage.evaluate(() => {
      window.printFlashes = [];
      window.watchPrint = true;
      const frame = () => {
        const target = document.querySelector(".masthead-artwork");
        const media = target?.querySelector(".site-wordmark");
        if (media && !["complete", "entry-already-visible"].includes(target.dataset.laserState) &&
            (document.querySelector("#content").dataset.printWindow !== "closed" || ["prepared", "running"].includes(target.dataset.laserState)) &&
            getComputedStyle(media).visibility !== "hidden" && getComputedStyle(media).clipPath === "none")
          window.printFlashes.push(target.dataset.laserState || "unprepared");
        if (window.watchPrint) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await navPage.evaluate(url => window.__hypergraph.swup.navigate(url), sites.wordmark.url);
    await navPage.waitForFunction(() => ["complete", "entry-already-visible"].includes(document.querySelector(".masthead-artwork")?.dataset.laserState));
    assert.equal(await navPage.locator(".masthead-artwork").getAttribute("data-laser-state"), delay === 400 ? "entry-already-visible" : "complete");
    assert.deepEqual(await navPage.evaluate(() => {window.watchPrint=false;return window.printFlashes;}), [], `Return-home flash with ${delay}ms module delay`);
    assert.equal(await navPage.locator("[data-print-pending]").count(), 0);
    assert.equal(await navPage.locator("[data-laser-canvas]").count(), 0);
    await navContext.close();
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: path.join(out, "videos") },
  });
  const page = await context.newPage();
  await page.goto(sites.wordmark.url);
  await page.waitForFunction(
    () =>
      document.querySelector(".masthead-artwork")?.dataset.laserState ===
      "complete",
  );
  await page.goto(sites.wordmark.url + route(sites.wordmark, "long"));
  for (const screens of [0, 1, 3, 1000]) {
    await page.evaluate((n) => scrollTo(0, n * innerHeight), screens);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({
      path: path.join(out, `article-screen-${screens}.png`),
    });
    assert.equal(
      await page
        .locator(".site-environment")
        .evaluate((e) => e.getBoundingClientRect().top),
      0,
    );
  }
  await page.evaluate(() => {
    window.shell = document.querySelector(".site-environment");
  });
  const cdp = await context.newCDPSession(page);
  const listenerCount = async () => {
    let total = 0;
    for (const expression of ["document", "window"]) {
      const { result } = await cdp.send("Runtime.evaluate", { expression });
      const { listeners } = await cdp.send("DOMDebugger.getEventListeners", {
        objectId: result.objectId,
      });
      total += listeners.length;
      await cdp.send("Runtime.releaseObject", { objectId: result.objectId });
    }
    return total;
  };
  const initialListeners = await listenerCount();
  for (let i = 0; i < 30; i++) {
    await page.evaluate(
      (url) => window.__hypergraph.swup.navigate(url),
      sites.wordmark.url + (i % 2 ? "archives/" : ""),
    );
    await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
    assert.equal(
      await page.evaluate(
        () =>
          window.shell === document.querySelector(".site-environment") &&
          document.querySelectorAll(".site-environment").length === 1,
      ),
      true,
    );
  }
  assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
  assert.ok(
    (await listenerCount()) <= initialListeners,
    "Navigation must not accumulate global listeners",
  );
  await context.close();
  for (const name of [
    "request-chain",
    "late-before-end",
    "late-after-end",
    "skip",
    "reduced",
    "save-data",
    "no-js",
  ]) {
    const context = await browser.newContext({
      reducedMotion: name === "reduced" ? "reduce" : "no-preference",
      javaScriptEnabled: name !== "no-js",
      recordVideo:
        name === "request-chain" || name.startsWith("late")
          ? { dir: path.join(out, "videos", name) }
          : undefined,
    });
    const page = await context.newPage();
    if (name === "request-chain")
      await page.route("**/*.js", async (route) => {
        await new Promise((r) => setTimeout(r, 900));
        await route.continue();
      });
    if (name.startsWith("late"))
      await page.route("**/chunk-laser-print-*.js", async (r) => {
        await new Promise((resolve) =>
          setTimeout(resolve, name === "late-before-end" ? 400 : 2800),
        );
        await r.continue();
      });
    if (name === "save-data")
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "connection", {
          value: { saveData: true },
        }),
      );
    await page.goto(sites.wordmark.url, { waitUntil: "domcontentloaded" });
    if (name === "skip") await page.locator("[data-intro] button").click();
    await page.waitForTimeout(4000);
    assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
    assert.equal(await page.locator(".site-wordmark").isVisible(), true);
    if (name === "late-before-end" || name === "request-chain")
      assert.equal(
        await page
          .locator(".masthead-artwork")
          .getAttribute("data-laser-state"),
        "complete",
      );
    if (name === "late-after-end")
      assert.notEqual(
        await page
          .locator(".masthead-artwork")
          .getAttribute("data-laser-state"),
        "complete",
      );
    results.push({ name, passed: true });
    await context.close();
  }
  for (const kind of [
    "slow-image",
    "bad-image",
    "cross-origin",
    "deep-anchor",
  ]) {
    const page = await browser.newPage();
    if (kind === "slow-image")
      await page.route("**/images/print-mark.svg", async (route) => {
        await new Promise((r) => setTimeout(r, 2900));
        await route.continue();
      });
    if (kind === "bad-image")
      await page.route("**/images/print-mark.svg", (route) => route.abort());
    if (kind === "cross-origin") {
      await page.route("**/images/print-mark.svg", (route) =>
        route.fulfill({
          status: 302,
          headers: { location: sites.photo.url + "images/landscape.jpg" },
        }),
      );
    }
    await page.goto(
      sites.custom.url + (kind === "deep-anchor" ? "#main" : ""),
      { waitUntil: "domcontentloaded" },
    );
    await page.waitForTimeout(4000);
    assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
    assert.equal(
      await page
        .locator(".masthead-artwork")
        .evaluate((e) => !e.querySelector("picture")?.style.clipPath),
      true,
    );
    if (kind !== "cross-origin")
      assert.notEqual(
        await page
          .locator(".masthead-artwork")
          .getAttribute("data-laser-state"),
        "complete",
      );
    results.push({ name: kind, passed: true });
    await page.close();
  }
  const bg = await browser.newPage();
  const requests = [];
  bg.on("request", (r) => requests.push(r.url()));
  await bg.goto(sites.background.url + "archives/");
  await bg.waitForTimeout(200);
  assert.equal(
    requests.some((u) => u.endsWith("/images/record.svg")),
    false,
  );
  await bg.goto(sites.background.url);
  await bg.waitForFunction(() => document.querySelector(".masthead-artwork")?.getAttribute("data-laser-state") === "complete");
  await bg.screenshot({ path: path.join(out, "background-home.png") });
  await bg.close();
  await fs.writeFile(
    path.join(out, "report.json"),
    JSON.stringify(
      { passed: true, results, scroll: true, navigations: 30 },
      null,
      2,
    ),
  );
  console.log("beta8 visual, lifecycle, scroll and navigation checks passed");
} finally {
  await browser.close();
  for (const s of servers) await s.close();
}
