/* ===== Build O: balance simulation hooks (dev-only, inert in play) =====
   SIMP: when true the render loop idles and float text / ring fx are skipped, so the harness can step the real game logic fast.
   SIMST: counters filled by dmgPlayer / healPlayer / allyHeal / allyTakeDmg / playerDie / allyDie while a sim fight runs.
   simChar(prof,lv,rar): a "typical" character sheet for that level (gear of item level lv at rarity rar, implants QL 4*lv,
   skill points spent like a sensible player, best Weave rank per line, perks spent). simFight(o): one boss fight with a bot player. */
var SIMP=false,SIMST=null;
function simStep(dt){T+=dt;updStage1(dt);if(state!=='play')return;
  updPlayer(dt);updStage2(dt);updCamps(dt);updBanks();updWorld2(dt);updRaidPortals(dt);updTeam(dt);updProfK(dt);updQuests(dt);updDyna(dt);updBuildC(dt);
  for(let i=enemies.length-1;i>=0;i--)updEnemy(enemies[i],dt);updProjs(dt);dieStep(dt);updRings(dt);updSched(dt);updLoot(dt);if(DUN)updDungeon(dt);if(P.transit)P.moving=0;
  updXmGate(dt);updSun(dt);fzUpdate(dt);tdUpdate(dt);updFloats(dt);}
const SIM_KIND={heal:'sus',hot:'sus',dr:'sus',teamheal:'sus',petheal:'sus',reflect:'sus',battery:'en',summon:'setup',pet:'setup',petbuff:'setup',teambuff:'setup',morph:'setup',
  nuke:'dmg',aoeSelf:'dmg',barrage:'dmg',aoeT:'dmg',cone:'dmg',rattle:'dmg',field:'dmg',dot:'dmg',strike:'dmg',steal:'dmg',stealAoe:'dmg',flurry:'dmg',drain:'dmg',hex:'dmg',lunge:'dmg',pounce:'dmg',mbite:'dmg',taunt:'dmg',imp:'dmg'};
function simWeaves(prof,lv){const best={};for(const id in WEAVES){const w=WEAVES[id];if(w.excl||(w.prof!==prof&&w.prof!=='any'))continue;if((w.lvl||1)>lv)continue;const k=w.line||id;if(!best[k]||w.tier>best[k].tier)best[k]=w;}return Object.values(best);}
function simAbScore(w){const k=SIM_KIND[w.kind]||(w.buff?'setup':'');if(k==='dmg')return 10+(w.mult||1)*(w.radius?1.2:1)/Math.max(1,w.cd||1)*10;if(k==='setup')return 30;if(k==='sus')return 25;if(k==='en')return 18;return 0;}
// a player-like bar: pet setup, the 3 best damage Weaves, one heal, one damage buff, then more damage / energy; movement-only buffs last
function simBar(ws,prof){const K=w=>SIM_KIND[w.kind]||(w.buff?'setup':'');const dmgV=w=>(w.mult||1)*(w.radius||w.kind==='cone'?1.25:1)*(w.kind==='dot'||w.kind==='field'?(w.dur||6)*0.7:1)/Math.max(1.2,w.cd||1.2);
  const dmg=ws.filter(w=>K(w)==='dmg'&&w.kind!=='taunt').sort((a,b)=>dmgV(b)-dmgV(a));const out=[];const add=w=>{if(w&&!out.includes(w.id)&&out.length<NSLOTS)out.push(w.id);};
  const role=ROLE[prof];const buffMods=w=>{try{return Object.keys(w.buff.mods(50));}catch(e){return [];}};const dmgBuff=w=>w.buff&&buffMods(w).some(m=>['power','crit','weave','wpn','int','psy','agi','str','sen'].includes(m));
  for(const w of ws)if(['summon','pet'].includes(w.kind))add(w);for(const w of ws)if(w.kind==='petbuff')add(w);
  dmg.slice(0,3).forEach(add);
  const heals=ws.filter(w=>K(w)==='sus'&&w.kind!=='petheal').sort((a,b)=>((b.pct||b.heal||0.2)-(a.pct||a.heal||0.2)));
  if(role==='healer'||role==='support'){ws.filter(w=>w.kind==='teamheal'||w.kind==='teambuff').forEach(add);}add(heals[0]);
  ws.filter(dmgBuff).forEach(add);for(const w of ws)if(w.kind==='petheal')add(w);
  dmg.slice(3).forEach(add);add(ws.find(w=>w.kind==='battery'));heals.slice(1).forEach(add);ws.forEach(w=>{if(K(w))add(w);});return out;}
