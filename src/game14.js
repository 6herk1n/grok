/* ================= RAIDS (team instances with a lockout) =================
   Data-driven: a RAIDS entry is a dungeon (same room/boss/loot engine as DUNGEONS) plus:
   - team:{size}            full team (you + alts from your roster, empty seats filled by contract mercenaries)
   - lockout:{runs,period}  runs per period. period 'week' = resets every Monday 00:00 local time; 'day' = every midnight.
                            A run is used the first time a boss dies in it (wiping before any kill costs nothing).
   - tokens:{bossKey:n}     Raid Sigils (◈) per boss: raid currency for the Sigil Quartermaster.
   - minLvl/cap/gate        same level-cap + story rules as dungeons (party judged by its highest member).
   A future high-level raid only needs another entry (higher minLvl/cap, its own rooms/bosses/loot); future:true lists it as coming later. */
var RAIDS={},MECH_EXT={};
function buildPylon_v1(){const g=new THREE.Group();const R={g};part(g,geoBox,M(0x2a2220),0,0.3,0,1.3,0.6,1.3);R.cr=part(g,geoCone,MB(0xff7a2a),0,1.9,0,0.55,2.6,0.55);part(g,geoBox,MB(0xffc85a),0,0.62,0,0.9,0.06,0.9);
  R.anim=(t,mv,atk)=>{R.cr.rotation.y=t*1.5;R.cr.scale.y=atk>0?1.15:1;};return R;}
function buildSlagwarden_v1(){const R=buildCustodian();retint(R.g,0x4a2418,0.75,0xff6a2a);part(R.g,geoBox,MB(0xff6a2a),0,2.62,0.2,0.7,0.14,0.7);return R;}
function buildEmberQueen_v1(){const R=buildMatriarch();retint(R.g,0x7a2410,0.7,0xffb347);return R;}
function buildColossus_v1(){const R=buildForeman();retint(R.g,0x3a302c,0.8,0xff4a1a);for(const s of [-1,1])part(R.g,geoCone,MB(0xff6a2a),s*0.55,2.7,0.1,0.18,0.7,0.18);return R;}
function buildCinderguard_v1(){const R=buildEnforcer();retint(R.g,0x4a2a20,0.5,0xff6a2a);return R;}
function buildAshhound_v1(){const R=buildVSkitter();retint(R.g,0x5a2a1a,0.6,0xff8a3a);return R;}
function buildAdept_v1(){const R=buildSentry();retint(R.g,0x5a3a30,0.55,0xffb347);return R;}
Object.assign(ETYPES,{
  ashhound:{name:'Ash Hound',hp:44,dmg:7,atkCd:1.1,range:2.0,speed:6.4,aggro:15,xp:1.2,ranged:false,hitR:1.0,h:1.1,build:buildAshhound,scale:1.1},
  cinderguard:{name:'Cinderdeep Guard',hp:110,dmg:14,atkCd:2.0,range:2.6,speed:5.0,aggro:15,xp:1.6,ranged:false,hitR:0.75,h:1.9,build:buildCinderguard,scale:1.15},
  emberadept:{name:'Ember Adept',hp:70,dmg:11,atkCd:1.7,range:18,speed:4.6,aggro:19,xp:1.4,ranged:true,hitR:0.7,h:1.9,build:buildAdept,scale:1},
  pylon:{name:'Ember Pylon',hp:160,dmg:6,atkCd:2.2,range:24,speed:0,aggro:30,xp:0.5,ranged:true,hitR:0.9,h:3,build:buildPylon,scale:1},
  slagwarden:{name:'Slagwarden Torvek',hp:1100,dmg:15,atkCd:2.1,range:4.8,speed:4.4,aggro:20,xp:14,ranged:false,hitR:1.6,h:2.6,build:buildSlagwarden,scale:2.3},
  emberqueen:{name:'Vessa, the Ember Queen',hp:1200,dmg:14,atkCd:1.8,range:4.6,speed:4.8,aggro:20,xp:16,ranged:false,hitR:1.0,h:1.1,build:buildEmberQueen,scale:3.3},
  colossus:{name:'The Ashen Colossus',hp:1600,dmg:17,atkCd:2.2,range:5.2,speed:4.2,aggro:22,xp:24,ranged:false,hitR:1.9,h:2.6,build:buildColossus,scale:2.9}});
