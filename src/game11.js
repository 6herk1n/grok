/* ---------- Wild packs: open-world enemy camps for kiting and XP farming ----------
   Runtime-only (nothing saved). Camps near gated outposts only spawn once that story gate is open.
   Far camps sleep (their mobs are removed) and wake again when you come back, keeping iPad enemy counts low. */
ETYPES.spitter={name:'Glass Spitter',slow:{mul:0.8,dur:2.2,name:'Glassed'},hp:34,dmg:5.5,atkCd:2.0,range:14,speed:5.4,aggro:16,xp:1.15,ranged:true,hitR:0.9,h:1.2,scale:0.95,
  build:()=>{const R=buildSkitter();R.g.traverse(o=>{if(o.isMesh&&o.material&&o.material.color&&o.material.color.getHex()===0xb8642c)o.material=M(0x4f9aa8);});part(R.g,geoIco,MB(0x7ff6ff),0,1.05,-0.2,0.35,0.35,0.35);return R;}};
const CAMP_SPEED=6.8;// below on-foot base speed (7.2), so even modest Run Speed lets you kite a pack
const CAMP_LEASH=55,CAMP_WAKE=115,CAMP_SLEEP=150,CAMP_CAP=36,CAMP_NEAR=32;
const CAMPS=[
  {id:'hollow',name:'Skitter Hollow',x:62,z:38,lv:[1,2],n:4,mix:['skitter']},
  {id:'drywash',name:'Dry Wash',x:-80,z:-28,lv:[2,3],n:5,mix:['skitter','skitter','spitter']},
  {id:'cinderflats',name:'Cinder Flats',x:34,z:-104,lv:[2,4],n:5,mix:['skitter','spitter','skitter'],gate:'cinderwell'},
  {id:'ribs',name:'Bleached Ribs',x:-112,z:40,lv:[3,5],n:5,mix:['raider','skitter','skitter']},
  {id:'gully',name:'Scrap Gully',x:58,z:118,lv:[4,6],n:6,mix:['raider','spitter','skitter']},
  {id:'caravan',name:'Sunken Caravan',x:-62,z:136,lv:[5,7],n:6,mix:['raider','raider','spitter']},
  {id:'saltpan',name:'Saltpan Nest',x:104,z:-150,lv:[6,8],n:6,mix:['mauler','spitter','skitter','skitter']},
  {id:'pits',name:'Mauler Pits',x:-160,z:-112,lv:[6,8],n:7,mix:['mauler','skitter','spitter','skitter']},
  {id:'glassdunes',name:'Glass Dunes',x:206,z:-64,lv:[7,9],n:7,mix:['mauler','spitter','raider','spitter'],gate:'glassreach'},
  {id:'ember',name:'Ember Wastes',x:-196,z:58,lv:[8,10],n:8,mix:['mauler','raider','spitter','skitter']}];
// nudge camps clear of towns, outposts, dungeon doors, tower sites and ruins
CAMPS.forEach(c=>initCamp(c));
function initCamp(c){const bad=(x,z)=>Math.abs(x)<60&&Math.abs(z)<60||OUTPOSTS.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+20)||Object.values(DUNGEONS).some(d=>Math.hypot(d.door.x-x,d.door.z-z)<28)||
    TSITES.some(t=>Math.hypot(t.x-x,t.z-z)<34)||RUINS.some(r=>Math.hypot(r.x-x,r.z-z)<24)||Math.max(Math.abs(x),Math.abs(z))>HALF-75||(c.biome!=null&&biomeIdx(x,z)!==c.biome);
  let k=0;const a0=Math.atan2(c.z,c.x),r0=Math.hypot(c.x,c.z);while(bad(c.x,c.z)&&k<80){k++;const a=a0+(k%2?1:-1)*Math.ceil(k/2)*0.05;const r=Math.min(c.biome!=null?HALF*1.2:230,r0+(k>40?8:0));c.x=Math.cos(a)*r;c.z=Math.sin(a)*r;}
  c.resp=Math.round(60+(Math.min(c.lv[1],10)-2)*7.5+(c.lv[1]>10?15:0));// 60s for starter camps, up to 120s for level-10 camps
  c.mobs=[];c.respawnAt=0;c.awake=false;c.xpAcc=0;c.cleared=0;c.left=c.n;
  const g=new THREE.Group();const y=heightAt(c.x,c.z);g.position.set(c.x,y,c.z);
  part(g,geoCone,M(0x8a5a34),0,1.1,0,2.2,2.2,2.2);part(g,geoCone,M(0x6a4024),3.6,0.8,1.6,1.5,1.6,1.5);
  c.fire=part(g,geoIco,MB(0xff8a2a),-1.2,0.4,2.6,0.45,0.5,0.45);part(g,geoBox,M(0x3a2a1a),-1.2,0.1,2.6,1.1,0.2,1.1);
  scene.add(g);c.g=g;}
const campOf=e=>e&&e.camp?CAMPS.find(c=>c.id===e.camp):null;
const campLive=c=>c.mobs.filter(m=>!m.dead&&enemies.includes(m));
function campOpen(c){return !c.gate||gateOpen(c.gate);}
function campLv(c,i){return clamp(c.lv[0]+((i*7+3)%(c.lv[1]-c.lv[0]+1)),1,MAXLVL);}
function spawnCampMobs(c,n){const base=c.mobs.filter(m=>!m.dead&&enemies.includes(m));c.mobs=base;
  for(let i=base.length;i<n;i++){const t=c.mix[i%c.mix.length];const a=i/n*6.283+0.3,r=i===0?1.5:rand(3,7);
    const e=makeEnemy(t,c.x+Math.cos(a)*r,c.z+Math.sin(a)*r,i===0?c.lv[1]:campLv(c,i),true);
    e.T=Object.assign({},e.T,{speed:Math.min(e.T.speed,CAMP_SPEED)});e.camp=c.id;e.pack='camp_'+c.id;e.leash=CAMP_LEASH;e.wr=4;c.mobs.push(e);}
  c.awake=true;}
