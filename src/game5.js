/* ================= DUNGEONS (instanced) =================
  Data-driven so future team missions can reuse them:
  - DUNGEONS[id].rooms: linear chain of rooms (built procedurally from boxes); each room may have trash packs or a boss.
  - DUNGEONS[id].modes: 'solo' (now) and 'group' (future: AI alts from the roster via partySnapshot()) scale hp/dmg/levels.
  - BOSSES[key].mech: declarative mechanics {t:'slam'|'pools'|'adds'|'enrage', ...}; telegraphs target dunTargets() (party-ready).
  - Loot: UNIQUES (Legendary/Relic, dungeon-only) referenced by DUNGEONS[id].loot. Never in genItem/trader/missions/world drops. */
function retint_v1(g,col,k,glow){const c=new THREE.Color(col);g.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(m.isMeshLambertMaterial){o.material=M(m.color.clone().lerp(c,k).getHex());}else if(glow!=null&&m.isMeshBasicMaterial){o.material=MB(glow);}});return g;}
function buildVSkitter_v1(){const R=buildSkitter();retint(R.g,0x2f7f9a,0.6,0x5ff2ff);for(let i=0;i<3;i++)part(R.g,geoCone,MB(0x7ff6ff),(i-1)*0.25,1.0,-0.2-i*0.15,0.09,0.45,0.09);return R;}
function buildMiner_v1(){const R=buildHumanoid(0x4a4f52,0x2e3436,0x5ff2ff,0x5a6a70);part(R.g,geoCone,MB(0x5ff2ff),0.35,1.75,-0.1,0.1,0.4,0.1).rotation.z=-0.4;part(R.g,geoBox,M(0xc8a040),0,2.05,0,0.48,0.14,0.48);part(R.g,geoBox,MB(0xfff2a0),0,2.05,0.25,0.12,0.08,0.03);return R;}
function buildForeman_v1(){const R=buildMauler();retint(R.g,0x8a5a2a,0.55,0xffb347);part(R.g,geoBox,M(0xc8a040),0,2.45,0.9,0.9,0.22,0.9);return R;}
function buildMatriarch_v1(){const R=buildSkitter();retint(R.g,0x4a2266,0.65,0x5ff2ff);for(let i=0;i<5;i++)part(R.g,geoCone,MB(i%2?0xb46bff:0x7ff6ff),(i-2)*0.22,1.05,-0.3-Math.abs(i-2)*0.1,0.1,0.6,0.1);return R;}
function buildSentry_v1(){const R=buildHumanoid(0xd8d2c4,0x4f6b80,0x5ff2ff,0x9aa4ad);part(R.g,geoBox,M(0x4f6b80),0.5,1.62,0,0.28,0.14,0.46);part(R.g,geoBox,M(0x4f6b80),-0.5,1.62,0,0.28,0.14,0.46);return R;}
function buildEnforcer_v1(){const R=buildHumanoid(0x5a1e1e,0x2a1010,0xff3b2f,0x222222);part(R.g,geoBox,M(0x3a3a3a),0.52,1.64,0,0.34,0.18,0.56);part(R.g,geoBox,M(0x3a3a3a),-0.52,1.64,0,0.34,0.18,0.56);R.gun.scale.set(0.06,0.18,1.0);R.gun.material=M(0xb0b8c0);return R;}
function buildIxo_v1(){const R=buildHumanoid(0x2b3742,0xd8d2c4,0xff9a2a,0x111111);part(R.g,geoBox,MB(0xff9a2a),0.5,1.64,0,0.34,0.16,0.56);part(R.g,geoBox,MB(0xff9a2a),-0.5,1.64,0,0.34,0.16,0.56);part(R.g,geoBox,M(0xd8d2c4),0,2.06,0,0.5,0.18,0.5);R.gun.scale.set(0.07,0.2,1.2);R.gun.material=MB(0xffd25a);return R;}
function buildCustodian_v1(){const R=buildMauler();retint(R.g,0x8a96a0,0.75,0x5ff2ff);part(R.g,geoBox,MB(0xff3b2f),0,2.6,0.2,0.6,0.12,0.6);return R;}
Object.assign(ETYPES,{
  vskitter:{name:'Vein Skitter',slow:{mul:0.75,dur:2.5,name:'Venom-slowed'},hp:36,dmg:6,atkCd:1.1,range:2.0,speed:6.6,aggro:14,xp:1.1,ranged:false,hitR:1.0,h:1.1,build:buildVSkitter,scale:1},
  miner:{name:'Hollowed Miner',hp:72,dmg:10,atkCd:1.6,range:2.3,speed:5.0,aggro:15,xp:1.35,ranged:false,hitR:0.7,h:1.9,build:buildMiner,scale:1.05},
  foreman:{name:'Foreman Grusk',hp:450,dmg:11,atkCd:2.0,range:3.8,speed:4.6,aggro:16,xp:6,ranged:false,hitR:1.6,h:2.6,build:buildForeman,scale:1.55},
  matriarch:{name:'The Vein Matriarch',hp:900,dmg:12,atkCd:1.8,range:4.6,speed:4.8,aggro:18,xp:10,ranged:false,hitR:1.0,h:1.1,build:buildMatriarch,scale:3.0},
  sentry:{name:'Combine Sentry',hp:62,dmg:10,atkCd:1.7,range:18,speed:4.6,aggro:19,xp:1.35,ranged:true,hitR:0.7,h:1.9,build:buildSentry,scale:1},
  enforcer:{name:'Ashborn Enforcer',hp:96,dmg:14,atkCd:2.0,range:2.6,speed:5.0,aggro:15,xp:1.5,ranged:false,hitR:0.75,h:1.9,build:buildEnforcer,scale:1.12},
  ixo:{name:'Warden-Prime Ixo',hp:650,dmg:13,atkCd:1.7,range:3.4,speed:5.2,aggro:17,xp:7,ranged:false,hitR:0.8,h:1.9,build:buildIxo,scale:1.75},
  custodian:{name:'Custodian Engine K-9',hp:1100,dmg:14,atkCd:2.1,range:4.8,speed:4.4,aggro:19,xp:12,ranged:false,hitR:1.6,h:2.6,build:buildCustodian,scale:2.2},
  // ---- Duskcrown Highlands (Lv 11-20): each new type has its own behaviour (ai: see AIX) ----
  stalker:{name:'Glint Stalker',hi:true,ai:'blink',hp:52,dmg:8,atkCd:1.2,range:2.2,speed:6.6,aggro:16,xp:1.35,ranged:false,hitR:0.8,h:1.2,build:buildStalker,scale:0.78,desc:'Blinks behind its prey'},
  shardcaller:{name:'Shardcaller',hi:true,ai:'kite',hp:44,dmg:8,atkCd:2.0,range:19,speed:4.8,aggro:20,xp:1.4,ranged:true,hitR:0.7,h:1.9,build:buildShardcaller,scale:0.82,desc:'Keeps its distance and drops Shard Fall circles'},
  brute:{name:'Crag Brute',hi:true,ai:'charge',slow:{mul:0.7,dur:2.5,name:'Staggered'},hp:120,dmg:15,atkCd:2.3,range:3.2,speed:4.6,aggro:15,xp:1.8,ranged:false,hitR:1.4,h:2.6,build:buildBrute,scale:0.86,desc:'Winds up, then charges across the field'},
  tender:{name:'Choir Tender',hi:true,ai:'heal',hp:40,dmg:5,atkCd:2.2,range:17,speed:4.8,aggro:18,xp:1.5,ranged:true,hitR:0.7,h:1.9,build:buildTender,scale:0.8,desc:'Heals the most wounded enemy nearby. Kill it first'},
  cantor:{name:'Cantor Vey, the Hollow Voice',hp:900,dmg:13,atkCd:1.7,range:3.6,speed:5.2,aggro:18,xp:9,ranged:false,hitR:0.8,h:1.9,build:buildCantor,scale:1.5},
  hymnwarden:{name:'The Hymnwarden',hp:1100,dmg:14,atkCd:2.1,range:4.8,speed:4.4,aggro:19,xp:11,ranged:false,hitR:1.6,h:2.6,build:buildHymnwarden,scale:1.75},
  choirmother:{name:'The Choirmother',hp:1400,dmg:15,atkCd:1.9,range:4.8,speed:4.6,aggro:20,xp:16,ranged:false,hitR:1.0,h:1.1,build:buildChoirmother,scale:2.6},
  chordpylon:{name:'Resonance Pylon',hp:150,dmg:6,atkCd:2.2,range:24,speed:0,aggro:30,xp:0.5,ranged:true,hitR:0.9,h:3,build:buildChordPylon,scale:1},
  // ---- Rimefall Expanse (Lv 21-30, Build C): four more behaviours (ai: see AIX) ----
  burrower:{name:'Rime Burrower',hi:true,rime:true,ai:'burrow',hp:58,dmg:9,atkCd:1.3,range:2.4,speed:6,aggro:17,xp:1.5,ranged:false,hitR:0.8,h:1.1,build:buildBurrower,scale:0.85,desc:'Dives under the ice and erupts beneath you'},
  frostcaller:{name:'Hoarfrost Caller',hi:true,rime:true,ai:'chill',hp:46,dmg:8,atkCd:2.0,range:18,speed:4.8,aggro:20,xp:1.5,ranged:true,hitR:0.7,h:1.9,build:buildFrostcaller,scale:0.82,desc:'Every hit chills you; four stacks freeze you solid'},
  shambler:{name:'Glacier Shambler',hi:true,rime:true,ai:'split',split:{t:'shardling',n:2},hp:130,dmg:15,atkCd:2.4,range:3.3,speed:4.2,aggro:15,xp:1.9,ranged:false,hitR:1.4,h:2.6,build:buildShambler,scale:0.88,desc:'Shatters into two Shardlings when it dies'},
  shardling:{name:'Shardling',hi:true,rime:true,hp:30,dmg:6,atkCd:1.3,range:2.2,speed:5.8,aggro:18,xp:0.4,ranged:false,hitR:0.7,h:1.2,build:buildShardling,scale:0.6},
  sentinel:{name:'Frostward Sentinel',hi:true,rime:true,ai:'ward',hp:88,dmg:7,atkCd:2.2,range:15,speed:4.4,aggro:18,xp:1.7,ranged:true,hitR:0.8,h:2.1,build:buildSentinel,scale:0.9,desc:'Shields nearby allies in Frost Wards (-60% damage taken). Kill it first'},
  rimewarden:{name:'The Rimewarden',hp:1300,dmg:16,atkCd:2.2,range:4.8,speed:4.4,aggro:19,xp:12,ranged:false,hitR:1.6,h:2.6,build:buildRimewarden,scale:1.8},
  orrery:{name:'The Still Orrery',hp:1500,dmg:15,atkCd:2.0,range:20,speed:2.4,aggro:22,xp:14,ranged:true,hitR:1.6,h:3.2,build:buildOrrery,scale:1.6},
  ysra:{name:'Queen Ysra of the Hush',hp:1800,dmg:17,atkCd:1.8,range:4,speed:5,aggro:20,xp:20,ranged:false,hitR:0.9,h:2.1,build:buildYsra,scale:1.7},
  iceshard:{name:'Hush Shard',hp:170,dmg:5,atkCd:2.4,range:22,speed:0,aggro:30,xp:0.5,ranged:true,hitR:0.9,h:3,build:buildIceShard,scale:1}
});
const BOSSES={
  foreman:{etype:'foreman',lvl:6,intro:'Ground Slam: get out of the red circle!',mech:[
    {t:'slam',name:'Ground Slam',every:9,first:5,r:6,delay:1.7,mult:2.6,desc:'Telegraphed slam: a red circle around him, then it detonates. Run out.'},
    {t:'adds',name:'Call the Crew',at:[0.5],etype:'miner',n:2,lvl:5,desc:'At 50% health two Hollowed Miners join.'}]},
  matriarch:{etype:'matriarch',lvl:7,intro:'Crystal Eruptions under your feet. Keep moving!',mech:[
    {t:'pools',name:'Crystal Eruption',every:10,first:4,r:4,delay:1.8,mult:2.4,count:3,desc:'Three circles erupt under and around you. Move out before they burst.'},
    {t:'adds',name:'Brood Swarm',at:[0.7,0.35],etype:'vskitter',n:3,lvl:6,desc:'At 70% and 35% a swarm of Vein Skitters pours in.'},
    {t:'enrage',name:'Enrage',at:0.25,dmg:1.4,cd:0.7,spd:1.25,desc:'Below 25% she enrages: harder, faster hits.'}]},
  ixo:{etype:'ixo',lvl:9,intro:'Shock Slam incoming. Watch the floor!',mech:[
    {t:'slam',name:'Shock Slam',every:8,first:4,r:7,delay:1.5,mult:2.6,desc:'Telegraphed 7m slam around him. Run out.'},
    {t:'enrage',name:'Overdrive',time:75,dmg:1.6,cd:0.65,spd:1.3,desc:'After 75s he overdrives (soft enrage timer). Kill him fast.'}]},
  custodian:{etype:'custodian',lvl:10,intro:'Orbital Lattice and Purge Pulse. Dodge everything!',mech:[
    {t:'pools',name:'Orbital Lattice',every:9,first:4,r:4.5,delay:1.7,mult:2.6,count:4,desc:'Four strike circles drop on and around you.'},
    {t:'slam',name:'Purge Pulse',every:15,first:12,r:10,delay:2.4,mult:3,desc:'A huge 10m pulse around the engine. Get far away.'},
    {t:'adds',name:'Deploy Sentries',at:[0.66,0.33],etype:'sentry',n:2,lvl:9,desc:'At 66% and 33% two Combine Sentries deploy.'},
    {t:'enrage',name:'Critical Overload',at:0.2,dmg:1.5,cd:0.7,spd:1.2,desc:'Below 20% it overloads: harder, faster hits.'}]},
  // ---- The Choir Below (Lv 14-18) ----
  cantor:{etype:'cantor',lvl:15,intro:'He steps through the walls. Watch behind you!',mech:[
    {t:'blinkslam',name:'Hollow Step',every:11,first:5,r:5.5,delay:1.5,mult:2.5,desc:'He blinks right next to you and slams a 5.5m circle. Get out.'},
    {t:'pools',name:'Shard Hymn',every:13,first:9,r:3.5,delay:1.8,mult:1.9,count:2,desc:'Shards fall on and near you. Move.'},
    {t:'adds',name:'Glint Pack',at:[0.5],etype:'stalker',n:2,lvl:14,desc:'At 50% two Glint Stalkers blink in.'}]},
  hymnwarden:{etype:'hymnwarden',lvl:16,intro:'Break its Resonance Pylons, and hug it when the Great Hymn glows!',mech:[
    {t:'slam',name:'Resonant Stomp',every:10,first:5,r:6.5,delay:1.6,mult:2.5,desc:'Telegraphed 6.5m stomp around it. Get out.'},
    {t:'shield',name:'Resonance Shield',at:[0.6],n:3,lvl:15,etype:'chordpylon',what:'Resonance Pylons',desc:'At 60% three Resonance Pylons rise and it is immune until all are destroyed.'},
    {t:'nova',name:'Great Hymn',every:20,first:14,safe:6,r:26,delay:2.6,mult:2.6,desc:'The whole hall rings except a 6m safe ring around it. Run IN.'}]},
  choirmother:{etype:'choirmother',lvl:17,intro:'Her Echoes sing her back to health. Silence them!',mech:[
    {t:'pools',name:'Crystal Chorus',every:10,first:4,r:4,delay:1.7,mult:2.3,count:3,desc:'Three crystal circles burst on and around you.'},
    {t:'chorus',name:'Echo Chorus',at:[0.7,0.4],n:2,lvl:16,heal:0.02,desc:'At 70% and 40% two Choir Echoes appear. Each heals her 2% per second until it dies: kill them fast.'},
    {t:'blinkslam',name:"Mother's Reach",every:16,first:12,r:6,delay:1.6,mult:2.6,desc:'She lunges next to you and slams a 6m circle.'},
    {t:'enrage',name:'Final Verse',at:0.2,dmg:1.45,cd:0.7,spd:1.2,desc:'Below 20% she enrages: harder, faster hits.'}]},
  // ---- The Stillvault (Lv 24-28, Build C): new mechanics (cross, stillpoint, rimebrand, shatter) ----
  rimewarden:{etype:'rimewarden',lvl:25,intro:'Its Glacial Cross runs out along the floor in lines. Stand between them!',mech:[
    {t:'cross',name:'Glacial Cross',every:12,first:5,len:6,gap:3.6,r:2.1,delay:1.7,mult:2.4,desc:'Ice erupts in four lines out from it (a + then an x). Stand in the gaps between the lines.'},
    {t:'slam',name:'Frost Stomp',every:15,first:10,r:6,delay:1.6,mult:2.3,desc:'Telegraphed 6m stomp around it. Get out.'},
    {t:'adds',name:'Burrow Swarm',at:[0.5],etype:'burrower',n:2,lvl:24,desc:'At 50% two Rime Burrowers dig in.'}]},
  orrery:{etype:'orrery',lvl:26,intro:'When time stands still, only the moving green circle is safe. Stay inside it!',mech:[
    {t:'stillpoint',name:'Stillpoint',every:17,first:6,safe:5,r:40,delay:4.2,speed:2.2,mult:3,desc:'The whole hall freezes except one green circle that drifts across the floor. Stay inside it until the hall shatters.'},
    {t:'pools',name:'Orbit Shards',every:11,first:12,r:3.2,delay:1.6,mult:1.9,count:3,desc:'Ice shards fall on and around you.'},
    {t:'adds',name:'Wardens of the Hour',at:[0.6],etype:'sentinel',n:2,lvl:25,desc:'At 60% two Frostward Sentinels arrive and ward each other.'}]},
  ysra:{etype:'ysra',lvl:27,intro:'Her Rime Brand follows you, then freezes. Run it away from your friends, then out of it!',mech:[
    {t:'rimebrand',name:'Rime Brand',every:13,first:5,r:5,delay:4,lock:1.1,mult:2.4,freeze:2.2,desc:'A circle follows you for 3s, locks, then bursts: damage and frozen for 2s if you are still inside.'},
    {t:'shatter',name:'Shatter',at:[0.6,0.3],n:3,lvl:26,time:20,heal:0.25,mult:2.2,desc:'At 60% and 30% she hides in ice and three Hush Shards rise. Break all three within 20s or she heals 25% and the hall takes a frost blast.'},
    {t:'cross',name:'Crown of Thorns',every:17,first:10,len:7,gap:3.4,r:2,delay:1.6,mult:2.4,desc:'Ice lines erupt from her in a + then an x.'},
    {t:'enrage',name:'Endless Winter',at:0.2,dmg:1.5,cd:0.7,spd:1.2,desc:'Below 20% she enrages: harder, faster hits.'}]}
};
const DUNGEONS={
  mine:{id:'mine',name:'Hollowvein Mine',sub:'Abandoned Vyre dig',lvl:[4,7],minLvl:4,cap:7,rec:6,door:{x:-78,z:-52},accent:0x5ff2ff,
    desc:'A collapsed Vyre dig, sealed after the crew went hollow. The crystals still hum, and something big nests in the deep shaft.',
    pal:{floor:0x3a2a20,floor2:0x2a1e18,wall:0x5a4030,trim:0x6b4a2a,glow:[0x5ff2ff,0xb46bff],fog:0x0c0809,hemi:[0xffc890,0x1a0e08,0.62],plight:0xffc890},
    rooms:[{w:18,d:16,entry:true},{w:22,d:20,packs:[[['vskitter',5],['vskitter',5],['vskitter',4]]]},{w:24,d:22,packs:[[['miner',5],['miner',5]],[['vskitter',5],['vskitter',6]]]},
      {w:26,d:24,boss:'foreman'},{w:22,d:20,packs:[[['miner',6],['miner',6],['vskitter',6]]]},{w:34,d:32,boss:'matriarch',final:true}],
    loot:{foreman:{items:['foreman_breacher','grusk_knuckles','vr_treads','glowcore_ocular']},matriarch:{items:['vein_splitter','fang_rod','glimmer_coil','sinew_longbow','vr_hood','vr_harness','vr_treads','glowcore_ocular'],extraP:0.35,relic:'heart_vein',relicP:0.07,disk:'shardstorm_disk',diskP:0.2},trashP:0.03},
    modes:{solo:{hp:1,dmg:1,lvl:0},group:{hp:2.6,dmg:1.3,lvl:1,size:[2,6]}}},
  vault:{id:'vault',name:'Vault Theta-9',sub:'Sealed Combine research vault',lvl:[8,10],minLvl:8,cap:10,rec:10,door:{x:150,z:110},accent:0xff9a2a,
    desc:'A Combine research vault the Ashborn cracked open. Its Custodian Engine still runs the lockdown, and Warden-Prime Ixo holds the inner gate.',
    pal:{floor:0x2a2f36,floor2:0x1e2228,wall:0x4a525c,trim:0x1a1e24,glow:[0x5ff2ff,0xff3b2f],fog:0x07090c,hemi:[0x9fc8ff,0x101418,0.62],plight:0x9fdfff},
    rooms:[{w:18,d:16,entry:true},{w:22,d:20,packs:[[['sentry',8],['sentry',8],['enforcer',8]]]},{w:24,d:22,packs:[[['enforcer',8],['enforcer',9]],[['sentry',9],['sentry',8]]]},
      {w:26,d:24,boss:'ixo'},{w:24,d:22,packs:[[['enforcer',9],['sentry',9],['sentry',9],['enforcer',9]]]},{w:36,d:34,boss:'custodian',final:true}],
    loot:{ixo:{items:['warden_edge','ixo_sidearm','aegis_helm','lattice_gloves'],disk:'drake_disk',diskP:0.25},custodian:{items:['theta_lance','theta_recurve','custodian_arc','null_staff','aegis_helm','aegis_carapace','aegis_greaves','lattice_gloves','theta_cortex'],extraP:0.35,relic:'custodian_core',relicP:0.07,disk:'aegis_disk',diskP:0.2},trashP:0.03},
    modes:{solo:{hp:1,dmg:1,lvl:0},group:{hp:2.6,dmg:1.3,lvl:1,size:[2,6]}}},
  choir:{id:'choir',name:'The Choir Below',sub:'Singing Vyre cathedral under the Duskcrown',lvl:[14,18],minLvl:14,cap:18,rec:16,door:{x:GLOAM.door.x,z:GLOAM.door.z},accent:0xb46bff,
    desc:'A cathedral of living crystal under the Duskcrown Highlands. The Choir sings the seams awake, and three voices lead it: Cantor Vey, the Hymnwarden and the Choirmother.',
    pal:{floor:0x2a2438,floor2:0x201a2c,wall:0x4a4060,trim:0x1c1628,glow:[0xb46bff,0x7ff6ff],fog:0x0c0814,hemi:[0xc8b8ff,0x140c20,0.64],plight:0xc8a8ff},
    rooms:[{w:20,d:18,entry:true},{w:24,d:22,packs:[[['stalker',14],['stalker',14],['shardcaller',14]]]},{w:26,d:24,packs:[[['brute',15],['tender',14]],[['shardcaller',15],['stalker',15]]]},
      {w:30,d:28,boss:'cantor'},{w:26,d:24,packs:[[['brute',16],['shardcaller',16],['tender',15]]]},{w:34,d:30,boss:'hymnwarden'},
      {w:26,d:24,packs:[[['stalker',17],['stalker',16],['tender',16],['brute',17]]]},{w:40,d:36,boss:'choirmother',final:true}],
    loot:{cantor:{items:['vey_pistol','cantor_glaive','cw_hood','cw_grips']},hymnwarden:{items:['hymn_repeater','hymn_breaker','echo_twins','cw_grips','cw_boots','hymn_ocular'],extraP:0.2},
      choirmother:{items:['choir_scepter','mother_bow','chorus_emitter','cantor_glaive','hymn_repeater','cw_hood','cw_robe','cw_boots','cw_grips','hymn_ocular'],extraP:0.35,relic:'choirheart',relicP:0.07,disk:'chord_disk',diskP:0.2},trashP:0.03},
    modes:{solo:{hp:1,dmg:1,lvl:0},group:{hp:2.6,dmg:1.3,lvl:1,size:[2,6]}}},
  stillvault:{id:'stillvault',name:'The Stillvault',sub:'Frozen Combine archive under the Rimefall',lvl:[24,28],minLvl:24,cap:28,rec:26,door:{x:RIME.door.x,z:RIME.door.z},accent:0x9fe8ff,
    desc:'A Combine archive sealed in ice under the Rimefall Expanse, where time itself has slowed. The second tone comes from here: the Rimewarden guards the stacks, the Still Orrery keeps the hours, and Queen Ysra of the Hush rules them.',
    pal:{floor:0x9ab0c4,floor2:0x7f97ac,wall:0xc8dcec,trim:0x4a6a88,glow:[0x9fe8ff,0xffffff],fog:0x0a141e,hemi:[0xe0f0ff,0x16222e,0.7],plight:0xcfeaff},
    rooms:[{w:20,d:18,entry:true},{w:24,d:22,packs:[[['burrower',24],['burrower',24],['frostcaller',24]]]},{w:26,d:24,packs:[[['shambler',24],['sentinel',24]],[['frostcaller',25],['burrower',25]]]},
      {w:30,d:28,boss:'rimewarden'},{w:26,d:24,packs:[[['shambler',26],['frostcaller',25],['sentinel',25]]]},{w:34,d:30,boss:'orrery'},
      {w:26,d:24,packs:[[['burrower',27],['shambler',26],['sentinel',26],['frostcaller',27]]]},{w:40,d:36,boss:'ysra',final:true}],
    loot:{rimewarden:{items:['warden_cleaver','frostbite_pistol','rb_cowl','rb_gauntlets']},orrery:{items:['hour_rifle','orrery_scatter','still_twins','rb_gauntlets','rb_greaves','orrery_lens'],extraP:0.2},
      ysra:{items:['hush_rod','ysra_bow','winter_emitter','warden_cleaver','hour_rifle','rb_cowl','rb_mantle','rb_greaves','rb_gauntlets','orrery_lens'],extraP:0.35,relic:'hushheart',relicP:0.07,disk:'stillfrost_disk',diskP:0.2},trashP:0.03},
    modes:{solo:{hp:1,dmg:1,lvl:0},group:{hp:2.6,dmg:1.3,lvl:1,size:[2,6]}}}
};
/* ---------- level caps (AO-style): every dungeon has an entry range minLvl..cap ----------
   Data rule: each DUNGEONS entry declares lvl:[lo,hi], minLvl and cap. validateDungeons() runs at load: a dungeon
   missing cap/minLvl gets a safe default (cap = top of its level range) and a console warning, so tests catch it. */
