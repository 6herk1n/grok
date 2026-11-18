/* ================= TEAM MODE: your own alts as AI companions, anywhere =================
   👥 button / T toggles; the 👥 panel picks up to 3 companions (alts, + optional contract mercenaries), stance, heal priority and commands.
   Rules: the character you play gets the loot, credits, sigils and mission progress; roster companions get a 50% XP share on their own
   sheets and team-dungeon credit (see bands, level sync and team dungeons). Dungeon caps judge the team by its highest (synced) member.
   Raids keep their own team rules: companions step aside inside a raid and come back after. Downed companions revive out of combat. */
const TEAM_REVIVE=10,TEAM_COMP=3;// open-world/dungeon team: you + up to 3 companions (raids keep TEAM_MAX)
const TM={dead:{},acc:0,list:[]};
function normTeam(t){t=t&&typeof t==='object'?t:{};return {on:!!t.on,ids:Array.isArray(t.ids)?t.ids.filter(x=>typeof x==='string').slice(0,TEAM_COMP):null,stance:['follow','assist','hold','passive'].includes(t.stance)?t.stance:'assist',merc:!!t.merc,healPri:['lowest','tank','you'].includes(t.healPri)?t.healPri:'lowest'};}
function teamCfg(){if(!P.team||typeof P.team!=='object')P.team=normTeam(null);return P.team;}
function teamAlts(){return roster.chars.filter(c=>c.id!==activeId).map(c=>({id:c.id,name:c.name,level:c.level,prof:c.prof,role:(c.party&&c.party.role)||ROLE[c.prof]||'dps'})).sort((a,b)=>b.level-a.level);}
function teamPicks(){const al=teamAlts();const ok=new Set(al.map(a=>a.id));const c=teamCfg();return (Array.isArray(c.ids)?c.ids.filter(x=>ok.has(x)):al.map(a=>a.id)).slice(0,TEAM_COMP);}
function teamSnaps(){const c=teamCfg();const s=teamPicks().map(partySnapshot).filter(Boolean);
  if(c.merc){const lv=clamp(effLvP(),1,MAXLVL);const roles=new Set([ROLE[P.prof],...s.map(x=>x.role)]);const need=MERC.filter(m=>(m.role==='tank'||m.role==='healer')&&!roles.has(m.role)).concat(MERC.filter(m=>m.role!=='tank'&&m.role!=='healer'));
    let i=0;while(s.length<TEAM_COMP&&i<need.length)s.push(mercSnap(need[i++],lv));}return s;}
const comps=()=>allies.filter(a=>a.comp&&!a.dead);
const inRaid=()=>!!(DUN&&DUN.D&&DUN.D.raid);
function teamActive(){return state==='play'&&!!teamCfg().on;}
function spawnComp(s){const a=spawnPartyMember(s);if(!a)return null;a.comp=true;a.snapId=s.id;a.merc=!!s.merc;a.role=s.role;a.level=s.level;a.healCd=1.5+Math.random();a.stance=teamCfg().stance;if(s.merc)a.name=s.name;
  if(s.role==='tank'){a.threat=1;a.dr=Math.min(0.6,a.dr+0.1);}return a;}
function teamDismissAll(){for(const a of allies.slice())if(a.comp)removeAlly(a);TM.dead={};}
function teamSync(){if(!teamActive()||inRaid()||P.dead){if(!teamActive()||inRaid())for(const a of allies.slice())if(a.comp)removeAlly(a);return;}
  const snaps=teamSnaps();const want=new Set(snaps.map(s=>s.id));for(const a of allies.slice())if(a.comp&&!want.has(a.snapId))removeAlly(a);
  for(const s of snaps){if(allies.some(a=>a.comp&&a.snapId===s.id&&!a.dead))continue;if(TM.dead[s.id]!=null)continue;const a=spawnComp(s);if(a){const ang=Math.random()*6.28;a.pos.set(P.pos.x+Math.cos(ang)*2.5,0,P.pos.z+Math.sin(ang)*2.5);}}}
