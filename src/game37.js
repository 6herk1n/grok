/* ================= RANDOM MISSIONS (Build R): the mission board at every 📟 terminal =================
   Generated missions run on the side-quest engine in game16 (src:'side', qid 'rm:…'). Each mission carries its own
   definition (q.rdef), which is registered into SQD when it is accepted and again when a save loads (rmReg via normQuests).
   Types: eliminate (named elite), clear a site (packs + leader), retrieve, survey, escort, hold the line (waves),
   supply run (gather Build Q materials into the parts bag, then hand them in).
   P.rmis {v:1, writs, day, dayDone, wk, wkN, wkClaimed, total, offers:[…]} : old saves load with an empty board state.
   Writs ✦ come from every finished mission (classic contracts too); the first mission of the day pays a bonus and
   10 missions a week complete the weekly contract. Rewards stay at Rare at most, below raid and dungeon loot. */
const RM={tab:'board',remote:false,_rem:false};
const RM_N=3,RM_WEEK=10,RM_VER=1;
const RM_KINDS=new Set(['hunt','kill','fetch','scan','escort','defend','gather']);
const RM_FOCUS={bal:{n:'⚖ Balanced',cr:1,xp:1,item:0.5,rar:0},cr:{n:'¢ Credits',cr:1.6,xp:0.7,item:0,rar:0},xp:{n:'✨ XP',cr:0.7,xp:1.5,item:0,rar:0},gear:{n:'🎁 Gear',cr:0.7,xp:0.7,item:1,rar:10}};
const RM_TYPES={hunt:{n:'Eliminate',ic:'💀',x:0.35,c:1,min:1},clear:{n:'Clear the site',ic:'⚔',x:0.5,c:1.25,min:2},fetch:{n:'Retrieve',ic:'📦',x:0.35,c:1,min:1},
  survey:{n:'Survey',ic:'🖐',x:0.3,c:1,min:1},escort:{n:'Escort',ic:'🛡',x:0.4,c:1.1,min:3},defend:{n:'Hold the line',ic:'🏰',x:0.45,c:1.15,min:4},gather:{n:'Supply run',ic:'⛏',x:0.25,c:1.5,min:1}};
const RM_NM={who:['Skarn Velloway','Mags Tessit','Orrin Quorl','Dray Holloway','Ysolde Brack','Nerro Pike','Hollis Crane','Vett Marrow','Juno Seck','Callo Dunmere'],
  ep:['the Gutter-King','Rustjaw','Two-Knives','the Pale','Saltmouth','Cinderhand','the Quiet','Blackwick','Gravelvoice','the Tallyman'],
  site:['Dry Gulch Camp','Rustwater Pumphouse','Old Relay Seven','Saltburn Depot','Coyle\'s Dig','Hollow Silo','Shatterline Yard','Gantry Nine','Brannock Wells','the Tinroof Cut'],
  obj:['Sealed data core','Signal beacon part','Coolant canister','Survey cache','Medical crate','Prototype coil','Water purifier','Black-box recorder'],
  scan:['Relay mast','Sensor spike','Seismic post','Weather station'],
  def:['Water pump','Signal relay','Supply cache','Drill rig'],
  esc:['Surveyor Anneke Roe','Medic Tobin Hale','Courier Jessa Marr','Engineer Dov Krane','Archivist Lio Penn','Prospector Wren Adder'],
  cl:['A Combine office','The Water Guild','A caravan syndicate','Halden\'s Rest council','An independent surveyor','The Prospectors\' Union']};
/* ---------- state ---------- */
function normRmis(o){o=o&&typeof o==='object'?o:{};const n=v=>Math.max(0,Math.floor(+v||0));
  const offers=Array.isArray(o.offers)?o.offers.filter(x=>x&&RM_TYPES[x.type]&&typeof x.oid==='string').slice(0,RM_N):[];
  return {v:RM_VER,writs:n(o.writs),day:n(o.day),dayDone:o.dayDone?1:0,wk:n(o.wk),wkN:Math.min(RM_WEEK,n(o.wkN)),wkClaimed:o.wkClaimed?1:0,total:n(o.total),offers,timed:!!o.timed,focus:RM_FOCUS[o.focus]?o.focus:'bal'};}
