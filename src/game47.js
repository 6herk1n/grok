/* ================= RESEARCH (2026-11-23, Claude; AO Lost-Eden-style research, own names) =================
   Six research lines, 10 ranks each. A slider diverts 0-100% of earned XP into the selected line (gainXp wrapper);
   at the level cap ALL XP goes to research (it used to be wasted). When a line maxes, the pool moves to the next unfinished one.
   Rank cost: xpNeed(your level, 10..cap) x (0.15 + 0.1 x rank) -> 25%..115% of a level's XP; the whole tree is ~40 levels of XP.
   Effects (statsFor wrapper, so they also show on roster/party sheets): Offense +2 power (= +2% damage) per rank,
   Constitution +3% max health, Fortification +3% armour, Matrix +2% Matrix capacity; Recovery +4% energy regen
   (enRegenC wrapper); Efficiency refunds 3% of each Weave's energy cost per rank (useAbility wrapper; you still need the full
   cost to cast). Character state P.rsch v1 {pct,sel,pool,r:{line:rank}} via rschFields(). Panel openResearch (⋯ menu #bRsch). */
const RSCH_VER=1,RSCH_MAX=10;
const RSCH={dmg:{n:'Offense',ic:'⚔',d:r=>'+'+(2*r)+'% damage'},hp:{n:'Constitution',ic:'❤',d:r=>'+'+(3*r)+'% max health'},
  armor:{n:'Fortification',ic:'🛡',d:r=>'+'+(3*r)+'% armour'},cost:{n:'Efficiency',ic:'💠',d:r=>(3*r)+'% of Weave energy refunded'},
  regen:{n:'Recovery',ic:'🔋',d:r=>'+'+(4*r)+'% energy regen'},mx:{n:'Matrix',ic:'🔮',d:r=>'+'+(2*r)+'% Matrix capacity'}};
const RSCH_KEYS=Object.keys(RSCH);
function normRsch(o){o=o&&typeof o==='object'?o:{};const r={};for(const k of RSCH_KEYS)r[k]=clamp(o.r&&o.r[k]|0,0,RSCH_MAX);
  return {v:RSCH_VER,pct:clamp(Math.round((+o.pct||0)/25)*25,0,100),sel:RSCH[o.sel]?o.sel:'dmg',pool:Math.max(0,Math.floor(+o.pool||0)),r};}
function rschi(c){c=c||P;if(!c.rsch||c.rsch.v!==RSCH_VER)c.rsch=normRsch(c.rsch);return c.rsch;}
function rschFields(s){return {rsch:normRsch(s.rsch)};}
function rschRank(k,c){const R=(c||P).rsch;return R&&R.r?clamp(R.r[k]|0,0,RSCH_MAX):0;}
function rschCost(rank){return Math.round(xpNeed(clamp(P.level|0,10,MAXLVL))*(0.15+0.1*rank));}
function rschDone(){const R=rschi();return RSCH_KEYS.every(k=>R.r[k]>=RSCH_MAX);}
function rschAdd(n){const R=rschi();if(n<=0||rschDone())return 0;R.pool+=n;let ups=0;
  for(let g=0;g<60;g++){if(R.r[R.sel]>=RSCH_MAX){const nx=RSCH_KEYS.find(k=>R.r[k]<RSCH_MAX);if(!nx)break;R.sel=nx;}
    const c=rschCost(R.r[R.sel]+1);if(R.pool<c)break;R.pool-=c;R.r[R.sel]++;ups++;
    const L=RSCH[R.sel];toast('🔬 Research: '+L.n+' rank '+R.r[R.sel]);log('🔬 <b>'+L.n+'</b> rank '+R.r[R.sel]+': '+L.d(R.r[R.sel])+'.');}
  if(rschDone())R.pool=0;if(ups){try{calcStats();}catch(e){}}return n;}
const _gainXpRsch=gainXp;
gainXp=function(n){if(!(n>0)||P.xpLock)return _gainXpRsch(n);const R=rschi();if(rschDone())return _gainXpRsch(n);
  const atCap=P.level>=MAXLVL;const div=atCap?n:Math.floor(n*R.pct/100);if(div>0)rschAdd(div);return _gainXpRsch(n-div);};
