/* ===== Build U: achievements, collection log, wardrobe (transmog), companions, vehicles, rare spawns =====
   State: P.ach (v1) {got:{id:time},ev:{nd,ndh,ndr,cap,rk:{},dk:{}},bf} and P.coll (v1) {u:{uniqKey:1},lk:{lookKey:1},xm:{slot:lookKey},cmp:{id:1},act}
   saved through achFields() in futureFields. Achievements are checked from the character's records every ~2 s (achTick), so veterans are
   credited on load (silent backfill, one summary popup). Feats that need an event (no-death clears, dyna and rare kills) count from Build U on. */
const ACH_CATS=[['lvl','📈','Levelling'],['exp','🗺','Exploration'],['dun','💀','Dungeons & raids'],['hm','⚔','Hard modes'],['sto','📜','Story'],['pro','⭐','Professions & perks'],['cra','🛠','Crafting'],['mis','🎲','Missions & writs'],['apt','🏠','Apartment'],['col','📖','Collections'],['fea','🏆','Feats']];
/* ---------- cosmetic companions (code-built, no assets) ---------- */
const COMPS={
  hopper:{n:'Dust Hopper',ic:'🐇',col:0xc9a07a,src:'Achievement: Seasoned Contractor (reach level 20)'},
  moth:{n:'Glimmer Moth',ic:'🦋',col:0x7ff6ff,fly:1,src:'Achievement: Region Hopper (chart 4 regions)'},
  drone:{n:'Scrap Drone',ic:'🛸',col:0x8a9098,fly:1,src:'Achievement: Journeyman (a tradeskill at rank 50)'},
  newt:{n:'Ember Newt',ic:'🦎',col:0xff7a3a,src:'Achievement: Untouched (clear a dungeon without dying)'},
  beetle:{n:'Brass Beetle',ic:'🪲',col:0xc8a03a,src:'Achievement: Mission Machine (100 missions)'},
  sprite:{n:'Salt Sprite',ic:'✨',col:0xf0f4ff,fly:1,src:'Achievement: Rare Collector (5 different rare spawns)'},
  owlet:{n:'Duskwing Owlet',ic:'🦉',col:0x6a5a8a,fly:1,src:'Rare drop: rare spawns below level 15 (15%)'},
  mote:{n:'Rift Mote',ic:'🔮',col:0xb46bff,fly:1,src:'Rare drop: rare spawns level 15+ (15%)'}};
function cmpBuild(id){const C=COMPS[id];const g=new THREE.Group();const b=new THREE.Group();g.add(b);const c=C.col;
  if(id==='hopper'){part(b,geoSphere,M(c),0,0.32,0,0.26,0.24,0.34);part(b,geoSphere,M(c),0,0.5,0.24,0.17,0.16,0.18);part(b,geoBox,M(0xe8d0b0),-0.07,0.74,0.22,0.05,0.24,0.04);part(b,geoBox,M(0xe8d0b0),0.07,0.74,0.22,0.05,0.24,0.04);part(b,geoSphere,M(0xffffff),0,0.34,-0.32,0.08,0.08,0.08);}
  else if(id==='moth'){part(b,geoSphere,M(0x3a3a5a),0,0,0,0.07,0.07,0.22);for(const s of [-1,1]){const w=part(b,geoBox,MB(c),s*0.2,0.02,0,0.34,0.02,0.26);w.userData.wing=s;}}
  else if(id==='drone'){part(b,geoSphere,M(c),0,0,0,0.22,0.14,0.22);part(b,geoBox,M(0x3a3a3a),0,0.14,0,0.6,0.03,0.06);part(b,geoBox,M(0x3a3a3a),0,0.14,0,0.06,0.03,0.6);part(b,geoSphere,MB(0x5ff2ff),0,-0.02,0.2,0.07,0.07,0.04);}
  else if(id==='newt'){part(b,geoSphere,M(c),0,0.1,0,0.14,0.09,0.32);part(b,geoSphere,M(c),0,0.12,0.32,0.1,0.08,0.12);part(b,geoCone,MB(0xffc040),0,0.1,-0.42,0.06,0.3,0.06).rotation.x=-Math.PI/2;}
  else if(id==='beetle'){part(b,geoSphere,M(c),0,0.14,0,0.22,0.14,0.28);part(b,geoSphere,M(0x3a2a14),0,0.12,0.26,0.12,0.1,0.1);for(const s of [-1,1])for(const z of [-0.12,0,0.12])part(b,geoBox,M(0x2a2a2a),s*0.22,0.05,z,0.14,0.03,0.03);}
  else if(id==='sprite'){part(b,geoIco,MB(c),0,0,0,0.16,0.16,0.16);part(b,geoSphere,new THREE.MeshBasicMaterial({color:0x9fe6ff,transparent:true,opacity:0.35,depthWrite:false}),0,0,0,0.3,0.3,0.3);}
  else if(id==='owlet'){part(b,geoSphere,M(c),0,0,0,0.2,0.24,0.2);part(b,geoSphere,MB(0xffd25a),-0.07,0.08,0.17,0.05,0.05,0.03);part(b,geoSphere,MB(0xffd25a),0.07,0.08,0.17,0.05,0.05,0.03);for(const s of [-1,1]){const w=part(b,geoBox,M(0x4a3a6a),s*0.22,0,0,0.2,0.03,0.18);w.userData.wing=s;}}
  else if(C.b)C.b(b,c);
  else{part(b,geoIco,MB(c),0,0,0,0.18,0.18,0.18);const r=part(b,geoBox,MB(0xffb03a),0,0,0,0.5,0.02,0.02);r.userData.spin=1;}
  return {g,b,id};}
let CMP=null;
function cmpSet(id){if(CMP){scene.remove(CMP.g);CMP=null;}const C=colli();C.act=id&&COMPS[id]&&C.cmp[id]?id:null;if(C.act){CMP=cmpBuild(C.act);CMP.g.position.set(P.pos.x-1.2,P.pos.y,P.pos.z-1.2);scene.add(CMP.g);}}
function cmpUpd(dt){const want=state==='play'?colli().act:null;if(!want){if(CMP){scene.remove(CMP.g);CMP=null;}return;}if(!CMP||CMP.id!==want){cmpSet(want);if(!CMP)return;}
  const C=COMPS[CMP.id],g=CMP.g;const a=(P.rotY||0)+2.4;const tx=P.pos.x+Math.sin(a)*1.5,tz=P.pos.z+Math.cos(a)*1.5;const dx=tx-g.position.x,dz=tz-g.position.z,d=Math.hypot(dx,dz);
  if(d>25){g.position.set(tx,P.pos.y,tz);}else{const k=Math.min(1,dt*(d>4?6:3));g.position.x+=dx*k;g.position.z+=dz*k;if(d>0.05)g.rotation.y=Math.atan2(dx,dz);}
  g.position.y=P.pos.y+(C.fly?1.5+Math.sin(T*2.4)*0.15:Math.abs(Math.sin(T*(d>0.3?9:2)))*(d>0.3?0.18:0.03));
  CMP.b.traverse(o=>{if(o.userData.wing)o.rotation.z=o.userData.wing*Math.sin(T*18)*0.6;if(o.userData.spin)o.rotation.y=T*3;});}
