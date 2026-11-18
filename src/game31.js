/* ================= BUILD K: NEW PROFESSIONS (7 -> 14) =================
   Riftbinder (construct summoner, pet), Dreamshaper (mez/fear/energy drain, control), Anthemist (team buffs + light heals, support),
   Exactor (siphons enemy strength and hands it to you and your team, support), Ironpalm (unarmed martial artist, dps),
   Veilblade (stealth assassin, dps), Siegebreaker (heavy weapons, AoE, reflect shield, tank).
   The gadget-fixer archetype (snares + heal-over-time) is already covered by the Glintrunner (Snarewire, Patchloop), so it is not duplicated.
   Data is built by hoisted functions (profKData) so game2 can merge it into PROFS / WEAVES while it builds the library.
   All names are original to Dustreach. */
function profKData(){if(profKData.c)return profKData.c;
  const P_=(o)=>o;const pc=v=>Math.round(v*100)+'%';
  const statN={power:'power',crit:'crit chance',dr:'damage reduction',hp:'max health',en:'max energy',str:'Strength',agi:'Agility',sta:'Stamina',int:'Intelligence',psy:'Psychic',sen:'Sense',wpn:'Weapon Handling',weave:'Weave Craft',treat:'Treatment',body:'Body Development',evade:'Evasion',run:'Run Speed',spd:'run speed'};
  const modsTxt2=m=>'more '+Object.keys(m).map(k=>statN[k]).join(', ').replace(/, ([^,]*)$/,' and $1')+', growing with your level';
  // description per kind (kept in sync with the numbers for every rank)
  const D=w=>{switch(w.kind){
    case 'nuke':return 'A '+(w.dmgN||'bolt')+' for '+pc(w.mult)+' damage'+(w.root?' that roots the target for '+w.root+'s':'')+(w.stun?' and stuns for '+w.stun+'s':'')+'.';
    case 'strike':return 'Melee strike for '+pc(w.mult)+' damage'+(w.stun?', stunning for '+w.stun+'s (not bosses)':'')+(w.heal?', healing you for '+pc(w.heal)+' of max health':'')+'.'+(w.opener?' From Shroud it is your opener.':'');
    case 'lunge':return 'Dash up to '+w.range+'m to the target and strike for '+pc(w.mult)+' damage'+(w.stun?', stunning it for '+w.stun+'s (not bosses)':'')+'.';
    case 'flurry':return w.hits+' lightning-fast strikes for '+pc(w.mult)+' damage each.';
    case 'aoeSelf':return 'AoE: '+pc(w.mult)+' damage to every enemy within '+w.radius+'m'+(w.heal?', and heals you for '+pc(w.heal)+' of max health':'')+(w.root?'; roots them for '+w.root+'s':'')+'.';
    case 'aoeT':return 'AoE: '+pc(w.mult)+' damage to everything within '+w.radius+'m of the target'+(w.root?', rooting them for '+w.root+'s':'')+'.';
    case 'barrage':return 'AoE: '+w.waves+' waves of fire on the target area ('+w.radius+'m) for '+pc(w.mult)+' damage each.';
    case 'field':return 'AoE: sets the ground at the target ablaze for '+pc(w.mult)+' damage per second in a '+w.radius+'m field for '+w.dur+'s.';
    case 'heal':return (w.prof==='mender'&&balOn()?'Smart heal: the lowest-health member within 22m (you, a companion or your pet; you first under 50%) heals ':'Heal yourself for ')+pc(w.pct)+' of max health (more with Treatment)'+(w.dr?' and take '+pc(w.dr)+' less damage for '+w.dur+'s':'')+'.';
    case 'dot':return 'Deals '+pc(w.mult)+' damage every second for '+w.dur+'s'+(w.en?' and returns '+w.en+' energy per tick':'')+'.';
    case 'mez':return 'Mesmerise the target for '+w.dur+'s: it stands dazed until it takes damage. Bosses resist.';
    case 'mezAoe':return 'Mesmerise every enemy within '+w.radius+'m of the target for '+w.dur+'s (breaks on damage). Bosses resist.';
    case 'fear':return 'Terrify the target'+(w.mult?' ('+pc(w.mult)+' damage)':'')+': it flees from you for '+w.dur+'s and cannot attack. Bosses resist.';
    case 'drain':return pc(w.mult)+' damage, drains '+pc(w.en)+' of your max energy back to you and slows the target\'s attacks by '+w.slow+'s.';
    case 'steal':return (w.mult?pc(w.mult)+' damage and siphons':'Siphons')+' the target for '+w.dur+'s: it deals '+pc(w.weak||0)+' less damage'+(w.amp&&w.amp>1?' and takes '+pc(w.amp-1)+' more':'')+'. The stolen strength flows to you ('+modsTxt2(w.tmods)+')'+(w.ally?' and your companions and pets deal +'+pc(w.ally)+' damage':'')+'.';
    case 'stealAoe':return 'AoE siphon: '+pc(w.mult)+' damage to every enemy within '+w.radius+'m of the target; each deals '+pc(w.weak)+' less damage for '+w.dur+'s. You gain '+modsTxt2(w.tmods)+' (scaled by foes drained, up to 4)'+(w.ally?', and your team deals +'+pc(w.ally)+' damage':'')+'.';
    case 'stealth':return (w.vanish?'Vanish mid-fight: ordinary foes chasing you lose track. ':'Shroud yourself out of combat. ')+'For '+w.dur+'s enemies do not notice you. Your next attack deals '+w.opener+'x damage and always crits. Attacking or taking damage ends it.';
    case 'reflect':return 'Raise a reflector shield for '+w.dur+'s: take '+pc(w.dr)+' less damage and reflect '+pc(w.pct)+' of every hit back at the attacker.';
    case 'teambuff':return (w.ally||w.allyDr?'Team buff':'Self-buff')+' ('+(w.dur>=60?Math.round(w.dur/60)+' min':w.dur+'s')+'): you gain '+modsTxt2(w.tmods)+(w.ally?'; companions and pets deal +'+pc(w.ally)+' damage':'')+(w.allyDr?(w.ally?' and':'; companions and pets')+' take '+pc(w.allyDr)+' less damage':'')+'.';
    case 'teamheal':return 'Heals you and every ally within 22m for '+pc(w.pct)+' of max health'+(w.hot?', plus '+pc(w.hot)+' per second for 6s':'')+'.';
    case 'summon':return w.petDesc;
    case 'petheal':return 'Mends your construct for '+pc(w.pct)+' of its health, plus '+pc(w.hot)+' per second for 6s.';
    case 'petbuff':return 'Construct buff ('+Math.round(w.dur/60)+' min): +'+Math.round((w.dmg-1)*100)+'% construct damage, faster attacks and '+Math.round(w.hp*100)+'% more health.';
    case 'taunt':return 'Your construct roars: every enemy within '+w.radius+'m attacks it for '+w.dur+'s, and it takes 25% less damage meanwhile.';
    case 'battery':return 'Restores '+pc(w.pct)+' of your energy.';
  }return '';};
  // line spec: [prof, line, base(rank 1 fields incl. lvl 1 starter flag), ranks:[[lvl,name,{overrides}]...], grow:{field:delta|'x'factor}]
  const G=(o,g,i)=>{const r=Object.assign({},o);for(const k in g){const v=g[k];if(typeof v==='string'&&v[0]==='x')r[k]=Math.round(o[k]*Math.pow(+v.slice(1),i)*100)/100;else if(typeof v==='number')r[k]=Math.round((o[k]+v*i)*100)/100;}
    if(o.tmods){r.tmods={};for(const k in o.tmods)r.tmods[k]=[Math.round(o.tmods[k][0]*(1+0.35*i)),Math.round(o.tmods[k][1]*(1+0.3*i)*100)/100];}return r;};
  const LINES=[
   // ---------- Riftbinder ----------
   ['binder','bindgolem',{name:'Bind: Dust Golem',icon:'🗿',cost:30,cd:6,range:0,needTarget:false,kind:'summon',pet:'golem1',petDesc:'Binds a Dust Golem: a slow, heavy stone construct that holds enemies on itself and pounds them in melee. Recast to rebind it.'},
     [[5,'Bind: Basalt Golem',{pet:'golem2',icon:'🪨',petDesc:'Binds a Basalt Golem: tougher stone hide and heavier fists.'}],[12,'Bind: Ironroot Golem',{pet:'golem3',petDesc:'Binds an Ironroot Golem: iron-veined, it shrugs off a third of all damage.'}],[24,'Bind: Obsidian Colossus',{pet:'golem4',petDesc:'Binds an Obsidian Colossus: a towering glass-black brute.'}],[38,'Bind: Riftstone Titan',{pet:'golem5',petDesc:'Binds a Riftstone Titan: the mightiest stone construct, crackling with rift-light.'}]],{cost:'x1.2'}],
   ['binder','bindwisp',{name:'Bind: Ember Wisp',icon:'🔥',cost:30,cd:6,range:0,needTarget:false,kind:'summon',pet:'wisp1',petDesc:'Binds an Ember Wisp: a floating flame construct that bombards your target from range. Fragile but fierce.'},
     [[8,'Bind: Cinder Wisp',{pet:'wisp2',petDesc:'Binds a Cinder Wisp: hotter bolts, steadier flame.'}],[20,'Bind: Storm Wisp',{pet:'wisp3',icon:'🌩️',petDesc:'Binds a Storm Wisp: its bolts arc to enemies near the target.'}],[34,'Bind: Prism Wisp',{pet:'wisp4',icon:'💎',petDesc:'Binds a Prism Wisp: refracted bolts with a wide splash.'}],[46,'Bind: Riftfire Seraph',{pet:'wisp5',icon:'🪽',petDesc:'Binds a Riftfire Seraph: a winged storm of rift-flame.'}]],{cost:'x1.2'}],
   ['binder','riftmend',{name:'Rift Mend',icon:'🩵',cost:15,cd:6,range:0,needTarget:false,needPet:true,kind:'petheal',pct:0.35,hot:0.03},[[6,'Rift Mend II'],[19,'Rift Mend III'],[33,'Rift Mend IV'],[47,'Rift Mend V']],{pct:0.12,hot:0.01,cost:'x1.15'}],
   ['binder','riftshard',{name:'Rift Shard',icon:'💠',cost:14,cd:3,range:24,needTarget:true,kind:'nuke',mult:1.6,color:0x7ff8ff,dmgN:'shard of rift-glass'},[[4,'Rift Shard II'],[14,'Rift Shard III'],[27,'Rift Lance'],[40,'Rift Spear'],[50,'Rift Cataclysm']],{mult:'x1.32',cost:'x1.16'}],
   ['binder','tether',{lvl:3,name:'Rift Tether',icon:'⛓️',cost:20,cd:20,range:0,needTarget:false,needPet:true,kind:'petbuff',dmg:1.3,hp:0.2,spd:0.85,dur:180},[[16,'Rift Tether II'],[30,'Rift Tether III'],[44,'Rift Tether IV']],{dmg:0.35,hp:0.15,cost:'x1.15'}],
   ['binder','stonecall',{lvl:10,name:'Stonecall',icon:'📯',cost:25,cd:15,range:0,needTarget:false,needPet:true,kind:'taunt',radius:10,dur:6},[[29,'Stonecall II',{radius:12,dur:8}]],{}],
   // ---------- Dreamshaper ----------
   ['mind','lull',{name:'Lull',icon:'💤',cost:18,cd:8,range:24,needTarget:true,kind:'mez',dur:10,color:0xff9ae8},[[9,'Deep Lull'],[22,'Slumberweave'],[36,'Dreamlock'],[48,'Endless Lull']],{dur:3,cost:'x1.1'}],
   ['mind','dread',{name:'Dread',icon:'😱',cost:20,cd:12,range:22,needTarget:true,kind:'fear',dur:4,mult:0.5,color:0x9a5aff},[[12,'Dread II'],[28,'Night Terror'],[42,'Abyssal Dread']],{dur:1,mult:'x1.4',cost:'x1.12'}],
   ['mind','mindleech',{name:'Mind Leech',icon:'🫧',cost:10,cd:6,range:22,needTarget:true,kind:'drain',mult:1.2,en:0.08,slow:1.2,color:0xd08aff},[[14,'Mind Leech II'],[31,'Mind Leech III'],[47,'Soul Siphon']],{mult:'x1.35',en:0.03,slow:0.4,cost:'x1.1'}],
   ['mind','psyspike',{name:'Psyche Spike',icon:'🔮',cost:14,cd:3,range:24,needTarget:true,kind:'nuke',mult:1.7,color:0xff6ad8,dmgN:'spike of raw thought'},[[4,'Psyche Spike II'],[17,'Psyche Spike III'],[26,'Psyche Lance'],[39,'Psyche Rupture'],[50,'Psyche Shatter']],{mult:'x1.3',cost:'x1.16'}],
   ['mind','hush',{lvl:6,name:'Hush Field',icon:'🌫️',cost:40,cd:20,range:24,needTarget:true,kind:'mezAoe',radius:6,dur:8,color:0xffb8f0},[[19,'Hush Field II'],[33,'Grand Hush'],[45,'Stillwave']],{radius:1,dur:1.5,cost:'x1.12'}],
   // ---------- Anthemist ----------
   ['harm','rally',{name:'Rally Anthem',icon:'📣',cost:25,cd:10,range:0,needTarget:false,kind:'teambuff',dur:120,tmods:{power:[5,0.4],crit:[2,0.06]},ally:0.15},[[7,'Rally Anthem II'],[18,'Battle Anthem'],[32,'Anthem of Valor'],[46,'Anthem of the Reach']],{ally:0.07,cost:'x1.12'}],
   ['harm','ward',{name:'Warding Chord',icon:'🛡️',cost:25,cd:10,range:0,needTarget:false,kind:'teambuff',dur:120,tmods:{dr:[4,0.06],hp:[10,4]},allyDr:0.12},[[10,'Warding Chord II'],[24,'Bastion Chord'],[38,'Aegis Chord']],{allyDr:0.05,cost:'x1.12'}],
   ['harm','refrain',{name:'Soothing Refrain',icon:'🎶',cost:22,cd:8,range:0,needTarget:false,kind:'teamheal',pct:0.15,hot:0.02},[[5,'Soothing Refrain II'],[15,'Mending Refrain'],[29,'Restoring Refrain'],[43,'Lifesong Refrain']],{pct:0.05,hot:0.005,cost:'x1.14'}],
   ['harm','discord',{name:'Discord Note',icon:'🎵',cost:14,cd:3,range:24,needTarget:true,kind:'nuke',mult:1.5,color:0xffe08a,dmgN:'jarring note'},[[12,'Discord Note II'],[35,'Shattering Note']],{mult:'x1.6',cost:'x1.3'}],
   ['harm','cadence',{lvl:20,name:'Quickstep Cadence',icon:'🥁',cost:30,cd:10,range:0,needTarget:false,kind:'teambuff',dur:120,tmods:{run:[20,0.3],agi:[6,0.3]},ally:0.1},[[41,'Wildfire Cadence']],{ally:0.1}],
   ['harm','crescendo',{lvl:26,name:'Crescendo',icon:'🎺',cost:45,cd:14,range:0,needTarget:false,kind:'aoeSelf',radius:8,mult:2.4,heal:0.1,color:0xffd76a},[[49,'Final Crescendo']],{mult:'x1.5',heal:0.05,radius:1}],
   // ---------- Exactor ----------
   ['exact','tithe',{name:'Tithe',icon:'🪙',cost:16,cd:10,range:24,needTarget:true,kind:'steal',mult:0.9,dur:15,weak:0.2,amp:1,tmods:{power:[4,0.4]},ally:0.08,color:0xff7a5a},[[8,'Tithe II'],[19,'Heavy Tithe'],[33,'Grand Tithe'],[47,'Crown\'s Tithe']],{mult:'x1.3',weak:0.04,ally:0.03,cost:'x1.12'}],
   ['exact','skim',{name:'Skim Plating',icon:'🧲',cost:18,cd:12,range:24,needTarget:true,kind:'steal',mult:0.7,dur:15,weak:0.05,amp:1.2,tmods:{dr:[3,0.08]},color:0xffb070},[[11,'Skim Plating II'],[25,'Strip Plating'],[40,'Flay Plating']],{mult:'x1.3',amp:0.06,cost:'x1.12'}],
   ['exact','levy',{name:'Levy',icon:'🩸',cost:14,cd:8,range:24,needTarget:true,kind:'dot',mult:0.35,dur:10,en:2,color:0xc02a2a},[[6,'Levy II'],[21,'Blood Levy'],[37,'Ruinous Levy']],{mult:'x1.45',en:1,cost:'x1.15'}],
   ['exact','writ',{name:'Writ Bolt',icon:'📜',cost:14,cd:3,range:24,needTarget:true,kind:'nuke',mult:1.6,color:0xff7a5a,dmgN:'sealed writ of force'},[[3,'Writ Bolt II'],[16,'Writ of Seizure'],[28,'Writ of Ruin'],[41,'Writ of Forfeit'],[50,'Writ of Annulment']],{mult:'x1.35',cost:'x1.16'}],
   ['exact','grandlevy',{lvl:14,name:'Grand Levy',icon:'⚖️',cost:40,cd:18,range:24,needTarget:true,kind:'stealAoe',radius:6,mult:1.0,dur:12,weak:0.2,tmods:{power:[2,0.15]},ally:0.06,color:0xff5a3a},[[30,'Grand Levy II'],[44,'Total Forfeiture']],{radius:1,mult:'x1.4',weak:0.05,ally:0.03,cost:'x1.15'}],
   // ---------- Ironpalm ----------
   ['fist','palmstrike',{name:'Palm Strike',icon:'🖐️',cost:12,cd:2.5,range:4,needTarget:true,kind:'strike',mult:1.9,color:0xffc070},[[3,'Palm Strike II'],[13,'Iron Palm'],[24,'Thunder Palm'],[36,'Mountain Palm'],[48,'Palm of the Still Storm']],{mult:'x1.3',cost:'x1.15'}],
   ['fist','whirlkick',{name:'Whirlwind Kick',icon:'🌀',cost:20,cd:7,range:0,needTarget:false,kind:'aoeSelf',radius:5,mult:1.3,color:0xffa050},[[6,'Whirlwind Kick II'],[19,'Cyclone Kick'],[33,'Tempest Kick'],[45,'Typhoon Kick']],{mult:'x1.33',radius:0.5,cost:'x1.14'}],
   ['fist','innerbreath',{name:'Inner Breath',icon:'🫁',cost:18,cd:12,range:0,needTarget:false,kind:'heal',pct:0.25},[[8,'Inner Breath II'],[22,'Deep Breath'],[39,'Breath of Iron']],{pct:0.07,cost:'x1.15'}],
   ['fist','stillmind',{name:'Still Mind',icon:'☯️',cost:20,cd:5,range:0,needTarget:false,kind:'teambuff',dur:180,tmods:{agi:[3,1],str:[3,1],crit:[1,0.08]}},[[16,'Still Mind II'],[35,'Still Mind III']],{}],
   ['fist','gapstep',{lvl:5,name:'Gap Step',icon:'💨',cost:16,cd:10,range:14,needTarget:true,kind:'lunge',mult:1.4,stun:1.5,color:0xffd08a},[[31,'Gap Step II',{stun:2}]],{mult:'x1.9'}],
   ['fist','hundredhands',{lvl:10,name:'Hundred Hands',icon:'👐',cost:24,cd:9,range:4,needTarget:true,kind:'flurry',hits:5,mult:0.55},[[27,'Hundred Hands II',{hits:6}],[42,'Thousand Hands',{hits:7}]],{mult:'x1.35',cost:'x1.15'}],
   // ---------- Veilblade ----------
   ['shade','shroud',{name:'Shroud',icon:'🌑',cost:15,cd:12,range:0,needTarget:false,kind:'stealth',dur:20,opener:2.5},[[18,'Deep Shroud',{opener:3}],[40,'Umbral Shroud',{opener:3.5,dur:30}]],{}],
   ['shade','ambush',{name:'Ambush',icon:'🗡️',cost:14,cd:4,range:4,needTarget:true,kind:'strike',mult:2.0,opener:1,color:0xff3a5a},[[4,'Ambush II'],[14,'Backstab'],[26,'Heartseeker'],[38,'Assassinate'],[50,'Final Silence']],{mult:'x1.3',cost:'x1.15'}],
   ['shade','rend',{name:'Rend',icon:'🩸',cost:14,cd:8,range:6,needTarget:true,kind:'dot',mult:0.5,dur:8,color:0xb0203a},[[7,'Rend II'],[20,'Deep Rend'],[34,'Arterial Rend'],[46,'Exsanguinate']],{mult:'x1.35',cost:'x1.15'}],
   ['shade','killedge',{name:'Killing Edge',icon:'🔪',cost:20,cd:5,range:0,needTarget:false,kind:'teambuff',dur:180,tmods:{crit:[4,0.12],agi:[3,0.8]}},[[17,'Killing Edge II'],[35,'Killing Edge III']],{}],
   ['shade','vanish',{lvl:6,name:'Vanish',icon:'💨',cost:25,cd:45,range:0,needTarget:false,kind:'stealth',vanish:true,dur:8,opener:2.0},[[30,'Smoke Vanish',{opener:2.6,dur:10}]],{}],
   ['shade','glassfan',{lvl:10,name:'Glass Fan',icon:'✴️',cost:28,cd:9,range:0,needTarget:false,kind:'aoeSelf',radius:6,mult:1.5,color:0xc8f0ff},[[23,'Glass Fan II'],[41,'Glass Storm']],{mult:'x1.45',radius:1,cost:'x1.15'}],
   // ---------- Siegebreaker ----------
   ['siege','slug',{name:'Slug Round',icon:'🧨',cost:20,cd:6,range:22,needTarget:true,kind:'nuke',mult:2.6,color:0xffa040,dmgN:'heavy cannon slug'},[[3,'Slug Round II'],[13,'Tungsten Slug'],[25,'Siege Slug'],[37,'Rampart Breaker']],{mult:'x1.3',cost:'x1.15'}],
   ['siege','shellburst',{name:'Shellburst',icon:'💥',cost:22,cd:7,range:22,needTarget:true,kind:'aoeT',radius:5,mult:1.6,color:0xff8a2a},[[5,'Shellburst II'],[15,'High-Explosive Shell'],[27,'Cluster Shell'],[39,'Thermobaric Shell'],[49,'Earthshaker Shell']],{mult:'x1.3',radius:0.5,cost:'x1.14'}],
   ['siege','reflector',{name:'Reflector Shield',icon:'🔰',cost:25,cd:22,range:0,needTarget:false,kind:'reflect',dur:8,dr:0.35,pct:0.4},[[12,'Reflector Shield II'],[29,'Mirror Bulwark'],[43,'Retribution Shield']],{dr:0.05,pct:0.15,dur:1,cost:'x1.12'}],
   ['siege','ironstance',{name:'Iron Stance',icon:'🦾',cost:20,cd:5,range:0,needTarget:false,kind:'teambuff',dur:180,tmods:{body:[4,1.5],str:[3,1],dr:[2,0.05]}},[[18,'Iron Stance II'],[44,'Iron Stance III']],{}],
   ['siege','hailfire',{lvl:8,name:'Hailfire',icon:'☄️',cost:35,cd:12,range:24,needTarget:true,kind:'barrage',radius:5,mult:0.9,delay:0.6,waves:3,gap:0.45,color:0xffa040},[[21,'Hailfire II'],[35,'Hailstorm Barrage'],[47,'Siege Apocalypse']],{mult:'x1.35',radius:0.5,cost:'x1.12'}],
   ['siege','napalm',{lvl:10,name:'Napalm Strip',icon:'🔥',cost:40,cd:14,range:22,needTarget:true,kind:'field',mult:0.6,radius:6,dur:8,color:0xff6a1a},[[31,'Napalm Strip II']],{mult:'x2.1',radius:1}]
  ];
  const weaves=[],starters={};const romanFix=n=>n;
  for(const [prof,line,base,ranks,grow] of LINES){const b=Object.assign({},base);delete b.petDesc;const lv0=base.lvl||1;
    const mk=(o,tier,lvl,name,ov)=>{const w=Object.assign({},o,ov||{});w.id=tier===1?line:line+tier;w.line=line;w.tier=tier;w.prof=prof;w.lvl=lvl;w.name=name;if(w.kind==='summon')w.petDesc=(ov&&ov.petDesc)||base.petDesc;
      w.desc=D(w);delete w.dmgN;if(w.kind!=='summon')delete w.petDesc;return w;};
    const r1=mk(b,1,lv0,base.name,{petDesc:base.petDesc});if(lv0===1){(starters[prof]=starters[prof]||[]).push(r1);}else weaves.push(r1);
    let prev=b;ranks.forEach((rk,i)=>{const g=G(b,grow,i+1);const w=mk(g,i+2,rk[0],rk[1],rk[2]);if(w.dur)w.dur=Math.round(w.dur*10)/10;if(w.cost)w.cost=Math.round(w.cost);weaves.push(w);});}
  const prof=(k,o)=>{o.abilities=(starters[k]||[]).map(a=>{const c=Object.assign({},a);delete c.prof;delete c.line;delete c.tier;delete c.lvl;return c;});return o;};
  const profs={
    binder:prof('binder',{name:'Riftbinder',role:'Construct Summoner',color:0x2f8a8a,accent:0x4a3018,visor:0x7ff8ff,hpMul:0.95,enMul:1.3,dmgSkill:'weave',look:{scarf:0x2f8a8a,padGlow:0x7ff8ff},
      attrs:{str:7,agi:9,sta:10,int:13,psy:12,sen:10},innate:{weave:5,pool:2},cost:{str:3,agi:3,sta:2,int:1,psy:2,sen:2,wpn:3,weave:1,treat:2,body:2,pool:1,evade:3},
      desc:'A rift-scholar who binds stone and flame into living constructs. Commands one construct at a time: a hulking Golem that holds enemies or a Wisp that bombards from range.',
      basic:{id:'basic',name:'Binding Bolt',icon:'🔹',cost:0,cd:1.0,range:22,mult:0.85,proj:0x7ff8ff}}),
    mind:prof('mind',{name:'Dreamshaper',role:'Mind-bender / Crowd Control',color:0xb04a8e,accent:0x34142c,visor:0xffd0ff,hpMul:0.85,enMul:1.45,dmgSkill:'weave',look:{robe:true,scarf:0xffd0ff},
      attrs:{str:6,agi:9,sta:9,int:12,psy:14,sen:11},innate:{weave:5,pool:3},cost:{str:3,agi:3,sta:3,int:2,psy:1,sen:2,wpn:3,weave:1,treat:2,body:2,pool:1,evade:3},
      desc:'A mind-bender who lulls foes into dazed sleep, scatters them in terror and drinks their focus to refill her own. Controls fights instead of winning them outright.',
      basic:{id:'basic',name:'Thought Needle',icon:'🪡',cost:0,cd:0.95,range:22,mult:0.8,proj:0xff9ae8}}),
    harm:prof('harm',{name:'Anthemist',role:'Team Support / Buffer',color:0xc8962e,accent:0x4a3010,visor:0xfff0a0,hpMul:1.0,enMul:1.3,dmgSkill:'weave',look:{scarf:0xfff0a0,padGlow:0xffd76a},
      attrs:{str:8,agi:9,sta:11,int:10,psy:13,sen:11},innate:{weave:4,treat:3},cost:{str:3,agi:2,sta:2,int:2,psy:1,sen:2,wpn:2,weave:1,treat:1,body:2,pool:2,evade:2},
      desc:'A frontier singer whose Vyre-tuned anthems make a whole team hit harder, shrug off blows and recover between fights. Light heals, strong buffs.',
      basic:{id:'basic',name:'Tone Dart',icon:'🎵',cost:0,cd:0.9,range:22,mult:0.8,proj:0xffe08a}}),
    exact:prof('exact',{name:'Exactor',role:'Debuffer / Siphoner',color:0x8a2a2a,accent:0x221010,visor:0xffb070,hpMul:0.95,enMul:1.3,dmgSkill:'weave',look:{robe:true,forec:0x3a1010,scarf:0xb08a3a},
      attrs:{str:8,agi:9,sta:10,int:13,psy:11,sen:10},innate:{weave:5,pool:2},cost:{str:3,agi:3,sta:2,int:1,psy:2,sen:2,wpn:2,weave:1,treat:2,body:2,pool:1,evade:3},
      desc:'A collector of debts no one agreed to. Siphons the strength out of enemies (less damage dealt, more taken) and pays it straight to you and your team.',
      basic:{id:'basic',name:'Writ Pistol',icon:'🔸',cost:0,cd:0.85,range:21,mult:0.85,proj:0xff7a5a}}),
    fist:prof('fist',{name:'Ironpalm',role:'Unarmed Martial Artist',color:0xc8622a,accent:0x3a2414,visor:0xffe0a0,hpMul:1.1,enMul:0.9,dmgSkill:'wpn',critB:3,look:{scarf:0xc8302a,bulk:1.04},
      attrs:{str:12,agi:13,sta:11,int:7,psy:9,sen:9},innate:{wpn:5,evade:3},cost:{str:1,agi:1,sta:2,int:3,psy:2,sen:2,wpn:1,weave:2,treat:2,body:1,pool:2,evade:1},
      desc:'A wandering fighter who needs no weapon. Fast unarmed strikes, a dashing Gap Step, spinning kicks and an Inner Breath that heals mid-fight.',
      basic:{id:'basic',name:'Palm Jab',icon:'👊',cost:0,cd:0.62,range:3.4,mult:0.8,melee:true}}),
    shade:prof('shade',{name:'Veilblade',role:'Stealth Assassin',color:0x2e2e40,accent:0x111118,visor:0xff3a5a,hpMul:0.95,enMul:1.0,dmgSkill:'wpn',critB:6,look:{scarf:0x111118,forec:0x1a1a24,legc:0x1a1a24},
      attrs:{str:9,agi:14,sta:9,int:8,psy:8,sen:13},innate:{wpn:5,evade:4},cost:{str:2,agi:1,sta:2,int:3,psy:3,sen:1,wpn:1,weave:2,treat:2,body:2,pool:2,evade:1},
      desc:'An unseen blade. Shrouds out of sight, opens with a crushing critical Ambush, bleeds the target and Vanishes when the fight turns. High crit, low armour.',
      basic:{id:'basic',name:'Glass Knife',icon:'🔪',cost:0,cd:0.8,range:3.6,mult:0.9,melee:true}}),
    siege:prof('siege',{name:'Siegebreaker',role:'Heavy Weapons / Tank',color:0x6a6a4e,accent:0x2a2a1e,visor:0xff9a2a,hpMul:1.3,enMul:0.8,dmgSkill:'wpn',look:{heavy:true,bulk:1.12},
      attrs:{str:13,agi:8,sta:14,int:7,psy:7,sen:9},innate:{wpn:5,body:6},cost:{str:1,agi:2,sta:1,int:3,psy:3,sen:3,wpn:1,weave:3,treat:2,body:1,pool:3,evade:2},
      desc:'A walking artillery piece in heavy plate. Hand cannons, area shells, Hailfire barrages and a Reflector Shield that throws damage back at attackers.',
      basic:{id:'basic',name:'Cannon Shot',icon:'🧨',cost:0,cd:1.3,range:20,mult:1.25,proj:0xffa040}})};
  profKData.c={profs,weaves};return profKData.c;}