function toggleTeam(force){const c=teamCfg();const on=force!=null?!!force:!c.on;
  if(on&&!teamAlts().length&&!c.merc){warn('No alts yet: make more characters, or switch on mercenary fill in 👥');openTeam();return false;}
  if(on&&inRaid()){warn('Raids bring their own team');return false;}
  c.on=on;if(on){TM.dead={};teamSync();const n=comps().length;banner('👥 TEAM MODE ON',n+' companion'+(n===1?'':'s')+' · only '+P.name+' gains XP and loot');}else{teamDismissAll();toast('👥 Team dismissed');}
  save();if(panelOpen==='team')openTeam();return true;}
function teamAttack(){const t=validTarget();if(!t){warn('Pick a target first');return false;}let n=0;for(const a of comps()){a.prevCmd=a.cmd==='attack'?a.prevCmd:a.cmd;a.cmd='attack';a.target=t;a.regroupUntil=0;n++;}
  if(n)toast('👥 Team: attack '+t.T.name);return n>0;}
function teamRegroup(){let n=0;for(const a of comps()){a.target=null;if(a.cmd==='attack')a.cmd=a.prevCmd||'follow';if(a.cmd==='stay')a.cmd='follow';a.regroupUntil=T+4;n++;}if(n)toast('👥 Team: regroup on me');return n>0;}
function teamStance(s){const c=teamCfg();c.stance=s;for(const a of comps()){a.stance=s;if(s==='passive')a.target=null;if(s!=='hold'&&a.cmd==='stay'){a.cmd='follow';a.stayAt=null;}}save();}
function teamInCombat(){return enemies.some(e=>!e.dead&&e.state==='chase'&&dist2D(e.pos,P.pos)<32)||T-(P.lastCombat||-99)<4;}
// shared team tactics (heals + dodging telegraphs), also used for companions in normal dungeons and dyna fights
function teamTactics_v1(al,dt,teles){for(const a of al)for(const t of teles){if(T-t.t0<0.45||T>=t.at)continue;let dx=a.pos.x-t.x,dz=a.pos.z-t.z,dd=Math.hypot(dx,dz);if(dd<0.3){const px=P.pos.x-t.x,pz=P.pos.z-t.z,pd=Math.hypot(px,pz);const an=pd>0.5?Math.atan2(pz,px):(a.dodgeA??(a.dodgeA=Math.random()*6.28));dx=Math.cos(an)*0.3;dz=Math.sin(an)*0.3;dd=0.3;}
    if(t.inner){if(dd>t.inner-1.2)moveAlly(a,t.x,t.z,a.speed*1.1,dt,t.inner*0.5);}else if(dd<t.r+0.8)moveAlly(a,t.x+dx/dd*(t.r+2),t.z+dz/dd*(t.r+2),a.speed*1.1,dt,0.2);}
  for(const a of al){if(a.role!=='healer')continue;a.healCd-=dt;if(a.healCd>0)continue;a.healCd=2.6;
    const pool=[{e:P,f:P.dead?1:P.hp/S.maxHp}].concat(al.map(o=>({e:o,f:o.hp/o.maxHp})));{const hp=teamCfg().healPri;const k=o=>o.f-(o.f<0.85&&((hp==='you'&&o.e===P)||(hp==='tank'&&(o.e===P?roleOfChar(P)==='tank':o.e.role==='tank')))?0.45:0);pool.sort((x,y)=>k(x)-k(y));}const w=pool[0];if(w.f>0.9)continue;
    // Build O: group heal when two or more members are hurt (team-wide pulses outpaced a single-target 14%/2.6s healer)
    if(balOn()&&pool.filter(o=>o.f<0.75&&!(o.e===P&&P.dead)&&!o.e.dead).length>=2){for(const o of pool){if(o.e.dead||(o.e===P&&P.dead)||dist2D(o.e.pos,a.pos)>24)continue;if(o.e===P)healPlayer(S.maxHp*0.07);else allyHeal(o.e,o.e.maxHp*0.09);}ringFx(a.pos.x,a.pos.z,0x6dff8a,5,0.45);continue;}
    if(w.e===P)healPlayer(S.maxHp*0.1);else allyHeal(w.e,w.e.maxHp*0.14);ringFx(w.e.pos.x,w.e.pos.z,0x6dff8a,1.4,0.35);}}
