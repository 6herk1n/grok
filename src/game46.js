/* ================= INVASIONS (2026-11-23, Claude; AO alien-invasion style world event, own fiction) =================
   Every 20-35 minutes of play (first one 8-15 minutes into a session) a Hollow Legion dropship attacks a hub outpost you
   have unlocked (the hubs with a bank: INV_SITES), picked near your level. Banner + log + a pulsing ⚠ on the minimap.
   The ship lands just outside the outpost (outposts are safe zones). When you come within 90 m: 3 waves of invaders
   (3, 4, 5), then the Legion General (elite). Invaders are your level, clamped to the site's band (site lv -2 .. +8).
   Kill the General for credits, XP, 3 writs, a Rare+ item and a 40% chance of a pattern piece of that band (game45).
   The event expires 12 minutes after it is announced, or 90 s after you leave once it has started (the Legion withdraws).
   Never runs in dungeons, the apartment/Stair (FLAT), sims (SIMP/SIMST) or while dead. State P.inva v1 via invFields().
   Tests/dev: __dr.invStart(siteId) forces one now; INV.off=true stops new ones. Hooks: updBanks (tick), rrMini (⚠). */
const INV_VER=1,INV_SITES={cinderwell:7,glassreach:9,farwatch:14,hoarlight:24,lanternmoor:34,sunderwatch:44,patina:54,briarwatch:64,galehold:74,sunhollow:84,lastlight:94};
const INV_TYPES=[[0,['raider','sentry','enforcer']],[20,['enforcer','sentry','stalker']],[40,['warder','shardgolem','cinderwraith']],[60,['oxidebrute','galehound','thunderhulk']],[80,['voidhound','riftseer','scarbehemoth']]];
const INV_GENERALS=['Varok','Sethis','Mordaine','Kael Rhun','Ithra','Dross'];
const INV={ev:null,next:0,acc:0,off:false,t0:Date.now()};
function invi(){const s=P.inva||(P.inva={});s.v=INV_VER;s.won=s.won|0;s.seen=s.seen|0;return s;}
function invFields(s){const o=s.inva&&typeof s.inva==='object'?s.inva:{};return {inva:{v:INV_VER,won:Math.max(0,o.won|0),seen:Math.max(0,o.seen|0)}};}
function invTypes(lv){let t=INV_TYPES[0][1];for(const [m,L] of INV_TYPES)if(lv>=m)t=L;return t.filter(k=>ETYPES[k]).length?t.filter(k=>ETYPES[k]):['raider'];}
function invPickSite(){const L=P.level|0;const open=BANKS.filter(b=>INV_SITES[b.id]!=null&&bankOpenAt(b));if(!open.length)return null;
  const fit=open.filter(b=>INV_SITES[b.id]<=L+3&&INV_SITES[b.id]>=L-14);const pool=fit.length?fit:open.filter(b=>INV_SITES[b.id]<=L+3);
  return pool.length?pick(pool):null;}
function invShip(x,z,col){const g=new THREE.Group();const hull=M(0x2a2236),trim=M(col),glow=MB(0xb46bff);
  part(g,geoBox,hull,0,0,0,3.2,1.2,7.5);part(g,geoBox,trim,0,0.7,0.8,2.2,0.7,3.2);part(g,geoBox,hull,0,-0.1,-2.6,7.5,0.35,2.2);
  for(const s of [-1,1]){part(g,geoBox,glow,s*1.2,-0.4,-3.9,0.6,0.6,0.3);part(g,geoBox,trim,s*3.6,0.1,-2.6,0.4,1.0,1.6);}
  part(g,geoBox,glow,0,-0.65,0,2.6,0.08,5.5);g.position.set(x,heightAt(x,z)+42,z);scene.add(g);return g;}