function validateDungeons(){for(const k in DUNGEONS){const D=DUNGEONS[k];if(!Array.isArray(D.lvl))D.lvl=[D.minLvl||1,D.cap||MAXLVL];
  if(!Number.isFinite(D.minLvl)){D.minLvl=D.lvl[0];console.warn('DUSTREACH: dungeon '+k+' has no minLvl; using '+D.minLvl);}
  if(!Number.isFinite(D.cap)){D.cap=D.lvl[1];console.warn('DUSTREACH: dungeon '+k+' has no level cap; using '+D.cap);}
  if(D.cap<D.minLvl){console.warn('DUSTREACH: dungeon '+k+' cap '+D.cap+' is below its minLvl '+D.minLvl+'; raising it');D.cap=D.minLvl;}}}
validateDungeons();
// party/AI-team rule: a group is judged by its highest-level member
const partyTopLevel=party=>Math.max(P.level,...(party||[]).map(m=>(m&&(m.trueLevel||m.level))||0));// true levels: level sync never sneaks a high alt into a capped dungeon
function dunRange(id){if(typeof id==='string'&&id.startsWith('dyna_')&&typeof DYNAS!=='undefined'&&DYNAS[id.slice(5)]){const Y=DYNAS[id.slice(5)];return Y.region+' · Lv '+Y.lv;}const D=dunDef(id);return D?'Lv '+D.minLvl+'–'+D.cap+' (cap '+D.cap+')':'';}
function capMsg(D){return 'Level cap '+D.cap+' – you are too experienced for '+D.name;}
function dunDef(id){return DUNGEONS[id]||(RAIDS&&RAIDS[id])||null;}
function dunEntryCheck(id,party){if(TEAM_ENTERING===id)return teamDunCheck(id);const D=dunDef(id);if(D&&D.raid)return raidEntryCheck(id,party);if(!D)return {ok:false,why:'unknown',msg:'Unknown dungeon'};const lv=partyTopLevel(party);
  if(D.gate&&typeof gateOpen==='function'&&!gateOpen(D.gate)){const s=STEP[GATES[D.gate].step];return {ok:false,why:'story',lv,step:s.id,msg:gateMsg(D.gate)};}
  if(lv>D.cap&&!D.raid){const sr=storyDunStep(id);if(sr&&P.level>=D.minLvl)return {ok:true,lv,story:sr};}
  if(lv>D.cap)return {ok:false,why:'cap',lv,msg:(party&&party.length&&lv>P.level?'Level cap '+D.cap+' – your party\'s highest member (Lv '+lv+') is too experienced for '+D.name:capMsg(D))};
  if(P.level<D.minLvl)return {ok:false,why:'min',lv,msg:'Requires level '+D.minLvl+' – you are level '+P.level};return {ok:true,lv};}
