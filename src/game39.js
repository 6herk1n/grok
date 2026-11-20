/* game39.js — Build T: APARTMENT UPGRADES (furniture slots, trophy wall, rested XP, apartment tiers).
   Builds on the Build-era apartment in game8 (shared by all characters; free-placed DECOR stays as it was).
   - Shared apartment state (all characters): localStorage 'dustreach_apt_v1' = {v:1,tier,slots:{slotId:furnKey},own:{furnKey:n}}
     read through aptLoad() (normalizes junk) and written by aptWrite().
   - Furniture (FURN): bought with credits or mission writs (P.rmis.writs), crafted via Forging/Distilling (QREC recipes
     with out:{furn}, schematics sold at hubs), or dropped by dungeon/raid final bosses. Pieces go into fixed SLOTS
     (floor or wall); tiers unlock more slots: Bunk Room 8, Settled Quarters 13, Homestead Suite 18.
     The 🏠 Home panel (table in the middle of the room) has a touch grid: tap a slot, then tap a piece.
   - Trophy wall (right-hand wall): plaques built from the character's own records (dungeon clears, team clears, raid clears,
     hard-mode bests, titles). Pins in P.home.pin choose which ones get a plaque; the rest fill in automatically.
   - Rested XP (per character, P.home): a pool of bonus XP that builds while logged out (faster when you log out at home)
     and while you stay in the apartment. Kills give double XP until the pool is used up. Cap 1.5 levels of XP
     (+ up to 0.5 more from comfort); rate per real hour: 8% of a level at home, 2% elsewhere, comfort adds up to +60%.
     Shown as a blue segment on the XP bar and a 💤 next to your name.
   - Save: P.home={v:1,pool,t,at,pin} via futureFields (homeFields); old saves start with an empty pool. */
const APT_KEY='dustreach_apt_v1',APT_VER=1,HOME_VER=1;
const APT_TIERS=[
  {n:'Bunk Room',cr:0,wr:0,lvl:1,troph:6,d:'Your starter flat in Halden\'s Rest.'},
  {n:'Settled Quarters',cr:2500,wr:10,lvl:12,troph:10,d:'Knock through to the store room: +5 furniture slots, +4 trophy plaques.'},
  {n:'Homestead Suite',cr:8000,wr:30,lvl:30,troph:14,d:'The whole floor is yours: +5 furniture slots, +4 trophy plaques.'}];
// slots: k floor|wall, t = tier needed (0-based), position, wall facing
const SLOTS=[
  {id:'A',k:'floor',t:0,x:-3,z:-4.3,n:'Window corner'},{id:'B',k:'floor',t:0,x:2.6,z:-4.3,n:'By the mirror'},{id:'C',k:'floor',t:0,x:-2.4,z:1.8,n:'Left of the door'},
  {id:'D',k:'floor',t:0,x:2.4,z:1.8,n:'Right of the door'},{id:'E',k:'floor',t:0,x:-3.4,z:-1.6,n:'By the workbench'},{id:'F',k:'floor',t:0,x:3.4,z:-1.6,n:'By the trophies'},
  {id:'W1',k:'wall',t:0,x:-6.38,z:-2.6,r:Math.PI/2,n:'Left wall'},{id:'W2',k:'wall',t:0,x:-3.2,z:5.93,r:Math.PI,n:'Door wall, left'},
  {id:'G',k:'floor',t:1,x:-3.4,z:4.0,n:'Foot of the bed'},{id:'H',k:'floor',t:1,x:3.6,z:4.0,n:'Store-room corner'},{id:'I',k:'floor',t:1,x:0,z:-3.6,n:'Under the windows'},
  {id:'W3',k:'wall',t:1,x:3.2,z:5.93,r:Math.PI,n:'Door wall, right'},{id:'W4',k:'wall',t:1,x:-6.38,z:3.4,r:Math.PI/2,n:'Above the bed'},
  {id:'J',k:'floor',t:2,x:-1.5,z:3.7,n:'Hall, left'},{id:'K',k:'floor',t:2,x:1.5,z:3.7,n:'Hall, right'},{id:'L',k:'floor',t:2,x:4.6,z:2.8,n:'Suite corner'},
  {id:'W5',k:'wall',t:2,x:-1.5,z:-5.93,r:0,n:'Between the windows, left'},{id:'W6',k:'wall',t:2,x:1.5,z:-5.93,r:0,n:'Between the windows, right'}];
