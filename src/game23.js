/* ================= BUILD C: level cap 30 · Rimefall Expanse (Lv 21-30) · Hoarlight Hold · The Stillvault =================
   - Four new enemy behaviours (ETYPES[..].ai -> AIX), distinct from Build B's blink/kite/charge/heal:
       burrow (Rime Burrower): dives under the ice (untargetable), tunnels to you and erupts under your feet (telegraphed circle)
       chill  (Hoarfrost Caller): every hit stacks Chill (-14% move speed each); 4 stacks = Frozen solid. Fires a Frost Lance every ~8s
       split  (Glacier Shambler): shatters into two Shardlings when it dies
       ward   (Frostward Sentinel): puts Frost Wards on up to 3 nearby allies (-60% damage taken for 6s, blue shell)
   - Boss mechanics: MECH_EXT.cross (ice lines in a + then an x), .stillpoint (whole hall detonates except a drifting safe circle),
     .rimebrand (a circle follows its target, locks, then bursts and freezes), .shatter (boss hides in ice; break 3 shards in time or she heals)
   - Hoarlight Hold hub: quartermaster (Lv 21+ stock incl. two Ascendant pieces), contract terminal; bank/Save Point/Conduit come from OUTPOSTS/BANK_SPOTS. */
const HOARLIGHT=OUTPOSTS.find(o=>o.id==='hoarlight');
const WARD_MUL=0.4;// damage taken by a Frost-Warded enemy
/* ---------- builders (function declarations: hoisted, used by ETYPES in game5) ---------- */
function buildBurrower_v1(){const R=buildSkitter();retint(R.g,0xc8dcec,0.75,0x9fe8ff);for(let i=0;i<5;i++)part(R.g,geoCone,MB(i%2?0x9fe8ff:0xe8f6ff),(i-2)*0.2,0.95,-0.2-Math.abs(i-2)*0.15,0.09,0.5,0.09);part(R.g,geoBox,M(0x8aa4bc),0,0.5,1.2,0.6,0.15,0.35);return R;}
function buildFrostcaller_v1(){const R=buildHumanoid(0xc8d8e8,0x4a6a88,0x9fe8ff,0x8a9aaa);for(let i=0;i<5;i++){const a=i*1.257;part(R.g,geoCone,MB(0xbff0ff),Math.cos(a)*0.22,2.15,Math.sin(a)*0.22,0.06,0.32,0.06);}part(R.g,geoBox,M(0xe8f0f8),0,0.9,0,0.78,1.0,0.5);part(R.armR,geoCyl0(),MB(0x9fe8ff),0,-0.75,0.1,0.06,1.3,0.06);return R;}
function geoCyl0(){return geoBox;}
function buildShambler_v1(){const R=buildMauler();retint(R.g,0xb8ccdc,0.7,0x9fe8ff);for(let i=0;i<6;i++)part(R.g,geoIco,M(pick([0xd8eef8,0xa8c8e0,0xf0f8ff])),srand(-0.8,0.8),srand(2.0,2.6),srand(-1,0.6),srand(0.25,0.45),srand(0.25,0.5),srand(0.25,0.45));return R;}
function buildShardling_v1(){const R=buildSkitter();retint(R.g,0xa8d0ec,0.8,0x6fe8ff);part(R.g,geoIco,MB(0xbff0ff),0,1.0,-0.2,0.35,0.45,0.35);return R;}
function buildSentinel_v1(){const R=buildHumanoid(0x6a7c90,0x2a3440,0x6fe8ff,0x5a6470);part(R.g,geoBox,M(0x8aa4bc),0,1.25,0.3,0.9,1.3,0.1);part(R.g,geoBox,MB(0x6fe8ff),0,1.35,0.36,0.5,0.5,0.04);part(R.g,geoCone,MB(0x9fe8ff),0,2.35,0,0.22,0.5,0.22);return R;}
function buildRimewarden_v1(){const R=buildMauler();retint(R.g,0xc8dcec,0.8,0x6fe8ff);for(let i=0;i<5;i++)part(R.g,geoCone,MB([0x9fe8ff,0xe8f6ff,0x6fe8ff][i%3]),(i-2)*0.4,2.9,-0.2,0.16,1.0,0.16);part(R.g,geoBox,MB(0x6fe8ff),0,1.6,1.8,0.7,0.1,0.06);return R;}
function buildOrrery(){const g=new THREE.Group();const R={g};part(g,geoBox,M(0x4a6a88),0,0.4,0,2,0.8,2);part(g,geoCyl0(),M(0x8aa4bc),0,1.8,0,0.5,2.4,0.5);R.core=part(g,geoIco,MB(0x9fe8ff),0,3.2,0,0.7,0.7,0.7);
  R.rings=[0,1,2].map(i=>{const r=part(g,new THREE.TorusGeometry(1.3+i*0.45,0.06,4,28),MB([0xe8f6ff,0x9fe8ff,0x6fe8ff][i]),0,3.2,0,1,1,1);r.rotation.x=0.6+i*0.7;return r;});
  for(let i=0;i<3;i++){const a=i*2.09;part(g,geoIco,MB(0xffffff),Math.cos(a)*1.8,3.2,Math.sin(a)*1.8,0.18,0.18,0.18);}
  R.anim=(t,mv,atk)=>{R.rings.forEach((r,i)=>{r.rotation.y=t*(0.4+i*0.25);r.rotation.z=t*0.2*(i%2?1:-1);});R.core.scale.setScalar(0.7+(atk>0?0.15:0)+Math.sin(t*3)*0.05);};return R;}
