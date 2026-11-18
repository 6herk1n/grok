/* ================= BUILD G: faction zones =================
   Four zones held by a faction (one per faction in the Duskcrown Highlands, Lv 14-17, and one per faction in the Rimefall Expanse, Lv 24-27).
   - Members of the holding faction: full services at the outpost (quartermaster, commander with a repeatable patrol contract), Save Point + Conduit.
   - Members of the other faction: Sentinels attack on sight inside the border (warning banner on approach), chase a limited distance, hit for ~30% of
     your max health, and can't be killed (10M health, they rally to full). The outpost, its Save Point and its Conduit node refuse you.
   - Unaligned / unregistered: tolerated. Sentinels ignore you and you can't attack them, you may pass through and use the Save Point and Conduit,
     but the quartermaster and commander deal with members only. */
const FZ={guards:[],ren:[],npcs:[],acc:0,cur:null,warnT:{}};
const FZ_GUARD_HP=9999999,FZ_HIT=0.3,FZ_NEED=8;
function fzById(id){return FZONES.find(z=>z.id===id)||null;}
function fzAt(x,z){for(const Z of FZONES)if(Math.hypot(x-Z.x,z-Z.z)<Z.R)return Z;return null;}
function fzMySide(){const s=P.faction&&P.faction.side;return s==='combine'||s==='ashborn'?s:null;}
function fzStance(Z){if(!Z)return 'neutral';const me=fzMySide();return !me?'neutral':me===Z.side?'friendly':'hostile';}
function fzCanHit(e){return !!(e&&e.guard)&&fzStance(fzById(e.guard.zone))==='hostile';}
function fzSkip(e){return !!(e&&e.guard)&&!fzCanHit(e);}
function fzLv(Z){return Math.round((Z.lv[0]+Z.lv[1])/2);}
function fzStanceTxt(Z){const st=fzStance(Z),F=FACTIONS[Z.side];return st==='friendly'?'Friendly territory · quartermaster and commander at '+Z.out:st==='hostile'?'⚠ Hostile: '+Z.gl+'s attack '+FACTIONS[fzMySide()].short+' on sight':'Unaligned: tolerated, but '+F.short+' services are for members only';}
function normFz(f){f=f&&typeof f==='object'?f:{};const b=f.b&&fzById(f.b.zone)?{zone:f.b.zone,need:Math.max(1,f.b.need|0||FZ_NEED),got:0}:null;if(b)b.got=clamp(f.b.got|0,0,b.need);
  const ob=o=>{const r={};if(o&&typeof o==='object')for(const k in o)if(fzById(k))r[k]=Math.max(0,o[k]|0);return r;};return {b,done:ob(f.done),seen:ob(f.seen)};}
