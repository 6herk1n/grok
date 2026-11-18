/* ================= BUILD E: CHARACTER & CREATURE MODELS =================
   Smooth, jointed, procedurally-built rigs (all geometry made in code, nothing imported):
   - Humanoids (players, NPCs, vendors, humanoid enemies): lathe torso, tapered limbs with elbow/knee joints, hands, feet,
     a face (class visor band, nose, ears), hair styles, hoods/robes/heavy pads by option. Gear + clothing attach to the
     moving bones (head, torso, upper arm, forearm, shin) so they follow the animation.
   - Creature families with their own silhouettes: insectoid (skitter line), hound (ash hound, glint stalker),
     grub (rime burrower), beast (maulers, brutes, shamblers, foreman), golem (custodian, slagwarden, hymnwarden).
   - Animation: idle breathing/look-around, walk/run cycle (knees, elbows, arm swing, torso bob/twist), attack (aim or
     melee swing / lunge / slam), hit flinch, death fall (enemies keep their body for ~1 s before vanishing).
   - Performance: one shared geometry set per quality tier (Low = fewer segments) and cached materials; every rig keeps a
     list of "detail" meshes (joints, face, belts, packs...) that are hidden on Low quality and for distant rigs.
   - Bosses render a little larger with a pulsing ground aura. */
var CQ_=null,SMAT_=null;
function cqLow(){if(typeof GFXC!=='undefined'&&GFXC)return GFXC.lvl==='low';try{return localStorage.getItem('dustreach_gfx_v1')==='low';}catch(e){return false;}}
function cq(){if(!CQ_)CQ_={};const k=cqLow()?'lo':'hi';return CQ_[k]||(CQ_[k]=cqMake(k==='lo'));}
function cqMake(lo){const s=lo?6:8,r=lo?4:6;const V2=THREE.Vector2;
  const limb=b=>{const g=new THREE.CylinderGeometry(1,b,1,s,1);g.translate(0,-0.5,0);return g;};
  const G={lo,
    sph:new THREE.SphereGeometry(1,s,r),
    hemi:new THREE.SphereGeometry(1,s,Math.max(3,r>>1),0,Math.PI*2,0,Math.PI/2),
    limb:limb(0.78),taper:limb(0.4),rod:limb(1),
    claw:(()=>{const g=new THREE.ConeGeometry(1,1,lo?4:6);g.translate(0,0.5,0);g.rotateX(Math.PI);return g;})(),
    spike:(()=>{const g=new THREE.ConeGeometry(1,1,lo?4:6);g.translate(0,0.5,0);return g;})(),
    cap:new THREE.CapsuleGeometry(0.5,1,lo?2:3,s),
    torso:new THREE.LatheGeometry([[0.001,0],[0.62,0],[0.57,0.22],[0.74,0.5],[0.95,0.74],[1,0.85],[0.62,0.95],[0.2,1],[0.001,1]].map(p=>new V2(p[0],p[1])),s+2),
    skirt:(()=>{const g=new THREE.CylinderGeometry(0.62,1,1,s+2,1);g.translate(0,-0.5,0);return g;})(),
    ring:new THREE.TorusGeometry(1,0.2,lo?3:5,s+4),
    band:new THREE.CylinderGeometry(1,1,1,s+6,1,true,-1.25,2.5),
    disc:new THREE.CylinderGeometry(1,1,1,s+4,1),
    ico:new THREE.IcosahedronGeometry(1,0),
    aura:new THREE.RingGeometry(0.8,1,lo?24:40).rotateX(-Math.PI/2)};
  for(const k in G)if(G[k]&&G[k].isBufferGeometry)G[k].userData.keep=true;return G;}
// smooth-shaded cached material (M() stays flat-shaded for hard-surface props)
function MS(c){if(!SMAT_)SMAT_={};return SMAT_[c]||(SMAT_[c]=new THREE.MeshLambertMaterial({color:c}));}
function dimc(c,k){return new THREE.Color(c).multiplyScalar(k).getHex();}
function mixc(a,b,k){return new THREE.Color(a).lerp(new THREE.Color(b),k).getHex();}
function hash32(n){n=(n^61)^(n>>>16);n=n+(n<<3);n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);return (n^(n>>>15))>>>0;}
var NAT_SKIN=[0xd8a882,0xb07a54,0x8a5a3a,0x5e3a26,0xe0b896];
function rigLod(R,far){if(!R||!R.det)return;const lo=far||(cqLow()&&!R.isPlayer);if(R.lo===lo)return;R.lo=lo;for(const m of R.det)m.visible=!lo;}

/* ---------- hair (players via clothing, NPCs via a seeded pick) ---------- */
function makeHair(hd,st,col,add){const G=cq();const m=MS(col);
  if(!st||st==='none')return;
  if(st==='ridge'){add(hd,G.sph,m,0,0.215,-0.02,0.045,0.1,0.21);add(hd,G.hemi,MS(dimc(col,0.8)),0,0.095,-0.02,0.193,0.13,0.21).rotation.x=-0.22;return;}
  add(hd,G.hemi,m,0,0.1,-0.016,0.2,0.17,0.216).rotation.x=-0.22;add(hd,G.sph,m,0,0.07,-0.065,0.192,0.15,0.16);
  if(st==='long')add(hd,G.cap,m,0,-0.1,-0.12,0.34,0.17,0.11);
  if(st==='knot')add(hd,G.sph,m,0,0.25,-0.1,0.085,0.085,0.085);}

