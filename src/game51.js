// ---------- Build W2: Weave library (vanguard, weaver, mender, flux, runner, wright, wild) + code-built spell effects ----------
// New lines are generated from data and anchored to each profession's existing nuke/AoE curve (side-grades, k<1), so pacing holds.
// Every rank uses the profession's normal wreq() skills (no new sub-skills). Existing ids/lines are untouched; fx tags are visual only.
const WV2_EL={fire:{n:'fire',c:0xff6a1a,h:0xffd27a},frost:{n:'frost',c:0x7fe6ff,h:0xeafcff},shock:{n:'shock',c:0x9f8cff,h:0xf2eeff},void:{n:'void',c:0xa03bff,h:0xff7af0},
  kinetic:{n:'kinetic',c:0xffc84a,h:0xfff2c0},acid:{n:'acid',c:0x8dff3a,h:0xeaff9a},radiant:{n:'radiant',c:0xfff0a0,h:0xffffff},life:{n:'life',c:0x6dff8a,h:0xe0ffe0}};
const WV2_REF={vanguard:['breach','orbital',1],weaver:['arc','storm',1],mender:['purge','purge',1],flux:['sunder','starfall',1],runner:['rattle','tangle',1],wright:['breach','orbital',0.55],wild:['thornvolley','stampede',1]};
const WV2_ROM=['','II','III','IV','V','VI','VII','VIII'];
function wv2Ref(line,L){const ws=Object.values(WEAVES).filter(w=>w.line===line&&!w.excl&&w.mult&&w.cd).sort((a,b)=>a.lvl-b.lvl);if(!ws.length)return {r:0.5,cost:20,cd:5};let b=ws[0];for(const w of ws)if(w.lvl<=L)b=w;
  const per=b.mult*(b.waves||1)*(b.shots||1)*(b.kind==='field'||b.kind==='dot'?(b.dur||1):1);let r=per/b.cd,cost=b.cost||20;if(L<b.lvl){const f=(L+10)/(b.lvl+10);r*=f;cost*=f;}return {r,cost,cd:b.cd};}
