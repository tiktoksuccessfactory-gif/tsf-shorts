// Background music, composed on the fly from patterns. Moods: quirky, sneaky, tension, upbeat, mystery, sad, epic.
// music(mood, seconds, seed) -> { L, R } (Float32Arrays). Every section starts on bar 1, so a mood change sounds like a cut.
import { SR, TAU, len, buf, noise, osc, lp, hp, bp, filt, dec, ar, adsr, env, gain, fade, norm, sum, place, sat, pluck, fm, midi, rng, reverb } from './dsp.mjs';

// ---------- instruments (mono)
const kick = (r) => sum(env(osc(0.35, (t) => 45 + 110 * Math.exp(-t / 0.03)), dec(0.12)), gain(env(hp(noise(0.02, r), 2000), dec(0.003)), 0.3));
const snare = (r, soft = 1) => gain(sum(env(bp(noise(0.25, r), 1900, 0.8), dec(0.07)), gain(env(osc(0.2, 190), dec(0.04)), 0.6)), soft);
const hat = (r, open = false) => env(hp(noise(open ? 0.3 : 0.06, r), 7500), dec(open ? 0.09 : 0.018));
const clap = (r) => { const y = buf(0.3); [0, 0.011, 0.022].forEach((o, i) => place(y, env(bp(noise(0.2, r), 1400, 1), dec(i === 2 ? 0.06 : 0.008)), o, 1)); return y; };
const snap = (r) => sum(env(bp(noise(0.08, r), 2600, 1.4), dec(0.012)), gain(env(osc(0.05, 1400), dec(0.006)), 0.3));
const shaker = (r) => env(hp(noise(0.08, r), 5000), (t) => Math.sin(Math.PI * Math.min(1, t / 0.08)));
const tom = (f) => env(osc(0.6, (t) => f * (1 + 0.6 * Math.exp(-t / 0.03))), dec(0.18));
const bass = (f, d) => fade(sum(gain(lp(osc(d, f, 'saw'), 420), 0.7), osc(d, f)).map((v, i) => v * Math.min(1, i / 200) * Math.exp(-i / SR / (d * 1.2))), 0.003, 0.03);
const pizz = (f, r) => env(sum(pluck(f, 0.5, r, 0.35, 0.993), gain(env(osc(0.5, f), dec(0.08)), 0.3)), dec(0.22));
const pluckSyn = (f, r, d = 0.4) => env(lp(osc(d, f, 'saw'), (t) => 300 + 4000 * Math.exp(-t / 0.06)), dec(0.15));
const marimba = (f) => sum(env(osc(0.6, f), dec(0.22)), gain(env(osc(0.6, f * 4), dec(0.03)), 0.35), gain(env(osc(0.6, f * 10), dec(0.008)), 0.12));
const keys = (f, d) => env(sum(fm(d, f, 1, 1.4, 0.9), gain(fm(d, f * 2, 1, 0.3, 0.4), 0.2)), (t) => Math.min(1, (d - t) / 0.08));
const bell = (f) => sum(fm(2.2, f, 3.5, 1.8, 0.8), gain(fm(2.2, f * 2.01, 1, 0.4, 0.4), 0.2));
const pad = (notes, d, bright = 900, r) => { const y = buf(d); for (const m of notes) for (const det of [-0.12, 0.1]) place(y, osc(d, midi(m + det), 'saw', r()), 0, 0.5); return env(lp(y, bright), (t) => Math.min(1, t / 0.5) * Math.min(1, (d - t) / 0.4)); };
const stab = (notes, d) => { const y = buf(d); for (const m of notes) place(y, osc(d, midi(m), 'saw'), 0, 0.5); return env(filt(y, 'lp', (t) => 400 + 3000 * Math.exp(-t / 0.08)), adsr(0.01, 0.15, 0.4, 0.1, d - 0.1)); };
const crash = (r) => env(hp(noise(2.5, r), 4000), dec(0.8));

const CH = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], sus: [0, 5, 7], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11] };

