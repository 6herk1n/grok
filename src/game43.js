/* ================= CLOUD BACKUP (2026-11-23) =================
   The game's own Export save file (exportText(), game20) is uploaded to Dan's server so a cleared iPad can restore.
   Server: https://tools.nevarios.com/drsave/ (repo 6herk1n/dr-save). The link page there (behind the nevarios login)
   makes a per-device code; the game sends it as `Authorization: Bearer <code>`. Nothing is sent until a code is linked.
   - Device-only state in localStorage 'dustreach_cloud_v1' = {code,label,last,hash,err}: NOT in EXP_KEYS, so the code
     never goes into an export file and an import never unlinks the device.
   - Auto backup: every 5 min while the page is visible, and when the app is hidden (30 s minimum gap). Skipped when the
     save data hasn't changed since the last upload (cloudHash). The server also dedups and prunes
     (all backups from the last 48 h, then one per day for 90 days).
   - Restore: ☁ Cloud tab in Save tools (title screen 💾 Export save, or ☰ Menu) lists the backups; Restore runs the
     normal parseImport/applyImport, so it asks first and keeps "Undo last import".
   - Tests/dev: window.__DR_CLOUD_API overrides the server URL. */
const CLOUD_KEY='dustreach_cloud_v1',CLOUD_EVERY=5*60e3,CLOUD_HIDE_GAP=30e3;
const CLOUD_LINK='https://tools.nevarios.com/drsave/';
const CL={busy:false,tried:0,list:null,listErr:''};
function cloudApi(){return window.__DR_CLOUD_API||'https://tools.nevarios.com/drsave/api';}
function cloudGet(){try{const c=JSON.parse(localStorage.getItem(CLOUD_KEY)||'null');return c&&c.code?c:null;}catch(e){return null;}}
function cloudSet(c){try{if(c)localStorage.setItem(CLOUD_KEY,JSON.stringify(c));else localStorage.removeItem(CLOUD_KEY);}catch(e){}}
function cloudHash(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16)+':'+s.length;}
function cloudFetch(path,opt,code){opt=opt||{};const c=code||(cloudGet()||{}).code;
  return fetch(cloudApi()+path,Object.assign({},opt,{headers:Object.assign({'Authorization':'Bearer '+c},opt.headers||{}),cache:'no-store'}))
    .then(r=>{if(r.status===401&&!code){const was=cloudGet();cloudSet(null);if(was)try{toast('☁ Cloud backup was unlinked on the server. Link this device again in Save tools.');}catch(e){}}return r;});}
function cloudAgo(t){if(!t)return 'never';const s=(Date.now()-t)/1e3;return s<90?'just now':s<5400?Math.round(s/60)+' min ago':s<129600?Math.round(s/3600)+' h ago':new Date(t).toLocaleDateString();}
// upload if the save changed (or force). Resolves to a short status string; never throws.
function cloudPush(force){const c=cloudGet();if(!c||CL.busy)return Promise.resolve('off');CL.tried=Date.now();
  let ex;try{ex=exportData();}catch(e){return Promise.resolve('error');}
  // a fresh or wiped device has no characters yet: never upload that over the real backups
  if(!(ex.summary||[]).length)return Promise.resolve('empty');
  const h=cloudHash(JSON.stringify(ex.data));if(!force&&h===c.hash)return Promise.resolve('same');
  const body=JSON.stringify(ex);CL.busy=true;
  return cloudFetch('/save',{method:'PUT',headers:{'Content-Type':'application/json'},body,keepalive:body.length<60000})
    .then(r=>r.json().catch(()=>({})).then(j=>{const cur=cloudGet();if(!cur)return 'unlinked';
      if(r.ok&&j.ok){cur.last=Date.now();cur.hash=h;cur.err='';cloudSet(cur);try{markExported();}catch(e){}return j.unchanged?'same':'saved';}
      cur.err=j.msg||('HTTP '+r.status);cloudSet(cur);return 'error';}))
    .catch(()=>{const cur=cloudGet();if(cur){cur.err='offline';cloudSet(cur);}return 'offline';})
    .finally(()=>{CL.busy=false;});}
