// TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
// TSF post chain (own implementation):
//   1) world normals + depth (cards excluded)      -> rtN
//   2) full colour HDR + depth (MSAA)              -> rtC
//   3) ink + fog tint + depth-of-field + bloom + tone map + grade -> screen
// All pixel sizes are given for 1080x1920 and scale with the output height.
import * as THREE from 'three';

export const LAYER_WORLD = 0;   // everything that gets ink lines
export const LAYER_CARD = 1;    // character cards, sprites, sky: no world ink

const FSQ_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const LINEAR_DEPTH = `
float linDepth(sampler2D d, vec2 uv){ float z = texture2D(d, uv).x; float ndc = z * 2.0 - 1.0; return (2.0 * cNear * cFar) / (cFar + cNear - ndc * (cFar - cNear)); }`;

const INK_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tCol; uniform sampler2D tNrm; uniform sampler2D tNrmDepth;
uniform vec2 res; uniform float cNear; uniform float cFar; uniform float k;     // k = height/1920
uniform vec3 inkCol; uniform float inkNear; uniform float inkFar; uniform float inkOn;
uniform vec3 fogCol; uniform float fogInk;
${LINEAR_DEPTH}
void main(){
  vec4 col = texture2D(tCol, vUv);
  vec4 nC = texture2D(tNrm, vUv);
  float dW = linDepth(tNrmDepth, vUv);
  float ink = 0.0;
  if (inkOn > 0.5 && nC.a > 0.5 && dW < cFar * 0.98) {
    float w = mix(inkNear, inkFar, clamp((dW - 6.0) / 84.0, 0.0, 1.0)) * k;   // px
    vec2 px = w / res;
    vec3 n0 = nC.xyz * 2.0 - 1.0;
    float edge = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7853982;
      vec2 o = vec2(cos(a), sin(a)) * px * 0.5;
      float dn = linDepth(tNrmDepth, vUv + o);
      vec4 sn = texture2D(tNrm, vUv + o);
      vec3 nn = sn.xyz * 2.0 - 1.0;
      float dz = (dn - dW) / dW;                                   // relative depth jump (only nearer side draws)
      edge = max(edge, smoothstep(0.035, 0.07, dz) * step(0.5, sn.a + step(cFar * 0.98, dn)));
      edge = max(edge, smoothstep(0.82, 0.70, dot(n0, nn)) * step(dW, dn + dW * 0.02) * step(0.5, sn.a));
    }
    ink = edge;
  }
  float fogK = clamp((dW - 40.0) / 220.0, 0.0, 1.0) * fogInk;
  vec3 ic = mix(inkCol, fogCol * 0.55, fogK);
  gl_FragColor = vec4(mix(col.rgb, ic, ink * (1.0 - fogK * 0.6)), 1.0);
}`;

const DOF_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tIn; uniform sampler2D tDepth; uniform vec2 res; uniform float cNear; uniform float cFar;
uniform float focus; uniform float cInf; uniform float maxCoc; uniform float k;
${LINEAR_DEPTH}
float coc(float d){ return clamp(cInf * k * abs(1.0 - focus / max(d, 0.01)), 0.0, maxCoc * k); }
void main(){
  float d0 = linDepth(tDepth, vUv);
  float c0 = coc(d0);
  vec3 acc = texture2D(tIn, vUv).rgb; float wsum = 1.0;
  if (cInf > 0.01) {
    const int N = 40;
    for (int i = 1; i < N; i++) {
      float fi = float(i);
      float r = sqrt(fi / float(N));
      float a = fi * 2.39996323;
      vec2 off = vec2(cos(a), sin(a)) * r;
      float cMax = maxCoc * k;
      vec2 uv = vUv + off * cMax / res;
      float ds = linDepth(tDepth, uv);
      float cs = coc(ds);
      float dist = r * cMax;
      // a sample counts if its own blur reaches us; background never bleeds onto a sharper foreground
      float reach = smoothstep(dist - 1.0, dist + 1.0, cs);
      float behind = ds > d0 + 0.05 ? smoothstep(dist - 1.0, dist + 1.0, c0) : 1.0;
      float w = reach * behind;
      acc += texture2D(tIn, uv).rgb * w; wsum += w;
    }
  }
  gl_FragColor = vec4(acc / wsum, 1.0);
}`;

