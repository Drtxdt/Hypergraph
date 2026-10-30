import { checkUiPolish, checkIntroCoverage } from "./verify-ui-polish.mjs";
import { checkBeta4 } from "./verify-beta4.mjs";
import { checkBeta5 } from "./verify-beta5.mjs";
import fs from "node:fs/promises";
import {checkBeta3} from "./verify-beta3.mjs";
import {checkBeta2} from "./verify-beta2.mjs";
import {checkMotionV21} from "./verify-motion-v21.mjs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import os from "node:os";
import crypto from "node:crypto";
import { chromium } from "playwright";
import { generate, serve, files } from "./verify/fixture.mjs";
import { checkAdvanced } from "./verify/advanced.mjs";
import { checkIntegrations } from "./verify/integrations.mjs";
import { startWaline, checkServices } from "./verify/services.mjs";
import { checkBrowser, performance } from "./verify/browser.mjs";
process.env.TZ = "UTC";
const out = path.resolve(".local/verification");
await fs.mkdir(out, { recursive: true });
const temp = await fs.mkdtemp(path.resolve(".local/verify-"));
const report = {
  version: JSON.parse(await fs.readFile("package.json", "utf8")).version,
  date: new Date().toISOString(),
  passed: false,
  conditions: { cpu: 4, latency: 150, downloadMbps: 1.6, viewport: "390x844", compression: "Shipped main.css.gz/main.js.gz sidecars negotiated with Accept-Encoding; other resources uncompressed" },
  checks: [],
  buildMode: process.argv.includes("--skip-build") ? "diagnostic-skip" : "full",
};
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(Error(args.join(" ") + " exited " + code)),
    );
  });
