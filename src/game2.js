/* ---------------- models ---------------- */
function buildHumanoid_v1(body,accent,visor,skin){
  const g=new THREE.Group();const R={g};
  R.torso=part(g,geoBox,M(body),0,1.22,0,0.72,0.78,0.42);
  part(g,geoBox,M(accent),0,1.5,0,0.8,0.22,0.48);
  part(g,geoBox,M(skin||0x3a3330),0,1.8,0,0.42,0.42,0.42);
  part(g,geoBox,MB(visor),0,1.83,0.2,0.36,0.12,0.06);
  part(g,geoBox,M(accent),0,1.25,-0.29,0.5,0.55,0.2);
  const limb=(x,y,w,h,mat)=>{const p=new THREE.Group();p.position.set(x,y,0);g.add(p);part(p,geoBox,mat,0,-h/2,0,w,h,w*1.15);return p;};
  R.legL=limb(-0.19,0.86,0.24,0.86,M(0x2c2a2a));R.legR=limb(0.19,0.86,0.24,0.86,M(0x2c2a2a));
  R.armL=limb(-0.47,1.52,0.19,0.72,M(body));R.armR=limb(0.47,1.52,0.19,0.72,M(body));
  R.gun=part(R.armR,geoBox,M(0x222222),0,-0.7,0.25,0.12,0.14,0.62);
  R.anim=(t,mv,atk)=>{const s=Math.sin(t*11)*0.65*mv;R.legL.rotation.x=s;R.legR.rotation.x=-s;R.armL.rotation.x=-s*0.7;R.armR.rotation.x=atk>0?-1.45:s*0.7;R.torso.position.y=1.22+Math.abs(Math.cos(t*11))*0.04*mv;};
  return R;
}
function buildSkitter_v1(){
  const g=new THREE.Group();const R={g};
  R.body=part(g,geoIco,M(0xb8642c),0,0.6,0,0.75,0.42,1.0);
  part(g,geoIco,M(0x7a3a1a),0,0.75,-0.75,0.5,0.35,0.6);
  part(g,geoBox,M(0x5a2a12),0,0.62,0.85,0.45,0.3,0.4);
  part(g,geoBox,MB(0xff4d4d),0.13,0.72,1.05,0.08,0.08,0.05);part(g,geoBox,MB(0xff4d4d),-0.13,0.72,1.05,0.08,0.08,0.05);
  part(g,geoCone,M(0xe8c89a),0.16,0.52,1.2,0.07,0.4,0.07).rotation.x=Math.PI/2;part(g,geoCone,M(0xe8c89a),-0.16,0.52,1.2,0.07,0.4,0.07).rotation.x=Math.PI/2;
  R.legs=[];for(let i=0;i<4;i++){const p=new THREE.Group();p.position.set(i<2?0.5:-0.5,0.55,i%2?0.35:-0.35);g.add(p);const l=part(p,geoBox,M(0x5a2a12),(i<2?0.35:-0.35),-0.2,0,0.75,0.1,0.1);l.rotation.z=i<2?-0.6:0.6;R.legs.push(p);}
  R.anim=(t,mv,atk)=>{R.legs.forEach((p,i)=>p.rotation.y=Math.sin(t*18+i*1.6)*0.45*mv);R.body.position.y=0.6+Math.sin(t*18)*0.04*mv;g.rotation.x=atk>0?-0.25:0;};
  return R;
}
function buildMauler_v1(){
  const g=new THREE.Group();const R={g};
  R.body=part(g,geoIco,M(0x5d4a63),0,1.55,0,1.15,0.95,1.5);
  part(g,geoIco,M(0x463650),0,2.1,-0.3,0.9,0.7,1.0);
  R.head=part(g,geoBox,M(0x4a3a52),0,1.55,1.35,0.85,0.7,0.8);
  part(g,geoBox,MB(0xffd25a),0.22,1.68,1.76,0.13,0.1,0.05);part(g,geoBox,MB(0xffd25a),-0.22,1.68,1.76,0.13,0.1,0.05);
  part(g,geoCone,M(0xe8dcc0),0.42,2.1,1.3,0.13,0.7,0.13).rotation.z=-0.5;part(g,geoCone,M(0xe8dcc0),-0.42,2.1,1.3,0.13,0.7,0.13).rotation.z=0.5;
  for(let i=0;i<5;i++)part(g,geoIco,MB(0x5ff2ff),srand(-0.6,0.6),srand(2.0,2.5),srand(-0.9,0.6),0.13,0.2,0.13);
  R.legs=[];for(let i=0;i<4;i++){const p=new THREE.Group();p.position.set(i<2?0.65:-0.65,1.2,i%2?0.7:-0.7);g.add(p);part(p,geoBox,M(0x3a2d40),0,-0.6,0,0.38,1.2,0.42);R.legs.push(p);}
  R.anim=(t,mv,atk)=>{R.legs.forEach((p,i)=>p.rotation.x=Math.sin(t*7+(i%2?0:Math.PI)+(i<2?0:Math.PI))*0.5*mv);R.head.rotation.x=atk>0?0.5:0;R.body.position.y=1.55+Math.sin(t*7)*0.05*mv;};
  return R;
}
function buildRaider_v1(){return buildHumanoid(0x7a4a2a,0x3d2b1f,0xff3b2f,0x2a2222);}

/* ---------------- data ---------------- */
const ATTRS=['str','agi','sta','int','psy','sen'];
const SKILLS=['wpn','weave','treat','body','pool','evade','run','fab','ia'];const TSK=['fab','ia'];
const STATN={str:'Strength',agi:'Agility',sta:'Stamina',int:'Intelligence',psy:'Psychic',sen:'Sense',wpn:'Weapon Handling',weave:'Weave Craft',treat:'Treatment',body:'Body Development',pool:'Vyre Pool',evade:'Evasion',fab:'Fabrication',ia:'Implant Assembly',run:'Run Speed',dr:'% Damage Reduction',hp:'Max Health',en:'Max Energy',crit:'% Crit',power:'% Power',level:'Level',spd:'% Run Speed'};
const SHORT={str:'STR',agi:'AGI',sta:'STA',int:'INT',psy:'PSY',sen:'SEN',wpn:'WPN',weave:'WVC',treat:'TRT',body:'BDY',pool:'POOL',evade:'EVD',fab:'FAB',ia:'IMA',run:'RUN',dr:'DR',hp:'HP',en:'EN',crit:'CRIT',power:'PWR',level:'LVL',spd:'SPD'};
const STATDESC={str:'Feeds Weapon Handling. Arm implant requirement.',agi:'Feeds Weapon Handling and Treatment. Hand and foot implant requirement.',sta:'Health, and feeds Body Development. Chest and leg implant requirement.',int:'Feeds Weave Craft, Treatment and Vyre Pool. Head implant requirement.',psy:'Energy, and feeds Weave Craft and Vyre Pool.',sen:'Crit chance, and feeds Treatment. Eye implant requirement.',
  wpn:'Gun damage. Needed to wield better guns.',weave:'Weave damage and healing. Needed to wield better focus weapons.',treat:'Needed to install implants (higher QL needs more). Boosts healing.',body:'Max health. Needed to wear better armour.',pool:'Max energy.',evade:'Chance to fully dodge enemy attacks (diminishing returns). Cheap for Glintrunners.',fab:'Tradeskill: reinforce armour, tune weapons, infuse gear and make Basic Implants. Higher-QL work needs more.',run:'How fast you move on foot. Converted to a % speed bonus on a diminishing curve, hard-capped at +'+60+'%. Fed by Agility and Stamina. Cheap for Glintrunners and Wildshifters. Vehicles ignore it; enemy slows reduce it.',ia:'Tradeskill: build custom implants from a Basic Implant plus Keystone, Lattice and Filament clusters. Higher QL needs more.'};
