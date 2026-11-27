/* =========================================================================================================
   Build X — gear & implant depth (AO-inspired, own names): Loadout Planner + presets, Gap Helper (twink ladder),
   over-equip (OE) rules for weapons/armour, and Alloy Glyphs (tiered stat glyphs etched onto weapons and armour).
   - Save: P.bx={v:1,pre:[{n,g:{slot:id},i:{slot:id}}],gf:[ids],gl,g4} via futureFields (bxFields). Old saves: the gear equipped
     when the save is first loaded in Build X is grandfathered (gf: always full power); character sheets without bx (sims,
     roster characters not yet loaded) never get OE. No new storage keys.
   - OE (weapons/armour only; implants keep the old twink rule): ratio = lowest (current skill / requirement) over the item's
     skill and attribute requirements, using your stats including the item's own bonuses. >= 80%: 100%; 60-79%: 75%; < 60%: 50%.
     The item stays equipped; its damage, armour and bonuses are scaled (statsFor second pass only when something is under 80%).
     Skipped while level-synced (sync already scales gear).
   - Presets: up to 8 named loadouts (gear + implants incl. symbiants). Apply pulls items from the pack (and from the bank at a
     bank terminal), installs implants first, then gear, repeating while new bonuses unlock more; reports what is missing.
   - Gap Helper: pick an item, implant, symbiant, disc or Weave you can't use yet; shows each requirement gap and which buff
     Weaves, consumables, implants and gear you own can bridge it (and the 80% OE line for weapons/armour).
   - Alloy Glyphs: parts-bag items (kind 'gly', tier 1-4, stat). Etch one onto a weapon or armour piece (one glyph per item,
     shown as a ✦ bonus line); etching over a glyph lifts the old one back into the bag. Tier fits by item level (1/20/45/70).
     Sources: Glyph bench (craft tier I-II from parts + credits), dungeon/raid bosses, hard modes, Vigil Stair shop + guardians,
     invasion Generals. Tier IV only from hard-mode/raid bosses and Vigil Stair landing guardians (floor 20+) at level 70+.
     Drops never draw from Math.random in sims (SIMP/SIMST). Achievements: Glyphwright, Master Etcher (Crafting).
   ========================================================================================================= */
const BX_VER=1,BX_MAXPRE=8,BX_OE=[[0.8,1],[0.6,0.75],[0,0.5]];
const GLY={keen:{n:'Keen',s:'crit',ic:'🎯',v:[1,2,3,5]},fury:{n:'Fury',s:'power',ic:'🔥',v:[2,4,6,9]},lattice:{n:'Lattice',s:'mx',ic:'🧠',v:[1,2,3,5]},
  vyre:{n:'Vyre',s:'weave',ic:'🔮',v:[5,12,25,45]},steady:{n:'Steady',s:'wpn',ic:'🎚',v:[5,12,25,45]},vital:{n:'Vital',s:'hp',ic:'❤️',v:[40,120,260,450]},
  well:{n:'Wellspring',s:'en',ic:'💧',v:[25,70,150,260]},bulwark:{n:'Bulwark',s:'dr',ic:'🛡',v:[1,2,3,4]}};
const GLY_T=['','I','II','III','IV'],GLY_LV=[0,1,20,45,70],GLY_COL=['','#cfd8dc','#7ad8ff','#c08bff','#ffb84a'];
const GLY_CRAFT={1:{mats:[['shard',4],['scrap',4]],q:1,cr:200},2:{mats:[['shard',8],['circuit',4]],q:40,cr:1200}};
BAGK.push('gly');
function normBx(b){b=b&&typeof b==='object'?b:{};const pre=Array.isArray(b.pre)?b.pre.filter(p=>p&&typeof p==='object').slice(0,BX_MAXPRE).map(p=>({n:String(p.n||'Preset').slice(0,24),g:Object.assign({},p.g||{}),i:Object.assign({},p.i||{})})):[];
  return {v:BX_VER,pre,gf:Array.isArray(b.gf)?b.gf.filter(x=>typeof x==='string'||typeof x==='number').slice(0,40):[],gl:b.gl|0,g4:b.g4|0};}
