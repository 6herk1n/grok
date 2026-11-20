/* ================= BUILD Q: GATHERING + TRADESKILL RANKS (Fieldcraft · Distilling · Forging) =================
   Builds on the Stage 3 parts bag and Tradeskills panel (game8): new materials stack in the same bag (no pack slots).
   - Fieldcraft ⛏: gather ore veins, duskpetal blooms and salvage heaps in the wilds; salvage pack loot into parts.
   - Distilling ⚗️: tonics and stims (the trader's 3-min buffs, plus three crafted-only 10-min elixirs).
   - Forging 🔨: Uncommon gear at up to your level (Rare with an Emberheart Core). Never Epic: dungeon, team and raid
     rewards stay the best gear. Ranks 1-100, colour-coded skill-up chance (orange / yellow / green / grey).
   Recipes: starters known, the rest learned at a hub (Halden's Rest / outposts) for credits or as boss drops.
   Nodes: one possible node per 48 m world cell (hashed, so the world is the same every session), built only within
   ~75 m of you, regrowing 8 minutes after you gather it. Saved per character in P.craft (old saves: rank 1, no materials). */
Object.assign(MATS,{ore:{n:'Rustvein Ore',ic:'🪨'},bloom:{n:'Duskpetal',ic:'🌺'},core:{n:'Emberheart Core',ic:'🔥'}});
Object.assign(CONSUM,{
  vigor:{name:'Vigor Elixir',icon:'❤️‍🔥',dur:600,craftOnly:true,mods:L=>({hp:20+L*6,sta:2+Math.floor(L/2)}),price:L=>0,desc:'+Max health and +Stamina for 10 min (crafted)'},
  keen:{name:'Keen Elixir',icon:'🎯',dur:600,craftOnly:true,mods:L=>({crit:3,power:5}),price:L=>0,desc:'+3% crit and +5% power for 10 min (crafted)'},
  ward:{name:'Wardskin Elixir',icon:'🛡️',dur:600,craftOnly:true,mods:L=>({dr:5,body:10+L}),price:L=>0,desc:'5% less damage taken and +Body Dev for 10 min (crafted)'}});
const QTS={field:{n:'Fieldcraft',ic:'⛏',d:'Gathering and salvage'},distill:{n:'Distilling',ic:'⚗️',d:'Tonics, gels and elixirs'},forge:{n:'Forging',ic:'🔨',d:'Weapons and armour'}};
const QMAX=100,QREGROW=8*60*1000,QCELL=48,QVIEW=75;
const QREC=[
  {id:'d_stims',ts:'distill',n:'Field Stims',ic:'💉',rk:1,mats:[['bloom',2]],out:{stims:2},src:'start'},
  {id:'d_brew',ts:'distill',n:'Iron Brew',ic:'🍺',rk:5,mats:[['bloom',2],['ore',1]],out:{c:'brew',n:2},src:'start'},
  {id:'d_grip',ts:'distill',n:'Grip Gel',ic:'🖐️',rk:10,mats:[['bloom',2],['scrap',1]],out:{c:'grip',n:2},src:'vendor'},
  {id:'d_focus',ts:'distill',n:'Focus Stim',ic:'🧪',rk:15,mats:[['bloom',2],['shard',1]],out:{c:'focus',n:2},src:'vendor'},
  {id:'d_tonic',ts:'distill',n:'Neuro Tonic',ic:'🧠',rk:20,mats:[['bloom',2],['shard',1]],out:{c:'tonic',n:2},src:'vendor'},
  {id:'d_stride',ts:'distill',n:'Strider Gel',ic:'🏃',rk:25,mats:[['bloom',2],['circuit',1]],out:{c:'stride',n:2},src:'vendor'},
  {id:'d_artisan',ts:'distill',n:'Artisan Draught',ic:'🛠️',rk:30,mats:[['bloom',3],['shard',1]],out:{c:'artisan',n:2},src:'vendor'},
  {id:'d_vigor',ts:'distill',n:'Vigor Elixir',ic:'❤️‍🔥',rk:40,mats:[['bloom',3],['ore',2]],out:{c:'vigor',n:2},src:'drop'},
  {id:'d_keen',ts:'distill',n:'Keen Elixir',ic:'🎯',rk:60,mats:[['bloom',3],['core',1]],out:{c:'keen',n:2},src:'drop'},
  {id:'d_ward',ts:'distill',n:'Wardskin Elixir',ic:'🛡️',rk:75,mats:[['bloom',3],['ore',2],['core',1]],out:{c:'ward',n:2},src:'drop'},
  {id:'f_wpn',ts:'forge',n:'Forged Weapon',ic:'⚔️',rk:1,mats:[['ore',3],['circuit',1]],out:{gear:'weapon',r:1},src:'start'},
  {id:'f_arm',ts:'forge',n:'Forged Armour',ic:'🥋',rk:1,mats:[['ore',3],['scrap',1]],out:{gear:'armour',r:1},src:'start'},
  {id:'f_wpn2',ts:'forge',n:'Masterwork Weapon',ic:'🗡️',rk:40,mats:[['ore',4],['shard',2],['core',1]],out:{gear:'weapon',r:2},src:'drop'},
  {id:'f_arm2',ts:'forge',n:'Masterwork Armour',ic:'🛡',rk:40,mats:[['ore',4],['shard',2],['core',1]],out:{gear:'armour',r:2},src:'drop'}];
