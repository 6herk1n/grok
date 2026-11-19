/* ================= BUILD N: THE SUNLESS THRONE (Lv 100 end-game raid) =================
   The sealed Sunless Gate in the Riftscar opens for a character at level 100 who has cleared Ossuary of Suns: Eclipse (team dungeon).
   Data-driven on top of the RAIDS / dungeon engine (game14, game5, game24):
   - RAIDS.sunless: team {size:4} = you + 3 roster companions (no mercenaries), R.req role list (tank, healer, control|support),
     level sync: companions Lv 95-99 fight synced up to 100.
   - Stages: 3 guardians (each built around one role), the Stair of Ash (an ascent under falling stars), then Ozmarath, the Sun-Eater:
     3 phases, telegraphed attacks, adds, Corona Shards, a soft enrage and a hard enrage timer (Total Eclipse).
   - Checkpoints: P.raidLock.sunless.stage (0-5) per character; a wipe or a re-entry resumes after the last cleared stage.
   - Lockout: one run per game-week (7 in-game days of this character's play time, P.gday), reset on the game clock.
   - Rewards: Sunforged rarity (RAR[9], raid-only): a 5-piece set per armour family (heavy / medium / light profession groups),
     a weapon per weapon type, a relic heart and an ocular implant; first clear: title "Sunbreaker", the Corona Halo, +2 perk points
     (+1 for each roster companion on their own first clear). Original names and code-built visuals only. */
const SUNR=9,SUN_GWEEK=7;
const SUN_FAM={heavy:{set:'throneguard',name:'Throneguard',pieces:['Throneguard Helm','Throneguard Plate','Throneguard Gauntlets','Throneguard Greaves','Throneguard Sabatons'],
    b:[{sta:20,hp:300,body:30},{str:23,hp:440,power:16},{str:18,wpn:40,crit:8},{sta:19,hp:260,body:26},{sta:14,run:60,hp:160}]},
  medium:{set:'duskstalker',name:'Duskstalker',pieces:['Duskstalker Mask','Duskstalker Harness','Duskstalker Grips','Duskstalker Leggings','Duskstalker Treads'],
    b:[{agi:20,sen:18,crit:7},{agi:23,hp:400,treat:30},{agi:20,wpn:40,crit:8},{sta:19,sen:18,run:60},{agi:14,run:70,crit:6}]},
  light:{set:'starweave',name:'Starweave',pieces:['Starweave Circlet','Starweave Robe','Starweave Wraps','Starweave Legwraps','Starweave Slippers'],
    b:[{psy:20,weave:42,en:160},{psy:23,hp:360,weave:30},{int:18,weave:40,crit:8},{psy:18,sen:18,en:180},{psy:14,run:60,weave:26}]}};
const SUN_SLOTS=['head','armor','hands','legs','feet'];
const SUN_WPN={rifle:['Dawnpiercer',{wpn:62,agi:23,crit:9}],shotgun:['Eclipse Scattergun',{wpn:64,str:22,crit:8}],pistol:['Last Light',{wpn:52,treat:40,sen:18}],blade:['Sunsunder',{wpn:62,str:23,crit:9}],
  smg:['Twin Coronas',{wpn:60,agi:24,crit:10}],bow:['Gloamstring',{wpn:62,agi:22,sen:16}],rod:['Sceptre of the Unlit',{weave:72,psy:24,en:250}],emitter:['Heart-of-Night Emitter',{weave:66,int:24,wpn:30}],
  fist:['Corona Knuckles',{wpn:60,str:20,agi:16}],cannon:['Throneburner',{wpn:66,str:24,hp:300}]};
const SUN_K=2.5;// Lv-46 templates x2.5 = the top tier at Lv 100
const SUN_STAGES=[{k:'kharox',n:'The Bulwark Gate',role:'tank'},{k:'morwen',n:'The Ash Choir',role:'healer'},{k:'vhaela',n:'The Starless Loom',role:'control'},{k:'ascent',n:'The Stair of Ash'},{k:'ozmarath',n:'The Sunless Throne'}];
/* ---------- creature builders (shared rigs, retinted and dressed) ---------- */
function buildKharox(){const R=buildGolem(0x2a2430,0x120e16,0xffc84a);const arm=R.legs[0].k;
  part(arm,geoBox,M(0x3a3040),0,-0.62,0.32,0.95,1.35,0.14);part(arm,geoBox,MB(0xffc84a),0,-0.62,0.4,0.42,0.42,0.05);
  for(let i=0;i<5;i++)part(R.head,geoCone,MB(i%2?0xffc84a:0xb46aff),(i-2)*0.12,0.34,-0.04,0.06,0.42,0.06);return R;}
function buildMorwen(){const R=buildHumanoid(0x3a2a2a,0xffc84a,0xffe9a0,0x8a7a6a,{robe:0x2a1a1a,hood:0x3a2a2a,bulk:1.05});
  part(R.g,cq().ring,MB(0xffc84a),0,2.5,-0.18,0.42,0.42,0.42);xmSpikes(R.g,6,0.15,0.75,[0xffe9a0,0xff9a2a],0.07);return R;}
function buildVhaela(){const R=buildHumanoid(0x1a1a2e,0x7ad8ff,0xb46aff,0x5a5a7a,{robe:0x14142a,hood:0x1a1a2e,bulk:1.0});
  for(let i=0;i<3;i++)part(R.g,cq().ring,MB([0x7ad8ff,0xb46aff,0x5affe0][i]),0,0.9+i*0.55,0,0.9-i*0.18,0.9-i*0.18,0.25).rotation.x=Math.PI/2+i*0.3;return R;}
