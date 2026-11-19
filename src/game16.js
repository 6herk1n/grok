/* ================= MISSIONS: multi-mission log, side quests, new mission types =================
   P.quests holds every active optional mission (terminal contracts + side quests), up to MAXQ=6; story missions stay separate.
   Side quests come from named NPCs (givers) in every region. A side quest is a list of steps; step kinds:
     fetch (pick up objects) · loot (enemies drop quest items at a drop rate) · deliver (carry to an NPC) · talk · escort · defend (waves)
     scan (activate terminals, short channel) · hunt (named elite, or a dyna boss) · explore (discover places) · kill
     choice (branching: each option adds its own steps and rewards). Any step can carry time:N (timed: fail at 0, retry from the log).
   Old saves: the single active contract (P.mission) migrates into the log. P.mission stays as an accessor = first contract. */
const MAXQ=6;var QRT={};const QS={acc:0,wpAcc:0,chan:null};
function pol(r,deg){const a=deg*Math.PI/180;return [Math.cos(a)*r,Math.sin(a)*r];}
function freeSpot(x,z,rad,noCamp){for(let k=0;k<60;k++){const a=k*2.4,d=k*1.3;const px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
    if(Math.abs(px)>HALF-35||Math.abs(pz)>HALF-35)continue;if(heightAt(px,pz)<WATER_Y+0.5)continue;
    if(circles.some(c=>Math.hypot(c.x-px,c.z-pz)<c.r+(rad||1.5)))continue;if(boxes.some(b=>px>b.x0-2&&px<b.x1+2&&pz>b.z0-2&&pz<b.z1+2))continue;
    if(!noCamp&&CAMPS.some(c=>Math.hypot(c.x-px,c.z-pz)<24))continue;return [Math.round(px*10)/10,Math.round(pz*10)/10];}return [x,z];}
/* ---------- givers ---------- */
const GIVERS=[
  {id:'marta',name:'Marta Vell',role:'Caravan master',at:[12,12],body:0x8a6a3a,acc:0x3a2a1a,vis:0xffc85a},
  {id:'oren',name:'Oren Dask',role:'Prospector, Cinderwell',at:[8,-70],body:0x6a5a4a,acc:0xc8a040,vis:0xfff2a0,gate:'cinderwell'},
  {id:'ilka',name:'Ilka Sand',role:'Glass-cutter, Glassreach',at:[163,0],body:0x9fb8b6,acc:0x2a4a50,vis:0x7ff6ff,gate:'glassreach'},
  {id:'tabb',name:'Old Tabb',role:'Dune hermit',at:[-118,150],body:0xb09a70,acc:0x5a4a30,vis:0xffe08a},
  {id:'amsa',name:'Wellkeeper Amsa',role:'Mirewell Oasis',at:pol(262,182),body:0x55783a,acc:0x2a3a1c,vis:0xc8f060},
  {id:'penn',name:'Surveyor Penn Holloway',role:'Whitepan Salt Flats',at:pol(262,298),body:0xd2ccbe,acc:0x6a6458,vis:0x59c8ff,gate:'cinderwell'},
  {id:'kael',name:'Ridgewarden Kael',role:'Redspire Canyons',at:pol(262,238),body:0xb85a3c,acc:0x4a2016,vis:0xffb347,gate:'mine'},
  {id:'morrow',name:'Tinker Morrow',role:'Rustmaw Scrapyard',at:pol(262,118),body:0x5c5e62,acc:0xa05a2a,vis:0xffa040,gate:'factions'},
  {id:'ondine',name:'Seer Ondine Vash',role:'Shimmerfield',at:pol(268,18),body:0x7fd8c8,acc:0x2b1840,vis:0xb46bff,gate:'glassreach'},
  {id:'teo',name:'Teo Brand',role:'Ashborn exile, Cinderveil',at:pol(262,42),body:0x4a2a20,acc:0xff6a2a,vis:0xffb347,gate:'vault'},
  {id:'quill',name:'Scout Vessa Quill',role:'Farwatch Station, Duskcrown',at:[-404,244],body:0x4a4060,acc:0x2a2438,vis:0x7ff6ff,gate:'farwatch'},
  {id:'orlo',name:'Glasswright Orlo Venn',role:'Duskcrown east terraces',at:gloamAt(40,465),body:0xa8a0c8,acc:0x3a2a50,vis:0xd8c0ff,gate:'farwatch'},
  {id:'kettle',name:'Iceward Bram Kettle',role:'Hoarlight Hold, Rimefall',at:[614,-339],body:0x6a7c90,acc:0x2a3440,vis:0xffb347,gate:'hoarlight'},
  {id:'siv',name:'Huntress Siv Arnault',role:'Rimefall northern drifts',at:rimeAt(90,705),body:0xe8eef4,acc:0x3a4a5a,vis:0x9fe8ff,gate:'hoarlight'}];
const GV={};GIVERS.forEach(g=>{const s=inTown({x:g.at[0],z:g.at[1]})?g.at:freeSpot(g.at[0],g.at[1],1.6);g.x=s[0];g.z=s[1];GV[g.id]=g;
  g.R=buildHumanoid(g.body,g.acc,g.vis,null,{npc:1});g.R.g.position.set(g.x,heightAt(g.x,g.z),g.z);g.R.g.rotation.y=Math.atan2(-g.x,-g.z);
  g.mk=part(g.R.g,geoBox,MB(0xffd25a),0,3.25,0,0.14,0.46,0.14);g.mk2=part(g.R.g,geoBox,MB(0xffd25a),0,2.9,0,0.14,0.14,0.14);
  scene.add(g.R.g);circles.push({x:g.x,z:g.z,r:0.6});});