function rmFields(s){return {rmis:normRmis(s.rmis)};}
const rmi=()=>P.rmis||(P.rmis=normRmis(null));
function rmTick(){const r=rmi(),now=Date.now();const d=periodStart(now,'day').getTime(),w=periodStart(now,'week').getTime();
  if(r.day!==d){r.day=d;r.dayDone=0;}if(r.wk!==w){r.wk=w;r.wkN=0;r.wkClaimed=0;}return r;}
// re-register a saved random mission's definition (called from normQuests); false = drop it
function rmReg(q){try{if(!q||!q.rm||!q.rdef||typeof q.qid!=='string'||q.qid.slice(0,3)!=='rm:')return false;const d=q.rdef;
    if(!Array.isArray(d.steps)||!d.steps.length||!d.steps.every(s=>s&&RM_KINDS.has(s.k)))return false;
    d.id=q.qid;d.g='mterm';d.gate=null;d.lv=d.lv|0||1;d.rew=d.rew||{x:0.3,c:1};d.rm=d.rm||{};SQD[q.qid]=d;q.giver='mterm';return true;}catch(e){return false;}}
const isRm=q=>!!(q&&q.rm&&q.src==='side');
const rmList=()=>(P.quests||[]).filter(isRm);
/* ---------- terminals: Halden's Rest + every open hub outpost ---------- */
function rmTerms(){const L=[{x:TERMINAL.x,z:TERMINAL.z,n:'Halden\'s Rest'}];for(const H of HUBS)if(H.term&&gateOpen(H.id))L.push({x:H.term.x,z:H.term.z,n:(H.o&&H.o.name)||H.tn});return L;}
function rmNearTerm(){let b=null,bd=1e18;const p=P.pos||{x:0,z:0};for(const t of rmTerms()){const d=(t.x-p.x)**2+(t.z-p.z)**2;if(d<bd){bd=d;b=t;}}return b;}
GV.mterm={id:'mterm',name:'a mission terminal',role:'📟 any terminal',get x(){return rmNearTerm().x;},get z(){return rmNearTerm().z;}};
KIND_ICON.gather='⛏';
/* ---------- generation ---------- */
function rmTypesAt(x,z){const d=Math.hypot(x,z);if(xmBand0(x,z)>=0)return xrTypes(xmLv(x,z)).slice(0,4);if(d>870&&Math.max(Math.abs(x),Math.abs(z))>560)return xrTypes(x>0?41:31).slice(0,4);
  return d>620?['burrower','shambler','frostcaller']:d>400?['stalker','brute']:d>160?['mauler','raider']:d>105?['raider']:['skitter'];}
function rmSpot(eLv){const xr=eLv>=31,rim=!xr&&eLv>=21&&gateOpen('hoarlight'),hi=!rim&&!xr&&eLv>=11&&gateOpen('farwatch');
  let p;if(xr)p=xrSpot(eLv);else if(rim)p=rimeSpot(eLv);else if(hi)p=gloamSpot(eLv);else{const r=clamp(55+eLv*13,55,195)+rand(-10,15),a=rand(0,Math.PI*2);p={x:Math.cos(a)*r,z:Math.sin(a)*r};}
  const s=freeSpot(p.x,p.z,1.5);return {x:s[0],z:s[1],reg:xr?xrRegionName(eLv):rim?'the Rimefall Expanse':hi?'the Duskcrown Highlands':'the Reach'};}
function rmTypeOk(t){return P.level>=RM_TYPES[t].min;}
function rmGenOffer(){const ks=Object.keys(RM_TYPES).filter(rmTypeOk);const type=pick(ks);
  const o={oid:'o'+uid(),type,who:pick(RM_NM.who),ep:pick(RM_NM.ep),site:pick(RM_NM.site),obj:pick(RM_NM.obj),scan:pick(RM_NM.scan),def:pick(RM_NM.def),esc:pick(RM_NM.esc),cl:pick(RM_NM.cl),mt:pick(['ore','bloom','scrap'])};return o;}
