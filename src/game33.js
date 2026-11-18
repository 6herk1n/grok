/* ================= BUILD M: LEVEL CAP 100 · five outer regions (Lv 51-100) · five solo dungeons · team gates 50-90 · Weaves/perks to 100 =================
   The outer shell of the 2400 m world (game1 XM) holds one region per 10-level band:
     51-60 Coppergale Barrens (Patina Cross) · 61-70 Thornspire Wilds (Briarwatch) · 71-80 Stormveil Plateau (Galehold)
     81-90 Hollowsun Reach (Sunhollow Rest) · 91-100 The Riftscar (Lastlight Bastion, + the sealed gate of the future Lv 100 raid)
   Every band: four or five enemy types, six camps, contracts, a hub quartermaster and a solo dungeon (two bosses, a 4-piece set, a weapon per
   weapon type, an ocular, a relic heart and an exclusive Weave). Team gates: Heartforge: Ignition (50, Build J data) and the band dungeons in team
   mode at 60/70/80/90 (TEAMD + TD_BANDS). All 14 professions get Weave ranks to 100 (tier-locked by TIERS), every perk line gets Tier 5/6/7 perks.
   Everything is original and code-built. Data is built inside hoisted functions (game5 calls expansionData() before this file runs). */
function XMB(){if(XMB.c)return XMB.c;const C=XMB.c=[
  {rid:'copper',acc:0x4affd2,acc2:0xc8783a,col:[0x4e7a6c,0x2e4440],
    en:[{k:'coilhound',name:'Coilhound',ai:'blink',b:()=>buildCoilhound(),hp:72,dmg:11,desc:'A copper-wired hound that sparks behind its prey'},
      {k:'patinamancer',name:'Patinamancer',ai:'kite',b:()=>buildPatinamancer(),hp:56,dmg:10,ranged:true,desc:'Keeps its distance and drops corrosion circles'},
      {k:'oxidebrute',name:'Oxide Brute',ai:'charge',b:()=>buildOxidebrute(),hp:165,dmg:18,desc:'Winds up, then charges across the plates'},
      {k:'gearpriest',name:'Gear-Priest',ai:'ward',b:()=>buildGearpriest(),hp:102,dmg:8,ranged:true,desc:'Shields nearby allies in Ember Wards (-60% damage taken). Kill it first'}],
    boss:[{k:'gearwright',name:'Gearwright Ossan',b:()=>buildGearwright(),hp:1560,dmg:19,sc:1.75,intro:'He leaps through the steam to you. Watch your back!',
        mech:[['blinkslam','Piston Leap'],['pools','Rust Rain'],['adds','Cog Hounds','coilhound']]},
      {k:'oxidecolossus',name:'The Oxide Colossus',b:()=>buildOxidecolossus(),hp:1820,dmg:20,sc:2.0,intro:'When its core vents, run IN to the cool ring at its feet!',
        mech:[['nova','Core Vent'],['cross','Arc Lines'],['adds','Gear-Priests','gearpriest'],['enrage','Overpressure']]}],
    dun:{id:'oxidevault',name:'The Oxide Vault',sub:'A buried Combine power vault under the Coppergale Barrens',desc:'The vault that once fed every pylon in the Barrens still hums. Gearwright Ossan keeps its pistons beating, and the Oxide Colossus is the engine itself.',
      tex:'panel',lay:['hall','machine','flooded','machine','arena','machine','machine','arena'],cor:['gate','corr','vents','plates','corr','gate','corr'],
      rooms:['Intake Lock','Turbine Floor','Coolant Sump','Relay Gallery','The Piston Hall','Condenser Stacks','Core Antechamber','The Oxide Core'],
      floor:0x4e5e5a,wall:0x5e6e68,trim:0x2a3634,fog:0x24363a,sky:[0x1e3438,0x7ad8c0],water:0x2a8a7a,name2:'Verdigris-plated power vault, steam and arc-light'},
    set:['Patinaguard',['Patinaguard Visor','Patinaguard Harness','Patinaguard Grips','Patinaguard Striders']],
    w:['Coilspark Sidearm',"Ossan's Cleaver",'Barrens Longrifle','Vault Scattergun','Twin Coils','Rod of Oxides','Copperwind Bow','Arc-Heart Emitter'],lens:'Patina Lens',relic:'Heart of the Oxide Engine',
    xw:{id:'oxidestorm',name:'Oxide Tempest',icon:'⚙️',color:0x4affd2,txt:'a storm of corroding sparks'},
    props:'copper'},
  {rid:'thorn',acc:0xff5ab4,acc2:0xb86a90,col:[0x5a3c4c,0x3a2632],
    en:[{k:'briarworm',name:'Briarworm',ai:'burrow',b:()=>buildBriarworm(),hp:74,dmg:12,desc:'Burrows through the thorn-roots and bursts up beneath you'},
      {k:'thornseer',name:'Thornseer',ai:'heal',b:()=>buildThornseer(),hp:54,dmg:7,ranged:true,desc:'Heals the most wounded enemy nearby. Kill it first'},
      {k:'bloomhulk',name:'Bloomhulk',ai:'split',split:'thornling',b:()=>buildBloomhulk(),hp:158,dmg:18,desc:'Bursts into two Thornlings when it dies'},
      {k:'thornling',name:'Thornling',b:()=>buildThornling(),hp:38,dmg:8,small:true},
      {k:'barbcaster',name:'Barbcaster',ai:'chill',b:()=>buildBarbcaster(),hp:60,dmg:11,ranged:true,desc:'Every hit snares you in thorns; four stacks pin you in place'}],
    boss:[{k:'rosematron',name:'Matron Ilsevere',b:()=>buildRosematron(),hp:1640,dmg:20,sc:1.85,intro:'Thorn Bloom falls on you. Keep moving, and kill her Thornseers first!',
        mech:[['pools','Thorn Bloom'],['adds','Seers of the Briar','thornseer'],['blinkslam','Root Step'],['enrage','Red Bloom']]},
      {k:'bloomgorger',name:'The Bloomgorger',b:()=>buildBloomgorger(),hp:1900,dmg:21,sc:2.05,intro:'Thorn walls burst out in lines from it. Stand in the gaps!',
        mech:[['cross','Thornwall Lines'],['slam','Gorging Maw'],['adds','Briar Swarm','briarworm'],['enrage','Overgrowth']]}],
    dun:{id:'briarsepulchre',name:'The Briar Sepulchre',sub:'A tomb-garden swallowed by the Thornspire',desc:'An old Combine burial vault the thorns grew through. Matron Ilsevere tends the red gardens, and the Bloomgorger feeds at the bottom of it all.',
      tex:'rock',lay:['hall','garden','cavern','garden','arena','chasm','garden','arena'],cor:['corr','bridge','gate','plates','corr','vents','corr'],
      rooms:['Thorn Gate','Rose Galleries','Root Hollow','Weeping Garden','The Matron\'s Bower','The Thorn Pit','Crimson Nursery','The Gorging Heart'],
      floor:0x4a3440,wall:0x5a3e4c,trim:0x2a1a22,fog:0x2e1a26,sky:[0x3a1428,0xff7ac8],water:0x8a2a5a,name2:'Thorn-choked tomb-garden, rose-crystal glow'},
    set:['Briarbound',['Briarbound Hood','Briarbound Mantle','Briarbound Gloves','Briarbound Treads']],
    w:['Thornprick Sidearm',"Matron's Shears",'Thornspire Longrifle','Briar Scattergun','Rose Twins','Rod of the Red Bloom','Thornsong Bow','Bloomheart Emitter'],lens:'Rosethorn Lens',relic:'Heart of the Briar',
    xw:{id:'briarbloom',name:'Briarbloom',icon:'🌹',color:0xff5ab4,txt:'a burst of singing thorns'},
    props:'thorn'},
  {rid:'storm',acc:0x7ad8ff,acc2:0xffe066,col:[0x4c5260,0x2e323c],
    en:[{k:'galehound',name:'Galehound',ai:'blink',b:()=>buildGalehound(),hp:76,dmg:12,desc:'Rides the lightning to strike from behind'},
      {k:'tempestadept',name:'Tempest Adept',ai:'kite',b:()=>buildTempestadept(),hp:60,dmg:11,ranged:true,desc:'Keeps its distance and calls down static circles'},
      {k:'thunderhulk',name:'Thunderhulk',ai:'charge',b:()=>buildThunderhulk(),hp:172,dmg:19,desc:'Winds up, then charges in a crack of thunder'},
      {k:'stormward',name:'Stormward',ai:'ward',b:()=>buildStormward(),hp:108,dmg:9,ranged:true,desc:'Shields nearby allies in wards (-60% damage taken). Kill it first'}],
    boss:[{k:'thunderwarden',name:'Thunderwarden Kael',b:()=>buildThunderwarden(),hp:1720,dmg:21,sc:1.8,intro:'Lightning strikes in lines from him. Stand in the gaps!',
        mech:[['cross','Bolt Lines'],['slam','Thunderclap'],['adds','Galehounds','galehound']]},
      {k:'stormengine',name:'The Storm Engine',b:()=>buildStormengine(),hp:1980,dmg:22,sc:2.05,intro:'When the Engine charges, run IN to the calm ring at its base!',
        mech:[['nova','Overcharge'],['pools','Static Rain'],['adds','Stormwards','stormward'],['enrage','Runaway Current']]}],
    dun:{id:'galecrown',name:'The Galecrown Spire',sub:'A lightning-rod citadel on the highest mesa of the Stormveil',desc:'The Combine built the Galecrown to drink the storm. Thunderwarden Kael still guards its coils, and the Storm Engine has learned to want more.',
      tex:'flag',lay:['hall','shaft','machine','outdoor','arena','machine','shaft','arena'],cor:['gate','bridge','lasers','corr','bridge','vents','corr'],
      rooms:['Spire Gate','Coil Shaft','Capacitor Hall','The Open Gallery','Kael\'s Watch','Dynamo Floor','The Upper Coils','The Crown'],
      floor:0x4a5060,wall:0x5a6070,trim:0x23262e,fog:0x232a38,sky:[0x1a2238,0x9ae8ff],water:0x3a7aaa,name2:'Slate citadel crowned with lightning coils'},
    set:['Galeborn',['Galeborn Helm','Galeborn Cuirass','Galeborn Gauntlets','Galeborn Greaves']],
    w:['Static Sidearm',"Kael's Stormblade",'Galecrown Longrifle','Thunder Scattergun','Twin Bolts','Rod of the Front','Skyrend Bow','Dynamo Emitter'],lens:'Stormglass Ocular',relic:'Heart of the Storm Engine',
    xw:{id:'galeburst',name:'Galeburst',icon:'⚡',color:0x7ad8ff,txt:'a burst of chained lightning'},
    props:'storm'},
  {rid:'hollow',acc:0xffc84a,acc2:0xeee6d0,col:[0xb8a888,0x8a7a60],
    en:[{k:'bonecrawler',name:'Bonecrawler',ai:'burrow',b:()=>buildBonecrawler(),hp:80,dmg:13,desc:'Swims through the bone-sand and bursts up beneath you'},
      {k:'sunpriest',name:'Sun-Priest',ai:'heal',b:()=>buildSunpriest(),hp:58,dmg:8,ranged:true,desc:'Heals the most wounded enemy nearby. Kill it first'},
      {k:'ossuarch',name:'Ossuarch',ai:'split',split:'bonemite',b:()=>buildOssuarch(),hp:168,dmg:19,desc:'Bursts into two Bonemites when it dies'},
      {k:'bonemite',name:'Bonemite',b:()=>buildBonemite(),hp:40,dmg:8,small:true},
      {k:'glarecaster',name:'Glarecaster',ai:'chill',b:()=>buildGlarecaster(),hp:62,dmg:12,ranged:true,desc:'Every hit sun-scorches and slows you; four stacks blind you in place'}],
    boss:[{k:'bonecantor',name:'The Bone Cantor',b:()=>buildBonecantor(),hp:1800,dmg:22,sc:1.85,intro:'He steps through the bones to you. Keep moving!',
        mech:[['blinkslam','Ossuary Step'],['pools','Sunfall'],['adds','Sun-Priests','sunpriest'],['enrage','Final Verse']]},
      {k:'solmaw',name:'Solmaw the Hollow',b:()=>buildSolmaw(),hp:2060,dmg:23,sc:2.1,intro:'When the hollow sun flares, run IN to the shadow at its feet!',
        mech:[['nova','Hollow Sun'],['cross','Glare Lines'],['adds','Ossuarchs','ossuarch'],['enrage','Eclipse']]}],
    dun:{id:'sunossuary',name:'The Ossuary of Suns',sub:'A cathedral of bone under the Hollowsun dunes',desc:'Pilgrims once carried the bones of the Reach here to face the sun. The Bone Cantor still sings them to rest, and Solmaw the Hollow swallowed the sun they prayed to.',
      tex:'flag',lay:['hall','nave','hall','nave','arena','chasm','nave','arena'],cor:['corr','gate','plates','corr','bridge','vents','corr'],
      rooms:['Pilgrim Stair','Hall of Ribs','The Reliquary','Nave of Suns','The Cantor\'s Choir','The Sunken Pit','Gilded Nave','The Hollow Sun'],
      floor:0xb8a888,wall:0xc8b898,trim:0x6a5a40,fog:0x4a3a24,sky:[0x6a4a1a,0xffd86a],water:0xc8a040,name2:'Bone cathedral lit by sun-glass'},
    set:['Sunbleached',['Sunbleached Crown','Sunbleached Vestment','Sunbleached Wraps','Sunbleached Sandals']],
    w:['Glare Sidearm',"Cantor's Ossuary Blade",'Hollowsun Longrifle','Reliquary Scattergun','Twin Suns','Rod of the Hollow Sun','Ribspine Bow','Sunheart Emitter'],lens:'Sun-glass Ocular',relic:'Heart of the Hollow Sun',
    xw:{id:'sunflare',name:'Hollow Sunflare',icon:'☀️',color:0xffc84a,txt:'a flare of hollow sunlight'},
    props:'hollow'},
  {rid:'scar',acc:0xb46aff,acc2:0x5affe0,col:[0x3a2e4a,0x221a2e],
    en:[{k:'voidhound',name:'Voidhound',ai:'blink',b:()=>buildVoidhound(),hp:84,dmg:14,desc:'Steps through the rift to strike from behind'},
      {k:'riftseer',name:'Riftseer',ai:'kite',b:()=>buildRiftseer(),hp:64,dmg:12,ranged:true,desc:'Keeps its distance and tears open void circles'},
      {k:'scarbehemoth',name:'Scar Behemoth',ai:'charge',b:()=>buildScarbehemoth(),hp:182,dmg:21,desc:'Winds up, then charges across the black glass'},
      {k:'nullwarden',name:'Nullwarden',ai:'ward',b:()=>buildNullwarden(),hp:114,dmg:10,ranged:true,desc:'Shields nearby allies in null-wards (-60% damage taken). Kill it first'},
      {k:'voidmaw',name:'Voidmaw',ai:'split',split:'voidling',b:()=>buildVoidmaw(),hp:176,dmg:20,desc:'Bursts into two Voidlings when it dies'},
      {k:'voidling',name:'Voidling',b:()=>buildVoidling(),hp:42,dmg:9,small:true}],
    boss:[{k:'scarherald',name:'The Scar Herald',b:()=>buildScarherald(),hp:1900,dmg:23,sc:1.9,intro:'Rift lines tear out from it. Stand between them!',
        mech:[['cross','Rift Lines'],['blinkslam','Riftstep'],['adds','Nullwardens','nullwarden']]},
      {k:'gatewarden',name:'Vael, Warden of the Gate',b:()=>buildGatewarden(),hp:2200,dmg:24,sc:2.15,intro:'When the Gate opens, run IN to the ring at its feet!',
        mech:[['nova','The Gate Opens'],['pools','Void Rain'],['adds','Voidmaws','voidmaw'],['enrage','Unsealed']]}],
    dun:{id:'riftvestibule',name:'The Rift Vestibule',sub:'The antechamber of the sealed Sunless Gate',desc:'Below the Riftscar lies the Vestibule, the last hall before the Sunless Gate. The Scar Herald announces whatever waits beyond, and Vael has guarded the seal since the world cracked.',
      tex:'basalt',lay:['hall','chasm','forge','shaft','arena','chasm','forge','arena'],cor:['gate','bridge','vents','lasers','bridge','corr','bridge'],
      rooms:['Riftmouth','The Black Span','Void Forges','The Falling Shaft','The Herald\'s Court','The Torn Floor','Seal Works','The Sunless Seal'],
      floor:0x2c2236,wall:0x3a2e48,trim:0x140e1c,fog:0x1a1028,sky:[0x1a0a2a,0xb46aff],water:0x6a2aaa,name2:'Black glass vestibule over the raw Vyre'},
    set:['Riftsworn',['Riftsworn Cowl','Riftsworn Carapace','Riftsworn Claws','Riftsworn Stride']],
    w:['Null Sidearm',"Herald's Edge",'Riftscar Longrifle','Void Scattergun','Twin Rifts','Rod of the Seal','Gatebreaker Bow','Rift-Heart Emitter'],lens:'Riftsight Lens',relic:'Heart of the Sunless Seal',
    xw:{id:'riftrend',name:'Riftrend',icon:'🌀',color:0xb46aff,txt:'a tear of raw Vyre'},
    props:'scar'}];
  C.forEach((B,b)=>{B.b=b;B.lo=51+10*b;B.hi=60+10*b;});return C;}