const TROPHY_POS=[];for(const y of [1.25,2.05])for(const z of [-4.6,-3.6,-2.6,-1.6,2.2,3.2,4.2])TROPHY_POS.push({x:6.36,y,z});
// furniture catalogue: k floor|wall, cf comfort, buy {cr}|{wr}, craft (QREC id) or drop
const FURN_B={
  rug:g=>{part(g,geoBox,M(0xb07a3a),0,0.02,0,2.4,0.03,1.6);part(g,geoBox,M(0x6a3a22),0,0.035,0,2.0,0.03,0.2);part(g,geoBox,M(0x6a3a22),0,0.035,0,0.2,0.03,1.2);},
  chair:g=>{part(g,geoBox,M(0x7a5a3a),0,0.35,0,0.9,0.3,0.85);part(g,geoBox,M(0x6a4a2a),0,0.85,-0.35,0.9,0.75,0.16);part(g,geoBox,M(0x5a6a70),-0.42,0.6,0,0.14,0.3,0.8);part(g,geoBox,M(0x5a6a70),0.42,0.6,0,0.14,0.3,0.8);},
  glamp:g=>{part(g,geoBox,M(0x3a3a3a),0,0.7,0,0.08,1.4,0.08);part(g,geoBox,M(0x2a2a2a),0,0.04,0,0.45,0.08,0.45);part(g,geoSphere,MB(0x9fffd0),0,1.5,0,0.28,0.2,0.28);},
  planter:g=>{part(g,geoBox,M(0x5a6470),0,0.3,0,0.8,0.6,0.5);part(g,geoBox,MB(0x5ff2ff),0,0.62,0,0.7,0.04,0.4);for(let i=0;i<4;i++)part(g,geoCone,M(0x5a8a32),-0.27+i*0.18,0.95,0,0.1,0.6,0.1);},
  daybed:g=>{part(g,geoBox,M(0x5a3a2a),0,0.25,0,1.0,0.4,2.0);part(g,geoBox,M(0xd8cfb8),0,0.5,0,0.95,0.14,1.9);part(g,geoBox,M(0x8a4a3a),0,0.62,-0.7,0.8,0.14,0.4);},
  table:g=>{part(g,geoBox,M(0x8a9098),0,0.72,0,1.4,0.08,0.9);for(const a of [[-0.6,-0.35],[0.6,-0.35],[-0.6,0.35],[0.6,0.35]])part(g,geoBox,M(0x4a4a4a),a[0],0.36,a[1],0.08,0.72,0.08);},
  shelf:g=>{part(g,geoBox,M(0x6a4a32),0,1.0,0,1.4,2.0,0.4);for(const y of [0.45,1.0,1.55])for(let i=0;i<5;i++)part(g,geoBox,M([0x8a3a3a,0x3a5a8a,0x8a7a3a,0x3a7a4a,0x6a3a7a][i]),-0.5+i*0.24,y+0.18,0.05,0.16,0.34,0.26);},
  hearth:g=>{part(g,geoBox,M(0x5a4a44),0,0.6,0,1.6,1.2,0.7);part(g,geoBox,M(0x2a1a14),0,0.45,0.2,0.9,0.6,0.4);part(g,geoCone,MB(0xff8a3a),0,0.45,0.25,0.25,0.5,0.25);part(g,geoBox,M(0x6a5a50),0,1.25,0,1.8,0.1,0.8);},
  brazier:g=>{part(g,geoBox,M(0x3a3a3a),0,0.35,0,0.12,0.7,0.12);part(g,geoBox,M(0x4a3a30),0,0.75,0,0.7,0.18,0.7);part(g,geoCone,MB(0xff6a2a),0,1.0,0,0.22,0.4,0.22);},
  bench:g=>{part(g,geoBox,M(0x7a6a5a),0,0.45,0,1.6,0.1,0.5);part(g,geoBox,M(0x4a4a4a),-0.65,0.22,0,0.1,0.44,0.45);part(g,geoBox,M(0x4a4a4a),0.65,0.22,0,0.1,0.44,0.45);},
  diffuser:g=>{part(g,geoBox,M(0x6a4a5a),0,0.4,0,0.4,0.8,0.4);part(g,geoSphere,MB(0xff9ad8),0,0.95,0,0.22,0.22,0.22);},
  still:g=>{part(g,geoBox,M(0xb8743a),0,0.45,0,0.6,0.9,0.6);part(g,geoBox,M(0xb8743a),0.35,1.0,0,0.5,0.08,0.08);part(g,geoSphere,M(0xc8844a),0,1.0,0,0.3,0.25,0.3);},
  orb:g=>{part(g,geoBox,M(0x3a3a44),0,0.45,0,0.4,0.9,0.4);part(g,geoSphere,MB(0x8ab8ff),0,1.15,0,0.3,0.3,0.3);},
  sculpt:g=>{part(g,geoBox,M(0x4a4440),0,0.15,0,0.7,0.3,0.7);part(g,geoIco,M(0x7a6a5a),0,0.75,0,0.4,0.5,0.35);part(g,geoCone,MB(0xffb03a),0.1,1.2,0,0.08,0.4,0.08);},
  pennant:g=>{part(g,geoBox,M(0x3a3a3a),0,1.1,0,0.08,2.2,0.08);part(g,geoBox,M(0xc8402a),0.4,1.75,0,0.7,0.9,0.04);part(g,geoBox,MB(0xffd27a),0.4,1.8,0.03,0.25,0.25,0.02);},
  tapestry:g=>{part(g,geoBox,M(0x8a6a3a),0,1.7,0,1.6,1.1,0.05);part(g,geoBox,M(0x4a6a3a),-0.3,1.75,0.03,0.5,0.4,0.02);part(g,geoBox,M(0x3a5a8a),0.35,1.6,0.03,0.4,0.3,0.02);},
  poster:g=>{part(g,geoBox,M(0xd8c89a),0,1.7,0,0.8,1.1,0.04);part(g,geoBox,M(0x8a3a2a),0,1.95,0.03,0.6,0.25,0.02);},
  lanterns:g=>{part(g,geoBox,M(0x3a3a3a),0,2.3,0,1.8,0.03,0.03);for(let i=0;i<5;i++)part(g,geoSphere,MB([0xffb03a,0xff6a3a,0x9fffd0][i%3]),-0.8+i*0.4,2.15,0.05,0.1,0.13,0.1);},
  chart:g=>{part(g,geoBox,M(0x1a2440),0,1.7,0,1.2,1.0,0.04);for(let i=0;i<7;i++)part(g,geoBox,MB(0xfff0b0),-0.45+((i*37)%9)/9,1.3+((i*53)%8)/10,0.03,0.05,0.05,0.02);},
  shield:g=>{part(g,geoBox,M(0x6a6a70),0,1.7,0,0.8,1.0,0.08);part(g,geoBox,M(0xb8743a),0,1.7,0.05,0.2,0.9,0.04);part(g,geoBox,M(0xb8743a),0,1.8,0.05,0.7,0.2,0.04);},
  mask:g=>{part(g,geoBox,M(0x4a3a30),0,1.7,0,0.6,0.7,0.04);part(g,geoBox,M(0x8a7a6a),0,1.72,0.06,0.42,0.5,0.1);part(g,geoBox,MB(0xff4a2a),-0.1,1.8,0.12,0.08,0.05,0.02);part(g,geoBox,MB(0xff4a2a),0.1,1.8,0.12,0.08,0.05,0.02);}};
