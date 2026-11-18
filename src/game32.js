/* ================= Build L: GRAPHICS POLISH =================
   Code-built only (no outside assets). Faces with presets + blink/glance, upgraded Dronewright bots,
   Riftbinder golems/wisps, faction towers / pylons and Wildshifter morph forms.
   Everything is built from the shared cq() geometry set so rigs bake into a few skinned draw calls. */
var GL_,FACE_,FGEO_,FZP_,GFXL_=GFXL_||{t:0,cam:null};
function glM(x,y,z,sx,sy,sz,rx,ry,rz){return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(sx,sy,sz==null?sx:sz));}
// merge [geometry, matrix] pairs into one static geometry (position + normal + index), tagged keep so bakeRig accepts it
function glMerge(list){const pos=[],nor=[],idx=[];let base=0;const v=new THREE.Vector3(),nm=new THREE.Matrix3();
  for(const [geo,m] of list){const p=geo.attributes.position,n=geo.attributes.normal;nm.getNormalMatrix(m);
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z);}
    if(geo.index){const I=geo.index.array;for(let i=0;i<I.length;i++)idx.push(I[i]+base);}else for(let i=0;i<p.count;i++)idx.push(i+base);base+=p.count;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setIndex(idx);g.computeBoundingSphere();g.userData.keep=true;return g;}
function glGeo(k,f){if(!GL_)GL_={};const key=k+(cqLow()?'_l':'_h');if(!GL_[key]){const g=f(cqLow());g.userData.keep=true;if(!g.boundingSphere)g.computeBoundingSphere();GL_[key]=g;}return GL_[key];}
function glArc(){return glGeo('arc',lo=>new THREE.TorusGeometry(1,0.3,lo?3:4,lo?6:10,Math.PI));}
function glHex(){return glGeo('hex',()=>{const g=new THREE.CylinderGeometry(0.72,1,1,6,1);g.translate(0,0.5,0);return g;});}
function glOct(){return glGeo('oct',()=>new THREE.OctahedronGeometry(1,0));}
function atkK(atk){return atk>0?Math.min(1,atk/0.35):0;}            // 1 at swing start -> 0 at end
function strikeK(atk){const k=atkK(atk);return k>0?Math.sin((1-k)*Math.PI):0;}

/* ---------- faces ---------- */
function faceDefs(){return FACE_||(FACE_={
  steady:{n:'Steady',icon:'🙂',iris:0x5a3a22,a:0.02,by:[0,0],eye:1,lid:0.22,nose:1,mouth:'smile',mw:0.85},
  bright:{n:'Bright',icon:'😄',iris:0x2a8a9a,a:-0.12,by:[0.012,0.012],eye:1.06,lid:0.04,nose:0.9,mouth:'grin',mw:1.05},
  stern:{n:'Stern',icon:'😐',iris:0x5e6a76,a:0.2,by:[-0.006,-0.006],eye:0.92,lid:0.36,nose:1.15,mouth:'line',mw:1},
  wry:{n:'Wry',icon:'😏',iris:0x6a6a2a,a:0.05,by:[-0.004,0.016],eye:1,lid:0.26,nose:1,mouth:'smirk',mw:0.9},
  weary:{n:'Weary',icon:'😔',iris:0x3a2a1e,a:-0.24,by:[0.004,0.004],eye:0.95,lid:0.52,nose:1.05,mouth:'frown',mw:0.85},
  fierce:{n:'Fierce',icon:'😠',iris:0xc8901a,a:0.34,by:[-0.01,-0.01],eye:1,lid:0.3,nose:1,mouth:'snarl',mw:1}});}
function faceKey(k){return faceDefs()[k]?k:'steady';}
function faceGeo(k){const G=cq(),F=faceDefs()[k],key=k+(G.lo?'l':'h');if(!FGEO_)FGEO_={};if(FGEO_[key])return FGEO_[key];
  const e=F.eye,EX=0.068,EY=0.075,EZ=0.172,o={};
  const wl=[];for(const s of [-1,1]){wl.push([G.sph,glM(s*EX,EY,EZ,0.033*e,0.027*e,0.024)]);wl.push([G.sph,glM(s*EX+0.006,EY+0.008,EZ+0.029,0.005,0.005,0.004)]);}
  const teeth=F.mouth==='grin'||F.mouth==='snarl';if(teeth)wl.push([G.sph,glM(0,-0.046,0.162,0.024*F.mw,0.008,0.01)]);
  o.white=glMerge(wl);
  o.iris=glMerge([-1,1].map(s=>[G.sph,glM(s*EX,-0.002,0,0.0165*e,0.019*e,0.01)]));
  o.lid=glMerge([-1,1].map(s=>[G.sph,glM(s*EX,0,0,0.037*e,1,0.031)]));
  o.brow=glMerge([-1,1].map((s,i)=>[G.cap,glM(s*EX,F.by[i],0,0.016,0.032,0.016,0,s*0.55,Math.PI/2+s*F.a)]));
  const A=glArc(),mw=F.mw,ml=[];
  if(F.mouth==='smile')ml.push([A,glM(0,0.012,0,0.036*mw,0.02,0.03,0,0,Math.PI)]);
  else if(F.mouth==='grin')ml.push([A,glM(0,0.014,0,0.038*mw,0.022,0.03,0,0,Math.PI)]);
  else if(F.mouth==='frown')ml.push([A,glM(0,-0.012,0,0.032*mw,0.016,0.03)]);
  else if(F.mouth==='smirk')ml.push([A,glM(0.008,0.008,0,0.03*mw,0.016,0.03,0,0,Math.PI+0.32)],[G.sph,glM(-0.02,0.0,0.004,0.016,0.006,0.01)]);
  else if(F.mouth==='snarl')ml.push([G.sph,glM(0,-0.008,0.004,0.042*mw,0.008,0.012)],[G.sph,glM(0,0.012,0.002,0.036*mw,0.007,0.011)]);
  else ml.push([G.sph,glM(0,0,0.006,0.042*mw,0.009,0.012)]);
  o.mouth=glMerge(ml);return FGEO_[key]=o;}
// adds a face to a humanoid head; parts are plain meshes so bakeRig folds them into the existing skinned draw calls
function buildFace(R,skc,o,D){const G=cq(),k=faceKey(o.face),F=faceDefs()[k],fg=faceGeo(k),h=R.head,e=F.eye,n=F.nose;
  const mk=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);h.add(m);R.det.push(m);return m;};
  const fc={k,ph:((hash32(((o.hairc|0)^(skc|0))+(R.det.length*97))%1000)/1000)*6,per:3.2+((skc|0)%7)*0.25,R:0.029*e,lid0:F.lid,by:0.128};
  fc.white=mk(fg.white,MS(0xf4efe6),0,0,0);
  fc.iris=mk(fg.iris,MS(F.iris),0,0.075,0.191);
  fc.lid=mk(fg.lid,MS(skc),0,0.075,0.172);
  fc.brow=mk(fg.brow,MS(o.browc||o.hairc||0x2a1d14),0,fc.by,0.184);
  fc.mouth=mk(fg.mouth,MS(dimc(skc,0.42)),0,-0.052,0.158);
  D(part(h,G.sph,MS(skc),0,0.028,0.188,0.022*n,0.032*n,0.03*n));
  D(part(h,G.sph,MS(dimc(skc,0.82)),0,0.007,0.195,0.026*n,0.011,0.016));
  R.face=fc;faceAnim(R,0,0,0);return fc;}
