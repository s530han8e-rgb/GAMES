import {artAsset} from '../data/art';
import {useState,useLayoutEffect} from 'react';
import {endingText} from '../data/content';
import {titles,type State} from '../game/engine';
import {GlossText} from './GlossText';
import {ArchivePager} from './ArchivePanels';
export function EndingView({state,onPanel,dimProgress=1,onDim}:{state:State;onPanel:(p:string)=>void;dimProgress?:number;onDim?:()=>void}){
 const [page,setPage]=useState(0);const [reached,setReached]=useState(false);const kind=state.ending||'C';
 const pages=endingText[kind].flatMap(text=>{const sentences=text.match(/[^。！？]+[。！？]?/g)||[text];const groups:string[]=[];for(const sentence of sentences){if(groups.length&&groups.at(-1)!.length+sentence.length<=100)groups[groups.length-1]+=sentence;else groups.push(sentence)}return groups});
 useLayoutEffect(()=>{if(kind==='C'&&page>=pages.length-1&&!reached){setReached(true);onDim?.()}},[page,kind,reached]);
 const facts=state.clues.filter(n=>[1,5,7,9,6,10,11,12].includes(n));const total=pages.length+Math.max(1,Math.ceil(facts.length/3));const recap=page>=pages.length;
 return <main className="ending endingPaged"><div className="endingArchive"><div className="endingHeading"><span className="eyebrow">本局档案</span><h1>{{A:'完整证据链',B:'足够阻止自己的群体',C:'碎片化证据'}[kind]}</h1><span>已发现 {state.clues.length}/12</span></div><div className="endingSpread"><div className={'endingPhoto '+(artAsset('BG_END_'+kind)?'':'placeholder')}>{artAsset('BG_END_'+kind)?<img style={kind==='C'?{filter:`brightness(${1-(reached?dimProgress:0)*.65})`}:undefined} src={artAsset('BG_END_'+kind)?.url} alt={kind==='C'?'家人和邻居继续东行':kind==='A'?'小群体停下，通过熟人传播警告':'小群体停下照应长辈，远处仍有人东行'}/> :<><span>结局插画待修正</span><strong>东区仍在开放</strong><small>开发占位 · 不代表最终美术</small></>}</div><article className="endingPage"><h2>{recap?'本局关键推理':'结局记录'}</h2>{recap?<>{facts.slice((page-pages.length)*3,(page-pages.length+1)*3).map(n=><p key={n}>{titles[n-1]}</p>)}{!facts.length&&<p>本局尚未形成关键推理。</p>}</>:<p><GlossText text={pages[page]}/></p>}</article></div><ArchivePager page={page} count={total} setPage={setPage}/><div className="endingLinks"><button onClick={()=>onPanel('review')}><span className="icon formalIcon" aria-hidden="true" style={{maskImage:`url(${artAsset('UI_REVIEW')!.url})`}}/><GlossText text="Review Evidence"/></button><button onClick={()=>onPanel('vocab')}>本局词汇回顾</button><button onClick={()=>onPanel('new')}>重新开始</button></div></div></main>
}