function newProfDefs(){return profKData().profs;}
function newProfWeaves(){return profKData().weaves;}
function wreqK(prof,lvl){const m={binder:['int',1.6],mind:['psy',1.6],harm:['psy',1.5],exact:['int',1.6],fist:['agi',1.6],shade:['agi',1.6],siege:['str',1.6]}[prof];if(!m)return null;
  return [{s:'weave',v:Math.round(4+lvl*(m[0]==='int'||m[0]==='psy'?3.5:2.5))},{s:m[0],v:Math.round(10+lvl*m[1])}];}
const PROFS_K=['binder','mind','harm','exact','fist','shade','siege'];
const isPetProf=p=>p==='wright'||p==='binder';

/* ---------- Riftbinder constructs (pets): reuse the bot AI (follow / attack / assist / stay) ---------- */
Object.assign(PETDEF,{
  golem1:{name:'Dust Golem',tier:1,hp:1.3,dmg:0.85,range:2.6,melee:true,atkCd:1.5,speed:7.0,build:'golem',h:1.9,hitR:0.95,col:0xb09a78,proj:0x7ff8ff,dr:0.18},
  golem2:{name:'Basalt Golem',tier:2,hp:1.7,dmg:1.1,range:2.7,melee:true,atkCd:1.5,speed:7.0,build:'golem',h:2.1,hitR:1.0,col:0x5a5650,proj:0x7ff8ff,dr:0.24},
  golem3:{name:'Ironroot Golem',tier:3,hp:2.1,dmg:1.35,range:2.8,melee:true,atkCd:1.45,speed:7.2,build:'golem',h:2.3,hitR:1.05,col:0x6a4a3a,proj:0xffa040,dr:0.33},
  golem4:{name:'Obsidian Colossus',tier:4,hp:2.6,dmg:1.6,range:3.0,melee:true,atkCd:1.4,speed:7.4,build:'golem',h:2.6,hitR:1.15,col:0x26222e,proj:0xc86bff,dr:0.38},
  golem5:{name:'Riftstone Titan',tier:5,hp:3.2,dmg:1.95,range:3.2,melee:true,atkCd:1.35,speed:7.6,build:'golem',h:2.9,hitR:1.2,col:0x3a5a6a,proj:0x7ff8ff,dr:0.42},
  wisp1:{name:'Ember Wisp',tier:1,hp:0.75,dmg:1.25,range:16,melee:false,atkCd:1.4,speed:8.2,build:'wisp',h:1.2,hitR:0.6,col:0xff8a3a,proj:0xffa040,dr:0.05},
  wisp2:{name:'Cinder Wisp',tier:2,hp:0.9,dmg:1.6,range:17,melee:false,atkCd:1.35,speed:8.2,build:'wisp',h:1.2,hitR:0.6,col:0xff5a2a,proj:0xff7a3a,dr:0.08},
  wisp3:{name:'Storm Wisp',tier:3,hp:1.05,dmg:1.95,range:18,melee:false,splash:3,atkCd:1.3,speed:8.4,build:'wisp',h:1.25,hitR:0.65,col:0x6ab8ff,proj:0x9fe8ff,dr:0.1},
  wisp4:{name:'Prism Wisp',tier:4,hp:1.25,dmg:2.35,range:19,melee:false,splash:3.5,atkCd:1.25,speed:8.6,build:'wisp',h:1.3,hitR:0.7,col:0xd8f0ff,proj:0xff9ae8,dr:0.14},
  wisp5:{name:'Riftfire Seraph',tier:5,hp:1.5,dmg:2.8,range:20,melee:false,splash:4,atkCd:1.2,speed:8.8,build:'wisp',h:1.4,hitR:0.75,col:0x7ff8ff,proj:0x7ff8ff,dr:0.18}});
