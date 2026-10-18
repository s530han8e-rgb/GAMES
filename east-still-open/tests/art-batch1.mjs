import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];let checks=0;
for(const width of [1366,770,600]){
 const page=await browser.newPage({viewport:{width,height:width===770?752:768}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5174/review/?page=art-scenes');
 for(const node of ['home','family','road','bench','bench2','uncle','routeA']){
  await page.getByLabel('美术场景').selectOption(node);await page.waitForTimeout(160);
  let seen=new Set();
  for(let beat=0;beat<40;beat++){
   await page.waitForTimeout(80);
   const speaker=(await page.locator('.dialogue .speaker').allTextContents())[0];
   const portrait=page.locator('.speakerPortrait');
   assert.equal(await portrait.count(),speaker?1:0,`${node} beat ${beat} portrait clears on narration`);
   if(speaker){
    assert.equal(await portrait.getAttribute('data-character'),speaker);
    const im=portrait.locator('img');await im.waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.speakerPortrait img')].every(i=>i.complete&&i.naturalWidth>0));
    const box=await portrait.boundingBox(),dialogue=await page.locator('.dialogue').boundingBox();const seam=box.y+box.height-dialogue.y;assert.ok(seam>=-1&&seam<=2.5,`portrait seam ${seam}, ${width} ${node} ${beat}`);const imageBox=await im.boundingBox();assert.ok(imageBox.y+imageBox.height>=dialogue.y-1,'actual image reaches paper, not just empty container');
    if(!seen.has(speaker)&&width===770){await page.screenshot({path:`tests/screenshots/art-${node}-${speaker}.png`});seen.add(speaker)}
   }
   const buttons=page.locator('.dialogue .actions button');const paper=await page.locator('.dialogue').boundingBox();for(const b of await buttons.all()){const bb=await b.boundingBox();assert.ok(bb.y+bb.height<=paper.y+paper.height+2,'all choices inside paper');assert.ok(bb.y+bb.height<=768,'choices inside viewport')}
   const bg=page.locator('.sceneBackground');if(await bg.count()){await page.waitForFunction(()=>document.querySelector('.sceneBackground').complete&&document.querySelector('.sceneBackground').naturalWidth>0)}
   checks++;
   const next=page.locator('.dialogue .actions').getByRole('button',{name:'继续',exact:true});if(!await next.count())break;
   await next.click();
  }
 }
 await page.getByLabel('美术场景').selectOption('block');await page.waitForTimeout(150);
 await page.getByRole('button',{name:'CHAIR',exact:true}).dragTo(page.locator('.brand'));assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).failures),0,'non-target drop cancels without error');
 for(const item of ['CHAIR','ROPE','ROSE','PILLOW']){
  const b=page.getByRole('button',{name:item,exact:true});assert.ok(await b.locator('.toolImage').count());
  await b.click({position:{x:8,y:8}});
 }
 await page.screenshot({path:`tests/screenshots/art-tools-${width}.png`});
 await page.getByRole('button',{name:'门内侧支撑区',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.pillow img')?.complete&&document.querySelector('.pillow img')?.naturalWidth>0);
 assert.ok(await page.locator('.pillow img').count());
 await page.screenshot({path:`tests/screenshots/art-pillow-${width}.png`});
 await page.getByRole('button',{name:'跳过动画',exact:true}).click();
 await page.close();
}
await browser.close();assert.deepEqual(errors,[]);console.log(checks,'dialogue beats checked, speaker identity/load/clear/bounds; tools and pillow effect; zero page errors');
