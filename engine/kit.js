// More sets and props: rooms, furniture, city, industry, transport, nature, landmarks, crowds.
// Every builder: name(stage, { x, z, rot, ...options }) and returns a THREE.Group you can move or animate.
import * as THREE from 'three';
import { toon, unlit, mesh, canvasTex, rng, shade, TEX } from './world.js';
import { Actor } from './actor.js';
import { CAST, outfit, SKINS } from './chars.js';

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C = (rt, rb, h, n = 20) => new THREE.CylinderGeometry(rt, rb, h, n);
const S = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
function at(g, x, y, z) { g.position.set(x, y, z); return g; }
function group(stage, { x = 0, y = 0, z = 0, rot = 0, s = 1 } = {}) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; g.scale.setScalar(s); if (stage) stage.add(g); return g; }
const put = (g, m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
const font = (px) => `900 ${px}px "Arial Black", Arial, sans-serif`;

// ---------- textures
export const TEX2 = {
  tiles: (col = '#e8e4dc') => canvasTex(256, 256, (c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); c.strokeStyle = shade(col, 0.8); c.lineWidth = 4; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * 64); c.lineTo(W, i * 64); c.stroke(); c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, H); c.stroke(); } }, [6, 6]),
  checker: (a = '#f2f0ea', b = '#2f3440') => canvasTex(128, 128, (c, W, H) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? b : a; c.fillRect(i * 64, j * 64, 64, 64); } }, [8, 8]),
  carpet: (col = '#a8443c') => canvasTex(256, 256, (c, W, H) => { const r = rng(4); c.fillStyle = col; c.fillRect(0, 0, W, H); for (let i = 0; i < 3000; i++) { c.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'; c.fillRect(r() * W, r() * H, 2, 2); } }, [4, 4]),
  wall: (col = '#efe6d2', stripe = null) => canvasTex(256, 256, (c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); if (stripe) { c.fillStyle = stripe; for (let i = 0; i < 8; i++) c.fillRect(i * 32, 0, 12, H); } }, [3, 1]),
  bricks: (col = '#b5523b') => canvasTex(256, 256, (c, W, H) => { c.fillStyle = '#d8cfc0'; c.fillRect(0, 0, W, H); for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { c.fillStyle = shade(col, 0.85 + ((x * 7 + y * 3) % 5) * 0.06); c.fillRect(x * 64 + (y % 2) * 32 + 3, y * 32 + 3, 58, 26); } }, [4, 4]),
  crops: (crop = '#6fae4a', soil = '#8a6a44') => canvasTex(256, 256, (c, W, H) => { const r = rng(6); c.fillStyle = soil; c.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) { c.fillStyle = crop; c.fillRect(i * 32 + 6, 0, 20, H); for (let k = 0; k < 40; k++) { c.fillStyle = shade(crop, 0.8 + r() * 0.35); c.fillRect(i * 32 + 6 + r() * 18, r() * H, 3, 8); } } }, [20, 20]),
  windows: (col = '#9fb4c8', lit = false) => canvasTex(256, 512, (c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); const r = rng(9); for (let y = 0; y < 16; y++) for (let x = 0; x < 4; x++) { c.fillStyle = lit && r() > 0.55 ? '#ffe7a0' : '#2c3e58'; c.fillRect(x * 64 + 10, y * 32 + 6, 44, 20); } }, [1, 1]),
};

