/* ---------- Bigger world: biome props, water, region banners, sky tint, chunk culling, exploration, world map + custom waypoint ---------- */
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// ---- new wild pack camps: two per region, gated like the region ----
const NEWCAMPS=[
  ['prism','Prism Hollows',1,-10,300,[7,9],6,['spitter','spitter','mauler','skitter']],['shardcrown','Shardcrown',1,12,362,[8,10],7,['mauler','spitter','raider']],
  ['ashpit','Ashfall Pit',2,50,305,[8,10],6,['mauler','raider','spitter']],['cinderhowl','Cinderhowl Ridge',2,72,360,[9,10],7,['mauler','mauler','spitter','raider']],
  ['junkward','Junkward',3,110,300,[6,8],6,['raider','raider','spitter']],['rustgate','Rustmaw Gate',3,132,360,[7,9],7,['raider','mauler','raider','spitter']],
  ['reedbank','Reedbank',4,170,295,[3,5],5,['skitter','spitter','skitter']],['palmrest','Palmrest Wells',4,192,355,[4,6],6,['raider','skitter','spitter']],
  ['redgulch','Redgulch',5,230,300,[5,7],6,['raider','skitter','raider']],['spirehold','Spirehold Mesa',5,252,360,[6,8],7,['mauler','raider','skitter']],
  ['saltbones','Saltbones',6,290,300,[4,6],5,['spitter','skitter','skitter']],['mirage','Mirage Pans',6,312,360,[5,7],6,['spitter','raider','skitter']]];
