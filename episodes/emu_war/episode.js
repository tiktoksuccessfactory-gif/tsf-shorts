// TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
// THE GREAT EMU WAR (1932) - example episode. Narration: SCRIPT.txt. Times come from words.json.
// Every cue below is tied to a phrase of the voice-over, with a backup time in case the phrase is not found.
import * as THREE from 'three';
import { ground, road, house, tree, fence, water, clouds, crate, toon, mesh, TEX } from '../../engine/world.js';
import * as K from '../../engine/kit.js';
import { Actor } from '../../engine/actor.js';
import { CAST, outfit, SKINS } from '../../engine/chars.js';
import { ANIMALS } from '../../engine/animals.js';
import { puff, dust, sparkle, smoke, fall } from '../../engine/fx.js';
import { keys, creep, shake, prog, lerp, easeOut, smoother } from '../../engine/film.js';

export function build({ stage, words }) {
  const T = (phrase, backup) => words.phrase(phrase, 0, backup); // start time of a phrase in the voice-over
  const END = Math.max(words.last, 67.5) + 1.0;

  // ---------------------------------------------------------------- sets
  // FARM (around x = 0): dry grass, golden wheat, a farmhouse, a fence, gum trees, a dam
  ground(stage, { tex: 'grass', color: '#ead690' });
  K.field(stage, { x: 0, z: -45, w: 160, d: 70, crop: '#dcb75c', soil: '#b48a52' });
  road(stage, { x: 0, z: 4, w: 4.5, len: 400, rot: Math.PI / 2, tex: 'sand', line: false, curb: false });
  house(stage, { x: -17, z: -4, w: 8, d: 6, h: 5, wall: '#efe3c8', roof: '#9aa3ad', floors: 1, cols: 3, shutters: '#3f6f8f', chimney: true, seed: 4 });
  fence(stage, { x: -18, z: -9, len: 34 }); fence(stage, { x: 22, z: -9, len: 26 });
  const fenceT = fence(stage, { x: 4, z: -9, len: 9 });           // this piece gets trampled
  for (const [x, z, s] of [[-26, -3, 1.4], [-9, -12, 1.1], [14, 6, 1.3], [26, -12, 1.2], [-32, 8, 1.5], [48, -6, 1.3]]) tree(stage, { x, z, s, col: '#7f9f6a', trunk: '#d8ccb6', seed: x });
  K.hills(stage, { z: -190, col: '#c9a86a' }); clouds(stage, { n: 9 });
  // the dam
  const sandRing = mesh(new THREE.CircleGeometry(11, 32), toon('#ffffff', (() => { const t = TEX.sand(); t.repeat.set(4, 4); return t; })()), { cast: false }); sandRing.rotation.x = -Math.PI / 2; sandRing.position.set(40, 0.02, -16); stage.add(sandRing);
  const pond = mesh(new THREE.CircleGeometry(8, 32), toon('#ffffff', (() => { const t = TEX.water(); t.repeat.set(3, 3); return t; })()), { cast: false }); pond.rotation.x = -Math.PI / 2; pond.position.set(40, 0.04, -16); stage.add(pond);
  for (const [x, z, s] of [[36, -3, 2.2], [38.5, -3.6, 1.6], [33.5, -4.2, 1.8]]) K.rock(stage, { x, z, s, col: '#a89878', seed: x });
  // army camp (end): tent + flag
  K.tent(stage, { x: -41, z: 0, rot: 0.3, col: '#9aa66a' }); K.flagpole(stage, { x: -36, z: 0, h: 6, col: '#2f4f8f' });
  const weed = mesh(new THREE.IcosahedronGeometry(0.45, 1), new THREE.MeshToonMaterial({ color: '#a8875a', wireframe: true })); stage.add(weed);

  // HQ OFFICE (x = 300)
  K.room(stage, { x: 300, z: 0, w: 8, d: 7, wall: '#d8d2bd', stripe: '#cfc8b0', windowAt: 0.25 });
  K.table(stage, { x: 300.4, z: -1.6, w: 1.8, d: 0.9, col: '#7a5230' });
  K.board(stage, { x: 301.6, y: 2.0, z: -3.45, w: 2.2, h: 1.1, text: 'EMU\nPROBLEM' });
  K.shelf(stage, { x: 297.6, z: -3.2, w: 1.4 }); K.picture(stage, { x: 298.6, y: 2.1, z: -3.47, col: '#2f4f8f' });

  // ROAD for the chase (x = -300): long dirt road along z between wheat
  road(stage, { x: -300, z: 0, w: 5, len: 600, tex: 'sand', line: false, curb: false });
  K.field(stage, { x: -316, z: 0, w: 26, d: 600, crop: '#dcb75c', soil: '#b48a52' }); K.field(stage, { x: -284, z: 0, w: 26, d: 600, crop: '#dcb75c', soil: '#b48a52' });
  const truck = K.flatbed(stage, { x: -300, z: 0, rot: Math.PI });

  // props at the farm
  const gun1 = K.machineGun(stage, { x: 0, z: 0, rot: Math.PI }), gun2 = K.machineGun(stage, { x: 0, z: 0, rot: Math.PI });
  const gunT = K.machineGun(stage, { x: 0, z: -2.2, rot: Math.PI, s: 0.9 }); truck.add(gunT); gunT.position.set(0, 1.06, -1.6); gunT.rotation.y = 0;
  const crates = [0, 1, 2, 3, 4].map((i) => crate(stage, { x: 0, z: 0, s: 0.6 }));

  // ---------------------------------------------------------------- cast
  const army = { shirt: '#7a7f4a', pants: '#5a5e38', hat: 'slouch', hatCol: '#8a7a52', shoes: '#3b2a20' };
  const MAJ = stage.add(new Actor(outfit({ ...army, mustache: '#3b2a20', badge: '#f2c230', skin: SKINS[0] }), { seed: 3 }));
  const S1 = stage.add(new Actor(outfit({ ...army, skin: SKINS[2] }), { seed: 5 }));
  const S2 = stage.add(new Actor(outfit({ ...army, skin: SKINS[1], build: 'tall' }), { seed: 7 }));
  const FARMER = stage.add(new Actor(CAST.farmer, { seed: 9 }));
  const EMU = stage.add(new Actor(ANIMALS.emu, { seed: 2, scale: 1.4 }));
  const flock = Array.from({ length: 34 }, (_, i) => stage.add(new Actor(ANIMALS.emu, { seed: 1 + (i % 3), scale: 1.3 + (i % 5) * 0.04 })));
  const R = (i, k = 1) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); }; // stable random per emu

  // everyone off stage by default; each shot places who it needs
  const reset = () => {
    for (const a of [MAJ, S1, S2, FARMER, EMU, ...flock]) { a.g.visible = false; a.set({ pose: 'idle', expr: 'neutral', walk: null, flip: false, hop: 0, lean: 0, squash: 0, talk: false, hold: null, bubble: null }); }
    for (const g of [gun1, gun2, ...crates]) { g.visible = false; g.scale.setScalar(1); }
    truck.visible = false; weed.visible = false; fenceT.rotation.x = 0;
  };
  const show = (a, x, z, o = {}) => { a.g.visible = true; a.at(x, 0, z).set(o); return a; };
  // a flock spread over an area: n emus, centre (x, z), size (w, d), with options per emu
  const herd = (n, x, z, w, d, o = {}) => { for (let i = 0; i < n; i++) show(flock[i], x + (R(i) - 0.5) * w, z + (R(i, 2) - 0.5) * d, { flip: R(i, 3) < 0.5, ...(typeof o === 'function' ? o(i) : o) }); };

  // ---------------------------------------------------------------- times (phrase, backup)
  const t = {
    lost: T('And lost', 3.64), after: T('After World War', 4.71), western: T('Western Australia', 8.3), then: T('Then', 9.82), ate: T('They ate the crops', 12.08),
    trampled: T('They trampled', 13.55), asked: T('So the farmers asked', 15.28), armyHelp: T('army for help', 16.6), sent: T('The army sent', 18.16), meredith: T('Major Meredith', 18.9),
    soldiers: T('Two soldiers', 20.15), guns: T('Two machine guns', 21.19), day1: T('Day one', 24.4), ran: T('ran out of range', 25.9),
    day3: T('Day three', 27.48), walked: T('walked up to a water dam', 29.1), ambush: T('Perfect ambush', 31.17), fired: T('The gun fired', 32.3), twelve: T('got twelve birds', 33.2),
    jammed: T('and jammed', 34.4), creative: T('So Meredith got creative', 35.58), strapped: T('He strapped', 37.31), faster: T('But the emus were faster', 39.9), bumpy: T('And the ground was so bumpy', 42.62),
    single: T('a single shot', 45.6), six: T('After six days', 47.24), back: T('Then came back', 49.79), december: T('By December', 51.0), ten: T('Ten bullets for every emu', 54.72),
    said: T('Meredith said', 56.79), capacity: T('capacity of these birds', 59.6), still: T('The emus are still there', 64.64), not: T('The army is not', 66.45),
  };
  t.bullets = words.phrase('bullets', 0, 23.2) - 0.9; // "And 10,000 bullets": start of "And"
  const fireT = [t.fired + 0.25, t.fired + 0.55, t.fired + 0.85];

  // effects placed in the world at their moments
  dust(stage, { at: [4, 0.3, -8.5], t0: t.trampled + 0.45, n: 16 });
  for (const f of fireT) { sparkle(stage, { at: [33.9, 0.95, -6.9], t0: f, n: 6, spread: 0.3, size: 0.35, life: 0.25, stagger: 0.25 }); }
  smoke(stage, { at: [33.9, 1.0, -6.6], t0: t.jammed - 0.05, n: 8, size: 0.5, life: 1.6, stagger: 0.6, color: '#8a8e96' });
  puff(stage, { at: [40, 0.8, -14], t0: t.twelve, n: 14, color: '#6b5a4a', size: 0.4, spread: 6 });
  for (let k = 0; k < 7; k++) dust(stage, { at: [-300 + (k % 2 ? 0.8 : -0.8), 0.3, -20 - k * 9], t0: t.faster + k * 0.32, n: 8, size: 0.6, color: '#d8c49a' });
  fall(stage, { at: [300.4, 3.3, -1.6], t0: t.december + 0.2, color: '#d8a840', n: 40, area: [3, 1, 2], stagger: 3, size: 0.18, life: 1.4 });

  // ---------------------------------------------------------------- shots
  const S = [];
  const shot = (from, light, cam, update, extra = {}) => S.push({ from, light, cam, update: (tt, c) => { reset(); update(tt, c); }, ...extra });

  // 1. "In 1932, Australia declared war on a bird."
  shot(0, 'day', creep(() => ({ pos: [0.1, 1.05, 11.4], look: [0.05, 1.2, 5.4], fov: 40 }), 0, 0.02), (tt) => {
    show(MAJ, -0.75, 6, { pose: tt > 1.4 ? 'point' : 'hips', expr: tt > 1.4 ? 'angry' : 'determined' });
    show(EMU, 0.85, 5, { flip: true, expr: 'neutral', bubble: { kind: '?', t0: 2.4 } });
  }, { dof: () => ({ target: [0, 1.3, 5.5], cInf: 6 }) });
  // 2. "And lost."
  shot(t.lost, 'day', creep(() => ({ pos: [2.2, 1.55, 9.6], look: [0.6, 1.45, 4.6], fov: 36 }), t.lost, 0.03), () => {
    show(EMU, 0.85, 5, { flip: true, expr: 'happy' }); show(MAJ, -1.6, 1.2, { pose: 'idle', expr: 'sad', bubble: '...' });
  }, { dof: () => ({ target: [0.85, 1.6, 5], cInf: 12 }) });
  // 3. "After World War One, veterans were given land to farm wheat in Western Australia."
  shot(t.after, 'day', keys([{ t: t.after, pos: [-6, 14, 26], look: [-6, 2, -10], fov: 46 }, { t: t.then, pos: [-9, 2.4, 9.5], look: [-14, 1.6, -2], fov: 42 }]), () => {
    show(FARMER, -12.5, 2.5, { pose: 'wave', expr: 'grin' }); show(S1, -11, 1.6, { pose: 'idle', expr: 'smile', hold: 'hammer', flip: true });
  });
  // 4. "Then 20,000 emus showed up."
  shot(t.then, 'day', creep(() => ({ pos: [2, 1.5, -10.6], look: [2, 1.9, -24], fov: 44 }), t.then, 0.02), (tt) => {
    herd(34, 2, -24 + prog(tt, t.then, 2) * 3, 14, 18, { walk: { speed: 1.6 } });
  });
  // 5. "They ate the crops."
  shot(t.ate, 'day', creep(() => ({ pos: [4.6, 1.2, -13.4], look: [4.2, 0.9, -19.5], fov: 40 }), t.ate, 0.03), (tt) => {
    for (let i = 0; i < 5; i++) show(flock[i], 2.2 + i * 1.0 - (i % 2) * 0.4, -18.6 - (i % 3) * 1.3, { pose: Math.floor((tt + i * 0.37) * 3) % 2 ? 'down' : 'idle', expr: 'happy', flip: i % 2 === 0 });
  }, { dof: () => ({ target: [4.2, 0.9, -19.5], cInf: 7 }) });
  // 6. "They trampled the fences."
  shot(t.trampled, 'day', () => ({ pos: [9.5, 1.3, -1.5], look: [5, 1.0, -9], fov: 44 }), (tt) => {
    const u = prog(tt, t.trampled, 1.3);
    for (let i = 0; i < 4; i++) show(flock[i], 3 + i * 0.9, lerp(-15, -2, u) - i * 0.6, { walk: { speed: 3, run: true }, expr: 'angry', flip: false });
    fenceT.rotation.x = smoother(prog(tt, t.trampled + 0.35, 0.3)) * 1.45;
  }, { shake: shake([t.trampled + 0.45], 0.05) });
  // 7. "So the farmers asked the army for help."
  shot(t.asked, 'day', creep(() => ({ pos: [-14.9, 1.6, 6.4], look: [-15.15, 1.55, 2.6], fov: 40 }), t.asked, 0.04), () => {
    show(FARMER, -15.6, 2.5, { pose: 'idle', hold: 'phone', talk: true, expr: 'worried', bubble: { text: 'HELP!', t0: t.asked + 0.3 } });
  }, { dof: () => ({ target: [-15.6, 1.5, 2.5], cInf: 10 }) });
  shot(t.armyHelp, 'indoor', creep(() => ({ pos: [300.3, 1.55, 2.6], look: [300.3, 1.35, -2.2], fov: 40 }), t.armyHelp, 0.03), () => {
    show(MAJ, 300.3, -2.2, { pose: 'idle', hold: 'paper', expr: 'shock', bubble: { kind: '!', t0: t.armyHelp + 0.15 } });
  }, { dof: () => ({ target: [300.3, 1.4, -2.2], cInf: 9 }) });
  // 8. "The army sent Major Meredith."  9. "Two soldiers."  10. "Two machine guns."  11. "And 10,000 bullets."
  const lineup = (tt) => {
    show(MAJ, 0, 3, { pose: tt > t.meredith ? 'hips' : 'idle', expr: 'determined' });
    const pop = (t0) => (tt < t0 ? 0 : tt < t0 + 0.15 ? 0.25 * Math.sin(((tt - t0) / 0.15) * Math.PI) : 0);
    if (tt > t.soldiers + 0.15) show(S1, -0.95, 2.4, { pose: 'idle', expr: 'determined', hop: pop(t.soldiers + 0.15), flip: false });
    if (tt > t.soldiers + 0.45) show(S2, 0.95, 2.4, { pose: 'idle', expr: 'determined', hop: pop(t.soldiers + 0.45), flip: true });
    [[gun1, -0.7, t.guns + 0.15], [gun2, 0.7, t.guns + 0.45]].forEach(([g, x, t0]) => { if (tt > t0) { g.visible = true; g.position.set(x, 0, 4.6); g.rotation.y = 0; g.scale.setScalar(Math.min(1, easeOut((tt - t0) / 0.18) * 1.1)); } });
    crates.forEach((c, i) => { const t0 = t.bullets + 0.2 + i * 0.12; if (tt > t0) { c.visible = true; c.scale.setScalar(0.7); c.position.set(1.15 + (i % 3) * 0.44, 0.21 + Math.floor(i / 3) * 0.42 + Math.max(0, 1.2 - (tt - t0) * 6), 4.9); } });
  };
  shot(t.sent, 'day', keys([{ t: t.sent, pos: [0.3, 0.55, 6.4], look: [0, 1.65, 3], fov: 44 }, { t: t.soldiers, pos: [0.2, 0.8, 7.9], look: [0, 1.45, 3], fov: 44 }]), lineup, { dof: () => ({ target: [0, 1.4, 3], cInf: 5 }) });
  shot(t.guns, 'day', () => ({ pos: [0, 1.4, 9.6], look: [0, 1.0, 3.6], fov: 46 }), lineup);
  // 12. "Day one: the emus simply ran out of range."
  shot(t.day1, 'day', () => ({ pos: [-3.2, 1.3, 9], look: [3, 1.0, -14], fov: 42 }), (tt) => {
    show(S1, -1.3, 4.6, { pose: 'idle', expr: tt > t.ran ? 'shock' : 'determined', bubble: tt > t.ran + 0.4 ? { kind: '?', t0: t.ran + 0.4 } : null });
    gun1.visible = true; gun1.position.set(-0.4, 0, 4); gun1.rotation.y = Math.PI + 0.25;
    herd(10, 4, lerp(-10, -40, easeOut(prog(tt, t.ran - 0.2, 1.8))), 10, 6, (i) => ({ walk: tt > t.ran - 0.2 ? { speed: 3.2, run: true } : null, expr: 'happy', flip: false }));
  });
  // 13. "Day three: a thousand emus walked up to a water dam."
  shot(t.day3, 'golden', keys([{ t: t.day3, pos: [41, 13, 14], look: [40, 0.5, -12], fov: 50 }, { t: t.ambush, pos: [40.5, 3.6, 8.5], look: [40, 1.0, -8], fov: 48 }]), (tt) => {
    for (let i = 0; i < 30; i++) { const a = Math.PI * (0.08 + 0.84 * ((i * 0.618) % 1)), rr = 8.7 + (i % 3) * 1.3 + R(i) * 0.6;
      show(flock[i], 40 + Math.cos(a) * rr, -16 + Math.sin(a) * rr, { pose: Math.floor(tt * 2 + i) % 3 ? 'down' : 'idle', expr: 'happy', flip: Math.cos(a) > 0 }); }
  });
  // 14. "Perfect ambush."
  shot(t.ambush, 'golden', creep(() => ({ pos: [35.6, 1.35, 1.6], look: [35.4, 1.2, -2.6], fov: 40 }), t.ambush, 0.04), () => {
    show(MAJ, 35.2, -1.8, { pose: 'idle', expr: 'smug', bubble: { kind: '$', t0: t.ambush + 0.2 } }); show(S1, 36.4, -2.3, { expr: 'grin', flip: true });
  }, { dof: () => ({ target: [35.4, 1.4, -1.8], cInf: 10 }) });
  // 15. "The gun fired, got twelve birds, and jammed."
  shot(t.fired, 'golden', creep(() => ({ pos: [30.6, 1.25, -5.4], look: [34.0, 0.95, -7.0], fov: 40 }), t.fired, 0.03), (tt) => {
    gun1.visible = true; gun1.position.set(33.9, 0, -6.2); gun1.rotation.y = Math.PI; show(S1, 34.9, -5.8, { expr: 'determined', pose: 'point', flip: true });
  }, { shake: shake(fireT, 0.04), dof: () => ({ target: [34, 1, -6.4], cInf: 8 }) });
  shot(t.twelve, 'golden', () => ({ pos: [33, 4, -2], look: [40, 0.6, -16], fov: 48 }), (tt) => {
    herd(30, 40, -16, 26, 18, (i) => ({ walk: { speed: 3.4, run: true }, pose: 'scared', expr: 'shock', bubble: i % 6 === 0 ? { kind: '!', t0: t.twelve + R(i) * 0.3 } : null }));
    for (let i = 0; i < 30; i++) { const e = flock[i]; const dx = e.g.position.x - 40, dz = e.g.position.z + 16, d = Math.hypot(dx, dz) || 1; const k = 8.8 + (tt - t.twelve) * 9; e.at(40 + (dx / d) * k, 0, -16 + (dz / d) * k).set({ flip: dx < 0 }); }
  });
  shot(t.jammed, 'golden', () => ({ pos: [31.4, 1.5, -4.9], look: [33.6, 1.2, -6.1], fov: 38 }), () => {
    gun1.visible = true; gun1.position.set(33.9, 0, -6.2); gun1.rotation.y = Math.PI; show(S1, 33.3, -5.8, { expr: 'shock', pose: 'shrug', bubble: { kind: '?', t0: t.jammed + 0.25 } });
  }, { dof: () => ({ target: [33.4, 1.4, -5.8], cInf: 10 }) });
  // 16. "So Meredith got creative."
  shot(t.creative, 'day', creep(() => ({ pos: [0.2, 1.55, 6.4], look: [0, 1.45, 3], fov: 38 }), t.creative, 0.05), () => {
    show(MAJ, 0, 3, { pose: 'think', expr: 'smug', bubble: { kind: 'idea', t0: t.creative + 0.6 } });
  }, { dof: () => ({ target: [0, 1.5, 3], cInf: 9 }) });
  // 17. "He strapped a machine gun to a truck."
  shot(t.strapped, 'day', keys([{ t: t.strapped, pos: [-295, 2.2, -8], look: [-300, 1.6, 0], fov: 46 }, { t: t.faster, pos: [-294, 1.7, -6], look: [-300, 1.8, 0.5], fov: 44 }]), () => {
    truck.visible = true; truck.position.set(-300, 0, 0); show(S2, -300, 2.4, { pose: 'cheer', expr: 'grin', flip: true }); S2.g.position.y = 1.06;
  });
  // 18. "But the emus were faster than the truck."
  shot(t.faster, 'day', (tt) => { const z = -(tt - t.faster) * 7; return { pos: [-293.4, 2.1, z + 4.5], look: [-300, 1.3, z - 7], fov: 46 }; }, (tt) => {
    const z = -(tt - t.faster) * 7; truck.visible = true; truck.position.set(-300, 0, z); truck.rotation.y = Math.PI;
    show(S2, -300, z + 2.4, { pose: 'scared', expr: 'worried' }); S2.g.position.y = 1.06;
    for (let i = 0; i < 6; i++) show(flock[i], -300 + (i - 2.5) * 0.9, z - 9 - (tt - t.faster) * 2.5 - (i % 3) * 1.4, { walk: { speed: 3.4, run: true }, expr: 'happy', flip: false });
  });
  // 19. "And the ground was so bumpy, the gunner couldn't fire a single shot."
  shot(t.bumpy, 'day', (tt) => { const z = -(tt - t.faster) * 7; return { pos: [-297.6, 2.7, z + 0.6], look: [-300, 2.2, z + 2.8], fov: 40 }; }, (tt) => {
    const z = -(tt - t.faster) * 7, b = Math.abs(Math.sin(tt * 11)) * 0.16; truck.visible = true; truck.position.set(-300, b * 0.5, z); truck.rotation.y = Math.PI; truck.rotation.z = Math.sin(tt * 9) * 0.04;
    show(S2, -300, z + 2.4, { pose: tt > t.single ? 'shrug' : 'scared', expr: 'worried', hop: b * 2.2, lean: Math.sin(tt * 9) * 0.12, bubble: 'sweat' }); S2.g.position.y = 1.06;
  }, { shake: (tt) => Math.sin(tt * 37) * 0.025 });
  // 20. "After six days, the army pulled out."  21. "Then came back."
  shot(t.six, 'golden', () => ({ pos: [-298, 1.4, 8], look: [-300, 1.2, -6], fov: 44 }), (tt) => {
    const out = easeOut(prog(tt, t.six + 0.3, 2.2)) * 40, back = tt > t.back ? easeOut(prog(tt, t.back + 0.1, 0.6)) * 40 : 0;
    truck.visible = true; truck.position.set(-300, 0, -6 - out + back); truck.rotation.y = Math.PI;
    for (let i = 0; i < 3; i++) show(flock[i], -301.6 + i * 1.6, 2.5 + (i % 2) * 0.6, { expr: tt > t.back + 0.4 ? 'shock' : 'happy', flip: i === 2, bubble: tt > t.back + 0.4 && i === 1 ? { kind: '!?', t0: t.back + 0.45 } : null });
  });
  // 22. "By December, they had fired 9,860 bullets."
  shot(t.december, 'indoor', creep(() => ({ pos: [300.2, 1.6, 3.2], look: [300.45, 1.15, -1.6], fov: 42 }), t.december, 0.03), (tt) => {
    show(MAJ, 300.7, -2.2, { pose: 'shrug', expr: 'worried', flip: true });
  });
  // 23. "Ten bullets for every emu."
  shot(t.ten, 'day', creep(() => ({ pos: [1.6, 1.5, 9.4], look: [0.85, 1.4, 5], fov: 36 }), t.ten, 0.04), () => {
    show(EMU, 0.85, 5, { flip: true, expr: 'happy', bubble: { kind: 'note', t0: t.ten + 0.2 } });
  }, { dof: () => ({ target: [0.85, 1.6, 5], cInf: 12 }) });
  // 24. "Meredith said: if we had a division with the bullet-carrying capacity of these birds..."
  shot(t.said, 'indoor', creep(() => ({ pos: [300.0, 1.55, 1.8], look: [300.3, 1.4, -2.2], fov: 38 }), t.said, 0.03), () => {
    show(MAJ, 300.3, -2.2, { pose: 'present', expr: 'determined', talk: true });
  }, { dof: () => ({ target: [300.3, 1.4, -2.2], cInf: 9 }) });
  shot(t.capacity, 'golden', keys([{ t: t.capacity, pos: [2, 0.35, 10], look: [0, 2.2, -4], fov: 44 }, { t: t.still, pos: [1, 0.45, 8], look: [0, 2.2, -4], fov: 42 }]), (tt) => {
    for (let i = 0; i < 24; i++) show(flock[i], (i % 6 - 2.5) * 1.5, -2 - Math.floor(i / 6) * 2.2 + (tt - t.capacity) * 0.9, { walk: { speed: 1.4 }, expr: 'angry', flip: false });
  });
  // 25. "The emus are still there."
  shot(t.still, 'golden', creep(() => ({ pos: [6, 1.1, 14], look: [4, 2.2, -6], fov: 40 }), t.still, 0.02), () => {
    for (let i = 0; i < 6; i++) show(flock[i], 1 + i * 1.4, -7.5 - (i % 2) * 1.6, { expr: 'happy', flip: i % 2 === 1, pose: i === 3 ? 'down' : 'idle' });
  });
  // 26. "The army is not."
  shot(t.not, 'golden', () => ({ pos: [-31, 1.3, 15], look: [-38, 1.7, 2], fov: 44 }), (tt) => {
    weed.visible = true; const u = (tt - t.not) * 2.4; weed.position.set(-31.5 - u, 0.45, 8); weed.rotation.z = u / 0.45;
  });

  return {
    duration: END,
    shots: S,
    flashes: [t.sent, t.day1, t.day3],
    hud: [
      { from: 0.15, to: t.lost - 0.05, text: '1932', y: 0.13, size: 170 },
      { from: t.western, to: t.then - 0.1, text: 'WESTERN AUSTRALIA', y: 0.16, size: 74, bg: '#ffe066', anim: 'slide' },
      { from: t.then + 0.2, to: t.ate - 0.05, count: [0, 20000], suffix: ' EMUS', y: 0.15, size: 110 },
      { from: t.meredith, to: t.soldiers - 0.05, text: 'MAJOR MEREDITH', y: 0.14, size: 80, bg: '#ffffff' },
      { from: t.bullets + 0.2, to: t.day1 - 0.05, count: [0, 10000], suffix: ' BULLETS', y: 0.15, size: 96, bg: '#ffe066' },
      { from: t.day1, to: t.day1 + 1.4, text: 'DAY 1', y: 0.15, size: 140, anim: 'shake' },
      { from: t.day3, to: t.day3 + 1.5, text: 'DAY 3', y: 0.15, size: 140, anim: 'shake' },
      { from: t.twelve + 0.1, to: t.jammed - 0.05, text: '12', sub: 'out of 1,000', y: 0.16, size: 150 },
      { from: t.december + 0.3, to: t.ten - 0.05, count: [0, 9860], suffix: ' BULLETS', y: 0.15, size: 100, bg: '#ffe066' },
      { from: t.ten + 0.2, to: t.said - 0.05, text: '10 BULLETS\n= 1 EMU', y: 0.15, size: 96, bg: '#ffffff' },
    ],
    audio: {
      music: [{ at: 0, mood: 'quirky' }, { at: t.sent, mood: 'epic' }, { at: t.day1, mood: 'sneaky' }, { at: t.day3, mood: 'tension' }, { at: t.jammed + 0.3, mood: 'stop' },
        { at: t.creative, mood: 'quirky' }, { at: t.faster, mood: 'upbeat' }, { at: t.six, mood: 'sad' }, { at: t.back, mood: 'quirky' }, { at: t.capacity, mood: 'epic' }, { at: t.still, mood: 'sad', gain: 0.8 }],
      sfx: [
        [t.lost + 0.25, 'sadTrombone'], [2.4, 'pop'], [t.then + 0.2, 'riser', { d: 1.4 }], [t.ate + 0.2, 'pop'], [t.ate + 0.55, 'pop'], [t.ate + 0.9, 'pop'],
        [t.trampled + 0.4, 'crash'], [t.asked + 0.3, 'ring', { d: 1.0 }], [t.armyHelp + 0.15, 'bonk'], [t.meredith, 'hit'],
        [t.soldiers + 0.15, 'pop'], [t.soldiers + 0.45, 'pop'], [t.guns + 0.15, 'thud'], [t.guns + 0.45, 'thud'], [t.bullets + 0.2, 'drumroll', { d: 0.9 }],
        [t.ran - 0.1, 'whoosh'], [t.walked, 'footsteps', { d: 1.6, gain: 0.7 }], [t.ambush + 0.2, 'coin'],
        [t.fired + 0.2, 'rattle', { d: 1.0 }], [t.twelve, 'gasp'], [t.jammed + 0.05, 'jam'], [t.creative + 0.6, 'ding'],
        [t.strapped + 0.2, 'engine', { d: 2.2 }], [t.faster, 'whoosh'], [t.faster + 0.3, 'engine', { d: 2.4, gain: 0.8 }],
        [t.bumpy + 0.3, 'boing'], [t.bumpy + 1.2, 'boing'], [t.bumpy + 2.1, 'boing'], [t.single + 0.3, 'wrong'],
        [t.six + 0.3, 'slideDown'], [t.back, 'scratch'], [t.back + 0.1, 'slideUp'], [t.december + 0.3, 'typing', { d: 1.5, gain: 0.5 }], [t.december + 2.0, 'cash'],
        [t.ten + 0.2, 'rimshot'], [t.capacity, 'footsteps', { d: 3, gain: 0.8 }], [t.not + 0.1, 'wind', { d: 2 }],
      ],
    },
    captions: { highlightWords: ['war', 'bird', 'lost', 'emus', 'army', 'jammed', 'truck', 'bumpy', 'December', 'ten', 'not'] },
  };
}