// in the outer shell (band 0-4) or -1
function xmBand0(x,z){return Math.max(Math.abs(x),Math.abs(z))>=XM.d0+20?xmBand(x,z):-1;}
/* ---------- registries (called from game5 through expansionData) ---------- */
function expansionData(){expansionData_j();expansionDataM();}
function expansionDataM(){const BAND=XMB();const WT=['pistol','blade','rifle','shotgun','smg','rod','bow','emitter'];
  // Heartforge uniques (Lv 45-47) are the templates; bonuses scale with the item level
  const TPL={pistol:'ember_pistol',blade:'anvil_cleaver',rifle:'forge_rifle',shotgun:'forge_scatter',smg:'forge_twins',rod:'sovereign_rod',bow:'rift_bow',emitter:'heart_emitter'};
  const sc=(o,k)=>{const r={};for(const s in o)r[s]=Math.round(o[s]*k);return r;};
  const MK={cross:(n,B,L)=>({t:'cross',name:n,every:12,first:6,len:7,gap:3.4,r:2.1,delay:1.6,mult:2.6,desc:'Strikes burst out in four lines from it (a + then an x). Stand in the gaps.'}),
    slam:(n)=>({t:'slam',name:n,every:14,first:10,r:6,delay:1.6,mult:2.5,desc:'Telegraphed 6m slam around it. Get out.'}),
    blinkslam:(n)=>({t:'blinkslam',name:n,every:11,first:6,r:5.5,delay:1.5,mult:2.6,desc:'It appears right next to you and slams a 5.5m circle. Get out.'}),
    pools:(n)=>({t:'pools',name:n,every:11,first:5,r:3.8,delay:1.8,mult:2.3,count:3,desc:'Three circles fall on and around you. Move out.'}),
    nova:(n)=>({t:'nova',name:n,every:20,first:14,safe:6,r:26,delay:2.6,mult:2.8,desc:'The whole hall burns except a 6m ring around it. Run IN.'}),
    enrage:(n)=>({t:'enrage',name:n,at:0.2,dmg:1.55,cd:0.7,spd:1.2,desc:'Below 20% it enrages: harder, faster hits.'})};
  for(const B of BAND){const lo=B.lo,dl=lo+3,D=B.dun,R=XM.regions[B.b],k=1+0.045*B.b;
    // enemies
    for(const e of B.en){const ranged=!!e.ranged;const base={name:e.name,hi:true,xr:B.rid,hp:Math.round(e.hp*k),dmg:Math.round(e.dmg*k),atkCd:ranged?2.0:e.ai==='charge'||e.ai==='split'?2.3:1.25,range:ranged?18:e.ai==='charge'||e.ai==='split'?3.3:2.3,
      speed:ranged?4.8:e.ai==='charge'||e.ai==='split'?4.5:6.4,aggro:ranged?20:16,xp:e.small?0.5:(e.ai==='charge'||e.ai==='split'?2.4:2.0)+0.1*B.b,ranged,hitR:e.ai==='charge'||e.ai==='split'?1.4:e.small?0.7:0.8,
      h:e.ai==='charge'||e.ai==='split'?2.6:ranged?1.9:1.2,build:e.b,scale:e.small?0.62:e.ai==='charge'||e.ai==='split'?0.9:0.84};
      if(e.ai)base.ai=e.ai;if(e.desc)base.desc=e.desc;if(e.split)base.split={t:e.split,n:2};if(e.ai==='charge')base.slow={mul:0.7,dur:2.5,name:'Staggered'};ETYPES[e.k]=base;}
    // bosses
    B.boss.forEach((bo,i)=>{const L=i?dl+4:dl+1;ETYPES[bo.k]={name:bo.name,hp:Math.round(bo.hp),dmg:bo.dmg,atkCd:i?2.0:1.9,range:i?4.8:4.2,speed:i?4.6:5.0,aggro:20,xp:i?20+B.b:15+B.b,ranged:false,hitR:i?1.6:1.0,h:i?2.6:1.9,build:bo.b,scale:bo.sc};
      BOSSES[bo.k]={etype:bo.k,lvl:L,intro:bo.intro,mech:bo.mech.map(([t,n,a])=>t==='adds'?{t:'adds',name:n,at:i?[0.6]:[0.5],etype:a,n:2,lvl:L-1,desc:'Two '+ETYPES[a].name+'s join the fight.'}:MK[t](n))};});
    // dungeon
    const en=B.en.filter(e=>!e.small).map(e=>e.k);const pk=(a,lv)=>a.map(i=>[en[i%en.length],lv]);
    DUNGEONS[D.id]={id:D.id,name:D.name,sub:D.sub,lvl:[dl,dl+4],minLvl:dl,cap:dl+4,rec:dl+2,door:{x:R.door.x,z:R.door.z},accent:B.acc,desc:D.desc,xm:B.b,
      pal:{floor:D.floor,floor2:D.floor,wall:D.wall,trim:D.trim,glow:[B.acc,B.acc2],fog:D.fog,hemi:[0xe0e0f0,D.trim,0.7],plight:B.acc},
      rooms:[{w:20,d:18,entry:true},{w:24,d:22,packs:[pk([0,0,1],dl)]},{w:26,d:24,packs:[pk([2,3],dl),pk([1,0],dl+1)]},{w:30,d:28,boss:B.boss[0].k},
        {w:26,d:24,packs:[pk([2,1,3],dl+2)]},{w:26,d:24,packs:[pk([0,2,3,1],dl+3)]},{w:44,d:40,boss:B.boss[1].k,final:true}],
      loot:{},modes:{solo:{hp:1,dmg:1,lvl:0},group:{hp:2.6,dmg:1.3,lvl:1,size:[2,6]}}};
    // uniques: a weapon per type, the 4-piece set, an ocular, a relic heart, the exclusive Weave
    const ids={w:[],set:[]};const p=D.id.slice(0,5)+'_';
    WT.forEach((wt,i)=>{const T=UNIQUES[TPL[wt]];const L=dl+1+(i>=5?2:1);const id=p+wt;UNIQUES[id]={d:D.id,name:B.w[i],slot:'weapon',wt,lvl:L,bonus:sc(T.bonus,L/46)};if(T.dmgM)UNIQUES[id].dmgM=T.dmgM;ids.w.push(id);});
    const ST=['hf_helm','hf_plate','hf_gauntlets','hf_greaves'],SL=['head','armor','hands','legs'];
    ST.forEach((t,i)=>{const T=UNIQUES[t];const L=dl+2+(i%2);const id=p+'set'+i;UNIQUES[id]={d:D.id,name:B.set[1][i],slot:SL[i],fam:T.fam,lvl:L,set:B.rid+'set',bonus:sc(T.bonus,L/46)};ids.set.push(id);});
    UNIQUES[p+'lens']={d:D.id,name:B.lens,kind:'imp',slot:'eyes',ql:(dl+2)*5,bonus:sc(UNIQUES.forge_lens.bonus,(dl+2)/45)};
    UNIQUES[p+'heart']={d:D.id,name:B.relic,kind:'imp',slot:'chest',ql:(dl+4)*5,relic:true,bonus:sc(UNIQUES.ember_heart.bonus,(dl+4)/48)};
    UNIQUES[p+'disk']={d:D.id,kind:'disk',wid:B.xw.id};
    const s2=sc(SETS.forgeborn.bonus[2],(dl+2)/46),s4=sc(SETS.forgeborn.bonus[4],(dl+2)/46);SETS[B.rid+'set']={name:B.set[0],pieces:ids.set,bonus:{2:s2,4:s4}};
    DUNGEONS[D.id].loot[B.boss[0].k]={items:[ids.w[1],ids.w[0],ids.set[0],ids.set[2]]};
    DUNGEONS[D.id].loot[B.boss[1].k]={items:ids.w.concat(ids.set,[p+'lens']),extraP:0.35,relic:p+'heart',relicP:0.07,disk:p+'disk',diskP:0.2};DUNGEONS[D.id].loot.trashP=0.03;
    const sf=WEAVES.stillfrost;if(sf){const L=dl+2,X=B.xw;const m=Math.round((5.0*Math.pow(1.2,B.b+1))*10)/10,rad=Math.min(12,11+0.25*(B.b+1));
      WEAVES[X.id]=Object.assign({},sf,{id:X.id,line:X.id,lvl:L,excl:D.id,name:X.name,icon:X.icon,cost:Math.round(110*Math.pow(1.15,B.b+1)),mult:m,radius:rad,root:4,color:X.color,
        desc:'AoE: '+X.txt+' bursts from you, hitting every enemy within '+rad+'m for '+Math.round(m*100)+'% damage and rooting them for 4s.'});WEAVES[X.id].req=wreq('any',L);}}
  validateDungeons();}
