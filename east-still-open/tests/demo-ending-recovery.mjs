import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const base=process.env.GAME_CHECK_URL||'http://127.0.0.1:4176/';
const dir=process.env.GAME_CHECK_ARTIFACT_DIR||'checks/demo-ending-recovery';fs.mkdirSync(dir,{recursive:true});
const routes=JSON.parse(fs.readFileSync(process.env.GAME_CHECK_ROUTE_RESULT));
const browser=await chromium.launch({channel:'chrome',headless:true});const rows=[];
for(const route of routes){
 const width=Number(route.tag.split('-')[0]),height=width===1366?768:1080;
 const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);
 // Resume the current build's actual normal-start final save. This extends its
 // ending UI verification; it is not a replacement for route reachability.
 await p.evaluate(s=>new Promise((resolve,reject)=>{const request=indexedDB.open('east-still-open',1);request.onupgradeneeded=()=>request.result.createObjectStore('saves');request.onsuccess=()=>{const db=request.result,tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(s,'current');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};}),route.saved);
 await p.reload();await p.getByRole('button',{name:'继续游戏',exact:true}).click();
 const state=()=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const settled=async()=>{await p.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).animation);await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));await p.waitForTimeout(60);};
 const check=async(label)=>{await settled();const violations=await p.evaluate(()=>[...document.querySelectorAll('.endingPage p,.evidenceGrid article h3,.evidenceGrid .cardStatus,.evidenceRecordCard p,.vocabularyCard p')].filter(e=>e.getBoundingClientRect().width&&!e.closest('[inert]')).filter(e=>{const r=e.getBoundingClientRect(),a=e.closest('.endingPage,article').getBoundingClientRect();return r.top<a.top-2||r.bottom>a.bottom+2||r.left<a.left-2||r.right>a.right+2||r.bottom>innerHeight+2}).map(e=>e.textContent));if(violations.length)await p.screenshot({path:`${dir}/${route.tag}-failure.png`});assert.deepEqual(violations,[]);assert.equal((await state()).node,'ending');assert.deepEqual((await state()).clues,route.clues);await p.screenshot({path:`${dir}/${route.tag}-${label}.png`});};
 const press=async x=>{await x.focus();await p.keyboard.press('Enter');await settled();};
 let pages=0;await check('page-'+pages++);
 while(!await p.locator('.ending .archivePager').getByRole('button',{name:'下一页',exact:true}).isDisabled()){await press(p.locator('.ending .archivePager').getByRole('button',{name:'下一页',exact:true}));await check('page-'+pages++);assert.ok(pages<30)}
 await press(p.getByRole('button',{name:'Review Evidence',exact:true}));let evidencePages=0;
 do{await check('evidence-'+evidencePages++);const next=p.locator('.modal-review .archivePager').getByRole('button',{name:'下一页',exact:true});if(await next.isDisabled())break;await press(next);}while(evidencePages<20);
 const details=p.locator('.modal-review .detailLink');if(await details.count()){await press(details.first());await check('detail');await press(p.locator('.modal-review .archivePager').getByRole('button',{name:'下一页',exact:true}));await check('source')}
 await p.keyboard.press('Escape');await press(p.getByRole('button',{name:'本局词汇回顾',exact:true}));await check('vocab');
 const word=p.locator('.modal-vocab .lookupWord').first();if(await word.count()){await word.click();await p.getByRole('dialog',{name:'中文释义',exact:true}).waitFor();assert.deepEqual((await state()).clues,route.clues);await p.keyboard.press('Escape')}
 await p.keyboard.press('Escape');await press(p.getByRole('button',{name:'重新开始',exact:true}));await p.keyboard.press('Escape');assert.equal((await state()).node,'ending');
 await p.reload();await p.getByRole('button',{name:'继续游戏',exact:true}).click();await check('ending-refresh');assert.deepEqual(errors,[]);
 rows.push({tag:route.tag,kind:route.kind,pages,evidencePages,errors,scope:'actual normal-start save restored; all ending pages, evidence detail, vocabulary/gloss, cancel new run and ending refresh'});await p.close();
}
await browser.close();fs.writeFileSync(process.env.GAME_CHECK_RESULT_FILE,JSON.stringify(rows,null,2));console.log('All ending pages, recaps, vocabulary and ending refresh passed for '+rows.length+' native route saves');