const gNear=(id,d,deg,noCamp)=>{const g=GV[id];const a=deg*Math.PI/180;return freeSpot(g.x+Math.cos(a)*d,g.z+Math.sin(a)*d,1.5,noCamp);};
const gAt=(x,z,noCamp)=>freeSpot(x,z,1.5,noCamp);
/* ---------- step builders ---------- */
const F=(obj,at,n,guard,o)=>Object.assign({k:'fetch',obj,at,n:n||1,guard:guard||null},o);
const Lt=(t,item,n,p,at,o)=>Object.assign({k:'loot',t,item,n,p,at:at||null},o);
const Dl=(to,item,o)=>Object.assign({k:'deliver',to,item},o);
const Tk=(to,line,o)=>Object.assign({k:'talk',to,line},o);
const Es=(who,from,to,amb,o)=>Object.assign({k:'escort',who,from,to,amb},o);
const Df=(obj,at,waves,t,n,o)=>Object.assign({k:'defend',obj,at,waves,t,n},o);
const Sc=(obj,pts,o)=>Object.assign({k:'scan',obj,pts},o);
const Hu=(name,t,at,o)=>Object.assign({k:'hunt',name,t,at},o);
const Hd=(dyna,o)=>Object.assign({k:'hunt',dyna},o);
const Ex=(pts,o)=>Object.assign({k:'explore',pts},o);
const Ki=(t,n,at,o)=>Object.assign({k:'kill',t,n,at:at||null},o);
const Ch=(text,opts)=>({k:'choice',text,opts});
/* ---------- side quests (all optional; rewards scale with your level, enemies capped at the quest level +3) ---------- */
const SQ=[
 // Marta Vell, Halden's Rest
 {id:'m_bounty',g:'marta',t:'Skitter Bounty',lv:1,txt:'"The skitters are nesting in the wagon ruts again. Six of them, and the caravans roll at dusk."',steps:[Ki('skitter',6,gNear('marta',60,40))],rew:{x:0.25,c:0.8}},
 {id:'m_cargo',g:'marta',t:'Spilled Cargo',lv:1,txt:'"A wagon tipped in the dunes east of town. Three crates of med-gel are lying out there. Bring them in before the raiders do."',steps:[F('Med-gel crate',gNear('marta',75,10),3,{t:'skitter',n:2})],rew:{x:0.3,c:1,item:true}},
 {id:'m_walk',g:'marta',t:'The Long Walk',lv:3,txt:'"Pilgrim Ressa wants to reach Old Tabb\'s camp on foot. On foot! Walk with her. The raiders smell pilgrims."',steps:[Es('Pilgrim Ressa',gNear('marta',16,95,true),gNear('tabb',8,-60,true),{t:'raider',n:2})],rew:{x:0.4,c:1.2,item:true}},
 {id:'m_courier',g:'marta',t:'Courier Run',lv:2,gate:'cinderwell',txt:'"Oren at Cinderwell is waiting on drill bits. The drill seizes if they sit out in the heat. You have three minutes."',steps:[Dl('oren','Drill bits',{time:180})],rew:{x:0.3,c:1.3}},
 // Oren Dask, Cinderwell
 {id:'o_glands',g:'oren',t:'Glow Glands',lv:2,txt:'"Skitter glands glow when there\'s Vyre near. I need four to calibrate my scanners. Not every skitter has a good one."',steps:[Lt('skitter','Glowing gland',4,0.45,gNear('oren',55,200))],rew:{x:0.3,c:1}},
 {id:'o_survey',g:'oren',t:'Seismic Survey',lv:3,txt:'"Three seismic posts around Cinderwell went quiet. Reset them by hand. It takes a few seconds each, so keep the skitters off you."',steps:[Sc('Seismic post',[gNear('oren',40,30),gNear('oren',45,150),gNear('oren',42,260)])],rew:{x:0.35,c:1.1}},
 {id:'o_shift',g:'oren',t:'The Missing Shift',lv:4,txt:'"Shift nine never came back from the north dig. Find the dig, find their logbook. Then we decide what to do with what it says."',chain:true,steps:[
   Ex([[...gNear('oren',70,300),'North dig site']]),F('Shift nine logbook',gNear('oren',76,296),1,{t:'raider',n:3}),Tk('oren','"It says Foreman Krell sealed them in to hide a Vyre seam. Gods."'),
   Ch('Oren: "The families deserve the truth, or Krell deserves a reckoning. Which is it?"',[
     {label:'Bring the logbook to the families in town',out:'The families got their answer. Marta paid for the wake.',steps:[Dl('marta','Shift nine logbook')],rew:{c:1.6}},
     {label:'Hunt down Foreman Krell',out:'Krell will not seal another shaft.',steps:[Hu('Foreman Krell','raider',gNear('oren',95,330))],rew:{item:true,x:0.15}}])],rew:{x:0.6,c:1.4}},
 // Old Tabb, Kessra desert
 {id:'t_bones',g:'tabb',t:'Old Bones',lv:1,txt:'"The desert keeps its dead in plain sight, if you know where to look. Go and look. Three places. Tell me if they\'re still there."',steps:[Ex([[-112,40,'Bleached Ribs'],[-81,-24,'Dry Wash'],[...gAt(-150,95),'Old Signal Mast']])],rew:{x:0.3,c:0.7}},
 {id:'t_storm',g:'tabb',t:'Before the Storm',lv:2,txt:'"Storm\'s coming in four minutes. There\'s salvage strewn east of my camp. Grab four pieces before the sand eats them."',steps:[F('Salvage',gNear('tabb',45,-20),4,null,{time:240})],rew:{x:0.3,c:1.2}},
 {id:'t_gravel',g:'tabb',t:'Gravelmaw',lv:5,txt:'"Gravelmaw. Biggest mauler you\'ll ever see. Took my brother\'s leg. Comes back every time you kill it, they say. Kill it anyway."',steps:[Hd('gravelmaw')],rew:{x:0.5,c:1.5,item:true}},
 // Wellkeeper Amsa, Mirewell Oasis
 {id:'a_pumps',g:'amsa',t:'Clogged Pumps',lv:3,txt:'"The reeds choke the pump heads. Three of them. Clear them and the oasis drinks again."',steps:[Sc('Pump head',[gNear('amsa',30,20),gNear('amsa',36,140),gNear('amsa',33,250)])],rew:{x:0.35,c:1}},
 {id:'a_well',g:'amsa',t:'Thirsty Raiders',lv:4,txt:'"Raiders want the well. They come in waves at dusk. Stand with the well. If its housing breaks, we lose the season."',steps:[Df('Well housing',gNear('amsa',14,90),3,['skitter','raider'],3)],rew:{x:0.45,c:1.3,item:true}},
 {id:'a_bitter',g:'amsa',t:'Bitter Water',lv:4,txt:'"Something is souring the springs. The spitters nest by the water. Bring me reeds from their nests, I\'ll know."',chain:true,steps:[
   Lt('spitter','Tainted reed',3,0.5,gNear('amsa',70,200)),Tk('amsa','"Spitter bile, in the springs. We burn the nests, or we filter the water. Both cost something."'),
   Ch('Amsa: "Burn the nests, or filter the water?"',[
     {label:'Burn the spitter nests',out:'The nests burned. The springs ran sweet again.',steps:[Ki('spitter',6,gNear('amsa',70,200))],rew:{x:0.2}},
     {label:'Fetch filter cartridges from the old pump station',out:'The filters hold. The spitters can stay, the water is clean.',steps:[F('Filter cartridge',gNear('amsa',80,120),3,{t:'raider',n:2})],rew:{c:1.5,item:true}}])],rew:{x:0.55,c:1.2}},
 {id:'a_flask',g:'amsa',t:'Fresh Water',lv:3,txt:'"Old Tabb has been drinking sand for a week. Take him a flask of spring water. It warms fast in the sun: four minutes."',steps:[Dl('tabb','Spring water flask',{time:240})],rew:{x:0.3,c:1}},
 {id:'a_bog',g:'amsa',t:'Old Bogtooth',lv:5,txt:'"Old Bogtooth drags goats into the shallows. It will come back, it always does. But a few weeks of peace would be something."',steps:[Hd('bogtooth')],rew:{x:0.5,c:1.5,item:true}},
 // Surveyor Penn Holloway, Whitepan
 {id:'p_map',g:'penn',t:'Mapping the Pans',lv:4,txt:'"The Combine wants the pans charted. I want to go home. Visit four survey markers for me and we both get what we want."',steps:[Ex([[...gNear('penn',60,330),'Marker W-1'],[...gNear('penn',75,10),'Marker W-2'],[...gNear('penn',90,300),'Marker W-3'],[...gNear('penn',70,260),'Marker W-4']])],rew:{x:0.4,c:1.2}},
 {id:'p_caravan',g:'penn',t:'Salt Caravan',lv:5,txt:'"Brin hauls salt to Cinderwell. Spitters ambush the haulers on the flats. Walk her across."',steps:[Es('Salt-hauler Brin',gNear('penn',12,180,true),gNear('penn',95,250,true),{t:'spitter',n:3})],rew:{x:0.45,c:1.4,item:true}},
 {id:'p_brine',g:'penn',t:'Brine Glands',lv:5,txt:'"Glass spitters out here grow brine glands. Penn\'s Patent Preserving Salts need five. One in three spitters has a good one."',steps:[Lt('spitter','Brine gland',5,0.35,gNear('penn',70,320))],rew:{x:0.4,c:1.3}},
 {id:'p_drifter',g:'penn',t:'The Pale Drifter',lv:6,txt:'"There is a white thing that walks the pans at noon. It is not a mirage. Please make it stop walking."',steps:[Hd('paledrifter')],rew:{x:0.5,c:1.6,item:true}},
 // Ridgewarden Kael, Redspire Canyons
 {id:'k_beacons',g:'kael',t:'Signal Beacons',lv:5,txt:'"Three signal beacons on the mesas. Light them all before the patrol passes: five minutes."',steps:[Sc('Signal beacon',[gNear('kael',40,200),gNear('kael',55,280),gNear('kael',50,330)],{time:300})],rew:{x:0.45,c:1.3}},
 {id:'k_look',g:'kael',t:'Canyon Lookouts',lv:5,txt:'"I need eyes on three old lookouts. Just go and stand there. Tell me what you see."',steps:[Ex([[...gNear('kael',60,250),'Spire Lookout'],[...gNear('kael',80,300),'Redfall Lookout'],[...gNear('kael',70,180),'Gully Lookout']])],rew:{x:0.4,c:1.1}},
 {id:'k_spire',g:'kael',t:'Sons of the Spire',lv:6,txt:'"The Spire raiders are planning something. Thin their numbers and get me their orders."',chain:true,steps:[
   Ki('raider',6,gNear('kael',60,220)),F('Sealed orders',gNear('kael',70,215),1,{t:'raider',n:3}),
   Ch('Kael reads the orders: a raid on the Mirewell wells. "Send these to Halden\'s Rest, or end it now?"',[
     {label:'Send the orders to Marta in town',out:'Marta warned the wells. The raid never came.',steps:[Dl('marta','Sealed orders')],rew:{c:1.8}},
     {label:'Hunt Spire-Captain Vhal',out:'Vhal will not lead another raid.',steps:[Hu('Spire-Captain Vhal','raider',gNear('kael',90,230))],rew:{item:true,x:0.2}}])],rew:{x:0.6,c:1.4}},
 {id:'k_red',g:'kael',t:'Redcrest',lv:7,txt:'"The Redcrest Matron hunts the canyon floor. She lays her brood in my lookouts. Kill her."',steps:[Hd('redcrest')],rew:{x:0.5,c:1.6,item:true}},
 // Tinker Morrow, Rustmaw Scrapyard
 {id:'mo_coils',g:'morrow',t:'Spare Parts',lv:6,txt:'"Raiders carry servo coils in their rigs. I need five. They break when you shoot them, so... shoot gently?"',steps:[Lt('raider','Servo coil',5,0.4,gNear('morrow',60,110))],rew:{x:0.4,c:1.3,item:true}},
 {id:'mo_k2',g:'morrow',t:'Walking Scrap',lv:7,txt:'"I fixed a loader bot, K-2. It\'s out at the far end of the yard and it won\'t come home alone. Walk it back. Raiders love loose parts."',steps:[Es('Loader K-2',gNear('morrow',90,135,true),gNear('morrow',10,0,true),{t:'raider',n:3})],rew:{x:0.5,c:1.5,item:true}},
 {id:'mo_terms',g:'morrow',t:'Dead Terminals',lv:7,txt:'"Four old Combine terminals in the yard still hold data. Wake them up. Each takes a moment."',steps:[Sc('Dead terminal',[gNear('morrow',40,60),gNear('morrow',55,150),gNear('morrow',45,230),gNear('morrow',60,300)])],rew:{x:0.45,c:1.4}},
 {id:'mo_rust',g:'morrow',t:'Rustjaw',lv:8,txt:'"Rustjaw Prime. Half machine, all teeth. It keeps rebuilding itself out of my scrap. Take it apart."',steps:[Hd('rustjaw')],rew:{x:0.5,c:1.7,item:true}},
 // Ilka Sand, Glassreach
 {id:'i_shards',g:'ilka',t:'Resonant Shards',lv:6,txt:'"Spitters grind glass in their throats. Some of it comes out singing. Five singing shards, please."',steps:[Lt('spitter','Resonant shard',5,0.4,gNear('ilka',70,20))],rew:{x:0.4,c:1.3}},
 {id:'i_kiln',g:'ilka',t:'Hold the Kiln',lv:6,txt:'"The kiln has to fire all night. Maulers hate the heat and they come to smash it. Three waves, and then dawn."',steps:[Df('Glass kiln',gNear('ilka',16,60),3,['raider','mauler'],3)],rew:{x:0.5,c:1.5,item:true}},
 {id:'i_lens',g:'ilka',t:'Fragile Goods',lv:6,txt:'"A lens for Seer Ondine. It cracks if it cools. Out to Shimmerfield, three and a half minutes, run."',steps:[Dl('ondine','Warm glass lens',{time:210})],rew:{x:0.35,c:1.4}},
 {id:'i_prism',g:'ilka',t:'Prismhide',lv:8,txt:'"Prismhide\'s hide is worth a fortune and it knows it. Bring it down, keep the fortune, bring me a story."',steps:[Hd('prismhide')],rew:{x:0.5,c:1.7,item:true}},
 // Seer Ondine Vash, Shimmerfield
 {id:'on_echo',g:'ondine',t:'Echoes in Glass',lv:7,txt:'"Three resonance spires hum in Shimmerfield. Stand at each. Listen. Then come and tell me."',steps:[Ex([[...gNear('ondine',55,30),'Spire of Ash Light'],[...gNear('ondine',70,330),'Spire of Thin Song'],[...gNear('ondine',60,90),'Spire of Quiet']])],rew:{x:0.45,c:1.2}},
 {id:'on_bloom',g:'ondine',t:'Crystal Bloom',lv:8,txt:'"A crystal is blooming. Everything that eats glass is coming for it. Guard it until it opens."',steps:[Df('Crystal bloom',gNear('ondine',18,200),3,['spitter','mauler'],3)],rew:{x:0.55,c:1.6,item:true}},
 {id:'on_price',g:'ondine',t:"The Seer's Price",lv:8,txt:'"Three singing shards lie in the far field. Bring them. Then we will see what kind of person you are."',chain:true,steps:[
   F('Singing shard',gNear('ondine',85,350),3,{t:'spitter',n:3}),Tk('ondine','"They sing for whoever holds them. Will you keep them, or give them to me?"'),
   Ch('Ondine waits.',[
     {label:'Give the shards to Ondine',out:'Ondine wove a ward over Shimmerfield. The glass sings softer now.',steps:[Ex([[...gNear('ondine',40,250),'Ward stone']])],rew:{x:0.3,item:true}},
     {label:'Keep them and sell them to Ilka',out:'Ilka paid well. Ondine said nothing at all.',steps:[Dl('ilka','Singing shards',{time:300})],rew:{c:2.5}}])],rew:{x:0.6,c:1.2}},
 // Teo Brand, Cinderveil Badlands
 {id:'te_cores',g:'teo',t:'Ember Cores',lv:8,txt:'"Maulers out here swallow embers. Cut out four ember cores. They\'re warm. Don\'t hold them too long."',steps:[Lt('mauler','Ember core',4,0.35,gNear('teo',70,60))],rew:{x:0.45,c:1.5}},
 {id:'te_mane',g:'teo',t:'Cindermane',lv:9,txt:'"Cindermane rules the badlands. The clans fed it exiles once. Kill it, and I will owe you a debt."',steps:[Hd('cindermane')],rew:{x:0.55,c:1.8,item:true}},
 // Scout Vessa Quill, Farwatch Station (Duskcrown, Lv 11-15)
 {id:'q_glints',g:'quill',t:'Glint Hunt',lv:11,txt:'"Glint Stalkers have been picking off my survey drones. Six of them. They blink behind you, so keep turning."',steps:[Ki('stalker',6,gNear('quill',60,20))],rew:{x:0.3,c:1.2}},
 {id:'q_lanterns',g:'quill',t:'Dead Lanterns',lv:12,txt:'"Three Choir lanterns on the terraces went dark. Relight them by hand. It takes a moment each, so watch your back."',steps:[Sc('Choir lantern',[gNear('quill',45,330),gNear('quill',55,40),gNear('quill',50,100)])],rew:{x:0.35,c:1.2}},
 {id:'q_survey',g:'quill',t:'Ridge Survey',lv:12,txt:'"The old Combine maps stop at the ridge. Stand on three high points and I\'ll chart the rest."',steps:[Ex([[...gNear('quill',70,350),'Violet Ridge'],[...gNear('quill',85,30),'Lantern Crest'],[...gNear('quill',75,80),'Dusk Overlook']])],rew:{x:0.35,c:1.1}},
 {id:'q_supply',g:'quill',t:'Supply Line',lv:13,txt:'"Quartermaster Dorn is walking a crate of rations out to the east camp. The stalkers know the route. Go with him."',steps:[Es('Quartermaster Dorn',gNear('quill',14,90,true),gNear('quill',90,60,true),{t:'stalker',n:3})],rew:{x:0.45,c:1.4,item:true}},
 {id:'q_shards',g:'quill',t:'Choir Shards',lv:13,txt:'"Shardcallers grow singing crystal in their chests. Five good ones, please. They tune our listening array."',steps:[Lt('shardcaller','Choir shard',5,0.4,gNear('quill',70,20))],rew:{x:0.4,c:1.3}},
 {id:'q_hold',g:'quill',t:'Hold the Mast',lv:14,txt:'"The signal mast has to transmit for three cycles. Things out there hate the noise. Hold it."',steps:[Df('Signal mast',gNear('quill',16,200),3,['stalker','brute'],3)],rew:{x:0.5,c:1.5,item:true}},
 {id:'q_king',g:'quill',t:'The Duskhorn King',lv:15,txt:'"The Duskhorn King leads the brute herds. He comes back every time. Put him down anyway, and bring me a horn."',steps:[Hd('hollowking')],rew:{x:0.55,c:1.7,item:true}},
 // Glasswright Orlo Venn, Duskcrown east terraces (Lv 15-19)
 {id:'ov_tenders',g:'orlo',t:'Quiet the Tenders',lv:15,txt:'"The Tenders keep healing the herds I cull. Kill five Tenders first, then the rest will stay dead."',steps:[Ki('tender',5,gNear('orlo',60,200))],rew:{x:0.45,c:1.4}},
 {id:'ov_glass',g:'orlo',t:'Singing Glass',lv:16,txt:'"Three resonant panes lie in the brute fields. Bring them. Then we decide what they\'re for."',chain:true,steps:[
   F('Resonant pane',gNear('orlo',80,320),3,{t:'brute',n:2}),Tk('orlo','"They sing back to the Choir. I could tune them into a ward for Farwatch, or we could break the herd-lord who guards the fields."'),
   Ch('Orlo: "A ward for Farwatch, or a reckoning for Brute-Lord Hask?"',[
     {label:'Deliver the panes to Scout Quill for a ward',out:'Farwatch hums with a new ward. The stalkers stay further out now.',steps:[Dl('quill','Resonant panes')],rew:{c:1.8}},
     {label:'Hunt Brute-Lord Hask',out:'Hask will not lead another herd.',steps:[Hu('Brute-Lord Hask','brute',gNear('orlo',95,330))],rew:{item:true,x:0.2}}])],rew:{x:0.6,c:1.5}},
 {id:'ov_echo',g:'orlo',t:'Echo Vial',lv:17,txt:'"An echo vial fades fast. Get it to Scout Quill at Farwatch in four minutes or it\'s just glass."',steps:[Dl('quill','Echo vial',{time:240})],rew:{x:0.4,c:1.6}},
 {id:'ov_seraph',g:'orlo',t:'The Dusk Seraph',lv:19,txt:'"The Seraph sings the Choir\'s verses out across the far terraces. Break its veil and silence it."',steps:[Hd('seraph')],rew:{x:0.6,c:2,item:true}},
 // Iceward Bram Kettle, Hoarlight Hold (Rimefall, Lv 21-25)
 {id:'rk_burrow',g:'kettle',t:'Cracks in the Ice',lv:21,txt:'"Burrowers keep surfacing inside our perimeter. Six of them. When the snow cracks in a circle under you, step out first and shoot second."',steps:[Ki('burrower',6,gNear('kettle',60,330))],rew:{x:0.3,c:1.2}},
 {id:'rk_beacons',g:'kettle',t:'Heat Beacons',lv:21,txt:'"Three heat beacons on the drifts froze over. Thaw them by hand. Takes a moment each, so keep an eye on the snow."',steps:[Sc('Heat beacon',[gNear('kettle',45,300),gNear('kettle',55,20),gNear('kettle',50,90)])],rew:{x:0.35,c:1.2}},
 {id:'rk_chart',g:'kettle',t:'Whiteout Survey',lv:22,txt:'"Our charts end where the whiteouts start. Stand on three ridges and the hold\'s array will map the rest."',steps:[Ex([[...gNear('kettle',75,340),'Frost Ridge'],[...gNear('kettle',85,40),'Glass Shelf'],[...gNear('kettle',80,280),'Hoar Lookout']])],rew:{x:0.35,c:1.1}},
 {id:'rk_convoy',g:'kettle',t:'Cold Convoy',lv:23,txt:'"Hauler Pell is sledging fuel cells to the east cairn. The Callers love a slow target. Walk with him."',steps:[Es('Hauler Pell',gNear('kettle',14,120,true),gNear('kettle',90,40,true),{t:'frostcaller',n:3})],rew:{x:0.45,c:1.4,item:true}},
 {id:'rk_cores',g:'kettle',t:'Glacier Cores',lv:23,txt:'"Shamblers carry a core of old ice that never melts. Five, please. And mind the Shardlings when they burst."',steps:[Lt('shambler','Glacier core',5,0.4,gNear('kettle',70,300))],rew:{x:0.4,c:1.3}},
 {id:'rk_rimeback',g:'kettle',t:'The Rimeback Colossus',lv:24,txt:'"The Rimeback Colossus walks the eastern shelf. Every time it comes back the ice is thinner. Bring it down."',steps:[Hd('rimeback')],rew:{x:0.55,c:1.7,item:true}},
 // Huntress Siv Arnault, Rimefall northern drifts (Lv 25-29)
 {id:'sa_wards',g:'siv',t:'Break the Wards',lv:25,txt:'"Sentinels ward the herds I hunt: blue shells, half my arrows wasted. Five Sentinels. Kill them first."',steps:[Ki('sentinel',5,gNear('siv',60,200))],rew:{x:0.45,c:1.4}},
 {id:'sa_hold',g:'siv',t:'Keep the Fire',lv:26,txt:'"My thermal pylon has to burn through three surges. Everything on the ice comes for the heat. Hold it."',steps:[Df('Thermal pylon',gNear('siv',16,200),3,['frostcaller','shambler'],3)],rew:{x:0.5,c:1.5,item:true}},
 {id:'sa_reliquary',g:'siv',t:'Frozen Reliquaries',lv:27,txt:'"Three Combine reliquaries lie in the Hush Fields. Bring them. Then we decide whose they are."',chain:true,steps:[
   F('Frozen reliquary',gNear('siv',80,140),3,{t:'shambler',n:2}),Tk('siv','"Archive seals. Kettle could use them to shield the hold, or we could track the Frost-Matriarch who has been hoarding them."'),
   Ch('Siv: "A shield for Hoarlight, or a hunt for Frost-Matriarch Vael?"',[
     {label:'Deliver the reliquaries to Bram Kettle',out:'Hoarlight\'s walls hum with an archive ward. The burrowers dig elsewhere now.',steps:[Dl('kettle','Frozen reliquaries')],rew:{c:1.8}},
     {label:'Hunt Frost-Matriarch Vael',out:'Vael will hoard no more Combine relics.',steps:[Hu('Frost-Matriarch Vael','frostcaller',gNear('siv',95,160))],rew:{item:true,x:0.2}}])],rew:{x:0.6,c:1.5}},
 {id:'sa_ember',g:'siv',t:'Last Ember',lv:28,txt:'"A warm-cell keeps a frostbitten scout alive at Hoarlight. Get it to Kettle in five minutes or it\'s a cold brick."',steps:[Dl('kettle','Warm-cell',{time:300})],rew:{x:0.4,c:1.6}},
 {id:'sa_pale',g:'siv',t:'The Pale Matriarch',lv:29,txt:'"The Pale Matriarch rules the far drifts. Her wards hold off a whole hunting party. Break them and end her."',steps:[Hd('palequeen')],rew:{x:0.6,c:2,item:true}},
 {id:'te_return',g:'teo',t:"Exile's Return",lv:9,txt:'"My sister Nara is coming over the ridge. The clans will try to stop her. Walk her to the shrine, hold it while she prays, then tell Marta in town we live."',chain:true,steps:[
   Es('Nara Brand',gNear('teo',80,20,true),gNear('teo',20,100,true),{t:'raider',n:3}),Df('Ash shrine',gNear('teo',22,110),2,['raider','mauler'],3),Dl('marta','Letter from Teo')],rew:{x:0.8,c:2,item:true}}
];
const SQD={};SQ.forEach(d=>{d.gate=d.gate||GV[d.g].gate||null;SQD[d.id]=d;});
/* ---------- state ---------- */
function normQuests(qs,old){let L=[];if(Array.isArray(qs))L=qs.filter(q=>q&&typeof q==='object'&&((q.src==='side'&&(SQD[q.qid]||rmReg(q)))||(q.src==='contract'&&(q.kind==='kill'||q.kind==='fetch'))));
  else if(old&&typeof old==='object'&&(old.kind==='kill'||old.kind==='fetch'))L=[Object.assign({},old,{src:'contract',track:true})];
  return L.slice(0,MAXQ).map(q=>Object.assign({},q,{id:q.id||'q'+uid(),track:q.track!==false}));}