const TRICKLE={wpn:{agi:.5,str:.5},weave:{int:.5,psy:.5},treat:{int:.5,agi:.3,sen:.2},body:{sta:1},pool:{psy:.6,int:.4},evade:{agi:.6,sen:.4},fab:{int:.4,agi:.3,sen:.3},run:{agi:.6,sta:.4},ia:{int:.5,sen:.3,agi:.2}};
const PROFS={
  vanguard:{name:'Vanguard',role:'Gunner / Tank',color:0x3f6fb0,accent:0x22344d,visor:0xffc85a,hpMul:1.25,enMul:0.8,dmgSkill:'wpn',
    attrs:{str:12,agi:10,sta:13,int:7,psy:7,sen:9},innate:{wpn:5,body:5},cost:{str:2,agi:2,sta:2,int:3,psy:3,sen:3,wpn:1,weave:3,treat:2,body:1,pool:3,evade:2},
    desc:'Combine-trained shock trooper. Heavy armour and big guns. The toughest of them all.',
    basic:{id:'basic',name:'Rifle Shot',icon:'🔫',cost:0,cd:0.9,range:22,mult:1.0,proj:0xffe08a},
    abilities:[
      {id:'scatter',name:'Scatter Burst',icon:'💥',cost:20,cd:6,range:8,needTarget:false,desc:'Blast every enemy within 8m for 140% damage.'},
      {id:'bulwark',name:'Bulwark',icon:'🛡️',cost:25,cd:20,range:0,needTarget:false,desc:'Take 50% less damage for 8s.'},
      {id:'breach',name:'Breach Round',icon:'🎯',cost:30,cd:10,range:26,needTarget:true,desc:'A heavy round for 320% damage.'},
      {id:'drill',name:'Drill Protocol',icon:'🎖️',cost:25,cd:5,range:0,buff:{dur:180,mods:L=>({wpn:8+L*2,str:3+L,agi:3+L,body:4+L})},desc:'Self-buff (3 min): + Weapon Handling, Strength, Agility, Body Dev.'}]},
  weaver:{name:'Vyreweaver',role:'Hex & Control Caster',color:0x6b3fa0,accent:0x2b1840,visor:0x5ff2ff,hpMul:0.85,enMul:1.45,dmgSkill:'weave',
    attrs:{str:7,agi:9,sta:9,int:12,psy:13,sen:11},innate:{weave:5,pool:3},cost:{str:3,agi:3,sta:3,int:2,psy:2,sen:2,wpn:3,weave:1,treat:2,body:2,pool:1,evade:3},
    desc:'Bends Vyre into hexes and bindings. Roots, drains and weakens enemies so they hit softer and fall faster.',
    basic:{id:'basic',name:'Vyre Bolt',icon:'✳️',cost:0,cd:1.3,range:24,mult:1.05,proj:0x5ff2ff},
    abilities:[
      {id:'arc',name:'Arc Lance',icon:'⚡',cost:18,cd:2.5,range:24,needTarget:true,desc:'Lance of Vyre for 180% damage.'},
      {id:'stasis',name:'Stasis Bloom',icon:'❄️',cost:30,cd:14,range:24,needTarget:true,desc:'130% damage to everything within 6m of the target and roots them for 4s.'},
      {id:'leech',name:'Leech Weave',icon:'🌀',cost:12,cd:8,range:24,needTarget:true,desc:'Burns the target for 70% damage every second for 8s and returns energy to you.'},
      {id:'hex',name:'Frailty Hex',icon:'☠️',cost:20,cd:12,range:24,needTarget:true,desc:'For 12s the target takes 30% more damage and deals 35% less.'},
      {id:'lattice',name:'Mind Lattice',icon:'🔮',cost:25,cd:5,range:0,buff:{dur:180,mods:L=>({int:3+L,psy:3+L,weave:6+L*2,treat:4+L})},desc:'Self-buff (3 min): + Intelligence, Psychic, Weave Craft, Treatment.'}]},
  mender:{name:'Mender',role:'Medic / Support',color:0xd8d8d0,accent:0x2f8a5a,visor:0x6dff8a,hpMul:1.05,enMul:1.2,dmgSkill:'wpn',
    attrs:{str:8,agi:11,sta:10,int:13,psy:10,sen:11},innate:{treat:8,weave:3},cost:{str:3,agi:2,sta:3,int:2,psy:3,sen:2,wpn:2,weave:2,treat:1,body:2,pool:2,evade:2},
    desc:'Field medic with bio-Weaves. Patches up anything, it\'s hard to kill, and it\'s the best at installing implants.',
    basic:{id:'basic',name:'Pulse Pistol',icon:'🔹',cost:0,cd:1.0,range:20,mult:0.95,proj:0x6dff8a},
    abilities:[
      {id:'mend',name:'Mend',icon:'✚',cost:22,cd:5,range:0,needTarget:false,desc:'Heal yourself for 30% of max health (more with Treatment).'},
      {id:'renew',name:'Renewal Field',icon:'❋',cost:30,cd:18,range:0,needTarget:false,desc:'Heal 4% of max health every second for 10s.'},
      {id:'spike',name:'Neural Spike',icon:'✴️',cost:20,cd:9,range:22,needTarget:true,desc:'160% damage, and stuns the target for 3s.'},
      {id:'hands',name:'Steady Hands',icon:'🩺',cost:25,cd:5,range:0,buff:{dur:180,mods:L=>({treat:10+L*3,agi:3+L,int:3+L})},desc:'Self-buff (3 min): big Treatment boost plus Agility and Intelligence. The classic implant twink.'}]},
  flux:{name:'Fluxwright',role:'Nuker / Pure Damage',color:0xc0501e,accent:0x2a1a12,visor:0xffe95a,hpMul:0.75,enMul:1.7,dmgSkill:'weave',
    attrs:{str:6,agi:8,sta:7,int:14,psy:14,sen:9},innate:{weave:8,pool:5},cost:{str:3,agi:3,sta:3,int:2,psy:2,sen:3,wpn:3,weave:1,treat:2,body:3,pool:1,evade:3},
    desc:'A Vyre-overclocked nuker. Paper-thin, with a huge energy pool, and nothing deletes a target faster.',
    basic:{id:'basic',name:'Flux Spark',icon:'🔸',cost:0,cd:1.2,range:24,mult:1.0,proj:0xffb347},
    abilities:[
      {id:'flare',name:'Flux Lance',icon:'🔥',cost:14,cd:1.6,range:26,needTarget:true,desc:'Fast nuke for 190% damage.'},
      {id:'sunder',name:'Sunder Spike',icon:'☄️',cost:42,cd:7,range:26,needTarget:true,desc:'Huge single-target nuke for 460% damage.'},
      {id:'nova',name:'Cinder Nova',icon:'🌋',cost:40,cd:10,range:24,needTarget:true,desc:'Detonates on the target for 210% damage to everything within 7m.'},
      {id:'sear',name:'Searing Thread',icon:'🧵',cost:18,cd:7,range:26,needTarget:true,desc:'Burns the target for 95% damage every second for 8s.'},
      {id:'overclock',name:'Overclock Cortex',icon:'⚙️',cost:30,cd:5,range:0,buff:{dur:180,mods:L=>({weave:10+L*3,int:4+L,psy:4+L})},desc:'Self-buff (3 min): big Weave Craft boost (more nuke damage), plus Intelligence and Psychic.'}]},
  runner:{name:'Glintrunner',role:'Evader / Skirmisher',color:0x2f8f8a,accent:0x14302e,visor:0x59c8ff,hpMul:0.95,enMul:1.0,dmgSkill:'wpn',
    attrs:{str:8,agi:14,sta:9,int:9,psy:8,sen:12},innate:{evade:10,wpn:4},cost:{str:3,agi:1,sta:2,int:3,psy:3,sen:2,wpn:1,weave:2,treat:2,body:2,pool:3,evade:1},
    desc:'A Reach smuggler who never stands still. Rapid twin-pistol fire, self-patching loops, snares and speed. Very hard to hit.',
    basic:{id:'basic',name:'Twin Pistols',icon:'🔫',cost:0,cd:0.6,range:20,mult:0.62,proj:0x59c8ff},
    abilities:[
      {id:'rattle',name:'Rattle Burst',icon:'💨',cost:14,cd:4,range:20,needTarget:true,kind:'rattle',mult:0.7,shots:3,color:0x59c8ff,desc:'Unloads both pistols: 3 rapid shots for 70% damage each.'},
      {id:'patchloop',name:'Patchloop',icon:'➰',cost:18,cd:14,range:0,needTarget:false,kind:'hot',pct:0.05,dur:10,desc:'Heal 5% of max health every second for 10s.'},
      {id:'snarewire',name:'Snarewire',icon:'🪢',cost:16,cd:10,range:22,needTarget:true,kind:'nuke',mult:0.6,root:6,color:0x59c8ff,desc:'Roots the target in place for 6s and deals 60% damage.'},
      {id:'slipstream',name:'Slipstream',icon:'🌬️',cost:20,cd:5,range:0,buff:{dur:180,mods:L=>({run:60+L*2,agi:2+L,evade:6+L*2})},desc:'Self-buff (3 min): +60 Run Speed (about +25% move speed), plus Agility and Evasion.'}]},
  wright:{name:'Dronewright',role:'Engineer / Bot Commander',color:0x8a7432,accent:0x3a3018,visor:0xffa040,hpMul:1.0,enMul:1.2,dmgSkill:'weave',
    attrs:{str:8,agi:10,sta:10,int:13,psy:10,sen:9},innate:{weave:4,treat:3},cost:{str:3,agi:2,sta:2,int:1,psy:2,sen:2,wpn:2,weave:1,treat:2,body:2,pool:2,evade:3},
    desc:'A Reach tinker who fights through machines. Builds combat bots that tank and deal most of the damage, then repairs and overclocks them.',
    basic:{id:'basic',name:'Rivet Pistol',icon:'🔩',cost:0,cd:0.9,range:20,mult:0.75,proj:0xffa040},
    abilities:[
      {id:'assemble',name:'Assemble: Scrapper Bot',icon:'🤖',cost:30,cd:6,range:0,needTarget:false,kind:'summon',pet:'bot1',desc:'Builds a Scrapper Bot that follows you, attacks your target and has its own health. Recast to rebuild it.'},
      {id:'patchdrone',name:'Patch Drone',icon:'🛠️',cost:15,cd:6,range:0,needTarget:false,needPet:true,kind:'petheal',pct:0.35,hot:0.03,desc:'Repairs your bot for 35% of its health, plus 3% per second for 6s.'},
      {id:'overcharge',name:'Overcharge',icon:'⚡',cost:20,cd:20,range:0,needTarget:false,needPet:true,kind:'petbuff',dmg:1.3,hp:0.2,spd:0.85,dur:180,desc:'Pet buff (3 min): your bot deals 30% more damage, attacks faster and gets 20% more health.'},
      {id:'shockdart',name:'Shock Dart',icon:'🎯',cost:16,cd:7,range:22,needTarget:true,kind:'nuke',mult:1.4,stun:1.5,color:0xffa040,desc:'140% damage and a 1.5s stun.'}]},
  wild:{name:'Wildshifter',role:'Shapeshifter / Survivalist',color:0x5a7a3a,accent:0x2e3a1c,visor:0xc8f060,hpMul:1.05,enMul:1.1,dmgSkill:'wpn',
    attrs:{str:9,agi:12,sta:11,int:8,psy:9,sen:11},innate:{wpn:4,weave:4,treat:2},cost:{str:2,agi:1,sta:2,int:3,psy:2,sen:2,wpn:1,weave:2,treat:2,body:2,pool:2,evade:2},
    desc:'A dune-wise hunter who learns the shapes of Kessra\'s beasts. Bow or rifle, light or medium armour, self-heals, and temporary Morphs learned from Weave Disks: Dune Wolf, Glass Lizard and, deep in Vault Theta-9, the Sand Drake.',
    basic:{id:'basic',name:'Hunting Bow',icon:'🏹',cost:0,cd:1.0,range:24,mult:1.0,proj:0x9adf5a},
    abilities:[
      {id:'thornvolley',name:'Thorn Volley',icon:'🌵',cost:16,cd:3,range:24,needTarget:true,kind:'nuke',mult:1.8,color:0x9adf5a,desc:'A volley of Vyre-hardened thorns for 180% damage.'},
      {id:'mossmend',name:'Mossmend',icon:'🌿',cost:22,cd:10,range:0,needTarget:false,kind:'heal',pct:0.25,desc:'Heal yourself for 25% of max health (more with Treatment).'},
      {id:'bramble',name:'Bramble Snare',icon:'🪴',cost:16,cd:10,range:22,needTarget:true,kind:'nuke',mult:0.6,root:5,color:0x6a9a3a,desc:'Roots the target in thornweed for 5s and deals 60% damage.'},
      {id:'pathfinder',name:'Pathfinder\'s Instinct',icon:'🧭',cost:20,cd:5,range:0,buff:{dur:180,mods:L=>({run:30,sen:3+L,agi:3+L,wpn:5+L*2})},desc:'Self-buff (3 min): +30 Run Speed, plus Sense, Agility and Weapon Handling.'}]}
};
// Build K: seven new professions (data built by hoisted functions)
Object.assign(PROFS,newProfDefs());
/* Breeds (chosen at creation). mods = starting attributes, cap = multiplier on the trainable attribute cap, cost = skill-point cost change.
   Existing characters are Settlers (balanced, identical to the old rules). */
// tradeskill training costs per profession (Dronewrights are natural tinkerers)
{const TC={vanguard:[2,3],weaver:[3,2],mender:[2,1],flux:[3,2],runner:[2,2],wright:[1,1],wild:[2,2]};for(const k in PROFS){const c=TC[k]||[2,2];PROFS[k].cost.fab=PROFS[k].cost.fab||c[0];PROFS[k].cost.ia=PROFS[k].cost.ia||c[1];}}
// Run Speed per profession: cost per point, trainable cap multiplier and innate points (Glintrunner/Wildshifter best, Vanguard/Dronewright worst)
const RUNPROF={runner:{cost:1,cap:1.5,innate:6},wild:{cost:1,cap:1.5,innate:4},weaver:{cost:2,cap:1,innate:0},mender:{cost:2,cap:1,innate:0},flux:{cost:2,cap:1,innate:0},vanguard:{cost:3,cap:0.7,innate:0},wright:{cost:3,cap:0.7,innate:0},fist:{cost:1,cap:1.4,innate:4},shade:{cost:1,cap:1.4,innate:4},siege:{cost:3,cap:0.7,innate:0}};
for(const k in PROFS){const r=RUNPROF[k]||{cost:2,cap:1,innate:0};PROFS[k].cost.run=PROFS[k].cost.run||r.cost;PROFS[k].runCap=r.cap;if(r.innate)PROFS[k].innate.run=(PROFS[k].innate.run||0)+r.innate;}
const BREEDS={
  settler:{name:'Settler',tag:'Balanced',desc:'Frontier-born humans. No weak attributes, no standout ones.',mods:{},cap:{},cost:{},hp:1,en:1,h:1,w:1,skin:0xa87a58},
  dunebred:{name:'Dunebred',tag:'Brute',desc:'Heavy-boned desert stock. Huge Strength and Stamina caps, poor Weave aptitude.',mods:{str:3,sta:4,int:-3,psy:-3},cap:{str:1.5,sta:1.5,int:0.6,psy:0.6},cost:{str:-1,sta:-1,int:1,psy:1},run:3,hp:1.12,en:0.88,h:1.1,w:1.22,skin:0x6b4a32},
  vyrekin:{name:'Vyrekin',tag:'Caster',desc:'Born beside deep Vyre seams. Brilliant Intelligence and Psychic, frail bodies.',mods:{int:4,psy:4,str:-3,sta:-3},cap:{int:1.5,psy:1.5,str:0.6,sta:0.6},cost:{int:-1,psy:-1,str:1,sta:1,run:1},run:-2,hp:0.9,en:1.15,h:1.08,w:0.86,skin:0x8fa6d8},
  glassborn:{name:'Glassborn',tag:'Agile',desc:'Small, wiry salt-flat nomads. Fast hands and sharp eyes, low Strength and Stamina.',mods:{agi:4,sen:3,sta:-2,str:-2},cap:{agi:1.5,sen:1.5,sta:0.75,str:0.75},cost:{agi:-1,sen:-1,run:-1},run:5,hp:0.95,en:1,h:0.9,w:0.92,skin:0x9ad8c0}
};
const breedOf=c=>BREEDS[(c&&c.breed)]||BREEDS.settler;
/* ---------------- Weave library (nano programs) ----------------
  Every castable ability is a Weave. Starters (tier 1) are known from creation; higher ones are learned from Weave Disks.
  Data-driven: add entries with any lvl (past 10 too). line = upgrade family (higher tier replaces lower in slots). kind = generic effect handler. */
