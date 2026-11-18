/* ================= BUILD J: LEVEL CAP 50 · Mirelight Fen (Lv 31-40) · Sundered Heights (Lv 41-50) · two solo dungeons · two hubs =================
   Data rules for future raises (51-100):
   - MAXLVL (game2) is the cap; xpNeed/spGain/spTotal are formulas that keep going; TIERS (game2) already runs to 100+.
   - A new 10-level band = a BIOMES entry + hub OUTPOSTS entry (game1), XREG camps here, an expansionData() block (etypes, bosses, dungeon, uniques),
     a TEAMD entry with band = (top/10) and TD_BANDS += [top] (game29), and Weave ranks in the XW table (game2).
   Everything here is code-built (no external assets) and original. */
/* ---------- data merged into game5's registries before the dungeon doors are built (called from game5) ---------- */
function expansionData_j(){
  // ---- enemies: Mirelight Fen ----
  Object.assign(ETYPES,{
    mirelurk:{name:'Mirelurk',hi:true,xr:'fen',ai:'burrow',hp:66,dmg:10,atkCd:1.3,range:2.4,speed:6,aggro:17,xp:1.7,ranged:false,hitR:0.8,h:1.1,build:buildMirelurk,scale:0.9,desc:'Sinks into the bog and bursts up beneath you'},
    sporecaller:{name:'Sporecaller',hi:true,xr:'fen',ai:'kite',hp:52,dmg:9,atkCd:2.0,range:19,speed:4.8,aggro:20,xp:1.7,ranged:true,hitR:0.7,h:1.9,build:buildSporecaller,scale:0.84,desc:'Keeps its distance and drops spore-burst circles'},
    bloatmaw:{name:'Bloatmaw',hi:true,xr:'fen',ai:'split',split:{t:'mireling',n:2},hp:140,dmg:16,atkCd:2.4,range:3.3,speed:4.2,aggro:15,xp:2.1,ranged:false,hitR:1.4,h:2.6,build:buildBloatmaw,scale:0.9,desc:'Bursts into two Mirelings when it dies'},
    mireling:{name:'Mireling',hi:true,xr:'fen',hp:34,dmg:7,atkCd:1.3,range:2.2,speed:5.8,aggro:18,xp:0.45,ranged:false,hitR:0.7,h:1.2,build:buildMireling,scale:0.62},
    fenwitch:{name:'Fen Witch',hi:true,xr:'fen',ai:'heal',hp:48,dmg:6,atkCd:2.2,range:17,speed:4.8,aggro:18,xp:1.8,ranged:true,hitR:0.7,h:1.9,build:buildFenwitch,scale:0.82,desc:'Heals the most wounded enemy nearby. Kill it first'},
    // ---- enemies: Sundered Heights ----
    cinderwraith:{name:'Cinderwraith',hi:true,xr:'sunder',ai:'blink',hp:70,dmg:11,atkCd:1.2,range:2.2,speed:6.6,aggro:16,xp:1.9,ranged:false,hitR:0.8,h:1.2,build:buildCinderwraith,scale:0.82,desc:'Blinks behind its prey through a burst of embers'},
    ashcaster:{name:'Ashcaster',hi:true,xr:'sunder',ai:'chill',hp:56,dmg:10,atkCd:2.0,range:18,speed:4.8,aggro:20,xp:1.9,ranged:true,hitR:0.7,h:1.9,build:buildAshcaster,scale:0.84,desc:'Every hit sears and slows you; four stacks lock you in cooling ash'},
    shardgolem:{name:'Obsidian Hulk',hi:true,xr:'sunder',ai:'charge',slow:{mul:0.7,dur:2.5,name:'Staggered'},hp:160,dmg:18,atkCd:2.3,range:3.2,speed:4.6,aggro:15,xp:2.3,ranged:false,hitR:1.4,h:2.6,build:buildShardgolem,scale:0.9,desc:'Winds up, then charges across the field'},
    warder:{name:'Riftwarder',hi:true,xr:'sunder',ai:'ward',hp:100,dmg:8,atkCd:2.2,range:15,speed:4.4,aggro:18,xp:2.0,ranged:true,hitR:0.8,h:2.1,build:buildWarder,scale:0.92,desc:'Shields nearby allies in Ember Wards (-60% damage taken). Kill it first'},
    // ---- bosses ----
    sluicewarden:{name:'The Sluice Warden',hp:1400,dmg:17,atkCd:2.2,range:4.8,speed:4.4,aggro:19,xp:13,ranged:false,hitR:1.6,h:2.6,build:buildSluicewarden,scale:1.8},
    sporemother:{name:'Mother Verdigris',hp:1600,dmg:17,atkCd:1.9,range:4.8,speed:4.6,aggro:20,xp:17,ranged:false,hitR:1.0,h:1.9,build:buildSporemother,scale:1.9},
    anvilking:{name:'Anvil-King Morrow',hp:1500,dmg:18,atkCd:1.8,range:3.8,speed:5.2,aggro:18,xp:14,ranged:false,hitR:0.8,h:1.9,build:buildAnvilking,scale:1.7},
    sovereign:{name:'The Ember Sovereign',hp:1750,dmg:19,atkCd:2.0,range:4.8,speed:4.6,aggro:20,xp:19,ranged:false,hitR:1.6,h:2.6,build:buildSovereign,scale:2.0}});
  Object.assign(BOSSES,{
    sluicewarden:{etype:'sluicewarden',lvl:35,intro:'Floodgates open in lines from it. Stand in the dry gaps!',mech:[
      {t:'cross',name:'Floodgate Lines',every:12,first:5,len:6,gap:3.6,r:2.1,delay:1.7,mult:2.5,desc:'Torrents burst out in four lines from it (a + then an x). Stand in the gaps.'},
      {t:'slam',name:'Sluice Hammer',every:15,first:10,r:6,delay:1.6,mult:2.4,desc:'Telegraphed 6m hammer around it. Get out.'},
      {t:'adds',name:'Bog Swarm',at:[0.5],etype:'mirelurk',n:2,lvl:34,desc:'At 50% two Mirelurks burst out of the sluice.'}]},
    sporemother:{etype:'sporemother',lvl:37,intro:'Spore Bloom falls on you. Keep moving, and kill her Witches first!',mech:[
      {t:'pools',name:'Spore Bloom',every:10,first:4,r:4,delay:1.8,mult:2.4,count:3,desc:'Three spore circles bloom on and around you. Move out.'},
      {t:'adds',name:'Coven of the Fen',at:[0.7,0.35],etype:'fenwitch',n:2,lvl:36,desc:'At 70% and 35% two Fen Witches arrive to heal her.'},
      {t:'blinkslam',name:'Root Step',every:13,first:9,r:5.5,delay:1.5,mult:2.5,desc:'She sinks into the roots and rises next to you with a 5.5m slam. Get out.'},
      {t:'enrage',name:'Rot Bloom',at:0.2,dmg:1.5,cd:0.7,spd:1.2,desc:'Below 20% she enrages: harder, faster hits.'}]},
    anvilking:{etype:'anvilking',lvl:45,intro:'He leaps through the forge-smoke to you. Watch your back!',mech:[
      {t:'blinkslam',name:'Hammerfall Leap',every:11,first:5,r:5.5,delay:1.5,mult:2.6,desc:'He leaps right next to you and slams a 5.5m circle. Get out.'},
      {t:'pools',name:'Slag Rain',every:13,first:9,r:3.5,delay:1.8,mult:2.0,count:3,desc:'Molten slag falls on and near you. Move.'},
      {t:'adds',name:'Forge Wraiths',at:[0.5],etype:'cinderwraith',n:2,lvl:44,desc:'At 50% two Cinderwraiths flicker in.'}]},
    sovereign:{etype:'sovereign',lvl:47,intro:'When the Heartfire swells, run IN to the cool ring at its feet!',mech:[
      {t:'nova',name:'Heartfire',every:20,first:14,safe:6,r:26,delay:2.6,mult:2.7,desc:'The whole forge burns except a 6m ring around it. Run IN.'},
      {t:'cross',name:'Rift Lines',every:13,first:6,len:7,gap:3.4,r:2,delay:1.6,mult:2.5,desc:'Fire erupts in lines from it (a + then an x). Stand between them.'},
      {t:'adds',name:'Riftwarders',at:[0.6],etype:'warder',n:2,lvl:46,desc:'At 60% two Riftwarders arrive and ward each other.'},
      {t:'enrage',name:'Molten Heart',at:0.2,dmg:1.55,cd:0.7,spd:1.2,desc:'Below 20% it enrages: harder, faster hits.'}]}});
  // ---- dungeons ----
  Object.assign(DUNGEONS,{
    foundry:{id:'foundry',name:'The Drowned Foundry',sub:'Sunken Combine works under the Mirelight Fen',lvl:[34,38],minLvl:34,cap:38,rec:36,door:{x:XR.fenDoor.x,z:XR.fenDoor.z},accent:0x5fffc8,
      desc:'A Combine ore foundry the fen swallowed whole. The Sluice Warden still works the floodgates, and Mother Verdigris grows her spore-gardens in the furnace halls.',
      pal:{floor:0x3e4a40,floor2:0x323e34,wall:0x56604e,trim:0x2a3028,glow:[0x5fffc8,0xb8ff6a],fog:0x0a1410,hemi:[0xd0f0d8,0x16221a,0.66],plight:0xb8ffd8},
      rooms:[{w:20,d:18,entry:true},{w:24,d:22,packs:[[['mirelurk',34],['mirelurk',34],['sporecaller',34]]]},{w:26,d:24,packs:[[['bloatmaw',34],['fenwitch',34]],[['sporecaller',35],['mirelurk',35]]]},
        {w:30,d:28,boss:'sluicewarden'},{w:26,d:24,packs:[[['bloatmaw',36],['sporecaller',35],['fenwitch',35]]]},
        {w:26,d:24,packs:[[['mirelurk',37],['bloatmaw',36],['fenwitch',36],['sporecaller',37]]]},{w:40,d:36,boss:'sporemother',final:true}],
      loot:{sluicewarden:{items:['sluice_maul','fen_pistol','fb_hood','fb_grips']},
        sporemother:{items:['verdigris_rod','mire_bow','spore_emitter','sluice_maul','fen_rifle','fen_scatter','fen_twins','fb_hood','fb_coat','fb_grips','fb_boots','fen_lens'],extraP:0.35,relic:'verdigris_heart',relicP:0.07,disk:'mirebloom_disk',diskP:0.2},trashP:0.03},
      modes:{solo:{hp:1,dmg:1,lvl:0},group:{hp:2.6,dmg:1.3,lvl:1,size:[2,6]}}},
    heartforge:{id:'heartforge',name:'The Heartforge',sub:'A burning forge-temple in the rift under the Sundered Heights',lvl:[44,48],minLvl:44,cap:48,rec:46,door:{x:XR.sunDoor.x,z:XR.sunDoor.z},accent:0xff6a3a,
      desc:'Something old still beats in the rift under the Sundered Heights. Anvil-King Morrow tends its forges, and the Ember Sovereign is the fire itself.',
      pal:{floor:0x3a2a28,floor2:0x2e2220,wall:0x4a3430,trim:0x1e1414,glow:[0xff6a3a,0xffb347],fog:0x140806,hemi:[0xffd0b0,0x2a1210,0.7],plight:0xffb890},
      rooms:[{w:20,d:18,entry:true},{w:24,d:22,packs:[[['cinderwraith',44],['cinderwraith',44],['ashcaster',44]]]},{w:26,d:24,packs:[[['shardgolem',44],['warder',44]],[['ashcaster',45],['cinderwraith',45]]]},
        {w:30,d:28,boss:'anvilking'},{w:26,d:24,packs:[[['shardgolem',46],['ashcaster',45],['warder',45]]]},
        {w:26,d:24,packs:[[['cinderwraith',47],['shardgolem',46],['warder',46],['ashcaster',47]]]},{w:44,d:40,boss:'sovereign',final:true}],
      loot:{anvilking:{items:['anvil_cleaver','ember_pistol','hf_helm','hf_gauntlets']},
        sovereign:{items:['sovereign_rod','rift_bow','heart_emitter','anvil_cleaver','forge_rifle','forge_scatter','forge_twins','hf_helm','hf_plate','hf_gauntlets','hf_greaves','forge_lens'],extraP:0.35,relic:'ember_heart',relicP:0.07,disk:'heartflare_disk',diskP:0.2},trashP:0.03},
      modes:{solo:{hp:1,dmg:1,lvl:0},group:{hp:2.6,dmg:1.3,lvl:1,size:[2,6]}}}});
  // ---- dungeon-only uniques: a weapon for every weapon type, a 4-piece set, an ocular, a relic heart and an exclusive Weave per dungeon ----
  Object.assign(UNIQUES,{
    fen_pistol:{d:'foundry',name:'Bogglass Sidearm',slot:'weapon',wt:'pistol',lvl:35,bonus:{wpn:38,treat:46,sen:16}},
    sluice_maul:{d:'foundry',name:"Sluice Warden's Cleaver",slot:'weapon',wt:'blade',lvl:36,dmgM:1.12,bonus:{wpn:48,str:18,crit:8}},
    fen_rifle:{d:'foundry',name:'Lanternmoor Longrifle',slot:'weapon',wt:'rifle',lvl:36,dmgM:1.1,bonus:{wpn:49,sen:17,crit:9}},
    fen_scatter:{d:'foundry',name:'Foundry Scattergun',slot:'weapon',wt:'shotgun',lvl:36,bonus:{wpn:44,hp:320,power:19}},
    fen_twins:{d:'foundry',name:'Mirelight Twins',slot:'weapon',wt:'smg',lvl:36,bonus:{wpn:44,agi:18,evade:24}},
    verdigris_rod:{d:'foundry',name:'Rod of Verdigris',slot:'weapon',wt:'rod',lvl:37,bonus:{weave:56,psy:19,en:190}},
    mire_bow:{d:'foundry',name:'Mirebloom Bow',slot:'weapon',wt:'bow',lvl:37,bonus:{wpn:48,sen:18,crit:9}},
    spore_emitter:{d:'foundry',name:'Sporeheart Emitter',slot:'weapon',wt:'emitter',lvl:37,bonus:{weave:56,int:19,power:22}},
    fb_hood:{d:'foundry',name:'Fenbound Hood',slot:'head',fam:'light',lvl:36,set:'fenbound',bonus:{psy:16,weave:32,en:120}},
    fb_coat:{d:'foundry',name:'Fenbound Coat',slot:'armor',fam:'medium',lvl:37,set:'fenbound',bonus:{sta:18,hp:340,treat:30}},
    fb_grips:{d:'foundry',name:'Fenbound Grips',slot:'hands',fam:'medium',lvl:36,set:'fenbound',bonus:{agi:16,wpn:30,crit:7}},
    fb_boots:{d:'foundry',name:'Fenbound Waders',slot:'legs',fam:'medium',lvl:37,set:'fenbound',bonus:{sta:15,sen:14,run:50}},
    fen_lens:{d:'foundry',name:'Mirelight Lens',kind:'imp',slot:'eyes',ql:175,bonus:{sen:38,int:22,wpn:52,treat:44}},
    mirebloom_disk:{d:'foundry',kind:'disk',wid:'mirebloom'},
    verdigris_heart:{d:'foundry',name:'Heart of Verdigris',kind:'imp',slot:'chest',ql:190,relic:true,bonus:{sta:40,psy:27,body:56,hp:500,power:26}},
    ember_pistol:{d:'heartforge',name:'Emberbrand Sidearm',slot:'weapon',wt:'pistol',lvl:45,bonus:{wpn:50,treat:60,sen:21}},
    anvil_cleaver:{d:'heartforge',name:"Anvil-King's Cleaver",slot:'weapon',wt:'blade',lvl:46,dmgM:1.13,bonus:{wpn:62,str:23,crit:9}},
    forge_rifle:{d:'heartforge',name:'Riftline Longrifle',slot:'weapon',wt:'rifle',lvl:46,dmgM:1.1,bonus:{wpn:63,sen:22,crit:10}},
    forge_scatter:{d:'heartforge',name:'Heartforge Scattergun',slot:'weapon',wt:'shotgun',lvl:46,bonus:{wpn:57,hp:420,power:24}},
    forge_twins:{d:'heartforge',name:'Twin Embers',slot:'weapon',wt:'smg',lvl:46,bonus:{wpn:57,agi:23,evade:30}},
    sovereign_rod:{d:'heartforge',name:'Sceptre of the Sovereign',slot:'weapon',wt:'rod',lvl:47,bonus:{weave:72,psy:24,en:250}},
    rift_bow:{d:'heartforge',name:'Riftfire Bow',slot:'weapon',wt:'bow',lvl:47,bonus:{wpn:62,sen:23,crit:10}},
    heart_emitter:{d:'heartforge',name:'Molten Heart Emitter',slot:'weapon',wt:'emitter',lvl:47,bonus:{weave:72,int:24,power:28}},
    hf_helm:{d:'heartforge',name:'Forgeborn Helm',slot:'head',fam:'light',lvl:46,set:'forgeborn',bonus:{psy:20,weave:42,en:160}},
    hf_plate:{d:'heartforge',name:'Forgeborn Plate',slot:'armor',fam:'medium',lvl:47,set:'forgeborn',bonus:{sta:23,hp:440,treat:38}},
    hf_gauntlets:{d:'heartforge',name:'Forgeborn Gauntlets',slot:'hands',fam:'medium',lvl:46,set:'forgeborn',bonus:{agi:20,wpn:40,crit:8}},
    hf_greaves:{d:'heartforge',name:'Forgeborn Greaves',slot:'legs',fam:'medium',lvl:47,set:'forgeborn',bonus:{sta:19,sen:18,run:60}},
    forge_lens:{d:'heartforge',name:'Riftsight Ocular',kind:'imp',slot:'eyes',ql:225,bonus:{sen:48,int:28,wpn:66,treat:56}},
    heartflare_disk:{d:'heartforge',kind:'disk',wid:'heartflare'},
    ember_heart:{d:'heartforge',name:'Heart of the Sovereign',kind:'imp',slot:'chest',ql:240,relic:true,bonus:{sta:50,psy:34,body:70,hp:640,power:32}}});
  Object.assign(SETS,{
    fenbound:{name:'Fenbound',pieces:['fb_hood','fb_coat','fb_grips','fb_boots'],bonus:{2:{hp:300,weave:22,wpn:22},4:{power:26,crit:8,armor:190}}},
    forgeborn:{name:'Forgeborn',pieces:['hf_helm','hf_plate','hf_gauntlets','hf_greaves'],bonus:{2:{hp:390,weave:28,wpn:28},4:{power:32,crit:9,armor:240}}}});
  // dungeon-only Weaves (any profession), modelled on Stillfrost Requiem
  const sf=WEAVES.stillfrost;if(sf){
    WEAVES.mirebloom=Object.assign({},sf,{id:'mirebloom',line:'mirebloom',lvl:36,excl:'foundry',name:'Mirebloom Requiem',icon:'🍄',cost:95,mult:4.1,radius:10,root:4,color:0x5fffc8,desc:'AoE: a burst of choking spores hits every enemy within 10m for 410% damage and roots them for 4s.'});
    WEAVES.heartflare=Object.assign({},sf,{id:'heartflare',line:'heartflare',lvl:46,excl:'heartforge',name:'Heartflare',icon:'🔥',cost:110,mult:5.0,radius:11,root:4,color:0xff6a3a,desc:'AoE: the Heartforge\'s fire bursts from you, hitting every enemy within 11m for 500% damage and rooting them for 4s.'});
    for(const k of ['mirebloom','heartflare'])WEAVES[k].req=wreq('any',WEAVES[k].lvl);}
  validateDungeons();}