/* ---------- creature builders: the shared rigs retinted and dressed (original designs) ---------- */
function xmSpikes(g,n,y,r,cols,s){for(let i=0;i<n;i++){const a=i*6.283/n;part(g,geoCone,MB(cols[i%cols.length]),Math.cos(a)*r,y,Math.sin(a)*r,s,s*4,s);}}
function buildCoilhound(){const R=buildHound(0x3e6a5e,0x1e3430,0x4affd2,{lean:0.9,ears:0.3,tail:0.7});for(let i=0;i<3;i++)part(R.g,geoBox,MB(i%2?0xc8783a:0x4affd2),0,0.95,0.3-i*0.3,0.5,0.06,0.06);return R;}
function buildPatinamancer(){const R=buildHumanoid(0x4e7a6c,0x2e4440,0x4affd2,0x7a8a80,{robe:0x2e4a44,hood:0x3e6a5e});xmSpikes(R.g,4,2.25,0.33,[0xc8783a,0x4affd2],0.06);return R;}
function buildOxidebrute(){const R=buildGolem(0x4e7a6c,0x24302e,0x4affd2);part(R.g,geoBox,M(0xa8683a),0,1.7,0.55,1.3,0.9,0.12);for(let i=0;i<3;i++)part(R.g,geoCyl0(),M(0x6a4a2a),(i-1)*0.5,2.7,-0.4,0.16,0.7,0.16);return R;}
function buildGearpriest(){const R=buildHumanoid(0x5a6a62,0x2a3634,0x4affd2,0x8a7a6a,{heavy:1,bulk:1.05,helm:0x3e5a52});const h=part(R.g,new THREE.TorusGeometry(0.5,0.08,4,10),MB(0xc8783a),0,1.35,-0.35,1,1,1);return R;}
function buildGearwright(){const R=buildHumanoid(0x3e5a52,0xc8783a,0x4affd2,0x7a6a5a,{heavy:1,bulk:1.14,helm:0x2e4440});part(R.armR,geoBox,M(0x6a4a2a),0,-0.95,0.1,0.38,0.38,0.7);part(R.g,geoBox,MB(0x4affd2),0,1.4,0.34,0.42,0.26,0.04);return R;}
function buildOxidecolossus(){const R=buildMauler();retint(R.g,0x3e6a5e,0.8,0x4affd2);for(let i=0;i<4;i++)part(R.g,geoCyl0(),M(0xa8683a),(i-1.5)*0.45,2.9,-0.2,0.2,1.0,0.2);part(R.g,geoIco,MB(0x4affd2),0,2.0,1.2,0.38,0.38,0.38);return R;}
function buildBriarworm(){const R=buildGrub(0x5a3a4a,0x2a1a22,0xff5ab4);for(let i=1;i<5;i++){const S=R.segs[i];if(S)R.det.push(part(S.sg,cq().spike,MB(i%2?0xff5ab4:0xffb0d8),0,S.r*0.85,0,0.07,0.34,0.07));}return R;}
function buildThornseer(){const R=buildHumanoid(0x5a3a4a,0x3a2a32,0xff5ab4,0x8a6a72,{robe:0x40283a,hair:'long',hairc:0xb86a90});const h=part(R.g,new THREE.TorusGeometry(0.32,0.05,4,16),MB(0xff5ab4),0,2.3,0,1,1,1);h.rotation.x=Math.PI/2;return R;}
function buildBloomhulk(){const R=buildMauler();retint(R.g,0x5a3a4a,0.75,0xff5ab4);xmSpikes(R.g,6,2.4,0.55,[0xff5ab4,0xb86a90],0.14);return R;}
function buildThornling(){const R=buildSkitter();retint(R.g,0x7a4a5a,0.8,0xff5ab4);part(R.g,geoCone,MB(0xff7ac8),0,1.0,-0.2,0.2,0.5,0.2);return R;}
function buildBarbcaster(){const R=buildHumanoid(0x4a2a3a,0x6a3050,0xff7ac8,0x6a5056,{robe:0x2a1a24,hood:0x4a2a3a});xmSpikes(R.g,5,2.15,0.22,[0xff7ac8],0.06);return R;}
function buildRosematron(){const R=buildHumanoid(0x4a2a3a,0xff5ab4,0xffb0d8,0x8a6a72,{robe:0x3a1a2a,hair:'long',hairc:0x8a2a5a,bulk:1.06});xmSpikes(R.g,6,2.35,0.42,[0xff5ab4,0xffb0d8],0.12);return R;}
function buildBloomgorger(){const R=buildMauler();retint(R.g,0x4a2a3a,0.8,0xff5ab4);xmSpikes(R.g,8,2.8,0.7,[0xff5ab4,0xb86a90,0xffb0d8],0.18);part(R.g,geoIco,MB(0xff5ab4),0,2.0,1.2,0.4,0.4,0.4);return R;}
function buildGalehound(){const R=buildHound(0x3a3e4a,0x1a1c24,0x7ad8ff,{lean:0.85,ears:0.25,tail:0.9});for(let i=0;i<3;i++)part(R.g,geoCone,MB(i%2?0xffe066:0x7ad8ff),(i-1)*0.2,1.0,-0.2-i*0.15,0.07,0.45,0.07);return R;}
function buildTempestadept(){const R=buildHumanoid(0x3a4050,0x2a2e3a,0x7ad8ff,0x6a6a72,{robe:0x262a36,hood:0x3a4050});for(let i=0;i<3;i++)part(R.g,geoIco,MB(i%2?0xffe066:0x7ad8ff),Math.cos(i*2.1)*0.4,2.3,Math.sin(i*2.1)*0.4,0.12,0.12,0.12);return R;}
function buildThunderhulk(){const R=buildGolem(0x4c5260,0x1e2028,0x7ad8ff);for(let i=0;i<2;i++)part(R.g,geoCyl0(),M(0x8a8e9a),(i?0.5:-0.5),3.0,-0.3,0.1,1.2,0.1);part(R.g,geoIco,MB(0xffe066),0,3.7,-0.3,0.25,0.25,0.25);return R;}
function buildStormward(){const R=buildHumanoid(0x4a5060,0x2a2e38,0x7ad8ff,0x6a6a72,{heavy:1,bulk:1.08,helm:0x3a3e4a});part(R.g,geoBox,M(0x3a3e4a),0,1.25,0.3,0.9,1.3,0.1);part(R.g,geoBox,MB(0x7ad8ff),0,1.35,0.36,0.5,0.5,0.04);return R;}
function buildThunderwarden(){const R=buildHumanoid(0x3a3e4a,0x7ad8ff,0xffe066,0x6a6060,{heavy:1,bulk:1.14,helm:0x262a34});part(R.armR,geoBox,M(0x8a8e9a),0,-1.1,0.1,0.12,0.12,1.2);part(R.g,geoBox,MB(0x7ad8ff),0,1.4,0.34,0.42,0.26,0.04);return R;}
function buildStormengine(){const R=buildGolem(0x3a3e4a,0x1a1c22,0x7ad8ff);for(let i=0;i<4;i++)part(R.g,geoCyl0(),M(0x8a8e9a),(i-1.5)*0.4,3.0,-0.3,0.12,1.3,0.12);part(R.g,geoIco,MB(0xffe066),0,2.0,0.95,0.42,0.42,0.42);return R;}
function buildBonecrawler(){const R=buildGrub(0xd4c6a6,0x8a7a60,0xffc84a);for(let i=1;i<5;i++){const S=R.segs[i];if(S)R.det.push(part(S.sg,cq().spike,M(0xeee6d0),0,S.r*0.85,0,0.08,0.3,0.08));}return R;}
function buildSunpriest(){const R=buildHumanoid(0xd4c6a6,0x8a6a3a,0xffc84a,0xb89a7a,{robe:0xc8b48a,hood:0xd4c6a6});const h=part(R.g,new THREE.TorusGeometry(0.36,0.05,4,18),MB(0xffc84a),0,2.35,-0.1,1,1,1);return R;}
function buildOssuarch(){const R=buildMauler();retint(R.g,0xd4c6a6,0.7,0xffc84a);for(let i=0;i<5;i++)part(R.g,geoBox,M(0xeee6d0),(i-2)*0.32,2.2,-0.3,0.08,0.7,0.5);return R;}
function buildBonemite(){const R=buildSkitter();retint(R.g,0xd8ccb0,0.8,0xffc84a);part(R.g,geoIco,M(0xeee6d0),0,1.0,-0.2,0.3,0.3,0.3);return R;}
function buildGlarecaster(){const R=buildHumanoid(0xb8a888,0x8a6a3a,0xffd86a,0x9a8a6a,{robe:0xa89870,hood:0xb8a888});xmSpikes(R.g,6,2.2,0.26,[0xffd86a],0.05);return R;}
function buildBonecantor(){const R=buildHumanoid(0xc8b898,0xffc84a,0xffe6a0,0xb8a888,{robe:0xa89870,hood:0xd4c6a6,bulk:1.08});const h=part(R.g,new THREE.TorusGeometry(0.5,0.06,4,20),MB(0xffc84a),0,2.4,-0.15,1,1,1);xmSpikes(R.g,4,2.4,0.5,[0xeee6d0],0.07);return R;}
function buildSolmaw(){const R=buildMauler();retint(R.g,0xc8b898,0.75,0xffc84a);for(let i=0;i<6;i++)part(R.g,geoBox,M(0xeee6d0),(i-2.5)*0.36,2.6,-0.2,0.1,1.0,0.6);part(R.g,geoIco,MB(0xffc84a),0,2.2,1.2,0.5,0.5,0.5);return R;}
function buildVoidhound(){const R=buildHound(0x2a2236,0x120c1a,0xb46aff,{lean:0.85,ears:0.3,tail:0.9});for(let i=0;i<3;i++)part(R.g,geoCone,MB(i%2?0x5affe0:0xb46aff),(i-1)*0.2,1.0,-0.2-i*0.15,0.08,0.45,0.08);return R;}
function buildRiftseer(){const R=buildHumanoid(0x2c2236,0x1e1828,0xb46aff,0x6a5a7a,{robe:0x1e1828,hood:0x2c2236});for(let i=0;i<4;i++)part(R.g,geoIco,MB(i%2?0x5affe0:0xb46aff),Math.cos(i*1.57)*0.35,2.2,Math.sin(i*1.57)*0.35,0.12,0.12,0.12);return R;}
function buildScarbehemoth(){const R=buildGolem(0x2a2236,0x100a16,0xb46aff);for(let i=0;i<4;i++)part(R.g,geoCone,M(0x1a1420),(i-1.5)*0.4,2.7,-0.3,0.18,0.9,0.18);return R;}
function buildNullwarden(){const R=buildHumanoid(0x3a2e4a,0x1e1828,0xb46aff,0x5a4a6a,{heavy:1,bulk:1.08,helm:0x2a2236});part(R.g,geoBox,M(0x2a2236),0,1.25,0.3,0.9,1.3,0.1);part(R.g,geoBox,MB(0x5affe0),0,1.35,0.36,0.5,0.5,0.04);return R;}
function buildVoidmaw(){const R=buildMauler();retint(R.g,0x2a2236,0.8,0xb46aff);for(let i=0;i<4;i++)part(R.g,geoIco,MB(i%2?0xb46aff:0x5affe0),(i-1.5)*0.45,2.2,-0.3,0.3,0.3,0.3);return R;}
function buildVoidling(){const R=buildSkitter();retint(R.g,0x3a2e4a,0.8,0xb46aff);part(R.g,geoIco,MB(0xb46aff),0,1.0,-0.2,0.3,0.35,0.3);return R;}
function buildScarherald(){const R=buildHumanoid(0x2a2236,0xb46aff,0x5affe0,0x5a4a6a,{robe:0x1a1222,hood:0x2a2236,bulk:1.08});const h=part(R.g,new THREE.TorusGeometry(0.55,0.06,4,20),MB(0xb46aff),0,2.45,-0.15,1,1,1);xmSpikes(R.g,5,2.5,0.5,[0x5affe0,0xb46aff],0.07);return R;}
function buildGatewarden(){const R=buildGolem(0x2a2236,0x0e0a14,0xb46aff);for(let i=0;i<5;i++)part(R.g,geoCone,MB([0xb46aff,0x5affe0,0x8a4aff][i%3]),(i-2)*0.4,3.0,-0.2,0.16,1.1,0.16);part(R.g,geoIco,MB(0x5affe0),0,2.0,0.95,0.42,0.42,0.42);return R;}
/* ---------- hubs: quartermaster + contract terminal (bank / Save Point / Conduit come from OUTPOSTS + BANK_SPOTS) ---------- */
const XMHUBS=[];
(function buildXmHubs(){const QM=[['Quartermaster Oda Verrin',0x4a6e64,0x2e4440,0x4affd2,0x8a7a6a],['Quartermaster Sable Thorne',0x5a3a4a,0x3a2632,0xff5ab4,0x8a6a72],['Quartermaster Ivo Gale',0x4a5060,0x2e323c,0x7ad8ff,0x7a6a62],
    ['Quartermaster Amun Sere',0xb8a888,0x8a7a60,0xffc84a,0x9a7a5a],['Quartermaster Nyx Ardent',0x3a2e4a,0x221a2e,0xb46aff,0x6a5a7a]];
  XM.regions.forEach((R,b)=>{const o=OUTPOSTS.find(q=>q.id===R.hub);if(!o)return;const B=XMB()[b],col=R.pal,q=QM[b];const y=heightAt(o.x,o.z);const g=new THREE.Group();g.position.set(o.x,y,o.z);
    const H={vend:{x:o.x+8,z:o.z+1},term:{x:o.x,z:o.z-8.5}};
    // signature beacon per region: verdigris pylon / thorn spire / lightning rod / sun-glass obelisk / void-ringed lantern
    if(b===0){part(g,geoCyl0(),M(col[0]),-8,5,-7,1.4,10,1.4);part(g,geoBox,M(0xa8683a),-8,10.2,-7,3.4,0.4,0.6);part(g,geoBox,M(0xa8683a),-8,10.2,-7,0.6,0.4,3.4);}
    else if(b===1){part(g,geoCone,M(col[0]),-8,0,-7,2.2,11,2.2);part(g,geoCone,MB(col[3]),-6.6,0,-7.8,0.6,4,0.6);part(g,geoCone,MB(col[3]),-9.2,0,-6.2,0.5,3,0.5);}
    else if(b===2){part(g,geoBox,M(col[0]),-8,4.5,-7,1.6,9,1.6);part(g,geoBox,M(0x8a8e9a),-8,11,-7,0.2,5,0.2);}
    else if(b===3){part(g,geoBox,M(col[2]),-8,5,-7,1.8,10,1.8);part(g,geoBox,MB(col[3]),-8,10.4,-7,1.1,0.8,1.1);}
    else {part(g,geoBox,M(col[1]),-8,4.5,-7,1.6,9,1.6);const r=part(g,new THREE.TorusGeometry(1.6,0.12,4,18),MB(col[3]),-8,9.8,-7,1,1,1);r.rotation.x=Math.PI/2;}
    part(g,geoIco,MB(col[3]),-8,b===1?11.4:10.6,-7,0.6,0.6,0.6);boxes.push({x0:o.x-8.8,x1:o.x-7.2,z0:o.z-7.8,z1:o.z-6.2,y0:y,y1:y+9.5});
    for(const [x,z] of [[-10,7],[10,-7],[7,10],[-7,-10],[11,5],[-3,11]]){part(g,geoBox,M(col[1]),x,1.3,z,0.25,2.6,0.25);part(g,geoIco,MB(col[3]),x,2.8,z,0.3,0.3,0.3);}
    const v=H.vend;part(g,geoBox,M(col[0]),v.x-o.x+1.4,1.0,v.z-o.z,0.9,2,3.2);part(g,geoBox,M(col[2]),v.x-o.x+1.4,2.2,v.z-o.z,1.6,0.25,3.8);part(g,geoBox,MB(col[3]),v.x-o.x+0.9,1.5,v.z-o.z,0.05,0.4,2);
    boxes.push({x0:v.x+0.9,x1:v.x+1.9,z0:v.z-1.6,z1:v.z+1.6,y0:y,y1:y+2.3});
    const t=H.term;part(g,geoBox,M(0x2b3742),t.x-o.x,1.0,t.z-o.z-0.3,1.8,2,0.5);part(g,geoBox,MB(col[3]),t.x-o.x,1.5,t.z-o.z-0.04,1.4,0.9,0.05);
    boxes.push({x0:t.x-0.9,x1:t.x+0.9,z0:t.z-0.55,z1:t.z-0.05,y0:y,y1:y+2});
    scene.add(g);const bm=makeBeam(col[3],40,0.6,0.25);bm.position.set(o.x-8,y,o.z-7);
    const Q=buildHumanoid(q[1],q[2],q[3],q[4],{npc:1});Q.g.position.set(v.x,heightAt(v.x,v.z),v.z);Q.g.rotation.y=Math.atan2(o.x-v.x,o.z-v.z);scene.add(Q.g);circles.push({x:v.x,z:v.z,r:0.6});
    XHUBS.push(R.hub);XMHUBS.push(R.hub);const min=R.lv[0],nm=R.hn.toUpperCase();
    // stock: Epic weapon/armour one level up + a top-QL implant; from the band two Ascendant pieces, an Ascendant implant and a tier-matched Weave Disk
    HUBS.push({id:R.hub,o,vend:H.vend,term:H.term,vn:q[0],tn:R.hn+' Contracts',title:nm+' QUARTERMASTER',
      stock(list,L){list.push(genItem(L+1,'weapon',3,{wt:pick(wtAff(P.prof))}),genItem(L+1,pick(ASLOTS),3,{fam:PROF_FAM[P.prof]}),genImplant(Math.min(IMPQL_MAX(),L*5),null,3));
        if(L>=min)list.push(genItem(L,'weapon',ASC,{wt:pick(wtAff(P.prof))}),genItem(L,pick(ASLOTS),ASC,{fam:PROF_FAM[P.prof]}),genImplant(Math.min(IMPQL_MAX(),L*5-2),null,ASC));
        const ws=Object.values(WEAVES).filter(w=>w.lvl>=min&&w.lvl<=L+1&&(w.prof===P.prof||w.prof==='any')&&!w.excl&&!w.rare&&!w.starter);if(ws.length){const dk=genDisk(pick(ws).id);if(dk)list.push(dk);}}});});})();