Object.assign(BOSSES,{
  slagwarden:{etype:'slagwarden',lvl:10,intro:'Scorch Brand marks the whole team: spread out!',mech:[
    {t:'slam',name:'Slag Quake',every:10,first:5,r:8,delay:1.8,mult:2.4,desc:'Telegraphed 8m quake around him. Everyone out.'},
    {t:'pools',name:'Scorch Brand',every:13,first:9,r:3.5,delay:2.0,mult:1.1,count:1,desc:'A circle under every team member. Spread out: overlapping circles stack their damage.'},
    {t:'adds',name:'Guard Call',at:[0.5],etype:'cinderguard',n:2,lvl:9,desc:'At 50% two Cinderdeep Guards join.'}]},
  emberqueen:{etype:'emberqueen',lvl:10,intro:'Magma Rain, and her Pylons shield her. Break the Pylons!',mech:[
    {t:'pools',name:'Magma Rain',every:11,first:4,r:4,delay:1.8,mult:2.0,count:2,desc:'Magma circles fall on and around every team member. Move.'},
    {t:'shield',name:'Pylon Shield',at:[0.66,0.33],n:3,lvl:10,desc:'At 66% and 33% three Ember Pylons rise and she is immune until all are destroyed.'},
    {t:'enrage',name:'Firestorm',at:0.2,dmg:1.4,cd:0.7,spd:1.2,desc:'Below 20% she enrages.'}]},
  colossus:{etype:'colossus',lvl:10,intro:'Inferno Nova burns everything far from him: get close when it glows!',mech:[
    {t:'slam',name:'Ashen Stomp',every:12,first:6,r:7,delay:1.7,mult:2.6,desc:'Telegraphed 7m stomp. Get out.'},
    {t:'nova',name:'Inferno Nova',every:18,first:14,safe:6,r:26,delay:2.6,mult:2.8,desc:'The whole room burns except a 6m safe ring around him. Run IN.'},
    {t:'pools',name:'Ember Fall',every:15,first:20,r:3.5,delay:1.8,mult:1.8,count:2,desc:'Embers fall on every team member.'},
    {t:'adds',name:'Adepts of the Deep',at:[0.6,0.3],etype:'emberadept',n:3,lvl:10,desc:'At 60% and 30% three Ember Adepts join.'},
    {t:'enrage',name:'Meltdown',time:200,dmg:1.7,cd:0.65,spd:1.3,desc:'After 200s he melts down (soft enrage). Kill him in time.'}]}});
Object.assign(UNIQUES,{
  colossus_cleaver:{d:'bastion',name:'Colossus Cleaver',slot:'weapon',wt:'blade',lvl:10,dmgM:1.15,bonus:{wpn:16,str:6,crit:4},sig:14},
  pyre_repeater:{d:'bastion',name:'Pyre Repeater',slot:'weapon',wt:'rifle',lvl:10,dmgM:1.12,bonus:{wpn:15,agi:5,crit:4},sig:14},
  queens_ember:{d:'bastion',name:"Queen's Ember",slot:'weapon',wt:'rod',lvl:10,bonus:{weave:18,psy:6,en:50},sig:14},
  slag_suture:{d:'bastion',name:'Slagforged Suture',slot:'weapon',wt:'pistol',lvl:10,bonus:{wpn:12,treat:14,sen:5},sig:12},
  cb_helm:{d:'bastion',name:'Cinderborn Helm',slot:'head',fam:'heavy',lvl:10,set:'cinderborn',bonus:{sta:6,hp:70,body:8},sig:8},
  cb_plate:{d:'bastion',name:'Cinderborn Plate',slot:'armor',fam:'heavy',lvl:10,set:'cinderborn',bonus:{str:6,hp:110,power:6},sig:10},
  cb_grips:{d:'bastion',name:'Cinderborn Grips',slot:'hands',fam:'medium',lvl:10,set:'cinderborn',bonus:{agi:5,wpn:8,crit:3},sig:6},
  cb_greaves:{d:'bastion',name:'Cinderborn Greaves',slot:'legs',fam:'medium',lvl:10,set:'cinderborn',bonus:{agi:5,sen:5,run:25},sig:8},
  ashen_eye:{d:'bastion',name:'Eye of the Colossus',kind:'imp',slot:'eyes',ql:60,relic:true,bonus:{sen:16,wpn:14,crit:6,power:10}}});
SETS.cinderborn={name:'Cinderborn',pieces:['cb_helm','cb_plate','cb_grips','cb_greaves'],bonus:{2:{hp:90,str:4},4:{power:10,crit:4,armor:60}}};
RAIDS.bastion={id:'bastion',raid:true,name:'The Cinderdeep Bastion',sub:'Ashborn forge-fortress under the Cinderveil',lvl:[9,10],minLvl:9,cap:10,rec:10,gate:'vault',
  door:{x:137,z:238},accent:0xff6a2a,team:{size:6},lockout:{runs:3,period:'week'},tokens:{slagwarden:2,emberqueen:3,colossus:5},
  desc:'Deep under the Cinderveil Badlands the Ashborn forge-masters woke something they could not cool. Three wardens hold the Bastion. Bring a full team.',
  pal:{floor:0x2e2220,floor2:0x241a18,wall:0x4a3028,trim:0x2a1c18,glow:[0xff6a2a,0xffb347],fog:0x120806,hemi:[0xffb080,0x1a0806,0.66],plight:0xffa060},
  rooms:[{w:22,d:18,entry:true},{w:30,d:24,packs:[[['ashhound',9],['ashhound',9],['ashhound',9],['cinderguard',9]],[['emberadept',9],['cinderguard',9],['ashhound',9]]]},{w:36,d:32,boss:'slagwarden'},
    {w:30,d:24,packs:[[['cinderguard',10],['cinderguard',9],['emberadept',10]],[['ashhound',10],['ashhound',10],['emberadept',9],['emberadept',9]]]},{w:38,d:34,boss:'emberqueen'},
    {w:30,d:24,packs:[[['cinderguard',10],['emberadept',10],['cinderguard',10],['ashhound',10]]]},{w:44,d:40,boss:'colossus',final:true}],
  loot:{slagwarden:{items:['cb_helm','cb_grips','pyre_repeater','slag_suture'],extraP:0.25},emberqueen:{items:['queens_ember','cb_greaves','cb_helm','cb_plate'],extraP:0.3},
    colossus:{items:['colossus_cleaver','pyre_repeater','queens_ember','slag_suture','cb_plate','cb_greaves','cb_grips','cb_helm'],extraP:0.45,relic:'ashen_eye',relicP:0.08},trashP:0.02},
  modes:{team:{hp:2.6,dmg:1.15,lvl:0,size:[6,6]}},
  // Veteran mode (Build B, extended to 30 in Build C): over-cap teams (top level 11-30) may enter; every mob is raised to the team's top level and raid uniques drop as Veteran copies at that level
  vet:{minTop:11,cap:30,hp:2.6,dmg:1.15,sig:1.5}};
