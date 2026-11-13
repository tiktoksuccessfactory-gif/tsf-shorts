// Animals in the same hand-drawn style. Same card size as people (768 x 1024, ground at y = 1000),
// so they use the same Actor:  new Actor(ANIMALS.dog, { seed: 2 })   poses: idle | walk | run | scared | down | sit
// expressions: neutral | happy | shock | angry | sad. They face right; set flip: true to face left.
import { W, GROUND, INK, darken, draw } from './chars.js';
const { rng, J, wobblePath, circlePts, inked, shadeBand, stroke } = draw;

const SPEC = {
  dog:     { body: [150, 78], head: 66, leg: 120, col: '#c98a4b', belly: '#f0d2a8', ear: 'flop', snout: 46, tail: 'up', nose: INK },
  cat:     { body: [130, 62], head: 60, leg: 100, col: '#8a8f99', belly: '#d9dce2', ear: 'point', snout: 18, tail: 'curl', whisk: true },
  rat:     { body: [92, 46], head: 40, leg: 46, col: '#9a8f86', belly: '#d8cfc6', ear: 'round', snout: 34, tail: 'long', whisk: true, s: 0.6 },
  cow:     { body: [210, 112], head: 76, leg: 140, col: '#f4f1ea', belly: '#f4f1ea', ear: 'side', snout: 40, tail: 'thin', spots: '#2b2b2b', horns: true, s: 1.1 },
  pig:     { body: [170, 100], head: 70, leg: 80, col: '#f2a8b8', belly: '#f8c4cf', ear: 'flop', snout: 26, tail: 'curl', nose: '#e88aa0', flatNose: true },
  horse:   { body: [190, 86], head: 60, leg: 200, col: '#8a5a3a', belly: '#a8744e', ear: 'point', snout: 74, tail: 'long', mane: '#3b2a20', neck: 110, s: 1.0 },
  emu:     { bird: true, body: [120, 92], head: 34, leg: 250, neck: 230, col: '#6b5a4a', beak: '#3b3a36', fluffy: true },
  chicken: { bird: true, body: [90, 72], head: 40, leg: 70, neck: 50, col: '#fbf7ee', beak: '#f2a43a', comb: '#e2453c', s: 0.7 },
  pigeon:  { bird: true, body: [70, 46], head: 32, leg: 36, neck: 34, col: '#8a93a8', beak: '#3b3a36', s: 0.5 },
};

