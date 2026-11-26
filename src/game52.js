/* =========================================================================================================
   Build W3 — Weave library for binder, mind, harm, exact, fist, shade and siege (W2 did the first seven), Weave
   disc sources for every W2/W3 rank, Matrix-cap gear rolls.
   - WV3_LINES uses the W2 table shape and generator rules (game51): ranked lines, original names, element + style
     tags for the W2 effects engine, wreq/wreqK requirements, the same pace cap (new damage ranks stay at <=55% of
     the profession's best existing damage Weave) and simSkip for new support lines. W3 ranks carry w2=1 (same rules
     everywhere W2 ranks are handled) plus w3=1.
   - Existing class lines of these seven professions get element/style tags (visual only). steal / stealAoe / drain /
     fear / mezAoe go through fx2Wrap; melee strike / flurry get an impact flash on hit. Everything is skipped in sims.
   - Disc sources: each W2/W3 rank has one source (w.src3): vendor, drop, mission, writ (writ exchange), boss,
     vigil (Vigil Stair shop + guardians) or rare (✦ rare spawns). The top rank of a 3+ rank line at level 60+ is
     'elite': only from hard-mode / raid bosses, Vigil Stair guardians on floor 20+, and level 60+ rare spawns.
     genDiskForLevel(lv,ctx) filters by context; w.src feeds the Weave Book "where to get" line (wvWhere).
   - Matrix: Rare+ headgear and Cortex implants can roll a Matrix bonus; the Vigil Stair shop sells a Lattice Cortex.
   No new localStorage keys. Does not touch game49 PROF_ENR or game41 Vigil Stair scaling.
   ========================================================================================================= */
const WV3_REF={binder:['riftshard','riftshard',0.8],mind:['psyspike','psyspike',1],harm:['crescendo','crescendo',1],exact:['writ','writ',1],
  fist:['palmstrike','whirlkick',1],shade:['ambush','ambush',1],siege:['shellburst','hailfire',1]};
