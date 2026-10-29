import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => console.log(e.message));
await page.goto("http://127.0.0.1:4178/2026/10/29/components/");
await page.waitForSelector("[role=tab]");
console.log(
  await page
    .locator(".prose img")
    .evaluateAll((images) =>
      images.map((i) => ({
        alt: i.alt,
        width: i.width,
        height: i.height,
        natural: i.naturalWidth,
        parent: i.parentElement.outerHTML,
        rect: i.getBoundingClientRect().toJSON(),
      })),
    ),
);
await page.screenshot({
  path: ".local/screenshots/components-debug.png",
  fullPage: true,
});
await browser.close();
