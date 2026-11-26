/* ================= HD LOOK (beta, 2026-11-23, Claude): skinned, animated characters =================
   A per-device graphics option (Settings → Graphics → Look: Classic / HD). Classic stays the default and is untouched.
   Assets: hd/*.glb (Quaternius Universal Base Characters + Modular Character Outfits - Fantasy + Universal Animation Library,
   all CC0; packed by tools/hd/pack.mjs). Loaded on demand by THREE.GLTFLoader (src/vendor/three-gltf.js), cached by sw.js
   in its own 'dustreach-hd' cache so a game update doesn't re-download them. URLs carry ?v=__HDV__ (hash of the files).
   How it plugs in: the classic rig (PM) is still built and still drives everything that reads PM.* (gear, veil, mounts,
   emotes...), but its meshes are hidden every frame and an HD body is parented to PM.g. PM.anim is wrapped: the HD mixer
   picks clips from the same inputs (moving, atkAnim, hurt) plus P.cast / P.mount / P.dead.
   Two animation layers: lower body (root, pelvis, legs) = locomotion; upper body = attack / cast / locomotion. Each clip
   is split once into _U and _L halves (hdSplit) so you can shoot while running.
   Outfit by gear slot: armour family light -> Peasant, medium -> Ranger, heavy -> Ranger + pauldrons (steel tint);
   an empty slot shows the Peasant piece. Rarity tints the outfit slightly. Head armour shows the hood (hides hair).
   Body type (Male/Female frame) is P.clothing.body ('m'/'f'), chosen at creation or at the apartment mirror.
   Device setting: localStorage 'dustreach_look_v1' ('hd' | 'classic'). */
const LOOK_KEY='dustreach_look_v1',HDV='__HDV__';
const HD={state:'off',gl:{},clips:null,err:'',want:false};
const HD_FILES={anims:'anims',m_head:'m_head',f_head:'f_head',m_ranger:'m_ranger',m_peasant:'m_peasant',f_ranger:'f_ranger',f_peasant:'f_peasant',
  hair_buzzed:'hair_buzzed',hair_buzzedfemale:'hair_buzzedfemale',hair_long:'hair_long',hair_buns:'hair_buns',hair_simpleparted:'hair_simpleparted',hair_beard:'hair_beard',weapons:'weapons',mech:'mech',wolf:'wolf',bestiary:'bestiary'};
// weapon models (Quaternius Sci-Fi Guns / Medieval Weapons / RPG packs): node in weapons.glb, length in metres, source axis, grip point along the length (0 = back end)
const HD_WPN={rifle:{n:'sf_rifle',L:0.95,ax:'-z',grip:0.32},shotgun:{n:'fps_shotgun',L:0.85,ax:'-z',grip:0.3},pistol:{n:'sf_pistol',L:0.32,ax:'-z',grip:0.18},smg:{n:'sf_longpistol',L:0.4,ax:'-z',grip:0.15},
  emitter:{n:'sf_raygun',L:0.45,ax:'-z',grip:0.2},cannon:{n:'sf_lightning',L:0.95,ax:'-z',grip:0.35},blade:{n:'md_sword',L:1.0,ax:'y',grip:0.12},bow:{n:'md_bow',L:1.15,ax:'y',grip:0.5},rod:{n:'rpg_staff',L:1.35,ax:'y',grip:0.35}};
const HD_HAIR={crop:['hair_buzzed','hair_buzzedfemale'],ridge:['hair_simpleparted','hair_simpleparted'],long:['hair_long','hair_long'],knot:['hair_buns','hair_buns'],none:[null,null]};
const HD_SCALE=1.1;// Quaternius bodies are ~1.8 m; the classic figures stand a little taller
const HD_LOWER=new Set(['root','pelvis','thigh_l','calf_l','foot_l','ball_l','ball_leaf_l','thigh_r','calf_r','foot_r','ball_r','ball_leaf_r']);
function lookGet(){try{return localStorage.getItem(LOOK_KEY)==='hd'?'hd':'classic';}catch(e){return 'classic';}}
function hdOn(){return HD.want;}
function hdUrl(f){return 'hd/'+f+'.glb?v='+HDV;}
function hdSplit(clips){const out={};for(const c of clips){
    const U=[],L=[];for(const t of c.tracks){const bone=t.name.split('.')[0];(HD_LOWER.has(bone)?L:U).push(t);}
    out[c.name]={full:c,U:new THREE.AnimationClip(c.name+'_U',c.duration,U),L:new THREE.AnimationClip(c.name+'_L',c.duration,L)};}
  return out;}
