/* game38.js — Build S: HARD MODES (difficulty tiers, weekly twists, timer + Bonus Cache, better loot, titles).
   - Every dungeon (solo door, its team version) and every raid has a difficulty picker: Normal / Hard / Nightmare, and
     solo doors add five ladder-style Ascent tiers (I..V); team versions and raids stop at Nightmare (sims: AI teams). Selection is per character and per key: 'd:<id>' solo door,
     't:<id>' team version, 'r:<id>' raid. enterDungeon() calls hmMode() which returns a COPY of the mode object with
     scaled hp/dmg and a run record mode.hm={key,tier,aff,par,t0,...}; story runs are never scaled.
   - Unlocks: Hard after a Normal clear; Nightmare after a Hard clear; Ascent N after beating the timer one tier below.
   - Weekly twists (affixes) rotate with the GAME week (P.gday / SUN_GWEEK, same clock as the Sunless lockout):
     Nightmare+ adds one of HM_A1 (alternates weekly), Ascent II+ adds one of HM_A2 (changes every 2 game weeks):
     8-week cycle, fully deterministic (hmAffixes(tier,week)).
   - Timer (dungeons only; raids keep their checkpoints so have none): par from the dungeon's size; beating it drops a
     Bonus Cache (extra boss-loot roll + credits) and unlocks the next Ascent tier. Over time the clear still counts.
   - Loot: hard-mode uniques get +4%/tier item power (raids +6%/tier) and a tier tag; extra-drop and Relic chances rise;
     the Sunless Throne on Hard/Nightmare adds a 20%/40% extra Sunforged piece chance per boss.
   - Titles: «the Unyielding» (any Hard clear), «Nightwalker» (any Nightmare clear), «Ascendant» (time Ascent III),
     «Peakbreaker» (time Ascent V), «Throneshaker» (Sunless Throne on Nightmare), «Bastionbreaker» (Cinderdeep on Nightmare).
   - Save: P.hm={v:1,sel,best,runs,timed,caches} via futureFields (hmFields); old saves get the default (all Normal).
   - Sim/test hook: hmForce(tier,affixes) forces a tier (null to clear). */
const HM_VER=1;
const HM_TIERS=[
  {n:'Normal',s:'N',hp:1,dmg:1,c:'#cfcfcf'},{n:'Hard',s:'H',hp:1.3,dmg:1.1,c:'#4fe36a'},{n:'Nightmare',s:'NM',hp:1.6,dmg:1.2,c:'#c86bff'},
  {n:'Ascent I',s:'A1',hp:1.85,dmg:1.27,c:'#ff9a2a'},{n:'Ascent II',s:'A2',hp:2.1,dmg:1.34,c:'#ff9a2a'},{n:'Ascent III',s:'A3',hp:2.35,dmg:1.41,c:'#ff6a3a'},
  {n:'Ascent IV',s:'A4',hp:2.6,dmg:1.47,c:'#ff4f5e'},{n:'Ascent V',s:'A5',hp:2.85,dmg:1.53,c:'#ff4f5e'}];
const HM_RAID=[HM_TIERS[0],{n:'Hard',s:'H',hp:1.15,dmg:1.1,c:'#4fe36a'},{n:'Nightmare',s:'NM',hp:1.3,dmg:1.2,c:'#c86bff'}];
const HM_AFF={
  bulwark:{n:'Bulwark',ic:'🛡',d:'Non-boss enemies have +25% HP.',tip:'Pull packs together and use area attacks.'},
  warlord:{n:'Warlord',ic:'👑',d:'Bosses have +15% HP and deal +10% damage.',tip:'Save cooldowns and stims for the bosses.'},
  volatile:{n:'Volatile',ic:'💥',d:'Slain non-boss enemies leave a 2.5 m circle that bursts after 1.8 s.',tip:'Step out of red circles after each kill.'},
  rally:{n:'Rallying',ic:'📯',d:'When a non-boss enemy dies, enemies within 12 m deal +10% damage (up to 3 stacks).',tip:'Kill packs evenly instead of one at a time.'},
  brim:{n:'Brimstone',ic:'🔥',d:'In boss fights a fire circle marks each team member every 10 s.',tip:'Keep moving in boss fights and step out before the circle bursts.'},
  frenzy:{n:'Frenzy',ic:'😡',d:'Enemies below 30% HP deal +20% damage.',tip:'Burst enemies through their last 30%.'}};