function bxFields(s){let b=s.bx;if(!b){b={gf:Object.values(s.eq||{}).filter(it=>it&&it.kind==='gear'&&it.id).map(it=>it.id)};}return {bx:normBx(b)};}
const bxi=()=>P.bx||(P.bx=normBx(null));
/* ---------- OE ---------- */
function oeRatio(it,E){let q=9;for(const r of (it.req||[])){if(!r||!(r.v>0)||E[r.s]==null)continue;q=Math.min(q,E[r.s]/r.v);}return q;}
function oeFactor(q){for(const [t,f] of BX_OE)if(q>=t)return f;return 0.5;}
function oeScaled(it,f){return Object.assign({},it,{dmg:it.dmg?Math.round(it.dmg*f):it.dmg,armor:it.armor?Math.round(it.armor*f):it.armor,bonus:(it.bonus||[]).map(b=>Object.assign({},b,{v:Math.round(b.v*f)}))});}
{const _sfx=statsFor;statsFor=function(c){const r=_sfx(c);if(!c||!c.bx||!c.eq||r.syncLv){r.oe={};return r;}
  const gf=c.bx.gf||[],oe={};let any=0;
  for(const k in c.eq){const it=c.eq[k];if(!it||it.kind!=='gear'||gf.includes(it.id))continue;const q=oeRatio(it,r.E);if(q<0.8){const f=oeFactor(q);
    const need=(it.req||[]).filter(x=>x&&r.E[x.s]!=null&&r.E[x.s]<Math.ceil(x.v*0.8)).map(x=>({s:x.s,n:Math.ceil(x.v*0.8)-r.E[x.s]}));oe[k]={f,q,need};any=1;}}
  if(!any){r.oe=oe;return r;}
  const eq2=Object.assign({},c.eq);for(const k in oe)eq2[k]=oeScaled(c.eq[k],oe[k].f);const r2=_sfx(Object.assign({},c,{eq:eq2}));r2.oe=oe;return r2;};}
function oeOf(it){if(!it||!S||!S.oe)return null;for(const k in S.oe)if(P.eq[k]&&P.eq[k].id===it.id)return S.oe[k];return null;}
function oeBadge(o){return o?`<span class="oeb oe${o.f===0.5?50:75}" title="Over-equipped: ${Math.round(o.q*100)}% of the requirement. Restore ${o.need.map(n=>n.n+' '+STATN[n.s]).join(', ')} for full power (80% of the requirement is enough)">OE ${Math.round(o.f*100)}%</span>`:'';}
{let lastSig='';const _cs=calcStats;calcStats=function(){_cs.apply(this,arguments);try{if(!P||!S)return;const sig=Object.keys(S.oe||{}).map(k=>k+S.oe[k].f).sort().join(',');
  if(sig!==lastSig){const fresh=Object.keys(S.oe||{}).filter(k=>!lastSig.includes(k+S.oe[k].f));lastSig=sig;if(SIMP||!fresh.length||typeof toast!=='function'||!P.eq)return;
    for(const k of fresh){const o=S.oe[k],it=P.eq[k];if(it)toast('⚠ '+it.name+': OE '+Math.round(o.f*100)+'%. Restore '+o.need.map(n=>n.n+' '+STATN[n.s]).join(', ')+' for full power');}}}catch(e){}};}
{const _tw=twTag;twTag=function(it){if(it&&it.kind==='gear'){const o=oeOf(it);if(o)return oeBadge(o);if(!reqMet(it)&&!(bxi().gf||[]).includes(it.id))return '<span class="tw" title="Over 80% of the requirement: still full power">⚡ OE 100%</span>';}return _tw(it);};}
/* ---------- glyph helpers ---------- */
const glyName=(k,t)=>(GLY[k]?GLY[k].n:'?')+' Glyph '+GLY_T[t];
function glyOf(o){if(!o||o.kind!=='gly')return null;const k=Object.keys(GLY).find(x=>GLY[x].s===o.s);return k?{k,t:clamp(o.tier|0,1,4)}:null;}
function glyFits(it,t){return !!it&&it.kind==='gear'&&(it.lvl||1)>=GLY_LV[t];}
function glyGive(k,t,n,to){if(!GLY[k])return null;return bagAdd({kind:'gly',tier:clamp(t|0,1,4),s:GLY[k].s,ql:GLY_LV[clamp(t|0,1,4)]},n||1,to);}
{const _bn=bagName;bagName=function(o){const g=glyOf(o);return g?glyName(g.k,g.t):_bn(o);};}
{const _bi=bagIco;bagIco=function(o){const g=glyOf(o);return g?GLY[g.k].ic:_bi(o);};}
{const _bs=bagSort;bagSort=function(L){const g=L.filter(o=>o.kind==='gly').sort((a,b)=>b.tier-a.tier||String(a.s).localeCompare(String(b.s)));return _bs(L.filter(o=>o.kind!=='gly')).concat(g);};}
{const _ph=partsHtml;partsHtml=function(){const h=_ph();const g=bag().filter(o=>o.kind==='gly');if(!g.length)return h;
  return h+`<div class="h4" style="margin-top:8px">✦ Alloy Glyphs</div>`+bagSort(g).map(o=>bagRow(o,'bxglyph')).join('')+'<button class="sbtn" data-act="bxopen" data-t="glyph">✦ Etch a glyph (Planner)</button>';};}
