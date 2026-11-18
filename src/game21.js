/* ================= HUD DECLUTTER: ⋯ top menu (Skills / Journal / Team) + quick-action cluster (Stim / Vehicle / Next target) =================
   Keyboard shortcuts are unchanged (K, L, T, Q, R, Tab). Empty ability slots are hidden (the 📖 Weave Book fills them). */
function moreOpen(on){const d=$('#moreDrop');if(on==null)on=d.classList.contains('hidden');d.classList.toggle('hidden',!on);$('#bMore').classList.toggle('on',on);}
function quickOpen(on){if(on==null)on=!document.body.classList.contains('qopen');document.body.classList.toggle('qopen',on);$('#bQuick .ic').textContent=on?'✕':'⋯';}
function hudDeclutterInit(){
  btn('#bMore',()=>moreOpen());btn('#bQuick',()=>quickOpen());
  // picking an entry closes the drop-down (the entry's own handler runs first)
  $('#moreDrop').addEventListener('pointerup',()=>setTimeout(()=>moreOpen(false),0));
  canvas.addEventListener('pointerdown',()=>{if(!$('#moreDrop').classList.contains('hidden'))moreOpen(false);},true);}
let qdAcc=0;
function updDeclutter(dt){qdAcc+=dt;if(qdAcc<0.2)return;qdAcc=0;
  const q=$('#qStims');q.textContent=P.stims>0?P.stims:'';$('#bQuick').classList.toggle('mnt',!!P.mount);
  const npp=ppAvail(),pts=P.sp>0||npp>0;const mb=$('#bMore');mb.classList.toggle('pts',pts);$('#moreBadge').textContent=pts?(P.sp+npp):'';perkBadges();
  if(panelOpen&&!$('#moreDrop').classList.contains('hidden'))moreOpen(false);}
function declutterExports(){return {moreOpen,quickOpen,updDeclutter,inp,barIds,inAbZone,PROF_TAG};}
