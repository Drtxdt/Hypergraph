import { checkImageRecovery } from "./verify-image-recovery.mjs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
export async function checkBeta7(browser, sites, out, report) {
  await checkImageRecovery(browser);
  const dir = path.join(out, "beta7");
  await fs.mkdir(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    recordVideo: { dir: path.join(dir, "videos") },
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(sites.laser.url);
    await page.waitForFunction(() =>
      document.querySelector("[data-laser-canvas]"),
    );
    const canvas = await page.locator("[data-laser-canvas]").evaluate((el) => ({
      w: el.width,
      h: el.height,
      points: Number(el.dataset.targetPoints),
      rect: el.getBoundingClientRect().toJSON(),
    }));
    assert.ok(canvas.w * canvas.h <= 1500000);
    assert.ok(canvas.points <= 900);
    assert.ok(canvas.w <= canvas.rect.width * 2 + 1);
    for (const progress of [0.25, 0.5, 0.75]) {
      await page.waitForFunction(
        (p) =>
          Number(
            document.querySelector("[data-laser-canvas]")?.dataset.progress,
          ) >= p,
        progress,
      );
      await page.screenshot({ path: path.join(dir, `mobile-${progress}.png`) });
    }
    await page.waitForFunction(
      () => !document.querySelector("[data-laser-canvas]"),
    );
    await page.screenshot({ path: path.join(dir, "mobile-complete.png") });
    await page.evaluate(() => (document.documentElement.dataset.mode = "dark"));
    assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
    assert.equal(await page.locator(".contour-layer").count(), 1);
    assert.equal((await page.locator("#site-nav a").count()) >= 8, true);
    assert.deepEqual(errors, []);
    const client = await context.newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__printEvents = [];
      new PerformanceObserver((list) =>
        window.__printEvents.push(...list.getEntries().map((e) => e.duration)),
      ).observe({ type: "event", buffered: true, durationThreshold: 16 });
    });
    await page.goto(sites.laser.url);
    await page.waitForFunction(() =>
      document.querySelector("[data-laser-canvas]"),
    );
    await page.locator("[data-menu-toggle]").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-menu-toggle]")
          .getAttribute("aria-expanded") === "true",
    );
    await page.waitForTimeout(150);
    const interaction = await page.evaluate(() => ({
      count: performance.eventCounts.get("click"),
      bound: Math.max(16, ...window.__printEvents),
    }));
    assert.ok(interaction.count > 0);
    assert.ok(
      interaction.bound <= 200,
      `DPR3 interaction ${interaction.bound}`,
    );
    canvas.interaction = interaction;
    canvas.cpu = 4;
    await page.waitForFunction(
      () => !document.querySelector("[data-laser-canvas]"),
    );
    await fs.writeFile(
      path.join(dir, "canvas.json"),
      JSON.stringify(canvas, null, 2),
    );
  } finally {
    await context.close();
  }
  for (const width of [1440, 768, 390]) {
    const custom = await browser.newContext({
      viewport: { width, height: 900 },
      recordVideo: { dir: path.join(dir, "videos") },
    });
    try {
      const page = await custom.newPage();
      await page.goto(sites.customArtwork.url);
      await page.waitForFunction(
        () => document.querySelector(".masthead-artwork img")?.naturalWidth > 0,
      );
      await page.waitForFunction(() => {
        const state = document.querySelector(".masthead-artwork")?.getAttribute("data-laser-state");
        return state && !["waiting", "prepared", "running"].includes(state);
      });
      assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
      assert.equal(
        await page
          .locator(".masthead-artwork")
          .evaluate((el) => getComputedStyle(el).clipPath),
        "none",
      );
      assert.ok(
        await page
          .locator(".masthead-artwork img")
          .evaluate(
            (el, width) =>
              el.currentSrc.endsWith(
                width < 1024 ? "print-mark.png" : "print-mark.svg",
              ),
            width,
          ),
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      const media = await page.locator('.masthead-artwork').evaluate(el => {
        const host = el.getBoundingClientRect(), picture = el.querySelector('picture').getBoundingClientRect();
        return {height: host.height, width: host.width, pictureHeight: picture.height, pictureWidth: picture.width, background: getComputedStyle(el.querySelector('picture')).backgroundColor};
      });
      assert.ok(media.height > 0 && media.width > 0);
      assert.ok(Math.abs(media.height - media.pictureHeight) <= 1);
      assert.ok(Math.abs(media.width - media.pictureWidth) <= 1);
      assert.equal(media.background, 'rgba(0, 0, 0, 0)');
      await page.screenshot({ path: path.join(dir, `custom-${width}.png`) });
    } finally {
      await custom.close();
    }
  }
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: path.join(dir, "videos") },
  });
  try {
    const page = await desktop.newPage();
    await page.goto(sites.laser.url);
    await page.waitForFunction(() =>
      document.querySelector("[data-laser-canvas]"),
    );
    const frames = [];
    for (const fraction of [0, 0.25, 0.5, 0.75]) {
      await page.waitForFunction(
        (p) =>
          Number(
            document.querySelector("[data-laser-canvas]")?.dataset.progress ||
              0,
          ) >= p,
        fraction,
      );
      frames.push({
        requested: fraction,
        observed: await page
          .locator("[data-laser-canvas]")
          .getAttribute("data-progress"),
      });
      await page.screenshot({
        path: path.join(dir, `desktop-${fraction}.png`),
      });
    }
    await page.waitForFunction(
      () => !document.querySelector("[data-laser-canvas]"),
    );
    await page.screenshot({ path: path.join(dir, "desktop-complete.png") });
    await fs.writeFile(
      path.join(dir, "frames.json"),
      JSON.stringify(frames, null, 2),
    );
    // History restores the completed object, while a normal home link replays.
    await page.locator(".lead-heading a").click();
    await page.waitForFunction(()=>document.querySelector('[data-page-kind="post"]'));
    await page.waitForFunction(()=>!document.documentElement.dataset.transition);
    await page.goBack();
    await page.waitForFunction(()=>document.querySelector('[data-page-kind="home"]'));
    await page.waitForTimeout(300);
    assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
    await page.locator('.lead-heading a').click();
    await page.waitForFunction(()=>document.querySelector('[data-page-kind="post"]'));
    await page.waitForFunction(()=>!document.documentElement.dataset.transition);
    await page.mouse.move(30, 100);
    await page.waitForFunction(() => document.querySelector('.site-header').classList.contains('rail-open'));
    await page.locator('#site-nav a').first().click();
    await page.waitForFunction(()=>document.querySelector('[data-laser-canvas]'));
    await page.waitForFunction(()=>!document.querySelector('[data-laser-canvas]'));
  } finally {
    await desktop.close();
  }
  const plain = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await plain.newPage();
    await page.goto(sites.laser.url);
    assert.equal(await page.locator(".site-wordmark").count(), 1);
    assert.equal(await page.locator(".contour-layer").count(), 1);
    assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
  } finally {
    await plain.close();
  }
  const switches = await browser.newContext();
  try {
    const page = await switches.newPage();
    let requests = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.goto(sites.decorationOff.url);
    await page.waitForTimeout(500);
    assert.equal(
      await page.locator(".contour-layer,.masthead-artwork").count(),
      0,
    );
    assert.equal(
      requests.some((x) => /laser-print|terrain|flowMobile|artwork-/.test(x)),
      false,
    );
    requests = [];
    await page.goto(sites.noImages.url);
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".masthead-media").count(), 0);
    assert.equal(await page.locator(".site-wordmark").count(), 1);
    assert.equal(
      requests.some((x) => /record\.svg|print-mark\.svg/.test(x)),
      false,
    );
  } finally {
    await switches.close();
  }
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const page = await reduced.newPage();
    const requests = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.goto(sites.noCover.url);
    await page.waitForTimeout(400);
    assert.equal(
      requests.some((x) => x.includes("laser-print")),
      false,
    );
    assert.equal(await page.locator(".site-wordmark").count(), 1);
  } finally {
    await reduced.close();
  }
  report.checks.push(
    "beta7 default contours, DPR3 canvas budget, scan progress, theme stop, reduced-motion static artwork",
  );
}