function buildThrall(){const R=buildHumanoid(0x3a3036,0xff9a2a,0xffc84a,0x5a4a4a,{bulk:1.1});return R;}
function buildAshSeraph(){const R=buildHumanoid(0x4a3a2a,0xffc84a,0xffe9a0,0x8a7a6a,{robe:0x3a2a1a,hood:0x4a3a2a});xmSpikes(R.g,4,1.9,0.45,[0xffc84a],0.06);return R;}
function buildAshSpawn(){const R=buildVoidling();retint(R.g,0x3a2418,0.7,0xff9a2a);return R;}
function buildVoidAnchor(){const R=buildPylon();retint(R.g,0x1a1428,0.75,0xb46aff);return R;}
function buildCoronaShard(){const R=buildPylon();retint(R.g,0x4a3a1a,0.75,0xffc84a);return R;}
// Ozmarath, the Sun-Eater: a hunched four-armed titan carrying a black sun on its back (merged into skinned meshes by bakeRig; detail parts drop at LOD)
function buildSunEater(){const G=cq();const g=new THREE.Group();const R={g,det:[],kind:'golem',dieAxis:'x',legs:[]};const D=m=>{R.det.push(m);return m;};
  const hide=MS(0x221a24),plate=MS(0x3a2e3a),bone=MS(0xd8c8a8),gl=MB(0xffb03a),gl2=MB(0xff5a2a),vo=MB(0x0a060c);
  R.body=new THREE.Group();R.body.position.y=1.7;g.add(R.body);
  R.trunk=part(R.body,G.cap,hide,0,0.25,0,1.25,0.75,0.95);part(R.body,G.sph,plate,0,0.5,0.28,0.9,0.55,0.6);part(R.body,G.sph,hide,0,-0.25,0.05,0.85,0.5,0.75);
  R.core=part(R.body,G.sph,gl,0,0.38,0.78,0.2,0.2,0.12);
  for(let i=0;i<6;i++){const a=(i-2.5)*0.32;D(part(R.body,geoBox,gl2,Math.sin(a)*0.75,0.1+Math.abs(i-2.5)*0.06,Math.cos(a)*0.55,0.04,0.5,0.04)).rotation.z=a;}
  for(const s of [-1,1]){part(R.body,G.sph,plate,s*0.95,0.75,0,0.48,0.42,0.5);for(let k=0;k<3;k++)D(part(R.body,G.spike,bone,s*(0.85+k*0.12),1.05+k*0.05,-0.1-k*0.15,0.08,0.45,0.08)).rotation.z=-s*(0.5+k*0.2);}
  // the black sun on its back
  R.sun=new THREE.Group();R.sun.position.set(0,1.25,-0.75);R.body.add(R.sun);
  part(R.sun,G.disc,vo,0,0,0,1.25,0.08,1.25).rotation.x=Math.PI/2;R.ring=part(R.sun,G.ring,gl,0,0,0,1.4,1.4,0.6);
  for(let i=0;i<10;i++){const a=i*0.628;D(part(R.sun,G.spike,i%2?gl:gl2,Math.cos(a)*1.5,Math.sin(a)*1.5,0,0.09,0.55,0.09)).rotation.z=a-Math.PI/2;}
  // head: crowned skull with a glowing maw and four eyes
  R.head=new THREE.Group();R.head.position.set(0,0.75,0.95);R.body.add(R.head);
  part(R.head,G.sph,hide,0,0,0,0.42,0.38,0.46);part(R.head,G.hemi,plate,0,0.12,0.05,0.44,0.24,0.42);
  R.jaw=new THREE.Group();R.jaw.position.set(0,-0.2,0.15);R.head.add(R.jaw);part(R.jaw,G.sph,hide,0,-0.05,0.18,0.34,0.13,0.32);part(R.jaw,G.sph,gl2,0,0.03,0.2,0.24,0.06,0.24);
  for(const s of [-1,1]){part(R.jaw,G.spike,bone,s*0.2,0.02,0.4,0.05,0.24,0.05).rotation.x=-0.4;
    for(const k of [0,1])part(R.head,G.sph,gl,s*(0.14+k*0.12),0.08+k*0.08,0.4-k*0.06,0.055,0.045,0.035);
    D(part(R.head,G.spike,bone,s*0.3,0.28,-0.1,0.09,0.75,0.09)).rotation.set(-0.5,0,-s*0.55);D(part(R.head,G.spike,bone,s*0.16,0.36,-0.2,0.06,0.5,0.06)).rotation.set(-0.7,0,-s*0.25);}
  // four arms: two great clawed arms, two lesser arms lower on the trunk
  for(const s of [-1,1])for(const lo of [0,1]){const sh=new THREE.Group();sh.position.set(s*(lo?0.95:1.3),lo?1.65:2.45,lo?0.3:0.15);sh.rotation.z=s*(lo?0.35:0.15);g.add(sh);const sz=lo?0.7:1;
    part(sh,G.limb,hide,0,0.05,0,0.32*sz,0.95*sz,0.32*sz);const el=new THREE.Group();el.position.y=-0.92*sz;el.rotation.x=-0.3;sh.add(el);D(part(el,G.sph,gl2,0,0,0,0.16*sz,0.16*sz,0.16*sz));
    part(el,G.limb,plate,0,0,0,0.3*sz,0.95*sz,0.3*sz);for(let i=0;i<3;i++){const c=part(el,G.claw,bone,(i-1)*0.13*sz,-1.0*sz,0.08,0.07*sz,0.38*sz,0.07*sz);c.rotation.x=-0.3;}
    R.legs.push({j:sh,k:el,arm:true,lo,b:0,kb:-0.3,ph:(s<0?0:Math.PI)+lo*1.2});}
  for(const s of [-1,1]){const hp=new THREE.Group();hp.position.set(s*0.55,1.25,-0.1);g.add(hp);part(hp,G.limb,hide,0,0.03,0,0.36,0.62,0.38);
    const kn=new THREE.Group();kn.position.y=-0.6;kn.rotation.x=0.4;hp.add(kn);part(kn,G.limb,plate,0,0,0,0.3,0.65,0.32);part(kn,G.sph,hide,0,-0.66,0.12,0.34,0.15,0.45);
    for(let i=0;i<3;i++)D(part(kn,G.claw,bone,(i-1)*0.14,-0.68,0.48,0.06,0.2,0.06));R.legs.push({j:hp,k:kn,arm:false,b:-0.1,kb:0.4,ph:s<0?Math.PI:0});}
  R.extra=[];
  R.anim=(t,mv,atk,hit)=>{const f=4.2,br=Math.sin(t*1.1);let amt=0;if(atk>0){const u=1-clamp(atk/0.35,0,1);amt=u<0.45?u/0.45:1-(u-0.45)/0.55;}
    for(const L of R.legs){const a=t*f+L.ph;if(L.arm){L.j.rotation.x=Math.sin(a)*0.3*mv-(L.lo?1.2:2.2)*amt+br*0.06;L.k.rotation.x=L.kb-0.2*mv-0.6*amt;}else{L.j.rotation.x=L.b+Math.sin(a)*0.35*mv;L.k.rotation.x=L.kb+Math.max(0,Math.cos(a))*0.45*mv;}}
    R.body.position.y=1.7+Math.abs(Math.sin(t*f))*0.07*mv+br*0.03;R.body.rotation.set(0.12-0.25*amt+(hit>0?0.08*Math.min(1,hit/0.15):0),Math.sin(t*f)*0.04*mv,0);
    R.trunk.scale.set(1.25*(1+br*0.02),0.75*(1+br*0.025),0.95);R.ring.rotation.z=t*0.5;{const q=1+Math.sin(t*3)*0.2+0.5*amt;R.core.scale.set(0.2*q,0.2*q,0.12*q);}
    R.head.rotation.set(-0.15*amt+Math.sin(t*0.5)*0.06,Math.sin(t*0.35)*0.3*(1-mv),0);R.jaw.rotation.x=0.08+0.5*amt+Math.max(0,Math.sin(t*0.8))*0.1;for(const f2 of R.extra)f2(t,mv,atk);};
  return R;}
