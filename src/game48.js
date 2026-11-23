/* ================= INIT & AGGDEF (2026-11-23, Claude; AO nano-init / AggDef-bar style) =================
   Init: faster Weave recharge. From attributes: (Agility + Sense) / (level x 1.2 + 20) x 2.5, capped at 12% (so a typical
   build gets 3-12%), plus the AggDef stance. Applied in a useAbility wrapper: any cooldown the cast just started is
   shortened by Init% (negative Init lengthens it).
   AggDef stance P.aggdef in -2..+2 (Defensive++ .. Aggressive++), per step: +6% Init and -4% damage reduction (S.dr can go
   below 0 = more damage taken); Defensive is the mirror. Neutral (0) is the default, so existing balance is untouched
   apart from the small attribute Init. Shown in the stats summary (Skills panel / Menu) with the stance buttons.
   S.init lives on the statsFor result (statsFor wrapper). P.aggdef v1 via aggFields(). */
const AGG_STEPS=[[-2,'🛡🛡','Defensive++'],[-1,'🛡','Defensive'],[0,'⚖','Neutral'],[1,'⚔','Aggressive'],[2,'⚔⚔','Aggressive++']];
function aggFields(s){return {aggdef:clamp(Math.round(+s.aggdef||0),-2,2)};}
function initFromAttrs(c,s){const E=s.E||{};const L=Math.max(1,(c.level|0));return clamp(((E.agi||0)+(E.sen||0))/(L*1.2+20)*2.5,0,12);}
const _statsForInit=statsFor;
statsFor=function(c){const s=_statsForInit(c);if(!c)return s;const k=clamp(Math.round(+c.aggdef||0),-2,2);
  s.init=Math.round((initFromAttrs(c,s)+6*k)*10)/10;if(k)s.dr=(s.dr||0)-4*k;s.aggdef=k;return s;};
const _useAbilityInit=useAbility;
useAbility=function(i){const before=Object.assign({},P.cds||{});const out=_useAbilityInit.apply(this,arguments);const ini=S&&S.init||0;
  if(ini&&P.cds){for(const id in P.cds){const v=P.cds[id];if(v>T&&v!==before[id]){P.cds[id]=T+(v-T)*(1-ini/100);}}}return out;};
const _statsHtmlInit=statsHtml;
statsHtml=function(){const k=clamp(P.aggdef|0,-2,2);const h=_statsHtmlInit.apply(this,arguments);
  return h+`<div class="stats" style="margin-top:6px">⏱ Init <b>${(S.init||0)>0?'+':''}${S.init||0}%</b> <small style="opacity:.7">(faster Weave recharge; from Agility + Sense and your stance)</small>
    <div class="h4" style="margin:8px 0 4px">Stance <small style="text-transform:none;opacity:.7">(AggDef)</small></div><div class="tabs" style="margin:0;flex-wrap:wrap">${AGG_STEPS.map(([v,ic,n])=>`<button data-act="aggdef" data-v="${v}" class="${k===v?'on':''}" title="${n}">${ic} ${n}</button>`).join('')}</div>
    <small style="opacity:.75">Each step towards Aggressive: +6% Init, 4% more damage taken. Towards Defensive: the reverse.</small></div>`;};
const _stage3ActInit=stage3Act;
stage3Act=function(a,b){if(a==='aggdef'){P.aggdef=clamp(+b.dataset.v|0,-2,2);calcStats();save();if(panelOpen==='skills')openSkills();else openMenu();return true;}return _stage3ActInit(a,b);};
function initExports(){return {AGG_STEPS,aggFields,initFromAttrs};}
