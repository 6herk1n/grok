/* ================= DYNA CAMPS: named elite bosses at fixed spots =================
   Each region has 1–2 dynas. A dyna is up or down; after a kill it is down for a random 10–20 minutes of real time
   (timestamps in localStorage 'dustreach_dyna_v1', world state shared by your characters, so it survives reloads).
   When it comes back there is a 30% chance a lesser placeholder spawns in its spot instead; killing the placeholder
   brings the next roll in 1–3 minutes. Dynas have adds, high health, a signature mechanic, a guaranteed good drop and a
   rare named item (dyna-only). Discovered dynas show on the map/minimap as up (red skull) or down (grey). Only the
   character you play gets the loot (team mode rules). Hunt missions can target them. */
const DYNA_KEY='dustreach_dyna_v1';var DYCLK={off:0};const dyNow=()=>Date.now()+DYCLK.off;var WTELE=[];
const DYNAS={
  ketch:{name:'Sister Ketch',sub:'raider chief',t:'raider',lv:4,at:[92,150],col:0x7a2a5a,glow:0xff5aa0,hp:7,adds:{t:'raider',n:2},mech:{k:'summon',name:'Call the Crew',at:[0.6,0.3],t:'raider',n:2},ph:"Ketch's Lookout",uniq:'ketch_rifle'},
  gravelmaw:{name:'Gravelmaw',sub:'ancient mauler',t:'mauler',lv:6,at:[-150,-50],col:0x6a5a40,glow:0xffb347,hp:7,adds:{t:'skitter',n:3},mech:{k:'slam',name:'Burrow Slam',every:9,r:7,delay:1.7,mult:2.4},ph:'Gravelmaw Whelp',uniq:'gravel_tusk'},
  bogtooth:{name:'Old Bogtooth',sub:'mire mauler',t:'mauler',lv:6,biome:'oasis',col:0x3a6a2a,glow:0xc8f060,hp:7,adds:{t:'spitter',n:2},mech:{k:'pools',name:'Mire Spit',every:10,r:3.5,delay:1.8,mult:1.8,count:2},ph:'Bogtooth Spawn',uniq:'bog_vest'},
  paledrifter:{name:'The Pale Drifter',sub:'salt wraith',t:'spitter',lv:7,biome:'salt',col:0xf0ece0,glow:0x9fe6ff,hp:8,scale:2,adds:{t:'skitter',n:2},mech:{k:'shield',name:'Salt Veil',at:[0.6],t:'skitter',n:3},ph:'Pale Wisp',uniq:'drifter_veil'},
  redcrest:{name:'Redcrest Matron',sub:'canyon brood-mother',t:'skitter',lv:8,biome:'canyon',col:0xc03a20,glow:0xffb347,hp:9,scale:2.4,adds:{t:'skitter',n:3},mech:{k:'summon',name:'Brood Call',at:[0.7,0.4],t:'skitter',n:3,enrage:0.25},ph:'Redcrest Drone',uniq:'redcrest_carapace'},
  rustjaw:{name:'Rustjaw Prime',sub:'scrap-built mauler',t:'mauler',lv:9,biome:'scrap',col:0x5c5e62,glow:0xffa040,hp:8,adds:{t:'raider',n:2},mech:{k:'slam',name:'Scrap Quake',every:8,r:8,delay:1.6,mult:2.5},ph:'Rustjaw Mk I',uniq:'rustjaw_arm'},
  prismhide:{name:'Prismhide',sub:'crystal mauler',t:'mauler',lv:10,biome:'glass',col:0x9fd8e8,glow:0x7ff6ff,hp:9,adds:{t:'spitter',n:3},mech:{k:'pools',name:'Prism Burst',every:9,r:4,delay:1.7,mult:2.0,count:3},ph:'Prism Shardling',uniq:'prism_mantle'},
  cindermane:{name:'Cindermane',sub:'badlands tyrant',t:'mauler',lv:10,biome:'ash',col:0x5a2a1a,glow:0xff5a1a,hp:10,scale:1.7,adds:{t:'mauler',n:2},mech:{k:'slam',name:'Cinder Roar',every:8,r:8,delay:1.6,mult:2.6,enrage:0.3},ph:'Cinder Cub',uniq:'cinder_fang'},
  // Duskcrown Highlands (Lv 11-20)
  hollowking:{name:'The Duskhorn King',sub:'crag brute patriarch',t:'brute',lv:15,at:gloamAt(70,505),col:0x3a3050,glow:0x9f7bff,hp:10,scale:1.5,adds:{t:'stalker',n:3},mech:{k:'slam',name:'Crown Quake',every:8,r:8,delay:1.6,mult:2.6,enrage:0.3},ph:'Duskhorn Calf',uniq:'kings_breaker'},
  seraph:{name:'The Dusk Seraph',sub:'herald of the Choir',t:'shardcaller',lv:19,at:gloamAt(310,515),col:0xe8e0ff,glow:0xb46bff,hp:11,scale:2.2,adds:{t:'tender',n:2},mech:{k:'shield',name:'Choir Veil',at:[0.65,0.3],t:'tender',n:3},ph:'Seraph Fledgling',uniq:'seraph_halo'},
  // Rimefall Expanse (Lv 21-30, Build C)
  rimeback:{name:'The Rimeback Colossus',sub:'glacier titan',t:'shambler',lv:24,at:rimeAt(30,760),col:0xc8dcec,glow:0x9fe8ff,hp:11,scale:1.7,adds:{t:'burrower',n:3},mech:{k:'slam',name:'Avalanche Stomp',every:8,r:8.5,delay:1.6,mult:2.7,enrage:0.3},ph:'Rimeback Calf',uniq:'rimeback_maul'},
  palequeen:{name:'The Pale Matriarch',sub:'warden of the far drifts',t:'frostcaller',lv:29,at:rimeAt(170,740),col:0xf4f8fc,glow:0x6fe8ff,hp:12,scale:2.2,adds:{t:'sentinel',n:2},mech:{k:'shield',name:'Hoarfrost Veil',at:[0.65,0.3],t:'sentinel',n:3},ph:'Pale Fledgling',uniq:'pale_crown'}};
