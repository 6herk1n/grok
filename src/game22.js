/* ================= BUILD B: level cap 20 · Duskcrown Highlands (Lv 11-20) · Farwatch Station · The Choir Below =================
   - New enemy behaviours (ETYPES[..].ai -> AIX): blink (Glint Stalker), kite + Shard Fall circles (Shardcaller),
     wind-up charge (Crag Brute), heal the most wounded ally (Choir Tender). updEnemy() calls AIX[ai] while chasing.
   - Boss mechanics: MECH_EXT.blinkslam (teleport next to a target + telegraphed slam), MECH_EXT.chorus (Echo adds that heal the boss).
   - Farwatch Station hub: quartermaster (higher-tier stock, Ascendant gear), contract terminal; bank/Save Point/Conduit come from OUTPOSTS/BANK_SPOTS. */
const FARWATCH=OUTPOSTS.find(o=>o.id==='farwatch');
/* ---------- builders (function declarations: hoisted, used by ETYPES in game5) ---------- */
function buildStalker_v1(){const R=buildSkitter();retint(R.g,0x3a2a5a,0.7,0x9f7bff);for(let i=0;i<4;i++)part(R.g,geoCone,MB(i%2?0xb46bff:0x7ff6ff),(i-1.5)*0.22,1.0,-0.1-i*0.12,0.08,0.55,0.08);return R;}
function buildShardcaller_v1(){const R=buildHumanoid(0x3a3450,0x5a4a7a,0x7ff6ff,0x2a2438);for(let i=0;i<3;i++){const a=i*2.09;part(R.g,geoIco,MB(0xb48cff),Math.cos(a)*0.55,2.35,Math.sin(a)*0.55,0.13,0.22,0.13);}part(R.g,geoBox,M(0x2a2438),0,1.0,-0.25,0.6,1.2,0.12);return R;}
function buildBrute_v1(){const R=buildMauler();retint(R.g,0x4a4060,0.6,0x7ff6ff);for(let i=0;i<4;i++)part(R.g,geoCone,MB(0x9fe0ff),(i-1.5)*0.35,2.5,-0.3,0.14,0.8,0.14);return R;}
function buildTender_v1(){const R=buildHumanoid(0xd8d0f0,0x6a5a8a,0x9fff9a,0x8a7aa0);const h=part(R.g,new THREE.TorusGeometry(0.32,0.05,4,16),MB(0x9fff9a),0,2.3,0,1,1,1);h.rotation.x=Math.PI/2;part(R.g,geoBox,M(0xe8e0ff),0,0.9,0,0.7,1.0,0.5);return R;}
function buildCantor_v1(){const R=buildHumanoid(0x2a2240,0xb46bff,0xff9af0,0x5a4a6a);part(R.g,geoCone,MB(0xb46bff),0,2.5,0,0.25,0.7,0.25);part(R.g,geoBox,M(0x1a1428),0,1.0,-0.2,0.8,1.4,0.14);return R;}
function buildHymnwarden_v1(){const R=buildMauler();retint(R.g,0x6a6a8a,0.75,0xb46bff);part(R.g,geoBox,MB(0x7ff6ff),0,2.6,0.2,0.6,0.12,0.6);for(let i=0;i<3;i++)part(R.g,geoCone,MB(0xd8c0ff),(i-1)*0.5,2.9,-0.2,0.15,0.9,0.15);return R;}
function buildChoirmother_v1(){const R=buildSkitter();retint(R.g,0x2a1a4a,0.7,0x7ff6ff);for(let i=0;i<7;i++)part(R.g,geoCone,MB([0x7ff6ff,0xb46bff,0xd8c0ff][i%3]),(i-3)*0.18,1.05,-0.3-Math.abs(i-3)*0.08,0.09,0.65,0.09);return R;}
function buildChordPylon(){const R=buildPylon();retint(R.g,0x4a4060,0.6,0xb46bff);return R;}
/* ---------- behaviours ---------- */
function aiShard(e,fp,dF,stunned){if(stunned)return;if(e.castAt==null)e.castAt=T+rand(2.5,4.5);
  if(T>=e.castAt&&dF<e.T.range+2){e.castAt=T+rand(8,10);const dmg=e.dmg*1.8;if(DUN)telegraph(e,fp.x,fp.z,3.2,1.6,dmg,'Shard Fall');else wTele(e,fp.x,fp.z,3.2,1.6,dmg,'Shard Fall');tone(760,0.18,'triangle',0.03,300);}}