const QSTART=QREC.filter(r=>r.src==='start').map(r=>r.id);
const qPrice=r=>30+r.rk*10;
const QARM=['head','armor','hands','legs','feet'];
const CRQ={rec:'d_stims',slot:'armor',sel:null};

/* ---------- save data ---------- */
function normCraft(c){c=c&&typeof c==='object'?c:{};const rk={};for(const k in QTS)rk[k]=clamp(Math.floor(+((c.rk||{})[k])||1),1,QMAX);
  const known=[...new Set([...QSTART,...(Array.isArray(c.known)?c.known:[]).filter(id=>QREC.some(r=>r.id===id))])];
  const gt={};const now=Date.now();if(c.gt&&typeof c.gt==='object')for(const k in c.gt){const t=+c.gt[k];if(t>0&&now-t<QREGROW&&t<=now+60000)gt[k]=t;}
  return {v:1,rk,known,gt,n:Math.max(0,c.n|0)};}
function craftFields(s){return {craft:normCraft(s.craft)};}
const qc=()=>P.craft||(P.craft=normCraft(null));
const qRank=ts=>qc().rk[ts]||1;
const qKnows=id=>qc().known.includes(id);
// skill-up: d = rank - difficulty. Below the difficulty (gathering/forging above your rank) always counts double.
function qColor(rank,req){const d=rank-req;return d<0?'red':d<5?'orange':d<15?'yellow':d<25?'green':'grey';}
const QCOL={red:'#ff6b5a',orange:'#ff9a3c',yellow:'#ffd25a',green:'#6dff8a',grey:'#8a8a8a'};
const QCH={red:1,orange:1,yellow:0.6,green:0.25,grey:0};
function qSkillUp(ts,req,roll){const c=qc();const r=c.rk[ts];if(r>=QMAX)return 0;const col=qColor(r,req);const ch=QCH[col];const x=roll!=null?roll:Math.random();if(x>=ch)return 0;
  const g=Math.min(QMAX-r,col==='red'?2:1);c.rk[ts]=r+g;toast(QTS[ts].ic+' '+QTS[ts].n+' rank '+c.rk[ts]+'!');log(QTS[ts].ic+' <b>'+QTS[ts].n+'</b> rose to rank <b>'+c.rk[ts]+'</b>');return g;}

/* ---------- materials ---------- */
function qHave(mt,minq){return bag().filter(o=>o.kind==='mat'&&o.mt===mt&&o.ql>=(minq||1)).reduce((a,o)=>a+o.n,0);}
function qTake(mt,n,minq){const L=bag().filter(o=>o.kind==='mat'&&o.mt===mt&&o.ql>=(minq||1)).sort((a,b)=>a.ql-b.ql);let need=n;const qs=[];
  for(const o of L){if(need<=0)break;const k=Math.min(need,o.n);qs.push(o.ql);bagTake(o.id,k);need-=k;}return qs.length?Math.min(...qs):0;}
function qBestQL(mt){return bag().filter(o=>o.kind==='mat'&&o.mt===mt).reduce((a,o)=>Math.max(a,o.ql),0);}

