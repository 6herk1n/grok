// Packs the Legion dropship (Quaternius "LowPoly Spaceships" Jan 2018, Spaceship5, FBX -> GLB via tools/hd/fbx-conv) into hd/ship.glb.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, weld, quantize } from '@gltf-transform/functions';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const d = await io.read('/w/ship/Spaceship5.glb');
d.getRoot().listScenes()[0].listChildren().forEach(n => n.setName('dropship'));
await d.transform(weld(), dedup(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 10 }));
await io.write('/w/out/ship.glb', d);
console.log('ship.glb', fs.statSync('/w/out/ship.glb').size);