// spots: core dynas are fixed, region dynas sit inside their biome away from camps
{const BI={};BIOMES.forEach((b,i)=>BI[b.id]=i);const deg={oasis:170,salt:315,canyon:250,scrap:128,glass:-6,ash:68};
  for(const k in DYNAS){const D=DYNAS[k];D.id=k;let p=D.at;if(D.biome){const a=deg[D.biome]*Math.PI/180;p=[Math.cos(a)*330,Math.sin(a)*330];}const s=freeSpot(p[0],p[1],2);D.x=s[0];D.z=s[1];
    const bi=biomeIdx(D.x,D.z);D.gate=BIOMES[bi].gate||null;D.region=BIOMES[bi].name;}}
Object.assign(UNIQUES,{
  ketch_rifle:{d:'dyna_ketch',name:"Ketch's Long Rifle",slot:'weapon',wt:'rifle',lvl:4,dmgM:1.1,bonus:{wpn:8,sen:3,crit:2}},
  gravel_tusk:{d:'dyna_gravelmaw',name:'Gravelmaw Tusk',slot:'weapon',wt:'blade',lvl:6,dmgM:1.12,bonus:{wpn:10,str:4,hp:40}},
  bog_vest:{d:'dyna_bogtooth',name:'Bogtooth Hide Vest',slot:'armor',fam:'medium',lvl:6,bonus:{agi:4,hp:60,treat:6}},
  drifter_veil:{d:'dyna_paledrifter',name:"Drifter's Veil",slot:'head',fam:'light',lvl:7,bonus:{psy:5,weave:10,evade:8}},
  redcrest_carapace:{d:'dyna_redcrest',name:'Redcrest Carapace',slot:'legs',fam:'medium',lvl:8,bonus:{agi:5,sen:4,hp:60}},
  rustjaw_arm:{d:'dyna_rustjaw',name:'Rustjaw Servo Arm',slot:'hands',fam:'heavy',lvl:9,bonus:{str:6,wpn:9,power:5}},
  prism_mantle:{d:'dyna_prismhide',name:'Prismhide Mantle',slot:'armor',fam:'light',lvl:10,bonus:{int:6,weave:14,en:50}},
  cinder_fang:{d:'dyna_cindermane',name:'Cindermane Fang',slot:'weapon',wt:'emitter',lvl:10,dmgM:1.12,bonus:{weave:16,psy:5,crit:4}},
  kings_breaker:{d:'dyna_hollowking',name:"Duskhorn King's Breaker",slot:'weapon',wt:'shotgun',lvl:15,dmgM:1.1,bonus:{wpn:20,str:8,hp:120}},
  seraph_halo:{d:'dyna_seraph',name:"Seraph's Halo",slot:'head',fam:'light',lvl:19,bonus:{psy:10,weave:22,en:100,evade:14}},
  rimeback_maul:{d:'dyna_rimeback',name:'Rimeback Maul',slot:'weapon',wt:'blade',lvl:24,dmgM:1.12,bonus:{wpn:32,str:13,hp:200}},
  pale_crown:{d:'dyna_palequeen',name:"Pale Matriarch's Crown",slot:'head',fam:'light',lvl:29,bonus:{psy:16,weave:34,en:160,evade:20}}});