// code-built construct models (few boxes/spheres, one emissive core; animation is transform-only, so they stay cheap)
function buildBot_k(def){if(def.build!=='golem'&&def.build!=='wisp')return buildBot_v1(def);const g=new THREE.Group();const R={g};const c=def.col,gl=def.proj||0x7ff8ff,s=def.h/2.0;
  if(def.build==='golem'){const st=M(c),dk=M(dimc?dimc(c,0.7):0x333333);
    R.torso=part(g,geoBox,st,0,1.25*s,0,1.15*s,0.95*s,0.8*s);part(g,geoBox,dk,0,1.82*s,-0.05*s,1.35*s,0.3*s,0.85*s);R.head=part(g,geoBox,st,0,2.08*s,0.12*s,0.45*s,0.36*s,0.42*s);
    R.core=part(g,geoIco,MB(gl),0,1.3*s,0.38*s,0.22*s,0.22*s,0.1*s);part(g,geoBox,MB(gl),0,2.1*s,0.34*s,0.3*s,0.07*s,0.02);
    const limb=(x,y,w,h,m)=>{const p=new THREE.Group();p.position.set(x,y,0);g.add(p);part(p,geoBox,m,0,-h/2,0,w,h,w*1.05);return p;};
    R.legL=limb(-0.32*s,0.8*s,0.38*s,0.8*s,dk);R.legR=limb(0.32*s,0.8*s,0.38*s,0.8*s,dk);R.armL=limb(-0.82*s,1.72*s,0.36*s,1.0*s,st);R.armR=limb(0.82*s,1.72*s,0.36*s,1.0*s,st);
    part(R.armL,geoBox,dk,0,-1.08*s,0.04,0.5*s,0.42*s,0.5*s);part(R.armR,geoBox,dk,0,-1.08*s,0.04,0.5*s,0.42*s,0.5*s);
    for(const sx of [-1,1]){const sp=part(g,geoCone,MB(gl),sx*0.45*s,1.95*s,-0.25*s,0.08*s,0.32*s,0.08*s);sp.rotation.z=-sx*0.4;}
    R.anim=(t,mv,atk)=>{const w=Math.sin(t*6)*0.4*mv;R.legL.rotation.x=w;R.legR.rotation.x=-w;R.armL.rotation.x=-w*0.5;R.armR.rotation.x=atk>0?-1.9:w*0.5;R.armL.rotation.z=atk>0?0.3:0;R.torso.position.y=1.25*s+Math.abs(Math.sin(t*6))*0.05*mv;R.core.rotation.y=t*2;};}
  else{R.hover=true;R.core=part(g,geoIco,MB(gl),0,0.55,0,0.42,0.5,0.42);R.shell=part(g,geoIco,M(c),0,0.55,0,0.3,0.36,0.3);
    R.orb=[];for(let i=0;i<3;i++){const o=part(g,geoIco,MB(c),0,0.55,0,0.12,0.12,0.12);R.orb.push(o);}
    if(def.tier>=5){R.wings=[];for(const sx of [-1,1]){const w=part(g,geoBox,MB(gl),sx*0.6,0.7,-0.15,0.7,0.05,0.28);w.rotation.z=sx*0.35;R.wings.push(w);}}
    R.anim=(t,mv,atk)=>{R.orb.forEach((o,i)=>{const a=t*2.6+i*2.09;o.position.set(Math.cos(a)*0.7,0.55+Math.sin(t*3+i)*0.15,Math.sin(a)*0.7);});const k=1+(atk>0?0.25:0)+Math.sin(t*7)*0.06;R.core.scale.set(0.42*k,0.5*k,0.42*k);R.shell.rotation.y=-t*1.4;
      if(R.wings)R.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*(0.35+Math.sin(t*5)*0.25));};}
  return R;}