/* ---------- registries ---------- */
(function sunData(){
  Object.assign(ETYPES,{
    sunthrall:{name:'Throne Thrall',hp:120,dmg:16,atkCd:1.3,range:2.4,speed:6.0,aggro:17,xp:2.6,ranged:false,hitR:0.8,h:1.9,build:buildThrall,scale:0.86,desc:'Ash-bound soldiers of the Throne'},
    ashseraph:{name:'Ash Seraph',hp:84,dmg:15,atkCd:2.0,range:18,speed:4.8,aggro:20,xp:2.6,ranged:true,hitR:0.7,h:1.9,build:buildAshSeraph,scale:0.84,desc:'Burns intruders from range'},
    ashspawn:{name:'Ash Spawn',hp:64,dmg:13,atkCd:1.2,range:2.2,speed:6.6,aggro:30,xp:0.6,ranged:false,hitR:0.7,h:1.1,build:buildAshSpawn,scale:0.7},
    voidanchor:{name:'Void Anchor',hp:240,dmg:8,atkCd:2.2,range:24,speed:0,aggro:30,xp:0.5,ranged:true,hitR:0.9,h:3,build:buildVoidAnchor,scale:0.6},
    coronashard:{name:'Corona Shard',hp:300,dmg:9,atkCd:2.2,range:26,speed:0,aggro:34,xp:0.5,ranged:true,hitR:0.9,h:3,build:buildCoronaShard,scale:0.62},
    kharox:{name:'Kharox, the Eclipse Bulwark',hp:2600,dmg:26,atkCd:2.1,range:5.0,speed:4.4,aggro:22,xp:26,ranged:false,hitR:1.6,h:2.6,build:buildKharox,scale:2.0},
    morwen:{name:'Saint Morwen of the Ash Choir',hp:2300,dmg:23,atkCd:1.8,range:4.6,speed:4.8,aggro:22,xp:26,ranged:false,hitR:1.0,h:1.9,build:buildMorwen,scale:2.1},
    vhaela:{name:'Vhaela, the Starless Loom',hp:2400,dmg:24,atkCd:1.9,range:4.8,speed:4.6,aggro:22,xp:26,ranged:false,hitR:1.0,h:1.9,build:buildVhaela,scale:2.1},
    ozmarath:{name:'Ozmarath, the Sun-Eater',hp:6400,dmg:30,atkCd:2.4,range:7.0,speed:4.0,aggro:30,xp:60,ranged:false,hitR:0.8,h:2.9,build:buildSunEater,scale:3.2}});
  const B=(o)=>o;
  Object.assign(BOSSES,{
    kharox:B({etype:'kharox',lvl:100,intro:'Gravemaul must land on a TANK. Everyone else: stay out of the marked circle!',role:'tank',mech:[
      {t:'buster',name:'Gravemaul',every:13,first:6,r:3.2,delay:2.2,mult:3.6,tankK:0.4,desc:'A circle follows whoever Kharox is fighting, then locks and crushes it. A tank braces (-60%); anyone else takes the full hit, and anyone standing near them shares it.'},
      {t:'slam',name:'Eclipse Quake',every:17,first:11,r:7.5,delay:2.0,mult:2.2,desc:'Telegraphed 7.5m quake around him. Everyone out.'},
      {t:'adds',name:'Thrall Guard',at:[0.5],etype:'sunthrall',n:2,lvl:99,desc:'At 50% two Throne Thralls join. The tank picks them up.'}]}),
    morwen:B({etype:'morwen',lvl:100,intro:'Withering Hymn curses two of you. A HEALER must cleanse it, and Requiem hits everyone!',role:'healer',mech:[
      {t:'wither',name:'Withering Hymn',every:15,first:7,n:2,dur:9,pct:0.06,cleanse:2.6,by:['healer'],desc:'Two team members wither for 9s (6% of max HP per second). A living healer cleanses it after ~2.5s; without one it runs its full course.'},
      {t:'pulse',name:'Requiem',every:19,first:12,pct:0.18,desc:'Every member loses 18% of max HP. Healing keeps the team standing.'},
      {t:'pools',name:'Cinder Psalm',every:13,first:9,r:3.4,delay:1.9,mult:1.9,count:2,desc:'Embers fall on and around every member. Move.'}]}),
    vhaela:B({etype:'vhaela',lvl:100,intro:'She weaves the Unmaking. A CONTROL or SUPPORT member must interrupt it!',role:'control',mech:[
      {t:'unmaking',name:'The Unmaking',every:24,first:10,cast:5,react:2.2,pct:0.6,stun:3,by:['control','support'],desc:'A 5s channel that unmakes the whole hall (60% of max HP to everyone). A living Control (Vyreweaver / Dreamshaper) or Support (Anthemist / Exactor) member interrupts it and stuns her for 3s.'},
      {t:'shield',name:'Void Anchors',at:[0.5],n:3,lvl:99,etype:'voidanchor',what:'Void Anchors',desc:'At 50% three Void Anchors pin her shield in place; she is immune until all are destroyed.'},
      {t:'cross',name:'Loom Threads',every:14,first:7,len:7,gap:3.4,r:2.0,delay:1.7,mult:2.2,desc:'Threads burst out in four lines (a + then an x). Stand in the gaps.'}]}),
    ozmarath:B({etype:'ozmarath',lvl:100,intro:'The Sun-Eater wakes. Watch the ground, break the Corona Shards, and kill it before Total Eclipse!',final:true,mech:[
      {t:'phase',name:'Phases',at:[0.7,0.4],pause:2.6,names:['PHASE 2 · THE BLACK SUN','PHASE 3 · THE HUNGER'],subs:['The Black Sun rises: when it burns, run IN to the ring at its feet','It is starving: faster, harder hits and collapsing ground']},
      {t:'slam',name:'Eclipse Slam',every:13,first:6,r:9,delay:2.2,mult:2.4,ph:[1,2],desc:'Phase 1-2: a 9m slam around it. Everyone out.'},
      {t:'buster',name:'Devour',every:16,first:10,r:3.4,delay:2.4,mult:3.4,tankK:0.4,ph:[1,2,3],desc:'A circle follows whoever it fights, then it bites. A tank braces (-60%).'},
      {t:'cross',name:'Corona Lances',every:15,first:12,len:9,gap:4,r:2.4,delay:1.8,mult:2.2,ph:[1,3],desc:'Phase 1 and 3: light lances out in four lines. Stand in the gaps.'},
      {t:'nova',name:'The Black Sun',every:24,first:6,safe:9,r:44,delay:3.0,mult:2.6,ph:[2,3],desc:'Phase 2-3: the whole arena burns except a 9m ring at its feet. Run IN.'},
      {t:'pools',name:'Starfall',every:12,first:9,r:3.6,delay:2.0,mult:1.8,count:2,ph:[2,3],desc:'Phase 2-3: stars fall on and around every member.'},
      {t:'adds',name:'Ash Spawn',at:[0.65,0.45],etype:'ashspawn',n:3,lvl:99,desc:'At 65% and 45% three Ash Spawn crawl out of the dark.'},
      {t:'shield',name:'Corona Shards',at:[0.55],n:3,lvl:99,etype:'coronashard',what:'Corona Shards',desc:'At 55% three Corona Shards shield it; it is immune until all three are broken.'},
      {t:'slam',name:'Collapse',every:10,first:4,r:12,delay:2.4,mult:2.0,ph:[3],desc:'Phase 3: the floor collapses 12m around it. Get out.'},
      {t:'enrage',name:'The Hunger',at:0.2,dmg:1.5,cd:0.75,spd:1.15,desc:'Below 20% it enrages: harder, faster hits.'},
      {t:'hardenrage',name:'Total Eclipse',time:480,every:3,pct:0.45,desc:'After 8 minutes the Sun-Eater devours the light: everyone loses 45% of max HP every 3s. Kill it before then.'}]})});
  // Sunforged gear: a 5-piece set per armour family, a weapon per weapon type, a relic heart and an ocular
  const sc=(o,k)=>{const r={};for(const s in o)r[s]=Math.round(o[s]*k);return r;};
  for(const fam in SUN_FAM){const F=SUN_FAM[fam];const ids=[];SUN_SLOTS.forEach((sl,i)=>{const id='sun_'+fam+'_'+sl;UNIQUES[id]={d:'sunless',name:F.pieces[i],slot:sl,fam,lvl:100,set:F.set,rar:SUNR,bonus:sc(F.b[i],SUN_K)};ids.push(id);});F.ids=ids;
    SETS[F.set]={name:F.name,pieces:ids,bonus:{2:sc({hp:390,wpn:28,weave:28},SUN_K),3:sc({power:20,crit:6},SUN_K),5:sc({power:32,crit:9,armor:240,hp:300},SUN_K)}};}
  for(const wt in SUN_WPN){const id='sun_w_'+wt;UNIQUES[id]={d:'sunless',name:SUN_WPN[wt][0],slot:'weapon',wt,lvl:100,dmgM:1.18,rar:SUNR,bonus:sc(SUN_WPN[wt][1],SUN_K)};}
  UNIQUES.sun_relic={d:'sunless',name:'Ember of the Last Dawn',kind:'imp',slot:'chest',ql:500,relic:true,rar:SUNR,bonus:sc({sta:50,psy:34,body:70,hp:640,power:32},2.2)};
  UNIQUES.sun_eye={d:'sunless',name:'Eye of the Sun-Eater',kind:'imp',slot:'eyes',ql:500,rar:SUNR,bonus:sc({sen:48,int:28,wpn:66,treat:56},2.2)};
  // the raid
  const P2=(a,lv)=>a.map(k=>[k,lv]);
  RAIDS.sunless={id:'sunless',raid:true,name:'The Sunless Throne',sub:'Beyond the Sunless Gate: the abyss where the light was eaten',lvl:[100,100],minLvl:100,cap:100,rec:100,gate:null,
    door:null,accent:0xb46aff,team:{size:4},noMerc:true,minMember:95,unseal:{lvl:100,td:'sunossuary'},
    req:[{role:'tank',why:'Kharox\'s Gravemaul and the Sun-Eater\'s Devour must land on a tank'},{role:'healer',why:'Saint Morwen\'s Withering Hymn must be cleansed by a healer'},
      {any:[{role:'control'},{role:'support'}],why:'Only Control (Vyreweaver / Dreamshaper) or Support (Anthemist / Exactor) can interrupt Vhaela\'s Unmaking'}],
    lockout:{runs:1,period:'gweek'},tokens:{kharox:6,morwen:6,vhaela:6,ozmarath:16},
    desc:'Under the Riftscar the Sunless Gate opens on a stair into the abyss. Three guardians hold the way, and at the top of the Stair of Ash, Ozmarath, the Sun-Eater, sits on the throne it built from the last light. Bring a full team of four.',
    pal:{floor:0x241c2a,floor2:0x1c1622,wall:0x2e2438,trim:0x120c18,glow:[0xb46aff,0xffb03a],fog:0x0e0814,hemi:[0xd0c0e0,0x120c18,0.7],plight:0xffb03a},
    rooms:[{w:22,d:18,entry:true},{w:28,d:24,packs:[P2(['sunthrall','sunthrall','ashseraph'],99),P2(['voidhound','sunthrall','ashseraph'],99)]},{w:40,d:36,boss:'kharox'},
      {w:28,d:24,packs:[P2(['sunthrall','nullwarden','ashseraph'],99),P2(['voidhound','voidhound','sunthrall'],99)]},{w:40,d:36,boss:'morwen'},
      {w:28,d:24,packs:[P2(['riftseer','sunthrall','nullwarden'],100),P2(['scarbehemoth','ashseraph'],100)]},{w:40,d:36,boss:'vhaela'},
      {w:20,d:34,packs:[P2(['sunthrall','ashseraph','sunthrall'],100)],ascent:1},{w:20,d:30,packs:[P2(['voidmaw','ashseraph','sunthrall'],100)],ascent:2},
      {w:64,d:58,boss:'ozmarath',final:true}],
    loot:{trashP:0},modes:{team:{hp:60,dmg:1.25,lvl:0,size:[4,4]}},// hp x60: tuned to a geared Lv 100 team (~50-90k team DPS): guardians ~2-3 min, the Sun-Eater ~5-6 min inside its 8 min enrage
   
    onEnter:d=>sunOnEnter(d),onTeam:d=>sunTeamFix(d),onBoss:e=>sunOnBoss(e),panel:(id,tab)=>sunPanel(tab),track:()=>sunTrack()};
  const N=['The Sunless Gate','Hall of Cinders','The Bulwark Gate','The Ashen Nave','The Ash Choir','The Loomworks','The Starless Loom','The Stair of Ash','The Last Landing','The Sunless Throne'];
  DLAY.sunless=[{o:0,s:'hall',w:26,d:22,nm:N[0]},{c:'corr',len:12},{o:1,s:'nave',w:30,d:28,nm:N[1]},{c:'corr',len:12},{o:2,s:'arena',w:44,d:40,nm:N[2]},{c:'corr',len:12},
    {o:3,s:'nave',w:30,d:28,nm:N[3]},{c:'corr',len:12},{o:4,s:'arena',w:44,d:40,nm:N[4]},{c:'corr',len:12},{o:5,s:'forge',w:30,d:28,nm:N[5]},{c:'corr',len:12},
    {o:6,s:'arena',w:44,d:40,nm:N[6]},{c:'bridge',len:16},{o:7,s:'hall',w:22,d:34,y:3.5,outdoor:1,nm:N[7]},{c:'bridge',len:16},{o:8,s:'hall',w:22,d:30,y:7,outdoor:-1,nm:N[8]},
    {c:'bridge',len:18},{o:9,s:'arena',w:68,d:62,by:10,nm:N[9]}];
  DTHEME.sunless={tex:'basalt',texS:0.2,wallH:10,floor:0x241c2a,floor2:0x1c1622,wall:0x2e2438,trim:0x120c18,acc:0xb46aff,glow:[0xb46aff,0xffb03a,0xb46aff],crack:0xffb03a,crackK:1.0,
    fog:0x140a1c,fogN:34,fogF:130,hemi:[0xe0d4f0,0x120c18,0.84],dir:0.42,light:[0xb46aff,0xffb03a,0xb46aff],pit:0xb46aff,water:0x4a1a6a,lava:false,
    part:{col:0xffb03a,size:0.2,vy:0.5,drift:0.3,add:true},shaft:0xffb03a,sky:[0x0a0612,0xb46aff],name:'The abyss under the Sunless Gate'};
  if(typeof XMGATE!=='undefined'&&XMGATE){const L=Math.hypot(XMGATE.x,XMGATE.z)||1;RAIDS.sunless.door={x:Math.round(XMGATE.x-XMGATE.x/L*4),z:Math.round(XMGATE.z-XMGATE.z/L*4)};}
  RAIDS.sunless.hook={gate:RAIDS.sunless.door,region:'scar',where:'the Sunless Gate in the Riftscar',needs:{level:100,team:4},status:'open'};})();