function faceAnim(R,t,atk,hit){const f=R.face;if(!f||!f.lid)return;const c=(t+f.ph)%f.per;
  const blink=c<0.16?Math.sin(c/0.16*Math.PI):0,sq=hit>0?0.75:atk>0?0.25:0;
  const lf=Math.min(1.08,f.lid0+(1.08-f.lid0)*Math.max(blink,sq));f.lid.scale.y=f.R*lf;f.lid.position.y=0.075+f.R*(1-lf);
  const gi=Math.floor((t+f.ph)/2.4),gx=Math.sin(gi*12.9898)*43758.5453%1,gy=Math.sin(gi*78.233)*12543.17%1;
  f.iris.position.x=gx*0.008;f.iris.position.y=0.075+gy*0.004;
  const raise=Math.max(0,Math.sin(t*0.83+f.ph*2)-0.9)*0.08;f.brow.position.y=f.by+raise-(atk>0?0.007:0)-(hit>0?0.004:0);}
function setFace(k){const C=cl();if(!faceDefs()[k])return false;C.face=k;buildPlayerModel();save();return true;}
function npcFace(body,accent,visor,npc){const h=hash32((body|0)*31+(accent|0)*7+(visor|0)*3);const ks=npc?['steady','bright','stern','wry','weary','steady']:['fierce','stern','fierce','wry'];return ks[h%ks.length];}
// hood that frames the face instead of covering it
function hoodParts(head,m,add){const G=cq();const h=add(head,G.hemi,m,0,0.1,0.055,0.236,0.29,0.272);h.rotation.x=-1.22;add(head,G.sph,m,0,-0.04,-0.1,0.2,0.17,0.15);return h;}

/* ---------- Dronewright bots + Riftbinder constructs ---------- */
function botRig(){const g=new THREE.Group();const R={g,det:[],kind:'bot'};R.D=m=>{R.det.push(m);return m;};R.grp=(par,x,y,z)=>{const q=new THREE.Group();q.position.set(x,y,z);par.add(q);return q;};return R;}
function buildBot(def){const b=def.build;let R;
  if(b==='crawler')R=botCrawler(def);else if(b==='brawler')R=botBrawler(def);else if(b==='walker')R=botWalker(def);else if(b==='sentinel')R=botSentinel(def);
  else if(b==='golem')R=botGolem(def);else if(b==='wisp')R=botWisp(def);else return buildBot_k(def);
  R.anim(0,0,0);bakeRig(R);return R;}
function botCrawler(def){const G=cq(),R=botRig(),g=R.g,D=R.D,c=MS(def.col),dk=MS(0x2c2e32),tr=MS(0xd8d0c0),gl=MB(def.proj||0xffa040);
  R.body=R.grp(g,0,0.55,0);part(R.body,G.sph,c,0,0,0,0.42,0.22,0.56);part(R.body,G.hemi,dk,0,0.08,-0.06,0.34,0.16,0.44);
  for(let i=0;i<3;i++)D(part(R.body,G.disc,gl,0,0.2,-0.28+i*0.2,0.05,0.012,0.05));
  R.head=R.grp(R.body,0,0.04,0.5);part(R.head,G.sph,c,0,0,0.04,0.22,0.15,0.18);part(R.head,G.band,gl,0,0.03,0.04,0.2,0.05,0.18);
  R.claws=[];for(const s of [-1,1]){const q=R.grp(R.head,s*0.13,-0.06,0.12);part(q,G.spike,tr,0,0,0,0.045,0.3,0.045).rotation.x=Math.PI/2;D(part(q,G.sph,dk,0,0,0,0.06,0.06,0.06));R.claws.push({q,s});}
  R.ant=R.grp(R.head,0.08,0.12,-0.02);D(part(R.ant,G.rod,dk,0,0.3,0,0.012,0.3,0.012));D(part(R.ant,G.sph,gl,0,0.32,0,0.035,0.035,0.035));
  R.legs=[];for(let i=0;i<3;i++)for(const s of [-1,1]){const hip=R.grp(R.body,s*0.3,0,0.3-i*0.3);const up=R.grp(hip,0,0,0);up.rotation.z=s*2.15;part(up,G.limb,dk,0,0,0,0.045,0.3,0.045);
    const kn=R.grp(up,0,-0.3,0);kn.rotation.z=-s*1.8;D(part(kn,G.sph,c,0,0,0,0.055,0.055,0.055));part(kn,G.taper,dk,0,0,0,0.04,0.66,0.04);hip.rotation.y=-s*(1-i)*0.4;R.legs.push({hip,up,s,base:-s*(1-i)*0.4,ph:((i%2)^(s>0?1:0))?Math.PI:0});}
  R.anim=(t,mv,atk)=>{const st=strikeK(atk),br=Math.sin(t*2.2);R.body.position.y=0.55+Math.abs(Math.sin(t*16))*0.03*mv+br*0.01;R.body.rotation.x=-0.12*st;
    for(const L of R.legs){const w=Math.sin(t*16+L.ph);L.hip.rotation.y=L.base+w*0.35*mv;L.up.rotation.z=L.s*(2.15+Math.max(0,w)*0.3*mv);}
    R.head.position.z=0.5+st*0.18;const op=atk>0?(atkK(atk)>0.5?0.55:-0.15):0.12+Math.sin(t*3)*0.06;for(const C of R.claws)C.q.rotation.y=-C.s*op;R.ant.rotation.z=Math.sin(t*2.7)*0.25;R.ant.rotation.x=Math.sin(t*1.9)*0.15;};return R;}