// loot payoff: clearing at (or one under) the cap means you out-geared the place by twinking, so bosses drop a bit more
function capBonus(){if(!DUN||DUN.apt)return null;const D=DUN.D;const lv=partyTopLevel(DUN.party);const near=lv>=D.cap-1;const sz=DUN.mode&&DUN.mode.size;const full=!!sz&&DUN.party.length+1>=sz[1];
  return near?{extra:0.25+(full?0.15:0),relic:full?1.75:1.5,full}:null;}
/* Unique items (Legendary r4 / Relic r5). d = dungeon. Gear: slot + wt|fam + lvl + bonus; imp: slot + ql; disk: wid. */
const UNIQUES={
  vein_splitter:{d:'mine',name:'Veinsplitter',slot:'weapon',wt:'blade',lvl:6,dmgM:1.1,bonus:{wpn:12,str:4,crit:3}},
  foreman_breacher:{d:'mine',name:"Grusk's Breacher",slot:'weapon',wt:'shotgun',lvl:6,bonus:{wpn:10,hp:60,power:6}},
  fang_rod:{d:'mine',name:"Matriarch's Fang",slot:'weapon',wt:'rod',lvl:7,bonus:{weave:14,psy:5,en:40}},
  glimmer_coil:{d:'mine',name:'Glimmerheart Coil',slot:'weapon',wt:'emitter',lvl:7,bonus:{weave:12,int:5,crit:4}},
  vr_hood:{d:'mine',name:'Veinrunner Hood',slot:'head',fam:'light',lvl:6,set:'veinrunner',bonus:{psy:4,weave:8,en:30}},
  vr_harness:{d:'mine',name:'Veinrunner Harness',slot:'armor',fam:'medium',lvl:6,set:'veinrunner',bonus:{agi:5,hp:60,treat:8}},
  vr_treads:{d:'mine',name:'Veinrunner Treads',slot:'feet',fam:'medium',lvl:6,set:'veinrunner',bonus:{agi:4,sen:4,run:20}},
  grusk_knuckles:{d:'mine',name:"Grusk's Knuckle Plates",slot:'hands',fam:'heavy',lvl:6,bonus:{str:5,body:10,wpn:6}},
  glowcore_ocular:{d:'mine',name:'Glowcore Ocular',kind:'imp',slot:'eyes',ql:28,bonus:{sen:8,int:5,wpn:10,treat:10}},
  shardstorm_disk:{d:'mine',kind:'disk',wid:'shardstorm'},
  sinew_longbow:{d:'mine',name:'Matriarch\'s Sinew Longbow',slot:'weapon',wt:'bow',lvl:7,bonus:{wpn:12,sen:5,crit:4}},
  drake_disk:{d:'vault',kind:'disk',wid:'morph_drake'},
  theta_recurve:{d:'vault',name:'Theta Recurve',slot:'weapon',wt:'bow',lvl:10,bonus:{wpn:17,agi:6,power:8}},
  heart_vein:{d:'mine',name:'Heart of the Vein',kind:'imp',slot:'chest',ql:32,relic:true,bonus:{sta:10,psy:8,pool:16,hp:80,body:12}},
  theta_lance:{d:'vault',name:'Theta Lance',slot:'weapon',wt:'rifle',lvl:10,bonus:{wpn:18,crit:5,power:8}},
  custodian_arc:{d:'vault',name:"Custodian's Arc",slot:'weapon',wt:'emitter',lvl:10,bonus:{weave:18,int:7,power:8}},
  null_staff:{d:'vault',name:'Null-Lattice Staff',slot:'weapon',wt:'rod',lvl:10,bonus:{weave:16,psy:7,en:60}},
  warden_edge:{d:'vault',name:'Warden Edge',slot:'weapon',wt:'blade',lvl:9,dmgM:1.1,bonus:{wpn:16,str:6,hp:80}},
  ixo_sidearm:{d:'vault',name:"Ixo's Sidearm",slot:'weapon',wt:'pistol',lvl:9,bonus:{wpn:12,treat:14,agi:5}},
  aegis_helm:{d:'vault',name:'Aegis Helm',slot:'head',fam:'heavy',lvl:9,set:'aegis',bonus:{sta:5,body:12}},
  aegis_carapace:{d:'vault',name:'Aegis Carapace',slot:'armor',fam:'heavy',lvl:10,set:'aegis',bonus:{sta:7,hp:120,body:14}},
  aegis_greaves:{d:'vault',name:'Aegis Greaves',slot:'legs',fam:'heavy',lvl:10,set:'aegis',bonus:{str:6,body:10,hp:60}},
  lattice_gloves:{d:'vault',name:"Researcher's Lattice Gloves",slot:'hands',fam:'light',lvl:10,bonus:{weave:12,int:6,crit:3}},
  theta_cortex:{d:'vault',name:'Theta Cortex',kind:'imp',slot:'head',ql:45,bonus:{int:12,psy:10,weave:16,pool:14}},
  aegis_disk:{d:'vault',kind:'disk',wid:'aegis'},
  custodian_core:{d:'vault',name:'Custodian Core',kind:'imp',slot:'chest',ql:50,relic:true,bonus:{sta:14,body:20,hp:150,power:10}},
  // The Choir Below (Lv 14-18): weapons for every profession, the 4-piece Choirbound set, an ocular, a relic heart and a dungeon-only Weave
  vey_pistol:{d:'choir',name:"Vey's Hollow Voice",slot:'weapon',wt:'pistol',lvl:15,bonus:{wpn:18,treat:22,sen:8}},
  cantor_glaive:{d:'choir',name:'Cantor Glaive',slot:'weapon',wt:'blade',lvl:16,dmgM:1.12,bonus:{wpn:24,str:9,crit:5}},
  hymn_repeater:{d:'choir',name:'Hymn Repeater',slot:'weapon',wt:'rifle',lvl:16,dmgM:1.1,bonus:{wpn:25,sen:8,crit:6}},
  hymn_breaker:{d:'choir',name:'Hymnbreaker',slot:'weapon',wt:'shotgun',lvl:16,bonus:{wpn:22,hp:140,power:10}},
  echo_twins:{d:'choir',name:'Echo Twins',slot:'weapon',wt:'smg',lvl:16,bonus:{wpn:22,agi:9,evade:12}},
  choir_scepter:{d:'choir',name:'Choir Scepter',slot:'weapon',wt:'rod',lvl:17,bonus:{weave:28,psy:10,en:90}},
  mother_bow:{d:'choir',name:"Choirmother's Longbow",slot:'weapon',wt:'bow',lvl:17,bonus:{wpn:24,sen:9,crit:6}},
  chorus_emitter:{d:'choir',name:'Chorus Emitter',slot:'weapon',wt:'emitter',lvl:17,bonus:{weave:28,int:10,power:12}},
  cw_hood:{d:'choir',name:'Choirbound Hood',slot:'head',fam:'light',lvl:16,set:'choirbound',bonus:{psy:8,weave:16,en:60}},
  cw_robe:{d:'choir',name:'Choirbound Vestment',slot:'armor',fam:'medium',lvl:17,set:'choirbound',bonus:{sta:9,hp:170,treat:14}},
  cw_grips:{d:'choir',name:'Choirbound Grips',slot:'hands',fam:'medium',lvl:16,set:'choirbound',bonus:{agi:8,wpn:14,crit:4}},
  cw_boots:{d:'choir',name:'Choirbound Treads',slot:'feet',fam:'medium',lvl:17,set:'choirbound',bonus:{agi:7,sen:7,run:35}},
  hymn_ocular:{d:'choir',name:'Hymnsight Ocular',kind:'imp',slot:'eyes',ql:75,bonus:{sen:18,int:10,wpn:24,treat:20}},
  chord_disk:{d:'choir',kind:'disk',wid:'silencechord'},
  choirheart:{d:'choir',name:'Heart of the Choir',kind:'imp',slot:'chest',ql:85,relic:true,bonus:{sta:20,psy:14,body:28,hp:240,power:14}},
  // The Stillvault (Lv 24-28): weapons for every profession, the 4-piece Rimebound set, an ocular, a relic heart and a dungeon-only Weave
  frostbite_pistol:{d:'stillvault',name:'Frostbite Sidearm',slot:'weapon',wt:'pistol',lvl:25,bonus:{wpn:28,treat:34,sen:12}},
  warden_cleaver:{d:'stillvault',name:"Rimewarden's Cleaver",slot:'weapon',wt:'blade',lvl:26,dmgM:1.12,bonus:{wpn:36,str:14,crit:7}},
  hour_rifle:{d:'stillvault',name:'Hourglass Longrifle',slot:'weapon',wt:'rifle',lvl:26,dmgM:1.1,bonus:{wpn:37,sen:13,crit:8}},
  orrery_scatter:{d:'stillvault',name:'Orrery Scattergun',slot:'weapon',wt:'shotgun',lvl:26,bonus:{wpn:33,hp:230,power:15}},
  still_twins:{d:'stillvault',name:'Stillhand Twins',slot:'weapon',wt:'smg',lvl:26,bonus:{wpn:33,agi:14,evade:18}},
  hush_rod:{d:'stillvault',name:'Rod of the Hush',slot:'weapon',wt:'rod',lvl:27,bonus:{weave:42,psy:15,en:140}},
  ysra_bow:{d:'stillvault',name:"Ysra's Winterbow",slot:'weapon',wt:'bow',lvl:27,bonus:{wpn:36,sen:14,crit:8}},
  winter_emitter:{d:'stillvault',name:'Endless Winter Emitter',slot:'weapon',wt:'emitter',lvl:27,bonus:{weave:42,int:15,power:18}},
  rb_cowl:{d:'stillvault',name:'Rimebound Cowl',slot:'head',fam:'light',lvl:26,set:'rimebound',bonus:{psy:12,weave:24,en:90}},
  rb_mantle:{d:'stillvault',name:'Rimebound Mantle',slot:'armor',fam:'medium',lvl:27,set:'rimebound',bonus:{sta:14,hp:260,treat:22}},
  rb_gauntlets:{d:'stillvault',name:'Rimebound Gauntlets',slot:'hands',fam:'medium',lvl:26,set:'rimebound',bonus:{agi:12,wpn:22,crit:6}},
  rb_greaves:{d:'stillvault',name:'Rimebound Greaves',slot:'legs',fam:'medium',lvl:27,set:'rimebound',bonus:{sta:11,sen:10,run:40}},
  orrery_lens:{d:'stillvault',name:'Orrery Lens',kind:'imp',slot:'eyes',ql:125,bonus:{sen:28,int:16,wpn:38,treat:32}},
  stillfrost_disk:{d:'stillvault',kind:'disk',wid:'stillfrost'},
  hushheart:{d:'stillvault',name:'Heart of the Hush',kind:'imp',slot:'chest',ql:140,relic:true,bonus:{sta:30,psy:20,body:42,hp:380,power:20}}
};
Object.assign(SETS,{
  veinrunner:{name:'Veinrunner',pieces:['vr_hood','vr_harness','vr_treads'],bonus:{2:{hp:50,agi:4},3:{power:8,crit:3}}},
  aegis:{name:'Aegis',pieces:['aegis_helm','aegis_carapace','aegis_greaves'],bonus:{2:{hp:80,body:10},3:{armor:60,power:6}}},
  choirbound:{name:'Choirbound',pieces:['cw_hood','cw_robe','cw_grips','cw_boots'],bonus:{2:{hp:140,weave:10,wpn:10},4:{power:14,crit:5,armor:90}}},
  rimebound:{name:'Rimebound',pieces:['rb_cowl','rb_mantle','rb_gauntlets','rb_greaves'],bonus:{2:{hp:220,weave:16,wpn:16},4:{power:20,crit:7,armor:140}}}
});
expansionData();// Build J: Lv 31-50 enemies, bosses, The Drowned Foundry, The Heartforge, their uniques and sets
function makeUnique(key,vl){const u=UNIQUES[key];if(!u)return null;const r=u.relic?5:4;let it;const vet=!!(vl&&!u.kind&&vl>u.lvl)||!!(vl&&u.kind==='imp'&&vl>10);
  const bk=vet?1+0.06*(vl-(u.kind==='imp'?10:u.lvl)):1;
  if(u.kind==='disk'){it=genDisk(u.wid);it.name='Weave Disk: '+WEAVES[u.wid].name;}
  else if(u.kind==='imp'){const ql=vet?Math.min(IMPQL_MAX(),u.ql+(vl-10)*4):u.ql;it=genImplant(ql,u.slot,3);it.name=u.name+(vet?' (Veteran)':'')+' (QL '+ql+')';it.bonus=Object.keys(u.bonus).map(s=>({s,v:Math.round(u.bonus[s]*bk)}));it.value=Math.round((5+ql*3)*3);}
  else{const lvl=vet?vl:u.lvl;it={id:uid(),kind:'gear',slot:u.slot,lvl,name:u.name+(vet?' (Veteran)':''),bonus:Object.keys(u.bonus).map(s=>({s,v:Math.round(u.bonus[s]*bk)})),req:[]};if(vet)it.vet=1;
    if(u.slot==='weapon'){const W=WTYPES[u.wt];it.wt=u.wt;it.dmg=Math.round((4+lvl*2.4)*RAR[r].m*W.dm*(u.dmgM||1));it.req.push({s:W.sk,v:Math.round((4+lvl*4.5)*1.28)});}
    else{const F=AFAM[u.fam];it.fam=u.fam;it.armor=Math.round((4+lvl*3.5)*SLOTW[u.slot]*F.m*RAR[r].m);it.req.push({s:'body',v:Math.round((2+lvl*2.5)*(0.6+0.4*F.m)*1.28)});it.req.push({s:F.attr,v:Math.round(4+lvl*1.8)});}
    if(u.set)it.set=u.set;it.value=Math.round((6+lvl*5)*6);}
  if(u.rar&&RAR[u.rar]){const k=RAR[u.rar].m/RAR[r].m;if(it.dmg)it.dmg=Math.round(it.dmg*k);if(it.armor)it.armor=Math.round(it.armor*k);it.value=Math.round((it.value||0)*1.6);}// Build N: Sunforged
  it.r=u.rar||r;it.uniq=key;it.src=u.d;return it;}

