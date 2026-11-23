// turns three r150 examples/jsm modules into one global script: THREE.GLTFLoader, THREE.SkeletonUtils
const fs=require('fs');
function mod(file,exportsExpr){let s=fs.readFileSync(file,'utf8');
  s=s.replace(/import\s*\{([^}]*)\}\s*from\s*'three';/g,(m,names)=>'const {'+names.replace(/\s+/g,' ').trim()+'}=THREE;');
  s=s.replace(/import\s*\{[^}]*\}\s*from\s*'\.\.\/utils\/BufferGeometryUtils\.js';/g,'const {toTrianglesDrawMode}=THREE.__BGU;');
  s=s.replace(/^export\s*\{[^}]*\};?/gm,'');s=s.replace(/^export\s+(function|class|const)/gm,'$1');
  if(/^\s*import\s/m.test(s)||/^export\s/m.test(s))throw new Error('unconverted import/export in '+file);
  return '(function(){\n'+s+'\n'+exportsExpr+'\n})();\n';}
const out='/* Three.js r150 (0.150.1) examples, MIT licence (see three.LICENSE): GLTFLoader, SkeletonUtils, BufferGeometryUtils.toTrianglesDrawMode.\n   Converted from examples/jsm to a plain script by tools/three-conv (imports -> THREE globals). Used by the HD look (game44.js). */\n'+
  mod('BufferGeometryUtils.js','THREE.__BGU={toTrianglesDrawMode};')+mod('GLTFLoader.js','THREE.GLTFLoader=GLTFLoader;')+mod('SkeletonUtils.js','THREE.SkeletonUtils={clone,retarget,retargetClip};');
fs.writeFileSync('three-gltf.js',out);console.log('ok',out.length);
