import {z} from 'zod';
export const titles=['私人警告早于公共通知','长椅居民短时记忆异常','认知异常后协调问题','血迹进入仍开放安置点','异常记录早于通知','多人可能处于相同异常过程不同阶段','安置点实际失控','新鲜血可能强化注意','失控后公共通知仍未更新','多个个体重复相似病程','今天的新伤太晚，暴露可能更早','可利用的声音／新鲜血注意规律'];
export const weights=[3,1,1,1,3,2,3,1,3,2,2,2];
export const StateSchema=z.object({version:z.literal(1),runId:z.string(),node:z.string().refine(n=>["home","road","phone","family","bench","bench2","outside","desk","inside","recheck","medical","uncle","routeA","house","block","divert","pressure","cover","careDone","retreat","exit","reunion","timeline","final","ending"].includes(n)),route:z.enum(['','A','B']),clues:z.array(z.number().int().min(1).max(12)),read:z.array(z.string()),history:z.array(z.string()),words:z.array(z.string()),flags:z.array(z.string()),ending:z.enum(['','A','B','C'])}).refine(s=>new Set(s.clues).size===s.clues.length&&!s.clues.includes(s.route==='A'?12:11)&&(s.route!==''||!s.clues.includes(12)),{message:'证据记录与路线不一致'});
export type State=z.infer<typeof StateSchema>;
export const initial=():State=>({version:1,runId:crypto.randomUUID(),node:'home',route:'',clues:[],read:[],history:[],words:[],flags:[],ending:''});
export function ending(clues:number[]){const unique=[...new Set(clues)];const score=unique.reduce((n,id)=>n+weights[id-1],0);return [1,5,7,9].every(id=>unique.includes(id))&&score>=19?'A':score>=13?'B':'C'}
export function acquire(s:State,id:number):State {if(s.clues.includes(id))return s;if(id===11&&s.route!=='A'||id===12&&s.route!=='B')return s;return {...s,clues:[...s.clues,id]}}
export type Action={label:string;next?:string;clue?:number;flag?:string;feedback?:string;infer?:number;route?:'A'|'B'};
export function transition(s:State,a:Action):State{if(a.route&&s.route&&a.route!==s.route)return s;let n={...s,history:[...s.history,a.label],words:[...new Set([...s.words,a.label])],flags:a.flag?[...new Set([...s.flags,a.flag])]:s.flags,node:a.next||s.node,route:a.route||s.route};if(n.route==='B'&&n.node==='block')n=addFlags(n,['CP_B01']);if(n.route==='B'&&s.node==='retreat'&&n.node==='pressure')n=addFlags(n,['B_HIDE','CP_B03']);if(n.route==='A'&&n.node==='pressure')n=addFlags(n,['CP_A03']);if(a.clue&&a.clue!==12)n=acquire(n,a.clue);if(s.route==='B'&&s.node==='careDone'&&n.node==='exit'&&s.flags.includes('B_CARE'))n=addFlags(n,['B_EXIT']);if(s.route==='B'&&s.node==='reunion'&&n.node==='final')n=completeReunion(n);const sources:Record<string,string[]>={phone:['SRC_PRIVATE_1626','SRC_NOTICE_1630'],desk:['SRC_INCIDENT_LOG'],inside:['SRC_SHELTER_STAGES'],medical:['SRC_NOTICE_CURRENT','SRC_MEDICAL_24H'],uncle:['SRC_UNCLE_SEQUENCE','SRC_WOUND_TODAY']};n.read=[...new Set([...n.read,...(sources[n.node]||[])])];if(n.node==='inside')n=acquire(n,7);if(n.node==='final'){n={...n,ending:ending(n.clues)}}return n}
export const inference:Record<number,{supports:string[];answers:string[]}>={
1:{supports:['私人消息 · 16:26','公共通知 · 16:30'],answers:['The private warning.','The public notice.']},
5:{supports:['登记记录 · 16:12—16:27','公共通知 · 16:30'],answers:['The unusual events were recorded before the public notice was issued.','The unusual events were first recorded after the public notice.','The records prove that the public notice was deliberately false.']},
6:{supports:[titles[1],titles[2],'现场不同阶段的表现'],answers:['They may be showing different stages of the same condition.','Everyone here has already reached the same stage.','The notice explains why they are behaving this way.']},
10:{supports:[titles[5],'舅舅的症状顺序'],answers:['A similar sequence is appearing in another person.','The new wound proves who caused his condition.','His symptoms are unrelated to the earlier observations.']},
11:{supports:['医疗初步提示 · 至少约24小时','今天的新伤','舅舅已出现的症状'],answers:['His exposure may have happened before today.','The fresh wound must explain his current symptoms.','The earlier visit proves who infected him.']}};
export const tasks:Record<string,{goal:string;items:string[];targets:string[];correct:[string,string];next:string}>={
block:{goal:'Keep the door closed long enough to escape.',items:['chair','rope','rose','pillow'],targets:['门内侧支撑区','门把手','旁侧地面'],correct:['chair','门内侧支撑区'],next:'divert'},
divert:{goal:'Draw its attention away from your escape route.',items:['bottle','flashlight','basket'],targets:['远离出口的落点','出口附近','近身位置'],correct:['bottle','远离出口的落点'],next:'retreat'},
pressure:{goal:'Apply pressure.',items:['dressing','bandage'],targets:['伤口','衣袖','旁侧地面'],correct:['dressing','伤口'],next:'cover'},
cover:{goal:'Cover the wound.',items:['dressing','bandage'],targets:['伤口','衣袖','旁侧地面'],correct:['bandage','伤口'],next:'careDone'}};

