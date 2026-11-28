/* ================= Build CL (2026-11-28): item lock + AO-style character window =================
   Lock: 🔒 on an item stops Scrap, trader Sell, Sell Junk, bank Store junk and salvage. Uniques, set pieces and
   dungeon/dyna exclusives count as locked until you unlock them (it.locked===false). Scrapping Rare or better asks first.
   Character window: replaces the Gear / Implants lists with two body-shaped slot dolls (gear, implants), a 24-slot pack
   grid and a compare box. Each pack item gets a badge from statsFor() with it swapped in: ▲ better, ◆ mixed, ▼ worse,
   ✖ requirements not met yet. Consumables / Parts / Planner tabs are unchanged. */
function isLocked(it){return !!it&&(it.locked===true||(it.locked!==false&&!!(it.uniq||it.set||it.src)));}
let invF='all';
const DOLL_G=[[null,'head',null],['weapon','armor','hands'],[null,'legs',null],[null,'feet',null]];
const DOLL_I=[['eyes','head',null],['arms','chest','hands'],[null,'legs',null],[null,'feet',null]];
const CMP_KEYS=[['maxHp','Health'],['maxEn','Energy'],['armor','Armour'],['dmg','Weapon damage'],['crit','Crit %'],['power','Power %'],['dodge','Dodge %'],['dr','Damage reduction %'],['runPct','Move speed %']];
const invcCmpable=it=>!!it&&(it.kind==='gear'||isImp(it));
function invcSwap(it){const c=Object.assign({},P,{eq:Object.assign({},P.eq),imps:Object.assign({},P.imps)});const tgt=isImp(it)?c.imps:c.eq;tgt[it.slot]=isEquipped(it)?null:it;return c;}
// stat changes from equipping it (or, if it's equipped, from taking it off): [{n,d,main}]
function invcDiff(it,base){if(!invcCmpable(it))return null;let a,b;try{a=base||statsFor(P);b=statsFor(invcSwap(it));}catch(e){return null;}
  const out=[];for(const [k,n] of CMP_KEYS){const d=Math.round(((+b[k]||0)-(+a[k]||0))*10)/10;if(d)out.push({n,d,main:1});}
  const ks=new Set([...Object.keys(a.E||{}),...Object.keys(b.E||{})]);for(const k of ks){const d=Math.round((+b.E[k]||0)-(+a.E[k]||0));if(d)out.push({n:STATN[k]||k,d,main:0});}
  return out;}
function invcVerdict(diff){if(!diff)return '';const up=diff.some(x=>x.d>0),dn=diff.some(x=>x.d<0);return up&&!dn?'up':dn&&!up?'down':up?'mix':'same';}
const VB={up:['▲','Better than what you have on'],mix:['◆','Some stats up, some down'],down:['▼','Worse than what you have on'],same:['=','No stat change']};
function invcTile(it,o){o=o||{};const sel=it.id===invSel;const v=o.base&&!isEquipped(it)?invcVerdict(invcDiff(it,o.base)):'';const cant=invcCmpable(it)&&!isEquipped(it)&&!reqMet(it);
  const q=isImp(it)?'QL'+it.ql:isDisk(it)?'':it.lvl?'L'+it.lvl:'';
  return `<button class="ivt${sel?' sel':''}${isJunkItem(it)?' junk':''}" data-act="sel" data-id="${esc(String(it.id))}" style="--rc:${RAR[it.r]?RAR[it.r].c:'#ccc'}" title="${esc(it.name)}${cant?' · requirements not met yet':v&&VB[v]?' · '+VB[v][1]:''}"><span class="ii">${icoOf(it)}</span>${q?`<span class="iq">${q}</span>`:''}${stackN(it)>1?`<span class="ik">×${stackN(it)}</span>`:''}${o.lbl?`<span class="il">${o.lbl}</span>`:''}${v&&v!=='same'&&!cant?`<span class="vb ${v}">${VB[v][0]}</span>`:''}${cant?'<span class="xb" title="Requirements not met yet">✖</span>':isLocked(it)?'<span class="xb">🔒</span>':''}</button>`;}
function invcDoll(rows,imp){return `<div class="doll">${rows.map(r=>r.map(sl=>{if(!sl)return '<span></span>';const it=imp?P.imps[sl]:P.eq[sl];const lbl=imp?IMPDEF[sl].n:SLOTN[sl];
  return it?invcTile(it,{lbl}):`<div class="ivt empty" title="Empty ${lbl} slot"><span class="ii">${imp?IMPDEF[sl].ic:SLOTICON[sl]}</span><span class="il">${lbl}</span></div>`;}).join('')).join('')}</div>`;}
