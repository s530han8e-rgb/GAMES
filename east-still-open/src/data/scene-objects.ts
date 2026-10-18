import type {Action,State} from '../game/engine';
export type SceneObject={id:string;name:string;xy:[number,number];actions:Action[];surface?:'phone'};
// Presentation only: associate existing actions with visible objects. Never award evidence here.
export function sceneObjects(s:State,available:Action[]):SceneObject[]{
 const node=s.node;
 const definitions:Record<string,[string,string,number,number,string[],('phone'|undefined)?][]>= {
  home:[['bag','布袋',1180,470,['Offer','Check']],['door','门',1460,310,['Hold']]],
  phone:[['phone','手机',1120,300,[], 'phone']],
  family:[['departure','出发方向',1430,300,[]]],
  bench:[['resident','长椅居民',1190,465,['Ask']],['surroundings','周围',780,240,['Look']],['east','东行方向',1480,240,['Continue']]],
  bench2:[['resident','长椅居民',1190,465,['Help','Stay']],['east','东行方向',1480,240,['Leave']]],
  outside:[['blood','入口血迹',1220,450,['Follow']],['people','入口居民',680,380,['Observe']],['entrance','主入口',970,270,['Enter']]],
  desk:[['records','登记桌记录',400,450,['Compare']],['staff','登记处周围',800,300,['Look']],['entrance','内部入口',1100,280,['Leave']]],
  inside:[['people','现场居民',790,450,['Compare']],['turn','失控者',1240,440,['Watch']],['exit','出口',1460,200,['Leave']]],
  recheck:[['phone','手机通知',1100,280,['Check'],'phone'],['uncle','寻找方向',1450,340,['Continue']]],
  medical:[['phone','医疗消息',1120,300,[],'phone']],
  uncle:[['uncle','舅舅',500,380,['Compare','Leave']],['house','老人屋方向',1350,280,['Check']]],
  routeA:[['care','舅舅的伤口',500,380,[]]],
  house:[['door','内开门',310,350,[]]],
  retreat:[['hide','柜后暂避',1190,370,[]]],
  careDone:[['exit',s.route==='B'?'右侧出口':'撤离方向',1450,310,[]]],
  exit:[['shed','回棚方向',1450,310,[]]],
  reunion:[['phone','联络手机',1150,300,[]]],
  timeline:[['wound','伤口与时间',500,380,['Compare']],['phone','联络手机',1300,300,['Continue']]],
 };
 return (definitions[node]||[]).map(([id,name,x,y,prefixes,surface])=>({id,name,xy:[x,y] as [number,number],surface,actions:available.filter(a=>!prefixes.length||prefixes.some(p=>a.label.startsWith(p)))})).filter(o=>o.actions.length>0);
}
