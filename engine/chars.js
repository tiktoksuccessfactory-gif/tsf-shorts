// TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
// TSF character kit: hand-drawn stickman characters painted with Canvas2D.
// Design: round head (large, ~1/3 of height), marker-black outline with a slight hand wobble, eye shine,
// one comic cel-shade band, clothed torso, stick limbs, mitten hands, round shoes.
// Canvas: 768 x 1024, soles at y = 1000, character centred on x = 384.

export const W = 768, H = 1024, GROUND = 1000;
export const SCALE = 1.3;
export const INK = '#151515';

// ---------- small helpers
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb = ([r, g, b]) => `rgb(${r | 0},${g | 0},${b | 0})`;
export const darken = (c, k) => rgb(hex(c).map((v) => v * k));
export const lighten = (c, k) => rgb(hex(c).map((v) => v + (255 - v) * k));

// wobbly closed path through points (Catmull-Rom), gives the marker feel
const J = (pts, r, amt = 1.8) => pts.map(([x, y]) => [x + (r() - 0.5) * amt, y + (r() - 0.5) * amt]);
function wobblePath(ctx, pts, r, amt = 1.6) {
  const p = r && amt ? J(pts, r, amt) : pts;
  const n = p.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    if (i === 0) ctx.moveTo(p1[0], p1[1]);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  ctx.closePath();
}
const circlePts = (cx, cy, rx, ry, n = 28, rot = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + rot; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });

function inked(ctx, pts, fill, r, lw = 9) {
  wobblePath(ctx, pts, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
}
// comic shade band: a darker copy of the shape, clipped, offset away from the light
function shadeBand(ctx, pts, col, r, dx = 18, dy = 8, k = 0.78) {
  ctx.save(); wobblePath(ctx, pts, null, 0); ctx.clip();
  ctx.beginPath(); ctx.rect(-50, -50, W + 100, H + 100);
  wobblePath(ctx, pts.map(([x, y]) => [x - dx, y - dy]), null, 0);
  ctx.fillStyle = darken(col, k); ctx.fill('evenodd');
  ctx.restore();
}
function stroke(ctx, pts, lw = 9, col = INK) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
// a limb: shoulder/hip -> elbow/knee -> hand/foot with a gentle curve
function limb(ctx, a, b, c, lw) {
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]);
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
}
const polar = (o, len, deg) => [o[0] + Math.sin((deg * Math.PI) / 180) * len, o[1] + Math.cos((deg * Math.PI) / 180) * len];

// ---------- outfits
export const SKINS = ['#ffd9b8', '#f2c49a', '#d9a172', '#a8714a', '#7a4f33'];
export function outfit(o = {}) {
  return { skin: SKINS[0], shirt: '#3f7fd9', pants: '#33384a', shoes: '#2b2622', hair: '#3b2a20', hairStyle: 'tuft', hat: null, hatCol: '#d94444',
    tie: null, glasses: false, mustache: null, apron: null, collar: null, badge: null, build: 'adult', ...o };
}
const BUILD = { adult: { s: 1.0, head: 1.0, torsoW: 1.0, legs: 1.0 }, kid: { s: 0.78, head: 1.12, torsoW: 0.85, legs: 0.8 }, big: { s: 1.08, head: 1.0, torsoW: 1.35, legs: 0.95 }, tall: { s: 1.1, head: 0.95, torsoW: 0.9, legs: 1.2 } };

// ---------- poses: arm angles (deg from straight down, + = outward), elbow bend, legs
export const POSES = {
  idle:     { la: [12, 8], ra: [12, 8], ll: [4, 0], rl: [4, 0] },
  wave:     { la: [12, 8], ra: [150, -40], ll: [4, 0], rl: [4, 0] },
  point:    { la: [12, 8], ra: [95, 0], ll: [4, 0], rl: [4, 0] },
  arms_up:  { la: [160, 15], ra: [160, 15], ll: [10, 0], rl: [10, 0] },
  hips:     { la: [45, -120], ra: [45, -120], ll: [8, 0], rl: [8, 0] },
  shrug:    { la: [70, -95], ra: [70, -95], ll: [4, 0], rl: [4, 0] },
  think:    { la: [20, -60], ra: [35, -150], ll: [4, 0], rl: [4, 0] },
  cheer:    { la: [150, -20], ra: [150, -20], ll: [6, 0], rl: [6, 0] },
  scared:   { la: [110, -110], ra: [110, -110], ll: [14, 10], rl: [14, 10] },
  present:  { la: [12, 8], ra: [70, 20], ll: [4, 0], rl: [4, 0] },
  hold:     { la: [12, 8], ra: [25, 115], ll: [4, 0], rl: [4, 0] },
  carry:    { la: [70, -60], ra: [70, -60], ll: [6, 0], rl: [6, 0] },
  sit:      { la: [25, -40], ra: [25, -40], ll: [8, 0], rl: [8, 0], sit: true, shortLegs: 0.45 },
};
export function walkPose(phase, run = false) {
  const s = Math.sin(phase * Math.PI * 2), c = Math.cos(phase * Math.PI * 2);
  const A = run ? 40 : 22, L = run ? 32 : 20;
  return { la: [18 - s * A, run ? -55 : -10], ra: [18 + s * A, run ? -55 : -10], ll: [s * L, Math.max(0, c) * (run ? 40 : 18)], rl: [-s * L, Math.max(0, -c) * (run ? 40 : 18)], swing: true, bob: Math.abs(c) };
}