const contracts=()=>(P.quests||[]).filter(q=>q.src==='contract');
const sides=()=>(P.quests||[]).filter(q=>q.src==='side');
const qFull=()=>(P.quests||[]).length>=MAXQ;
Object.defineProperty(P,'mission',{configurable:true,enumerable:false,get(){return contracts()[0]||null;},
  set(v){P.quests=P.quests||[];const c=contracts()[0];if(v==null){if(c){qClearRT(c);P.quests.splice(P.quests.indexOf(c),1);}return;}
    v.src='contract';if(v.track==null)v.track=true;const i=P.quests.findIndex(q=>q.id===v.id);if(i>=0)P.quests[i]=v;else if(c)P.quests[P.quests.indexOf(c)]=v;else P.quests.push(v);}});
function stepsOf(q){const d=SQD[q.qid];const out=[];let ci=0;for(const s of d.steps){out.push(s);if(s.k==='choice'){const o=q.path&&q.path[ci];ci++;if(o==null)break;for(const t of s.opts[o].steps)out.push(t);}}return out;}
const curStep=q=>q.src==='side'?stepsOf(q)[q.step]||null:null;
function qLevel(d){return clamp(Math.max(d.lv,P.level-1),1,Math.min(MAXLVL,d.lv+3));}
function qStartStep(q){q.s={};const st=curStep(q);if(!st){q.stage='return';return;}if(st.time)q.s.left=st.time;
  if(st.k==='scan')q.s.done=st.pts.map(()=>0);if(st.k==='explore')q.s.done=st.pts.map(()=>0);if(st.k==='fetch')q.s.got=0;if(st.k==='loot'||st.k==='kill')q.s.have=0;if(st.k==='defend')q.s.wave=0;}