const r2=v=>Math.round(v*100)/100,pc2=v=>Math.round(v*100)+'%';
// [prof,line,kind,icon,el,style,cd,k,levels,[baseName,capName],extra(L,i)->fields,desc(w)]
const WV2_LINES=[
 // ---- vanguard (Weapon Handling + Weave Craft) ----
 ['vanguard','tracer','nuke','🔆','kinetic','bolt',4,0.85,[6,20,38,56,74,92],['Tracer Burst','Tracer Lance'],null],
 ['vanguard','shrapnel','cone','💥','kinetic','cone',10,0.85,[11,30,50,70,90],['Shrapnel Fan','Shrapnel Tempest'],(L,i)=>({range:11+i,angle:1.2})],
 ['vanguard','incend','dot','🔥','fire','dot',9,0.85,[14,34,54,76],['Incendiary Slug','Firebrand Slug'],()=>({dur:8})],
 ['vanguard','armorcrack','hex','🪓','kinetic','hex',14,0,[16,46,80],['Armour Crack','Plate Splitter'],(L,i)=>({dur:14,amp:r2(1.2+i*0.08),weak:0})],
 ['vanguard','holdline','teambuff','🚩','radiant','team',10,0,[18,44,72,96],['Hold the Line','Unbroken Line'],(L,i)=>({dur:120,tmods:{dr:[3+i,0.05],hp:[8+i*4,3]},allyDr:r2(0.06+i*0.02)})],
 ['vanguard','concuss','aoeT','💫','shock','erupt',16,0.35,[24,52,84],['Concussion Shell','Thunderclap Shell'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:3+i,fam:'cc'})],
 ['vanguard','bastion','buff','🧱','kinetic','self',5,0,[8,40,78],['Bastion Frame','Citadel Frame'],(L,i)=>({buff:{dur:180,mods:LL=>({body:Math.round((6+LL*1.2)*(1+i*0.25)),dr:2+i*2,hp:Math.round((10+LL*3)*(1+i*0.2))})}})],
 // ---- weaver (Psychic + Weave Craft) ----
 ['weaver','voidneedle','nuke','🪡','void','beam',3,0.9,[8,24,42,60,78,96],['Void Needle','Abyssal Needle'],null],
 ['weaver','rimegrip','aoeT','❄️','frost','erupt',16,0.4,[12,36,64,90],['Rime Grip','Glacier Grip'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:5+i,fam:'cc'})],
 ['weaver','hollow','hex','🕳️','void','hex',12,0,[15,40,68,94],['Hollowing Curse','Unmaking Curse'],(L,i)=>({dur:15,amp:r2(1.25+i*0.07),weak:r2(0.2+i*0.08)})],
 ['weaver','mindrot','dot','🧠','void','dot',10,0.85,[10,28,48,70,92],['Mind Rot','Mind Blight'],()=>({dur:10})],
 ['weaver','ripple','aoeSelf','〰️','shock','nova',14,0.8,[20,45,72,98],['Vyre Ripple','Vyre Upheaval'],(L,i)=>({radius:Math.min(12,8+i)})],
 ['weaver','glassward','buff','🔷','frost','self',5,0,[14,50,86],['Glass Ward','Prism Ward'],(L,i)=>({buff:{dur:180,mods:LL=>({evade:Math.round((5+LL*1.2)*(1+i*0.25)),body:Math.round((4+LL*0.8)*(1+i*0.25)),dr:2+i*2})}})],
 ['weaver','lullglyph','mez','🌀','void','dot',18,0,[16,44,76],['Lull Glyph','Slumber Glyph'],(L,i)=>({dur:8+i*3})],
 // ---- mender (Treatment + Weave Craft) ----
 ['mender','quickstitch','heal','🩹','life','heal',3,0,[4,18,36,58,80,98],['Quickstitch','Lifestitch'],(L,i)=>({pct:r2(0.12+i*0.03)})],
 ['mender','breathcircle','teamheal','🫧','life','heal',9,0,[12,32,56,84],['Circle of Breath','Circle of Dawn'],(L,i)=>({pct:r2(0.14+i*0.04),hot:r2(0.01+i*0.004)})],
 ['mender','sanctum','teambuff','⛪','radiant','team',10,0,[15,40,70,95],['Sanctum Chord','Sanctum Choir'],(L,i)=>({dur:120,tmods:{hp:[10+i*5,4],dr:[2+i,0.04]},allyDr:r2(0.06+i*0.02)})],
 ['mender','dawnsear','nuke','☀️','radiant','bolt',5,0.85,[10,30,50,72,94],['Searing Light','Searing Dawn'],null,'a'],
 ['mender','bloom','aoeT','🌼','radiant','erupt',12,0.85,[22,48,76,99],['Radiant Bloom','Radiant Zenith'],(L,i)=>({radius:Math.min(12,8+i)})],
 ['mender','halobind','aoeT','⭕','radiant','erupt',16,0.3,[14,44,78],['Halo Bind','Halo Prison'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:4+i,fam:'cc'})],
 ['mender','lifeward','hot','🌿','life','heal',16,0,[9,34,62,88],['Life Ward','Evergreen Ward'],(L,i)=>({pct:r2(0.03+i*0.008),dur:10})],
 // ---- flux (Intelligence + Weave Craft) ----
 ['flux','emberlash','nuke','🔥','fire','bolt',3,0.9,[7,26,50,74,94],['Ember Lash','Inferno Lash'],null],
 ['flux','pyre','aoeT','🌋','fire','erupt',12,0.9,[12,38,66,92],['Pyre Column','Pyre Cathedral'],(L,i)=>({radius:Math.min(12,7+i)})],
 ['flux','forked','nuke','⚡','shock','beam',5,0.9,[15,45,72,97],['Forked Current','Skysplitter Current'],null],
 ['flux','magma','field','🫕','fire','pool',16,0.85,[18,44,70,96],['Magma Pool','Magma Sea'],(L,i)=>({radius:Math.min(10,6+i),dur:8,fam:'dot'})],
 ['flux','kindle','hex','🔥','fire','hex',14,0,[16,48,84],['Kindling Mark','Pyre Mark'],(L,i)=>({dur:14,amp:r2(1.2+i*0.08),weak:0})],
 ['flux','cindersnare','aoeT','⛓️','fire','erupt',16,0.35,[14,46,80],['Cinder Snare','Magma Shackles'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:4+i,fam:'cc'})],
 ['flux','heatshroud','buff','🛡️','fire','self',5,0,[20,60],['Heat Shroud','Sunfire Shroud'],(L,i)=>({buff:{dur:180,mods:LL=>({body:Math.round((5+LL)*(1+i*0.3)),evade:Math.round((4+LL*0.8)*(1+i*0.3)),pool:Math.round(8+LL*1.5)})}})],
 ['flux','skyfall','aoeT','☄️','fire','meteor',24,0.9,[30,65,100],['Skyfall Meteor','Worldbreaker Meteor'],(L,i)=>({radius:Math.min(12,9+i)}),'a'],
 // ---- runner (Agility + Weave Craft) ----
 ['runner','ricochet','nuke','🎯','kinetic','bolt',2.5,0.85,[6,20,38,56,74,92],['Ricochet Shot','Ricochet Storm'],null],
 ['runner','flashpowder','aoeT','✨','radiant','erupt',16,0.35,[14,42,78],['Flash Powder','Blinding Flare'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:4+i,fam:'cc'})],
 ['runner','expose','hex','🎯','kinetic','hex',12,0,[16,50,84],['Expose Weakness','Laid Bare'],(L,i)=>({dur:14,amp:r2(1.15+i*0.07),weak:0})],
 ['runner','tripwire','field','🪤','shock','pool',14,0.8,[18,46,72,98],['Tripwire Field','Tripwire Web'],(L,i)=>({radius:Math.min(10,6+i),dur:8}),'a'],
 ['runner','bleedcut','dot','🩸','kinetic','dot',8,0.85,[10,30,52,80],['Bleeding Cut','Deep Cut'],()=>({dur:8})],
 ['runner','adrenal','buff','💨','kinetic','self',5,0,[12,48,88],['Adrenal Rush','Adrenal Surge'],(L,i)=>({buff:{dur:180,mods:LL=>({run:Math.round(20+i*15),evade:Math.round((5+LL)*(1+i*0.25)),pool:Math.round(6+LL)})}})],
 ['runner','fieldstitch','heal','🩹','life','heal',10,0,[8,36,70],['Field Stitch','Combat Stitch'],(L,i)=>({pct:r2(0.25+i*0.08)})],
 // ---- wright (Intelligence + Weave Craft): pets lead, these round out the toolkit ----
 ['wright','scrapbolt','nuke','🔩','shock','bolt',4,0.85,[6,22,40,58,78,96],['Scrap Bolt','Railscrap Bolt'],null],
 ['wright','arcmine','field','💣','shock','pool',16,0.7,[12,36,64,90],['Arc Mine','Arc Minefield'],(L,i)=>({radius:Math.min(10,6+i),dur:8}),'a'],
 ['wright','repairpulse','heal','🔧','life','heal',10,0,[9,32,60,88],['Repair Pulse','Overhaul Pulse'],(L,i)=>({pct:r2(0.25+i*0.07)})],
 ['wright','bulkhead','buff','🧱','kinetic','self',5,0,[14,50,86],['Bulkhead Plating','Dreadnought Plating'],(L,i)=>({buff:{dur:180,mods:LL=>({body:Math.round((6+LL*1.2)*(1+i*0.25)),dr:2+i*2})}})],
 ['wright','jammer','hex','📡','shock','hex',14,0,[18,48,80],['Signal Jammer','Blackout Jammer'],(L,i)=>({dur:14,amp:1,weak:r2(0.3+i*0.1)})],
 ['wright','swarmlet','barrage','🐝','kinetic','rain',18,0.6,[20,50,80,100],['Swarmlet Volley','Swarmlet Cloud'],(L,i)=>({waves:3,gap:0.5,delay:0.4,radius:Math.min(12,7+i)}),'a'],
 // ---- wild (Sense + Weave Craft) ----
 ['wild','stingspore','dot','🍄','acid','dot',8,0.85,[6,22,40,60,82],['Stinging Spores','Choking Spores'],()=>({dur:8})],
 ['wild','grasproots','aoeT','🌱','life','erupt',16,0.35,[12,38,70,96],['Grasping Roots','Strangling Roots'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:5+i,fam:'cc'})],
 ['wild','thornburst','aoeSelf','🌵','acid','nova',14,0.85,[16,40,64,88],['Thorn Burst','Thorn Cataclysm'],(L,i)=>({radius:Math.min(12,8+i)}),'a'],
 ['wild','barkhide','buff','🪵','life','self',5,0,[10,46,84],['Barkhide','Ironbark Hide'],(L,i)=>({buff:{dur:180,mods:LL=>({body:Math.round((6+LL*1.2)*(1+i*0.25)),dr:2+i*2,evade:Math.round((3+LL*0.6)*(1+i*0.25))})}})],
 ['wild','sapmend','hot','💧','life','heal',16,0,[14,44,78],['Sap Mend','Heartwood Mend'],(L,i)=>({pct:r2(0.035+i*0.01),dur:10})],
 ['wild','venomlance','nuke','🐍','acid','beam',4,0.9,[9,26,44,62,80,98],['Venom Lance','Hydra Lance'],null]
];
const WV2_RANGE={nuke:26,aoeT:24,dot:24,hex:24,field:24,barrage:26,mez:24};
function wv2Desc(w){const e=WV2_EL[w.fx.el].n,d={nuke:`Nuke (${e}): ${pc2(w.mult)} damage to the target.`,
  aoeT:w.root?`Control (${e}): erupts on the target for ${pc2(w.mult)} damage within ${w.radius}m and roots them for ${w.root}s.`:`AoE (${e}): erupts on the target for ${pc2(w.mult)} damage to everything within ${w.radius}m.`,
  aoeSelf:`AoE (${e}): a shockwave around you for ${pc2(w.mult)} damage to everything within ${w.radius}m.`,cone:`AoE (${e}): blasts a ${w.range}m cone ahead for ${pc2(w.mult)} damage.`,
  dot:`DoT (${e}): ${pc2(w.mult)} damage per second for ${w.dur}s.`,field:`AoE (${e}): covers the target area (${w.radius}m) for ${pc2(w.mult)} damage per second for ${w.dur}s.`,
  barrage:`AoE (${e}): ${w.waves} waves on the target area, each hitting everything within ${w.radius}m for ${pc2(w.mult)}.`,
  hex:`Debuff: for ${w.dur}s the target${w.amp>1?` takes ${pc2(w.amp-1)} more damage`:''}${w.amp>1&&w.weak?' and':''}${w.weak?` deals ${pc2(w.weak)} less`:''}.`,
  mez:`Control: lulls the target for ${w.dur}s (breaks on damage).`,heal:`Heal: restores ${pc2(w.pct)} of your max health.`,hot:`Heal over time: ${pc2(w.pct)} of max health every second for ${w.dur}s.`,
  teamheal:`Team heal: ${pc2(w.pct)} to you and nearby allies, plus a short regen.`,teambuff:`Team buff (2 min): you and nearby allies take ${pc2(w.allyDr)} less damage; you also gain health and damage reduction.`,
  buff:`Self-buff (3 min): defensive boost (${w.buff?Object.keys(w.buff.mods(50)).map(k=>STATN[k]||k).join(', '):''}).`}[w.kind];return d||'';}