/* ---------- camps: six per region along the sector (offsets in degrees from the sector start, distance from the centre on the square ring) ---------- */
const XMCAMP=[[[6,1000],[17,1075],[29,955],[40,1045],[58,985],[67,1080]],[[5,1050],[18,960],[30,1070],[41,990],[57,1060],[66,970]],[[7,995],[19,1080],[31,960],[42,1050],[58,1000],[66,1075]],
  [[6,1060],[18,985],[30,1075],[41,960],[57,1040],[67,990]],[[6,990],[18,1070],[29,965],[41,1055],[56,1000],[62,1060]]];
const XMCN=[['Gearfall','Rustwind Flats','Toppled Pylons','The Oxide Steps','Coilyard','The Green Furnace'],['Redroot Hollow','Singing Briars','Thornwatch Ruin','The Rose Pits','Crimson Steps','The Bloomwall'],
  ['Shatterbolt Mesa','Coilrest','Thunder Steps','The Static Field','Stormglass Ridge','Galeskull'],['Ribcage Dunes','Sun-glass Shallows','The Pilgrim Bones','Glare Basin','Skullrest','The Hollow Steps'],
  ['Black Glass Shelf','Nullstone','The Torn Steps','Riftmouth Hollow','Voidwind Spur','The Last Shelf']];
