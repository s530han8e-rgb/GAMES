import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const b=await chromium.launch({channel:'chrome',headless:true});const seen=new Set(),rows=[];const dir='tests/screenshots/formal-2026-10-12';fs.mkdirSync(dir,{recursive:true});
for(const [width,height] of [[1366,768],[1920,1080]]){
 const p=await b.newPage({viewport:{width,height}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5174/review/?page=art-scenes');
 for(const node of ['home','family','phone','road','bench','bench2','outside','desk','inside','uncle','routeA','house','block','divert','retreat','pressure','cover','careDone','exit','reunion']){
  await p.getByLabel('美术场景').selectOption(node);if(await p.locator('.modal-phone .close').count()){await p.locator('.modal-phone .close').focus();await p.keyboard.press('Enter')}
  for(let i=0;i<45;i++){
   await p.waitForFunction(()=>[...document.querySelectorAll('.sceneBackground,.registeredLayer,.speakerPortrait img')].every(x=>x.complete&&x.naturalWidth>0));
   await p.waitForTimeout(60);const data=await p.evaluate(()=>({imgs:[...document.querySelectorAll('img')].map(x=>({src:decodeURI(x.src),width:x.getBoundingClientRect().width,resource:x.dataset.resource})),text:document.querySelector('.dialogue')?.innerText,portraits:[...document.querySelectorAll('.speakerPortrait')].map(x=>({character:x.dataset.character,asset:x.dataset.portrait,delta:document.querySelector('.dialogue').getBoundingClientRect().top-x.getBoundingClientRect().bottom})),noPlaceholder:!document.querySelector('.worldArtGap,.placeholderMark'),scroll:document.documentElement.scrollHeight>innerHeight+2}));assert.ok(data.noPlaceholder);assert.equal(data.scroll,false);assert.ok(data.portraits.length<=1);for(const img of data.imgs){assert.ok(img.src.includes('/art/formal/'),img.src);assert.ok(img.width>0);seen.add(img.src)}for(const portrait of data.portraits)assert.ok(Math.abs(portrait.delta)<=3,JSON.stringify({node,i,portrait}));
   const type=await p.locator('.sceneLayers').count()?await p.locator('.sceneLayers').getAttribute('data-composition'):null;const key=`${width}-${node}-${type||''}-${data.portraits[0]?.asset||''}`;
   if(!rows.some(r=>r.key===key)){await p.screenshot({path:`${dir}/visual-${width}-${node}-${i}.png`});rows.push({key,node,page:i,...data})}
   const next=p.locator('.dialogue .actions').getByRole('button',{name:'继续',exact:true});if(!await next.count())break;await next.click();
  }
 }
 // Each formal file is browser decoded; this is a resource check, not game-usage approval.
 const manifest=JSON.parse(fs.readFileSync('src/data/formal-art.json','utf8'));
 const decoded=await p.evaluate(async assets=>{const output=[];for(const a of assets){const img=new Image();img.src='/art/formal/'+a.relativePath;try{await img.decode();output.push({id:a.assetId,ok:true})}catch{output.push({id:a.assetId,ok:false})}}return output},manifest.assets);for(const r of decoded)assert.ok(r.ok,r.id);assert.deepEqual(errors,[]);await p.close();
}
await b.close();fs.writeFileSync('tests/formal-visual-results.json',JSON.stringify({rows,seen:[...seen]},null,2));console.log(rows.length,'distinct screenshot states, two desktops; 81 assets decoded at each size');