/* ---------- recipes ---------- */
const qRec=id=>QREC.find(r=>r.id===id)||QREC[0];
function qForgeLvl(r){const ore=qBestQL('ore');return clamp(Math.min(P.level,qRank('forge')+5,Math.floor(ore/4)),0,100);}
function qCheck(id){const r=qRec(id);const out={r,lines:[],ok:true,known:qKnows(r.id)};const line=(ok,t)=>{out.lines.push([ok,t]);if(!ok)out.ok=false;};
  if(!out.known){out.ok=false;out.learn=r.src==='vendor';out.price=qPrice(r);out.hub=qInHub();return out;}
  const rank=qRank(r.ts);line(rank>=r.rk,QTS[r.ts].n+' rank '+r.rk+' <span style="opacity:.75">(you have '+rank+')</span>');
  let minq=1;if(r.out.gear){const L=qForgeLvl(r);out.lvl=L;minq=Math.max(1,Math.round(L*5*0.8));out.req=Math.max(r.rk,L-5);
    line(L>=1,'Item level '+(L||'–')+' <span style="opacity:.75">(your level, Forging rank + 5 and your best ore QL ÷ 4 decide it)</span>');
    line(P.inv.length<24,'Free pack slot for the finished item');}
  else out.req=r.rk;
  out.minq=minq;
  for(const [mt,n] of r.mats){const q=r.out.gear&&mt==='ore'?minq:1;const h=qHave(mt,q);line(h>=n,n+'× '+MATS[mt].ic+' '+MATS[mt].n+(q>1?' QL '+q+'+':'')+' <span style="opacity:.75">(you have '+h+')</span>');}
  out.col=qColor(rank,out.req);return out;}
function qCraft(id,roll){const c=qCheck(id);const r=c.r;if(!c.ok){warn(c.known?'Requirements not met':'You have not learned this recipe');return null;}
  for(const [mt,n] of r.mats)qTake(mt,n,mt==='ore'&&r.out.gear?c.minq:1);
  let msg='',res=null;
  if(r.out.stims){P.stims+=r.out.stims;msg='+'+r.out.stims+' Med-stims';res={stims:r.out.stims};}
  else if(r.out.c){P.consum[r.out.c]=(P.consum[r.out.c]||0)+r.out.n;msg='+'+r.out.n+' '+CONSUM[r.out.c].name;res={c:r.out.c,n:r.out.n};}
  else if(r.out.gear){const slot=r.out.gear==='weapon'?'weapon':(QARM.includes(CRQ.slot)?CRQ.slot:'armor');const it=genItem(c.lvl,slot,r.out.r);
    it.crafted=P.name;it.value=Math.max(1,Math.round(it.value*0.4));P.inv.push(it);msg=it.name+' ('+RAR[it.r].n+', Lv '+it.lvl+')';res=it;}
  else if(r.out.furn){aptGain(r.out.furn,'craft');msg=FURN[r.out.furn].n+' (sent to your apartment)';res={furn:r.out.furn};}
  qc().n++;qSkillUp(r.ts,c.req,roll);SFX.loot();toast(r.ic+' '+r.n+': '+msg);log(r.ic+' Crafted <b>'+esc(r.n)+'</b>: '+esc(msg));save();return res;}
function qInHub(){if(DUN||FLAT)return false;const g=regionAt(P.pos.x,P.pos.z);return g.id==='town'||OUTPOSTS.some(o=>o.id===g.id);}
function qLearn(id,free){const r=qRec(id);if(qKnows(r.id))return false;if(!free){if(r.src!=='vendor'){warn('Found on dungeon bosses');return false;}if(!qInHub()){warn('Schematics are sold in Halden\'s Rest and the outposts');return false;}
    const pr=qPrice(r);if(P.credits<pr){warn('Not enough credits');return false;}P.credits-=pr;}
  qc().known.push(r.id);SFX.quest();toast('📜 Learned: '+r.n);log('📜 Learned the <b>'+esc(r.n)+'</b> schematic ('+QTS[r.ts].n+')');save();return true;}

/* ---------- salvage (pack loot -> parts) ---------- */
const qSalvOk=it=>!!it&&(it.kind==='gear'||it.kind==='imp')&&!it.uniq&&!it.set&&!it.fac&&!isEquipped(it)&&P.inv.includes(it);
function qSalvYield(it){const q=clamp(itemQL(it),1,IMPQL_MAX());const r=Math.min(it.r||0,3);const main=it.kind==='imp'||it.slot==='weapon'?'circuit':'scrap';
  const L=[[main,1+r]];if(r>=2)L.push(['shard',1]);return {q,L,core:r>=3?0.35:0};}