// mood definitions: key (midi), bpm, chord progression [offset, quality] one chord per bar, and a part writer
const MOODS = {
  quirky: { key: 60, bpm: 112, prog: [[0, 'maj'], [9, 'min'], [5, 'maj'], [7, 'maj']], swing: 0.08,
    parts(m) { m.every((b, s, c) => { if (s === 0 || s === 8) m.note('bass', bass(midi(c.root - 24 + (s === 8 ? 7 : 0)), 0.3), 0.9);
      if (s === 4 || s === 12) for (const n of c.notes) m.note('chords', pizz(midi(n), m.r), 0.22, (n % 3 - 1) * 0.3);
      if (s % 4 === 2) m.note('perc', shaker(m.r), 0.12, 0.3);
      const mel = [0, null, null, 2, null, null, 1, null, 2, null, 3, null, 2, null, null, null]; const k = mel[s];
      if (k !== null && (b % 4 !== 3 || s < 8)) m.note('lead', marimba(midi(c.notes[k % c.notes.length] + 12 * (k > 2 ? 1 : 0) + 12)), 0.3, -0.2); }); } },
  sneaky: { key: 55, bpm: 104, prog: [[0, 'min'], [0, 'min'], [5, 'min'], [7, 'maj']], swing: 0.12,
    parts(m) { m.every((b, s, c) => { if (s % 4 === 0) { const walk = [0, 3, 5, 6][s / 4] ; m.note('bass', pizz(midi(c.root - 12 + walk), m.r), 1.0); }
      if (s === 4 || s === 12) m.note('perc', snap(m.r), 0.45, 0.35);
      if (b % 2 === 1 && (s === 10 || s === 14)) m.note('lead', marimba(midi(c.root + 12 + (s === 14 ? 3 : 0))), 0.25, -0.25);
      if (s % 2 === 0) m.note('perc', hat(m.r), 0.07, -0.3); }); } },
  tension: { key: 57, bpm: 96, prog: [[0, 'min'], [0, 'min'], [8, 'maj'], [7, 'maj']],
    parts(m) { m.every((b, s, c) => { if (s % 2 === 0) m.note('bass', bass(midi(c.root - 24), 0.14), 0.8);
      if (s === 0) { m.note('pad', pad(c.notes.map((n) => n - 12), m.bar, 700, m.r), 0.28); m.note('perc', tom(70), 0.6); }
      if (s % 2 === 1) m.note('perc', hat(m.r), 0.08, 0.3);
      if (s === 12 && b % 2 === 1) m.note('perc', tom(95), 0.35, -0.2); }); } },
  upbeat: { key: 62, bpm: 122, prog: [[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj']],
    parts(m) { m.every((b, s, c) => { if (s % 4 === 0) m.note('perc', kick(m.r), 0.75);
      if (s === 4 || s === 12) m.note('perc', clap(m.r), 0.4, 0.1);
      if (s % 4 === 2) m.note('perc', hat(m.r, true), 0.13, 0.3);
      if (s % 4 === 2) m.note('bass', bass(midi(c.root - 24), 0.2), 0.75);
      const arp = [0, 1, 2, 1]; m.note('lead', pluckSyn(midi(c.notes[arp[s % 4]] + 12), m.r), 0.13, s % 2 ? 0.35 : -0.35); }); } },
  mystery: { key: 52, bpm: 84, prog: [[0, 'min'], [5, 'min'], [0, 'min'], [11, 'dim']],
    parts(m) { m.every((b, s, c) => { if (s === 0) m.note('pad', pad(c.notes, m.bar, 1100, m.r), 0.3);
      if (s === 0 || s === 10) m.note('bass', bass(midi(c.root - 24), 0.6), 0.6);
      const mel = { 0: 2, 6: 1, 8: 0, 14: 1 }; if (mel[s] !== undefined && b % 2 === 0) m.note('lead', bell(midi(c.notes[mel[s]] + 24)), 0.12, 0.3);
      if (s === 8) m.note('perc', snare(m.r, 0.5), 0.1, -0.2); }); } },
  sad: { key: 50, bpm: 70, prog: [[0, 'min'], [8, 'maj'], [3, 'maj'], [10, 'maj']],
    parts(m) { m.every((b, s, c) => { if (s === 0 || s === 8) for (const n of c.notes) m.note('chords', keys(midi(n), m.bar / 2), 0.16, (n % 3 - 1) * 0.25);
      if (s === 0) { m.note('bass', bass(midi(c.root - 24), m.bar * 0.9), 0.5); m.note('pad', pad(c.notes, m.bar, 600, m.r), 0.15); }
      const mel = { 0: 2, 4: 1, 6: 0, 12: 1 }; if (mel[s] !== undefined && b % 2 === 1) m.note('lead', bell(midi(c.notes[mel[s]] + 24)), 0.08, 0.2); }); } },
  epic: { key: 48, bpm: 100, prog: [[0, 'min'], [8, 'maj'], [3, 'maj'], [10, 'maj']],
    parts(m) { m.every((b, s, c) => { if (s === 0) { m.note('pad', pad(c.notes, m.bar, 1600, m.r), 0.3); if (b % 4 === 0) m.note('perc', crash(m.r), 0.25); }
      if ([0, 3, 6, 8, 11, 14].includes(s)) m.note('perc', tom(s === 0 || s === 8 ? 60 : 85), 0.55, s % 2 ? 0.3 : -0.3);
      if (s === 4 || s === 12) m.note('perc', snare(m.r), 0.45);
      if (s === 0 || s === 6 || s === 12) m.note('chords', stab(c.notes.map((n) => n + 12), 0.35), 0.2);
      if (s % 2 === 0) m.note('bass', bass(midi(c.root - 24), 0.2), 0.7); }); } },
};
export const MOOD_NAMES = Object.keys(MOODS);

export function music(mood, seconds, seed = 1) {
  const M = MOODS[mood] || MOODS.quirky, r = rng(seed * 31 + 7);
  const n = len(seconds + 2), L = new Float32Array(n), R = new Float32Array(n), wetL = new Float32Array(n), wetR = new Float32Array(n);
  const step = 60 / M.bpm / 4, bar = step * 16, bars = Math.ceil(seconds / bar);
  const send = { pad: 0.5, chords: 0.35, lead: 0.4, bass: 0.05, perc: 0.12 };
  let cur = { at: 0 };
  const m = {
    r, bar,
    note(bus, x, g = 1, pan = 0) { const a = Math.cos((pan + 1) * Math.PI / 4), b = Math.sin((pan + 1) * Math.PI / 4); place(L, x, cur.at, g * a); place(R, x, cur.at, g * b); const w = send[bus] || 0; if (w) { place(wetL, x, cur.at, g * w * a); place(wetR, x, cur.at, g * w * b); } },
    every(fn) { for (let b = 0; b < bars; b++) { const [off, q] = M.prog[b % M.prog.length]; const root = M.key + off; const c = { root, notes: CH[q].map((i) => root + i) };
      for (let s = 0; s < 16; s++) { cur.at = b * bar + s * step + (s % 2 ? (M.swing || 0) * step : 0); if (cur.at < seconds) fn(b, s, c); } } },
  };
  M.parts(m);
  const rl = reverb(wetL, 0.6, 2.2), rr = reverb(wetR, 0.65, 2.2);
  for (let i = 0; i < n; i++) { L[i] += rl[i] || 0; R[i] += rr[i] || 0; }
  const out = { L: L.subarray(0, len(seconds)), R: R.subarray(0, len(seconds)) };
  // same loudness for every mood (RMS), with a soft ceiling
  let e = 1e-9; for (let i = 0; i < out.L.length; i++) e += out.L[i] * out.L[i] + out.R[i] * out.R[i];
  const g = 0.2 / Math.sqrt(e / (2 * out.L.length));
  for (const B of [out.L, out.R]) for (let i = 0; i < B.length; i++) B[i] = Math.tanh(B[i] * g * 1.1) / 1.1;
  return out;
}