function rmFill(){const r=rmTick();while(r.offers.length<RM_N)r.offers.push(rmGenOffer());return r.offers;}
function rmLv(){const D=MDIFF[clamp(mprefs().diff|0,0,4)];return clamp(P.level+D.lv,1,MAXLVL);}
function rmTitle(o){const T=RM_TYPES[o.type];return T.ic+' '+(o.type==='hunt'?'Eliminate: '+o.who:o.type==='clear'?'Clear: '+o.site:o.type==='fetch'?'Retrieve: '+o.obj:o.type==='survey'?'Survey: '+o.site:o.type==='escort'?'Escort: '+o.esc:o.type==='defend'?'Hold: the '+o.def+' at '+o.site:'Supply run: '+MATS[o.mt].n);}
function rmDesc(o,eLv){const D=MDIFF[clamp(mprefs().diff|0,0,4)];const n=Math.max(2,Math.round(4*D.cnt));
  switch(o.type){case 'hunt':return o.cl+' wants '+o.who+', called "'+o.ep+'", dead. A named elite with bodyguards, Lv '+(eLv+1)+'.';
    case 'clear':return 'Hostiles have dug in at '+o.site+'. Clear '+Math.max(3,Math.round(5*D.cnt))+' of them, then their leader. Lv '+eLv+'.';
    case 'fetch':return o.cl+' lost a '+o.obj.toLowerCase()+' near '+o.site+'. Guarded, Lv '+eLv+'.';
    case 'survey':return 'Activate three '+o.scan.toLowerCase()+'s around '+o.site+' (stand close for 2 s each). Lv '+eLv+' area.';
    case 'escort':return 'Walk '+o.esc+' out to '+o.site+'. Expect two ambushes, Lv '+eLv+'.';
    case 'defend':return 'Hold the '+o.def.toLowerCase()+' at '+o.site+' against '+(2+((mprefs().diff|0)>=3?1:0))+' waves, Lv '+eLv+'.';
    case 'gather':return 'Bring '+rmGatherN(o)+'× '+MATS[o.mt].n+' (QL '+rmGatherQ(eLv)+'+) from your 🧰 parts bag. Gather it from glowing nodes in the wilds.';}return '';}
function rmGatherN(o){const D=MDIFF[clamp(mprefs().diff|0,0,4)];return Math.max(3,Math.round(5*D.cnt));}
function rmGatherQ(eLv){return Math.max(1,(eLv-5)*5);}
function rmReward(o,eLv){const mp=mprefs(),D=MDIFF[clamp(mp.diff|0,0,4)],F=RM_FOCUS[rmi().focus]||RM_FOCUS.bal,T=RM_TYPES[o.type];const tm=rmi().timed?1.25:1;
  const L=clamp(P.level,1,MAXLVL);const cr=Math.round((20+eLv*14)*T.c*D.rew*F.cr*tm),xp=Math.round(xpNeed(L)*T.x*D.rew*F.xp*tm);
  const item=F.item>=1||(F.item>0&&((mp.diff|0)>=2||(o.oid.charCodeAt(o.oid.length-1)%2===0)));
  return {cr,xp,item,rar:D.rar+F.rar,writs:1+Math.floor((mp.diff|0)/2)+(rmi().timed?1:0),pref:mp.pref,diff:mp.diff|0,focus:rmi().focus,timed:rmi().timed};}
function rmBuild(o){const eLv=rmLv(),mp=mprefs(),D=MDIFF[clamp(mp.diff|0,0,4)];const sp=rmSpot(eLv),at=[sp.x,sp.z];const ty=rmTypesAt(sp.x,sp.z);const n=k=>Math.max(k,Math.round(k*D.cnt));
  const dist=Math.hypot(sp.x-P.pos.x,sp.z-P.pos.z);const travel=Math.round(clamp(dist/5*1.5+90,120,540));const timed=rmi().timed;let steps;
  switch(o.type){
    case 'hunt':steps=[Hu(o.who,pick(ty),at)];break;
    case 'clear':steps=[Ki(ty,Math.max(3,Math.round(5*D.cnt)),at),Hu(o.site+' boss',pick(ty),at)];break;
    case 'fetch':steps=[F(o.obj,at,1+((mp.diff|0)>=3?1:0),{t:pick(ty),n:n(2)})];break;
    case 'survey':{const a0=rand(0,6.28);const pts=[0,1,2].map(i=>freeSpot(sp.x+Math.cos(a0+i*2.1)*14,sp.z+Math.sin(a0+i*2.1)*14,1.2,true));steps=[Sc(o.scan,pts)];break;}
    case 'escort':{const fr=freeSpot(P.pos.x+rand(-6,6),P.pos.z+rand(-6,6),1.6,true);steps=[Es(o.esc,fr,at,{t:pick(ty),n:n(2)})];break;}
    case 'defend':steps=[Df(o.def,at,2+((mp.diff|0)>=3?1:0),ty,n(2))];break;
    case 'gather':steps=[{k:'gather',mt:o.mt,n:rmGatherN(o),ql:rmGatherQ(eLv)}];break;}
  if(timed)steps.forEach((s,i)=>{s.time=i===0?(o.type==='gather'?600:travel+(o.type==='defend'?120:o.type==='escort'?150:60)):180;});
  const R=rmReward(o,eLv);const qid='rm:'+uid();
  return {id:qid,t:rmTitle(o).replace(/^\S+ /,''),lv:eLv,g:'mterm',txt:rmDesc(o,eLv),steps,rew:{x:0.3,c:1},rm:Object.assign({type:o.type,reg:sp.reg},R)};}