function invcStrip(){const run=S.runPct!=null?'+'+S.runPct+'%':'';return `<div class="sstrip">${[['Health',S.maxHp],['Energy',S.maxEn],['Armour',S.armor],['Damage',S.dmg],['Crit',S.crit+'%'],['Dodge',S.dodge+'%'],['Power','+'+S.power+'%'],['Move',run]].map(([n,v])=>`<div>${n}<b>${v}</b></div>`).join('')}</div>`;}
function invcTabs(){return `<div class="tabs">${[['char','🧍 Character'],['items','🧪 Consumables'],['bag','🧰 Parts']].map(([t,n])=>`<button data-act="itab" data-t="${t}" class="${(t==='char'?invcIsChar():invTab===t)?'on':''}">${n}</button>`).join('')}<button data-act="bxopen" data-t="pre" title="Loadout presets, Gap Helper, Alloy Glyphs">🧬 Planner</button><span style="margin-left:auto;align-self:center;font-size:13px;opacity:.8">Pack ${P.inv.length}/24</span></div>`;}
const invcIsChar=()=>invTab==='char'||invTab==='gear'||invTab==='imps';
function invcDetail(sel,base){if(!sel)return `<div class="det ivhelp">Tap an item to compare it with what you're wearing.<br><span class="vb up">▲</span> better · <span class="vb mix">◆</span> mixed · <span class="vb down">▼</span> worse · ✖ can't use yet · 🔒 locked</div>`;
  const eqd=isEquipped(sel),cmp=invcCmpable(sel),miss=cmp&&!eqd&&!reqMet(sel);const diff=cmp?invcDiff(sel,base):null;
  const cur=cmp&&!eqd?(isImp(sel)?P.imps[sel.slot]:P.eq[sel.slot]):null;
  const chips=diff?(diff.length?diff.sort((a,b)=>b.main-a.main).map(x=>`<span class="${x.d>0?'p':'m'}${x.main?' mn':''}">${x.d>0?'+':'−'}${Math.abs(x.d)} ${esc(x.n)}</span>`).join(''):'<span>No stat change</span>'):'';
  const v=diff?invcVerdict(diff):'';
  const head=`<b style="color:${RAR[sel.r]?RAR[sel.r].c:'#ccc'}">${isLocked(sel)?'🔒 ':''}${esc(sel.name)}</b> <span style="opacity:.75;font-size:12px">${isImp(sel)?'QL '+sel.ql+' '+IMPDEF[sel.slot].n+' implant':isDisk(sel)?'Weave Disk':sel.kind==='gear'?'Level '+sel.lvl+' '+esc(itemType(sel)):''}</span>`;
  const cmpTxt=!cmp?'':eqd?'If you take it off:':cur?'Swapping out '+esc(cur.name)+':':'Your '+(isImp(sel)?IMPDEF[sel.slot].n+' slot':SLOTN[sel.slot]+' slot')+' is empty. Equipping gives:';
  const verdict=!cmp||eqd?'':miss?'<div class="down">✖ You can\'t use this yet. See the requirements below.</div>':v==='up'?'<div class="up">▲ An upgrade.</div>':v==='down'?'<div class="down">▼ Worse than what you have on.</div>':v==='mix'?'<div style="color:#ffc85a">◆ Better in some ways, worse in others.</div>':'';
  const lockB=sellableKind(sel)||sel.kind==='gear'||isImp(sel)?`<button class="sbtn alt" data-act="ilock">${isLocked(sel)?'🔓 Unlock':'🔒 Lock'}</button>`:'';
  const btns=eqd?`<button class="sbtn alt" data-act="uneq">${isImp(sel)?'Remove':'Unequip'}</button>${lockB}`
    :`${cmp?`<button class="sbtn${miss?' locked':''}" data-act="eq">${isImp(sel)?'Install':'Equip'}</button>`:''}${lockB}${sellableKind(sel)&&!isLocked(sel)?`<button class="sbtn alt" data-act="jtag">${isJunkItem(sel)?'Not junk':'🗑 Mark junk'}</button>`:''}<button class="sbtn alt" data-act="junk" ${isLocked(sel)?'disabled title="Locked"':''}>Scrap</button>`;
  let more='';try{more=detailHtml(sel).replace(/<div class="btns">[\s\S]*?<\/div>/,'');}catch(e){}
  return `<div class="det ivdet">${head}${cmpTxt?`<div class="ivcap">${cmpTxt}</div><div class="cmp">${chips}</div>`:''}${verdict}${cmp||isDisk(sel)?`<div class="rqs">${reqChips(sel)}</div>`:''}<div class="btns">${btns}</div><details class="ivmore"><summary>Full item info</summary>${more}</details></div>`;}
