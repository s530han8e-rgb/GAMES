import {MotionLayers,animatedDoor} from './MotionLayers';
import type {Motion} from './useMotion';
import {useEffect} from 'react';
import {formalUrl} from '../data/art';
import type{State}from'../game/engine';
import {toolArt}from'../data/art';
import config from '../data/oldhouse.json';
import art from '../data/formal-oldhouse.json';
import doorStates from '../data/formal-door-states.json';
import {ArtWorld,ArtLayer,ArtCloseup} from './ArtWorld';
export const oldhouseNodes=['house','block','divert','retreat','pressure','cover','careDone','exit'];
export function CareInset({state}:{state:State}){
 const stage=['pressure','routeA'].includes(state.node)?'ready':state.node==='cover'?'pressure':'covered';
 const file=state.route==='B'?art.care[stage]:`素材/UNCLE_CARE_${stage.toUpperCase()}_v01.png`;
 return <ArtCloseup file={file} panel={state.route==='B'?[475,90,490,570]:[65,90,490,570]} localScale={art.care.localScale} localXY={art.care.localXY} label={state.route==='B'?'柜后 · 你的左前臂':'小棚 · 舅舅的左前臂'}/>;
}
export function OldhouseLayers({state,item,failures,targets=[],disabled,onDrop,onSelect,fx='',motion=null}:{state:State;item:string;failures:number;targets?:string[];disabled:boolean;onDrop:(target:string)=>void;onSelect:(item:string)=>void;fx?:string;motion?:Motion|null}){
 useEffect(()=>{const files=[art.door.file,art.chair.file,art.bottle.file,art.threatFeedback.before,art.threatFeedback.after,art.retreat.file,...Object.values(art.care).filter(v=>typeof v==='string'),...['READY','PRESSURE','COVERED'].map(s=>`素材/UNCLE_CARE_${s}_v01.png`),'素材/FX_PETAL_v02.png'];files.filter(f=>f.startsWith('素材/')).forEach(f=>{const img=new Image();img.src=formalUrl(f)})},[]);
 const careTargetButtons=<div className="worldTargets">{item&&!disabled&&targets.map((t,i)=>{const r=[[290,440,160,62],[370,360,110,60],[590,600,160,60]][i];return <button key={t} aria-label={t} style={{left:r[0],top:r[1],width:r[2],height:r[3]}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onDrop(t)}} onClick={()=>onDrop(t)}>{i+1}<span>{t}</span></button>})}</div>;
 if(state.route==='A')return <ArtWorld className="uncleCareWorld"><CareInset state={state}/>{careTargetButtons}{motion&&<MotionLayers motion={motion}/>}</ArtWorld>;
 const blocked=state.flags.includes('B_BLOCK');const diverted=state.flags.includes('B_DIVERT');const closed=motion?.kind==='door'||state.node!=='house'||state.flags.includes('B_DOOR_CLOSED');
 const pressure=state.node==='block'&&!blocked&&failures>0?(failures===1?'pressure_1':'critical_2'):'closed';
 const care=['pressure','cover','careDone'].includes(state.node);
 const cut=art.threatFeedback;const [x1,y1,x2,y2]=cut.crop;
 return <ArtWorld className="oldhouseWorld" attributes={{'data-blocked':blocked,'data-diverted':diverted,'data-checkpoint':state.flags.includes('CP_B03')?'CP_B03':blocked?'CP_B02':'CP_B01','data-door-state':closed?pressure:'open'}}>
 {!closed&&<div className="registeredThreat" style={{left:x1,top:y1,width:x2-x1,height:y2-y1}}><ArtLayer file={cut.before} scale={cut.spriteScale} xy={[cut.spriteXY[0]-x1,cut.spriteXY[1]-y1]}/></div>}
 {closed&&<ArtLayer file={art.door.file} className="doorLeaf" style={{transformOrigin:'0 0',transform:animatedDoor(motion,doorStates.states[pressure].cssMatrix3d)}}/>}
 {blocked&&<ArtLayer file={art.chair.file} scale={art.chair.scale} xy={art.chair.xy} className="braceResult"/>}
 {!blocked&&state.node==='block'&&item!=='chair'&&motion?.item!=='chair'&&<button className="waitingChair" aria-label="拿起房间里的椅子" disabled={disabled} onClick={()=>onSelect('chair')} style={{left:520,top:395,width:170,height:255}}><img src={toolArt('chair')?.url} alt="" draggable={false}/><span>拿起</span></button>}
 {diverted&&<ArtLayer file={art.bottle.file} scale={art.bottle.scale} xy={art.bottle.xy} className="bottleResult"/>}
 <ContactShadows blocked={blocked} diverted={diverted} exit={state.node==='exit'}/>
 {diverted&&['retreat'].includes(state.node)&&<div className="threatCutaway artCloseup" aria-label="门另一侧的反应" style={{left:620,top:80,width:220,height:525}}><span className="cutawayLabel">门另一侧 · 声响之后</span><div className="threatCrop" style={{width:x2-x1,height:y2-y1,transform:'scale(.8)',transformOrigin:'0 0'}}><ArtLayer file={cut.base} xy={[-x1,-y1]}/><ArtLayer file={cut.after} scale={cut.spriteScale} xy={[cut.spriteXY[0]-x1,cut.spriteXY[1]-y1]}/></div></div>}
 {state.node==='retreat'&&<div style={{opacity:motion?.kind==='retreat'?1-motion.progress:1}}><ArtCloseup file={art.retreat.file} panel={[...art.retreat.xy,...art.retreat.size]} localScale={art.retreat.size[0]/1672} localXY={[0,0]} label="屋内 · 木柜后暂避"/></div>}
 {care&&<div style={{opacity:motion?.kind==='exit'?1-motion.progress:1}}><CareInset state={state}/></div>}
 {state.node==='exit'&&<ArtLayer file={art.exit.file} scale={art.exit.scale} xy={art.exit.xy} className="exitFigure"/>}
 {!motion&&fx==='rose'&&<div className="staticPetals" aria-label="玫瑰花瓣落地">{Array.from({length:art.effects.petals.countByError[Math.min(failures,3)-1]||3},(_,i)=><ArtLayer key={i} file="素材/FX_PETAL_v02.png" scale={.012} xy={[270+(i%5)*23,718+Math.floor(i/5)*17]}/>)}</div>}
 {!motion&&fx==='pillow'&&<ArtLayer file="素材/ITEM_PILLOW_v02.png" scale={.07} xy={art.effects.pillow.floorAnchor} className="staticPillow"/>}
 {motion&&<MotionLayers motion={motion}/>}
 {item&&!disabled&&targets.length>0&&<div className="worldTargets">{targets.map((t,i)=>{const rect=config.targets[state.node as keyof typeof config.targets]?.[i];if(!rect)return null;const r=care?[[700,440,160,62],[780,360,110,60],[1000,600,160,60]][i]:[rect[0]*16.72,rect[1]*9.41,rect[2]*16.72,rect[3]*9.41];return <button key={t} aria-label={t} style={{left:r[0],top:r[1],width:r[2],height:r[3]}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onDrop(t)}} onClick={()=>onDrop(t)}>{i+1}<span>{t}</span></button>})}</div>}
 </ArtWorld>
}
// Inline formal SVG: groups are independently conditional, never display all shadows.
import shadow from '../../public/art/formal/接触影.svg?raw';
function ContactShadows({blocked,diverted,exit}:{blocked:boolean;diverted:boolean;exit:boolean}){
 return <div className="contactGroups" data-chair={blocked} data-bottle={diverted} data-exit={exit} dangerouslySetInnerHTML={{__html:shadow}}/>;
}
