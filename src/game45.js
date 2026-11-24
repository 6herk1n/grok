/* ================= SYMBIANTS & POCKET BOSSES (2026-11-23, Claude; AO-inspired, own names) =================
   - Pattern pieces: any kill of an enemy Lv 8+ can drop a piece (parts bag kind 'pat', mt '<boss>:<A-D>', ql = band level).
     Chance 1.2% (elite/rare 8%, dungeon boss 25%, more on hard-mode tiers). The piece belongs to the pocket boss of the
     enemy's 10-level band (Lv 8-19 -> 10, 20-29 -> 20, ... 100). Pieces stack and bank like parts.
   - Assemble the four pieces (Root, Thread, Crown, Heart) in the 🧩 Symbiants panel (⋯ menu) into a pattern ('<boss>:P').
   - Echo Shrines stand beside the bank terminal of each band's hub (same gate/level rules as that bank). At a shrine,
     Summon uses the pattern and calls the pocket boss: a solo elite of the band level. Kill it for a symbiant.
   - Symbiants are implants (kind 'imp', so install/bank/tooltips/stats all work) with it.sym = line: 4 line stats at about
     1.3x an Epic implant of the same QL plus one special (crit/hp/en/power), Epic rarity, QL = band x 5 (so the implant tier
     rule gates them by level), and only an attribute requirement (no Treatment). 60% chance of your profession's line.
   - Character state P.sym (v1): {kills:{boss:n}, made:n, sum:n}, saved through symFields() in futureFields.
   - Hooks: killEnemy (piece drops), stage3Interact/stage3Do (shrines), updBanks (shrine visibility, boss tracking),
     rrMini (minimap ◈), stage3Act (panel buttons). __dr: SYM, POCKETS, symGive, symSummon, symAssemble, openSym, symOnKill. */
const SYM_VER=1;
const SYM_PIECES={A:'Root',B:'Thread',C:'Crown',D:'Heart'};
const SYM_LINES={striker:{n:'Striker',ic:'🎯',stats:['wpn','str','agi','sen'],sp:'crit'},bulwark:{n:'Bulwark',ic:'🛡',stats:['body','sta','str','treat'],sp:'hp'},
  conduit:{n:'Conduit',ic:'🔮',stats:['weave','int','psy','pool'],sp:'en'},mender:{n:'Mender',ic:'✚',stats:['treat','psy','int','body'],sp:'hp'},
  stalker:{n:'Stalker',ic:'🗡',stats:['agi','sen','wpn','run'],sp:'power'}};
const SYM_ROLE={tank:'bulwark',healer:'mender',control:'conduit',pet:'conduit',support:'conduit',dps:null};
// hp/dmg: elite multipliers tuned by a 14-profession sim sweep (2026-11-23) to ~85 s and ~1x max health taken at the band level in Uncommon gear
const POCKETS=[
  {id:'hesk',hp:18,dmg:0.85,n:'Rustmother Hesk',lv:10,bank:'cinderwell',t:'mauler',col:0x8a5a3a,glow:0xffa040},
  {id:'veyl',hp:31,dmg:1.4,n:'Veyl of the Dusk',lv:20,bank:'farwatch',t:'stalker',col:0x4a3a6a,glow:0xb46bff},
  {id:'oskar',hp:10,dmg:2.0,n:'Oskar Frostmantle',lv:30,bank:'hoarlight',t:'shambler',col:0xc8dcec,glow:0x9fe8ff},
  {id:'murra',hp:10,dmg:2.3,n:'Murra the Drowned',lv:40,bank:'lanternmoor',t:'bloatmaw',col:0x3a5a3a,glow:0x9fff7a},
  {id:'cael',hp:9.6,dmg:2.5,n:'Cael Ashenward',lv:50,bank:'sunderwatch',t:'shardgolem',col:0x5a2a1a,glow:0xff6a3a},
  {id:'patrin',hp:8.2,dmg:2.7,n:'Patrin Coilheart',lv:60,bank:'patina',t:'oxidebrute',col:0x4a6e64,glow:0x4affd2},
  {id:'sorrel',hp:6.4,dmg:3.2,n:'Sorrel Thornmother',lv:70,bank:'briarwatch',t:'bloomhulk',col:0x5a3a4a,glow:0xff5ab4},
  {id:'tamsin',hp:4.6,dmg:3.1,n:'Tamsin Stormcaller',lv:80,bank:'galehold',t:'thunderhulk',col:0x4a5060,glow:0x7ad8ff},
  {id:'ossian',hp:3.9,dmg:3.3,n:'Ossian Bonelight',lv:90,bank:'sunhollow',t:'ossuarch',col:0xb8a888,glow:0xffd86a},
  {id:'nihl',hp:3.3,dmg:3.4,n:'Nihl the Unlit',lv:100,bank:'lastlight',t:'scarbehemoth',col:0x2a2236,glow:0xb46aff}].filter(p=>ETYPES[p.t]||(p.t='brute'));
