/* ================= TEAM PROGRESSION: team dungeons, level bands, level sync, companion XP =================
   Data rules (all data-driven, so new professions / roles / dungeons slot in):
   - TEAMD: one team dungeon per region band, reusing that region's dungeon map in a harder "team" mode.
       content = level the dungeon is tuned for; members count only within ±TD_RANGE of it (roster characters only, mercenaries never count)
       minTeam = total team size needed (you + counted companions); req = list of {role} / {prof} / {any:[...]} entries, each with a why.
   - Level bands: levels 1-10, 11-20, 21-30 (31+ when the cap rises). Going past a band edge needs one clear of that band's team dungeon.
       XP is held at the edge (and a banner says why). Characters already past an edge when this shipped are grandfathered (marked 'grand').
   - Level sync: while teamed (open world too), everyone above the lowest team member is scaled down to that level (in a team dungeon:
       never above its content level). Synced: level-based HP/energy/armour/damage, spent attribute/skill points, gear above the sync level,
       perk ranks the sync level couldn't have, and Weaves/perk actions above the sync level are locked.
   - Companions share XP: each counted roster companion gets 50% of the kill XP on their own sheet (their own band cap applies).
       Kill XP is cut when anyone on the team (true level) is far above the enemy.
   - Team-only rewards: Paragon rarity gear (team bosses only) and +1 bonus perk point per team dungeon on its first clear. */
const TD_RANGE=5,TD_SHARE=0.5,TD_BANDS=[10,20,30,40,50],PARA=8;
const TEAM_ROLES={tank:{n:'Tank',ic:'🛡'},healer:{n:'Healer',ic:'✚'},dps:{n:'Damage',ic:'⚔'},control:{n:'Control',ic:'🌀'},pet:{n:'Pet master',ic:'🤖'}};
const TEAMD={
  vault:{key:'vault',band:1,name:'Theta-9 Lockdown',sub:'Team dungeon · Vault Theta-9 on full alert',content:10,minLvl:8,lvl:1,minTeam:3,
    req:[{role:'healer',why:'The Custodian\'s Purge Pulse hits the whole team every few seconds'}],
    mech:{buster:{name:'Breach Strike',every:12,first:7,mult:3.0},pulse:{name:'Purge Pulse',every:16,first:10,pct:0.2},adds:{name:'Lockdown drones',at:[0.66,0.33],n:3}}},
  choir:{key:'choir',band:2,name:'The Full Chorus',sub:'Team dungeon · every voice of the Choir at once',content:20,minLvl:17,lvl:3,minTeam:3,
    req:[{role:'tank',why:'Crushing Verse would flatten anyone but a tank'},{any:[{prof:'weaver'},{prof:'mind'}],why:'Only a Vyreweaver or a Dreamshaper can unweave the Hymn Seal on the Choirmother'}],
    mech:{buster:{name:'Crushing Verse',every:11,first:6,mult:3.2},pulse:{name:'Dirge',every:15,first:9,pct:0.2},adds:{name:'Choir echoes',at:[0.7,0.35],n:3},seal:{name:'Hymn Seal',at:0.5,prof:'weaver',profs:['weaver','mind'],chan:5}}},
  stillvault:{key:'stillvault',band:3,name:'Stillvault: Deep Stacks',sub:'Team dungeon · the frozen archive wakes',content:30,minLvl:27,lvl:3,minTeam:3,
    req:[{role:'tank',why:'The Rimewarden\'s Glacier Maul must land on a tank'},{any:[{role:'healer'},{role:'support'}],why:'Hoarfrost ticks the whole team down: bring a healer or a support (Anthemist / Exactor) to keep everyone up'}],
    mech:{buster:{name:'Glacier Maul',every:11,first:6,mult:3.4},pulse:{name:'Hoarfrost',every:14,first:8,pct:0.22},adds:{name:'Frozen archivists',at:[0.7,0.4],n:3}}},
  // Build J: the Lv 40 gate (The Drowned Foundry in team mode) and, ready for the next cap raise, the Lv 50 gate (The Heartforge)
  foundry:{key:'foundry',band:4,name:'Foundry: Floodtide',sub:'Team dungeon · every sluice in the Drowned Foundry open at once',content:40,minLvl:37,lvl:3,minTeam:3,
    req:[{role:'tank',why:'The Sluice Warden\'s Floodhammer must land on a tank'},{role:'healer',why:'Spore Rot ticks the whole team down'},{any:[{role:'control'},{role:'support'}],why:'Sluice adds flood the hall: bring crowd control (Vyreweaver / Dreamshaper) or a support (Anthemist / Exactor)'}],
    mech:{buster:{name:'Floodhammer',every:11,first:6,mult:3.5},pulse:{name:'Spore Rot',every:14,first:8,pct:0.23},adds:{name:'Drowned smelters',at:[0.7,0.4],n:3}}},
  heartforge:{key:'heartforge',band:5,name:'Heartforge: Ignition',sub:'Team dungeon · the Sovereign at full fire',content:50,minLvl:47,lvl:3,minTeam:3,
    req:[{role:'tank',why:'Sovereign\'s Brand would melt anyone but a tank'},{role:'healer',why:'Rift Heat burns the whole team'},{prof:'flux',why:'Only a Fluxwright can bleed off the Sovereign\'s Core Seal'}],
    mech:{buster:{name:'Sovereign\'s Brand',every:11,first:6,mult:3.6},pulse:{name:'Rift Heat',every:13,first:8,pct:0.24},adds:{name:'Forge wraiths',at:[0.7,0.35],n:3},seal:{name:'Core Seal',at:0.5,prof:'flux',chan:5}}}};