// A future high-level raid fits the same data shape; it stays listed as "coming later" until the level cap reaches it.
RAIDS.sunless={id:'sunless',raid:true,future:true,name:'The Sunless Throne',sub:'A sealed Vyre abyss, far beyond the Reach',lvl:[100,120],minLvl:100,cap:120,rec:120,gate:null,
  team:{size:6},lockout:{runs:3,period:'week'},tokens:{},desc:'Something vast sleeps under the deepest seam. It will not open until contractors can reach level 100.',rooms:[],loot:{},modes:{team:{hp:6,dmg:1.6,lvl:0,size:[6,6]}}};
function validateRaids(){for(const k in RAIDS){const R=RAIDS[k];if(!R.lockout||!(R.lockout.runs>0))console.warn('DUSTREACH: raid '+k+' has no lockout');if(!R.future&&R.cap>MAXLVL)console.warn('DUSTREACH: raid '+k+' cap above max level');
  if(R.gate&&!GATES[R.gate])console.warn('DUSTREACH: raid '+k+' uses unknown gate '+R.gate);}}
validateRaids();
const RAID_CUR='◈';const SIGIL='Raid Sigils';
/* ---------- lockout clock (weekly: Monday 00:00 local) ---------- */
var RAIDCLK={off:0};const raidNow=()=>Date.now()+RAIDCLK.off;
function periodStart(t,per){const d=new Date(t);d.setHours(0,0,0,0);if(per!=='day')d.setDate(d.getDate()-((d.getDay()+6)%7));return d;}
function periodKey(t,per){const d=periodStart(t,per);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function nextReset(t,per){const d=periodStart(t,per);d.setDate(d.getDate()+(per==='day'?1:7));return d.getTime();}
function fmtLeft(ms){ms=Math.max(0,ms);const m=Math.floor(ms/60000),d=Math.floor(m/1440),h=Math.floor(m%1440/60),mi=m%60;return d?d+'d '+h+'h':h?h+'h '+mi+'m':mi+'m';}
function normRaidLock(x){const o={};if(x&&typeof x==='object')for(const k in x){const r=x[k];if(r&&typeof r.wk==='string')o[k]={wk:r.wk,used:Math.max(0,r.used|0)};if(r.stage)o[k].stage=Math.max(0,Math.min(5,r.stage|0));if(r.done)o[k].done=true;}return o;}
function raidRec(id){const R=RAIDS[id];const per=R.lockout.period;const k=per==='gweek'?gweekKey():periodKey(raidNow(),per);P.raidLock=P.raidLock||{};let r=P.raidLock[id];if(!r||r.wk!==k)r=P.raidLock[id]={wk:k,used:0};return r;}
function raidLeft(id){const R=RAIDS[id];return Math.max(0,R.lockout.runs-raidRec(id).used);}
function raidResetIn(id){if(RAIDS[id].lockout.period==='gweek')return gweekLeftMs();return nextReset(raidNow(),RAIDS[id].lockout.period)-raidNow();}
function raidResetTxt(id){const R=RAIDS[id];if(R.lockout.period==='gweek')return gweekTxt();return (R.lockout.period==='day'?'daily at 00:00':'every Monday 00:00')+' (in '+fmtLeft(raidResetIn(id))+')';}
function raidUse(id){const r=raidRec(id);r.used++;return r.used;}
/* ---------- team ---------- */
const MERC=[{prof:'vanguard',role:'tank',name:'Brask (contract)'},{prof:'mender',role:'healer',name:'Ilsa (contract)'},{prof:'flux',role:'dps',name:'Corr (contract)'},{prof:'runner',role:'dps',name:'Tamsin (contract)'},{prof:'wild',role:'dps',name:'Odo (contract)'},{prof:'weaver',role:'control',name:'Mirel (contract)'},{prof:'wright',role:'pet',name:'Gant (contract)'}];
const raidHiCap=R=>R.vet?R.vet.cap:R.cap;
// Veteran level for a team: its top level when over the normal cap and within the Veteran cap, else 0
function raidVetLv(id,party){const R=RAIDS[id];if(!R||!R.vet)return 0;const lv=partyTopLevel(party);return lv>R.cap&&lv>=(R.vet.minTop||R.cap+1)&&lv<=R.vet.cap?lv:0;}
function raidAlts(id){const R=RAIDS[id];return roster.chars.filter(c=>c.id!==activeId).map(c=>({id:c.id,name:c.name,level:c.level,prof:c.prof,role:(c.party&&c.party.role)||ROLE[c.prof]||'dps',over:c.level>raidHiCap(R)})).sort((a,b)=>b.level-a.level);}
function raidPicks(id){const R=RAIDS[id];const al=raidAlts(id);const ok=new Set(al.filter(a=>!a.over).map(a=>a.id));const max=R.team.size-1;
  let ids=Array.isArray(P.raidTeam)?P.raidTeam.filter(x=>ok.has(x)):al.filter(a=>!a.over).map(a=>a.id);return ids.slice(0,max);}
function mercSnap(m,lv){const c=normalizeChar({prof:m.prof,level:lv,name:m.name});c.id='merc_'+m.prof;const st=statsFor({...c,buffs:[]});const pr=PROFS[m.prof];const wt=PROF_WT[m.prof];
  st.dmg=Math.max(st.dmg,Math.round((4+lv*2.4)*1.6*WTYPES[wt].dm));st.armor=Math.max(st.armor,lv*14);
  return {id:c.id,merc:true,name:m.name,prof:m.prof,profName:pr.name,level:lv,role:m.role,ai:'default',stats:st,eq:{weapon:{wt}},imps:{},visual:{color:pr.color,accent:pr.accent,visor:pr.visor}};}
function raidTeam(id,ids){const R=RAIDS[id];if(R.noMerc)return sunTeam(id,ids);const pick=(ids||raidPicks(id)).slice(0,R.team.size-1);const team=pick.map(partySnapshot).filter(Boolean);
  const roles=new Set([ROLE[P.prof],...team.map(t=>t.role)]);const need=MERC.filter(m=>(m.role==='tank'||m.role==='healer')&&!roles.has(m.role)).concat(MERC.filter(m=>m.role!=='tank'&&m.role!=='healer'));
  const vl=raidVetLv(id,team);const lv=vl||Math.min(R.cap,Math.max(R.minLvl,P.level));let i=0;while(team.length<R.team.size-1&&i<need.length)team.push(mercSnap(need[i++],lv));return team;}
/* ---------- entry ---------- */
function raidEntryCheck(id,party){const R=RAIDS[id];if(!R)return {ok:false,why:'unknown',msg:'Unknown raid'};
  if(R.future)return {ok:false,why:'future',msg:R.minLvl<=MAXLVL?R.name+' is sealed – it opens in a later update (Lv '+R.minLvl+'+ team raid)':'Requires level '+R.minLvl+' – the level cap is '+MAXLVL+' for now'};
  if(R.unseal)return sunEntryCheck(id,party);// Build N: the Sunless Throne has its own unseal / team / lockout rules
  if(R.gate&&!gateOpen(R.gate)){const s=STEP[GATES[R.gate].step];return {ok:false,why:'story',step:s.id,msg:gateMsg(R.gate)};}
  const lv=partyTopLevel(party);const vet=raidVetLv(id,party);if(lv>R.cap&&!vet)return {ok:false,why:'cap',lv,msg:'Level cap '+raidHiCap(R)+' – '+(lv>P.level?'a team member (Lv '+lv+') is':'you are')+' too experienced for '+R.name};
  if(P.level<R.minLvl)return {ok:false,why:'min',lv,msg:'Requires level '+R.minLvl+' – you are level '+P.level};
  if(raidLeft(id)<=0)return {ok:false,why:'lockout',lv,msg:'Raid lockout: '+R.lockout.runs+'/'+R.lockout.runs+' runs used – resets '+raidResetTxt(id)};
  return {ok:true,lv,vet};}
function enterRaid(id,ids){const R=RAIDS[id];if(!R||DUN)return false;const team=raidTeam(id,ids);const ck=raidEntryCheck(id,team);
  if(!ck.ok){warn(ck.msg);if(ck.why==='story')lockedMsg(R.gate,true);else if(ck.why==='lockout')banner('RAID LOCKOUT',ck.msg.replace(/^Raid lockout: /,''));else if(ck.why==='cap')banner('LEVEL CAP '+R.cap,ck.msg.replace(/^Level cap \d+ – /,''));return false;}
  const vet=ck.vet;const V=R.vet;if(!enterDungeon(id,vet?{modeObj:{hp:V.hp,dmg:V.dmg,lvl:vet-R.cap,size:R.modes.team.size,vet},party:team}:{mode:'team',party:team}))return false;
  DUN.raidRun={counted:false,kills:0,team:team.map(t=>t.id)};DUN.raidAllies=[];raidSpawnTeam();if(R.onEnter)R.onEnter(DUN);
  banner(R.name.toUpperCase()+(vet?' · VETERAN':''),'Raid · team of '+R.team.size+(vet?' · scaled to Lv '+vet:'')+' · '+raidLeft(id)+'/'+R.lockout.runs+(R.lockout.period==='gweek'?' run left this game-week':' runs left this week'));
  log('⚔ Raid: <b style="color:#ff9a2a">'+esc(R.name)+'</b>. The lockout run is used when the first boss dies.');return true;}
function raidSpawnTeam(){const d=DUN;if(!d||!d.D.raid)return;for(const a of d.raidAllies.slice())if(!a.dead)removeAlly(a);d.raidAllies=[];
  d.party.forEach((s,i)=>{const a=spawnPartyMember(s);if(!a)return;a.raid=true;a.snapId=s.id;a.merc=!!s.merc;a.healCd=2+i*0.4;const hm=s.role==='tank'?3.5:2.2;a.maxHp=a.baseMax=a.hp=Math.round(a.hp*hm);a.dmg*=1.6;if(s.role==='tank'){a.dr=Math.min(0.6,a.dr+0.15);a.threat=1;}
    if(s.merc)a.name=s.name;const ang=i/5*6.28;a.pos.set(P.pos.x+Math.cos(ang)*2.4,0,P.pos.z+Math.sin(ang)*2.4);d.raidAllies.push(a);});if(d.D.onTeam)d.D.onTeam(d);}
function raidExitCleanup(d){for(const a of (d.raidAllies||[]))if(!a.dead)removeAlly(a);d.raidAllies=[];}
function raidRez(){const d=DUN;if(!d||!d.D.raid)return;raidSpawnTeam();log('⚔ Your team regroups at the entrance.');}
/* ---------- runtime ---------- */
let raidAcc=0;
function updRaid(dt){const d=DUN;const al=d.raidAllies.filter(a=>!a.dead&&allies.includes(a));
  // AI dodging: team members step out of (or into, for novas) telegraphs a moment after they appear
  for(const a of al)for(const t of d.tele){if(T-t.t0<0.45||T>=t.at)continue;const dx=a.pos.x-t.x,dz=a.pos.z-t.z,dd=Math.hypot(dx,dz)||0.01;
    if(t.inner){if(dd>t.inner-1.2)moveAlly(a,t.x,t.z,a.speed*1.1,dt,t.inner*0.5);}else if(dd<t.r+0.8)moveAlly(a,t.x+dx/dd*(t.r+2),t.z+dz/dd*(t.r+2),a.speed*1.1,dt,0.2);}
  // healers keep the team up
  for(const a of al){if(a.role!=='healer')continue;a.healCd-=dt;if(a.healCd>0)continue;a.healCd=2.4;
    const pool=[{e:P,f:P.dead?1:P.hp/S.maxHp}].concat(al.map(o=>({e:o,f:o.hp/o.maxHp})));pool.sort((x,y)=>x.f-y.f);const w=pool[0];if(w.f>0.92)continue;
    if(w.e===P)healPlayer(S.maxHp*0.14);else allyHeal(w.e,w.e.maxHp*0.16);ringFx(w.e.pos.x,w.e.pos.z,0x6dff8a,1.4,0.35);}
  // shield bubbles
  for(const e of d.bosses){const b=e.boss;const on=!e.dead&&e.immune&&e.immune();if(on&&!b.bubble){b.bubble=new THREE.Mesh(geoSphere,new THREE.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:0.25,depthWrite:false}));d.group.add(b.bubble);}
    if(b.bubble){b.bubble.visible=on;if(on){b.bubble.position.set(e.pos.x,e.pos.y+e.h*0.5,e.pos.z);b.bubble.scale.setScalar(e.hitR*2.2+1.5+Math.sin(T*4)*0.1);}}}}
