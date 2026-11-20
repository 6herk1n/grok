/* ---------------- input ---------------- */
const inp={pinch:null,lastDrag:0,jx:0,jy:0,joyId:null,ox:0,oy:0,camId:null,lx:0,ly:0,st:0,mv:0,keys:{}};
const joyEl=$('#joy'),knob=$('#joyKnob');
// Build P: no on-screen joystick ring on devices without touch (desktop uses WASD); it comes back on the first touch (hybrid laptops)
if(!((navigator.maxTouchPoints||0)>0||('ontouchstart' in window))){document.documentElement.classList.add('notouch');addEventListener('pointerdown',e=>{if(e.pointerType==='touch')document.documentElement.classList.remove('notouch');},{capture:true,passive:true});}
function resetInput(){for(const k in ptrs)delete ptrs[k];inp.pinch=null;inp.jx=inp.jy=0;inp.joyId=inp.camId=null;joyEl.classList.remove('on');joyEl.style.left='';joyEl.style.top='';knob.style.transform='';inp.keys={};}
const ptrs={};// active touch points on the 3D view
// touches that land in the small gaps around the ability buttons are ignored, so a slightly-missed button press never spins the camera or retargets
function inAbZone(x,y){const pad=14;for(const el of document.querySelectorAll('#hud .ab, #quick, #topbtns')){if(!el.offsetParent&&el.id!=='quick')continue;const r=el.getBoundingClientRect();if(!r.width)continue;if(x>r.left-pad&&x<r.right+pad&&y>r.top-pad&&y<r.bottom+pad)return true;}return false;}
function pinchStart(a,b){const A=ptrs[a],B=ptrs[b];if(!A||!B)return;inp.pinch={a,b,d0:Math.max(20,Math.hypot(A.x-B.x,A.y-B.y)),dist0:camS.dist};inp.mv=999;}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();if(state!=='play'||panelOpen)return;const now=performance.now();if(e.pointerType!=='mouse'&&inAbZone(e.clientX,e.clientY))return;ptrs[e.pointerId]={x:e.clientX,y:e.clientY,t:now};
  if(e.pointerType!=='mouse'&&!inp.pinch){
    // a second finger landing right after the first, before the stick has moved, = pinch (even if the first finger was on the stick side)
    if(inp.joyId!==null&&inp.camId===null&&now-(ptrs[inp.joyId]?ptrs[inp.joyId].t:0)<350&&Math.hypot(inp.jx,inp.jy)<0.25){const a=inp.joyId;endJoy();pinchStart(a,e.pointerId);try{canvas.setPointerCapture(e.pointerId);}catch(_){}return;}
    if(inp.camId!==null&&(e.clientX>=innerWidth*0.45||(inp.joyId===null&&now-inp.st<350&&inp.mv<10))){pinchStart(inp.camId,e.pointerId);try{canvas.setPointerCapture(e.pointerId);}catch(_){}return;}}
  if(e.pointerType!=='mouse'&&e.clientX<innerWidth*0.45&&inp.joyId===null&&!inp.pinch){inp.joyId=e.pointerId;inp.ox=e.clientX;inp.oy=e.clientY;joyEl.classList.add('on');joyEl.style.left=e.clientX+'px';joyEl.style.top=e.clientY+'px';}
  else if(inp.camId===null&&!inp.pinch){inp.camId=e.pointerId;inp.lx=e.clientX;inp.ly=e.clientY;inp.st=now;inp.mv=0;}
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}});
canvas.addEventListener('pointermove',e=>{const pt=ptrs[e.pointerId];if(pt){pt.x=e.clientX;pt.y=e.clientY;}
  if(inp.pinch&&(e.pointerId===inp.pinch.a||e.pointerId===inp.pinch.b)){const A=ptrs[inp.pinch.a],B=ptrs[inp.pinch.b];if(A&&B){const d=Math.max(20,Math.hypot(A.x-B.x,A.y-B.y));setCamDist(inp.pinch.dist0*inp.pinch.d0/d,false);}inp.lastDrag=performance.now();return;}
  if(e.pointerId===inp.joyId){let dx=e.clientX-inp.ox,dy=e.clientY-inp.oy;const l=Math.hypot(dx,dy),R=55;if(l>R){dx*=R/l;dy*=R/l;}inp.jx=dx/R;inp.jy=dy/R;knob.style.transform=`translate(${dx}px,${dy}px)`;}
  else if(e.pointerId===inp.camId){const dx=e.clientX-inp.lx,dy=e.clientY-inp.ly;inp.lx=e.clientX;inp.ly=e.clientY;inp.mv+=Math.abs(dx)+Math.abs(dy);if(inp.mv<6&&e.pointerType!=='mouse')return;inp.lastDrag=performance.now();const k=e.pointerType==='mouse'?0.005:0.0065;camS.yaw-=dx*k;camS.pitch=clamp(camS.pitch+dy*k*0.7,0.08,1.25);}});
function endJoy(){inp.joyId=null;inp.jx=inp.jy=0;joyEl.classList.remove('on');joyEl.style.left='';joyEl.style.top='';knob.style.transform='';}
function endPtr(e){const pt=ptrs[e.pointerId];delete ptrs[e.pointerId];
  if(inp.pinch&&(e.pointerId===inp.pinch.a||e.pointerId===inp.pinch.b)){const other=e.pointerId===inp.pinch.a?inp.pinch.b:inp.pinch.a;inp.pinch=null;setCamDist(camS.dist,true);inp.lastDrag=performance.now();
    if(e.pointerId===inp.camId)inp.camId=null;if(ptrs[other]&&inp.camId===null){inp.camId=other;}if(inp.camId!==null&&ptrs[inp.camId]){inp.lx=ptrs[inp.camId].x;inp.ly=ptrs[inp.camId].y;inp.mv=999;}return;}
  if(e.pointerId===inp.joyId){endJoy();}
  else if(e.pointerId===inp.camId){inp.camId=null;if(e.type==='pointerup'&&inp.mv<10&&performance.now()-inp.st<400)tapPick(e.clientX,e.clientY);}}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);
let wheelT=0;canvas.addEventListener('wheel',e=>{e.preventDefault();setCamDist(camS.dist+e.deltaY*0.01,false);clearTimeout(wheelT);wheelT=setTimeout(()=>camSave(),400);},{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());document.addEventListener('dblclick',e=>e.preventDefault());
document.addEventListener('touchmove',e=>{if(!e.target.closest||!e.target.closest('#pbody,#create,.roster'))e.preventDefault();},{passive:false});
const ray=new THREE.Raycaster();const ndc=new THREE.Vector2();
function tapPick(x,y){ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1);ray.setFromCamera(ndc,camera);let best=null,bd=1e9;
  for(const e of enemies){if(e.dead||!e.R.g.visible||fzSkip(e))continue;entChest(e,tmpV);const r=e.hitR+0.6;if(ray.ray.distanceSqToPoint(tmpV)<r*r){const d=tmpV.distanceTo(camera.position);if(d<bd){bd=d;best=e;}}}
  if(best){setTarget(best);return;}const lp=lootPick(ray);if(lp&&!P.dead){SFX.ui();openLoot(lp);}}
function btn(id,fn){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();audioInit();el.classList.add('press');fn();});
  const up=()=>el.classList.remove('press');el.addEventListener('pointerup',up);el.addEventListener('pointerleave',up);el.addEventListener('pointercancel',up);}