function qSalvage(id,roll){const it=P.inv.find(x=>x.id===id);if(!qSalvOk(it)){warn('That item cannot be salvaged');return null;}const y=qSalvYield(it);
  P.inv.splice(P.inv.indexOf(it),1);const got=[];for(const [mt,n] of y.L){bagAdd({kind:'mat',mt,ql:y.q},n);got.push(n+'× '+MATS[mt].n);}
  if((roll!=null?roll:Math.random())<y.core){bagAdd({kind:'mat',mt:'core',ql:y.q},1);got.push('1× '+MATS.core.n);}
  qSkillUp('field',Math.round(y.q/5)-5);CRQ.sel=null;SFX.loot();toast('♻️ Salvaged: '+got.join(', '));log('♻️ Salvaged <b>'+esc(it.name)+'</b> (QL '+y.q+'): '+got.join(', '));save();return got;}

/* ---------- boss drops: Emberheart Cores and drop-only schematics ---------- */
function qOnKill(e){if(SIMP||!e||!(e.boss||e.dyna)||e.isCore)return;
  if(Math.random()<0.5){const q=clamp(e.lv*5,1,IMPQL_MAX());bagAdd({kind:'mat',mt:'core',ql:q},1);log('🔥 Salvaged an <b>Emberheart Core</b> (QL '+q+')');}
  const un=QREC.filter(r=>r.src==='drop'&&!qKnows(r.id)&&r.rk<=Math.max(40,(e.lv||1)+10));if(un.length&&Math.random()<0.2){const r=pick(un);qLearn(r.id,true);banner('📜 SCHEMATIC FOUND',r.n+' · '+QTS[r.ts].n+' rank '+r.rk);}}

