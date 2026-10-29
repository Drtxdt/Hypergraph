import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
export async function checkBrowser(browser, sites, report, out) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(20000);
  const main = sites.main.url,
    article = "2026/10/29/field-study/",
    long = "2026/10/20/long/";
  const navigate = async (route) => {
    await page.evaluate(
      (url) => window.__hypergraph.swup.navigate(url),
      new URL(route, main).href,
    );
    await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
    await page.waitForTimeout(100);
  };
  report.visual = [];
  for (const width of [360, 390, 768, 1440])
    for (const mode of ["light", "dark"])
      for (const [view, url] of [
        ["home", main],
        ["article", main + article],
        ["archive", main + "archives/"],
        ["no-cover", sites.noCover.url],
        ["empty", sites.empty.url],
        ["few", sites.few.url],
      ]) {
        await page.setViewportSize({
          width,
          height: width === 1440 ? 1000 : 844,
        });
        const response = await page.goto(url);
        assert.equal(response.status(), 200);
        await page.evaluate((mode) => {
          document.documentElement.dataset.mode = mode;
          return document.fonts.ready;
        }, mode);
        await page.waitForTimeout(950);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${view} ${width} overflow`,
        );
        if (view === "home") {
          assert.equal(await page.locator(".lead").count(), 1);
          assert.equal(await page.locator(".entry").count(), 9);
        }
        if (view === "no-cover")
          assert.equal(await page.locator(".lead img").count(), 0);
        if (view === "few")
          assert.equal(await page.locator(".entry").count(), 0);
        if (view === "empty")
          assert.equal(await page.locator(".empty-state").count(), 1);
        if (width === 390 || width === 1440)
          await page.screenshot({
            path: path.join(out, `${view}-${width}-${mode}.png`),
          });
        if (width === 1440 && mode === "light" && view === "home") {
          const client = await context.newCDPSession(page);
          await client.send("DOM.enable");
          await client.send("CSS.enable");
          const { root } = await client.send("DOM.getDocument");
          const { nodeId } = await client.send("DOM.querySelector", {
            nodeId: root.nodeId,
            selector: ".lead h1",
          });
          report.platformFonts = (
            await client.send("CSS.getPlatformFontsForNode", { nodeId })
          ).fonts;
          await client.detach();
        }
        report.visual.push({ width, mode, view, overflow: false });
      }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(main);
  await page.waitForFunction(() => window.__hypergraph?.swup);
  await page.evaluate(() => {
    window.savedAudio = document.querySelector(".player audio");
    window.savedAudio.loop = true;
    return window.savedAudio.play();
  });
  await page.waitForFunction(() => window.savedAudio.currentTime > 0);
  for (let i = 0; i < 30; i++) {
    const chart = i % 6 === 0;
    await navigate(
      chart ? "2026/10/28/showcase/" : i % 2 ? article : "archives/",
    );
    if (chart) {
      await page.locator("[data-diagram=chartjs] canvas").waitFor();
      await page.locator("[data-diagram=mermaid] svg").waitFor();
      assert.equal(
        await page.locator("[data-diagram=chartjs] canvas").count(),
        1,
      );
    } else
      assert.equal(
        await page.locator("[data-diagram=chartjs] canvas").count(),
        0,
      );
    assert.ok(
      await page.evaluate(
        () =>
          window.savedAudio === document.querySelector(".player audio") &&
          !window.savedAudio.paused,
      ),
    );
  }
  await page.goBack();
  await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
  await page.goForward();
  await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
  const text = await page.locator("#content").textContent();
  await page.route("**/failure-test/", (r) => r.abort());
  await page.evaluate(
    (url) => window.__hypergraph.swup.navigate(url),
    main + "failure-test/",
  );
  await page.locator("#navigation-error:not([hidden])").waitFor();
  assert.equal(await page.locator("#content").textContent(), text);
  assert.ok(await page.evaluate(() => !window.savedAudio.paused));
  await page.unroute("**/failure-test/");
  await page.route("**/failure-test/", async (r) =>
    r.fulfill({
      contentType: "text/html",
      body: await fs.readFile(
        path.join(sites.main.base, "public/index.html"),
        "utf8",
      ),
    }),
  );
  await page.locator("#navigation-error button").click();
  await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
  await page.locator(".lead").waitFor();
  await page.locator("[data-search]").click();
  await page.locator("#search-input").fill("Hypergraph");
  await page.locator("[data-results] li").first().waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#search-dialog").isVisible(), false);
  await page.locator("[data-rail-expand]").click();
  await page.waitForFunction(
    () =>
      Math.round(
        document.querySelector(".site-header").getBoundingClientRect().width,
      ) === 240,
  );
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-menu-toggle]").click();
  assert.ok(await page.locator("#content").evaluate((el) => el.inert));
  await page.locator("[data-search]").click();
  assert.equal(
    await page.locator("#content").evaluate((el) => el.inert),
    false,
  );
  await page.keyboard.press("Escape");
  await page.locator("[data-menu-toggle]").click();
  await page.locator("[data-player-toggle]").click();
  await page.locator("[data-player-close]").click();
  assert.ok(await page.evaluate(() => !window.savedAudio.paused));
  assert.equal(await page.locator(".player").isVisible(), false);
  await navigate(long);
  await page.locator(".copy-code").first().waitFor();
  assert.ok((await page.locator(".prose").textContent()).length > 116000);
  assert.ok(await page.evaluate(() => window.find("deep-code-159")));
  await page.evaluate(() => getSelection()?.removeAllRanges());
  await page.goto(main + long + "#Section-159");
  await page.waitForFunction(
    () =>
      document.getElementById("Section-159")?.getBoundingClientRect().top <
      innerHeight,
  );
  await page.emulateMedia({ media: "print" });
  assert.equal(
    await page
      .locator(".prose figure.highlight")
      .first()
      .evaluate((el) => getComputedStyle(el).contentVisibility),
    "visible",
  );
  await page.emulateMedia({ media: "screen" });
  await page.goto(main + article);
  await page.locator("[data-reading]").click();
  assert.ok(
    await page
      .locator("#content")
      .evaluate((el) => el.classList.contains("reading-mode")),
  );
  await page.locator("[data-reading]").click();
  await page.goto(main + "2026/10/28/showcase/");
  await page.locator("[data-diagram=mermaid] svg").waitFor({ timeout: 60000 });
  await page.locator("[data-diagram=chartjs] canvas").waitFor();
  await page.locator("[data-diagram=score] svg").first().waitFor();
  assert.equal(await page.locator("[data-diagram=chartjs] canvas").count(), 1);
  await navigate("");
  assert.equal(await page.locator("[data-diagram]").count(), 0);
  for (const type of ["plain", "code", "math"]) {
    await page.goto(main + "2026/10/19/private-" + type + "/");
    await page.locator("[data-unlock] input").fill("wrong");
    await page.locator("[data-unlock] button").click();
    await page.waitForFunction(() =>
      document
        .querySelector("[data-unlock] [role=status]")
        ?.textContent.includes("密码错误"),
    );
    await page.locator("[data-unlock] input").fill("fixture-password-7329");
    await page.locator("[data-unlock] button").click();
    await page.waitForFunction(() =>
      document
        .querySelector("[data-plaintext]")
        ?.textContent.includes("PRIVATE_CANARY"),
    );
    assert.equal(await page.locator("[data-comments]").count(), 0);
    if (type === "math")
      assert.ok((await page.locator("[data-plaintext] .katex").count()) > 0);
    await navigate("");
    await navigate("2026/10/19/private-" + type + "/");
    assert.equal(await page.locator("[data-plaintext]").textContent(), "");
  }
  for (const type of [
    "about",
    "friends",
    "gallery",
    "essay",
    "equipment",
    "music",
    "room",
    "fcircle",
  ]) {
    await page.goto(main + type + "/");
    assert.equal(await page.locator(".collection").count(), 1);
    assert.ok((await page.locator(".collection-card").count()) > 0);
  }
  await page.goto(sites.options.url);
  assert.equal(await page.locator(".sidebar-widget").count(), 3);
  assert.ok(
    await page.evaluate(
      () =>
        document
          .querySelector("#latest")
          .compareDocumentPosition(
            document.querySelector(".home-introduction"),
          ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  );
  await page.goto(main + "categories/" + encodeURIComponent("设计观察") + "/");
  assert.match(
    await page.locator(".article-head .eyebrow").textContent(),
    /1 篇文章/,
  );
  await page.goto(sites.subdir.url);
  await page.waitForFunction(() => window.__hypergraph?.swup);
  assert.ok(
    (await page.locator(".lead-link").getAttribute("href")).startsWith(
      "/blog/",
    ),
  );
  await page.locator(".lead-link").click();
  await page.locator(".prose").waitFor();
  assert.ok(page.url().includes("/blog/2026/"));
  await page.goto(sites.english.url);
  await page.locator("[data-menu-toggle]").click();
  await page.locator("[data-search]").click();
  await page.locator("#search-input").fill("impossible-needle");
  await page.waitForFunction(() =>
    document
      .querySelector("#search-dialog [role=status]")
      ?.textContent.includes("0"),
  );
  assert.match(
    await page.locator("[data-close]").getAttribute("aria-label"),
    /Close/,
  );
  const off = await browser.newContext();
  const offPage = await off.newPage();
  const requests = [];
  offPage.on("request", (r) => requests.push(r.url()));
  await offPage.goto(sites.disabled.url);
  await offPage.waitForTimeout(250);
  assert.equal(
    await offPage.locator(".player,#search-dialog,.home-sidebar").count(),
    0,
  );
  assert.ok(
    !requests.some((url) =>
      /chunk-(music|appearance|search|effects|comments|diagrams|media)/.test(
        url,
      ),
    ),
  );
  assert.equal(await offPage.evaluate(() => window.__hypergraph), undefined);
  await off.close();
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await nojs.newPage();
  await staticPage.goto(main + article);
  assert.ok(
    (await staticPage.locator(".prose").textContent()).includes("从观察开始"),
  );
  assert.ok(await staticPage.locator(".player audio").isVisible());
  assert.ok(await staticPage.locator("#site-nav").isVisible());
  await nojs.close();
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(main);
  assert.equal(
    await reducedPage.evaluate(() => document.getAnimations().length),
    0,
  );
  await reduced.close();
  assert.deepEqual(errors, []);
  report.behavior = {
    navigation: 30,
    audio: true,
    history: true,
    retry: true,
    panels: true,
    reading: true,
    diagrams: true,
    encryption: 3,
    collections: 8,
    configuration: true,
    subdirectory: true,
    noJS: true,
    reducedMotion: true,
    errors,
  };
  await context.close();
}
export async function performance(browser, sites, report) {
  report.performance = [];
  for (let run = 0; run < 3; run++)
    for (const [name, url, site] of [
      ["home", sites.main.url, sites.main],
      ["no-cover", sites.noCover.url, sites.noCover],
      ["long", sites.main.url + "2026/10/20/long/", sites.main],
    ]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const client = await context.newCDPSession(page);
      const resources = new Set();
      page.on("request", (r) => resources.add(r.url()));
      await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await client.send("Network.enable");
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 200000,
        uploadThroughput: 93750,
      });
      await page.addInitScript(() => {
        window.metrics = { lcp: null, cls: 0, events: [], eventCounts: 0 };
        new PerformanceObserver((l) =>
          l.getEntries().forEach((e) => (window.metrics.lcp = e.startTime)),
        ).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) =>
          l.getEntries().forEach((e) => {
            if (!e.hadRecentInput) window.metrics.cls += e.value;
          }),
        ).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((l) =>
          l.getEntries().forEach((e) => {
            if (e.interactionId) window.metrics.events.push(e.duration);
          }),
        ).observe({ type: "event", buffered: true, durationThreshold: 16 });
      });
      assert.equal((await page.goto(url)).status(), 200);
      await page.locator("[data-menu-toggle]").click();
      await page.locator("[data-mode-toggle]").click();
      await page.locator("[data-search]").click();
      await page.locator("#search-input").fill("Hypergraph");
      await page.locator("[data-results] li").first().waitFor();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(120);
      const metrics = await page.evaluate(() => ({
        ...window.metrics,
        eventCounts: performance.eventCounts?.get("click") || 0,
      }));
      assert.ok(Number.isFinite(metrics.lcp) && metrics.lcp > 0, "Missing LCP");
      assert.ok(metrics.eventCounts >= 3, "Missing interaction observations");
      // Event Timing omits events below its minimum threshold. A populated eventCounts with
      // no duration entries proves sampled interactions were below 16ms, not missing data.
      const interactionBound = metrics.events.length
        ? Math.max(...metrics.events)
        : 16;
      let js = 0,
        css = 0,
        font = 0,
        image = 0;
      for (const url of resources) {
        const u = new URL(url);
        if (u.origin !== new URL(site.url).origin) continue;
        const relative = decodeURIComponent(u.pathname)
          .replace(/^\/blog\//, "/")
          .replace(/^\//, "");
        try {
          const body = await fs.readFile(
            path.join(site.base, "public", relative),
          );
          if (relative.endsWith(".js")) js += gzipSync(body).length;
          else if (relative.endsWith(".css")) css += gzipSync(body).length;
          else if (/woff/.test(relative)) font += body.length;
          else if (/\.(svg|png|jpg|webp)$/.test(relative)) image += body.length;
        } catch {}
      }
      report.performance.push({
        name,
        run: run + 1,
        ...metrics,
        interactionBound,
        jsGzip: js,
        cssGzip: css,
        fontBytes: font,
        imageBytes: image,
      });
      assert.ok(metrics.lcp <= 2500, `${name} LCP ${metrics.lcp}`);
      assert.ok(metrics.cls <= 0.1, `${name} CLS ${metrics.cls}`);
      assert.ok(
        interactionBound <= 200,
        `${name} interaction ${interactionBound}`,
      );
      assert.ok(js <= 61440, `${name} JS ${js}`);
      assert.ok(css <= 40960, `${name} CSS ${css}`);
      await context.close();
    }
}