const FURN={
  rug:{n:'Dune-weave Rug',ic:'🟫',k:'floor',cf:1,buy:{cr:150}},
  poster:{n:'Faded Caravan Poster',ic:'📜',k:'wall',cf:0,buy:{cr:120}},
  glamp:{n:'Glowcap Lamp',ic:'💡',k:'floor',cf:1,buy:{cr:250}},
  tapestry:{n:'Reach Map Tapestry',ic:'🗺️',k:'wall',cf:1,buy:{cr:350}},
  planter:{n:'Still-water Planter',ic:'🪴',k:'floor',cf:1,buy:{cr:400}},
  table:{n:'Skiff-plate Table',ic:'🪵',k:'floor',cf:1,buy:{cr:450}},
  chair:{n:'Salvage Armchair',ic:'🪑',k:'floor',cf:2,buy:{cr:700}},
  daybed:{n:'Settler\'s Day Bed',ic:'🛏️',k:'floor',cf:3,buy:{cr:1400}},
  lanterns:{n:'Signal Lantern String',ic:'🏮',k:'wall',cf:1,buy:{wr:4}},
  shelf:{n:'Courier\'s Bookshelf',ic:'📚',k:'floor',cf:2,buy:{wr:6}},
  chart:{n:'Starfall Chart',ic:'✨',k:'wall',cf:2,buy:{wr:8}},
  hearth:{n:'Ember Hearth',ic:'🔥',k:'floor',cf:3,buy:{wr:12}},
  bench:{n:'Riveted Bench',ic:'🔩',k:'floor',cf:1,craft:'h_bench'},
  brazier:{n:'Cinder Brazier',ic:'🏺',k:'floor',cf:2,craft:'h_brazier'},
  shield:{n:'Forged Wall Shield',ic:'🛡️',k:'wall',cf:1,craft:'h_shield'},
  diffuser:{n:'Duskpetal Diffuser',ic:'🌸',k:'floor',cf:2,craft:'h_diffuser'},
  still:{n:'Copper Still',ic:'⚗️',k:'floor',cf:1,craft:'h_still'},
  orb:{n:'Storm-glass Orb',ic:'🔮',k:'floor',cf:2,drop:'dungeon'},
  sculpt:{n:'Veinstone Sculpture',ic:'🗿',k:'floor',cf:1,drop:'dungeon'},
  mask:{n:'Mounted Raider Mask',ic:'👺',k:'wall',cf:1,drop:'dungeon'},
  pennant:{n:'Victor\'s Pennant',ic:'🚩',k:'floor',cf:1,drop:'hard'}};