function invcHtml(){const sel=findItem(invSel);let base=null;try{base=statsFor(P);}catch(e){}
  const F=[['all','All'],['gear','Gear'],['imps','Implants'],['other','Other']];
  const pick=it=>invF==='all'||(invF==='gear'?it.kind==='gear':invF==='imps'?isImp(it):!(it.kind==='gear'||isImp(it)));
  const L=P.inv.filter(pick);let cells=L.map(it=>invcTile(it,{base})).join('');if(invF==='all')for(let i=L.length;i<24;i++)cells+='<div class="ivt empty"></div>';
  const ups=P.inv.filter(it=>invcCmpable(it)&&reqMet(it)&&invcVerdict(invcDiff(it,base))==='up').length;
  return invcTabs()+`<div class="ivc"><div><div class="dolls"><div><div class="h4">Gear</div>${invcDoll(DOLL_G,false)}</div><div><div class="h4">Implants</div>${invcDoll(DOLL_I,true)}</div></div>${invcStrip()}</div>
  <div><div class="ichips">${F.map(([k,n])=>`<button class="ltchip${invF===k?' on':''}" data-act="ifilt" data-f="${k}">${n}</button>`).join('')}${ups?`<span class="ivups">▲ ${ups} upgrade${ups>1?'s':''} in your pack</span>`:''}</div>
  <div class="pack">${cells||'<div style="opacity:.6;grid-column:1/-1">Nothing here.</div>'}</div>${invcDetail(sel,base)}${lootFChips()}</div></div>`;}
{const _oi=openInventory;openInventory=function(){
  if(!invcIsChar()){_oi();const t=pbody.querySelector('.tabs');if(t)t.outerHTML=invcTabs();return;}
  invTab='char';stackInv();openPanel('INVENTORY',invcHtml(),'inv');};}
{const _op=openPanel;openPanel=function(title,html,kind){_op(title,html,kind);$('#panel').classList.toggle('pw-inv',kind==='inv');};}
// bank (bwd/bdep) and trader (buy) rows get the same ▲ ◆ ▼ ✖ badge as the pack grid; one statsFor(P) per panel render
let invcBase=null;
function invcRowBadge(it){if(!invcCmpable(it)||isEquipped(it))return '';if(!reqMet(it))return '<span class="vb down ivrb" title="Requirements not met yet">✖</span>';
  if(!invcBase){try{invcBase=statsFor(P);}catch(e){return '';}setTimeout(()=>{invcBase=null;},0);}
  const v=invcVerdict(invcDiff(it,invcBase));return v&&v!=='same'?`<span class="vb ${v} ivrb" title="${VB[v][1]}">${VB[v][0]}</span>`:'';}
{const _ir=itemRow;itemRow=function(it,extra,sel,act){let h=_ir(it,extra,sel,act);if(!it)return h;if(isLocked(it))h=h.replace(/(<div class="nm"[^>]*>)/,'$1🔒 ');
  if(act==='bwd'||act==='bdep'||act==='buy'){const bd=invcRowBadge(it);if(bd)h=h.replace(/(<div class="nm"[^>]*>)/,'$1'+bd+' ');}return h;};}
{const _s3=stage3Act;stage3Act=function(a,b){
  if(a==='ilock'){const it=findItem(invSel);if(it){it.locked=!isLocked(it);if(it.locked&&it.junk)it.junk=false;toast(it.locked?'🔒 Locked: it can\'t be sold, scrapped or salvaged':'🔓 Unlocked');save();}openInventory();return true;}
  if(a==='ifilt'){invF=b.dataset.f||'all';openInventory();return true;}
  return _s3(a,b);};}
