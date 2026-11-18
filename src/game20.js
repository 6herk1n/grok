/* ================= SAVE PROTECTION: export / import, rolling backup, persistent storage =================
   Export = one JSON file with every DUSTREACH key (characters, bank, towers, dynas, story-seen, clock, legacy save).
   Import validates, asks before overwriting, and first copies the current data to 'dustreach_preimport_v1' (undo).
   A rolling last-good copy of the roster lives in 'dustreach_roster_bak_v1' and is used if the main key is missing or corrupt. */
const EXP_KEYS=['dustreach_roster_v1','dustreach_bank_v1','dustreach_towers_v1','dustreach_dyna_v1','dustreach_story_seen','dustreach_clock','dustreach_save_v1'];
const BAK_KEY='dustreach_roster_bak_v1',PREIMP_KEY='dustreach_preimport_v1';
const SVX={lastBak:0,persist:null};
function rosterBackup(j,force){const now=Date.now();if(!force&&now-SVX.lastBak<120000&&localStorage.getItem(BAK_KEY))return;SVX.lastBak=now;
  try{localStorage.setItem(BAK_KEY,JSON.stringify({t:now,build:window.DR_BUILD||'',data:j}));}catch(e){storageWarn(BAK_KEY,e);}}
function rosterFromBackup(){try{const b=JSON.parse(localStorage.getItem(BAK_KEY)||'null');if(!b||!b.data)return null;const r=JSON.parse(b.data);if(!r||!Array.isArray(r.chars)||!r.chars.length)return null;
    setTimeout(()=>{try{toast('♻ Your save was missing or damaged, so it was restored from the automatic backup');}catch(e){}},1500);lsSet('dustreach_roster_v1',b.data);return r;}catch(e){return null;}}
// ask the browser to keep our storage (helps against iPad Safari evicting site data)
(function(){try{if(navigator.storage&&navigator.storage.persist){navigator.storage.persisted().then(p=>{if(p){SVX.persist=true;return;}return navigator.storage.persist().then(ok=>{SVX.persist=!!ok;});}).catch(()=>{SVX.persist=false;});}else SVX.persist=null;}catch(e){}})();
function exportData(){const data={};for(const k of EXP_KEYS){const v=localStorage.getItem(k);if(v!=null)data[k]=v;}
  if(state==='play'){try{save();data['dustreach_roster_v1']=localStorage.getItem('dustreach_roster_v1');}catch(e){}}
  let chars=[];try{chars=JSON.parse(data['dustreach_roster_v1']||'{}').chars||[];}catch(e){}
  return {format:'dustreach-export',v:1,build:window.DR_BUILD||'',exported:new Date().toISOString(),summary:chars.map(c=>c.name+' (Lv '+c.level+')'),data};}