function fzS(){return P.fz=P.fz&&P.fz.done?P.fz:normFz(P.fz);}
/* ---------- world: border pylons, outpost dressing, NPCs, Sentinels, renegades ---------- */
function fzBuild(Z){const F=FACTIONS[Z.side],pal=FZ_PAL[Z.side];const g=new THREE.Group();scene.add(g);
  // border pylons (Build L): all 24 merged into a few static meshes per zone; crystals + energy fence share pulsing materials
  {const G=cq(),PL=[],FL=[],HD=[],BM=[];let prev=null,first=null;const up=new THREE.Vector3(0,-1,0),q=new THREE.Quaternion();
  const beam=(p1,p2)=>{const d=p2.clone().sub(p1),len=d.length();q.setFromUnitVectors(up,d.normalize());BM.push([G.rod,new THREE.Matrix4().compose(p1,q,new THREE.Vector3(0.05,len,0.05))]);};
  for(let i=0;i<24;i++){const a=i/24*6.283;const x=Z.x+Math.cos(a)*Z.R,z=Z.z+Math.sin(a)*Z.R;if(inTown({x,z})){prev=null;continue;}const y=heightAt(x,z);
    PL.push([glHex(),glM(x,y,z,0.42,0.35,0.42)],[glHex(),glM(x,y+0.3,z,0.2,3.2,0.2)],[G.disc,glM(x,y+3.5,z,0.34,0.12,0.34)]);for(let k=0;k<3;k++){const b=a+k*2.094;PL.push([G.spike,glM(x+Math.cos(b)*0.26,y+3.5,z+Math.sin(b)*0.26,0.06,0.55,0.06,Math.sin(b)*0.35,0,-Math.cos(b)*0.35)]);}
    FL.push([geoBox,glM(x,y+2.5,z,0.05,1.1,1.1,0,-a,0)]);HD.push([glOct(),glM(x,y+4.15,z,0.24,0.42,0.24,0,a,0)]);
    const p=new THREE.Vector3(x,y+3.25,z);if(prev)beam(prev,p);else if(!first)first=p;prev=p;if(i===23&&first&&!inTown({x:Z.x+Z.R,z:Z.z}))beam(p,first);circles.push({x,z,r:0.45});}
  part(g,glMerge(PL),M(pal[1]),0,0,0,1,1,1);part(g,glMerge(FL),M(pal[3]),0,0,0,1,1,1);
  const hm=new THREE.MeshBasicMaterial({color:F.hex}),bm=new THREE.MeshBasicMaterial({color:F.glow||F.hex,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending,depthWrite:false});
  part(g,glMerge(HD),hm,0,0,0,1,1,1);if(BM.length)part(g,glMerge(BM),bm,0,0,0,1,1,1);(FZP_=FZP_||[]).push({hm,bm,c:new THREE.Color(F.hex),ph:FZP_.length*1.3});}
  const y=heightAt(Z.x,Z.z);// flag mast + banner in the middle, two gate towers
  part(g,geoBox,M(0x3a3a3a),Z.x-1.5,y+4,Z.z-1.5,0.22,8,0.22);part(g,geoBox,M(pal[3]),Z.x-1.5+0.9,y+7,Z.z-1.5,1.7,1.2,0.06);part(g,geoBox,MB(F.glow),Z.x-1.5,y+8.15,Z.z-1.5,0.4,0.4,0.4);circles.push({x:Z.x-1.5,z:Z.z-1.5,r:0.4});
  for(const sx of [-1,1]){const tx=Z.x+sx*15.5,tz=Z.z+4.2,ty=heightAt(tx,tz);part(g,geoBox,M(pal[0]),tx,ty+2.6,tz,1.8,5.2,1.8);part(g,geoBox,M(pal[3]),tx,ty+5.4,tz,2.3,0.4,2.3);part(g,geoBox,MB(F.hex),tx,ty+5.9,tz,0.5,0.5,0.5);
    boxes.push({x0:tx-0.9,x1:tx+0.9,z0:tz-0.9,z1:tz+0.9,y0:ty,y1:ty+5.6});}
  // NPCs: commander by the flag, quartermaster by the stores
  const npc=(role,name,x,z,body,acc)=>{const ny=heightAt(x,z);const R=buildHumanoid(body,acc,F.glow,0x6a4a3a,{npc:1,cape:pal[1]});R.g.position.set(x,ny,z);R.g.rotation.y=Math.atan2(Z.x-x,Z.z-z);
    part(R.g,new THREE.OctahedronGeometry(1,0),MB(F.hex),0,2.65,0,0.22,0.34,0.22);scene.add(R.g);circles.push({x,z,r:0.6});const n={zone:Z.id,role,name,x,z,R};FZ.npcs.push(n);try{R.anim&&R.anim(0,0,0,0);}catch(err){}return n;};
  const Fn=Z.side==='combine';
  npc('cmd',(Fn?'Commander ':'Warchief ')+({ironward:'Hesk Varro',emberhollow:'Ysolde Cinder',coldspire:'Adair Thorne',frostforge:'Brann Kettleback'})[Z.id],Z.x-6,Z.z+2.5,Fn?0x3c4a62:0x5a3424,F.hex);
  npc('qm',(Fn?'Supply Officer ':'Trader ')+({ironward:'Lune Matsik',emberhollow:'Rook Ashley',coldspire:'Pell Arkwright',frostforge:'Sefa Tallow'})[Z.id],Z.x+7.5,Z.z+0.5,Fn?0x56627a:0x6a4a34,pal[3]);
}
// Sentinels + renegades only exist while you are near the zone (keeps the world enemy count and frame cost down)
function fzSpawn(Z){if(Z.live)return;Z.live=true;
  // Sentinels: 2 at each gate (long leash), 6 border pickets (short leash)
  const lvG=Math.min(MAXLVL,Z.lv[1]+6);
  for(const sx of [-1,1])for(const sz of [-1,1])fzGuard(Z,Z.x+sx*13.6,Z.z+sz*2.3,lvG,62,26);
  for(let i=0;i<6;i++){const a=(i+0.5)/6*6.283;fzGuard(Z,Z.x+Math.cos(a)*(Z.R-7),Z.z+Math.sin(a)*(Z.R-7),lvG,34,22);}
  // contested ground: renegades (normal enemies) for the patrol contract
  for(let i=0;i<8;i++){const a=i/8*6.283+0.39,rr=Z.R*(0.45+0.4*((i*37)%10)/10);const x=Z.x+Math.cos(a)*rr,z=Z.z+Math.sin(a)*rr;
    const e=makeEnemy('raider',x,z,clamp(Z.lv[0]+(i%4),1,MAXLVL));e.T=Object.assign({},e.T,{name:Z.ren});e.fzR=Z.id;e.wr=6;retint(e.R.g,0x6f6a60,0.45);FZ.ren.push(e);}}
