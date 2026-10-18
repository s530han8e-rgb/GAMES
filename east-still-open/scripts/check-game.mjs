import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
export const projectRoot=path.resolve(process.env.GAME_CHECK_ROOT||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function atomic(file,text){fs.mkdirSync(path.dirname(file),{recursive:true});const temporary=file+'.'+process.pid+'.tmp';fs.writeFileSync(temporary,text);fs.renameSync(temporary,file)}
export function readJSON(file){try{return JSON.parse(fs.readFileSync(file))}catch{return null}}
export function alive(pid){try{process.kill(pid,0);return true}catch(e){return e.code==='EPERM'}}
export function lock(root,name){const dir=path.join(root,'checks',name+'.lock');try{fs.mkdirSync(dir,{recursive:false})}catch(e){if(e.code!=='EEXIST')throw e;const old=readJSON(path.join(dir,'owner.json'));if(old&&alive(old.pid))return null;if(!old&&Date.now()-fs.statSync(dir).mtimeMs<5000)return null;fs.rmSync(dir,{recursive:true,force:true});return lock(root,name)}const token=randomUUID();atomic(path.join(dir,'owner.json'),JSON.stringify({pid:process.pid,token,root,startedAt:new Date().toISOString()}));return {token,release(){if(readJSON(path.join(dir,'owner.json'))?.token===token)fs.rmSync(dir,{recursive:true,force:true})}}}
const labels={running:'检查中',passed:'检查通过',failed:'检查发现问题',cancelled:'检查已取消'};
export function publish(root,result){
 const watch=readJSON(path.join(root,'checks/watch.json'));const watchLabel=watch?.active&&alive(watch.pid)?'源码监控运行中':'源码监控未运行';
 const rows=(result.steps||[]).map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(labels[s.status]||s.status)}</td><td><a href="${esc(s.log)}">日志</a>${s.result?` · <a href="${esc(s.result)}">详细结果</a>`:''}</td></tr>`).join('');
 const failures=result.failure?`<section><h2>本次问题</h2><p>失败检查：${esc(result.failedStage)}；位置：${esc(result.failedNode||'未自动定位，请看日志')}</p><pre>${esc(result.failure)}</pre></section>`:'';
 atomic(path.join(root,'checks/latest.json'),JSON.stringify(result,null,2)+'\n');
 atomic(path.join(root,'checks/latest.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="5"><title>游戏本地检查结果</title><style>body{background:#252d32;color:#eee5d3;font:16px system-ui;max-width:1040px;margin:30px auto;padding:0 20px}h1,h2{font-family:serif}section{background:#eee5d3;color:#252d32;padding:18px;margin:20px 0}a{color:inherit}table{width:100%;border-collapse:collapse}td,th{text-align:left;border-bottom:1px solid #a39880;padding:12px 8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}.muted{color:#c4bcae}li{margin:8px 0}</style><h1>《东区仍在开放》本地自动检查</h1><p>${esc(watchLabel)} · ${esc(result.mode==='full'?'每组场景／交付检查':'保存后的快速检查')}</p><p><a href="latest-full.html">最近一次完整场景检查</a></p><h2>${esc(labels[result.status]||result.status)}</h2><p>开始：${esc(new Date(result.startedAt).toLocaleString('zh-CN',{timeZone:'America/New_York'}))}（纽约时间）${result.finishedAt?' · 已结束':''}</p><p>触发：${esc(result.trigger||'手动')}；改动文件：${esc(result.changedFiles?.join('、')||'无指定文件')}</p><section><table><thead><tr><th>检查内容</th><th>结果</th><th>证据</th></tr></thead><tbody>${rows}</tbody></table></section>${failures}${watch?.pending?.length?'<p>检测到新的保存，正在排队；上次结果不代表新保存已检查。</p>':''}<p class="muted">快速检查覆盖类型与18项规则，不检查画面。完整检查从正常起点跑两路线、三个结局、遗漏、错误重试与刷新，并检查界面和发布隔离。截图仍需人工查看；通过不等于美术、动画、文化、真人时长或正式验收完成。</p><p class="muted">仅本地运行，不上传、不修改剧情或游戏源码。监控退出后需重新启动。正式玩家游戏没有本检查页面。</p></html>`);
}
function stopChild(child){if(child.exitCode!==null||child.signalCode!==null)return;try{if(process.platform!=='win32')process.kill(-child.pid,'SIGTERM');else child.kill('SIGTERM')}catch{}}
async function command(root,args,log,signal,onOutput){
 fs.mkdirSync(path.dirname(log),{recursive:true});const stream=fs.createWriteStream(log);let text='';
 const executable=args[0]==='node'?process.execPath:args[0];
 return await new Promise(resolve=>{const child=spawn(executable,args.slice(1),{cwd:root,env:process.env,stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});let done=false;const timeout=setTimeout(()=>stopChild(child),15*60*1000);const abort=()=>stopChild(child);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  const write=chunk=>{stream.write(chunk);text=(text+chunk.toString()).slice(-48000);onOutput?.(chunk.toString())};child.stdout.on('data',write);child.stderr.on('data',write);
  const finish=(code,error='')=>{if(done)return;done=true;clearTimeout(timeout);signal?.removeEventListener('abort',abort);if(error)write(error+'\n');stream.end(()=>resolve({code,text,cancelled:!!signal?.aborted}))};child.on('error',e=>finish(1,e.message));child.on('close',code=>finish(code??1));
 });
}
async function ensureServer(root,port,preview,runDir,owned,signal){
 const url=`http://127.0.0.1:${port}/`;
 try{const r=await fetch(url,{signal:AbortSignal.timeout(1200)});const body=await r.text();if(r.ok&&body.includes('<title>东区仍在开放</title>'))return {url,reused:true};throw new Error(`端口${port}已有其他内容，不接管该服务。`)}catch(e){if(e.message.includes('已有其他内容'))throw e}
 const log=fs.createWriteStream(path.join(runDir,`server-${port}.log`));const args=[path.join(root,'node_modules/vite/bin/vite.js'),...(preview?['preview']:[]),'--host','127.0.0.1','--port',String(port),'--strictPort'];const child=spawn(process.execPath,args,{cwd:root,stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});owned.push({child,log});child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});child.on('error',e=>log.write(e.message));
 for(let i=0;i<100;i++){if(signal?.aborted)throw new Error('检查已取消');if(child.exitCode!==null)throw new Error(`端口${port}服务启动失败，查看server-${port}.log`);await new Promise(r=>setTimeout(r,100));try{const r=await fetch(url,{signal:AbortSignal.timeout(500)});if(r.ok&&(await r.text()).includes('<title>东区仍在开放</title>'))return {url,reused:false}}catch{}}
 throw new Error(`本地服务${port}未就绪。`);
}
export async function runChecks({root=projectRoot,mode='quick',trigger='手动',changedFiles=[],signal}={}){
 fs.mkdirSync(path.join(root,'checks'),{recursive:true});const guard=lock(root,'run');if(!guard)return {busy:true};
 const runId=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8),runDir=path.join(root,'checks/runs',runId);fs.mkdirSync(runDir,{recursive:true});const result={runId,mode,trigger,changedFiles,startedAt:new Date().toISOString(),status:'running',steps:[],servers:[]};const owned=[];
 const step=async(name,args,extra={})=>{const n=result.steps.length+1,s={name,status:'running',log:`runs/${runId}/${n}.log`,...extra};result.steps.push(s);publish(root,result);console.log('正在检查：'+name);const envBefore={};for(const[k,v]of Object.entries(extra.env||{})){envBefore[k]=process.env[k];process.env[k]=v}let r;try{r=await command(root,args,path.join(root,'checks',s.log),signal,line=>process.stdout.write(line))}finally{for(const[k,v]of Object.entries(envBefore)){if(v===undefined)delete process.env[k];else process.env[k]=v}}delete s.env;s.status=r.cancelled?'cancelled':r.code===0?'passed':'failed';s.finishedAt=new Date().toISOString();s.exitCode=r.code;if(r.code!==0||r.cancelled){result.failedStage=name;result.failure=r.text.slice(-12000);result.failedNode=r.text.match(/"node"\s*:\s*"([^"]+)"/)?.[1]||r.text.match(/(src\/[^\s(]+\([0-9]+,[0-9]+\))/)?.[1];throw new Error(r.cancelled?'cancelled':'failed')}publish(root,result)};
 try{
  if(mode==='quick'){await step('源码类型检查',['npm','run','check:types']);await step('剧情、证据、推论与保存规则',['npm','test'])}
  else{
   await step('类型检查与正式构建',['npm','run','build']);await step('剧情、证据、推论与保存规则',['npm','test']);
   result.servers.push(await ensureServer(root,5174,false,runDir,owned,signal));result.servers.push(await ensureServer(root,4175,true,runDir,owned,signal));
   const suite=async(name,file,key,input)=>{const artifact=path.join(runDir,key);fs.mkdirSync(artifact,{recursive:true});await step(name,['node',file],{result:`runs/${runId}/${key}/results.json`,env:{GAME_CHECK_URL:'http://127.0.0.1:5174/',GAME_CHECK_ARTIFACT_DIR:path.join(artifact,'screenshots'),GAME_CHECK_RESULT_FILE:path.join(artifact,'results.json'),...(input?{GAME_CHECK_ROUTE_RESULT:input}:{})}})};
   await suite('正常起点两路线、三个结局、错误重试及刷新','tests/objects-routes.mjs','routes');
   await suite('遗漏08仍按条件记录12','tests/objects-no08.mjs','no08');
   await suite('查词、遗漏及替代行动、图片故障恢复','tests/objects-extra.mjs','extra');
   await suite('证据12缺前置反例（独立于路线可达）','tests/objects-evidence12.mjs','evidence12',path.join(runDir,'routes/results.json'));
   await suite('两桌面及窄窗代表页面的默认／放大排版','tests/objects-surfaces.mjs','surfaces');
   await suite('审核手机／医疗消息同屏','tests/objects-phone-review.mjs','phone');
   await step('正式构建不含审核入口或外部请求',['node','tests/production-review.mjs']);
  }
  result.status='passed';
 }catch(e){result.status=signal?.aborted||e.message==='cancelled'?'cancelled':'failed';if(!result.failure){result.failedStage||='本地服务或检查启动';result.failure=e.stack||e.message}}
 finally{for(const {child,log}of owned){stopChild(child);log.end()}result.finishedAt=new Date().toISOString();publish(root,result);atomic(path.join(runDir,'summary.json'),JSON.stringify(result,null,2));if(mode==='full'){atomic(path.join(root,'checks/latest-full.json'),JSON.stringify(result,null,2));atomic(path.join(root,'checks/latest-full.html'),fs.readFileSync(path.join(root,'checks/latest.html'),'utf8').replace('<meta http-equiv="refresh" content="5">',''))}guard.release()}
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const controller=new AbortController();for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>controller.abort());const r=await runChecks({mode:process.argv.includes('--full')?'full':'quick',signal:controller.signal});console.log(r.busy?'已有检查运行，本次不重复启动。':`检查结果：${labels[r.status]}；checks/latest.html`);process.exitCode=r.busy?2:r.status==='passed'?0:1;
}