(function xmCamps(){const BAND=XMB();BAND.forEach((B,b)=>{const mixes=B.en.filter(e=>!e.small).map(e=>e.k);
  XMCAMP[b].forEach(([off,D],i)=>{const [x,z]=xmAt(b*XM.span+off,D);const L=xmLv(x,z);const m=[mixes[i%mixes.length],mixes[(i+1)%mixes.length],mixes[(i+2)%mixes.length]];if(i>=4)m.push(mixes[(i+3)%mixes.length]);
    const c={id:'xm_'+B.rid+i,name:XMCN[b][i],x,z,lv:[clamp(L-1,B.lo,MAXLVL),clamp(L,B.lo,MAXLVL)],n:m.length>3?7:6,mix:m,biome:XB+b,gate:undefined};initCamp(c);CAMPS.push(c);});});})();
/* ---------- props: instanced per 300 m bucket (game13 PROPB culling), two to four kinds per region ---------- */
(function xmProps(){const R=rng32(9133);const rr=(a,b)=>a+R()*(b-a);const pk=a=>a[Math.floor(R()*a.length)];const o=new THREE.Object3D(),col=new THREE.Color();const W=new Float32Array(NB);
  const near=(x,z,d)=>CAMPS.some(c=>Math.hypot(c.x-x,c.z-z)<d)||OUTPOSTS.some(q=>Math.hypot(q.x-x,q.z-z)<q.r+12)||Object.values(DUNGEONS).some(q=>q.door&&Math.hypot(q.door.x-x,q.door.z-z)<16)||Math.hypot(XM.gate.x-x,XM.gate.z-z)<24;
  function spots(b,n,minW,pred){const out=[];let tries=0;while(out.length<n&&tries<n*30){tries++;const [x,z]=xmAt(b*XM.span+rr(1,71),rr(XM.d0+10,HALF-70));biomeW(x,z,W);if(W[XB+b]<minW||near(x,z,13))continue;if(pred&&!pred(x,z))continue;out.push([x,z]);}return out;}
  function emit(type,geo,mat,items){const buckets={};for(const it of items){const bx=clamp(Math.floor((it.x+HALF)/PB_S),0,PB_N-1),bz=clamp(Math.floor((it.z+HALF)/PB_S),0,PB_N-1);(buckets[bx+','+bz]=buckets[bx+','+bz]||[]).push(it);}
    for(const k in buckets){const L=buckets[k];const im=new THREE.InstancedMesh(geo,mat,L.length);L.forEach((it,i)=>{o.position.set(it.x,it.y,it.z);o.rotation.set(it.rx||0,it.ry||0,it.rz||0);o.scale.set(it.sx,it.sy,it.sz);o.updateMatrix();im.setMatrixAt(i,o.matrix);im.setColorAt(i,col.setHex(it.c));if(it.cr)circles.push({x:it.x,z:it.z,r:it.cr});});
      im.frustumCulled=false;const [bx,bz]=k.split(',').map(Number);im.userData={x0:bx*PB_S-HALF,z0:bz*PB_S-HALF,type};scene.add(im);PROPB.push(im);}}
  const lam=e=>new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true,emissive:e||0});const bas=()=>new THREE.MeshBasicMaterial({color:0xffffff});
  const gOct=new THREE.OctahedronGeometry(1,0),gDod=new THREE.DodecahedronGeometry(1,0),gCyl=new THREE.CylinderGeometry(0.55,1,1,7),gTrunk=new THREE.CylinderGeometry(0.16,0.26,1,6),gDisc=new THREE.CylinderGeometry(1,1,0.12,10),gArc=new THREE.TorusGeometry(1,0.12,4,10,Math.PI);
  const Y=(x,z)=>heightAt(x,z);
  // Coppergale Barrens: toppled verdigris pylons, tilted plates, copper cog-rings, teal scrub
  emit('xm_pylon',gTrunk,lam(),spots(0,70,0.7).map(([x,z])=>{const h=rr(6,14),f=R()<0.55;return {x,y:Y(x,z)+(f?0.6:h/2),z,sx:2.4,sy:h,sz:2.4,rz:f?Math.PI/2:rr(-0.1,0.1),ry:rr(0,6),c:pk([0x4e7a6c,0x5e8a7a,0xa8683a]),cr:f?0:0.6};}));
  emit('xm_plate',geoBox,lam(),spots(0,120,0.65).map(([x,z])=>{const w=rr(2,6);return {x,y:Y(x,z)+0.3,z,sx:w,sy:0.35,sz:w*rr(0.5,0.9),rx:rr(-0.35,0.35),rz:rr(-0.35,0.35),ry:rr(0,6),c:pk([0x3fa88a,0x4e7a6c,0xa8683a,0x6a5a3a])};}));
  emit('xm_cog',gArc,lam(0x0a2a22),spots(0,40,0.75).map(([x,z])=>{const s=rr(2,4.5);return {x,y:Y(x,z)+s*0.3,z,sx:s,sy:s,sz:s,ry:rr(0,6),c:pk([0xc8783a,0x4affd2]),cr:s*0.5};}));
  emit('xm_scrub',gDod,lam(),spots(0,220,0.6).map(([x,z])=>{const s=rr(0.4,1.2);return {x,y:Y(x,z)+s*0.3,z,sx:s,sy:s*0.6,sz:s,ry:rr(0,6),c:pk([0x2e6a5a,0x3e7a62,0x5a8a6a])};}));
  // Thornspire Wilds: giant rose-crystal thorns, briar clumps, glowing buds
  emit('xm_thorn',geoCone,lam(0x2a0a1a),spots(1,200,0.7).map(([x,z])=>{const h=rr(4,16),w=rr(0.5,1.4);return {x,y:Y(x,z)-0.3,z,sx:w,sy:h,sz:w,rx:rr(-0.3,0.3),rz:rr(-0.3,0.3),c:pk([0xb86a90,0x8a3a6a,0xd88ab0,0x5a2a42]),cr:h>8?w*0.7:0};}));
  emit('xm_briar',gOct,lam(),spots(1,220,0.6).map(([x,z])=>{const s=rr(0.8,2.4);return {x,y:Y(x,z)+s*0.3,z,sx:s,sy:s*0.7,sz:s,ry:rr(0,6),rx:rr(0,1),c:pk([0x4a2a3a,0x5a3a2a,0x3a2a2a])};}));
  emit('xm_bud',geoIco,bas(),spots(1,140,0.65).map(([x,z])=>{const s=rr(0.25,0.6);return {x,y:Y(x,z)+rr(0.4,1.6),z,sx:s,sy:s,sz:s,c:pk([0xff5ab4,0xff9ad0,0xffd0ea])};}));
  // Stormveil Plateau: slate monoliths, lightning rods with glowing tips, scattered slate
  const rods=spots(2,60,0.7).map(([x,z])=>({x,z,h:rr(8,16),y:Y(x,z)}));
  emit('xm_rod',gTrunk,lam(),rods.map(p=>({x:p.x,y:p.y+p.h/2,z:p.z,sx:0.7,sy:p.h,sz:0.7,c:0x8a8e9a,cr:0.3})));
  emit('xm_rodtip',geoIco,bas(),rods.map(p=>({x:p.x,y:p.y+p.h+0.3,z:p.z,sx:0.45,sy:0.45,sz:0.45,c:pk([0x7ad8ff,0xffe066])})));
  emit('xm_mono',geoBox,lam(),spots(2,110,0.7).map(([x,z])=>{const h=rr(3,12),w=rr(1,3);return {x,y:Y(x,z)+h/2-0.4,z,sx:w,sy:h,sz:w*rr(0.4,0.8),ry:rr(0,6),rz:rr(-0.12,0.12),c:pk([0x3a3e4a,0x4c5260,0x2e323c]),cr:w*0.6};}));
  emit('xm_slate',gDod,lam(),spots(2,200,0.6).map(([x,z])=>{const s=rr(0.6,2.6);return {x,y:Y(x,z)+s*0.2,z,sx:s*1.3,sy:s*0.4,sz:s,ry:rr(0,6),c:pk([0x4a4e58,0x5a5e68,0x3a3e48]),cr:s>1.8?s*0.8:0};}));
  // Hollowsun Reach: colossal rib arches, skull boulders, sun-glass shards, dune grass
  emit('xm_rib',gArc,lam(),spots(3,60,0.7).map(([x,z])=>{const s=rr(5,12);return {x,y:Y(x,z)-0.5,z,sx:s,sy:s*1.3,sz:s,ry:rr(0,6),c:pk([0xeee6d0,0xd8ccb0,0xc8bca0])};}));
  emit('xm_skull',gDod,lam(),spots(3,90,0.65).map(([x,z])=>{const s=rr(1,3.4);return {x,y:Y(x,z)+s*0.4,z,sx:s,sy:s*0.85,sz:s*1.1,ry:rr(0,6),c:pk([0xeee6d0,0xd8ccb0]),cr:s>2?s*0.8:0};}));
  emit('xm_sunglass',gOct,bas(),spots(3,130,0.65).map(([x,z])=>{const s=rr(0.4,1.4);return {x,y:Y(x,z)+s*0.5,z,sx:s*0.6,sy:s*1.6,sz:s*0.6,rx:rr(-0.4,0.4),rz:rr(-0.4,0.4),c:pk([0xffd86a,0xffc84a,0xfff0b0])};}));
  emit('xm_grass',geoCone,lam(),spots(3,200,0.6).map(([x,z])=>{const h=rr(0.6,1.6);return {x,y:Y(x,z)+h/2,z,sx:0.25,sy:h,sz:0.25,rx:rr(-0.25,0.25),c:pk([0xc8b070,0xb89a5a,0xd8c890])};}));
  // The Riftscar: black glass spikes, raw Vyre crystals, floating shards
  emit('xm_glass',gOct,lam(0x14081e),spots(4,220,0.7).map(([x,z])=>{const h=rr(3,12),w=rr(0.6,1.8);return {x,y:Y(x,z)+h*0.4,z,sx:w,sy:h,sz:w,ry:rr(0,6),rx:rr(-0.25,0.25),c:pk([0x1a1420,0x2a2236,0x120c1a]),cr:h>5?w*0.8:0};}));
  emit('xm_vyre',gOct,bas(),spots(4,120,0.7).map(([x,z])=>{const s=rr(0.5,1.6);return {x,y:Y(x,z)+s,z,sx:s*0.6,sy:s*1.8,sz:s*0.6,rx:rr(-0.4,0.4),rz:rr(-0.4,0.4),c:pk([0xb46aff,0x8a4aff,0x5affe0])};}));
  emit('xm_float',gDod,lam(0x1a0a2a),spots(4,60,0.75).map(([x,z])=>{const s=rr(1,3);return {x,y:Y(x,z)+rr(4,10),z,sx:s,sy:s*0.7,sz:s,rx:rr(0,3),ry:rr(0,3),c:pk([0x2a2236,0x3a2e4a])};}));})();
