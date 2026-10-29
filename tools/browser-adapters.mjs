import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const html = await fs.readFile(
  ".local/demo/public/2026/10/28/welcome/index.html",
  "utf8",
);
const cases = [
  [
    "giscus",
    { repo: "test/repo", repo_id: "rid", category_id: "cid" },
    "https://giscus.app/client.js",
  ],
  ["utterances", { repo: "test/repo" }, "https://utteranc.es/client.js"],
  [
    "disqus",
    { shortname: "hypergraph-test" },
    "https://hypergraph-test.disqus.com/embed.js",
  ],
  [
    "livere",
    { uid: "test-uid" },
    "https://cdn-city.livere.com/js/embed.dist.js",
  ],
  ["facebook", { app_id: "1234" }, "https://connect.facebook.net/"],
  [
    "remark42",
    { server: "https://comments.example.test", site: "test" },
    "https://comments.example.test/web/embed.js",
  ],
  [
    "valine",
    {
      app_id: "test-app",
      app_key: "test-key",
      server: "https://lean.example.test",
    },
    "chunk-Valine",
  ],
  [
    "disqusjs",
    {
      shortname: "test",
      api_key: "test-public-key",
      server: "https://disqus.example.test/",
    },
    "chunk-disqusjs",
  ],
  [
    "gitalk",
    {
      client_id: "test",
      client_secret: "test-public-placeholder",
      repo: "test",
      owner: "test",
      admin: ["test"],
      proxy: "https://oauth.example.test",
    },
    "vendor/gitalk.min.js",
  ],
  ["twikoo", { env_id: "https://twikoo.example.test" }, "twikoo-frame.js"],
  ["artalk", { server: "https://artalk.example.test", site: "test" }, "Artalk"],
];
const results = [];
for (const [provider, settings, expected] of cases.filter(
  (c) => !process.argv[2] || c[0] === process.argv[2],
)) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("pageerror", (e) => errors.push(e.stack));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1") {
      if (route.request().resourceType() === "script")
        await route.fulfill({
          contentType: "application/javascript",
          body: "",
        });
      else
        await route.fulfill({ status: 503, json: { message: "offline test" } });
      return;
    }
    if (url.pathname === "/adapter/") {
      const config = { enable: true, provider, options: {}, ...settings };
      await route.fulfill({
        contentType: "text/html",
        body: html.replace(
          /(<script type="application\/json" data-comment-config>)[\s\S]*?(<\/script>)/,
          "$1" + JSON.stringify(config) + "$2",
        ),
      });
      return;
    }
    await route.continue();
  });
  await page.goto("http://127.0.0.1:4174/adapter/");
  await page.waitForFunction(() => window.__hypergraph?.swup);
  await page.waitForFunction(
    () => document.querySelector("[data-comments]")?.dataset.mounted === "true",
  );
  const deadline = Date.now() + 15000;
  while (
    !requests.some((url) => url.includes(expected)) &&
    Date.now() < deadline
  )
    await page.waitForTimeout(100);
  assert.ok(
    requests.some((url) => url.includes(expected)),
    `${provider}: adapter not loaded; ${requests.join(",")}`,
  );
  await page.evaluate(() => window.__hypergraph.swup.navigate("/"));
  await page.waitForFunction(() => !window.__hypergraph.swup.navigating);
  assert.equal(
    await page.locator(".comment-frame,[data-comment-body] iframe").count(),
    0,
    provider + " cleanup",
  );
  // Some upstream SDKs log their own API failures, but the theme must leave the main page usable.
  assert.ok(await page.locator(".intro").isVisible());
  assert.deepEqual(errors, [], provider + " unhandled errors");
  results.push({ provider, requested: true, cleanup: true, errors });
  await context.close();
}
await browser.close();
await fs.writeFile(
  ".local/comment-adapters.json",
  JSON.stringify(results, null, 2),
);
console.log(
  "Adapter loading and page cleanup passed for " +
    results.length +
    " providers.",
);
