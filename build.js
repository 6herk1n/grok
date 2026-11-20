#!/usr/bin/env node
// build.js: builds DUSTREACH from src/ into the 6 files GitHub Pages serves from the repo root.
//   node build.js            -> writes index.html, three.min.js, sw.js, manifest.webmanifest, icon-180.png, icon-512.png here
//   node build.js <outDir>   -> writes them into <outDir> instead (handy for comparing builds)
// No npm install needed: Three.js r150 is vendored in src/vendor/.
// Build stamp: <UTC yyyymmddThhmmss>-<first 8 hex of sha1(game code)>. It goes into index.html (meta dr-build, window.DR_BUILD)
// and sw.js (cache name), so every build gets a fresh offline cache and the in-game "New version" prompt works.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname,SRC=path.join(ROOT,'src'),OUT=path.resolve(process.argv[2]||ROOT);
const rd=f=>fs.readFileSync(path.join(SRC,f),'utf8');
const sha8=s=>crypto.createHash('sha1').update(s).digest('hex').slice(0,8);

// Three.js: drop the r150 "build/three.min.js is deprecated" console.warn (it would show in every player's console)
let three=rd('vendor/three.min.js').replace(/console\.warn\( 'Scripts "build\/three\.js"[^;]*?\);/,'');
if(/<\/script/i.test(three))throw new Error('three.min.js contains </script');
const THREE_V='r'+rd('vendor/THREE_VERSION').trim().split('.')[1]+'-'+sha8(three);
const THREE_URL='three.min.js?v='+THREE_V;   // versioned URL: a game update re-downloads only index.html

// Game code: these files are concatenated IN THIS ORDER into one <script> (later files patch earlier ones; game4 boots the game last)
const ORDER=['game1','game25','game2','game3','game5','game6','game7','game8','game9','game10','game11','game12','game13','game14','game15','game16',
  'game17','game18','game19','game20','game21','game22','game23','game24','game26','game27','game28','game29','game30','game31','game32','game33',
  'game34','game35','game36','game37','game38','game39','game4'];
const game=ORDER.map(f=>rd(f+'.js')).join('\n');
const BUILD=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'-'+sha8(game);

let html=rd('template.html');
if(html.split('<script>__THREE__</script>').length!==2)throw new Error('template must contain exactly one <script>__THREE__</script>');
html=html.split('__BUILD__').join(BUILD).split('__ICON__').join('icon-180.png')
  .replace('<script>__THREE__</script>','<script src="'+THREE_URL+'"></script>').replace('__GAME__',()=>game);
if(/__(BUILD|ICON|GAME|THREE)__/.test(html))throw new Error('unreplaced placeholder in index.html');

fs.mkdirSync(OUT,{recursive:true});
const w=(f,d)=>fs.writeFileSync(path.join(OUT,f),d);
w('index.html',html);
w('three.min.js',three);
w('sw.js',rd('sw.js').split('__BUILD__').join(BUILD).split('__THREE_URL__').join(THREE_URL));
w('manifest.webmanifest',JSON.stringify({name:'Dustreach — Kessra Frontier',short_name:'Dustreach',id:'./',start_url:'./',scope:'./',display:'standalone',
  orientation:'landscape',background_color:'#1a0f0a',theme_color:'#1a0f0a',
  icons:[{src:'icon-180.png',sizes:'180x180',type:'image/png',purpose:'any'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]},null,1));
w('icon-180.png',Buffer.from(rd('icon.b64').trim(),'base64'));
fs.copyFileSync(path.join(SRC,'icon-512.png'),path.join(OUT,'icon-512.png'));
console.log('DUSTREACH build',BUILD,'->',OUT,'| index.html',fs.statSync(path.join(OUT,'index.html')).size,'bytes |',THREE_URL);