function hdLoad(){if(HD.state==='loading'||HD.state==='ready')return;HD.state='loading';const L=new THREE.GLTFLoader();
  const keys=Object.keys(HD_FILES);let n=0;
  Promise.all(keys.map(k=>new Promise((res,rej)=>L.load(hdUrl(HD_FILES[k]),g=>{n++;res([k,g]);},null,rej)))).then(list=>{
    for(const [k,g] of list){HD.gl[k]=g;g.scene.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=false;const m=o.material;
      // the classic world renders linear colours: treat textures as-is so the HD bodies match its brightness
      for(const t of ['map','normalMap'])if(m[t]){m[t].encoding=THREE.LinearEncoding;m[t].anisotropy=2;}m.needsUpdate=true;});}
    HD.clips=hdSplit(HD.gl.anims.animations);HD.wpn=hdWeapons(HD.gl.weapons);HD.state='ready';
    try{if(state==='play'&&PM)buildPlayerModel();}catch(e){}
    try{if(typeof toast==='function'&&HD.announce)toast('✨ HD look loaded');}catch(e){}
  }).catch(e=>{HD.state='error';HD.err=String(e&&e.message||e).slice(0,120);try{warn('HD look could not load ('+HD.err+'). Using Classic.');}catch(_){}});}
function setLook(v,announce){v=v==='hd'?'hd':'classic';try{localStorage.setItem(LOOK_KEY,v);}catch(e){}HD.want=v==='hd';HD.announce=!!announce;
  if(HD.want){if(HD.state==='ready'){try{if(PM)buildPlayerModel();}catch(e){}}else hdLoad();}else{try{hdNpcClear();if(PM)buildPlayerModel();}catch(e){}}}
// skinned meshes from separate files share one skeleton by bone name (all Quaternius assets use the same UE-style rig)
function hdRebind(mesh,byName){const bones=mesh.skeleton.bones.map(b=>byName[b.name]||b);mesh.bind(new THREE.Skeleton(bones,mesh.skeleton.boneInverses),mesh.bindMatrix);}
function hdTake(key,byName,parent){const g=HD.gl[key];if(!g)return [];const src=THREE.SkeletonUtils.clone(g.scene);const out=[];
  src.traverse(o=>{if(o.isSkinnedMesh){o.material=o.material.clone();out.push(o);}});
  for(const m of out){hdRebind(m,byName);parent.add(m);}return out;}
function hdBuild(o){const sex=o.sex==='f'?'f':'m';const g=new THREE.Group();g.name='hdChar';
  const base=THREE.SkeletonUtils.clone(HD.gl[sex+'_head'].scene);g.add(base);let skel=null;base.traverse(c=>{if(c.isSkinnedMesh){c.material=c.material.clone();if(!skel)skel=c.skeleton;}});
  const byName={};skel.bones.forEach(b=>byName[b.name]=b);
  const H={g,base,sex,byName,parts:{},hair:null,beard:null,mixer:new THREE.AnimationMixer(base),act:{},cur:{U:'',L:''},oneshot:null,t:0,lastT:null,dead:false};
  // outfit pieces: both outfits are loaded, the visible set is chosen by hdDress()
  for(const kit of ['peasant','ranger'])for(const m of hdTake(sex+'_'+kit,byName,base)){const nm=m.name.replace(/^(Fem|M)ale_(Peasant|Ranger)_/,'').replace(/_\d+$/,'');
    const k=kit+':'+nm;(H.parts[k]=H.parts[k]||[]).push(m);m.visible=false;m.userData.base=m.material.color.getHex();}
  const hk=(HD_HAIR[o.hair]||HD_HAIR.crop)[sex==='f'?1:0];if(hk){H.hair=hdTake(hk,byName,base);H.hair.forEach(m=>m.material.color.setHex(o.hairc||0x2a1d14));}
  if(o.beard&&sex==='m'){H.beard=hdTake('hair_beard',byName,base);H.beard.forEach(m=>m.material.color.setHex(o.hairc||0x2a1d14));}
  // weapon: a copy of the classic gun mesh, parented to the right hand
  H.hand=byName.hand_r;H.gun=null;
  hdPlay(H,'Idle_Loop','U');hdPlay(H,'Idle_Loop','L');H.mixer.update(0.01);
  return H;}
function hdTint(meshes,hex,k){for(const m of meshes||[]){const c=new THREE.Color(m.userData.base);if(hex!=null)c.lerp(new THREE.Color(hex),k);m.material.color.copy(c);}}
// show one outfit per slot from the equipped (or transmogged) gear
function hdDress(H,eq){if(!H)return;eq=eq||{};for(const k in H.parts)H.parts[k].forEach(m=>m.visible=false);
  const show=(kit,names,it)=>{for(const nm of names){const ms=H.parts[kit+':'+nm];if(!ms)continue;ms.forEach(m=>m.visible=true);
      const heavy=it&&it.fam==='heavy';hdTint(ms,it?(heavy?0x8a96a8:RAR[it.r]?RAR[it.r].h:null):null,it?(heavy?0.45:0.18):0);}};
  const kitOf=it=>!it?'peasant':it.fam==='light'?'peasant':'ranger';
  const body=eq.armor;show(kitOf(body),['Body','Body_Belt'],body);if(body&&body.fam==='heavy')show('ranger',['Acc_Pauldron','Acc_Pauldrons'],body);
  const hands=eq.hands;show(kitOf(hands),['Arms'],hands);if(hands&&kitOf(hands)==='ranger')show('ranger',['Arms_Bracer'],hands);
  show(kitOf(eq.legs),['Legs'],eq.legs);show(kitOf(eq.feet),['Feet','Feet_Boots'],eq.feet);
  const hood=!!(eq.head&&eq.head.fam!=='light');if(hood)show('ranger',['Head_Hood'],eq.head);
  (H.hair||[]).forEach(m=>m.visible=!hood);}