function glyApply(itemId,bagId){const it=findItem(itemId),o=bag().find(x=>x.id===bagId),g=glyOf(o);if(!it||!g){warn('Pick an item and a glyph');return false;}
  if(it.kind!=='gear'){warn('Glyphs fit weapons and armour only');return false;}if(!glyFits(it,g.t)){warn(glyName(g.k,g.t)+' needs an item of level '+GLY_LV[g.t]+'+');return false;}
  if(!bagTake(o.id,1))return false;let lifted='';
  if(it.gly&&GLY[it.gly.k]){glyGive(it.gly.k,it.gly.t,1);lifted=' ('+glyName(it.gly.k,it.gly.t)+' lifted back into your parts bag)';}
  it.bonus=(it.bonus||[]).filter(b=>!b.gl);it.bonus.push({s:GLY[g.k].s,v:GLY[g.k].v[g.t-1],gl:1});it.gly={k:g.k,t:g.t};
  const B=bxi();B.gl=(B.gl|0)+1;if(g.t>=4)B.g4=(B.g4|0)+1;if(isEquipped(it))calcStats();SFX.loot();toast('✦ '+glyName(g.k,g.t)+' etched onto '+it.name+lifted);save();return true;}
function glyLift(itemId){const it=findItem(itemId);if(!it||!it.gly)return false;const cost=100*it.gly.t*it.gly.t;if(P.credits<cost){warn('Lifting costs '+cost+'¢');return false;}
  P.credits-=cost;glyGive(it.gly.k,it.gly.t,1);it.bonus=(it.bonus||[]).filter(b=>!b.gl);delete it.gly;if(isEquipped(it))calcStats();toast('Glyph lifted into your parts bag (−'+cost+'¢)');save();return true;}
function glyCraftCheck(k,t){const R=GLY_CRAFT[t];if(!R||!GLY[k])return {ok:false,why:'Only tiers I-II can be crafted'};const miss=[];
  for(const [mt,n] of R.mats){const h=rmMatCount(mt,R.q);if(h<n)miss.push((n-h)+'× '+MATS[mt].n+(R.q>1?' QL '+R.q+'+':''));}if(P.credits<R.cr)miss.push((R.cr-P.credits)+'¢');
  if(t===2&&P.level<20)miss.push('level 20');return {ok:!miss.length,why:miss.join(', ')};}
function glyCraft(k,t){const c=glyCraftCheck(k,t);if(!c.ok){warn('Need '+c.why);return false;}const R=GLY_CRAFT[t];for(const [mt,n] of R.mats)rmMatTake(mt,R.q,n);P.credits-=R.cr;glyGive(k,t,1);SFX.loot();toast('✦ Crafted '+glyName(k,t));save();return true;}
{const _il=itemLines;itemLines=function(it){const L=_il(it);if(it&&it.gly&&GLY[it.gly.k]){const i=L.findIndex(l=>l===fmtBonus({s:GLY[it.gly.k].s,v:GLY[it.gly.k].v[it.gly.t-1]}));const t='✦ '+glyName(it.gly.k,it.gly.t)+': +'+GLY[it.gly.k].v[it.gly.t-1]+' '+STATN[GLY[it.gly.k].s];if(i>=0)L[i]=t;else L.push(t);}return L;};}
/* ---------- glyph sources ---------- */
const BX_SIM=()=>SIMP||(typeof SIMST!=='undefined'&&!!SIMST);
function glyTierFor(lv){return lv<20?1:lv<45?2:3;}
function glyDrop(e,t,ch){if(Math.random()>=ch)return null;const k=pick(Object.keys(GLY));const tt=clamp(t,1,4);glyGive(k,tt,1);
  if(typeof log==='function')log('✦ <b style="color:'+GLY_COL[tt]+'">'+glyName(k,tt)+'</b> recovered from '+esc((e&&e.T&&e.T.name)||'the fight')+' (parts bag).');return k;}
function bxOnKill(e){if(BX_SIM()||!e||!P||e.ally||e.isShard)return;const lv=e.lv||P.level||1;
  const vr=typeof vgRun==='function'?vgRun():null;if(vr&&e.vgG&&vr.gd===e){const top=e.vgG.big&&vr.f>=20&&lv>=70;glyDrop(e,top?4:Math.max(2,glyTierFor(lv)),e.vgG.big?0.6:0.2);return;}
  if(typeof INV!=='undefined'&&INV.ev&&INV.ev.gen===e){glyDrop(e,glyTierFor(lv),0.5);return;}
  if(e.boss||e.raidBoss||(e.T&&e.T.boss)){const hm=typeof DUN!=='undefined'&&DUN&&DUN.mode&&DUN.mode.hm?(DUN.mode.hm.tier|0):0;
    const top=(e.raidBoss||hm>=2)&&lv>=70;glyDrop(e,top?4:clamp(glyTierFor(lv)+(hm>=1?1:0),1,3),e.raidBoss?0.5:hm>=1?0.35:0.2);}}
{const _kex=killEnemy;killEnemy=function(e){const was=!!(e&&e.dead);const r=_kex.apply(this,arguments);try{if(e&&!was&&e.dead)bxOnKill(e);}catch(err){}return r;};}
VG_SHOP.push({k:'glyph',ic:'✦',n:'Keeper\'s Glyph',d:'A random Alloy Glyph (tier II, tier III from level 45)',pr:50});
{const _vbx=vgBuy;vgBuy=function(k){if(k!=='glyph')return _vbx.apply(this,arguments);const it=VG_SHOP.find(x=>x.k===k),v=vgi();if(v.mk<it.pr){warn('Need '+it.pr+' ◈ Vigil Marks');return false;}
  const g=pick(Object.keys(GLY)),t=P.level>=45?3:2;glyGive(g,t,1);v.mk-=it.pr;SFX.loot();toast('✦ '+glyName(g,t)+' (parts bag)');save();return true;};}