const W3buff=(a,b,c)=>(L,i)=>({buff:{dur:180,mods:LL=>{const o={};if(a)o[a]=Math.round((6+LL*1.2)*(1+i*0.25));if(b)o[b]=Math.round((4+LL*0.8)*(1+i*0.25));o.dr=2+i*2;if(c)o.hp=Math.round((10+LL*3)*(1+i*0.2));return o;}}});
const WV3_LINES=[
 // ---- binder (Intelligence + Weave Craft): rift pet-caster ----
 ['binder','riftlash','nuke','🌀','void','bolt',4,0.85,[6,26,48,72,94],['Rift Lash','Rift Scourge'],null],
 ['binder','gravewell','aoeT','🕳️','void','erupt',14,0.85,[14,48,88],['Gravewell','Gravewell Abyss'],(L,i)=>({radius:Math.min(12,7+i*2)})],
 ['binder','bindcircle','aoeT','⭕','frost','erupt',16,0.35,[18,52,86],['Binding Circle','Binding Seal'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:4+i,fam:'cc'})],
 ['binder','siphonbond','dot','🩸','void','dot',9,0.85,[10,40,76],['Siphon Bond','Essence Siphon'],()=>({dur:9})],
 ['binder','wardsigil','buff','🔰','radiant','self',5,0,[8,44,80],['Warding Sigil','Bastion Sigil'],W3buff('body','evade',1)],
 ['binder','pactmend','hot','💠','life','heal',14,0,[12,46,82],['Pact Mending','Pact Renewal'],(L,i)=>({pct:r2(0.035+i*0.01),dur:10})],
 ['binder','hexbrand','hex','🔯','void','hex',14,0,[20,66],['Hex Brand','Doom Brand'],(L,i)=>({dur:14,amp:r2(1.15+i*0.08),weak:r2(0.15+i*0.1)})],
 // ---- mind (Psychic + Weave Craft): control caster ----
 ['mind','thoughtspear','nuke','🧠','void','beam',3.5,0.85,[6,22,40,58,76,94],['Thought Spear','Thoughtpiercer'],null],
 ['mind','psiquake','aoeSelf','💫','shock','nova',14,0.8,[14,40,66,92],['Psi Quake','Psi Cataclysm'],(L,i)=>({radius:Math.min(12,8+i)})],
 ['mind','dreadfog','dot','🌫️','void','dot',10,0.85,[10,32,56,82],['Dread Fog','Dread Miasma'],()=>({dur:10})],
 ['mind','mindward','buff','🛡️','shock','self',5,0,[8,40,76],['Mind Ward','Unbending Will'],W3buff('body','evade',1)],
 ['mind','calmflow','hot','💧','life','heal',14,0,[12,46,80],['Calm Flow','Serene Flow'],(L,i)=>({pct:r2(0.035+i*0.01),dur:10})],
 ['mind','fraygrip','aoeT','🕸️','frost','erupt',16,0.35,[18,52,86],['Fraying Grip','Unravelling Grip'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:5+i,fam:'cc'})],
 ['mind','frailty','hex','🥀','void','hex',12,0,[16,50,84],['Frailty','Utter Frailty'],(L,i)=>({dur:15,amp:r2(1.2+i*0.07),weak:r2(0.2+i*0.08)})],
 // ---- harm (Psychic + Weave Craft): war-chanter support ----
 ['harm','shrill','nuke','🎵','shock','beam',3,0.85,[6,22,40,58,76,94],['Shrill Note','Glasscrack Note'],null],
 ['harm','dirge','dot','⚰️','void','dot',10,0.85,[10,30,52,78],['Dirge','Grave Dirge'],()=>({dur:10})],
 ['harm','tremor','aoeT','🥁','shock','erupt',14,0.8,[14,40,68,96],['Tremor Chord','Earthsong Chord'],(L,i)=>({radius:Math.min(12,7+i*1.5)})],
 ['harm','lullsong','mez','🎶','void','dot',18,0,[16,46,80],['Lullsong','Deep Lullsong'],(L,i)=>({dur:8+i*3,fam:'cc'})],
 ['harm','canticle','teambuff','🕯️','radiant','team',10,0,[12,36,62,90],['Canticle of Shelter','Canticle of Bastions'],(L,i)=>({dur:120,tmods:{dr:[2+i,0.04],hp:[8+i*4,3]},allyDr:r2(0.05+i*0.02)})],
 ['harm','resonance','buff','🔔','shock','self',5,0,[8,44,82],['Resonant Guard','Resonant Fortress'],W3buff('body','evade',1)],
 ['harm','sournote','hex','🎼','void','hex',14,0,[18,54,88],['Sour Note','Ruinous Note'],(L,i)=>({dur:14,amp:r2(1.15+i*0.08),weak:r2(0.2+i*0.08)})],
 // ---- exact (Intelligence + Weave Craft): debt-collector debuffer ----
 ['exact','auditbolt','nuke','📜','kinetic','bolt',3.5,0.85,[6,22,40,58,76,94],['Audit Bolt','Final Audit'],null],
 ['exact','foreclose','aoeT','🏚️','kinetic','erupt',14,0.8,[12,36,62,90],['Foreclosure','Total Foreclosure'],(L,i)=>({radius:Math.min(12,7+i*1.5)})],
 ['exact','garnish','dot','🧾','acid','dot',9,0.85,[14,42,70],['Garnishment','Wage Blight'],()=>({dur:9})],
 ['exact','escrow','buff','🔐','radiant','self',5,0,[8,44,80],['Escrow Shell','Escrow Vault'],W3buff('body','evade',1)],
 ['exact','assetfreeze','aoeT','🧊','frost','erupt',16,0.35,[16,48,82],['Asset Freeze','Total Asset Freeze'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:4+i,fam:'cc'})],
 ['exact','lien','hex','⚖️','acid','hex',14,0,[18,52,86],['Lien Mark','Crushing Lien'],(L,i)=>({dur:14,amp:r2(1.2+i*0.08),weak:r2(0.1+i*0.08)})],
 ['exact','settle','heal','💰','life','heal',10,0,[10,40,72],['Settlement','Golden Settlement'],(L,i)=>({pct:r2(0.2+i*0.06)})],
 // ---- fist (Agility + Weave Craft): martial striker ----
 ['fist','qiburst','nuke','✴️','radiant','bolt',3.5,0.85,[6,22,40,58,76,94],['Qi Burst','Qi Sunburst'],null],
 ['fist','cranegale','cone','🪶','kinetic','cone',10,0.85,[12,36,62,90],['Crane Gale','Crane Tempest'],(L,i)=>({range:10+i,angle:1.2})],
 ['fist','floorbreak','aoeSelf','🪨','kinetic','nova',14,0.8,[16,44,72,98],['Floorbreaker','Mountainbreaker'],(L,i)=>({radius:Math.min(12,7+i)})],
 ['fist','pressure','dot','👆','kinetic','dot',8,0.85,[10,34,62],['Pressure Point','Deep Pressure'],()=>({dur:8})],
 ['fist','granitehide','buff','🗿','kinetic','self',5,0,[8,44,80],['Granite Hide','Adamant Hide'],W3buff('body','evade',1)],
 ['fist','lowsweep','aoeSelf','🦵','shock','nova',16,0.35,[18,52,86],['Low Sweep','Earthsweep'],(L,i)=>({radius:Math.min(10,6+i),root:3+i,fam:'cc'})],
 ['fist','calmpalm','hot','🤲','life','heal',14,0,[14,50],['Calm Palm','Still Palm'],(L,i)=>({pct:r2(0.035+i*0.012),dur:10})],
 // ---- shade (Agility + Weave Craft): stealth killer ----
 ['shade','nightneedle','nuke','🗡️','void','beam',3,0.85,[6,22,40,58,76,94],['Night Needle','Umbral Needle'],null],
 ['shade','ashbomb','aoeT','💣','void','erupt',16,0.35,[12,44,78],['Ash Bomb','Blackout Bomb'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:4+i,fam:'cc'})],
 ['shade','bladefan','cone','🔪','kinetic','cone',10,0.85,[14,38,64,92],['Blade Fan','Blade Cyclone'],(L,i)=>({range:10+i,angle:1.2})],
 ['shade','gutvenom','dot','🐍','acid','dot',8,0.85,[16,44,74],['Gutting Venom','Black Venom'],()=>({dur:8})],
 ['shade','shadowskin','buff','🌑','void','self',5,0,[8,42,80],['Shadowskin','Nightskin'],W3buff('evade','body',1)],
 ['shade','preybrand','hex','🎯','void','hex',14,0,[18,52,86],['Hunter\'s Brand','Reaper\'s Brand'],(L,i)=>({dur:14,amp:r2(1.2+i*0.08),weak:0})],
 ['shade','duskmend','heal','🌘','life','heal',10,0,[10,46,82],['Duskmend','Nightmend'],(L,i)=>({pct:r2(0.2+i*0.06)})],
 // ---- siege (Strength + Weave Craft): heavy artillery ----
 ['siege','railspike','nuke','🔩','kinetic','beam',4,0.85,[6,22,40,58,76,94],['Rail Spike','Rail Lance'],null,'n'],
 ['siege','quakeshell','aoeT','🌋','shock','erupt',16,0.35,[14,46,80],['Quake Shell','Groundbreaker Shell'],(L,i)=>({radius:Math.min(12,7+i*1.5),root:3+i,fam:'cc'})],
 ['siege','thermite','field','🔥','fire','pool',16,0.7,[18,44,70,96],['Thermite Pool','Thermite Lake'],(L,i)=>({radius:Math.min(10,6+i),dur:8})],
 ['siege','skyhammer','aoeT','☄️','fire','meteor',24,0.85,[30,65,100],['Skyhammer Strike','Skyhammer Ruin'],(L,i)=>({radius:Math.min(12,8+i*2)})],
 ['siege','plating','buff','🛡️','kinetic','self',5,0,[8,44,80],['Reactive Plating','Fortress Plating'],W3buff('body',null,1)],
 ['siege','hullbreach','hex','🪓','kinetic','hex',14,0,[16,50,84],['Hull Breach','Hull Rupture'],(L,i)=>({dur:14,amp:r2(1.2+i*0.08),weak:0})],
 ['siege','weldpatch','heal','🔧','life','heal',10,0,[10,40,72],['Weld Patch','Arc Weld Patch'],(L,i)=>({pct:r2(0.2+i*0.06)})]
];
const WV3_IDS=[];
(function(){const clash=[];const names=new Set(Object.values(WEAVES).map(w=>w.name));
  for(const [prof,line,kind,icon,el,st,cd,k,lvs,nm,ex,cls] of WV3_LINES){
    if(!PROFS[prof]){clash.push('prof '+prof);continue;}
    const ref=WV3_REF[prof];const cl=cls||(['aoeT','aoeSelf','cone','field','barrage'].includes(kind)?'a':'n');const refLine=cl==='a'?ref[1]:ref[0];const f0=ref[2];
    lvs.forEach((L,i)=>{const id=i?line+(i+1):line;if(WEAVES[id]){clash.push('id '+id);return;}
      const name=i===0?nm[0]:(i===lvs.length-1&&nm[1]?nm[1]:nm[0]+' '+WV2_ROM[i]);if(names.has(name)){clash.push('name '+name);return;}names.add(name);
      const R=wv2Ref(refLine,L);const w={id,line,tier:i+1,prof,lvl:L,name,icon,cd,kind,color:WV2_EL[el].c,fx:{el,st},w2:1,w3:1};
      Object.assign(w,ex?ex(L,i):{});
      const dmgK=['nuke','aoeT','aoeSelf','cone','dot','field','barrage'].includes(kind);
      if(dmgK){const tot=R.r*cd*k*f0;w.mult=r2(kind==='dot'||kind==='field'?tot/w.dur:kind==='barrage'?tot/w.waves:tot);w.cost=Math.max(10,Math.round(R.cost*Math.pow(cd/R.cd,0.8)*Math.max(0.5,k)));}
      else w.cost=Math.round((kind==='buff'?18:kind==='teambuff'?22:14)+L*(kind==='heal'||kind==='hot'||kind==='teamheal'?1.3:1.0)*(1+i*0.05));
      w.range=kind==='aoeSelf'?(w.radius||8):kind==='cone'?w.range:(WV2_RANGE[kind]||0);w.needTarget=!!WV2_RANGE[kind];
      if(kind==='cone'&&!w.range)w.range=12;
      w.req=wreq(prof,L);w.desc=wv2Desc(w);if(i===lvs.length-1&&lvs.length>2)w.desc+=' Top rank.';WEAVES[id]=w;WV3_IDS.push(id);});}
  if(clash.length)throw new Error('W3 weave clash: '+clash.join(', '));
  // pace cap (same rule as W2)
  const dV=w=>(w.mult||1)*(w.shots||1)*(w.waves||1)*(w.radius||w.kind==='cone'?1.25:1)*(w.kind==='dot'||w.kind==='field'?(w.dur||6)*0.7:1)/Math.max(1.2,w.cd||1.2);
  for(const id of WV3_IDS){const w=WEAVES[id];if(SIM_KIND[w.kind]!=='dmg'){w.simSkip=1;continue;}
    const best={};for(const o of Object.values(WEAVES)){if(o.w2||o.excl||o.rare||(o.prof!==w.prof&&o.prof!=='any')||(o.lvl||1)>w.lvl||SIM_KIND[o.kind]!=='dmg'||o.kind==='taunt')continue;const k=o.line||o.id;if(!best[k]||o.tier>best[k].tier)best[k]=o;}
    const ex=Object.values(best).map(dV).sort((a,b)=>b-a);const cap=ex.length?ex[0]*0.55:0;
    const v=dV(w);if(cap&&v>cap){w.mult=r2(w.mult*cap/v);w.capped=1;w.desc=wv2Desc(w)+(w.desc.endsWith(' Top rank.')?' Top rank.':'');}}
  // Mind and Binder (handover: both die mid-Stair under the bot) take their new heal-over-time into the reference sim bar
  // (Mind: Calm Flow fills the spare slot; Binder: Pact Mending replaces the generic Patch, pets/Tether/Riftmend stay)
  const DUR3={calmflow:1,pactmend:1};for(const id of WV3_IDS){const w=WEAVES[id];if(DUR3[w.line])delete w.simSkip;}
  // W3 damage lines are player options: the seven W3 professions' reference bars keep their established kit (no W2-style gap fill; the first
  // sims with it made Mind the fastest solo profession, 58 -> 46 s); only the Mind/Binder heal-over-time goes in
  {const _sw=simWeaves;simWeaves=function(prof,lv){let r=_sw(prof,lv);if(W3PList().includes(prof))r=r.filter(w=>!w.w3);if(prof!=='mind'&&prof!=='binder')return r;
    const best={};for(const id of WV3_IDS){const w=WEAVES[id];if(w.prof!==prof||!DUR3[w.line]||w.lvl>lv)continue;if(!best[w.line]||w.tier>best[w.line].tier)best[w.line]=w;}
    return r.concat(Object.values(best).filter(w=>!r.includes(w)));};}
  {const _sb=simBar;simBar=function(ws,prof){const out=_sb(ws,prof);if(prof!=='binder')return out;const wd=ws.find(w=>DUR3[w.line]);if(!wd||out.includes(wd.id))return out;
    const i=out.indexOf('patch');if(i>=0)out[i]=wd.id;else if(out.length<NSLOTS)out.push(wd.id);return out;};}
  // visual tags for the existing lines of these seven professions (no number changes)
  const EX={riftshard:['void','bolt'],psyspike:['void','beam'],mindleech:['void','bolt'],dread:['void','bolt'],hush:['void','erupt'],discord:['shock','beam'],crescendo:['shock','nova'],
    tithe:['acid','bolt'],skim:['acid','bolt'],levy:['acid','dot'],writ:['kinetic','bolt'],grandlevy:['acid','erupt'],palmstrike:['kinetic','melee'],whirlkick:['kinetic','nova'],
    hundredhands:['radiant','melee'],ambush:['void','melee'],rend:['acid','dot'],glassfan:['frost','nova'],slug:['kinetic','bolt'],shellburst:['fire','erupt'],hailfire:['fire','rain'],napalm:['fire','pool']};
  for(const w of Object.values(WEAVES))if(!w.fx&&EX[w.line]&&W3PList().includes(w.prof))w.fx={el:EX[w.line][0],st:EX[w.line][1]};
  for(const pk in PROFS)for(const a of PROFS[pk].abilities||[])if(!a.fx&&WEAVES[a.id]&&WEAVES[a.id].fx)a.fx=WEAVES[a.id].fx;})();