const WV2_IDS=[];
(function(){const clash=[];const names=new Set(Object.values(WEAVES).map(w=>w.name));
  for(const [prof,line,kind,icon,el,st,cd,k,lvs,nm,ex,cls] of WV2_LINES){
    const ref=WV2_REF[prof];const cl=cls||(['aoeT','aoeSelf','cone','field','barrage'].includes(kind)?'a':'n');const refLine=cl==='a'?ref[1]:ref[0];const f0=ref[2];
    lvs.forEach((L,i)=>{const id=i?line+(i+1):line;if(WEAVES[id]){clash.push('id '+id);return;}
      const name=i===0?nm[0]:(i===lvs.length-1&&nm[1]?nm[1]:nm[0]+' '+WV2_ROM[i]);if(names.has(name)){clash.push('name '+name);return;}names.add(name);
      const R=wv2Ref(refLine,L);const w={id,line,tier:i+1,prof,lvl:L,name,icon,cd,kind,color:WV2_EL[el].c,fx:{el,st},w2:1};
      Object.assign(w,ex?ex(L,i):{});
      const dmgK=['nuke','aoeT','aoeSelf','cone','dot','field','barrage'].includes(kind);
      if(dmgK){const tot=R.r*cd*k*f0;w.mult=r2(kind==='dot'||kind==='field'?tot/w.dur:kind==='barrage'?tot/w.waves:tot);w.cost=Math.max(10,Math.round(R.cost*Math.pow(cd/R.cd,0.8)*Math.max(0.5,k)));}
      else w.cost=Math.round((kind==='buff'?18:kind==='teambuff'?22:14)+L*(kind==='heal'||kind==='hot'||kind==='teamheal'?1.3:1.0)*(1+i*0.05));
      w.range=kind==='aoeSelf'?(w.radius||8):kind==='cone'?w.range:(WV2_RANGE[kind]||0);w.needTarget=!!WV2_RANGE[kind];
      if(kind==='cone'&&!w.range)w.range=12;
      w.req=wreq(prof,L);w.desc=wv2Desc(w);if(i===lvs.length-1&&lvs.length>2)w.desc+=' Top rank.';WEAVES[id]=w;WV2_IDS.push(id);});}
  if(clash.length)throw new Error('W2 weave clash: '+clash.join(', '));
  // pace cap: a new damage rank's sim score stays at <=55% (healers 40%) of the profession's best existing damage Weave at that level
  // (true rate: shots, waves, area, DoT length), so new lines replace stale filler/add element, shape and control instead of out-ranking the main lines. New support lines are kept out of the
  // reference sim bars (simSkip) so the sims keep measuring the established kit.
  const dV=w=>(w.mult||1)*(w.shots||1)*(w.waves||1)*(w.radius||w.kind==='cone'?1.25:1)*(w.kind==='dot'||w.kind==='field'?(w.dur||6)*0.7:1)/Math.max(1.2,w.cd||1.2);
  for(const id of WV2_IDS){const w=WEAVES[id];if(SIM_KIND[w.kind]!=='dmg'){w.simSkip=1;continue;}
    const best={};for(const o of Object.values(WEAVES)){if(o.w2||o.excl||o.rare||(o.prof!==w.prof&&o.prof!=='any')||(o.lvl||1)>w.lvl||SIM_KIND[o.kind]!=='dmg'||o.kind==='taunt')continue;const k=o.line||o.id;if(!best[k]||o.tier>best[k].tier)best[k]=o;}
    const ex=Object.values(best).map(dV).sort((a,b)=>b-a);const fr=w.prof==='mender'?0.4:0.55;const cap=ex.length?ex[0]*fr:0;
    const v=dV(w);if(cap&&v>cap){w.mult=r2(w.mult*cap/v);w.capped=1;w.desc=wv2Desc(w)+(w.desc.endsWith(' Top rank.')?' Top rank.':'');}}
  // reference sim bars: the established kit first; new damage lines only fill damage slots the profession can't fill yet (W3 re-balances whole kits)
  {const _sw=simWeaves;simWeaves=function(prof,lv){const all=_sw(prof,lv).filter(w=>!w.simSkip);const old=all.filter(w=>!w.w2);
    const nd=old.filter(w=>SIM_KIND[w.kind]==='dmg'&&w.kind!=='taunt').length;if(nd>=3||prof==='wright'||prof==='mender')return old;
    return old.concat(all.filter(w=>w.w2).sort((a,b)=>dV(b)-dV(a)).slice(0,3-nd));};}
  // visual upgrade for existing nuke/AoE lines (no number changes)
  const EX={sunder:['fire','bolt'],flare:['fire','bolt'],nova:['fire','erupt'],scorch:['fire','pool'],starfall:['radiant','rain'],arc:['shock','beam'],storm:['void','erupt'],stasis:['frost','erupt'],
    leech:['void','dot'],hex:['void','hex'],breach:['kinetic','bolt'],orbital:['fire','rain'],scatter:['kinetic','nova'],suppress:['kinetic','cone'],purge:['radiant','nova'],spike:['radiant','bolt'],
    tangle:['shock','erupt'],snarewire:['shock','bolt'],shockdart:['shock','bolt'],thornvolley:['acid','bolt'],bramble:['life','bolt'],stampede:['kinetic','cone'],sporecloud:['acid','pool'],rattle:['kinetic','bolt']};
  for(const w of Object.values(WEAVES))if(!w.fx&&EX[w.line])w.fx={el:EX[w.line][0],st:EX[w.line][1]};
  for(const pk in PROFS)for(const a of PROFS[pk].abilities||[])if(!a.fx&&WEAVES[a.id]&&WEAVES[a.id].fx)a.fx=WEAVES[a.id].fx;})();