const TDS={warnT:-99,capT:-99,xpT:-99,acc:0,sync:0};
function roleOfChar(c){return (c&&c.party&&c.party.role)||ROLE[c&&c.prof]||'dps';}
function bandTD(b){return Object.values(TEAMD).find(t=>t.band===b)||null;}
function normTG(t,lv){t=t&&typeof t==='object'?t:{};const o={n:t.n&&typeof t.n==='object'?t.n:{}};TD_BANDS.forEach((E,i)=>{const k='b'+(i+1);const v=t[k];o[k]=v==='clear'||v==='grand'?v:(lv>E?'grand':0);});return o;}
function tgOf(c){if(!c.tg||typeof c.tg!=='object'||!('b1' in c.tg))c.tg=normTG(c.tg,c.level||1);return c.tg;}
// highest level this character may reach right now (band edge until the band's team dungeon is cleared)
function bandCapOf(c){const tg=tgOf(c);for(let i=0;i<TD_BANDS.length;i++){const E=TD_BANDS[i];if((c.level||1)<=E&&!tg['b'+(i+1)])return E;}return 999;}
function bandCapMsg(E,quiet){const b=TD_BANDS.indexOf(E)+1,td=bandTD(b);const msg='Level '+(E+1)+'+ unlocks after one team clear of '+(td?td.name:'this region\'s team dungeon')+' (team of '+(td?td.minTeam:3)+'+'+(td&&td.req.length?', needs '+td.req.map(reqLabel).join(' + '):'')+')';
  if(quiet)return msg;if(T-TDS.capT>25){TDS.capT=T;banner('XP CAPPED AT LEVEL '+E,msg);log('🔒 <b>XP capped at level '+E+'.</b> '+esc(msg)+'. Open 👥 Team to see what you need.');}return msg;}
function tgClear(b,c){c=c||P;const tg=tgOf(c);tg['b'+b]='clear';}
/* ---------- level sync ---------- */
function syncCalc(){if(state!=='play'||!teamActive()||inRaid())return 0;const lv=[P.level];for(const id of teamPicks()){const c=roster.chars.find(x=>x.id===id);if(c)lv.push(c.level);}
  let L=Math.min(...lv);const td=tdActive();if(td)L=Math.min(L,td.content);return Math.max(...lv)>L?L:0;}