/* ---------- creature builders (retinted rigs from the shared library, original designs) ---------- */
function buildMirelurk(){const R=buildGrub(0x3a5a3a,0x26402a,0x5fffc8);for(let i=1;i<5;i++){const S=R.segs[i];if(S)R.det.push(part(S.sg,cq().spike,MB(i%2?0x5fffc8:0xb8ff6a),0,S.r*0.85,0,0.07,0.3,0.07));}return R;}
function buildSporecaller(){const R=buildHumanoid(0x4a5a3a,0x2a3424,0xb8ff6a,0x6a7a5a,{robe:0x3a4a30,hood:0x4a5a3a});for(let i=0;i<4;i++)part(R.g,geoIco,MB(i%2?0xb8ff6a:0x5fffc8),Math.cos(i*1.57)*0.35,2.2,Math.sin(i*1.57)*0.35,0.12,0.12,0.12);return R;}
function buildBloatmaw(){const R=buildMauler();retint(R.g,0x4a6a3a,0.75,0xb8ff6a);for(let i=0;i<5;i++)part(R.g,geoIco,MS([0x6a8a4a,0x5a7a3a,0x8aaa5a][i%3]),(i%3-1)*0.5,2.0+(i>2?0.2:0),-0.2-(i>2?0.4:0),0.35,0.3,0.35);return R;}
function buildMireling(){const R=buildSkitter();retint(R.g,0x5a7a4a,0.8,0x5fffc8);part(R.g,geoIco,MB(0xb8ff6a),0,1.0,-0.2,0.3,0.35,0.3);return R;}
function buildFenwitch(){const R=buildHumanoid(0x5a4a5a,0x3a5a4a,0x5fffc8,0x7a8a6a,{robe:0x3a3040,hair:'long',hairc:0x8aaa7a});const h=part(R.g,new THREE.TorusGeometry(0.32,0.05,4,16),MB(0x5fffc8),0,2.3,0,1,1,1);h.rotation.x=Math.PI/2;return R;}
function buildCinderwraith(){const R=buildHound(0x2a1a1a,0x140c0c,0xff6a3a,{lean:0.85,ears:0.2,tail:0.8});for(let i=0;i<3;i++)part(R.g,geoCone,MB(i%2?0xffb347:0xff5a1a),(i-1)*0.2,1.0,-0.2-i*0.15,0.08,0.45,0.08);return R;}
function buildAshcaster(){const R=buildHumanoid(0x3a2a2a,0x6a3020,0xff8a3a,0x5a4a44,{robe:0x2a1e1e,hood:0x3a2a2a});for(let i=0;i<5;i++){const a=i*1.257;part(R.g,geoCone,MB(0xff8a3a),Math.cos(a)*0.22,2.15,Math.sin(a)*0.22,0.06,0.3,0.06);}return R;}
function buildShardgolem(){const R=buildGolem(0x2a2228,0x141014,0xff6a3a);for(let i=0;i<4;i++)part(R.g,geoCone,M(0x1a1418),(i-1.5)*0.4,2.7,-0.3,0.18,0.9,0.18);return R;}
function buildWarder(){const R=buildHumanoid(0x4a3a3a,0x2a1a1a,0xff8a3a,0x5a4a4a,{heavy:1,bulk:1.08,helm:0x3a2a2a});part(R.g,geoBox,M(0x5a3a30),0,1.25,0.3,0.9,1.3,0.1);part(R.g,geoBox,MB(0xff8a3a),0,1.35,0.36,0.5,0.5,0.04);return R;}
function buildSluicewarden(){const R=buildGolem(0x4a5a50,0x26302a,0x5fffc8);part(R.g,geoBox,MB(0x5fffc8),0,1.6,0.9,0.8,0.1,0.06);for(let i=0;i<3;i++)part(R.g,geoCyl0(),M(0x3a4a40),(i-1)*0.5,2.6,-0.4,0.15,0.8,0.15);return R;}
function buildSporemother(){const R=buildHumanoid(0x3a4a30,0x5fffc8,0xb8ff6a,0x6a7a5a,{robe:0x2a3424,hair:'long',hairc:0x6a8a4a,bulk:1.05});for(let i=0;i<6;i++){const a=i*1.047;part(R.g,geoIco,MB(i%2?0xb8ff6a:0x5fffc8),Math.cos(a)*0.4,2.3+(i%2)*0.15,Math.sin(a)*0.4,0.14,0.14,0.14);}return R;}
function buildAnvilking(){const R=buildHumanoid(0x3a2a24,0xff6a3a,0xffb347,0x6a5044,{heavy:1,bulk:1.12,helm:0x2a1e1a});part(R.armR,geoBox,M(0x2a2228),0,-0.95,0.1,0.35,0.35,0.6);part(R.g,geoBox,MB(0xff6a3a),0,1.4,0.34,0.4,0.25,0.04);return R;}
function buildSovereign(){const R=buildMauler();retint(R.g,0x2a1a1a,0.8,0xff6a3a);for(let i=0;i<5;i++)part(R.g,geoCone,MB([0xff6a3a,0xffb347,0xff3a1a][i%3]),(i-2)*0.4,2.9,-0.2,0.16,1.0,0.16);part(R.g,geoIco,MB(0xffb347),0,2.0,1.2,0.35,0.35,0.35);return R;}
/* ---------- hubs: Lanternmoor Station (fen) and Sunderwatch (heights): quartermaster + contract terminal; bank/Save Point/Conduit come from OUTPOSTS/BANK_SPOTS ---------- */
const XHUBS=[];
(function buildXHubs(){
  const defs=[{id:'lanternmoor',vn:'Quartermaster Ide Fennick',tn:'Lanternmoor Contracts',title:'LANTERNMOOR QUARTERMASTER',min:31,col:[0x4a5a46,0x2a3428,0x5fffc8,0x9aa888],npc:[0x4a5a46,0x2a3428,0x5fffc8,0x8a7a6a]},
    {id:'sunderwatch',vn:'Quartermaster Bren Askari',tn:'Sunderwatch Contracts',title:'SUNDERWATCH QUARTERMASTER',min:41,col:[0x4a3a3a,0x2a1e1e,0xff6a3a,0x8a6a62],npc:[0x5a3a30,0x2a1a1a,0xffb347,0x8a6a5a]}];
  for(const d of defs){const o=OUTPOSTS.find(q=>q.id===d.id);if(!o)continue;const y=heightAt(o.x,o.z);const g=new THREE.Group();g.position.set(o.x,y,o.z);
    const H={vend:{x:o.x+8,z:o.z+1},term:{x:o.x,z:o.z-8.5}};
    // beacon mast: fen lantern-tower / heights ember spire
    part(g,geoBox,M(d.col[0]),-8,4.5,-7,1.6,9,1.6);part(g,geoBox,M(d.col[1]),-8,9.2,-7,3.2,0.4,3.2);part(g,geoIco,MB(d.col[2]),-8,10.1,-7,0.6,0.6,0.6);
    boxes.push({x0:o.x-8.8,x1:o.x-7.2,z0:o.z-7.8,z1:o.z-6.2,y0:y,y1:y+9.5});
    for(const [x,z] of [[-10,7],[10,-7],[7,10],[-7,-10],[11,5],[-3,11]]){part(g,geoBox,M(d.col[1]),x,1.3,z,0.25,2.6,0.25);part(g,geoIco,MB(d.col[2]),x,2.8,z,0.3,0.3,0.3);}
    const v=H.vend;part(g,geoBox,M(d.col[0]),v.x-o.x+1.4,1.0,v.z-o.z,0.9,2,3.2);part(g,geoBox,M(d.col[3]),v.x-o.x+1.4,2.2,v.z-o.z,1.6,0.25,3.8);part(g,geoBox,MB(d.col[2]),v.x-o.x+0.9,1.5,v.z-o.z,0.05,0.4,2);
    boxes.push({x0:v.x+0.9,x1:v.x+1.9,z0:v.z-1.6,z1:v.z+1.6,y0:y,y1:y+2.3});
    const t=H.term;part(g,geoBox,M(0x2b3742),t.x-o.x,1.0,t.z-o.z-0.3,1.8,2,0.5);part(g,geoBox,MB(d.col[2]),t.x-o.x,1.5,t.z-o.z-0.04,1.4,0.9,0.05);
    boxes.push({x0:t.x-0.9,x1:t.x+0.9,z0:t.z-0.55,z1:t.z-0.05,y0:y,y1:y+2});
    scene.add(g);const b=makeBeam(d.col[2],40,0.6,0.25);b.position.set(o.x-8,y,o.z-7);
    const Q=buildHumanoid(d.npc[0],d.npc[1],d.npc[2],d.npc[3],{npc:1});Q.g.position.set(v.x,heightAt(v.x,v.z),v.z);Q.g.rotation.y=Math.atan2(o.x-v.x,o.z-v.z);scene.add(Q.g);circles.push({x:v.x,z:v.z,r:0.6});
    XHUBS.push(d.id);
    // stock: Epic weapon + armour one level up and a top-QL implant; from the hub's band two Ascendant pieces, an Ascendant implant and a tier-matched Weave Disk
    HUBS.push({id:d.id,o,vend:H.vend,term:H.term,vn:d.vn,tn:d.tn,title:d.title,
      stock(list,L){list.push(genItem(L+1,'weapon',3,{wt:pick(wtAff(P.prof))}),genItem(L+1,pick(ASLOTS),3,{fam:PROF_FAM[P.prof]}),genImplant(Math.min(IMPQL_MAX(),L*5),null,3));
        if(L>=d.min)list.push(genItem(L,'weapon',ASC,{wt:pick(wtAff(P.prof))}),genItem(L,pick(ASLOTS),ASC,{fam:PROF_FAM[P.prof]}),genImplant(Math.min(IMPQL_MAX(),L*5-2),null,ASC));
        const ws=Object.values(WEAVES).filter(w=>w.lvl>=d.min&&w.lvl<=L+1&&(w.prof===P.prof||w.prof==='any')&&!w.excl&&!w.rare&&!w.starter);if(ws.length&&typeof genDisk==='function'){const dk=genDisk(pick(ws).id);if(dk)list.push(dk);}}});}})();