function cloudTick(){const c=cloudGet();if(!c||document.visibilityState!=='visible')return;if(Date.now()-CL.tried>=CLOUD_EVERY)cloudPush(false);}
setInterval(()=>{try{cloudTick();}catch(e){}},60e3);
document.addEventListener('visibilitychange',()=>{try{if(document.visibilityState==='hidden'&&cloudGet()&&Date.now()-CL.tried>=CLOUD_HIDE_GAP){if(state==='play')save();cloudPush(false);}}catch(e){}});
setTimeout(()=>{try{if(cloudGet())cloudPush(false);}catch(e){}},20e3);
function cloudLink(code){code=String(code||'').trim();if(!/^DR-[A-Za-z0-9_-]{20,}$/.test(code))return Promise.resolve({ok:false,msg:'That doesn\'t look like a cloud code. It starts with DR- (copy it from the link page).'});
  return cloudFetch('/status',{},code).then(r=>r.json().catch(()=>({})).then(j=>{
    if(!r.ok||!j.ok)return {ok:false,msg:r.status===401?'The server doesn\'t know that code. Make a new one on the link page.':(j.msg||'Server error '+r.status)};
    cloudSet({code,label:j.device||'',last:0,hash:'',err:''});CL.list=null;return {ok:true,count:j.count};}))
    .catch(()=>({ok:false,msg:'Could not reach the server. Check the connection and try again.'}));}
function cloudLoadList(){CL.listErr='';return cloudFetch('/saves').then(r=>r.json().catch(()=>({})).then(j=>{if(r.ok&&j.ok)CL.list=j.saves;else{CL.list=null;CL.listErr=j.msg||'Server error '+r.status;}}))
  .catch(()=>{CL.list=null;CL.listErr='Could not reach the server (offline?)';});}
function cloudRestore(id){svMsg('☁ Downloading backup…');
  return cloudFetch('/saves/'+encodeURIComponent(id)).then(r=>r.text().then(t=>{if(!r.ok){svMsg('✖ Could not download that backup ('+r.status+')');return;}
    const p=parseImport(t);if(!p.ok){svMsg('✖ '+p.msg);try{SFX.err();}catch(e){}return;}applyImport(p);}))
  .catch(()=>svMsg('✖ Could not reach the server (offline?)'));}
function cloudHtml(){const c=cloudGet();
  if(!c)return `<p>Back your save up to the cloud automatically, so you can get everything back if this device is cleared or lost.</p>
    <p style="text-align:left;font-size:13px">1. Open the <a href="${CLOUD_LINK}" target="_blank" rel="noopener" style="color:#9ff">cloud save page</a> (log in) and tap <b>Make a code</b>, then <b>Copy</b>.<br>2. Paste the code here and tap <b>Link</b>.</p>
    <input id="clCode" type="text" placeholder="DR-…" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" style="width:100%;font-size:16px;padding:10px;border-radius:8px;border:1px solid #555;background:#111;color:#eee;box-sizing:border-box">
    <div class="svbtns"><button class="btn" data-cl="link">☁ Link</button></div>`;
  const rows=CL.list?(CL.list.length?CL.list.map(s=>`<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.12);padding:6px 0;text-align:left">
      <span style="font-size:13px"><b>${esc(new Date(s.t).toLocaleString())}</b><br><small style="opacity:.75">${esc((s.summary||[]).join(', '))}${s.device?' · '+esc(s.device):''}</small></span>
      <button class="sbtn alt" data-cl="restore" data-id="${esc(s.id)}">Restore</button></div>`).join(''):'<p>No backups yet.</p>')
    :`<p style="font-size:13px;opacity:.8">${CL.listErr?esc(CL.listErr):'Loading backups…'}</p>`;
  return `<p>☁ Linked${c.label?' as <b>'+esc(c.label)+'</b>':''}. Backs up on its own every few minutes while you play, and when you leave the app.</p>
    <p style="font-size:13px">Last backup: <b>${cloudAgo(c.last)}</b>${c.err?' · <span style="color:#ff9a8a">last try failed: '+esc(c.err)+'</span>':''}</p>
    <div class="svbtns"><button class="btn" data-cl="now">☁ Back up now</button><button class="btn alt" data-cl="unlink">Unlink this device</button></div>
    <p style="margin:10px 0 4px;text-align:left"><b>Restore a backup</b> <small style="opacity:.7">(asks first; your current save is kept for Undo)</small></p>
    <div id="clList" style="max-height:40vh;overflow-y:auto">${rows}</div>`;}