function updTeam(dt){if(state!=='play')return;TM.acc+=dt;
  // downed companions: revive near you once the fight is over
  for(const id in TM.dead){if(T<TM.dead[id])continue;if(teamInCombat()||P.dead||!teamActive()||inRaid())continue;delete TM.dead[id];const s=teamSnaps().find(x=>x.id===id);if(!s)continue;
    const a=spawnComp(s);if(a){a.hp=Math.round(a.maxHp*0.5);const ang=Math.random()*6.28;a.pos.set(P.pos.x+Math.cos(ang)*2.5,0,P.pos.z+Math.sin(ang)*2.5);ringFx(a.pos.x,a.pos.z,0x6dff8a,2,0.5);log('👥 '+esc(a.name)+' is back on their feet.');}}
  for(const a of TM.list)if(a.died&&a.comp&&teamActive()&&!inRaid()&&TM.dead[a.snapId]==null&&!allies.some(o=>o.comp&&o.snapId===a.snapId&&!o.dead)){TM.dead[a.snapId]=T+TEAM_REVIVE;toast('💥 '+a.name+' is down: revives out of combat in '+TEAM_REVIVE+'s');}
  if(TM.acc>=0.5){TM.acc=0;teamSync();}
  TM.list=allies.filter(a=>a.comp);
  updTeamHud();const al=comps();if(!al.length)return;for(const a of al){if(a.stance==='passive'&&a.cmd!=='attack')a.target=null;}
  teamTactics(al,dt,(DUN&&!DUN.apt?DUN.tele:[]).concat(WTELE));}
let teamHudAcc=0;
function updTeamHud(force){const el=$('#teamHud');if(!el)return;if(!force&&T-teamHudAcc<0.2&&T>=teamHudAcc)return;teamHudAcc=T;const on=teamActive()&&!inRaid()&&!(DUN&&DUN.apt);el.classList.toggle('hidden',!on);document.body.classList.toggle('teamon',on);if(!on)return;
  const rows=teamSnaps().map(s=>{const a=allies.find(o=>o.comp&&o.snapId===s.id&&!o.dead);const f=a?a.hp/a.maxHp:0;const dn=TM.dead[s.id];
    return `<div class="tmr${a?'':' down'}"><span class="tmn">${esc(s.name.replace(' (contract)',''))}</span><span class="tmb"><i style="width:${Math.round(f*100)}%"></i></span>${a?'':`<span class="tmd">${dn!=null?Math.max(0,Math.ceil(dn-T))+'s':'…'}</span>`}</div>`;}).join('');
  const h=syncHudLine()+rows+`<div class="tmc"><button class="tmbt" data-tm="atk">⚔ Attack</button><button class="tmbt" data-tm="reg">↩ Regroup</button></div>`;if(el._h!==h){el._h=h;el.innerHTML=h;}}