const POCKET=Object.fromEntries(POCKETS.map(p=>[p.id,p]));
const SYM={live:null,shrines:[],tab:'pat'};
function symi(){const s=P.sym||(P.sym={});s.v=SYM_VER;s.kills=s.kills||{};s.got=s.got||{};s.made=s.made|0;s.sum=s.sum|0;return s;}
function normSym(o){o=o&&typeof o==='object'?o:{};const k={};for(const id in o.kills||{})if(POCKET[id])k[id]=Math.max(0,o.kills[id]|0);const got={};for(const g in o.got||{}){const [l,sl]=g.split('|');if(SYM_LINES[l]&&IMPSLOTS.includes(sl))got[g]=1;}
  return {v:SYM_VER,kills:k,made:Math.max(0,o.made|0),sum:Math.max(0,o.sum|0),got};}
function symFields(s){return {sym:normSym(s.sym)};}
function symBand(lv){return clamp(Math.floor(lv/10)*10,10,100);}
function patName(o){const[id,k]=String(o.mt||'').split(':');const p=POCKET[id];if(!p)return 'Pattern piece';return k==='P'?'Pattern of '+p.n:p.n.split(' ')[0]+'\'s '+(SYM_PIECES[k]||'Piece');}
function patIco(o){return String(o.mt||'').endsWith(':P')?'🧩':'🔸';}
function patCount(id,k){const o=bag().find(x=>x.kind==='pat'&&x.mt===id+':'+k);return o?o.n:0;}
function patTake(id,k){const o=bag().find(x=>x.kind==='pat'&&x.mt===id+':'+k);return !!o&&bagTake(o.id,1);}
/* ---------- drops ---------- */
function symOnKill(e){if(SIMP||SIMST||!e||!P||!e.lv||e.lv<8||e.ally||e.vg||e.guard||e.isShard)return;
  if(e.pocket)return;let ch=e.boss?0.25:(e.elite||e.rare)?0.08:0.012;
  if(typeof DUN!=='undefined'&&DUN&&DUN.mode&&DUN.mode.hm)ch*=1+0.25*(DUN.mode.hm.tier|0);
  if(Math.random()>=ch)return;const p=POCKETS.find(q=>q.lv===symBand(e.lv));if(!p)return;const k=pick(Object.keys(SYM_PIECES));
  bagAdd({kind:'pat',mt:p.id+':'+k,ql:p.lv},1);const have=Object.keys(SYM_PIECES).filter(x=>patCount(p.id,x)>0).length;
  log('🔸 <b>Pattern piece</b>: '+esc(patName({mt:p.id+':'+k}))+' ('+have+'/4 kinds for '+esc(p.n)+'). ⋯ menu › 🧩 Symbiants.');toast('🔸 '+patName({mt:p.id+':'+k}));save();}
const _killEnemySym=killEnemy;
killEnemy=function(e){const was=e&&e.dead;_killEnemySym(e);if(e&&!was&&e.dead)try{symOnKill(e);}catch(x){}};
/* ---------- symbiant items ---------- */
function symLineFor(prof){const r=(typeof ROLE!=='undefined'&&ROLE[prof])||'dps';const l=SYM_ROLE[r];if(l)return l;return prof==='runner'||prof==='shade'?'stalker':PROFS[prof]&&PROFS[prof].dmgSkill==='weave'?'conduit':'striker';}
function symGive(lv,line,slot){slot=slot||pick(IMPSLOTS);line=SYM_LINES[line]?line:pick(Object.keys(SYM_LINES));const L=SYM_LINES[line],D=IMPDEF[slot];
  const ql=clamp(Math.round(lv*5),1,IMPQL_MAX());const it={id:uid(),kind:'imp',slot,ql,r:3,lvl:Math.max(1,Math.round(ql/5)),bonus:[],sym:line,
    name:'QL '+ql+' '+L.n+' '+D.n+' Symbiant'};
  for(const s of L.stats){const base=ATTRS.includes(s)?1+Math.floor(ql/5):2+Math.floor(ql/3);it.bonus.push({s,v:Math.max(1,Math.round(base*1.9))});}
  it.bonus.push({s:L.sp,v:Math.max(1,bonusVal(L.sp,it.lvl,1.3))});
  it.req=[{s:D.req,v:6+Math.round(ql*0.5)}];it.value=Math.round((5+ql*3)*2.2);return it;}