// ---------- rooms and furniture
// an open box room facing +z (the camera side is open). Paint windows/doors on the back wall with options.
export function room(stage, { x = 0, z = 0, rot = 0, w = 10, d = 8, h = 3.6, wall = '#efe6d2', stripe = null, floor = 'planks', floorCol = '#ffffff', windowAt = 0.3, door = true, ceiling = true, trim = '#ffffff' } = {}) {
  const g = group(stage, { x, z, rot });
  const ft = floor === 'planks' ? TEX.planks() : floor === 'tiles' ? TEX2.tiles() : floor === 'checker' ? TEX2.checker() : TEX2.carpet(floor.startsWith?.('#') ? floor : undefined);
  ft.repeat.set(w / 2, d / 2);
  const f = mesh(new THREE.PlaneGeometry(w, d), toon(floorCol, ft), { cast: false }); f.rotation.x = -Math.PI / 2; put(g, f, 0, 0.005, 0);
  const back = canvasTex(1024, Math.round(1024 * h / w), (c, W, H) => {
    c.fillStyle = wall; c.fillRect(0, 0, W, H); if (stripe) { c.fillStyle = stripe; for (let i = 0; i < W; i += 48) c.fillRect(i, 0, 16, H); }
    c.fillStyle = trim; c.fillRect(0, H - 22, W, 22); c.fillStyle = '#151515'; c.fillRect(0, H - 25, W, 4);
    if (windowAt !== null) { const wx = W * windowAt - 110, wy = H * 0.2, ww = 220, wh = H * 0.42; c.fillStyle = '#9fd0f2'; c.fillRect(wx, wy, ww, wh); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(wx + 30, wy + wh); c.lineTo(wx + 100, wy); c.lineTo(wx + 140, wy); c.lineTo(wx + 70, wy + wh); c.fill(); c.strokeStyle = '#151515'; c.lineWidth = 10; c.strokeRect(wx, wy, ww, wh); c.lineWidth = 7; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke(); }
    if (door) { const dx = W * 0.78, dw = 150, dh = H * 0.68; c.fillStyle = '#8a5a3a'; c.fillRect(dx, H - 22 - dh, dw, dh); c.strokeStyle = '#151515'; c.lineWidth = 9; c.strokeRect(dx, H - 22 - dh, dw, dh); c.beginPath(); c.arc(dx + dw - 26, H - 22 - dh / 2, 9, 0, 7); c.fillStyle = '#f2c230'; c.fill(); c.stroke(); }
  });
  put(g, mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', back), { cast: false }), 0, h / 2, -d / 2);
  // walls above the ceiling line so the outside never shows in tall framings
  for (const [pw, px, pz, ry] of [[w, 0, -d / 2 - 0.01, 0], [d, -w / 2 - 0.01, 0, Math.PI / 2], [d, w / 2 + 0.01, 0, -Math.PI / 2]]) { const m = mesh(new THREE.PlaneGeometry(pw, 30), toon(shade(wall, 0.9)), { cast: false }); m.rotation.y = ry; put(g, m, px, h + 15, pz); }
  const side = TEX2.wall(wall, stripe); side.repeat.set(d / 3, 1);
  for (const sx of [-1, 1]) { const m = mesh(new THREE.PlaneGeometry(d, h), toon('#ffffff', side), { cast: false }); m.rotation.y = -sx * Math.PI / 2; put(g, m, sx * w / 2, h / 2, 0); }
  if (ceiling) { const m = mesh(new THREE.PlaneGeometry(w, d), toon('#f4f1ea'), { cast: false, recv: false }); m.rotation.x = Math.PI / 2; put(g, m, 0, h, 0); }
  return g;
}
export function table(stage, { x = 0, z = 0, rot = 0, w = 1.6, d = 0.9, h = 0.78, col = '#a8743f', cloth = null } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(w, 0.07, d), toon(cloth || col)), 0, h, 0);
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(g, mesh(B(0.07, h, 0.07), toon(shade(col, 0.8))), a * (w / 2 - 0.08), h / 2, b * (d / 2 - 0.08));
  return g;
}
export function chair(stage, { x = 0, z = 0, rot = 0, col = '#7a5230' } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(0.48, 0.06, 0.46), toon(col)), 0, 0.46, 0); put(g, mesh(B(0.48, 0.5, 0.05), toon(col)), 0, 0.74, -0.21);
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(g, mesh(B(0.05, 0.46, 0.05), toon(shade(col, 0.8))), a * 0.2, 0.23, b * 0.19);
  return g;
}
export function screen(stage, { x = 0, y = 1, z = 0, rot = 0, w = 0.6, h = 0.38, text = '', bg = '#2f6fd6', fg = '#ffffff', draw = null } = {}) {
  const g = group(stage, { x, y, z, rot });
  put(g, mesh(B(w + 0.06, h + 0.06, 0.05), toon('#2b2f3a')), 0, 0, 0);
  const t = canvasTex(512, Math.round(512 * h / w), (c, W, H) => { c.fillStyle = bg; c.fillRect(0, 0, W, H); if (draw) draw(c, W, H); else { c.fillStyle = fg; c.font = font(Math.min(120, H * 0.4)); c.textAlign = 'center'; c.textBaseline = 'middle'; String(text).split('\n').forEach((l, i, a) => c.fillText(l, W / 2, H / 2 + (i - (a.length - 1) / 2) * H * 0.35)); } });
  put(g, mesh(new THREE.PlaneGeometry(w, h), unlit('#ffffff', t), { cast: false }), 0, 0, 0.03);
  return g;
}
export function desk(stage, { x = 0, z = 0, rot = 0, col = '#c9a46b', text = '', bg = '#2f6fd6' } = {}) {
  const g = table(stage, { x, z, rot, w: 1.5, d: 0.75, col });
  g.add(at(screen(null, { y: 1.12, z: -0.15, text, bg }), 0, 1.12, -0.15)); put(g, mesh(B(0.08, 0.2, 0.08), toon('#2b2f3a')), 0, 0.9, -0.17);
  put(g, mesh(B(0.5, 0.03, 0.16), toon('#d8dce2')), 0, 0.83, 0.12);
  return g;
}
export function shelf(stage, { x = 0, z = 0, rot = 0, w = 1.6, h = 2, seed = 3 } = {}) {
  const g = group(stage, { x, z, rot }), r = rng(seed), wood = toon('#8a5a3a');
  put(g, mesh(B(w, h, 0.05), wood), 0, h / 2, -0.17); for (const sx of [-1, 1]) put(g, mesh(B(0.05, h, 0.36), wood), sx * w / 2, h / 2, 0);
  const cols = ['#c0453a', '#3f7fd9', '#3fb36b', '#f2c230', '#7a3fb3', '#e8742c', '#f4f1ea'];
  for (let k = 0; k < 4; k++) { const y = 0.05 + k * h / 4; put(g, mesh(B(w, 0.05, 0.36), wood), 0, y, 0); let bx = -w / 2 + 0.08; while (bx < w / 2 - 0.12) { const bw = 0.05 + r() * 0.06, bh = h / 4 * (0.55 + r() * 0.3); put(g, mesh(B(bw, bh, 0.24), toon(cols[Math.floor(r() * cols.length)])), bx + bw / 2, y + bh / 2 + 0.03, 0); bx += bw + 0.01; } }
  return g;
}
export function bed(stage, { x = 0, z = 0, rot = 0, col = '#3f7fd9' } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(1.1, 0.35, 2), toon('#8a5a3a')), 0, 0.22, 0); put(g, mesh(B(1.05, 0.18, 1.9), toon('#f4f1ea')), 0, 0.46, 0);
  put(g, mesh(B(1.06, 0.1, 1.3), toon(col)), 0, 0.58, 0.3); put(g, mesh(B(0.7, 0.14, 0.38), toon('#ffffff')), 0, 0.6, -0.7); put(g, mesh(B(1.1, 0.9, 0.08), toon('#8a5a3a')), 0, 0.45, -1); return g;
}
export function sofa(stage, { x = 0, z = 0, rot = 0, col = '#5a8a6a', w = 2 } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(w, 0.42, 0.85), toon(col)), 0, 0.21, 0); put(g, mesh(B(w, 0.6, 0.22), toon(shade(col, 0.9))), 0, 0.7, -0.32);
  for (const sx of [-1, 1]) put(g, mesh(B(0.2, 0.62, 0.85), toon(shade(col, 0.9))), sx * (w / 2 - 0.1), 0.31, 0); return g;
}
export function tv(stage, { x = 0, z = 0, rot = 0, text = 'NEWS', bg = '#c0353a' } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(1.4, 0.5, 0.45), toon('#6a4630')), 0, 0.25, 0); g.add(at(screen(null, { w: 1.2, h: 0.68, text, bg }), 0, 0.92, 0)); return g;
}
export function fridge(stage, { x = 0, z = 0, rot = 0, col = '#f4f4f0' } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(0.8, 1.8, 0.7), toon(col)), 0, 0.9, 0); put(g, mesh(B(0.04, 0.4, 0.04), toon('#9aa0a8')), 0.3, 1.2, 0.37); put(g, mesh(B(0.8, 0.02, 0.71), toon('#151515')), 0, 1.25, 0); return g;
}
export function counter(stage, { x = 0, z = 0, rot = 0, w = 3, col = '#f4f1ea', top = '#5a5f6a' } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(w, 0.9, 0.65), toon(col)), 0, 0.45, 0); put(g, mesh(B(w + 0.04, 0.05, 0.7), toon(top)), 0, 0.92, 0); return g;
}
export function board(stage, { x = 0, y = 1.7, z = 0, rot = 0, w = 2.6, h = 1.3, text = '', chalk = true, draw = null } = {}) {
  const g = group(stage, { x, y, z, rot });
  put(g, mesh(B(w + 0.12, h + 0.12, 0.05), toon('#8a5a3a')), 0, 0, 0);
  const t = canvasTex(1024, Math.round(1024 * h / w), (c, W, H) => { c.fillStyle = chalk ? '#2f4a3a' : '#fbfbf8'; c.fillRect(0, 0, W, H); if (draw) draw(c, W, H); else { c.fillStyle = chalk ? '#f4f1ea' : '#2b2f3a'; c.font = font(90); c.textAlign = 'center'; c.textBaseline = 'middle'; String(text).split('\n').forEach((l, i, a) => c.fillText(l, W / 2, H / 2 + (i - (a.length - 1) / 2) * 110)); } });
  put(g, mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', t), { cast: false }), 0, 0, 0.03); return g;
}
export function plant(stage, { x = 0, z = 0, s = 1, col = '#4f9a3f' } = {}) {
  const g = group(stage, { x, z, s }); put(g, mesh(C(0.22, 0.17, 0.4, 14), toon('#c0653a')), 0, 0.2, 0);
  for (const [a, b, c, r] of [[0, 0.65, 0, 0.3], [0.15, 0.85, 0.05, 0.22], [-0.14, 0.8, -0.04, 0.24]]) put(g, mesh(S(r, 12, 10), toon(col)), a, b, c); return g;
}
export function picture(stage, { x = 0, y = 1.8, z = 0, rot = 0, w = 0.8, h = 0.6, draw = null, col = '#7fc4f2' } = {}) {
  const g = group(stage, { x, y, z, rot }); put(g, mesh(B(w + 0.1, h + 0.1, 0.04), toon('#c9a46b')), 0, 0, 0);
  const t = canvasTex(256, Math.round(256 * h / w), (c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); if (draw) draw(c, W, H); else { c.fillStyle = '#4f9a3f'; c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.35, H * 0.4); c.lineTo(W * 0.6, H * 0.75); c.lineTo(W * 0.8, H * 0.5); c.lineTo(W, H); c.fill(); c.fillStyle = '#ffe066'; c.beginPath(); c.arc(W * 0.75, H * 0.25, H * 0.12, 0, 7); c.fill(); } });
  put(g, mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', t), { cast: false }), 0, 0, 0.025); return g;
}
export function rug(stage, { x = 0, z = 0, w = 2.4, d = 1.6, col = '#c0453a' } = {}) { const m = mesh(new THREE.PlaneGeometry(w, d), toon(col, TEX2.carpet(col)), { cast: false }); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.012, z); stage.add(m); return m; }
export function floorLamp(stage, { x = 0, z = 0 } = {}) {
  const g = group(stage, { x, z }); put(g, mesh(C(0.2, 0.2, 0.04), toon('#2b2f36')), 0, 0.02, 0); put(g, mesh(C(0.025, 0.025, 1.5, 8), toon('#2b2f36')), 0, 0.75, 0);
  put(g, mesh(C(0.18, 0.3, 0.32, 16, 1, true), toon('#f2e6b0')), 0, 1.55, 0); const bulb = put(g, mesh(S(0.08), new THREE.MeshBasicMaterial({ color: '#f2e6b0' }), { cast: false }), 0, 1.45, 0);
  const l = new THREE.PointLight('#ffd59a', 4, 8, 2); l.position.y = 1.4; g.add(l); stage.lamps.push({ light: l, bulb, base: 4 }); return g;
}

