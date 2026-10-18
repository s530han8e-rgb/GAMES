import {useLayoutEffect,useRef,useState} from 'react';
import type {SceneObject} from '../data/scene-objects';
export function SceneObjects({objects,selected,onSelect}:{objects:SceneObject[];selected:string;onSelect:(object:SceneObject)=>void}){
 const ref=useRef<HTMLDivElement>(null);
 const [points,setPoints]=useState<{x:number;y:number;anchorX:number;anchorY:number}[]>([]);
 useLayoutEffect(()=>{
  const host=ref.current,frame=host?.closest<HTMLElement>('.sceneFrame'),art=frame?.querySelector<HTMLElement>('.art'),paper=frame?.querySelector<HTMLElement>('.dialogue');if(!host||!frame||!art||!paper)return;
  const fit=()=>{const f=frame.getBoundingClientRect(),a=art.getBoundingClientRect(),d=paper.getBoundingClientRect(),scale=Math.min(a.width/1672,a.height/941),left=a.left-f.left+(a.width-1672*scale)/2,top=a.top-f.top+(a.height-941*scale)/2;
   const placed:{x:number;y:number;anchorX:number;anchorY:number}[]=[];for(const o of objects){const portrait=frame.querySelector<HTMLElement>('.speakerPortrait');const person=o.id==='resident'?'居民':o.id==='uncle'?'舅舅':'';const pr=portrait?.dataset.character===person?portrait.getBoundingClientRect():null;const anchorX=pr?pr.left-f.left+pr.width*.6:left+o.xy[0]*scale,anchorY=pr?pr.top-f.top+pr.height*.6:top+o.xy[1]*scale,y=Math.max(72,Math.min(d.top-f.top-35,anchorY));let x=Math.max(90,Math.min(f.width-90,anchorX+(pr?pr.width*.6:0)));const labelX=x;for(const offset of [0,-165,165,-330,330]){const candidate=Math.max(90,Math.min(f.width-90,labelX+offset));if(placed.every(p=>Math.abs(p.x-candidate)>=160||Math.abs(p.y-y)>=50)){x=candidate;break}}placed.push({anchorX,anchorY,x,y})}setPoints(placed);
  };const observer=new ResizeObserver(fit);observer.observe(frame);observer.observe(paper);const changes=new MutationObserver(fit);changes.observe(frame,{attributes:true,attributeFilter:['style','class']});fit();return()=>{observer.disconnect();changes.disconnect()};
 },[objects]);
 return <div className="sceneObjects" ref={ref} aria-label="场景对象"><svg aria-hidden="true">{points.map((p,i)=><g key={objects[i]?.id}><line x1={p.x} y1={p.y} x2={p.anchorX} y2={p.anchorY}/><circle cx={p.anchorX} cy={p.anchorY} r="4"/></g>)}</svg>{objects.map((o,i)=><button key={o.id} className="sceneObject" data-object={o.id} style={{left:points[i]?.x||0,top:points[i]?.y||0}} aria-label={'查看'+o.name+'的行动'} aria-pressed={selected===o.id} onClick={()=>onSelect(o)}><span aria-hidden="true">{i+1}</span>{o.name}</button>)}</div>;
}