/* ---------- shrines ---------- */
(function placeShrines(){for(const p of POCKETS){const b=BANKS.find(k=>k.id===p.bank);if(!b)continue;
    let x=b.x+3.4,z=b.z+1.5;for(const [dx,dz] of [[3.4,1.5],[-3.4,1.5],[3.4,-2.5],[-3.4,-2.5],[0,4]]){const cx=b.x+dx,cz=b.z+dz;
      if(!boxes.some(q=>cx>q.x0-1.2&&cx<q.x1+1.2&&cz>q.z0-1.2&&cz<q.z1+1.2)&&!circles.some(c=>Math.hypot(c.x-cx,c.z-cz)<c.r+1.2)){x=cx;z=cz;break;}}
    const g=new THREE.Group();g.position.set(x,heightAt(x,z),z);
    part(g,geoBox,M(0x2e2a30),0,0.25,0,1.4,0.5,1.4);part(g,geoBox,M(0x3e3840),0,1.1,0,0.7,1.3,0.7);
    const gem=part(g,new THREE.OctahedronGeometry(1,0),MB(p.glow),0,2.3,0,0.32,0.46,0.32);
    for(const s of [-1,1])part(g,geoBox,MB(p.glow),s*0.36,1.1,0,0.04,1.0,0.04);
    scene.add(g);circles.push({x,z,r:0.9});SYM.shrines.push({id:p.id,p,b,x,z,g,gem});}})();
