import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const defaultRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const escape=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cell=text=>String(text??'—').replaceAll('|','\\|').replaceAll('\n',' ');
const read=file=>{try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return null}};

export function generateCIReport({root=defaultRoot,outcome=process.env.GAME_CHECK_STEP_OUTCOME,summaryPath=process.env.GITHUB_STEP_SUMMARY,limit=8*1024*1024}={}){
  const checks=path.join(root,'checks'),result=read(path.join(checks,'latest.json'));
  let status=result?.status||'not_run';
  if(['failure','cancelled','skipped'].includes(outcome))status=outcome==='failure'?'failed':outcome;
  if(status==='running')status='incomplete';
  const labels={passed:'通过',failed:'失败',cancelled:'已取消',skipped:'未运行',not_run:'未开始',incomplete:'未完成'};
  const lines=['# 《东区仍在开放》自动检查',`结果：**${labels[status]||status}**`,
    `提交：\`${process.env.GITHUB_SHA||'本地验证'}\``,
    '范围：规则、正常起点路线与结局、工具错误与重试、刷新、界面、动画操作和发布隔离。',
    '', '| 检查 | 结果 |', '| --- | --- |',
    ...(result?.steps||[]).map(s=>`| ${cell(s.name)} | ${cell(labels[s.status]||s.status)} |`)];
  if(!result)lines.push('','检查尚未产出结果。请查看依赖安装、浏览器安装及检查步骤日志；不能视为通过。');
  if(result?.failedStage||result?.failure)lines.push('','## 问题',`失败阶段：${cell(result.failedStage)}`,`定位：${cell(result.failedNode||'查看对应日志中的脚本、行号和断言')}`,'','```text',String(result.failure||'').slice(-12000).replaceAll('```','~~~'),'```');
  lines.push('','完整步骤日志在本次 Actions 运行中；附件含限量报告与代表截图，保留 1 天，总量最多 8 MiB。未收录图片会在附件索引登记。',
    '自动通过不代表人工视觉、文化、真人时长、行动主导感或 Windows 实机审核通过；不采集真人数据，也不自动部署网站。');
  const markdown=lines.join('\n')+'\n';
  fs.mkdirSync(checks,{recursive:true});
  const output=path.join(checks,'ci-report');fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output);
  let bytes=0;const included=[],omitted=[];
  const save=(rel,data)=>{if(bytes+data.length>limit){omitted.push(rel);return false}const file=path.join(output,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);bytes+=data.length;included.push(rel);return true};
  save('summary.md',Buffer.from(markdown));
  const candidates=[];
  function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(file===output||entry.name.endsWith('.lock')||entry.isSymbolicLink())continue;if(entry.isDirectory())scan(file);else if(entry.isFile()&&/\.(json|log|html|png)$/.test(entry.name))candidates.push({file,rel:path.relative(checks,file),stat:fs.statSync(file)})}}
  scan(checks);
  const documents=candidates.filter(x=>!x.rel.endsWith('.png')).sort((a,b)=>b.stat.mtimeMs-a.stat.mtimeMs);
  for(const item of documents){let data=fs.readFileSync(item.file);if(item.rel.endsWith('.log')&&data.length>80000)data=Buffer.concat([Buffer.from('[Earlier log output omitted; full log is in Actions.]\n'),data.subarray(-80000)]);if(data.length>2*1024*1024||bytes+data.length>3*1024*1024){omitted.push(item.rel);continue}save(item.rel,data)}
  const images=candidates.filter(x=>x.rel.endsWith('.png')).sort((a,b)=>b.stat.mtimeMs-a.stat.mtimeMs);
  for(const item of images){if(included.filter(x=>x.endsWith('.png')).length>=6||bytes+item.stat.size>limit-256*1024){omitted.push(item.rel);continue}save(item.rel,fs.readFileSync(item.file))}
  const index={status,limit,bytes,files:included,omitted};
  const listing=JSON.stringify(index,null,2);save('attachment-index.json',Buffer.from(listing));
  save('index.html',Buffer.from(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>游戏自动检查报告</title><style>body{max-width:960px;margin:30px auto;padding:0 20px;font:16px system-ui;background:#eee5d3;color:#252d32}pre{white-space:pre-wrap;overflow-wrap:anywhere}li{margin:8px 0}a{color:#843b35}</style><h1>自动检查：${escape(labels[status]||status)}</h1><pre>${escape(markdown)}</pre><h2>附件</h2><ul>${included.map(f=>`<li><a href="${f.split(path.sep).map(encodeURIComponent).join('/')}">${escape(f)}</a></li>`).join('')}</ul><p>另有 ${omitted.length} 件原始输出未纳入限量附件。</p></html>`));
  if(summaryPath)fs.appendFileSync(summaryPath,markdown);
  console.log(`CI report: ${status}; ${bytes} bytes; ${omitted.length} outputs omitted from bounded attachment.`);
  return {status,bytes,files:included,omitted,markdown};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))generateCIReport();
