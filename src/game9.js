/* ================= STORY MISSIONS + data-driven area gates =================
   STORY: ordered chain. Each step: id, n (name), lvl (level needed to start), giver (NPC id that offers it), obj (one objective),
     intro/outro dialogue [[speaker,line],...], rew {xp,cr,disk?,gear?}, unlocks: [gate ids opened when this step is done].
   Objective kinds: talk{npc} · kill{etype|'foe',n} · collect{etype,n,item,p} · reach{x,z,r,label} · boss{key,dungeon} · faction{} (pick a side).
   GATES: anything that can be locked. kind 'zone' (x,z,r: the player is held outside), 'dungeon', 'feature', 'conduit'. A gate opens when
     the step listed in `step` is done, or when the character is grandfathered (gf). Future areas (e.g. faction zones guarded by unkillable
     NPCs) just add a GATES entry {kind:'zone',x,z,r,step:'sX'} and a STORY step that lists it in `unlocks`; validateStory() warns about typos. */
const STORY=[
  {id:'s1',n:'Static on the Wind',lvl:1,giver:'sela',obj:{k:'kill',etype:'skitter',n:4,label:'Cull Vyre-maddened skitters'},rew:{xp:90,cr:40},
   intro:[['Sela Marr','You\'re the new contractor? Good. Listen: the Vyre seams under Kessra have started to sing again. Not a metaphor.'],['Sela Marr','The skitters feel it first. They\'re swarming the dunes around Halden\'s Rest. Thin them out, four will do, and I\'ll know the static is real.']],
   outro:[['Sela Marr','Their nerve clusters were glowing. The crystal is waking up, and the Combine is pretending it isn\'t.']]},
  {id:'s2',n:'Singing Shards',lvl:2,giver:'sela',obj:{k:'collect',etype:'skitter',n:3,item:'Resonant Vyre Shard',p:0.65,label:'Collect Resonant Vyre Shards from skitters'},rew:{xp:160,cr:70,gear:'weapon'},unlocks:['cinderwell'],
   intro:[['Sela Marr','I need samples. Skitters swallow shards and carry them in their crops. Bring me three that still hum.']],
   outro:[['Sela Marr','Listen to them: same pitch, all three. Something deep is calling them in unison.'],['Sela Marr','I\'ve cleared you for the road south. Cinderwell Post\'s gate will open for you, Conduit link and Save Point included.']]},
  {id:'s3',n:'The Southern Post',lvl:3,giver:'sela',obj:{k:'reach',to:'cinderwell',r:15,label:'Reach Cinderwell Post'},rew:{xp:230,cr:90,disk:true},
   intro:[['Sela Marr','Cinderwell lost contact with us two nights ago. The Combine says it\'s just the storms. Go and look.']],
   outro:[['Cinderwell Radio','...Halden\'s, this is Cinderwell. We\'re alive. Raiders took our survey crawler and ran north-west with it. They had Ashborn-made rifles.']]},
  {id:'s4',n:'Dust Raiders',lvl:4,giver:'sela',obj:{k:'kill',etype:'raider',n:5,label:'Defeat Dust Raiders'},rew:{xp:340,cr:130},unlocks:['mine'],
   intro:[['Sela Marr','Raiders with clan rifles? Either the Ashborn are arming scavengers, or someone wants us to think so.'],['Sela Marr','Break five of their crews. Take note of anything they\'re carrying.']],
   outro:[['Sela Marr','Survey charts of Hollowvein Mine, the dig the Combine sealed after the crew "went hollow". The raiders were heading there.'],['Sela Marr','I\'ve had the seal codes released to you. Hollowvein is open, but it\'s not a place for the careless.']]},
  {id:'s5',n:'Hollow Voices',lvl:5,giver:'sela',obj:{k:'boss',key:'foreman',dungeon:'mine',label:'Defeat Foreman Grusk in Hollowvein Mine'},rew:{xp:480,cr:200,gear:'gear'},unlocks:['factions','skiff'],
   intro:[['Sela Marr','Grusk was the foreman. If he\'s still down there, he\'s what the crystal made of him. End it.']],
   outro:[['Sela Marr','Grusk\'s log names a buyer: Combine research. They knew the miners were changing and kept digging.'],['Sela Marr','This is bigger than me now. Registrar Hale can sign you to a side, and the tower network is open to you. You can also get a skiff permit from Mirra now.']]},
  {id:'s6',n:'Choosing a Side',lvl:5,giver:'sela',obj:{k:'faction',label:'Choose a side with Registrar Hale (Combine, Ashborn or Unaligned)'},rew:{xp:420,cr:220},unlocks:['glassreach'],
   intro:[['Sela Marr','The Combine wants the Vyre for its reactors. The Ashborn say the crystal is alive and must be left in the ground. Both are lying about something.'],['Sela Marr','Pick who you can live with. Registrar Hale will record it. Unaligned is a choice too.']],
   outro:[['Registrar Hale','Recorded. Whatever you chose, you\'ll need to see Glassreach Camp. The road east is open to you now.']]},
  {id:'s7',n:'The Glass Road',lvl:6,giver:'sela',obj:{k:'reach',to:'glassreach',r:15,label:'Reach Glassreach Camp'},rew:{xp:560,cr:240,disk:true},
   intro:[['Sela Marr','Glassreach is where the clans trade with anyone. If anyone knows what the Matriarch is, it\'s them.']],
   outro:[['Clan Broker Ysa','You came up the glass road alone? Then you\'ve earned a straight answer. The Matriarch is the crystal\'s mouth. Kill her and the singing stops for a while.']]},
  {id:'s8',n:'The Vein Matriarch',lvl:7,giver:'sela',obj:{k:'boss',key:'matriarch',dungeon:'mine',label:'Defeat the Vein Matriarch (Hollowvein Mine)'},rew:{xp:720,cr:320,gear:'gear'},
   intro:[['Sela Marr','Ysa is right, for once. The Matriarch sits at the bottom of Hollowvein and the shards sing to her. Go deep.']],
   outro:[['Sela Marr','The seams went quiet when she fell. All but one. The signal is still coming from somewhere east: Vault Theta-9.']]},
  {id:'s9',n:'Signal Fire',lvl:7,giver:'sela',obj:{k:'kill',etype:'foe',n:4,label:'Defeat enemy-faction soldiers in the desert'},rew:{xp:800,cr:360},unlocks:['vault'],
   intro:[['Sela Marr','Both sides want whatever is in Theta-9, and both have patrols on the road. Clear a path: four of the other side\'s soldiers. If you\'re Unaligned, either side will do.']],
   outro:[['Sela Marr','Path clear. I\'ve forged you a research clearance. Vault Theta-9 will open for you, if you can survive what guards it.']]},
  {id:'s10',n:'Theta Protocol',lvl:8,giver:'sela',obj:{k:'boss',key:'ixo',dungeon:'vault',label:'Defeat Warden-Prime Ixo in Vault Theta-9'},rew:{xp:1100,cr:480,disk:true},
   intro:[['Sela Marr','Ixo holds the inner gate. The Combine built it to keep things in, not out. Remember that.']],
   outro:[['Sela Marr','Ixo\'s memory core: the Custodian Engine is growing a crystal heart. Feeding it Vyre to make a mind. That\'s what has been singing.']]},
  {id:'s11',n:'Heart of the Vault',lvl:9,giver:'sela',obj:{k:'boss',key:'custodian',dungeon:'vault',label:'Shut down the Custodian Engine'},rew:{xp:1500,cr:800,gear:'gear',disk:true},
   intro:[['Sela Marr','Shut it down. The Combine will call it sabotage and the Ashborn will call it murder. Kessra will call it quiet.']],
   outro:[['Sela Marr','Silence across every seam. You did what neither side would.'],['Sela Marr','Kessra is yours to roam now. The towers, the dungeons, the trade roads. Come back when the crystal starts to sing again.']]},
  // ---- Chapter 2: The Duskcrown Choir (Lv 10-18). ch:2 steps are never auto-completed by the old-save migration. ----
  {id:'s12',ch:2,n:'The Second Song',lvl:10,giver:'sela',obj:{k:'kill',etype:'mauler',n:6,label:'Thin the maulers fleeing the outer ridges'},rew:{xp:Math.round(xpNeed(10)*0.3),cr:900},unlocks:['farwatch'],
   intro:[['Sela Marr','It started again. Not under Kessra this time: beyond the old ridges, where the maps just say "Duskcrown".'],['Sela Marr','The maulers are fleeing inward from it. Animals that size don\'t run from nothing. Cull six of them and bring me what spooked them.']],
   outro:[['Sela Marr','Violet dust in their hides, and burns shaped like music staves. Something out there sings loud enough to scar.'],['Sela Marr','The Combine kept a listening post at the edge of the Duskcrown: Farwatch Station. I\'ve had its gate codes released to you. Conduit link, Save Point and bank included.']]},
  {id:'s13',ch:2,n:'Farwatch',lvl:11,giver:'sela',obj:{k:'reach',to:'farwatch',r:16,label:'Reach Farwatch Station in the Duskcrown Highlands'},rew:{xp:Math.round(xpNeed(11)*0.3),cr:1000,disk:true},
   intro:[['Sela Marr','Farwatch is far: south-west, past Rustmaw and Mirewell, then up onto the violet terraces. Take the Conduit back when you\'ve been once.']],
   outro:[['Warden Kesh Odran','Sela\'s contractor. Good. We\'ve been listening to the Choir for a month and nobody back home would believe us.'],['Warden Kesh Odran','Talk to me when you\'re ready. Scout Quill and the quartermaster can use you too.']]},
  {id:'s14',ch:2,n:'Glint in the Dark',lvl:12,giver:'odran',obj:{k:'kill',etype:'stalker',n:6,label:'Hunt Glint Stalkers near Farwatch'},rew:{xp:Math.round(xpNeed(12)*0.3),cr:1100,gear:'weapon'},
   intro:[['Warden Kesh Odran','Glint Stalkers. They blink: one moment ahead of you, the next behind. Keep moving and keep your back clear.'],['Warden Kesh Odran','Six of them have been circling the station. End them.']],
   outro:[['Warden Kesh Odran','Their crystal hums when they die. All at the same pitch. Same as the shards Sela showed you, but louder.']]},
  {id:'s15',ch:2,n:'Choir Fragments',lvl:13,giver:'odran',obj:{k:'collect',etype:'shardcaller',n:4,item:'Choir Fragment',p:0.6,label:'Collect Choir Fragments from Shardcallers'},rew:{xp:Math.round(xpNeed(13)*0.3),cr:1200,disk:true},unlocks:['choir'],
   intro:[['Warden Kesh Odran','The Shardcallers carry fragments of whatever is singing. Bring me four. Watch for the falling shards they call down: red circles, step out.']],
   outro:[['Warden Kesh Odran','Laid side by side they make a map. A cathedral, under the north-west terraces. The Choir Below.'],['Warden Kesh Odran','I\'ve unsealed the old survey hatch. It\'s built for Lv 14 to 18 contractors. Don\'t go down underpowered.']]},
  {id:'s16',ch:2,n:'The Hollow Voice',lvl:14,giver:'odran',obj:{k:'boss',key:'cantor',dungeon:'choir',label:'Defeat Cantor Vey in The Choir Below'},rew:{xp:Math.round(xpNeed(14)*0.35),cr:1500,gear:'gear'},
   intro:[['Warden Kesh Odran','Cantor Vey was a Combine acoustics engineer. Now he\'s the Choir\'s first voice. He steps through walls; when he vanishes, move.']],
   outro:[['Warden Kesh Odran','Vey\'s recorder. He was trying to stop it, at the start. Then he started singing along.']]},
  {id:'s17',ch:2,n:'Breaking the Herd',lvl:15,giver:'odran',obj:{k:'kill',etype:'brute',n:6,label:'Break the Crag Brute herds'},rew:{xp:Math.round(xpNeed(15)*0.3),cr:1600,disk:true},
   intro:[['Warden Kesh Odran','The Crag Brutes are massing toward the station. When one lowers its head, it charges: sidestep, don\'t back up.']],
   outro:[['Warden Kesh Odran','Herd\'s broken. And their crystal burns show the same staves. The Choir is herding them.']]},
  {id:'s18',ch:2,n:'The Hymnwarden',lvl:16,giver:'odran',obj:{k:'boss',key:'hymnwarden',dungeon:'choir',label:'Defeat the Hymnwarden in The Choir Below'},rew:{xp:Math.round(xpNeed(16)*0.35),cr:1900,gear:'gear'},
   intro:[['Warden Kesh Odran','Past Vey\'s hall stands the Hymnwarden. It shields itself with pylons, and when it sings the Great Hymn, the only quiet place is right next to it.']],
   outro:[['Warden Kesh Odran','The Hymnwarden\'s core is Combine-built. Somebody fed the Choir a guardian. I want names.']]},
  {id:'s19',ch:2,n:'Tenders of the Choir',lvl:17,giver:'odran',obj:{k:'kill',etype:'tender',n:5,label:'Silence Choir Tenders (they heal other enemies)'},rew:{xp:Math.round(xpNeed(17)*0.3),cr:2100,disk:true},
   intro:[['Warden Kesh Odran','The Tenders keep everything else alive. Kill them first in every fight. Five, and the Choirmother loses her nurses.']],
   outro:[['Warden Kesh Odran','That\'s her nurses gone. She\'ll still have her Echoes. Kill those fast or she just heals.']]},
  {id:'s20',ch:2,n:'Silence Below',lvl:18,giver:'odran',obj:{k:'boss',key:'choirmother',dungeon:'choir',label:'Silence the Choirmother'},rew:{xp:Math.round(xpNeed(18)*0.4),cr:3000,gear:'gear',disk:true},
   intro:[['Warden Kesh Odran','The Choirmother. Everything out here sings because she does. End the song.']],
   outro:[['Warden Kesh Odran','Quiet. Real quiet, for the first time in a month.'],['Sela Marr (radio)','Well done. But listen: under the silence there\'s a second tone. Fainter, further out. Rest up, contractor. The Reach isn\'t done with us.']]},
  // ---- Chapter 3: The Second Tone (Lv 20-28, Build C) ----
  {id:'s21',ch:3,n:'The Second Tone',lvl:20,giver:'odran',obj:{k:'kill',etype:'shardcaller',n:8,label:'Silence the Shardcallers singing the second tone (far Duskcrown)'},rew:{xp:Math.round(xpNeed(20)*0.25),cr:3200},unlocks:['hoarlight'],
   intro:[['Warden Kesh Odran','Sela was right. The Shardcallers on the far terraces stopped singing the Choir\'s song. Now they hum one note, over and over, pointed outward.'],['Warden Kesh Odran','Eight of them. Silence them and bring me their crystal: I want to know what they are tuning to.']],
   outro:[['Warden Kesh Odran','Frost inside the crystal. In this heat. The note points past the Duskcrown, to the Rimefall: the ice plateau the old maps just leave white.'],['Warden Kesh Odran','There\'s a Combine cold-weather hold out there, Hoarlight. Keeper Tolt still runs it. I\'ve sent her your codes: Conduit, Save Point and bank.']]},
  {id:'s22',ch:3,n:'Hoarlight',lvl:21,giver:'odran',obj:{k:'reach',to:'hoarlight',r:17,label:'Reach Hoarlight Hold in the Rimefall Expanse'},rew:{xp:Math.round(xpNeed(21)*0.25),cr:3400,disk:true},
   intro:[['Warden Kesh Odran','Hoarlight is past the Lv 20 end of the Duskcrown, east of south. Dress warm. Take the Conduit home once you\'ve linked it.']],
   outro:[['Keeper Maren Tolt','Odran\'s contractor. You brought the heat with you; the ice hates that. Good.'],['Keeper Maren Tolt','The Rimefall wakes when the tone plays. Listen to Bram Kettle and Siv out in the drifts. They know where it bites.']]},
  {id:'s23',ch:3,n:'Under the Ice',lvl:22,giver:'tolt',obj:{k:'kill',etype:'burrower',n:6,label:'Hunt Rime Burrowers around Hoarlight'},rew:{xp:Math.round(xpNeed(22)*0.25),cr:3600,gear:'weapon'},
   intro:[['Keeper Maren Tolt','Rime Burrowers. They dive under the ice and come up right beneath you. When the snow cracks in a circle at your feet, move.'],['Keeper Maren Tolt','Six of them have been testing the hold\'s walls.']],
   outro:[['Keeper Maren Tolt','Their claws are rimed with the same frost as Odran\'s crystal. They all dig toward one place.']]},
  {id:'s24',ch:3,n:'Keys of Frost',lvl:23,giver:'tolt',obj:{k:'collect',etype:'frostcaller',n:4,item:'Stillglass Key-shard',p:0.6,label:'Take Stillglass Key-shards from Hoarfrost Callers'},rew:{xp:Math.round(xpNeed(23)*0.25),cr:3800,disk:true},unlocks:['stillvault'],
   intro:[['Keeper Maren Tolt','The Hoarfrost Callers carry key-shards of stillglass. Every hit from them chills you; four in a row and you freeze. Break line of sight, or kill them fast.'],['Keeper Maren Tolt','Four shards. Together they open what the Combine sealed.']],
   outro:[['Keeper Maren Tolt','The Stillvault. A Combine archive under the ice, south-west of here. Time runs slow down there.'],['Keeper Maren Tolt','I\'ve keyed the hatch. It\'s built for Lv 24 to 28 contractors. Go in ready.']]},
  {id:'s25',ch:3,n:'The Rimewarden',lvl:24,giver:'tolt',obj:{k:'boss',key:'rimewarden',dungeon:'stillvault',label:'Defeat the Rimewarden in The Stillvault'},rew:{xp:Math.round(xpNeed(24)*0.3),cr:4400,gear:'gear'},
   intro:[['Keeper Maren Tolt','The Rimewarden guards the archive stacks. Its Glacial Cross runs out along the floor in four lines. The space between the lines is safe.']],
   outro:[['Keeper Maren Tolt','Its core carries an archive seal. Somebody filed the tone. Like a record.']]},
  {id:'s26',ch:3,n:'Glacier March',lvl:25,giver:'tolt',obj:{k:'kill',etype:'shambler',n:6,label:'Break the Glacier Shamblers marching on Hoarlight'},rew:{xp:Math.round(xpNeed(25)*0.25),cr:4600,disk:true},
   intro:[['Keeper Maren Tolt','Glacier Shamblers are marching on the hold. Kill one and it shatters into Shardlings. Leave room to finish those too.']],
   outro:[['Keeper Maren Tolt','The march stopped when the last one fell. They were walking in time. To a clock.']]},
  {id:'s27',ch:3,n:'The Still Orrery',lvl:26,giver:'tolt',obj:{k:'boss',key:'orrery',dungeon:'stillvault',label:'Stop the Still Orrery in The Stillvault'},rew:{xp:Math.round(xpNeed(26)*0.3),cr:5200,gear:'gear'},
   intro:[['Keeper Maren Tolt','The clock is the Still Orrery. When it stops time, the whole hall freezes except one circle that drifts. Stay in the circle.']],
   outro:[['Keeper Maren Tolt','It was counting down. Not to an attack. To a wake-up.']]},
  {id:'s28',ch:3,n:'Wardens of Winter',lvl:27,giver:'tolt',obj:{k:'kill',etype:'sentinel',n:5,label:'Bring down Frostward Sentinels (they ward other enemies)'},rew:{xp:Math.round(xpNeed(27)*0.25),cr:5600,disk:true},
   intro:[['Keeper Maren Tolt','The Frostward Sentinels shield everything near them: blue shells, most of your damage gone. Kill the Sentinel first and the rest crack.'],['Keeper Maren Tolt','Five of them hold the road to the queen\'s hall.']],
   outro:[['Keeper Maren Tolt','The road is open. She knows you\'re coming. The ice is singing your name.']]},
  {id:'s29',ch:3,n:'The Hush',lvl:28,giver:'tolt',obj:{k:'boss',key:'ysra',dungeon:'stillvault',label:'End Queen Ysra of the Hush'},rew:{xp:Math.round(xpNeed(28)*0.35),cr:7000,gear:'gear',disk:true},
   intro:[['Keeper Maren Tolt','Queen Ysra. She was the Combine\'s archivist, sealed in with the tone. Her Rime Brand follows you, then freezes. When she hides in ice, break the three Hush Shards fast or she heals.']],
   outro:[['Keeper Maren Tolt','The tone has stopped. For the first time since I came out here, the ice is just ice.'],['Sela Marr (radio)','Contractor. Every seam from Kessra to the Rimefall is quiet. Rest. You have earned it, and whatever sang first is still out there.']]}];