function simChar(prof,lv,rar,id,name){const c={v:2,id:id||('sim_'+prof),name:name||PROFS[prof].name,prof,level:lv,xp:0,credits:0,inv:[],imps:{},ab:{},sb:{},perks:{},buffs:[],consum:{},stims:3,party:{ai:'default',role:ROLE[prof]||'dps'},
    story:{done:['s1','s2','s3','s4','s5','s6','s7','s8','s9'],cur:null,track:false,gf:Object.keys(GATES),v:1},faction:{side:'combine',rep:{combine:0,ashborn:0}},tsBonus:true,runSp:true,
    tg:{b1:'clear',b2:'clear',b3:'clear',b4:'clear',b5:'clear',b6:'clear',b7:'clear',b8:'clear',b9:'clear',n:{}}};
  const eq={weapon:genItem(lv,'weapon',rar,{wt:PROF_WT[prof]})};for(const s of ['head','armor','hands','legs','feet'])eq[s]=genItem(lv,s,rar,{fam:PROF_FAM[prof]});c.eq=eq;
  const ql=Math.max(1,Math.round(lv*4));for(const s of IMPSLOTS)c.imps[s]=genImplant(ql,s,Math.min(rar,2));
  // skill points: meet the requirements of the best Weaves, then the damage skill, then health / evasion (what a sensible player does)
  const pr=PROFS[prof],ws=simWeaves(prof,lv),need={};for(const w of ws)for(const r of (w.req||[]))need[r.s]=Math.max(need[r.s]||0,r.v);
  const lvSave=P.level,profSave=P.prof;P.level=lv;P.prof=prof;
  let pts=spTotal(lv);const base=s=>baseOf(s),cap=s=>ATTRS.includes(s)?attrCap(s):skillCap(s);
  const raise=(s,to)=>{const o=ATTRS.includes(s)?c.ab:c.sb;while(pts>=costOf(s)&&(base(s)+(o[s]||0))<Math.min(to,cap(s))){o[s]=(o[s]||0)+1;pts-=costOf(s);}};
  const pri=[[pr.dmgSkill,0.6],['body',0.25],['evade',0.15]];
  for(const s in need)raise(s,Math.round(need[s]*0.85));
  // Build W1: Weaves need their requirements to be CAST, so top up whatever gear/implants/attributes don't cover
  c.wv={v:1,gf:[],pg:0,s2:[],lo:[],cur:0};for(let it=0;it<3;it++){const E=statsFor(c).E;let any=false;for(const s in need){const d=need[s]-(E[s]||0);if(d>0){const o=ATTRS.includes(s)?c.ab:c.sb;let k=0;while(k<d&&pts>=costOf(s)&&(o[s]||0)<cap(s)){o[s]=(o[s]||0)+1;pts-=costOf(s);k++;}if(k)any=true;}}if(!any)break;}
  let guard=0;while(pts>0&&guard++<4000){let did=false;for(const [s,w] of pri){const o=c.sb;const before=pts;raise(s,base(s)+(o[s]||0)+Math.max(1,Math.round(8*w)));if(pts<before)did=true;}if(!did)break;}
  P.level=lvSave;P.prof=profSave;
  c.known=ws.map(w=>w.id);c.slots=simBar(ws,prof);while(c.slots.length<NSLOTS)c.slots.push(null);
  // perks: spend every point, own line first
  try{let g=0;while(ppAvail(c)>0&&g++<200){const ids=Object.keys(PERKS).filter(k=>!perkCan(k,c)).sort((a,b)=>(PERK_LINES[PERKS[b].line].prof?1:0)-(PERK_LINES[PERKS[a].line].prof?1:0));if(!ids.length)break;c.perks[ids[0]]=(c.perks[ids[0]]|0)+1;}}catch(e){}
  return c;}
