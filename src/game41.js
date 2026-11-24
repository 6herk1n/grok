/* game41.js — Build V: THE VIGIL STAIR (endless tower mode).
   - A tower of short arena floors, entered from the lantern-lit tower on the east side of Halden's Rest (🗼, key U or the ⋯ menu,
     which also works from anywhere outside a dungeon when you are not in combat). Solo-first; Team companions may come along
     (enemies then scale like a team dungeon: +32% HP / +5% damage per companion).
   - Enemies are your level (MAXLVL at most) and every floor multiplies their HP (vgHpK) and damage (vgDmgK), so floors keep
     getting harder past the level cap. Normal floors: 2 waves (3 enemies, up to 5 deeper), an elite from floor 3; every 5th floor a
     Guardian (own mechanics: Stair Quake slam, Falling Lanterns from floor 10, adds at 60%/30%; landing guardians on every 10th
     floor enrage at 25%). Clearing floor 10, 20, ... unlocks a checkpoint: later runs may start at floor 11, 21, ...
     (a checkpoint start grants one random boon per 2 skipped floors).
   - Between floors: pick one of three run boons (VG_BOONS: damage, damage taken, leech, energy, Ember Ward, ...). A run ends when
     you die (no XP loss or recovery fee in the Stair) or when you leave through the portal; marks are banked as you earn them.
   - Weekly twists: the hard-mode affixes rotate with the same GAME week (hmWeek): floors 11+ add HM_A2[w%4], floors 21+ also
     HM_A1[w%2] (vgAffixes). Weekly best floor and weekly milestones (floor 10/20/30 → 2/3/5 ✦ writs, once per game week).
   - Rewards: ◈ Vigil Marks (vgMarks) for the Keeper's shop (writs, an Epic Keeper's Cache, the Vigil Wisp companion, the Vigil
     Lantern furniture); guardian loot (Rare, landings Epic + Legendary chance); achievements in the 🗼 category (Build U), with the
     titles «Stairclimber» and «of the Endless Vigil», the Vigil Banner furniture and the Stairstrider vehicle.
   - Save: P.vg={v:1,best,runs,gk,mk,mkT,ck,fast,wk:{k,best},wm:{k,m},wn} via futureFields (vgFields); old saves get the default.
   - Hooks: dmgEnemy (vgOut), dmgPlayer (vgIn, vgThorns, vgSave), playerDie (vgDie), respawnPlayer (vgLeave), dunOnKill (vgOnKill),
     updDungeon (vgTick), dunInteract (vgInteract), dunTrack (vgTrack), stage3Interact/Do (tower door, exit portal, boon pick).
   - Sims: vgSimClimb(prof-independent: drives floors with the sim bot; see sim/simV.js). */
const VG_VER=1,VG_MINLV=10;
const VG_POS={x:26,z:-9},VG_USE={x:23.2,z:-9};
const VG_BANDS=[
  {n:'Dustworks Landing',fl:0x5a4636,fl2:0x4a3a2c,wall:0x3a2c24,glow:0xffa040,fog:0x1c140e,mobs:['raider','mauler','sentry','enforcer','ashhound']},
  {n:'Glass Choir Gallery',fl:0x3c4656,fl2:0x323a48,wall:0x262c38,glow:0x9fe8ff,fog:0x10141c,mobs:['stalker','shardcaller','brute','raider']},
  {n:'Rimehall',fl:0x5a6a78,fl2:0x4a5866,wall:0x34404c,glow:0xbfe8ff,fog:0x141a22,mobs:['burrower','frostcaller','sentinel','shambler']},
  {n:'Fenlight Vault',fl:0x3a4a32,fl2:0x2f3d29,wall:0x24301e,glow:0x9fff7a,fog:0x0e140c,mobs:['mirelurk','sporecaller','bloatmaw','gloam']},
  {n:'Ember Crown',fl:0x4a2a22,fl2:0x3a201a,wall:0x2a1612,glow:0xff5a2a,fog:0x1a0a06,mobs:['cinderwraith','ashcaster','shardgolem','warder','emberadept']},
  {n:'Storm Gallery',fl:0x3a3a4a,fl2:0x2e2e3c,wall:0x22222e,glow:0xffe08a,fog:0x10101a,mobs:['coilhound','patinamancer','oxidebrute','gearpriest','galehound','tempestadept']},
  {n:'Starless Summit',fl:0x2a2436,fl2:0x221d2c,wall:0x18141f,glow:0xb46bff,fog:0x0a0810,mobs:['bonecrawler','glarecaster','voidhound','riftseer','nullwarden']}];
const VG_GUARD=[
  {n:'Gorran the Stairwarden',t:'brute',col:0xff9a2a},{n:'Ilthe, Keeper of Echoes',t:'enforcer',col:0x9fe8ff},
  {n:'The Cinder Penitent',t:'shardgolem',col:0xff5a2a},{n:'Mawrick Ironvow',t:'oxidebrute',col:0xc8a03a},
  {n:'The Lantern Hulk',t:'thunderhulk',col:0xffe08a},{n:'Sevrine of the Hollow Bell',t:'cinderguard',col:0xb46bff},
  {n:'Ossric the Unclimbed',t:'scarbehemoth',col:0x6dff8a},{n:'The Thousand-Step Mauler',t:'mauler',col:0xff4f5e}];
const VG_BOONS={
  edge:{n:'Keen Edge',ic:'⚔',d:'+10% damage',max:6,w:3},
  hide:{n:'Ironhide',ic:'🛡',d:'-8% damage taken',max:5,w:3},
  leech:{n:'Bloodthirst',ic:'🩸',d:'Heal 3% of max HP per kill',max:3,w:2},
  breath:{n:'Second Breath',ic:'💨',d:'Floor clears heal 20% more',max:3,w:1.5},
  well:{n:'Deep Well',ic:'🔷',d:'Restore 5% energy per kill',max:4,w:1.5},
  ward:{n:'Ember Ward',ic:'🔥',d:'Survive one killing blow at 30% HP (used up)',max:3,w:1.2},
  bounty:{n:'Mark Bounty',ic:'◈',d:'+20% Vigil Marks',max:3,w:1},
  giant:{n:'Giantbane',ic:'👑',d:'+20% damage to guardians and elites',max:4,w:1.5},
  exec:{n:'Executioner',ic:'🪓',d:'+25% damage to enemies below 30% HP',max:3,w:1.5},
  thorns:{n:'Thornmail',ic:'🌵',d:'Attackers take 25% of the damage they deal',max:3,w:1.2},
  mend:{n:'Rekindle',ic:'❤',d:'Heal to full and refill energy now',max:99,w:1.2}};
