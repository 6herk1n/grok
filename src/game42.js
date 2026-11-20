/* ---------------- Build W1: Weave framework (loadouts, second bar page, Matrix, cast requirements, book filters, team casting) ----------------
   - Families: wvFam(w) sorts every Weave into nuke/aoe/dot/debuff/self/team/heal/cc/util/pet (w.fam overrides). WV_FAMS = labels for the book filter.
   - Cast requirements: a Weave's req (skills/attributes, e.g. Weave Craft + INT) must be met to CAST it, not only to learn it (eff() includes buffs,
     gear and implants, so buffing up unlocks better Weaves). Weaves already known when an older save is first loaded are grandfathered (P.wv.gf).
     Starters, perk and morph abilities have no requirements. wvReqMiss(w) -> first unmet req or null.
   - Matrix: buff Weaves (w.buff or kind 'teambuff') occupy Matrix while running (wvMx(w), w.mx overrides). Cap S.mxCap = level + implants + headgear
     + 'mx' gear/buff bonus (mxCapFor). Casting over cap refuses and (for the player) opens the Matrix panel to drop a running buff, then casts.
     A higher rank of a running buff line supersedes the lower one. Teammate casts don't use your Matrix.
   - Action bar page 2: P.wv.s2 (6 slots). P.wv.pg = shown page. barIds() returns the shown page; the page chip #bPg (tap or swipe), a swipe
     beside the buttons, or the Backquote key flips pages. Book slot indices 6-11 = page 2.
   - Loadouts: P.wv.lo = [{n,ic,s1,s2,auto}] (max 8), P.wv.cur. #bLo opens #loPop (one tap switches), key V cycles; the Weave Book saves/switches/
     renames/deletes. 'auto' presets (Attack/Buff/Debuff) are filled from your best known Weaves on first use until you save over them.
   - Team casting: buff Weaves can be cast on nearby AI teammates from the book (wvTeamCast): they get a damage / damage-reduction boost (tbSet).
   - Save: P.wv={v:1,gf,pg,s2,lo,cur} via futureFields (wvFields); older saves get Main = current bar + presets, gf = known Weaves. */
const WV_FAMS=[['all','All','📚'],['nuke','Nukes','💥'],['aoe','Area','🌋'],['dot','Damage over time','🔥'],['debuff','Debuffs','☠️'],['self','Self-buffs','✨'],['team','Team buffs','👥'],['heal','Heals','💚'],['cc','Control','🌀'],['util','Utility','🧰'],['pet','Pets','🤖']];
const WV_FAMN=Object.fromEntries(WV_FAMS.map(f=>[f[0],f]));
const WV_KF={nuke:'nuke',strike:'nuke',flurry:'nuke',lunge:'nuke',rattle:'nuke',drain:'nuke',aoeT:'aoe',cone:'aoe',barrage:'aoe',aoeSelf:'aoe',field:'aoe',stealAoe:'debuff',dot:'dot',hex:'debuff',steal:'debuff',
  heal:'heal',hot:'heal',teamheal:'heal',mez:'cc',mezAoe:'cc',fear:'cc',summon:'pet',pet:'pet',petheal:'pet',petbuff:'pet',battery:'util',stealth:'util',reflect:'util',dr:'util',morph:'util',taunt:'util'};
const WV_LO_MAX=8,WV_PRESETS=[['Attack','⚔️','atk'],['Buff','✨','buf'],['Debuff','☠️','deb']];
function wvIsBuff(w){return !!(w&&(w.buff||w.kind==='teambuff'));}
function wvFam(w){if(!w)return 'util';if(w.fam)return w.fam;if(w.kind==='teambuff')return (w.ally||w.allyDr)?'team':'self';if(w.buff)return 'self';if(w.kind&&WV_KF[w.kind])return WV_KF[w.kind];
  const d=w.desc||'';if(/AoE|every enemy|everything/i.test(d))return 'aoe';if(/less damage|taunt/i.test(d))return 'util';if(/heal/i.test(d))return 'heal';return 'nuke';}