function aiKeepAway(e,dt,fp,dF,rooted,want){if(rooted||dF>=want)return null;const k=1/(dF||1);const tx=e.pos.x+(e.pos.x-fp.x)*k*6,tz=e.pos.z+(e.pos.z-fp.z)*k*6;
  const mv=moveToward(e,tx,tz,e.T.speed*0.85,dt,0.5);e.rotY=Math.atan2(fp.x-e.pos.x,fp.z-e.pos.z);return {moved:mv};}
const AIX={
  // Glint Stalker: every ~7s blinks to just behind its target (stays in melee afterwards)
  blink(e,dt,F,fp,dF,rooted,stunned){if(rooted||stunned||T<(e.blinkAt||0)||dF<5||dF>24)return null;e.blinkAt=T+rand(6.5,8.5);
    const fr=F.rotY||0;const p={x:fp.x-Math.sin(fr)*2.4,z:fp.z-Math.cos(fr)*2.4};collide(p,0.6);
    ringFx(e.pos.x,e.pos.z,0x9f7bff,2,0.5);e.pos.x=p.x;e.pos.z=p.z;e.rotY=Math.atan2(fp.x-p.x,fp.z-p.z);ringFx(p.x,p.z,0x9f7bff,2.4,0.5);e.nextAtk=Math.max(e.nextAtk,T+0.45);e.blinks=(e.blinks||0)+1;
    tone(900,0.12,'sine',0.03,-500);floatText(tmpV.set(p.x,heightAt(p.x,p.z)+e.h+0.6,p.z),'Blink!','info');return {moved:false};},
  // Shardcaller: backs off when you close in, and calls Shard Fall circles under its target
  kite(e,dt,F,fp,dF,rooted,stunned){aiShard(e,fp,dF,stunned);return aiKeepAway(e,dt,fp,dF,rooted,7);},
  // Crag Brute: 0.9s wind-up (orange ring), then charges in a straight line through where you stood: sidestep it
  charge(e,dt,F,fp,dF,rooted,stunned){const c=e.chg;
    if(c){if(stunned||(rooted&&c.ph==='dash')){e.chg=null;return null;}
      if(c.ph==='wind'){e.rotY=Math.atan2(c.tx-e.pos.x,c.tz-e.pos.z);if(T>=c.at){c.ph='dash';c.until=T+1.6;const l=Math.hypot(c.tx-e.pos.x,c.tz-e.pos.z)||1;c.dx=(c.tx-e.pos.x)/l;c.dz=(c.tz-e.pos.z)/l;c.left=l+3;}return {moved:false,noAtk:true};}
      const st=Math.min(c.left,e.T.speed*3.4*dt);e.pos.x+=c.dx*st;e.pos.z+=c.dz*st;collide(e.pos,e.hitR*0.5);c.left-=st;
      if(dist2D(e.pos,fp)<e.hitR+1.4){hitFoe(F,e.dmg*1.8,e);ringFx(e.pos.x,e.pos.z,0xffb347,3,0.4);SFX.boom();e.chg=null;e.nextAtk=T+1.4;e.charges=(e.charges||0)+1;return {moved:true,noAtk:true};}
      if(c.left<=0||T>c.until){e.chg=null;e.nextAtk=T+0.8;e.charges=(e.charges||0)+1;}return {moved:true,noAtk:true};}
    if(!rooted&&!stunned&&T>=(e.chgCd||0)&&dF>7&&dF<24){e.chgCd=T+rand(10,13);e.chg={ph:'wind',at:T+0.9,tx:fp.x,tz:fp.z};ringFx(e.pos.x,e.pos.z,0xffb347,2.5,0.9);
      floatText(tmpV.set(e.pos.x,e.pos.y+e.h+0.8,e.pos.z),'Charging!','info');tone(140,0.5,'sawtooth',0.05,120);return {moved:false,noAtk:true};}
    return null;},
  // Choir Tender: every 6s heals the most wounded enemy within 20m for 16% of its health; keeps ~12m away
  heal(e,dt,F,fp,dF,rooted,stunned){if(!stunned&&T>=(e.healAt||0)){let best=null,bk=0.85;for(const o of enemies)if(!o.dead&&o!==e&&!o.isCore&&dist2D(o.pos,e.pos)<20){const k=o.hp/o.maxHp;if(k<bk){bk=k;best=o;}}
      if(best){e.healAt=T+6;const tgt=best;fireProj(new V3(e.pos.x,e.pos.y+1.6,e.pos.z),tgt,0x9fff9a,20,()=>{if(tgt.dead)return;const a=Math.round(tgt.maxHp*(tgt.boss&&balOn()?0.04:0.16));tgt.hp=Math.min(tgt.maxHp,tgt.hp+a);e.heals=(e.heals||0)+1;
          floatText(tmpV.set(tgt.pos.x,tgt.pos.y+tgt.h+0.4,tgt.pos.z),'+'+a,'info');ringFx(tgt.pos.x,tgt.pos.z,0x6dff8a,1.6,0.4);});e.atkT=0.35;}else e.healAt=T+1.5;}
    return aiKeepAway(e,dt,fp,dF,rooted,11);}};