const servers = [];
let browser, waline;
try {
  if (!process.argv.includes("--skip-build")) {
    await run(["node_modules/typescript/bin/tsc"]);
    await run([
      "--test",
      ...(await fs.readdir("tests"))
        .filter((x) => x.endsWith(".test.cjs"))
        .map((x) => "tests/" + x),
    ]);
    await run(["tools/build-assets.mjs"]);
  }
  try {
    await fs.access("deploy/waline/node_modules/@waline/vercel/package.json");
  } catch {
    const npm =
      process.env.npm_execpath ||
      path.join(
        path.dirname(process.execPath),
        "node_modules/npm/bin/npm-cli.js",
      );
    await run([
      npm,
      "ci",
      "--prefix",
      "deploy/waline",
      "--no-audit",
      "--no-fund",
    ]);
  }
  const variants = {
    main: {},
    beta5: { defaultMenu:true, theme:{pages:{about:{enable:true,path:'profile/'}}}, data:{
      about:{profile:{name:'记录者',bio:'写作、观察与小型项目。'},projects:[{title:'公开示例',description:'一个可持续维护的记录空间。',url:'/archives/'}],timeline:[{date:'2026',title:'开始记录'}],interests:['设计','技术'],posts:['field-study']},
      friends:{groups:[{title:'文档',items:[{title:'Hexo',url:'https://hexo.io',description:'静态博客框架'}]}],application:'请通过站长提供的联系方式交流。'},
      gallery:{albums:[{slug:'field',title:'观察记录',photos:[{image:'/images/record.svg',caption:'结构与秩序'},{image:'/images/connect.svg',caption:'连接'}]}]},
      tools:{links:[{title:'Hexo 文档',description:'公开技术文档',url:'https://hexo.io/docs/',group:'参考'}]},games:{links:[]}
    }},
    paginated: { perPage:1 },
    boundaries: {few:true,manualAbout:true,defaultMenu:true,root:'/blog/',theme:{home:{sections:['featured','posts']},sidebar:{enable:true,order:['announcement'],announcement:'Independent announcement'},pages:{about:{enable:true,path:'profile/'},games:{enable:false}}}},
    contained: {content:true,theme:{appearance:{cover_fit:'contain'},music:{enable:false}}},
    content: { content:true, theme: { music: { enable:false } } },
    noCover: { noCover: true },
    empty: { empty: true },
    few: { few: true },
    options: {
      theme: {
        pwa: { enable: true },
        extensions: [
          {
            package: path.resolve("examples/extension"),
            enable: true,
            config: { text: "Independent extension v2" },
          },
        ],
        interaction: { translate: true, spacing: true },
        home: { sections: ["posts", "intro", "featured"] },
        sidebar: {
          enable: true,
          order: ["profile", "stats", "announcement", "tags"],
          announcement: "",
        },
      },
    },
    subdir: { root: "/blog/" },
    english: { language: "en" },
    disabled: {
      theme: {
        navigation: false,
        search: false,
        lightbox: false,
        music: { enable: false },
        appearance: { motion: "off", intro: "off" },
        tools: { back_to_top: false, progress: false, keyboard: false },
      },
    },
  };
  const sites = {};
  for (const [name, options] of Object.entries(variants)) {
    const base = path.join(temp, name);
    await generate(base, options);
    const server = await serve(base, options.root);
    servers.push(server);
    sites[name] = { base, ...server };
    console.log("Prepared " + name);
  }
  for (const file of await files(path.join(sites.main.base, "public")))
    if (/\.(html|json|xml|txt)$/.test(file)) {
      const data = await fs.readFile(file, "utf8");
      if (/PRIVATE_CANARY_|SECRET_CODE_7329|fixture-password-7329/.test(data))
        throw Error("Private data leaked into " + file);
    }
  report.checks.push("encrypted-output-scan");
  browser = await chromium.launch({
    headless: true,
    ...(process.env.HG_BROWSER === "chromium"
      ? {}
      : {
          channel:
            process.env.HG_BROWSER ||
            (process.platform === "win32" ? "msedge" : undefined),
        }),
  });
  report.browser = browser.version();
  report.environment = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    os: os.release(),
    font: "System sans-serif; system monospace for code",
    gitCommit: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    dirty:
      execFileSync("git", ["status", "--porcelain"], {
        encoding: "utf8",
      }).trim().length > 0,
  };
  await run(["tools/verify-navigation-v21.mjs"]);
  // Fail early on the real service prerequisite, before expensive UI sampling.
  // Keep the same startup timeout and SQLite backend; do not retry it silently.
  waline = await startWaline(path.join(temp, "waline"), new URL(sites.main.url).origin);
  report.walineStartupMs = waline.startupMs;
  console.log("Waline SQLite ready in " + Math.round(waline.startupMs) + " ms");
  await checkBrowser(browser, sites, report, out);
  console.log("Browser functional and visual checks passed");
  const uiFailures = [];
  for (const check of [checkUiPolish, checkIntroCoverage]) {
    try { await check(browser, sites.main, path.join(out, "ui-polish"), report); }
    catch (error) { uiFailures.push(error.stack); }
  }
  if (uiFailures.length) { report.uiFailures = uiFailures; throw Error(uiFailures.join("\n")); }
  await checkBeta4(browser, sites, out, report);
  await checkBeta5(browser, sites, out, report);
  await checkBeta3(browser, sites, out, report);
  await checkBeta2(browser, sites, out, report);
  console.log("Beta.2 controls and navigation race checks passed");
  await checkIntegrations(browser, sites.main, report);
  await checkAdvanced(browser, sites, report);
  await checkServices(browser, sites.main, waline, report);
  await waline.close();
  waline = undefined;
  console.log(
    "Integrations, appearance, extensions and comments passed; starting isolated performance sampling",
  );
  await performance(browser, sites, report);
  console.log("Performance checks passed");
  report.assets = {};
  for (const file of [
    "source/assets/main.js",
    "source/assets/main.css",
  ])
    report.assets[file] = crypto
      .createHash("sha256")
      .update(await fs.readFile(file))
      .digest("hex");
  report.buildFiles = {};
  for (const directory of ["source/assets", "layout", "lib", "scripts"])
    for (const file of await files(directory))
      report.buildFiles[file.replaceAll("\\", "/")] = crypto
        .createHash("sha256")
        .update(await fs.readFile(file))
        .digest("hex");

  await checkMotionV21(browser, sites, out, report);
  report.passed = true;
} catch (error) {
  report.error = error.stack;
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await waline?.close();
  for (const server of servers) await server.close();
  await fs.writeFile(
    path.join(out, "report.json"),
    JSON.stringify(report, null, 2),
  );
  if (!temp.startsWith(path.resolve(".local") + path.sep))
    throw Error("Unsafe verification cleanup");
  if (process.argv.includes("--keep"))
    console.log("Retained debug fixtures: " + temp);
  else await fs.rm(temp, { recursive: true, force: true });
  console.log("Verification report: " + path.join(out, "report.json"));
}