// ---------- spell effects: pooled additive low-poly pieces, capped per graphics level, skipped in sims ----------
const FX2={pool:{},live:[],cur:null,geo:null,spawned:0,dropped:0,peak:0,ms:0,frames:0};
function fx2Cap(){const l=(typeof GFXC!=='undefined'&&GFXC.lvl)||'medium';return l==='low'?36:l==='high'?140:84;}
function fx2Geo(){if(FX2.geo)return FX2.geo;const g={orb:new THREE.IcosahedronGeometry(0.5,1),ring:new THREE.RingGeometry(0.82,1,28),disc:new THREE.CircleGeometry(1,24),
  pillar:new THREE.CylinderGeometry(0.42,0.62,1,8,1,true),shard:new THREE.OctahedronGeometry(0.28,0),beam:new THREE.CylinderGeometry(0.5,0.5,1,6,1,true)};
  g.ring.rotateX(-Math.PI/2);g.disc.rotateX(-Math.PI/2);g.pillar.translate(0,0.5,0);g.beam.rotateX(Math.PI/2);return FX2.geo=g;}
function fx2Get(type,low){const cap=fx2Cap();if(FX2.live.length>=(low?cap*0.7:cap)){FX2.dropped++;return null;}const pl=FX2.pool[type]||(FX2.pool[type]=[]);let m=pl.pop();
  if(!m){m=new THREE.Mesh(fx2Geo()[type],new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));m.userData.fx2=type;m.userData.keepHd=true;}
  m.visible=true;m.rotation.set(0,0,0);scene.add(m);FX2.spawned++;return m;}
