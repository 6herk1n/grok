/* ================= ENVIRONMENT PASS (Phase 1 look): smooth terrain, procedural textures, sky/sun, shadows, dust, graphics setting =================
   Gameplay heights are untouched: the terrain mesh is still exactly the heightAt() grid, only shading/texturing changes.
   Graphics: Low (plain smooth shading, no particles, 1x resolution) · Medium (textures, dust, ≤1.5x) · High (+ sun shadows, more dust, ≤2x).
   Stored per device in localStorage 'dustreach_gfx_v1' (not in the save). */
const GFX_KEY='dustreach_gfx_v1';
var GFXC={lvl:'medium',tr:325,pr:260,fps30:false};
const FPS30_KEY='dustreach_fps30_v1';
/* camera prefs (per device, not in the save): zoom distance + follow-behind camera (default ON on touch devices) */
const CAM_KEY='dustreach_cam_v1',CAM_MIN=4,CAM_MAX=18;
const CAMP=(()=>{let o=null;try{o=JSON.parse(localStorage.getItem(CAM_KEY)||'null');}catch(e){}const touch=(navigator.maxTouchPoints||0)>0||('ontouchstart' in window);
  return {dist:o&&typeof o.dist==='number'?Math.min(CAM_MAX,Math.max(CAM_MIN,o.dist)):9,follow:o&&typeof o.follow==='boolean'?o.follow:touch};})();
function camSave(){lsSet(CAM_KEY,JSON.stringify({dist:+CAMP.dist.toFixed(2),follow:CAMP.follow}));}
function setCamDist(d,store){CAMP.dist=Math.min(CAM_MAX,Math.max(CAM_MIN,d));camS.dist=CAMP.dist;if(store)camSave();}
function setCamFollow(on){CAMP.follow=!!on;camSave();}
const GFX_LV={low:{tr:250,pr:200,dust:0,shadow:false,tex:false,pr_max:1},medium:{tr:325,pr:260,dust:260,shadow:false,tex:true,pr_max:1.5},high:{tr:350,pr:280,dust:600,shadow:true,tex:true,pr_max:2}};
function gfxDefault(){let r='';try{const gl=renderer.getContext();const ex=gl.getExtension('WEBGL_debug_renderer_info');r=ex?String(gl.getParameter(ex.UNMASKED_RENDERER_WEBGL)):String(gl.getParameter(gl.RENDERER));}catch(e){}
  if(/swiftshader|llvmpipe|software|basic render/i.test(r))return 'low';
  const touch=navigator.maxTouchPoints>1;if(/iPad|iPhone|Android/i.test(navigator.userAgent)||(touch&&/Macintosh/.test(navigator.userAgent)))return 'medium';
  return touch?'medium':'high';}
