// Actors: hand-drawn character cards standing in the 3D world.
// A card always turns to face the camera (around the vertical axis), is tinted by the scene light,
// casts a real shadow from its cut-out and has a soft contact blob under the feet.
import * as THREE from 'three';
import { drawCharacter, drawBubble, walkPose, W, H, GROUND } from './chars.js';
import { LAYER_CARD } from './post.js';

const PX = 0.002;               // metres per canvas pixel: adult ~1.75 m tall
const CW = W * PX, CH = H * PX; // card size in metres

let blobTex = null;
function contactBlob() {
  if (!blobTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(10,12,30,0.55)'); g.addColorStop(0.6, 'rgba(10,12,30,0.25)'); g.addColorStop(1, 'rgba(10,12,30,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); blobTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.42), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.layers.set(LAYER_CARD); m.renderOrder = 1;
  return m;
}

// drawings are shared by all actors with the same look (a flock of 40 emus costs the same as 3)
const SHARED = new Map(); const BUDGET = 120e6; let used = 0; // budget in texture pixels
let SCREEN_H = 1920; export const setScreenHeight = (h) => { SCREEN_H = h; };
const okeys = new WeakMap();
const outfitKey = (o) => { let k = okeys.get(o); if (!k) { k = JSON.stringify(o, (n, v) => (typeof v === 'function' ? v.name : v)); okeys.set(o, k); } return k; };

