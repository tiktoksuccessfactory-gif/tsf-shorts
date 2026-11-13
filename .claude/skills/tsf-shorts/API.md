# TSF engine reference

Everything is a pure function of time `t` (seconds): the renderer can jump to any frame, so never keep state between frames. Units are metres; y is up; an adult is 1.75 m tall. The camera looks along -z by default, so build each set facing +z.

## Episode file

`episodes/<name>/episode.js` exports `build({ stage, words, THREE, film })` and returns:

```js
return {
  duration: words.last + 1.0,       // seconds (end a moment after the last word)
  shots: [ /* see Shots */ ],
  flashes: [12.4],                  // white flash cuts at these times (an impact sound is added automatically)
  hud: [ /* see HUD */ ],
  audio: { music: [...], sfx: [...] },
  captions: { highlightWords: ['war', 'lost'] },
};
```

Imports (paths are relative to the episode folder):

```js
import * as THREE from 'three';
import { ground, road, sidewalk, house, tree, lamp, bench, fence, crate, barrel, water, sign, clouds, toon, unlit, mesh, canvasTex, TEX } from '../../engine/world.js';
import * as K from '../../engine/kit.js';                     // rooms, furniture, city, transport, nature, landmarks, crowds
import { Actor } from '../../engine/actor.js';
import { CAST, outfit, SKINS } from '../../engine/chars.js';
import { ANIMALS, animal, WHALE } from '../../engine/animals.js';
import { puff, dust, smoke, confetti, sparkle, splash, fall } from '../../engine/fx.js';
import { keys, creep, shake, prog, lerp, easeOut, easeIn, smoother } from '../../engine/film.js';
```

## Words (timing)

`words` is built from `words.json`:

| call | returns |
|---|---|
| `words.phrase('they trampled the', 0, 13.5)` | start of that run of words (n-th occurrence), else the backup 13.5 |
| `words.at('emu', 2, 40)` | start of the 3rd time the single word is said |
| `words.i(37)` / `words.ie(37)` | start / end of word number 37 (numbers are in transcript.txt) |
| `words.last` | end of the last word |

Matching ignores case and punctuation. Whisper writes numbers as digits ("1932", "20,000"), so anchor on words next to numbers. Missing phrases are listed in the render log; the backup time is used.

Typical helper: `const T = (p, backup) => words.phrase(p, 0, backup);`

## Shots

```js
{ from: 12.1,                     // start time; the shot runs until the next one starts
  light: 'day',                   // day | golden | night | storm | indoor
  cam: (t) => ({ pos: [x, y, z], look: [x, y, z], fov: 40, roll: 0 }),
  update: (t, cam) => { ... },    // place and pose everything for this moment
  dof: (t) => ({ target: [x, y, z], cInf: 8 }),   // optional lens blur, focus on target; cInf 0 = off, 6-14 typical
  shake: (t) => offset,           // optional, e.g. shake([13.95, 14.2], 0.05)
  fadeIn: 0.3,                    // optional crossfade from the previous shot (s)
  exposure: 1.1 }                 // optional brightness multiplier
```

Camera helpers:
- `keys([{ t, pos, look, fov, roll }, ...])` glides between keyframes (smooth).
- `creep(camFn, t0, rate = 0.06)` slow push in toward `look` (every held shot should creep 0.02-0.05).
- `shake(times, amp = 0.05)` short impact shakes.
- `prog(t, t0, dur)` 0..1 progress, `lerp(a, b, u)`, `easeOut(u)`, `easeIn(u)`, `smoother(u)`.

Pattern used in the example: a `reset()` hides everyone each frame, every shot's `update` shows and poses only who it needs (`show(actor, x, z, state)`).

### Framing (fov 40, 9:16)

Visible height = 0.73 x distance, visible width = 0.41 x distance.

| shot | camera distance | look at y (adult) |
|---|---|---|
| wide (place + people) | 8-15 m | 1.0-2.0 |
| full body, two people <= 1.6 m apart | 5-6 m | 1.0-1.2 |
| medium (waist up) | 2.6-3.2 m | 1.35 |
| close-up (head and shoulders) | 1.6-2.0 m | 1.45 |
| hero (low angle) | 4-6 m, camera y 0.4-0.7 | 1.5-1.7 |

Head centre heights: adult 1.42 m (top of head 1.71), big build 1.50, kid 1.03 (top 1.28). Emu at scale 1.4: head about 1.65 m.

## Lights

`day` (sun high, blue sky), `golden` (warm low sun, long shadows), `night` (dark blue, lamps on), `storm` (grey), `indoor` (soft, warm). The sun is always placed relative to the camera, so every shot is lit from the front side. Lamps (`lamp({ on: true })`, `K.floorLamp`) glow and light the scene by preset (night most).

## People

