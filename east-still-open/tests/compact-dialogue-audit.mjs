import{chromium}from'playwright';import assert from'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});let count=0;const errors=[];
for(const [width,height] of [[713,752],[1366,768],[1920,1080],[600,650]])for(const large of [false,true]){
 const p=await b.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5174/review/?page=art-scenes');await p.getByLabel('放大文字',{exact:true}).setChecked(large);await p.evaluate(()=>document.fonts.ready);
 for(const node of ['home','family','road','bench','bench2','outside','desk','inside','recheck','medical','uncle','routeA','timeline','house','retreat','careDone','exit','reunion','phone','block','divert','pressure','cover']){
  await p.getByLabel('美术场景').selectOption(node);
  if(await p.locator('.modal-phone .close').count())await p.locator('.modal-phone .close').click();
  for(let i=0;i<40;i++){
   await p.waitForTimeout(20);
   const geometry=await p.locator('.sceneFrame').evaluate(f=>({frame:f.getBoundingClientRect().height,paper:f.querySelector('.dialogue').getBoundingClientRect().height,choices:!!f.querySelector('.englishOption')}));assert.ok(geometry.paper/geometry.frame<=.27,JSON.stringify({node,width,height,large,i,...geometry}));
   const data=await p.locator('.dialogue').evaluate(d=>{const paper=d.getBoundingClientRect();return[...d.querySelectorAll('p,h3')].map(x=>{const range=document.createRange();range.selectNodeContents(x);const r=range.getBoundingClientRect();return{text:x.textContent,visible:r.width>0&&r.height>0,inside:r.top>=paper.top+3&&r.bottom<=paper.bottom-3&&r.left>=paper.left&&r.right<=paper.right+1,rect:r.toJSON(),paper:paper.toJSON()}})});
   for(const text of data)if(text.visible)assert.ok(text.inside,JSON.stringify({node,width,height,large,i,...text}));count++;
   if(width===713&&!large&&['road','home'].includes(node))await p.screenshot({path:`tests/screenshots/paper-${node}-${i}.png`});
   const next=p.locator('.dialogue .actions').getByRole('button',{name:'继续',exact:true});if(!await next.count())break;await next.click();
  }
 }
 await p.goto('http://127.0.0.1:5174/review/?page=communication');await p.locator('.communicationControls .archivePager').getByRole('button',{name:'下一页',exact:true}).click();assert.ok((await p.locator('.communicationBubble').innerText()).includes('你妈妈和外婆她们'));await p.close();
}
await b.close();assert.deepEqual(errors,[]);console.log(count,'narrative pages: painted text inside paper, default and large, 4 viewports; cousin relationship text checked');