/* ---------- crowd control: mez (breaks on damage) and fear (flee); bosses and outpost guards resist ---------- */
const PK={cc:new Set(),fade:null,shield:null,cbUntil:0};
function ccImmune(e){return !!(e.boss||e.guard||(e.T&&e.T.boss)||e.raidBoss);}
function mezApply(e,d){if(!e||e.dead)return false;if(ccImmune(e)){floatText(entChest(e,tmpV),'Resisted','info');return false;}e.mezUntil=T+d;e.mezHp=e.hp;e.stunUntil=Math.max(e.stunUntil||0,T+d);PK.cc.add(e);
  floatText(entChest(e,tmpV),'Mesmerised','info');ringFx(e.pos.x,e.pos.z,0xff9ae8,1.8,0.6);return true;}
function fearApply(e,d){if(!e||e.dead)return false;if(ccImmune(e)){floatText(entChest(e,tmpV),'Resisted','info');return false;}e.fearUntil=T+d;e.stunUntil=Math.max(e.stunUntil||0,T+d);PK.cc.add(e);
  floatText(entChest(e,tmpV),'Terrified','info');ringFx(e.pos.x,e.pos.z,0x9a5aff,2,0.6);return true;}
const isMezzed=e=>!!e&&T<(e.mezUntil||0),isFeared=e=>!!e&&T<(e.fearUntil||0);
KIND.mez=(t,a)=>{shoot(t,0,a.color||0xff9ae8,()=>{if(!t.dead)mezApply(t,a.dur);});SFX.zap();};
KIND.mezAoe=(t,a)=>{shoot(t,0,a.color||0xffb8f0,()=>{ringFx(t.pos.x,t.pos.z,a.color||0xffb8f0,a.radius,0.9);let n=0;for(const e of enemies)if(!e.dead&&dist2D(e.pos,t.pos)<a.radius+e.hitR&&mezApply(e,a.dur))n++;if(!n)toast('Nothing was lulled');});SFX.zap();};
KIND.fear=(t,a)=>{shoot(t,0,a.color||0x9a5aff,()=>{if(t.dead)return;if(a.mult)dmgEnemy(t,a.mult);if(!t.dead){if(t.state!=='chase')aggro(t);fearApply(t,a.dur);}});SFX.zap();};
KIND.drain=(t,a)=>{shoot(t,0,a.color||0xd08aff,()=>{if(t.dead)return;dmgEnemy(t,a.mult);if(!t.dead){t.nextAtk=Math.max(t.nextAtk||0,T)+(a.slow||0);fireProj(entChest(t,new V3()),P,a.color||0xd08aff,30,()=>{});}
  P.en=Math.min(S.maxEn,P.en+S.maxEn*(a.en||0));floatText(tmpV.set(P.pos.x,P.pos.y+2.4,P.pos.z),'+Energy','info');});SFX.zap();};