btn('#bAtk',pressAttack);[0,1,2,3,4,5].forEach(i=>btn('#b'+i,()=>{if(!barIds()[i]){if(!P.morph)openBook();return;}useAbility(i);}));btn('#bBook',()=>{if(panelOpen==='book')closePanel();else{bookSel=null;openBook();}});btn('#bStim',useStim);btn('#bSk',()=>{if(panelOpen==='skills')closePanel();else openSkills();});
hudDeclutterInit();perksInit();lootInit();fzInit();btn('#bInv',()=>{invSel=null;openInventory();});btn('#bJournal',()=>openJournal());$('#mtrack').addEventListener('pointerup',e=>{if(e.target.closest('.strk')&&state==='play'){SFX.ui();openJournal('story');}});btn('#bMenu',openMenu);btn('#bMap',toggleMap);btn('#bTeam',openTeam);btn('#bMis',()=>rmOpenBoard());btn('#bCraft',()=>{if(panelOpen==='craft')closePanel();else openCraft();});btn('#bTgt',cycleTarget);btn('#bUse',interact);
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;audioInit();inp.keys[e.code]=true;
  if(state!=='play')return;
  if(e.code==='Escape'){if(panelOpen)closePanel();else openMenu();return;}
  if(e.code==='KeyM'){toggleMap();return;}
  if(e.code==='KeyT'&&!panelOpen){toggleTeam();return;}if(e.code==='KeyG'&&!panelOpen){teamAttack();return;}if(e.code==='KeyY'&&!panelOpen){teamRegroup();return;}
  if(e.code==='KeyK'){if(panelOpen==='skills')closePanel();else openSkills();return;}
  if(e.code==='KeyP'&&state==='play'){if(panelOpen==='perks')closePanel();else openPerks();return;}
  if(e.code==='KeyJ'){if(panelOpen==='craft')closePanel();else openCraft();return;}
  if(e.code==='KeyN'&&state==='play'){rmOpenBoard();return;}
  if(e.code==='KeyL'){if(panelOpen==='journal')closePanel();else openJournal();return;}
  if(e.code==='KeyH'){if(panelOpen==='help')closePanel();else openHelp();return;}
  if(e.code==='KeyI'){if(panelOpen==='inv')closePanel();else{invSel=null;openInventory();}return;}
  if(panelOpen)return;
  if(e.code==='Tab'){e.preventDefault();cycleTarget();}
  else if(e.code==='Space'){e.preventDefault();pressAttack();}
  else if(e.code==='Digit1')useAbility(0);else if(e.code==='Digit2')useAbility(1);else if(e.code==='Digit3')useAbility(2);else if(e.code==='Digit4')useAbility(3);else if(e.code==='Digit5')useAbility(4);else if(e.code==='Digit6')useAbility(5);else if(e.code==='KeyB'){bookSel=null;openBook();}
  else if(e.code==='KeyQ')useStim();else if(e.code==='KeyF'||e.code==='KeyE')interact();else if(e.code==='KeyR')toggleMount();else if(e.code==='KeyZ')petCmd('attack');else if(e.code==='KeyX')petCmd('follow');else if(e.code==='KeyC')petCmd('stay');});
addEventListener('keyup',e=>{inp.keys[e.code]=false;});
addEventListener('blur',()=>{inp.keys={};});

/* ---------------- interact ---------------- */
let nearI=null;
function findInteract(){if(P.dead)return null;const p=P.pos;const dk=dunInteract(p);if(dk)return dk;if(DUN)return lootInteract(p);const fk=fzInteract(p);if(fk)return fk;const qk=questInteract(p);if(qk)return qk;const sk=stage2Interact(p);if(sk)return sk;const wk=worldInteract(p);if(wk)return wk;const hk=hubInteract(p);if(hk)return hk;
  if(Math.hypot(p.x-TERMINAL.x,p.z-TERMINAL.z)<3.4)return {k:'term',label:'📟 Missions'};
  if(Math.hypot(p.x-VENDOR.x,p.z-VENDOR.z)<3.4)return {k:'vend',label:'🛒 Trade'};
  return lootInteract(p)||gatherInteract(p);}
function interact(){if(!nearI||panelOpen)return;SFX.ui();
  if(nearI.k==='loot'){openLoot(nearI.l);return;}
  if(nearI.k==='fz'||nearI.k==='fzdeny'){fzDo(nearI);return;}
  if(gatherDo(nearI))return;
  if(nearI.k==='term')openTerminal();else if(nearI.k==='vend'){vendTab='buy';VEND.ctx='town';openVendor();}
  else if(hubDo(nearI)){}
  else if(questDo(nearI)){}
  else if(stage2Do(nearI)){}
  else if(nearI.k==='conduit')openConduit(nearI.id);else if(nearI.k==='savept')recordSavePoint(nearI.id);
  else if(nearI.k==='door')openDoor(nearI.id);else if(nearI.k==='dexit')exitDungeon();else if(nearI.k==='dfeat')dunFeatDo(nearI);}

/* ---------------- updates ---------------- */
const SPEED=7.2;
function updPlayer(dt){
  let mx=inp.jx,my=inp.jy;const K=inp.keys;
  if(!panelOpen){if(K.KeyW||K.ArrowUp)my-=1;if(K.KeyS||K.ArrowDown)my+=1;if(K.KeyA||K.ArrowLeft)mx-=1;if(K.KeyD||K.ArrowRight)mx+=1;}
  let l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l;l=1;}
  if(P.dead){l=0;}
  const sy=Math.sin(camS.yaw),cy=Math.cos(camS.yaw);
  let vx=0,vz=0;if(l>0.08){const f=-my,r=mx;vx=(-sy*f+cy*r);vz=(-cy*f-sy*r);const s=SPEED*moveMul()*(l<0.5?l*1.4:1)*(T<P.bulwarkUntil?0.9:1);const vl=Math.hypot(vx,vz)||1;vx=vx/vl*s;vz=vz/vl*s;
    P.pos.x+=vx*dt;P.pos.z+=vz*dt;const tr=Math.atan2(vx,vz);let d=tr-P.rotY;d=Math.atan2(Math.sin(d),Math.cos(d));P.rotY+=d*Math.min(1,dt*14);
    // follow-behind camera: swing in behind the player while running forward-ish, never while the user is dragging/pinching the view
    if(CAMP.follow&&inp.camId===null&&!inp.pinch&&performance.now()-(inp.lastDrag||0)>1200){const fw=f/l;if(fw>0.3){let dy=(P.rotY+Math.PI)-camS.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));camS.yaw+=dy*Math.min(1,dt*1.8*fw);}}}
  P.moving=lerp(P.moving,l>0.08?1:0,Math.min(1,dt*10));
  collide(P.pos,0.45);P.pos.y=heightAt(P.pos.x,P.pos.z);
  if(!P.dead){
    // auto-attack
    const t=validTarget();if(!t)P.autoAtk=false;
    if(P.autoAtk&&t&&(P.cds.basic||0)<=T){if(dist2D(t.pos,P.pos)<=basicAb().range+t.hitR)useAbility(-1);else if(T-lastWarn>2.5)warn('Out of range');}
    if(t&&dist2D(t.pos,P.pos)>60)P.target=null;
    if(t&&P.moving<0.3&&P.autoAtk){const tr=Math.atan2(t.pos.x-P.pos.x,t.pos.z-P.pos.z);let d=tr-P.rotY;d=Math.atan2(Math.sin(d),Math.cos(d));P.rotY+=d*Math.min(1,dt*10);}
    // regen
    const ooc=T-P.lastCombat>4;P.hp=Math.min(S.maxHp,P.hp+S.maxHp*(ooc?0.04:0.004)*dt);P.en=Math.min(S.maxEn,P.en+(ooc?3.5+S.maxEn*0.04:enRegenC())*dt);
    if(inTown(P.pos)){P.hp=Math.min(S.maxHp,P.hp+S.maxHp*0.06*dt);}
    if(P.hot&&T>=P.hot.next){if(T>P.hot.until)P.hot=null;else{P.hot.next+=1;healPlayer(S.maxHp*(P.hot.pct||0.04)*(1+eff('treat')/200));}}
    updBuffs();
  }
  P.atkAnim-=dt;
  PM.g.position.copy(P.pos);PM.g.rotation.y=P.rotY;PM.anim(T,P.moving,P.atkAnim,Math.max(0,0.15-(T-(P.hurtT||-9))));
  P.deadK=lerp(P.deadK||0,P.dead?1:0,Math.min(1,dt*(P.dead?5:12)));PM.g.rotation.z=1.45*P.deadK*(2-P.deadK);PM.g.position.y+=0.25*P.deadK;
  pShadow.position.set(P.pos.x,P.pos.y+0.06,P.pos.z);
}
function moveToward(e,tx,tz,spd,dt,stopAt){const dx=tx-e.pos.x,dz=tz-e.pos.z;const d=Math.hypot(dx,dz);if(d<=(stopAt||0.1))return false;const s=Math.min(spd*dt,d-(stopAt||0));
  const ox=e.pos.x,oz=e.pos.z;e.pos.x+=dx/d*s;e.pos.z+=dz/d*s;collide(e.pos,e.hitR*0.7);if(!e.guard&&inTown(e.pos)){e.pos.x=ox;e.pos.z=oz;}e.rotY=Math.atan2(dx,dz);return true;}
