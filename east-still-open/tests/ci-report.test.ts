import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {generateCIReport} from '../scripts/ci-report.mjs';

test('CI report exposes failed stage and preserves failure when the check step failed',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'game-ci-failure-'));
 try{fs.mkdirSync(path.join(root,'checks'));fs.writeFileSync(path.join(root,'checks/latest.json'),JSON.stringify({status:'failed',failedStage:'证据12',failedNode:'reunion',failure:'Assertion failed',steps:[{name:'证据12',status:'failed'}]}));const r=generateCIReport({root,outcome:'failure',summaryPath:null});assert.equal(r.status,'failed');assert.match(r.markdown,/证据12/);assert.match(r.markdown,/reunion/);assert.match(r.markdown,/Assertion failed/);assert.ok(fs.existsSync(path.join(root,'checks/ci-report/index.html')))}finally{fs.rmSync(root,{recursive:true,force:true})}
});

test('missing checks never become passed and oversized attachments are excluded',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'game-ci-missing-'));
 try{fs.mkdirSync(path.join(root,'checks'));fs.writeFileSync(path.join(root,'checks/huge.png'),Buffer.alloc(9*1024*1024));const r=generateCIReport({root,summaryPath:null});assert.equal(r.status,'not_run');assert.ok(r.bytes<=8*1024*1024);assert.ok(r.omitted.includes('huge.png'));assert.match(r.markdown,/不能视为通过/)}finally{fs.rmSync(root,{recursive:true,force:true})}
});