// runs before the panel's own click handler: locked items can't be scrapped or sold, and Rare+ scrap asks first
pbody.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;if(a!=='junk'&&a!=='sell'&&a!=='sellok')return;
  const id=a==='junk'?invSel:b.dataset.id;const it=P.inv.find(x=>String(x.id)===String(id));if(!it)return;
  if(isLocked(it)){e.stopImmediatePropagation();warn('🔒 '+it.name+' is locked. Unlock it in your inventory first.');return;}
  if(a==='junk'&&rRank(it.r)>=2&&!confirm('Scrap '+it.name+' for '+Math.ceil(it.value/2)*stackN(it)+'¢? This can\'t be undone.'))e.stopImmediatePropagation();},true);
(function(){if(document.getElementById('invccss'))return;const st=document.createElement('style');st.id='invccss';st.textContent=`
#panel.pw-inv .pbox{width:min(1020px,98vw)}
.ivc{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:start}
@media (max-width:760px){.ivc{grid-template-columns:minmax(0,1fr)}.pack{grid-template-columns:repeat(6,minmax(0,1fr))}}
.dolls{display:flex;gap:10px}.dolls .h4{margin:0 0 4px}
.doll{display:grid;grid-template-columns:repeat(3,58px);grid-auto-rows:60px;gap:6px;padding:8px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(255,190,110,.18)}
.ivt{position:relative;width:100%;height:100%;min-height:0;border-radius:10px;background:rgba(255,255,255,.06);border:2px solid var(--rc,rgba(255,255,255,.14));display:flex;align-items:center;justify-content:center;padding:0;color:inherit}
.ivt .ii{font-size:25px;line-height:1}.ivt.empty{border:2px dashed rgba(255,255,255,.14);background:rgba(255,255,255,.02)}.ivt.empty .ii{opacity:.35}
.ivt .iq{position:absolute;right:3px;bottom:1px;font-size:9px;font-weight:800;opacity:.85}.ivt .ik{position:absolute;left:3px;bottom:1px;font-size:10px;font-weight:800;color:#ffc85a}
.doll .ivt .il{position:absolute;left:0;right:0;top:1px;font-size:8.5px;opacity:.6;text-align:center;letter-spacing:.02em}.doll .ivt .ii{margin-top:7px}.doll .ivt .iq{display:none}
.ivt.sel{box-shadow:0 0 0 2px #fff,0 0 12px var(--rc)}.ivt.junk{opacity:.5}
.vb{display:inline-block;min-width:18px;height:18px;border-radius:9px;font-size:11px;font-weight:900;line-height:18px;text-align:center;padding:0 3px}
.ivt .vb{position:absolute;right:-6px;top:-6px}.ivrb{margin-right:3px;vertical-align:1px;font-size:10px;min-width:16px;height:16px;line-height:16px}.vb.up{background:#3ccf5a;color:#06210c}.vb.mix{background:#ffc85a;color:#2a1a02}.vb.down{background:#5c5c5c;color:#eee}
.ivt .xb{position:absolute;left:3px;top:1px;font-size:12px;color:#ff6a5a;font-weight:900;text-shadow:0 1px 2px #000}
.pack{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px}.pack .ivt{aspect-ratio:1/1;height:auto}
.ichips{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:0 0 8px}.ichips .ltchip{min-height:34px;padding:0 12px}
.ivups{font-size:12px;font-weight:800;color:#6dff8a;margin-left:auto}
.sstrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-top:10px;font-size:11px;opacity:.95}
.sstrip div{background:rgba(0,0,0,.25);border-radius:8px;padding:4px 6px}.sstrip b{display:block;font-size:14px;color:#fff3c8}
.ivdet{margin-top:10px}.ivcap{font-size:12px;opacity:.8;margin-top:6px}.ivhelp{margin-top:10px;font-size:13px;line-height:1.7}
.cmp{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}.cmp span{padding:2px 7px;border-radius:7px;font-size:12px;font-weight:700;background:rgba(255,255,255,.06)}
.cmp .p{background:rgba(60,207,90,.18);color:#7dff9a}.cmp .m{background:rgba(255,90,74,.18);color:#ff9d90}.cmp .mn{font-size:13px}
.ivmore{margin-top:8px}.ivmore summary{cursor:pointer;font-size:13px;opacity:.8}.ivmore .det{margin-top:6px}
@media (max-height:480px){.doll{grid-template-columns:repeat(3,46px);grid-auto-rows:48px;gap:4px;padding:6px}.ivt .ii{font-size:20px}.pack{grid-template-columns:repeat(8,minmax(0,1fr))}.ivc{grid-template-columns:auto minmax(0,1fr)}}
`;document.head.appendChild(st);})();
function invcExports(){return {isLocked,invcDiff,invcVerdict,invcHtml};}
