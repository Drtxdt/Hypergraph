import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { route } from "./verify/fixture.mjs";
export async function checkBeta5(browser, sites, out, report) {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    }),
    page = await context.newPage();
  const requests = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (r) => requests.push(r.url()));
  try {
    for (const width of [360, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(sites.main.url + route(sites.main, "long"));
      await page.locator(".toc-mobile summary").click();
      const panel = await page.locator(".toc-mobile details").boundingBox(),
        list = await page.locator(".toc-mobile .toc").boundingBox();
      assert.ok(list.width >= panel.width - 40);
      const last = page.locator(".toc-mobile .toc a").last();
      await last.scrollIntoViewIfNeeded();
      await last.click();
      await page.waitForFunction(
        () => !document.querySelector(".toc-mobile details").open,
      );
      assert.ok(new URL(page.url()).hash);
    }
    await page.goto(sites.beta5.url);
    assert.equal(await page.locator("#site-nav>a").count(), 8);
    assert.equal(await page.locator(".brand-mark").count(), 0);
    const destinations = await page
      .locator("#site-nav>a")
      .evaluateAll((links) => links.map((a) => a.href));
    for (const url of destinations)
      assert.equal((await page.request.get(url)).status(), 200);
    assert.ok(destinations.some((url) => url.endsWith("/profile/")));
    assert.ok(
      !requests.some((url) => /chunk-(games|utilities)|tool-worker/.test(url)),
      "home does not request utility or game code",
    );
    await page.goto(sites.beta5.url + "gallery/field/");
    await page.waitForFunction(
      () =>
        document.querySelector("#content").dataset.lightboxMounted === "true",
    );
    await page.locator(".photo-grid a").first().click();
    await page.locator(".lightbox[open]").waitFor();
    await page.keyboard.press("Escape");
    await page.goto(sites.beta5.url + "tools/codec/");
    await page.locator("#utility-input").fill("终末地 🌏");
    await page.locator("[data-operation=base64_encode]").click();
    await page.waitForFunction(
      () => document.querySelector("#utility-output").value.length > 0,
    );
    const encoded = await page.locator("#utility-output").inputValue();
    await page.locator("#utility-input").fill(encoded);
    await page.locator("[data-operation=base64_decode]").click();
    await page.waitForFunction(
      () => document.querySelector("#utility-output").value === "终末地 🌏",
    );
    await page.goto(sites.beta5.url + "tools/json/");
    await page.locator("#utility-input").fill("{");
    await page.locator("[data-operation=format]").click();
    await page.waitForFunction(() =>
      document.querySelector(".utility-status").textContent.includes("无效"),
    );
    assert.equal(await page.locator("#utility-input").inputValue(), "{");
    await page.goto(sites.beta5.url + "games/2048/");
    await page.locator(".game-cell").first().waitFor();
    assert.equal(await page.locator(".game-cell").count(), 16);
    await page.locator('[data-direction="2"]').click();
    await page.goto(sites.beta5.url + "games/minesweeper/");
    await page.locator('[data-index="40"]').click();
    assert.equal(await page.locator('[data-index="40"]').textContent(), "");
    await page.locator("[data-flag-mode]").click();
    await page.locator(".mine-cell[data-open=false]").first().click();
    assert.ok((await page.locator(".mine-cell[data-flag=true]").count()) > 0);
    const seedGame = async (kind, patch) => {
      await page.goto(sites.beta5.url + "games/");
      const target = sites.beta5.url + "games/" + kind + "/";
      await page.evaluate(
        ({ patch, target }) =>
          sessionStorage.setItem(
            "hypergraph:game:v1:" + new URL(target).pathname,
            JSON.stringify({
              board: Array(16).fill(0),
              score: 0,
              mines: [],
              opened: [],
              flags: [],
              elapsed: 0,
              lost: false,
              continued: false,
              ...patch,
            }),
          ),
        { patch, target },
      );
      await page.goto(target);
      await page.locator("[data-resume]").click();
    };
    await seedGame("2048", { board: [1024, 1024, ...Array(14).fill(0)] });
    await page.locator('[data-direction="0"]').click();
    assert.match(await page.locator(".game-status").textContent(), /完成/);
    await page.locator("[data-resume]").click();
    assert.match(await page.locator(".game-status").textContent(), /进行中/);
    await seedGame("2048", {
      board: [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2],
    });
    await page.locator('[data-direction="0"]').click();
    assert.match(await page.locator(".game-status").textContent(), /游戏结束/);
    await seedGame("minesweeper", {
      mines: Array.from({ length: 10 }, (_, i) => i),
      opened: Array.from({ length: 70 }, (_, i) => i + 10),
    });
    await page.locator('[data-index="80"]').click();
    assert.match(await page.locator(".game-status").textContent(), /完成/);
    await seedGame("minesweeper", {
      mines: Array.from({ length: 10 }, (_, i) => i),
    });
    await page.locator('[data-index="0"]').click();
    assert.match(await page.locator(".game-status").textContent(), /游戏结束/);
    await page.goto(sites.boundaries.url);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("#latest").count(), 0);
    assert.ok(
      (await page.locator("#content").textContent()).includes(
        "Independent announcement",
      ),
    );
    assert.equal(await page.locator('#site-nav a[href$="/games/"]').count(), 0);
    await page.goto(sites.boundaries.url + "profile/");
    assert.equal(
      await page.locator("h1").textContent(),
      "Handwritten biography",
    );
    await page.goto(sites.contained.url);
    assert.equal(
      await page
        .locator(".lead-media img")
        .evaluate((el) => getComputedStyle(el).objectFit),
      "contain",
    );
    await page.goto(sites.beta5.url);
    await page.waitForFunction(() => !!window.__hypergraph?.swup);
    await page.evaluate(
      () => (window.beta5Audio = document.querySelector(".player audio")),
    );
    const cycle = [
      "tools/json/",
      "games/2048/",
      "tools/codec/",
      "games/minesweeper/",
      "gallery/",
    ];
    for (let i = 0; i < 30; i++) {
      const url = sites.beta5.url + cycle[i % cycle.length];
      await page.evaluate((url) => window.__hypergraph.swup.navigate(url), url);
      await page.waitForFunction(
        (url) => location.href === url && !window.__hypergraph.swup.navigating,
        url,
      );
      assert.ok(
        await page.evaluate(
          () => window.beta5Audio === document.querySelector(".player audio"),
        ),
      );
      assert.ok((await page.locator(".lightbox").count()) <= 1);
    }
    for (const width of [360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      for (const name of [
        "",
        "profile/",
        "friends/",
        "gallery/",
        "tools/",
        "games/",
      ]) {
        await page.goto(sites.beta5.url + name);
        for (const mode of ["light", "dark"]) {
          await page.evaluate(
            (m) => (document.documentElement.dataset.mode = m),
            mode,
          );
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          await page.screenshot({
            path: path.join(
              out,
              `beta5-${name.replaceAll("/", "") || "home"}-${width}-${mode}.png`,
            ),
          });
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 480 });
    await page.goto(sites.beta5.url);
    await page.locator("[data-mode-toggle]").scrollIntoViewIfNeeded();
    const toolBox = await page.locator("[data-mode-toggle]").boundingBox();
    assert.ok(
      toolBox.y >= 0 && toolBox.y + toolBox.height <= 480,
      "low-height desktop tools remain reachable",
    );
    assert.deepEqual(
      errors,
      [],
      "no unhandled errors across new page lifecycles",
    );
    const plain = await browser.newContext({ javaScriptEnabled: false });
    try {
      const readable = await plain.newPage();
      for (const path of [
        "profile/",
        "friends/",
        "gallery/",
        "gallery/field/",
        "tools/",
        "games/",
      ]) {
        assert.equal(
          (await readable.goto(sites.beta5.url + path)).status(),
          200,
        );
        assert.equal(await readable.locator("h1").count(), 1);
      }
      await readable.goto(sites.beta5.url + "gallery/field/");
      assert.equal(await readable.locator(".photo-grid a[href]").count(), 2);
    } finally {
      await plain.close();
    }
    report.beta5 = {
      passed: true,
      defaultNavigation: 8,
      tools: true,
      games: true,
      albumLightbox: true,
      tocWidths: [360, 390, 768],
    };
  } catch (error) {
    await page.screenshot({ path: path.join(out, "beta5-failure.png") });
    throw error;
  } finally {
    await context.close();
  }
}