// ---- Duskcrown Highlands (Lv 11-20): twelve camps around the outer ring; level follows gloamLv (11 at Farwatch, 20 on the far side) ----
[['violetsteps','Violet Steps',175,470,['stalker','shardcaller','stalker']],['lanternfall','Lanternfall',125,540,['stalker','stalker','tender']],
 ['glintwood','Glintwood',205,540,['stalker','shardcaller','brute']],['shardmire','Shardmire',95,470,['shardcaller','shardcaller','stalker','tender']],
 ['choirrise','Choirgate Rise',230,470,['brute','shardcaller','tender']],['craghollows','Crag Hollows',65,540,['brute','stalker','stalker']],
 ['echoterr','Echo Terraces',282,540,['shardcaller','tender','stalker','brute']],['brutegrave','Brutegrave',35,470,['brute','brute','tender']],
 ['seraphfields','Seraph Fields',300,470,['stalker','shardcaller','tender','brute']],['duskspire','Duskspire',5,540,['brute','shardcaller','stalker']],
 ['glasscrown','Crown of Glass',322,540,['brute','shardcaller','tender','stalker']],['lastlight','Last Light',345,470,['stalker','brute','shardcaller','tender']]
].forEach(([id,name,deg,r,mix])=>{const [x,z]=gloamAt(deg,r);const L=gloamLv(x,z);NEWCAMPS.push([id,name,GB,deg,r,[clamp(L-1,11,MAXLVL),clamp(L,11,MAXLVL)],mix.length>3?7:6,mix]);});
// ---- Rimefall Expanse (Lv 21-30, Build C): twelve camps; level follows rimeLv (21 at Hoarlight Hold, 30 on the far side) ----
[['frostgate','Frostgate Drifts',345,690,['burrower','burrower','frostcaller']],['paletrail','Pale Trail',312,770,['shambler','burrower','frostcaller']],
 ['hoarcliffs','Hoar Cliffs',10,770,['frostcaller','frostcaller','sentinel','burrower']],['glacierbed','Glacier Bed',290,690,['shambler','shambler','sentinel']],
 ['whitewind','Whitewind Shelf',45,690,['burrower','shambler','frostcaller']],['stillmere','Stillmere',268,770,['frostcaller','sentinel','shambler','burrower']],
 ['rimeteeth','Rime Teeth',62,770,['shambler','sentinel','burrower','frostcaller']],['silentcairn','Silent Cairns',225,690,['sentinel','frostcaller','shambler','burrower']],
 ['frostcrown','Frostcrown Rise',112,690,['shambler','shambler','sentinel','frostcaller']],['hushfields','Hush Fields',195,770,['burrower','burrower','sentinel','frostcaller']],
 ['ironfrost','Ironfrost Hollow',130,770,['shambler','frostcaller','sentinel','burrower']],['lastwinter','Last Winter',158,690,['sentinel','shambler','frostcaller','burrower']]
].forEach(([id,name,deg,r,mix])=>{const [x,z]=rimeAt(deg,r);const L=rimeLv(x,z);NEWCAMPS.push([id,name,RB,deg,r,[clamp(L-1,21,MAXLVL),clamp(L,21,MAXLVL)],mix.length>3?7:6,mix]);});
for(const [id,name,bi,deg,r,lv,n,mix] of NEWCAMPS){const a=deg*Math.PI/180;const c={id,name,x:Math.cos(a)*r,z:Math.sin(a)*r,lv,n,mix,biome:bi,gate:BIOMES[bi].gate};initCamp(c);CAMPS.push(c);}
// ---- props (instanced, bucketed into a 4x4 grid so far buckets can be hidden) ----
const PROPB=[];const PB_N=8,PB_S=WORLD/PB_N;// Build M: 8x8 buckets of 300 m in the 2400 m world
(function buildProps(){const R=rng32(9137);const rr=(a,b)=>a+R()*(b-a);const o=new THREE.Object3D(),col=new THREE.Color();
  const near=(x,z,d)=>CAMPS.some(c=>Math.hypot(c.x-x,c.z-z)<d)||OUTPOSTS.some(q=>Math.hypot(q.x-x,q.z-z)<q.r+12)||Object.values(DUNGEONS).some(q=>Math.hypot(q.door.x-x,q.door.z-z)<16)||TSITES.some(t=>Math.hypot(t.x-x,t.z-z)<16);
  const W7=new Float32Array(NB);
  // ring regions sample an annulus (so their density does not thin out as the world grows); the outer Rimefall samples the whole square
  function spots(bi,n,minW,pred){const out=[];let tries=0;const rM=bi<GB?440:bi===GB?670:0;while(out.length<n&&tries<n*40){tries++;let x,z;if(rM){const a=rr(0,6.2832),r=Math.sqrt(rr(235*235,rM*rM));x=Math.cos(a)*r;z=Math.sin(a)*r;}else{x=rr(-HALF+50,HALF-50);z=rr(-HALF+50,HALF-50);}if(Math.hypot(x,z)<235)continue;biomeW(x,z,W7);if(W7[bi]<minW)continue;if(near(x,z,13))continue;if(pred&&!pred(x,z))continue;out.push([x,z]);}return out;}
  function emit(type,geo,mat,items,circleR){const buckets={};for(const it of items){const bx=clamp(Math.floor((it.x+HALF)/PB_S),0,PB_N-1),bz=clamp(Math.floor((it.z+HALF)/PB_S),0,PB_N-1);(buckets[bx+','+bz]=buckets[bx+','+bz]||[]).push(it);}
    for(const k in buckets){const L=buckets[k];const im=new THREE.InstancedMesh(geo,mat,L.length);L.forEach((it,i)=>{o.position.set(it.x,it.y,it.z);o.rotation.set(it.rx||0,it.ry||0,it.rz||0);o.scale.set(it.sx,it.sy,it.sz);o.updateMatrix();im.setMatrixAt(i,o.matrix);im.setColorAt(i,col.setHex(it.c));
        if(it.cr)circles.push({x:it.x,z:it.z,r:it.cr});});
      im.frustumCulled=false;const [bx,bz]=k.split(',').map(Number);im.userData={x0:bx*PB_S-HALF,z0:bz*PB_S-HALF,type};scene.add(im);PROPB.push(im);}}
  const lam=(e)=>new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true,emissive:e||0});
  const gOct=new THREE.OctahedronGeometry(1,0),gTet=new THREE.TetrahedronGeometry(1,0),gDod=new THREE.DodecahedronGeometry(1,0),gCyl=new THREE.CylinderGeometry(0.55,1,1,7),gTrunk=new THREE.CylinderGeometry(0.16,0.26,1,6),gDisc=new THREE.CylinderGeometry(1,1,0.12,10);
  const pick=a=>a[Math.floor(R()*a.length)];
  // Shimmerfield: glass crystals
  emit('crystal',gOct,lam(0x103840),spots(1,280,0.7).map(([x,z])=>{const h=rr(2,7.5),w=rr(0.5,1.5);return {x,y:heightAt(x,z)+h*0.45,z,sx:w,sy:h,sz:w,ry:rr(0,6),rx:rr(-0.2,0.2),c:pick([0x7ff6ff,0x9fd8ff,0xc8a8ff,0xe8ffff]),cr:h>4.5?w*0.8:0};}));
  emit('shard',gTet,lam(0x0a2a30),spots(1,220,0.6).map(([x,z])=>{const s=rr(0.4,1.2);return {x,y:heightAt(x,z)+s*0.3,z,sx:s,sy:s*1.6,sz:s,rx:rr(0,3),ry:rr(0,6),c:pick([0x9ff0ff,0xd0f8ff,0xb8a0ff])};}));
  // Cinderveil: ash rocks, lava vents, dead trees
  emit('ashrock',gDod,lam(),spots(2,230,0.7).map(([x,z])=>{const s=rr(0.8,4);return {x,y:heightAt(x,z)+s*0.2,z,sx:s*rr(0.8,1.4),sy:s*rr(0.5,1),sz:s*rr(0.8,1.4),rx:rr(0,3),ry:rr(0,3),c:pick([0x2a2220,0x3a2c28,0x241c1a]),cr:s>1.8?s*0.9:0};}));
  emit('vent',gDisc,new THREE.MeshBasicMaterial({color:0xffffff}),spots(2,70,0.75).map(([x,z])=>{const s=rr(1.2,3.2);return {x,y:heightAt(x,z)+0.05,z,sx:s,sy:1,sz:s*rr(0.6,1),ry:rr(0,6),c:pick([0xff5a1a,0xff7a2a,0xe8401a])};}));
  emit('deadtree',geoCone,lam(),spots(2,120,0.6).map(([x,z])=>{const h=rr(2.5,6);return {x,y:heightAt(x,z)+h/2,z,sx:0.22,sy:h,sz:0.22,rx:rr(-0.25,0.25),rz:rr(-0.25,0.25),c:0x1a1412};}));
  // Rustmaw: ruined towers (solid), rubble, rusted pylons
  const ruins=spots(3,70,0.75).map(([x,z])=>{const w=rr(4,10),d=rr(4,10),h=rr(4,16),y=heightAt(x,z);boxes.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0:y-2,y1:y+h});return {x,y:y+h/2-1,z,sx:w,sy:h,sz:d,c:pick([0x5a5450,0x6a5e54,0x4a4440,0x7a5a44])};});
  emit('ruin',geoBox,lam(),ruins);
  emit('rubble',gDod,lam(),spots(3,220,0.6).map(([x,z])=>{const s=rr(0.6,2.4);return {x,y:heightAt(x,z)+s*0.15,z,sx:s*1.3,sy:s*0.6,sz:s,rx:rr(0,3),ry:rr(0,3),c:pick([0x8a4a2a,0x6a5a4a,0x9a6a3a,0x4f4a46])};}));
  emit('pylon',gCyl,lam(),spots(3,50,0.7).map(([x,z])=>{const h=rr(6,12);return {x,y:heightAt(x,z)+h/2,z,sx:0.35,sy:h,sz:0.35,rz:rr(-0.3,0.3),c:0x6a3a22,cr:0.6};}));
  // Mirewell: palms near water, bushes
  const wet=(x,z)=>{for(let k=0;k<6;k++){const a=k*1.047;if(heightAt(x+Math.cos(a)*9,z+Math.sin(a)*9)<WATER_Y)return true;}return R()<0.25;};
  const palms=spots(4,150,0.7,(x,z)=>heightAt(x,z)>WATER_Y+0.3&&wet(x,z)).map(([x,z])=>({x,z,h:rr(4,7.5),y:heightAt(x,z),l:rr(-0.2,0.2),ry:rr(0,6)}));
  emit('trunk',gTrunk,lam(),palms.map(p=>({x:p.x,y:p.y+p.h/2,z:p.z,sx:1,sy:p.h,sz:1,rz:p.l,c:0x7a5a3a,cr:0.45})));
  emit('frond',geoCone,lam(),palms.map(p=>({x:p.x-Math.sin(p.l)*p.h*0.5,y:p.y+p.h,z:p.z,sx:2.6,sy:0.9,sz:2.6,ry:p.ry,rx:Math.PI,c:pick([0x3f8a3a,0x4f9a40,0x5aa848])})));
  emit('bush',geoIco,lam(),spots(4,260,0.6,(x,z)=>heightAt(x,z)>WATER_Y+0.2).map(([x,z])=>{const s=rr(0.6,1.6);return {x,y:heightAt(x,z)+s*0.3,z,sx:s*1.3,sy:s*0.8,sz:s*1.3,ry:rr(0,6),c:pick([0x5a8a3a,0x6a9a44,0x7aa04a,0x4a7a34])};}));
  // Redspire: hoodoo spires (solid), red boulders
  emit('spire',gCyl,lam(),spots(5,130,0.7).map(([x,z])=>{const h=rr(5,15),w=rr(1,2.6);return {x,y:heightAt(x,z)+h/2-0.5,z,sx:w,sy:h,sz:w,ry:rr(0,6),c:pick([0xb0502e,0xc0603a,0x9a4428,0xd07040]),cr:w*0.95};}));
  emit('boulder',gDod,lam(),spots(5,200,0.6).map(([x,z])=>{const s=rr(0.8,3.5);return {x,y:heightAt(x,z)+s*0.25,z,sx:s*rr(0.9,1.4),sy:s*rr(0.6,1),sz:s*rr(0.9,1.4),rx:rr(0,3),ry:rr(0,3),c:pick([0xa04a2c,0xb85a36,0x8a3a22]),cr:s>2?s*0.9:0};}));
  // Whitepan: salt pillars and salt crust clusters
  emit('saltpillar',geoBox,lam(),spots(6,90,0.7).map(([x,z])=>{const h=rr(1,3.5),w=rr(0.6,1.6);return {x,y:heightAt(x,z)+h/2,z,sx:w,sy:h,sz:w,ry:rr(0,6),c:pick([0xffffff,0xf0ece2,0xe4ddd0]),cr:h>2.5?w*0.7:0};}));
  // Duskcrown: tall Vyre monoliths (solid), glowing vein shards, glasswood trees, violet boulders
  const dS=(n,w,pred)=>spots(GB,n,w,pred);
  emit('monolith',gCyl,lam(0x140c28),dS(110,0.75).map(([x,z])=>{const h=rr(6,16),w=rr(0.8,1.8);return {x,y:heightAt(x,z)+h/2-0.6,z,sx:w,sy:h,sz:w*rr(0.7,1),ry:rr(0,6),rz:rr(-0.12,0.12),c:pick([0x5a4e78,0x4a4068,0x6a5e88]),cr:w*0.9};}));
  emit('veinshard',gOct,lam(0x1a3a48),dS(260,0.6).map(([x,z])=>{const h=rr(1,4.2),w=rr(0.3,0.8);return {x,y:heightAt(x,z)+h*0.4,z,sx:w,sy:h,sz:w,ry:rr(0,6),rx:rr(-0.3,0.3),c:pick([0x7ff6ff,0xb48cff,0x9fe0ff,0xd8c0ff])};}));
  const gw=dS(150,0.65).map(([x,z])=>({x,z,h:rr(3.5,7),y:heightAt(x,z),ry:rr(0,6)}));
  emit('glasswood',gTrunk,lam(),gw.map(p=>({x:p.x,y:p.y+p.h/2,z:p.z,sx:0.8,sy:p.h,sz:0.8,ry:p.ry,c:0x3a3048,cr:0.35})));
  emit('glasscrown',gOct,lam(0x2a1048),gw.map(p=>({x:p.x,y:p.y+p.h+0.6,z:p.z,sx:rr(1.4,2.2),sy:rr(1.2,1.8),sz:rr(1.4,2.2),ry:p.ry,c:pick([0xb48cff,0x9a7aff,0x7fd8ff])})));
  emit('duskrock',gDod,lam(),dS(220,0.6).map(([x,z])=>{const s=rr(0.8,3.4);return {x,y:heightAt(x,z)+s*0.25,z,sx:s*rr(0.9,1.4),sy:s*rr(0.5,1),sz:s*rr(0.9,1.4),rx:rr(0,3),ry:rr(0,3),c:pick([0x4a4060,0x3e3652,0x5a5070]),cr:s>2?s*0.9:0};}));
  // Rimefall: ice spires, frost pines, wind-carved snow drifts, blue ice boulders, frozen Combine wrecks
  const rS=(n,w,pred)=>spots(RB,n,w,pred);
  emit('icespire',gCyl,lam(0x0e2a3c),rS(240,0.75).map(([x,z])=>{const h=rr(4,14),w=rr(0.6,1.6);return {x,y:heightAt(x,z)+h/2-0.5,z,sx:w,sy:h,sz:w*rr(0.7,1),ry:rr(0,6),rx:rr(-0.15,0.15),rz:rr(-0.15,0.15),c:pick([0xbfe6ff,0x9fd0f0,0xd8f2ff,0x8fc0e8]),cr:w*0.8};}));
  const fp=rS(300,0.7).map(([x,z])=>({x,z,h:rr(3,6.5),y:heightAt(x,z),ry:rr(0,6)}));
  emit('frosttrunk',gTrunk,lam(),fp.map(p=>({x:p.x,y:p.y+p.h*0.3,z:p.z,sx:0.55,sy:p.h*0.6,sz:0.55,ry:p.ry,c:0x3a3430,cr:0.3})));
  emit('frostpine',geoCone,lam(),fp.map(p=>({x:p.x,y:p.y+p.h*0.75,z:p.z,sx:rr(1.3,1.9),sy:p.h*0.85,sz:rr(1.3,1.9),ry:p.ry,c:pick([0xe8f2f8,0xcfe2ea,0x9fbcc4])})));
  emit('snowdrift',gDod,lam(),rS(320,0.6).map(([x,z])=>{const s=rr(1.2,3.6);return {x,y:heightAt(x,z)-s*0.08,z,sx:s*2,sy:s*0.35,sz:s*rr(0.8,1.3),ry:rr(0,6),c:pick([0xf4f8fc,0xe6eef6])};}));
  emit('icerock',gDod,lam(0x061420),rS(240,0.6).map(([x,z])=>{const s=rr(0.8,3.2);return {x,y:heightAt(x,z)+s*0.25,z,sx:s*rr(0.9,1.4),sy:s*rr(0.5,1),sz:s*rr(0.9,1.4),rx:rr(0,3),ry:rr(0,3),c:pick([0x7fa6c8,0x5f86a8,0x9fc4dc]),cr:s>2?s*0.9:0};}));
  emit('wreck',geoBox,lam(),rS(36,0.8).map(([x,z])=>{const w=rr(3,7);return {x,y:heightAt(x,z)+0.6,z,sx:w,sy:rr(1.2,2.4),sz:w*rr(0.3,0.5),ry:rr(0,6),rz:rr(-0.4,0.4),c:pick([0x5a6470,0x4a525c]),cr:w*0.45};}));
  emit('saltcrust',gDod,lam(),spots(6,180,0.6).map(([x,z])=>{const s=rr(0.4,1.4);return {x,y:heightAt(x,z),z,sx:s*1.6,sy:s*0.35,sz:s*1.6,ry:rr(0,6),c:pick([0xfaf8f2,0xece6da])};}));
})();
// ---- oasis water: one merged mesh over cells below the water line ----
const WATERM=(function(){const pos=[];const W7=new Float32Array(NB);for(let iy=0;iy<SEG;iy++)for(let ix=0;ix<SEG;ix++){const x=ix*CELL-HALF,z=iy*CELL-HALF;
    const lo=Math.min(HG[iy*N1+ix],HG[iy*N1+ix+1],HG[(iy+1)*N1+ix],HG[(iy+1)*N1+ix+1]);if(lo>=WATER_Y)continue;biomeW(x+2,z+2,W7);if(W7[4]<0.35)continue;
    const x1=x+CELL,z1=z+CELL,y=WATER_Y;pos.push(x,y,z,x,y,z1,x1,y,z,x1,y,z,x,y,z1,x1,y,z1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x3aa0b8,transparent:true,opacity:0.72,depthWrite:false}));m.renderOrder=1;scene.add(m);g.computeBoundingBox();m.userData.bb=g.boundingBox;return m;})();