const STEP={};STORY.forEach((s,i)=>{s.i=i;STEP[s.id]=s;});
const GATES={
  cinderwell:{name:'Cinderwell Post',kind:'zone',out:'cinderwell',step:'s2',desc:'outpost, Conduit link, Save Point and teleporter pad'},
  mine:{name:'Hollowvein Mine',kind:'dungeon',dungeon:'mine',step:'s4',desc:'dungeon and its Conduit gate'},
  factions:{name:'Factions & towers',kind:'feature',step:'s5',desc:'joining a side, faction vendors, faction contracts, tower capture and assaults'},
  skiff:{name:'Vehicle permit',kind:'feature',step:'s5',desc:'buying and summoning hover skiffs'},
  glassreach:{name:'Glassreach Camp',kind:'zone',out:'glassreach',step:'s6',desc:'outpost, Conduit link, Save Point, teleporter pad and the Clan Broker'},
  vault:{name:'Vault Theta-9',kind:'dungeon',dungeon:'vault',step:'s9',desc:'dungeon and its Conduit gate'},
  farwatch:{name:'Farwatch Station',kind:'zone',out:'farwatch',step:'s12',desc:'Duskcrown hub: Conduit link, Save Point, bank, quartermaster, contracts, and the Duskcrown wild packs and dynas'},
  choir:{name:'The Choir Below',kind:'dungeon',dungeon:'choir',step:'s15',desc:'Lv 14-18 dungeon and its Conduit gate'},
  hoarlight:{name:'Hoarlight Hold',kind:'zone',out:'hoarlight',step:'s21',desc:'Rimefall hub: Conduit link, Save Point, bank, quartermaster, contracts, and the Rimefall wild packs and dynas'},
  stillvault:{name:'The Stillvault',kind:'dungeon',dungeon:'stillvault',step:'s24',desc:'Lv 24-28 dungeon and its Conduit gate'}};