function hdPlay(H,name,layer,once){const C=HD.clips[name];if(!C)return;const key=name+'_'+layer;let a=H.act[key];
  if(!a){a=H.act[key]=H.mixer.clipAction(C[layer]);}
  const prev=H.act[H.cur[layer]+'_'+layer];
  if(once){a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}else a.setLoop(THREE.LoopRepeat,Infinity);
  if(prev===a&&!once)return;a.enabled=true;a.setEffectiveWeight(1);a.play();if(prev&&prev!==a)prev.crossFadeTo(a,once?0.08:0.22,false);H.cur[layer]=name;}
function hdWeaponKind(){const w=P.eq&&P.eq.weapon,W=w&&WTYPES[w.wt];if(!W)return 'gun';if(w.wt==='fist')return 'fist';if(W.melee)return 'blade';if(W.sk==='weave')return 'rod';return 'gun';}
function hdAnimate(H,mv,atk,hurt){const now=T,dt=H.lastT==null?0.016:Math.min(0.1,Math.max(0,now-H.lastT));H.lastT=now;
  if(P.dead){if(!H.dead){H.dead=true;hdPlay(H,'Death01','U',true);hdPlay(H,'Death01','L',true);}H.mixer.update(dt);return;}
  if(H.dead){H.dead=false;H.cur={U:'',L:''};}
  const wk=hdWeaponKind();
  if(P.mount){hdPlay(H,'Driving_Loop','U');hdPlay(H,'Driving_Loop','L');H.mixer.update(dt);return;}
  const loco=mv>0.05?(mv>0.75?'Jog_Fwd_Loop':'Walk_Loop'):null;
  const fight=!!(P.autoAtk||P.target&&!P.target.dead&&P.target.state==='chase');
  const idleU=wk==='blade'||wk==='fist'?(fight?'Sword_Idle':'Idle_Loop'):wk==='rod'?(fight?'Spell_Simple_Idle_Loop':'Idle_Loop'):(fight?'Pistol_Idle_Loop':'Idle_Loop');
  // attack: P.atkAnim is set to 0.2-0.4 on each swing/shot and counts down; fire a one-shot on the rising edge
  if(atk>0&&!(H.lastAtk>0)){const a=wk==='blade'?'Sword_Attack':wk==='fist'?((H.jab=!H.jab)?'Punch_Jab':'Punch_Cross'):wk==='rod'?'Spell_Simple_Shoot':'Pistol_Shoot';H.oneshot={n:a,until:now+Math.min(0.9,HD.clips[a].full.duration)};hdPlay(H,a,'U',true);}
  H.lastAtk=atk;
  const casting=P.cast&&!P.cast.done;
  if(H.oneshot&&now<H.oneshot.until){}else{H.oneshot=null;hdPlay(H,casting?'Spell_Simple_Idle_Loop':loco||idleU,'U');}
  hdPlay(H,loco||(casting?'Spell_Simple_Idle_Loop':idleU),'L');
  if(loco){const a=H.act[loco+'_L'];if(a)a.timeScale=loco==='Jog_Fwd_Loop'?Math.max(0.8,Math.min(1.3,(P.speedNow||7)/7)):1;}
  H.mixer.update(dt);}
// normalise each weapon model: points along +Z, grip at the origin, real-world length
function hdWeapons(g){const out={};if(!g)return out;g.scene.updateMatrixWorld(true);
  for(const wt in HD_WPN){const c=HD_WPN[wt];const src=g.scene.getObjectByName(c.n);if(!src)continue;const inner=src.clone(true);inner.position.set(0,0,0);
    inner.traverse(o=>{if(o.isMesh){o.castShadow=false;o.frustumCulled=false;}});
    const pivot=new THREE.Group();pivot.add(inner);if(c.ax==='-z')inner.rotation.y=Math.PI;else if(c.ax==='y')inner.rotation.x=Math.PI/2;
    pivot.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(pivot),sz=b.getSize(new THREE.Vector3());const k=c.L/Math.max(sz.z,1e-6);
    inner.scale.multiplyScalar(k);pivot.updateMatrixWorld(true);const b2=new THREE.Box3().setFromObject(pivot);
    inner.position.set(-(b2.min.x+b2.max.x)/2,-(b2.min.y+b2.max.y)/2,-(b2.min.z+(b2.max.z-b2.min.z)*c.grip));
    out[wt]=pivot;}
  return out;}