function wvMx(w){if(!wvIsBuff(w))return 0;if(w.mx!=null)return w.mx;return Math.max(2,Math.round(3+(w.lvl||1)*0.55+((w.ally||w.allyDr)?2:0)));}
function mxCapFor(c,st){const L=(st&&st.syncLv)||c.level||1;let m=10+1.6*L;const imps=c.imps||{};for(const k in imps){const it=imps[k];if(it)m+=1+Math.floor((it.ql||1)/60);}
  const h=c.eq&&c.eq.head;if(h)m+=Math.floor((h.ql?h.ql/4.5:(h.lvl||1))/5);m+=(st&&st.bon&&st.bon.mx)||0;return Math.round(m);}
{const _sf=statsFor;statsFor=function(c){const r=_sf(c);r.mxCap=mxCapFor(c,r);return r;};}
STATN.mx='Matrix';SHORT.mx='MTX';STATDESC.mx='Matrix capacity: running buff Weaves occupy Matrix. Rises with level, implants and headgear.';
function wvOfBuff(b){if(!b)return null;const w=WEAVES[b.id];if(w&&w.buff)return w;for(const id in WEAVES){const x=WEAVES[id];if(x.kind==='teambuff'&&x.line===b.id&&x.name===b.name)return x;}return null;}
function mxUsed(skip){let u=0;for(const b of (P.buffs||[])){if(b.until<=T)continue;const w=wvOfBuff(b);if(!w)continue;if(skip&&w.line===skip.line)continue;u+=wvMx(w);}return u;}
function mxCap(){return (S&&S.mxCap)||mxCapFor(P,S);}
function mxNeed(w){const c=wvMx(w);if(!c)return 0;return Math.max(0,mxUsed(w)+c-mxCap());}
/* ---- save state ---- */
function normWv(o,s){const known=s?weaveState(s).known:(P.known||[]);const okId=id=>typeof id==='string'&&!!abDef(id)&&(known.includes(id)||(s?perkAbOk(s,id):perkAbOk(P,id)));
  const fresh=!(o&&typeof o==='object'&&o.v===1);o=fresh?{}:o;const six=a=>{const r=(Array.isArray(a)?a:[]).slice(0,NSLOTS).map(id=>okId(id)?id:null);while(r.length<NSLOTS)r.push(null);return r;};
  const gf=fresh?known.filter(id=>WEAVES[id]&&!WEAVES[id].starter&&(WEAVES[id].req||[]).length):(Array.isArray(o.gf)?o.gf.filter(id=>typeof id==='string'&&WEAVES[id]):[]);
  let lo=Array.isArray(o.lo)?o.lo.filter(x=>x&&typeof x==='object').slice(0,WV_LO_MAX).map(x=>({n:String(x.n||'Loadout').replace(/[<>]/g,'').slice(0,18)||'Loadout',ic:typeof x.ic==='string'?x.ic.slice(0,4):'🗂',s1:x.s1==null?null:six(x.s1),s2:x.s2==null?null:six(x.s2),auto:['atk','buf','deb'].includes(x.auto)?x.auto:null})):null;
  if(!lo||!lo.length){const s1=s?(Array.isArray(s.slots)?six(s.slots):null):six(P.slots);lo=[{n:'Main',ic:'⭐',s1:s1||null,s2:six(o.s2),auto:null}].concat(WV_PRESETS.map(p=>({n:p[0],ic:p[1],s1:null,s2:null,auto:p[2]})));}
  const cur=Number.isInteger(o.cur)&&o.cur>=0&&o.cur<lo.length?o.cur:0;
  return {v:1,gf,pg:o.pg===1?1:0,s2:six(o.s2),lo,cur};}