/* ---------- panel ---------- */
function openTeam(){const c=teamCfg();const al=teamAlts();const picks=teamPicks();const sn=teamSnaps();const on=c.on;
  let h=`<div class="craftbar"><span class="cbi">👥</span><span class="cbn"><b>Team mode ${on?'ON':'off'}</b><small>you + ${sn.length} · max ${TEAM_COMP+1} · companions share XP${SYNC.lv?' · ⇩ synced to Lv '+SYNC.lv:''}</small></span>
    <button class="sbtn${on?' alt':''}" id="teamGo" data-act="tmtog">${on?'Dismiss team':'Summon team'}</button></div>`;
  h+=`<div class="h4">Stance</div><div class="tabs" style="margin:0 0 6px">${[['follow','🚶 Follow','defend you, never start fights'],['assist','⚔ Assist','attack what you fight'],['hold','✋ Hold','hold position'],['passive','🕊 Passive','never attack']].map(([k,n])=>`<button data-act="tmst" data-s="${k}" class="${c.stance===k?'on':''}">${n}</button>`).join('')}</div>
    <div style="opacity:.8;font-size:13px">Follow: they only fight what attacks you or them. Assist: they join your fights. Hold: they stay where they are and fight from there. Passive: they stay out of it. Tanks taunt what's on the team, healers heal by the priority below. Commands: <b>⚔ Attack</b> my target (G) and <b>↩ Regroup</b> (Y). <b>T</b> toggles the team.</div>
    <div class="btns" style="display:flex;gap:8px;margin:8px 0"><button class="sbtn alt" data-act="tmatk">⚔ Attack my target</button><button class="sbtn alt" data-act="tmreg">↩ Regroup</button><button class="sbtn alt" data-act="tmmerc">${c.merc?'✔':'＋'} Mercenary fill</button></div>
    <div class="h4">Heal priority</div><div class="tabs" style="margin:0 0 6px">${[['lowest','🩸 Lowest HP'],['tank','🛡 Tank first'],['you','🙋 Me first']].map(([k,n])=>`<button data-act="tmheal" data-h="${k}" class="${c.healPri===k?'on':''}">${n}</button>`).join('')}</div>
    <div class="h4">Companions (${picks.length}/${TEAM_COMP} alts${c.merc?' + mercenaries':''})</div>`;
  h+=al.map(a=>{const sel=picks.includes(a.id);const live=allies.find(o=>o.comp&&o.snapId===a.id&&!o.dead);return `<button class="item${sel?' sel':''}" data-act="tmpick" data-id="${a.id}"><span class="ico">${sel?'✔':'＋'}</span><span><div class="nm">${esc(a.name)}</div><div class="sub">Lv ${a.level}${SYNC.lv&&SYNC.lv<a.level?' (⇩'+SYNC.lv+')':''} ${esc(PROFS[a.prof].name)} · ${(TEAM_ROLES[a.role]||{ic:''}).ic} ${a.role}${live?' · '+Math.round(live.hp)+'/'+live.maxHp+' HP':TM.dead[a.id]!=null?' · down':''}</div></span></button>`;}).join('')||'<div style="opacity:.7">No alts yet. Make more characters on the title screen, or switch on mercenary fill.</div>';
  h+=compXpLockHtml(al);
  h+=`<div style="opacity:.75;font-size:12px;margin-top:8px">Companions use their own saved level, gear, implants and perks, and get a 50% XP share saved to their own sheets (loot goes to you; team-dungeon clears also credit them). Dungeon level caps judge the team by its highest (synced) member. Downed companions get back up ${TEAM_REVIVE}s after the fight ends. Raids use their own team.</div>`;
  h+=teamPanelExtra();openPanel('👥 TEAM',h,'team');}
function teamAct(a,b){const D=b.dataset;if(a==='tmtog')toggleTeam();else if(a==='tmst'){teamStance(D.s);openTeam();}else if(a==='tmatk'){teamAttack();}else if(a==='tmreg'){teamRegroup();}
  else if(a==='tmxl'){toggleCompXpLock(D.id);openTeam();}
  else if(a==='tmheal'){teamCfg().healPri=D.h;save();openTeam();}
  else if(a==='tmmerc'){const c=teamCfg();c.merc=!c.merc;save();teamSync();openTeam();}
  else if(a==='tmpick'){const c=teamCfg();let ids=teamPicks();if(ids.includes(D.id))ids=ids.filter(x=>x!==D.id);else if(ids.length>=TEAM_COMP){warn('A team holds '+(TEAM_COMP+1)+' (you + '+TEAM_COMP+' companions)');return true;}else ids.push(D.id);c.ids=ids;save();teamSync();openTeam();}
  else return false;return true;}
function teamExports(){return {updTeam,teamTactics,updTeamHud,teamCfg,teamAlts,teamPicks,teamSnaps,toggleTeam,teamAttack,teamRegroup,teamStance,openTeam,comps,TM,teamActive,teamSync,normTeam,TEAM_REVIVE,TEAM_COMP};}
document.addEventListener('pointerup',e=>{if(state!=='play'||!e.target.closest)return;const hb=e.target.closest('#teamHud');if(!hb)return;const b=e.target.closest('.tmbt');SFX.ui();
  if(b){if(b.dataset.tm==='atk')teamAttack();else teamRegroup();}else openTeam();});
