/* ================= BUILD D: DUNGEON OVERHAUL (bigger, themed, multi-level, interactive) =================
   Every dungeon + the Cinderdeep raid is generated from DLAY[id] (a spine of areas + connectors + optional wings) and dressed by DTHEME[id].
   - Areas: hall · cavern · arena (boss) · garden · chasm (bridge over a pit, may collapse) · shaft (central pit + upper ledge) · flooded ·
            nave · machine · forge (lava river) · archive (ice stacks) · frozen · outdoor (open to the sky, vista)
   - Connectors: corr · gate (timed) · lasers (pulsed hazard) · vents (telegraphed traps) · plates (pressure traps) · flood · bridge (open-sided over a pit)
     Rooms can sit at different heights (ramps); balconies/ledges add a second level. heightAt() asks DUN.hAt while FLAT.
   - Wings: loot (lever-gated cache) · elite (champion + guaranteed drop) · secret (cracked wall, hidden on the map until found)
   - Shortcut: a lever in a mid-dungeon boss room opens a side passage back to the entrance (both ends gated until then).
   - Look: per-theme procedural textures (triplanar, glowing cracks/veins), brighter hemisphere + coloured light pool (nearest N sources),
     fog colour per theme, ambient particles, light shafts, emissive features. Tall walls use a camera cut-away (dithered) shader.
   - Perf: geometry is instanced per area, areas are culled by distance + frustum; Graphics Low/Medium/High scales lights, particles,
     shafts, textures and cull distance. Bosses keep their rooms on the spine (x = 0, floor y = 0) so every mechanic works unchanged. */
const DGEO={box:new THREE.BoxGeometry(1,1,1),cone:new THREE.ConeGeometry(1,1,6),cyl:new THREE.CylinderGeometry(1,1,1,10),ico:new THREE.IcosahedronGeometry(1,0),rock:ENV.rock};
for(const k in DGEO)DGEO[k].userData.keep=true;
const DU={uPl:{value:new THREE.Vector3()},uCam:{value:new THREE.Vector3()},uTime:{value:0}};
const DTHEME={
  mine:{tex:'rock',texS:0.2,wallH:6.5,floor:0x6e5440,floor2:0x624a38,wall:0x8a6a50,trim:0x6a4428,acc:0xffb347,glow:[0x5ff2ff,0xb46bff,0xffc070],crack:0x5ff2ff,crackK:0.8,
    fog:0x4a3628,fogN:30,fogF:125,hemi:[0xfff0d8,0x4a3426,0.85],dir:0.45,light:[0xffb060,0x5ff2ff,0xb46bff],pit:0x5ff2ff,water:0x3a8a9a,
    part:{col:0xffe6c0,size:0.16,vy:0.05,drift:0.25},shaft:0xfff2c8,sky:[0x9fc8e8,0xe8d0a8],name:'Timber shafts, lanterns and singing crystal'},
  vault:{tex:'panel',texS:0.25,wallH:7,floor:0x8a929e,floor2:0x7a828e,wall:0x9ea8b4,trim:0x3a4250,acc:0xff3b2f,glow:[0x5ff2ff,0xff3b2f,0xe8f4ff],crack:0x7ff6ff,crackK:0.7,
    fog:0x3a4656,fogN:32,fogF:130,hemi:[0xf0f6ff,0x404a58,0.82],dir:0.42,light:[0x9fdfff,0xff4a3a,0xe8f4ff],pit:0x5ff2ff,water:0x2ab8d8,
    part:{col:0xcfeaff,size:0.12,vy:0.02,drift:0.15},shaft:0xd8f0ff,sky:[0x5a7898,0xb8d0e8],name:'Clean Combine steel, machinery and warning lights'},
  bastion:{tex:'basalt',texS:0.18,wallH:8,floor:0x5a463e,floor2:0x4c3a34,wall:0x6a5048,trim:0x2e201a,acc:0xff6a2a,glow:[0xff6a2a,0xffb347,0xffe08a],crack:0xff5a1a,crackK:1.15,
    fog:0x4a2418,fogN:30,fogF:120,hemi:[0xffd0a8,0x4a2214,0.85],dir:0.4,light:[0xff7a2a,0xffb347,0xff4a1a],pit:0xff5a1a,water:0xff6a1a,lava:true,
    part:{col:0xff9a4a,size:0.2,vy:0.9,drift:0.35,add:true},shaft:0xffc890,sky:[0x6a1e10,0xff7a3a],name:'Basalt forge-fortress over rivers of lava'},
  choir:{tex:'flag',texS:0.16,wallH:10,floor:0x6a6080,floor2:0x5a5070,wall:0x7a7094,trim:0x2c2440,acc:0xb46bff,glow:[0xb46bff,0x7ff6ff,0xff9ae8],crack:0xc88bff,crackK:0.9,
    fog:0x2e2442,fogN:30,fogF:125,hemi:[0xe8dcff,0x3a2c50,0.9],dir:0.45,light:[0xb46bff,0x7ff6ff,0xff9ae8],pit:0xb46bff,water:0x6a5ad8,
    part:{col:0xd8b8ff,size:0.18,vy:0.12,drift:0.3,add:true},shaft:0xe8d8ff,sky:[0x2a1e4a,0xb48ad8],name:'Living-crystal cathedral, light shafts and a drowned nave'},
  stillvault:{tex:'ice',texS:0.17,wallH:8,floor:0x92a8bc,floor2:0x8298ae,wall:0x9eb6cc,trim:0x4a6a88,acc:0x9fe8ff,glow:[0x9fe8ff,0xffffff,0x6fe8ff],crack:0x8fe8ff,crackK:0.85,
    fog:0x6a84a0,fogN:34,fogF:135,hemi:[0xeef6ff,0x506680,0.66],dir:0.4,light:[0x9fe8ff,0xd8f4ff,0x6fe8ff],pit:0x6fe8ff,water:0x8fd0f0,
    part:{col:0xffffff,size:0.2,vy:-0.8,drift:0.4},shaft:0xeaf6ff,sky:[0x9ab8d4,0xe8f4ff],name:'Frozen archive: ice stacks, glacier rifts, falling snow'}};
DTHEME.sunless=DTHEME.choir;
/* spine specs. o: index into the dungeon's own rooms[] (keeps packs/bosses); n: new area name (pk = trash packs, auto-picked from the dungeon's mobs).
   c: connector to the previous area {t,len}. y: floor height. wing:{side,kind,w,d}. bal: balcony side. sc: this room holds the shortcut lever. */
const DLAY={
  mine:[{o:0,s:'hall',w:28,d:24,nm:'Pithead'},
    {c:'corr',len:12},{o:1,s:'cavern',w:36,d:30,nm:'Timber Gallery',wing:{side:-1,kind:'loot',w:16,d:14}},
    {c:'corr',len:16},{n:'Glimmer Grotto',s:'garden',w:34,d:30,y:-3,pk:1,vents:3},
    {c:'flood',len:12},{o:2,s:'cavern',w:38,d:32,y:-3,nm:'Deep Seam',bal:1,wing:{side:-1,kind:'secret',w:14,d:12}},
    {c:'plates',len:16},{o:3,s:'arena',w:30,d:28,sc:true,nm:"Foreman's Pit"},
    {c:'corr',len:10},{n:'Sunken Shaft',s:'chasm',w:34,d:36,pk:1,collapse:true,outdoor:-1},
    {c:'corr',len:12},{o:4,s:'cavern',w:34,d:28,nm:'Collapsed Drift',wing:{side:1,kind:'elite',w:16,d:14}},
    {c:'vents',len:12},{o:5,s:'arena',w:38,d:36,nm:'The Nest'}],
  vault:[{o:0,s:'hall',w:28,d:24,nm:'Decon Lock'},
    {c:'gate',len:12},{o:1,s:'machine',w:36,d:30,nm:'Assembly Floor',wing:{side:-1,kind:'loot',w:16,d:14}},
    {c:'lasers',len:16},{n:'Coolant Hall',s:'flooded',w:36,d:30,y:-3,pk:1},
    {c:'corr',len:14},{o:2,s:'hall',w:38,d:32,nm:'Observation Deck',bal:1,wing:{side:-1,kind:'secret',w:14,d:12}},
    {c:'plates',len:12},{o:3,s:'arena',w:30,d:28,sc:true,nm:'Warden Gate'},
    {c:'gate',len:12},{n:'Reactor Core',s:'shaft',w:34,d:34,pk:1},
    {c:'lasers',len:12},{o:4,s:'machine',w:36,d:30,nm:'Fabricator Line',wing:{side:1,kind:'elite',w:16,d:14}},
    {c:'corr',len:12},{o:5,s:'arena',w:40,d:38,nm:'Custodian Core'}],
  bastion:[{o:0,s:'hall',w:30,d:24,nm:'Ash Gate'},
    {c:'corr',len:12},{o:1,s:'forge',w:40,d:32,y:-3,nm:'Lower Forges',wing:{side:-1,kind:'loot',w:16,d:14}},
    {c:'bridge',len:18},{o:2,s:'arena',w:40,d:36,sc:true,nm:'Slag Hall'},
    {c:'gate',len:12},{n:'Magma Falls',s:'chasm',w:40,d:40,pk:1},
    {c:'corr',len:12},{o:3,s:'forge',w:40,d:32,nm:'Upper Forges',bal:-1,wing:{side:1,kind:'elite',w:16,d:14}},
    {c:'vents',len:14},{o:4,s:'arena',w:42,d:38,nm:"Ember Queen's Court"},
    {c:'corr',len:12},{n:'Ashen Causeway',s:'outdoor',w:46,d:40,pk:1,outdoor:1,wing:{side:-1,kind:'secret',w:14,d:12}},
    {c:'corr',len:12},{o:5,s:'forge',w:38,d:30,nm:'Crucible Ward'},
    {c:'bridge',len:18},{o:6,s:'arena',w:48,d:44,nm:'Heart of the Bastion'}],
  choir:[{o:0,s:'nave',w:30,d:26,nm:'Narthex'},
    {c:'corr',len:12},{o:1,s:'garden',w:36,d:30,nm:'Crystal Cloister',wing:{side:-1,kind:'loot',w:16,d:14}},
    {c:'corr',len:14},{n:'Drowned Nave',s:'flooded',w:36,d:40,y:-3,pk:1,outdoor:0},
    {c:'corr',len:14},{o:2,s:'nave',w:38,d:34,nm:'Hall of Echoes',bal:1,wing:{side:-1,kind:'secret',w:14,d:12}},
    {c:'corr',len:12},{o:3,s:'arena',w:34,d:32,sc:true,nm:"Cantor's Choir"},
    {c:'gate',len:12},{o:4,s:'garden',w:36,d:30,nm:'Resonant Garden',pulse:3,wing:{side:1,kind:'elite',w:16,d:14}},
    {c:'corr',len:12},{o:5,s:'arena',w:38,d:34,nm:'Hymn Gallery'},
    {c:'bridge',len:18},{n:'The Resonant Shaft',s:'shaft',w:36,d:36,pk:1},
    {c:'plates',len:12},{o:6,s:'nave',w:36,d:32,nm:'Apse'},
    {c:'corr',len:12},{o:7,s:'arena',w:44,d:40,nm:'Throne of the Choirmother'}],
  stillvault:[{o:0,s:'hall',w:30,d:26,nm:'Frost Lock'},
    {c:'corr',len:12},{o:1,s:'archive',w:36,d:32,nm:'The Stacks',wing:{side:-1,kind:'loot',w:16,d:14}},
    {c:'gate',len:12},{n:'Glacier Rift',s:'chasm',w:36,d:36,pk:1,collapse:true,outdoor:1},
    {c:'corr',len:12},{o:2,s:'archive',w:38,d:34,nm:'Deep Index',bal:1,wing:{side:-1,kind:'secret',w:14,d:12}},
    {c:'vents',len:14},{o:3,s:'arena',w:34,d:32,sc:true,nm:"Warden's Rotunda"},
    {c:'corr',len:16},{o:4,s:'frozen',w:36,d:30,y:-3,nm:'Frozen Hall',wing:{side:1,kind:'elite',w:16,d:14}},
    {c:'corr',len:16},{o:5,s:'arena',w:38,d:34,nm:'Orrery Dome'},
    {c:'corr',len:12},{n:'Hall of Still Hours',s:'shaft',w:36,d:36,pk:1},
    {c:'gate',len:12},{o:6,s:'archive',w:36,d:30,nm:'Sealed Index'},
    {c:'corr',len:12},{o:7,s:'arena',w:44,d:40,nm:"Ysra's Throne"}]};