const VG_SIMPICK=['edge','hide','giant','leech','exec','ward','edge','hide','thorns','well','breath','bounty','mend'];
const VG_WEEKLY=[[10,2],[20,3],[30,5]];
const VG_SHOP=[
  {k:'writ',ic:'✦',n:'Writ bundle',d:'+1 ✦ writ for the mission Writ exchange',pr:25},
  {k:'cache',ic:'🎁',n:'Keeper\'s Cache',d:'A random Epic item at your level',pr:60},
  {k:'vglantern',ic:'🏮',n:'Vigil Lantern',d:'Apartment furniture (floor, +3 comfort)',pr:120,furn:1},
  {k:'vigilwisp',ic:'🕯',n:'Vigil Wisp',d:'A cosmetic companion that follows you',pr:150,cmp:1}];
/* ---------- cosmetics hooked into the Build U collections ---------- */
COMPS.vigilwisp={n:'Vigil Wisp',ic:'🕯',col:0xffd27a,fly:1,src:'Vigil Stair shop (150 ◈ Vigil Marks)',
  b:(b,c)=>{part(b,geoIco,MB(c),0,0,0,0.14,0.18,0.14);part(b,geoSphere,new THREE.MeshBasicMaterial({color:0xffe6a0,transparent:true,opacity:0.3,depthWrite:false}),0,0,0,0.3,0.36,0.3);const r=part(b,geoBox,MB(0xff9a2a),0,-0.22,0,0.36,0.02,0.02);r.userData.spin=1;}};
VEHICLES.stairstrider={name:'Stairstrider',speed:2.35,col:0x3a3a4a,trim:0x22222e,glow:0xffd27a,src:'Achievement: Storm-Treader (floor 40 of the Vigil Stair)'};
Object.assign(FURN,{
  vglantern:{n:'Vigil Lantern',ic:'🏮',k:'floor',cf:3,ach:'Vigil Stair shop (120 ◈ Vigil Marks)'},
  vgbanner:{n:'Vigil Banner',ic:'🎏',k:'wall',cf:2,ach:'Above the Dust (floor 30 of the Vigil Stair)'}});
Object.assign(FURN_B,{
  vglantern:g=>{part(g,geoBox,M(0x2a2a30),0,0.06,0,0.6,0.12,0.6);part(g,geoBox,M(0x2a2a30),0,0.8,0,0.08,1.5,0.08);part(g,geoBox,M(0x3a3a44),0,1.62,0,0.46,0.08,0.46);part(g,geoBox,MB(0xffc860),0,1.35,0,0.34,0.46,0.34);part(g,geoBox,M(0x3a3a44),0,1.08,0,0.46,0.08,0.46);},
  vgbanner:g=>{part(g,geoBox,M(0x3a3a3a),0,2.3,0,1.3,0.06,0.06);part(g,geoBox,M(0x2a2436),0,1.6,0,1.1,1.4,0.04);part(g,geoBox,MB(0xffd27a),0,1.75,0.03,0.12,0.8,0.02);part(g,geoBox,MB(0xffd27a),0,1.4,0.03,0.5,0.08,0.02);part(g,geoBox,MB(0xffd27a),0,2.05,0.03,0.3,0.08,0.02);}});
/* ---------- state ---------- */
function normVg(o){o=o&&typeof o==='object'?o:{};const ci=(v,a,b)=>Math.max(a,Math.min(b,Math.floor(+v||0)));const wk=o.wk&&typeof o.wk==='object'?o.wk:{},wm=o.wm&&typeof o.wm==='object'?o.wm:{};
  const okK=k=>typeof k==='string'&&/^g\d{1,7}$/.test(k)?k:'';
  return {v:VG_VER,best:ci(o.best,0,9999),runs:ci(o.runs,0,1e9),gk:ci(o.gk,0,1e9),mk:ci(o.mk,0,1e9),mkT:ci(o.mkT,0,1e9),ck:Math.max(1,ci(o.ck,1,9991)),fast:ci(o.fast,0,1e6),
    wk:{k:okK(wk.k),best:ci(wk.best,0,9999)},wm:{k:okK(wm.k),m:ci(wm.m,0,7)},wn:ci(o.wn,0,1e6)};}
function vgFields(s){return {vg:normVg(s.vg)};}
const vgi=()=>P.vg||(P.vg=normVg(null));
function vgWeekBest(){const v=vgi(),k=gweekKey();return v.wk.k===k?v.wk.best:0;}
function vgWeekMask(){const v=vgi(),k=gweekKey();return v.wm.k===k?v.wm.m:0;}
function vgAffixes(f,w){w=w==null?hmWeek():w;w=Math.max(0,w|0);const a=[];if(f>=11)a.push(HM_A2[w%4]);if(f>=21)a.push(HM_A1[w%2]);return a;}
function vgHpK(f){const n=Math.max(0,f-1);return 1+0.04*n+0.0004*n*n;}
function vgDmgK(f){const n=Math.max(0,f-1);return 1+0.08*n+0.008*n*n;}
function vgLv(){return clamp(P.level|0,1,MAXLVL);}
function vgMarks(f){return Math.round((2+Math.floor(f/4))*(f%10===0?3:f%5===0?2:1));}
function vgBand(f){return VG_BANDS[Math.floor((Math.max(1,f)-1)/10)%VG_BANDS.length];}
const vgRun=()=>DUN&&DUN.vg?DUN.vg:null;
/* ---------- the tower in Halden's Rest ---------- */
let VG_BEAM=null;
(function(){const y=heightAt(VG_POS.x,VG_POS.z);const g=new THREE.Group();g.position.set(VG_POS.x,y,VG_POS.z);g.rotation.y=-Math.PI/2;
  const st=0x3a3a44,tr=0x2a2436,gl=0xffd27a;
  part(g,geoBox,M(0x4a4038),0,0.15,0,5.4,0.3,5.4);part(g,geoBox,M(st),0,2.4,0,4.2,4.8,4.2);part(g,geoBox,M(tr),0,5.3,0,3.4,1.2,3.4);
  part(g,geoBox,M(st),0,7.6,0,2.8,3.6,2.8);part(g,geoBox,M(tr),0,9.8,0,2.2,0.9,2.2);part(g,geoBox,M(st),0,11.6,0,1.6,2.8,1.6);
  part(g,geoCone,M(tr),0,14.2,0,1.3,2.6,1.3);part(g,geoBox,MB(gl),0,13.1,0,1.7,0.18,1.7);part(g,geoBox,MB(gl),0,9.3,0,2.4,0.14,2.4);part(g,geoBox,MB(gl),0,4.7,0,3.6,0.16,3.6);
  part(g,geoBox,M(0x14101a),0,1.6,2.12,1.8,3.2,0.08);part(g,geoBox,MB(gl),0,3.35,2.14,2.2,0.18,0.06);part(g,geoBox,MB(0xff9a2a),-1.25,2.2,2.2,0.12,0.5,0.12);part(g,geoBox,MB(0xff9a2a),1.25,2.2,2.2,0.12,0.5,0.12);
  for(const s of [-1,1])for(const z of [-1,1])part(g,geoBox,MB(gl),s*2.12,6.2+z*0.6,s*z*0.5,0.06,0.5,0.3);
  scene.add(g);boxes.push({x0:VG_POS.x-2.2,x1:VG_POS.x+2.2,z0:VG_POS.z-2.2,z1:VG_POS.z+2.2,y0:y,y1:y+12});
  VG_BEAM=makeBeam(0xffd27a,36,0.35,0.16);VG_BEAM.position.set(VG_POS.x,y+14,VG_POS.z);})();