DUNGEONS.mine.gate='mine';DUNGEONS.vault.gate='vault';DUNGEONS.choir.gate='choir';DUNGEONS.stillvault.gate='stillvault';
for(const k in GATES){const g=GATES[k];if(g.out){const o=OUTPOSTS.find(q=>q.id===g.out);g.x=o.x;g.z=o.z;g.r=o.r+3;}}
CONDUIT.forEach(n=>{if(GATES[n.id])n.gate=n.id;else if(n.id.startsWith('door_')&&DUNGEONS[n.id.slice(5)])n.gate=DUNGEONS[n.id.slice(5)].gate||null;});
function validateStory(){for(const k in GATES){const g=GATES[k];if(!STEP[g.step])console.warn('DUSTREACH: gate '+k+' needs unknown story step '+g.step);}
  for(const k in DUNGEONS){const D=DUNGEONS[k];if(D.gate&&!GATES[D.gate])console.warn('DUSTREACH: dungeon '+k+' uses unknown gate '+D.gate);}
  STORY.forEach(s=>(s.unlocks||[]).forEach(g=>{if(!GATES[g])console.warn('DUSTREACH: story '+s.id+' unlocks unknown gate '+g);else if(GATES[g].step!==s.id)console.warn('DUSTREACH: gate '+g+' step mismatch');}));}
