(function(){
'use strict';
const V3=THREE.Vector3;
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const srng=mulberry32(90210);
const srand=(a,b)=>a+srng()*(b-a);
const SAVE_KEY='dustreach_save_v1';
// all localStorage writes go through here: a failed write (storage full, private mode, quota) is shown, never silently dropped
const SAVEST={fails:0,lastWarn:-1e9,lastOk:0,lastErr:''};
function lsSet(k,v){if(window.__drNoSave)return false;try{localStorage.setItem(k,v);SAVEST.lastOk=Date.now();return true;}catch(e){SAVEST.fails++;SAVEST.lastErr=String(e&&e.name||e);storageWarn(k,e);return false;}}
function storageWarn(k,e){const now=Date.now();if(now-SAVEST.lastWarn<20000)return;SAVEST.lastWarn=now;const msg='⚠ Could not save ('+(e&&e.name==='QuotaExceededError'?'storage full':'storage blocked')+'). Export your save from the menu to keep it safe.';
  try{if(typeof toast==='function'&&document.querySelector('#toast'))toast(msg);else console.log(msg);}catch(x){}
  try{const el=document.querySelector('#saveWarn');if(el){el.textContent=msg;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),9000);}}catch(x){}}
let uidN=Date.now()%100000;const uid=()=>'i'+(uidN++).toString(36)+Math.floor(Math.random()*1e4).toString(36);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------------- audio ---------------- */
let AC=null,sfxOn=true,noiseBuf=null;
function audioInit(){
  if(AC){if(AC.state==='suspended')AC.resume();return;}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();
    noiseBuf=AC.createBuffer(1,AC.sampleRate*0.3,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }catch(e){AC=null;}
}
function tone(f,dur,type,vol,slide){
  if(!AC||!sfxOn)return;const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+dur);
  g.gain.setValueAtTime(vol||0.05,t);g.gain.exponentialRampToValueAtTime(0.0008,t+dur);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+dur+0.03);
}
function nz(dur,vol,freq){
  if(!AC||!sfxOn||!noiseBuf)return;const t=AC.currentTime;const s=AC.createBufferSource();s.buffer=noiseBuf;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=freq||1800;const g=AC.createGain();
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0008,t+dur);s.connect(f);f.connect(g);g.connect(AC.destination);s.start(t);s.stop(t+dur);
}
const SFX={
  shoot:()=>{tone(900,0.09,'square',0.035,-600);nz(0.06,0.05,3000);},
  zap:()=>tone(500,0.28,'sawtooth',0.045,1100),
  boom:()=>{nz(0.35,0.14,900);tone(120,0.3,'sine',0.08,-60);},
  hit:()=>nz(0.07,0.07,2200),
  hurt:()=>tone(170,0.16,'sawtooth',0.06,-90),
  heal:()=>{tone(523,0.14,'sine',0.06);setTimeout(()=>tone(784,0.2,'sine',0.06),90);},
  level:()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,0.28,'triangle',0.07),i*110)),
  loot:()=>tone(1100,0.12,'sine',0.05,500),
  coin:()=>{tone(1400,0.06,'square',0.025);setTimeout(()=>tone(1900,0.08,'square',0.025),60);},
  ui:()=>tone(700,0.05,'sine',0.03),
  err:()=>tone(200,0.1,'square',0.03),
  death:()=>tone(320,0.9,'sawtooth',0.07,-260),
  quest:()=>[392,523,659].forEach((f,i)=>setTimeout(()=>tone(f,0.22,'triangle',0.06),i*120))
};

/* ---------------- renderer / scene ---------------- */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:(window.devicePixelRatio||1)<2,powerPreference:'high-performance'});
let pixelRatio=Math.min(window.devicePixelRatio||1,2);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth,innerHeight);
const scene=new THREE.Scene();
const FOG=0xe9b98a;
scene.fog=new THREE.Fog(FOG,70,240);
scene.background=new THREE.Color(FOG);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.3,520);
const hemi=new THREE.HemisphereLight(0xffe2c0,0x6a3a22,0.7);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,0.9);sun.position.set(80,120,40);scene.add(sun);
function onResize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',onResize);addEventListener('orientationchange',()=>setTimeout(onResize,250));

// sky dome
(function(){
  const g=new THREE.SphereGeometry(480,24,14);const c=[];const p=g.attributes.position;
  const top=new THREE.Color(0x3d6fa8),mid=new THREE.Color(0xf2c48c),low=new THREE.Color(FOG);
  for(let i=0;i<p.count;i++){const y=p.getY(i)/480;const col=new THREE.Color();if(y>0.08)col.copy(mid).lerp(top,Math.min(1,(y-0.08)/0.6));else col.copy(low).lerp(mid,clamp((y+0.05)/0.13,0,1));c.push(col.r,col.g,col.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));
  m.renderOrder=-10;scene.add(m);window.__sky=m;
  const s1=new THREE.Mesh(new THREE.CircleGeometry(26,20),new THREE.MeshBasicMaterial({color:0xfff6dc,fog:false,depthWrite:false}));
  const s2=new THREE.Mesh(new THREE.CircleGeometry(13,16),new THREE.MeshBasicMaterial({color:0xffb38a,fog:false,depthWrite:false}));
  s1.position.set(200,260,-300);s2.position.set(-140,200,-360);s1.lookAt(0,0,0);s2.lookAt(0,0,0);m.add(s1);m.add(s2);s1.renderOrder=s2.renderOrder=-9;
})();

/* ---------------- terrain ---------------- */
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi;const u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
  return lerp(lerp(hash(xi,zi),hash(xi+1,zi),u),lerp(hash(xi,zi+1),hash(xi+1,zi+1),u),v);}
function fbm(x,z){let s=0,a=1,f=1,n=0;for(let i=0;i<4;i++){s+=vnoise(x*f,z*f)*a;n+=a;a*=0.5;f*=2.03;}return s/n;}
function smooth(e0,e1,x){const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);}
const WORLD=2400,HALF=WORLD/2,SEG=600,CELL=WORLD/SEG,N1=SEG+1,CORE_HALF=260;// world grew 520 -> 880 -> 1280 -> 1760 -> 2400 m square (4 m cells kept); the old worlds sit unchanged in the middle: Duskcrown Highlands (Lv 11-20) ring them, the Rimefall Expanse (Lv 21-30) rings that
const TOWN=31;
// small desert outposts (safe zones with a Conduit node, Save Point and teleporter pad)
const OUTPOSTS=[{id:'cinderwell',name:'Cinderwell Post',x:0,z:-80,r:11},{id:'glassreach',name:'Glassreach Camp',x:172,z:-10,r:11},{id:'farwatch',name:'Farwatch Station',x:-407,z:235,r:13,hub:true},{id:'hoarlight',name:'Hoarlight Hold',x:606,z:-350,r:14,hub:true,pal:[0xc9d6e2,0x8ea2b6,0xe2ebf2,0x3f6890]},
  // Build J (cap 50): hubs of the two corner regions
  {id:'lanternmoor',name:'Lanternmoor Station',x:-668,z:668,r:14,hub:true,pal:[0x6a7a5a,0x46523e,0x9aa888,0x3fd8a8]},{id:'sunderwatch',name:'Sunderwatch',x:668,z:668,r:14,hub:true,pal:[0x5a4444,0x3a2a2a,0x8a6a62,0xff6a3a]}];