/* ---------- procedural textures (tileable, canvas-generated) ---------- */
function pnoise(x,y,P,seed){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const h=(a,b)=>{a=((a%P)+P)%P;b=((b%P)+P)%P;const s=Math.sin(a*127.1+b*311.7+seed*74.7)*43758.5453;return s-Math.floor(s);};
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return lerp(lerp(h(xi,yi),h(xi+1,yi),u),lerp(h(xi,yi+1),h(xi+1,yi+1),u),v);}
function pfbm(x,y,P,o,seed){let s=0,a=1,n=0,f=1;for(let i=0;i<o;i++){s+=pnoise(x*f,y*f,P*f,seed+i)*a;n+=a;a*=0.5;f*=2;}return s/n;}
function texFrom(N,fn,repeat){const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');const id=g.createImageData(N,N);const d=id.data;const ch=[[],[],[],[]];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=fn(x,y);for(let k=0;k<4;k++)ch[k].push(v[k]);}
  // normalise each channel to mean 0.5 so the texture only modulates
  const mean=ch.map(a=>a.reduce((s,v)=>s+v,0)/a.length);
  for(let i=0;i<N*N;i++)for(let k=0;k<4;k++)d[i*4+k]=Math.round(clamp(ch[k][i]-mean[k]+0.5,0,1)*255);
  g.putImageData(id,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;t.premultiplyAlpha=false;return t;}
// worley crack distance (periodic, 10 cells)
const WC=10,WPTS=[];{const R=mulberry32(4242);for(let j=0;j<WC;j++)for(let i=0;i<WC;i++)WPTS.push([i+R(),j+R()]);}
function worley(x,y){let f1=9,f2=9;const ci=Math.floor(x),cj=Math.floor(y);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=ci+di,j=cj+dj;const p=WPTS[((j%WC+WC)%WC)*WC+((i%WC+WC)%WC)];const px=i+(p[0]-Math.floor(p[0])),py=j+(p[1]-Math.floor(p[1]));const d=Math.hypot(x-px,y-py);if(d<f1){f2=f1;f1=d;}else if(d<f2)f2=d;}return [f1,f2];}
const DETAIL_TEX=texFrom(256,(x,y)=>{const u=x/256,v=y/256;
  const warp=pfbm(u*4,v*4,4,3,1)*1.6;const rip=Math.pow(0.5+0.5*Math.sin((v*7+warp+u*1.0)*Math.PI*2),1.6)*0.8+pfbm(u*16,v*16,16,2,9)*0.2;// R: wind ripples
  let rk=0,a=0.6,f=4;for(let i=0;i<4;i++){rk+=(1-Math.abs(2*pnoise(u*f,v*f,f,20+i)-1))*a;a*=0.5;f*=2;}rk=rk/1.1;// G: ridged rock
  const w=worley(u*WC,v*WC);const crack=0.25+0.75*smooth(0.0,0.09,w[1]-w[0])-0.15*smooth(0.4,0.0,w[0])*0;// B: cracks / plates
  let gr=pfbm(u*32,v*32,32,2,40)*0.7;const pb=pnoise(u*48,v*48,48,77);if(pb>0.78)gr+=0.5;else if(pb<0.12)gr-=0.25;// A: grain + pebbles
  return [rip,rk,crack,gr];});
const PANEL_TEX=texFrom(256,(x,y)=>{const u=x/256,v=y/256;// 4 m tile: 2x2 panels with seams, rivets, streaks and grime
  let c=0.62+pfbm(u*8,v*8,8,3,55)*0.25-0.08;const px=(u*2)%1,py=(v*2)%1;const sx=Math.min(px,1-px),sy=Math.min(py,1-py);
  if(sx<0.012||sy<0.012)c*=0.55;else if(sx<0.03||sy<0.03)c*=0.9;
  if((Math.abs(px-0.06)<0.012||Math.abs(px-0.94)<0.012)&&(Math.abs(py%0.25-0.125)<0.012))c*=0.6;
  const st=pnoise(u*24,0.5,24,90);c*=1-Math.max(0,st-0.55)*0.6*(0.3+0.7*py);
  if(Math.abs(py-0.5)<0.07)c*=0.94;c+=(pnoise(u*64,v*64,64,93)-0.5)*0.06;return [c,c,c,1];});
