// TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
// Sound effects, all synthesised (no samples). Each entry: (r, d) => Float32Array, r = random generator, d = optional length.
// LEVEL holds the default loudness of each effect in the mix (1 = loud hit, 0.3 = background detail).
import { SR, TAU, len, buf, noise, osc, filt, lp, hp, bp, dec, ar, env, gain, fade, norm, sum, place, sat, pluck, fm } from './dsp.mjs';

const tone = (d, f, tau, shape = 'sin') => env(osc(d, f, shape), dec(tau));
const burst = (r, d, lo, hi, tau) => env(hp(lp(noise(d, r), hi), lo), dec(tau));

export const SFX = {
  // ---- movement / transitions
  whoosh: (r, d = 0.6) => norm(env(filt(noise(d, r), 'bp', (t) => 300 + 2600 * Math.sin(Math.PI * Math.min(1, t / d)) ** 2, 1.4), (t) => Math.sin(Math.PI * Math.min(1, t / d)) ** 2), 0.8),
  swish: (r) => norm(env(filt(noise(0.28, r), 'bp', (t) => 1200 + 5000 * (t / 0.28), 1.6), (t) => Math.sin(Math.PI * Math.min(1, t / 0.28)) ** 1.5), 0.8),
  zoom: (r, d = 0.5) => norm(sum(env(filt(noise(d, r), 'bp', (t) => 400 + 6000 * (t / d) ** 2, 2), (t) => (t / d) ** 1.5), gain(env(osc(d, (t) => 200 + 900 * (t / d) ** 2, 'saw'), (t) => (t / d) * 0.3), 0.2)), 0.8),
  riser: (r, d = 2) => norm(fade(sum(env(filt(noise(d, r), 'bp', (t) => 300 + 5000 * (t / d) ** 2, 2.5), (t) => (t / d) ** 2), gain(env(osc(d, (t) => 110 * Math.pow(4, t / d), 'saw'), (t) => (t / d) ** 2), 0.15)), 0.05, 0.01), 0.8),
  drop: (r, d = 1.2) => norm(sum(env(osc(d, (t) => 400 * Math.pow(0.12, t / d)), dec(d * 0.6)), gain(env(lp(noise(d, r), 600), dec(0.3)), 0.4)), 0.8),
  // ---- hits
  hit: (r) => norm(sum(env(osc(0.7, (t) => 50 + 110 * Math.exp(-t / 0.04)), dec(0.22)), gain(burst(r, 0.4, 80, 3500, 0.05), 0.6), gain(burst(r, 0.08, 2000, 9000, 0.01), 0.3)), 0.9),
  thud: (r) => norm(sum(env(osc(0.5, (t) => 45 + 70 * Math.exp(-t / 0.05)), dec(0.15)), gain(burst(r, 0.3, 60, 900, 0.04), 0.7)), 0.85),
  boom: (r) => norm(sum(env(osc(2.4, (t) => 32 + 60 * Math.exp(-t / 0.35)), dec(0.8)), gain(env(lp(noise(2.4, r), (t) => 1500 * Math.exp(-t / 0.4) + 120), dec(0.7)), 0.8)), 0.9),
  punch: (r) => norm(sum(env(osc(0.3, (t) => 90 + 160 * Math.exp(-t / 0.02)), dec(0.07)), gain(burst(r, 0.2, 300, 5000, 0.025), 0.9)), 0.85),
  slap: (r) => norm(sum(burst(r, 0.2, 900, 9000, 0.018), gain(burst(r, 0.2, 200, 1500, 0.03), 0.5)), 0.8),
  crash: (r) => { const y = buf(1.6); for (let k = 0; k < 18; k++) { const at = r() * 0.5 * r(); place(y, fade(env(bp(noise(0.5, r), 1500 + r() * 6000, 3), dec(0.05 + r() * 0.15)), 0.001, 0.05), at, 0.4 + r() * 0.6); } place(y, burst(r, 1.2, 100, 3000, 0.25), 0, 0.6); return norm(y, 0.85); },
  glass: (r) => { const y = buf(1.4); for (let k = 0; k < 14; k++) place(y, env(osc(0.6, 2500 + r() * 5000), dec(0.05 + r() * 0.2)), r() * 0.35, 0.3 + r() * 0.5); place(y, burst(r, 0.3, 3000, 12000, 0.03), 0, 0.8); return norm(y, 0.7); },
  // ---- cartoon
  pop: (r) => norm(env(osc(0.12, (t) => 380 + 900 * (t / 0.12)), dec(0.03)), 0.7),
  boing: (r) => norm(env(osc(0.7, (t) => 160 * (1 + 0.35 * Math.sin(TAU * 14 * t) * Math.exp(-t / 0.3)) * (1 + t)), dec(0.25)), 0.7),
  slideUp: (r, d = 0.5) => norm(fade(osc(d, (t) => 300 * Math.pow(4, t / d) * (1 + 0.02 * Math.sin(TAU * 6 * t))), 0.02, 0.05), 0.5),
  slideDown: (r, d = 0.6) => norm(fade(osc(d, (t) => 1200 * Math.pow(0.25, t / d) * (1 + 0.02 * Math.sin(TAU * 6 * t))), 0.02, 0.05), 0.5),
  bonk: (r) => norm(sum(env(osc(0.4, (t) => 520 * Math.exp(-t / 0.2)), dec(0.09)), gain(env(osc(0.4, 1310), dec(0.04)), 0.5), gain(burst(r, 0.05, 1000, 6000, 0.005), 0.4)), 0.75),
  squeak: (r) => norm(fade(env(osc(0.25, (t) => 1800 + 900 * Math.sin(TAU * 9 * t), 'tri'), ar(0.02, 0.25)), 0.01, 0.03), 0.4),
  sadTrombone: (r) => { const y = buf(2.4); [[0, 293.7, 0.4], [0.45, 277.2, 0.4], [0.9, 261.6, 0.4], [1.35, 246.9, 1.0]].forEach(([at, f, d], i) => place(y, fade(lp(env(osc(d, (t) => f * (1 + (i === 3 ? 0.03 * Math.sin(TAU * 6 * t) : 0.01 * Math.sin(TAU * 5 * t))), 'saw'), ar(0.04, d)), 1400), 0.02, 0.08), at, 1)); return norm(y, 0.6); },
  rimshot: (r) => { const y = buf(1.4); place(y, sum(env(osc(0.3, 190), dec(0.05)), burst(r, 0.2, 800, 6000, 0.05)), 0, 0.8); place(y, sum(env(osc(0.3, 170), dec(0.05)), burst(r, 0.2, 800, 6000, 0.05)), 0.16, 0.8); place(y, hp(env(noise(1.0, r), dec(0.35)), 6000), 0.32, 0.6); return norm(y, 0.7); },
  drumroll: (r, d = 1.6) => { const y = buf(d + 0.3); for (let t = 0; t < d; t += 0.045) place(y, burst(r, 0.08, 400, 5000, 0.02), t, 0.35 + 0.5 * (t / d)); return norm(y, 0.6); },
  ding: (r) => norm(sum(fm(1.6, 1318.5, 3.5, 1.2, 0.5), gain(fm(1.6, 2637, 2, 0.5, 0.25), 0.3)), 0.55),
  chime: (r) => { const y = buf(1.8); place(y, fm(1.4, 1568, 3.5, 1, 0.45), 0, 1); place(y, fm(1.4, 1318.5, 3.5, 1, 0.45), 0.22, 1); return norm(y, 0.5); },
  correct: (r) => { const y = buf(1.1); [[0, 880], [0.12, 1318.5]].forEach(([at, f]) => place(y, env(osc(0.5, f, 'tri'), dec(0.18)), at, 1)); return norm(y, 0.5); },
  wrong: (r) => norm(lp(env(osc(0.7, 140, 'sqr'), ar(0.01, 0.7)), 1200), 0.45),
  magic: (r, d = 1.2) => { const y = buf(d + 0.5); for (let k = 0; k < 30; k++) place(y, env(osc(0.4, 2000 + r() * 6000), dec(0.06 + r() * 0.1)), r() * d * 0.8, 0.2 + r() * 0.4); place(y, env(bp(noise(d, r), 7000, 1.5), (t) => Math.sin(Math.PI * Math.min(1, t / d))), 0, 0.3); return norm(y, 0.5); },
  zap: (r) => norm(env(osc(0.35, (t) => 1800 * Math.exp(-t / 0.06) + 120 + 60 * Math.sin(TAU * 90 * t), 'saw'), dec(0.12)), 0.5),
  glitch: (r) => { const y = buf(0.5); for (let k = 0; k < 9; k++) place(y, osc(0.03 + r() * 0.04, 200 + r() * 2000, 'sqr'), r() * 0.42, 0.3 + r() * 0.4); return norm(hp(y, 200), 0.45); },
  rattle: (r, d = 1.2) => { const y = buf(d + 0.2); for (let t = 0; t < d; t += 0.085) place(y, sum(burst(r, 0.07, 300, 6000, 0.012), gain(env(osc(0.06, (u) => 120 + 200 * Math.exp(-u / 0.01)), dec(0.02)), 0.8)), t, 0.7 + 0.3 * r()); return norm(y, 0.6); },
  jam: (r) => { const y = buf(0.6); place(y, burst(r, 0.05, 1500, 8000, 0.006), 0, 1); place(y, sum(burst(r, 0.08, 800, 5000, 0.01), gain(env(osc(0.1, 2600), dec(0.01)), 0.3)), 0.18, 0.8); return norm(y, 0.55); },
  // ---- everyday
  click: (r) => norm(burst(r, 0.04, 2000, 9000, 0.004), 0.5),
  tick: (r, d = 2) => { const y = buf(d + 0.1); let k = 0; for (let t = 0; t < d; t += 0.5) { place(y, sum(burst(r, 0.03, 2500, 9000, 0.004), gain(env(osc(0.03, k % 2 ? 1800 : 2200), dec(0.006)), 0.5)), t, 1); k++; } return norm(y, 0.5); },
  typing: (r, d = 1.5) => { const y = buf(d + 0.1); for (let t = 0; t < d; t += 0.06 + r() * 0.09) place(y, sum(burst(r, 0.03, 1500, 8000, 0.006), gain(env(osc(0.03, 300), dec(0.01)), 0.4)), t, 0.5 + r() * 0.5); return norm(y, 0.45); },
  knock: (r) => { const y = buf(0.9); [0, 0.2, 0.4].forEach((at) => place(y, sum(env(osc(0.15, 180), dec(0.03)), burst(r, 0.12, 200, 2500, 0.02)), at, 1)); return norm(y, 0.75); },
  door: (r) => norm(sum(env(osc(0.6, (t) => 70 + 40 * Math.exp(-t / 0.05)), dec(0.12)), burst(r, 0.6, 80, 1500, 0.08), gain(burst(r, 0.1, 1500, 6000, 0.01), 0.3)), 0.8),
  footsteps: (r, d = 2) => { const y = buf(d + 0.2); for (let t = 0, k = 0; t < d; t += 0.42, k++) place(y, sum(burst(r, 0.1, 150, 3000, 0.025), gain(env(osc(0.08, 90), dec(0.02)), 0.6)), t, k % 2 ? 0.8 : 1); return norm(y, 0.55); },
  notify: (r) => { const y = buf(0.7); place(y, fm(0.4, 1760, 2, 0.6, 0.12), 0, 1); place(y, fm(0.4, 2349, 2, 0.6, 0.15), 0.09, 1); return norm(y, 0.5); },
  ring: (r, d = 2) => { const y = buf(d); for (let t = 0; t < d; t += 1.2) place(y, env(sum(osc(0.8, 480), osc(0.8, 620)), (u) => (Math.sin(TAU * 20 * u) > 0 ? 1 : 0.2) * Math.min(1, (0.8 - u) / 0.05)), t, 0.4); return norm(y, 0.45); },
  cash: (r) => { const y = buf(1.2); place(y, burst(r, 0.25, 200, 4000, 0.05), 0, 0.6); place(y, sum(fm(1, 2637, 1.5, 0.8, 0.35), gain(fm(1, 3951, 1.5, 0.5, 0.25), 0.5)), 0.08, 1); return norm(y, 0.55); },
  coin: (r) => { const y = buf(0.8); place(y, sum(fm(0.6, 1975, 2.7, 1, 0.2), gain(fm(0.6, 2960, 2.7, 1, 0.15), 0.5)), 0, 1); return norm(y, 0.5); },
  camera: (r) => { const y = buf(0.3); place(y, burst(r, 0.06, 1500, 8000, 0.008), 0, 1); place(y, burst(r, 0.06, 1000, 6000, 0.01), 0.07, 0.8); return norm(y, 0.55); },
  paper: (r) => norm(env(bp(noise(0.45, r), 3500, 0.8), (t) => Math.sin(Math.PI * t / 0.45) * (0.4 + 0.6 * (r() < 0.2 ? 1 : 0.3))), 0.45),
  splash: (r) => norm(sum(env(filt(noise(1.2, r), 'lp', (t) => 6000 * Math.exp(-t / 0.4) + 400), dec(0.35)), gain(env(osc(0.3, (t) => 120 + 300 * t), dec(0.08)), 0.4)), 0.75),
  bubble: (r) => { const y = buf(0.8); for (let k = 0; k < 6; k++) { const f = 400 + r() * 700; place(y, env(osc(0.08, (t) => f * (1 + 8 * t)), dec(0.02)), r() * 0.6, 0.6); } return norm(y, 0.45); },
  gulp: (r) => norm(sum(env(osc(0.25, (t) => 220 - 300 * t), dec(0.06)), gain(burst(r, 0.2, 200, 1200, 0.04), 0.5)), 0.6),
  burp: (r) => { const d = 0.8; const f0 = (t) => 90 + 25 * Math.sin(TAU * 7 * t) + 40 * Math.exp(-t * 4); const x = env(lp(osc(d, f0, 'saw'), 900), (t) => (1 + 0.5 * Math.sin(TAU * 23 * t)) * Math.exp(-t * 1.8)); return norm(fade(x, 0.02, 0.12), 0.7); },
  honk: (r) => norm(sat(lp(env(sum(osc(0.5, 392, 'saw'), osc(0.5, 494, 'saw')), ar(0.02, 0.5)), 2200), 2), 0.6),
  siren: (r, d = 3) => norm(fade(lp(osc(d, (t) => 750 + 350 * Math.sin(TAU * 0.9 * t), 'tri'), 3000), 0.3, 0.3), 0.35),
  alarm: (r, d = 2) => norm(env(osc(d, 950, 'sqr'), (t) => (Math.sin(TAU * 4 * t) > 0 ? 1 : 0)), 0.3),
  heartbeat: (r, d = 2.4) => { const y = buf(d + 0.3); for (let t = 0; t < d; t += 0.8) { place(y, env(osc(0.2, 55), dec(0.05)), t, 1); place(y, env(osc(0.2, 50), dec(0.05)), t + 0.22, 0.7); } return norm(y, 0.8); },
  scratch: (r) => norm(env(filt(noise(0.5, r), 'bp', (t) => 900 + 1400 * Math.sin(TAU * 4 * t), 2.5), ar(0.01, 0.5)), 0.6),
  // ---- crowds / weather (beds)
  crowd: (r, d = 2.5) => { const y = buf(d); for (let k = 0; k < 12; k++) { const f0 = 300 + r() * 1100, ph = r() * 6, sp = 3 + r() * 3; place(y, env(bp(noise(d, r), f0, 2), (t) => Math.max(0, Math.sin(TAU * sp * t + ph)) ** 2), 0, 0.3 + r() * 0.7); } return norm(env(lp(y, 3500), ar(0.3, d)), 0.45); },
  gasp: (r) => { const d = 0.9; const y = sum(...[0, 1, 2, 3, 4, 5].map((k) => env(filt(osc(d, 140 + k * 37, 'saw'), 'bp', (t) => 500 + 300 * Math.min(1, t / 0.2), 3), (t) => Math.min(1, t / 0.08) * Math.exp(-t / 0.5)))); return norm(sum(y, gain(env(bp(noise(d, r), 1800, 1.5), dec(0.4)), 0.2)), 0.5); },
  laugh: (r) => { const y = buf(2.2); for (let k = 0; k < 8; k++) { const f0 = 150 + r() * 160; for (let t = r() * 0.3; t < 1.8; t += 0.16 + r() * 0.05) place(y, env(filt(osc(0.12, f0 * (1.2 - t * 0.1), 'saw'), 'bp', 900, 2), ar(0.01, 0.12)), t, 0.25); } return norm(env(y, ar(0.05, 2.2)), 0.45); },
  cheer: (r, d = 2.5) => norm(sum(SFX.crowd(r, d), gain(env(bp(noise(d, r), 2200, 0.7), ar(0.3, d)), 0.5)), 0.55),
  applause: (r, d = 3) => { const y = buf(d); for (let t = 0; t < d; t += 0.004) place(y, burst(r, 0.02, 800, 7000, 0.004), t + r() * 0.004, 0.2 + r() * 0.3); return norm(env(y, ar(0.3, d)), 0.45); },
  wind: (r, d = 3) => norm(env(filt(noise(d, r), 'bp', (t) => 400 + 300 * Math.sin(TAU * 0.3 * t), 1.5), ar(0.5, d)), 0.4),
  rain: (r, d = 4) => { const y = hp(lp(noise(d, r), 7000), 900); for (let t = 0; t < d; t += 0.01) place(y, burst(r, 0.01, 2000, 9000, 0.002), t + r() * 0.01, 0.6 * r()); return norm(env(y, ar(0.6, d)), 0.35); },
  thunder: (r) => norm(sum(env(lp(noise(3.5, r), (t) => 2500 * Math.exp(-t / 0.15) + 150), (t) => Math.exp(-t / 1.1) * (0.7 + 0.3 * Math.sin(TAU * 1.7 * t))), gain(burst(r, 0.3, 500, 6000, 0.05), 0.5)), 0.85),
  fire: (r, d = 3) => { const y = lp(noise(d, r), 700); for (let t = 0; t < d; t += 0.03) if (r() < 0.25) place(y, burst(r, 0.02, 1500, 7000, 0.004), t, 1.5 * r()); return norm(env(y, ar(0.3, d)), 0.45); },
  engine: (r, d = 3) => norm(env(lp(sum(osc(d, (t) => 48 + 6 * Math.sin(TAU * 0.5 * t), 'saw'), gain(noise(d, r), 0.3)), 600), ar(0.4, d)), 0.5),
};