function invStart(siteId){if(INV.ev||state!=='play'||DUN||FLAT||P.dead)return false;const b=siteId?BANKS.find(k=>k.id===siteId):invPickSite();if(!b)return false;
  const o=OUTPOSTS.slice().sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(c.x-b.x,c.z-b.z))[0];const base=INV_SITES[b.id]||P.level;
  let x=b.x,z=b.z;const a0=Math.random()*6.28;for(let i=0;i<24;i++){const a=a0+i*0.26,r=(o?o.r:12)+15;const cx=(o?o.x:b.x)+Math.cos(a)*r,cz=(o?o.z:b.z)+Math.sin(a)*r;
    if(!inTown({x:cx,z:cz})&&Math.abs(cx)<HALF-12&&Math.abs(cz)<HALF-12){x=cx;z=cz;break;}}
  const lv=clamp(P.level|0,Math.max(1,base-2),Math.min(MAXLVL,base+8));const name=(o?o.name:b.name.replace(/ Bank$/,''));
  INV.ev={site:b.id,name,x,z,lv,t0:T,wave:0,live:[],gen:null,ship:invShip(x,z,0x6a3a8a),phase:'inbound',far:0,genName:'Legion General '+pick(INV_GENERALS)};
  invi().seen++;banner('⚠ INVASION · '+name.toUpperCase(),'A Hollow Legion dropship is attacking · Lv '+lv);
  log('⚠ <b>Invasion!</b> A Hollow Legion dropship is landing outside <b>'+esc(name)+'</b> (Lv '+lv+'). Defend it within 12 minutes: three waves, then their General. ⚠ on the minimap.');
  try{SFX.boom();}catch(e){}save();return true;}
function invSpawn(type,n,elite){const E=INV.ev;const out=[];for(let i=0;i<n;i++){const a=i/n*6.28+Math.random()*0.5,r=elite?0:3+Math.random()*2.5;const x=E.x+Math.cos(a)*r,z=E.z+Math.sin(a)*r;
    const e=elite?makeElite(type,x,z,E.lv,'👑 '+E.genName,0x3a2a5a,{hp:7,dmg:1.45,scale:1.9,glow:0xb46bff,xp:6}):makeEnemy(type,x,z,E.lv,true);
    if(!elite){e.T=Object.assign({},e.T,{name:'Legion '+e.T.name});try{retint(e.R.g,0x4a2a6a,0.45,0xb46bff);}catch(_){}}
    e.inv=true;e.leash=70;e.state='chase';e.nextAtk=T+1+Math.random();ringFx(x,z,0xb46bff,2.4,0.5);out.push(e);}return out;}
function invEnd(won){const E=INV.ev;if(!E)return;for(const e of E.live.concat(E.gen?[E.gen]:[]))if(!e.dead&&enemies.includes(e))removeEnemy(e);
  E.phase='leaving';E.leaveT=T;INV.ev=null;INV.leaving=E;INV.next=Date.now()+rand(20,35)*60e3;
  if(won){const S0=invi();S0.won++;const lv=E.lv;const cr=50*lv;P.credits+=cr;gainXp(Math.round(lv*lv*3+80));const r=rmi();r.writs=(r.writs|0)+3;
    const it=genItem(lv,null,Math.max(2,rollRarity(20)));it.dropBy=E.genName;dropLoot(E.gx||E.x,E.gz||E.z,it);
    let pc='';if(typeof POCKETS!=='undefined'&&Math.random()<0.4){const p=POCKETS.find(q=>q.lv===symBand(lv));if(p){const k=pick(Object.keys(SYM_PIECES));bagAdd({kind:'pat',mt:p.id+':'+k,ql:p.lv},1);pc=' and a pattern piece ('+patName({mt:p.id+':'+k})+')';}}
    banner('⚠ INVASION REPELLED',E.name+' is safe');log('⚠ <b>'+esc(E.name)+' defended!</b> +'+cr+'¢, +3 ✦ writs, '+esc(it.name)+pc+'.');try{SFX.level();}catch(e){}}
  else log('⚠ The Hollow Legion withdraws from '+esc(E.name)+'.');save();}