function updEnemy(e,dt){
  if(e.dead){if(!e.temp&&!e.dun&&T>=e.respawnAt&&dist2D(e.home,P.pos)>30)respawnEnemy(e);return;}
  const far=dist2D(e.pos,P.pos)>150;
  if(e.dot&&T>=e.dot.next){if(T>e.dot.until)e.dot=null;else{const d=e.dot;d.next+=1;P.en=Math.min(S.maxEn,P.en+d.en);dmgEnemy(e,d.mult);}}
  if(e.dead)return;
  const stunned=T<e.stunUntil,rooted=stunned||T<e.rootUntil;let moving=false;const dP=dist2D(e.pos,P.pos),dH=dist2D(e.pos,e.home);
  if(e.state==='idle'){
    if(T>e.nextWander){const wr=e.wr==null?8:e.wr;e.wt.set(e.home.x+rand(-wr,wr),0,e.home.z+rand(-wr,wr));e.nextWander=T+rand(3,8);}
    if(!far)moving=moveToward(e,e.wt.x,e.wt.z,e.T.speed*0.3,dt,0.5);
    let ar=e.T.aggro;if(P.level>e.lv+3)ar*=0.5;
    if(e.guard){if(fzGuardWants(e,dP))aggro(e);}else if(!P.dead&&!inTown(P.pos)&&dP<ar&&!stealthed())aggro(e);
  }else if(e.state==='chase'){const F=foeOf(e),fp=F.pos,dF=dist2D(e.pos,fp),fr=F===P?0:F.hitR*0.6;
    if((F===P&&(P.dead||(inTown(P.pos)&&!e.guard)||(e.guard&&(!fzCanHit(e)||fzGuardFar(e)))))||bossLeashOut(e,dH,F)){e.state='return';e.foe=null;}
    else{const ax=e.T.ai&&AIX[e.T.ai]?AIX[e.T.ai](e,dt,F,fp,dF,rooted,stunned,fr):null;
      if(ax&&ax.moved!=null)moving=ax.moved;else if(!rooted&&dF>e.T.range*0.85+fr)moving=moveToward(e,fp.x,fp.z,e.T.speed,dt,e.T.range*0.8+fr);else e.rotY=Math.atan2(fp.x-e.pos.x,fp.z-e.pos.z);
      if(!(ax&&ax.noAtk)&&!stunned&&dF<=e.T.range+0.6+fr&&T>=e.nextAtk){e.nextAtk=T+e.T.atkCd;e.atkT=0.35;
        if(e.T.ranged){const from=new V3(e.pos.x+Math.sin(e.rotY)*0.6,e.pos.y+1.35,e.pos.z+Math.cos(e.rotY)*0.6);const hx=T<(e.hexUntil||0)?(e.hexWeak||0.65):1;fireProj(from,F,0xff5a3a,26,()=>hitFoe(F,e.dmg*hx,e));tone(500,0.08,'square',0.02,-300);}
        else hitFoe(F,e.dmg*(T<(e.hexUntil||0)?(e.hexWeak||0.65):1),e);}}
  }else if(e.state==='return'){
    moving=moveToward(e,e.home.x,e.home.z,e.T.speed*1.4,dt,0.8);e.hp=Math.min(e.maxHp,e.hp+e.maxHp*0.25*dt);e.dot=null;
    if(e.retAt==null)e.retAt=T;
    if(!moving||dH<2||T-e.retAt>12){e.state='idle';e.hp=e.maxHp;e.retAt=null;}
  }
  e.pos.y=heightAt(e.pos.x,e.pos.z);e.moving=lerp(e.moving,moving?1:0,Math.min(1,dt*8));
  e.hitT-=dt;e.atkT-=dt;
  const g=e.R.g;g.visible=!far&&!e.bur;e.shadow.visible=!far&&!e.bur;
  if(!far){g.position.copy(e.pos);g.rotation.y=e.rotY;e.animT+=dt*(stunned?0:1);e.R.anim(e.animT,e.moving,e.atkT,Math.max(0,e.hitT));enemyPresent(e,dP);const base=e.T.scale*(1+(e.lv-1)*0.03)*(e.R.bossMul||1);g.scale.setScalar(base*(e.hitT>0?1.06:1));e.shadow.position.set(e.pos.x,e.pos.y+0.05,e.pos.z);}
}
function updCamera(dt){
  // titan framing: when fighting a huge boss (the Sun-Eater), ease the camera back and tilt the view up so the whole body reads
  const tg=P.target,giant=tg&&!tg.dead&&tg.boss&&(tg.h||0)>9&&Math.hypot(tg.pos.x-P.pos.x,tg.pos.z-P.pos.z)<50;
  camS.lift=lerp(camS.lift||0,giant?1:0,Math.min(1,dt*1.5));const lift=camS.lift>0.01?camS.lift:0,lookUp=lift?lift*Math.min(7,(tg&&tg.h||10)*0.36):0;
  const tx=P.pos.x,ty=P.pos.y+1.7+lift*2.5,tz=P.pos.z;const cp=Math.cos(camS.pitch);
  const ux=Math.sin(camS.yaw)*cp,uy=Math.sin(camS.pitch),uz=Math.cos(camS.yaw)*cp;let dist=camS.dist+lift*13;
  const occ=(px,py,pz,L)=>{for(let i=0;i<L.length;i++){const b=L[i];if(b.nocam)continue;if(px>b.x0-0.25&&px<b.x1+0.25&&pz>b.z0-0.25&&pz<b.z1+0.25&&py>b.y0-0.2&&py<b.y1+0.3)return true;}return false;};
  for(let d=0.8;d<=camS.dist+lift*13;d+=0.35){const px=tx+ux*d,py=ty+uy*d,pz=tz+uz*d;if(occ(px,py,pz,boxes)||occ(px,py,pz,camOcc)){dist=Math.max(1.2,d-0.35);break;}}
  camS.cur=camS.cur==null?dist:(dist<camS.cur?dist:lerp(camS.cur,dist,Math.min(1,dt*4)));dist=camS.cur;
  let x=tx+ux*dist,y=ty+uy*dist,z=tz+uz*dist;
  const gh=heightAt(x,z)+0.6;if(y<gh)y=gh;
  camera.position.set(x,y,z);camera.lookAt(tx,ty+lookUp,tz);window.__sky.position.copy(camera.position);
}