const HM_A1=['bulwark','warlord'],HM_A2=['volatile','rally','brim','frenzy'];
const HM_TITLES=[
  {n:'the Unyielding',d:'Clear any dungeon or raid on Hard',ok:B=>Object.values(B).some(b=>b.c>=1)},
  {n:'Nightwalker',d:'Clear any dungeon or raid on Nightmare',ok:B=>Object.values(B).some(b=>b.c>=2)},
  {n:'Ascendant',d:'Beat the timer on Ascent III in any dungeon',ok:B=>Object.entries(B).some(([k,b])=>k[0]!=='r'&&b.tm>=5)},
  {n:'Peakbreaker',d:'Beat the timer on Ascent V in any dungeon',ok:B=>Object.entries(B).some(([k,b])=>k[0]!=='r'&&b.tm>=7)},
  {n:'Throneshaker',d:'Clear the Sunless Throne on Nightmare',ok:B=>(B['r:sunless']||{}).c>=2},
  {n:'Bastionbreaker',d:'Clear Cinderdeep Bastion on Nightmare',ok:B=>(B['r:bastion']||{}).c>=2}];
let HM_FORCE=null,HM_FORCE_AFF=null;
/* ---------- state ---------- */
function normHm(o){o=o&&typeof o==='object'?o:{};const ci=(v,a,b)=>Math.max(a,Math.min(b,Math.floor(+v||0))),okK=k=>/^[drt]:[a-z0-9_]{1,40}$/.test(k);const sel={},best={};
  const S0=o.sel&&typeof o.sel==='object'?o.sel:{},B0=o.best&&typeof o.best==='object'?o.best:{};
  for(const k in S0)if(okK(k))sel[k]=ci(S0[k],0,7);
  for(const k in B0)if(okK(k)){const b=B0[k]&&typeof B0[k]==='object'?B0[k]:{};best[k]={c:ci(b.c,0,7),tm:ci(b.tm,0,7),sec:ci(b.sec,0,1e6),st:ci(b.st,0,7)};}
  return {v:HM_VER,sel,best,runs:ci(o.runs,0,1e9),timed:ci(o.timed,0,1e9),caches:ci(o.caches,0,1e9)};}
