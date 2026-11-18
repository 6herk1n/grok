/* ================= Wildshifter MORPHS (temporary shapeshift forms) =================
   A morph is learned as a Weave Disk (kind:'morph' in NEW_WEAVES). Casting it adds a 'morph' buff whose mods feed statsFor like any
   other buff (so morph stats count for twinking exactly like Drill Protocol or a Focus Stim), swaps the player model, swaps the HUD
   Weave bar to the form's own abilities, replaces the basic attack, and blocks normal Weaves and weapon swaps until it ends.
   Data-driven: add a MORPHS entry + a kind:'morph' Weave with morph:'<id>'. */
const MORPHS={
  wolf:{name:'Dune Wolf',icon:'🐺',dur:60,col:0xb08a5a,mods:L=>({run:85,wpn:10+L*2,str:4+L,agi:4+L,crit:5}),regen:0,
    basic:{id:'basic',name:'Claws',icon:'🐾',cost:0,cd:0.7,range:3.6,mult:1.35,melee:true},abs:['m_rend','m_pounce','m_howl']},
  lizard:{name:'Glass Lizard',icon:'🦎',dur:75,col:0x7fd8c8,mods:L=>({evade:40+L*4,dr:8,agi:5+L,sen:4}),regen:0.03,
    basic:{id:'basic',name:'Glass Fangs',icon:'🦷',cost:0,cd:0.8,range:3.4,mult:1.05,melee:true},abs:['m_lash','m_spit','m_shed']},
  drake:{name:'Sand Drake',icon:'🐉',dur:60,col:0x9a4a26,mods:L=>({body:20+L*3,sta:6+L,hp:100+L*15,dr:20,str:6+L}),regen:0,
    basic:{id:'basic',name:'Talon Rake',icon:'🦅',cost:0,cd:1.0,range:4.2,mult:1.45,melee:true},abs:['m_breath','m_buffet','m_ward']}};
const MORPH_AB={
  m_rend:{name:'Rending Bite',icon:'🦷',cost:12,cd:4,range:4,needTarget:true,kind:'mbite',mult:2.0,dot:0.45,dur:6,desc:'200% bite, then the wound bleeds for 45% per second for 6s.'},
  m_pounce:{name:'Pounce',icon:'💨',cost:15,cd:9,range:15,needTarget:true,kind:'pounce',mult:1.5,stun:1.5,desc:'Leap onto a target up to 15m away for 150% damage and a 1.5s stun.'},
  m_howl:{name:'Pack Howl',icon:'🌕',cost:15,cd:25,range:0,buff:{dur:20,mods:L=>({power:15,crit:6})},desc:'20s: +15% power and +6% crit.'},
  m_lash:{name:'Tail Lash',icon:'🌀',cost:14,cd:6,range:5,needTarget:false,kind:'aoeSelf',mult:1.3,radius:5,root:2,color:0x7fd8c8,desc:'AoE: 130% damage to everything within 5m and roots them for 2s.'},
  m_spit:{name:'Glass Spit',icon:'💧',cost:12,cd:5,range:18,needTarget:true,kind:'nuke',mult:1.5,root:3,color:0x9ff8e8,desc:'Spits molten glass for 150% damage and a 3s root.'},
  m_shed:{name:'Shed Skin',icon:'✨',cost:20,cd:20,range:0,needTarget:false,kind:'heal',pct:0.25,dr:0.3,dur:5,desc:'Heal 25% of max health and take 30% less damage for 5s.'},
  m_breath:{name:'Cinder Breath',icon:'🔥',cost:30,cd:8,range:11,needTarget:false,kind:'cone',mult:2.4,angle:1.25,color:0xff7a2a,desc:'AoE: breathes fire in an 11m cone for 240% damage.'},
  m_buffet:{name:'Wing Buffet',icon:'🌪️',cost:22,cd:10,range:7,needTarget:false,kind:'aoeSelf',mult:1.4,radius:7,root:3,color:0xffc890,desc:'AoE: 140% damage to everything within 7m and pins them for 3s.'},
  m_ward:{name:'Scale Ward',icon:'🛡️',cost:20,cd:20,range:0,needTarget:false,kind:'dr',amt:0.5,dur:8,desc:'Take 50% less damage for 8s.'},
  m_revert:{name:'Revert',icon:'↩️',cost:0,cd:0,range:0,needTarget:false,kind:'unmorph',desc:'Return to your normal form (normal Weaves and weapon swaps come back).'}};
