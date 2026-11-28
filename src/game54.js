/* ================= Build Y (2026-11-27, GB-3): HD look for hubs, mounts and the remaining procedural enemies =================
   Same rules as the rest of the HD look (game44): only when Look = HD, lazy-loaded, classic look untouched when HD is off,
   and if a file fails to load everything simply stays classic.
   - hd/critters.glb (Quaternius CC0: Spider, Crab, Snake, Golem = Ultimate Monsters "Yeti"; tools/hd/critters.mjs): the bug,
     grub and golem enemy types in HDY_BEAST join HD_BEAST (same build/tick code: hdBeastBuild/hdBeastTick, clips '<Model>|<Clip>').
     The file loads the first time such an enemy is near in the HD look; until then (or if it fails) those enemies are simply not
     registered as HD NPCs and keep their classic rigs. Bosses stay classic (game44 rule). A model without a Death clip (Snake)
     keeps the classic corpse tilt.
   - hd/kitworld.glb (Kenney Space Kit 2.0, CC0; tools/hd/kitworld.mjs): hover craft and hangars. The kit's four flat materials
     (metal / metalRed / metalDark / dark) are re-coloured per use.
     Mounts: each skiff group (buildBike, added to the scene, not the player group) gets an HD craft (HDY_CRAFT per vehicle,
     tinted with the vehicle's colours, userData.keepHd=1); the classic body is hidden only while HD is on; the glow stays.
     Hubs: Halden's Rest's six buildings and every outpost's canopy building get a hangar over the same footprint (classic
     instances/meshes hidden while HD is on, restored when it's off), a dish or generator on some roofs. Collision boxes,
     doors, NPCs and every other mesh are untouched.
   HDY.off=true disables all of it (tests/dev). No storage keys. */
const HDY={off:false,cr:{state:'',gl:null,pend:[]},kw:{state:'',gl:null,mats:{}},hub:null,mountBuilt:{}};
const HDY_BEAST={
  skitter:{f:'critters',n:'Spider',h:0.75,col:0xc9a07a,k:0.55},vskitter:{f:'critters',n:'Spider',h:0.75,col:0x6a3a8a,k:0.55},
  spitter:{f:'critters',n:'Spider',h:0.8,col:0x8fd8e0,k:0.5},thornling:{f:'critters',n:'Spider',h:0.8,col:0x5a7a2a,k:0.55},
  bonemite:{f:'critters',n:'Spider',h:0.8,col:0xd8d0b8,k:0.6},voidling:{f:'critters',n:'Spider',h:0.8,col:0x3a2a5a,k:0.6},
  shardling:{f:'critters',n:'Crab',h:1.0,col:0x9fd8ff,k:0.55},mireling:{f:'critters',n:'Crab',h:1.0,col:0x4a6a3a,k:0.55},
  burrower:{f:'critters',n:'Snake',h:1.2,col:0xc8dcec,k:0.55},mirelurk:{f:'critters',n:'Snake',h:1.2,col:0x5a6a3a,k:0.5},
  briarworm:{f:'critters',n:'Snake',h:1.25,col:0x6a4a2a,k:0.5},bonecrawler:{f:'critters',n:'Snake',h:1.25,col:0xc8bca0,k:0.55},
  shardgolem:{f:'critters',n:'Golem',h:2.6,col:0x2a2630,k:0.75},scarbehemoth:{f:'critters',n:'Golem',h:2.7,col:0x5a3a2a,k:0.6}};
HD_BEAST_CLIPS.critters={idle:'Idle',walk:'Walk',run:'Walk',melee:'Attack',ranged:'Attack',death:'Death'};
const HDY_RUN={Golem:'Run'};
/* ---------- critters ---------- */
function hdyCritLoad(){const C=HDY.cr;if(C.state)return;C.state='loading';
  new THREE.GLTFLoader().load(hdUrl('critters'),g=>{try{g.scene.traverse(o=>{if(o.isMesh){o.frustumCulled=false;}});HD.gl.critters=g;C.gl=g;C.state='ready';
      const L=C.pend;C.pend=[];for(const R of L)hdyCritReg(R);}catch(e){C.state='failed';C.err=String(e).slice(0,120);}},null,e=>{C.state='failed';C.err=String(e&&e.message||e).slice(0,120);C.pend=[];});}
function hdyCritReg(R){if(!R||R.hdSeed||!R.g||!R.hdyB)return;const e=R.hdyE;if(e&&(e.dead||!enemies.includes(e)))return;
  hdNpcReg(R,0,0,0,{});R.hdE=e;R.hdB=R.hdyB;}
{const _mkY=makeEnemy;makeEnemy=function(type){const e=_mkY.apply(this,arguments);try{const R=e&&e.R,B=HDY_BEAST[type];
  if(B&&R&&!R.hdSeed&&!HDY.off){R.hdyB=B;R.hdyE=e;if(HDY.cr.state==='ready')hdyCritReg(R);else if(HDY.cr.state!=='failed')HDY.cr.pend.push(R);}}catch(err){}return e;};}
