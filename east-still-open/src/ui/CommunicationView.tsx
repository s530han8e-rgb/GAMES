import {useState} from 'react';
import {scenes,factMessages} from '../data/content';
import {type State} from '../game/engine';
import {GlossText} from './GlossText';
import {ArchivePager} from './ArchivePanels';
export function CommunicationView({state,onFinish}:{state:State;onFinish:()=>void}){
 const [page,setPage]=useState(0);
 const messages=[...scenes.final.text.map(text=>({speaker:'表哥',incoming:true,text:text.replace(/^表哥消息：/,'').replace(/^[“]|[”]$/g,'')})),...factMessages(state.clues).map(text=>({speaker:'你',incoming:false,text:text.replace(/^[“]|[”]$/g,'')}))];
 const m=messages[page];
 return <main className="communicationScene"><div className="communicationBackdrop" aria-hidden="true"><span>通信记录</span><i/><i/></div><div className="phoneDevice communicationPhone"><div className="phoneStatus" aria-hidden="true"><span>消息</span><span>▰ ▰ ▰</span></div><div className="phoneScreen"><div className="communicationContact"><span>表哥</span><small>最后的通信</small></div><div className={'communicationMessage '+(m.incoming?'incoming':'outgoing')}><small>{m.speaker}</small><article className="communicationBubble"><p><GlossText text={m.text}/></p></article></div><div className="communicationControls"><ArchivePager page={page} count={messages.length} setPage={setPage}/>{page===messages.length-1&&<button onClick={onFinish}>查看结局</button>}</div></div><div className="phoneHomeBar" aria-hidden="true"/></div></main>
}
