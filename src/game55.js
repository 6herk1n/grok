/* ================= Build Z (2026-11-28, GB-4): Melee and Ranged skills =================
   Splits the old Weapon Handling skill (wpn) into Melee and Ranged. Each physical weapon
   uses the matching skill for its requirement and (for weapon-primary professions) damage.
   Focus weapons (rod, emitter) still use Weave Craft.
   Affinity (from each profession's kit and starting gear, see Z_AFF): melee-strong, ranged-strong
   or balanced. Strong skills are cheap and train further; the off skill costs more and caps lower;
   balanced professions train both at a moderate cost so the player picks a route.
   Migration (zWpn v1): copy trained wpn into both new skills and grant the old innate onto any
   skill that would otherwise fall short, so each new skill is at least the old Weapon Handling.
   No refund (nothing is taken away). Equipped gear is never stripped. Old s:'wpn' bonuses, buffs,
   glyphs and requirements still work (bonuses apply to both; E.wpn / eff('wpn') = max of the two).
   No new localStorage keys. */
const Z_VER=1;
const Z_OLD_INN={vanguard:5,runner:4,wild:4,fist:5,shade:5,siege:5};
const Z_AFF={
  fist:'melee',shade:'melee',
  siege:'ranged',runner:'ranged',exact:'ranged',vanguard:'ranged',
  wild:'both',mender:'both',weaver:'both',flux:'both',wright:'both',binder:'both',mind:'both',harm:'both'
};
const Z_TIP={
  melee:'Melee-strong: Melee is cheap and trains further; Ranged costs more and caps lower.',
  ranged:'Ranged-strong: Ranged is cheap and trains further; Melee costs more and caps lower.',
  both:'Balanced: Melee and Ranged train at the same moderate cost, so you choose a route.'
};
const Z_WHY={
  fist:'Unarmed kit: Palm Jab and strikers only.',
  shade:'Assassin kit: Glass Knife and blades only.',
  siege:'Heavy weapons: Cannon Shot, hand cannons, Hailfire.',
  runner:'Skirmisher kit: Twin Pistols and Rattle Burst.',
  exact:'Writ Pistol is the basic attack; pistols in the gear list.',
  vanguard:'Gunner kit: Rifle Shot, Scatter Burst, Breach Round (blades are available, but the kit is guns).',
  wild:'Hunting Bow and rifles out of morph; beast Morphs fight in melee — a real route choice.',
  mender:'Pistol and blade both in the gear list; the medic kit does not force one.',
  weaver:'Weave-primary (hexes). A physical weapon is a side route you can choose.',
  flux:'Weave-primary (Flux Emitter). A physical weapon is a side route you can choose.',
  wright:'Weave-primary (bots). Rivet Pistol is a sidearm, not the main damage.',
  binder:'Weave-primary (constructs). A physical weapon is a side route you can choose.',
  mind:'Weave-primary (mind-bending). A physical weapon is a side route you can choose.',
  harm:'Weave-primary (anthems). A physical weapon is a side route you can choose.'
};
function zAff(prof){return Z_AFF[prof]||'both';}
function zPri(prof){const a=zAff(prof);return a==='both'?'ranged':a;}
function zWpnSk(wt){const W=wt&&WTYPES[wt];if(!W||W.sk==='weave')return null;return W.melee?'melee':'ranged';}
function dmgSkillOf(c){const pr=PROFS[c.prof];if(!pr)return 'wpn';if(pr.dmgSkill==='weave')return 'weave';const sk=zWpnSk(c.eq&&c.eq.weapon&&c.eq.weapon.wt);return sk||zPri(c.prof);}
function zMigInn(c,s){if(!c||!c.zWpn||c.zWpn.born)return 0;const pr=PROFS[c.prof];return Math.max(0,(Z_OLD_INN[c.prof]||0)-((pr&&pr.innate[s])||0));}
function zNorm(s){if(!s)return s;if(s.zWpn&&s.zWpn.v>=Z_VER)return s;if(s.zBorn||(s.zWpn&&s.zWpn.born)){s.zWpn={v:Z_VER,born:1};return s;}
  const sb=s.sb||(s.sb={});const w=sb.wpn||0;if(sb.melee==null)sb.melee=w;if(sb.ranged==null)sb.ranged=w;s.zWpn={v:Z_VER};return s;}
function zFields(s){zNorm(s);return {zWpn:s.zWpn||null};}

