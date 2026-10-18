import{chromium}from'playwright';import assert from'node:assert/strict';import fs from'node:fs';
const report=JSON.parse(fs.readFileSync('tests/formal-layout-final-results.json'))[0];const b=await chromium.launch({channel:'chrome',headless:true});const rows=[];
for(const missing of ['B_SOUND','B_QUIET','B_BLOOD','B_DIVERT','B_CARE','B_EXIT',null]){
 const c=await b.newContext({viewport:{width:1366,height:768}});const p=await c.newPage();await p.goto('http://127.0.0.1:5174/');
 // A reconstructed checkpoint from this package's normal-start B run. These
 // controlled missing-condition cases are separate from route reachability.
 await p.evaluate(async({report,missing})=>{const {initial}=await import('/src/game/engine.ts');const {save}=await import('/src/game/save.ts');await save({...initial(),node:'reunion',route:'B',clues:report.clues.filter(n=>n!==12&&n!==8),flags:report.flags.filter(f=>f!=='B_REUNION'&&f!==missing)});},{report,missing});
 await p.reload();await p.getByRole('button',{name:'继续游戏',exact:true}).click();
 for(let n=0;n<12;n++){const s=await p.evaluate(()=>JSON.parse(window.render_game_to_text()));if(s.node==='final'){assert.equal(s.clues.includes(12),!missing);rows.push({missing,clue12:s.clues.includes(12),flags:s.flags});break}assert.ok(!s.clues.includes(12));const next=p.locator('.dialogue').getByRole('button',{name:'继续',exact:true});if(await next.count())await next.click();else{await p.getByRole('button',{name:'Continue',exact:true}).focus();await p.keyboard.press('Enter')}}await c.close();
}assert.equal(rows.length,7);await b.close();fs.writeFileSync('tests/formal-evidence12-results.json',JSON.stringify({scope:'controlled checkpoint omissions, separate from normal-start route proof',rows},null,2));console.log('6 missing prerequisites blocked; complete condition without clue08 granted once, only after reunion');
