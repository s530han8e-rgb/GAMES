import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(project,'dist');
if(!fs.existsSync(path.join(dist,'index.html')))throw new Error('Build the prefixed game before preparing the site.');
const output=path.join(project,'..','site-public');
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
fs.cpSync(dist,path.join(output,'east-still-open'),{recursive:true});
fs.writeFileSync(path.join(output,'.nojekyll'),'');
fs.writeFileSync(path.join(output,'index.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=./east-still-open/"><title>东区仍在开放</title><a href="./east-still-open/">打开游戏</a></html>');
let files=0,bytes=0;
function verify(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())verify(file);else{if(/\.(docx|zip|bundle|map|ts|tsx|md|log)$/.test(entry.name))throw new Error('Unexpected source or report in published output: '+file);files++;bytes+=fs.statSync(file).size}}}
verify(output);
console.log(JSON.stringify({directory:output,files,bytes,publicPath:'/GAMES/east-still-open/',deployed:false}));