const _statsForRsch=statsFor;
statsFor=function(c){const s=_statsForRsch(c);if(!c||!c.rsch)return s;const r=k=>rschRank(k,c);
  if(r('dmg'))s.power=(s.power||0)+2*r('dmg');if(r('hp'))s.maxHp=Math.round(s.maxHp*(1+0.03*r('hp')));if(r('armor'))s.armor=Math.round(s.armor*(1+0.03*r('armor')));
  if(r('mx')&&s.mxCap!=null)s.mxCap=Math.round(s.mxCap*(1+0.02*r('mx')));return s;};
const _enRegenCRsch=enRegenC;
enRegenC=function(){return _enRegenCRsch()*(1+0.04*rschRank('regen'));};
const _useAbilityRsch=useAbility;
useAbility=function(i){const before=P.en;const out=_useAbilityRsch.apply(this,arguments);const k=rschRank('cost');if(k&&P.en<before)P.en=Math.min(S.maxEn,P.en+(before-P.en)*0.03*k);return out;};
function openResearch(){const R=rschi();const cap=P.level>=MAXLVL,done=rschDone();
  let h=`<div class="stats">Divert some of the XP you earn into <b>research</b>: permanent bonuses that keep growing after the level cap. ${cap?'<b style="color:#ffd25a">You are at the level cap: all XP goes to research.</b>':'At the level cap, all XP goes to research automatically.'}</div>`;
  if(!cap)h+=`<div class="h4" style="margin-top:8px">XP into research</div><div class="tabs" style="margin:0">${[0,25,50,75,100].map(p=>`<button data-act="rspct" data-p="${p}" class="${R.pct===p?'on':''}">${p}%</button>`).join('')}</div>`;
  h+=`<div class="h4" style="margin-top:10px">Lines ${done?'· all complete':'· pool '+R.pool.toLocaleString()+' XP'}</div>`;
  for(const k of RSCH_KEYS){const L=RSCH[k],rk=R.r[k],mx=rk>=RSCH_MAX,c=mx?0:rschCost(rk+1),sel=R.sel===k&&!mx,f=sel?Math.min(1,R.pool/c):0;
    h+=`<div class="item" style="display:block;cursor:default${sel?';border-color:#4affd2':''}"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div>${L.ic} <b>${L.n}</b> <small style="opacity:.75">rank ${rk}/${RSCH_MAX} · ${rk?L.d(rk):'no bonus yet'}${mx?'':' → next: '+L.d(rk+1)}</small></div>
      ${mx?'<span class="chip on" style="min-height:0">✔ Complete</span>':sel?'<span class="chip on" style="min-height:0">Researching</span>':`<button class="sbtn alt" data-act="rssel" data-k="${k}">Research this</button>`}</div>
      ${mx?'':`<div class="bar" style="height:8px;margin-top:6px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden"><div style="height:100%;width:${Math.round(f*100)}%;background:#4affd2"></div></div><small style="opacity:.7">next rank: ${c.toLocaleString()} XP${sel?' · '+Math.round(f*100)+'%':''}</small>`}</div>`;}
  openPanel('🔬 RESEARCH',h,'rsch');}
const _stage3ActRsch=stage3Act;
stage3Act=function(a,b){const D=b.dataset;if(a==='rspct'){rschi().pct=clamp(+D.p|0,0,100);save();openResearch();return true;}
  if(a==='rssel'){const R=rschi();if(RSCH[D.k]&&R.r[D.k]<RSCH_MAX){R.sel=D.k;rschAdd(0);save();}openResearch();return true;}return _stage3ActRsch(a,b);};
try{btn('#bRsch',()=>openResearch());}catch(e){}
A_('lvl','rs1','Curious Mind','Complete a research rank',10,()=>RSCH_KEYS.reduce((a,k)=>a+rschRank(k),0),1);
A_('lvl','rs30','Field Researcher','Complete 30 research ranks',20,()=>RSCH_KEYS.reduce((a,k)=>a+rschRank(k),0),30);
A_('lvl','rs60','The Long Study','Complete every research line',40,()=>RSCH_KEYS.reduce((a,k)=>a+rschRank(k),0),60,{title:'the Learned'});
function rschExports(){return {RSCH,rschi,rschAdd,rschCost,rschRank,openResearch,rschFields};}