function vgWorldInteract(p){if(DUN)return null;return Math.hypot(p.x-VG_USE.x,p.z-VG_USE.z)<2.8?{k:'vgdoor',label:'🗼 The Vigil Stair'}:null;}
/* ---------- arena ---------- */
function vgBuild(d){const G=d.group;const B=vgBand(d.vg.f);const mt={fl:new THREE.MeshLambertMaterial({color:B.fl,flatShading:true}),fl2:new THREE.MeshLambertMaterial({color:B.fl2,flatShading:true}),
    wall:new THREE.MeshLambertMaterial({color:B.wall,flatShading:true}),glow:new THREE.MeshBasicMaterial({color:B.glow}),glowT:new THREE.MeshBasicMaterial({color:B.glow,transparent:true,opacity:0.45,side:THREE.DoubleSide,depthWrite:false})};d.vgM=mt;
  part(G,geoBox,mt.fl,0,-0.25,0,32,0.5,32);for(let i=-12;i<=12;i+=6){part(G,geoBox,mt.fl2,i,0.004,0,0.12,0.01,30);part(G,geoBox,mt.fl2,0,0.004,i,30,0.01,0.12);}
  const wall=(x,z,sx,sz,h)=>{part(G,geoBox,mt.wall,x,h/2,z,sx,h,sz);d.boxesAdd.push({x0:x-sx/2,x1:x+sx/2,z0:z-sz/2,z1:z+sz/2,y0:0,y1:Math.min(h,2.2)});};
  wall(0,-16,33,1,2.6);wall(0,16,33,1,1.2);wall(-16,0,1,33,2.6);wall(16,0,1,33,2.6);
  for(const sx of [-1,1])for(const sz of [-1,1]){wall(sx*13,sz*13,1.6,1.6,6);part(G,geoBox,mt.glow,sx*13,6.2,sz*13,1.0,0.35,1.0);}
  for(let i=0;i<10;i++){const a=i/10*6.283,r=26;part(G,geoBox,mt.wall,Math.cos(a)*r,9,Math.sin(a)*r,3,18,3);part(G,geoBox,mt.glow,Math.cos(a)*r,13+(i%3)*2,Math.sin(a)*r,3.1,0.25,3.1);}
  const ring=new THREE.Mesh(new THREE.RingGeometry(4.2,4.8,40),mt.glowT);ring.rotation.x=-Math.PI/2;ring.position.y=0.03;G.add(ring);d.vgRing=ring;
  const ring2=new THREE.Mesh(new THREE.RingGeometry(1.2,1.5,24),mt.glowT);ring2.rotation.x=-Math.PI/2;ring2.position.set(0,0.03,11);G.add(ring2);
  boxes.push(...d.boxesAdd);
  G.add(new THREE.HemisphereLight(0xfff0e0,0x302820,0.95));const dl=new THREE.DirectionalLight(0xffffff,0.3);dl.position.set(20,40,10);G.add(dl);
  d.plight=new THREE.PointLight(B.glow,1.1,24,1.6);G.add(d.plight);const cl=new THREE.PointLight(B.glow,1.2,40,1.4);cl.position.set(0,7,0);G.add(cl);d.vgCl=cl;
  addPortal(d,-11.5,12.5,'Leave the Vigil Stair');d.vgBandI=VG_BANDS.indexOf(B);}
function vgRecolor(d){const B=vgBand(d.vg.f),i=VG_BANDS.indexOf(B);if(i===d.vgBandI||!d.vgM)return;d.vgBandI=i;const m=d.vgM;m.fl.color.set(B.fl);m.fl2.color.set(B.fl2);m.wall.color.set(B.wall);m.glow.color.set(B.glow);m.glowT.color.set(B.glow);
  d.plight.color.set(B.glow);d.vgCl.color.set(B.glow);scene.fog=new THREE.Fog(B.fog,30,95);scene.background=new THREE.Color(B.fog);}
/* ---------- entering / leaving ---------- */
function vgCanEnter(start){if(state!=='play')return 'Not in play';if(DUN)return DUN.vg?'You are already in the Vigil Stair':'Leave '+DUN.D.name+' first';if(P.dead)return 'You are dead';
  if(P.level<VG_MINLV)return 'The Vigil Stair opens at level '+VG_MINLV;if(inCombat())return 'You can\'t enter the Stair in combat';if(start>1&&(start-1)%10!==0)return 'Bad checkpoint';if(start>vgi().ck)return 'Clear floor '+(start-1)+' to unlock that checkpoint';return '';}