// models without a death clip keep the classic corpse tilt (no counter-rotation); the golem runs with its own Run clip
{const _btY=hdBeastTick;hdBeastTick=function(R,now){const H=R.hd;if(H&&R.hdB&&R.hdB.f==='critters'){
    if(!H.yfix){H.yfix=1;const run=HDY_RUN[R.hdB.n];if(run&&H.clips[run])H.C=Object.assign({},H.C,{run});}
    if(R.hdE&&R.hdE.dead&&!H.clips[H.C.death]){H.mixer.update(0);return;}}
  return _btY(R,now);};}
/* ---------- kit (mounts + hubs) ---------- */
function hdyKitLoad(cb){const K=HDY.kw;if(K.state==='ready'){cb&&cb();return;}if(K.state==='loading'||K.state==='failed')return;K.state='loading';
  new THREE.GLTFLoader().load(hdUrl('kitworld'),g=>{try{const p={};g.scene.updateMatrixWorld(true);for(const c of g.scene.children)p[c.name]=c;K.gl=g;K.p=p;K.state='ready';cb&&cb();}catch(e){K.state='failed';}},null,()=>{K.state='failed';});}
const HDY_DARK=0x1a1c20;
// a recoloured copy of a kit model, sized to (sx,sy,sz) metres (its own box), base on y=0, centred on x/z
function hdyKitModel(name,pal,sx,sy,sz){const src=HDY.kw.p&&HDY.kw.p[name];if(!src)return null;const o=src.clone(true);o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);
  const cache={};o.traverse(m=>{if(!m.isMesh)return;const nm=(m.material&&m.material.name)||'';const key=nm;
    if(!cache[key]){const c=new THREE.MeshLambertMaterial({color:nm==='metal'?pal.a:nm==='metalRed'?pal.b:nm==='metalDark'?pal.c:HDY_DARK});cache[key]=c;}
    m.material=cache[key];m.castShadow=false;m.userData.keepHd=1;m.userData.hdy=1;});
  o.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(o),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
  const g=new THREE.Group();g.add(o);const kx=sx/Math.max(0.01,s.x),ky=sy==null?Math.min(kx,sz/Math.max(0.01,s.z)):sy/Math.max(0.01,s.y),kz=sz/Math.max(0.01,s.z);
  o.scale.set(kx,ky,kz);o.position.set(-c.x*kx,-b.min.y*ky,-c.z*kz);g.userData.keepHd=1;g.userData.hdy=1;return g;}
