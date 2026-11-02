import assert from "node:assert/strict";
import path from "node:path";
const poll = async (page, fn) => {
  for (let i = 0; i < 200; i++) {
    if (await page.evaluate(fn)) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw Error("Image preparation did not settle");
};
export async function checkAlignment(browser, site, out) {
  for (const width of [1440, 390])
    for (const [iw, ih] of [
      [400, 100],
      [100, 400],
    ])
      for (const position of ["50% 50%", "0% 0%", "100% 100%"]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
          deviceScaleFactor: 3,
        });
        let release;
        const gate = new Promise((r) => (release = r));
        await page.route("**/chunk-laser-print-*.js", async (route) => {
          await gate;
          await route.continue();
        });
        await page.route("**/images/print-mark.svg", (route) =>
          route.fulfill({
            contentType: "image/svg+xml",
            body: `<svg xmlns="http://www.w3.org/2000/svg" width="${iw}" height="${ih}"><rect x="${iw * 0.2}" y="${ih * 0.2}" width="${iw * 0.6}" height="${ih * 0.6}" fill="#555"/></svg>`,
          }),
        );
        const time = new Date("2026-11-02T00:00:00Z");
        await page.clock.install({ time });
        await page.clock.pauseAt(time);
        await page.goto(site.url, { waitUntil: "domcontentloaded" });
        await poll(
          page,
          () =>
            document.querySelector(".masthead-artwork img")?.naturalWidth > 0,
        );
        const expected = await page
          .locator(".masthead-artwork")
          .evaluate((target, position) => {
            const img = target.querySelector("img");
            img.style.objectPosition = position;
            const box = img.getBoundingClientRect(),
              outer = target.getBoundingClientRect();
            const scale = Math.min(
                box.width / img.naturalWidth,
                box.height / img.naturalHeight,
              ),
              w = img.naturalWidth * scale,
              h = img.naturalHeight * scale;
            const [x, y] = position.split(" ").map(parseFloat);
            return {
              x: box.left - outer.left + ((box.width - w) * x) / 100 + w * 0.2,
              y: box.top - outer.top + ((box.height - h) * y) / 100 + h * 0.2,
              width: w * 0.6,
              height: h * 0.6,
            };
          }, position);
        release();
        await poll(
          page,
          () =>
            document.querySelector(".masthead-artwork")?.dataset.laserState ===
            "prepared",
        );
        await page.clock.runFor(2640);
        const actual = await page
          .locator("[data-laser-canvas]")
          .evaluate((c) => ({
            bounds: JSON.parse(c.dataset.bounds),
            pixels: c.width * c.height,
            points: Number(c.dataset.targetPoints),
            dpr: c.width / c.getBoundingClientRect().width,
          }));
        for (const key of ["x", "y", "width", "height"])
          assert.ok(
            Math.abs(actual.bounds[key] - expected[key]) < 10,
            `${width} ${iw}x${ih} ${position}: ${key} ${actual.bounds[key]} vs ${expected[key]}`,
          );
        assert.ok(actual.pixels <= 1500000);
        assert.ok(actual.dpr <= 2);
        assert.ok(actual.points <= (width < 1024 ? 900 : 1800));
        await page.clock.runFor(700);
        assert.equal(await page.locator("[data-laser-canvas]").count(), 0);
        if (position === "100% 100%")
          await page.screenshot({
            path: path.join(out, `alignment-${width}-${iw}x${ih}.png`),
          });
        await page.close();
      }
  for (const title of [
    "在持续变化的世界里记录观察连接知识与长期写作的真实站点名称",
    "Hypergraph 观察与记录 Field Notes",
  ]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 900 },
    });
    let release;
    const gate = new Promise((r) => (release = r));
    await page.route("**/chunk-laser-print-*.js", async (route) => {
      await gate;
      await route.continue();
    });
    const time = new Date("2026-11-02T00:00:00Z");
    await page.clock.install({ time });
    await page.clock.pauseAt(time);
    await page.goto(site.wordmarkUrl, { waitUntil: "domcontentloaded" });
    await page
      .locator(".site-wordmark")
      .evaluate((e, title) => (e.textContent = title), title);
    release();
    await poll(
      page,
      () =>
        document.querySelector(".masthead-artwork")?.dataset.laserState ===
        "prepared",
    );
    await page.clock.runFor(2640);
    assert.ok(
      Number(
        await page
          .locator("[data-laser-canvas]")
          .getAttribute("data-target-points"),
      ) > 0,
    );
    assert.equal(
      await page.locator(".site-wordmark").evaluate((e) => {
        const a = e.getBoundingClientRect(),
          b = e.parentElement.getBoundingClientRect();
        return a.top >= b.top && a.bottom <= b.bottom && a.right <= b.right;
      }),
      true,
    );
    await page.clock.runFor(700);
    await page.close();
  }
}