// p: {type,x,y,z,c,op,dur,s0:[x,y,z],s1:[x,y,z],vx,vy,vz,g,delay,to:[x,y,z],ease,spin,trail}
function fx2P(p){const m=fx2Get(p.type,p.type==='shard'||p.low);if(!m)return null;m.material.color.setHex(p.c);m.material.opacity=p.delay?0:(p.op==null?1:p.op);m.position.set(p.x,p.y,p.z);
  const s=p.s0;m.scale.set(s[0],s[1],s[2]);if(p.ry)m.rotation.y=p.ry;if(p.look)m.lookAt(p.look[0],p.look[1],p.look[2]);
  const o=Object.assign({m,t:-(p.delay||0),op:p.op==null?1:p.op,fx:p.x,fy:p.y,fz:p.z},p);FX2.live.push(o);FX2.peak=Math.max(FX2.peak,FX2.live.length);return o;}
function fx2Free(i){const o=FX2.live[i];scene.remove(o.m);o.m.visible=false;(FX2.pool[o.type]||(FX2.pool[o.type]=[])).push(o.m);FX2.live.splice(i,1);}
function fx2Upd(dt){for(let i=FX2.live.length-1;i>=0;i--){const o=FX2.live[i];o.t+=dt;if(o.t<0)continue;const k=Math.min(1,o.t/o.dur);const m=o.m;
    if(k>=1){fx2Free(i);if(o.end)o.end();continue;}const e=o.ease==='in'?k*k:1-(1-k)*(1-k);
    m.scale.set(o.s0[0]+(o.s1[0]-o.s0[0])*e,o.s0[1]+(o.s1[1]-o.s0[1])*e,o.s0[2]+(o.s1[2]-o.s0[2])*e);
    if(o.to)m.position.set(o.fx+(o.to[0]-o.fx)*(o.ease==='in'?e:k),o.fy+(o.to[1]-o.fy)*(o.ease==='in'?e:k),o.fz+(o.to[2]-o.fz)*(o.ease==='in'?e:k));
    else if(o.vx!=null){m.position.x+=o.vx*dt;m.position.y+=o.vy*dt;m.position.z+=o.vz*dt;if(o.g)o.vy-=o.g*dt;}
    if(o.spin)m.rotation.y+=o.spin*dt;m.material.opacity=o.op*(o.hold?(k<o.hold?1:1-(k-o.hold)/(1-o.hold)):(1-k));
    if(o.trail&&(o.tt=(o.tt||0)+dt)>0.035){o.tt=0;const q=m.scale.x*0.7;fx2P({type:'orb',low:1,x:m.position.x,y:m.position.y,z:m.position.z,c:o.c2||o.c,op:0.6,dur:0.25,s0:[q,q,q],s1:[q*0.2,q*0.2,q*0.2]});}}}
{const _ur2=updRings;updRings=function(dt){_ur2(dt);if(!FX2.live.length)return;const t0=performance.now();fx2Upd(dt);FX2.ms+=performance.now()-t0;FX2.frames++;};}
const fx2Gy=(x,z)=>heightAt(x,z);
function fx2Scale(a){return 1+Math.min(1.2,((a.tier||1)-1)*0.18)+((a.lvl||1)>=80?0.2:0);}
function fx2Spec(a){const E=WV2_EL[a.fx.el]||WV2_EL.kinetic;return {st:a.fx.st,c:E.c,h:E.h,s:fx2Scale(a),tier:a.tier||1,r:a.radius||0};}
function fx2Hand(){return [P.pos.x+Math.sin(P.rotY)*0.6,P.pos.y+1.35,P.pos.z+Math.cos(P.rotY)*0.6];}
function fx2Charge(f){const h=fx2Hand(),s=f.s;fx2P({type:'orb',x:h[0],y:h[1],z:h[2],c:f.c,op:0.95,dur:0.32,s0:[0.2,0.2,0.2],s1:[0.75*s,0.75*s,0.75*s]});
  fx2P({type:'orb',x:h[0],y:h[1],z:h[2],c:f.h,op:1,dur:0.22,s0:[0.15,0.15,0.15],s1:[0.55*s,0.55*s,0.55*s]});
  const gy=fx2Gy(P.pos.x,P.pos.z)+0.2;fx2P({type:'ring',x:P.pos.x,y:gy,z:P.pos.z,c:f.c,op:0.9,dur:0.45,s0:[0.4,1,0.4],s1:[1.8*s,1,1.8*s]});
  if(f.tier>=3)fx2P({type:'pillar',x:P.pos.x,y:gy,z:P.pos.z,c:f.c,op:0.35,dur:0.4,s0:[1.2,0.2,1.2],s1:[1.6*s,2.6,1.6*s]});}