validateStory();

/* ---------- state ---------- */
const newStory=()=>({done:[],cur:null,track:true,gf:[],v:1});
// old saves (no story field): steps up to the character's level are done, and areas they already used stay open
function migrateStory(s){const lv=s.level||1;const st=newStory();st.done=STORY.filter(x=>x.lvl<=lv&&!x.ch).map(x=>x.id);st.mig=true;
  const nodes=s.nodes||[];const g=new Set();for(const k in GATES)if(GATES[k].kind==='zone'&&(nodes.includes(k)||(s.savePoint&&s.savePoint.id===k)))g.add(k);
  for(const k in DUNGEONS){const D=DUNGEONS[k];if(D.gate&&(nodes.includes('door_'+k)||(s.dunClears&&s.dunClears[k])))g.add(D.gate);}
  if(s.faction&&s.faction.side)g.add('factions');if((s.vehicles||[]).length)g.add('skiff');st.gf=[...g];return st;}
function normStory(s){const x=s.story;if(!x||typeof x!=='object')return migrateStory(s);
  const st={done:(Array.isArray(x.done)?x.done:[]).filter(id=>STEP[id]),cur:null,track:x.track!==false,gf:(Array.isArray(x.gf)?x.gf:[]).filter(k=>GATES[k]),v:1,mig:!!x.mig};
  if(x.cur&&STEP[x.cur.id]&&!st.done.includes(x.cur.id))st.cur={id:x.cur.id,have:x.cur.have|0};return st;}