// ---------- faces
export const EXPRESSIONS = ['neutral', 'smile', 'grin', 'laugh', 'shock', 'angry', 'smug', 'worried', 'sad', 'sleepy', 'wink', 'determined', 'disgust', 'love'];
function face(ctx, cx, cy, R, expr, o, r, blink = false, talk = false) {
  const ex = R * 0.36, ey = cy - R * 0.02, er = R * 0.085;
  const eye = (x, kind = 'open', look = 0) => {
    if (blink && kind !== 'happy') kind = 'closed';
    if (kind === 'closed') { ctx.beginPath(); ctx.arc(x, ey + 2, er * 1.2, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); return; }
    if (kind === 'happy') { ctx.beginPath(); ctx.arc(x, ey + 6, er * 1.3, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); return; }
    if (kind === 'half') { ctx.save(); ctx.beginPath(); ctx.rect(x - er * 2, ey - er * 0.2, er * 4, er * 3); ctx.clip(); }
    const big = kind === 'wide' ? 1.45 : 1;
    ctx.beginPath(); ctx.ellipse(x + look, ey, er * big, er * 1.4 * big, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(x + look - er * 0.35 * big, ey - er * 0.55 * big, er * 0.38 * big, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    if (kind === 'half') { ctx.restore(); stroke(ctx, [[x - er * 1.6, ey - er * 0.2], [x + er * 1.6, ey - er * 0.2]], 7); }
  };
  const brow = (x, tilt, lift = 0, curve = 0) => {
    const y = ey - R * 0.3 - lift; const w = R * 0.2;
    ctx.beginPath(); ctx.moveTo(x - w, y + tilt); ctx.quadraticCurveTo(x, y - curve, x + w, y - tilt);
    ctx.lineWidth = 10; ctx.strokeStyle = o.hairStyle === 'bald' && !o.brow ? INK : INK; ctx.lineCap = 'round'; ctx.stroke();
  };
  const my = cy + R * 0.42, mx = cx;
  const L = cx - ex, Rr = cx + ex;
  ctx.lineCap = 'round';
  switch (expr) {
    case 'smile': eye(L); eye(Rr); brow(L, 0, 2, 4); brow(Rr, 0, 2, 4); ctx.beginPath(); ctx.arc(mx, my - R * 0.12, R * 0.2, Math.PI * 0.2, Math.PI * 0.8); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'grin': eye(L, 'happy'); eye(Rr, 'happy'); brow(L, -2, 8, 4); brow(Rr, 2, 8, 4);
      ctx.beginPath(); ctx.moveTo(mx - R * 0.3, my - R * 0.08); ctx.quadraticCurveTo(mx, my + R * 0.32, mx + R * 0.3, my - R * 0.08); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); stroke(ctx, [[mx - R * 0.27, my + R * 0.02], [mx + R * 0.27, my + R * 0.02]], 5); break;
    case 'laugh': eye(L, 'happy'); eye(Rr, 'happy'); brow(L, -4, 12, 6); brow(Rr, 4, 12, 6);
      ctx.beginPath(); ctx.moveTo(mx - R * 0.3, my - R * 0.12); ctx.quadraticCurveTo(mx, my + R * 0.45, mx + R * 0.3, my - R * 0.12); ctx.closePath(); ctx.fillStyle = '#5a1f22'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); ctx.clip(); ctx.beginPath(); ctx.ellipse(mx, my + R * 0.22, R * 0.14, R * 0.09, 0, 0, Math.PI * 2); ctx.fillStyle = '#e8606a'; ctx.fill(); ctx.restore(); break;
    case 'shock': eye(L, 'wide'); eye(Rr, 'wide'); brow(L, -6, 20, 10); brow(Rr, 6, 20, 10); ctx.beginPath(); ctx.ellipse(mx, my, R * 0.12, R * 0.17, 0, 0, Math.PI * 2); ctx.fillStyle = '#5a1f22'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'angry': eye(L); eye(Rr); brow(L, -14, -4); brow(Rr, 14, -4); ctx.beginPath(); ctx.arc(mx, my + R * 0.12, R * 0.17, Math.PI * 1.2, Math.PI * 1.8); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'smug': eye(L, 'half'); eye(Rr, 'half'); brow(L, 2, 0); brow(Rr, -10, 10); ctx.beginPath(); ctx.moveTo(mx - R * 0.18, my); ctx.quadraticCurveTo(mx + R * 0.05, my + R * 0.08, mx + R * 0.24, my - R * 0.08); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'worried': eye(L); eye(Rr); brow(L, 10, 6); brow(Rr, -10, 6); ctx.beginPath(); ctx.moveTo(mx - R * 0.2, my + 2); ctx.bezierCurveTo(mx - R * 0.1, my - 8, mx + R * 0.1, my + 10, mx + R * 0.2, my); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'sad': eye(L); eye(Rr); brow(L, 12, 2); brow(Rr, -12, 2); ctx.beginPath(); ctx.arc(mx, my + R * 0.16, R * 0.16, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'sleepy': eye(L, 'closed'); eye(Rr, 'closed'); brow(L, 0, -2); brow(Rr, 0, -2); stroke(ctx, [[mx - R * 0.1, my], [mx + R * 0.1, my]], 7); break;
    case 'wink': eye(L, 'happy'); eye(Rr); brow(L, -2, 4); brow(Rr, 0, 10, 4); ctx.beginPath(); ctx.arc(mx, my - R * 0.12, R * 0.2, Math.PI * 0.2, Math.PI * 0.8); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'determined': eye(L); eye(Rr); brow(L, -9, -2); brow(Rr, 9, -2); stroke(ctx, [[mx - R * 0.16, my + 2], [mx + R * 0.16, my - 4]], 8); break;
    case 'disgust': eye(L, 'half'); eye(Rr); brow(L, -6, 0); brow(Rr, 8, 6); ctx.beginPath(); ctx.moveTo(mx - R * 0.22, my + 4); ctx.lineTo(mx - R * 0.08, my - 4); ctx.lineTo(mx + R * 0.06, my + 4); ctx.lineTo(mx + R * 0.2, my - 4); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'love': { const heart = (x) => { ctx.save(); ctx.translate(x, ey); ctx.scale(er / 10, er / 10); ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-14, -4, -8, -16, 0, -8); ctx.bezierCurveTo(8, -16, 14, -4, 0, 6); ctx.fillStyle = '#e8364a'; ctx.fill(); ctx.restore(); }; heart(L); heart(Rr); brow(L, 0, 8, 4); brow(Rr, 0, 8, 4); ctx.beginPath(); ctx.arc(mx, my - R * 0.12, R * 0.2, Math.PI * 0.2, Math.PI * 0.8); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); break; }
    default: eye(L); eye(Rr); brow(L, 0, 0); brow(Rr, 0, 0); stroke(ctx, [[mx - R * 0.12, my], [mx + R * 0.12, my]], 8);
  }
  if (talk) { // open mouth over the expression's mouth (for lines a character says)
    ctx.beginPath(); ctx.ellipse(mx, my + R * 0.02, R * 0.3, R * 0.2, 0, 0, Math.PI * 2); ctx.fillStyle = o.skin; ctx.fill();
    const happy = ['smile', 'grin', 'laugh', 'wink', 'love', 'smug'].includes(expr), mad = ['angry', 'determined', 'disgust'].includes(expr);
    ctx.beginPath();
    if (happy) { ctx.moveTo(mx - R * 0.2, my - R * 0.06); ctx.quadraticCurveTo(mx, my + R * 0.3, mx + R * 0.2, my - R * 0.06); ctx.closePath(); }
    else if (mad) { ctx.moveTo(mx - R * 0.18, my + R * 0.1); ctx.quadraticCurveTo(mx, my - R * 0.14, mx + R * 0.18, my + R * 0.1); ctx.closePath(); }
    else ctx.ellipse(mx, my + R * 0.02, R * 0.1, R * 0.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5a1f22'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  }
  if (o.mustache) { ctx.beginPath(); ctx.moveTo(mx, my - R * 0.17); ctx.bezierCurveTo(mx - R * 0.15, my - R * 0.28, mx - R * 0.32, my - R * 0.12, mx - R * 0.34, my - R * 0.02); ctx.bezierCurveTo(mx - R * 0.2, my - R * 0.1, mx - R * 0.08, my - R * 0.08, mx, my - R * 0.12); ctx.bezierCurveTo(mx + R * 0.08, my - R * 0.08, mx + R * 0.2, my - R * 0.1, mx + R * 0.34, my - R * 0.02); ctx.bezierCurveTo(mx + R * 0.32, my - R * 0.12, mx + R * 0.15, my - R * 0.28, mx, my - R * 0.17); ctx.fillStyle = o.mustache; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  if (o.glasses) { ctx.lineWidth = 6; ctx.strokeStyle = INK; [L, Rr].forEach((x) => { ctx.beginPath(); ctx.arc(x, ey, er * 2.4, 0, Math.PI * 2); ctx.stroke(); }); stroke(ctx, [[L + er * 2.4, ey], [Rr - er * 2.4, ey]], 6); }
}

// ---------- hair & hats (drawn over the head)
function hair(ctx, cx, cy, R, o, r) {
  const c = o.hair;
  switch (o.hairStyle) {
    case 'tuft': inked(ctx, [[cx - R * 0.35, cy - R * 0.88], [cx - R * 0.1, cy - R * 1.22], [cx + R * 0.05, cy - R * 0.95], [cx + R * 0.3, cy - R * 1.15], [cx + R * 0.32, cy - R * 0.9], [cx, cy - R * 0.98]], c, r, 7); break;
    case 'side': { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); inked(ctx, [[cx - R * 1.1, cy - R * 0.2], [cx - R * 0.9, cy - R * 0.85], [cx - R * 0.2, cy - R * 1.15], [cx + R * 0.7, cy - R * 0.95], [cx + R * 1.1, cy - R * 0.3], [cx + R * 0.6, cy - R * 0.62], [cx - R * 0.1, cy - R * 0.55], [cx - R * 0.75, cy - R * 0.35]], c, r, 8); ctx.restore(); break; }
    case 'curly': for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + (i / 8) * 0.9); inked(ctx, circlePts(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92, R * 0.24, R * 0.24, 14), c, r, 6); } break;
    case 'bun': inked(ctx, circlePts(cx, cy - R * 1.12, R * 0.3, R * 0.26, 18), c, r, 7); { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); inked(ctx, [[cx - R * 1.1, cy - R * 0.1], [cx - R, cy - R * 0.8], [cx, cy - R * 1.12], [cx + R, cy - R * 0.8], [cx + R * 1.1, cy - R * 0.1], [cx + R * 0.7, cy - R * 0.55], [cx, cy - R * 0.68], [cx - R * 0.7, cy - R * 0.55]], c, r, 8); ctx.restore(); } break;
    case 'long': inked(ctx, [[cx - R * 1.05, cy + R * 0.9], [cx - R * 1.12, cy - R * 0.3], [cx - R * 0.6, cy - R * 1.05], [cx + R * 0.6, cy - R * 1.05], [cx + R * 1.12, cy - R * 0.3], [cx + R * 1.05, cy + R * 0.9], [cx + R * 0.75, cy + R * 0.1], [cx + R * 0.3, cy - R * 0.62], [cx - R * 0.3, cy - R * 0.62], [cx - R * 0.75, cy + R * 0.1]], c, r, 8); break;
    case 'bald': break;
  }
}
function hat(ctx, cx, cy, R, o, r) {
  const c = o.hatCol;
  switch (o.hat) {
    case 'cap': inked(ctx, [[cx - R * 0.95, cy - R * 0.35], [cx - R * 0.8, cy - R * 0.95], [cx, cy - R * 1.2], [cx + R * 0.8, cy - R * 0.95], [cx + R * 0.95, cy - R * 0.35]], c, r, 8); inked(ctx, [[cx - R * 0.3, cy - R * 0.38], [cx + R * 1.35, cy - R * 0.3], [cx + R * 1.3, cy - R * 0.18], [cx - R * 0.3, cy - R * 0.25]], darken(c, 0.8), r, 7); break;
    case 'hard': inked(ctx, [[cx - R * 1.15, cy - R * 0.4], [cx - R * 0.9, cy - R * 0.55], [cx - R * 0.75, cy - R * 1.0], [cx, cy - R * 1.25], [cx + R * 0.75, cy - R * 1.0], [cx + R * 0.9, cy - R * 0.55], [cx + R * 1.15, cy - R * 0.4]], c || '#f2c230', r, 8); stroke(ctx, [[cx, cy - R * 1.22], [cx, cy - R * 0.6]], 6); break;
    case 'top': inked(ctx, [[cx - R * 1.0, cy - R * 0.7], [cx + R * 1.0, cy - R * 0.7], [cx + R * 1.0, cy - R * 0.55], [cx - R * 1.0, cy - R * 0.55]], c, r, 7); inked(ctx, [[cx - R * 0.6, cy - R * 0.7], [cx - R * 0.6, cy - R * 1.75], [cx + R * 0.6, cy - R * 1.75], [cx + R * 0.6, cy - R * 0.7]], c, r, 8); ctx.fillStyle = '#c0353a'; ctx.fillRect(cx - R * 0.56, cy - R * 0.9, R * 1.12, R * 0.14); break;
    case 'chef': inked(ctx, [[cx - R * 0.7, cy - R * 0.7], [cx - R * 0.95, cy - R * 1.35], [cx - R * 0.45, cy - R * 1.7], [cx, cy - R * 1.55], [cx + R * 0.45, cy - R * 1.75], [cx + R * 0.95, cy - R * 1.35], [cx + R * 0.7, cy - R * 0.7]], '#ffffff', r, 8); break;
    case 'police': inked(ctx, [[cx - R * 1.05, cy - R * 0.85], [cx - R * 0.8, cy - R * 1.3], [cx + R * 0.8, cy - R * 1.3], [cx + R * 1.05, cy - R * 0.85]], c || '#1f3566', r, 8); inked(ctx, [[cx - R * 0.85, cy - R * 0.85], [cx + R * 0.85, cy - R * 0.85], [cx + R * 0.95, cy - R * 0.62], [cx - R * 0.95, cy - R * 0.62]], INK, r, 6); inked(ctx, circlePts(cx, cy - R * 1.07, R * 0.13, R * 0.13, 12), '#f2c230', r, 4); break;
    case 'beanie': inked(ctx, [[cx - R * 0.98, cy - R * 0.45], [cx - R * 0.85, cy - R * 1.0], [cx, cy - R * 1.22], [cx + R * 0.85, cy - R * 1.0], [cx + R * 0.98, cy - R * 0.45]], c, r, 8); inked(ctx, circlePts(cx, cy - R * 1.3, R * 0.16, R * 0.16, 14), lighten(c, 0.4), r, 5); break;
    case 'crown': inked(ctx, [[cx - R * 0.7, cy - R * 0.75], [cx - R * 0.8, cy - R * 1.35], [cx - R * 0.4, cy - R * 1.05], [cx, cy - R * 1.45], [cx + R * 0.4, cy - R * 1.05], [cx + R * 0.8, cy - R * 1.35], [cx + R * 0.7, cy - R * 0.75]], '#f2c230', r, 7); break;
    case 'bowler': inked(ctx, [[cx - R * 1.1, cy - R * 0.62], [cx + R * 1.1, cy - R * 0.62], [cx + R * 1.0, cy - R * 0.5], [cx - R * 1.0, cy - R * 0.5]], c, r, 7); inked(ctx, [[cx - R * 0.72, cy - R * 0.62], [cx - R * 0.7, cy - R * 1.1], [cx, cy - R * 1.35], [cx + R * 0.7, cy - R * 1.1], [cx + R * 0.72, cy - R * 0.62]], c, r, 8); break;
    case 'slouch': inked(ctx, [[cx - R * 0.95, cy - R * 0.62], [cx - R * 1.15, cy - R * 1.35], [cx - R * 0.8, cy - R * 1.25], [cx - R * 0.6, cy - R * 0.7]], c || '#8a7a52', r, 7);
      inked(ctx, [[cx - R * 0.72, cy - R * 0.62], [cx - R * 0.68, cy - R * 1.05], [cx - R * 0.3, cy - R * 1.32], [cx, cy - R * 1.18], [cx + R * 0.3, cy - R * 1.32], [cx + R * 0.68, cy - R * 1.05], [cx + R * 0.72, cy - R * 0.62]], c || '#8a7a52', r, 8);
      inked(ctx, [[cx - R * 0.72, cy - R * 0.8], [cx + R * 0.72, cy - R * 0.8], [cx + R * 0.72, cy - R * 0.64], [cx - R * 0.72, cy - R * 0.64]], '#3b3020', r, 5);
      inked(ctx, [[cx - R * 0.7, cy - R * 0.66], [cx + R * 1.4, cy - R * 0.7], [cx + R * 1.3, cy - R * 0.52], [cx - R * 0.6, cy - R * 0.5]], c || '#8a7a52', r, 7); break;
    case 'helmet': inked(ctx, [[cx - R * 1.12, cy - R * 0.2], [cx - R * 1.0, cy - R * 0.85], [cx, cy - R * 1.22], [cx + R * 1.0, cy - R * 0.85], [cx + R * 1.12, cy - R * 0.2], [cx + R * 0.9, cy - R * 0.3], [cx - R * 0.9, cy - R * 0.3]], c || '#5c6a3a', r, 8); break;
  }
}