for(const k in MORPH_AB){const a=MORPH_AB[k];a.id=k;a.mab=true;a.prof='wild';}
const abDef=id=>id?(WEAVES[id]||MORPH_AB[id]||PERK_AB[id]||null):null;
function barIds(){if(P.morph&&MORPHS[P.morph.id]){const a=MORPHS[P.morph.id].abs.concat(['m_revert']);while(a.length<NSLOTS)a.push(null);return a;}return P.slots||[];}
KIND.morph=(t,a)=>startMorph(a.morph,a);
KIND.unmorph=()=>endMorph();
KIND.mbite=(t,a)=>{faceTarget(t);P.atkAnim=0.35;dmgEnemy(t,a.mult);if(!t.dead){t.dot={until:T+a.dur,next:T+1,mult:a.dot,en:0};floatText(entChest(t,tmpV),'Bleeding','info');}ringFx(t.pos.x,t.pos.z,0xff5a4a,1.4,0.3);nz(0.1,0.08,2500);};
KIND.pounce=(t,a)=>{const dx=t.pos.x-P.pos.x,dz=t.pos.z-P.pos.z,d=Math.hypot(dx,dz)||1;const k=Math.max(0,d-1.6)/d;ringFx(P.pos.x,P.pos.z,0xd8b080,2,0.3);
  P.pos.x+=dx*k;P.pos.z+=dz*k;P.pos.y=heightAt(P.pos.x,P.pos.z);faceTarget(t);P.atkAnim=0.4;dmgEnemy(t,a.mult);if(!t.dead){t.stunUntil=T+a.stun;floatText(entChest(t,tmpV),'Stunned','info');}ringFx(t.pos.x,t.pos.z,0xd8b080,2.2,0.4);SFX.hit();};
function morphBasic(){return P.morph&&MORPHS[P.morph.id]?MORPHS[P.morph.id].basic:null;}
let MM=null;// morph model
function buildMorphModel_v1(id){const M=MORPHS[id],g=new THREE.Group();const c=M.col,d=0x2a1c12;const R={g,legs:[],wings:[]};
  const leg=(x,z,h,w)=>{const p=new THREE.Group();p.position.set(x,h,z);part(p,geoBox,M_(c),0,-h/2,0,w,h,w);g.add(p);R.legs.push(p);};
  if(id==='wolf'){part(g,geoBox,M_(c),0,0.85,0,0.55,0.5,1.3);part(g,geoBox,M_(0x8a6a42),0,1.0,0.75,0.5,0.5,0.45);part(g,geoBox,M_(0x6a5232),0,0.92,1.12,0.26,0.24,0.4);
    part(g,geoBox,M_(d),-0.15,1.32,0.72,0.1,0.22,0.08);part(g,geoBox,M_(d),0.15,1.32,0.72,0.1,0.22,0.08);part(g,geoBox,MB(0xffc85a),-0.13,1.08,0.98,0.06,0.06,0.04);part(g,geoBox,MB(0xffc85a),0.13,1.08,0.98,0.06,0.06,0.04);
    const tl=part(g,geoBox,M_(0x8a6a42),0,1.0,-0.85,0.14,0.14,0.6);tl.rotation.x=0.6;[[-0.2,0.45],[0.2,0.45],[-0.2,-0.45],[0.2,-0.45]].forEach(([x,z])=>leg(x,z,0.65,0.16));}
  else if(id==='lizard'){part(g,geoBox,M_(c),0,0.45,0,0.7,0.32,1.5);part(g,geoBox,M_(0x5ab0a0),0,0.5,0.95,0.45,0.28,0.55);part(g,geoBox,MB(0xffe95a),-0.16,0.6,1.1,0.06,0.06,0.04);part(g,geoBox,MB(0xffe95a),0.16,0.6,1.1,0.06,0.06,0.04);
    part(g,geoBox,M_(c),0,0.4,-1.15,0.22,0.16,0.9);for(let i=0;i<4;i++)part(g,new THREE.ConeGeometry(0.1,0.35,4),MB(0x9ff8e8),0,0.75,0.5-i*0.35,1,1,1);[[-0.42,0.45],[0.42,0.45],[-0.42,-0.45],[0.42,-0.45]].forEach(([x,z])=>leg(x,z,0.32,0.14));}
  else{part(g,geoBox,M_(c),0,1.5,0,0.95,0.9,1.9);part(g,geoBox,M_(0x7a3a1e),0,2.15,1.15,0.5,0.55,0.8);part(g,geoBox,M_(0x5a2a16),0,2.0,1.6,0.36,0.3,0.5);
    part(g,geoBox,MB(0xffb347),-0.18,2.28,1.5,0.08,0.08,0.05);part(g,geoBox,MB(0xffb347),0.18,2.28,1.5,0.08,0.08,0.05);part(g,new THREE.ConeGeometry(0.1,0.45,4),M_(0xe6d6b0),-0.18,2.55,1.0,1,1,1);part(g,new THREE.ConeGeometry(0.1,0.45,4),M_(0xe6d6b0),0.18,2.55,1.0,1,1,1);
    const tl=part(g,geoBox,M_(c),0,1.3,-1.5,0.3,0.3,1.4);tl.rotation.x=0.35;for(const s of [-1,1]){const w=new THREE.Group();w.position.set(0.45*s,1.95,0.1);part(w,geoBox,M_(0xc86a2a),1.1*s,0,0,2.2,0.06,1.2);g.add(w);R.wings.push({w,s});}
    [[-0.38,0.6],[0.38,0.6],[-0.38,-0.6],[0.38,-0.6]].forEach(([x,z])=>leg(x,z,1.05,0.26));}
  return R;}