/* ---------- Duskcrown Highlands (Lv 11-20): the outer ring. Level rises with the angular distance from Farwatch (150 deg): 11 there, 20 on the far side (330 deg). ---------- */
const GLOAM={r0:392,r1:440,hubDeg:150,door:{x:-122,z:-461}};
function gloamLv(x,z){const a=Math.atan2(z,x)*180/Math.PI;let d=Math.abs(((a-GLOAM.hubDeg)%360+540)%360-180);return Math.round(11+9*d/180);}
const gloamAt=(deg,r)=>{const a=deg*Math.PI/180;return [Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r)];};
/* ---------- Rimefall Expanse (Lv 21-30, Build C): the new outermost ring. Level rises with the angular distance from Hoarlight Hold (330 deg, next to the Lv 20 end of the Duskcrown): 21 there, 30 on the far side (150 deg). ---------- */
const RIME={r0:612,r1:662,hubDeg:330,door:{x:-236,z:-648}};
function rimeLv(x,z){const a=Math.atan2(z,x)*180/Math.PI;let d=Math.abs(((a-RIME.hubDeg)%360+540)%360-180);return Math.round(21+9*d/180);}
const rimeAt=gloamAt;
/* ---------- Build J (level cap 50): the four corners of the world beyond the Rimefall (r > ~880) become two new regions ----------
   Mirelight Fen (Lv 31-40): the two west corners (31-35 in the north-west corner around Lanternmoor Station, 36-40 in the south-west).
   Sundered Heights (Lv 41-50): the two east corners (41-45 around Sunderwatch in the north-east, 46-50 in the south-east).
   Level rises with depth into each corner. Further raises (51-100) add regions by data (XREG) once the world grows. */
const XR={r0:862,r1:902,fenDoor:{x:-707,z:-707},sunDoor:{x:707,z:-707}};
function xrDepth(x,z){return clamp((Math.hypot(x,z)-885)/235,0,1);}
function fenLv(x,z){return (z>0?31:36)+Math.round(4*xrDepth(x,z));}
function sunderLv(x,z){return (z>0?41:46)+Math.round(4*xrDepth(x,z));}
/* ---------- Build M (level cap 100): an outer shell beyond the old world edge (max(|x|,|z|) ~905-1200) split into five 72-degree sectors,
   one region per 10-level band (51-60 ... 91-100). Sector 0 starts at -60 deg next to the Lv 46-50 south-east corner of the Sundered Heights and
   the bands run counter-clockwise; inside a sector the level rises with the angle (sub-areas). Region data (biomes, hubs, doors) is below; enemies,
   camps, dungeons, contracts and vendors are defined further on. */
const XM={d0:905,d1:945,start:-60,span:72,hubOff:8,hubD:965,doorOff:50,doorD:1062,
  regions:[{id:'copper',hub:'patina',hn:'Patina Cross',pal:[0x4a6e64,0x2e4440,0x9ac8b8,0x4affd2]},{id:'thorn',hub:'briarwatch',hn:'Briarwatch',pal:[0x5a3a4a,0x3a2632,0xc89ab0,0xff5ab4]},
    {id:'storm',hub:'galehold',hn:'Galehold',pal:[0x4a5060,0x2e323c,0xa8b4c8,0x7ad8ff]},{id:'hollow',hub:'sunhollow',hn:'Sunhollow Rest',pal:[0xb8a888,0x8a7a60,0xeee2c8,0xffc84a]},
    {id:'scar',hub:'lastlight',hn:'Lastlight Bastion',pal:[0x3a2e4a,0x221a2e,0x8a7aa8,0xb46aff]}]};
function xmDeg(x,z){return ((Math.atan2(z,x)*180/Math.PI-XM.start)%360+360)%360;}// 0..360 counter-clockwise from the start of sector 0
function xmBand(x,z){return Math.min(4,Math.floor(xmDeg(x,z)/XM.span));}
function xmLv(x,z){const d=xmDeg(x,z),b=Math.min(4,Math.floor(d/XM.span));return 51+10*b+Math.min(9,Math.floor((d-XM.span*b)/XM.span*10));}
function xmAt(deg,D){const a=(deg+XM.start)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),m=Math.max(Math.abs(c),Math.abs(s));return [Math.round(c/m*D),Math.round(s/m*D)];}// a point on the square ring max(|x|,|z|)=D
XM.regions.forEach((R,b)=>{R.b=b;R.lv=[51+10*b,60+10*b];const h=xmAt(b*XM.span+XM.hubOff,XM.hubD),d=xmAt(b*XM.span+XM.doorOff,XM.doorD);R.hx=h[0];R.hz=h[1];R.door={x:d[0],z:d[1]};
  OUTPOSTS.push({id:R.hub,name:R.hn,x:R.hx,z:R.hz,r:14,hub:true,pal:R.pal});});
XM.gate=(function(){const p=xmAt(4*XM.span+64,1090);return {x:p[0],z:p[1]};})();// Build M raid hook: the sealed gate of the future Lv 100 raid (Riftscar, 91-100)
/* ---------- faction zones (Build G): land held by one faction. Its Sentinels attack members of the other side on sight. ---------- */
const FZONES=[
  {id:'ironward',side:'combine',name:'Ironward Reach',out:'Ironward Bastion',ring:'dusk',deg:70,r:520,R:74,lv:[14,17],gl:'Warden Sentinel',ren:'Scrap Renegade'},
  {id:'emberhollow',side:'ashborn',name:'Emberhollow',out:'Emberhollow Warcamp',ring:'dusk',deg:230,r:520,R:74,lv:[14,17],gl:'Clanblade Sentinel',ren:'Scrap Renegade'},
  {id:'coldspire',side:'combine',name:'Coldspire Directive',out:'Coldspire Garrison',ring:'rime',deg:50,r:760,R:80,lv:[24,27],gl:'Directive Sentinel',ren:'Frost Renegade'},
  {id:'frostforge',side:'ashborn',name:'Frostforge Wilds',out:'Frostforge Hold',ring:'rime',deg:240,r:760,R:80,lv:[24,27],gl:'Ashwalker Sentinel',ren:'Frost Renegade'}];
