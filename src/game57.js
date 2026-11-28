/* ================= Build CM (2026-11-28): contract mercenaries count for team dungeons =================
   The band gates (Theta-9 Lockdown at Lv 10, then the Lv 20-50 team dungeons) used to count roster characters only, so a player
   without, say, a healer alt was stuck at the band edge. Now contract mercenaries (MERC, game14) fill what the roster can't:
   first any unmet requirement (role or profession), then empty seats up to minTeam. They are hired at the dungeon's content level,
   join through teamSnaps() on entry, count toward the team size and the requirement rows, and still take no XP, loot or perk points
   (DUN.tdCounted only rewards roster ids). The door shows a "Contract help" row naming who was hired. Raids keep their own rules. */
let TDM_ADD=null;
function tdMercFill(td,mem){const lv=clamp(td.content,1,MAXLVL);const inR=m=>Math.abs(m.level-td.content)<=TD_RANGE;const cnt=mem.filter(inR);
  const add=[],have=new Set(mem.map(m=>m.prof)),room=Math.max(0,TEAM_COMP+1-mem.length);
  const hire=m=>{if(add.length>=room||have.has(m.prof))return false;have.add(m.prof);add.push({id:'merc_'+m.prof,name:m.name,prof:m.prof,level:lv,role:m.role,merc:true});return true;};
  for(const r of td.req){if(cnt.concat(add).some(m=>reqMetBy(r,m)))continue;const m=MERC.find(x=>!have.has(x.prof)&&reqMetBy(r,{prof:x.prof,role:x.role}));if(m)hire(m);}
  const order=MERC.filter(m=>m.role==='tank'||m.role==='healer').concat(MERC.filter(m=>m.role!=='tank'&&m.role!=='healer'));
  for(const m of order){if(cnt.length+add.length>=td.minTeam)break;hire(m);}
  return add;}
{const _tdc=teamDunCheck;teamDunCheck=function(id,mem){const td=TEAMD[id];if(mem||!td)return _tdc(id,mem);const base=tdMembers();const add=tdMercFill(td,base);const r=_tdc(id,base.concat(add));r.mercs=add;
  for(const row of r.rows)row.t=row.t.replace('roster characters','members');
  if(add.length)r.rows.splice(1,0,{ok:true,t:'Contract help: '+add.map(a=>a.name.replace(' (contract)','')+' ('+((TEAM_ROLES[a.role]||{}).n||a.role)+')').join(', '),d:'hired to fill roles your roster can\'t. They take no XP, loot or perk points'});
  return r;};}
{const _ts=teamSnaps;teamSnaps=function(){const s=_ts();if(TDM_ADD)for(const a of TDM_ADD){if(s.length>=TEAM_COMP)break;const m=MERC.find(x=>x.prof===a.prof);if(m&&!s.some(x=>x.merc&&x.prof===a.prof))s.push(mercSnap(m,a.level));}return s;};}
{const _etd=enterTeamDungeon;enterTeamDungeon=function(id){if(TEAMD[id]&&!DUN)TDM_ADD=teamDunCheck(id).mercs||null;try{return _etd(id);}finally{TDM_ADD=null;}};}
function tdmExports(){return {tdMercFill,teamDunCheck,enterTeamDungeon};}
