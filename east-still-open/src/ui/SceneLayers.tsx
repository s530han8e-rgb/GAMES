import type{State}from'../game/engine';
import compositions from '../data/formal-scenes.json';
import {ArtWorld,ArtLayer,ArtCloseup} from './ArtWorld';
import {CareInset} from './OldhouseLayers';
import {roadArtPhase} from '../data/art';
type Composition={layers?:{file:string;scale:number;xy:number[]}[];contactShadows?:number[][]};
export function SceneLayers({state,line,text,reaction}:{state:State;line:number;text:string;reaction:boolean}){
 let key='';
 if(state.node==='bench'||state.node==='bench2')key='第三项_长椅_坐姿';
 if(state.node==='outside'&&reaction&&text.includes('重新坐下'))key='第三项_长椅_重新落座过渡';
 if(state.node==='road'&&!reaction&&line>0){const phase=roadArtPhase(line,text);key=phase==='reception'?line<3?'第三项_老人接待':'第三项_老人异常':phase==='conflict'?'第三项_老人冲突动作':'';}
 if(state.node==='uncle'&&text.includes('棚柱'))key='第三项_舅舅扶柱';
 if(state.node==='inside'||state.node==='recheck'&&reaction&&state.history.at(-1)==='Watch where the uncontrolled person turns.')key=state.clues.includes(8)?'第三项_安置点_转向观察':'第三项_安置点_进一步失控';
 const c=(compositions as Record<string,Composition>)[key];
 const speaker=text.match(/^([^：]{1,8})：/)?.[1];
 const suppressAction=speaker==='居民'&&key.startsWith('第三项_长椅')||speaker==='老人'&&key.startsWith('第三项_老人');
 const care=state.route==='A'&&(['pressure','cover','careDone'].includes(state.node)||state.node==='routeA'&&text.startsWith('你：'));
 const checking=state.node==='road'&&reaction&&state.history.includes('Check whether the bag is securely closed.')&&!text.startsWith('妈妈');
 const crop=state.node==='desk'?[150,425,455,515]:state.node==='outside'&&!reaction?[860,550,1170,850]:null;
 if(!c&&!care&&!checking&&!crop)return null;
 return <ArtWorld className="sceneLayers" attributes={{'data-composition':key}}>{(!suppressAction?c?.contactShadows:[])?.map(([x,y,rx=14,ry=2],i)=><svg key={i} className="layerShadow" width="1672" height="941"><ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#0a0c10" opacity=".35"/></svg>)}{(!suppressAction?c?.layers:[])?.map(l=><ArtLayer key={l.file} {...l} />)}{crop&&<div className="artCloseup" style={{left:state.node==='desk'?80:1030,top:90,width:520,height:state.node==='desk'?230:500}} aria-label="现场局部"><span className="cutawayLabel">{state.node==='desk'?'登记桌 · 敷料局部':'入口 · 原有血迹'}</span><div style={{position:'absolute',top:45,left:15,width:crop[2]-crop[0],height:crop[3]-crop[1],overflow:'hidden',transform:'scale(1.5)',transformOrigin:'0 0'}}><ArtLayer file={state.node==='desk'?'素材/BG_DESK_EMPTY_v02.png':'素材/BG_SHELTER_OUT_v01.png'} xy={[-crop[0],-crop[1]]}/></div></div>}{care&&<CareInset state={state}/>} {checking&&<ArtCloseup file="素材/CHAR_HERO_CHECK_BAG_v03_selected.png" panel={[980,80,490,570]} localScale={.36} localXY={[60,5]} label="袋口检查"/>}</ArtWorld>
}