/* ---------------- HUD ---------------- */
const H={};['#pname','#tframe','#tname','#tstate','#credits','#mtrack','#bUse','#buffs','#wp','#fps'].forEach(s=>H[s.slice(1)]=$(s));
const bars={hp:$('.bar.hp'),en:$('.bar.en'),xp:$('.bar.xp'),thp:$('.bar.thp')};
function setBar(b,v,m,txt){b.firstChild.style.transform=`scaleX(${clamp(m?v/m:0,0,1)})`;if(txt!=null)b.lastChild.textContent=txt;}
const abBtns=[0,1,2,3,4,5].map(i=>$('#b'+i)),atkBtn=$('#bAtk'),stimBtn=$('#bStim');
function setupHudForProf(){setupHud();}
function setupHud(){atkBtn.querySelector('.ic').textContent='⚔️';
  const bi=barIds();abBtns.forEach((el,i)=>{const w=abDef(bi[i]);el.classList.toggle('empty',!w);el.classList.toggle('hidden',!w);el.classList.toggle('buff',!!(w&&w.buff));el.querySelector('.ic').textContent=w?w.icon:(P.morph?'':'＋');el.querySelector('.cost').textContent=w?w.cost:'';el.title=w?w.name+': '+w.desc:(P.morph?'':'Empty slot: open the Weave Book');el.classList.toggle('mab',!!(w&&w.mab));});}
function cdUI(el,id,cd,cost){const left=(P.cds[id]||0)-T;el.querySelector('.cd').style.height=left>0?clamp(left/cd*100,0,100)+'%':'0';el.querySelector('.ct').textContent=left>0.05?(left<10?left.toFixed(1):Math.ceil(left)):'';if(cost!=null)el.classList.toggle('nores',P.en<cost);}
let hudAcc=0;const wpEl=H.wp,wpArr=wpEl.querySelector('.arr'),wpTxt=wpEl.querySelector('span');
function updHUD(dt){
  hudAcc+=dt;
  setBar(bars.hp,P.hp,S.maxHp,Math.ceil(P.hp)+' / '+S.maxHp);setBar(bars.en,P.en,S.maxEn,Math.floor(P.en)+' / '+S.maxEn);
  setBar(bars.xp,P.level>=MAXLVL?1:P.xp,P.level>=MAXLVL?1:xpNeed(P.level));restBar();
  const pr=PROFS[P.prof];{const bi=barIds();abBtns.forEach((el,i)=>{const w=abDef(bi[i]);if(w)cdUI(el,w.id,w.cd||0.01,w.cost);else{el.querySelector('.ct').textContent='';el.querySelector('.cd').style.height='0';}});}cdUI(stimBtn,'stim',15);
  stimBtn.querySelector('.cnt').textContent=P.stims;atkBtn.classList.toggle('on',P.autoAtk);
  const t=validTarget();
  if(t){H.tframe.classList.remove('hidden');const col=t.lv-P.level>=3?'#ff5a4a':t.lv-P.level<=-4?'#aaa':t.lv>P.level?'#ffb347':'#fff';
    H.tname.innerHTML=`<span style="color:${col}">${esc(t.T.name)}</span> · Lv ${t.lv}`;setBar(bars.thp,t.hp,t.maxHp,Math.max(0,Math.ceil(t.hp))+' / '+t.maxHp);
    H.tstate.textContent=(t.enraged?'ENRAGED ':'')+(t.boss?'Boss · ':'')+(T<t.stunUntil?'Stunned ':'')+(T<t.rootUntil?'Rooted ':'')+(t.dot?(t.dot.en?'Leeched ':'Searing '):'')+(T<(t.hexUntil||0)?'Hexed ':'')+(t.state==='return'?'Evading':'')+' · '+Math.round(dist2D(t.pos,P.pos))+'m';}
  else H.tframe.classList.add('hidden');
  if(hudAcc>0.2){hudAcc=0;
    H.pname.innerHTML=`${esc(P.name)}${titleHtml()}${xpLockHtml()}${restHtml()} <em>Lv ${P.level} ${pr.name}</em>`;H.credits.textContent=P.credits+' ¢';
    let b='';for(const bf of P.buffs){const left=bf.until-T;b+=`<span class="bf${left<20?' low':''}" title="${esc(bf.name)}: ${Object.keys(bf.mods).map(k=>'+'+bf.mods[k]+' '+SHORT[k]).join(' ')}">${bf.icon}<b>${fmtT(left)}</b></span>`;}
    if(T<P.bulwarkUntil)b+=`<span class="bf">🛡️<b>${Math.ceil(P.bulwarkUntil-T)}s</b></span>`;if(P.hot)b+=`<span class="bf">❋<b>${Math.ceil(P.hot.until-T)}s</b></span>`;b+=stage2Chips()+profKChips();if(T<(P.slowUntil||0))b+=`<span class="bf slow">🐌<b>${Math.ceil(P.slowUntil-T)}s</b></span>`;if(inTown(P.pos))b+='<span class="bf safe">🏠 Safe</span>';H.buffs.innerHTML=b;
    $('#bSk').classList.toggle('pts',P.sp>0);$('#spBadge').textContent=P.sp>0?P.sp:'';
    const stk=storyTrack();const qt=questTrackHtml();let mt;if(DUN){mt=dunTrack()+hmTrackHtml();}else if(ASSAULT){mt=assaultTrack();}else if(qt){mt=stk+qt;}else mt=stk||(inTown(P.pos)?'<b>Tip</b><br>Visit the 📟 terminal for contracts':'');if(H.mtrack._h!==mt){H.mtrack._h=mt;H.mtrack.innerHTML=mt;}
    nearI=findInteract();if(nearI&&!panelOpen){H.bUse.classList.remove('hidden');H.bUse.textContent=nearI.label;}else H.bUse.classList.add('hidden');
  }
  // waypoint
  const wp=DUN?dunWaypoint():(assaultWaypoint()||storyWaypoint()||missionWaypoint());
  if(wp&&!P.dead){const y=heightAt(wp.x,wp.z);wpBeam.visible=!DUN;wpBeam.position.set(wp.x,y,wp.z);
    projV.set(wp.x,y+3,wp.z).project(camera);const W=innerWidth,Hh=innerHeight;let x=(projV.x*0.5+0.5)*W,yy=(-projV.y*0.5+0.5)*Hh;const behind=projV.z>1;
    if(behind){x=W-x;yy=Hh-60;}const m=50;const off=behind||x<m||x>W-m||yy<m+60||yy>Hh-m;x=clamp(x,m,W-m);yy=clamp(yy,m+60,Hh-m);
    wpEl.classList.remove('hidden');wpEl.style.transform=`translate(${x|0}px,${yy|0}px)`;wpArr.textContent=off?(behind?'▼':x<=m?'◀':x>=W-m?'▶':yy<=m+60?'▲':'▼'):'▼';
    wpTxt.textContent=Math.round(dist2D(wp,P.pos))+'m';}
  else{wpEl.classList.add('hidden');wpBeam.visible=false;}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('#toast').classList.remove('on');}
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('#banner').classList.remove('on');}
}
const mini=$('#mini'),mctx=mini.getContext('2d');let miniAcc=0;
function drawMini(dt){miniAcc+=dt;if(miniAcc<0.08)return;miniAcc=0;const W=300,R=150,sc=R/85;const c=mctx;c.clearRect(0,0,W,W);c.save();c.beginPath();c.arc(R,R,R-2,0,Math.PI*2);c.clip();
  c.fillStyle='rgba(60,32,18,0.55)';c.fillRect(0,0,W,W);
  const yaw=camS.yaw;const cs=Math.cos(yaw),sn=Math.sin(yaw);
  const tf=(x,z)=>{const dx=(x-P.pos.x)*sc,dz=(z-P.pos.z)*sc;return [R+(dx*cs-dz*sn),R+(dx*sn+dz*cs)];};
  const dot=(x,z,col,r)=>{const q=tf(x,z);c.fillStyle=col;c.beginPath();c.arc(q[0],q[1],r,0,7);c.fill();};
  if(DUN){dunMini(c,tf,sc);}else{
  // town walls
  c.strokeStyle='rgba(230,215,190,0.8)';c.lineWidth=4;c.beginPath();[[-TOWN,-TOWN],[TOWN,-TOWN],[TOWN,TOWN],[-TOWN,TOWN]].forEach((p,i)=>{const q=tf(p[0],p[1]);i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);});c.closePath();c.stroke();
  c.fillStyle='rgba(200,170,130,0.5)';for(const r of RUINS){const q=tf(r.x,r.z);c.beginPath();c.arc(q[0],q[1],14*sc/1.8,0,7);c.fill();}
  dot(TERMINAL.x,TERMINAL.z,'#5ff2ff',6);dot(VENDOR.x,VENDOR.z,'#ffc85a',6);
  for(const k in DUNGEONS){const d=DUNGEONS[k].door;const q=tf(d.x,d.z);c.fillStyle='#ff9a2a';c.fillRect(q[0]-6,q[1]-6,12,12);c.strokeStyle='#000';c.lineWidth=2;c.strokeRect(q[0]-6,q[1]-6,12,12);}stage2Mini(c,tf,dot);}
  for(const l of loots)dot(l.x,l.z,RAR[l.item.r].c,4);
  for(const a of allies)dot(a.pos.x,a.pos.z,'#ffa040',4.5);
  for(const e of enemies)if(!e.dead&&Math.abs(e.pos.x-P.pos.x)<95&&Math.abs(e.pos.z-P.pos.z)<95)dot(e.pos.x,e.pos.z,e===P.target?'#fff':e.guard?fzDotCol(e):e.boss?'#ff9a2a':e.state==='chase'?'#ff3b2f':'#e0603a',e.boss?8:e.type==='mauler'?6:4.5);
  if(!DUN){fzMini(c,tf,sc);campMini(c,tf);bankMini(c,tf);raidMini(c,tf);questMini(c,tf);rmMini(c,tf);dynaMini(c,tf);qMini(c,tf);uwpMini(c,tf,R);}
  c.restore();
  const wp=DUN?dunWaypoint():(assaultWaypoint()||storyWaypoint()||missionWaypoint());if(wp){let q=tf(wp.x,wp.z);const dx=q[0]-R,dy=q[1]-R,d=Math.hypot(dx,dy);if(d>R-12){q=[R+dx/d*(R-12),R+dy/d*(R-12)];}c.fillStyle='#ffc85a';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(q[0],q[1]-11);c.lineTo(q[0]+9,q[1]);c.lineTo(q[0],q[1]+11);c.lineTo(q[0]-9,q[1]);c.closePath();c.fill();c.stroke();}
  // north marker
  const nq=[R+(-(-1)*sn)*(R-14),R+(-1*cs)*(R-14)];c.fillStyle='#fff';c.font='bold 22px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('N',nq[0],nq[1]);
  // player arrow (camera-up)
  const a=P.rotY-yaw;c.save();c.translate(R,R);c.rotate(-a+Math.PI);c.fillStyle='#5ff2ff';c.beginPath();c.moveTo(0,-13);c.lineTo(9,10);c.lineTo(0,5);c.lineTo(-9,10);c.closePath();c.fill();c.restore();
}