function sleepCamp(c){c.left=campLive(c).length;for(const m of c.mobs)if(enemies.includes(m))removeEnemy(m);c.mobs=[];c.awake=false;}
function refillCamp(c){spawnCampMobs(c,c.n);c.left=c.n;c.respawnAt=0;c.xpAcc=0;}
let campAcc=0;
function updCamps(dt){if(DUN||state!=='play')return;campAcc+=dt;if(campAcc<0.5)return;campAcc=0;
  for(const c of CAMPS){c.fire.scale.setScalar(0.45+Math.sin(T*9+c.x)*0.08);}
  const byD=CAMPS.map(c=>({c,d:Math.hypot(c.x-P.pos.x,c.z-P.pos.z)})).sort((a,b)=>a.d-b.d);
  let active=0;for(const c of CAMPS)if(c.awake)active+=campLive(c).length;
  for(const {c,d} of byD){const live=c.awake?campLive(c):[];const fighting=live.some(m=>m.state!=='idle');
    if(!campOpen(c)){if(c.awake)sleepCamp(c);c.g.visible=false;continue;}c.g.visible=true;
    if(c.awake&&d>CAMP_SLEEP&&!fighting){active-=live.length;sleepCamp(c);continue;}
    if(c.awake&&live.length<c.n&&!c.respawnAt)c.respawnAt=T+c.resp;
    if(c.respawnAt&&T>=c.respawnAt&&!fighting&&d>CAMP_NEAR&&!P.dead){const want=c.n-live.length;if(c.awake?active+want<=CAMP_CAP+2:true){if(c.awake){refillCamp(c);active+=want;}else{c.left=c.n;c.respawnAt=0;c.xpAcc=0;}}}
    if(!c.awake&&d<CAMP_WAKE&&c.left>0&&active+c.left<=CAMP_CAP){spawnCampMobs(c,c.left);active+=c.left;}}}
// XP: +6% per other enemy fighting you nearby (max +30%), and a pack-clear bonus of 25% of the pack's XP
function packXpMul(e){if(!e||e.dun)return 1;let n=0;for(const o of enemies)if(o!==e&&!o.dead&&o.state==='chase'&&!o.isCore&&dist2D(o.pos,P.pos)<30)n++;return 1+0.06*Math.min(5,n);}
function campOnKill(e,xp){const c=campOf(e);if(!c)return;c.xpAcc+=xp||0;if(!c.respawnAt)c.respawnAt=T+c.resp;
  if(campLive(c).filter(m=>m!==e).length===0){c.left=0;c.cleared++;const b=Math.max(5,Math.round(c.xpAcc*0.25));c.xpAcc=0;c.lastBonus=P.level<MAXLVL?b:0;log('🔥 <b>'+esc(c.name)+'</b> cleared'+(c.lastBonus?' · +'+b+' XP pack bonus':''));
    if(P.level<MAXLVL){gainXp(b);floatText(tmpV.set(P.pos.x,P.pos.y+3,P.pos.z),'Pack cleared +'+b+' XP','xp');}
    toast('🔥 '+c.name+' cleared'+(P.level<MAXLVL?' · +'+b+' XP bonus':'')+' · respawns in '+Math.max(1,Math.round(c.respawnAt-T))+'s');}}
function campReset(){for(const c of CAMPS){for(const m of c.mobs)if(enemies.includes(m))removeEnemy(m);c.mobs=[];c.awake=false;c.left=c.n;c.respawnAt=0;c.xpAcc=0;}campAcc=1;}
function campMini(c2,tf){for(const c of CAMPS){if(!campOpen(c))continue;if(Math.abs(c.x-P.pos.x)>95||Math.abs(c.z-P.pos.z)>95)continue;const q=tf(c.x,c.z);const ready=c.left>0||c.awake&&campLive(c).length>0;
  c2.lineJoin='round';c2.strokeStyle='#000';c2.lineWidth=6;const tri=()=>{c2.beginPath();c2.moveTo(q[0],q[1]-13);c2.lineTo(q[0]+12,q[1]+9);c2.lineTo(q[0]-12,q[1]+9);c2.closePath();};
  tri();c2.stroke();c2.strokeStyle=ready?'#ff7a2a':'#a0a0a0';c2.lineWidth=3;tri();c2.stroke();}}
function campSvg(tx,tz){let s='';for(const c of CAMPS){if(!campOpen(c)||Math.abs(c.x)>265||Math.abs(c.z)>265)continue;const x=tx(c.x),y=tz(c.z);s+=`<polygon points="${x},${y-6} ${x+6},${y+5} ${x-6},${y+5}" fill="#ff7a2a" stroke="#000" stroke-width="1.5"><title>${esc(c.name)} · Lv ${c.lv[0]}-${c.lv[1]}</title></polygon>`;}return s;}
function campExports(){return {fabTargets,craftBar,CAMPS,CAMP_SPEED,CAMP_LEASH,CAMP_CAP,updCamps,campReset,campLive,spawnCampMobs,sleepCamp,packXpMul,campOpen,enemies,killEnemy,dmgEnemy,get T(){return T;},set T(v){T=v;}};}