/* ---------- boss mechanics ---------- */
MECH_EXT.blinkslam=(e,b,m,i)=>{if(T<b.next[i]||T<(e.stunUntil||0))return;b.next[i]=T+m.every;const ts=dunTargets().filter(t=>!t.dead);if(!ts.length)return;const tg=ts[Math.floor(Math.random()*ts.length)];
  const a=rand(0,6.28);const p={x:tg.pos.x+Math.cos(a)*2,z:tg.pos.z+Math.sin(a)*2};collide(p,e.hitR*0.6);ringFx(e.pos.x,e.pos.z,0xb46bff,3,0.5);e.pos.x=p.x;e.pos.z=p.z;ringFx(p.x,p.z,0xb46bff,3.5,0.6);
  e.blinks=(e.blinks||0)+1;e.rootUntil=T+m.delay;telegraph(e,p.x,p.z,m.r,m.delay,b.baseDmg*m.mult,m.name);toast('⚠ '+m.name+': right next to you. Get out!');tone(700,0.2,'sine',0.04,-400);};
MECH_EXT.chorus=(e,b,m,i,hpF)=>{m.at.forEach((th,j)=>{const k=i+'_'+j;if(b.done[k]||hpF>th)return;b.done[k]=1;const r=b.room;b.echoes=(b.echoes||[]).filter(x=>!x.dead&&enemies.includes(x));
    for(let n=0;n<m.n;n++){const side=n%2?1:-1;const a=spawnDunMob('tender',side*(r.w/2-3),r.cz+rand(-r.d/4,r.d/4),m.lvl,{temp:true});a.T.name='Choir Echo';a.addOf=e;a.state='chase';a.nextAtk=T+1;a.echo=true;ringFx(a.pos.x,a.pos.z,0xb46bff,2.5,0.6);b.echoes.push(a);}
    banner(m.name.toUpperCase(),'Kill the Choir Echoes: each heals her '+Math.round(m.heal*100)+'% per second');SFX.boom();});
  const live=(b.echoes||[]).filter(x=>!x.dead&&enemies.includes(x));const dt=Math.min(0.25,T-(b.chT||T));b.chT=T;
  if(live.length&&!e.dead)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*m.heal*live.length*dt);
  b.beams=b.beams||[];while(b.beams.length<live.length&&DUN){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x9fff9a,transparent:true,opacity:0.85}));l.frustumCulled=false;DUN.group.add(l);b.beams.push(l);}
  b.beams.forEach((l,k)=>{const x=live[k];l.visible=!!x;if(!x)return;const p=l.geometry.attributes.position.array;p[0]=x.pos.x;p[1]=x.pos.y+1.5;p[2]=x.pos.z;p[3]=e.pos.x;p[4]=e.pos.y+e.h*0.5;p[5]=e.pos.z;l.geometry.attributes.position.needsUpdate=true;});};