function botBrawler(def){const G=cq(),R=botRig(),g=R.g,D=R.D,c=MS(def.col),dk=MS(0x2c2e32),gm=MB(def.proj||0xffa040),lt=MS(mixc(def.col,0xffffff,0.25));
  R.hips=part(g,G.sph,dk,0,0.98,0,0.26,0.14,0.2);R.torso=R.grp(g,0,0.98,0);part(R.torso,G.torso,c,0,0,0,0.5,0.82,0.36);part(R.torso,G.hemi,dk,0,0.66,-0.05,0.56,0.18,0.38);
  R.core=part(R.torso,G.disc,gm,0,0.46,0.33,0.12,0.04,0.12);R.core.rotation.x=Math.PI/2;D(part(R.torso,G.ring,dk,0,0.46,0.33,0.15,0.15,0.4));
  for(const s of [-1,1]){const p=D(part(R.torso,G.spike,dk,s*0.2,0.72,-0.28,0.06,0.3,0.06));p.rotation.x=-0.5;D(part(R.torso,G.sph,gm,s*0.2,0.98,-0.42,0.035,0.035,0.035));}
  R.head=R.grp(R.torso,0,0.92,0.04);part(R.head,G.sph,lt,0,0,0,0.2,0.16,0.2);part(R.head,G.band,gm,0,0.0,0,0.19,0.05,0.2);D(part(R.head,G.hemi,dk,0,0.04,0,0.21,0.12,0.21));
  for(const s of [-1,1]){const L=s<0?'L':'R';const arm=R.grp(g,s*0.62,1.68,0);R['arm'+L]=arm;part(arm,G.hemi,dk,s*0.02,0.04,0,0.2,0.16,0.2);part(arm,G.limb,c,0,0,0,0.12,0.42,0.12);
    const el=R.grp(arm,0,-0.42,0);R['el'+L]=el;D(part(el,G.sph,dk,0,0,0,0.11,0.11,0.11));part(el,G.limb,lt,0,0,0,0.14,0.36,0.14);part(el,G.sph,dk,0,-0.44,0.03,0.17,0.16,0.18);D(part(el,G.ring,gm,0,-0.3,0,0.13,0.13,0.25)).rotation.x=Math.PI/2;
    const leg=R.grp(g,s*0.24,0.95,0);R['leg'+L]=leg;part(leg,G.limb,dk,0,0,0,0.15,0.46,0.15);const kn=R.grp(leg,0,-0.46,0);R['kn'+L]=kn;D(part(kn,G.sph,c,0,0,0.04,0.12,0.12,0.12));part(kn,G.limb,c,0,0,0,0.13,0.42,0.14);part(kn,G.sph,dk,0,-0.46,0.06,0.15,0.08,0.24);D(part(kn,G.rod,lt,0,-0.05,-0.12,0.025,0.3,0.025));}
  R.anim=(t,mv,atk)=>{const f=8,s=Math.sin(t*f)*mv,c2=Math.cos(t*f),br=Math.sin(t*2),st=strikeK(atk),k=atkK(atk);
    R.legL.rotation.x=s*0.55;R.legR.rotation.x=-s*0.55;R.knL.rotation.x=Math.max(0,-c2)*0.8*mv+0.05;R.knR.rotation.x=Math.max(0,c2)*0.8*mv+0.05;
    const bob=Math.abs(c2)*0.04*mv;R.torso.position.y=0.98+bob+br*0.01;R.hips.position.y=0.98+bob;R.torso.rotation.set(0.08*mv,s*0.1,0);
    R.armL.rotation.set(-s*0.5+br*0.04,0,-0.12);R.elL.rotation.x=-0.3-0.3*mv;R.armR.rotation.set(s*0.5-br*0.04,0,0.12);R.elR.rotation.x=-0.3-0.3*mv;
    if(atk>0){if(k>0.6){const w=(1-k)/0.4;R.armR.rotation.set(0.7*w,0,0.15);R.elR.rotation.x=-1.4*w;R.torso.rotation.y=0.35*w;}else{const p=Math.min(1,(0.6-k)/0.25);R.armR.rotation.set(0.7-2.3*p,0,0.15);R.elR.rotation.x=-1.4+1.25*p;R.torso.rotation.y=0.35-0.65*p;}}
    R.head.rotation.y=Math.sin(t*0.6)*0.35*(1-mv);const p=1+Math.sin(t*5)*0.15+st*0.5;R.core.scale.set(0.12*p,0.04,0.12*p);};return R;}
function botWalker(def){const G=cq(),R=botRig(),g=R.g,D=R.D,c=MS(def.col),dk=MS(0x2c2e32),gm=MB(def.proj||0xffa040),lt=MS(mixc(def.col,0xffffff,0.2));
  R.body=R.grp(g,0,1.95,0);part(R.body,G.sph,c,0,0,0,0.6,0.34,0.56);part(R.body,G.hemi,dk,0,0.12,-0.04,0.5,0.2,0.48);D(part(R.body,G.ring,dk,0,0,0,0.6,0.56,0.3)).rotation.x=Math.PI/2;
  R.eye=part(R.body,G.sph,gm,0,0.02,0.52,0.12,0.07,0.06);D(part(R.body,G.band,gm,0,-0.12,0,0.55,0.03,0.52));
  R.tur=R.grp(R.body,0,0.22,0);part(R.tur,G.sph,lt,0,0.05,0,0.3,0.14,0.3);R.guns=[];
  for(const s of [-1,1]){const bq=R.grp(R.tur,s*0.2,0.06,0.15);const bar=part(bq,G.rod,dk,0,0,0,0.07,0.9,0.07);bar.rotation.x=-Math.PI/2;const mz=D(part(bq,G.ring,gm,0,0,0.9,0.08,0.08,0.4));R.guns.push({bq,mz,s});}
  R.ant=R.grp(R.body,-0.3,0.3,-0.25);D(part(R.ant,G.rod,dk,0,0.4,0,0.015,0.4,0.015));D(part(R.ant,G.sph,gm,0,0.42,0,0.04,0.04,0.04));
  R.legs=[];for(const s of [-1,1]){const hip=R.grp(g,s*0.48,1.8,0);D(part(hip,G.sph,dk,0,0,0,0.16,0.16,0.16));part(hip,G.limb,c,0,0,0,0.13,0.62,0.13);
    const kn=R.grp(hip,0,-0.62,0);D(part(kn,G.sph,lt,0,0,0,0.11,0.11,0.11));part(kn,G.limb,dk,0,0,0,0.1,0.66,0.1);D(part(kn,G.rod,lt,0,-0.05,0.1,0.025,0.5,0.025));
    const an=R.grp(kn,0,-0.66,0);part(an,G.sph,c,0,-0.03,0.08,0.19,0.07,0.32);D(part(an,G.spike,dk,0,-0.04,0.38,0.06,0.16,0.04)).rotation.x=Math.PI/2;R.legs.push({hip,kn,an,s});}
  R.anim=(t,mv,atk)=>{const st=strikeK(atk);R.legs.forEach((L,i)=>{const w=Math.sin(t*7+i*Math.PI);L.hip.rotation.x=-0.45+w*0.45*mv;L.kn.rotation.x=0.95+Math.max(0,-w)*0.5*mv;L.an.rotation.x=-0.5-w*0.2*mv;});
    R.body.position.y=1.9+Math.abs(Math.sin(t*7))*0.05*mv+Math.sin(t*1.7)*0.015;R.body.rotation.z=Math.sin(t*3.5)*0.04*mv;R.tur.rotation.y=atk>0?0:Math.sin(t*0.6)*0.35*(1-mv);
    for(const G2 of R.guns){G2.bq.position.z=0.15-st*0.18;G2.mz.scale.setScalar(0.08*(1+st*2.2));}R.eye.scale.set(0.12,0.07*(1-0.85*Math.min(1,Math.max(0,Math.sin(t*0.9)-0.97)/0.03)),0.06);R.ant.rotation.x=Math.sin(t*2.2)*0.2;};return R;}