// ---- culling: hide terrain chunks and prop buckets far from the camera ----
let cullAcc=1;
function updCull(dt){if(DUN)return;cullAcc+=dt;if(cullAcc<0.25)return;cullAcc=0;const cx=camera.position.x,cz=camera.position.z;
  for(const m of TCH){m.visible=Math.hypot(m.userData.cx-cx,m.userData.cz-cz)<GFXC.tr;}
  for(const m of PROPB){const u=m.userData;const dx=Math.max(u.x0-cx,0,cx-(u.x0+PB_S)),dz=Math.max(u.z0-cz,0,cz-(u.z0+PB_S));m.visible=Math.hypot(dx,dz)<GFXC.pr;}
  const bb=WATERM.userData.bb;if(bb&&isFinite(bb.min.x)){const dx=Math.max(bb.min.x-cx,0,cx-bb.max.x),dz=Math.max(bb.min.z-cz,0,cz-bb.max.z);WATERM.visible=Math.hypot(dx,dz)<260;}}
// ---- regions: banner on entry, HUD label, sky tint ----
var BSKY=null;
const RG={cur:null,cand:null,acc:0};
function regionAt(x,z){if(Math.abs(x)<TOWN+0.5&&Math.abs(z)<TOWN+0.5)return {id:'town',name:"Halden's Rest"};for(const o of OUTPOSTS)if(Math.hypot(x-o.x,z-o.z)<o.r+3)return {id:o.id,name:o.name};{const fz=fzAt(x,z);if(fz)return {id:fz.id,name:FACTIONS[fz.side].icon+' '+fz.name,fz};}const b=BIOMES[biomeIdx(x,z)];return {id:b.id,name:b.name,b};}
function regionGateTxt(b){if(!b||!b.gate||gateOpen(b.gate))return '';const s=STEP[GATES[b.gate].step];return ' · 🔒 its wild packs wake after story step '+(s.i+1);}
function updRegions(dt){if(DUN&&state==='play'){const el=$('#region'),n=DUN.apt?'Your Apartment':DUN.D.name;if(el&&el._t!==n){el._t=n;el.textContent=(DUN.D&&DUN.D.raid?'⚔ ':'🚪 ')+n;}RG.cur=null;RG.cand=null;return;}if(DUN||state!=='play')return;RG.acc+=dt;if(RG.acc<0.4)return;RG.acc=0;
  const r=regionAt(P.pos.x,P.pos.z);const bi=biomeIdx(P.pos.x,P.pos.z);if(!BSKY)BSKY={fog:new THREE.Color(BIOMES[0].fog),hemi:new THREE.Color(BIOMES[0].hemi),w:new Float32Array(NB)};
  const w=biomeW(P.pos.x,P.pos.z,BSKY.w);const tf=new THREE.Color(0,0,0),th=new THREE.Color(0,0,0);for(let i=0;i<NB;i++){if(w[i]<0.001)continue;tf.r+=((BIOMES[i].fog>>16)&255)/255*w[i];tf.g+=((BIOMES[i].fog>>8)&255)/255*w[i];tf.b+=(BIOMES[i].fog&255)/255*w[i];th.r+=((BIOMES[i].hemi>>16)&255)/255*w[i];th.g+=((BIOMES[i].hemi>>8)&255)/255*w[i];th.b+=(BIOMES[i].hemi&255)/255*w[i];}
  BSKY.fog.lerp(tf,0.35);BSKY.hemi.lerp(th,0.35);
  const el=$('#region');if(el&&el._t!==r.name){el._t=r.name;el.textContent='📍 '+r.name;}
  const key=BIOMES[bi].id;if(RG.cur===null){RG.cur=key;return;}
  if(key!==RG.cur){if(RG.cand===key){RG.cur=key;RG.cand=null;const b=BIOMES[bi];banner(b.name.toUpperCase(),b.sub+' · Lv '+(b.outer?b.lvAt(P.pos.x,P.pos.z)+' here ('+b.lv[0]+'–'+b.lv[1]+')':b.lv[0]+'–'+b.lv[1])+regionGateTxt(b)+(b.outer&&P.level<b.minLv?' · ⚠ dangerous below Lv '+b.minLv:''));SFX.quest();exploreMark(true);}else RG.cand=key;}else RG.cand=null;}