/* ---------- regions: camps, props and fen water ---------- */
// camps (three per corner, six per region); level follows depth into the corner
const XREG=[
  ['fen',FB,[[-745,625,'Lanternmire',['mirelurk','mirelurk','sporecaller']],[-625,745,'Glowcap Shallows',['sporecaller','fenwitch','mirelurk']],[-772,742,'Drowned Steps',['bloatmaw','mirelurk','fenwitch','sporecaller']],
    [-745,-628,'Verdigris Pools',['bloatmaw','sporecaller','mirelurk']],[-628,-750,'Sunken Gantry',['mirelurk','fenwitch','bloatmaw']],[-776,-772,'The Rotmere',['bloatmaw','bloatmaw','fenwitch','sporecaller']]],fenLv],
  ['sunder',SB,[[745,625,'Ashen Shelf',['cinderwraith','cinderwraith','ashcaster']],[625,745,'Glassfire Ridge',['ashcaster','warder','cinderwraith']],[772,742,'Obsidian Steps',['shardgolem','cinderwraith','warder','ashcaster']],
    [745,-628,'Riftmouth',['shardgolem','ashcaster','cinderwraith']],[628,-750,'Embertooth',['cinderwraith','warder','shardgolem']],[776,-772,'The Burning Spine',['shardgolem','shardgolem','warder','ashcaster']]],sunderLv]];
