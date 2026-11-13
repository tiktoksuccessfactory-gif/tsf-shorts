// Flat graphics on top of the picture (after the 3D look): big titles, numbers that count up, labels, emoji-like stamps.
//   hud: [{ from: 2.1, to: 4.0, text: '1919', y: 0.22, size: 150 }, { from: 5, to: 8, count: [0, 125000000], prefix: '$' }]
import * as THREE from 'three';

const FONT = '"Arial Black", "Arial", sans-serif';
const fmtNum = (n, dec = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const backOut = (u) => { const c = 1.9; const x = u - 1; return 1 + (c + 1) * x * x * x + c * x * x; };

function drawCard(o, text) {
  const size = o.size || 120, pad = o.pad ?? (o.bg ? size * 0.35 : size * 0.12), font = `${o.weight || 900} ${size}px ${o.font || FONT}`;
  const lines = String(text).split('\n');
  const m = document.createElement('canvas').getContext('2d'); m.font = font;
  const tw = Math.max(...lines.map((l) => m.measureText(l).width)), lh = size * 1.08;
  const sub = o.sub ? { size: size * 0.38, text: o.sub } : null;
  if (sub) { m.font = `800 ${sub.size}px ${o.font || FONT}`; sub.w = m.measureText(sub.text).width; }
  const w = Math.ceil(Math.max(tw, sub ? sub.w : 0) + pad * 2 + (o.stroke === false ? 0 : size * 0.2)), h = Math.ceil(lh * lines.length + pad * 2 + (sub ? sub.size * 1.4 : 0) + size * 0.12);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (o.bg) { x.fillStyle = o.bg; const r = Math.min(h / 2, size * 0.35); x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, r); x.fill(); x.lineWidth = Math.max(6, size * 0.07); x.strokeStyle = o.border || '#151515'; x.stroke(); }
  x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  lines.forEach((l, i) => {
    const y = pad + lh * (i + 0.5) + size * 0.04;
    if (o.stroke !== false && !o.bg) { x.lineWidth = size * 0.16; x.strokeStyle = o.stroke || '#151515'; x.strokeText(l, w / 2, y); }
    x.fillStyle = o.color || (o.bg ? '#151515' : '#ffffff'); x.fillText(l, w / 2, y);
  });
  if (sub) { x.font = `800 ${sub.size}px ${o.font || FONT}`; const y = h - pad - sub.size * 0.6; if (!o.bg) { x.lineWidth = sub.size * 0.18; x.strokeStyle = '#151515'; x.strokeText(sub.text, w / 2, y); } x.fillStyle = o.subColor || o.color || (o.bg ? '#151515' : '#ffffff'); x.fillText(sub.text, w / 2, y); }
  return c;
}

export class Hud {
  constructor(W, H) {
    this.W = W; this.H = H; this.k = W / 1080; // sizes are given for a 1080 px wide frame
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
    this.items = []; this.cache = new Map();
  }
  set(list) {
    this.items = (list || []).map((o) => {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); mesh.visible = false; this.scene.add(mesh);
      return { o, mesh };
    });
  }
  tex(o, text) {
    const key = JSON.stringify([o.size, o.bg, o.color, o.stroke, o.font, o.sub, o.pad, text]);
    let t = this.cache.get(key);
    if (!t) { const c = drawCard(o, text); t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.userData = { w: c.width, h: c.height }; this.cache.set(key, t); if (this.cache.size > 200) { const [k0, t0] = this.cache.entries().next().value; t0.dispose(); this.cache.delete(k0); } }
    return t;
  }
  update(t) {
    let any = false;
    for (const it of this.items) {
      const o = it.o, from = o.from ?? 0, to = o.to ?? from + 2;
      if (t < from || t >= to) { it.mesh.visible = false; continue; }
      any = true; const a = t - from, left = to - t;
      let text = o.text ?? '';
      if (o.count) { const d = o.countDur ?? Math.min(1.2, (to - from) * 0.6); const u = Math.min(1, a / d); const e = 1 - Math.pow(1 - u, 3); text = (o.prefix || '') + fmtNum(o.count[0] + (o.count[1] - o.count[0]) * e, o.decimals || 0) + (o.suffix || ''); }
      if (o.type) { const n = Math.floor(a * (o.type === true ? 18 : o.type)); text = String(text).slice(0, n); if (!text) { it.mesh.visible = false; continue; } }
      const tex = this.tex(o, text); const m = it.mesh;
      if (m.material.map !== tex) { m.material.map = tex; m.material.needsUpdate = true; }
      let s = 1, dx = 0, dy = 0, alpha = 1; const anim = o.anim || 'pop';
      if (anim === 'pop') { s = a < 0.22 ? Math.max(0.01, backOut(a / 0.22)) : 1; if (left < 0.12) s *= left / 0.12; }
      else if (anim === 'slide') { const u = Math.min(1, a / 0.25); dx = (1 - (1 - Math.pow(1 - u, 3))) * this.W * (o.from_side === 'right' ? 1 : -1); if (left < 0.15) alpha = left / 0.15; }
      else if (anim === 'fade') { alpha = Math.min(1, a / 0.2, left / 0.2); }
      else if (anim === 'shake') { s = a < 0.15 ? 1.4 - 0.4 * (a / 0.15) : 1; dx = Math.sin(a * 70) * 10 * Math.max(0, 1 - a / 0.4) * this.k; }
      if (o.wobble) dy += Math.sin(t * 3) * 6 * this.k;
      const sc = (o.scale || 1) * this.k;
      m.scale.set(tex.userData.w * sc * s, tex.userData.h * sc * s, 1);
      m.position.set((o.x ?? 0.5) * this.W + dx, (1 - (o.y ?? 0.2)) * this.H + dy, 0);
      m.rotation.z = ((o.rot || 0) * Math.PI) / 180;
      m.material.opacity = alpha; m.visible = true;
    }
    return any;
  }
}