// crafted furniture: schematics sold at hubs (src vendor), like the other tradeskill recipes
QREC.push(
  {id:'h_bench',ts:'forge',n:'Riveted Bench (furniture)',ic:'🔩',rk:5,mats:[['ore',2],['scrap',2]],out:{furn:'bench'},src:'vendor'},
  {id:'h_brazier',ts:'forge',n:'Cinder Brazier (furniture)',ic:'🏺',rk:15,mats:[['ore',3],['scrap',2]],out:{furn:'brazier'},src:'vendor'},
  {id:'h_shield',ts:'forge',n:'Forged Wall Shield (furniture)',ic:'🛡️',rk:25,mats:[['ore',3],['shard',1]],out:{furn:'shield'},src:'vendor'},
  {id:'h_diffuser',ts:'distill',n:'Duskpetal Diffuser (furniture)',ic:'🌸',rk:8,mats:[['bloom',3],['ore',1]],out:{furn:'diffuser'},src:'vendor'},
  {id:'h_still',ts:'distill',n:'Copper Still (furniture)',ic:'⚗️',rk:18,mats:[['bloom',2],['circuit',1],['ore',1]],out:{furn:'still'},src:'vendor'});
/* ---------- shared apartment state ---------- */
function aptLoad(){let a=null;try{a=JSON.parse(localStorage.getItem(APT_KEY)||'null');}catch(e){}if(!a||typeof a!=='object')a={};
  const tier=Math.max(0,Math.min(APT_TIERS.length-1,Math.floor(+a.tier||0)));const own={},slots={};
  const O=a.own&&typeof a.own==='object'?a.own:{};for(const k in O)if(FURN[k]){const n=Math.max(0,Math.min(99,Math.floor(+O[k]||0)));if(n)own[k]=n;}
  const S0=a.slots&&typeof a.slots==='object'?a.slots:{};const used={};
  for(const s of SLOTS){const k=S0[s.id];if(FURN[k]&&FURN[k].k===s.k&&s.t<=tier&&(used[k]|0)<(own[k]|0)){slots[s.id]=k;used[k]=(used[k]|0)+1;}}
  return {v:APT_VER,tier,slots,own};}
function aptWrite(a){lsSet(APT_KEY,JSON.stringify(a));}
function aptPlaced(a,k){return Object.values(a.slots).filter(x=>x===k).length;}
function aptFree(a,k){return (a.own[k]|0)-aptPlaced(a,k);}
function aptGain(k,why){if(!FURN[k])return false;const a=aptLoad();a.own[k]=Math.min(99,(a.own[k]|0)+1);aptWrite(a);
  log('🛋 '+(why==='drop'?'Furniture found':why==='craft'?'Furniture made':'Furniture bought')+': <b>'+FURN[k].ic+' '+FURN[k].n+'</b> (in your apartment\'s storage; place it from the 🏠 Home table).');if(inLocker())drawFurn();return true;}
function aptBuy(k){const F=FURN[k];if(!F||!F.buy)return false;if(!inLocker()){warn('Buy furniture at the 🏠 Home table in your apartment');return false;}
  if(F.buy.cr){if(P.credits<F.buy.cr){warn('Not enough credits');return false;}P.credits-=F.buy.cr;}
  else if(F.buy.wr){const r=rmi();if((r.writs|0)<F.buy.wr){warn('Not enough writs (✦ from random missions)');return false;}r.writs-=F.buy.wr;}
  aptGain(k,'buy');SFX.coin();save();return true;}
function aptPlace(slotId,k){const a=aptLoad();const s=SLOTS.find(x=>x.id===slotId);if(!s||s.t>a.tier)return false;
  if(!k){delete a.slots[slotId];aptWrite(a);drawFurn();return true;}
  const F=FURN[k];if(!F||F.k!==s.k)return false;const cur=a.slots[slotId];if(cur===k)return true;if(aptFree(a,k)<1)return false;a.slots[slotId]=k;aptWrite(a);drawFurn();SFX.loot&&SFX.loot();return true;}