const shade=(hex,k)=>new THREE.Color(hex).multiplyScalar(k).getHex();
/* mounts: craft per vehicle; the classic skiff points along +z */
const HDY_CRAFT={skiff:'craft_speederA',patrol:'craft_speederB',cutter:'craft_speederC',pathfinder:'craft_speederA',gilded:'craft_racer',nightglider:'craft_speederD',stairstrider:'craft_racer'};
const HDY_CRAFT_YAW=Math.PI;// Kenney craft face -z
function hdyMountSync(id){const b=bikes[id];if(!b||!b.body)return;const want=hdOn()&&!HDY.off;
  if(want&&!b.hdy&&HDY.kw.state==='ready'){const v=VEHICLES[id]||{};const nm=HDY_CRAFT[id]||'craft_speederA';
    const g=hdyKitModel(nm,{a:v.col||0xc9a07a,b:v.glow||0x5ff2ff,c:v.trim||0x5a4632},1.7,null,2.7);if(g){g.rotation.y=HDY_CRAFT_YAW;g.position.y=0.28;b.g.add(g);b.hdy=g;g.name='hdyCraft';}}
  else if(want&&!b.hdy)hdyKitLoad();
  const on=want&&!!b.hdy;b.body.visible=!on;if(b.hdy)b.hdy.visible=on;}
{const _umY=updMountPose;updMountPose=function(dt){_umY.apply(this,arguments);try{if(P.mount)hdyMountSync(P.mount);}catch(e){}};}
/* hubs */
const HDY_TOWN=[[-19,-19,11,6,9],[19,-19,10,8,9],[-19,19,9,5,10],[19,19,12,6,8],[-21,0,6,4,8],[21,2,6,10,6]];
function hdyStructMesh(){return scene.children.find(o=>o.isInstancedMesh&&o.userData.env==='struct');}
function hdyHubBuild(){if(HDY.hub||HDY.kw.state!=='ready')return;const H={g:new THREE.Group(),hidden:[],meshes:[],dressed:false};H.g.name='hdyHubs';H.g.userData.hdy=1;
  const im=hdyStructMesh();const m4=new THREE.Matrix4();
  // Halden's Rest: hangar over each building box; body, roof and window strip instances are hidden while HD is on
  HDY_TOWN.forEach(([x,z,sx,h,sz],i)=>{if(im)structs.forEach((s,j)=>{if(Math.abs(s.x-x)<0.01&&Math.abs(s.z-z)<sz/2+0.3&&s.y<=h+0.6&&s.sx<=sx+0.7){im.getMatrixAt(j,m4);H.hidden.push([j,m4.clone()]);}});
    const pal={a:i%2?0xd8d2c4:0xc9b49a,b:0x4f6b80,c:shade(i%2?0xd8d2c4:0xc9b49a,0.62)};
    // doors (the hangar's open end) face the town square; side buildings are turned 90 degrees, so their footprint is swapped
    const side=Math.abs(x)>Math.abs(z);const g=hdyKitModel(i%2?'hangar_largeB':'hangar_largeA',pal,side?sz:sx,h,side?sx:sz);if(!g)return;g.position.set(x,0,z);
    g.rotation.y=side?(x>0?Math.PI/2:-Math.PI/2):(z>0?0:Math.PI);
    H.g.add(g);
    if(i===1||i===3){const d=hdyKitModel(i===1?'satelliteDish_large':'machine_generatorLarge',{a:0xb8b2a6,b:0xb5522c,c:0x6f6a66},2.2,null,2.2);if(d){d.position.set(x,h,z);H.g.add(d);}}});
  // outposts: the canopy building (4 x 2.8 x 3 at local (3,1.4,4)) and its roof slab
  for(const o of OUTPOSTS){const y=heightAt(o.x,o.z);const grp=scene.children.find(c=>c.isGroup&&Math.abs(c.position.x-o.x)<0.01&&Math.abs(c.position.z-o.z)<0.01&&c.children.some(m=>m.isMesh&&Math.abs(m.position.x-3)<0.01&&Math.abs(m.position.z-4)<0.01));
    if(!grp)continue;for(const m of grp.children)if(m.isMesh&&Math.abs(m.position.x-3)<0.01&&Math.abs(m.position.z-4)<0.01){H.meshes.push(m);}
    const pl=o.pal||[0xb59a7e,0x9c8f80,0xc9b49a,0xb5522c];const g=hdyKitModel('hangar_smallA',{a:pl[2],b:pl[3],c:shade(pl[1],0.7)},4,2.8,3);if(!g)continue;
    g.position.set(o.x+3,y,o.z+4);g.rotation.y=Math.PI;H.g.add(g);
    const d=hdyKitModel('satelliteDish_large',{a:0xb8b2a6,b:pl[3],c:0x6f6a66},1.4,null,1.4);if(d){d.position.set(o.x+3.6,y+2.8,o.z+4.3);H.g.add(d);}}
  H.im=im;scene.add(H.g);HDY.hub=H;}
function hdyHubSync(){const want=hdOn()&&!HDY.off&&typeof DUN!=='undefined'&&!DUN;if(want&&!HDY.hub){if(HDY.kw.state==='ready')hdyHubBuild();else hdyKitLoad();}
  const H=HDY.hub;if(!H)return;const on=!!(hdOn()&&!HDY.off);if(H.dressed===on)return;H.dressed=on;H.g.visible=on;
  const z=new THREE.Matrix4().makeScale(0,0,0);if(H.im){for(const [j,m] of H.hidden)H.im.setMatrixAt(j,on?z:m);H.im.instanceMatrix.needsUpdate=true;}
  for(const m of H.meshes)m.visible=!on;}
/* sync: every frame from the HD NPC tick (runs only while HD is on) + when the look changes */
{const _ntY=hdNpcTick;hdNpcTick=function(){_ntY.apply(this,arguments);if(HDY.off||!hdOn()||HD.state!=='ready')return;
  try{if(HDY.cr.pend.length&&!HDY.cr.state)hdyCritLoad();}catch(e){}try{hdyHubSync();}catch(e){}};}
{const _slY=setLook;setLook=function(v){const r=_slY.apply(this,arguments);try{hdyHubSync();for(const id in bikes)hdyMountSync(id);}catch(e){}return r;};}
function hdyExports(){return {HDY,HDY_BEAST,HDY_CRAFT,hdyCritLoad,hdyKitLoad,hdyHubSync,hdyMountSync,hdyHubBuild,bikes};}