// ---------- full character onto a canvas
// ---------- hand props (drawn in the right hand). hold: 'phone' or { type: 'sign', text: 'HELP' }
export const PROPS = ['phone', 'paper', 'money', 'mug', 'wrench', 'book', 'clipboard', 'briefcase', 'magnifier', 'sign', 'bag', 'umbrella', 'flashlight', 'hammer', 'bottle', 'flag', 'balloon', 'pizza', 'key', 'map'];
function prop(ctx, p, h, r) {
  const [x, y] = h; const k = (pts) => pts.map(([a, b]) => [x + a, y + b]);
  const box = (x0, y0, w, h0, col, lw = 7) => inked(ctx, k([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h0], [x0, y0 + h0]]), col, r, lw);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (p.type) {
    case 'phone': box(-16, -62, 34, 60, '#2b2f3a'); box(-10, -55, 22, 42, '#7fc4f2', 4); break;
    case 'paper': box(-10, -70, 56, 74, '#fbfaf4'); for (let i = 0; i < 4; i++) stroke(ctx, [[x, y - 56 + i * 14], [x + 34, y - 56 + i * 14]], 4); break;
    case 'money': for (let i = 0; i < 3; i++) box(-8 + i * 6, -40 - i * 8, 64, 34, '#7fc46a', 6); stroke(ctx, [[x + 34, y - 72], [x + 34, y - 44]], 4); break;
    case 'mug': box(-6, -52, 44, 50, p.color || '#e2453c'); ctx.beginPath(); ctx.arc(x + 44, y - 28, 13, -Math.PI / 2, Math.PI / 2); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'wrench': stroke(ctx, [[x - 4, y + 10], [x + 30, y - 70]], 16); stroke(ctx, [[x - 4, y + 10], [x + 30, y - 70]], 8, '#a8b0bc'); inked(ctx, circlePts(x + 32, y - 76, 18, 18, 14), '#a8b0bc', r, 7); break;
    case 'book': box(-8, -66, 52, 68, p.color || '#3f7fd9'); stroke(ctx, [[x + 2, y - 66], [x + 2, y + 2]], 5); break;
    case 'clipboard': box(-10, -78, 56, 80, '#b8875a'); box(-4, -70, 44, 64, '#fbfaf4', 4); box(6, -84, 24, 12, '#7a7f88', 4); break;
    case 'briefcase': box(-34, 6, 70, 52, p.color || '#6a4630'); stroke(ctx, [[x - 12, y + 6], [x - 12, y - 6], [x + 14, y - 6], [x + 14, y + 6]], 7); break;
    case 'magnifier': stroke(ctx, [[x, y], [x + 26, y - 40]], 12); ctx.beginPath(); ctx.arc(x + 42, y - 66, 30, 0, Math.PI * 2); ctx.fillStyle = 'rgba(190,230,255,0.75)'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke(); break;
    case 'sign': { stroke(ctx, [[x, y + 30], [x, y - 120]], 12, '#8a6440'); const w = 270, h0 = 150; box(-w / 2, -120 - h0, w, h0, p.bg || '#fbfaf4', 9);
      ctx.fillStyle = p.color || '#c0353a'; ctx.font = 'bold ' + (p.size || 64) + 'px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      String(p.text || '!').split('\n').forEach((l, i, a) => ctx.fillText(l, x, y - 120 - h0 / 2 + (i - (a.length - 1) / 2) * (p.size || 64))); break; }
    case 'bag': inked(ctx, circlePts(x + 6, y + 40, 46, 42, 20), '#c9a66b', r, 7); stroke(ctx, [[x - 10, y + 2], [x + 22, y + 2]], 7);
      ctx.fillStyle = INK; ctx.font = 'bold 44px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', x + 6, y + 44); break;
    case 'umbrella': stroke(ctx, [[x, y + 10], [x, y - 150]], 8); inked(ctx, k([[-110, -150], [-80, -200], [0, -225], [80, -200], [110, -150], [55, -162], [0, -152], [-55, -162]]), p.color || '#e2453c', r, 7); break;
    case 'flashlight': box(-10, -44, 22, 54, '#3a3f4a'); ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.moveTo(x - 10, y - 44); ctx.lineTo(x - 70, y - 220); ctx.lineTo(x + 90, y - 220); ctx.lineTo(x + 12, y - 44); ctx.fill(); ctx.restore(); break;
    case 'hammer': stroke(ctx, [[x, y + 20], [x + 10, y - 80]], 12, '#a8743f'); box(-26, -110, 72, 30, '#7a7f88'); break;
    case 'bottle': box(-14, -60, 30, 62, p.color || '#5fae6a'); box(-6, -82, 14, 24, p.color || '#5fae6a', 6); break;
    case 'flag': stroke(ctx, [[x, y + 30], [x, y - 170]], 8); inked(ctx, k([[0, -170], [110, -150], [0, -110]]), p.color || '#e2453c', r, 7); break;
    case 'balloon': stroke(ctx, [[x, y], [x + 10, y - 150]], 4); inked(ctx, circlePts(x + 10, y - 200, 46, 56, 22), p.color || '#e2453c', r, 7); break;
    case 'pizza': inked(ctx, k([[-20, -10], [70, -50], [60, 20]]), '#f2c230', r, 7); for (const [a, b] of [[30, -18], [48, -2]]) inked(ctx, circlePts(x + a, y + b, 8, 8, 10), '#c0453a', r, 4); break;
    case 'key': inked(ctx, circlePts(x + 6, y - 40, 20, 20, 14), '#f2c230', r, 7); stroke(ctx, [[x + 6, y - 20], [x + 6, y + 40]], 9); stroke(ctx, [[x + 6, y + 26], [x + 22, y + 26]], 8); break;
    case 'map': box(-60, -90, 120, 90, '#f4e6b8'); stroke(ctx, [[x - 40, y - 30], [x - 10, y - 60], [x + 20, y - 40], [x + 44, y - 70]], 5, '#c0353a'); break;
  }
}