function qAvail(d){if(P.qdone&&P.qdone[d.id])return false;if((P.quests||[]).some(q=>q.qid===d.id))return false;if(d.gate&&!gateOpen(d.gate))return false;if(d.after&&!(P.qdone||{})[d.after])return false;return P.level>=d.lv-1;}
function acceptQuest(qid){const d=SQD[qid];if(!d||!qAvail(d))return false;if(qFull()){warn('Mission log full ('+MAXQ+'). Finish or abandon one first.');return false;}
  const q={id:'q'+uid(),src:'side',qid,title:d.t,giver:d.g,lv:qLevel(d),step:0,stage:'active',track:true,path:[],t0:Date.now()};P.quests.push(q);qStartStep(q);
  SFX.quest();banner('MISSION ACCEPTED',d.t+' · '+GV[d.g].name);log('📋 <b>'+esc(d.t)+'</b>: '+esc(objText(q)));save();return q;}
function qClearRT(q){const r=QRT[q.id];if(!r)return;for(const o of r.objs||[])scene.remove(o.g);for(const e of r.mobs||[])if(enemies.includes(e)&&(e.dead||e.state!=='chase'))removeEnemy(e);if(r.ally&&!r.ally.dead)removeAlly(r.ally);if(r.cache)scene.remove(r.cache.g);delete QRT[q.id];}
function qAdvance(q,txt){qClearRT(q);q.step++;const st=curStep(q);if(!st){q.stage='return';SFX.quest();banner('OBJECTIVE COMPLETE','Return to '+GV[q.giver].name+(txt?' · '+txt:''));}
  else{qStartStep(q);SFX.quest();banner(st.k==='choice'?'A CHOICE':'NEXT STEP',q.title+' · '+objText(q));if(st.k==='choice'&&!panelOpen)setTimeout(()=>{if(!panelOpen)openChoice(q.id);},700);}save();}
