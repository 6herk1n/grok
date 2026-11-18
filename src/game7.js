/* ================= STAGE 2: breeds UI, factions + reputation, faction vendors, capturable towers + assaults,
   hover vehicles, ally/pet system (Dronewright bots, reusable for AI party members) ================= */

/* ---------- factions + reputation ---------- */
const FACTIONS={
  combine:{id:'combine',name:'Solace Combine',short:'Combine',col:'#5fa8ff',hex:0x3f8fff,glow:0x9fd0ff,icon:'🔷',bonus:'hp',pre:['Warden-pattern','Solace','Directive','Combine Elite'],
    desc:'The corporate colony authority. Order, contracts and heavy armour.',kill:'Ashborn Clanblades raided a Combine supply line. Put them down.',fetch:'Combine Intelligence lost a courier drone. Recover it before the clans do.'},
  ashborn:{id:'ashborn',name:'Ashborn Free Clans',short:'Ashborn',col:'#ff7a3a',hex:0xff5a2a,glow:0xffb070,icon:'🔥',bonus:'crit',pre:['Clanforged','Emberline','Free Clan','Ashwalker'],
    desc:'Rebel clans who want the Combine off Kessra. Speed, sabotage and sharp eyes.',kill:'A Combine Warden patrol is sweeping clan territory. Break it.',fetch:'A clan runner dropped stolen Combine plans out in the Reach. Bring them home.'},
  neutral:{id:'neutral',name:'Unaligned',short:'Unaligned',col:'#d8d2c4',hex:0xd8d2c4,glow:0xffffff,icon:'⚪',desc:'Work for both sides. Half reputation, faction gear up to Trusted only, and no tower wars.'}
};
const REP_TIERS=[{n:'Unknown',v:0},{n:'Friendly',v:100},{n:'Trusted',v:300},{n:'Honored',v:700},{n:'Exalted',v:1500}];
function fac(){const f=P.faction||(P.faction={side:null,rep:{}});if(!f.rep)f.rep={};f.rep.combine=f.rep.combine||0;f.rep.ashborn=f.rep.ashborn||0;f.changes=f.changes||0;f.caps=f.caps||0;return f;}
const isMember=s=>s==='combine'||s==='ashborn';
function repTier(side){const v=fac().rep[side]||0;let t=0;REP_TIERS.forEach((r,i)=>{if(v>=r.v)t=i;});return t;}
function gainRep(side,n,quiet){const f=fac();const me=f.side;if(!me||!FACTIONS[side]||side==='neutral')return 0;if(me!=='neutral'&&me!==side)return 0;
  const t0=repTier(side);f.rep[side]+=n;if(isMember(me)){const o=side==='combine'?'ashborn':'combine';f.rep[o]=Math.max(0,f.rep[o]-Math.round(n*0.25));}
  if(quiet)floatText(tmpV.set(P.pos.x,P.pos.y+2.6,P.pos.z),'+'+n+' rep','info');else log(`<b style="color:${FACTIONS[side].col}">+${n} ${FACTIONS[side].name} reputation</b>`);
  const t1=repTier(side);if(t1>t0){banner('REPUTATION: '+REP_TIERS[t1].n.toUpperCase(),FACTIONS[side].name+': new faction gear unlocked');SFX.level();}return n;}
function facCanUse(it){const me=fac().side;return me===it.fac||(me==='neutral'&&(it.ftier||1)<=2);}
function facUseNeed(it){const me=fac().side;return me==='neutral'?'Unaligned contractors can only use tiers 1-2':'members only';}
function joinFaction(side){const f=fac();if(!FACTIONS[side]||f.side===side)return false;if(!gateOpen('factions')){lockedMsg('factions',true);return false;}const cost=f.side?100+50*P.level:0;
  if(P.credits<cost){warn('Changing faction costs '+cost+'¢');return false;}P.credits-=cost;if(isMember(f.side))f.rep[f.side]=Math.floor(f.rep[f.side]*0.5);
  f.side=side;f.changes++;for(const k in SITES)deactivateSite(SITES[k]);if(ASSAULT)endAssault('silent');calcStats();
  banner(side==='neutral'?'UNALIGNED':'JOINED: '+FACTIONS[side].name.toUpperCase(),cost?'Paid '+cost+'¢ to change sides':'Welcome aboard');SFX.quest();save();return true;}

/* faction-flavoured contracts (half of all offers once you have a side) */
function facFlavour(m){const me=fac().side;if(!me||!gateOpen('factions')||Math.random()>=0.5)return m;const src=me==='neutral'?pick(['combine','ashborn']):me;const F=FACTIONS[src];
  m.fac=src;m.rep=Math.round((20+12*(m.diff|0)+3*m.lv)*(me==='neutral'?0.5:1));
  if(m.kind==='kill'){const et=src==='combine'?'clanblade':'warden';m.etype=et;m.title='⚑ '+F.short+': '+m.title.replace(/Cull: (\d+) .*$/,'Cull: $1 '+ETYPES[et].name+'s');m.desc=F.kill+' Camp marked on your map. Enemies Lv '+m.lv+'.';}
  else{m.title='⚑ '+F.short+': '+m.title;m.desc=F.fetch+' Guards Lv '+m.lv+'.';}return m;}

/* ---------- faction NPCs ---------- */
const NPCS=[{id:'registrar',name:'Registrar Hale',k:'registrar',x:-13,z:7,body:0xd8d2c4,acc:0x4f6b80,vis:0x5ff2ff,mark:0xffc85a},
  {id:'quartermaster',name:'Quartermaster Dov',k:'facvend',side:'combine',x:15,z:-5,body:0x3f6fb0,acc:0x22344d,vis:0xffc85a,mark:0x3f8fff},
  {id:'broker',name:'Clan Broker Ysa',k:'facvend',side:'ashborn',x:164.5,z:-11,body:0x8a3a22,acc:0x3a1a10,vis:0xffa040,mark:0xff5a2a}];
NPCS.forEach(n=>{n.R=buildHumanoid(n.body,n.acc,n.vis,null,{npc:1});n.R.g.position.set(n.x,heightAt(n.x,n.z),n.z);n.R.g.rotation.y=Math.atan2(-n.x,-n.z);
  n.mk=part(n.R.g,new THREE.OctahedronGeometry(1,0),MB(n.mark),0,2.65,0,0.2,0.32,0.2);scene.add(n.R.g);circles.push({x:n.x,z:n.z,r:0.6});});
function updNPCs(dt){for(const n of NPCS){n.R.anim(T,0,0);rigLod(n.R,Math.hypot(P.pos.x-n.x,P.pos.z-n.z)>30);n.mk.rotation.y+=dt*2;n.mk.position.y=2.65+Math.sin(T*2.5)*0.08;
  if(Math.hypot(P.pos.x-n.x,P.pos.z-n.z)<9){const tr=Math.atan2(P.pos.x-n.x,P.pos.z-n.z);let d=tr-n.R.g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));n.R.g.rotation.y+=d*Math.min(1,dt*4);}}}

/* ---------- faction vendor (tiered gear unlocked by reputation) ---------- */
const FSTOCK={};
function facify(it,side,t){const F=FACTIONS[side];it.fac=side;it.ftier=t;const pre=F.pre[Math.min(F.pre.length-1,t-1)];
  if(it.kind==='gear')it.name=pre+' '+(it.slot==='weapon'?WTYPES[it.wt].names[0]:AFAM[it.fam].names[it.slot][0]);else it.name=pre+' '+IMPDEF[it.slot].n+' Implant';
  if(F.bonus==='hp')it.bonus.push({s:'hp',v:Math.round((6+P.level*3)*t)});else it.bonus.push({s:'crit',v:t});it.value=Math.round(it.value*(1+0.3*t));return it;}
function facStock(side){const L=P.level;const st=FSTOCK[side];if(st&&st.lvl===L&&st.prof===P.prof)return st.items;const items=[];
  for(let t=1;t<=4;t++){const r=t===1?2:t===4?4:3;const lv=Math.min(MAXLVL,L+(t>=3?1:0));
    items.push(facify(genItem(lv,'weapon',r,{wt:PROF_WT[P.prof]}),side,t),facify(genItem(lv,t%2?'armor':'head',r,{fam:PROF_FAM[P.prof]}),side,t));
    if(t>=2)items.push(facify(genImplant(L*5+t*3,null,Math.min(3,r)),side,t));}
  FSTOCK[side]={lvl:L,prof:P.prof,items};return items;}