function biomeSky(I){if(!BSKY||DUN)return;const k=0.42;const t=BSKY.fog.clone().multiplyScalar(0.18+0.82*I.day);colFog.lerp(t,k*(1-WX.storm*0.6));hemi.color.lerp(BSKY.hemi.clone().multiplyScalar(0.5+0.5*I.day),0.35);}
// ---- exploration (fog of war for the new regions; the old desert core is already charted) ----
const EX_C=20,EX_N=WORLD/EX_C;let EXP=new Uint8Array(EX_N*EX_N),exAcc=0;
function exIdx(x,z){const i=Math.floor((x+HALF)/EX_C),j=Math.floor((z+HALF)/EX_C);return (i<0||j<0||i>=EX_N||j>=EX_N)?-1:j*EX_N+i;}
function exploreLoad(){EXP=new Uint8Array(EX_N*EX_N);const s=P.explored||'';
  // old saves were charted on a smaller square grid (880 m world = 44x44, 1280 m = 64x64 cells): place it centred in the bigger one
  const oN=Math.round(Math.sqrt(s.length*4));if(s.length&&oN<EX_N&&oN*oN===s.length*4){const off=(EX_N-oN)>>1;for(let j=0;j<oN;j++)for(let i=0;i<oN;i++){const k=j*oN+i;const h=parseInt(s[k>>2]||'0',16);EXP[(j+off)*EX_N+i+off]=(h>>(k&3))&1;}}
  else for(let i=0;i<EXP.length;i++){const h=parseInt(s[i>>2]||'0',16);EXP[i]=(h>>(i&3))&1;}
  for(let j=0;j<EX_N;j++)for(let i=0;i<EX_N;i++){const x=(i+0.5)*EX_C-HALF,z=(j+0.5)*EX_C-HALF;if(Math.hypot(x,z)<240)EXP[j*EX_N+i]=1;}exploreSave();}