/* ---------- accept / claim / abandon / reroll ---------- */
function rmAccept(oid){const r=rmTick();const i=r.offers.findIndex(o=>o.oid===oid);if(i<0)return null;if(DUN){warn('Not inside an instance');return null;}
  if(qFull()){warn('Mission log full ('+MAXQ+'). Finish or abandon one first.');return null;}
  const o=r.offers[i];const d=rmBuild(o);const q={id:'q'+uid(),src:'side',rm:1,qid:d.id,rdef:d,title:d.t,giver:'mterm',lv:d.lv,step:0,stage:'active',track:true,path:[],t0:Date.now()};
  if(!rmReg(q))return null;P.quests.push(q);qStartStep(q);P.qfocus=q.id;r.offers.splice(i,1,rmGenOffer());
  SFX.quest();banner('MISSION ACCEPTED',d.t+' · '+d.rm.reg);log('🎲 <b>'+esc(d.t)+'</b>: '+esc(objText(q)));MAP.dirty=true;save();return q;}
function rmPackFull(){return P.inv.length>=24;}
function rmClaim(id){const q=rmList().find(x=>x.id===id);if(!q||q.stage!=='return')return false;if(RM.remote){warn('Claim at any 📟 mission terminal');return false;}
  const m=q.rdef.rm||{};if(m.item&&rmPackFull()){warn('Pack full: free a slot for the reward item first');return false;}
  let cr=m.cr|0,xp=m.xp|0;let t='';const it=m.item?missionReward({pref:m.pref||'any',diff:m.diff|0,rar:m.rar|0}):null;
  const bon=rmComplete();cr+=Math.round(cr*bon.mul);xp+=Math.round(xp*bon.mul);
  P.credits+=cr;gainXp(xp);rmi().writs+=(m.writs|0)+bon.writs;t='+'+cr+'¢  +'+xp+' XP  +'+((m.writs|0)+bon.writs)+' ✦';
  if(it){P.inv.push(it);t+='  +'+it.name;}
  qClearRT(q);P.quests.splice(P.quests.indexOf(q),1);delete SQD[q.qid];if(P.qfocus===id)P.qfocus=null;
  SFX.quest();banner('MISSION COMPLETE',q.title+(bon.txt?' · '+bon.txt:''));log('🎲 <b>'+esc(q.title)+'</b> complete. '+esc(t)+(bon.txt?' · '+esc(bon.txt):''));save();return true;}
// shared by random missions and classic contracts: daily first-completion bonus + weekly contract progress
function rmComplete(){const r=rmTick();r.total++;const out={mul:0,writs:0,txt:''};
  if(!r.dayDone){r.dayDone=1;out.mul=0.5;out.writs=3;out.txt='☀ Daily bonus: +50%, +3 ✦';}
  if(r.wkN<RM_WEEK){r.wkN++;if(r.wkN===RM_WEEK&&!r.wkClaimed){out.txt+=(out.txt?' · ':'')+'📅 Weekly contract done: claim it at a terminal';toast('📅 Weekly contract complete! Claim it at any 📟 terminal');}}
  return out;}
function rmClassicDone(m){const bon=rmComplete();const cr=Math.round((m.cr|0)*bon.mul),xp=Math.round((m.xp|0)*bon.mul);if(cr)P.credits+=cr;if(xp)gainXp(xp);const w=1+bon.writs;rmi().writs+=w;
  return '  +'+w+' ✦'+(bon.txt?'  '+bon.txt+(cr?' (+'+cr+'¢ +'+xp+' XP)':''):'');}