function vgEnter(start){start=Math.max(1,start|0||1);const why=vgCanEnter(start);if(why){warn(why);return false;}
  closePanel();if(P.mount)dismount();cancelCast();P.target=null;P.autoAtk=false;for(const p of projs)scene.remove(p.m);projs.length=0;for(const r of rings)scene.remove(r.m);rings.length=0;clearFx();
  const hidden=[];const keep=new Set([PM.g,pShadow]);for(const a of allies){keep.add(a.R.g);keep.add(a.shadow);}for(const o of scene.children)if(o.visible&&!keep.has(o)){o.visible=false;hidden.push(o);}
  const near=Math.hypot(P.pos.x-VG_USE.x,P.pos.z-VG_USE.z)<8;
  const d=DUN={id:'vigil',D:{id:'vigil',name:'The Vigil Stair',sub:'Endless tower',cap:9999,lvl:[VG_MINLV,MAXLVL],rooms:[]},mode:{},party:[],ret:near?{x:VG_USE.x-1.5,z:VG_USE.z}:{x:P.pos.x,z:P.pos.z},hidden,
    worldEnemies:enemies.splice(0),worldLoots:loots.splice(0),saved:{c:circles.splice(0),b:boxes.splice(0),o:camOcc.splice(0)},fog0:scene.fog,bg0:scene.background,group:new THREE.Group(),rects:[[-15.5,-15.5,31,31]],portals:[],bosses:[],tele:[],cleared:false,t0:T,boxesAdd:[]};
  d.vg={f:start,start,phase:'count',t:T+2.6,wave:0,waves:0,boons:{},ward:0,marks:0,kills:0,t0:T,gd:null,offers:null,auto:!!SIMP,over:false,kit:[]};
  FLAT=true;scene.add(d.group);vgBuild(d);{const B=vgBand(start);scene.fog=new THREE.Fog(B.fog,30,95);scene.background=new THREE.Color(B.fog);}
  d.entry={x:0,z:11};P.pos.set(0,0,11);P.rotY=Math.PI;camS.yaw=0;camS.pitch=0.7;camS.dist=12;camS.cur=null;for(const a of allies){a.pos.set(1.6,0,11.6);a.target=null;}
  if(start>1){const n=Math.floor((start-1)/2);for(let i=0;i<n;i++){const o=vgRoll(1)[0];if(o){vgApply(o,true);d.vg.kit.push(o);}}}
  const v=vgi();v.runs++;const af=vgAffixes(Math.max(start,11));
  banner('🗼 THE VIGIL STAIR','Floor '+start+(start>1?' · checkpoint start':'')+' · a run ends when you fall');
  log('🗼 Entered <b style="color:#ffd27a">the Vigil Stair</b> at floor <b>'+start+'</b>. Every 5th floor a Guardian, every 10th a landing (checkpoint). Pick a boon after each floor. This week from floor 11: '+af.map(a=>HM_AFF[a].ic+' <b>'+HM_AFF[a].n+'</b>').join(', ')+'.'+(d.vg.kit.length?' Checkpoint boons: '+vgBoonList(d.vg.boons)+'.':''));
  SFX.quest();save();return true;}
function vgLeave(dead){const R=vgRun();if(!R)return false;R.over=true;const cl=Math.max(0,(R.phase==='pick'?R.f:R.f-1)-(R.start-1));
  if(P.dead){P.dead=false;P.hp=S.maxHp;P.en=S.maxEn;$('#death').classList.add('hidden');}
  exitDungeon(true);closePanel();const v=vgi();
  banner('THE REACH','Left the Vigil Stair · best floor '+v.best);log('🗼 Run over: <b>'+cl+'</b> floor'+(cl===1?'':'s')+' cleared, <b>+'+R.marks+' ◈</b> Vigil Marks ('+v.mk+' ◈ to spend). Personal best: floor <b>'+v.best+'</b> · this week: <b>'+vgWeekBest()+'</b>.');
  SFX.ui();save();return true;}
function vgDie(){const R=vgRun();if(!R)return;R.over=true;R.phase='over';P.dead=true;P.autoAtk=false;P.target=null;SFX.death();for(const e of enemies)if(e.state==='chase')e.state='return';clearTele();
  const v=vgi();$('#deathTxt').textContent='The Vigil Stair claims you on floor '+R.f+'. This run: '+Math.max(0,R.f-R.start)+' floors cleared, +'+R.marks+' ◈ Vigil Marks (kept). Personal best: floor '+v.best+'. Nothing else is lost: no XP loss or recovery fee in the Stair.';
  $('#bRespawn').textContent='Leave the Vigil Stair';log('💀 The Vigil Stair claims you on floor <b>'+R.f+'</b>.');
  if(!SIMP)setTimeout(()=>{if(P.dead)$('#death').classList.remove('hidden');},1200);}
/* ---------- floors ---------- */
function vgParty(){return allies.filter(a=>a.comp&&!a.dead).length;}
// 2026-11-24 (Claude): floor-21 cliff fix. Each band's mob HP is scaled down to the first two bands' average base HP (never up),
// and the floor elite is never a warding type (Frostward Sentinel / Riftwarder: a x3 HP elite shielding the whole floor at -60%)
// or a splitting one (Glacier Shambler etc.: the band's heaviest body, x3, then shardlings). From floor 21 a wave has 5 mobs
// instead of 4: each gets 4/5 of the HP and damage so the wave's totals stay the same (more bodies, not a bigger wave).
let VG_HPN=null;
function vgBandHpK(B){if(!VG_HPN){const av=b=>{const h=b.mobs.map(k=>ETYPES[k]&&ETYPES[k].hp).filter(Boolean);return h.length?h.reduce((x,y)=>x+y,0)/h.length:1;};
  const ref=(av(VG_BANDS[0])+av(VG_BANDS[1]))/2;VG_HPN=VG_BANDS.map(b=>Math.min(1,ref/av(b)));}return VG_HPN[VG_BANDS.indexOf(B)]||1;}
function vgCount(f){return Math.min(5,3+Math.floor((Math.max(1,f)-1)/10));}
function vgEliteType(B,f){for(let i=1;i<=B.mobs.length;i++){const t=B.mobs[(f+i)%B.mobs.length];if(!ETYPES[t]||ETYPES[t].ai!=='ward'&&ETYPES[t].ai!=='split')return t;}return B.mobs[(f+1)%B.mobs.length];}
function vgMob(t,x,z,o){o=o||{};const R=vgRun(),f=R.f,lv=vgLv();const e=o.elite?makeElite(t,x,z,lv,o.name,o.col,o.eo):makeEnemy(t,x,z,lv,true);e.dun=true;e.vg=1;e.T=Object.assign({},e.T);
  const n=vgParty(),af=vgAffixes(f);let hk=vgHpK(f)*(1+0.32*n),dk=vgDmgK(f)*(1+0.05*n);
  if(o.guard){if(af.includes('warlord')){hk*=1.15;dk*=1.1;}}else{const nk=Math.min(1,4/vgCount(f));hk*=vgBandHpK(vgBand(f))*nk;dk*=nk;if(af.includes('bulwark'))hk*=1.25;}
  e.maxHp=e.hp=Math.max(1,Math.round(e.maxHp*hk));e.dmg*=dk;e.baseVgDmg=e.dmg;e.leash=90;e.wr=1.5;e.home.set(x,0,z);
  ringFx(x,z,vgBand(f).glow,2.2,0.5);aggro(e);return e;}
function vgSpot(i,n){const a=-Math.PI/2+((i+0.5)/n-0.5)*2.6;const r=10.5+(i%2)*1.5;return [Math.cos(a)*r,-1+Math.sin(a)*r];}
function vgBegin(){const R=vgRun();R.phase='fight';R.wave=0;R.ft0=T;const f=R.f,boss=f%5===0;R.waves=boss?1:2;R.gd=null;vgRecolor(DUN);
  const af=vgAffixes(f);banner('FLOOR '+f,(boss?(f%10===0?'Landing Guardian':'Guardian')+' · ':'')+vgBand(f).n+(af.length?' · '+af.map(a=>HM_AFF[a].ic+' '+HM_AFF[a].n).join(' · '):''));SFX.quest();vgWave();}
