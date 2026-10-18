import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir=process.env.GAME_CHECK_ARTIFACT_DIR||'checks/demo-controls';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const key=async locator=>{await locator.focus();await page.keyboard.press('Enter');await page.waitForTimeout(80)};
await page.goto(process.env.GAME_CHECK_URL||'http://127.0.0.1:4176/');
await key(page.getByRole('button',{name:'设置',exact:true}));
await page.getByRole('checkbox',{name:'减少动效',exact:true}).check();
await key(page.locator('.modal-settings .close'));
await page.reload();await key(page.getByRole('button',{name:'设置',exact:true}));assert.ok(await page.getByRole('checkbox',{name:'减少动效',exact:true}).isChecked());await page.getByRole('checkbox',{name:'减少动效',exact:true}).uncheck();await key(page.locator('.modal-settings .close'));
await key(page.getByRole('button',{name:'开始新周目',exact:true}));
for(let i=0;i<50&&(await state()).reading;i++)await key(page.locator('.dialogue .actions').getByRole('button',{name:'继续',exact:true}));
const before=await state();const windows=[];
for(const [width,height] of [[1366,768],[900,700],[1920,1080]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(200);
 const r=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollX:document.documentElement.scrollWidth>innerWidth+2,scrollY:document.documentElement.scrollHeight>innerHeight+2,actions:[...document.querySelectorAll('.sceneChoices button')].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,inView:r.left>=0&&r.right<=innerWidth+2&&r.top>=0&&r.bottom<=innerHeight+2}})}));
 assert.equal(r.scrollX,false);assert.equal(r.scrollY,false);for(const x of r.actions)assert.ok(x.inView,JSON.stringify(x));assert.equal((await state()).node,before.node);assert.deepEqual((await state()).clues,before.clues);windows.push(r);await page.screenshot({path:`${dir}/live-resize-${width}.png`});
}
const word=page.locator('.sceneChoices .lookupWord').first();await word.click();await page.getByRole('dialog',{name:'中文释义',exact:true}).waitFor();assert.equal((await state()).node,before.node);await page.keyboard.press('Escape');
await key(page.getByRole('button',{name:'设置',exact:true}));
// Both ends of the settings dialog remain inside its keyboard focus trap.
const close=page.locator('.modal-settings .close'),last=page.getByRole('checkbox',{name:'减少动效',exact:true});
await close.focus();await page.keyboard.press('Shift+Tab');assert.ok(await last.evaluate(e=>e===document.activeElement));await page.keyboard.press('Tab');assert.ok(await close.evaluate(e=>e===document.activeElement));await page.keyboard.press('Escape');assert.equal(await page.locator('.modal-settings').count(),0);
await key(page.getByRole('button',{name:'Evidence',exact:true}));assert.equal(await page.locator('.detailLink').count(),0);await page.keyboard.press('Escape');
const audio=await page.evaluate(()=>({elements:document.querySelectorAll('audio,video').length,external:performance.getEntriesByType('resource').filter(r=>!r.name.startsWith(location.origin)).map(r=>r.name),ua:navigator.userAgent}));assert.equal(audio.elements,0);assert.deepEqual(audio.external,[]);assert.deepEqual(errors,[]);
await page.screenshot({path:`${dir}/controls-final.png`});
fs.writeFileSync(process.env.GAME_CHECK_RESULT_FILE||dir+'/result.json',JSON.stringify({browser:await browser.version(),platform:process.platform,arch:process.arch,scope:'native new-game, live desktop window resize, settings persistence, Tab trap/Escape, gloss non-selection, unknown evidence hidden',windows,audio,errors,requests},null,2));await browser.close();console.log('Live window resize and keyboard/settings/gloss controls passed');