function aptUpgrade(){const a=aptLoad();const nx=APT_TIERS[a.tier+1];if(!nx)return false;if(P.level<nx.lvl){warn('Needs level '+nx.lvl);return false;}
  const r=rmi();if(P.credits<nx.cr||(r.writs|0)<nx.wr){warn('Needs '+nx.cr+'¢ and '+nx.wr+' ✦ writs');return false;}
  P.credits-=nx.cr;r.writs-=nx.wr;a.tier++;aptWrite(a);save();if(inLocker()){drawFurn();drawTrophies();}banner('🏠 '+nx.n.toUpperCase(),nx.d);SFX.level();return true;}
function aptComfort(a){a=a||aptLoad();let c=0;for(const k of Object.values(a.slots))c+=FURN[k].cf;
  let old=0;try{old=Math.min(4,loadBank().deco.length*0.5);}catch(e){}return Math.min(20,c+old);}
// drops: dungeon final bosses (more on hard modes), raid final bosses
function aptBossDrop(e){if(!DUN||DUN.apt||!e.boss||!e.boss.final)return;const h=typeof hmOn==='function'?hmOn():null;const t=h?h.tier:0;
  const p=DUN.D.raid?0.25:0.05+0.03*t;if(Math.random()>=p)return;const a=aptLoad();
  let pool=Object.keys(FURN).filter(k=>FURN[k].drop==='dungeon'||(t>=1&&FURN[k].drop==='hard'));const fresh=pool.filter(k=>!a.own[k]);if(fresh.length)pool=fresh;aptGain(pick(pool),'drop');}
/* ---------- per-character: rested XP + trophy pins ---------- */
function normHome(o){o=o&&typeof o==='object'?o:{};const pin=(Array.isArray(o.pin)?o.pin:[]).filter(x=>typeof x==='string'&&x.length<60).slice(0,14);
  return {v:HOME_VER,pool:Math.max(0,Math.floor(+o.pool||0)),t:Math.max(0,Math.floor(+o.t||0)),at:o.at?1:0,pin};}
function homeFields(s){return {home:normHome(s.home)};}
const homi=()=>P.home||(P.home=normHome(null));
function restCap(c){if(P.level>=MAXLVL)return 0;c=c==null?aptComfort():c;return Math.round((1.5+Math.min(0.5,0.025*c))*xpNeed(P.level));}
function restRate(home,c){c=c==null?aptComfort():c;return (home?0.08:0.02)*(1+Math.min(0.6,0.03*c));}// fraction of a level per real hour
let restAcc=0;
function restTick(force){const h=homi(),now=Date.now();if(!force&&now-restAcc<1000)return;restAcc=now;
  if(!h.t){h.t=now;h.at=inLocker()?1:0;return;}const hrs=Math.max(0,(now-h.t)/3.6e6);const away=hrs>2/60;const home=away?!!h.at:inLocker();
  if((away||home)&&P.level<MAXLVL){const c=aptComfort(),cap=restCap(c);const add=Math.floor(restRate(home,c)*hrs*xpNeed(P.level));
    if(add>0&&h.pool<cap){const was=h.pool;h.pool=Math.min(cap,h.pool+add);if(away&&h.pool-was>0)log('💤 Rested while away'+(home?' (at home)':'')+': <b>+'+(h.pool-was)+' bonus XP</b> pooled. Kills give double XP until it runs out.');}}
  h.t=now;h.at=inLocker()?1:0;}
function restUse(n){const h=homi();if(!h.pool||n<=0||P.xpLock||P.level>=MAXLVL)return 0;if(typeof bandCapOf==='function'&&P.level>=Math.min(MAXLVL,bandCapOf(P)))return 0;const b=Math.min(h.pool,Math.round(n));h.pool-=b;return b;}
function restBar(){restTick();const bar=bars&&bars.xp;if(!bar)return;let el=bar.querySelector('.rbar');if(!el){el=document.createElement('b');el.className='rbar';el.style.cssText='position:absolute;top:0;bottom:0;background:rgba(90,170,255,.55);pointer-events:none;border-radius:inherit';if(getComputedStyle(bar).position==='static')bar.style.position='relative';bar.appendChild(el);}
  const h=homi();const need=xpNeed(P.level);const f0=P.level>=MAXLVL?1:Math.min(1,P.xp/need);const w=P.level>=MAXLVL?0:Math.min(1-f0,h.pool/need);el.style.left=(f0*100)+'%';el.style.width=(w*100)+'%';el.style.display=w>0?'':'none';
  bar.title=h.pool?'Rested: '+h.pool+' bonus XP (kills give double XP)':'';}
