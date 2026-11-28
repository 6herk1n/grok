/* ---------------- LOOT overhaul: corpse loot window, auto-loot filter, junk, stacking ---------------- */
const LOOTF={off:{n:'Off',d:'Nothing is picked up by walking over it. Tap a corpse (or press F) to open its loot.'},all:{n:'Everything',d:'Walk over drops to pick up everything.'},unc:{n:'Uncommon+',d:'Picks up Uncommon or better. Common gear and implants sell for credits on the spot, so junk never fills your pack.'},rare:{n:'Rare+',d:'Picks up Rare or better. Anything below sells for credits on the spot.'}};
const LOOTF_ORDER=['off','all','unc','rare'];
const LOOT_REACH=6,LOOT_PILE_R=3;
function normLootF(v){return LOOTF[v]?v:'unc';}
function lootF(){return P.lootF=normLootF(P.lootF);}
function setLootF(v){if(!LOOTF[v])return false;P.lootF=v;save();return true;}
function lootThr(f){return f==='rare'?2:f==='unc'?1:0;}
function sellableKind(it){return !!it&&(it.kind==='gear'||isImp(it));}
// disks, clothing, uniques, faction and quest items are always kept
function lootKeep(it){return !sellableKind(it)||it.r>=4||!!it.uniq||!!it.fac||!!it.quest;}
function lootDecide(it,f){f=f||lootF();if(f==='off')return 'leave';if(isDisk(it))return 'take';if(f==='all'||lootKeep(it))return 'take';return it.r>=lootThr(f)?'take':'sell';}
/* Weave disks: never junk, never auto-sold; diskProf/diskUsable say who can learn one (generic 'any' disks fit everyone) */
function diskProf(it){const w=it&&WEAVES[it.wid];return w?w.prof:null;}
function diskUsable(it,prof){const p=diskProf(it);return !p||p==='any'||!PROFS[p]||p===(prof||P.prof);}
function isJunkItem(it){if(!it||isDisk(it)||!sellableKind(it)||isEquipped(it)||isLocked(it))return false;if(it.junk===true)return true;if(it.junk===false)return false;return it.r===0&&!it.uniq&&!it.fac&&!it.quest;}
function stackN(it){return Math.max(1,(it&&it.n)|0);}
function stackKey(it){return it&&isDisk(it)?'d:'+it.wid+':'+it.r:null;}
function invCan(it){const k=stackKey(it);return (k&&P.inv.some(x=>stackKey(x)===k))||P.inv.length<24;}
function invAdd(it){const k=stackKey(it);if(k){const ex=P.inv.find(x=>x!==it&&stackKey(x)===k);if(ex){ex.n=stackN(ex)+stackN(it);return true;}}if(P.inv.length>=24)return false;P.inv.push(it);return true;}
function stackInv(){const seen={};let m=0;P.inv=P.inv.filter(it=>{if(it&&it.n!=null)it.n=stackN(it);if(it&&it.n===1)delete it.n;const k=stackKey(it);if(!k)return true;if(seen[k]){seen[k].n=stackN(seen[k])+stackN(it);m++;return false;}seen[k]=it;return true;});return m;}
function junkList(){return P.inv.filter(isJunkItem);}
function junkValue(){return junkList().reduce((a,it)=>a+it.value*stackN(it),0);}
function sellJunk(){const L=junkList();if(!L.length){toast('No junk to sell');return 0;}const c=junkValue();P.inv=P.inv.filter(it=>!isJunkItem(it));P.credits+=c;SFX.coin();toast('🗑 Sold '+L.length+' junk item'+(L.length>1?'s':'')+' for '+c+'¢');log('🗑 Sold '+L.length+' junk item'+(L.length>1?'s':'')+' for <b style="color:#ffc85a">'+c+'¢</b>');if(invSel&&!findItem(invSel))invSel=null;save();return c;}
function sellJunkBtn(){const n=junkList().length,c=junkValue();return `<button class="sbtn alt sjbtn" data-lt="selljunk" ${n?'':'disabled'} title="Sell every item tagged Junk">🗑 Sell Junk${n?' ('+n+' · '+c+'¢)':''}</button>`;}
function lootFChips(){const f=lootF();return `<div class="ltf"><span>Auto-loot</span>${LOOTF_ORDER.map(k=>`<button class="ltchip${k===f?' on':''}" data-lt="filt" data-f="${k}">${LOOTF[k].n}</button>`).join('')}</div>`;}
/* ---- world piles: drops within LOOT_PILE_R of each other belong to the same corpse ---- */
function lootPile(l){return loots.filter(o=>Math.hypot(o.x-l.x,o.z-l.z)<=LOOT_PILE_R);}
function lootRemove(l){const i=loots.indexOf(l);if(i<0)return;scene.remove(l.m);scene.remove(l.b);if(l.b.material)l.b.material.dispose();loots.splice(i,1);}
function lootGot(it){SFX.loot();if(it.kind==='disk'){const w=WEAVES[it.wid];banner('📀 WEAVE DISK',w.name+' · '+profName(w.prof)+' · open the 📖 Weave Book');}log('Looted <b style="color:'+RAR[it.r].c+'">'+esc(it.name)+'</b>');}
let lootSoldAcc=0,lootSoldN=0,lootSoldT=0;
function lootAutoSell(it){if(isDisk(it))return;const v=it.value*stackN(it);P.credits+=v;lootSoldAcc+=v;lootSoldN++;lootSoldT=0.6;
  if(!P.lootHint){P.lootHint=true;log('🪙 <b>Auto-loot is on ('+LOOTF[lootF()].n+')</b>: lower-rarity gear sells for credits on the spot. Change it in 🎒 Inventory or any loot window.');}}