/* ---------- character fields (game6 futureFields) ---------- */
function sunFields(s){return {gday:Math.max(0,+s.gday||0),titles:Array.isArray(s.titles)?s.titles.filter(t=>typeof t==='string'):[],title:typeof s.title==='string'?s.title:null,halo:!!s.halo,cosm:Array.isArray(s.cosm)?s.cosm.filter(t=>typeof t==='string'):[]};}
/* ---------- game-clock lockout ---------- */
function gweekKey(){return 'g'+Math.floor((P.gday||0)/SUN_GWEEK);}
function gweekLeftDays(){const g=P.gday||0;return SUN_GWEEK-(g%SUN_GWEEK);}
function gweekLeftMs(){return gweekLeftDays()*DAY_LEN*1000;}
function gweekTxt(){const d=gweekLeftDays();return 'every '+SUN_GWEEK+' game days (in '+(d>=1?d.toFixed(1)+' game days':Math.ceil(d*DAY_LEN/60)+' min of play')+')';}
function sunRec(){return raidRec('sunless');}
function raidResumable(id){if(id!=='sunless')return false;const r=raidRec(id);return (r.stage|0)>0&&!r.done;}
/* ---------- unseal + team ---------- */
function sunUnsealed(c){c=c||P;const U=RAIDS.sunless.unseal;return (c.level|0)>=U.lvl&&!!((tgOf(c).n||{})[U.td]);}
function sunTeam(id,ids){const R=RAIDS[id];const al=raidAlts(id).filter(a=>a.level>=R.minMember);const ok=new Set(al.map(a=>a.id));
  // default picks fill the role requirements first (your own role counts), then the highest levels
  const auto=()=>{const out=[],me={prof:P.prof,role:roleOfChar(P)};for(const r of R.req){if(reqMetBy(r,me)||out.some(id=>reqMetBy(r,al.find(a=>a.id===id))))continue;const a=al.find(x=>!out.includes(x.id)&&reqMetBy(r,x));if(a)out.push(a.id);}for(const a of al)if(out.length<R.team.size-1&&!out.includes(a.id))out.push(a.id);return out;};
  const pick=(ids||(Array.isArray(P.raidTeam)&&P.raidTeam.length?P.raidTeam:auto())).filter(x=>ok.has(x)).slice(0,R.team.size-1);
  return pick.map(cid=>{const s=partySnapshot(cid);if(!s)return null;const c=roster.chars.find(x=>x.id===cid);if(c&&c.level<R.cap){s.stats=statsFor({...c,level:R.cap,buffs:[]});s.level=R.cap;s.synced=c.level;}return s;}).filter(Boolean);}
function sunMembers(team){return [{id:activeId,name:P.name,prof:P.prof,level:P.level,role:roleOfChar(P),you:true}].concat(team.map(s=>({id:s.id,name:s.name,prof:s.prof,level:s.synced||s.level,role:s.role})));}
function sunEntryCheck(id,team){const R=RAIDS[id];team=team||sunTeam(id);const mem=sunMembers(team);const rows=[];
  const td=TEAMD[R.unseal.td];const uns=sunUnsealed();
  rows.push({ok:uns,t:'The Sunless Gate opens for you: level '+R.unseal.lvl+' + one clear of '+(td?td.name:R.unseal.td),d:uns?'':(P.level<R.unseal.lvl?'you are level '+P.level:'clear '+(td?td.name:'the Lv 90 team dungeon')+' first'),gate:1});
  rows.push({ok:team.length===R.team.size-1,t:'Full team: you + '+(R.team.size-1)+' roster companions (Lv '+R.minMember+'+): '+(team.length+1)+'/'+R.team.size,d:team.length<R.team.size-1?'pick companions in the Team tab (no mercenaries in this raid)':team.filter(s=>s.synced).map(s=>s.name+' synced '+s.synced+'→'+R.cap).join(', ')});
  for(const r of R.req){const who=mem.find(m=>reqMetBy(r,m));rows.push({ok:!!who,t:'Needs '+reqLabel(r)+(who?': '+who.name:''),d:r.why||'',req:1});}
  const rec=raidRec(id);const left=raidLeft(id);const res=raidResumable(id);
  rows.push({ok:left>0||res,t:res?'Run in progress: resume after stage '+rec.stage+' ('+SUN_STAGES[rec.stage-1].n+')':left>0?'Lockout: '+left+'/'+R.lockout.runs+' run left this game-week':'Locked out: cleared this game-week',d:'resets '+gweekTxt(),lock:1});
  const bad=rows.find(r=>!r.ok);return {ok:!bad,why:bad?(bad.gate?'sealed':bad.lock?'lockout':bad.req?'req':'team'):'',msg:bad?R.name+': '+bad.t+(bad.d&&!bad.lock?' ('+bad.d+')':''):'',rows,team,lv:R.cap,vet:0};}