/* ---------- gathering nodes ---------- */
const QNODE={ore:{n:'Rustvein Ore',sh:'Ore',verb:'Mine',ic:'🪨',mt:['ore']},bloom:{n:'Duskpetal',sh:'Bloom',verb:'Pick',ic:'🌺',mt:['bloom']},heap:{n:'Salvage Heap',sh:'Heap',verb:'Search',ic:'🔩',mt:['scrap','circuit']}};
function qHash(a,b){let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function qNodeLv(b,x,z,h){if(b.outer&&b.lvAt)return clamp(b.lvAt(x,z),1,100);const lo=b.lv[0],hi=b.lv[1];return clamp(lo+Math.floor(h*(hi-lo+1)),1,100);}
function nodeAt(ix,iz){const h0=qHash(ix,iz);if(h0>0.55)return null;const x=(ix+0.2+0.6*qHash(ix+911,iz))*QCELL,z=(iz+0.2+0.6*qHash(ix,iz+577))*QCELL;
  if(Math.abs(x)>HALF-30||Math.abs(z)>HALF-30)return null;const p={x,z};if(inTown(p))return null;if(heightAt(x,z)<WATER_Y+0.4)return null;
  const q=new V3(x,0,z);collide(q,1.2);if(Math.hypot(q.x-x,q.z-z)>0.05)return null;
  const bi=biomeIdx(x,z),b=BIOMES[bi];const h1=qHash(ix+31,iz+17);const wet=/oasis|fen/.test(b.id),junk=/scrap/.test(b.id);
  const t=junk?(h1<0.5?'heap':h1<0.8?'ore':'bloom'):wet?(h1<0.55?'bloom':h1<0.85?'ore':'heap'):(h1<0.45?'ore':h1<0.8?'bloom':'heap');
  return {key:ix+':'+iz,t,x,z,lv:qNodeLv(b,x,z,qHash(ix+5,iz+3)),b:b.id};}
const QN={list:[],g:null,acc:0,px:1e9,pz:1e9,who:null};
function qNodeUp(n){const t=qc().gt[n.key];return !(t&&Date.now()-t<QREGROW);}
function qBuildMesh(n){const g=new THREE.Group();const y=heightAt(n.x,n.z);g.position.set(n.x,y,n.z);const k=qHash(n.x|0,n.z|0)*6.28;g.rotation.y=k;
  const glow=n.lv>=60?0xff7a3a:n.lv>=30?0x59c8ff:0x8dff8a;
  if(n.t==='ore'){part(g,geoIco,M(0x5a5048),0,0.55,0,1.1,0.8,1.0);part(g,geoIco,MB(glow),0.45,0.95,0.2,0.28,0.45,0.28);part(g,geoIco,MB(glow),-0.35,0.85,-0.3,0.22,0.38,0.22);}
  else if(n.t==='bloom'){part(g,geoCone,M(0x3c6a2c),0,0.45,0,0.35,0.9,0.35);part(g,geoSphere,MB(0xff7ad0),0,1.05,0,0.32,0.26,0.32);part(g,geoSphere,MB(0xffb0e8),0.35,0.8,0.1,0.2,0.16,0.2);part(g,geoSphere,MB(0xff7ad0),-0.3,0.75,-0.15,0.2,0.16,0.2);}
  else{part(g,geoBox,M(0x6a6a70),0,0.3,0,1.4,0.6,1.0);const b2=part(g,geoBox,M(0x7c6a58),0.3,0.75,-0.1,0.8,0.4,0.6);b2.rotation.y=0.6;part(g,geoBox,MB(0x59c8ff),-0.35,0.7,0.25,0.25,0.25,0.25);}
  g.userData.qn=n.key;return g;}
function qClear(){for(const n of QN.list)if(n.m&&QN.g)QN.g.remove(n.m);QN.list=[];QN.px=QN.pz=1e9;}
function qRefresh(){if(!QN.g){QN.g=new THREE.Group();scene.add(QN.g);}const px=P.pos.x,pz=P.pos.z;QN.px=px;QN.pz=pz;
  const want=new Map();const r=Math.ceil(QVIEW/QCELL);const cx=Math.floor(px/QCELL),cz=Math.floor(pz/QCELL);
  for(let ix=cx-r;ix<=cx+r;ix++)for(let iz=cz-r;iz<=cz+r;iz++){const n=nodeAt(ix,iz);if(n&&Math.hypot(n.x-px,n.z-pz)<QVIEW&&qNodeUp(n))want.set(n.key,n);}
  QN.list=QN.list.filter(o=>{if(want.has(o.key)){want.delete(o.key);return true;}QN.g.remove(o.m);return false;});
  for(const n of want.values()){n.m=qBuildMesh(n);QN.g.add(n.m);QN.list.push(n);}}
function updCraftQ(dt){if(SIMP)return;QN.acc+=dt;if(QN.acc<0.5)return;QN.acc=0;const hide=state!=='play'||!!DUN||FLAT;
  if(QN.g)QN.g.visible=!hide;if(hide)return;if(QN.who!==activeId){QN.who=activeId;qClear();}
  if(Math.hypot(P.pos.x-QN.px,P.pos.z-QN.pz)>6)qRefresh();
  for(const n of QN.list)if(n.m){const s=1+0.06*Math.sin(T*3+n.x);n.m.children[1].scale.y=(n.t==='ore'?0.45:n.t==='bloom'?0.26:0.25)*s;}}
const QMC={ore:'#9dffb0',bloom:'#ff8ad8',heap:'#7fd0ff'};
function qMini(c,tf){for(const n of QN.list){const q=tf(n.x,n.z);c.fillStyle=QMC[n.t];c.strokeStyle='#000';c.lineWidth=1.5;c.beginPath();c.moveTo(q[0],q[1]-5);c.lineTo(q[0]+5,q[1]);c.lineTo(q[0],q[1]+5);c.lineTo(q[0]-5,q[1]);c.closePath();c.fill();c.stroke();}}
function gatherInteract(p){if(DUN||FLAT)return null;let best=null,bd=3.2;for(const n of QN.list){const d=Math.hypot(p.x-n.x,p.z-n.z);if(d<bd){bd=d;best=n;}}
  if(!best)return null;const N=QNODE[best.t];return {k:'gather',n:best,label:'⛏ '+N.verb+' '+N.sh+' · Lv '+best.lv};}
function gatherNode(n,roll){if(!n||!qNodeUp(n))return null;const N=QNODE[n.t];const req=Math.max(1,n.lv-5);const rank=qRank('field');
  const q=clamp(n.lv*5+randi(-2,2),1,IMPQL_MAX());let cnt=rank<req?1:1+(Math.random()<0.5?1:0)+(rank>=req+25?1:0);const got=[];
  const mt=N.mt.length>1?(Math.random()<0.6?N.mt[0]:N.mt[1]):N.mt[0];bagAdd({kind:'mat',mt,ql:q},cnt);got.push(cnt+'× '+MATS[mt].n);
  if(n.t!=='heap'&&Math.random()<0.08){bagAdd({kind:'mat',mt:'shard',ql:q},1);got.push('1× '+MATS.shard.n);}
  qc().gt[n.key]=Date.now();if(n.m&&QN.g)QN.g.remove(n.m);QN.list=QN.list.filter(o=>o!==n);
  qSkillUp('field',req,roll);SFX.loot();floatText(new V3(n.x,heightAt(n.x,n.z)+1.6,n.z),'+'+got.join(', '),'info');log(N.ic+' Gathered (QL '+q+'): '+got.join(', '));save();return got;}
function gatherDo(n){if(n.k!=='gather')return false;if(inCombat&&inCombat()){warn('Too dangerous: finish the fight first');return true;}gatherNode(n.n);return true;}

/* ---------- Tradeskills panel: 📜 Recipes and ♻️ Salvage tabs ---------- */
function qRankBar(ts){const r=qRank(ts);return `<div class="qrk"><span>${QTS[ts].ic} <b>${QTS[ts].n}</b> ${r}/${QMAX}</span><span class="qbar"><i style="width:${r}%"></i></span></div>`;}
function qRecRow(r){const k=qKnows(r.id);const rank=qRank(r.ts);const col=k?qColor(rank,r.rk):'grey';const sub=k?(rank<r.rk?'Needs rank '+r.rk:'Rank '+r.rk+' · '+r.mats.map(([m,n])=>n+'× '+MATS[m].n).join(' + ')):(r.src==='vendor'?'🔒 Learn at a hub · '+qPrice(r)+'¢':'🔒 Dungeon boss drop');
  return `<button class="item${r.id===CRQ.rec?' sel':''}" data-act="qrec" data-r="${r.id}"><span class="ico">${r.ic}</span><span><div class="nm" style="color:${k?QCOL[col]:'#9a8f84'}">${esc(r.n)}</div><div class="st">${sub}</div></span></button>`;}
function qOutText(r){if(r.out.furn){const F=FURN[r.out.furn];return F.ic+' '+F.n+': '+F.k+' furniture, comfort +'+F.cf+'. Goes to your apartment storage; place it from the 🏠 Home table.';}if(r.out.stims)return r.out.stims+' Med-stims (heal in a fight: 🧪 quick button or Q)';if(r.out.c){const C=CONSUM[r.out.c];const m=C.mods(P.level);return r.out.n+'× '+C.icon+' '+C.name+': '+Object.keys(m).map(x=>'+'+m[x]+(x==='crit'||x==='power'||x==='dr'?'%':'')+' '+(x==='dr'?'damage reduction':STATN[x]||x)).join(' · ')+' for '+Math.round(C.dur/60)+' min';}
  return (r.out.r===2?'Rare':'Uncommon')+' '+(r.out.gear==='weapon'?'weapon for your profession':'armour piece')+' at up to your level. Crafted gear never beats dungeon, team or raid rewards.';}
function qRecHtml(){const r=qRec(CRQ.rec);const c=qCheck(r.id);
  let left=qRankBar('field')+qRankBar('distill')+qRankBar('forge');
  for(const ts of ['distill','forge'])left+=`<div class="h4">${QTS[ts].ic} ${QTS[ts].n}</div>`+QREC.filter(x=>x.ts===ts).map(qRecRow).join('');
  left+=`<div class="stats" style="opacity:.8;margin-top:6px">Name colour = chance to gain a rank: <b style="color:${QCOL.orange}">orange</b> always, <b style="color:${QCOL.yellow}">yellow</b> often, <b style="color:${QCOL.green}">green</b> sometimes, <b style="color:${QCOL.grey}">grey</b> never.</div>`;
  let right=`<div class="mis"><b>${r.ic} ${esc(r.n)}</b> <span style="opacity:.75">· ${QTS[r.ts].n}</span><p>${qOutText(r)}</p>`;
  if(r.out.gear==='armour')right+=`<div class="h4">Armour slot</div><div class="chips">${QARM.map(s=>`<button class="chip${s===CRQ.slot?' on':''}" data-act="qslot" data-s="${s}">${SLOTN[s]}</button>`).join('')}</div>`;
  if(!c.known)right+=`<div style="margin-top:6px">${r.src==='vendor'?(c.hub?'Sold here for <b>'+c.price+'¢</b> (you have '+P.credits+'¢).':'Schematic sold in Halden\'s Rest and the outposts for <b>'+c.price+'¢</b>.'):'Drop-only schematic: dungeon and named bosses sometimes carry it.'}</div>`;
  else right+=`<div class="h4" style="margin-top:8px">Requirements</div>${c.lines.map(l=>rqLine(l[0],l[1])).join('')}`;
  right+=`</div>`;
  return `<div class="cols"><div>${left}</div><div>${right}</div></div>`;}
function qSalvHtml(){const L=P.inv.filter(qSalvOk);const sel=L.find(x=>x.id===CRQ.sel);
  let left=qRankBar('field')+`<div class="h4">♻️ Salvage pack items into parts</div>`+(L.map(it=>{const y=qSalvYield(it);return itemRow(it,`<span class="pr" style="color:#cfcfcf">${y.L.map(([m,n])=>n+MATS[m].ic).join(' ')} QL ${y.q}</span>`,it.id===CRQ.sel,'qsel');}).join('')||'<div style="opacity:.6">Nothing to salvage. Unequipped weapons, armour and implants in your pack can be broken down (not dungeon uniques, sets or faction gear).</div>');
  const right=`<div class="mis"><b>⛏ Gathering</b><p>Glowing <b>ore veins</b> 🪨, <b>duskpetal blooms</b> 🌺 and <b>salvage heaps</b> 🔩 grow all over the wilds (not in towns or dungeons). Walk up and tap <b>⛏ Mine / Pick / Search</b> (or press F/E). A node regrows about 8 minutes after you gather it.</p><p>Material QL ≈ node level × 5. Nodes above your Fieldcraft rank still give 1 material and teach you faster.</p>${sel?`<p>Selected: <b>${esc(sel.name)}</b></p>`:''}</div>`;
  return `<div class="cols"><div>${left}</div><div>${right}</div></div>`;}
function qBar(){let ic,nm,sub,act,ok,lbl;
  if(CR.tab==='salv'){const it=P.inv.find(x=>x.id===CRQ.sel&&qSalvOk(x));ic='♻️';nm=it?esc(it.name):'Salvage';sub=it?qSalvYield(it).L.map(([m,n])=>n+'× '+MATS[m].n).join(' + '):'Pick an item below';act='qsalv';ok=!!it;lbl=it?'Salvage':'Pick an item';}
  else{const c=qCheck(CRQ.rec);const r=c.r;ic=r.ic;nm=esc(r.n);sub=c.known?(c.lvl?'Item level '+c.lvl:''):r.src==='vendor'?'Schematic · '+c.price+'¢':'Dungeon boss drop';
    if(!c.known&&c.learn&&c.hub){act='qlearn';ok=P.credits>=c.price;lbl=ok?'Learn ('+c.price+'¢)':'Need '+c.price+'¢';}
    else if(!c.known){act='noop';ok=false;lbl=c.learn?'Learn at a hub':'Not learned';}
    else{act='qcraft';ok=c.ok;lbl=c.ok?'Craft':'Requirements not met';}}
  return `<div class="craftbar" id="craftBar"><span class="cbi">${ic}</span><span class="cbn"><b>${nm}</b>${sub?`<small>${sub}</small>`:''}</span><button class="sbtn${ok?'':' locked'}" data-act="${act}" id="craftGo">${lbl}</button></div>`;}
function qAct(a,b){const D=b.dataset;
  if(a==='qrec'){CRQ.rec=D.r;openCraft();}else if(a==='qslot'){CRQ.slot=D.s;openCraft();}else if(a==='qcraft'){qCraft(CRQ.rec);openCraft();}
  else if(a==='qlearn'){qLearn(CRQ.rec);openCraft();}else if(a==='qsel'){CRQ.sel=D.id;openCraft();}else if(a==='qsalv'){qSalvage(CRQ.sel);openCraft();}
  else return false;return true;}
function craftQExports(){return {QTS,QREC,QNODE,CRQ,normCraft,craftFields,qc,qRank,qKnows,qColor,qSkillUp,qHave,qCheck,qCraft,qLearn,qInHub,qForgeLvl,qSalvOk,qSalvYield,qSalvage,qOnKill,nodeAt,qRefresh,get QN(){return QN;},gatherInteract,gatherNode,gatherDo,updCraftQ,qRecHtml,qSalvHtml,qBar,QREGROW,QCELL};}