/* ---------------- save / roster ----------------
  localStorage 'dustreach_roster_v1' = {format:'dustreach-roster',v:1,active:charId,maxSlots,chars:[CharSheet...]}
  CharSheet (v:2) is fully self-contained: identity (id,name,prof), progression (level,xp,sp,ab,sb), kit (eq,imps,inv,consum,stims),
  state (credits,mission,pos,hp,en,buffs[{id,name,icon,rem,mods}]) and party:{ai,role} for future team missions.
  partySnapshot(id) turns any sheet into a ready-to-spawn party member (stats computed from its own gear/implants). */
const ROSTER_KEY='dustreach_roster_v1',MAX_SLOTS=6;
const ROLE={vanguard:'tank',weaver:'control',mender:'healer',flux:'dps',runner:'dps',wright:'pet',wild:'dps',binder:'pet',mind:'control',harm:'support',exact:'support',fist:'dps',shade:'dps',siege:'tank'};
function newCharId(){return 'c'+Date.now().toString(36)+Math.floor(Math.random()*1e5).toString(36);}
// Weave book migration: older characters know their starters, and get a valid (possibly empty) book and 6-slot loadout
function weaveState(s){const pk=PROFS[s.prof]?s.prof:'vanguard';const st=starterIds(pk);const known=[...new Set(st.concat((s.known||[]).filter(id=>WEAVES[id]&&(WEAVES[id].prof===pk||WEAVES[id].prof==='any'))))];
  let slots=Array.isArray(s.slots)?s.slots.slice(0,NSLOTS).map(id=>known.includes(id)||perkAbOk(s,id)?id:null):st.slice(0,NSLOTS);while(slots.length<NSLOTS)slots.push(null);return {known,slots};}
function normalizeChar(s){
  // migrates v1 single-save data: old 'implant' slot -> head implant, gear gets req [] (grandfathered), unspent points granted
  const eq0=s.eq||{};const imps={};IMPSLOTS.forEach(k=>imps[k]=migrateItem((s.imps||{})[k]||null));const inv=(s.inv||[]).slice();
  if(eq0.implant&&!imps.head)imps.head=migrateItem(eq0.implant);else if(eq0.implant)inv.push(eq0.implant);
  return {v:2,id:s.id||newCharId(),created:s.created||s.t||Date.now(),updated:s.updated||s.t||Date.now(),name:(typeof s.name==='string'&&s.name.replace(/\s+/g,' ').trim())?s.name.replace(/\s+/g,' ').trim():'Contractor',prof:PROFS[s.prof]?s.prof:'vanguard',level:s.level||1,xp:s.xp||0,
    credits:s.credits??25,inv:inv.map(migrateItem).filter(Boolean),eq:Object.fromEntries(GSLOTS.map(k=>[k,migrateItem(eq0[k]||null)])),imps,perks:normPerks(s.perks,s.prof,s.level||1,s.ppBonus),pp:s.pp||0,dunClears:s.dunClears||{},savePoint:s.savePoint||null,nodes:s.nodes||['town'],mprefs:s.mprefs||{diff:1,pref:'any'},...futureFields(s),ab:s.ab||{},sb:s.sb||{},sp:s.sp??spTotal(s.level||1),
    consum:s.consum||(s.v===1||!s.v?{focus:1}:{}),buffs:s.buffs||[],stims:s.stims??3,mission:s.mission||null,kills:s.kills||0,pos:s.pos||null,hp:s.hp||0,en:s.en||0,dead:!!s.dead,
    party:s.party||{ai:'default',role:ROLE[s.prof]||'dps'},...weaveState(s)};
}
function loadRoster(){let r=null;try{r=JSON.parse(localStorage.getItem(ROSTER_KEY)||'null');}catch(e){}if(!r||!Array.isArray(r.chars))r=rosterFromBackup()||r;
  if(!r||!Array.isArray(r.chars))r={format:'dustreach-roster',v:1,active:null,maxSlots:MAX_SLOTS,chars:[]};
  if(!r.migratedOld){// migrate the old single save into slot 1, once (old key left in place as a backup)
    try{const old=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(old&&PROFS[old.prof]){const c=normalizeChar(old);r.chars.unshift(c);r.active=c.id;r.migratedOld=true;writeRoster(r);}}catch(e){}}
  r.chars=r.chars.filter(c=>c&&PROFS[c.prof]).map(normalizeChar);
  {const seen={};for(const c of r.chars){if(c.name!=='Contractor'){seen[c.name.toLowerCase()]=1;continue;}let n=c.name,k=2;while(seen[n.toLowerCase()])n='Contractor '+(k++);c.name=n;seen[n.toLowerCase()]=1;}}return r;}