function qFail(q,why){qClearRT(q);q.stage='failed';SFX.err();banner('MISSION FAILED',q.title+' · '+why+' · retry from the 📋 log');save();}
function qRetry(id){const q=(P.quests||[]).find(x=>x.id===id);if(!q||q.stage!=='failed')return false;q.stage='active';qStartStep(q);toast('Retrying: '+objText(q));save();return true;}
function abandonQuest(id){const q=(P.quests||[]).find(x=>x.id===id);if(!q)return false;if(q.src==='contract'){abandonMission(id);return true;}if(q.rm)rmAbandon(q);qClearRT(q);P.quests.splice(P.quests.indexOf(q),1);if(P.qfocus===id)P.qfocus=null;save();return true;}
function claimQuest(id){const q=(P.quests||[]).find(x=>x.id===id&&x.src==='side');if(!q||q.stage!=='return')return false;const d=SQD[q.qid];let x=d.rew.x||0.3,c=d.rew.c||1,item=!!d.rew.item;let out='';
  stepsOf(q).forEach(()=>{});const ch=d.steps.filter(s=>s.k==='choice');ch.forEach((s,i)=>{const o=s.opts[(q.path||[])[i]];if(o){x+=o.rew.x||0;c*=o.rew.c||1;item=item||!!o.rew.item;out=o.out;}});
  const L=clamp(P.level,1,MAXLVL);const xp=Math.round(xpNeed(L)*x);const cr=Math.round((20+L*14)*c);P.credits+=cr;gainXp(xp);let t='+'+cr+'¢  +'+xp+' XP';
  if(item){const it=missionReward({pref:'any',diff:2,rar:10+q.lv*2});if(P.inv.length<24){P.inv.push(it);t+='  +'+it.name;}}
  qClearRT(q);P.quests.splice(P.quests.indexOf(q),1);P.qdone=P.qdone||{};P.qdone[q.qid]=(P.qdone[q.qid]||0)+1;if(P.qfocus===id)P.qfocus=null;
  SFX.quest();banner('MISSION COMPLETE',q.title+(out?' · '+out:''));log('📋 <b>'+esc(q.title)+'</b> complete. '+(out?esc(out)+' ':'')+esc(t));save();return true;}
function chooseQuest(id,o){const q=(P.quests||[]).find(x=>x.id===id);const st=q&&curStep(q);if(!st||st.k!=='choice'||!st.opts[o])return false;q.path=(q.path||[]).concat([o]);log('📋 '+esc(q.title)+': you chose “'+esc(st.opts[o].label)+'”');qAdvance(q);return true;}
/* ---------- objective text + targets ---------- */
const eName=t=>ETYPES[t]?ETYPES[t].name:t;
function fmtClock(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function objText(q){if(q.src==='contract'){const m=q;return m.stage==='return'?'Return to the terminal at Halden\'s Rest':m.kind==='kill'?`${m.have}/${m.need} killed`:'Find the signal marker';}
  if(q.stage==='return')return 'Return to '+GV[q.giver].name;if(q.stage==='failed')return 'Failed · retry from the 📋 log';
  const st=curStep(q),s=q.s||{};if(!st)return '';let t='';
  switch(st.k){case 'fetch':t=`Pick up ${st.obj} ${s.got|0}/${st.n}`;break;case 'loot':t=`${st.item} ${s.have|0}/${st.n} (drops from ${eName(st.t)}s, ~${Math.round(st.p*100)}%)`;break;
    case 'deliver':t=`Deliver ${st.item} to ${GV[st.to].name}`;break;case 'talk':t=`Talk to ${GV[st.to].name}`;break;
    case 'escort':{const a=QRT[q.id]&&QRT[q.id].ally;t=a&&!a.dead?`Escort ${st.who} (${Math.round(a.hp/a.maxHp*100)}%)`:`Meet ${st.who}`;break;}
    case 'defend':{const a=QRT[q.id]&&QRT[q.id].ally;t=`Defend the ${st.obj}`+(s.wave?` · wave ${s.wave}/${st.waves}`:'')+(a&&!a.dead?` · ${Math.round(a.hp/a.maxHp*100)}%`:'');break;}
    case 'scan':t=`Activate ${st.obj}s ${(s.done||[]).filter(Boolean).length}/${st.pts.length}`;break;
    case 'hunt':t=st.dyna?`Hunt ${DYNAS[st.dyna].name} (dyna)`:`Hunt ${st.name} (elite)`;break;
    case 'explore':{const i=(s.done||[]).findIndex(v=>!v);t=`Discover ${(s.done||[]).filter(Boolean).length}/${st.pts.length}`+(i>=0?': '+st.pts[i][2]:'');break;}
    case 'kill':t=`${Array.isArray(st.t)?'Hostiles':eName(st.t)+'s'} ${s.have|0}/${st.n}`;break;case 'choice':t='Decide: open the 📋 log';break;default:t=rmStepText(q,st,s);}
  if(s.left!=null)t+=' · ⏱ '+fmtClock(s.left);return t;}
function qTarget(q){if(q.src==='contract'){const m=q;if(m.stage==='return')return {x:TERMINAL.x,z:TERMINAL.z,label:'Terminal'};if(m.kind==='fetch')return {x:m.x,z:m.z,label:m.obj};
    if(m.x!=null&&enemies.some(e=>e.mis===m.id&&!e.dead))return {x:m.x,z:m.z,label:'Camp'};let best=null,bd=1e9;for(const e of enemies)if(e.type===m.etype&&!e.dead){const d=dist2D(e.home,P.pos);if(d<bd){bd=d;best=e;}}return best?{x:best.home.x,z:best.home.z,label:eName(m.etype)}:null;}
  const g=GV[q.giver];if(q.stage==='return')return {x:g.x,z:g.z,label:g.name};if(q.stage==='failed')return null;const st=curStep(q),s=q.s||{};if(!st)return null;const r=QRT[q.id];
  switch(st.k){case 'fetch':{const o=r&&r.objs&&r.objs.find(o=>!o.taken);return o?{x:o.x,z:o.z,label:st.obj}:{x:st.at[0],z:st.at[1],label:st.obj};}
    case 'loot':case 'kill':return st.at?{x:st.at[0],z:st.at[1],label:st.item||(Array.isArray(st.t)?'Hostiles':eName(st.t))}:null;
    case 'deliver':case 'talk':return {x:GV[st.to].x,z:GV[st.to].z,label:GV[st.to].name};
    case 'escort':{const a=r&&r.ally;return a&&!a.dead?{x:a.pos.x,z:a.pos.z,label:st.who}:{x:st.from[0],z:st.from[1],label:st.who};}
    case 'defend':return {x:st.at[0],z:st.at[1],label:st.obj};
    case 'scan':{const i=s.done?s.done.findIndex(v=>!v):0;const p=st.pts[Math.max(0,i)];return {x:p[0],z:p[1],label:st.obj};}
    case 'hunt':if(st.dyna){const D=DYNAS[st.dyna];return {x:D.x,z:D.z,label:D.name};}{const e=r&&r.mobs&&r.mobs.find(e=>!e.dead);return e?{x:e.pos.x,z:e.pos.z,label:st.name}:{x:st.at[0],z:st.at[1],label:st.name};}
    case 'explore':{let best=null,bd=1e9;st.pts.forEach((p,i)=>{if(s.done&&s.done[i])return;const d=Math.hypot(p[0]-P.pos.x,p[1]-P.pos.z);if(d<bd){bd=d;best={x:p[0],z:p[1],label:p[2]};}});return best;}
    default:return rmStepTarget(q,st);}
  return null;}
function focusQuest(){const L=(P.quests||[]).filter(q=>q.track&&q.stage!=='failed');return L.find(q=>q.id===P.qfocus)||L[0]||null;}
function missionWaypoint(){const q=focusQuest();return q?qTarget(q):null;}
/* ---------- elites (also used by dynas) ---------- */
function makeElite(type,x,z,lv,name,col,o){o=o||{};const e=makeEnemy(type,x,z,clamp(lv,1,MAXLVL),true);e.T=Object.assign({},e.T,{name,scale:e.T.scale*(o.scale||1.4),aggro:Math.max(e.T.aggro,18),xp:e.T.xp*(o.xp||3)});
  e.maxHp=e.hp=Math.round(e.maxHp*(o.hp||5));e.dmg*=o.dmg||1.45;e.hitR*=o.scale||1.4;e.h*=o.scale||1.4;e.elite=true;e.wr=3;if(col!=null)retint(e.R.g,col,0.55,o.glow);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.9,1.1,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffc85a,transparent:true,opacity:0.7,depthWrite:false}));ring.position.y=0.06;e.R.g.add(ring);return e;}
/* ---------- quest objects in the world ---------- */
function qObjMesh(kind){const g=new THREE.Group();if(kind==='scan'){part(g,geoBox,M(0x3a4048),0,0.7,0,0.7,1.4,0.5);const s=part(g,geoBox,MB(0x5ff2ff),0,1.15,0.26,0.5,0.3,0.02);g.userData.scr=s;}
  else if(kind==='explore'){part(g,geoBox,M(0x6b5a46),0,1.6,0,0.25,3.2,0.25);part(g,geoBox,MB(0xffd25a),0.35,2.9,0,0.7,0.4,0.04);}
  else if(kind==='beacon'){part(g,geoBox,M(0x4a3a30),0,0.6,0,1.6,1.2,1.6);part(g,geoCone,MB(0x5ff2ff),0,1.8,0,0.5,1.4,0.5);}
  else{part(g,geoBox,M(0x6a4a2a),0,0.35,0,0.8,0.7,0.6);part(g,geoBox,MB(0xffd25a),0,0.72,0,0.86,0.06,0.66);}
  const b=makeBeam(kind==='scan'?0x5ff2ff:0xffd25a,10,0.18,0.3);scene.remove(b);b.position.set(0,0,0);g.add(b);return g;}