(function xrCamps(){for(const [rid,bi,list,lvf] of XREG)list.forEach(([x,z,name,mix],i)=>{const L=lvf(x,z);const lo=BIOMES[bi].lv[0];
  const c={id:'xr_'+rid+i,name,x,z,lv:[clamp(L-1,lo,MAXLVL),clamp(L,lo,MAXLVL)],n:mix.length>3?7:6,mix,biome:bi,gate:undefined};initCamp(c);CAMPS.push(c);});})();
(function xrProps(){const R=rng32(5521);const rr=(a,b)=>a+R()*(b-a);const pk=a=>a[Math.floor(R()*a.length)];const o=new THREE.Object3D(),col=new THREE.Color();const W=new Float32Array(NB);
  const near=(x,z,d)=>CAMPS.some(c=>Math.hypot(c.x-x,c.z-z)<d)||OUTPOSTS.some(q=>Math.hypot(q.x-x,q.z-z)<q.r+12)||Object.values(DUNGEONS).some(q=>Math.hypot(q.door.x-x,q.door.z-z)<16);
  function spots(bi,n,minW,pred){const out=[];let tries=0;while(out.length<n&&tries<n*30){tries++;const sx=bi===FB?-1:1,sz=R()<0.5?-1:1;const x=sx*rr(560,HALF-60),z=sz*rr(560,HALF-60);biomeW(x,z,W);if(W[bi]<minW||near(x,z,13))continue;if(pred&&!pred(x,z))continue;out.push([x,z]);}return out;}
  function emit(type,geo,mat,items){const buckets={};for(const it of items){const bx=clamp(Math.floor((it.x+HALF)/PB_S),0,PB_N-1),bz=clamp(Math.floor((it.z+HALF)/PB_S),0,PB_N-1);(buckets[bx+','+bz]=buckets[bx+','+bz]||[]).push(it);}
    for(const k in buckets){const L=buckets[k];const im=new THREE.InstancedMesh(geo,mat,L.length);L.forEach((it,i)=>{o.position.set(it.x,it.y,it.z);o.rotation.set(it.rx||0,it.ry||0,it.rz||0);o.scale.set(it.sx,it.sy,it.sz);o.updateMatrix();im.setMatrixAt(i,o.matrix);im.setColorAt(i,col.setHex(it.c));if(it.cr)circles.push({x:it.x,z:it.z,r:it.cr});});
      im.frustumCulled=false;const [bx,bz]=k.split(',').map(Number);im.userData={x0:bx*PB_S-HALF,z0:bz*PB_S-HALF,type};scene.add(im);PROPB.push(im);}}
  const lam=e=>new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true,emissive:e||0});
  const gOct=new THREE.OctahedronGeometry(1,0),gDod=new THREE.DodecahedronGeometry(1,0),gCyl=new THREE.CylinderGeometry(0.55,1,1,7),gTrunk=new THREE.CylinderGeometry(0.16,0.26,1,6),gDisc=new THREE.CylinderGeometry(1,1,0.12,10),gCap=new THREE.SphereGeometry(1,8,4,0,Math.PI*2,0,Math.PI/2);
  // Mirelight Fen: glowing mushroom caps, drowned trees, reeds, sunken Combine wrecks
  const shr=spots(FB,170,0.7,(x,z)=>heightAt(x,z)>WATER_Y+0.2).map(([x,z])=>({x,z,h:rr(1,4.5),y:heightAt(x,z),ry:rr(0,6)}));
  emit('mushstem',gTrunk,lam(),shr.map(p=>({x:p.x,y:p.y+p.h/2,z:p.z,sx:p.h*0.5,sy:p.h,sz:p.h*0.5,ry:p.ry,c:0xc8c8a8,cr:p.h>3?0.5:0})));
  emit('mushcap',gCap,new THREE.MeshBasicMaterial({color:0xffffff}),shr.map(p=>({x:p.x,y:p.y+p.h,z:p.z,sx:p.h*0.45,sy:p.h*0.25,sz:p.h*0.45,ry:p.ry,c:pk([0x5fffc8,0xb8ff6a,0x7fe8ff])})));
  const dt=spots(FB,140,0.65).map(([x,z])=>({x,z,h:rr(4,9),y:heightAt(x,z),l:rr(-0.25,0.25)}));
  emit('fentrunk',gTrunk,lam(),dt.map(p=>({x:p.x,y:p.y+p.h/2,z:p.z,sx:1.4,sy:p.h,sz:1.4,rz:p.l,c:0x2a2a22,cr:0.45})));
  emit('fencrown',gDod,lam(),dt.map(p=>({x:p.x,y:p.y+p.h,z:p.z,sx:rr(1.6,2.6),sy:rr(0.8,1.3),sz:rr(1.6,2.6),c:pk([0x3a4a2a,0x4a5a30,0x2e3a24])})));
  emit('reed',geoCone,lam(),spots(FB,260,0.6).map(([x,z])=>{const h=rr(0.8,2);return {x,y:heightAt(x,z)+h/2,z,sx:0.3,sy:h,sz:0.3,rx:rr(-0.2,0.2),c:pk([0x6a7a3a,0x8a8a4a,0x5a6a32])};}));
  emit('fenwreck',geoBox,lam(),spots(FB,30,0.75).map(([x,z])=>{const w=rr(3,7);return {x,y:heightAt(x,z)+0.4,z,sx:w,sy:rr(1.2,2.6),sz:w*rr(0.3,0.5),ry:rr(0,6),rz:rr(-0.4,0.4),c:pk([0x4a5a50,0x3a4a40]),cr:w*0.45};}));
  // Sundered Heights: obsidian spikes, basalt columns, ember vents, ash boulders
  emit('obsidian',gOct,lam(0x1a0604),spots(SB,220,0.7).map(([x,z])=>{const h=rr(3,11),w=rr(0.6,1.6);return {x,y:heightAt(x,z)+h*0.4,z,sx:w,sy:h,sz:w,ry:rr(0,6),rx:rr(-0.2,0.2),c:pk([0x1a1418,0x2a2228,0x3a2a30]),cr:h>5?w*0.8:0};}));
  emit('basalt',gCyl,lam(),spots(SB,90,0.7).map(([x,z])=>{const h=rr(4,12);return {x,y:heightAt(x,z)+h/2-0.5,z,sx:rr(0.8,1.6),sy:h,sz:rr(0.8,1.6),ry:rr(0,6),c:pk([0x3a3034,0x2e2628]),cr:1.1};}));
  emit('embervent',gDisc,new THREE.MeshBasicMaterial({color:0xffffff}),spots(SB,80,0.75).map(([x,z])=>{const s=rr(1.2,3.2);return {x,y:heightAt(x,z)+0.05,z,sx:s,sy:1,sz:s*rr(0.6,1),ry:rr(0,6),c:pk([0xff5a1a,0xff7a2a,0xffb347])};}));
  emit('ashboulder',gDod,lam(),spots(SB,200,0.6).map(([x,z])=>{const s=rr(0.8,3.4);return {x,y:heightAt(x,z)+s*0.25,z,sx:s*rr(0.9,1.4),sy:s*rr(0.5,1),sz:s*rr(0.9,1.4),rx:rr(0,3),ry:rr(0,3),c:pk([0x4a3a38,0x3a2c2a,0x5a4644]),cr:s>2?s*0.9:0};}));})();
