/* ================= STAGE 1: Glintrunner veil, world systems =================
   Outposts, Conduit fast travel, teleporter pads, Save Points (XP reclaim), day/night + sandstorms, night spawns, Mythic Shimmerveil drops.
   Stage 2/3 data stubs live at the bottom (FUTURE) and are saved on every character sheet already. */

/* ---------- Mythic Shimmerveil drops ---------- */
const VEIL_RATE={world:0.003,nightMul:2,dungeonFinal:0.02};// world kills Lv5+ (Shimmerveil) / Lv9+ (Shimmerveil II)
function mythicDisk(wid){const d=genDisk(wid);d.mythic=true;d.r=6;return d;}
function rollVeil(e,rng){rng=rng||Math.random;if(!e||e.lv<5)return null;const p=VEIL_RATE.world*(e.night?VEIL_RATE.nightMul:1);if(rng()>=p)return null;return mythicDisk(e.lv>=9?'veil2':'veil1');}

/* ---------- Shimmerveil visual: glowing blue lattice over the body ---------- */
const veilMat=new THREE.MeshBasicMaterial({color:0x3fb4ff,transparent:true,opacity:0.5,depthWrite:false});
const veilWire=new THREE.MeshBasicMaterial({color:0x6fdcff,wireframe:true,transparent:true,opacity:0.7,depthWrite:false,blending:THREE.AdditiveBlending});
function veilActive(){const b=P.buffs.find(b=>b.id==='veil1'||b.id==='veil2');return b?b.id:null;}
function updVeil(){if(!PM)return;const v=state==='play'?veilActive():null;
  if(v&&(!PM.veil||PM.veilId!==v)){clearVeil();const ms=[];PM.g.traverse(o=>{if(o.isMesh&&!o.userData.veil)ms.push(o);});PM.veil=[];PM.veilId=v;const k=v==='veil2'?1.22:1.16;
    for(const o of ms){const a=new THREE.Mesh(o.geometry,veilMat);a.scale.setScalar(k);a.userData.veil=1;o.add(a);const w=new THREE.Mesh(o.geometry,veilWire);w.scale.setScalar(k+0.03);w.userData.veil=1;o.add(w);PM.veil.push(a,w);}
    PM.veilRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0x59c8ff,transparent:true,opacity:0.6,depthWrite:false,side:THREE.DoubleSide}));PM.veilRing.scale.set(1.1,1,1.1);PM.veilRing.position.y=0.08;PM.g.add(PM.veilRing);PM.veil.push(PM.veilRing);}
  else if(!v&&PM.veil)clearVeil();
  if(PM.veil){const f=PM.veilId==='veil2'?1.35:1;veilMat.opacity=Math.min(0.75,(0.46+Math.sin(T*4)*0.1)*f);veilWire.opacity=(0.5+Math.sin(T*6+1)*0.2)*f;veilMat.color.setHex(PM.veilId==='veil2'?0x7fd8ff:0x59c8ff);PM.veilRing.rotation.y+=0.03;}}
function clearVeil(){if(PM&&PM.veil){PM.veil.forEach(m=>m.parent&&m.parent.remove(m));PM.veil=null;PM.veilId=null;}}