function fzDespawn(Z){if(!Z.live)return false;const mine=e=>(e.guard&&e.guard.zone===Z.id)||e.fzR===Z.id;
  if(FZ.guards.concat(FZ.ren).some(e=>mine(e)&&e.state==='chase'&&!e.dead))return false;
  for(const e of FZ.guards.concat(FZ.ren))if(mine(e)){if(P.target===e)P.target=null;if(enemies.includes(e))removeEnemy(e);}
  FZ.guards=FZ.guards.filter(e=>!mine(e));FZ.ren=FZ.ren.filter(e=>!mine(e));Z.live=false;return true;}
function fzStream(){if(DUN)return;for(const Z of FZONES){const d=Math.hypot(P.pos.x-Z.x,P.pos.z-Z.z);if(d<Z.R+170)fzSpawn(Z);else if(d>Z.R+240)fzDespawn(Z);}}
function fzGuard(Z,x,z,lv,leash,ar){const F=FACTIONS[Z.side];const e=makeEnemy('raider',x,z,lv);e.type='fguard';
  e.T=Object.assign({},e.T,{name:Z.gl,xp:0,aggro:0,speed:6.6,range:15,atkCd:1.5,scale:e.T.scale*1.32});
  e.maxHp=e.hp=FZ_GUARD_HP;e.guard={zone:Z.id,side:Z.side,ar};e.leash=leash;e.wr=0.5;e.hitR*=1.32;e.h*=1.32;e.rotY=Math.atan2(x-Z.x,z-Z.z);
  retint(e.R.g,F.hex,0.6,F.glow);const ring=new THREE.Mesh(new THREE.RingGeometry(0.95,1.2,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:F.hex,transparent:true,opacity:0.75,depthWrite:false}));ring.position.y=0.06;e.R.g.add(ring);
  FZ.guards.push(e);return e;}
FZONES.forEach(fzBuild);
/* ---------- rules ---------- */
function fzGuardWants(e,dP){if(P.dead||DUN||state!=='play')return false;const Z=fzById(e.guard.zone);if(fzStance(Z)!=='hostile')return false;
  return dP<e.guard.ar&&Math.hypot(P.pos.x-Z.x,P.pos.z-Z.z)<Z.R+2;}