// fen water: separate merged meshes for the two west corners (keeps the oasis water mesh's culling box small)
const XWATER=(function(){const out=[];const W=new Float32Array(NB);for(const sz of [1,-1]){const pos=[];for(let iy=0;iy<SEG;iy++){const z=iy*CELL-HALF;if(z*sz<540)continue;for(let ix=0;ix<SEG;ix++){const x=ix*CELL-HALF;if(x>-540)continue;
      const lo=Math.min(HG[iy*N1+ix],HG[iy*N1+ix+1],HG[(iy+1)*N1+ix],HG[(iy+1)*N1+ix+1]);if(lo>=WATER_Y)continue;biomeW(x+2,z+2,W);if(W[FB]<0.35)continue;const x1=x+CELL,z1=z+CELL,y=WATER_Y;pos.push(x,y,z,x,y,z1,x1,y,z,x1,y,z,x,y,z1,x1,y,z1);}}
    if(!pos.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x2a8a78,transparent:true,opacity:0.75,depthWrite:false,emissive:0x0a2a20}));m.renderOrder=1;scene.add(m);g.computeBoundingBox();m.userData.bb=g.boundingBox;out.push(m);}return out;})();
let xwAcc=0;function xrCull(dt){if(DUN)return;xwAcc+=dt;if(xwAcc<0.5)return;xwAcc=0;const cx=camera.position.x,cz=camera.position.z;for(const m of XWATER){const bb=m.userData.bb;const dx=Math.max(bb.min.x-cx,0,cx-bb.max.x),dz=Math.max(bb.min.z-cz,0,cz-bb.max.z);m.visible=Math.hypot(dx,dz)<260;}}
/* ---------- missions / guards in the new regions ---------- */
function xrTypes_j(lv){return lv>=41?['cinderwraith','ashcaster','shardgolem','warder']:['mirelurk','sporecaller','bloatmaw','fenwitch'];}
function xrSpot_j(lv){const sun=lv>=41;const base=sun?41:31;const sz=lv-base>=5?-1:1;const k=clamp(((lv-base)%5)/4,0,1);for(let i=0;i<20;i++){const a=(sz>0?45:-45)*Math.PI/180+rand(-0.35,0.35);const r=890+k*200+rand(-20,20);const x=(sun?1:-1)*Math.abs(Math.cos(a)*r),z=Math.sin(a)*r;if(Math.max(Math.abs(x),Math.abs(z))<790)return {x,z};}return {x:(sun?1:-1)*720,z:sz*700};}
function xrRegionName_j(lv){return lv>=41?'the Sundered Heights':'the Mirelight Fen';}
/* ---------- tier-locked items: gear by item level, implants by QL/5, Weave Disks by the Weave's level ---------- */
function itemTier(it){if(!it||it.kind==='cloth')return 1;if(isDisk(it)){const w=WEAVES[it.wid];return w?tierOfLv(w.lvl):1;}if(isImp(it))return tierOfLv(Math.ceil((it.ql||1)/5));return tierOfLv(it.lvl||1);}
function tierOk(it,c){return itemTier(it)<=tierOfLv((c||P).level);}
function tierName(t){const d=TIERS[t];return d?'Tier '+t+' · '+d.n:'Tier '+t;}
function tierMiss(it){const t=itemTier(it);return 'Requires Tier '+t+' ('+TIERS[t].n+', level '+TIERS[t].lv+'+)';}
/* ---------- Tier up: banner, screen effect, sound and a log line ---------- */
SFX.tierup=()=>{[392,523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>tone(f,0.34,'triangle',0.075),i*95));setTimeout(()=>tone(1568,0.6,'sine',0.06),640);};
const TIERUP={last:null};
function tierUp_j(t,lv){const d=TIERS[t];if(!d)return;TIERUP.last={t,lv,at:Date.now()};const nx=TIERS[t+1];
  log('<b style="color:#ffd25a">✦ TIER UP: Tier '+t+' · '+esc(d.n)+'</b> at level '+lv+'. Attribute caps +'+(d.a-TIERS[t-1].a)+', skill caps +'+(d.s-TIERS[t-1].s)+'; Tier '+t+' gear, implants and Weaves unlocked.'+(nx?' Next: Tier '+(t+1)+' ('+esc(nx.n)+') at level '+nx.lv+'.':''));
  let el=$('#tierFx');if(!el){el=document.createElement('div');el.id='tierFx';document.body.appendChild(el);}
  el.innerHTML='<div class="tfx-ring"></div><div class="tfx-box"><div class="tfx-k">TIER UP</div><div class="tfx-t">Tier '+t+'</div><div class="tfx-n">'+esc(d.n)+'</div><div class="tfx-s">Higher attribute and skill caps · Tier '+t+' gear, implants and Weaves unlocked</div></div>';
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(TIERUP.tm);TIERUP.tm=setTimeout(()=>el.classList.remove('on'),4200);
  try{SFX.tierup();}catch(e){}if(P&&P.pos){ringFx(P.pos.x,P.pos.z,0xffd25a,10,1.6);ringFx(P.pos.x,P.pos.z,0xffffff,6,1.0);}
  setTimeout(()=>{if(state==='play')banner('✦ TIER '+t+' · '+d.n.toUpperCase(),'Caps raised · Tier '+t+' gear, implants and Weaves unlocked');},2700);}