const fprice=it=>Math.round(it.value*3);
function repBar(side){const f=fac();const v=f.rep[side];const t=repTier(side);const nx=REP_TIERS[t+1];const k=nx?(v-REP_TIERS[t].v)/(nx.v-REP_TIERS[t].v):1;
  return `<div style="display:flex;justify-content:space-between;font-size:13px"><b style="color:${FACTIONS[side].col}">${FACTIONS[side].icon} ${FACTIONS[side].name}</b><span>${REP_TIERS[t].n} · ${v} rep${nx?' · next: '+nx.n+' at '+nx.v:''}</span></div><div class="repbar"><i style="width:${Math.round(k*100)}%;background:${FACTIONS[side].col}"></i></div>`;}
function openFacVendor(side){const F=FACTIONS[side];const me=fac().side;const npc=NPCS.find(n=>n.side===side);let h='';
  if(!me)h=`<div class="mis"><b>${esc(npc.name)}</b><p>"Not registered with anyone? I only deal with people who've picked a side, or say they haven't." Visit <b>Registrar Hale</b> in Halden's Rest to choose a faction.</p></div>`;
  else if(me!==side&&me!=='neutral')h=`<div class="mis"><b>${esc(npc.name)}</b><p>"${FACTIONS[me].name}? Get out of my sight." The ${F.name} won't trade with the other side.</p></div>`;
  else{const tier=repTier(side),maxT=me==='neutral'?2:4;h+=repBar(side)+`<div class="stats" style="margin:6px 0 10px">${F.desc} Earn reputation with ⚑ ${F.short} contracts at the mission terminal${me==='neutral'?' (half rate while Unaligned)':', by capturing and defending towers, and by killing the other side'}. Faction gear is ${me==='neutral'?'usable up to Trusted while Unaligned':'for '+F.name+' members only'}.</div>`;
    const items=facStock(side);for(let t=1;t<=4;t++){const ok=tier>=t&&t<=maxT;
      h+=`<div class="h4" style="margin-top:8px">${ok?'🔓':'🔒'} Tier ${t}: ${REP_TIERS[t].n} (${REP_TIERS[t].v} rep)${t>maxT?' · members only':''}</div>`;
      h+=items.filter(i=>i.ftier===t).map(it=>itemRow(it,ok?`<span class="pr">${fprice(it)}¢</span>`:`<span class="pr" style="color:#ff9a8a">🔒 ${t>maxT?'Members':REP_TIERS[t].n}</span>`,false,ok?'fbuy':'flock')).join('')||'<div style="opacity:.6">Sold out until you level up.</div>';}}
  if(me&&(me===side||me==='neutral'))h=`<div class="ltf" style="justify-content:flex-end">${sellJunkBtn()}<span style="color:#ffc85a;font-weight:800">${P.credits}¢</span></div>`+h;
  openPanel((side==='combine'?'🎖 COMBINE QUARTERMASTER':'🔥 ASHBORN CLAN BROKER'),h,'fvend');curFV=side;}
let curFV=null;
function facBuy(id){const side=curFV;const items=FSTOCK[side]&&FSTOCK[side].items;const it=items&&items.find(x=>x.id===id);if(!it)return false;const me=fac().side;
  if(!(me===side||me==='neutral')||repTier(side)<it.ftier||(me==='neutral'&&it.ftier>2)){warn('Needs '+REP_TIERS[it.ftier].n+' reputation');return false;}
  const pr=fprice(it);if(P.credits<pr){warn('Not enough credits');return false;}if(P.inv.length>=24){warn('Inventory full');return false;}
  P.credits-=pr;items.splice(items.indexOf(it),1);P.inv.push(it);SFX.coin();toast('Bought '+it.name);save();return true;}

/* ---------- registrar ---------- */
function openRegistrar(){const f=fac();const me=f.side;const cost=me?100+50*P.level:0;
  let h=`<div class="stats">Your faction: <b style="color:${me?FACTIONS[me].col:'#fff'}">${me?FACTIONS[me].icon+' '+FACTIONS[me].name:'None yet (choose below: the first choice is free)'}</b></div>`;
  h+='<div style="margin:10px 0">'+repBar('combine')+repBar('ashborn')+'</div>';
  h+='<div class="cols">'+['combine','ashborn','neutral'].map(s=>{const F=FACTIONS[s];return `<div class="mis" style="border-color:${F.col}55"><b style="color:${F.col}">${F.icon} ${F.name}</b><p>${F.desc}</p>${me===s?'<div class="up">✔ Current faction</div>':`<button class="sbtn" data-act="join" data-f="${s}">${me?'Switch ('+cost+'¢)':'Join (free)'}</button>`}</div>`;}).join('')+'</div>';
  h+=`<div class="stats" style="opacity:.8">Switching sides costs credits and halves your reputation with the side you leave. Members gain reputation from ⚑ faction contracts, tower captures and defences, and kills of the other side; they also lose a quarter of that with the other faction.</div>`;
  h+='<div class="h4" style="margin-top:12px">Tower war</div>'+towerListHtml();
  openPanel('⚑ FACTION REGISTRY',h,'reg');}

/* ---------- enemy factions + tower cores ---------- */
function buildWarden_v1(){const R=buildHumanoid(0x4f6b80,0x22344d,0x5ff2ff,0x2a2a2a);part(R.g,geoBox,M(0x3f8fff),0,2.05,0,0.5,0.14,0.5);return R;}
function buildClanblade_v1(){const R=buildHumanoid(0x8a3a22,0x3a1a10,0xffa040,0x3a2a22);part(R.g,geoCone,M(0xff5a2a),0,2.15,-0.05,0.3,0.4,0.3);return R;}
function buildTowerMesh_v1(col,glow){const g=new THREE.Group();const R={g};part(g,geoBox,M(0x4a4f57),0,4,0,1.6,8,1.6);part(g,geoBox,M(col),0,2.2,0,1.9,0.5,1.9);part(g,geoBox,M(col),0,5.6,0,1.9,0.5,1.9);
  for(let i=0;i<4;i++){const f=part(g,geoBox,M(0x3a3f47),Math.cos(i*1.571)*1.1,2.5,Math.sin(i*1.571)*1.1,0.25,5,0.6);f.rotation.y=-i*1.571;}
  R.crystal=part(g,new THREE.OctahedronGeometry(1,0),MB(glow),0,9.3,0,0.9,1.6,0.9);R.ring=part(g,new THREE.TorusGeometry(1.5,0.1,4,24),MB(col),0,9.3,0,1,1,1);R.ring.rotation.x=Math.PI/2;
  R.anim=(t)=>{R.crystal.rotation.y=t*1.4;R.ring.rotation.z=t*0.8;};return R;}
ETYPES.warden={name:'Combine Warden',hp:58,dmg:8,atkCd:1.7,range:18,speed:5,aggro:19,xp:1.35,ranged:true,hitR:0.7,h:1.9,build:buildWarden,scale:1};
ETYPES.clanblade={name:'Ashborn Clanblade',hp:62,dmg:8.5,atkCd:1.6,range:16,speed:5.2,aggro:19,xp:1.35,ranged:true,hitR:0.7,h:1.9,build:buildClanblade,scale:1};
ETYPES.coreC={name:'Combine Tower Core',hp:260,dmg:6,atkCd:2.4,range:20,speed:0,aggro:20,xp:3,ranged:true,hitR:1.6,h:9.5,build:()=>buildTowerMesh(0x3f8fff,0x9fd0ff),scale:1};
ETYPES.coreA={name:'Ashborn Tower Core',hp:260,dmg:6,atkCd:2.4,range:20,speed:0,aggro:20,xp:3,ranged:true,hitR:1.6,h:9.5,build:()=>buildTowerMesh(0xff5a2a,0xffb070),scale:1};
const FAC_OF={warden:'combine',clanblade:'ashborn',coreC:'combine',coreA:'ashborn'};

/* ---------- capturable towers ---------- */
const TOWER_KEY='dustreach_towers_v1';const TW_DEF={ridge:'combine',salt:'ashborn',ember:null};
function loadTowers(){let t=null;try{t=JSON.parse(localStorage.getItem(TOWER_KEY)||'null');}catch(e){}const o={};
  TSITES.forEach(s=>{const v=t&&t[s.id];o[s.id]={owner:v&&(v.owner===null||isMember(v.owner))?v.owner:TW_DEF[s.id],hp:100,since:(v&&v.since)||0};});return o;}
