import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';const dir=process.env.GAME_CHECK_ARTIFACT_DIR||'tests/screenshots/bag-state-2026-10-14';fs.mkdirSync(dir,{recursive:true});
const b=await chromium.launch({channel:'chrome'});
for(const [width,height]of [[1366,768],[1920,1080],[390,844]]){
 const p=await b.newPage({viewport:{width,height}});await p.goto('http://127.0.0.1:5174/review/?page=art-scenes&scene=family&revision=bag-state-2026-10-14');await p.waitForFunction(()=>typeof window.render_game_to_text==='function');if(width!==1366)await p.getByLabel('放大文字',{exact:true}).check();
 for(let i=0;i<30;i++){
  await p.waitForFunction(()=>document.querySelector('.sceneBackground')?.naturalWidth>0);const src=await p.locator('.sceneBackground').getAttribute('src');assert.ok(src.includes('BG_HOME_DIALOGUE_AFTER_HANDOFF'));
  if(await p.locator('.speakerPortrait').count()){
   await p.waitForFunction(()=>document.querySelector('.speakerPortrait img')?.naturalWidth>0);assert.equal(await p.locator('.speakerPortrait').count(),1);assert.equal((await p.locator('.dialogue .speaker').innerText()).trim(),await p.locator('.speakerPortrait').getAttribute('data-character'));await p.screenshot({path:`${dir}/${width}-speaking.png`});break;
  }
  const next=p.locator('.dialogue .actions').getByRole('button',{name:'继续',exact:true});await next.focus();await p.keyboard.press('Enter');
 }
 await p.close();
}
await b.close();console.log('Three viewport speaking portraits over no-bag background verified');