/* ---------- perks: a 3-rank Mastery per line from Tier 3 (needs 6 points in the line) so points past ~Lv 45 have a home ---------- */
(function(){const L=c=>(c&&c.level)||1,R=Math.round;const def=(id,line,name,icon,mods,txt)=>{PERKS[id]={id,line,tier:4,name,icon,ranks:3,mods,txt,ab:null,tierReq:3};};
  def('m_grit','grit','Bulwark Mastery','🗿',(r,c)=>({hp:R(r*(4+L(c))),armor:15*r}),'+{hp} max health, +{armor} armour');
  def('m_dust','dust','Windrunner Mastery','🌬️',r=>({agi:3*r,evade:5*r}),'+{agi} Agility, +{evade} Evasion');
  def('m_well','well','Deepwell Mastery','🌊',(r,c)=>({en:R(r*(4+L(c)/2)),weave:3*r}),'+{en} max energy, +{weave} Weave Craft');
  def('m_ironclad','ironclad','Bastion Mastery','🏰',r=>({dr:r,wpn:4*r}),'+{dr}% damage reduction, +{wpn} Weapon Handling');
  def('m_hexcraft','hexcraft','Hexweave Mastery','🔮',r=>({weave:4*r,power:r}),'+{weave} Weave Craft, +{power}% power');
  def('m_surgery','surgery','Lifeline Mastery','💗',(r,c)=>({treat:4*r,hp:R(r*(3+L(c)/2))}),'+{treat} Treatment, +{hp} max health');
  def('m_overload','overload','Meltdown Mastery','☢️',r=>({power:2*r,crit:r}),'+{power}% power, +{crit}% crit');
  def('m_ghost','ghost','Phantom Mastery','👻',r=>({crit:r,evade:4*r}),'+{crit}% crit, +{evade} Evasion');
  def('m_forge','forge','Foundry Mastery','🏭',r=>({fab:4*r,dr:r}),'+{fab} Fabrication, +{dr}% damage reduction');
  def('m_primal','primal','Wildheart Mastery','🦁',r=>({str:3*r,agi:2*r}),'+{str} Strength, +{agi} Agility');})();