const TW=loadTowers();
function saveTowers(){lsSet(TOWER_KEY,JSON.stringify(TW));}
function towersHeld(side){if(!isMember(side))return 0;let n=0;for(const k in TW)if(TW[k].owner===side)n++;return n;}
const SITES={};
TSITES.forEach(s=>{const S=SITES[s.id]={...s,guards:[],core:null,active:false,model:null};const y=heightAt(s.x,s.z);
  for(let i=circles.length-1;i>=0;i--)if(Math.hypot(circles[i].x-s.x,circles[i].z-s.z)<11)circles.splice(i,1);circles.push({x:s.x,z:s.z,r:1.3});
  const g=new THREE.Group();g.position.set(s.x,y,s.z);part(g,new THREE.CylinderGeometry(4.6,5,0.6,6),M(0x5a5f66),0,0.2,0,1,1,1);
  S.glyph=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide}));S.glyph.scale.set(4,1,4);S.glyph.position.y=0.55;g.add(S.glyph);
  for(let i=0;i<3;i++){const a=i/3*6.283+0.5;part(g,geoBox,M(0x3a3f47),Math.cos(a)*5.6,1.4,Math.sin(a)*5.6,0.35,2.8,0.35);S['ban'+i]=part(g,geoBox,M(0xffffff),Math.cos(a)*5.6+0.32,2.2,Math.sin(a)*5.6,0.05,1.2,0.7);}
  scene.add(g);S.base=g;setSiteModel(S);});
function setSiteModel(S){if(S.model)S.base.remove(S.model.g);const own=TW[S.id].owner;
  if(own){S.model=buildTowerMesh(FACTIONS[own].hex,FACTIONS[own].glow);}else{const g=new THREE.Group();[[0.8,1.6,0.3],[-0.7,1.0,-0.5],[0.1,2.4,-0.9]].forEach(([x,h,z])=>part(g,geoBox,M(0x4a4f57),x,h/2,z,0.9,h,0.9));part(g,geoIco,M(0x3a3f47),1.6,0.3,1.2,0.7,0.4,0.6);S.model={g,anim:()=>{}};}
  S.model.g.visible=!S.core;S.base.add(S.model.g);const c=own?FACTIONS[own].hex:0x8a8a8a;S.glyph.material.color.setHex(c);for(let i=0;i<3;i++)S['ban'+i].material=M(c);}
function siteHostile(S){const me=fac().side;return isMember(me)&&TW[S.id].owner!==me;}
function activateSite(S){if(S.active||!gateOpen('factions'))return;S.active=true;const own=TW[S.id].owner;const gt=own==='combine'?'warden':own==='ashborn'?'clanblade':'raider';const n=own?3+Math.floor(S.lv/3):3;
  for(let i=0;i<n;i++){const a=i/n*6.283,r=rand(7,10);const e=makeEnemy(gt,S.x+Math.cos(a)*r,S.z+Math.sin(a)*r,S.lv,true);e.site=S.id;e.pack='site_'+S.id;e.wr=3;S.guards.push(e);}
  if(own){const c=makeEnemy(own==='combine'?'coreC':'coreA',S.x,S.z,S.lv,true);c.site=S.id;c.isCore=true;c.pack='site_'+S.id;c.wr=0;c.rotY=0;c.leash=999;
    c.immune=()=>S.guards.some(g=>!g.dead&&enemies.includes(g));S.core=c;S.model.g.visible=false;}}
function deactivateSite(S){for(const e of S.guards)if(enemies.includes(e))removeEnemy(e);S.guards=[];if(S.core&&enemies.includes(S.core))removeEnemy(S.core);S.core=null;S.active=false;if(S.model)S.model.g.visible=true;}
function coreDestroyed(S,e){const me=fac().side;TW[S.id].owner=null;TW[S.id].hp=100;S.core=null;saveTowers();setSiteModel(S);calcStats();
  banner('TOWER CORE DESTROYED',isMember(me)?'Plant a '+FACTIONS[me].short+' tower at '+S.name:S.name+' is unclaimed');SFX.boom();ringFx(S.x,S.z,0xffb347,10,1.2);
  dropLoot(S.x+2,S.z+2,genItem(clamp(S.lv,1,MAXLVL),null,Math.max(2,rollRarity(25))));P.credits+=25*S.lv;}
function startPlant(id){const S=SITES[id];if(!gateOpen('factions')){lockedMsg('factions',true);return false;}const me=fac().side;if(!isMember(me)){warn('Join the Combine or the Ashborn to plant towers');return false;}
  if(TW[id].owner){warn('Destroy the tower core first');return false;}if(S.guards.some(g=>!g.dead&&enemies.includes(g))){warn('Clear the guards first');return false;}
  startCast('Planting '+FACTIONS[me].short+' tower',2.5,()=>plantTower(id),{still:true});return true;}
function plantTower(id){const S=SITES[id];const me=fac().side;if(!isMember(me))return false;deactivateSite(S);TW[id].owner=me;TW[id].hp=100;TW[id].since=Date.now();saveTowers();setSiteModel(S);
  const f=fac();f.caps++;banner('TOWER CAPTURED',S.name+' now flies the '+FACTIONS[me].name+' banner');SFX.level();ringFx(S.x,S.z,FACTIONS[me].hex,9,1.4);gainRep(me,120);calcStats();
  if(f.caps===1)grantVehicle(me==='combine'?'patrol':'cutter','first tower capture');nextAssault=Math.max(nextAssault,T+240);save();return true;}
function towerListHtml(){const me=fac().side;return TSITES.map(s=>{const o=TW[s.id].owner;const F=o?FACTIONS[o]:null;const a=ASSAULT&&ASSAULT.id===s.id;
  return `<div class="slot"><span class="ico" style="color:${F?F.col:'#aaa'}">${F?F.icon:'▫️'}</span><span style="flex:1"><div class="nm">${esc(s.name)} <span style="opacity:.65;font-size:12px">· guards Lv ${s.lv} · ${Math.round(dist2D(s,P.pos))}m</span></div><div class="st">${F?'Held by the '+F.name:'Unclaimed'}${o&&o===me?' · <span class="up">yours: +4% power, +2% damage reduction</span>':''}${a?` · <b style="color:#ff7a5a">UNDER ASSAULT ${Math.round(TW[s.id].hp)}%</b>`:''}</div></span></div>`;}).join('')+
  `<div class="stats" style="opacity:.8">${isMember(me)?`Your faction holds ${towersHeld(me)} tower${towersHeld(me)===1?'':'s'}. Each one gives every ${FACTIONS[me].short} member +4% power and +2% damage reduction. Approach an enemy or unclaimed site to start a fight: kill the guards, then the core (shielded while guards live), then plant your tower. The other side launches timed assaults on your towers every few minutes: defend them.`:'Join the Combine or the Ashborn to contest towers.'}</div>`;}
function openTowerInfo(){openPanel('⚑ TOWER WAR',towerListHtml(),'towers');}
/* timed retake assaults by the other faction */
let ASSAULT=null,nextAssault=240;
function startAssault(id){const S=SITES[id];const own=TW[id].owner;if(!own||ASSAULT||!gateOpen('factions'))return null;const atk=own==='combine'?'ashborn':'combine';const et=atk==='combine'?'warden':'clanblade';const n=4+Math.floor(S.lv/4);
  ASSAULT={id,atk,t0:T,until:T+150,list:[]};TW[id].hp=100;
  for(let i=0;i<n;i++){const a=i/n*6.283+rand(-0.3,0.3),r=rand(6,9);const e=makeEnemy(et,S.x+Math.cos(a)*r,S.z+Math.sin(a)*r,S.lv,true);e.siege=id;e.wr=2;e.pack='siege_'+id;ASSAULT.list.push(e);}
  banner('⚠ TOWER UNDER ASSAULT',S.name+': '+FACTIONS[atk].short+' forces are attacking it. Defend it!');SFX.err();log(`<b style="color:#ff7a5a">⚠ ${FACTIONS[atk].name} assault on ${esc(S.name)}</b>`);return ASSAULT;}