function exploreSave(){let s='';for(let i=0;i<EXP.length;i+=4)s+=((EXP[i]|EXP[i+1]<<1|EXP[i+2]<<2|EXP[i+3]<<3)).toString(16);P.explored=s;}
function exploreMark(force){if(DUN)return false;let ch=false;const R=70;for(let dz=-R;dz<=R;dz+=EX_C)for(let dx=-R;dx<=R;dx+=EX_C){if(dx*dx+dz*dz>R*R)continue;const k=exIdx(P.pos.x+dx,P.pos.z+dz);if(k>=0&&!EXP[k]){EXP[k]=1;ch=true;}}if(ch){exploreSave();MAP.fogDirty=true;}return ch;}
function updExplore(dt){if(state!=='play')return;exAcc+=dt;if(exAcc<0.5)return;exAcc=0;exploreMark();}
function exploredPct(){let n=0;for(const v of EXP)n+=v;return Math.round(n/EXP.length*100);}
// ---- custom waypoint (saved per character) ----
function normWp(w){if(!w||typeof w!=='object')return null;const x=+w.x,z=+w.z;if(!isFinite(x)||!isFinite(z))return null;return {x:clamp(x,-HALF+20,HALF-20),z:clamp(z,-HALF+20,HALF-20)};}
const uwpBeam=makeBeam(0x59c8ff,90,1.1,0.32);uwpBeam.visible=false;
const uwpRing=(()=>{const m=new THREE.Mesh(new THREE.TorusGeometry(2.4,0.18,6,32),MB(0x9fe8ff));m.rotation.x=Math.PI/2;m.visible=false;scene.add(m);return m;})();
const uwpGem=(()=>{const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.9,0),MB(0x59c8ff));m.visible=false;scene.add(m);return m;})();
function setUwp(x,z){P.uwp=normWp({x,z});MAP.dirty=true;save();if(P.uwp)toast('📍 Waypoint set · '+Math.round(dist2D(P.uwp,P.pos))+' m');}
function clearUwp(silent){if(!P.uwp)return;P.uwp=null;MAP.dirty=true;save();if(!silent)toast('📍 Waypoint cleared');}
const uwpEl=(()=>{const d=document.createElement('div');d.id='uwp';d.className='hidden';d.innerHTML='<div class="arr">▼</div><span></span>';$('#wp').parentNode.appendChild(d);return d;})();
function updUwp(){const w=P.uwp;if(!w||DUN||P.dead||state!=='play'){uwpBeam.visible=uwpRing.visible=uwpGem.visible=false;uwpEl.classList.add('hidden');return;}
  const d=dist2D(w,P.pos);if(d<5){clearUwp(true);toast('📍 Waypoint reached');SFX.quest();return;}
  const y=heightAt(w.x,w.z);uwpBeam.visible=uwpRing.visible=uwpGem.visible=true;uwpBeam.position.set(w.x,y,w.z);uwpRing.position.set(w.x,y+0.3,w.z);uwpGem.position.set(w.x,y+4+Math.sin(T*2)*0.4,w.z);uwpGem.rotation.y=T*1.5;
  projV.set(w.x,y+4,w.z).project(camera);const W=innerWidth,Hh=innerHeight;let x=(projV.x*0.5+0.5)*W,yy=(-projV.y*0.5+0.5)*Hh;const behind=projV.z>1;
  if(behind){x=W-x;yy=Hh-60;}const m=50;const off=behind||x<m||x>W-m||yy<m+60||yy>Hh-m;x=clamp(x,m,W-m);yy=clamp(yy,m+60,Hh-m);
  uwpEl.classList.remove('hidden');uwpEl.style.transform=`translate(${x|0}px,${yy|0}px)`;uwpEl.firstChild.textContent=off?(behind?'▼':x<=m?'◀':x>=W-m?'▶':yy<=m+60?'▲':'▼'):'📍';
  const brg=Math.atan2(w.x-P.pos.x,-(w.z-P.pos.z));const dirs=['N','NE','E','SE','S','SW','W','NW'];uwpEl.lastChild.textContent=Math.round(d)+'m '+dirs[((Math.round(brg/(Math.PI/4))%8)+8)%8];}