function vgWave(){const R=vgRun(),f=R.f,B=vgBand(f);R.wave++;
  if(f%5===0){const G=VG_GUARD[(Math.floor(f/5)-1)%VG_GUARD.length],big=f%10===0;
    const e=vgMob(G.t,0,-6,{elite:1,guard:1,name:'🗼 '+G.n,col:G.col,eo:{hp:big?6:4.5,dmg:1.5,scale:1.75,glow:G.col,xp:6}});
    e.vgG={big,slam:T+5,pools:T+8,brim:T+10,adds:{},enr:false};R.gd=e;
    if(f>=10)for(let i=0;i<2;i++){const s=vgSpot(i*3,4);vgMob(B.mobs[i%B.mobs.length],s[0],s[1]);}
    banner(G.n.toUpperCase(),big?'Landing Guardian of floor '+f:'Guardian of floor '+f);return;}
  const n=vgCount(f);for(let i=0;i<n;i++){const s=vgSpot(i,n);vgMob(B.mobs[(i+R.wave+f)%B.mobs.length],s[0],s[1]);}
  if(R.wave===R.waves&&f>=3){const t=vgEliteType(B,f);vgMob(t,0,-8,{elite:1,name:'Stairbound '+(ETYPES[t]?ETYPES[t].name:'Elite'),col:B.glow,eo:{hp:3,dmg:1.25,scale:1.35,xp:3}});}
  if(R.wave>1)toast('🗼 Wave '+R.wave+'/'+R.waves);}
function vgGuardTick(){const R=vgRun(),e=R&&R.gd;if(!e||e.dead||!e.vgG)return;const g=e.vgG;if(e.state!=='chase'&&!P.dead)aggro(e);const f=R.f,hpF=e.hp/e.maxHp;
  if(T>=g.slam&&T>=(e.stunUntil||0)){g.slam=T+9;e.rootUntil=T+1.7;telegraph(e,e.pos.x,e.pos.z,4.2,1.7,e.dmg*2.2,'Stair Quake');toast('⚠ Stair Quake: get out of the circle!');tone(220,0.5,'sawtooth',0.05,300);}
  if((f>=10||g.big)&&T>=g.pools){g.pools=T+13;for(const tg of dunTargets()){telegraph(e,tg.pos.x,tg.pos.z,2.6,1.8,e.dmg*1.5,'Falling Lanterns');const a=rand(0,6.28);telegraph(e,tg.pos.x+Math.cos(a)*4,tg.pos.z+Math.sin(a)*4,2.6,2.0,e.dmg*1.5,'Falling Lanterns');}toast('⚠ Falling Lanterns: move!');}
  for(const th of [0.6,0.3])if(!g.adds[th]&&hpF<=th){g.adds[th]=1;const B=vgBand(f);for(let i=0;i<2;i++){const s=vgSpot(i?3:0,4);const a=vgMob(B.mobs[(i+3)%B.mobs.length],s[0],s[1]);a.addOf=e;}toast('⚠ The Guardian calls the Stair\'s wardens!');}
  if(g.big&&!g.enr&&hpF<=0.25){g.enr=true;e.enraged=true;e.dmg*=1.3;e.T=Object.assign({},e.T,{atkCd:e.T.atkCd*0.8});banner(e.T.name.replace(/^🗼 /,'').toUpperCase()+' ENRAGED','The landing shakes');ringFx(e.pos.x,e.pos.z,0xff2a1a,6,0.8);SFX.boom();}
  if(vgAffixes(f).includes('brim')&&T>=g.brim){g.brim=T+10;for(const tg of dunTargets())telegraph(e,tg.pos.x,tg.pos.z,3,1.6,e.dmg*1.2,'Brimstone');}}
function vgAff(){const R=vgRun();if(!vgAffixes(R.f).includes('frenzy'))return;for(const e of enemies){if(!e.vg||e.dead||e.vgFz)continue;if(e.hp<e.maxHp*0.3){e.vgFz=1;e.dmg*=1.2;ringFx(e.pos.x,e.pos.z,0xff3b2f,1.6,0.4);}}}
function vgTick(dt){const d=DUN,R=d.vg;if(!R)return;if(d.vgRing){d.vgRing.rotation.z+=dt*0.4;d.vgM.glowT.opacity=0.35+Math.sin(T*2.2)*0.12;}if(R.over)return;
  if(R.phase==='count'){if(T>=R.t)vgBegin();return;}
  if(R.phase!=='fight')return;vgAff();vgGuardTick();
  for(const e of enemies)if(e.vg&&!e.dead&&(Math.abs(e.pos.x)>17||Math.abs(e.pos.z)>17)){e.pos.set(0,0,-4);e.home.set(0,0,-4);}
  if(enemies.some(e=>!e.dead))return;
  if(R.wave<R.waves){if(!R.wt)R.wt=T+1.2;else if(T>=R.wt){R.wt=0;vgWave();}return;}
  vgClear();}
function vgClear(){const R=vgRun(),f=R.f,v=vgi(),b=R.boons;R.phase='pick';clearTele();
  let m=vgMarks(f);m=Math.round(m*(1+0.2*(b.bounty|0)));R.marks+=m;v.mk+=m;v.mkT+=m;
  if(f>v.best)v.best=f;const wk=gweekKey();if(v.wk.k!==wk)v.wk={k:wk,best:0};if(f>v.wk.best)v.wk.best=f;
  if(f%10===0&&f+1>v.ck)v.ck=f+1;
  if(R.start===1&&f===10){const s=Math.round(T-R.t0);if(!v.fast||s<v.fast)v.fast=s;}
  let wtxt='';{if(v.wm.k!==wk)v.wm={k:wk,m:0};VG_WEEKLY.forEach(([fl,w],i)=>{if(f>=fl&&!(v.wm.m&(1<<i))){const first=!v.wm.m;v.wm.m|=1<<i;if(first)v.wn++;const r=rmi();r.writs=(r.writs|0)+w;wtxt+=' · weekly floor '+fl+': +'+w+' ✦ writs';}});}
  if(f%5===0){v.gk++;const lv=vgLv(),big=f%10===0;const it=genItem(lv,null,big?(Math.random()<0.1+Math.min(0.3,f/200)?4:3):2);it.dropBy='Vigil Stair floor '+f;dropLoot(0,-3,it);P.credits+=30*lv;}
  const hk=0.25+0.2*(b.breath|0);P.hp=Math.min(S.maxHp,P.hp+S.maxHp*hk);P.en=Math.min(S.maxEn,P.en+S.maxEn*0.5);
  ringFx(0,0,vgBand(f).glow,6,1);SFX.level();
  banner('FLOOR '+f+' CLEARED','+'+m+' ◈ Vigil Marks'+(f%10===0?' · checkpoint: floor '+(f+1):'')+' · choose a boon');
  log('🗼 Floor <b>'+f+'</b> cleared in '+Math.round(T-R.ft0)+'s: <b>+'+m+' ◈</b>'+(f%10===0?' · 🏁 checkpoint unlocked: start at floor <b>'+(f+1)+'</b>':'')+(f%5===0?' · guardian loot dropped':'')+wtxt+'.');
  R.offers=vgRoll(3);if(R.auto){vgPick(vgAutoPick(R.offers));return;}
  setTimeout(()=>{const r=vgRun();if(r&&r.phase==='pick'&&!P.dead&&!panelOpen)openVg('pick');},900);save();}
