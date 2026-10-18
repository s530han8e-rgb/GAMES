import {useCallback,useEffect,useRef,useState} from 'react';
export type MotionKind='door'|'chair'|'bottle'|'rose'|'pillow'|'failure'|'pressure'|'cover'|'retreat'|'exit'|'ending';
export type MotionRequest={kind:MotionKind;node:string;route:string;item?:string;target?:string;level?:number};
export type Motion=MotionRequest&{id:number;elapsed:number;duration:number;progress:number};
export const durations:Record<MotionKind,number>={door:850,chair:950,bottle:2550,rose:2000,pillow:1400,failure:650,pressure:1050,cover:1150,retreat:650,exit:1200,ending:1100};
/** Presentation owns time only. Exactly one completion dispatch; no domain scoring here. */
export function useMotion(reduced:boolean){
 const [motion,setMotion]=useState<Motion|null>(null);
 const current=useRef<Motion|null>(null),completion=useRef<null|(()=>void)>(null),serial=useRef(0),frame=useRef(0),last=useRef(0);
 const finish=useCallback(()=>{if(!current.current)return;current.current=null;cancelAnimationFrame(frame.current);setMotion(null);const done=completion.current;completion.current=null;done?.()},[]);
 const advance=useCallback((ms:number)=>{const m=current.current;if(!m||!Number.isFinite(ms)||ms<0)return;const elapsed=Math.min(m.duration,m.elapsed+ms);const n={...m,elapsed,progress:elapsed/m.duration};current.current=n;setMotion(n);if(elapsed===m.duration)finish()},[finish]);
 const play=useCallback((request:MotionRequest,done:()=>void)=>{if(current.current)return false;const m={...request,id:++serial.current,elapsed:0,duration:durations[request.kind],progress:0};completion.current=done;current.current=m;if(reduced){finish();return true}setMotion(m);last.current=performance.now();const tick=(now:number)=>{if(current.current?.id!==m.id)return;const delta=now-last.current;last.current=now;advance(delta);if(current.current?.id===m.id)frame.current=requestAnimationFrame(tick)};frame.current=requestAnimationFrame(tick);return true},[reduced,advance,finish]);
 useEffect(()=>{if(reduced)finish()},[reduced,finish]);
 useEffect(()=>()=>{cancelAnimationFrame(frame.current);current.current=null;completion.current=null},[]);
 const step=useCallback((ms:number)=>{cancelAnimationFrame(frame.current);advance(ms)},[advance]);
 return {motion,play,finish,advance:step,isPlaying:()=>!!current.current};
}
