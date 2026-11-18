/* ================= BUILD F: PERKS =================
   Perk points: 1 per level from level 10 (Lv 10 = 1 ... Lv 30 = 21; keeps going if the cap rises). Points are DERIVED from
   level (ppTotal) minus ranks spent, so existing characters get theirs retroactively and P.pp is only a mirror for old readers.
   Lines: 3 general lines (everyone) + 1 line per profession. Each line = a 5-rank perk, a 3-rank perk (needs 2 points in the
   line) and a 1-rank ACTIVE perk (needs 4 points in the line + Lv 15) that goes on the action bar like a Weave.
   Ranks feed statsFor through the existing PERKS registry: {name, ranks, mods:(rank,c)=>({stat:val})}.
   Reset: first one free, then 25¢ x level and a 30 minute (real time) cooldown. Saved per character: perks{id:rank},
   perkMeta{resets,next,intro} (in the sheet, so export/import carries it). */
var PERK_LINES={
  grit:{n:'Frontier Grit',ic:'🪨',d:'Toughness and staying power.'},
  dust:{n:'Dustrunner',ic:'👟',d:'Speed, evasion and a sharp eye.'},
  well:{n:'Deep Well',ic:'💧',d:'Vyre energy and focus.'},
  ironclad:{n:'Ironclad Doctrine',ic:'🧱',prof:'vanguard',d:'Vanguard: armour discipline and heavy firepower.'},
  hexcraft:{n:'Hexcraft',ic:'🧵',prof:'weaver',d:'Vyreweaver: sharper hexes and stronger weaves.'},
  surgery:{n:'Field Surgery',ic:'🩹',prof:'mender',d:'Mender: faster, bigger heals.'},
  overload:{n:'Overload',ic:'🔥',prof:'flux',d:'Fluxwright: raw damage and arc crits.'},
  ghost:{n:'Ghoststep',ic:'🌫️',prof:'runner',d:'Glintrunner: evasion and precision.'},
  forge:{n:'Fabricator\'s Edge',ic:'⚙️',prof:'wright',d:'Dronewright: tuned servos and plating.'},
  primal:{n:'Primal Bond',ic:'🐾',prof:'wild',d:'Wildshifter: hide, instinct and the pack.'}};
