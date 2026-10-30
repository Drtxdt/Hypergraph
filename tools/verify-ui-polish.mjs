import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { generate, serve, route } from './verify/fixture.mjs';

const directory = path.resolve('.local/ui-polish');
await generate(directory);
const site = await serve(directory);
const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.sweepFrames = [];
      const sample = () => {
        const host = document.querySelector('[data-intro]');
        if (host?.classList.contains('is-leaving') && !host.hidden) {
          const style = getComputedStyle(host, '::after');
          window.sweepFrames.push({ scale: new DOMMatrix(style.transform).a, opacity: Number(getComputedStyle(host).opacity), width: host.getBoundingClientRect().width });
        }
        if (!host?.hidden) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto(site.url);
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro-active'));
    const frames = await page.evaluate(() => window.sweepFrames);
    assert.ok(frames.some(frame => frame.scale >= .999 && frame.width === width && frame.opacity > .1), 'yellow reaches full viewport before dismissal');
    assert.ok(frames.some(frame => frame.opacity > .1 && frame.opacity < .9), 'full-screen yellow fades rather than disappearing');
    await page.goto(site.url + route(site, 'field-study'));
    await page.waitForSelector('.back-to-top svg');
    const square = await page.locator('.back-to-top').boundingBox();
    assert.equal(square.width, square.height);
    await page.locator('.share-platforms summary').click();
    assert.ok(await page.locator('.share-platform-list').evaluate(el => el.getAnimations({ subtree: true }).length > 0), 'platform buttons animate on expansion');
    await page.waitForTimeout(450);
    const sharePositions = await page.locator('.post-actions').evaluate(el => [...el.querySelectorAll(':scope > button,.share-platforms > summary')].map(button => button.getBoundingClientRect().top));
    assert.ok(Math.max(...sharePositions) - Math.min(...sharePositions) < 2, 'primary share controls stay on the same top axis');
    await page.screenshot({ path: path.join(directory, `share-${width}.png`) });
    const toggle = page.locator('[data-player-toggle]');
    if (await page.locator('.player').isHidden()) {
      if (width < 1024) await page.locator('[data-menu-toggle]').click();
      else await page.mouse.move(32, 450);
      await toggle.click();
    }
    await page.locator('.audio-controls button').first().click();
    await page.waitForFunction(() => !document.querySelector('.player audio').paused);
    await page.locator('.audio-controls button').last().click();
    assert.equal(await page.locator('.player audio').evaluate(el => el.muted), true);
    await page.locator('.audio-volume input').fill('0.35');
    assert.equal(await page.locator('.player audio').evaluate(el => el.volume), .35);
    await page.locator('.audio-controls button').first().click();
    assert.equal(await page.locator('.player audio').evaluate(el => el.paused), true);
    await page.screenshot({ path: path.join(directory, `audio-${width}.png`) });
    await page.locator('[data-player-close]').click();
    await page.evaluate(() => window.savedAudio = document.querySelector('.player audio'));
    await page.locator('.brand').click();
    await page.waitForURL(site.url);
    assert.equal(await page.evaluate(() => window.savedAudio === document.querySelector('.player audio')), true, 'navigation preserves the audio instance');
    await page.goto(site.url + 'gallery/');
    await page.locator('.collection-gallery img,.gallery img,.prose img').first().click();
    await page.waitForSelector('.lightbox[open]');
    assert.equal(await page.locator('.lightbox .image-close svg').count(), 1);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(directory, `image-${width}.png`) });
    await page.locator('.image-next').click();
    assert.match(await page.locator('.lightbox p').innerText(), /^2 \/ 2/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.lightbox').isVisible(), false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(site.url + route(site, 'field-study'));
    await page.locator('.share-platforms summary').click();
    assert.equal(await page.locator('.share-platform-list').evaluate(el => el.getAnimations({subtree:true}).length), 0);
    await page.evaluate(() => document.documentElement.dataset.mode = 'dark');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(directory, `share-dark-${width}.png`) });
    await context.close();
    console.log(`UI polish ${width}: full sweep/fade, square icon, share expansion, audio, image preview passed`);
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const page = await noScript.newPage();
  await page.goto(site.url);
  assert.equal(await page.locator('.player audio[controls]').isVisible(), true);
  await noScript.close();
} finally { await browser.close(); await site.close(); }