const sto=()=>P.story||(P.story=newStory());
const stepDone=id=>sto().done.includes(id);
function gateOpen(k){const g=GATES[k];if(!g)return true;return stepDone(g.step)||sto().gf.includes(k);}
function gateMsg(k){const g=GATES[k],s=STEP[g.step];return '🔒 '+g.name+' is locked: complete story step '+(s.i+1)+' "'+s.n+'" (level '+s.lvl+')';}
function nextStep(){return STORY.find(s=>!stepDone(s.id))||null;}
// seen dialogue is shared by every character on this device, so alts can skip it
const SEEN_KEY='dustreach_story_seen';
function seenSet(){try{return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));}catch(e){return new Set();}}
function markSeen(key){const s=seenSet();s.add(key);lsSet(SEEN_KEY,JSON.stringify([...s]));}

/* ---------- story giver NPC ---------- */
const SELA={x:-4.5,z:9};
(function(){const y=heightAt(SELA.x,SELA.z);const n={id:'sela',name:'Archivist Sela Marr',k:'story',x:SELA.x,z:SELA.z,body:0x2f5f6a,acc:0xd4a020,vis:0x5ff2ff,mark:0xffd25a};
  n.R=buildHumanoid(n.body,n.acc,n.vis,0x7a5a46,{npc:1,apron:0xe6dcc6,bag:0x3a2c24});n.R.g.position.set(n.x,y,n.z);n.mk=part(n.R.g,new THREE.OctahedronGeometry(1,0),MB(n.mark),0,2.65,0,0.24,0.38,0.24);
  n.ex=part(n.R.g,geoBox,MB(0xffd25a),0,3.3,0,0.12,0.42,0.12);n.ex2=part(n.R.g,geoBox,MB(0xffd25a),0,2.98,0,0.12,0.12,0.12);scene.add(n.R.g);circles.push({x:n.x,z:n.z,r:0.6});NPCS.push(n);})();
// chapter 2 giver: Warden Kesh Odran at Farwatch Station
(function(){const o=OUTPOSTS.find(q=>q.id==='farwatch');const x=o.x-6,z=o.z+2.5,y=heightAt(x,z);const n={id:'odran',name:'Warden Kesh Odran',k:'story',x,z,body:0x3a3450,acc:0xb46bff,vis:0x7ff6ff,mark:0xffd25a};
  n.R=buildHumanoid(n.body,n.acc,n.vis,0x6a4a3a,{npc:1,cape:0x2a2438,crystal:0xb46bff});n.R.g.position.set(x,y,z);n.R.g.rotation.y=Math.atan2(o.x-x,o.z-z);n.mk=part(n.R.g,new THREE.OctahedronGeometry(1,0),MB(n.mark),0,2.65,0,0.24,0.38,0.24);
  n.ex=part(n.R.g,geoBox,MB(0xffd25a),0,3.3,0,0.12,0.42,0.12);n.ex2=part(n.R.g,geoBox,MB(0xffd25a),0,2.98,0,0.12,0.12,0.12);scene.add(n.R.g);circles.push({x,z,r:0.6});NPCS.push(n);})();
// chapter 3 giver: Keeper Maren Tolt at Hoarlight Hold (Rimefall)
(function(){const o=OUTPOSTS.find(q=>q.id==='hoarlight');const x=o.x-6.5,z=o.z+3,y=heightAt(x,z);const n={id:'tolt',name:'Keeper Maren Tolt',k:'story',x,z,body:0xc8d8e8,acc:0x4a6a88,vis:0x9fe8ff,mark:0xffd25a};
  n.R=buildHumanoid(n.body,n.acc,n.vis,0x8a6a5a,{npc:1,cape:0xe8f0f8,helm:0x4a6a88});n.R.g.position.set(x,y,z);n.R.g.rotation.y=Math.atan2(o.x-x,o.z-z);n.mk=part(n.R.g,new THREE.OctahedronGeometry(1,0),MB(n.mark),0,2.65,0,0.24,0.38,0.24);
  n.ex=part(n.R.g,geoBox,MB(0xffd25a),0,3.3,0,0.12,0.42,0.12);n.ex2=part(n.R.g,geoBox,MB(0xffd25a),0,2.98,0,0.12,0.12,0.12);scene.add(n.R.g);circles.push({x,z,r:0.6});NPCS.push(n);})();
const npcById=id=>NPCS.find(n=>n.id===id);
// red barrier rings around locked zones
const barriers={};
for(const k in GATES){const g=GATES[k];if(g.kind!=='zone')continue;const y=heightAt(g.x,g.z);const m=new THREE.Mesh(new THREE.CylinderGeometry(g.r,g.r,7,40,1,true),new THREE.MeshBasicMaterial({color:0xff5a3a,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide}));
  m.position.set(g.x,y+3.4,g.z);scene.add(m);const r=part(scene,new THREE.TorusGeometry(g.r,0.12,4,48),MB(0xff7a50),g.x,y+0.25,g.z,1,1,1);r.rotation.x=Math.PI/2;barriers[k]=[m,r];}
function refreshBarriers(){for(const k in barriers){const v=!gateOpen(k);barriers[k].forEach(m=>m.visible=v&&!DUN);}}

