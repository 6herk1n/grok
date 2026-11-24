// Packs the HD robots and hounds:
//  hd/mech.glb  Quaternius Animated Mech Pack (Mar 2021, CC0): Stan, Mike, Leela (textured), clips trimmed, textures 512 px JPEG
//  hd/wolf.glb  Quaternius Ultimate Animated Animals (CC0): Wolf, clips trimmed
// Each model is one top-level node named after it; clips are renamed '<Model>|<Clip>'.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, weld, quantize, textureCompress, resample } from '@gltf-transform/functions';
import sharp from 'sharp';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
async function load(file, name, keep) {
  const d = await io.read(file);
  const root = d.getRoot();
  root.listScenes()[0].listChildren().forEach(n => n.setName(name));
  for (const a of root.listAnimations()) { const n = a.getName().replace(/^.*\|/, ''); if (!keep.includes(n)) a.dispose(); else a.setName(name + '|' + n); }
  return d;
}
async function pack(list, out, tex) {
  const docs = [];
  for (const [f, n, k] of list) docs.push(await load(f, n, k));
  const main = docs[0];
  for (const d of docs.slice(1)) mergeDocuments(main, d);
  const scenes = main.getRoot().listScenes(), s0 = scenes[0];
  for (const s of scenes.slice(1)) { for (const c of s.listChildren()) s0.addChild(c); s.dispose(); }
  const buf0 = main.getRoot().listBuffers()[0];
  for (const a of main.getRoot().listAccessors()) a.setBuffer(buf0);
  for (const b of main.getRoot().listBuffers()) if (b !== buf0) b.dispose();
  const steps = [resample(), weld(), dedup(), prune()];
  if (tex) steps.push(textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [512, 512], quality: 80 }));
  steps.push(quantize({ quantizePosition: 14, quantizeNormal: 10 }));
  await main.transform(...steps);
  await io.write(out, main);
  console.log(out, fs.statSync(out).size, main.getRoot().listAnimations().map(a => a.getName()).join(','));
}
const M = ['Idle', 'Walk', 'Run', 'Shoot', 'Punch', 'Death', 'HitRecieve_1'];
await pack([['/w/mech/Stan.gltf', 'Stan', M], ['/w/mech/Mike.gltf', 'Mike', M], ['/w/mech/Leela.gltf', 'Leela', M]], '/w/out/mech.glb', true);
await pack([['/w/wolf/Wolf.gltf', 'Wolf', ['Idle', 'Walk', 'Gallop', 'Attack', 'Death', 'Idle_HitReact1']]], '/w/out/wolf.glb', false);