/* ---------- extra vehicles (achievement rewards; same speed as the faction skiffs) ---------- */
Object.assign(VEHICLES,{
  pathfinder:{name:'Pathfinder Skiff',speed:2.35,col:0x5a7a4a,trim:0x2a3a22,glow:0x9fff7a,src:'Achievement: Wayfarer (chart every region)'},
  gilded:{name:'Gilded Dunerunner',speed:2.35,col:0xc9a23a,trim:0x5a4a22,glow:0xffe08a,src:'Achievement: Deepdelver (clear every dungeon)'},
  nightglider:{name:'Night Glider',speed:2.35,col:0x2a2440,trim:0x14101e,glow:0xb46bff,src:'Achievement: Into the Nightmare (a Nightmare clear)'}});
/* ---------- achievement-only furniture ---------- */
Object.assign(FURN,{
  globe:{n:'Pathfinder\'s Globe',ic:'🌐',k:'floor',cf:2,ach:'Wayfarer (chart every region)'},
  cabinet:{n:'Curio Cabinet',ic:'🗄️',k:'floor',cf:2,ach:'Curator (collect 40 unique items)'},
  laurel:{n:'Laurel of Deeds',ic:'🏅',k:'wall',cf:2,ach:'Archivist (250 achievement points)'}});
Object.assign(FURN_B,{
  globe:g=>{part(g,geoBox,M(0x5a3a22),0,0.4,0,0.16,0.8,0.16);part(g,geoBox,M(0x3a2a1a),0,0.03,0,0.6,0.06,0.6);part(g,geoSphere,M(0x3a6a8a),0,1.15,0,0.42,0.42,0.42);part(g,geoSphere,M(0xc8a060),0.12,1.25,0.25,0.2,0.16,0.2);},
  cabinet:g=>{part(g,geoBox,M(0x4a3020),0,0.9,0,1.3,1.8,0.5);part(g,geoBox,new THREE.MeshLambertMaterial({color:0x9fe8ff,transparent:true,opacity:0.35}),0,1.0,0.26,1.1,1.4,0.02);for(const [x,y,c] of [[-0.3,0.55,0xff9a2a],[0.25,0.55,0xffd27a],[0,1.05,0xff4f5e],[-0.3,1.5,0x59c8ff],[0.3,1.5,0xb46bff]])part(g,geoIco,MB(c),x,y,0.05,0.1,0.12,0.1);},
  laurel:g=>{part(g,geoBox,M(0x3a2a20),0,1.8,0,1.1,1.1,0.06);for(let i=0;i<10;i++){const a=Math.PI*(0.15+i*0.075);part(g,geoSphere,MB(0xffd25a),Math.cos(a)*0.38*(i<5?-1:1)*(i<5?1:1),1.62+Math.sin(a)*0.38,0.05,0.07,0.1,0.04);}part(g,geoIco,MB(0xffd27a),0,1.85,0.06,0.16,0.18,0.06);}});
/* ---------- rare spawns (one near each dyna; marked on the minimap while up) ---------- */
const RARES={
  quill:{n:'Quill the Bone-Picker',dy:'ketch',t:'raider',col:0x8a6a4a,glow:0xffe08a},sandglass:{n:'Sandglass Skitterqueen',dy:'gravelmaw',t:'skitter',col:0xd8b070,glow:0xffd25a},
  murkfin:{n:'Murkfin',dy:'bogtooth',t:'spitter',col:0x2a5a3a,glow:0x9fff7a},saltwhisper:{n:'Saltwhisper',dy:'paledrifter',t:'skitter',col:0xf0ece0,glow:0x9fe6ff},
  emberback:{n:'Emberback',dy:'redcrest',t:'skitter',col:0xa03a1a,glow:0xff8a3a},cogsnare:{n:'Cogsnare',dy:'rustjaw',t:'raider',col:0x5c5e62,glow:0xffa040},
  shardgleam:{n:'Shardgleam',dy:'prismhide',t:'spitter',col:0x9fd8e8,glow:0x7ff6ff},ashpelt:{n:'Ashpelt Stalker',dy:'cindermane',t:'mauler',col:0x4a2a1a,glow:0xff5a1a},
  gloomantler:{n:'Gloomantler',dy:'hollowking',t:'stalker',col:0x3a3050,glow:0x9f7bff},hymnless:{n:'The Hymnless Tender',dy:'seraph',t:'tender',col:0xe8e0ff,glow:0xb46bff},
  frostquill:{n:'Frostquill Burrower',dy:'rimeback',t:'burrower',col:0xc8dcec,glow:0x9fe8ff},varn:{n:'Old Sentinel Varn',dy:'palequeen',t:'sentinel',col:0xf4f8fc,glow:0x6fe8ff}};
const RR={live:{},next:{},spot:{},acc:0,off:false};
function rrSpot(k){if(RR.spot[k]!==undefined)return RR.spot[k];const R=RARES[k],D=DYNAS[R.dy];if(!D||D.x==null||!ETYPES[R.t])return RR.spot[k]=null;const bi=biomeIdx(D.x,D.z);let s=null;
  for(let i=0;i<12&&!s;i++){const a=i*0.52+k.length;const x=D.x+Math.cos(a)*55,z=D.z+Math.sin(a)*55;if(Math.abs(x)<HALF-20&&Math.abs(z)<HALF-20&&biomeIdx(x,z)===bi&&!(Math.abs(x)<TOWN+20&&Math.abs(z)<TOWN+20))s={x,z};}
  return RR.spot[k]=s;}
function rrLv(k){return DYNAS[RARES[k].dy].lv;}
function rrTick(){if(RR.off||SIMP||SIMST||state!=='play'||DUN)return;const now=Date.now();
  for(const k in RARES){const s=rrSpot(k);if(!s)continue;const L=RR.live[k];const d=Math.hypot(P.pos.x-s.x,P.pos.z-s.z);
    if(L){if(L.e.dead){if(!L.killed){L.killed=true;rrOnKill(k,L.e);setTimeout(()=>{if(enemies.includes(L.e))removeEnemy(L.e);},4000);delete RR.live[k];}continue;}
      if(!enemies.includes(L.e)){delete RR.live[k];continue;}
      if(!L.seen&&Math.hypot(P.pos.x-L.e.pos.x,P.pos.z-L.e.pos.z)<90){L.seen=true;toast('✦ A rare creature stirs nearby: '+RARES[k].n);}
      if(d>240&&L.e.state!=='chase'){removeEnemy(L.e);delete RR.live[k];RR.next[k]=now+rand(180,360)*1000;}continue;}
    if(d>160||d<45||now<(RR.next[k]||0)||!dyOpen(RARES[k].dy))continue;
    if(Math.random()<0.35)rrSpawn(k);else RR.next[k]=now+rand(120,300)*1000;}}