/* ---------- objectives ---------- */
function objTarget(s){const o=s.obj;if(o.k==='reach'){const g=GATES[o.to]||OUTPOSTS.find(q=>q.id===o.to);return g?{x:g.x,z:g.z,label:o.label}:null;}
  if(o.k==='boss'){const d=DUNGEONS[o.dungeon].door;return {x:d.x,z:d.z,label:DUNGEONS[o.dungeon].name};}
  if(o.k==='faction'){const n=npcById('registrar');return {x:n.x,z:n.z,label:'Registrar Hale'};}
  if(o.k==='kill'||o.k==='collect'){const et=o.etype==='foe'?foeTypes():[o.etype];let b=null,bd=1e9;for(const e of enemies)if(!e.dead&&et.includes(e.type)){const d=dist2D(e.pos,P.pos);if(d<bd){bd=d;b=e;}}return b?{x:b.pos.x,z:b.pos.z,label:o.label}:null;}
  return null;}
function foeTypes(){const me=fac().side;return me==='combine'?['clanblade']:me==='ashborn'?['warden']:['warden','clanblade'];}
function objNeed(s){return s.obj.n||1;}
function objProgress(){const c=sto().cur;if(!c)return '';const s=STEP[c.id],o=s.obj;
  if(o.k==='kill'||o.k==='collect')return c.have+'/'+o.n+(o.k==='collect'?' '+o.item+'s':'');if(o.k==='faction')return fac().side?'done':'not chosen yet';return '';}
function storyOnKill(e){const c=sto().cur;if(!c)return;const s=STEP[c.id],o=s.obj;
  if(o.k==='boss'&&e.boss&&e.boss.key===o.key){advance(1);return;}
  if(o.k==='kill'&&(o.etype==='foe'?foeTypes().includes(e.type):e.type===o.etype))advance(1);
  else if(o.k==='collect'&&e.type===o.etype&&Math.random()<o.p){advance(1);toast('📜 '+o.item+' '+Math.min(c.have,o.n)+'/'+o.n);}}
function advance(n){const c=sto().cur;if(!c)return;const s=STEP[c.id];c.have=Math.min(objNeed(s),c.have+n);if(c.have>=objNeed(s))completeStep();else save();}
function startStep(id){const s=STEP[id];if(!s||stepDone(id))return false;if(P.level<s.lvl){warn('Story step "'+s.n+'" needs level '+s.lvl);return false;}if(sto().cur){warn('Finish your current story step first');return false;}
  const prev=STORY[s.i-1];if(prev&&!stepDone(prev.id)){warn('Earlier story steps first');return false;}
  sto().cur={id,have:0};markSeen(id+':in');SFX.quest();log('📜 Story: <b style="color:#ffd25a">'+esc(s.n)+'</b>: '+esc(s.obj.label));checkInstant();save();return true;}
function checkInstant(){const c=sto().cur;if(!c)return;const o=STEP[c.id].obj;if(o.k==='faction'&&fac().side)completeStep();}
function completeStep(){const st=sto(),c=st.cur;if(!c)return;const s=STEP[c.id];st.cur=null;if(!st.done.includes(s.id))st.done.push(s.id);
  const r=s.rew||{};gainXp(r.xp||0);P.credits+=r.cr||0;const got=[];if(r.xp)got.push('+'+r.xp+' XP');if(r.cr)got.push('+'+r.cr+'¢');
  const give=it=>{if(!it)return;if(P.inv.length<24)P.inv.push(it);else dropLoot(P.pos.x+1,P.pos.z,it);got.push(it.name);};
  if(r.gear)give(genItem(Math.max(1,s.lvl),r.gear==='weapon'?'weapon':'gear',2,r.gear==='weapon'?{wt:PROF_WT[P.prof]}:{fam:PROF_FAM[P.prof]}));
  if(r.disk){const d=genDiskForLevel(Math.min(MAXLVL,s.lvl+1));if(d)give(d);}
  SFX.level();markSeen(s.id+':out');log('📜 Story complete: <b style="color:#ffd25a">'+esc(s.n)+'</b> · '+got.map(esc).join(', '));refreshBarriers();
  showStoryPop(s,got);save();}
// completion popup: rewards, outro, and any areas that just unlocked
let popT=0;
function showStoryPop(s,got){const el=$('#storyPop');const un=(s.unlocks||[]).map(k=>GATES[k]);const seen=seenSet().has(s.id+':out:shown');
  el.innerHTML=`<div class="sp-h">${un.length?'🔓 '+(un.length>1?'AREAS UNLOCKED':'AREA UNLOCKED'):'📜 STORY STEP COMPLETE'}</div><div class="sp-t">Story step ${s.i+1} complete: <b>${esc(s.n)}</b></div>`+
    (un.length?`<div class="sp-u">${un.map(g=>`<div><b>${esc(g.name)}</b><span>${esc(g.desc)}</span></div>`).join('')}</div>`:'')+
    `<div class="sp-r">${got.map(esc).join(' · ')}</div>`+(seen?'':`<div class="sp-d">${(s.outro||[]).map(([w,l])=>`<p><b>${esc(w)}:</b> ${esc(l)}</p>`).join('')}</div>`)+
    `<div class="sp-b"><button class="sbtn" id="spOk">Continue</button><button class="sbtn alt" id="spLog">📜 Journal</button></div>`;
  markSeen(s.id+':out:shown');el.classList.remove('hidden');popT=un.length?14:9;
  $('#spOk').onclick=()=>{SFX.ui();hidePop();};$('#spLog').onclick=()=>{SFX.ui();hidePop();openJournal('story');};}
function hidePop(){$('#storyPop').classList.add('hidden');popT=0;}

