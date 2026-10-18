import {artAsset} from '../data/art';
import {ArchivePager} from './ArchivePanels';
import {GlossText,GlossValue} from './GlossText';
import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { inference, titles, type State } from '../game/engine';
import { scenes, factMessages } from '../data/content';
export function Icon({ name }: {
    name: string;
}) { const asset=artAsset('UI_'+name.toUpperCase());return <span aria-hidden="true" className="icon formalIcon" style={{maskImage:`url("${asset?.url||artAsset('UI_EVIDENCE')!.url}")`,WebkitMaskImage:`url("${asset?.url||artAsset('UI_EVIDENCE')!.url}")`}}/>; }

export function StoryText({ text }: {
    text: string;
}) { const cleaned = text.replace(/^场景文字：/, ''); const match = cleaned.match(/^([^：]{1,8})：(.*)$/); return match ? <div className="storySpeech"><h3 className="speaker"><GlossValue value={match[1]}/></h3><p><GlossValue value={match[2]}/></p></div> : <p className="narration"><GlossValue value={cleaned}/></p>; }
export function Modal({ kind, onClose, children }: {
    kind: string;
    onClose: () => void;
    children: ReactNode;
}) { const ref = useRef<HTMLElement>(null); useEffect(() => { const old = document.activeElement as HTMLElement; const box = ref.current; const buttons = () => Array.from(box?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select,a[href],[tabindex="0"]') || []); buttons()[0]?.focus(); const key = (e: KeyboardEvent) => { if (e.key === 'Escape') {
    e.preventDefault();
    onClose();
} if (e.key === 'Tab') {
    const all = buttons();
    const first = all[0], last = all.at(-1);
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
    }
    else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
    }
} }; box?.addEventListener('keydown', key); return () => { box?.removeEventListener('keydown', key); old?.focus(); }; }, []); return <section ref={ref} className={'modal paper modal-' + kind} role="dialog" aria-modal="true" aria-label={{ phone: '手机', infer: '比较信息', evidence: 'Evidence', review: '证据回顾', gloss: '词义查询', hint: '附加笔记' }[kind] || kind}><div className="modalScroll"><div className="modalToolbar"><button className="close" onClick={onClose}><GlossText text="Close "/><Icon name="close"/></button></div><div className="modalContent"><GlossValue value={children}/></div></div></section>; }
export function Messages({compact=false,medical=false,initialChannel="private"}:{compact?:boolean;medical?:boolean;initialChannel?:string}={}) { const[channel,setChannel]=useState(initialChannel);return <div className="phoneDevice"><div className="phoneStatus" aria-hidden="true"><span>16:30</span><span>▰ ▰ ▰</span></div><div className="phoneScreen"><div className="phoneAppTitle">消息与通知</div>{compact&&<div className="phoneTabs">{[["private","舅舅"],["public","公共通知"],...(medical?[["medical","医疗提示"]]:[])].map(([id,label])=><button key={id} aria-label={label} aria-pressed={channel===id} onClick={()=>setChannel(id)}>{label}</button>)}</div>}<div className="messages"><article hidden={compact&&channel!=="private"} className="paper messageCard"><small>舅舅 <span className="time">16:26</span></small><p><GlossText text="Where are you? Don’t go east yet. Something is wrong here…"/></p></article><article hidden={compact&&channel!=="public"} className="paper messageCard"><small>公共渠道 <span className="time">16:30</span></small><p><GlossText text="Residents should head to the temporary shelter in the east."/></p><div className="messageStatus"><span><GlossText text="Status: Active"/></span><span><GlossText text="Last updated: "/><span className="time">16:30</span></span></div></article>{medical&&<article hidden={compact&&channel!=="medical"} className="paper messageCard"><small>表哥 · 医疗初步提示</small><p><GlossText text="Initial observations suggest at least 24 hours between exposure and symptoms. This information is preliminary."/></p></article>}</div></div><div className="phoneHomeBar" aria-hidden="true"/></div>; }
const sources: Record<number, string> = { 1: '舅舅私人消息与公共渠道通知 · 16:26 / 16:30', 2: '与长椅居民的交流', 3: '长椅居民起身时的观察', 4: '安置点外围血迹', 5: '登记记录与公共渠道通知 · 16:12—16:30', 6: '长椅居民与安置点现场观察', 7: '安置点现场亲历', 8: '失控现场的行为观察', 9: '失控事实与当前通知状态 · 最后更新 16:30', 10: '前序观察与舅舅症状', 11: '医疗初步提示、新伤时间与舅舅症状', 12: '老人屋实际行动与行为验证' };
export function EvidenceView({ state, review = false, initialDetail }: {
    state?: State;
    review?: boolean;
    initialDetail?: number;
}) {
    const [detail, setDetail] = useState(initialDetail);const [detailPage,setDetailPage]=useState(0);
    const [folio,setFolio]=useState(0);const [capacity,setCapacity]=useState(12);const deskRef=useRef<HTMLDivElement>(null);
    useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;const n=height<380?1:width<650||height<500?2:4;setCapacity(n);setFolio(v=>Math.min(v,Math.ceil(12/n)-1))});if(deskRef.current)observer.observe(deskRef.current);return()=>observer.disconnect()},[detail]);
    const count = state?.clues.length || 0;
    const acquired = (n: number) => state?.clues.includes(n);
    const exclusive = (n: number) => n === 11 && state?.route === 'B' || n === 12 && state?.route === 'A';
    if (detail)
        return <div className="evidenceDetailWorkspace"><article className="evidenceRecordCard"><div className="recordCardHeader"><span>记录 {String(detail).padStart(2,'0')}</span><strong>{acquired(detail)?'已确认':'本局未发现'}</strong></div><h2 className="recordCardTitle">{titles[detail-1]}</h2>{detailPage===0?<p>{detail===7?'安置点已经发生失控，现场不能继续正常报告。':factMessages([detail]).at(-1)?.replace(/[“”]/g,'')||titles[detail-1]}</p>:<div><p className="recordSource">{acquired(detail)?'来源：'+sources[detail]:'这项证据本局未确认。'}</p>{exclusive(detail)&&<p>本局未进入该调查路线。</p>}</div>}</article><ArchivePager page={detailPage} count={2} setPage={setDetailPage}/><button onClick={()=>{setDetail(undefined);setDetailPage(0)}}>返回档案册</button></div>;
    return <div ref={deskRef} className={"archiveWorkspace evidenceWorkspace "+(review?"archiveRetrospective":"")}><div className="archiveHeading"><span className="archiveStamp">{review?'本局回顾':'证据档案'}</span><h2><GlossValue value={review?'证据回顾':'Evidence'}/></h2><span>已发现 {count} / 12</span></div>{review&&<p className="archiveReviewNote">本局未进入另一条调查路线。</p>}<div className={'evidenceGrid capacity-'+capacity}>{titles.slice(folio*capacity,(folio+1)*capacity).map((t,j)=>{const i=folio*capacity+j;return <article key={i} className={acquired(i+1)?'discovered':'undiscovered'}><div className="evidenceCardTop"><small>记录 {String(i+1).padStart(2,'0')}</small>{(acquired(i+1)||review)&&<Icon name={i===0||i===8?'phone':'evidence'}/>}</div><h3><GlossValue value={acquired(i+1)||review?t:'未发现'}/></h3><div className="evidenceCardFooter"><p className="cardStatus">{acquired(i+1)?'已确认':review&&exclusive(i+1)?'本局未进入该调查路线':'未发现'}</p>{(acquired(i+1)||review)&&<button className="detailLink" onClick={()=>{setDetail(i+1);setDetailPage(0)}}>查看详情</button>}</div></article>})}</div>{capacity<12&&<ArchivePager page={folio} count={Math.ceil(12/capacity)} setPage={setFolio}/>}</div>;

}
export {InferenceWorkspace as InferenceView} from './ArchivePanels';
export function GlossDemo({tool}:{tool:boolean}){return <div className={tool?'toolDictionary':'pocketDictionary'}><div className="surfaceLabel">{tool?'物品标签':'随身词典'}</div><h2>{tool?'工具箱':'英文摘录'}</h2><p className="glossInstruction">点击、长按单词，或聚焦后按回车查看中文释义。</p>{tool?<div className="glossTools">{['CHAIR','BOTTLE','BANDAGE','DRESSING'].map((t,i)=><article className="toolCard" key={t}><svg className="toolSymbol" aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{i===0?<><path d="M15 11h29v27H15zM15 38h35v7H15zM18 45v13M47 45v13M15 11v34"/></>:i===1?<><path d="M26 8h12v12l8 10v27H18V30l8-10zM26 8V4h12v4M18 34h28M18 46h28"/></>:i===2?<><rect x="8" y="23" width="48" height="18" rx="9" transform="rotate(-30 32 32)"/><rect x="25" y="25" width="14" height="14" rx="2" transform="rotate(-30 32 32)"/></>:<><rect x="12" y="12" width="40" height="40" rx="3"/><path d="M18 22h28M18 29h28M18 36h28M18 43h28"/></>}</svg><div className="toolHangTag"><GlossText text={t}/></div></article>)}</div>:<div className="dictionaryPage"><span className="dictionaryThumb" aria-hidden="true">Aa</span><p className="glossSentence"><GlossText text="Residents should head to the temporary shelter in the east."/></p><div className="dictionaryGuide">点击陌生的词，查看它在当前语境中的中文意思。</div></div>}</div>}