/* ---------- melee kinds (Ironpalm, Veilblade) ---------- */
function meleeHit(t,a,mult){if(!t||t.dead)return;dmgEnemy(t,mult);ringFx(t.pos.x,t.pos.z,a.color||0xffd08a,1.3,0.25);if(a.stun&&!t.dead&&!ccImmune(t)){t.stunUntil=Math.max(t.stunUntil||0,T+a.stun);floatText(entChest(t,tmpV),'Stunned','info');}if(a.heal)healPlayer(S.maxHp*a.heal);}
KIND.strike=(t,a)=>{faceTarget(t);P.atkAnim=0.35;meleeHit(t,a,a.mult);SFX.hit();};
KIND.lunge=(t,a)=>{const dx=t.pos.x-P.pos.x,dz=t.pos.z-P.pos.z,d=Math.hypot(dx,dz)||1;const k=Math.max(0,d-1.8)/d;ringFx(P.pos.x,P.pos.z,a.color||0xffd08a,1.6,0.3);P.pos.x+=dx*k;P.pos.z+=dz*k;
  if(typeof collide==='function')collide(P.pos,0.5);P.pos.y=heightAt(P.pos.x,P.pos.z);faceTarget(t);P.atkAnim=0.4;meleeHit(t,a,a.mult);SFX.hit();};
