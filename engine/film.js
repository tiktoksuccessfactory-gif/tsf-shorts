// Film runtime: turns an episode description into frames.
// An episode module exports build(ctx) and returns { duration, shots, flashes? }.
//   shot = { from, to, light, cam(t) -> {pos, look, fov?, roll?}, dof?(t) -> {focus | target, cInf}, update?(t, cam), fadeIn? (s) }
// Everything is a pure function of time, so any frame can be rendered on its own (and in parallel).
import * as THREE from 'three';
import { Post } from './post.js';
import { Stage } from './world.js';
import { Hud } from './hud.js';
import { setScreenHeight } from './actor.js';

// ---------- easing + camera helpers (all time-based)
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smoother = (u) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const easeOut = (u) => 1 - Math.pow(1 - clamp01(u), 3);
export const easeIn = (u) => Math.pow(clamp01(u), 3);
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const prog = (t, t0, d) => clamp01((t - t0) / d);

// keyframed camera: keys = [{t, pos, look, fov?, roll?}], glides between keys with smootherstep
export function keys(list) {
  return (t) => {
    let i = 0; while (i < list.length - 1 && t >= list[i + 1].t) i++;
    const a = list[i], b = list[Math.min(i + 1, list.length - 1)];
    const u = b.t > a.t ? smoother((t - a.t) / (b.t - a.t)) : 0;
    return { pos: lerp3(a.pos, b.pos, u), look: lerp3(a.look, b.look, u), fov: lerp(a.fov ?? 40, b.fov ?? 40, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
  };
}
// a slow push-in toward the look point (every hold creeps): rate = fraction of distance per second
export function creep(shotFn, t0, rate = 0.06) {
  return (t) => { const c = shotFn(t); const k = 1 - Math.min(0.5, (t - t0) * rate); c.pos = lerp3(c.look, c.pos, k); return c; };
}
// impact shakes: list of times; flips direction every frame, fades over ~0.25 s
export function shake(times, amp = 0.05, fps = 30) {
  return (t) => { let o = 0; for (const t0 of times) { const d = t - t0; if (d >= 0 && d < 0.25) { const f = Math.floor(d * fps); o += (f % 2 ? -1 : 1) * amp * (1 - d / 0.25); } } return o; };
}

// ---------- word timings (from words.json, made by scripts/words.py)
//   words.i(37)            start of word #37 (the numbers are in transcript.txt)
//   words.ie(37)           end of word #37
//   words.at('tank', 1)    start of the 2nd time "tank" is said
//   words.phrase('the tank burst')  start of that exact run of words
export class Words {
  constructor(list) { this.w = list || []; this.missing = []; }
  norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9']/g, ''); }
  i(k, def = 0) { const x = this.w[k]; return x ? x.s : def; }
  ie(k, def = 0) { const x = this.w[k]; return x ? x.e : def; }
  at(word, n = 0, def = 0) { const k = this.norm(word); let c = 0; for (const x of this.w) if (this.norm(x.w) === k) { if (c === n) return x.s; c++; } if (this.w.length) this.missing.push(word); return def; }
  end(word, n = 0, def = 0) { const k = this.norm(word); let c = 0; for (const x of this.w) if (this.norm(x.w) === k) { if (c === n) return x.e; c++; } return def; }
  phrase(text, n = 0, def = 0) {
    const q = String(text).split(/\s+/).map((x) => this.norm(x)).filter(Boolean); let c = 0;
    for (let k = 0; k + q.length <= this.w.length; k++) if (q.every((p, j) => this.norm(this.w[k + j].w) === p)) { if (c === n) return this.w[k].s; c++; }
    if (this.w.length) this.missing.push(text);
    return def;
  }
  get count() { return this.w.length; }
  get last() { return this.w.length ? this.w[this.w.length - 1].e : 0; }
}

// ---------- the film
export class Film {
  constructor(canvas, W, H, episode, words = []) {
    this.W = W; this.H = H; setScreenHeight(H);
    this.r = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.r.setPixelRatio(1); this.r.setSize(W, H, false);
    this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.r.outputColorSpace = THREE.LinearSRGBColorSpace; this.r.toneMapping = THREE.NoToneMapping;
    this.scene = new THREE.Scene();
    this.stage = new Stage(this.scene);
    this.cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 1500);
    this.post = new Post(this.r, W, H); this.post.sky = this.stage.sky;
    this.words = new Words(words);
    this.ep = episode.build({ THREE, stage: this.stage, words: this.words, film: this });
    this.ep.shots.sort((a, b) => a.from - b.from);
    this.hud = new Hud(W, H); this.hud.set(this.ep.hud);
    this.mixMat = new THREE.ShaderMaterial({ uniforms: { a: { value: null }, b: { value: null }, k: { value: 0 }, flash: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'uniform sampler2D a; uniform sampler2D b; uniform float k; uniform float flash; varying vec2 vUv; void main(){ vec3 c = mix(texture2D(a, vUv).rgb, texture2D(b, vUv).rgb, k); gl_FragColor = vec4(mix(c, vec3(1.0), flash), 1.0); }', depthTest: false, depthWrite: false });
    this.rtX = new THREE.WebGLRenderTarget(W, H); this.rtY = new THREE.WebGLRenderTarget(W, H);
  }
  get duration() { return this.ep.duration; }
  // sound plan for scripts/audio.mjs: music moods over time, sound effects at times, auto effects on flashes and cuts
  audioPlan() {
    const A = this.ep.audio || {};
    const sfx = (A.sfx || []).map((c) => Array.isArray(c) ? { t: c[0], name: c[1], ...(c[2] || {}) } : c);
    for (const f of this.ep.flashes || []) if (A.flashSfx !== null) sfx.push({ t: f - 0.02, name: A.flashSfx || 'hit', gain: 0.7 });
    if (A.cutSfx) for (const s of this.ep.shots.slice(1)) sfx.push({ t: s.from - 0.08, name: A.cutSfx, gain: 0.35 });
    return { duration: this.ep.duration, missingWords: [...new Set(this.words.missing)], captions: this.ep.captions || {}, voice: A.voice || 'voice.mp3', music: A.music || [{ at: 0, mood: 'quirky' }], musicGain: A.musicGain ?? 1, sfx: sfx.sort((a, b) => a.t - b.t) };
  }
  shotAt(t) { const S = this.ep.shots; let i = 0; for (let k = 0; k < S.length; k++) if (t >= S[k].from) i = k; return i; }
  renderShot(s, t, target) {
    const c = s.cam(t);
    this.cam.position.set(...c.pos); this.cam.up.set(0, 1, 0); this.cam.lookAt(...c.look);
    if (c.roll) this.cam.rotateZ((c.roll * Math.PI) / 180);
    if (s.shake) { const o = s.shake(t); this.cam.position.x += o; this.cam.position.y += o * 0.6; }
    this.cam.fov = c.fov || 40; this.cam.updateProjectionMatrix(); this.cam.updateMatrixWorld();
    const L = this.stage.setLight(s.light || 'day', this.cam, new THREE.Vector3(...c.look));
    if (s.update) s.update(t, this.cam);
    for (const a of this.stage.actors) if (a.g.visible) a.update(t, this.cam);
    for (const f of this.stage.fx) f.update(t, this.cam);
    const d = s.dof ? s.dof(t) : { cInf: 0 };
    let focus = d.focus;
    if (d.target) { const v = new THREE.Vector3(...d.target).sub(this.cam.position); const f = new THREE.Vector3(); this.cam.getWorldDirection(f); focus = v.dot(f); }
    Object.assign(this.post.look, { focus: focus || 5, cInf: d.cInf || 0, bloom: L.bloom, exposure: L.exposure * (s.exposure || 1), sat: L.sat, contrast: L.contrast ?? 1.04, vignette: L.vignette ?? 0.18, shadowTint: L.shadowTint, highTint: L.highTint, fog: L.fog });
    this.post.render(this.scene, this.cam, target);
  }
  renderFrame(frame, fps = 30) {
    const t = frame / fps;
    const S = this.ep.shots; const i = this.shotAt(t); const s = S[i];
    let flash = 0;
    for (const f of this.ep.flashes || []) { const d = t - f; if (d >= 0 && d < 0.14) flash = Math.max(flash, 1 - d / 0.14); }
    const fade = s.fadeIn || 0;
    if (fade > 0 && i > 0 && t - s.from < fade) {
      this.renderShot(S[i - 1], t, this.rtX); this.renderShot(s, t, this.rtY);
      this.mixMat.uniforms.a.value = this.rtX.texture; this.mixMat.uniforms.b.value = this.rtY.texture; this.mixMat.uniforms.k.value = smoother((t - s.from) / fade);
    } else {
      this.renderShot(s, t, this.rtX);
      this.mixMat.uniforms.a.value = this.rtX.texture; this.mixMat.uniforms.b.value = this.rtX.texture; this.mixMat.uniforms.k.value = 0;
    }
    this.mixMat.uniforms.flash.value = flash * 0.85;
    this.post.quad.material = this.mixMat; this.r.setRenderTarget(null); this.r.render(this.post.qs, this.post.qc);
    if (this.hud.update(t)) { this.r.autoClear = false; this.r.render(this.hud.scene, this.hud.cam); this.r.autoClear = true; }
  }
}