// the bot player: focuses the boss (or whatever makes it immune), keeps its weapon range, walks out of (or into) telegraphs, uses Weaves sensibly
const SIMB={next:0,focus:null,gcd:0.7};// gcd: one Weave press per 0.7s, a typical touch player (no global cooldown in the game itself)
function simDanger(){if(!DUN)return null;for(const t of DUN.tele){if(T>=t.at||t.at-T>2.2)continue;const dd=Math.hypot(P.pos.x-t.x,P.pos.z-t.z);if(dd<t.r+0.6&&(!t.inner||dd>t.inner-0.6))return {t,dd};}return null;}
function simMoveTo(x,z,dt,stop){const dx=x-P.pos.x,dz=z-P.pos.z,d=Math.hypot(dx,dz);if(d<=stop)return false;const s=Math.min(SPEED*moveMul()*dt,d-stop);P.pos.x+=dx/d*s;P.pos.z+=dz/d*s;collide(P.pos,0.4);P.pos.y=heightAt(P.pos.x,P.pos.z);if(SIMST)SIMST.moved+=s;return true;}
function simPickTarget(){const b=SIMB.focus;const live=enemies.filter(e=>!e.dead&&(e.state==='chase'||e.addOf||e.tdAdd||e.echo||e.T.heals)&&dist2D(e.pos,P.pos)<(e.addOf||e.tdAdd?36:28));
  if(b&&!b.dead&&b.immune&&b.immune()){for(const e of enemies)if(!e.dead&&e.addOf===b&&!live.includes(e))live.push(e);}// shield anchors anywhere in the arena
  // a sensible player kills adds first (healers, shield anchors), then the boss
  if(b&&!b.dead&&!(b.immune&&b.immune())&&!live.some(e=>e!==b&&!e.boss))return b;let best=null,bd=1e9;for(const e of live){if(e===b)continue;const d=dist2D(e.pos,P.pos);if(d<bd){bd=d;best=e;}}return best||(b&&!b.dead?b:null);}
function simBot(dt){if(P.dead||state!=='play')return;const t=simPickTarget();if(t){P.target=t;P.autoAtk=true;}
  const dz=simDanger();
  if(dz){const t2=dz.t;if(t2.inner)simMoveTo(t2.x,t2.z,dt,Math.max(0.5,t2.inner-1.4));else{let ax=P.pos.x-t2.x,az=P.pos.z-t2.z,l=Math.hypot(ax,az)||1;ax/=l;az/=l;
    // dodge out of the circle but drift back toward the room centre (a player re-centres; pure radial dodging walks the boss out of its leash)
    const rm=SIMB.focus&&SIMB.focus.boss&&SIMB.focus.boss.room;if(rm){let cx=0-t2.x,cz=rm.cz-t2.z;const cl=Math.hypot(cx,cz);if(cl>2){ax+=cx/cl*0.9;az+=cz/cl*0.9;const n=Math.hypot(ax,az)||1;ax/=n;az/=n;}}
    simMoveTo(t2.x+ax*(t2.r+1.8),t2.z+az*(t2.r+1.8),dt,0.2);}}
  else if(t){const ab=basicAb();const want=ab.melee?t.hitR+1.0:Math.max(t.hitR+2,Math.min(ab.range*0.8,14));const d=dist2D(t.pos,P.pos);
    const rm=t.boss&&t.boss.room;// knocked toward the door? walk back into the arena like a player would, so the boss is not dragged out of its room
    if(rm&&rm.cz!=null&&(Math.abs(P.pos.z-rm.cz)>rm.d/2-3||Math.abs(P.pos.x-(rm.cx||0))>rm.w/2-3))simMoveTo(rm.cx||0,rm.cz,dt,2);
    else if(d>want+0.6)simMoveTo(t.pos.x,t.pos.z,dt,want);}
  if(t)P.rotY=Math.atan2(t.pos.x-P.pos.x,t.pos.z-P.pos.z);
  if(T<SIMB.next)return;SIMB.next=T+0.25;
  const hpF=P.hp/S.maxHp;if(hpF<0.35&&P.stims>0&&(P.cds.stim||0)<=T){useStim();if(SIMST)SIMST.stims++;}
  const ids=barIds();let starved=false;
  for(let i=0;i<ids.length;i++){const w=abDef(ids[i]);if(!w)continue;if((P.cds[w.id]||0)>T)continue;const k=SIM_KIND[w.kind]||(w.buff?'setup':'');if(!k)continue;
    let want=false;
    if(k==='sus')want=w.kind==='petheal'?!!(activePet()&&activePet().hp<activePet().maxHp*0.6):(w.kind==='teamheal'?(hpF<0.7||allies.some(a=>!a.dead&&a.hp<a.maxHp*0.6)):(hpF<(w.kind==='dr'?0.75:0.6)||((w.kind==='heal'||w.kind==='hot')&&menderAllyLow(w.kind==='hot'?0.8:0.6))));
    else if(k==='en')want=P.en<S.maxEn*0.35;
    else if(k==='setup'){if(w.kind==='summon'||w.kind==='pet')want=!activePet();else if(w.kind==='petbuff')want=!!activePet()&&!activePet().buff;else if(w.kind==='morph')want=!P.morph;else if(w.buff)want=!P.buffs.some(b=>b.id===w.id);else want=true;}
    else if(k==='dmg'){if(!t)continue;if(w.needTarget!==false&&w.range&&dist2D(t.pos,P.pos)>w.range+t.hitR)continue;if(!w.needTarget&&w.radius&&dist2D(t.pos,P.pos)>w.radius+t.hitR&&w.kind!=='cone')continue;if(w.kind==='cone'&&dist2D(t.pos,P.pos)>(w.range||12))continue;want=true;}
    if(!want)continue;if(P.en<(w.cost||0)){starved=true;continue;}
    if(useAbility(i)){if(SIMST)SIMST.casts++;SIMB.next=T+SIMB.gcd;break;}}
  if(starved&&SIMST)SIMST.starve+=0.25;}