function botSentinel(def){const G=cq(),R=botRig(),g=R.g,D=R.D,c=MS(def.col),dk=MS(0x24262c),gm=MB(def.proj||0x5ff2ff),lt=MS(mixc(def.col,0xffffff,0.3));R.hover=true;
  R.core=R.grp(g,0,0.7,0);part(R.core,G.ico,c,0,0,0,0.5,0.44,0.5);part(R.core,G.hemi,lt,0,0.12,0,0.46,0.28,0.46);const bot=part(R.core,G.hemi,dk,0,-0.1,0,0.44,0.26,0.44);bot.rotation.x=Math.PI;
  R.eye=part(R.core,G.sph,gm,0,0.02,0.44,0.13,0.13,0.06);D(part(R.core,G.ring,dk,0,0.02,0.44,0.15,0.15,0.4));
  R.r1=R.grp(g,0,0.7,0);part(R.r1,G.ring,gm,0,0,0,0.85,0.85,0.25).rotation.x=Math.PI/2;R.r2=R.grp(g,0,0.7,0);D(part(R.r2,G.ring,MB(mixc(def.proj||0x5ff2ff,0xffffff,0.4)),0,0,0,0.7,0.7,0.18));
  R.pods=[];for(const s of [-1,1]){const p=R.grp(g,s*0.88,0.62,0.05);part(p,G.cap,dk,0,0,0,0.26,0.4,0.26).rotation.x=Math.PI/2;const mz=part(p,G.sph,gm,0,0,0.46,0.08,0.08,0.05);D(part(p,G.spike,lt,0,0.16,-0.15,0.05,0.22,0.05)).rotation.x=-0.6;R.pods.push({p,mz,s});}
  R.fins=[];for(let i=0;i<3;i++){const a=i/3*6.283;const f=R.grp(g,Math.cos(a)*0.28,0.38,Math.sin(a)*0.28);const sp=part(f,G.spike,dk,0,0,0,0.07,0.4,0.03);sp.rotation.x=Math.PI;D(part(f,G.sph,gm,0,-0.42,0,0.035,0.035,0.035));R.fins.push(f);}
  R.anim=(t,mv,atk)=>{const st=strikeK(atk);R.core.rotation.y=Math.sin(t*0.5)*0.4;R.r1.rotation.set(0.25+Math.sin(t*0.9)*0.1,t*1.6,0);R.r2.rotation.set(t*1.1,0.4,t*0.7);
    for(const P2 of R.pods){P2.p.position.set(P2.s*0.88,0.62+Math.sin(t*2.4+P2.s)*0.05,0.05-st*0.15);P2.mz.scale.setScalar(0.08*(1+st*2.5));}
    R.eye.scale.set(0.13*(1+st*0.4),0.13*(1+st*0.4),0.06);R.fins.forEach((f,i)=>f.rotation.y=t*0.8+i);R.core.position.y=0.7+Math.sin(t*3.1)*0.03;};return R;}
function botGolem(def){const G=cq(),R=botRig(),g=R.g,D=R.D,s=def.h/2.0,c=def.col,st=M(c),dk=M(dimc(c,0.68)),lt=M(mixc(c,0xffffff,0.18)),gm=MB(def.proj||0x7ff8ff),tier=def.tier||1;
  R.hips=part(g,G.ico,dk,0,0.92*s,0,0.42*s,0.26*s,0.32*s);R.torso=R.grp(g,0,0.95*s,0);
  part(R.torso,G.ico,st,0,0.42*s,0,0.62*s,0.52*s,0.44*s);part(R.torso,G.ico,lt,0,0.78*s,-0.06*s,0.72*s,0.3*s,0.46*s);D(part(R.torso,G.ico,dk,0.18*s,0.25*s,0.3*s,0.2*s,0.16*s,0.14*s));
  R.core=part(R.torso,G.ico,gm,0,0.42*s,0.36*s,0.16*s,0.16*s,0.1*s);
  for(const [x,y,r] of [[-0.18,0.55,0.6],[0.2,0.32,-0.5],[0.0,0.2,0.1]])D(part(R.torso,G.rod,gm,x*s,y*s,0.38*s,0.016*s,0.22*s,0.016*s)).rotation.z=r;
  R.head=R.grp(R.torso,0,0.86*s,0.2*s);part(R.head,G.ico,st,0,0.06*s,0,0.24*s,0.2*s,0.22*s);for(const sx of [-1,1])part(R.head,G.sph,gm,sx*0.08*s,0.07*s,0.19*s,0.04*s,0.03*s,0.02*s);D(part(R.head,G.ico,dk,0,0.18*s,-0.04*s,0.18*s,0.08*s,0.16*s));
  if(tier>=2)for(const sx of [-1,0,1]){const sp=D(part(R.torso,G.spike,gm,sx*0.3*s,0.9*s,-0.22*s,0.07*s,(sx?0.3:0.42)*s,0.07*s));sp.rotation.set(-0.5,0,-sx*0.45);}
  for(const sd of [-1,1]){const L=sd<0?'L':'R';const arm=R.grp(g,sd*0.7*s,1.68*s,0);R['arm'+L]=arm;part(arm,G.ico,lt,0,0.02*s,0,0.3*s,0.24*s,0.3*s);part(arm,G.ico,st,0,-0.28*s,0,0.2*s,0.32*s,0.2*s);
    const el=R.grp(arm,0,-0.56*s,0);R['el'+L]=el;part(el,G.ico,st,0,-0.2*s,0,0.24*s,0.3*s,0.24*s);part(el,G.ico,dk,0,-0.5*s,0.03*s,0.27*s,0.22*s,0.27*s);D(part(el,G.ring,gm,0,-0.1*s,0,0.2*s,0.2*s,0.2)).rotation.x=Math.PI/2;
    const leg=R.grp(g,sd*0.3*s,0.85*s,0);R['leg'+L]=leg;part(leg,G.ico,dk,0,-0.2*s,0,0.24*s,0.28*s,0.24*s);const kn=R.grp(leg,0,-0.42*s,0);R['kn'+L]=kn;part(kn,G.ico,st,0,-0.18*s,0.03*s,0.27*s,0.24*s,0.32*s);}
  R.shards=[];const ns=tier>=3?3:tier>=2?2:0;for(let i=0;i<ns;i++){const q=R.grp(g,0,0,0);part(q,G.ico,i%2?gm:lt,0,0,0,0.1*s,0.14*s,0.1*s);R.shards.push(q);}
  R.anim=(t,mv,atk)=>{const f=5.5,sw=Math.sin(t*f)*mv,cw=Math.cos(t*f),br=Math.sin(t*1.6),k=atkK(atk),stv=strikeK(atk);
    R.legL.rotation.x=sw*0.45;R.legR.rotation.x=-sw*0.45;R.knL.rotation.x=Math.max(0,-cw)*0.5*mv;R.knR.rotation.x=Math.max(0,cw)*0.5*mv;
    R.torso.position.y=0.95*s+Math.abs(cw)*0.05*s*mv+br*0.012*s;R.hips.position.y=0.92*s+Math.abs(cw)*0.05*s*mv;R.torso.rotation.set(0.1*mv,0,sw*0.08);
    R.armL.rotation.set(-sw*0.4+br*0.04,0,-0.08);R.armR.rotation.set(sw*0.4-br*0.04,0,0.08);R.elL.rotation.x=-0.35-0.2*mv;R.elR.rotation.x=-0.35-0.2*mv;
    if(atk>0){let a,tx;if(k>0.55){const up=(1-k)/0.45;a=-2.7*up;tx=-0.25*up;}else{const dn=Math.min(1,(0.55-k)/0.2);a=-2.7+2.4*dn;tx=-0.25+0.6*dn;}R.armL.rotation.set(a,0,-0.25);R.armR.rotation.set(a,0,0.25);R.elL.rotation.x=R.elR.rotation.x=-0.25;R.torso.rotation.x=tx;}
    R.head.rotation.y=Math.sin(t*0.5)*0.3*(1-mv);const p=1+Math.sin(t*4)*0.18+stv*0.6;R.core.scale.set(0.16*s*p,0.16*s*p,0.1*s*p);
    R.shards.forEach((q,i)=>{const a=t*1.3+i*2.094;q.position.set(Math.cos(a)*0.95*s,1.55*s+Math.sin(t*2+i)*0.15*s,Math.sin(a)*0.95*s);q.rotation.set(t*2+i,t*1.4,0);});};return R;}
