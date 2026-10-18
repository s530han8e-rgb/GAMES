import {useLayoutEffect,useRef,useState,useEffect,type CSSProperties} from 'react';
import type {State} from '../game/engine';
import {speakerArt,portraitCalibration} from '../data/art';
export function SpeakerPortrait({state,speaker,line}:{state:State;speaker:string;line:number}){
 const asset=speakerArt(state,speaker,line);const ref=useRef<HTMLElement>(null);
 const[failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[asset?.id]);
 const calibration=portraitCalibration(asset?.id||'');
 useLayoutEffect(()=>{const portrait=ref.current;const frame=portrait?.closest('.sceneFrame');const dialogue=frame?.querySelector('.dialogue');if(!portrait||!frame||!dialogue)return;
  const resize=()=>{
   const f=frame.getBoundingClientRect(),d=dialogue.getBoundingClientRect();
   const image=portrait.querySelector('img');if(!image)return;
   // Reset the previous fitted height before resolving responsive CSS again.
   image.style.height='';image.style.top='';
   const sourceHeight=parseFloat(getComputedStyle(image).height);
   const family=frame.classList.contains('familyDialogue');
   const top=(asset?.alphaBounds?.[1]||0)/(asset?.dimensions?.[1]||1536);
   const available=Math.max(0,d.top-f.top-32);
   {
    const aspect=(asset?.dimensions?.[0]||1024)/(asset?.dimensions?.[1]||1536);
    const maxWidth=f.width*(f.width<700?.56:family?.34:.30);
    const height=Math.max(0,Math.min(sourceHeight,(available-8)*.188/calibration.face,(available-8)/(1-top),(maxWidth-16)/aspect));
    image.style.height=height+'px';image.style.top=(8-height*top)+'px';
    portrait.style.width=(height*aspect+16)+'px';
    portrait.style.height=(8+height*(1-top))+'px';
   }
   portrait.style.bottom=(f.bottom-d.top-2)+'px';
  };
  const observer=new ResizeObserver(resize);observer.observe(frame);observer.observe(dialogue);const choices=frame.querySelector('.sceneChoices');if(choices)observer.observe(choices);const changes=new MutationObserver(resize);changes.observe(frame,{attributes:true,attributeFilter:['style','class']});resize();return()=>{observer.disconnect();changes.disconnect()};
 },[asset?.id]);
 if(!asset)return null;
 return <aside ref={ref} className="speakerPortrait" aria-label={speaker+'立绘'} data-character={speaker} data-portrait={asset.id} style={{'--face-ratio':calibration.face,'--head-top':calibration.top} as CSSProperties}>
  <img key={asset.id} src={asset.url} alt={speaker} draggable={false} onError={()=>setFailed(true)}/>
 {failed&&<span className="portraitLoadError" role="alert">人物图片加载失败，请刷新重试。</span>}</aside>;
}