/* ---------- entering / checkpoints / barriers ---------- */
// tag each companion with its profession (role/profession checks in the mechanics)
function sunTeamFix(d){for(const a of d.raidAllies){const s=d.party.find(q=>q.id===a.snapId);if(s)a.prof=s.prof;}}
function sunRoomOf(k){return DUN.rooms.find(r=>r.boss===k);}
function sunResumeRoom(st){const rs=DUN.rooms;if(st<=0)return null;if(st===1)return rs[3];if(st===2)return rs[5];if(st===3)return rs[7];return rs[9];}
function sunOnEnter(d){const rec=sunRec();const st=Math.min(4,rec.stage|0);d.sun={st,bar:[],phase:1,fall:0,fx:null,he:false};
  // guardians already cleared this run stay dead; their halls are empty
  const R0=sunResumeRoom(st);
  if(R0){for(const e of d.bosses){const i=SUN_STAGES.findIndex(s=>s.k===e.boss.key);if(i>=0&&i<st){e.dead=true;removeEnemy(e);}}
    for(const e of enemies.slice())if(!e.boss&&e.pos.z>R0.z1+0.5)removeEnemy(e);
    d.entry={x:0,z:R0.z1-3};P.pos.set(0,heightAt(0,R0.z1-3),R0.z1-3);P.rotY=Math.PI;camS.yaw=0;camS.cur=null;raidSpawnTeam();
    d.raidRun.counted=true;addPortal(d,6,R0.z1-4,'Exit to the Reach');}
  // Umbral Wards seal each guardian hall until its guardian falls
  for(const k of ['kharox','morwen','vhaela']){const r=sunRoomOf(k);const e=d.bosses.find(x=>x.boss.key===k);if(!r||!e||e.dead)continue;
    const box={x0:-4.2,x1:4.2,z0:r.z0-0.9,z1:r.z0+0.6,y0:r.y,y1:r.y+7};boxes.push(box);
    const m=new THREE.Mesh(geoBox,new THREE.MeshBasicMaterial({color:0xb46aff,transparent:true,opacity:0.4,depthWrite:false,blending:THREE.AdditiveBlending}));m.scale.set(8.4,6.5,0.3);m.position.set(0,r.y+3.25,r.z0-0.2);d.group.add(m);
    d.sun.bar.push({k,box,m});}
  sunArena(d);
  if(st>0){banner('CHECKPOINT · '+SUN_STAGES[st-1].n.toUpperCase(),'Your run resumes after stage '+st+' of '+SUN_STAGES.length);log('🌑 <b>The Sunless Throne</b>: resuming after <b>'+esc(SUN_STAGES[st-1].n)+'</b> (checkpoint '+st+'/'+SUN_STAGES.length+').');}
  else log('🌑 <b>The Sunless Throne</b>: stage 1 of '+SUN_STAGES.length+'. Checkpoints save after every stage; a wipe resumes from the last one.');}
function sunOpenBarrier(k){const d=DUN;if(!d||!d.sun)return;const i=d.sun.bar.findIndex(b=>b.k===k);if(i<0)return;const b=d.sun.bar[i];const j=boxes.indexOf(b.box);if(j>=0)boxes.splice(j,1);d.group.remove(b.m);b.m.material.dispose();d.sun.bar.splice(i,1);
  ringFx(0,b.box.z0,0xb46aff,5,0.8);toast('🌑 The Umbral Ward falls: the way deeper is open');}
function sunSetStage(n){const rec=sunRec();if(n>(rec.stage|0)){rec.stage=n;const S=SUN_STAGES[n-1];if(n<SUN_STAGES.length){banner('CHECKPOINT '+n+'/'+SUN_STAGES.length,S.n+' cleared · a wipe now resumes from here');SFX.quest();}save();}}
/* ---------- the throne arena: black sun, rune ring, obelisks (few draw calls) ---------- */
function sunArena(d){const r=sunRoomOf('ozmarath');if(!r)return;const y=r.y,g=new THREE.Group();d.group.add(g);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(15,40),new THREE.MeshBasicMaterial({color:0x050208,fog:false}));disc.position.set(0,y+30,r.z0-10);g.add(disc);
  const cor=new THREE.Mesh(new THREE.RingGeometry(15,19.5,48),new THREE.MeshBasicMaterial({color:0xb46aff,transparent:true,opacity:0.75,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));cor.position.copy(disc.position);cor.position.z+=0.1;g.add(cor);
  const rune=new THREE.Mesh(new THREE.RingGeometry(18,19,64),new THREE.MeshBasicMaterial({color:0xffb03a,transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false}));rune.rotation.x=-Math.PI/2;rune.position.set(0,y+0.05,r.cz);g.add(rune);
  const ob=new THREE.InstancedMesh(geoBox,M(0x1a1220),8),tip=new THREE.InstancedMesh(geoCone,MB(0xffb03a),8);const o=new THREE.Object3D();
  for(let i=0;i<8;i++){const a=i/8*6.283+0.39,x=Math.cos(a)*27,z=r.cz+Math.sin(a)*24;o.position.set(x,y+4,z);o.scale.set(1.6,8,1.6);o.rotation.set(0,a,0);o.updateMatrix();ob.setMatrixAt(i,o.matrix);
    o.position.y=y+8.9;o.scale.set(0.7,1.8,0.7);o.updateMatrix();tip.setMatrixAt(i,o.matrix);circles.push({x,z,r:1.3});}
  g.add(ob);g.add(tip);d.sun.fx={g,disc,cor,rune,r};}
function sunArenaPhase(ph){const d=DUN;if(!d||!d.sun||!d.sun.fx)return;const f=d.sun.fx;const col=[0xb46aff,0xff5a2a,0xd01a3a][ph-1]||0xb46aff;f.cor.material.color.setHex(col);f.rune.material.color.setHex(ph>=3?0xff3a2a:0xffb03a);
  if(scene.fog)scene.fog.color.setHex([0x140a1c,0x2a0a0e,0x30060c][ph-1]||0x140a1c);scene.background=new THREE.Color(scene.fog?scene.fog.color.getHex():0x140a1c);}
/* ---------- team helpers ---------- */
function sunTeamList(){const d=DUN;const L=[{e:P,role:roleOfChar(P),prof:P.prof,name:'You',max:()=>S.maxHp}];
  if(d&&d.raidAllies)for(const a of d.raidAllies)if(!a.dead&&allies.includes(a))L.push({e:a,role:a.role,prof:a.prof,name:a.name,max:()=>a.maxHp});return L.filter(x=>x.e===P?!P.dead:true);}
function sunHit(x,amt,src){if(x.e===P){if(!P.dead)dmgPlayer(amt,src,true,true);}/* %max-HP raid mechanics ignore armour */else allyTakeDmg(x.e,amt/Math.max(0.4,1-(x.e.dr||0)),src);}
/* ---------- guardian / final boss mechanics ---------- */
// tank-buster: a circle follows the boss's current foe, locks, then lands; a tank takes tankK of it, others the full hit (and anyone near shares it)
MECH_EXT.buster=(e,b,m,i)=>{if(T<b.next[i]||T<(e.stunUntil||0))return;b.next[i]=T+m.every;const L=sunTeamList();if(!L.length)return;const tgt=L.find(x=>x.e===e.foe)||L.find(x=>x.role==='tank')||L[0];
  telegraph(e,tgt.e.pos.x,tgt.e.pos.z,m.r,m.delay,b.baseDmg*m.mult,m.name);const t=DUN.tele[DUN.tele.length-1];t.tgt=tgt;
  t.upd=q=>{if(T<q.at-0.7&&!(q.tgt.e.dead)){q.x=q.tgt.e.pos.x;q.z=q.tgt.e.pos.z;q.g.position.set(q.x,heightAt(q.x,q.z)+0.06,q.z);}};
  t.dmgFn=tg=>{const role=tg===P?roleOfChar(P):tg.role;return role==='tank'?t.dmg*m.tankK:t.dmg;};
  b.busts=(b.busts||0)+1;toast('⚠ '+m.name+' on '+(tgt.e===P?'YOU':tgt.name)+(tgt.role==='tank'?' (tank braces)':': get a TANK on the boss!'));floatText(entChest(e,tmpV),m.name+'!','info');tone(130,0.6,'sawtooth',0.06,90);};