A_('cra','gly1','Glyphwright','Etch an Alloy Glyph onto a weapon or armour piece',10,()=>P&&P.bx?P.bx.gl|0:0,1);
A_('cra','gly4','Master Etcher','Etch a tier IV Alloy Glyph',20,()=>P&&P.bx?P.bx.g4|0:0,1,{title:'Master Etcher'});
/* ---------- presets ---------- */
function bxBankItems(){try{return loadBank().items||[];}catch(e){return [];}}
function bxFind(id){if(id==null)return null;const a=findItem(id);if(a)return {it:a,where:isEquipped(a)?'eq':'inv'};const b=bxBankItems().find(x=>x.id===id);return b?{it:b,where:'bank'}:null;}
function bxSave(ix,name){const B=bxi();const p={n:String(name||'Preset '+(B.pre.length+1)).slice(0,24),g:{},i:{}};for(const k in P.eq)if(P.eq[k])p.g[k]=P.eq[k].id;for(const k in P.imps)if(P.imps[k])p.i[k]=P.imps[k].id;
  if(ix!=null&&B.pre[ix]){p.n=name?p.n:B.pre[ix].n;B.pre[ix]=p;}else{if(B.pre.length>=BX_MAXPRE){warn('Up to '+BX_MAXPRE+' presets');return -1;}B.pre.push(p);ix=B.pre.length-1;}save();return ix;}
function bxWant(p){const W=[];for(const k in (p.i||{}))W.push({imp:1,slot:k,id:p.i[k]});for(const k in (p.g||{}))W.push({imp:0,slot:k,id:p.g[k]});return W;}
function bxPreview(ix){const p=bxi().pre[ix];if(!p)return null;const c=Object.assign({},P,{eq:Object.assign({},P.eq),imps:Object.assign({},P.imps)});const miss=[];
  for(const w of bxWant(p)){const f=bxFind(w.id);if(!f){miss.push(w.slot);continue;}(w.imp?c.imps:c.eq)[w.slot]=f.it;}
  const a=S,b=statsFor(c);return {a,b,miss};}
function bxApply(ix){const p=bxi().pre[ix];if(!p)return null;const rep={on:[],bank:[],miss:[],req:[],full:false};if(P.dead){warn('Not while defeated');return rep;}
  const near=typeof bankNear==='function'?bankNear(P.pos):null;const pend=[];
  for(const w of bxWant(p)){const cur=(w.imp?P.imps:P.eq)[w.slot];if(cur&&cur.id===w.id)continue;const f=bxFind(w.id);
    if(!f){rep.miss.push((w.imp?IMPDEF[w.slot].n+' implant':SLOTN[w.slot]||w.slot));continue;}
    if(f.where==='eq'){rep.miss.push(f.it.name+' (equipped in another slot)');continue;}
    if(f.where==='bank'){if(!near){rep.bank.push(f.it.name);continue;}if(!bankWithdraw(w.id)){rep.full=true;rep.bank.push(f.it.name);continue;}}
    pend.push(w);}
  for(let pass=0;pass<4&&pend.length;pass++){let prog=false;for(const w of pend.slice().sort((x,y)=>y.imp-x.imp)){const it=P.inv.find(x=>x.id===w.id);if(!it){pend.splice(pend.indexOf(w),1);continue;}
      if(reqMet(it)&&(!it.fac||facCanUse(it))&&equip(w.id)){rep.on.push(it.name);pend.splice(pend.indexOf(w),1);prog=true;}}if(!prog)break;}
  for(const w of pend){const it=P.inv.find(x=>x.id===w.id);if(it){const m=firstMiss(it);rep.req.push(it.name+(m?' (need '+(m.v-eff(m.s))+' '+STATN[m.s]+')':''));}}
  calcStats();save();return rep;}
/* ---------- gap helper ---------- */
function bxTargets(){const L=[];const add=(it,where)=>{if(!it||(it.kind!=='gear'&&it.kind!=='imp'&&it.kind!=='disk'))return;if(!(it.req||[]).length)return;if(it.req.every(r=>eff(r.s)>=r.v))return;L.push({id:'i:'+it.id,n:it.name+(where==='bank'?' (bank)':''),req:it.req,it});};
  for(const it of P.inv)add(it,'inv');for(const it of bxBankItems())add(it,'bank');
  for(const id of (P.known||[])){const w=WEAVES[id];if(w&&typeof wvReqMiss==='function'&&wvReqMiss(w))L.push({id:'w:'+id,n:'📖 '+w.name,req:w.req,w});}return L;}