function effLvP(){return SYNC.lv&&SYNC.lv<P.level?SYNC.lv:P.level;}
function abLv(ab){if(!ab)return 1;if(ab.perk&&PERKS[ab.perk])return perkLvl(PERKS[ab.perk],1);return ab.lvl||1;}
function syncLocked(ab){const L=effLvP();if(L>=P.level||!ab||ab.starter)return false;const need=abLv(ab);if(need<=L)return false;warn('🔒 '+ab.name+' needs level '+need+': you are level-synced to '+L+' with your team');return true;}
function tdActive(){return DUN&&DUN.mode&&DUN.mode.team?TEAMD[DUN.mode.tkey]:null;}
/* ---------- XP: reductions + companion share ---------- */
function teamTrueTop(){let t=P.level;for(const a of comps())if(!a.merc){const c=roster.chars.find(x=>x.id===a.snapId);if(c)t=Math.max(t,c.level);}return t;}
function teamXpAdj(xp,e){if(!teamActive()||inRaid()||!comps().length)return xp;const ref=tdActive()?tdActive().content:e.lv;const over=teamTrueTop()-ref-TD_RANGE;if(over<=0)return xp;
  const m=Math.max(0.1,1-0.2*over);if(T-TDS.xpT>30){TDS.xpT=T;log('📉 Team XP reduced to '+Math.round(m*100)+'%: someone on your team is far above this content (level '+teamTrueTop()+').');}return Math.max(1,Math.round(xp*m));}
function sheetGainXp(c,n){if(!c||n<=0||c.xpLock)return 0;const cap=Math.min(MAXLVL,bandCapOf(c));if(c.level>=cap){c.xp=Math.min((c.xp||0)+n,xpNeed(c.level)-1);return 0;}c.xp=(c.xp||0)+n;let up=0;
  while(c.level<cap&&c.xp>=xpNeed(c.level)){c.xp-=xpNeed(c.level);c.level++;c.sp=(c.sp||0)+spGain(c.level);up++;}if(c.level>=cap)c.xp=Math.min(c.xp,xpNeed(c.level)-1);return up;}
function teamShareXp(xp,e){if(!teamActive()||inRaid())return;const ref=tdActive()?tdActive().content:e.lv;let ch=false;
  for(const a of comps()){if(a.merc)continue;const c=roster.chars.find(x=>x.id===a.snapId);if(!c||Math.abs(c.level-ref)>TD_RANGE||dist2D(a.pos,P.pos)>45)continue;
    const up=sheetGainXp(c,Math.round(xp*TD_SHARE));ch=true;if(up){log('👥 <b>'+esc(c.name)+'</b> reached level '+c.level+'!');floatText(tmpV.set(a.pos.x,a.pos.y+a.h+0.6,a.pos.z),'LEVEL '+c.level,'info');removeAlly(a);TDS.sync=-1;}}
  if(ch)TDS.dirty=true;}
/* ---------- team dungeon entry ---------- */
function sealProfs(sl){return sl.profs||[sl.prof];}
function reqLabel(r){if(r.any)return r.any.map(reqLabel).join(' or ');if(r.prof)return (PROFS[r.prof]?PROFS[r.prof].name:r.prof);const R=TEAM_ROLES[r.role];return R?R.ic+' '+R.n:r.role;}
function reqMetBy(r,m){if(r.any)return r.any.some(x=>reqMetBy(x,m));if(r.prof)return m.prof===r.prof;return m.role===r.role;}
function tdMembers(){const me={id:activeId,name:P.name,prof:P.prof,level:P.level,role:roleOfChar(P),you:true};const out=[me];
  if(teamActive())for(const id of teamPicks()){const c=roster.chars.find(x=>x.id===id);if(c)out.push({id,name:c.name,prof:c.prof,level:c.level,role:roleOfChar(c)});}return out;}