function invTick(){const now=Date.now();
  if(INV.leaving){const L=INV.leaving;const k=(T-L.leaveT)/6;L.ship.position.y=heightAt(L.x,L.z)+6+k*40;L.ship.rotation.x=-0.15;if(k>1){scene.remove(L.ship);INV.leaving=null;}}
  if(INV.off||SIMP||SIMST||state!=='play'||!P||!P.pos)return;
  const E=INV.ev;
  if(!E){if(DUN||FLAT||P.dead)return;if(!INV.next)INV.next=INV.t0+rand(8,15)*60e3;if(now<INV.next)return;INV.next=now+60e3;if(!invStart())INV.next=now+5*60e3;return;}
  // ship descent and idle bob
  const gy=heightAt(E.x,E.z)+6,top=heightAt(E.x,E.z)+42;E.ship.position.y=Math.max(gy,top-(T-E.t0)*6)+(T-E.t0>6?Math.sin(T*1.4)*0.25:0);
  if(T-E.t0>720&&E.phase!=='fight'){invEnd(false);return;}
  if(DUN||FLAT)return;
  const d=Math.hypot(P.pos.x-E.x,P.pos.z-E.z);
  if(E.phase==='inbound'){if(d<90){E.phase='fight';E.wave=0;E.next=T;toast('⚠ The Legion lands! Wave 1 of 3');}return;}
  if(d>200){if(!E.farT)E.farT=T;if(T-E.farT>90){invEnd(false);return;}}else E.farT=0;
  E.live=E.live.filter(e=>!e.dead&&enemies.includes(e));
  if(E.gen){if(E.gen.dead){E.gx=E.gen.pos.x;E.gz=E.gen.pos.z;invEnd(true);}else if(!enemies.includes(E.gen))invEnd(false);return;}
  if(!E.live.length&&T>=E.next){if(E.wave<3){E.wave++;const types=invTypes(E.lv);E.live=invSpawn(pick(types),2+E.wave,false);toast('⚠ Wave '+E.wave+' of 3');}
    else{E.gen=invSpawn(invTypes(E.lv)[0],1,true)[0];banner('👑 '+E.genName.toUpperCase(),'The General leaves the dropship');}E.next=T+4;}}
const _updBanksInv=updBanks;
let invAcc=0;
updBanks=function(){_updBanksInv();invAcc++;if(invAcc%60===0||INV.ev&&INV.ev.phase==='fight'&&invAcc%10===0||INV.leaving){try{invTick();}catch(e){}}};
const _rrMiniInv=rrMini;
rrMini=function(c,tf){_rrMiniInv(c,tf);const E=INV.ev;if(!E||DUN)return;const dx=E.x-P.pos.x,dz=E.z-P.pos.z;let x=E.x,z=E.z;const m=Math.max(Math.abs(dx),Math.abs(dz));
  if(m>95){x=P.pos.x+dx/m*92;z=P.pos.z+dz/m*92;}const q=tf(x,z);c.font='bold 18px sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.fillStyle='#000';c.fillText('⚠',q[0]+1,q[1]+1);c.fillStyle=(Math.floor(T*3)%2)?'#ff5a5a':'#ffd25a';c.fillText('⚠',q[0],q[1]);};
// achievements (game40): symbiants (game45) and invasions
ACH_CATS.push(['sym','🧩','Symbiants & invasions']);
A_('sym','sym1','Pattern Recognition','Assemble a symbiant pattern',10,()=>(P.sym&&P.sym.made)|0,1);
A_('sym','symk1','Echo Breaker','Defeat a pocket boss',10,()=>P.sym?Object.values(P.sym.kills||{}).reduce((a,b)=>a+b,0):0,1);
A_('sym','symk10','Echo Hunter','Defeat 10 pocket bosses',20,()=>P.sym?Object.values(P.sym.kills||{}).reduce((a,b)=>a+b,0):0,10,{title:'Echo Hunter'});
A_('sym','symall','Every Echo','Defeat all ten different pocket bosses',40,()=>P.sym?Object.keys(P.sym.kills||{}).length:0,10,{title:'the Echoborn'});
A_('sym','inv1','Holding the Line','Repel an invasion',10,()=>(P.inva&&P.inva.won)|0,1);
A_('sym','inv10','Legion\'s Bane','Repel 10 invasions',25,()=>(P.inva&&P.inva.won)|0,10,{title:'Legion\'s Bane'});
function invExports(){return {INV,INV_SITES,invStart,invTick,invEnd,invFields,invPickSite};}
