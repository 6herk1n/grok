#!/usr/bin/env node
// check_save_keys.js: fails if the game stores something in localStorage that Export save would leave behind.
// Every 'dustreach_*' key in src/ must be either in EXP_KEYS (src/game20.js, exported + imported) or listed
// in DEVICE_ONLY below with the reason it is not part of a save. Every localStorage/lsSet call must name its
// key as a literal or a KEY constant, so a key can't be built at run time where this check can't see it.
// Background: Build T's apartment key (dustreach_apt_v1) was missing from Export for 3 days (fixed 2026-11-23).
'use strict';
const fs=require('fs'),path=require('path');
const SRC=path.join(path.dirname(__dirname),'src');

// Keys that belong to this device/browser, not to the player's progress. Add new ones here only with a reason.
const DEVICE_ONLY={
  dustreach_gfx_v1:'graphics quality setting for this device',
  dustreach_fps30_v1:'30 fps cap setting for this device',
  dustreach_cam_v1:'camera zoom setting for this device',
  dustreach_bal_o:'debug switch for the Build O balance retune',
  dustreach_roster_bak_v1:'rolling automatic backup of the roster on this device',
  dustreach_preimport_v1:'undo copy taken just before an import',
  dustreach_lastexport_v1:'when this device last exported (save reminder)',
  dustreach_firstseen_v1:'when this device first ran the game (save reminder)',
  dustreach_exportnag_v1:'save reminder snooze on this device',
  dustreach_look_v1:'Classic/HD look setting for this device',
  dustreach_cloud_v1:'this device\'s cloud backup code (must never go into an export file)',
};

const files=fs.readdirSync(SRC).filter(f=>/^game\d+\.js$/.test(f));
const code=Object.fromEntries(files.map(f=>[f,fs.readFileSync(path.join(SRC,f),'utf8')]));
const all=Object.values(code).join('\n');
const errors=[];

const m=/const EXP_KEYS=\[([^\]]*)\]/.exec(code['game20.js']||'');
if(!m)errors.push('Could not find `const EXP_KEYS=[...]` in src/game20.js');
const EXP=new Set(m?[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]):[]);

// 1. every dustreach_* key is exported or deliberately device-only
const keys=new Set([...all.matchAll(/['"`](dustreach_[A-Za-z0-9_]+)['"`]/g)].map(x=>x[1]));
for(const k of [...keys].sort()){
  if(EXP.has(k)&&DEVICE_ONLY[k])errors.push(`${k} is in both EXP_KEYS and DEVICE_ONLY - pick one`);
  else if(!EXP.has(k)&&!DEVICE_ONLY[k])errors.push(`${k} is stored by the game but not in EXP_KEYS (src/game20.js), so Export save would lose it. Add it to EXP_KEYS (and to EXP_OPT, so older save files don't wipe it on import), or to DEVICE_ONLY in this test with a reason.`);
}
for(const k of EXP)if(!keys.has(k)&&k!=='dustreach_save_v1')errors.push(`EXP_KEYS lists ${k} but nothing in src/ uses it`);

// 2. no keys built at run time, e.g. 'dustreach_'+x or `dustreach_${x}`
for(const [f,s] of Object.entries(code))for(const x of s.matchAll(/['"`]dustreach_[A-Za-z0-9_]*(\$\{|['"`]\s*\+)/g))
  errors.push(`${f}: a localStorage key is built at run time near "${x[0]}". Use a fixed 'dustreach_...' key so this check can see it.`);

// 3. every storage call names its key as a literal or a constant that holds a dustreach_* literal
const consts=new Set([...all.matchAll(/\b([A-Z][A-Z0-9_]*)\s*=\s*'dustreach_[A-Za-z0-9_]+'/g)].map(x=>x[1]));
for(const [f,s] of Object.entries(code))for(const x of s.matchAll(/(?:localStorage\.(?:setItem|getItem|removeItem)|\blsSet)\(\s*([^,)]+)/g)){
  const a=x[1].trim();
  if(/^'dustreach_[A-Za-z0-9_]+'$/.test(a)||consts.has(a))continue;
  if(f==='game20.js'&&a==='k')continue;// the export/import loops over EXP_KEYS
  if(/^(\w+)$/.test(a)&&/^function lsSet\(/m.test(s)&&new RegExp('function lsSet\\(\\s*'+a+'\\b').test(s))continue;// lsSet's own parameter
  errors.push(`${f}: storage call with key \`${a}\`. Use a 'dustreach_...' literal or a KEY constant set to one.`);
}

if(errors.length){console.error('\nFAILED - save keys:\n - '+errors.join('\n - '));process.exit(1);}
console.log(`\nPASSED - all ${keys.size} storage keys checked: ${EXP.size} exported, ${Object.keys(DEVICE_ONLY).length} device-only`);