function hmFields(s){return {hm:normHm(s.hm)};}
const hmi=()=>P.hm||(P.hm=normHm(null));
// team versions (already the hard co-op content) and raids stop at Nightmare; the Ascent ladder is for solo doors (companions welcome)
const HM_TEAM=HM_TIERS.slice(0,3);
function hmTab(key){return key[0]==='r'?HM_RAID:key[0]==='t'?HM_TEAM:HM_TIERS;}
function hmWeek(){return Math.floor((P.gday||0)/SUN_GWEEK);}
function hmAffixes(tier,w,raid){w=w==null?hmWeek():w;w=Math.max(0,w|0);const a=[];if(raid){if(tier>=2)a.push(HM_A2[w%4]);return a;}if(tier>=2)a.push(HM_A1[w%2]);if(tier>=4)a.push(HM_A2[Math.floor(w/2)%4]);return a;}
// raids: the Sun-Eater's Total Eclipse (hard enrage) comes later in proportion to the tier's HP, so the margin matches Normal
function hmEnrageK(){const h=hmOn();return h&&h.key[0]==='r'?HM_RAID[h.tier].hp:1;}
function hmBest(key){return hmi().best[key]||{c:0,tm:0,sec:0,st:0};}
function hmNormalClear(key){const id=key.slice(2);if(key[0]==='d')return (P.dunClears&&P.dunClears[id]|0)>0;if(key[0]==='t')return !!((typeof tgOf==='function'?tgOf(P).n:null)||{})[id];return ((P.raidClears||{})[id]|0)>0;}
function hmUnlocked(key,t){if(t<=0)return true;if(t>=hmTab(key).length)return false;const b=hmBest(key);if(t===1)return hmNormalClear(key)||b.c>=1;if(t===2)return b.c>=1;return b.tm>=t-1;}
function hmLockMsg(key,t){const T0=hmTab(key);if(t===1)return 'Clear it once on Normal to unlock Hard';if(t===2)return 'Clear it on Hard to unlock Nightmare';return 'Beat the timer on '+T0[t-1].n+' to unlock '+T0[t].n;}
function hmSel(key){const t=hmi().sel[key]|0;return hmUnlocked(key,t)?Math.min(t,hmTab(key).length-1):0;}
function hmSet(key,t){t=Math.max(0,t|0);if(!hmUnlocked(key,t))return false;hmi().sel[key]=t;save();return true;}
function hmForce(t,aff){HM_FORCE=t==null?null:t|0;HM_FORCE_AFF=aff||null;return HM_FORCE;}
function hmKeyFor(id,mode,D){return (D&&D.raid?'r:':mode&&mode.team?'t:':'d:')+id;}
function hmOn(){return typeof DUN!=='undefined'&&DUN&&DUN.mode&&DUN.mode.hm?DUN.mode.hm:null;}
/* ---------- run setup (enterDungeon) ---------- */
function hmMode(id,mode,D,story){if(story||!mode||mode.story||!D||D.apt)return mode;const key=hmKeyFor(id,mode,D);const tab=hmTab(key);
  let t=HM_FORCE!=null?HM_FORCE:hmSel(key);t=Math.max(0,Math.min(t,tab.length-1));if(t<=0)return mode;const T0=tab[t];
  // team versions already hit harder (x1.25 + mechanics): only half the tier's extra damage, so AI teams stay fair
  const dk=key[0]==='t'?1+(T0.dmg-1)*0.5:T0.dmg;
  return Object.assign({},mode,{hp:(mode.hp||1)*T0.hp,dmg:(mode.dmg||1)*dk,hm:{key,tier:t,aff:(HM_FORCE_AFF||hmAffixes(t,null,key[0]==='r')).slice(),par:0,t0:0,over:false,done:false}});}
function hmPar(d){const trash=enemies.filter(e=>e.dun&&!e.boss&&!e.dead).length,nb=d.bosses.length;const h=d.mode.hm;
  return Math.round((150+7*trash+75*nb)*(d.mode.team?1.15:1)*(1+0.05*h.tier)/10)*10;}
function hmStart(d){const h=d.mode&&d.mode.hm;if(!h)return;h.t0=T;h.par=h.key[0]==='r'?0:hmPar(d);
  const T0=hmTab(h.key)[h.tier];banner(d.D.name.toUpperCase()+' · '+T0.n.toUpperCase(),(h.aff.length?h.aff.map(a=>HM_AFF[a].ic+' '+HM_AFF[a].n).join(' · ')+' · ':'')+(h.par?'beat '+hmFmt(h.par)+' for a Bonus Cache':'harder bosses, better loot'));
  log('⚔ <b style="color:'+T0.c+'">'+T0.n+'</b>: enemies ×'+T0.hp+' HP, ×'+(h.key[0]==='t'?+(1+(T0.dmg-1)*0.5).toFixed(2):T0.dmg)+' damage'+(h.aff.length?' · this week: '+h.aff.map(a=>'<b>'+HM_AFF[a].n+'</b> ('+esc(HM_AFF[a].d)+')').join(', '):'')+(h.par?' · timer '+hmFmt(h.par):'')+'.');}