function vgRoll(n){const R=vgRun();const pool=Object.keys(VG_BOONS).filter(k=>(R.boons[k]|0)<VG_BOONS[k].max&&!(k==='mend'&&P.hp>=S.maxHp*0.95&&n>1));const out=[];
  while(out.length<n&&pool.length){let tot=0;for(const k of pool)tot+=VG_BOONS[k].w;let r=Math.random()*tot,i=0;for(;i<pool.length-1;i++){r-=VG_BOONS[pool[i]].w;if(r<=0)break;}out.push(pool[i]);pool.splice(i,1);}if(!out.length)out.push('mend');return out;}
function vgAutoPick(of){for(const k of VG_SIMPICK)if(of.includes(k))return k;return of[0];}
function vgApply(k,silent){const R=vgRun();if(!R||!VG_BOONS[k])return false;if(k==='mend'){P.hp=S.maxHp;P.en=S.maxEn;}else R.boons[k]=(R.boons[k]|0)+1;if(k==='ward')R.ward++;
  if(!silent)log('🗼 Boon: <b>'+VG_BOONS[k].ic+' '+VG_BOONS[k].n+'</b> ('+VG_BOONS[k].d+').');return true;}
function vgPick(k){const R=vgRun();if(!R||R.phase!=='pick'||!R.offers||!R.offers.includes(k))return false;vgApply(k);R.offers=null;R.f++;R.phase='count';R.t=T+(R.auto?0.5:2.2);
  if(panelOpen==='vg')closePanel();banner('FLOOR '+R.f,'Get ready…');save();return true;}
function vgBoonList(b){const L=Object.keys(b).filter(k=>b[k]>0).map(k=>VG_BOONS[k].ic+' '+VG_BOONS[k].n+(b[k]>1?' ×'+b[k]:''));return L.length?L.join(', '):'none yet';}
/* ---------- combat hooks ---------- */
function vgOut(e){const R=vgRun();if(!R)return 1;const b=R.boons;let k=1+0.1*(b.edge|0);if(e&&(e.elite||e.vgG))k*=1+0.2*(b.giant|0);if(e&&e.hp<e.maxHp*0.3)k*=1+0.25*(b.exec|0);return k;}
function vgIn(){const R=vgRun();return R?Math.pow(0.92,R.boons.hide|0):1;}
function vgThorns(a,src){const R=vgRun();if(!R||!(R.boons.thorns|0)||!src||!src.vg||src.dead)return;src.hp-=Math.max(1,Math.round(a*0.25*R.boons.thorns));if(src.hp<=0)killEnemy(src);}
function vgSave(){const R=vgRun();if(!R||R.over||R.ward<=0)return false;R.ward--;R.boons.ward=Math.max(0,(R.boons.ward|0)-1);P.hp=Math.round(S.maxHp*0.3);ringFx(P.pos.x,P.pos.z,0xff7a2a,4,0.8);banner('🔥 EMBER WARD','You refuse to fall'+(R.ward?' · '+R.ward+' left':''));SFX.heal();return true;}
function vgOnKill(e){const R=vgRun();if(!R)return;R.kills++;const b=R.boons;
  if(b.leech)P.hp=Math.min(S.maxHp,P.hp+S.maxHp*0.03*b.leech);if(b.well)P.en=Math.min(S.maxEn,P.en+S.maxEn*0.05*b.well);
  const af=vgAffixes(R.f);if(!e.vgG){if(af.includes('volatile'))telegraph(e,e.pos.x,e.pos.z,2.5,1.8,(e.baseVgDmg||e.dmg)*1.5,'Volatile');
    if(af.includes('rally'))for(const a of enemies)if(a!==e&&!a.dead&&a.vg&&!a.vgG&&Math.hypot(a.pos.x-e.pos.x,a.pos.z-e.pos.z)<12&&(a.rally|0)<3){a.rally=(a.rally|0)+1;a.dmg*=1.1;ringFx(a.pos.x,a.pos.z,0xffb03a,1.6,0.4);}}
  if(e===R.gd){clearTele(e);for(const a of enemies)if(a.addOf===e&&!a.dead){a.dead=true;a.R.g.visible=false;a.shadow.visible=false;setTimeout(()=>removeEnemy(a),50);}banner(e.T.name.replace(/^🗼 /,'').toUpperCase()+' DEFEATED','Floor '+R.f+' is yours');}}
/* ---------- interaction / HUD ---------- */
function vgInteract(p){const d=DUN,R=d.vg;for(const q of d.portals)if(Math.hypot(p.x-q.x,p.z-q.z)<3.0)return {k:'vgexit',label:'🌀 Leave the Vigil Stair'};
  if(R&&R.phase==='pick'&&!lootInteract(p))return {k:'vgpick',label:'🗼 Choose a boon'};return null;}
function vgDo(n){const k=n.k;if(k==='vgdoor'){openVg('climb');return true;}if(k==='vgpick'){openVg('pick');return true;}if(k==='vgexit'){const R=vgRun();if(R&&R.phase==='fight'&&enemies.some(e=>!e.dead&&e.state==='chase')){warn('Finish the floor (or fall) before you leave');return true;}vgLeave(false);return true;}return false;}
function vgTrack(){const R=vgRun();if(!R)return '';const af=vgAffixes(R.f);const live=enemies.filter(e=>!e.dead).length;
  const st=R.phase==='count'?'get ready…':R.phase==='pick'?'<span style="color:#6dff8a">cleared · choose a boon</span>':R.phase==='over'?'run over':(R.gd&&!R.gd.dead?'Guardian '+Math.round(R.gd.hp/R.gd.maxHp*100)+'%':'wave '+R.wave+'/'+R.waves+' · '+live+' left');
  return '<b>🗼 Vigil Stair · Floor '+R.f+'</b>'+(af.length?' '+af.map(a=>HM_AFF[a].ic).join(''):'')+'<br>'+st+' · ◈ '+R.marks+(R.ward?' · 🔥'+R.ward:'');}