function qAddObj(q,kind,x,z,extra){const r=QRT[q.id]||(QRT[q.id]={objs:[],mobs:[]});const g=qObjMesh(kind);g.position.set(x,heightAt(x,z),z);scene.add(g);const o=Object.assign({g,x,z,kind},extra);r.objs.push(o);return o;}
function qSpawn(q,t,x,z,n,o){const r=QRT[q.id]||(QRT[q.id]={objs:[],mobs:[]});const out=[];for(let i=0;i<n;i++){const a=i/n*6.28+Math.random();const e=makeEnemy(t,x+Math.cos(a)*rand(2,5),z+Math.sin(a)*rand(2,5),clamp(q.lv+randi(-1,0),1,MAXLVL),true);e.qid=q.id;if(o)Object.assign(e,o);r.mobs.push(e);out.push(e);}return out;}
function escortNpc(st,x,z){const R=buildHumanoid(0xc8b8a0,0x5a4a30,0xffe08a,null,{npc:1});const a=createAlly({kind:'escort',name:st.who,R,hp:Math.round(120+P.level*40),dmg:0,speed:4.4,h:1.9,hitR:0.6,threat:0,x,z});a.passive=true;a.fixed=true;a.cmd='stay';a.stayAt={x,z};return a;}
function beaconAlly(st,x,z){const g=new THREE.Group();part(g,geoBox,M(0x5a4a3a),0,0.9,0,2.2,1.8,2.2);part(g,geoBox,M(0x3a2c24),0,1.95,0,2.6,0.3,2.6);const cr=part(g,geoCone,MB(0xffb347),0,2.9,0,0.45,1.2,0.45);
  const R={g,anim:(t)=>{cr.rotation.y=t;}};const a=createAlly({kind:'beacon',name:st.obj,R,hp:Math.round(260+P.level*70),dmg:0,speed:0,h:2.6,hitR:1.5,threat:0,x,z});a.passive=true;a.fixed=true;a.cmd='stay';a.stayAt={x,z};a.dr=0.2;return a;}
/* ---------- runtime update ---------- */
function updQuests(dt){if(state!=='play')return;const L=P.quests||[];QS.acc+=dt;
  // contracts: fetch caches and kill camps (old behaviour)
  for(const q of L){if(q.stage!=='active')continue;const st=curStep(q);const s=q.s||(q.s={});
    if(st&&s.left!=null&&!panelOpen&&!DUN){s.left-=dt;if(s.left<=0){s.left=0;qFail(q,'out of time');continue;}}
    if(!st||DUN)continue;const r=QRT[q.id]||(QRT[q.id]={objs:[],mobs:[]});const near=(x,z,d)=>Math.hypot(P.pos.x-x,P.pos.z-z)<d;
    if(st.k==='fetch'){if(!r.spawned){r.spawned=1;for(let i=0;i<st.n;i++){if(i<(s.got|0))continue;const a=i/st.n*6.28;const sp=st.n>1?freeSpot(st.at[0]+Math.cos(a)*7,st.at[1]+Math.sin(a)*7,1,true):st.at;qAddObj(q,'fetch',sp[0],sp[1],{i});}}
      if(st.guard&&!r.guarded&&near(st.at[0],st.at[1],70)){r.guarded=1;qSpawn(q,st.guard.t,st.at[0],st.at[1],st.guard.n);}}
    else if((st.k==='loot'||st.k==='kill')&&st.at){const alive=(r.mobs||[]).filter(e=>!e.dead&&enemies.includes(e)).length;const need=st.n-(s.have|0);
      if(near(st.at[0],st.at[1],90)&&alive<Math.min(4,need+1)&&T>(r.next||0)){r.next=T+6;qSpawn(q,Array.isArray(st.t)?pick(st.t):st.t,st.at[0]+rand(-6,6),st.at[1]+rand(-6,6),Math.min(3,Math.min(4,need+1)-alive));}}
    else if(st.k==='scan'){if(!r.spawned){r.spawned=1;st.pts.forEach((p,i)=>{if(!(s.done&&s.done[i]))qAddObj(q,'scan',p[0],p[1],{i});});}}
    else if(st.k==='explore'){if(!r.spawned){r.spawned=1;st.pts.forEach((p,i)=>{if(!(s.done&&s.done[i]))qAddObj(q,'explore',p[0],p[1],{i});});}
      st.pts.forEach((p,i)=>{if(!s.done[i]&&near(p[0],p[1],16)){s.done[i]=1;const o=r.objs.find(o=>o.i===i);if(o){scene.remove(o.g);o.taken=1;}SFX.quest();toast('🧭 Discovered: '+p[2]+' ('+s.done.filter(Boolean).length+'/'+st.pts.length+')');save();}});
      if(s.done.every(Boolean))qAdvance(q);}
    else if(st.k==='hunt'&&!st.dyna){if(!(r.mobs||[]).length&&near(st.at[0],st.at[1],120)){const e=makeElite(st.t,st.at[0],st.at[1],q.lv+1,st.name,0xffb347,{glow:0xff5a2a});e.qid=q.id;e.qhunt=1;r.mobs.push(e);
        qSpawn(q,st.t,st.at[0],st.at[1],2);}}
    else if(st.k==='escort'){if(!r.ally&&near(st.from[0],st.from[1],40)){r.ally=escortNpc(st,st.from[0],st.from[1]);s.prog=s.prog||0;}
      const a=r.ally;if(a){if(a.dead||!allies.includes(a)){qFail(q,st.who+' fell');continue;}const tx=st.to[0],tz=st.to[1];const dd=Math.hypot(tx-a.pos.x,tz-a.pos.z);const tot=Math.hypot(tx-st.from[0],tz-st.from[1])||1;const prog=1-dd/tot;
        const close=dist2D(a.pos,P.pos)<14;a.stayAt=close?{x:tx,z:tz}:{x:a.pos.x,z:a.pos.z};a.cmd='stay';
        for(const k of [0.3,0.65])if(prog>k&&!(s['amb'+k])){s['amb'+k]=1;const ang=Math.atan2(tz-a.pos.z,tx-a.pos.x)+rand(-0.6,0.6);const ms=qSpawn(q,st.amb.t,a.pos.x+Math.cos(ang)*18,a.pos.z+Math.sin(ang)*18,st.amb.n);
          for(const e of ms){e.state='chase';e.foe=a;e.nextAtk=T+1.2;e.leash=90;}toast('⚠ Ambush! Protect '+st.who);}
        if(dd<3){toast(st.who+': "Thank you. I would not have made it alone."');removeAlly(a);r.ally=null;qAdvance(q);continue;}}}
    else if(st.k==='defend'){if(!r.ally&&near(st.at[0],st.at[1],40))r.ally=beaconAlly(st,st.at[0],st.at[1]);const a=r.ally;
      if(a){if(a.dead||!allies.includes(a)){qFail(q,'the '+st.obj+' was destroyed');continue;}
        if(!s.wave&&near(st.at[0],st.at[1],16)){s.wave=1;r.wt=T+1.5;toast('⚠ Wave 1/'+st.waves+' incoming: defend the '+st.obj);}
        if(s.wave&&r.wt&&T>=r.wt){r.wt=0;r.wave=(r.mobs||[]).length;const n=st.n+(s.wave-1);for(let i=0;i<n;i++){const ang=i/n*6.28+rand(0,0.5);const ms=qSpawn(q,pick(st.t),st.at[0]+Math.cos(ang)*24,st.at[1]+Math.sin(ang)*24,1);for(const e of ms){e.state='chase';e.foe=a;e.nextAtk=T+1.5;e.leash=80;}}}
        if(s.wave&&!r.wt){const live=(r.mobs||[]).filter(e=>!e.dead&&enemies.includes(e));if(!live.length){if(s.wave>=st.waves){removeAlly(a);r.ally=null;toast('The '+st.obj+' holds!');qAdvance(q);continue;}s.wave++;r.wt=T+4;toast('⚠ Wave '+s.wave+'/'+st.waves+' in 4s');save();}}}}}
  // contract runtime restore (lazy): camps and caches
  for(const m of L)if(m.src==='contract'&&m.stage==='active'&&!DUN){if(m.kind==='fetch'&&!(QRT[m.id]&&QRT[m.id].cache))spawnCache(m);}
  // scan channel
  if(QS.chan){const c=QS.chan;const q=L.find(x=>x.id===c.q);const st=q&&curStep(q);if(!st||st.k!=='scan'||Math.hypot(P.pos.x-c.x,P.pos.z-c.z)>3.5||P.dead){QS.chan=null;toast('Activation interrupted');}
    else if(T-c.t0>=2){QS.chan=null;q.s.done[c.i]=1;const r=QRT[q.id];const o=r&&r.objs.find(o=>o.i===c.i);if(o){o.taken=1;o.g.children.forEach(m=>{if(m.material&&m.material.color)m.material.color.set(0x6dff8a);});}
      SFX.quest();toast('✔ '+st.obj+' active ('+q.s.done.filter(Boolean).length+'/'+st.pts.length+')');if(q.s.done.every(Boolean))qAdvance(q);else save();}}
  // spin objects, giver markers
  for(const id in QRT)for(const o of QRT[id].objs||[])if(!o.taken)o.g.children[0].rotation.y+=dt*0.6;
  if(!DUN&&(QS.acc>0.5||QS.dirty)){QS.acc=0;QS.dirty=false;for(const g of GIVERS){const st=g.st=giverState(g);g.R.g.visible=Math.hypot(P.pos.x-g.x,P.pos.z-g.z)<120;const col=st==='return'?0x6dff8a:st==='offer'?0xffd25a:st==='step'?0x59c8ff:0x777777;g.mk.material.color.setHex(col);g.mk2.material.color.setHex(col);g.mk.visible=g.mk2.visible=st!=='none';}}
  if(!DUN)for(const g of GIVERS){if(!g.R.g.visible)continue;g.mk.position.y=3.25+Math.sin(T*2.5)*0.08;if(Math.hypot(P.pos.x-g.x,P.pos.z-g.z)<9){const tr=Math.atan2(P.pos.x-g.x,P.pos.z-g.z);let d=tr-g.R.g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));g.R.g.rotation.y+=d*Math.min(1,dt*4);}g.R.anim(T,0,0);}
  // auto-waypoint for the focused objective
  QS.wpAcc+=dt;if(P.qAutoWp&&QS.wpAcc>1&&!DUN){QS.wpAcc=0;const w=missionWaypoint();if(w&&Math.hypot(w.x-P.pos.x,w.z-P.pos.z)>10&&(!P.uwp||Math.hypot(P.uwp.x-w.x,P.uwp.z-w.z)>3)){P.uwp=normWp(w);MAP.dirty=true;}}}