MECH_EXT.shield=(e,b,m,i,hpF)=>{m.at.forEach((th,j)=>{const k=i+'_'+j;if(b.done[k]||hpF>th)return;b.done[k]=1;const r=b.room;b.pylons=[];
  for(let n=0;n<m.n;n++){const a=n/m.n*6.28+0.5;const p=spawnDunMob(m.etype||'pylon',Math.cos(a)*r.w*0.36,r.cz+Math.sin(a)*r.d*0.36,m.lvl,{temp:true});p.addOf=e;p.wr=0;p.state='chase';p.nextAtk=T+1.5;ringFx(p.pos.x,p.pos.z,0xffb347,3,0.6);b.pylons.push(p);}
  e.immune=()=>!!b.pylons&&b.pylons.some(p=>!p.dead&&enemies.includes(p));banner(m.name.toUpperCase(),'Destroy the '+m.n+' '+(m.what||'Ember Pylons')+' to break the shield');SFX.boom();});};
MECH_EXT.nova=(e,b,m,i)=>{if(T<b.next[i]||T<(e.stunUntil||0))return;b.next[i]=T+m.every;e.rootUntil=T+m.delay;novaTele(e,e.pos.x,e.pos.z,m.safe,m.r,m.delay,b.baseDmg*m.mult,m.name);
  toast('⚠ '+m.name+': get close to him!');tone(160,0.7,'sawtooth',0.06,200);};
