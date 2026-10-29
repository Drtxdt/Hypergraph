import assert from "node:assert/strict";
import fs from "node:fs/promises";
export async function checkAdvanced(browser, sites, report) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(sites.options.url + "2026/10/28/welcome/");
  await page.getByText("Independent extension v2", { exact: true }).waitFor();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await page.evaluate(() => window.__hypergraph.swup.navigate("/"));
  await page.locator(".lead").waitFor();
  assert.equal(await page.locator("[data-reading-note]").count(), 0);
  await page.evaluate(() =>
    window.__hypergraph.swup.navigate("/2026/10/28/welcome/"),
  );
  await page.getByText("Independent extension v2", { exact: true }).waitFor();
  assert.equal(await page.locator("[data-reading-note]").count(), 1);
  const before = await page.locator(".prose").textContent();
  await page.locator(".translate-toggle").click();
  await page.waitForFunction(
    (before) => document.querySelector(".prose").textContent !== before,
    before,
  );
  await page.locator(".translate-toggle").click();
  await page.waitForFunction(
    (before) => document.querySelector(".prose").textContent === before,
    before,
  );
  await context.setOffline(true);
  await page.goto(sites.options.url + "not-cached/");
  assert.ok((await page.locator("body").textContent()).includes("暂时离线"));
  await context.close();
  const html = await fs.readFile(
    sites.main.base + "/public/2026/10/29/field-study/index.html",
    "utf8",
  );
  report.appearance = [];
  for (const flag of ["cover_tint", "captions", "fallback_image"]) {
    const c = await browser.newContext(),
      p = await c.newPage();
    p.setDefaultTimeout(15000);
    const config = JSON.parse(
      html.match(
        /<script id="hg-config" type="application\/json">([\s\S]*?)<\/script>/,
      )[1],
    );
    config.appearance = {
      ...config.appearance,
      motion: "off",
      captions: false,
      cover_tint: false,
      fallback_image: "",
      [flag]: flag === "fallback_image" ? "/images/field.svg" : true,
    };
    let body = html.replace(
      /(<script id="hg-config" type="application\/json">)[\s\S]*?(<\/script>)/,
      (_, a, b) => a + JSON.stringify(config) + b,
    );
    body = body.replace(
      '<div class="prose">',
      '<div class="prose"><img src="' +
        (flag === "fallback_image" ? "/missing.png" : "/images/field.svg") +
        '" alt="Caption fixture">',
    );
    await p.route("**/flag-test/", (r) =>
      r.fulfill({ contentType: "text/html", body }),
    );
    await p.goto(sites.main.url + "flag-test/");
    if (flag === "cover_tint")
      await p.waitForFunction(() =>
        document
          .querySelector("#content")
          .style.getPropertyValue("--cover-tint"),
      );
    if (flag === "captions")
      await p.getByText("Caption fixture", { exact: true }).waitFor();
    if (flag === "fallback_image")
      await p.waitForFunction(
        () =>
          document.querySelector(".prose img").dataset.fallback === "true" &&
          document.querySelector(".prose img").naturalWidth > 0,
      );
    report.appearance.push({ flag, independent: true });
    await c.close();
  }
  report.advanced = {
    extensionMountCleanup: true,
    translation: true,
    pwaOffline: true,
  };
}