function botWisp(def){const G=cq(),R=botRig(),g=R.g,D=R.D,c=def.col,gl=def.proj||0x7ff8ff,cm=MB(mixc(c,0xffffff,0.35)),om=MB(c),gm=MB(gl),tier=def.tier||1;R.hover=true;
  R.core=R.grp(g,0,0.55,0);part(R.core,G.ico,cm,0,0,0,0.3,0.34,0.3);part(R.core,G.sph,MB(0xffffff),0,0.02,0,0.16,0.18,0.16);
  for(const sx of [-1,1])D(part(R.core,G.sph,MS(0x1a1420),sx*0.09,0.06,0.25,0.04,0.055,0.03));
  R.cage=[];for(let i=0;i<2;i++){const q=R.grp(g,0,0.55,0);part(q,G.ring,i?gm:om,0,0,0,0.48+i*0.08,0.48+i*0.08,0.12);R.cage.push(q);}
  R.tail=[];for(let i=0;i<3;i++){const q=R.grp(g,(i-1)*0.1,0.32,(i-1)*-0.04);const sp=part(q,G.spike,i===1?om:gm,0,0,0,0.12-Math.abs(i-1)*0.03,0.55-Math.abs(i-1)*0.15,0.12-Math.abs(i-1)*0.03);sp.rotation.x=Math.PI;R.tail.push(q);}
  R.orb=[];for(let i=0;i<3;i++){const o=R.grp(g,0,0.55,0);part(o,G.ico,om,0,0,0,0.1,0.1,0.1);D(part(o,G.sph,gm,0,0,0,0.05,0.05,0.05));R.orb.push(o);}
  R.wings=[];if(tier>=4)for(const sx of [-1,1]){const w=R.grp(g,sx*0.28,0.7,-0.12);for(let j=0;j<3;j++){const f=part(w,G.spike,j===1?om:gm,sx*(0.3+j*0.18),0.08-j*0.06,0,0.05,0.62-j*0.12,0.02);f.rotation.z=-sx*(1.0+j*0.35);}R.wings.push({w,sx});}
  R.anim=(t,mv,atk)=>{const st=strikeK(atk),k=1+st*0.35+Math.sin(t*7)*0.05;R.core.scale.setScalar(k);R.core.rotation.y=Math.sin(t*0.8)*0.5;R.core.position.y=0.55+Math.sin(t*2.2)*0.04;
    R.cage[0].rotation.set(t*1.3,t*0.6,0);R.cage[1].rotation.set(0.9,t*-1.7,t*0.9);
    R.tail.forEach((q,i)=>{q.scale.set(1,0.85+Math.sin(t*11+i*2)*0.18+st*0.3,1);q.rotation.x=0.25*mv+Math.sin(t*6+i)*0.08;q.rotation.z=Math.sin(t*5+i*1.7)*0.12;});
    const rr=0.62-st*0.25;R.orb.forEach((o,i)=>{const a=t*2.6+i*2.094;o.position.set(Math.cos(a)*rr,0.55+Math.sin(t*3+i)*0.15,Math.sin(a)*rr);});
    R.wings.forEach(({w,sx})=>{w.rotation.z=sx*(Math.sin(t*(mv>0.3?9:3))*0.35+0.1);w.rotation.y=-sx*0.2;});};return R;}

/* ---------- faction towers, enemy pylons, town pylon ---------- */
function buildTowerMesh(col,glow){const G=cq(),g=new THREE.Group(),R={g},stone=0x4a4f57,dk=0x33373e;
  const S=[];S.push([glHex(),glM(0,0,0,2.4,0.7,2.4)],[glHex(),glM(0,0.7,0,1.25,7.6,1.25)]);for(let i=0;i<6;i++){const a=i/6*6.283+0.52;S.push([geoBox,glM(Math.cos(a)*1.25,2.1,Math.sin(a)*1.25,0.28,4.2,0.7,0,-a,0)]);}
  S.push([G.disc,glM(0,8.3,0,1.1,0.3,1.1)]);part(g,glMerge(S),M(stone),0,0,0,1,1,1);
  const C=[];for(const y of [2.4,5.6])C.push([G.disc,glM(0,y,0,(1.18-y*0.045),0.38,(1.18-y*0.045))]);for(let i=0;i<6;i++){const a=i/6*6.283+0.52;C.push([geoBox,glM(Math.cos(a)*1.52,2.6,Math.sin(a)*1.52,0.08,3.2,0.5,0,-a,0)]);}
  for(let i=0;i<4;i++){const a=i/4*6.283;C.push([G.spike,glM(Math.cos(a)*0.85,8.4,Math.sin(a)*0.85,0.14,1.5,0.14,Math.sin(a)*-0.45,0,Math.cos(a)*0.45)]);}part(g,glMerge(C),M(col),0,0,0,1,1,1);
  const L=[];for(let i=0;i<3;i++){const a=i/3*6.283;L.push([G.rod,glM(Math.cos(a)*0.95,8.2,Math.sin(a)*0.95,0.06,6.6,0.06)]);}part(g,glMerge(L),MB(glow),0,0,0,1,1,1);
  R.crystal=part(g,glOct(),MB(glow),0,9.6,0,0.75,1.5,0.75);R.inner=part(g,glOct(),MB(0xffffff),0,9.6,0,0.32,0.7,0.32);
  R.ring=part(g,G.ring,MB(col),0,9.6,0,1.55,1.55,0.35);R.ring.rotation.x=Math.PI/2;R.ring2=part(g,G.ring,MB(glow),0,9.6,0,1.15,1.15,0.25);
  R.pulses=[];for(let i=0;i<3;i++){const a=i/3*6.283;R.pulses.push({m:part(g,G.sph,MB(0xffffff),Math.cos(a)*0.95,2,Math.sin(a)*0.95,0.13,0.2,0.13),o:i/3});}
  R.beam=part(g,G.rod,new THREE.MeshBasicMaterial({color:glow,transparent:true,opacity:0.22,blending:THREE.AdditiveBlending,depthWrite:false}),0,24,0,0.18,13,0.18);
  R.anim=(t)=>{R.crystal.rotation.y=t*1.4;R.crystal.position.y=9.6+Math.sin(t*1.7)*0.18;R.inner.position.y=R.crystal.position.y;R.inner.rotation.y=-t*2.2;
    R.ring.rotation.z=t*0.8;R.ring2.rotation.set(Math.PI/2+Math.sin(t*0.9)*0.35,t*-1.2,0);for(const p of R.pulses){const u=(t*0.45+p.o)%1;p.m.position.y=1.6+u*6.6;p.m.scale.setScalar(0.12*(1-Math.abs(u-0.5)));}
    R.beam.material.opacity=0.14+Math.sin(t*3)*0.06;R.beam.scale.x=R.beam.scale.z=0.16+Math.sin(t*5)*0.03;};R.anim(0);return R;}