function buildYsra_v1(){const R=buildHumanoid(0xe8f0f8,0x4a6a88,0x6fe8ff,0xc8d8e8);for(let i=0;i<7;i++){const a=(i-3)*0.3;part(R.g,geoCone,MB(i%2?0x9fe8ff:0xffffff),Math.sin(a)*0.25,2.25+Math.cos(a)*0.08,-Math.cos(a)*0.05,0.06,0.5-Math.abs(i-3)*0.07,0.06);}
  part(R.g,geoBox,M(0xc8dcec),0,0.75,-0.1,1.0,1.1,0.8);part(R.g,geoBox,M(0x9fb8cc),0,1.3,-0.4,1.2,1.5,0.08);return R;}
function buildIceShard(){const R=buildPylon();retint(R.g,0xc8dcec,0.7,0x9fe8ff);return R;}
/* ---------- helpers ---------- */
const teleAny=(src,x,z,r,d,dmg,n)=>DUN?telegraph(src,x,z,r,d,dmg,n):wTele(src,x,z,r,d,dmg,n);
function burSurface(e){e.bur=null;e.immune=null;if(!e.dead){e.R.g.visible=true;e.shadow.visible=true;}}
// Chill stacks on the player: -14% move speed per stack for 5s; the 4th stack freezes you (heavy slow) and clears the stacks
function addChill(n,src){if(P.dead)return;const c=P.chill=(P.chill&&T<P.chill.until)?P.chill:{n:0,until:0};c.n+=n;c.until=T+5;
  if(c.n>=4){P.chill=null;P.frozen=(P.frozen||0)+1;applySlow(0.15,1.8,'Frozen solid!');ringFx(P.pos.x,P.pos.z,0x9fe8ff,2.6,0.7);tone(1200,0.25,'sine',0.04,-900);}
  else applySlow(1-0.14*c.n,4,'Chilled x'+c.n);}
// Glacier Shambler death: two Shardlings at one level lower
function splitOnDeath(e){const sp=e.T.split;if(!sp)return;e.splits=(e.splits||0)+1;ringFx(e.pos.x,e.pos.z,0x9fe8ff,3,0.6);floatText(tmpV.set(e.pos.x,e.pos.y+e.h,e.pos.z),'Shatters!','info');
  for(let i=0;i<sp.n;i++){const a=rand(0,6.28),x=e.pos.x+Math.cos(a)*1.6,z=e.pos.z+Math.sin(a)*1.6;const lv=Math.max(1,e.lv-1);
    const s=e.dun&&DUN?spawnDunMob(sp.t,x,z,lv-(DUN.mode.lvl||0),{temp:true}):makeEnemy(sp.t,x,z,lv,true);s.isShard=true;s.state='chase';s.nextAtk=T+0.9;if(e.addOf)s.addOf=e.addOf;if(e.mis)s.mis=null;}}