function teamDunCheck(id,mem){const td=TEAMD[id],D=DUNGEONS[id];if(!td||!D)return {ok:false,why:'unknown',msg:'No team dungeon here',rows:[]};mem=mem||tdMembers();
  const inR=m=>Math.abs(m.level-td.content)<=TD_RANGE;const cnt=mem.filter(inR);const rows=[];const me=mem[0];
  rows.push({ok:teamActive(),t:'Team summoned (👥 Team)',d:teamActive()?'':'summon your team first'});
  rows.push({ok:me.level>=td.minLvl&&inR(me),t:'You: Lv '+me.level+' (needs '+Math.max(td.minLvl,td.content-TD_RANGE)+'–'+(td.content+TD_RANGE)+')',d:''});
  rows.push({ok:cnt.length>=td.minTeam,t:'Team of '+td.minTeam+'+ roster characters within ±'+TD_RANGE+' of Lv '+td.content+': '+cnt.length+'/'+td.minTeam,d:mem.filter(m=>!inR(m)).map(m=>m.name+' (Lv '+m.level+') doesn\'t count').join(', ')});
  for(const r of td.req){const who=cnt.find(m=>reqMetBy(r,m));rows.push({ok:!!who,t:'Needs '+reqLabel(r)+(who?': '+who.name:''),d:r.why||'',req:1});}
  let gate=null;if(D.gate&&typeof gateOpen==='function'&&!gateOpen(D.gate))gate=gateMsg(D.gate);if(gate)rows.push({ok:false,t:gate,d:''});
  const bad=rows.find(r=>!r.ok);return {ok:!bad,why:bad?(bad.req?'req':'team'):'',msg:bad?td.name+': '+bad.t+(bad.d&&bad.req?' ('+bad.d+')':''):'',rows,counted:cnt,td};}
let TEAM_ENTERING=null;
function enterTeamDungeon(id){const td=TEAMD[id];if(!td||DUN)return false;const ck=teamDunCheck(id);if(!ck.ok){warn(ck.msg);return false;}
  const party=teamSnaps();const n=ck.counted.length;const modeObj={hp:1.5+0.45*n,dmg:1.25,lvl:td.lvl,size:[td.minTeam,TEAM_COMP+1],team:true,tkey:id};
  TEAM_ENTERING=id;let ok=false;try{ok=enterDungeon(id,{party,modeObj});}finally{TEAM_ENTERING=null;}
  if(ok){DUN.tdCounted=ck.counted.filter(m=>!m.you).map(m=>m.id);TDS.sync=-1;banner('👥 '+td.name.toUpperCase(),td.sub+' · tuned for level '+td.content);log('👥 Team dungeon <b>'+esc(td.name)+'</b>: bosses hit tanks hard, pulse the whole team and call adds. Paragon gear drops only here.');}
  return ok;}
