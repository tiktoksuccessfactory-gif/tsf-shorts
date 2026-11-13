// Effects that live in the 3D world: smoke and dust puffs, confetti, sparkles, splashes, things falling from the sky.
// All of them are pure functions of time (t0 = when it starts), so any frame can be rendered on its own.
//   puff(stage, { at: [x, y, z], t0: 3.2, n: 12, color: '#ffffff' })
import * as THREE from 'three';
import { LAYER_CARD } from './post.js';

const texCache = {};
function spriteTex(kind) {
  if (texCache[kind]) return texCache[kind];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  if (kind === 'soft') { const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  else if (kind === 'cloud') { for (const [a, b, r] of [[64, 70, 40], [40, 76, 28], [88, 78, 30], [58, 48, 30], [80, 54, 26]]) { x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); } x.lineWidth = 5; x.strokeStyle = 'rgba(21,21,21,0.85)'; for (const [a, b, r] of [[64, 70, 40], [40, 76, 28], [88, 78, 30], [58, 48, 30], [80, 54, 26]]) { x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.stroke(); } for (const [a, b, r] of [[64, 70, 37], [40, 76, 25], [88, 78, 27], [58, 48, 27], [80, 54, 23]]) { x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); } }
  else if (kind === 'star') { x.translate(64, 64); x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 16 : 58, a = (i / 8) * Math.PI * 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fillStyle = '#fff'; x.fill(); }
  else if (kind === 'square') { x.fillStyle = '#fff'; x.fillRect(30, 44, 68, 40); }
  else if (kind === 'drop') { x.beginPath(); x.moveTo(64, 10); x.bezierCurveTo(100, 60, 100, 110, 64, 116); x.bezierCurveTo(28, 110, 28, 60, 64, 10); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 7; x.strokeStyle = '#151515'; x.stroke(); }
  else if (kind === 'chunk') { x.beginPath(); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = 34 + ((i * 37) % 17); x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.closePath(); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 7; x.strokeStyle = '#151515'; x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texCache[kind] = t; return t;
}
function rnd(seed) { let a = (seed * 2654435761) >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// generic particle system. each particle: start offset, velocity, delay, life, size, spin
class Particles {
  constructor(stage, { at = [0, 0, 0], t0 = 0, n = 12, tex = 'soft', color = '#ffffff', colors = null, size = 0.5, grow = 1.5, life = 1.2, spread = 0.6, vel = [0, 1, 0], velRand = 1, gravity = 0, drag = 0.6, stagger = 0.15, opacity = 0.9, seed = 1, area = null, spin = 0 } = {}) {
    this.o = { at, t0, n, size, grow, life, gravity, drag, opacity, spin };
    const r = rnd(seed + n * 7);
    this.g = new THREE.Group(); this.p = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.SpriteMaterial({ map: spriteTex(tex), color: (colors ? colors[i % colors.length] : color), transparent: true, depthWrite: false, opacity });
      const s = new THREE.Sprite(m); s.layers.set(LAYER_CARD); s.userData.fx = true; s.visible = false; this.g.add(s);
      const off = area ? [(r() - 0.5) * area[0], (r() - 0.5) * (area[1] || 0), (r() - 0.5) * (area[2] ?? area[0])] : [(r() - 0.5) * spread, (r() - 0.5) * spread * 0.4, (r() - 0.5) * spread];
      const v = [vel[0] + (r() - 0.5) * 2 * velRand, vel[1] + (r() - 0.3) * velRand, vel[2] + (r() - 0.5) * 2 * velRand];
      this.p.push({ s, off, v, delay: r() * stagger, life: life * (0.7 + r() * 0.6), size: size * (0.6 + r() * 0.8), rot: r() * 6, spin: (r() - 0.5) * 2 * spin });
    }
    stage.add(this);
  }
  update(t) {
    const o = this.o;
    for (const q of this.p) {
      const a = t - o.t0 - q.delay;
      if (a < 0 || a > q.life) { q.s.visible = false; continue; }
      q.s.visible = true; const k = a / q.life;
      const damp = o.drag > 0 ? (1 - Math.exp(-o.drag * a)) / o.drag : a;
      q.s.position.set(o.at[0] + q.off[0] + q.v[0] * damp, o.at[1] + q.off[1] + q.v[1] * damp - 0.5 * o.gravity * a * a, o.at[2] + q.off[2] + q.v[2] * damp);
      if (q.s.position.y < 0.02 && o.gravity > 0) q.s.position.y = 0.02;
      const sc = q.size * (1 + (o.grow - 1) * Math.sqrt(k)); q.s.scale.set(sc, sc, 1);
      q.s.material.opacity = o.opacity * Math.min(1, a / 0.06) * (1 - k * k);
      q.s.material.rotation = q.rot + q.spin * a;
    }
  }
}

export const puff = (stage, o = {}) => new Particles(stage, { tex: 'cloud', color: '#f4f4f4', n: 10, size: 0.55, grow: 1.8, life: 0.9, spread: 0.7, vel: [0, 0.6, 0], velRand: 1.4, drag: 3, opacity: 1, stagger: 0.08, ...o });
export const dust = (stage, o = {}) => new Particles(stage, { tex: 'cloud', color: '#d8c8a8', n: 14, size: 0.45, grow: 2.2, life: 1.3, spread: 1.4, vel: [0, 0.25, 0], velRand: 1.6, drag: 2.5, opacity: 0.95, stagger: 0.1, ...o });
export const smoke = (stage, o = {}) => new Particles(stage, { tex: 'cloud', color: '#6a6e76', n: 16, size: 0.9, grow: 2.6, life: 3.0, spread: 0.6, vel: [0.2, 1.6, 0], velRand: 0.4, drag: 0.4, opacity: 0.9, stagger: 2.0, ...o });
export const confetti = (stage, o = {}) => new Particles(stage, { tex: 'square', colors: ['#e2453c', '#f2c230', '#3fb36b', '#3f7fd9', '#d64f8a'], n: 60, size: 0.16, grow: 1, life: 2.6, spread: 0.5, vel: [0, 5, 0], velRand: 2.4, gravity: 3.2, drag: 0.8, stagger: 0.12, opacity: 1, spin: 8, ...o });
export const sparkle = (stage, o = {}) => new Particles(stage, { tex: 'star', color: '#ffe680', n: 12, size: 0.22, grow: 0.4, life: 0.8, spread: 1.0, vel: [0, 0.3, 0], velRand: 0.5, drag: 2, stagger: 0.5, opacity: 1, spin: 3, ...o });
export const splash = (stage, o = {}) => new Particles(stage, { tex: 'drop', color: '#5aaee0', n: 18, size: 0.2, grow: 1, life: 1.1, spread: 0.4, vel: [0, 3.2, 0], velRand: 1.8, gravity: 9, drag: 0, stagger: 0.05, opacity: 1, ...o });
// things falling from the sky over an area: rain of chunks, coins, leaves... (area = [width, height, depth] above `at`)
export const fall = (stage, o = {}) => new Particles(stage, { tex: 'chunk', color: '#c0505a', n: 30, size: 0.3, grow: 1, life: 2.2, area: [8, 2, 8], vel: [0, -1, 0], velRand: 0.3, gravity: 6, drag: 0, stagger: 3, opacity: 1, spin: 4, ...o });
export { Particles };