function fzGuardFar(e){const Z=fzById(e.guard.zone);return Math.hypot(P.pos.x-Z.x,P.pos.z-Z.z)>Z.R+40;}
function fzHitAmt(){return S.maxHp*FZ_HIT/((100/(100+(S.armor||0)))*(1-(S.dr||0)/100));}
function fzNodeBlocked(id){const Z=fzById(id);if(Z&&fzStance(Z)==='hostile'){warn('The '+Z.out+' Conduit only opens for '+FACTIONS[Z.side].short+' members');return true;}return false;}
function fzInteract(p){for(const Z of FZONES){if(Math.hypot(p.x-Z.x,p.z-Z.z)>15)continue;
    for(const n of FZ.npcs)if(n.zone===Z.id&&Math.hypot(p.x-n.x,p.z-n.z)<3.2)return {k:'fz',zone:Z.id,role:n.role,label:(n.role==='qm'?'🛒 ':'⚑ ')+n.name};
    if(fzStance(Z)==='hostile')return {k:'fzdeny',zone:Z.id,label:'⛔ '+FACTIONS[Z.side].short+' outpost'};}return null;}
function fzDo(n){const Z=fzById(n.zone);if(!Z)return;const st=fzStance(Z),F=FACTIONS[Z.side];
  if(n.k==='fzdeny'){warn(Z.out+' is a '+F.short+' outpost: its Save Point and Conduit refuse you');return;}
  if(st==='hostile'){warn('"'+FACTIONS[fzMySide()].short+'? Sentinels!" Nobody here will deal with you');return;}
  if(n.role==='qm'&&st==='friendly'){openFacVendor(Z.side);return;}
  openFzCommand(Z);}
function fzReward(Z){const rim=Z.ring==='rime';return {rep:rim?100:60,cr:fzLv(Z)*35,xp:P.level>=MAXLVL?0:Math.round(xpNeed(P.level)*0.15)};}
function fzAccept(id){const Z=fzById(id),f=fzS();if(!Z||fzStance(Z)!=='friendly')return false;if(f.b&&f.b.got<f.b.need&&f.b.zone!==id){warn('Finish or abandon your '+fzById(f.b.zone).name+' contract first');return false;}
  f.b={zone:id,need:FZ_NEED,got:0};log('⚑ <b>Patrol contract</b>: clear '+FZ_NEED+' '+Z.ren+'s from '+Z.name+'.');toast('⚑ Contract accepted');save();return true;}
function fzAbandon(){const f=fzS();if(!f.b)return false;f.b=null;save();return true;}
function fzTurnIn(id){const Z=fzById(id),f=fzS();if(!Z||!f.b||f.b.zone!==id||f.b.got<f.b.need||fzStance(Z)!=='friendly')return false;const r=fzReward(Z);
  f.b=null;f.done[id]=(f.done[id]||0)+1;gainRep(Z.side,r.rep);P.credits+=r.cr;if(r.xp)gainXp(r.xp);
  const it=genItem(fzLv(Z),null,Math.random()<0.25?3:2);it.src=it.src||null;if(!invAdd(it))dropLoot(P.pos.x+1,P.pos.z,it);
  SFX.quest();banner('⚑ CONTRACT COMPLETE',Z.name+' · +'+r.rep+' '+FACTIONS[Z.side].short+' rep · +'+r.cr+'¢'+(r.xp?' · +'+r.xp+' XP':'')+' · '+it.name);
  log('⚑ Contract complete: <b style="color:'+RAR[it.r].c+'">'+esc(it.name)+'</b>, '+r.cr+'¢'+(r.xp?', '+r.xp+' XP':''));save();return it;}
function fzOnKill(e){if(!e||!e.fzR)return;const f=fzS();if(!f.b||f.b.zone!==e.fzR||f.b.got>=f.b.need)return;f.b.got++;
  floatText(tmpV.set(P.pos.x,P.pos.y+2.8,P.pos.z),'⚑ '+f.b.got+'/'+f.b.need,'info');if(f.b.got>=f.b.need){toast('⚑ Contract done: report to the commander');SFX.quest();}}