function wvFields(s){return {wv:normWv(s.wv,s)};}
const wvi=()=>(P.wv&&P.wv.v===1)?P.wv:(P.wv=normWv(P.wv,null));
/* ---- requirements ---- */
function wvReqMiss(w){if(!w||!WEAVES[w.id]||w.starter||w.mab||w.perk||!(w.req||[]).length)return null;if(P.wv&&(P.wv.gf||[]).includes(w.id))return null;return w.req.find(r=>eff(r.s)<r.v)||null;}
function wvMissTxt(m){return 'need '+(m.v-eff(m.s))+' more '+STATN[m.s];}
/* ---- slots (0-5 page 1, 6-11 page 2) ---- */
function wvSlotGet(i){return i<NSLOTS?P.slots[i]:wvi().s2[i-NSLOTS];}
function wvSlotSet(i,id){if(i<NSLOTS)P.slots[i]=id;else wvi().s2[i-NSLOTS]=id;}
function wvSlotIdx(id){const a=P.slots.indexOf(id);if(a>=0)return a;const b=wvi().s2.indexOf(id);return b>=0?b+NSLOTS:-1;}
assignSlot=function(i,wid){if(!P.known.includes(wid)&&!abDef(wid))return;i=Math.max(0,Math.min(NSLOTS*2-1,i|0));const j=wvSlotIdx(wid);if(j>=0)wvSlotSet(j,wvSlotGet(i)||null);wvSlotSet(i,wid);setupHud();save();const w=abDef(wid);toast((w?w.name:wid)+' → '+(i<NSLOTS?'slot '+(i+1):'page 2 slot '+(i-NSLOTS+1)));};
function wvClrSlot(i){wvSlotSet(i,null);setupHud();save();}
function wvPage(p){const v=wvi();const n=p==null?(v.pg?0:1):(p?1:0);if(P.morph){warn('Morphed: your form has its own bar');return;}v.pg=n;setupHud();wvHudPage();SFX.ui();}
/* ---- loadouts ---- */
function wvAutoBar(kind){const ws=P.known.map(id=>WEAVES[id]).filter(Boolean);const best={};for(const w of ws){if(wvReqMiss(w))continue;const k=w.line||w.id;if(!best[k]||w.tier>best[k].tier)best[k]=w;}
  const L=Object.values(best);const sc=w=>(w.mult||0)*(w.radius?1.3:1)+(w.lvl||1)*0.01;const by=f=>L.filter(w=>f.includes(wvFam(w))).sort((a,b)=>sc(b)-sc(a)||b.lvl-a.lvl);
  const order=kind==='atk'?by(['nuke','aoe','dot']).concat(by(['debuff','cc','heal'])):kind==='buf'?by(['self','team']).concat(by(['heal','pet','util'])):by(['debuff','cc','dot']).concat(by(['nuke','aoe']));
  const ids=[...new Set(order.map(w=>w.id))];const s1=ids.slice(0,NSLOTS),s2=ids.slice(NSLOTS,NSLOTS*2);while(s1.length<NSLOTS)s1.push(null);while(s2.length<NSLOTS)s2.push(null);return {s1,s2};}
function wvLoSwitch(i){const v=wvi(),lo=v.lo[i];if(!lo)return false;if(P.morph){warn('Can\'t swap loadouts while morphed');return false;}
  if(lo.s1==null||lo.auto&&!lo.s1.some(Boolean)){const a=wvAutoBar(lo.auto||'atk');lo.s1=a.s1;lo.s2=a.s2;}
  const ok=id=>id&&(P.known.includes(id)||perkAbOk(P,id))?id:null;P.slots=lo.s1.slice(0,NSLOTS).map(ok);while(P.slots.length<NSLOTS)P.slots.push(null);v.s2=(lo.s2||[]).slice(0,NSLOTS).map(ok);while(v.s2.length<NSLOTS)v.s2.push(null);
  v.cur=i;v.pg=0;setupHud();wvHudPage();save();toast(lo.ic+' Loadout: '+lo.n);SFX.ui();if(panelOpen==='book')openBook();return true;}
function wvLoSave(i){const v=wvi(),lo=v.lo[i];if(!lo)return false;lo.s1=P.slots.slice(0,NSLOTS);lo.s2=v.s2.slice();lo.auto=null;v.cur=i;save();toast('💾 Saved your bars to '+lo.n);return true;}
function wvLoNew(name){const v=wvi();if(v.lo.length>=WV_LO_MAX){warn('Up to '+WV_LO_MAX+' loadouts');return false;}const n=String(name||'Custom '+(v.lo.length+1)).replace(/[<>]/g,'').trim().slice(0,18)||'Custom';
  v.lo.push({n,ic:'🗂',s1:P.slots.slice(0,NSLOTS),s2:v.s2.slice(),auto:null});v.cur=v.lo.length-1;save();toast('🗂 New loadout: '+n);return true;}