var PERK_AB={};
(function(){const L=c=>(c&&c.level)||1,R=Math.round;
  const def=(id,line,tier,name,icon,ranks,mods,txt,ab)=>{PERKS[id]={id,line,tier,name,icon,ranks,mods,txt,ab:ab?'pk_'+id:null};
    if(ab){ab.id='pk_'+id;ab.name=name;ab.icon=icon;ab.perk=id;ab.prof='perk';ab.line='pk_'+id;ab.tier=1;ab.req=[];PERK_AB[ab.id]=ab;}};
  // general
  def('thickhide','grit',1,'Thick Hide','🪨',5,(r,c)=>({hp:R(r*(8+L(c)*1.5)),dr:r}),'+{hp} max health, +{dr}% damage reduction');
  def('secondwind','grit',2,'Second Wind','💨',3,r=>({sta:2*r,body:4*r}),'+{sta} Stamina, +{body} Body Development');
  def('laststand','grit',3,'Last Stand','🛡️',1,()=>({}),'Active: heal 30% of max health and take 50% less damage for 6s.',{kind:'heal',pct:0.3,dr:0.5,dur:6,cost:15,cd:120,range:0,needTarget:false,desc:'Perk: heal 30% and take 50% less damage for 6s.'});
  def('fleet','dust',1,'Fleet Footing','👟',4,r=>({spd:3*r,evade:3*r}),'+{spd}% run speed, +{evade} Evasion');
  def('keen','dust',2,'Keen Eye','🎯',3,r=>({sen:2*r,crit:r}),'+{sen} Sense, +{crit}% crit');
  def('slipstream','dust',3,'Slipstream','🌪️',1,()=>({}),'Active: +35% run speed and +25 Evasion for 8s.',{buff:{dur:8,mods:()=>({spd:35,evade:25})},cost:10,cd:60,range:0,needTarget:false,desc:'Perk: +35% run speed, +25 Evasion for 8s.'});
  def('wellspring','well',1,'Wellspring','💧',5,(r,c)=>({en:R(r*(5+L(c))),pool:2*r}),'+{en} max energy, +{pool} Vyre Pool');
  def('focus','well',2,'Focused Mind','🧠',3,r=>({int:2*r,psy:2*r,power:r}),'+{int} Intelligence, +{psy} Psychic, +{power}% power');
  def('overcharge','well',3,'Overcharge','⚡',1,()=>({}),'Active: restore 35% of max energy.',{kind:'battery',pct:0.35,cost:0,cd:90,range:0,needTarget:false,desc:'Perk: restore 35% energy.'});
  // professions
  def('plated','ironclad',1,'Plated Discipline','🧱',5,(r,c)=>({dr:r,hp:R(r*(6+L(c)))}),'+{dr}% damage reduction, +{hp} max health');
  def('heavyhands','ironclad',2,'Heavy Hands','💪',3,r=>({wpn:3*r,str:2*r,power:r}),'+{wpn} Weapon Handling, +{str} Strength, +{power}% power');
  def('shrapnel','ironclad',3,'Shrapnel Storm','💣',1,()=>({}),'Active: blast every enemy within 7m for 220% damage.',{kind:'aoeSelf',radius:7,mult:2.2,color:0xffb347,cost:30,cd:40,range:0,needTarget:false,desc:'Perk: 220% damage to all enemies within 7m.'});
  def('threadwork','hexcraft',1,'Threadwork','🧵',5,r=>({weave:3*r,int:r}),'+{weave} Weave Craft, +{int} Intelligence');
  def('lingering','hexcraft',2,'Lingering Malice','🕸️',3,r=>({power:2*r,psy:2*r}),'+{power}% power, +{psy} Psychic');
  def('unravel','hexcraft',3,'Unravel','🌀',1,()=>({}),'Active: a 340% damage bolt that roots the target for 3s.',{kind:'nuke',mult:3.4,root:3,color:0xb46bff,cost:30,cd:35,range:24,needTarget:true,desc:'Perk: 340% damage + 3s root.'});
  def('steady','surgery',1,'Steady Hands','🩹',5,r=>({treat:3*r,sen:r}),'+{treat} Treatment, +{sen} Sense');
  def('triage','surgery',2,'Triage Instinct','❤️',3,(r,c)=>({hp:R(r*(5+L(c))),en:R(r*(3+L(c)/2))}),'+{hp} max health, +{en} max energy');
  def('pulse','surgery',3,'Mending Pulse','💚',1,()=>({}),'Active: heal 35% of max health (scales with Treatment).',{kind:'heal',pct:0.35,cost:25,cd:50,range:0,needTarget:false,desc:'Perk: big self-heal.'});
  def('volatile','overload',1,'Volatile Core','🔥',5,r=>({power:2*r}),'+{power}% power');
  def('arc','overload',2,'Arc Conduction','⚡',3,r=>({crit:r,weave:3*r}),'+{crit}% crit, +{weave} Weave Craft');
  def('flashover','overload',3,'Flashover','☄️',1,()=>({}),'Active: 260% damage in a 5m blast at your target.',{kind:'aoeT',radius:5,mult:2.6,color:0xff7a2a,cost:35,cd:35,range:24,needTarget:true,desc:'Perk: 260% area blast at the target.'});
  def('slip','ghost',1,'Slipstep','🌫️',5,r=>({evade:4*r,agi:r}),'+{evade} Evasion, +{agi} Agility');
  def('razor','ghost',2,'Razor Instinct','🗡️',3,r=>({crit:r,wpn:2*r}),'+{crit}% crit, +{wpn} Weapon Handling');
  def('flurry','ghost',3,'Phantom Flurry','✴️',1,()=>({}),'Active: six rapid shots for 70% damage each.',{kind:'rattle',shots:6,mult:0.7,color:0x9fe8ff,cost:20,cd:25,range:22,needTarget:true,desc:'Perk: 6 quick shots at 70%.'});
  def('servos','forge',1,'Overclocked Servos','⚙️',5,r=>({fab:3*r,int:r,power:r}),'+{fab} Fabrication, +{int} Intelligence, +{power}% power');
  def('plating','forge',2,'Field Plating','🔩',3,(r,c)=>({dr:r,hp:R(r*(5+L(c)))}),'+{dr}% damage reduction, +{hp} max health');
  def('scrap','forge',3,'Scrap Barrage','🧨',1,()=>({}),'Active: three waves of scrap rain on your target (90% each).',{kind:'barrage',radius:4,mult:0.9,delay:0.6,waves:3,gap:0.45,color:0xffb347,cost:30,cd:40,range:24,needTarget:true,desc:'Perk: 3 waves of 90% area damage.'});
  def('pelt','primal',1,'Thick Pelt','🐾',5,(r,c)=>({hp:R(r*(6+L(c))),sta:r}),'+{hp} max health, +{sta} Stamina');
  def('feral','primal',2,'Feral Instinct','🐺',3,r=>({agi:2*r,crit:r}),'+{agi} Agility, +{crit}% crit');
  def('howl','primal',3,'Howl of the Pack','🌕',1,()=>({}),'Active: +15% power, +6 Strength and Agility for 12s.',{buff:{dur:12,mods:()=>({power:15,str:6,agi:6})},cost:20,cd:90,range:0,needTarget:false,desc:'Perk: +15% power, +6 STR/AGI for 12s.'});
})();
const PERK_START=10,PERK_ACTIVE_LVL=15,PERK_RESET_CD=30*60*1000;
function ppTotal(lv){return Math.max(0,(lv|0)-PERK_START+1);}
function ppSpent(perks){let n=0;for(const id in perks||{})if(PERKS[id])n+=perks[id]|0;return n;}
function ppAvail(c){c=c||P;return Math.max(0,ppTotal(c.level)+(c.ppBonus|0)-ppSpent(c.perks));}
function lineMax(line){let n=0;for(const id in PERKS)if(PERKS[id].line===line)n+=PERKS[id].ranks;return n;}
function perkLinesFor(prof){return Object.keys(PERK_LINES).filter(k=>!PERK_LINES[k].prof||PERK_LINES[k].prof===prof);}
function linePts(perks,line){let n=0;for(const id in perks||{}){const p=PERKS[id];if(p&&p.line===line)n+=perks[id]|0;}return n;}
// level needed for rank r (1-based) of a perk
function perkLvl(p,r){return p.tier>=4?TIERS[p.tierReq||3].lv+(p.rstep||5)*(r-1):p.tier===3?PERK_ACTIVE_LVL:p.tier===2?12+2*(r-1):PERK_START+2*(r-1);}
function perkNeedLine(p){return p.tier>=4?(p.need||6):p.tier===3?4:p.tier===2?2:0;}
function perkCan(id,c){c=c||P;const p=PERKS[id];if(!p)return 'Unknown perk';const ln=PERK_LINES[p.line];if(ln.prof&&ln.prof!==c.prof)return 'Another profession\'s line';
  const r=(c.perks&&c.perks[id])|0;if(r>=p.ranks)return 'Max rank';if(p.tierReq&&tierOfLv(c.level)<p.tierReq)return 'Requires Tier '+p.tierReq+' ('+TIERS[p.tierReq].n+', level '+TIERS[p.tierReq].lv+')';if(c.level<perkLvl(p,r+1))return 'Needs level '+perkLvl(p,r+1);
  const need=perkNeedLine(p);if(linePts(c.perks,p.line)<need)return 'Needs '+need+' points in '+ln.n;if(ppAvail(c)<1)return 'No perk points';return '';}