function bxBridges(s){const out=[],L=P.level||1;
  for(const id of (P.known||[])){const w=WEAVES[id];if(!w||!w.buff||typeof w.buff.mods!=='function')continue;let m={};try{m=w.buff.mods(L)||{};}catch(e){}if(m[s]>0&&!(P.buffs||[]).some(b=>b.id===id||(b.id||'').startsWith(w.line||'§')))out.push({k:'buff',n:'Cast '+w.name,v:m[s]});}
  for(const k in CONSUM){const c=CONSUM[k],m=c.mods(L);if(m[s]>0&&(P.consum[k]|0)>0&&!(P.buffs||[]).some(b=>b.id==='c_'+k))out.push({k:'cons',n:c.name+' ×'+P.consum[k],v:m[s]});}
  const cand=P.inv.concat(bxBankItems().map(x=>Object.assign({},x,{_bank:1})));const best={};
  for(const it of cand){if(it.kind!=='imp'&&it.kind!=='gear')continue;const b=(it.bonus||[]).find(x=>x.s===s);if(!b)continue;const cur=(it.kind==='imp'?P.imps:P.eq)[it.slot];const cb=cur?((cur.bonus||[]).find(x=>x.s===s)||{v:0}).v:0;const gain=b.v-cb;if(gain<=0)continue;
    const key=it.kind+it.slot;const ok=reqMet(it);if(!best[key]||gain>best[key].v)best[key]={k:it.kind==='imp'?'imp':'gear',n:(it.kind==='imp'?'Install ':'Equip ')+it.name+(it._bank?' (bank)':'')+(ok?'':' · needs '+(firstMiss(it)?STATN[firstMiss(it).s]:'more skill')),v:gain,ok};}
  for(const k in best)out.push(best[k]);return out.sort((a,b)=>b.v-a.v);}
/* ---------- panel ---------- */
const BXS={tab:'pre',sel:0,gap:null,gitem:null};
function bxStyle(){if(document.getElementById('bxcss'))return;const st=document.createElement('style');st.id='bxcss';
  st.textContent='.oeb{display:inline-block;margin-left:6px;padding:0 6px;border-radius:8px;font-size:11px;font-weight:700;vertical-align:middle}.oe75{background:#ffb02033;color:#ffc04a;border:1px solid #ffb020}.oe50{background:#ff5a3a33;color:#ff8a6a;border:1px solid #ff5a3a}'+
  '.bxrow{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0}.bxrow select{flex:1;min-width:0;max-width:100%;font-size:14px;padding:6px;border-radius:8px;background:#1d1b22;color:#f3e6d3;border:1px solid #4a4250}'+
  '.bxd{display:grid;grid-template-columns:auto auto auto;gap:2px 12px;font-size:13px}.bxd .up{color:#8fe08a}.bxd .down{color:#ff8a6a}.glyb{color:#ffd27a}';document.head.appendChild(st);}
function bxSel(name,opts,cur){return `<select data-bxsel="${name}">`+opts.map(([v,t])=>`<option value="${esc(String(v))}" ${String(v)===String(cur)?'selected':''}>${esc(t)}</option>`).join('')+'</select>';}
function bxDelta(a,b){const rows=[['maxHp','Health'],['maxEn','Energy'],['dmg','Weapon damage'],['armor','Armour'],['crit','Crit %'],['mxCap','Matrix']].map(([k,n])=>[n,a[k]|0,b[k]|0]);
  const sk=SKILLS.concat(ATTRS).map(s=>[STATN[s],a.E[s]|0,b.E[s]|0]).filter(r=>r[1]!==r[2]).sort((x,y)=>Math.abs(y[2]-y[1])-Math.abs(x[2]-x[1])).slice(0,8);
  return '<div class="bxd">'+rows.concat(sk).map(([n,x,y])=>`<span>${n}</span><span>${y}</span><span class="${y>x?'up':y<x?'down':''}">${y===x?'·':(y>x?'+':'')+(y-x)}</span>`).join('')+'</div>';}