/* ---------------- overworld doors ---------------- */
const doorFx=[];
for(const k in DUNGEONS){const D=DUNGEONS[k],d=D.door;const y=heightAt(d.x,d.z);const g=new THREE.Group();g.position.set(d.x,y,d.z);g.rotation.y=Math.atan2(-d.x,-d.z);
  part(g,geoBox,M(0x4a3a30),-2.4,2.4,0,1.2,4.8+2,1.4);part(g,geoBox,M(0x4a3a30),2.4,2.4,0,1.2,4.8+2,1.4);part(g,geoBox,M(0x3a2c24),0,5.6,0,6.2,1.1,1.8);
  part(g,geoBox,M(0x2a201a),0,0.2,1.2,6,0.4,3);part(g,geoBox,MB(0x0a0608),0,2.4,-0.1,3.6,4.8,0.3);
  const sw=part(g,new THREE.TorusGeometry(1.5,0.12,4,20),MB(D.accent),0,2.5,0.12,1,1.3,1);doorFx.push(sw);
  part(g,geoBox,MB(D.accent),0,5.6,0.92,4,0.25,0.05);scene.add(g);
  const b=makeBeam(D.accent,26,0.5,0.22);b.position.set(d.x,y,d.z);
  for(let i=circles.length-1;i>=0;i--)if(Math.hypot(circles[i].x-d.x,circles[i].z-d.z)<7)circles.splice(i,1);
  const c=Math.cos(g.rotation.y),s=Math.sin(g.rotation.y);for(const lx of [-2.4,2.4])boxes.push({x0:d.x+lx*c-0.7,x1:d.x+lx*c+0.7,z0:d.z-lx*s-0.7,z1:d.z-lx*s+0.7,y0:y,y1:y+6});}