// keep the HD weapon in step with the classic gun mesh (shape/colour/scale are set by refreshGearVisual)
function hdSyncGun(H){const src=PM&&PM.gun;if(!src||!H.hand)return;const w=P.eq&&P.eq.weapon,wt=w&&w.wt,model=HD.wpn&&HD.wpn[wt];
  if(model){if(!H.gun||H.gun.userData.wt!==wt){if(H.gun)H.gun.parent&&H.gun.parent.remove(H.gun);H.gun=model.clone(true);H.gun.userData.wt=wt;H.hand.add(H.gun);}
    H.gun.scale.setScalar(1/Math.max(0.001,PM.g.scale.y||1));H.gun.position.set(0,0.09,0.02);H.gun.rotation.set(Math.PI/2,0,0);H.gun.visible=!P.mount;return;}
  if(!H.gun||H.gun.userData.src!==src.geometry){if(H.gun)H.gun.parent&&H.gun.parent.remove(H.gun);H.gun=new THREE.Mesh(src.geometry,src.material);H.gun.userData.src=src.geometry;H.hand.add(H.gun);}
  H.gun.material=src.material;const wk=hdWeaponKind();
  // the hand bone's local axes: +Y runs along the fingers; weapons point forward out of the fist
  const s=1/Math.max(0.001,(PM.g.scale.y||1));H.gun.scale.set(src.scale.x*s,src.scale.y*s,src.scale.z*s);
  H.gun.position.set(0,0.08,wk==='blade'?0.03:0);H.gun.rotation.set(Math.PI/2,0,0);H.gun.visible=wk!=='fist'&&!P.mount;}
// hide every classic mesh under PM.g except the HD body (gear code keeps adding meshes, so this runs each frame)
function hdHideClassic(R){const keep=R.hd&&R.hd.g;R.g.traverse(o=>{if(o===keep||o.userData.keepHd)return;if(o.isMesh||o.isSkinnedMesh){let p=o.parent,inHd=false;while(p){if(p===keep){inHd=true;break;}p=p.parent;}if(!inHd)o.visible=false;}});}
function hdAttachPlayer(){if(!PM||!hdOn()||HD.state!=='ready'||PM.hd)return;
  const CL=P.clothing||{};const hc=hairCol(CL.hairc);
  let H;try{H=hdBuild({sex:CL.body,hair:CL.hair,hairc:hc,beard:CL.face==='grizzled'||CL.face==='weathered'});}catch(e){HD.state='error';HD.err=String(e).slice(0,120);return;}
  PM.hd=H;PM.g.add(H.g);H.g.rotation.y=0;H.g.scale.setScalar(HD_SCALE);
  hdDress(H,typeof xmogEq==='function'?xmogEq(P.eq):P.eq);
  const a0=PM.anim;PM.anim=(t,mv,atk,hurt)=>{a0(t,mv,atk,hurt);try{hdNpcTick();}catch(e){}if(!PM.hd)return;hdHideClassic(PM);hdSyncGun(PM.hd);
    // the classic death tips PM.g over; the HD death animation does its own fall
    if(P.dead){PM.hd.g.rotation.set(-PM.g.rotation.x,0,-PM.g.rotation.z);}else PM.hd.g.rotation.set(0,0,0);
    hdAnimate(PM.hd,mv,atk,hurt);};}
const _buildPlayerModelHd=buildPlayerModel;
buildPlayerModel=function(){_buildPlayerModelHd();try{hdAttachPlayer();}catch(e){HD.state='error';HD.err=String(e).slice(0,120);}};
const _refreshGearVisualHd=refreshGearVisual;
refreshGearVisual=function(){_refreshGearVisualHd.apply(this,arguments);try{if(PM&&PM.hd)hdDress(PM.hd,typeof xmogEq==='function'?xmogEq(P.eq):P.eq);}catch(e){}};
HD.want=lookGet()==='hd';if(HD.want)setTimeout(()=>{try{hdLoad();}catch(e){}},300);
function hdExports(){return {HD_BEAST_DIM,HD_BEAST,HD_ENEMY_MAX,HD_NPCS,hdNpcTick,HD,LOOK_KEY,lookGet,setLook,hdLoad,hdBuild,hdDress,hdOn,get hdPlayer(){return PM&&PM.hd;}};}
// Settings → Graphics: the Look switch
const _gfxMenuHtmlHd=gfxMenuHtml;
gfxMenuHtml=function(){const v=lookGet(),st=HD.state==='loading'?' (loading…)':HD.state==='error'?' (failed: '+esc(HD.err)+')':'';
  return _gfxMenuHtmlHd()+`<div class="h4" style="margin-top:14px">🧍 Look <small style="text-transform:none;opacity:.7">beta</small></div><div class="tabs" style="margin:0"><button data-act="look" data-l="classic" class="${v==='classic'?'on':''}">Classic</button><button data-act="look" data-l="hd" class="${v==='hd'?'on':''}">HD${v==='hd'?st:''}</button></div>
  <div style="opacity:.75;font-size:12px;margin-top:4px">HD swaps your character for a detailed, animated model (about 11 MB, downloaded once and kept for offline play). Townspeople, human enemies, robots, hounds and monsters near you get HD bodies too. Pick Male or Female at the apartment mirror.</div>`;};