function rrSpawn(k){const R=RARES[k],s=rrSpot(k);if(!s||RR.live[k])return null;const e=makeElite(R.t,s.x,s.z,rrLv(k),'✦ '+R.n,R.col,{hp:3,dmg:1.25,scale:1.35,glow:R.glow,xp:4});e.rare=k;e.leash=40;RR.live[k]={e,t:Date.now()};return e;}
function rrOnKill(k,e){const R=RARES[k],lv=rrLv(k),A=achi();A.ev.rk[k]=(A.ev.rk[k]|0)+1;RR.next[k]=Date.now()+rand(900,1800)*1000;
  const it=genItem(lv,null,Math.max(3,rollRarity(35)));it.dropBy=R.n;dropLoot(e.pos.x,e.pos.z+1.5,it);P.credits+=40*lv;
  banner('✦ RARE DEFEATED',R.n+' · it may return in a while');log('✦ <b>'+esc(R.n)+'</b> defeated (+'+(40*lv)+'¢). Rare spawns: '+Object.keys(A.ev.rk).length+'/'+Object.keys(RARES).length+' found.');
  const pet=lv>=15?'mote':'owlet';if(!colli().cmp[pet]&&Math.random()<0.15){colli().cmp[pet]=1;log('🐾 <b>New companion</b>: '+COMPS[pet].ic+' '+COMPS[pet].n+' (📖 Achievements › 🐾 Companions).');achPop('🐾 New companion',COMPS[pet].ic+' '+COMPS[pet].n);}save();}
function rrMini(c,tf){for(const k in RR.live){const L=RR.live[k];if(L.e.dead)continue;const q=tf(L.e.pos.x,L.e.pos.z);c.font='bold 17px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';c.fillText('✦',q[0]+1,q[1]+1);c.fillStyle='#d58bff';c.fillText('✦',q[0],q[1]);}}
/* ---------- state ---------- */
function normAch(a){a=a&&typeof a==='object'?a:{};const got={};if(a.got&&typeof a.got==='object')for(const k in a.got)if(/^[a-z0-9_]{1,30}$/.test(k))got[k]=Math.max(0,Math.floor(+a.got[k]||0))||1;
  const ev=a.ev&&typeof a.ev==='object'?a.ev:{};const ci=v=>Math.max(0,Math.min(1e7,Math.floor(+v||0)));const mp=(o,D)=>{const r={};if(o&&typeof o==='object')for(const k in o)if(D[k])r[k]=ci(o[k]);return r;};
  return {v:1,got,ev:{nd:ci(ev.nd),ndh:ci(ev.ndh),ndr:ci(ev.ndr),cap:ci(ev.cap),rk:mp(ev.rk,RARES),dk:mp(ev.dk,DYNAS)},bf:a.bf?1:0,cat:ACH_CATS.some(c=>c[0]===a.cat)?a.cat:'lvl'};}
const VSLOTS=['weapon','head','armor','hands','legs','feet'];
function lookOk(k){const p=String(k).split('|');if(p.length!==3)return false;const r=+p[2];if(!(r>=0&&r<RAR.length&&Math.floor(r)===r))return false;return p[0]==='weapon'?!!WTYPES[p[1]]:VSLOTS.includes(p[0])&&!!AFAM[p[1]];}
function normColl(c){c=c&&typeof c==='object'?c:{};const u={},lk={},xm={},cmp={};
  if(c.u&&typeof c.u==='object')for(const k in c.u)if(UNIQUES[k])u[k]=1;if(c.lk&&typeof c.lk==='object')for(const k in c.lk)if(lookOk(k))lk[k]=1;
  if(c.xm&&typeof c.xm==='object')for(const s of VSLOTS){const k=c.xm[s];if(k&&lk[k]&&k.split('|')[0]===s)xm[s]=k;}
  if(c.cmp&&typeof c.cmp==='object')for(const k in c.cmp)if(COMPS[k])cmp[k]=1;return {v:1,u,lk,xm,cmp,act:cmp[c.act]?c.act:null};}
function achFields(s){return {ach:normAch(s.ach),coll:normColl(s.coll)};}
const achi=()=>P.ach||(P.ach=normAch(null)),colli=()=>P.coll||(P.coll=normColl(null));
/* ---------- record readers ---------- */
let CELLB=null,CELLN=null;
function cellBiomes(){if(CELLB&&CELLB.length===EX_N*EX_N)return;CELLB=new Int16Array(EX_N*EX_N);CELLN=new Array(BIOMES.length).fill(0);
  for(let j=0;j<EX_N;j++)for(let i=0;i<EX_N;i++){const x=i*EX_C-HALF+EX_C/2,z=j*EX_C-HALF+EX_C/2;const b=biomeIdx(x,z);CELLB[j*EX_N+i]=b;if(b>=0&&b<CELLN.length)CELLN[b]++;}}
function regionsCharted(){cellBiomes();const got=new Array(BIOMES.length).fill(0);for(let k=0;k<EXP.length;k++)if(EXP[k]){const b=CELLB[k];if(b>=0&&b<got.length)got[b]++;}
  return BIOMES.map((B,i)=>({id:B.id,n:B.name,pct:CELLN[i]?got[i]/CELLN[i]:0}));}