function writeRoster(r){const j=JSON.stringify(r);const ok=lsSet(ROSTER_KEY,j);if(ok&&r.chars&&r.chars.length)rosterBackup(j);return ok;}
let roster=loadRoster();let activeId=null;
function sheetFromPlayer(){return {v:3,id:activeId,created:(roster.chars.find(c=>c.id===activeId)||{}).created||Date.now(),updated:Date.now(),name:P.name,prof:P.prof,level:P.level,xp:P.xp,credits:P.credits,inv:P.inv,eq:P.eq,imps:P.imps,savePoint:P.savePoint,nodes:P.nodes,mprefs:P.mprefs,...futureFields(P),perks:P.perks,pp:P.pp,dunClears:P.dunClears,known:P.known,slots:P.slots,ab:P.ab,sb:P.sb,sp:P.sp,consum:P.consum,
  buffs:P.buffs.map(b=>({id:b.id,name:b.name,icon:b.icon,rem:Math.max(0,b.until-T),mods:b.mods})),stims:P.stims,mission:P.mission,kills:P.kills,pos:DUN?[DUN.ret.x,DUN.ret.z]:[P.pos.x,P.pos.z],hp:P.hp,en:P.en,dead:P.dead,
  party:(roster.chars.find(c=>c.id===activeId)||{}).party||{ai:'default',role:ROLE[P.prof]}};}
function save(){if(state!=='play'||!activeId)return;const sh=sheetFromPlayer();const i=roster.chars.findIndex(c=>c.id===activeId);if(i>=0)roster.chars[i]=sh;else roster.chars.push(sh);roster.active=activeId;writeRoster(roster);}
function deleteChar(id){roster.chars=roster.chars.filter(c=>c.id!==id);if(roster.active===id)roster.active=roster.chars[0]?roster.chars[0].id:null;writeRoster(roster);}
// Hook for future team missions: other roster characters as AI party members, with their own level, gear and implants.
function partySnapshot(id){const c=roster.chars.find(x=>x.id===id);if(!c)return null;const st=statsFor({...c,buffs:[],sync:SYNC.lv});const pr=PROFS[c.prof];
  return {id:c.id,name:c.name,prof:c.prof,profName:pr.name,level:SYNC.lv&&SYNC.lv<c.level?SYNC.lv:c.level,trueLevel:c.level,role:(c.party||{}).role||ROLE[c.prof]||'dps',ai:(c.party||{}).ai||'default',stats:st,eq:c.eq,imps:c.imps,
    basic:pr.basic.id,abilities:c.slots.filter(Boolean),known:c.known,visual:{color:pr.color,accent:pr.accent,visor:pr.visor,face:faceKey(c.clothing&&c.clothing.face),hair:c.clothing&&c.clothing.hair||'crop',hairc:hairCol(c.clothing&&c.clothing.hairc),skin:breedOf(c).skin}};}
function partyCandidates(){return roster.chars.filter(c=>c.id!==activeId).map(c=>partySnapshot(c.id));}
setInterval(save,10000);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});addEventListener('pagehide',save);
window.__drSave=save;

/* ---------------- screens ---------------- */
function resetWorld(){stage2Reset();if(DUN)exitDungeon(true);for(const e of enemies.slice())if(e.temp)removeEnemy(e);campReset();for(const e of enemies){respawnEnemy(e);}
  for(const l of loots){scene.remove(l.m);scene.remove(l.b);}loots.length=0;clearCache();for(const p of projs)scene.remove(p.m);projs.length=0;clearFx();missionOffers=[];vendorStock=[];}
function startGame(s0){saveNagInGame();
  resetWorld();const s=normalizeChar(s0);activeId=s.id;
  Object.assign(P,futureFields(s),{savePoint:s.savePoint,nodes:s.nodes,mprefs:s.mprefs,transit:null,dodges:0,perks:s.perks,pp:s.pp,dunClears:s.dunClears,known:s.known,slots:s.slots,name:s.name,prof:s.prof,level:s.level,xp:s.xp,credits:s.credits,inv:s.inv,eq:s.eq,imps:s.imps,ab:s.ab,sb:s.sb,sp:s.sp,consum:s.consum,buffs:[],stims:s.stims,kills:s.kills,
    target:null,autoAtk:false,cds:{},bulwarkUntil:0,hot:null,dead:false,lastCombat:-99});
  (s.buffs||[]).forEach(b=>{if(b.rem>0)P.buffs.push({id:b.id,name:b.name,icon:b.icon,until:T+b.rem,mods:b.mods});});
  calcStats();P.hp=s.hp?Math.min(s.hp,S.maxHp):S.maxHp;P.en=s.en?Math.min(s.en,S.maxEn):S.maxEn;
  if(s.pos&&!s.dead){P.pos.set(s.pos[0],0,s.pos[1]);collide(P.pos,0.45);}else P.pos.set(0,0,10);
  if(s.dead)P.hp=S.maxHp;
  P.rotY=Math.PI;camS.yaw=0;if(!(s.pos&&!s.dead)){P.rotY=-Math.PI/2;camS.yaw=Math.PI/2;}/* Build P: a fresh spawn at (0,10) faces west across the plaza toward Archivist Sela Marr (the crystal pylon dead ahead blocked W) */camS.pitch=0.38;camS.dist=CAMP.dist;
  qRestoreAll();
  if(!P.savePoint)P.savePoint={id:'town',tot:totXp(),t:Date.now()};
  buildPlayerModel();setupHudForProf();state='play';stage2Start();
  ['#title','#create','#death'].forEach(s=>$(s).classList.add('hidden'));$('#hud').classList.remove('hidden');canvas.focus();save();
  banner("HALDEN'S REST",'Solace Combine outpost · Kessra');
}
function toTitle(){stage2Reset();if(DUN)exitDungeon(true);state='title';$('#hud').classList.add('hidden');$('#death').classList.add('hidden');$('#create').classList.add('hidden');$('#title').classList.remove('hidden');renderTitle();}
function renderTitle(){roster=loadRoster();const tb=$('#titleBtns');tb.innerHTML='';const chars=roster.chars.slice().sort((a,b)=>(b.updated||0)-(a.updated||0));
  const last=chars.find(c=>c.id===roster.active)||chars[0];
  if(last){const b=document.createElement('button');b.className='btn';b.id='bContinue';b.innerHTML='CONTINUE<small>'+esc(last.name)+' · Lv '+last.level+' '+PROFS[last.prof].name+'</small>';b.onclick=()=>{audioInit();SFX.ui();startGame(last);};tb.appendChild(b);}
  if(chars.length){const box=document.createElement('div');box.className='roster';box.innerHTML='<div class="rhead">CHARACTERS '+chars.length+'/'+MAX_SLOTS+'</div>'+chars.map(c=>{const p=PROFS[c.prof];const imps=Object.values(c.imps||{}).filter(Boolean).length;
      return `<div class="rslot${c.id===(last&&last.id)?' last':''}"><span class="sw" style="background:#${p.color.toString(16).padStart(6,'0')}"></span><div class="ri"><b>${esc(c.name)}</b><span>Lv ${c.level} ${(BREEDS[c.breed]||BREEDS.settler).name} ${p.name}${c.faction&&c.faction.side&&FACTIONS[c.faction.side]?' · '+FACTIONS[c.faction.side].icon:''} · ${imps} implant${imps===1?'':'s'} · ${c.credits}¢</span></div><button class="sbtn" data-play="${c.id}">Play</button><button class="sbtn alt" data-ren="${c.id}" title="Rename">✏️</button><button class="sbtn alt rdel" data-del="${c.id}" title="Delete">🗑</button></div>`;}).join('');
    box.addEventListener('click',e=>{const pb=e.target.closest('[data-play]'),db=e.target.closest('[data-del]'),rb=e.target.closest('[data-ren]');audioInit();if(rb){SFX.ui();openRename(rb.dataset.ren);return;}
      if(pb){SFX.ui();const c=roster.chars.find(x=>x.id===pb.dataset.play);if(c)startGame(c);}
      else if(db){const c=roster.chars.find(x=>x.id===db.dataset.del);if(c&&confirm('Delete '+c.name+' (Lv '+c.level+' '+PROFS[c.prof].name+')? This can\'t be undone.')){deleteChar(c.id);renderTitle();}}});
    tb.appendChild(box);}
  const full=roster.chars.length>=MAX_SLOTS;const n=document.createElement('button');n.className='btn'+(chars.length?' alt':'');n.id='bNew';n.innerHTML='NEW CONTRACTOR'+(full?'<small>All '+MAX_SLOTS+' slots used. Delete one first</small>':chars.length?'<small>Slot '+(chars.length+1)+' of '+MAX_SLOTS+'</small>':'');
  n.disabled=full;n.onclick=()=>{if(full)return;audioInit();SFX.ui();openCreate();};tb.appendChild(n);
  const sv=document.createElement('div');sv.className='svrow';sv.innerHTML='<button class="sbtn alt" id="bExport">💾 Export save</button><button class="sbtn alt" id="bImport">📥 Import save</button>';sv.querySelector('#bExport').onclick=()=>{audioInit();SFX.ui();openSaveTools('export');};sv.querySelector('#bImport').onclick=()=>{audioInit();SFX.ui();openSaveTools('import');};tb.appendChild(sv);const nag=saveNagEl();if(nag)tb.insertBefore(nag,tb.children[1]||null);}