function updAssault(dt){const A=ASSAULT;if(!A)return;if(DUN){A.until+=dt;return;}const S=SITES[A.id];const alive=A.list.filter(e=>!e.dead&&enemies.includes(e));
  const near=alive.filter(e=>dist2D(e.pos,S)<14).length;TW[A.id].hp=Math.max(0,TW[A.id].hp-near*0.25*dt);
  if(!alive.length)endAssault('repelled');else if(TW[A.id].hp<=0)endAssault('lost');else if(T>A.until)endAssault('faltered');}
function endAssault(res){const A=ASSAULT;if(!A)return;ASSAULT=null;const S=SITES[A.id];const me=fac().side;for(const e of A.list)if(enemies.includes(e)&&!e.dead)removeEnemy(e);
  if(res==='lost'){TW[A.id].owner=A.atk;setSiteModel(S);banner('TOWER LOST',S.name+' fell to the '+FACTIONS[A.atk].name);SFX.death();calcStats();}
  else if(res==='repelled'){banner('ASSAULT REPELLED',S.name+' holds');SFX.quest();gainRep(me,60);}
  else if(res==='faltered'){banner('ASSAULT FALTERED','The attackers pulled back from '+S.name);gainRep(me,15);}
  TW[A.id].hp=100;saveTowers();nextAssault=T+rand(300,480);}
function assaultTrack(){const A=ASSAULT;const S=SITES[A.id];const n=A.list.filter(e=>!e.dead&&enemies.includes(e)).length;
  return `<b style="color:#ff7a5a">⚠ Assault: ${esc(S.name)}</b><br>Tower ${Math.ceil(TW[A.id].hp)}% · ${n} attacker${n===1?'':'s'} · ${fmtT(A.until-T)}`;}
function assaultWaypoint(){if(!ASSAULT||DUN)return null;const S=SITES[ASSAULT.id];return {x:S.x,z:S.z,label:S.name};}
let towAcc=0;
function updTowers(dt){for(const k in SITES){const S=SITES[k];if(S.model)S.model.anim(T);S.glyph.rotation.y+=dt*0.3;}updAssault(dt);
  towAcc+=dt;if(towAcc<0.5)return;towAcc=0;if(DUN)return;const me=fac().side;
  for(const k in SITES){const S=SITES[k];const d=dist2D(P.pos,S);if(!S.active&&siteHostile(S)&&d<55&&!P.dead&&!(ASSAULT&&ASSAULT.id===k))activateSite(S);
    else if(S.active&&(d>110||!siteHostile(S))){if(!S.guards.some(g=>g.state==='chase'&&!g.dead))deactivateSite(S);}}
  if(!ASSAULT&&isMember(me)&&T>nextAssault&&!P.dead){const mine=TSITES.filter(s=>TW[s.id].owner===me);if(mine.length)startAssault(pick(mine).id);else nextAssault=T+60;}}

/* ---------- cast bar (vehicle summon, tower planting) ---------- */
function startCast(label,dur,done,o){if(P.cast)cancelCast();P.cast={label,t0:T,dur,done,fragile:true,still:!!(o&&o.still)};const el=$('#castbar');el.classList.remove('hidden');el.lastChild.textContent=label;}
function cancelCast(why){if(!P.cast)return;P.cast=null;$('#castbar').classList.add('hidden');if(why)warn(why);}
function updCast(){const c=P.cast;if(!c)return;if(P.dead){cancelCast();return;}if(c.still&&T-c.t0>0.3&&P.moving>0.5){cancelCast('Cancelled: you moved');return;}
  const k=clamp((T-c.t0)/c.dur,0,1);const el=$('#castbar');el.firstChild.style.transform=`scaleX(${k})`;if(k>=1){P.cast=null;el.classList.add('hidden');c.done();}}
const inCombat=()=>enemies.some(e=>!e.dead&&e.state==='chase'&&dist2D(e.pos,P.pos)<40);

/* ---------- hover vehicles ---------- */
const VEHICLES={
  skiff:{name:'Dust Skiff',speed:2.1,col:0xc9a07a,trim:0x5a4632,glow:0x5ff2ff,price:450,src:'Sold by the trader in Halden\'s Rest (or a rare Veteran+ contract bonus)'},
  patrol:{name:'Combine Patrol Skiff',speed:2.35,col:0x3f6fb0,trim:0x22344d,glow:0xffc85a,src:'Reward for your first Combine tower capture'},
  cutter:{name:'Ashborn Dunecutter',speed:2.35,col:0x8a3a22,trim:0x3a1a10,glow:0xffa040,src:'Reward for your first Ashborn tower capture'}};
const bikes={};
function buildBike(v){const g=new THREE.Group();const R={g};const body=new THREE.Group();g.add(body);R.body=body;
  part(body,geoBox,M(v.col),0,0.62,0,0.92,0.34,2.3);part(body,geoBox,M(v.trim),0,0.86,-0.3,0.62,0.2,0.95);
  const nose=part(body,geoCone,M(v.col),0,0.62,1.42,0.42,0.8,0.22);nose.rotation.x=Math.PI/2;
  const ws=part(body,geoBox,new THREE.MeshLambertMaterial({color:0x9fe8ff,transparent:true,opacity:0.45}),0,1.0,0.72,0.62,0.36,0.04);ws.rotation.x=-0.55;
  part(body,geoBox,M(0x222222),0,1.06,0.45,0.95,0.06,0.06);
  for(const sx of [-1,1]){part(body,geoBox,M(v.trim),sx*0.62,0.5,-0.15,0.32,0.3,1.8);part(body,geoSphere,MB(v.glow),sx*0.62,0.5,-1.08,0.17,0.17,0.12);part(body,geoBox,MB(v.glow),sx*0.62,0.36,0.3,0.2,0.04,1.1);}
  part(body,geoBox,MB(0xfff2c0),0,0.7,1.62,0.2,0.08,0.05);
  const gm=new THREE.Mesh(fieldGeo,new THREE.MeshBasicMaterial({color:v.glow,transparent:true,opacity:0.35,depthWrite:false,blending:THREE.AdditiveBlending}));gm.scale.set(0.9,1,1.6);gm.position.y=0.1;g.add(gm);R.glow=gm;return R;}
function grantVehicle(id,why){P.vehicles=P.vehicles||[];if(!VEHICLES[id]||P.vehicles.includes(id))return false;P.vehicles.push(id);if(!P.vsel)P.vsel=id;
  banner('🛵 NEW VEHICLE',VEHICLES[id].name+(why?' ('+why+')':'')+'. Tap 🛵 or press R to summon');SFX.level();setupMountBtn();save();return true;}
function buyVehicle(id){const v=VEHICLES[id];if(!v||!v.price)return false;if(!gateOpen('skiff')){lockedMsg('skiff',true);return false;}if((P.vehicles||[]).includes(id)){warn('You already own it');return false;}if(P.credits<v.price){warn('Not enough credits');return false;}
  P.credits-=v.price;SFX.coin();grantVehicle(id,'bought');return true;}
const mountMul=()=>P.mount&&VEHICLES[P.mount]?VEHICLES[P.mount].speed:1;
function summonVehicle(id){if(!gateOpen('skiff')){lockedMsg('skiff',true);return false;}id=id||P.vsel||(P.vehicles||[])[0];if(!id||!VEHICLES[id]){warn('No vehicle. The trader sells a Dust Skiff');return false;}
  if(DUN){warn('Vehicles can\'t be used in dungeons');return false;}if(P.dead)return false;if(inCombat()){warn('Can\'t summon a vehicle in combat');return false;}
  if(P.mount)dismount();P.vsel=id;startCast('Summoning '+VEHICLES[id].name,1.5,()=>mountUp(id),{still:true});return true;}