/* ---------- outposts, Save Points, Conduit nodes, teleporter pads ---------- */
const SAVEPTS={town:{id:'town',name:"Halden's Rest",x:-12,z:-8,sx:0,sz:10}};
OUTPOSTS.forEach(o=>{SAVEPTS[o.id]={id:o.id,name:o.name,x:o.x-4,z:o.z-4,sx:o.x,sz:o.z+3};});
const CONDUIT=[{id:'town',name:"Halden's Rest",x:13,z:4}];
OUTPOSTS.forEach(o=>CONDUIT.push({id:o.id,name:o.name,x:o.x+4,z:o.z-4}));
for(const k in DUNGEONS){const d=DUNGEONS[k].door;const l=Math.hypot(d.x,d.z);CONDUIT.push({id:'door_'+k,name:DUNGEONS[k].name+' gate',x:d.x-d.x/l*11,z:d.z-d.z/l*11});}
const PADS=[{id:'pad_c',at:'cinderwell',to:'pad_g'},{id:'pad_g',at:'glassreach',to:'pad_c'}];
PADS.forEach(p=>{const o=OUTPOSTS.find(q=>q.id===p.at);p.x=o.x-5;p.z=o.z+5;p.name=o.name;});
const nodeFx=[];
function buildNode(n){const y=heightAt(n.x,n.z);const g=new THREE.Group();g.position.set(n.x,y,n.z);part(g,geoBox,M(0x2b3742),0,0.3,0,2.4,0.6,2.4);part(g,geoBox,M(0x4f6b80),0,1.6,0,0.7,3.2,0.7);
  const c=part(g,new THREE.OctahedronGeometry(1,0),MB(0x5ff2ff),0,3.9,0,0.55,0.9,0.55);const r=part(g,new THREE.TorusGeometry(1.1,0.07,4,24),MB(0x5ff2ff),0,3.9,0,1,1,1);r.rotation.x=Math.PI/2;nodeFx.push(c,r);scene.add(g);
  boxes.push({x0:n.x-0.4,x1:n.x+0.4,z0:n.z-0.4,z1:n.z+0.4,y0:y,y1:y+3.2});}
function buildSave(s){const y=heightAt(s.x,s.z);const g=new THREE.Group();g.position.set(s.x,y,s.z);part(g,geoBox,M(0x2b3742),0,1.1,0,1.4,2.2,0.8);part(g,geoBox,MB(0x6dff8a),0,1.5,0.41,1.0,0.7,0.03);part(g,geoBox,M(0x2f8a5a),0,2.3,0,1.6,0.25,1.0);scene.add(g);
  boxes.push({x0:s.x-0.7,x1:s.x+0.7,z0:s.z-0.4,z1:s.z+0.4,y0:y,y1:y+2.4});}