function wreq(prof,lvl){{const k=wreqK(prof,lvl);if(k)return k;}
  if(prof==='flux')return [{s:'weave',v:Math.round(10+lvl*6.5)},{s:'int',v:Math.round(10+lvl*1.5)}];
  if(prof==='weaver')return [{s:'weave',v:Math.round(10+lvl*6.5)},{s:'psy',v:Math.round(10+lvl*1.5)}];
  if(prof==='vanguard')return [{s:'weave',v:Math.round(2+lvl*1.5)},{s:'wpn',v:8+lvl*5}];
  if(prof==='mender')return [{s:'weave',v:6+lvl*3},{s:'treat',v:10+lvl*5}];
  if(prof==='runner')return [{s:'weave',v:Math.round(6+lvl*3.5)},{s:'agi',v:Math.round(10+lvl*1.8)}];
  if(prof==='wild')return [{s:'weave',v:Math.round(6+lvl*3.5)},{s:'sen',v:Math.round(10+lvl*1.6)}];
  if(prof==='wright')return [{s:'weave',v:Math.round(6+lvl*4)},{s:'int',v:Math.round(10+lvl*1.6)}];
  return [{s:'weave',v:4+lvl*3}];
}
const NEW_WEAVES=[
  // Fluxwright: stronger nuke lines + more AoE
  {id:'flare2',line:'flare',tier:2,prof:'flux',lvl:3,name:'Flux Lance II',icon:'🔥',cost:22,cd:1.6,range:26,needTarget:true,kind:'nuke',mult:2.6,color:0xffb347,desc:'Fast nuke for 260% damage.'},
  {id:'scorch',line:'scorch',tier:1,prof:'flux',lvl:4,name:'Scorch Field',icon:'♨️',cost:45,cd:14,range:24,needTarget:true,kind:'field',mult:0.6,radius:6,dur:8,color:0xff6a1a,desc:'AoE: ignites the ground at the target for 60% damage per second to everything in a 6m field for 8s.'},
  {id:'sunder2',line:'sunder',tier:2,prof:'flux',lvl:5,name:'Sunder Spike II',icon:'☄️',cost:60,cd:7,range:26,needTarget:true,kind:'nuke',mult:6.2,color:0xff4a1a,sfx:'boom',desc:'Massive nuke for 620% damage.'},
  {id:'cone',line:'cone',tier:1,prof:'flux',lvl:6,name:'Cinder Cone',icon:'🔺',cost:50,cd:9,range:12,needTarget:false,kind:'cone',mult:2.8,angle:1.3,color:0xff8a2a,desc:'AoE: frontal blast for 280% damage to everything in a 12m cone ahead of you.'},
  {id:'nova2',line:'nova',tier:2,prof:'flux',lvl:7,name:'Cinder Nova II',icon:'🌋',cost:60,cd:10,range:24,needTarget:true,kind:'aoeT',mult:3.0,radius:8,color:0xff7a2a,desc:'AoE: detonates on the target for 300% damage to everything within 8m.'},
  {id:'overclock2',line:'overclock',tier:2,prof:'flux',lvl:8,name:'Overclock Cortex II',icon:'⚙️',cost:45,cd:5,range:0,buff:{dur:240,mods:L=>({weave:18+L*4,int:6+L,psy:6+L})},desc:'Self-buff (4 min): huge Weave Craft boost plus Intelligence and Psychic.'},
  {id:'starfall',line:'starfall',tier:1,prof:'flux',lvl:9,name:'Starfall Barrage',icon:'🌠',cost:85,cd:18,range:26,needTarget:true,kind:'barrage',waves:3,gap:0.6,delay:0.3,mult:1.7,radius:8,color:0xffe95a,desc:'AoE: three waves of falling Vyre on the target area, each hitting everything within 8m for 170%.'},
  {id:'flare3',line:'flare',tier:3,prof:'flux',lvl:10,name:'Flux Lance III',icon:'🔥',cost:30,cd:1.6,range:28,needTarget:true,kind:'nuke',mult:3.4,color:0xffd25a,desc:'Fast nuke for 340% damage.'},
  // Vyreweaver: control and hexes
  {id:'arc2',line:'arc',tier:2,prof:'weaver',lvl:3,name:'Arc Lance II',icon:'⚡',cost:26,cd:2.5,range:24,needTarget:true,kind:'nuke',mult:2.5,color:0xa9fbff,desc:'Lance of Vyre for 250% damage.'},
  {id:'leech2',line:'leech',tier:2,prof:'weaver',lvl:5,name:'Leech Weave II',icon:'🌀',cost:18,cd:8,range:24,needTarget:true,kind:'dot',mult:1.1,dur:8,en:5,color:0xb46bff,desc:'110% damage per second for 8s, returning 5 energy per tick.'},
  {id:'stasis2',line:'stasis',tier:2,prof:'weaver',lvl:6,name:'Stasis Bloom II',icon:'❄️',cost:40,cd:14,range:24,needTarget:true,kind:'aoeT',mult:1.8,radius:8,root:6,color:0x9fdfff,desc:'AoE: 180% damage within 8m of the target and roots them for 6s.'},
  {id:'hex2',line:'hex',tier:2,prof:'weaver',lvl:7,name:'Withering Hex',icon:'☠️',cost:28,cd:12,range:24,needTarget:true,kind:'hex',dur:15,amp:1.45,weak:0.5,color:0xb02bff,desc:'For 15s the target takes 45% more damage and deals 50% less.'},
  {id:'lattice2',line:'lattice',tier:2,prof:'weaver',lvl:8,name:'Mind Lattice II',icon:'🔮',cost:40,cd:5,range:0,buff:{dur:240,mods:L=>({int:6+L,psy:6+L,weave:12+L*3,treat:8+L*2})},desc:'Self-buff (4 min): + Intelligence, Psychic, Weave Craft, Treatment.'},
  {id:'storm',line:'storm',tier:1,prof:'weaver',lvl:9,name:'Lattice Storm',icon:'🌩️',cost:70,cd:16,range:24,needTarget:true,kind:'aoeT',mult:1.6,radius:7,hexDur:8,amp:1.3,weak:0.65,color:0x8a5bff,desc:'AoE: 160% damage within 7m of the target, and hexes everything hit for 8s.'},
  // Vanguard
  {id:'breach2',line:'breach',tier:2,prof:'vanguard',lvl:3,name:'Breach Round II',icon:'🎯',cost:40,cd:10,range:26,needTarget:true,kind:'nuke',mult:4.5,color:0xff7a3a,sfx:'boom',desc:'A heavy round for 450% damage.'},
  {id:'suppress',line:'suppress',tier:1,prof:'vanguard',lvl:4,name:'Suppressing Fire',icon:'🔫',cost:30,cd:8,range:14,needTarget:false,kind:'cone',mult:1.8,angle:1.05,root:2,color:0xffe08a,desc:'AoE: sweeps a 14m cone ahead for 180% damage and pins targets for 2s.'},
  {id:'scatter2',line:'scatter',tier:2,prof:'vanguard',lvl:5,name:'Scatter Burst II',icon:'💥',cost:30,cd:6,range:9,needTarget:false,kind:'aoeSelf',mult:2.2,radius:9,color:0xffb347,desc:'AoE: blasts every enemy within 9m for 220% damage.'},
  {id:'bulwark2',line:'bulwark',tier:2,prof:'vanguard',lvl:7,name:'Bulwark II',icon:'🛡️',cost:35,cd:20,range:0,needTarget:false,kind:'dr',amt:0.65,dur:10,desc:'Take 65% less damage for 10s.'},
  {id:'drill2',line:'drill',tier:2,prof:'vanguard',lvl:8,name:'Drill Protocol II',icon:'🎖️',cost:40,cd:5,range:0,buff:{dur:240,mods:L=>({wpn:14+L*3,str:6+L,agi:6+L,body:8+L*2})},desc:'Self-buff (4 min): big Weapon Handling boost plus Strength, Agility, Body Dev.'},
  {id:'orbital',line:'orbital',tier:1,prof:'vanguard',lvl:9,name:'Orbital Mark',icon:'🛰️',cost:60,cd:16,range:30,needTarget:true,kind:'barrage',waves:1,delay:1.2,gap:0,mult:3.5,radius:7,color:0xff5a3a,desc:'AoE: marks the target, and 1.2s later a Combine strike hits everything within 7m for 350%.'},
  // Mender
  {id:'mend2',line:'mend',tier:2,prof:'mender',lvl:3,name:'Mend II',icon:'✚',cost:30,cd:5,range:0,needTarget:false,kind:'heal',pct:0.45,desc:'Heal yourself for 45% of max health (more with Treatment).'},
  {id:'spike2',line:'spike',tier:2,prof:'mender',lvl:5,name:'Neural Spike II',icon:'✴️',cost:28,cd:9,range:22,needTarget:true,kind:'nuke',mult:2.4,stun:4,color:0xffe95a,desc:'240% damage, and stuns the target for 4s.'},
  {id:'purge',line:'purge',tier:1,prof:'mender',lvl:6,name:'Purge Pulse',icon:'💠',cost:40,cd:12,range:8,needTarget:false,kind:'aoeSelf',mult:1.6,radius:8,heal:0.15,color:0x6dff8a,desc:'AoE: a pulse around you for 160% damage to enemies within 8m, healing you for 15%.'},
  {id:'renew2',line:'renew',tier:2,prof:'mender',lvl:7,name:'Renewal Field II',icon:'❋',cost:40,cd:18,range:0,needTarget:false,kind:'hot',pct:0.06,dur:10,desc:'Heal 6% of max health every second for 10s.'},
  {id:'hands2',line:'hands',tier:2,prof:'mender',lvl:8,name:'Steady Hands II',icon:'🩺',cost:40,cd:5,range:0,buff:{dur:240,mods:L=>({treat:16+L*4,agi:6+L,int:6+L})},desc:'Self-buff (4 min): huge Treatment boost plus Agility and Intelligence.'},
  {id:'lifelat',line:'lifelat',tier:1,prof:'mender',lvl:9,name:'Life Lattice',icon:'💖',cost:60,cd:30,range:0,needTarget:false,kind:'heal',pct:0.7,dr:0.5,dur:6,desc:'Heals 70% of max health and halves damage taken for 6s.'},
  // Wildshifter: outdoor Weaves + temporary Morphs (kind 'morph': see MORPHS). Morph disks are the class signature.
  {id:'morph_wolf',line:'morph_wolf',tier:1,prof:'wild',lvl:1,name:'Morph: Dune Wolf',icon:'🐺',cost:25,cd:90,range:0,needTarget:false,kind:'morph',morph:'wolf',reqx:[{s:'weave',v:8}],desc:'Morph (60s, 90s cooldown): become a Dune Wolf. +85 Run Speed and big melee damage, with Rending Bite, Pounce and Pack Howl. No normal Weaves or weapon swaps while morphed.'},
  {id:'thornvolley2',line:'thornvolley',tier:2,prof:'wild',lvl:3,name:'Thorn Volley II',icon:'🌵',cost:24,cd:3,range:24,needTarget:true,kind:'nuke',mult:2.5,color:0xb8f070,desc:'Thorn volley for 250% damage.'},
  {id:'sporecloud',line:'sporecloud',tier:1,prof:'wild',lvl:4,name:'Sporecloud',icon:'🍄',cost:36,cd:14,range:24,needTarget:true,kind:'field',mult:0.55,radius:6,dur:8,color:0x9adf5a,desc:'AoE: a choking spore cloud at the target, 55% damage per second to everything in 6m for 8s.'},
  {id:'morph_lizard',line:'morph_lizard',tier:1,prof:'wild',lvl:5,name:'Morph: Glass Lizard',icon:'🦎',cost:35,cd:120,range:0,needTarget:false,kind:'morph',morph:'lizard',desc:'Morph (75s, 120s cooldown): become a Glass Lizard. Huge Evasion, damage reduction and 3% health regeneration per second, with Tail Lash, Glass Spit and Shed Skin.'},
  {id:'mossmend2',line:'mossmend',tier:2,prof:'wild',lvl:6,name:'Mossmend II',icon:'🌿',cost:30,cd:10,range:0,needTarget:false,kind:'heal',pct:0.35,desc:'Heal yourself for 35% of max health.'},
  {id:'stampede',line:'stampede',tier:1,prof:'wild',lvl:7,name:'Stampede Call',icon:'🦬',cost:45,cd:16,range:12,needTarget:false,kind:'cone',mult:2.4,angle:1.2,root:2,color:0xc8a060,desc:'AoE: a phantom herd tramples a 12m cone ahead for 240% damage and pins enemies for 2s.'},
  {id:'pathfinder2',line:'pathfinder',tier:2,prof:'wild',lvl:8,name:'Pathfinder\'s Instinct II',icon:'🧭',cost:28,cd:5,range:0,buff:{dur:240,mods:L=>({run:45,sen:5+L,agi:5+L,wpn:9+L*2})},desc:'Self-buff (4 min): +45 Run Speed and bigger Sense, Agility and Weapon Handling.'},
  {id:'morph_drake',line:'morph_drake',tier:1,prof:'wild',lvl:9,excl:'vault',name:'Morph: Sand Drake',icon:'🐉',cost:50,cd:180,range:0,needTarget:false,kind:'morph',morph:'drake',desc:'Morph (60s, 180s cooldown): become a winged Sand Drake. Massive health and damage reduction, with Cinder Breath (AoE cone), Wing Buffet and Scale Ward. Only from Vault Theta-9.'},
  // Generic: any profession
  {id:'patch',line:'patch',tier:1,prof:'any',lvl:1,name:'Field Patch',icon:'🩹',cost:15,cd:12,range:0,needTarget:false,kind:'heal',pct:0.2,desc:'Minor heal: 20% of max health.'},
  {id:'sprint',line:'sprint',tier:1,prof:'any',lvl:2,name:'Sprint Weave',icon:'👟',cost:15,cd:30,range:0,buff:{dur:30,mods:()=>({run:70})},desc:'Self-buff (30s): +70 Run Speed (a big burst of speed).'},
  {id:'battery',line:'battery',tier:1,prof:'any',lvl:5,name:'Vyre Battery',icon:'🔋',cost:0,cd:60,range:0,needTarget:false,kind:'battery',pct:0.35,desc:'Restores 35% of your energy.'},
  // Glintrunner
  {id:'rattle2',line:'rattle',tier:2,prof:'runner',lvl:4,name:'Rattle Burst II',icon:'💨',cost:20,cd:4,range:20,needTarget:true,kind:'rattle',mult:0.95,shots:3,color:0x59c8ff,desc:'3 rapid shots for 95% damage each.'},
  {id:'tangle',line:'tangle',tier:1,prof:'runner',lvl:5,name:'Tanglefield',icon:'🕸️',cost:30,cd:16,range:22,needTarget:true,kind:'aoeT',mult:0.8,radius:7,root:5,color:0x59c8ff,desc:'AoE snare: 80% damage to everything within 7m of the target and roots them for 5s.'},
  {id:'patchloop2',line:'patchloop',tier:2,prof:'runner',lvl:6,name:'Patchloop II',icon:'➰',cost:26,cd:14,range:0,needTarget:false,kind:'hot',pct:0.07,dur:10,desc:'Heal 7% of max health every second for 10s.'},
  {id:'snarewire2',line:'snarewire',tier:2,prof:'runner',lvl:7,name:'Snarewire II',icon:'🪢',cost:22,cd:10,range:22,needTarget:true,kind:'nuke',mult:1.2,root:8,color:0x59c8ff,desc:'Roots the target for 8s and deals 120% damage.'},
  {id:'slipstream2',line:'slipstream',tier:2,prof:'runner',lvl:8,name:'Slipstream II',icon:'🌬️',cost:28,cd:5,range:0,buff:{dur:240,mods:L=>({run:85+L*2,agi:5+L,evade:12+L*2})},desc:'Self-buff (4 min): +85 Run Speed, plus big Agility and Evasion.'},
  {id:'rattle3',line:'rattle',tier:3,prof:'runner',lvl:9,name:'Rattle Storm',icon:'🌪️',cost:30,cd:4,range:20,needTarget:true,kind:'rattle',mult:1.1,shots:4,color:0x9fe8ff,desc:'4 rapid shots for 110% damage each.'},
  // Dronewright: bigger bots, better repairs and buffs, a taunt
  {id:'assemble2',line:'assemble',tier:2,prof:'wright',lvl:3,name:'Assemble: Brawler Frame',icon:'🦾',cost:40,cd:6,range:0,needTarget:false,kind:'summon',pet:'bot2',desc:'Builds a heavy melee Brawler Frame: 50% more health and 35% more damage than a Scrapper.'},
  {id:'patchdrone2',line:'patchdrone',tier:2,prof:'wright',lvl:5,name:'Patch Drone II',icon:'🛠️',cost:24,cd:6,range:0,needTarget:false,needPet:true,kind:'petheal',pct:0.5,hot:0.04,desc:'Repairs your bot for 50% of its health, plus 4% per second for 6s.'},
  {id:'taunt',line:'taunt',tier:1,prof:'wright',lvl:6,name:'Taunt Protocol',icon:'📢',cost:25,cd:15,range:0,needTarget:false,needPet:true,kind:'taunt',radius:10,dur:6,desc:'Your bot blares a decoy signal: every enemy within 10m attacks it for 6s, and it takes 25% less damage meanwhile.'},
  {id:'assemble3',line:'assemble',tier:3,prof:'wright',lvl:7,name:'Assemble: Siege Walker',icon:'🦿',cost:55,cd:6,range:0,needTarget:false,kind:'summon',pet:'bot3',desc:'Builds a long-range Siege Walker with a heavy cannon.'},
  {id:'overcharge2',line:'overcharge',tier:2,prof:'wright',lvl:8,name:'Overcharge II',icon:'⚡',cost:32,cd:20,range:0,needTarget:false,needPet:true,kind:'petbuff',dmg:1.5,hp:0.35,spd:0.75,dur:240,desc:'Pet buff (4 min): +50% bot damage, much faster attacks and 35% more health.'},
  {id:'assemble4',line:'assemble',tier:4,prof:'wright',lvl:10,name:'Assemble: Sentinel Warframe',icon:'🛸',cost:70,cd:6,range:0,needTarget:false,kind:'summon',pet:'bot4',desc:'Builds a hovering Sentinel Warframe: twin cannons that splash nearby enemies, and huge health.'},
  // Glintrunner signature (rare = ultra-rare drop only: never sold, never a mission reward). Twinkable: high Weave Craft + Agility.
  {id:'veil1',line:'veil',tier:1,prof:'runner',lvl:6,rare:true,name:'Shimmerveil',icon:'💠',cost:60,cd:30,range:0,reqx:[{s:'weave',v:45},{s:'agi',v:32}],buff:{dur:600,mods:L=>({evade:60+L*3,dr:10})},desc:'Signature self-buff (10 min): wraps you in a blue lattice. Huge Evasion and 10% damage reduction.'},
  {id:'veil2',line:'veil',tier:2,prof:'runner',lvl:10,rare:true,name:'Shimmerveil II',icon:'💠',cost:80,cd:30,range:0,reqx:[{s:'weave',v:80},{s:'agi',v:46}],buff:{dur:600,mods:L=>({evade:110+L*4,dr:18})},desc:'Signature self-buff (10 min): a brighter blue lattice. Massive Evasion and 18% damage reduction.'},
  // ---- Level 11-20 (Duskcrown): every profession gets two new ranks/abilities, learned from Weave Disks (world drops, missions, Farwatch) ----
  {id:'sunder3',line:'sunder',tier:3,prof:'flux',lvl:13,name:'Sunder Spike III',icon:'☄️',cost:78,cd:7,range:28,needTarget:true,kind:'nuke',mult:8.4,color:0xff3a1a,sfx:'boom',desc:'Colossal nuke for 840% damage.'},
  {id:'starfall2',line:'starfall',tier:2,prof:'flux',lvl:17,name:'Starfall Cascade',icon:'🌠',cost:110,cd:18,range:28,needTarget:true,kind:'barrage',waves:4,gap:0.55,delay:0.3,mult:2.1,radius:9,color:0xfff07a,desc:'AoE: four waves of falling Vyre on the target area, each hitting everything within 9m for 210%.'},
  {id:'arc3',line:'arc',tier:3,prof:'weaver',lvl:12,name:'Arc Lance III',icon:'⚡',cost:34,cd:2.5,range:26,needTarget:true,kind:'nuke',mult:3.4,color:0xc8fdff,desc:'Lance of Vyre for 340% damage.'},
  {id:'storm2',line:'storm',tier:2,prof:'weaver',lvl:16,name:'Lattice Tempest',icon:'🌩️',cost:90,cd:16,range:26,needTarget:true,kind:'aoeT',mult:2.3,radius:8,hexDur:10,amp:1.4,weak:0.6,color:0x9a6bff,desc:'AoE: 230% damage within 8m of the target, and hexes everything hit for 10s (+40% damage taken, -40% damage dealt).'},
  {id:'breach3',line:'breach',tier:3,prof:'vanguard',lvl:12,name:'Breach Round III',icon:'🎯',cost:52,cd:10,range:28,needTarget:true,kind:'nuke',mult:6.2,color:0xff6a2a,sfx:'boom',desc:'A siege round for 620% damage.'},
  {id:'orbital2',line:'orbital',tier:2,prof:'vanguard',lvl:17,name:'Orbital Lance',icon:'🛰️',cost:80,cd:16,range:32,needTarget:true,kind:'barrage',waves:2,delay:1.0,gap:0.7,mult:3.6,radius:8,color:0xff4a2a,desc:'AoE: two Combine strikes on the target area, each hitting everything within 8m for 360%.'},
  {id:'mend3',line:'mend',tier:3,prof:'mender',lvl:12,name:'Mend III',icon:'✚',cost:40,cd:5,range:0,needTarget:false,kind:'heal',pct:0.6,desc:'Heal yourself for 60% of max health (more with Treatment).'},
  {id:'purge2',line:'purge',tier:2,prof:'mender',lvl:16,name:'Purge Nova',icon:'💠',cost:55,cd:12,range:9,needTarget:false,kind:'aoeSelf',mult:2.4,radius:9,heal:0.25,color:0x6dff8a,desc:'AoE: a pulse around you for 240% damage to enemies within 9m, healing you for 25%.'},
  {id:'tangle2',line:'tangle',tier:2,prof:'runner',lvl:13,name:'Tanglestorm',icon:'🕸️',cost:40,cd:16,range:24,needTarget:true,kind:'aoeT',mult:1.3,radius:8,root:6,color:0x7fd8ff,desc:'AoE snare: 130% damage to everything within 8m of the target and roots them for 6s.'},
  {id:'rattle4',line:'rattle',tier:4,prof:'runner',lvl:18,name:'Rattle Tempest',icon:'🌪️',cost:40,cd:4,range:22,needTarget:true,kind:'rattle',mult:1.3,shots:5,color:0xc8f4ff,desc:'5 rapid shots for 130% damage each.'},
  {id:'thornvolley3',line:'thornvolley',tier:3,prof:'wild',lvl:12,name:'Thorn Volley III',icon:'🌵',cost:32,cd:3,range:26,needTarget:true,kind:'nuke',mult:3.4,color:0xd0ff80,desc:'Thorn volley for 340% damage.'},
  {id:'stampede2',line:'stampede',tier:2,prof:'wild',lvl:17,name:'Thunder Stampede',icon:'🦬',cost:60,cd:16,range:14,needTarget:false,kind:'cone',mult:3.3,angle:1.3,root:3,color:0xd8b070,desc:'AoE: a phantom herd tramples a 14m cone ahead for 330% damage and pins enemies for 3s.'},
  {id:'overcharge3',line:'overcharge',tier:3,prof:'wright',lvl:13,name:'Overcharge III',icon:'⚡',cost:40,cd:20,range:0,needTarget:false,needPet:true,kind:'petbuff',dmg:1.8,hp:0.5,spd:0.7,dur:240,desc:'Pet buff (4 min): +80% bot damage, much faster attacks and 50% more health.'},
  {id:'patchdrone3',line:'patchdrone',tier:3,prof:'wright',lvl:17,name:'Patch Swarm',icon:'🛠️',cost:34,cd:6,range:0,needTarget:false,needPet:true,kind:'petheal',pct:0.7,hot:0.06,desc:'Repairs your bot for 70% of its health, plus 6% per second for 6s.'},
  {id:'battery2',line:'battery',tier:2,prof:'any',lvl:15,name:'Vyre Battery II',icon:'🔋',cost:0,cd:60,range:0,needTarget:false,kind:'battery',pct:0.55,desc:'Restores 55% of your energy.'},
  // ---- Level 21-30 (Rimefall, Build C): two more ranks/abilities per profession, plus a third Vyre Battery ----
  {id:'sunder4',line:'sunder',tier:4,prof:'flux',lvl:21,name:'Sunder Spike IV',icon:'☄️',cost:96,cd:7,range:28,needTarget:true,kind:'nuke',mult:10.6,color:0xff2a10,sfx:'boom',desc:'Cataclysmic nuke for 1060% damage.'},
  {id:'starfall3',line:'starfall',tier:3,prof:'flux',lvl:26,name:'Starfall Deluge',icon:'🌠',cost:132,cd:18,range:28,needTarget:true,kind:'barrage',waves:5,gap:0.5,delay:0.3,mult:2.5,radius:10,color:0xfff07a,desc:'AoE: five waves of falling Vyre on the target area, each hitting everything within 10m for 250%.'},
  {id:'arc4',line:'arc',tier:4,prof:'weaver',lvl:21,name:'Arc Lance IV',icon:'⚡',cost:42,cd:2.5,range:26,needTarget:true,kind:'nuke',mult:4.3,color:0xe0feff,desc:'Searing lance of Vyre for 430% damage.'},
  {id:'storm3',line:'storm',tier:3,prof:'weaver',lvl:25,name:'Lattice Maelstrom',icon:'🌩️',cost:110,cd:16,range:26,needTarget:true,kind:'aoeT',mult:2.9,radius:9,hexDur:12,amp:1.45,weak:0.6,color:0x8a5bff,desc:'AoE: 290% damage within 9m of the target, and hexes everything hit for 12s (+45% damage taken, -40% damage dealt).'},
  {id:'breach4',line:'breach',tier:4,prof:'vanguard',lvl:22,name:'Breach Round IV',icon:'🎯',cost:64,cd:10,range:28,needTarget:true,kind:'nuke',mult:7.8,color:0xff5a1a,sfx:'boom',desc:'A fortress-breaker round for 780% damage.'},
  {id:'orbital3',line:'orbital',tier:3,prof:'vanguard',lvl:27,name:'Orbital Barrage',icon:'🛰️',cost:98,cd:16,range:32,needTarget:true,kind:'barrage',waves:3,delay:1.0,gap:0.6,mult:4.2,radius:9,color:0xff4a2a,desc:'AoE: three Combine strikes on the target area, each hitting everything within 9m for 420%.'},
  {id:'mend4',line:'mend',tier:4,prof:'mender',lvl:21,name:'Mend IV',icon:'✚',cost:48,cd:5,range:0,needTarget:false,kind:'heal',pct:0.75,desc:'Heal yourself for 75% of max health (more with Treatment).'},
  {id:'purge3',line:'purge',tier:3,prof:'mender',lvl:26,name:'Purge Tide',icon:'💠',cost:68,cd:12,range:10,needTarget:false,kind:'aoeSelf',mult:3.0,radius:10,heal:0.35,color:0x6dff8a,desc:'AoE: a tide around you for 300% damage to enemies within 10m, healing you for 35%.'},
  {id:'tangle3',line:'tangle',tier:3,prof:'runner',lvl:22,name:'Tangle Vortex',icon:'🕸️',cost:50,cd:16,range:24,needTarget:true,kind:'aoeT',mult:1.7,radius:9,root:7,color:0x7fd8ff,desc:'AoE snare: 170% damage to everything within 9m of the target and roots them for 7s.'},
  {id:'rattle5',line:'rattle',tier:5,prof:'runner',lvl:27,name:'Rattle Cyclone',icon:'🌪️',cost:48,cd:4,range:22,needTarget:true,kind:'rattle',mult:1.55,shots:6,color:0xd8f8ff,desc:'6 rapid shots for 155% damage each.'},
  {id:'thornvolley4',line:'thornvolley',tier:4,prof:'wild',lvl:21,name:'Thorn Volley IV',icon:'🌵',cost:40,cd:3,range:26,needTarget:true,kind:'nuke',mult:4.3,color:0xe0ff90,desc:'Barbed volley for 430% damage.'},
  {id:'stampede3',line:'stampede',tier:3,prof:'wild',lvl:26,name:'Glacier Stampede',icon:'🦬',cost:74,cd:16,range:15,needTarget:false,kind:'cone',mult:4.1,angle:1.35,root:3.5,color:0xc8e8ff,desc:'AoE: a phantom ice herd tramples a 15m cone ahead for 410% damage and pins enemies for 3.5s.'},
  {id:'overcharge4',line:'overcharge',tier:4,prof:'wright',lvl:22,name:'Overcharge IV',icon:'⚡',cost:48,cd:20,range:0,needTarget:false,needPet:true,kind:'petbuff',dmg:2.2,hp:0.7,spd:0.65,dur:240,desc:'Pet buff (4 min): +120% bot damage, much faster attacks and 70% more health.'},
  {id:'patchdrone4',line:'patchdrone',tier:4,prof:'wright',lvl:27,name:'Patch Legion',icon:'🛠️',cost:40,cd:6,range:0,needTarget:false,needPet:true,kind:'petheal',pct:0.85,hot:0.08,desc:'Repairs your bot for 85% of its health, plus 8% per second for 6s.'},
  {id:'battery3',line:'battery',tier:3,prof:'any',lvl:24,name:'Vyre Battery III',icon:'🔋',cost:0,cd:60,range:0,needTarget:false,kind:'battery',pct:0.7,desc:'Restores 70% of your energy.'},
  // Dungeon-exclusive (excl = dungeon id): never in world drops, missions or the trader. Only from that dungeon's final boss.
  {id:'shardstorm',line:'shardstorm',tier:1,prof:'any',lvl:6,excl:'mine',name:'Shardstorm',icon:'💎',cost:45,cd:12,range:7,needTarget:false,kind:'aoeSelf',mult:2.0,radius:7,color:0x5ff2ff,desc:'AoE: erupts Vyre shards around you for 200% damage to everything within 7m.'},
  {id:'silencechord',line:'silencechord',tier:1,prof:'any',lvl:16,excl:'choir',name:'Silencing Chord',icon:'🔔',cost:60,cd:14,range:9,needTarget:false,kind:'aoeSelf',mult:2.6,radius:9,root:3,color:0xb46bff,desc:'AoE: a chord of silence for 260% damage to everything within 9m, rooting them for 3s. Only from The Choir Below.'},
  {id:'stillfrost',line:'stillfrost',tier:1,prof:'any',lvl:26,excl:'stillvault',name:'Stillfrost Requiem',icon:'❄️',cost:80,cd:15,range:10,needTarget:false,kind:'aoeSelf',mult:3.4,radius:10,root:4,color:0x9fe8ff,desc:'AoE: a wave of absolute cold for 340% damage to everything within 10m, freezing them in place for 4s. Only from The Stillvault.'},
  {id:'aegis',line:'aegis',tier:1,prof:'any',lvl:10,excl:'vault',name:'Aegis Lattice',icon:'🔰',cost:50,cd:45,range:0,needTarget:false,kind:'heal',pct:0.3,dr:0.6,dur:10,desc:'Heals 30% of max health and cuts damage taken by 60% for 10s.'}
];
const WEAVES={};
for(const pk in PROFS)PROFS[pk].abilities.forEach(a=>{a.prof=pk;a.line=a.id;a.tier=1;a.lvl=1;a.starter=true;a.req=[];WEAVES[a.id]=a;});
newProfWeaves().forEach(w=>{if(WEAVES[w.id]||NEW_WEAVES.some(x=>x.id===w.id))throw new Error('weave id clash '+w.id);NEW_WEAVES.push(w);});
NEW_WEAVES.forEach(w=>{w.req=w.reqx||wreq(w.prof,w.lvl);WEAVES[w.id]=w;});
/* Build J: Lv 31-50 ranks, generated from each profession's two Rimefall lines (data: [line, [names...], [levels...]]) */
(function(){const XW=[['sunder',['Sunder Spike V','Sunder Spike VI'],[31,41]],['starfall',['Starfall Torrent','Starfall Apocalypse'],[36,46]],['arc',['Arc Lance V','Arc Lance VI'],[31,41]],['storm',['Lattice Cataclysm','Lattice Singularity'],[35,45]],
  ['breach',['Breach Round V','Breach Round VI'],[32,42]],['orbital',['Orbital Bombardment','Orbital Annihilation'],[37,47]],['mend',['Mend V','Mend VI'],[31,41]],['purge',['Purge Surge','Purge Deluge'],[36,46]],
  ['tangle',['Tangle Tempest','Tangle Maelstrom'],[32,42]],['rattle',['Rattle Squall','Rattle Hurricane'],[37,47]],['thornvolley',['Thorn Volley V','Thorn Volley VI'],[31,41]],['stampede',['Ember Stampede','Obsidian Stampede'],[36,46]],
  ['overcharge',['Overcharge V','Overcharge VI'],[32,42]],['patchdrone',['Patch Host','Patch Armada'],[37,47]],['battery',['Vyre Battery IV','Vyre Battery V'],[34,44]]];
  const pc=v=>Math.round(v*100)+'%';
  for(const [line,names,lvs] of XW){let prev=Object.values(WEAVES).filter(w=>w.line===line&&!w.excl).sort((a,b)=>b.tier-a.tier)[0];if(!prev)continue;
    names.forEach((nm,i)=>{const w=Object.assign({},prev);delete w.req;w.tier=prev.tier+1;w.id=line+w.tier;w.lvl=lvs[i];w.name=nm;let d=prev.desc;const rep=(k,f)=>{if(w[k]==null)return;const o=w[k];w[k]=f(o);d=d.split(pc(o)).join(pc(w[k]));};
      rep('mult',v=>Math.round(v*1.22*100)/100);rep('pct',v=>Math.min(0.95,Math.round((v+0.08)*100)/100));rep('heal',v=>Math.min(0.6,Math.round((v+0.05)*100)/100));rep('hot',v=>Math.round((v+0.01)*100)/100);
      if(w.kind==='petbuff'){const od=w.dmg,oh=w.hp;w.dmg=Math.round((od+0.35)*100)/100;w.hp=Math.round((oh+0.15)*100)/100;d=d.replace('+'+Math.round((od-1)*100)+'% bot damage','+'+Math.round((w.dmg-1)*100)+'% bot damage').replace(Math.round(oh*100)+'% more health',Math.round(w.hp*100)+'% more health');}
      if(w.radius){const o=w.radius;w.radius=Math.min(12,o+0.5);d=d.split(o+'m').join(w.radius+'m');}if(w.root){w.root=Math.round((w.root+0.5)*10)/10;}
      if(w.cost)w.cost=Math.round(w.cost*1.18);if(line==='stampede')d=d.replace(/phantom \w+ herd/,'phantom '+nm.split(' ')[0].toLowerCase()+' herd');w.desc=d;w.req=wreq(w.prof,w.lvl);WEAVES[w.id]=w;prev=w;});}})();