/* ---------- terrain: smooth normals from the height grid, slope/biome-blended colours and texture weights ---------- */
const TW_B=[[1,0.05,0,0.3],[0.25,0.35,0.3,0.45],[0,0.6,0.35,0.6],[0.1,0.35,0.12,1],[0.15,0,0,0.9],[0.55,0.55,0.12,0.35],[0,0.05,0.7,0.25],[0.05,0.7,0.25,0.5],[0.5,0.2,0.7,0.2],[0.15,0.1,0.1,0.85],[0,0.65,0.4,0.55],[0.3,0.4,0.2,0.4],[0.05,0.45,0.2,0.7],[0,0.3,0.6,0.6],[0.85,0.1,0.1,0.25],[0,0.55,0.5,0.6]];
const ROCK_B=[0x8a5238,0x6f8a8c,0x1c1614,0x4a4642,0x6a5a40,0x8c3e28,0xa8a090,0x3e3852,0x6a7c90,0x3a4a3a,0x2a1a1c,0x4a6a5e,0x5a3a4a,0x3c404c,0xb8aa8c,0x241c2c];
const TER={matTex:null,matPlain:null,orig:null};
(function(){const nrm=new Float32Array(N1*N1*3),dcol=new Float32Array(N1*N1*3),tw=new Float32Array(N1*N1*4);const w=new Float32Array(NB);const rc=ROCK_B.map(c=>new THREE.Color(c));const c=new THREE.Color(),r=new THREE.Color();
  const H=(i,j)=>HG[clamp(j,0,SEG)*N1+clamp(i,0,SEG)];
  for(let j=0;j<N1;j++)for(let i=0;i<N1;i++){const g=j*N1+i;const nx=(H(i-1,j)-H(i+1,j))/(2*CELL),nz=(H(i,j-1)-H(i,j+1))/(2*CELL);const L=Math.hypot(nx,1,nz);
    nrm[g*3]=nx/L;nrm[g*3+1]=1/L;nrm[g*3+2]=nz/L;const slope=1-1/L;const x=i*CELL-HALF,z=j*CELL-HALF;bwCached(g,x,z,w);
    r.setRGB(0,0,0);const t=[0,0,0,0];for(let k=0;k<NB;k++){if(w[k]<0.001)continue;r.r+=rc[k].r*w[k];r.g+=rc[k].g*w[k];r.b+=rc[k].b*w[k];for(let q=0;q<4;q++)t[q]+=TW_B[k][q]*w[k];}
    const rs=smooth(0.12,0.42,slope);c.setRGB(TCOL[g*3],TCOL[g*3+1],TCOL[g*3+2]).lerp(r,rs*0.7);
    const town=Math.max(Math.abs(x),Math.abs(z))<34?1:0;if(town){t[0]=0.1;t[1]=0;t[2]=0.35;t[3]=0.7;}
    t[0]*=1-rs;t[1]=Math.min(1,t[1]+rs*1.1);
    dcol[g*3]=c.r;dcol[g*3+1]=c.g;dcol[g*3+2]=c.b;tw.set(t,g*4);}
  for(const m of TCH){const g=m.geometry;const n=CH_C+1;const cx=Math.round((m.userData.cx+HALF)/(CH_C*CELL)-0.5),cz=Math.round((m.userData.cz+HALF)/(CH_C*CELL)-0.5);
    const N=new Float32Array(n*n*3),C=new Float32Array(n*n*3),W=new Float32Array(n*n*4);
    for(let j=0;j<n;j++)for(let k=0;k<n;k++){const gi=(cz*CH_C+j)*N1+cx*CH_C+k,v=j*n+k;N.set(nrm.subarray(gi*3,gi*3+3),v*3);C.set(dcol.subarray(gi*3,gi*3+3),v*3);W.set(tw.subarray(gi*4,gi*4+4),v*4);}
    g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));g.setAttribute('tw',new THREE.BufferAttribute(W,4));}
  BWC=null;// Build M: release the game1 biome-weight cache
  TER.orig=TCH[0].material;
  TER.matPlain=new THREE.MeshLambertMaterial({vertexColors:true});
  TER.matTex=new THREE.MeshLambertMaterial({vertexColors:true});TER.matTex.userData.u={uDet:{value:DETAIL_TEX},uDetK:{value:1}};
  TER.matTex.onBeforeCompile=sh=>{Object.assign(sh.uniforms,TER.matTex.userData.u);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 tw;varying vec4 vTW;varying vec2 vXZ;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTW=tw;vXZ=position.xz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uDet;uniform float uDetK;varying vec4 vTW;varying vec2 vXZ;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec4 da=texture2D(uDet,vXZ*0.14);
        #ifdef DR_TER_HQ
        vec4 db=texture2D(uDet,vec2(vXZ.y,-vXZ.x)*0.037+vec2(0.37,0.11));vec4 dt=mix(da,db,0.4)-0.5;
        #else
        vec4 dt=(da-0.5)*0.72;
        #endif
        float dd=dot(dt*vec4(0.75,0.95,1.1,0.6),vTW);float mac=texture2D(uDet,vXZ*0.0045).g-0.5;
        diffuseColor.rgb*=clamp(1.0+(dd*1.25+mac*0.35)*uDetK,0.45,1.6);`);};
  TER.matTex.customProgramCacheKey=()=>'dr_terrain_v1';
  // High: second rotated detail layer (3 texture reads per pixel). Medium: 2 reads per pixel (cheaper on older iPads).
  TER.matTexHQ=new THREE.MeshLambertMaterial({vertexColors:true});TER.matTexHQ.userData.u=TER.matTex.userData.u;TER.matTexHQ.onBeforeCompile=TER.matTex.onBeforeCompile;TER.matTexHQ.defines={DR_TER_HQ:''};TER.matTexHQ.customProgramCacheKey=()=>'dr_terrain_hq_v1';})();
/* ---------- triplanar materials for buildings (panels) and rocks ---------- */
function triMat(kind,o){const m=new THREE.MeshLambertMaterial(Object.assign({color:0xffffff},o||{}));const tex=kind==='panel'?PANEL_TEX:DETAIL_TEX;m.userData.u={uTex:{value:tex},uK:{value:1}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,m.userData.u);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;').replace('#include <begin_vertex>',`#include <begin_vertex>
      #ifdef USE_INSTANCING
        mat4 tm=modelMatrix*instanceMatrix;
      #else
        mat4 tm=modelMatrix;
      #endif
      vWP=(tm*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(tm)*objectNormal);`);
    const samp=kind==='panel'?`vec3 an=abs(vWN);vec2 uv=(an.y>an.x&&an.y>an.z)?vWP.xz:((an.x>an.z)?vWP.zy:vWP.xy);vec3 tx=texture2D(uTex,uv*0.25).rgb;
        float gr=clamp(1.0-(vWP.y-floor(vWP.y/40.0)*40.0)*0.0,0.0,1.0);diffuseColor.rgb*=mix(vec3(1.0),tx*1.28,uK);`
      :`vec3 an=pow(abs(vWN),vec3(4.0));an/=(an.x+an.y+an.z);vec4 a=texture2D(uTex,vWP.zy*0.3),b=texture2D(uTex,vWP.xz*0.3),c=texture2D(uTex,vWP.xy*0.3);vec4 t=a*an.x+b*an.y+c*an.z;
        float r=(t.g-0.5)*1.1+(t.a-0.5)*0.6+(t.b-0.5)*0.35;diffuseColor.rgb*=clamp(1.0+r*uK,0.5,1.5);`;
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uTex;uniform float uK;varying vec3 vWP;varying vec3 vWN;').replace('#include <color_fragment>','#include <color_fragment>\n'+samp);};
  m.customProgramCacheKey=()=>'dr_tri_'+kind+(o&&o.flatShading?'_f':'');return m;}
// smooth rock + mesa geometries (replace faceted dodecahedra / 7-sided cylinders)
function rockGeo(seed,flat){const g=new THREE.SphereGeometry(1,8,5);const p=g.attributes.position;const v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=fbm(v.x*1.3+seed,v.z*1.3+v.y*0.9+seed*0.7);let s=0.78+n*0.5;v.multiplyScalar(s);if(v.y<-0.35)v.y=-0.35+(v.y+0.35)*0.25;v.y*=flat||1;p.setXYZ(i,v.x,v.y,v.z);}
  g.computeVertexNormals();return g;}
function mesaGeo(){const g=new THREE.CylinderGeometry(0.62,1,1,12,6);const p=g.attributes.position;const v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const a=Math.atan2(v.z,v.x);const band=Math.floor((v.y+0.5)*6)/6;const k=1+(fbm(Math.cos(a)*2+band*3,Math.sin(a)*2)-0.5)*0.45+(Math.sin(band*37.0)*0.06);if(Math.abs(v.x)+Math.abs(v.z)>0.01){v.x*=k;v.z*=k;}p.setXYZ(i,v.x,v.y,v.z);}
  g.computeVertexNormals();return g;}
const ENV={rock:rockGeo(3.1),rockFlat:rockGeo(7.7,0.55),mesa:mesaGeo(),list:[],dust:null,glow:null,shadowObjs:[]};
const ROCK_T={ashrock:'rock',rubble:'rockFlat',boulder:'rock',saltcrust:'rockFlat',spire:'mesa',saltpillar:'mesa'};
(function(){
  const rockM=triMat('rock'),panelM=triMat('panel',{flatShading:true});
  const swap=(m,geo,mat)=>{ENV.list.push({m,g0:m.geometry,m0:m.material,g1:geo||m.geometry,m1:mat});};
  scene.traverse(o=>{if(!o.isMesh)return;const u=o.userData||{};
    if(u.env==='rock')swap(o,ENV.rock,rockM);
    else if(u.env==='struct')swap(o,null,panelM);
    else if(u.type&&ROCK_T[u.type])swap(o,ENV[ROCK_T[u.type]],rockM);
    else if(u.type==='ruin')swap(o,null,panelM);
    else if(o.parent===scene&&o.geometry===geoBox&&o.material&&o.material.isMeshLambertMaterial)swap(o,null,triMatFor(o.material));});
  ENV.panelM=panelM;ENV.rockM=rockM;})();
var TRI_CACHE={};function triMatFor(m0){TRI_CACHE=TRI_CACHE||{};const k=m0.uuid;if(!TRI_CACHE[k]){TRI_CACHE[k]=triMat('panel',{color:m0.color.getHex(),flatShading:true});}return TRI_CACHE[k];}
function envTexGroup(G){if(!G)return;G.traverse(o=>{if(o.isInstancedMesh&&o.geometry===geoBox&&o.material.isMeshLambertMaterial){const e={m:o,g0:o.geometry,m0:o.material,g1:o.geometry,m1:ENV.panelM,tmp:true};ENV.list.push(e);envApplyOne(e);}});}
function envApplyOne(e){const on=GFX_LV[GFXC.lvl].tex;e.m.geometry=on?e.g1:e.g0;e.m.material=on?e.m1:e.m0;const sh=GFX_LV[GFXC.lvl].shadow;e.m.castShadow=sh;e.m.receiveShadow=sh;}
/* ---------- sun glow, dust ---------- */
function radialTex(stops){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);stops.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
(function(){const s1=window.__sky.children[0];ENV.sunDisc=s1;
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:radialTex([[0,'rgba(255,246,220,0.9)'],[0.25,'rgba(255,220,160,0.35)'],[1,'rgba(255,200,140,0)']]),transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));
  glow.scale.set(150,150,1);glow.position.z=-1;glow.renderOrder=-8;s1.add(glow);ENV.glow=glow;
  const N=600,g=new THREE.BufferGeometry(),pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=rand(-35,35);pos[i*3+1]=rand(0,14);pos[i*3+2]=rand(-35,35);}
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setDrawRange(0,0);
  const m=new THREE.Points(g,new THREE.PointsMaterial({size:0.22,map:radialTex([[0,'rgba(255,255,255,1)'],[1,'rgba(255,255,255,0)']]),transparent:true,opacity:0.45,depthWrite:false,color:0xf2dcb8}));
  m.frustumCulled=false;scene.add(m);ENV.dust=m;ENV.dustBase=pos.slice();scene.add(sun.target);})();
let envAcc=0;
function updEnv(dt){const lv=GFX_LV[GFXC.lvl];
  // sun disc follows the light direction
  const ang=(dayT-0.25)*6.283;const sx=Math.cos(ang)*120,sy=Math.max(20,Math.sin(ang)*140),sz=40;const L=Math.hypot(sx,sy,sz);
  if(ENV.sunDisc){ENV.sunDisc.position.set(sx/L*400,Math.sin(ang)*140/L*400,sz/L*400);ENV.sunDisc.lookAt(0,0,0);const I=dayInfo();ENV.sunDisc.visible=!DUN&&Math.sin(ang)>-0.05;ENV.glow.material.opacity=(0.35+0.65*I.day)*(1-WX.storm*0.8);}
  if(lv.shadow&&!DUN&&state==='play'){sun.target.position.set(P.pos.x,P.pos.y,P.pos.z);sun.position.set(P.pos.x+sx/L*110,P.pos.y+sy/L*110,P.pos.z+sz/L*110);}
  // dust motes drift with the wind around the camera
  const d=ENV.dust;const n=DUN?0:Math.round(lv.dust*(1+WX.storm*1.2));d.geometry.setDrawRange(0,Math.min(600,n));d.visible=n>0&&state==='play';
  if(d.visible){const p=d.geometry.attributes.position.array,b=ENV.dustBase;const wx=T*(1.6+WX.storm*7),wz=T*0.6;const cx=camera.position.x,cy=camera.position.y-6,cz=camera.position.z;
    for(let i=0;i<n;i++){const k=i*3;let x=b[k]+wx+Math.sin(T*0.7+i)*0.6,z=b[k+2]+wz;x=((x-cx+35)%70+70)%70-35+cx;z=((z-cz+35)%70+70)%70-35+cz;p[k]=x;p[k+1]=cy+b[k+1]+Math.sin(T*0.5+i*1.7)*0.4;p[k+2]=z;}
    d.geometry.attributes.position.needsUpdate=true;d.material.color.copy(scene.fog.color).lerp(new THREE.Color(1,1,1),0.45);d.material.opacity=0.32+WX.storm*0.35;d.material.size=0.2+WX.storm*0.15;}
  envAcc+=dt;if(envAcc>1.5){envAcc=0;if(PM&&PM.g)PM.g.traverse(o=>{if(o.isMesh)o.castShadow=lv.shadow;});}}
/* ---------- the setting ---------- */
function setGfx(lvl,quiet,nostore){if(!GFX_LV[lvl])lvl='medium';const L=GFX_LV[lvl];GFXC.lvl=lvl;GFXC.tr=L.tr;GFXC.pr=L.pr;if(!nostore)lsSet(GFX_KEY,lvl);
  for(const m of TCH){m.material=L.tex?(L.shadow?TER.matTexHQ:TER.matTex):TER.matPlain;m.receiveShadow=L.shadow;}
  ENV.list=ENV.list.filter(e=>!e.tmp||(e.m.parent));for(const e of ENV.list)envApplyOne(e);
  const was=renderer.shadowMap.enabled;renderer.shadowMap.enabled=L.shadow;renderer.shadowMap.type=THREE.PCFShadowMap;sun.castShadow=L.shadow;
  if(L.shadow){sun.shadow.mapSize.set(1024,1024);const c=sun.shadow.camera;c.left=-36;c.right=36;c.top=36;c.bottom=-36;c.near=10;c.far=260;c.updateProjectionMatrix();sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.35;if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
  if(was!==L.shadow)scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);}});
  const dpr=window.devicePixelRatio||1;pixelRatio=Math.min(dpr,L.pr_max);renderer.setPixelRatio(pixelRatio);onResize();cullAcc=1;
  if(!quiet)toast('🖥 Graphics: '+lvl[0].toUpperCase()+lvl.slice(1));return lvl;}
function gfxLoad(){let v=null;try{v=localStorage.getItem(GFX_KEY);}catch(e){}return GFX_LV[v]?v:gfxDefault();}
setGfx(gfxLoad(),true,true);
// battery saver: cap rendering at 30 fps (the main loop skips alternate frames)
function setFps30(on,nostore){GFXC.fps30=!!on;if(!nostore)lsSet(FPS30_KEY,on?'1':'0');}
try{setFps30(localStorage.getItem(FPS30_KEY)==='1',true);}catch(e){}
function gfxMenuHtml(){return `<div class="h4" style="margin-top:14px">🖥 Graphics</div><div class="tabs" style="margin:0">${['low','medium','high'].map(k=>`<button data-act="gfx" data-g="${k}" class="${GFXC.lvl===k?'on':''}">${k==='low'?'Low':k==='medium'?'Medium':'High'}</button>`).join('')}</div>
  <div style="opacity:.75;font-size:12px;margin-top:4px">Low: plain shading, 1x resolution, shortest view (older iPads). Medium: ground/building textures and drifting dust. High: adds sun shadows near you, more dust, sharper resolution and a longer view.</div>
  <div class="tabs" style="margin:8px 0 0;flex-wrap:wrap"><button data-act="fps30" class="${GFXC.fps30?'on':''}">🔋 Battery saver (30 fps): ${GFXC.fps30?'ON':'OFF'}</button><button data-act="camfollow" class="${CAMP.follow?'on':''}">🎥 Follow camera: ${CAMP.follow?'ON':'OFF'}</button></div>
  <div style="opacity:.75;font-size:12px;margin-top:4px">Follow camera swings in behind you while you run (not while you drag the view). Pinch the 3D view with two fingers to zoom.</div>`;}
function gfxExports(){return {CAMP,CAM_KEY,setCamDist,setCamFollow,setFps30,FPS30_KEY,uwpBeam,uwpRing,updUwp,GFXC,GFX_LV,setGfx,gfxDefault,gfxLoad,TER,ENV,DETAIL_TEX,PANEL_TEX,updEnv,GFX_KEY,TCH,HG,N1,CELL,SEG};}
