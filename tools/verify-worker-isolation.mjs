import assert from "node:assert/strict";
import { serve } from "./verify/fixture.mjs";
export async function checkWorkerIsolation(browser, sites, report) {
  const cases = [];
  for (const site of [sites.main, sites.subdir]) {
    const mount = new URL(site.url).pathname;
    const cdn = await serve(site.base, mount, {
      "Access-Control-Allow-Origin": "*",
    });
    const origin = await serve(
      site.base,
      mount,
      { "Content-Security-Policy": "worker-src 'self'" },
      (bytes, file) => {
        if (!file.endsWith(".html")) return bytes;
        return bytes
          .toString()
          .replaceAll(
            'src="' + mount + "assets/",
            'src="' + cdn.url + "assets/",
          )
          .replaceAll(
            'href="' + mount + "assets/",
            'href="' + cdn.url + "assets/",
          );
      },
    );
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.addInitScript(() => { document.addEventListener("hypergraph:mount", () => { window.__testMounted = true; }); });
    const workers = [];
    page.on("worker", (w) => workers.push(w.url()));
    try {
      await page.goto(origin.url + "tools/codec/");
      await page.waitForFunction(() => window.__testMounted);
      await page.mouse.move(900, 500);
      await page.waitForFunction(() => !document.querySelector(".site-header").classList.contains("rail-open"));
      await page.locator("#utility-input").fill("中文 ✨");
      await page.locator("[data-operation=base64_encode]").click();
      await page.waitForFunction(
        () =>
          document.querySelector("#utility-output").value ===
          "5Lit5paHIOKcqA==",
      );
      assert.ok(
        workers.length &&
          workers.every(
            (url) => new URL(url).origin === new URL(origin.url).origin,
          ),
      );
      assert.ok(
        await page
          .locator("script[type=module]")
          .evaluate((e) => new URL(e.src).origin !== location.origin),
      );
      cases.push({ mount, cdn: cdn.url, workers: [...workers], passed: true });
    } finally {
      await context.close();
      await cdn.close();
      await origin.close();
    }
  }
  for (const fault of ["construct", "post", "parse", "message", "timeout"]) {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.addInitScript((fault) => {
      window.Worker = class {
        constructor() {
          if (fault === "construct") throw Error("test constructor");
        }
        postMessage() {
          if (fault === "post") throw Error("test send");
          if (fault === "parse")
            setTimeout(() => this.onmessage?.({ data: null }), 0);
          if (fault === "message") setTimeout(() => this.onmessageerror?.(), 0);
        }
        terminate() {
          window.workerTerminated = true;
        }
      };
    }, fault);
    const page = await context.newPage();
    await page.addInitScript(() => { document.addEventListener("hypergraph:mount", () => { window.__testMounted = true; }); });
    try {
      await page.goto(sites.main.url + "tools/json/");
      await page.waitForFunction(() => window.__testMounted);
      await page.mouse.move(900, 500);
      await page.waitForFunction(() => !document.querySelector(".site-header").classList.contains("rail-open"));
      await page.locator("#utility-input").fill('{"retained":true}');
      await page.locator("[data-operation=format]").click();
      await page.waitForFunction(
        () =>
          document
            .querySelector(".utility-status")
            .textContent.includes("失败"),
        {},
        { timeout: 12000 },
      );
      assert.equal(
        await page.locator("#utility-input").inputValue(),
        '{"retained":true}',
      );
      assert.ok(await page.locator("[data-copy-output]").isDisabled());
      if (fault !== "construct")
        assert.ok(await page.evaluate(() => window.workerTerminated));
      cases.push({ fault, passed: true });
    } finally {
      await context.close();
    }
  }
  report.workerIsolation = cases;
}