function novaTele(src,x,z,inner,r,delay,dmg,name){const g=new THREE.Group();g.position.set(x,heightAt(x,z)+0.06,z);const k=inner/r;
  const edge=new THREE.Mesh(new THREE.RingGeometry(k-0.02,k,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x6dff8a,transparent:true,opacity:0.95,depthWrite:false}));edge.scale.set(r,1,r);g.add(edge);
  const out=new THREE.Mesh(new THREE.RingGeometry(0.985,1,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0.9,depthWrite:false}));out.scale.set(r,1,r);g.add(out);
  const base=new THREE.Mesh(new THREE.RingGeometry(k,1,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0.16,depthWrite:false}));base.scale.set(r,1,r);g.add(base);
  const fill=new THREE.Mesh(new THREE.RingGeometry(k,1,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xff6a2a,transparent:true,opacity:0.4,depthWrite:false}));fill.position.y=0.01;fill.scale.set(0.05,1,0.05);g.add(fill);
  DUN.group.add(g);DUN.tele.push({src,x,z,r,inner,t0:T,at:T+delay,dmg,g,fill,edge:out,name});}
function raidOnBoss(e){const d=DUN,R=d.D,id=d.id;d.raidRun.kills++;
  if(!d.raidRun.counted){d.raidRun.counted=true;const u=raidUse(id);log('⚔ Raid lockout: run <b>'+u+'/'+R.lockout.runs+'</b> used this week (resets '+raidResetTxt(id)+').');}
  const n=Math.round((R.tokens[e.boss.key]||0)*(d.mode&&d.mode.vet&&R.vet?R.vet.sig:1));if(n){P.sigils=(P.sigils|0)+n;floatText(tmpV.set(e.pos.x,e.pos.y+e.h+1,e.pos.z),'+'+n+' '+RAID_CUR,'info');log('+<b>'+n+' '+SIGIL+'</b> '+RAID_CUR+' (you have '+P.sigils+')');}
  if(e.boss.final){P.raidClears=P.raidClears||{};P.raidClears[id]=(P.raidClears[id]||0)+1;}if(R.onBoss)R.onBoss(e);save();}
