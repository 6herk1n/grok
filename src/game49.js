/* ================= BALANCE 24 NOV (Claude): low/mid-level energy starvation =================
   The 23 Nov sweep found Vanguard and Flux (and Siege at Lv 7) spending a large share of boss fights unable to cast: their
   Weaves cost 2-4x the in-combat regen at Lv 10-40 (Vanguard's costs scale with level, its pool doesn't; Flux's 1.6 s Lance
   drains everything), while every other profession sits at ~1.5x and falls under 1x by Lv 48.
   Fix: a per-profession in-combat regen bonus (a + b x level energy/s), full up to Lv 50 and fading to nothing by Lv 70,
   where pools are large enough. Only with the Build O balance on (balOn), like enRegenC itself. */
const PROF_ENR={vanguard:[4,0.2],flux:[5,0.2],siege:[2,0.05]};
function profEnRegen(c){c=c||P;const k=PROF_ENR[c&&c.prof];if(!k)return 0;const L=Math.max(1,c.level|0);return (k[0]+k[1]*L)*clamp((70-L)/20,0,1);}
const _enRegenCBal=enRegenC;
enRegenC=function(){return _enRegenCBal()+(balOn()?profEnRegen(P):0);};
function balExports(){return {PROF_ENR,profEnRegen,enRegenC:()=>enRegenC()};}