function tierExports(){return {bandCapMsg,reqChips,reqHtml,itemLines,raise,capMsgFor,tierBar,equip,learnDisk,TIERS,TIER_MAX,tierOfLv,pTier,itemTier,tierOk,tierMiss,tierName,tierUp,TIERUP,XR,fenLv,sunderLv,XREG,XHUBS,XWATER,xrSpot,xrTypes,expansionData,MAXLVL,spGain,spTotal,skillCap,BIOMES,FB,SB,biomeIdx,regionAt,TEAMD,TD_BANDS,bandCapOf,normTG};}
/* ---------- dungeon looks (game24 DTHEME/DLAY): the Drowned Foundry is flooded Combine steel lit by spore-glow; the Heartforge is basalt over lava ---------- */
DTHEME.foundry={tex:'panel',texS:0.22,wallH:8,floor:0x56645a,floor2:0x4a584e,wall:0x667466,trim:0x2a3a30,acc:0x5fffc8,glow:[0x5fffc8,0xb8ff6a,0x7fe8ff],crack:0x5fffc8,crackK:0.8,
  fog:0x2a4038,fogN:30,fogF:120,hemi:[0xd8f0e0,0x2a3a30,0.78],dir:0.4,light:[0x5fffc8,0xb8ff6a,0x9fe8ff],pit:0x5fffc8,water:0x2a8a78,
  part:{col:0xb8ff6a,size:0.16,vy:0.18,drift:0.3,add:true},shaft:0xc8ffe8,sky:[0x1e3a30,0x8ad8b0],name:'Flooded Combine foundry, spore-glow and rusting sluices'};