const FZ_PAL={combine:[0x8f9aab,0x5d6a7e,0xc9d2de,0x3f8fff],ashborn:[0x7d5444,0x5a3a2e,0xab735c,0xff5a2a]};
FZONES.forEach(z=>{const p=gloamAt(z.deg,z.r);z.x=p[0];z.z=p[1];OUTPOSTS.push({id:z.id,name:z.out,x:z.x,z:z.z,r:12,fz:z.id,pal:FZ_PAL[z.side]});});
/* ---------- biomes: the old desert core ringed by six regions (blended borders) ---------- */
const BIOMES=[
  {id:'dunes',name:'Kessra Dunes',sub:'Open desert around Halden\'s Rest',lv:[1,10],fog:0xe9b98a,hemi:0xffe2c0,c1:0xc9a07a,c2:0xb48660},
  {id:'glass',name:'Shimmerfield',sub:'Crystal glass fields',lv:[7,10],gate:'glassreach',a:0,fog:0xbfe6ee,hemi:0xd8f6ff,c1:0x9fb8b6,c2:0x7f9ea2},
  {id:'ash',name:'Cinderveil Badlands',sub:'Ash and volcanic ridges',lv:[8,10],gate:'vault',a:1,fog:0x6a5650,hemi:0xffa080,c1:0x2e2826,c2:0x221d1c},
  {id:'scrap',name:'Rustmaw Scrapyard',sub:'Ruined Combine city and tech scrap',lv:[6,9],gate:'factions',a:2,fog:0xa89a8c,hemi:0xe0d4c8,c1:0x5c5e62,c2:0x4a4c50},
  {id:'oasis',name:'Mirewell Oasis',sub:'Scrubland, palms and springs',lv:[3,6],a:3,fog:0xc4ccaa,hemi:0xe4ecd0,c1:0x55783a,c2:0x6a8a44},
  {id:'canyon',name:'Redspire Canyons',sub:'Red rock canyons and mesas',lv:[5,8],gate:'mine',a:4,fog:0xe0906a,hemi:0xffc8a0,c1:0xb85a3c,c2:0x9c4630},
  {id:'salt',name:'Whitepan Salt Flats',sub:'Blinding salt pans',lv:[4,7],gate:'cinderwell',a:5,fog:0xe4dccc,hemi:0xeeeeea,c1:0xd2ccbe,c2:0xc2baa8},
  {id:'dusk',name:'Duskcrown Highlands',sub:'Violet stone terraces veined with waking Vyre',lv:[11,20],gate:'farwatch',outer:true,lvAt:(x,z)=>gloamLv(x,z),minLv:11,fog:0x9088b0,hemi:0xd4ccff,c1:0x544c68,c2:0x635a7a},
  {id:'rime',name:'Rimefall Expanse',sub:'Frozen plateaus split by glowing ice crevasses',lv:[21,30],gate:'hoarlight',outer:true,lvAt:(x,z)=>rimeLv(x,z),minLv:21,fog:0xb4c6da,hemi:0xe4f0ff,c1:0xb8c8d8,c2:0x9fb2c6},
  {id:'fen',name:'Mirelight Fen',sub:'A drowned bog lit by glowing spores and sunken Combine ruins',lv:[31,40],outer:true,lvAt:(x,z)=>fenLv(x,z),minLv:31,fog:0x4e6e5e,hemi:0xc8f0d8,c1:0x3c4c34,c2:0x2e3c2c,mapAt:[-700,700]},
  {id:'sunder',name:'Sundered Heights',sub:'Shattered obsidian plateaus over a burning rift',lv:[41,50],outer:true,lvAt:(x,z)=>sunderLv(x,z),minLv:41,fog:0x6e3e3a,hemi:0xffc8b0,c1:0x3a2a2a,c2:0x2a1e20,mapAt:[700,700]},
  // Build M: the five outer regions (Lv 51-100)
  {id:'copper',name:'Coppergale Barrens',sub:'Windswept plains of verdigris plate and toppled Combine pylons',lv:[51,60],outer:true,lvAt:(x,z)=>xmLv(x,z),minLv:51,fog:0x86aaa4,hemi:0xd8fff4,c1:0x4e7a6c,c2:0x7a5e40,xm:0},
  {id:'thorn',name:'Thornspire Wilds',sub:'A forest of rose-crystal thorns that sing in the wind',lv:[61,70],outer:true,lvAt:(x,z)=>xmLv(x,z),minLv:61,fog:0x8a5a7a,hemi:0xffd0ec,c1:0x5a3c4c,c2:0x40303c,xm:1},
  {id:'storm',name:'Stormveil Plateau',sub:'High slate mesas under a never-ending lightning front',lv:[71,80],outer:true,lvAt:(x,z)=>xmLv(x,z),minLv:71,fog:0x5c667a,hemi:0xd8e4ff,c1:0x4c5260,c2:0x3a3e4a,xm:2},
  {id:'hollow',name:'Hollowsun Reach',sub:'Bleached dunes of bone and sun-glass around colossal skeletons',lv:[81,90],outer:true,lvAt:(x,z)=>xmLv(x,z),minLv:81,fog:0xe8d4aa,hemi:0xfff0d0,c1:0xd4c6a6,c2:0xbcac8a,xm:3},
  {id:'scar',name:'The Riftscar',sub:'Shattered black glass over a wound in the world, where the Vyre runs raw',lv:[91,100],outer:true,lvAt:(x,z)=>xmLv(x,z),minLv:91,fog:0x3e2e4e,hemi:0xcab4ff,c1:0x2c2236,c2:0x1e1828,xm:4}];
const NB=BIOMES.length,GB=7,RB=8,FB=9,SB=10,XB=11;// biome count (16), XB = first Build M outer region; the Duskcrown, Rimefall, Mirelight Fen and Sundered Heights indices
const BWS=new Float32Array(NB);
function biomeW(x,z,out){out=out||BWS;const D=Math.max(Math.abs(x),Math.abs(z));for(let k=XB;k<NB;k++)out[k]=0;
  if(D>XM.d1+24){for(let k=0;k<XB;k++)out[k]=0;xmW(x,z,out,1);return out;}// deep in the outer shell: only the new regions
  biomeW0(x,z,out);const nq=D<XM.d0-24?0:smooth(XM.d0,XM.d1,D+(fbm(x*0.007+611,z*0.007+233)-0.5)*48);if(nq>0){for(let k=0;k<XB;k++)out[k]*=1-nq;xmW(x,z,out,nq);}return out;}