/* ---------------- dungeon runtime ---------------- */
let DUN=null;
const CORR=10,WH=2.6;// low cut-away walls so the third-person camera can see over them
const dunTargets=()=>DUN&&DUN.D.raid?[P].concat(allies.filter(a=>a.raid&&!a.dead)):[P].concat(allies.filter(a=>a.comp&&!a.dead));// raids: the whole team
function enterDungeon(id,opt){const D=dunDef(id);if(!D||DUN)return false;opt=opt||{};if(!D.raid&&!opt.party&&teamActive()){opt.party=teamSnaps();const n=opt.party.length;if(n)opt.modeObj={hp:1+0.32*n,dmg:1+0.05*n,lvl:0,size:[2,6]};}let storyRun=null;{const ck=dunEntryCheck(id,opt.party);if(!ck.ok){warn(ck.msg);if(ck.why==='cap')banner('LEVEL CAP '+D.cap,ck.msg.replace(/^Level cap \d+ – /,''));if(ck.why==='story')lockedMsg(D.gate,true);return false;}if(ck.story&&!(opt.modeObj&&(opt.modeObj.team||opt.modeObj.vet)))storyRun=storyRunMode(D,ck,opt.modeObj);}const mode=hmMode(id,storyRun||opt.modeObj||D.modes[opt.mode||'solo'],D,storyRun);questOnEnterDungeon();
  P.target=null;P.autoAtk=false;for(const p of projs)scene.remove(p.m);projs.length=0;for(const r of rings){scene.remove(r.m);}rings.length=0;clearFx();
  const hidden=[];const keep=new Set([PM.g,pShadow]);for(const o of scene.children)if(o.visible&&!keep.has(o)){o.visible=false;hidden.push(o);}
  DUN={id,D,mode,party:opt.party||[],ret:{x:D.door.x+Math.sin(Math.atan2(-D.door.x,-D.door.z))*4,z:D.door.z+Math.cos(Math.atan2(-D.door.x,-D.door.z))*4},hidden,
    worldEnemies:enemies.splice(0),worldLoots:loots.splice(0),saved:{c:circles.splice(0),b:boxes.splice(0),o:camOcc.splice(0)},fog0:scene.fog,bg0:scene.background,
    group:new THREE.Group(),rects:[],portals:[],bosses:[],tele:[],cleared:false,t0:T};
  FLAT=true;scene.add(DUN.group);buildDungeon(DUN);envTexGroup(DUN.group);if(typeof dismount==='function'&&P.mount)dismount();for(const al of allies){for(const o of [al.R.g,al.shadow]){o.visible=true;const k=hidden.indexOf(o);if(k>=0)hidden.splice(k,1);}al.pos.set(P.pos.x+1.5,0,P.pos.z+1.5);al.target=null;}
  {const th=DUN.th;if(th){scene.fog=new THREE.Fog(th.fog,th.fogN,GFXC.lvl==='low'?th.fogF*0.8:th.fogF);scene.background=new THREE.Color(th.fog);}else{scene.fog=new THREE.Fog(D.pal.fog,16,64);scene.background=new THREE.Color(D.pal.fog);}}
  P.pos.set(DUN.entry.x,0,DUN.entry.z);P.rotY=Math.PI;camS.yaw=0;camS.pitch=0.62;camS.dist=11;camS.cur=null;
  if(mode.story)storyRunBanner(D,mode);else banner(D.name.toUpperCase(),D.sub+' · Recommended level '+D.rec);log('Entered <b style="color:#ff9a2a">'+esc(D.name)+'</b>. Checkpoint set at the entrance.');if(mode.hm)hmStart(DUN);SFX.quest();save();return true;}