function lootSoldFlush(dt){if(lootSoldT<=0)return;lootSoldT-=dt;if(lootSoldT>0)return;SFX.coin();floatText(tmpV.set(P.pos.x,P.pos.y+2.6,P.pos.z),'+'+lootSoldAcc+'¢ auto-sold','xp');log('<span style="color:#9a9a9a">🪙 Auto-sold '+lootSoldN+' low-rarity drop'+(lootSoldN>1?'s':'')+' for '+lootSoldAcc+'¢</span>');lootSoldAcc=0;lootSoldN=0;save();}
// called from updLoot for a drop the player stands on; returns true when the drop is gone
function lootAuto(l){const a=lootDecide(l.item);if(a==='leave')return false;
  if(a==='sell'){lootRemove(l);lootAutoSell(l.item);return true;}
  if(!invCan(l.item)){if(!l.fullW){l.fullW=1;warn('Pack full: tap the drop to see it, or sell junk');}return false;}
  lootRemove(l);invAdd(l.item);lootGot(l.item);save();return true;}
function lootTake(id){const l=loots.find(o=>o.item.id===id);if(!l)return false;if(P.dead)return false;
  if(Math.hypot(l.x-P.pos.x,l.z-P.pos.z)>LOOT_REACH){warn('Move closer to loot');return false;}
  if(!invCan(l.item)){warn('Pack full');return false;}lootRemove(l);invAdd(l.item);lootGot(l.item);save();return true;}
function lootTakeAll(anchor){let n=0,full=0;for(const l of lootPile(anchor)){if(Math.hypot(l.x-P.pos.x,l.z-P.pos.z)>LOOT_REACH)continue;if(!invCan(l.item)){full++;continue;}lootRemove(l);invAdd(l.item);n++;}
  if(n){SFX.loot();log('Looted '+n+' item'+(n>1?'s':''));save();}if(full)warn('Pack full: '+full+' left on the ground');else if(!n)warn('Move closer to loot');return n;}