function buildPylon(){const G=cq(),g=new THREE.Group(),R={g,det:[]},D=m=>{R.det.push(m);return m;};const dk=MS(0x2a2220),rim=MS(0x4a3a30),gl=MB(0xff7a2a),hot=MB(0xffc85a);
  part(g,glHex(),dk,0,0,0,0.85,0.45,0.85);D(part(g,G.ring,hot,0,0.47,0,0.62,0.62,0.25)).rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){const a=i/3*6.283;const q=new THREE.Group();q.position.set(Math.cos(a)*0.55,0.4,Math.sin(a)*0.55);q.rotation.y=-a+Math.PI/2;g.add(q);const p=part(q,G.spike,rim,0,0,0,0.12,1.6,0.12);p.rotation.x=-0.32;D(part(q,G.sph,hot,0,1.45,0.45,0.06,0.06,0.06));}
  R.cr=new THREE.Group();R.cr.position.y=1.9;g.add(R.cr);part(R.cr,G.spike,gl,0,0,0,0.42,1.25,0.42);part(R.cr,G.claw,gl,0,0,0,0.42,0.8,0.42);part(R.cr,G.sph,hot,0,0.1,0,0.18,0.42,0.18);
  R.ring=new THREE.Group();R.ring.position.y=1.9;g.add(R.ring);part(R.ring,G.ring,hot,0,0,0,0.85,0.85,0.18).rotation.x=Math.PI/2;
  R.sh=[];for(let i=0;i<3;i++){const q=new THREE.Group();g.add(q);D(part(q,G.ico,gl,0,0,0,0.1,0.16,0.1));R.sh.push(q);}
  R.anim=(t,mv,atk)=>{const k=atk>0?1.18:1;R.cr.rotation.y=t*1.5;R.cr.position.y=1.9+Math.sin(t*2)*0.1;R.cr.scale.set(k,k*(1+Math.sin(t*6)*0.04),k);
    R.ring.rotation.set(Math.sin(t*0.8)*0.3,t*1.1,Math.cos(t*0.7)*0.3);R.sh.forEach((q,i)=>{const a=t*1.8+i*2.094;q.position.set(Math.cos(a)*0.95,1.6+Math.sin(t*2.6+i)*0.35,Math.sin(a)*0.95);q.rotation.y=t*3;});};R.anim(0,0,0);return R;}
// Halden's Rest pylon: orbiting shards, counter-rotating ring, conduits and a pulsing energy column (one merged static mesh + 4 animated)
function gfxTownPylon(){if(GFXL_.town||typeof scene==='undefined')return;const G=cq(),g=new THREE.Group();scene.add(g);const T0={g};
  const L=[];for(let i=0;i<4;i++){const a=i/4*6.283+0.785;L.push([G.rod,glM(Math.cos(a)*1.25,3.9,Math.sin(a)*1.25,0.05,2.9,0.05,-Math.sin(a)*0.18,0,Math.cos(a)*0.18)]);L.push([G.sph,glM(Math.cos(a)*1.77,1.05,Math.sin(a)*1.77,0.14,0.14,0.14)]);}
  part(g,glMerge(L),MB(0x5ff2ff),0,0,0,1,1,1);T0.ring=part(g,G.ring,MB(0x9ff8ff),0,4.2,0,1.75,1.75,0.22);
  T0.col=part(g,G.rod,new THREE.MeshBasicMaterial({color:0x5ff2ff,transparent:true,opacity:0.18,blending:THREE.AdditiveBlending,depthWrite:false}),0,4.2,0,0.55,3.2,0.55);
  T0.sh=part(g,glMerge([0,1,2].map(i=>[G.ico,glM(Math.cos(i*2.094)*2.7,0,Math.sin(i*2.094)*2.7,0.22,0.36,0.22)])),MB(0x9ff8ff),0,4.2,0,1,1,1);GFXL_.town=T0;}
function gfxTownAnim(t){const T0=GFXL_.town;if(!T0)return;T0.ring.rotation.set(Math.PI/2+Math.sin(t*0.6)*0.4,t*-0.7,0);T0.sh.rotation.y=t*0.5;T0.sh.position.y=4.2+Math.sin(t*1.3)*0.25;
  T0.col.material.opacity=0.12+Math.sin(t*2.4)*0.06;T0.col.scale.x=T0.col.scale.z=0.5+Math.sin(t*3.7)*0.06;}

function fzPulse(t){if(!FZP_)return;for(const z of FZP_){const k=0.72+0.28*Math.sin(t*1.6+z.ph);z.hm.color.copy(z.c).multiplyScalar(k);z.bm.opacity=0.16+0.14*(0.5+0.5*Math.sin(t*2.3+z.ph))+0.08*Math.max(0,Math.sin(t*0.7+z.ph)-0.9)*10;}}
/* ---------- Wildshifter morph forms ---------- */
function morphRig(){const R=botRig();R.legs=[];R.wings=[];return R;}
function buildMorphModel(id){const R=id==='wolf'?morphWolf():id==='lizard'?morphLizard():morphDrake();R.id=id;R.anim(0,0,0);bakeRig(R);return R;}
function quadLeg(R,par,x,y,z,len,w,mat,paw,hind){const G=cq();const hip=R.grp(par,x,y,z);part(hip,G.limb,mat,0,0,0,w,len*0.52,w);part(hip,G.sph,mat,0,-len*0.12,0,w*1.55,len*0.22,w*1.7);const kn=R.grp(hip,0,-len*0.5,0);R.D(part(kn,G.sph,mat,0,0,0,w*0.8,w*0.8,w*0.8));
  part(kn,G.taper,mat,0,0,0,w*0.85,len*0.5,w*0.85);part(kn,G.sph,paw,0,-len*0.5,w*0.5,w*1.05,w*0.55,w*1.5);const L={hip,kn,hind:!!hind,front:z>0};R.legs.push(L);return L;}