const BRIGHT_FRAG = `
precision highp float; varying vec2 vUv; uniform sampler2D tIn; uniform float thr;
void main(){ vec3 c = texture2D(tIn, vUv).rgb; float l = max(max(c.r, c.g), c.b); gl_FragColor = vec4(c * smoothstep(thr, thr + 0.4, l), 1.0); }`;
const BLUR_FRAG = `
precision highp float; varying vec2 vUv; uniform sampler2D tIn; uniform vec2 dir;
void main(){ vec3 s = texture2D(tIn, vUv).rgb * 0.227;
  s += (texture2D(tIn, vUv + dir * 1.385).rgb + texture2D(tIn, vUv - dir * 1.385).rgb) * 0.316;
  s += (texture2D(tIn, vUv + dir * 3.231).rgb + texture2D(tIn, vUv - dir * 3.231).rgb) * 0.070;
  gl_FragColor = vec4(s, 1.0); }`;

const FINAL_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tIn; uniform sampler2D tBloom; uniform float bloom;
uniform float exposure; uniform float sat; uniform float contrast;
uniform vec3 shadowTint; uniform vec3 highTint; uniform float vignette; uniform float lift;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main(){
  vec3 c = texture2D(tIn, vUv).rgb + texture2D(tBloom, vUv).rgb * bloom;
  c = aces(c * exposure);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, sat);
  c = (c - 0.5) * contrast + 0.5;
  c += shadowTint * (1.0 - smoothstep(0.0, 0.55, l)) + highTint * smoothstep(0.45, 1.0, l);
  c = c * (1.0 - lift) + lift;
  vec2 p = vUv - 0.5; p.x *= 0.62;
  c *= 1.0 - vignette * smoothstep(0.3, 0.8, length(p));
  c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
  gl_FragColor = vec4(c, 1.0);
}`;

function mat(frag, uniforms) {
  return new THREE.ShaderMaterial({ vertexShader: FSQ_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
}

export class Post {
  constructor(renderer, w, h) {
    this.r = renderer; this.w = w; this.h = h;
    const mk = (opts = {}) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, ...opts });
    this.rtC = mk({ samples: 4 });
    this.rtN = mk({ type: THREE.UnsignedByteType, depthTexture: new THREE.DepthTexture(w, h) });
    this.rtA = mk(); this.rtB = mk();
    const bw = Math.max(2, w >> 2), bh = Math.max(2, h >> 2);
    this.rtBl1 = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType });
    this.rtBl2 = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType });
    this.nrmMat = new THREE.MeshNormalMaterial();
    this.worldLayers = new THREE.Layers(); this.worldLayers.set(LAYER_WORLD);
    this.cardMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { map: { value: null } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ if (texture2D(map, vUv).a < 0.5) discard; gl_FragColor = vec4(0.5, 0.5, 1.0, 0.0); }' });
    this.sky = null;
    const res = new THREE.Vector2(w, h), k = h / 1920;
    this.ink = mat(INK_FRAG, { tCol: { value: null }, tNrm: { value: null }, tNrmDepth: { value: null }, res: { value: res }, cNear: { value: 0.1 }, cFar: { value: 1000 }, k: { value: k },
      inkCol: { value: new THREE.Color('#0b0b0b') }, inkNear: { value: 6.0 }, inkFar: { value: 3.6 }, inkOn: { value: 1 }, fogCol: { value: new THREE.Color('#b8d0ec') }, fogInk: { value: 1 } });
    this.dof = mat(DOF_FRAG, { tIn: { value: null }, tDepth: { value: null }, res: { value: res }, cNear: { value: 0.1 }, cFar: { value: 1000 }, focus: { value: 5 }, cInf: { value: 0 }, maxCoc: { value: 18 }, k: { value: k } });
    this.bright = mat(BRIGHT_FRAG, { tIn: { value: null }, thr: { value: 1.0 } });
    this.blur = mat(BLUR_FRAG, { tIn: { value: null }, dir: { value: new THREE.Vector2() } });
    this.final = mat(FINAL_FRAG, { tIn: { value: null }, tBloom: { value: null }, bloom: { value: 0.5 }, exposure: { value: 1.0 }, sat: { value: 1.08 }, contrast: { value: 1.04 },
      shadowTint: { value: new THREE.Vector3(-0.01, 0.0, 0.03) }, highTint: { value: new THREE.Vector3(0.02, 0.01, -0.01) }, vignette: { value: 0.18 }, lift: { value: 0.02 } });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.qs = new THREE.Scene(); this.qs.add(this.quad); this.qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.look = { focus: 5, cInf: 0, ink: true, bloom: 0.5, exposure: 1.0, sat: 1.08, contrast: 1.04, vignette: 0.18, fog: '#b8d0ec' };
  }
  pass(m, target) { this.quad.material = m; this.r.setRenderTarget(target); this.r.render(this.qs, this.qc); }
  render(scene, cam, target = null) {
    const r = this.r, L = this.look;
    const bg = scene.background, fog = scene.fog;
    // 1) normals + depth: world gets its normal (alpha 1), cards a masked marker (alpha 0), sky skipped
    const swapped = [], hidden = [];
    scene.traverse((o) => {
      if (!o.visible) return;
      if (o.isSprite || o.isPoints || o.isLine) { hidden.push(o); o.visible = false; return; }  // particles, clouds: no outline
      if (!o.isMesh) return;
      if (o.layers.test(this.worldLayers)) { swapped.push([o, o.material]); o.material = this.nrmMat; }
      else if (o.userData.card) { swapped.push([o, o.material]); this.cardMat.uniforms.map.value = o.material.map; o.material = o.userData.maskMat || (o.userData.maskMat = this.cardMat.clone()); o.material.uniforms.map.value = swapped[swapped.length - 1][1].map; }
      else { hidden.push(o); o.visible = false; }  // contact shadows and other helpers on the card layer
    });
    cam.layers.set(LAYER_WORLD); cam.layers.enable(LAYER_CARD);
    this.sky && (this.sky.visible = false);
    scene.background = null; scene.fog = null;
    r.setClearColor(0x000000, 0); r.setRenderTarget(this.rtN); r.clear(); r.render(scene, cam);
    for (const [o, m] of swapped) o.material = m;
    for (const o of hidden) o.visible = true;
    scene.background = bg; scene.fog = fog; this.sky && (this.sky.visible = true);
    // 2) colour
    r.setRenderTarget(this.rtC); r.clear(); r.render(scene, cam);
    // 3) ink
    const near = cam.near, far = cam.far;
    Object.assign(this.ink.uniforms, {}); const u = this.ink.uniforms;
    u.tCol.value = this.rtC.texture; u.tNrm.value = this.rtN.texture; u.tNrmDepth.value = this.rtN.depthTexture;
    u.cNear.value = near; u.cFar.value = far; u.inkOn.value = L.ink ? 1 : 0; u.fogCol.value.set(L.fog);
    this.pass(this.ink, this.rtA);
    // 4) depth of field
    const d = this.dof.uniforms; d.tIn.value = this.rtA.texture; d.tDepth.value = this.rtN.depthTexture; d.cNear.value = near; d.cFar.value = far; d.focus.value = L.focus; d.cInf.value = L.cInf;
    let src = this.rtA;
    if (L.cInf > 0.01) { this.pass(this.dof, this.rtB); src = this.rtB; }
    // 5) bloom
    this.bright.uniforms.tIn.value = src.texture; this.pass(this.bright, this.rtBl1);
    for (let i = 0; i < 3; i++) {
      this.blur.uniforms.tIn.value = this.rtBl1.texture; this.blur.uniforms.dir.value.set((1 + i) / this.rtBl1.width, 0); this.pass(this.blur, this.rtBl2);
      this.blur.uniforms.tIn.value = this.rtBl2.texture; this.blur.uniforms.dir.value.set(0, (1 + i) / this.rtBl1.height); this.pass(this.blur, this.rtBl1);
    }
    // 6) tone map + grade
    const f = this.final.uniforms; f.tIn.value = src.texture; f.tBloom.value = this.rtBl1.texture; f.bloom.value = L.bloom; f.exposure.value = L.exposure; f.sat.value = L.sat; f.contrast.value = L.contrast; f.vignette.value = L.vignette;
    if (L.shadowTint) f.shadowTint.value.set(...L.shadowTint); if (L.highTint) f.highTint.value.set(...L.highTint);
    this.pass(this.final, target);
  }
}