let selProf='vanguard';
const NAMES=['Rook','Vesh','Kade','Talin','Mara','Juno','Sable','Orrin','Nyx','Dace','Ilsa','Corvo'];
function openCreate(){$('#title').classList.add('hidden');$('#create').classList.remove('hidden');state='create';createNameUi();renderCards();renderCreateOpts();previewProf();}
const PROF_TAG={vanguard:['Heavy-armoured gunner. Very hard to kill.',1],weaver:['Caster who roots, drains and weakens foes.',2],mender:['Field medic. Heals, outlasts, strong implants.',2],
  flux:['Glass-cannon nuker. Huge damage, fragile.',2],runner:['Fast skirmisher who dodges, snares and kites.',3],wright:['Builds combat bots that fight and tank for you.',1],wild:['Shapeshifter who takes on beast forms.',3],
  binder:['Binds stone golems and flame wisps to fight for you.',1],mind:['Lulls, terrifies and drains foes. Crowd control.',3],harm:['Team buffer: anthems that power up everyone, light heals.',1],
  exact:['Siphons enemy strength and pays it to your team.',2],fist:['Unarmed martial artist. Fast strikes, self-heals.',2],shade:['Stealth assassin. Huge crit openers, then vanish.',3],siege:['Heavy guns, AoE shells and a reflector shield.',1]};
const DIFF_N=['','Easy','Medium','Hard'];
function profFullHtml(k){const p=PROFS[k];return `<h3><span class="sw" style="background:#${p.color.toString(16).padStart(6,'0')}"></span>${p.name}</h3><div class="role">${p.role} · ${'★'.repeat((PROF_TAG[k]||['',2])[1])}${'☆'.repeat(3-(PROF_TAG[k]||['',2])[1])} ${DIFF_N[(PROF_TAG[k]||['',2])[1]]}</div><p>${p.desc}</p><ul><li>${p.basic.icon} <b>${p.basic.name}</b> (auto-attack)</li>${p.abilities.map(a=>`<li>${a.icon} <b>${a.name}</b>: ${a.desc} <span style="color:#9ff">(${a.cost} energy)</span></li>`).join('')}</ul><p style="color:#5ff2ff">+ ${Object.values(WEAVES).filter(w=>w.prof===k&&!w.starter).length} more Weaves to learn from Weave Disks up to level 10 (${Object.values(WEAVES).filter(w=>w.prof===k&&!w.starter&&/AoE/.test(w.desc)).length} AoE)</p><p style="opacity:.7">Health ×${p.hpMul} · Energy ×${p.enMul}<br>Cheap to train: ${Object.keys(p.cost).filter(x=>p.cost[x]===1).map(x=>STATN[x]).join(', ')}</p>`;}
function openProfFull(k){const b=$('#profFull');b.querySelector('.pfbody').innerHTML=profFullHtml(k);b.classList.remove('hidden');}
function renderCards(){const row=$('#profCards');row.innerHTML='';for(const k in PROFS){const p=PROFS[k];const t=PROF_TAG[k]||[p.role,2];const d=document.createElement('button');d.className='card'+(k===selProf?' sel':'');d.dataset.p=k;
  d.innerHTML=`<h3><span class="sw" style="background:#${p.color.toString(16).padStart(6,'0')}"></span>${p.name}</h3><div class="role">${p.role}</div><div class="tag">${t[0]}</div><div class="diff" title="Difficulty">${'★'.repeat(t[1])}<span>${'★'.repeat(3-t[1])}</span> <small>${DIFF_N[t[1]]}</small></div><span class="pinfo" title="Full details">ⓘ</span>`;
  d.onclick=e=>{SFX.ui();const info=e.target.closest&&e.target.closest('.pinfo');if(selProf!==k){selProf=k;renderCards();previewProf();}if(info)openProfFull(k);};row.appendChild(d);}
  const p=PROFS[selProf];$('#profInfo').innerHTML=`<div class="pidesc"><b>${p.name}</b>: ${p.desc}</div><div class="pichips"><span title="${p.basic.name}">${p.basic.icon} ${p.basic.name}</span>${p.abilities.map(a=>`<span title="${a.desc}">${a.icon} ${a.name}</span>`).join('')}</div><button class="sbtn alt" id="bProfFull">ⓘ Full details</button>`;
  $('#bProfFull').onclick=()=>{SFX.ui();openProfFull(selProf);};}
function previewProf_v1(){P.prof=selProf;buildPlayerModel();}
$('#bPfClose').onclick=()=>{SFX.ui();$('#profFull').classList.add('hidden');};
$('#bBack').onclick=()=>{SFX.ui();toTitle();};
$('#bDeploy').onclick=()=>{audioInit();const ck=showNameErr($('#nameIn'),$('#nameErr'),null);if(!ck.ok){SFX.err();toast(ck.msg);try{$('#nameIn').focus();}catch(e){}return;}SFX.quest();const name=ck.name;$('#nameIn').value='';delete $('#nameIn').dataset.touched;P.prof=selProf;
  const w=genItem(1,'weapon',0,{wt:PROF_WT[selProf]});const a=genItem(1,'armor',0,{fam:PROF_FAM[selProf]});w.name='Outpost-issue '+WTYPES[PROF_WT[selProf]].names[0];a.name='Worn '+AFAM[PROF_FAM[selProf]].pre[0]+' '+AFAM[PROF_FAM[selProf]].names.armor[0];w.req=[];a.req=[];w.bonus=[];a.bonus=[];
  const i1=genImplant(3,'eyes',0),i2=genImplant(8,'head',1);
  startGame({v:2,id:newCharId(),created:Date.now(),name,prof:selProf,breed:selBreed,faction:{side:selFac,rep:{combine:0,ashborn:0}},level:1,xp:0,credits:25,inv:[i1,i2].concat(selProf==='wild'?[genDisk('morph_wolf')]:[]),eq:{weapon:w,armor:a},clothing:{hair:selHair,hairc:selHairC,face:selFace},imps:{},ab:{},sb:{},sp:SP_START,consum:{focus:1},stims:3,story:newStory()});
  if(selProf==='wild')setTimeout(()=>log('🐺 Wildshifter: your first Morph disk (<b>Dune Wolf</b>) is in your 🎒 pack. Use it to learn the morph, then slot it in the 📖 Weave Book.'),3200);
  setTimeout(()=>log('Tip: open 📈 <b>Skills</b> to spend points. In 🎒 <b>Implants</b>, a Focus Stim lets you install the QL 8 Cortex implant early.'),2500);};