// Withering Hymn: a damage-over-time curse that a living healer cleanses
MECH_EXT.wither=(e,b,m,i)=>{if(T<b.next[i]||T<(e.stunUntil||0))return;b.next[i]=T+m.every;const L=sunTeamList();if(!L.length)return;
  const pool=L.slice().sort((x,y)=>(x.role==='tank')-(y.role==='tank')||Math.random()-0.5).slice(0,m.n);const cl=L.find(x=>m.by.includes(x.role));
  DUN.sun.wither=(DUN.sun.wither||[]).concat(pool.map(x=>({x,until:T+m.dur,tick:T+1,pct:m.pct,cleanseAt:cl?T+m.cleanse:null,by:cl?cl.name:null,src:e})));b.withers=(b.withers||0)+1;
  toast('☠ '+m.name+' on '+pool.map(x=>x.e===P?'YOU':x.name).join(' + ')+(cl?' · '+cl.name+' will cleanse it':' · no healer: it runs its full course!'));for(const x of pool)ringFx(x.e.pos.x,x.e.pos.z,0x6a8a2a,1.6,0.8);};
MECH_EXT.pulse=(e,b,m,i)=>{if(T<b.next[i]||T<(e.stunUntil||0))return;b.next[i]=T+m.every;for(const x of sunTeamList())sunHit(x,x.max()*m.pct,e);ringFx(e.pos.x,e.pos.z,0xffb03a,18,0.8);nz(0.4,0.1,300);toast('💢 '+m.name+': the whole team takes damage');b.pulses=(b.pulses||0)+1;};
// The Unmaking: a long channel; a living control/support member interrupts it (and stuns her), else it unmakes the hall
MECH_EXT.unmaking=(e,b,m,i)=>{const d=DUN;
  if(b.ch){const c=b.ch;if(c.by&&T>=c.intAt){const ti=d.tele.indexOf(c.t);if(ti>=0){d.group.remove(c.t.g);c.t.g.children.forEach(q=>q.material.dispose());d.tele.splice(ti,1);}b.ch=null;e.rootUntil=0;e.stunUntil=T+m.stun;b.ints=(b.ints||0)+1;
      banner('UNMAKING INTERRUPTED',c.by+' breaks the weave · Vhaela is stunned for '+m.stun+'s');ringFx(e.pos.x,e.pos.z,0x7ad8ff,6,0.8);SFX.boom();}
    else if(T>=c.t.at){b.ch=null;b.lands=(b.lands||0)+1;}return;}
  if(T<b.next[i]||T<(e.stunUntil||0))return;b.next[i]=T+m.every;const r=b.room;const L=sunTeamList();const it=L.find(x=>m.by.includes(x.role)&&Math.hypot(x.e.pos.x-e.pos.x,x.e.pos.z-e.pos.z)<34);
  telegraph(e,r?0:e.pos.x,r?r.cz:e.pos.z,r?Math.max(r.w,r.d)*0.62:24,m.cast,0,m.name);const t=d.tele[d.tele.length-1];t.dmgFn=tg=>(tg===P?S.maxHp:tg.maxHp)*m.pct;t.noDodge=true;t.pure=true;
  e.rootUntil=T+m.cast;b.ch={t,by:it?(it.e===P?'You':it.name):null,intAt:T+m.react};
  banner('THE UNMAKING',it?(it.e===P?'You are':it.name+' is')+' moving to interrupt it…':'No Control or Support to interrupt: brace for it!');tone(110,1.2,'sawtooth',0.05,60);};
// phases: data-driven HP thresholds; a short roar pause, the arena changes, and mechs tagged ph:[n] switch on
MECH_EXT.phase=(e,b,m,i,hpF)=>{b.phase=b.phase||1;m.at.forEach((th,j)=>{if(b.done['ph'+j]||hpF>th)return;b.done['ph'+j]=1;b.phase=j+2;clearTele(e);e.rootUntil=T+m.pause;
  b.def.mech.forEach((q,k)=>{if(q.t==='phase'||q.t==='adds'||q.t==='shield'||q.t==='enrage'||q.t==='hardenrage')return;if(!q.ph||q.ph.includes(b.phase))b.next[k]=Math.max(b.next[k]||0,T+m.pause+(q.first?Math.min(q.first,6):3));});
  banner(m.names[j],m.subs[j]);ringFx(e.pos.x,e.pos.z,0xff5a2a,14,1.0);ringFx(e.pos.x,e.pos.z,0xffb03a,22,1.3);nz(0.8,0.16,160);SFX.boom();tone(70,1.4,'sawtooth',0.07,40);sunArenaPhase(b.phase);
  if(DUN.sun)DUN.sun.phase=b.phase;});};
// hard enrage: after m.time seconds of the fight everyone takes pct of max HP every m.every seconds
MECH_EXT.hardenrage=(e,b,m)=>{if(T-b.t0<m.time*(typeof hmEnrageK==='function'?hmEnrageK():1))return;if(!b.he){b.he=true;b.heN=T;banner(m.name.toUpperCase(),'The Sun-Eater devours the light. Nothing survives this.');sunArenaPhase(3);if(DUN.sun)DUN.sun.he=true;}
  if(T>=b.heN){b.heN=T+m.every;for(const x of sunTeamList())sunHit(x,x.max()*m.pct,e);ringFx(e.pos.x,e.pos.z,0xd01a3a,30,0.9);nz(0.5,0.14,120);}};
/* ---------- per-frame raid logic ---------- */
let sunAcc=0,HALO=null;
function updSun(dt){if(state==='play'&&!(DUN&&DUN.apt))P.gday=(P.gday||0)+dt/DAY_LEN;
  sunAcc+=dt;if(sunAcc>0.5){sunAcc=0;sunGateLook();}
  sunHalo();
  const d=DUN;if(!d||d.id!=='sunless'||!d.sun)return;const S2=d.sun;
  // withers tick + cleanse
  if(S2.wither)for(let k=S2.wither.length-1;k>=0;k--){const w=S2.wither[k];const dead=w.x.e===P?P.dead:w.x.e.dead;
    if(dead||T>=w.until){S2.wither.splice(k,1);continue;}
    if(w.cleanseAt&&T>=w.cleanseAt){S2.wither.splice(k,1);S2.cleansed=(S2.cleansed||0)+1;floatText(tmpV.set(w.x.e.pos.x,w.x.e.pos.y+2.4,w.x.e.pos.z),'Cleansed','heal');ringFx(w.x.e.pos.x,w.x.e.pos.z,0x6dff8a,1.8,0.5);if(S2.cleansed<=2||w.x.e===P)toast('✚ '+w.by+' cleanses the Withering Hymn');continue;}
    if(T>=w.tick){w.tick+=1;sunHit(w.x,w.x.max()*w.pct,w.src);ringFx(w.x.e.pos.x,w.x.e.pos.z,0x6a8a2a,1.2,0.4);}}
  // the Stair of Ash: falling stars while you climb (until the throne checkpoint)
  const r7=d.rooms[7],r8=d.rooms[8],r9=d.rooms[9];
  if(r7&&r8&&!P.dead&&(sunRec().stage|0)>=3&&(sunRec().stage|0)<4&&P.pos.z<r7.z1&&P.pos.z>r8.z0-18){S2.fall-=dt;if(S2.fall<=0){S2.fall=2.6;S2.stars=(S2.stars||0)+1;const src=S2.src||(S2.src={T:{name:'Starfall'},dead:true,hp:0,pos:new THREE.Vector3(0,-99,0)});
      telegraph(src,P.pos.x+rand(-1,1),P.pos.z+rand(-1,1),3.0,1.9,0,'Starfall');d.tele[d.tele.length-1].dmgFn=tg=>(tg===P?S.maxHp:tg.maxHp)*0.22;
      const ax=clamp(P.pos.x+rand(-6,6),-8,8),az=P.pos.z-rand(4,9);telegraph(src,ax,az,3.0,2.1,0,'Starfall');d.tele[d.tele.length-1].dmgFn=tg=>(tg===P?S.maxHp:tg.maxHp)*0.22;}}
  if(r9&&(sunRec().stage|0)===3&&P.pos.z<r9.z1-1&&!P.dead){sunSetStage(4);d.entry={x:0,z:r9.z1-3};S2.fall=0;}
  if(S2.fx){S2.fx.cor.rotation.z+=dt*0.05;S2.fx.rune.material.opacity=0.28+Math.sin(T*1.6)*0.1;}}