function normPerks(perks,prof,level,bonus){const o={};if(!perks||typeof perks!=='object')return o;const lines=perkLinesFor(prof);
  for(const id in perks){const p=PERKS[id];const r=Math.floor(+perks[id]||0);if(!p||!lines.includes(p.line)||r<=0)continue;o[id]=Math.min(r,p.ranks);}
  if(ppSpent(o)>ppTotal(level)+(bonus|0))return {};return o;}
function normPerkMeta(m){m=m&&typeof m==='object'?m:{};return {resets:Math.max(0,m.resets|0),next:Math.max(0,+m.next||0),intro:!!m.intro};}
function perkMeta(){return P.perkMeta||(P.perkMeta=normPerkMeta(null));}
function perkFill(p,r,c){const m=p.mods(r,c);return p.txt.replace(/\{(\w+)\}/g,(_,k)=>m[k]!=null?m[k]:'?');}
function learnPerk(id){const why=perkCan(id);if(why){warn(why);return false;}P.perks=P.perks||{};P.perks[id]=(P.perks[id]|0)+1;P.pp=ppAvail();const p=PERKS[id];
  calcStats();SFX.quest();toast(p.icon+' '+p.name+(p.ranks>1?' rank '+P.perks[id]:' learned'));if(p.ab&&!P.slots.includes(p.ab)){const e=P.slots.findIndex(x=>!x);if(e>=0){P.slots[e]=p.ab;log(p.icon+' <b>'+esc(p.name)+'</b> added to action slot '+(e+1));}}setupHud();save();return true;}