/* ---------- commander panel ---------- */
function openFzCommand(Z){const F=FACTIONS[Z.side],st=fzStance(Z),f=fzS(),r=fzReward(Z),n=FZ.npcs.find(q=>q.zone===Z.id&&q.role==='cmd');
  let h=`<div class="fzhead" style="border-color:${F.col}"><span class="fzic">${F.icon}</span><div><b style="color:${F.col}">${esc(Z.name)}</b><div>Held by the ${F.name} · Lv ${Z.lv[0]}–${Z.lv[1]} · ${esc(n?n.name:'')}</div></div></div>`;
  h+=`<div class="fzrules"><div><b style="color:${F.col}">${F.short} members</b>: full services, patrol contracts, Save Point and Conduit.</div><div><b>Unaligned</b>: tolerated. Sentinels let you pass, Save Point and Conduit work, but no trade or contracts.</div><div><b style="color:${FACTIONS[Z.side==='combine'?'ashborn':'combine'].col}">${FACTIONS[Z.side==='combine'?'ashborn':'combine'].short} members</b>: ${Z.gl}s attack on sight inside the border. They can't be killed.</div></div>`;
  if(st!=='friendly'){h+=`<div class="fzmsg">"${st==='neutral'?'Unaligned, eh? You can rest here, but contracts and stores are for '+F.short+' only. Registrar Hale in Halden\'s Rest can fix that.':'Get out.'}"</div>`;}
  else{const b=f.b&&f.b.zone===Z.id?f.b:null,other=f.b&&f.b.zone!==Z.id?fzById(f.b.zone):null;
    h+=`<div class="h4" style="margin-top:10px">Patrol contract · repeatable</div><div class="fzc"><div>Clear <b>${FZ_NEED} ${Z.ren}s</b> from ${Z.name}.</div><div class="fzrew">Reward: +${r.rep} ${F.short} rep · ${r.cr}¢${r.xp?' · '+r.xp+' XP':''} · a Rare or Epic item (Lv ${fzLv(Z)})</div>`;
    if(b){const pc=Math.round(b.got/b.need*100);h+=`<div class="fzbar"><i style="width:${pc}%;background:${F.col}"></i><span>${b.got} / ${b.need}</span></div>`+(b.got>=b.need?`<button class="sbtn fzbtn" data-fz="turnin" data-z="${Z.id}">Turn in contract</button>`:`<button class="sbtn alt fzbtn" data-fz="abandon" data-z="${Z.id}">Abandon</button>`);}
    else h+=`<button class="sbtn fzbtn" data-fz="accept" data-z="${Z.id}" ${other&&f.b.got<f.b.need?'disabled':''}>Accept contract</button>`+(other?`<div class="fzrew">You already hold a contract for ${other.name}.</div>`:'');
    h+=`</div><div class="fzrew" style="margin-top:6px">Contracts completed here: ${f.done[Z.id]||0} · Your ${F.short} standing: ${REP_TIERS[repTier(Z.side)].n} (${fac().rep[Z.side]} rep)</div>`;}
  openPanel(Z.out.toUpperCase(),h,'fzcmd');FZ.open=Z.id;}
function fzInit(){pbody.addEventListener('click',e=>{const b=e.target.closest('[data-fz]');if(!b||b.disabled)return;const a=b.dataset.fz,Z=fzById(b.dataset.z);SFX.ui();if(!Z)return;
  if(a==='accept')fzAccept(Z.id);else if(a==='abandon')fzAbandon();else if(a==='turnin')fzTurnIn(Z.id);openFzCommand(Z);});}