function uwpMini(c,tf,R){const w=P.uwp;if(!w||DUN)return;let q=tf(w.x,w.z);const dx=q[0]-R,dy=q[1]-R,d=Math.hypot(dx,dy);if(d>R-12)q=[R+dx/d*(R-12),R+dy/d*(R-12)];
  c.fillStyle='#59c8ff';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.arc(q[0],q[1]-6,7,Math.PI*0.85,Math.PI*2.15);c.lineTo(q[0],q[1]+6);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(q[0],q[1]-6,2.6,0,7);c.fill();}
// ---- full-screen world map ----
const MAP={open:false,cx:0,cz:0,ppm:1,dirty:true,fogDirty:true,base:null,fog:null,ptr:new Map(),acc:0};
const mapUI=(()=>{const d=document.createElement('div');d.id='mapUI';d.className='hidden';
  d.innerHTML=`<canvas id="mapC"></canvas><div class="mapbar"><button class="sbtn" id="mapClose">✕ Close</button><button class="sbtn alt" id="mapClear">📍 Clear waypoint</button><button class="sbtn alt" id="mapMe">◎ Me</button><button class="sbtn alt mz" id="mapOut">−</button><button class="sbtn alt mz" id="mapIn">+</button><span id="mapInfo"></span></div><div class="maphint">Tap the map to set a waypoint · tap it again to remove · drag to pan · pinch to zoom</div>`;
  document.body.appendChild(d);return d;})();
const mapC=$('#mapC'),mctx2=mapC.getContext('2d');
function mapBase(){if(MAP.base)return MAP.base;const c=document.createElement('canvas');c.width=c.height=N1;const x=c.getContext('2d');const im=x.createImageData(N1,N1);const W7=new Float32Array(NB);
  for(let j=0;j<N1;j++)for(let i=0;i<N1;i++){const k=j*N1+i;const h=HG[k],hl=HG[j*N1+Math.max(0,i-1)],hu=HG[Math.max(0,j-1)*N1+i];let s=clamp(1+(hl-h)*0.035+(hu-h)*0.035,0.65,1.3);
    let r=TCOL[k*3],g=TCOL[k*3+1],b=TCOL[k*3+2];if(h<WATER_Y){biomeW(i*CELL-HALF,j*CELL-HALF,W7);if(W7[4]>0.35){r=0.23;g=0.6;b=0.72;s=1;}}
    im.data[k*4]=clamp(r*s*255,0,255);im.data[k*4+1]=clamp(g*s*255,0,255);im.data[k*4+2]=clamp(b*s*255,0,255);im.data[k*4+3]=255;}
  x.putImageData(im,0,0);MAP.base=c;return c;}
function mapFog(){if(MAP.fog&&!MAP.fogDirty)return MAP.fog;const c=MAP.fog||document.createElement('canvas');c.width=c.height=EX_N;const x=c.getContext('2d');const im=x.createImageData(EX_N,EX_N);
  for(let i=0;i<EXP.length;i++){im.data[i*4]=18;im.data[i*4+1]=14;im.data[i*4+2]=12;im.data[i*4+3]=EXP[i]?0:235;}x.putImageData(im,0,0);MAP.fog=c;MAP.fogDirty=false;return c;}