function openPlanner(tab){bxStyle();if(tab)BXS.tab=tab;const B=bxi();const t=BXS.tab;
  let h=`<div class="tabs">${[['pre','🧬 Presets'],['gap','🪜 Gap Helper'],['glyph','✦ Glyphs'],['help','❔ OE rules']].map(([k,n])=>`<button data-act="bxtab" data-t="${k}" class="${t===k?'on':''}">${n}</button>`).join('')}</div>`;
  if(t==='pre'){const sel=Math.min(BXS.sel,Math.max(0,B.pre.length-1));BXS.sel=sel;
    h+=`<div class="bxrow">${B.pre.length?bxSel('pre',B.pre.map((p,i)=>[i,(i+1)+'. '+p.n]),sel):'<span style="opacity:.7">No presets yet.</span>'}<button class="sbtn" data-act="bxsave" ${B.pre.length>=BX_MAXPRE?'disabled':''}>＋ Save current</button></div>`;
    const p=B.pre[sel];if(p){const pv=bxPreview(sel);const near=typeof bankNear==='function'&&!!bankNear(P.pos);
      const slotRow=(imp,sl)=>{const id=(imp?p.i:p.g)[sl];const f=bxFind(id);const cur=(imp?P.imps:P.eq)[sl];const lab=imp?IMPDEF[sl].ic+' '+IMPDEF[sl].n:(SLOTICON[sl]||'')+' '+(SLOTN[sl]||sl);
        const opts=[['','— keep current —']];const seen=new Set();const push=(it,w)=>{if(!it||seen.has(it.id)||it.slot!==sl||(imp?it.kind!=='imp':it.kind!=='gear'))return;seen.add(it.id);opts.push([it.id,it.name+(w==='bank'?' (bank)':w==='eq'?' (on)':'')+(reqMet(it)?'':' 🔒')]);};
        push(cur,'eq');P.inv.forEach(x=>push(x,'inv'));bxBankItems().forEach(x=>push(x,'bank'));if(id&&!f)opts.push([id,'⚠ missing item']);
        return `<div class="bxrow"><span style="width:118px;font-size:13px">${lab}</span>${bxSel('slot:'+(imp?'i':'g')+':'+sl,opts,id||'')}</div>`;};
      h+=`<div class="cols"><div><div class="h4">✏️ ${esc(p.n)} <button class="sbtn alt" data-act="bxren">Rename</button> <button class="sbtn alt" data-act="bxover">Overwrite with current</button> <button class="sbtn alt" data-act="bxdel">Delete</button></div>
        <div class="h4" style="margin-top:6px">Implants &amp; symbiants</div>${IMPSLOTS.map(sl=>slotRow(1,sl)).join('')}<div class="h4" style="margin-top:6px">Gear</div>${GSLOTS.map(sl=>slotRow(0,sl)).join('')}</div>
        <div><div class="h4">Preview (vs now)</div>${bxDelta(pv.a,pv.b)}${pv.miss.length?`<div class="down" style="margin-top:6px">⚠ Missing: ${pv.miss.join(', ')}</div>`:''}
        <button class="sbtn" style="margin-top:8px" data-act="bxapply">⚡ Swap to "${esc(p.n)}"</button>
        <div class="stats" style="opacity:.8;margin-top:6px">One tap installs implants first, then gear, repeating while new bonuses unlock more. Items in your bank are pulled only at a bank terminal${near?' (you are at one)':''}. Requirements are checked as normal: use buffs first for a twink set.</div>${BXS.rep||''}</div></div>`;}
    else h+='<div class="stats" style="margin-top:8px">Save your current gear and implants as a named preset (e.g. <b>Combat</b>, <b>Twink / Buff</b>, <b>Tower</b>), up to '+BX_MAXPRE+'. Edit any slot from your pack or bank, preview the stat changes, then swap in one tap.</div>';}
  else if(t==='gap'){const T=bxTargets();const cur=T.find(x=>x.id===BXS.gap)||T[0];if(cur)BXS.gap=cur.id;
    h+=`<div class="bxrow">${T.length?bxSel('gap',T.map(x=>[x.id,x.n]),BXS.gap):'<span style="opacity:.7">Everything you own is usable right now.</span>'}</div>`;
    if(cur){const gear=cur.it&&cur.it.kind==='gear';h+='<div class="cols"><div><div class="h4">Requirements</div><div class="bxd"><span><b>Skill</b></span><span><b>Have / need</b></span><span><b>Gap</b></span>'+cur.req.map(r=>{const hv=eff(r.s),g=Math.max(0,r.v-hv);return `<span>${STATN[r.s]}</span><span>${hv} / ${r.v}</span><span class="${g?'down':'up'}">${g?'−'+g:'✔'}</span>`;}).join('')+'</div>'+
      (gear?'<div class="stats" style="margin-top:6px">Over-equip rule: once equipped it keeps <b>full power</b> while your skills stay within 80% of each requirement ('+cur.req.map(r=>STATN[r.s]+' '+Math.ceil(r.v*0.8)).join(', ')+'), then drops to 75% and below 60% to 50%.</div>':'')+'</div><div><div class="h4">What you own that bridges it</div>';
      for(const r of cur.req){const g=r.v-eff(r.s);if(g<=0)continue;const br=bxBridges(r.s);const tot=br.filter(b=>b.ok!==false).reduce((a,b)=>a+b.v,0);
        h+=`<div class="h4" style="margin-top:6px">${STATN[r.s]}: need +${g}</div>`+(br.length?br.map(b=>`<div class="bxrow"><span style="flex:1;font-size:13px">${b.k==='buff'?'✨':b.k==='cons'?'🧪':b.k==='imp'?'🧠':'🔫'} ${esc(b.n)}</span><b class="${b.ok===false?'down':'up'}">+${b.v}</b></div>`).join(''):'<div style="opacity:.7">Nothing you own raises it.</div>')+
          `<div class="${tot>=g?'up':'down'}" style="font-size:13px">${tot>=g?'✔ Reachable with what you own (+'+tot+')':'Still short by '+(g-tot)+' after everything usable (+'+tot+')'}</div>`;}
      h+='</div></div>';}}
  else if(t==='glyph'){const G=P.inv.filter(x=>x.kind==='gear').concat(Object.values(P.eq).filter(Boolean));const cur=G.find(x=>x.id===BXS.gitem)||G[0];if(cur)BXS.gitem=cur.id;
    const gl=bagSort(bag().filter(o=>o.kind==='gly'));
    h+=`<div class="bxrow">${G.length?bxSel('gitem',G.map(x=>[x.id,(isEquipped(x)?'(on) ':'')+x.name+' · L'+x.lvl+(x.gly?' ✦'+GLY_T[x.gly.t]:'')]),BXS.gitem):'<span style="opacity:.7">No weapons or armour.</span>'}</div>`;
    h+='<div class="cols"><div>';if(cur){h+=`<div class="h4">${esc(cur.name)}</div>`+(cur.gly?`<div class="glyb">✦ ${glyName(cur.gly.k,cur.gly.t)}: +${GLY[cur.gly.k].v[cur.gly.t-1]} ${STATN[GLY[cur.gly.k].s]}</div><button class="sbtn alt" data-act="bxlift">Lift glyph into bag (${100*cur.gly.t*cur.gly.t}¢)</button>`:'<div style="opacity:.7">No glyph etched. One glyph per item; etching over one lifts the old glyph back into your bag.</div>');
      h+='<div class="h4" style="margin-top:8px">Your glyphs</div>'+(gl.length?gl.map(o=>{const g=glyOf(o);const fit=glyFits(cur,g.t);return bagRow(o,fit?'bxetch':'noop',fit?'<span class="pr">Etch</span>':'<span class="pr" style="opacity:.6">L'+GLY_LV[g.t]+'+</span>');}).join(''):'<div style="opacity:.7">No glyphs yet: bosses, hard modes, the Vigil Stair and invasion Generals drop them, or craft one.</div>');}
    h+=`</div><div><div class="h4">🛠 Glyph bench</div><div class="stats" style="opacity:.85">Craft tier I or II of the glyph you want. Tier III comes from tough fights; tier IV only from hard-mode and raid bosses and Vigil Stair landing guardians (floor 20+) at level 70+.</div>`+
      [1,2].map(t2=>`<div class="h4" style="margin-top:6px">Tier ${GLY_T[t2]} · ${GLY_CRAFT[t2].mats.map(([m,n])=>n+'× '+MATS[m].ic).join(' ')}${GLY_CRAFT[t2].q>1?' QL '+GLY_CRAFT[t2].q+'+':''} · ${GLY_CRAFT[t2].cr}¢</div><div class="bxrow">`+Object.keys(GLY).map(k=>{const c=glyCraftCheck(k,t2);return `<button class="sbtn${c.ok?'':' locked'}" data-act="bxcraft" data-k="${k}" data-t="${t2}" title="${esc(c.ok?glyName(k,t2):'Need '+c.why)}">${GLY[k].ic} ${GLY[k].n}</button>`;}).join('')+'</div>').join('')+
      '<div class="stats" style="margin-top:8px">'+Object.keys(GLY).map(k=>GLY[k].ic+' '+GLY[k].n+': '+STATN[GLY[k].s]+' '+GLY[k].v.map(v=>'+'+v).join('/')).join('<br>')+'</div></div></div>';}
  else{h+=`<div class="stats" style="line-height:1.5"><b>Over-equipping (weapons &amp; armour)</b><br>Buff up, equip something above your level of skill, and it stays on when the buffs fade. Its power then depends on how close you still are:<br>
    • at least <b>80%</b> of every requirement: <b>full power</b> (the sweet spot for clever twinking)<br>• 60-79%: <span class="oeb oe75">OE 75%</span> damage, armour and bonuses<br>• below 60%: <span class="oeb oe50">OE 50%</span><br>
    The item is never unequipped. The badge shows how many points bring it back to full power. Gear you were already wearing when this rule arrived keeps full power. Implants and symbiants keep the old rule: once installed they work fully.</div>`;}
  openPanel('🧬 LOADOUT PLANNER',h,'planner');
  try{for(const s of pbody.querySelectorAll('select[data-bxsel]'))s.addEventListener('change',()=>bxSelect(s.dataset.bxsel,s.value));}catch(e){}}
