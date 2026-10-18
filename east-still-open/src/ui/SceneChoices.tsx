import{useLayoutEffect,useRef}from'react';
import type{Action}from'../game/engine';
import{EnglishOption}from'./EnglishOption';
import type{SceneObject}from'../data/scene-objects';
export function SceneChoices({actions,onAction,objects=[],selected='',onReset}:{actions:Action[];onAction:(a:Action)=>void;objects?:SceneObject[];selected?:string;onReset?:()=>void}){
 const ref=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{const e=ref.current;if(!e)return;const f=e.closest<HTMLElement>('.sceneFrame');if(!f)return;const fit=()=>f.style.setProperty('--choice-height',e.getBoundingClientRect().height+'px');const o=new ResizeObserver(fit);o.observe(e);fit();return()=>{o.disconnect();f.style.removeProperty('--choice-height')}},[]);
 const object=objects.find(o=>o.id===selected);
 const visible=object?.actions||actions;
 return <div className="sceneChoices" ref={ref} aria-label="选择行动">{objects.length>0&&<div className="objectActionHeading"><span>{object?object.name+' · 行动':'场景行动 · 可点选标记或直接选择'}</span>{object&&<button onClick={onReset}>全部行动</button>}</div>}{visible.map(a=>{const group=objects.find(o=>o.actions.includes(a));return /[A-Za-z]/.test(a.label)?<EnglishOption data-object-action={group?.id} key={a.label} text={a.label} onClick={()=>onAction(a)}/>:<button data-object-action={group?.id} key={a.label} onClick={()=>onAction(a)}>{a.label}</button>})}</div>
}
