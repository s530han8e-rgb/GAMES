import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const version=JSON.parse(fs.readFileSync(path.join(root,'demo-version.json'))).version;
const out=path.join(root,'checks',`demo-${version}`);
fs.mkdirSync(out,{recursive:true});
const url=process.env.GAME_CHECK_URL||'http://127.0.0.1:4176/';
const status=await fetch(url+'_demo/status.json').then(r=>r.json());
if(status.app!=='east-still-open-demo'||status.version!==version)throw Error('验收入口不是当前版本的独立试玩包');
const result={version,started:new Date().toISOString(),url,server:status,stages:[],releaseApproved:false};
const jobs=[
 ['normal','tests/objects-routes.mjs',{}],
 ['skip','tests/objects-routes.mjs',{GAME_SCENARIOS:'B-best,A-fragment',GAME_MOTION_MODE:'skip'}],
 ['reduce','tests/objects-routes.mjs',{GAME_SCENARIOS:'B-best,A-fragment',GAME_MOTION_MODE:'reduce'}],
 ['interrupt','tests/objects-routes.mjs',{GAME_SCENARIOS:'B-best',GAME_MOTION_MODE:'interrupt'}],
 ['narrow-large','tests/objects-routes.mjs',{GAME_SCENARIOS:'A-best,B-best',GAME_CHECK_SIZES:'900x700',GAME_LARGE_TEXT:'true'}],
 ['desktop-large','tests/objects-routes.mjs',{GAME_SCENARIOS:'A-best,B-best',GAME_LARGE_TEXT:'true'}],
 ['extra','tests/objects-extra.mjs',{}],
 ['no08','tests/objects-no08.mjs',{}],
 ['production','tests/production-review.mjs',{}],
 ['controls','tests/demo-controls.mjs',{}],
 ['skill-client','tests/web-game-client.mjs',{},['--url',url,'--click-selector','.titleActions button:first-child','--actions-json',JSON.stringify({steps:[{buttons:['space'],frames:1},{buttons:[],frames:12}]}),'--iterations','2','--pause-ms','180','--screenshot-dir',path.join(out,'skill-client')]],
 ['rules',null,{},['--import','tsx','--test',...fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('.test.ts')).map(n=>'tests/'+n)]],
 ['types','node_modules/typescript/bin/tsc',{},['--noEmit','--pretty','false']]
];
async function run([name,script,extra,args=[]]){
 const log=fs.createWriteStream(path.join(out,name+'.log'));
 const started=new Date().toISOString();
 const code=await new Promise(resolve=>{
  const child=spawn(process.execPath,[...(script?[script]:[]),...args],{cwd:root,env:{...process.env,GAME_CHECK_URL:url,GAME_CHECK_ARTIFACT_DIR:path.join(out,name),GAME_CHECK_RESULT_FILE:path.join(out,name+'.json'),...extra},stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  child.on('error',e=>{log.write(e.message);resolve(1)});child.on('close',code=>resolve(code??1));
 });
 await new Promise(resolve=>log.end(resolve));
 result.stages.push({name,code,started,finished:new Date().toISOString(),log:name+'.log'});
 fs.writeFileSync(path.join(out,'acceptance.json'),JSON.stringify(result,null,2));
 console.log(name,code===0?'通过':'失败，查看独立日志');
}
let index=0;
await Promise.all(Array.from({length:3},async()=>{while(index<jobs.length)await run(jobs[index++])}));
if(result.stages.find(s=>s.name==='normal')?.code===0)await run(['evidence12','tests/objects-evidence12.mjs',{GAME_CHECK_ROUTE_RESULT:path.join(out,'normal.json')}]);
if(result.stages.find(s=>s.name==='normal')?.code===0)await run(['endings','tests/demo-ending-recovery.mjs',{GAME_CHECK_ROUTE_RESULT:path.join(out,'normal.json')}]);
result.finished=new Date().toISOString();result.passed=result.stages.every(s=>s.code===0);
fs.writeFileSync(path.join(out,'acceptance.json'),JSON.stringify(result,null,2));
process.exitCode=result.passed?0:1;