function rmWeekReward(){const L=clamp(P.level,1,MAXLVL);return {cr:Math.round((20+L*14)*6),xp:Math.round(xpNeed(L)*0.6),writs:15};}
function rmWeekClaim(){const r=rmTick();if(r.wkN<RM_WEEK||r.wkClaimed)return false;if(RM.remote){warn('Claim at any 📟 mission terminal');return false;}if(rmPackFull()){warn('Pack full: free a slot for the reward item first');return false;}
  const w=rmWeekReward();const it=genItem(clamp(P.level,1,MAXLVL),Math.random()<0.5?'weapon':pick(ASLOTS),2);r.wkClaimed=1;P.credits+=w.cr;gainXp(w.xp);r.writs+=w.writs;P.inv.push(it);
  SFX.quest();banner('WEEKLY CONTRACT','+'+w.cr+'¢  +'+w.xp+' XP  +'+w.writs+' ✦  +'+it.name);log('📅 Weekly contract paid: '+esc(it.name));save();return true;}
function rmAbandonFee(){return 5+P.level*2;}
function rmAbandon(q){const fee=Math.min(P.credits,rmAbandonFee());P.credits-=fee;delete SQD[q.qid];if(fee)toast('Mission abandoned · −'+fee+'¢ cancellation fee');return true;}
function rmRerollCost(){return 10+P.level*4;}
function rmReroll(writ){const r=rmTick();if(writ){if(r.writs<1){warn('No ✦ writs');return false;}r.writs--;}else{const c=rmRerollCost();if(P.credits<c){warn('Not enough credits ('+c+'¢)');return false;}P.credits-=c;}
  r.offers=[];rmFill();SFX.ui();toast('🎲 New missions on the board');save();return true;}
/* ---------- writ exchange ---------- */
const RM_SHOP=[{id:'elix',n:'Elixir crate',d:'2 crafted elixirs (Vigor, Keen or Wardskin, 10 min)',ic:'⚗️',w:5},{id:'core',n:'Emberheart Core',d:'Rare forging material (Build Q tradeskills)',ic:'🔥',w:6},
  {id:'mats',n:'Material bundle',d:'6 ore + 6 duskpetal at your level QL',ic:'🧰',w:4},{id:'gear',n:'Requisition: Rare gear',d:'A Rare weapon or armour piece at your level',ic:'🎁',w:20}];
function rmBuy(id){const s=RM_SHOP.find(x=>x.id===id);const r=rmi();if(!s)return false;if(r.writs<s.w){warn('Need '+s.w+' ✦ writs');return false;}const L=clamp(P.level,1,MAXLVL),ql=clamp(L*5,1,IMPQL_MAX());
  if(s.id==='gear'){if(rmPackFull()){warn('Pack full');return false;}P.inv.push(genItem(L,Math.random()<0.5?'weapon':pick(ASLOTS),2));}
  else if(s.id==='elix'){for(let i=0;i<2;i++){const k=pick(['vigor','keen','ward']);P.consum[k]=(P.consum[k]||0)+1;}}
  else if(s.id==='core')bagAdd({kind:'mat',mt:'core',ql},1);else{bagAdd({kind:'mat',mt:'ore',ql},6);bagAdd({kind:'mat',mt:'bloom',ql},6);}
  r.writs-=s.w;SFX.loot();toast('✦ '+s.n+' acquired');save();return true;}
/* ---------- gather steps (Build Q materials) ---------- */
function rmMatCount(mt,ql){return bag().filter(x=>x.kind==='mat'&&x.mt===mt&&x.ql>=ql).reduce((a,x)=>a+x.n,0);}
function rmMatTake(mt,ql,n){const L=bag().filter(x=>x.kind==='mat'&&x.mt===mt&&x.ql>=ql).sort((a,b)=>a.ql-b.ql);for(const x of L){if(n<=0)break;const k=Math.min(n,x.n);bagTake(x.id,k);n-=k;}return n<=0;}
function rmStepText(q,st,s){if(st.k==='gather')return 'Gather '+MATS[st.mt].n+' QL '+st.ql+'+ '+Math.min(st.n,rmMatCount(st.mt,st.ql))+'/'+st.n+' (🧰 parts bag)';return '';}
function rmStepTarget(q,st){if(st.k!=='gather')return null;let b=null,bd=1e18;for(const n of (typeof QN!=='undefined'?QN.list:[])){const N=QNODE[n.t];if(!N||!N.mt.includes(st.mt))continue;const d=(n.x-P.pos.x)**2+(n.z-P.pos.z)**2;if(d<bd){bd=d;b=n;}}
  return b?{x:b.x,z:b.z,label:QNODE[b.t].n}:null;}