```js
const a = stage.add(new Actor(CAST.scientist, { seed: 3, scale: 1 }));
a.at(x, 0, z).set({ pose: 'point', expr: 'shock', flip: true });
```

State (`set({...})`):

| key | values |
|---|---|
| `pose` | idle, wave, point, arms_up, hips, shrug, think, cheer, scared, present, hold, carry, sit |
| `expr` | neutral, smile, grin, laugh, shock, angry, smug, worried, sad, sleepy, wink, determined, disgust, love |
| `walk` | `{ speed: 1.6 }` (steps per second) or `{ speed: 3, run: true }`; null = stand. Move the actor yourself with `at()` |
| `talk` | true = mouth moves (for lines a character says) |
| `hold` | prop in the right hand: phone, paper, money, mug, wrench, book, clipboard, briefcase, magnifier, sign, bag, umbrella, flashlight, hammer, bottle, flag, balloon, pizza, key, map; or `{ type: 'sign', text: 'HELP', color, bg }`, `{ type: 'mug', color }`. With pose idle the arm switches to `hold` |
| `bubble` | '!', '?', '!?', '...', 'heart', 'anger', 'zzz', 'sweat', 'idea', '$', 'note', or `{ text: 'NOPE.' }`; `{ kind: '!', t0: 12.3 }` pops in at t0 |
| `flip` | true mirrors (faces the other way) |
| `hop`, `lean`, `squash` | metres up / tilt in radians / stretch (0.1 = 10 %) for bounces and impacts |

Cards always turn to the camera; blinking is automatic. Actor fields: `a.g` (THREE group, `a.g.visible`), `a.top` (head top height), `a.headY`.

`CAST`: scientist, worker, boss, cop, chef, kid, woman, farmer, soldier, king, student, grandma.
New people: `outfit({ shirt, pants, shoes, skin: SKINS[0..4], hair, hairStyle, hat, hatCol, tie, glasses, mustache, apron, collar, badge, build })`
- hairStyle: tuft, side, curly, bun, long, bald
- hat: cap, hard, top, chef, police, beanie, crown, bowler, helmet, slouch
- build: adult, kid, big, tall
- crowds: `K.crowd(stage, { x, z, w, d, n, seed, rows, exprs, pose })` returns the actors; `K.extra(seed)` is one random outfit.

## Animals

`new Actor(ANIMALS.dog, { seed, scale })`: dog, cat, rat, cow, pig, horse, emu, chicken, pigeon. Recolour: `animal('dog', { col: '#3b2a20', size: 1.2 })`. `WHALE` lies on the ground (use scale 4-6).
Poses: idle, walk (via `walk`), run, scared, down (head down / eating), sit (dog, cat). Expressions: neutral, happy, shock, angry, sad. They face right; `flip: true` faces left. Bubbles and `talk` work too.

## World builders (engine/world.js)

All take `(stage, { ...options })` and return the object (move it with `.position`, hide with `.visible`).

- `ground({ tex: 'grass'|'sand'|'cobble'|'asphalt'|'planks', color })` big floor; colour tints it (e.g. '#ead690' dry grass).
- `road({ x, z, w, len, rot, tex, line, curb })` (`tex: 'sand', line: false, curb: false` = dirt road), `sidewalk({ x, z, w, len, rot })`
- `house({ x, z, rot, w, d, h, wall, roof, floors, cols, shutters, seed, chimney })`
- `tree({ x, z, s, seed, col, trunk })`, `lamp({ x, z, on })`, `bench`, `fence({ x, z, len, rot, col })`, `crate({ x, z, s, rot })`, `barrel`, `water({ x, z, w, d, y })`
- `sign({ x, y, z, rot, w, h, text, bg, fg })`, `clouds({ n })`
- Materials: `toon(color, map)` (shaded), `unlit(color, map)` (screens, signs); `mesh(geometry, material)`; `canvasTex(w, h, (ctx, W, H) => draw, repeat)` paints a texture.

## Kit (engine/kit.js, use as `K.name(stage, {...})`)

- Rooms: `room({ x, z, rot, w, d, h, wall, stripe, floor: 'planks'|'tiles'|'checker'|'#hex' (carpet), windowAt, door, ceiling })` open toward +z; `table`, `chair`, `desk({ text, bg })` (with a monitor), `screen({ x, y, z, w, h, text, bg, draw })`, `shelf`, `bed`, `sofa`, `tv({ text })`, `fridge`, `counter`, `board({ text, chalk, draw })`, `plant`, `picture({ draw })`, `rug`, `floorLamp`
- City and industry: `tower({ w, d, h, col, lit })`, `skyline({ z, n, lit })`, `tank({ r, h, col, label, legs })`, `factory({ w, d, h, col, chimney })`, `stands({ w, rows })`
- Country: `barn`, `field({ w, d, crop, soil })`, `hills({ z, col })`, `mountains({ z })`, `rock({ s, col })`, `palm`, `tent({ col })`, `flagpole({ h, col, draw })`
- Transport: `car({ col })`, `truck({ col, box, label })`, `flatbed({ col })` (bed floor at y 1.05, add actors on it), `plane({ y, s, military })`, `ship({ len, sails, flag })`, `rocket`
- Landmarks and objects: `bridge({ len, h })`, `leaningTower({ tilt })`, `telescope`, `machineGun` (barrel along +z)
- Textures: `K.TEX2.tiles(), checker(), carpet(col), wall(col, stripe), bricks(col), crops(crop, soil), windows(col, lit)`