/* ---------- per-frame: Sentinel damage + rally, borders, banners ---------- */
function fzUpdate(dt){if(DUN)return;const hit=fzHitAmt();
  for(const e of FZ.guards){if(e.dead){e.dead=false;e.hp=e.maxHp;}if(e.state==='chase'){e.dmg=hit;if(e.hp<e.maxHp*0.6)e.hp=e.maxHp;}else if(e.hp<e.maxHp)e.hp=e.maxHp;}
  for(const n of FZ.npcs)if(Math.abs(n.x-P.pos.x)<60&&Math.abs(n.z-P.pos.z)<60){try{n.R.anim&&n.R.anim(T,0,0,0);}catch(err){}}
  FZ.acc+=dt;if(FZ.acc<0.3)return;FZ.acc=0;fzStream();if(P.dead)return;
  const Z=fzAt(P.pos.x,P.pos.z);
  if(Z!==FZ.cur){const prev=FZ.cur;FZ.cur=Z;
    if(Z){const F=FACTIONS[Z.side],st=fzStance(Z);fzS().seen[Z.id]=1;banner((st==='hostile'?'⚠ ':F.icon+' ')+Z.name.toUpperCase(),'Held by the '+F.name+' · Lv '+Z.lv[0]+'–'+Z.lv[1]+' · '+fzStanceTxt(Z));
      log('<b style="color:'+F.col+'">'+F.icon+' Entered '+Z.name+'</b> ('+F.short+'-held). '+fzStanceTxt(Z)+'.');if(st==='hostile'){warn(Z.gl+'s attack '+FACTIONS[fzMySide()].short+' on sight!');tone(220,0.25,'sawtooth',0.04,-80);}}
    else if(prev)log('Left '+prev.name+'.');}
  if(!Z){for(const W of FZONES){if(fzStance(W)!=='hostile')continue;const d=Math.hypot(P.pos.x-W.x,P.pos.z-W.z);if(d<W.R+22&&d>=W.R&&T-(FZ.warnT[W.id]??-99)>25){FZ.warnT[W.id]=T;const F=FACTIONS[W.side];
    banner('⚠ '+F.short.toUpperCase()+' TERRITORY AHEAD',W.name+' · '+W.gl+'s attack '+FACTIONS[fzMySide()].short+' on sight and can\'t be killed. Turn back.');warn('Entering '+F.short+'-held ground: '+W.name);}}}}
/* ---------- map + minimap ---------- */
function fzMap(c,w2s,lab,vis){for(const Z of FZONES){const F=FACTIONS[Z.side],q=w2s(Z.x,Z.z),rp=Z.R*MAP.ppm,known=vis(Z.x,Z.z)||!!fzS().seen[Z.id];
  c.save();c.globalAlpha=0.16;c.fillStyle=F.col;c.beginPath();c.arc(q[0],q[1],rp,0,7);c.fill();c.globalAlpha=0.9;c.strokeStyle=F.col;c.lineWidth=2.5;c.setLineDash([7,5]);c.beginPath();c.arc(q[0],q[1],rp,0,7);c.stroke();c.restore();
  const t=F.icon+' '+(known?Z.name:F.short+' territory')+' · '+F.short+'-held';c.font='bold 12px sans-serif';c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.85)';c.fillStyle=F.col;c.strokeText(t,q[0],q[1]-rp-4);c.fillText(t,q[0],q[1]-rp-4);
  if(known){const l='Lv '+Z.lv[0]+'–'+Z.lv[1]+' · '+({friendly:'friendly',hostile:'⚠ hostile',neutral:'tolerated'})[fzStance(Z)];c.font='600 11px sans-serif';c.strokeText(l,q[0],q[1]-rp+10);c.fillText(l,q[0],q[1]-rp+10);}}}
function fzMini(c,tf,sc){for(const Z of FZONES){if(Math.hypot(Z.x-P.pos.x,Z.z-P.pos.z)>Z.R+130)continue;const q=tf(Z.x,Z.z);const F=FACTIONS[Z.side];
  c.save();c.strokeStyle=F.col;c.globalAlpha=0.85;c.lineWidth=3;c.setLineDash([8,6]);c.beginPath();c.arc(q[0],q[1],Z.R*sc,0,7);c.stroke();c.globalAlpha=0.12;c.fillStyle=F.col;c.fill();c.restore();
  c.fillStyle=F.col;c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.arc(q[0],q[1],6,0,7);c.fill();c.stroke();}}
function fzDotCol(e){return e.state==='chase'?'#ff3b2f':FACTIONS[e.guard.side].col;}
function fzExports(){return {fzSpawn,fzDespawn,fzStream,FZONES,FZ,FZ_GUARD_HP,fzById,fzAt,fzStance,fzCanHit,fzInteract,fzDo,fzAccept,fzAbandon,fzTurnIn,fzOnKill,openFzCommand,normFz,fzS,fzHitAmt,fzNodeBlocked,conduitTravel,dmgEnemy,autoTarget,cycleTarget,validTarget,OUTPOSTS,CONDUIT,SAVEPTS,regionAt,toggleMap,MAP,joinFaction,fac,repTier,makeEnemy,updEnemy,get enemies(){return enemies;},get panelOpen(){return panelOpen;}};}