function perkResetPrice(){const m=perkMeta();return m.resets===0?0:25*P.level;}
function perkResetWait(){return Math.max(0,perkMeta().next-Date.now());}
function resetPerks(){if(!ppSpent(P.perks)){warn('No perks to reset');return false;}const w=perkResetWait();if(w>0){warn('Perk reset recharging: '+Math.ceil(w/60000)+' min');return false;}
  const pr=perkResetPrice();if(P.credits<pr){warn('Not enough credits ('+pr+'¢)');return false;}P.credits-=pr;const m=perkMeta();m.resets++;m.next=Date.now()+PERK_RESET_CD;
  P.slots=P.slots.map(id=>id&&PERK_AB[id]?null:id);P.perks={};P.pp=ppAvail();calcStats();setupHud();save();SFX.coin();toast('Perks reset: '+ppAvail()+' points refunded'+(pr?' ('+pr+'¢)':''));return true;}
// action-bar slots: perk abilities are valid while the perk is learned
function perkAbOk(s,id){const a=PERK_AB[id];return !!(a&&s&&s.perks&&(s.perks[a.perk]|0)>0);}
function perkToSlot(id,i){const p=PERKS[id];if(!p||!p.ab||!(P.perks[id]>0))return false;const j=P.slots.indexOf(p.ab);if(j>=0)P.slots[j]=P.slots[i]||null;P.slots[i]=p.ab;setupHud();save();toast(p.name+' → slot '+(i+1));return true;}
/* ---------- Perks panel ---------- */
let perkTab=null,perkSel=null,perkConfirm=0;
function openPerks(){if(!perkTab||!perkLinesFor(P.prof).includes(perkTab))perkTab=perkLinesFor(P.prof).find(k=>PERK_LINES[k].prof)||'grit';
  const av=ppAvail(),tot=ppTotal(P.level)+(P.ppBonus|0),nextLv=P.level<PERK_START?PERK_START:P.level+1;
  let h=`<div class="pkhead"><div class="pkpts"><b>${av}</b><span>perk point${av===1?'':'s'}</span></div><div class="pkinfo">${tot} earned (1 per level from Lv ${PERK_START})${P.level<MAXLVL||nextLv===PERK_START?' · next at Lv '+nextLv:''}.<br><span style="opacity:.7">Active perks (Lv ${PERK_ACTIVE_LVL}+) go on your action bar.</span></div></div>`;
  h+='<div class="pktabs">'+perkLinesFor(P.prof).sort((a,b)=>(PERK_LINES[b].prof?1:0)-(PERK_LINES[a].prof?1:0)).map(k=>{const L=PERK_LINES[k],n=linePts(P.perks,k);return `<button class="pktab${k===perkTab?' on':''}${L.prof?' prof':''}" data-pk="tab" data-l="${k}"><span class="ic">${L.ic}</span><span class="tn">${esc(L.n)}</span><span class="tc">${n}/${lineMax(k)}</span></button>`;}).join('')+'</div>';
  const L=PERK_LINES[perkTab];h+=`<div class="pkld">${esc(L.d)}</div><div class="pklist">`;
  for(const id in PERKS){const p=PERKS[id];if(p.line!==perkTab)continue;const r=(P.perks[id]|0),why=perkCan(id),a=p.ab&&PERK_AB[p.ab];
    const pips=Array.from({length:p.ranks},(_,i)=>`<i class="${i<r?'on':''}"></i>`).join('');
    const now=r>0&&!a?`<div class="pknow">Now: ${perkFill(p,r,P)}</div>`:'';const nxt=r<p.ranks?`<div class="pknext">${a?'':'Rank '+(r+1)+': '}${a?esc(p.txt):perkFill(p,r+1,P)}</div>`:'';
    const req=r<p.ranks&&why&&why!=='No perk points'?`<div class="pkreq">🔒 ${esc(why)}</div>`:'';
    let act='';if(r<p.ranks)act=`<button class="sbtn pkbuy" data-pk="buy" data-id="${id}" ${why?'disabled':''}>${a?'Learn':'+1 rank'}</button>`;
    let slots='';if(a&&r>0){const at=P.slots.indexOf(p.ab);slots=`<div class="pkslots"><span>${at>=0?'On bar: slot '+(at+1):'Put on bar:'}</span>${P.slots.map((sid,i)=>{const w=abDef(sid);return `<button class="pks${sid===p.ab?' on':''}" data-pk="slot" data-id="${id}" data-i="${i}" title="Slot ${i+1}${w?': '+esc(w.name):''}">${w?w.icon:i+1}</button>`;}).join('')}</div>
      <div class="pkab">⏱ ${a.cd}s cooldown · ${a.cost} energy${a.range?' · '+a.range+'m':''}</div>`;}
    h+=`<div class="pkcard${r>=p.ranks?' max':''}${a?' active':''}"><div class="pkic">${p.icon}</div><div class="pkbody"><div class="pkn"><b>${esc(p.name)}</b>${a?'<span class="pktag">ACTIVE</span>':''}<span class="pkpips">${pips}</span></div>${now}${nxt}${req}${slots}</div>${act}</div>`;}
  h+='</div>';const sp=ppSpent(P.perks),w=perkResetWait(),pr=perkResetPrice();
  h+=`<div class="pkfoot"><button class="sbtn alt" data-pk="reset" ${!sp||w>0?'disabled':''}>${perkConfirm>performance.now()?'Tap again to reset all perks':'↺ Reset all perks'}</button><span>${!sp?'Nothing to reset.':w>0?'Reset recharging: '+Math.ceil(w/60000)+' min':(pr?'Costs '+pr+'¢':'First reset is free')+' · refunds '+(sp===1?'your 1 point':'all '+sp+' points')+' · then a 30 min cooldown'}</span></div>`;
  openPanel('PERKS · '+PROFS[P.prof].name.toUpperCase(),h,'perks');}