/* ---------- humanoid ---------- */
function buildHumanoid(body,accent,visor,skin,o){o=o||{};const G=cq();const g=new THREE.Group();const R={g,det:[],kind:'hum',dieAxis:'x',melee:o.melee};
  const D=m=>{R.det.push(m);return m;};
  if(o.npc){const h=hash32((body|0)*7+(accent|0)*13+(visor|0));if(skin==null)skin=NAT_SKIN[h%NAT_SKIN.length];if(o.hair==null)o.hair=['crop','long','knot','ridge','crop','none'][(h>>>3)%6];if(o.hairc==null)o.hairc=[0x2a1d14,0x5a3a22,0xb89060,0x161210,0x8a8a90,0x7a3a1e][(h>>>7)%6];}
  const bulk=o.bulk||1,bm=MS(body),am=MS(accent),lm=MS(o.legc||mixc(0x2c2a2a,body,0.22)),skc=skin==null?0x9a7458:skin,sk=MS(skc),bt=MS(o.boot||0x2a221c),fm=MS(o.forec||dimc(body,0.78));
  R.bulk=bulk;
  R.hips=part(g,G.sph,lm,0,0.96,0,0.19*bulk,0.12,0.13*bulk);
  R.torso=new THREE.Group();R.torso.position.y=0.9;g.add(R.torso);
  R.chest=part(R.torso,G.torso,bm,0,0,0,0.3*bulk,0.68,0.19*bulk);
  D(part(R.torso,G.ring,am,0,0.07,0,0.185*bulk,0.128*bulk,0.35)).rotation.x=Math.PI/2;
  D(part(R.torso,G.ring,am,0,0.655,0,0.13*bulk,0.1*bulk,0.3)).rotation.x=Math.PI/2;
  if(!o.robe)D(part(R.torso,G.cap,am,0,0.42,-0.185*bulk,0.3*bulk,0.2,0.14));
  D(part(R.torso,G.rod,sk,0,0.8,0,0.06,0.14,0.06));
  R.head=new THREE.Group();R.head.position.y=0.82;R.torso.add(R.head);
  part(R.head,G.sph,sk,0,0.08,0,0.185,0.21,0.2);
  if(o.robot){part(R.head,G.band,MB(visor),0,0.1,0,0.198,0.06,0.208);D(part(R.head,G.spike,am,0.12,0.2,-0.03,0.014,0.2,0.014));D(part(R.head,G.ring,am,0,0.02,0,0.19,0.205,0.3)).rotation.x=Math.PI/2;}
  else{D(part(R.head,G.band,MB(visor),0,0.19,0,0.165,0.03,0.18));if(o.face==null)o.face=o.npc&&o.npcFace?o.npcFace:npcFace(body,accent,visor,o.npc);buildFace(R,skc,o,D);for(const s of [-1,1])D(part(R.head,G.sph,sk,s*0.18,0.07,-0.01,0.03,0.05,0.04));}
  if(o.hood){const hm=MS(o.hood);hoodParts(R.head,hm,(p,geo,m,x,y,z,sx,sy,sz)=>part(p,geo,m,x,y,z,sx,sy,sz));}
  else if(o.helm){const hm=o.helmGlow?MB(o.helm):MS(o.helm);part(R.head,G.hemi,hm,0,0.1,0,0.215,0.2,0.226);D(part(R.head,G.ring,am,0,0.1,0,0.216,0.228,0.3)).rotation.x=Math.PI/2;}
  else if(o.brim){const m=MS(o.brim);part(R.head,G.disc,m,0,0.17,0,0.36,0.018,0.36);part(R.head,G.disc,m,0,0.25,0,0.2,0.16,0.2);}
  else if(o.hair&&o.hair!=='none')makeHair(R.head,o.hair,o.hairc||0x2a1d14,(p,geo,m,x,y,z,sx,sy,sz)=>D(part(p,geo,m,x,y,z,sx,sy,sz)));
  if(o.scarf)D(part(R.torso,G.ring,MS(o.scarf),0,0.74,0.01,0.12,0.11,0.6)).rotation.x=Math.PI/2;
  const pk=o.heavy?1.4:1;
  for(const sd of [-1,1]){const L=sd<0?'L':'R';
    const arm=new THREE.Group();arm.position.set(sd*0.36*bulk,1.5,0);g.add(arm);R['arm'+L]=arm;
    part(arm,o.heavy?G.hemi:G.sph,o.padGlow?MB(o.padGlow):am,sd*0.012,o.heavy?-0.03:0.02,0,0.11*bulk*pk,o.heavy?0.13:0.095,0.115*bulk*pk);
    part(arm,G.limb,bm,0,0,0,0.07*bulk,0.34,0.074*bulk);
    const fore=new THREE.Group();fore.position.y=-0.33;arm.add(fore);R['fore'+L]=fore;
    D(part(fore,G.sph,bm,0,0,0,0.06,0.06,0.06));
    part(fore,G.limb,fm,0,0,0,0.058,0.31,0.061);
    (part(fore,G.sph,o.glove?MS(o.glove):sk,0,-0.35,0.012,0.05,0.068,0.046));}
  R.gunMount=new THREE.Group();R.gunMount.position.y=0.33;R.foreR.add(R.gunMount);
  R.gun=part(R.gunMount,geoBox,M(0x222222),0,-0.7,0.25,0.12,0.14,0.62);
  for(const sd of [-1,1]){const L=sd<0?'L':'R';
    const leg=new THREE.Group();leg.position.set(sd*0.115*bulk,0.92,0);g.add(leg);R['leg'+L]=leg;
    part(leg,G.limb,lm,0,0.02,0,0.09*bulk,0.46,0.095*bulk);
    const shin=new THREE.Group();shin.position.y=-0.44;leg.add(shin);R['shin'+L]=shin;
    D(part(shin,G.sph,lm,0,0,0,0.068,0.068,0.07));
    part(shin,G.limb,lm,0,0,0,0.068,0.42,0.072);
    part(shin,G.sph,bt,0,-0.43,0.05,0.07,0.055,0.13);}
  if(o.apron)part(R.torso,G.band,MS(o.apron),0,-0.06,0,0.318*bulk,0.62,0.208*bulk);
  if(o.bag)D(part(R.torso,G.sph,MS(o.bag),0.27*bulk,0.02,0.08,0.08,0.11,0.1));
  if(o.cape){R.cape=part(R.torso,G.skirt,MS(o.cape),0,0.68,-0.15*bulk,0.3*bulk,1.32,0.1);}
  if(o.crystal){const c=part(R.head,G.spike,MB(o.crystal),0.12,0.2,-0.05,0.03,0.26,0.03);c.rotation.z=-0.4;}
  if(o.npc&&!o.armed)R.gun.visible=false;
  if(o.robe){const rm=MS(o.robe);R.robe=part(g,G.skirt,rm,0,1.02,0,0.21*bulk,0.94,0.17*bulk);D(part(g,G.ring,am,0,0.12,0,0.205*bulk,0.165*bulk,0.25)).rotation.x=Math.PI/2;}
  R.extra=[];R.anim=(t,mv,atk,hit)=>{humAnim(R,t,mv,atk,hit||0);for(const f of R.extra)f(t,mv,atk);};
  if(o.npc||o.bake)bakeRig(R);
  return R;}
function humAnim(R,t,mv,atk,hit){const f=10,s=Math.sin(t*f),c=Math.cos(t*f),idle=1-mv,br=Math.sin(t*2.1);
  R.legL.rotation.x=s*0.62*mv;R.legR.rotation.x=-s*0.62*mv;
  R.shinL.rotation.x=Math.max(0,-c)*0.95*mv+0.04;R.shinR.rotation.x=Math.max(0,c)*0.95*mv+0.04;
  R.armL.rotation.set(-s*0.5*mv+br*0.035*idle,0,-0.08-0.02*br*idle);R.armR.rotation.set(s*0.5*mv-br*0.035*idle,0,0.08+0.02*br*idle);
  R.foreL.rotation.x=-(0.14+0.42*mv);R.foreR.rotation.x=-(0.14+0.42*mv);
  const bob=Math.abs(c)*0.035*mv;R.torso.position.y=0.9+bob;R.hips.position.y=0.96+bob;
  R.torso.rotation.set(0.07*mv,s*0.1*mv,0);
  R.chest.scale.set(0.3*R.bulk*(1+br*0.014),0.68*(1+br*0.018),0.19*R.bulk*(1+br*0.03));
  R.head.rotation.set(-0.05*mv+Math.sin(t*0.7)*0.04*idle,Math.sin(t*0.45)*0.24*idle-s*0.08*mv,0);
  if(R.robe)R.robe.rotation.x=0.05*mv;if(R.cape)R.cape.rotation.x=-0.1-0.32*mv+Math.sin(t*1.3)*0.03;
  if(atk>0){const k=clamp(atk/0.35,0,1);
    if(R.melee){const u=1-k;R.armR.rotation.set(-2.5+u*2.9,0,0.28);R.foreR.rotation.x=-0.35;R.torso.rotation.y=0.35*k-0.3*u;R.armL.rotation.x=0.3;}
    else{R.armR.rotation.set(-1.45+(k>0.75?(k-0.75)*1.2:0),0,0.02);R.foreR.rotation.x=-0.06;R.armL.rotation.set(-1.15,0,0.42);R.foreL.rotation.x=-0.75;R.torso.rotation.y=-0.22;}}
  if(hit>0){const h=Math.min(1,hit/0.15);R.torso.rotation.x-=0.24*h;R.head.rotation.x-=0.32*h;R.armL.rotation.z-=0.3*h;R.armR.rotation.z+=0.3*h;}
  if(R.face)faceAnim(R,t,atk,hit);
  if(R.gun&&!R.melee)R.gun.rotation.x=-(R.armR.rotation.x+R.foreR.rotation.x);else if(R.gun)R.gun.rotation.x=0;}
/* ---------- insectoid (skitter line, matriarchs) ---------- */
function buildSkitter(){const G=cq();const g=new THREE.Group();const R={g,det:[],kind:'bug',dieAxis:'z',legs:[],mand:[]};const D=m=>{R.det.push(m);return m;};
  const sh=MS(0xb8642c),dk=MS(0x7a3a1a),lg=MS(0x5a2a12),bone=MS(0xe8c89a),ey=MB(0xff4d4d);
  R.body=new THREE.Group();R.body.position.y=0.62;g.add(R.body);
  R.abd=part(R.body,G.sph,sh,0,0.1,-0.58,0.46,0.36,0.6);
  for(let i=0;i<3;i++){const z=-0.3-i*0.28;const dz=(z+0.58)/0.6;D(part(R.body,G.hemi,dk,0,0.1+0.36*Math.sqrt(Math.max(0,1-dz*dz))-0.06,z,0.32-Math.abs(i-1)*0.04,0.09,0.13));}
  part(R.body,G.sph,sh,0,0.02,0.12,0.34,0.26,0.36);
  R.head=new THREE.Group();R.head.position.set(0,0.02,0.5);R.body.add(R.head);
  part(R.head,G.sph,dk,0,0,0.1,0.25,0.2,0.24);
  for(const s of [-1,1]){part(R.head,G.sph,ey,s*0.11,0.08,0.28,0.055,0.055,0.04);
    const m=new THREE.Group();m.position.set(s*0.12,-0.06,0.26);R.head.add(m);part(m,G.claw,bone,0,0,0,0.05,0.4,0.05).rotation.x=-Math.PI/2;R.mand.push({m,s});
    const an=D(part(R.head,G.spike,dk,s*0.08,0.12,0.2,0.012,0.42,0.012));an.rotation.set(0.95,0,-s*0.3);}
  for(let i=0;i<3;i++)for(const s of [-1,1]){const hip=new THREE.Group();hip.position.set(s*0.22,0,0.32-i*0.3);R.body.add(hip);
    const up=new THREE.Group();up.rotation.z=s*2.15;hip.add(up);part(up,G.limb,lg,0,0,0,0.055,0.44,0.055);
    const kn=new THREE.Group();kn.position.y=-0.44;kn.rotation.z=-s*1.8;up.add(kn);D(part(kn,G.sph,dk,0,0,0,0.062,0.062,0.062));part(kn,G.taper,lg,0,0,0,0.045,0.95,0.045);
    const base=-s*(1-i)*0.45;hip.rotation.y=base;R.legs.push({hip,up,s,base,ph:((i%2)^(s>0?1:0))?Math.PI:0});}
  R.extra=[];
  R.anim=(t,mv,atk,hit)=>{const f=16;for(const L of R.legs){const a=t*f+L.ph;L.hip.rotation.y=L.base+Math.sin(a)*0.32*mv;L.up.rotation.z=L.s*(2.15+Math.max(0,Math.cos(a))*0.35*mv+Math.sin(t*1.3+L.ph)*0.02);}
    const br=Math.sin(t*2.6);R.body.position.y=0.62+Math.abs(Math.sin(t*f))*0.03*mv+br*0.01;R.abd.scale.set(0.46*(1+br*0.03),0.36*(1+br*0.045),0.6);R.abd.rotation.x=Math.sin(t*1.7)*0.05;
    R.head.rotation.set(0,Math.sin(t*0.9)*0.18*(1-mv),0);let open=0.12+Math.sin(t*3.1)*0.06,k=0;if(atk>0){k=clamp(atk/0.35,0,1);open=0.6*k;}
    for(const md of R.mand)md.m.rotation.y=md.s*(open-0.25);
    R.body.rotation.x=-0.38*k+(hit>0?0.2*Math.min(1,hit/0.15):0);R.body.position.z=0.2*k;for(const f2 of R.extra)f2(t,mv,atk);};
  return R;}