function restHtml(){const h=P.home;return h&&h.pool>0&&P.level<MAXLVL?' <span class="rzz" title="Rested: kills give double XP">💤</span>':'';}
/* ---------- trophies (from the character's records) ---------- */
function trophies(){const L=[];const add=(id,ic,n,sub,c)=>L.push({id,ic,n,sub,c});
  for(const id in (P.raidClears||{}))if(P.raidClears[id]>0&&RAIDS[id])add('r:'+id,'⚔',RAIDS[id].name,'Raid cleared ×'+P.raidClears[id],'#b46aff');
  const B=(P.hm&&P.hm.best)||{};for(const k in B){const b=B[k];if(!b.c)continue;const id=k.slice(2);const nm=k[0]==='r'?(RAIDS[id]||{}).name:(DUNGEONS[id]||{}).name;if(!nm)continue;const tab=hmTab(k);const t=tab[Math.min(b.c,tab.length-1)];
    add('h:'+k,'🏅',nm+(k[0]==='t'?' (team)':''),t.n+' clear'+(b.tm&&k[0]!=='r'?' · timed '+tab[Math.min(b.tm,tab.length-1)].n:''),t.c);}
  const tn=(typeof tgOf==='function'?tgOf(P).n:null)||{};for(const id in tn)if(tn[id]&&DUNGEONS[id])add('t:'+id,'👥',DUNGEONS[id].name,'Team version cleared','#ff5fd2');
  for(const id in (P.dunClears||{})){const D=DUNGEONS[id];if(!D||!(P.dunClears[id]>0))continue;const fr=D.rooms.filter(r=>r.boss).pop();const B2=fr&&BOSSES[fr.boss];
    add('d:'+id,'💀',B2?ETYPES[B2.etype].name:D.name,D.name+' cleared ×'+P.dunClears[id],'#ff9a2a');}
  for(const t of (P.titles||[]))add('ti:'+t,'🎖','«'+t+'»','Title earned','#ffd27a');
  return L;}
function trophyShown(){const L=trophies(),h=homi(),n=APT_TIERS[aptLoad().tier].troph;const by=Object.fromEntries(L.map(x=>[x.id,x]));const out=h.pin.filter(id=>by[id]).map(id=>by[id]);
  for(const x of L){if(out.length>=n)break;if(!out.includes(x))out.push(x);}return out.slice(0,n);}
function trophyPin(id){const h=homi();const i=h.pin.indexOf(id);if(i>=0)h.pin.splice(i,1);else{const n=APT_TIERS[aptLoad().tier].troph;if(h.pin.length>=n){warn('All '+n+' plaques are pinned. Unpin one first.');return false;}h.pin.push(id);}save();if(inLocker())drawTrophies();return true;}
/* ---------- 3D: furniture + trophy plaques ---------- */
function drawFurn(){const d=DUN;if(!d||!d.apt)return;if(!d.furnG){d.furnG=new THREE.Group();d.group.add(d.furnG);}const G=d.furnG;while(G.children.length)G.remove(G.children[0]);const a=aptLoad();
  for(const s of SLOTS){if(s.t>a.tier)continue;const k=a.slots[s.id];const g=new THREE.Group();g.position.set(s.x,0,s.z);g.rotation.y=s.k==='wall'?s.r:Math.atan2(-s.x,-s.z);
    if(k)FURN_B[k](g);else if(s.k==='floor'){const m=part(g,geoBox,new THREE.MeshBasicMaterial({color:0xffc85a,transparent:true,opacity:0.18,depthWrite:false}),0,0.01,0,1.0,0.01,1.0);m.renderOrder=1;}G.add(g);}}
function drawTrophies(){const d=DUN;if(!d||!d.apt)return;if(!d.trophG){d.trophG=new THREE.Group();d.group.add(d.trophG);}const G=d.trophG;while(G.children.length)G.remove(G.children[0]);const a=aptLoad();const n=APT_TIERS[a.tier].troph;const S=trophyShown();
  for(let i=0;i<n;i++){const p=TROPHY_POS[i];const g=new THREE.Group();g.position.set(p.x,p.y,p.z);g.rotation.y=-Math.PI/2;part(g,geoBox,M(0x4a3426),0,0,0,0.8,0.6,0.06);part(g,geoBox,M(0x3a2a20),0,-0.36,0.12,0.8,0.06,0.3);
    const t=S[i];if(t){const col=new THREE.Color(t.c).getHex();part(g,geoBox,MB(col),0,0.05,0.05,0.42,0.3,0.04);part(g,geoIco,MB(col),0,-0.18,0.16,0.12,0.14,0.12);}G.add(g);}}
