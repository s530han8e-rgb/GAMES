import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {browserLaunchSpec} from './browser-launch.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist=path.join(root,'dist');
const version=JSON.parse(fs.readFileSync(path.join(root,'demo-version.json'),'utf8')).version;
const identity={app:'east-still-open-demo',version,root};
const noOpen=process.argv.includes('--no-open');
let available=false;
const firstPort=Number(process.env.DEMO_PORT||4176);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
if(!fs.existsSync(path.join(dist,'index.html')))throw Error('缺少完整构建，请重新解压试玩包。');
const open=url=>{
 if(noOpen)return;
 const spec=browserLaunchSpec(process.platform,url,process.env.SystemRoot);
 if(spec)spawn(spec.command,spec.args,spec.options).on('error',()=>console.log(`浏览器未能自动打开，请打开：${url}`));
};
for(let port=firstPort;port<firstPort+11;port++){
 const url=`http://127.0.0.1:${port}/`;
 try{
  const previous=await fetch(url+'_demo/status.json',{signal:AbortSignal.timeout(300)}).then(r=>r.json());
  if(previous.app===identity.app&&previous.version===version&&previous.root===root){available=true;console.log(`试玩已启动：${url}\n版本：${version}`);open(url);break;}
 }catch{}
 const server=http.createServer((request,response)=>{
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);response.end();return;}
  let pathname;
  try{pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);}catch{response.writeHead(400);response.end();return;}
  if(pathname==='/_demo/status.json'){response.writeHead(200,{'Content-Type':mime['.json']});response.end(JSON.stringify(identity));return;}
  const candidate=path.resolve(dist,'.'+pathname);
  if(candidate!==dist&&!candidate.startsWith(dist+path.sep)){response.writeHead(403);response.end();return;}
  let file=candidate;
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){
   if(path.extname(pathname)){response.writeHead(404);response.end('File not found');return;}
   file=path.join(dist,'index.html');
  }
  response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
  if(request.method==='HEAD')response.end();else fs.createReadStream(file).on('error',()=>response.destroy()).pipe(response);
 });
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});}
 catch(e){if(e.code==='EADDRINUSE')continue;throw e;}
 console.log(`《东区仍在开放》试玩：${url}\n版本：${version}\n请保持此窗口打开。结束试玩时关闭此窗口。`);
 available=true;
 open(url);
 const stop=()=>server.close(()=>process.exit(0));
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
 break;
}
if(!available)throw Error('本地启动端口均被占用，请关闭以前的试玩启动窗口后重试。');