function simReset(){P.hp=S.maxHp;P.en=S.maxEn;P.cds={};P.dead=false;P.buffs=P.buffs||[];}
/* one fight. o: {boss: enemy, maxT, team:bool, stopOnWipe:true}. Returns stats. */
function simRunFight(o){const b=o.boss;SIMB.focus=b;SIMB.next=0;SIMST={pt:0,ph:0,ah:0,at:0,pd:0,ad:0,starve:0,casts:0,stims:0,moved:0};
  const t0=T,hp0=b.hp,dt=0.05,maxT=o.maxT||600;SIMP=true;let res='timeout',enT=0;const tr=[];const mxHp=b.maxHp;let minEnF=1,ens=0,enN=0;
  try{while(T-t0<maxT){simBot(dt);simStep(dt);if(P.en/S.maxEn<minEnF)minEnF=P.en/S.maxEn;ens+=P.en/S.maxEn;enN++;
      if(o.trace&&((T-t0)%o.trace)<dt)tr.push([+(T-t0).toFixed(1),b.dead,b.hp|0,+(P.hp/S.maxHp).toFixed(2),b.foe===P?'onP':(b.foe?b.foe.name:'-'),SIMST.pt|0,+(b.hp/b.maxHp).toFixed(3),b.immune?String(b.immune).slice(0,20):0,b.boss&&b.boss.phase,P.target===b?'B':(P.target?P.target.T.name:'-'),Math.round(dist2D(P.pos,b.pos)),b.state||'',enemies.filter(e=>!e.dead).length,b.home?Math.round(dist2D(b.pos,b.home)):-1,Math.round(b.leash||0)]);if(b.dead){res='kill';break;}if(P.dead){res='death';break;}if(b.boss&&b.boss.he&&!enT)enT=T-t0;}}
  finally{SIMP=false;}
  const el=T-t0,lost=b.dead?hp0:hp0-b.hp;
  return {res,t:+el.toFixed(1),dps:Math.round(lost/el),hpLostF:+(lost/mxHp).toFixed(3),maxHp:Math.round(mxHp),taken:Math.round(SIMST.pt),takenPct:+(SIMST.pt/S.maxHp).toFixed(2),selfHeal:Math.round(SIMST.ph),allyHeal:Math.round(SIMST.ah),allyTaken:Math.round(SIMST.at),
    deaths:SIMST.pd,allyDeaths:SIMST.ad,starveF:+(SIMST.starve/el).toFixed(2),enAvg:+(ens/Math.max(1,enN)).toFixed(2),enMin:+minEnF.toFixed(2),casts:SIMST.casts,stims:SIMST.stims,hardEnrage:enT?+enT.toFixed(0):0,phase:b.boss&&b.boss.phase||1,maxHpP:S.maxHp,tr:o.trace?tr:undefined};}
