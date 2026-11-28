// Packs the HD world kit: hd/kitworld.glb from Kenney Space Kit 2.0 (CC0 1.0, License.txt in the pack, kenney.nl/assets/space-kit,
// downloaded 2026-11-27): hover craft for the HD mounts and hangars/machines for the HD hubs. The kit shares four flat-colour
// materials (metal, metalRed, metalDark, dark); the game re-colours them per vehicle / hub palette. Each model is one top-level node.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, weld, quantize } from '@gltf-transform/functions';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const SRC = process.argv[2] || './skm', OUT = process.argv[3] || './out/kitworld.glb';
const NAMES = ['craft_speederA', 'craft_speederB', 'craft_speederC', 'craft_speederD', 'craft_racer',
  'hangar_largeA', 'hangar_largeB', 'hangar_smallA', 'hangar_smallB', 'hangar_roundA', 'machine_generatorLarge', 'satelliteDish_large', 'machine_barrelLarge', 'barrels'];
const docs = [];
for (const n of NAMES) {
  const d = await io.read(`${SRC}/${n}.glb`), root = d.getRoot(), sc = root.listScenes()[0], top = d.createNode(n);
  for (const c of sc.listChildren()) { sc.removeChild(c); top.addChild(c); }
  sc.addChild(top);
  for (const m of root.listMaterials()) { m.setMetallicFactor(0); m.setRoughnessFactor(1); }
  docs.push(d);
}
const main = docs[0];
for (const d of docs.slice(1)) mergeDocuments(main, d);
const scenes = main.getRoot().listScenes(), s0 = scenes[0];
for (const s of scenes.slice(1)) { for (const c of s.listChildren()) s0.addChild(c); s.dispose(); }
const buf0 = main.getRoot().listBuffers()[0];
for (const a of main.getRoot().listAccessors()) a.setBuffer(buf0);
for (const b of main.getRoot().listBuffers()) if (b !== buf0) b.dispose();
await main.transform(weld(), dedup(), prune());
// the same kit material from different files: keep the first of each name
const byName = {};
for (const m of main.getRoot().listMaterials()) { const k = m.getName(); if (!byName[k]) { byName[k] = m; continue; } for (const mesh of main.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) if (p.getMaterial() === m) p.setMaterial(byName[k]); m.dispose(); }
await main.transform(prune(), dedup(), quantize({ quantizePosition: 14, quantizeNormal: 10 }));
await io.write(OUT, main);
console.log(OUT, fs.statSync(OUT).size, s0.listChildren().length + ' models', main.getRoot().listMaterials().map(m => m.getName()).join(','));
