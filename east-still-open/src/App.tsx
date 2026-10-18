import {StartCover} from './ui/StartCover';
import {useMotion} from './ui/useMotion';
import './ui/motion.css';
import {SceneLayers} from './ui/SceneLayers';
import {artAsset} from './data/art';
import {SceneChoices} from './ui/SceneChoices';
import {SceneObjects} from './ui/SceneObjects';
import {sceneObjects} from './data/scene-objects';
import {OldhouseLayers,oldhouseNodes} from './ui/OldhouseLayers';
import {backgroundArt,storyBeats,toolArt} from './data/art';
import {SpeakerPortrait} from './ui/SpeakerPortrait';
import {EnglishOption} from "./ui/EnglishOption";
import {CommunicationView} from "./ui/CommunicationView";
import {EndingView} from "./ui/EndingView";
import {HintWorkspace,VocabularyWorkspace} from './ui/ArchivePanels';
import {GlossText,GlossValue} from './ui/GlossText';
import React, { useEffect, useState, useRef } from 'react';
import { initial, transition, formInference, inference, tasks, titles, observeHouse,completeTool,retryCheckpoint,toolResult,dangerFeedback,type State, type Action } from './game/engine';
import { scenes, actions, endingText, factMessages } from './data/content';
import { load, save } from './game/save';
import './style.css';
import { Icon, StoryText, EvidenceView, InferenceView, GlossDemo, Modal, Messages } from './ui/components';