function exitDungeon(silent){if(!DUN)return;const d=DUN;clearTele();if(d.D.raid)raidExitCleanup(d);
  // auto-collect dungeon loot left on the floor
  let got=0,lost=0;for(const l of loots){scene.remove(l.m);scene.remove(l.b);l.b.material.dispose();if(invAdd(l.item))got++;else lost++;}loots.length=0;
  for(const e of enemies.slice())removeEnemy(e);enemies.length=0;enemies.push(...d.worldEnemies);loots.push(...d.worldLoots);
  for(const p of projs)scene.remove(p.m);projs.length=0;for(const r of rings)scene.remove(r.m);rings.length=0;clearFx();
  dunCleanup(d);scene.remove(d.group);d.group.traverse(o=>{if(o.isMesh&&o.geometry&&!(o.geometry.userData&&o.geometry.userData.keep)&&o.geometry!==geoBox&&o.geometry!==geoCone&&o.geometry!==geoIco&&o.geometry!==geoSphere&&o.geometry!==teleGeo&&o.geometry!==teleRing)o.geometry.dispose();});
  circles.length=0;circles.push(...d.saved.c);boxes.length=0;boxes.push(...d.saved.b);camOcc.length=0;camOcc.push(...d.saved.o);
  for(const o of d.hidden)o.visible=true;scene.fog=d.fog0;scene.background=d.bg0;FLAT=false;DUN=null;
  P.target=null;P.autoAtk=false;P.pos.set(d.ret.x,0,d.ret.z);P.rotY=Math.atan2(-P.pos.x,-P.pos.z);camS.yaw=P.rotY+Math.PI;camS.cur=null;
  if(!silent){banner('THE REACH',d.D.name+' behind you');if(got)log('Collected <b>'+got+'</b> item'+(got>1?'s':'')+' left in the dungeon'+(lost?' ('+lost+' lost: pack full)':''));save();}}