const DY={st:{},live:{},acc:0};
function dyLoad(){let o={};try{o=JSON.parse(localStorage.getItem(DYNA_KEY)||'{}')||{};}catch(e){}for(const k in DYNAS){const r=o[k];DY.st[k]={until:r&&isFinite(r.until)?+r.until:0,ph:!!(r&&r.ph)};}}
function dySave(){const o={};for(const k in DY.st)o[k]={until:DY.st[k].until,ph:DY.st[k].ph};lsSet(DYNA_KEY,JSON.stringify(o));}
dyLoad();
const dyUp=k=>dyNow()>=DY.st[k].until;
const dyOpen=k=>!DYNAS[k].gate||gateOpen(DYNAS[k].gate);
function dySeen(k){P.dynaSeen=P.dynaSeen||[];if(!P.dynaSeen.includes(k)){P.dynaSeen.push(k);toast('💀 Dyna discovered: '+DYNAS[k].name+' ('+DYNAS[k].region+')');save();}}
function dySpawn(k){const D=DYNAS[k];if(DY.live[k])return;const ph=Math.random()<0.3;DY.st[k].ph=ph;
  const lv=ph?Math.max(1,D.lv-1):D.lv;const e=makeElite(D.t,D.x,D.z,lv,ph?D.ph:D.name,D.col,{hp:ph?2.5:D.hp,dmg:ph?1.2:1.5,scale:ph?1.3:(D.scale||1.6),glow:D.glow,xp:ph?2:6});
  e.dyna=k;e.ph=ph;e.leash=40;const L={boss:e,adds:[],ph,next:{},done:{},t0:T};
  if(!ph)for(let i=0;i<D.adds.n;i++){const a=i/D.adds.n*6.28;const m=makeEnemy(D.adds.t,D.x+Math.cos(a)*5,D.z+Math.sin(a)*5,clamp(D.lv-1,1,MAXLVL),true);m.pack='dy_'+k;m.wr=3;L.adds.push(m);}
  e.pack='dy_'+k;DY.live[k]=L;}
function dyDespawn(k){const L=DY.live[k];if(!L)return;for(const e of [L.boss,...L.adds])if(enemies.includes(e))removeEnemy(e);if(L.bubble)scene.remove(L.bubble);delete DY.live[k];}
function wTele(src,x,z,r,delay,dmg,name){const g=new THREE.Group();g.position.set(x,heightAt(x,z)+0.08,z);
  const edge=new THREE.Mesh(teleRing,new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0.95,depthWrite:false}));edge.scale.set(r,1,r);g.add(edge);
  const base=new THREE.Mesh(teleGeo,new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0.18,depthWrite:false}));base.scale.set(r,1,r);g.add(base);
  const fill=new THREE.Mesh(teleGeo,new THREE.MeshBasicMaterial({color:0xff6a2a,transparent:true,opacity:0.45,depthWrite:false}));fill.position.y=0.01;fill.scale.set(0.05,1,0.05);g.add(fill);
  scene.add(g);WTELE.push({src,x,z,r,t0:T,at:T+delay,dmg,g,fill,edge,name});}
