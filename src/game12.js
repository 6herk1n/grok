/* ---------- Bank: account-wide storage (same localStorage record as the apartment locker), terminals in Halden's Rest and the outposts ---------- */
const BANK_SPOTS=[{id:'town',name:"Halden's Rest Bank",cx:0,cz:-11,cand:[[0,-11.5],[3.2,-12.5],[-3.2,-12.5],[13,-3],[-13,-3]]},
  {id:'cinderwell',name:'Cinderwell Bank',gate:'cinderwell',out:'cinderwell'},{id:'glassreach',name:'Glassreach Bank',gate:'glassreach',out:'glassreach'},
  {id:'farwatch',name:'Farwatch Bank',gate:'farwatch',out:'farwatch',cand:[[-415,234],[-414,229],[-401,244]]},
  {id:'hoarlight',name:'Hoarlight Bank',gate:'hoarlight',out:'hoarlight',cand:[[615,-359],[597,-341],[617,-343]]},
  {id:'lanternmoor',name:'Lanternmoor Bank',out:'lanternmoor',minLv:31,cand:[[-677,677],[-659,659],[-659,677]]},{id:'sunderwatch',name:'Sunderwatch Bank',out:'sunderwatch',minLv:41,cand:[[659,677],[677,659],[659,659]]}].concat(XM.regions.map(R=>({id:R.hub,name:R.hn+' Bank',out:R.hub,minLv:R.lv[0],cand:[[R.hx+4,R.hz+9],[R.hx-5,R.hz+5],[R.hx+5,R.hz-4]]})));// Build M: the five outer hubs
const BANKS=[];
(function placeBanks(){const free=(x,z)=>!boxes.some(b=>x>b.x0-2.2&&x<b.x1+2.2&&z>b.z0-2.2&&z<b.z1+2.2)&&!circles.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+2)&&!NPCS.some(n=>Math.hypot(n.x-x,n.z-z)<3.5)&&
    Math.hypot(x-TERMINAL.x,z-TERMINAL.z)>4&&Math.hypot(x-VENDOR.x,z-VENDOR.z)>4;
  for(const s of BANK_SPOTS){let p=null;if(s.cand)p=s.cand.find(([x,z])=>free(x,z));
    else{const o=OUTPOSTS.find(q=>q.id===s.out);for(let r=6;r<=9&&!p;r+=1.5)for(let k=0;k<16&&!p;k++){const a=k/16*6.283+0.4;const x=o.x+Math.cos(a)*r,z=o.z+Math.sin(a)*r;if(free(x,z))p=[x,z];}if(!p)p=[o.x+6,o.z];}
    if(!p)p=s.cand[0];const x=p[0],z=p[1],y=heightAt(x,z);const g=new THREE.Group();g.position.set(x,y,z);const oc=s.out?OUTPOSTS.find(q=>q.id===s.out):{x:0,z:0};g.rotation.y=Math.atan2(oc.x-x,oc.z-z);
    part(g,geoBox,M(0x3a4048),0,1.1,0,1.6,2.2,0.9);part(g,geoBox,M(0xd4a020),0,2.35,0,1.9,0.3,1.1);const scr=part(g,geoBox,MB(0xffd34a),0,1.45,0.46,1.1,0.7,0.04);
    part(g,geoBox,M(0x22262c),0,0.75,0.5,1.2,0.12,0.25);const sign=part(g,geoBox,MB(0xffe08a),0,3.0,0,0.5,0.5,0.08);scene.add(g);
    boxes.push({x0:x-0.85,x1:x+0.85,z0:z-0.5,z1:z+0.5,y0:y,y1:y+2.5});BANKS.push({id:s.id,name:s.name,gate:s.gate||null,minLv:s.minLv||0,x,z,g,scr,sign});}})();