export class Actor {
  constructor(outfit, { seed = 1, scale = 1 } = {}) {
    this.o = outfit; this.seed = seed; this.okey = outfitKey(outfit);
    this.g = new THREE.Group();
    this.tint = new THREE.Color('#ffffff');
    this.mat = new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, color: this.tint });
    this.depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 });
    this.card = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), this.mat);
    this.card.customDepthMaterial = this.depthMat;
    this.card.castShadow = true;
    this.card.position.y = (H / 2 - (H - GROUND)) * PX;
    this.card.layers.set(LAYER_CARD); this.card.userData.card = true;
    this.pivot = new THREE.Group(); this.pivot.add(this.card); this.g.add(this.pivot);
    this.blob = contactBlob(); this.g.add(this.blob);
    // reaction bubble above the head (see BUBBLES in chars.js)
    this.bubMat = new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, color: this.tint });
    this.bub = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.bubMat); this.bub.layers.set(LAYER_CARD); this.bub.userData.card = true; this.bub.visible = false;
    this.pivot.add(this.bub); this.bubCache = new Map();
    this.g.scale.setScalar(scale);
    this.state = { pose: 'idle', expr: 'neutral', blink: false, flip: false, walk: null, lean: 0, hop: 0, squash: 0, talk: false, hold: null };
  }
  tex(pose, expr, blink, talk = false, hold = null, tier = 1) {
    const key = this.okey + '|' + this.seed + '|' + (typeof pose === 'string' ? pose : JSON.stringify(pose)) + '|' + expr + '|' + (blink ? 1 : 0) + '|' + (talk ? 1 : 0) + '|' + (hold ? JSON.stringify(hold) : '') + '|' + tier;
    let t = SHARED.get(key);
    if (!t) {
      const c = document.createElement('canvas'); c.width = W * tier; c.height = H * tier; const ctx = c.getContext('2d'); ctx.scale(tier, tier);
      const info = (this.o.draw || drawCharacter)(ctx, this.o, { pose, expr, seed: this.seed, blink, talk, hold });
      t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      t.userData.info = { top: (GROUND - info.top) * PX, headY: (GROUND - info.headCy) * PX, headR: info.R * PX }; t.userData.refs = 0; t.userData.px = c.width * c.height;
      SHARED.set(key, t); used += t.userData.px;
      if (used > BUDGET) { // keep GPU memory small: drop the oldest drawings nobody shows right now
        for (const [k, old] of SHARED) { if (used <= BUDGET * 0.85) break; if (old.userData.refs <= 0 && old !== t) { old.dispose(); SHARED.delete(k); used -= old.userData.px; } }
      }
    } else { SHARED.delete(key); SHARED.set(key, t); } // mark as recently used
    return t;
  }
  // t: seconds. walk: {speed (cycles/s), run} or null. talk: true flaps the mouth. Blinks happen on their own.
  update(t, cam) {
    const s = this.state;
    let pose = s.pose;
    if (s.walk) { const ph = Math.floor(((t * s.walk.speed) % 1) * 8) / 8; pose = this.o.draw ? { walk: ph, run: !!s.walk.run } : walkPose(ph, !!s.walk.run); }
    const bt = (t + this.seed * 0.71) % 2.6;
    const blink = !s.noBlink && bt > 2.47;
    // mouth flap: ~7 changes a second with an uneven rhythm so it reads as speech
    const ft = Math.floor(t * 7.5); const talk = !!s.talk && ((ft * 2654435761 + this.seed * 97) >>> 0) % 5 > 1;
    // close to the camera: draw at double resolution so close-ups stay crisp
    const wp = new THREE.Vector3(); this.g.getWorldPosition(wp); const dist = Math.max(0.3, wp.distanceTo(cam.position));
    const shown = (CH * this.g.scale.y) / (2 * dist * Math.tan((cam.fov * Math.PI) / 360)) * SCREEN_H;
    const tier = shown > H * 1.35 ? 2 : 1;
    const tex = this.tex(pose, s.expr, blink, talk, s.hold || null, tier);
    const inf = tex.userData.info; this.top = inf.top; this.headY = inf.headY; this.headR = inf.headR;
    if (this.mat.map !== tex) { if (this.mat.map) this.mat.map.userData.refs--; tex.userData.refs++; this.mat.map = tex; this.depthMat.map = tex; this.mat.needsUpdate = true; this.depthMat.needsUpdate = true; }
    // face the camera around Y
    const p = new THREE.Vector3(); this.g.getWorldPosition(p);
    this.pivot.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) - this.g.rotation.y;
    this.card.scale.x = s.flip ? -1 : 1;
    const bob = s.walk ? Math.abs(Math.sin(t * s.walk.speed * Math.PI * 2)) * 0.04 : Math.sin(t * 2.1 + this.seed) * 0.006;
    this.card.position.y = (H / 2 - (H - GROUND)) * PX + bob + s.hop;
    this.card.rotation.z = s.lean;
    const sq = 1 + s.squash; this.card.scale.y = sq; this.card.scale.x *= 1 / Math.sqrt(Math.max(0.3, sq));
    // bubble: 'kind' or { kind | text, t0 } (t0 = pop-in time)
    const b = s.bubble;
    if (b && this.top != null) {
      const kind = typeof b === 'string' ? b : b.text ? b : b.kind; const key = JSON.stringify(kind);
      let tx = this.bubCache.get(key); if (!tx) { const c = drawBubble(kind); tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.userData = { a: c.width / c.height }; this.bubCache.set(key, tx); }
      if (this.bubMat.map !== tx) { this.bubMat.map = tx; this.bubMat.needsUpdate = true; }
      this.bubMat.color.copy(this.mat.color);
      const a = typeof b === 'object' && b.t0 != null ? t - b.t0 : 9; const pop = a < 0 ? 0 : a < 0.2 ? 1.25 * Math.sin((a / 0.2) * Math.PI * 0.62) : 1;
      const isText = typeof kind === 'object'; const hgt = (isText ? 0.62 : 0.5) * Math.max(0.01, pop); const side = kind === 'sweat';
      this.bub.scale.set(hgt * tx.userData.a, hgt, 1);
      this.bub.position.set(side ? this.headR * 1.05 : isText ? 0.45 : 0.18, (side ? this.headY + this.headR * 0.35 : this.top + hgt * 0.55 + 0.08) + bob + s.hop, 0.02);
      this.bub.visible = pop > 0.01;
    } else this.bub.visible = false;
  }
  set(o) { Object.assign(this.state, o); return this; }
  at(x, y, z) { this.g.position.set(x, y, z); return this; }
}