const starterIds=pk=>PROFS[pk].abilities.map(a=>a.id);
const NSLOTS=6;
const profName=p=>p==='any'?'Any profession':PROFS[p].name;
function diskLvlReq(w){return Math.max(1,w.lvl-2);}
function genDisk(wid){const w=WEAVES[wid];if(!w)return null;const r=w.rare?6:w.lvl>=7?3:w.lvl>=4?2:1;
  return {id:uid(),kind:'disk',slot:'disk',wid,r,lvl:w.lvl,prof:w.prof,name:'Weave Disk: '+w.name,bonus:[],req:[{s:'level',v:diskLvlReq(w)}].concat(w.req),value:Math.round(15+w.lvl*w.lvl*4)};}
function genDiskForLevel(lv){const pool=Object.values(WEAVES).filter(w=>!w.starter&&!w.mab&&!w.excl&&!w.rare&&w.lvl<=lv+2&&w.lvl>=lv-4);if(!pool.length)return null;
  const mine=pool.filter(w=>w.prof===P.prof||w.prof==='any');const src=mine.length&&Math.random()<0.75?mine:pool;return genDisk(pick(src).id);}
const CONSUM={
  focus:{name:'Focus Stim',icon:'🧪',dur:180,mods:L=>({treat:10+L*2,int:3}),price:L=>14+L*4,desc:'+Treatment and +3 Intelligence for 3 min'},
  tonic:{name:'Neuro Tonic',icon:'🧠',dur:180,mods:L=>({int:4+L,psy:4+L,weave:6+L}),price:L=>14+L*4,desc:'+Intelligence, +Psychic and +Weave Craft for 3 min'},
  grip:{name:'Grip Gel',icon:'🖐️',dur:180,mods:L=>({agi:4+L,sen:2+L,wpn:8+L*2}),price:L=>14+L*4,desc:'+Agility, +Sense and +Weapon Handling for 3 min'},
  artisan:{name:'Artisan Draught',icon:'🛠️',dur:180,mods:L=>({fab:8+L*2,ia:8+L*2,int:2}),price:L=>16+L*4,desc:'+Fabrication and +Implant Assembly for 3 min (twink your tradeskills)'},
  stride:{name:'Strider Gel',icon:'🏃',dur:180,mods:L=>({run:35+L*4,agi:2}),price:L=>14+L*4,desc:'+Run Speed and +2 Agility for 3 min (twink your speed)'},
  brew:{name:'Iron Brew',icon:'🍺',dur:180,mods:L=>({str:4+L,sta:4+L,body:8+L*2}),price:L=>14+L*4,desc:'+Strength, +Stamina and +Body Dev for 3 min'}
};
const ETYPES={
  skitter:{name:'Sand Skitter',hp:30,dmg:5,atkCd:1.2,range:2.0,speed:6.4,aggro:13,xp:1.0,ranged:false,hitR:1.0,h:1.1,build:buildSkitter,scale:1},
  raider:{name:'Dust Raider',hp:46,dmg:7,atkCd:1.8,range:17,speed:4.8,aggro:18,xp:1.25,ranged:true,hitR:0.7,h:1.9,build:buildRaider,scale:1},
  mauler:{name:'Dune Mauler',slow:{mul:0.7,dur:3,name:'Crippled'},hp:95,dmg:14,atkCd:2.2,range:3.2,speed:4.4,aggro:14,xp:1.6,ranged:false,hitR:1.6,h:2.6,build:buildMauler,scale:1.15}
};
const RAR=[{n:'Common',c:'#cfcfcf',h:0xcfcfcf,m:1},{n:'Uncommon',c:'#4fe36a',h:0x4fe36a,m:1.3},{n:'Rare',c:'#4aa3ff',h:0x4aa3ff,m:1.65},{n:'Epic',c:'#c86bff',h:0xc86bff,m:2.1},
  // dungeon-exclusive tiers: never rolled by rollRarity, only built by makeUnique() from a dungeon loot table
  {n:'Legendary',c:'#ff9a2a',h:0xff9a2a,m:2.45},{n:'Relic',c:'#ff4f5e',h:0xff4f5e,m:2.8},
  {n:'Mythic',c:'#59c8ff',h:0x59c8ff,m:3},
  // Lv 12+ world tier (index 7, ranked between Epic and Legendary): rare drops in the Duskcrown Highlands, its dynas and the Choir dungeon; 4 bonuses
  {n:'Ascendant',c:'#ffe066',h:0xffe066,m:2.3},
  // index 8: team-content only (team dungeon bosses), the best gear tier; 6 bonuses
  {n:'Paragon',c:'#ff5fd2',h:0xff5fd2,m:3.1},
  // index 9 (Build N): raid-only, The Sunless Throne; the top tier
  {n:'Sunforged',c:'#ffd27a',h:0xffd27a,m:3.6}];// Mythic: ultra-rare Weave Disks (Shimmerveil)
