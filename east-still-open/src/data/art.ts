import manifest from './formal-art.json';
import aliases from './art-aliases.json';
import type {State} from '../game/engine';
export const formalAssets=manifest.assets;
export const artAsset=(id:string)=>{const logical=(aliases as Record<string,string>)[id]||id;const a=manifest.assets.find(a=>a.assetId===logical||a.relativePath===id);return a?{...a,id:a.assetId,url:'/art/formal/'+a.relativePath}:undefined};
export const formalUrl=(file:string)=>{const a=manifest.assets.find(a=>a.relativePath===file);if(!a)throw new Error('Resource outside formal whitelist: '+file);return '/art/formal/'+a.relativePath};
const backgrounds:Record<string,string>={BG_HOME:'BG_HOME_AFTER_HANDOFF',BG_ROAD:'BG_ROAD_ANOMALY',BG_BENCH:'BG_BENCH_EMPTY',BG_SHED:'BG_SHED_EMPTY',BG_SHELTER_OUT:'BG_SHELTER_OUT',BG_SHELTER_IN:'BG_SHELTER_IN_BASE',BG_DESK:'BG_DESK_EMPTY'};
export function roadArtPhase(line:number,text:string){return line<1?'road':line<3||/包扎|手指/.test(text)?'reception':/棚屋|后续去向|发出警告/.test(text)?'shed':'conflict'}
export function backgroundArt(asset:string,node:string,route:string,line:number,state?:State,reaction=false,lastReaction=false,dialogueSpeaker='',currentText=''){
 // After handoff the tote is physically absent, including phone/family narration.
 const carriedAway=state?.history.includes('Offer to carry the bag to the door.');
 if(['phone','family'].includes(node)||(node==='road'&&reaction&&dialogueSpeaker&&carriedAway))return artAsset('BG_HOME_DIALOGUE_AFTER_HANDOFF');
 if(dialogueSpeaker&&(node==='home'||node==='road'&&reaction))return artAsset('BG_HOME_DIALOGUE_EMPTY');
 if(node==='recheck'&&reaction&&state?.history.at(-1)==='Watch where the uncontrolled person turns.')return artAsset('BG_SHELTER_IN_BASE');
 if(node==='home')return artAsset('BG_HOME_INHABITED');
 if(node==='road'&&reaction){
  if(lastReaction)return artAsset('SCENE_HOME_UNCLE_DEPART');
  const choice=state?.history.find(h=>['Offer to carry the bag to the door.','Check whether the bag is securely closed.','Hold the door open for your uncle.'].includes(h));
  return artAsset(choice?.startsWith('Offer')?'SCENE_HOME_CARRY_BAG':choice?.startsWith('Hold')?'SCENE_HOME_HOLD_DOOR':'BG_HOME_INHABITED');
 }
 if(node==='outside'&&reaction&&state?.history.includes('Help him stand up slowly.'))return artAsset(lastReaction?'BG_BENCH_EMPTY':'SCENE_BENCH_RISE');
 if(node==='road'&&line>0){const phase=roadArtPhase(line,currentText);return artAsset(phase==='reception'?'BG_OLDHOUSE_RECEPTION':phase==='shed'?'BG_SHED_EMPTY':'BG_OLDHOUSE_STRUCTURE')}
 if(['pressure','cover','careDone'].includes(node)&&route==='A')return artAsset('BG_SHED_EMPTY');
 if(['house','block','divert','retreat','pressure','cover','careDone','exit'].includes(node))return artAsset('BG_OLDHOUSE_STRUCTURE');
 return artAsset(backgrounds[asset]);
}
const people:Record<string,string>={老邻居一:'CHAR_NEIGHBOR_01_NEUTRAL',邻居一:'CHAR_NEIGHBOR_01_NEUTRAL',老邻居二:'CHAR_NEIGHBOR_02_NEUTRAL',邻居二:'CHAR_NEIGHBOR_02_NEUTRAL',外婆:'CHAR_GRANDMA_NEUTRAL',妈妈:'CHAR_MOTHER_NEUTRAL',表哥:'CHAR_COUSIN_NEUTRAL',你:'CHAR_HERO_DIALOGUE',主角:'CHAR_HERO_DIALOGUE',舅舅:'UNCLE_NORMAL',老人:'CHAR_ELDER_DIALOGUE_NORMAL',居民:'CHAR_BENCH_TIRED'};
export function speakerArt(s:State,speaker:string,line:number){
 let id=people[speaker];
 if(speaker==='老人'&&s.node==='road'&&line>=2)id='CHAR_ELDER_DIALOGUE_CONFUSED';
 if(speaker==='居民'&&s.node==='bench2')id='BENCH_CONFUSED';
 if(speaker==='舅舅'&&['uncle','routeA','house','timeline','reunion'].includes(s.node))id='UNCLE_INJURED';
 if(speaker==='舅舅'&&s.node==='uncle'&&line>=3)id=line>=7?'UNCLE_UNSTEADY':'UNCLE_CONFUSED';
 return id?artAsset(id):undefined;
}
// Individual face/head measurements; the source crop is never mirrored.
export function portraitCalibration(id:string){
 if(id==='CHAR_GRANDMA_NEUTRAL')return {face:290/1536,top:30/1536};
 if(id==='CHAR_MOTHER_NEUTRAL')return {face:310/1536,top:55/1536};
 if(id==='CHAR_NEIGHBOR_01_NEUTRAL')return {face:310/1536,top:0};
 if(id==='CHAR_NEIGHBOR_02_NEUTRAL')return {face:310/1536,top:53/1536};
 if(id==='CHAR_COUSIN_NEUTRAL')return {face:350/1536,top:20/1536};
 if(id==='CHAR_HERO_DIALOGUE')return {face:410/1536,top:15/1536};
 if(id.startsWith('CHAR_BENCH')||id.startsWith('BENCH_'))return {face:340/(artAsset(id)?.dimensions?.[1]||1312),top:20/(artAsset(id)?.dimensions?.[1]||1312)};
 if(id.startsWith('CHAR_ELDER'))return {face:360/1536,top:20/1536};
 return {face:415/1536,top:20/1536};
}
const tools:Record<string,string>={chair:'ITEM_CHAIR',rope:'ITEM_ROPE',rose:'ITEM_ROSE',pillow:'ITEM_PILLOW',bottle:'ITEM_BOTTLE',flashlight:'ITEM_FLASHLIGHT',basket:'ITEM_BASKET',dressing:'ITEM_DRESSING',bandage:'ITEM_BANDAGE'};
export const toolArt=(item:string)=>artAsset(tools[item]);
export type StoryBeat={text:string;line:number;leadIn?:string};
/** Keep authored sentences/clauses intact; never paginate by a character offset. */
export function readingPages(text:string,preferredLength=28):string[]{
 if(text==='他的腿不稳，只能重新坐下。')return ['他的腿不稳，','只能重新坐下。'];
 const sentences=text.match(/[^。！？!?；;]+[。！？!?；;]?/g)||[text];
 const pages:string[]=[];
 for(const sentence of sentences){
  const units=sentence.length>preferredLength?(sentence.match(/[^，,]+[，,]?/g)||[sentence]):[sentence];
  for(const unit of units){
   if(pages.length&&pages.at(-1)!.length+unit.length<=preferredLength)pages[pages.length-1]+=unit;
   else pages.push(unit);
  }
 }
 return pages.filter(p=>p.trim());
}
export function storyBeats(texts:string[]):StoryBeat[]{return texts.flatMap((text,line)=>{
 const parts:string[]=[];let pos=0;
 for(const m of text.matchAll(/(老邻居一|老邻居二|邻居一|邻居二|外婆|妈妈|舅舅|表哥|老人|居民|主角|你)：“[^”]*”/g)){
  if(m.index!>pos)parts.push(text.slice(pos,m.index));parts.push(m[0]);pos=m.index!+m[0].length;
 }
 if(pos<text.length)parts.push(text.slice(pos));
 const pieces=parts.filter(Boolean);
 return pieces.flatMap((t,index)=>{
  const m=t.match(/^(老邻居一|老邻居二|邻居一|邻居二|外婆|妈妈|舅舅|表哥|老人|居民|主角|你)：“(.*)”$/);
  const isLeadIn=(value:string)=>/[，：]$/.test(value)&&value.length<16;
  if(!m&&isLeadIn(t)&&index+1<pieces.length)return [];
  const leadIn=m&&index>0&&isLeadIn(pieces[index-1])?pieces[index-1]:undefined;
  return (m?readingPages(m[2],28).map(p=>m[1]+'：“'+p+'”'):/[A-Za-z]/.test(t)?[t]:readingPages(t.replace(/^场景文字：/,''))).map((text,i)=>({text,line,...(i===0&&leadIn?{leadIn}:{})}));
 });
});}
