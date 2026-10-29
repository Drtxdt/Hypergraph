import { chromium } from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
for (let run = 1; run <= 3; run++)
  for (const route of ["/", "/2025/03/06/2025HNU数据结构CG题库/"]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
    });
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 1600000 / 8,
      uploadThroughput: 750000 / 8,
    });
    await page.addInitScript(() => {
      window.metrics = { lcp: 0, cls: 0, interactionDurations: [] };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.metrics.lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) window.metrics.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (e.interactionId)
            window.metrics.interactionDurations.push(e.duration);
      }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    });
    await page.goto("http://127.0.0.1:4173" + route, {
      waitUntil: "networkidle",
      timeout: 120000,
    });
    await page.locator("[data-menu-toggle]").click();
    await page.locator("[data-mode-toggle]").click();
    await page.locator("[data-search]").click();
    await page.locator("#search-input").fill("GitHub");
    await page.waitForSelector("[data-results] li");
    await page.locator("[data-close]").click();
    await page.waitForTimeout(100);
    const metrics = await page.evaluate(() => ({
      ...window.metrics,
      resources: performance
        .getEntriesByType("resource")
        .map((e) => ({ name: e.name, transfer: e.transferSize })),
    }));
    results.push({
      run,
      route,
      ...metrics,
      maxInteractionMs: Math.max(0, ...metrics.interactionDurations),
    });
    await page.close();
  }
await browser.close();
await fs.writeFile(
  ".local/performance.json",
  JSON.stringify(
    {
      conditions: {
        cpuSlowdown: 4,
        latencyMs: 150,
        downloadMbps: 1.6,
        viewport: "390x844",
        browser: "Edge",
        runsPerPage: 3,
        interaction: "Lab Event Timing; not field INP",
      },
      results,
    },
    null,
    2,
  ),
);
for (const result of results) {
  console.log({
    run: result.run,
    route: result.route,
    lcp: result.lcp,
    cls: result.cls,
    maxInteractionMs: result.maxInteractionMs,
  });
  assert.ok(result.lcp <= 2500, `LCP exceeded: ${result.route}`);
  assert.ok(result.cls <= 0.1, `CLS exceeded: ${result.route}`);
  assert.ok(
    result.maxInteractionMs <= 200,
    `Interaction exceeded: ${result.route}`,
  );
  assert.ok(
    !result.resources.some((r) =>
      /comments-|mermaid|chart|abcjs|encryption-/.test(r.name),
    ),
    `Unused resource ${result.route}`,
  );
}