// Names: [condition] [type/family prefix] <type or slot noun> [suffix on Rare+]. Nouns are unique per weapon type / armour slot+family, so names always fit the item.
const PRE=['Dusty','Scavenged','Worn','Tuned','Salvaged','Patched','Reach-made','Scoured'];
const SUF=['of the Reach','of Kessra','of the Dunes','of Glass','of Embers','of the Long Night','Mk II','Mk III'];
/* Weapon types: sk = skill required to wield; aff = professions that get full damage (others -20%); dm = damage mult; cd = attack-speed mult; rng = basic attack range */
const WTYPES={
  rifle:{n:'Rifle',ic:'🔫',sk:'wpn',aff:['vanguard','wild','siege'],dm:1.0,cd:1.0,rng:24,proj:0xffe08a,pre:['Hollowpoint','Longshot','Scrapyard','Combine-issue','Sunscorch'],names:['Carbine','Rail Rifle','Repeater','Longarm','Marksman Rifle'],mesh:{l:0.78,w:0.12,c:0x2a2a2a}},
  shotgun:{n:'Scattergun',ic:'💥',sk:'wpn',aff:['vanguard'],dm:1.45,cd:1.3,rng:13,proj:0xffb347,pre:['Pump-action','Riot-grade','Scrapyard','Ashborn','Sawn'],names:['Scattergun','Breacher','Riot Scattergun','Slug Scattergun','Trench Breacher'],mesh:{l:0.58,w:0.2,c:0x4a3524}},
  pistol:{n:'Pistol',ic:'🔹',sk:'wpn',aff:['mender','runner','wright','harm','exact'],dm:0.8,cd:0.78,rng:20,proj:0x6dff8a,pre:['Field','Medic\'s','Combine-issue','Quickdraw','Scrapyard'],names:['Pulse Pistol','Suture Pistol','Sidearm','Needle Pistol','Holdout Pistol'],mesh:{l:0.34,w:0.11,c:0x3a4a4a}},
  blade:{n:'Blade',ic:'🗡️',sk:'wpn',aff:['vanguard','mender','runner','shade'],dm:1.4,cd:0.95,rng:3.6,melee:true,pre:['Glassed','Honed','Ashborn','Sunscorch','Drifter\'s'],names:['Machete','Vibro-Blade','Glass Sabre','Cleaver','Dune Knife'],mesh:{l:1.0,w:0.07,c:0xd8e0e8,glow:0}},
  smg:{n:'Twin Pistols',ic:'🔫',sk:'wpn',aff:['runner'],dm:0.62,cd:0.6,rng:20,proj:0x59c8ff,pre:['Quickdraw','Smuggler\'s','Twinned','Scrapyard','Ricochet'],names:['Twin Pistols','Pistol Pair','Duelling Pistols','Machine Pistols'],mesh:{l:0.36,w:0.13,c:0x2a4a50}},
  bow:{n:'Bow',ic:'🏹',sk:'wpn',aff:['wild'],dm:1.05,cd:1.0,rng:25,proj:0x9adf5a,pre:['Sinew-strung','Dunewood','Glass-tipped','Hunter\'s','Windcut'],names:['Longbow','Recurve','Hunting Bow','Shortbow','Horn Bow'],mesh:{l:0.95,w:0.06,c:0x6b4a2a}},
  rod:{n:'Focus Rod',ic:'🪄',sk:'weave',aff:['weaver','flux','wright','binder','mind','harm','exact'],dm:1.0,cd:1.0,rng:24,proj:0x5ff2ff,pre:['Resonant','Lattice-tuned','Vyre-forged','Mirage','Prismatic'],names:['Focus Rod','Lattice Wand','Prism Rod','Vyre Wand','Channel Rod'],mesh:{l:0.95,w:0.08,c:0x5ff2ff,glow:1}},
  emitter:{n:'Flux Emitter',ic:'🔆',sk:'weave',aff:['flux'],dm:1.15,cd:1.1,rng:21,proj:0xffb347,pre:['Overcharged','Vyre-forged','Searing','Prototype','Unstable'],names:['Flux Emitter','Arc Emitter','Cinder Emitter','Lance Emitter','Flux Coil'],mesh:{l:0.5,w:0.19,c:0xff8a2a,glow:1}},
  fist:{n:'Strikers',ic:'👊',sk:'wpn',aff:['fist'],dm:0.78,cd:0.62,rng:3.4,melee:true,pre:['Iron-bound','Duneworn','Kinetic','Ashborn','Stillwater'],names:['Strikers','Knucklebands','Palm Coils','Kinetic Bands','Grip Spurs'],mesh:{l:0.22,w:0.2,c:0x8a5a3a}},
  cannon:{n:'Hand Cannon',ic:'🧨',sk:'wpn',aff:['siege'],dm:1.55,cd:1.35,rng:20,proj:0xffa040,pre:['Siege-grade','Thunder','Scrapyard','Rampart','Combine-issue'],names:['Hand Cannon','Autocannon','Rotary Gun','Mortar Tube','Railgun'],mesh:{l:0.9,w:0.24,c:0x3a3a30}}
};
const PROF_WT={vanguard:'rifle',weaver:'rod',mender:'pistol',flux:'emitter',runner:'smg',wright:'pistol',wild:'bow',binder:'rod',mind:'rod',harm:'pistol',exact:'pistol',fist:'fist',shade:'blade',siege:'cannon'};
const wtAff=pk=>Object.keys(WTYPES).filter(k=>WTYPES[k].aff.includes(pk));
/* Armour: 5 slots (body keeps the old key 'armor' so old saves load), 3 families with different stat leanings */
const ASLOTS=['head','armor','hands','legs','feet'];
const GSLOTS=['weapon'].concat(ASLOTS);
const SLOTN={weapon:'Weapon',head:'Head',armor:'Body',hands:'Hands',legs:'Legs',feet:'Feet'};
const SLOTW={head:0.4,armor:1,hands:0.25,legs:0.5,feet:0.25};
const SLOTICON={weapon:'🔫',head:'⛑️',armor:'🦺',hands:'🧤',legs:'👖',feet:'🥾'};
const AFAM={
  light:{n:'Light',m:0.65,attr:'psy',aff:['weaver','flux','wild','binder','mind','exact'],lean:['int','psy','weave','pool','en','sen'],col:0x6b3fa0,
    pre:['Silk','Weaver\'s','Lattice','Gossamer','Drift'],names:{head:['Hood','Cowl','Circlet'],armor:['Robe','Duster','Vestment'],hands:['Wraps','Grips','Mitts'],legs:['Trousers','Leggings'],feet:['Slippers','Sandals']}},
  medium:{n:'Medium',m:1.0,attr:'agi',aff:['mender','vanguard','runner','wright','wild','harm','fist','shade','siege'],lean:['agi','sen','wpn','treat','crit','hp'],col:0x7a5a3a,
    pre:['Ranger','Scout','Sandrunner','Scaled','Leather'],names:{head:['Visor','Cap','Goggles'],armor:['Harness','Jacket','Brigandine'],hands:['Gloves','Bracers'],legs:['Chaps','Kilt','Breeches'],feet:['Boots','Striders']}},
  heavy:{n:'Heavy',m:1.35,attr:'str',aff:['vanguard','siege'],lean:['sta','str','body','hp','power','wpn'],col:0x6d7378,
    pre:['Bastion','Plated','Ironclad','Breaker','Bulwark'],names:{head:['Helm','Greathelm','Faceguard'],armor:['Plate Vest','Carapace','Combat Shell'],hands:['Gauntlets','Fists'],legs:['Greaves','Legplates'],feet:['Treads','Sabatons']}}
};
function gearName(it){const r=it.r||0;const parts=[];if(Math.random()<0.55)parts.push(pick(PRE));
  if(it.slot==='weapon'){const W=WTYPES[it.wt]||WTYPES.rifle;const nm=pick(W.names);const pr=pick(W.pre);if(Math.random()<0.7&&!nm.includes(pr.split('-')[0]))parts.push(pr);parts.push(nm);}
  else{const F=AFAM[it.fam||'medium'];parts.push(pick(F.pre));parts.push(pick(F.names[it.slot]||F.names.armor));}
  if(r>=2&&Math.random()<0.6)parts.push(pick(SUF));return parts.join(' ');}
