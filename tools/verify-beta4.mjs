import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { route } from './verify/fixture.mjs';

export async function checkBeta4(browser, sites, out, report) {
  const context = await browser.newContext({ viewport: { width:390, height:844 }, reducedMotion:'reduce' });
  const page = await context.newPage();
  try {
    const compressed = await context.request.get(sites.main.url+'assets/main.css', {headers:{'Accept-Encoding':'gzip'}});
    const ordinary = await context.request.get(sites.main.url+'assets/main.css', {headers:{'Accept-Encoding':'gzip;q=0'}});
    assert.equal(compressed.headers()['content-encoding'], 'gzip');
    assert.equal(ordinary.headers()['content-encoding'], undefined);
    assert.equal(await compressed.text(), await ordinary.text(), 'negotiated CSS has exactly the same decoded content');
    for (const name of ['empty','few']) {
      await page.goto(sites[name].url);
      assert.equal(await page.locator('.site-masthead h1').count(), 1);
      assert.equal(await page.locator('#latest,.pagination').count(), 0);
    }
    await page.goto(sites.paginated.url);
    assert.equal(await page.locator('#latest').count(), 0);
    assert.equal(await page.locator('.pagination').count(), 1, 'a featured-only first page retains access to subsequent pages');
    await page.locator('.pagination a[href$="/page/2/"]').first().click();
    await page.waitForURL('**/page/2/');
    await page.locator('.entry').waitFor();
    assert.equal(await page.locator('.entry').count(), 1);
    assert.equal(await page.locator('.lead').count(), 0);
    await page.goto(sites.main.url+'archives/');
    assert.equal(await page.locator('.archive-index-mobile').getAttribute('open'), null);
    await page.locator('.archive-index-mobile summary').click();
    assert.ok(await page.locator('.archive-index-mobile nav').isVisible());
    await page.goto(sites.main.url);
    await page.locator('.lead-heading').evaluate(el => el.textContent = 'Hello World');
    await page.locator('.lead-title p').evaluateAll(elements => elements.forEach(el => el.remove()));
    const widths = await page.evaluate(() => ['.site-masthead','.masthead-copy'].map(s => document.querySelector(s).getBoundingClientRect().width));
    assert.ok(Math.abs(widths[0] - widths[1]) < 1, 'short title and empty excerpt retain the full mobile axis');
    for (const width of [390,768,1024,1440,1920]) {
      await page.setViewportSize({width,height:900});
      for (const mode of ['light','dark']) {
        await page.evaluate(mode => document.documentElement.dataset.mode=mode, mode);
        await page.screenshot({path:path.join(out,`beta4-short-${width}-${mode}.png`)});
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(sites.main.url + route(sites.main,'field-study'));
    await page.locator('.toc-mobile summary').click();
    const title = await page.locator('.toc-mobile summary').boundingBox();
    const close = await page.locator('.toc-close').boundingBox();
    assert.ok(Math.abs(title.y-close.y)<2 && close.x>title.x && close.width>=44);
    const panel = await page.locator('.toc-mobile details').boundingBox();
    const list = await page.locator('.toc-mobile .toc').boundingBox();
    const firstItem = await page.locator('.toc-mobile .toc a').first().boundingBox();
    assert.ok(list.width >= panel.width - 40, 'TOC text occupies the usable panel width');
    assert.ok(firstItem.width > 200 && firstItem.height < 80, 'ordinary headings remain readable horizontal lines');
    await page.locator('.toc-close').click();
    assert.equal(await page.locator('.back-to-top').evaluate(el=>getComputedStyle(el).position),'static');
    await page.goto(sites.main.url+'media-regression/');
    const images = page.locator('.prose img');
    assert.equal(await images.nth(1).evaluate(el=>el.currentSrc),'');
    await images.first().click();
    await page.locator('.lightbox img').waitFor({state:'visible'});
    let fail = true;
    await page.route('**/images/connect.svg', r => fail ? r.abort() : r.continue());
    await page.locator('.image-next').click();
    await page.locator('.image-retry').waitFor({state:'visible'});
    fail = false;
    await page.locator('.image-retry').click();
    await page.locator('.lightbox img').waitFor({state:'visible'});
    assert.ok(await page.locator('.lightbox img').evaluate(el=>el.naturalWidth>0 && el.src.includes('connect.svg')));
    await page.keyboard.press('Escape');
    assert.ok(await images.first().evaluate(el=>el===document.activeElement));
    for (const slug of ['photo-study','portrait-study','build-notes','short-note']) {
      await page.goto(sites.content.url + route(sites.content, slug));
      assert.ok(await page.locator('.prose').isVisible());
      for (const width of [390,1440]) {
        await page.setViewportSize({width,height:900});
        await page.screenshot({path:path.join(out,`content-${slug}-${width}.png`)});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      }
    }
    await page.goto(sites.content.url);
    for (const width of [390,1440,1920]) {
      await page.setViewportSize({width,height:900});
      await page.screenshot({path:path.join(out,`content-home-${width}.png`)});
      assert.ok((await page.locator('.lead-media img').getAttribute('src')).includes('landscape.jpg'));
    }
    report.beta4 = {passed:true, widths:[390,768,1024,1440,1920], lazyImageRetry:true};
  } catch(error) {
    await page.screenshot({path:path.join(out,'beta4-failure.png')}).catch(()=>{});
    throw error;
  } finally { await context.close(); }
}