const wardGeo=new THREE.IcosahedronGeometry(1,1);
function wardOn(o,dur){o.wardUntil=T+dur;if(!o.wardFx){const m=new THREE.Mesh(wardGeo,new THREE.MeshBasicMaterial({color:0x6fe8ff,transparent:true,opacity:0.28,depthWrite:false}));const s=o.R.g.scale.x||1;m.position.y=o.h*0.5/s;m.scale.setScalar(Math.max(0.9,o.h*0.62)/s);o.R.g.add(m);o.wardFx=m;}}
/* ---------- behaviours ---------- */
Object.assign(AIX,{
  // Rime Burrower: dives (untargetable, unseen) for ~1.4s while tunnelling to you, then erupts in a 3m circle under its target (0.9s warning)
  burrow(e,dt,F,fp,dF,rooted,stunned){const b=e.bur;
    if(b){if(b.ph==='down'){moveToward(e,fp.x,fp.z,e.T.speed*1.8,dt,0.4);if(T>=b.at){b.ph='rise';b.at=T+0.9;teleAny(e,fp.x,fp.z,3,0.9,e.dmg*2.1,'Ice Eruption');e.pos.x=fp.x+0.7;e.pos.z=fp.z;ringFx(fp.x,fp.z,0xe8f6ff,3,0.9);tone(180,0.4,'sawtooth',0.04,-80);}return {moved:true,noAtk:true};}
      if(T>=b.at){burSurface(e);e.nextAtk=T+0.5;floatText(tmpV.set(e.pos.x,e.pos.y+e.h+0.6,e.pos.z),'Erupts!','info');}return {moved:false,noAtk:true};}
    if(e.burAt==null)e.burAt=T+rand(1.5,3);if(rooted||stunned||T<e.burAt||dF>26)return null;
    e.burAt=T+rand(9,11);e.bur={ph:'down',at:T+1.4};e.burrows=(e.burrows||0)+1;e.immune=()=>!!e.bur;ringFx(e.pos.x,e.pos.z,0xe8f6ff,2.4,0.6);
    floatText(tmpV.set(e.pos.x,e.pos.y+e.h+0.6,e.pos.z),'Burrows!','info');e.R.g.visible=false;e.shadow.visible=false;return {moved:false,noAtk:true};},
  // Hoarfrost Caller: keeps ~10m away; its hits chill (see addChill); every ~8s a Frost Lance (bigger hit, 2 more stacks)
  chill(e,dt,F,fp,dF,rooted,stunned){if(e.lanceAt==null)e.lanceAt=T+rand(3,5);
    if(!stunned&&T>=e.lanceAt&&dF<e.T.range+2){e.lanceAt=T+rand(7.5,9);e.atkT=0.35;e.nextAtk=Math.max(e.nextAtk,T+1);const tg=F;e.lances=(e.lances||0)+1;
      fireProj(new V3(e.pos.x,e.pos.y+1.6,e.pos.z),tg,0x9fe8ff,24,()=>{if(tg.dead)return;hitFoe(tg,e.dmg*1.4,e);if(tg===P)addChill(1,e);ringFx(tg.pos.x,tg.pos.z,0x9fe8ff,1.6,0.4);});tone(1500,0.15,'triangle',0.03,-600);}
    return aiKeepAway(e,dt,fp,dF,rooted,10);},
  // Glacier Shambler: fights like a normal bruiser; the behaviour is its death split (killEnemy -> splitOnDeath)
  split(){return null;},
  // Frostward Sentinel: every ~8s wards up to 3 allies within 14m (the most wounded first); keeps ~8m away
  ward(e,dt,F,fp,dF,rooted,stunned){if(e.wardAt==null)e.wardAt=T+rand(1.5,3);
    if(!stunned&&T>=e.wardAt){const L=enemies.filter(o=>o!==e&&!o.dead&&o.hp>0&&!o.isCore&&!o.boss&&dist2D(o.pos,e.pos)<14&&T>(o.wardUntil||0)-1).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp).slice(0,3);
      if(L.length){e.wardAt=T+8;e.wards=(e.wards||0)+L.length;e.atkT=0.35;for(const o of L){wardOn(o,6);ringFx(o.pos.x,o.pos.z,0x6fe8ff,1.8,0.5);}floatText(tmpV.set(e.pos.x,e.pos.y+e.h+0.6,e.pos.z),'Frost Ward!','info');tone(900,0.2,'sine',0.03,300);}else e.wardAt=T+2;}
    return aiKeepAway(e,dt,fp,dF,rooted,8);}});