const _wb=s=>new RegExp('(^|\\s)'+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s|$)');
// true when the name's noun matches the item's own weapon type / armour slot+family and no other type's noun appears
function nameFits(it){if(!it||it.kind!=='gear'||it.uniq||it.fac)return true;const n=it.name||'';
  if(it.slot==='weapon'){const W=WTYPES[it.wt];if(!W||!W.names.some(b=>_wb(b).test(n)))return false;
    return !Object.keys(WTYPES).some(k=>k!==it.wt&&WTYPES[k].names.some(b=>!W.names.includes(b)&&_wb(b).test(n)));}
  const F=AFAM[it.fam];if(!F||!F.names[it.slot]||!F.names[it.slot].some(b=>_wb(b).test(n))||!F.pre.some(p=>_wb(p).test(n)))return false;
  for(const fk in AFAM)for(const sl in AFAM[fk].names)if((fk!==it.fam||sl!==it.slot)&&AFAM[fk].names[sl].some(b=>_wb(b).test(n)))return false;
  for(const k in WTYPES)if(WTYPES[k].names.some(b=>_wb(b).test(n)))return false;return true;}
const PROF_FAM={vanguard:'heavy',weaver:'light',mender:'medium',flux:'light',runner:'medium',wright:'medium',wild:'medium',binder:'light',mind:'light',harm:'medium',exact:'light',fist:'medium',shade:'medium',siege:'heavy'};
const IMPSLOTS=['head','eyes','chest','arms','hands','legs','feet'];
const IMPDEF={head:{n:'Cortex',ic:'🧠',req:'int',pool:['int','psy','weave','pool']},eyes:{n:'Ocular',ic:'👁️',req:'sen',pool:['sen','int','wpn','treat']},
  chest:{n:'Thoracic',ic:'🫀',req:'sta',pool:['sta','body','psy','pool']},arms:{n:'Brachial',ic:'💪',req:'str',pool:['str','sta','wpn','body']},
  hands:{n:'Digital',ic:'✋',req:'agi',pool:['agi','wpn','treat','weave']},legs:{n:'Femoral',ic:'🦵',req:'sta',pool:['agi','sta','body','str','run']},
  feet:{n:'Plantar',ic:'🦶',req:'agi',pool:['agi','sen','treat','pool','run']}};
function rollRarity(boost){const r=Math.random()*100-(boost||0);return r<2?3:r<12?2:r<40?1:0;}
const ASC=7;// Ascendant rarity index
const rRank=r=>r===ASC?3.5:r===8?5.5:r===9?6.5:r;// ordering helper: Ascendant sits between Epic (3) and Legendary (4)
const rBon=r=>r===ASC?4:r===8?5:Math.min(r,3);// number of random bonuses
// Lv 12+ drops can roll Ascendant: ~0.6% base, more with boost (elites, dynas, the Choir)
function rollRarityL(lvl,boost){if(lvl>=12&&Math.random()<0.006*(1+(boost||0)/10))return ASC;return rollRarity(boost);}
const IMPQL_MAX=()=>MAXLVL*5;// implant QL cap follows the level cap (100 at Lv 20, 150 at Lv 30)
const impReq=(ql,slot)=>[{s:'treat',v:5+Math.round(ql*1.4)},{s:IMPDEF[slot].req,v:6+Math.round(ql*0.45)}];
function genImplant(ql,slot,rIdx){
  slot=slot||pick(IMPSLOTS);ql=clamp(Math.round(ql),1,IMPQL_MAX());if(rIdx==null)rIdx=rollRarity();if(rIdx!==ASC)rIdx=clamp(rIdx,0,3);const D=IMPDEF[slot];
  const it={id:uid(),kind:'imp',slot,ql,r:rIdx,lvl:Math.max(1,Math.round(ql/5)),bonus:[],name:'QL '+ql+' '+D.n+' Implant'};
  const pool=D.pool.slice().sort(()=>Math.random()-0.5);const n=rIdx===ASC?4:[1,2,2,3][rIdx];const rk=rRank(rIdx);
  for(let i=0;i<n;i++){const s=pool[i];const base=ATTRS.includes(s)?1+Math.floor(ql/5):2+Math.floor(ql/3);it.bonus.push({s,v:Math.max(1,Math.round(base*(1+0.15*rk)))});}
  it.req=impReq(ql,slot);it.value=Math.round((5+ql*3)*(1+0.3*rk));return it;
}
const GEARBONUS=['hp','en','crit','power','str','agi','sta','int','psy','sen','wpn','weave','treat','body','pool'];
function bonusVal(s,lvl,v){if(s==='run')return Math.round((6+lvl*2.2)*v);if(s==='hp')return Math.round((8+lvl*6)*v);if(s==='en')return Math.round((5+lvl*3)*v);if(s==='crit')return randi(1,3)+Math.floor(lvl/4);if(s==='power')return randi(2,4)+Math.floor(lvl/2);
  if(ATTRS.includes(s))return 1+Math.floor(lvl/2)+randi(0,1);return 2+lvl+randi(0,2);}