DTHEME.heartforge={tex:'basalt',texS:0.18,wallH:9,floor:0x4a3634,floor2:0x3e2c2a,wall:0x56403c,trim:0x1e1414,acc:0xff6a3a,glow:[0xff6a3a,0xffb347,0xff3a1a],crack:0xff4a1a,crackK:1.2,
  fog:0x3a1a14,fogN:28,fogF:115,hemi:[0xffc8a8,0x3a1810,0.85],dir:0.4,light:[0xff6a2a,0xffb347,0xff3a1a],pit:0xff4a1a,water:0xff5a1a,lava:true,
  part:{col:0xffa04a,size:0.2,vy:1.0,drift:0.35,add:true},shaft:0xffc890,sky:[0x5a140a,0xff6a2a],name:'Basalt forge-temple over a burning rift'};
DLAY.foundry=[{o:0,s:'hall',w:28,d:24,nm:'Sluice Lock'},
  {c:'gate',len:12},{o:1,s:'machine',w:36,d:30,nm:'Ore Floor',wing:{side:-1,kind:'loot',w:16,d:14}},
  {c:'flood',len:14},{n:'Drowned Smeltery',s:'flooded',w:36,d:34,y:-3,pk:1},
  {c:'corr',len:12},{o:2,s:'machine',w:38,d:32,nm:'Pump Hall',bal:1,wing:{side:-1,kind:'secret',w:14,d:12}},
  {c:'plates',len:12},{o:3,s:'arena',w:34,d:32,sc:true,nm:'The Floodgates'},
  {c:'corr',len:14},{o:4,s:'flooded',w:36,d:30,y:-3,nm:'Spore Gardens',wing:{side:1,kind:'elite',w:16,d:14}},
  {c:'gate',len:12},{o:5,s:'machine',w:36,d:30,nm:'Furnace Gallery'},
  {c:'corr',len:12},{o:6,s:'arena',w:44,d:40,nm:'Verdigris Bloom'}];
DLAY.heartforge=[{o:0,s:'hall',w:30,d:24,nm:'Rift Gate'},
  {c:'corr',len:12},{o:1,s:'forge',w:40,d:32,y:-3,nm:'Ember Forges',wing:{side:-1,kind:'loot',w:16,d:14}},
  {c:'bridge',len:18},{o:2,s:'forge',w:38,d:30,nm:'Slag Works',bal:-1,wing:{side:-1,kind:'secret',w:14,d:12}},
  {c:'gate',len:12},{o:3,s:'arena',w:36,d:34,sc:true,nm:"The Anvil-King's Hall"},
  {c:'corr',len:12},{n:'The Burning Rift',s:'chasm',w:40,d:40,pk:1},
  {c:'vents',len:14},{o:4,s:'forge',w:40,d:32,nm:'Upper Crucibles',wing:{side:1,kind:'elite',w:16,d:14}},
  {c:'corr',len:12},{o:5,s:'forge',w:38,d:30,nm:'Heart Antechamber'},
  {c:'bridge',len:18},{o:6,s:'arena',w:48,d:44,nm:'The Heartforge'}];