// per-frame upkeep: burrowers never stay hidden outside a fight, ward shells expire, chill stacks expire
function updBuildC(dt){for(const e of enemies){if(e.bur&&(e.dead||e.state!=='chase'||T>e.bur.at+3))burSurface(e);if(e.wardFx&&(e.dead||T>=(e.wardUntil||0))){e.R.g.remove(e.wardFx);e.wardFx.material.dispose();e.wardFx=null;}}
  if(P.chill&&T>P.chill.until)P.chill=null;}
/* ---------- boss mechanics ---------- */
// Glacial Cross: four lines of ice circles out from the boss, alternating + and x; the gaps between the lines are safe
MECH_EXT.cross=(e,b,m,i)=>{if(T<b.next[i]||T<(e.stunUntil||0))return;b.next[i]=T+m.every;b.crossRot=(b.crossRot||0)^1;const a0=b.crossRot?Math.PI/4:0;e.rootUntil=T+m.delay+0.3;const dmg=b.baseDmg*m.mult;
  telegraph(e,e.pos.x,e.pos.z,m.r+0.7,m.delay,dmg,m.name);for(let k=0;k<4;k++){const a=a0+k*Math.PI/2;for(let s=1;s<=m.len;s++)telegraph(e,e.pos.x+Math.cos(a)*s*m.gap,e.pos.z+Math.sin(a)*s*m.gap,m.r,m.delay+s*0.06,dmg,m.name);}
  e.crosses=(e.crosses||0)+1;toast('⚠ '+m.name+': stand between the lines!');tone(260,0.5,'sawtooth',0.05,-120);};
// Stillpoint: the whole hall detonates except a 5m green circle that drifts (bouncing off the walls) until it goes off
MECH_EXT.stillpoint=(e,b,m,i)=>{if(T<b.next[i]||T<(e.stunUntil||0)||!DUN)return;b.next[i]=T+m.every;const r=b.room;const hw=r.w/2-m.safe-1,hd=r.d/2-m.safe-1;
  const sx=rand(-hw,hw),sz=r.cz+rand(-hd,hd);const a=rand(0,6.28);let vx=Math.cos(a)*m.speed,vz=Math.sin(a)*m.speed;
  novaTele(e,sx,sz,m.safe,m.r,m.delay,b.baseDmg*m.mult,m.name);const t=DUN.tele[DUN.tele.length-1];t.lt=T;
  t.upd=t=>{const dt=Math.min(0.1,T-t.lt);t.lt=T;let x=t.x+vx*dt,z=t.z+vz*dt;if(Math.abs(x)>hw){vx=-vx;x=clamp(x,-hw,hw);}if(Math.abs(z-r.cz)>hd){vz=-vz;z=clamp(z,r.cz-hd,r.cz+hd);}t.x=x;t.z=z;t.g.position.set(x,0.06,z);};
  e.stills=(e.stills||0)+1;banner(m.name.toUpperCase(),'Time stops. Stay inside the drifting green circle!');tone(120,0.9,'sine',0.06,60);};
