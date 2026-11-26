// Packs the HD monsters: hd/bestiary.glb  Quaternius Bestiary - Dungeon Monsters Kit (Source, bought 2026-11-26, QAL v1.0):
// Hellwarden, Imp, Lycan, Puglin, Skeleton_A, Skeleton_B, Tidebreaker. They have no clips of their own: they share the
// HD humans' skeleton (UE-style bone names), so the game drives them with anims.glb. Normal/ORM maps dropped,
// base colour + emissive kept at 512 px JPEG. Each model is one top-level node named after it.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, weld, quantize, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const SRC = process.argv[2] || '/root/drgfx/bestiary', OUT = process.argv[3] || '/root/drgfx/out/bestiary.glb';
const NAMES = ['Hellwarden', 'Imp', 'Lycan', 'Puglin', 'Skeleton_A', 'Skeleton_B', 'Tidebreaker'];
const docs = [];
for (const n of NAMES) {
  const d = await io.read(`${SRC}/${n}.glb`), root = d.getRoot();
  root.listScenes()[0].listChildren().forEach(c => c.setName(n));
  for (const m of root.listMaterials()) { m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setOcclusionTexture(null); m.setMetallicFactor(0); m.setRoughnessFactor(1); m.setName(n + '_' + m.getName()); }
  docs.push(d);
}
const main = docs[0];
for (const d of docs.slice(1)) mergeDocuments(main, d);
const scenes = main.getRoot().listScenes(), s0 = scenes[0];
for (const s of scenes.slice(1)) { for (const c of s.listChildren()) s0.addChild(c); s.dispose(); }
const buf0 = main.getRoot().listBuffers()[0];
for (const a of main.getRoot().listAccessors()) a.setBuffer(buf0);
for (const b of main.getRoot().listBuffers()) if (b !== buf0) b.dispose();
await main.transform(weld(), dedup(), prune(), textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [512, 512], quality: 82 }), quantize({ quantizePosition: 14, quantizeNormal: 10 }));
await io.write(OUT, main);
console.log(OUT, fs.statSync(OUT).size, s0.listChildren().map(c => c.getName()).join(','), main.getRoot().listTextures().length + ' textures');
