import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const dir=process.env.GAME_CHECK_ARTIFACT_DIR||'checks/animation/visual';fs.mkdirSync(dir,{recursive:true});const b=await chromium.launch({channel:'chrome',headless:true});const rows=[];
for(const [w,h]of [[1366,768],[1920,1080]]){
 const context=await b.newContext({viewport:{width:w,height:h}});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const state=()=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const ready=async()=>{await p.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).animation);await p.waitForFunction(()=>[...document.querySelectorAll('.sceneBackground,.registeredLayer')].every(i=>i.complete&&i.naturalWidth>0))};
 const go=async node=>{await p.goto('http://127.0.0.1:5174/review/?page=art-scenes&scene='+node);await ready()};
 const click=async name=>{const button=p.getByRole('button',{name,exact:true}).first();await button.focus();await p.keyboard.press('Enter')};
 const run=async(kind,name)=>{await p.waitForFunction(k=>JSON.parse(window.render_game_to_text()).animation?.kind===k,kind);const before=await state();const frames=[];for(let i=0;i<5;i++){await p.evaluate(f=>{const m=JSON.parse(window.render_game_to_text()).animation;if(m)window.advanceTime(Math.max(0,m.duration*f-m.elapsed))},[.16,.35,.60,.84,.95][i]);await p.screenshot({path:`${dir}/${w}-${name}-${i}.png`});frames.push(await p.evaluate(()=>({animation:JSON.parse(window.render_game_to_text()).animation,tool:document.querySelector('.movingTool,.movingChair')?.getBoundingClientRect().toJSON(),door:document.querySelector('.doorLeaf')?.style.transform})));}
 // A second submission during playback cannot award or count again.
 await p.evaluate(()=>document.querySelector('.worldTargets button')?.click());assert.deepEqual((await state()).clues,before.clues);await click('跳过动画');await ready();rows.push({w,name,kind,frames,result:await state()});return await state()};
 await go('block');await click('ROSE');await click('门内侧支撑区');let s=await run('rose','rose');assert.equal(s.failures,1);assert.ok(!s.flags.includes('B_BLOCK'));
 await click('重新选择物品');await click('PILLOW');await click('门内侧支撑区');s=await run('pillow','pillow');assert.equal(s.failures,2);assert.ok(!s.flags.includes('B_BLOCK'));
 await click('重新选择物品');await click('ROSE');await click('门把手');await p.waitForFunction(()=>JSON.parse(window.render_game_to_text()).animation?.kind==='rose');assert.equal(await p.getByRole('button',{name:'再试一次',exact:true}).count(),0);s=await run('rose','rose-third');assert.equal(s.failures,3);await click('再试一次');assert.equal((await state()).failures,0);assert.equal(await p.locator('.staticPetals,.staticPillow').count(),0);await click('重新选择物品');
 await click('CHAIR');await click('门内侧支撑区');s=await run('chair','chair');assert.equal(s.node,'divert');assert.ok(s.flags.includes('B_BLOCK'));
 await click('BOTTLE');await click('远离出口的落点');s=await run('bottle','bottle');assert.equal(s.node,'retreat');assert.ok(s.flags.includes('B_BLOCK')&&s.flags.includes('B_DIVERT'));await p.screenshot({path:`${dir}/${w}-bottle-result.png`});
 await click('Continue');s=await run('retreat','retreat');assert.equal(s.node,'pressure');await click('DRESSING');await click('伤口');s=await run('pressure','pressure');assert.equal(s.node,'cover');await click('BANDAGE');await click('伤口');s=await run('cover','cover');assert.equal(s.node,'careDone');await p.screenshot({path:`${dir}/${w}-covered-result.png`});
 const act=p.getByRole('button',{name:/^Move to shelter\./}).first();await act.locator('.englishOptionCue').click();s=await run('exit','exit');assert.equal(s.node,'exit');assert.ok(!s.clues.includes(12));
 assert.deepEqual(errors,[]);await context.close();
}
await b.close();fs.writeFileSync(dir+'/results.json',JSON.stringify(rows,null,2));console.log('Two desktops: animated object frames, skip, duplicate guard, third-fun-error-before-retry, persistent brace/bottle, care and exit; review fixtures, not reachability evidence.');
