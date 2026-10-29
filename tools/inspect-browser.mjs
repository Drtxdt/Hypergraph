import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("ERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});
page.on("requestfailed", (r) =>
  console.log("FAILED", r.url(), r.failure()?.errorText),
);
await page.goto("http://127.0.0.1:4174/2026/10/28/showcase/");
await page.waitForTimeout(4000);
console.log(
  await page
    .locator("[data-diagram]")
    .evaluateAll((nodes) =>
      nodes.map((n) => ({
        type: n.dataset.diagram,
        text: n.innerText.slice(0, 350),
        html: n.innerHTML.slice(0, 400),
      })),
    ),
);
await page.screenshot({ path: ".local/screenshots/diagnostic.png" });
await browser.close();
