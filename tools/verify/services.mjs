import {route} from "./fixture.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { fork } from "node:child_process";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
export async function startWaline(root, origin) {
  const started = performance.now();
  await fs.mkdir(root, { recursive: true });
  const db = new DatabaseSync(path.join(root, "waline.sqlite"));
  db.exec(await fs.readFile("deploy/waline/sqlite.sql", "utf8"));
  db.close();
  const child = fork("tools/waline-fixture.cjs", {
    silent: true,
    env: {
      ...process.env,
      SQLITE_PATH: root,
      SQLITE_DB: "waline",
      JWT_TOKEN: "isolated-local-verification",
      SITE_URL: origin,
      AKISMET_KEY: "false",
      DISABLE_REGION: "true",
    },
  });
  let logs = "";
  child.stdout.on("data", (d) => (logs += d));
  child.stderr.on("data", (d) => (logs += d));
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(Error("Waline startup timeout " + logs));
    }, 60000);
    child.once("message", (m) => {
      clearTimeout(timer);
      resolve(m.url);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(Error("Waline exited " + code + " " + logs));
    });
  });
  const close = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null || child.killed) return resolve();
      child.once("exit", resolve);
      child.kill();
    });
  return { url, close, startupMs: performance.now() - started };
}
export async function checkServices(browser, site, waline, report) {
  const headers = {
    "Content-Type": "application/json",
    Origin: new URL(site.url).origin,
  };
  const marker = "Hypergraph-v2-" + Date.now();
  const result = await fetch(waline.url + "/api/comment", {
    method: "POST",
    headers,
    body: JSON.stringify({
      comment: marker,
      nick: "Local verification",
      mail: "test@example.invalid",
      url: "/integration-test/",
      ua: "Hypergraph",
      link: "",
    }),
  }).then((r) => r.json());
  assert.equal(result.errno, 0, JSON.stringify(result));
  const list = await fetch(
    waline.url + "/api/comment?path=%2Fintegration-test%2F",
    { headers },
  ).then((r) => r.json());
  assert.ok(JSON.stringify(list).includes(marker));
  const html = await fs.readFile(
    path.join(site.base, "public", route(site,"welcome"), "index.html"),
    "utf8",
  );
  const cases = [
    ["waline", { server: waline.url }, "waline"],
    [
      "giscus",
      { repo: "test/repo", repo_id: "rid", category_id: "cid" },
      "giscus.app/client.js",
    ],
    ["utterances", { repo: "test/repo" }, "utteranc.es/client.js"],
    [
      "disqus",
      { shortname: "hypergraph-test" },
      "hypergraph-test.disqus.com/embed.js",
    ],
    ["livere", { uid: "test" }, "livere"],
    ["facebook", { app_id: "1234" }, "connect.facebook.net"],
    [
      "remark42",
      { server: "https://comments.example.test", site: "test" },
      "comments.example.test",
    ],
    [
      "valine",
      { app_id: "test", app_key: "test", server: "https://lean.example.test" },
      "chunk-Valine",
    ],
    [
      "disqusjs",
      {
        shortname: "test",
        api_key: "public",
        server: "https://disqus.example.test/",
      },
      "chunk-disqusjs",
    ],
    [
      "gitalk",
      {
        client_id: "test",
        client_secret: "placeholder",
        repo: "test",
        owner: "test",
        admin: ["test"],
        proxy: "https://oauth.example.test",
      },
      "gitalk.min.js",
    ],
    ["twikoo", { env_id: "https://twikoo.example.test" }, "twikoo-frame.js"],
    [
      "artalk",
      { server: "https://artalk.example.test", site: "test" },
      "Artalk",
    ],
  ];
  report.services = [];
  for (const [provider, settings, expected] of cases) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const requests = [],
      errors = [];
    page.on("request", (r) => requests.push(r.url()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") {
        if (route.request().resourceType() === "script")
          return route.fulfill({ contentType: "text/javascript", body: "" });
        return route.fulfill({
          status: 503,
          json: { message: "service unavailable" },
        });
      }
      if (url.pathname === "/adapter/") {
        const config = { enable: true, provider, options: {}, ...settings };
        return route.fulfill({
          contentType: "text/html",
          body: html.replace(
            "</main>",
            '<section data-comments><script type="application/json" data-comment-config>' +
              JSON.stringify(config) +
              '</script><div data-comment-body></div><p role="status"></p></section></main>',
          ),
        });
      }
      return route.continue();
    });
    await page.goto(site.url + "adapter/");
    await page.waitForFunction(
      () =>
        document.querySelector("[data-comments]")?.dataset.mounted === "true",
    );
    if (provider === "waline") await page.locator(".wl-panel").waitFor();
    const deadline = Date.now() + 15000;
    while (!requests.some((r) => r.includes(expected)) && Date.now() < deadline)
      await page.waitForTimeout(100);
    assert.ok(
      requests.some((r) => r.includes(expected)),
      provider + " not requested",
    );
    if (provider === "artalk")
      await page
        .frameLocator(".comment-frame")
        .locator("#status")
        .filter({ hasText: "评论暂时无法加载" })
        .waitFor();
    await page.waitForFunction(() => window.__hypergraph?.swup);
    await page.evaluate(
      (url) => window.__hypergraph.swup.navigate(url),
      site.url,
    );
    await page.locator(".lead").waitFor();
    assert.equal(
      await page.locator(".comment-frame,[data-comment-body]").count(),
      0,
    );
    assert.deepEqual(errors, [], provider);
    report.services.push({
      provider,
      adapterLoading: true,
      cleanup: true,
      verification:
        provider === "waline"
          ? "SQLite anonymous write/read + client mount"
          : "mocked external failures",
    });
    await context.close();
  }
}