const nCharted=()=>regionsCharted().filter(r=>r.pct>=0.3).length;
const DUNL=()=>Object.keys(DUNGEONS).filter(k=>!DUNGEONS[k].raid&&!DUNGEONS[k].future);
const hmB=()=>(P.hm&&P.hm.best)||{};
const hmAny=f=>Object.entries(hmB()).some(([k,b])=>f(k,b));
function rosterProfs(){const m={};const L=(typeof roster!=='undefined'&&roster&&roster.chars)||[];for(const c of L)if(c&&c.id!==P.id&&(c.level|0)>=10)m[c.prof]=1;if(P.level>=10)m[P.prof]=1;return Object.keys(m).length;}
const craftRk=()=>{const r=(P.craft&&P.craft.rk)||{};return Object.keys(QTS).map(k=>r[k]|0);};
const uniqN=f=>Object.keys(colli().u).filter(k=>UNIQUES[k]&&(!f||f(UNIQUES[k]))).length;
function sunSets(){const out=[];for(const f in SUN_FAM){const ids=Object.keys(UNIQUES).filter(k=>UNIQUES[k].set===SUN_FAM[f].set&&SUN_SLOTS.includes(UNIQUES[k].slot));out.push({f,n:SUN_FAM[f].name,ids,got:ids.filter(k=>colli().u[k]).length});}return out;}
const vehN=()=>(P.vehicles||[]).filter(v=>VEHICLES[v]).length;
const tgN=()=>{try{const n=tgOf(P).n||{};return Object.keys(n).filter(k=>n[k]&&DUNGEONS[k]).length;}catch(e){return 0;}};
const aptOwnN=()=>{const a=aptLoad();return Object.keys(a.own).filter(k=>(a.own[k]|0)>0).length;};
const achPts=()=>{let n=0;const g=achi().got;for(const A of ACH)if(g[A.id])n+=A.p;return n;};
/* ---------- achievement list ---------- */
const ACH=[];
function A_(c,id,n,d,p,v,g,rw){ACH.push({c,id,n,d,p,v,g,rw:rw||null});}
(function achDefs(){const L=()=>P.level|0;
  [[10,'Finding Your Feet',5],[20,'Seasoned Contractor',10,{cmp:'hopper'}],[30,'Veteran of the Reach',10,{writs:5}],[50,'Halfway to the Horizon',15,{writs:10}],[75,'The Long Road',15],[100,'Peak of the Reach',25,{title:'the Seasoned'}]]
    .forEach(([lv,n,p,rw])=>A_('lvl','l'+lv,n,'Reach level '+lv,p,L,lv,rw));
  [[10,'Map Scratcher',5],[25,'Trailblazer',10],[50,'Surveyor',15,{writs:5}],[80,'Every Dune and Drift',20]].forEach(([q,n,p,rw])=>A_('exp','ex'+q,n,'Explore '+q+'% of the Reach (world map)',p,()=>exploredPct(),q,rw));
  A_('exp','rg4','Region Hopper','Chart 4 regions (explore 30% of each)',10,nCharted,4,{cmp:'moth'});A_('exp','rg8','Far Horizons','Chart 8 regions',15,nCharted,8);
  A_('exp','rgall','Wayfarer','Chart every region',25,nCharted,BIOMES.length,{title:'Wayfarer',veh:'pathfinder',furn:'globe'});
  const nDy=Object.keys(DYNAS).length;A_('exp','dy6','Dyna Spotter','Discover 6 dynas',10,()=>(P.dynaSeen||[]).length,6);A_('exp','dyall','Dyna Atlas','Discover every dyna',15,()=>(P.dynaSeen||[]).length,nDy);
  const dkN=()=>Object.keys(achi().ev.dk).length;A_('exp','dk1','Elite Hunter','Defeat a dyna',5,dkN,1);A_('exp','dk6','Dyna Slayer','Defeat 6 different dynas',15,dkN,6,{writs:5});A_('exp','dkall','Bane of the Dynas','Defeat every dyna',25,dkN,nDy);
  const dC=()=>DUNL().filter(k=>(P.dunClears||{})[k]>0).length;
  A_('dun','d1','Into the Dark','Clear any dungeon',5,dC,1);
  DUNL().forEach(k=>A_('dun','d_'+k,DUNGEONS[k].name,'Clear '+DUNGEONS[k].name+' (Lv '+DUNGEONS[k].lvl[0]+'–'+DUNGEONS[k].lvl[1]+')',5,()=>(P.dunClears||{})[k]>0?1:0,1));
  A_('dun','dall','Deepdelver','Clear every dungeon',25,dC,DUNL().length,{title:'Deepdelver',veh:'gilded'});
  A_('dun','d25','Regular','Finish 25 dungeon clears',10,()=>DUNL().reduce((s,k)=>s+((P.dunClears||{})[k]|0),0),25);
  A_('dun','t1','Better Together','Clear a team version of a dungeon',10,tgN,1);A_('dun','t6','Full Roster','Clear 6 different team versions',20,tgN,6,{writs:5});
  A_('dun','rb','Bastion Breaker','Clear the Cinderdeep Bastion raid',15,()=>((P.raidClears||{}).bastion|0)>0?1:0,1);
  A_('dun','rs','Sun-Eater\'s End','Clear the Sunless Throne raid',25,()=>((P.raidClears||{}).sunless|0)>0?1:0,1);
  A_('hm','h1','Harder Than Hard','Clear any dungeon or raid on Hard',10,()=>hmAny((k,b)=>b.c>=1)?1:0,1);
  A_('hm','h2','Into the Nightmare','Clear any dungeon or raid on Nightmare',15,()=>hmAny((k,b)=>b.c>=2)?1:0,1,{veh:'nightglider'});
  A_('hm','ht','Beat the Clock','Beat a hard-mode timer',10,()=>hmAny((k,b)=>k[0]!=='r'&&b.tm>=1)?1:0,1);
  A_('hm','ha3','Ascent III, Timed','Beat the timer on Ascent III',20,()=>hmAny((k,b)=>k[0]!=='r'&&b.tm>=5)?1:0,1);
  A_('hm','ha5','Summit Runner','Beat the timer on Ascent V',25,()=>hmAny((k,b)=>k[0]!=='r'&&b.tm>=7)?1:0,1);
  A_('hm','h5','Hard Five','Hard or harder clears of 5 different doors, team versions or raids',15,()=>Object.values(hmB()).filter(b=>b.c>=1).length,5,{writs:5});
  A_('hm','hr','Nightmare Raider','Clear a raid on Nightmare',25,()=>hmAny((k,b)=>k[0]==='r'&&b.c>=2)?1:0,1);
  A_('hm','hruns','Glutton for Punishment','Finish 25 hard-mode runs',10,()=>(P.hm&&P.hm.runs)|0,25);
  const sN=()=>((P.story&&P.story.done)||[]).length,sAll=((STORY&&STORY.steps)||STORY||[]).length||29;
  [[5,'A Reach Calls',5],[12,'Deeper Threads',10],[20,'The Long Story',15]].forEach(([q,n,p])=>A_('sto','s'+q,n,'Finish '+q+' story steps',p,sN,q));
  A_('sto','sall','Reachborn Hero','Finish the whole story',25,sN,sAll,{title:'Reachborn Hero'});
  const pp=()=>ppSpent(P.perks);[[5,'First Perks',5],[25,'Specialist',10],[60,'Perk Master',15]].forEach(([q,n,p])=>A_('pro','pk'+q,n,'Spend '+q+' perk points',p,pp,q));
  const nP=Object.keys(PROFS).length;[[3,'Many Hands',10],[7,'Jack of All Trades',15]].forEach(([q,n,p])=>A_('pro','pr'+q,n,'Have '+q+' different professions at level 10+ in your roster',p,rosterProfs,q));
  A_('pro','prall','All Fourteen','Have every profession at level 10+ in your roster',25,rosterProfs,nP,{writs:10});
  const rkMax=()=>Math.max(...craftRk());[[25,'Apprentice',5],[50,'Journeyman',10,{cmp:'drone'}],[100,'Grandmaster',15]].forEach(([q,n,p,rw])=>A_('cra','c'+q,n,'Reach rank '+q+' in any tradeskill',p,rkMax,q,rw));
  A_('cra','call','Master Artisan','Reach rank 100 in all three tradeskills',25,()=>craftRk().filter(r=>r>=100).length,Object.keys(QTS).length,{title:'Master Artisan'});
  const kn=()=>((P.craft&&P.craft.known)||[]).length;A_('cra','cr10','Schematic Collector','Know 10 recipes',10,kn,10);A_('cra','crall','Complete Library','Know every recipe',15,kn,QREC.length);
  const mN=()=>rmi().total|0;[[1,'On the Board',5],[25,'Reliable',10,{writs:3}],[100,'Mission Machine',15,{cmp:'beetle'}],[250,'Writ-sworn',25,{title:'Writ-sworn'}]].forEach(([q,n,p,rw])=>A_('mis','m'+q,n,'Complete '+q+' random mission'+(q>1?'s':''),p,mN,q,rw));
  A_('mis','w25','Writ Hoard','Hold 25 ✦ writs at once',10,()=>rmi().writs|0,25);
  A_('apt','a1','Moving In','Own a piece of furniture',5,aptOwnN,1);A_('apt','a10','Collector of Comforts','Own 10 different pieces of furniture',10,aptOwnN,10);
  A_('apt','at1','Settled','Upgrade your apartment to Settled Quarters',10,()=>aptLoad().tier,1);A_('apt','at2','Homesteader','Upgrade your apartment to Homestead Suite',20,()=>aptLoad().tier,2,{title:'Homesteader'});
  A_('apt','ac20','Perfect Comfort','Reach comfort 20',15,()=>aptComfort(),20);A_('apt','atr','Trophy Wall','Earn 8 trophies',10,()=>trophies().length,8);
  [[10,'Treasure Seeker',10],[40,'Curator',15,{furn:'cabinet'}],[100,'Hoard of Legends',25]].forEach(([q,n,p,rw])=>A_('col','u'+q,n,'Collect '+q+' unique items (📖 Collection)',p,()=>uniqN(),q,rw));
  A_('col','rel1','Relic Finder','Collect a Relic',10,()=>uniqN(u=>u.relic),1);A_('col','rel5','Relic Keeper','Collect 5 Relics',20,()=>uniqN(u=>u.relic),5);
  A_('col','sun1','Touched by the Sun','Collect a Sunforged piece',15,()=>uniqN(u=>u.rar===9),1);A_('col','sunset','Sunforged Set','Collect all 5 armour pieces of one Sunforged set',25,()=>Math.max(0,...sunSets().map(s=>s.got)),5);
  A_('col','lk20','Wardrobe Started','Unlock 20 looks',10,()=>Object.keys(colli().lk).length,20);A_('col','lk60','Fashion of the Reach','Unlock 60 looks',15,()=>Object.keys(colli().lk).length,60);
  A_('col','v3','Garage','Own 3 vehicles',10,vehN,3);A_('col','v5','Fleet','Own 5 vehicles',15,vehN,5);
  A_('col','cm3','Menagerie','Own 3 companions',10,()=>Object.keys(colli().cmp).length,3);A_('col','cm6','Pack Leader','Own 6 companions',15,()=>Object.keys(colli().cmp).length,6);
  A_('col','ti5','Many Names','Earn 5 titles',10,()=>(P.titles||[]).length,5);A_('col','cl10','Well Dressed','Own 10 pieces of social clothing',10,()=>((P.clothing&&P.clothing.own)||[]).length,10);
  A_('col','pt250','Archivist','Earn 250 achievement points',0,achPts,250,{furn:'laurel'});A_('col','pt500','Living Legend','Earn 500 achievement points',0,achPts,500,{title:'the Storied'});
  const ev=()=>achi().ev;
  A_('fea','nd1','Untouched','Clear a dungeon or raid without dying',10,()=>ev().nd,1,{cmp:'newt'});A_('fea','nd10','The Undying','10 clears without dying',20,()=>ev().nd,10,{title:'the Undying'});
  A_('fea','ndh','Flawless Ascent','Clear on Hard or harder without dying',15,()=>ev().ndh,1);A_('fea','ndr','Raid Without a Scratch','Clear a raid without dying',25,()=>ev().ndr,1);
  A_('fea','cap1','Twink Win','Clear a dungeon at its level cap (or one below)',10,()=>ev().cap,1);
  A_('fea','k1k','Thousand Cuts','Defeat 1,000 enemies',10,()=>P.kills|0,1000);A_('fea','k10k','Ten Thousand Strong','Defeat 10,000 enemies',25,()=>P.kills|0,10000);
  const rN=()=>Object.keys(ev().rk).length;A_('fea','rr1','Rare Sighting','Defeat a ✦ rare spawn',10,rN,1);A_('fea','rr5','Rare Collector','Defeat 5 different rare spawns',15,rN,5,{cmp:'sprite'});
  A_('fea','rrall','Rarehunter','Defeat every rare spawn',25,rN,Object.keys(RARES).length,{title:'Rarehunter'});})();