function wvLoDel(i){const v=wvi();if(v.lo.length<=1){warn('Keep at least one loadout');return false;}v.lo.splice(i,1);if(v.cur>=v.lo.length||v.cur===i)v.cur=0;else if(v.cur>i)v.cur--;save();return true;}
function wvLoRen(i,name){const lo=wvi().lo[i];if(!lo)return false;const n=String(name||'').replace(/[<>]/g,'').trim().slice(0,18);if(!n)return false;lo.n=n;save();return true;}
function wvLoCycle(){const v=wvi();return wvLoSwitch((v.cur+1)%v.lo.length);}
/* ---- casting hooks ---- */
let wvPend=null;
{const _ua=useAbility;useAbility=function(idx){let ab=null;
  if(idx>=0&&!P.dead&&state==='play'){ab=abDef(barIds()[idx]);const synced=!!ab&&!ab.starter&&effLvP()<P.level&&abLv(ab)>effLvP();if(ab&&WEAVES[ab.id]&&!synced){const m=wvReqMiss(ab);if(m){warn('🔒 '+ab.name+': '+wvMissTxt(m)+' to cast');return false;}
    if(wvIsBuff(ab)&&(P.cds[ab.id]||0)<=T&&P.en>=ab.cost){const need=mxNeed(ab);if(need>0){if(!SIMP){warn('◇ Matrix full: '+ab.name+' needs '+wvMx(ab)+' (free '+Math.max(0,mxCap()-mxUsed(ab))+')');wvPend={idx,pg:wvi().pg,id:ab.id};openMatrix();}return false;}}}}
  const r=_ua(idx);if(r&&ab&&wvIsBuff(ab))wvSupersede(ab);return r;};}
function wvSupersede(w){const before=P.buffs.length;P.buffs=P.buffs.filter(b=>{const x=wvOfBuff(b);return !x||x.line!==w.line||x.id===w.id||(b.id===w.line&&x.name===w.name);});if(P.buffs.length!==before)calcStats();}
function wvDropBuff(id){const i=P.buffs.findIndex(b=>b.id===id);if(i<0)return false;const b=P.buffs[i];P.buffs.splice(i,1);calcStats();log('<span style="opacity:.8">'+b.icon+' '+esc(b.name)+' dropped from your Matrix</span>');save();return true;}
function openMatrix(){const used=mxUsed(),cap=mxCap();const rows=P.buffs.filter(b=>b.until>T&&wvOfBuff(b)).map(b=>{const w=wvOfBuff(b);return `<div class="slot"><span class="ico">${b.icon}</span><span style="flex:1"><div class="nm">${esc(b.name)}</div><div class="st">◇ ${wvMx(w)} Matrix · ${fmtT(b.until-T)} left</div></span><button class="sbtn alt" data-act="wvdrop" data-b="${esc(b.id)}">Drop</button></div>`;}).join('');
  const pw=wvPend&&WEAVES[wvPend.id];
  openPanel('◇ MATRIX',`${wvMxBar()}${pw?`<div class="capmsg">To run <b>${esc(pw.name)}</b> (◇ ${wvMx(pw)}) drop a running buff below; it is cast straight after.</div>`:''}<div class="h4" style="margin-top:8px">Running buffs</div>${rows||'<div style="opacity:.6">No buff Weaves running.</div>'}<div class="st" style="opacity:.7;margin-top:8px">Your Matrix holds running buff Weaves. It grows with your level, installed implants (higher QL holds more), headgear and gear with a Matrix bonus. A higher rank of a buff replaces the lower one.</div>`,'matrix');}
function wvMxBar(){const u=mxUsed(),c=mxCap();const f=Math.min(1,c?u/c:0);return `<div class="wvmx" title="Matrix: running buff Weaves"><span>◇ Matrix</span><span class="wvmxb"><i style="width:${Math.round(f*100)}%;background:${f>0.9?'#ff8a5a':'#5ff2ff'}"></i></span><b>${u} / ${c}</b></div>`;}
/* ---- team casting (AI teammates) ---- */
function wvAllyBoost(w){const m=w.kind==='teambuff'?tmodsAt(w.tmods,P.level,1):(w.buff?w.buff.mods(P.level):{});let s=0;for(const k in m)if(m[k]>0&&k!=='hp'&&k!=='dr'&&k!=='run'&&k!=='spd')s+=m[k];
  const mul=w.ally!=null?w.ally:Math.min(0.25,Math.round((0.04+s/(60+6*P.level))*100)/100);const dr=w.allyDr!=null?w.allyDr:Math.min(0.2,(m.dr||0)/100);return {mul,dr};}