/* ---------- dialogue ---------- */
function openStoryDialog(id,full){const s=STEP[id];const seen=seenSet().has(id+':in');const lvOk=P.level>=s.lvl;const lines=s.intro||[];
  let h=`<div class="sdlg"><div class="sbadge">STORY · STEP ${s.i+1} of ${STORY.length}</div><div class="stitle">${esc(s.n)}</div>`;
  if(seen&&!full)h+=`<div class="stats" style="opacity:.85">You've already heard this on another character. <button class="sbtn alt" data-act="sfull" data-id="${id}" style="padding:6px 12px">Read it again</button></div>`;
  else h+=lines.map(([w,l])=>`<div class="sline"><b>${esc(w)}</b><p>${esc(l)}</p></div>`).join('');
  h+=`<div class="sobj">🎯 ${esc(s.obj.label)}${s.obj.n?' ('+s.obj.n+')':''}</div><div class="srew">Reward: ${s.rew.xp} XP · ${s.rew.cr}¢${s.rew.gear?' · gear':''}${s.rew.disk?' · Weave Disk':''}${(s.unlocks||[]).length?' · <b>unlocks '+s.unlocks.map(k=>esc(GATES[k].name)).join(', ')+'</b>':''}</div>`;
  h+=lvOk?`<button class="sbtn sbig" data-act="saccept" data-id="${id}">${seen&&!full?'Skip dialogue · Accept':'Accept'}</button>`:`<div class="down" style="margin-top:8px">Requires level ${s.lvl} (you are ${P.level}). Optional contracts at the 📟 terminal are a good way to level up.</div>`;
  openPanel('📜 '+npcName(s.giver).toUpperCase(),h+'</div>','story');}
const npcName=id=>{const n=npcById(id);return n?n.name:id;};

/* ---------- journal ---------- */
let jTab='story';
function openJournal(tab){if(tab)jTab=tab;const st=sto();const tabs=`<div class="tabs"><button data-act="jtab" data-t="story" class="${jTab==='story'?'on':''}">📜 Story</button><button data-act="jtab" data-t="areas" class="${jTab==='areas'?'on':''}">🗺 Areas</button><button data-act="jtab" data-t="raids" class="${jTab==='raids'?'on':''}">⚔ Raids</button><button data-act="jtab" data-t="missions" class="${jTab==='missions'||jTab==='opt'?'on':''}">📋 Missions</button></div>`;let h=tabs;
  if(jTab==='story'){const nx=nextStep();h+=`<div class="stats">Story steps unlock new areas and features. Contracts from the 📟 terminal stay optional (XP and loot). ${st.done.length}/${STORY.length} complete.</div>`;
    if(st.cur){const s=STEP[st.cur.id];h+=`<div class="mis story cur"><span class="sbadge">STORY · ACTIVE</span><b>${s.i+1}. ${esc(s.n)}</b><p>🎯 ${esc(s.obj.label)} ${objProgress()?'· <b>'+objProgress()+'</b>':''}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="sbtn" data-act="strack">${st.track?'✔ Tracked on HUD':'Track on HUD'}</button><button class="sbtn alt" data-act="sreplay" data-id="${s.id}">Replay dialogue</button></div></div>`;}
    else if(nx){h+=`<div class="mis story cur"><span class="sbadge">STORY · NEXT</span><b>${nx.i+1}. ${esc(nx.n)}</b><p>${P.level>=nx.lvl?'Talk to <b>'+esc(giverWhere(nx.id))+'</b> (gold marker).':'Reach level '+nx.lvl+' (you are '+P.level+'), then talk to '+esc(npcName(nx.giver))+'.'}</p><button class="sbtn${st.track?'':' alt'}" data-act="strack">${st.track?'✔ Tracked on HUD':'Track on HUD'}</button></div>`;}
    else h+=`<div class="mis story"><b>The chain is complete.</b><p>Kessra is quiet, for now.</p></div>`;
    h+=STORY.map(s=>{const d=stepDone(s.id),cur=st.cur&&st.cur.id===s.id;return `<div class="jrow${d?' done':cur?' cur':''}"><span class="jn">${d?'✔':cur?'▶':P.level>=s.lvl?'•':'🔒'}</span><span style="flex:1"><b>${s.i+1}. ${esc(s.n)}</b> <span style="opacity:.7">· Lv ${s.lvl}</span>${(s.unlocks||[]).length?`<br><span class="jun">${d?'Unlocked':'Unlocks'}: ${s.unlocks.map(k=>esc(GATES[k].name)).join(', ')}</span>`:''}</span>${d?`<button class="chip" data-act="sreplay" data-id="${s.id}">Replay</button>`:''}</div>`;}).join('');}
  else if(jTab==='areas'){h+=`<div class="stats">Story-gated areas and features. Gates combine with dungeon level caps.</div>`+Object.keys(GATES).map(k=>{const g=GATES[k],o=gateOpen(k),s=STEP[g.step];const gf=!stepDone(g.step)&&st.gf.includes(k);
    return `<div class="jrow${o?' done':''}"><span class="jn">${o?'🔓':'🔒'}</span><span style="flex:1"><b>${esc(g.name)}</b> <span style="opacity:.7">· ${esc(g.desc)}</span><br><span class="jun">${o?(gf?'Open (you had already been here before story missions existed)':'Opened by step '+(s.i+1)+' "'+esc(s.n)+'"'):'Needs step '+(s.i+1)+' "'+esc(s.n)+'" (level '+s.lvl+')'}${g.dungeon?' · '+dunRange(g.dungeon):''}</span></span></div>`;}).join('');}
  else if(jTab==='raids')h+=raidJournalHtml();
  else if(jTab==='missions'||jTab==='opt')h+=questLogHtml();
  else{const m=P.mission;h+=`<div class="stats">Optional contracts: take them at the 📟 terminal for XP, credits and loot. They never gate anything.</div>`+(m?`<div class="mis"><span class="obadge">OPTIONAL</span><b>${esc(m.title)}</b><p>${esc(m.desc)}</p>${m.kind==='kill'?`<div>Progress: ${m.have}/${m.need}</div>`:''}</div>`:'<div style="opacity:.6">No active contract.</div>');}
  openPanel('📜 JOURNAL',h,'journal');}

/* ---------- HUD tracker + waypoint ---------- */
function storyTrack(){const st=sto();if(!st.track||(DUN&&DUN.apt))return '';const c=st.cur;
  if(c){const s=STEP[c.id];const p=objProgress();return `<div class="strk" data-j="1"><span>📜 STORY</span><b>${esc(s.n)}</b><br>${esc(s.obj.label)}${p?' · '+p:''}</div>`;}
  const nx=nextStep();if(!nx)return '';return `<div class="strk" data-j="1"><span>📜 STORY</span><b>${esc(nx.n)}</b><br>${P.level>=nx.lvl?'Talk to '+esc(npcName(nx.giver)):'Reach level '+nx.lvl}</div>`;}
