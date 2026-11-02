import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import assert from "node:assert/strict";
import { generate, serve } from "./verify/fixture.mjs";
export async function checkRecipes(browser, sites, out, report) {
  const dir = path.join(out, "recipes");
  await fs.mkdir(dir, { recursive: true });
  const evidence = [];
  for (const name of ["technical", "portrait", "photography"]) {
    const theme = yaml.load(
      await fs.readFile(`examples/recipes/${name}.yml`, "utf8"),
    );
    const data = yaml.load(
      await fs.readFile("examples/recipes/photography-data.yml", "utf8"),
    );
    const base = path.join(dir, name);
    await generate(base, {
      content: true,
      theme,
      data,
      photographyRecipe: name === "photography",
    });
    const server = await serve(base);
    let passed = false;
    try {
      for (const width of [390, 768, 1440])
        for (const colorScheme of ["light", "dark"]) {
          const context = await browser.newContext({
            viewport: { width, height: 900 },
            colorScheme,
            recordVideo: {
              dir: path.join(dir, "videos"),
              size: { width, height: 900 },
            },
          });
          try {
            const page = await context.newPage();
            await page.goto(server.url);
            await page.waitForFunction(() => !document.documentElement.classList.contains("intro-active") && !document.querySelector("[data-laser-canvas]"));
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              `${name} overflow`,
            );
            const screenshot = path.join(
              dir,
              `${name}-${width}-${colorScheme}.png`,
            );
            await page.waitForFunction(() => !document.querySelector("[data-laser-canvas]"));
            await page.screenshot({ path: screenshot });
            if (width === 390) {
              await page.evaluate(() => {
                document.querySelector("#content").style.fontSize = "200%";
                document.querySelector("[data-masthead-title]").style.fontSize =
                  "4rem";
              });
              assert.ok(
                await page.evaluate(
                  () => document.documentElement.scrollWidth <= innerWidth,
                ),
              );
            }
            evidence.push({ name, width, colorScheme, screenshot });
          } finally {
            await context.close();
          }
        }
      passed = true;
    } finally {
      await server.close();
      if (passed) {
        assert.ok(path.resolve(base).startsWith(path.resolve(dir) + path.sep));
        await fs.rm(base, { recursive: true, force: true });
      }
    }
  }
  await fs.writeFile(
    path.join(dir, "report.json"),
    JSON.stringify(evidence, null, 2),
  );
  report.checks.push(
    "Three documented recipes: desktop/tablet/mobile, light/dark, enlarged text",
  );
}