const XM_TW=new Float32Array(5);
function xmW(x,z,out,q){const d=xmDeg(x,z)+(fbm(x*0.006+71,z*0.006+29)-0.5)*10;let sum=0;const tw=XM_TW;
  for(let b=0;b<5;b++){let dd=Math.abs(d-(b*XM.span+XM.span/2));dd=Math.min(dd,360-dd);tw[b]=smooth(XM.span/2+3,XM.span/2-3,dd);sum+=tw[b];}for(let b=0;b<5;b++)out[XB+b]=q*tw[b]/(sum||1);}
function biomeW0(x,z,out){const r=Math.hypot(x,z);const o=smooth(222,285,r+(fbm(x*0.01+3,z*0.01+9)-0.5)*44);out[0]=1-o;out[GB]=0;out[RB]=0;out[FB]=0;out[SB]=0;
  if(o<=0){for(let i=1;i<GB;i++)out[i]=0;return out;}
  const a=Math.atan2(z,x)+(fbm(x*0.006+7,z*0.006+3)-0.5)*0.9;let sum=0;
  for(let k=0;k<6;k++){const c=k*Math.PI/3;const d=Math.abs(Math.atan2(Math.sin(a-c),Math.cos(a-c)));const w=smooth(Math.PI/6+0.16,Math.PI/6-0.16,d);out[k+1]=w;sum+=w;}
  const g=r<GLOAM.r0-30?0:smooth(GLOAM.r0,GLOAM.r1,r+(fbm(x*0.008+31,z*0.008+17)-0.5)*56);
  const q=r<RIME.r0-34?0:smooth(RIME.r0,RIME.r1,r+(fbm(x*0.007+57,z*0.007+91)-0.5)*64);
  for(let k=1;k<GB;k++)out[k]=o*(1-g)*out[k]/(sum||1);out[GB]=g*(1-q);out[RB]=q;
  const xq=r<XR.r0-40?0:smooth(XR.r0,XR.r1,r+(fbm(x*0.006+301,z*0.006+17)-0.5)*60);if(xq>0){for(let k=0;k<FB;k++)out[k]*=1-xq;const sx=smooth(-30,30,x);out[FB]=xq*(1-sx);out[SB]=xq*sx;}else{out[FB]=0;out[SB]=0;}return out;}
function biomeIdx(x,z){const w=biomeW(x,z);let bi=0;for(let i=1;i<NB;i++)if(w[i]>w[bi])bi=i;return bi;}
function coreH(x,z){
  let h=(fbm(x*0.008+10,z*0.008+5)-0.5)*28+Math.sin(x*0.045+Math.cos(z*0.021)*2.5)*1.8+Math.sin(z*0.06+x*0.01)*1.2;
  const d=Math.max(Math.abs(x),Math.abs(z));
  h*=smooth(36,72,d);return h;}
const WATER_Y=-0.75;
const BH=[coreH,
  (x,z)=>(fbm(x*0.02+40,z*0.02)-0.5)*14+Math.abs(Math.sin(x*0.05+fbm(x*0.01,z*0.01)*6))*3,// glass: rolling with ridges
  (x,z)=>{const r=1-Math.abs(2*fbm(x*0.015+21,z*0.015+4)-1);return r*r*28-6+(fbm(x*0.09,z*0.09)-0.5)*4;},// ash: sharp ridges
  (x,z)=>(fbm(x*0.01+5,z*0.01+60)-0.5)*9,// scrap: flat-ish city floor
  (x,z)=>{const h=fbm(x*0.012+80,z*0.012+12)*9+0.6;const p=smooth(0.6,0.68,fbm(x*0.022+30,z*0.022+30));return h+(-2.4-h)*p;},// oasis: low hills, spring-fed ponds
  (x,z)=>{const n=fbm(x*0.012+50,z*0.012-20);return smooth(0.47,0.51,n)*15+smooth(0.6,0.63,n)*12+(fbm(x*0.08,z*0.08)-0.5)*2.2;},// canyons: terraced mesas
  (x,z)=>(fbm(x*0.01+90,z*0.01+90)-0.5)*2.4,// salt: dead flat
  (x,z)=>{const n=fbm(x*0.007+130,z*0.007-40);return 3+smooth(0.44,0.49,n)*9+smooth(0.57,0.61,n)*9+(fbm(x*0.045+7,z*0.045)-0.5)*4.5+Math.abs(Math.sin(x*0.02+z*0.013+fbm(x*0.01,z*0.01)*4))*1.6;},// gloam: violet terraces
  (x,z)=>{const n=fbm(x*0.006+210,z*0.006+75);let h=5+smooth(0.42,0.5,n)*10+smooth(0.6,0.66,n)*8;const cr=Math.abs(Math.sin(x*0.018+z*0.006+fbm(x*0.008+5,z*0.008)*6));h-=smooth(0.13,0.0,cr)*4.5;return h+(fbm(x*0.05+3,z*0.05+9)-0.5)*2.6;},// rime: ice plateaus cut by crevasses
  (x,z)=>{const n=fbm(x*0.011+410,z*0.011+33);const h=1.2+n*6+(fbm(x*0.06+9,z*0.06+4)-0.5)*1.6;const dh=Math.min(Math.hypot(x+668,z-668),Math.hypot(x+707,z+707));const p=smooth(0.6,0.66,fbm(x*0.018+77,z*0.018+19))*smooth(30,55,dh);return h+(-1.8-h)*p;},// fen: low hummocks and drowned pools
  (x,z)=>{const n=1-Math.abs(2*fbm(x*0.008+520,z*0.008+140)-1);let h=4+smooth(0.35,0.55,n)*14+smooth(0.7,0.78,n)*9;const f=Math.abs(Math.sin(x*0.013-z*0.009+fbm(x*0.006,z*0.006)*5));h-=smooth(0.1,0.0,f)*7;return h+(fbm(x*0.07+5,z*0.07)-0.5)*2.2;},// sunder: shattered plateaus split by burning fissures
  (x,z)=>{const n=fbm(x*0.008+700,z*0.008+90);return 2+n*10+smooth(0.55,0.6,n)*5+(fbm(x*0.05+2,z*0.05+6)-0.5)*2.4;},// copper: wind-scoured rolling plates with low steps
  (x,z)=>{const n=1-Math.abs(2*fbm(x*0.012+810,z*0.012+44)-1);return 2+n*n*16+(fbm(x*0.06+8,z*0.06+1)-0.5)*3;},// thorn: sharp ridged hills
  (x,z)=>{const n=fbm(x*0.006+905,z*0.006+212);return 4+smooth(0.42,0.46,n)*12+smooth(0.58,0.61,n)*10+(fbm(x*0.05+4,z*0.05+4)-0.5)*2;},// storm: stepped slate mesas
  (x,z)=>{const n=fbm(x*0.01+1010,z*0.01+330);return 2+Math.abs(Math.sin(x*0.03+z*0.012+n*5))*5+n*6;},// hollow: long bleached dune swells
  (x,z)=>{const n=1-Math.abs(2*fbm(x*0.009+1111,z*0.009+77)-1);let h=3+smooth(0.4,0.6,n)*15;const f=Math.abs(Math.sin(x*0.011+z*0.017+fbm(x*0.005,z*0.005)*6));h-=smooth(0.09,0.0,f)*9;return h+(fbm(x*0.08+1,z*0.08+3)-0.5)*2;}];// scar: black glass shelves split by deep rifts