function mountUp(id){if(DUN||P.dead)return false;const v=VEHICLES[id];if(!bikes[id])bikes[id]=buildBike(v);scene.add(bikes[id].g);P.mount=id;ringFx(P.pos.x,P.pos.z,v.glow,3,0.6);tone(220,0.5,'sawtooth',0.03,500);toast('🛵 '+v.name+': '+Math.round(v.speed*100-100)+'% faster');setupMountBtn();return true;}
function dismount(msg){if(!P.mount)return;const b=bikes[P.mount];if(b)scene.remove(b.g);P.mount=null;ringFx(P.pos.x,P.pos.z,0xd8d2c4,2.5,0.4);if(msg)toast(msg);setupMountBtn();}
function toggleMount(){if(P.mount){dismount();return;}if(P.cast&&/^Summoning/.test(P.cast.label)){cancelCast();return;}summonVehicle();}
function setupMountBtn(){const b=$('#bMount');const has=(P.vehicles||[]).length>0;b.classList.toggle('hidden',!has||state!=='play');b.classList.toggle('on',!!P.mount);}
function updMountPose(dt){if(!P.mount)return;const b=bikes[P.mount];const bob=Math.sin(T*3)*0.06+0.12;b.g.position.set(P.pos.x,P.pos.y+bob,P.pos.z);b.g.rotation.y=P.rotY;b.body.rotation.z=Math.sin(T*1.7)*0.03;
  b.glow.material.opacity=0.28+Math.sin(T*9)*0.08;PM.g.position.y+=0.42+bob;PM.legL.rotation.x=PM.legR.rotation.x=-1.25;PM.armL.rotation.x=PM.armR.rotation.x=-0.95;if(PM.shinL){PM.shinL.rotation.x=PM.shinR.rotation.x=1.3;PM.foreL.rotation.x=PM.foreR.rotation.x=-0.5;}}
function vehVendorHtml(){const v=VEHICLES.skiff,own=(P.vehicles||[]).includes('skiff');if(!gateOpen('skiff'))return `<div class="h4" style="margin-top:10px">Vehicles</div><div class="capmsg story">${esc(gateMsg('skiff'))}</div>`;return `<div class="h4" style="margin-top:10px">Vehicles</div><button class="item" data-act="buyveh" data-v="skiff" ${own?'disabled':''}><span class="ico">🛵</span><span><div class="nm">${v.name}</div><div class="st">Hover-bike: ${Math.round(v.speed*100-100)}% faster travel. 1.5s summon, not in combat or dungeons. Attacking or getting hit knocks you off.</div></span><span class="pr">${own?'Owned':v.price+'¢'}</span></button>`;}
function vehInvHtml(){const L=P.vehicles||[];return '<div class="h4" style="margin-top:10px">Vehicles</div>'+(L.map(id=>{const v=VEHICLES[id];return `<div class="slot"><span class="ico">🛵</span><span style="flex:1"><div class="nm">${v.name}${P.vsel===id?' <span class="up">· selected</span>':''}</div><div class="st">+${Math.round(v.speed*100-100)}% speed · ${esc(v.src)}</div></span><button class="sbtn" data-act="mount" data-v="${id}">Summon</button></div>`;}).join('')||'<div style="opacity:.6;margin-bottom:8px">No vehicles yet. The trader sells a Dust Skiff; your first tower capture earns a faction skiff.</div>');}

/* ---------- allies: pets now, AI party members later (same code) ----------
   createAlly(o) spawns any friendly fighter: o={name,R(model with g+anim),hp,dmg,range,melee,atkCd,speed,h,hitR,proj,splash,threat,dr,role}.
   Behaviour: cmd 'follow' (assist the owner: fight what the owner fights or what attacks it), 'attack' (a set target), 'stay' (hold position).
   Enemies hold a 'foe' (P or an ally): allies that hit an enemy can pull its threat; Taunt locks it. */
const allies=[];
function createAlly(o){const a=Object.assign({kind:'ally',name:'Ally',hp:100,dmg:5,range:2.5,melee:true,atkCd:1.4,speed:7,h:1.8,hitR:0.7,threat:0.5,dr:0,dmgMul:1,cdMul:1,cmd:'follow',role:'dps',proj:0xffa040},o);
  a.maxHp=a.baseMax=a.hp;const ang=P.rotY+Math.PI+0.6*(allies.length%2?1:-1);a.pos=new V3(o.x!=null?o.x:P.pos.x+Math.sin(ang)*2.5,0,o.z!=null?o.z:P.pos.z+Math.cos(ang)*2.5);a.pos.y=heightAt(a.pos.x,a.pos.z);
  Object.assign(a,{rotY:P.rotY,target:null,nextAtk:0,dead:false,animT:0,moving:0,atkT:0,hitT:0,hot:null,buff:null,lastHit:-99,slot:allies.length});
  a.shadow=makeShadow(a.hitR*0.9);scene.add(a.R.g);allies.push(a);return a;}
function removeAlly(a){scene.remove(a.R.g);scene.remove(a.shadow);const i=allies.indexOf(a);if(i>=0)allies.splice(i,1);a.dead=true;for(const e of enemies)if(e.foe===a)e.foe=null;}
function foeOf(e){const f=e.foe;if(f&&!f.dead&&allies.includes(f)&&dist2D(f.pos,e.pos)<40)return f;e.foe=null;return P;}
function hitFoe(F,amt,src){if(F===P)dmgPlayer(amt,src);else allyTakeDmg(F,amt,src);}
function allyHeal(a,v){if(!a||a.dead)return;const n=Math.min(Math.round(v),a.maxHp-Math.round(a.hp));if(SIMST)SIMST.ah+=Math.max(0,n);a.hp=Math.min(a.maxHp,a.hp+v);floatText(tmpV.set(a.pos.x,a.pos.y+a.h+0.4,a.pos.z),'+'+Math.max(0,n),'heal');}
function allyTakeDmg(a,amt,src){if(a.dead)return;let v=amt*rand(0.9,1.1)*(1-a.dr)*(T<(a.tauntDr||0)?0.75:1)*(1-tbDr(a));v=Math.max(1,Math.round(v));a.hp-=v;if(SIMST)SIMST.at+=v;a.hitT=0.15;a.lastHit=T;
  floatText(tmpV.set(a.pos.x,a.pos.y+a.h+0.3,a.pos.z),'-'+v,'phit');if(!a.target&&src&&a.cmd!=='stay'&&!src.dead)a.target=src;if(a.hp<=0)allyDie(a);}
function allyDie(a){if(SIMST)SIMST.ad++;a.died=true;ringFx(a.pos.x,a.pos.z,0xff7a3a,3,0.6);SFX.boom();floatText(tmpV.set(a.pos.x,a.pos.y+a.h,a.pos.z),'Destroyed','info');
  if(a===P.pet){P.pet=null;P.pets=[];toast('💥 Your '+a.name+' was destroyed. '+(P.prof==='binder'?'Rebind it with a Bind weave':'Rebuild it with Assemble'));}removeAlly(a);}
function allyHit(e,v,a,crit){if(!e||e.dead)return;if(e.state==='return'){floatText(entChest(e,tmpV),'Evade','info');return;}
  if(e.immune&&e.immune()){floatText(entChest(e,tmpV),'Shielded','info');if(e.state!=='chase')aggro(e);return;}
  if(T<(e.wardUntil||0))v=Math.max(1,Math.round(v*WARD_MUL));e.hp-=v;e.hitT=0.15;floatText(entChest(e,tmpV),v+(crit?'!':''),'pet');P.lastCombat=T;if(e.state!=='chase'){aggro(e);if(!e.foe)e.foe=a;}
  if(T>(e.tauntUntil||0)&&e.foe!==a&&Math.random()<(e.foe?a.threat*0.3:a.threat))e.foe=a;if(e.hp<=0)killEnemy(e);}
function allyAttack(a,t){const crit=Math.random()<0.08;const v=Math.max(1,Math.round(a.dmg*a.dmgMul*tbMul(a)*rand(0.9,1.1)*(crit?1.6:1)));a.atkT=0.35;
  if(a.melee){allyHit(t,v,a,crit);ringFx(t.pos.x,t.pos.z,0xd8e0e8,1.0,0.2);tone(160,0.06,'square',0.015,-60);return;}
  const from=new V3(a.pos.x+Math.sin(a.rotY)*0.6,a.pos.y+a.h*0.75,a.pos.z+Math.cos(a.rotY)*0.6);
  fireProj(from,t,a.proj,34,()=>{allyHit(t,v,a,crit);if(a.splash){ringFx(t.pos.x,t.pos.z,a.proj,a.splash,0.35);for(const o of enemies.slice())if(o!==t&&!o.dead&&dist2D(o.pos,t.pos)<a.splash+o.hitR)allyHit(o,Math.round(v*0.5),a,false);}});tone(320,0.06,'square',0.015,-120);}