function morphWolf(){const G=cq(),R=morphRig(),g=R.g,D=R.D,c=0xb08a5a,fur=MS(c),dk=MS(0x8a6a42),lt=MS(0xe0c89a),nose=MS(0x2a1c12),eye=MB(0xffc85a);
  R.body=R.grp(g,0,0.9,0);part(R.body,G.sph,fur,0,0.04,0.25,0.34,0.37,0.5);part(R.body,G.sph,fur,0,0,-0.32,0.3,0.31,0.45);D(part(R.body,G.sph,lt,0,-0.14,0.3,0.2,0.18,0.32));
  for(let i=0;i<5;i++)D(part(R.body,G.spike,dk,0,0.3-i*0.025,0.42-i*0.2,0.07,0.2,0.05)).rotation.x=-0.7;
  R.neck=R.grp(R.body,0,0.15,0.55);part(R.neck,G.sph,fur,0,0.05,0.05,0.2,0.24,0.22);R.head=R.grp(R.neck,0,0.2,0.18);part(R.head,G.sph,fur,0,0,0,0.2,0.18,0.22);
  part(R.head,G.cap,dk,0,-0.04,0.22,0.17,0.2,0.15).rotation.x=Math.PI/2;part(R.head,G.sph,nose,0,-0.01,0.42,0.05,0.04,0.04);
  R.jaw=R.grp(R.head,0,-0.08,0.08);part(R.jaw,G.cap,lt,0,-0.02,0.15,0.13,0.17,0.08).rotation.x=Math.PI/2;D(part(R.jaw,G.spike,MS(0xf4efe6),0,0.02,0.28,0.025,0.05,0.025));
  for(const s of [-1,1]){D(part(R.head,G.spike,dk,s*0.11,0.15,-0.04,0.06,0.2,0.04)).rotation.z=-s*0.25;part(R.head,G.sph,eye,s*0.09,0.05,0.17,0.035,0.03,0.025);}
  R.tail=[];let tp=R.grp(R.body,0,0.08,-0.65);for(let i=0;i<3;i++){part(tp,G.cap,i===2?lt:dk,0,0,-0.12,0.1-i*0.015,0.16,0.1-i*0.015).rotation.x=Math.PI/2;R.tail.push(tp);const n=R.grp(tp,0,0,-0.24);tp=n;}
  for(const [x,z,h] of [[-0.17,0.38,0],[0.17,0.38,0],[-0.17,-0.42,1],[0.17,-0.42,1]])quadLeg(R,R.body,x,-0.12,z,0.78,0.09,fur,dk,h);
  R.anim=(t,mv,atk)=>{const st=strikeK(atk),f=12,br=Math.sin(t*3);R.legs.forEach((L,i)=>{const ph=(L.front?0:Math.PI*0.6)+(i%2)*0.5;const w=Math.sin(t*f+ph)*mv;L.hip.rotation.x=w*0.75;L.kn.rotation.x=(L.hind?-1:1)*Math.max(0,Math.cos(t*f+ph))*0.7*mv+(L.hind?-0.15:0.1);});
    R.body.position.set(0,0.9+Math.abs(Math.sin(t*f))*0.06*mv+br*0.01,st*0.35);R.body.rotation.x=Math.sin(t*f)*0.06*mv+st*0.18;
    R.neck.rotation.x=0.1*mv+st*0.35;R.head.rotation.set(-0.1+Math.sin(t*0.9)*0.06*(1-mv),Math.sin(t*0.5)*0.3*(1-mv),0);R.jaw.rotation.x=atk>0?0.55*st+0.1:0.08+Math.max(0,Math.sin(t*6))*0.08*(1-mv);
    R.tail.forEach((q,i)=>{q.rotation.set(i?0.15:-0.5+0.3*mv,Math.sin(t*(mv>0.3?10:4)+i*0.6)*0.35,0);});};return R;}
function morphLizard(){const G=cq(),R=morphRig(),g=R.g,D=R.D,sk=MS(0x7fd8c8),dk=MS(0x5ab0a0),bl=MS(0xcff4ec),cr=MB(0x9ff8e8),eye=MB(0xffe95a);
  R.seg=[];let par=g,py=0.42;R.body=R.grp(g,0,0.42,0);
  const s0=R.grp(R.body,0,0,0.25);part(s0,G.sph,sk,0,0,0,0.34,0.17,0.42);D(part(s0,G.sph,bl,0,-0.08,0,0.26,0.1,0.34));R.seg.push(s0);
  const s1=R.grp(R.body,0,0,-0.15);part(s1,G.sph,sk,0,0,-0.15,0.3,0.15,0.4);R.seg.push(s1);
  for(let i=0;i<6;i++){const sp=D(part(i<3?s0:s1,G.spike,cr,0,0.12,i<3?0.25-i*0.18:-0.05-(i-3)*0.18,0.06,0.22-(i%3)*0.03,0.04));sp.rotation.x=-0.35;}
  R.head=R.grp(s0,0,0.04,0.42);part(R.head,G.sph,dk,0,0,0.1,0.22,0.12,0.24);part(R.head,G.sph,sk,0,-0.01,0.3,0.15,0.08,0.18);
  for(const s of [-1,1]){part(R.head,G.sph,eye,s*0.12,0.07,0.16,0.045,0.045,0.035);D(part(R.head,G.spike,cr,s*0.15,0.05,-0.05,0.04,0.2,0.03)).rotation.set(-1.2,0,-s*0.6);}
  R.jaw=R.grp(R.head,0,-0.05,0.06);part(R.jaw,G.sph,bl,0,-0.02,0.2,0.14,0.04,0.2);R.tongue=R.grp(R.head,0,-0.03,0.42);D(part(R.tongue,G.rod,MB(0xff6a8a),0,0,0,0.012,0.18,0.012)).rotation.x=-Math.PI/2;
  R.tail=[];let tp=R.grp(s1,0,0,-0.5);for(let i=0;i<4;i++){part(tp,G.cap,i%2?dk:sk,0,0,-0.14,0.15-i*0.03,0.2,0.1-i*0.018).rotation.x=Math.PI/2;if(i<3)D(part(tp,G.spike,cr,0,0.06,-0.12,0.04,0.14,0.03)).rotation.x=-0.5;R.tail.push(tp);tp=R.grp(tp,0,0,-0.3);}
  for(const [p,x,z,h] of [[s0,-0.28,0.15,0],[s0,0.28,0.15,0],[s1,-0.26,-0.25,1],[s1,0.26,-0.25,1]]){const L=quadLeg(R,p,x,0,z,0.42,0.06,sk,dk,h);L.hip.rotation.z=x<0?-1.0:1.0;L.side=x<0?-1:1;}
  R.anim=(t,mv,atk)=>{const st=strikeK(atk),f=11,wv=Math.sin(t*f)*mv;R.seg[0].rotation.y=wv*0.18;R.seg[1].rotation.y=-wv*0.22;
    R.legs.forEach((L,i)=>{const ph=(i===0||i===3)?0:Math.PI;const w=Math.sin(t*f+ph)*mv;L.hip.rotation.set(w*0.7,0,L.side*(1.0-Math.max(0,Math.cos(t*f+ph))*0.3*mv));L.kn.rotation.z=-L.side*1.05;});
    R.body.position.set(0,0.42+Math.sin(t*2.2)*0.012,st*0.2);R.head.rotation.set(-st*0.2+Math.sin(t*0.7)*0.05,Math.sin(t*0.45)*0.35*(1-mv)-wv*0.2,0);R.jaw.rotation.x=0.04+st*0.6;
    const fl=Math.max(0,Math.sin(t*1.7)-0.85)/0.15;R.tongue.scale.set(1,1,0.01+fl*(1-mv));R.tongue.visible=true;
    R.tail.forEach((q,i)=>{q.rotation.y=Math.sin(t*(mv>0.3?f:3)-i*0.8)*(0.25+0.2*mv);q.rotation.x=i?0.05:0.12;});};return R;}
