// Merges the converted weapon GLBs (three.js FBXLoader -> GLTFExporter, see tools/hd/fbx-conv) into hd/weapons.glb.
// Each weapon becomes one top-level node named after its file; game44.js scales/orients them per weapon type.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, weld, quantize, flatten, join } from '@gltf-transform/functions';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const names = fs.readdirSync('wsrc').filter(f => f.endsWith('.glb')).map(f => f.slice(0, -4)).sort();
const out = await io.read('wsrc/' + names[0] + '.glb');
out.getRoot().listScenes()[0].listChildren().forEach(n => n.setName(names[0]));
for (const n of names.slice(1)) {
  const d = await io.read('wsrc/' + n + '.glb');
  d.getRoot().listScenes()[0].listChildren().forEach(c => c.setName(n));
  mergeDocuments(out, d);
}
const scenes = out.getRoot().listScenes(), main = scenes[0];
for (const s of scenes.slice(1)) { for (const c of s.listChildren()) main.addChild(c); s.dispose(); }
// mergeDocuments keeps one buffer per source file; a GLB may only have one
const buf0 = out.getRoot().listBuffers()[0];
for (const a of out.getRoot().listAccessors()) a.setBuffer(buf0);
for (const b of out.getRoot().listBuffers()) if (b !== buf0) b.dispose();
await out.transform(weld(), dedup(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 10 }));
await io.write('/w/out/weapons.glb', out);
console.log('weapons.glb', fs.statSync('/w/out/weapons.glb').size, main.listChildren().map(c => c.getName()).join(','));
