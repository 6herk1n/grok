#!/usr/bin/env node
// check_build.js: fails if the committed game files aren't what `node build.js` makes from src/.
// Catches a hand edit to index.html (or sw.js etc.) that the next build from src/ would silently wipe out.
// The build stamp is <UTC time>-<hash of game code>; only the time part is ignored, so a code change
// that wasn't rebuilt still fails via the hash.
'use strict';
const fs=require('fs'),os=require('os'),path=require('path'),{execFileSync}=require('child_process');
const ROOT=path.dirname(__dirname);
const OUT=fs.mkdtempSync(path.join(os.tmpdir(),'dr-build-'));
execFileSync(process.execPath,[path.join(ROOT,'build.js'),OUT],{stdio:'inherit'});
const FILES=['index.html','three.min.js','sw.js','manifest.webmanifest','icon-180.png','icon-512.png'];
for(const f of fs.readdirSync(path.join(ROOT,'src','hd')).filter(f=>/\.(glb|txt)$/.test(f)))FILES.push('hd/'+f);// HD look assets
const norm=b=>b.toString('latin1').replace(/\d{8}T\d{6}-(?=[0-9a-f]{8})/g,'STAMP-');
const bad=FILES.filter(f=>!fs.existsSync(path.join(ROOT,f))||norm(fs.readFileSync(path.join(ROOT,f)))!==norm(fs.readFileSync(path.join(OUT,f))));
fs.rmSync(OUT,{recursive:true,force:true});
if(bad.length){
  console.error('\nFAILED - these committed files differ from a fresh build of src/: '+bad.join(', '));
  console.error('Edit src/ (not the built files), run `node build.js`, and commit both.');
  process.exit(1);
}
console.log('\nPASSED - committed files match a fresh build of src/');