function morphDrake(){const G=cq(),R=morphRig(),g=R.g,D=R.D,c=MS(0x9a4a26),dk=MS(0x5a2a16),mid=MS(0x7a3a1e),bone=MS(0xe6d6b0),mem=MS(0xc86a2a),ember=MB(0xffb347),hot=MB(0xff7a2a);
  R.body=R.grp(g,0,1.3,0);part(R.body,G.sph,c,0,0,0.1,0.55,0.5,0.85);part(R.body,G.sph,mid,0,-0.05,-0.6,0.42,0.4,0.55);R.belly=part(R.body,G.sph,ember,0,-0.2,0.35,0.3,0.25,0.4);
  for(let i=0;i<6;i++)D(part(R.body,G.spike,bone,0,0.46-Math.abs(i-2)*0.03,0.6-i*0.3,0.08,0.3,0.06)).rotation.x=-0.6;
  R.neck=R.grp(R.body,0,0.25,0.75);part(R.neck,G.cap,c,0,0.25,0.12,0.3,0.42,0.3).rotation.x=0.6;R.head=R.grp(R.neck,0,0.6,0.42);
  part(R.head,G.sph,c,0,0,0,0.3,0.24,0.34);part(R.head,G.cap,mid,0,-0.04,0.32,0.2,0.24,0.18).rotation.x=Math.PI/2;R.jaw=R.grp(R.head,0,-0.12,0.1);part(R.jaw,G.cap,dk,0,0,0.28,0.17,0.22,0.08).rotation.x=Math.PI/2;R.throat=part(R.jaw,G.sph,hot,0,0.04,0.3,0.1,0.05,0.18);
  for(const s of [-1,1]){part(R.head,G.sph,ember,s*0.14,0.08,0.24,0.05,0.04,0.035);const h=part(R.head,G.spike,bone,s*0.15,0.16,-0.12,0.07,0.5,0.07);h.rotation.set(-1.1,0,-s*0.3);D(part(R.head,G.spike,bone,s*0.2,0.0,-0.05,0.04,0.25,0.04)).rotation.set(-1.4,0,-s*0.9);}
  for(const s of [-1,1]){const w=R.grp(R.body,0.45*s,0.35,0.15);const arm=part(w,G.limb,dk,0,0,0,0.07,1.2,0.07);arm.rotation.z=s*Math.PI/2*1.05;
    for(let j=0;j<3;j++){const fz=-0.15-j*0.35;const fr=D(part(w,G.rod,bone,s*(0.6+j*0.35),0.05,fz*0.6,0.025,0.55+j*0.1,0.025));fr.rotation.set(0,0,s*(2.6+j*0.18));}
    part(w,G.sph,mem,s*1.15,-0.12,-0.42,1.05,0.035,0.62);D(part(w,G.spike,bone,s*2.05,0.0,0,0.05,0.25,0.05)).rotation.z=-s*1.2;R.wings.push({w,s});}
  R.tail=[];let tp=R.grp(R.body,0,0.05,-1.05);for(let i=0;i<4;i++){part(tp,G.cap,i%2?mid:c,0,0,-0.2,0.24-i*0.045,0.3,0.24-i*0.045).rotation.x=Math.PI/2;R.tail.push(tp);tp=R.grp(tp,0,0,-0.42);}
  part(tp,G.spike,bone,0,0,0,0.16,0.4,0.04).rotation.x=-Math.PI/2;
  for(const [x,z,h] of [[-0.38,0.5,0],[0.38,0.5,0],[-0.38,-0.55,1],[0.38,-0.55,1]]){const L=quadLeg(R,R.body,x,-0.25,z,1.12,0.2,c,dk,h);for(const k of [-1,0,1])D(part(L.kn,G.spike,bone,k*0.1,-0.58,0.3,0.035,0.14,0.035)).rotation.x=Math.PI/2;}
  R.anim=(t,mv,atk)=>{const st=strikeK(atk),f=7,br=Math.sin(t*1.8);R.legs.forEach((L,i)=>{const ph=(i===0||i===3)?0:Math.PI;const w=Math.sin(t*f+ph)*mv;L.hip.rotation.x=w*0.5+(L.front?-st*0.9:0);L.kn.rotation.x=(L.hind?-1:1)*(Math.max(0,Math.cos(t*f+ph))*0.6*mv+0.12)+(L.front?st*0.5:0);});
    R.body.position.y=1.3+Math.abs(Math.sin(t*f))*0.06*mv+br*0.02+st*0.25;R.body.rotation.x=-st*0.3+Math.sin(t*f)*0.03*mv;
    R.neck.rotation.x=-0.1+br*0.04+st*0.3;R.head.rotation.set(0.15*st+Math.sin(t*0.8)*0.05,Math.sin(t*0.4)*0.25*(1-mv),0);R.jaw.rotation.x=0.05+st*0.55+Math.max(0,Math.sin(t*0.7)-0.9)*2;
    const fl=Math.sin(t*(mv>0.3?9:2.6));R.wings.forEach(({w,s})=>{w.rotation.z=s*(0.25+fl*(mv>0.3?0.45:0.12)+st*0.6);w.rotation.y=s*(0.35-0.3*mv);});
    const p=1+Math.sin(t*3)*0.1+st*0.5;R.belly.scale.set(0.3*p,0.25*p,0.4);R.throat.scale.set(0.1*p,0.05*p,0.18*p);
    R.tail.forEach((q,i)=>{q.rotation.y=Math.sin(t*(mv>0.3?7:2)-i*0.7)*(0.18+0.1*mv);q.rotation.x=i?0.08:0.22;});};return R;}

/* ---------- per-frame hook + camera override for close-up screenshots / benches ---------- */
function updGfxL(dt){GFXL_.t+=dt;if(!GFXL_.town)gfxTownPylon();gfxTownAnim(T);fzPulse(T);
  const c=GFXL_.cam;if(c&&typeof camera!=='undefined'){const tg=c.obj&&c.obj.g?c.obj.g:c.obj;const v=tg&&tg.position?tg.position.clone():new THREE.Vector3(c.x||0,c.y||0,c.z||0);
    const ry=tg&&tg.rotation?tg.rotation.y:0,ang=ry+(c.yaw||0),d=c.d||3;camera.position.set(v.x+Math.sin(ang)*d,v.y+(c.h||1.7),v.z+Math.cos(ang)*d);camera.lookAt(v.x,v.y+(c.ly!=null?c.ly:c.h||1.7),v.z);}}
function gfxCam(o){GFXL_.cam=o||null;}
function gfxLExports(){return {buildHumanoid,faceDefs,setFace,faceKey,buildFace,npcFace,buildBot,buildMorphModel,buildTowerMesh,buildPylon,gfxCam,glMerge,get GFXL(){return GFXL_;},fzp:()=>FZP_?FZP_.length:0,selFaceGet:()=>selFace,
  modelStats:R=>{let meshes=0,vis=0,tris=0;R.g.traverse(o=>{if(o.isMesh){meshes++;if(o.visible){let p=o.parent,ok=true;while(p){if(!p.visible){ok=false;break;}p=p.parent;}if(ok){vis++;const g=o.geometry;tris+=(g.index?g.index.count:g.attributes.position.count)/3;}}}});return {meshes,draws:vis,tris:Math.round(tris),baked:!!R.baked};}};}
