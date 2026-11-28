// Packs the HD critters: hd/critters.glb from Quaternius CC0 models (downloaded 2026-11-27 from poly.pizza, each page says
// "Public Domain (CC0)"; sources in hd/LICENSE.txt): Spider, Crab Enemy (-> Crab), Snake, Yeti (Ultimate Monsters, -> Golem).
// Each model becomes one top-level node named after it; its clips are renamed '<Model>|<Clip>' (the HD_BEAST convention in
// game44) and trimmed to the ones the game plays. No textures (flat-colour materials); meshes welded and quantised.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, weld, quantize } from '@gltf-transform/functions';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const SRC = process.argv[2] || './src', OUT = process.argv[3] || './out/critters.glb';
// file -> [node name, {source clip suffix: game clip name}]
const MODELS = {
  spider: ['Spider', { Spider_Idle: 'Idle', Spider_Walk: 'Walk', Spider_Attack: 'Attack', Spider_Death: 'Death' }],
  crab: ['Crab', { Idle: 'Idle', Walk: 'Walk', Bite_Front: 'Attack', Death: 'Death' }],
  snake: ['Snake', { Snake_Idle: 'Idle', Snake_Walk: 'Walk', Snake_Attack: 'Attack' }],
  yeti2: ['Golem', { Idle: 'Idle', Walk: 'Walk', Run: 'Run', Punch: 'Attack', Death: 'Death' }]};
const docs = [];
for (const f in MODELS) {
  const [name, clips] = MODELS[f];
  const d = await io.read(`${SRC}/${f}.glb`), root = d.getRoot(), sc = root.listScenes()[0], top = d.createNode(name);
  for (const c of sc.listChildren()) { sc.removeChild(c); top.addChild(c); }
  sc.addChild(top);
  for (const a of root.listAnimations()) { const suf = a.getName().split('|').pop(); if (clips[suf]) a.setName(name + '|' + clips[suf]); else a.dispose(); }
  for (const m of root.listMaterials()) { m.setMetallicFactor(0); m.setRoughnessFactor(1); m.setName(name + '_' + m.getName()); }
  docs.push(d);
}
const main = docs[0];
for (const d of docs.slice(1)) mergeDocuments(main, d);
const scenes = main.getRoot().listScenes(), s0 = scenes[0];
for (const s of scenes.slice(1)) { for (const c of s.listChildren()) s0.addChild(c); s.dispose(); }
const buf0 = main.getRoot().listBuffers()[0];
for (const a of main.getRoot().listAccessors()) a.setBuffer(buf0);
for (const b of main.getRoot().listBuffers()) if (b !== buf0) b.dispose();
await main.transform(weld(), dedup(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 10 }));
await io.write(OUT, main);
const r = main.getRoot();
console.log(OUT, fs.statSync(OUT).size, s0.listChildren().map(c => c.getName()).join(','), r.listAnimations().map(a => a.getName()).join(','));