function fx2Impact(f,x,y,z,big){const s=f.s*(big||1);fx2P({type:'orb',x,y,z,c:f.h,op:1,dur:0.22,s0:[0.4,0.4,0.4],s1:[2.2*s,2.2*s,2.2*s]});
  fx2P({type:'orb',x,y,z,c:f.c,op:0.8,dur:0.35,s0:[0.6,0.6,0.6],s1:[3*s,3*s,3*s]});
  const gy=fx2Gy(x,z)+0.22;fx2P({type:'disc',x,y:gy,z,c:f.c,op:0.6,dur:0.4,s0:[0.5,1,0.5],s1:[2.2*s,1,2.2*s]});
  const n=Math.min(10,3+f.tier);for(let i=0;i<n;i++){const a=Math.random()*6.283,v=5+Math.random()*5*s;fx2P({type:'shard',x,y,z,c:f.h,op:1,dur:0.45,s0:[s,s,s],s1:[0.2,0.2,0.2],vx:Math.cos(a)*v,vy:2+Math.random()*5,vz:Math.sin(a)*v,g:14,spin:9});}}
function fx2Erupt(f,x,z,r,big){const s=f.s*(big||1),gy=fx2Gy(x,z)+0.22;r=Math.max(2,r||2.5);
  fx2P({type:'disc',x,y:gy,z,c:f.c,op:0.55,dur:0.5,s0:[r*0.3,1,r*0.3],s1:[r,1,r]});
  fx2P({type:'ring',x,y:gy+0.05,z,c:f.h,op:1,dur:0.5,s0:[0.4,1,0.4],s1:[r*1.05,1,r*1.05]});
  fx2P({type:'ring',x,y:gy+0.5,z,c:f.c,op:0.85,dur:0.7,delay:0.1,s0:[r*0.3,1,r*0.3],s1:[r*1.3,1,r*1.3]});
  fx2P({type:'pillar',x,y:gy,z,c:f.h,op:0.7,dur:0.55,hold:0.3,s0:[0.6*s,0.2,0.6*s],s1:[1.3*s,(5+f.tier*0.6)*s,1.3*s]});
  const n=Math.min(9,2+f.tier);for(let i=0;i<n;i++){const a=i/n*6.283+Math.random()*0.5,d=r*(0.35+Math.random()*0.45),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
    fx2P({type:'pillar',x:px,y:fx2Gy(px,pz)+0.1,z:pz,c:f.c,op:0.6,dur:0.5,delay:0.05+Math.random()*0.18,hold:0.25,s0:[0.4*s,0.2,0.4*s],s1:[0.8*s,(2.5+Math.random()*2+f.tier*0.3)*s,0.8*s]});}
  fx2Impact(f,x,gy+0.8,z,0.8);}