const M_=c=>M(c);
function startMorph(id,w){const D=MORPHS[id];if(!D)return;if(P.morph)endMorph(true);if(P.mount)dismount();
  P.morph={id,wid:w&&w.id};addBuff('morph',D.name+' form',D.icon,D.dur,D.mods(P.level));const b=P.buffs.find(x=>x.id==='morph');if(b)b.morph=id;
  if(MM)scene.remove(MM.g);MM=buildMorphModel(id);scene.add(MM.g);PM.g.visible=false;document.body.classList.add('morphed');setupHud();
  ringFx(P.pos.x,P.pos.z,D.col,4,0.8);SFX.level();banner(D.icon+' '+D.name.toUpperCase()+' FORM',D.dur+'s · the Weave bar now shows '+D.name+' abilities · ↩️ reverts');}
function endMorph(quiet){if(!P.morph)return;const D=MORPHS[P.morph.id];P.morph=null;P.buffs=P.buffs.filter(b=>b.id!=='morph');calcStats();
  if(MM){scene.remove(MM.g);MM=null;}if(PM)PM.g.visible=true;document.body.classList.remove('morphed');setupHud();if(!quiet){ringFx(P.pos.x,P.pos.z,0xc8f060,3,0.6);log('<span style="opacity:.85">'+(D?D.icon+' '+esc(D.name)+' form ended':'Morph ended')+'</span>');}save();}
// saves never resume a morph: an old 'morph' buff is dropped at load
function morphReset(){P.morph=null;P.buffs=(P.buffs||[]).filter(b=>b.id!=='morph');if(MM){scene.remove(MM.g);MM=null;}document.body.classList.remove('morphed');}
let mAcc=0;
function updMorph(dt){if(!P.morph){if(MM){scene.remove(MM.g);MM=null;}return;}const D=MORPHS[P.morph.id];
  if(P.dead||P.mount||!P.buffs.some(b=>b.id==='morph')){endMorph();return;}
  if(MM&&PM){PM.g.visible=false;MM.g.position.copy(PM.g.position);MM.g.rotation.y=P.rotY;if(MM.anim)MM.anim(T,P.moving||0,P.atkAnim||0);else{const sw=Math.sin(T*13)*0.7*P.moving;MM.legs.forEach((l,i)=>l.rotation.x=(i%2?sw:-sw)*(i<2?1:-1));
    MM.wings.forEach(({w,s})=>w.rotation.z=s*(0.25+Math.sin(T*(P.moving>0.3?9:3))*0.3));}MM.g.position.y+=P.atkAnim>0?0.1:0;}
  mAcc+=dt;if(mAcc>=1){mAcc=0;if(D.regen&&P.hp<S.maxHp)healPlayer(S.maxHp*D.regen);}}
function morphLeft(){const b=P.buffs.find(x=>x.id==='morph');return b?Math.max(0,b.until-T):0;}
/* team missions: 7 professions but a team holds at most 6 (you + 5 alts), so you have to choose */
const TEAM_MAX=6;
function buildTeam(ids){ids=(ids||[]).filter(id=>id!==activeId);const uniq=[...new Set(ids)];const team=uniq.slice(0,TEAM_MAX-1).map(partySnapshot).filter(Boolean);
  return {ok:uniq.length<=TEAM_MAX-1,size:team.length+1,max:TEAM_MAX,team,dropped:uniq.slice(TEAM_MAX-1),why:uniq.length>TEAM_MAX-1?'A team holds at most '+TEAM_MAX+' (you + '+(TEAM_MAX-1)+'): choose who comes':''};}
function morphExports(){return {PROFS,WTYPES,PROF_WT,AFAM,sheetFromPlayer,UNIQUES,MORPHS,MORPH_AB,abDef,barIds,startMorph,endMorph,morphReset,morphLeft,TEAM_MAX,buildTeam,get morph(){return P.morph;},get MM(){return MM;}};}
/* ---------- Run Speed: on-foot speed multiplier. Vehicles use their own speed (run speed and slows ignored while mounted). ---------- */
const SLOW_FLOOR=0.45;
function applySlow(mul,dur,name){if(P.mount)return;const now=T<(P.slowUntil||0);if(!now||mul<=P.slowAmt){P.slowAmt=mul;}P.slowUntil=Math.max(P.slowUntil||0,T+dur);if(!now)floatText(tmpV.set(P.pos.x,P.pos.y+2.4,P.pos.z),name||'Slowed','info');}
function slowMul(){return T<(P.slowUntil||0)?P.slowAmt||1:1;}
function moveMul(){if(P.mount)return mountMul();return Math.max(SLOW_FLOOR,(1+(S.runPct||0)/100)*slowMul());}
function runExports(){return {IMPDEF,RUN_CAP,RUN_SP,RUNPROF,runPctOf,moveMul,slowMul,applySlow,skillCap,costOf,baseOf,raise:typeof raise==='function'?raise:null,openSkills,CONSUM,BREEDS,SPEED};}