/* ---------- kills: checkpoints, personal loot, the finale ---------- */
function sunFam(prof){return PROF_FAM[prof]||'medium';}
function sunSetPiece(fam,have){const F=SUN_FAM[fam];const miss=F.ids.filter(k=>!have.has(k));return pick(miss.length?miss:F.ids);}
function sunOwned(){const s=new Set();for(const it of P.inv)if(it&&it.uniq)s.add(it.uniq);for(const k in P.eq){const it=P.eq[k];if(it&&it.uniq)s.add(it.uniq);}return s;}
function sunDrop(e,keys){keys.forEach((k,i)=>{const it=makeUnique(k);if(!it)return;it.dropBy=e.T.name;const a=i/Math.max(1,keys.length)*6.28;dropLoot(e.pos.x+Math.cos(a)*2.4,e.pos.z+Math.sin(a)*2.4,it);});}
function sunOnBoss(e){const d=DUN;const k=e.boss.key;const idx=SUN_STAGES.findIndex(s=>s.k===k);if(idx<0)return;const fam=sunFam(P.prof),own=sunOwned();
  if(!e.boss.final){sunOpenBarrier(k);sunSetStage(idx+1);const keys=[sunSetPiece(fam,own)];if(Math.random()<0.3)keys.push(sunSetPiece(fam,new Set([...own,keys[0]])));sunDrop(e,keys);return;}
  const rec=sunRec();const first=!((P.raidClears||{}).sunless>1);rec.stage=SUN_STAGES.length;rec.done=true;
  const wts=wtAff(P.prof);const wt=wts.includes(PROF_WT[P.prof])?PROF_WT[P.prof]:pick(wts);const keys=[sunSetPiece(fam,own)];keys.push(sunSetPiece(fam,new Set([...own,keys[0]])));keys.push('sun_w_'+(SUN_WPN[wt]?wt:'rifle'));
  if(first||Math.random()<0.3)keys.push('sun_relic');if(first||Math.random()<0.45)keys.push('sun_eye');sunDrop(e,keys);
  let gift='';if(first){P.ppBonus=(P.ppBonus|0)+2;P.pp=ppAvail();if(!P.titles.includes('Sunbreaker'))P.titles.push('Sunbreaker');P.title='Sunbreaker';if(!P.cosm.includes('halo'))P.cosm.push('halo');P.halo=true;gift=' · +2 perk points · title «Sunbreaker» · Corona Halo';}
  const names=[];for(const id of (d.raidRun.team||[])){const c=roster.chars.find(x=>x.id===id);if(!c)continue;c.raidClears=c.raidClears||{};const f1=!c.raidClears.sunless;c.raidClears.sunless=(c.raidClears.sunless|0)+1;
    const it=makeUnique(sunSetPiece(sunFam(c.prof),new Set()));it.dropBy=e.T.name;sheetGive(c,it);if(f1){c.ppBonus=(c.ppBonus|0)+1;c.titles=Array.isArray(c.titles)?c.titles:[];if(!c.titles.includes('Sunbreaker'))c.titles.push('Sunbreaker');}
    names.push(c.name+(f1?' (+1 perk point, title, '+it.name+')':' ('+it.name+')'));}
  if(names.length)writeRoster(roster);
  sunFinale(e,first);log('☀ <b>The Sun-Eater falls.</b> The Sunless Throne is cleared'+gift+'.'+(names.length?' Your team: '+esc(names.join(', '))+'.':'')+' Next run: '+esc(gweekTxt())+'.');save();}
function sunFinale(e,first){const d=DUN;const x=e.pos.x,z=e.pos.z;d.sun.finale=T;
  banner('THE SUN-EATER FALLS','Light returns to the Sunless Throne');
  let fl=document.getElementById('sunFlash');if(!fl){fl=document.createElement('div');fl.id='sunFlash';fl.style.cssText='position:fixed;inset:0;background:radial-gradient(circle,#fff8e0 0%,#ffd27a 45%,rgba(255,176,58,0) 80%);pointer-events:none;z-index:40;opacity:0;transition:opacity 1.6s ease-out';document.body.appendChild(fl);}
  fl.style.transition='none';fl.style.opacity='0.95';requestAnimationFrame(()=>requestAnimationFrame(()=>{fl.style.transition='opacity 1.6s ease-out';fl.style.opacity='0';}));
  for(let k=0;k<6;k++)setTimeout(()=>{if(DUN!==d)return;ringFx(x,z,k%2?0xffb03a:0xfff0b0,6+k*5,1.0);},k*160);
  nz(1.2,0.18,90);SFX.boom();[262,330,392,523,659,784].forEach((f,k)=>setTimeout(()=>tone(f,0.5,'triangle',0.07,f*1.01),200+k*140));setTimeout(()=>{tone(523,1.6,'sine',0.06);tone(659,1.6,'sine',0.05);tone(784,1.6,'sine',0.05);SFX.level();},1100);
  if(d.sun.fx){d.sun.fx.disc.material.color.setHex(0xfff0b0);d.sun.fx.cor.material.color.setHex(0xffd27a);d.sun.fx.rune.material.color.setHex(0xfff0b0);}
  if(scene.fog){scene.fog.color.setHex(0x3a2a1a);scene.background=new THREE.Color(0x3a2a1a);}
  if(first)setTimeout(()=>{if(DUN!==d)return;banner('TITLE: SUNBREAKER','+2 perk points · the Corona Halo is yours (Raid panel → Rewards)');SFX.quest();},3600);}
/* ---------- the gate, title, halo ---------- */
function sunGateLook(){if(typeof XMGATE==='undefined'||!XMGATE||DUN)return;const u=sunUnsealed();if(XMGATE.uns===u)return;XMGATE.uns=u;XMGATE.seal.material.opacity=u?0.4:0.85;XMGATE.seal.material.color.setHex(u?0xffb03a:0x2a0a3a);XMGATE.ring.material=MB(u?0xffb03a:0xb46aff);}
function sunGateMsg(){const R=RAIDS.sunless;const td=TEAMD[R.unseal.td];return sunUnsealed()?['THE SUNLESS GATE','Unsealed for you · '+R.name+' · team of '+R.team.size+' · Use the gate'] : ['THE SUNLESS GATE','Sealed · opens at level '+R.unseal.lvl+' after a clear of '+(td?td.name:'the Lv 90 team dungeon')];}
function titleHtml(){return P.title?` <span class="ptitle" style="color:#ffd27a;font-size:12px">«${esc(P.title)}»</span>`:'';}
function sunHalo(){const on=state==='play'&&P.halo&&(P.cosm||[]).includes('halo')&&!P.dead;if(!on){if(HALO)HALO.visible=false;return;}
  if(!HALO){HALO=new THREE.Group();const r=new THREE.Mesh(new THREE.TorusGeometry(0.42,0.045,6,28),new THREE.MeshBasicMaterial({color:0xffd27a}));r.rotation.x=Math.PI/2;HALO.add(r);
    for(let i=0;i<8;i++){const s=new THREE.Mesh(geoCone,MB(0xffb03a));const a=i/8*6.283;s.position.set(Math.cos(a)*0.5,0,Math.sin(a)*0.5);s.scale.set(0.05,0.16,0.05);s.rotation.set(Math.sin(a)*1.57,0,-Math.cos(a)*1.57);HALO.add(s);}scene.add(HALO);}
  HALO.visible=PM&&PM.g.visible!==false;HALO.position.set(P.pos.x,P.pos.y+2.45*(PM&&PM.g?PM.g.scale.y:1),P.pos.z);HALO.rotation.y=T*0.8;}