/* ---------- hound (ash hound, glint stalker) ---------- */
function buildHound(col,dk,eyeC,o){o=o||{};const G=cq();const g=new THREE.Group();const R={g,det:[],kind:'hound',dieAxis:'z',legs:[]};const D=m=>{R.det.push(m);return m;};
  const c=MS(col),d=MS(dk),ey=MB(eyeC),lean=o.lean||1;
  R.body=new THREE.Group();R.body.position.y=0.86;g.add(R.body);
  part(R.body,G.cap,c,0,0,0,0.46*lean,0.55,0.4).rotation.x=Math.PI/2;
  R.chest=part(R.body,G.sph,c,0,0.04,0.36,0.29*lean,0.3,0.31);part(R.body,G.sph,c,0,0.02,-0.4,0.26*lean,0.26,0.28);
  D(part(R.body,G.hemi,d,0,0.14,-0.05,0.2*lean,0.12,0.5));
  part(R.body,G.cap,c,0,0.24,0.62,0.17,0.2,0.17).rotation.x=-0.75;
  R.head=new THREE.Group();R.head.position.set(0,0.4,0.8);R.body.add(R.head);
  part(R.head,G.sph,c,0,0,0,0.17,0.16,0.2);part(R.head,G.cap,c,0,-0.04,0.2,0.11,0.13,0.1).rotation.x=Math.PI/2;
  D(part(R.head,G.sph,d,0,-0.01,0.34,0.04,0.035,0.035));
  R.jaw=new THREE.Group();R.jaw.position.set(0,-0.08,0.06);R.head.add(R.jaw);part(R.jaw,G.sph,d,0,-0.01,0.14,0.085,0.035,0.16);
  for(const s of [-1,1]){part(R.head,G.sph,ey,s*0.085,0.04,0.165,0.035,0.03,0.025);D(part(R.head,G.spike,d,s*0.085,0.11,-0.04,0.05,o.ears||0.18,0.03)).rotation.z=-s*0.25;}
  const legDef=[[1,1],[-1,1],[1,-1],[-1,-1]];
  for(const [s,f] of legDef){const hip=new THREE.Group();hip.position.set(s*0.17*lean,-0.05,f*0.4);R.body.add(hip);
    const ub=f>0?-0.1:0.38;hip.rotation.x=ub;part(hip,G.limb,c,0,0,0,0.075,0.42,0.08);
    const kn=new THREE.Group();kn.position.y=-0.4;const kb=f>0?0.15:-0.62;kn.rotation.x=kb;hip.add(kn);part(kn,G.taper,d,0,0,0,0.05,0.42,0.052);D(part(kn,G.sph,d,0,-0.42,0.04,0.065,0.045,0.09));
    R.legs.push({hip,kn,ub,kb,f,ph:(s*f>0)?0:Math.PI});}
  R.tail=new THREE.Group();R.tail.position.set(0,0.1,-0.62);R.tail.rotation.x=2.1;R.body.add(R.tail);part(R.tail,G.taper,c,0,0,0,0.06,o.tail||0.55,0.06);
  R.extra=[];
  R.anim=(t,mv,atk,hit)=>{const f=12;for(const L of R.legs){const a=t*f+L.ph;L.hip.rotation.x=L.ub+Math.sin(a)*0.55*mv;L.kn.rotation.x=L.kb+(L.f>0?Math.max(0,Math.cos(a)):-Math.max(0,-Math.cos(a)))*0.6*mv;}
    const br=Math.sin(t*3);R.body.position.y=0.86+Math.abs(Math.sin(t*f))*0.05*mv+br*0.008;R.chest.scale.set(0.29*(1+br*0.04),0.3*(1+br*0.03),0.31);
    R.tail.rotation.set(2.1+Math.sin(t*2)*0.1,0,Math.sin(t*(mv>0.3?14:5))*0.35);R.head.rotation.set(Math.sin(t*0.8)*0.06,Math.sin(t*0.5)*0.3*(1-mv),0);
    let k=0;if(atk>0)k=clamp(atk/0.35,0,1);R.jaw.rotation.x=0.08+0.55*k+(1-mv)*Math.max(0,Math.sin(t*1.3))*0.12;R.head.rotation.x+=0.25*k;R.body.position.z=0.28*k;R.body.rotation.x=-0.12*k+(hit>0?0.16*Math.min(1,hit/0.15):0);
    for(const f2 of R.extra)f2(t,mv,atk);};
  return R;}
/* ---------- grub (rime burrower) ---------- */
function buildGrub(col,dk,glow){const G=cq();const g=new THREE.Group();const R={g,det:[],kind:'grub',dieAxis:'z',segs:[]};const D=m=>{R.det.push(m);return m;};
  const c=MS(col),d=MS(dk),gl=MB(glow);R.body=new THREE.Group();g.add(R.body);
  for(let i=0;i<6;i++){const r=0.42-i*0.045;const sg=new THREE.Group();sg.position.set(0,r,0.55-i*0.34);R.body.add(sg);part(sg,G.sph,c,0,0,0,r*1.05,r,r*0.9);
    if(i>0)D(part(sg,G.ring,d,0,0,0.08,r*0.98,r*0.92,0.25));R.segs.push({sg,r,z:0.55-i*0.34});}
  const h=R.segs[0].sg;R.teeth=[];for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const t=part(h,G.spike,MS(0xe8e0d0),Math.cos(a)*0.2,Math.sin(a)*0.2,0.33,0.04,0.2,0.04);t.rotation.x=Math.PI/2;t.rotation.y=0;R.teeth.push(t);}
  part(h,G.sph,gl,0,0,0.35,0.13,0.13,0.06);
  R.extra=[];
  R.anim=(t,mv,atk,hit)=>{const k=atk>0?clamp(atk/0.35,0,1):0;R.segs.forEach((S,i)=>{S.sg.position.y=S.r+Math.max(0,Math.sin(t*6-i*0.8))*0.08*(0.35+mv)+(i===0?0.4*k:i===1?0.18*k:0);S.sg.position.x=Math.sin(t*5-i*0.7)*0.12*mv;S.sg.scale.setScalar(1+Math.sin(t*2.4-i*0.6)*0.03);});
    R.segs[0].sg.rotation.x=-0.45*k+(hit>0?0.25*Math.min(1,hit/0.15):0);for(const tt of R.teeth)tt.scale.y=0.2*(1+0.6*k);for(const f2 of R.extra)f2(t,mv,atk);};
  return R;}