function wvTeamCast(wid){const w=WEAVES[wid];if(!w||!P.known.includes(wid)||!wvIsBuff(w))return 0;if(P.dead||state!=='play')return 0;const m=wvReqMiss(w);if(m){warn('🔒 '+w.name+': '+wvMissTxt(m)+' to cast');return 0;}
  const L=comps().filter(a=>!a.dead&&dist2D(a.pos,P.pos)<=30);if(!L.length){warn('No AI teammates nearby (within 30m)');return 0;}
  if((P.cds[w.id]||0)>T){warn(w.name+' is recharging');return 0;}if(P.en<w.cost){warn('Not enough Vyre energy');return 0;}
  P.en-=w.cost;P.cds[w.id]=T+w.cd;const B=wvAllyBoost(w),dur=w.kind==='teambuff'?w.dur:w.buff.dur;
  for(const a of L){tbSet(a,'wv_'+w.line,T+dur,1+B.mul,B.dr);ringFx(a.pos.x,a.pos.z,0xffd76a,1.4,0.5);}
  SFX.heal();toast(w.icon+' '+w.name+' on '+L.length+' teammate'+(L.length>1?'s':'')+': +'+Math.round(B.mul*100)+'% damage'+(B.dr?' · '+Math.round(B.dr*100)+'% less damage taken':''));return L.length;}
/* ---- where to get a disc (W1: existing sources; W3 adds the full source table) ---- */
function wvWhere(w){if(w.src)return w.src;if(w.excl)return 'Only from '+dunName(w.excl);if(w.rare)return 'Ultra-rare drop from tough enemies';if(w.starter)return 'Known from the start';
  const a=Math.max(1,w.lvl-4),b=w.lvl+2;return 'Drops from enemies level '+a+'-'+b+' (tougher foes more often), trader stock and mission rewards';}
/* ---- HUD: page chip, loadout button + popover ---- */
function wvHudPage(){const b=$('#bPg');if(!b)return;const v=P.wv;const pg=v&&v.pg?2:1;b.querySelector('.ic').textContent=pg;b.classList.toggle('p2',pg===2);b.classList.toggle('hidden',!!P.morph||state!=='play');
  const l=$('#bLo');if(l){const lo=v&&v.lo&&v.lo[v.cur];l.querySelector('.ic').textContent=lo?lo.ic:'🗂';l.title='Loadout: '+(lo?lo.n:'')+' (V)';l.classList.toggle('hidden',!!P.morph||state!=='play');}}
function wvLoPop(open){const p=$('#loPop');if(!p)return;const on=open==null?p.classList.contains('hidden'):open;if(!on){p.classList.add('hidden');return;}const v=wvi();
  p.innerHTML=v.lo.map((lo,i)=>`<button class="lochip${i===v.cur?' on':''}" data-lo="${i}"><span>${lo.ic}</span>${esc(lo.n)}</button>`).join('')+'<button class="lochip alt" data-lo="book">📖 Edit</button>';p.classList.remove('hidden');}
function wvHudInit(){const pg=$('#bPg'),lo=$('#bLo'),pop=$('#loPop');if(!pg||pg.dataset.init)return;pg.dataset.init=1;
  let sx=null;pg.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();audioInit();sx=e.clientX;pg.classList.add('press');});
  pg.addEventListener('pointerup',e=>{pg.classList.remove('press');if(sx==null)return;sx=null;wvPage();});pg.addEventListener('pointercancel',()=>{sx=null;pg.classList.remove('press');});
  lo.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();audioInit();wvLoPop();});
  pop.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const b=e.target.closest('[data-lo]');if(!b)return;wvLoPop(false);if(b.dataset.lo==='book'){bookSel=null;openBook();}else wvLoSwitch(+b.dataset.lo);});
  // swipe beside the action buttons (starts in the button zone but not on a button) or on the page chip flips pages
  let sw=null;addEventListener('pointerdown',e=>{if(state!=='play'||panelOpen||e.pointerType==='mouse')return;const t=e.target;if(t.closest&&t.closest('#b0,#b1,#b2,#b3,#b4,#b5,#bAtk,#quick,#bQuick,#topbtns,#loPop,#bLo'))return;if(t.closest&&t.closest('#bPg')||inAbZone(e.clientX,e.clientY))sw={x:e.clientX,y:e.clientY,t:performance.now()};},{capture:true,passive:true});
  addEventListener('pointerup',e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y,dt=performance.now()-sw.t;sw=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.5&&dt<700){wvPage(dx<0?1:0);}},{capture:true,passive:true});
  addEventListener('pointerdown',e=>{const p=$('#loPop');if(p&&!p.classList.contains('hidden')&&!(e.target.closest&&e.target.closest('#loPop,#bLo')))p.classList.add('hidden');},{capture:true,passive:true});}