function lootSellPileJunk(anchor){let c=0,n=0;for(const l of lootPile(anchor)){if(!isJunkItem(l.item)||Math.hypot(l.x-P.pos.x,l.z-P.pos.z)>LOOT_REACH)continue;lootRemove(l);c+=l.item.value*stackN(l.item);n++;}if(n){P.credits+=c;SFX.coin();toast('🪙 Sold '+n+' junk drop'+(n>1?'s':'')+' for '+c+'¢');save();}return c;}
/* ---- loot window ---- */
let lootAnchor=null;
function openLoot(l){if(!l)return;lootAnchor={x:l.x,z:l.z};renderLoot();}
function renderLoot(){const A=lootAnchor;if(!A)return;const pile=lootPile(A).sort((a,b)=>b.item.r-a.item.r);
  if(!pile.length){if(panelOpen==='loot')closePanel();lootAnchor=null;return;}
  const d=Math.hypot(A.x-P.pos.x,A.z-P.pos.z),far=d>LOOT_REACH,jn=pile.filter(o=>isJunkItem(o.item)),jc=jn.reduce((a,o)=>a+o.item.value*stackN(o.item),0);
  let h=`<div class="lthead"><button class="sbtn ltall" data-lt="all" ${far?'disabled':''}>Take all (${pile.length})</button>${jn.length?`<button class="sbtn alt ltall" data-lt="pjunk" ${far?'disabled':''}>🪙 Sell junk (${jc}¢)</button>`:''}<span class="ltpack">Pack ${P.inv.length}/24</span></div>`;
  if(far)h+=`<div class="ltfar">Walk closer to loot (${Math.round(d)} m away)</div>`;
  h+='<div class="ltlist">'+pile.map(o=>{const it=o.item,j=isJunkItem(it);return `<div class="ltrow${j?' jk':''}"><span class="ico" style="color:${RAR[it.r].c};border:1px solid ${RAR[it.r].c}">${icoOf(it)}</span><span class="ltn"><b style="color:${RAR[it.r].c}">${esc(it.name)}${stackN(it)>1?' ×'+stackN(it):''}</b><span>${RAR[it.r].n} · ${isImp(it)?IMPDEF[it.slot].n+' implant':isDisk(it)?profName(it.prof)+' Weave Disk':it.kind==='cloth'?'Clothing':itemType(it)}${j?' · <i class="jtag">Junk</i>':''} · ${it.value}¢</span></span><button class="sbtn ltake" data-lt="take" data-id="${it.id}" ${far?'disabled':''}>Take</button></div>`;}).join('')+'</div>';
  h+=lootFChips()+`<div class="ltdesc">${LOOTF[lootF()].d}</div>`;
  openPanel('💰 LOOT',h,'loot');}
/* ---- picking: tap a corpse or the drop itself ---- */
function lootPick(ray){let best=null,bd=1e9;const cam=camera.position;
  for(const l of loots){const r=1.3;if(ray.ray.distanceSqToPoint(l.m.position)<r*r){const d=l.m.position.distanceTo(cam);if(d<bd){bd=d;best=l;}}}
  for(const c of CORPSES){const e=c.e;if(!e||!e.dead)continue;entChest(e,tmpV);const r=(e.hitR||1)+0.7;if(ray.ray.distanceSqToPoint(tmpV)<r*r){const d=tmpV.distanceTo(cam);if(d<bd){let nl=null,nd=LOOT_PILE_R;for(const l of loots){const q=Math.hypot(l.x-e.pos.x,l.z-e.pos.z);if(q<=nd){nd=q;nl=l;}}if(nl){bd=d;best=nl;}}}}
  return best;}
function lootInteract(p){let b=null,bd=2.6;for(const l of loots){const d=Math.hypot(l.x-p.x,l.z-p.z);if(d<bd){bd=d;b=l;}}return b?{k:'loot',l:b,label:'💰 Loot ('+lootPile(b).length+')'}:null;}
function lootInit(){pbody.addEventListener('click',e=>{const b=e.target.closest('[data-lt]');if(!b||b.disabled)return;const a=b.dataset.lt;SFX.ui();
  if(a==='take'){lootTake(b.dataset.id);renderLoot();}
  else if(a==='all'){lootTakeAll(lootAnchor);renderLoot();}
  else if(a==='pjunk'){lootSellPileJunk(lootAnchor);renderLoot();}
  else if(a==='filt'){setLootF(b.dataset.f);toast('Auto-loot: '+LOOTF[lootF()].n);if(panelOpen==='loot')renderLoot();else if(panelOpen==='inv')openInventory();}
  else if(a==='selljunk'){sellJunk();if(panelOpen==='vend')openVendor();else if(panelOpen==='fvend')openFacVendor(curFV);else if(panelOpen==='inv')openInventory();}});}
function lootExports(){return {diskProf,diskUsable,lootAutoSell,get vendConfirm(){return vendConfirm;},LOOTF,lootF,setLootF,lootDecide,lootKeep,isJunkItem,invAdd,invCan,stackInv,stackN,junkList,junkValue,sellJunk,lootPile,lootTake,lootTakeAll,openLoot,renderLoot,lootPick,lootInteract,lootSellPileJunk,dropLoot,updLoot,learnDisk,openVendor,openFacVendor,openInventory,killEnemy,genDisk,findInteract,interact,tapPick,get loots(){return loots;},camera,VEND,bagAdd,bag,makeElite,exportText,entChest,findItem,CONSUM,setVendTab(t){vendTab=t;},get nearI(){return nearI;}};}