function aptBuildT(d){drawFurn();drawTrophies();}
/* ---------- 🏠 Home panel ---------- */
const HP={tab:'furnish',slot:null};
function openHome(tab){if(tab)HP.tab=tab;const a=aptLoad(),T0=APT_TIERS[a.tier],t=HP.tab,home=inLocker();const r=rmi();const c=aptComfort(a);
  let h=`<div class="craftbar"><span class="cbi">🏠</span><span class="cbn"><b>${esc(T0.n)}</b><small>Comfort ${c} · ${P.credits}¢ · ${r.writs|0} ✦ writs · 💤 ${homi().pool} rested XP</small></span></div>`;
  h+=`<div class="tabs">${[['furnish','🛋 Furnish'],['shop','🛒 Furniture'],['trophies','🏆 Trophies'],['rest','💤 Rest'],['upgrade','🏗 Upgrade']].map(([k,n])=>`<button data-act="htab" data-t="${k}" class="${t===k?'on':''}" style="min-height:44px">${n}</button>`).join('')}</div>`;
  const bs='min-height:44px;min-width:44px;margin:3px;padding:4px 8px';
  if(t==='furnish'){const sel=SLOTS.find(s=>s.id===HP.slot&&s.t<=a.tier);
    h+=`<div style="font-size:13px;opacity:.85;margin:4px 0">Tap a slot, then tap a piece to put there. Floor pieces go in floor slots, wall pieces on walls. ${SLOTS.filter(s=>s.t<=a.tier).length}/${SLOTS.length} slots unlocked.</div><div class="hgrid" id="homeGrid" style="display:flex;flex-wrap:wrap">`+
      SLOTS.map(s=>{const lk=s.t>a.tier,k=a.slots[s.id];return `<button class="sbtn${lk?' locked':''}" data-act="${lk?'hslotlk':'hslot'}" data-s="${s.id}" style="${bs};width:96px;${!lk?(sel===s?'outline:2px solid #ffc85a;background:#5a4424;color:#fff3d6;':'background:#241c16;color:#f0e6d0;'):''}"><div style="font-size:18px">${lk?'🔒':k?FURN[k].ic:s.k==='wall'?'🖼':'⬜'}</div><div style="font-size:11px;line-height:1.1">${s.id} · ${esc(lk?APT_TIERS[s.t].n:k?FURN[k].n:s.n)}</div></button>`;}).join('')+`</div>`;
    if(sel){const opts=Object.keys(FURN).filter(k=>FURN[k].k===sel.k&&(a.own[k]|0)>0);
      h+=`<div class="h4">Slot ${sel.id} · ${esc(sel.n)} (${sel.k})</div>`+(a.slots[sel.id]?`<button class="sbtn" data-act="hclear" data-s="${sel.id}" style="${bs}">✖ Clear slot (${esc(FURN[a.slots[sel.id]].n)} back to storage)</button>`:'')+
        (opts.length?opts.map(k=>{const f=aptFree(a,k),on=a.slots[sel.id]===k;return `<button class="item${on?' sel':''}" data-act="hput" data-s="${sel.id}" data-k="${k}" style="min-height:44px${!on&&f<1?';opacity:.5':''}"><span class="ico">${FURN[k].ic}</span><span><div class="nm">${esc(FURN[k].n)}</div><div class="sub">Comfort +${FURN[k].cf} · ${on?'here now':f+' in storage'}</div></span></button>`;}).join(''):`<div style="opacity:.75;font-size:13px">No ${sel.k} pieces yet. Get some in 🛒 Furniture.</div>`);}}
  else if(t==='shop'){h+=`<div style="font-size:13px;opacity:.85;margin:4px 0">${home?'Buy here; pieces go to storage.':'Buying works at the 🏠 Home table in your apartment.'} Crafted pieces need a schematic (sold at hubs) and Forging or Distilling. Some pieces only drop from dungeon and raid final bosses (more on hard modes).</div>`+
    Object.keys(FURN).map(k=>{const F=FURN[k];const how=F.buy?(F.buy.cr?F.buy.cr+'¢':F.buy.wr+' ✦ writs'):F.craft?(()=>{const R=QREC.find(x=>x.id===F.craft);return 'Craft: '+QTS[R.ts].ic+' '+QTS[R.ts].n+' rank '+R.rk;})():F.drop==='hard'?'Drop: hard-mode final bosses':'Drop: dungeon & raid final bosses';
      return `<div class="item" style="min-height:44px"><span class="ico">${F.ic}</span><span style="flex:1"><div class="nm">${esc(F.n)}</div><div class="sub">${F.k} · comfort +${F.cf} · ${how} · owned ${a.own[k]|0}</div></span>${F.buy?`<button class="sbtn${home?'':' locked'}" data-act="hbuy" data-k="${k}" style="${bs}">Buy</button>`:''}</div>`;}).join('');}
  else if(t==='trophies'){const L=trophies(),S=new Set(trophyShown().map(x=>x.id)),pin=homi().pin;
    h+=`<div style="font-size:13px;opacity:.85;margin:4px 0">Your trophy wall has <b>${T0.troph}</b> plaques (more with upgrades). Pinned trophies always get a plaque; the rest fill in by rank: raids, hard modes, team clears, dungeons, titles.</div>`+
      (L.length?L.map(x=>`<button class="item${S.has(x.id)?' sel':''}" data-act="hpin" data-id="${esc(x.id)}" style="min-height:44px"><span class="ico" style="color:${x.c}">${x.ic}</span><span><div class="nm">${esc(x.n)}</div><div class="sub">${esc(x.sub)} · ${pin.includes(x.id)?'📌 pinned':S.has(x.id)?'on the wall':'in the cabinet'}</div></span></button>`).join(''):'<div style="opacity:.75">No trophies yet: clear a dungeon, a raid or a hard mode.</div>');}
  else if(t==='rest'){const hh=homi(),cap=restCap(c),need=xpNeed(P.level);
    h+=`<div class="mis"><b>💤 Rested XP</b>: ${hh.pool} / ${cap} bonus XP (${(hh.pool/need).toFixed(2)} of ${(cap/need).toFixed(2)} levels).<div style="font-size:13px;margin-top:4px">While you're logged out, rested XP builds up (<b>${Math.round(restRate(true,c)*100)}%</b> of a level per hour if you log out <b>at home</b>, ${Math.round(restRate(false,c)*100)}% elsewhere). It also builds while you stay in the apartment. Kills give <b>double XP</b> until the pool runs out (quests and missions don't use it). The blue part of the XP bar shows it.</div></div>
      <div class="mis"><b>Comfort ${c}</b> / 20: furniture in slots adds comfort (old decor counts half, up to 4). Comfort raises the rest rate by up to +60% and the cap by up to +0.5 levels (now +${Math.round(Math.min(0.6,0.03*c)*100)}% rate, +${Math.min(0.5,0.025*c).toFixed(2)} levels).</div>`;}
  else if(t==='upgrade'){h+=APT_TIERS.map((x,i)=>`<div class="mis" style="border-color:${i<=a.tier?'#6dff8a':'#ffc85a'}"><b>${i+1}. ${esc(x.n)}</b> ${i<=a.tier?'✔':''}<div style="font-size:13px">${esc(x.d)} · ${SLOTS.filter(s=>s.t<=i).length} furniture slots · ${x.troph} trophy plaques${i?' · costs '+x.cr+'¢ + '+x.wr+' ✦ writs · level '+x.lvl+'+':''}</div>${i===a.tier+1?`<button class="sbtn" data-act="hupg" style="${bs}">🏗 Upgrade (${x.cr}¢ + ${x.wr} ✦)</button>`:''}</div>`).join('')+`<div style="font-size:12px;opacity:.75">The apartment and its furniture are shared by all your characters; trophies and rested XP are per character.</div>`;}
  openPanel('🏠 HOME',h,'home');}