// leaving the open world resets escorts/defends (they can't follow you underground)
function questOnEnterDungeon(){for(const q of P.quests||[]){const r=QRT[q.id];if(!r||!r.ally)continue;if(allies.includes(r.ally))removeAlly(r.ally);r.ally=null;if(q.s){q.s.wave=0;r.wt=0;}}}
function giverState(g){const L=(P.quests||[]).filter(q=>q.src==='side');if(L.some(q=>q.giver===g.id&&q.stage==='return'))return 'return';
  if(L.some(q=>{const st=curStep(q);return q.stage==='active'&&st&&(st.k==='deliver'||st.k==='talk')&&st.to===g.id;}))return 'step';if(SQ.some(d=>d.g===g.id&&qAvail(d)))return 'offer';return 'none';}
function questOnKill(e){for(const m of contracts())if(m.kind==='kill'&&m.stage==='active'&&m.etype===e.type){m.have++;if(m.have>=m.need){m.stage='return';SFX.quest();banner('OBJECTIVE COMPLETE','Return to the mission terminal');}break;}
  for(const q of sides()){if(q.stage!=='active')continue;const st=curStep(q);if(!st)continue;const inArea=!st.at||Math.hypot(e.pos.x-st.at[0],e.pos.z-st.at[1])<110;
    if(st.k==='hunt'&&!st.dyna&&e.qhunt&&e.qid===q.id){qAdvance(q,st.name+' is dead');continue;}
    if((st.k==='loot'||st.k==='kill')&&(Array.isArray(st.t)?st.t.includes(e.type):st.t===e.type)&&inArea){
      if(st.k==='kill'||Math.random()<st.p){q.s.have=(q.s.have|0)+1;floatText(tmpV.set(e.pos.x,e.pos.y+e.h+1.2,e.pos.z),st.k==='loot'?'+'+st.item:'✔','info');toast((st.k==='loot'?'📦 '+st.item:eName(st.t))+' '+q.s.have+'/'+st.n);
        if(q.s.have>=st.n)qAdvance(q);}else if(st.k==='loot')floatText(tmpV.set(e.pos.x,e.pos.y+e.h+1.2,e.pos.z),'no '+st.item,'info');}}}
function questOnDyna(id){for(const q of sides()){const st=curStep(q);if(q.stage==='active'&&st&&st.k==='hunt'&&st.dyna===id)qAdvance(q,DYNAS[id].name+' is down');}}
/* ---------- interaction ---------- */
function questInteract(p){if(DUN)return null;for(const q of P.quests||[]){if(q.stage!=='active')continue;
    if(q.src==='contract'){if(q.kind==='fetch'&&Math.hypot(p.x-q.x,p.z-q.z)<3.2)return {k:'qcache',id:q.id,label:'📦 Recover'};continue;}
    const r=QRT[q.id];if(!r)continue;for(const o of r.objs||[]){if(o.taken||Math.hypot(p.x-o.x,p.z-o.z)>3.2)continue;const st=curStep(q);
      if(o.kind==='fetch')return {k:'qpick',id:q.id,o,label:'📦 Pick up '+st.obj};if(o.kind==='scan')return {k:'qscan',id:q.id,o,label:QS.chan?'⏳ Activating…':'🖐 Activate '+st.obj};}}
  for(const g of GIVERS)if(Math.hypot(p.x-g.x,p.z-g.z)<3.4){const st=giverState(g);return {k:'giver',id:g.id,label:(st==='return'?'✔ ':st==='step'?'💬 ':st==='offer'?'❗ ':'💬 ')+g.name};}
  return null;}
function questDo(n){if(n.k==='qcache'){const m=(P.quests||[]).find(q=>q.id===n.id);if(m){clearCache(m);m.stage='return';SFX.quest();banner('ITEM RECOVERED',m.obj+': return to the terminal');save();}return true;}
  if(n.k==='qpick'){const q=(P.quests||[]).find(x=>x.id===n.id);const st=q&&curStep(q);if(!st)return true;n.o.taken=1;scene.remove(n.o.g);q.s.got=(q.s.got|0)+1;SFX.loot();toast('📦 '+st.obj+' '+q.s.got+'/'+st.n);if(q.s.got>=st.n)qAdvance(q);else save();return true;}
  if(n.k==='qscan'){if(QS.chan)return true;QS.chan={q:n.id,i:n.o.i,x:n.o.x,z:n.o.z,t0:T};toast('⏳ Activating… stay close (2s)');return true;}
  if(n.k==='giver'){giverTalk(n.id);return true;}return false;}
function giverTalk(gid){const g=GV[gid];let said=[];for(const q of sides()){const st=curStep(q);if(q.stage!=='active'||!st||st.to!==gid)continue;
    if(st.k==='deliver'){said.push('You hand over the '+st.item+'.');qAdvance(q);}else if(st.k==='talk'){said.push(st.line);qAdvance(q);}}
  openGiver(gid,said);}
/* ---------- UI ---------- */
function rewTxt(d){const L=clamp(P.level,1,MAXLVL);return `${Math.round((20+L*14)*(d.rew.c||1))}¢ · ${Math.round(xpNeed(L)*(d.rew.x||0.3))} XP${d.rew.item?' · item':''}`;}
const KIND_ICON={fetch:'📦',loot:'🎲',deliver:'✉',talk:'💬',escort:'🛡',defend:'🏰',scan:'🖐',hunt:'💀',explore:'🧭',kill:'⚔',choice:'⑂'};
function typesOf(d){const k=new Set();(function w(L){for(const s of L){k.add(s.k);if(s.time)k.add('timed');if(s.opts)s.opts.forEach(o=>w(o.steps));}})(d.steps);return [...k];}
function typeChips(d){return typesOf(d).map(k=>`<span class="qchip">${k==='timed'?'⏱ timed':KIND_ICON[k]+' '+k}</span>`).join('')+(d.chain?'<span class="qchip">⛓ chain</span>':'');}
function openGiver(gid,said){const g=GV[gid];let h=`<div class="mis story"><b>${esc(g.name)}</b> <span style="opacity:.7">· ${esc(g.role)}</span>${(said||[]).map(s=>`<p>${esc(s)}</p>`).join('')}</div>`;
  const mine=sides().filter(q=>q.giver===gid);for(const q of mine){const d=SQD[q.qid];h+=`<div class="mis"><span class="obadge">${q.stage==='return'?'Ready':'Active'}</span> <b>${esc(q.title)}</b><p>${esc(objText(q))}</p>${q.stage==='return'?`<button class="sbtn" data-act="qclaim" data-q="${q.id}" data-g="${gid}">Claim reward</button>`:''}</div>`;}
  const offers=SQ.filter(d=>d.g===gid);const av=offers.filter(qAvail);const locked=offers.filter(d=>!qAvail(d)&&!(P.qdone||{})[d.id]&&!(P.quests||[]).some(q=>q.qid===d.id));
  h+=av.map(d=>`<div class="mis"><span class="obadge">Side quest</span> <b>${esc(d.t)}</b> <span style="opacity:.7">· Lv ${d.lv}+</span><p>${esc(d.txt)}</p><div>${typeChips(d)}</div><div style="margin-top:4px">Reward: ${rewTxt(d)}</div>
    <button class="sbtn${qFull()?' locked':''}" style="margin-top:8px" data-act="${qFull()?'qfull':'qacc'}" data-q="${d.id}">${qFull()?'Mission log full ('+MAXQ+')':'Accept'}</button></div>`).join('');
  if(locked.length)h+=`<div style="opacity:.7;font-size:13px">Later: ${locked.map(d=>esc(d.t)+(d.gate&&!gateOpen(d.gate)?' (story)':P.level<d.lv-1?' (Lv '+d.lv+')':'')).join(' · ')}</div>`;
  if(!mine.length&&!av.length&&!locked.length)h+='<div style="opacity:.7">"Nothing more for now. Safe roads."</div>';
  openPanel('💬 '+g.name.toUpperCase(),h,'giver');}