// slot: 'weapon' | an armour slot | 'gear' (any weapon/armour) | 'implant' | undefined (30% implant). opt: {wt, fam}
function genItem(lvl,slot,rIdx,opt){opt=opt||{};
  if(!slot&&Math.random()<0.3)return genImplant(lvl*4+randi(-3,3),null,rIdx);
  if(slot==='implant')return genImplant(lvl*4+randi(-3,3),null,rIdx);
  if(!slot||slot==='gear')slot=Math.random()<0.38?'weapon':pick(['head','armor','armor','hands','legs','legs','feet']);
  if(rIdx==null)rIdx=rollRarity();if(rIdx!==ASC&&rIdx!==8)rIdx=clamp(rIdx,0,3);const rk=rRank(rIdx);
  const r=RAR[rIdx],v=rand(0.88,1.12);const pk=P.prof||'vanguard';const it={id:uid(),kind:'gear',slot,lvl,r:rIdx,bonus:[],req:[]};let lean=null;
  if(slot==='weapon'){const wt=opt.wt||(Math.random()<0.7?pick(wtAff(pk)):pick(Object.keys(WTYPES)));const W=WTYPES[wt];it.wt=wt;
    it.dmg=Math.round((4+lvl*2.4)*r.m*v*W.dm);it.name=gearName(it);it.req.push({s:W.sk,v:Math.round((4+lvl*4.5)*(1+0.08*rk))});}
  else{const fam=opt.fam||(Math.random()<0.6?PROF_FAM[pk]:pick(Object.keys(AFAM)));const F=AFAM[fam];it.fam=fam;lean=F.lean;
    it.armor=Math.max(1,Math.round((4+lvl*3.5)*SLOTW[slot]*F.m*r.m*v));it.name=gearName(it);
    it.req.push({s:'body',v:Math.round((2+lvl*2.5)*(0.6+0.4*F.m)*(1+0.08*rk))});if(lvl>=3)it.req.push({s:F.attr,v:Math.round(4+lvl*1.6)});}
  for(let i=0;i<rBon(rIdx);i++){let s=lean&&Math.random()<0.7?pick(lean):pick(GEARBONUS);if(rIdx===ASC){let g=0;while(it.bonus.some(x=>x.s===s)&&g++<12)s=pick(GEARBONUS);}it.bonus.push({s,v:bonusVal(s,lvl,v)});}
  if((slot==='feet'||slot==='legs')&&Math.random()<(slot==='feet'?0.45:0.25))it.bonus.push({s:'run',v:bonusVal('run',lvl,v)});
  const mg={};it.bonus=it.bonus.filter(b=>{if(mg[b.s]){mg[b.s].v+=b.v;return false;}mg[b.s]=b;return true;});
  it.value=Math.round((6+lvl*5)*r.m*r.m*(slot==='weapon'||slot==='armor'?1:0.6));return it;
}
function fmtBonus(b){return '+'+b.v+(b.s==='crit'||b.s==='power'?'':' ')+STATN[b.s];}
const isUniq=it=>!!(it&&it.uniq);
// Short type label shown on every card: "Rifle", "Heavy armour · Head", "Implant · Eyes", "Weave Disk"
function itemType(it){if(!it)return '';if(it.kind==='cloth')return '👕 Social clothing'+(CLOTH[it.cid]?' · '+CSLOTN[CLOTH[it.cid].slot]:'');if(it.kind==='disk')return 'Weave Disk';if(it.kind==='imp')return 'Implant · '+(it.slot[0].toUpperCase()+it.slot.slice(1));
  if(it.slot==='weapon'){const W=WTYPES[it.wt];return W?W.ic+' '+W.n+(W.melee?' (melee)':''):'Weapon';}const F=AFAM[it.fam||'medium'];return F.n+' armour · '+SLOTN[it.slot];}
function itemLines(it){if(it.kind==='cloth'){const c=CLOTH[it.cid];return [c?c.desc:'Clothing','Cosmetic only · add it to your wardrobe'];}if(it.kind==='disk'){const w=WEAVES[it.wid];const L=[w?w.desc:'Unknown Weave'];if(typeof itemTier==='function'&&itemTier(it)>1)L.push('Requires Tier '+itemTier(it)+' · '+TIERS[itemTier(it)].n);if(it.src)L.push('Source: '+dunName(it.src)+(typeof dunRange==='function'?' · '+dunRange(it.src):''));return L;}const L=[];
  if(it.dmg){const W=WTYPES[it.wt];L.push(it.dmg+' Damage'+(W?(W.melee?' · melee '+W.rng+'m':' · range '+W.rng+'m')+(W.cd!==1?' · '+(W.cd<1?'fast':'slow'):''):''));}
  if(it.armor)L.push(it.armor+' Armour');it.bonus.forEach(b=>L.push(fmtBonus(b)));if(it.fac&&FACTIONS[it.fac])L.push('Faction: '+FACTIONS[it.fac].name+' · '+REP_TIERS[it.ftier||1].n);
  if(it.ts)L.push('✦ Tradeskilled: '+Object.keys(it.ts).map(k=>TSMOD[k]||k).join(', '));if(it.crafted)L.push('✦ Custom-built by '+it.crafted);if(it.set&&SETS[it.set])L.push('Set: '+SETS[it.set].name);if(it.src)L.push('Source: '+dunName(it.src)+(typeof dunRange==='function'?' · '+dunRange(it.src):''));if(typeof itemTier==='function'&&itemTier(it)>1)L.push('Requires Tier '+itemTier(it)+' · '+TIERS[itemTier(it)].n);return L;}
const dunName=id=>(typeof id==='string'&&id.startsWith('dyna_')&&typeof DYNAS!=='undefined'&&DYNAS[id.slice(5)])?'💀 '+DYNAS[id.slice(5)].name+' (dyna)':(typeof DUNGEONS!=='undefined'&&DUNGEONS[id])?DUNGEONS[id].name:(RAIDS&&RAIDS[id])?RAIDS[id].name:id;
function migrateItem(it){if(!it)return null;
  if(it.kind){if(it.kind==='disk'&&!WEAVES[it.wid])return null;if(it.kind==='cloth')return CLOTH[it.cid]?it:null;if(it.kind==='gear'){if(it.slot==='weapon'&&!it.wt)it.wt=(it.req&&it.req[0]&&it.req[0].s==='weave')?'rod':'rifle';if(it.slot!=='weapon'&&!it.fam)it.fam='medium';if(!nameFits(it))it.name=gearName(it);}return it;}
  if(it.slot==='implant'){const n=genImplant(Math.max(1,(it.lvl||1)*4),'head',it.r);n.id=it.id||n.id;return n;}
  it.kind='gear';it.req=it.req||[];it.bonus=it.bonus||[];if(it.slot==='weapon')it.wt='rifle';else it.fam='medium';if(!nameFits(it))it.name=gearName(it);return it;}
/* Sets (2-3 piece bonuses from dungeon gear) and Perks (future): both feed statsFor through the same add() pipeline.
   PERKS is an empty registry for now: a perk is {name, ranks, mods:(rank,c)=>({stat:val})}; characters save perks:{id:rank} and pp (perk points). */
const SETS={};
const PERKS={};
// XP curve: unchanged up to Lv 9 (old characters keep their progress); from Lv 10 on each level also costs +18% per level past 9,
// so 11-20 is a steady climb (~50 kills of your level at Lv 15, ~80 at Lv 19, plus story/side quests) rather than a wall.
// Build C: the multiplier stops growing at Lv 20 (x2.98), so 21-30 keeps climbing only with the base curve: ~85 same-level kills at Lv 21, ~100 at Lv 29.
// Build J: past 30 the base curve keeps climbing plus +2% per level (~110 same-level kills at 31, ~150 at 49).
// Build M: past 50 the late multiplier grows 0.008/level (was 0.02) so Lv 51-100 stay ~200-250 band kills per level; levels 1-50 are unchanged
const xpNeed=l=>Math.round(80*Math.pow(l,1.6)*(balOn()?(l>5?1+1.98*Math.pow((Math.min(l,20)-5)/15,1.3):1):(l>=10?1+0.18*(Math.min(l,20)-9):1))*(l>30?1+0.02*(Math.min(l,50)-30)+0.008*Math.max(0,l-50):1));
const MAXLVL=100;// Build M: 50 -> 100 (Build J: 30 -> 50). Raising it further is data: MAXLVL, XREG regions/dungeons, TEAMD bands (TD_BANDS), TIERS already reach 100+
const SP_START=20,SP_LVL=25;
const SP_HI=5;// extra skill points per level past 10 (the bigger skill caps need them), and again past 20
const spGain=l=>SP_LVL+SP_HI*Math.max(0,Math.floor((l-1)/10));// points granted for reaching level l (+5 more per 10-level band past 10)
const TS_SP=10;// stage 3: extra points so tradeskills don't starve combat skills
const RUN_SP=10;// added with the Run Speed skill: every character gets these once (old saves too)
const spTotal=l=>{let t=SP_START+TS_SP+RUN_SP+SP_LVL*(l-1);for(let k=10;k<l;k+=10)t+=SP_HI*(l-k);return t;};

/* ---------------- player ---------------- */
const P={name:'Contractor',prof:'vanguard',level:1,xp:0,credits:25,inv:[],eq:{weapon:null,head:null,armor:null,hands:null,legs:null,feet:null},imps:{},perks:{},pp:0,dunClears:{},ab:{},sb:{},sp:SP_START,known:[],slots:[],buffs:[],consum:{},stims:3,
  hp:100,en:80,pos:new V3(0,0,12),rotY:Math.PI,target:null,autoAtk:false,cds:{},lastCombat:-99,bulwarkUntil:0,hot:null,dead:false,mission:null,atkAnim:0,moving:0,kills:0};
let S={maxHp:100,maxEn:80,armor:2,dmg:4,crit:5,power:0,E:{},bon:{}};
const eff=s=>s==='level'?P.level:((S.E&&S.E[s])||0);
// breed scales the trainable attribute cap (Dunebred Strength 1.5x, Intelligence 0.6x, ...)
/* ---------- TIERS (Build J): seven tiers across levels 1-100+. Each tier raises the trainable attribute/skill caps and unlocks tier-locked gear, implants and Weaves.
   Breakpoints are data: a further cap raise needs no change here. tierOfLv(level), itemTier(it) (gear: item level, implant: QL/5, disk: Weave level). */
