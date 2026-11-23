// Packs the Quaternius CC0 character assets into small GLBs for DUSTREACH's HD look.
// Run: docker run --rm -v /root/drgfx:/w -w /w/tool node:22 node pack.mjs
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, quantize, resample, weld } from '@gltf-transform/functions';
import sharp from 'sharp';
import fs from 'fs';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const UBC = '/w/ubc/Universal Base Characters[Standard]/Base Characters/Godot - UE/';
const OUT_SRC = '/w/outfits/Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Outfits/';
const UAL = '/w/ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb';
const OUT = '/w/out/';
fs.mkdirSync(OUT, { recursive: true });

const CLIPS = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop', 'Sword_Attack', 'Sword_Idle', 'Pistol_Idle_Loop', 'Pistol_Shoot',
  'Spell_Simple_Shoot', 'Spell_Simple_Idle_Loop', 'Punch_Jab', 'Punch_Cross', 'Hit_Chest', 'Death01', 'Driving_Loop', 'Roll', 'Interact',
  'Jump_Start', 'Jump_Loop', 'Jump_Land', 'Sitting_Idle_Loop', 'Dance_Loop', 'Idle_Talking_Loop'];

// resize every texture: base colour -> JPEG (size), normal -> JPEG (nsize); drop ORM/roughness (materials get a flat roughness)
async function shrinkTextures(doc, size, nsize, gray) {
  for (const mat of doc.getRoot().listMaterials()) {
    for (const [get, set] of [['getMetallicRoughnessTexture', 'setMetallicRoughnessTexture'], ['getOcclusionTexture', 'setOcclusionTexture']]) {
      if (mat[get]()) mat[set](null);
    }
    mat.setMetallicFactor(0).setRoughnessFactor(0.85);
  }
  for (const tex of doc.getRoot().listTextures()) {
    const isN = doc.getRoot().listMaterials().some(m => m.getNormalTexture() === tex);
    const img = tex.getImage(); if (!img) continue;
    const s = isN ? nsize : size;
    let sh = sharp(Buffer.from(img)).resize(s, s, { fit: 'inside' });
    if (!isN && gray) sh = sh.grayscale().linear(1.35, 18);
    const out = await sh.flatten({ background: isN ? '#8080ff' : '#808080' }).jpeg({ quality: isN ? 88 : 82 }).toBuffer();
    tex.setImage(new Uint8Array(out)).setMimeType('image/jpeg').setURI('');
  }
  await doc.transform(prune());
}

// keep only the head of the base body: triangles whose 3 vertices are mostly weighted to Head/neck_01
function cutHead(doc) {
  const root = doc.getRoot();
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const J = prim.getAttribute('JOINTS_0'), W = prim.getAttribute('WEIGHTS_0'), I = prim.getIndices();
      if (!J || !W || !I) continue;
      const skin = root.listNodes().find(n => n.getSkin())?.getSkin();
      const joints = skin.listJoints().map(j => j.getName());
      const head = new Set(['Head', 'neck_01'].map(n => joints.indexOf(n)).filter(i => i >= 0));
      const isHead = v => { const j = J.getElement(v, []), w = W.getElement(v, []); let s = 0; for (let k = 0; k < 4; k++) if (head.has(j[k])) s += w[k]; return s > 0.5; };
      const keep = [];
      for (let t = 0; t < I.getCount(); t += 3) { const a = I.getScalar(t), b = I.getScalar(t + 1), c = I.getScalar(t + 2); if (isHead(a) && isHead(b) && isHead(c)) keep.push(a, b, c); }
      if (prim.getAttribute('POSITION').getCount() > 3000) { // the body mesh (eyes/brows are small and stay whole)
        I.setArray(new Uint32Array(keep));
        console.log('  head cut:', mesh.getName(), I.getCount() / 3, 'tris kept');
      }
    }
  }
}

async function packChar(src, out, opts) {
  const doc = await io.read(src);
  const root = doc.getRoot();
  if (opts.head) cutHead(doc);
  if (opts.keep) for (const node of root.listNodes()) { const m = node.getMesh(); if (m && !opts.keep.some(k => m.getName().includes(k))) node.setMesh(null); }
  for (const a of root.listAnimations()) a.dispose();
  // Quaternius stores recolour masks in COLOR_n; three.js would multiply them onto the texture
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) for (const s of p.listSemantics()) if (s.startsWith('COLOR_')) p.setAttribute(s, null);
  await doc.transform(weld(), dedup());
  await shrinkTextures(doc, opts.size || 1024, opts.nsize || 512, opts.gray);
  await doc.transform(quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeWeight: 8 }));
  await io.write(OUT + out, doc);
  console.log(out, fs.statSync(OUT + out).size);
}

async function packAnims() {
  const doc = await io.read(UAL);
  const root = doc.getRoot();
  for (const a of root.listAnimations()) if (!CLIPS.includes(a.getName())) a.dispose();
  for (const n of root.listNodes()) { if (n.getMesh()) n.setMesh(null); if (n.getSkin()) n.setSkin(null); }
  for (const m of root.listMeshes()) m.dispose();
  for (const s of root.listSkins()) s.dispose();
  await doc.transform(resample({ tolerance: 1e-3 }), prune({ keepLeaves: true }), dedup());
  // drop scale tracks (all 1) and keep translation only on root/pelvis
  for (const a of root.listAnimations()) for (const ch of a.listChannels()) {
    const p = ch.getTargetPath(), nm = ch.getTargetNode()?.getName();
    if (p === 'scale' || (p === 'translation' && !['pelvis', 'root'].includes(nm))) { const s = ch.getSampler(); ch.dispose(); if (s && !s.listParents().some(x => x.propertyType === 'AnimationChannel')) s.dispose(); }
  }
  await doc.transform(prune({ keepLeaves: true }), quantize({ quantizeWeight: 8 }));
  console.log('clips:', root.listAnimations().map(a => a.getName()).join(','));
  await io.write(OUT + 'anims.glb', doc);
  console.log('anims.glb', fs.statSync(OUT + 'anims.glb').size);
}

await packAnims();
await packChar(UBC + 'Superhero_Male_FullBody.gltf', 'm_head.glb', { head: true, size: 1024, nsize: 512 });
await packChar(UBC + 'Superhero_Female_FullBody.gltf', 'f_head.glb', { head: true, size: 1024, nsize: 512 });
await packChar(OUT_SRC + 'Male_Ranger.gltf', 'm_ranger.glb', {});
await packChar(OUT_SRC + 'Male_Peasant.gltf', 'm_peasant.glb', {});
await packChar(OUT_SRC + 'Female_Ranger.gltf', 'f_ranger.glb', {});
await packChar(OUT_SRC + 'Female_Peasant.gltf', 'f_peasant.glb', {});

const HAIR = '/w/ubc/Universal Base Characters[Standard]/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/';
for (const h of ['Buzzed', 'BuzzedFemale', 'Long', 'Buns', 'SimpleParted', 'Beard']) await packChar(HAIR + 'Hair_' + h + '.gltf', 'hair_' + h.toLowerCase() + '.glb', { size: 512, nsize: 256, gray: true });
