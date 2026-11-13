// Small DSP toolkit for the sound effects and music. Mono Float32Array buffers at 48 kHz.
export const SR = 48000;
export const TAU = Math.PI * 2;

// deterministic random numbers, so a render always sounds the same
export function rng(seed = 1) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const len = (d) => Math.max(1, Math.round(d * SR));
export const buf = (d) => new Float32Array(len(d));
export const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function noise(d, r) { const x = buf(d); for (let i = 0; i < x.length; i++) x[i] = r() * 2 - 1; return x; }

// oscillator; f can be a number or a function of time (seconds)
export function osc(d, f, shape = 'sin', ph = 0) {
  const x = buf(d), fn = typeof f === 'function'; let p = ph;
  for (let i = 0; i < x.length; i++) {
    const fr = fn ? f(i / SR) : f; p += fr / SR; p -= Math.floor(p);
    x[i] = shape === 'sin' ? Math.sin(TAU * p) : shape === 'saw' ? 2 * p - 1 : shape === 'sqr' ? (p < 0.5 ? 1 : -1) : shape === 'tri' ? 1 - 4 * Math.abs(p - 0.5) : 0;
  }
  return x;
}

// state-variable filter (stable when the cutoff moves). type: lp | hp | bp | notch. fc: number or function of time
export function filt(x, type, fc, q = 0.707) {
  const y = new Float32Array(x.length), fn = typeof fc === 'function', k = 1 / q;
  let ic1 = 0, ic2 = 0, a1 = 0, a2 = 0, a3 = 0;
  const set = (f) => { const g = Math.tan((Math.PI * Math.min(Math.max(f, 10), SR * 0.45)) / SR); a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; };
  set(fn ? fc(0) : fc);
  for (let i = 0; i < x.length; i++) {
    if (fn && (i & 15) === 0) set(fc(i / SR));
    const v0 = x[i], v3 = v0 - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
    y[i] = type === 'lp' ? v2 : type === 'bp' ? v1 : type === 'hp' ? v0 - k * v1 - v2 : v0 - k * v1;
  }
  return y;
}
export const lp = (x, f, q) => filt(x, 'lp', f, q);
export const hp = (x, f, q) => filt(x, 'hp', f, q);
export const bp = (x, f, q = 1.2) => filt(x, 'bp', f, q);

// envelopes (functions of time) and applying them
export const dec = (tau) => (t) => Math.exp(-t / tau);
export const ar = (a, d) => (t) => Math.min(1, t / Math.max(a, 1e-4)) * Math.max(0, Math.min(1, (d - t) / Math.max(d * 0.35, 1e-3)));
export const adsr = (a, dcy, s, rel, hold) => (t) => t < a ? t / a : t < a + dcy ? 1 - (1 - s) * ((t - a) / dcy) : t < hold ? s : Math.max(0, s * (1 - (t - hold) / rel));
export function env(x, fn) { for (let i = 0; i < x.length; i++) x[i] *= fn(i / SR); return x; }
export function gain(x, g) { for (let i = 0; i < x.length; i++) x[i] *= g; return x; }
export function fade(x, a = 0.005, b = 0.02) { const A = len(a), B = len(b), n = x.length; for (let i = 0; i < Math.min(A, n); i++) x[i] *= i / A; for (let i = 0; i < Math.min(B, n); i++) x[n - 1 - i] *= i / B; return x; }
export function norm(x, peak = 0.8) { let m = 1e-9; for (const v of x) m = Math.max(m, Math.abs(v)); return gain(x, peak / m); }
export function sum(...xs) { const n = Math.max(...xs.map((x) => x.length)); const y = new Float32Array(n); for (const x of xs) for (let i = 0; i < x.length; i++) y[i] += x[i]; return y; }
export function place(dst, src, at, g = 1) { const o = Math.round(at * SR); for (let i = 0; i < src.length; i++) { const j = o + i; if (j >= 0 && j < dst.length) dst[j] += src[i] * g; } return dst; }
export function sat(x, drive = 1.5) { const k = Math.tanh(drive); for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * drive) / k; return x; }
// plucked string (Karplus-Strong). bright 0..1
export function pluck(f, d, r, bright = 0.5, damp = 0.996) {
  const x = buf(d), P = Math.max(2, Math.round(SR / f)), line = new Float32Array(P);
  for (let i = 0; i < P; i++) line[i] = r() * 2 - 1;
  let last = 0; const b = 0.5 + bright * 0.45;
  for (let i = 0; i < x.length; i++) { const j = i % P, v = line[j]; const nv = damp * (b * v + (1 - b) * last); last = v; line[j] = nv; x[i] = v; }
  return x;
}
// simple FM tone (bells, keys)
export function fm(d, f, ratio, index, tau) {
  const x = buf(d);
  for (let i = 0; i < x.length; i++) { const t = i / SR, e = Math.exp(-t / tau); x[i] = Math.sin(TAU * f * t + index * e * Math.sin(TAU * f * ratio * t)) * e; }
  return x;
}
// cheap room reverb (feedback comb + allpass network), returns the wet signal only
export function reverb(x, size = 0.5, tail = 2) {
  const n = x.length + len(tail), y = new Float32Array(n);
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((c) => Math.round(c * (0.6 + size * 0.8)));
  const fb = 0.7 + size * 0.22;
  for (const c of combs) { const d = new Float32Array(c); let k = 0, lpS = 0; for (let i = 0; i < n; i++) { const o = d[k]; lpS = o * 0.6 + lpS * 0.4; d[k] = (i < x.length ? x[i] : 0) + lpS * fb; y[i] += o; k = (k + 1) % c; } }
  for (const c of [225, 556, 441]) { const d = new Float32Array(c); let k = 0; for (let i = 0; i < n; i++) { const b = d[k], v = y[i] + b * -0.5; d[k] = v; y[i] = b + v * 0.5; k = (k + 1) % c; } }
  return gain(y, 0.08);
}