function updRm(){if(state!=='play')return;
  // Check every frame. The sim clamps each frame to 0.05s, so a half-second timer needs ten frames;
  // a slow browser can show 5/5 in the objective and still not have banked that time.
  for(const q of rmList()){if(q.stage!=='active')continue;const st=curStep(q);if(!st||st.k!=='gather')continue;
    if(rmMatCount(st.mt,st.ql)>=st.n&&rmMatTake(st.mt,st.ql,st.n)){toast('📦 Packed '+st.n+'× '+MATS[st.mt].n+' for delivery');qAdvance(q,'deliver to a terminal');}}}
/* ---------- UI ---------- */
function rmOpenBoard(){if(panelOpen==='term'){closePanel();return;}RM._rem=true;openTerminal();}
function rmChip(on,act,extra,label){return `<button class="${on?'on':''}" data-act="${act}" ${extra}>${label}</button>`;}
function rmHead(){const r=rmTick();const w=rmWeekReward();
  return `<div class="tabs rmtabs">${rmChip(RM.tab==='board','rmtab','data-t="board"','🎲 Mission board')}${rmChip(RM.tab==='writs','rmtab','data-t="writs"','✦ Writ exchange')}<span class="rmw">✦ <b>${r.writs}</b></span></div>
  <div class="rmstat"><span class="${r.dayDone?'done':'up'}">☀ Daily bonus ${r.dayDone?'✔ claimed today':'ready: first mission today +50% & +3 ✦'}</span>
  <span>📅 Weekly contract <b>${r.wkN}/${RM_WEEK}</b>${r.wkClaimed?' ✔ paid':r.wkN>=RM_WEEK?' · <b class="up">ready!</b>':''} <small style="opacity:.7">(+${w.writs} ✦, Rare gear, ${w.cr}¢)</small></span></div>`;}
function rmOfferHtml(o){const eLv=rmLv();const R=rmReward(o,eLv);const full=qFull();
  return `<div class="mis rmo"><span class="obadge rmb">🎲 Mission</span> <b>${esc(rmTitle(o))}</b><p>${esc(rmDesc(o,eLv))}</p>
  <div>Reward: <b>${R.cr}¢</b> · <b>${R.xp} XP</b> · <b>${R.writs} ✦</b>${R.item?' · '+(R.pref&&R.pref!=='any'?MPREF[R.pref].replace(/^\S+ /,'').toLowerCase()+' (likely)':'gear or implant'):''}${R.timed?' · ⏱ timed':''}</div>
  <button class="sbtn" style="margin-top:8px" data-act="${full?'qfull':'rmacc'}" data-o="${o.oid}">${full?'Mission log full ('+MAXQ+')':'Accept'}</button></div>`;}
function rmFocusHtml(){const r=rmTick();return `<div class="mis msl"><div class="h4" style="margin:0 0 4px">Reward focus</div><div class="tabs" style="margin:0">${Object.keys(RM_FOCUS).map(k=>rmChip(r.focus===k,'rmfoc','data-f="'+k+'"',RM_FOCUS[k].n)).join('')}${rmChip(r.timed,'rmtime','','⏱ Timed '+(r.timed?'ON':'off'))}</div>
    <div style="font-size:12px;opacity:.75;margin-top:4px">Timed missions pay +25% and +1 ✦; the clock pauses while a panel is open. Difficulty, preferred reward and focus apply to the missions on the board.</div></div>`;}