function W3PList(){return ['binder','mind','harm','exact','fist','shade','siege'];}
var W3P=W3PList();
// projectile kinds of these professions use the W2 wrap; melee kinds flash on the target
for(const k of ['steal','stealAoe','drain','fear','mezAoe'])if(KIND[k])KIND[k]=fx2Wrap(KIND[k]);
function fx3Melee(fn,hits){return function(t,a){const r=fn.apply(this,arguments);if(SIMP||!a||!a.fx||!t)return r;
  try{const f=fx2Spec(a);const n=hits?Math.min(4,a.hits||1):1;for(let i=0;i<n;i++)later(i*0.14,()=>{if(!t||t.dead&&i)return;const c=entChest(t,new V3());fx2Impact(f,c.x,c.y,c.z,i===n-1?1.1:0.7);});}catch(e){}return r;};}
if(KIND.strike)KIND.strike=fx3Melee(KIND.strike,0);if(KIND.flurry)KIND.flurry=fx3Melee(KIND.flurry,1);

/* ---------- disc sources ---------- */
const WV3_SRC=['vendor','drop','mission','boss','writ','vigil','rare'];
function wv3Hash(s){let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;}
function wvSrcOf(w){return (w&&w.src3)||null;}
// trader / quartermaster stock: established discs plus vendor-sourced W2/W3 ranks
function wvVend(w){return !w.src3||w.src3==='vendor';}
const WV3_CTX={drop:['drop','vendor'],vendor:['vendor'],mission:['mission'],writ:['writ'],boss:['boss'],hard:['boss','elite'],vigil:['vigil'],vigilTop:['vigil','elite'],rare:['rare'],rareTop:['rare','elite']};
const WV3_SRCTXT=(w,s)=>{const a=Math.max(1,w.lvl-2),b=w.lvl+4;return {
  vendor:`Trader and hub quartermaster stock from level ${w.lvl}; also drops from enemies level ${a}-${b}`,
  drop:`Drops from enemies level ${a}-${b} (more often from elites)`,
  mission:`Mission and story rewards around level ${a}-${b}; rarely from any enemy level ${a}-${b}`,
  writ:`Mission Writ exchange (✦ 8 writs) from level ${a}; rarely from any enemy level ${a}-${b}`,
  boss:`Dungeon and raid bosses level ${a}-${b}; rarely from any enemy level ${a}-${b}`,
  vigil:`Vigil Stair: Keeper's shop (◈ 40 Vigil Marks) and floor guardians, level ${a}+; rarely from any enemy level ${a}-${b}`,
  rare:`✦ Rare spawns level ${a}-${b}; rarely from any enemy level ${a}-${b}`,
  elite:`Top rank: only from hard-mode dungeon bosses (Veteran or higher), raid bosses, Vigil Stair guardians on floor 20+ and level 60+ ✦ rare spawns`}[s];};