function tdRowsHtml(rows){return rows.map(r=>`<div class="tdrow ${r.ok?'up':'down'}">${r.ok?'✔':'✖'} ${esc(r.t)}${r.d?`<small> · ${esc(r.d)}</small>`:''}</div>`).join('');}
function teamDoorHtml(id){const td=TEAMD[id];if(!td)return '';const ck=teamDunCheck(id);const tg=tgOf(P);const st=tg['b'+td.band];const E=TD_BANDS[td.band-1];
  return `<div class="mis tdbox" style="border-color:#ff5fd2"><b style="font-size:16px;color:#ff5fd2">👥 ${esc(td.name)}</b> <span style="opacity:.75">· ${esc(td.sub)}</span>
    <div style="font-size:13px;margin:4px 0">Tuned for <b>level ${td.content}</b> (members count within ±${TD_RANGE}). Higher members are <b>level-synced</b> down. Bosses: <b>${esc(td.mech.buster.name)}</b> (tank-buster), <b>${esc(td.mech.pulse.name)}</b> (team-wide damage: bring healing), <b>${esc(td.mech.adds.name)}</b> (adds)${td.mech.seal?`, <b>${esc(td.mech.seal.name)}</b> (only a ${esc(sealProfs(td.mech.seal).map(k=>PROFS[k].name).join(' or '))} can break it)`:''}.</div>
    <div class="h4" style="margin:4px 0">Requirements</div>${tdRowsHtml(ck.rows)}
    <div style="font-size:13px;margin-top:4px">🏅 First clear: unlocks <b>levels ${E+1}+</b>${st==='clear'?' (done ✔)':st==='grand'?' (you were already past it ✔)':''} and <b>+1 bonus perk point</b> for everyone counted. Only team bosses drop <b style="color:#ff5fd2">Paragon</b> gear.</div>
    <button class="sbtn${ck.ok?'':' locked'}" style="margin-top:8px;background:${ck.ok?'#a8338a':''}" data-act="${ck.ok?'tdenter':'noop'}" data-id="${id}">${ck.ok?'👥 Enter '+esc(td.name):'🔒 '+esc(ck.rows.find(r=>!r.ok).t)}</button></div>`;}
