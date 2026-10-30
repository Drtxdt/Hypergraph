import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
export async function checkBeta3(browser, sites, out, report) {
  const context = await browser.newContext({viewport:{width:390,height:844}, permissions:['clipboard-read','clipboard-write']});
  const page = await context.newPage();
  const routes = JSON.parse(await fs.readFile(sites.main.base+'/routes.json','utf8'));
  try {
    for (const width of [360,390,768,1024,1100,1440]) {
      await page.setViewportSize({width,height:1000});
      await page.goto(sites.main.url+'standalone/');
      const rects = await page.evaluate(()=>['.standalone-page h1','.standalone-page .prose'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,width:r.width};}));
      assert.ok(Math.abs(rects[0].x-rects[1].x)<2);
      if(width>=1024)assert.ok(rects[1].width>=600 && rects[1].width<=674);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:out+`/standalone-${width}.png`});
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(sites.main.url+routes['private-plain']);
    await page.locator('[data-unlock] input').fill('fixture-password-7329');
    await page.locator('[data-unlock] button[type=submit]').click();
    await page.locator('[data-unlock]').waitFor({state:'detached'});
    for(let i=0;i<3;i++) {
      await page.locator('.toc-mobile summary').click();
      await page.waitForTimeout(200);
      assert.equal(await page.locator('.toc-mobile details').evaluate(e=>e.open),true);
      await page.locator('[data-toc-close]').click();
      assert.equal(await page.locator('.toc-mobile details').evaluate(e=>e.open),false);
    }
    await page.setViewportSize({width:1440,height:1000});
    assert.ok(await page.locator('.toc-desktop').isVisible());
    assert.equal(await page.locator('.toc-mobile').isVisible(),false);
    await page.goto(sites.main.url+routes['field-study']);
    const axis=await page.evaluate(()=>['.prose','.article-end'].map(s=>document.querySelector(s).getBoundingClientRect().x));
    assert.ok(Math.abs(axis[0]-axis[1])<2);
    assert.equal(await page.locator('.share-platform-list').isVisible(),false);
    await page.locator('.share-platforms summary').click();
    assert.ok(await page.locator('.share-platform-list').isVisible());
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.share-platform-list').isVisible(),false);
    await page.locator('.post-actions > [data-copy-share]').click();
    assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/field-study/);
    await page.setViewportSize({width:390,height:844});
    await page.goto(sites.main.url+routes['field-study']);
    await page.waitForFunction(()=>document.querySelector('[data-player-toggle]').getAttribute('aria-expanded')==='true');
    await page.locator('[data-menu-toggle]').click();
    await page.locator('[data-player-toggle]').click();
    assert.equal(await page.locator('.player').isVisible(),false);
    report.beta3={standaloneWidths:6,unlockedTocCycles:3,desktopResize:true,postEndAxis:true,share:true,initialMusicClose:true};
  } finally {await context.close();}
}