const ACHI=Object.fromEntries(ACH.map(a=>[a.id,a]));
const ACH_TITLES=[...new Set(ACH.filter(a=>a.rw&&a.rw.title).map(a=>a.rw.title))];
function achVal(A){try{return Math.max(0,+A.v()||0);}catch(e){return 0;}}
function rwText(rw){if(!rw)return '';const o=[];if(rw.title)o.push('title «'+rw.title+'»');if(rw.writs)o.push(rw.writs+' ✦ writs');if(rw.cmp)o.push('companion '+COMPS[rw.cmp].ic+' '+COMPS[rw.cmp].n);if(rw.veh)o.push('vehicle 🛵 '+VEHICLES[rw.veh].name);if(rw.furn)o.push('furniture '+FURN[rw.furn].ic+' '+FURN[rw.furn].n);return o.join(', ');}
function achReward(rw,silent){if(!rw)return;if(rw.title){P.titles=P.titles||[];if(!P.titles.includes(rw.title))P.titles.push(rw.title);}
  if(rw.writs){const r=rmi();r.writs=(r.writs|0)+rw.writs;}if(rw.cmp)colli().cmp[rw.cmp]=1;
  if(rw.veh){P.vehicles=P.vehicles||[];if(!P.vehicles.includes(rw.veh)){if(silent){P.vehicles.push(rw.veh);if(!P.vsel)P.vsel=rw.veh;}else grantVehicle(rw.veh,'achievement');}}
  if(rw.furn){const a=aptLoad();if(!(a.own[rw.furn]|0)){if(silent){a.own[rw.furn]=1;aptWrite(a);}else aptGain(rw.furn,'ach');}}}
function achGrant(A,silent){const g=achi().got;if(g[A.id])return false;g[A.id]=Date.now();achReward(A.rw,silent);
  if(!silent){log('🏅 <b>Achievement</b>: '+esc(A.n)+(A.p?' (+'+A.p+' pts)':'')+(A.rw?' · reward: '+esc(rwText(A.rw)):''));achPop('🏅 '+A.n,(A.p?'+'+A.p+' pts · ':'')+(A.rw?rwText(A.rw):A.d));}return true;}