// flattened pads for the Farwatch hub and the Choir dungeon door
const FLATS=[{x:-407,z:235,r:30,i:22},{x:GLOAM.door.x,z:GLOAM.door.z,r:18,i:9},{x:606,z:-350,r:32,i:24},{x:RIME.door.x,z:RIME.door.z,r:18,i:9},{x:-668,z:668,r:32,i:24},{x:668,z:668,r:32,i:24},{x:XR.fenDoor.x,z:XR.fenDoor.z,r:18,i:9},{x:XR.sunDoor.x,z:XR.sunDoor.z,r:18,i:9}]
XM.regions.forEach(R=>{FLATS.push({x:R.hx,z:R.hz,r:32,i:24},{x:R.door.x,z:R.door.z,r:18,i:9});});FLATS.push({x:XM.gate.x,z:XM.gate.z,r:20,i:10});
function rawH0(x,z){const w=biomeW(x,z);let h=0;for(let i=0;i<NB;i++)if(w[i]>0.001)h+=w[i]*BH[i](x,z);
  const D=Math.max(Math.abs(x),Math.abs(z));if(D>HALF-78)h+=smooth(HALF-78,HALF-22,D)*46*(0.55+0.45*fbm(x*0.03,z*0.03));// Build M: noise only near the edge
  return h;}