/* ---------- the sealed gate of the future Lv 100 raid (Build M hook: a later build opens it; see RAIDS.sunless.hook) ---------- */
const XMGATE=(function(){const p=XM.gate,y=heightAt(p.x,p.z);const g=new THREE.Group();g.position.set(p.x,y,p.z);g.rotation.y=Math.atan2(-p.x,-p.z);
  part(g,geoBox,M(0x1a1420),-4.2,5,0,1.6,10,1.6);part(g,geoBox,M(0x1a1420),4.2,5,0,1.6,10,1.6);part(g,geoBox,M(0x2a2236),0,10.4,0,10.4,1.4,1.8);
  const ring=part(g,new THREE.TorusGeometry(3.2,0.22,6,28),MB(0xb46aff),0,4.6,0,1,1,1);const seal=part(g,new THREE.CircleGeometry(3.0,24),new THREE.MeshBasicMaterial({color:0x2a0a3a,transparent:true,opacity:0.85,side:THREE.DoubleSide}),0,4.6,0,1,1,1);
  for(let i=0;i<6;i++){const a=i*1.047;part(g,geoBox,MB(0x5affe0),Math.cos(a)*2.4,4.6+Math.sin(a)*2.4,0.1,0.18,0.9,0.08).rotation.z=a;}
  scene.add(g);boxes.push({x0:p.x-5,x1:p.x+5,z0:p.z-1.2,z1:p.z+1.2,y0:y,y1:y+11});const bm=makeBeam(0xb46aff,60,0.9,0.22);bm.position.set(p.x,y,p.z);
  return {x:p.x,z:p.z,g,ring,seal,raid:'sunless'};})();