/* ---------- collection scan (gear you hold, wear or bank) ---------- */
let colAcc=0;
function lookKey(it){if(!it||it.kind!=='gear'||!VSLOTS.includes(it.slot)||!RAR[it.r|0])return null;return it.slot==='weapon'?(it.wt&&WTYPES[it.wt]?'weapon|'+it.wt+'|'+(it.r|0):null):it.slot+'|'+(AFAM[it.fam]?it.fam:'medium')+'|'+(it.r|0);}
function colScan(bank){const C=colli();const see=it=>{if(!it||typeof it!=='object')return;if(it.uniq&&UNIQUES[it.uniq])C.u[it.uniq]=1;const k=lookKey(it);if(k)C.lk[k]=1;};
  (P.inv||[]).forEach(see);Object.values(P.eq||{}).forEach(see);Object.values(P.imps||{}).forEach(see);
  if(bank){try{loadBank().items.forEach(see);}catch(e){}}
  for(const k in UNIQUES){const u=UNIQUES[k];if(u.kind==='disk'&&(P.known||[]).includes(u.wid))C.u[k]=1;}}
/* ---------- tick ---------- */
let achLast=0;
function achTick(force){if(state!=='play'||SIMP)return 0;const A=achi();colScan(force||(colAcc++%5===0));let n=0;const silent=!A.bf;if(silent&&typeof hmTitleCheck==='function')try{hmTitleCheck();}catch(e){}
  for(let pass=0;pass<2;pass++)for(const a of ACH)if(!A.got[a.id]&&achVal(a)>=a.g&&achGrant(a,silent))n++;
  if(!A.bf){A.bf=1;if(n){log('🏅 <b>'+n+' achievements</b> credited from your records ('+achPts()+' points). Open 🏅 Achievements (O) to see them and their rewards.');achPop('🏅 '+n+' achievements credited','From your records · '+achPts()+' points');}save();}
  else if(n)save();return n;}
function achFrame(dt){cmpUpd(dt);const now=performance.now();if(now-achLast>=2000){achLast=now;achTick();rrTick();}}
/* ---------- events ---------- */
function achClear(e){if(!DUN||DUN.apt||!e.boss||!e.boss.final)return;const A=achi(),D=DUN.D,h=DUN.mode&&DUN.mode.hm,deaths=DUN.pd|0;
  if(!deaths){A.ev.nd++;if(h&&h.tier>=1)A.ev.ndh++;if(D.raid)A.ev.ndr++;}
  if(!D.raid&&D.cap&&P.level>=D.cap-1&&P.level<=D.cap)A.ev.cap++;setTimeout(()=>achTick(true),1500);}
function achDyna(k){const A=achi();A.ev.dk[k]=(A.ev.dk[k]|0)+1;}
/* ---------- popup ---------- */
const APQ=[];let apBusy=false;
function achPop(t,s){APQ.push([t,s]);if(!apBusy)apNext();}
function apNext(){const x=APQ.shift();if(!x){apBusy=false;return;}apBusy=true;let el=document.getElementById('achPop');
  if(!el){el=document.createElement('div');el.id='achPop';el.style.cssText='position:fixed;left:50%;top:max(58px,env(safe-area-inset-top));transform:translateX(-50%);z-index:60;pointer-events:none;background:linear-gradient(180deg,#3a2c14,#241a0c);border:2px solid #ffd27a;border-radius:12px;padding:8px 16px;color:#fff3d6;text-align:center;max-width:min(70vw,420px);box-shadow:0 4px 18px rgba(0,0,0,.6);transition:opacity .35s;opacity:0;font-size:14px';document.body.appendChild(el);}
  el.innerHTML='<div style="font-weight:800;color:#ffd27a">'+esc(x[0])+'</div><div style="font-size:12px;opacity:.9">'+esc(x[1])+'</div>';el.style.display='block';requestAnimationFrame(()=>el.style.opacity='1');try{SFX.level();}catch(e){}
  setTimeout(()=>{el.style.opacity='0';setTimeout(()=>{el.style.display='none';apNext();},400);},3200);}
/* ---------- transmog ---------- */
function lookName(k){const [s,f,r]=k.split('|');const R=RAR[+r]||RAR[0];return s==='weapon'?(WTYPES[f].n+' · '+R.n):(f[0].toUpperCase()+f.slice(1)+' '+({head:'helm',armor:'body',hands:'gloves',legs:'legs',feet:'boots'})[s]+' · '+R.n);}
function lookFits(k,it){if(!it)return false;const [s,f]=k.split('|');if(s!==it.slot)return false;if(s!=='weapon')return true;const a=WTYPES[f],b=WTYPES[it.wt];return !!(a&&b&&!!a.melee===!!b.melee&&(f==='fist')===(it.wt==='fist'));}
function xmogEq(eq){const X=(P.coll&&P.coll.xm)||{};let out=null;for(const s in X){const it=eq[s],k=X[s];if(!it||!lookFits(k,it))continue;const [,f,r]=k.split('|');out=out||Object.assign({},eq);out[s]=Object.assign({},it,s==='weapon'?{wt:f,r:+r}:{fam:f,r:+r});}return out||eq;}
/* ---------- panel ---------- */
const AP={tab:'ach',cat:'lvl',sub:'boss',dun:null,slot:'armor',sel:null};
const bs44='min-height:44px;min-width:44px;margin:3px;padding:4px 10px';
function chip(act,key,val,label,on){return `<button class="sbtn" data-act="${act}" data-${key}="${esc(val)}" style="${bs44};${on?'background:#5a4424;color:#fff3d6;outline:2px solid #ffc85a':'background:#241c16;color:#f0e6d0'}">${label}</button>`;}
function bar(v,g){const f=Math.max(0,Math.min(1,v/g));return `<span style="display:inline-block;vertical-align:middle;width:90px;height:8px;background:#2a2218;border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${(f*100).toFixed(0)}%;background:#ffc85a"></i></span>`;}
function openAch(tab){if(tab)AP.tab=tab;colScan(true);if(AP.tab==='ach')achTick();const A=achi(),pts=achPts(),nGot=ACH.filter(a=>A.got[a.id]).length;
  let h=`<div class="craftbar"><span class="cbi">🏅</span><span class="cbn"><b>${pts} achievement points</b><small>${nGot}/${ACH.length} achievements · ${uniqN()}/${Object.keys(UNIQUES).length} uniques · ${Object.keys(colli().lk).length} looks</small></span></div>`;
  h+=`<div class="tabs" style="flex-wrap:wrap">${[['ach','🏅 Achievements'],['coll','📖 Collection'],['ward','👕 Wardrobe'],['pets','🐾 Companions'],['veh','🛵 Vehicles']].map(([k,n])=>`<button data-act="atab" data-t="${k}" class="${AP.tab===k?'on':''}" style="min-height:44px">${n}</button>`).join('')}</div>`;
  const t=AP.tab;
  if(t==='ach'){h+='<div style="display:flex;flex-wrap:wrap">'+ACH_CATS.map(([k,ic,n])=>{const L=ACH.filter(a=>a.c===k);return chip('acat','c',k,ic+' '+n+' <small>'+L.filter(a=>A.got[a.id]).length+'/'+L.length+'</small>',AP.cat===k);}).join('')+'</div>';
    h+=ACH.filter(a=>a.c===AP.cat).map(a=>{const got=A.got[a.id],v=achVal(a);return `<div class="mis" style="border-color:${got?'#6dff8a':'#5a4a3a'};${got?'':'opacity:.85'}"><b>${got?'✔':'◻'} ${esc(a.n)}</b> <small style="color:#ffd27a">${a.p?a.p+' pts':''}</small><div style="font-size:13px">${esc(a.d)}${got?' · earned '+new Date(got).toLocaleDateString():` · ${bar(v,a.g)} ${Math.min(v,a.g)}/${a.g}`}${a.rw?`<br><span style="color:#9fe6ff">Reward: ${esc(rwText(a.rw))}</span>`:''}</div></div>`;}).join('');}
  else if(t==='coll')h+=collHtml();
  else if(t==='ward')h+=wardHtml();
  else if(t==='pets'){const C=colli();h+=`<div style="font-size:13px;opacity:.85;margin:4px 0">Companions are cosmetic: they follow you around and never fight. Tap one you own to bring it along (tap again to send it home). Combat pets (Wrights' bots, Binders' wisps and golems) still come from their weaves.</div>`+
    Object.keys(COMPS).map(k=>{const c=COMPS[k],own=!!C.cmp[k],on=C.act===k;return `<button class="item${on?' sel':''}" data-act="acmp" data-k="${k}" style="min-height:44px;${own?'':'opacity:.55'}"><span class="ico">${own?c.ic:'❔'}</span><span><div class="nm">${esc(c.n)}${on?' · with you':''}</div><div class="sub">${own?'Owned':'Missing'} · ${esc(c.src)}</div></span></button>`;}).join('');}
  else if(t==='veh'){const own=P.vehicles||[];h+=`<div style="font-size:13px;opacity:.85;margin:4px 0">${own.length} of ${Object.keys(VEHICLES).length} vehicles. Summon one with 🛵 or R; tap an owned one here to ride it.</div>`+
    Object.keys(VEHICLES).map(k=>{const v=VEHICLES[k],got=own.includes(k);return `<button class="item" data-act="${got?'mount':'aveh'}" data-v="${k}" style="min-height:44px;${got?'':'opacity:.55'}"><span class="ico">${got?'🛵':'❔'}</span><span><div class="nm">${esc(v.name)}</div><div class="sub">${got?'Owned · tap to ride':'Missing'} · speed ×${v.speed} · ${esc(v.src||'')}</div></span></button>`;}).join('');}
  openPanel('🏅 ACHIEVEMENTS',h,'ach');}