// place the player (and allies) at the boss room and pull the boss; other enemies outside the room are removed (a cleared run)
function simStage(boss,keepAdds){const r=boss.boss&&boss.boss.room;for(const e of enemies.slice()){if(e===boss||e.dead)continue;if(keepAdds&&r&&Math.abs(e.pos.z-r.cz)<r.d/2)continue;removeEnemy(e);}
  const cz=r?r.cz:boss.pos.z,dz=r?Math.min(10,r.d*0.3):9;P.pos.set(0,heightAt(0,cz+dz),cz+dz);P.rotY=Math.PI;
  for(const a of allies){a.pos.set((Math.random()*6-3),heightAt(0,cz+dz+1.5),cz+dz+1.5);a.target=null;if(a.hp!=null)a.hp=a.maxHp;}
  boss.pos.set(r?0:boss.pos.x,boss.pos.y,r?cz-2:boss.pos.z);simReset();}
function simExports(){return {simStep,simChar,simRunFight,simStage,simBot,simReset,simWeaves,SIMB,reqMetBy,storyDunStep,storyRunMode,stepDone,inTown,balOn,addHpK,dunBossK,profDmgK,get FLAT(){return FLAT;},get SIMP(){return SIMP;},set SIMP(v){SIMP=v;}};}
/* ---------- Build O balance curves ----------
   eHpK(lv): enemy health multiplier by enemy level. Measured with the sim (sim_out/dummy.json): a typical player's sustained DPS grows ~40,000x from Lv 1 to 100
   while base enemy health grows ~39x, so everything above Lv ~15 died in a fraction of a second. The curve restores Lv 1's time-to-kill (~3s per same-level trash)
   at every level, ramping to ~4.5s at Lv 100. Log-linear interpolation; beyond 100 it keeps the last slope. (Function-local table: makeEnemy runs at load.) */
var BAL_DEFAULT=true;// Build O balance retune: ON by default. Debug override: localStorage dustreach_bal_o='0' turns it off, '1' forces it on (reload after changing)
function balOn(){if(window.__BALOFF)return false;if(window.__BALON)return true;try{const v=localStorage.getItem('dustreach_bal_o');if(v==='0')return false;if(v==='1')return true;}catch(e){}return BAL_DEFAULT;}// the sim sets window.__BALOFF before load to measure the pre-Build-O game (before/after tables)
function eHpK(lv){if(!balOn())return 1;const t=[[1,1],[5,2.2],[10,3.8],[15,7],[20,10.5],[25,16.5],[30,24],[40,44],[50,75],[60,130],[70,210],[80,360],[90,620],[100,1060]];
  lv=Math.max(1,lv||1);let i=0;while(i<t.length-2&&lv>t[i+1][0])i++;const a=t[i],b=t[i+1];const f=(lv-a[0])/(b[0]-a[0]);const k=Math.pow(10,Math.log10(a[1])+f*(Math.log10(b[1])-Math.log10(a[1])));
  return k*(1+0.55*Math.min(1,(lv-1)/99));}