let xmGateAcc=0;function updXmGate(dt){if(DUN||!XMGATE)return;XMGATE.ring.rotation.z+=dt*0.4;xmGateAcc+=dt;if(xmGateAcc<0.5)return;xmGateAcc=0;
  const d=Math.hypot(P.pos.x-XMGATE.x,P.pos.z-XMGATE.z);if(d<12&&!XMGATE.told&&RG.cur==='scar'){XMGATE.told=true;const gm=sunGateMsg();banner(gm[0],gm[1]);log('🌀 <b>The Sunless Gate</b>: '+esc(gm[1])+'.');}else if(d>30)XMGATE.told=false;}
/* ---------- dungeon looks (game24 DTHEME/DLAY) ---------- */
(function xmDunLooks(){const DIM=[[30,24],[40,32],[38,34],[38,30],[36,34],[40,32],[38,30],[48,44]];
  for(const B of XMB()){const D=B.dun,id=D.id;const L=[];D.lay.forEach((s,i)=>{const a={s,w:DIM[i][0],d:DIM[i][1]};if(s==='flooded'||s==='forge')a.y=-3;
      if(i===2){a.n=D.rooms[i];a.pk=1;}else{a.o=i<2?i:i-1;a.nm=D.rooms[i];}
      if(i===1)a.wing={side:-1,kind:'loot',w:16,d:14};if(i===3){a.bal=1;a.wing={side:-1,kind:'secret',w:14,d:12};}if(i===4)a.sc=true;if(i===5)a.wing={side:1,kind:'elite',w:16,d:14};
      L.push(a);if(i<D.cor.length)L.push({c:D.cor[i],len:D.cor[i]==='bridge'?18:D.cor[i]==='vents'?14:12});});
    DLAY[id]=L;const g=B.acc,g2=B.acc2;
    DTHEME[id]={tex:D.tex,texS:0.2,wallH:9,floor:D.floor,floor2:D.floor,wall:D.wall,trim:D.trim,acc:g,glow:[g,g2,g],crack:g,crackK:1.0,
      fog:D.fog,fogN:30,fogF:118,hemi:[0xe8e4f0,D.trim,0.82],dir:0.42,light:[g,g2,g],pit:g,water:D.water,lava:B.b===4,
      part:{col:g2,size:0.18,vy:B.b===2?0.6:0.3,drift:0.32,add:true},shaft:g2,sky:D.sky,name:D.name2};}})();
/* ---------- contracts and guards in the outer regions ---------- */
function xrTypes(lv){if(lv>=51){const B=XMB()[clamp(Math.floor((Math.min(lv,100)-51)/10),0,4)];return B.en.filter(e=>!e.small).map(e=>e.k);}return xrTypes_j(lv);}
function xrSpot(lv){if(lv<51)return xrSpot_j(lv);const L=clamp(lv,51,100),b=clamp(Math.floor((L-51)/10),0,4),f=(L-51-10*b)/10;
  for(let i=0;i<20;i++){const [x,z]=xmAt(b*XM.span+clamp(f*XM.span+rand(-3,7),2,XM.span-2),rand(XM.d0+40,HALF-110));if(!OUTPOSTS.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+14))return {x,z};}
  const R=XM.regions[b];return {x:R.hx*0.97,z:R.hz*0.97};}
function xrRegionName(lv){return lv>=51?BIOMES[XB+clamp(Math.floor((Math.min(lv,100)-51)/10),0,4)].name:xrRegionName_j(lv);}
/* ---------- Weave ranks to 100 for all 14 professions: each profession's two highest lines gain five ranks each
   (line A at 54/64/74/84/94, line B at 58/68/78/88/100), so every band brings two new ranks and Tier 4-7 each lock some of them ---------- */
const XM_WLV=[[54,64,74,84,94],[58,68,78,88,100]];
const XM_ROMAN=n=>{const t=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let s='';for(const [v,c] of t)while(n>=v){s+=c;n-=v;}return s;};
(function xmWeaves(){const pc=v=>Math.round(v*100)+'%';
  for(const pk in PROFS){const tops={};for(const w of Object.values(WEAVES)){if(w.prof!==pk||w.excl||w.rare||w.starter||w.mab)continue;const t=tops[w.line];if(!t||w.tier>t.tier)tops[w.line]=w;}
    const lines=Object.values(tops).sort((a,b)=>b.lvl-a.lvl||b.tier-a.tier).slice(0,2);
    lines.forEach((top,li)=>{let prev=top;const first=Object.values(WEAVES).filter(w=>w.line===top.line&&!w.excl).sort((a,b)=>a.tier-b.tier)[0]||top;const root=first.name.replace(/\s+[IVXL]+$/,'');
      XM_WLV[li].forEach(lv=>{const w=Object.assign({},prev);delete w.req;w.tier=prev.tier+1;w.id=top.line+w.tier;if(WEAVES[w.id])w.id=top.line+'_m'+w.tier;w.lvl=lv;w.name=root+' '+XM_ROMAN(w.tier);w.xm=1;
        let d=prev.desc||'';const rep=(k,f)=>{if(w[k]==null||typeof w[k]!=='number')return;const o=w[k];w[k]=f(o);d=d.split(pc(o)).join(pc(w[k]));};
        rep('mult',v=>Math.round(v*1.2*100)/100);rep('pct',v=>Math.min(0.95,Math.round((v+0.06)*100)/100));rep('heal',v=>Math.min(0.6,Math.round((v+0.04)*100)/100));rep('hot',v=>Math.round((v+0.01)*100)/100);
        if(w.kind==='petbuff'&&typeof w.dmg==='number'){const od=w.dmg,oh=w.hp;w.dmg=Math.round((od+0.3)*100)/100;w.hp=Math.round((oh+0.12)*100)/100;d=d.replace('+'+Math.round((od-1)*100)+'% bot damage','+'+Math.round((w.dmg-1)*100)+'% bot damage').replace(Math.round(oh*100)+'% more health',Math.round(w.hp*100)+'% more health');}
        if(w.radius){const o=w.radius;w.radius=Math.min(12,o+0.5);d=d.split(o+'m').join(w.radius+'m');}if(w.root)w.root=Math.min(8,Math.round((w.root+0.5)*10)/10);
        if(w.cost)w.cost=Math.round(w.cost*1.15);w.desc=d;w.req=wreq(w.prof,w.lvl);WEAVES[w.id]=w;prev=w;});});}})();
/* ---------- perks: Tier 5 / 6 / 7 perks on every line (general and profession), built from the line's Mastery ----------
   T5 "<X> Resolve" 3 ranks (Tier 5, 9 points in the line, Lv 60/65/70), T6 "<X> Dominion" 5 ranks (Tier 6, 12 points, Lv 80-96),
   T7 "<X> Apotheosis" 1 rank (Tier 7, 17 points, Lv 100). Points: one per level from 10 plus +1 per first team-dungeon clear. */