function buildPad(p){const y=heightAt(p.x,p.z);const m=new THREE.Mesh(new THREE.CircleGeometry(1.4,24),new THREE.MeshBasicMaterial({color:0xb46bff,transparent:true,opacity:0.45,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(p.x,y+0.12,p.z);scene.add(m);
  part(scene,new THREE.TorusGeometry(1.5,0.09,4,24),MB(0xd8a0ff),p.x,y+0.15,p.z,1,1,1).rotation.x=Math.PI/2;p.m=m;}
function buildOutpost(o){const y=heightAt(o.x,o.z);for(let i=circles.length-1;i>=0;i--)if(Math.hypot(circles[i].x-o.x,circles[i].z-o.z)<o.r+4)circles.splice(i,1);
  const pl=o.pal||[0xb59a7e,0x9c8f80,0xc9b49a,0xb5522c];const g=new THREE.Group();g.position.set(o.x,y,o.z);part(g,geoBox,M(pl[0]),0,0.05,0,o.r*2,0.2,o.r*2);
  // low wall ring with 2 gaps, canopy, lamps
  for(let a=0;a<16;a++){if(a%8===0)continue;const t=a/16*6.283;const x=Math.cos(t)*o.r,z=Math.sin(t)*o.r;const w=part(g,geoBox,M(pl[1]),x,0.7,z,4.2,1.4,0.6);w.rotation.y=-t+Math.PI/2;}
  part(g,geoBox,M(pl[2]),3,1.4,4,4,2.8,3);part(g,geoBox,M(pl[3]),3,2.95,4,4.6,0.3,3.6);part(g,geoBox,M(0x444444),-3,1.8,-6,0.2,3.6,0.2);part(g,geoSphere,MB(0xffd9a0),-3,3.6,-6,0.3,0.3,0.3);
  scene.add(g);boxes.push({x0:o.x+1,x1:o.x+5,z0:o.z+2.5,z1:o.z+5.5,y0:y,y1:y+2.8});}
OUTPOSTS.forEach(buildOutpost);CONDUIT.forEach(buildNode);Object.values(SAVEPTS).forEach(buildSave);PADS.forEach(buildPad);
// keep world enemies out of the outposts
for(const e of enemies)for(const o of OUTPOSTS)if(Math.hypot(e.home.x-o.x,e.home.z-o.z)<o.r+14){const a=Math.atan2(e.home.z-o.z,e.home.x-o.x);e.home.x=o.x+Math.cos(a)*(o.r+16);e.home.z=o.z+Math.sin(a)*(o.r+16);e.pos.set(e.home.x,heightAt(e.home.x,e.home.z),e.home.z);}

function worldInteract(p){
  for(const n of CONDUIT)if(Math.hypot(p.x-n.x,p.z-n.z)<3.2)return {k:'conduit',id:n.id,label:'🔷 Conduit'};
  for(const k in SAVEPTS){const s=SAVEPTS[k];if(Math.hypot(p.x-s.x,p.z-s.z)<3)return {k:'savept',id:k,label:'💾 Save Point'};}
  return null;}
function totXp(){let t=P.xp;for(let l=1;l<P.level;l++)t+=xpNeed(l);return t;}
function savePt(){return P.savePoint&&SAVEPTS[P.savePoint.id]?P.savePoint:(P.savePoint={id:'town',tot:totXp(),t:Date.now()});}
function savePointName(){return SAVEPTS[savePt().id].name;}
function savePointPos(){const s=SAVEPTS[savePt().id];return {x:s.sx,z:s.sz};}
function unsavedXp(){return Math.max(0,totXp()-savePt().tot);}
function recordSavePoint(id){P.savePoint={id,tot:totXp(),t:Date.now()};SFX.quest();banner('SAVE POINT RECORDED',SAVEPTS[id].name+' · your XP is safe. Death brings you back here');ringFx(SAVEPTS[id].x,SAVEPTS[id].z,0x6dff8a,3,0.8);save();}
// XP reclaim rule: dying loses 40% of the XP earned since your last Save Point, never dropping below the start of your current level.
const XP_LOSS=0.4;
function applyXpLoss(){const sp=savePt();const unsaved=unsavedXp();const lost=Math.min(P.xp,Math.round(unsaved*XP_LOSS));P.xp-=lost;if(totXp()<sp.tot)sp.tot=totXp();return {unsaved,lost};}

/* ---------- Conduit fast travel ---------- */
const knownNodes=()=>P.nodes||(P.nodes=['town']);
function nodeById(id){return CONDUIT.find(n=>n.id===id);}
function openConduit(fromId){const kn=knownNodes();const W=420,sc=W/540;const tx=x=>(x+270)*sc,tz=z=>(z+270)*sc;const from=nodeById(fromId)||CONDUIT[0];
  let svg=`<svg viewBox="0 0 ${W} ${W}" class="cmap"><rect x="0" y="0" width="${W}" height="${W}" rx="14" fill="rgba(12,24,34,.85)"/>`;
  for(let i=0;i<=6;i++){svg+=`<line x1="${i*W/6}" y1="0" x2="${i*W/6}" y2="${W}" stroke="rgba(95,242,255,.08)"/><line x1="0" y1="${i*W/6}" x2="${W}" y2="${i*W/6}" stroke="rgba(95,242,255,.08)"/>`;}
  svg+=`<rect x="${tx(-31)}" y="${tz(-31)}" width="${62*sc}" height="${62*sc}" fill="none" stroke="rgba(230,215,190,.6)"/>`;
  for(const n of CONDUIT)if(n!==from&&kn.includes(n.id))svg+=`<line x1="${tx(from.x)}" y1="${tz(from.z)}" x2="${tx(n.x)}" y2="${tz(n.z)}" stroke="#5ff2ff" stroke-width="2" stroke-dasharray="6 4" opacity=".7"/>`;
  for(const p of PADS){const q=PADS.find(x=>x.id===p.to);svg+=`<line x1="${tx(p.x)}" y1="${tz(p.z)}" x2="${tx(q.x)}" y2="${tz(q.z)}" stroke="#d8a0ff" stroke-width="1.5" opacity=".5"/>`;}
  for(const n of CONDUIT){const k=kn.includes(n.id)&&nodeOpen(n);svg+=`<circle cx="${tx(n.x)}" cy="${tz(n.z)}" r="${n===from?9:7}" fill="${n===from?'#ffc85a':k?'#5ff2ff':'#555'}" stroke="#000" stroke-width="2"/><text x="${tx(n.x)}" y="${tz(n.z)-12}" fill="${k?'#e8f8ff':'#888'}" font-size="11" text-anchor="middle">${esc(k?n.name:'???')}</text>`;}
  svg+=campSvg(tx,tz)+bankSvg(tx,tz)+'</svg>';
  const list=CONDUIT.map(n=>{const lk=!nodeOpen(n);const k=kn.includes(n.id)&&!lk;const here=n===from;if(lk&&n.id!=='town'){const g=GATES[n.gate],s=STEP[g.step];return `<button class="item" data-act="slockc" data-g="${n.gate}" style="opacity:.7"><span class="ico">🔒</span><span style="flex:1"><div class="nm">${esc(n.name)}</div><div class="st"><span class="down">Story step ${s.i+1} "${esc(s.n)}" (Lv ${s.lvl})</span></div></span></button>`;}return `<button class="item${here?' sel':''}" ${k&&!here?`data-act="travel" data-id="${n.id}"`:'disabled'} style="${k?'':'opacity:.5'}"><span class="ico">${here?'📍':k?'🔷':'❔'}</span><span style="flex:1"><div class="nm">${k?esc(n.name):'Undiscovered node'}</div><div class="st">${k&&n.id.startsWith('door_')&&DUNGEONS[n.id.slice(5)]?(()=>{const ck=dunEntryCheck(n.id.slice(5));return `<span class="${ck.why==='cap'?'down':'up'}">${dunRange(n.id.slice(5))}${ck.why==='cap'?' · '+esc(ck.msg):''}</span><br>`;})():''}${here?'You are here':k?Math.round(Math.hypot(n.x-from.x,n.z-from.z))+'m · instant transit':'Walk near it to link it to the network'}</div></span></button>`;}).join('');
  openPanel('🔷 CONDUIT NETWORK',`<div class="cols"><div>${svg}<div style="font-size:12px;opacity:.75;margin-top:6px">Cyan: Conduit links between discovered nodes. Purple: teleporter pads between the outposts. Orange triangles: wild pack camps. Gold squares: Bank terminals.</div></div><div><div class="h4">Destinations</div>${list}</div></div>`,'conduit');}
let transitT=0;
function conduitTravel(id){const n=nodeById(id);if(!n||!knownNodes().includes(id))return false;if(fzNodeBlocked(id))return false;if(!nodeOpen(n)){lockedMsg(n.gate,true);return false;}if(DUN||P.dead)return false;if(T-P.lastCombat<5){warn('Can\'t enter the Conduit while in combat');return false;}
  P.target=null;P.autoAtk=false;resetInput();const el=$('#transit');el.querySelector('b').textContent='CONDUIT TRANSIT → '+n.name.toUpperCase();el.classList.add('on');tone(300,0.9,'sine',0.05,900);P.transit=id;
  setTimeout(()=>{P.pos.set(n.x+2.5,0,n.z+2.5);P.pos.y=heightAt(P.pos.x,P.pos.z);P.rotY=Math.atan2(-n.x,-n.z)||0;camS.yaw=P.rotY+Math.PI;camS.cur=null;},700);
  setTimeout(()=>{el.classList.remove('on');P.transit=null;ringFx(P.pos.x,P.pos.z,0x5ff2ff,4,0.9);SFX.heal();banner('CONDUIT',n.name);save();},1500);return true;}
let padCd=0;
function updPads(){if(DUN||P.dead||T<padCd)return;for(const p of PADS)if(Math.hypot(P.pos.x-p.x,P.pos.z-p.z)<1.3){const q=PADS.find(x=>x.id===p.to);padCd=T+2.5;if(!gateOpen(q.at)||!gateOpen(p.at)){lockedMsg(gateOpen(q.at)?p.at:q.at,true);break;}
  const el=$('#transit');el.querySelector('b').textContent='TELEPORT → '+q.name.toUpperCase();el.classList.add('on','quick');setTimeout(()=>el.classList.remove('on','quick'),600);
  P.pos.set(q.x+3,0,q.z);P.pos.y=heightAt(P.pos.x,P.pos.z);camS.cur=null;ringFx(q.x,q.z,0xd8a0ff,3,0.8);tone(600,0.4,'sine',0.05,600);toast('Teleported to '+q.name);break;}}
let discAcc=0;
function updDiscover(dt){discAcc+=dt;if(discAcc<0.5||DUN)return;discAcc=0;const kn=knownNodes();for(const n of CONDUIT)if(!kn.includes(n.id)&&nodeOpen(n)&&Math.hypot(P.pos.x-n.x,P.pos.z-n.z)<24){kn.push(n.id);toast('🔷 Conduit node linked: '+n.name);SFX.quest();save();}}

/* ---------- day / night + sandstorm ---------- */
const DAY_LEN=1200;// seconds for a full day
let dayT=(()=>{try{const v=parseFloat(localStorage.getItem('dustreach_clock'));return isNaN(v)?0.36:v;}catch(e){return 0.36;}})();
const WX={storm:0,target:0,until:0,next:120};
const colFog=new THREE.Color(),cDay=new THREE.Color(FOG),cDusk=new THREE.Color(0xd88a5a),cNight=new THREE.Color(0x141a2c),cStorm=new THREE.Color(0xb07c48);
const skyCol=new THREE.Color();
// stars
const stars=(()=>{const g=new THREE.BufferGeometry();const p=[];for(let i=0;i<400;i++){const a=Math.random()*6.283,e=Math.random()*1.3+0.12;p.push(Math.cos(a)*Math.cos(e)*450,Math.sin(e)*450,Math.sin(a)*Math.cos(e)*450);}g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  const m=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));window.__sky.add(m);return m;})();
function dayInfo(){const sunH=Math.sin((dayT-0.25)*6.283);const day=smooth(-0.18,0.3,sunH);const dusk=Math.max(0,1-Math.abs(sunH)/0.3)*(1-0.3*day);return {sunH,day,dusk,night:day<0.18};}
function setDayTime(f){dayT=((f%1)+1)%1;applySky(0);}
function applySky(dt){const I=dayInfo();
  sun.intensity=0.12+0.8*I.day;sun.color.setHex(0xfff0d8).lerp(cDusk,I.dusk*0.6).lerp(new THREE.Color(0x8aa0ff),1-I.day);
  const ang=(dayT-0.25)*6.283;sun.position.set(Math.cos(ang)*120,Math.max(20,Math.sin(ang)*140),40);
  hemi.intensity=0.28+0.45*I.day;hemi.color.setHex(0xffe2c0).lerp(new THREE.Color(0x5a6a9a),1-I.day);
  colFog.copy(cNight).lerp(cDusk,Math.min(1,I.dusk+I.day*0.3)).lerp(cDay,I.day);colFog.lerp(cStorm.clone().multiplyScalar(0.35+0.65*I.day),WX.storm*0.85);
  biomeSky(I);
  if(!DUN){scene.fog.color.copy(colFog);scene.background.copy(colFog);scene.fog.near=70-62*WX.storm;scene.fog.far=240-185*WX.storm;}
  skyCol.setRGB(0.16,0.18,0.32).lerp(new THREE.Color(1,1,1),I.day).lerp(new THREE.Color(1,0.75,0.55),I.dusk*0.4);window.__sky.material.color.copy(skyCol);
  stars.material.opacity=Math.max(0,1-I.day*1.6)*(1-WX.storm);$('#haze').style.opacity=DUN?0:(WX.storm*0.55).toFixed(3);}
let skyAcc=0,clockAcc=0,wasNight=null;
function updWorld(dt){dayT=(dayT+dt/DAY_LEN)%1;
  // weather: random sandstorms
  if(T>WX.next&&!WX.target){if(Math.random()<0.35){WX.target=1;WX.until=T+rand(70,130);if(state==='play'&&!DUN)toast('🌪 A sandstorm is rolling in…');}WX.next=T+rand(150,300);}
  if(WX.target&&T>WX.until)WX.target=0;WX.storm+=(WX.target-WX.storm)*Math.min(1,dt*0.25);if(WX.storm<0.002)WX.storm=0;
  skyAcc+=dt;if(skyAcc>0.1){skyAcc=0;applySky(dt);}
  const I=dayInfo();if(state==='play'&&!DUN){if(wasNight!==null&&I.night!==wasNight){if(I.night){banner('NIGHTFALL','Gloam Stalkers hunt the Reach: stronger, with better loot');}else{toast('☀️ Dawn breaks over the Reach');}}
    if(I.night)spawnNight();else despawnNight();}
  wasNight=I.night;
  clockAcc+=dt;if(clockAcc>0.5){clockAcc=0;const h=Math.floor(dayT*24),m=Math.floor((dayT*24-h)*60);$('#clock').innerHTML=(I.night?'🌙':I.dusk>0.4?'🌇':'☀️')+' '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+(WX.storm>0.2?' · 🌪 Sandstorm':'');lsSet('dustreach_clock',dayT.toFixed(4));}}

/* ---------- night-only enemies ---------- */
function buildGloam_v1(){const R=buildHumanoid(0x1a1424,0x0c0a14,0xb46bff,0x110d18);part(R.g,geoCone,MB(0xb46bff),0.3,2.15,-0.05,0.08,0.4,0.08).rotation.z=-0.3;part(R.g,geoCone,MB(0xb46bff),-0.3,2.15,-0.05,0.08,0.4,0.08).rotation.z=0.3;R.gun.scale.set(0.05,0.14,0.9);R.gun.material=MB(0xb46bff);return R;}
ETYPES.gloam={name:'Gloam Stalker',hp:62,dmg:9,atkCd:1.4,range:2.4,speed:6.2,aggro:17,xp:1.7,ranged:false,hitR:0.8,h:1.9,build:buildGloam,scale:1.05};
const NIGHT_N=10;let nightDone=false;
function spawnNight(){if(nightDone)return;nightDone=true;let n=0,tries=0;while(n<NIGHT_N&&tries<200){tries++;const a=rand(0,6.283),r=rand(55,205);const x=Math.cos(a)*r,z=Math.sin(a)*r;if(inTown({x,z})||OUTPOSTS.some(o=>Math.hypot(o.x-x,o.z-z)<30))continue;
  const lv=clamp(2+Math.floor((r-50)/17),2,10);const e=makeEnemy('gloam',x,z,lv,true);e.night=true;n++;}}
function despawnNight(){nightDone=false;for(const e of enemies.slice())if(e.night&&e.state!=='chase')removeEnemy(e);}

/* ---------- frame hook ---------- */
function updStage1(dt){updWorld(dt);updVeil();for(let i=0;i<nodeFx.length;i++)nodeFx[i].rotation.y+=dt*(i%2?1.5:0.8);
  if(state==='play'){updPads();updDiscover(dt);const el=$('#unsaved');if(el){const u=unsavedXp();el.innerHTML=u>0?`⚠ Unsaved XP: <b>${u}</b> · lose ${Math.min(P.xp,Math.round(u*XP_LOSS))} on death`:'💾 XP saved at '+esc(savePointName());el.className=u>0?'warn':'';}}}
const _pb=document.querySelector('#pbody');_pb.addEventListener('change',e=>{if(e.target&&e.target.id==='mdiff'){mprefs().diff=clamp(+e.target.value,0,4);missionOffers=[];save();openTerminal();}});

/* ---------- FUTURE (stage 2 / 3): data only, nothing uses it yet. Saved on every sheet (see normalizeChar). ----------
   Stage 2: breeds with stat caps, factions + reputation, faction gear and capturable towers, a hover vehicle, a pet class.
   Stage 3: tradeskills + implant clusters, social clothing, a personal apartment with storage. */
const FUTURE={
  breeds:{settler:{name:'Settler',desc:'Balanced',capMul:{str:1,agi:1,sta:1,int:1,psy:1,sen:1}},dunebred:{name:'Dunebred',desc:'Big and tough',capMul:{str:1.2,sta:1.2,int:0.85,psy:0.85}},
    vyrekin:{name:'Vyrekin',desc:'Weave-touched minds',capMul:{int:1.2,psy:1.2,str:0.8,sta:0.85}},glassborn:{name:'Glassborn',desc:'Quick and sharp',capMul:{agi:1.2,sen:1.15,sta:0.9}}},
  factions:{combine:{name:'Solace Combine'},clans:{name:'Ashborn Free Clans'},drifters:{name:'Unaligned Drifters'}},
  towers:[],// {id,x,z,owner,level}
  vehicles:{skiff:{name:'Dust Skiff',speed:2.2,desc:'Hover skiff'}},
  petClass:{id:'wright',name:'Dronewright'},
  tradeskills:{clusters:{desc:'Built in stage 3: Keystone/Lattice/Filament clusters'},recipes:[]},
  clothing:{slots:['hat','coat','boots'],social:true},
  apartment:{storageSlots:40}
};
function futureFields(s){return {tier:tierOfLv(s.level||1),perkMeta:normPerkMeta(s.perkMeta),fz:normFz(s.fz),lootF:normLootF(s.lootF),lootHint:!!s.lootHint,vsel:s.vsel||null,breed:BREEDS[s.breed]?s.breed:'settler',faction:s.faction||{side:null,rep:{}},vehicles:s.vehicles||[],pets:s.pets||[],tradeskills:s.tradeskills||{},clothing:normCloth(s.clothing),bag:normBag(s.bag),tsBonus:!!s.tsBonus||s.sp==null,apartment:s.apartment||{storage:[]},runSp:!!s.runSp,story:normStory(s),explored:typeof s.explored==='string'?s.explored:'',uwp:normWp(s.uwp),raidLock:normRaidLock(s.raidLock),sigils:Math.max(0,s.sigils|0),raidClears:s.raidClears&&typeof s.raidClears==='object'?s.raidClears:{},raidTeam:Array.isArray(s.raidTeam)?s.raidTeam.filter(x=>typeof x==='string').slice(0,5):null,team:normTeam(s.team),tg:normTG(s.tg,s.level||1),ppBonus:Math.max(0,s.ppBonus|0),quests:normQuests(s.quests,s.mission),qdone:s.qdone&&typeof s.qdone==='object'?s.qdone:{},qfocus:typeof s.qfocus==='string'?s.qfocus:null,qAutoWp:!!s.qAutoWp,dynaSeen:Array.isArray(s.dynaSeen)?s.dynaSeen.filter(x=>typeof x==='string'):[],...sunFields(s),...xpFields(s),...craftFields(s),...rmFields(s),...hmFields(s),...homeFields(s),...achFields(s),...vgFields(s),...wvFields(s),...symFields(s),...invFields(s),...rschFields(s)};}