/* ---------- team boss mechanics ---------- */
function tdTeamList(){const L=[{e:P,f:S.maxHp,tank:roleOfChar(P)==='tank',prof:P.prof}];for(const a of comps())L.push({e:a,f:a.maxHp,tank:a.role==='tank',prof:a.prof||((roster.chars.find(c=>c.id===a.snapId)||{}).prof)});return L;}
function tdHit(x,amt,src,raw){if(x.e===P){if(!P.dead)dmgPlayer(amt,src,true);}else allyTakeDmg(x.e,raw?amt/Math.max(0.4,1-x.e.dr):amt,src);}
function teamBossTick(e){const td=tdActive();if(!td||e.dead)return;const M=td.mech;
  if(e.state!=='chase'){if(e.tb){e.tb=null;e.immune=null;for(const a of enemies.slice())if(a.tdAdd===e)removeEnemy(a);}return;}
  const b=e.tb||(e.tb={next:{buster:T+M.buster.first,pulse:T+M.pulse.first},done:{},pend:null,final:!!e.boss.final});const hpF=e.hp/e.maxHp;
  // tank-buster: telegraphed on whoever the boss is fighting; a tank braces (-60%), anyone else takes the full hit
  if(T>=b.next.buster&&!b.pend){b.next.buster=T+M.buster.every;const f=e.foe&&!e.foe.dead&&allies.includes(e.foe)?e.foe:P;const x=tdTeamList().find(o=>o.e===f)||tdTeamList()[0];
    b.pend={at:T+1.6,x};toast('⚠ '+M.buster.name+' on '+(x.e===P?'YOU':x.e.name)+(x.tank?' (tank braces)':': get a tank on the boss!'));floatText(entChest(e,tmpV),M.buster.name+'!','info');ringFx(x.e.pos.x,x.e.pos.z,0xff2a6a,1.6,1.6);}
  if(b.pend&&T>=b.pend.at){const x=b.pend.x;b.pend=null;if(x.e===P||(!x.e.dead&&allies.includes(x.e))){const tank=x.tank;tdHit(x,e.dmg*M.buster.mult*(tank?0.4:1),e);ringFx(x.e.pos.x,x.e.pos.z,0xff2a6a,2.4,0.4);nz(0.3,0.1,500);TDS.lastBuster={tank,t:T};}}
  // heavy team-wide pulse: % of max HP to everyone, needs healing to sustain
  if(T>=b.next.pulse){b.next.pulse=T+M.pulse.every;for(const x of tdTeamList())tdHit(x,x.f*M.pulse.pct,e,true);ringFx(e.pos.x,e.pos.z,0xff5fd2,16,0.7);toast('💢 '+M.pulse.name+': the whole team takes damage');TDS.pulses=(TDS.pulses||0)+1;}
  // adds: they go for the healer first, so the tank has to pick them up (companion tanks taunt them)
  M.adds.at.forEach((th,j)=>{if(b.done['a'+j]||hpF>th)return;b.done['a'+j]=1;const r=e.boss.room||{w:24,cz:e.pos.z,d:20};const et=tdAddType();const heal=comps().find(a=>a.role==='healer');
    for(let n=0;n<M.adds.n;n++){const a=spawnDunMob(et,(n%2?1:-1)*(r.w/2-2.5),r.cz+rand(-r.d/3,r.d/3),td.content-1,{temp:true});a.addOf=e;a.tdAdd=e;a.state='chase';a.nextAtk=T+1.2;if(heal)a.foe=heal;ringFx(a.pos.x,a.pos.z,0xff5fd2,2.5,0.6);}
    toast('⚠ '+M.adds.name+'! Tank: pick them up');});
  // profession seal (data-driven): the boss is shielded until a member of the right profession channels it open
  const sl=M.seal;if(sl&&b.final){if(!b.done.seal&&hpF<=sl.at){b.done.seal=1;b.sealT=null;e.immune=()=>true;banner('🔒 '+sl.name.toUpperCase(),'Only a '+sealProfs(sl).map(k=>PROFS[k].name).join(' or ')+' can break it. Keep them alive and near the boss.');}
    if(b.done.seal===1){const sp=tdTeamList().filter(x=>sealProfs(sl).includes(x.prof)&&!x.e.dead&&!(x.e===P&&P.dead));const w=sp.find(x=>dist2D(x.e.pos,e.pos)<(x.e===P?16:24));
    // Build O: no living sealer left (companion downed) -> the seal frays on its own after 20 s instead of an endless immune boss
    if(!sp.length){if(b.frayT==null){b.frayT=T+20;toast('🔓 No '+sealProfs(sl).map(k=>PROFS[k].name).join('/')+' standing: the '+sl.name+' will fray on its own in 20 s');}else if(T>=b.frayT){b.done.seal=2;e.immune=null;b.frayT=null;banner(sl.name.toUpperCase()+' FRAYED','It gave way on its own. The boss is vulnerable again');}}else b.frayT=null;if(w){if(b.sealT==null){b.sealT=T+sl.chan;toast('🌀 '+(w.e===P?'You start':w.e.name+' starts')+' unweaving the '+sl.name+' ('+sl.chan+'s)');}
        else if(T>=b.sealT){b.done.seal=2;e.immune=null;ringFx(e.pos.x,e.pos.z,0xb46bff,6,0.8);banner(sl.name.toUpperCase()+' BROKEN','The boss is vulnerable again');}}else b.sealT=null;}}}
function tdAddType(){const D=DUN.D;let first=null;for(const r of D.rooms)if(r.packs)for(const pk of r.packs)for(const m of (pk||[])){const t=m&&m[0];if(!t||!ETYPES[t])continue;first=first||t;
  // Build O: the tank-pickup adds must not be enemy healers (a healer pack type made Floodtide's boss heal 8%/s)
  if(!balOn()||!/heal/.test(String(ETYPES[t].ai||ETYPES[t].behav||ETYPES[t].role||'')))return t;}return first||'sentry';}
/* ---------- team rewards ---------- */
function genParagon(lvl,prof){prof=prof||P.prof;const slot=Math.random()<0.4?'weapon':pick(['head','armor','hands','legs','feet']);const it=genItem(lvl,slot,3,slot==='weapon'?{wt:pick(wtAff(prof))}:{fam:PROF_FAM[prof]});
  const k=RAR[PARA].m/RAR[3].m;it.r=PARA;if(it.dmg)it.dmg=Math.round(it.dmg*k);if(it.armor)it.armor=Math.round(it.armor*k);const have=new Set(it.bonus.map(b=>b.s));
  for(let i=0;i<2;i++){let s=pick(GEARBONUS),g=0;while(have.has(s)&&g++<12)s=pick(GEARBONUS);have.add(s);it.bonus.push({s,v:bonusVal(s,lvl,1.1)});}
  it.name='Paragon '+it.name.replace(/^(Dusty|Scavenged|Worn|Tuned|Salvaged|Patched|Reach-made|Scoured) /,'');it.team=1;it.value=Math.round(it.value*2.2);return it;}