// companions: same level x skill x power growth as a player's basic hit (they ignored skill and power before, so they fell ~1000x behind by Lv 100)
function allyPowF(snap){if(!balOn())return 1;const st=snap.stats||{},pr=PROFS[snap.prof];const sk=pr&&st.E?st.E[pr.dmgSkill]||12:12;return (1+Math.max(-0.2,(sk-12)/100))*(1+(st.power||0)/100)*profDmgK(snap.prof,snap.level)*ALLY_K;}
var ALLY_K=1;
// bots / constructs: a share of the owner's basic-hit damage
function petDmgBase(){if(!balOn())return (3+2.4*P.level)*(1+eff('weave')/150);return S.dmg*(1+0.08*(effLvP()-1))*skillF()*(1+S.power/100)*profDmgK(P.prof,effLvP())*PET_K;}
var PET_K=0.6;
/* per-profession damage coefficient (player hits, their bots, and the same profession as a companion). From the sim dummy sweep (geo-mean Lv 20-100) so each
   profession lands on its role's target share of the dps-role median: dps 1.0, pet 0.95, control 0.85, tank 0.75, support 0.7, healer 0.6 (tanks/healers/supports
   bring survival and team value; the solo floor keeps every role able to clear solo dungeons). */
var PROF_DMGK={vanguard:[0.78,0.74,0.84],siege:[0.56,0.51,0.72],mender:[1.55,2.06,3.44],weaver:[0.65,0.62,0.54],mind:[1.61,1.74,1.16],harm:[1.52,1.4,2.06],exact:[0.87,0.77,0.53],flux:[0.74,0.52,0.41],runner:[1.62,1.81,1.37],wild:[1.11,1.03,0.92],fist:[1.03,0.9,1.04],shade:[0.67,0.73,0.68],wright:[1.27,1.62,2.45],binder:[1.41,1.18,1.19]};// [Lv 10, Lv 40, Lv 85] anchors, linear between, flat outside
function profDmgK(p,lv){if(!balOn())return 1;const k=PROF_DMGK&&PROF_DMGK[p];if(!k)return 1;lv=lv||P.level;return lv<=10?k[0]:lv<=40?k[0]+(k[1]-k[0])*(lv-10)/30:lv<=85?k[1]+(k[2]-k[1])*(lv-40)/45:k[2];}
/* 2026-11-23 (Claude): "vault" (Vault Theta-9) was missing from both SOLO tables, so its solo bosses ran untuned at x1 - the outlier in a
   14-profession sim sweep (Lv 10, Rare gear: Ascent V 10/14 kills, 4x max HP taken). 0.8 HP / 0.6 dmg puts it beside the Mine and Stillvault
   (Uncommon Normal ~58 s, 0.9x HP taken; Rare Ascent V 14/14 kills). */
/* boss health per dungeon after eHpK, from the sim (simBossK.js): solo bosses target ~65s median kill time (45-90s band), team bosses ~100s (60-150s) */
var SOLO_BK={"mine":0.766,"vault":0.8,"choir":0.36,"stillvault":0.143,"foundry":0.45,"heartforge":0.501,"oxidevault":0.417,"briarsepulchre":0.37,"galecrown":0.316,"sunossuary":0.18,"riftvestibule":0.109};
var TEAM_BK={"vault":0.7,"choir":0.19,"stillvault":0.23,"foundry":0.16,"heartforge":0.26,"oxidevault":0.25,"briarsepulchre":0.15,"galecrown":0.128,"sunossuary":0.118};
var RAID_K={sunless:[0.025,1]},RAID_BOSS_K={ozmarath:0.68};// [boss hp, boss dmg] on top of the raid mode (bosses only)
// Build O: adds a boss summons (and their splits) get the same solo/team HP factor as the boss. SOLO_BK shrinks bosses (e.g. Vael x0.048) but left
// their Voidmaws/Ossuarchs at full eHpK health, so single-target professions spent 70 s on adds while AoE/pet ones cleaved the boss down in 15 s.
// Build O: a dungeon boss only evades/resets when its target has left the boss room (8 m margin) AND it is past its leash, or it is dragged over 2x its leash; back-pedalling while casting inside the arena no longer resets the fight
function bossLeashOut(e,dH,F){const L=e.leash||45;const r=e.boss&&e.boss.room;if(!r||r.cx==null||!balOn())return dH>L;const fp=F&&F.pos?F.pos:P.pos,m=8;const inR=Math.abs(fp.x-r.cx)<=r.w/2+m&&Math.abs(fp.z-r.cz)<=r.d/2+m;return (!inR&&dH>L)||dH>L*2;}
function addHpK(){if(!balOn()||typeof DUN==='undefined'||!DUN||!DUN.D||DUN.D.raid||(typeof RAID_K!=='undefined'&&RAID_K[DUN.D.id]))return 1;return Math.min(1,dunBossK(DUN.D.id,DUN.mode));}
function dunBossK(id,m,dmg){if(!balOn())return 1;if(RAID_K[id])return RAID_K[id][dmg?1:0];if(!DUNGEONS[id]||DUNGEONS[id].raid)return 1;const team=m&&m.team;return (dmg?(team?TEAM_BD:SOLO_BD)[id]:(team?TEAM_BK:SOLO_BK)[id])||1;}
/* armour: damage taken = C/(C+armour). C was a flat 100, so gear armour (952 at Lv 100) cut boss hits to 9.5% while a Lv 6 took 62%: high-level bosses did nothing.
   C now grows with the attacker's level (100 + 9 per level), like the attacker-level armour constant in classic MMOs: ~50-70% gets through at every level. */