const TIERS=[null,{t:1,lv:1,n:'Dustborn',a:0,s:0},{t:2,lv:15,n:'Wayfinder',a:4,s:10},{t:3,lv:30,n:'Seamwalker',a:8,s:20},{t:4,lv:45,n:'Ironclad',a:14,s:35},{t:5,lv:60,n:'Stormcaller',a:20,s:50},{t:6,lv:80,n:'Vyrebound',a:28,s:70},{t:7,lv:100,n:'Reachlord',a:36,s:90}];
const TIER_MAX=TIERS.length-1;
function tierOfLv(l){let t=1;for(let i=1;i<=TIER_MAX;i++)if((l||1)>=TIERS[i].lv)t=i;return t;}
const pTier=()=>tierOfLv(P.level);
// breed scales the attribute cap; tiers add a flat bonus on top of the per-level cap
const attrCap=s=>Math.round((2+2*P.level+TIERS[pTier()].a)*((s&&breedOf(P).cap[s])||1)),skillCap=s=>Math.round((5+5*P.level+TIERS[pTier()].s)*(s==='run'?(PROFS[P.prof].runCap||1):1));
const costOf=s=>Math.max(1,PROFS[P.prof].cost[s]+(breedOf(P).cost[s]||0));
function baseOf(s){const pr=PROFS[P.prof];return ATTRS.includes(s)?pr.attrs[s]+(breedOf(P).mods[s]||0):5+(pr.innate[s]||0)+(s==='run'?breedOf(P).run||0:0);}
/* Run Speed -> % move speed: diminishing curve above a 12-point baseline, hard cap RUN_CAP. Legacy flat '% Run Speed' (spd) bonuses from old items/saves count as 2.5 Run Speed points per %. */
const RUN_CAP=60,RUN_BASE=12,RUN_K=140;
const runPctOf=R=>Math.round(Math.min(RUN_CAP,Math.max(0,75*(1-Math.exp(-Math.max(0,R-RUN_BASE)/RUN_K))))*10)/10;
// Pure stat calculation for ANY character sheet (the active player or a roster member).
// c needs: prof, level, eq, imps, ab, sb, buffs (buffs with mods). Used by calcStats and by partySnapshot() for future team missions.
/* level sync (team): SYNC.lv is the level the active character is scaled to (0 = off); other sheets carry c.sync */
var SYNC={lv:0};
function syncLvOf(c){const s=c===P?SYNC.lv:c.sync;return s&&s<c.level?s:c.level;}
function scaleObj(o,f){const r={};for(const k in o||{})r[k]=Math.floor((o[k]||0)*f);return r;}
function perkRankAt(p,r,L){let k=0;for(let i=1;i<=r;i++)if(perkLvl(p,i)<=L)k=i;return k;}
function statsFor(c){
  const pr=PROFS[c.prof];const bon={};const add=(s,v)=>{bon[s]=(bon[s]||0)+v;};const L=syncLvOf(c),syn=L<c.level,fS=syn?spTotal(L)/spTotal(c.level):1;
  const gf=it=>{if(!syn||!it)return 1;const il=it.ql?it.ql/4.5:(it.lvl||1);return il>L+1?clamp((L+1)/il,0.35,1):1;};let armor=2*L,dmg=4;const eq=c.eq||{},imps=c.imps||{},ab=syn?scaleObj(c.ab,fS):(c.ab||{}),sb=syn?scaleObj(c.sb,fS):(c.sb||{});
  for(const k in eq){const it=eq[k];if(!it)continue;const g=gf(it);if(it.dmg)dmg=it.dmg*g;if(it.armor)armor+=it.armor*g;(it.bonus||[]).forEach(b=>add(b.s,g<1?Math.round(b.v*g):b.v));}
  for(const k in imps){const it=imps[k];if(it){const g=gf(it);(it.bonus||[]).forEach(b=>add(b.s,g<1?Math.round(b.v*g):b.v));}}
  for(const b of (c.buffs||[]))for(const s in b.mods)add(s,b.mods[s]);
  // set bonuses (equipped gear + implants)
  const sc={};for(const k in eq){const it=eq[k];if(it&&it.set)sc[it.set]=(sc[it.set]||0)+1;}for(const k in imps){const it=imps[k];if(it&&it.set)sc[it.set]=(sc[it.set]||0)+1;}
  for(const id in sc){const st=SETS[id];if(!st)continue;for(const n in st.bonus)if(sc[id]>=+n){const m=st.bonus[n];for(const s in m)if(s==='armor')armor+=m[s];else add(s,m[s]);}}
  // perks (future system): ranks bought with perk points
  for(const id in (c.perks||{})){const pk=PERKS[id];if(pk){const rk=syn?perkRankAt(pk,c.perks[id],L):c.perks[id];if(rk<=0)continue;const m=pk.mods(rk,syn?{...c,level:L}:c);for(const s in m)add(s,m[s]);}}
  const wpn=eq.weapon,wt=wpn&&wpn.wt;if(wt&&WTYPES[wt]&&!WTYPES[wt].aff.includes(c.prof))dmg=Math.round(dmg*0.8);
  const br=breedOf(c);const tn=towersHeld(c.faction&&c.faction.side);if(tn){add('power',4*tn);add('dr',2*tn);}
  const E={};ATTRS.forEach(a=>E[a]=pr.attrs[a]+(br.mods[a]||0)+(ab[a]||0)+(bon[a]||0));
  SKILLS.forEach(s=>{let tr=0;for(const a in TRICKLE[s])tr+=E[a]*TRICKLE[s][a];E[s]=5+(pr.innate[s]||0)+(sb[s]||0)+Math.floor(tr/2)+(bon[s]||0)+(s==='run'?(br.run||0)+Math.round((bon.spd||0)*2.5):0);});
  const hp=((80+15*(L-1))*pr.hpMul+E.body*2.5+E.sta*1.5)*br.hp+(bon.hp||0);
  const en=((60+8*(L-1))*pr.enMul+E.pool*2+E.psy)*br.en+(bon.en||0);
  const dodge=Math.round(80*E.evade/(E.evade+120)*10)/10;
  return {runPct:runPctOf(E.run),wt,setCount:sc,towers:tn,dodge,dr:Math.min(60,bon.dr||0),maxHp:Math.round(hp),maxEn:Math.round(en),armor:Math.round(armor),dmg:Math.round(dmg),syncLv:syn?L:0,crit:5+Math.round(E.sen*0.15)+(bon.crit||0)+(pr.critB||0),power:bon.power||0,E,bon};
}
function calcStats(){S=statsFor(P);P.hp=Math.min(P.hp,S.maxHp);P.en=Math.min(P.en,S.maxEn);}
let PM=null,pShadow=makeShadow(0.6);
function buildPlayerModel(){if(PM)scene.remove(PM.g);const pr=PROFS[P.prof];const br=breedOf(P);const CL=P.clothing||{};PM=buildHumanoid(pr.color,pr.accent,pr.visor,br.skin,Object.assign({},pr.look||{},{face:faceKey(CL.face),hairc:hairCol(CL.hairc)}));PM.isPlayer=true;PM.g.scale.set(br.w,br.h,br.w);scene.add(PM.g);refreshGearVisual();}
// cheap gear visuals: weapon mesh shape/colour by type, helmet + shoulder pads by armour family, legendary glow
function refreshGearVisual_v1(){if(!PM)return;clearVeil();if(PM.gear){PM.gear.forEach(m=>m.parent&&m.parent.remove(m));}PM.gear=[];const eq=P.eq||{};
  const w=eq.weapon,W=w&&WTYPES[w.wt];const ms=W?W.mesh:{l:0.62,w:0.12,c:0x222222};const leg=w&&w.r>=4;
  PM.gun.scale.set(ms.w,ms.w*1.15,ms.l);PM.gun.position.set(0,-0.7,0.08+ms.l*0.32);PM.gun.material=(ms.glow||leg)?MB(leg?RAR[w.r].h:ms.c):M(ms.c);
  if(W&&W.melee){PM.gun.scale.set(0.05,0.16,ms.l);}
  const h=eq.head;if(h&&!clothHides('head')){const F=AFAM[h.fam||'medium'];const c=h.r>=4?RAR[h.r].h:F.col;
    if(h.fam==='light')PM.gear.push(part(PM.g,geoCone,M(c),0,2.1,-0.02,0.34,0.38,0.34));else{PM.gear.push(part(PM.g,geoBox,M(c),0,2.04,0,0.5,0.16,0.5));if(h.fam==='heavy')PM.gear.push(part(PM.g,geoBox,M(c),0,1.93,0.22,0.46,0.06,0.08));}}
  const b=clothHides('armor')?null:eq.armor;if(b&&b.fam==='heavy'){const c=b.r>=4?RAR[b.r].h:AFAM.heavy.col;PM.gear.push(part(PM.g,geoBox,M(c),0.5,1.62,0,0.32,0.16,0.52));PM.gear.push(part(PM.g,geoBox,M(c),-0.5,1.62,0,0.32,0.16,0.52));}
  else if(b&&b.r>=4)PM.gear.push(part(PM.g,geoBox,MB(RAR[b.r].h),0,1.5,0.25,0.82,0.06,0.02));clothVisual();}

/* ---------------- enemies ---------------- */
const enemies=[];
function makeEnemy(type,x,z,lv,temp){
  const T0=ETYPES[type];const R=T0.build();if(R.kind==='hum'&&R.melee==null)R.melee=!T0.ranged;bakeRig(R);const sc=T0.scale*(1+Math.min(lv-1,29)*0.03+Math.max(0,Math.min(lv,60)-30)*0.008);R.g.scale.setScalar(sc);scene.add(R.g);/* Build M: size growth stops at Lv 60 */
  const e={type,T:T0,R,lv,temp:!!temp,home:new V3(x,0,z),pos:new V3(x,heightAt(x,z),z),rotY:srand(0,6.28),state:'idle',hp:0,maxHp:0,
    nextAtk:0,nextWander:0,wt:new V3(x,0,z),stunUntil:0,rootUntil:0,dot:null,dead:false,respawnAt:0,hitT:0,atkT:0,moving:0,shadow:makeShadow(T0.hitR*0.9*sc),hitR:T0.hitR*sc,h:T0.h*sc,animT:Math.random()*10};
  e.maxHp=e.hp=Math.round(T0.hp*(1+0.38*(lv-1))*eHpK(lv));e.dmg=T0.dmg*(1+0.27*(lv-1));/* Build O: eHpK keeps time-to-kill flat across levels (player power grows ~cubically) */
  enemies.push(e);return e;
}
function spawnWorldEnemies(){
  for(let i=0;i<18;i++){const a=srand(0,6.28),r=srand(50,118);const lv=clamp(1+Math.floor((r-50)/24),1,3);makeEnemy('skitter',Math.cos(a)*r,Math.sin(a)*r,lv);}
  RUINS.forEach((ru,i)=>{const n=i<2?2:3;for(let k=0;k<n;k++){const lv=clamp(3+Math.floor(i*0.75)+(k===2?1:0),3,6);makeEnemy('raider',ru.x+srand(-10,10),ru.z+srand(-10,10),lv);}});
  for(let i=0;i<9;i++){const a=srand(0,6.28),r=srand(168,205);const lv=clamp(6+Math.floor((r-168)/10)+(i%3===0?1:0),6,10);makeEnemy('mauler',Math.cos(a)*r,Math.sin(a)*r,lv);}
}
spawnWorldEnemies();
function respawnEnemy(e){dieReset(e);e.dead=false;e.hp=e.maxHp;e.state='idle';e.pos.set(e.home.x,heightAt(e.home.x,e.home.z),e.home.z);e.R.g.visible=true;e.shadow.visible=true;e.dot=null;e.stunUntil=e.rootUntil=0;}
function removeEnemy(e){const ci=CORPSES.findIndex(c=>c.R===e.R);if(ci>=0&&e.R.g.parent)CORPSES[ci].rm=true;else{scene.remove(e.R.g);disposeRig(e.R);}scene.remove(e.shadow);const i=enemies.indexOf(e);if(i>=0)enemies.splice(i,1);}

/* ---------------- projectiles / fx ---------------- */
const projGeo=new THREE.SphereGeometry(0.16,6,4);const projs=[];
function fireProj(from,toEnt,color,speed,onHit){const m=new THREE.Mesh(projGeo,MB(color));m.position.copy(from);scene.add(m);projs.push({m,to:toEnt,speed,onHit});}
function entChest(ent,out){if(ent===P)return out.set(P.pos.x,P.pos.y+1.3,P.pos.z);return out.set(ent.pos.x,ent.pos.y+ent.h*0.55,ent.pos.z);}
const tmpV=new V3(),tmpV2=new V3();
function updProjs(dt){for(let i=projs.length-1;i>=0;i--){const p=projs[i];const tgtGone=p.to!==P&&p.to.dead;if(tgtGone||(p.to===P&&P.dead)){scene.remove(p.m);projs.splice(i,1);continue;}
  entChest(p.to,tmpV);tmpV2.subVectors(tmpV,p.m.position);const d=tmpV2.length();const step=p.speed*dt;
  if(d<=step+0.3){scene.remove(p.m);projs.splice(i,1);p.onHit();}else p.m.position.addScaledVector(tmpV2,step/d);}}
const rings=[];const ringGeo=new THREE.RingGeometry(0.85,1,32);ringGeo.rotateX(-Math.PI/2);
function ringFx(x,z,color,r,dur){if(SIMP)return;const m=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide}));m.position.set(x,heightAt(x,z)+0.25,z);scene.add(m);rings.push({m,t:0,dur:dur||0.6,r});}
function updRings(dt){for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.t+=dt;const k=r.t/r.dur;if(k>=1){scene.remove(r.m);r.m.material.dispose();rings.splice(i,1);continue;}const s=0.3+k*r.r;r.m.scale.set(s,1,s);r.m.material.opacity=0.9*(1-k);}}
// beam for waypoint & loot
const beamGeo=new THREE.CylinderGeometry(0.5,0.5,1,8,1,true);beamGeo.translate(0,0.5,0);
function makeBeam(color,h,r,op){const m=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:op||0.35,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));m.scale.set(r,h,r);scene.add(m);return m;}
const wpBeam=makeBeam(0xffc85a,70,1.4,0.28);wpBeam.visible=false;

/* ---------------- floating text ---------------- */
const dmgLayer=$('#dmgLayer');const floats=[];const fpool=[];
function floatText(pos,txt,cls){if(SIMP)return;let el=fpool.pop();if(!el){el=document.createElement('div');dmgLayer.appendChild(el);}el.className='dmg '+cls;el.textContent=txt;el.style.display='block';
  if(floats.length>40){const f=floats.shift();f.el.style.display='none';fpool.push(f.el);}
  floats.push({el,p:new V3(pos.x+rand(-0.4,0.4),pos.y,pos.z+rand(-0.4,0.4)),t:0});}
const projV=new V3();
function updFloats(dt){const W=innerWidth,H=innerHeight;for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.t+=dt;f.p.y+=dt*1.6;
  if(f.t>1.1){f.el.style.display='none';fpool.push(f.el);floats.splice(i,1);continue;}
  projV.copy(f.p).project(camera);if(projV.z>1){f.el.style.opacity=0;continue;}
  const x=(projV.x*0.5+0.5)*W,y=(-projV.y*0.5+0.5)*H;f.el.style.transform=`translate(${x|0}px,${y|0}px) translate(-50%,-50%) scale(${f.t<0.12?1.3:1})`;f.el.style.opacity=f.t>0.7?(1.1-f.t)/0.4:1;}}