const _stage3ActHd=stage3Act;
stage3Act=function(a,b){if(a==='look'){setLook(b.dataset.l,true);openMenu();return true;}return _stage3ActHd(a,b);};
/* ---- HD townspeople: NPC humanoids ({npc:1}: quest givers, vendors, escorts, faction officers, AI teammates) ----
   Registered at build time; within HD_NPC_R of the player they get an HD body (lazy, once) and their classic rig is hidden.
   Sex/outfit/hair come from a hash of their colours, so the same NPC always looks the same. Markers added after the build
   (quest "!" octahedrons etc.) stay visible: only the rig's own meshes and anything under its limb groups are hidden. */
const HD_NPC_R=60;// HD_NPCS lives in game25 (registered by the buildHumanoid hook there, which runs before the world's NPCs are built)
function hdNpcReg(R,body,accent,visor,o){const rig=new Set();R.g.traverse(c=>{if(c.isMesh)rig.add(c);});
  R.hdSeed={h:hash32((body|0)*7+(accent|0)*13+(visor|0)),body,o:Object.assign({},o)};R.hdRig=rig;HD_NPCS.push(R);
  const a0=R.anim;if(a0)R.anim=(t,mv,atk,hit)=>{a0(t,mv,atk,hit);R.hdIn={mv:mv||0,atk:atk||0,t:T};};}
function hdNpcBuild(R){if(R.hdE)return hdEnemyBuild(R);const s=R.hdSeed,o=s.o,h=s.h>>>0;const sex=(h>>>5)%2?'f':'m';
  const hair=o.hair||(o.helm||o.hood?'crop':['crop','long','knot','ridge','crop','none'][(h>>>3)%6]);
  const H=hdBuild({sex,hair,hairc:o.hairc||[0x2a1d14,0x5a3a22,0xb89060,0x161210,0x8a8a90,0x7a3a1e][(h>>>7)%6],beard:sex==='m'&&(h>>>9)%3===0});
  const fam=o.armed||o.helm||o.cape||o.heavy?'medium':'light';const r=(h>>>11)%3;
  hdDress(H,{armor:{fam,r},hands:{fam,r},legs:{fam:'light',r:0},feet:{fam,r:0},head:o.helm||o.hood?{fam:'medium',r}:null});
  // a touch of the NPC's own colour on the outfit, so vendors and officers keep their identity
  for(const k in H.parts)if(/Body|Arms/.test(k))H.parts[k].forEach(m=>{if(m.visible)m.material.color.lerp(new THREE.Color(s.body),0.35);});
  H.g.scale.setScalar(HD_SCALE);R.g.add(H.g);R.hd=H;H.npc=true;return H;}
function hdHideRig(R){const limbs=[R.torso,R.head,R.armL,R.armR,R.legL,R.legR,R.hips].filter(Boolean);
  R.g.traverse(c=>{if(!c.isMesh||c.visible===false)return;if(R.hdRig.has(c)){c.visible=false;return;}let p=c.parent;while(p&&p!==R.g){if(limbs.includes(p)){c.visible=false;return;}p=p.parent;}});}
function hdNpcTick(){if(!hdOn()||HD.state!=='ready'||!P||!P.pos)return;const px=P.pos.x,pz=P.pos.z,now=T;let built=0,nE=0;
  for(let i=HD_NPCS.length-1;i>=0;i--){const R=HD_NPCS[i];const g=R.g;if(!g.parent){if(R.gone==null)R.gone=now;else if(now-R.gone>30)HD_NPCS.splice(i,1);continue;}R.gone=null;
    if(!g.visible)continue;g.getWorldPosition(tmpV);if(Math.abs(tmpV.x-px)>HD_NPC_R||Math.abs(tmpV.z-pz)>HD_NPC_R)continue;
    if(!R.hd){if(built>=2||R.hdE&&(R.hdE.boss||nE>=HD_ENEMY_MAX))continue;try{hdNpcBuild(R);built++;}catch(e){HD_NPCS.splice(i,1);continue;}}
    hdHideRig(R);if(R.hdE){nE++;hdEnemyTick(R,now);continue;}const H=R.hd,inp=R.hdIn&&now-R.hdIn.t<0.5?R.hdIn:{mv:0,atk:0};const dt=H.lastT==null?0.016:Math.min(0.1,Math.max(0,now-H.lastT));H.lastT=now;
    if(inp.atk>0&&!(H.lastAtk>0)){const a=R.melee?'Sword_Attack':'Pistol_Shoot';H.oneshot={n:a,until:now+0.8};hdPlay(H,a,'U',true);}H.lastAtk=inp.atk;
    const loco=inp.mv>0.05?(inp.mv>0.75?'Jog_Fwd_Loop':'Walk_Loop'):null;const idle=(R.hdSeed.h>>>13)%4===0?'Idle_Talking_Loop':'Idle_Loop';
    if(!(H.oneshot&&now<H.oneshot.until)){H.oneshot=null;hdPlay(H,loco||idle,'U');}hdPlay(H,loco||idle,'L');H.mixer.update(dt);}}