/* ---------- panel ---------- */
function sunPanel(tab){const id='sunless',R=RAIDS[id];if(tab)RP.tab=tab;RP.id=id;const t=['team','stages','rewards'].includes(RP.tab)?RP.tab:'team';const ck=sunEntryCheck(id);const rec=sunRec();const al=raidAlts(id);const picks=sunTeam(id).map(s=>s.id);
  const res=raidResumable(id);
  let h=`<div class="craftbar raidbar"><span class="cbi">🌑</span><span class="cbn"><b>${esc(R.name)}</b><small>Lv ${R.minLvl} · team of ${R.team.size} · checkpoint ${rec.stage|0}/${SUN_STAGES.length} · ${raidLeft(id)}/${R.lockout.runs} run this game-week · ${RAID_CUR} ${P.sigils|0}</small></span>
    <button class="sbtn${ck.ok?'':' locked'}" id="raidGo" data-act="${ck.ok?'rgo':'rno'}" data-id="${id}">${ck.ok?(res?'Resume (stage '+((rec.stage|0)+1)+')':'Enter raid'):ck.why==='sealed'?'🔒 Sealed':ck.why==='lockout'?'🔒 Locked out':'⛔ Team'}</button></div>`;
  h+=`<div class="tabs">${[['team','👥 Team'],['stages','💀 Stages'],['rewards','☀ Rewards']].map(([k,n])=>`<button data-act="rtab" data-t="${k}" class="${t===k?'on':''}">${n}</button>`).join('')}</div>`;
  if(t==='team'){h+=(ck.ok?hmPickHtml('r:'+id):'')+`<div class="mis" style="border-color:#b46aff"><p>${esc(R.desc)}</p><div style="font-size:13px;opacity:.85">One run per game-week (resets ${esc(gweekTxt())}). Checkpoints save after every stage: a wipe revives the team at the last checkpoint, and leaving keeps your progress for this game-week. Companions below Lv ${R.cap} are level-synced up to ${R.cap}.</div></div>
      <div class="h4">Requirements</div>${tdRowsHtml(ck.rows)}<div class="h4">Your team (you + ${R.team.size-1})</div><div class="mis"><b>${esc(P.name)}</b> (you) · Lv ${P.level} ${esc(PROFS[P.prof].name)} · ${roleOfChar(P)}</div>`+
      al.map(a=>{const on=picks.includes(a.id),low=a.level<R.minMember;return `<button class="item${on?' sel':''}" data-act="${low?'rover':'rtog'}" data-id="${a.id}" style="${low?'opacity:.55':''}"><span class="ico">${on?'✔':low?'⛔':'＋'}</span><span><div class="nm">${esc(a.name)}</div><div class="sub">Lv ${a.level} ${esc(PROFS[a.prof].name)} · ${a.role}${low?' · needs Lv '+R.minMember+'+':a.level<R.cap?' · synced to '+R.cap:''}</div></span></button>`;}).join('')+
      (al.length?'':`<div style="opacity:.7;font-size:13px">Make more characters (alts) and level them to ${R.minMember}+: this raid takes no mercenaries.</div>`);}
  else if(t==='stages'){h+=SUN_STAGES.map((S,i)=>{const B=BOSSES[S.k];const done=(rec.stage|0)>i;const head=`<b style="color:${done?'#6dff8a':'#ff9a2a'}">${i+1}. ${esc(S.n)}</b>${B?' · '+esc(ETYPES[B.etype].name):''}${S.role?' · '+reqLabel({role:S.role})+' check':''}${done?' · ✔ checkpoint':''}`;
      if(!B)return `<div class="mis">${head}<div style="font-size:13px">Climb the Stair of Ash under falling stars (telegraphed circles every few seconds) and fight through the last guards. Reaching the throne saves a checkpoint.</div></div>`;
      return `<div class="mis">${head}${B.mech.filter(m=>m.desc).map(m=>`<div style="font-size:13px"><b>${esc(m.name)}</b>: ${esc(m.desc)}</div>`).join('')}</div>`;}).join('');}
  else{const fam=sunFam(P.prof),F=SUN_FAM[fam];const S=SETS[F.set];const bon=n=>Object.entries(S.bonus[n]).map(([s,v])=>'+'+v+' '+(SHORT[s]||s)).join(' ');
    h+=`<div class="stats">Only this raid drops <b style="color:${RAR[SUNR].c}">${RAR[SUNR].n}</b> gear, the top rarity. Each guardian drops a piece of your armour family's set; the Sun-Eater drops two more, a weapon for your profession, and (often) the relic and the ocular. First clear: <b>+2 perk points</b>, the title <b>«Sunbreaker»</b> and the <b>Corona Halo</b>; each roster companion on their first clear gets +1 perk point and a set piece.</div>
      <div class="h4">${esc(F.name)} (${fam} armour) · 2: ${bon(2)} · 3: ${bon(3)} · 5: ${bon(5)}</div>`+F.ids.concat(['sun_w_'+PROF_WT[P.prof],'sun_relic','sun_eye']).filter(k=>UNIQUES[k]).map(k=>{const it=makeUnique(k);return itemRow(it,'<span style="opacity:.7">drop only</span>',false,'noop');}).join('')+
      `<div class="h4">Title and cosmetic</div><button class="sbtn${P.titles.includes('Sunbreaker')?'':' locked'}" data-act="suntitle">${P.title==='Sunbreaker'?'✔ Showing «Sunbreaker»':P.titles.includes('Sunbreaker')?'Show title «Sunbreaker»':'🔒 «Sunbreaker» (first clear)'}</button>
      <button class="sbtn${(P.cosm||[]).includes('halo')?'':' locked'}" data-act="sunhalo" style="margin-left:6px">${P.halo&&(P.cosm||[]).includes('halo')?'✔ Corona Halo on':(P.cosm||[]).includes('halo')?'Wear the Corona Halo':'🔒 Corona Halo (first clear)'}</button>`;}
  if(!ck.ok&&t!=='team')h+=`<div class="capmsg">⛔ ${esc(ck.msg)}</div>`;
  openPanel('🌑 RAID · '+R.name.toUpperCase(),h,'raid');}
function sunAct(a){if(a==='suntitle'){if(!P.titles.includes('Sunbreaker')){warn('Clear the Sunless Throne to earn «Sunbreaker»');return true;}P.title=P.title==='Sunbreaker'?null:'Sunbreaker';save();sunPanel('rewards');return true;}
  if(a==='sunhalo'){if(!(P.cosm||[]).includes('halo')){warn('Clear the Sunless Throne to earn the Corona Halo');return true;}P.halo=!P.halo;save();sunPanel('rewards');return true;}return false;}
function sunTrack(){const d=DUN,R=d.D,rec=sunRec();const st=rec.stage|0;const fin=d.bosses.find(e=>e.boss.final);const al=d.raidAllies.filter(a=>!a.dead&&allies.includes(a)).length;
  let x='';if(fin&&!fin.dead&&fin.boss.engaged){const left=480-(T-fin.boss.t0);x=`<br>Phase ${fin.boss.phase||1}/3 · ${left>0?'Total Eclipse in '+Math.floor(left/60)+':'+String(Math.floor(left%60)).padStart(2,'0'):'<span style="color:#ff5a5a">TOTAL ECLIPSE</span>'}`;}
  return `<b>🌑 ${esc(R.name)}</b><br>Stage ${Math.min(st+1,SUN_STAGES.length)}/${SUN_STAGES.length}: ${esc(SUN_STAGES[Math.min(st,SUN_STAGES.length-1)].n)} · Team ${al+(P.dead?0:1)}/${R.team.size} · checkpoint ${st}${x}${d.cleared?' · <span style="color:#6dff8a">Cleared! Take the exit portal</span>':''}`;}
function sunExports(){return {PROF_WT,PROF_FAM,writeRoster,SUNR,SUN_FAM,SUN_STAGES,SUN_GWEEK,sunUnsealed,sunEntryCheck,sunTeam,sunRec,raidResumable,gweekKey,gweekLeftDays,sunOnBoss,sunPanel,sunAct,sunTeamList,sunGateMsg,buildSunEater,
  sunSetStage,sunArenaPhase,bossTick,sunRoomOf,get XMGATE(){return typeof XMGATE!=='undefined'?XMGATE:null;},get boxes(){return boxes;},get sunD(){return DUN&&DUN.sun;},get halo(){return HALO;},titleHtml};}