import rpd from './data/rpd.json';
export type PreviewConfig = {
    state?: State;
    panel?: string;
    inferenceId?: number;
    feedback?: string;
    failures?: number;
    retry?: boolean;
    cached?: State;
    glossTool?: boolean;
    long?: boolean;
    detailId?: number;
};
export function App({ preview, large: externalLarge = false, reduce: externalReduce = false }: {
    preview?: PreviewConfig;
    large?: boolean;
    reduce?: boolean;
}) {
    const dropLock=useRef(false);
    const [s, setS] = useState<State | undefined>(preview?.state);
    const [cached, setCached] = useState<State | undefined>(preview?.cached);
    const [panel, setPanel] = useState(preview?.panel || '');
    const [feedbackPage,setFeedbackPage]=useState(0);
    const [feedback, setFeedback] = useState(preview?.feedback || '');
    const [error, setError] = useState('');
    const [infer, setInfer] = useState(preview?.inferenceId || 0);
    const [support, setSupport] = useState<string[]>([]);
    const [item, setItem] = useState('');
    const [selectedObject,setSelectedObject]=useState('');
    const [fails, setFails] = useState(preview?.failures || 0);
    const [retry, setRetry] = useState(preview?.retry || false);
    const [fx, setFx] = useState('');
    const [large, setLarge] = useState(false);
    const [reduce, setReduce] = useState(()=>localStorage.getItem('east-reduce-motion')==='true');
    const [systemReduce,setSystemReduce]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setSystemReduce(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
    useEffect(()=>{if(!preview)localStorage.setItem('east-reduce-motion',String(reduce))},[reduce]);
    const playback=useMotion(reduce||externalReduce||systemReduce);
    const motion=playback.motion;
    const [hint, setHint] = useState(0);
    const [assetOk, setAssetOk] = useState(false);
    const [assetFailed,setAssetFailed]=useState(false);
    const [beat, setBeat] = useState(0);
    useEffect(() => { if (!preview)
        load().then(setCached).catch(e => setError(e.message)); }, []);
    useEffect(() => { if (s && !preview)
        save(s).then(() => setCached(s)).catch(() => setError('本地保存失败，请检查浏览器存储权限。')); }, [s]);
    useEffect(()=>{setBeat(0);setFeedbackPage(0);setSelectedObject('')},[feedback]);
    useEffect(() => { setBeat(0);setSelectedObject(''); setItem('');dropLock.current=false; if (!preview) {
        setFails(0);
        setRetry(false);
    } setHint(0); }, [s?.node]);
    useEffect(() => { (window as any).render_game_to_text = () => JSON.stringify({ node: s?.node || 'title', route: s?.route, clues: s?.clues, actions: s ? actions(s).map(a => a.label) : ['开始'], panel, task: tasks[s?.node || '']?.goal, failures: fails,flags:s?.flags,selectedItem:item,selectedObject,reading:more,animation:motion?{kind:motion.kind,elapsed:Math.round(motion.elapsed),duration:motion.duration,progress:motion.progress,blocking:true}:null,sceneObjects:objects.map(o=>({id:o.id,name:o.name,actions:o.actions.map(a=>a.label)})) }); (window as any).advanceTime = playback.advance; }, [s, panel, fails,item,selectedObject,beat,feedback,motion]);
    const act = (a: Action) => { if (!s||playback.isPlaying())return;
        if(a.infer){setInfer(a.infer);setSupport([]);setPanel('infer');return}
        const commit=()=>{setPanel('');setSelectedObject('');setFx('');setFeedback(a.feedback||'');let n=transition(s,a);if(n.node==='inside'&&n.clues.includes(6)&&n.clues.includes(8))n={...n,node:'recheck'};setS(n)};
        const kind=s.node==='house'?'door':s.node==='retreat'||s.node==='routeA'?'retreat':s.node==='careDone'&&s.route==='B'?'exit':undefined;
        if(kind)playback.play({kind,node:s.node,route:s.route},commit);else commit();
    };
    const submit = (answer: number) => { if (!s)
        return; const config = inference[infer]; if ([6, 10, 11].includes(infer) && support.length !== config.supports.length) {
        setFeedback('这些信息还不足以支持这一次比较。再看一下时间或变化顺序。');
        return;
    } if (answer !== 0) {
        setFeedback('这个判断尚不能由当前信息支持。再看一下时间或变化顺序。');
        setHint(hint + 1);
        return;
    } let n = formInference(s, infer, support, answer); if (n === s)
        return; n = { ...n, words: [...new Set([...n.words, config.answers[0]])] }; if (infer === 1)
        n = { ...n, node: 'family' }; if (infer === 6 && n.clues.includes(8))
        n = { ...n, node: 'recheck' }; setS(n); setPanel(''); setFeedback('已确认：' + titles[infer - 1]); };
    const itemNames:Record<string,string>={chair:'椅子',rope:'绳子',rose:'玫瑰',pillow:'枕头',bottle:'瓶子',flashlight:'手电筒',basket:'篮子',dressing:'敷料',bandage:'绷带'};
    const drop = (target: string) => {
        if(!s||!item||retry||playback.isPlaying()||dropLock.current)return;
        const task=tasks[s.node];if(!task||!task.items.includes(item)||toolResult(s.node,item,target)==='cancel')return;
        dropLock.current=true;
        const selected=item;setS({...s,words:[...new Set([...s.words,task.goal,item])]});const success=toolResult(s.node,item,target)==='success';
        if(success){
            const kind=s.node==='block'?'chair':s.node==='divert'?'bottle':s.node==='pressure'?'pressure':'cover';
            playback.play({kind,node:s.node,route:s.route,item:selected,target},()=>{queueMicrotask(()=>{dropLock.current=false});setItem('');setFx('');setFeedback('');setS(completeTool(s,selected,target))});return;
        }
        const count=fails+1;setFails(count);setFx('');
        setS({...s,words:[...new Set([...s.words,task.goal,selected])]});
        let result=selected==='rose'?'玫瑰无法固定门，门仍在往里推。':'枕头被挤开，门仍能往里打开。';
        if(s.node==='block'&&selected==='chair')result=target==='门把手'?'椅子碰到了把手，却没有稳稳顶住门。门仍能往里打开。':'椅子留在旁侧地面，门没有被顶住。';
        if(s.node==='block'&&selected==='rope')result='这里没有能让绳子牢固固定的位置。';
        const rose=selected==='rose'&&['门内侧支撑区','门把手'].includes(target),pillow=selected==='pillow'&&target==='门内侧支撑区';
        if(rose)result='花瓣缓缓落下。门却没有停止晃动。\n……现在好像不是送花的时候。';
        if(pillow)result='枕头被挤到一边，落回地面。\n软是很软，挡不住。';
        if(s.node==='divert')result=selected==='bottle'?(target==='出口附近'?'瓶子落在出口附近。它转向那里，正好挡住了离开的方向。':'落点离你太近，没有把它的注意引向远处。'):`${itemNames[selected]}没有形成远处动静。它仍在你要走的方向。`;
        if(['pressure','cover'].includes(s.node))result=target!=='伤口'?`物品放在${target}，没有处理到伤口。`:s.node==='pressure'?'绷带没有完成按压，出血还没有控制住。':'敷料还没有被固定，覆盖步骤没有完成。';
        const danger=dangerFeedback(s.node,count)+(count>=3?'\n从本次互动开始处重试，已获得的证据保留。':'');
        const kind=rose?'rose':pillow?'pillow':s.node==='divert'&&selected==='bottle'?'bottle':'failure';
        playback.play({kind,node:s.node,route:s.route,item:selected,target,level:count},()=>{queueMicrotask(()=>{dropLock.current=false});setItem('');setFx(rose?'rose':pillow?'pillow':'');setRetry(count>=3);setHint(count);setFeedback(`你尝试：${itemNames[selected]} → ${target}。\n`+result+'\n'+danger)});
    };
    useEffect(() => { const key = (e: KeyboardEvent) => { if (playback.isPlaying())return; if (e.key === 'Escape'){setPanel('');setItem('');} }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
    useEffect(() => { if (panel)
        (document.querySelector('.modal .close') as HTMLButtonElement)?.focus(); }, [panel]);
    useEffect(()=>{if(s?.node==='medical'||s?.node==='phone')setPanel('phone')},[s?.node]);
const scene = s ? scenes[s.node] : undefined;
    const task = s ? tasks[s.node] : undefined;
    const stepped = !!s && !task;
    const sceneBeats=storyBeats(scene?.text||[]);
    const reactionBeats=!task&&feedback?storyBeats([feedback]).map(b=>({...b,line:-1})):[];
    const beats = [...reactionBeats,...sceneBeats];

    const current = beats[beat]?.text || '';
    const currentLine = Math.max(0,beats[beat]?.line || 0);
    const leadIn = beats[beat]?.leadIn;
    useEffect(()=>{if(s&&s.node==='house'){const record=()=>setS(previous=>previous?observeHouse(previous,current):previous);if(current.includes('你关上')&&!s.flags.includes('B_DOOR_CLOSED'))playback.play({kind:'door',node:s.node,route:s.route},record);else record()}},[s?.node,current]);
    const speaker = current.match(/^([^：]{1,8})：/)?.[1] || '现场记录';
    const background = scene && s ? backgroundArt(scene.asset,s.node,s.route,currentLine,s,beats[beat]?.line===-1,beat===reactionBeats.length-1,speaker==='现场记录'?'':speaker,current) : undefined;
    const more = beat < beats.length - 1;
    const feedbackPages=task?storyBeats([feedback]).map(b=>b.text):[];
    const available=s?actions(s):[];
    const objects=s&&stepped&&!more?sceneObjects(s,available):[];
    const separateChoices=!!s&&stepped&&!more&&(available.length>1||objects.length>0);
    useEffect(()=>{setAssetOk(false);setAssetFailed(false)},[background?.url]);
    useEffect(() => { const key = (e: KeyboardEvent) => { if (stepped && more && !panel && !playback.isPlaying() && e.code === 'Space' && !(e.target instanceof HTMLElement && e.target.closest('button,input,select,textarea'))) {
        e.preventDefault();
        setBeat(v => v + 1);
    } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [stepped, more, panel]);
    return <div className={(large || externalLarge ? 'large ' : '') + (reduce || externalReduce ? 'reduce' : '')}>{s&&<header inert={!!panel||!!motion} aria-hidden={!!panel}><span className="brand">东区仍在开放</span><span className="edition">互动叙事 · 英语调查</span><nav><GlossValue value={s && ['phone', 'evidence', 'hint'].map((p, i) => <button key={p} onClick={() => setPanel(p)}><Icon name={p}/><GlossValue value={['手机', 'Evidence', '提示'][i]}/></button>)}/><button onClick={() => setPanel('settings')}>设置</button></nav></header>}<GlossValue value={error && <aside role="alert"><GlossValue value={error}/></aside>}/>
    <GlossValue value={!s ? <StartCover inert={!!panel||!!motion} canContinue={!!cached} onStart={()=>{if(cached)setPanel('new');else setS(initial())}} onContinue={()=>setS(cached)} onSettings={()=>setPanel('settings')}/> : s.node === 'ending' ? <div inert={!!panel||!!motion} aria-hidden={!!panel} className="endingHost"><EndingView state={s} onPanel={setPanel} dimProgress={motion?.kind==='ending'?motion.progress:1} onDim={()=>playback.play({kind:'ending',node:s.node,route:s.route},()=>{})}/></div> : s.node==='final'? <div inert={!!panel||!!motion} aria-hidden={!!panel} className="communicationHost"><CommunicationView state={s} onFinish={()=>act({label:'查看结局',next:'ending'})}/></div> : <main inert={!!panel||!!motion} aria-hidden={!!panel} className="game"><div className="sceneheading"><span><GlossValue value={scene?.name}/></span><small>发现 <GlossValue value={s.clues.length}/>/12</small></div><div className={'sceneFrame ' + (task ? 'toolScene' : stepped ? 'steppedScene' : '')+(separateChoices?' hasSceneChoices':'')+(background?.id.startsWith('BG_HOME')||background?.id.startsWith('SCENE_HOME')?' familyDialogue':'')}><div className="archiveTrim" aria-hidden="true"><i className="archiveTape tapeTop"/><i className="archiveTape tapeBottom"/><i className="archiveBinding"/><i className="archivePencil"/></div><section className={'art ' + (assetOk ? '' : 'loadingArt')}>{background&&<img className="sceneBackground" src={background.url} onLoad={()=>setAssetOk(true)} onError={()=>{setAssetOk(false);setAssetFailed(true)}} alt={scene?.name}/>} {assetFailed&&<span role="alert" className="artLoadError">场景图片加载失败，请刷新重试。</span>}{((s.route==='B'&&oldhouseNodes.includes(s.node))||(s.route==='A'&&['pressure','cover','careDone'].includes(s.node)))&&<OldhouseLayers state={s} item={item} failures={fails} targets={task?.targets} disabled={!task||!!feedback||retry||!!motion} onDrop={drop} onSelect={setItem} fx={fx} motion={motion}/>}{!((s.route==='B'&&oldhouseNodes.includes(s.node))||(s.route==='A'&&['pressure','cover','careDone'].includes(s.node)))&&<SceneLayers state={s} line={currentLine} text={current} reaction={beats[beat]?.line===-1}/>}</section><GlossValue value={stepped && <div className="shotLabel"><GlossValue value={speaker === '现场记录' ? (scene?.name || '现场') : speaker}/></div>}/>{stepped&&s&&<SpeakerPortrait state={s} speaker={speaker} line={currentLine}/>}{objects.length>0&&<SceneObjects objects={objects} selected={selectedObject} onSelect={o=>{setSelectedObject(o.id);if(o.surface==='phone')setPanel('phone')}}/>}<section className="dialogue"><span className="eyebrow"><GlossValue value={task ? '行动目标' : '现场记录'}/></span>{stepped&&leadIn&&<p className="narration">{leadIn}</p>}<GlossValue value={(task ? [] : stepped ? [current] : (preview?.long === false ? scene?.text.slice(0, 2) : scene?.text))?.map((t, i) => <StoryText key={i} text={t}/>)}/><GlossValue value={task && !feedback && <><h2><GlossValue value={task.goal}/></h2><div className="toolHandling"><p className="instruction" aria-live="polite">{item?`已${item==='chair'?'拿起':'选中'}：${itemNames[item]}。点击或拖到目标。`:s.node==='block'?'画面与工具箱里的椅子是同一把。选物品，再点目标尝试。':'选择物品，再点击或拖到画面中的目标。'}</p>{item&&<button className="putBack" onClick={()=>setItem('')}>放回</button>}</div><div className="tools"><GlossValue value={task.items.map(t => <button aria-label={t.toUpperCase()} key={t} draggable={!retry && !motion} disabled={retry || !!motion} onDragStart={() => setItem(t)} onDragEnd={() => {if(!playback.isPlaying())setItem('')}} onClick={() => setItem(t)} aria-pressed={item === t}>{toolArt(t)?<img className="toolImage" src={toolArt(t)!.url} alt="" draggable={false}/>:<span className="itemPlaceholder">◇</span>}<GlossValue value={t.toUpperCase()}/></button>)}/></div></>}/><GlossValue value={task && feedback && <div className="feedback" role="status"><GlossValue value={feedbackPages[feedbackPage]||feedback}/>{feedbackPages.length>1&&<div className="toolFeedbackPager"><button disabled={feedbackPage===0} onClick={()=>setFeedbackPage(n=>n-1)}>上一页</button><span>{feedbackPage+1}/{feedbackPages.length}</span><button disabled={feedbackPage===feedbackPages.length-1} onClick={()=>setFeedbackPage(n=>n+1)}>下一页</button></div>}<GlossValue value={fx && <button onClick={() => setFx('')}>收起效果</button>}/></div>}/><GlossValue value={retry ? <button disabled={!!motion} onClick={() => { setS(previous=>previous?retryCheckpoint(previous):previous);setFails(0); setRetry(false); setFx(''); setItem(''); setFeedback('已恢复本任务检查点。'); }}>再试一次</button> : <div className="actions"><GlossValue value={task && feedback ? <button onClick={() => {setFeedback('');setFx('')}}>重新选择物品</button> : stepped && more ? <button onClick={() => setBeat(v => v + 1)}>继续 <span aria-hidden="true">▸</span></button> : !separateChoices&&actions(s).map(a => /[A-Za-z]/.test(a.label)?<EnglishOption key={a.label} text={a.label} onClick={()=>act(a)}/>:<button key={a.label} onClick={()=>act(a)}>{a.label}</button>)}/></div>}/></section>{separateChoices&&<SceneChoices actions={available} onAction={act} objects={objects} selected={selectedObject} onReset={()=>setSelectedObject('')}/>}</div></main>}/>
    {motion&&<div className="motionHud" role="status"><span>{({door:'门的压力',chair:'椅子支撑',bottle:'投瓶与落点',rose:'花瓣落下',pillow:'枕头受挤',failure:'物品结果',pressure:'按压',cover:'覆盖',retreat:'暂避与照护',exit:'右门离屋',ending:'雾中灯光'})[motion.kind]}</span><progress max={1} value={motion.progress} aria-label="动画进度"/><button autoFocus key={motion.id} onClick={playback.finish}>跳过动画</button></div>}
    <GlossValue value={panel && <div className="veil"><Modal kind={panel} onClose={() => { setPanel(''); setFeedback(''); }}><GlossValue value={panel === 'new' ? <><h2>建立新周目？</h2><p>当前继续进度将被新周目替换。</p><button onClick={() => { setS(initial()); setPanel(''); setFeedback(''); }}>确认新周目</button></> : panel === 'settings' ? <><h2>阅读设置</h2><label><input type="checkbox" checked={large} onChange={e => setLarge(e.target.checked)}/>放大文字</label><label><input type="checkbox" checked={reduce} onChange={e => setReduce(e.target.checked)}/>减少动效</label></> : panel === 'phone' ? <><h2>手机 · 已读资料</h2><GlossValue value={s && s.node !== 'home' && s.node !== 'road' ? <Messages compact initialChannel={s?.node==='medical'?'medical':'private'} medical={!!s&&["medical","uncle","routeA","house","block","divert","pressure","cover","careDone","timeline","reunion","final","ending"].includes(s.node)}/> : <p>暂无消息。</p>}/>{s&&['phone','recheck','medical'].includes(s.node)&&!more&&<SceneChoices actions={available} onAction={act}/>}</> : ['evidence', 'review', 'evidence-detail'].includes(panel) ? <EvidenceView state={s} review={panel === 'review'} initialDetail={preview?.panel === 'evidence-detail' ? (preview.detailId || 1) : undefined}/> : panel === 'infer' ? <InferenceView id={infer} selected={support} setSelected={setSupport} onAnswer={submit} feedback={feedback}/> : panel === 'gloss' ? <GlossDemo tool={preview?.glossTool || false}/> : panel === 'vocab' ? <VocabularyWorkspace words={s?.words||[]}/> : <HintWorkspace state={s} goal={task?.goal} level={hint} onHint={()=>setHint(hint+1)}/>}/></Modal></div>}/></div>;
}