/* ---------- beast (maulers, brutes, shamblers, foreman, wardens) ---------- */
function buildMauler(){const G=cq();const g=new THREE.Group();const R={g,det:[],kind:'beast',dieAxis:'z',legs:[]};const D=m=>{R.det.push(m);return m;};
  const fur=MS(0x5d4a63),dk=MS(0x463650),hide=MS(0x4a3a52),tusk=MS(0xe8dcc0),ey=MB(0xffd25a),cr=MB(0x5ff2ff);
  R.body=new THREE.Group();R.body.position.y=1.45;g.add(R.body);R.hump=new THREE.Group();R.body.add(R.hump);
  R.trunk=part(R.body,G.sph,fur,0,0.05,0.05,0.82,0.78,0.95);
  part(R.hump,G.sph,dk,0,0.5,-0.2,0.68,0.52,0.66);
  part(R.body,G.sph,fur,0,0.3,0.48,0.95,0.58,0.55);
  D(part(R.body,G.sph,hide,0,-0.32,0.08,0.6,0.48,0.7));
  for(let i=0;i<5;i++){const a=(i-2)*0.42;D(part(R.hump,G.ico,cr,Math.sin(a)*0.45,0.95+Math.cos(a)*0.06-Math.abs(i-2)*0.05,-0.25-Math.abs(i-2)*0.1,0.12,0.22,0.12)).rotation.set(0,i,(i-2)*0.25);}
  R.head=new THREE.Group();R.head.position.set(0,0.12,1.02);R.body.add(R.head);
  part(R.head,G.sph,hide,0,0,0.08,0.4,0.36,0.4);
  D(part(R.head,G.hemi,dk,0,0.12,0.24,0.37,0.13,0.28)).rotation.x=0.25;
  part(R.head,G.sph,hide,0,-0.12,0.36,0.3,0.22,0.25);
  R.jaw=new THREE.Group();R.jaw.position.set(0,-0.2,0.15);R.head.add(R.jaw);part(R.jaw,G.sph,dk,0,-0.04,0.18,0.3,0.12,0.3);
  for(const s of [-1,1]){part(R.jaw,G.spike,tusk,s*0.2,0.0,0.36,0.055,0.3,0.055).rotation.x=-0.35;
    part(R.head,G.sph,ey,s*0.17,0.06,0.43,0.06,0.05,0.04);
    D(part(R.head,G.spike,tusk,s*0.3,0.18,0.02,0.1,0.55,0.1)).rotation.z=-s*0.65;}
  for(const s of [-1,1]){const sh=new THREE.Group();sh.position.set(s*0.8,1.8,0.55);sh.rotation.x=-0.25;g.add(sh);part(sh,G.limb,fur,0,0.05,0,0.26,0.75,0.27);
    const el=new THREE.Group();el.position.y=-0.72;el.rotation.x=0.12;sh.add(el);D(part(el,G.sph,fur,0,0,0,0.22,0.22,0.22));part(el,G.limb,hide,0,0,0,0.25,0.78,0.26);part(el,G.sph,dk,0,-0.8,0.03,0.3,0.25,0.33);
    R.legs.push({j:sh,k:el,b:-0.25,kb:0.12,arm:true,ph:s<0?0:Math.PI});}
  for(const s of [-1,1]){const hp=new THREE.Group();hp.position.set(s*0.45,1.15,-0.55);hp.rotation.x=-0.35;g.add(hp);part(hp,G.limb,fur,0,0.03,0,0.26,0.57,0.28);
    const kn=new THREE.Group();kn.position.y=-0.55;kn.rotation.x=0.7;hp.add(kn);part(kn,G.limb,hide,0,0,0,0.18,0.58,0.2);part(kn,G.sph,dk,0,-0.6,0.1,0.2,0.12,0.3);
    R.legs.push({j:hp,k:kn,b:-0.35,kb:0.7,arm:false,ph:s<0?Math.PI:0});}
  R.extra=[];
  R.anim=(t,mv,atk,hit)=>{const f=7,br=Math.sin(t*1.8);let amt=0;if(atk>0){const u=1-clamp(atk/0.35,0,1);amt=u<0.45?u/0.45:1-(u-0.45)/0.55;}
    for(const L of R.legs){const a=t*f+L.ph;L.j.rotation.x=L.b+Math.sin(a)*(L.arm?0.5:0.4)*mv-(L.arm?2.0*amt:0);L.k.rotation.x=L.kb+(L.arm?-Math.max(0,Math.sin(a))*0.3:Math.max(0,Math.cos(a))*0.5)*mv+(L.arm?0.6*amt:0);}
    R.body.position.y=1.45+Math.abs(Math.sin(t*f))*0.08*mv+br*0.02;R.body.rotation.set(-0.25*amt+(hit>0?0.14*Math.min(1,hit/0.15):0),0,Math.sin(t*f)*0.05*mv);
    R.trunk.scale.set(0.82*(1+br*0.025),0.78*(1+br*0.03),0.95);R.hump.position.y=br*0.02;
    R.head.rotation.set(-0.2*amt+Math.sin(t*0.6)*0.05,Math.sin(t*0.4)*0.25*(1-mv),0);R.jaw.rotation.x=0.05+0.45*amt+(1-mv)*Math.max(0,Math.sin(t*0.9))*0.08;
    for(const f2 of R.extra)f2(t,mv,atk);};
  return R;}
/* ---------- golem / construct (custodian, slagwarden, hymnwarden) ---------- */
function buildGolem(plate,dark,glow){const G=cq();const g=new THREE.Group();const R={g,det:[],kind:'golem',dieAxis:'x',legs:[]};const D=m=>{R.det.push(m);return m;};
  const pl=MS(plate||0x8a96a0),dk=MS(dark||0x3a4048),gl=MB(glow||0x5ff2ff);
  R.body=new THREE.Group();R.body.position.y=1.55;g.add(R.body);
  R.trunk=part(R.body,G.cap,pl,0,0.2,0,0.95,0.55,0.72);
  part(R.body,G.hemi,pl,0,0.3,0.26,0.5,0.32,0.32).rotation.x=Math.PI/2;
  R.core=part(R.body,G.sph,gl,0,0.3,0.5,0.15,0.15,0.1);
  for(const s of [-1,1]){part(R.body,G.sph,pl,s*0.62,0.58,0,0.36,0.32,0.38);D(part(R.body,G.rod,dk,s*0.2,0.7,-0.36,0.06,0.42,0.06)).rotation.x=-0.3;}
  D(part(R.body,G.ring,dk,0,-0.32,0,0.42,0.32,0.4)).rotation.x=Math.PI/2;
  R.head=new THREE.Group();R.head.position.set(0,0.82,0.06);R.body.add(R.head);part(R.head,G.hemi,dk,0,0,0,0.3,0.26,0.28);part(R.head,G.band,gl,0,0.08,0,0.305,0.06,0.285);
  D(part(R.head,G.spike,pl,0.14,0.18,-0.06,0.03,0.24,0.03));
  for(const s of [-1,1]){const sh=new THREE.Group();sh.position.set(s*0.74,2.08,0);g.add(sh);part(sh,G.rod,dk,0,0,0,0.15,0.6,0.15);
    const el=new THREE.Group();el.position.y=-0.6;sh.add(el);D(part(el,G.sph,gl,0,0,0,0.13,0.13,0.13));part(el,G.limb,pl,0,-0.02,0,0.24,0.6,0.22);
    for(let i=0;i<3;i++){const cl=part(el,G.claw,dk,(i-1)*0.1,-0.62,0.06,0.06,0.24,0.06);cl.rotation.x=-0.25;}
    R.legs.push({j:sh,k:el,arm:true,b:0,kb:-0.2,ph:s<0?0:Math.PI});}
  for(const s of [-1,1]){const hp=new THREE.Group();hp.position.set(s*0.33,1.15,0);g.add(hp);part(hp,G.rod,dk,0,0,0,0.17,0.52,0.17);
    const kn=new THREE.Group();kn.position.y=-0.52;hp.add(kn);D(part(kn,G.sph,gl,0,0,0.04,0.12,0.12,0.12));part(kn,G.limb,pl,0,0,0,0.24,0.55,0.27);part(kn,G.sph,dk,0,-0.58,0.08,0.24,0.12,0.34);
    R.legs.push({j:hp,k:kn,arm:false,b:0,kb:0.05,ph:s<0?Math.PI:0});}
  R.extra=[];
  R.anim=(t,mv,atk,hit)=>{const f=6.5,br=Math.sin(t*1.6);let amt=0;if(atk>0){const u=1-clamp(atk/0.35,0,1);amt=u<0.45?u/0.45:1-(u-0.45)/0.55;}
    for(const L of R.legs){const a=t*f+L.ph;if(L.arm){L.j.rotation.x=Math.sin(a)*0.35*mv-2.1*amt+br*0.03;L.k.rotation.x=L.kb-0.25*mv-0.5*amt;}else{L.j.rotation.x=Math.sin(a)*0.45*mv;L.k.rotation.x=L.kb+Math.max(0,Math.cos(a))*0.55*mv;}}
    R.body.position.y=1.55+Math.abs(Math.sin(t*f))*0.06*mv;R.body.rotation.set(-0.2*amt+(hit>0?0.12*Math.min(1,hit/0.15):0),Math.sin(t*f)*0.06*mv,0);
    {const q=1+Math.sin(t*4)*0.18+0.4*amt;R.core.scale.set(0.15*q,0.15*q,0.1*q);}R.head.rotation.y=Math.sin(t*0.5)*0.5*(1-mv);for(const f2 of R.extra)f2(t,mv,atk);};
  return R;}
