// Packs the HD sci-fi dungeon kit: hd/scifi.glb  Quaternius Modular Sci-Fi MegaKit (Source, bought 2026-11-26, QAL v1.0).
// A subset of straight wall / wall-top modules (4 m wide on the kit's 4 m grid; wall plane at local x = -2, facing +x), floor
// tiles (4 x 4 m, top at y = 0), columns and props. 'Collision' helper primitives removed; normal/ORM maps dropped, base
// colour kept as JPEG (trim sheets 1024 px, the rest 512). Each piece is one top-level node named after it.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, weld, quantize, textureCompress, flatten, join } from '@gltf-transform/functions';
import sharp from 'sharp';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const SRC = process.argv[2] || '/root/drgfx/megakit', OUT = process.argv[3] || '/root/drgfx/out/scifi.glb';
const PIECES = {
  Walls: ['WallAstra_Straight', 'WallBand_Straight', 'WallWideBand_Straight', 'WallPipe_Straight', 'WallPadded_Straight', 'TopPlates_Straight', 'TopCables_Straight', 'TopSimple_Straight'],
  Platforms: ['Platform_Metal', 'Platform_Simple', 'Platform_DarkPlates', 'Platform_Squares', 'Platform_CenterPlate', 'Platform_WidePlates'],
  Columns: ['Column_Simple', 'Column_SimpleSquare', 'Column_Round', 'Column_Large_Straight'],
  Props: ['Prop_Crate1', 'Prop_Crate2', 'Prop_Crate3', 'Prop_Crate4', 'Prop_Barrel_Large', 'Prop_Barrel_Small', 'Prop_Computer', 'Prop_Pod', 'Prop_Light_Floor', 'Prop_Vent_Big', 'Prop_Teleporter', 'Prop_AccessPoint', 'Prop_Pipe_Thick_Straight', 'Prop_Light_Wide']};
const docs = [];
for (const dir in PIECES) for (const n of PIECES[dir]) {
  const d = await io.read(`${SRC}/${dir}/${n}.gltf`), root = d.getRoot();
  // one top-level node per piece, holding every mesh node of the file
  const sc = root.listScenes()[0], top = d.createNode(n);
  for (const c of sc.listChildren()) { sc.removeChild(c); top.addChild(c); }
  sc.addChild(top);
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const mt = p.getMaterial(); if (mt && /collision/i.test(mt.getName())) p.dispose(); }
  for (const m of root.listMaterials()) { m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setOcclusionTexture(null); m.setMetallicFactor(0); m.setRoughnessFactor(1); }
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
// materials with the same name from different files are the same kit material: keep the first
const byName = {};
for (const m of main.getRoot().listMaterials()) { const k = m.getName(); if (!byName[k]) { byName[k] = m; continue; } for (const mesh of main.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) if (p.getMaterial() === m) p.setMaterial(byName[k]); m.dispose(); }
await main.transform(prune(), dedup(),
  textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [1024, 1024], quality: 80, slots: /baseColor/, pattern: /Trim/ }),
  textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [512, 512], quality: 80, pattern: /^(?!.*Trim)/ }),
  quantize({ quantizePosition: 14, quantizeNormal: 10 }));
await io.write(OUT, main);
const r = main.getRoot();
console.log(OUT, fs.statSync(OUT).size, s0.listChildren().length + ' pieces', r.listMaterials().map(m => m.getName()).join(','), r.listTextures().map(t => t.getName() + ':' + (t.getSize() || []).join('x')).join(' '));