function storyWaypoint(){const st=sto();if(!st.track||DUN)return null;const c=st.cur;if(c){const t=objTarget(STEP[c.id]);return t;}
  const nx=nextStep();if(nx&&P.level>=nx.lvl){const n=npcById(nx.giver);return {x:n.x,z:n.z,label:n.name};}return null;}

/* ---------- interaction + gate enforcement ---------- */
function storyInteract(p){const st=sto();
  // story giver
  for(const n of NPCS)if(n.k==='story'&&Math.hypot(p.x-n.x,p.z-n.z)<3.2){const nx=nextStep();return {k:'sgiver',label:st.cur||!(nx&&P.level>=nx.lvl)?'📜 '+n.name.replace(/^(Archivist|Warden|Keeper) /,''):'📜 New story: '+nx.n};}
  if(!gateOpen('factions')){for(const n of NPCS)if((n.k==='registrar'||n.k==='facvend')&&Math.hypot(p.x-n.x,p.z-n.z)<3.2)return {k:'slock',gate:'factions',label:'🔒 '+n.name};
    for(const k in SITES){const S=SITES[k];if(Math.hypot(p.x-S.x,p.z-S.z)<6.5)return {k:'slock',gate:'factions',label:'🔒 '+S.name};}}
  return null;}
function storyDo(n){if(n.k==='sgiver'){const st=sto();if(st.cur)openStoryDialogCur();else{const nx=nextStep();if(nx)openStoryDialog(nx.id);else openJournal('story');}return true;}
  if(n.k==='slock'){lockedMsg(n.gate,true);return true;}return false;}
function openStoryDialogCur(){openJournal('story');}
const lockT={};
function lockedMsg(k,force){if(!force){if(T-(lockT[k]??-99)<4)return;lockT[k]=T;}const g=GATES[k],s=STEP[g.step];warn(gateMsg(k));banner('🔒 '+g.name.toUpperCase()+' LOCKED','Story step '+(s.i+1)+' · "'+s.n+'" (level '+s.lvl+'). Talk to '+giverWhere(s.id));}
const GIVER_AT={sela:'Archivist Sela Marr in Halden\'s Rest',odran:'Warden Kesh Odran at Farwatch Station',tolt:'Keeper Maren Tolt at Hoarlight Hold'};
function giverWhere(id){const s=STEP[id];return GIVER_AT[s&&s.giver]||GIVER_AT.sela;}
function storyAct(a,b){const D=b.dataset;if(a==='saccept'){if(startStep(D.id))closePanel();}else if(a==='sfull')openStoryDialog(D.id,true);else if(a==='sreplay')openStoryDialog(D.id,true);
  else if(a==='jtab')openJournal(D.t);else if(a==='strack'){sto().track=!sto().track;save();openJournal();}else if(a==='journal'){closePanel();openJournal();}else if(a==='slockc')lockedMsg(D.g,true);else return false;return true;}
let stAcc=0;
function updStory(dt){if(state!=='play')return;if(popT>0){popT-=dt;if(popT<=0)hidePop();}
  if(!FLAT&&!P.dead)for(const k in GATES){const g=GATES[k];if(g.kind!=='zone'||gateOpen(k))continue;const dx=P.pos.x-g.x,dz=P.pos.z-g.z,d=Math.hypot(dx,dz);
    if(d<g.r){const f=(g.r+0.15)/(d||1);P.pos.x=g.x+dx*f;P.pos.z=g.z+dz*f;if(P.mount)dismount();lockedMsg(k);}}
  stAcc+=dt;if(stAcc<0.25)return;stAcc=0;refreshBarriers();
  const n=npcById('sela');if(n){const nx=nextStep();const show=!sto().cur&&nx&&P.level>=nx.lvl;n.ex.visible=n.ex2.visible=!!show;}
  const c=sto().cur;if(c){const s=STEP[c.id],o=s.obj;if(o.k==='reach'){const t=objTarget(s);if(t&&Math.hypot(P.pos.x-t.x,P.pos.z-t.z)<o.r)advance(1);}else if(o.k==='faction')checkInstant();}}
// conduit / pads / vehicles hooks
function nodeOpen(n){return !n.gate||gateOpen(n.gate);}
// debug / tests: complete the first n steps silently
function storyGrant(n){const st=sto();STORY.slice(0,n).forEach(s=>{if(!st.done.includes(s.id))st.done.push(s.id);});if(st.cur&&st.done.includes(st.cur.id))st.cur=null;refreshBarriers();save();return st.done.length;}
function storyExports(){return {STORY,STEP,GATES,gateOpen,gateMsg,nextStep,startStep,completeStep,storyOnKill,openJournal,openStoryDialog,storyTrack,storyWaypoint,storyGrant,migrateStory,normStory,newStory,seenSet,SELA,showStoryPop,hidePop,storyInteract,validateStory,nodeOpen,get story(){return sto();}};}
// top card on the contract terminal: the story is the main thread, contracts are optional
function terminalStoryCard(){const st=sto(),c=st.cur,nx=nextStep();let body;
  if(c){const s=STEP[c.id];body=`<b>${s.i+1}. ${esc(s.n)}</b><p>🎯 ${esc(s.obj.label)}${objProgress()?' · <b>'+objProgress()+'</b>':''}</p>`;}
  else if(nx)body=`<b>${nx.i+1}. ${esc(nx.n)}</b><p>${P.level>=nx.lvl?'Talk to Archivist Sela Marr (gold marker, west of this terminal) to begin.':'Unlocks at level '+nx.lvl+'. Optional contracts below are the way to level up.'}${(nx.unlocks||[]).length?' Completing it unlocks <b>'+nx.unlocks.map(k=>esc(GATES[k].name)).join(', ')+'</b>.':''}</p>`;
  else body='<b>Story complete</b><p>Every area is open to you.</p>';
  return `<div class="mis story"><span class="sbadge">STORY</span>${body}<button class="sbtn alt" data-act="journal" style="padding:8px 14px">📜 Open journal</button></div>`;}