/* ---------- re-tint (keeps smooth vs flat shading) + family variants ---------- */
function retint(g,col,k,glow){const c=new THREE.Color(col);g.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(m.isMeshLambertMaterial){const h=m.color.clone().lerp(c,k).getHex();o.material=m.vertexColors?MSV(h):(m.flatShading?M:MS)(h);}else if(glow!=null&&m.isMeshBasicMaterial&&!m.transparent){o.material=m.vertexColors?MBV(glow):MB(glow);}});return g;}
const crystalOn=(R,par,n,cols,y,spread,h,zc)=>{const G=cq();for(let i=0;i<n;i++){const a=(i-(n-1)/2);const m=part(par,G.spike,MB(cols[i%cols.length]),a*spread,y-Math.abs(a)*0.05,(zc||0)-Math.abs(a)*0.08,0.07,h*(1-Math.abs(a)*0.12),0.07);m.rotation.set(-0.25,0,-a*0.22);R.det.push(m);}};
const orbit=(R,par,n,col,rad,y,sz)=>{const G=cq();const g=new THREE.Group();g.position.y=y;par.add(g);for(let i=0;i<n;i++){const a=i/n*Math.PI*2;part(g,G.ico,MB(col),Math.cos(a)*rad,0,Math.sin(a)*rad,sz,sz*1.6,sz);}R.extra.push(t=>{g.rotation.y=t*1.4;g.position.y=y+Math.sin(t*2)*0.06;});return g;};
// humanoids
function buildRaider(){return buildHumanoid(0x7a4a2a,0x3d2b1f,0xff3b2f,0x8a5a3a,{hood:0x8a6a48,scarf:0x9c4a2a,legc:0x4a3a2a});}
function buildMiner(){const R=buildHumanoid(0x4a4f52,0x2e3436,0x5ff2ff,0x5a6a70,{helm:0xc8a040,bulk:1.05,glove:0x3a3a30});const G=cq();
  part(R.head,G.sph,MB(0xfff2a0),0,0.2,0.2,0.05,0.04,0.03);crystalOn(R,R.armR,3,[0x5ff2ff,0x9ff8ff],0.12,0.06,0.3,0);R.torso.rotation.x=0.15;
  const a0=R.anim;R.anim=(t,mv,atk,hit)=>{a0(t,mv,atk,hit);R.torso.rotation.x+=0.18;R.head.rotation.z=Math.sin(t*0.6)*0.12;};return R;}
function buildSentry(){return buildHumanoid(0xd8d2c4,0x4f6b80,0x5ff2ff,0x9aa4ad,{robot:1,heavy:1,glove:0x4f6b80,legc:0x4f6b80});}
function buildEnforcer(){const R=buildHumanoid(0x5a1e1e,0x2a1010,0xff3b2f,0x222222,{heavy:1,bulk:1.12,melee:1,helm:0x3a3a3a,glove:0x2a1010});R.gun.scale.set(0.06,0.18,1.0);R.gun.material=M(0xb0b8c0);return R;}
function buildIxo(){const R=buildHumanoid(0x2b3742,0xd8d2c4,0xff9a2a,0x111111,{heavy:1,bulk:1.12,melee:1,helm:0xd8d2c4,padGlow:0xff9a2a,glove:0xd8d2c4});const G=cq();
  for(const s of [-1,1])R.det.push(part(R.head,G.spike,MB(0xff9a2a),s*0.12,0.22,-0.05,0.03,0.22,0.03));R.gun.scale.set(0.07,0.2,1.2);R.gun.material=MB(0xffd25a);return R;}
function buildShardcaller(){const R=buildHumanoid(0x3a3450,0x5a4a7a,0x7ff6ff,0x8a7aa0,{robe:0x2a2438,hood:0x3a3450});orbit(R,R.g,3,0xb48cff,0.55,2.35,0.11);return R;}
function buildTender(){const R=buildHumanoid(0xd8d0f0,0x6a5a8a,0x9fff9a,0x8a7aa0,{robe:0xe8e0ff,hair:'long',hairc:0xd8e8d0});const G=cq();const h=part(R.head,G.ring,MB(0x9fff9a),0,0.42,0,0.22,0.22,0.25);h.rotation.x=Math.PI/2;h.userData.anim=1;
  R.extra.push(t=>{h.position.y=0.42+Math.sin(t*2)*0.03;});return R;}
function buildCantor(){const R=buildHumanoid(0x2a2240,0xb46bff,0xff9af0,0x5a4a6a,{robe:0x1a1428,hood:0x2a2240});const G=cq();part(R.head,G.spike,MB(0xb46bff),0,0.25,-0.02,0.12,0.5,0.12);orbit(R,R.g,2,0xff9af0,0.7,1.7,0.09);return R;}
function buildFrostcaller(){const R=buildHumanoid(0xc8d8e8,0x4a6a88,0x9fe8ff,0x8a9aaa,{robe:0xe8f0f8,hood:0xc8d8e8});const G=cq();
  for(let i=0;i<5;i++){const a=i*1.257;const sp=part(R.head,G.spike,MB(0xbff0ff),Math.cos(a)*0.17,0.26,Math.sin(a)*0.17,0.03,0.2,0.03);sp.rotation.set(Math.sin(a)*0.3,0,-Math.cos(a)*0.3);}
  part(R.gunMount,G.rod,MS(0x8aa4bc),0,-0.1,0.1,0.025,1.4,0.025);part(R.gunMount,G.ico,MB(0x9fe8ff),0,-0.05,0.1,0.08,0.12,0.08);R.gun.visible=false;return R;}
function buildSentinel(){const R=buildHumanoid(0x6a7c90,0x2a3440,0x6fe8ff,0x5a6470,{heavy:1,bulk:1.08,helm:0x8aa4bc});const G=cq();
  const sh=new THREE.Group();sh.position.set(-0.05,-0.42,0.16);R.foreL.add(sh);part(sh,G.cap,MS(0x8aa4bc),0,0,0,0.5,0.4,0.08);part(sh,G.sph,MB(0x6fe8ff),0,0.05,0.045,0.12,0.16,0.02);
  part(R.head,G.spike,MB(0x9fe8ff),0,0.25,0,0.08,0.3,0.08);const a0=R.anim;R.anim=(t,mv,atk,hit)=>{a0(t,mv,atk,hit);R.armL.rotation.x=-0.7;R.foreL.rotation.x=-0.9;R.armL.rotation.z=-0.2;};return R;}
function buildYsra(){const R=buildHumanoid(0xe8f0f8,0x4a6a88,0x6fe8ff,0xc8d8e8,{robe:0xc8dcec,hair:'long',hairc:0xf0f8ff,bulk:1.05});const G=cq();
  for(let i=0;i<7;i++){const a=(i-3)*0.32;const sp=part(R.head,G.spike,MB(i%2?0x9fe8ff:0xffffff),Math.sin(a)*0.18,0.22,-Math.cos(a)*0.02,0.03,0.38-Math.abs(i-3)*0.06,0.03);sp.rotation.z=-a*0.6;}
  const cape=part(R.torso,G.skirt,MS(0x9fb8cc),0,0.66,-0.12,0.3,1.5,0.12);cape.userData.anim=1;R.extra.push((t,mv)=>{cape.rotation.x=-0.12-0.25*mv+Math.sin(t*1.5)*0.03;});return R;}
function buildGloam(){const R=buildHumanoid(0x1a1424,0x0c0a14,0xb46bff,0x2a2038,{hood:0x120e1a,robe:0x140f1e,melee:1});const G=cq();for(const s of [-1,1]){const h=part(R.head,G.spike,MB(0xb46bff),s*0.13,0.18,-0.04,0.03,0.26,0.03);h.rotation.z=-s*0.35;}
  R.gun.scale.set(0.05,0.14,0.9);R.gun.material=MB(0xb46bff);return R;}