function raidTrack(){const d=DUN,R=d.D;if(R.track)return R.track();const tot=d.bosses.length,k=d.bosses.filter(e=>e.dead).length;const al=d.raidAllies.filter(a=>!a.dead&&allies.includes(a)).length;
  return `<b>⚔ ${esc(R.name)}</b><br>Bosses ${k}/${tot} · Team ${al+(P.dead?0:1)}/${R.team.size} · ${d.raidRun.counted?'run counted':'run not used yet'} · ${raidLeft(d.id)}/${R.lockout.runs} left${d.cleared?' · <span style="color:#6dff8a">Cleared! Take the exit portal</span>':''}`;}
/* ---------- world portal ---------- */
const raidFx=[];
for(const k in RAIDS){const R=RAIDS[k];if(!R.door)continue;const d=R.door;const y=heightAt(d.x,d.z);const g=new THREE.Group();g.position.set(d.x,y,d.z);g.rotation.y=Math.atan2(-d.x,-d.z);
  for(const s of [-1,1]){part(g,geoBox,M(0x2a1c18),s*3.3,3.4,0,1.4,6.8,1.6);part(g,geoCone,MB(R.accent),s*3.3,7.4,0,0.5,1.4,0.5);}part(g,geoBox,M(0x3a2420),0,7.0,0,8.2,1.0,2.0);
  part(g,geoBox,M(0x241812),0,0.25,1.4,8,0.5,3.6);part(g,geoBox,MB(0x160806),0,3.2,-0.1,5.2,6.2,0.3);
  const sw=part(g,new THREE.TorusGeometry(2.2,0.16,4,28),MB(R.accent),0,3.3,0.15,1,1.3,1);const sw2=part(g,new THREE.TorusGeometry(1.5,0.1,4,22),MB(0xffc85a),0,3.3,0.18,1,1.3,1);raidFx.push(sw,sw2);
  part(g,geoBox,MB(R.accent),0,7.0,1.02,6,0.3,0.05);scene.add(g);const b=makeBeam(R.accent,34,0.7,0.25);b.position.set(d.x,y,d.z);
  for(let i=circles.length-1;i>=0;i--)if(Math.hypot(circles[i].x-d.x,circles[i].z-d.z)<9)circles.splice(i,1);
  const c=Math.cos(g.rotation.y),s=Math.sin(g.rotation.y);for(const lx of [-3.3,3.3])boxes.push({x0:d.x+lx*c-0.8,x1:d.x+lx*c+0.8,z0:d.z-lx*s-0.8,z1:d.z-lx*s+0.8,y0:y,y1:y+7});}