function sheetGive(c,it){c.inv=c.inv||[];if(c.inv.length<24){c.inv.push(it);return true;}c.credits=(c.credits||0)+it.value;return false;}
function teamBossLoot(e){const td=tdActive();if(!td)return;const n=e.boss.final?(1+(Math.random()<0.3?1:0)):(Math.random()<0.35?1:0);
  for(let i=0;i<n;i++){const it=genParagon(td.content);it.dropBy=e.T.name;dropLoot(e.pos.x+rand(-2,2),e.pos.z-2+rand(-1,1),it);}
  if(e.boss.final)teamDunClear(td);}
function teamDunClear(td){const tg=tgOf(P);const k='b'+td.band;const first=!tg.n[td.key];tg.n[td.key]=(tg.n[td.key]|0)+1;const was=tg[k];tg[k]='clear';const E=TD_BANDS[td.band-1];
  if(first){P.ppBonus=(P.ppBonus|0)+1;P.pp=ppAvail();}
  const names=[];for(const id of (DUN.tdCounted||[])){const c=roster.chars.find(x=>x.id===id);if(!c)continue;const ct=tgOf(c);const f1=!ct.n[td.key];ct.n[td.key]=(ct.n[td.key]|0)+1;ct[k]='clear';if(f1)c.ppBonus=(c.ppBonus|0)+1;
    if(f1||Math.random()<0.4){const it=genParagon(td.content,c.prof);it.dropBy=td.name;sheetGive(c,it);names.push(c.name+(f1?' (+1 perk point, '+it.name+')':' ('+it.name+')'));}else names.push(c.name);}
  setTimeout(()=>banner('👥 TEAM CLEAR · '+td.name.toUpperCase(),(was!=='clear'&&was!=='grand'?'Levels '+(E+1)+'+ unlocked! ':'')+(first?'+1 bonus perk point':'Paragon gear for the team')),2600);
  log('🏅 <b>'+esc(td.name)+'</b> cleared'+(first?': <b>+1 bonus perk point</b>':'')+(was!=='clear'&&was!=='grand'?', <b>levels '+(E+1)+'+ unlocked</b>':'')+'.'+(names.length?' Team credit: '+esc(names.join(', '))+'.':''));
  if(P.level>=E&&was!=='clear'&&was!=='grand')gainXp(0);save();}
