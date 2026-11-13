// TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
// TEMPLATE: copy this folder to episodes/<name>/ and build the film here. Full example: episodes/emu_war/episode.js
import * as THREE from 'three';
import { ground, road, sidewalk, house, tree, lamp, clouds, toon, mesh } from '../../engine/world.js';
import * as K from '../../engine/kit.js';
import { Actor } from '../../engine/actor.js';
import { CAST, outfit, SKINS } from '../../engine/chars.js';
import { ANIMALS } from '../../engine/animals.js';
import { puff, dust, sparkle } from '../../engine/fx.js';
import { keys, creep, shake, prog, lerp, easeOut } from '../../engine/film.js';

export function build({ stage, words }) {
  const T = (phrase, backup) => words.phrase(phrase, 0, backup);   // when a phrase is said (backup time if not found)
  const END = Math.max(words.last, 8) + 1.0;

  // ---- sets (one location per area, 300 m apart: x = 0, 300, -300 ...)
  ground(stage, { tex: 'grass' }); clouds(stage, { n: 8 });
  road(stage, { z: 0, len: 200, rot: Math.PI / 2 }); sidewalk(stage, { z: -5, len: 200, rot: Math.PI / 2 });
  for (let i = 0; i < 5; i++) house(stage, { x: -18 + i * 9, z: -12, w: 8, d: 6, seed: i + 1 });

  // ---- cast
  const hero = stage.add(new Actor(CAST.scientist, { seed: 1 }));
  const boss = stage.add(new Actor(CAST.boss, { seed: 2 }));
  const reset = () => { for (const a of [hero, boss]) { a.g.visible = false; a.set({ pose: 'idle', expr: 'neutral', walk: null, flip: false, talk: false, hold: null, bubble: null, hop: 0 }); } };
  const show = (a, x, z, o = {}) => { a.g.visible = true; a.at(x, 0, z).set(o); return a; };

  // ---- times
  const t = { second: T('second sentence', 3.0) };

  // ---- shots
  const S = [];
  const shot = (from, light, cam, update, extra = {}) => S.push({ from, light, cam, update: (tt, c) => { reset(); update(tt, c); }, ...extra });
  shot(0, 'day', creep(() => ({ pos: [0.1, 1.15, 9.8], look: [0, 1.2, 3], fov: 40 }), 0, 0.03), () => {
    show(hero, -0.7, 3, { pose: 'wave', expr: 'smile' }); show(boss, 0.8, 3, { pose: 'hips', expr: 'angry', flip: true });
  });
  shot(t.second, 'golden', () => ({ pos: [0.9, 1.65, 6.2], look: [0.8, 1.62, 3], fov: 38 }), () => {
    show(boss, 0.8, 3, { pose: 'shrug', expr: 'shock', bubble: { kind: '!', t0: t.second + 0.2 } });
  }, { dof: () => ({ target: [0.8, 1.45, 3], cInf: 10 }) });

  return {
    duration: END,
    shots: S,
    flashes: [],
    hud: [{ from: 0.2, to: 2.5, text: 'HOOK TEXT', y: 0.14, size: 130 }],
    audio: { music: [{ at: 0, mood: 'quirky' }], sfx: [[t.second + 0.2, 'pop']] },
    captions: { highlightWords: [] },
  };
}