function bxSelect(name,v){const B=bxi();if(name==='pre')BXS.sel=+v|0;else if(name==='gap')BXS.gap=v;else if(name==='gitem')BXS.gitem=v;
  else if(name.startsWith('slot:')){const [,k,sl]=name.split(':');const p=B.pre[BXS.sel];if(p){const m=k==='i'?p.i:p.g;if(!v)delete m[sl];else{const f=[...P.inv,...Object.values(P.eq),...Object.values(P.imps),...bxBankItems()].find(x=>x&&String(x.id)===String(v));m[sl]=f?f.id:v;}save();}}
  BXS.rep='';openPlanner();}
{const _sax=stage3Act;stage3Act=function(a,b){const D=b.dataset||{};
  if(a==='bxopen'){openPlanner(D.t||'pre');return true;}if(a==='bxtab'){BXS.rep='';openPlanner(D.t);return true;}
  if(a==='bxsave'){const n=prompt('Preset name (e.g. Combat, Twink / Buff, Tower)','Preset '+(bxi().pre.length+1));if(n!==null){const i=bxSave(null,n||undefined);if(i>=0)BXS.sel=i;}openPlanner('pre');return true;}
  if(a==='bxover'){bxSave(BXS.sel);toast('Preset updated');openPlanner('pre');return true;}
  if(a==='bxren'){const p=bxi().pre[BXS.sel];if(p){const n=prompt('Rename preset',p.n);if(n){p.n=n.slice(0,24);save();}}openPlanner('pre');return true;}
  if(a==='bxdel'){const B=bxi();if(B.pre[BXS.sel]&&confirm('Delete preset "'+B.pre[BXS.sel].n+'"?')){B.pre.splice(BXS.sel,1);BXS.sel=0;save();}openPlanner('pre');return true;}
  if(a==='bxapply'){const r=bxApply(BXS.sel);BXS.rep=r?`<div class="stats" style="margin-top:6px">${r.on.length?'<div class="up">✔ '+r.on.map(esc).join(', ')+'</div>':'<div>Nothing to change.</div>'}${r.req.length?'<div class="down">🔒 Requirements not met: '+r.req.map(esc).join(', ')+'</div>':''}${r.bank.length?'<div class="down">🏦 In your bank'+(r.full?' (pack full)':'')+': '+r.bank.map(esc).join(', ')+'. Stand at a bank terminal to pull them.</div>':''}${r.miss.length?'<div class="down">⚠ Missing: '+r.miss.map(esc).join(', ')+'</div>':''}</div>`:'';openPlanner('pre');return true;}
  if(a==='bxetch'){glyApply(BXS.gitem,D.id);openPlanner('glyph');return true;}if(a==='bxlift'){glyLift(BXS.gitem);openPlanner('glyph');return true;}
  if(a==='bxcraft'){glyCraft(D.k,+D.t);openPlanner('glyph');return true;}if(a==='bxglyph'){openPlanner('glyph');return true;}
  return _sax(a,b);};}