(function xmPerks(){for(const line in PERK_LINES){const m=Object.values(PERKS).find(p=>p.line===line&&p.tier===4);if(!m)continue;const X=m.name.replace(/\s+Mastery$/,'');const base=m.id.replace(/^m_/,'');
  PERKS['t5_'+base]={id:'t5_'+base,line,tier:5,name:X+' Resolve',icon:m.icon,ranks:3,mods:(r,c)=>m.mods(2*r,c),txt:m.txt,ab:null,tierReq:5,need:9,rstep:5};
  PERKS['t6_'+base]={id:'t6_'+base,line,tier:6,name:X+' Dominion',icon:m.icon,ranks:5,mods:(r,c)=>m.mods(2*r,c),txt:m.txt,ab:null,tierReq:6,need:12,rstep:4};
  const k6=m.mods(6,null);const ex=k6.power==null?'power':k6.crit==null?'crit':'dr';const exv=ex==='power'?6:ex==='crit'?3:3;
  PERKS['t7_'+base]={id:'t7_'+base,line,tier:7,name:X+' Apotheosis',icon:'✴️',ranks:1,mods:(r,c)=>{const o=m.mods(6*r,c);o[ex]=(o[ex]||0)+exv*r;return o;},txt:m.txt+', +{'+ex+'}'+(ex==='dr'?'% damage reduction':ex==='power'?'% power':'% crit'),ab:null,tierReq:7,need:17,rstep:5};}})();
/* ---------- team gates: Heartforge: Ignition (50, Build J) is live now; Lv 60/70/80/90 use the band dungeons in team mode ----------
   Requirements are data and between them name all 14 professions (directly or through their role). */
TD_BANDS.push(60,70,80,90);
Object.assign(TEAMD,{
  oxidevault:{key:'oxidevault',band:6,name:'Oxide Vault: Overdrive',sub:'Team dungeon · every turbine in the vault at full pressure',content:60,minLvl:57,lvl:3,minTeam:3,
    req:[{role:'tank',why:'The Colossus\'s Piston Crush must land on a tank'},{any:[{role:'healer'},{role:'support'}],why:'Steam Scald ticks the whole team down: bring a healer or a support (Anthemist / Exactor)'},
      {role:'pet',why:'Only a Dronewright\'s or a Riftbinder\'s construct can hold the Pressure Valve while the team fights'}],
    mech:{buster:{name:'Piston Crush',every:11,first:6,mult:3.6},pulse:{name:'Steam Scald',every:13,first:8,pct:0.24},adds:{name:'Vault gear-priests',at:[0.7,0.35],n:3},seal:{name:'Pressure Valve',at:0.5,prof:'wright',profs:['wright','binder'],chan:5}}},
  briarsepulchre:{key:'briarsepulchre',band:7,name:'Briar Sepulchre: Red Harvest',sub:'Team dungeon · the whole garden in bloom',content:70,minLvl:67,lvl:3,minTeam:3,
    req:[{role:'tank',why:'The Bloomgorger\'s Maw must land on a tank'},{role:'healer',why:'Thornrot bleeds the whole team'},
      {any:[{prof:'runner'},{prof:'shade'},{prof:'fist'}],why:'Only a fast striker (Glintrunner, Veilblade or Ironpalm) can cut the Heartroot before it reseeds'}],
    mech:{buster:{name:'Gorging Maw',every:11,first:6,mult:3.7},pulse:{name:'Thornrot',every:13,first:8,pct:0.25},adds:{name:'Briar spawn',at:[0.7,0.35],n:3},seal:{name:'Heartroot',at:0.5,prof:'runner',profs:['runner','shade','fist'],chan:5}}},
  galecrown:{key:'galecrown',band:8,name:'Galecrown: Eye of the Storm',sub:'Team dungeon · the Storm Engine fully charged',content:80,minLvl:77,lvl:3,minTeam:4,
    req:[{any:[{prof:'vanguard'},{prof:'siege'}],why:'Only heavy armour (Vanguard or Siegebreaker) survives the Engine\'s Lightning Brand'},{any:[{prof:'mender'},{prof:'harm'}],why:'Static Storm needs a Mender\'s or an Anthemist\'s team heals'},
      {role:'control',why:'Charged adds must be held: bring a Vyreweaver or a Dreamshaper'}],
    mech:{buster:{name:'Lightning Brand',every:11,first:6,mult:3.8},pulse:{name:'Static Storm',every:13,first:8,pct:0.26},adds:{name:'Charged stormwards',at:[0.7,0.35],n:3},seal:{name:'Grounding Coil',at:0.5,prof:'weaver',profs:['weaver','mind'],chan:5}}},
  sunossuary:{key:'sunossuary',band:9,name:'Ossuary of Suns: Eclipse',sub:'Team dungeon · the hollow sun at noon',content:90,minLvl:87,lvl:3,minTeam:4,
    req:[{role:'tank',why:'Solmaw\'s Sunbrand would burn anyone but a tank'},{any:[{role:'healer'},{role:'support'}],why:'Noon Glare scorches the whole team and Eclipse drains everyone\'s energy: bring a healer or a support (an Anthemist or Exactor keeps the team casting; both is best)'},
      {any:[{prof:'flux'},{prof:'wild'},{prof:'siege'}],why:'Only raw power (Fluxwright, Wildshifter or Siegebreaker) can shatter the Sun Seal'}],
    mech:{buster:{name:'Sunbrand',every:11,first:6,mult:3.9},pulse:{name:'Noon Glare',every:13,first:8,pct:0.27},adds:{name:'Bone choir',at:[0.7,0.35],n:3},seal:{name:'Sun Seal',at:0.5,prof:'flux',profs:['flux','wild','siege'],chan:5}}}});
/* ---------- the future Lv 100 raid: a hook only (opened by a later build) ---------- */
if(RAIDS.sunless){RAIDS.sunless.minLvl=100;RAIDS.sunless.hook={gate:{x:XM.gate.x,z:XM.gate.z},region:'scar',where:'the Sunless Gate in the Riftscar',needs:{level:100,team:6},status:'sealed'};}
/* ---------- Tier up moments: Tier 5-7 get their own colours, a second shock ring and a longer fanfare ---------- */
const XM_TFX={5:{c:'#7ad8ff',h:0x7ad8ff,f:[523,659,784,1046,1318,1568]},6:{c:'#b46aff',h:0xb46aff,f:[440,554,659,880,1108,1318,1760]},7:{c:'#ffd25a',h:0xffffff,f:[392,523,659,784,1046,1318,1568,2093]}};
(function(){const st=document.createElement('style');st.textContent=
  '#tierFx.t5 .tfx-ring{border-color:#7ad8ff;box-shadow:0 0 40px #7ad8ff,inset 0 0 30px #7ad8ff}#tierFx.t5 .tfx-k{color:#7ad8ff;text-shadow:0 0 28px rgba(122,216,255,.95),0 3px 6px #000}'+
  '#tierFx.t6 .tfx-ring{border-color:#b46aff;box-shadow:0 0 44px #b46aff,inset 0 0 30px #b46aff}#tierFx.t6 .tfx-k{color:#d0a0ff;text-shadow:0 0 30px rgba(180,106,255,.95),0 3px 6px #000}'+
  '#tierFx.t7 .tfx-ring{border-color:#fff;box-shadow:0 0 60px #ffd25a,0 0 120px #b46aff,inset 0 0 40px #ffd25a}#tierFx.t7 .tfx-k{color:#fff;text-shadow:0 0 30px #ffd25a,0 0 60px #b46aff,0 3px 6px #000}'+
  '#tierFx .tfx-ring2{position:absolute;left:50%;top:42%;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:3px solid currentColor;opacity:.8;animation:tfxRing 2.2s .35s ease-out forwards}'+
  '#tierFx .tfx-x{font-size:clamp(12px,2.6vw,16px);margin-top:8px;color:#fff;opacity:.92;text-shadow:0 2px 4px #000}';document.head.appendChild(st);})();
function tierUp(t,lv){tierUp_j(t,lv);const X=XM_TFX[t];const el=$('#tierFx');if(el){el.classList.remove('t5','t6','t7');}if(!X||!el)return;el.classList.add('t'+t);el.style.color=X.c;
  const r2=document.createElement('div');r2.className='tfx-ring2';el.appendChild(r2);const box=el.querySelector('.tfx-box');
  if(box){const x=document.createElement('div');x.className='tfx-x';x.textContent=t===7?'The highest tier · every Tier 7 Weave and Apotheosis perk unlocked':'Tier '+t+' Weaves and perks unlocked';box.appendChild(x);}
  try{X.f.forEach((f,i)=>setTimeout(()=>tone(f,0.3,'sine',0.05),900+i*110));}catch(e){}
  if(P&&P.pos){ringFx(P.pos.x,P.pos.z,X.h,16,2.2);if(t===7)setTimeout(()=>{if(P&&P.pos)ringFx(P.pos.x,P.pos.z,0xb46aff,22,2.6);},600);}}
// world map labels for the outer regions (sector centres)
XM.regions.forEach((R,b)=>{const p=xmAt(b*XM.span+XM.span/2,1050);BIOMES[XB+b].mapAt=p;});
function capMExports(){return {ROLE,XM,XB,XMB,xmLv,xmBand,xmBand0,xmAt,xmDeg,XMHUBS,XMGATE,XM_WLV,XM_TFX,xrTypes,xrSpot,xrRegionName,expansionDataM,lineMax,perkNeedLine,perkLvl,TD_BANDS,TEAMD,RAIDS,MAXLVL,xpNeed,IMPQL_MAX,updXmGate};}