// classic look again: drop the HD bodies and show the rigs
function hdNpcClear(){for(const R of HD_NPCS)if(R.hd){R.g.remove(R.hd.g);R.hd=null;R.g.traverse(c=>{if(R.hdRig.has(c))c.visible=true;});}}
/* ---- HD enemies (2026-11-24): humanoid enemies (raiders, enforcers, casters, wardens...) get HD bodies too ----
   buildHumanoid (game25) keeps each enemy's colours/options on R.hdArgs; makeEnemy (wrapped here) registers them after bakeRig.
   Robots (sentries, wardens) and bosses stay classic. At most HD_ENEMY_MAX HD enemies at once (nearest first, by build order).
   Outfit: robes -> light kit, heavy -> ranger + pauldrons, otherwise ranger; hood with a hood/helm; tinted with the enemy's colour
   (elites a little purple). Weapon by role: melee -> sword, robed casters -> staff, ranged -> rifle. Dying enemies play Death01
   while the classic corpse tilt (dieStep) is counter-rotated. */
const HD_ENEMY_MAX=12;
const _makeEnemyHd=makeEnemy;
makeEnemy=function(type,x,z,lv,temp){const e=_makeEnemyHd.apply(this,arguments);try{const R=e&&e.R,A=R&&R.hdArgs;
  if(A&&R.kind==='hum'&&!A.o.robot&&!R.hdSeed){hdNpcReg(R,A.body,A.accent,A.visor,A.o);R.hdE=e;}
  else if(HD_BEAST[type]&&!R.hdSeed){hdNpcReg(R,0,0,0,{});R.hdE=e;R.hdB=HD_BEAST[type];}}catch(err){}return e;};
function hdEnemyBuild(R){if(R.hdB)return hdBeastBuild(R);const s=R.hdSeed,o=s.o,h=s.h>>>0,e=R.hdE;const sex=(h>>>5)%2?'f':'m';
  const H=hdBuild({sex,hair:o.hair||(o.hood||o.helm?'crop':['crop','crop','ridge','long'][(h>>>3)%4]),hairc:o.hairc||[0x161210,0x2a1d14,0x5a3a22,0x3a2a2a][(h>>>7)%4],beard:sex==='m'&&(h>>>9)%2===0});
  const fam=o.robe?'light':o.heavy?'heavy':'medium',r=e&&e.elite?3:0,top={fam,r};
  hdDress(H,{armor:top,hands:top,legs:{fam:o.robe?'light':'medium',r:0},feet:{fam:'medium',r:0},head:o.hood||o.helm?{fam:'medium',r}:null});
  for(const k in H.parts){const ms=H.parts[k];if(/Body|Arms|Pauldron|Hood/.test(k))ms.forEach(m=>{if(m.visible)m.material.color.lerp(new THREE.Color(o.robe||o.hood||s.body),0.78);});
    else if(/Legs/.test(k))ms.forEach(m=>{if(m.visible)m.material.color.lerp(new THREE.Color(o.legc||s.accent),0.6);});}
  const wk=R.melee?'blade':o.robe?'rod':'rifle';const W=HD.wpn&&HD.wpn[wk];
  if(W&&H.hand){H.gun=W.clone(true);H.hand.add(H.gun);H.gun.position.set(0,0.09,0.02);H.gun.rotation.set(Math.PI/2,0,0);}
  H.wk=wk;H.g.scale.setScalar(HD_SCALE);R.g.add(H.g);R.hd=H;H.npc=true;return H;}
function hdEnemyTick(R,now){if(R.hdB)return hdBeastTick(R,now);const H=R.hd,e=R.hdE,inp=R.hdIn&&now-R.hdIn.t<0.5?R.hdIn:{mv:0,atk:0};const dt=H.lastT==null?0.016:Math.min(0.1,Math.max(0,now-H.lastT));H.lastT=now;
  if(e.dead){if(!H.dead){H.dead=true;H.oneshot=null;hdPlay(H,'Death01','U',true);hdPlay(H,'Death01','L',true);}
    const g=R.g;H.g.rotation.set(-g.rotation.x,0,-g.rotation.z);H.mixer.update(dt);return;}
  if(H.dead){H.dead=false;H.cur={U:'',L:''};H.g.rotation.set(0,0,0);}
  if(inp.atk>0&&!(H.lastAtk>0)){const a=H.wk==='blade'?'Sword_Attack':H.wk==='rod'?'Spell_Simple_Shoot':'Pistol_Shoot';H.oneshot={n:a,until:now+0.8};hdPlay(H,a,'U',true);}H.lastAtk=inp.atk;
  const loco=inp.mv>0.05?(inp.mv>0.75||e.state==='chase'?'Jog_Fwd_Loop':'Walk_Loop'):null;const fight=e.state==='chase';
  const idle=fight?(H.wk==='blade'?'Sword_Idle':H.wk==='rod'?'Spell_Simple_Idle_Loop':'Pistol_Idle_Loop'):'Idle_Loop';
  if(!(H.oneshot&&now<H.oneshot.until)){H.oneshot=null;hdPlay(H,loco||idle,'U');}hdPlay(H,loco||idle,'L');H.mixer.update(dt);}