function homeAct(a,b){const D=b.dataset;
  if(a==='htab'){openHome(D.t);return true;}
  if(a==='hslot'){HP.slot=HP.slot===D.s?null:D.s;openHome('furnish');return true;}
  if(a==='hslotlk'){const s=SLOTS.find(x=>x.id===D.s);warn('🔒 Upgrade to '+APT_TIERS[s.t].n+' to unlock this slot');return true;}
  if(a==='hput'){if(!aptPlace(D.s,D.k))warn('No spare '+FURN[D.k].n+' in storage');openHome('furnish');return true;}
  if(a==='hclear'){aptPlace(D.s,null);openHome('furnish');return true;}
  if(a==='hbuy'){aptBuy(D.k);openHome('shop');return true;}
  if(a==='hpin'){trophyPin(D.id);openHome('trophies');return true;}
  if(a==='hupg'){aptUpgrade();openHome('upgrade');return true;}
  return false;}
function homeExports(){return {APT_KEY,APT_TIERS,SLOTS,FURN,aptLoad,aptWrite,aptGain,aptBuy,aptPlace,aptUpgrade,aptComfort,aptFree,aptBossDrop,normHome,homeFields,homi,restCap,restRate,restTick,restUse,restBar,restHtml,trophies,trophyShown,trophyPin,openHome,homeAct,drawFurn,drawTrophies};}