// ---------- city, industry, landmarks
export function tower(stage, { x = 0, z = 0, rot = 0, w = 10, d = 10, h = 40, col = '#9fb4c8', lit = false, top = '#5a6070' } = {}) {
  const g = group(stage, { x, z, rot }); const t = TEX2.windows(col, lit); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 6, h / 12);
  put(g, mesh(B(w, h, d), toon('#ffffff', t)), 0, h / 2, 0); put(g, mesh(B(w * 0.9, 0.8, d * 0.9), toon(top)), 0, h + 0.4, 0); return g;
}
export function skyline(stage, { z = -120, n = 18, seed = 5, spread = 160, lit = false } = {}) {
  const r = rng(seed); const cols = ['#9fb4c8', '#b8c4d0', '#c8b8a8', '#a8b8b0', '#d0c8b8'];
  for (let i = 0; i < n; i++) tower(stage, { x: (i / n - 0.5) * spread + (r() - 0.5) * 6, z: z - r() * 30, w: 8 + r() * 10, d: 8 + r() * 8, h: 20 + r() * 50, col: cols[i % cols.length], lit });
}
// storage tank / vat (molasses, beer, water, fuel): label is painted on the side
export function tank(stage, { x = 0, z = 0, r = 4, h = 8, col = '#c8ccd2', label = '', labelCol = '#c0353a', dome = true, legs = false } = {}) {
  const g = group(stage, { x, z }); const y0 = legs ? 1.5 : 0;
  const t = canvasTex(1024, 512, (c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); c.strokeStyle = shade(col, 0.75); c.lineWidth = 4; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, i * H / 6); c.lineTo(W, i * H / 6); c.stroke(); } c.fillStyle = shade(col, 0.6); for (let i = 0; i < 40; i++) for (let k = 1; k < 6; k++) { c.beginPath(); c.arc(i * W / 40 + 12, k * H / 6 + 7, 3, 0, 7); c.fill(); } if (label) { c.fillStyle = labelCol; c.font = font(110); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, W * 0.25, H * 0.45); } });
  put(g, mesh(C(r, r, h, 32), toon('#ffffff', t)), 0, y0 + h / 2, 0);
  if (dome) put(g, mesh(new THREE.ConeGeometry(r * 1.02, r * 0.45, 32), toon(shade(col, 0.9))), 0, y0 + h + r * 0.22, 0);
  if (legs) for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.78; put(g, mesh(B(0.3, y0, 0.3), toon('#5a5f6a')), Math.cos(a) * r * 0.8, y0 / 2, Math.sin(a) * r * 0.8); }
  return g;
}
export function factory(stage, { x = 0, z = 0, rot = 0, w = 16, d = 10, h = 7, col = '#b5523b', chimney = true } = {}) {
  const g = group(stage, { x, z, rot }); const t = TEX2.bricks(col); t.repeat.set(w / 3, h / 3);
  put(g, mesh(B(w, h, d), toon('#ffffff', t)), 0, h / 2, 0);
  for (let i = 0; i < 4; i++) { put(g, mesh(B(w / 4 * 0.95, 1.2, d), toon(i % 2 ? '#6a707c' : '#5a5f6a')), -w / 2 + w / 8 + (i * w) / 4, h + 0.6, 0); }
  if (chimney) put(g, mesh(C(0.7, 0.9, h * 1.6, 16), toon('#8a3f2e')), w * 0.35, h * 0.8, -d * 0.2);
  return g;
}
export function barn(stage, { x = 0, z = 0, rot = 0, col = '#b8332e' } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(7, 4.5, 9), toon(col)), 0, 2.25, 0);
  const roof = mesh(new THREE.CylinderGeometry(0.01, 4.4, 2.6, 4, 1), toon('#5a3a2a')); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 1.45); put(g, roof, 0, 5.8, 0);
  put(g, mesh(B(3, 3.2, 0.1), toon('#f4f1ea')), 0, 1.6, 4.52); put(g, mesh(B(2.6, 2.9, 0.12), toon(shade(col, 0.85))), 0, 1.5, 4.55); return g;
}
export function field(stage, { x = 0, z = 0, w = 40, d = 30, crop = '#6fae4a', soil = '#8a6a44' } = {}) { const t = TEX2.crops(crop, soil); t.repeat.set(w / 4, d / 4); const m = mesh(new THREE.PlaneGeometry(w, d), toon('#ffffff', t), { cast: false }); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.015, z); stage.add(m); return m; }
export function hills(stage, { z = -150, n = 9, seed = 7, col = '#7fae6a', spread = 400 } = {}) {
  const r = rng(seed); for (let i = 0; i < n; i++) { const s = 30 + r() * 50; const m = mesh(S(s, 24, 12), toon(shade(col, 0.85 + r() * 0.25)), { cast: false }); m.scale.y = 0.35 + r() * 0.2; m.position.set((i / n - 0.5) * spread, -s * 0.12, z - r() * 60); stage.add(m); }
}
export function mountains(stage, { z = -220, n = 7, seed = 3, col = '#8a9ab0', snow = true } = {}) {
  const r = rng(seed); for (let i = 0; i < n; i++) { const h = 50 + r() * 70, x = (i / n - 0.5) * 500; const m = mesh(new THREE.ConeGeometry(h * 0.9, h, 6), toon(shade(col, 0.85 + r() * 0.2)), { cast: false }); m.position.set(x, h / 2, z - r() * 50); stage.add(m); if (snow) { const s = mesh(new THREE.ConeGeometry(h * 0.27, h * 0.3, 6), toon('#f4f6fa'), { cast: false }); s.position.set(x, h * 0.86, m.position.z); stage.add(s); } }
}
export function rock(stage, { x = 0, z = 0, s = 1, col = '#9a968e', seed = 1 } = {}) { const m = mesh(new THREE.DodecahedronGeometry(0.6 * s, 0), toon(col)); const r = rng(seed); m.rotation.set(r() * 3, r() * 3, r() * 3); m.scale.y = 0.7; m.position.set(x, 0.3 * s, z); stage.add(m); return m; }
export function palm(stage, { x = 0, z = 0, s = 1, seed = 1 } = {}) {
  const g = group(stage, { x, z, s }); const r = rng(seed); let px = 0, py = 0;
  for (let i = 0; i < 7; i++) { const seg = put(g, mesh(C(0.2 - i * 0.015, 0.24 - i * 0.015, 0.9, 8), toon(i % 2 ? '#8a6440' : '#7a5636')), px, py + 0.45, 0); px += 0.08; py += 0.85; seg.rotation.z = -0.08; }
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + r(); const lf = mesh(B(2.4, 0.05, 0.5), toon('#3f9a4a')); lf.position.set(px + Math.cos(a) * 1.1, py - 0.3, Math.sin(a) * 1.1); lf.rotation.order = 'YZX'; lf.rotation.set(0, -a, -0.45); g.add(lf); }
  return g;
}
export function bridge(stage, { x = 0, z = 0, rot = 0, len = 120, w = 8, h = 14, col = '#5f7a8a' } = {}) {
  const g = group(stage, { x, z, rot }); const deck = put(g, mesh(B(w, 0.8, len), toon('#7a7f88')), 0, h * 0.45, 0);
  const road = mesh(new THREE.PlaneGeometry(w * 0.8, len), toon('#ffffff', (() => { const t = TEX.asphalt(); t.repeat.set(2, len / 4); return t; })()), { cast: false }); road.rotation.x = -Math.PI / 2; put(g, road, 0, h * 0.45 + 0.41, 0);
  for (const tz of [-len * 0.3, len * 0.3]) for (const sx of [-1, 1]) put(g, mesh(B(0.8, h * 1.6, 0.8), toon(col)), sx * w * 0.55, h * 0.8, tz);
  for (const sx of [-1, 1]) { const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40, zz = -len / 2 + u * len; const k = Math.abs(zz) < len * 0.3 ? (zz / (len * 0.3)) ** 2 : 1 - (Math.abs(zz) - len * 0.3) / (len * 0.2); pts.push(new THREE.Vector3(sx * w * 0.55, h * 0.5 + h * 1.1 * Math.max(0.05, Math.min(1, k)), zz)); } const tube = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.12, 6), toon('#2b2f36')); g.add(tube); }
  return g;
}
export function car(stage, { x = 0, z = 0, rot = 0, col = '#e2453c' } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(1.8, 0.6, 4), toon(col)), 0, 0.6, 0); put(g, mesh(B(1.6, 0.55, 2), toon(shade(col, 0.95))), 0, 1.15, -0.2);
  for (const sz of [-0.7, 0.4]) { const wdw = mesh(B(1.62, 0.4, 0.05), toon('#9fd0f2')); wdw.position.set(0, 1.15, sz + (sz < 0 ? -0.33 : 0.43)); g.add(wdw); }
  for (const [a, b] of [[-1, -1.3], [1, -1.3], [-1, 1.3], [1, 1.3]]) { const w = mesh(C(0.36, 0.36, 0.3, 16), toon('#22252e')); w.rotation.z = Math.PI / 2; put(g, w, a * 0.9, 0.36, b); }
  return g;
}
export function truck(stage, { x = 0, z = 0, rot = 0, col = '#3f7fd9', box = '#f4f1ea', label = '' } = {}) {
  const g = group(stage, { x, z, rot }); put(g, mesh(B(2.2, 1.8, 1.8), toon(col)), 0, 1.4, 2.4); put(g, mesh(B(2.1, 0.6, 0.05), toon('#9fd0f2')), 0, 1.8, 3.31);
  const t = canvasTex(1024, 512, (c, W, H) => { c.fillStyle = box; c.fillRect(0, 0, W, H); if (label) { c.fillStyle = '#c0353a'; c.font = font(140); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, W / 2, H / 2); } });
  put(g, mesh(B(2.4, 2.6, 5), [toon('#ffffff', t), toon('#ffffff', t), toon(box), toon(box), toon(box), toon(box)]), 0, 1.9, -1.1);
  for (const [a, b] of [[-1, 2.4], [1, 2.4], [-1, -0.6], [1, -0.6], [-1, -2.4], [1, -2.4]]) { const w = mesh(C(0.45, 0.45, 0.35, 16), toon('#22252e')); w.rotation.z = Math.PI / 2; put(g, w, a * 1.05, 0.45, b); }
  return g;
}
// an old open truck with a flat bed (bed floor at y = 1.05): put actors or props on it
export function flatbed(stage, { x = 0, z = 0, rot = 0, col = '#5a6a3a' } = {}) {
  const g = group(stage, { x, z, rot }); const c = toon(col), dk = toon(shade(col, 0.75));
  put(g, mesh(B(1.9, 1.3, 1.5), c), 0, 1.45, 1.5); put(g, mesh(B(1.7, 0.75, 1.2), c), 0, 1.15, 2.85); put(g, mesh(B(1.75, 0.5, 0.05), toon('#9fd0f2')), 0, 1.75, 2.26);
  put(g, mesh(B(2.1, 0.12, 3.6), dk), 0, 1.0, -1.1); for (const sx of [-1, 1]) put(g, mesh(B(0.08, 0.35, 3.6), dk), sx * 1.02, 1.2, -1.1); put(g, mesh(B(2.1, 0.35, 0.08), dk), 0, 1.2, -2.88);
  for (const sx of [-1, 1]) { const f = mesh(C(0.55, 0.55, 0.3, 14, 1, false), c); f.rotation.z = Math.PI / 2; put(g, f, sx * 0.95, 0.75, 2.6); }
  for (const [a, b] of [[-1, 2.6], [1, 2.6], [-1, -1.9], [1, -1.9]]) { const w = mesh(C(0.48, 0.48, 0.3, 16), toon('#22252e')); w.rotation.z = Math.PI / 2; put(g, w, a * 0.98, 0.48, b); }
  return g;
}
export function plane(stage, { x = 0, y = 0, z = 0, rot = 0, col = '#f4f4f0', stripe = '#2f6fd6', s = 1, military = false } = {}) {
  const g = group(stage, { x, y, z, rot, s }); const c = military ? '#6a7a5a' : col;
  const body = put(g, mesh(C(1, 0.8, 14, 20), toon(c)), 0, 0, 0); body.rotation.x = Math.PI / 2;
  const nose = put(g, mesh(S(1, 20, 12), toon(c)), 0, 0, 7); nose.scale.z = 1.6;
  const tail = put(g, mesh(new THREE.ConeGeometry(0.8, 4, 20), toon(c)), 0, 0.2, -9); tail.rotation.x = -Math.PI / 2;
  put(g, mesh(B(18, 0.25, 2.6), toon(c)), 0, -0.3, 0.5); put(g, mesh(B(6, 0.2, 1.4), toon(c)), 0, 0.3, -9.6); put(g, mesh(B(0.2, 2.6, 1.8), toon(military ? c : stripe)), 0, 1.6, -9.8);
  if (!military) { put(g, mesh(B(2.02, 0.25, 12), toon(stripe)), 0, -0.1, 0); for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) put(g, mesh(S(0.18, 10, 8), toon('#2c3e58')), sx * 0.97, 0.35, -4 + i); }
  else for (const sx of [-1, 1]) { const p = put(g, mesh(C(0.5, 0.6, 1.6, 14), toon('#4a5a3a')), sx * 4, -0.6, 1.6); p.rotation.x = Math.PI / 2; }
  return g;
}
export function ship(stage, { x = 0, z = 0, rot = 0, len = 20, col = '#6a4630', sails = true, flag = '#2f6fd6' } = {}) {
  const g = group(stage, { x, z, rot }); const hull = new THREE.Shape(); hull.moveTo(-len / 2, 3); hull.quadraticCurveTo(-len / 2 + 2, 0, -len / 4, -0.5); hull.lineTo(len / 3, -0.5); hull.quadraticCurveTo(len / 2, 0.5, len / 2 + 1, 3.5); hull.lineTo(-len / 2, 3);
  const geo = new THREE.ExtrudeGeometry(hull, { depth: len * 0.28, bevelEnabled: false }); geo.translate(0, 0, -len * 0.14);
  const h = put(g, mesh(geo, toon(col)), 0, 0, 0); h.rotation.y = -Math.PI / 2;
  if (sails) for (const [mz, mh] of [[-len * 0.25, 14], [0, 18], [len * 0.25, 13]]) { put(g, mesh(C(0.2, 0.25, mh, 8), toon('#5a3a2a')), 0, 3 + mh / 2, mz); for (const [sy, sw] of [[0.45, 1], [0.75, 0.75]]) { const s = mesh(new THREE.PlaneGeometry(len * 0.3 * sw, mh * 0.26), toon('#f4efe2')); s.material.side = THREE.DoubleSide; s.rotation.y = Math.PI / 2; put(g, s, 0.3, 3 + mh * sy, mz); } }
  if (flag) { const f = mesh(new THREE.PlaneGeometry(2, 1.2), toon(flag)); f.material.side = THREE.DoubleSide; f.rotation.y = Math.PI / 2; put(g, f, 0, 22, 1); }
  return g;
}
export function tent(stage, { x = 0, z = 0, rot = 0, col = '#6a7a4a', s = 1 } = {}) { const g = group(stage, { x, z, rot, s }); const m = mesh(new THREE.CylinderGeometry(0.01, 2.2, 2.4, 4, 1), toon(col)); m.rotation.y = Math.PI / 4; m.scale.set(1, 1, 1.6); put(g, m, 0, 1.2, 0); return g; }
export function flagpole(stage, { x = 0, z = 0, h = 8, draw = null, col = '#e2453c' } = {}) {
  const g = group(stage, { x, z }); put(g, mesh(C(0.07, 0.09, h, 8), toon('#c8ccd2')), 0, h / 2, 0);
  const t = canvasTex(300, 200, (c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); if (draw) draw(c, W, H); }); const f = mesh(new THREE.PlaneGeometry(1.8, 1.2), toon('#ffffff', t)); f.material.side = THREE.DoubleSide; put(g, f, 0.95, h - 0.7, 0); return g;
}
export function leaningTower(stage, { x = 0, z = 0, tilt = 4, floors = 7 } = {}) {
  const g = group(stage, { x, z }); const inner = new THREE.Group(); inner.rotation.z = (-tilt * Math.PI) / 180; g.add(inner);
  for (let i = 0; i < floors; i++) { put(inner, mesh(C(3, 3, 3.6, 28), toon('#f2ece0')), 0, 1.8 + i * 3.8, 0); put(inner, mesh(C(3.25, 3.25, 0.25, 28), toon('#e2dccf')), 0, 3.7 + i * 3.8, 0); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; put(inner, mesh(C(0.12, 0.12, 3, 6), toon('#ffffff')), Math.cos(a) * 3.1, 1.8 + i * 3.8, Math.sin(a) * 3.1); } }
  put(inner, mesh(C(2.2, 2.2, 3, 24), toon('#f2ece0')), 0, floors * 3.8 + 1.5, 0); return g;
}
export function telescope(stage, { x = 0, z = 0, rot = 0, s = 1 } = {}) { const g = group(stage, { x, z, rot, s }); put(g, mesh(B(0.6, 1.2, 0.6), toon('#5a5f6a')), 0, 0.6, 0); const tb = put(g, mesh(C(0.25, 0.35, 2.2, 16), toon('#f4f4f0')), 0, 1.6, 0.4); tb.rotation.x = -0.9; return g; }
export function rocket(stage, { x = 0, z = 0, s = 1, col = '#f4f4f0', fin = '#e2453c' } = {}) {
  const g = group(stage, { x, z, s }); put(g, mesh(C(1, 1, 10, 24), toon(col)), 0, 5, 0); put(g, mesh(new THREE.ConeGeometry(1, 3, 24), toon(fin)), 0, 11.5, 0);
  for (let i = 0; i < 3; i++) { const f = mesh(B(0.15, 2.4, 1.6), toon(fin)); const a = (i / 3) * Math.PI * 2; f.position.set(Math.cos(a) * 1.3, 1.2, Math.sin(a) * 1.3); f.rotation.y = -a; g.add(f); }
  const w = canvasTex(64, 64, (c) => { c.fillStyle = '#9fd0f2'; c.beginPath(); c.arc(32, 32, 26, 0, 7); c.fill(); c.lineWidth = 8; c.strokeStyle = '#151515'; c.stroke(); }); const wm = mesh(new THREE.CircleGeometry(0.45, 20), toon('#ffffff', w)); put(g, wm, 0, 7.5, 1.01); return g;
}
export function stands(stage, { x = 0, z = 0, rot = 0, w = 30, rows = 6, col = '#3f7fd9' } = {}) {
  const g = group(stage, { x, z, rot }); for (let i = 0; i < rows; i++) put(g, mesh(B(w, 0.5, 1), toon(i % 2 ? col : shade(col, 0.85))), 0, 0.25 + i * 0.5, -i * 1); return g;
}