function shrineOpen(s){return bankOpenAt(s.b);}
function shrineNear(p){if(FLAT)return null;for(const s of SYM.shrines)if(shrineOpen(s)&&Math.hypot(p.x-s.x,p.z-s.z)<2.8)return s;return null;}
function symSummon(id){const s=SYM.shrines.find(q=>q.id===id),p=POCKET[id];if(!s||!p)return false;
  if(SYM.live&&!SYM.live.e.dead){warn('An echo is already awake: '+SYM.live.p.n);return false;}
  if(!shrineOpen(s)){warn('This shrine is still sealed');return false;}
  if(Math.hypot(P.pos.x-s.x,P.pos.z-s.z)>8){warn('Stand at the '+p.n+' shrine to summon it');return false;}
  if(!patTake(id,'P')){warn('You need the assembled Pattern of '+p.n);return false;}
  // shrines stand inside outposts (safe zones, no combat): the echo forms just outside, on the side nearest the shrine
  let x=s.x,z=s.z;{const o=OUTPOSTS.slice().sort((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(b.x-s.x,b.z-s.z))[0];const a0=o?Math.atan2(s.z-o.z,s.x-o.x):0;
    for(let i=0;i<24;i++){const a=a0+(i%2?1:-1)*Math.ceil(i/2)*0.26,r=(o?o.r:0)+9+Math.floor(i/12)*4;const cx=(o?o.x:s.x)+Math.cos(a)*r,cz=(o?o.z:s.z)+Math.sin(a)*r;
      if(!inTown({x:cx,z:cz})&&Math.abs(cx)<HALF-10&&Math.abs(cz)<HALF-10){x=cx;z=cz;break;}}}
  const e=makeElite(p.t,x,z,p.lv,'🧩 '+p.n,p.col,{hp:p.hp||11,dmg:p.dmg||1.6,scale:1.8,glow:p.glow,xp:8});e.pocket=id;e.leash=45;e.state='chase';e.nextAtk=T+1.5;
  SYM.live={e,p,t:T};symi().sum++;banner('🧩 '+p.n.toUpperCase(),'The echo forms outside the post · Lv '+p.lv+' pocket boss');ringFx(x,z,p.glow,4,0.8);SFX.boom();save();return true;}
function symBossDown(L){const p=L.p,S0=symi();S0.kills[p.id]=(S0.kills[p.id]|0)+1;
  const line=Math.random()<0.6?symLineFor(P.prof):null;const it=symGive(p.lv,line);it.dropBy=p.n;dropLoot(L.e.pos.x,L.e.pos.z+1.5,it);P.credits+=60*p.lv;
  banner('🧩 POCKET BOSS DEFEATED',p.n+' dropped '+it.name);log('🧩 <b>'+esc(p.n)+'</b> defeated: <b>'+esc(it.name)+'</b> (+'+(60*p.lv)+'¢).');save();}
const _updBanksSym=updBanks;
updBanks=function(){_updBanksSym();for(const s of SYM.shrines){const v=shrineOpen(s)&&!FLAT;s.g.visible=v;if(v)s.gem.rotation.y=T*1.2;}
  const L=SYM.live;if(L){if(L.e.dead&&!L.done){L.done=true;try{symBossDown(L);}catch(e){}setTimeout(()=>{if(enemies.includes(L.e))removeEnemy(L.e);},5000);SYM.live=null;}
    else if(!enemies.includes(L.e)||(!L.e.dead&&Math.hypot(P.pos.x-L.e.pos.x,P.pos.z-L.e.pos.z)>200)){if(enemies.includes(L.e))removeEnemy(L.e);SYM.live=null;log('🧩 The echo of '+esc(L.p.n)+' fades. The pattern is spent.');}}};
const _rrMiniSym=rrMini;
rrMini=function(c,tf){_rrMiniSym(c,tf);for(const s of SYM.shrines){if(!shrineOpen(s)||Math.abs(s.x-P.pos.x)>95||Math.abs(s.z-P.pos.z)>95)continue;const q=tf(s.x,s.z);
  c.font='bold 15px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';c.fillText('◈',q[0]+1,q[1]+1);c.fillStyle='#4affd2';c.fillText('◈',q[0],q[1]);}};
const _stage3InteractSym=stage3Interact;
stage3Interact=function(p){const s=shrineNear(p);if(s)return {k:'shrine',id:s.id,label:'🧩 Echo Shrine'};return _stage3InteractSym(p);};
const _stage3DoSym=stage3Do;
stage3Do=function(n){if(n&&n.k==='shrine'){openSym('pat',n.id);return true;}return _stage3DoSym(n);};
/* ---------- panel ---------- */
function symAssemble(id){if(!POCKET[id])return false;for(const k in SYM_PIECES)if(patCount(id,k)<1){warn('Missing '+patName({mt:id+':'+k}));return false;}
  for(const k in SYM_PIECES)patTake(id,k);bagAdd({kind:'pat',mt:id+':P',ql:POCKET[id].lv},1);symi().made++;SFX.quest();toast('🧩 Assembled: Pattern of '+POCKET[id].n);save();return true;}
function openSym(tab,at){if(tab)SYM.tab=tab;const S0=symi();const near=at||(shrineNear(P.pos)||{}).id;
  let h=`<div class="tabs"><button data-act="symtab" data-t="pat" class="${SYM.tab==='pat'?'on':''}">🧩 Patterns</button><button data-act="symtab" data-t="help" class="${SYM.tab==='help'?'on':''}">❔ How it works</button></div>`;
  if(SYM.tab==='help'){h+=`<div class="stats" style="line-height:1.5">Enemies of level 8 and up sometimes drop <b>pattern pieces</b> (🔸 Root, Thread, Crown, Heart). Elites, rares and dungeon bosses drop them far more often, and hard-mode tiers more still. Each piece belongs to the pocket boss of the enemy's level band.<br><br>Collect all four, tap <b>Assemble</b>, and take the 🧩 pattern to that boss's <b>Echo Shrine</b> (◈ on the minimap, beside the bank at the band's hub). <b>Summon</b> it there and defeat it for a <b>symbiant</b>: an implant that is stronger than any normal implant of its QL, with four stats of one line plus a special, and no Treatment requirement. You get your profession's line 60% of the time.<br><br>Lines: ${Object.values(SYM_LINES).map(L=>L.ic+' <b>'+L.n+'</b> ('+L.stats.map(s=>STATN[s]||s).join(', ')+' + '+(STATN[L.sp]||L.sp)+')').join(' · ')}.</div>`;}
  else{h+=`<div class="stats">Pattern pieces drop from Lv 8+ enemies. Assemble four, then summon the pocket boss at its ◈ Echo Shrine. Patterns made: ${S0.made} · bosses summoned: ${S0.sum} · defeated: ${Object.values(S0.kills).reduce((a,b)=>a+b,0)}</div>`;
    for(const p of POCKETS){const s=SYM.shrines.find(q=>q.id===p.id),open=s&&shrineOpen(s);const pieces=Object.keys(SYM_PIECES).map(k=>{const n=patCount(p.id,k);return `<span class="chip${n?' on':''}" style="min-height:0;padding:4px 8px">${n?'🔸':'▫️'} ${SYM_PIECES[k]}${n>1?' ×'+n:''}</span>`;}).join('');
      const full=patCount(p.id,'P'),all=Object.keys(SYM_PIECES).every(k=>patCount(p.id,k)>0),here=near===p.id;
      h+=`<div class="item" style="display:block;cursor:default${here?';border-color:#4affd2':''}"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b style="color:#${p.glow.toString(16).padStart(6,'0')}">${esc(p.n)}</b> <small style="opacity:.7">Lv ${p.lv} · shrine at ${esc(s?s.b.name.replace(/ Bank$/,''):'?')}${open?'':' (sealed)'}${S0.kills[p.id]?' · defeated ×'+S0.kills[p.id]:''}</small></div>
        <div style="display:flex;gap:6px">${all?`<button class="sbtn" data-act="symasm" data-id="${p.id}">Assemble</button>`:''}${full&&here?`<button class="sbtn" data-act="symsum" data-id="${p.id}" id="symSum">⚔ Summon</button>`:''}</div></div>
        <div class="chips" style="margin:6px 0 0">${pieces}${full?`<span class="chip on" style="min-height:0;padding:4px 8px">🧩 Pattern ×${full}</span>`:''}</div></div>`;}}
  openPanel('🧩 SYMBIANTS',h,'sym');}
const _stage3ActSym=stage3Act;
stage3Act=function(a,b){const D=b.dataset;if(a==='symtab'){openSym(D.t);return true;}if(a==='symasm'){symAssemble(D.id);openSym();return true;}
  if(a==='symsum'){if(symSummon(D.id))closePanel();else openSym();return true;}return _stage3ActSym(a,b);};
try{btn('#bSym',()=>openSym());}catch(e){}
function symExports(){return {SYM,POCKETS,POCKET,SYM_LINES,symi,symGive,symSummon,symAssemble,openSym,symOnKill,symLineFor,patCount,shrineNear,symFields};}
/* ---------- Collection log page (game40 'sym' sub-tab, 2026-11-24) ----------
   P.sym.got {'line|slot':1} is filled by a colScan wrapper from symbiants you hold, wear (P.imps) or bank, like the rest of the log. */
const _colScanSym=colScan;
colScan=function(bank){_colScanSym(bank);const g=symi().got;const see=it=>{if(it&&it.kind==='imp'&&it.sym&&SYM_LINES[it.sym]&&IMPSLOTS.includes(it.slot))g[it.sym+'|'+it.slot]=1;};
  (P.inv||[]).forEach(see);Object.values(P.imps||{}).forEach(see);if(bank){try{loadBank().items.forEach(see);}catch(e){}}};
function symCollHtml(cell){const S0=symi(),g=S0.got,lines=Object.keys(SYM_LINES);const kills=S0.kills||{};
  let h=`<div style="font-size:13px;opacity:.85">Pocket bosses are summoned at the ◈ Echo Shrines beside hub banks with an assembled pattern (⋯ → 🧩 Symbiants). Each drops a symbiant.</div>`;
  h+=`<div class="h4" style="margin-top:6px">Pocket bosses <small>${POCKETS.filter(p=>kills[p.id]).length}/${POCKETS.length}</small></div><div style="display:flex;flex-wrap:wrap">`+
    POCKETS.map(p=>cell(!!kills[p.id],'👁',p.n,'Lv '+p.lv+' · shrine by the '+(BANKS.find(b=>b.id===p.bank)||{name:p.bank}).name+(kills[p.id]?' · defeated ×'+kills[p.id]:''),'#'+p.glow.toString(16).padStart(6,'0'))).join('')+'</div>';
  for(const l of lines){const L=SYM_LINES[l];const n=IMPSLOTS.filter(sl=>g[l+'|'+sl]).length;
    h+=`<div class="h4" style="margin-top:6px">${L.ic} ${esc(L.n)} line <small>${n}/${IMPSLOTS.length}</small></div><div style="display:flex;flex-wrap:wrap">`+
      IMPSLOTS.map(sl=>cell(!!g[l+'|'+sl],L.ic,L.n+' '+(IMPDEF[sl]?IMPDEF[sl].n:sl)+' Symbiant',(g[l+'|'+sl]?'Collected':'Not found yet')+' · '+L.stats.map(s=>STATN&&STATN[s]?STATN[s]:s).join(', '),'#c86bff')).join('')+'</div>';}
  return h;}