// default level of each effect in the final mix
export const LEVEL = { rattle: 0.45, jam: 0.5, whoosh: 0.45, swish: 0.35, zoom: 0.4, riser: 0.45, drop: 0.5, hit: 0.75, thud: 0.6, boom: 0.8, punch: 0.6, slap: 0.55, crash: 0.6, glass: 0.5,
  pop: 0.45, boing: 0.5, slideUp: 0.4, slideDown: 0.4, bonk: 0.5, squeak: 0.35, sadTrombone: 0.5, rimshot: 0.5, drumroll: 0.45, ding: 0.4, chime: 0.4, correct: 0.4, wrong: 0.45, magic: 0.4, zap: 0.4, glitch: 0.35,
  click: 0.35, tick: 0.35, typing: 0.3, knock: 0.55, door: 0.5, footsteps: 0.35, notify: 0.4, ring: 0.35, cash: 0.45, coin: 0.4, camera: 0.4, paper: 0.35, splash: 0.55, bubble: 0.35, gulp: 0.45, burp: 0.5, honk: 0.45, siren: 0.3, alarm: 0.28, heartbeat: 0.55, scratch: 0.5,
  crowd: 0.3, gasp: 0.4, laugh: 0.35, cheer: 0.4, applause: 0.35, wind: 0.3, rain: 0.3, thunder: 0.6, fire: 0.3, engine: 0.35 };
export const NAMES = Object.keys(SFX);