(function(){const lines={};for(const id of WV2_IDS.concat(WV3_IDS)){const w=WEAVES[id];(lines[w.line]||(lines[w.line]=[])).push(w);}
  for(const ln in lines){const ws=lines[ln].sort((a,b)=>a.tier-b.tier);const h=wv3Hash(ln);
    ws.forEach((w,i)=>{let s;if(i===ws.length-1&&ws.length>=3&&w.lvl>=60)s='elite';else if(i===0)s=h%3===0?'drop':'vendor';else{const opt=['drop','mission','boss','writ','rare'].concat(w.lvl>=20?['vigil']:[]);s=opt[(h+i*5)%opt.length];}
      w.src3=s;w.src=WV3_SRCTXT(w,s);});}})();
// genDiskForLevel(lv[,ctx]): established discs + W2/W3 ranks whose source matches the context (ordinary drops can still give any non-top rank,
// but re-roll special-source ranks 70% of the time); elite (top) ranks never drop at random
const W3SIM=()=>SIMP||(typeof SIMST!=='undefined'&&!!SIMST);
// sims (SIMP) keep the established random-number sequence (disc and Matrix rolls don't touch Math.random there), so untouched professions sim exactly as on main
{const _gdl=genDiskForLevel;genDiskForLevel=function(lv,ctx,own){if(W3SIM()&&!own)return _gdl(lv);ctx=ctx||'drop';const ok=WV3_CTX[ctx]||WV3_CTX.drop;
  const top=ok.includes('elite');const pool=Object.values(WEAVES).filter(w=>!w.starter&&!w.mab&&!w.excl&&!w.rare&&w.lvl<=lv+2&&w.lvl>=lv-(w.src3==='elite'?8:4)&&(!w.src3||ok.includes(w.src3)||(ctx==='drop'&&w.src3!=='elite')));
  if(!pool.length)return null;const mine=pool.filter(w=>w.prof===P.prof||w.prof==='any');if(own&&!mine.length)return null;let src=mine.length&&(own||Math.random()<0.75)?mine:pool;
  // special sources favour their own ranks so the source means something (elite ranks first on top-tier kills)
  const el=src.filter(w=>w.src3==='elite');
  if(top&&el.length&&Math.random()<0.3)src=el;else{const ne=src.filter(w=>w.src3!=='elite');if(ne.length)src=ne;const own=src.filter(w=>w.src3&&w.src3!=='drop');if(ctx!=='drop'&&own.length&&Math.random()<0.5)src=own;}
  let w=pick(src);if(ctx==='drop'&&w.src3&&!ok.includes(w.src3)&&Math.random()<0.7)w=pick(src);return genDisk(w.id);};}
