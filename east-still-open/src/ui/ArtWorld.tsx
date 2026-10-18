import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {artAsset,formalUrl} from '../data/art';
export function ArtWorld({children,className='',attributes={}}:{children:ReactNode;className?:string;attributes?:Record<string,string|boolean>}){
 const host=useRef<HTMLDivElement>(null);const[scale,setScale]=useState(0);
 useLayoutEffect(()=>{const h=host.current;if(!h)return;const resize=()=>{const r=h.parentElement!.getBoundingClientRect();setScale(Math.min(r.width/1672,r.height/941))};const o=new ResizeObserver(resize);o.observe(h.parentElement!);resize();return()=>o.disconnect()},[]);
 return <div ref={host} className={'artWorld '+className} style={{width:1672*scale,height:941*scale}} {...attributes}><div className="sourceWorld" style={{transform:`scale(${scale})`}}>{children}</div></div>
}
export function ArtLayer({file,scale=1,xy=[0,0],className='',style={}}:{file:string;scale?:number;xy?:number[];className?:string;style?:React.CSSProperties}){
 const asset=artAsset(file)||artAsset(file.split('/').at(-1)!.replace(/\.(png|svg)$/,''));
 const width=asset?.dimensions?.[0];
 return <img className={'registeredLayer '+className} data-resource={asset?.id||file} src={asset?.url||formalUrl(file)} alt="" draggable={false} style={{left:xy[0],top:xy[1],width:width?width*scale:undefined,...style}}/>;
}
export function ArtCloseup({file,panel,localScale,localXY,label}:{file:string;panel:number[];localScale:number;localXY:number[];label:string}){
 return <div className="artCloseup" aria-label={label} style={{left:panel[0],top:panel[1],width:panel[2],height:panel[3]}}><span className="cutawayLabel">{label}</span><ArtLayer file={file} scale={localScale} xy={localXY}/></div>;
}