function clearWTele(src){for(let i=WTELE.length-1;i>=0;i--){const t=WTELE[i];if(!src||t.src===src){scene.remove(t.g);t.g.children.forEach(m=>m.material.dispose());WTELE.splice(i,1);}}}
function updWTele(){for(let i=WTELE.length-1;i>=0;i--){const t=WTELE[i];const k=clamp((T-t.t0)/(t.at-t.t0),0,1);t.fill.scale.set(t.r*k,1,t.r*k);t.edge.material.opacity=0.6+Math.sin(T*18)*0.35;
    if(T>=t.at){ringFx(t.x,t.z,0xff5a2a,t.r,0.45);for(const tg of [P,...allies.filter(a=>a.comp&&!a.dead)])if(!tg.dead&&Math.hypot(tg.pos.x-t.x,tg.pos.z-t.z)<t.r+0.35){floatText(tmpV.set(tg.pos.x,tg.pos.y+2.6,tg.pos.z),t.name,'info');if(tg===P)dmgPlayer(t.dmg,t.src);else allyTakeDmg(tg,t.dmg,t.src);}
      scene.remove(t.g);t.g.children.forEach(m=>m.material.dispose());WTELE.splice(i,1);}}}
function dyMech(k,L,dt){const D=DYNAS[k],e=L.boss,m=D.mech;if(L.ph||e.dead)return;
  if(e.state!=='chase'){if(L.engaged){L.engaged=false;L.done={};clearWTele(e);if(L.enraged){L.enraged=false;e.T=L.baseT;e.dmg=L.baseDmg;}}return;}
  if(!L.engaged){L.engaged=true;L.baseT=e.T;L.baseDmg=e.dmg;L.next=T+(m.every?m.every*0.6:4);banner('💀 '+D.name.toUpperCase(),D.sub+' · '+m.name);SFX.quest();}
  const hpF=e.hp/e.maxHp;
  if((m.k==='slam'||m.k==='pools')&&T>=L.next&&T>=(e.stunUntil||0)){L.next=T+m.every;const dmg=L.baseDmg*m.mult;
    if(m.k==='slam'){e.rootUntil=T+m.delay;wTele(e,e.pos.x,e.pos.z,m.r,m.delay,dmg,m.name);toast('⚠ '+m.name+': get out of the circle!');}
    else{for(const tg of [P,...allies.filter(a=>a.comp&&!a.dead)]){wTele(e,tg.pos.x,tg.pos.z,m.r,m.delay,dmg,m.name);for(let i=1;i<m.count;i++){const a=rand(0,6.28),rr=rand(m.r*1.2,m.r*2.4);wTele(e,tg.pos.x+Math.cos(a)*rr,tg.pos.z+Math.sin(a)*rr,m.r,m.delay+i*0.15,dmg,m.name);}}toast('⚠ '+m.name+': move!');}tone(220,0.5,'sawtooth',0.05,300);}
  if(m.k==='summon'||m.k==='shield')(m.at||[]).forEach((th,j)=>{if(L.done[j]||hpF>th)return;L.done[j]=1;const list=[];for(let n=0;n<m.n;n++){const a=n/m.n*6.28;const x=makeEnemy(m.t,e.pos.x+Math.cos(a)*6,e.pos.z+Math.sin(a)*6,clamp(D.lv-1,1,MAXLVL),true);x.state='chase';x.nextAtk=T+1;x.dyAdd=k;list.push(x);L.adds.push(x);ringFx(x.pos.x,x.pos.z,0xff3b2f,2.5,0.6);}
    if(m.k==='shield'){L.shield=list;e.immune=()=>L.shield.some(x=>!x.dead&&enemies.includes(x));banner(m.name.toUpperCase(),'Kill the '+m.n+' adds to break the shield');}else toast('⚠ '+m.name+'!');SFX.boom();});
  if(m.enrage&&!L.enraged&&hpF<=m.enrage){L.enraged=true;e.T=Object.assign({},L.baseT,{atkCd:L.baseT.atkCd*0.7,speed:L.baseT.speed*1.2});e.dmg=L.baseDmg*1.4;banner(D.name.toUpperCase()+' ENRAGED','Faster, harder hits');}
  const on=!!(e.immune&&e.immune());if(on&&!L.bubble){L.bubble=new THREE.Mesh(geoSphere,new THREE.MeshBasicMaterial({color:0x9fe6ff,transparent:true,opacity:0.28,depthWrite:false}));scene.add(L.bubble);}
  if(L.bubble){L.bubble.visible=on;if(on){L.bubble.position.set(e.pos.x,e.pos.y+e.h*0.5,e.pos.z);L.bubble.scale.setScalar(e.hitR*2.2+1.5);}}}
