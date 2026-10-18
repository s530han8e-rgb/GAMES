import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readingPages,storyBeats} from '../src/data/art';
import {scenes} from '../src/data/content';
test('road pagination keeps words, punctuation and every authored character',()=>{
 const pages=storyBeats(scenes.road.text).filter(p=>p.line===0).map(p=>p.text);
 assert.equal(pages.join(''),scenes.road.text[0]);
 assert.ok(pages.some(p=>p.includes('一辆自行车')));
 assert.ok(pages.every(p=>/[。！？；，]$/.test(p)));
 const attack=storyBeats(scenes.road.text).filter(p=>p.line===3).map(p=>p.text);
 assert.equal(attack.join(''),scenes.road.text[3]);
 assert.ok(attack.some(p=>p.includes('形成新的划伤')));
});
test('dialogue keeps speaker and whole short utterances instead of fixed character cuts',()=>{
 const line='舅舅：“你怎么跑这儿来了？我不是让你别往东走吗？”';
 assert.deepEqual(storyBeats([line]),[{text:line,line:0}]);
 const text='这是没有标点但必须完整保留的很长中文表达'.repeat(5);
 assert.deepEqual(readingPages(text),[text]);
});

test('brief narrative lead-in stays on the same page as the following speech',()=>{
 const text='片刻后，老人：“你什么时候来的？”';
 assert.deepEqual(storyBeats([text]),[{text:'老人：“你什么时候来的？”',line:0,leadIn:'片刻后，'}]);
});

test('cousin does not refer to the protagonist mother as his own mum',()=>{
 assert.ok(scenes.final.text.some(t=>t.includes('你妈妈和外婆她们不愿意再等')));
 assert.ok(scenes.final.text.every(t=>!t.includes('妈他们不愿意再等')));
});