// Rime Brand: a circle follows one target, locks for the last moment, then bursts; anyone still inside is frozen
MECH_EXT.rimebrand=(e,b,m,i)=>{if(T<b.next[i]||T<(e.stunUntil||0)||!DUN)return;b.next[i]=T+m.every;const ts=dunTargets().filter(t=>!t.dead);if(!ts.length)return;const tg=ts[Math.floor(Math.random()*ts.length)];
  telegraph(e,tg.pos.x,tg.pos.z,m.r,m.delay,b.baseDmg*m.mult,m.name);const t=DUN.tele[DUN.tele.length-1];t.lock=T+m.delay-m.lock;
  t.upd=t=>{if(T<t.lock&&!tg.dead){t.x=tg.pos.x;t.z=tg.pos.z;t.g.position.set(t.x,0.06,t.z);}else if(!t.locked){t.locked=true;t.edge.material.color.setHex(0x9fe8ff);}};
  t.fx=h=>{if(h===P)applySlow(0.15,m.freeze,'Frozen!');else h.rootUntil=T+m.freeze;};
  e.brands=(e.brands||0)+1;toast('⚠ '+m.name+(tg===P?' on you: run, then step out when it locks!':' on '+(tg.name||'an ally')));tone(1400,0.3,'sine',0.04,-1000);};
// Shatter: at each threshold the boss hides in ice (immune) and 3 Hush Shards rise; break them all within m.time or she heals and the hall takes a frost blast
MECH_EXT.shatter=(e,b,m,i,hpF)=>{if(b.shEng!==b.t0){b.shEng=b.t0;b.shT=0;b.shards=null;}
  m.at.forEach((th,j)=>{const k=i+'_'+j;if(b.done[k]||hpF>th)return;b.done[k]=1;const r=b.room;b.shards=[];
    for(let n=0;n<m.n;n++){const a=n/m.n*6.28+0.3;const p=spawnDunMob('iceshard',Math.cos(a)*r.w*0.33,r.cz+Math.sin(a)*r.d*0.33,m.lvl,{temp:true});p.addOf=e;p.wr=0;p.state='chase';p.nextAtk=T+1.5;ringFx(p.pos.x,p.pos.z,0x9fe8ff,3,0.6);b.shards.push(p);}
    b.shT=T+m.time;e.immune=()=>!!b.shards&&b.shards.some(p=>!p.dead&&enemies.includes(p));e.shatters=(e.shatters||0)+1;
    banner(m.name.toUpperCase(),'Break the '+m.n+' Hush Shards within '+m.time+'s or she heals '+Math.round(m.heal*100)+'%');SFX.boom();});
  if(b.shT){const live=(b.shards||[]).filter(p=>!p.dead&&enemies.includes(p));
    if(!live.length){b.shT=0;e.immune=null;e.shBroken=(e.shBroken||0)+1;banner('SHARDS BROKEN',esc(e.T.name)+' is exposed!');}
    else if(T>=b.shT){b.shT=0;for(const p of live){p.dead=true;p.R.g.visible=false;p.shadow.visible=false;ringFx(p.pos.x,p.pos.z,0x9fe8ff,4,0.6);}e.immune=null;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*m.heal);e.shHeals=(e.shHeals||0)+1;
      for(const tg of dunTargets())if(!tg.dead){if(tg===P)dmgPlayer(b.baseDmg*m.mult,e,true);else allyTakeDmg(tg,b.baseDmg*m.mult,e);}banner('THE HUSH','The shards burst: she heals '+Math.round(m.heal*100)+'%');SFX.boom();}}};