FLATS.forEach(f=>f.h=rawH0(f.x,f.z));
function rawH(x,z){let h=rawH0(x,z);for(const f of FLATS){const d=Math.hypot(x-f.x,z-f.z);if(d<f.r)h+=(f.h-h)*smooth(f.r,f.i,d);}return h;}
const HG=new Float32Array(N1*N1);
// Build M: the biome weights of every grid point are cached (8-bit) while the heights are built, so the colour pass and game19's normal/texture pass
// don't recompute them (the 2400 m world has 1.86x the points); released after game19.
let BWC=new Uint8Array(N1*N1*NB);
for(let iy=0;iy<N1;iy++)for(let ix=0;ix<N1;ix++){const i=iy*N1+ix;HG[i]=rawH(ix*CELL-HALF,iy*CELL-HALF);const o=i*NB;for(let k=0;k<NB;k++)BWC[o+k]=Math.round(BWS[k]*255);}
function bwCached(i,x,z,out){if(!BWC)return biomeW(x,z,out);const o=i*NB;for(let k=0;k<NB;k++)out[k]=BWC[o+k]/255;return out;}
let FLAT=false;// true inside an instanced dungeon: flat floor at y=0
function heightAt(x,z){
  if(FLAT)return (DUN&&DUN.hAt)?DUN.hAt(x,z):0;
  const gx=clamp((x+HALF)/CELL,0,SEG-0.0001),gz=clamp((z+HALF)/CELL,0,SEG-0.0001);
  const ix=Math.floor(gx),iz=Math.floor(gz),fx=gx-ix,fz=gz-iz;
  const ha=HG[iz*N1+ix],hb=HG[(iz+1)*N1+ix],hc=HG[(iz+1)*N1+ix+1],hd=HG[iz*N1+ix+1];
  if(fx+fz<=1)return ha+(hd-ha)*fx+(hb-ha)*fz;
  return hc+(hb-hc)*(1-fx)+(hd-hc)*(1-fz);
}
// terrain colours (kept for the world map) + chunked meshes (10x10 chunks, culled by frustum and distance)
const TCOL=new Float32Array(N1*N1*3);const TCH=[];const CH_C=40,CH_N=SEG/CH_C;// 11x11 chunks of 160 m
(function(){
  const c=new THREE.Color(),t=new THREE.Color(),u=new THREE.Color();
  const sand=new THREE.Color(0xc9a07a),sand2=new THREE.Color(0xb48660),rock=new THREE.Color(0x8a5238),town=new THREE.Color(0xb59a7e),hi=new THREE.Color(0x6e3f2c);
  const BC=BIOMES.map(b=>[new THREE.Color(b.c1),new THREE.Color(b.c2)]);const w=new Float32Array(NB);const vein=new THREE.Color(0x46d8e8),terr=new THREE.Color(0x8a82a6),iceC=new THREE.Color(0x7fa6c8),snowW=new THREE.Color(0xf2f6fa),iceGlow=new THREE.Color(0x6fe8ff);
  const fenPool=new THREE.Color(0x1e4a40),fenMoss=new THREE.Color(0x5a7a3a),fenGlow=new THREE.Color(0x5fffc8),emberC=new THREE.Color(0xff5a1a),obsid=new THREE.Color(0x141014);const patC=new THREE.Color(0x3fa88a),cuC=new THREE.Color(0xc8783a),roseC=new THREE.Color(0xb86a90),roseG=new THREE.Color(0xff7ac8),slateC=new THREE.Color(0x2a2e38),boltC=new THREE.Color(0x9ae8ff),sunG=new THREE.Color(0xffd86a),boneC=new THREE.Color(0xeee6d0),riftC=new THREE.Color(0xb46aff);const lava=new THREE.Color(0x8a2a10),mesa=new THREE.Color(0xd07a4c),floorC=new THREE.Color(0xc98a5a),pond=new THREE.Color(0x3f6a64),shore=new THREE.Color(0xcdb48a),rust=new THREE.Color(0x8a4a2a),glint=new THREE.Color(0x8fe8ee),crack=new THREE.Color(0xbcb4a2),snow=new THREE.Color(0x7a6a62);
  for(let iy=0;iy<N1;iy++)for(let ix=0;ix<N1;ix++){const i=iy*N1+ix;const x=ix*CELL-HALF,z=iy*CELL-HALF,h=HG[i];bwCached(i,x,z,w);
    const n=hash(Math.floor(x*0.7),Math.floor(z*0.7));
    // core: the original desert colouring
    if(w[0]>0.001){c.copy(sand).lerp(sand2,fbm(x*0.05,z*0.05));if(h>6)c.lerp(rock,clamp((h-6)/10,0,1));if(h>20)c.lerp(hi,clamp((h-20)/15,0,1));}else c.setRGB(0,0,0);// Build M: skip the desert colouring where it has no weight
    const d=Math.max(Math.abs(x),Math.abs(z));if(d<34)c.lerp(town,0.8);
    if(w[0]<0.999){c.multiplyScalar(w[0]);
      for(let k=1;k<NB;k++){if(w[k]<0.001)continue;t.copy(BC[k][0]).lerp(BC[k][1],fbm(x*0.04+k,z*0.04));const id=BIOMES[k].id;
        if(id==='glass'){if(hash(Math.floor(x*0.3),Math.floor(z*0.3))>0.86)t.lerp(glint,0.55);}
        else if(id==='ash'){if(h<-2)t.lerp(lava,clamp((-2-h)/4,0,0.8));else if(h>12)t.lerp(snow,clamp((h-12)/12,0,0.6));}
        else if(id==='scrap'){t.lerp(rust,Math.max(0,fbm(x*0.08,z*0.08)-0.45)*0.9);}
        else if(id==='oasis'){if(h<WATER_Y+0.2)t.copy(pond);else if(h<WATER_Y+1.4)t.lerp(shore,0.7);}
        else if(id==='canyon'){if(h>10)t.lerp(mesa,0.6);else if(h<3)t.lerp(floorC,0.5);}
        else if(id==='dusk'){if(h>12)t.lerp(terr,clamp((h-12)/8,0,0.55));const vv=Math.abs(Math.sin(x*0.11+Math.sin(z*0.07)*3+fbm(x*0.02,z*0.02)*5));if(vv<0.05)t.lerp(vein,0.65);}
        else if(id==='rime'){if(h<5)t.lerp(iceC,clamp((5-h)/3,0,0.75));if(fbm(x*0.03+11,z*0.09)>0.58)t.lerp(snowW,0.55);const cr=Math.abs(Math.sin(x*0.018+z*0.006+fbm(x*0.008+5,z*0.008)*6));if(cr<0.035)t.lerp(iceGlow,0.7);}
        else if(id==='fen'){if(h<WATER_Y+0.6)t.lerp(fenPool,0.75);else if(fbm(x*0.05+3,z*0.05+8)>0.6)t.lerp(fenMoss,0.5);if(hash(Math.floor(x*0.4),Math.floor(z*0.4))>0.93)t.lerp(fenGlow,0.6);}
        else if(id==='sunder'){const f=Math.abs(Math.sin(x*0.013-z*0.009+fbm(x*0.006,z*0.006)*5));if(f<0.04)t.lerp(emberC,0.85);else if(h>16)t.lerp(obsid,0.5);}
        else if(id==='copper'){if(fbm(x*0.06+5,z*0.06+2)>0.6)t.lerp(patC,0.55);if(hash(Math.floor(x*0.25),Math.floor(z*0.25))>0.95)t.lerp(cuC,0.6);}
        else if(id==='thorn'){if(h>12)t.lerp(roseC,clamp((h-12)/8,0,0.5));if(hash(Math.floor(x*0.4),Math.floor(z*0.4))>0.94)t.lerp(roseG,0.6);}
        else if(id==='storm'){if(h>14)t.lerp(slateC,0.5);const sv=Math.abs(Math.sin(x*0.021+z*0.015+fbm(x*0.01,z*0.01)*5));if(sv<0.03)t.lerp(boltC,0.75);}
        else if(id==='hollow'){if(hash(Math.floor(x*0.3),Math.floor(z*0.3))>0.93)t.lerp(sunG,0.6);else if(h<4)t.lerp(boneC,0.4);}
        else if(id==='scar'){const f=Math.abs(Math.sin(x*0.011+z*0.017+fbm(x*0.005,z*0.005)*6));if(f<0.045)t.lerp(riftC,0.85);else if(h>12)t.lerp(obsid,0.45);}
        else if(id==='salt'){const fx=Math.abs(Math.sin(x*0.35+Math.sin(z*0.2)*2)),fz=Math.abs(Math.sin(z*0.35+Math.sin(x*0.2)*2));if(fx<0.12||fz<0.12)t.lerp(crack,0.7);}
        c.r+=t.r*w[k];c.g+=t.g*w[k];c.b+=t.b*w[k];}}
    if(D_EDGE(x,z)>0)c.lerp(hi,D_EDGE(x,z)*0.7);
    c.offsetHSL(0,0,(n-0.5)*0.04);TCOL[i*3]=c.r;TCOL[i*3+1]=c.g;TCOL[i*3+2]=c.b;}
  const mat=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});
  for(let cz=0;cz<CH_N;cz++)for(let cx=0;cx<CH_N;cx++){const n=CH_C+1;const pos=new Float32Array(n*n*3),col=new Float32Array(n*n*3),idx=[];
    for(let j=0;j<n;j++)for(let k=0;k<n;k++){const ix=cx*CH_C+k,iy=cz*CH_C+j,gi=iy*N1+ix,v=j*n+k;pos[v*3]=ix*CELL-HALF;pos[v*3+1]=HG[gi];pos[v*3+2]=iy*CELL-HALF;col[v*3]=TCOL[gi*3];col[v*3+1]=TCOL[gi*3+1];col[v*3+2]=TCOL[gi*3+2];}
    for(let j=0;j<CH_C;j++)for(let k=0;k<CH_C;k++){const a=j*n+k,b=a+1,c2=a+n,d2=c2+1;idx.push(a,c2,b,b,c2,d2);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();
    const m=new THREE.Mesh(g,mat);m.userData.cx=(cx+0.5)*CH_C*CELL-HALF;m.userData.cz=(cz+0.5)*CH_C*CELL-HALF;scene.add(m);TCH.push(m);}
})();
function D_EDGE(x,z){const D=Math.max(Math.abs(x),Math.abs(z));return smooth(HALF-78,HALF-30,D);}