function armC(src){if(!balOn())return 100;const lv=(src&&src.lv)||P.level||1;return 100+9*(lv-1);}
// in-combat energy regen: 3.5 + 1.2%/s starved low-level casters (30-60% of a fight energy-blocked at Lv 6-36); 6 + 1.5%/s
function enRegenC(){return balOn()?6+S.maxEn*0.015:3.5+S.maxEn*0.012;}
// boss damage per dungeon (after the armour fix): solo boss fights should cost ~1.2x your max health in total (heals/stims needed, deaths rare)
var SOLO_BD={mine:0.58,vault:0.6,choir:0.81,stillvault:0.89,foundry:1.41,heartforge:1.7,oxidevault:1.89,briarsepulchre:1.84,galecrown:1.63,sunossuary:1.26,riftvestibule:1.08};
var TEAM_BD={"vault":0.36,"choir":0.6,"stillvault":0.6,"foundry":0.3,"heartforge":0.55,"oxidevault":0.55,"briarsepulchre":0.45,"galecrown":0.55,"sunossuary":0.4};
/* ---------- XP lock (per character): farm dungeons for sets without levelling ----------
   P.xpLock / sheet.xpLock: no XP from any source (gainXp for the active character, sheetGainXp for companion shares). Loot, credits, perk-point
   rewards and team XP gates are untouched. Saved per character (futureFields), default off (old saves: off). */
function xpFields(s){return {xpLock:!!s.xpLock};}
function setXpLock(on){P.xpLock=!!on;toast(on?'🔒 XP locked: '+P.name+' gains no XP (loot, credits and rewards still drop)':'🔓 XP unlocked: '+P.name+' gains XP again');log(on?'🔒 <b>XP lock on</b>: no XP from kills, contracts, clears or team shares until you turn it off (📈 Skills).':'🔓 <b>XP lock off</b>.');save();try{hudAcc=1;}catch(e){}updHUD(0);}
function xpLockBtn(){return `<button class="sbtn${P.xpLock?'':' alt'}" id="xpLockBtn" data-act="xplock" style="min-height:44px" title="Stop gaining XP (farm without levelling)">${P.xpLock?'🔒 XP locked':'🔓 XP lock: off'}</button>`;}
function xpLockHtml(){return P.xpLock?' <span id="xpLockBadge" class="xplock" title="XP lock on: no XP gained" style="font-size:12px;padding:1px 6px;border-radius:8px;background:#5a2a10;color:#ffcf8a;border:1px solid #ff9a2a">🔒 XP</span>':'';}
let xpNoteT=-99;function xpLockedNote(n){if(n>0&&T-xpNoteT>20){xpNoteT=T;floatText(tmpV.set(P.pos.x,P.pos.y+2.6,P.pos.z),'XP locked','info');}}
function compXpLockHtml(al){if(!al||!al.length)return '';return `<div class="h4">Companion XP lock</div><div style="display:flex;flex-wrap:wrap;gap:6px">${al.map(a=>{const c=roster.chars.find(x=>x.id===a.id)||a;return `<button class="sbtn${c.xpLock?'':' alt'}" data-act="tmxl" data-id="${a.id}" style="min-height:44px">${c.xpLock?'🔒':'🔓'} ${esc(a.name)}</button>`;}).join('')}</div><div style="opacity:.7;font-size:12px">Locked companions get no XP share; each character keeps its own setting.</div>`;}
function toggleCompXpLock(id){const c=roster.chars.find(x=>x.id===id);if(!c)return;c.xpLock=!c.xpLock;writeRoster(roster);toast((c.xpLock?'🔒 ':'🔓 ')+c.name+(c.xpLock?' gains no XP share':' gains XP shares again'));}
function xpLockExports(){return {setXpLock,xpLockHtml,toggleCompXpLock,sheetGainXp:typeof sheetGainXp==='function'?sheetGainXp:null};}
/* ---------- Story runs (out-levelling soft-lock fix) ----------
   A story boss step (k:'boss') that is not done yet keeps its dungeon open over the level cap as a 'Story run': mobs and bosses are lifted to your level
   (Veteran-style level offset, so eHpK keeps it a real fight), the run can't be outgrown, loot is normal. */