KIND.flurry=(t,a)=>{faceTarget(t);for(let i=0;i<a.hits;i++)later(i*0.14,()=>{if(t.dead||P.dead)return;if(dist2D(t.pos,P.pos)>a.range+t.hitR+1.5)return;faceTarget(t);P.atkAnim=0.2;dmgEnemy(t,a.mult);SFX.hit();});};
/* ---------- Exactor: siphon (debuff the enemy, transfer the strength to you + your allies) ---------- */
function tbSet(a,key,until,mul,dr){if(!a||a.dead)return;a.tb=a.tb||{};a.tb[key]={until,mul:mul||1,dr:dr||0};}
function tbMul(a){let m=1;if(a&&a.tb)for(const k in a.tb){const b=a.tb[k];if(T<b.until)m*=b.mul;}return m;}
function tbDr(a){let r=0;if(a&&a.tb)for(const k in a.tb){const b=a.tb[k];if(T<b.until)r=1-(1-r)*(1-b.dr);}return Math.min(0.6,r);}
function tmodsAt(tm,L,f){const m={};for(const k in tm||{}){const v=Math.round((tm[k][0]+tm[k][1]*L)*(f||1));if(v)m[k]=v;}return m;}
function teamBoost(a,key,f){f=f||1;if(!a.ally&&!a.allyDr)return 0;let n=0;for(const al of allies){if(al.dead||al.passive||dist2D(al.pos,P.pos)>30)continue;tbSet(al,key,T+a.dur,1+(a.ally||0)*f,a.allyDr||0);ringFx(al.pos.x,al.pos.z,a.color||0xffd76a,1.3,0.4);n++;}return n;}
function stealOn(e,a){e.hexUntil=T+a.dur;e.hexWeak=Math.max(0.3,1-(a.weak||0));e.hexAmp=a.amp||1;e.tithed=T+a.dur;floatText(entChest(e,tmpV),'Siphoned','info');fireProj(entChest(e,new V3()),P,a.color||0xff7a5a,28,()=>{});}
KIND.steal=(t,a)=>{shoot(t,0,a.color||0xff7a5a,()=>{if(t.dead)return;if(a.mult)dmgEnemy(t,a.mult);if(t.dead)return;if(t.state!=='chase')aggro(t);stealOn(t,a);
  addBuff(a.line,a.name,a.icon,a.dur,tmodsAt(a.tmods,P.level,1));teamBoost(a,a.line,1);});SFX.zap();};
KIND.stealAoe=(t,a)=>{shoot(t,0,a.color||0xff5a3a,()=>{ringFx(t.pos.x,t.pos.z,a.color||0xff5a3a,a.radius,0.7);SFX.boom();let n=0;
  for(const e of enemies.slice())if(!e.dead&&dist2D(e.pos,t.pos)<a.radius+e.hitR){dmgEnemy(e,a.mult);if(!e.dead){stealOn(e,a);n++;}}
  if(n){const f=Math.min(4,n);addBuff(a.line,a.name,a.icon,a.dur,tmodsAt(a.tmods,P.level,f));teamBoost(a,a.line,Math.min(2,0.5+f*0.25));}else toast('Nothing to siphon');});SFX.zap();};
/* ---------- Anthemist: team buffs and heals ---------- */
KIND.teambuff=(t,a)=>{addBuff(a.line,a.name,a.icon,a.dur,tmodsAt(a.tmods,P.level,1));const n=teamBoost(a,a.line,1);ringFx(P.pos.x,P.pos.z,a.ally||a.allyDr?0xffd76a:0xc86bff,a.ally||a.allyDr?8:3.5,0.9);if(n)floatText(tmpV.set(P.pos.x,P.pos.y+2.8,P.pos.z),'Team +'+n,'info');};
KIND.teamheal=(t,a)=>{const tr=1+eff('treat')/200;healPlayer(S.maxHp*a.pct*tr);if(a.hot)P.hot={until:T+6,next:T+1,pct:a.hot};
  for(const al of allies){if(al.dead||dist2D(al.pos,P.pos)>22)continue;allyHeal(al,al.maxHp*a.pct*1.2*tr);if(a.hot)al.hot={until:T+6,next:T+1,pct:a.hot};ringFx(al.pos.x,al.pos.z,0x6dff8a,1.4,0.4);}
  ringFx(P.pos.x,P.pos.z,0xfff0a0,6,0.8);SFX.heal();};
/* ---------- Siegebreaker: reflector shield ---------- */
KIND.reflect=(t,a)=>{P.reflUntil=T+a.dur;P.reflPct=a.pct;P.bulwarkUntil=T+a.dur;P.drAmt=a.dr;ringFx(P.pos.x,P.pos.z,0xffc85a,3,0.8);SFX.heal();floatText(tmpV.set(P.pos.x,P.pos.y+2.4,P.pos.z),'Reflector','info');shieldFx(true);};
function shieldFx(on){if(!PM)return;if(on){if(!PK.shield){PK.shield=new THREE.Mesh(new THREE.SphereGeometry(1.25,16,10),new THREE.MeshBasicMaterial({color:0xffc85a,transparent:true,opacity:0.22,depthWrite:false,blending:THREE.AdditiveBlending}));PK.shield.position.y=1.1;}
  if(PK.shield.parent!==PM.g)PM.g.add(PK.shield);PK.shield.visible=true;}else if(PK.shield){PK.shield.visible=false;}}