function wv3DropAt(e,ctx,ch){if(Math.random()>=ch)return null;const d=genDiskForLevel(Math.min(MAXLVL,e.lv||1),ctx);if(d){d.dropBy=d.dropBy||(e.T&&e.T.name)||'';dropLoot(e.pos.x+0.8,e.pos.z-0.6,d);}return d;}
function wv3OnKill(e){if(SIMP||(typeof SIMST!=='undefined'&&SIMST)||!e||!P||e.ally||e.guard||e.isShard)return;
  const vr=typeof vgRun==='function'?vgRun():null;
  if(vr&&e.vgG&&vr.gd===e){wv3DropAt(e,vr.f>=20?'vigilTop':'vigil',e.vgG.big?1:0.5);return;}
  if(e.rare){wv3DropAt(e,(e.lv||1)>=60?'rareTop':'rare',0.5);return;}
  if(e.boss||e.raidBoss||(e.T&&e.T.boss)){const hm=typeof DUN!=='undefined'&&DUN&&DUN.mode&&DUN.mode.hm?(DUN.mode.hm.tier|0):0;
    wv3DropAt(e,(e.raidBoss||hm>=1)?'hard':'boss',e.raidBoss?0.6:hm>=1?0.45:0.3);}}
{const _ke3=killEnemy;killEnemy=function(e){const was=!!(e&&e.dead);const r=_ke3.apply(this,arguments);try{if(e&&!was&&e.dead)wv3OnKill(e);}catch(err){}return r;};}
// writ exchange + Vigil Stair shop entries
RM_SHOP.push({id:'disk',n:'Requisition: Weave Disc',d:'A Weave Disc for your profession at your level (writ-exchange Weaves)',ic:'💿',w:8});
{const _rb3=rmBuy;rmBuy=function(id){if(id!=='disk')return _rb3.apply(this,arguments);const r=rmi();if(r.writs<8){warn('Need 8 ✦ writs');return false;}
  if(rmPackFull()){warn('Pack full');return false;}const d=genDiskForLevel(clamp(P.level,1,MAXLVL),'writ',1);if(!d){warn('No disc available at your level');return false;}
  P.inv.push(d);r.writs-=8;SFX.loot();toast('💿 '+d.name);save();return true;};}