/* ---------- panel ---------- */
const VGP={tab:'climb'};
function openVg(tab){if(tab)VGP.tab=tab;const v=vgi(),R=vgRun();let t=VGP.tab;if(t==='pick'&&!(R&&R.phase==='pick'))t=VGP.tab=R?'run':'climb';if(t==='run'&&!R)t=VGP.tab='climb';
  const bs='min-height:44px;min-width:44px;margin:3px;padding:6px 10px';const wk=vgWeekBest(),wm=vgWeekMask();
  let h=`<div class="craftbar"><span class="cbi">🗼</span><span class="cbn"><b>The Vigil Stair</b><small>◈ ${v.mk} Vigil Marks · best floor ${v.best} · this week ${wk} · ${rmi().writs|0} ✦ writs</small></span></div>`;
  const tabs=[['climb','🗼 Climb'],['shop','◈ Keeper\'s shop'],['boons','✨ Boons']];if(R)tabs.unshift(['run',R.phase==='pick'?'🎁 Choose a boon':'⏱ This run']);
  h+=`<div class="tabs">${tabs.map(([k,n])=>`<button data-act="vgtab" data-t="${k==='run'&&R&&R.phase==='pick'?'pick':k}" class="${(t===k||(k==='run'&&t==='pick'))?'on':''}" style="min-height:44px">${n}</button>`).join('')}</div>`;
  const w=hmWeek(),a2=HM_AFF[HM_A2[w%4]],a1=HM_AFF[HM_A1[w%2]];
  if(t==='pick'){h+=`<div style="margin:6px 0">Floor <b>${R.f}</b> cleared. Choose one boon for the rest of this run:</div><div style="display:flex;flex-wrap:wrap;gap:6px">`+
      R.offers.map(k=>{const B=VG_BOONS[k];return `<button class="sbtn" data-act="vgpick" data-k="${k}" style="${bs};flex:1 1 150px;min-height:96px;background:#241c16;color:#f0e6d0;text-align:left"><div style="font-size:24px">${B.ic}</div><b>${esc(B.n)}</b>${R.boons[k]?' <small>(have '+R.boons[k]+')</small>':''}<div style="font-size:12px;opacity:.85">${esc(B.d)}</div></button>`;}).join('')+`</div>`+
      `<div style="margin-top:8px;font-size:13px;opacity:.85">Next: floor ${R.f+1}${(R.f+1)%5===0?' · ⚔ Guardian':''} · enemies ×${vgHpK(R.f+1).toFixed(2)} HP, ×${vgDmgK(R.f+1).toFixed(2)} damage. Your boons: ${vgBoonList(R.boons)}.</div>`+
      `<button class="sbtn" data-act="vgleave" style="${bs};margin-top:8px;background:#3a1c16;color:#ffd6c8">🌀 Leave with my marks (+${R.marks} ◈ this run)</button>`;}
  else if(t==='run'){h+=`<div class="mis"><b>Floor ${R.f}</b> · ${esc(vgBand(R.f).n)} · run started at floor ${R.start}<br>This run: ◈ ${R.marks} · ${R.kills} kills · ${Math.round((T-R.t0)/60)} min${R.ward?' · 🔥 Ember Ward ×'+R.ward:''}<br>Boons: ${vgBoonList(R.boons)}</div>
      <div style="font-size:13px;opacity:.85">Enemies on this floor: ×${vgHpK(R.f).toFixed(2)} HP, ×${vgDmgK(R.f).toFixed(2)} damage${vgAffixes(R.f).length?' · '+vgAffixes(R.f).map(a=>HM_AFF[a].ic+' '+HM_AFF[a].n).join(', '):''}. Leave through the portal at the entrance between floors, or keep climbing.</div>`;}
  else if(t==='climb'){const ok=vgCanEnter(1);
    h+=`<div style="display:flex;flex-wrap:wrap">`;for(let s=1;s<=v.ck;s+=10)h+=`<button class="sbtn" data-act="vgstart" data-f="${s}" style="${bs};background:${s===1?'#2c4a24':'#24364a'};color:#fff">${s===1?'▶ Start at floor 1':'🏁 Checkpoint: floor '+s}</button>`;h+=`</div>`;
    if(ok)h+=`<div class="down" style="margin:2px 0 4px">${esc(ok)}</div>`;
    h+=`<p style="margin:6px 0">Short arena floors that never end. Every <b>5th</b> floor a Guardian, every <b>10th</b> a landing that unlocks a checkpoint. After each floor pick one of three boons. A run ends when you fall (no XP loss or fee) or leave; ◈ Vigil Marks are kept as you earn them.</p>`;
    h+=`<div class="mis">This week (game week ${w+1}): floors 11+ ${a2.ic} <b>${a2.n}</b> (${esc(a2.d)}) · floors 21+ also ${a1.ic} <b>${a1.n}</b> (${esc(a1.d)})<br>Weekly milestones: ${VG_WEEKLY.map(([f,n],i)=>(wm&(1<<i)?'✅':'⬜')+' floor '+f+' → '+n+' ✦').join(' · ')}</div>`;
    h+=`<div style="font-size:13px;opacity:.85;margin-top:6px">Records: best floor <b>${v.best}</b> · runs ${v.runs} · guardians ${v.gk} · marks earned ${v.mkT}${v.fast?' · fastest floor 1→10: '+Math.floor(v.fast/60)+':'+String(v.fast%60).padStart(2,'0'):''}</div>`;}
  else if(t==='shop'){h+=`<div style="font-size:13px;opacity:.85;margin:4px 0">Spend ◈ Vigil Marks (you have <b>${v.mk}</b>). Furniture goes to your apartment storage.</div><div style="display:flex;flex-wrap:wrap;gap:6px">`+
      VG_SHOP.map(it=>{const own=it.cmp?!!colli().cmp[it.k]:it.furn?!!(aptLoad().own[it.k]|0):false;const can=v.mk>=it.pr&&!(it.cmp&&own);
        return `<button class="sbtn" data-act="vgbuy" data-k="${it.k}" style="${bs};flex:1 1 150px;text-align:left;background:${can?'#241c16':'#1a1612'};color:${can?'#f0e6d0':'#8a8070'}"><div style="font-size:22px">${it.ic}</div><b>${esc(it.n)}</b> · ◈ ${it.pr}${own?' <small>(owned)</small>':''}<div style="font-size:12px;opacity:.85">${esc(it.d)}</div></button>`;}).join('')+`</div>`;}
  else if(t==='boons'){h+=`<div style="font-size:13px;opacity:.85;margin:4px 0">After each floor you choose one of three. They last for the run.</div><div style="display:flex;flex-wrap:wrap">`+Object.values(VG_BOONS).map(B=>`<div class="mis" style="flex:1 1 150px;margin:3px">${B.ic} <b>${esc(B.n)}</b><br><small>${esc(B.d)}${B.max<99?' · up to ×'+B.max:''}</small></div>`).join('')+`</div>`;}
  openPanel('🗼 The Vigil Stair',h,'vg');}