function moveAlly(a,tx,tz,spd,dt,stop){const dx=tx-a.pos.x,dz=tz-a.pos.z;const d=Math.hypot(dx,dz);if(d<=stop)return false;const s=Math.min(spd*dt,d-stop);a.pos.x+=dx/d*s;a.pos.z+=dz/d*s;collide(a.pos,a.hitR*0.6);a.rotY=Math.atan2(dx,dz);return true;}
function allyPickTarget(a){if(a.passive)return null;if(a.comp){if((a.stance==='passive'&&a.cmd!=='attack')||T<(a.regroupUntil||0))return null;if(a.stance==='follow'){let best=null,bd=1e9;for(const e of enemies){if(e.dead||e.state!=='chase')continue;if(e.foe!==a&&dist2D(e.pos,P.pos)>8)continue;const d=dist2D(e.pos,a.pos);if(d<bd&&d<22){bd=d;best=e;}}return best;}}const ot=validTarget();if(ot&&(P.autoAtk||ot.state==='chase')&&dist2D(ot.pos,P.pos)<30&&!(a.cmd==='stay'&&dist2D(ot.pos,a.pos)>a.range+4))return ot;
  let best=null,bd=1e9;for(const e of enemies){if(e.dead||e.state!=='chase')continue;const mine=e.foe===a,onOwner=dist2D(e.pos,P.pos)<14;if(!mine&&!onOwner)continue;const d=dist2D(e.pos,a.pos);
    if(a.cmd==='stay'&&d>a.range+4)continue;if(d<bd&&d<25){bd=d;best=e;}}return best;}
function updAlly(a,dt){if(a.dead)return;const dO=dist2D(a.pos,P.pos);
  if(!a.fixed&&((dO>45&&a.cmd!=='stay')||dO>80)){const ang=P.rotY+Math.PI+0.6;a.pos.set(P.pos.x+Math.sin(ang)*2.5,0,P.pos.z+Math.cos(ang)*2.5);a.target=null;if(a.cmd==='stay')a.cmd='follow';}
  if(a.hot&&T>=a.hot.next){if(T>a.hot.until)a.hot=null;else{a.hot.next+=1;allyHeal(a,a.maxHp*a.hot.pct);}}
  if(a.buff&&T>a.buff.until){a.dmgMul=1;a.cdMul=1;a.maxHp=a.baseMax;a.hp=Math.min(a.hp,a.maxHp);log('<span style="opacity:.8">'+esc(a.buff.name)+' wore off your '+esc(a.name)+'</span>');a.buff=null;}
  if(T-a.lastHit>6)a.hp=Math.min(a.maxHp,a.hp+a.maxHp*0.03*dt);
  let t=a.target&&!a.target.dead&&enemies.includes(a.target)?a.target:null;
  if(!t){a.target=null;if(a.cmd==='attack')a.cmd=a.prevCmd||'follow';if(!P.dead||a.cmd==='stay')t=a.target=allyPickTarget(a);}
  let moving=false;
  if(t){const d=dist2D(a.pos,t.pos),reach=a.range+t.hitR;
    if(d>reach*0.92&&a.cmd!=='stay')moving=moveAlly(a,t.pos.x,t.pos.z,a.speed,dt,reach*0.8);else a.rotY=Math.atan2(t.pos.x-a.pos.x,t.pos.z-a.pos.z);
    if(a.cmd==='stay'&&d>reach+0.5){a.target=null;}else if(d<=reach+0.5&&T>=a.nextAtk){a.nextAtk=T+a.atkCd*a.cdMul;allyAttack(a,t);}}
  else if(a.cmd==='stay'&&a.stayAt)moving=moveAlly(a,a.stayAt.x,a.stayAt.z,a.speed,dt,0.6);
  else{const ang=P.rotY+Math.PI+(a.slot%2?0.7:-0.7)*(1+Math.floor(a.slot/2)*0.4);const fx=P.pos.x+Math.sin(ang)*2.6,fz=P.pos.z+Math.cos(ang)*2.6;const d=Math.hypot(fx-a.pos.x,fz-a.pos.z);
    const os=SPEED*moveMul();moving=moveAlly(a,fx,fz,d>6?Math.max(a.speed,os*1.12):a.speed,dt,0.7);if(!moving&&P.moving<0.2)a.rotY+=Math.atan2(Math.sin(P.rotY-a.rotY),Math.cos(P.rotY-a.rotY))*Math.min(1,dt*3);}
  a.pos.y=heightAt(a.pos.x,a.pos.z);a.moving=lerp(a.moving,moving?1:0,Math.min(1,dt*8));a.atkT-=dt;a.hitT-=dt;a.animT+=dt;
  const g=a.R.g;g.position.copy(a.pos);if(a.R.hover)g.position.y+=1.0+Math.sin(T*2.4+a.slot)*0.12;g.rotation.y=a.rotY;a.R.anim(a.animT,a.moving,a.atkT);g.scale.setScalar((a.scale||1)*(a.hitT>0?1.08:1));
  a.shadow.position.set(a.pos.x,a.pos.y+0.05,a.pos.z);if(DUN){g.visible=true;a.shadow.visible=true;}}
function updAllies(dt){for(let i=allies.length-1;i>=0;i--)updAlly(allies[i],dt);}
/* AI party members (future team missions): any roster snapshot becomes an ally with its own gear-derived stats */
function spawnPartyMember(snap){if(!snap)return null;const v=snap.visual,st=snap.stats;const w=snap.eq&&snap.eq.weapon,W=w&&WTYPES[w.wt];
  return createAlly({kind:'party',id:snap.id,name:snap.name,role:snap.role,R:buildHumanoid(v.color,v.accent,v.visor,v.skin==null?null:v.skin,Object.assign({},(PROFS[snap.prof]&&PROFS[snap.prof].look)||{},{npc:1,armed:1,melee:!!(W&&W.melee)},v.face?{face:v.face,hair:v.hair,hairc:v.hairc}:{})),hp:st.maxHp,dmg:st.dmg*(1+0.08*(snap.level-1))*0.9*allyPowF(snap),range:W?W.rng:18,melee:!!(W&&W.melee),
    atkCd:1.2*(W?W.cd:1),speed:7.2,h:1.9,hitR:0.6,threat:snap.role==='tank'?0.9:0.4,proj:(W&&W.proj)||0xffe08a,dr:Math.min(0.5,st.armor/(st.armor+100))});}

/* ---------- Dronewright bots ---------- */
const PETDEF={
  bot1:{name:'Scrapper Bot',tier:1,hp:1,dmg:1,range:2.4,melee:true,atkCd:1.3,speed:7.6,build:'crawler',h:1.1,hitR:0.8,col:0xb09a70,dr:0.1},
  bot2:{name:'Brawler Frame',tier:2,hp:1.5,dmg:1.35,range:2.6,melee:true,atkCd:1.4,speed:7.4,build:'brawler',h:2.1,hitR:0.9,col:0x8a8f96,dr:0.18},
  bot3:{name:'Siege Walker',tier:3,hp:1.6,dmg:1.7,range:18,melee:false,atkCd:1.8,speed:7.0,build:'walker',h:2.5,hitR:0.9,col:0x6d7a5a,proj:0xffa040,dr:0.2},
  bot4:{name:'Sentinel Warframe',tier:4,hp:2.2,dmg:2.1,range:20,melee:false,splash:3.5,atkCd:1.6,speed:8,build:'sentinel',h:1.6,hitR:1.0,col:0x4f5a6a,proj:0x5ff2ff,dr:0.3}};