/* ---- HD robots and hounds (2026-11-24): Quaternius Animated Mech Pack + Ultimate Animated Animals (both CC0) ----
   hd/mech.glb holds Stan, Mike and Leela; hd/wolf.glb the Wolf (tools/hd/beasts.mjs). Each enemy type below gets that model at
   its classic height h (R.g's own level scale still applies), tinted toward col by k. Clips are '<Model>|<Clip>'.
   Bosses stay classic (same rule as HD humans) and these count towards HD_ENEMY_MAX.
   2026-11-26: the Bestiary monsters (f:'bestiary') join them for the beast-type enemies, using the humans' clips (hdMonClips). */
const HD_BEAST={
  sentry:{f:'mech',n:'Stan',h:2.0},warden:{f:'mech',n:'Mike',h:1.8},
  custodian:{f:'mech',n:'Leela',h:2.7},oxidebrute:{f:'mech',n:'Leela',h:2.7,col:0x7a5a3a,k:0.35},thunderhulk:{f:'mech',n:'Leela',h:2.7,col:0x4a5a7a,k:0.35},
  ashhound:{f:'wolf',n:'Wolf',h:1.05,col:0x8a5434,k:0.65},stalker:{f:'wolf',n:'Wolf',h:1.1,col:0x8fb8d0,k:0.6},cinderwraith:{f:'wolf',n:'Wolf',h:1.1,col:0x3a1e16,k:0.7},
  coilhound:{f:'wolf',n:'Wolf',h:1.1,col:0x3e7a6c,k:0.6},galehound:{f:'wolf',n:'Wolf',h:1.1,col:0x9aa8b8,k:0.55},voidhound:{f:'wolf',n:'Wolf',h:1.1,col:0x3a2a5a,k:0.7},
  // 2026-11-26: Quaternius Bestiary - Dungeon Monsters Kit (hd/bestiary.glb, tools/hd/bestiary.mjs), driven by the HD humans' clips
  mauler:{f:'bestiary',n:'Lycan',h:2.6,col:0xa07a4a,k:0.3,melee:'Punch_Cross'},brute:{f:'bestiary',n:'Tidebreaker',h:2.6,col:0x7a7066,k:0.3},
  bloomhulk:{f:'bestiary',n:'Tidebreaker',h:2.6,col:0x4a7a3a,k:0.4},shambler:{f:'bestiary',n:'Skeleton_A',h:2.4,col:0x9fd0ff,k:0.35},
  ossuarch:{f:'bestiary',n:'Skeleton_B',h:2.4},bloatmaw:{f:'bestiary',n:'Puglin',h:2.2,col:0x6a8a4a,k:0.3},
  voidmaw:{f:'bestiary',n:'Hellwarden',h:2.6,col:0x5a3a8a,k:0.35},ashspawn:{f:'bestiary',n:'Imp',h:1.3}};
const HD_BEAST_CLIPS={mech:{idle:'Idle',walk:'Walk',run:'Run',melee:'Punch',ranged:'Shoot',death:'Death'},wolf:{idle:'Idle',walk:'Walk',run:'Gallop',melee:'Attack',ranged:'Attack',death:'Death'},
  bestiary:{idle:'Idle_Loop',walk:'Walk_Loop',run:'Jog_Fwd_Loop',melee:'Sword_Attack',ranged:'Spell_Simple_Shoot',death:'Death01'}};
// Bestiary monsters share the HD humans' rig (same bone names and axes) but not their rest posture or size. Each rotation key
// is applied as a change from the human's rest pose on top of the monster's own (q = monRest * humRest^-1 * key), so a hunched
// Lycan stays hunched. Bone names in the shared file carry loader suffixes (pelvis_2), so tracks are matched without them
// and renamed to the monster's bones; root/pelvis translation is scaled by pelvis height; tracks for bones a monster lacks are dropped. Cached per model.
const HD_MON_CLIPS={};
function hdMonClips(n,o){if(HD_MON_CLIPS[n])return HD_MON_CLIPS[n];const mb={},hb={};HD.gl.m_head.scene.traverse(b=>{if(b.isBone)hb[b.name]=b;});o.traverse(b=>{if(b.isBone)mb[hb[b.name]?b.name:b.name.replace(/_\d+$/,'')]=b;});
  const hp=hb.pelvis,mp=mb.pelvis;const k=hp&&mp?mp.position.length()/Math.max(1e-6,hp.position.length()):1;const out={},q=new THREE.Quaternion(),d=new THREE.Quaternion();
  for(const name in HD.clips){const c=HD.clips[name].full;const tr=[];for(const t of c.tracks){const bone=t.name.split('.')[0],M=mb[bone],Hb=hb[bone];if(!M)continue;const tn=M.name+t.name.slice(bone.length);
      if(/\.position$/.test(t.name)){const u=t.clone();u.name=tn;for(let i=0;i<u.values.length;i++)u.values[i]*=k;tr.push(u);}
      else if(/\.quaternion$/.test(t.name)&&Hb){const u=t.clone();u.name=tn;const v=u.values,hi=Hb.quaternion.clone().invert();
        for(let i=0;i<v.length;i+=4){d.fromArray(v,i);q.copy(M.quaternion).multiply(hi).multiply(d).toArray(v,i);}tr.push(u);}
      else{const u=t.clone();u.name=tn;tr.push(u);}}
    out[name]=new THREE.AnimationClip(c.name,c.duration,tr);}
  return HD_MON_CLIPS[n]=out;}