function fx2Nova(f,x,z,r){const s=f.s,gy=fx2Gy(x,z)+0.2;r=Math.max(3,r||6);
  for(let j=0;j<3;j++)fx2P({type:'ring',x,y:gy+j*0.35,z,c:j===1?f.h:f.c,op:0.9,dur:0.55,delay:j*0.09,s0:[0.6,1,0.6],s1:[r*(1.05+j*0.12),1,r*(1.05+j*0.12)]});
  fx2P({type:'disc',x,y:gy,z,c:f.c,op:0.45,dur:0.45,s0:[1,1,1],s1:[r,1,r]});
  fx2P({type:'orb',x,y:gy+1.2,z,c:f.h,op:0.9,dur:0.3,s0:[0.5,0.5,0.5],s1:[3*s,3*s,3*s]});
  const n=Math.min(12,5+f.tier);for(let i=0;i<n;i++){const a=i/n*6.283,v=r*1.6;fx2P({type:'shard',x,y:gy+0.8,z,c:f.c,op:1,dur:0.55,s0:[1.2*s,1.2*s,1.2*s],s1:[0.3,0.3,0.3],vx:Math.cos(a)*v,vy:1.5,vz:Math.sin(a)*v,g:4,spin:8});}}
function fx2Cone(f,rotY,range){const s=f.s,h=fx2Hand();const n=Math.min(12,6+f.tier);for(let i=0;i<n;i++){const a=rotY+(Math.random()-0.5)*1.1,v=range*1.8*(0.7+Math.random()*0.5);
  fx2P({type:'shard',x:h[0],y:h[1],z:h[2],c:i%2?f.h:f.c,op:1,dur:0.5,s0:[1.3*s,1.3*s,1.3*s],s1:[0.4,0.4,0.4],vx:Math.sin(a)*v,vy:1+Math.random()*2,vz:Math.cos(a)*v,g:6,spin:10});}
  fx2P({type:'orb',x:h[0],y:h[1],z:h[2],c:f.h,op:1,dur:0.25,s0:[0.4,0.4,0.4],s1:[2*s,2*s,2*s]});}
function fx2Beam(f,to){const h=fx2Hand();const c=entChest(to,tmpV);const d=Math.hypot(c.x-h[0],c.y-h[1],c.z-h[2]);const mx=(h[0]+c.x)/2,my=(h[1]+c.y)/2,mz=(h[2]+c.z)/2,w=0.35*f.s;
  fx2P({type:'beam',x:mx,y:my,z:mz,c:f.c,op:0.9,dur:0.32,look:[c.x,c.y,c.z],s0:[w,w,d],s1:[w*0.2,w*0.2,d]});
  fx2P({type:'beam',x:mx,y:my,z:mz,c:f.h,op:1,dur:0.22,look:[c.x,c.y,c.z],s0:[w*0.4,w*0.4,d],s1:[0.03,0.03,d]});}
function fx2Meteor(f,x,z,t){const gy=fx2Gy(x,z),s=f.s*1.3;fx2P({type:'orb',x:x-6,y:gy+22,z:z-3,c:f.c,op:1,dur:t,ease:'in',to:[x,gy+0.8,z],s0:[1.6*s,1.6*s,1.6*s],s1:[2.2*s,2.2*s,2.2*s],trail:1,c2:f.h});
  fx2P({type:'ring',x,y:gy+0.2,z,c:f.c,op:0.8,dur:t,s0:[f.r*1.1,1,f.r*1.1],s1:[0.5,1,0.5]});}
function fx2Rain(f,x,z,r){const gy=fx2Gy(x,z);const n=Math.min(6,2+Math.ceil(f.tier/2));for(let i=0;i<n;i++){const px=x+(Math.random()-0.5)*r*1.2,pz=z+(Math.random()-0.5)*r*1.2;
  fx2P({type:'orb',x:px-2,y:gy+14,z:pz,c:f.h,op:1,dur:0.22,ease:'in',to:[px,fx2Gy(px,pz)+0.4,pz],s0:[0.8*f.s,0.8*f.s,0.8*f.s],s1:[1.1*f.s,1.1*f.s,1.1*f.s]});
  fx2P({type:'pillar',x:px,y:fx2Gy(px,pz)+0.1,z:pz,c:f.c,op:0.6,dur:0.35,delay:0.2,s0:[0.5*f.s,0.2,0.5*f.s],s1:[1.1*f.s,3*f.s,1.1*f.s]});}
  fx2P({type:'ring',x,y:gy+0.25,z,c:f.c,op:0.9,dur:0.45,delay:0.2,s0:[0.5,1,0.5],s1:[r,1,r]});}