function openChoice(id){const q=(P.quests||[]).find(x=>x.id===id);const st=q&&curStep(q);if(!st||st.k!=='choice')return;
  openPanel('⑂ '+q.title.toUpperCase(),`<div class="mis story"><p>${esc(st.text)}</p></div>`+st.opts.map((o,i)=>`<button class="sbtn" style="display:block;width:100%;margin:8px 0;text-align:left" data-act="qch" data-q="${q.id}" data-o="${i}">${esc(o.label)}<br><small style="opacity:.75">${o.rew.item?'item reward · ':''}${o.rew.c?'×'+o.rew.c+' credits · ':''}${o.rew.x?'+XP · ':''}${o.steps.length} more step${o.steps.length>1?'s':''}</small></button>`).join(''),'choice');}
function questLogHtml(){const L=P.quests||[];const st=sto();let h=`<div class="stats">Active missions <b>${L.length}/${MAXQ}</b> (plus the story). Track up to all of them; the HUD shows the tracked ones and the 📍 focus gets the waypoint arrow. <button class="chip" data-act="qauto">${P.qAutoWp?'✔':'＋'} Auto map waypoint</button></div>`;
  if(st.cur){const s=STEP[st.cur.id];h+=`<div class="mis story"><span class="sbadge">STORY</span> <b>${esc(s.n)}</b><p>${esc(s.obj.label)}</p></div>`;}
  if(!L.length)h+='<div style="opacity:.7">No optional missions. Missions &amp; contracts: any 📟 terminal (Halden\'s Rest, outposts) or the 🎲 board (N). Side quests: people with a ❗ over their head, all over the Reach.</div>';
  for(const q of L){const side=q.src==='side';const d=side&&SQD[q.qid];const foc=focusQuest()===q;
    let steps='';if(side&&(d.chain||stepsOf(q).length>1)){const S=stepsOf(q);steps='<div class="qsteps">'+S.map((s,i)=>`<span class="${i<q.step||q.stage==='return'?'done':i===q.step?'cur':''}">${i<q.step||q.stage==='return'?'✔':i===q.step?'▶':'○'} ${KIND_ICON[s.k]}</span>`).join('')+(S[S.length-1].k==='choice'?'<span>… ⑂</span>':'')+'</div>';}
    h+=`<div class="mis${foc?' cur':''}"><span class="obadge">${q.rm?'🎲 Mission':side?(d.chain?'Chain':'Side quest'):'Contract'}</span>${q.stage==='failed'?' <span class="obadge" style="background:#7a2a20">Failed</span>':''} <b>${esc(q.title)}</b> <span style="opacity:.7">· ${side?esc(GV[q.giver].name):'📟 terminal'}</span>
      <p>${foc?'📍 ':''}${esc(objText(q))}</p>${steps}<div class="qbtns"><button class="chip${q.track?' on':''}" data-act="qtrk" data-q="${q.id}">${q.track?'✔ Tracked':'Track'}</button><button class="chip" data-act="qfoc" data-q="${q.id}">📍 Focus</button>
      ${q.stage==='failed'?`<button class="chip" data-act="qretry" data-q="${q.id}">↻ Retry</button>`:''}${side&&curStep(q)&&curStep(q).k==='choice'&&q.stage==='active'?`<button class="chip" data-act="qchoose" data-q="${q.id}">⑂ Decide</button>`:''}<button class="chip" data-act="qab" data-q="${q.id}">Abandon</button></div></div>`;}
  const done=Object.keys(P.qdone||{}).length;h+=`<div style="opacity:.7;font-size:12px;margin-top:6px">Side quests completed: ${done}/${SQ.length}</div>`;return h;}
function questTrackHtml(){const L=(P.quests||[]).filter(q=>q.track);if(!L.length)return '';const f=focusQuest();
  return L.slice(0,3).map(q=>`<div class="qtrk" data-q="${q.id}"><b>${q===f?'📍 ':''}${esc(q.title)}</b> <span class="opt">${q.rm?'mission':q.src==='side'?'side':'contract'}</span><br>${esc(objText(q))}</div>`).join('')+(L.length>3?`<div class="qtrk" style="opacity:.7">+${L.length-3} more tracked</div>`:'');}
function questAct(a,b){const D=b.dataset;if(a==='qacc'){if(acceptQuest(D.q))closePanel();}else if(a==='qfull')warn('Mission log full ('+MAXQ+')');else if(a==='qclaim'){claimQuest(D.q);openGiver(D.g);}
  else if(a==='qch'){if(chooseQuest(D.q,+D.o))closePanel();}else if(a==='qchoose')openChoice(D.q);else if(a==='qtrk'){const q=P.quests.find(x=>x.id===D.q);if(q){q.track=!q.track;save();openJournal('missions');}}
  else if(a==='qfoc'){const q=P.quests.find(x=>x.id===D.q);if(q){q.track=true;P.qfocus=q.id;save();toast('📍 Waypoint: '+q.title);openJournal('missions');}}else if(a==='qab'){abandonQuest(D.q);openJournal('missions');}
  else if(a==='qretry'){qRetry(D.q);openJournal('missions');}else if(a==='qauto'){P.qAutoWp=!P.qAutoWp;if(!P.qAutoWp&&P.uwp)clearUwp(true);save();openJournal('missions');}else return false;return true;}
$('#mtrack').addEventListener('pointerup',e=>{const t=e.target.closest('.qtrk');if(t&&state==='play'){SFX.ui();if(t.dataset.q)P.qfocus=t.dataset.q;openJournal('missions');}});
/* ---------- map + minimap ---------- */
function questMap(c,w2s,lab,vis){for(const g of GIVERS){if(!vis(g.x,g.z)&&!inTown(g))continue;const st=giverState(g);const q=w2s(g.x,g.z);c.fillStyle=st==='return'?'#6dff8a':st==='offer'?'#ffd25a':st==='step'?'#59c8ff':'#9a9a9a';c.strokeStyle='#000';c.lineWidth=2;
    c.beginPath();c.arc(q[0],q[1],6,0,7);c.fill();c.stroke();c.fillStyle='#1b0d05';c.font='bold 10px sans-serif';c.fillText(st==='return'?'?':'!',q[0],q[1]+0.5);if(st!=='none')lab(g.x,g.z,g.name,'#ffe8b0');}
  for(const q of (P.quests||[]).filter(q=>q.track)){const t=qTarget(q);if(!t)continue;const s=w2s(t.x,t.z);c.fillStyle='#ffd25a';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(s[0],s[1]-9);c.lineTo(s[0]+7,s[1]);c.lineTo(s[0],s[1]+9);c.lineTo(s[0]-7,s[1]);c.closePath();c.fill();c.stroke();lab(t.x,t.z,'📋 '+q.title,'#ffd25a');}}
function questMini(c,tf){for(const g of GIVERS){const st=g.st||'none';if(st==='none')continue;const q=tf(g.x,g.z);c.fillStyle=st==='return'?'#6dff8a':st==='offer'?'#ffd25a':'#59c8ff';c.beginPath();c.arc(q[0],q[1],4.5,0,7);c.fill();}
  for(const q of (P.quests||[]).filter(q=>q.track)){const t=qTarget(q);if(!t)continue;const s=tf(t.x,t.z);c.strokeStyle='#ffd25a';c.lineWidth=2.5;c.beginPath();c.arc(s[0],s[1],6,0,7);c.stroke();}}
/* ---------- contracts on the new log ---------- */
function qRestoreAll(){QS.chan=null;for(const k in QRT)delete QRT[k];for(const m of contracts()){if(m.stage!=='active')continue;if(m.kind==='fetch'){m.guardsSpawned=false;spawnCache(m);}else{m.campSpawned=false;spawnCamp(m);}}
  for(const q of sides())if(q.stage==='active'&&!q.s)qStartStep(q);}
function questExports(){return {curStep,biomeIdx,BIOMES,openJournal,updQuests,questOnDyna,qAdvance,qFail,missionWaypoint,questTrackHtml,giverState,qLevel,qFull,focusQuest,SQ,SQD,GIVERS,GV,MAXQ,acceptQuest,claimQuest,chooseQuest,abandonQuest,qRetry,stepsOf,curStep,objText,qTarget,focusQuest,QRT,QS,normQuests,openGiver,giverTalk,questDo,questInteract,questLogHtml,typesOf,makeElite,qStartStep,contracts,sides,openChoice,questOnKill,qAvail};}
