import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { route } from './verify/fixture.mjs';

export async function checkUiPolish(browser, site, directory, report = {}) {
await fs.mkdir(directory, { recursive: true });
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.shareMotionEvents=[];
      for(const type of ['animationstart','animationend','animationcancel']) document.addEventListener(type, event => {
        if(event.target.closest?.('.share-platform-list') && event.animationName==='share-reveal') window.shareMotionEvents.push({type,at:performance.now(),elapsed:event.elapsedTime});
      });
    });
    const actionsGate=Promise.withResolvers();
    await page.route('**/chunk-actions-*.js', async request => { await actionsGate.promise; await request.continue().catch(()=>{}); });
    try {
    await page.goto(site.url + route(site, 'field-study'), {waitUntil:'domcontentloaded'});
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForSelector('.back-to-top svg');
    const square = await page.locator('.back-to-top').boundingBox();
    assert.equal(square.width, square.height);
    await page.locator('.share-platforms summary').click();
    await page.waitForFunction(() => {
      const events=window.shareMotionEvents;
      return events.some(e=>e.type==='animationstart') && events.filter(e=>e.type==='animationend').length===document.querySelectorAll('.share-platform-list > *').length;
    });
    await page.locator('.share-platforms summary').click();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.locator('.share-platforms summary').click();
    await page.waitForFunction(()=>window.shareMotionEvents.filter(e=>e.type==='animationend').length===2*document.querySelectorAll('.share-platform-list > *').length);
    const shareEvents=await page.evaluate(()=>window.shareMotionEvents);
    await fs.writeFile(path.join(directory, `share-timeline-${width}.json`),JSON.stringify(shareEvents,null,2));
    assert.ok(shareEvents.filter(e=>e.type==='animationend').every(e=>Math.abs(e.elapsed-.24)<.01));
    } finally { actionsGate.resolve(); }
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
    const rangeResponse = await context.request.get(site.url + 'audio/sample.wav', {headers:{Range:'bytes=100-199'}});
    assert.equal(rangeResponse.status(), 206);
    assert.equal((await rangeResponse.body()).length, 100);
    await page.locator('.audio-controls > input').fill('35');
    await page.waitForFunction(() => { const audio=document.querySelector('.player audio'); return !audio.seeking && Math.abs(audio.currentTime/audio.duration-.35)<.02; });
    if(width===390) for(const selector of ['[data-player-close]','.audio-controls > input','.audio-volume input']) assert.ok((await page.locator(selector).boundingBox()).height>=44);
    await page.screenshot({ path: path.join(directory, `audio-${width}.png`) });
    await page.locator('[data-player-close]').click();
    await page.evaluate(() => window.savedAudio = document.querySelector('.player audio'));
    if (width < 1024) await page.locator('[data-menu-toggle]').click();
    await page.locator('#site-nav > a').first().click({position:{x:32,y:22}});
    await page.waitForURL(site.url);
    assert.equal(await page.evaluate(() => window.savedAudio === document.querySelector('.player audio')), true, 'navigation preserves the audio instance');
    await page.goto(site.url + 'gallery/');
    await page.locator('.album-card').first().click();
    await page.locator('.photo-grid').waitFor();
    await page.locator('.collection-gallery img,.gallery img,.prose img').first().click();
    await page.waitForSelector('.lightbox[open]');
    assert.equal(await page.locator('.lightbox .image-close svg').count(), 1);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(directory, `image-${width}.png`) });
    await page.locator('.image-next').click();
    assert.match(await page.locator('.lightbox p').first().innerText(), /^2 \/ 2/);
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
report.uiPolish = { passed: true, widths: [1440, 390] };
}
export async function checkIntroCoverage(browser, site, directory, report = {}) {
 await fs.mkdir(directory, { recursive: true });
 for (const width of [1440, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  try {
   const page = await context.newPage();
    await page.addInitScript(() => {
      window.sweepFrames = [];
      const sample = () => {
        const host = document.querySelector('[data-intro]');
        if (host?.classList.contains('is-leaving') && !host.hidden) {
          const style = getComputedStyle(host, '::after');
          window.sweepFrames.push({ at:performance.now(), phase:host.dataset.phase, scale: new DOMMatrix(style.transform).a, opacity: Number(getComputedStyle(host).opacity), width: host.getBoundingClientRect().width });
        }
        if (!host?.hidden) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto(site.url);
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro-active'));
    const frames = await page.evaluate(() => window.sweepFrames);
    await fs.writeFile(path.join(directory, `sweep-${width}.json`), JSON.stringify(frames));
    assert.ok(frames.some(frame => frame.scale >= .999 && frame.width === width && frame.opacity > .1), 'yellow reaches full viewport before dismissal');
    assert.ok(frames.some(frame => frame.opacity > .1 && frame.opacity < .9), 'full-screen yellow fades rather than disappearing');
    const fade = frames.filter(frame => frame.phase === 'fade');
    assert.ok(fade.length > 1 && fade.at(-1).at - fade[0].at >= 500 && fade.at(-1).at - fade[0].at <= 650, 'frame-observed fade spans approximately 600ms');

  } finally { await context.close(); }
 }
 for (const name of ['slow-cover','stalled-cover']) {
  const context = await browser.newContext();
  try {
   const page = await context.newPage();
   const markup = await (await context.request.get(site.url)).text();
   const hero = /class="responsive-media masthead-media" data-responsive-image="([^"]+)"/.exec(markup);
   assert.ok(hero, 'slow-resource scenario requires the real masthead image');
   const image = JSON.parse(hero[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&')).src;
   await page.route(new URL(image, site.url).href, async request => {
    if (name === 'slow-cover') { await new Promise(resolve=>setTimeout(resolve,1000)); await request.continue().catch(()=>{}); }
   });
   await page.goto(site.url, {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.__hgIntroResult);
   const result = await page.evaluate(()=>window.__hgIntroResult);
   await fs.writeFile(path.join(directory,`${name}.json`),JSON.stringify(result,null,2));
   assert.ok(result.ended-result.started <= 4000, 'visible blocking never exceeds four seconds');
   assert.ok(['complete','late-start'].includes(result.reason));
   assert.ok(result.ended <= 2500, 'cover loading never extends the normal animation');
   if(name==='slow-cover') assert.ok(result.coverReadyAt>=1000);
   else assert.equal(result.coverReadyAt,undefined);
  } finally { await context.close(); }
 }
 report.introCoverage = { passed: true };
}