function wvHudLock(el,w){const m=w&&WEAVES[w.id]?wvReqMiss(w):null;el.classList.toggle('wlock',!!m);}
/* ---- Weave Book ---- */
let wvFilt='all';
openBook=function(){const pr=PROFS[P.prof],v=wvi();
  const slotBtn=i=>{const id=wvSlotGet(i),w=abDef(id);const m=w&&WEAVES[w.id]?wvReqMiss(w):null;return `<button class="wslot${bookSel?' pick':''}${m?' wlock':''}" data-act="slot" data-i="${i}"><span class="n">${i<NSLOTS?i+1:'²'+(i-NSLOTS+1)}</span><span class="ic">${w?w.icon:'＋'}</span><span class="wn">${w?esc(w.name):'Empty'}</span>${w?`<span class="x" data-act="clrslot" data-i="${i}">✕</span>`:''}</button>`;};
  const p1=[0,1,2,3,4,5].map(slotBtn).join(''),p2=[6,7,8,9,10,11].map(slotBtn).join('');
  const los=v.lo.map((lo,i)=>`<span class="wvlo${i===v.cur?' on':''}"><button class="lochip${i===v.cur?' on':''}" data-act="wvlo" data-i="${i}">${lo.ic} ${esc(lo.n)}${lo.auto&&!(lo.s1||[]).some(Boolean)?' <i style="opacity:.6">auto</i>':''}</button><button class="lomini" data-act="wvlosave" data-i="${i}" title="Save your current bars to ${esc(lo.n)}">💾</button><button class="lomini" data-act="wvloren" data-i="${i}" title="Rename">✎</button>${v.lo.length>1?`<button class="lomini" data-act="wvlodel" data-i="${i}" title="Delete">✕</button>`:''}</span>`).join('')+(v.lo.length<WV_LO_MAX?'<button class="lochip alt" data-act="wvlonew">＋ New from current bars</button>':'');
  const mine=Object.values(WEAVES).filter(w=>w.prof===P.prof||w.prof==='any');const famsHere=new Set(mine.map(wvFam).concat(P.known.map(id=>WEAVES[id]).filter(Boolean).map(wvFam)));
  const chips=WV_FAMS.filter(f=>f[0]==='all'||famsHere.has(f[0])).map(f=>`<button class="wvfam${wvFilt===f[0]?' on':''}" data-act="wvfam" data-f="${f[0]}">${f[2]} ${f[1]}</button>`).join('');
  const inF=w=>wvFilt==='all'||wvFam(w)===wvFilt;
  const known=P.known.map(id=>WEAVES[id]).filter(Boolean).sort((a,b)=>a.line<b.line?-1:a.line>b.line?1:a.tier-b.tier);
  const bestU={};for(const w of known){if(wvReqMiss(w))continue;const k=w.line||w.id;if(!bestU[k]||w.tier>bestU[k].tier)bestU[k]=w;}
  const tm=comps().filter(a=>!a.dead).length;
  const krow=w=>{const best=knownBest(w.line);const sup=best&&best.tier>w.tier;const sl=wvSlotIdx(w.id);const m=wvReqMiss(w);const isBest=bestU[w.line||w.id]===w&&!m;const f=WV_FAMN[wvFam(w)];
    return `<button class="item${bookSel===w.id?' sel':''}${sup?' sup':''}${isBest?' wbest':''}${m?' wlock':''}" data-act="bsel" data-w="${w.id}"><span class="ico">${w.icon}</span><span style="min-width:0;flex:1"><div class="nm">${esc(w.name)} <span class="tag wf">${f[2]} ${f[1]}</span>${isBest?'<span class="tag wb">★ best usable</span>':''}${wvIsBuff(w)?`<span class="tag b">◇ ${wvMx(w)}</span>`:''}${w.prof==='any'?'<span class="tag g">GENERIC</span>':''}</div><div class="st">${esc(w.desc)}</div><div class="st" style="opacity:.6">${weaveStats(w)}${sup?' · superseded by '+esc(best.name):''}</div>${m?`<div class="st down">🔒 Can't cast: ${wvMissTxt(m)}</div>`:''}${wvIsBuff(w)&&tm?`<div class="st"><span class="sbtn alt wvtc" data-act="wvteam" data-w="${w.id}">👥 Cast on teammates</span></div>`:''}</span><span class="pr">${sl>=0?(sl<NSLOTS?'Slot '+(sl+1):'Page 2 · '+(sl-NSLOTS+1)):''}</span></button>`;};
  const disks=P.inv.filter(isDisk);
  const drow=d=>{const w=WEAVES[d.wid];const known=P.known.includes(w.id);const ok=reqMet(d)&&!known;const miss=!profOk(d)?profName(d.prof)+' only':known?'Already known':!tierOk(d)?tierMiss(d):(()=>{const m=(d.req||[]).find(r=>eff(r.s)<r.v);return m?'Need '+(m.v-eff(m.s))+' more '+STATN[m.s]:'';})();
    return `<div class="mis" style="border-color:${RAR[d.r].c}"><div style="display:flex;gap:10px;align-items:center"><span class="ico" style="font-size:24px">📀</span><div style="flex:1"><b style="color:${RAR[d.r].c}">${esc(w.name)}</b> <span style="opacity:.7;font-size:12px">${profName(w.prof)} · tier level ${w.lvl} · ${WV_FAMN[wvFam(w)][1]}</span><div class="st" style="font-size:13px">${esc(w.desc)} <span style="opacity:.6">(${weaveStats(w)})</span></div></div></div>
      <div class="h4" style="margin:6px 0 2px">Requirements to learn and cast (your current skills, including buffs)</div>${reqHtml(d)}
      <div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="sbtn${ok?'':' locked'}" data-act="learn" data-id="${d.id}">Learn</button>${ok?'<span class="up">Ready to learn</span>':`<span class="down"><b>${miss}</b></span>`}</div></div>`;};
  const inBank=new Set(((typeof loadBank==='function'?loadBank():null)||{items:[]}).items.filter(x=>x&&x.kind==='disk').map(x=>x.wid));const inPack=new Set(disks.map(x=>x.wid));
  const toFind=mine.filter(w=>!w.starter&&!P.known.includes(w.id)&&inF(w)).sort((a,b)=>((inBank.has(b.id)||inPack.has(b.id))-(inBank.has(a.id)||inPack.has(a.id)))||a.lvl-b.lvl);
  const nBank=toFind.filter(w=>inBank.has(w.id)).length;const kF=known.filter(inF);
  const html=`${wvMxBar()}<div class="h4" style="margin-top:6px">🗂 Loadouts <span style="opacity:.6;font-weight:400">· tap to switch (or 🗂 on the HUD, key V) · 💾 saves your current bars into it</span></div><div class="wvlos">${los}</div>
  <div class="h4">Action bar ${bookSel?'· <span style="color:#5ff2ff">tap a slot to place '+esc((abDef(bookSel)||{}).name||'')+'</span>':'· tap a Weave below, then a slot'}</div><div class="wslots">${p1}</div><div class="h4" style="margin-top:4px">Page 2 <span style="opacity:.6;font-weight:400">· swipe beside the buttons, tap the page chip or press \` to flip</span></div><div class="wslots">${p2}</div>
  <div class="wvfams">${chips}</div>
  <div class="cols" style="margin-top:8px"><div><div class="h4">Known Weaves (${kF.length}${wvFilt==='all'?'':' of '+known.length})</div>${kF.map(krow).join('')||'<div style="opacity:.6">None in this family yet.</div>'}</div>
  <div><div class="h4">Weave Disks in your pack (${disks.length})</div>${disks.map(drow).join('')||'<div style="opacity:.6;margin-bottom:8px">No disks. Enemies (tougher ones drop better), the trader and mission rewards have them.</div>'}
  <div class="h4" style="margin-top:12px">Still to find (${pr.name} + generic)${nBank?` · <span style="color:#ffd34a">${nBank} disc${nBank>1?'s':''} waiting in your bank</span>`:''}</div>${toFind.map(w=>`<div class="slot${inBank.has(w.id)?' inbank':''}" data-wid="${w.id}"${inBank.has(w.id)?' data-bank="1"':''} style="opacity:${inBank.has(w.id)||inPack.has(w.id)?1:.75}${inBank.has(w.id)?';border-color:#ffd34a':''}"><span class="ico">${w.icon}</span><span style="flex:1"><div class="nm">${esc(w.name)} <span style="opacity:.6;font-size:11px">· level ${diskLvlReq(w)}+ · ${WV_FAMN[wvFam(w)][2]} ${WV_FAMN[wvFam(w)][1]}</span>${inBank.has(w.id)?' <span class="tag bankd" style="background:#ffd34a;color:#2a1a00">📦 Disc in bank - collect to learn</span>':inPack.has(w.id)?' <span class="tag bankd" style="background:#6dff8a;color:#062a10">📀 Disc in your pack - learn it above</span>':''}${w.excl?' <span class="tag l">'+esc(dunName(w.excl))+' only</span>':''}${w.rare?' <span class="tag m">ULTRA-RARE DROP</span>':''}</div><div class="st">${esc(w.desc)}</div><div class="st wvwh">📍 ${esc(wvWhere(w))}</div><div class="rqs">${w.req.map(r=>`<span class="rq ${eff(r.s)>=r.v?'ok':'no'}">${SHORT[r.s]} ${r.v}</span>`).join('')}</div></span></div>`).join('')}</div></div>`;
  openPanel('📖 WEAVE BOOK · '+pr.name.toUpperCase(),html,'book');};
function wvAct(a,b){const D=b.dataset;
  if(a==='wvfam'){wvFilt=WV_FAMN[D.f]?D.f:'all';openBook();return true;}
  if(a==='wvlo'){wvLoSwitch(+D.i);openBook();return true;}
  if(a==='wvlosave'){wvLoSave(+D.i);openBook();return true;}
  if(a==='wvlonew'){let n=null;try{n=prompt('Name the new loadout','Custom '+(wvi().lo.length+1));}catch(e){}if(n===null)n='';wvLoNew(n);openBook();return true;}
  if(a==='wvloren'){const lo=wvi().lo[+D.i];let n=null;try{n=prompt('Rename loadout',lo?lo.n:'');}catch(e){}if(n)wvLoRen(+D.i,n);openBook();return true;}
  if(a==='wvlodel'){const lo=wvi().lo[+D.i];let ok=true;try{ok=confirm('Delete loadout '+(lo?lo.n:'')+'?');}catch(e){}if(ok)wvLoDel(+D.i);openBook();return true;}
  if(a==='wvteam'){wvTeamCast(D.w);openBook();return true;}
  if(a==='wvdrop'){wvDropBuff(D.b);const p=wvPend;wvPend=null;if(p&&WEAVES[p.id]){const v=wvi(),pg=v.pg;v.pg=p.pg;const ids=barIds();const i=ids.indexOf(p.id);if(i>=0&&mxNeed(WEAVES[p.id])<=0){closePanel();useAbility(i);}v.pg=pg;setupHud();if(panelOpen==='matrix')openMatrix();}else openMatrix();return true;}
  if(a==='matrix'){openMatrix();return true;}
  return false;}
function wvExports(){return {WV_FAMS,wvFam,wvMx,mxCapFor,mxUsed,mxCap,mxNeed,normWv,wvFields,wvi,wvReqMiss,wvSlotGet,wvSlotSet,wvSlotIdx,wvPage,wvAutoBar,wvLoSwitch,wvLoSave,wvLoNew,wvLoDel,wvLoRen,wvLoCycle,wvSupersede,wvDropBuff,openMatrix,wvTeamCast,wvAllyBoost,wvWhere,wvOfBuff,wvLoPop,get wvFilt(){return wvFilt;},set wvFilt(v){wvFilt=v;},get wvPend(){return wvPend;}};}