function buildWarden(){return buildHumanoid(0x4f6b80,0x22344d,0x5ff2ff,0x2a2a2a,{heavy:1,helm:0x3f8fff,robot:1});}
function buildClanblade(){const R=buildHumanoid(0x8a3a22,0x3a1a10,0xffa040,0xa06a4a,{hair:'ridge',hairc:0xff5a2a,melee:1,scarf:0x3a1a10});R.gun.scale.set(0.05,0.16,0.85);R.gun.material=M(0xc8c0b0);return R;}
// insectoids
function buildVSkitter(){const R=buildSkitter();retint(R.g,0x2f7f9a,0.6,0x5ff2ff);crystalOn(R,R.body,3,[0x7ff6ff,0x5ff2ff],0.42,0.22,0.42,-0.45);return R;}
function buildMatriarch(){const R=buildSkitter();retint(R.g,0x4a2266,0.65,0x5ff2ff);crystalOn(R,R.body,5,[0xb46bff,0x7ff6ff],0.42,0.2,0.6,-0.5);R.abd.scale.z*=1.15;return R;}
function buildChoirmother(){const R=buildSkitter();retint(R.g,0x2a1a4a,0.7,0x7ff6ff);crystalOn(R,R.body,7,[0x7ff6ff,0xb46bff,0xd8c0ff],0.42,0.16,0.62,-0.5);orbit(R,R.body,3,0xd8c0ff,0.7,0.9,0.08);return R;}
function buildShardling(){const R=buildSkitter();retint(R.g,0xa8d0ec,0.8,0x6fe8ff);part(R.body,cq().ico,MB(0xbff0ff),0,0.5,-0.5,0.3,0.4,0.3);return R;}
// hounds + grub
function buildAshhound(){const R=buildHound(0x5a3a2a,0x2a1a12,0xff8a3a,{ears:0.16});crystalOn(R,R.body,4,[0xff8a3a,0xffc070],0.2,0.12,0.22,-0.15);return R;}
function buildStalker(){const R=buildHound(0x3a2a5a,0x1e1630,0x9f7bff,{lean:0.82,ears:0.22,tail:0.7});crystalOn(R,R.body,4,[0xb46bff,0x7ff6ff],0.2,0.13,0.32,-0.1);return R;}
function buildBurrower(){const R=buildGrub(0xc8dcec,0x8aa4bc,0x9fe8ff);for(let i=1;i<5;i++){const S=R.segs[i];const sp=part(S.sg,cq().spike,MB(i%2?0x9fe8ff:0xe8f6ff),0,S.r*0.85,0,0.07,0.3,0.07);R.det.push(sp);}return R;}
// beasts
function buildForeman(){const R=buildMauler();retint(R.g,0x8a5a2a,0.55,0xffb347);const G=cq();part(R.head,G.hemi,MS(0xc8a040),0,0.2,0.08,0.44,0.26,0.44);part(R.head,G.sph,MB(0xfff2a0),0,0.3,0.5,0.08,0.06,0.04);return R;}
function buildColossus(){const R=buildForeman();retint(R.g,0x3a302c,0.8,0xff4a1a);crystalOn(R,R.hump,5,[0xff6a2a,0xffb347],1.0,0.3,0.8,-0.2);return R;}
function buildBrute(){const R=buildMauler();retint(R.g,0x4a4060,0.6,0x7ff6ff);crystalOn(R,R.hump,4,[0x9fe0ff,0x7ff6ff],1.0,0.32,0.7,-0.25);return R;}
function buildShambler(){const R=buildMauler();retint(R.g,0xb8ccdc,0.7,0x9fe8ff);const G=cq();for(let i=0;i<6;i++){const m=part(R.hump,G.ico,MS([0xd8eef8,0xa8c8e0,0xf0f8ff][i%3]),(i%3-1)*0.4,0.9+(i>2?0.15:0),-0.1-(i>2?0.35:0),0.28,0.34,0.28);m.rotation.set(i,i*2,0);}return R;}
function buildRimewarden(){const R=buildMauler();retint(R.g,0xc8dcec,0.8,0x6fe8ff);crystalOn(R,R.hump,5,[0x9fe8ff,0xe8f6ff,0x6fe8ff],1.0,0.38,1.0,-0.25);part(R.head,cq().band,MB(0x6fe8ff),0,0.06,0.08,0.41,0.06,0.41);return R;}
// golems
function buildCustodian(){const R=buildGolem(0x8a96a0,0x3a4048,0x5ff2ff);part(R.head,cq().hemi,MB(0xff3b2f),0,0.22,0,0.12,0.06,0.12);return R;}
function buildSlagwarden(){const R=buildGolem(0x4a2a1e,0x2a1a14,0xff6a2a);crystalOn(R,R.body,3,[0xff6a2a,0xffb347],0.95,0.3,0.6,-0.2);return R;}
function buildHymnwarden(){const R=buildGolem(0x6a6a8a,0x2c2840,0xb46bff);crystalOn(R,R.body,3,[0xd8c0ff,0x7ff6ff],0.95,0.4,0.8,-0.2);orbit(R,R.body,4,0x7ff6ff,1.05,0.4,0.1);return R;}
// casters derived from the sentry: give the ember adept robes
function buildAdept(){const R=buildHumanoid(0x5a3a30,0xffb347,0xffb347,0x8a5a3a,{robe:0x3a2420,hood:0x5a3a30});orbit(R,R.g,2,0xff8a3a,0.5,2.2,0.09);return R;}
function buildCinderguard(){const R=buildEnforcer();retint(R.g,0x4a2a20,0.5,0xff6a2a);return R;}
function buildEmberQueen(){const R=buildMatriarch();retint(R.g,0x7a2410,0.7,0xffb347);return R;}
/* ---------- merge static parts per bone (fewer draw calls) ---------- */
var VMAT_={};
function MSV(c){c=c==null?0xffffff:c;const k='l'+c;return VMAT_[k]||(VMAT_[k]=new THREE.MeshLambertMaterial({color:c,vertexColors:true}));}
function MBV(c){c=c==null?0xffffff:c;const k='b'+c;return VMAT_[k]||(VMAT_[k]=new THREE.MeshBasicMaterial({color:c,vertexColors:true}));}
function rigGeoOk(g){return !!g&&(g.userData.keep||g===geoBox||g===geoIco||g===geoCone||g===geoSphere);}
// one indexed geometry per material class; every source part becomes a rigid bone (skinIndex = its bone, weight 1)
function mergeSkinned(L,boneOf){let nv=0,ni=0;const src=[];for(const c of L){const g=c.geometry;const cnt=g.attributes.position.count;src.push(c);nv+=cnt;ni+=g.index?g.index.count:cnt;}
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),col=new Float32Array(nv*3),si=new Uint16Array(nv*4),sw=new Float32Array(nv*4),idx=(nv>65535?new Uint32Array(ni):new Uint16Array(ni));
  const v=new THREE.Vector3(),nm=new THREE.Matrix3();let o=0,io=0;
  for(const c of src){const g=c.geometry,P=g.attributes.position,N=g.attributes.normal,cnt=P.count,mw=c.matrixWorld,cl=c.material.color,bi=boneOf(c);nm.getNormalMatrix(mw);
    for(let i=0;i<cnt;i++){v.fromBufferAttribute(P,i).applyMatrix4(mw);pos[(o+i)*3]=v.x;pos[(o+i)*3+1]=v.y;pos[(o+i)*3+2]=v.z;
      v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();nor[(o+i)*3]=v.x;nor[(o+i)*3+1]=v.y;nor[(o+i)*3+2]=v.z;
      col[(o+i)*3]=cl.r;col[(o+i)*3+1]=cl.g;col[(o+i)*3+2]=cl.b;si[(o+i)*4]=bi;sw[(o+i)*4]=1;}
    if(g.index){const I=g.index.array;for(let k=0;k<I.length;k++)idx[io+k]=I[k]+o;io+=I.length;}else{for(let k=0;k<cnt;k++)idx[io+k]=o+k;io+=cnt;}o+=cnt;}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(pos,3));G.setAttribute('normal',new THREE.BufferAttribute(nor,3));G.setAttribute('color',new THREE.BufferAttribute(col,3));
  G.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));G.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));G.setIndex(new THREE.BufferAttribute(idx,1));G.computeBoundingSphere();G.boundingSphere.radius*=1.25;return G;}
function bakeRig(R){if(!R||R.baked||!R.det)return R;R.baked=1;const g=R.g;
  const sp=g.position.clone(),sq=g.quaternion.clone(),ss=g.scale.clone();g.position.set(0,0,0);g.quaternion.identity();g.scale.set(1,1,1);g.updateMatrixWorld(true);
  const det=new Set(R.det),bk={},bones=[],bIdx=new Map();
  g.traverse(c=>{if(!c.isMesh||c.children.length||!c.visible||!rigGeoOk(c.geometry))return;let p=c.parent,vis=true;while(p&&p!==g){if(!p.visible)vis=false;p=p.parent;}if(!vis)return;
    const m=c.material;if(!m||Array.isArray(m)||m.transparent||m.vertexColors||!(m.isMeshLambertMaterial||m.isMeshBasicMaterial))return;
    const key=(m.isMeshBasicMaterial?'b':'l')+(det.has(c)?'d':'');(bk[key]=bk[key]||[]).push(c);bIdx.set(c,bones.length);bones.push(c);});
  if(bones.length<3){g.position.copy(sp);g.quaternion.copy(sq);g.scale.copy(ss);return R;}
  const skel=new THREE.Skeleton(bones);const nd=[];R.skins=[];
  for(const key in bk){const sm=new THREE.SkinnedMesh(mergeSkinned(bk[key],c=>bIdx.get(c)),key[0]==='b'?MBV():MSV());sm.userData.merged=1;g.add(sm);sm.updateMatrixWorld(true);sm.bind(skel,new THREE.Matrix4());R.skins.push(sm);if(key[1]==='d')nd.push(sm);}
  for(const c of bones){c.visible=false;c.userData.bone=1;}
  R.det=R.det.filter(m=>!m.userData.bone).concat(nd);R.lo=null;R.skel=skel;
  g.position.copy(sp);g.quaternion.copy(sq);g.scale.copy(ss);g.updateMatrixWorld(true);return R;}