function cell(got,ic,name,sub,c){return `<button class="sbtn" data-act="acell" data-n="${esc(name)}" data-s="${esc(sub)}" title="${esc(name)}" style="width:48px;height:48px;min-width:44px;margin:2px;padding:0;font-size:20px;${got?'background:#2a2016;border:2px solid '+c:'background:#16120e;border:2px dashed #4a4038;opacity:.6'}">${got?ic:'❔'}</button>`;}
function uIc(u){return u.kind==='disk'?'💿':u.kind==='imp'?'🔩':u.slot==='weapon'?(WTYPES[u.wt]?WTYPES[u.wt].ic:'⚔'):({head:'⛑',armor:'🦺',hands:'🧤',legs:'👖',feet:'🥾'})[u.slot]||'◆';}
function uCell(k){const u=UNIQUES[k];if(!u)return '';const r=u.rar||(u.relic?5:4);return cell(!!colli().u[k],uIc(u),u.name,(RAR[r]||RAR[4]).n+(u.d&&DUNGEONS[u.d]?' · '+DUNGEONS[u.d].name:''),RAR[r].c);}
function collHtml(){const C=colli();let h='<div style="display:flex;flex-wrap:wrap">'+[['boss','💀 Boss drops'],['sun','☀ Sunforged & Relics'],['dyna','💀 Dyna drops'],['rare','✦ Rare spawns'],['furn','🛋 Furniture'],['titles','🎖 Titles'],['schem','📐 Schematics'],['sym','🧩 Symbiants']].map(([k,n])=>chip('asub','s',k,n,AP.sub===k)).join('')+'</div>';
  h+=`<div id="acellInfo" style="font-size:13px;min-height:20px;margin:4px 0;color:#ffd27a">${AP.sel?esc(AP.sel):'Tap a square to see what it is. Coloured = collected (held, worn, banked or learned), ❔ = still missing.'}</div>`;const s=AP.sub;
  if(s==='boss'){const L=[...DUNL(),...Object.keys(RAIDS).filter(k=>RAIDS[k].loot&&Object.keys(RAIDS[k].loot).some(b=>RAIDS[k].loot[b]&&RAIDS[k].loot[b].items))];if(!AP.dun||!L.includes(AP.dun))AP.dun=L[0];
    h+='<div style="display:flex;flex-wrap:wrap">'+L.map(k=>{const D=DUNGEONS[k]||RAIDS[k];const ids=new Set();for(const b in D.loot){const t=D.loot[b];if(t&&t.items){t.items.forEach(x=>ids.add(x));if(t.relic)ids.add(t.relic);if(t.disk)ids.add(t.disk);}}const g=[...ids].filter(x=>C.u[x]).length;return chip('adun','k',k,esc(D.name)+' <small>'+g+'/'+ids.size+'</small>',AP.dun===k);}).join('')+'</div>';
    const D=DUNGEONS[AP.dun]||RAIDS[AP.dun];for(const b in D.loot){const t=D.loot[b];if(!t||!t.items)continue;const B=BOSSES[b];const nm=B&&ETYPES[B.etype]?ETYPES[B.etype].name:b;const ids=[...new Set([...t.items,...(t.relic?[t.relic]:[]),...(t.disk?[t.disk]:[])])];
      h+=`<div class="h4" style="margin-top:6px">${esc(nm)} <small>${ids.filter(x=>C.u[x]).length}/${ids.length}</small></div><div style="display:flex;flex-wrap:wrap">${ids.map(uCell).join('')}</div>`;}}
  else if(s==='sun'){for(const S of sunSets())h+=`<div class="h4">☀ ${esc(S.n)} set <small>${S.got}/${S.ids.length}</small></div><div style="display:flex;flex-wrap:wrap">${S.ids.map(uCell).join('')}</div>`;
    const sw=Object.keys(UNIQUES).filter(k=>UNIQUES[k].rar===9&&!SUN_SLOTS.includes(UNIQUES[k].slot)||UNIQUES[k].rar===9&&!UNIQUES[k].set);if(sw.length)h+=`<div class="h4">☀ Sunforged weapons & others <small>${sw.filter(k=>C.u[k]).length}/${sw.length}</small></div><div style="display:flex;flex-wrap:wrap">${sw.map(uCell).join('')}</div>`;
    const rl=Object.keys(UNIQUES).filter(k=>UNIQUES[k].relic);h+=`<div class="h4">Relics <small>${rl.filter(k=>C.u[k]).length}/${rl.length}</small></div><div style="display:flex;flex-wrap:wrap">${rl.map(uCell).join('')}</div>`;}
  else if(s==='dyna'){h+='<div style="display:flex;flex-wrap:wrap">'+Object.keys(DYNAS).map(k=>{const D=DYNAS[k];return D.uniq&&UNIQUES[D.uniq]?uCell(D.uniq):'';}).join('')+'</div>'+
    Object.keys(DYNAS).map(k=>`<div style="font-size:12px;opacity:.85">💀 ${esc(DYNAS[k].name)}: ${(P.dynaSeen||[]).includes(k)?'discovered':'not found yet'} · defeated ×${achi().ev.dk[k]|0}</div>`).join('');}
  else if(s==='rare'){const rk=achi().ev.rk;h+=`<div style="font-size:13px;opacity:.85">✦ Rare spawns appear now and then near each region's dyna and show as a purple ✦ on the minimap while they're up. ${Object.keys(rk).length}/${Object.keys(RARES).length} defeated.</div><div style="display:flex;flex-wrap:wrap">`+
    Object.keys(RARES).map(k=>cell(!!rk[k],'✦',RARES[k].n,'Lv '+rrLv(k)+' · near '+DYNAS[RARES[k].dy].name+(rk[k]?' · defeated ×'+rk[k]:''),'#d58bff')).join('')+'</div>';}
  else if(s==='furn'){const a=aptLoad();h+='<div style="display:flex;flex-wrap:wrap">'+Object.keys(FURN).map(k=>{const F=FURN[k];return cell((a.own[k]|0)>0,F.ic,F.n,F.buy?'Bought':F.craft?'Crafted':F.ach?'Achievement: '+F.ach:F.drop==='hard'?'Hard-mode drop':'Boss drop','#ffc85a');}).join('')+'</div>';}
  else if(s==='titles'){const all=[...new Set([...HM_TITLES.map(t=>t.n),'Sunbreaker',...ACH_TITLES,...(P.titles||[])])];
    h+=`<div style="font-size:13px;opacity:.85">Tap a title you've earned to show it by your name (tap again to hide).</div>`+all.map(n=>{const got=(P.titles||[]).includes(n);return `<button class="sbtn${got?'':' locked'}" data-act="atitle" data-n="${esc(n)}" style="${bs44}">${P.title===n?'✔ ':''}${got?'':'🔒 '}«${esc(n)}»</button>`;}).join('');}
  else if(s==='sym'&&typeof symCollHtml==='function')h+=symCollHtml(cell);
  else if(s==='schem'){const kn=(P.craft&&P.craft.known)||[];h+='<div style="display:flex;flex-wrap:wrap">'+QREC.map(r=>cell(kn.includes(r.id),r.ic||'📐',r.n,QTS[r.ts].n+' rank '+r.rk+' · '+(r.src==='start'?'starter':r.src==='vendor'?'sold at hubs':'boss drop'),'#9fe6ff')).join('')+'</div>';}
  return h;}