/* ---------- Hoarlight Hold hub ---------- */
const HUB2={vend:{x:HOARLIGHT.x+8,z:HOARLIGHT.z+1},term:{x:HOARLIGHT.x,z:HOARLIGHT.z-8.5}};
(function buildHub2(){const o=HOARLIGHT,y=heightAt(o.x,o.z);const g=new THREE.Group();g.position.set(o.x,y,o.z);
  // heat tower with a glowing core, frost-rimmed walls and brazier posts
  part(g,geoBox,M(0x5a6470),-8,4.5,-7,1.8,9,1.8);part(g,geoBox,M(0x3a4450),-8,9.2,-7,3.4,0.4,3.4);part(g,geoIco,MB(0xffb347),-8,10.1,-7,0.6,0.6,0.6);
  boxes.push({x0:o.x-8.9,x1:o.x-7.1,z0:o.z-7.9,z1:o.z-6.1,y0:y,y1:y+9.5});
  for(const [x,z,w,d] of [[-13,0,0.8,10],[13,-4,0.8,8],[0,-14,10,0.8],[4,14,8,0.8]]){part(g,geoBox,M(0xc8d4e0),x,0.9,z,w,1.8,d);part(g,geoBox,M(0xf2f6fa),x,1.9,z,w+0.2,0.2,d+0.2);}
  for(const [x,z] of [[-10,7],[10,-7],[7,10],[-7,-10],[11,5],[-3,11]]){part(g,geoBox,M(0x3a4450),x,1.3,z,0.25,2.6,0.25);part(g,geoIco,MB(0xffb347),x,2.8,z,0.3,0.3,0.3);}
  // quartermaster stall
  const v=HUB2.vend;part(g,geoBox,M(0x4a5a6a),v.x-o.x+1.4,1.0,v.z-o.z,0.9,2,3.2);part(g,geoBox,M(0xe8eef4),v.x-o.x+1.4,2.2,v.z-o.z,1.6,0.25,3.8);part(g,geoBox,MB(0xffb347),v.x-o.x+0.9,1.5,v.z-o.z,0.05,0.4,2);
  boxes.push({x0:v.x+0.9,x1:v.x+1.9,z0:v.z-1.6,z1:v.z+1.6,y0:y,y1:y+2.3});
  // contract terminal
  const t=HUB2.term;part(g,geoBox,M(0x2b3742),t.x-o.x,1.0,t.z-o.z-0.3,1.8,2,0.5);part(g,geoBox,MB(0x9fe8ff),t.x-o.x,1.5,t.z-o.z-0.04,1.4,0.9,0.05);
  boxes.push({x0:t.x-0.9,x1:t.x+0.9,z0:t.z-0.55,z1:t.z-0.05,y0:y,y1:y+2});
  scene.add(g);const b=makeBeam(0xffb347,40,0.6,0.25);b.position.set(o.x-8,y,o.z-7);
  const Q=buildHumanoid(0x6a7c90,0x2a3440,0xffd25a,0x8a6a5a,{npc:1,helm:0xe8eef4});Q.g.position.set(v.x,heightAt(v.x,v.z),v.z);Q.g.rotation.y=Math.atan2(o.x-v.x,o.z-v.z);scene.add(Q.g);
  circles.push({x:v.x,z:v.z,r:0.6});HUB2.vendR=Q;})();
HUBS.push({id:'hoarlight',o:HOARLIGHT,vend:HUB2.vend,term:HUB2.term,vn:'Quartermaster Ivo Rask',tn:'Hoarlight Contracts',title:'HOARLIGHT QUARTERMASTER',
  // Hoarlight stock: Epic weapon + armour one level up, a top-QL Epic implant, and from Lv 21 two Ascendant pieces and an Ascendant implant
  stock(list,L){list.push(genItem(L+1,'weapon',3,{wt:pick(wtAff(P.prof))}),genItem(L+1,pick(ASLOTS),3,{fam:PROF_FAM[P.prof]}),genImplant(Math.min(IMPQL_MAX(),L*5),null,3));
    if(L>=21)list.push(genItem(L,'weapon',ASC,{wt:pick(wtAff(P.prof))}),genItem(L,pick(ASLOTS),ASC,{fam:PROF_FAM[P.prof]}),genImplant(Math.min(IMPQL_MAX(),L*5-2),null,ASC));}});
// a spot in the Rimefall whose level matches lv (either side of Hoarlight)
function rimeSpot(lv){const d=clamp((lv-21)/9,0,1)*180;const deg=RIME.hubDeg+(Math.random()<0.5?-1:1)*d+rand(-8,8);const [x,z]=rimeAt(deg,rand(680,770));return {x,z};}
function buildCExports(){return {AIX,addChill,splitOnDeath,WARD_MUL,wardOn,updBuildC,HOARLIGHT,HUB2,HUBS,rimeSpot,rimeLv,rimeAt,RIME,GB,RB,NB,MECH_EXT,telegraph,novaTele,dunTargets};}