function disposeRig(R){if(!R||!R.g)return;R.g.traverse(o=>{if(o.userData&&o.userData.merged&&o.geometry)o.geometry.dispose();});if(R.skel&&R.skel.dispose){R.skel.dispose();R.skel=null;}}
/* ---------- death / hit / boss presentation ---------- */
var CORPSES=[];
function dieStart(e){const R=e.R,g=R&&R.g;if(!g)return;const near=g.parent&&!e.bur&&g.visible&&dist2D(e.pos,P.pos)<70;
  if(!near){g.visible=false;return;}if(R.aura)R.aura.visible=false;g.rotation.order='YXZ';R.dieK=0;CORPSES.push({e,R,g,t:0,y0:g.position.y});if(R.anim)try{R.anim(e.animT||0,0,0,0.15);}catch(err){}}
function dieStep(dt){for(let i=CORPSES.length-1;i>=0;i--){const c=CORPSES[i],R=c.R,g=c.g;c.t+=dt;const k=Math.min(1,c.t/0.55),ease=1-Math.pow(1-k,3);
    if(c.e.dead===false||R.dieK==null){g.rotation.x=g.rotation.z=0;g.rotation.order='XYZ';CORPSES.splice(i,1);continue;}
    const ax=R.dieAxis||'x';if(ax==='x'){g.rotation.x=(R.kind==='golem'?1.35:-1.45)*ease;g.rotation.z=0;}else{g.rotation.z=(R.kind==='bug'?2.7:1.45)*ease;g.rotation.x=0;}
    const sc=g.scale.x||1;g.position.y=c.y0+(R.kind==='bug'?0.7:0.22)*sc*Math.sin(ease*Math.PI*0.5)-(c.t>0.9?(c.t-0.9)*1.6*sc:0);
    if(c.t>=1.35||!g.parent){g.visible=false;g.rotation.x=g.rotation.z=0;g.rotation.order='XYZ';R.dieK=null;if(c.rm&&g.parent)g.parent.remove(g);CORPSES.splice(i,1);}}}
