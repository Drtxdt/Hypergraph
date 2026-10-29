import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { serve, files } from "./verify/fixture.mjs";
const base = process.argv[2] || ".local/v2-migration/preview";
const server = await serve(base);
let browser;
try {
  const posts = JSON.parse(
    await fs.readFile(path.join(base, "db.json"), "utf8"),
  ).models.Post.sort((a, b) => b.raw.length - a.raw.length);
  const longest = posts[0];
  assert.ok(longest.raw.length > 116000);
  const html = await files(path.join(base, "public"));
  const file = html.find((f) =>
    f.replaceAll("\\", "/").endsWith("/" + longest.slug + "/index.html"),
  );
  assert.ok(file);
  const route = path
    .relative(path.join(base, "public"), file)
    .replaceAll("\\", "/")
    .replace(/index.html$/, "");
  browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const checks = [];
  for (const width of [360, 390, 768, 1440])
    for (const view of ["", route]) {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1000 : 844,
      });
      await page.goto(server.url + view);
      await page.waitForTimeout(500);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (view)
        assert.ok((await page.locator(".prose").textContent()).length > 100000);
      checks.push({ width, view: view ? "long" : "home", passed: true });
    }
  await page.goto(server.url);
  await page.waitForFunction(() => window.__hypergraph?.swup);
  await page.evaluate(() => {
    window.audio = document.querySelector(".player audio");
    return window.audio.play();
  });
  await page.evaluate(
    (url) => window.__hypergraph.swup.navigate(url),
    server.url + route,
  );
  await page.locator(".prose").waitFor();
  assert.ok(
    await page.evaluate(
      () =>
        window.audio === document.querySelector(".player audio") &&
        !window.audio.paused,
    ),
  );
  assert.deepEqual(errors, []);
  await fs.writeFile(
    ".local/private-v2-report.json",
    JSON.stringify(
      {
        passed: true,
        checks,
        rawCharacters: longest.raw.length,
        realAudioNavigation: true,
        unhandledErrors: errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server.close();
}
