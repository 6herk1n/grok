/* ---------------- game state ---------------- */
let state='title';let T=0;let panelOpen=null;
const camS={yaw:0,pitch:0.42,dist:9,tyaw:0};
const loots=[];
let missionOffers=[],offersAt=-999,vendorStock=[],stockAt=-999,stockLvl=0,stockCtx='town';const VEND={ctx:'town'};
let cache=null;// {m,beam,x,z}

/* ---------------- toasts / log ---------------- */
let toastT=0;function toast(s){const el=$('#toast');el.textContent=s;el.classList.add('on');toastT=1.6;}
let bannerT=0;function banner(h,sub){const el=$('#banner');el.innerHTML=esc(h)+(sub?'<small>'+esc(sub)+'</small>':'');el.classList.add('on');bannerT=2.6;}
function log(html){const L=$('#log');const d=document.createElement('div');d.innerHTML=html;L.appendChild(d);while(L.children.length>5)L.removeChild(L.firstChild);setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),1000);},6000);}
let lastWarn=0;function warn(s){if(T-lastWarn>0.8){toast(s);SFX.err();lastWarn=T;}}

/* ---------------- combat ---------------- */
function dist2D(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function validTarget(){const t=P.target;return t&&!t.dead&&enemies.includes(t)?t:null;}
function autoTarget(range){let best=null,bs=1e9;const fx=Math.sin(P.rotY),fz=Math.cos(P.rotY);
  for(const e of enemies){if(e.dead||fzSkip(e))continue;const dx=e.pos.x-P.pos.x,dz=e.pos.z-P.pos.z;const d=Math.hypot(dx,dz);if(d>range)continue;const front=(dx*fx+dz*fz)/(d||1);const s=d*(front>0.3?1:1.6)*(e.state==='chase'?0.6:1);if(s<bs){bs=s;best=e;}}
  return best;}
function setTarget(e){P.target=e;if(e)SFX.ui();}
function cycleTarget(){const list=enemies.filter(e=>!e.dead&&!fzSkip(e)&&dist2D(e.pos,P.pos)<35).sort((a,b)=>dist2D(a.pos,P.pos)-dist2D(b.pos,P.pos));if(!list.length){warn('No enemies nearby');return;}
  const i=list.indexOf(P.target);setTarget(list[(i+1)%list.length]);}
function skillF(){return 1+Math.max(-0.2,(eff(PROFS[P.prof].dmgSkill)-12)/100);}
function rollDmg(mult){const op=openerTake();if(op)mult*=op;const base=S.dmg*(1+0.08*(effLvP()-1))*skillF()*(1+S.power/100)*mult*profKDmgOut()*profDmgK(P.prof,effLvP())*rand(0.9,1.1);const crit=!!op||Math.random()*100<S.crit;return {v:Math.max(1,Math.round(base*(crit?1.75:1))),crit};}
function dmgEnemy(e,mult,silentAggro){if(e.dead||fzSkip(e))return;
  if(e.state==='return'){floatText(entChest(e,tmpV),'Evade','info');return;}
  if(e.immune&&e.immune()){floatText(entChest(e,tmpV),'Shielded','info');P.lastCombat=T;if(e.state!=='chase')aggro(e);return;}
  if(e.foe&&T>(e.tauntUntil||0)&&Math.random()<0.25)e.foe=null;
  const r=rollDmg(mult*(T<(e.hexUntil||0)?(e.hexAmp||1.3):1)*(T<(e.wardUntil||0)?WARD_MUL:1)*vgOut(e));e.hp-=r.v;e.hitT=0.15;floatText(entChest(e,tmpV),r.v+(r.crit?'!':''),r.crit?'crit':'hit');SFX.hit();
  P.lastCombat=T;if(e.state!=='chase')aggro(e);if(e.hp<=0)killEnemy(e);}
function aggro(e){if(e.dead||P.dead)return;e.state='chase';e.nextAtk=Math.max(e.nextAtk,T+0.5);
  for(const o of enemies)if(o!==e&&!o.dead&&o.state==='idle'&&((e.pack&&o.pack===e.pack)||(o.type===e.type&&dist2D(o.pos,e.pos)<9))){o.state='chase';o.nextAtk=T+0.8;}}
function healPlayer(v){const a=Math.min(Math.round(v),S.maxHp-Math.round(P.hp));if(SIMST)SIMST.ph+=Math.max(0,a);P.hp=Math.min(S.maxHp,P.hp+v);floatText(tmpV.set(P.pos.x,P.pos.y+2.2,P.pos.z),'+'+Math.max(0,a),'heal');}
function dodgeRoll(){return Math.random()*100<(S.dodge||0);}
function dmgPlayer(amt,src,noDodge,pure){if(P.dead)return;P.hurtT=T;
  if(P.cast&&P.cast.fragile)cancelCast('Interrupted');
  if(!noDodge&&dodgeRoll()){P.lastCombat=T;P.dodges=(P.dodges||0)+1;floatText(tmpV.set(P.pos.x,P.pos.y+2,P.pos.z),'Dodged','dodge');tone(1300,0.06,'sine',0.03,400);if(!validTarget()&&src)P.target=src;return;}
  if(P.mount)dismount('Knocked off your '+VEHICLES[P.mount].name);
  if(src&&src.T&&src.T.slow)applySlow(src.T.slow.mul,src.T.slow.dur,src.T.slow.name);
  if(src&&src.T&&src.T.ai==='chill')addChill(1,src);
  let a=amt*rand(0.9,1.1)*(pure?1:(armC(src)/(armC(src)+S.armor))*(1-(S.dr||0)/100));if(T<P.bulwarkUntil)a*=1-(P.drAmt||0.5);a*=profKDmgIn()*vgIn();a=Math.max(1,Math.round(a));
  P.hp-=a;if(SIMST)SIMST.pt+=a;profKHurt(a,src);P.lastCombat=T;floatText(tmpV.set(P.pos.x,P.pos.y+2,P.pos.z),'-'+a,'phit');SFX.hurt();$('#vignette').style.opacity=0.55;setTimeout(()=>$('#vignette').style.opacity=0,180);
  if(!validTarget()&&src)P.target=src;vgThorns(a,src);if(P.hp<=0&&!vgSave()){P.hp=0;playerDie();}}
function killEnemy(e){if(e.guard){e.dead=false;e.hp=e.maxHp;return;}e.dead=true;dieStart(e);e.shadow.visible=false;e.respawnAt=T+25;e.dot=null;
  if(e.T.split&&!e.isShard)splitOnDeath(e);
  ringFx(e.pos.x,e.pos.z,0xffb347,3,0.5);
  const diff=e.lv-P.level;const xp=Math.round((12*e.lv+8)*e.T.xp*clamp(1+0.15*diff,0.1,1.5)*packXpMul(e));{const xt=teamXpAdj(xp,e);const rb=restUse(xt);gainXp(xt+rb);teamShareXp(xt,e);if(rb)floatText(tmpV.set(e.pos.x,e.pos.y+e.h+1.3,e.pos.z),'+'+rb+' rested','xp');}campOnKill(e,xp);
  const cr=randi(2,6)*e.lv;P.credits+=cr;floatText(tmpV.set(e.pos.x,e.pos.y+e.h+0.6,e.pos.z),'+'+xp+' XP  +'+cr+'¢','xp');SFX.coin();P.kills++;
  if(Math.random()<(e.type==='raider'?0.45:0.32)*(e.vg?0.35:1)){const gl=clamp(e.lv+randi(-1,0),1,MAXLVL);dropLoot(e.pos.x,e.pos.z,genItem(gl,null,rollRarityL(gl,(e.elite?20:0)+(e.T.hi?5:0))));}
  if(Math.random()<(e.type==='skitter'?0.07:e.type==='raider'?0.12:0.16)*(e.vg?0.35:1)){const d=genDiskForLevel(e.lv+(e.type==='mauler'?1:0));if(d)dropLoot(e.pos.x+1,e.pos.z+0.5,d);}
  questOnKill(e);fzOnKill(e);
  if(e.night&&Math.random()<0.35)dropLoot(e.pos.x-1,e.pos.z,genItem(clamp(e.lv,1,MAXLVL),null,Math.max(1,rollRarityL(e.lv,20))));
  if(!e.dun){const v=rollVeil(e);if(v)dropLoot(e.pos.x,e.pos.z-1.2,v);}
  if(e.dun)dunOnKill(e);
  stage2OnKill(e);
  if(e.temp)setTimeout(()=>removeEnemy(e),50);
  if(P.target===e){P.target=null;let nb=null,nd=1e9;for(const o of enemies)if(!o.dead&&o!==e&&o.state==='chase'){const d=dist2D(o.pos,P.pos);if(d<nd&&d<26){nd=d;nb=o;}}
    if(nb){P.target=nb;}else P.autoAtk=false;}
  save();}
function gainXp(n){if(P.xpLock){xpLockedNote(n);return;}if(P.level>=MAXLVL)return;const capL=Math.min(MAXLVL,bandCapOf(P));if(P.level>=capL){P.xp=Math.min(P.xp+n,xpNeed(P.level)-1);if(n>0)bandCapMsg(capL);return;}P.xp+=n;const t0=tierOfLv(P.level);while(P.level<capL&&P.xp>=xpNeed(P.level)){P.xp-=xpNeed(P.level);P.level++;const g=spGain(P.level);P.sp+=g;calcStats();P.hp=S.maxHp;P.en=S.maxEn;SFX.level();banner('LEVEL '+P.level,'+'+g+' skill points'+(P.level>=PERK_START?' · +1 perk point':'')+'. Open 📈 Skills to spend them'+(P.level===11?' · the Duskcrown Highlands await':P.level===21?' · the Rimefall Expanse awaits':P.level===31?' · the Mirelight Fen awaits':P.level===41?' · the Sundered Heights await':''));if(typeof onLevelUp==='function')onLevelUp(P.level);ringFx(P.pos.x,P.pos.z,0xffc85a,6,1.2);log('<b style="color:#ffc85a">Reached level '+P.level+'</b>');}
  const t1=tierOfLv(P.level);if(t1>t0){P.tier=t1;tierUp(t1,P.level);}
  if(P.level>=MAXLVL)P.xp=0;}
function faceTarget(t){if(t)P.rotY=Math.atan2(t.pos.x-P.pos.x,t.pos.z-P.pos.z);}
function shoot(t,mult,color,cb){faceTarget(t);P.atkAnim=0.35;const from=new V3(P.pos.x+Math.sin(P.rotY)*0.6,P.pos.y+1.35,P.pos.z+Math.cos(P.rotY)*0.6);fireProj(from,t,color,38,cb||(()=>dmgEnemy(t,mult)));}
const ABILITY_FX={
  basic:(t,ab)=>{if(ab.melee){faceTarget(t);P.atkAnim=0.35;dmgEnemy(t,ab.mult);ringFx(t.pos.x,t.pos.z,0xd8e0e8,1.2,0.25);nz(0.08,0.06,4000);return;}shoot(t,ab.mult,ab.proj);SFX.shoot();},
  scatter:()=>{P.atkAnim=0.35;ringFx(P.pos.x,P.pos.z,0xffb347,8,0.45);SFX.boom();let n=0;for(const e of enemies)if(!e.dead&&dist2D(e.pos,P.pos)<8+e.hitR){dmgEnemy(e,1.4);n++;}if(!n)toast('No enemies in range');},
  bulwark:()=>{P.bulwarkUntil=T+8;P.drAmt=0.5;ringFx(P.pos.x,P.pos.z,0x5fa8ff,3,0.8);SFX.heal();floatText(tmpV.set(P.pos.x,P.pos.y+2.4,P.pos.z),'Bulwark','info');},
  breach:t=>{shoot(t,3.2,0xff7a3a);SFX.boom();},
  arc:t=>{shoot(t,1.8,0xa9fbff,()=>{dmgEnemy(t,1.8);ringFx(t.pos.x,t.pos.z,0x5ff2ff,1.5,0.3);});SFX.zap();},
  stasis:t=>{shoot(t,0,0x9fdfff,()=>{ringFx(t.pos.x,t.pos.z,0x9fdfff,6,0.7);for(const e of enemies)if(!e.dead&&dist2D(e.pos,t.pos)<6+e.hitR){e.rootUntil=T+4;dmgEnemy(e,1.3);}});SFX.zap();},
  leech:t=>{shoot(t,0,0xb46bff,()=>{t.dot={until:T+8,next:T+1,mult:0.7,en:3};if(t.state!=='chase')aggro(t);floatText(entChest(t,tmpV),'Leeched','info');});SFX.zap();},
  mend:()=>{healPlayer((S.maxHp*0.3+S.dmg*0.5)*(1+eff('treat')/150));ringFx(P.pos.x,P.pos.z,0x6dff8a,3,0.6);SFX.heal();},
  renew:()=>{P.hot={until:T+10,next:T+1,pct:0.04};ringFx(P.pos.x,P.pos.z,0x6dff8a,5,1);SFX.heal();},
  hex:t=>{shoot(t,0,0xb02bff,()=>{t.hexUntil=T+12;t.hexAmp=1.3;t.hexWeak=0.65;if(t.state!=='chase')aggro(t);floatText(entChest(t,tmpV),'Hexed','info');ringFx(t.pos.x,t.pos.z,0xb02bff,2,0.6);});SFX.zap();},
  flare:t=>{shoot(t,1.9,0xffb347);SFX.zap();},
  sunder:t=>{shoot(t,4.6,0xff4a1a,()=>{dmgEnemy(t,4.6);ringFx(t.pos.x,t.pos.z,0xff4a1a,2.5,0.4);});SFX.boom();},
  nova:t=>{shoot(t,0,0xff7a2a,()=>{ringFx(t.pos.x,t.pos.z,0xff7a2a,7,0.6);SFX.boom();for(const e of enemies.slice())if(!e.dead&&dist2D(e.pos,t.pos)<7+e.hitR)dmgEnemy(e,2.1);});SFX.zap();},
  sear:t=>{shoot(t,0,0xffd25a,()=>{t.dot={until:T+8,next:T+1,mult:0.95,en:0};if(t.state!=='chase')aggro(t);floatText(entChest(t,tmpV),'Searing','info');});SFX.zap();},
  spike:t=>{shoot(t,0,0xffe95a,()=>{dmgEnemy(t,1.6);if(!t.dead){t.stunUntil=T+3;floatText(entChest(t,tmpV),'Stunned','info');}});SFX.zap();}
};
const fields=[],sched=[];
function later(dt,fn){sched.push({at:T+dt,fn});}
function updSched(dt){for(let i=sched.length-1;i>=0;i--)if(T>=sched[i].at){const f=sched[i].fn;sched.splice(i,1);f();}
  for(let i=fields.length-1;i>=0;i--){const f=fields[i];f.m.material.opacity=0.28+Math.sin(T*8)*0.08;f.m.rotation.y+=dt;
    if(T>=f.next){f.next+=1;ringFx(f.x,f.z,f.color,f.r,0.5);for(const e of enemies.slice())if(!e.dead&&Math.hypot(e.pos.x-f.x,e.pos.z-f.z)<f.r+e.hitR)dmgEnemy(e,f.mult);}
    if(T>f.until){scene.remove(f.m);f.m.material.dispose();fields.splice(i,1);}}}
function clearFx(){for(const f of fields){scene.remove(f.m);f.m.material.dispose();}fields.length=0;sched.length=0;}
const fieldGeo=new THREE.CircleGeometry(1,28);fieldGeo.rotateX(-Math.PI/2);
function aoeAt(x,z,r,mult,ab){let n=0;for(const e of enemies.slice())if(!e.dead&&Math.hypot(e.pos.x-x,e.pos.z-z)<r+e.hitR){if(ab.root)e.rootUntil=T+ab.root;if(ab.hexDur){e.hexUntil=T+ab.hexDur;e.hexAmp=ab.amp;e.hexWeak=ab.weak;}dmgEnemy(e,mult);n++;}return n;}
function coneFx(rotY,range,ang,color){const g=new THREE.CircleGeometry(range,18,-ang/2,ang);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.55,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  m.position.set(P.pos.x,P.pos.y+0.4,P.pos.z);m.rotation.y=rotY-Math.PI/2;scene.add(m);let k=0;const step=()=>{k+=0.05;m.material.opacity=0.55*(1-k);m.scale.setScalar(0.4+k*0.6);if(k<1)later(0.016,step);else{scene.remove(m);g.dispose();m.material.dispose();}};step();}
const KIND={
  rattle:(t,a)=>{for(let i=0;i<a.shots;i++)later(i*0.12,()=>{if(!t.dead&&!P.dead){shoot(t,a.mult,a.color);SFX.shoot();}});},
  nuke:(t,a)=>{shoot(t,a.mult,a.color||0xffffff,()=>{dmgEnemy(t,a.mult);ringFx(t.pos.x,t.pos.z,a.color||0xffffff,1.8,0.35);if(a.root&&!t.dead){t.rootUntil=T+a.root;floatText(entChest(t,tmpV),'Snared','info');}if(a.stun&&!t.dead){t.stunUntil=T+a.stun;floatText(entChest(t,tmpV),'Stunned','info');}});(SFX[a.sfx]||SFX.zap)();},
  aoeT:(t,a)=>{shoot(t,0,a.color,()=>{ringFx(t.pos.x,t.pos.z,a.color,a.radius,0.6);SFX.boom();aoeAt(t.pos.x,t.pos.z,a.radius,a.mult,a);});SFX.zap();},
  aoeSelf:(t,a)=>{P.atkAnim=0.35;ringFx(P.pos.x,P.pos.z,a.color||0xffb347,a.radius,0.5);SFX.boom();const n=aoeAt(P.pos.x,P.pos.z,a.radius,a.mult,a);if(a.heal)healPlayer(S.maxHp*a.heal);if(!n&&!a.heal)toast('No enemies in range');},
  cone:(t,a)=>{if(t||validTarget())faceTarget(t||validTarget());P.atkAnim=0.4;const fx=Math.sin(P.rotY),fz=Math.cos(P.rotY);coneFx(P.rotY,a.range,a.angle,a.color);SFX.boom();let n=0;
    for(const e of enemies.slice()){if(e.dead)continue;const dx=e.pos.x-P.pos.x,dz=e.pos.z-P.pos.z,d=Math.hypot(dx,dz);if(d>a.range+e.hitR)continue;const c=(dx*fx+dz*fz)/(d||1);if(d<e.hitR+0.5||Math.acos(clamp(c,-1,1))<=a.angle/2+0.12){if(a.root)e.rootUntil=T+a.root;dmgEnemy(e,a.mult);n++;}}
    if(!n)toast('Nothing in the cone');},
  field:(t,a)=>{shoot(t,0,a.color,()=>{const m=new THREE.Mesh(fieldGeo,new THREE.MeshBasicMaterial({color:a.color,transparent:true,opacity:0.3,depthWrite:false,blending:THREE.AdditiveBlending}));
    const x=t.pos.x,z=t.pos.z;m.position.set(x,heightAt(x,z)+0.3,z);m.scale.set(a.radius,1,a.radius);scene.add(m);fields.push({x,z,r:a.radius,mult:a.mult,until:T+a.dur,next:T,color:a.color,m});SFX.boom();});SFX.zap();},
  barrage:(t,a)=>{const x=t.pos.x,z=t.pos.z;ringFx(x,z,a.color,a.radius,Math.max(0.6,a.delay));SFX.zap();faceTarget(t);P.atkAnim=0.4;
    for(let i=0;i<a.waves;i++)later(a.delay+i*a.gap,()=>{for(let k=0;k<4;k++){const m=new THREE.Mesh(projGeo,MB(a.color));const px=x+rand(-a.radius*0.6,a.radius*0.6),pz=z+rand(-a.radius*0.6,a.radius*0.6);m.position.set(px,heightAt(px,pz)+0.5,pz);m.scale.setScalar(3);scene.add(m);later(0.25,()=>scene.remove(m));}
      ringFx(x,z,a.color,a.radius,0.5);SFX.boom();aoeAt(x,z,a.radius,a.mult,a);});},
  dot:(t,a)=>{shoot(t,0,a.color,()=>{t.dot={until:T+a.dur,next:T+1,mult:a.mult,en:a.en||0};if(t.state!=='chase')aggro(t);floatText(entChest(t,tmpV),a.en?'Leeched':'Burning','info');});SFX.zap();},
  hex:(t,a)=>{shoot(t,0,a.color,()=>{t.hexUntil=T+a.dur;t.hexAmp=a.amp;t.hexWeak=a.weak;if(t.state!=='chase')aggro(t);floatText(entChest(t,tmpV),'Withered','info');ringFx(t.pos.x,t.pos.z,a.color,2.5,0.6);});SFX.zap();},
  heal:(t,a)=>{healPlayer(S.maxHp*a.pct*(1+eff('treat')/150));if(a.dr){P.bulwarkUntil=T+a.dur;P.drAmt=a.dr;}ringFx(P.pos.x,P.pos.z,0x6dff8a,3,0.6);SFX.heal();},
  hot:(t,a)=>{P.hot={until:T+a.dur,next:T+1,pct:a.pct};ringFx(P.pos.x,P.pos.z,0x6dff8a,5,1);SFX.heal();},
  dr:(t,a)=>{P.bulwarkUntil=T+a.dur;P.drAmt=a.amt;ringFx(P.pos.x,P.pos.z,0x5fa8ff,3,0.8);SFX.heal();floatText(tmpV.set(P.pos.x,P.pos.y+2.4,P.pos.z),'Bulwark','info');},
  battery:(t,a)=>{P.en=Math.min(S.maxEn,P.en+S.maxEn*a.pct);ringFx(P.pos.x,P.pos.z,0x5ff2ff,3,0.6);SFX.heal();floatText(tmpV.set(P.pos.x,P.pos.y+2.4,P.pos.z),'+Energy','info');}
};
// basic attack shaped by the equipped weapon type (range, speed, projectile colour, melee)
function basicAb(){const mb=morphBasic();if(mb)return mb;const pr=PROFS[P.prof],b=pr.basic;const w=P.eq&&P.eq.weapon,W=w&&WTYPES[w.wt];if(!W)return b;
  return {id:'basic',name:W.n+' attack',icon:W.ic,cost:0,cd:+(b.cd*W.cd).toFixed(2),range:W.rng,mult:b.mult,proj:W.proj||b.proj,melee:!!W.melee};}
function useAbility(idx){
  if(P.dead||state!=='play')return false;const pr=PROFS[P.prof];const ab=idx<0?basicAb():abDef(barIds()[idx]);if(!ab){if(idx>=0){toast('Empty slot: assign a Weave in the 📖 Weave Book');}return false;}if(idx>=0&&syncLocked(ab))return false;
  if(ab.needPet&&!activePet()){warn('Deploy a bot first');return false;}
  if(P.mount)dismount();if(P.cast)cancelCast();
  if((P.cds[ab.id]||0)>T){if(idx>=0)warn(ab.name+' is recharging');return false;}
  if(P.en<ab.cost){warn('Not enough Vyre energy');return false;}
  let t=null;if(idx<0||ab.needTarget){t=validTarget();if(!t||dist2D(t.pos,P.pos)>ab.range){const a=autoTarget(ab.range);if(a)t=a;}
    if(!t){if(idx>=0)warn('No target in range');return false;}
    if(dist2D(t.pos,P.pos)>ab.range+t.hitR){if(idx>=0||T-lastWarn>2)warn('Out of range');return false;}
    P.target=t;}
  P.en-=ab.cost;P.cds[ab.id]=T+ab.cd;if(ab.buff){addBuff(ab.id,ab.name,ab.icon,ab.buff.dur,ab.buff.mods(P.level));SFX.heal();return true;}
  stealthOpener(ab);P.lastCombat=T;(ABILITY_FX[ab.id]||KIND[ab.kind])(t,ab);return true;
}
function addBuff(id,name,icon,dur,mods){P.buffs=P.buffs.filter(b=>b.id!==id);P.buffs.push({id,name,icon,until:T+dur,mods});calcStats();
  ringFx(P.pos.x,P.pos.z,0xc86bff,3.5,0.8);floatText(tmpV.set(P.pos.x,P.pos.y+2.4,P.pos.z),name,'info');
  log(icon+' <b>'+esc(name)+'</b>: '+Object.keys(mods).map(k=>'+'+mods[k]+' '+SHORT[k]).join(', '));if(panelOpen==='inv')openInventory();else if(panelOpen==='skills')openSkills();else if(panelOpen==='book')openBook();save();}
function updBuffs(){let ch=false;for(let i=P.buffs.length-1;i>=0;i--){if(P.buffs[i].until<=T){log('<span style="opacity:.8">'+P.buffs[i].icon+' '+esc(P.buffs[i].name)+' wore off</span>');P.buffs.splice(i,1);ch=true;}}
  if(ch){calcStats();if(panelOpen==='inv')openInventory();else if(panelOpen==='skills')openSkills();else if(panelOpen==='book')openBook();save();}}
function useConsum(k){const c=CONSUM[k];if(!c||!(P.consum[k]>0)){warn('You have none');return;}P.consum[k]--;addBuff('c_'+k,c.name,c.icon,c.dur,c.mods(P.level));SFX.heal();}
function pressAttack(){if(P.dead)return;let t=validTarget();if(!t){t=autoTarget(30);if(!t){warn('No enemies nearby');return;}P.target=t;}P.autoAtk=true;useAbility(-1);}
function useStim(){if(P.dead)return;if(P.stims<=0){warn('No med-stims. Buy some from the trader');return;}if((P.cds.stim||0)>T){warn('Stim recharging');return;}
  P.stims--;P.cds.stim=T+15;healPlayer(S.maxHp*0.4);SFX.heal();}
function playerDie(){if(SIMST)SIMST.pd++;if(DUN)DUN.pd=(DUN.pd|0)+1;if(DUN&&DUN.vg){vgDie();return;}P.dead=true;P.autoAtk=false;P.target=null;SFX.death();for(const e of enemies)if(e.state==='chase')e.state='return';
  const fee=Math.floor(P.credits*0.05);P.credits-=fee;const loss=applyXpLoss();const spn=savePointName();
  $('#deathTxt').textContent=(loss.unsaved>0?'Unsaved XP since your last Save Point: '+loss.unsaved+'. You lost '+loss.lost+' XP. ':'Your XP was saved: nothing lost. ')+(DUN?'You\'ll be revived at the '+DUN.D.name+' entrance checkpoint. Bosses reset to full health.':'Respawning at your Save Point: '+spn+'.')+(fee?' Recovery fee: '+fee+'¢.':'');
  $('#bRespawn').textContent=DUN?'Revive at dungeon entrance':'Respawn at '+spn;
  setTimeout(()=>{if(P.dead)$('#death').classList.remove('hidden');},1200);save();}
function respawnPlayer(){if(DUN){if(DUN.vg){vgLeave(true);return;}dunRespawn();return;}P.dead=false;P.hp=S.maxHp;P.en=S.maxEn;const sp=savePointPos();P.pos.set(sp.x,0,sp.z);P.rotY=Math.PI;camS.yaw=0;$('#death').classList.add('hidden');ringFx(P.pos.x,P.pos.z,0x6dff8a,4,1);SFX.heal();banner('SAVE POINT',savePointName());save();}

/* ---------------- loot ---------------- */
const lootGeo=new THREE.OctahedronGeometry(0.35,0);
function dropLoot(x,z,item){if(item.r>=6){toast('💠 ULTRA-RARE drop: '+item.name+'!');banner('💠 ULTRA-RARE DROP',item.name);setTimeout(()=>{SFX.level();setTimeout(()=>SFX.quest(),400);},60);}else if(item.r>=4){toast((item.r>=5?'🟥 RELIC':'🟧 LEGENDARY')+' drop: '+item.name+'!');setTimeout(()=>SFX.level(),60);}else if(item.kind==='disk'){toast('📀 Weave Disk dropped: '+WEAVES[item.wid].name+'!');setTimeout(()=>SFX.quest(),50);}const m=new THREE.Mesh(lootGeo,MB(RAR[item.r].h));const y=heightAt(x,z);m.position.set(x,y+0.7,z);scene.add(m);const b=makeBeam(RAR[item.r].h,item.r>=6?45:item.r>=4?14:item.r>=2?7:3.5,item.r>=6?0.8:item.r>=4?0.45:0.25,item.r>=4?0.6:0.4);if(item.r>=6)ringFx(x,z,0x59c8ff,6,1.5);b.position.set(x,y,z);
  loots.push({item,m,b,x,z,exp:T+120});}
function updLoot(dt){for(let i=loots.length-1;i>=0;i--){const l=loots[i];l.m.rotation.y+=dt*2;l.m.position.y=heightAt(l.x,l.z)+0.7+Math.sin(T*3)*0.12;
  const d=Math.hypot(l.x-P.pos.x,l.z-P.pos.z);
  if(d<2.2&&!P.dead&&lootAuto(l))continue;
  if(T>l.exp)lootRemove(l);}
  lootSoldFlush(dt);if(panelOpen==='loot'&&lootAnchor&&!lootPile(lootAnchor).length)renderLoot();}

/* ---------------- missions ---------------- */
const TERMINAL={x:-7,z:-9.3,label:'Missions'},VENDOR={x:8,z:-9.2,label:'Trade'};
const OBJS=['Survey Drone Core','Vyre Sample Case','Combine Data Spike','Lost Courier Satchel','Prospector\'s Logbook','Med-Supply Crate'];
function availTypes(){const L=[{t:'skitter',lv:2,min:1}];if(P.level>=3)L.push({t:'raider',lv:4.5,min:3});if(P.level>=6)L.push({t:'mauler',lv:8,min:6});return L;}
/* Mission difficulty (slider) and preferred reward. P.mprefs={diff:0..4,pref:'any'|'weapon'|'armour'|'implant'|'disk'} */
const MDIFF=[{n:'Easy',lv:-2,cnt:0.7,rew:0.75,rar:0,c:'#6dff8a'},{n:'Normal',lv:0,cnt:1,rew:1,rar:5,c:'#cfcfcf'},{n:'Hard',lv:1,cnt:1.3,rew:1.4,rar:15,c:'#ffc85a'},{n:'Veteran',lv:2,cnt:1.6,rew:1.9,rar:25,c:'#ff9a2a'},{n:'Brutal',lv:3,cnt:2,rew:2.6,rar:40,c:'#ff5a4a'}];
const MPREF={any:'Any',weapon:'🔫 Weapon',armour:'🦺 Armour',implant:'🧠 Implant',disk:'📀 Weave Disk'};
const mprefs=()=>P.mprefs||(P.mprefs={diff:1,pref:'any'});
function genMission(){const mp=mprefs();const D=MDIFF[clamp(mp.diff|0,0,4)];const eLv=clamp(P.level+D.lv,1,MAXLVL+2);const xr=eLv>=31;const rim=!xr&&eLv>=21&&gateOpen('hoarlight');const hi=!rim&&!xr&&eLv>=11&&gateOpen('farwatch');
  const base={diff:mp.diff|0,pref:mp.pref,lv:eLv,rar:D.rar,id:'m'+uid()};const tag='['+D.n+'] ';
  if(Math.random()<0.55){const t=xr?pick(xrTypes(eLv)):rim?pick(['burrower','frostcaller','shambler','sentinel']):hi?pick(['stalker','shardcaller','brute']):eLv<=3?'skitter':eLv<=6?'raider':'mauler';const n=Math.max(2,Math.round(randi(hi||rim||xr?3:4,hi||rim||xr?5:6)*D.cnt));
    const zr=t==='skitter'?[60,105]:t==='raider'?[110,150]:[168,200];const r=rand(zr[0],zr[1]),a=rand(0,6.28);const tmp=xr?xrSpot(eLv):rim?rimeSpot(eLv):hi?gloamSpot(eLv):{x:Math.cos(a)*r,z:Math.sin(a)*r};collide(tmp,2);
    return facFlavour(Object.assign(base,{kind:'kill',etype:t,need:n,have:0,stage:'active',x:tmp.x,z:tmp.z,title:tag+'Cull: '+n+' '+ETYPES[t].name+'s',
      desc:pick(['The Combine wants the trade route cleared.','Prospectors report attacks near the dig sites.','Outpost security is paying a bounty.','A Combine convoy is due through here. Clear the way.'])+' Camp marked on your map. Enemies Lv '+eLv+'.',cr:Math.round(n*(6+eLv*5)*D.rew),xp:Math.round(xpNeed(P.level)*rand(0.25,0.35)*D.rew),item:mp.diff>=2||Math.random()<0.65}));}
  const r=clamp(55+eLv*13,55,195)+rand(-10,15),a=rand(0,Math.PI*2);let x=Math.cos(a)*r,z=Math.sin(a)*r;const tmp=xr?xrSpot(eLv):rim?rimeSpot(eLv):hi?gloamSpot(eLv):{x,z};collide(tmp,1.5);x=tmp.x;z=tmp.z;
  const obj=pick(OBJS);return facFlavour(Object.assign(base,{kind:'fetch',x,z,obj,stage:'active',guards:hi||rim||xr||r>70||mp.diff>=2,nGuards:Math.max(1,Math.round(2*D.cnt)),title:tag+'Recover: '+obj,desc:'Signal lost '+Math.round(Math.hypot(x,z))+'m out '+(xr?'in '+xrRegionName(eLv):rim?'in the Rimefall Expanse':hi?'in the Duskcrown Highlands':'in the Reach')+'. Find it and bring it back. Guards Lv '+eLv+'.',cr:Math.round((20+eLv*14)*D.rew),xp:Math.round(xpNeed(P.level)*rand(0.3,0.4)*D.rew),item:mp.diff>=2||Math.random()<0.6}));
}
function spawnCamp(m){if(!m||m.kind!=='kill'||m.campSpawned||m.x==null)return;const n=Math.max(0,m.need-m.have);for(let i=0;i<n;i++){const e=makeEnemy(m.etype,m.x+rand(-6,6),m.z+rand(-6,6),m.lv||P.level,true);e.mis=m.id;}m.campSpawned=true;}
function spawnCache(m){clearCache(m);const y=heightAt(m.x,m.z);const g=new THREE.Group();part(g,geoBox,M(0x4f6b80),0,0.45,0,1.2,0.9,0.8);part(g,geoBox,MB(0x5ff2ff),0,0.6,0.41,0.8,0.15,0.02);part(g,geoBox,M(0xffc85a),0,0.92,0,1.25,0.08,0.85);
  g.position.set(m.x,y,m.z);scene.add(g);const r=QRT[m.id]||(QRT[m.id]={objs:[],mobs:[]});r.cache={g,x:m.x,z:m.z};
  if(m.guards&&!m.guardsSpawned){const d=Math.hypot(m.x,m.z);const ty=xmBand0(m.x,m.z)>=0?pick(xrTypes(xmLv(m.x,m.z))):d>870&&Math.max(Math.abs(m.x),Math.abs(m.z))>560?pick(xrTypes(m.x>0?41:31)):d>620?pick(['burrower','shambler','frostcaller']):d>400?pick(['stalker','brute']):d>160?'mauler':d>105?'raider':'skitter';const n=m.nGuards||(ty==='mauler'?1:2);
    for(let i=0;i<n;i++){const lv=m.lv||clamp(P.level+randi(-1,0),1,MAXLVL);makeEnemy(ty,m.x+rand(-5,5),m.z+rand(-5,5),lv,true);}m.guardsSpawned=true;}}
// m: one contract, or nothing = every quest object (world reset)
function clearCache(m){if(!m){for(const k in QRT){const r=QRT[k];for(const o of r.objs||[])scene.remove(o.g);if(r.cache)scene.remove(r.cache.g);if(r.ally&&!r.ally.dead)removeAlly(r.ally);delete QRT[k];}return;}
  const r=QRT[m.id];if(r&&r.cache){scene.remove(r.cache.g);r.cache=null;}}
function acceptMission(i){const m=missionOffers[i];if(!m)return;if(qFull()){warn('Mission log full ('+MAXQ+'). Finish or abandon one first.');return;}m.src='contract';m.track=true;P.quests.push(m);missionOffers.splice(i,1);if(m.kind==='fetch')spawnCache(m);else spawnCamp(m);SFX.quest();banner('MISSION ACCEPTED',m.title);closePanel();save();}
function abandonMission(id){const m=id?contracts().find(q=>q.id===id):contracts()[0];if(!m){openTerminal();return;}clearCache(m);delete QRT[m.id];for(const e of enemies.slice())if(e.mis===m.id&&e.state!=='chase')removeEnemy(e);P.quests.splice(P.quests.indexOf(m),1);save();if(panelOpen==='term')openTerminal();}
// preferred reward: 75% chance to get the chosen kind; harder contracts roll better rarity
function missionReward(m){const L=P.level,boost=15+(m.rar||0);let k=m.pref&&m.pref!=='any'&&Math.random()<0.75?m.pref:pick(['weapon','armour','implant','disk']);
  const rr=Math.max(1,rollRarity(boost));
  if(k==='disk'){const d=genDiskForLevel(L+1+((m.diff|0)>=3?1:0),'mission');if(d)return d;k='implant';}
  if(k==='implant')return genImplant(L*5+randi(0,4)+(m.diff|0)*2,null,rr);
  if(k==='weapon')return genItem(L+((m.diff|0)>=3?1:0),'weapon',rr);
  return genItem(L+((m.diff|0)>=3?1:0),pick(ASLOTS),rr);}
function turnIn(id){const L=contracts().filter(m=>m.stage==='return'&&(!id||m.id===id));if(!L.length)return;for(const m of L){P.credits+=m.cr;gainXp(m.xp);let txt='+'+m.cr+'¢  +'+m.xp+' XP';
  if(m.fac&&m.rep){gainRep(m.fac,m.rep);txt+='  +'+m.rep+' '+FACTIONS[m.fac].short+' rep';}
  if((m.diff|0)>=3&&!(P.vehicles||[]).includes('skiff')&&Math.random()<0.25){grantVehicle('skiff','Contract bonus');txt+='  +Dust Skiff';}
  if(m.item){const it=missionReward(m);if(P.inv.length<24){P.inv.push(it);txt+='  +'+it.name;}}
  txt+=rmClassicDone(m);
  P.quests.splice(P.quests.indexOf(m),1);if(P.qfocus===m.id)P.qfocus=null;banner('MISSION COMPLETE',txt);log('Reward: '+esc(txt));}offersAt=-999;SFX.quest();save();openTerminal();}

/* ---------------- panels ---------------- */
const pbody=$('#pbody');
let panelAt=0;function openPanel(title,html,kind){if(!panelOpen)panelAt=performance.now();panelOpen=kind;$('#ptitle').textContent=title;pbody.innerHTML=html;$('#panel').classList.remove('hidden');resetInput();}
function closePanel(){if(panelOpen==='map')mapHide();panelOpen=null;$('#panel').classList.add('hidden');canvas.focus();}
$('#pclose').addEventListener('click',()=>{SFX.ui();closePanel();});
$('#panel').addEventListener('click',e=>{if(e.target.id==='panel'&&performance.now()-panelAt>500)closePanel();});
let invSel=null,invTab='gear';
const isImp=it=>!!it&&it.kind==='imp';
const isDisk=it=>!!it&&it.kind==='disk';
function icoOf(it){if(it&&it.kind==='cloth')return CLOTH[it.cid]?CLOTH[it.cid].ic:'👕';return isImp(it)?IMPDEF[it.slot].ic:isDisk(it)?'📀':it.slot==='weapon'&&WTYPES[it.wt]?WTYPES[it.wt].ic:SLOTICON[it.slot]||'📦';}
const profOk=it=>!isDisk(it)||it.prof==='any'||it.prof===P.prof;
function reqMet(it){return profOk(it)&&tierOk(it)&&(it.req||[]).every(r=>eff(r.s)>=r.v);}
function firstMiss(it){return (it.req||[]).find(r=>eff(r.s)<r.v);}
function reqChips(it){const tt=itemTier(it);return (tt>1?`<span class="rq tier ${tierOk(it)?'ok':'no'}" title="${tierOk(it)?'Tier requirement met':esc(tierMiss(it))}">T${tt}</span>`:'')+(isDisk(it)?`<span class="rq ${profOk(it)?'ok':'no'}">${it.prof==='any'?'ALL':esc(profName(it.prof)).toUpperCase()}</span>`:'')+(it.req||[]).map(r=>{const ok=eff(r.s)>=r.v;return `<span class="rq ${ok?'ok':'no'}" title="${ok?'Requirement met':'Need '+(r.v-eff(r.s))+' more '+STATN[r.s]}">${SHORT[r.s]} ${r.v}</span>`;}).join('');}
function reqHtml(it){const tt=itemTier(it),tl=tt>1?`<div class="${tierOk(it)?'up':'down'}">${tierOk(it)?'✔':'✖'} Requires Tier ${tt} · ${TIERS[tt].n} <span style="opacity:.75">(level ${TIERS[tt].lv}+, you are Tier ${pTier()})</span></div>`:'';if(!it.req||!it.req.length)return tl||'<div style="opacity:.7">No requirements</div>';
  return tl+(isDisk(it)?`<div class="${profOk(it)?'up':'down'}">${profOk(it)?'✔':'✖'} Profession: ${profName(it.prof)}${profOk(it)?'':' · <b>'+profName(it.prof)+' only</b>'}</div>`:'')+it.req.map(r=>{const h=eff(r.s),ok=h>=r.v;const need=ok?'':'Need '+(r.v-h)+' more '+STATN[r.s];
    return `<div class="${ok?'up':'down'}" title="${ok?'Requirement met':need}">${ok?'✔':'✖'} ${STATN[r.s]} ${r.v} <span style="opacity:.75">(you have ${h})</span>${ok?'':' · <b>'+need+'</b>'}</div>`;}).join('');}
function isEquipped(it){return !!it&&((P.eq[it.slot]&&P.eq[it.slot].id===it.id)||(P.imps[it.slot]&&P.imps[it.slot].id===it.id));}
function twTag(it){return !reqMet(it)?'<span class="tw" title="Requirements no longer met, but it stays installed and keeps working">⚡ twinked</span>':'';}
function findItem(id){if(!id)return null;return P.inv.find(i=>i.id===id)||Object.values(P.eq).find(i=>i&&i.id===id)||Object.values(P.imps).find(i=>i&&i.id===id)||null;}
function itemRow(it,extra,sel,act){return `<button class="item${sel?' sel':''}" data-act="${act||'sel'}" data-id="${it.id}"><span class="ico" style="color:${RAR[it.r].c};border:1px solid ${RAR[it.r].c}">${icoOf(it)}</span><span style="min-width:0"><div class="nm" style="color:${RAR[it.r].c}">${esc(it.name)}</div><div class="st">${stackN(it)>1?'<b class="stk">×'+stackN(it)+'</b> · ':''}${isJunkItem(it)?'<i class="jtag" style="margin:0 4px 0 0">Junk</i>':''}<span class="ty">${isImp(it)?IMPDEF[it.slot].n+' implant ('+it.slot+')':isDisk(it)?profName(it.prof)+' Weave':itemType(it)}</span> · ${isImp(it)?'':isDisk(it)?'tier level '+it.lvl+' · ':'Lv '+it.lvl+' · '}${RAR[it.r].n} · ${itemLines(it).join(' · ')}</div><div class="rqs">${reqChips(it)}</div></span>${extra||''}</button>`;}
function cmpLine(it){if(isImp(it))return '';const cur=P.eq[it.slot];if(!cur||cur.id===it.id)return '';const a=it.dmg||it.armor||0,b=cur.dmg||cur.armor||0;if(!a&&!b)return '';const d=a-b;return `<div class="${d>=0?'up':'down'}">${d>=0?'▲':'▼'} ${Math.abs(d)} ${it.dmg?'damage':'armour'} vs equipped</div>`;}
function statsHtml(){return `<div class="stats"><b>${esc(P.name)}</b> · Level ${P.level} ${PROFS[P.prof].name} · <b style="color:#ffc85a">${P.sp} skill points</b><br>🏃 Run Speed <b>${eff('run')}</b> → move speed <b class="up">+${S.runPct}%</b>${T<(P.slowUntil||0)?' <span class="down">(slowed −'+Math.round((1-P.slowAmt)*100)+'%)</span>':''} · cap +${RUN_CAP}%<br>Health ${S.maxHp} · Energy ${S.maxEn} · Armour ${S.armor} (${Math.round(S.armor/(S.armor+100)*100)}% reduction)<br>Weapon damage ${S.dmg} (${S.wt&&WTYPES[S.wt]?WTYPES[S.wt].n:'standard'}${S.wt&&WTYPES[S.wt]&&!WTYPES[S.wt].aff.includes(P.prof)?', off-profession −20%':''}) · ${STATN[PROFS[P.prof].dmgSkill]} ${eff(PROFS[P.prof].dmgSkill)} (×${skillF().toFixed(2)} damage) · Crit ${S.crit}% · Power +${S.power}% · <b style="color:#59c8ff">Dodge ${S.dodge}%</b>${S.dr?' · Damage reduction '+S.dr+'%':''}<br>${ATTRS.map(a=>SHORT[a]+' '+eff(a)).join(' · ')}<br>${SKILLS.map(a=>SHORT[a]+' '+eff(a)).join(' · ')}<br>${stage2StatLine()}<br>Credits ${P.credits}¢ · Med-stims ${P.stims} · Kills ${P.kills}</div>`;}
function buffList(){if(!P.buffs.length)return '<div style="opacity:.6">No active buffs.</div>';return P.buffs.map(b=>`<div class="slot"><span class="ico">${b.icon}</span><span><div class="nm">${esc(b.name)} <span style="opacity:.7">${fmtT(b.until-T)}</span></div><div class="st">${Object.keys(b.mods).map(k=>'+'+b.mods[k]+' '+STATN[k]).join(' · ')}</div></span></div>`).join('');}
function fmtT(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function typeNote(it){if(!it||it.kind!=='gear')return '';if(it.slot==='weapon'){const W=WTYPES[it.wt];if(!W)return '';const ok=W.aff.includes(P.prof);
  return `<div style="font-size:12px;opacity:.85">Uses ${STATN[W.sk]} · best for ${W.aff.map(p=>PROFS[p].name).join(', ')}${ok?'':' · <span class="down">off-profession: −20% damage</span>'}</div>`;}
  const F=AFAM[it.fam||'medium'];return `<div style="font-size:12px;opacity:.85">${F.n} armour: leans ${F.lean.slice(0,4).map(x=>SHORT[x]||STATN[x]).join('/')} · suits ${F.aff.map(p=>PROFS[p].name).join(', ')}</div>`;}
function setHtml(it){if(!it||!it.set||!SETS[it.set])return '';const st=SETS[it.set];const have=(S.setCount&&S.setCount[it.set])||0;
  return `<div class="setb"><b>${esc(st.name)} set (${have}/${st.pieces.length} equipped)</b>${Object.keys(st.bonus).map(n=>`<div class="${have>=+n?'up':''}" style="${have>=+n?'':'opacity:.6'}">${n} pieces: ${Object.keys(st.bonus[n]).map(k=>'+'+st.bonus[n][k]+' '+(k==='armor'?'Armour':STATN[k])).join(', ')}</div>`).join('')}<div style="opacity:.6;font-size:11px">${st.pieces.map(k=>UNIQUES[k].name).join(' · ')}</div></div>`;}
function srcHtml(it){if(!it||!it.src)return '';return `<div class="src">⛏ Source: ${esc(dunName(it.src))} · ${dunRange(it.src)}${it.dropBy?' · '+esc(it.dropBy):''}<br><span style="opacity:.75">${it.src.startsWith('dyna_')?'Dyna-exclusive: a rare drop from this named elite only.':'Dungeon-exclusive: never sold by traders or dropped in the open Reach.'}</span></div>`;}
function detailHtml(sel){if(!sel)return '<div class="det">Tap an item to see its details and requirements.</div>';
  const eqd=isEquipped(sel);const miss=firstMiss(sel);
  return `<div class="det"><b style="color:${RAR[sel.r].c}">${esc(sel.name)}</b><br><span style="opacity:.8">${isImp(sel)?'Quality Level '+sel.ql+' '+RAR[sel.r].n+' implant · '+sel.slot+' slot':isDisk(sel)?RAR[sel.r].n+' Weave Disk':'Level '+sel.lvl+' '+RAR[sel.r].n+' · '+itemType(sel)}</span><br>${itemLines(sel).filter(l=>!/^(Set|Source):/.test(l)).join('<br>')}${typeNote(sel)}${setHtml(sel)}${srcHtml(sel)}${cmpLine(sel)}
  <div class="h4" style="margin:8px 0 2px">Requirements ${eqd?'(checked when equipping)':'(your current skills, including buffs)'}</div>${reqHtml(sel)}
  ${eqd&&miss?'<div class="tw" style="display:block;margin-top:6px">⚡ Twinked: you no longer meet the requirements, but it stays installed and keeps working.</div>':''}
  <div style="color:#ffc85a;margin-top:4px">Sells for ${sel.value}¢${stackN(sel)>1?' each · stack of '+stackN(sel):''}${isJunkItem(sel)?' · <i class="jtag">Junk</i>: sold by 🗑 Sell Junk at any trader':''}</div>
  <div class="btns">${eqd?`<button class="sbtn alt" data-act="uneq">${isImp(sel)?'Remove':'Unequip'}</button>`:`<button class="sbtn${miss?' locked':''}" data-act="eq">${isImp(sel)?'Install':'Equip'}</button>${sellableKind(sel)?`<button class="sbtn alt" data-act="jtag">${isJunkItem(sel)?'Not junk':'🗑 Mark junk'}</button>`:''}<button class="sbtn alt" data-act="junk">Scrap</button>`}</div>
  ${!eqd&&miss?`<div class="down" style="margin-top:6px">Can't ${isImp(sel)?'install':'equip'} yet: need ${miss.v-eff(miss.s)} more ${STATN[miss.s]}. Try a buff (self-buff Weave, stims from the trader) or another implant that boosts it.</div>`:''}</div>`;}
function openInventory(){stackInv();
  const sel=findItem(invSel);
  const tabs=`<div class="tabs">${[['gear','🔫 Gear'],['imps','🧠 Implants'],['items','🧪 Consumables'],['bag','🧰 Parts']].map(([t,n])=>`<button data-act="itab" data-t="${t}" class="${invTab===t?'on':''}">${n}</button>`).join('')}<span style="margin-left:auto;align-self:center;font-size:13px;opacity:.8">Pack ${P.inv.length}/24</span></div>`;
  let html='';
  if(invTab==='bag'){html=tabs+partsHtml()+'<div style="display:flex;gap:8px;margin-top:8px"><button class="sbtn" data-act="craft">🛠 Open Tradeskills</button></div>';}
  else if(invTab==='items'){
    let rows=`<div class="slot"><span class="ico">💉</span><span><div class="nm">Med-stim ×${P.stims}</div><div class="st">Heals 40% health. Use with the 💉 button or Q.</div></span></div>`;
    for(const k in CONSUM){const c=CONSUM[k],n=P.consum[k]||0;if(c.craftOnly&&!n)continue;const m=c.mods(P.level);rows+=`<div class="slot"><span class="ico">${c.icon}</span><span style="flex:1"><div class="nm">${c.name} ×${n}</div><div class="st">${Object.keys(m).map(x=>'+'+m[x]+' '+(x==='dr'?'% damage reduction':STATN[x])).join(' · ')} · ${Math.round((c.dur||180)/60)} min</div></span><button class="sbtn" data-act="usec" data-k="${k}" ${n>0?'':'disabled'}>Use</button></div>`;}
    rows+=vehInvHtml();{const cs=P.inv.filter(x=>x.kind==='cloth');if(cs.length)rows+='<div class="h4" style="margin-top:10px">Social clothing</div>'+cs.map(it=>itemRow(it,'<span class="pr">Add to wardrobe</span>',false,'cadd')).join('');}
    const disks=P.inv.filter(isDisk);if(disks.length)rows+='<div class="h4" style="margin-top:10px">Weave Disks</div>'+disks.map(d=>itemRow(d,'',false,'book')).join('')+'<button class="sbtn" data-act="book">📖 Open Weave Book to learn</button>';
    html=tabs+`<div class="cols"><div><div class="h4">Consumables</div>${rows}</div><div><div class="h4">Active buffs</div>${buffList()}<div class="h4" style="margin-top:12px">Twinking</div><div class="stats">Buffs raise your skills for a while. Use them, then install gear or implants you normally couldn't. Once installed they stay on after the buffs wear off.</div></div></div>`;
  }else{
    const imp=invTab==='imps';const slots=imp?IMPSLOTS:GSLOTS;
    const left=slots.map(sl=>{const it=imp?P.imps[sl]:P.eq[sl];return it?itemRow(it,twTag(it),it.id===invSel):`<div class="slot"><span class="ico">${imp?IMPDEF[sl].ic:SLOTICON[sl]}</span><span style="opacity:.5">Empty ${imp?IMPDEF[sl].n+' ('+sl+')':SLOTN[sl]} slot</span></div>`;}).join('');
    const pack=P.inv.filter(i=>imp?isImp(i):i.kind==='gear').sort((a,b)=>(reqMet(b)-reqMet(a)));
    const right=pack.map(i=>itemRow(i,'',i.id===invSel)).join('')||`<div style="opacity:.6">${imp?'No implants in your pack. Enemies, missions and the trader have them.':'No gear in your pack. Enemies drop it.'}</div>`;
    html=tabs+`<div class="cols"><div><div class="h4">${imp?'Installed implants':'Equipped'}</div>${left}${imp?'<div class="stats" style="opacity:.8;margin-top:6px">Installing checks your <b>current</b> Treatment and attribute, so buffs and other implants count. Install them in the right order: one implant\'s bonus can unlock the next.</div>':''}</div><div><div class="h4">Selected</div>${detailHtml(sel)}<div class="h4" style="margin-top:12px">Pack</div>${right}${lootFChips()}</div></div>`;
  }
  openPanel('INVENTORY',html,'inv');
}
function equip(id){const i=P.inv.findIndex(x=>x.id===id);if(i<0)return false;const it=P.inv[i];if(P.morph&&it.slot==='weapon'){warn('Can\'t swap weapons while morphed');return false;}
  if(!tierOk(it)){warn('🔒 '+tierMiss(it)+': you are Tier '+pTier()+'.');return false;}
  const miss=firstMiss(it);if(miss){warn('Need '+(miss.v-eff(miss.s))+' more '+STATN[miss.s]);return false;}
  if(it.fac&&!facCanUse(it)){warn(FACTIONS[it.fac].name+' gear: '+facUseNeed(it));return false;}
  P.inv.splice(i,1);const tgt=isImp(it)?P.imps:P.eq;if(tgt[it.slot])P.inv.push(tgt[it.slot]);tgt[it.slot]=it;
  const f=P.hp/S.maxHp;calcStats();P.hp=Math.min(S.maxHp,Math.max(P.hp,f*S.maxHp));SFX.loot();toast((isImp(it)?'Installed ':'Equipped ')+it.name);refreshGearVisual();save();return true;}
function unequip(id){const it=findItem(id);if(!it||!isEquipped(it))return;if(P.morph&&it.slot==='weapon'&&!isImp(it)){warn('Can\'t swap weapons while morphed');return;}if(P.inv.length>=24){warn('Inventory full');return;}
  const tgt=isImp(it)?P.imps:P.eq;tgt[it.slot]=null;P.inv.push(it);calcStats();refreshGearVisual();save();}
function openSkills(){
  const pr=PROFS[P.prof];
  const row=(s,isA)=>{const bought=isA?(P.ab[s]||0):(P.sb[s]||0);const cap=isA?attrCap(s):skillCap(s);const c=costOf(s);const bon=S.bon[s]||0;const base=baseOf(s);const trick=isA?0:eff(s)-base-bought-bon;const dis=P.sp<c?'disabled':'';const atCap=bought>=cap,over=bought>cap;
    return `<div class="sk"><div class="skn"><b>${STATN[s]}</b> <span class="cst c${c}">${c} SP</span><div class="st">${base} base${bought?' + '+bought+' trained':''}${trick?' + '+trick+' from attributes':''}${bon?` <span class="${bon>0?'up':'down'}">+${bon} gear/implants/buffs</span>`:''}</div>${s==='run'?`<div class="st"><b class="up">Move speed +${S.runPct}%</b> on foot (cap +${RUN_CAP}%) · ${PROFS[P.prof].runCap>1?'your profession trains it furthest':PROFS[P.prof].runCap<1?'your profession can only train it to '+Math.round(PROFS[P.prof].runCap*100)+'% of the normal cap':'normal training cap'}</div>`:''}<div class="st" style="opacity:.6">${STATDESC[s]}</div></div><div class="skv">${eff(s)}<div class="st${atCap?' capd':''}" title="Trained / cap (Tier ${pTier()})">${bought}/${cap}${over?'<br><span class="capw">over cap (kept)</span>':atCap?'<br><span class="capw">CAP</span>':''}</div></div><button class="sbtn" data-act="raise" data-s="${s}" data-n="1" ${dis}>+1</button><button class="sbtn alt" data-act="raise" data-s="${s}" data-n="5" ${dis}>+5</button></div>`;};
  const html=`<div class="namebar"><span>👤</span><b>${esc(P.name)}</b><span style="opacity:.7">Lv ${P.level} ${esc(PROFS[P.prof].name)}</span><button class="sbtn alt" data-act="rename">✏️ Rename</button>${xpLockBtn()}</div>${tierBar()}<div class="sphead"><span>Unspent skill points: <b>${P.sp}</b></span><span style="opacity:.75;font-size:13px">You get ${SP_LVL} per level. The cost per point depends on your profession and breed (green = cheap). Training caps rise each level and each tier; your breed (${breedOf(P).name}) raises or lowers the attribute caps.</span></div>
  <div class="cols"><div><div class="h4">Attributes</div>${ATTRS.map(a=>row(a,true)).join('')}</div><div><div class="h4">Skills</div>${SKILLS.map(a=>row(a,false)).join('')}<div class="h4" style="margin-top:10px">Active buffs</div>${buffList()}</div></div>
  <div class="h4" style="margin-top:12px">Summary</div>${statsHtml()}<button class="sbtn alt" style="margin-top:10px" data-act="respec">Reset all points (${20*P.level}¢)</button>`;
  openPanel('SKILLS · '+PROFS[P.prof].name.toUpperCase(),html,'skills');
}
function raise(s,n){const isA=ATTRS.includes(s);const c=costOf(s);const cap=isA?attrCap(s):skillCap(s);const tb=isA?P.ab:P.sb;let k=0;
  if((tb[s]||0)>=cap){capMsgFor(s,cap,tb[s]||0);return 0;}
  for(let i=0;i<n;i++){if(P.sp<c||(tb[s]||0)>=cap)break;P.sp-=c;tb[s]=(tb[s]||0)+1;k++;}if(k){calcStats();save();}if(k<n&&(tb[s]||0)>=cap)capMsgFor(s,cap,tb[s]);return k;}
// clear cap message: names the cap, the tier, and when the cap next rises (next level and next tier)
function capMsgFor(s,cap,have){const t=pTier(),nx=TIERS[t+1];const isA=ATTRS.includes(s);const m='🔒 '+STATN[s]+' is at its cap ('+(have>cap?have+' trained, over the cap of '+cap+': kept, but no more raises':cap)+') for level '+P.level+' · Tier '+t+' '+TIERS[t].n+'. '+(P.level<MAXLVL?'Each level adds +'+(isA?2:5)+'. ':'')+(nx?'Tier '+(t+1)+' ('+nx.n+', level '+nx.lv+') adds +'+((isA?nx.a-TIERS[t].a:nx.s-TIERS[t].s))+'.':'');warn(m);TIERUP.capMsg=m;return m;}
function tierBar(){const t=pTier(),d=TIERS[t],nx=TIERS[t+1];return `<div class="tierbar"><span class="tb-t">T${t}</span><span><b>Tier ${t} · ${esc(d.n)}</b><br><span class="tb-s">Caps now: attributes ${2+2*P.level+d.a} (× breed), skills ${5+5*P.level+d.s}${nx?` · Next: <b>Tier ${t+1} ${esc(nx.n)}</b> at level ${nx.lv} (+${nx.a-d.a} attribute / +${nx.s-d.s} skill caps, Tier ${t+1} gear)`:''}</span></span></div>`;}
function respec(){const price=20*P.level;if(P.credits<price){warn('Not enough credits');return;}P.credits-=price;P.ab={};P.sb={};P.sp=spTotal(P.level);calcStats();save();toast('Points refunded. Equipped items stay on.');}
function openTerminal(){
  if(T-offersAt>90||missionOffers.length===0){missionOffers=[genMission(),genMission(),genMission()];offersAt=T;}
  RM.remote=RM._rem||(panelOpen==='term'&&RM.remote);RM._rem=false;const ttl=RM.remote?'🎲 MISSION BOARD':'COMBINE CONTRACT TERMINAL';
  if(RM.tab==='writs'){openPanel(ttl,rmWritHtml(),'term');return;}
  let h=rmHead()+(RM.remote?'<div class="stats">Remote view: accept and reroll here; claim rewards at any 📟 terminal (Halden\'s Rest or an outpost).</div>':'')+rmBoardHtml()+terminalStoryCard();const m=P.mission;const mp=mprefs();const D=MDIFF[mp.diff|0];
  h+=`<div class="mis msl" id="rmset"><div class="h4" style="margin:0 0 4px">Mission difficulty: <b style="color:${D.c}">${D.n}</b> · enemies Lv ${clamp(P.level+D.lv,1,MAXLVL)} · ×${D.cnt} enemies · ×${D.rew} XP/credits${D.rar?' · better loot':''}</div>
    <div style="display:flex;align-items:center;gap:10px"><button class="sbtn alt" data-act="mdiff" data-d="-1">−</button><input type="range" id="mdiff" min="0" max="4" step="1" value="${mp.diff|0}" style="flex:1"><button class="sbtn alt" data-act="mdiff" data-d="1">+</button></div>
    <div style="display:flex;justify-content:space-between;font-size:11px;opacity:.75;padding:0 52px">${MDIFF.map(d=>`<span style="color:${d.c}">${d.n}</span>`).join('')}</div>
    <div class="h4" style="margin:8px 0 4px">Preferred reward</div><div class="tabs" style="margin:0">${Object.keys(MPREF).map(k=>`<button data-act="mpref" data-p="${k}" class="${mp.pref===k?'on':''}">${MPREF[k]}</button>`).join('')}</div></div>`;
  h+=rmFocusHtml();
  const CL=contracts();if(CL.length){h+=`<div class="h4">Active contracts (${CL.length}) · mission log ${(P.quests||[]).length}/${MAXQ}</div>`;
    h+=CL.map(m=>`<div class="mis"><span class="obadge">Optional</span> <b>${esc(m.title)}</b><p>${esc(m.desc)}</p>${m.kind==='kill'?`<div>Progress: ${m.have}/${m.need}</div>`:''}<div>Reward: ${m.cr}¢ · ${m.xp} XP${m.item?' · bonus implant or gear':''}</div><div class="btns" style="margin-top:8px;display:flex;gap:8px">${m.stage==='return'?(RM.remote?'<span class="down">Claim at any 📟 terminal</span>':`<button class="sbtn" data-act="turnin" data-id="${m.id}">Claim reward</button>`):`<button class="sbtn alt" data-act="abandon" data-id="${m.id}">Abandon</button>`}</div></div>`).join('');}
  h+=`<div class="h4">📋 Quick contracts: cull &amp; recover, XP, credits &amp; loot${qFull()?' (mission log full: '+MAXQ+')':' · take several at once'}</div>`;
  missionOffers.forEach((o,i)=>{h+=`<div class="mis"><span class="obadge">Optional</span> <b>${esc(o.title)}</b><p>${esc(o.desc)}</p><div>Reward: ${o.cr}¢ · ${o.xp} XP${o.rep?` · <b style="color:${FACTIONS[o.fac].col}">+${o.rep} ${FACTIONS[o.fac].short} rep</b>`:''}${o.item?' · bonus '+(o.pref&&o.pref!=='any'?MPREF[o.pref].replace(/^\S+ /,'').toLowerCase()+' (likely)':'item'):''}</div>${qFull()?'':`<button class="sbtn" style="margin-top:8px" data-act="accept" data-i="${i}">Accept</button>`}</div>`;});
  h+=`<div class="mis" style="border-color:rgba(255,154,42,.4)"><b>🚪 Capped dungeons</b><p>${Object.values(DUNGEONS).map(D=>`<b style="color:#f3e6d3">${esc(D.name)}</b> ${dunRange(D.id)}${D.gate&&!gateOpen(D.gate)?' <span class="down">· 🔒 story step '+(STEP[GATES[D.gate].step].i+1)+'</span>':P.level>D.cap?' <span class="down">· too experienced</span>':P.level<D.minLvl?' <span style="opacity:.7">· not yet</span>':' <span class="up">· open to you</span>'}`).join('<br>')}<br>Over the cap you can't enter, so twink: buff up, wear gear and implants above your level, and clear at the cap for a better boss loot bonus.</p></div>`;
  openPanel(ttl,h,'term');
}
let vendTab='buy';
let vendConfirm=null;
function openVendor(){
  const L=P.level;
  if(T-stockAt>120||stockLvl!==L||vendorStock.length===0||stockCtx!==VEND.ctx){vendorStock=[];stockCtx=VEND.ctx;
    {const pool=Object.values(WEAVES).filter(w=>!w.starter&&!w.excl&&!w.rare&&(typeof wvVend!=='function'||wvVend(w))&&w.lvl<=L+2&&(w.prof===P.prof||w.prof==='any')&&!P.known.includes(w.id)).sort(()=>Math.random()-0.5);pool.slice(0,3).forEach(w=>vendorStock.push(genDisk(w.id)));}vendorStock.push(genItem(L,'weapon',rollRarity(10),{wt:pick(wtAff(P.prof))}),genItem(L,'weapon',rollRarity(10)),genItem(L,pick(ASLOTS),rollRarity(10),{fam:PROF_FAM[P.prof]}),genItem(L,pick(ASLOTS),rollRarity(10)),genItem(L+1,'gear',rollRarity(10)));
    (L<=10?[Math.max(1,L*2),L*4+1,L*5+3,L*7+4,L*9+6]:[L*3,L*4,L*4+6,L*5-2,L*5]).forEach(q=>vendorStock.push(genImplant(q,null,rollRarity(10))));if(typeof hubStock==='function')hubStock(vendorStock,L);stockAt=T;stockLvl=L;}
  const price=it=>it.kind==='gear'?it.value*4:it.value*3;
  let h=`<div class="tabs"><button data-act="tab" data-t="buy" class="${vendTab==='buy'?'on':''}">Buy</button><button data-act="tab" data-t="sell" class="${vendTab==='sell'?'on':''}">Sell</button><span style="margin-left:auto;display:flex;gap:8px;align-items:center">${sellJunkBtn()}<span style="color:#ffc85a;font-weight:800">${P.credits}¢</span></span></div>`;
  if(vendTab==='buy'){const sp=10+L*2;
    h+=`<div class="h4">Supplies & buff stims</div><button class="item" data-act="buystim"><span class="ico">💉</span><span><div class="nm">Med-stim</div><div class="st">Heals 40% health. You have ${P.stims}.</div></span><span class="pr">${sp}¢</span></button>`;
    for(const k in CONSUM){const c=CONSUM[k];if(c.craftOnly)continue;const m=c.mods(L);h+=`<button class="item" data-act="buyc" data-k="${k}"><span class="ico">${c.icon}</span><span><div class="nm">${c.name}</div><div class="st">${Object.keys(m).map(x=>'+'+m[x]+' '+SHORT[x]).join(' · ')} for 3 min. You have ${P.consum[k]||0}.</div></span><span class="pr">${c.price(L)}¢</span></button>`;}
    h+=vehVendorHtml();h+=tsVendorHtml();
    h+='<div class="h4" style="margin-top:10px">Weave Disks (learn new Weaves)</div>'+(vendorStock.filter(isDisk).map(it=>itemRow(it,`<span class="pr">${price(it)}¢</span>`,false,'buy')).join('')||'<div style="opacity:.6">No disks you need right now.</div>');
    h+='<div class="h4" style="margin-top:10px">Implants (several QLs: the high ones need twinking)</div>'+vendorStock.filter(isImp).map(it=>itemRow(it,`<span class="pr">${price(it)}¢</span>`,false,'buy')).join('');
    h+='<div class="h4" style="margin-top:10px">Gear</div>'+vendorStock.filter(i=>i.kind==='gear').map(it=>itemRow(it,`<span class="pr">${price(it)}¢</span>`,false,'buy')+cmpLine(it)).join('');}
  else{const vc=vendConfirm&&P.inv.find(x=>x.id===vendConfirm);if(!vc)vendConfirm=null;
    if(vc){const pn=profName(diskProf(vc));h+=`<div class="mis sellconf" id="sellConf" style="border-color:#ffd34a"><b>Sell ${esc(vc.name)} for ${vc.value}¢?</b><div style="font-size:13px;margin:4px 0">📀 This disc is for a <b>${esc(pn)}</b>: ${esc(PROFS[P.prof].name)}s can't learn it, but a ${esc(pn)} can. Tip: store it in the 🏦 bank instead (only ${esc(pn)}s see it there).</div><div style="display:flex;gap:8px"><button class="sbtn" data-act="sellno">Keep it</button><button class="sbtn alt" data-act="sellok" data-id="${vc.id}">Sell anyway</button></div></div>`;}
    h+=P.inv.map(it=>itemRow(it,`<span class="pr">${isDisk(it)&&!diskUsable(it)?'<span style="font-size:11px;color:#ffd34a">'+esc(profName(diskProf(it)))+' disc · </span>':''}${it.value}¢</span>`,false,'sell')).join('')||'<div style="opacity:.6">Nothing to sell. Equipped gear and installed implants can\'t be sold.</div>';
    }
  openPanel(vendTitle(),h,'vend');
  vendorStock._price=price;
}
pbody.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;SFX.ui();
  if(a==='sel'){invSel=b.dataset.id;openInventory();}
  else if(a==='itab'){invTab=b.dataset.t;invSel=null;openInventory();}
  else if(a==='eq'){equip(invSel);openInventory();}
  else if(a==='uneq'){unequip(invSel);openInventory();}
  else if(a==='jtag'){const it=P.inv.find(x=>x.id===invSel);if(it){it.junk=!isJunkItem(it);toast(it.junk?'Tagged as junk':'No longer junk');save();}openInventory();}
  else if(a==='junk'){const i=P.inv.findIndex(x=>x.id===invSel);if(i>=0){P.credits+=Math.ceil(P.inv[i].value/2)*stackN(P.inv[i]);P.inv.splice(i,1);invSel=null;save();}openInventory();}
  else if(a==='usec'){useConsum(b.dataset.k);openInventory();}
  else if(a==='raise'){raise(b.dataset.s,+b.dataset.n);openSkills();}
  else if(a==='respec'){respec();openSkills();}
  else if(a==='xplock'){setXpLock(!P.xpLock);openSkills();}
  else if(a==='accept')acceptMission(+b.dataset.i);
  else if(a==='abandon')abandonMission(b.dataset.id);
  else if(a==='turnin')turnIn(b.dataset.id);
  else if(a==='tab'){vendTab=b.dataset.t;openVendor();}
  else if(a==='buystim'){const sp=10+P.level*2;if(P.credits<sp)warn('Not enough credits');else{P.credits-=sp;P.stims++;SFX.coin();save();}openVendor();}
  else if(a==='buyc'){const c=CONSUM[b.dataset.k];const pr=c.price(P.level);if(P.credits<pr)warn('Not enough credits');else{P.credits-=pr;P.consum[b.dataset.k]=(P.consum[b.dataset.k]||0)+1;SFX.coin();toast('Bought '+c.name);save();}openVendor();}
  else if(a==='buy'){const it=vendorStock.find(x=>x.id===b.dataset.id);if(!it)return;const pr=it.kind==='gear'?it.value*4:it.value*3;if(P.credits<pr){warn('Not enough credits');return;}if(P.inv.length>=24){warn('Inventory full');return;}
    P.credits-=pr;vendorStock.splice(vendorStock.indexOf(it),1);P.inv.push(it);SFX.coin();toast('Bought '+it.name);save();openVendor();}
  else if(a==='sell'||a==='sellok'){const i=P.inv.findIndex(x=>x.id===b.dataset.id);if(i<0)return;if(a==='sell'&&isDisk(P.inv[i])&&!diskUsable(P.inv[i])){vendConfirm=P.inv[i].id;openVendor();return;}vendConfirm=null;P.credits+=P.inv[i].value;if(stackN(P.inv[i])>1)P.inv[i].n--;else P.inv.splice(i,1);SFX.coin();save();openVendor();}
  else if(a==='sellno'){vendConfirm=null;openVendor();}
  else if(a==='sellall'){sellJunk();openVendor();}
  else if(a==='book'){openBook();}
  else if(a==='learn'){learnDisk(b.dataset.id);openBook();}
  else if(a==='bsel'){bookSel=b.dataset.w===bookSel?null:b.dataset.w;openBook();}
  else if(a==='slot'){const i=+b.dataset.i;if(bookSel){assignSlot(i,bookSel);bookSel=null;}openBook();}
  else if(a==='clrslot'){wvClrSlot(+b.dataset.i);openBook();}
  else if(a==='mdiff'){const mp=mprefs();mp.diff=clamp((mp.diff|0)+(+b.dataset.d),0,4);missionOffers=[];save();openTerminal();}
  else if(a==='mpref'){mprefs().pref=b.dataset.p;missionOffers=[];save();openTerminal();}
  else if(a==='travel'){closePanel();conduitTravel(b.dataset.id);}
  else if(a==='tdenter'){closePanel();enterTeamDungeon(b.dataset.id);}
  else if(a==='denter'){closePanel();enterDungeon(b.dataset.id);}
  else if(stage2Act(a,b)){}
  else if(a==='resume')closePanel();
  else if(a==='sound'){sfxOn=!sfxOn;openMenu();}
  else if(a==='fps'){$('#fps').classList.toggle('hidden');closePanel();}
  else if(a==='quit'){save();closePanel();toTitle();}
});
function openMenu(){openPanel('MENU',`${statsHtml()}<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="sbtn" data-act="resume">Resume</button><button class="sbtn alt" data-act="help">📘 How to play</button><button class="sbtn alt" data-act="craft">🛠 Tradeskills</button><button class="sbtn alt" data-act="sound">Sound: ${sfxOn?'On':'Off'}</button><button class="sbtn alt" data-act="fps">Toggle FPS</button><button class="sbtn alt" data-act="quit">Save &amp; quit to title</button><button class="sbtn alt" data-act="svexp">💾 Export save</button><button class="sbtn alt" data-act="svimp">📥 Import save</button></div>${gfxMenuHtml()}
<div class="h4" style="margin-top:16px">Controls</div><div class="stats">Left thumb: move · Right side drag: camera · Tap an enemy to target it · ⚔ auto-attack · 6 Weave slots (set them in 📖 Weave Book) · 💉 med-stim · ◎ next target · 📈 skills · 🎒 inventory, implants and consumables<br>Keyboard: WASD move · drag the mouse to turn · wheel zooms · Space attack · 1-6 abilities · Q stim · F interact · Tab target · I inventory · K skills · B Weave Book · J tradeskills · L journal · H help · R vehicle · Z/X/C pet · Esc menu</div>`,'menu');}

/* ---------------- Weave Book (learned nano programs + loadout) ---------------- */
let bookSel=null;
function knownBest(line){let b=null;for(const id of P.known){const w=WEAVES[id];if(w&&w.line===line&&(!b||w.tier>b.tier))b=w;}return b;}
function assignSlot(i,wid){if(!P.known.includes(wid))return;const j=P.slots.indexOf(wid);if(j>=0)P.slots[j]=P.slots[i]||null;P.slots[i]=wid;setupHud();save();toast(WEAVES[wid].name+' → slot '+(i+1));}
function learnDisk(id){const it=P.inv.find(x=>x.id===id);if(!it||!isDisk(it))return false;const w=WEAVES[it.wid];
  if(!profOk(it)){warn(profName(it.prof)+' only');return false;}
  if(P.known.includes(w.id)){warn('You already know '+w.name);return false;}
  if(!tierOk(it)){warn('🔒 '+w.name+': '+tierMiss(it)+'. You are Tier '+pTier()+'.');return false;}
  const miss=(it.req||[]).find(r=>eff(r.s)<r.v);if(miss){warn('Need '+(miss.v-eff(miss.s))+' more '+STATN[miss.s]);return false;}
  if(stackN(it)>1)it.n--;else P.inv.splice(P.inv.indexOf(it),1);P.known.push(w.id);
  // upgrade: replace lower tiers of the same line in the loadout, else first empty slot
  let msg='';const k=P.slots.findIndex(sid=>sid&&WEAVES[sid]&&WEAVES[sid].line===w.line&&WEAVES[sid].tier<w.tier);
  if(k>=0){msg=w.name+' replaced '+WEAVES[P.slots[k]].name+' in slot '+(k+1);P.slots[k]=w.id;}
  else{const e=P.slots.findIndex(x=>!x);if(e>=0){P.slots[e]=w.id;msg=w.name+' added to slot '+(e+1);}else msg='Learned '+w.name+'. Assign it to a slot in the Weave Book';}
  SFX.level();banner('WEAVE LEARNED',msg);ringFx(P.pos.x,P.pos.z,0x5ff2ff,4,1);setupHud();save();return true;}
function weaveStats(w){const parts=[];if(w.cost)parts.push(w.cost+' energy');parts.push(w.cd+'s recharge');if(w.range)parts.push(w.range+'m');return parts.join(' · ');}
function openBook(){
  const pr=PROFS[P.prof];
  const load=P.slots.map((id,i)=>{const w=abDef(id);return `<button class="wslot${bookSel?' pick':''}" data-act="slot" data-i="${i}"><span class="n">${i+1}</span><span class="ic">${w?w.icon:'＋'}</span><span class="wn">${w?esc(w.name):'Empty'}</span>${w?`<span class="x" data-act="clrslot" data-i="${i}">✕</span>`:''}</button>`;}).join('');
  const known=P.known.map(id=>WEAVES[id]).filter(Boolean).sort((a,b)=>a.line<b.line?-1:a.line>b.line?1:a.tier-b.tier);
  const krow=w=>{const best=knownBest(w.line);const sup=best&&best.tier>w.tier;const sl=P.slots.indexOf(w.id);
    return `<button class="item${bookSel===w.id?' sel':''}${sup?' sup':''}" data-act="bsel" data-w="${w.id}"><span class="ico">${w.icon}</span><span style="min-width:0;flex:1"><div class="nm">${esc(w.name)} ${w.buff?'<span class="tag b">BUFF</span>':''}${/AoE/.test(w.desc)||w.kind==='aoeT'||w.kind==='cone'||w.kind==='field'||w.kind==='barrage'||w.kind==='aoeSelf'||w.id==='scatter'||w.id==='stasis'||w.id==='nova'?'<span class="tag a">AoE</span>':''}${w.prof==='any'?'<span class="tag g">GENERIC</span>':''}</div><div class="st">${esc(w.desc)}</div><div class="st" style="opacity:.6">${weaveStats(w)}${sup?' · superseded by '+esc(best.name):''}</div></span><span class="pr">${sl>=0?'Slot '+(sl+1):''}</span></button>`;};
  const disks=P.inv.filter(isDisk);
  const drow=d=>{const w=WEAVES[d.wid];const known=P.known.includes(w.id);const ok=reqMet(d)&&!known;const miss=!profOk(d)?profName(d.prof)+' only':known?'Already known':!tierOk(d)?tierMiss(d):(()=>{const m=(d.req||[]).find(r=>eff(r.s)<r.v);return m?'Need '+(m.v-eff(m.s))+' more '+STATN[m.s]:'';})();
    return `<div class="mis" style="border-color:${RAR[d.r].c}"><div style="display:flex;gap:10px;align-items:center"><span class="ico" style="font-size:24px">📀</span><div style="flex:1"><b style="color:${RAR[d.r].c}">${esc(w.name)}</b> <span style="opacity:.7;font-size:12px">${profName(w.prof)} · tier level ${w.lvl}</span><div class="st" style="font-size:13px">${esc(w.desc)} <span style="opacity:.6">(${weaveStats(w)})</span></div></div></div>
      <div class="h4" style="margin:6px 0 2px">Requirements (your current skills, including buffs)</div>${reqHtml(d)}
      <div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="sbtn${ok?'':' locked'}" data-act="learn" data-id="${d.id}">Learn</button>${ok?'<span class="up">Ready to learn</span>':`<span class="down"><b>${miss}</b></span>`}</div></div>`;};
  // unlearned Weaves whose disc already sits in the shared bank (or your pack) are flagged and listed first
  const inBank=new Set(((typeof loadBank==='function'?loadBank():null)||{items:[]}).items.filter(x=>x&&x.kind==='disk').map(x=>x.wid));const inPack=new Set(disks.map(x=>x.wid));
  const toFind=Object.values(WEAVES).filter(w=>!w.starter&&(w.prof===P.prof||w.prof==='any')&&!P.known.includes(w.id)).sort((a,b)=>((inBank.has(b.id)||inPack.has(b.id))-(inBank.has(a.id)||inPack.has(a.id)))||a.lvl-b.lvl);
  const nBank=toFind.filter(w=>inBank.has(w.id)).length;
  const html=`<div class="h4">Loadout: ${NSLOTS} slots on your HUD ${bookSel?'· <span style="color:#5ff2ff">tap a slot to place '+esc(WEAVES[bookSel].name)+'</span>':'· tap a Weave below, then a slot'}</div><div class="wslots">${load}</div>
  <div class="cols" style="margin-top:12px"><div><div class="h4">Known Weaves (${known.length})</div>${known.map(krow).join('')}</div>
  <div><div class="h4">Weave Disks in your pack (${disks.length})</div>${disks.map(drow).join('')||'<div style="opacity:.6;margin-bottom:8px">No disks. Enemies (tougher ones drop better), the trader and mission rewards have them.</div>'}
  <div class="h4" style="margin-top:12px">Still to find (${pr.name} + generic)${nBank?` · <span style="color:#ffd34a">${nBank} disc${nBank>1?'s':''} waiting in your bank</span>`:''}</div>${toFind.map(w=>`<div class="slot${inBank.has(w.id)?' inbank':''}" data-wid="${w.id}"${inBank.has(w.id)?' data-bank="1"':''} style="opacity:${inBank.has(w.id)||inPack.has(w.id)?1:.75}${inBank.has(w.id)?';border-color:#ffd34a':''}"><span class="ico">${w.icon}</span><span style="flex:1"><div class="nm">${esc(w.name)} <span style="opacity:.6;font-size:11px">· level ${diskLvlReq(w)}+</span>${inBank.has(w.id)?' <span class="tag bankd" style="background:#ffd34a;color:#2a1a00">📦 Disc in bank - collect to learn</span>':inPack.has(w.id)?' <span class="tag bankd" style="background:#6dff8a;color:#062a10">📀 Disc in your pack - learn it above</span>':''}${w.excl?' <span class="tag l">'+esc(dunName(w.excl))+' only</span>':''}${w.rare?' <span class="tag m">ULTRA-RARE DROP</span>':''}</div><div class="st">${esc(w.desc)}</div><div class="rqs">${w.req.map(r=>`<span class="rq ${eff(r.s)>=r.v?'ok':'no'}">${SHORT[r.s]} ${r.v}</span>`).join('')}</div></span></div>`).join('')}</div></div>`;
  openPanel('📖 WEAVE BOOK · '+pr.name.toUpperCase(),html,'book');
}