function dieReset(e){const R=e.R;if(!R)return;R.dieK=null;const g=R.g;g.rotation.x=g.rotation.z=0;g.rotation.order='XYZ';const i=CORPSES.findIndex(c=>c.R===R);if(i>=0)CORPSES.splice(i,1);if(R.aura)R.aura.visible=true;}
function bossDress(e){const R=e.R;if(R.aura||!R.g)return;const m=new THREE.MeshBasicMaterial({color:e.boss&&e.boss.final?0xff4a2a:0xffa040,transparent:true,opacity:0.45,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const r=new THREE.Mesh(cq().aura,m);const hr=(e.T.hitR||1)*1.5;r.scale.set(hr,1,hr);r.position.y=0.06;r.userData.aura=1;R.g.add(r);R.aura=r;R.bossMul=1.12;}
function enemyPresent(e,dP){const R=e.R;if(e.boss&&!R.aura)bossDress(e);rigLod(R,dP>(GFXC&&GFXC.lvl==='high'?45:30));
  if(R.aura){const p=0.5+0.5*Math.sin(T*3);R.aura.material.opacity=0.25+p*0.3;const s=(e.T.hitR||1)*(1.4+p*0.15);R.aura.scale.set(s,1,s);R.aura.rotation.y=T*0.4;}}
/* ---------- player gear visuals (shape by armour family, colour by family/rarity) ---------- */
var HAIRC={black:{n:'Black',c:0x161210},brown:{n:'Brown',c:0x4a2e1a},auburn:{n:'Auburn',c:0x7a3a1e},blonde:{n:'Blonde',c:0xc8a060},grey:{n:'Grey',c:0x8a8a90},white:{n:'White',c:0xe8e4dc}};
function hairCol(k){return k&&HAIRC[k]?HAIRC[k].c:k&&typeof DYES!=='undefined'&&DYES[k]?DYES[k].c:0x2a1d14;}
function refreshGearVisual(){if(!PM)return;clearVeil();if(PM.gear){PM.gear.forEach(m=>m.parent&&m.parent.remove(m));}PM.gear=[];const eq=P.eq||{},G=cq(),b=PM.bulk||1;
  const add=(par,geo,m,x,y,z,sx,sy,sz)=>{const o=part(par,geo,m,x,y,z,sx,sy,sz);PM.gear.push(o);return o;};
  const ring=(par,m,y,rx,rz,th)=>{const o=add(par,G.ring,m,0,y,0,rx,rz,th);o.rotation.x=Math.PI/2;return o;};
  const famC=it=>it.r>=4?RAR[it.r].h:(AFAM[it.fam||'medium']||AFAM.medium).col,trimM=it=>it.r>=3?MB(RAR[it.r].h):MS(RAR[it.r]?RAR[it.r].h:0x888888);
  const w=eq.weapon,W=w&&WTYPES[w.wt];const ms=W?W.mesh:{l:0.62,w:0.12,c:0x222222};const leg=w&&w.r>=4;PM.melee=!!(W&&W.melee);
  PM.gun.scale.set(ms.w,ms.w*1.15,ms.l);PM.gun.position.set(0,-0.7,0.08+ms.l*0.32);PM.gun.material=(ms.glow||leg)?MB(leg?RAR[w.r].h:ms.c):M(ms.c);
  if(W&&W.melee){PM.gun.scale.set(0.05,0.16,ms.l);}if(w&&w.wt==='fist'){PM.gun.scale.set(0.15,0.15,0.17);PM.gun.position.set(0,-0.74,0.03);}
  if(w&&w.r>=2)PM.gear.push(part(PM.gun,geoBox,MB(RAR[w.r].h),0,0.52,0.05,1.04,0.12,0.7));
  PM.helmOn=false;const h=eq.head;
  if(h&&!clothHides('head')){const c=MS(famC(h)),t=trimM(h);PM.helmOn=true;
    if(h.fam==='light'){hoodParts(PM.head,c,add);add(PM.head,G.ring,t,0,0.08,0.13,0.17,0.22,0.12);}
    else{add(PM.head,G.hemi,c,0,0.1,0,0.218,0.205,0.229);ring(PM.head,t,0.1,0.22,0.232,0.32);
      if(h.fam==='heavy'){add(PM.head,G.band,c,0,-0.04,0,0.214,0.1,0.224);add(PM.head,G.sph,t,0,0.27,-0.02,0.028,0.07,0.17);}
      else add(PM.head,G.sph,c,0,0.02,-0.12,0.17,0.12,0.11);}}
  const a=clothHides('armor')?null:eq.armor;
  if(a){const c=MS(famC(a)),t=trimM(a);
    if(a.fam==='heavy'){for(const arm of [PM.armL,PM.armR]){add(arm,G.hemi,c,0,0.0,0,0.17*b,0.15,0.17*b);ring(arm,t,0,0.16*b,0.16*b,0.25);}
      add(PM.torso,G.torso,c,0,0.2,0.0,0.33*b,0.48,0.22*b);ring(PM.torso,t,0.24,0.205*b,0.135*b,0.32);}
    else if(a.fam==='medium'){add(PM.torso,G.band,c,0,0.46,0,0.3*b,0.26,0.205*b);ring(PM.torso,t,0.33,0.24*b,0.15*b,0.25);for(const arm of [PM.armL,PM.armR])add(arm,G.sph,c,0,0.01,0,0.12*b,0.1,0.12*b);}
    else{add(PM.g,G.skirt,c,0,1.0,0,0.22*b,0.5,0.18*b);ring(PM.torso,t,0.08,0.2*b,0.14*b,0.3);}
    if(a.r>=4)ring(PM.torso,MB(RAR[a.r].h),0.5,0.29*b,0.185*b,0.18);}
  const hd=eq.hands;if(hd){const c=MS(famC(hd)),t=trimM(hd);for(const f of [PM.foreL,PM.foreR]){add(f,G.sph,c,0,-0.35,0.012,0.058,0.076,0.054);ring(f,t,-0.27,0.066,0.068,0.28);}}
  const lg=eq.legs;if(lg){const c=MS(famC(lg)),t=trimM(lg);for(const s of [PM.shinL,PM.shinR]){add(s,G.sph,c,0,0.0,0.045,0.07,0.085,0.055);if(lg.fam!=='light')add(s,G.band,t,0,-0.08,0,0.074,0.18,0.078);}
    for(const l of [PM.legL,PM.legR])ring(l,t,-0.05,0.095*b,0.1*b,0.25);}
  const ft=eq.feet;if(ft){const c=MS(famC(ft)),t=trimM(ft);for(const s of [PM.shinL,PM.shinR]){add(s,G.sph,c,0,-0.43,0.05,0.08,0.066,0.142);add(s,G.limb,c,0,-0.24,0,0.074,0.16,0.078);ring(s,t,-0.25,0.076,0.08,0.25);}}
  clothVisual();}
/* ---------- clothing + hair on the rig ---------- */
function clothVisual(){if(!PM)return;if(PM.cloth)PM.cloth.forEach(m=>m.parent&&m.parent.remove(m));PM.cloth=[];const C=P.clothing;if(!C||!C.wear)return;const eq=P.eq||{},G=cq(),b=PM.bulk||1;
  const bodyOn=C.over||!eq.armor,headOn=C.over||!eq.head;
  const mat=s=>{const c=CLOTH[C.wear[s]],d=DYES[C.dye[s]];const col=d?d.c:c.col;return (d&&d.glow)||c.lit?MB(col):MS(col);};
  const P_=(par,geo,m,x,y,z,sx,sy,sz)=>{const o=part(par,geo,m,x,y,z,sx,sy,sz);PM.cloth.push(o);return o;};
  const ring=(par,m,y,rx,rz,th)=>{const o=P_(par,G.ring,m,0,y,0,rx,rz,th);o.rotation.x=Math.PI/2;return o;};
  const sleeves=(m,len,fore)=>{for(const a of [PM.armL,PM.armR])P_(a,G.limb,m,0,0.01,0,0.079*b,len,0.083*b);if(fore)for(const f of [PM.foreL,PM.foreR])P_(f,G.limb,m,0,0.01,0,0.066,fore,0.069);};
  const hatOn=C.wear.hat&&headOn;
  if(PM.face&&PM.face.brow)PM.face.brow.material=MS(hairCol(C.hairc));
  if(C.hair&&C.hair!=='none'&&!hatOn&&!PM.helmOn)makeHair(PM.head,C.hair,hairCol(C.hairc),P_);
  if(bodyOn&&C.wear.shirt){const c=CLOTH[C.wear.shirt],m=mat('shirt');P_(PM.torso,G.torso,m,0,0,0,0.31*b,0.665,0.2*b);sleeves(m,c.st==='tee'?0.17:0.34,c.st==='tee'?0:0.29);if(c.st==='shirt')ring(PM.torso,m,0.655,0.14*b,0.11*b,0.35);
    if(c.glow){ring(PM.torso,MB(c.glow),0.2,0.19*b,0.125*b,0.18);ring(PM.torso,MB(c.glow),0.4,0.25*b,0.16*b,0.18);}}
  if(bodyOn&&C.wear.jacket){const c=CLOTH[C.wear.jacket],m=mat('jacket');
    if(c.st==='vest'){P_(PM.torso,G.torso,m,0,0.08,0,0.322*b,0.57,0.212*b);for(const s of [-1,1])P_(PM.torso,G.sph,MS(0x2a2a2a),s*0.11,0.26,0.17*b,0.06,0.05,0.025);}
    else{P_(PM.torso,G.torso,m,0,0,0,0.325*b,0.67,0.215*b);sleeves(m,0.35,0.3);ring(PM.torso,c.st==='jacket'?MS(0xe6dcc6):m,0.66,0.155*b,0.125*b,0.45);
      if(c.st==='long'){P_(PM.g,G.skirt,m,0,1.0,0,0.24*b,0.62,0.2*b);if(c.glow){P_(PM.torso,G.rod,MB(c.glow),0,0.62,0.205*b,0.012,0.6,0.012);ring(PM.g,MB(c.glow),0.39,0.235*b,0.198*b,0.12);}}}}
  if(hatOn){const c=CLOTH[C.wear.hat],m=mat('hat');
    if(c.st==='brim'){P_(PM.head,G.disc,m,0,0.17,0,0.36,0.018,0.36);P_(PM.head,G.disc,m,0,0.25,0,0.2,0.16,0.2);}
    else if(c.st==='cap'){P_(PM.head,G.hemi,m,0,0.1,0,0.207,0.2,0.217);P_(PM.head,G.disc,m,0,0.11,0.18,0.15,0.014,0.12);}
    else if(c.st==='beanie'){P_(PM.head,G.hemi,m,0,0.105,-0.01,0.215,0.22,0.226).rotation.x=-0.15;P_(PM.head,G.sph,MB(0xffc85a),0,0.34,0,0.045,0.045,0.045);}
    else if(c.st==='halo'){ring(PM.head,MB(c.glow),0.44,0.24,0.24,0.14);}}
  if(C.wear.visor&&headOn){const c=CLOTH[C.wear.visor],m=mat('visor');
    if(c.st==='goggles'){for(const s of [-1,1]){const l=P_(PM.head,G.disc,m,s*0.075,0.1,0.185,0.062,0.04,0.062);l.rotation.x=Math.PI/2;}ring(PM.head,MS(0x3a2a1a),0.1,0.2,0.21,0.14);}
    else P_(PM.head,G.band,m,0,0.1,0,0.204,0.066,0.214);}}
/* ---------- character creation: look picker + live preview ---------- */
var selHair='crop',selHairC=null,prevCam=null,selFace='steady',prevFaceT=0;
function renderLook(){const hr=$('#hairRow'),cr=$('#hairCRow');if(!hr||!cr)return;const fr=$('#faceRow'),FD=faceDefs();
  if(fr)fr.innerHTML=Object.keys(FD).map(k=>`<button data-fs="${k}" class="${k===selFace?'on':''}" title="${FD[k].n}">${FD[k].icon} ${FD[k].n}</button>`).join('');
  hr.innerHTML=Object.keys(HAIR).map(k=>`<button data-hs="${k}" class="${k===selHair?'on':''}">${HAIR[k]}</button>`).join('');
  cr.innerHTML=[['',0x2a1d14,'Dark']].concat(Object.keys(HAIRC).map(k=>[k,HAIRC[k].c,HAIRC[k].n])).map(([k,c,n])=>`<button data-hc="${k}" class="hc${(selHairC||'')===k?' on':''}" title="${n}" aria-label="${n}"><span class="sw" style="background:#${c.toString(16).padStart(6,'0')}"></span></button>`).join('');}
function lookInit(){const hr=$('#hairRow'),cr=$('#hairCRow');if(!hr||hr.dataset.wired)return;hr.dataset.wired=1;
  hr.addEventListener('click',e=>{const b=e.target.closest('[data-hs]');if(!b)return;selHair=b.dataset.hs;SFX.ui();renderLook();previewProf();});
  cr.addEventListener('click',e=>{const b=e.target.closest('[data-hc]');if(!b)return;selHairC=b.dataset.hc||null;SFX.ui();renderLook();previewProf();});
  const fr=$('#faceRow');if(fr)fr.addEventListener('click',e=>{const b=e.target.closest('[data-fs]');if(!b)return;selFace=faceKey(b.dataset.fs);prevFaceT=performance.now()+2600;SFX.ui();renderLook();previewProf();});}
function previewProf(){P.prof=selProf;P.breed=selBreed;P.clothing=normCloth({hair:selHair,hairc:selHairC,face:selFace});
  try{const w=genItem(1,'weapon',0,{wt:PROF_WT[selProf]}),a=genItem(1,'armor',0,{fam:PROF_FAM[selProf]});P.eq={weapon:w,armor:a};}catch(err){}
  buildPlayerModel();lookInit();renderLook();}
function createPreview(){const cv=$('#cPrev');if(!cv||!PM||!cv.getClientRects().length||getComputedStyle(cv).display==='none')return;const ctx=cv.getContext('2d');if(!ctx)return;
  const pr=renderer.getPixelRatio(),W=cv.width,Hh=cv.height,sz=renderer.getDrawingBufferSize(new THREE.Vector2());
  // Build P: phones in landscape (Safari bars) can have a drawing buffer shorter than the 336px preview canvas; render smaller and scale up instead of skipping (was: blank preview on phones)
  const k=Math.min(1,sz.x/W,sz.y/Hh),cw=Math.max(1,Math.floor(W*k/pr)),ch=Math.max(1,Math.floor(Hh*k/pr));if(!prevCam)prevCam=new THREE.PerspectiveCamera(30,W/Hh,0.1,200);prevCam.aspect=W/Hh;prevCam.updateProjectionMatrix();
  const hs=(PM.g.scale.y||1),fz=performance.now()<prevFaceT;if(fz){prevCam.position.set(0,1.86*hs,14+1.25*hs);prevCam.lookAt(0,1.8*hs,14);}else{prevCam.position.set(0,1.25*hs,14+5.6*hs);prevCam.lookAt(0,1.0*hs,14);}
  renderer.setScissorTest(true);renderer.setScissor(0,0,cw,ch);renderer.setViewport(0,0,cw,ch);renderer.render(scene,prevCam);
  try{ctx.clearRect(0,0,W,Hh);ctx.drawImage(renderer.domElement,0,sz.y-ch*pr,cw*pr,ch*pr,0,0,W,Hh);}catch(err){}
  renderer.setScissorTest(false);const s2=renderer.getSize(new THREE.Vector2());renderer.setViewport(0,0,s2.x,s2.y);renderer.setScissor(0,0,s2.x,s2.y);}