function rmBoardHtml(){const r=rmTick();rmFill();let h='';
  const ready=rmList().filter(q=>q.stage==='return');
  if(ready.length||(r.wkN>=RM_WEEK&&!r.wkClaimed)){h+=`<div class="h4">Ready to claim</div>`;
    if(r.wkN>=RM_WEEK&&!r.wkClaimed)h+=`<div class="mis rmo"><b>📅 Weekly contract complete</b><p>${RM_WEEK} missions this week.</p>${RM.remote?'<div class="down">Claim at any 📟 terminal</div>':'<button class="sbtn" data-act="rmweek">Claim weekly reward</button>'}</div>`;
    h+=ready.map(q=>{const m=q.rdef.rm||{};return `<div class="mis rmo"><span class="obadge rmb">Done</span> <b>${esc(q.title)}</b><p>${m.cr}¢ · ${m.xp} XP · ${m.writs} ✦${m.item?' · item':''}${r.dayDone?'':' · ☀ +50% daily bonus'}</p>${RM.remote?'<div class="down">Claim at any 📟 terminal</div>':`<button class="sbtn" data-act="rmclaim" data-q="${q.id}">Claim reward</button>`}</div>`;}).join('');}
  const act=rmList().filter(q=>q.stage!=='return');if(act.length)h+=`<div style="font-size:13px;opacity:.8;margin:4px 0">Active: ${act.map(q=>esc(q.title)+' · '+esc(objText(q))).join('<br>')}</div>`;
  h+=`<div class="h4">Missions for you · Lv ${rmLv()}${qFull()?' (mission log full: '+MAXQ+')':''}</div>`+rmRef().offers.map(rmOfferHtml).join('');
  h+=`<div class="rmrr"><button class="sbtn alt" data-act="rmrr">🎲 Reroll board · ${rmRerollCost()}¢</button><button class="sbtn alt" data-act="rmrrw" ${r.writs<1?'disabled':''}>🎲 Reroll · 1 ✦</button><button class="sbtn alt" data-act="rmjump">⚙ Difficulty &amp; reward ↓</button></div>`;
  return h;}
const rmRef=()=>rmi();
function rmWritHtml(){const r=rmi();return rmHead()+`<div class="stats">Earn ✦ writs from every finished mission (classic contracts too), the daily bonus and the weekly contract.</div>`+
  RM_SHOP.map(s=>`<div class="mis rmo"><b>${s.ic} ${s.n}</b> <span style="opacity:.75">· ${s.w} ✦</span><p>${s.d}</p><button class="sbtn" data-act="rmbuy" data-s="${s.id}" ${r.writs<s.w?'disabled':''}>Buy · ${s.w} ✦</button></div>`).join('');}
function rmAct(a,b){const D=b.dataset;
  if(a==='rmtab'){RM.tab=D.t;RM._rem=RM.remote;openTerminal();return true;}
  if(a==='rmacc'){if(rmAccept(D.o))closePanel();else{RM._rem=RM.remote;openTerminal();}return true;}
  if(a==='rmclaim'){rmClaim(D.q);RM._rem=RM.remote;openTerminal();return true;}
  if(a==='rmweek'){rmWeekClaim();RM._rem=RM.remote;openTerminal();return true;}
  if(a==='rmrr'||a==='rmrrw'){rmReroll(a==='rmrrw');RM._rem=RM.remote;openTerminal();return true;}
  if(a==='rmfoc'){rmi().focus=RM_FOCUS[D.f]?D.f:'bal';save();RM._rem=RM.remote;openTerminal();return true;}
  if(a==='rmtime'){rmi().timed=!rmi().timed;save();RM._rem=RM.remote;openTerminal();return true;}
  if(a==='rmjump'){const e=document.querySelector('#rmset');if(e)e.scrollIntoView({block:'start'});return true;}
  if(a==='rmbuy'){rmBuy(D.s);RM._rem=RM.remote;openTerminal();return true;}
  return false;}
// minimap: random-mission objectives get a cyan diamond (the tracked ring from game16 still applies)
function rmMini(c,tf){if(DUN||FLAT)return;for(const q of rmList()){if(q.stage==='failed')continue;const t=qTarget(q);if(!t)continue;const s=tf(t.x,t.z);c.fillStyle=q.stage==='return'?'#6dff8a':'#59f0ff';c.strokeStyle='#000';c.lineWidth=1.5;
  c.beginPath();c.moveTo(s[0],s[1]-5);c.lineTo(s[0]+4,s[1]);c.lineTo(s[0],s[1]+5);c.lineTo(s[0]-4,s[1]);c.closePath();c.fill();c.stroke();}}
function rmExports(){return {RM,RM_TYPES,RM_FOCUS,RM_SHOP,RM_WEEK,normRmis,rmFields,rmi,rmTick,rmReg,rmList,rmTerms,rmNearTerm,rmGenOffer,rmFill,rmBuild,rmAccept,rmClaim,rmComplete,rmWeekClaim,rmReroll,rmRerollCost,rmAbandonFee,rmBuy,rmMatCount,rmOpenBoard,rmBoardHtml,rmTypesAt,rmSpot,updRm,rmLv};}
