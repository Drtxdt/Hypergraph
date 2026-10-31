import { checkResponsiveImages } from "./verify-responsive-images.mjs";
import { checkWorkerIsolation } from "./verify-worker-isolation.mjs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
export async function checkBeta6(browser, sites, out, report) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    for (const width of [360, 390, 768, 1024, 1440, 1920])
      for (const mode of ["light", "dark"]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(sites.main.url);
        await page.evaluate(
          (m) => (document.documentElement.dataset.mode = m),
          mode,
        );
        assert.equal(await page.locator("[data-masthead-title]").count(), 1);
        assert.equal(
          await page.locator(".environment").count(),
          0,
          "no empty background container",
        );
        assert.ok(
          await page
            .locator(".masthead-media img")
            .evaluate((e) => e.complete && e.naturalWidth > 0),
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        const boxes = await page
          .locator(".masthead-copy,.masthead-media")
          .evaluateAll((es) =>
            es.map((e) => e.getBoundingClientRect().toJSON()),
          );
        if (width < 1024) assert.ok(boxes[1].y >= boxes[0].bottom + 20);
        else assert.ok(boxes[1].x >= boxes[0].right + 20);
        await page.evaluate(async () => {
          await Promise.all(
            [...document.images]
              .filter((img) => img.loading !== "lazy")
              .map((img) => img.decode()),
          );
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
        });
        await page.screenshot({
          path: path.join(out, `beta6-home-${width}-${mode}.png`),
        });
      }
    if (sites.atmosphere) for (const width of [390,768,1440]) {
      await page.setViewportSize({width,height:900});await page.goto(sites.atmosphere.url);
      const columns = await page.locator('.masthead-copy,.lead-copy').evaluateAll(elements => elements.map(e=>e.getBoundingClientRect().x));
      assert.ok(Math.abs(columns[0]-columns[1])<1,'frame surfaces preserve the same content axis');
    }
    for (const site of [sites.main, sites.subdir]) {
      await page.goto(site.url + "tools/json/");
      await page.locator("#utility-input").fill('{"测试":"✨"}');
      await page.locator("[data-operation=format]").click();
      await page.waitForFunction(() =>
        document.querySelector("#utility-output").value.includes("✨"),
      );
      assert.ok(await page.locator("[data-copy-output]").isEnabled());
      await page.locator("#utility-input").fill('{"changed":true}');
      assert.equal(await page.locator("#utility-output").inputValue(), "");
      assert.ok(await page.locator("[data-copy-output]").isDisabled());
      const url = await page.evaluate(
        () =>
          JSON.parse(document.querySelector("#hg-config").textContent).workers
            .tools,
      );
      assert.ok(
        new URL(url, page.url()).pathname.startsWith(
          new URL(site.url).pathname + "assets/tool-worker-",
        ),
      );
      await page.route("**/tool-worker-*.js", (r) => r.abort());
      await page.locator("[data-operation=format]").click();
      await page.waitForFunction(() =>
        document
          .querySelector("[role=status].utility-status")
          .textContent.includes("失败"),
      );
      assert.equal(
        await page.locator("#utility-input").inputValue(),
        '{"changed":true}',
      );
      await page.unroute("**/tool-worker-*.js");
      await page.locator("[data-operation=format]").click();
      await page.waitForFunction(() =>
        document.querySelector("#utility-output").value.includes("changed"),
      );
    }
    await checkResponsiveImages(browser, sites, report);
    await checkWorkerIsolation(browser, sites, report);
    report.beta6 = {
      passed: true,
      widths: [360, 390, 768, 1024, 1440, 1920],
      worker: [
        "root",
        "subdirectory",
        "Unicode",
        "stale output",
        "network failure",
        "retry",
      ],
    };
  } catch (e) {
    await page.screenshot({ path: path.join(out, "beta6-failure.png") });
    throw e;
  } finally {
    await context.close();
  }
}