function buildBot_v1(def){const g=new THREE.Group();const R={g};const c=def.col,dk=0x2a2a2a,gl=def.proj||0xffa040;
  if(def.build==='crawler'){R.body=part(g,geoBox,M(c),0,0.6,0,0.8,0.42,1.0);part(g,geoBox,M(dk),0,0.86,-0.1,0.5,0.14,0.6);R.head=part(g,geoBox,M(c),0,0.75,0.58,0.42,0.3,0.3);part(g,geoBox,MB(gl),0,0.78,0.74,0.3,0.08,0.02);
    for(const sx of [-1,1]){const cl=part(g,geoCone,M(0xd8d0c0),sx*0.2,0.55,0.85,0.08,0.35,0.08);cl.rotation.x=Math.PI/2;}
    R.legs=[];for(let i=0;i<4;i++){const p=new THREE.Group();p.position.set(i<2?0.38:-0.38,0.5,i%2?0.32:-0.32);g.add(p);part(p,geoBox,M(dk),i<2?0.16:-0.16,-0.22,0,0.12,0.5,0.12);R.legs.push(p);}
    R.anim=(t,mv,atk)=>{R.legs.forEach((p,i)=>p.rotation.x=Math.sin(t*16+i*1.6)*0.5*mv);R.head.position.z=0.58+(atk>0?0.22:0);R.body.position.y=0.6+Math.abs(Math.sin(t*16))*0.03*mv;};}
  else if(def.build==='brawler'){R.torso=part(g,geoBox,M(c),0,1.35,0,1.0,0.85,0.7);part(g,geoBox,M(dk),0,1.7,0,1.25,0.25,0.75);part(g,geoBox,M(c),0,1.98,0.05,0.45,0.32,0.45);part(g,geoBox,MB(gl),0,2.0,0.28,0.34,0.08,0.02);
    const limb=(x,y,w,h,col)=>{const p=new THREE.Group();p.position.set(x,y,0);g.add(p);part(p,geoBox,M(col),0,-h/2,0,w,h,w*1.1);return p;};
    R.legL=limb(-0.28,0.92,0.32,0.9,dk);R.legR=limb(0.28,0.92,0.32,0.9,dk);R.armL=limb(-0.72,1.7,0.3,0.8,c);R.armR=limb(0.72,1.7,0.3,0.8,c);part(R.armL,geoBox,M(dk),0,-0.9,0.05,0.42,0.38,0.42);part(R.armR,geoBox,M(dk),0,-0.9,0.05,0.42,0.38,0.42);
    R.anim=(t,mv,atk)=>{const s=Math.sin(t*9)*0.5*mv;R.legL.rotation.x=s;R.legR.rotation.x=-s;R.armL.rotation.x=-s*0.6;R.armR.rotation.x=atk>0?-1.7:s*0.6;};}
  else if(def.build==='walker'){R.legs=[];for(const sx of [-1,1]){const p=new THREE.Group();p.position.set(sx*0.45,1.55,0);g.add(p);part(p,geoBox,M(dk),0,-0.45,0.15,0.22,0.95,0.22);part(p,geoBox,M(dk),0,-1.15,-0.05,0.2,0.8,0.2);part(p,geoBox,M(c),0,-1.5,0.1,0.42,0.1,0.6);R.legs.push(p);}
    R.body=part(g,geoBox,M(c),0,1.95,0,1.1,0.6,0.95);part(g,geoBox,MB(gl),0,2.05,0.49,0.5,0.1,0.02);R.gun=part(g,geoBox,M(0x333333),0.3,2.0,0.75,0.18,0.18,1.2);part(g,geoBox,M(c),-0.35,2.35,-0.1,0.3,0.3,0.5);
    R.anim=(t,mv,atk)=>{R.legs.forEach((p,i)=>p.rotation.x=Math.sin(t*7+i*Math.PI)*0.45*mv);R.body.position.y=1.95+Math.abs(Math.sin(t*7))*0.05*mv;R.gun.position.z=atk>0?0.55:0.75;};}
  else{R.hover=true;R.core=part(g,geoIco,M(c),0,0.7,0,0.55,0.5,0.55);part(g,geoBox,MB(gl),0,0.72,0.5,0.3,0.12,0.04);R.ring=part(g,new THREE.TorusGeometry(0.85,0.07,4,24),MB(gl),0,0.7,0,1,1,1);R.ring.rotation.x=Math.PI/2;
    R.pods=[];for(const sx of [-1,1]){const p=part(g,geoBox,M(0x333333),sx*0.85,0.6,0.1,0.28,0.28,0.8);R.pods.push(p);part(g,geoBox,MB(gl),sx*0.85,0.6,0.52,0.12,0.12,0.04);}
    R.anim=(t,mv,atk)=>{R.ring.rotation.z=t*2;R.core.rotation.y=t*0.6;R.pods.forEach(p=>p.position.z=atk>0?-0.05:0.1);};}
  return R;}
function petStats(def){const L=P.level,w=eff('weave');return {hp:Math.round((55+30*L)*def.hp*(1+w/250)),dmg:petDmgBase()*def.dmg};}/* Build O: bot damage follows its owner's own damage (level, skill, power), like the player's hits */
function activePet(){return P.pet&&!P.pet.dead&&allies.includes(P.pet)?P.pet:null;}
function summonPet(pid,o){o=o||{};const def=PETDEF[pid];if(!def)return null;if(P.pet){removeAlly(P.pet);P.pet=null;}const st=petStats(def);
  const a=createAlly({kind:'pet',pid,name:def.name,R:buildBot(def),hp:st.hp,dmg:st.dmg,range:def.range,melee:def.melee,atkCd:def.atkCd,speed:def.speed,h:def.h,hitR:def.hitR,proj:def.proj||0xffa040,splash:def.splash,threat:0.65,dr:def.dr,role:'tank'});
  if(o.hpf)a.hp=Math.max(1,Math.round(a.maxHp*o.hpf));a.cmd=o.cmd==='stay'?'follow':(o.cmd||'follow');P.pet=a;
  if(!o.silent){ringFx(a.pos.x,a.pos.z,0xffa040,2.5,0.7);SFX.heal();toast((P.prof==='binder'?'🗿 ':'🤖 ')+def.name+' online: '+a.maxHp+' health');}savePetState();return a;}
function savePetState(){const a=activePet();P.pets=a?[{pid:a.pid,hpf:+(a.hp/a.maxHp).toFixed(2),cmd:a.cmd}]:[];}
function petCmd(c){const a=activePet();if(!a){warn(P.prof==='wright'?'No bot deployed: cast Assemble':P.prof==='binder'?'No construct bound: cast a Bind weave':'You have no pet');return false;}
  if(c==='attack'){const t=validTarget()||autoTarget(25);if(!t){warn('No target for your bot');return false;}if(a.cmd!=='attack')a.prevCmd=a.cmd;a.cmd='attack';a.target=t;floatText(tmpV.set(a.pos.x,a.pos.y+a.h+0.5,a.pos.z),'Attack!','info');}
  else if(c==='follow'){a.cmd='follow';a.target=null;a.stayAt=null;}else if(c==='stay'){a.cmd='stay';a.stayAt=a.pos.clone();a.target=null;}
  SFX.ui();updPetHud();return true;}
KIND.summon=(t,a)=>{summonPet(a.pet);};
KIND.petheal=(t,a)=>{const p=activePet();if(!p)return;allyHeal(p,p.maxHp*a.pct*(1+eff('treat')/200));p.hot={until:T+6,next:T+1,pct:a.hot};ringFx(p.pos.x,p.pos.z,0x6dff8a,2.5,0.6);SFX.heal();};
KIND.petbuff=(t,a)=>{const p=activePet();if(!p)return;if(p.buff){p.maxHp=p.baseMax;p.hp=Math.min(p.hp,p.maxHp);}const add=Math.round(p.baseMax*a.hp);p.buff={name:a.name,until:T+a.dur};p.dmgMul=a.dmg;p.cdMul=a.spd;p.maxHp=p.baseMax+add;p.hp+=add;
  ringFx(p.pos.x,p.pos.z,0xffe95a,3,0.8);floatText(tmpV.set(p.pos.x,p.pos.y+p.h+0.5,p.pos.z),a.name,'info');SFX.heal();log('⚡ <b>'+esc(a.name)+'</b> on your '+esc(p.name)+': ×'+a.dmg+' damage, +'+add+' health');};
KIND.taunt=(t,a)=>{const p=activePet();if(!p)return;let n=0;for(const e of enemies)if(!e.dead&&dist2D(e.pos,p.pos)<a.radius+e.hitR){e.foe=p;e.tauntUntil=T+a.dur;if(e.state!=='chase')aggro(e);n++;}p.tauntDr=T+a.dur;
  ringFx(p.pos.x,p.pos.z,0xffa040,a.radius,0.7);floatText(tmpV.set(p.pos.x,p.pos.y+p.h+0.5,p.pos.z),'Taunt ×'+n,'info');tone(700,0.3,'square',0.03,-400);};