pbody.addEventListener('click',e=>{const b=e.target.closest('[data-pk]');if(!b||b.disabled||panelOpen!=='perks')return;const a=b.dataset.pk;SFX.ui();
  if(a==='tab'){perkTab=b.dataset.l;perkConfirm=0;openPerks();}
  else if(a==='buy'){learnPerk(b.dataset.id);openPerks();}
  else if(a==='slot'){perkToSlot(b.dataset.id,+b.dataset.i);openPerks();}
  else if(a==='reset'){if(perkConfirm>performance.now()){perkConfirm=0;resetPerks();}else perkConfirm=performance.now()+4000;openPerks();}});
function perkBadges(){const n=ppAvail();const b=$('#bPerks');if(b){b.classList.toggle('pts',n>0);$('#ppBadge').textContent=n>0?n:'';}
  const m=perkMeta();if(state==='play'&&!m.intro&&n>0){m.intro=true;log('⭐ <b>Perks unlocked:</b> you have '+n+' perk point'+(n>1?'s':'')+' from your level. Open ⋯ → ⭐ Perks (P).');toast('⭐ '+n+' perk point'+(n>1?'s':'')+' to spend');save();}}
function perksInit(){btn('#bPerks',()=>{if(panelOpen==='perks')closePanel();else openPerks();});}
function perkExports(){return {normalizeChar,sheetFromPlayer,gainXp,xpNeed,PERKS,PERK_LINES,PERK_AB,ppTotal,ppSpent,ppAvail,perkCan,learnPerk,resetPerks,perkToSlot,openPerks,normPerks,perkLinesFor,perkResetPrice,perkResetWait,perkMeta,PERK_RESET_CD};}