export function formInference(s:State,id:number,selected:string[],answer:number):State{
 const config=inference[id];if(!config||answer!==0)return s;
 if([6,10,11].includes(id)&&(selected.length!==config.supports.length||!config.supports.every(t=>selected.includes(t))))return s;
 if(id===1&&s.node!=='phone'||id===5&&(!s.clues.includes(4)||s.node!=='desk')||id===6&&(![2,3].every(n=>s.clues.includes(n))||s.node!=='inside')||id===10&&(!s.clues.includes(6)||s.node!=='uncle')||id===11&&(s.route!=='A'||s.node!=='timeline'))return s;
 return acquire(s,id);
}
export function toolResult(node:string,item:string,target:string){const t=tasks[node];if(!t||!t.targets.includes(target))return 'cancel';return item===t.correct[0]&&target===t.correct[1]?'success':'failure'}

// Route B's permanent observations/results are separate from transient errors and effects.
export const behaviorFlags=['B_SOUND','B_QUIET','B_BLOOD','B_DIVERT','B_CARE','B_EXIT','B_REUNION'];
export function addFlags(s:State,flags:string[]):State{const next=[...new Set([...s.flags,...flags])];return next.length===s.flags.length?s:{...s,flags:next}}
export function observeHouse(s:State,text:string):State{if(s.route!=='B'||s.node!=='house')return s;const flags:string[]=[];if(text.includes('物品碰落的动静'))flags.push('B_SOUND');if(text.includes('安静下来'))flags.push('B_QUIET');if(text.includes('你被划伤'))flags.push('B_BLOOD');if(text.includes('你关上'))flags.push('B_DOOR_CLOSED');return addFlags(s,flags)}
export function completeTool(s:State,item:string,target:string):State{if(toolResult(s.node,item,target)!=='success')return s;let n:State={...s,node:tasks[s.node].next,words:[...new Set([...s.words,tasks[s.node].goal,item])]};if(s.route==='B'){if(s.node==='block')n=addFlags(n,['B_BLOCK','CP_B02']);if(s.node==='divert')n=addFlags(n,['B_DIVERT']);if(s.node==='cover')n=addFlags(n,['B_CARE']);}if(s.node==='pressure')n=addFlags(n,['CARE_PRESSURE']);return n}
export function retryCheckpoint(s:State):State{return s.node==='cover'?{...s,node:'pressure',flags:s.flags.filter(f=>f!=='CARE_PRESSURE')}:s}
export function completeReunion(s:State):State{const n=addFlags(s,['B_REUNION']);return n.route==='B'&&behaviorFlags.every(f=>n.flags.includes(f))?acquire(n,12):n}
export function dangerFeedback(node:string,count:number):string{const group=node==='block'?['物品没能形成支撑，门仍在往里推。','门缝又扩大了一点。你需要重新考虑这个做法。','门已经无法继续挡住它。你没能完成这次行动。']:node==='divert'?['它没有离开你要走的方向。','它正靠近撤离路线，你需要把注意引向更远的位置。','你没能争取到离开的空隙。']:['处理没有完成，伤口仍在出血。','出血还没控制住，眼前的遮蔽只能争取短暂时间。','你没能在这次行动中完成处理。'];return group[Math.min(count,3)-1]}