/* ---------------- collision ---------------- */
const circles=[],boxes=[];
function inTown(p){if(FLAT)return false;if(Math.abs(p.x)<TOWN+0.5&&Math.abs(p.z)<TOWN+0.5)return true;for(const o of OUTPOSTS)if(Math.hypot(p.x-o.x,p.z-o.z)<o.r)return true;return false;}
function collide(p,r){
  for(let i=0;i<circles.length;i++){const c=circles[i];const dx=p.x-c.x,dz=p.z-c.z;const rr=r+c.r;if(Math.abs(dx)>rr||Math.abs(dz)>rr)continue;const d2=dx*dx+dz*dz;if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2);p.x=c.x+dx/d*rr;p.z=c.z+dz/d*rr;}}
  for(let i=0;i<boxes.length;i++){const b=boxes[i];if(p.x<b.x0-r||p.x>b.x1+r||p.z<b.z0-r||p.z>b.z1+r)continue;
    const cx=clamp(p.x,b.x0,b.x1),cz=clamp(p.z,b.z0,b.z1);const dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;
    if(d2<r*r){if(d2>1e-8){const d=Math.sqrt(d2);p.x=cx+dx/d*r;p.z=cz+dz/d*r;}
      else{const l=p.x-b.x0,rr=b.x1-p.x,t=p.z-b.z0,bt=b.z1-p.z;const m=Math.min(l,rr,t,bt);if(m===l)p.x=b.x0-r;else if(m===rr)p.x=b.x1+r;else if(m===t)p.z=b.z0-r;else p.z=b.z1+r;}}}
  p.x=clamp(p.x,-HALF+18,HALF-18);p.z=clamp(p.z,-HALF+18,HALF-18);
}

/* ---------------- materials / helpers ---------------- */
const geoBox=new THREE.BoxGeometry(1,1,1);
const geoIco=new THREE.IcosahedronGeometry(1,0);
const geoCone=new THREE.ConeGeometry(1,1,6);
const geoSphere=new THREE.SphereGeometry(1,8,6);
const matCache={};
function M(c){return matCache[c]||(matCache[c]=new THREE.MeshLambertMaterial({color:c,flatShading:true}));}
const bmatCache={};
function MB(c){return bmatCache[c]||(bmatCache[c]=new THREE.MeshBasicMaterial({color:c}));}
function part(parent,geo,mat,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}

/* ---------------- static world ---------------- */
const structs=[];
function addBox(x,y,z,sx,sy,sz,color,col){structs.push({x,y,z,sx,sy,sz,color});if(col!==false)boxes.push({x0:x-sx/2,x1:x+sx/2,z0:z-sz/2,z1:z+sz/2,y0:y-sy/2,y1:y+sy/2});}
// town walls with gates N and S
const WALL=0x9c8f80,WALL2=0x6f6a66,CORP=0xd8d2c4,CORP2=0x4f6b80;
function wallSeg(x0,z0,x1,z1){const cx=(x0+x1)/2,cz=(z0+z1)/2;const sx=Math.abs(x1-x0)||1.6,sz=Math.abs(z1-z0)||1.6;addBox(cx,2.5,cz,sx,5,sz,WALL);addBox(cx,5.2,cz,sx+0.3,0.4,sz+0.3,WALL2,false);}
wallSeg(-TOWN,-TOWN,-5,-TOWN);wallSeg(5,-TOWN,TOWN,-TOWN);wallSeg(-TOWN,TOWN,-5,TOWN);wallSeg(5,TOWN,TOWN,TOWN);
wallSeg(-TOWN,-TOWN,-TOWN,TOWN);wallSeg(TOWN,-TOWN,TOWN,TOWN);
[[-TOWN,-TOWN],[TOWN,-TOWN],[-TOWN,TOWN],[TOWN,TOWN],[-6,-TOWN],[6,-TOWN],[-6,TOWN],[6,TOWN]].forEach(([x,z])=>{addBox(x,4,z,3,8,3,WALL2);addBox(x,8.3,z,3.6,0.6,3.6,CORP2,false);});
// buildings
[[-19,-19,11,6,9],[19,-19,10,8,9],[-19,19,9,5,10],[19,19,12,6,8],[-21,0,6,4,8],[21,2,6,10,6]].forEach(([x,z,sx,h,sz],i)=>{
  addBox(x,h/2,z,sx,h,sz,i%2?CORP:0xc9b49a);addBox(x,h+0.25,z,sx+0.6,0.5,sz+0.6,CORP2,false);
  addBox(x,h*0.55,z+(z<0?sz/2:-sz/2)+(z<0?0.05:-0.05),sx*0.5,h*0.25,0.15,0x2a3b48,false);
});
// terminal & vendor
addBox(-7,1.2,-11,2.2,2.4,1,0x2b3742);addBox(-7,2.6,-11,2.6,0.3,1.3,CORP2,false);
addBox(8,0.6,-10.5,4,1.2,1.2,0x7a5a3a);addBox(8,3.2,-11.5,5,0.25,3.2,0xb5522c,false);addBox(5.8,1.6,-12.6,0.2,3.2,0.2,0x444,false);addBox(10.2,1.6,-12.6,0.2,3.2,0.2,0x444,false);
// pylon base
addBox(0,0.5,0,4,1,4,0x5a5f66);
// ruins
const RUINS=[];
for(let i=0;i<5;i++){
  const a=i/5*Math.PI*2+0.4+srand(-0.2,0.2),r=srand(122,158);const cx=Math.cos(a)*r,cz=Math.sin(a)*r;RUINS.push({x:cx,z:cz});
  for(let k=0;k<9;k++){const x=cx+srand(-12,12),z=cz+srand(-12,12);const y=heightAt(x,z);
    if(srng()<0.55){const h=srand(2,7);addBox(x,y+h/2-0.3,z,1.3,h,1.3,0xb99a77);if(srng()<0.4)addBox(x,y+h-0.1,z,2,0.5,2,0xa98a67,false);}
    else{const L=srand(4,9),h=srand(1.2,3.5);if(srng()<0.5)addBox(x,y+h/2-0.3,z,L,h,1,0xa68a6c);else addBox(x,y+h/2-0.3,z,1,h,L,0xa68a6c);}
  }
}
// derelict mining rigs
for(let i=0;i<4;i++){const a=i/4*Math.PI*2+1.1,r=srand(80,100);const x=Math.cos(a)*r,z=Math.sin(a)*r;const y=heightAt(x,z);
  addBox(x,y+3,z,3,6,3,0x6d6f72);addBox(x,y+6.4,z,6,0.8,1.2,0xb5522c,false);addBox(x+2.5,y+4,z,0.6,8,0.6,0x4c4e52);}