## Your own props

Build anything else inside `build()` with three.js and the toon look:

```js
const vat = new THREE.Group();
vat.add(mesh(new THREE.CylinderGeometry(3, 3, 6, 32), toon('#c8b8a0')));
vat.position.set(10, 3, -6); stage.add(vat);              // world objects get ink outlines automatically
// animate in a shot: update: (t) => { vat.rotation.z = Math.sin(t * 9) * 0.05; }
```

## Effects (engine/fx.js)

All are placed in the world at a start time: `puff(stage, { at: [x, y, z], t0: 12.3 })`. Options: `n, color, size, life, spread, stagger, area, seed`.
`puff` (cartoon cloud pop), `dust` (ground dust), `smoke` (rising, long), `confetti`, `sparkle` (stars, also muzzle flash), `splash` (water drops), `fall` (things raining from `at` over `area: [w, h, d]`, e.g. coins `color: '#d8a840'`).

## HUD (flat text over the picture)

```js
hud: [
  { from: 0.2, to: 2.5, text: '1932', y: 0.13, size: 170 },                         // pops in and out
  { from: 9.9, to: 12, count: [0, 20000], suffix: ' EMUS', y: 0.15, size: 110 },     // counts up
  { from: 5, to: 7, text: 'WESTERN AUSTRALIA', bg: '#ffe066', anim: 'slide' },
  { from: 20, to: 22, text: '12', sub: 'out of 1,000', size: 150 },
]
```
Options: `x, y` (0..1 of the frame, y from the top), `size` (px on a 1080 frame), `color, stroke, bg, border, font, sub, anim` ('pop', 'slide', 'fade', 'shake'), `rot`, `type: true` (types out), `prefix, suffix, decimals, countDur`, `wobble`. Keep it inside y 0.08-0.25 so it never covers faces or captions.

## Sound

```js
audio: {
  music: [{ at: 0, mood: 'quirky' }, { at: 18.2, mood: 'epic' }, { at: 34.4, mood: 'stop' }, { at: 35.6, mood: 'quirky', gain: 0.8 }],
  sfx: [[13.9, 'crash'], [20.3, 'pop'], [32.5, 'rattle', { d: 1.0, gain: 0.8, pan: -0.3 }]],
  musicGain: 1, cutSfx: null, flashSfx: 'hit',
}
```
- Moods: quirky (light comedy), sneaky (tiptoe), tension, upbeat (chase, progress), mystery, sad, epic (big moments), stop (silence). Each cue starts on bar 1; music ducks under the voice automatically.
- Effects: whoosh, swish, zoom, riser, drop, hit, thud, boom, punch, slap, crash, glass, pop, boing, slideUp, slideDown, bonk, squeak, sadTrombone, rimshot, drumroll, ding, chime, correct, wrong, magic, zap, glitch, rattle, jam, click, tick, typing, knock, door, footsteps, notify, ring, cash, coin, camera, paper, splash, bubble, gulp, burp, honk, siren, alarm, heartbeat, scratch, crowd, gasp, laugh, cheer, applause, wind, rain, thunder, fire, engine. Options: `d` (length for the long ones), `gain`, `pan` (-1..1).
- The final mix is set to -14 LUFS for TikTok.

## Captions

Made from words.json: one or two words at a time, pop-in, white with a dark outline, at 70 % of the height. Options: `captions: { enabled, highlightWords, highlight, color, size, y, upper, maxWords, maxChars, font }`. Both versions (with and without captions) are always rendered.

## Commands

| command | what it does |
|---|---|
| `python scripts/words.py <name>` | word timings from voice.mp3 |
| `node scripts/stills.mjs <name> --n 24` / `--at 3.2,7.5` | check frames + `out/<name>/stills/sheet.jpg` |
| `node scripts/make.mjs <name> --draft` | quick half-size video |
| `node scripts/make.mjs <name>` | final 1080x1920 video with sound and captions |
| `node scripts/make.mjs <name> --skip-render` | only redo sound and captions (picture unchanged) |
| `node scripts/preview.mjs <name>` | live preview in the browser (voice only until a render made the mix) |

Environment: `TSF_CHROME` = path to a Chrome/Edge exe if it is not found; `TSF_GL=swiftshader` if the graphics card makes trouble (slow but safe).

---
TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