/* ---------- Veilblade: stealth ---------- */
const stealthed=()=>T<(P.stealthUntil||0);
KIND.stealth=(t,a)=>{const hot=enemies.some(e=>!e.dead&&e.state==='chase'&&foeOf(e)===P&&dist2D(e.pos,P.pos)<25);
  if(hot&&!a.vanish){P.en=Math.min(S.maxEn,P.en+a.cost);P.cds[a.id]=0;warn('Enemies are on you: break away first'+(P.known&&P.known.includes('vanish')?' or use Vanish':''));return;}
  if(a.vanish)for(const e of enemies)if(!e.dead&&!(e.boss&&balOn())&&e.state==='chase'&&!ccImmune(e)&&dist2D(e.pos,P.pos)<45&&foeOf(e)===P){e.state='return';e.foe=null;}
  P.stealthUntil=T+a.dur;P.stealthOpen=a.opener;P.autoAtk=false;fadeModel(true);ringFx(P.pos.x,P.pos.z,0x2a2a40,2.5,0.6);floatText(tmpV.set(P.pos.x,P.pos.y+2.4,P.pos.z),a.vanish?'Vanished':'Shrouded','info');SFX.ui&&SFX.ui();};
function breakStealth(why){if(!P.stealthUntil)return;P.stealthUntil=0;fadeModel(false);if(why)floatText(tmpV.set(P.pos.x,P.pos.y+2.4,P.pos.z),why,'info');}
function fadeModel(on){if(!PM)return;if(on){if(PK.fade&&PK.fade.g===PM.g)return;const list=[];PM.g.traverse(o=>{if(o.isMesh&&o!==PK.shield){const m=o.material;const c=m.clone();c.transparent=true;c.opacity=0.22;c.depthWrite=false;list.push([o,m,c]);o.material=c;}});PK.fade={g:PM.g,list};}
  else if(PK.fade){for(const [o,m,c] of PK.fade.list){if(o.material===c)o.material=m;c.dispose();}PK.fade=null;}}
// called from useAbility just before an ability fires: anything but a stealth weave or a self-buff from Shroud is the opener
function stealthOpener(ab){if(!stealthed()||ab.kind==='stealth')return;P.openUntil=T+2.5;P.openMul=P.stealthOpen||2;breakStealth();}
// called from rollDmg: consume the opener (x mult, guaranteed crit)
function openerTake(){if(T<(P.openUntil||0)){P.openUntil=0;return P.openMul||2;}return 0;}
// called from dmgPlayer after damage lands
function profKHurt(a,src){if(stealthed())breakStealth('Revealed');
  if(src&&T<(P.reflUntil||0)&&src.T&&!src.dead&&enemies.includes(src)&&src.state!=='return'&&!(src.immune&&src.immune())){const v=Math.max(1,Math.round(a*(P.reflPct||0.3)));src.hp-=v;src.hitT=0.15;floatText(entChest(src,tmpV),v+'↩','hit');if(src.hp<=0)killEnemy(src);}}
// incoming damage multiplier (support companions' Harmony)
function profKDmgIn(){return T<(PK.cbUntil||0)?0.9:1;}
function profKDmgOut(){return T<(PK.cbUntil||0)?1.1:1;}
/* ---------- per-frame upkeep: CC breaks / flee movement, stealth + reflector expiry ---------- */
function updProfK(dt){if(PK.cc.size)for(const e of PK.cc){if(e.dead||(!isMezzed(e)&&!isFeared(e))){PK.cc.delete(e);if(!e.dead&&T>=(e.mezUntil||0))e.mezUntil=0;continue;}
    if(isMezzed(e)&&e.hp<(e.mezHp||0)-0.5){e.mezUntil=0;e.stunUntil=Math.min(e.stunUntil,T);if(!isFeared(e))PK.cc.delete(e);floatText(entChest(e,tmpV),'Woke','info');if(e.state!=='chase')aggro(e);continue;}
    if(isFeared(e)){const dx=e.pos.x-P.pos.x,dz=e.pos.z-P.pos.z,d=Math.hypot(dx,dz)||1;if(d<40){moveToward(e,e.pos.x+dx/d*6,e.pos.z+dz/d*6,e.T.speed*0.85,dt,0.1);e.animT+=dt;e.moving=1;}}}
  if(P.stealthUntil&&!stealthed())breakStealth();if(P.reflUntil&&T>=P.reflUntil){P.reflUntil=0;shieldFx(false);}
  if(PK.fade&&PK.fade.g!==(PM&&PM.g)){PK.fade=null;if(stealthed())fadeModel(true);}}
function profKChips(){let b='';if(stealthed())b+=`<span class="bf">🌑<b>${Math.ceil(P.stealthUntil-T)}s</b></span>`;if(T<(P.reflUntil||0))b+=`<span class="bf">🔰<b>${Math.ceil(P.reflUntil-T)}s</b></span>`;if(T<(PK.cbUntil||0))b+=`<span class="bf">✦<b>${Math.ceil(PK.cbUntil-T)}s</b></span>`;return b;}
/* ---------- companion AI for the new roles: support (Harmony pulse / light heal) and control (mez or root an add) ---------- */
function teamTactics(al,dt,teles){teamTactics_v1(al,dt,teles);const fight=typeof teamInCombat==='function'?teamInCombat():true;
  for(const a of al){if(a.dead)continue;
    if(a.role==='support'){a.supCd=(a.supCd==null?3:a.supCd)-dt;if(a.supCd>0||!fight)continue;a.supCd=8;
      const low=[{e:P,f:P.dead?1:P.hp/S.maxHp}].concat(al.map(o=>({e:o,f:o.hp/o.maxHp}))).sort((x,y)=>x.f-y.f)[0];
      if(low&&low.f<0.55){if(low.e===P)healPlayer(S.maxHp*0.08);else allyHeal(low.e,low.e.maxHp*0.1);ringFx(low.e.pos.x,low.e.pos.z,0x6dff8a,1.4,0.35);}
      PK.cbUntil=T+8;for(const o of al)tbSet(o,'harmony',T+8,1.12,0.1);ringFx(a.pos.x,a.pos.z,0xffd76a,6,0.6);}
    else if(a.role==='control'){a.ccCd=(a.ccCd==null?2:a.ccCd)-dt;if(a.ccCd>0||!fight)continue;
      const tgt=validTarget();const foes=enemies.filter(e=>!e.dead&&e.state==='chase'&&dist2D(e.pos,P.pos)<24&&!ccImmune(e)&&!isMezzed(e)&&!isFeared(e));
      if(!foes.length){a.ccCd=1.5;continue;}a.ccCd=9;const adds=foes.filter(e=>e!==tgt&&e!==a.target);
      if(adds.length&&enemies.filter(e=>!e.dead&&e.state==='chase'&&dist2D(e.pos,P.pos)<24).length>=2){const e=adds[0];if(mezApply(e,6)){a.rotY=Math.atan2(e.pos.x-a.pos.x,e.pos.z-a.pos.z);a.atkT=0.35;}}
      else{const e=foes[0];e.rootUntil=Math.max(e.rootUntil||0,T+3);floatText(entChest(e,tmpV),'Rooted','info');ringFx(e.pos.x,e.pos.z,0xb46bff,1.6,0.4);}}}}

/* ---------- perk lines (Tier 1-3 + a Lv 15 active) and Tier-4 masteries ---------- */
Object.assign(TEAM_ROLES,{support:{n:'Support',ic:'✦'}});
Object.assign(PERK_LINES,{
  riftlore:{n:'Riftlore',ic:'🗿',prof:'binder',d:'Riftbinder: deeper binds and sturdier constructs.'},
  reverie:{n:'Reverie',ic:'💤',prof:'mind',d:'Dreamshaper: longer lulls and a deeper well of focus.'},
  cadence:{n:'Cadence',ic:'🎶',prof:'harm',d:'Anthemist: stronger anthems and steadier footing.'},
  ledger:{n:'Iron Ledger',ic:'⚖️',prof:'exact',d:'Exactor: sharper siphons and collateral to spare.'},
  innerway:{n:'Inner Way',ic:'☯️',prof:'fist',d:'Ironpalm: hard knuckles and flowing footwork.'},
  umbra:{n:'Umbral Arts',ic:'🌑',prof:'shade',d:'Veilblade: keen edges and soft steps.'},
  artillery:{n:'Artillery Doctrine',ic:'💣',prof:'siege',d:'Siegebreaker: heavier rounds and blast plating.'}});