VG_SHOP.push({k:'vgdisk',ic:'💿',n:'Keeper\'s Weave Disc',d:'A Weave Disc for your profession (Vigil Stair Weaves)',pr:40},
  {k:'lattice',ic:'🧠',n:'Lattice Cortex',d:'A Rare head implant at your level with a Matrix bonus (more running buffs)',pr:90});
{const _vb3=vgBuy;vgBuy=function(k){if(k!=='vgdisk'&&k!=='lattice')return _vb3.apply(this,arguments);const it=VG_SHOP.find(x=>x.k===k),v=vgi();
  if(v.mk<it.pr){warn('Need '+it.pr+' ◈ Vigil Marks');return false;}let i;
  if(k==='vgdisk'){i=genDiskForLevel(clamp(vgLv(),1,MAXLVL),'vigil',1);if(!i){warn('No disc available at your level');return false;}}
  else{i=genImplant(Math.min(IMPQL_MAX(),clamp(vgLv(),1,MAXLVL)*5),'head',2);i.bonus=i.bonus.filter(b=>b.s!=='mx');i.bonus.push({s:'mx',v:3+Math.floor(i.ql/100)});}
  i.dropBy='Keeper\'s shop';if(!invAdd(i)){warn('Your pack is full');return false;}v.mk-=it.pr;SFX.loot();toast(it.ic+' '+i.name);save();return true;};}
