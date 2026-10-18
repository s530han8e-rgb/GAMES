import type{Motion}from './useMotion';
import {ArtLayer,ArtCloseup} from './ArtWorld';
import {toolArt}from'../data/art';
import art from '../data/formal-oldhouse.json';
import doorStates from '../data/formal-door-states.json';
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const t=clamp(n);return t*t*(3-2*t)};
export function animatedDoor(m:Motion|null,base:number[]){
 if(!m)return `matrix3d(${base.join(',')})`;
 if(m.kind==='door'){const a=doorStates.states.critical_2.cssMatrix3d;return `matrix3d(${a.map((v,i)=>lerp(v,doorStates.states.closed.cssMatrix3d[i],ease(m.progress))).join(',')})`}
 if(m.kind==='rose'||m.kind==='pillow'||m.kind==='failure'&&m.node==='block'){
  const a=(m.level||1)>1?doorStates.states.pressure_1.cssMatrix3d:doorStates.states.closed.cssMatrix3d;
  const b=(m.level||1)>1?doorStates.states.critical_2.cssMatrix3d:doorStates.states.pressure_1.cssMatrix3d;
  const t=clamp(ease(m.progress)+Math.sin(m.progress*22)*.035*(1-m.progress));return `matrix3d(${a.map((v,i)=>lerp(v,b[i],t)).join(',')})`;
 }
 return `matrix3d(${base.join(',')})`;
}
function MovingTool({item,x,y,scale=.1,rotate=0,opacity=1,sx=1,sy=1}:{item:string;x:number;y:number;scale?:number;rotate?:number;opacity?:number;sx?:number;sy?:number}){
 const a=toolArt(item);return a?<ArtLayer file={a.relativePath} scale={scale} xy={[x,y]} className="movingTool" style={{opacity,transform:`rotate(${rotate}deg) scale(${sx},${sy})`,transformOrigin:'50% 50%'}}/>:null;
}
export function MotionLayers({motion:m}:{motion:Motion}){
 const p=m.progress;const k=m.kind;const atDoor=m.target==='门把手'?[300,290]:[300,430];
 const carePanel=m.route==='B'?[475,90,490,570]:[65,90,490,570];const hand=m.route==='B'?[730,460]:[320,460];
 if(k==='chair'){const t=ease(p/.75);return <div className="motionLayer" data-motion="chair"><ArtLayer file={art.chair.file} scale={art.chair.scale} xy={[lerp(520,art.chair.xy[0],t),lerp(395,art.chair.xy[1],t)-Math.sin(Math.PI*t)*45]} className="movingChair"/>{p>.76&&<div className="contactPulse" style={{left:340,top:365,opacity:(1-p)*3}}/>}</div>}
 if(k==='bottle'){
  const flight=clamp((p-.12)/.51),t=flight;const dest=m.target==='出口附近'?[1250,610]:m.target==='近身位置'?[1000,695]:art.bottle.xy;
  const x=lerp(940,dest[0],t),y=lerp(615,dest[1],t)-4*420*t*(1-t);const landed=p>=.65;
  const cut=art.threatFeedback;const [x1,y1,x2,y2]=cut.crop;const turn=ease((p-.76)/.15);
  return <div className="motionLayer" data-motion="bottle"><svg className="throwTrail" width="1672" height="941" style={{opacity:p>.67?0:.7}}><path d={`M940 645 Q${(940+dest[0])/2} ${(615+dest[1])/2-840} ${dest[0]+35} ${dest[1]+25}`} pathLength="1" strokeDasharray=".012 .025" strokeDashoffset={-p*.2}/></svg>{!landed?<MovingTool item="bottle" x={x} y={y} scale={lerp(.09,.045,t)} rotate={-35-640*t}/>:<ArtLayer file={art.bottle.file} scale={art.bottle.scale} xy={dest} style={{transform:`translateY(${-Math.sin(clamp((p-.65)/.10)*Math.PI)*18}px)`}}/>}{landed&&<svg className="landingRings" width="1672" height="941"><ellipse cx={dest[0]+35} cy={dest[1]+35} rx={25+(p-.65)*160} ry={7+(p-.65)*30} opacity={clamp(1-(p-.65)*4)}/></svg>}{p>.73&&<div className="threatCutaway artCloseup motionCutaway" style={{left:620,top:80,width:220,height:525,opacity:ease((p-.73)/.05)}}><span className="cutawayLabel">门另一侧 · 声响之后</span><div className="threatCrop" style={{width:x2-x1,height:y2-y1,transform:'scale(.8)',transformOrigin:'0 0'}}><ArtLayer file={cut.base} xy={[-x1,-y1]}/><ArtLayer file={cut.before} scale={cut.spriteScale} xy={[cut.spriteXY[0]-x1,cut.spriteXY[1]-y1]} style={{opacity:1-turn}}/><ArtLayer file={cut.after} scale={cut.spriteScale} xy={[cut.spriteXY[0]-x1,cut.spriteXY[1]-y1]} style={{opacity:turn}}/></div></div>}{p>.9&&m.target==='远离出口的落点'&&<div style={{opacity:ease((p-.9)/.1)}}><ArtCloseup file={art.retreat.file} panel={[...art.retreat.xy,...art.retreat.size]} localScale={art.retreat.size[0]/1672} localXY={[0,0]} label="屋内 · 木柜后暂避"/></div>}</div>;
 }
 if(k==='rose'){const travel=ease(p/.2);return <div className="motionLayer" data-motion="rose">{p<.32&&<MovingTool item="rose" x={lerp(750,atDoor[0],travel)} y={lerp(700,atDoor[1],travel)} scale={.085} rotate={-15*travel} opacity={clamp(1-(p-.2)*9)}/>}<div className="staticPetals">{Array.from({length:15},(_,i)=>{const t=clamp((p-.16-i*.018)/.6);return <ArtLayer key={i} file="素材/FX_PETAL_v02.png" scale={.018} xy={[lerp(atDoor[0]-35+(i%5)*25,270+(i%5)*23,ease(t))+Math.sin(t*6+i)*14,lerp(atDoor[1],710+Math.floor(i/5)*15,ease(t))]} style={{opacity:p<.17?0:clamp((1-p)*5),transform:`rotate(${i*35+t*320}deg)`}}/>})}</div></div>}
 if(k==='pillow'){
 const travel=ease(p/.27),squeeze=clamp((p-.27)/.18),fall=clamp((p-.45)/.28),bounce=clamp((p-.73)/.23);
 const x=p<.27?lerp(920,atDoor[0],travel):lerp(atDoor[0],art.effects.pillow.floorAnchor[0],ease(fall));
 const y=p<.27?lerp(700,atDoor[1],travel):lerp(atDoor[1],art.effects.pillow.floorAnchor[1],ease(fall))-(p>.73?Math.sin(bounce*Math.PI)*55:0);
 return <div className="motionLayer" data-motion="pillow"><MovingTool item="pillow" x={x} y={y} scale={lerp(.11,.07,fall)} sx={p>=.27&&p<.45?1+squeeze*.32:1} sy={p>=.27&&p<.45?1-squeeze*.6:1} rotate={p<.73?fall*12:(1-bounce)*12}/></div>;
 }
 if(k==='pressure'||k==='cover'){
  const stage=k==='pressure'?'pressure':'covered';const file=m.route==='B'?art.care[stage]:`素材/UNCLE_CARE_${stage.toUpperCase()}_v01.png`;
  const t=ease(p/.4);return <div className="motionLayer" data-motion={k}><div style={{opacity:ease((p-.35)/.6)}}><ArtCloseup file={file} panel={carePanel} localScale={art.care.localScale} localXY={art.care.localXY} label={m.route==='B'?'柜后 · 你的左前臂':'小棚 · 舅舅的左前臂'}/></div><MovingTool item={m.item||'dressing'} x={lerp(hand[0]+100,hand[0],t)} y={lerp(750,hand[1],t)} scale={.065} rotate={k==='cover'?-180*t:0} opacity={p>.8?(1-p)*5:1}/></div>;
 }
 if(k==='exit'){return <div className="motionLayer" data-motion="exit"><ArtLayer file={art.exit.file} scale={art.exit.scale} xy={art.exit.xy} style={{opacity:ease(p/.35),clipPath:`inset(0 ${100*(1-ease(p/.7))}% 0 0)`}}/></div>}
 if(k==='retreat')return <div className="motionLayer" data-motion="retreat" style={{opacity:ease(p)}}><ArtCloseup file={m.route==='B'?art.care.ready:'素材/UNCLE_CARE_READY_v01.png'} panel={carePanel} localScale={art.care.localScale} localXY={art.care.localXY} label={m.route==='B'?'柜后 · 你的左前臂':'小棚 · 舅舅的左前臂'}/></div>;
 if(k==='failure'&&m.item){const near=m.node==='divert'?(m.target==='出口附近'?[1250,610]:m.target==='近身位置'?[1000,695]:[275,745]):m.node==='pressure'||m.node==='cover'?(m.target==='伤口'?hand:m.target==='衣袖'?[hand[0]+70,360]:[hand[0]+300,630]):m.target==='旁侧地面'?[800,650]:atDoor;const t=ease(p/.45);return <div className="motionLayer" data-motion="failure"><MovingTool item={m.item} x={lerp(860,near[0],t)} y={lerp(725,near[1],t)+Math.sin(p*Math.PI)*30} scale={.085} rotate={p> .5?(p-.5)*25:0} opacity={p>.7?(1-p)*3.33:1}/></div>}
 return null;
}