function wardHtml(){const C=colli(),eq=P.eq||{};let h=`<div style="font-size:13px;opacity:.85;margin:4px 0">Every piece of gear you hold, wear or bank unlocks its <b>look</b> (armour family + rarity colour, or weapon type). Pick a look to show over what you wear; stats never change. Weapons can only take a look of the same kind (melee or ranged). Social clothing is in the 🪞 mirror and Ossory Threads (${((P.clothing&&P.clothing.own)||[]).length}/${Object.keys(CLOTH).length} owned).</div>`;
  h+='<div style="display:flex;flex-wrap:wrap">'+VSLOTS.map(s=>chip('aslot','s',s,({weapon:'⚔ Weapon',head:'⛑ Head',armor:'🦺 Body',hands:'🧤 Hands',legs:'👖 Legs',feet:'🥾 Feet'})[s]+' <small>'+Object.keys(C.lk).filter(k=>k.split('|')[0]===s).length+'</small>',AP.slot===s)).join('')+'</div>';
  const s=AP.slot,it=eq[s],cur=C.xm[s];h+=`<div class="h4">${it?'Wearing: '+esc(it.name):'Nothing equipped here'}${cur?' · showing '+esc(lookName(cur)):''}</div>`;
  if(cur)h+=`<button class="sbtn" data-act="axm" data-s="${s}" data-k="" style="${bs44}">✖ Show my real gear</button>`;
  const L=Object.keys(C.lk).filter(k=>k.split('|')[0]===s).sort((a,b)=>(+a.split('|')[2])-(+b.split('|')[2]));
  h+=L.length?'<div style="display:flex;flex-wrap:wrap">'+L.map(k=>{const r=+k.split('|')[2],ok=lookFits(k,it);return `<button class="sbtn" data-act="axm" data-s="${s}" data-k="${esc(k)}" style="${bs44};border:2px solid ${RAR[r].c};${cur===k?'background:#5a4424;color:#fff3d6;':'background:#241c16;color:#f0e6d0;'}${ok?'':'opacity:.45'}">${cur===k?'✔ ':''}${esc(lookName(k))}</button>`;}).join('')+'</div>':'<div style="opacity:.75">No looks for this slot yet.</div>';return h;}
function achAct(a,b){const D=b.dataset;
  if(a==='atab'){AP.sel=null;openAch(D.t);return true;}if(a==='acat'){AP.cat=D.c;achi().cat=D.c;openAch('ach');return true;}
  if(a==='asub'){AP.sub=D.s;AP.sel=null;openAch('coll');return true;}if(a==='adun'){AP.dun=D.k;AP.sel=null;openAch('coll');return true;}
  if(a==='acell'){AP.sel=D.n+' · '+D.s;const el=document.getElementById('acellInfo');if(el)el.textContent=AP.sel;return true;}
  if(a==='atitle'){const n=D.n;if(!(P.titles||[]).includes(n)){warn('Not earned yet');return true;}P.title=P.title===n?null:n;save();openAch('coll');return true;}
  if(a==='aslot'){AP.slot=D.s;openAch('ward');return true;}
  if(a==='axm'){const C=colli(),s=D.s,k=D.k;if(!k){delete C.xm[s];}else{if(!C.lk[k])return true;if(!lookFits(k,(P.eq||{})[s])){warn((P.eq||{})[s]?'That look doesn\'t fit what you have equipped':'Equip something in this slot first');return true;}C.xm[s]=k;}refreshGearVisual();save();openAch('ward');return true;}
  if(a==='acmp'){const C=colli(),k=D.k;if(!C.cmp[k]){warn(COMPS[k]?COMPS[k].src:'Not owned');return true;}cmpSet(C.act===k?null:k);save();openAch('pets');return true;}
  if(a==='aveh'){const v=VEHICLES[D.v];warn(v?(v.src||'Not owned'):'Not owned');return true;}
  return false;}
function achExports(){return {ACH,ACHI,ACH_CATS,COMPS,RARES,RR,normAch,normColl,achFields,achi,colli,achTick,achVal,achPts,achGrant,achClear,achDyna,achPop,openAch,achAct,colScan,lookKey,lookName,lookFits,xmogEq,cmpSet,get CMP(){return CMP;},rrSpot,rrSpawn,rrTick,rrMini,regionsCharted,nCharted,sunSets,uniqN};}