/* ---- tables: skills, names, trickle, weapons, profession costs / caps / innate ---- */
{const i=SKILLS.indexOf('wpn');if(i>=0)SKILLS.splice(i,1,'melee','ranged');}
STATN.melee='Melee';STATN.ranged='Ranged';
SHORT.melee='MEL';SHORT.ranged='RNG';
STATDESC.str='Feeds Melee and Ranged. Arm implant requirement.';
STATDESC.agi='Feeds Melee, Ranged and Treatment. Hand and foot implant requirement.';
STATDESC.wpn='Legacy name for Melee / Ranged (the higher of the two).';
STATDESC.melee='Melee weapon damage. Needed to wield better blades and strikers.';
STATDESC.ranged='Ranged weapon damage. Needed to wield better guns and bows.';
TRICKLE.melee={agi:.5,str:.5};TRICKLE.ranged={agi:.5,str:.5};
for(const k in WTYPES){const W=WTYPES[k];if(W.sk==='wpn')W.sk=W.melee?'melee':'ranged';}
for(const k in PROFS){
  const pr=PROFS[k],a=zAff(k),inn=Z_OLD_INN[k]||(pr.innate.wpn||0);
  if(a==='melee'){pr.cost.melee=1;pr.cost.ranged=3;pr.meleeCap=1.4;pr.rangedCap=0.7;if(inn)pr.innate.melee=(pr.innate.melee||0)+inn;}
  else if(a==='ranged'){pr.cost.ranged=1;pr.cost.melee=3;pr.rangedCap=1.4;pr.meleeCap=0.7;if(inn)pr.innate.ranged=(pr.innate.ranged||0)+inn;}
  else{pr.cost.melee=2;pr.cost.ranged=2;pr.meleeCap=1;pr.rangedCap=1;if(inn){pr.innate.melee=(pr.innate.melee||0)+Math.ceil(inn/2);pr.innate.ranged=(pr.innate.ranged||0)+Math.floor(inn/2);}}
  pr.cost.wpn=pr.cost[zPri(k)];pr.wpnCap=pr[zPri(k)+'Cap'];pr.wpnStyle=a;delete pr.innate.wpn;
}

/* ---- caps / costs / items / reqs (skillCap / costOf are const; caps and cost.wpn are set on PROFS above) ---- */
{const _mi=migrateItem;migrateItem=function(it){it=_mi(it);if(it&&it.kind==='gear'&&it.slot==='weapon'&&it.req){const sk=zWpnSk(it.wt);if(sk)it.req.forEach(r=>{if(r&&r.s==='wpn')r.s=sk;});}return it;};}

/* ---- stats, damage, UI, sims, planner ---- */
{const _sk=skillF;skillF=function(){const s=dmgSkillOf(P);return 1+Math.max(-0.2,(eff(s)-12)/100);};}
{const _os=openSkills;openSkills=function(){_os.apply(this,arguments);try{const a=zAff(P.prof),pr=PROFS[P.prof];
    const col=[...document.querySelectorAll('#pbody .h4')].find(x=>x.textContent==='Skills');if(!col)return;
    const d=document.createElement('div');d.className='stats';d.style.margin='0 0 8px';
    d.innerHTML='<b>'+esc(pr.name)+' weapon style.</b> '+Z_TIP[a]+' '+Z_WHY[P.prof];
    d.title=Z_TIP[a]+' '+Z_WHY[P.prof];col.after(d);
  }catch(e){}};}
{const _sc=simChar;simChar=function(prof){const pr=PROFS[prof],save=pr&&pr.dmgSkill;if(pr&&save==='wpn')pr.dmgSkill=zWpnSk(PROF_WT[prof])||zPri(prof);
  try{const c=_sc.apply(this,arguments);if(c)c.zBorn=1;return c;}finally{if(pr)pr.dmgSkill=save;}};}
{if(typeof bxBridges==='function'){const _br=bxBridges;bxBridges=function(s){const out=_br(s)||[];
    if(s==='melee'||s==='ranged'){for(const b of (_br('wpn')||[]))if(!out.some(x=>x.n===b.n&&x.v===b.v))out.push(b);}
    if(s==='wpn'){for(const t of ['melee','ranged'])for(const b of (_br(t)||[]))if(!out.some(x=>x.n===b.n&&x.v===b.v))out.push(b);}
    return out.sort((a,b)=>b.v-a.v);};}}
function zExports(){return {Z_VER,Z_AFF,Z_TIP,Z_WHY,zAff,zPri,zWpnSk,dmgSkillOf,zFields,zNorm,skillCap,costOf,statsFor,skillF,openSkills,simChar,bxBridges,migrateItem,SKILLS,STATN,WTYPES,PROFS};}