function dyOnKill(k,L){const D=DYNAS[k],e=L.boss;dySeen(k);
  if(L.ph){DY.st[k].until=dyNow()+rand(60,180)*1000;DY.st[k].ph=false;log('💀 '+esc(D.ph)+' falls. Something bigger may come for its spot soon.');}
  else{DY.st[k].until=dyNow()+rand(600,1200)*1000;
    const n=Math.random()<0.4?2:1;for(let i=0;i<n;i++){const it=genItem(D.lv,null,D.lv>=12&&Math.random()<0.25?ASC:Math.max(2,rollRarity(35)));it.dropBy=D.name;dropLoot(e.pos.x+i*1.5,e.pos.z+1.5,it);}
    if(Math.random()<(D.lv>=12?0.22:0.18)){const u=makeUnique(D.uniq);u.dropBy=D.name;dropLoot(e.pos.x-1.5,e.pos.z,u);}
    P.credits+=60*D.lv;banner('💀 '+D.name.toUpperCase()+' DEFEATED','It will be back in 10–20 minutes');log('💀 <b>'+esc(D.name)+'</b> defeated (+'+(60*D.lv)+'¢). Dyna back in 10–20 min.');questOnDyna(k);achDyna(k);}
  clearWTele(e);dySave();save();}
function updDyna(dt){updWTele();if(state!=='play'||DUN){return;}DY.acc+=dt;const tick=DY.acc>=0.5;if(tick)DY.acc=0;
  for(const k in DYNAS){const D=DYNAS[k];const L=DY.live[k];const d=Math.hypot(P.pos.x-D.x,P.pos.z-D.z);
    if(L){if(L.boss.dead&&!L.killed){L.killed=true;dyOnKill(k,L);setTimeout(()=>dyDespawn(k),4000);continue;}if(!L.killed)dyMech(k,L,dt);
      if(tick&&!L.killed&&d>230&&L.boss.state!=='chase')dyDespawn(k);continue;}
    if(!tick)continue;if(d<70&&dyOpen(k)&&dyUp(k))dySeen(k);
    if(d<140&&dyOpen(k)&&dyUp(k))dySpawn(k);}}
function dyState(k){return dyUp(k)?(DY.live[k]&&DY.live[k].ph?'placeholder':'up'):'down';}
function dynaMini(c,tf){for(const k of P.dynaSeen||[]){const D=DYNAS[k];if(!D)continue;const q=tf(D.x,D.z);const up=dyUp(k);c.font='16px sans-serif';c.textAlign='center';c.textBaseline='middle';c.globalAlpha=up?1:0.45;c.fillText('💀',q[0],q[1]);c.globalAlpha=1;}}
function dynaMap(c,w2s,lab,vis){for(const k of P.dynaSeen||[]){const D=DYNAS[k];if(!D)continue;const q=w2s(D.x,D.z);const up=dyUp(k);c.fillStyle=up?'#c0201a':'#555';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.arc(q[0],q[1],9,0,7);c.fill();c.stroke();
    c.font='12px sans-serif';c.fillText('💀',q[0],q[1]+1);lab(D.x,D.z,D.name+' · Lv '+D.lv+(up?' · UP':' · down'),up?'#ff8a7a':'#aaa');}}
function dynaExports(){return {DYNAS,DY,DYCLK,dyNow,dyUp,dyState,dySpawn,dyDespawn,dyLoad,dySave,WTELE,dySeen,DYNA_KEY,updDyna};}