const _openSaveToolsCl=openSaveTools;
openSaveTools=function(tab){const keepMsg=(($('#svMsg')||{}).textContent||'');_openSaveToolsCl(tab==='cloud'?'export':tab);if(keepMsg&&!$('#saveBox').classList.contains('hidden'))svMsg(keepMsg);const box=$('#saveBox');const tabs=box.querySelector('.svbody .tabs');if(!tabs)return;
  const tb=document.createElement('button');tb.dataset.sv='tab';tb.dataset.t='cloud';tb.textContent='☁ Cloud'+(cloudGet()?' ✓':'');tabs.appendChild(tb);
  if(tab!=='cloud')return;tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t==='cloud'));
  const body=box.querySelector('.svbody');[...body.children].forEach(el=>{if(el!==tabs&&el.id!=='svMsg'&&!el.querySelector('[data-sv="close"]'))el.remove();});
  tabs.insertAdjacentHTML('afterend','<div id="clBody">'+cloudHtml()+'</div>');
  if(cloudGet()&&!CL.list){cloudLoadList().then(()=>{const b=$('#clBody');if(b&&!$('#saveBox').classList.contains('hidden'))b.innerHTML=cloudHtml();});}};
function cloudRefresh(){const b=$('#clBody');if(b)b.innerHTML=cloudHtml();}
$('#saveBox').addEventListener('click',e=>{const b=e.target.closest('[data-cl]');if(!b)return;const a=b.dataset.cl;try{audioInit();SFX.ui();}catch(x){}
  if(a==='link'){const v=($('#clCode')||{}).value;b.disabled=true;svMsg('☁ Checking the code…');
    cloudLink(v).then(r=>{b.disabled=false;if(!r.ok){svMsg('✖ '+r.msg);try{SFX.err();}catch(e){}return;}
      svMsg('☁ Linked. Backing up now…');openSaveTools('cloud');cloudPush(true).then(s=>{svMsg(s==='saved'||s==='same'?'☁ Linked and backed up.':s==='empty'?'☁ Linked. No characters on this device yet: pick a backup below to restore.':'☁ Linked, but the first backup failed. It will retry.');CL.list=null;openSaveTools('cloud');});});}
  else if(a==='now'){b.disabled=true;svMsg('☁ Backing up…');if(state==='play'){try{save();}catch(x){}}
    cloudPush(true).then(s=>{svMsg(s==='saved'?'☁ Backed up.':s==='same'?'☁ Already backed up: nothing has changed.':s==='empty'?'Nothing to back up yet: no characters on this device.':s==='offline'?'✖ Could not reach the server (offline?)':s==='unlinked'?'✖ This device was unlinked.':'✖ Backup failed: '+((cloudGet()||{}).err||''));CL.list=null;openSaveTools('cloud');});}
  else if(a==='unlink'){if(!confirm('Unlink this device from cloud backup? Backups already in the cloud stay there.'))return;cloudSet(null);CL.list=null;openSaveTools('cloud');svMsg('Unlinked.');}
  else if(a==='restore')cloudRestore(b.dataset.id);});
function cloudExports(){return {CLOUD_KEY,CL,cloudGet,cloudSet,cloudPush,cloudLink,cloudLoadList,cloudRestore,cloudHash};}