const bankOpenAt=k=>(!k.gate||gateOpen(k.gate))&&(!k.minLv||(typeof P!=='undefined'&&P&&P.level>=k.minLv));// Build J: corner-region banks open at the region's level
function bankNear(p){if(FLAT)return null;for(const k of BANKS)if(bankOpenAt(k)&&Math.hypot(p.x-k.x,p.z-k.z)<3.3)return k;return null;}
function updBanks(){for(const k of BANKS){const v=bankOpenAt(k);k.g.visible=v;k.sign.rotation.y=T*1.5;}}
function bankMini(c,tf){for(const k of BANKS){if(!bankOpenAt(k))continue;if(Math.abs(k.x-P.pos.x)>95||Math.abs(k.z-P.pos.z)>95)continue;const q=tf(k.x,k.z);
  c.fillStyle='#ffd34a';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.rect(q[0]-7,q[1]-7,14,14);c.fill();c.stroke();c.fillStyle='#2a1a00';c.font='bold 11px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('B',q[0],q[1]+0.5);}}
function bankSvg(tx,tz){return BANKS.filter(bankOpenAt).map(k=>`<rect x="${tx(k.x)-5}" y="${tz(k.z)-5}" width="10" height="10" fill="#ffd34a" stroke="#000" stroke-width="1.5"><title>${esc(k.name)}</title></rect>`).join('');}
/* ---- UI state ---- */
const BK={tab:'items',f:'all',sort:'new',q:''};
const BFILT=[['all','All'],['weapon','⚔ Weapons'],['armour','🛡 Armour'],['imp','🧬 Implants'],['disk','📀 Disks'],['other','👕 Other']];
const BSORT=[['new','Newest'],['rar','Rarity'],['lvl','Level'],['name','Name']];
function bankType(it){if(it.kind==='imp')return 'imp';if(it.kind==='disk')return 'disk';if(it.kind==='gear')return it.slot==='weapon'?'weapon':'armour';return 'other';}
function bankFilter(L){return L.filter(it=>BK.f==='all'||bankType(it)===BK.f);}
function bankSorted(L){const a=L.map((it,i)=>({it,i}));const s=BK.sort;a.sort((x,y)=>s==='rar'?(y.it.r-x.it.r)||(y.it.lvl||0)-(x.it.lvl||0):s==='lvl'?((y.it.lvl||0)-(x.it.lvl||0))||(y.it.r-x.it.r):s==='name'?String(x.it.name).localeCompare(String(y.it.name)):y.i-x.i);return a.map(o=>o.it);}
const isJunk=it=>!!it&&!it.crafted&&isJunkItem(it);// Build F: the bank's Store junk uses the shared Junk tag (Common gear/implants + anything tagged junk)
function bankStoreJunk(){const B=loadBank();let n=0,full=false;for(const it of P.inv.slice()){if(!isJunk(it))continue;if(B.items.length>=BANK_CAP){full=true;break;}B.items.push(it);P.inv.splice(P.inv.indexOf(it),1);n++;}
  writeBank(B);save();if(full)warn('Bank full ('+BANK_CAP+')');toast(n?'🏦 Stored '+n+' junk item'+(n===1?'':'s'):'No junk-tagged gear in your pack');return n;}
function bankStoreParts(){const B=loadBank();let n=0;for(const o of bag().slice()){bagAdd(o,o.n,B.bag);bagTake(o.id,o.n);n++;}writeBank(B);save();toast(n?'🏦 Stored '+n+' part stack'+(n===1?'':'s'):'No parts to store');return n;}
function bankTakeParts(){const B=loadBank();let n=0;for(const o of B.bag.slice()){bagAdd(o,o.n);bagTake(o.id,o.n,B.bag);n++;}writeBank(B);save();toast(n?'🏦 Took '+n+' part stack'+(n===1?'':'s'):'No parts stored');return n;}
function openBank(tab){if(tab)BK.tab=tab;const B=loadBank();const t=BK.tab;const keep=panelOpen==='locker'&&BK.last===t?pbody.scrollTop:0;BK.last=t;
  const nb=B.bag.reduce((a,o)=>a+o.n,0);
  let bar=`<div class="craftbar bankbar" id="bankBar"><div class="bkrow"><span class="cbi">🏦</span><span class="cbn"><b>Bank ${B.items.length}/${BANK_CAP}</b><small>Pack ${P.inv.length}/24 · ${B.credits}¢ stored · shared by all your characters</small></span>`;
  if(t==='items')bar+=`<button class="sbtn" data-act="bjunk" id="bJunk">Store junk</button>`;else if(t==='parts')bar+=`<button class="sbtn" data-act="bpall" id="bPall">Store all parts</button><button class="sbtn alt" data-act="bptake" id="bPtake">Take all</button>`;
  bar+=`</div><div class="tabs bktabs">${[['items','🎒 Items'],['parts','🧰 Parts ('+nb+')'],['cr','¢ Credits']].map(([k,n])=>`<button data-act="ltab" data-t="${k}" class="${t===k?'on':''}">${n}</button>`).join('')}</div>`;
  if(t==='items')bar+=`<div class="bkrow bkf"><input id="bankQ" type="search" placeholder="Search name…" value="${esc(BK.q)}" autocomplete="off"><div class="chips">${BFILT.map(([k,n])=>`<button class="chip${BK.f===k?' on':''}" data-act="bflt" data-f="${k}">${n}</button>`).join('')}</div><div class="chips">${BSORT.map(([k,n])=>`<button class="chip${BK.sort===k?' on':''}" data-act="bsort" data-s="${k}">${n}</button>`).join('')}</div></div>`;
  bar+='</div>';
  let h='';
  if(t==='items'){const pk=bankSorted(bankFilter(P.inv)),bAll=bankFilter(B.items),bk=bankSorted(bAll.filter(it=>!isDisk(it)||diskUsable(it)));const nHid=bAll.reduce((a,it)=>a+(isDisk(it)&&!diskUsable(it)?stackN(it):0),0);
    h=`<div class="cols"><div><div class="h4">Your pack · tap to store ➜</div>${pk.map(it=>itemRow(it,`<span class="pr">${isJunk(it)?'<span style="opacity:.6;font-size:11px">junk </span>':''}Store ➜</span>`,false,'bdep')).join('')||'<div style="opacity:.6">Nothing here.</div>'}</div>
      <div><div class="h4">Bank · tap to take ⬅</div>${nHid?`<div class="bkhid" id="bkHid">📀 ${nHid} disc${nHid>1?'s':''} for other professions hidden <small>(only the profession that can learn a disc sees it here)</small></div>`:''}${bk.map(it=>itemRow(it,'<span class="pr">⬅ Take</span>',false,'bwd')).join('')||'<div style="opacity:.6">'+(B.items.length?(nHid&&!bk.length?'Nothing else for '+PROFS[P.prof].name+'.':'No matches.'):'Bank empty. Anything stored here can be taken by any of your characters.')+'</div>'}</div></div>`;}
  else if(t==='parts')h=`<div class="stats" style="opacity:.8">Parts stack by type and QL and don't use bank slots.</div><div class="cols"><div><div class="h4">Your parts · tap to store the stack</div>${bagSort(bag()).map(o=>bagRow(o,'bdepm','<span class="pr">Store ➜</span>')).join('')||'<div style="opacity:.6">No parts.</div>'}</div><div><div class="h4">Bank parts</div>${bagSort(B.bag).map(o=>bagRow(o,'bwdm','<span class="pr">⬅ Take</span>')).join('')||'<div style="opacity:.6">None stored.</div>'}</div></div>`;
  else h=`<div class="stats">You carry <b style="color:#ffc85a">${P.credits}¢</b> · Bank holds <b style="color:#ffc85a">${B.credits}¢</b></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="sbtn" data-act="bcr" data-n="100">Store 100¢</button><button class="sbtn" data-act="bcr" data-n="${P.credits}">Store all</button><button class="sbtn alt" data-act="bcr" data-n="-100">Take 100¢</button><button class="sbtn alt" data-act="bcr" data-n="${-B.credits}">Take all</button></div>`;
  openPanel('🏦 BANK',bar+h,'locker');pbody.scrollTop=keep;
  const q=$('#bankQ');if(q){q.addEventListener('input',()=>{BK.q=q.value;bankApplyQ();});q.addEventListener('keydown',e=>e.stopPropagation());bankApplyQ();}}
function bankApplyQ(){const s=BK.q.trim().toLowerCase();const B=loadBank();const all=[...P.inv,...B.items];
  pbody.querySelectorAll('.item[data-act="bdep"],.item[data-act="bwd"]').forEach(el=>{const it=all.find(x=>x.id===el.dataset.id);el.style.display=!s||(it&&String(it.name).toLowerCase().includes(s))?'':'none';});}
function bankAct(a,b){const D=b.dataset;
  if(a==='bflt'){BK.f=D.f;openBank();}else if(a==='bsort'){BK.sort=D.s;openBank();}else if(a==='bjunk'){bankStoreJunk();openBank();}else if(a==='bpall'){bankStoreParts();openBank();}else if(a==='bptake'){bankTakeParts();openBank();}else return false;return true;}
function bankExports(){return {BANKS,BANK_CAP,BK,openBank,bankNear,bankStoreJunk,bankStoreParts,bankTakeParts,isJunk,bankType,loadBank,writeBank,bag,bagAdd};}
