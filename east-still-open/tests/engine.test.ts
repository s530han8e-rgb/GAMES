import{test}from'node:test';import{strict as assert}from'node:assert';import{initial,ending,acquire,transition}from'../src/game/engine';
test('ending boundaries and core gate',()=>{for(const[c,e]of [[[1,2,3,4,5,6,7,9,10],'A'],[[1,2,3,4,5,6,7,8,9],'B'],[[2,3,4,5,6,7,8,9,10,11],'B'],[[1,2,3,6,7,9],'B'],[[2,3,4,5,6,7,8],'C']] as [number[],string][])assert.equal(ending(c),e)});
test('acquisition idempotent and routes exclusive',()=>{let s=initial();s=acquire(s,1);s=acquire(s,1);assert.deepEqual(s.clues,[1]);assert.deepEqual(acquire(s,11).clues,[1]);s.route='A';assert.deepEqual(acquire(s,12).clues,[1])});
test('narrative collapse grants only mandatory fact',()=>{const s=transition(initial(),{label:'Enter',next:'inside'});assert.deepEqual(s.clues,[7])});
import{formInference,toolResult,inference}from'../src/game/engine';
test('inference cannot bypass prerequisites and wrong support',()=>{let s=initial();s.node='inside';assert.equal(formInference(s,6,inference[6].supports,0),s);s.clues=[2,3,7];assert.equal(formInference(s,6,['unrelated'],0),s);assert.equal(formInference(s,6,inference[6].supports,1),s);assert.equal(formInference(s,6,[...inference[6].supports].reverse(),0).clues.includes(6),true)});
test('tool spatial and semantic distinctions',()=>{assert.equal(toolResult('block','chair','门内侧支撑区'),'success');assert.equal(toolResult('block','chair','门把手'),'failure');assert.equal(toolResult('block','chair','outside'),'cancel');assert.equal(toolResult('divert','bottle','远离出口的落点'),'success');assert.equal(toolResult('divert','bottle','出口附近'),'failure')});
test('route lock and source reading do not grant comparison clue',()=>{let s=initial();s.route='A';assert.equal(transition(s,{label:'B',route:'B',next:'house'}),s);s=transition(initial(),{label:'Continue',next:'phone'});assert.equal(s.read.length,2);assert.equal(s.clues.length,0)});

import {StateSchema} from '../src/game/engine';
test('invalid saves reject unknown scenes, duplicates and conflicting routes',()=>{const s=initial();assert.ok(StateSchema.safeParse(s).success);assert.ok(!StateSchema.safeParse({...s,node:'missing'}).success);assert.ok(!StateSchema.safeParse({...s,clues:[1,1]}).success);assert.ok(!StateSchema.safeParse({...s,route:'A',clues:[12]}).success);assert.ok(StateSchema.safeParse({...s,route:'B',clues:[12]}).success)});

import {factMessages} from '../src/data/content';
test('final authored messages contain dialogue without production annotations',()=>{const all=factMessages([1,2,3,4,5,6,7,8,9,10,11,12]);assert.equal(all.length,12);assert.ok(all.every(t=>! /主线必得|不虚构|条件\d/.test(t)));assert.match(all[0],/找到舅舅了/)});