function fx2Hit(c,to){if(!to||to===P)return;const f=c.f,x=to.pos.x,z=to.pos.z;const ch=entChest(to,tmpV2);
  if(f.st==='erupt')fx2Erupt(f,x,z,f.r);else if(f.st==='meteor'){fx2Erupt(f,x,z,f.r,1.3);fx2Nova(f,x,z,f.r*1.1);}
  else if(f.st==='pool')fx2Erupt(f,x,z,f.r||3,0.7);else if(f.st==='hex'||f.st==='dot')fx2Impact(f,ch.x,ch.y,ch.z,0.6);else fx2Impact(f,ch.x,ch.y,ch.z,f.r?1.3:1);}
{const _fp2=fireProj;fireProj=function(from,to,color,speed,onHit){const c=FX2.cur;if(!c||SIMP)return _fp2.apply(this,arguments);
  _fp2(from,to,color,speed,()=>{try{fx2Hit(c,to);}catch(e){}onHit();});const p=projs[projs.length-1];if(!p)return;const f=c.f;
  if(f.st==='beam'){p.speed=Math.max(speed,120);p.m.visible=false;fx2Beam(f,to);}
  else if(f.st==='meteor'){const d=Math.hypot(to.pos.x-from.x,to.pos.z-from.z);const tt=0.5;p.speed=Math.max(8,d/tt);p.m.visible=false;fx2Meteor(f,to.pos.x,to.pos.z,tt);}
  else{p.m.scale.setScalar(1.6*f.s);const o=fx2P({type:'orb',x:from.x,y:from.y,z:from.z,c:f.c,op:0.7,dur:Math.min(1.5,Math.hypot(to.pos.x-from.x,to.pos.z-from.z)/Math.max(10,p.speed)),s0:[0.9*f.s,0.9*f.s,0.9*f.s],s1:[0.9*f.s,0.9*f.s,0.9*f.s],to:[to.pos.x,to.pos.y+(to.h||1.6)*0.55,to.pos.z],trail:1,c2:f.h});if(o)o.hold=0.85;}};}
{const _lt2=later;later=function(dt,fn){const c=FX2.cur;if(!c||SIMP)return _lt2(dt,fn);const x=c.t?c.t.pos.x:P.pos.x,z=c.t?c.t.pos.z:P.pos.z;
  return _lt2(dt,()=>{const o=FX2.cur;FX2.cur=c;try{if(c.f.st==='rain'&&c.a.kind==='barrage')fx2Rain(c.f,x,z,c.f.r||7);}catch(e){}try{fn();}finally{FX2.cur=o;}});};}
function fx2Wrap(fn){return function(t,a){if(SIMP||!a||!a.fx)return fn.apply(this,arguments);let f;try{f=fx2Spec(a);}catch(e){return fn.apply(this,arguments);}
  const o=FX2.cur;FX2.cur={f,a,t};try{try{fx2Charge(f);}catch(e){}return fn.apply(this,arguments);}finally{FX2.cur=o;
    try{if(f.st==='nova'&&a.kind==='aoeSelf')fx2Nova(f,P.pos.x,P.pos.z,a.radius);else if(f.st==='cone')fx2Cone(f,P.rotY,a.range||12);}catch(e){}}};}
for(const k of ['nuke','aoeT','aoeSelf','cone','barrage','dot','field','hex','mez','rattle'])if(KIND[k])KIND[k]=fx2Wrap(KIND[k]);
for(const id in ABILITY_FX)if(WEAVES[id]&&WEAVES[id].fx)ABILITY_FX[id]=fx2Wrap(ABILITY_FX[id]);
// direct demo/perf hook: cast a weave's effect at a point without damage
function fx2Demo(id,x,z){const a=WEAVES[id];if(!a||!a.fx||SIMP)return;const f=fx2Spec(a);if(f.st==='nova')fx2Nova(f,x,z,a.radius);else if(f.st==='meteor'){fx2Meteor(f,x,z,0.5);later(0.5,()=>{fx2Erupt(f,x,z,f.r,1.3);fx2Nova(f,x,z,f.r*1.1);});}
  else if(f.st==='rain')fx2Rain(f,x,z,f.r||7);else fx2Erupt(f,x,z,f.r||4);}
function wv2Count(prof){return Object.values(WEAVES).filter(w=>w.prof===prof&&!w.excl).length;}
function w2Exports(){return {WV2_IDS,WV2_LINES,WV2_EL,FX2,fx2Demo,fx2Spec,fx2Cap,wv2Count,wv2Ref,KIND,fx2Live:()=>FX2.live.length,simp:v=>{SIMP=!!v;return SIMP;},rinfo:()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles}),fx2Gfx:l=>{if(l&&typeof GFXC!=="undefined")GFXC.lvl=l;return typeof GFXC!=="undefined"?GFXC.lvl:"?";}};}