/* ---------- Matrix-cap gear rolls (own generator: never draws from Math.random, so gear/sim rolls elsewhere stay exactly as before) ---------- */
let W3R=(Date.now()>>>0)^0x9e3779b9;const w3rand=()=>{W3R=(Math.imul(W3R,1664525)+1013904223)>>>0;return W3R/4294967296;};
{const _gi3=genItem;genItem=function(lvl,slot,rIdx,opt){const it=_gi3.apply(this,arguments);
  try{if(!W3SIM()&&it&&it.kind==='gear'&&it.slot==='head'&&rRank(it.r)>=2&&lvl>=10&&w3rand()<0.35&&!it.bonus.some(b=>b.s==='mx'))it.bonus.push({s:'mx',v:1+Math.floor(lvl/25)});}catch(e){}return it;};}
{const _gim3=genImplant;genImplant=function(ql,slot,rIdx){const it=_gim3.apply(this,arguments);
  try{if(!W3SIM()&&it&&it.slot==='head'&&rRank(it.r)>=1&&it.ql>=40&&w3rand()<0.3&&!it.bonus.some(b=>b.s==='mx'))it.bonus.push({s:'mx',v:1+Math.floor(it.ql/120)});}catch(e){}return it;};}
function wv3Count(prof){return Object.values(WEAVES).filter(w=>w.prof===prof&&!w.excl).length;}
function w3Exports(){return {WV3_IDS,WV3_LINES,WV3_SRC,wvSrcOf,wvVend,wv3Count,wv3OnKill,lootN:()=>loots.length,genDiskForLevel:(lv,c,o)=>genDiskForLevel(lv,c,o),genItem:(a,b,c,d)=>genItem(a,b,c,d),genImplant:(a,b,c)=>genImplant(a,b,c)};}