$('#bRespawn').onclick=()=>{SFX.ui();respawnPlayer();};

/* ---------------- main loop ---------------- */
let last=performance.now(),fpsAcc=0,fpsN=0,slowT=0;
function frame(now){requestAnimationFrame(frame);if(SIMP){last=now;return;}if(GFXC.fps30&&now-last<30)return;let dt=(now-last)/1000;last=now;if(dt>0.05)dt=0.05;if(dt<=0)return;T+=dt;
  updStage1(dt);pylon.rotation.y+=dt*0.8;for(const f of doorFx)f.rotation.z+=dt;pylonRing.rotation.z+=dt*0.5;termScreen.material.color.setHSL(0.51,0.9,0.55+Math.sin(T*3)*0.08);
  if(state==='play'){
    updPlayer(dt);updStage2(dt);updCamps(dt);updBanks();updWorld2(dt);updRaidPortals(dt);updTeam(dt);updProfK(dt);updQuests(dt);updDyna(dt);updBuildC(dt);for(let i=enemies.length-1;i>=0;i--)updEnemy(enemies[i],dt);updProjs(dt);dieStep(dt);updRings(dt);updSched(dt);updLoot(dt);if(DUN)updDungeon(dt);if(P.transit)P.moving=0;updCamera(dt);updGfxL(dt);updXmGate(dt);updSun(dt);updEnv(dt);updDeclutter(dt);updCraftQ(dt);updRm(dt);fzUpdate(dt);tdUpdate(dt);xrCull(dt);updFloats(dt);updHUD(dt);drawMini(dt);
  }else{
    // title flyover
    const a=T*0.05;camera.position.set(Math.sin(a)*72,24+Math.sin(T*0.2)*2,Math.cos(a)*72);camera.lookAt(0,2,0);window.__sky.position.copy(camera.position);
    if(state==='create'&&PM){PM.g.position.set(0,0,14);PM.g.rotation.set(0,T*0.8,0);PM.anim(T,0,0);pShadow.position.set(0,0.06,14);camera.position.set(0,2.4,19.5);camera.lookAt(0,1.1,14);}
    for(const e of enemies)if(!e.dead){e.R.g.visible=!e.bur&&dist2D(e.pos,camera.position)<160;}
  }
  if(state==='create')createPreview();
  renderer.render(scene,camera);
  // fps + adaptive resolution
  fpsAcc+=dt;fpsN++;if(fpsAcc>=1){const fps=fpsN/fpsAcc;H.fps.textContent=Math.round(fps)+' fps · '+renderer.info.render.calls+' calls · '+pixelRatio.toFixed(2)+'x';
    if(state==='play'&&fps<45&&pixelRatio>1){slowT++;if(slowT>=3){pixelRatio=Math.max(1,pixelRatio-0.25);renderer.setPixelRatio(pixelRatio);onResize();slowT=0;}}else slowT=0;fpsAcc=0;fpsN=0;}
}
renderTitle();requestAnimationFrame(frame);
window.__dr={aggro,partySnapshot,BREEDS,breedOf,attrCap,costOf,FACTIONS,REP_TIERS,fac,repTier,gainRep,joinFaction,openRegistrar,openFacVendor,facStock,FSTOCK,facBuy,facCanUse,facFlavour,TW,SITES,TSITES,activateSite,deactivateSite,startAssault,endAssault,get ASSAULT(){return ASSAULT;},plantTower,startPlant,towersHeld,openTowerInfo,VEHICLES,grantVehicle,buyVehicle,summonVehicle,mountUp,dismount,toggleMount,mountMul,allies,PETDEF,summonPet,activePet,petCmd,createAlly,spawnPartyMember,foeOf,NPCS,renderCreateOpts,get selBreed(){return selBreed;},set selBreed(v){selBreed=v;},get selFac(){return selFac;},set selFac(v){selFac=v;},closePanel,get panelOpen(){return panelOpen;},inCombat,setDayTime,dayInfo,get dayT(){return dayT;},WX,applySky,spawnNight,CONDUIT,PADS,SAVEPTS,OUTPOSTS,openConduit,conduitTravel,recordSavePoint,unsavedXp,totXp,applyXpLoss,rollVeil,mythicDisk,VEIL_RATE,veilActive,MDIFF,genMission,missionReward,dodgeRoll,dmgPlayer,mprefs,FUTURE,get PM(){return PM;},nameFits,gearName,rollBossLoot,BOSSES,get inv(){return P.inv;},DUNGEONS,UNIQUES,SETS,WTYPES,AFAM,makeUnique,enterDungeon,exitDungeon,get DUN(){return DUN;},get telegraphs(){return DUN?DUN.tele:[];},dunOnKill,dmgEnemy,killEnemy,playerDie,respawnPlayer,openDoor,get vendorStock(){return vendorStock;},genDiskForLevel,findInteract,refreshGearVisual,basicAb,get loots(){return loots;},updLoot,WEAVES,genDisk,learnDisk,assignSlot,openBook,setupHud,get fields(){return fields;},wipe(){activeId=null;roster={format:'dustreach-roster',v:1,active:null,maxSlots:MAX_SLOTS,chars:[],migratedOld:true};localStorage.clear();},get roster(){return roster;},partySnapshot,partyCandidates,statsFor,get activeId(){return activeId;},addBuff,updBuffs,useConsum,equip,unequip,openSkills,raise,genImplant,calcStats,eff,reqMet,get invTab(){return invTab;},set invTab(v){invTab=v;},set invSel(v){invSel=v;},P,enemies,get S(){return S;},useAbility,pressAttack,startGame,openInventory,openTerminal,openVendor,acceptMission,get missionOffers(){return missionOffers;},heightAt,camS,setTarget,get state(){return state;},dropLoot,genItem,get T(){return T;},interact,renderer,get pixelRatio(){return pixelRatio;}};Object.defineProperties(window.__dr,Object.getOwnPropertyDescriptors(s3Exports()));Object.defineProperties(window.__dr,Object.getOwnPropertyDescriptors(storyExports()));Object.defineProperties(window.__dr,Object.getOwnPropertyDescriptors(morphExports()));Object.defineProperties(window.__dr,Object.getOwnPropertyDescriptors(runExports()));Object.defineProperties(window.__dr,Object.getOwnPropertyDescriptors(campExports()));Object.defineProperties(window.__dr,Object.getOwnPropertyDescriptors(bankExports()));Object.defineProperties(window.__dr,Object.getOwnPropertyDescriptors(worldExports()));Object.defineProperties(window.__dr,Object.getOwnPropertyDescriptors(raidExports()));for(const f of [teamExports,questExports,dynaExports,nameExports,gfxExports,saveExports,declutterExports,buildBExports,buildCExports,dunDExports,perkExports,lootExports,fzExports,tdExports,tierExports,profKExports,gfxLExports,capMExports,sunExports,simExports,xpLockExports,craftQExports,rmExports,hmExports,homeExports])Object.defineProperties(window.__dr,Object.getOwnPropertyDescriptors(f()));
Object.assign(window.__dr,{normCloth,RAR,ETYPES,respawnEnemy,save,cq,bakeRig,rigLod,dieStart,dieStep,HAIRC,hairCol,CORPSES,killEnemy,removeEnemy,dmgEnemy,dmgPlayer,makeHair,selLook:()=>({selHair,selHairC})});
})();