/* ---------- procedural textures: R = albedo detail, G = glow mask (veins / cracks / seams) ---------- */
const DTEX={};
function dtexMake(N,fn){const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');const id=g.createImageData(N,N);const d=id.data;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=fn(x/N,y/N);const i=(y*N+x)*4;d[i]=clamp(v[0],0,1)*255;d[i+1]=clamp(v[1],0,1)*255;d[i+2]=clamp(v[2]||0,0,1)*255;d[i+3]=255;}
  g.putImageData(id,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;return t;}
function dtex(kind){if(DTEX[kind])return DTEX[kind];const N=256;let f;
  if(kind==='rock')f=(u,v)=>{const n=pfbm(u*4,v*4,4,4,11);const st=Math.sin((v*6+n*1.6)*Math.PI*2)*0.5+0.5;const r=0.32+n*0.42+st*0.14+(pnoise(u*32,v*32,32,3)-0.5)*0.16;
    const f=pnoise(u*20,v*20,20,5)*0.7+pnoise(u*40,v*40,40,8)*0.3;return [r,f>0.8?(f-0.8)/0.12:0,0];};
  else if(kind==='basalt')f=(u,v)=>{const w=worley(u*WC,v*WC);const e=w[1]-w[0];const r=0.34+0.3*pnoise(u*16,v*16,16,7)+smooth(0,0.14,e)*0.32-0.1*w[0];return [r,e<0.07?1-e/0.07:0,0];};
  else if(kind==='flag')f=(u,v)=>{const row=Math.floor(v*4);const uu=u*4+(row%2)*0.5;const fx=uu-Math.floor(uu),fy=v*4-row;const m=Math.min(fx,1-fx,fy,1-fy);const mort=m<0.035;
    const h=Math.sin(Math.floor(uu)*12.9+row*78.2)*43758.5;const tint=(h-Math.floor(h))*0.16;const r=mort?0.22:0.5+tint+pfbm(u*8,v*8,8,3,17)*0.26;
    const vn=Math.pow(1-Math.abs(2*pnoise(u*6,v*6,6,31)-1),20);return [r,mort?0:vn,0];};
  else if(kind==='ice')f=(u,v)=>{const n=pfbm(u*3,v*3,3,4,41);const w=worley(u*WC,v*WC);const cr=w[1]-w[0];const r=0.58+0.3*n+(pnoise(u*24,v*24,24,9)-0.5)*0.1-(cr<0.05?0.12:0);return [r,cr<0.035?(1-cr/0.035)*0.95:0,0];};
  else f=(u,v)=>{let c=0.62+pfbm(u*8,v*8,8,3,55)*0.25-0.08;const px=(u*2)%1,py=(v*2)%1;const sx=Math.min(px,1-px),sy=Math.min(py,1-py);let g=0;
    if(sx<0.012||sy<0.012)c*=0.55;else if(sx<0.03||sy<0.03)c*=0.9;if(sy<0.012&&((u*8)%1)<0.45)g=1;
    if((Math.abs(px-0.06)<0.012||Math.abs(px-0.94)<0.012)&&(Math.abs(py%0.25-0.125)<0.012))c*=0.6;c+=(pnoise(u*64,v*64,64,93)-0.5)*0.06;return [c,g,0];};
  return DTEX[kind]=dtexMake(N,f);}
/* ---------- materials: triplanar texture + glowing mask + camera cut-away (walls) ---------- */
const DMAT={};
function dmat(th,kind,tex){const key=th.tex+'|'+kind+'|'+(tex?1:0);if(DMAT[key])return DMAT[key];
  const m=new THREE.MeshLambertMaterial({color:0xffffff});const cut=kind!=='floor';
  const u={uTex:{value:tex?dtex(th.tex):null},uS:{value:th.texS*(kind==='floor'?1.1:1)},uGlow:{value:new THREE.Color(th.crack)},uGK:{value:th.crackK*(kind==='floor'?0.45:0.75)},uPl:DU.uPl,uCam:DU.uCam,uTime:DU.uTime};
  m.userData.u=u;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;').replace('#include <begin_vertex>',`#include <begin_vertex>
      #ifdef USE_INSTANCING
        mat4 tm=modelMatrix*instanceMatrix;
      #else
        mat4 tm=modelMatrix;
      #endif
      vWP=(tm*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(tm)*objectNormal);`);
    let pre=`uniform sampler2D uTex;uniform float uS;uniform vec3 uGlow;uniform float uGK;uniform vec3 uPl;uniform vec3 uCam;uniform float uTime;varying vec3 vWP;varying vec3 vWN;`;
    let cutc=cut?`{vec3 dd=uPl-uCam;float L=length(dd);vec3 n=dd/max(L,0.001);float tt=dot(vWP-uCam,n);
        if(tt>0.2&&tt<L-0.8&&vWP.y>uPl.y+0.45){float r=length(vWP-(uCam+n*tt));float R=2.8+(1.0-tt/L)*10.0;if(r<R){float k=clamp((R-r)/1.4,0.0,1.0);vec2 f=mod(floor(gl_FragCoord.xy),2.0);float bay=(f.x*2.0+f.y*3.0-f.x*f.y*4.0)/4.0+0.125;if(k>bay)discard;}}}`:'';
    let col=tex?`vec3 an=abs(vWN);vec2 uv=(an.y>an.x&&an.y>an.z)?vWP.xz:((an.x>an.z)?vWP.zy:vWP.xy);vec4 tx=texture2D(uTex,uv*uS);
        diffuseColor.rgb*=clamp(0.4+tx.r*1.0,0.36,1.3);float gk=smoothstep(0.35,0.85,tx.g)*uGK;`:`float gk=0.0;`;
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+pre)
      .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n'+cutc)
      .replace('#include <color_fragment>','#include <color_fragment>\n'+col)
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=uGlow*gk*(0.75+0.25*sin(uTime*1.7+vWP.x*0.31+vWP.z*0.23));');};
  m.customProgramCacheKey=()=>'dr_dun_'+kind+'_'+(cut?'c':'n')+(tex?'t':'p');return DMAT[key]=m;}
const DGLOW={};function dglow(add){const k=add?'a':'b';return DGLOW[k]||(DGLOW[k]=new THREE.MeshBasicMaterial(add?{color:0xffffff,transparent:true,opacity:0.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}:{color:0xffffff}));}
/* ---------- layout ---------- */
function dunTheme(id){return DTHEME[id]||DTHEME.mine;}
function dunAutoSpec(D){const L=[];D.rooms.forEach((r,i)=>{if(i)L.push({c:i%3===2?'gate':'corr',len:12});L.push({o:i,s:r.boss?'arena':r.entry?'hall':(i%2?'cavern':'hall'),w:Math.round(r.w*(r.boss?1.15:1.45)),d:Math.round(r.d*(r.boss?1.15:1.4))});});return L;}
function dunLayout(d){const D=d.D,spec=DLAY[D.id]||dunAutoSpec(D);const areas=[],rooms=[];let pend=null;
  const mk=o=>{const a=Object.assign({open:{zp:[],zm:[],xp:[],xm:[]},inst:{},walls:['zp','zm','xp','xm'],y:0,seen:false,hidden:false},o);
    if(a.x0==null){a.x0=a.cx-a.w/2;a.x1=a.cx+a.w/2;a.z0=a.cz-a.d/2;a.z1=a.cz+a.d/2;}else{a.w=a.x1-a.x0;a.d=a.z1-a.z0;a.cx=(a.x0+a.x1)/2;a.cz=(a.z0+a.z1)/2;}
    a.id=areas.length;areas.push(a);return a;};
  for(const s of spec){if(s.c){pend=s;continue;}
    const src=s.o!=null?D.rooms[s.o]:null;const prev=rooms[rooms.length-1];const cz=prev?prev.cz-prev.d/2-pend.len-s.d/2:60;
    const A=mk({kind:'room',s:s.s,cx:0,cz,w:s.w,d:s.d,y:src&&src.boss?(s.by||0):(s.y||0),nm:s.nm||s.n||(src&&src.boss?BOSSES[src.boss].etype:'Hall'),spec:s,entry:!!(src&&src.entry),boss:src?src.boss:null,final:!!(src&&src.final),packs:src?src.packs:null,isNew:!src,i:rooms.length});
    if(prev){const cw=pend.c==='bridge'?5:7;const C=mk({kind:'conn',t:pend.c,x0:-cw/2,x1:cw/2,z0:A.z1,z1:prev.z0,ya:prev.y,yb:A.y,y:Math.min(prev.y,A.y),walls:pend.c==='bridge'?[]:['xp','xm'],nm:'Passage'});
      C.h=(x,z)=>C.ya+(C.z1-z)/(C.z1-C.z0)*(C.yb-C.ya);prev.open.zm.push([0,cw]);A.open.zp.push([0,cw]);A.inConn=C;}
    rooms.push(A);}
  // wings
  for(const A of rooms){const W=A.spec.wing;if(!W)continue;const wl=8,ww=5,sd=W.side;
    const cx=sd*(A.w/2+wl+W.w/2);const B=mk({kind:'wing',wk:W.kind,cx,cz:A.cz,w:W.w,d:W.d,y:A.y,nm:W.kind==='loot'?'Supply Cache':W.kind==='elite'?'Champion\'s Den':'Hidden Vault',hidden:W.kind==='secret',parent:A,side:sd,s:W.kind==='elite'?'cavern':'hall'});
    const C=mk({kind:'conn',t:'wing',x0:sd>0?A.x1:A.x0-wl,x1:sd>0?A.x1+wl:A.x0,z0:A.cz-ww/2,z1:A.cz+ww/2,y:A.y,walls:['zp','zm'],hidden:W.kind==='secret',nm:'Side passage'});
    A.open[sd>0?'xp':'xm'].push([A.cz,ww]);B.open[sd>0?'xm':'xp'].push([A.cz,ww]);B.conn=C;A.wingA=B;}
  // shortcut: lever room -> entrance, on the +x side
  const k=rooms.findIndex(r=>r.spec.sc);let sc=null;
  if(k>0){const E=rooms[0],K=rooms[k];let R=0;for(let i=0;i<=k;i++){R=Math.max(R,rooms[i].x1);const a=rooms[i];if(a.wingA&&a.wingA.side>0)R=Math.max(R,a.wingA.x1);}R+=10;const cw=5,zk=K.cz+4,ze=E.cz;
    const H1=mk({kind:'conn',t:'sc',x0:E.x1,x1:R-cw/2,z0:ze-cw/2,z1:ze+cw/2,y:0,walls:['zp','zm'],hidden:true,nm:'Shortcut'});
    const H2=mk({kind:'conn',t:'sc',x0:K.x1,x1:R-cw/2,z0:zk-cw/2,z1:zk+cw/2,y:0,walls:['zp','zm'],hidden:true,nm:'Shortcut'});
    const V=mk({kind:'conn',t:'sc',x0:R-cw/2,x1:R+cw/2,z0:zk-cw/2,z1:ze+cw/2,y:0,walls:['xp','xm','zp','zm'],hidden:true,nm:'Shortcut'});
    V.open.xm.push([ze,cw]);V.open.xm.push([zk,cw]);E.open.xp.push([ze,cw]);K.open.xp.push([zk,cw]);sc={E,K,H1,H2,V,zk,ze,cw};}
  return {areas,rooms,sc};}
/* ---------- builder ---------- */
function buildDungeon(d){const D=d.D,th=dunTheme(D.id),G=d.group;const gl=GFX_LV[GFXC.lvl]||GFX_LV.medium;const lowG=GFXC.lvl==='low';
  const seed=[...D.id].reduce((a,c)=>a*31+c.charCodeAt(0),7)>>>0;const RN=mulberry32(seed);const rr=(a,b)=>a+RN()*(b-a);const rp=a=>a[Math.floor(RN()*a.length)];
  const L=dunLayout(d);const {areas,rooms}=L;d.areas=areas;d.rooms=rooms;d.th=th;
  Object.assign(d,{boxesAdd:[],hOver:[],pits:[],haz:[],vents:[],plates:[],gates:[],doors:{},levers:[],chests:[],secrets:[],planks:[],water:[],spin:[],pist:[],lava:[],lightSrc:[],shafts:[],shots:[],cracks:[]});
  let A=null;const add=(k,x,y,z,sx,sy,sz,col,ry,rx,rz)=>{(A.inst[k]||(A.inst[k]=[])).push([x,y,z,sx,sy,sz,col,ry||0,rx||0,rz||0]);};
  const colB=(x0,z0,x1,z1,y)=>{const b={x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1),y0:y,y1:y+2.2,nocam:true};d.boxesAdd.push(b);return b;};
  const colC=(x,z,r)=>circles.push({x,z,r});
  const light=(x,y,z,col,int,dist)=>d.lightSrc.push({x,y,z,col,int:int||1.4,dist:dist||18});
  const dim=(c,k)=>new THREE.Color(c).multiplyScalar(k).getHex();
  const H=th.wallH;
  const gcol=i=>th.glow[i%th.glow.length];
  /* walls with openings */
  function sideWalls(a,side,h,col){const t=1;const along=side==='zp'||side==='zm';const lo=along?a.x0-t:a.z0,hi=along?a.x1+t:a.z1;const fix=side==='zp'?a.z1+t/2:side==='zm'?a.z0-t/2:side==='xp'?a.x1+t/2:a.x0-t/2;
    const ops=a.open[side].slice().sort((p,q)=>p[0]-q[0]);let cur=lo;const segs=[];for(const [c,w] of ops){if(c-w/2>cur)segs.push([cur,c-w/2]);cur=Math.max(cur,c+w/2);}if(hi>cur)segs.push([cur,hi]);
    const yb=a.kind==='conn'&&a.ya!=null?Math.min(a.ya,a.yb):a.y;const hh=h+(a.kind==='conn'&&a.ya!=null?Math.abs(a.ya-a.yb):0);
    for(const [p,q] of segs){const len=q-p,m=(p+q)/2;if(len<0.05)continue;const cc=col||th.wall;
      if(along){add('w',m,yb+hh/2-0.5,fix,len,hh+1,t,cc);add('w',m,yb+hh+0.15,fix,len+0.1,0.3,t+0.4,th.trim);colB(p,fix-t/2,q,fix+t/2,yb);}
      else{add('w',fix,yb+hh/2-0.5,m,t,hh+1,len,cc);add('w',fix,yb+hh+0.15,m,t+0.4,0.3,len+0.1,th.trim);colB(fix-t/2,p,fix+t/2,q,yb);}}
    // door frames: posts + lintel above every opening of a room
    if(a.kind!=='conn')for(const [c,w] of ops){const y=a.y;for(const s of [-1,1]){const pc=c+s*(w/2+0.45);if(along)add('w',pc,y+2.6,fix,1.0,5.2,1.6,th.trim);else add('w',fix,y+2.6,pc,1.6,5.2,1.0,th.trim);}
      if(h>5){if(along)add('w',c,y+(5.2+h)/2,fix,w+0.2,h-5.2,1,th.wall);else add('w',fix,y+(5.2+h)/2,c,1,h-5.2,w+0.2,th.wall);}
      if(along)add('g',c,y+5.0,fix+(side==='zp'?-0.55:0.55),w*0.7,0.12,0.06,th.acc);else add('g',fix+(side==='xp'?-0.55:0.55),y+5.0,c,0.06,0.12,w*0.7,th.acc);}}
  function floorSlab(a,x0,z0,x1,z1,col){add('f',(x0+x1)/2,a.y-0.5,(z0+z1)/2,x1-x0,1,z1-z0,col);}
  function door(id,a,side,c,w,kind){const along=side==='zp'||side==='zm';const fix=side==='zp'?a.z1+0.5:side==='zm'?a.z0-0.5:side==='xp'?a.x1+0.5:a.x0-0.5;const y=a.y;const hgt=5.2;
    const col=kind==='secret'?dim(th.wall,0.92):kind==='sc'?th.trim:kind==='gate'?th.trim:0x3a3a40;
    const mat=dmat(th,'wall',gl.tex);const m=new THREE.Mesh(DGEO.box,mat);m.scale.set(along?w:1.2,hgt,along?1.2:w);m.position.set(along?c:fix,y+hgt/2,along?fix:c);
    m.material=mat;const mm=new THREE.Mesh(DGEO.box,new THREE.MeshBasicMaterial({color:kind==='secret'?th.crack:kind==='gate'?0xff4a2a:th.acc}));mm.scale.set(along?w*0.8:1.25,0.18,along?1.25:w*0.8);mm.position.set(m.position.x,y+(kind==='secret'?1.4:2.8),m.position.z);
    if(kind==='secret'){mm.scale.set(along?0.14:1.25,2.6,along?1.25:0.14);mm.rotation[along?'z':'x']=0.5;}
    A.g.add(m);A.g.add(mm);const box={x0:(along?c-w/2:fix-0.6),x1:(along?c+w/2:fix+0.6),z0:(along?fix-0.6:c-w/2),z1:(along?fix+0.6:c+w/2),y0:y,y1:y+2.2};
    const D0={id,kind,m,mm,box,open:false,y0:y+hgt/2,hgt,x:m.position.x,z:m.position.z,area:a};d.doors[id]=D0;d.boxesAdd.push(box);return D0;}
  function lever(x,z,y,opens,label,area){const g=new THREE.Group();g.position.set(x,y,z);part(g,geoBox,M(0x2a2a30),0,0.6,0,0.7,1.2,0.5);const h=part(g,geoBox,MB(th.acc),0,1.3,0,0.14,0.9,0.14);h.rotation.z=0.6;part(g,geoBox,MB(0xffd34a),0,1.22,0.27,0.4,0.3,0.04);
    area.g.add(g);const lv={x,z,y,opens,label,used:false,h,id:'lever'+d.levers.length};d.levers.push(lv);light(x,y+2,z,th.acc,0.9,9);return lv;}
  function chest(x,z,y,kind,area){const g=new THREE.Group();g.position.set(x,y,z);part(g,geoBox,M(0x5a4a2a),0,0.45,0,1.5,0.9,1.0);const lid=part(g,geoBox,M(0x7a6234),0,0.98,0,1.56,0.18,1.06);part(g,geoBox,MB(kind==='secret'?0xff9ae8:0xffd34a),0,0.62,0.52,0.32,0.24,0.04);
    area.g.add(g);const c={x,z,y,kind,opened:false,lid,g,area};d.chests.push(c);colC(x,z,0.8);light(x,y+1.6,z,kind==='secret'?0xff9ae8:0xffd34a,0.8,7);return c;}
  /* ---- per-area dressing ---- */
  for(A of areas){A.g=new THREE.Group();G.add(A.g);
    if(A.kind==='conn'){const y=A.y;const alongZ=A.t!=='wing'&&!(A.t==='sc'&&A.z1-A.z0<A.x1-A.x0);
      if(A.ya!=null&&A.ya!==A.yb){const len=A.z1-A.z0,dy=A.yb-A.ya;const th0=Math.atan2(dy,len);add('f',A.cx,(A.ya+A.yb)/2-0.35,A.cz,A.w+0.02,0.7,Math.hypot(len,dy)+0.4,th.floor2,0,th0);}
      else if(A.t!=='bridge')add('f',A.cx,y-0.5,A.cz,A.w+(alongZ?0.02:0.6),1,A.d+(alongZ?0.6:0.02),th.floor2);
      for(const s of A.walls)sideWalls(A,s,A.t==='sc'?4.2:4.8,A.t==='sc'?dim(th.wall,0.85):null);
      // wall lights / theme trim along the corridor
      const n=Math.floor((alongZ?A.d:A.w)/4);for(let k=1;k<n;k++){const p=(alongZ?A.z0:A.x0)+k*4;const yy=A.h?A.h(alongZ?0:p,alongZ?p:0):y;
        if(A.t==='bridge')continue;if(alongZ){add('g',A.x0+0.05,yy+2.4,p,0.08,0.3,0.7,gcol(k));add('g',A.x1-0.05,yy+2.4,p,0.08,0.3,0.7,gcol(k+1));}else{add('g',p,yy+2.4,A.z0+0.05,0.7,0.3,0.08,gcol(k));add('g',p,yy+2.4,A.z1-0.05,0.7,0.3,0.08,gcol(k+1));}
        if(D.id==='mine'&&alongZ&&k%2===0){add('w',A.x0+0.35,yy+2,p,0.45,4,0.45,th.trim);add('w',A.x1-0.35,yy+2,p,0.45,4,0.45,th.trim);add('w',A.cx,yy+4.1,p,A.w,0.45,0.45,th.trim);}
        if(k%3===1)light(alongZ?A.cx:p,yy+2.6,alongZ?p:A.cz,gcol(k),1.0,12);}
      if(A.t==='bridge'){// open-sided bridge over a pit: rails + supports + glowing depths
        const len=A.d;add('w',A.cx,y-0.35,A.cz,A.w,0.7,len+0.4,th.trim);for(const s of [-1,1]){add('w',s*(A.w/2+0.1),y+0.55,A.cz,0.18,0.18,len,th.acc);for(let q=0;q<=len;q+=3)add('w',s*(A.w/2+0.1),y+0.3,A.z0+q,0.25,0.9,0.25,th.trim);colB(s*(A.w/2)-0.3*s,A.z0,s*(A.w/2)+0.4*s,A.z1,y);}
        add('g',A.cx,y-16,A.cz,46,0.2,len+6,dim(th.pit,0.55));for(const s of [-1,1]){add('w',s*24,y-8,A.cz,2,16,len+6,dim(th.wall,0.6));}
        for(let q=0;q<4;q++)add('w',rr(-14,14),y-rr(7,13),A.z0+rr(0,len),rr(1,3),rr(6,12),rr(1,3),dim(th.wall,0.7));
        light(A.cx,y-6,A.cz,th.pit,1.8,30);if(th.lava)d.lava.push({x0:-22,x1:22,z0:A.z0-3,z1:A.z1+3,y:y-15.8,g:A.g});}
      if(A.t==='gate'){const gd=door('gate'+A.id,A,'zm',0,A.w,'gate');// timed gate sits mid-corridor
        gd.m.position.z=A.cz;gd.mm.position.z=A.cz;gd.m.scale.set(A.w,gd.hgt,0.6);gd.mm.scale.set(A.w*0.8,0.18,0.65);gd.box.z0=A.cz-0.35;gd.box.z1=A.cz+0.35;gd.box.x0=A.x0;gd.box.x1=A.x1;gd.y0=A.y+gd.hgt/2;
        d.gates.push({door:gd,openT:3.4,closeT:2.4,ph:RN()*5});}
      if(A.t==='lasers'){for(let q=1;q<=3;q++){const z=A.z1-q*A.d/4;const m=new THREE.Mesh(DGEO.box,new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0.85}));m.scale.set(A.w,0.12,0.5);m.position.set(A.cx,(A.h?A.h(0,z):y)+0.7,z);A.g.add(m);
        const m2=m.clone();m2.position.y-=0.45;m2.material=m.material;A.g.add(m2);d.haz.push({kind:'laser',x0:A.x0,x1:A.x1,z0:z-0.6,z1:z+0.6,on:true,per:[2.2,2.0],ph:q*0.7,mats:[m.material],ms:[m,m2],dps:0.09});}}
      if(A.t==='vents')for(let q=1;q<=2;q++){const z=A.z1-q*A.d/3;const x=(q%2?-1:1)*1.2;add('w',x,(A.h?A.h(x,z):y)+0.05,z,1.6,0.12,1.6,th.trim);add('g',x,(A.h?A.h(x,z):y)+0.12,z,1.0,0.04,1.0,th.acc);d.vents.push({x,z,r:2.6,every:4.5,next:0,kind:th.lava?'fire':D.id==='stillvault'?'frost':'gas'});}
      if(A.t==='plates')for(let q=1;q<=2;q++){const z=A.z1-q*A.d/3;const x=(q%2?1:-1)*1.3;add('w',x,(A.h?A.h(x,z):y)+0.04,z,1.5,0.1,1.5,dim(th.floor,0.75));d.plates.push({x,z,armed:true,re:0});}
      if(A.t==='flood'){d.water.push({x0:A.x0,x1:A.x1,z0:A.z0,z1:A.z1,y:A.y});}
      continue;}
    // ---------- rooms + wings ----------
    const y=A.y,hw=A.w/2,hd=A.d/2,s=A.s;const isArena=s==='arena';
    const wh=isArena?3.4:A.kind==='wing'?5:H;
    // floor (chasm rooms split around the pit)
    let pit=null;if(s==='chasm'){const pd=Math.round(A.d*0.4);pit={x0:A.x0,x1:A.x1,z0:A.cz-pd/2,z1:A.cz+pd/2,bw:4};}
    if(s==='shaft'){pit={x0:A.cx-(A.w/2-7),x1:A.cx+(A.w/2-9),z0:A.cz-(A.d/2-8),z1:A.cz+(A.d/2-8),bw:0};}
    if(pit&&s==='chasm'){floorSlab(A,A.x0-1,pit.z1,A.x1+1,A.z1+1,A.i%2?th.floor:th.floor2);floorSlab(A,A.x0-1,A.z0-1,A.x1+1,pit.z0,A.i%2?th.floor:th.floor2);}
    else if(pit&&s==='shaft'){floorSlab(A,A.x0-1,A.z0-1,A.x1+1,pit.z0,th.floor);floorSlab(A,A.x0-1,pit.z1,A.x1+1,A.z1+1,th.floor);floorSlab(A,A.x0-1,pit.z0,pit.x0,pit.z1,th.floor2);floorSlab(A,pit.x1,pit.z0,A.x1+1,pit.z1,th.floor2);}
    else floorSlab(A,A.x0-1,A.z0-1,A.x1+1,A.z1+1,A.i%2?th.floor:th.floor2);
    // walls (outdoor side gets a parapet + vista)
    const od=A.spec&&A.spec.outdoor;const vSide=od===1?'xp':od===-1?'xm':null;
    for(const sd of A.walls){if(sd===vSide){sideWalls(A,sd,1.2,th.trim);continue;}sideWalls(A,sd,wh);}
    // pits: walls going down, glowing depths, collision rims, bridge
    if(pit){d.pits.push(pit);const depth=s==='shaft'?18:16;const pc=dim(th.wall,0.62);
      add('w',(pit.x0+pit.x1)/2,y-depth/2,pit.z1+0.25,pit.x1-pit.x0,depth,0.5,pc);add('w',(pit.x0+pit.x1)/2,y-depth/2,pit.z0-0.25,pit.x1-pit.x0,depth,0.5,pc);
      if(s==='shaft'){add('w',pit.x0-0.25,y-depth/2,(pit.z0+pit.z1)/2,0.5,depth,pit.z1-pit.z0,pc);add('w',pit.x1+0.25,y-depth/2,(pit.z0+pit.z1)/2,0.5,depth,pit.z1-pit.z0,pc);}
      add('g',(pit.x0+pit.x1)/2,y-depth,(pit.z0+pit.z1)/2,pit.x1-pit.x0,0.2,pit.z1-pit.z0,dim(th.pit,0.6));light((pit.x0+pit.x1)/2,y-5,(pit.z0+pit.z1)/2,th.pit,2.2,34);
      if(th.lava)d.lava.push({x0:pit.x0,x1:pit.x1,z0:pit.z0,z1:pit.z1,y:y-depth+0.15,g:A.g});
      for(let q=0;q<6;q++){const xx=rr(pit.x0+2,pit.x1-2),zz=rr(pit.z0+1,pit.z1-1);if(Math.abs(xx)<4&&s==='chasm')continue;add(rp(['w','r']),xx,y-depth+rr(2,6),zz,rr(1,2.5),rr(2,7),rr(1,2.5),dim(th.wall,0.55));}
      const bw=pit.bw;const rim=(x0,x1,z)=>{if(x1-x0>0.1)colB(x0,z-0.3,x1,z+0.3,y);};
      if(s==='chasm'){rim(pit.x0,-bw/2,pit.z1-0.3);rim(bw/2,pit.x1,pit.z1-0.3);rim(pit.x0,-bw/2,pit.z0+0.3);rim(bw/2,pit.x1,pit.z0+0.3);
        for(const sg of [-1,1]){colB(sg*bw/2,pit.z0,sg*(bw/2+0.5),pit.z1,y);add('w',sg*(bw/2+0.15),y+0.6,(pit.z0+pit.z1)/2,0.16,0.16,pit.z1-pit.z0,th.acc);for(let q=pit.z0;q<=pit.z1;q+=2.5)add('w',sg*(bw/2+0.15),y+0.35,q,0.22,0.9,0.22,th.trim);}
        const plen=pit.z1-pit.z0;const n=Math.ceil(plen/2);const tl=plen/n;
        for(let q=0;q<n;q++){const z=pit.z0+tl*(q+0.5);if(A.spec.collapse){const m=new THREE.Mesh(DGEO.box,d.plankMat||(d.plankMat=new THREE.MeshLambertMaterial({color:dim(th.trim,1.15)})));m.scale.set(bw,0.45,tl-0.12);m.position.set(0,y-0.22,z);A.g.add(m);d.planks.push({m,z0:z-tl/2,z1:z+tl/2,x0:-bw/2,x1:bw/2,y,t:0,fallen:false,back:0,area:A});}
          else add('w',0,y-0.25,z,bw,0.5,tl-0.06,th.trim);}
        d.hOver.push({x0:-bw/2,x1:bw/2,z0:pit.z0,z1:pit.z1,y});
        if(A.spec.collapse)A.bridge={z0:pit.z0,z1:pit.z1};
        d.shots.push({x:3,z:pit.z1+5,yaw:0.5,pitch:0.5,dist:14});}
      else{rim(pit.x0,pit.x1,pit.z1+0.3);rim(pit.x0,pit.x1,pit.z0-0.3);colB(pit.x0-0.6,pit.z0,pit.x0,pit.z1,y);colB(pit.x1,pit.z0,pit.x1+0.6,pit.z1,y);
        for(const [x0,x1,z] of [[pit.x0,pit.x1,pit.z1],[pit.x0,pit.x1,pit.z0]])add('w',(x0+x1)/2,y+0.5,z,x1-x0,0.16,0.16,th.acc);
        // shaft: a beam of light / energy rising out of the pit
        if(!lowG){const bm=new THREE.Mesh(DGEO.cyl,dglow(true));bm.scale.set(Math.min(pit.x1-pit.x0,pit.z1-pit.z0)*0.32,40,Math.min(pit.x1-pit.x0,pit.z1-pit.z0)*0.32);bm.position.set((pit.x0+pit.x1)/2,y+2,(pit.z0+pit.z1)/2);bm.material=dglow(true).clone();bm.material.color.set(th.pit);bm.material.opacity=0.12;A.g.add(bm);d.shafts.push(bm);}
        // ledge on the -x side with a ramp up, holding a cache and a pack
        const lx0=A.x0,lx1=A.x0+5,lz0=pit.z0,lz1=pit.z1,ly=y+3.5,rz0=lz1,rz1=lz1+7;
        add('w',(lx0+lx1)/2,(ly+y)/2-0.01,(lz0+lz1)/2,5,ly-y,lz1-lz0,dim(th.wall,0.8));
        const rl=Math.hypot(7,ly-y);add('f',(lx0+lx1)/2,(ly+y)/2-0.3,(rz0+rz1)/2,5,0.6,rl,th.floor2,0,Math.atan2(ly-y,7));
        d.hOver.push({x0:lx0,x1:lx1,z0:lz0,z1:lz1,y:ly});d.hOver.push({x0:lx0,x1:lx1,z0:rz0,z1:rz1,f:(x,z)=>y+(rz1-z)/7*(ly-y)});
        colB(lx1,lz0,lx1+0.5,rz1-0.4,y);colB(lx0,lz0-0.5,lx1+0.5,lz0,y);add('w',lx1+0.1,ly+0.55,(lz0+lz1)/2,0.16,0.16,lz1-lz0,th.acc);for(let q=lz0;q<=lz1;q+=2.5)add('w',lx1+0.1,ly+0.3,q,0.22,0.8,0.22,th.trim);
        chest(lx0+2.2,lz0+2.5,ly,'loot',A);A.ledge={x0:lx0,x1:lx1,z0:lz0,z1:lz1,y:ly};
        d.shots.push({x:A.x0+9,z:pit.z1+5,yaw:-0.6,pitch:0.55,dist:13});}}
    // lanes kept clear (spine, side openings, pits, ledges)
    const opens=[];for(const sd of ['xp','xm'])for(const [c,w] of A.open[sd])opens.push({ax:'z',c,w});for(const sd of ['zp','zm'])for(const [c,w] of A.open[sd])opens.push({ax:'x',c,w});
    const blocked=(x,z,r)=>{if(A.kind==='room'&&Math.abs(x-A.cx)<4.8+r)return true;for(const o of opens){if(o.ax==='z'&&Math.abs(z-o.c)<o.w/2+1.4+r)return true;if(o.ax==='x'&&Math.abs(x-o.c)<o.w/2+1.4+r)return true;}
      if(pit&&x>pit.x0-r-1.2&&x<pit.x1+r+1.2&&z>pit.z0-r-1.2&&z<pit.z1+r+1.2)return true;if(A.ledge&&x<A.ledge.x1+r+1.5&&z>A.ledge.z0-r-1.5&&z<A.ledge.z1+8+r)return true;
      if(A.bal&&x>A.bal.x0-r-1.2&&x<A.bal.x1+r+1.2&&z>A.bal.z0-r-1.2&&z<A.bal.z1+r+1.2)return true;if(isArena&&Math.hypot(x-A.cx,z-A.cz)<Math.min(hw,hd)*0.7)return true;return Math.abs(x-A.cx)>hw-0.8-r||Math.abs(z-A.cz)>hd-0.8-r;};
    A.blocked=blocked;
    // balcony / gallery: a raised walkway along one side wall with a ramp
    if(A.spec&&A.spec.bal){const sd=A.spec.bal,bx0=sd>0?A.x1-5:A.x0,bx1=sd>0?A.x1:A.x0+5,bz0=A.z0+2,bz1=A.z1-12,by=y+2.8,rz1=bz1+7;
      add('w',(bx0+bx1)/2,(by+y)/2,(bz0+bz1)/2,5,by-y,bz1-bz0,dim(th.wall,0.82));add('f',(bx0+bx1)/2,(by+y)/2-0.3,(bz1+rz1)/2,5,0.6,Math.hypot(7,by-y),th.floor2,0,Math.atan2(by-y,7));
      d.hOver.push({x0:bx0,x1:bx1,z0:bz0,z1:bz1,y:by});d.hOver.push({x0:bx0,x1:bx1,z0:bz1,z1:rz1,f:(x,z)=>y+(rz1-z)/7*(by-y)});
      const ex=sd>0?bx0:bx1;colB(ex-0.25*sd-0.25,bz0,ex-0.25*sd+0.25,rz1-0.4,y);colB(bx0,bz0-0.5,bx1,bz0,y);
      add('w',ex,by+0.55,(bz0+bz1)/2,0.16,0.16,bz1-bz0,th.acc);for(let q=bz0;q<=bz1;q+=2.5){add('w',ex,by+0.3,q,0.22,0.8,0.22,th.trim);add('w',ex-sd*0.2,y+1.4,q,0.5,2.8,0.5,th.trim);}
      for(let q=bz0+3;q<bz1;q+=6){add('g',sd>0?A.x1-0.05:A.x0+0.05,by+2.2,q,0.08,0.3,1,gcol(q|0));light(ex,by+2,q,gcol(q|0),1.0,11);}
      A.bal={x0:bx0,x1:bx1,z0:bz0,z1:rz1,y:by,mz:(bz0+bz1)/2,mx:(bx0+bx1)/2};d.shots.push({x:sd*(hw-10),z:A.cz+hd-4,yaw:sd*0.5,pitch:0.5,dist:13});}
    // ---- shape dressing ----
    const scatter=(n,r,fn)=>{let k=0,tries=0;while(k<n&&tries<n*30){tries++;const x=rr(A.x0+1.5,A.x1-1.5),z=rr(A.z0+1.5,A.z1-1.5);if(blocked(x,z,r))continue;fn(x,z,k);k++;}};
    const crystal=(x,z,big)=>{const n=big?5:3,cl=gcol(Math.floor(rr(0,3)));for(let q=0;q<n;q++){const h=rr(0.8,big?4.2:2);add('gc',x+rr(-0.8,0.8),y+h/2,z+rr(-0.8,0.8),rr(0.18,big?0.55:0.3),h,rr(0.18,0.5),q%2?cl:dim(cl,0.75),0,rr(-0.35,0.35),rr(-0.35,0.35));}
      if(big){colC(x,z,1.1);light(x,y+2.2,z,cl,1.3,14);}add('g',x,y+0.03,z,2.2,0.04,2.2,dim(cl,0.35));};
    const pillar=(x,z,h,r)=>{if(D.id==='choir'||D.id==='stillvault'){add('wy',x,y+h/2,z,r,h,r,D.id==='stillvault'?dim(th.wall,0.95):th.wall);add('w',x,y+0.4,z,r*2.4,0.8,r*2.4,th.trim);add('w',x,y+h-0.3,z,r*2.4,0.6,r*2.4,th.trim);}
      else{add('w',x,y+h/2,z,r*2,h,r*2,D.id==='vault'?th.wall:th.trim);if(D.id==='vault')add('g',x,y+3,z+r+0.02,r*1.2,0.15,0.04,gcol(0));}colC(x,z,r+0.15);};
    if(s==='hall'||s==='machine'||s==='flooded'){for(let z=A.z0+6;z<=A.z1-6;z+=8)for(const sx of [-1,1]){const x=A.cx+sx*Math.max(7,A.w/4);if(!blocked(x,z,1.2))pillar(x,z,wh,0.85);}}
    if(s==='nave'){for(let z=A.z0+5;z<=A.z1-5;z+=6)for(const sx of [-1,1]){const x=A.cx+sx*(hw-6);if(blocked(x,z,1))continue;pillar(x,z,wh,0.9);add('w',x,y+wh-1,z+3,1.2,0.8,6,th.trim);}
      for(let z=A.z0+4;z<=A.z1-4;z+=6)for(const sx of [-1,1]){const wx=sx>0?A.x1-0.06:A.x0+0.06;add('g',wx,y+6.4,z,0.1,4.2,1.6,dim(gcol(Math.round(z/6)),0.9));add('g',wx,y+8.8,z,0.1,0.9,1.0,gcol(Math.round(z/6)+1));
        if(!lowG&&Math.round(z/6)%2===0){const bm=new THREE.Mesh(DGEO.cyl,dglow(true));bm.scale.set(1.0,13,1.0);bm.position.set(sx*(hw-5),y+4.5,z);bm.rotation.z=sx*0.55;A.g.add(bm);d.shafts.push(bm);}
        if(Math.round(z/6)%2===1)light(sx*(hw-3),y+5,z,gcol(Math.round(z/6)),1.0,14);}
      for(let z=A.cz-hd*0.5;z<A.cz+hd*0.4;z+=3)for(const sx of [-1,1]){const x=sx*(7.5);if(opens.some(o=>o.ax==='z'&&Math.abs(z-o.c)<o.w/2+1.5))continue;if(A.bal&&x>A.bal.x0-3.5&&x<A.bal.x1+3.5)continue;add('w',x,y+0.45,z,6,0.9,0.7,th.trim);colB(x-3,z-0.35,x+3,z+0.35,y);}
      for(let q=-4;q<=4;q++){const h=5+(4-Math.abs(q))*1.4;add('gy',q*1.1,y+h/2+1,A.z0+0.9,0.35,h,0.35,gcol(q+4));}}
    if(s==='cavern'){for(const sd of [-1,1])for(let z=A.z0+1;z<A.z1;z+=rr(2.6,4)){const x=sd>0?A.x1-rr(0.8,1.6):A.x0+rr(0.8,1.6);const sc=rr(1.4,2.8);if(blocked(x,z,0.1)&&Math.abs(z-A.cz)<4&&A.wingA)continue;if(opens.some(o=>o.ax==='z'&&Math.abs(z-o.c)<o.w/2+1.2))continue;add('r',x,y+sc*0.3,z,sc,sc*rr(0.9,1.6),sc,dim(th.wall,rr(0.75,1)),rr(0,6));}
      for(const sd of [-1,1])for(let x=A.x0+2;x<A.x1;x+=rr(3,4.5)){const z=sd>0?A.z1-rr(0.6,1.4):A.z0+rr(0.6,1.4);if(Math.abs(x)<5)continue;const sc=rr(1.2,2.4);add('r',x,y+sc*0.3,z,sc,sc*rr(1,1.8),sc,dim(th.wall,rr(0.75,1)),rr(0,6));}
      scatter(5,1.6,(x,z)=>{const sc=rr(1.4,2.6);add('r',x,y+sc*0.25,z,sc,sc*rr(0.7,1.3),sc,dim(th.wall,0.85),rr(0,6));colC(x,z,sc*0.8);});
      scatter(8,0.5,(x,z)=>{const h=rr(1,3.4);add('wc',x,y+h/2,z,rr(0.3,0.6),h,rr(0.3,0.6),dim(th.wall,0.8));});
      scatter(D.id==='bastion'?3:5,1.2,(x,z,k)=>crystal(x,z,k%2===0));}
    if(s==='garden'){scatter(14,1.4,(x,z,k)=>crystal(x,z,k%3===0));scatter(10,0.4,(x,z)=>add('g',x,y+0.03,z,rr(1,3),0.04,rr(1,3),dim(gcol(Math.floor(rr(0,3))),0.3)));
      const pn=(A.spec&&A.spec.pulse)||0;for(let q=0;q<pn;q++){const x=(q%2?1:-1)*rr(6,hw-4),z=A.cz+rr(-hd+5,hd-5);add('g',x,y+0.05,z,2.4,0.06,2.4,th.acc);d.vents.push({x,z,r:4,every:5.5,next:0,kind:'pulse'});}}
    if(s==='machine'){for(const sd of [-1,1])for(let z=A.z0+5;z<A.z1-4;z+=9){const x=sd>0?A.x1-0.6:A.x0+0.6;if(opens.some(o=>o.ax==='z'&&Math.abs(z-o.c)<o.w/2+3))continue;
        const g=new THREE.Mesh(DGEO.cyl,dmat(th,'wall',gl.tex));g.scale.set(2.4,0.5,2.4);g.rotation.z=Math.PI/2;g.position.set(x,y+3.6,z);A.g.add(g);d.spin.push({m:g,ax:'x',v:sd*0.8});
        for(let t=0;t<8;t++){const tb=new THREE.Mesh(DGEO.box,M(th.trim));tb.scale.set(0.5,0.6,0.5);const a=t/8*6.283;tb.position.set(0,Math.cos(a)*1.1,Math.sin(a)*1.1);g.add(tb);}
        add('g',x-sd*0.3,y+3.6,z,0.08,0.5,0.5,th.acc);}
      scatter(4,2,(x,z)=>{add('w',x,y+1.1,z,3,2.2,2,th.trim);colB(x-1.5,z-1,x+1.5,z+1,y);const p=new THREE.Mesh(DGEO.box,M(th.wall));p.scale.set(1.2,2,1.2);p.position.set(x,y+3,z);A.g.add(p);d.pist.push({m:p,y:y+3,ph:rr(0,6)});add('g',x,y+2.25,z+1.02,1.6,0.3,0.04,gcol(1));light(x,y+3,z,gcol(1),0.8,8);});
      for(let z=A.z0+3;z<A.z1-3;z+=2.5)add('g',0,y+0.03,z,1.2,0.04,0.4,dim(th.acc,0.5));
      scatter(5,0.8,(x,z)=>{add('w',x,y+0.6,z,1.4,1.2,0.8,th.trim);add('g',x,y+1.25,z+0.35,1.0,0.5,0.05,gcol(0));});
      for(const sd of [-1,1])add('wy',sd*(hw-0.5),y+5.2,A.cz,0.35,A.d-1,0.35,dim(th.wall,0.7),0,Math.PI/2);}
    if(s==='forge'){const rz=A.cz-2,rw=4;const brx=[-hw/2,hw/2];d.haz.push({kind:'lava',x0:A.x0,x1:A.x1,z0:rz-rw/2,z1:rz+rw/2,safe:brx.map(x=>({x0:x-2.2,x1:x+2.2})),dps:0.08});
      d.lava.push({x0:A.x0,x1:A.x1,z0:rz-rw/2,z1:rz+rw/2,y:y+0.06,g:A.g});add('w',A.cx,y+0.12,rz-rw/2-0.2,A.w,0.25,0.4,th.trim);add('w',A.cx,y+0.12,rz+rw/2+0.2,A.w,0.25,0.4,th.trim);
      for(const bx of brx){add('w',bx,y+0.22,rz,4.2,0.45,rw+1.2,th.trim);for(const s2 of [-1,1])add('w',bx+s2*2.05,y+0.6,rz,0.2,0.5,rw+1,th.acc);}
      add('w',0,y+0.22,rz,7,0.45,rw+1.2,th.trim);brx.push(0);d.haz[d.haz.length-1].safe.push({x0:-3.6,x1:3.6});
      for(let x=A.x0+4;x<A.x1;x+=9)light(x,y+1.5,rz,th.light[0],1.4,13);
      scatter(4,2,(x,z)=>{add('w',x,y+1.3,z,3,2.6,2.4,dim(th.wall,0.7));add('g',x,y+1.0,z+1.22,1.4,0.9,0.04,th.glow[1]);add('wc',x,y+3.4,z,0.8,1.6,0.8,th.trim);colB(x-1.5,z-1.2,x+1.5,z+1.2,y);light(x,y+1.5,z+2,th.glow[0],1.3,12);});
      scatter(4,0.8,(x,z)=>{add('w',x,y+0.5,z,1.4,1,0.6,0x2a2a2e);add('w',x,y+1.05,z,1.8,0.25,0.7,0x3a3a40);colC(x,z,0.8);});
      for(let q=0;q<6;q++){const x=rr(A.x0+3,A.x1-3),z=rr(A.z0+3,A.z1-3);add('w',x,y+wh-3,z,0.12,6,0.12,0x2a2420);}
      const fx=A.x0+0.6,fz=A.cz+hd*0.5;add('g',fx,y+wh/2,fz,0.2,wh,3,th.glow[0]);d.lava.push({x0:fx,x1:fx+3,z0:fz-1.5,z1:fz+1.5,y:y+0.08,g:A.g});light(fx+2,y+2,fz,th.glow[0],1.8,16);}
    if(s==='archive'){for(const xs of [-1,1])for(const k of [0.36,0.72]){const x=A.cx+xs*hw*k;if(Math.abs(x)<6)continue;const zs0=A.z0+5,zs1=A.z1-5;
        for(let z=zs0;z<zs1;z+=8){const z1=Math.min(z+6,zs1);if(blocked(x,(z+z1)/2,0.3)&&A.wingA&&Math.abs((z+z1)/2-A.cz)<6)continue;if(opens.some(o=>o.ax==='z'&&Math.abs((z+z1)/2-o.c)<o.w/2+4))continue;
          add('w',x,y+2.4,(z+z1)/2,1.4,4.8,z1-z,dim(th.trim,1.3));for(let r=0;r<3;r++)add('g',x+xs*0.72,y+0.9+r*1.4,(z+z1)/2,0.04,0.5,z1-z-0.6,dim(gcol(r),0.55));colB(x-0.7,z,x+0.7,z1,y);
          for(let q=0;q<3;q++)add('gc',x+rr(-0.5,0.5),y+4.8-0.5,z+rr(0.5,z1-z-0.5),0.12,1.0,0.12,th.glow[1],0,Math.PI);}}
      scatter(3,1,(x,z)=>crystal(x,z,true));}
    if(s==='frozen'){scatter(4,1.5,(x,z)=>{add('g',x,y+0.04,z,5,0.05,5,dim(th.glow[0],0.45));d.haz.push({kind:'frost',x0:x-2.5,x1:x+2.5,z0:z-2.5,z1:z+2.5,every:1.2,nx:0});});
      scatter(6,1.2,(x,z)=>{const h=rr(3,6);add('gi',x,y+h/2,z,rr(0.8,1.3),h/2,rr(0.8,1.3),dim(th.glow[0],0.85),rr(0,3));colC(x,z,1);light(x,y+2,z,th.glow[0],1,10);});
      scatter(3,1,(x,z)=>{add('w',x,y+0.9,z,0.8,1.8,0.5,dim(th.wall,0.9));add('w',x,y+2.1,z,0.5,0.6,0.5,dim(th.wall,0.9));colC(x,z,0.7);});}
    if(s==='flooded'){d.water.push({x0:A.x0+1.5,x1:A.x1-1.5,z0:A.z0+1.5,z1:A.z1-1.5,y});scatter(6,1,(x,z,k)=>{if(D.id==='choir')crystal(x,z,k%2===0);else{add('wy',x,y+1.5,z,0.6,3,0.6,th.trim);add('g',x,y+3.05,z,0.9,0.1,0.9,gcol(0));}});
      if(D.id==='vault'){for(const sd of [-1,1])add('wy',sd*(hw-1),y+1.2,A.cz,0.7,A.d-2,0.7,dim(th.wall,0.75),0,Math.PI/2);for(let z=A.z0+5;z<A.z1-4;z+=8)light(0,y+3,z,th.water,1.2,14);}}
    if(s==='outdoor'){scatter(10,1.2,(x,z)=>{const sc=rr(0.8,2);add('r',x,y+sc*0.25,z,sc,sc*0.7,sc,dim(th.wall,0.8),rr(0,6));if(sc>1.4)colC(x,z,sc*0.7);});
      scatter(4,1,(x,z)=>{const h=rr(2,7);add('w',x,y+h/2,z,1.6,h,1.6,th.trim);colC(x,z,1.1);if(h<4)add('g',x,y+h+0.4,z,0.6,0.8,0.6,th.glow[0]);});
      if(th.lava)scatter(3,1.5,(x,z)=>{d.haz.push({kind:'lava',x0:x-1.8,x1:x+1.8,z0:z-1.8,z1:z+1.8,dps:0.08});d.lava.push({x0:x-1.8,x1:x+1.8,z0:z-1.8,z1:z+1.8,y:y+0.06,g:A.g});light(x,y+1,z,th.light[0],1.2,10);});}
    if(isArena){// boss arena: low walls with stepped tiers behind, corner pillars, a glowing emblem and braziers
      for(const sd of ['xp','xm','zm']){if(sd==='zm'&&!A.final&&A.open.zm.length===0)continue;for(let k=0;k<3;k++){const off=1.5+k*2.4,hh=3.4+k*2.1;
        if(sd==='xp'||sd==='xm'){const sg=sd==='xp'?1:-1;const segs=[];let cur=A.z0-1;for(const [c,w] of A.open[sd].slice().sort((p,q)=>p[0]-q[0])){segs.push([cur,c-w/2-1]);cur=c+w/2+1;}segs.push([cur,A.z1+1]);
          for(const [p,q] of segs)if(q>p)add('w',A.cx+sg*(hw+off+1),y+hh/2-0.5,(p+q)/2,2.4,hh+1,q-p,dim(th.wall,0.9-k*0.08));}
        else{const segs=A.open.zm.length?[[A.x0-1,-5],[5,A.x1+1]]:[[A.x0-1,A.x1+1]];for(const [p,q] of segs)add('w',(p+q)/2,y+hh/2-0.5,A.z0-off-1,q-p,hh+1,2.4,dim(th.wall,0.9-k*0.08));}}}
      for(const sx of [-1,1])for(const sz of [-1,1]){const px=A.cx+sx*(hw-3.2),pz=A.cz+sz*(hd-3.2);pillar(px,pz,7,0.9);add('g',px,y+7.3,pz,1.4,0.4,1.4,th.acc);light(px,y+7,pz,th.light[(sx+sz+2)%3],1.4,18);}
      const R=Math.min(hw,hd)*0.42;for(let q=0;q<28;q++){const a=q/28*6.283;add('g',A.cx+Math.cos(a)*R,y+0.03,A.cz+Math.sin(a)*R,0.5,0.03,0.25,dim(th.glow[1],0.8),-a);}
      add('g',A.cx,y+0.02,A.cz,A.w*0.55,0.02,0.15,dim(th.glow[1],0.7));add('g',A.cx,y+0.02,A.cz,0.15,0.02,A.d*0.55,dim(th.glow[1],0.7));
      if(!lowG){const bm=new THREE.Mesh(DGEO.cyl,dglow(true).clone());bm.material.color.set(th.shaft);bm.material.opacity=0.07;bm.scale.set(R*0.9,30,R*0.9);bm.position.set(A.cx,y+15,A.cz);A.g.add(bm);d.shafts.push(bm);}
      light(A.cx,y+8,A.cz,th.light[1],1.2,30);}
    // theme wall dressing for every room
    if(!isArena&&A.kind!=='wing'||A.kind==='wing'){const step=D.id==='mine'?7:8;for(const sd of ['xp','xm']){const sg=sd==='xp'?1:-1;if(sd===vSide)continue;for(let z=A.z0+3;z<A.z1-2;z+=step){if(opens.some(o=>o.ax==='z'&&Math.abs(z-o.c)<o.w/2+1.4))continue;if(A.bal&&(A.spec.bal===sg))continue;const wx=A.cx+sg*(hw-0.3);
      if(D.id==='mine'){add('w',wx,y+wh*0.42,z,0.55,wh*0.84,0.55,th.trim);add('w',wx-sg*0.5,y+wh*0.84,z,1.4,0.5,0.6,th.trim);add('g',wx-sg*0.7,y+2.6,z,0.3,0.4,0.3,th.glow[2]);if(((z/step)|0)%2===0)light(wx-sg*1.2,y+2.8,z,th.light[0],1.3,13);}
      else if(D.id==='vault'){add('g',wx,y+3.2,z,0.06,0.18,step*0.8,gcol(0));add('g',wx,y+wh-0.8,z,0.06,0.5,1.2,((z/step)|0)%3===0?th.glow[1]:th.glow[2]);if(((z/step)|0)%2===0)light(wx-sg*1.2,y+3.5,z,((z/step)|0)%4===0?th.light[1]:th.light[0],1.2,13);}
      else if(D.id==='bastion'){add('w',wx-sg*0.4,y+0.6,z,1.0,1.2,1.0,th.trim);add('gc',wx-sg*0.4,y+1.7,z,0.45,1.0,0.45,th.glow[1]);add('w',wx,y+wh*0.6,z+1.5,0.1,3.2,1.2,0x7a1e14);light(wx-sg*1.2,y+2.4,z,th.light[0],1.5,13);}
      else if(D.id==='choir'){add('gc',wx-sg*0.3,y+2.6,z,0.25,1.4,0.25,gcol(((z/step)|0)));add('w',wx-sg*0.25,y+1.9,z,0.5,0.15,0.5,th.trim);if(((z/step)|0)%2===0)light(wx-sg*1.2,y+3,z,gcol(((z/step)|0)),1.2,13);}
      else{add('g',wx,y+0.25,z,0.1,0.35,step*0.9,dim(th.glow[0],0.7));for(let q=0;q<3;q++)add('gc',wx-sg*0.2,y+wh-0.6,z+rr(-2.5,2.5),rr(0.12,0.3),rr(0.8,2),rr(0.12,0.3),th.glow[1],0,Math.PI);if(((z/step)|0)%2===0)light(wx-sg*1.2,y+3,z,th.light[(z|0)%3===0?0:1],1.2,13);}}}}
    // ceiling beams / lights for halls (high halls feel tall; camera cut-away keeps them out of the way)
    if((s==='hall'||s==='machine'||s==='flooded'||s==='archive')&&A.kind==='room')for(let z=A.z0+4;z<A.z1;z+=8){add('w',A.cx,y+wh-0.4,z,A.w,0.6,0.7,th.trim);if(D.id==='vault'||D.id==='stillvault')add('g',A.cx,y+wh-0.75,z,A.w*0.6,0.08,0.3,th.glow[D.id==='vault'?2:1]);}
    // outdoor vista: parapet side opens onto the sky
    if(vSide){const sg=vSide==='xp'?1:-1;const vx=A.cx+sg*(hw+30);const vm=new THREE.Mesh(new THREE.PlaneGeometry(A.d+50,60),new THREE.MeshBasicMaterial({map:dunVista(th),fog:false,depthWrite:false}));vm.position.set(vx,y+8,A.cz);vm.rotation.y=sg>0?-Math.PI/2:Math.PI/2;vm.renderOrder=-5;A.g.add(vm);
      for(let q=0;q<10;q++){const x=A.cx+sg*(hw+rr(4,24)),z=A.cz+rr(-hd-8,hd+8);const sc=rr(2,7);add('r',x,y-rr(4,14),z,sc,sc*rr(1,3),sc,dim(th.wall,0.65),rr(0,6));}
      add('w',A.cx+sg*(hw+3),y-6,A.cz,4,12,A.d+2,dim(th.wall,0.7));
      if(!lowG)for(let q=0;q<4;q++){const bm=new THREE.Mesh(DGEO.cyl,dglow(true).clone());bm.material.color.set(th.shaft);bm.material.opacity=0.1;bm.scale.set(1.6,26,1.6);bm.position.set(A.cx+sg*rr(2,hw-4),y+9,A.cz+rr(-hd+4,hd-4));bm.rotation.z=-sg*0.5;bm.rotation.x=rr(-0.15,0.15);A.g.add(bm);d.shafts.push(bm);}
      light(A.cx+sg*(hw-4),y+6,A.cz,th.shaft,1.6,30);A.outdoor=true;d.shots.push({x:A.cx-sg*4,z:A.cz+4,yaw:sg*1.2,pitch:0.32,dist:10});}
    else if(A.spec&&A.spec.outdoor===0&&!lowG){for(let q=0;q<5;q++){const bm=new THREE.Mesh(DGEO.cyl,dglow(true).clone());bm.material.color.set(th.shaft);bm.material.opacity=0.1;bm.scale.set(1.4,24,1.4);bm.position.set(rr(-hw+4,hw-4),y+11,A.cz+rr(-hd+4,hd-4));bm.rotation.z=0.25;A.g.add(bm);d.shafts.push(bm);}}
    if(A.kind==='room'&&A.isNew&&!pit&&!vSide)d.shots.push({x:A.cx+4,z:A.z1-3,yaw:0.4,pitch:0.55,dist:13});
  }
  /* ---- wings: contents + doors; shortcut; entry ---- */
  for(const W of areas.filter(a=>a.kind==='wing')){A=W.parent;const sd=W.side,P0=W.parent;const side=sd>0?'xp':'xm';
    if(W.wk==='loot'){const dr=door('wing'+W.id,P0,side,P0.cz,5,'lever');lever(P0.cx-sd*(P0.w/2-1.4),P0.cz-P0.d/4,P0.y,[dr.id],'Opens the '+W.nm,P0);A=W;chest(W.cx+sd*(W.w/2-2.2),W.cz,W.y,'loot',W);}
    else if(W.wk==='secret'){const dr=door('secret'+W.id,P0,side,P0.cz,5,'secret');d.secrets.push({x:dr.x,z:dr.z,door:dr.id,found:false,area:W});A=W;chest(W.cx+sd*(W.w/2-2.2),W.cz,W.y,'secret',W);light(W.cx,W.y+3,W.cz,0xff9ae8,1.2,14);}
    else{A=W;W.elite=true;}}
  if(L.sc){const {E,K}=L.sc;A=K;const a=door('scA',K,'xp',L.sc.zk,5,'sc');A=E;const b=door('scB',E,'xp',L.sc.ze,5,'sc');lever(K.x1-1.4,L.sc.zk+4.5,K.y,['scA','scB'],'Opens the shortcut to the entrance',K);d.sc=L.sc;d.scOpen=false;}
  const E=rooms[0];A=E;d.entry={x:0,z:E.cz-2};addPortal(d,0,E.cz+E.d/2-2.5,'Exit to the Reach');
  {const ring=new THREE.Mesh(new THREE.RingGeometry(1.4,1.8,28),new THREE.MeshBasicMaterial({color:0x6dff8a,transparent:true,opacity:0.55,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(0,0.04,E.cz-2);G.add(ring);d.checkpoint=ring;}
  /* ---- instanced meshes per area ---- */
  const m4=new THREE.Matrix4(),q4=new THREE.Quaternion(),e4=new THREE.Euler(),v1=new THREE.Vector3(),v2=new THREE.Vector3(),c4=new THREE.Color();
  const KG={w:'box',f:'box',g:'box',gc:'cone',wc:'cone',wy:'cyl',gy:'cyl',r:'rock',gi:'ico',wi:'ico'};
  for(const a of areas){let maxR=Math.hypot(a.w,a.d)/2+14;for(const k in a.inst){const list=a.inst[k];if(!list.length)continue;const glow=k[0]==='g';const kind=k==='f'?'floor':'wall';
      const mat=glow?dglow(false):dmat(th,kind,gl.tex);const im=new THREE.InstancedMesh(DGEO[KG[k]],mat,list.length);
      list.forEach((b,i)=>{e4.set(b[8],b[7],b[9],'YXZ');q4.setFromEuler(e4);v1.set(b[0],b[1],b[2]);v2.set(b[3],b[4],b[5]);m4.compose(v1,q4,v2);im.setMatrixAt(i,m4);im.setColorAt(i,c4.set(b[6]));});
      im.frustumCulled=false;a.g.add(im);if(!glow)ENV.list.push({m:im,g0:im.geometry,m0:dmat(th,kind,false),g1:im.geometry,m1:dmat(th,kind,true),tmp:true});}
    a.sphere=new THREE.Sphere(new THREE.Vector3(a.cx,a.y+3,a.cz),maxR+(a.outdoor?40:0));}
  for(const e of ENV.list)if(e.tmp&&e.m0&&e.m0.userData&&e.m0.userData.u)envApplyOne(e);
  boxes.push(...d.boxesAdd);
  /* ---- lava + water surfaces ---- */
  if(d.lava.length){const lm=dunLavaMat(th);for(const l of d.lava){const m=new THREE.Mesh(DGEO.box,lm);m.scale.set(l.x1-l.x0,0.1,l.z1-l.z0);m.position.set((l.x0+l.x1)/2,l.y,(l.z0+l.z1)/2);l.g.add(m);}}
  if(d.water.length){const wm=new THREE.MeshLambertMaterial({color:th.water,transparent:true,opacity:0.62,emissive:new THREE.Color(th.water).multiplyScalar(0.25),depthWrite:false});
    for(const w of d.water){const m=new THREE.Mesh(DGEO.box,wm);m.scale.set(w.x1-w.x0,0.05,w.z1-w.z0);m.position.set((w.x0+w.x1)/2,w.y+0.32,(w.z0+w.z1)/2);m.renderOrder=2;const ar=areas.find(a=>w.x0>=a.x0-1&&w.x1<=a.x1+1&&w.z0>=a.z0-1&&w.z1<=a.z1+1)||A;ar.g.add(m);w.m=m;}}
  /* ---- lights: brighter hemisphere + key light, a light pool that follows the nearest sources, a fill light on the player ---- */
  G.add(new THREE.HemisphereLight(th.hemi[0],th.hemi[1],th.hemi[2]));const dl=new THREE.DirectionalLight(0xffffff,th.dir);dl.position.set(20,40,10);G.add(dl);
  d.plight=new THREE.PointLight(dim(th.light[0],0.9)|0x202020,1.0,24,1.4);G.add(d.plight);
  const nL=lowG?2:GFXC.lvl==='high'?6:4;d.pool=[];for(let i=0;i<nL;i++){const pl=new THREE.PointLight(0xffffff,0,16,1.5);G.add(pl);d.pool.push(pl);}
  d.lightAcc=9;
  /* ---- ambient particles ---- */
  const pn=lowG?90:(GFXC.lvl==='high'?420:220);if(pn){const pg=new THREE.BufferGeometry(),pp=new Float32Array(pn*3);for(let i=0;i<pn;i++){pp[i*3]=rand(-26,26);pp[i*3+1]=rand(-2,12);pp[i*3+2]=rand(-26,26);}pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
    const pm=new THREE.PointsMaterial({size:th.part.size,map:radialTex([[0,'rgba(255,255,255,1)'],[1,'rgba(255,255,255,0)']]),transparent:true,opacity:0.8,depthWrite:false,color:th.part.col,blending:th.part.add?THREE.AdditiveBlending:THREE.NormalBlending});
    const pts=new THREE.Points(pg,pm);pts.frustumCulled=false;G.add(pts);d.parts={pts,pp,seed:Array.from({length:pn},()=>Math.random()*6.28)};}
  /* ---- mobs ---- */
  const pool=[];for(const r of D.rooms)for(const pk of (r.packs||[]))for(const [t,lv] of pk)pool.push([t,lv]);const maxLv=pool.reduce((m,p)=>Math.max(m,p[1]),0)||D.lvl[1];
  const lvNear=i=>{for(let k=i;k>=0;k--)if(rooms[k].packs&&rooms[k].packs.length)return Math.round(rooms[k].packs.flat().reduce((s,p)=>s+p[1],0)/rooms[k].packs.flat().length);for(const r of rooms)if(r.packs&&r.packs.length)return r.packs[0][0][1];return D.lvl[0];};
  const spotOK=(x,z)=>{if(!areas.some(a=>!a.hidden&&x>a.x0+0.8&&x<a.x1-0.8&&z>a.z0+0.8&&z<a.z1-0.8))return false;for(const p of d.pits)if(x>p.x0-1&&x<p.x1+1&&z>p.z0-1&&z<p.z1+1)return false;
    for(const b of d.boxesAdd)if(x>b.x0-1&&x<b.x1+1&&z>b.z0-1&&z<b.z1+1)return false;for(const c of circles)if(Math.hypot(x-c.x,z-c.z)<c.r+0.8)return false;return true;};
  const spot=(x,z)=>{if(spotOK(x,z))return [x,z];for(let r=1;r<14;r+=1)for(let k=0;k<12;k++){const a=k/12*6.283;const xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r;if(spotOK(xx,zz))return [xx,zz];}return [x,z];};
  let packN=0;const spawnPack=(pk,cx,cz,onBal)=>{packN++;pk.forEach(([t,lv],k)=>{const a=k/pk.length*6.28;const p=onBal?[cx+Math.cos(a)*1.0,cz+Math.sin(a)*2.4]:spot(cx+Math.cos(a)*2.6,cz+Math.sin(a)*2.6);const e=spawnDunMob(t,p[0],p[1],lv,{pack:'p'+packN});e.pos.y=heightAt(p[0],p[1]);});};
  const raid=!!D.raid;
  rooms.forEach((r,i)=>{const hw=r.w/2,hd=r.d/2;
    if(r.packs&&!r.boss){r.packs.forEach((pk,j,arr)=>{if(j===1&&r.bal){spawnPack(pk,r.bal.mx,r.bal.mz,true);return;}const px=arr.length>1?(j?1:-1)*r.w/4:0,pz=r.cz+(arr.length>1?(j?-1:1)*r.d/6:0);spawnPack(pk,px,pz);});}
    if(r.isNew&&r.spec.pk){const lv=lvNear(i);for(let k=0;k<r.spec.pk;k++){const n=raid?4:3;const pk=[];for(let q=0;q<n;q++){const p=pick(pool);pk.push([p[0],Math.min(maxLv,Math.max(D.lvl[0],lv+randi(-1,0)))]);}
      let px=(k%2?1:-1)*r.w/5,pz=r.cz-(k?r.d/6:0);if(r.s==='chasm')pz=r.z0+5;if(r.s==='shaft'&&k===0&&r.ledge){spawnPack(pk.slice(0,2),(r.ledge.x0+r.ledge.x1)/2,(r.ledge.z0+r.ledge.z1)/2+2,true);continue;}spawnPack(pk,px,pz);}}
    if(r.boss){const B=BOSSES[r.boss];const e=spawnDunMob(B.etype,0,r.cz-hd*0.2,B.lvl,{boss:r.boss});e.boss={key:r.boss,def:B,room:r,final:!!r.final,engaged:false,done:{},next:{},enraged:false,baseT:e.T,baseDmg:e.dmg};e.leash=Math.max(r.w,r.d)*(balOn()?1.3:0.8);e.wr=0;d.bosses.push(e);}});
  for(const W of areas.filter(a=>a.kind==='wing')){const lv=lvNear(W.parent.i);
    if(W.wk==='elite'){const types=[...new Set(pool.map(p=>p[0]))].sort((a,b)=>(ETYPES[b].hp||0)-(ETYPES[a].hp||0));const p=spot(W.cx,W.cz);const e=spawnDunMob(types[0],p[0],p[1],maxLv,{pack:'elite'+W.id});
      e.eliteD=true;e.elite=true;e.maxHp=e.hp=Math.round(e.maxHp*3.2);e.dmg*=1.35;e.T.name=e.T.name+' Champion';e.T.scale=(e.T.scale||1)*1.3;e.T.xp=(e.T.xp||1)*3;W.champ=e;light(W.cx,W.y+3,W.cz,0xffd34a,1.2,14);
      if(raid){const p2=spot(W.cx+2,W.cz+2);spawnDunMob(types[1]||types[0],p2[0],p2[1],lv,{pack:'elite'+W.id});}}
    else if(W.wk==='loot'){const pk=[pick(pool),pick(pool)].map(p=>[p[0],Math.min(maxLv,lv)]);spawnPack(pk,W.cx-W.side*2,W.cz);}}
  d.lvMid=Math.round(pool.reduce((s,p)=>s+p[1],0)/Math.max(1,pool.length))||D.lvl[0];
  d.rects=areas.map(a=>[a.x0,a.z0,a.w,a.d]);
  d.hAt=(x,z)=>dunH(d,x,z);d.shots=d.shots.slice(0,5);
}
/* vista + lava textures */
const DVISTA={};
function dunVista(th){const k=th.sky.join(',');if(DVISTA[k])return DVISTA[k];const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,256);const a=new THREE.Color(th.sky[0]),b=new THREE.Color(th.sky[1]);gr.addColorStop(0,'#'+a.getHexString());gr.addColorStop(0.62,'#'+b.getHexString());gr.addColorStop(1,'#'+b.clone().multiplyScalar(0.7).getHexString());g.fillStyle=gr;g.fillRect(0,0,512,256);
  const R=mulberry32(77);const sil=(base,amp,col,step)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,256);let y=base;for(let x=0;x<=512;x+=step){y=base-amp*(0.5+0.5*Math.sin(x*0.02+R()*2))-R()*amp*0.6;g.lineTo(x,y);}g.lineTo(512,256);g.fill();};
  const dk=a.clone().lerp(new THREE.Color(0x000000),0.55);sil(150,46,'#'+dk.getHexString(),16);sil(190,30,'#'+dk.clone().multiplyScalar(0.7).getHexString(),10);
  if(th.lava){const lg=g.createLinearGradient(0,200,0,256);lg.addColorStop(0,'rgba(255,120,40,0)');lg.addColorStop(1,'rgba(255,120,40,0.85)');g.fillStyle=lg;g.fillRect(0,200,512,56);}
  g.fillStyle='rgba(255,255,255,0.5)';for(let i=0;i<40;i++){g.fillRect(R()*512,R()*110,1.5,1.5);}
  const t=new THREE.CanvasTexture(c);return DVISTA[k]=t;}
let DLAVA=null;
function dunLavaMat(th){if(DLAVA)return DLAVA;const t=dtexMake(128,(u,v)=>{const n=pfbm(u*4,v*4,4,4,61);const w=worley(u*WC,v*WC);const e=smooth(0,0.25,w[1]-w[0]);return [0.95,0.32+0.45*n*(1-e*0.6),0.05+0.1*n];});
  DLAVA=new THREE.MeshBasicMaterial({map:t,color:0xffffff});return DLAVA;}
/* walkable height inside a dungeon */
function dunH(d,x,z){for(const o of d.hOver)if(x>=o.x0&&x<=o.x1&&z>=o.z0&&z<=o.z1)return o.f?o.f(x,z):o.y;
  for(const a of d.areas)if(x>=a.x0-0.5&&x<=a.x1+0.5&&z>=a.z0-0.5&&z<=a.z1+0.5&&a.kind==='conn'&&a.h)return a.h(clamp(x,a.x0,a.x1),clamp(z,a.z0,a.z1));
  for(const a of d.areas)if(x>=a.x0-1&&x<=a.x1+1&&z>=a.z0-1&&z<=a.z1+1)return a.y;return 0;}
/* ---------- runtime ---------- */
const dFr=new THREE.Frustum(),dM4=new THREE.Matrix4();
function inR(p,r,pad){pad=pad||0;return p.x>=r.x0-pad&&p.x<=r.x1+pad&&p.z>=r.z0-pad&&p.z<=r.z1+pad;}
function dunHazDmg(k){return Math.max(4,Math.round(S.maxHp*k));}
function updDun2(dt){const d=DUN;if(!d||!d.areas)return;const th=d.th;const p=P.pos;
  DU.uPl.value.set(p.x,p.y,p.z);DU.uCam.value.copy(camera.position);DU.uTime.value=T;
  // area culling (distance + frustum)
  const cd=GFXC.lvl==='low'?80:GFXC.lvl==='high'?125:100;dFr.setFromProjectionMatrix(dM4.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  let vis=0;for(const a of d.areas){const dd=Math.hypot(a.cx-p.x,a.cz-p.z)-a.sphere.radius;a.g.visible=dd<cd&&dFr.intersectsSphere(a.sphere);if(a.g.visible)vis++;}d.visAreas=vis;
  // exploration + light pool
  d.lightAcc+=dt;if(d.lightAcc>0.25){d.lightAcc=0;for(const a of d.areas)if(!a.seen&&inR(p,a,1)){a.seen=true;if(a.kind==='room'&&a.isNew&&!a.boss)toast('📍 '+a.nm);}
    const L=d.lightSrc.map(s=>({s,k:Math.hypot(s.x-p.x,s.z-p.z)+Math.abs(s.y-p.y)*0.5})).filter(o=>o.k<44).sort((a,b)=>a.k-b.k);
    d.pool.forEach((pl,i)=>{const o=L[i];if(!o){pl.intensity=0;return;}pl.position.set(o.s.x,o.s.y,o.s.z);pl.color.set(o.s.col);pl.distance=o.s.dist*1.2;pl.intensity=o.s.int;});}
  // particles drift around the player
  if(d.parts){const pp=d.parts.pp,n=pp.length/3,pa=th.part;for(let i=0;i<n;i++){let x=pp[i*3],y=pp[i*3+1],z=pp[i*3+2];const sd=d.parts.seed[i];
      y+=pa.vy*dt*(0.6+0.4*Math.sin(sd));x+=Math.sin(T*0.3+sd)*pa.drift*dt;z+=Math.cos(T*0.27+sd*1.3)*pa.drift*dt;
      if(y>p.y+12)y=p.y-1;if(y<p.y-2)y=p.y+11;if(x<p.x-26)x+=52;if(x>p.x+26)x-=52;if(z<p.z-26)z+=52;if(z>p.z+26)z-=52;pp[i*3]=x;pp[i*3+1]=y;pp[i*3+2]=z;}
    d.parts.pts.geometry.attributes.position.needsUpdate=true;}
  if(DLAVA&&DLAVA.map){DLAVA.map.offset.x+=dt*0.025;DLAVA.map.offset.y+=dt*0.012;}
  for(const s of d.spin)s.m.rotation[s.ax]+=s.v*dt;for(const q of d.pist)q.m.position.y=q.y+Math.max(0,Math.sin(T*2+q.ph))*1.2;
  for(const s of d.shafts)s.material.opacity=(s.material.userData.o0||(s.material.userData.o0=s.material.opacity))*(0.8+0.2*Math.sin(T*0.7+s.position.x));
  if(P.dead)return;
  // hazard floors
  for(const h of d.haz){let on=true;if(h.per){const per=h.per[0]+h.per[1],t=(T+h.ph)%per;on=t<h.per[0];const warn=!on&&t>per-0.6;for(const m of h.mats){m.opacity=on?0.9:warn?(Math.sin(T*40)>0?0.7:0.1):0.08;}h.on=on;}
    if(!on||!inR(p,h)||Math.abs(p.y-heightAt(p.x,p.z))>0.3)continue;if(h.safe&&h.safe.some(s=>p.x>=s.x0&&p.x<=s.x1))continue;
    if(h.kind==='frost'){if(T>=(h.nx||0)){h.nx=T+h.every;addChill(1,null);}continue;}
    if(T>=(d.hazT||0)){d.hazT=T+0.45;dmgPlayer(dunHazDmg(h.dps*0.45/0.5),null,true);floatText(tmpV.set(p.x,p.y+2.6,p.z),h.kind==='lava'?'Burning!':'Laser grid!','info');}}
  // vents (telegraphed bursts when you are near)
  for(const v of d.vents){if(T<v.next)continue;if(Math.hypot(v.x-p.x,v.z-p.z)>12){continue;}v.next=T+v.every+rand(0,1.2);
    const nm=v.kind==='fire'?'Fire Vent':v.kind==='frost'?'Frost Vent':v.kind==='pulse'?'Resonance':'Gas Vent';telegraph(null,v.x,v.z,v.r,1.4,8+d.lvMid*2.6,nm);const t=d.tele[d.tele.length-1];
    if(t){const col={fire:0xff6a1a,frost:0x9fe8ff,pulse:0xc88bff,gas:0x8aff6a}[v.kind];t.edge.material.color.set(col);t.fill.material.color.set(col);if(v.kind==='frost')t.fx=tg=>{if(tg===P)addChill(2,null);};}}
  // pressure plates
  for(const q of d.plates){if(!q.armed){if(T>=q.re){q.armed=true;}continue;}if(Math.hypot(q.x-p.x,q.z-p.z)<0.95){q.armed=false;q.re=T+7;tone(1800,0.05,'square',0.03,-600);floatText(tmpV.set(p.x,p.y+2.4,p.z),'Click!','info');
      for(const ox of [-2.2,0,2.2])telegraph(null,ox,q.z,1.5,0.9,10+d.lvMid*2.4,'Trap');d.trapsSprung=(d.trapsSprung||0)+1;}}
  // timed gates
  for(const g of d.gates){const per=g.openT+g.closeT,t=(T+g.ph)%per;const open=t<g.openT;const dr=g.door;g.warn=open&&t>g.openT-0.7;
    dr.mm.material.color.set(g.warn&&Math.sin(T*30)>0?0xffffff:open?0x6dff8a:0xff4a2a);
    if(open!==dr.open){dr.open=open;const i=boxes.indexOf(dr.box);if(open){if(i>=0)boxes.splice(i,1);}else{if(i<0)boxes.push(dr.box);if(inR(p,dr.box,0.4)){dmgPlayer(dunHazDmg(0.06),null,true);floatText(tmpV.set(p.x,p.y+2.4,p.z),'Crushed!','info');collide(p,0.45);}}}}
  for(const id in d.doors){const dr=d.doors[id];const ty=dr.open?dr.y0-dr.hgt-0.05:dr.y0;dr.m.position.y+=(ty-dr.m.position.y)*Math.min(1,dt*(dr.kind==='gate'?9:3));dr.mm.position.y=dr.m.position.y+(dr.kind==='secret'?-1.2:0.2);dr.mm.visible=dr.kind==='gate'||!dr.open;}
  // collapsing bridges
  for(const k of d.planks){const on=!k.fallen&&p.x>=k.x0&&p.x<=k.x1&&p.z>=k.z0&&p.z<=k.z1;
    if(on){k.t+=dt;if(k.t>1.2&&!k.warned){k.warned=true;floatText(tmpV.set(p.x,p.y+2.4,p.z),'Creak…','info');}if(k.t>2.1){k.fallen=true;k.back=T+8;k.vy=0;tone(140,0.4,'sawtooth',0.04,-60);}}
    else if(!k.fallen){k.t=Math.max(0,k.t-dt*0.6);k.warned=k.t>1.2&&k.warned;}
    if(!k.fallen)k.m.position.set((k.t>1.2?Math.sin(T*50)*0.04:0),k.y-0.22,(k.z0+k.z1)/2);
    else{if(k.m.position.y>k.y-20){k.vy=(k.vy||0)+dt*18;k.m.position.y-=k.vy*dt;k.m.rotation.x+=dt*0.8;}if(T>=k.back){k.fallen=false;k.t=0;k.warned=false;k.m.rotation.x=0;k.m.position.y=k.y-0.22;}}
    if(k.fallen&&p.x>=k.x0&&p.x<=k.x1&&p.z>=k.z0&&p.z<=k.z1&&!P.dead){const A=k.area;const far=Math.abs(p.z-A.bridge.z1)<Math.abs(p.z-A.bridge.z0)?A.bridge.z1+1.6:A.bridge.z0-1.6;
      dmgPlayer(dunHazDmg(0.15),null,true);if(!P.dead){P.pos.set(0,0,far);P.pos.y=heightAt(0,far);ringFx(0,far,th.pit,2.5,0.6);banner('YOU FELL','The planks gave way · climbed back out');d.falls=(d.falls||0)+1;}}}
  // flooded floors slow you down
  d.wAcc=(d.wAcc||0)+dt;if(d.wAcc>0.3){d.wAcc=0;for(const w of d.water)if(inR(p,w)&&Math.abs(p.y-w.y)<0.5){applySlow(0.72,0.45,'Wading');break;}}
  for(const l of d.levers)if(l.used)l.h.rotation.z+=(-0.6-l.h.rotation.z)*Math.min(1,dt*6);
  for(const c of d.chests)if(c.opened)c.lid.rotation.x+=(-1.1-c.lid.rotation.x)*Math.min(1,dt*5);}
/* ---------- interaction: levers, secret walls, caches ---------- */
function dunFeatInteract(p){const d=DUN;if(!d||!d.areas)return null;
  for(const l of d.levers)if(!l.used&&Math.hypot(p.x-l.x,p.z-l.z)<2.6)return {k:'dfeat',t:'lever',o:l,label:'🔧 Pull the lever'};
  for(const s of d.secrets)if(!s.found&&Math.hypot(p.x-s.x,p.z-s.z)<3.2)return {k:'dfeat',t:'secret',o:s,label:'🔍 Search the cracked wall'};
  for(const c of d.chests)if(!c.opened&&Math.hypot(p.x-c.x,p.z-c.z)<2.6&&Math.abs((p.y||0)-c.y)<1.6)return {k:'dfeat',t:'chest',o:c,label:'📦 Open the cache'};
  if(d.sc&&!d.scOpen){const b=d.doors.scB;if(b&&Math.hypot(p.x-b.x,p.z-b.z)<3)return {k:'dfeat',t:'sealed',label:'🔒 Sealed · opens from the far side'};}
  return null;}
function dunOpenDoor(id){const d=DUN;const dr=d&&d.doors[id];if(!dr||dr.open)return false;dr.open=true;const i=boxes.indexOf(dr.box);if(i>=0)boxes.splice(i,1);nz(0.5,0.08,260);ringFx(dr.x,dr.z,d.th.acc,3,0.6);return true;}
function dunFeatDo(n){const d=DUN;if(!d||!n)return false;const o=n.o;
  if(n.t==='lever'){if(o.used)return false;o.used=true;for(const id of o.opens)dunOpenDoor(id);SFX.quest();
    if(o.opens.includes('scA')){d.scOpen=true;for(const a of d.areas)if(a.kind==='conn'&&a.t==='sc'){a.hidden=false;a.seen=true;}banner('SHORTCUT OPENED','A side passage now runs back to the entrance');log('🔧 Shortcut opened: a passage leads back to the <b>'+esc(d.D.name)+'</b> entrance.');}
    else{const w=d.areas.find(a=>a.kind==='wing'&&d.doors['wing'+a.id]&&o.opens.includes('wing'+a.id));toast('🔧 A gate grinds open'+(w?': '+w.nm:''));}return true;}
  if(n.t==='secret'){if(o.found)return false;o.found=true;dunOpenDoor(o.door);o.area.hidden=false;if(o.area.conn)o.area.conn.hidden=false;banner('SECRET FOUND',o.area.nm+' · something glints inside');SFX.level();d.secretsFound=(d.secretsFound||0)+1;return true;}
  if(n.t==='chest'){if(o.opened)return false;o.opened=true;dunChestLoot(o);return true;}
  if(n.t==='sealed'){warn('Sealed. A lever on the other side opens this shortcut');return true;}return false;}
function dunChestLoot(c){const d=DUN,lv=clamp(d.lvMid||d.D.lvl[0],1,MAXLVL);const items=[];
  if(c.kind==='secret'){let r=rollRarityL(lv,45);if(r<2)r=2;items.push(genItem(lv,null,r));const pool=Object.keys(UNIQUES).filter(k=>UNIQUES[k].d===d.id&&UNIQUES[k].kind!=='disk'&&!UNIQUES[k].relic);
    if(pool.length&&Math.random()<0.35){const it=makeUnique(pick(pool));it.dropBy='Hidden Vault';items.push(it);}const dk=genDiskForLevel(lv);if(dk&&Math.random()<0.5)items.push(dk);P.credits+=60*lv;}
  else{items.push(genItem(lv,null,rollRarityL(lv,25)));P.credits+=25*lv;}
  items.forEach((it,i)=>{const a=i/items.length*6.28+0.4;dropLoot(c.x+Math.cos(a)*1.5,c.z+Math.sin(a)*1.5,it);});SFX.coin();toast('📦 '+(c.kind==='secret'?'Hidden cache':'Supply cache')+' opened');d.chestsOpened=(d.chestsOpened||0)+1;return items;}
function dunEliteLoot(e){const lv=clamp(e.lv,1,MAXLVL);let r=rollRarityL(lv,40);if(r<2)r=2;const it=genItem(lv,null,r);it.dropBy=e.T.name;dropLoot(e.pos.x+1,e.pos.z,it);
  const pool=Object.keys(UNIQUES).filter(k=>UNIQUES[k].d===DUN.id&&UNIQUES[k].kind!=='disk'&&!UNIQUES[k].relic);if(pool.length&&Math.random()<0.2){const u=makeUnique(pick(pool));u.dropBy=e.T.name;dropLoot(e.pos.x-1,e.pos.z,u);}banner('CHAMPION DOWN',e.T.name);}
/* ---------- minimap + full dungeon map ---------- */
function dunMini2(c,tf,sc){const d=DUN;const quad=(x0,z0,x1,z1)=>{const a=tf(x0,z0),b=tf(x1,z0),e=tf(x1,z1),f=tf(x0,z1);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(e[0],e[1]);c.lineTo(f[0],f[1]);c.closePath();};
  for(const a of d.areas){if(a.hidden)continue;const low=a.y<-0.5;quad(a.x0,a.z0,a.x1,a.z1);c.fillStyle=a.seen?(low?'rgba(110,130,160,0.55)':'rgba(150,128,105,0.55)'):'rgba(120,100,90,0.13)';c.fill();c.strokeStyle=a.seen?'rgba(235,220,195,0.75)':'rgba(235,220,195,0.2)';c.lineWidth=a.seen?2:1;c.stroke();}
  for(const p of d.pits){quad(p.x0,p.z0,p.x1,p.z1);c.fillStyle='rgba(10,8,8,0.7)';c.fill();}
  for(const o of d.hOver){quad(o.x0,o.z0,o.x1,o.z1);c.fillStyle='rgba(210,190,150,0.35)';c.fill();}
  for(const id in d.doors){const dr=d.doors[id];if(dr.open||dr.kind==='secret')continue;const q=tf(dr.x,dr.z);c.fillStyle=dr.kind==='gate'?'#ff8a3a':'#ff4a3a';c.fillRect(q[0]-4,q[1]-4,8,8);}
  for(const l of d.levers)if(!l.used){const q=tf(l.x,l.z);c.fillStyle='#ffd34a';c.beginPath();c.arc(q[0],q[1],4.5,0,7);c.fill();}
  for(const ch of d.chests)if(!ch.opened&&!ch.area.hidden&&ch.area.seen){const q=tf(ch.x,ch.z);c.fillStyle='#ffc85a';c.strokeStyle='#000';c.lineWidth=1.5;c.fillRect(q[0]-5,q[1]-4,10,8);c.strokeRect(q[0]-5,q[1]-4,10,8);}
  for(const e of d.bosses){if(e.dead)continue;const q=tf(e.home.x,e.home.z);c.fillStyle='#ff3b2f';c.font='bold 13px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('☠',q[0],q[1]);}
  for(const q of d.portals){const p=tf(q.x,q.z);c.fillStyle='#6dff8a';c.beginPath();c.arc(p[0],p[1],6,0,7);c.fill();}
  for(const t of d.tele){const p=tf(t.x,t.z);c.strokeStyle='#ff3b2f';c.lineWidth=2;c.beginPath();c.arc(p[0],p[1],t.r*sc,0,7);c.stroke();}}
function dunMapStats(){const d=DUN;if(!d||!d.areas)return null;const vis=d.areas.filter(a=>!a.hidden);return {areas:d.areas.length,seen:d.areas.filter(a=>a.seen).length,rooms:d.rooms.length,secrets:d.secrets.length,secretsFound:d.secrets.filter(s=>s.found).length,
  caches:d.chests.length,cachesOpen:d.chests.filter(c=>c.opened).length,shortcut:d.sc?(d.scOpen?'open':'closed'):'none',area:Math.round(d.areas.reduce((s,a)=>s+a.w*a.d,0))};}
function openDunMap(){const d=DUN;if(!d||!d.areas)return;if(panelOpen)closePanel();const st=dunMapStats();
  openPanel('🗺 '+d.D.name.toUpperCase()+' · MAP',`<canvas id="dunMapC" width="1100" height="700" style="width:100%;max-height:62vh;background:#120c0a;border-radius:10px;display:block"></canvas>
    <div class="stats" style="margin-top:6px">Explored <b>${st.seen}/${st.areas}</b> areas · Caches <b>${st.cachesOpen}/${st.caches}</b> · Secrets <b>${st.secretsFound}/${st.secrets}</b> · Shortcut <b>${st.shortcut}</b> · <span style="opacity:.75">☠ boss · ■ cache · ● lever · ▬ gate · blue = lower level</span></div>`,'dmap');
  const cv=document.getElementById('dunMapC');if(!cv)return;const c=cv.getContext('2d');const vis=d.areas.filter(a=>!a.hidden);
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const a of vis){x0=Math.min(x0,a.x0);x1=Math.max(x1,a.x1);z0=Math.min(z0,a.z0);z1=Math.max(z1,a.z1);}
  // the spine runs along -z: draw it left -> right so the long dungeon fits the wide panel
  const W=cv.width,Hh=cv.height,pad=30;const s=Math.min((W-2*pad)/(z1-z0),(Hh-2*pad)/(x1-x0));const tf=(x,z)=>[pad+(z1-z)*s,Hh/2+(x-(x0+x1)/2)*s];
  const R=(a,b,e,f)=>{const p=tf(a,f),q=tf(b,e);return [p[0],Math.min(p[1],q[1]),q[0]-p[0],Math.abs(q[1]-p[1])];};
  for(const a of vis){const r=R(a.x0,a.x1,a.z0,a.z1);c.fillStyle=a.seen?(a.y<-0.5?'rgba(110,135,170,0.75)':'rgba(170,145,115,0.75)'):'rgba(120,100,90,0.2)';c.fillRect(...r);c.strokeStyle=a.seen?'#efe2c8':'rgba(239,226,200,0.25)';c.lineWidth=1.5;c.strokeRect(...r);
    if(a.kind!=='conn'){c.fillStyle=a.seen?'#fff':'rgba(255,255,255,0.35)';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText(a.seen?a.nm:'???',r[0]+r[2]/2,r[1]+14);}}
  for(const p of d.pits){const r=R(p.x0,p.x1,p.z0,p.z1);c.fillStyle='rgba(8,6,6,0.8)';c.fillRect(...r);}
  for(const o of d.hOver){const r=R(o.x0,o.x1,o.z0,o.z1);c.fillStyle='rgba(230,210,160,0.4)';c.fillRect(...r);}
  const dot=(x,z,col,t)=>{const q=tf(x,z);c.fillStyle=col;c.font='bold 16px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(t,q[0],q[1]);};
  for(const id in d.doors){const dr=d.doors[id];if(dr.open||dr.kind==='secret')continue;dot(dr.x,dr.z,dr.kind==='gate'?'#ff8a3a':'#ff4a3a','▬');}
  for(const l of d.levers)if(!l.used)dot(l.x,l.z,'#ffd34a','●');for(const ch of d.chests)if(!ch.opened&&!ch.area.hidden&&ch.area.seen)dot(ch.x,ch.z,'#ffc85a','■');
  for(const e of d.bosses)dot(e.home.x,e.home.z,e.dead?'#888':'#ff3b2f',e.dead?'✓':'☠');for(const q of d.portals)dot(q.x,q.z,'#6dff8a','◉');
  const q=tf(P.pos.x,P.pos.z);c.fillStyle='#5ff2ff';c.beginPath();c.arc(q[0],q[1],7,0,7);c.fill();c.strokeStyle='#000';c.lineWidth=2;c.stroke();d.mapDrawn=(d.mapDrawn||0)+1;}
function dunCleanup(d){if(!d||!d.areas)return;ENV.list=ENV.list.filter(e=>{let o=e.m;while(o){if(o===d.group)return false;o=o.parent;}return true;});for(const id in d.doors){const i=boxes.indexOf(d.doors[id].box);if(i>=0)boxes.splice(i,1);}}
function dunDExports(){return {get camera(){return camera;},get scene(){return scene;},get boxes(){return boxes;},get camOcc(){return camOcc;},DTHEME,DLAY,dunLayout,dunH,dunTheme,dunFeatInteract,dunFeatDo,dunOpenDoor,dunChestLoot,dunMapStats,openDunMap,updDun2,dtex,DU};}