(function(){const L=c=>(c&&c.level)||1,R=Math.round;
  const def=(id,line,tier,name,icon,ranks,mods,txt,ab)=>{PERKS[id]={id,line,tier,name,icon,ranks,mods,txt,ab:ab?'pk_'+id:null};
    if(ab){ab.id='pk_'+id;ab.name=name;ab.icon=icon;ab.perk=id;ab.prof='perk';ab.line='pk_'+id;ab.tier=1;ab.req=[];PERK_AB[ab.id]=ab;}};
  const mdef=(id,line,name,icon,mods,txt)=>{PERKS[id]={id,line,tier:4,name,icon,ranks:3,mods,txt,ab:null,tierReq:3};};
  def('boundwill','riftlore',1,'Bound Will','🧿',5,r=>({weave:3*r,int:r}),'+{weave} Weave Craft, +{int} Intelligence');
  def('sharedpulse','riftlore',2,'Shared Pulse','💓',3,(r,c)=>({hp:R(r*(5+L(c))),pool:2*r}),'+{hp} max health, +{pool} Vyre Pool');
  def('shardrain','riftlore',3,'Shard Rain','🌠',1,()=>({}),'Active: rift-glass rains on the target for 3 waves of 95% area damage.',{kind:'barrage',radius:4.5,mult:0.95,delay:0.5,waves:3,gap:0.4,color:0x7ff8ff,cost:30,cd:40,range:24,needTarget:true,desc:'Perk: 3 waves of 95% area damage.'});
  def('lucid','reverie',1,'Lucid Focus','🧠',5,r=>({psy:2*r,weave:2*r}),'+{psy} Psychic, +{weave} Weave Craft');
  def('dreamthief','reverie',2,'Dreamthief','🫧',3,(r,c)=>({en:R(r*(4+L(c)/2)),pool:2*r}),'+{en} max energy, +{pool} Vyre Pool');
  def('massslumber','reverie',3,'Mass Slumber','🌙',1,()=>({}),'Active: mesmerise every enemy within 8m of the target for 7s.',{kind:'mezAoe',radius:8,dur:7,color:0xffb8f0,cost:35,cd:60,range:24,needTarget:true,desc:'Perk: 8m area mez for 7s.'});
  def('resonant','cadence',1,'Resonant Voice','🎙️',5,r=>({psy:r,treat:2*r,weave:r}),'+{psy} Psychic, +{treat} Treatment, +{weave} Weave Craft');
  def('steadybeat','cadence',2,'Steady Beat','🥁',3,(r,c)=>({hp:R(r*(5+L(c))),dr:r}),'+{hp} max health, +{dr}% damage reduction');
  def('encore','cadence',3,'Encore','👏',1,()=>({}),'Active: heal you and every ally within 22m for 30% of max health, plus 3% per second for 6s.',{kind:'teamheal',pct:0.3,hot:0.03,cost:30,cd:60,range:0,needTarget:false,desc:'Perk: 30% team heal + HoT.'});
  def('sharpaccounts','ledger',1,'Sharp Accounts','🧾',5,r=>({int:r,power:r,weave:r}),'+{int} Intelligence, +{power}% power, +{weave} Weave Craft');
  def('collateral','ledger',2,'Collateral','🏦',3,(r,c)=>({hp:R(r*(5+L(c))),dr:r}),'+{hp} max health, +{dr}% damage reduction');
  def('foreclosure','ledger',3,'Foreclosure','🏚️',1,()=>({}),'Active: siphon every enemy within 7m of the target (120% damage, -25% enemy damage for 12s); you gain power per foe.',{kind:'stealAoe',radius:7,mult:1.2,dur:12,weak:0.25,tmods:{power:[3,0.2]},ally:0.08,color:0xff5a3a,cost:35,cd:50,range:24,needTarget:true,desc:'Perk: area siphon, power per foe.'});
  def('ironknuckles','innerway',1,'Iron Knuckles','👊',5,r=>({str:r,wpn:3*r}),'+{str} Strength, +{wpn} Weapon Handling');
  def('flowingstep','innerway',2,'Flowing Step','🍃',3,r=>({evade:4*r,agi:2*r}),'+{evade} Evasion, +{agi} Agility');
  def('sevenstorms','innerway',3,'Seven Storms','🌪️',1,()=>({}),'Active: seven lightning strikes on your target for 65% damage each.',{kind:'flurry',hits:7,mult:0.65,cost:25,cd:35,range:4,needTarget:true,desc:'Perk: 7 strikes at 65%.'});
  def('keenedge','umbra',1,'Keen Edge','🗡️',5,r=>({crit:r,agi:r}),'+{crit}% crit, +{agi} Agility');
  def('softsteps','umbra',2,'Soft Steps','🐾',3,r=>({evade:4*r,sen:2*r}),'+{evade} Evasion, +{sen} Sense');
  def('shadowdance','umbra',3,'Shadow Dance','🌘',1,()=>({}),'Active: vanish mid-fight for 6s; your next attack deals 2.2x damage and always crits.',{kind:'stealth',vanish:true,dur:6,opener:2.2,cost:20,cd:60,range:0,needTarget:false,desc:'Perk: in-combat vanish, 2.2x opener.'});
  def('heavyrounds','artillery',1,'Heavy Rounds','🔩',5,r=>({power:r,str:r,wpn:r}),'+{power}% power, +{str} Strength, +{wpn} Weapon Handling');
  def('blastplating','artillery',2,'Blast Plating','🧱',3,(r,c)=>({dr:r,hp:R(r*(6+L(c)))}),'+{dr}% damage reduction, +{hp} max health');
  def('mortarrain','artillery',3,'Mortar Rain','🎆',1,()=>({}),'Active: four waves of mortar fire on the target for 85% area damage each.',{kind:'barrage',radius:5,mult:0.85,delay:0.6,waves:4,gap:0.4,color:0xff8a2a,cost:35,cd:45,range:24,needTarget:true,desc:'Perk: 4 waves of 85% area damage.'});
  mdef('m_riftlore','riftlore','Riftbond Mastery','🌀',r=>({weave:4*r,int:2*r}),'+{weave} Weave Craft, +{int} Intelligence');
  mdef('m_reverie','reverie','Dreamweave Mastery','🌌',r=>({psy:3*r,power:r}),'+{psy} Psychic, +{power}% power');
  mdef('m_cadence','cadence','Anthem Mastery','🎼',(r,c)=>({treat:3*r,hp:R(r*(3+L(c)/2))}),'+{treat} Treatment, +{hp} max health');
  mdef('m_ledger','ledger','Usury Mastery','💰',r=>({power:2*r,int:r}),'+{power}% power, +{int} Intelligence');
  mdef('m_innerway','innerway','Stillstorm Mastery','⛈️',r=>({agi:3*r,crit:r}),'+{agi} Agility, +{crit}% crit');
  mdef('m_umbra','umbra','Nightblade Mastery','🌑',r=>({crit:r,evade:4*r}),'+{crit}% crit, +{evade} Evasion');
  mdef('m_artillery','artillery','Bombardier Mastery','🎯',r=>({dr:r,power:r}),'+{dr}% damage reduction, +{power}% power');})();
function profKExports(){return {ROLE,openPanel,dist2D,hitFoe,renderCards,PROF_TAG,PROF_WT,PROF_FAM,sealProfs,reqLabel,PROFS_K,profKData,isPetProf,PK,ccImmune,mezApply,fearApply,isMezzed,isFeared,stealthed,breakStealth,stealthOpener,openerTake,profKHurt,tbMul,tbDr,tmodsAt,updProfK,profKChips,teamTactics,PETDEF,buildBot,KIND,wreqK};}
