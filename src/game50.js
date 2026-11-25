/* ================= CONDUIT SPLICE (2026-11-25, Claude; AO Fixer grid-access nanos, own names) =================
   Glintrunner Weaves (normal Weave Disk drops / trader) that reach the Conduit network from wherever you stand:
   - Safe line 'splice' (Conduit Splice Lv 12, 45s cast / Conduit Phase Lv 35, 25s): out of combat only, no penalty.
   - Emergency line 'jackin' (Reckless Jack-in Lv 20, 6s / Breakneck Jack-in Lv 45, 3s): works in combat and the cast is not
     broken by damage, but you arrive on 1 health and 0 energy. 10-minute recharge.
   Flow: cast -> the Conduit map opens from your position -> pick a node -> stand still while the cast runs (moving cancels;
   the safe cast is also broken by damage) -> normal Conduit transit. Init% shortens the cast. Energy and the recharge are
   spent only when the cast completes, so cancelling costs nothing. No separate team versions: allies already warp to you
   when you travel (updAlly). Dungeons can't be reached. SPLICE = the pending splice (map open), cleared on close/travel. */
const SPLICE_DEF={splice:{n:'Conduit Splice',lvl:12,cast:45,cost:30,cd:180},splice2:{n:'Conduit Phase',lvl:35,cast:25,cost:40,cd:180},
  jackin:{n:'Reckless Jack-in',lvl:20,cast:6,cost:40,cd:600,em:1},jackin2:{n:'Breakneck Jack-in',lvl:45,cast:3,cost:50,cd:600,em:1}};
for(const id in SPLICE_DEF){const d=SPLICE_DEF[id],line=d.em?'jackin':'splice';
  WEAVES[id]={id,line,tier:id===line?1:2,prof:'runner',lvl:d.lvl,name:d.n,icon:d.em?'⚡':'🔀',cost:d.cost,cd:d.cd,range:0,needTarget:false,kind:'splice',fam:'util',cast:d.cast,em:!!d.em,
    desc:d.em?`Emergency escape: a ${d.cast}s cast that works in combat and isn't broken by damage. Pick any discovered Conduit node; you arrive on 1 health and 0 energy. 10-minute recharge.`
      :`Splice into the Conduit network from anywhere: pick any discovered node, then hold still for a ${d.cast}s cast (damage breaks it). Out of combat only, no penalty. 3-minute recharge.`};
  WEAVES[id].req=wreq('runner',d.lvl);}
let SPLICE=null;
const _nodeByIdSplice=nodeById;
nodeById=function(id){if(id==='__splice')return {id:'__splice',name:'Your position',x:P.pos.x,z:P.pos.z};return _nodeByIdSplice(id);};
function spliceCastTime(ab){return Math.max(1,ab.cast*(1-clamp((S&&S.init)||0,-50,50)/100));}
function spliceCan(ab){if(P.dead||state!=='play')return false;if(DUN){warn('The Conduit can\'t reach you in here');return false;}
  if(!ab.em&&T-P.lastCombat<5){warn('Can\'t splice into the Conduit while in combat');return false;}if(P.transit)return false;
  if((P.cds[ab.id]||0)>T){warn(ab.name+' is recharging');return false;}if(P.en<ab.cost){warn('Not enough Vyre energy');return false;}return true;}
const _useAbilitySplice=useAbility;
useAbility=function(idx){const ab=idx>=0?abDef(barIds()[idx]):null;if(!ab||ab.kind!=='splice')return _useAbilitySplice.apply(this,arguments);
  if(syncLocked(ab)||!spliceCan(ab))return false;if(P.mount)dismount();if(P.cast)cancelCast();
  SPLICE={id:ab.id};tone(520,0.25,'sine',0.04,1200);openConduit('__splice');return true;};
function spliceGo(ab,id){const lc=P.lastCombat;if(ab.em)P.lastCombat=-1e9;const ok=conduitTravel(id);
  if(!ok){P.lastCombat=lc;return false;}P.en=Math.max(0,P.en-ab.cost);P.cds[ab.id]=T+ab.cd;
  if(ab.em)setTimeout(()=>{if(P.dead)return;P.hp=1;P.en=0;warn('⚡ Jacked in hard: 1 health, no energy');},720);return true;}
const _conduitTravelSplice=conduitTravel;
conduitTravel=function(id){const S_=SPLICE;if(!S_||id==='__splice')return _conduitTravelSplice.apply(this,arguments);SPLICE=null;const ab=abDef(S_.id);
  const n=nodeById(id);if(!ab||!n||!knownNodes().includes(id)||!spliceCan(ab))return false;
  ringFx(P.pos.x,P.pos.z,ab.em?0xffd25a:0x5ff2ff,2.5,0.5);
  startCast((ab.em?'⚡ Jacking in → ':'🔀 Splicing → ')+n.name,spliceCastTime(ab),()=>{if(spliceCan(ab))spliceGo(ab,id);},{still:true});
  if(ab.em&&P.cast)P.cast.fragile=false;return true;};
const _closePanelSplice=closePanel;
closePanel=function(){const r=_closePanelSplice.apply(this,arguments);if(SPLICE)setTimeout(()=>{if(panelOpen!=='conduit')SPLICE=null;},0);return r;};
function spliceExports(){return {SPLICE_DEF,spliceCastTime,barIds:()=>barIds(),cancelCast:w=>cancelCast(w),nodeById:id=>nodeById(id),wvFam:w=>wvFam(w),get SPLICE(){return SPLICE;}};}