// ---------- crowds: many extras with mixed outfits. returns the actors so you can animate them
const SHIRTS = ['#3f7fd9', '#e2453c', '#3fb36b', '#f2c230', '#d64f8a', '#e8742c', '#7a3fb3', '#f4f4f0', '#2b2f3a', '#5fb3c9'];
export function extra(seed) {
  const r = rng(seed * 13 + 1);
  const hs = ['tuft', 'side', 'curly', 'bun', 'long', 'bald'], hats = [null, null, null, 'cap', 'beanie', 'bowler'];
  return outfit({ shirt: SHIRTS[Math.floor(r() * SHIRTS.length)], pants: ['#33384a', '#3b5b9a', '#5a4a3a', '#2b2f3a'][Math.floor(r() * 4)], skin: SKINS[Math.floor(r() * SKINS.length)], hairStyle: hs[Math.floor(r() * hs.length)], hair: ['#3b2a20', '#7a4a24', '#2b1d14', '#d8b060', '#6b6b6b'][Math.floor(r() * 5)], hat: hats[Math.floor(r() * hats.length)], hatCol: SHIRTS[Math.floor(r() * SHIRTS.length)], build: r() < 0.15 ? 'big' : r() < 0.25 ? 'tall' : 'adult', glasses: r() < 0.2 });
}
export function crowd(stage, { x = 0, z = 0, w = 8, d = 4, n = 14, seed = 1, rows = null, exprs = ['neutral', 'smile', 'shock'], pose = 'idle' } = {}) {
  const r = rng(seed); const list = [];
  for (let i = 0; i < n; i++) {
    const a = new Actor(extra(seed * 100 + i), { seed: seed * 50 + i, scale: 0.92 + r() * 0.14 });
    const px = rows ? (i % Math.ceil(n / rows) / Math.max(1, Math.ceil(n / rows) - 1) - 0.5) * w + (r() - 0.5) * 0.3 : (r() - 0.5) * w, pz = rows ? -Math.floor(i / Math.ceil(n / rows)) * (d / rows) : (r() - 0.5) * d;
    a.at(x + px, 0, z + pz).set({ expr: exprs[Math.floor(r() * exprs.length)], pose, flip: r() < 0.5 }); stage.add(a); list.push(a);
  }
  return list;
}

