import assert from "node:assert/strict";
import { route } from "./verify/fixture.mjs";
export async function checkReaderFixes(browser, sites, out, report) {
  const context = await browser.newContext({ viewport: {width:1440,height:900}, reducedMotion:"reduce" });
  const page = await context.newPage();
  try {
    const content = sites.content || sites.main;
    await page.goto(content.url + route(content,"components"));
    const children = page.locator('.toc-desktop .toc-child a');
    assert.ok(await children.count() >= 2);
    for (let i=0;i<await children.count();i++) {
      const link=children.nth(i);
      assert.ok(await link.getAttribute('href'));
      await link.click();
      await page.waitForTimeout(150);
      const result=await link.evaluate(a=>{const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));return {top:target?.getBoundingClientRect().top,current:a.getAttribute('aria-current'),hash:location.hash===a.hash};});
      assert.ok(result.hash && result.current==='location' && result.top>=-1 && result.top<innerHeightFallback);
    }
    await page.goto(sites.main.url + route(sites.main,"showcase"));
    const diagram=page.locator('[data-diagram="mermaid"]').first();
    await diagram.locator('pre svg').waitFor();
    await diagram.locator('.diagram-controls button').nth(1).click();
    assert.equal(await diagram.locator('.diagram-scale').textContent(),'125%');
    await diagram.locator('.diagram-scale').click();
    assert.equal(await diagram.locator('.diagram-scale').textContent(),'100%');
    const diagramId=await diagram.locator('pre svg').getAttribute('id');
    await page.evaluate(()=>document.documentElement.dataset.mode='dark');
    await page.waitForFunction(id=>document.querySelector('[data-diagram="mermaid"] pre svg')?.id!==id,diagramId);
    await diagram.locator('.diagram-controls button').nth(1).click();
    assert.equal(await diagram.locator('pre svg').evaluate(svg=>svg.style.width),'125%');
    assert.equal(await diagram.locator('.diagram-controls svg').first().evaluate(svg=>svg.style.width),'');
    await diagram.screenshot({path:`${out}/diagram-fix.png`});
    for (const width of [360,390,768,1440]) {
      await page.setViewportSize({width,height:844});
      await page.goto(sites.main.url+'games/2048/');
      await page.locator('[data-new-game]:enabled').waitFor();
      await page.locator('[data-new-game]').click();
      await page.locator('h1').click();
      const colors=await page.locator('.game-cell').first().evaluate(cell=>{
        const value=cell.dataset.value;
        const colors=[2,4,8,16,32,64,128,256,512,1024,2048].map(v=>{cell.dataset.value=String(v);return getComputedStyle(cell).backgroundColor;});
        cell.dataset.value=value;return colors;
      });
      assert.equal(new Set(colors).size,11,'each tile rank has its own color');
      const before=await page.evaluate(()=>scrollY);
      for(const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']) await page.keyboard.press(key);
      assert.equal(await page.evaluate(()=>scrollY),before,'direction keys must not scroll');
      const controls=await page.locator('.game-controls').boundingBox();
      assert.ok(controls.y+controls.height<=844, 'game controls fit viewport');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'game page fits viewport');
      await page.screenshot({path:`${out}/game-fix-${width}.png`});
      if(width<1024) await page.locator('[data-menu-toggle]').click();
      else await page.mouse.move(24,120);
      await page.locator('[data-search]').click();
      await page.locator('#search-input').fill('hello');
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator('#search-input').inputValue(),'hello');
      await page.keyboard.press('Escape');
      await page.goto(sites.main.url+'games/minesweeper/');
      await page.locator('[data-new-game]:enabled').waitFor();
      await page.locator('[data-new-game]').click();
      await page.locator('h1').click();
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.evaluate(()=>scrollY),0);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'minesweeper fits viewport');
      assert.equal(await page.evaluate(()=>!document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',altKey:true,bubbles:true,cancelable:true}))),false,'browser modifiers remain available');
      await page.locator('.parent-link').click();
      await page.waitForURL('**/games/');
      await page.locator('[data-game-app]').waitFor({state:'detached'});
      assert.equal(await page.evaluate(()=>!document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}))),false,'game keys are released on navigation');
    }
    report.readerFixes={passed:true,nestedAnchors:true,gameKeys:true,viewport:[360,390,768,1440]};
  } finally { await context.close(); }
}
const innerHeightFallback=900;
