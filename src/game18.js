/* ================= CHARACTER NAMES: pick, validate, randomize, rename =================
   2–16 characters: letters, numbers, spaces, hyphen, apostrophe; trimmed; unique (any case) among your characters.
   Rename works from character select (✏️ on each slot) and in-game from the 📈 Skills panel. Names live in the roster save. */
const NAME_MIN=2,NAME_MAX=16;
const NAME_OK=/^[\p{L}\p{N}][\p{L}\p{N} '\-]*$/u;
const NM_A=['Ka','Ve','Ro','Ta','Mi','Sa','Or','Ny','Da','Il','Co','Ze','Bra','Kes','Tor','Lu','Fen','Ash','Rha','Qui','Je','Sol','Var','Ema'];
const NM_B=['rin','sha','dek','lo','vin','ra','ten','mar','dra','kai','nos','ly','ric','wen','th','ska','ra','lis','ven','dor'];
const NM_C=['Dune','Ash','Vale','Holt','Rusk','Marr','Keel','Sorn','Pike','Dray','Venn','Caro','Lisk','Brand','Tarr','Wick'];
function cleanName(s){return String(s==null?'':s).replace(/\s+/g,' ').trim();}
function nameTaken(n,exceptId){const k=n.toLowerCase();return roster.chars.some(c=>c.id!==exceptId&&cleanName(c.name).toLowerCase()===k);}
function nameCheck(raw,exceptId){const n=cleanName(raw);
  if(n.length<NAME_MIN)return {ok:false,name:n,msg:'Name needs at least '+NAME_MIN+' characters'};
  if(n.length>NAME_MAX)return {ok:false,name:n,msg:'Name can be at most '+NAME_MAX+' characters'};
  if(!NAME_OK.test(n))return {ok:false,name:n,msg:"Use letters, numbers, spaces, - or ' (start with a letter or number)"};
  if(nameTaken(n,exceptId))return {ok:false,name:n,msg:'You already have a character called '+n};
  return {ok:true,name:n,msg:''};}
function randomName(exceptId){for(let i=0;i<60;i++){const first=pick(NM_A)+pick(NM_B);let n=first.charAt(0).toUpperCase()+first.slice(1);
    if(Math.random()<0.45){const s=n+' '+pick(NM_C);if(s.length<=NAME_MAX)n=s;}else if(Math.random()<0.25)n=pick(NAMES);if(nameCheck(n,exceptId).ok)return n;}
  return 'Contractor '+(roster.chars.length+1);}
// create screen: live validation + dice
function createNameUi(){const ni=$('#nameIn');const err=$('#nameErr');if(!ni||!err)return;
  if(!ni.value||!nameCheck(ni.value).ok&&!ni.dataset.touched)ni.value=randomName();showNameErr(ni,err,null);}
function showNameErr(ni,err,exceptId){const c=nameCheck(ni.value,exceptId);err.textContent=c.ok?'':c.msg;ni.classList.toggle('bad',!c.ok);return c;}
$('#nameIn').addEventListener('input',()=>{$('#nameIn').dataset.touched='1';showNameErr($('#nameIn'),$('#nameErr'),null);});
$('#nameIn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();$('#nameIn').blur();}});
$('#bNameRnd').onclick=()=>{SFX.ui();const ni=$('#nameIn');ni.value=randomName();ni.dataset.touched='1';showNameErr(ni,$('#nameErr'),null);};
// rename dialog (works on the title screen and in-game)
const RN={id:null};
function openRename(id){const c=roster.chars.find(x=>x.id===id)||(id===activeId?{id,name:P.name}:null);if(!c)return false;RN.id=id;
  const box=$('#renameBox');$('#renOld').textContent=c.name;const ri=$('#renIn');ri.value=c.name;box.classList.remove('hidden');showNameErr(ri,$('#renErr'),id);
  setTimeout(()=>{try{ri.focus();ri.select();}catch(e){}},50);return true;}
function closeRename(){$('#renameBox').classList.add('hidden');RN.id=null;try{$('#renIn').blur();}catch(e){}}
function renameChar(id,raw){const ck=nameCheck(raw,id);if(!ck.ok)return ck;const n=ck.name;
  if(state==='play'&&id===activeId){P.name=n;save();}
  const c=roster.chars.find(x=>x.id===id);if(c){const old=c.name;c.name=n;c.updated=c.updated||Date.now();writeRoster(roster);ck.old=old;}
  // live companions take the new name too
  for(const a of allies)if(a.comp&&a.snapId===id)a.name=n;
  return ck;}
function doRename(){const id=RN.id;if(!id)return;const r=renameChar(id,$('#renIn').value);if(!r.ok){$('#renErr').textContent=r.msg;$('#renIn').classList.add('bad');SFX.err();return;}
  SFX.quest();closeRename();toast('✏️ Renamed to '+r.name);if(state==='title')renderTitle();else if(panelOpen==='skills')openSkills();else if(panelOpen==='team')openTeam();}
$('#renIn').addEventListener('input',()=>showNameErr($('#renIn'),$('#renErr'),RN.id));
$('#renIn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();doRename();}else if(e.key==='Escape')closeRename();});
$('#renIn').addEventListener('keyup',e=>e.stopPropagation());
$('#bRenRnd').onclick=()=>{SFX.ui();const ri=$('#renIn');ri.value=randomName(RN.id);showNameErr(ri,$('#renErr'),RN.id);};
$('#bRenOk').onclick=()=>doRename();$('#bRenNo').onclick=()=>{SFX.ui();closeRename();};
function nameExports(){return {nameCheck,cleanName,randomName,renameChar,openRename,closeRename,doRename,NAME_MIN,NAME_MAX};}