function hdBeastBuild(R){const B=R.hdB,gl=HD.gl[B.f],src=gl&&gl.scene.getObjectByName(B.n);if(!src)throw new Error('no '+B.n);
  const o=THREE.SkeletonUtils.clone(src);o.position.set(0,0,0);o.rotation.set(0,0,0);
  o.traverse(m=>{if(!m.isMesh)return;m.frustumCulled=false;const ms=Array.isArray(m.material)?m.material:[m.material];
    const r=ms.map(x=>{const c=x.clone();if(B.col!=null&&!/eye/i.test(x.name||''))c.color.lerp(new THREE.Color(B.col),B.k||0.5);return c;});m.material=r.length===1?r[0]:r;});
  const g=new THREE.Group();g.name='hdBeast';g.add(o);const H={g,o,mixer:new THREE.AnimationMixer(o),act:{},cur:'',beast:true,lastT:null,dead:false,C:HD_BEAST_CLIPS[B.f],clips:{}};
  if(B.f==='bestiary'){H.clips=hdMonClips(B.n,o);if(B.melee)H.C=Object.assign({},H.C,{melee:B.melee});}
  else for(const c of gl.animations)if(c.name.startsWith(B.n+'|'))H.clips[c.name.slice(B.n.length+1)]=c;
  hdBeastPlay(H,H.C.idle);H.mixer.update(0.01);
  // size from the posed, skinned vertices (the bind-pose mesh box ignores the armature's scale and axes); cached per model
  const D=HD_BEAST_DIM[B.n]||(HD_BEAST_DIM[B.n]=hdBeastMeasure(o));const k=B.h/Math.max(0.01,D.h);
  o.scale.multiplyScalar(k);o.position.set(-D.cx*k,-D.y0*k,-D.cz*k);R.g.add(g);R.hd=H;H.npc=true;return H;}
const HD_BEAST_DIM={};
function hdBeastMeasure(o){o.updateMatrixWorld(true);const b=new THREE.Box3(),v=new THREE.Vector3();
  o.traverse(m=>{if(!m.isSkinnedMesh)return;m.skeleton.update();const P=m.geometry.attributes.position;for(let i=0;i<P.count;i+=2){v.fromBufferAttribute(P,i);m.boneTransform(i,v);v.applyMatrix4(m.matrixWorld);b.expandByPoint(v);}});
  const c=b.getCenter(new THREE.Vector3());return {h:b.max.y-b.min.y,y0:b.min.y,cx:c.x,cz:c.z,sx:b.max.x-b.min.x,sz:b.max.z-b.min.z};}
function hdBeastPlay(H,name,once){const c=H.clips[name];if(!c)return;let a=H.act[name];if(!a)a=H.act[name]=H.mixer.clipAction(c);
  const prev=H.act[H.cur];if(once){a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}else a.setLoop(THREE.LoopRepeat,Infinity);
  if(prev===a&&!once)return;a.enabled=true;a.setEffectiveWeight(1);a.play();if(prev&&prev!==a)prev.crossFadeTo(a,once?0.08:0.2,false);H.cur=name;}
function hdBeastTick(R,now){const H=R.hd,e=R.hdE,C=H.C,inp=R.hdIn&&now-R.hdIn.t<0.5?R.hdIn:{mv:0,atk:0};const dt=H.lastT==null?0.016:Math.min(0.1,Math.max(0,now-H.lastT));H.lastT=now;
  if(e.dead){if(!H.dead){H.dead=true;H.oneshot=null;hdBeastPlay(H,C.death,true);}const g=R.g;H.g.rotation.set(-g.rotation.x,0,-g.rotation.z);H.mixer.update(dt);return;}
  if(H.dead){H.dead=false;H.cur='';H.g.rotation.set(0,0,0);}
  if(inp.atk>0&&!(H.lastAtk>0)){const a=e.T.ranged?C.ranged:C.melee,c=H.clips[a];if(c){H.oneshot=now+Math.min(0.9,c.duration);hdBeastPlay(H,a,true);}}H.lastAtk=inp.atk;
  if(!(H.oneshot&&now<H.oneshot)){H.oneshot=null;const run=inp.mv>0.05&&(inp.mv>0.75||e.state==='chase');hdBeastPlay(H,inp.mv>0.05?(run?C.run:C.walk):C.idle);
    const a=H.act[H.cur];if(a&&H.cur===C.run)a.timeScale=1.15;}
  H.mixer.update(dt);}