function exportText(){return JSON.stringify(exportData());}
function exportName(){const d=new Date();const p=n=>String(n).padStart(2,'0');return `dustreach-save-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;}
// ---- Build P: save-safety reminder. Safari can clear a site's storage after ~7 days without a visit (normal tab), so after 7 days
// without an export we show a gentle card on the title screen (Export now / Later = snooze 3 days) and one log line in game.
const LASTEXP_KEY='dustreach_lastexport_v1',FIRSTSEEN_KEY='dustreach_firstseen_v1',NAGSNOOZE_KEY='dustreach_exportnag_v1';let saveNagShown=false;
function markExported(){try{localStorage.setItem(LASTEXP_KEY,String(Date.now()));localStorage.removeItem(NAGSNOOZE_KEY);}catch(e){}}
function isStandaloneApp(){try{return navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;}catch(e){return false;}}
function isIOSDevice(){const ua=navigator.userAgent||'';return /iPad|iPhone|iPod/.test(ua)||(/Macintosh/.test(ua)&&(navigator.maxTouchPoints||0)>1);}
function exportAge(){let last=+(localStorage.getItem(LASTEXP_KEY)||0),first=+(localStorage.getItem(FIRSTSEEN_KEY)||0);
  if(!first){first=Date.now();try{localStorage.setItem(FIRSTSEEN_KEY,String(first));}catch(e){}}return {days:(Date.now()-(last||first))/864e5,never:!last,last};}
function saveNagDue(){try{const a=exportAge();if(a.days<7)return null;if(Date.now()<+(localStorage.getItem(NAGSNOOZE_KEY)||0))return null;return a;}catch(e){return null;}}
function a2hsHint(){return isStandaloneApp()?'':isIOSDevice()?' Safari can clear website data after about 7 days without a visit. Adding DUSTREACH to your Home Screen (Share ⬆ → <b>Add to Home Screen</b>) keeps it safer.':' Browsers can clear website data. Installing the game (Add to Home Screen / Install app) keeps it safer.';}
function saveNagEl(){const a=saveNagDue();if(!a)return null;const d=Math.floor(a.days);const el=document.createElement('div');el.id='saveNag';
  el.innerHTML=`<div class="sn-t">💾 ${a.never?'You haven\'t exported a save yet.':'Your last save export was '+d+' days ago.'} An exported file is your safety copy.${a2hsHint()}</div><div class="sn-b"><button class="sbtn" data-sn="exp">💾 Export now</button><button class="sbtn alt" data-sn="later">Later</button></div>`;
  el.addEventListener('click',e=>{const b=e.target.closest('[data-sn]');if(!b)return;try{audioInit();SFX.ui();}catch(_){}if(b.dataset.sn==='exp')openSaveTools('export');else{try{localStorage.setItem(NAGSNOOZE_KEY,String(Date.now()+3*864e5));}catch(_){}}el.remove();});return el;}
function saveNagInGame(){if(saveNagShown)return;const a=saveNagDue();if(!a)return;saveNagShown=true;
  setTimeout(()=>{try{if(state==='play')log('💾 '+(a.never?'You haven\'t exported a save yet':'Last save export: '+Math.floor(a.days)+' days ago')+'. ☰ Menu → <b>Export save</b> keeps a safety copy.');}catch(e){}},9000);}
function exportDownload(){const t=exportText();const blob=new Blob([t],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=exportName();document.body.appendChild(a);a.click();markExported();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);svMsg('⬇ Save file downloaded: '+a.download+'. On iPad it appears in Files → Downloads.');return t.length;}
function exportShare(){const t=exportText();try{const f=new File([t],exportName(),{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'DUSTREACH save'}).then(()=>{markExported();svMsg('📤 Shared');}).catch(()=>{});return true;}}catch(e){}return exportDownload();}
function exportCopy(){const t=exportText();markExported();const ta=$('#svText');if(ta){ta.value=t;ta.classList.remove('hidden');}
  const done=ok=>svMsg(ok?'📋 Save copied to the clipboard. Paste it into Notes or Files to keep it.':'Copy blocked: select the text below and copy it by hand.');
  if(navigator.clipboard&&navigator.clipboard.writeText){return navigator.clipboard.writeText(t).then(()=>done(true),()=>{try{ta.select();done(document.execCommand('copy'));}catch(e){done(false);}});}
  try{ta.select();done(document.execCommand('copy'));}catch(e){done(false);}}
// ---- import ----
function parseImport(text){let o;try{o=JSON.parse(String(text||'').trim());}catch(e){return {ok:false,msg:'That is not a DUSTREACH save (not valid JSON).'};}
  let data=null;if(o&&o.format==='dustreach-export'&&o.data&&typeof o.data==='object')data=o.data;else if(o&&o.format==='dustreach-roster'&&Array.isArray(o.chars))data={'dustreach_roster_v1':JSON.stringify(o)};
  if(!data)return {ok:false,msg:'That is not a DUSTREACH save file.'};
  const out={};for(const k of EXP_KEYS)if(typeof data[k]==='string')out[k]=data[k];
  let r;try{r=JSON.parse(out['dustreach_roster_v1']||'null');}catch(e){r=null;}
  if(!r||!Array.isArray(r.chars))return {ok:false,msg:'The save has no character list.'};
  const good=r.chars.filter(c=>c&&typeof c==='object'&&PROFS[c.prof]);if(good.length!==r.chars.length)return {ok:false,msg:'The save contains damaged characters.'};
  for(const k of ['dustreach_bank_v1','dustreach_towers_v1','dustreach_dyna_v1','dustreach_story_seen'])if(out[k]!=null){try{JSON.parse(out[k]);}catch(e){return {ok:false,msg:'The save is damaged ('+k+').'};}}
  return {ok:true,data:out,chars:good.map(c=>({name:c.name||'Contractor',level:c.level||1,prof:c.prof})),when:o.exported||'',build:o.build||''};}
function applyImport(p,skipConfirm){if(!p||!p.ok)return false;
  const cur=(roster&&roster.chars)||[];const msg='Replace your current '+cur.length+' character'+(cur.length===1?'':'s')+' with '+p.chars.length+' from this save ('+p.chars.map(c=>c.name+' Lv '+c.level).join(', ')+')?\n\nYour current data is backed up first, and "Undo last import" brings it back.';
  if(!skipConfirm&&!confirm(msg))return false;
  if(state==='play'){try{save();}catch(e){}}
  const bak={};for(const k of EXP_KEYS){const v=localStorage.getItem(k);if(v!=null)bak[k]=v;}
  if(!lsSet(PREIMP_KEY,JSON.stringify({t:Date.now(),data:bak}))){svMsg('Could not back up the current save, so nothing was changed.');return false;}
  for(const k of EXP_KEYS){if(p.data[k]!=null){if(!lsSet(k,p.data[k]))return false;}else localStorage.removeItem(k);}
  try{const r=JSON.parse(p.data['dustreach_roster_v1']);if(r.chars.length)rosterBackup(p.data['dustreach_roster_v1'],true);}catch(e){}
  svReload('📥 Save imported');return true;}
function undoImport(){let b;try{b=JSON.parse(localStorage.getItem(PREIMP_KEY)||'null');}catch(e){b=null;}if(!b||!b.data)return false;
  if(!confirm('Put back the save you had before the last import?'))return false;
  for(const k of EXP_KEYS){if(b.data[k]!=null)lsSet(k,b.data[k]);else localStorage.removeItem(k);}localStorage.removeItem(PREIMP_KEY);svReload('↩ Previous save restored');return true;}
function svReload(msg){try{sessionStorage.setItem('dr_svmsg',msg);}catch(e){}window.__drNoSave=true;location.reload();}
setTimeout(()=>{try{const m=sessionStorage.getItem('dr_svmsg');if(m){sessionStorage.removeItem('dr_svmsg');toast(m);}}catch(e){}},1200);
// ---- UI (overlay works on the title screen and in-game) ----
function svMsg(t){const el=$('#svMsg');if(el)el.textContent=t;}
function openSaveTools(tab){const box=$('#saveBox');box.classList.remove('hidden');const b=box.querySelector('.svbody');let chars=0;try{chars=JSON.parse(localStorage.getItem('dustreach_roster_v1')||'{}').chars.length;}catch(e){}
  const bak=(()=>{try{return JSON.parse(localStorage.getItem(BAK_KEY)||'null');}catch(e){return null;}})();const pre=!!localStorage.getItem(PREIMP_KEY);
  const pers=SVX.persist===true?'✔ protected (persistent storage granted)':SVX.persist===false?'not guaranteed: the browser may clear it if space runs low, so export now and then':'unknown on this browser';
  b.innerHTML=`<div class="tabs" style="justify-content:center"><button data-sv="tab" data-t="export" class="${tab!=='import'?'on':''}">💾 Export</button><button data-sv="tab" data-t="import" class="${tab==='import'?'on':''}">📥 Import</button></div>`+
  (tab!=='import'?`<p>Saves all ${chars} character${chars===1?'':'s'}, your shared bank, towers, dynas and story progress in one file.</p>
    <div class="svbtns"><button class="btn" data-sv="dl">⬇ Download file</button>${navigator.canShare?'<button class="btn alt" data-sv="share">📤 Save to Files…</button>':''}<button class="btn alt" data-sv="copy">📋 Copy text</button></div>`
  :`<p>Load a save you exported before. You will be asked before anything is replaced, and your current save is backed up first.</p>
    <div class="svbtns"><label class="btn" for="svFile">📂 Choose file…</label><input type="file" id="svFile" accept=".json,application/json,text/plain" class="hidden"></div>
    <p style="margin:8px 0 4px">…or paste the save text:</p>
    <div class="svbtns"><button class="btn alt" data-sv="paste">📥 Import pasted text</button>${pre?'<button class="btn alt" data-sv="undo">↩ Undo last import</button>':''}</div>`)+
  `<textarea id="svText" class="${tab==='import'?'':'hidden'}" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" placeholder="Paste save text here" ${tab==='import'?'':'readonly'}></textarea>
   <div id="svMsg" class="svmsg"></div>
   <div class="svinfo">Storage: ${pers}. Last export: ${(()=>{const a=exportAge();return a.last?new Date(a.last).toLocaleDateString():'never';})()}.${tab!=='import'?a2hsHint():''}${bak?' Automatic backup: '+new Date(bak.t).toLocaleString()+'.':''}${SAVEST.fails?' <b style="color:#ff9a8a">'+SAVEST.fails+' failed save attempt(s) this session.</b>':''}</div>
   <div class="svbtns"><button class="btn alt" data-sv="close">Close</button></div>`;
  const f=$('#svFile');if(f)f.onchange=()=>{const file=f.files&&f.files[0];if(!file)return;const rd=new FileReader();rd.onload=()=>{const p=parseImport(rd.result);if(!p.ok){svMsg('✖ '+p.msg);SFX.err();return;}applyImport(p);};rd.readAsText(file);f.value='';};}
function closeSaveTools(){$('#saveBox').classList.add('hidden');}
$('#saveBox').addEventListener('click',e=>{const b=e.target.closest('[data-sv]');if(!b)return;const a=b.dataset.sv;try{audioInit();SFX.ui();}catch(x){}
  if(a==='tab')openSaveTools(b.dataset.t);else if(a==='close')closeSaveTools();else if(a==='dl')exportDownload();else if(a==='share')exportShare();else if(a==='copy')exportCopy();
  else if(a==='paste'){const p=parseImport($('#svText').value);if(!p.ok){svMsg('✖ '+p.msg);SFX.err();return;}applyImport(p);}else if(a==='undo')undoImport();});
['keydown','keyup'].forEach(t=>$('#saveBox').addEventListener(t,e=>e.stopPropagation()));
function saveExports(){return {openMenu,exportData,exportText,parseImport,applyImport,undoImport,openSaveTools,closeSaveTools,rosterBackup,rosterFromBackup,lsSet,SAVEST,SVX,EXP_KEYS,BAK_KEY,PREIMP_KEY,storageWarn};}