(function(){
  const im=new THREE.InstancedMesh(geoBox,new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),structs.length);
  const m4=new THREE.Matrix4(),c=new THREE.Color();
  structs.forEach((s,i)=>{m4.makeScale(s.sx,s.sy,s.sz);m4.setPosition(s.x,s.y,s.z);im.setMatrixAt(i,m4);im.setColorAt(i,c.set(s.color));});
  im.frustumCulled=false;im.userData.env='struct';scene.add(im);
})();
// glow bits in town
const termScreen=part(scene,geoBox,MB(0x5ff2ff),-7,1.5,-10.45,1.7,1.1,0.05);
const pylon=part(scene,new THREE.OctahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:0x5ff2ff}),0,4.2,0,1.3,2.6,1.3);
const pylonRing=part(scene,new THREE.TorusGeometry(2.2,0.12,4,24),MB(0xffc85a),0,4.2,0,1,1,1);pylonRing.rotation.x=Math.PI/2;
circles.push({x:0,z:0,r:2.4});const camOcc=[{x0:-1.4,x1:1.4,z0:-1.4,z1:1.4,y0:1,y1:7.2}];
for(const [x,z] of [[-10,10],[10,10],[-10,-22],[10,-22],[0,24],[0,-24]]){part(scene,geoBox,M(0x3a3a3a),x,1.6,z,0.25,3.2,0.25);part(scene,geoSphere,MB(0xffd9a0),x,3.3,z,0.3,0.3,0.3);}

// capturable tower sites (stage 2): nudged around their ring until clear of ruins, rigs, dungeon doors and outposts
const TSITES=[{id:'ridge',name:'Ridgeback Spire',a:2.1,r:108,lv:5},{id:'salt',name:'Saltglass Relay',a:5.25,r:150,lv:7},{id:'ember',name:'Emberfall Pylon',a:2.95,r:185,lv:9}];
TSITES.forEach(t=>{const bad=(x,z)=>boxes.some(b=>Math.hypot((b.x0+b.x1)/2-x,(b.z0+b.z1)/2-z)<18)||[[-78,-52],[150,110]].some(d=>Math.hypot(d[0]-x,d[1]-z)<34)||OUTPOSTS.some(o=>Math.hypot(o.x-x,o.z-z)<40)||TSITES.some(o=>o!==t&&o.x!=null&&Math.hypot(o.x-x,o.z-z)<60);
  let k=0;do{t.x=Math.cos(t.a)*t.r;t.z=Math.sin(t.a)*t.r;t.a+=0.06;k++;}while(bad(t.x,t.z)&&k<100);t.a-=0.06;});
function scatter(n,minR,fn){let k=0,tries=0;while(k<n&&tries<n*20){tries++;const x=srand(-CORE_HALF+20,CORE_HALF-20),z=srand(-CORE_HALF+20,CORE_HALF-20);if(Math.max(Math.abs(x),Math.abs(z))<minR)continue;if(OUTPOSTS.some(o=>Math.hypot(x-o.x,z-o.z)<17)||TSITES.some(o=>Math.hypot(x-o.x,z-o.z)<14))continue;if(fn(x,z,k)!==false)k++;}}
(function(){
  const rocks=[];
  scatter(300,40,(x,z)=>{const s=srand(0.6,4.2);for(const r of RUINS)if(Math.hypot(r.x-x,r.z-z)<16)return false;rocks.push([x,z,s]);});
  const im=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),rocks.length);
  const o=new THREE.Object3D(),c=new THREE.Color();
  rocks.forEach(([x,z,s],i)=>{o.position.set(x,heightAt(x,z)+s*0.25,z);o.rotation.set(srand(0,3),srand(0,3),srand(0,3));o.scale.set(s*srand(0.8,1.4),s*srand(0.6,1.1),s*srand(0.8,1.4));o.updateMatrix();im.setMatrixAt(i,o.matrix);
    im.setColorAt(i,c.setHSL(0.05+srand(-0.02,0.02),0.35+srand(0,0.15),0.32+srand(0,0.15)));if(s>1.3)circles.push({x,z,r:s*0.95});});
  im.frustumCulled=false;im.userData.env='rock';scene.add(im);
  // spire cacti
  const sp=[];scatter(260,38,(x,z)=>{sp.push([x,z]);});
  const im2=new THREE.InstancedMesh(geoCone,new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),sp.length*2);
  let j=0;sp.forEach(([x,z])=>{const h=srand(1.5,4.5),w=srand(0.25,0.5);const y=heightAt(x,z);
    o.position.set(x,y+h/2,z);o.rotation.set(srand(-0.15,0.15),srand(0,6),srand(-0.15,0.15));o.scale.set(w,h,w);o.updateMatrix();im2.setMatrixAt(j,o.matrix);im2.setColorAt(j++,c.setHSL(srng()<0.5?0.48:0.78,0.5,0.35));
    o.position.set(x+w*1.8,y+h*0.3,z);o.scale.set(w*0.6,h*0.55,w*0.6);o.updateMatrix();im2.setMatrixAt(j,o.matrix);im2.setColorAt(j++,c.setHSL(0.5,0.45,0.42));
  });
  im2.frustumCulled=false;scene.add(im2);
  // glow bulbs
  const bl=[];scatter(220,38,(x,z)=>{bl.push([x,z]);});
  const im3=new THREE.InstancedMesh(geoIco,new THREE.MeshBasicMaterial({color:0xffffff}),bl.length*3);
  j=0;bl.forEach(([x,z])=>{const y=heightAt(x,z);for(let q=0;q<3;q++){const s=srand(0.15,0.4);o.position.set(x+srand(-0.8,0.8),y+s*0.6,z+srand(-0.8,0.8));o.rotation.set(0,0,0);o.scale.set(s,s*1.3,s);o.updateMatrix();im3.setMatrixAt(j,o.matrix);im3.setColorAt(j++,c.setHSL(srng()<0.6?0.9:0.12,0.9,0.62));}});
  im3.frustumCulled=false;scene.add(im3);
  // vyre crystals
  const cr=[];scatter(90,45,(x,z)=>{cr.push([x,z]);});
  const im4=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:0xffffff}),cr.length*3);
  j=0;cr.forEach(([x,z])=>{const y=heightAt(x,z);for(let q=0;q<3;q++){const s=srand(0.3,0.9);o.position.set(x+srand(-1,1),y+s*0.9,z+srand(-1,1));o.rotation.set(srand(-0.4,0.4),srand(0,3),srand(-0.4,0.4));o.scale.set(s*0.5,s*1.6,s*0.5);o.updateMatrix();im4.setMatrixAt(j,o.matrix);im4.setColorAt(j++,c.setHSL(0.51,0.9,srand(0.55,0.7)));}});
  im4.frustumCulled=false;scene.add(im4);
})();

/* ---------------- shared FX ---------------- */
const shadowGeo=new THREE.CircleGeometry(1,12);shadowGeo.rotateX(-Math.PI/2);
const shadowMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.28,depthWrite:false});
function makeShadow(r){const m=new THREE.Mesh(shadowGeo,shadowMat);m.scale.set(r,1,r);scene.add(m);return m;}