export function drawCharacter(ctx, o, { pose = 'idle', expr = 'neutral', seed = 1, facing = 0, blink = false, talk = false, hold = null } = {}) {
  const P = typeof pose === 'string' ? POSES[hold && pose === 'idle' ? 'hold' : pose] || POSES.idle : pose;
  const B = BUILD[o.build] || BUILD.adult;
  const r = rng(seed * 7919 + 13);
  ctx.save();
  ctx.translate(W / 2, GROUND); ctx.scale(B.s * SCALE, B.s * SCALE); ctx.translate(-W / 2, -GROUND);
  const cx = W / 2 + facing * 6;
  const R = 112 * B.head;
  const legLen = 250 * B.legs * (P.shortLegs || 1);
  const bob = (P.bob || 0) * 10;
  const hipY = GROUND - legLen - 10 + bob * 0.4 + 0;
  const torsoH = 200, tw = 76 * B.torsoW, bw = 92 * B.torsoW;
  const shY = hipY - torsoH + 26;
  const headY = hipY - torsoH - R * 0.78;
  const lw = 9;
  // legs (behind torso)
  const hips = [[cx - 32 * B.torsoW, hipY - 10], [cx + 32 * B.torsoW, hipY - 10]];
  const legEnd = (h, [ang, bend], side) => {
    const knee = polar(h, legLen * 0.52, ang * side);
    const foot = polar(knee, legLen * 0.5, (ang - bend) * side);
    return [knee, foot];
  };
  const shoe = (f, side) => { inked(ctx, circlePts(f[0] + side * 14, f[1] - 4, 30, 17, 18), o.shoes, r, 7); };
  [[hips[0], P.ll, -1], [hips[1], P.rl, 1]].forEach(([h, L, side]) => {
    const [k, f] = legEnd(h, L, side);
    limb(ctx, h, k, f, lw + 2);
    shoe(f, side);
  });
  // torso: shirt shape (rounded trapezoid) with pants band
  const torso = [[cx - tw, shY - 6], [cx - tw * 0.55, shY - 26], [cx, shY - 30], [cx + tw * 0.55, shY - 26], [cx + tw, shY - 6], [cx + bw, hipY - 40], [cx + bw * 0.96, hipY + 6], [cx, hipY + 12], [cx - bw * 0.96, hipY + 6], [cx - bw, hipY - 40]];
  const T = J(torso, r);
  wobblePath(ctx, T, null, 0); ctx.fillStyle = o.shirt; ctx.fill();
  shadeBand(ctx, T, o.shirt, null, 26, 6, 0.8);
  // pants band
  ctx.save(); wobblePath(ctx, T, null, 0); ctx.clip();
  ctx.fillStyle = o.pants; ctx.fillRect(0, hipY - 46, W, 80);
  ctx.fillStyle = darken(o.pants, 0.78); ctx.fillRect(cx + bw * 0.45, hipY - 46, W, 80);
  stroke(ctx, [[cx - bw - 10, hipY - 46], [cx + bw + 10, hipY - 46]], 7);
  ctx.restore();
  wobblePath(ctx, T, null, 0); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  // apron / collar / tie / badge
  if (o.apron) { const ap = [[cx - tw * 0.7, shY + 30], [cx + tw * 0.7, shY + 30], [cx + bw * 0.8, hipY + 4], [cx - bw * 0.8, hipY + 4]]; inked(ctx, ap, o.apron, r, 7); }
  if (o.collar) { inked(ctx, [[cx - 34, shY - 26], [cx, shY + 8], [cx - 6, shY - 30]], o.collar, r, 5); inked(ctx, [[cx + 34, shY - 26], [cx, shY + 8], [cx + 6, shY - 30]], o.collar, r, 5); }
  if (o.tie) inked(ctx, [[cx - 10, shY - 22], [cx + 10, shY - 22], [cx + 15, shY + 70], [cx, shY + 92], [cx - 15, shY + 70]], o.tie, r, 6);
  if (o.badge) inked(ctx, circlePts(cx - tw * 0.55, shY + 34, 14, 14, 12), o.badge, r, 5);
  // arms
  const shoulders = [[cx - tw + 6, shY + 4], [cx + tw - 6, shY + 4]];
  const armLen = 210, hands = [];
  [[shoulders[0], P.la, -1], [shoulders[1], P.ra, 1]].forEach(([s, [ang, bend], side]) => {
    const el = polar(s, armLen * 0.5, ang * side);
    const hand = polar(el, armLen * 0.5, (ang + bend) * side);
    limb(ctx, s, el, hand, lw + 1);
    inked(ctx, circlePts(hand[0], hand[1], 22, 22, 16), o.skin, r, 7);
    hands.push(hand);
  });
  if (hold) prop(ctx, typeof hold === 'string' ? { type: hold } : hold, hands[1], r);
  // neck + head
  const head = circlePts(cx, headY, R, R * 0.97, 30);
  if (o.hairStyle === 'long') hair(ctx, cx, headY, R, o, r);
  const HD = J(head, r);
  wobblePath(ctx, HD, null, 0); ctx.fillStyle = o.skin; ctx.fill();
  shadeBand(ctx, HD, o.skin, null, 30, 18, 0.88);
  wobblePath(ctx, HD, null, 0); ctx.lineWidth = lw + 1; ctx.strokeStyle = INK; ctx.stroke();
  // cheeks
  ctx.globalAlpha = 0.28; ctx.fillStyle = '#ff7a7a';
  [[cx - R * 0.55, headY + R * 0.28], [cx + R * 0.55, headY + R * 0.28]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, R * 0.13, R * 0.08, 0, 0, Math.PI * 2); ctx.fill(); });
  ctx.globalAlpha = 1;
  if (o.hairStyle !== 'long') hair(ctx, cx, headY, R, o, r);
  face(ctx, cx + facing * R * 0.12, headY, R, expr, o, r, blink, talk);
  if (o.hat) hat(ctx, cx, headY, R, o, r);
  ctx.restore();
  const k = B.s * SCALE;
  return { headY, hipY, top: GROUND - (GROUND - (headY - R)) * k, headCy: GROUND - (GROUND - headY) * k, R: R * k };
}

