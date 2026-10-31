import { route } from "./fixture.mjs";
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
    article = route(sites.main, "field-study"),
    long = route(sites.main, "long");
  const navigate = async (route) => {
    await page.evaluate(
      (url) => window.__hypergraph.swup.navigate(url),
      new URL(route, main).href,
    );
    await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
    await page.waitForTimeout(100);
  };
  report.visual = [];
  for (const width of [360, 390, 768, 1024, 1440])
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
        await page.waitForFunction(
          () => !document.documentElement.classList.contains("intro-active"),
        );
        await page.waitForTimeout(350);
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
            selector: ".lead .lead-heading",
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
      chart ? route(sites.main, "showcase") : i % 2 ? article : "archives/",
    );
    if (chart) {
      await page.locator("[data-diagram=chartjs] canvas").waitFor();
      await page.locator("[data-diagram=mermaid] pre svg").waitFor();
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
  await page.locator("[data-search]").click({ position: { x: 32, y: 22 } });
  await page.locator("#search-input").fill("Hypergraph");
  await page.locator("[data-results] li").first().waitFor();
  await page.keyboard.press("Escape");
  await page.locator("#search-dialog").waitFor({ state: "hidden" });
  assert.equal(await page.locator("#search-dialog").isVisible(), false);
  assert.equal(await page.locator("[data-rail-expand]").count(), 0);
  await page.mouse.move(600, 500);
  await page.mouse.move(30, 100);
  await page.waitForFunction(() =>
    document.querySelector(".site-header").classList.contains("rail-open"),
  );
  await page.keyboard.press("Escape");
  await page.locator("#search-dialog").waitFor({ state: "hidden" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-menu-toggle]").click();
  assert.ok(await page.locator("#content").evaluate((el) => el.inert));
  await page.locator("[data-search]").click({ position: { x: 32, y: 22 } });
  assert.equal(
    await page.locator("#content").evaluate((el) => el.inert),
    false,
  );
  await page.keyboard.press("Escape");
  await page.locator("#search-dialog").waitFor({ state: "hidden" });
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
  await page.goto(main + route(sites.main, "showcase"));
  await page.locator("[data-diagram=mermaid] pre svg").waitFor({ timeout: 60000 });
  await page.locator("[data-diagram=chartjs] canvas").waitFor();
  await page.locator("[data-diagram=score] svg").first().waitFor();
  assert.equal(await page.locator("[data-diagram=chartjs] canvas").count(), 1);
  await navigate("");
  assert.equal(await page.locator("[data-diagram]").count(), 0);
  for (const type of ["plain", "code", "math"]) {
    await page.goto(main + route(sites.main, "private-" + type));
    await page.locator("[data-unlock] input").fill("wrong");
    await page.locator("[data-unlock] button[type=submit]").click();
    await page.waitForFunction(() =>
      document
        .querySelector("[data-unlock] [role=status]")
        ?.textContent.includes("密码错误"),
    );
    await page.locator("[data-unlock] input").fill("fixture-password-7329");
    await page.locator("[data-unlock] button[type=submit]").click();
    await page.waitForFunction(() =>
      document
        .querySelector("[data-plaintext]")
        ?.textContent.includes("PRIVATE_CANARY"),
    );
    assert.equal(await page.locator("[data-comments]").count(), 0);
    if (type === "math")
      assert.ok((await page.locator("[data-plaintext] .katex").count()) > 0);
    await navigate("");
    await navigate(route(sites.main, "private-" + type));
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
    assert.equal(await page.locator("#content h1").count(), 1);
    assert.ok((await page.locator(".collection-card,.about-profile,.friend-card,.photo-grid figure,.album-card").count()) > 0);
  }
  await page.goto(sites.options.url);
  assert.equal(await page.locator(".sidebar-widget").count(), 3);
  assert.ok(
    await page.evaluate(
      () =>
        document
          .querySelector("#latest")
          .compareDocumentPosition(
            document.querySelector(".site-masthead"),
          ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  );
  await page.goto(main + "categories/" + encodeURIComponent("设计观察") + "/");
  assert.match(
    await page.locator(".section-heading > span").textContent(),
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
  await page.locator("[data-search]").click({ position: { x: 32, y: 22 } });
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
export async function performance(
  browser,
  sites,
  report,
  visits = ["first", "subsequent"],
) {
  report.performance = [];
  const failures=[];
  const gate=(condition,message)=>{if(!condition)failures.push(message);};
  for (const visit of visits)
    for (let run = 0; run < 3; run++)
      for (const [name, url, site] of [
        ["home", sites.main.url, sites.main],
        ["photograph", sites.content.url, sites.content],
        ["no-cover", sites.noCover.url, sites.noCover],
        ["atmosphere-light", sites.atmosphere.url, sites.atmosphere],
        ["atmosphere-dark", sites.atmosphere.url, sites.atmosphere],
        ["long", sites.main.url + route(sites.main, "long"), sites.main],
        ["standalone", sites.main.url + "standalone/", sites.main],
      ]) {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          colorScheme: name === "atmosphere-dark" ? "dark" : "light",
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
        if (visit === "subsequent") {
          assert.equal((await page.goto(url)).status(), 200);
          await page.waitForFunction(
            () => !document.documentElement.classList.contains("intro-active"),
          );
          resources.clear();
        }
        await page.addInitScript(() => {
          window.metrics = {
            lcp: null,
            cls: 0,
            shifts: [],
            events: [],
            eventDetails: [],
            eventCounts: 0,
            readable: null,
          };
          document.addEventListener(
            "keydown",
            (event) => {
              if (
                event.key === "Escape" &&
                document.querySelector("#search-dialog[open]")
              )
                window.metrics.restoreStart = performance.now();
            },
            true,
          );
          document.addEventListener(
            "close",
            (event) => {
              if (
                event.target.id === "search-dialog" &&
                window.metrics.restoreStart !== undefined
              )
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => {
                    window.metrics.restoreMs =
                      performance.now() - window.metrics.restoreStart;
                  }),
                );
            },
            true,
          );
          const readable = () => {
            if (window.metrics.readable !== null) return;
            // Selector lists use document order: a hidden mobile identity h1
            // must not replace the actual featured title in this measurement.
            const title = document.querySelector('[data-masthead-title]') ||
              document.querySelector('.article-head') || document.querySelector('#content h1');
            const clearTitle =
              title &&
              Number(getComputedStyle(title).opacity) >= 0.99 &&
              getComputedStyle(title).clipPath === "none";
            if (
              window.metrics.readable === null &&
              document.readyState !== "loading" &&
              document.querySelector("#content") &&
              clearTitle &&
              !document.documentElement.classList.contains("intro-active")
            ) {
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  if (
                    window.metrics.readable === null &&
                    !document.documentElement.classList.contains("intro-active")
                  )
                    window.metrics.readable = performance.now();
                }),
              );
            }
          };
          new MutationObserver(readable).observe(document, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["class", "hidden"],
          });
          document.addEventListener("DOMContentLoaded", readable);
          const pollReadable = () => {
            readable();
            if (window.metrics.readable === null)
              requestAnimationFrame(pollReadable);
          };
          requestAnimationFrame(pollReadable);
          new PerformanceObserver((l) =>
            l.getEntries().forEach((e) => (window.metrics.lcp = e.startTime)),
          ).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((l) =>
            l.getEntries().forEach((e) => {
              if (!e.hadRecentInput) {
                window.metrics.cls += e.value;
                window.metrics.shifts.push({
                  at: e.startTime,
                  value: e.value,
                  sources: e.sources?.map((s) => ({
                    node: s.node?.nodeName,
                    previous: s.previousRect,
                    current: s.currentRect,
                  })),
                });
              }
            }),
          ).observe({ type: "layout-shift", buffered: true });
          new PerformanceObserver((l) =>
            l.getEntries().forEach((e) => {
              if (e.interactionId) {
                window.metrics.events.push(e.duration);
                window.metrics.eventDetails.push({
                  name: e.name,
                  duration: e.duration,
                  processing: e.processingEnd - e.processingStart,
                  target: e.target?.outerHTML?.slice(0, 180),
                });
              }
            }),
          ).observe({ type: "event", buffered: true, durationThreshold: 16 });
        });
        assert.equal((await page.goto(url)).status(), 200);
        await page.waitForFunction(
          () => !document.documentElement.classList.contains("intro-active"),
        );
        try {
          await page.waitForFunction(() => window.metrics.readable !== null);
        } catch (error) {
          const prefix=path.resolve('.local/verification', `performance-failure-${name}-${visit}-${run+1}`);
          await page.screenshot({path:prefix+'.png'});
          await fs.writeFile(prefix+'.json', JSON.stringify(await page.evaluate(()=>({metrics:window.metrics,intro:window.__hgIntroResult,headings:[...document.querySelectorAll('.lead-title,.article-head,#content h1')].map(el=>({text:el.textContent,opacity:getComputedStyle(el).opacity,clip:getComputedStyle(el).clipPath,rect:el.getBoundingClientRect().toJSON()}))})),null,2));
          throw error;
        }
        const readable = await page.evaluate(() => window.metrics.readable);
        const intro = await page.evaluate(() => window.__hgIntroResult || null);
        report.performance.push({name, visit, run: run + 1, phase: "readability", readable, evidence: await page.evaluate(() => ({ metrics:window.metrics, intro:window.__hgIntroResult }))});
        await fs.writeFile(path.resolve('.local/verification/performance-partial.json'), JSON.stringify(report.performance, null, 2));
        gate(readable <= 2500, `${name} first readable ${readable}`);
        // Capture stability before any interaction can exclude a late layout shift.
        await page.waitForTimeout(
          Math.max(0, 5000 - (await page.evaluate(() => performance.now()))),
        );
        const stability = await page.evaluate(() => ({
          lcp: window.metrics.lcp,
          cls: window.metrics.cls,
          shifts: window.metrics.shifts,
          cover: (() => {
            const img=document.querySelector('.masthead-media img');
            if(!img)return null;
            const resource=performance.getEntriesByName(img.currentSrc).at(-1);
            return {url:img.currentSrc,complete:img.complete,naturalWidth:img.naturalWidth,responseEnd:resource?.responseEnd,transferSize:resource?.transferSize,encodedBodySize:resource?.encodedBodySize};
          })(),
        }));
        await page.reload();
        await page.waitForFunction(
          () =>
            window.metrics.readable !== null &&
            !document.documentElement.classList.contains("intro-active"),
        );
        await page.locator("[data-menu-toggle]").click();
        await page.locator("[data-mode-toggle]").click();
        await page
          .locator("[data-search]")
          .click({ position: { x: 32, y: 22 } });
        await page.locator("#search-input").fill("Hypergraph");
        await page.locator("[data-results] li").first().waitFor();
        await page.keyboard.press("Escape");
        await page.locator("#search-dialog").waitFor({ state: "hidden" });
        await page.waitForFunction(() =>
          Number.isFinite(window.metrics.restoreMs),
        );
        const restoreMs = await page.evaluate(() => window.metrics.restoreMs);
        report.performance.at(-1).interactionEvidence = await page.evaluate(() => window.metrics);
        await fs.writeFile(path.resolve('.local/verification/performance-partial.json'), JSON.stringify(report.performance, null, 2));
        gate(restoreMs <= 500, `${name} modal restoration ${restoreMs}`);
        await page.waitForTimeout(120);
        const metrics = await page.evaluate(() => ({
          ...window.metrics,
          eventCounts: performance.eventCounts?.get("click") || 0,
        }));
        gate(
          Number.isFinite(metrics.lcp) && metrics.lcp > 0,
          "Missing LCP",
        );
        gate(metrics.eventCounts >= 3, "Missing interaction observations");
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
            else if (/\.(svg|png|jpg|webp)$/.test(relative))
              image += body.length;
          } catch {}
        }
        const inlineSource = await page.evaluate(() => [...document.scripts].filter(s => !s.src && (!s.type || s.type === 'text/javascript' || s.type === 'module')).map(s => s.textContent).join('\n'));
        const inlineJsGzip = gzipSync(inlineSource).length;
        js += inlineJsGzip;
        report.performance.pop();
        report.performance.push({
          name,
          visit,
          run: run + 1,
          ...metrics,
          ...stability,
          interactionBound,
          intro,
          restoreMs,
          readable,
          jsGzip: js,
          inlineJsGzip,
          cssGzip: css,
          fontBytes: font,
          imageBytes: image,
        });
        await fs.writeFile(path.resolve('.local/verification/performance-partial.json'), JSON.stringify(report.performance, null, 2));
        gate(
          stability.lcp > 0 && stability.lcp <= 2500,
          `${name} LCP ${stability.lcp}`,
        );
        gate(stability.cls <= 0.1, `${name} CLS ${stability.cls}`);
        gate(
          interactionBound <= 200,
          `${name} interaction ${interactionBound}`,
        );
        gate(js <= 61440, `${name} JS ${js}`);
        gate(css <= 40960, `${name} CSS ${css}`);
        await context.close();
      }
  report.performanceFailures=failures;
  if(failures.length)throw Error(failures.join('\n'));
}
