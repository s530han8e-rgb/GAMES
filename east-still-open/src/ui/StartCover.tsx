import {publicPath} from '../public-path';
import {useState} from 'react';
import cover from '../data/cover-art.json';
import './start-cover.css';

export function StartCover({canContinue,onStart,onContinue,onSettings,inert}:{
 canContinue:boolean;onStart:()=>void;onContinue:()=>void;onSettings:()=>void;inert:boolean;
}){
 const [failed,setFailed]=useState(false);
 return <main className="title coverStart" inert={inert} aria-hidden={inert} aria-label="游戏起始页">
  <div className="coverArt"><img className="startCoverImage" src={publicPath(cover.relativePath)} alt="东区仍在开放" draggable={false} onError={()=>setFailed(true)} onLoad={()=>setFailed(false)}/></div>
  <div className="titleActions coverControls" aria-label="游戏菜单">
   <button id="start-btn" onClick={onStart}>开始新周目</button>
   <button disabled={!canContinue} onClick={onContinue}>继续游戏</button>
   <button onClick={onSettings}>设置</button>
  </div>
  {failed&&<p className="coverLoadError" role="alert">封面图片加载失败，请刷新重试。</p>}
 </main>;
}