function buildDungeonV1(d){const D=d.D,pal=D.pal,G=d.group;const L=[],Bx=[],Cn=[];// L: lambert boxes [x,y,z,sx,sy,sz,col], Bx: glowing boxes, Cn: glowing cones
  const wall=(x,z,sx,sz,col,h)=>{h=h||WH;L.push([x,h/2,z,sx,h,sz,col||pal.wall]);d.boxesAdd.push({x0:x-sx/2,x1:x+sx/2,z0:z-sz/2,z1:z+sz/2,y0:0,y1:Math.min(h,2.2)});};
  d.boxesAdd=[];let z=60;const rooms=[];D.rooms.forEach((r,i)=>{if(i>0)z-=D.rooms[i-1].d/2+CORR+r.d/2+2;rooms.push(Object.assign({},r,{cx:0,cz:z,i}));});d.rooms=rooms;
  rooms.forEach((r,i)=>{const hw=r.w/2,hd=r.d/2;L.push([0,-0.25,r.cz,r.w+2,0.5,r.d+2,i%2?pal.floor:pal.floor2]);d.rects.push([-hw,r.cz-hd,r.w,r.d]);
    wall(-hw-0.5,r.cz,1,r.d+2);wall(hw+0.5,r.cz,1,r.d+2);
    const zf=r.cz+hd+0.5,zb=r.cz-hd-0.5;const seg=(zz,gap)=>{if(!gap){wall(0,zz,r.w+2,1);return;}const a=(hw+1-3)/2;wall(-3-a,zz,hw+1-3,1);wall(3+a,zz,hw+1-3,1);wall(-3.6,zz,1.2,1.4,pal.trim,4.6);wall(3.6,zz,1.2,1.4,pal.trim,4.6);L.push([0,4.4,zz,8.4,0.5,1.2,pal.trim]);};
    seg(zf,i>0);seg(zb,i<rooms.length-1);
    if(i<rooms.length-1){const n=rooms[i+1];const z0=zb-0.5,z1=n.cz+n.d/2+1;const len=z0-z1,mz=(z0+z1)/2;L.push([0,-0.27,mz,7,0.5,len,pal.floor2]);wall(-3.5,mz,1,len);wall(3.5,mz,1,len);d.rects.push([-3,z1,6,len]);
      for(let k=2;k<len-1;k+=4){Bx.push([-2.95,1.5,z1+k+1,0.08,0.25,0.6,pal.glow[k/4%2|0]]);Bx.push([2.95,1.5,z1+k+1,0.08,0.25,0.6,pal.glow[0]]);}}
    // decor: pillars, glow crystals / light strips
    if(r.w>=22){for(const sx of [-1,1])for(const sz of [-1,1]){const px=sx*(hw-3.2),pz=r.cz+sz*(hd-3.2);wall(px,pz,1.6,1.6,pal.trim,5.5);Bx.push([px,3.2,pz+sz*-0.81,1.0,0.2,0.02,pal.glow[0]]);}}
    for(let k=0;k<6;k++){const side=k%2?1:-1;const cz=r.cz-hd+2+(k/6)*(r.d-4)+srand(-1,1);
      if(D.id==='mine'){for(let q=0;q<3;q++)Cn.push([side*(hw-0.4-srand(0,0.8)),srand(0.3,0.9),cz+srand(-0.8,0.8),srand(0.12,0.3),srand(0.6,1.8),pal.glow[q%2]]);}
      else Bx.push([side*(hw+0.02),WH+0.03,cz,0.5,0.06,srand(1.5,3),pal.glow[k%3===0?1:0]]);}
    if(r.entry){d.entry={x:0,z:r.cz-2};addPortal(d,0,r.cz+hd-2.5,'Exit to the Reach');const ring=new THREE.Mesh(new THREE.RingGeometry(1.4,1.8,28),new THREE.MeshBasicMaterial({color:0x6dff8a,transparent:true,opacity:0.55,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(0,0.04,r.cz-2);G.add(ring);d.checkpoint=ring;}
    if(r.boss){Bx.push([0,0.02,r.cz,r.w*0.55,0.02,0.15,pal.glow[1]]);Bx.push([0,0.02,r.cz,0.15,0.02,r.d*0.55,pal.glow[1]]);}
  });
  const im=new THREE.InstancedMesh(geoBox,new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),L.length);const m4=new THREE.Matrix4(),c=new THREE.Color();
  L.forEach((b,i)=>{m4.makeScale(b[3],b[4],b[5]);m4.setPosition(b[0],b[1],b[2]);im.setMatrixAt(i,m4);im.setColorAt(i,c.set(b[6]));});im.frustumCulled=false;G.add(im);
  const ib=new THREE.InstancedMesh(geoBox,new THREE.MeshBasicMaterial({color:0xffffff}),Math.max(1,Bx.length));Bx.forEach((b,i)=>{m4.makeScale(b[3],b[4],b[5]);m4.setPosition(b[0],b[1],b[2]);ib.setMatrixAt(i,m4);ib.setColorAt(i,c.set(b[6]));});ib.count=Bx.length;ib.frustumCulled=false;G.add(ib);
  if(Cn.length){const ic=new THREE.InstancedMesh(geoCone,new THREE.MeshBasicMaterial({color:0xffffff}),Cn.length);const o=new THREE.Object3D();Cn.forEach((b,i)=>{o.position.set(b[0],b[1],b[2]);o.rotation.set(srand(-0.3,0.3),0,srand(-0.3,0.3));o.scale.set(b[3],b[4],b[3]);o.updateMatrix();ic.setMatrixAt(i,o.matrix);ic.setColorAt(i,c.set(b[5]));});ic.frustumCulled=false;G.add(ic);}
  boxes.push(...d.boxesAdd);
  G.add(new THREE.HemisphereLight(pal.hemi[0],pal.hemi[1],pal.hemi[2]));const dl=new THREE.DirectionalLight(0xffffff,0.25);dl.position.set(20,40,10);G.add(dl);
  d.plight=new THREE.PointLight(pal.plight,1.3,22,1.6);G.add(d.plight);
  const last=rooms[rooms.length-1];const bl=new THREE.PointLight(pal.glow[1],1.4,40,1.4);bl.position.set(0,6,last.cz);G.add(bl);
  // mobs
  let packN=0;rooms.forEach(r=>{const hw=r.w/2,hd=r.d/2;
    (r.packs||[]).forEach((pk,j,arr)=>{packN++;const px=arr.length>1?(j?1:-1)*r.w/4:0,pz=r.cz+(arr.length>1?(j?-1:1)*r.d/6:0);
      pk.forEach(([t,lv],k)=>{const a=k/pk.length*6.28;spawnDunMob(t,px+Math.cos(a)*2.4,pz+Math.sin(a)*2.4,lv,{pack:'p'+packN});});});
    if(r.boss){const B=BOSSES[r.boss];const e=spawnDunMob(B.etype,0,r.cz-hd*0.2,B.lvl,{boss:r.boss});e.boss={key:r.boss,def:B,room:r,final:!!r.final,engaged:false,done:{},next:{},enraged:false,baseT:e.T,baseDmg:e.dmg};e.leash=Math.max(r.w,r.d)*(balOn()?1.3:0.8);e.wr=0;d.bosses.push(e);}});
}
function spawnDunMob(t,x,z,lv,o){o=o||{};const m=DUN.mode;const e=makeEnemy(t,x,z,lv+(m.lvl||0),!!o.temp);e.dun=true;e.T=Object.assign({},e.T);const rk=typeof RAID_K!=='undefined'&&RAID_K[DUN.D.id]&&balOn();e.maxHp=e.hp=Math.round(e.maxHp*(m.hp||1)*(o.boss||rk?dunBossK(DUN.D.id,m):1)*(o.boss&&m.storyBossHp?m.storyBossHp:1));e.dmg*=(m.dmg||1)*(o.boss||rk?dunBossK(DUN.D.id,m,1):1);if(rk&&o.boss&&RAID_BOSS_K[o.boss])e.maxHp=e.hp=Math.round(e.maxHp*RAID_BOSS_K[o.boss]);e.leash=o.leash||38;e.wr=1.5;if(o.pack)e.pack=o.pack;if(m.hm)hmMob(e,o);return e;}
function addPortal(d,x,z,label){const g=new THREE.Group();g.position.set(x,d.hAt?d.hAt(x,z):0,z);part(g,geoBox,M(0x2a2a30),-1.8,1.8,0,0.6,3.6,0.6);part(g,geoBox,M(0x2a2a30),1.8,1.8,0,0.6,3.6,0.6);part(g,geoBox,M(0x2a2a30),0,3.8,0,4.2,0.5,0.7);
  const sw=part(g,new THREE.TorusGeometry(1.25,0.14,4,22),MB(0x6dff8a),0,1.8,0,1,1.25,1);const pl=part(g,new THREE.CircleGeometry(1.15,20),new THREE.MeshBasicMaterial({color:0x6dff8a,transparent:true,opacity:0.35,side:THREE.DoubleSide}),0,1.8,0,1,1.25,1);
  d.group.add(g);d.portals.push({x,z,label,sw,pl});}
function dunInteract(p){if(DUN&&DUN.apt)return aptInteract(p);if(DUN){for(const q of DUN.portals)if(Math.hypot(p.x-q.x,p.z-q.z)<3.4)return {k:'dexit',label:'🌀 Leave dungeon'};return dunFeatInteract(p);}
  for(const k in DUNGEONS){const d=DUNGEONS[k].door;if(Math.hypot(p.x-d.x,p.z-d.z)<6)return {k:'door',id:k,label:'🚪 '+DUNGEONS[k].name+(P.level>DUNGEONS[k].cap?(storyDunStep(k)?' · 📜 Story run':' ⛔'):'')};}return null;}
function openDoor(id){const D=DUNGEONS[id];const ck=dunEntryCheck(id,teamActive()?teamSnaps():null);const ok=ck.ok;const over=ck.why==='cap';const bosses=D.rooms.filter(r=>r.boss).map(r=>BOSSES[r.boss]);
  D._prev=D._prev||Object.keys(UNIQUES).filter(k=>UNIQUES[k].d===id).map(makeUnique);
  const h=`<div class="cols"><div><div class="mis" style="border-color:#ff9a2a"><b style="font-size:17px">${esc(D.name)}</b> <span style="opacity:.7">· ${esc(D.sub)}</span><p>${esc(D.desc)}</p>
    <div>Levels <b>${D.lvl[0]}-${D.lvl[1]}</b> · Entry <b class="${P.level>=D.minLvl?'up':'down'}">min ${D.minLvl}</b> · <b class="${over?'down':'up'}">level cap ${D.cap}</b> (you are ${P.level}) · Recommended <b>${D.rec}</b> with good gear</div>
    ${over?`<div class="capmsg">⛔ ${esc(ck.msg)}</div>`:''}${ck.story?`<div class="capmsg story" id="storyRunNote">📜 <b>Story run</b>: you are over the level cap, but "${esc(ck.story.n)}" still needs ${esc(ck.story.obj.label)}. Enemies are scaled to your level (Lv ${ck.lv}); normal loot; no outgrown lockout.${storyNotTaken(ck.story)?` <b>Accept the step from ${esc(giverWhere(ck.story.id))} first so the boss counts.</b>`:''}</div>`:''}${ck.why==='story'?`<div class="capmsg story">${esc(ck.msg)}. Talk to ${esc(giverWhere(ck.step))}.</div>`:''}
    <div style="opacity:.8;font-size:13px;margin-top:4px">🎯 Capped dungeon: characters above level ${D.cap} can't enter. Twink to win here: buff up, then wear gear and implants above your level. Clearing at level ${D.cap-1}-${D.cap} gives the bosses <b>+25% extra-drop chance</b> and <b>×1.5 Relic chance</b> (more with a full group).</div>
    <div style="opacity:.8;font-size:13px;margin-top:4px">Solo, or with your 👥 team along. Death revives you at the entrance checkpoint (bosses reset). The harder team-only version is below.</div>
    <button class="sbtn${ok?'':' locked'}" style="margin-top:10px" data-act="${ok?'denter':'noop'}" data-id="${id}">${ok?(ck.story?'📜 Story run: Enter '+esc(D.name):'Enter '+esc(D.name)):over?'Level cap '+D.cap+' – too experienced':ck.why==='story'?'🔒 Story: step '+(STEP[ck.step].i+1)+' "'+esc(STEP[ck.step].n)+'"':'Requires level '+D.minLvl}</button></div>
    ${ok&&!ck.story?hmPickHtml('d:'+id):''}${teamDoorHtml(id)}<div class="h4">Bosses</div>${bosses.map(B=>`<div class="mis"><b style="color:#ff9a2a">${esc(ETYPES[B.etype].name)}</b> · Lv ${B.lvl}${B===bosses[bosses.length-1]?' · final boss':' · mini-boss'}${B.mech.map(m=>`<div style="font-size:13px"><b>${esc(m.name)}</b>: ${esc(m.desc)}</div>`).join('')}</div>`).join('')}</div>
    <div><div class="h4">Exclusive loot (only here)</div>${D._prev.map(it=>itemRow(it,'',false,'noop')).join('')}<div style="opacity:.7;font-size:12px;margin-top:6px">Bosses always drop at least one. The Relic is rare (~7% from the final boss) and the Weave Disk is 20%.</div></div></div>`;
  openPanel('🚪 '+D.name.toUpperCase(),h,'door');}
function rollBossLoot(D,key,cb){const t=D.loot[key];if(!t)return [];const out=[pick(t.items)];cb=cb||{extra:0,relic:1};
  if(Math.random()<(t.extraP||0)+cb.extra){let k=pick(t.items);if(k===out[0])k=pick(t.items);out.push(k);}
  if(t.relic&&Math.random()<t.relicP*cb.relic)out.push(t.relic);if(t.disk&&Math.random()<t.diskP)out.push(t.disk);return out;}
function dunOnKill(e){if(!DUN)return;const D=DUN.D;if(DUN.mode&&DUN.mode.hm)hmOnKill(e);
  if(e.boss){if(D.raid)raidOnBoss(e);const cb0=capBonus(),cb=hmBonus(cb0);const keys=rollBossLoot(D,e.boss.key,cb);if(cb0&&keys.length>1)log('🎯 Cap bonus: extra drop from '+esc(e.T.name));clearTele(e);for(const a of enemies)if(a.addOf===e&&!a.dead){a.dead=true;a.R.g.visible=false;a.shadow.visible=false;setTimeout(()=>removeEnemy(a),50);}
    keys.forEach((k,i)=>{const it=hmItem(makeUnique(k,DUN.mode&&DUN.mode.vet));it.dropBy=e.T.name;const a=i/keys.length*6.28;dropLoot(e.pos.x+Math.cos(a)*1.8,e.pos.z+Math.sin(a)*1.8,it);});
    P.credits+=40*e.lv;if(DUN.mode&&DUN.mode.team)teamBossLoot(e);
    if(e.boss.final&&Math.random()<VEIL_RATE.dungeonFinal){const v=mythicDisk(DUN.id==='vault'||DUN.id==='choir'||DUN.id==='stillvault'?'veil2':'veil1');v.dropBy=e.T.name;dropLoot(e.pos.x,e.pos.z-2.5,v);}
    if(e.boss.final){DUN.cleared=true;P.dunClears[DUN.id]=(P.dunClears[DUN.id]||0)+1;const r=e.boss.room;addPortal(DUN,0,r.cz+r.d/2-4,'Exit');SFX.level();setTimeout(()=>banner(D.raid?'RAID CLEARED':'DUNGEON CLEARED',D.name+' · an exit portal has opened'),1200);if(DUN.mode&&DUN.mode.hm)hmClear(e);aptBossDrop(e);achClear(e);}
    else banner(e.T.name.toUpperCase()+' DEFEATED','The way deeper is open');}
  else{if(e.eliteD)dunEliteLoot(e);if(Math.random()<D.loot.trashP){const pool=[...new Set(Object.values(D.loot).filter(x=>x&&x.items).flatMap(x=>x.items))];const it=makeUnique(pick(pool));it.dropBy=e.T.name;dropLoot(e.pos.x,e.pos.z,it);}}}
const teleGeo=new THREE.CircleGeometry(1,32);teleGeo.rotateX(-Math.PI/2);const teleRing=new THREE.RingGeometry(0.93,1,40);teleRing.rotateX(-Math.PI/2);
function telegraph(src,x,z,r,delay,dmg,name){const g=new THREE.Group();g.position.set(x,heightAt(x,z)+0.06,z);
  const edge=new THREE.Mesh(teleRing,new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0.95,depthWrite:false}));edge.scale.set(r,1,r);g.add(edge);
  const base=new THREE.Mesh(teleGeo,new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0.18,depthWrite:false}));base.scale.set(r,1,r);g.add(base);
  const fill=new THREE.Mesh(teleGeo,new THREE.MeshBasicMaterial({color:0xff6a2a,transparent:true,opacity:0.45,depthWrite:false}));fill.position.y=0.01;fill.scale.set(0.05,1,0.05);g.add(fill);
  DUN.group.add(g);DUN.tele.push({src,x,z,r,t0:T,at:T+delay,dmg,g,fill,edge,name});}