function hmFmt(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
/* ---------- combat hooks ---------- */
function hmMob(e,o){const h=hmOn();if(!h)return;o=o||{};
  if(h.aff.includes('bulwark')&&!o.boss){e.maxHp=e.hp=Math.round(e.maxHp*1.25);}
  if(h.aff.includes('warlord')&&o.boss){e.maxHp=e.hp=Math.round(e.maxHp*1.15);e.dmg*=1.1;}}
function hmOnKill(e){const h=hmOn();if(!h)return;
  if(!e.boss&&!e.addOf){
    if(h.aff.includes('volatile'))telegraph(e,e.pos.x,e.pos.z,2.5,1.8,(e.baseHmDmg||e.dmg)*1.5,'Volatile');
    if(h.aff.includes('rally'))for(const a of enemies)if(a!==e&&!a.dead&&a.dun&&!a.boss&&Math.hypot(a.pos.x-e.pos.x,a.pos.z-e.pos.z)<12&&(a.rally|0)<3){a.rally=(a.rally|0)+1;a.dmg*=1.1;ringFx(a.pos.x,a.pos.z,0xffb03a,1.6,0.4);}}
  if(e.boss&&h.key==='r:sunless'&&typeof sunSetPiece==='function'&&Math.random()<[0,0.2,0.4][h.tier]){const it=sunSetPiece(sunFam(P.prof),sunOwned());if(it){sunDrop(e,[it]);log('☀ '+HM_RAID[h.tier].n+' bonus: an extra <b>Sunforged</b> piece dropped.');}}}
function hmBonus(cb){const h=hmOn();if(!h)return cb;const t=h.tier;return {extra:(cb?cb.extra:0)+0.08*t,relic:(cb?cb.relic:1)*(1+0.2*t)};}
function hmItem(it){const h=hmOn();if(!it||!h||it.kind==='disk'||it.hmT)return it;const t=h.tier,k=1+(h.key[0]==='r'?0.06:0.04)*t;
  if(it.dmg)it.dmg=Math.round(it.dmg*k);if(it.armor)it.armor=Math.round(it.armor*k);if(Array.isArray(it.bonus))it.bonus=it.bonus.map(b=>({s:b.s,v:Math.round(b.v*k)}));
  it.value=Math.round((it.value||0)*(1+0.1*t));it.hmT=t;it.name=it.name+' ['+hmTab(h.key)[t].n+']';return it;}
function hmTick(dt){const h=hmOn();if(!h||!DUN)return;
  if(h.par&&!h.over&&!h.done&&T-h.t0>h.par){h.over=true;toast('⏱ Out of time: no Bonus Cache this run, but the clear still counts');}
  h.acc=(h.acc||0)+dt;if(h.acc<0.25)return;h.acc=0;
  if(h.aff.includes('frenzy'))for(const e of enemies){if(!e.dun||e.dead)continue;const f=e.hp/e.maxHp;
    if(!e.hmFz&&f<0.3){e.hmFz=1;e.dmg*=1.2;if(e.boss)e.boss.baseDmg*=1.2;}else if(e.hmFz&&f>0.6){e.hmFz=0;e.dmg/=1.2;if(e.boss)e.boss.baseDmg/=1.2;}}
  if(h.aff.includes('brim'))for(const e of DUN.bosses){const b=e.boss;if(e.dead||!b||!b.engaged){if(b)b.hmBrim=0;continue;}
    if(!b.hmBrim){b.hmBrim=T+6;continue;}if(T>=b.hmBrim){b.hmBrim=T+10;for(const tg of dunTargets())if(!tg.dead)telegraph(e,tg.pos.x,tg.pos.z,2.2,1.8,b.baseDmg*0.9,'Brimstone');toast('🔥 Brimstone: move!');}}}
function hmClear(e){const h=hmOn();if(!h||h.done)return;h.done=true;const hm=hmi(),key=h.key,T0=hmTab(key)[h.tier];const sec=T-h.t0;const timed=!!h.par&&sec<=h.par;
  const b=hm.best[key]||(hm.best[key]={c:0,tm:0,sec:0,st:0});const was=b.tm;b.c=Math.max(b.c,h.tier);if(timed)b.tm=Math.max(b.tm,h.tier);
  if(h.tier>b.st||(h.tier===b.st&&(!b.sec||sec<b.sec))){b.st=h.tier;b.sec=Math.round(sec);}hm.runs++;
  let msg='⚔ <b style="color:'+T0.c+'">'+T0.n+'</b> clear'+(h.par?' in <b>'+hmFmt(sec)+'</b> (timer '+hmFmt(h.par)+')':'')+'.';
  if(timed){hm.timed++;hm.caches++;const D=DUN.D;const keys=rollBossLoot(D,e.boss.key,{extra:0.5,relic:1.5});const cr=60*e.lv*h.tier;P.credits+=cr;
    keys.forEach((k,i)=>{const it=hmItem(makeUnique(k,DUN.mode&&DUN.mode.vet));if(!it)return;it.dropBy='Bonus Cache';const a=1.2+i*0.9;dropLoot(e.pos.x+Math.cos(a)*3,e.pos.z+Math.sin(a)*3,it);});
    ringFx(e.pos.x,e.pos.z,0xffd27a,4,1);msg+=' ⏱ <b style="color:#ffd27a">Beat the clock!</b> Bonus Cache: '+keys.length+' extra item'+(keys.length===1?'':'s')+' and '+cr+' credits.';
    const nx=hmTab(key)[h.tier+1];if(nx&&h.tier+1>=3&&was<h.tier)msg+=' <b>'+nx.n+'</b> unlocked.';
    setTimeout(()=>banner('BEAT THE CLOCK',T0.n+' in '+hmFmt(sec)+' · Bonus Cache dropped'),3400);}
  else if(h.par)msg+=' Over time: no Bonus Cache.';
  if(key[0]==='r'){const n=4*h.tier;P.sigils=(P.sigils|0)+n;msg+=' +'+n+' bonus '+RAID_CUR+'.';}
  if(h.tier===1&&b.c===1&&key[0]!=='r')msg+=' <b>Nightmare</b> unlocked.';
  log(msg);hmTitleCheck();save();}
function hmTitleCheck(){const B=hmi().best;P.titles=P.titles||[];for(const t of HM_TITLES)if(!P.titles.includes(t.n)&&t.ok(B)){P.titles.push(t.n);log('🏅 New title: <b style="color:#ffd27a">«'+t.n+'»</b> ('+t.d+'). Show it from any difficulty panel.');toast('🏅 Title unlocked: «'+t.n+'»');}}
function hmTrackHtml(){const h=hmOn();if(!h)return '';const T0=hmTab(h.key)[h.tier];const el=T-h.t0;
  const tm=h.par?(h.done?'':` · <span id="hmTimer" style="color:${el>h.par?'#ff6a5a':el>h.par*0.8?'#ffd25a':'#6dff8a'}">⏱ ${hmFmt(el)} / ${hmFmt(h.par)}</span>`):'';
  return `<br><span id="hmTrack" style="color:${T0.c}">⚔ ${esc(T0.n)}</span>${h.aff.map(a=>' '+HM_AFF[a].ic).join('')}${tm}`;}
/* ---------- UI: difficulty picker (door, team door, raid panels) ---------- */
function hmPickHtml(key){const tab=hmTab(key),sel=hmSel(key),b=hmBest(key),T0=tab[sel],w=hmWeek(),raid=key[0]==='r';const aff=hmAffixes(sel,w,raid);
  const btns=tab.map((t,i)=>{const u=hmUnlocked(key,i);return `<button class="sbtn hmt${i===sel?' on':''}${u?'':' locked'}" data-act="${u?'hmsel':'hmlock'}" data-k="${key}" data-t="${i}" style="min-height:44px;min-width:72px;margin:2px;padding:4px 8px;${u?(i===sel?'outline:2px solid '+t.c+';background:#5a4424;':'background:#241c16;'):''}">${u?'':'🔒 '}<span style="color:${t.c}">${esc(t.n)}</span></button>`;}).join('');
  const lootK=raid?6:4;const titles=HM_TITLES.filter(t=>(P.titles||[]).includes(t.n));
  const next=[0,1,2,3].map(k=>hmAffixes(key[0]==='d'?4:2,w+k,raid)).map((a,k)=>(k?'+'+k:'now')+': '+a.map(x=>HM_AFF[x].ic+' '+HM_AFF[x].n).join(' '));
  return `<div class="mis hmbox" id="hmBox" style="border-color:#ffd27a"><b style="color:#ffd27a">⚔ Difficulty</b> <span style="opacity:.75;font-size:13px">· ${raid?'raid':key[0]==='t'?'team version':'this dungeon'}</span>
    <div class="hmrow" style="display:flex;flex-wrap:wrap;margin:4px 0">${btns}</div>
    <div style="font-size:13px">${sel?`<b style="color:${T0.c}">${esc(T0.n)}</b>: enemies <b>×${T0.hp}</b> HP and <b>×${key[0]==='t'?+(1+(T0.dmg-1)*0.5).toFixed(2):T0.dmg}</b> damage · uniques <b>+${lootK*sel}%</b> item power, <b>+${8*sel}%</b> extra-drop chance, <b>×${(1+0.2*sel).toFixed(1)}</b> Relic chance${key==='r:sunless'?' · <b>'+[0,20,40][sel]+'%</b> extra <b style="color:#ffd27a">Sunforged</b> piece per boss · Total Eclipse comes at <b>'+hmFmt(480*T0.hp)+'</b>':''}${raid?' · +'+4*sel+' bonus '+RAID_CUR+' on a clear · no timer (checkpoints)':' · ⏱ beat the timer for a <b>Bonus Cache</b> (extra boss loot and credits)'+(sel>=2&&key[0]==='d'?' and to unlock the next Ascent tier':'')}.`:'Normal: the standard run. Clear it once to unlock <b>Hard</b>.'}</div>
    ${aff.length?`<div style="font-size:13px;margin-top:3px"><b>This week's twists</b> (game week ${w+1}):${aff.map(a=>`<div>${HM_AFF[a].ic} <b>${HM_AFF[a].n}</b>: ${esc(HM_AFF[a].d)} <i style="opacity:.8">Tip: ${esc(HM_AFF[a].tip)}</i></div>`).join('')}</div>`:`<div style="font-size:12px;opacity:.75;margin-top:3px">${key[0]==='d'?'Nightmare and Ascent II+ add weekly twists.':'Nightmare adds a weekly twist.'}</div>`}
    <div style="font-size:12px;opacity:.75">Twists rotate ${esc(typeof gweekTxt==='function'?gweekTxt():'every game week')} · ${next.join(' · ')}</div>
    <div style="font-size:12px;margin-top:3px">Best: ${b.c?`<b>${esc(tab[Math.min(b.c,tab.length-1)].n)}</b> cleared${b.sec?' · '+esc(tab[Math.min(b.st,tab.length-1)].n)+' in '+hmFmt(b.sec):''}${b.tm?' · timed up to <b>'+esc(tab[Math.min(b.tm,tab.length-1)].n)+'</b>':''}`:'no hard clear yet'}</div>
    ${titles.length?`<div style="margin-top:4px">${titles.map(t=>`<button class="sbtn" data-act="hmtitle" data-n="${esc(t.n)}" style="min-height:44px;margin:2px">${P.title===t.n?'✔ ':''}«${esc(t.n)}»</button>`).join('')}</div>`:`<div style="font-size:12px;opacity:.7">Titles: «the Unyielding» (Hard), «Nightwalker» (Nightmare), «Ascendant» (Ascent III timed), «Peakbreaker» (Ascent V timed).</div>`}</div>`;}
function hmRerender(key){const id=key.slice(2);if(key[0]==='r'){if(typeof openRaid==='function')openRaid(id,'team');}else if(DUNGEONS[id])openDoor(id);}
function hmAct(a,b){const D=b.dataset;
  if(a==='hmsel'){if(hmSet(D.k,+D.t)){const T0=hmTab(D.k)[+D.t];toast('⚔ Difficulty: '+T0.n);}hmRerender(D.k);return true;}
  if(a==='hmlock'){warn('🔒 '+hmLockMsg(D.k,+D.t));return true;}
  if(a==='hmtitle'){const n=D.n;if(!(P.titles||[]).includes(n))return true;P.title=P.title===n?null:n;save();const k=(document.querySelector('#hmBox .hmt')||{}).dataset;if(k&&k.k)hmRerender(k.k);return true;}
  return false;}
function hmExports(){return {HM_VER,HM_TIERS,HM_TEAM,HM_RAID,HM_AFF,HM_A1,HM_A2,HM_TITLES,normHm,hmFields,hmi,hmWeek,hmAffixes,hmBest,hmUnlocked,hmSel,hmSet,hmForce,hmMode,hmOn,hmPar,hmFmt,hmItem,hmBonus,hmTick,hmEnrageK,hmClear,hmTitleCheck,hmTrackHtml,hmPickHtml,hmAct};}