function mapSize(){const dpr=Math.min(2,window.devicePixelRatio||1);const W=innerWidth,H=innerHeight;if(mapC.width!==Math.round(W*dpr)||mapC.height!==Math.round(H*dpr)){mapC.width=Math.round(W*dpr);mapC.height=Math.round(H*dpr);}return {W,H,dpr};}
const mapMinPpm=()=>Math.min(innerWidth,innerHeight)/WORLD*0.92,mapMaxPpm=()=>6;
function mapW2S(x,z){return [(x-MAP.cx)*MAP.ppm+innerWidth/2,(z-MAP.cz)*MAP.ppm+innerHeight/2];}
function mapS2W(sx,sy){return {x:MAP.cx+(sx-innerWidth/2)/MAP.ppm,z:MAP.cz+(sy-innerHeight/2)/MAP.ppm};}
function mapClampView(){MAP.ppm=clamp(MAP.ppm,mapMinPpm(),mapMaxPpm());const hw=innerWidth/2/MAP.ppm,hh=innerHeight/2/MAP.ppm;MAP.cx=clamp(MAP.cx,-HALF+Math.min(hw,HALF),HALF-Math.min(hw,HALF));MAP.cz=clamp(MAP.cz,-HALF+Math.min(hh,HALF),HALF-Math.min(hh,HALF));}
function drawMap(){const {W,H,dpr}=mapSize();const c=mctx2;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#120e0b';c.fillRect(0,0,W,H);
  const [x0,y0]=mapW2S(-HALF,-HALF),S=WORLD*MAP.ppm;c.imageSmoothingEnabled=true;c.drawImage(mapBase(),x0,y0,S,S);c.drawImage(mapFog(),x0,y0,S,S);
  const vis=(x,z)=>{const k=exIdx(x,z);return k>=0&&EXP[k];};
  c.textAlign='center';c.textBaseline='middle';
  // region names
  c.font='bold '+Math.round(clamp(MAP.ppm*14,12,22))+'px sans-serif';
  BIOMES.forEach((b,i)=>{let x,z;if(i===0){x=-120;z=150;}else if(b.mapAt){[x,z]=b.mapAt;}else{const a=b.a*Math.PI/3;x=Math.cos(a)*335;z=Math.sin(a)*335;}const q=mapW2S(x,z);const known=vis(x,z);c.lineWidth=4;c.strokeStyle='rgba(0,0,0,.75)';c.fillStyle=known?'#fff2dc':'rgba(255,255,255,.45)';const t=known?b.name:'??? · '+b.name.split(' ').pop();c.strokeText(t,q[0],q[1]);c.fillText(t,q[0],q[1]);
    if(known){c.font='600 '+Math.round(clamp(MAP.ppm*10,10,14))+'px sans-serif';const l='Lv '+b.lv[0]+'–'+b.lv[1]+(b.gate&&!gateOpen(b.gate)?' · 🔒':'');c.strokeText(l,q[0],q[1]+16);c.fillText(l,q[0],q[1]+16);c.font='bold '+Math.round(clamp(MAP.ppm*14,12,22))+'px sans-serif';}});
  const lab=(x,z,t,col)=>{const q=mapW2S(x,z);c.font='bold 12px sans-serif';c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.8)';c.fillStyle=col||'#fff';c.strokeText(t,q[0],q[1]-14);c.fillText(t,q[0],q[1]-14);};
  // town + outposts
  {const a=mapW2S(-TOWN,-TOWN);c.strokeStyle='#f0e0c0';c.lineWidth=2;c.strokeRect(a[0],a[1],TOWN*2*MAP.ppm,TOWN*2*MAP.ppm);lab(0,-TOWN,"Halden's Rest",'#ffe8b0');}
  fzMap(c,mapW2S,lab,vis);for(const o of OUTPOSTS){const q=mapW2S(o.x,o.z);const open=!GATES[o.id]||gateOpen(o.id);c.fillStyle=o.fz?FACTIONS[fzById(o.fz).side].col:open?'#5ff2ff':'#777';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.arc(q[0],q[1],7,0,7);c.fill();c.stroke();lab(o.x,o.z,(open?'':'🔒 ')+o.name);}
  for(const k in DUNGEONS){const d=DUNGEONS[k];const q=mapW2S(d.door.x,d.door.z);c.fillStyle='#ff9a2a';c.strokeStyle='#000';c.lineWidth=2;c.fillRect(q[0]-6,q[1]-6,12,12);c.strokeRect(q[0]-6,q[1]-6,12,12);lab(d.door.x,d.door.z,d.name,'#ffc890');}
  for(const k in RAIDS){const d=RAIDS[k];if(!d.door||!vis(d.door.x,d.door.z))continue;const q=mapW2S(d.door.x,d.door.z);c.fillStyle='#ff6a2a';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(q[0],q[1]-9);c.lineTo(q[0]+9,q[1]);c.lineTo(q[0],q[1]+9);c.lineTo(q[0]-9,q[1]);c.closePath();c.fill();c.stroke();lab(d.door.x,d.door.z,'⚔ '+d.name+' (raid)','#ffb080');}
  for(const s of TSITES){const q=mapW2S(s.x,s.z);const o=TW[s.id]&&TW[s.id].owner;c.fillStyle=o?FACTIONS[o].col:'#9a9a9a';c.strokeStyle='#000';c.beginPath();c.moveTo(q[0],q[1]-8);c.lineTo(q[0]+7,q[1]);c.lineTo(q[0],q[1]+8);c.lineTo(q[0]-7,q[1]);c.closePath();c.fill();c.stroke();}
  for(const k of BANKS){if(!bankOpenAt(k))continue;const q=mapW2S(k.x,k.z);c.fillStyle='#ffd34a';c.strokeStyle='#000';c.lineWidth=2;c.fillRect(q[0]-6,q[1]-6,12,12);c.strokeRect(q[0]-6,q[1]-6,12,12);c.fillStyle='#2a1a00';c.font='bold 10px sans-serif';c.fillText('B',q[0],q[1]+0.5);}
  for(const cp of CAMPS){if(!campOpen(cp)||!vis(cp.x,cp.z))continue;const q=mapW2S(cp.x,cp.z);const ready=cp.left>0||cp.awake&&campLive(cp).length>0;c.fillStyle=ready?'#ff7a2a':'#a0a0a0';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(q[0],q[1]-8);c.lineTo(q[0]+8,q[1]+6);c.lineTo(q[0]-8,q[1]+6);c.closePath();c.fill();c.stroke();if(MAP.ppm>1.2)lab(cp.x,cp.z,cp.name+' · Lv '+cp.lv[0]+'–'+cp.lv[1],'#ffd0a0');}
  questMap(c,mapW2S,lab,vis);dynaMap(c,mapW2S,lab,vis);
  // waypoint
  if(P.uwp){const q=mapW2S(P.uwp.x,P.uwp.z);c.fillStyle='#59c8ff';c.strokeStyle='#000';c.lineWidth=2.5;c.beginPath();c.arc(q[0],q[1]-14,10,Math.PI*0.8,Math.PI*2.2);c.lineTo(q[0],q[1]);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(q[0],q[1]-14,4,0,7);c.fill();}
  // player arrow (map north is up)
  {const q=mapW2S(P.pos.x,P.pos.z);c.save();c.translate(q[0],q[1]);c.rotate(Math.atan2(Math.sin(P.rotY),Math.cos(P.rotY))*-1+Math.PI);c.fillStyle='#5ff2ff';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(0,-13);c.lineTo(9,10);c.lineTo(0,5);c.lineTo(-9,10);c.closePath();c.fill();c.stroke();c.restore();}
  // compass + scale
  c.font='bold 20px sans-serif';c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=3;c.strokeText('N ▲',W-40,H-60);c.fillText('N ▲',W-40,H-60);
  const sm=MAP.ppm>2?50:MAP.ppm>0.8?100:200;c.fillStyle='#fff';c.fillRect(20,H-34,sm*MAP.ppm,4);c.font='bold 12px sans-serif';c.textAlign='left';c.strokeText(sm+' m',20,H-46);c.fillText(sm+' m',20,H-46);
  const r=regionAt(P.pos.x,P.pos.z);$('#mapInfo').textContent=r.name+' · explored '+exploredPct()+'%'+(P.uwp?' · waypoint '+Math.round(dist2D(P.uwp,P.pos))+' m':'');
  $('#mapClear').classList.toggle('locked',!P.uwp);MAP.dirty=false;}