function raidNear(p){if(DUN)return null;for(const k in RAIDS){const d=RAIDS[k].door;if(d&&Math.hypot(p.x-d.x,p.z-d.z)<6.5)return k;}return null;}
function updRaidPortals(dt){for(let i=0;i<raidFx.length;i++)raidFx[i].rotation.z+=dt*(i%2?-2:1.2);}
function raidMini(c,tf){for(const k in RAIDS){const d=RAIDS[k].door;if(!d)continue;const q=tf(d.x,d.z);c.fillStyle='#ff6a2a';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(q[0],q[1]-8);c.lineTo(q[0]+8,q[1]);c.lineTo(q[0],q[1]+8);c.lineTo(q[0]-8,q[1]);c.closePath();c.fill();c.stroke();}}
/* ---------- panel ---------- */
const RP={tab:'team'};
function raidStatusLine(id){const R=RAIDS[id];return `<b class="${raidLeft(id)?'up':'down'}">${raidLeft(id)}/${R.lockout.runs} runs left this week</b> · resets ${esc(raidResetTxt(id))}`;}
function openRaid(id,tab){id=id||'bastion';if(RAIDS[id]&&RAIDS[id].panel)return RAIDS[id].panel(id,tab);if(tab)RP.tab=tab;const R=RAIDS[id];RP.id=id;const team=raidTeam(id);const ck=raidEntryCheck(id,team);const t=RP.tab;
  const picks=raidPicks(id),al=raidAlts(id);const nAlt=team.filter(s=>!s.merc).length,nMerc=team.length-nAlt;
  let h=`<div class="craftbar raidbar"><span class="cbi">⚔</span><span class="cbn"><b>${esc(R.name)}</b><small>Lv ${R.minLvl}–${R.cap}${R.vet?' (Veteran '+R.vet.minTop+'–'+R.vet.cap+')':''} · team of ${R.team.size} · ${raidLeft(id)}/${R.lockout.runs} runs left · resets in ${fmtLeft(raidResetIn(id))} · ${RAID_CUR} ${P.sigils|0}</small></span>
    <button class="sbtn${ck.ok?'':' locked'}" id="raidGo" data-act="${ck.ok?'rgo':'rno'}" data-id="${id}">${ck.ok?'Enter raid':ck.why==='lockout'?'🔒 Locked out':ck.why==='story'?'🔒 Story':ck.why==='cap'?'⛔ Over cap':'Lv '+R.minLvl+'+'}</button></div>`;
  h+=`<div class="tabs">${[['team','👥 Team'],['bosses','💀 Bosses'],['shop',RAID_CUR+' Sigils']].map(([k,n])=>`<button data-act="rtab" data-t="${k}" class="${t===k?'on':''}">${n}</button>`).join('')}</div>`;
  if(!ck.ok)h+=`<div class="capmsg${ck.why==='story'?' story':''}">${ck.why==='lockout'?'🔒':'⛔'} ${esc(ck.msg)}${ck.why==='story'?'. Talk to '+esc(giverWhere(ck.step))+'.':''}</div>`;
  if(t==='team'){h+=(ck.ok?hmPickHtml('r:'+id):'')+`<div class="mis" style="border-color:#ff6a2a"><p>${esc(R.desc)}</p><div>${raidStatusLine(id)}</div><div style="opacity:.8;font-size:13px;margin-top:4px">A run is used the first time a boss dies in it; wiping before any kill costs nothing. Lockouts are per character. Death revives the whole team at the entrance (bosses reset).</div></div>
    <div class="h4">Your team: you + ${nAlt} alt${nAlt===1?'':'s'}${nMerc?' + '+nMerc+' contract mercenar'+(nMerc>1?'ies':'y'):''} = ${team.length+1}/${R.team.size}</div>
    ${R.vet?`<div class="mis" style="border-color:#ffe066"><b style="color:#ffe066">Veteran mode</b> · ${raidVetLv(id,team)?'<b>ON</b>: your team\'s top level is '+partyTopLevel(team)+', so every enemy is raised to Lv '+partyTopLevel(team)+', raid gear drops as Veteran copies at that level and Sigils are worth x'+R.vet.sig+'.':'off: teams whose top level is '+R.vet.minTop+'–'+R.vet.cap+' get a scaled run (enemies at your level, Veteran gear, x'+R.vet.sig+' Sigils). At Lv '+R.minLvl+'–'+R.cap+' the raid plays as before.'}</div>`:''}
    <div class="mis"><b>${esc(P.name)}</b> (you) · Lv ${P.level} ${esc(PROFS[P.prof].name)} · ${ROLE[P.prof]}</div>`+
    al.map(a=>{const on=picks.includes(a.id);return `<button class="item${on?' sel':''}" data-act="${a.over?'rover':'rtog'}" data-id="${a.id}" style="${a.over?'opacity:.55':''}"><span class="ico">${on?'✔':a.over?'⛔':'＋'}</span><span><div class="nm">${esc(a.name)}</div><div class="sub">Lv ${a.level} ${esc(PROFS[a.prof].name)} · ${a.role}${a.over?' · over the cap ('+R.cap+')':''}</div></span></button>`;}).join('')+
    (nMerc?`<div style="opacity:.8;font-size:13px;margin-top:6px">Empty seats are filled by contract mercenaries at your level: ${team.filter(s=>s.merc).map(s=>esc(s.name)+' ('+s.role+')').join(', ')}.</div>`:'')+
    (al.length?'':`<div style="opacity:.7;font-size:13px">Make more characters (alts) to bring your own team; until then mercenaries fill in.</div>`);}
  else if(t==='bosses'){const bosses=R.rooms.filter(r=>r.boss).map(r=>BOSSES[r.boss]);
    h+=bosses.map((B,i)=>`<div class="mis"><b style="color:#ff9a2a">${esc(ETYPES[B.etype].name)}</b> · Lv ${B.lvl}${i===bosses.length-1?' · final boss':''} · ${RAID_CUR}${R.tokens[B.etype]||0}${B.mech.map(m=>`<div style="font-size:13px"><b>${esc(m.name)}</b>: ${esc(m.desc)}</div>`).join('')}</div>`).join('');}
  else{R._prev=R._prev||Object.keys(UNIQUES).filter(k=>UNIQUES[k].d===id).map(k=>{const it=makeUnique(k);it._k=k;return it;});
    h+=`<div class="stats">${SIGIL} ${RAID_CUR} drop from every raid boss (${Object.values(R.tokens).join(' / ')}) and buy raid-only gear here. You have <b>${P.sigils|0} ${RAID_CUR}</b>. Raid gear never drops anywhere else.</div>`+
      R._prev.map(it=>{const c=UNIQUES[it._k].sig;return itemRow(it,c?`<span class="${(P.sigils|0)>=c?'up':'down'}" style="white-space:nowrap">${c} ${RAID_CUR}</span>`:'<span style="opacity:.7">drop only</span>',false,c?'rbuy':'noop').replace('data-id="'+it.id+'"','data-id="'+it._k+'"');}).join('');}
  openPanel('⚔ RAID · '+R.name.toUpperCase(),h,'raid');}