const petBarEl=$('.bar.php');
let logTop=0;function fitLog(){let b=Math.round($('#pframe').getBoundingClientRect().bottom+6);if(b<=20)return;const th=$('#teamHud');if(th&&!th.classList.contains('hidden')){if(th._top!==b){th._top=b;th.style.top=b+'px';}b+=Math.round(th.offsetHeight)+6;}if(b!==logTop){logTop=b;$('#log').style.top=b+'px';}}
function updPetHud(){const a=activePet();const el=$('#petf');fitLog();if(!a){el.classList.add('hidden');return;}el.classList.remove('hidden');
  el.querySelector('.pn').innerHTML=`${P.prof==='binder'?'🗿':'🤖'} <b>${esc(a.name)}</b> <em>${a.target?'fighting':a.cmd==='stay'?'holding':'following'}${a.buff?' · ⚡'+fmtT(a.buff.until-T):''}${T<(a.tauntDr||0)?' · 📢':''}</em>`;
  setBar(petBarEl,a.hp,a.maxHp,Math.max(0,Math.ceil(a.hp))+' / '+a.maxHp);['attack','follow','stay'].forEach(c=>$('#pc_'+c).classList.toggle('on',a.cmd===c));}

/* ---------- hooks used by the core files ---------- */
function stage2OnKill(e){stage3OnKill(e);storyOnKill(e);if(e.isCore&&e.site)coreDestroyed(SITES[e.site],e);const ef=FAC_OF[e.type];const me=fac().side;if(ef&&isMember(me)&&ef!==me)gainRep(me,e.isCore?20:3,true);}
function stage2Interact(p){const sI=storyInteract(p);if(sI)return sI;const s3=stage3Interact(p);if(s3)return s3;for(const n of NPCS)if(Math.hypot(p.x-n.x,p.z-n.z)<3.2)return n.k==='registrar'?{k:'registrar',label:'⚑ Factions'}:{k:'facvend',side:n.side,label:n.side==='combine'?'🎖 Quartermaster':'🔥 Clan Broker'};
  for(const k in SITES){const S=SITES[k];if(Math.hypot(p.x-S.x,p.z-S.z)<6.5){const o=TW[k].owner,me=fac().side;if(!o&&isMember(me))return {k:'plant',id:k,label:'⚑ Plant '+FACTIONS[me].short+' tower'};return {k:'tower',id:k,label:'⚑ '+S.name};}}return null;}
function stage2Do(n){if(storyDo(n))return true;if(stage3Do(n))return true;if(n.k==='registrar')openRegistrar();else if(n.k==='facvend')openFacVendor(n.side);else if(n.k==='plant')startPlant(n.id);else if(n.k==='tower')openTowerInfo();else return false;return true;}
function stage2Act(a,b){if(storyAct(a,b))return true;if(stage3Act(a,b))return true;if(a==='join'){joinFaction(b.dataset.f);openRegistrar();}else if(a==='fbuy'){facBuy(b.dataset.id);openFacVendor(curFV);}else if(a==='flock'){const it=(FSTOCK[curFV]||{items:[]}).items.find(x=>x.id===b.dataset.id);warn(it?'Needs '+REP_TIERS[it.ftier].n+' reputation'+(fac().side==='neutral'&&it.ftier>2?' and membership':''):'Locked');}
  else if(a==='buyveh'){buyVehicle(b.dataset.v);openVendor();}else if(a==='mount'){closePanel();summonVehicle(b.dataset.v);}else return false;return true;}
function stage2Chips(){let b='';const n=towersHeld(fac().side);if(n)b+=`<span class="bf" title="Tower network: +${4*n}% power, +${2*n}% damage reduction">⚑<b>×${n}</b></span>`;if(P.mount)b+='<span class="bf">🛵</span>';return b;}
function stage2StatLine(){const br=breedOf(P),f=fac(),me=f.side;return `Breed: <b>${br.name}</b> (${br.tag}) · Faction: <b style="color:${me?FACTIONS[me].col:'#fff'}">${me?FACTIONS[me].name:'none'}</b> · Rep: Combine ${f.rep.combine} (${REP_TIERS[repTier('combine')].n}), Ashborn ${f.rep.ashborn} (${REP_TIERS[repTier('ashborn')].n})${isMember(me)?' · Towers held: '+towersHeld(me):''}`;}
function stage2Mini(c,tf,dot){for(const s of TSITES){const o=TW[s.id].owner;const q=tf(s.x,s.z);c.fillStyle=o?FACTIONS[o].col:'#9a9a9a';c.strokeStyle=ASSAULT&&ASSAULT.id===s.id&&Math.sin(T*8)>0?'#ff3b2f':'#000';c.lineWidth=2;
  c.beginPath();c.moveTo(q[0],q[1]-9);c.lineTo(q[0]+8,q[1]+6);c.lineTo(q[0]-8,q[1]+6);c.closePath();c.fill();c.stroke();}for(const n of NPCS)dot(n.x,n.z,'#'+n.mark.toString(16).padStart(6,'0'),5);}
function stage2Reset(){dismount();cancelCast();for(const a of allies.slice())removeAlly(a);P.pet=null;for(const k in SITES)deactivateSite(SITES[k]);if(ASSAULT){for(const e of ASSAULT.list)if(enemies.includes(e))removeEnemy(e);ASSAULT=null;}}
function stage2Start(){morphReset();exploreLoad();RG.cur=null;RG.cand=null;if(MAP.open)mapHide();if(!P.runSp){P.runSp=true;P.sp+=RUN_SP;}P.slowUntil=0;stage2Reset();fac();P.vehicles=P.vehicles||[];if(P.vsel&&!P.vehicles.includes(P.vsel))P.vsel=null;nextAssault=T+rand(240,420);
  const ps=(P.pets||[])[0];if(isPetProf(P.prof)&&ps&&PETDEF[ps.pid])summonPet(ps.pid,{hpf:ps.hpf,cmd:ps.cmd,silent:true});else P.pets=[];setupMountBtn();updPetHud();stage3Start();calcStats();}
let s2Acc=0;
function updStage2(dt){updCast();updAllies(dt);updMountPose(dt);updTowers(dt);updNPCs(dt);updStory(dt);updMorph(dt);if(DUN&&P.mount)dismount('Vehicles can\'t enter dungeons');
  s2Acc+=dt;if(s2Acc>0.15){s2Acc=0;updPetHud();savePetState();const b=$('#bMount');b.classList.toggle('on',!!P.mount);if(DUN!==b._dun){b._dun=DUN;setupMountBtn();}}}
btn('#bMount',toggleMount);['attack','follow','stay'].forEach(c=>btn('#pc_'+c,()=>petCmd(c)));

/* ---------- creation: breed + faction pickers ---------- */
let selBreed='settler',selFac=null;
function breedDesc(k){const b=BREEDS[k];const f=o=>Object.keys(o).map(s=>SHORT[s]+' '+(o[s]>0?'+':'')+o[s]).join(', ');
  return `<b>${b.name}</b>: ${b.desc}<br><span style="opacity:.8">${Object.keys(b.mods).length?'Start '+f(b.mods)+' · Training caps '+Object.keys(b.cap).map(s=>SHORT[s]+' ×'+b.cap[s]).join(', ')+' · SP cost '+f(b.cost)+' · Health ×'+b.hp+' · Energy ×'+b.en:'No attribute penalties or bonuses; standard training caps and costs.'}</span>`;}
function renderCreateOpts(){P.breed=selBreed;
  $('#breedRow').innerHTML=Object.keys(BREEDS).map(k=>`<button data-b="${k}" class="${k===selBreed?'on':''}"><b>${BREEDS[k].name}</b><small>${BREEDS[k].tag}</small></button>`).join('');$('#breedTxt').innerHTML=breedDesc(selBreed);
  $('#facRow').innerHTML=[['combine'],['ashborn'],['neutral'],['']].map(([k])=>`<button data-f="${k}" class="${(selFac||'')===k?'on':''}">${k?FACTIONS[k].icon+' <b>'+FACTIONS[k].short+'</b>':'<b>Decide later</b>'}</button>`).join('');
  $('#facTxt').innerHTML=selFac?FACTIONS[selFac].desc:'Pick a side later with Registrar Hale in Halden\'s Rest (first choice free).';}
$('#breedRow').addEventListener('click',e=>{const b=e.target.closest('[data-b]');if(!b)return;selBreed=b.dataset.b;SFX.ui();renderCreateOpts();previewProf();});
$('#facRow').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;selFac=b.dataset.f||null;SFX.ui();renderCreateOpts();});