function openMap(){if(state==='play'&&DUN&&DUN.areas){if(panelOpen==='dmap'){closePanel();return;}openDunMap();return;}if(state!=='play'||DUN){if(DUN)warn('No map signal inside');return;}if(panelOpen)closePanel();resetInput();panelOpen='map';MAP.open=true;mapUI.classList.remove('hidden');
  MAP.cx=P.pos.x;MAP.cz=P.pos.z;MAP.ppm=clamp(innerHeight/520,mapMinPpm(),mapMaxPpm());mapClampView();drawMap();}
function mapHide(){MAP.open=false;mapUI.classList.add('hidden');MAP.ptr.clear();}
function closeMap(){if(panelOpen==='map')closePanel();else mapHide();}
function toggleMap(){if(MAP.open)closeMap();else openMap();}
function mapZoom(f,sx,sy){const w=mapS2W(sx,sy);MAP.ppm=clamp(MAP.ppm*f,mapMinPpm(),mapMaxPpm());MAP.cx=w.x-(sx-innerWidth/2)/MAP.ppm;MAP.cz=w.z-(sy-innerHeight/2)/MAP.ppm;mapClampView();drawMap();}
function mapTap(sx,sy){const w=mapS2W(sx,sy);if(P.uwp){const q=mapW2S(P.uwp.x,P.uwp.z);if(Math.hypot(q[0]-sx,q[1]-sy+8)<26){clearUwp();drawMap();return;}}
  if(Math.abs(w.x)>HALF-20||Math.abs(w.z)>HALF-20){warn('That is beyond the mountains');return;}setUwp(w.x,w.z);SFX.ui();drawMap();}
mapC.addEventListener('pointerdown',e=>{e.preventDefault();try{mapC.setPointerCapture(e.pointerId);}catch(_){}MAP.ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),mv:0});
  if(MAP.ptr.size===2){const [a,b]=[...MAP.ptr.values()];MAP.pinch={d:Math.hypot(a.x-b.x,a.y-b.y),ppm:MAP.ppm};MAP.multi=true;}});
mapC.addEventListener('pointermove',e=>{const p=MAP.ptr.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;p.mv+=Math.abs(dx)+Math.abs(dy);
  if(MAP.ptr.size>=2&&MAP.pinch){const [a,b]=[...MAP.ptr.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;mapZoom((MAP.pinch.ppm*d/MAP.pinch.d)/MAP.ppm,mx,my);}
  else if(MAP.ptr.size===1){MAP.cx-=dx/MAP.ppm;MAP.cz-=dy/MAP.ppm;mapClampView();drawMap();}});
function mapUp(e){const p=MAP.ptr.get(e.pointerId);if(!p)return;MAP.ptr.delete(e.pointerId);if(MAP.ptr.size<2)MAP.pinch=null;
  if(e.type==='pointerup'&&!MAP.multi&&p.mv<10&&performance.now()-p.t<600)mapTap(e.clientX,e.clientY);if(MAP.ptr.size===0)MAP.multi=false;}
mapC.addEventListener('pointerup',mapUp);mapC.addEventListener('pointercancel',mapUp);
mapC.addEventListener('wheel',e=>{e.preventDefault();mapZoom(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY);},{passive:false});
for(const [id,fn] of [['#mapClose',closeMap],['#mapClear',()=>{clearUwp();drawMap();}],['#mapMe',()=>{MAP.cx=P.pos.x;MAP.cz=P.pos.z;mapClampView();drawMap();}],['#mapIn',()=>mapZoom(1.4,innerWidth/2,innerHeight/2)],['#mapOut',()=>mapZoom(1/1.4,innerWidth/2,innerHeight/2)]])
  $(id).addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();audioInit();SFX.ui();fn();});
addEventListener('resize',()=>{if(MAP.open){mapClampView();drawMap();}});
function updMap(dt){if(!MAP.open)return;MAP.acc+=dt;if(MAP.acc>0.25||MAP.dirty){MAP.acc=0;drawMap();}}
function updWorld2(dt){updCull(dt);updRegions(dt);updExplore(dt);updUwp();updMap(dt);}
function worldExports(){return {WORLD,HALF,CORE_HALF,BIOMES,biomeW,biomeIdx,regionAt,get RG(){return RG;},TCH,PROPB,WATERM,EXP:()=>EXP,EX_N,exploredPct,exploreMark,openMap,closeMap,toggleMap,get MAP(){return MAP;},mapS2W,mapW2S,mapTap,setUwp,clearUwp,uwpBeam,uwpEl,normWp,CAMPS,updCull,heightAt,drawMap};}