function raidBuy(k){const u=UNIQUES[k];if(!u||!u.sig||u.d!=='bastion')return false;if((P.sigils|0)<u.sig){warn('Needs '+u.sig+' '+RAID_CUR+' (you have '+(P.sigils|0)+')');return false;}
  if(P.inv.length>=24){warn('Pack full');return false;}P.sigils-=u.sig;const it=makeUnique(k);it.dropBy='Sigil Quartermaster';P.inv.push(it);SFX.ui();toast('Bought '+it.name);save();return true;}
function raidAct(a,b){const D=b.dataset;if(a==='rtab')openRaid(RP.id,D.t);else if(a==='rgo'){closePanel();enterRaid(D.id);}else if(a==='rno'){const ck=raidEntryCheck(D.id,raidTeam(D.id));warn(ck.msg);}
  else if(a==='rtog'){let ids=raidPicks(RP.id);if(ids.includes(D.id))ids=ids.filter(x=>x!==D.id);else if(ids.length>=RAIDS[RP.id].team.size-1){warn('A raid team holds '+RAIDS[RP.id].team.size+' (you + '+(RAIDS[RP.id].team.size-1)+')');return true;}else ids.push(D.id);P.raidTeam=ids;save();openRaid(RP.id);}
  else if(a==='rover')warn('Over the level cap: '+raidHiCap(RAIDS[RP.id]));else if(a==='rbuy'){raidBuy(D.id);openRaid(RP.id);}else if(a.startsWith('sun'))return sunAct(a,b);else return false;return true;}
function raidJournalHtml(){return `<div class="stats">Raids are team instances (you + up to 5 alts; empty seats get contract mercenaries). Each raid can be run a limited number of times per week: the lockout resets every <b>Monday 00:00</b> (your local time) and is per character. You have <b>${P.sigils|0} ${RAID_CUR}</b> ${SIGIL}.</div>`+
  Object.values(RAIDS).map(R=>{if(R.future)return `<div class="jrow"><span class="jn">🔒</span><span style="flex:1"><b>${esc(R.name)}</b> <span style="opacity:.7">· Lv ${R.minLvl}+ · ${R.minLvl<=MAXLVL?'sealed: opens in a later update'+(R.hook&&R.hook.where?' ('+esc(R.hook.where)+')':''):'coming when the level cap rises (now '+MAXLVL+')'}</span></span></div>`;
    const ck=raidEntryCheck(R.id,[]);return `<div class="jrow${ck.ok?' done':''}"><span class="jn">⚔</span><span style="flex:1"><b>${esc(R.name)}</b> <span style="opacity:.7">· Lv ${R.minLvl}–${R.cap} · ${esc(BIOMES[biomeIdx(R.door.x,R.door.z)].name)}</span><br><span class="jun">${raidStatusLine(R.id)} · cleared ${(P.raidClears||{})[R.id]|0}×${ck.ok||ck.why==='lockout'?'':' · '+esc(ck.msg)}</span></span></div>`;}).join('');}
function raidExports(){return {RAIDS,RAIDCLK,raidNow,periodKey,nextReset,raidLeft,raidRec,raidUse,raidResetIn,raidResetTxt,raidEntryCheck,enterRaid,raidTeam,raidPicks,raidAlts,mercSnap,openRaid,raidBuy,raidJournalHtml,raidNear,normRaidLock,MECH_EXT,BOSSES,raidOnBoss,
  get sigils(){return P.sigils|0;}};}
