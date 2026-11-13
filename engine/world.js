// TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
// TSF world kit: light presets, sky, painted textures and a box of building blocks
// (ground, roads, houses, trees, props, water, signs). All toon-shaded, everything gets ink lines.
import * as THREE from 'three';
import { LAYER_CARD } from './post.js';

// ---------------------------------------------------------------- helpers
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function canvasTex(w, h, draw, repeat = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
let GRAD = null;
function gradMap() {
  if (!GRAD) { const d = new Uint8Array([150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]); GRAD = new THREE.DataTexture(d, 3, 1); GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.needsUpdate = true; }
  return GRAD;
}
export function toon(color, map = null) { const m = new THREE.MeshToonMaterial({ color, gradientMap: gradMap() }); if (map) m.map = map; return m; }
// unlit materials (signs, screens, clouds) still follow the scene light through a tint, so a white sign is not glowing at night
export const TINTED = new Set();
export function unlit(color, map = null, { tint = true } = {}) { const m = new THREE.MeshBasicMaterial({ color }); if (map) m.map = map; if (tint) { m.userData.base = new THREE.Color(color); TINTED.add(m); } return m; }
export function mesh(geo, m, { cast = true, recv = true } = {}) { const x = new THREE.Mesh(geo, m); x.castShadow = cast; x.receiveShadow = recv; return x; }
export const shade = (hex, k) => { const c = new THREE.Color(hex); return '#' + c.multiplyScalar(k).getHexString(); };

// ---------------------------------------------------------------- light presets
export const LIGHTS = {
  // sun: direction is relative to the camera (az 0 = behind the camera), so every shot is lit from the front-side.
  // lamps: strength of street lamps / practical lights. grade: shadow + highlight tint added after tone mapping.
  day:    { sunAz: 70, sunEl: 48, sun: '#fff1dc', sunI: 2.6, hemiSky: '#cfe2ff', hemiGround: '#6a6050', hemiI: 1.05, skyTop: '#3d80d6', skyHor: '#bcd5ef', fog: '#bcd5ef', fogNear: 30, fogFar: 320, card: '#ffffff', exposure: 1.0, sat: 1.1, contrast: 1.04, bloom: 0.3, lamps: 0, shadowTint: [-0.01, 0, 0.03], highTint: [0.02, 0.01, -0.01], vignette: 0.18 },
  golden: { sunAz: 38, sunEl: 14, sun: '#ffb066', sunI: 3.3, hemiSky: '#e0b8a0', hemiGround: '#6a4c40', hemiI: 1.0, skyTop: '#6f8fcf', skyHor: '#ffc896', fog: '#f2bc92', fogNear: 25, fogFar: 260, card: '#ffe0c4', exposure: 1.02, sat: 1.15, contrast: 1.06, bloom: 0.55, lamps: 0.35, shadowTint: [0.0, -0.01, 0.04], highTint: [0.05, 0.02, -0.03], vignette: 0.24 },
  night:  { sunAz: 220, sunEl: 40, sun: '#8fa8ff', sunI: 0.5, hemiSky: '#34447e', hemiGround: '#10131e', hemiI: 0.36, skyTop: '#070c1e', skyHor: '#1c2a55', fog: '#16224a', fogNear: 12, fogFar: 150, card: '#8e9fd6', exposure: 0.95, sat: 1.0, contrast: 1.1, bloom: 0.9, lamps: 1.0, shadowTint: [-0.01, 0.0, 0.05], highTint: [0.04, 0.02, -0.02], vignette: 0.32 },
  storm:  { sunAz: 120, sunEl: 40, sun: '#c8d2dc', sunI: 1.3, hemiSky: '#9aa6b4', hemiGround: '#3a3e44', hemiI: 1.0, skyTop: '#55606e', skyHor: '#9aa4ae', fog: '#9aa4ae', fogNear: 12, fogFar: 160, card: '#d8dee6', exposure: 1.0, sat: 0.85, contrast: 1.08, bloom: 0.2, lamps: 0.3, shadowTint: [0.0, 0.01, 0.03], highTint: [0.0, 0.0, 0.0], vignette: 0.28 },
  indoor: { sunAz: 50, sunEl: 55, sun: '#fff0dc', sunI: 1.6, hemiSky: '#fff4e4', hemiGround: '#7a6a58', hemiI: 1.25, skyTop: '#d8e4f0', skyHor: '#eef2f6', fog: '#e8e2d8', fogNear: 40, fogFar: 300, card: '#fff8f0', exposure: 1.0, sat: 1.08, contrast: 1.04, bloom: 0.3, lamps: 0.8, shadowTint: [0.0, 0.0, 0.02], highTint: [0.03, 0.01, -0.01], vignette: 0.2 },
};

export class Stage {
  constructor(scene) {
    this.scene = scene;
    this.sun = new THREE.DirectionalLight('#ffffff', 2.5); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    this.sun.shadow.camera.layers.enable(1);
    const sc = this.sun.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 250;
    this.hemi = new THREE.HemisphereLight('#ffffff', '#444444', 1);
    scene.add(this.sun, this.sun.target, this.hemi);
    this.sky = this.makeSky(); scene.add(this.sky);
    scene.fog = new THREE.Fog('#bcd5ef', 30, 300);
    this.actors = [];
    this.fx = [];      // effects with update(t, cam), see fx.js
    this.lamps = [];   // {light, bulb, base} registered by lamp() and friends
    this.light = null;
  }
  makeSky() {
    const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 c = mix(hor, top, pow(h, 0.55)); if (vP.y < 0.0) c = hor; gl_FragColor = vec4(c, 1.0); }' });
    const s = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), m); s.layers.set(LAYER_CARD); s.renderOrder = -10;
    return s;
  }
  // apply a light preset; the sun stays fixed relative to the camera's view direction so every shot is lit the same way
  setLight(name, cam, focus = new THREE.Vector3()) {
    const L = LIGHTS[name] || LIGHTS.day; this.light = L; this.lightName = name;
    const yaw = Math.atan2(cam.position.x - focus.x, cam.position.z - focus.z);
    const az = (L.sunAz * Math.PI) / 180 + yaw, el = (L.sunEl * Math.PI) / 180;
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    this.sun.position.copy(focus).addScaledVector(dir, 80); this.sun.target.position.copy(focus);
    this.sun.color.set(L.sun); this.sun.intensity = L.sunI;
    this.hemi.color.set(L.hemiSky); this.hemi.groundColor.set(L.hemiGround); this.hemi.intensity = L.hemiI;
    this.sky.material.uniforms.top.value.set(L.skyTop); this.sky.material.uniforms.hor.value.set(L.skyHor);
    this.sky.position.copy(cam.position);
    this.scene.fog.color.set(L.fog); this.scene.fog.near = L.fogNear; this.scene.fog.far = L.fogFar;
    for (const a of this.actors) a.mat.color.set(L.card);
    const tc = new THREE.Color(L.card); for (const m of TINTED) m.color.copy(m.userData.base).multiply(tc);
    for (const l of this.lamps) { l.light.intensity = l.base * L.lamps; if (l.bulb) l.bulb.material.color.setRGB(...(L.lamps > 0.5 ? [3, 2.4, 1.2] : [0.95, 0.9, 0.7])); }
    return L;
  }
  add(o) { this.scene.add(o.g || o); if (o.card) this.actors.push(o); else if (typeof o.update === 'function') this.fx.push(o); return o; }
}