function storyDunStep(id){if(typeof STORY==='undefined')return null;for(const s of STORY){if(s.obj&&s.obj.k==='boss'&&s.obj.dungeon===id&&!stepDone(s.id))return s;}return null;}
function storyRunMode(D,ck,mo){const base=mo||D.modes.solo||{hp:1,dmg:1,lvl:0};const lift=Math.max(0,(ck.lv||P.level)-D.lvl[1]);return Object.assign({},base,{lvl:(base.lvl||0)+lift,story:ck.story.id,storyLift:lift,storyBossHp:balOn()?1.3:1});}// Build O: story-run bosses x1.3 HP (balance on) so the run is a real fight at your level
function storyRunBanner(D,m){const s=STEP[m.story];banner('📜 STORY RUN · '+D.name.toUpperCase(),'Over the level cap: enemies raised '+m.storyLift+' levels to match you · '+(s?s.obj.label:''));
  log('📜 <b>Story run</b> of <b>'+esc(D.name)+'</b>: you out-levelled it, so it is scaled to you (+'+m.storyLift+' levels) for the story step "'+esc(s?s.n:'')+'". Normal loot, no level-cap lockout.');}
/* ---------- Mender team healing (Build O) ----------
   The Medic profession's heal/HoT only ever healed the player, so a Mender leading companions was a team with no healer.
   Heal = smart heal (lowest-health member within 22m: you, a companion or your pet; you first when under 50%); HoT also lands on companions within 22m. */
function menderSmart(){return balOn()&&P.prof==='mender';}
function healPool(){const L=[{e:P,f:P.dead?1:P.hp/S.maxHp}];for(const a of allies){if(a.dead||dist2D(a.pos,P.pos)>22)continue;L.push({e:a,f:a.hp/a.maxHp});}return L;}
{const _h=KIND.heal,_o=KIND.hot;
 KIND.heal=(t,a)=>{if(!menderSmart())return _h(t,a);const self=P.hp/S.maxHp;const low=healPool().sort((x,y)=>x.f-y.f)[0];
   if(!low||low.e===P||self<0.5||low.f>=self)return _h(t,a);const al=low.e;allyHeal(al,al.maxHp*a.pct*(1+eff('treat')/150));ringFx(al.pos.x,al.pos.z,0x6dff8a,2.4,0.5);SFX.heal();
   if(Math.random()<0.25)floatText(tmpV.set(al.pos.x,(al.pos.y||0)+2.6,al.pos.z),'Healed '+al.name,'heal');};
 KIND.hot=(t,a)=>{_o(t,a);if(!menderSmart())return;for(const al of allies){if(al.dead||dist2D(al.pos,P.pos)>22)continue;al.hot={until:T+a.dur,next:T+1,pct:a.pct};ringFx(al.pos.x,al.pos.z,0x6dff8a,1.6,0.4);}};}
function menderAllyLow(th){return menderSmart()&&healPool().some(x=>x.e!==P&&x.f<th);}
function storyNotTaken(st){const c=sto().cur;return !c||c.id!==st.id;}