export function makeCanvas() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
export function characterCanvas(o, opts) { const c = makeCanvas(); drawCharacter(c.getContext('2d'), o, opts); return c; }

// ready-made cast
export const CAST = {
  scientist: outfit({ shirt: '#f4f4f0', pants: '#4a4f5c', tie: '#2f6fd6', glasses: true, hairStyle: 'side', hair: '#6b6b6b', collar: '#ffffff' }),
  worker: outfit({ shirt: '#e8742c', pants: '#2f4d7a', hat: 'hard', hatCol: '#f2c230', skin: SKINS[1], hairStyle: 'bald' }),
  boss: outfit({ shirt: '#2b2f3a', pants: '#22252e', tie: '#c0353a', hat: 'top', hatCol: '#22252e', mustache: '#3b2a20', build: 'big', skin: SKINS[0], collar: '#ffffff' }),
  cop: outfit({ shirt: '#2f4f8f', pants: '#1f2d4d', hat: 'police', badge: '#f2c230', skin: SKINS[2] }),
  chef: outfit({ shirt: '#ffffff', pants: '#3a3a3a', hat: 'chef', apron: '#f4f4f0', mustache: '#2b1d14', skin: SKINS[1] }),
  kid: outfit({ shirt: '#3fb36b', pants: '#3b5b9a', hat: 'cap', hatCol: '#e2453c', build: 'kid', skin: SKINS[0] }),
  woman: outfit({ shirt: '#d64f8a', pants: '#2e3550', hairStyle: 'long', hair: '#7a4a24', skin: SKINS[1] }),
  farmer: outfit({ shirt: '#c0453a', pants: '#3b5b9a', hat: 'bowler', hatCol: '#7a5a3a', mustache: '#a8a8a8', skin: SKINS[2], apron: null }),
  soldier: outfit({ shirt: '#5c6a3a', pants: '#3e4630', hat: 'helmet', hatCol: '#4e5a32', skin: SKINS[3] }),
  king: outfit({ shirt: '#7a3fb3', pants: '#3a2a5a', hat: 'crown', mustache: '#d8d0c0', build: 'big', skin: SKINS[0] }),
  student: outfit({ shirt: '#f2c230', pants: '#33384a', hairStyle: 'curly', hair: '#2b1d14', skin: SKINS[4], hat: 'beanie', hatCol: '#3f7fd9' }),
  grandma: outfit({ shirt: '#8fb3d9', pants: '#5a4a6a', hairStyle: 'bun', hair: '#d8d8d8', glasses: true, skin: SKINS[0] }),
};