// item detail: OE badge + glyph line/button replace the old "twinked" note for weapons/armour
{const _dh=detailHtml;detailHtml=function(sel){let h=_dh(sel);if(!sel||sel.kind!=='gear')return h;const o=oeOf(sel);
  const tw=/<div class="tw" style="display:block;margin-top:6px">⚡ Twinked:[^<]*<\/div>/;
  const oeh=o?`<div class="tw" style="display:block;margin-top:6px">${oeBadge(o)} Over-equipped at ${Math.round(o.q*100)}% of the requirement: ${Math.round(o.f*100)}% damage, armour and bonuses. Restore ${o.need.map(n=>'<b>'+n.n+' '+STATN[n.s]+'</b>').join(', ')} for full power.</div>`
    :(isEquipped(sel)&&!reqMet(sel)?'<div class="tw" style="display:block;margin-top:6px">⚡ Over-equipped but within 80% of every requirement: full power.</div>':'');
  h=tw.test(h)?h.replace(tw,oeh):h.replace('<div style="color:#ffc85a;margin-top:4px">Sells for',oeh+'<div style="color:#ffc85a;margin-top:4px">Sells for');
  const gl=`<div class="glyb" style="margin-top:4px">${sel.gly?'✦ '+glyName(sel.gly.k,sel.gly.t):'✦ Glyph slot empty'} <button class="sbtn alt" data-act="bxopen" data-t="glyph" onclick="BXS.gitem=${JSON.stringify(sel.id).replace(/"/g,'&quot;')}">Glyphs</button></div>`;
  return h.replace('<div style="color:#ffc85a;margin-top:4px">Sells for',gl+'<div style="color:#ffc85a;margin-top:4px">Sells for');};}
try{bxStyle();}catch(e){}
function bxExports(){return {BX_VER,detailHtml,twTag,itemLines,GLY,GLY_LV,GLY_CRAFT,bxi,normBx,bxFields,oeRatio,oeFactor,oeOf,bxSave,bxApply,bxPreview,bxTargets,bxBridges,glyGive,glyApply,glyLift,glyCraft,glyCraftCheck,glyFits,bxOnKill,openPlanner,BXS};}