function vgBuy(k){const it=VG_SHOP.find(x=>x.k===k),v=vgi();if(!it)return false;if(v.mk<it.pr){warn('Need '+it.pr+' ◈ Vigil Marks');return false;}
  if(k==='writ'){const r=rmi();r.writs=(r.writs|0)+1;}
  else if(k==='cache'){const i=genItem(vgLv(),null,3);i.dropBy='Keeper\'s Cache';if(!invAdd(i)){warn('Your pack is full');return false;}log('🎁 Keeper\'s Cache: <b style="color:'+RAR[i.r].c+'">'+esc(i.name)+'</b>.');}
  else if(it.cmp){if(colli().cmp[k]){warn('Already owned');return false;}colli().cmp[k]=1;log('🕯 New companion: <b>'+COMPS[k].n+'</b>. Summon it from 🏅 Achievements → Pets.');}
  else if(it.furn)aptGain(k,'buy');
  v.mk-=it.pr;SFX.coin();toast('◈ '+it.n+' bought');save();return true;}
function vgAct(a,b){const D=b.dataset;if(a==='vgtab'){openVg(D.t);return true;}if(a==='vgstart'){vgEnter(+D.f);return true;}if(a==='vgpick'){vgPick(D.k);return true;}
  if(a==='vgleave'){vgLeave(false);return true;}if(a==='vgbuy'){vgBuy(D.k);openVg('shop');return true;}return false;}
function vgToggle(){if(panelOpen==='vg'){closePanel();return;}openVg(vgRun()?(vgRun().phase==='pick'?'pick':'run'):'climb');}
/* ---------- achievements (Build U category) ---------- */
ACH_CATS.push(['vg','🗼','The Vigil Stair']);
(function(){const n0=ACH.length;const bf=()=>vgi().best;
  A_('vg','vg1','First Landing','Clear floor 1 of the Vigil Stair',5,bf,1);A_('vg','vg5','Stairwalker','Clear floor 5 of the Vigil Stair',10,bf,5);
  A_('vg','vg10','Tenth Landing','Clear floor 10 of the Vigil Stair',10,bf,10,{writs:2});A_('vg','vg20','Stairclimber','Clear floor 20 of the Vigil Stair',15,bf,20,{title:'Stairclimber'});
  A_('vg','vg30','Above the Dust','Clear floor 30 of the Vigil Stair',20,bf,30,{furn:'vgbanner'});A_('vg','vg40','Storm-Treader','Clear floor 40 of the Vigil Stair',25,bf,40,{veh:'stairstrider'});
  A_('vg','vg50','Endless Vigil','Clear floor 50 of the Vigil Stair',30,bf,50,{title:'of the Endless Vigil'});
  A_('vg','vgg10','Guardian Breaker','Defeat 10 Vigil Stair guardians',10,()=>vgi().gk,10);A_('vg','vgg50','Wardenbane','Defeat 50 Vigil Stair guardians',20,()=>vgi().gk,50);
  A_('vg','vgfast','Swift Ascent','Climb from floor 1 through floor 10 in one run within 10 minutes',15,()=>vgi().fast>0&&vgi().fast<=600?1:0,1);
  A_('vg','vgmk','Mark Hoarder','Earn 1,000 Vigil Marks',10,()=>vgi().mkT,1000);A_('vg','vgwk','Keeper of the Vigil','Reach a weekly milestone in 4 different weeks',15,()=>vgi().wn,4);
  for(const A of ACH.slice(n0)){ACHI[A.id]=A;if(A.rw&&A.rw.title&&!ACH_TITLES.includes(A.rw.title))ACH_TITLES.push(A.rw.title);}})();
/* ---------- sims ---------- */
// climb with the sim bot from floor `start` until death or `maxF`; returns per-floor times and the floor reached
function vgSimClimb(start,maxF,maxT){if(!vgEnter(start||1))return {err:'enter failed: '+vgCanEnter(start||1)};const R=vgRun();R.auto=true;const rows=[];maxT=maxT||300;
  const idle=sec=>{SIMP=true;try{let t=0;while(t<sec&&!P.dead&&!R.over){simStep(0.05);t+=0.05;if(R.phase!=='fight'||enemies.some(e=>!e.dead))break;}}finally{SIMP=false;}};
  let res='max';while(R.f<=(maxF||60)){if(R.phase==='count'){R.t=T;vgTick(0);}const f=R.f,hp0=P.hp/S.maxHp,ft0=T;let taken=0;
    while(R.phase==='fight'&&!R.over&&!P.dead&&T-ft0<maxT){const live=enemies.filter(e=>!e.dead);if(!live.length){idle(3);continue;}
      const tg=R.gd&&!R.gd.dead?R.gd:live.sort((a,b)=>dist2D(a.pos,P.pos)-dist2D(b.pos,P.pos))[0];const r=simRunFight({boss:tg,maxT:Math.max(3,maxT-(T-ft0))});SIMB.focus=null;taken+=r.taken||0;if(r.res==='death')break;}
    const t=+(T-ft0).toFixed(1);rows.push({f,t,hp0:+hp0.toFixed(2),hp1:+(P.hp/S.maxHp).toFixed(2),takenPct:+(taken/S.maxHp).toFixed(2)});
    if(P.dead||R.over){res='death';break;}if(R.phase==='fight'){res='timeout';break;}if(R.phase!=='count'){res='stuck:'+R.phase;break;}}
  const out={res,reached:R.f,cleared:res==='max'?R.f-1:R.f-1,boons:Object.assign({},R.boons),marks:R.marks,rows,simT:Math.round(T-R.t0)};vgLeave(P.dead);return out;}
function vgExports(){return {VG_POS,VG_USE,VG_BANDS,VG_GUARD,VG_BOONS,VG_SHOP,VG_WEEKLY,normVg,vgFields,vgi,vgAffixes,vgHpK,vgDmgK,vgMarks,vgEnter,vgLeave,vgPick,vgRoll,vgApply,vgClear,vgBuy,openVg,vgToggle,vgCanEnter,vgWeekBest,vgWeekMask,vgSimClimb,vgBandHpK,vgEliteType,vgOut,vgIn,vgDo,vgInteract,get vgRun(){return vgRun();}};}