// ---------------------------------------------------------------- painted textures
export const TEX = {
  grass: () => canvasTex(512, 512, (x, w, h) => { const r = rng(3); x.fillStyle = '#7cb95a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { x.fillStyle = r() > 0.5 ? 'rgba(60,120,50,0.35)' : 'rgba(170,215,110,0.35)'; const px = r() * w, py = r() * h; x.fillRect(px, py, 2, 5 + r() * 6); } for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(70,130,60,0.25)'; x.beginPath(); x.ellipse(r() * w, r() * h, 20 + r() * 40, 10 + r() * 20, r() * 3, 0, Math.PI * 2); x.fill(); } }, [40, 40]),
  asphalt: () => canvasTex(512, 512, (x, w, h) => { const r = rng(5); x.fillStyle = '#8b8f96'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.06)`; x.fillRect(r() * w, r() * h, 2, 2); } }, [2, 20]),
  cobble: () => canvasTex(512, 512, (x, w, h) => { const r = rng(7); x.fillStyle = '#3d3a36'; x.fillRect(0, 0, w, h); for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 12; xx++) { const c = 150 + r() * 40; x.fillStyle = `rgb(${c},${c - 8},${c - 20})`; const ox = (yy % 2) * 21; x.beginPath(); x.roundRect(xx * 43 + ox + 3, yy * 32 + 3, 37, 26, 8); x.fill(); } }, [3, 12]),
  sand: () => canvasTex(512, 512, (x, w, h) => { const r = rng(9); x.fillStyle = '#e8c88a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = r() > 0.5 ? 'rgba(200,160,100,0.35)' : 'rgba(255,240,200,0.35)'; x.fillRect(r() * w, r() * h, 2, 2); } }, [30, 30]),
  planks: () => canvasTex(512, 512, (x, w, h) => { const r = rng(11); for (let i = 0; i < 8; i++) { const c = 0.85 + r() * 0.2; x.fillStyle = shade('#c8955a', c); x.fillRect(0, i * 64, w, 64); x.fillStyle = 'rgba(40,20,10,0.8)'; x.fillRect(0, i * 64, w, 4); for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(90,50,20,0.25)'; x.fillRect(r() * w, i * 64 + 10 + r() * 44, 60 + r() * 120, 2); } } }, [2, 2]),
  roof: (col = '#b5523b') => canvasTex(256, 256, (x, w, h) => { x.fillStyle = col; x.fillRect(0, 0, w, h); for (let yy = 0; yy < 8; yy++) { x.fillStyle = shade(col, 0.72); x.fillRect(0, yy * 32 + 26, w, 6); for (let xx = 0; xx < 8; xx++) { x.fillStyle = shade(col, 0.82); x.fillRect(xx * 32 + (yy % 2) * 16, yy * 32, 3, 30); } } }, [3, 3]),
  water: () => canvasTex(512, 512, (x, w, h) => { const r = rng(13); x.fillStyle = '#2f9ad0'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 4; x.lineCap = 'round'; for (let i = 0; i < 70; i++) { const px = r() * w, py = r() * h, l = 14 + r() * 30; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + l / 2, py - 6, px + l, py); x.stroke(); } }, [12, 12]),
};

export function facadeTex({ wall = '#e8d6b0', trim = '#ffffff', win = '#6fa8d8', door = '#7a4a2a', floors = 2, cols = 3, shutters = '#3f7f5a', seed = 1 } = {}) {
  return canvasTex(512, 512, (x, w, h) => {
    const r = rng(seed);
    x.fillStyle = wall; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { x.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'; x.fillRect(r() * w, r() * h, 3, 3); }
    x.fillStyle = shade(wall, 0.8); x.fillRect(0, h - 30, w, 30);
    const fh = (h - 30) / floors;
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) * (w / cols), cy = f * fh + fh * 0.48;
      const isDoor = f === floors - 1 && c === Math.floor(cols / 2);
      if (isDoor) {
        x.fillStyle = door; x.fillRect(cx - 34, h - 30 - fh * 0.72, 68, fh * 0.72);
        x.strokeStyle = '#151515'; x.lineWidth = 6; x.strokeRect(cx - 34, h - 30 - fh * 0.72, 68, fh * 0.72);
        x.fillStyle = '#f2c230'; x.beginPath(); x.arc(cx + 20, h - 30 - fh * 0.34, 5, 0, Math.PI * 2); x.fill();
        continue;
      }
      const ww = 52, wh = fh * 0.46;
      if (shutters) { x.fillStyle = shutters; x.fillRect(cx - ww / 2 - 18, cy - wh / 2, 16, wh); x.fillRect(cx + ww / 2 + 2, cy - wh / 2, 16, wh); }
      x.fillStyle = win; x.fillRect(cx - ww / 2, cy - wh / 2, ww, wh);
      x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.moveTo(cx - ww / 2 + 6, cy + wh / 2 - 6); x.lineTo(cx - ww / 2 + 6, cy - wh / 2 + 6); x.lineTo(cx + 4, cy - wh / 2 + 6); x.fill();
      x.strokeStyle = trim; x.lineWidth = 7; x.strokeRect(cx - ww / 2, cy - wh / 2, ww, wh);
      x.beginPath(); x.moveTo(cx, cy - wh / 2); x.lineTo(cx, cy + wh / 2); x.moveTo(cx - ww / 2, cy); x.lineTo(cx + ww / 2, cy); x.lineWidth = 4; x.stroke();
      x.fillStyle = trim; x.fillRect(cx - ww / 2 - 6, cy + wh / 2, ww + 12, 8);
      x.strokeStyle = '#151515'; x.lineWidth = 3; x.strokeRect(cx - ww / 2 - 4, cy - wh / 2 - 4, ww + 8, wh + 8);
    }
  });
}

// ---------------------------------------------------------------- building blocks
export function ground(stage, { tex = 'grass', size = 600, color = '#ffffff' } = {}) {
  const g = mesh(new THREE.PlaneGeometry(size, size), toon(color, TEX[tex]()), { cast: false }); g.rotation.x = -Math.PI / 2; stage.add(g); return g;
}
export function road(stage, { x = 0, z = 0, w = 7, len = 200, rot = 0, tex = 'asphalt', line = true, curb = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const t = TEX[tex](); t.repeat.set(w / 4, len / 4);
  const r = mesh(new THREE.PlaneGeometry(w, len), toon('#ffffff', t), { cast: false }); r.rotation.x = -Math.PI / 2; r.position.y = 0.01; g.add(r);
  if (curb) [-1, 1].forEach((s) => { const k = mesh(new THREE.BoxGeometry(0.35, 0.18, len), toon('#c9c4ba')); k.position.set(s * (w / 2 + 0.17), 0.09, 0); g.add(k); });
  if (line) for (let i = -len / 2; i < len / 2; i += 4) { const d = mesh(new THREE.PlaneGeometry(0.18, 2), unlit('#f4efe2'), { cast: false }); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.02, i); g.add(d); }
  stage.add(g); return g;
}
export function sidewalk(stage, { x = 0, z = 0, w = 3, len = 200, rot = 0 } = {}) {
  const t = canvasTex(256, 256, (c, W, H) => { c.fillStyle = '#d8d2c6'; c.fillRect(0, 0, W, H); c.strokeStyle = '#9e978a'; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * 64); c.lineTo(W, i * 64); c.stroke(); } c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke(); }, [w / 3, len / 3]);
  const s = mesh(new THREE.BoxGeometry(w, 0.16, len), toon('#ffffff', t), { cast: false }); s.position.set(x, 0.08, z); s.rotation.y = rot; stage.add(s); return s;
}
export function house(stage, { x = 0, z = 0, rot = 0, w = 7, d = 7, h = 7.5, wall = '#e8d6b0', roof = '#b5523b', floors = 2, cols = 3, shutters = '#3f7f5a', seed = 1, chimney = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const front = toon('#ffffff', facadeTex({ wall, floors, cols, shutters, seed }));
  const side = toon('#ffffff', facadeTex({ wall, floors, cols: 2, shutters, seed: seed + 1, door: null }));
  const plain = toon(wall);
  const body = mesh(new THREE.BoxGeometry(w, h, d), [side, side, plain, plain, front, plain]); body.position.y = h / 2; g.add(body);
  const roofH = Math.min(w, d) * 0.42;
  const shape = new THREE.Shape(); shape.moveTo(-w / 2 - 0.35, 0); shape.lineTo(0, roofH); shape.lineTo(w / 2 + 0.35, 0); shape.lineTo(-w / 2 - 0.35, 0);
  const rg = new THREE.ExtrudeGeometry(shape, { depth: d + 0.6, bevelEnabled: false }); rg.translate(0, 0, -(d + 0.6) / 2);
  const rt = TEX.roof(roof); rt.repeat.set(w / 2.5, d / 2.5);
  const rf = mesh(rg, [toon(shade(roof, 0.9)), toon('#ffffff', rt)]); rf.position.y = h; g.add(rf);
  const eave = mesh(new THREE.BoxGeometry(w + 0.8, 0.22, d + 0.7), toon(shade(wall, 0.75))); eave.position.y = h + 0.02; g.add(eave);
  if (chimney) { const c = mesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), toon('#a8553f')); c.position.set(w * 0.25, h + roofH * 0.7, -d * 0.15); g.add(c); }
  stage.add(g); return g;
}
export function tree(stage, { x = 0, z = 0, s = 1, seed = 1, col = '#4f9a3f', trunk = '#7a5230' } = {}) {
  const r = rng(seed); const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s * (0.85 + r() * 0.3));
  const t = mesh(new THREE.CylinderGeometry(0.22, 0.32, 3, 8), toon(trunk)); t.position.y = 1.5; g.add(t);
  const n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) { const b = mesh(new THREE.IcosahedronGeometry(1.1 + r() * 0.7, 1), toon(shade(col, 0.85 + r() * 0.3))); b.position.set((r() - 0.5) * 2, 3.4 + r() * 1.8, (r() - 0.5) * 2); g.add(b); }
  stage.add(g); return g;
}
export function lamp(stage, { x = 0, z = 0, on = false } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const p = mesh(new THREE.CylinderGeometry(0.07, 0.1, 4, 8), toon('#2b2f36')); p.position.y = 2; g.add(p);
  const hd = mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.45, 8), toon('#2b2f36')); hd.position.y = 4.1; g.add(hd);
  const gl = mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: '#f2e6b0' }), { cast: false }); gl.position.y = 3.85; g.add(gl);
  if (on) { const l = new THREE.PointLight('#ffcf8a', 8, 12, 2); l.position.y = 3.7; g.add(l); stage.lamps.push({ light: l, bulb: gl, base: 8 }); }
  stage.add(g); return g;
}
export function bench(stage, { x = 0, z = 0, rot = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; const wd = toon('#a8743f'), ir = toon('#2b2f36');
  for (let i = 0; i < 3; i++) { const s = mesh(new THREE.BoxGeometry(1.8, 0.07, 0.14), wd); s.position.set(0, 0.48, -0.18 + i * 0.17); g.add(s); }
  for (let i = 0; i < 2; i++) { const b = mesh(new THREE.BoxGeometry(1.8, 0.12, 0.06), wd); b.position.set(0, 0.7 + i * 0.18, -0.3); b.rotation.x = -0.15; g.add(b); }
  [-0.75, 0.75].forEach((sx) => { const l = mesh(new THREE.BoxGeometry(0.08, 0.48, 0.5), ir); l.position.set(sx, 0.24, -0.05); g.add(l); });
  stage.add(g); return g;
}
export function fence(stage, { x = 0, z = 0, len = 10, rot = 0, col = '#f4f1ea' } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; const m = toon(col);
  for (let i = 0; i <= len / 0.5; i++) { const p = mesh(new THREE.BoxGeometry(0.12, 1.0, 0.06), m); p.position.set(-len / 2 + i * 0.5, 0.5, 0); g.add(p); }
  [0.3, 0.75].forEach((y) => { const r = mesh(new THREE.BoxGeometry(len, 0.1, 0.05), m); r.position.set(0, y, -0.05); g.add(r); });
  stage.add(g); return g;
}
export function crate(stage, { x = 0, z = 0, s = 1, rot = 0 } = {}) { const c = mesh(new THREE.BoxGeometry(s, s, s), toon('#ffffff', TEX.planks())); c.position.set(x, s / 2, z); c.rotation.y = rot; stage.add(c); return c; }
export function barrel(stage, { x = 0, z = 0, col = '#9a5a2e' } = {}) { const b = mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 14), toon(col)); b.position.set(x, 0.55, z); stage.add(b); return b; }
export function water(stage, { x = 0, z = 0, w = 60, d = 60, y = -0.3 } = {}) { const t = TEX.water(); t.repeat.set(w / 6, d / 6); const m = mesh(new THREE.PlaneGeometry(w, d), toon('#ffffff', t), { cast: false }); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); stage.add(m); return m; }
// a sign / poster whose face is unlit so it always reads
export function sign(stage, { x = 0, y = 2, z = 0, rot = 0, w = 2, h = 1, text = 'SIGN', bg = '#f4efe2', fg = '#c0353a', post = true, font = 'bold 120px Arial Black, Arial' } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const t = canvasTex(1024, Math.round(1024 * h / w), (c, W, H) => { c.fillStyle = bg; c.fillRect(0, 0, W, H); c.strokeStyle = '#151515'; c.lineWidth = 18; c.strokeRect(9, 9, W - 18, H - 18); c.fillStyle = fg; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; const lines = text.split('\n'); lines.forEach((l, i) => c.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * 130)); });
  const p = mesh(new THREE.PlaneGeometry(w, h), unlit('#ffffff', t), { cast: false }); p.position.y = y; g.add(p);
  const back = mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.08), toon('#5a4a3a')); back.position.set(0, y, -0.05); g.add(back);
  if (post) [-w / 3, w / 3].forEach((sx) => { const q = mesh(new THREE.BoxGeometry(0.1, y, 0.1), toon('#5a4a3a')); q.position.set(sx, y / 2, -0.06); g.add(q); });
  stage.add(g); return g;
}
// painted puffy clouds on the sky (no ink)
export function clouds(stage, { n = 8, seed = 2, y = 60, r = 220 } = {}) {
  const rr = rng(seed);
  const t = canvasTex(512, 256, (c, W, H) => { for (let i = 0; i < 9; i++) { const cx = 90 + rr() * 330, cy = 150 - rr() * 60, rad = 40 + rr() * 50; const g = c.createRadialGradient(cx, cy - rad * 0.3, rad * 0.2, cx, cy, rad); g.addColorStop(0, '#ffffff'); g.addColorStop(0.8, '#f2f6fb'); g.addColorStop(1, 'rgba(230,238,248,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, rad, 0, Math.PI * 2); c.fill(); } c.globalCompositeOperation = 'source-atop'; const g2 = c.createLinearGradient(0, 120, 0, 230); g2.addColorStop(0, 'rgba(160,180,210,0)'); g2.addColorStop(1, 'rgba(160,180,210,0.6)'); c.fillStyle = g2; c.fillRect(0, 0, W, H); });
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const a = rr() * Math.PI * 2; const sm = new THREE.SpriteMaterial({ map: t, fog: false, depthWrite: false }); sm.userData.base = new THREE.Color('#ffffff'); TINTED.add(sm); const s = new THREE.Sprite(sm); s.scale.set(70 + rr() * 50, 35 + rr() * 20, 1); s.position.set(Math.cos(a) * r, y + rr() * 40, Math.sin(a) * r); s.layers.set(LAYER_CARD); g.add(s); }
  stage.add(g); return g;
}