/* ---------- role AI: tank taunts, hold stance ---------- */
function tdUpdate(dt){if(state!=='play')return;TDS.acc+=dt;if(TDS.acc<0.25)return;const st=TDS.acc;TDS.acc=0;
  const L=syncCalc();if(L!==SYNC.lv||TDS.sync===-1){const was=SYNC.lv;SYNC.lv=L;TDS.sync=0;calcStats();if(was!==L){for(const a of allies.slice())if(a.comp&&!a.dead){const h=a.hp/a.maxHp;removeAlly(a);TDS.keepHp=TDS.keepHp||{};TDS.keepHp[a.snapId]=h;}teamSync();
      for(const a of comps())if(TDS.keepHp&&TDS.keepHp[a.snapId]!=null){a.hp=Math.max(1,Math.round(a.maxHp*TDS.keepHp[a.snapId]));}TDS.keepHp=null;
      if(L)toast('⇩ Level sync: team scaled to level '+L+(P.level>L?' (you too)':''));else if(was)toast('⇧ Level sync off');if(panelOpen==='team')openTeam();}}
  if(TDS.dirty&&!(T-(TDS.saveT||-99)<10)){TDS.dirty=false;TDS.saveT=T;save();}
  if(!teamActive())return;const al=comps();const cfg=teamCfg();
  for(const a of al){if(cfg.stance==='hold'&&a.cmd!=='attack'&&a.cmd!=='stay'&&T>(a.regroupUntil||0)){a.cmd='stay';a.stayAt={x:a.pos.x,z:a.pos.z};}
    if(a.role!=='tank'||a.stance==='passive')continue;a.tauntCd=(a.tauntCd||0)-st;if(a.tauntCd>0)continue;
    let n=0;for(const e of enemies){if(e.dead||e.state!=='chase'||e.guard||e.foe===a)continue;if(dist2D(e.pos,a.pos)>14)continue;e.foe=a;e.tauntUntil=T+5;n++;}
    if(n){a.tauntCd=balOn()?4.5:8;ringFx(a.pos.x,a.pos.z,0x5fb0ff,4,0.5);floatText(tmpV.set(a.pos.x,a.pos.y+a.h+0.5,a.pos.z),'Taunt','info');}}}
function syncHudLine(){if(!SYNC.lv)return '';return `<div class="tmsync">⇩ Level sync: Lv ${SYNC.lv}</div>`;}
function teamPanelExtra(){const tg=tgOf(P);const cap=Math.min(MAXLVL,bandCapOf(P));let h='';
  h+=`<div class="h4">Progress & level sync</div><div style="font-size:13px">`+(cap<MAXLVL?`🔒 You can level to <b>${cap}</b>. ${esc(bandCapMsg(cap,true))}.`:`✔ No band lock for you right now (max level ${MAXLVL}).`)+
    ` Bands: `+TD_BANDS.map((E,i)=>{const v=tg['b'+(i+1)],td=bandTD(i+1);return `<b class="${v?'up':'down'}">${E}→${E+1} ${v==='clear'?'✔ cleared':v==='grand'?'✔ already past':'needs '+esc(td?td.name:'team clear')}</b>`;}).join(' · ')+`</div>`;
  h+=`<div style="font-size:13px;margin-top:4px">${SYNC.lv?`⇩ <b>Level sync on: everyone is scaled to level ${SYNC.lv}</b> (stats, damage, healing, gear above that level, perk ranks; Weaves above it are locked).`:'Level sync: when a lower-level character is on the team, everyone above them is scaled down to their level (anti power-levelling).'} Companions get ${Math.round(TD_SHARE*100)}% of kill XP on their own sheets if they're within ${TD_RANGE} levels; kill XP drops when someone is far above the content.</div>`;
  h+=`<div class="h4">Team dungeons</div>`+Object.values(TEAMD).map(td=>{const ck=teamDunCheck(td.key);const D=DUNGEONS[td.key];return `<div class="mis tdbox" style="border-color:${ck.ok?'#4fe36a':'#ff5fd2'}"><b style="color:#ff5fd2">👥 ${esc(td.name)}</b> <small>· ${esc(D.name)} door · Lv ${td.content} · unlocks ${TD_BANDS[td.band-1]+1}+</small>${tdRowsHtml(ck.rows.filter(r=>!/^Team summoned/.test(r.t)||!r.ok))}</div>`;}).join('');
  return h;}
function tdExports(){return {TEAMD,TEAM_ROLES,TD_RANGE,TD_BANDS,TEAM_COMP,PARA,SYNC,TDS,normTG,tgOf,bandCapOf,tgClear,syncCalc,effLvP,syncLocked,abLv,teamXpAdj,teamShareXp,sheetGainXp,teamDunCheck,enterTeamDungeon,teamDoorHtml,teamBossTick,genParagon,teamDunClear,tdUpdate,tdMembers,reqLabel,roleOfChar,tdActive,teamPanelExtra,bandTD};}