/* ---------- Farwatch Station hub ---------- */
const HUB={vend:{x:FARWATCH.x+8,z:FARWATCH.z+1},term:{x:FARWATCH.x,z:FARWATCH.z-8.5}};
(function buildHub(){const o=FARWATCH,y=heightAt(o.x,o.z);const g=new THREE.Group();g.position.set(o.x,y,o.z);
  // watchtower with a listening dish and a violet beacon
  part(g,geoBox,M(0x4a4458),-8,4,-7,1.6,8,1.6);part(g,geoBox,M(0x3a3448),-8,8.3,-7,3.2,0.4,3.2);part(g,geoCone,M(0x8a84a0),-8,9.2,-7,1.4,0.6,1.4).rotation.x=Math.PI;part(g,geoIco,MB(0xb46bff),-8,9.9,-7,0.35,0.35,0.35);
  boxes.push({x0:o.x-8.8,x1:o.x-7.2,z0:o.z-7.8,z1:o.z-6.2,y0:y,y1:y+8.5});
  // lantern posts
  for(const [x,z] of [[-10,6],[10,-6],[6,10],[-6,-10],[11,4],[-3,11]]){part(g,geoBox,M(0x3a3448),x,1.4,z,0.22,2.8,0.22);part(g,geoIco,MB(0xb48cff),x,3.0,z,0.28,0.28,0.28);}
  // quartermaster stall
  const v=HUB.vend;part(g,geoBox,M(0x4a4060),v.x-o.x+1.4,1.0,v.z-o.z,0.9,2,3.2);part(g,geoBox,M(0x6a5e88),v.x-o.x+1.4,2.2,v.z-o.z,1.6,0.25,3.8);part(g,geoBox,MB(0x7ff6ff),v.x-o.x+0.9,1.5,v.z-o.z,0.05,0.4,2);
  boxes.push({x0:v.x+0.9,x1:v.x+1.9,z0:v.z-1.6,z1:v.z+1.6,y0:y,y1:y+2.3});
  // contract terminal
  const t=HUB.term;part(g,geoBox,M(0x2b3742),t.x-o.x,1.0,t.z-o.z-0.3,1.8,2,0.5);part(g,geoBox,MB(0x5ff2ff),t.x-o.x,1.5,t.z-o.z-0.04,1.4,0.9,0.05);
  boxes.push({x0:t.x-0.9,x1:t.x+0.9,z0:t.z-0.55,z1:t.z-0.05,y0:y,y1:y+2});
  scene.add(g);const b=makeBeam(0xb46bff,40,0.6,0.25);b.position.set(o.x-8,y,o.z-7);
  const Q=buildHumanoid(0x5a4e78,0x2a2438,0xffd25a,0x7a5a46,{npc:1,helm:0xc8a040});Q.g.position.set(v.x,heightAt(v.x,v.z),v.z);Q.g.rotation.y=Math.atan2(o.x-v.x,o.z-v.z);scene.add(Q.g);
  circles.push({x:v.x,z:v.z,r:0.6});HUB.vendR=Q;})();
// hub registry (Farwatch here; Build C adds Hoarlight Hold): quartermaster + contract terminal, gated by the hub's story gate
const HUBS=[{id:'farwatch',o:FARWATCH,vend:HUB.vend,term:HUB.term,vn:'Quartermaster Varrow',tn:'Farwatch Contracts',title:'FARWATCH QUARTERMASTER',
  // Farwatch stock: on top of the usual stock, two Epic pieces one level up, a top-QL implant, and from Lv 12 an Ascendant item
  stock(list,L){list.push(genItem(L+1,'weapon',3,{wt:pick(wtAff(P.prof))}),genItem(L+1,pick(ASLOTS),3,{fam:PROF_FAM[P.prof]}),genImplant(Math.min(IMPQL_MAX(),L*5),null,3));
    if(L>=12)list.push(genItem(L,Math.random()<0.5?'weapon':pick(ASLOTS),ASC,Math.random()<0.5?{wt:pick(wtAff(P.prof))}:{fam:PROF_FAM[P.prof]}));}}];
