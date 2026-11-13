// Builds the soundtrack: your voice-over + music that ducks under the voice + sound effects at their cues.
//   node scripts/audio.mjs <episode>   (reads out/<ep>/audio_plan.json written by render.mjs) -> out/<ep>/mix.wav
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { epDir, outDir, log, FFMPEG } from './common.mjs';
import { SR, len, rng, hp, norm } from './sound/dsp.mjs';
import { SFX, LEVEL } from './sound/sfx.mjs';
import { music } from './sound/music.mjs';

function decode(file) {
  return new Promise((res, rej) => {
    const p = spawn(FFMPEG, ['-loglevel', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = []; let err = '';
    p.stdout.on('data', (d) => chunks.push(d)); p.stderr.on('data', (d) => (err += d));
    p.on('close', (c) => { if (c !== 0) return rej(new Error('could not read ' + file + '\n' + err)); const b = Buffer.concat(chunks); res(new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4)).slice()); });
  });
}
function follow(x, att, rel) { // envelope follower
  const a = Math.exp(-1 / (att * SR)), b = Math.exp(-1 / (rel * SR)), y = new Float32Array(x.length); let e = 0;
  for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); e = v > e ? a * e + (1 - a) * v : b * e + (1 - b) * v; y[i] = e; }
  return y;
}
function writeWav(file, L, R) {
  const n = L.length, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4); b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4); }
  fs.writeFileSync(file, b);
}

export async function audio(ep) {
  const out = outDir(ep);
  const plan = JSON.parse(fs.readFileSync(path.join(out, 'audio_plan.json'), 'utf8'));
  const D = plan.duration, n = len(D);
  const L = new Float32Array(n), R = new Float32Array(n);
  // 1) voice: clean up the low rumble, even out the level
  let voice = null; const vf = path.join(epDir(ep), plan.voice || 'voice.mp3');
  if (fs.existsSync(vf)) {
    voice = hp(await decode(vf), 80);
    const e = follow(voice, 0.01, 0.15); let act = 0, cnt = 0; for (let i = 0; i < e.length; i += 64) if (e[i] > 0.02) { act += e[i]; cnt++; }
    const ref = cnt ? act / cnt : 0.1;
    for (let i = 0; i < voice.length; i++) { const lvl = e[i] / ref; const g = lvl > 1 ? Math.pow(lvl, -0.45) : 1; voice[i] *= g; } // gentle compression
    norm(voice, 0.85);
    if (voice.length / SR > D + 0.05) log(`NOTE: the voice is ${(voice.length / SR).toFixed(1)} s but the episode is ${D.toFixed(1)} s, the end of the voice is cut.`);
    for (let i = 0; i < Math.min(n, voice.length); i++) { L[i] += voice[i] * 0.78; R[i] += voice[i] * 0.78; }
  } else log('no voice file found (' + path.basename(vf) + '), making music and effects only');
  // 2) music sections, ducked under the voice
  const duck = new Float32Array(n).fill(1);
  if (voice) { const e = follow(voice, 0.02, 0.35); let pk = 1e-9; for (const v of e) pk = Math.max(pk, v); for (let i = 0; i < Math.min(n, e.length); i++) duck[i] = 1 - 0.6 * Math.min(1, e[i] / (pk * 0.35)); }
  const cues = (plan.music || []).slice().sort((a, b) => a.at - b.at);
  cues.forEach((c, i) => {
    if (!c.mood || c.mood === 'stop' || c.mood === 'none') return;
    const end = i + 1 < cues.length ? cues[i + 1].at : D;
    const dur = Math.max(0.1, end - c.at) + 0.25;
    const m = music(c.mood, dur, (c.seed ?? i) + 1);
    const g = 0.45 * (plan.musicGain ?? 1) * (c.gain ?? 1);
    const o = len(c.at), fadeIn = len(c.fadeIn ?? 0.03), fadeOut = len(0.25), last = i + 1 === cues.length;
    for (let k = 0; k < m.L.length; k++) {
      const j = o + k; if (j >= n) break;
      let f = Math.min(1, k / fadeIn) * Math.min(1, (m.L.length - k) / fadeOut);
      if (last) f *= Math.min(1, (n - j) / len(1.2));
      L[j] += m.L[k] * g * f * duck[j]; R[j] += m.R[k] * g * f * duck[j];
    }
  });
  // 3) effects
  let miss = new Set();
  plan.sfx.forEach((c, i) => {
    const fn = SFX[c.name]; if (!fn) { miss.add(c.name); return; }
    const x = fn(rng(i * 13 + 5), c.d); const g = (LEVEL[c.name] ?? 0.4) * (c.gain ?? 1) * 0.9;
    const r = rng(i + 99); const pan = c.pan ?? (r() - 0.5) * 0.3; const a = Math.cos((pan + 1) * Math.PI / 4) * 1.41, b = Math.sin((pan + 1) * Math.PI / 4) * 1.41;
    const o = len(Math.max(0, c.t));
    for (let k = 0; k < x.length; k++) { const j = o + k; if (j >= n) break; L[j] += x[k] * g * a * 0.7; R[j] += x[k] * g * b * 0.7; }
  });
  if (miss.size) log('unknown sound effects skipped: ' + [...miss].join(', '));
  // 4) soft limiter
  for (let i = 0; i < n; i++) { for (const B of [L, R]) { const v = B[i], a = Math.abs(v); if (a > 0.8) B[i] = Math.sign(v) * (0.8 + 0.18 * Math.tanh((a - 0.8) / 0.18)); } }
  const file = path.join(out, 'mix.wav'); writeWav(file, L, R);
  log(`sound done -> out/${ep}/mix.wav (${plan.sfx.length} effects, ${cues.length} music cues)`);
  return file;
}

if (process.argv[1] && path.basename(process.argv[1]) === 'audio.mjs') {
  const ep = process.argv[2]; if (!ep) { console.log('usage: node scripts/audio.mjs <episode>'); process.exit(1); }
  audio(ep).catch((e) => { console.error(e.message || e); process.exit(1); });
}