// a machine gun on a tripod (barrel points along +z). flash: muzzle position for effects = group.userData.muzzle
export function machineGun(stage, { x = 0, y = 0, z = 0, rot = 0, s = 1 } = {}) {
  const g = group(stage, { x, y, z, rot, s }), dark = toon('#3a3d42'), wood = toon('#7a5230');
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; const l = mesh(C(0.025, 0.03, 0.95, 6), dark); l.position.set(Math.cos(a) * 0.28, 0.42, Math.sin(a) * 0.28); l.lookAt(0, 0.95, 0); l.rotateX(Math.PI / 2); g.add(l); }
  const body = put(g, mesh(C(0.09, 0.09, 1.0, 12), dark), 0, 0.92, 0.15); body.rotation.x = Math.PI / 2;
  const shroud = put(g, mesh(C(0.13, 0.13, 0.7, 14), toon('#4a4f56')), 0, 0.92, 0.35); shroud.rotation.x = Math.PI / 2;
  put(g, mesh(C(0.24, 0.24, 0.08, 18), dark), 0, 1.07, -0.05);
  const stock = put(g, mesh(B(0.08, 0.14, 0.45), wood), 0, 0.88, -0.5); stock.rotation.x = 0.15;
  g.userData.muzzle = new THREE.Vector3(0, 0.92, 0.7);
  return g;
}