function hubInteract(p){for(const H of HUBS){const o=H.o;if(Math.hypot(p.x-o.x,p.z-o.z)>o.r+4)continue;const open=gateOpen(H.id);
  if(Math.hypot(p.x-H.vend.x,p.z-H.vend.z)<3.4)return open?{k:'hubvend',hub:H.id,label:'🛒 '+H.vn}:{k:'hublock',hub:H.id,label:'🔒 '+H.vn};
  if(Math.hypot(p.x-H.term.x,p.z-H.term.z)<3.4)return open?{k:'hubterm',hub:H.id,label:'📟 '+H.tn}:{k:'hublock',hub:H.id,label:'🔒 '+H.tn};}return null;}
function hubDo(n){const id=n.hub||'farwatch';if(n.k==='hubvend'){vendTab='buy';VEND.ctx=id;openVendor();return true;}if(n.k==='hubterm'){openTerminal();return true;}if(n.k==='hublock'){lockedMsg(id,true);return true;}return false;}
function hubStock(list,L){const H=HUBS.find(h=>h.id===VEND.ctx);if(H)H.stock(list,L);}
function vendTitle(){const H=HUBS.find(h=>h.id===VEND.ctx);return H?H.title:'MIRRA\'S SALVAGE & SUPPLY';}
/* ---------- helpers ---------- */
// a spot in the Duskcrown whose level matches lv (either side of Farwatch)
function gloamSpot(lv){const d=clamp((lv-11)/9,0,1)*180;const deg=GLOAM.hubDeg+(Math.random()<0.5?-1:1)*d+rand(-8,8);const [x,z]=gloamAt(deg,rand(455,540));return {x,z};}
// level-up hints: new Weave ranks for this level, and the way into the Duskcrown at 11
function onLevelUp(l){const nw=Object.values(WEAVES).filter(w=>w.lvl===l&&(w.prof===P.prof||w.prof==='any')&&!w.starter&&!w.excl&&!w.rare);
  if(nw.length)log('📀 New Weaves for level '+l+': <b>'+nw.map(w=>esc(w.name)).join(', ')+'</b> (Weave Disks drop from Lv '+Math.max(1,l-2)+'+ enemies and missions; Farwatch and Hoarlight sell them too)');
  if(l===11)log(gateOpen('farwatch')?'🗺 Level 11: the <b>Duskcrown Highlands</b> are your hunting ground now. Farwatch Station is the hub.':'🗺 Level 11: talk to <b>Archivist Sela Marr</b> for story chapter 2 and the road to the Duskcrown Highlands.');
  if(l===21)log(gateOpen('hoarlight')?'🗺 Level 21: the <b>Rimefall Expanse</b> is your hunting ground now. Hoarlight Hold is the hub.':'🗺 Level 21: talk to <b>Warden Kesh Odran</b> at Farwatch for story chapter 3 and the road to the Rimefall Expanse.');
  if(l===31)log('🗺 Level 31: the <b>Mirelight Fen</b> (the two west corners of the world) is your hunting ground now. <b>Lanternmoor Station</b> is the hub; The Drowned Foundry (Lv 34-38) sits in the south-west corner.');
  if(l===41)log('🗺 Level 41: the <b>Sundered Heights</b> (the two east corners) are your hunting ground now. <b>Sunderwatch</b> is the hub; The Heartforge (Lv 44-48) sits in the south-east corner.');
  if(l===MAXLVL)log('<b style="color:#ffe066">Level '+MAXLVL+': the current level cap.</b> Keep gearing: Ascendant drops, The Rift Vestibule, Paragon gear from team dungeons, Veteran Cinderdeep. The Sunless Gate in the Riftscar opens in a later update.');}
function buildBExports(){return {HUBS,vendTitle,gainXp,storyOnKill,makeEnemy,findInteract,dropLoot,genImplant,raidEntryCheck,openRaid,raidTeam,exploreLoad,bossTick,AIX,HUB,FARWATCH,hubInteract,hubDo,hubStock,gloamSpot,gloamLv,gloamAt,GLOAM,onLevelUp,ASC,rollRarityL,IMPQL_MAX,spGain,xpNeed,MAXLVL,spTotal,makeUnique,raidVetLv,VEND,FLATS};}