function clearTele(src){if(!DUN)return;for(let i=DUN.tele.length-1;i>=0;i--){const t=DUN.tele[i];if(!src||t.src===src){DUN.group.remove(t.g);t.g.children.forEach(m=>m.material.dispose());DUN.tele.splice(i,1);}}}
function resetBoss(e){const b=e.boss;b.engaged=false;b.done={};b.next={};if(b.enraged){b.enraged=false;e.enraged=false;e.T=b.baseT;e.dmg=b.baseDmg;}clearTele(e);
  for(const a of enemies.slice())if(a.addOf===e)removeEnemy(a);}
function bossTick(e){const b=e.boss;if(e.dead)return;
  if(e.state!=='chase'){if(b.engaged)resetBoss(e);return;}
  if(!b.engaged){b.engaged=true;b.t0=T;b.def.mech.forEach((m,i)=>b.next[i]=T+(m.first||m.every||0));banner(e.T.name.toUpperCase(),b.def.intro);SFX.quest();}
  const hpF=e.hp/e.maxHp;
  b.def.mech.forEach((m,i)=>{if(m.ph&&m.ph.indexOf(b.phase||1)<0)return;// Build N: phase-gated mechanics
    if(m.t==='slam'||m.t==='pools'){if(T>=b.next[i]&&T>=(e.stunUntil||0)){b.next[i]=T+m.every;const dmg=b.baseDmg*m.mult;
      if(m.t==='slam'){e.rootUntil=T+m.delay;telegraph(e,e.pos.x,e.pos.z,m.r,m.delay,dmg,m.name);toast('⚠ '+m.name+': get out of the circle!');}
      else{for(const tg of dunTargets()){telegraph(e,tg.pos.x,tg.pos.z,m.r,m.delay,dmg,m.name);for(let k=1;k<m.count;k++){const a=rand(0,6.28),rr=rand(m.r*1.2,m.r*2.4);telegraph(e,tg.pos.x+Math.cos(a)*rr,tg.pos.z+Math.sin(a)*rr,m.r,m.delay+k*0.15,dmg,m.name);}}toast('⚠ '+m.name+': move!');}
      tone(220,0.5,'sawtooth',0.05,300);}}
    else if(m.t==='adds'){m.at.forEach((th,j)=>{const k=i+'_'+j;if(!b.done[k]&&hpF<=th){b.done[k]=1;const r=b.room;
      for(let n=0;n<m.n;n++){const side=n%2?1:-1;const a=spawnDunMob(m.etype,side*(r.w/2-2.5),r.cz+rand(-r.d/3,r.d/3),m.lvl,{temp:true});{const ak=addHpK();if(ak<1)a.maxHp=a.hp=Math.max(1,Math.round(a.maxHp*ak));}a.addOf=e;a.state='chase';a.nextAtk=T+1;ringFx(a.pos.x,a.pos.z,0xff3b2f,2.5,0.6);}
      toast('⚠ '+m.name+'!');}});}
    else if(MECH_EXT[m.t])MECH_EXT[m.t](e,b,m,i,hpF);
    else if(m.t==='enrage'){if(!b.enraged&&((m.at&&hpF<=m.at)||(m.time&&T-b.t0>=m.time))){b.enraged=true;e.enraged=true;e.T=Object.assign({},b.baseT,{atkCd:b.baseT.atkCd*m.cd,speed:b.baseT.speed*m.spd,scale:b.baseT.scale*1.1});e.dmg=b.baseDmg*m.dmg;
      banner(e.T.name.toUpperCase()+' ENRAGED',m.name);ringFx(e.pos.x,e.pos.z,0xff2a1a,6,0.8);SFX.boom();}}
  });}
function updDungeon(dt){const d=DUN;d.plight.position.set(P.pos.x,P.pos.y+4.5,P.pos.z);updDun2(dt);if(d.D.raid)updRaid(dt);
  if(!d.apt&&!d.outgrown&&P.level>d.D.cap&&!(d.mode&&(d.mode.vet||d.mode.team||d.mode.story))){d.outgrown=true;banner('OUTGROWN '+d.D.name.toUpperCase(),'Level '+P.level+' is over the cap ('+d.D.cap+'). Finish this run; you can\'t re-enter afterwards.');log('⛔ You are now over the level cap for '+esc(d.D.name)+'. This run continues; re-entry is blocked.');}
  for(const q of d.portals){q.sw.rotation.z+=dt*1.5;q.pl.material.opacity=0.3+Math.sin(T*3)*0.1;}if(d.checkpoint)d.checkpoint.material.opacity=0.4+Math.sin(T*2)*0.15;
  for(const e of d.bosses){bossTick(e);if(d.mode&&d.mode.team)teamBossTick(e);}if(d.mode&&d.mode.hm)hmTick(dt);
  for(let i=d.tele.length-1;i>=0;i--){const t=d.tele[i];if(t.upd)t.upd(t);const k=clamp((T-t.t0)/(t.at-t.t0),0,1);t.fill.scale.set(t.r*k,1,t.r*k);t.edge.material.opacity=0.6+Math.sin(T*18)*0.35;
    if(T>=t.at){ringFx(t.x,t.z,0xff5a2a,t.r,0.45);nz(0.3,0.12,700);
      for(const tg of dunTargets()){const dd=Math.hypot(tg.pos.x-t.x,tg.pos.z-t.z);if(!tg.dead&&dd<t.r+0.35&&(!t.inner||dd>t.inner-0.35)){floatText(tmpV.set(tg.pos.x,tg.pos.y+2.6,tg.pos.z),t.name,'info');const dm=t.dmgFn?t.dmgFn(tg):t.dmg;if(tg===P)dmgPlayer(dm,t.src,!!t.noDodge,!!t.pure);else allyTakeDmg(tg,dm,t.src);if(t.fx)t.fx(tg);}}
      d.group.remove(t.g);t.g.children.forEach(m=>m.material.dispose());d.tele.splice(i,1);}}}
function dunRespawn(){const d=DUN;clearTele();for(const e of enemies.slice()){if(e.addOf){removeEnemy(e);continue;}if(!e.dead){e.state='idle';e.hp=e.maxHp;e.pos.set(e.home.x,0,e.home.z);e.dot=null;e.stunUntil=e.rootUntil=0;e.hexUntil=0;}if(e.boss)resetBoss(e);}
  P.dead=false;P.hp=S.maxHp;P.en=S.maxEn;P.pos.set(d.entry.x,heightAt(d.entry.x,d.entry.z),d.entry.z);P.rotY=Math.PI;camS.yaw=0;camS.cur=null;P.target=null;P.autoAtk=false;$('#death').classList.add('hidden');ringFx(d.entry.x,d.entry.z,0x6dff8a,4,1);SFX.heal();banner('CHECKPOINT',d.sun?'Team revived at checkpoint '+(sunRec().stage|0)+' of '+SUN_STAGES.length+' · the boss resets':'Revived at the '+d.D.name+' entrance');if(d.sun)d.sun.wipes=(d.sun.wipes||0)+1;if(d.D.raid)raidRez();save();}
function dunTrack(){const d=DUN;if(d.D.raid)return raidTrack();if(!d.apt&&!(d.mode&&d.mode.team)&&P.level>d.D.cap)return `<b>${esc(d.D.name)}</b> ${d.mode&&d.mode.story?'<span style="color:#ffd25a">· 📜 Story run (scaled to you)</span>':`<span style="color:#ff9a8a">· over cap ${d.D.cap}: last run</span>`}<br>Bosses ${d.bosses.filter(e=>e.dead).length}/${d.bosses.length}${d.cleared?' · <span style="color:#6dff8a">Cleared! Take the exit portal</span>':''}`;if(d.apt)return '<b>🏠 Your Apartment</b><br>🏠 Home table · 🏆 Trophies · Locker · Mirror · Workbench'+(P.home&&P.home.pool?' · 💤 '+P.home.pool+' rested XP':'');const tot=d.bosses.length,k=d.bosses.filter(e=>e.dead).length;return `<b>${esc(d.D.name)}</b><br>Bosses ${k}/${tot}${d.cleared?' · <span style="color:#6dff8a">Cleared! Take the exit portal</span>':' · exit portal at the entrance'}`;}
function dunWaypoint(){const d=DUN;if(d.apt)return null;if(d.cleared){const q=d.portals[d.portals.length-1];return {x:q.x,z:q.z,label:'Exit'};}const b=d.bosses.find(e=>!e.dead);return b?{x:b.home.x,z:b.home.z,label:b.T.name}:null;}
function dunMini(c,tf,sc){if(DUN.areas)return dunMini2(c,tf,sc);c.fillStyle='rgba(120,100,90,0.45)';c.strokeStyle='rgba(230,215,190,0.7)';c.lineWidth=2;
  for(const r of DUN.rects){const a=tf(r[0],r[1]),b=tf(r[0]+r[2],r[1]),e=tf(r[0]+r[2],r[1]+r[3]),f=tf(r[0],r[1]+r[3]);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(e[0],e[1]);c.lineTo(f[0],f[1]);c.closePath();c.fill();c.stroke();}
  for(const q of DUN.portals){const p=tf(q.x,q.z);c.fillStyle='#6dff8a';c.beginPath();c.arc(p[0],p[1],6,0,7);c.fill();}
  for(const t of DUN.tele){const p=tf(t.x,t.z);c.strokeStyle='#ff3b2f';c.lineWidth=2;c.beginPath();c.arc(p[0],p[1],t.r*sc,0,7);c.stroke();}}