function eye(ctx, x, y, r, expr, blink) {
  if (blink || expr === 'happy') { ctx.beginPath(); ctx.arc(x, y + 3, r * 1.2, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); return; }
  const k = expr === 'shock' ? 1.45 : 1;
  ctx.beginPath(); ctx.ellipse(x, y, r * k, r * 1.35 * k, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * 0.35 * k, y - r * 0.5 * k, r * 0.4 * k, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  if (expr === 'angry') stroke(ctx, [[x - r * 2, y - r * 2.6], [x + r * 1.6, y - r * 1.4]], 8);
  if (expr === 'sad') stroke(ctx, [[x - r * 1.8, y - r * 1.6], [x + r * 1.6, y - r * 2.6]], 8);
}

export function drawAnimal(ctx, o, { pose = 'idle', expr = 'neutral', seed = 1, blink = false, talk = false } = {}) {
  const S = SPEC[o.species] || SPEC.dog, r = rng(seed * 7919 + 101);
  const col = o.col || S.col, k = (S.s || 1) * (o.size || 1);
  const ph = typeof pose === 'object' ? pose.walk : pose === 'walk' || pose === 'run' ? 0 : null;
  const run = typeof pose === 'object' ? pose.run : pose === 'run';
  ctx.save(); ctx.translate(W / 2, GROUND); ctx.scale(k, k); ctx.translate(-W / 2, -GROUND);
  let cx = W / 2; const lw = 9;
  let top, headCx, headCy;
  const scared = pose === 'scared', down = pose === 'down', sit = pose === 'sit';
  const hop = scared ? 40 : run ? Math.abs(Math.sin((ph || 0) * Math.PI * 2)) * 18 : 0;
  if (S.bird) {
    const legL = S.leg, bodyY = GROUND - legL - S.body[1] * 0.55 - hop;
    // legs
    [-1, 1].forEach((sd, i) => { const a = ph != null ? Math.sin((ph + i * 0.5) * Math.PI * 2) * (run ? 34 : 22) : scared ? sd * 18 : 0; const hip = [cx + sd * 14, bodyY + S.body[1] * 0.5]; const knee = [hip[0] + a * 0.4 + 10, hip[1] + legL * 0.5]; const foot = [hip[0] + a, GROUND - hop * 0.2 - 6];
      stroke(ctx, [hip, knee, foot], lw); stroke(ctx, [[foot[0] - 4, foot[1]], [foot[0] + 26, foot[1]]], lw); stroke(ctx, [[foot[0], foot[1]], [foot[0] + 18, foot[1] - 10]], 6); });
    // body
    const B = circlePts(cx, bodyY, S.body[0], S.body[1], 26);
    if (S.fluffy) B.forEach((p, i) => { if (i % 2) { p[0] += (p[0] - cx) * 0.08; p[1] += (p[1] - bodyY) * 0.08; } });
    inked(ctx, J(B, r), col, r, lw + 1); shadeBand(ctx, B, col, null, 18, 10, 0.84);
    stroke(ctx, [[cx - S.body[0] * 0.3, bodyY - 6], [cx + S.body[0] * 0.25, bodyY + 14]], 6); // wing line
    // neck + head
    const nb = [cx + S.body[0] * 0.7, bodyY - S.body[1] * 0.5];
    headCx = nb[0] + (down ? 60 : 12); headCy = down ? GROUND - S.head - 20 : nb[1] - S.neck;
    ctx.beginPath(); ctx.moveTo(nb[0] - 16, nb[1] + 10); ctx.quadraticCurveTo(headCx - 30, (nb[1] + headCy) / 2, headCx - 12, headCy + S.head * 0.4); ctx.lineTo(headCx + 12, headCy + S.head * 0.5); ctx.quadraticCurveTo(headCx - 8, (nb[1] + headCy) / 2, nb[0] + 18, nb[1] + 14);
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
    inked(ctx, circlePts(headCx, headCy, S.head, S.head * 0.92, 22), col, r, lw);
    inked(ctx, [[headCx + S.head * 0.8, headCy - 8], [headCx + S.head * 1.9, headCy + 4], [headCx + S.head * 0.8, headCy + 16]], S.beak, r, 7);
    if (talk) inked(ctx, [[headCx + S.head * 0.85, headCy + 8], [headCx + S.head * 1.6, headCy + 26], [headCx + S.head * 0.8, headCy + 20]], S.beak, r, 6);
    if (S.comb) inked(ctx, [[headCx - 18, headCy - S.head * 0.8], [headCx - 10, headCy - S.head * 1.5], [headCx, headCy - S.head * 0.95], [headCx + 10, headCy - S.head * 1.45], [headCx + 18, headCy - S.head * 0.8]], S.comb, r, 6);
    eye(ctx, headCx + S.head * 0.3, headCy - S.head * 0.15, Math.max(7, S.head * 0.17), expr, blink);
    top = headCy - S.head * (S.comb ? 1.5 : 1);
  } else {
    const legL = sit ? S.leg * 0.4 : S.leg, bodyY = GROUND - legL - S.body[1] * 0.6 - hop;
    const bw = S.body[0], bh = S.body[1]; cx = W / 2 - bw * 0.22;
    // tail
    const tb = [cx - bw * 0.92, bodyY - bh * 0.2];
    if (S.tail === 'up') stroke(ctx, [tb, [tb[0] - 40, tb[1] - 50 - (scared ? 30 : 0)], [tb[0] - 30, tb[1] - 90]], 14);
    else if (S.tail === 'curl') { ctx.beginPath(); ctx.moveTo(tb[0], tb[1]); ctx.bezierCurveTo(tb[0] - 70, tb[1] - 10, tb[0] - 60, tb[1] - 90, tb[0] - 20, tb[1] - 80); ctx.lineWidth = S.species === 'pig' ? 8 : 14; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); }
    else if (S.tail === 'long') { ctx.beginPath(); ctx.moveTo(tb[0], tb[1]); ctx.bezierCurveTo(tb[0] - 80, tb[1] + 10, tb[0] - 90, tb[1] + 80, tb[0] - 150, tb[1] + 60); ctx.lineWidth = S.mane ? 26 : 8; ctx.strokeStyle = S.mane || INK; ctx.lineCap = 'round'; ctx.stroke(); }
    else stroke(ctx, [tb, [tb[0] - 30, tb[1] + 60], [tb[0] - 36, tb[1] + 90]], 7);
    // legs (back pair darker, behind)
    const legs = [[-0.6, 0], [0.55, 0.5], [-0.45, 0.5], [0.7, 0]];
    legs.forEach(([fx, off], i) => {
      const a = ph != null ? Math.sin((ph + off) * Math.PI * 2) * (run ? 38 : 22) : scared ? (fx < 0 ? -20 : 20) : 0;
      const hip = [cx + fx * bw, bodyY + bh * 0.5]; const foot = [hip[0] + a, GROUND - 4 - (sit && fx < 0 ? 0 : 0)];
      const thick = S.leg > 150 ? 24 : 22, c = i < 2 ? darken(col, 0.85) : col;
      if (sit && fx < 0) { inked(ctx, circlePts(hip[0] + 20, GROUND - 40, 60, 40, 16), c, r, lw); return; }
      ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(foot[0], foot[1]); ctx.lineWidth = thick + 18; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
      ctx.lineWidth = thick; ctx.strokeStyle = c; ctx.stroke();
      if (S.horns || S.species === 'horse') { ctx.beginPath(); ctx.moveTo(foot[0] - 12, foot[1] - 14); ctx.lineTo(foot[0] + 12, foot[1] - 14); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); }
    });
    // body
    const B = circlePts(cx, bodyY, bw, bh, 30, 0).map(([x, y]) => [x, sit ? y + (x - cx) * -0.25 : y]);
    inked(ctx, J(B, r), col, r, lw + 1);
    shadeBand(ctx, B, col, null, 22, 12, 0.84);
    if (S.spots) { ctx.save(); wobblePath(ctx, B, null, 0); ctx.clip(); for (const [a, b, s] of [[-0.4, -0.3, 40], [0.2, 0.1, 52], [0.55, -0.4, 30], [-0.1, 0.5, 34]]) inked(ctx, circlePts(cx + a * bw, bodyY + b * bh, s * 1.2, s, 12), S.spots, r, 0.1); ctx.restore(); wobblePath(ctx, B, null, 0); ctx.lineWidth = lw + 1; ctx.strokeStyle = INK; ctx.stroke(); }
    if (scared) for (let i = 0; i < 7; i++) { const a = Math.PI * (1.15 + i * 0.12); stroke(ctx, [[cx + Math.cos(a) * bw * 0.9, bodyY + Math.sin(a) * bh * 0.9], [cx + Math.cos(a) * bw * 1.12, bodyY + Math.sin(a) * bh * 1.2]], 7); }
    // neck + head
    const neck = S.neck || 0;
    headCx = cx + bw * 0.9 + S.head * 0.35; headCy = down ? GROUND - S.head * 1.1 : sit ? bodyY - bh * 1.1 - neck * 0.6 : bodyY - bh * 0.55 - neck * 0.75;
    if (neck) { const nk = [[cx + bw * 0.55, bodyY - bh * 0.5], [headCx - S.head * 0.5, headCy - S.head * 0.2], [headCx + S.head * 0.3, headCy + S.head * 0.5], [cx + bw * 0.95, bodyY + bh * 0.1]]; inked(ctx, nk, col, r, lw); if (S.mane) stroke(ctx, [[cx + bw * 0.55, bodyY - bh * 0.6], [headCx - S.head * 0.6, headCy - S.head * 0.4]], 22, S.mane); }
    if (S.ear === 'point') for (const dx of [-0.45, 0.15]) inked(ctx, [[headCx + dx * S.head, headCy - S.head * 0.6], [headCx + (dx + 0.15) * S.head, headCy - S.head * 1.45], [headCx + (dx + 0.45) * S.head, headCy - S.head * 0.7]], col, r, 7);
    if (S.ear === 'round') inked(ctx, circlePts(headCx - S.head * 0.3, headCy - S.head * 0.8, S.head * 0.42, S.head * 0.42, 14), '#e8a8b0', r, 7);
    if (S.horns) for (const dx of [-0.5, 0.2]) inked(ctx, [[headCx + dx * S.head, headCy - S.head * 0.7], [headCx + (dx - 0.15) * S.head, headCy - S.head * 1.3], [headCx + (dx + 0.25) * S.head, headCy - S.head * 0.8]], '#e8dcc0', r, 6);
    const H0 = circlePts(headCx, headCy, S.head, S.head * 0.92, 24);
    inked(ctx, J(H0, r), col, r, lw); shadeBand(ctx, H0, col, null, 14, 8, 0.86);
    // snout
    const sx = headCx + S.head * 0.75, sy = headCy + S.head * 0.25;
    if (S.flatNose) { inked(ctx, circlePts(sx + 8, sy, S.snout * 0.7, S.snout * 0.9, 16), S.nose, r, 7); for (const d of [-8, 8]) { ctx.beginPath(); ctx.ellipse(sx + 8, sy + d, 5, 7, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); } }
    else { inked(ctx, circlePts(sx + S.snout * 0.3, sy, S.snout, S.snout * 0.62, 16), S.belly, r, 7); ctx.beginPath(); ctx.ellipse(sx + S.snout * 1.15, sy - S.snout * 0.18, 11, 9, 0, 0, Math.PI * 2); ctx.fillStyle = S.nose || INK; ctx.fill(); }
    if (talk || expr === 'shock') { ctx.beginPath(); ctx.ellipse(sx + S.snout * 0.4, sy + S.snout * 0.55, 14, talk ? 12 : 16, 0, 0, Math.PI * 2); ctx.fillStyle = '#5a1f22'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
    else if (expr === 'happy') { ctx.beginPath(); ctx.arc(sx + S.snout * 0.3, sy + S.snout * 0.3, 16, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
    if (S.whisk) for (const d of [-10, 6]) stroke(ctx, [[sx + S.snout * 0.6, sy + d], [sx + S.snout * 1.9, sy + d * 1.8]], 3);
    if (S.ear === 'flop') inked(ctx, [[headCx - S.head * 0.4, headCy - S.head * 0.75], [headCx - S.head * 0.95, headCy - S.head * 0.2], [headCx - S.head * 0.8, headCy + S.head * 0.45], [headCx - S.head * 0.25, headCy - S.head * 0.3]], darken(col, 0.8), r, 7);
    if (S.ear === 'side') inked(ctx, [[headCx - S.head * 0.5, headCy - S.head * 0.4], [headCx - S.head * 1.3, headCy - S.head * 0.55], [headCx - S.head * 0.6, headCy - S.head * 0.1]], col, r, 6);
    if (S.mane) stroke(ctx, [[headCx - S.head * 0.3, headCy - S.head * 0.9], [headCx - S.head * 0.9, headCy - S.head * 0.2]], 20, S.mane);
    eye(ctx, headCx + S.head * 0.25, headCy - S.head * 0.18, Math.max(8, S.head * 0.13), expr, blink);
    top = headCy - S.head * (S.ear === 'point' || S.horns ? 1.45 : 1);
  }
  ctx.restore();
  return { top: GROUND - (GROUND - top) * k, headCy: GROUND - (GROUND - headCy) * k, R: (S.head || 50) * k };
}

export const ANIMALS = Object.fromEntries(Object.keys(SPEC).map((k) => [k, { species: k, draw: drawAnimal }]));
// a recoloured animal: animal('dog', { col: '#3b2a20', size: 1.2 })
export const animal = (species, o = {}) => ({ species, draw: drawAnimal, ...o });

// ---------- a whale lying on the sand (big card, use Actor scale ~4)
export function drawWhale(ctx, o, { expr = 'neutral', blink = false, seed = 1 } = {}) {
  const r = rng(seed * 31 + 5), cx = W / 2, cy = GROUND - 150, col = o.col || '#5f7488';
  const B0 = 0; const B = [[cx - 340, cy - 10], [cx - 250, cy - 120], [cx, cy - 145], [cx + 230, cy - 100], [cx + 330, cy - 10], [cx + 300, cy + 120], [cx, cy + 140], [cx - 280, cy + 110]];
  inked(ctx, [[cx - 330, cy], [cx - 420, cy - 110], [cx - 390, cy - 10], [cx - 430, cy + 90]], col, r, 9);
  inked(ctx, J(B, r), col, r, 10); shadeBand(ctx, B, col, null, 24, 14, 0.84);
  inked(ctx, [[cx - 200, cy + 60], [cx + 280, cy + 50], [cx + 270, cy + 110], [cx, cy + 135], [cx - 220, cy + 100]], '#d8dee6', r, 7);
  for (let i = 0; i < 5; i++) stroke(ctx, [[cx - 120 + i * 70, cy + 70], [cx - 110 + i * 70, cy + 120]], 4);
  stroke(ctx, [[cx + 120, cy + 40], [cx + 300, cy + 30]], 8);
  eye(ctx, cx + 200, cy - 20, 13, expr, blink);
  return { top: cy - 145, headCy: cy - 20, R: 120 };
}
export const WHALE = { species: 'whale', draw: drawWhale };