// ---------- reaction bubbles above a head: '!', '?', '!?', '...', 'heart', 'anger', 'zzz', 'sweat', 'idea', '$', 'note', or { text: 'HELP!' }
export const BUBBLES = ['!', '?', '!?', '...', 'heart', 'anger', 'zzz', 'sweat', 'idea', '$', 'note'];
export function drawBubble(kind) {
  const isText = typeof kind === 'object' && kind.text;
  const c = document.createElement('canvas'); c.width = isText ? 640 : 256; c.height = isText ? 360 : 256; const x = c.getContext('2d');
  x.lineJoin = 'round'; x.lineCap = 'round';
  const r = rng(String(isText ? kind.text : kind).length * 31 + 7);
  const ink = (pts, fill, lw = 10) => inked(x, pts, fill, r, lw);
  const big = (t, col, size = 170, y = 132) => { x.font = `900 ${size}px Arial Black, Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 22; x.strokeStyle = INK; x.strokeText(t, 128, y); x.fillStyle = col; x.fillText(t, 128, y); };
  if (isText) {
    const W0 = c.width, H0 = c.height; x.beginPath(); x.roundRect(14, 14, W0 - 28, H0 - 90, 60); x.moveTo(W0 * 0.3, H0 - 78); x.lineTo(W0 * 0.22, H0 - 14); x.lineTo(W0 * 0.42, H0 - 78);
    x.fillStyle = kind.bg || '#ffffff'; x.fill(); x.lineWidth = 12; x.strokeStyle = INK; x.stroke();
    x.fillStyle = kind.bg || '#ffffff'; x.fillRect(W0 * 0.3 + 4, H0 - 92, W0 * 0.12 - 8, 20);
    const lines = String(kind.text).split('\n'); let size = kind.size || 96; x.font = `900 ${size}px Arial Black, Arial`;
    while (size > 30 && Math.max(...lines.map((l) => x.measureText(l).width)) > W0 - 90) { size -= 4; x.font = `900 ${size}px Arial Black, Arial`; }
    x.fillStyle = kind.color || INK; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((l, i) => x.fillText(l, W0 / 2, (H0 - 76) / 2 + 14 + (i - (lines.length - 1) / 2) * size * 1.05));
    return c;
  }
  switch (kind) {
    case '!': big('!', '#e2453c'); break;
    case '?': big('?', '#3f7fd9'); break;
    case '!?': big('!?', '#f2c230', 150); break;
    case '...': x.beginPath(); x.roundRect(20, 70, 216, 120, 60); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke(); for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(78 + i * 50, 130, 14, 0, Math.PI * 2); x.fillStyle = INK; x.fill(); } break;
    case 'heart': x.save(); x.translate(128, 140); x.scale(7, 7); x.beginPath(); x.moveTo(0, 10); x.bezierCurveTo(-18, -2, -10, -18, 0, -8); x.bezierCurveTo(10, -18, 18, -2, 0, 10); x.restore(); x.fillStyle = '#e8364a'; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke(); break;
    case 'anger': x.strokeStyle = '#e2453c'; x.lineWidth = 22; for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { x.beginPath(); x.moveTo(128 + a * 22, 128 + b * 70); x.quadraticCurveTo(128 + a * 26, 128 + b * 26, 128 + a * 70, 128 + b * 22); x.stroke(); } break;
    case 'zzz': x.font = '900 90px Arial Black, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; [[90, 180, 70], [140, 120, 90], [190, 60, 110]].forEach(([a, b, s]) => { x.font = `900 ${s}px Arial Black, Arial`; x.lineWidth = 14; x.strokeStyle = INK; x.strokeText('Z', a, b); x.fillStyle = '#7fc4f2'; x.fillText('Z', a, b); }); break;
    case 'sweat': x.beginPath(); x.moveTo(128, 30); x.bezierCurveTo(200, 130, 190, 220, 128, 222); x.bezierCurveTo(66, 220, 56, 130, 128, 30); x.fillStyle = '#7fc4f2'; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.ellipse(108, 160, 12, 24, -0.3, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); break;
    case 'idea': ink(circlePts(128, 110, 70, 74, 24), '#ffe066', 10); ink([[100, 176], [156, 176], [150, 226], [106, 226]], '#a8b0bc', 9); x.strokeStyle = '#f2c230'; x.lineWidth = 10; for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.15); x.beginPath(); x.moveTo(128 + Math.cos(a) * 92, 110 + Math.sin(a) * 92); x.lineTo(128 + Math.cos(a) * 120, 110 + Math.sin(a) * 120); x.stroke(); } break;
    case '$': big('$', '#3fb36b'); break;
    case 'note': x.lineWidth = 12; x.strokeStyle = INK; x.beginPath(); x.moveTo(110, 190); x.lineTo(110, 50); x.lineTo(190, 30); x.lineTo(190, 170); x.stroke(); for (const [a, b] of [[88, 192], [168, 172]]) { x.beginPath(); x.ellipse(a, b, 28, 20, -0.4, 0, Math.PI * 2); x.fillStyle = INK; x.fill(); } break;
    default: big(String(kind).slice(0, 3), '#ffffff', 120);
  }
  return c;
}

// helpers shared with the animal kit
export const draw = { rng, J, wobblePath, circlePts, inked, shadeBand, stroke, limb, polar };
